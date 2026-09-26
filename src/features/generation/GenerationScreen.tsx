import React from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function GenerationScreen() {
  const { templates, products, syncJobs } = useAppStore();

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Generation and print preparation</h2>
        <p className="mt-2 text-sm text-slate-600">
          Import, map, preview, and export operations are coordinated here as a deterministic production workflow.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Template</div>
          <div className="mt-3 text-lg font-bold text-slate-900">{templates[0]?.name ?? 'No template'}</div>
          <div className="mt-2 text-sm text-slate-600">Ready for production execution.</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Products</div>
          <div className="mt-3 text-lg font-bold text-slate-900">{products.length}</div>
          <div className="mt-2 text-sm text-slate-600">Records mapped to the current generation pass.</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sync jobs</div>
          <div className="mt-3 text-lg font-bold text-slate-900">{syncJobs.length}</div>
          <div className="mt-2 text-sm text-slate-600">Operational queue ready for review.</div>
        </div>
      </div>
    </section>
  );
}
