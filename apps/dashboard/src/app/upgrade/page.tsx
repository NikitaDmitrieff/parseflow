"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api-ebon-tau-30.vercel.app";

export default function UpgradePage() {
  const [apiKey, setApiKey] = useState("");
  const [plan, setPlan] = useState<"pro" | "scale">("pro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans = {
    pro: { label: "Pro", price: "$9/mo", quota: "500 parses/mo", highlight: false },
    scale: { label: "Scale", price: "$29/mo", quota: "5,000 parses/mo", highlight: true },
  };

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/v1/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey.trim(),
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <a href="/" className="text-xl font-bold text-slate-900 block mb-6">ParseFlow</a>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Upgrade your plan</h1>
          <p className="text-slate-600">More parses, more power. Cancel anytime.</p>
        </div>

        {/* Plan selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(Object.entries(plans) as [keyof typeof plans, typeof plans["pro"]][]).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPlan(key)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                plan === key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 text-slate-700 hover:border-slate-400"
              }`}
            >
              <div className="font-bold text-lg">{p.label}</div>
              <div className={`text-2xl font-bold my-1 ${plan === key ? "text-white" : "text-slate-900"}`}>
                {p.price}
              </div>
              <div className={`text-sm ${plan === key ? "text-slate-300" : "text-slate-500"}`}>
                {p.quota}
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleUpgrade} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-1.5">
              Your API key
            </label>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="pf_live_..."
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Don&apos;t have a key yet?{" "}
              <a href="/register" className="text-slate-600 underline hover:text-slate-900">
                Get one free
              </a>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? "Redirecting to checkout..."
              : `Upgrade to ${plans[plan].label} — ${plans[plan].price}`}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Secured by Stripe. Cancel anytime from your billing portal.
        </p>
      </div>
    </main>
  );
}
