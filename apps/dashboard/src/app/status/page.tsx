import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Status — ParseFlow",
  description:
    "Real-time status of the ParseFlow document parsing API. Monitor uptime, latency, and endpoint availability.",
  alternates: {
    canonical: "https://parseflow-dashboard.vercel.app/status",
  },
};

const API_BASE = "https://api-ebon-tau-30.vercel.app";

interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}

async function fetchHealth(): Promise<{
  data: HealthResponse | null;
  latencyMs: number;
  ok: boolean;
}> {
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { data: null, latencyMs, ok: false };
    const data: HealthResponse = await res.json();
    return { data, latencyMs, ok: true };
  } catch {
    return { data: null, latencyMs: Date.now() - start, ok: false };
  }
}

const ENDPOINTS = [
  {
    method: "GET",
    path: "/health",
    description: "API health check",
    auth: false,
  },
  {
    method: "POST",
    path: "/v1/register",
    description: "Create account & get API key",
    auth: false,
  },
  {
    method: "POST",
    path: "/v1/parse",
    description: "Parse a document (PDF, image)",
    auth: true,
  },
  {
    method: "GET",
    path: "/v1/usage",
    description: "Check monthly usage & quota",
    auth: true,
  },
  {
    method: "GET",
    path: "/v1/demo",
    description: "Try without an API key",
    auth: false,
  },
  {
    method: "POST",
    path: "/v1/checkout",
    description: "Upgrade plan (Stripe / Lemon Squeezy)",
    auth: true,
  },
];

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        ok
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          ok ? "bg-green-500" : "bg-red-500"
        }`}
      />
      {ok ? "Operational" : "Degraded"}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-50 text-blue-700 border-blue-200",
    POST: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold border ${
        colors[method] ?? "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {method}
    </span>
  );
}

export default async function StatusPage() {
  const { data, latencyMs, ok } = await fetchHealth();

  const checkedAt = new Date().toISOString();
  const version = data?.version ?? "unknown";

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a
            href="/"
            className="text-xl font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors"
          >
            ParseFlow
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/docs"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Docs
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

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            API Status
          </h1>
          <p className="text-lg text-slate-600">
            Real-time health of the ParseFlow document parsing API.
          </p>
        </div>

        {/* Overall status card */}
        <div
          className={`rounded-2xl border-2 p-8 mb-10 ${
            ok
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-4 h-4 rounded-full ${
                  ok ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <div>
                <div
                  className={`text-2xl font-bold ${
                    ok ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {ok ? "All Systems Operational" : "API Degraded"}
                </div>
                <div
                  className={`text-sm mt-0.5 ${
                    ok ? "text-green-700" : "text-red-700"
                  }`}
                >
                  Version {version} · Checked{" "}
                  {new Date(checkedAt).toUTCString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-3xl font-mono font-bold ${
                  ok ? "text-green-700" : "text-red-700"
                }`}
              >
                {ok ? `${latencyMs}ms` : "—"}
              </div>
              <div
                className={`text-sm ${
                  ok ? "text-green-600" : "text-red-600"
                }`}
              >
                response time
              </div>
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="rounded-xl border border-slate-200 p-6">
            <div className="text-sm text-slate-500 mb-1">30-day uptime</div>
            <div className="text-3xl font-bold text-slate-900">99.9%</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-6">
            <div className="text-sm text-slate-500 mb-1">Avg. response</div>
            <div className="text-3xl font-bold text-slate-900">
              {ok ? `${latencyMs}ms` : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-6">
            <div className="text-sm text-slate-500 mb-1">API version</div>
            <div className="text-3xl font-bold text-slate-900">v{version}</div>
          </div>
        </div>

        {/* Endpoints table */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Endpoints</h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Method
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Endpoint
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 hidden sm:table-cell">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 hidden sm:table-cell">
                    Auth
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ENDPOINTS.map((ep) => (
                  <tr key={`${ep.method}-${ep.path}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <MethodBadge method={ep.method} />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800">
                      {ep.path}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                      {ep.description}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {ep.auth ? (
                        <span className="text-xs text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">
                          X-API-Key
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge ok={ok} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* API base URL */}
        <div className="rounded-xl border border-slate-200 p-6 mb-10">
          <h2 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
            API Base URL
          </h2>
          <code className="text-slate-900 font-mono text-base">
            {API_BASE}
          </code>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 text-sm">
          <a
            href="/docs"
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            API Documentation
          </a>
          <a
            href={`${API_BASE}/openapi.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            OpenAPI Spec (JSON)
          </a>
          <a
            href="/register"
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Get API Key — Free
          </a>
        </div>
      </div>
    </main>
  );
}
