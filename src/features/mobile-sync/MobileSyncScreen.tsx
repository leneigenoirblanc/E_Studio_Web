import React from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function MobileSyncScreen() {
  const { syncJobs } = useAppStore();

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Mobile sync and device intake</h2>
        <p className="mt-2 text-sm text-slate-600">
          Pairing, queue status, and recovery flows are represented as explicit operational states.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {syncJobs.map((job) => (
          <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{job.type}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium uppercase text-slate-700">
                {job.status}
              </span>
            </div>
            <div className="mt-4 text-lg font-bold text-slate-900">{job.id}</div>
            <div className="mt-2 text-sm text-slate-600">
              Updated {new Date(job.updatedAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
