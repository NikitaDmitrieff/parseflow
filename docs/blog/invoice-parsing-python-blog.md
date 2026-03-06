# How to Parse Invoices with Python: Extract Structured Data in 5 Lines

**Target keyword:** invoice parsing Python / invoice parser Python API
**Platform:** Dev.to
**Tags:** python, api, fintech, automation
**Canonical:** Dev.to post
**Word count:** ~700

---

## Post body

If you've ever built an accounting integration, expense tracker, or AP automation tool, you know the pain: invoices come in as PDFs and you need the numbers *out*.

Here's how to parse invoice PDFs into structured data using Python in under 5 lines.

### The fastest way: use an API

Building your own OCR pipeline in Python means wrestling with `pytesseract`, `pdfplumber`, layout parsing heuristics, and currency normalization. That's weeks of work for a feature that isn't your core product.

[ParseFlow](https://parseflow-dashboard.vercel.app) handles the full pipeline — OCR → field extraction → JSON normalization — via a single REST call.

```python
import requests

with open("invoice.pdf", "rb") as f:
    response = requests.post(
        "https://api-ebon-tau-30.vercel.app/v1/parse",
        headers={"X-API-Key": "pf_live_your_key"},
        files={"file": ("invoice.pdf", f, "application/pdf")},
    )

data = response.json()
print(f"Vendor: {data['vendor']}")
print(f"Total: {data['total']} {data['currency']}")
print(f"Invoice #: {data['invoice_number']}")
```

Response:

```json
{
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
  "processing_ms": 7
}
```

### Batch processing a folder

Real workflows usually involve processing a queue of invoices, not just one. Here's a pattern for batch processing with Python:

```python
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

API_KEY = "pf_live_your_key"
API_URL = "https://api-ebon-tau-30.vercel.app/v1/parse"

def parse_invoice(path: Path) -> dict:
    with open(path, "rb") as f:
        r = requests.post(
            API_URL,
            headers={"X-API-Key": API_KEY},
            files={"file": (path.name, f, "application/pdf")},
            timeout=30,
        )
    r.raise_for_status()
    return {"file": path.name, **r.json()}

def process_folder(folder: str) -> list[dict]:
    paths = list(Path(folder).glob("*.pdf"))
    with ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(parse_invoice, paths))
    return results

invoices = process_folder("./invoices/")
total_spend = sum(inv["total"] for inv in invoices if inv.get("total"))
print(f"Processed {len(invoices)} invoices. Total spend: ${total_spend:,.2f}")
```

With 5 workers and typical API latency under 50ms, you can process ~300 invoices per minute.

### Handling receipts too

The same endpoint works for receipts. Just POST the image file:

```python
with open("receipt.jpg", "rb") as f:
    response = requests.post(
        "https://api-ebon-tau-30.vercel.app/v1/parse",
        headers={"X-API-Key": API_KEY},
        files={"file": ("receipt.jpg", f, "image/jpeg")},
    )
```

ParseFlow detects document type automatically (`invoice` or `receipt`) and adjusts the extraction accordingly.

### Type-annotated wrapper (production-ready)

For production use, you'll want proper error handling and typed return values:

```python
from dataclasses import dataclass
from typing import Optional
import requests

@dataclass
class ParseResult:
    vendor: Optional[str]
    invoice_number: Optional[str]
    date: Optional[str]
    due_date: Optional[str]
    total: Optional[float]
    subtotal: Optional[float]
    tax: Optional[float]
    currency: Optional[str]
    confidence: float
    document_type: str

class ParseFlowClient:
    def __init__(self, api_key: str):
        self.session = requests.Session()
        self.session.headers["X-API-Key"] = api_key
        self.base_url = "https://api-ebon-tau-30.vercel.app"

    def parse(self, file_path: str) -> ParseResult:
        with open(file_path, "rb") as f:
            mime = "application/pdf" if file_path.endswith(".pdf") else "image/jpeg"
            r = self.session.post(
                f"{self.base_url}/v1/parse",
                files={"file": (file_path, f, mime)},
                timeout=30,
            )
        r.raise_for_status()
        data = r.json()
        return ParseResult(
            vendor=data.get("vendor"),
            invoice_number=data.get("invoice_number"),
            date=data.get("date"),
            due_date=data.get("due_date"),
            total=data.get("total"),
            subtotal=data.get("subtotal"),
            tax=data.get("tax"),
            currency=data.get("currency"),
            confidence=data.get("confidence", 0),
            document_type=data.get("document_type", "unknown"),
        )

# Usage
client = ParseFlowClient("pf_live_your_key")
result = client.parse("invoice.pdf")
print(f"Invoice from {result.vendor}: ${result.total} {result.currency}")
```

### Getting your API key

1. `curl -X POST https://api-ebon-tau-30.vercel.app/v1/register -H "Content-Type: application/json" -d '{"name": "My Company"}'`
2. Copy `api_key` from the response
3. Free tier: 50 parses/month, no credit card required

That's it. Start parsing.

---

*ParseFlow is an open-source invoice parsing API. Star it on [GitHub](https://github.com/NikitaDmitrieff/parseflow).*

---

## Dev.to metadata

```yaml
title: "How to Parse Invoices with Python: Extract Structured Data in 5 Lines"
description: "Build an invoice parser in Python using a REST API. No OCR setup, no training data. Free tier available."
tags: python, api, fintech, automation
canonical_url: https://dev.to/auto_co/parse-invoices-python
```
