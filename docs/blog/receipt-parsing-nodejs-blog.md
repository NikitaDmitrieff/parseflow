# Blog Post: Receipt Parsing API in Node.js

## Metadata
- **Title:** Receipt Parsing in Node.js: Extract structured data from receipts in 10 lines
- **Tags:** node, javascript, api, typescript
- **Target keyword cluster:** receipt parsing API, receipt parsing Node.js, parse receipt JSON, extract receipt data javascript
- **Length:** ~600 words
- **Status:** Ready to post

---

## Article Body

---

If you're building expense tracking, reimbursement workflows, or bookkeeping automation — at some point you need to turn **paper receipts into structured data**.

Here's how to do it in Node.js with a single API call.

## The problem with receipts

Receipts are worse than invoices. They come from:
- POS printers in weird fonts
- Phone camera photos at bad angles
- Email confirmations in completely non-standard formats
- Crumpled paper scans

And you need to extract: merchant name, date, total, tax, line items, payment method.

Writing custom parsers per receipt format is a losing battle. The correct solution is a document parsing API.

## Setup: zero dependencies

```bash
# No packages needed — just Node.js built-in fetch
```

Or if you're on Node 16 or older:

```bash
npm install node-fetch form-data
```

## Parse a receipt in 10 lines

```javascript
import { readFileSync } from 'fs'

const file = readFileSync('./receipt.jpg')
const form = new FormData()
form.append('file', new Blob([file], { type: 'image/jpeg' }), 'receipt.jpg')

const res = await fetch('https://api-ebon-tau-30.vercel.app/v1/parse', {
  method: 'POST',
  headers: { 'X-API-Key': process.env.PARSEFLOW_API_KEY },
  body: form
})

const data = await res.json()
console.log(data)
```

**Output:**

```json
{
  "document_type": "receipt",
  "vendor": "Whole Foods Market",
  "date": "2026-02-14",
  "total": 47.23,
  "subtotal": 43.12,
  "tax": 4.11,
  "currency": "USD",
  "payment_method": "Visa ending 4242",
  "line_items": [
    { "description": "Organic Bananas", "amount": 1.89 },
    { "description": "Greek Yogurt 2pk", "amount": 5.49 },
    { "description": "Almond Milk 64oz", "amount": 4.99 }
  ],
  "confidence": 0.91,
  "processing_ms": 1240
}
```

No configuration. Works on JPEG, PNG, PDF, WebP.

## TypeScript types

```typescript
interface ParseResult {
  document_type: 'receipt' | 'invoice' | 'contract' | 'unknown'
  vendor?: string
  date?: string
  total?: number
  subtotal?: number
  tax?: number
  currency?: string
  payment_method?: string
  line_items?: Array<{
    description: string
    quantity?: number
    unit_price?: number
    amount: number
  }>
  confidence: number
  processing_ms: number
}
```

## Batch processing receipts

For expense reports, you often need to process dozens of receipts at once:

```javascript
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

async function parseReceipt(filePath) {
  const file = await readFile(filePath)
  const form = new FormData()
  form.append('file', new Blob([file]), filePath.split('/').pop())

  const res = await fetch('https://api-ebon-tau-30.vercel.app/v1/parse', {
    method: 'POST',
    headers: { 'X-API-Key': process.env.PARSEFLOW_API_KEY },
    body: form
  })
  return res.json()
}

// Process all receipts in a folder
const files = await readdir('./receipts')
const results = await Promise.all(
  files.map(f => parseReceipt(join('./receipts', f)))
)

const totalSpend = results.reduce((sum, r) => sum + (r.total || 0), 0)
console.log(`Total expenses: $${totalSpend.toFixed(2)}`)
```

## Try it without signing up

Hit the demo endpoint — no API key needed:

```bash
curl "https://api-ebon-tau-30.vercel.app/v1/demo?scenario=receipt"
```

You'll get back a realistic receipt response immediately.

## Get a free API key

ParseFlow gives you **50 free parses/month** — more than enough to prototype your integration. After that it's $0.02/parse with no monthly minimum.

Register at: https://parseflow-dashboard.vercel.app

---

*ParseFlow is open source and built on Node.js (Hono + Vercel). Feedback welcome.*

---

## Posting Command (once Dev.to API key is available)

```bash
curl -X POST https://dev.to/api/articles \
  -H "Content-Type: application/json" \
  -H "api-key: $DEVTO_API_KEY" \
  -d '{
    "article": {
      "title": "Receipt Parsing in Node.js: Extract structured data from receipts in 10 lines",
      "published": true,
      "body_markdown": "<PASTE BODY ABOVE>",
      "tags": ["node", "javascript", "api", "typescript"]
    }
  }'
```
