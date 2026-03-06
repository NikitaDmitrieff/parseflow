---
title: "How to Extract Invoice Data from PDF with Node.js (2026 Guide)"
description: "Step-by-step tutorial: parse PDF invoices in Node.js using rule-based extraction, pdf-parse, and API fallback. Extract vendor, total, line items, dates in under 50 lines."
tags: ["node", "pdf", "invoices", "javascript", "typescript", "automation"]
cover_image: ""
canonical_url: "https://parseflow.dev/blog/extract-invoice-data-pdf-nodejs"
published: true
---

# How to Extract Invoice Data from PDF with Node.js (2026 Guide)

If you've ever tried to build accounts payable automation or expense tracking, you know the pain: PDFs don't want to give up their data.

This guide covers three approaches to extracting structured invoice data from PDF files in Node.js, ranked by complexity and accuracy — from a quick DIY approach to a production-ready API.

---

## What We're Extracting

A typical invoice contains:
- **Vendor name** and address
- **Invoice number** and date
- **Due date** and payment terms
- **Line items**: description, quantity, unit price, amount
- **Subtotal, tax, and total**
- **Currency**

Our goal: take a PDF file, return a JSON object with all of these fields.

---

## Option 1: DIY with `pdf-parse` + Regex

The fastest way to get started. Works well for invoices from a single vendor with a consistent format.

```bash
npm install pdf-parse
```

```typescript
import fs from "fs";
import pdfParse from "pdf-parse";

interface InvoiceData {
  vendor?: string;
  invoiceNumber?: string;
  date?: string;
  total?: number;
  currency?: string;
}

async function extractInvoiceData(filePath: string): Promise<InvoiceData> {
  const buffer = fs.readFileSync(filePath);
  const { text } = await pdfParse(buffer);

  // Extract invoice number
  const invoiceNumberMatch = text.match(
    /(?:invoice|inv)[.\s#-]*([A-Z0-9-]{3,20})/i
  );

  // Extract date
  const dateMatch = text.match(
    /(?:date|issued)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
  );

  // Extract total
  const totalMatch = text.match(
    /(?:total|amount due)[:\s]*[$€£]?\s*([\d,]+\.\d{2})/i
  );

  // Extract currency symbol
  const currencyMatch = text.match(/[$€£¥₹]/);
  const currencyMap: Record<string, string> = {
    $: "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "₹": "INR",
  };

  return {
    invoiceNumber: invoiceNumberMatch?.[1],
    date: dateMatch?.[1],
    total: totalMatch ? parseFloat(totalMatch[1].replace(/,/g, "")) : undefined,
    currency: currencyMatch ? currencyMap[currencyMatch[0]] : "USD",
  };
}

// Usage
extractInvoiceData("./invoice.pdf").then(console.log);
// { invoiceNumber: 'INV-2024-001', date: '15/01/2024', total: 1250.00, currency: 'USD' }
```

**Pros**: Zero API costs, fast, no external dependencies beyond `pdf-parse`.

**Cons**: Breaks on any format variation. You'll end up with 200+ regexes and still miss edge cases. Doesn't handle scanned PDFs (images). No line items.

---

## Option 2: LLM Extraction with OpenAI or Claude

When you need to handle arbitrary invoice formats, an LLM works well. The tradeoff is cost and latency.

```bash
npm install openai pdf-parse
```

