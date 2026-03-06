# ParseFlow

Invoice and document parsing API. Upload a PDF or image, get structured JSON back in milliseconds. No ML training, no templates, no account required for the demo.

**Live API:** https://api-ebon-tau-30.vercel.app
**Dashboard:** https://parseflow-dashboard.vercel.app
**OpenAPI spec:** https://raw.githubusercontent.com/NikitaDmitrieff/parseflow/main/apps/api/openapi.json

[![CI](https://github.com/NikitaDmitrieff/parseflow/actions/workflows/ci.yml/badge.svg)](https://github.com/NikitaDmitrieff/parseflow/actions)

---

## Try It Now (no API key needed)

```bash
curl https://api-ebon-tau-30.vercel.app/v1/demo
```

Or with POST:

```bash
curl -X POST https://api-ebon-tau-30.vercel.app/v1/demo \
  -H "Content-Type: application/json" \
  -d '{"scenario": "receipt"}'
```

Response:

```json
{
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
    { "description": "Software Development Services", "quantity": 35, "unit_price": 125.00, "amount": 4375.00 }
  ],
  "confidence": 0.94,
  "processing_ms": 7
}
```

---

## Comparison

| Feature | ParseFlow | Veryfi | Mindee | AWS Textract |
|---|---|---|---|---|
| Free tier | 50 parses/mo | 300/mo (limited time) | 250/mo | $0 but pay-per-page |
| No-key demo | **Yes** | No | No | No |
| Self-hostable | Planned | No | No | No |
| Open source | **Yes** | No | No | No |
| Invoice fields | Full | Full | Full | Partial |
| Processing speed | **<10ms (rule-based)** | 500ms–3s | 200ms–2s | 1s–5s |
| Setup time | 30 seconds | 5–10 minutes | 5–10 minutes | 30+ minutes |
| Price (Pro) | **$9/mo** | $99/mo | $200/mo | Usage-based |

---

## What It Extracts

- **Invoices** — vendor, invoice number, date, due date, line items, totals, currency
- **Receipts** — merchant, items, subtotal, tax, total
- **Any document** — fallback generic extraction

One API call. No account required to start.

---

## Quick Start

### 1. Get a free API key (instant, no email required)

```bash
curl -X POST https://api-ebon-tau-30.vercel.app/v1/register \
  -H "Content-Type: application/json" \
  -d '{"name": "My App"}'
```

Response:

```json
{
  "api_key": "pf_live_...",
  "plan": "free",
  "parses_quota": 50,
  "warning": "Save this key — it will not be shown again."
}
```

### 2. Parse a document

```bash
curl -X POST https://api-ebon-tau-30.vercel.app/v1/parse \
  -H "X-API-Key: pf_live_your_key_here" \
  -F "file=@invoice.pdf"
```

### 3. Check usage

```bash
curl https://api-ebon-tau-30.vercel.app/v1/usage \
  -H "X-API-Key: pf_live_your_key_here"
```

---

## Pricing

| Plan  | Price    | Parses/month | Support |
|-------|----------|--------------|---------|
| Free  | $0       | 50           | GitHub Issues |
| Pro   | $9/mo    | 500          | Email |
| Scale | $29/mo   | 5,000        | Priority email |

Register at [parseflow-dashboard.vercel.app](https://parseflow-dashboard.vercel.app) — instant, no email required.

---

## Supported Formats

- PDF (`.pdf`)
- Images: JPEG, PNG, WEBP
- Max file size: 10 MB

---

## Architecture

```
parseflow/
├── apps/
│   ├── api/          # Hono API — deployed on Vercel
│   └── dashboard/    # Next.js 15 dashboard — deployed on Vercel
├── packages/
│   └── types/        # Shared TypeScript types
```

**Stack:** Hono + Node.js on Vercel · Next.js 15 · Supabase (PostgreSQL) · Turborepo

---

## Blog / Guides

- [How to Extract Invoice Data from PDFs in Node.js](https://github.com/NikitaDmitrieff/parseflow/blob/main/docs/blog/extract-invoice-data-pdf-nodejs.md)
- [Invoice Parsing API Comparison 2026](https://github.com/NikitaDmitrieff/parseflow/blob/main/docs/blog/invoice-parsing-api-comparison-2026.md)
- [Building an Invoice Parser API with Hono + Vercel](https://github.com/NikitaDmitrieff/parseflow/blob/main/docs/blog/parseflow-invoice-parser-api.md)

---

## Development

```bash
pnpm install
pnpm dev
# API:       http://localhost:3001
# Dashboard: http://localhost:3000
```

## License

MIT
