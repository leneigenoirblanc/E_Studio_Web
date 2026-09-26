import React from 'react';

export function DashboardScreen() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Templates', value: '12', tone: 'blue' },
          { label: 'Products', value: '8,420', tone: 'emerald' },
          { label: 'Sync Jobs', value: '4', tone: 'amber' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
            <div className={`mt-3 text-3xl font-extrabold text-${item.tone}-600`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Rebuild focus</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>• Domain-driven architecture with explicit module ownership.</li>
          <li>• Local-first persistence and explicit sync queue handling.</li>
          <li>• Workflow-led UI with predictable empty, loading, warning, and retry states.</li>
          <li>• Secure backend foundations and production-ready operations model.</li>
        </ul>
      </div>
    </section>
  );
}
