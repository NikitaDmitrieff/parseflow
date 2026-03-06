import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db.js";
import type { ApiKey, Organization } from "./db.js";

interface LineItem {
  description: string;
  quantity?: number;
  unit_price?: number;
  amount: number;
}

interface ParseResult {
  id: string;
  status: "success" | "partial" | "failed";
  document_type: "invoice" | "receipt" | "contract" | "other";
  vendor?: string;
  vendor_address?: string;
  invoice_number?: string;
  date?: string;
  due_date?: string;
  total?: number;
  subtotal?: number;
  tax?: number;
  currency?: string;
  line_items?: LineItem[];
  raw_text?: string;
  confidence: number;
  processing_ms: number;
  model_used: string;
}

// ─── Anthropic (AI) path ────────────────────────────────────────────────────

let _anthropic: Anthropic | null = null;

function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

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

async function parseWithAI(
  fileBuffer: ArrayBuffer,
  mimeType: string,
  options: { include_raw_text?: boolean } = {}
): Promise<ParseResult> {
  const anthropic = getAnthropic()!;
  const startMs = Date.now();
  const base64 = Buffer.from(fileBuffer).toString("base64");

  const isImage = mimeType.startsWith("image/");
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

  let extracted: any = {};
  try {
    const cleaned = rawText.replace(/^```json?\n?/m, "").replace(/```$/m, "").trim();
    extracted = JSON.parse(cleaned);
  } catch {
    extracted = { document_type: "other", confidence: 0.1 };
  }

  return {
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
}

// ─── Rule-based fallback parser ─────────────────────────────────────────────

function extractTextFromPDFBytes(buffer: ArrayBuffer): string {
  // Extract text from raw PDF bytes using regex patterns.
  // Handles text operators: (text) Tj, [(text)] TJ, and UTF-16 BOM strings.
  const raw = Buffer.from(buffer).toString("binary");
  const parts: string[] = [];

  // Unescape PDF string escape sequences
  function unescape(s: string): string {
    return s
      .replace(/\\n/g, " ")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\");
  }

  // Match literal string operators: (text) Tj | (text) T*
  const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|T\*|'|")/g;
  let m: RegExpExecArray | null;
  while ((m = tjRe.exec(raw)) !== null) {
    const text = unescape(m[1]).trim();
    if (text.length > 0 && /[\x20-\x7E]/.test(text)) {
      parts.push(text);
    }
  }

  // Match array text operators: [(text)] TJ
  const tjArrRe = /\[([^\]]+)\]\s*TJ/g;
  while ((m = tjArrRe.exec(raw)) !== null) {
    const inner = m[1];
    const strRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
    let sm: RegExpExecArray | null;
    const words: string[] = [];
    while ((sm = strRe.exec(inner)) !== null) {
      const text = unescape(sm[1]).trim();
      if (text.length > 0 && /[\x20-\x7E]/.test(text)) {
        words.push(text);
      }
    }
    if (words.length) parts.push(words.join(" "));
  }

  return parts.join("\n");
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const text = extractTextFromPDFBytes(buffer);
  if (!text || text.trim().length < 10) {
    throw new Error("Could not extract readable text from PDF");
  }
  return text;
}

