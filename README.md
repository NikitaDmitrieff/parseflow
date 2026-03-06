# ParseFlow

Invoice and document parser API. Upload a PDF or image, get back structured JSON. No ML training required.

**Live API:** https://api-ebon-tau-30.vercel.app
**Dashboard:** https://parseflow-dashboard.vercel.app
**OpenAPI spec:** https://raw.githubusercontent.com/NikitaDmitrieff/parseflow/main/apps/api/openapi.json

## What it does

Extracts structured data from unstructured documents:

- **Invoices** — vendor, invoice number, date, due date, line items, totals, currency
- **Receipts** — merchant, items, subtotal, tax, total
- **Any document** — fallback generic extraction

One API call. No templates. No training data.

## Quick Start

### 1. Get a free API key (instant, no email required)

```bash
curl -X POST https://api-ebon-tau-30.vercel.app/v1/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Your Company"}'
```

Response: `{"api_key": "pf_live_...", "plan": "free", "parses_quota": 50}`

### 2. Parse a document

```bash
curl -X POST https://api-ebon-tau-30.vercel.app/v1/parse \
  -H "X-API-Key: pf_live_your_key_here" \
  -F "file=@invoice.pdf"
```

### Response

```json
{
  "id": "48a544b2-a892-4f5d-9ab1-177d73887325",
  "status": "success",
  "document_type": "invoice",
  "vendor": "Acme Corp",
  "invoice_number": "INV-2026-001",
  "date": "2026-03-06",
  "due_date": "2026-04-06",
  "total": 550.00,
  "subtotal": 500.00,
  "tax": 50.00,
  "currency": "USD",
  "line_items": [
    {
      "description": "API access - Pro plan",
      "quantity": 1,
      "unit_price": 500.00,
      "amount": 500.00
    }
  ],
  "confidence": 0.87,
  "processing_ms": 4,
  "model_used": "rule-based-v1"
}
```

### Check usage

```bash
curl https://api-ebon-tau-30.vercel.app/v1/usage \
  -H "X-API-Key: pf_live_your_key_here"
```

## Pricing

| Plan  | Price    | Parses/month |
|-------|----------|--------------|
| Free  | $0       | 50           |
| Pro   | $9/mo    | 500          |
| Scale | $29/mo   | 5,000        |

Get your free API key at [parseflow-dashboard.vercel.app/register](https://parseflow-dashboard.vercel.app/register) — instant, no email required.

## Supported Formats

- PDF (`.pdf`)
- Images: JPEG, PNG, WEBP
- Max file size: 10 MB

## Architecture

```
parseflow/
├── apps/
│   ├── api/          # Hono API — deployed on Vercel
│   └── dashboard/    # Next.js 15 dashboard — deployed on Vercel
├── packages/
│   └── types/        # Shared TypeScript types
```

**Stack:**
- API: [Hono](https://hono.dev) + Node.js on Vercel
- Dashboard: Next.js 15 on Vercel
- Database: Supabase (PostgreSQL)
- Payments: Stripe
- Monorepo: pnpm workspaces + Turborepo

## Development

```bash
pnpm install
pnpm dev
# API: http://localhost:3001
# Dashboard: http://localhost:3000
```

## License

MIT
