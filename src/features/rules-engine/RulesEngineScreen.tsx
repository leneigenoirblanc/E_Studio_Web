import React from 'react';

export function RulesEngineScreen() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Rules engine</h2>
      <p className="mt-2 text-sm text-slate-600">
        Rules evaluation, display conditions, conflict handling, and audit trails should live in a deterministic
        engine rather than embedded in UI flows.
      </p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Scenario: show promo price only when promotion is active and product has a valid barcode.
      </div>
    </section>
  );
}
