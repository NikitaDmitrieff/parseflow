import { createMiddleware } from "hono/factory";
import { createHash } from "crypto";
import { db, type ApiKey, type Organization } from "./db.js";

// In-process cache: hash -> { apiKey, org, expiresAt }
const cache = new Map<string, { apiKey: ApiKey; org: Organization; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

async function lookupApiKey(raw: string): Promise<{ apiKey: ApiKey; org: Organization } | null> {
  const hash = createHash("sha256").update(raw).digest("hex");
  const cached = cache.get(hash);
  if (cached && cached.expiresAt > Date.now()) {
    return { apiKey: cached.apiKey, org: cached.org };
  }

  const { data: keys, error } = await db
    .from("pf_api_keys")
    .select("*")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .limit(1);

  if (error || !keys || keys.length === 0) return null;

  const apiKey = keys[0] as ApiKey;
  const { data: orgs, error: orgError } = await db
    .from("pf_organizations")
    .select("*")
    .eq("id", apiKey.organization_id)
    .limit(1);

  if (orgError || !orgs || orgs.length === 0) return null;
  const org = orgs[0] as Organization;

  cache.set(hash, { apiKey, org, expiresAt: Date.now() + CACHE_TTL_MS });
  return { apiKey, org };
}

export type AuthVariables = {
  apiKey: ApiKey;
  org: Organization;
};

export const apiKeyAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const raw =
    c.req.header("X-API-Key") ??
    c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!raw) {
    return c.json({ error: "missing api key", code: "MISSING_API_KEY", docs: "https://parseflow.dev/docs/auth" }, 401);
  }

  const result = await lookupApiKey(raw);
  if (!result) {
    return c.json({ error: "invalid api key", code: "INVALID_API_KEY", docs: "https://parseflow.dev/docs/auth" }, 401);
  }

  const { apiKey, org } = result;

  // Quota check
  if (apiKey.parses_used >= org.parses_quota) {
    return c.json({
      error: "quota exceeded",
      code: "QUOTA_EXCEEDED",
      used: apiKey.parses_used,
      quota: org.parses_quota,
      plan: org.plan,
      docs: "https://parseflow.dev/docs/pricing",
    }, 429);
  }

  c.set("apiKey", apiKey);
  c.set("org", org);
  await next();
});

// Invalidate cache for a given raw key (call after key rotation)
export function invalidateCache(raw: string) {
  const hash = createHash("sha256").update(raw).digest("hex");
  cache.delete(hash);
}
