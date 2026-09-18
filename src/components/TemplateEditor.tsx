import React, { useState, useRef, useEffect } from 'react';
import { LabelTemplate, TemplateItem, ProductRecord } from '../types';
import { LabelRenderer } from './LabelRenderer';
import { PropertyInspector } from './PropertyInspector';
import { SAMPLE_PRODUCTS } from '../sampleData';
import {
  Save,
  Download,
  Upload,
  Type,
  Square,
  Circle,
  Minus,
  QrCode,
  Barcode,
  Image as ImageIcon,
  DollarSign,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Printer,
  CheckCircle,
} from 'lucide-react';

interface TemplateEditorProps {
  initialTemplate: LabelTemplate;
  onSaveTemplate: (updated: LabelTemplate) => void;
  onBackToHome: () => void;
  onOpenGeneration: (template: LabelTemplate) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialTemplate,
  onSaveTemplate,
  onBackToHome,
  onOpenGeneration,
}) => {
  const [template, setTemplate] = useState<LabelTemplate>(initialTemplate);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    template.items.length > 0 ? template.items[0].id : null
  );
  const [zoom, setZoom] = useState(1.25);
  const [showBleed, setShowBleed] = useState(true);
  const [showInnerMargins, setShowInnerMargins] = useState(true);
  const [showHazardWarnings, setShowHazardWarnings] = useState(true);
  const [previewDataIndex, setPreviewDataIndex] = useState<number | null>(null);
  const [savedNotification, setSavedNotification] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number; itemX: number; itemY: number } | null>(null);

  const selectedItem = template.items.find((i) => i.id === selectedItemId) || null;
  const currentPreviewRecord: ProductRecord | undefined =
    previewDataIndex !== null ? SAMPLE_PRODUCTS[previewDataIndex] : undefined;

  const handleUpdateItem = (updated: TemplateItem) => {
    setTemplate((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === updated.id ? updated : it)),
    }));
  };

  const handleDeleteItem = (id: string) => {
    setTemplate((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const handleDuplicateItem = (id: string) => {
    const orig = template.items.find((it) => it.id === id);
    if (!orig) return;
    const newItem: TemplateItem = {
      ...orig,
      id: `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x_mm: orig.x_mm + 3,
      y_mm: orig.y_mm + 3,
      z_index: (orig.z_index || 1) + 1,
    };
    setTemplate((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setSelectedItemId(newItem.id);
  };

  const handleReorderItem = (id: string, delta: number) => {
    setTemplate((prev) => {
      const idx = prev.items.findIndex((it) => it.id === id);
      if (idx === -1) return prev;
      const target = prev.items[idx];
      const newItems = [...prev.items];
      target.z_index = Math.max(1, (target.z_index || 1) + delta);
      return { ...prev, items: newItems };
    });
  };

  const addItem = (type: TemplateItem['type']) => {
    const id = `item_${Date.now()}`;
    let newItem: TemplateItem;

    const centerX = Math.max(2, (template.width_mm - 40) / 2);
    const centerY = Math.max(2, (template.height_mm - 15) / 2);

    switch (type) {
      case 'text':
        newItem = {
          id,
          type: 'text',
          x_mm: centerX,
          y_mm: centerY,
          w_mm: 45.0,
          h_mm: 12.0,
          rotation: 0,
          z_index: template.items.length + 1,
          locked: false,
          text: 'Nouveau Texte',
          font_family: 'Plus Jakarta Sans',
          font_size_pt: 12.0,
          font_weight: 'bold',
          font_style: 'normal',
          text_decoration: 'none',
          text_color: '#0f172a',
          alignment: 'left',
          valign: 'top',
          wrap: true,
          overflow: 'autofit_shrink',
        };
        break;
      case 'shape':
        newItem = {
          id,
          type: 'shape',
          x_mm: centerX,
          y_mm: centerY,
          w_mm: 35.0,
          h_mm: 20.0,
          rotation: 0,
          z_index: template.items.length + 1,
          locked: false,
          fill_color: '#f8fafc',
          border_color: '#0284c7',
          border_width: 1.0,
          corner_radius: 2.0,
        };
        break;
      case 'ellipse':
        newItem = {
          id,
          type: 'ellipse',
          x_mm: centerX,
          y_mm: centerY,
          w_mm: 25.0,
          h_mm: 25.0,
          rotation: 0,
          z_index: template.items.length + 1,
          locked: false,
          fill_color: '#fee2e2',
          border_color: '#ef4444',
          border_width: 1.0,
        };
        break;
      case 'line':
        newItem = {
          id,
          type: 'line',
          x_mm: template.inner_margins_mm.left,
          y_mm: centerY,
          w_mm: template.width_mm - template.inner_margins_mm.left - template.inner_margins_mm.right,
          h_mm: 1.0,
          rotation: 0,
          z_index: template.items.length + 1,
          locked: false,
          color: '#cbd5e1',
          thickness: 1.0,
          style: 'solid',
        };
        break;
      case 'barcode':
        newItem = {
          id,
          type: 'barcode',
          x_mm: centerX,
          y_mm: centerY,
          w_mm: 48.0,
          h_mm: 16.0,
          rotation: 0,
          z_index: template.items.length + 1,
          locked: false,
          code: '3250390123456',
          barcode_type: 'ean13',
          show_text: true,
          bar_color: '#000000',
          binding_key: 'PRODUCT_SCAN',
        };
        break;
      case 'qrcode':
        newItem = {
          id,
          type: 'qrcode',
          x_mm: centerX,
          y_mm: centerY,
          w_mm: 20.0,
          h_mm: 20.0,
          rotation: 0,
          z_index: template.items.length + 1,
          locked: false,
          content: 'https://example.com',
          module_color: '#000000',
          background_color: '#FFFFFF',
        };
        break;
      case 'image':
        newItem = {
          id,
          type: 'image',
          x_mm: centerX,
          y_mm: centerY,
          w_mm: 30.0,
          h_mm: 25.0,
          rotation: 0,
          z_index: template.items.length + 1,
          locked: false,
          keep_aspect_ratio: true,
          opacity: 1.0,
          binding_key: 'IMAGE_PATH',
        };
        break;
      case 'tier_price':
        newItem = {
          id,
          type: 'tier_price',
          x_mm: centerX,
          y_mm: centerY,
          w_mm: 45.0,
          h_mm: 8.0,
          rotation: 0,
          z_index: template.items.length + 1,
          locked: false,
          primary_tier: 1,
          prefix_text: 'À partir de',
          unit_label: 'FCFA',
          strict_required: false,
          fallback_to_base_price: true,
        };
        break;
    }

    setTemplate((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    setSelectedItemId(id);
  };

  const handleSave = () => {
    onSaveTemplate(template);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const exportJson = () => {
    const dataStr = JSON.stringify(template, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedItem || selectedItem.locked) return;
    const step = e.shiftKey ? 0.5 : 2.0;
    if (e.key === 'ArrowLeft') {
      handleUpdateItem({ ...selectedItem, x_mm: Math.max(0, selectedItem.x_mm - step) });
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      handleUpdateItem({ ...selectedItem, x_mm: selectedItem.x_mm + step });
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      handleUpdateItem({ ...selectedItem, y_mm: Math.max(0, selectedItem.y_mm - step) });
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      handleUpdateItem({ ...selectedItem, y_mm: selectedItem.y_mm + step });
      e.preventDefault();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // only if not editing inside input or textarea
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        handleDeleteItem(selectedItem.id);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem]);

  // Dragging logic
  const handleItemMouseDown = (itemId: string, e: React.MouseEvent) => {
    setSelectedItemId(itemId);
    const it = template.items.find((i) => i.id === itemId);
    if (!it || it.locked) return;
    setIsDragging(true);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY,
      itemX: it.x_mm,
      itemY: it.y_mm,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartPos || !selectedItem || selectedItem.locked) return;
    const scalePxPerMm = 3.78 * zoom;
    const deltaX = (e.clientX - dragStartPos.x) / scalePxPerMm;
    const deltaY = (e.clientY - dragStartPos.y) / scalePxPerMm;

    const newX = Math.round((dragStartPos.itemX + deltaX) * 2) / 2;
    const newY = Math.round((dragStartPos.itemY + deltaY) * 2) / 2;

    handleUpdateItem({
      ...selectedItem,
      x_mm: Math.max(0, newX),
      y_mm: Math.max(0, newY),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartPos(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* Top Application Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Gabarits</span>
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none truncate max-w-md">{template.name}</h1>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              {template.width_mm} × {template.height_mm} mm (Impr: {(template.width_mm - template.inner_margins_mm.left - template.inner_margins_mm.right).toFixed(1)} × {(template.height_mm - template.inner_margins_mm.top - template.inner_margins_mm.bottom).toFixed(1)} mm)
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {savedNotification && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
              <CheckCircle className="w-4 h-4" />
              Gabarit sauvegardé !
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>Enregistrer</span>
          </button>
          <button
            onClick={exportJson}
            title="Exporter gabarit en JSON"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => onOpenGeneration(template)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Générer des étiquettes</span>
          </button>
        </div>
      </header>

      {/* Secondary Tools Palette */}
      <div className="h-11 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 overflow-x-auto text-xs">
        {/* Insert Objects Palette */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 tracking-wider">Insérer :</span>
          <button
            onClick={() => addItem('text')}
            className="px-2.5 py-1 rounded hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 font-medium text-slate-700 flex items-center gap-1.5 transition"
          >
            <Type className="w-3.5 h-3.5 text-blue-600" />
            <span>Texte</span>
          </button>
          <button
            onClick={() => addItem('shape')}
            className="px-2.5 py-1 rounded hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 font-medium text-slate-700 flex items-center gap-1.5 transition"
          >
            <Square className="w-3.5 h-3.5 text-slate-600" />
            <span>Rectangle</span>
          </button>
          <button
            onClick={() => addItem('ellipse')}
            className="px-2.5 py-1 rounded hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 font-medium text-slate-700 flex items-center gap-1.5 transition"
          >
            <Circle className="w-3.5 h-3.5 text-slate-600" />
            <span>Ellipse</span>
          </button>
          <button
            onClick={() => addItem('line')}
            className="px-2.5 py-1 rounded hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 font-medium text-slate-700 flex items-center gap-1.5 transition"
          >
            <Minus className="w-3.5 h-3.5 text-slate-600" />
            <span>Ligne</span>
          </button>
          <button
            onClick={() => addItem('barcode')}
            className="px-2.5 py-1 rounded hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 font-medium text-slate-700 flex items-center gap-1.5 transition"
          >
            <Barcode className="w-3.5 h-3.5 text-slate-800" />
            <span>Code-barres</span>
          </button>
          <button
            onClick={() => addItem('qrcode')}
            className="px-2.5 py-1 rounded hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 font-medium text-slate-700 flex items-center gap-1.5 transition"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-800" />
            <span>QR Code</span>
          </button>
          <button
            onClick={() => addItem('tier_price')}
            className="px-2.5 py-1 rounded bg-sky-100/70 hover:bg-sky-100 hover:shadow-xs border border-sky-200 font-semibold text-sky-800 flex items-center gap-1.5 transition"
          >
            <DollarSign className="w-3.5 h-3.5 text-sky-700" />
            <span>Paliers Prix (Cash&Carry)</span>
          </button>
          <button
            onClick={() => addItem('image')}
            className="px-2.5 py-1 rounded hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 font-medium text-slate-700 flex items-center gap-1.5 transition"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Image</span>
          </button>
        </div>

        {/* View Controls & Data Preview Toggle */}
        <div className="flex items-center gap-3">
          {/* Data Binding Simulator */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Eye className="w-3 h-3 text-slate-400" />
              Aperçu Données:
            </span>
            {previewDataIndex === null ? (
              <button
                onClick={() => setPreviewDataIndex(0)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Activer
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setPreviewDataIndex((prev) =>
                      prev !== null ? (prev > 0 ? prev - 1 : SAMPLE_PRODUCTS.length - 1) : 0
                    )
                  }
                  className="p-0.5 hover:bg-slate-100 rounded text-slate-600"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="font-mono text-[10px] text-slate-700 font-bold px-1">
                  #{previewDataIndex + 1}/{SAMPLE_PRODUCTS.length}
                </span>
                <button
                  onClick={() =>
                    setPreviewDataIndex((prev) =>
                      prev !== null ? (prev < SAMPLE_PRODUCTS.length - 1 ? prev + 1 : 0) : 0
                    )
                  }
                  className="p-0.5 hover:bg-slate-100 rounded text-slate-600"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setPreviewDataIndex(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 ml-1"
                >
                  (Off)
                </button>
              </div>
            )}
          </div>

          {/* Guides toggles */}
          <button
            onClick={() => setShowHazardWarnings(!showHazardWarnings)}
            className={`p-1.5 rounded transition ${
              showHazardWarnings ? 'bg-amber-100 text-amber-800' : 'text-slate-400 hover:bg-slate-200'
            }`}
            title="Contrôler les dépassements (Hazard warning)"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Zoom arrière"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[11px] px-1 font-bold text-slate-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3.0, z + 0.25))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Zoom avant"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 hover:bg-slate-100 rounded text-slate-600 text-[10px] font-medium"
              title="Taille réelle (100%)"
            >
              1:1
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Area: Canvas + Property Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Center Stage */}
        <div
          ref={canvasContainerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={() => setSelectedItemId(null)}
          className="flex-1 overflow-auto p-12 flex items-center justify-center relative"
          style={{
            backgroundColor: '#e2e8f0',
            backgroundImage:
              'radial-gradient(#cbd5e1 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, #e2e8f0 1.5px)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        >
          {/* Label Canvas Frame */}
          <div
            className="relative shadow-2xl rounded-xs transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <LabelRenderer
              template={template}
              record={currentPreviewRecord}
              zoom={zoom}
              showBleed={showBleed}
              showInnerMargins={showInnerMargins}
              showHazardWarnings={showHazardWarnings}
              selectedItemId={selectedItemId}
              onSelectItem={(id, e) => handleItemMouseDown(id, e)}
              interactive={true}
              className="ring-1 ring-slate-300"
            />
          </div>
        </div>

        {/* Right Inspector Dock */}
        <PropertyInspector
          selectedItem={selectedItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onDuplicateItem={handleDuplicateItem}
          onReorderItem={handleReorderItem}
        />
      </div>
    </div>
  );
};
