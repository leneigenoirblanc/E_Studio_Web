import React from 'react';
import { TemplateItem } from '../types';
import { DOMAIN_FIELDS } from '../domainFields';
import { Trash2, Copy, ArrowUp, ArrowDown, Lock, Unlock } from 'lucide-react';

interface PropertyInspectorProps {
  selectedItem: TemplateItem | null;
  onUpdateItem: (updatedItem: TemplateItem) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onReorderItem: (id: string, delta: number) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  selectedItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onReorderItem,
}) => {
  if (!selectedItem) {
    return (
      <div className="w-72 bg-white border-l border-slate-200 p-4 text-slate-500 text-sm flex flex-col items-center justify-center text-center h-full select-none">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700">Aucun élément sélectionné</p>
        <p className="text-xs text-slate-400 mt-1">Cliquez sur un objet sur le gabarit pour modifier ses propriétés et liaisons de données.</p>
      </div>
    );
  }

  const update = (patch: Partial<TemplateItem>) => {
    onUpdateItem({ ...selectedItem, ...patch } as TemplateItem);
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 h-full flex flex-col text-xs text-slate-700 select-none overflow-y-auto">
      {/* Header with quick actions */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Élément</span>
          <h3 className="font-bold text-slate-800 capitalize text-sm">{selectedItem.type.replace('_', ' ')}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => update({ locked: !selectedItem.locked })}
            title={selectedItem.locked ? "Déverrouiller" : "Verrouiller"}
            className={`p-1.5 rounded transition ${selectedItem.locked ? 'bg-amber-100 text-amber-800' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            {selectedItem.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onReorderItem(selectedItem.id, 1)}
            title="Avancer (z-index)"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onReorderItem(selectedItem.id, -1)}
            title="Reculer (z-index)"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDuplicateItem(selectedItem.id)}
            title="Dupliquer"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteItem(selectedItem.id)}
            title="Supprimer"
            className="p-1.5 rounded hover:bg-rose-100 text-rose-600 ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Geometry (mm) */}
        <div>
          <h4 className="font-bold text-slate-900 mb-2 uppercase text-[10px] tracking-wider text-slate-400">
            Géométrie (Millimètres)
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500">X (mm)</label>
              <input
                type="number"
                step="0.5"
                value={selectedItem.x_mm}
                onChange={(e) => update({ x_mm: parseFloat(e.target.value) || 0 })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Y (mm)</label>
              <input
                type="number"
                step="0.5"
                value={selectedItem.y_mm}
                onChange={(e) => update({ y_mm: parseFloat(e.target.value) || 0 })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Largeur (mm)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={selectedItem.w_mm}
                onChange={(e) => update({ w_mm: Math.max(1, parseFloat(e.target.value) || 1) })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Hauteur (mm)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={selectedItem.h_mm}
                onChange={(e) => update({ h_mm: Math.max(1, parseFloat(e.target.value) || 1) })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Rotation (°)</label>
              <input
                type="number"
                step="15"
                value={selectedItem.rotation || 0}
                onChange={(e) => update({ rotation: parseFloat(e.target.value) || 0 })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Plan (Z-Index)</label>
              <input
                type="number"
                value={selectedItem.z_index || 1}
                onChange={(e) => update({ z_index: parseInt(e.target.value, 10) || 1 })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Data Binding Key (Clé de liaison) */}
        {selectedItem.type !== 'shape' && selectedItem.type !== 'ellipse' && selectedItem.type !== 'line' && (
          <div className="pt-2 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
              Liaison de Données (Binding)
            </h4>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-slate-500">Champ Canonique</label>
                <select
                  value={selectedItem.binding_key || ''}
                  onChange={(e) => update({ binding_key: e.target.value || undefined })}
                  className="w-full mt-0.5 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="">-- Aucun (Texte statique) --</option>
                  {DOMAIN_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.key} ({f.label})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Ou Clé Personnalisée</label>
                <input
                  type="text"
                  placeholder="ex: CODE_RAYON, PROMO_TAG..."
                  value={selectedItem.binding_key || ''}
                  onChange={(e) => update({ binding_key: e.target.value.trim() || undefined })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Type-Specific Properties */}
        {selectedItem.type === 'text' && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
              Propriétés du Texte
            </h4>
            <div>
              <label className="text-[11px] text-slate-500">Texte / Valeur par défaut</label>
              <textarea
                rows={2}
                value={selectedItem.text}
                onChange={(e) => update({ text: e.target.value })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Police</label>
                <select
                  value={selectedItem.font_family}
                  onChange={(e) => update({ font_family: e.target.value })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                >
                  <option value="Plus Jakarta Sans">Sans-Serif</option>
                  <option value="Oswald">Oswald (Prix)</option>
                  <option value="JetBrains Mono">Monospace</option>
                  <option value="serif">Serif</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Taille (pt)</label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="72"
                  value={selectedItem.font_size_pt}
                  onChange={(e) => update({ font_size_pt: parseFloat(e.target.value) || 10 })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Graisse</label>
                <select
                  value={selectedItem.font_weight}
                  onChange={(e) => update({ font_weight: e.target.value as any })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                >
                  <option value="normal">Normale (400)</option>
                  <option value="600">Semi-Gras (600)</option>
                  <option value="bold">Gras (700)</option>
                  <option value="800">Extra-Gras (800)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Alignement H</label>
                <select
                  value={selectedItem.alignment}
                  onChange={(e) => update({ alignment: e.target.value as any })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                >
                  <option value="left">Gauche</option>
                  <option value="center">Centré</option>
                  <option value="right">Droite</option>
                  <option value="justify">Justifié</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Couleur texte</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="color"
                    value={selectedItem.text_color || '#000000'}
                    onChange={(e) => update({ text_color: e.target.value })}
                    className="w-7 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedItem.text_color || '#000000'}
                    onChange={(e) => update({ text_color: e.target.value })}
                    className="w-20 px-1 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Fond</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="color"
                    value={selectedItem.fill_color || '#ffffff'}
                    onChange={(e) => update({ fill_color: e.target.value })}
                    className="w-7 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                  />
                  <button
                    onClick={() => update({ fill_color: undefined })}
                    className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                  >
                    Transparent
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedItem.type === 'shape' && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
              Forme (Rectangle)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Couleur Fond</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="color"
                    value={selectedItem.fill_color || '#ffffff'}
                    onChange={(e) => update({ fill_color: e.target.value })}
                    className="w-7 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedItem.fill_color || '#ffffff'}
                    onChange={(e) => update({ fill_color: e.target.value })}
                    className="w-18 px-1 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Bordure</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="color"
                    value={selectedItem.border_color || '#000000'}
                    onChange={(e) => update({ border_color: e.target.value })}
                    className="w-7 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedItem.border_color || '#000000'}
                    onChange={(e) => update({ border_color: e.target.value })}
                    className="w-18 px-1 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Épaisseur bord (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={selectedItem.border_width || 1}
                  onChange={(e) => update({ border_width: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Rayon coins (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={selectedItem.corner_radius || 0}
                  onChange={(e) => update({ corner_radius: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {selectedItem.type === 'barcode' && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
              Paramètres Code-Barres
            </h4>
            <div>
              <label className="text-[11px] text-slate-500">Type de Code-barres</label>
              <select
                value={selectedItem.barcode_type}
                onChange={(e) => update({ barcode_type: e.target.value as any })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
              >
                <option value="ean13">EAN-13 (Standard grande distribution)</option>
                <option value="code128">Code 128 (Logistique & Alphanumérique)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Code par défaut (si non lié)</label>
              <input
                type="text"
                value={selectedItem.code}
                onChange={(e) => update({ code: e.target.value })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="text-[11px] text-slate-600">Afficher le texte sous les barres</label>
              <input
                type="checkbox"
                checked={selectedItem.show_text}
                onChange={(e) => update({ show_text: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {selectedItem.type === 'qrcode' && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
              Paramètres QR Code
            </h4>
            <div>
              <label className="text-[11px] text-slate-500">Contenu / URL</label>
              <input
                type="text"
                value={selectedItem.content}
                onChange={(e) => update({ content: e.target.value })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Couleur modules</label>
                <input
                  type="color"
                  value={selectedItem.module_color || '#000000'}
                  onChange={(e) => update({ module_color: e.target.value })}
                  className="w-full h-7 p-0 rounded border border-slate-300 cursor-pointer mt-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Couleur fond</label>
                <input
                  type="color"
                  value={selectedItem.background_color || '#ffffff'}
                  onChange={(e) => update({ background_color: e.target.value })}
                  className="w-full h-7 p-0 rounded border border-slate-300 cursor-pointer mt-0.5"
                />
              </div>
            </div>
          </div>
        )}

        {selectedItem.type === 'tier_price' && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
              Paliers Cash & Carry
            </h4>
            <div>
              <label className="text-[11px] text-slate-500">Palier Cible (1 à 10)</label>
              <select
                value={selectedItem.primary_tier}
                onChange={(e) => update({ primary_tier: parseInt(e.target.value, 10) || 1 })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    Palier #{num} (quantité seuil {num})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Préfixe texte</label>
              <input
                type="text"
                value={selectedItem.prefix_text}
                onChange={(e) => update({ prefix_text: e.target.value })}
                placeholder="ex: À partir de, Dès, Lot de"
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Unité / Devise</label>
              <input
                type="text"
                value={selectedItem.unit_label}
                onChange={(e) => update({ unit_label: e.target.value })}
                placeholder="FCFA, €, $, CHF"
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="text-[11px] text-slate-600">Palier Obligatoire (Strict)</label>
              <input
                type="checkbox"
                checked={selectedItem.strict_required}
                onChange={(e) => update({ strict_required: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {selectedItem.type === 'line' && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
              Ligne Séparatrice
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Couleur</label>
                <input
                  type="color"
                  value={selectedItem.color || '#000000'}
                  onChange={(e) => update({ color: e.target.value })}
                  className="w-full h-7 p-0 rounded border border-slate-300 cursor-pointer mt-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Épaisseur (mm)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={selectedItem.thickness || 1}
                  onChange={(e) => update({ thickness: parseFloat(e.target.value) || 1 })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Style de trait</label>
              <select
                value={selectedItem.style}
                onChange={(e) => update({ style: e.target.value as any })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
              >
                <option value="solid">Plein (Solid)</option>
                <option value="dashed">Tirets (Dashed)</option>
                <option value="dotted">Pointillés (Dotted)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
