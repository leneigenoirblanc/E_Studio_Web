import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LabelTemplate, ProductRecord } from './types';
import { DEFAULT_TEMPLATES } from './defaultTemplates';
import { HomeDashboard } from './components/HomeDashboard';
import { TooltipProvider, useTooltip } from './context/TooltipContext';
import { MappingDictionaryProvider } from './context/MappingDictionaryContext';
import { mobileSyncService, MobileScanLot, OfflineIndicator } from './pwa';
import { navigationService, AppView } from './services/navigationService';
import { AppTopNavigationBar } from './components/AppTopNavigationBar';
import { databaseService } from './services/databaseService';

// Lazy-loaded heavy views and studios to maximize initial load performance
const TemplateEditor = lazy(() =>
  import('./components/TemplateEditor').then((m) => ({ default: m.TemplateEditor }))
);
const GenerationWorkspace = lazy(() =>
  import('./components/GenerationWorkspace').then((m) => ({ default: m.GenerationWorkspace }))
);
const MasterDatabaseStudio = lazy(() =>
  import('./components/MasterDatabaseStudio').then((m) => ({ default: m.MasterDatabaseStudio }))
);
const NewGabaritWizard = lazy(() =>
  import('./components/NewGabaritWizard').then((m) => ({ default: m.NewGabaritWizard }))
);
const OmniChannelStudioModal = lazy(() =>
  import('./components/OmniChannelStudioModal').then((m) => ({ default: m.OmniChannelStudioModal }))
);
const AccessibilityPreferencesModal = lazy(() =>
  import('./components/AccessibilityPreferencesModal').then((m) => ({ default: m.AccessibilityPreferencesModal }))
);
const FontManagerModal = lazy(() =>
  import('./components/FontManagerModal').then((m) => ({ default: m.FontManagerModal }))
);
const AuditTrailModal = lazy(() =>
  import('./components/AuditTrailModal').then((m) => ({ default: m.AuditTrailModal }))
);
const MappingDictionaryModal = lazy(() =>
  import('./components/MappingDictionaryModal').then((m) => ({ default: m.MappingDictionaryModal }))
);
const MobileTerminalView = lazy(() =>
  import('./pwa/components/MobileTerminalView').then((m) => ({ default: m.MobileTerminalView }))
);
const MobileSyncHubModal = lazy(() =>
  import('./pwa/components/MobileSyncHubModal').then((m) => ({ default: m.MobileSyncHubModal }))
);

const ViewLoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-white min-h-[50vh] p-8">
    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
    <span className="text-sm font-semibold text-slate-300">Chargement du module...</span>
  </div>
);

const STORAGE_KEY = 'estudio_templates_v1';

