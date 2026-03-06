import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db.js";
import type { ApiKey, Organization } from "./db.js";
import type { ParseResult } from "@parseflow/types";

if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY required");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PARSE_SYSTEM_PROMPT = `You are a document parser. Extract structured data from invoices, receipts, and financial documents.
Return ONLY valid JSON with no markdown, no explanation — just the JSON object.

Required fields (null if not found):
- document_type: "invoice" | "receipt" | "contract" | "other"
- vendor: string | null
- vendor_address: string | null
- invoice_number: string | null
- date: ISO 8601 string | null (YYYY-MM-DD)
- due_date: ISO 8601 string | null
- total: number | null
- subtotal: number | null
- tax: number | null
- currency: ISO 4217 string | null (e.g. "USD", "EUR")
- line_items: array of { description: string, quantity: number | null, unit_price: number | null, amount: number } | null
- confidence: number between 0 and 1 representing extraction confidence`;

export async function parseDocument(
  fileBuffer: ArrayBuffer,
  mimeType: string,
  options: { include_raw_text?: boolean; language?: string } = {}
): Promise<ParseResult> {
  const startMs = Date.now();
  const base64 = Buffer.from(fileBuffer).toString("base64");

  // For PDFs, extract text first since Claude can handle images directly
  // For images (JPEG/PNG), send directly as vision
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  if (!isImage && !isPdf) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const userContent: Anthropic.MessageParam["content"] = isImage
    ? [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: base64,
          },
        },
        { type: "text", text: "Extract all structured data from this document." },
      ]
    : [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        } as any,
        { type: "text", text: "Extract all structured data from this document." },
      ];

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: PARSE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const processingMs = Date.now() - startMs;
  const rawText = response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON from response
  let extracted: any = {};
  try {
    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/^```json?\n?/m, "").replace(/```$/m, "").trim();
    extracted = JSON.parse(cleaned);
  } catch {
    // Partial extraction fallback
    extracted = { document_type: "other", confidence: 0.1 };
  }

  const result: ParseResult = {
    id: crypto.randomUUID(),
    status: extracted.confidence > 0.5 ? "success" : extracted.confidence > 0.2 ? "partial" : "failed",
    document_type: extracted.document_type ?? "other",
    vendor: extracted.vendor ?? undefined,
    vendor_address: extracted.vendor_address ?? undefined,
    invoice_number: extracted.invoice_number ?? undefined,
    date: extracted.date ?? undefined,
    due_date: extracted.due_date ?? undefined,
    total: extracted.total ?? undefined,
    subtotal: extracted.subtotal ?? undefined,
    tax: extracted.tax ?? undefined,
    currency: extracted.currency ?? undefined,
    line_items: extracted.line_items ?? undefined,
    raw_text: options.include_raw_text ? rawText : undefined,
    confidence: extracted.confidence ?? 0.5,
    processing_ms: processingMs,
    model_used: "claude-haiku-4-5-20251001",
  };

  return result;
}

export async function logParse(
  apiKey: ApiKey,
  org: Organization,
  result: ParseResult,
  fileSizeBytes: number,
  errorMessage?: string
) {
  // Increment usage counter
  await db
    .from("pf_api_keys")
    .update({
      parses_used: apiKey.parses_used + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", apiKey.id);

  // Log the parse
  await db.from("pf_parse_logs").insert({
    api_key_id: apiKey.id,
    organization_id: org.id,
    status: result.status,
    document_type: result.document_type,
    processing_ms: result.processing_ms,
    model_used: result.model_used,
    confidence: result.confidence,
    file_size_bytes: fileSizeBytes,
    error_message: errorMessage ?? null,
  });
}
