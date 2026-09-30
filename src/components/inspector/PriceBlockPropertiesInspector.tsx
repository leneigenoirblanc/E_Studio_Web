import React from 'react';
import { TemplateItem, PriceBlockItemProperties } from '../../types';
import { DollarSign, Sparkles } from 'lucide-react';
import { ContrastAdvisorWidget } from './ContrastAdvisorWidget';

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

  const applyRetailProfile = (profile: 'EUR' | 'USD' | 'FCFA' | 'GBP' | 'CAD' | 'CHF') => {
    switch (profile) {
      case 'EUR':
        onUpdate({
          currency_symbol: '€',
          currency_position: 'after',
          decimal_separator: ',',
          decimal_style: {
            font_size_pt: Math.round((item.integer_style?.font_size_pt || 28) * 0.52),
            font_weight: 'bold',
            text_color: item.integer_style?.text_color || '#000000',
            baseline_shift: 'superscript',
          },
        });
        break;
      case 'USD':
        onUpdate({
          currency_symbol: '$',
          currency_position: 'before',
          decimal_separator: '.',
          decimal_style: {
            font_size_pt: Math.round((item.integer_style?.font_size_pt || 28) * 0.55),
            font_weight: 'bold',
            text_color: item.integer_style?.text_color || '#000000',
            baseline_shift: 'superscript',
          },
        });
        break;
      case 'FCFA':
        onUpdate({
          currency_symbol: 'FCFA',
          currency_position: 'after',
          decimal_separator: ',',
          fallback_price: 2500,
          decimal_style: {
            font_size_pt: Math.round((item.integer_style?.font_size_pt || 28) * 0.45),
            font_weight: 'bold',
            text_color: item.integer_style?.text_color || '#000000',
            baseline_shift: 'normal',
          },
        });
        break;
      case 'GBP':
        onUpdate({
          currency_symbol: '£',
          currency_position: 'before',
          decimal_separator: '.',
          decimal_style: {
            font_size_pt: Math.round((item.integer_style?.font_size_pt || 28) * 0.52),
            font_weight: 'bold',
            text_color: item.integer_style?.text_color || '#000000',
            baseline_shift: 'superscript',
          },
        });
        break;
      case 'CAD':
        onUpdate({
          currency_symbol: '$',
          currency_position: 'after',
          decimal_separator: ',',
          decimal_style: {
            font_size_pt: Math.round((item.integer_style?.font_size_pt || 28) * 0.52),
            font_weight: 'bold',
            text_color: item.integer_style?.text_color || '#000000',
            baseline_shift: 'superscript',
          },
        });
        break;
      case 'CHF':
        onUpdate({
          currency_symbol: 'CHF',
          currency_position: 'after',
          decimal_separator: '.',
          decimal_style: {
            font_size_pt: Math.round((item.integer_style?.font_size_pt || 28) * 0.52),
            font_weight: 'bold',
            text_color: item.integer_style?.text_color || '#000000',
            baseline_shift: 'superscript',
          },
        });
        break;
    }
  };

  const currentColor = item.integer_style?.text_color || '#000000';

  return (
    <div className="pt-2 border-t border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400 flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bloc Prix & Centimes Flottants</span>
        </h4>
      </div>

      {/* Profils Marchés / Devises Prédéfinis */}
      <div>
        <label className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Profils Retail Prédéfinis</span>
        </label>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'EUR', label: 'Euro (29,99 €)' },
            { id: 'USD', label: 'USD ($29.99)' },
            { id: 'FCFA', label: 'FCFA (2 500 F)' },
            { id: 'GBP', label: 'Livre (£29.99)' },
            { id: 'CAD', label: 'CAD (29,99 $)' },
            { id: 'CHF', label: 'Suisse (29.95)' },
          ].map((prof) => (
            <button
              key={prof.id}
              type="button"
              onClick={() => applyRetailProfile(prof.id as any)}
              className="px-1.5 py-1 text-[10px] font-medium bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded transition text-center truncate cursor-pointer"
            >
              {prof.label}
            </button>
          ))}
        </div>
      </div>

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
            className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold"
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

      {/* Color picker for Price */}
      <div>
        <label className="text-[11px] text-slate-500">Couleur du Prix</label>
        <div className="flex items-center gap-1.5 mt-0.5">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => {
              const col = e.target.value;
              onUpdate({
                integer_style: { ...(item.integer_style || {}), text_color: col },
                decimal_style: { ...(item.decimal_style || {}), text_color: col },
                currency_style: { ...(item.currency_style || {}), text_color: col },
              });
            }}
            className="w-7 h-6 p-0 rounded border border-slate-300 cursor-pointer"
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => {
              const col = e.target.value;
              onUpdate({
                integer_style: { ...(item.integer_style || {}), text_color: col },
                decimal_style: { ...(item.decimal_style || {}), text_color: col },
                currency_style: { ...(item.currency_style || {}), text_color: col },
              });
            }}
            className="flex-1 px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono uppercase"
          />
        </div>
      </div>

      {/* WCAG Contrast Advisor */}
      <ContrastAdvisorWidget
        textColor={currentColor}
        bgColor="#ffffff"
        fontSizePt={item.integer_style?.font_size_pt || 28}
        isBold={true}
        onApplyRecommended={(recColor) => {
          onUpdate({
            integer_style: { ...(item.integer_style || {}), text_color: recColor },
            decimal_style: { ...(item.decimal_style || {}), text_color: recColor },
            currency_style: { ...(item.currency_style || {}), text_color: recColor },
          });
        }}
      />

      {/* Integer Part Styling */}
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
        <span className="text-[11px] font-bold text-slate-700 block">Partie Entière</span>
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