function parseNumber(str: string): number | undefined {
  const cleaned = str.replace(/[,$\s€£]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : n;
}

function parseDate(str: string): string | undefined {
  // Try common date formats
  const cleaned = str.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // MM/DD/YYYY or DD/MM/YYYY
  const mdy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) {
    const [, a, b, y] = mdy;
    // Assume MM/DD/YYYY if ambiguous
    const month = parseInt(a) <= 12 ? a.padStart(2, "0") : b.padStart(2, "0");
    const day = parseInt(a) <= 12 ? b.padStart(2, "0") : a.padStart(2, "0");
    return `${y}-${month}-${day}`;
  }

  // "Jan 1, 2024" or "January 1, 2024"
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const wordy = cleaned.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (wordy) {
    const [, mon, day, year] = wordy;
    const m = months[mon.toLowerCase().slice(0, 3)];
    if (m) return `${year}-${m}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function parseWithRulesFallback(text: string, includeRawText: boolean): ParseResult {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);

  // ── Invoice number ──
  const invMatch = text.match(
    /(?:invoice\s*(?:no|num|number|#)|inv\s*#?)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{2,20})/i
  );
  const invoiceNumber = invMatch?.[1];

  // ── Dates ──
  const dateMatch = text.match(
    /(?:invoice\s*date|date\s*issued|bill\s*date|date)\s*[:\-]?\s*([\w\s,\/\-]{6,20})/i
  );
  const date = dateMatch ? parseDate(dateMatch[1]) : undefined;

  const dueDateMatch = text.match(
    /(?:due\s*date|payment\s*due|pay\s*by)\s*[:\-]?\s*([\w\s,\/\-]{6,20})/i
  );
  const dueDate = dueDateMatch ? parseDate(dueDateMatch[1]) : undefined;

  // ── Monetary values ──
  // Match specific "total due/amount" patterns first, avoid matching "subtotal"
  const totalMatch = text.match(
    /(?:total\s*(?:amount|due|payable)|amount\s*due|balance\s*due|grand\s*total)\s*[:\-]?\s*[$€£]?\s*([\d,]+\.?\d{0,2})/i
  ) ?? text.match(
    /(?<!\bsub)\btotal\b\s*[:\-]?\s*[$€£]?\s*([\d,]+\.?\d{0,2})/i
  );
  const total = totalMatch ? parseNumber(totalMatch[1]) : undefined;

  const subtotalMatch = text.match(
    /(?:subtotal|sub\s*total|net\s*amount)\s*[:\-]?\s*[$€£]?\s*([\d,]+\.?\d{0,2})/i
  );
  const subtotal = subtotalMatch ? parseNumber(subtotalMatch[1]) : undefined;

  const taxMatch = text.match(
    /(?:tax|vat|gst|hst|sales\s*tax)\s*(?:\(\d+%\))?\s*[:\-]?\s*[$€£]?\s*([\d,]+\.?\d{0,2})/i
  );
  const tax = taxMatch ? parseNumber(taxMatch[1]) : undefined;

  // ── Currency ──
  const currencyMap: Record<string, string> = {
    "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "₹": "INR",
    "usd": "USD", "eur": "EUR", "gbp": "GBP", "cad": "CAD", "aud": "AUD",
  };
  let currency: string | undefined;
  const symMatch = text.match(/[$€£¥₹]/);
  if (symMatch) currency = currencyMap[symMatch[0]];
  const isoMatch = text.match(/\b(USD|EUR|GBP|CAD|AUD|CHF|JPY|INR|MXN|BRL)\b/i);
  if (isoMatch) currency = isoMatch[1].toUpperCase();

  // ── Vendor ──
  // First try explicit "Vendor:" / "From:" / "Bill From:" labels
  const vendorLabelMatch = text.match(
    /(?:vendor|from|bill\s*from|company|billed?\s*(?:by|from))\s*[:\-]\s*(.{2,60})/i
  );
  let vendor: string | undefined = vendorLabelMatch
    ? vendorLabelMatch[1].trim().split("\n")[0].trim()
    : undefined;

  // Fallback: first line that looks like an org name (no digits leading, no key-value)
  if (!vendor) {
    for (const line of lines.slice(0, 15)) {
      if (
        line.length > 2 &&
        line.length < 60 &&
        !/^\d/.test(line) &&
        !/invoice|bill|receipt|date|due|total|subtotal|tax|currency|qty|quantity|amount|page|ref/i.test(line) &&
        !/^[A-Za-z ]+\s*:\s/.test(line) // skip "Key: Value" formatted lines
      ) {
        vendor = line;
        break;
      }
    }
  }

  // ── Document type ──
  let document_type: ParseResult["document_type"] = "other";
  if (/\binvoice\b/i.test(text)) document_type = "invoice";
  else if (/\breceipt\b/i.test(text)) document_type = "receipt";
  else if (/\bcontract\b/i.test(text)) document_type = "contract";

  // ── Confidence: count how many key fields we extracted ──
  const extractedCount = [invoiceNumber, date, total, vendor, currency].filter(Boolean).length;
  const confidence = Math.min(0.9, 0.1 + extractedCount * 0.15);

  return {
    id: crypto.randomUUID(),
    status: confidence > 0.5 ? "success" : confidence > 0.2 ? "partial" : "failed",
    document_type,
    vendor,
    invoice_number: invoiceNumber,
    date,
    due_date: dueDate,
    total,
    subtotal,
    tax,
    currency,
    raw_text: includeRawText ? text : undefined,
    confidence,
    processing_ms: 0,
    model_used: "rule-based-v1",
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function parseDocument(
  fileBuffer: ArrayBuffer,
  mimeType: string,
  options: { include_raw_text?: boolean; language?: string } = {}
): Promise<ParseResult> {
  const startMs = Date.now();

  // Prefer AI when available
  if (getAnthropic()) {
    const result = await parseWithAI(fileBuffer, mimeType, options);
    result.processing_ms = Date.now() - startMs;
    return result;
  }

  // Fallback: rule-based (PDFs only for now; images need OCR which requires AI)
  if (mimeType === "application/pdf") {
    let text = "";
    try {
      text = await extractPdfText(fileBuffer);
    } catch (err: any) {
      console.error("PDF text extraction failed:", err?.message);
      throw new Error("PDF text extraction failed — try enabling AI parsing for better results");
    }

    const result = parseWithRulesFallback(text, options.include_raw_text ?? false);
    result.processing_ms = Date.now() - startMs;
    return result;
  }

  // Images without AI: return informative error
  throw new Error(
    "Image parsing requires AI backend. Set ANTHROPIC_API_KEY to enable. PDF documents can be parsed without AI."
  );
}

export async function logParse(
  apiKey: ApiKey,
  org: Organization,
  result: ParseResult,
  fileSizeBytes: number,
  errorMessage?: string
) {
  await db
    .from("pf_api_keys")
    .update({
      parses_used: apiKey.parses_used + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", apiKey.id);

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
