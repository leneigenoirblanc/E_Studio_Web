import React, { useState, useMemo } from 'react';
import { LabelTemplate, ProductRecord, ImpositionConfig } from '../types';
import { SAMPLE_PRODUCTS } from '../sampleData';
import { LabelRenderer } from './LabelRenderer';
import { ImpositionCalculator } from '../utils/impositionCalculator';
import { TierEngine } from '../utils/tierEngine';
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

  // Imposition sheet configuration
  const [impositionConfig, setImpositionConfig] = useState<ImpositionConfig>({
    page_size: 'A4',
    orientation: 'portrait',
    gap_mm: 2.0,
    show_cut_marks: true,
  });

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

  // Excel / CSV File Import
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
          const imported: ProductRecord[] = rawJson.map((row, idx) => ({
            id: `IMP-${idx + 1}`,
            STORE_NAME: row['STORE_NAME'] || row['STORE'] || row['MAGASIN'] || 'SUPERMARCHÉ',
            PRODUCT_SCAN: String(row['PRODUCT_SCAN'] || row['EAN'] || row['GTIN'] || row['CODE_BARRE'] || ''),
            PARTNO: String(row['PARTNO'] || row['SKU'] || row['REF'] || `ART-${idx + 1}`),
            ITEMNAME: String(row['ITEMNAME'] || row['NAME'] || row['DESIGNATION'] || row['ARTICLE'] || `Article ${idx + 1}`),
            ITEMDESCRIPTION: String(row['ITEMDESCRIPTION'] || row['DESCRIPTION'] || ''),
            DIV_NAME: String(row['DIV_NAME'] || row['DIVISION'] || ''),
            DEPT_NAME: String(row['DEPT_NAME'] || row['DEPARTMENT'] || ''),
            CATEGORY_NAME: String(row['CATEGORY_NAME'] || row['CATEGORY'] || row['RAYON'] || ''),
            BRAND_INFO: String(row['BRAND_INFO'] || row['BRAND'] || row['MARQUE'] || ''),
            PACK_UNIT: String(row['PACK_UNIT'] || row['CONDITIONNEMENT'] || ''),
            SELLING_UNIT: String(row['SELLING_UNIT'] || row['UNITE'] || 'unité'),
            SELLING_PRICE: parseFloat(row['SELLING_PRICE'] || row['PRICE'] || row['PRIX'] || 0),
            PROMOPRICE: row['PROMOPRICE'] || row['PROMO'] ? parseFloat(row['PROMOPRICE'] || row['PROMO']) : undefined,
            CASE_SIZE: row['CASE_SIZE'] ? parseInt(row['CASE_SIZE'], 10) : undefined,
            CASE_UNIT: String(row['CASE_UNIT'] || ''),
            TIERS: row['TIERS']
              ? typeof row['TIERS'] === 'string'
                ? JSON.parse(row['TIERS'])
                : row['TIERS']
              : [
                  { qty: 6, unit_price: Math.round((parseFloat(row['SELLING_PRICE'] || 0) || 1000) * 0.9) },
                  { qty: 12, unit_price: Math.round((parseFloat(row['SELLING_PRICE'] || 0) || 1000) * 0.8) },
                ],
          }));

          setProducts(imported);
          setCurrentIndex(0);
        }
      } catch (err) {
        alert("Erreur lors de l'importation du fichier Excel/CSV : " + String(err));
      }
    };
    reader.readAsArrayBuffer(file);
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

  // Generate Imposed PDF
  const handleGeneratePdf = () => {
    if (!imposition) return;
    const isLandscape = impositionConfig.orientation === 'landscape';
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: impositionConfig.page_size.toLowerCase(),
    });

    const labelsPerPage = imposition.total_per_page;
    const totalPages = Math.ceil(products.length / labelsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();

      // Draw labels on page
      for (let slot = 0; slot < labelsPerPage; slot++) {
        const prodIndex = page * labelsPerPage + slot;
        if (prodIndex >= products.length) break;
        const prod = products[prodIndex];

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

    doc.save(`etiquettes_imposees_${template.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
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
            onClick={handleGeneratePdf}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer Planche (PDF)</span>
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
                <option value="LETTER">US Letter (215.9 × 279.4 mm)</option>
              </select>
            </div>

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
                    Feuilles requises: <strong className="text-slate-900">{Math.ceil(products.length / imposition.total_per_page)}</strong>
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
          <div className="flex-1 bg-slate-200 p-8 flex items-center justify-center overflow-auto">
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
                  const prod = products[slotIdx];

                  const x = imposition.horizontal_offset_mm + col * (imposition.label_total_w_mm + impositionConfig.gap_mm);
                  const y = imposition.vertical_offset_mm + row * (imposition.label_total_h_mm + impositionConfig.gap_mm);

                  return (
                    <div
                      key={slotIdx}
                      className="absolute border border-slate-300 bg-slate-50/50 flex flex-col justify-between p-1 overflow-hidden"
                      style={{
                        left: `${x * 1.5}px`,
                        top: `${y * 1.5}px`,
                        width: `${template.width_mm * 1.5}px`,
                        height: `${template.height_mm * 1.5}px`,
                      }}
                    >
                      <div className="flex items-center justify-between text-[8px] font-bold text-slate-700">
                        <span className="truncate">{prod ? prod.ITEMNAME : `Emplacement #${slotIdx + 1}`}</span>
                        {prod && <span className="text-blue-600">{prod.SELLING_PRICE} F</span>}
                      </div>
                      <div className="flex items-center justify-between text-[7px] text-slate-400 font-mono">
                        <span>{prod?.PRODUCT_SCAN || '3250390123456'}</span>
                        <span>{template.width_mm}x{template.height_mm}mm</span>
                      </div>
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
    </div>
  );
};
