import React from 'react';
import { TemplateItem, TextItemProperties, ShapeItemProperties, BarcodeItemProperties } from '../types';
import { DOMAIN_FIELDS } from '../domainFields';
import {
  AVAILABLE_FONTS,
  FONT_WEIGHTS,
  TEXT_ALIGNMENTS,
  VERTICAL_ALIGNMENTS,
  TEXT_TRANSFORMS,
  extractCommonProperties,
} from '../models/TemplateObjectModel';
import {
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Layers,
  Palette,
  Type,
  Maximize2,
  Box,
  Sliders,
} from 'lucide-react';

interface PropertyInspectorProps {
  selectedItems: TemplateItem[];
  onUpdateItem: (updatedItem: TemplateItem) => void;
  onUpdateMultipleItems?: (updatedItems: TemplateItem[]) => void;
  onDeleteItem: (id: string) => void;
  onDeleteMultipleItems?: (ids: string[]) => void;
  onDuplicateItem: (id: string) => void;
  onDuplicateMultipleItems?: (ids: string[]) => void;
  onReorderItem: (id: string, delta: number) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  selectedItems,
  onUpdateItem,
  onUpdateMultipleItems,
  onDeleteItem,
  onDeleteMultipleItems,
  onDuplicateItem,
  onDuplicateMultipleItems,
  onReorderItem,
}) => {
  const count = selectedItems.length;

  if (count === 0) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 p-6 text-slate-500 text-sm flex flex-col items-center justify-center text-center h-full select-none">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Sliders className="w-6 h-6" />
        </div>
        <p className="font-semibold text-slate-700">Aucun élément sélectionné</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Sélectionnez un ou plusieurs objets (en maintenant Shift ou par rectangle de sélection) pour éditer leurs paramètres.
        </p>
      </div>
    );
  }

  // MULTI-SELECTION MODE
  if (count > 1) {
    const common = extractCommonProperties(selectedItems);

    const updateMulti = (patch: Partial<any>) => {
      const updated = selectedItems.map((it) => ({
        ...it,
        ...patch,
      }));
      if (onUpdateMultipleItems) {
        onUpdateMultipleItems(updated);
      } else {
        updated.forEach((it) => onUpdateItem(it));
      }
    };

    const handleDeleteAll = () => {
      if (onDeleteMultipleItems) {
        onDeleteMultipleItems(selectedItems.map((it) => it.id));
      } else {
        selectedItems.forEach((it) => onDeleteItem(it.id));
      }
    };

    const handleDuplicateAll = () => {
      if (onDuplicateMultipleItems) {
        onDuplicateMultipleItems(selectedItems.map((it) => it.id));
      } else {
        selectedItems.forEach((it) => onDuplicateItem(it.id));
      }
    };

    const allLocked = selectedItems.every((it) => it.locked);

    return (
      <div className="w-80 bg-white border-l border-slate-200 h-full flex flex-col text-xs text-slate-700 select-none overflow-y-auto">
        {/* Multi-Selection Header */}
        <div className="p-3 border-b border-slate-200 bg-blue-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              {count}
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800">Sélection Multiple</span>
              <h3 className="font-bold text-slate-900 text-xs">Propriétés Communes</h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => updateMulti({ locked: !allLocked })}
              title={allLocked ? 'Déverrouiller tout' : 'Verrouiller tout'}
              className={`p-1.5 rounded transition ${allLocked ? 'bg-amber-100 text-amber-800' : 'hover:bg-slate-200 text-slate-600'}`}
            >
              {allLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDuplicateAll}
              title="Dupliquer la sélection"
              className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteAll}
              title="Supprimer la sélection"
              className="p-1.5 rounded hover:bg-rose-100 text-rose-600 ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Dimensions communes */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2 uppercase text-[10px] tracking-wider text-slate-400 flex items-center gap-1">
              <Box className="w-3 h-3" />
              <span>Dimensions Communes (mm)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Largeur (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  placeholder={common.w_mm !== undefined ? String(common.w_mm) : 'Mixte'}
                  value={common.w_mm !== undefined ? common.w_mm : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) updateMulti({ w_mm: val });
                  }}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Hauteur (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  placeholder={common.h_mm !== undefined ? String(common.h_mm) : 'Mixte'}
                  value={common.h_mm !== undefined ? common.h_mm : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) updateMulti({ h_mm: val });
                  }}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Rotation (°)</label>
                <input
                  type="number"
                  step="15"
                  placeholder={common.rotation !== undefined ? String(common.rotation) : 'Mixte'}
                  value={common.rotation !== undefined ? common.rotation : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) updateMulti({ rotation: val });
                  }}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Typographie commune */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2 uppercase text-[10px] tracking-wider text-slate-400 flex items-center gap-1">
              <Type className="w-3 h-3" />
              <span>Typographie Commune</span>
            </h4>
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] text-slate-500">Police de Caractères</label>
                <select
                  value={common.font_family || ''}
                  onChange={(e) => {
                    if (e.target.value) updateMulti({ font_family: e.target.value });
                  }}
                  className="w-full mt-0.5 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                >
                  <option value="">{common.font_family ? common.font_family : '-- Conserver / Mixte --'}</option>
                  {AVAILABLE_FONTS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500">Taille (pt)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="100"
                    placeholder={common.font_size_pt !== undefined ? String(common.font_size_pt) : 'Mixte'}
                    value={common.font_size_pt !== undefined ? common.font_size_pt : ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) updateMulti({ font_size_pt: val });
                    }}
                    className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Graisse</label>
                  <select
                    value={common.font_weight || ''}
                    onChange={(e) => {
                      if (e.target.value) updateMulti({ font_weight: e.target.value });
                    }}
                    className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                  >
                    <option value="">{common.font_weight || '-- Mixte --'}</option>
                    {FONT_WEIGHTS.map((fw) => (
                      <option key={fw.value} value={fw.value}>
                        {fw.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Style & Décoration Multi */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500">Style Itlique</label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={() => updateMulti({ font_style: common.font_style === 'italic' ? 'normal' : 'italic' })}
                      className={`flex-1 py-1 text-center font-serif italic text-xs rounded border ${common.font_style === 'italic' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      Italique
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Décoration</label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={() => updateMulti({ text_decoration: common.text_decoration === 'underline' ? 'none' : 'underline' })}
                      className={`flex-1 py-1 text-center underline text-xs rounded border ${common.text_decoration === 'underline' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}
                      title="Souligné"
                    >
                      U
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMulti({ text_decoration: common.text_decoration === 'line-through' ? 'none' : 'line-through' })}
                      className={`flex-1 py-1 text-center line-through text-xs rounded border ${common.text_decoration === 'line-through' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}
                      title="Barré"
                    >
                      S
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500">Couleur Texte</label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="color"
                      value={common.text_color || '#000000'}
                      onChange={(e) => updateMulti({ text_color: e.target.value })}
                      className="w-8 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Mixte"
                      value={common.text_color || ''}
                      onChange={(e) => updateMulti({ text_color: e.target.value })}
                      className="flex-1 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Alignement H</label>
                  <div className="flex items-center gap-1 mt-0.5 bg-slate-100 p-0.5 rounded border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateMulti({ alignment: 'left' })}
                      className={`flex-1 py-1 flex justify-center rounded ${common.alignment === 'left' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
                      title="Gauche"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMulti({ alignment: 'center' })}
                      className={`flex-1 py-1 flex justify-center rounded ${common.alignment === 'center' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
                      title="Centré"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMulti({ alignment: 'right' })}
                      className={`flex-1 py-1 flex justify-center rounded ${common.alignment === 'right' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
                      title="Droite"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMulti({ alignment: 'justify' })}
                      className={`flex-1 py-1 flex justify-center rounded ${common.alignment === 'justify' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
                      title="Justifié"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Couleurs et Bordures Communes */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2 uppercase text-[10px] tracking-wider text-slate-400 flex items-center gap-1">
              <Palette className="w-3 h-3" />
              <span>Couleurs & Bordures Communes</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Fond (Fill)</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="color"
                    value={common.fill_color || '#ffffff'}
                    onChange={(e) => updateMulti({ fill_color: e.target.value })}
                    className="w-8 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Mixte"
                    value={common.fill_color || ''}
                    onChange={(e) => updateMulti({ fill_color: e.target.value })}
                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Bordure</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="color"
                    value={common.border_color || '#000000'}
                    onChange={(e) => updateMulti({ border_color: e.target.value })}
                    className="w-8 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Mixte"
                    value={common.border_color || ''}
                    onChange={(e) => updateMulti({ border_color: e.target.value })}
                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SINGLE-SELECTION FULL INSPECTOR
  const selectedItem = selectedItems[0];

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
            title={selectedItem.locked ? 'Déverrouiller' : 'Verrouiller'}
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

        {/* FULL TYPOGRAPHY SECTION FOR TEXT ITEMS */}
        {selectedItem.type === 'text' && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400 flex items-center gap-1">
              <Type className="w-3.5 h-3.5" />
              <span>Typographie & Texte</span>
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

            {/* Prefix & Suffix */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Préfixe</label>
                <input
                  type="text"
                  placeholder="ex: Réf: "
                  value={selectedItem.prefix_text || ''}
                  onChange={(e) => update({ prefix_text: e.target.value })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Suffixe</label>
                <input
                  type="text"
                  placeholder="ex: TTC"
                  value={selectedItem.suffix_text || ''}
                  onChange={(e) => update({ suffix_text: e.target.value })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Police de Caractères</label>
                <select
                  value={selectedItem.font_family}
                  onChange={(e) => update({ font_family: e.target.value })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                >
                  {AVAILABLE_FONTS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Taille (pt)</label>
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max="100"
                  value={selectedItem.font_size_pt}
                  onChange={(e) => update({ font_size_pt: parseFloat(e.target.value) || 10 })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Graisse (Font Weight)</label>
                <select
                  value={selectedItem.font_weight}
                  onChange={(e) => update({ font_weight: e.target.value as any })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                >
                  {FONT_WEIGHTS.map((fw) => (
                    <option key={fw.value} value={fw.value}>
                      {fw.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Style & Décoration</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <button
                    type="button"
                    onClick={() => update({ font_style: selectedItem.font_style === 'italic' ? 'normal' : 'italic' })}
                    className={`flex-1 py-1 text-center font-serif italic text-xs rounded border ${selectedItem.font_style === 'italic' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-slate-200 bg-white'}`}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ text_decoration: selectedItem.text_decoration === 'underline' ? 'none' : 'underline' })}
                    className={`flex-1 py-1 text-center underline text-xs rounded border ${selectedItem.text_decoration === 'underline' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-slate-200 bg-white'}`}
                  >
                    U
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ text_decoration: selectedItem.text_decoration === 'line-through' ? 'none' : 'line-through' })}
                    className={`flex-1 py-1 text-center line-through text-xs rounded border ${selectedItem.text_decoration === 'line-through' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-slate-200 bg-white'}`}
                    title="Barré (Promo)"
                  >
                    S
                  </button>
                </div>
              </div>
            </div>

            {/* Transformations & Spacing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Casse / Transform</label>
                <select
                  value={selectedItem.text_transform || 'none'}
                  onChange={(e) => update({ text_transform: e.target.value as any })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                >
                  {TEXT_TRANSFORMS.map((tt) => (
                    <option key={tt.value} value={tt.value}>
                      {tt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Interlettrage (pt)</label>
                <input
                  type="number"
                  step="0.2"
                  min="-2"
                  max="10"
                  value={selectedItem.letter_spacing_pt || 0}
                  onChange={(e) => update({ letter_spacing_pt: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Interligne (Line Height)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.8"
                  max="3"
                  value={selectedItem.line_height_multiplier || 1.2}
                  onChange={(e) => update({ line_height_multiplier: parseFloat(e.target.value) || 1.2 })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Couleur Texte</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="color"
                    value={selectedItem.text_color || '#000000'}
                    onChange={(e) => update({ text_color: e.target.value })}
                    className="w-8 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedItem.text_color || '#000000'}
                    onChange={(e) => update({ text_color: e.target.value })}
                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Alignments */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Alignement H</label>
                <div className="flex items-center gap-1 mt-0.5 bg-slate-100 p-0.5 rounded border border-slate-200">
                  <button
                    type="button"
                    onClick={() => update({ alignment: 'left' })}
                    className={`flex-1 py-1 flex justify-center rounded ${selectedItem.alignment === 'left' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
                    title="Gauche"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ alignment: 'center' })}
                    className={`flex-1 py-1 flex justify-center rounded ${selectedItem.alignment === 'center' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
                    title="Centré"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ alignment: 'right' })}
                    className={`flex-1 py-1 flex justify-center rounded ${selectedItem.alignment === 'right' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
                    title="Droite"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ alignment: 'justify' })}
                    className={`flex-1 py-1 flex justify-center rounded ${selectedItem.alignment === 'justify' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
                    title="Justifié"
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Alignement V</label>
                <select
                  value={selectedItem.valign}
                  onChange={(e) => update({ valign: e.target.value as any })}
                  className="w-full mt-0.5 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                >
                  {VERTICAL_ALIGNMENTS.map((va) => (
                    <option key={va.value} value={va.value}>
                      {va.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Box styling for text */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[11px] text-slate-500">Fond de bloc</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="color"
                    value={selectedItem.fill_color || '#ffffff'}
                    onChange={(e) => update({ fill_color: e.target.value })}
                    className="w-8 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => update({ fill_color: undefined })}
                    className="text-[10px] text-slate-500 hover:text-slate-800 underline ml-1"
                  >
                    Transparent
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Bordure & Arrondi (mm)</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="Épaisseur"
                    value={selectedItem.border_width || 0}
                    onChange={(e) => update({ border_width: parseFloat(e.target.value) || 0 })}
                    className="w-14 px-1 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="Arrondi"
                    value={selectedItem.corner_radius || 0}
                    onChange={(e) => update({ corner_radius: parseFloat(e.target.value) || 0 })}
                    className="w-14 px-1 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SHAPE SPECIFIC */}
        {(selectedItem.type === 'shape' || selectedItem.type === 'ellipse') && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
              Style de la Forme
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Couleur de fond</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="color"
                    value={selectedItem.fill_color || '#ffffff'}
                    onChange={(e) => update({ fill_color: e.target.value })}
                    className="w-8 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedItem.fill_color || '#ffffff'}
                    onChange={(e) => update({ fill_color: e.target.value })}
                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Couleur bordure</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="color"
                    value={selectedItem.border_color || '#000000'}
                    onChange={(e) => update({ border_color: e.target.value })}
                    className="w-8 h-7 p-0 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedItem.border_color || '#000000'}
                    onChange={(e) => update({ border_color: e.target.value })}
                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Épaisseur bordure (px)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={selectedItem.border_width || 1}
                  onChange={(e) => update({ border_width: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
              {selectedItem.type === 'shape' && (
                <div>
                  <label className="text-[11px] text-slate-500">Rayon coins (mm)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={(selectedItem as ShapeItemProperties).corner_radius || 0}
                    onChange={(e) => update({ corner_radius: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* LINE SPECIFIC */}
        {selectedItem.type === 'line' && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
              Paramètres de la Ligne
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Couleur du trait</label>
                <input
                  type="color"
                  value={selectedItem.color || '#000000'}
                  onChange={(e) => update({ color: e.target.value })}
                  className="w-full h-7 p-0 rounded border border-slate-300 cursor-pointer mt-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Épaisseur (px)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={selectedItem.thickness || 1}
                  onChange={(e) => update({ thickness: parseFloat(e.target.value) || 1 })}
                  className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Style du trait</label>
              <select
                value={selectedItem.style}
                onChange={(e) => update({ style: e.target.value as any })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
              >
                <option value="solid">Trait continu (Solid)</option>
                <option value="dashed">Tirets (Dashed)</option>
                <option value="dotted">Pointillés (Dotted)</option>
              </select>
            </div>
          </div>
        )}

        {/* BARCODE SPECIFIC */}
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Couleur des Barres</label>
                <input
                  type="color"
                  value={selectedItem.bar_color || '#000000'}
                  onChange={(e) => update({ bar_color: e.target.value })}
                  className="w-full h-7 p-0 rounded border border-slate-300 cursor-pointer mt-0.5"
                />
              </div>
              <div className="flex items-center pt-4">
                <label className="text-[11px] text-slate-600 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItem.show_text}
                    onChange={(e) => update({ show_text: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Afficher texte</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* QR CODE SPECIFIC */}
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

        {/* TIER PRICE SPECIFIC */}
        {selectedItem.type === 'tier_price' && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
              Paliers Cash & Carry
            </h4>
            <div>
              <label className="text-[11px] text-slate-500">Palier Cible (1 à 10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={selectedItem.primary_tier}
                onChange={(e) => update({ primary_tier: parseInt(e.target.value, 10) || 1 })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Préfixe quantité</label>
              <input
                type="text"
                value={selectedItem.prefix_text}
                onChange={(e) => update({ prefix_text: e.target.value })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Symbole monétaire</label>
              <input
                type="text"
                value={selectedItem.unit_label}
                onChange={(e) => update({ unit_label: e.target.value })}
                className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={selectedItem.strict_required}
                  onChange={(e) => update({ strict_required: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Strictement requis (Alerte si palier absent)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={selectedItem.fallback_to_base_price ?? true}
                  onChange={(e) => update({ fallback_to_base_price: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Repli sur le prix de base si palier absent</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
