# ParseFlow

AI-powered invoice and document parser API. Send a PDF or image, get back clean structured JSON.

## What it does

ParseFlow extracts structured data from unstructured documents using Claude AI:

- **Invoices** — vendor, invoice number, date, due date, line items, totals, currency
- **Receipts** — merchant, items, subtotal, tax, total
- **Contracts** — parties, dates, key terms (coming soon)
- **Any document** — fallback generic extraction

One API call. No training data required. No template setup.

## Quick Start

### 1. Get an API key

Sign up at [parseflow.dev](https://parseflow.dev) — 100 free parses on us.

### 2. Parse a document

```bash
curl -X POST https://api.parseflow.dev/v1/parse \
  -H "X-API-Key: pf_live_your_key_here" \
  -F "file=@invoice.pdf"
```

### Response

```json
{
  "id": "parse_01j9x8...",
  "status": "success",
  "document_type": "invoice",
  "vendor": "Acme Corp",
  "vendor_address": "123 Main St, San Francisco, CA 94105",
  "invoice_number": "INV-2024-0042",
  "date": "2024-03-01",
  "due_date": "2024-03-31",
  "total": 4250.00,
  "subtotal": 4000.00,
  "tax": 250.00,
  "currency": "USD",
  "line_items": [
    {
      "description": "API access - Pro plan (annual)",
      "quantity": 1,
      "unit_price": 4000.00,
      "amount": 4000.00
    }
  ],
  "confidence": 0.97,
  "processing_ms": 1240,
  "model_used": "claude-haiku-4-5-20251001"
}
```

### Check usage

```bash
curl https://api.parseflow.dev/v1/usage \
  -H "X-API-Key: pf_live_your_key_here"
```

## Pricing

| Plan       | Price         | Parses        |
|------------|---------------|---------------|
| Starter    | Free          | 100/month     |
| Pro        | $0.02/parse   | Unlimited     |
| Enterprise | Custom        | Volume pricing|

No monthly minimums. No setup fees. Pay only for what you use.

## Supported Formats

- PDF (`.pdf`)
- Images: JPEG, PNG, WEBP, HEIC
- Max file size: 20 MB

## Self-Hosted

Want to run ParseFlow on your own infrastructure? The API (`apps/api`) is a standard Node.js app deployable anywhere Docker runs.

```bash
# Clone and configure
git clone https://github.com/NikitaDmitrieff/parseflow
cd parseflow/apps/api
cp .env.example .env
# Add your ANTHROPIC_API_KEY and SUPABASE credentials

# Run with Docker
docker build -t parseflow-api .
docker run -p 3001:3001 --env-file .env parseflow-api
```

## Architecture

```
parseflow/
├── apps/
│   ├── api/          # Hono API — deployed on Railway
│   └── dashboard/    # Next.js 15 dashboard — deployed on Vercel
├── packages/
│   └── types/        # Shared TypeScript types
```

**Stack:**
- API: [Hono](https://hono.dev) + Node.js on Railway
- Dashboard: Next.js 15 on Vercel
- Database + Auth: Supabase (PostgreSQL)
- AI: Claude claude-haiku-4-5-20251001 (Anthropic)
- Monorepo: pnpm workspaces + Turborepo

## Development

```bash
# Install dependencies
pnpm install

# Run everything
pnpm dev

# API available at: http://localhost:3001
# Dashboard at:     http://localhost:3000
```

## License

MIT
