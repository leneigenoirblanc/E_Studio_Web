import React, { useState, useMemo } from 'react';
import { LabelTemplate, ProductRecord, ImpositionConfig, PdfExportConfig } from '../types';
import { SAMPLE_PRODUCTS } from '../sampleData';
import { LabelRenderer } from './LabelRenderer';
import { ImpositionCalculator } from '../utils/impositionCalculator';
import { TierEngine } from '../utils/tierEngine';
import { DataMappingModal } from './DataMappingModal';
import { PptxExporter } from '../utils/pptxExporter';
import { ZplExporter } from '../utils/zplExporter';
import { AVERY_STANDARD_CATALOG } from '../utils/averyCatalog';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  Upload,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  Grid,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Sliders,
  Presentation,
  Cpu,
  BookmarkCheck,
  Settings2,
} from 'lucide-react';

interface GenerationWorkspaceProps {
  template: LabelTemplate;
  onBack: () => void;
}

export const GenerationWorkspace: React.FC<GenerationWorkspaceProps> = ({ template, onBack }) => {
  const [products, setProducts] = useState<ProductRecord[]>(SAMPLE_PRODUCTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'data' | 'imposition'>('preview');

  // Excel Mapping Modal State
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);

  // Imposition sheet configuration (default landscape as requested)
  const [impositionConfig, setImpositionConfig] = useState<ImpositionConfig>({
    page_size: 'A4',
    orientation: 'landscape',
    gap_mm: 2.0,
    show_cut_marks: true,
    start_offset_slot: 0,
  });

  // PDF Export Config
  const [pdfConfig, setPdfConfig] = useState<PdfExportConfig>({
    dpi: 300,
    bleed_mm: 2.0,
    show_crop_marks: true,
    show_registration_marks: false,
    include_calibration_layer: false,
    color_mode: 'cmyk_sim',
  });

  // ZPL Config Modal
  const [zplDpi, setZplDpi] = useState<203 | 300 | 600>(203);
  const [showZplModal, setShowZplModal] = useState(false);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.ITEMNAME.toLowerCase().includes(term) ||
        (p.PRODUCT_SCAN && p.PRODUCT_SCAN.includes(term)) ||
        (p.PARTNO && p.PARTNO.toLowerCase().includes(term)) ||
        (p.CATEGORY_NAME && p.CATEGORY_NAME.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const currentProduct = filteredProducts[currentIndex] || filteredProducts[0] || null;

  // Imposition calculation
  const imposition = useMemo(() => {
    try {
      return ImpositionCalculator.calculate(
        template.width_mm,
        template.height_mm,
        template.outer_margins_mm,
        impositionConfig
      );
    } catch {
      return null;
    }
  }, [template, impositionConfig]);

  // Preflight diagnostics for rows
  const diagnostics = useMemo(() => {
    return products.map((record) => {
      const issues: { type: 'warning' | 'error'; message: string }[] = [];

      // Check for barcodes if template has barcode items
      const barcodeItem = template.items.find((i) => i.type === 'barcode');
      if (barcodeItem && (!record.PRODUCT_SCAN || record.PRODUCT_SCAN.trim() === '')) {
        issues.push({ type: 'warning', message: 'Code-barres manquant' });
      }

      // Check strict tier items
      const strictTierItem = template.items.find((i) => i.type === 'tier_price' && i.strict_required);
      if (strictTierItem && strictTierItem.type === 'tier_price') {
        const res = TierEngine.resolve(
          {
            primary_index: Math.max(0, strictTierItem.primary_tier - 1),
            strict_required: true,
          },
          record
        );
        if (res?.error) {
          issues.push({ type: 'error', message: res.error });
        }
      }

      return {
        id: record.id,
        issues,
        status: issues.some((i) => i.type === 'error')
          ? 'error'
          : issues.length > 0
          ? 'warning'
          : 'valid',
      };
    });
  }, [products, template]);

  // Excel / CSV File Import with Data Mapping Tool
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = new Uint8Array(loadEvent.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length > 0) {
          // Extract column headers dynamically
          const headers = Object.keys(rawJson[0]);
          setRawHeaders(headers);
          setRawRows(rawJson);
          setMappingModalOpen(true);
        }
      } catch (err) {
        alert("Erreur lors de l'importation du fichier Excel/CSV : " + String(err));
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input so user can reload same file
    e.target.value = '';
  };

  const handleApplyMapping = (mappedProducts: ProductRecord[]) => {
    setProducts(mappedProducts);
    setCurrentIndex(0);
    setMappingModalOpen(false);
  };

  // Export Excel template of current records
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      products.map((p) => ({
        STORE_NAME: p.STORE_NAME,
        PRODUCT_SCAN: p.PRODUCT_SCAN,
        PARTNO: p.PARTNO,
        ITEMNAME: p.ITEMNAME,
        CATEGORY_NAME: p.CATEGORY_NAME,
        BRAND_INFO: p.BRAND_INFO,
        SELLING_UNIT: p.SELLING_UNIT,
        SELLING_PRICE: p.SELLING_PRICE,
        PROMOPRICE: p.PROMOPRICE || '',
        CASE_SIZE: p.CASE_SIZE || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Articles");
    XLSX.writeFile(wb, "catalogue_articles_estudio.xlsx");
  };

  // PowerPoint (.pptx) Export
  const handleExportPptx = async () => {
    if (!imposition) return;
    try {
      await PptxExporter.exportToPptx(template, products, imposition, impositionConfig);
    } catch (err) {
      alert("Erreur lors de l'export PowerPoint : " + String(err));
    }
  };

  // ZPL Direct Thermal Export
  const handleExportZpl = () => {
    try {
      const zplContent = ZplExporter.generateBatchZpl(template, products, {
        dpi: zplDpi,
        quantity: 1,
        printSpeed: 4,
        darkness: 15,
        includeComments: true,
      });
      const filename = `thermique_${template.name.toLowerCase().replace(/\s+/g, '_')}_${zplDpi}dpi.zpl`;
      ZplExporter.downloadZplFile(filename, zplContent);
      setShowZplModal(false);
    } catch (err) {
      alert("Erreur lors de la génération ZPL : " + String(err));
    }
  };

  // Helper: Build the printable PDF document
  const buildPdfDocument = () => {
    if (!imposition) return null;
    const isLandscape = impositionConfig.orientation === 'landscape';
    const pdfFormat =
      impositionConfig.page_size === 'CUSTOM' && impositionConfig.custom_page_w_mm && impositionConfig.custom_page_h_mm
        ? [impositionConfig.custom_page_w_mm, impositionConfig.custom_page_h_mm]
        : impositionConfig.page_size.toLowerCase();

    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: pdfFormat as any,
    });

    const labelsPerPage = imposition.total_per_page;
    const startOffset = Math.max(0, Math.min(labelsPerPage - 1, impositionConfig.start_offset_slot || 0));
    
    // Calculate total pages considering start offset
    const totalItemsToPlace = products.length + startOffset;
    const totalPages = Math.ceil(totalItemsToPlace / labelsPerPage);

    let productCursor = 0;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();

      // Draw labels on page
      for (let slot = 0; slot < labelsPerPage; slot++) {
        // If on page 0 and slot is before start offset, skip this slot (reuse partially printed sheets)
        if (page === 0 && slot < startOffset) {
          continue;
        }

        if (productCursor >= products.length) break;
        const prod = products[productCursor];
        productCursor++;

        const col = slot % imposition.cols;
        const row = Math.floor(slot / imposition.cols);

        const x = imposition.horizontal_offset_mm + col * (imposition.label_total_w_mm + impositionConfig.gap_mm);
        const y = imposition.vertical_offset_mm + row * (imposition.label_total_h_mm + impositionConfig.gap_mm);

        // Label border
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.rect(x, y, template.width_mm, template.height_mm);

        // Inner printable margins guide / crop marks
        if (impositionConfig.show_cut_marks) {
          doc.setDrawColor(180, 180, 180);
          doc.line(x - 1, y, x + 1, y);
          doc.line(x, y - 1, x, y + 1);
        }

        // Print core texts
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(prod.STORE_NAME || 'MAGASIN', x + 2, y + 4);

        doc.setFontSize(10);
        doc.text(prod.ITEMNAME.slice(0, 35), x + 2, y + 10);

        // Price
        doc.setFontSize(14);
        doc.setTextColor(2, 132, 199);
        doc.text(`${prod.SELLING_PRICE.toLocaleString('fr-FR')} FCFA`, x + template.width_mm - 2, y + 14, { align: 'right' });

        // Barcode text placeholder
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        if (prod.PRODUCT_SCAN) {
          doc.text(`EAN: ${prod.PRODUCT_SCAN}`, x + 2, y + template.height_mm - 3);
        }
        if (prod.PARTNO) {
          doc.text(`SKU: ${prod.PARTNO}`, x + template.width_mm - 2, y + template.height_mm - 3, { align: 'right' });
        }
      }
    }
    return doc;
  };

  // Generate and download Imposed PDF
  const handleGeneratePdf = () => {
    const doc = buildPdfDocument();
    if (doc) {
      doc.save(`etiquettes_imposees_${template.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    }
  };

  // Direct Print to Physical Printer via iframe/blob
  const handleDirectPrint = () => {
    const doc = buildPdfDocument();
    if (!doc) return;

    try {
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      // Create hidden iframe to trigger native browser/physical print dialog
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.src = blobUrl;

      printIframe.onload = () => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch {
          window.open(blobUrl, '_blank');
        }
      };

      document.body.appendChild(printIframe);
    } catch {
      window.print();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour Gabarits</span>
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Génération d'Étiquettes</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                Gabarit: {template.name}
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-mono">
              {products.length} articles chargés • Gabarit figé ({template.width_mm} × {template.height_mm} mm)
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 font-semibold rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'preview' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Aperçu Étiquette</span>
          </button>
          <button
            onClick={() => setActiveTab('imposition')}
            className={`px-3 py-1 font-semibold rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'imposition' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Imposition Planche</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1 font-semibold rounded-md flex items-center gap-1.5 transition ${
              activeTab === 'data' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Tableau Articles ({products.length})</span>
          </button>
        </div>

        {/* Export & Print actions */}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition">
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Importer Excel / CSV</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            title="Exporter catalogue au format Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowZplModal(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
            title="Exporter au format ZPL pour imprimantes thermiques Zebra/TSC"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Thermique (ZPL)</span>
          </button>
          <button
            onClick={handleExportPptx}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
            title="Exporter planche en diapositives PowerPoint éditables (.pptx)"
          >
            <Presentation className="w-3.5 h-3.5 text-white" />
            <span>Export PowerPoint</span>
          </button>
          <button
            onClick={handleDirectPrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
            title="Impression directe sur imprimante physique"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Imprimer Direct</span>
          </button>
          <button
            onClick={handleGeneratePdf}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
            title="Télécharger planche complète en PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger PDF</span>
          </button>
        </div>
      </header>

      {/* Tab 1: Single Label Live Preview with Next/Prev Carousel */}
      {activeTab === 'preview' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Articles List */}
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 bg-slate-50/70">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher article, EAN, SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentIndex(0);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredProducts.map((p, idx) => {
                const diag = diagnostics.find((d) => d.id === p.id);
                const isSelected = idx === currentIndex;
                return (
                  <div
                    key={p.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`p-3 cursor-pointer transition flex items-start gap-2.5 ${
                      isSelected ? 'bg-blue-50/80 border-l-3 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="pt-0.5">
                      {diag?.status === 'error' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      ) : diag?.status === 'warning' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{p.PARTNO}</span>
                        <span className="font-bold text-xs text-slate-900">
                          {p.SELLING_PRICE.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                      <p className="font-semibold text-xs text-slate-800 truncate mt-0.5">{p.ITEMNAME}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-mono">{p.PRODUCT_SCAN || 'Sans code-barres'}</span>
                        {p.TIERS && p.TIERS.length > 0 && (
                          <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded text-[9px] font-bold">
                            {p.TIERS.length} paliers
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Main Stage: Preview & Controls */}
          <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
            {/* Carousel Navigation Bar */}
            <div className="h-11 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex((c) => Math.max(0, c - 1))}
                  disabled={currentIndex === 0}
                  className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs font-bold text-slate-700">
                  Article {currentIndex + 1} sur {filteredProducts.length}
                </span>
                <button
                  onClick={() => setCurrentIndex((c) => Math.min(filteredProducts.length - 1, c + 1))}
                  disabled={currentIndex === filteredProducts.length - 1}
                  className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {currentProduct && (
                <div className="text-xs text-slate-600 flex items-center gap-3">
                  <span>
                    Marque: <strong className="text-slate-800">{currentProduct.BRAND_INFO || '—'}</strong>
                  </span>
                  <span>
                    Rayon: <strong className="text-slate-800">{currentProduct.CATEGORY_NAME || '—'}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Centered Preview Canvas */}
            <div
              className="flex-1 flex items-center justify-center p-8 overflow-auto"
              style={{
                backgroundColor: '#e2e8f0',
                backgroundImage:
                  'radial-gradient(#cbd5e1 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, #e2e8f0 1.5px)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            >
              {currentProduct ? (
                <div className="shadow-2xl ring-1 ring-slate-300">
                  <LabelRenderer
                    template={template}
                    record={currentProduct}
                    zoom={1.6}
                    showBleed={false}
                    showInnerMargins={false}
                    showHazardWarnings={false}
                    interactive={false}
                  />
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Aucun article sélectionné</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Imposition Planche Sheet Layout */}
      {activeTab === 'imposition' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Settings Panel */}
          <div className="w-80 bg-white border-r border-slate-200 p-5 flex flex-col gap-4 text-xs shrink-0 overflow-y-auto">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-400">
              Paramètres d'Imposition Planche
            </h3>

            {/* Avery / Standard Formats Preset Quick Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Modèle Planche / Avery</span>
                </label>
              </div>
              <select
                onChange={(e) => {
                  const preset = AVERY_STANDARD_CATALOG.find((p) => p.id === e.target.value);
                  if (preset) {
                    setImpositionConfig({
                      ...impositionConfig,
                      page_size: preset.pageSize === 'ROLL' ? 'CUSTOM' : preset.pageSize,
                      gap_mm: 0,
                    });
                  }
                }}
                defaultValue=""
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="" disabled>Sélectionner un format standard...</option>
                {AVERY_STANDARD_CATALOG.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.labelsPerPage}/page)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Format Papier Physique</label>
              <select
                value={impositionConfig.page_size}
                onChange={(e) =>
                  setImpositionConfig({ ...impositionConfig, page_size: e.target.value as any })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="A3">A3 (297 × 420 mm)</option>
                <option value="A5">A5 (148 × 210 mm)</option>
                <option value="A6">A6 (105 × 148 mm)</option>
                <option value="LETTER">US Letter (215.9 × 279.4 mm)</option>
                <option value="CUSTOM">Personnalisé (Custom mm)</option>
              </select>
            </div>

            {impositionConfig.page_size === 'CUSTOM' && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2">
                <span className="font-semibold text-slate-700 text-[11px]">Dimensions Page Personnalisée</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block mb-0.5">Largeur (mm)</span>
                    <input
                      type="number"
                      min="20"
                      max="1000"
                      value={impositionConfig.custom_page_w_mm || 210}
                      onChange={(e) =>
                        setImpositionConfig({
                          ...impositionConfig,
                          custom_page_w_mm: parseFloat(e.target.value) || 210,
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block mb-0.5">Hauteur (mm)</span>
                    <input
                      type="number"
                      min="20"
                      max="1000"
                      value={impositionConfig.custom_page_h_mm || 297}
                      onChange={(e) =>
                        setImpositionConfig({
                          ...impositionConfig,
                          custom_page_h_mm: parseFloat(e.target.value) || 297,
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImpositionConfig({ ...impositionConfig, orientation: 'portrait' })}
                  className={`py-1.5 px-3 rounded-lg border text-center font-medium transition ${
                    impositionConfig.orientation === 'portrait'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setImpositionConfig({ ...impositionConfig, orientation: 'landscape' })}
                  className={`py-1.5 px-3 rounded-lg border text-center font-medium transition ${
                    impositionConfig.orientation === 'landscape'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Paysage
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Espacement entre étiquettes (mm)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={impositionConfig.gap_mm}
                onChange={(e) =>
                  setImpositionConfig({ ...impositionConfig, gap_mm: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            {/* Start Offset / Re-use partially used sheet */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <span>Réutilisation de Planche (Décalage)</span>
                </label>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                  Sauter: {impositionConfig.start_offset_slot || 0}
                </span>
              </div>
              <p className="text-[10px] text-amber-700 leading-tight">
                Pour réutiliser une feuille entamée sans gâcher de papier, indiquez le nombre d'étiquettes déjà décollées.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, (imposition?.total_per_page || 24) - 1)}
                  value={impositionConfig.start_offset_slot || 0}
                  onChange={(e) =>
                    setImpositionConfig({
                      ...impositionConfig,
                      start_offset_slot: parseInt(e.target.value) || 0,
                    })
                  }
                  className="flex-1 accent-amber-600 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setImpositionConfig({ ...impositionConfig, start_offset_slot: 0 })}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 rounded"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="font-semibold text-slate-700">Repères de coupe (Crop marks)</label>
              <input
                type="checkbox"
                checked={impositionConfig.show_cut_marks}
                onChange={(e) =>
                  setImpositionConfig({ ...impositionConfig, show_cut_marks: e.target.checked })
                }
                className="rounded text-blue-600"
              />
            </div>

            {/* Advanced PDF Export Config */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                  <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Résolution & Finition PDF</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block mb-0.5">Résolution (DPI)</span>
                  <select
                    value={pdfConfig.dpi}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, dpi: parseInt(e.target.value) as any })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                  >
                    <option value={150}>150 DPI (Brouillon)</option>
                    <option value={300}>300 DPI (HD Print)</option>
                    <option value={600}>600 DPI (Ultra Pro)</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block mb-0.5">Fond Perdu (Bleed)</span>
                  <select
                    value={pdfConfig.bleed_mm}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, bleed_mm: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  >
                    <option value={0}>0 mm</option>
                    <option value={1}>1.0 mm</option>
                    <option value={2}>2.0 mm</option>
                    <option value={3}>3.0 mm</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Print Calibration Offset Controls */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 text-xs">Calibration Imprimante (Décalage)</label>
                <span className="text-[10px] text-slate-400 font-mono">± 0.1 mm</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block mb-0.5">Axe X (mm)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="-25"
                    max="25"
                    value={impositionConfig.calibration_x_mm || 0}
                    onChange={(e) =>
                      setImpositionConfig({
                        ...impositionConfig,
                        calibration_x_mm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block mb-0.5">Axe Y (mm)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="-25"
                    max="25"
                    value={impositionConfig.calibration_y_mm || 0}
                    onChange={(e) =>
                      setImpositionConfig({
                        ...impositionConfig,
                        calibration_y_mm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>

            {/* Imposition Results Summary */}
            {imposition && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-2">
                <span className="font-bold text-slate-900 block text-xs">Calcul de Grille Physique</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    Colonnes: <strong className="text-slate-900">{imposition.cols}</strong>
                  </div>
                  <div>
                    Lignes: <strong className="text-slate-900">{imposition.rows}</strong>
                  </div>
                  <div>
                    Par feuille: <strong className="text-blue-700">{imposition.total_per_page} étiquettes</strong>
                  </div>
                  <div>
                    Feuilles requises: <strong className="text-slate-900">{Math.ceil((products.length + (impositionConfig.start_offset_slot || 0)) / imposition.total_per_page)}</strong>
                  </div>
                  <div>
                    Marge Horiz.: <strong className="text-slate-900">{imposition.horizontal_offset_mm.toFixed(1)} mm</strong>
                  </div>
                  <div>
                    Marge Vert.: <strong className="text-slate-900">{imposition.vertical_offset_mm.toFixed(1)} mm</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Visual Imposition Sheet Preview */}
          <div className="flex-1 bg-slate-200 p-8 flex flex-col items-center justify-center overflow-auto">
            <div className="mb-2 text-xs font-medium text-slate-600 flex items-center gap-2">
              <span>Feuille #1 — Cliquez sur un emplacement pour définir l'étiquette de départ</span>
            </div>
            {imposition && (
              <div
                className="bg-white shadow-2xl relative border border-slate-300"
                style={{
                  width: `${imposition.page_w_mm * 1.5}px`,
                  height: `${imposition.page_h_mm * 1.5}px`,
                }}
              >
                {/* Visual grid of labels */}
                {Array.from({ length: imposition.total_per_page }).map((_, slotIdx) => {
                  const col = slotIdx % imposition.cols;
                  const row = Math.floor(slotIdx / imposition.cols);
                  const startOffset = impositionConfig.start_offset_slot || 0;
                  const isSkipped = slotIdx < startOffset;
                  const prodIndex = slotIdx - startOffset;
                  const prod = prodIndex >= 0 ? products[prodIndex] : undefined;

                  const x = imposition.horizontal_offset_mm + col * (imposition.label_total_w_mm + impositionConfig.gap_mm);
                  const y = imposition.vertical_offset_mm + row * (imposition.label_total_h_mm + impositionConfig.gap_mm);

                  return (
                    <div
                      key={slotIdx}
                      onClick={() => {
                        setImpositionConfig({
                          ...impositionConfig,
                          start_offset_slot: isSkipped ? 0 : slotIdx,
                        });
                      }}
                      className={`absolute border flex flex-col justify-between p-1 overflow-hidden cursor-pointer transition ${
                        isSkipped
                          ? 'border-dashed border-amber-300 bg-amber-50/40 text-amber-500 opacity-60 hover:opacity-100'
                          : 'border-slate-300 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300'
                      }`}
                      style={{
                        left: `${x * 1.5}px`,
                        top: `${y * 1.5}px`,
                        width: `${template.width_mm * 1.5}px`,
                        height: `${template.height_mm * 1.5}px`,
                      }}
                      title={isSkipped ? `Emplacement #${slotIdx + 1} sauté (déjà utilisé). Cliquer pour réactiver.` : `Cliquer pour démarrer à l'emplacement #${slotIdx + 1}`}
                    >
                      {isSkipped ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <span className="text-[8px] font-bold text-amber-700">Déjà Utilisé (#{slotIdx + 1})</span>
                          <span className="text-[7px] text-amber-600/80">Sauté</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-[8px] font-bold text-slate-700">
                            <span className="truncate">{prod ? prod.ITEMNAME : `Emplacement #${slotIdx + 1}`}</span>
                            {prod && <span className="text-blue-600">{prod.SELLING_PRICE} F</span>}
                          </div>
                          <div className="flex items-center justify-between text-[7px] text-slate-400 font-mono">
                            <span>{prod?.PRODUCT_SCAN || '3250390123456'}</span>
                            <span>{template.width_mm}x{template.height_mm}mm</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Data Table */}
      {activeTab === 'data' && (
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-700">Données Articles ({products.length} lignes)</span>
            </div>
            <button
              onClick={() => {
                const newRow: ProductRecord = {
                  id: `ROW-${Date.now()}`,
                  STORE_NAME: 'SUPERMARCHÉ CENTRAL',
                  ITEMNAME: 'Nouvel Article',
                  SELLING_PRICE: 1000,
                  PRODUCT_SCAN: '3250390000000',
                  PARTNO: `ART-${products.length + 1}`,
                  CATEGORY_NAME: 'ÉPICERIE',
                  SELLING_UNIT: 'pièce',
                };
                setProducts([...products, newRow]);
              }}
              className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une ligne</span>
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-semibold z-10">
                <tr>
                  <th className="p-2.5">Réf / SKU</th>
                  <th className="p-2.5">Nom de l'Article</th>
                  <th className="p-2.5">Code-barres (EAN)</th>
                  <th className="p-2.5">Prix Vente</th>
                  <th className="p-2.5">Prix Promo</th>
                  <th className="p-2.5">Rayon / Catégorie</th>
                  <th className="p-2.5">Paliers (Cash&Carry)</th>
                  <th className="p-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-[11px] text-slate-700 font-bold">{p.PARTNO}</td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={p.ITEMNAME}
                        onChange={(e) => {
                          const updated = [...products];
                          updated[idx] = { ...p, ITEMNAME: e.target.value };
                          setProducts(updated);
                        }}
                        className="w-full px-2 py-1 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded font-semibold text-slate-800"
                      />
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">
                      <input
                        type="text"
                        value={p.PRODUCT_SCAN || ''}
                        onChange={(e) => {
                          const updated = [...products];
                          updated[idx] = { ...p, PRODUCT_SCAN: e.target.value };
                          setProducts(updated);
                        }}
                        className="w-full px-2 py-1 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded font-mono"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        value={p.SELLING_PRICE}
                        onChange={(e) => {
                          const updated = [...products];
                          updated[idx] = { ...p, SELLING_PRICE: parseFloat(e.target.value) || 0 };
                          setProducts(updated);
                        }}
                        className="w-24 px-2 py-1 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded font-bold text-slate-900"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        placeholder="—"
                        value={p.PROMOPRICE ?? ''}
                        onChange={(e) => {
                          const updated = [...products];
                          updated[idx] = {
                            ...p,
                            PROMOPRICE: e.target.value ? parseFloat(e.target.value) : undefined,
                          };
                          setProducts(updated);
                        }}
                        className="w-24 px-2 py-1 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded text-rose-600 font-bold"
                      />
                    </td>
                    <td className="p-2.5 text-slate-600">{p.CATEGORY_NAME || '—'}</td>
                    <td className="p-2.5">
                      {p.TIERS && p.TIERS.length > 0 ? (
                        <span className="text-[11px] text-sky-700 font-medium">
                          {p.TIERS.map((t) => `${t.qty}+ : ${t.unit_price}`).join(' | ')}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => setProducts(products.filter((_, i) => i !== idx))}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                        title="Supprimer la ligne"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Excel / CSV Built-in Data Mapping Modal */}
      {mappingModalOpen && (
        <DataMappingModal
          rawHeaders={rawHeaders}
          rawRows={rawRows}
          onApplyMapping={handleApplyMapping}
          onCancel={() => setMappingModalOpen(false)}
        />
      )}

      {/* ZPL Thermal Printer Modal */}
      {showZplModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Export ZPL II (Thermique Direct)</h3>
                  <p className="text-[11px] text-slate-500">Imprimantes Zebra, TSC, Honeywell, Godex</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Résolution de la tête thermique</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setZplDpi(203)}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                      zplDpi === 203
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    203 DPI
                    <span className="block text-[9px] font-normal text-slate-400">8 dots/mm (Standard)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setZplDpi(300)}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                      zplDpi === 300
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    300 DPI
                    <span className="block text-[9px] font-normal text-slate-400">12 dots/mm (Haute Définition)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setZplDpi(600)}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                      zplDpi === 600
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    600 DPI
                    <span className="block text-[9px] font-normal text-slate-400">24 dots/mm (Micro texte)</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <p className="text-[11px] font-semibold text-slate-800">Prêt pour le flux d'impression :</p>
                <p className="text-[10px]">• {products.length} étiquettes prêtes à envoyer en lot</p>
                <p className="text-[10px]">• Format : {template.width_mm} × {template.height_mm} mm</p>
                <p className="text-[10px]">• Codes-barres natifs haute vitesse (^BC, ^BE, ^BQ)</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowZplModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExportZpl}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger fichier .ZPL</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
