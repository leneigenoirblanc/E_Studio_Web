import React, { useState, useRef } from 'react';
import { LabelTemplate } from '../types';
import { LabelRenderer } from './LabelRenderer';
import { SAMPLE_PRODUCTS } from '../sampleData';
import { Button, Card, Input } from './ui';
import { ThemeConstants } from '../theme/ThemeConstants';
import { useAppStore } from '../store/useAppStore';
import {
  Plus,
  Printer,
  Edit3,
  Copy,
  Trash2,
  Download,
  Upload,
  Search,
  Database,
  Smartphone,
  Layers,
  ArrowRight,
  MoreVertical,
  X,
} from 'lucide-react';

export interface HomeDashboardProps {
  templates?: LabelTemplate[];
  onSelectTemplateToEdit?: (template: LabelTemplate) => void;
  onSelectTemplateToGenerate?: (template: LabelTemplate) => void;
  onOpenNewWizard?: () => void;
  onDuplicateTemplate?: (template: LabelTemplate) => void;
  onDeleteTemplate?: (templateName: string) => void;
  onImportTemplate?: (template: LabelTemplate) => void;
  onOpenRulesModal?: () => void;
  onOpenAuditLogs?: () => void;
  onOpenFontManager?: () => void;
  onOpenMappingDictionary?: () => void;
  onOpenMobileSync?: () => void;
  onOpenMasterDatabase?: () => void;
  pendingLotsCount?: number;
}

type TemplateCategoryFilter = 'ALL' | 'SHELF' | 'PROMO' | 'TIERS';

