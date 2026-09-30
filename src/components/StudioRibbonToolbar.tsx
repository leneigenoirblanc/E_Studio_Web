/**
 * E-Studio PowerPoint Modern Fluent Ribbon V3
 * 
 * Reproduction moderne et fidèle du Ruban Microsoft PowerPoint 365 :
 * - Barre d'accès rapide & Titre avec commutateur Enregistrement Auto, Annuler/Rétablir, Diaporama/Tirage
 * - Onglet Backstage "Fichier" (Rouge brique PowerPoint #c43e1c) avec menu de sauvegarde et exports
 * - Onglets Fluent : Accueil, Insertion, Conception, Règles, Affichage, Données
 * - Onglets contextuels dynamiques à la Office : "Format de Forme" ou "Outils de Prix V2"
 * - Groupes authentiques avec séparateurs verticaux fins et libellés centrés au bas de chaque groupe
 * - Grands boutons split (ex. Coller, Formes, Prix V2, Disposer) + Grilles 2 rangées (Police, Paragraphe)
 * - Bascule Ruban Classique (2 étages) vs Ruban Simplifié (1 ligne) avec chevron Office
 * - Barre de recherche "Rechercher (Alt+Q)" façon Tell Me / Office Search
 */

import React, { useState, useRef, useEffect } from 'react';
import { LabelTemplate, TemplateItem, ProductRecord } from '../types';
import { AlignmentDirection } from '../utils/canvasAlignment';
import { PriceElement, PricePreset } from '../domain/pricing/presentation';
import { pricingEngine } from '../domain/pricing/pricingEngine';
import {
  Type,
  Square,
  Circle,
  Minus,
  Barcode,
  QrCode,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Scale,
  Sparkles,
  CircleDot,
  Stamp,
  ShieldAlert,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Magnet,
  Grid,
  Ruler,
  Crosshair,
  Sliders,
  Paintbrush,
  Clipboard,
  ClipboardCheck,
  Scissors,
  Lock,
  Unlock,
  Copy,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RotateCcw,
  RotateCw,
  Search,
  Layers,
  Percent,
  Award,
  Flame,
  LayoutGrid,
  Palette,
  Check,
  X,
  FileCheck,
  Save,
  Download,
  Printer,
  FileText,
  Settings,
  HelpCircle,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Cpu,
  MousePointer,
  Hand,
  Maximize,
  SlidersHorizontal,
  FolderOpen,
} from 'lucide-react';
import { ContextTooltip } from '../context/TooltipContext';

export type RibbonTab = 'file' | 'home' | 'insert' | 'design' | 'rules' | 'view' | 'data' | 'format';

interface StudioRibbonToolbarProps {
  template: LabelTemplate;
  selectedItems: TemplateItem[];
  activeTool: 'select' | 'marquee' | 'pan';
  onToolChange: (tool: 'select' | 'marquee' | 'pan') => void;
  onAddItem: (type: string, payload?: any) => void;
  onUpdateItem: (item: TemplateItem) => void;
  onUpdateMultipleItems?: (items: TemplateItem[]) => void;
  onDuplicateItems: (ids: string[]) => void;
  onDeleteItems: (ids: string[]) => void;
  onAlign: (direction: AlignmentDirection) => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  onCenterItem?: (itemId: string, axis: 'x' | 'y' | 'both') => void;
  onReorderItem: (itemId: string, direction: 'up' | 'down') => void;
  onRotateStep90?: (itemId: string) => void;
  onCopyStyle: () => void;
  onPasteStyle: () => void;
  hasCopiedStyle: boolean;
  smartGuidesEnabled: boolean;
  onToggleSmartGuides: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  gridSizeMm: number;
  onChangeGridSize: (size: number) => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  showBleed: boolean;
  onToggleBleed: () => void;
  showInnerMargins: boolean;
  onToggleInnerMargins: () => void;
  isHeatmapActive: boolean;
  onToggleHeatmap: () => void;
  onOpenCalibration: () => void;
  previewDataIndex: number | null;
  onChangePreviewDataIndex: (index: number | null) => void;
  availablePreviewProducts: ProductRecord[];
  isInspectorDrawerOpen: boolean;
  onToggleInspectorDrawer: () => void;

  // Optional Office Title / History integrations
  onBackToHome?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  historyIndex?: number;
  historyLength?: number;
  onSave?: () => void;
  onExportJson?: () => void;
  onOpenGeneration?: () => void;
  onOpenFindReplace?: () => void;
  onOpenRulesModal?: () => void;
}

