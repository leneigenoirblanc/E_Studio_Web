import React from 'react';
import { TemplateItem, PriceBlockItemProperties } from '../../types';
import { DollarSign } from 'lucide-react';

export interface PriceBlockPropertiesInspectorProps {
  selectedItem: TemplateItem;
  onUpdate: (patch: Partial<TemplateItem>) => void;
}

export const PriceBlockPropertiesInspector: React.FC<PriceBlockPropertiesInspectorProps> = ({
  selectedItem,
  onUpdate,
}) => {
  if (selectedItem.type !== 'price_block') return null;

  const item = selectedItem as PriceBlockItemProperties;

  return (
    <div className="pt-2 border-t border-slate-200 space-y-3">
      <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400 flex items-center gap-1">
        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
        <span>Bloc Prix & Centimes Flottants</span>
      </h4>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-slate-500">Prix Test / Fallback</label>
          <input
            type="number"
            step="0.01"
            value={item.fallback_price ?? 29.99}
            onChange={(e) => onUpdate({ fallback_price: parseFloat(e.target.value) || 0 })}
            className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500">Séparateur Décimal</label>
          <select
            value={item.decimal_separator || ','}
            onChange={(e) => onUpdate({ decimal_separator: e.target.value as any })}
            className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs cursor-pointer"
          >
            <option value=",">Virgule (ex: 29,99)</option>
            <option value=".">Point (ex: 29.99)</option>
          </select>
        </div>
      </div>

      {/* Currency Symbol & Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-slate-500">Symbole Monnaie</label>
          <input
            type="text"
            value={item.currency_symbol || '€'}
            onChange={(e) => onUpdate({ currency_symbol: e.target.value })}
            className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500">Position Devise</label>
          <select
            value={item.currency_position || 'after'}
            onChange={(e) => onUpdate({ currency_position: e.target.value as any })}
            className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs cursor-pointer"
          >
            <option value="after">Après les centimes (29,99 €)</option>
            <option value="before">Avant le prix (€ 29,99)</option>
            <option value="superscript">En exposant haut (29,99 €^)</option>
          </select>
        </div>
      </div>

      {/* Integer Part Styling */}
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
        <span className="text-[11px] font-bold text-slate-700 block">Partie Entière (Euros)</span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500">Taille (pt)</label>
            <input
              type="number"
              step="1"
              min="8"
              max="144"
              value={item.integer_style?.font_size_pt || 28}
              onChange={(e) =>
                onUpdate({
                  integer_style: {
                    ...(item.integer_style || {}),
                    font_size_pt: parseFloat(e.target.value) || 28,
                  },
                })
              }
              className="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500">Graisse</label>
            <select
              value={item.integer_style?.font_weight || 'bold'}
              onChange={(e) =>
                onUpdate({
                  integer_style: {
                    ...(item.integer_style || {}),
                    font_weight: e.target.value as any,
                  },
                })
              }
              className="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded text-xs cursor-pointer"
            >
              <option value="normal">Normal (400)</option>
              <option value="600">Demi-Gras (600)</option>
              <option value="bold">Gras (700)</option>
              <option value="800">Extra-Gras (800)</option>
              <option value="900">Black (900)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Decimal Part Styling */}
      <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 space-y-2">
        <span className="text-[11px] font-bold text-blue-900 block">Centimes Flottants (Décimales)</span>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-slate-500">Taille (pt)</label>
            <input
              type="number"
              step="1"
              min="6"
              max="96"
              value={item.decimal_style?.font_size_pt || 14}
              onChange={(e) =>
                onUpdate({
                  decimal_style: {
                    ...(item.decimal_style || {}),
                    font_size_pt: parseFloat(e.target.value) || 14,
                  },
                })
              }
              className="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500">Positionnement</label>
            <select
              value={item.decimal_style?.baseline_shift || 'superscript'}
              onChange={(e) =>
                onUpdate({
                  decimal_style: {
                    ...(item.decimal_style || {}),
                    baseline_shift: e.target.value as any,
                  },
                })
              }
              className="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded text-xs cursor-pointer"
            >
              <option value="superscript">Exposant (Flottant haut)</option>
              <option value="baseline">Ligne de base</option>
              <option value="subscript">Indice (bas)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500">Graisse</label>
            <select
              value={item.decimal_style?.font_weight || 'bold'}
              onChange={(e) =>
                onUpdate({
                  decimal_style: {
                    ...(item.decimal_style || {}),
                    font_weight: e.target.value as any,
                  },
                })
              }
              className="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded text-xs cursor-pointer"
            >
              <option value="normal">Normal</option>
              <option value="bold">Gras</option>
              <option value="800">Extra-Gras</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
