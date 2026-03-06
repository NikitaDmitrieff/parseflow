import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ParseFlow Docs — Invoice Parser API Reference",
  description:
    "Complete API reference for ParseFlow: parse invoices, receipts, and PDFs into structured JSON. Includes quickstart, code examples, and endpoint reference.",
  alternates: { canonical: "https://parseflow-dashboard.vercel.app/docs" },
};

const API_BASE = "https://api-ebon-tau-30.vercel.app";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight text-slate-900">
            ParseFlow
          </a>
          <a
            href="/register"
            className="text-sm px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Get API Key
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Invoice Parser API Documentation
        </h1>
        <p className="text-xl text-slate-600 mb-12">
          ParseFlow extracts structured data from invoices, receipts, and financial documents.
          Upload a PDF or image — get back clean JSON with vendor, amounts, line items, and more.
        </p>

        {/* Quickstart */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quickstart</h2>
          <p className="text-slate-600 mb-6">
            Parse your first invoice in under 2 minutes. No email, no credit card required.
          </p>

          <div className="space-y-6">
            {/* Step 1 */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Step 1 — Get an API Key
              </h3>
              <div className="bg-slate-900 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-700 text-slate-400 text-sm font-mono">
                  Register (no email required)
                </div>
                <pre className="p-5 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  <code>{`curl -X POST ${API_BASE}/v1/register \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Your Company"}'

# Response
{
  "api_key": "pf_live_abc123...",
  "plan": "free",
  "parses_quota": 50,
  "warning": "Save this key — it will not be shown again."
}`}</code>
                </pre>
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Step 2 — Parse an Invoice
              </h3>
              <div className="bg-slate-900 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-700 text-slate-400 text-sm font-mono">
                  POST /v1/parse
                </div>
                <pre className="p-5 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  <code>{`curl -X POST ${API_BASE}/v1/parse \\
  -H "X-API-Key: pf_live_your_key_here" \\
  -F "file=@invoice.pdf"

# Response
{
  "id": "48a544b2-a892-4f5d-9ab1-177d73887325",
  "status": "success",
  "document_type": "invoice",
  "vendor": "Acme Corp Inc",
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
}`}</code>
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Step 3 — Check Your Usage
              </h3>
              <div className="bg-slate-900 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-700 text-slate-400 text-sm font-mono">
                  GET /v1/usage
                </div>
                <pre className="p-5 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  <code>{`curl ${API_BASE}/v1/usage \\
  -H "X-API-Key: pf_live_your_key_here"

# Response
{
  "plan": "free",
  "parses_used": 1,
  "parses_quota": 50,
  "parses_remaining": 49,
  "period_start": "2026-03-01T00:00:00.000Z",
  "period_end": "2026-03-31T00:00:00.000Z"
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Formats */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Supported File Formats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { ext: "PDF", desc: "application/pdf" },
              { ext: "JPEG", desc: "image/jpeg" },
              { ext: "PNG", desc: "image/png" },
              { ext: "WebP", desc: "image/webp" },
            ].map((f) => (
              <div key={f.ext} className="border border-slate-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-900 mb-1">{f.ext}</div>
                <div className="text-xs text-slate-500 font-mono">{f.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-4">Maximum file size: 10MB</p>
        </section>

        {/* Extracted Fields */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Extracted Fields</h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Field</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["vendor", "string", "Vendor / supplier name"],
                  ["invoice_number", "string", "Invoice or reference number"],
                  ["date", "date", "Invoice issue date (YYYY-MM-DD)"],
                  ["due_date", "date", "Payment due date"],
                  ["total", "number", "Total amount due"],
                  ["subtotal", "number", "Amount before tax"],
                  ["tax", "number", "Tax amount"],
                  ["currency", "string", "ISO 4217 currency code (e.g. USD, EUR)"],
                  ["line_items", "array", "List of items with description, quantity, unit_price, amount"],
                  ["confidence", "number", "Extraction confidence 0–1"],
                  ["status", "string", "success | partial | failed"],
                ].map(([field, type, desc]) => (
                  <tr key={field}>
                    <td className="px-4 py-3 font-mono text-slate-900">{field}</td>
                    <td className="px-4 py-3 text-slate-500">{type}</td>
                    <td className="px-4 py-3 text-slate-600">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* OpenAPI */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">OpenAPI Specification</h2>
          <p className="text-slate-600 mb-4">
            The full OpenAPI 3.0 spec is available for import into Postman, Insomnia, or any compatible tool.
          </p>
          <a
            href={`${API_BASE}/openapi.json`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:border-slate-400 transition-colors text-sm font-mono"
            target="_blank"
            rel="noopener noreferrer"
          >
            {API_BASE}/openapi.json
          </a>
        </section>

        {/* Error Codes */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Error Codes</h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">HTTP</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["400", "VALIDATION_ERROR", "Missing required field"],
                  ["400", "UNSUPPORTED_FILE_TYPE", "File type not supported"],
                  ["400", "FILE_TOO_LARGE", "File exceeds 10MB limit"],
                  ["401", "INVALID_API_KEY", "API key missing or invalid"],
                  ["429", "QUOTA_EXCEEDED", "Monthly parse quota exceeded"],
                  ["500", "PARSE_FAILED", "Internal parse error"],
                ].map(([http, code, meaning]) => (
                  <tr key={code}>
                    <td className="px-4 py-3 font-mono text-slate-900">{http}</td>
                    <td className="px-4 py-3 font-mono text-amber-700">{code}</td>
                    <td className="px-4 py-3 text-slate-600">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-slate-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Ready to parse your first invoice?
          </h2>
          <p className="text-slate-600 mb-6">
            Free tier includes 50 parses/month. No credit card, no email required.
          </p>
          <a
            href="/register"
            className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            Get API Key — Free
          </a>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <p>
          ParseFlow by{" "}
          <a href="https://github.com/auto-co-ai" className="hover:text-slate-600">
            Auto-Co
          </a>{" "}
          &mdash;{" "}
          <a href="https://github.com/NikitaDmitrieff/parseflow" className="hover:text-slate-600">
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