export const StudioRibbonToolbar: React.FC<StudioRibbonToolbarProps> = ({
  template,
  selectedItems,
  activeTool,
  onToolChange,
  onAddItem,
  onUpdateItem,
  onUpdateMultipleItems,
  onDuplicateItems,
  onDeleteItems,
  onAlign,
  onDistribute,
  onCenterItem,
  onReorderItem,
  onRotateStep90,
  onCopyStyle,
  onPasteStyle,
  hasCopiedStyle,
  smartGuidesEnabled,
  onToggleSmartGuides,
  snapToGrid,
  onToggleSnapToGrid,
  gridSizeMm,
  onChangeGridSize,
  showRulers,
  onToggleRulers,
  showBleed,
  onToggleBleed,
  showInnerMargins,
  onToggleInnerMargins,
  isHeatmapActive,
  onToggleHeatmap,
  onOpenCalibration,
  previewDataIndex,
  onChangePreviewDataIndex,
  availablePreviewProducts,
  isInspectorDrawerOpen,
  onToggleInspectorDrawer,
  onBackToHome,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = true,
  historyIndex = 0,
  historyLength = 1,
  onSave,
  onExportJson,
  onOpenGeneration,
  onOpenFindReplace,
  onOpenRulesModal,
}) => {
  // Navigation & Display Modes
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [isSimplifiedMode, setIsSimplifiedMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('estudio_ribbon_simplified') === 'true';
    } catch {
      return false;
    }
  });

  // Backstage File Menu
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  // Office Quick Search / Tell Me
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Dropdown states for galleries
  const [isShapesGalleryOpen, setIsShapesGalleryOpen] = useState(false);
  const [isPriceGalleryOpen, setIsPriceGalleryOpen] = useState(false);
  const [isArrangeDropdownOpen, setIsArrangeDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [autoSaveActive, setAutoSaveActive] = useState(true);

  // Auto-switch to contextual format tab when element is selected if user was on format
  const primarySelected = selectedItems.length > 0 ? selectedItems[0] : null;
  const isSingle = selectedItems.length === 1;
  const isPrice = primarySelected?.type === 'price' || primarySelected?.type === 'price_block';
  const isV2Price = primarySelected?.type === 'price';
  const isTextLike =
    primarySelected &&
    (primarySelected.type === 'text' ||
      primarySelected.type === 'rich_text' ||
      primarySelected.type === 'curved_text' ||
      isPrice);
  const isShape =
    primarySelected &&
    (primarySelected.type === 'shape' || primarySelected.type === 'ellipse' || primarySelected.type === 'line');
  const isBarcode = primarySelected && (primarySelected.type === 'barcode' || primarySelected.type === 'qrcode');
  const isLocked = Boolean(primarySelected?.locked);

  const pricePreset: PricePreset = isV2Price
    ? (primarySelected as PriceElement).preset || 'simple'
    : (primarySelected as any)?.binding_key === 'PROMOPRICE'
    ? 'promotion'
    : 'simple';

  // Toggle Ribbon Simplified / Classic
  const toggleSimplified = () => {
    setIsSimplifiedMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('estudio_ribbon_simplified', String(next));
      } catch {}
      return next;
    });
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setIsFileMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Font Size Adjust
  const handleFontSizeChange = (delta: number) => {
    if (!primarySelected) return;
    const itemAny = primarySelected as any;
    if (isV2Price) {
      const p = primarySelected as PriceElement;
      const slots = { ...(p.typography?.slots || {}) };
      const curSize = slots.integer?.sizePt || p.typography?.default?.sizePt || 28;
      const newSize = Math.max(6, Math.min(144, curSize + delta * 2));
      if (slots.integer) slots.integer = { ...slots.integer, sizePt: newSize };
      onUpdateItem({ ...p, typography: { ...(p.typography || {}), slots } } as any);
    } else if (primarySelected.type === 'price_block') {
      const currentInt = itemAny.integer_style?.font_size_pt || 28;
      const currentDec = itemAny.decimal_style?.font_size_pt || 14;
      onUpdateItem({
        ...primarySelected,
        integer_style: { ...itemAny.integer_style, font_size_pt: Math.max(6, currentInt + delta * 2) },
        decimal_style: { ...itemAny.decimal_style, font_size_pt: Math.max(5, currentDec + delta) },
      } as any);
    } else if (primarySelected.type === 'text' || primarySelected.type === 'curved_text') {
      const currentSize = itemAny.font_size_pt || 12;
      onUpdateItem({ ...primarySelected, font_size_pt: Math.max(4, Math.min(144, currentSize + delta)) } as any);
    }
  };

  const handleToggleBold = () => {
    if (!primarySelected) return;
    const itemAny = primarySelected as any;
    if (isV2Price) {
      const p = primarySelected as PriceElement;
      const slots = { ...(p.typography?.slots || {}) };
      const curWeight = slots.integer?.weight || 700;
      const newWeight = curWeight === 700 || curWeight === 800 || curWeight === 'bold' ? 400 : 700;
      if (slots.integer) slots.integer = { ...slots.integer, weight: newWeight };
      onUpdateItem({ ...p, typography: { ...(p.typography || {}), slots } } as any);
    } else if (primarySelected.type === 'price_block') {
      const curWeight = itemAny.integer_style?.font_weight || 'bold';
      onUpdateItem({
        ...primarySelected,
        integer_style: { ...itemAny.integer_style, font_weight: curWeight === 'bold' ? 'normal' : 'bold' },
      } as any);
    } else if (primarySelected.type === 'text' || primarySelected.type === 'curved_text') {
      const curWeight = itemAny.font_weight || 'normal';
      onUpdateItem({
        ...primarySelected,
        font_weight: curWeight === 'bold' || curWeight === '800' ? 'normal' : 'bold',
      } as any);
    }
  };

  const handleToggleItalic = () => {
    if (!primarySelected) return;
    const itemAny = primarySelected as any;
    const curStyle = itemAny.font_style || 'normal';
    onUpdateItem({
      ...primarySelected,
      font_style: curStyle === 'italic' ? 'normal' : 'italic',
    } as any);
  };

  const handleColorChange = (color: string) => {
    if (!primarySelected) return;
    const itemAny = primarySelected as any;
    if (isV2Price) {
      const p = primarySelected as PriceElement;
      const slots = { ...(p.typography?.slots || {}) };
      if (slots.integer) slots.integer = { ...slots.integer, color };
      if (slots.decimalSeparator) slots.decimalSeparator = { ...slots.decimalSeparator, color };
      if (slots.fraction) slots.fraction = { ...slots.fraction, color };
      if (slots.currency) slots.currency = { ...slots.currency, color };
      onUpdateItem({ ...p, typography: { ...(p.typography || {}), slots } } as any);
    } else if (primarySelected.type === 'price_block') {
      onUpdateItem({
        ...primarySelected,
        integer_style: { ...itemAny.integer_style, text_color: color },
        decimal_style: { ...itemAny.decimal_style, text_color: color },
        currency_style: { ...itemAny.currency_style, text_color: color },
      } as any);
    } else if (primarySelected.type === 'text' || primarySelected.type === 'curved_text') {
      onUpdateItem({ ...primarySelected, text_color: color } as any);
    } else if (primarySelected.type === 'shape' || primarySelected.type === 'ellipse') {
      onUpdateItem({ ...primarySelected, fill_color: color } as any);
    } else if (primarySelected.type === 'line') {
      onUpdateItem({ ...primarySelected, color } as any);
    }
    setIsColorPickerOpen(false);
  };

  const handlePresetSelect = (preset: PricePreset) => {
    if (!primarySelected) return;
    setIsPriceGalleryOpen(false);
    if (isV2Price) {
      const switched = pricingEngine.switchPreset(primarySelected as PriceElement, preset);
      onUpdateItem(switched as any);
    } else {
      if (preset === 'promotion') {
        onUpdateItem({
          ...primarySelected,
          binding_key: 'PROMOPRICE',
          promo_badge_type: 'discount_pct',
        } as any);
      } else {
        onUpdateItem({
          ...primarySelected,
          binding_key: 'SELLING_PRICE',
          promo_badge_type: undefined,
        } as any);
      }
    }
  };

  const handleCenter = (axis: 'x' | 'y' | 'both') => {
    if (!primarySelected) return;
    if (onCenterItem) {
      onCenterItem(primarySelected.id, axis);
      return;
    }
    const patch: any = {};
    if (axis === 'x' || axis === 'both') {
      patch.x_mm = Math.max(0, Number(((template.width_mm - primarySelected.w_mm) / 2).toFixed(2)));
    }
    if (axis === 'y' || axis === 'both') {
      patch.y_mm = Math.max(0, Number(((template.height_mm - primarySelected.h_mm) / 2).toFixed(2)));
    }
    onUpdateItem({ ...primarySelected, ...patch });
  };

  const officeStandardColors = [
    '#000000', '#ffffff', '#c00000', '#ff0000', '#ffc000',
    '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'
  ];

  // PowerPoint Contextual Tab Title
  const getContextualTabLabel = () => {
    if (!primarySelected) return null;
    if (isPrice) return 'Outils de Prix V2';
    if (isTextLike) return 'Format du Texte';
    if (isShape) return 'Format de la Forme';
    if (isBarcode) return 'Format du Code';
    if (primarySelected.type === 'image') return 'Format de l\'Image';
    return 'Format d\'Objet';
  };

  const contextualTabLabel = getContextualTabLabel();

  // Quick Command Search List
  const searchCommands = [
    { title: 'Ajouter une zone de texte', category: 'Texte', action: () => onAddItem('text') },
    { title: 'Ajouter un texte riche stylé', category: 'Texte', action: () => onAddItem('rich_text') },
    { title: 'Ajouter un texte courbé circulaire', category: 'Texte', action: () => onAddItem('curved_text') },
    { title: 'Insérer un Prix Simple Standard', category: 'Tarifs V2', action: () => onAddItem('price', { preset: 'simple' }) },
    { title: 'Insérer un Prix Promo avec pastille %', category: 'Tarifs V2', action: () => onAddItem('price', { preset: 'promotion' }) },
    { title: 'Insérer un Prix au Kilo / Litre unitaire', category: 'Tarifs V2', action: () => onAddItem('price', { preset: 'unit_price' }) },
    { title: 'Insérer des Paliers dégressifs B2B', category: 'Tarifs V2', action: () => onAddItem('tier_price') },
    { title: 'Insérer un Code-barres EAN-13', category: 'Codes', action: () => onAddItem('barcode') },
    { title: 'Insérer un QR Code vectoriel', category: 'Codes', action: () => onAddItem('qrcode') },
    { title: 'Insérer un Rectangle / Cadre', category: 'Formes', action: () => onAddItem('shape') },
    { title: 'Insérer un Cercle / Pastille', category: 'Formes', action: () => onAddItem('ellipse') },
    { title: 'Insérer une Ligne de séparation', category: 'Formes', action: () => onAddItem('line') },
    { title: 'Insérer une Image / Logo', category: 'Médias', action: () => onAddItem('image') },
    { title: 'Insérer un Pictogramme officiel (Nutri-Score/Bio)', category: 'Réglementaire', action: () => onAddItem('pictogram') },
    { title: 'Activer la Grille millimétrique', category: 'Affichage', action: () => onToggleSnapToGrid() },
    { title: 'Afficher les Règles graduées', category: 'Affichage', action: () => onToggleRulers() },
    { title: 'Activer les Guides magnétiques', category: 'Affichage', action: () => onToggleSmartGuides() },
    { title: 'Ouvrir l\'Atelier d\'Imposition & Tirage', category: 'Impression', action: () => onOpenGeneration?.() },
    { title: 'Rechercher et remplacer', category: 'Édition', action: () => onOpenFindReplace?.() },
  ];

  const filteredCommands = searchQuery.trim()
    ? searchCommands.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchCommands;

  return (
    <div className="bg-[#f3f2f1] text-[#242424] border-b border-[#e1dfdd] select-none z-20 shrink-0 font-sans shadow-xs transition-all duration-150">
      {/* ========================================================================= */}
      {/* 1. POWERPOINT QUICK ACCESS & APP TITLE BAR (BARRE D'ACCÈS RAPIDE)          */}
      {/* ========================================================================= */}
      <div className="h-10 bg-[#f3f2f1] px-3 flex items-center justify-between border-b border-[#edebe9] text-xs">
        {/* Côté Gauche : Back Button + AutoSave Toggle + Sauvegarder + Annuler + Rétablir + Tirage */}
        <div className="flex items-center gap-1.5">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-2 py-1 hover:bg-white rounded-md text-[#605e5c] hover:text-[#242424] transition flex items-center gap-1 font-semibold text-xs border border-transparent hover:border-[#e1dfdd] mr-1"
              title="Retour aux gabarits d'étiquettes (Échap)"
            >
              <ChevronLeft className="w-4 h-4 text-[#c43e1c]" />
              <span className="hidden sm:inline">Gabarits</span>
            </button>
          )}

          {/* Commutateur Enregistrement Automatique */}
          <div className="flex items-center gap-1.5 bg-white/70 hover:bg-white px-2 py-1 rounded-md border border-[#e1dfdd] transition-colors">
            <span className="text-[11px] font-semibold text-[#605e5c]">Enreg. auto</span>
            <button
              onClick={() => setAutoSaveActive(!autoSaveActive)}
              className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                autoSaveActive ? 'bg-[#c43e1c]' : 'bg-[#c8c6c4]'
              }`}
              title={autoSaveActive ? 'Enregistrement automatique actif' : 'Enregistrement automatique désactivé'}
            >
              <span
                className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform ${
                  autoSaveActive ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Bouton Sauvegarder Rapide */}
          <button
            onClick={onSave}
            className="p-1.5 hover:bg-white rounded-md text-[#323130] transition border border-transparent hover:border-[#e1dfdd]"
            title="Enregistrer le gabarit (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5 text-[#c43e1c]" />
          </button>

          {/* Annuler / Rétablir */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 hover:bg-white rounded-md text-[#323130] disabled:opacity-30 transition border border-transparent hover:border-[#e1dfdd]"
              title="Annuler (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 hover:bg-white rounded-md text-[#323130] disabled:opacity-30 transition border border-transparent hover:border-[#e1dfdd]"
              title="Rétablir (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-[#e1dfdd] mx-1" />

          {/* Diaporama / Tirage d'étiquettes */}
          {onOpenGeneration && (
            <button
              onClick={onOpenGeneration}
              className="px-2.5 py-1 bg-white hover:bg-[#faf9f8] text-[#c43e1c] font-semibold rounded-md border border-[#e1dfdd] flex items-center gap-1.5 transition shadow-2xs"
              title="Lancer l'imposition de planches et l'impression (F5)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Générer étiquettes</span>
            </button>
          )}
        </div>

        {/* Centre : Titre du Gabarit + Barre de Recherche Microsoft 365 (Tell Me) */}
        <div className="flex items-center gap-3">
          {/* Titre et dimensions */}
          <div className="hidden sm:flex items-center gap-1.5 text-center">
            <span className="font-bold text-[13px] text-[#242424] max-w-[200px] truncate">
              {template.name}
            </span>
            <span className="text-[11px] font-mono text-[#605e5c] bg-white px-1.5 py-0.5 rounded border border-[#e1dfdd]">
              {template.width_mm} × {template.height_mm} mm
            </span>
          </div>

          {/* Champ Recherche Office "Rechercher (Alt+Q)" */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-48 md:w-64 h-7 bg-white hover:bg-[#faf9f8] border border-[#e1dfdd] rounded-md px-2.5 flex items-center justify-between text-xs text-[#605e5c] transition shadow-2xs"
            >
              <div className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#0078d4]" />
                <span className="truncate">Rechercher une fonction...</span>
              </div>
              <kbd className="hidden md:inline-block px-1 bg-[#f3f2f1] text-[9px] font-mono rounded text-[#8a8886]">
                Alt+Q
              </kbd>
            </button>

            {isSearchOpen && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-[#d2d0ce] p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-[#f3f2f1] rounded-md mb-2">
                  <Search className="w-3.5 h-3.5 text-[#0078d4]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Que voulez-vous faire ?"
                    className="w-full bg-transparent text-xs text-[#242424] outline-none"
                    autoFocus
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-[#8a8886] hover:text-[#242424]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-0.5 scrollbar-thin">
                  {filteredCommands.map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        cmd.action();
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-2.5 py-1.5 rounded text-left text-xs hover:bg-[#f3f2f1] flex items-center justify-between transition group"
                    >
                      <span className="font-semibold text-[#242424] group-hover:text-[#c43e1c]">
                        {cmd.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#edebe9] text-[#605e5c] rounded">
                        {cmd.category}
                      </span>
                    </button>
                  ))}
                  {filteredCommands.length === 0 && (
                    <div className="p-3 text-center text-xs text-[#8a8886]">Aucune commande trouvée</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Côté Droit : Tiroir Inspecteur + Bascule Ruban Simplifié/Classique */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleInspectorDrawer}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition border ${
              isInspectorDrawerOpen
                ? 'bg-[#edebe9] border-[#c8c6c4] text-[#242424]'
                : 'bg-white border-[#e1dfdd] text-[#605e5c] hover:bg-[#faf9f8]'
            }`}
            title="Afficher le volet Propriétés de forme"
          >
            <Sliders className="w-3.5 h-3.5 text-[#c43e1c]" />
            <span className="hidden sm:inline">Volet Format</span>
          </button>

          {/* Bascule Ruban Simplifié (Chevron ^ / v) */}
          <button
            onClick={toggleSimplified}
            className="p-1.5 rounded-md hover:bg-white text-[#605e5c] hover:text-[#242424] transition border border-transparent hover:border-[#e1dfdd]"
            title={isSimplifiedMode ? 'Développer le ruban classique' : 'Réduire en ruban simplifié (1 ligne)'}
          >
            {isSimplifiedMode ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. POWERPOINT TABS HEADER (ONGLETS DU RUBAN)                              */}
      {/* ========================================================================= */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#e1dfdd] bg-[#f3f2f1] text-xs">
        <div className="flex items-center gap-0.5">
          {/* Onglet Rouge Fichier (Backstage PowerPoint) */}
          <div className="relative" ref={fileMenuRef}>
            <button
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
              className="px-3.5 py-1.5 bg-[#c43e1c] hover:bg-[#b13718] text-white font-bold rounded-t-md text-xs tracking-wide transition flex items-center gap-1 shadow-xs"
            >
              <span>Fichier</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {/* Menu Fichier / Backstage Dropdown */}
            {isFileMenuOpen && (
              <div className="absolute left-0 top-full mt-0.5 w-60 bg-white border border-[#d2d0ce] rounded-b-lg shadow-2xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#8a8886]">
                  Options du Gabarit
                </div>
                <button
                  onClick={() => {
                    setIsFileMenuOpen(false);
                    onSave?.();
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-[#f3f2f1] flex items-center gap-2.5 text-[#242424]"
                >
                  <Save className="w-4 h-4 text-[#c43e1c]" />
                  <div>
                    <div className="font-semibold">Enregistrer</div>
                    <div className="text-[10px] text-[#8a8886]">Sauvegarder immédiatement les calques</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsFileMenuOpen(false);
                    onExportJson?.();
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-[#f3f2f1] flex items-center gap-2.5 text-[#242424]"
                >
                  <Download className="w-4 h-4 text-[#0078d4]" />
                  <div>
                    <div className="font-semibold">Exporter au format JSON</div>
                    <div className="text-[10px] text-[#8a8886]">Télécharger le fichier gabarit vectoriel</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsFileMenuOpen(false);
                    onOpenGeneration?.();
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-[#f3f2f1] flex items-center gap-2.5 text-[#242424]"
                >
                  <Printer className="w-4 h-4 text-[#107c41]" />
                  <div>
                    <div className="font-semibold">Imprimer & Imposition</div>
                    <div className="text-[10px] text-[#8a8886]">Générer planches A4/A3, PDF et ZPL</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Onglets standards Office */}
          {[
            { id: 'home', label: 'Accueil' },
            { id: 'insert', label: 'Insertion' },
            { id: 'design', label: 'Création & Format' },
            { id: 'rules', label: 'Règles Dynamiques' },
            { id: 'view', label: 'Affichage' },
            { id: 'data', label: 'Données Produits' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as RibbonTab)}
                onDoubleClick={toggleSimplified}
                className={`px-3 py-1.5 rounded-t-md font-semibold text-xs transition relative ${
                  isActive
                    ? 'bg-white text-[#c43e1c] font-bold shadow-2xs border-t-2 border-t-[#c43e1c]'
                    : 'text-[#605e5c] hover:text-[#242424] hover:bg-[#edebe9]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {/* Onglet Contextuel Dynamique (apparaît quand un objet est sélectionné) */}
          {primarySelected && contextualTabLabel && (
            <button
              onClick={() => setActiveTab('format')}
              className={`px-3 py-1.5 rounded-t-md font-bold text-xs transition flex items-center gap-1.5 border-t-2 ${
                activeTab === 'format'
                  ? 'bg-white text-[#d83b01] border-t-[#d83b01] shadow-2xs'
                  : 'bg-[#ffefe5] text-[#d83b01] border-t-transparent hover:bg-[#fed9cc]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#d83b01]" />
              <span>{contextualTabLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. POWERPOINT RIBBON BODY (COMPARTIMENTS & GROUPES LÉGENDÉS)             */}
      {/* ========================================================================= */}
      <div className={`bg-white px-2 overflow-x-auto scrollbar-thin ${isSimplifiedMode ? 'py-1.5' : 'py-2'}`}>
        {/* ========================================================================= */}
        {/* ONGLET : ACCUEIL (HOME)                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'home' && (
          <div className="flex items-stretch gap-2 shrink-0">
            {/* Groupe 1 : Presse-papiers */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1.5 pb-1">
                {/* Grand bouton Coller */}
                <button
                  onClick={onPasteStyle}
                  disabled={!hasCopiedStyle}
                  className="flex flex-col items-center justify-center px-2 py-1 hover:bg-[#f3f2f1] rounded-md text-[#242424] disabled:opacity-30 transition"
                  title="Appliquer le style copié (Ctrl+Alt+V)"
                >
                  <ClipboardCheck className="w-5 h-5 text-[#107c41]" />
                  <span className="text-[11px] font-semibold mt-0.5">Coller Style</span>
                </button>

                {/* Petits boutons Couper / Copier / Reproduire la mise en forme */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={onCopyStyle}
                    disabled={!primarySelected}
                    className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[#f3f2f1] rounded text-[11px] text-[#242424] disabled:opacity-30 transition"
                    title="Copier le style de l'élément (Ctrl+Alt+C)"
                  >
                    <Paintbrush className="w-3.5 h-3.5 text-[#0078d4]" />
                    <span>Copier style</span>
                  </button>
                  <button
                    onClick={() => primarySelected && onDuplicateItems([primarySelected.id])}
                    disabled={!primarySelected}
                    className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[#f3f2f1] rounded text-[11px] text-[#242424] disabled:opacity-30 transition"
                    title="Dupliquer l'élément (Ctrl+D)"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#605e5c]" />
                    <span>Dupliquer</span>
                  </button>
                </div>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Presse-papiers
                </div>
              )}
            </div>

            {/* Groupe 2 : Calques & Objets */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1 pb-1">
                {/* Outils Pointeurs */}
                <div className="flex flex-col gap-0.5 mr-1">
                  <button
                    onClick={() => onToolChange('select')}
                    className={`p-1.5 rounded-md transition ${
                      activeTool === 'select' ? 'bg-[#c43e1c]/10 text-[#c43e1c] font-bold border border-[#c43e1c]/30' : 'text-[#605e5c] hover:bg-[#f3f2f1]'
                    }`}
                    title="Outil Sélection normale (V)"
                  >
                    <MousePointer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onToolChange('pan')}
                    className={`p-1.5 rounded-md transition ${
                      activeTool === 'pan' ? 'bg-[#c43e1c]/10 text-[#c43e1c] font-bold border border-[#c43e1c]/30' : 'text-[#605e5c] hover:bg-[#f3f2f1]'
                    }`}
                    title="Outil Main / Panoramique (H)"
                  >
                    <Hand className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => primarySelected && onUpdateItem({ ...primarySelected, locked: !isLocked })}
                    disabled={!primarySelected}
                    className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1.5 transition ${
                      isLocked ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-[#f3f2f1] text-[#242424] disabled:opacity-30'
                    }`}
                    title={isLocked ? "Déverrouiller l'élément" : "Verrouiller l'élément (Ctrl+G)"}
                  >
                    {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5 text-[#605e5c]" />}
                    <span>{isLocked ? 'Verrouillé' : 'Verrouiller'}</span>
                  </button>
                  <button
                    onClick={() => primarySelected && onDeleteItems([primarySelected.id])}
                    disabled={!primarySelected}
                    className="px-2 py-0.5 hover:bg-rose-50 text-rose-700 rounded text-[11px] flex items-center gap-1.5 transition disabled:opacity-30"
                    title="Supprimer la sélection (Suppr)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Gabarit & Calques
                </div>
              )}
            </div>

            {/* Groupe 3 : Police & Typographie */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex flex-col gap-1 pb-1">
                {/* Ligne 1 : Stepper taille pt + Gras/Italique/Couleur */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleFontSizeChange(-1)}
                    disabled={!isTextLike}
                    className="p-1 hover:bg-[#f3f2f1] rounded text-[#242424] disabled:opacity-30 transition"
                    title="Réduire la police (A-)"
                  >
                    <span className="font-serif font-bold text-xs">A-</span>
                  </button>

                  <div className="px-2 py-0.5 bg-[#f3f2f1] border border-[#e1dfdd] rounded text-center font-mono text-xs font-bold text-[#242424] min-w-[40px]">
                    {isV2Price
                      ? `${(primarySelected as PriceElement).typography?.slots?.integer?.sizePt || 28}pt`
                      : (primarySelected as any)?.font_size_pt
                      ? `${(primarySelected as any).font_size_pt}pt`
                      : '12pt'}
                  </div>

                  <button
                    onClick={() => handleFontSizeChange(1)}
                    disabled={!isTextLike}
                    className="p-1 hover:bg-[#f3f2f1] rounded text-[#242424] disabled:opacity-30 transition"
                    title="Agrandir la police (A+)"
                  >
                    <span className="font-serif font-bold text-xs">A+</span>
                  </button>

                  <div className="w-[1px] h-3.5 bg-[#e1dfdd] mx-0.5" />

                  {/* Boutons B / I / U / S */}
                  <button
                    onClick={handleToggleBold}
                    disabled={!isTextLike}
                    className="p-1 hover:bg-[#f3f2f1] rounded text-[#242424] font-bold text-xs disabled:opacity-30 transition"
                    title="Gras (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleToggleItalic}
                    disabled={!isTextLike}
                    className="p-1 hover:bg-[#f3f2f1] rounded text-[#242424] italic text-xs disabled:opacity-30 transition"
                    title="Italique (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  {/* Couleur de Texte Popover */}
                  <div className="relative">
                    <button
                      onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                      disabled={!primarySelected}
                      className="p-1 hover:bg-[#f3f2f1] rounded text-[#242424] flex items-center gap-0.5 disabled:opacity-30 transition"
                      title="Couleur de police"
                    >
                      <Palette className="w-3.5 h-3.5 text-[#c43e1c]" />
                      <ChevronDown className="w-2.5 h-2.5 text-[#605e5c]" />
                    </button>

                    {isColorPickerOpen && (
                      <div className="absolute left-0 top-full mt-1 p-2 bg-white rounded-lg shadow-xl border border-[#d2d0ce] z-50 min-w-[140px]">
                        <div className="text-[10px] font-semibold text-[#8a8886] mb-1.5">Couleurs standard</div>
                        <div className="grid grid-cols-6 gap-1">
                          {officeStandardColors.map((c) => (
                            <button
                              key={c}
                              onClick={() => handleColorChange(c)}
                              style={{ backgroundColor: c }}
                              className="w-4 h-4 rounded-xs border border-[#8a8886]/40 hover:scale-125 transition"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ligne 2 : Alignements */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => primarySelected && onUpdateItem({ ...primarySelected, alignment: 'left' } as any)}
                    disabled={!isTextLike}
                    className="p-1 hover:bg-[#f3f2f1] rounded text-[#605e5c] disabled:opacity-30 transition"
                    title="Aligner à gauche"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => primarySelected && onUpdateItem({ ...primarySelected, alignment: 'center' } as any)}
                    disabled={!isTextLike}
                    className="p-1 hover:bg-[#f3f2f1] rounded text-[#605e5c] disabled:opacity-30 transition"
                    title="Centrer"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => primarySelected && onUpdateItem({ ...primarySelected, alignment: 'right' } as any)}
                    disabled={!isTextLike}
                    className="p-1 hover:bg-[#f3f2f1] rounded text-[#605e5c] disabled:opacity-30 transition"
                    title="Aligner à droite"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Police & Paragraphe
                </div>
              )}
            </div>

            {/* Groupe 4 : Dessin & Formes Rapides */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1.5 pb-1">
                {/* Galerie rapide de formes */}
                <div className="grid grid-cols-2 gap-1 bg-[#f3f2f1] p-1 rounded-md border border-[#e1dfdd]">
                  <button
                    onClick={() => onAddItem('shape')}
                    className="p-1 bg-white hover:bg-[#faf9f8] rounded text-[#242424] transition shadow-2xs"
                    title="Rectangle"
                  >
                    <Square className="w-3.5 h-3.5 text-[#0078d4]" />
                  </button>
                  <button
                    onClick={() => onAddItem('ellipse')}
                    className="p-1 bg-white hover:bg-[#faf9f8] rounded text-[#242424] transition shadow-2xs"
                    title="Cercle / Ovale"
                  >
                    <Circle className="w-3.5 h-3.5 text-[#0078d4]" />
                  </button>
                  <button
                    onClick={() => onAddItem('line')}
                    className="p-1 bg-white hover:bg-[#faf9f8] rounded text-[#242424] transition shadow-2xs"
                    title="Ligne"
                  >
                    <Minus className="w-3.5 h-3.5 text-[#0078d4]" />
                  </button>
                  <button
                    onClick={() => onAddItem('text')}
                    className="p-1 bg-white hover:bg-[#faf9f8] rounded text-[#242424] transition shadow-2xs"
                    title="Zone de texte"
                  >
                    <Type className="w-3.5 h-3.5 text-[#0078d4]" />
                  </button>
                </div>

                {/* Organiser (Disposer) Menu */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleCenter('x')}
                    disabled={!primarySelected}
                    className="px-2 py-0.5 hover:bg-[#f3f2f1] rounded text-[11px] text-[#242424] disabled:opacity-30 transition"
                    title="Centrer horizontalement sur l'étiquette"
                  >
                    Centrer H
                  </button>
                  <button
                    onClick={() => handleCenter('y')}
                    disabled={!primarySelected}
                    className="px-2 py-0.5 hover:bg-[#f3f2f1] rounded text-[11px] text-[#242424] disabled:opacity-30 transition"
                    title="Centrer verticalement sur l'étiquette"
                  >
                    Centrer V
                  </button>
                </div>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Dessin & Organiser
                </div>
              )}
            </div>

            {/* Groupe 5 : Édition */}
            <div className="flex flex-col justify-between px-2 shrink-0">
              <div className="flex flex-col gap-1 pb-1">
                <button
                  onClick={onOpenFindReplace}
                  className="px-2.5 py-1 hover:bg-[#f3f2f1] rounded text-xs font-semibold text-[#242424] flex items-center gap-1.5 transition"
                  title="Rechercher et remplacer du texte (Ctrl+F)"
                >
                  <Search className="w-3.5 h-3.5 text-[#0078d4]" />
                  <span>Rechercher...</span>
                </button>
                <button
                  onClick={() => onAlign('center')}
                  disabled={selectedItems.length < 2}
                  className="px-2.5 py-1 hover:bg-[#f3f2f1] rounded text-xs text-[#605e5c] flex items-center gap-1.5 disabled:opacity-30 transition"
                  title="Centrer les éléments sélectionnés entre eux"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                  <span>Aligner sélection</span>
                </button>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Édition
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET : INSERTION (INSERT)                                               */}
        {/* ========================================================================= */}
        {activeTab === 'insert' && (
          <div className="flex items-stretch gap-2 shrink-0">
            {/* Groupe 1 : Tarifs & Prix V2 */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1.5 pb-1">
                <button
                  onClick={() => onAddItem('price', { preset: 'simple' })}
                  className="flex flex-col items-center justify-center px-3 py-1 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-md text-emerald-900 transition shadow-2xs"
                  title="Insérer un prix simple composable avec centimes"
                >
                  <DollarSign className="w-5 h-5 text-emerald-700" />
                  <span className="text-[11px] font-bold mt-0.5">Prix Simple</span>
                </button>

                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => onAddItem('price', { preset: 'promotion' })}
                    className="px-2 py-0.5 hover:bg-[#f3f2f1] rounded text-[11px] text-[#242424] font-medium flex items-center gap-1.5 transition"
                    title="Insérer un prix promotionnel barré avec badge %"
                  >
                    <Tag className="w-3.5 h-3.5 text-rose-600" />
                    <span>Prix Promo %</span>
                  </button>
                  <button
                    onClick={() => onAddItem('price', { preset: 'unit_price' })}
                    className="px-2 py-0.5 hover:bg-[#f3f2f1] rounded text-[11px] text-[#242424] font-medium flex items-center gap-1.5 transition"
                    title="Insérer un prix obligatoire au kg / litre"
                  >
                    <Scale className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Prix au kg / L</span>
                  </button>
                  <button
                    onClick={() => onAddItem('tier_price')}
                    className="px-2 py-0.5 hover:bg-[#f3f2f1] rounded text-[11px] text-[#242424] font-medium flex items-center gap-1.5 transition"
                    title="Insérer un tableau de prix dégressifs par volume B2B"
                  >
                    <Percent className="w-3.5 h-3.5 text-sky-600" />
                    <span>Paliers B2B</span>
                  </button>
                </div>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-bold text-emerald-700 tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Tarifs & Prix V2
                </div>
              )}
            </div>

            {/* Groupe 2 : Codes & Traçabilité */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1 pb-1">
                <button
                  onClick={() => onAddItem('barcode')}
                  className="flex flex-col items-center justify-center px-2.5 py-1 hover:bg-[#f3f2f1] rounded-md text-[#242424] transition"
                  title="Code-barres EAN-13 ou Code 128"
                >
                  <Barcode className="w-5 h-5 text-[#242424]" />
                  <span className="text-[11px] font-semibold mt-0.5">Code-barres</span>
                </button>
                <button
                  onClick={() => onAddItem('qrcode')}
                  className="flex flex-col items-center justify-center px-2.5 py-1 hover:bg-[#f3f2f1] rounded-md text-[#242424] transition"
                  title="QR Code vectoriel dynamique"
                >
                  <QrCode className="w-5 h-5 text-[#0078d4]" />
                  <span className="text-[11px] font-semibold mt-0.5">QR Code</span>
                </button>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Codes & Scan
                </div>
              )}
            </div>

            {/* Groupe 3 : Formes & Tracé */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1 pb-1">
                <button
                  onClick={() => onAddItem('shape')}
                  className="flex flex-col items-center justify-center px-2 py-1 hover:bg-[#f3f2f1] rounded-md text-[#242424] transition"
                  title="Rectangle"
                >
                  <Square className="w-5 h-5 text-[#0078d4]" />
                  <span className="text-[11px] font-medium mt-0.5">Rectangle</span>
                </button>
                <button
                  onClick={() => onAddItem('ellipse')}
                  className="flex flex-col items-center justify-center px-2 py-1 hover:bg-[#f3f2f1] rounded-md text-[#242424] transition"
                  title="Cercle"
                >
                  <Circle className="w-5 h-5 text-[#0078d4]" />
                  <span className="text-[11px] font-medium mt-0.5">Cercle</span>
                </button>
                <button
                  onClick={() => onAddItem('line')}
                  className="flex flex-col items-center justify-center px-2 py-1 hover:bg-[#f3f2f1] rounded-md text-[#242424] transition"
                  title="Ligne séparatrice"
                >
                  <Minus className="w-5 h-5 text-[#605e5c]" />
                  <span className="text-[11px] font-medium mt-0.5">Ligne</span>
                </button>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Formes
                </div>
              )}
            </div>

            {/* Groupe 4 : Médias & Réglementaire */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1.5 pb-1">
                <button
                  onClick={() => onAddItem('image')}
                  className="flex flex-col items-center justify-center px-2.5 py-1 hover:bg-[#f3f2f1] rounded-md text-[#242424] transition"
                  title="Insérer une image ou un logo"
                >
                  <ImageIcon className="w-5 h-5 text-[#107c41]" />
                  <span className="text-[11px] font-semibold mt-0.5">Image</span>
                </button>
                <button
                  onClick={() => onAddItem('pictogram')}
                  className="flex flex-col items-center justify-center px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-md text-emerald-900 border border-emerald-200 transition"
                  title="Pictogrammes officiels (Nutri-Score, AB Bio, Éco-score...)"
                >
                  <Stamp className="w-5 h-5 text-emerald-600" />
                  <span className="text-[11px] font-bold mt-0.5">Picto Légal</span>
                </button>
                <button
                  onClick={() => onAddItem('restricted_area')}
                  className="flex flex-col items-center justify-center px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-md text-rose-900 border border-rose-200 transition"
                  title="Zone d'encoche ou d'exclusion"
                >
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span className="text-[11px] font-semibold mt-0.5">Zone Garde</span>
                </button>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Médias & Normes
                </div>
              )}
            </div>

            {/* Groupe 5 : Textes */}
            <div className="flex flex-col justify-between px-2 shrink-0">
              <div className="flex items-center gap-1 pb-1">
                <button
                  onClick={() => onAddItem('text')}
                  className="flex flex-col items-center justify-center px-2.5 py-1 hover:bg-[#f3f2f1] rounded-md text-[#242424] transition"
                  title="Zone de texte standard"
                >
                  <Type className="w-5 h-5 text-[#0078d4]" />
                  <span className="text-[11px] font-semibold mt-0.5">Texte</span>
                </button>
                <button
                  onClick={() => onAddItem('rich_text')}
                  className="flex flex-col items-center justify-center px-2.5 py-1 hover:bg-[#f3f2f1] rounded-md text-[#242424] transition"
                  title="Texte riche avec plusieurs couleurs/styles"
                >
                  <Sparkles className="w-5 h-5 text-[#881798]" />
                  <span className="text-[11px] font-semibold mt-0.5">Texte Riche</span>
                </button>
                <button
                  onClick={() => onAddItem('curved_text')}
                  className="flex flex-col items-center justify-center px-2.5 py-1 hover:bg-[#f3f2f1] rounded-md text-[#242424] transition"
                  title="Texte circulaire courbé"
                >
                  <CircleDot className="w-5 h-5 text-[#0078d4]" />
                  <span className="text-[11px] font-semibold mt-0.5">Courbé</span>
                </button>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Texte
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET CONTEXTUEL : FORMAT D'OBJET / PRIX (ACTIVÉ SUR SÉLECTION)          */}
        {/* ========================================================================= */}
        {activeTab === 'format' && primarySelected && (
          <div className="flex items-stretch gap-2 shrink-0">
            {/* Groupe 1 : Identification & Dimensions */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1.5 pb-1 font-mono text-xs">
                <div className="bg-[#ffefe5] text-[#d83b01] px-2 py-1 rounded font-bold uppercase text-[10px] border border-[#fed9cc]">
                  {primarySelected.type.replace('_', ' ')}
                </div>
                <div className="text-[#605e5c] font-semibold">
                  {primarySelected.w_mm} × {primarySelected.h_mm} mm
                </div>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-bold text-[#d83b01] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Objet Actif
                </div>
              )}
            </div>

            {/* Si c'est un Prix : Presets Tarifaires V2 */}
            {isPrice && (
              <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
                <div className="flex items-center gap-1 pb-1">
                  {[
                    { id: 'simple', label: 'Standard', icon: DollarSign },
                    { id: 'promotion', label: 'Promo %', icon: Tag },
                    { id: 'unit_price', label: 'Au kg/L', icon: Scale },
                    { id: 'wholesale_tiers', label: 'Paliers', icon: Percent },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePresetSelect(p.id as PricePreset)}
                      className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                        pricePreset === p.id
                          ? 'bg-[#c43e1c] text-white shadow-xs font-bold'
                          : 'bg-[#f3f2f1] text-[#242424] hover:bg-[#edebe9]'
                      }`}
                    >
                      <p.icon className="w-3.5 h-3.5" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
                {!isSimplifiedMode && (
                  <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                    Modèle Tarifaire V2
                  </div>
                )}
              </div>
            )}

            {/* Typographie / Taille / Nuancier */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1.5 pb-1">
                {isTextLike && (
                  <div className="flex items-center gap-1 bg-[#f3f2f1] px-1.5 py-0.5 rounded border border-[#e1dfdd]">
                    <button
                      onClick={() => handleFontSizeChange(-1)}
                      className="p-1 hover:bg-white rounded text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold px-1 text-[#242424]">Taille</span>
                    <button
                      onClick={() => handleFontSizeChange(1)}
                      className="p-1 hover:bg-white rounded text-xs font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={handleToggleBold}
                      className="p-1 hover:bg-white rounded text-xs font-bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Nuancier */}
                <div className="flex items-center gap-1">
                  {['#0f172a', '#dc2626', '#16a34a', '#2563eb', '#ffffff'].map((c) => (
                    <button
                      key={c}
                      onClick={() => handleColorChange(c)}
                      style={{ backgroundColor: c }}
                      className="w-4 h-4 rounded-full border border-[#8a8886] hover:scale-125 transition"
                    />
                  ))}
                </div>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Styles & Couleurs
                </div>
              )}
            </div>

            {/* Alignement & Centrage */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1 pb-1">
                <button
                  onClick={() => handleCenter('x')}
                  className="px-2 py-1 bg-[#f3f2f1] hover:bg-[#edebe9] rounded text-xs font-medium text-[#242424] transition"
                  title="Centrer horizontalement sur l'étiquette"
                >
                  Centrer H
                </button>
                <button
                  onClick={() => handleCenter('y')}
                  className="px-2 py-1 bg-[#f3f2f1] hover:bg-[#edebe9] rounded text-xs font-medium text-[#242424] transition"
                  title="Centrer verticalement sur l'étiquette"
                >
                  Centrer V
                </button>
                {onRotateStep90 && (
                  <button
                    onClick={() => onRotateStep90(primarySelected.id)}
                    className="p-1.5 bg-[#f3f2f1] hover:bg-[#edebe9] rounded text-[#242424] transition"
                    title="Pivoter de 90° dans le sens horaire"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Position & Rotation
                </div>
              )}
            </div>

            {/* Actions : Verrouiller / Dupliquer / Supprimer */}
            <div className="flex flex-col justify-between px-2 shrink-0">
              <div className="flex items-center gap-1 pb-1">
                <button
                  onClick={() => onUpdateItem({ ...primarySelected, locked: !isLocked })}
                  className={`p-1.5 rounded transition ${
                    isLocked ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-[#f3f2f1] text-[#605e5c]'
                  }`}
                  title="Verrouiller/Déverrouiller"
                >
                  {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => onDuplicateItems([primarySelected.id])}
                  className="p-1.5 hover:bg-[#f3f2f1] rounded text-[#605e5c] transition"
                  title="Dupliquer (Ctrl+D)"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteItems([primarySelected.id])}
                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Gestion
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET : CRÉATION & FORMAT (DESIGN)                                       */}
        {/* ========================================================================= */}
        {activeTab === 'design' && (
          <div className="flex items-stretch gap-2 shrink-0">
            {/* Dimensions */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-2 pb-1 font-mono text-xs font-bold text-[#242424]">
                <span>{template.width_mm} × {template.height_mm} mm</span>
                <span className="text-[#8a8886] font-normal text-[11px]">({template.items.length} éléments)</span>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Dimensions du Gabarit
                </div>
              )}
            </div>

            {/* Marges & Débord */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1.5 pb-1">
                <button
                  onClick={onToggleInnerMargins}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    showInnerMargins ? 'bg-[#edebe9] text-[#242424] font-bold' : 'text-[#605e5c] hover:bg-[#f3f2f1]'
                  }`}
                >
                  Marges Intérieures
                </button>
                <button
                  onClick={onToggleBleed}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    showBleed ? 'bg-[#edebe9] text-[#242424] font-bold' : 'text-[#605e5c] hover:bg-[#f3f2f1]'
                  }`}
                >
                  Débord (Bleed)
                </button>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Marges de Sécurité
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET : RÈGLES DYNAMIQUES & AUTOMATISATION                                */}
        {/* ========================================================================= */}
        {activeTab === 'rules' && (
          <div className="flex items-stretch gap-2 shrink-0">
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-2 pb-1">
                <button
                  onClick={onOpenRulesModal}
                  className="px-3 py-1.5 bg-[#5c2d91] hover:bg-[#4b2476] text-white font-bold text-xs rounded-md flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Ouvrir l'Atelier de Règles Omni-Canal</span>
                </button>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Moteur d'Orchestration
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET : AFFICHAGE (VIEW)                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'view' && (
          <div className="flex items-stretch gap-2 shrink-0">
            {/* Règles & Repères */}
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-1.5 pb-1">
                <button
                  onClick={onToggleRulers}
                  className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                    showRulers ? 'bg-amber-100 text-amber-900 font-bold' : 'text-[#605e5c] hover:bg-[#f3f2f1]'
                  }`}
                  title="Afficher/masquer les règles graduées"
                >
                  <Ruler className="w-3.5 h-3.5 text-amber-700" />
                  <span>Règles</span>
                </button>

                <button
                  onClick={onToggleSnapToGrid}
                  className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                    snapToGrid ? 'bg-[#0078d4] text-white font-bold' : 'text-[#605e5c] hover:bg-[#f3f2f1]'
                  }`}
                  title="Activer/désactiver la grille magnétique"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grille</span>
                </button>

                {snapToGrid && (
                  <select
                    value={gridSizeMm}
                    onChange={(e) => onChangeGridSize(parseFloat(e.target.value))}
                    className="text-xs font-mono font-bold bg-[#f3f2f1] border border-[#e1dfdd] rounded px-1.5 py-0.5 text-[#242424] outline-none"
                  >
                    <option value={0.5}>0.5mm</option>
                    <option value={1}>1mm</option>
                    <option value={2}>2mm</option>
                    <option value={5}>5mm</option>
                  </select>
                )}

                <button
                  onClick={onToggleSmartGuides}
                  className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                    smartGuidesEnabled ? 'bg-rose-100 text-rose-900 font-bold' : 'text-[#605e5c] hover:bg-[#f3f2f1]'
                  }`}
                  title="Aimantation automatique entre objets"
                >
                  <Magnet className="w-3.5 h-3.5" />
                  <span>Repères</span>
                </button>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Afficher / Masquer
                </div>
              )}
            </div>

            {/* Diagnostic Visuel */}
            <div className="flex flex-col justify-between px-2 shrink-0">
              <div className="flex items-center gap-1.5 pb-1">
                <button
                  onClick={onToggleHeatmap}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                    isHeatmapActive ? 'bg-amber-500 text-slate-950 shadow-xs' : 'hover:bg-[#f3f2f1] text-[#242424]'
                  }`}
                  title="Calque Heatmap (Touche M)"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${isHeatmapActive ? 'bg-slate-950' : 'bg-amber-500'}`} />
                  <span>Heatmap</span>
                </button>

                <button
                  onClick={onOpenCalibration}
                  className="px-2.5 py-1 rounded text-xs font-medium hover:bg-[#f3f2f1] text-[#242424] flex items-center gap-1 transition"
                  title="Calibrer sur photo d'étiquette réelle"
                >
                  <Crosshair className="w-3.5 h-3.5 text-amber-600" />
                  <span>Calibration</span>
                </button>
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Diagnostic
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET : DONNÉES PRODUITS (DATA)                                          */}
        {/* ========================================================================= */}
        {activeTab === 'data' && (
          <div className="flex items-stretch gap-2 shrink-0">
            <div className="flex flex-col justify-between px-2 border-r border-[#edebe9] shrink-0">
              <div className="flex items-center gap-2 pb-1">
                {previewDataIndex === null ? (
                  <button
                    onClick={() => onChangePreviewDataIndex(0)}
                    className="px-3 py-1 bg-[#0078d4] hover:bg-[#106ebe] text-white font-bold text-xs rounded flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lancer la Simulation Données</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        onChangePreviewDataIndex(
                          previewDataIndex > 0 ? previewDataIndex - 1 : availablePreviewProducts.length - 1
                        )
                      }
                      className="p-1 hover:bg-[#f3f2f1] rounded text-[#242424]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-xs font-bold text-[#0078d4] bg-[#f3f2f1] px-2 py-0.5 rounded">
                      #{previewDataIndex + 1}/{availablePreviewProducts.length}
                    </span>
                    <button
                      onClick={() =>
                        onChangePreviewDataIndex(
                          previewDataIndex < availablePreviewProducts.length - 1 ? previewDataIndex + 1 : 0
                        )
                      }
                      className="p-1 hover:bg-[#f3f2f1] rounded text-[#242424]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <span className="text-xs font-semibold text-[#242424] max-w-[200px] truncate px-1">
                      {availablePreviewProducts[previewDataIndex]?.name || 'Article Catalogue'}
                    </span>

                    <button
                      onClick={() => onChangePreviewDataIndex(null)}
                      className="text-xs font-medium text-rose-600 hover:underline ml-1"
                    >
                      Désactiver
                    </button>
                  </div>
                )}
              </div>
              {!isSimplifiedMode && (
                <div className="text-[10px] text-center font-medium text-[#8a8886] tracking-tight border-t border-[#f3f2f1] pt-0.5">
                  Simulation Données Catalogue
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