```typescript
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import fs from "fs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractWithLLM(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  const { text } = await pdfParse(buffer);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Extract invoice data and return ONLY valid JSON with these fields:
          vendor_name, invoice_number, invoice_date, due_date,
          line_items (array of {description, quantity, unit_price, amount}),
          subtotal, tax_amount, total, currency`,
      },
      {
        role: "user",
        content: `Extract data from this invoice:\n\n${text}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content!);
}
```

**Cost**: ~$0.002–$0.005 per invoice with `gpt-4o-mini`. At 1,000 invoices/day, that's $60–$150/month just in LLM costs — before your infra.

**Cons**: Scanned PDFs need OCR first. Hallucination risk on amounts (always validate totals). JSON schema compliance requires prompt engineering. Rate limits.

---

## Option 3: A Dedicated Parsing API (Production-Ready)

For production workloads, a dedicated document parsing API handles the messy stuff: scanned PDFs, image invoices, multi-page documents, and format normalization.

**[ParseFlow](https://api-ebon-tau-30.vercel.app)** uses rule-based extraction for standard formats (4–10ms, 95%+ accuracy) and escalates to AI only for non-standard layouts. Cost: $9/mo for 500 parses, $29/mo for 2,000.

```typescript
async function extractWithParseFlow(filePath: string) {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([fs.readFileSync(filePath)], { type: "application/pdf" }),
    "invoice.pdf"
  );
  formData.append("document_type", "invoice");

  const response = await fetch("https://api-ebon-tau-30.vercel.app/v1/parse", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PARSEFLOW_API_KEY}`,
    },
    body: formData,
  });

  return response.json();
}
```

Response:
```json
{
  "status": "success",
  "document_type": "invoice",
  "processing_ms": 7,
  "confidence": 0.97,
  "data": {
    "vendor": {
      "name": "Acme Corp",
      "address": "123 Business St, San Francisco, CA 94105"
    },
    "invoice_number": "INV-2024-0042",
    "invoice_date": "2024-01-15",
    "due_date": "2024-02-14",
    "line_items": [
      {
        "description": "Software License Q1",
        "quantity": 1,
        "unit_price": 1250.00,
        "amount": 1250.00
      }
    ],
    "subtotal": 1250.00,
    "tax_amount": 112.50,
    "total": 1362.50,
    "currency": "USD"
  }
}
```

**Try it for free** (no auth required):
```bash
curl -X POST https://api-ebon-tau-30.vercel.app/v1/demo \
  -H "Content-Type: application/json" \
  -d '{"scenario": "receipt"}'
```

---

## Handling Scanned PDFs (Image-Based Invoices)

Scanned PDFs and photos need OCR before text extraction. Your options:

**Option A: Tesseract.js (free, local)**
```bash
npm install tesseract.js
```
```typescript
import Tesseract from "tesseract.js";

const { data: { text } } = await Tesseract.recognize("scanned-invoice.jpg", "eng");
// Then feed `text` into your extraction logic above
```

Accuracy: 85–92% on clean scans. Degrades with skewed images, poor lighting.

**Option B: Google Vision API**
High accuracy (~98%), but adds $1.50/1,000 images. Good for high-volume production.

**Option C: ParseFlow** handles scanned PDFs natively — it runs OCR + extraction in one API call.

---

## Validating Extracted Data

Always validate extracted totals. A common mistake: trusting LLM-extracted totals without cross-checking.

```typescript
function validateInvoice(data: InvoiceData): boolean {
  // Line items should sum to subtotal
  if (data.line_items && data.subtotal) {
    const computed = data.line_items.reduce((sum, item) => sum + item.amount, 0);
    const tolerance = 0.02; // 2 cent tolerance for rounding
    if (Math.abs(computed - data.subtotal) > tolerance) {
      console.warn("Line items don't sum to subtotal:", { computed, subtotal: data.subtotal });
      return false;
    }
  }

  // Total = subtotal + tax
  if (data.subtotal && data.tax_amount !== undefined && data.total) {
    const expected = data.subtotal + data.tax_amount;
    if (Math.abs(expected - data.total) > 0.02) {
      console.warn("Total mismatch:", { expected, actual: data.total });
      return false;
    }
  }

  return true;
}
```

---

## Performance Comparison

| Approach | Speed | Accuracy | Cost/1k docs | Scanned PDFs |
|----------|-------|----------|--------------|--------------|
| Regex (single format) | <1ms | 95%+ | $0 | No |
| Regex (multi-format) | 5–20ms | 60–80% | $0 | No |
| GPT-4o-mini | 1–3s | 90–95% | $2–5 | With OCR |
| ParseFlow | 4–50ms | 95–98% | $0.01–0.05 | Yes |

---

## Choosing the Right Approach

- **Single-vendor, consistent format** → Regex. Build it in an afternoon, runs forever.
- **Multi-vendor, text PDFs** → LLM (Claude or GPT-4o-mini). Budget for API costs.
- **Production, high volume, scanned docs** → Dedicated API like ParseFlow. The economics work at scale.
- **One-off data extraction** → [ParseFlow demo endpoint](https://api-ebon-tau-30.vercel.app/v1/demo) — free, no auth.

---

## What's Next

- [Building an accounts payable automation pipeline with Node.js](#)
- [ParseFlow API reference](https://api-ebon-tau-30.vercel.app)
- [Invoice parsing API comparison 2026](#)

---

*ParseFlow is an open-source document parsing API. Free tier available. [Try it now →](https://api-ebon-tau-30.vercel.app)*
