import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { createHash, randomBytes } from "crypto";
import { db } from "./db.js";
import { apiKeyAuth, type AuthVariables } from "./auth.js";
import { parseDocument, logParse } from "./parse.js";

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

app.notFound((c) => {
  return c.json({ error: "not found" }, 404);
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "internal server error" }, 500);
});
