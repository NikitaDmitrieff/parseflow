import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { createHash, randomBytes } from "crypto";
import { db } from "./db.js";
import { apiKeyAuth, type AuthVariables } from "./auth.js";
import { parseDocument, logParse } from "./parse.js";
import { stripe, PLANS, createCheckoutSession, handleCheckoutComplete, type PlanKey } from "./stripe.js";
import openapiSpecJson from "./openapi.json";

const openapiSpec: object = openapiSpecJson;

export const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/openapi.json", (c) => {
  return c.json(openapiSpec);
});

app.post("/v1/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.name) {
    return c.json({ error: "name required", code: "VALIDATION_ERROR" }, 400);
  }

  const { data: orgs, error: orgError } = await db
    .from("pf_organizations")
    .insert({ name: body.name, plan: "free", parses_quota: 50 })
    .select();

  if (orgError || !orgs?.length) {
    console.error("org create error:", orgError);
    return c.json({ error: "failed to create organization", code: "DB_ERROR" }, 500);
  }
  const org = orgs[0];

  const rawKey = `pf_live_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.substring(0, 12);

  const { error: keyError } = await db.from("pf_api_keys").insert({
    organization_id: org.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name: "default",
  });

  if (keyError) {
    console.error("key create error:", keyError);
    return c.json({ error: "failed to create api key", code: "DB_ERROR" }, 500);
  }

  return c.json({
    organization_id: org.id,
    api_key: rawKey,
    plan: "free",
    parses_quota: 50,
    warning: "Save this key — it will not be shown again.",
  }, 201);
});

app.post("/v1/parse", apiKeyAuth, async (c) => {
  const apiKey = c.get("apiKey");
  const org = c.get("org");

  const contentType = c.req.header("Content-Type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return c.json({
      error: "Content-Type must be multipart/form-data",
      code: "INVALID_CONTENT_TYPE",
    }, 400);
  }

  const formData = await c.req.formData().catch(() => null);
  if (!formData) {
    return c.json({ error: "invalid form data", code: "PARSE_ERROR" }, 400);
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return c.json({ error: "file field required", code: "MISSING_FILE" }, 400);
  }

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  const mimeType = file.type || "application/octet-stream";
  if (!allowedTypes.includes(mimeType)) {
    return c.json({
      error: `unsupported file type: ${mimeType}`,
      code: "UNSUPPORTED_FILE_TYPE",
      allowed: allowedTypes,
    }, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: "file too large (max 10MB)", code: "FILE_TOO_LARGE" }, 400);
  }

  const includeRawText = formData.get("include_raw_text") === "true";
  const buffer = await file.arrayBuffer();

  try {
    const result = await parseDocument(buffer, mimeType, { include_raw_text: includeRawText });
    await logParse(apiKey, org, result, file.size);
    return c.json(result, 200);
  } catch (err: any) {
    const errMsg = err?.message ?? "parse failed";
    console.error("parse error:", err);
    await logParse(
      apiKey,
      org,
      {
        id: crypto.randomUUID(),
        status: "failed",
        document_type: "other",
        confidence: 0,
        processing_ms: 0,
        model_used: "unknown",
      },
      file.size,
      errMsg
    );
    return c.json({ error: errMsg, code: "PARSE_FAILED" }, 500);
  }
});

app.get("/v1/usage", apiKeyAuth, async (c) => {
  const apiKey = c.get("apiKey");
  const org = c.get("org");

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const { count } = await db
    .from("pf_parse_logs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", org.id)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  return c.json({
    api_key_id: apiKey.id,
    api_key_prefix: apiKey.key_prefix,
    organization_id: org.id,
    plan: org.plan,
    parses_used: count ?? 0,
    parses_quota: org.parses_quota,
    parses_remaining: Math.max(0, org.parses_quota - (count ?? 0)),
    period_start: periodStart,
    period_end: periodEnd,
  });
});

// ─── Stripe: create checkout session ────────────────────────────────────────
// POST /v1/checkout  { plan: "pro" | "scale" }  (requires API key auth)
app.post("/v1/checkout", apiKeyAuth, async (c) => {
  if (!stripe) {
    return c.json({ error: "payments not enabled", code: "STRIPE_NOT_CONFIGURED" }, 503);
  }

  const body = await c.req.json().catch(() => null);
  const plan = body?.plan as PlanKey | undefined;

  if (!plan || !PLANS[plan]) {
    return c.json({
      error: "plan required: 'pro' or 'scale'",
      code: "VALIDATION_ERROR",
      available_plans: Object.fromEntries(
        Object.entries(PLANS).map(([k, v]) => [k, v.label])
      ),
    }, 400);
  }

  const org = c.get("org");
  const dashboardBase = process.env.DASHBOARD_URL ?? "https://parseflow-dashboard.vercel.app";

  try {
    const url = await createCheckoutSession(
      org.id,
      plan,
      `${dashboardBase}/upgrade/success`,
      `${dashboardBase}/upgrade/cancel`
    );
    return c.json({ checkout_url: url }, 200);
  } catch (err: any) {
    console.error("checkout error:", err);
    return c.json({ error: err.message ?? "checkout failed", code: "STRIPE_ERROR" }, 500);
  }
});

// ─── Stripe: webhook ─────────────────────────────────────────────────────────
// POST /v1/webhooks/stripe  (no API key auth — verified by Stripe signature)
app.post("/v1/webhooks/stripe", async (c) => {
  if (!stripe) {
    return c.json({ error: "stripe not configured" }, 503);
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return c.json({ error: "webhook secret not configured" }, 500);
  }

  const sig = c.req.header("stripe-signature");
  if (!sig) {
    return c.json({ error: "missing stripe-signature header" }, 400);
  }

  const rawBody = await c.req.arrayBuffer();
  let event: import("stripe").Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(rawBody), sig, webhookSecret);
  } catch (err: any) {
    console.error("stripe webhook signature failed:", err.message);
    return c.json({ error: `webhook error: ${err.message}` }, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    try {
      await handleCheckoutComplete(session);
    } catch (err: any) {
      console.error("handleCheckoutComplete error:", err);
      return c.json({ error: "failed to update plan" }, 500);
    }
  }

  return c.json({ received: true });
});

app.notFound((c) => {
  return c.json({ error: "not found" }, 404);
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "internal server error" }, 500);
});
