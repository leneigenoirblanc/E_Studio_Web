import React, { useState, useRef, useEffect } from 'react';
import { LabelTemplate, TemplateItem, ProductRecord } from '../types';
import { LabelRenderer } from './LabelRenderer';
import { PropertyInspector } from './PropertyInspector';
import { SAMPLE_PRODUCTS } from '../sampleData';
import { createObjectInstance } from '../models/TemplateObjectModel';
import {
  SmartGuideLine,
  BoxBounds,
  computeSmartGuides,
  computeResizeSmartGuides,
} from '../utils/smartGuides';
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
  Layers,
  MousePointer,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Magnet,
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
  // Multi-selection state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    template.items.length > 0 ? [template.items[0].id] : []
  );
  const [history, setHistory] = useState<LabelTemplate[]>([initialTemplate]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [zoom, setZoom] = useState(1.25);
  const [showBleed, setShowBleed] = useState(true);
  const [showInnerMargins, setShowInnerMargins] = useState(true);
  const [showHazardWarnings, setShowHazardWarnings] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [smartGuidesEnabled, setSmartGuidesEnabled] = useState(true);
  const [activeSmartGuides, setActiveSmartGuides] = useState<SmartGuideLine[]>([]);
  const [previewDataIndex, setPreviewDataIndex] = useState<number | null>(null);
  const [savedNotification, setSavedNotification] = useState(false);

  // Dragging & Marquee selection states
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
    itemsOrigPos: Map<string, { x: number; y: number }>;
  } | null>(null);

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeState, setResizeState] = useState<{
    itemId: string;
    handle: string;
    startX: number;
    startY: number;
    origBox: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const selectedItems = template.items.filter((i) => selectedItemIds.includes(i.id));
  const currentPreviewRecord: ProductRecord | undefined =
    previewDataIndex !== null ? SAMPLE_PRODUCTS[previewDataIndex] : undefined;

  // History / Undo / Redo
  const pushState = (newTemplate: LabelTemplate) => {
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newTemplate);
    if (newHist.length > 25) newHist.shift();
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    setTemplate(newTemplate);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setTemplate(target);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setTemplate(target);
    }
  };

  const handleUpdateItem = (updated: TemplateItem) => {
    const next = {
      ...template,
      items: template.items.map((it) => (it.id === updated.id ? updated : it)),
    };
    pushState(next);
  };

  const handleUpdateMultipleItems = (updatedItems: TemplateItem[]) => {
    const updateMap = new Map(updatedItems.map((u) => [u.id, u]));
    const next = {
      ...template,
      items: template.items.map((it) => (updateMap.has(it.id) ? updateMap.get(it.id)! : it)),
    };
    pushState(next);
  };

  const handleDeleteItem = (id: string) => {
    const next = {
      ...template,
      items: template.items.filter((it) => it.id !== id),
    };
    setSelectedItemIds((prev) => prev.filter((i) => i !== id));
    pushState(next);
  };

  const handleDeleteMultipleItems = (ids: string[]) => {
    const set = new Set(ids);
    const next = {
      ...template,
      items: template.items.filter((it) => !set.has(it.id)),
    };
    setSelectedItemIds([]);
    pushState(next);
  };

  const handleDuplicateItem = (id: string) => {
    const orig = template.items.find((it) => it.id === id);
    if (!orig) return;
    const obj = createObjectInstance(orig);
    const newItem = obj.clone();
    const next = {
      ...template,
      items: [...template.items, newItem],
    };
    setSelectedItemIds([newItem.id]);
    pushState(next);
  };

  const handleDuplicateMultipleItems = (ids: string[]) => {
    const toDup = template.items.filter((it) => ids.includes(it.id));
    const newItems = toDup.map((orig) => {
      const obj = createObjectInstance(orig);
      return obj.clone();
    });
    const next = {
      ...template,
      items: [...template.items, ...newItems],
    };
    setSelectedItemIds(newItems.map((n) => n.id));
    pushState(next);
  };

  const handleReorderItem = (id: string, delta: number) => {
    const idx = template.items.findIndex((it) => it.id === id);
    if (idx === -1) return;
    const target = template.items[idx];
    const newItems = [...template.items];
    target.z_index = Math.max(1, (target.z_index || 1) + delta);
    const next = { ...template, items: newItems };
    pushState(next);
  };

  // Alignment & Distribution helpers for multi-selection
  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedItems.length < 2) return;

    let targetVal = 0;
    if (type === 'left') {
      targetVal = Math.min(...selectedItems.map((i) => i.x_mm));
    } else if (type === 'right') {
      targetVal = Math.max(...selectedItems.map((i) => i.x_mm + i.w_mm));
    } else if (type === 'center') {
      const minX = Math.min(...selectedItems.map((i) => i.x_mm));
      const maxX = Math.max(...selectedItems.map((i) => i.x_mm + i.w_mm));
      targetVal = (minX + maxX) / 2;
    } else if (type === 'top') {
      targetVal = Math.min(...selectedItems.map((i) => i.y_mm));
    } else if (type === 'bottom') {
      targetVal = Math.max(...selectedItems.map((i) => i.y_mm + i.h_mm));
    } else if (type === 'middle') {
      const minY = Math.min(...selectedItems.map((i) => i.y_mm));
      const maxY = Math.max(...selectedItems.map((i) => i.y_mm + i.h_mm));
      targetVal = (minY + maxY) / 2;
    }

    const updated = selectedItems.map((item) => {
      if (type === 'left') return { ...item, x_mm: targetVal };
      if (type === 'right') return { ...item, x_mm: targetVal - item.w_mm };
      if (type === 'center') return { ...item, x_mm: targetVal - item.w_mm / 2 };
      if (type === 'top') return { ...item, y_mm: targetVal };
      if (type === 'bottom') return { ...item, y_mm: targetVal - item.h_mm };
      if (type === 'middle') return { ...item, y_mm: targetVal - item.h_mm / 2 };
      return item;
    });

    handleUpdateMultipleItems(updated);
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    if (selectedItems.length < 3) return;

    if (direction === 'horizontal') {
      const sorted = [...selectedItems].sort((a, b) => a.x_mm - b.x_mm);
      const minX = sorted[0].x_mm;
      const last = sorted[sorted.length - 1];
      const maxX = last.x_mm + last.w_mm;
      const totalItemW = sorted.reduce((sum, item) => sum + item.w_mm, 0);
      const totalGap = maxX - minX - totalItemW;
      const gap = totalGap / (sorted.length - 1);

      let currentX = minX;
      const updated = sorted.map((item) => {
        const res = { ...item, x_mm: currentX };
        currentX += item.w_mm + gap;
        return res;
      });
      handleUpdateMultipleItems(updated);
    } else {
      const sorted = [...selectedItems].sort((a, b) => a.y_mm - b.y_mm);
      const minY = sorted[0].y_mm;
      const last = sorted[sorted.length - 1];
      const maxY = last.y_mm + last.h_mm;
      const totalItemH = sorted.reduce((sum, item) => sum + item.h_mm, 0);
      const totalGap = maxY - minY - totalItemH;
      const gap = totalGap / (sorted.length - 1);

      let currentY = minY;
      const updated = sorted.map((item) => {
        const res = { ...item, y_mm: currentY };
        currentY += item.h_mm + gap;
        return res;
      });
      handleUpdateMultipleItems(updated);
    }
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
          letter_spacing_pt: 0,
          line_height_multiplier: 1.25,
          text_transform: 'none',
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

    const next = { ...template, items: [...template.items, newItem] };
    setSelectedItemIds([id]);
    pushState(next);
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

  // Keyboard Shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
      e.preventDefault();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      handleRedo();
      e.preventDefault();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedItemIds.length > 0) {
      handleDuplicateMultipleItems(selectedItemIds);
      e.preventDefault();
      return;
    }

    if (selectedItems.length === 0) return;

    const step = e.shiftKey ? 0.5 : 2.0;

    if (e.key === 'ArrowLeft') {
      const updated = selectedItems.map((i) => ({ ...i, x_mm: Math.max(0, i.x_mm - step) }));
      handleUpdateMultipleItems(updated);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      const updated = selectedItems.map((i) => ({ ...i, x_mm: i.x_mm + step }));
      handleUpdateMultipleItems(updated);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      const updated = selectedItems.map((i) => ({ ...i, y_mm: Math.max(0, i.y_mm - step) }));
      handleUpdateMultipleItems(updated);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      const updated = selectedItems.map((i) => ({ ...i, y_mm: i.y_mm + step }));
      handleUpdateMultipleItems(updated);
      e.preventDefault();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      handleDeleteMultipleItems(selectedItemIds);
      e.preventDefault();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemIds, template, historyIndex]);

  // Dragging logic with multi-selection support
  const handleItemMouseDown = (itemId: string, e: React.MouseEvent) => {
    let newSelected: string[];
    if (e.shiftKey) {
      newSelected = selectedItemIds.includes(itemId)
        ? selectedItemIds.filter((id) => id !== itemId)
        : [...selectedItemIds, itemId];
    } else {
      newSelected = selectedItemIds.includes(itemId) && selectedItemIds.length > 1 ? selectedItemIds : [itemId];
    }
    setSelectedItemIds(newSelected);

    const itemsOrigPos = new Map<string, { x: number; y: number }>();
    newSelected.forEach((id) => {
      const it = template.items.find((i) => i.id === id);
      if (it && !it.locked) {
        itemsOrigPos.set(id, { x: it.x_mm, y: it.y_mm });
      }
    });

    if (itemsOrigPos.size > 0) {
      setIsDragging(true);
      setDragStartPos({
        x: e.clientX,
        y: e.clientY,
        itemsOrigPos,
      });
    }
  };

  const handleResizeStart = (itemId: string, handle: string, e: React.MouseEvent) => {
    const it = template.items.find((i) => i.id === itemId);
    if (!it || it.locked) return;

    setIsResizing(true);
    setResizeState({
      itemId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origBox: { x: it.x_mm, y: it.y_mm, w: it.w_mm, h: it.h_mm },
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const scalePxPerMm = 3.78 * zoom;

    // 1. Resizing with Smart Guides
    if (isResizing && resizeState) {
      const deltaX = (e.clientX - resizeState.startX) / scalePxPerMm;
      const deltaY = (e.clientY - resizeState.startY) / scalePxPerMm;

      let rawX = resizeState.origBox.x;
      let rawY = resizeState.origBox.y;
      let rawW = resizeState.origBox.w;
      let rawH = resizeState.origBox.h;

      if (resizeState.handle.includes('e')) rawW = Math.max(1.0, resizeState.origBox.w + deltaX);
      if (resizeState.handle.includes('s')) rawH = Math.max(1.0, resizeState.origBox.h + deltaY);
      if (resizeState.handle.includes('w')) {
        const potentialW = resizeState.origBox.w - deltaX;
        if (potentialW >= 1.0) {
          rawX = resizeState.origBox.x + deltaX;
          rawW = potentialW;
        }
      }
      if (resizeState.handle.includes('n')) {
        const potentialH = resizeState.origBox.h - deltaY;
        if (potentialH >= 1.0) {
          rawY = resizeState.origBox.y + deltaY;
          rawH = potentialH;
        }
      }

      // Collect other boxes for smart guides
      const otherBoxes: BoxBounds[] = template.items
        .filter((i) => i.id !== resizeState.itemId)
        .map((i) => ({
          id: i.id,
          left: i.x_mm,
          right: i.x_mm + i.w_mm,
          top: i.y_mm,
          bottom: i.y_mm + i.h_mm,
          centerX: i.x_mm + i.w_mm / 2,
          centerY: i.y_mm + i.h_mm / 2,
          width: i.w_mm,
          height: i.h_mm,
        }));

      const { snappedBox, guides } = computeResizeSmartGuides(
        resizeState.itemId,
        resizeState.handle,
        { x: rawX, y: rawY, w: rawW, h: rawH },
        otherBoxes,
        template.width_mm,
        template.height_mm,
        showInnerMargins ? template.inner_margins_mm : undefined,
        smartGuidesEnabled
      );

      setActiveSmartGuides(guides);

      const updated = template.items.map((it) => {
        if (it.id === resizeState.itemId) {
          return {
            ...it,
            x_mm: Number(snappedBox.x.toFixed(2)),
            y_mm: Number(snappedBox.y.toFixed(2)),
            w_mm: Number(snappedBox.w.toFixed(2)),
            h_mm: Number(snappedBox.h.toFixed(2)),
          };
        }
        return it;
      });

      setTemplate((prev) => ({ ...prev, items: updated }));
      return;
    }

    // 2. Dragging Elements with Dynamic Smart Guides
    if (!isDragging || !dragStartPos) return;

    const deltaX = (e.clientX - dragStartPos.x) / scalePxPerMm;
    const deltaY = (e.clientY - dragStartPos.y) / scalePxPerMm;

    // Determine primary item or bounding box of moved selection
    const movingItemIds = Array.from(dragStartPos.itemsOrigPos.keys());
    const primaryId = selectedItemIds[0] || movingItemIds[0];
    const primaryOrig = dragStartPos.itemsOrigPos.get(primaryId);
    const primaryItem = template.items.find((i) => i.id === primaryId);

    if (primaryOrig && primaryItem) {
      const rawX = primaryOrig.x + deltaX;
      const rawY = primaryOrig.y + deltaY;

      // Other static boxes on canvas
      const otherBoxes: BoxBounds[] = template.items
        .filter((i) => !dragStartPos.itemsOrigPos.has(i.id))
        .map((i) => ({
          id: i.id,
          left: i.x_mm,
          right: i.x_mm + i.w_mm,
          top: i.y_mm,
          bottom: i.y_mm + i.h_mm,
          centerX: i.x_mm + i.w_mm / 2,
          centerY: i.y_mm + i.h_mm / 2,
          width: i.w_mm,
          height: i.h_mm,
        }));

      const movingBounds: BoxBounds = {
        id: primaryItem.id,
        left: rawX,
        right: rawX + primaryItem.w_mm,
        top: rawY,
        bottom: rawY + primaryItem.h_mm,
        centerX: rawX + primaryItem.w_mm / 2,
        centerY: rawY + primaryItem.h_mm / 2,
        width: primaryItem.w_mm,
        height: primaryItem.h_mm,
      };

      const snapRes = computeSmartGuides(
        movingBounds,
        otherBoxes,
        template.width_mm,
        template.height_mm,
        showInnerMargins ? template.inner_margins_mm : undefined,
        smartGuidesEnabled
      );

      setActiveSmartGuides(snapRes.guides);

      // Calculate effective delta from snap
      let effectiveDeltaX = deltaX;
      let effectiveDeltaY = deltaY;

      if (snapRes.guides.length > 0) {
        effectiveDeltaX = snapRes.snappedX - primaryOrig.x;
        effectiveDeltaY = snapRes.snappedY - primaryOrig.y;
      } else if (snapToGrid) {
        const snap = 0.5;
        effectiveDeltaX = Math.round((primaryOrig.x + deltaX) / snap) * snap - primaryOrig.x;
        effectiveDeltaY = Math.round((primaryOrig.y + deltaY) / snap) * snap - primaryOrig.y;
      }

      const updatedItems = template.items.map((it) => {
        const orig = dragStartPos.itemsOrigPos.get(it.id);
        if (!orig) return it;
        return {
          ...it,
          x_mm: Math.max(0, Number((orig.x + effectiveDeltaX).toFixed(2))),
          y_mm: Math.max(0, Number((orig.y + effectiveDeltaY).toFixed(2))),
        };
      });

      setTemplate((prev) => ({ ...prev, items: updatedItems }));
    }
  };

  const handleMouseUp = () => {
    setActiveSmartGuides([]);

    if (isResizing) {
      setIsResizing(false);
      setResizeState(null);
      pushState(template);
    }

    if (isDragging) {
      setIsDragging(false);
      setDragStartPos(null);
      pushState(template);
    }
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
              {template.width_mm} × {template.height_mm} mm • {template.items.length} éléments
            </p>
          </div>
        </div>

        {/* Primary Action Buttons & Undo/Redo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Annuler (Ctrl+Z)"
              className="p-1.5 rounded hover:bg-white text-slate-600 disabled:opacity-30 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Rétablir (Ctrl+Y)"
              className="p-1.5 rounded hover:bg-white text-slate-600 disabled:opacity-30 transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {savedNotification && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
              <CheckCircle className="w-4 h-4" />
              Gabarit sauvegardé !
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>Enregistrer</span>
          </button>
          <button
            onClick={exportJson}
            title="Exporter gabarit en JSON"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
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
            <span>Paliers Prix</span>
          </button>
          <button
            onClick={() => addItem('image')}
            className="px-2.5 py-1 rounded hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 font-medium text-slate-700 flex items-center gap-1.5 transition"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Image</span>
          </button>

          {/* Alignment & Distribution Tools when 2+ items selected */}
          {selectedItems.length > 1 && (
            <div className="flex items-center gap-1 ml-3 pl-3 border-l border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Aligner :</span>
              <button
                onClick={() => handleAlign('left')}
                className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200"
                title="Aligner à gauche"
              >
                <AlignLeft className="w-3.5 h-3.5 text-slate-700" />
              </button>
              <button
                onClick={() => handleAlign('center')}
                className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200"
                title="Centrer horizontalement"
              >
                <AlignCenter className="w-3.5 h-3.5 text-slate-700" />
              </button>
              <button
                onClick={() => handleAlign('right')}
                className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200"
                title="Aligner à droite"
              >
                <AlignRight className="w-3.5 h-3.5 text-slate-700" />
              </button>
              <button
                onClick={() => handleAlign('top')}
                className="px-1.5 py-0.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-[10px] font-bold"
                title="Aligner en haut"
              >
                Haut
              </button>
              <button
                onClick={() => handleAlign('middle')}
                className="px-1.5 py-0.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-[10px] font-bold"
                title="Centrer verticalement (Milieu)"
              >
                Milieu
              </button>
              <button
                onClick={() => handleAlign('bottom')}
                className="px-1.5 py-0.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-[10px] font-bold"
                title="Aligner en bas"
              >
                Bas
              </button>
              {selectedItems.length >= 3 && (
                <>
                  <div className="h-3 w-px bg-slate-200 mx-0.5" />
                  <button
                    onClick={() => handleDistribute('horizontal')}
                    className="px-1.5 py-0.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-[10px] font-medium text-slate-600"
                    title="Répartir horizontalement à intervalles égaux"
                  >
                    Répartir H
                  </button>
                  <button
                    onClick={() => handleDistribute('vertical')}
                    className="px-1.5 py-0.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-[10px] font-medium text-slate-600"
                    title="Répartir verticalement à intervalles égaux"
                  >
                    Répartir V
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* View Controls & Data Preview Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Smart Guides Toggle */}
          <button
            onClick={() => setSmartGuidesEnabled(!smartGuidesEnabled)}
            className={`px-2 py-1 rounded border text-[11px] font-medium transition flex items-center gap-1 ${
              smartGuidesEnabled
                ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
            title="Guides intelligents d'alignement dynamique (bords, centres, marges)"
          >
            <Magnet className="w-3 h-3" />
            <span>Guides Intelligents</span>
          </button>

          {/* Snap Grid Toggle */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-2 py-1 rounded border text-[11px] font-medium transition ${
              snapToGrid ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-500'
            }`}
            title="Magnétisme Grille 0.5 mm"
          >
            Grille (0.5mm)
          </button>

          {/* Data Binding Simulator */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Eye className="w-3 h-3 text-slate-400" />
              Données:
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
          onClick={() => setSelectedItemIds([])}
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
              selectedItemIds={selectedItemIds}
              onSelectItem={(id, e) => handleItemMouseDown(id, e)}
              onResizeStart={handleResizeStart}
              smartGuides={activeSmartGuides}
              interactive={true}
              className="ring-1 ring-slate-300"
            />
          </div>
        </div>

        {/* Right Inspector Dock with full Multi-Selection Support */}
        <PropertyInspector
          selectedItems={selectedItems}
          onUpdateItem={handleUpdateItem}
          onUpdateMultipleItems={handleUpdateMultipleItems}
          onDeleteItem={handleDeleteItem}
          onDeleteMultipleItems={handleDeleteMultipleItems}
          onDuplicateItem={handleDuplicateItem}
          onDuplicateMultipleItems={handleDuplicateMultipleItems}
          onReorderItem={handleReorderItem}
        />
      </div>
    </div>
  );
};
