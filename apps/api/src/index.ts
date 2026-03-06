import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

const app = new Hono();

// Middleware
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

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Parse endpoint — AI-powered document/invoice parsing
app.post("/v1/parse", async (c) => {
  // TODO: Implement authentication middleware (API key check against Supabase)
  // TODO: Accept multipart/form-data with PDF/image file
  // TODO: Extract text via pdfjs-dist or image processing
  // TODO: Send to Claude claude-haiku-4-5-20251001 with structured extraction prompt
  // TODO: Return structured JSON (vendor, amount, date, line items, etc.)
  // TODO: Deduct from usage quota, log to Supabase

  return c.json(
    {
      message: "coming soon",
      docs: "https://parseflow.dev/docs",
    },
    202
  );
});

// Usage stats for authenticated API key
app.get("/v1/usage", async (c) => {
  // TODO: Authenticate API key
  // TODO: Query Supabase for parse_logs grouped by day
  // TODO: Return quota used, quota remaining, billing period

  return c.json(
    {
      message: "coming soon",
      docs: "https://parseflow.dev/docs",
    },
    202
  );
});

// 404 fallback
app.notFound((c) => {
  return c.json({ error: "not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "internal server error" }, 500);
});

const port = parseInt(process.env.PORT ?? "3001", 10);

console.log(`ParseFlow API running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
