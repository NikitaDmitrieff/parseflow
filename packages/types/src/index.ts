// ParseFlow shared types — used by both API and dashboard

export interface ParseRequest {
  file: File | Blob;
  options?: ParseOptions;
}

export interface ParseOptions {
  /** Override language hint (default: auto-detect) */
  language?: string;
  /** Return raw extracted text alongside structured data */
  include_raw_text?: boolean;
}

export interface LineItem {
  description: string;
  quantity?: number;
  unit_price?: number;
  amount: number;
}

export interface ParseResult {
  id: string;
  status: "success" | "partial" | "failed";
  document_type: "invoice" | "receipt" | "contract" | "other";

  // Invoice-specific fields
  vendor?: string;
  vendor_address?: string;
  invoice_number?: string;
  date?: string;           // ISO 8601
  due_date?: string;       // ISO 8601
  total?: number;
  subtotal?: number;
  tax?: number;
  currency?: string;       // ISO 4217
  line_items?: LineItem[];

  // Meta
  raw_text?: string;
  confidence: number;      // 0–1
  processing_ms: number;
  model_used: string;
}

export interface UsageStats {
  api_key_id: string;
  period_start: string;
  period_end: string;
  parses_used: number;
  parses_quota: number;
  plan: "free" | "pro" | "enterprise";
}

export interface ApiError {
  error: string;
  code: string;
  docs?: string;
}