function AppContent() {
  const { isPreferencesModalOpen, closePreferencesModal, openPreferencesModal } = useTooltip();

  const [templates, setTemplates] = useState<LabelTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_TEMPLATES;
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    return navigationService.getCurrentRoute().view;
  });

  const [activeTemplate, setActiveTemplate] = useState<LabelTemplate | null>(() => {
    const route = navigationService.getCurrentRoute();
    if (route.params.template) {
      const match = DEFAULT_TEMPLATES.find((t) => t.name === route.params.template);
      if (match) return match;
    }
    return DEFAULT_TEMPLATES[0] || null;
  });

  const [totalProductsCount, setTotalProductsCount] = useState<number>(() => databaseService.getProducts().length);
  const [tursoConfig, setTursoConfig] = useState(() => databaseService.getTursoConfig());

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isFontManagerOpen, setIsFontManagerOpen] = useState(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);
  const [isMappingDictionaryOpen, setIsMappingDictionaryOpen] = useState(false);
  const [isMobileSyncOpen, setIsMobileSyncOpen] = useState(false);

  // Incoming mobile or database products state
  const [mobileLots, setMobileLots] = useState<MobileScanLot[]>(() => mobileSyncService.getLots());
  const [mobileInitialProducts, setMobileInitialProducts] = useState<ProductRecord[] | undefined>(undefined);
  const [mobileInitialBatchName, setMobileInitialBatchName] = useState<string | undefined>(undefined);

  // Listen to navigation route changes (History Back/Forward & Deep Links)
  useEffect(() => {
    const unsub = navigationService.subscribe((route) => {
      setCurrentView(route.view);
      if (route.params.template) {
        const found = templates.find((t) => t.name === route.params.template);
        if (found) {
          setActiveTemplate(found);
        }
      }
    });
    return () => unsub();
  }, [templates]);

  // Listen to mobile lots
  useEffect(() => {
    const unsub = mobileSyncService.subscribe((lots) => {
      setMobileLots(lots);
    });
    return () => unsub();
  }, []);

  // Listen to database service updates
  useEffect(() => {
    const unsub = databaseService.subscribe((prods) => {
      setTotalProductsCount(prods.length);
      setTursoConfig(databaseService.getTursoConfig());
    });
    return () => unsub();
  }, []);

  // Persist templates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (e) {
      console.error('Failed to persist templates to localStorage', e);
    }
  }, [templates]);

  const handleNavigate = (view: AppView) => {
    let tplName = activeTemplate?.name;
    if ((view === 'editor' || view === 'generation') && !activeTemplate) {
      const defaultTpl = templates[0] || DEFAULT_TEMPLATES[0];
      setActiveTemplate(defaultTpl);
      tplName = defaultTpl.name;
    }
    navigationService.navigateTo(view, tplName ? { template: tplName } : {});
  };

  const handleSelectToEdit = (tpl: LabelTemplate) => {
    setActiveTemplate(tpl);
    navigationService.navigateTo('editor', { template: tpl.name });
  };

  const handleSelectToGenerate = (tpl: LabelTemplate) => {
    const snapshot: LabelTemplate = JSON.parse(JSON.stringify(tpl));
    setActiveTemplate(snapshot);
    setMobileInitialProducts(undefined);
    setMobileInitialBatchName(undefined);
    navigationService.navigateTo('generation', { template: tpl.name });
  };

  const handleGenerateFromMobileLot = (lot: MobileScanLot) => {
    const matchedTemplate =
      templates.find((t) => t.name === lot.targetTemplateId) ||
      templates[0] ||
      DEFAULT_TEMPLATES[0];

    const records = mobileSyncService.convertLotToProductRecords(lot);
    const snapshot: LabelTemplate = JSON.parse(JSON.stringify(matchedTemplate));
    setActiveTemplate(snapshot);
    setMobileInitialProducts(records);
    setMobileInitialBatchName(lot.name);
    navigationService.navigateTo('generation', { template: matchedTemplate.name, lot: lot.id });
  };

  const handleGenerateFromDatabaseProducts = (products: ProductRecord[]) => {
    const defaultTemplate = templates[0] || DEFAULT_TEMPLATES[0];
    const snapshot: LabelTemplate = JSON.parse(JSON.stringify(defaultTemplate));
    setActiveTemplate(snapshot);
    setMobileInitialProducts(products);
    setMobileInitialBatchName(`Impression Base de Données (${products.length} réf.)`);
    navigationService.navigateTo('generation', { template: defaultTemplate.name });
  };

  const handleSaveTemplate = (updated: LabelTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.name === updated.name);
      if (exists) {
        return prev.map((t) => (t.name === updated.name ? updated : t));
      }
      return [...prev, updated];
    });
    setActiveTemplate(updated);
  };

  const handleCreateNewTemplate = (newTpl: LabelTemplate) => {
    setTemplates((prev) => [...prev, newTpl]);
    setActiveTemplate(newTpl);
    navigationService.navigateTo('editor', { template: newTpl.name });
  };

  const handleDuplicateTemplate = (tpl: LabelTemplate) => {
    let copyName = `${tpl.name} (Copie)`;
    let counter = 2;
    while (templates.some((t) => t.name === copyName)) {
      copyName = `${tpl.name} (Copie ${counter++})`;
    }
    const cloned: LabelTemplate = {
      ...JSON.parse(JSON.stringify(tpl)),
      name: copyName,
    };
    setTemplates((prev) => [...prev, cloned]);
  };

  const handleDeleteTemplate = (templateName: string) => {
    setTemplates((prev) => prev.filter((t) => t.name !== templateName));
    if (activeTemplate?.name === templateName) {
      const remaining = templates.filter((t) => t.name !== templateName);
      setActiveTemplate(remaining[0] || null);
      navigationService.navigateTo('home');
    }
  };

  const handleImportTemplate = (imported: LabelTemplate) => {
    let uniqueName = imported.name;
    let counter = 2;
    while (templates.some((t) => t.name === uniqueName)) {
      uniqueName = `${imported.name} (${counter++})`;
    }
    imported.name = uniqueName;
    setTemplates((prev) => [...prev, imported]);
    setActiveTemplate(imported);
    navigationService.navigateTo('editor', { template: imported.name });
  };

  const pendingLotsCount = mobileLots.filter(
    (l) => l.status === 'ready' || l.status === 'received'
  ).length;

  return (
    <div className="h-full flex flex-col font-sans select-none overflow-hidden bg-slate-100 text-slate-900">
      {/* Top Application Navigation Bar (Industry Standard Navigation Stack) */}
      <AppTopNavigationBar
        currentView={currentView}
        activeTemplate={activeTemplate}
        templates={templates}
        totalProductsCount={totalProductsCount}
        pendingLotsCount={pendingLotsCount}
        isTursoConfigured={tursoConfig.enabled && tursoConfig.status === 'connected'}
        onNavigate={handleNavigate}
        onOpenMobileSync={() => setIsMobileSyncOpen(true)}
        onOpenMasterDatabase={() => handleNavigate('database')}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onOpenFontManager={() => setIsFontManagerOpen(true)}
        onOpenAuditLogs={() => setIsAuditTrailOpen(true)}
        onOpenMappingDictionary={() => setIsMappingDictionaryOpen(true)}
        onOpenPreferences={openPreferencesModal}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <Suspense fallback={<ViewLoadingFallback />}>
          {currentView === 'home' && (
            <HomeDashboard
              templates={templates}
              onSelectTemplateToEdit={handleSelectToEdit}
              onSelectTemplateToGenerate={handleSelectToGenerate}
              onOpenNewWizard={() => setIsWizardOpen(true)}
              onDuplicateTemplate={handleDuplicateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onImportTemplate={handleImportTemplate}
              onOpenRulesModal={() => setIsRulesModalOpen(true)}
              onOpenAuditLogs={() => setIsAuditTrailOpen(true)}
              onOpenFontManager={() => setIsFontManagerOpen(true)}
              onOpenMappingDictionary={() => setIsMappingDictionaryOpen(true)}
              onOpenMobileSync={() => setIsMobileSyncOpen(true)}
              onOpenMasterDatabase={() => handleNavigate('database')}
              pendingLotsCount={pendingLotsCount}
            />
          )}

          {currentView === 'editor' && (activeTemplate || templates[0]) && (
            <TemplateEditor
              initialTemplate={activeTemplate || templates[0] || DEFAULT_TEMPLATES[0]}
              onSaveTemplate={handleSaveTemplate}
              onBackToHome={() => handleNavigate('home')}
              onOpenGeneration={(tpl) => {
                setActiveTemplate(tpl);
                setMobileInitialProducts(undefined);
                setMobileInitialBatchName(undefined);
                handleNavigate('generation');
              }}
              onOpenRulesModal={() => setIsRulesModalOpen(true)}
            />
          )}

          {currentView === 'generation' && (activeTemplate || templates[0]) && (
            <GenerationWorkspace
              template={activeTemplate || templates[0] || DEFAULT_TEMPLATES[0]}
              initialProducts={mobileInitialProducts}
              initialBatchName={mobileInitialBatchName}
              onBack={() => handleNavigate('home')}
            />
          )}

          {currentView === 'mobile' && (
            <MobileTerminalView
              templates={templates}
              onBackToDesktop={() => handleNavigate('home')}
            />
          )}

          {currentView === 'database' && (
            <MasterDatabaseStudio
              onBack={() => handleNavigate('home')}
              templates={templates}
              onGenerateFromDatabase={handleGenerateFromDatabaseProducts}
            />
          )}

          {/* Mobile Gateway & Lots Ingestion Modal */}
          <MobileSyncHubModal
            isOpen={isMobileSyncOpen}
            onClose={() => setIsMobileSyncOpen(false)}
            templates={templates}
            onGenerateLot={handleGenerateFromMobileLot}
            onOpenInEditor={(tplName) => {
              const tpl = templates.find((t) => t.name === tplName);
              if (tpl) {
                handleSelectToEdit(tpl);
                setIsMobileSyncOpen(false);
              }
            }}
            onOpenMobileSimulator={() => {
              setIsMobileSyncOpen(false);
              handleNavigate('mobile');
            }}
          />

          {/* Mapping Dictionary Modal */}
          <MappingDictionaryModal
            isOpen={isMappingDictionaryOpen}
            onClose={() => setIsMappingDictionaryOpen(false)}
          />

          {/* Omni-Channel Rules Engine & Simulator Modal */}
          <OmniChannelStudioModal
            isOpen={isRulesModalOpen}
            onClose={() => setIsRulesModalOpen(false)}
            currentTemplateName={activeTemplate?.name}
          />

          {/* Font Manager Modal */}
          <FontManagerModal
            isOpen={isFontManagerOpen}
            onClose={() => setIsFontManagerOpen(false)}
          />

          {/* Audit Trail Modal */}
          <AuditTrailModal
            isOpen={isAuditTrailOpen}
            onClose={() => setIsAuditTrailOpen(false)}
          />

          {/* New Gabarit Wizard Modal */}
          <NewGabaritWizard
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
            onCreate={handleCreateNewTemplate}
          />

          {/* Accessibility & UI Preferences Modal */}
          <AccessibilityPreferencesModal
            isOpen={isPreferencesModalOpen}
            onClose={closePreferencesModal}
          />
        </Suspense>
      </div>

      {/* Global PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export function App() {
  return (
    <TooltipProvider>
      <MappingDictionaryProvider>
        <AppContent />
      </MappingDictionaryProvider>
    </TooltipProvider>
  );
}

export default App;