export const HomeDashboard: React.FC<HomeDashboardProps> = (props) => {
  const store = useAppStore();
  const templates = props.templates ?? store.templates;
  const onSelectTemplateToEdit = props.onSelectTemplateToEdit ?? store.selectToEdit;
  const onSelectTemplateToGenerate = props.onSelectTemplateToGenerate ?? store.selectToGenerate;
  const onOpenNewWizard = props.onOpenNewWizard ?? (() => store.openModal('isWizardOpen'));
  const onDuplicateTemplate = props.onDuplicateTemplate ?? ((tpl) => store.duplicateTemplate(tpl.name));
  const onDeleteTemplate = props.onDeleteTemplate ?? ((name) => store.deleteTemplate(name));
  const onImportTemplate = props.onImportTemplate ?? store.importTemplate;
  const onOpenMobileSync = props.onOpenMobileSync ?? (() => store.openModal('isMobileSyncOpen'));
  const onOpenMasterDatabase = props.onOpenMasterDatabase ?? (() => store.navigateTo('database'));
  const pendingLotsCount = props.pendingLotsCount ?? store.pendingLotsCount;
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategoryFilter>('ALL');
  const [activeMenuTemplate, setActiveMenuTemplate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${tpl.width_mm}x${tpl.height_mm}`.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'SHELF') {
      return tpl.height_mm <= 45 && !tpl.name.toLowerCase().includes('promo');
    }
    if (categoryFilter === 'PROMO') {
      return (
        tpl.name.toLowerCase().includes('promo') ||
        tpl.name.toLowerCase().includes('flash') ||
        tpl.width_mm >= 150
      );
    }
    if (categoryFilter === 'TIERS') {
      return (
        tpl.name.toLowerCase().includes('palier') ||
        tpl.name.toLowerCase().includes('cash') ||
        tpl.name.toLowerCase().includes('grossiste')
      );
    }
    return true;
  });

  const handleExportJson = (tpl: LabelTemplate) => {
    const blob = new Blob([JSON.stringify(tpl, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gabarit_${tpl.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActiveMenuTemplate(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.name && json.width_mm && json.height_mm) {
          onImportTemplate(json);
        }
      } catch (err) {
        console.error('Invalid template JSON:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto min-h-0">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Workspace Header & Operational Summary */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Poste de Balisage & Production
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Concevez vos gabarits d'étiquettes, synchronisez les scans magasins et lancez vos planches d'impression.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".json"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-4 h-4 text-slate-500" />}
            >
              Importer Gabarit
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewWizard}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nouveau Gabarit
            </Button>
          </div>
        </div>

        {/* Operational Workflow Steps (4 Core Modes) */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Chaîne de Traitement Opérationnelle
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1: Catalog */}
            <Card
              variant="interactive"
              onClick={onOpenMasterDatabase}
              className="group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-400 font-mono">01</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Catalogue & Articles
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Importation des bases articles, codes-barres, tarification et remises.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>Accéder au catalogue</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>

            {/* Step 2: Templates */}
            <Card
              variant="interactive"
              onClick={onOpenNewWizard}
              className="group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-400">02</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Conception Vectorielle
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Alignements magnétiques, typographies réglementaires et reliure aux champs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span>Créer un gabarit</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>

            {/* Step 3: Mobile Intake */}
            <Card
              variant="interactive"
              onClick={onOpenMobileSync}
              className="group flex flex-col justify-between relative"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingLotsCount > 0 && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        {pendingLotsCount} lot(s)
                      </span>
                    )}
                    <span className="text-xs font-mono font-medium text-slate-400">03</span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Collecte en Rayon
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Scans sur terminaux mobiles avec transmission instantanée vers la station.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
                <span>Passerelle scans</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>

            {/* Step 4: Imposition & Print */}
            <Card
              variant="interactive"
              onClick={() => {
                if (templates.length > 0) onSelectTemplateToGenerate(templates[0]);
              }}
              className="group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Printer className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-400">04</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Imposition & Tirage
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Calepinage multi-étiquettes A4/A3, repères de coupe, PDF haute définition et ZPL.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                <span>Lancer le tirage</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>
          </div>
        </div>

        {/* Template Library Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className={ThemeConstants.classes.metadataContainer}>
              <span className="font-semibold text-slate-900">Bibliothèque de Gabarits</span>
              <span className={ThemeConstants.classes.metadataSeparator} aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{filteredTemplates.length} formats disponibles</span>
            </div>

            {/* Segmented Filter Control */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-lg self-start sm:self-auto">
              {(
                [
                  { id: 'ALL', label: 'Tous' },
                  { id: 'SHELF', label: 'Rayon Standard' },
                  { id: 'PROMO', label: 'Promotions' },
                  { id: 'TIERS', label: 'Grossiste & Paliers' },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setCategoryFilter(filter.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    categoryFilter === filter.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar using UI Input */}
          <div className="relative">
            <Input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom de gabarit ou dimensions (ex: 70x38)... [Raccourci: /]"
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              rightIcon={
                searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                    title="Effacer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block text-[10px] font-mono font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
                    /
                  </kbd>
                )
              }
            />
          </div>

          {/* Template Cards Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const sampleProduct = SAMPLE_PRODUCTS[0];
                const isMenuOpen = activeMenuTemplate === template.name;

                return (
                  <Card
                    key={template.name}
                    noPadding
                    className="hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    {/* Visual Preview Box */}
                    <div
                      onClick={() => onSelectTemplateToEdit(template)}
                      className="p-6 bg-slate-100/70 border-b border-slate-100 flex items-center justify-center cursor-pointer min-h-[170px] relative overflow-hidden"
                    >
                      <div className="shadow-md rounded transition-transform group-hover:scale-[1.02]">
                        <LabelRenderer
                          template={template}
                          record={sampleProduct}
                          zoom={0.8}
                        />
                      </div>
                    </div>

                    {/* Card Content & Metadata */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => onSelectTemplateToEdit(template)}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer transition-colors leading-snug"
                          >
                            {template.name}
                          </h3>

                          {/* Quick Options Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuTemplate(isMenuOpen ? null : template.name)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
                              title="Options supplémentaires"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 animate-in fade-in-50 zoom-in-95">
                                <button
                                  onClick={() => {
                                    setActiveMenuTemplate(null);
                                    onDuplicateTemplate(template);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Dupliquer</span>
                                </button>

                                <button
                                  onClick={() => handleExportJson(template)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Exporter JSON</span>
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                <button
                                  onClick={() => {
                                    setActiveMenuTemplate(null);
                                    if (confirm(`Confirmer la suppression du gabarit "${template.name}" ?`)) {
                                      onDeleteTemplate(template.name);
                                    }
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Supprimer</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Unboxed Zero-Pill Metadata */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-mono tabular-nums">
                          <span>
                            {template.width_mm} × {template.height_mm} mm
                          </span>
                          <span className={ThemeConstants.classes.metadataSeparator} aria-hidden="true">·</span>
                          <span>{(template.items || []).length} champs</span>
                          <span className={ThemeConstants.classes.metadataSeparator} aria-hidden="true">·</span>
                          <span>{template.width_mm >= template.height_mm ? 'paysage' : 'portrait'}</span>
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onClick={() => onSelectTemplateToEdit(template)}
                          leftIcon={<Edit3 className="w-3.5 h-3.5 text-slate-600" />}
                        >
                          Modifier
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          onClick={() => onSelectTemplateToGenerate(template)}
                          leftIcon={<Printer className="w-3.5 h-3.5" />}
                        >
                          Imprimer
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <Card className="text-center flex flex-col items-center justify-center p-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Aucun gabarit correspondant</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Aucun résultat ne correspond à votre filtre actuel. Modifiez votre recherche ou créez un nouveau gabarit.
              </p>
              <div className="flex items-center gap-3 mt-4">
                {searchTerm && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                  >
                    Effacer la recherche
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenNewWizard}
                >
                  Nouveau Gabarit
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
