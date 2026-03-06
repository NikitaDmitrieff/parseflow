export default function UpgradeCancelPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">No worries</h1>
        <p className="text-slate-600 mb-8">
          You&apos;re still on your current plan. Upgrade whenever you&apos;re ready.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/"
            className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:border-slate-400 transition-colors"
          >
            Back to home
          </a>
          <a
            href="/upgrade"
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
          >
            Try again
          </a>
        </div>
      </div>
    </main>
  );
}
