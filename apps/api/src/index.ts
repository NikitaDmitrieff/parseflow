import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = parseInt(process.env.PORT ?? "3001", 10);
console.log(`ParseFlow API running on port ${port}`);
serve({ fetch: app.fetch, port });
