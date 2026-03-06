import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app } from "../src/app.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const body = req.method !== "GET" && req.method !== "HEAD"
    ? await new Promise<Buffer>((resolve) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      })
    : undefined;

  const request = new Request(url.toString(), {
    method: req.method ?? "GET",
    headers: req.headers as HeadersInit,
    body: body?.length ? body : undefined,
  });

  const response = await app.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const buffer = await response.arrayBuffer();
  res.end(Buffer.from(buffer));
}
