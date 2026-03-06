# How to Extract Invoice Data from PDFs with Python (2026 Guide)

**Tags:** python, invoice, automation, finance, api

---

Every finance team has the same problem: a mountain of PDF invoices that need to be entered into a spreadsheet, accounting system, or ERP. Someone manually opens each file, reads the vendor name, invoice number, date, and total, then types it in.

This guide shows you how to automate that entire workflow with Python in under 50 lines of code.

## The Problem with Manual Invoice Processing

A typical accounts payable team processes hundreds of invoices per month. Manual data entry is:

- **Slow** — 3–5 minutes per invoice
- **Error-prone** — transposition errors cost real money
- **Unscalable** — more invoices means more headcount
- **Miserable** — no one wants to type the same fields 200 times a month

The alternative used to be expensive enterprise OCR software (ABBYY, Kofax) that costs thousands per year and requires IT to manage. That was the only option — until now.

## What We're Building

A Python script that:
1. Accepts a PDF invoice (or a folder of them)
2. Sends each file to the ParseFlow API
3. Gets back structured JSON: vendor, date, total, line items, currency
4. Saves the results to a CSV for import into Excel or your accounting tool

Total code: ~50 lines. No ML training, no local model, no complex setup.

## Prerequisites

- Python 3.8+
- A ParseFlow API key (free tier: 50 parses/month — [get one here](https://parseflow-dashboard.vercel.app/register))
- `requests` library

```bash
pip install requests
```

## Step 1: Get Your API Key

```bash
curl -X POST https://api-ebon-tau-30.vercel.app/v1/register \
  -H "Content-Type: application/json" \
  -d '{"name": "My Finance Automation"}'

# Response:
# {
#   "api_key": "pf_live_abc123...",
#   "plan": "free",
#   "parses_quota": 50,
#   "warning": "Save this key — it will not be shown again."
# }
```

Save that key — you'll need it in the next step.

## Step 2: Parse a Single Invoice

Here's the core function:

```python
import requests

API_KEY = "pf_live_your_key_here"
API_BASE = "https://api-ebon-tau-30.vercel.app"

def parse_invoice(pdf_path: str) -> dict:
    """Send a PDF to ParseFlow and return structured invoice data."""
    with open(pdf_path, "rb") as f:
        response = requests.post(
            f"{API_BASE}/v1/parse",
            headers={"X-API-Key": API_KEY},
            files={"file": (pdf_path, f, "application/pdf")},
        )
    response.raise_for_status()
    return response.json()

# Try it
result = parse_invoice("invoice.pdf")
print(result)
```

The response looks like this:

```json
{
  "id": "48a544b2-a892-4f5d-9ab1-177d73887325",
  "status": "success",
  "document_type": "invoice",
  "vendor": "Acme Corp Inc",
  "invoice_number": "INV-2026-001",
  "date": "2026-03-01",
  "due_date": "2026-04-01",
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
  "model_used": "rule-based-v1"
}
```

## Step 3: Process a Folder and Export to CSV

Here's a complete script for batch processing:

```python
import csv
import os
import sys
import requests
from pathlib import Path

API_KEY = "pf_live_your_key_here"
API_BASE = "https://api-ebon-tau-30.vercel.app"

def parse_invoice(pdf_path: str) -> dict:
    with open(pdf_path, "rb") as f:
        response = requests.post(
            f"{API_BASE}/v1/parse",
            headers={"X-API-Key": API_KEY},
            files={"file": (Path(pdf_path).name, f, "application/pdf")},
            timeout=30,
        )
    response.raise_for_status()
    return response.json()

def process_folder(folder: str, output_csv: str):
    pdf_files = list(Path(folder).glob("*.pdf"))
    print(f"Found {len(pdf_files)} PDF files in {folder}")

    rows = []
    for pdf_path in pdf_files:
        print(f"  Parsing: {pdf_path.name}...", end=" ", flush=True)
        try:
            result = parse_invoice(str(pdf_path))
            rows.append({
                "file": pdf_path.name,
                "status": result.get("status"),
                "vendor": result.get("vendor", ""),
                "invoice_number": result.get("invoice_number", ""),
                "date": result.get("date", ""),
                "due_date": result.get("due_date", ""),
                "total": result.get("total", ""),
                "subtotal": result.get("subtotal", ""),
                "tax": result.get("tax", ""),
                "currency": result.get("currency", ""),
                "confidence": result.get("confidence", ""),
                "line_items_count": len(result.get("line_items") or []),
            })
            print(f"OK ({result.get('confidence', 0):.0%} confidence)")
        except requests.HTTPError as e:
            print(f"FAILED ({e.response.status_code})")
            rows.append({"file": pdf_path.name, "status": "error"})

    with open(output_csv, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "file", "status", "vendor", "invoice_number", "date", "due_date",
            "total", "subtotal", "tax", "currency", "confidence", "line_items_count"
        ])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDone. Results saved to {output_csv}")
    print(f"  Successful: {sum(1 for r in rows if r.get('status') == 'success')}/{len(rows)}")

if __name__ == "__main__":
    folder = sys.argv[1] if len(sys.argv) > 1 else "invoices"
    output = sys.argv[2] if len(sys.argv) > 2 else "parsed_invoices.csv"
    process_folder(folder, output)
```

Run it:

```bash
python parse_invoices.py ./invoices output.csv
```

Output:

```
Found 12 PDF files in ./invoices
  Parsing: acme-invoice-001.pdf... OK (94% confidence)
  Parsing: vendor-receipt-feb.pdf... OK (88% confidence)
  Parsing: invoice-march-2026.pdf... OK (91% confidence)
  ...

Done. Results saved to output.csv
  Successful: 11/12
```

Open `output.csv` in Excel, filter by vendor, sort by date, pivot by total — whatever you need.

## Step 4: Handle Errors and Quota

The API returns standard HTTP status codes:

| Code | Meaning | What to do |
|------|---------|------------|
| 200 | Success | Use the result |
| 400 | Invalid file | Check file format (PDF/JPEG/PNG/WebP, max 10MB) |
| 401 | Bad API key | Check your key |
| 429 | Quota exceeded | Upgrade or wait for next month |
| 500 | Parse failed | Low-confidence document — try again or inspect manually |

Check your remaining quota anytime:

```python
def check_quota():
    resp = requests.get(
        f"{API_BASE}/v1/usage",
        headers={"X-API-Key": API_KEY},
    )
    data = resp.json()
    print(f"Plan: {data['plan']}")
    print(f"Used: {data['parses_used']}/{data['parses_quota']} this month")
    print(f"Remaining: {data['parses_remaining']}")

check_quota()
# Plan: free
# Used: 12/50 this month
# Remaining: 38
```

## What About Confidence Scores?

Every parse result includes a `confidence` field (0–1). Here's what it means:

- **0.8–1.0**: High confidence — all key fields extracted reliably
- **0.5–0.8**: Good — most fields present, review totals
- **0.2–0.5**: Partial — some fields missing, scanned document may be low quality
- **< 0.2**: Failed — document couldn't be parsed

For automated workflows, filter out low-confidence results and route them to a human review queue:

```python
HIGH_CONFIDENCE = 0.7

auto_approved = [r for r in results if r.get("confidence", 0) >= HIGH_CONFIDENCE]
needs_review  = [r for r in results if r.get("confidence", 0) <  HIGH_CONFIDENCE]

print(f"Auto-approved: {len(auto_approved)}")
print(f"Needs human review: {len(needs_review)}")
```

## Real-World Use Cases

**Accounting automation**: Export to CSV → import into QuickBooks, Xero, or FreshBooks. Most accounting tools accept CSV imports for bills/expenses.

**Spend analytics**: Parse 3 months of vendor invoices, pivot by vendor in Excel — instant spend-by-supplier dashboard.

**Approval workflows**: Parse invoice → check total against PO → if total matches within 2%, auto-approve. If not, flag for review.

**ERP integration**: Use the JSON output directly in your ERP's API (SAP, NetSuite, Odoo). ParseFlow gives you the structured fields their APIs expect.

## Pricing

| Plan | Price | Parses/month | Best for |
|------|-------|-------------|----------|
| Free | $0 | 50 | Testing, small teams |
| Pro | $9/month | 1,000 | SMBs processing 30–50 invoices/day |
| Scale | $29/month | 10,000 | Finance teams, high volume |

[Get your free API key](https://parseflow-dashboard.vercel.app/register) — no email or credit card required.

## Next Steps

- Check the [full API documentation](https://parseflow-dashboard.vercel.app/docs) for all response fields
- Download the [Postman collection](https://raw.githubusercontent.com/NikitaDmitrieff/parseflow/main/parseflow.postman_collection.json) to explore the API interactively
- Try the [demo endpoint](https://api-ebon-tau-30.vercel.app/v1/demo) without an API key to see the response format

Invoice processing automation used to require enterprise software and a six-figure budget. Now it takes 50 lines of Python and a free API key.
