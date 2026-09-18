import React, { useState } from 'react';
import { DOMAIN_FIELDS, DOMAIN_FIELD_MAP, resolveCanonicalKey } from '../domainFields';
import { ProductRecord } from '../types';
import { Check, ArrowRight, Table, AlertCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';

export interface DataMappingModalProps {
  rawHeaders: string[];
  rawRows: any[];
  onApplyMapping: (mappedProducts: ProductRecord[]) => void;
  onCancel: () => void;
}

export const DataMappingModal: React.FC<DataMappingModalProps> = ({
  rawHeaders,
  rawRows,
  onApplyMapping,
  onCancel,
}) => {
  // Mapping: rawHeader -> canonical DomainField key (or '__ignore__')
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    rawHeaders.forEach((h) => {
      const canonical = resolveCanonicalKey(h);
      init[h] = canonical || '__custom__';
    });
    return init;
  });

  const [previewRowCount] = useState(3);

  const handleFieldChange = (header: string, targetKey: string) => {
    setMapping((prev) => ({ ...prev, [header]: targetKey }));
  };

  const autoMap = () => {
    const auto: Record<string, string> = {};
    rawHeaders.forEach((h) => {
      const canonical = resolveCanonicalKey(h);
      auto[h] = canonical || '__custom__';
    });
    setMapping(auto);
  };

  const handleConfirm = () => {
    const converted: ProductRecord[] = rawRows.map((rawRow, idx) => {
      const prod: ProductRecord = {
        id: `ROW-${idx + 1}`,
        ITEMNAME: `Article #${idx + 1}`,
        SELLING_PRICE: 0,
      };

      rawHeaders.forEach((header) => {
        const target = mapping[header];
        if (!target || target === '__ignore__') return;

        const val = rawRow[header];
        if (val === undefined || val === null) return;

        if (target === '__custom__') {
          // store as clean uppercase custom key
          const cleanKey = header.trim().toUpperCase().replace(/[\s\.\-]+/g, '_');
          prod[cleanKey] = val;
        } else {
          const fieldDef = DOMAIN_FIELD_MAP.get(target);
          if (fieldDef?.numeric) {
            const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0;
            (prod as any)[target] = num;
          } else {
            (prod as any)[target] = String(val).trim();
          }
        }
      });

      // Provide sensible defaults if critical fields are empty
      if (!prod.ITEMNAME || prod.ITEMNAME === `Article #${idx + 1}`) {
        prod.ITEMNAME = prod.PARTNO ? `Article ${prod.PARTNO}` : `Article #${idx + 1}`;
      }
      if (!prod.STORE_NAME) prod.STORE_NAME = 'POINT DE VENTE';

      return prod;
    });

    onApplyMapping(converted);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Assistant de Correspondance des Données (Mapping)</h2>
              <p className="text-xs text-slate-500">
                Faites correspondre les colonnes de votre fichier Excel/CSV avec les variables d'étiquettes.
              </p>
            </div>
          </div>
          <button
            onClick={autoMap}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Auto-détection</span>
          </button>
        </div>

        {/* Content: Mapping List & Live Sample Preview */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <strong>Compatibilité Universelle :</strong> Chaque colonne peut être liée à un champ canonique
              (Prix, Code-barres, Nom, etc.), conservée comme attribut personnalisé accessible dans l'éditeur, ou ignorée.
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Colonne Fichier Excel</th>
                  <th className="py-2.5 px-3">Exemple de donnée (Ligne 1)</th>
                  <th className="py-2.5 px-3 w-8 text-center"></th>
                  <th className="py-2.5 px-3">Champ Cible Gabarit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rawHeaders.map((header) => {
                  const sampleVal = rawRows[0] ? String(rawRows[0][header] ?? '') : '';
                  const targetVal = mapping[header] || '__custom__';

                  return (
                    <tr key={header} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                          {header}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                        {sampleVal ? `"${sampleVal}"` : <span className="italic text-slate-400">&lt;vide&gt;</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300">
                        <ArrowRight className="w-3.5 h-3.5 inline" />
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={targetVal}
                          onChange={(e) => handleFieldChange(header, e.target.value)}
                          className={`w-full py-1 px-2 border rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 ${
                            targetVal === '__ignore__'
                              ? 'bg-slate-100 border-slate-200 text-slate-400'
                              : targetVal === '__custom__'
                              ? 'bg-amber-50/50 border-amber-300 text-amber-900 font-semibold'
                              : 'bg-blue-50/50 border-blue-300 text-blue-900 font-semibold'
                          }`}
                        >
                          <optgroup label="Champs Standard du Commerce">
                            {DOMAIN_FIELDS.map((df) => (
                              <option key={df.key} value={df.key}>
                                {df.label} [{df.key}]
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Options d'importation">
                            <option value="__custom__">
                              ★ Conserver comme Clé Personnalisée ({header.trim().toUpperCase().replace(/[\s\.\-]+/g, '_')})
                            </option>
                            <option value="__ignore__">✕ Ignorer cette colonne</option>
                          </optgroup>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick preview of first rows */}
          <div>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Table className="w-3.5 h-3.5 text-slate-500" />
              Aperçu des premières données ({rawRows.length} lignes totales détectées) :
            </span>
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-36">
              <table className="min-w-full text-[11px] text-left">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    {rawHeaders.slice(0, 8).map((h) => (
                      <th key={h} className="p-1.5 border-r border-slate-200">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                  {rawRows.slice(0, previewRowCount).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {rawHeaders.slice(0, 8).map((h) => (
                        <td key={h} className="p-1.5 text-slate-600 border-r border-slate-200 truncate max-w-[120px]">
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {rawRows.length} articles prêts à être injectés dans la planche d'impression.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Appliquer et Importer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
