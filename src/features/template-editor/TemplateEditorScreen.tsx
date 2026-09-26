import React from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function TemplateEditorScreen() {
  const { templates } = useAppStore();
  const activeTemplate = templates[0];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Template editor</h2>
            <p className="mt-1 text-sm text-slate-600">
              Live layout context for the canonical editor module.
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {activeTemplate?.status ?? 'draft'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Canvas overview</h3>
            <span className="text-xs text-slate-500">{activeTemplate?.name}</span>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="mx-auto h-56 w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-inner" />
          </div>

          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">Size: {activeTemplate?.widthMm ?? 0}×{activeTemplate?.heightMm ?? 0} mm</div>
            <div className="rounded-xl bg-slate-50 p-3">Objects: {activeTemplate?.items.length ?? 0}</div>
            <div className="rounded-xl bg-slate-50 p-3">Version: {activeTemplate?.version ?? 0}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Editor services</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>• transform engine and snapping</li>
            <li>• ruler and alignment constraints</li>
            <li>• field binding and validation</li>
            <li>• save and audit trail integration</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
