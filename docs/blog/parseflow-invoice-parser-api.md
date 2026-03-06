---
title: "I Built a Document Parser API in a Weekend — Here's the Architecture"
description: "ParseFlow extracts structured JSON from invoices, receipts, and documents. No LLM overhead for standard formats — just fast, rule-based extraction with AI as fallback."
tags: ["api", "invoices", "documents", "node", "typescript"]
cover_image: ""
canonical_url: "https://parseflow.dev/blog/parseflow-invoice-parser-api"
published: true
---

# I Built a Document Parser API in a Weekend — Here's the Architecture

Most document parsing APIs cost $0.05–$0.15 per document and pipe everything through an LLM. For high-volume use cases, that's $50–$150 for every 1,000 invoices. The math doesn't work.

I built [ParseFlow](https://api-ebon-tau-30.vercel.app) — a document parsing API that starts with fast rule-based extraction and only escalates to AI when needed. The result: most standard invoices parse in under 10ms, and pricing starts at $9/mo for 500 parses.

This is the architecture behind it.

---

## The Core Problem

If you're building accounts payable automation, expense tracking, or any financial workflow, you need to extract:

- Vendor name and address
- Invoice/receipt number
- Date and due date
- Line items (description, quantity, unit price, amount)
- Totals, subtotals, and tax
- Currency

Every existing solution is either:
1. **An LLM call** — flexible but expensive and slow (~2-5 seconds/doc)
2. **A rigid template matcher** — fast but breaks on any new vendor

ParseFlow uses a tiered approach: rule-based first, AI only as fallback.

---

## Try It Right Now

No signup, no API key. The `/v1/demo` endpoint returns a realistic invoice parse:

```bash
curl https://api-ebon-tau-30.vercel.app/v1/demo | jq .
```

Response:

```json
{
  "id": "4c59e443-b187-4e16-9017-9d0f671c46be",
  "status": "success",
  "document_type": "invoice",
  "vendor": "Acme Solutions Ltd",
  "invoice_number": "INV-2026-00142",
  "date": "2026-02-28",
  "due_date": "2026-03-30",
  "total": 4750.00,
  "subtotal": 4375.00,
  "tax": 375.00,
  "currency": "USD",
  "line_items": [
    {
      "description": "Software Development Services",
      "quantity": 35,
      "unit_price": 125.00,
      "amount": 4375.00
    }
  ],
  "confidence": 0.94,
  "processing_ms": 7,
  "model_used": "rule-based-v1",
  "_demo": true
}
```

7ms. No AI. Just pattern matching.

---

## Architecture: Tiered Extraction Pipeline

```
PDF/Image Input
      │
      ▼
┌─────────────────────────────┐
│  1. PDF Text Extraction     │  pdfjs-dist (no native deps)
│     OR OCR fallback         │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  2. Rule-Based Extractor    │  Regex patterns, field heuristics
│     (confidence scored)     │  ~5-20ms typical
└─────────────┬───────────────┘
              │
      confidence < 0.7?
              │
              ▼
┌─────────────────────────────┐
│  3. AI Extraction (Claude)  │  Only when rules fail
│     Structured output       │  ~2-5 seconds, costs $$
└─────────────┬───────────────┘
              │
              ▼
         JSON Output
```

The confidence score is calculated per field. If the rule-based extractor finds invoice number, vendor, and total with high confidence, it returns immediately. If any key fields are missing, it escalates.

---

## Stack Decisions

**Hono on Vercel** — Not Express. Hono is 10x faster, runs natively on Vercel Edge, and has first-class TypeScript support. The serverless model means we pay nothing at 0 requests and scale automatically.

**pdfjs-dist** — Pure JavaScript PDF parser. No poppler, no native binaries, no Docker image size explosion. This was the critical decision for Vercel deployment.

**Supabase for auth** — API keys are SHA-256 hashed before storage (never stored in plaintext). Rate limiting per organization. Free tier handles early traction comfortably.

**TypeScript strict mode** — The document parsing domain has enough edge cases that runtime type errors are expensive. Zod for API input validation.

---

## The Registration → Parse Flow

```bash
# 1. Get a free API key (50 parses/month)
curl -X POST https://api-ebon-tau-30.vercel.app/v1/register \
  -H "Content-Type: application/json" \
  -d '{"name": "My App"}'

# Response:
# { "api_key": "pf_live_xxx...", "parses_quota": 50 }

# 2. Parse a document
curl -X POST https://api-ebon-tau-30.vercel.app/v1/parse \
  -H "X-API-Key: pf_live_xxx..." \
  -F "file=@invoice.pdf"
```

The API key is shown once and never again — it's hashed server-side. Standard security practice, but worth being explicit about.

---

## What's Different About ParseFlow

**Unit economics**: At $9/mo for 500 parses, the math works even for rule-based-only processing. We're not subsidizing GPU costs.

**No vendor lock-in**: Standard REST API, OpenAPI spec available at `/openapi.json`. Switch providers by changing one URL.

**Confidence scores per field**: You know when to trust the output and when to review. Not a black box.

**Deterministic for standard formats**: Same input = same output. LLMs have token sampling variance. Rule-based doesn't.

---

## Pricing

| Plan | Price | Parses/mo |
|------|-------|-----------|
| Free | $0 | 50 |
| Pro | $9/mo | 500 |
| Scale | $29/mo | 5,000 |

Simple. No per-call fees, no usage surprises at the end of the month.

---

## What I'd Do Differently

**The PDF extraction rabbit hole is real.** pdfjs-dist handles clean digital PDFs well, but scanned documents and low-DPI images need a different approach. I'd add a dedicated OCR service (Tesseract or a cloud OCR) as the first step for image inputs rather than trying to extract text from pixel-rendered PDFs.

**Start with fewer document types.** The temptation to handle receipts, purchase orders, contracts, etc. all at once is real. Invoices first. Get that right.

**Confidence scoring is undervalued.** Most extraction APIs give you output and a binary success/fail. Knowing that `vendor` has 0.92 confidence and `line_items` has 0.61 confidence lets you route to human review intelligently.

---

## Try It

- Demo (no auth): `curl https://api-ebon-tau-30.vercel.app/v1/demo`
- Free tier (50 parses/mo): [parseflow-dashboard.vercel.app/register](https://parseflow-dashboard.vercel.app/register)
- API reference: `https://api-ebon-tau-30.vercel.app/openapi.json`

Happy to answer architecture questions in the comments.
