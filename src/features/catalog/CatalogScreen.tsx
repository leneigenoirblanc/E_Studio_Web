import React from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function CatalogScreen() {
  const { products } = useAppStore();

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Catalog and product management</h2>
        <p className="mt-2 text-sm text-slate-600">
          Canonical product records, quality checks, and review status for downstream generation flows.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">SKU</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Price</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 text-slate-600">{product.PARTNO ?? product.id}</td>
                <td className="px-4 py-3 text-slate-600">{product.ITEMNAME}</td>
                <td className="px-4 py-3 text-slate-600">${product.SELLING_PRICE ?? 0}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    valid
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
