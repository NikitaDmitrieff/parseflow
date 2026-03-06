"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api-ebon-tau-30.vercel.app";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    api_key: string;
    organization_id: string;
    plan: string;
    parses_quota: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/v1/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Registration failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyKey() {
    if (!result) return;
    navigator.clipboard.writeText(result.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re in!</h1>
            <p className="text-slate-600">Your API key is ready. Copy it now — we won&apos;t show it again.</p>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between gap-3">
              <code className="text-green-400 font-mono text-sm break-all flex-1">
                {result.api_key}
              </code>
              <button
                onClick={copyKey}
                className="shrink-0 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors font-medium"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm font-medium">
              Save this key — it will not be shown again. Store it in your environment variables or a password manager.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 mb-6 text-sm text-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block text-xs mb-0.5">Plan</span>
                <span className="font-semibold capitalize">{result.plan}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs mb-0.5">Monthly quota</span>
                <span className="font-semibold">{result.parses_quota} parses</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-sm font-mono text-slate-300 mb-6">
            <p className="text-slate-500 mb-2"># Try it now</p>
            <p>
              curl -X POST https://api-ebon-tau-30.vercel.app/v1/parse \<br />
              {"  "}-H &quot;X-API-Key: {result.api_key.substring(0, 16)}...&quot; \<br />
              {"  "}-F &quot;file=@invoice.pdf&quot;
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/docs"
              className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium text-center hover:border-slate-400 transition-colors text-sm"
            >
              Read the docs
            </a>
            <a
              href="/upgrade"
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-medium text-center hover:bg-slate-700 transition-colors text-sm"
            >
              Upgrade to Pro ($9/mo)
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-xl font-bold text-slate-900 block mb-6">
            ParseFlow
          </a>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Get your free API key</h1>
          <p className="text-slate-600">100 parses/month, no credit card required.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Project or company name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating your key..." : "Get API Key — Free"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our{" "}
          <a href="/terms" className="hover:text-slate-600 underline">Terms of Service</a>.
        </p>
      </div>
    </main>
  );
}
