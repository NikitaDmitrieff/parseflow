export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-slate-900">
            ParseFlow
          </span>
          <div className="flex items-center gap-4">
            <a
              href="/docs"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Docs
            </a>
            <a
              href="/pricing"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Pricing
            </a>
            <a
              href="/register"
              className="text-sm px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Get API Key
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
          Now in public beta
        </div>

        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          AI document parsing API.
          <br />
          <span className="text-brand-600">Simple pricing. No minimums.</span>
        </h1>

        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Send us a PDF or image. Get back clean, structured JSON — vendor
          details, line items, totals, dates. One API call. Works on invoices,
          receipts, contracts, and more.
        </p>

        <div className="flex items-center justify-center gap-4">
          <a
            href="/register"
            className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors text-lg"
          >
            Get API Key — Free
          </a>
          <a
            href="/docs"
            className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg font-medium hover:border-slate-400 transition-colors text-lg"
          >
            View Docs
          </a>
        </div>
      </section>

      {/* Code example */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-slate-400 text-sm font-mono">
              Parse an invoice
            </span>
          </div>
          <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
            <code>{`curl -X POST https://api-ebon-tau-30.vercel.app/v1/parse \\
  -H "X-API-Key: pf_live_your_key_here" \\
  -F "file=@invoice.pdf"

# Response
{
  "vendor": "Acme Corp",
  "invoice_number": "INV-2024-0042",
  "date": "2024-03-01",
  "due_date": "2024-03-31",
  "total": 4250.00,
  "currency": "USD",
  "line_items": [
    { "description": "API access - Pro plan", "amount": 4250.00 }
  ]
}`}</code>
          </pre>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Pricing
          </h2>
          <p className="text-slate-600 text-center mb-12">
            Pay per parse. No monthly minimums. No surprises.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h3 className="font-bold text-slate-900 text-lg mb-1">
                Starter
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Perfect for prototyping
              </p>
              <div className="text-4xl font-bold text-slate-900 mb-1">
                Free
              </div>
              <p className="text-slate-500 text-sm mb-8">
                50 parses / month
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> PDF + image support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> JSON output
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> REST API
                </li>
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-brand-600 rounded-2xl p-8 text-white shadow-lg scale-105">
              <h3 className="font-bold text-lg mb-1">Pro</h3>
              <p className="text-brand-100 text-sm mb-6">
                For growing businesses
              </p>
              <div className="text-4xl font-bold mb-1">$0.02</div>
              <p className="text-brand-100 text-sm mb-8">per parse</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-brand-200">+</span> Everything in
                  Starter
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-200">+</span> Unlimited parses
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-200">+</span> Webhook delivery
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-200">+</span> Priority support
                </li>
              </ul>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h3 className="font-bold text-slate-900 text-lg mb-1">
                Enterprise
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                For high-volume teams
              </p>
              <div className="text-4xl font-bold text-slate-900 mb-1">
                Custom
              </div>
              <p className="text-slate-500 text-sm mb-8">
                Volume discounts available
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> SLA guarantee
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> Self-hosted option
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">+</span> Dedicated support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Start parsing in 5 minutes
          </h2>
          <p className="text-slate-600 mb-8">
            No credit card required. 50 free parses on us.
          </p>
          <a
            href="/register"
            className="inline-block px-8 py-4 bg-slate-900 text-white rounded-xl font-medium text-lg hover:bg-slate-700 transition-colors"
          >
            Get API Key — Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <p>
          ParseFlow by{" "}
          <a href="https://github.com/auto-co-ai" className="hover:text-slate-600">
            Auto-Co
          </a>{" "}
          &mdash; Built with Next.js, Hono, and Claude
        </p>
      </footer>
    </main>
  );
}
