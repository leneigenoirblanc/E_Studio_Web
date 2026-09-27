import React from 'react';
import { TemplateItem } from '../types';
import { DOMAIN_FIELDS } from '../domainFields';
import { useMappingDictionary } from '../context/MappingDictionaryContext';
import {
  ElementStylePayload,
  extractElementStyle,
} from '../models/TemplateObjectModel';
import {
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  Sliders,
  Paintbrush,
  ClipboardCheck,
  X,
} from 'lucide-react';
import {
  MultiSelectInspector,
  TransformLayoutInspector,
  DataBindingInspector,
  ConditionalRulesInspector,
  TextPropertiesInspector,
  PriceBlockPropertiesInspector,
  BarcodePropertiesInspector,
  ShapePropertiesInspector,
  RichTextPropertiesInspector,
  RestrictedAreaPropertiesInspector,
  PictogramPropertiesInspector,
  TierPricingPropertiesInspector,
} from './inspector';

export interface PropertyInspectorProps {
  selectedItems: TemplateItem[];
  allItems?: TemplateItem[];
  onUpdateItem: (updatedItem: TemplateItem) => void;
  onUpdateMultipleItems?: (updatedItems: TemplateItem[]) => void;
  onDeleteItem: (id: string) => void;
  onDeleteMultipleItems?: (ids: string[]) => void;
  onDuplicateItem: (id: string) => void;
  onDuplicateMultipleItems?: (ids: string[]) => void;
  onReorderItem: (id: string, delta: number) => void;
  copiedStyle?: ElementStylePayload | null;
  onCopyStyle?: (style: ElementStylePayload) => void;
  onPasteStyle?: () => void;
  onClose?: () => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  selectedItems,
  allItems = [],
  onUpdateItem,
  onUpdateMultipleItems,
  onDeleteItem,
  onDeleteMultipleItems,
  onDuplicateItem,
  onDuplicateMultipleItems,
  onReorderItem,
  copiedStyle,
  onCopyStyle,
  onPasteStyle,
  onClose,
}) => {
  const { dictionary } = useMappingDictionary();
  const availableFields = React.useMemo(() => {
    if (!dictionary || !Array.isArray(dictionary) || dictionary.length === 0) return DOMAIN_FIELDS;
    return dictionary.map((f) => ({
      key: f.key,
      label: f.label,
      description: f.description,
    }));
  }, [dictionary]);

  const count = selectedItems.length;

  // 1. Zero Selection State
  if (count === 0) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 p-6 text-slate-500 text-sm flex flex-col items-center justify-center text-center h-full select-none shrink-0 z-10">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Sliders className="w-6 h-6" />
        </div>
        <p className="font-semibold text-slate-700">Aucun élément sélectionné</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Sélectionnez un ou plusieurs objets sur la toile pour afficher et modifier leurs propriétés contextuelles.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Fermer l'inspecteur
          </button>
        )}
      </div>
    );
  }

  // 2. Multi-Selection Inspector
  if (count > 1) {
    return (
      <MultiSelectInspector
        selectedItems={selectedItems}
        onUpdateItem={onUpdateItem}
        onUpdateMultipleItems={onUpdateMultipleItems}
        onDeleteItem={onDeleteItem}
        onDeleteMultipleItems={onDeleteMultipleItems}
        onDuplicateItem={onDuplicateItem}
        onDuplicateMultipleItems={onDuplicateMultipleItems}
        copiedStyle={copiedStyle}
        onCopyStyle={onCopyStyle}
        onPasteStyle={onPasteStyle}
        onClose={onClose}
      />
    );
  }

  // 3. Single-Selection Inspector
  const selectedItem = selectedItems[0];

  const update = (patch: Partial<TemplateItem>) => {
    onUpdateItem({ ...selectedItem, ...patch } as TemplateItem);
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 h-full flex flex-col text-xs text-slate-700 select-none overflow-y-auto shrink-0 z-10 shadow-lg">
      {/* Header with Quick Actions */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Élément</span>
          <h3 className="font-bold text-slate-800 capitalize text-sm">{selectedItem.type.replace('_', ' ')}</h3>
        </div>
        <div className="flex items-center gap-1">
          {onCopyStyle && (
            <button
              onClick={() => onCopyStyle(extractElementStyle(selectedItem))}
              title="Copier le style de cet élément (Ctrl+Alt+C)"
              className="p-1.5 rounded hover:bg-blue-100 text-blue-700 transition cursor-pointer"
            >
              <Paintbrush className="w-3.5 h-3.5" />
            </button>
          )}
          {onPasteStyle && copiedStyle && (
            <button
              onClick={onPasteStyle}
              title="Coller le style copié sur cet élément (Ctrl+Alt+V)"
              className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => update({ locked: !selectedItem.locked })}
            title={selectedItem.locked ? 'Déverrouiller' : 'Verrouiller'}
            className={`p-1.5 rounded transition cursor-pointer ${
              selectedItem.locked ? 'bg-amber-100 text-amber-800' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            {selectedItem.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onReorderItem(selectedItem.id, 1)}
            title="Avancer (z-index)"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onReorderItem(selectedItem.id, -1)}
            title="Reculer (z-index)"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Fermer l'inspecteur"
              className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition ml-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDuplicateItem(selectedItem.id)}
            title="Dupliquer"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteItem(selectedItem.id)}
            title="Supprimer"
            className="p-1.5 rounded hover:bg-rose-100 text-rose-600 ml-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Copy/Paste Style Notification Bar */}
      {copiedStyle && onPasteStyle && (
        <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-[11px] text-blue-700">Style en mémoire</span>
          <button
            onClick={onPasteStyle}
            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-[10px] cursor-pointer"
          >
            Coller le style
          </button>
        </div>
      )}

      {/* Body: Modular Sub-Inspectors */}
      <div className="p-4 space-y-4">
        {/* 1. Geometry & Snapping */}
        <TransformLayoutInspector
          selectedItem={selectedItem}
          allItems={allItems}
          onUpdate={update}
        />

        {/* 2. Data Binding Key */}
        <DataBindingInspector
          selectedItem={selectedItem}
          availableFields={availableFields}
          onUpdate={update}
        />

        {/* 3. Conditional Display Rules */}
        <ConditionalRulesInspector
          selectedItem={selectedItem}
          onUpdate={update}
        />

        {/* 4. Type Specific Sub-Inspectors */}
        <TextPropertiesInspector
          selectedItem={selectedItem}
          onUpdate={update}
        />

        <PriceBlockPropertiesInspector
          selectedItem={selectedItem}
          onUpdate={update}
        />

        <BarcodePropertiesInspector
          selectedItem={selectedItem}
          onUpdate={update}
        />

        <ShapePropertiesInspector
          selectedItem={selectedItem}
          onUpdate={update}
        />

        <RichTextPropertiesInspector
          selectedItem={selectedItem}
          availableFields={availableFields}
          onUpdate={update}
        />

        <RestrictedAreaPropertiesInspector
          selectedItem={selectedItem}
          onUpdate={update}
        />

        <PictogramPropertiesInspector
          selectedItem={selectedItem}
          onUpdate={update}
        />

        <TierPricingPropertiesInspector
          selectedItem={selectedItem}
          onUpdate={update}
        />
      </div>
    </div>
  );
};

export default PropertyInspector;
