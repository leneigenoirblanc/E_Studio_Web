import React, { useEffect, Suspense, lazy } from 'react';
import { LabelTemplate, ProductRecord } from './types';
import { DEFAULT_TEMPLATES } from './defaultTemplates';
import { HomeDashboard } from './components/HomeDashboard';
import { TooltipProvider, useTooltip } from './context/TooltipContext';
import { MappingDictionaryProvider } from './context/MappingDictionaryContext';
import { ToastProvider, useToast } from './components/ToastNotification';
import { MobileScanLot, OfflineIndicator } from './pwa';
import { AppTopNavigationBar } from './components/AppTopNavigationBar';
import { useAppStore } from './store/useAppStore';

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

function AppContent() {
  const toast = useToast();

  // Centralized Zustand Domain State
  const {
    templates,
    activeTemplate,
    currentView,
    totalProductsCount,
    tursoConfig,
    pendingLotsCount,
    modals,
    mobileInitialProducts,
    mobileInitialBatchName,
    openModal,
    closeModal,
    navigateTo,
    selectToEdit,
    selectToGenerate,
    generateFromMobileLot: storeGenerateLot,
    generateFromDatabase: storeGenerateFromDatabase,
    saveTemplate: storeSaveTemplate,
    createNewTemplate: storeCreateNewTemplate,
    duplicateTemplate: storeDuplicateTemplate,
    deleteTemplate: storeDeleteTemplate,
    importTemplate: storeImportTemplate,
    setActiveTemplate,
    setMobileInitialData,
    initSubscriptions,
  } = useAppStore();

  // Initialize and bind all reactive domain listeners
  useEffect(() => {
    const cleanup = initSubscriptions();
    return cleanup;
  }, [initSubscriptions]);

  const handleGenerateFromMobileLot = (lot: MobileScanLot) => {
    const records = storeGenerateLot(lot);
    toast.success('Lot mobile importé', `${records.length} articles chargés pour impression`);
  };

  const handleGenerateFromDatabaseProducts = (products: ProductRecord[]) => {
    storeGenerateFromDatabase(products);
    toast.info('Articles chargés', `${products.length} références préparées pour le tirage`);
  };

  const handleSaveTemplate = async (updated: LabelTemplate) => {
    await storeSaveTemplate(updated);
    toast.success('Gabarit sauvegardé', `Le gabarit "${updated.name}" est enregistré dans le stockage persistant.`);
  };

  const handleCreateNewTemplate = async (newTpl: LabelTemplate) => {
    await storeCreateNewTemplate(newTpl);
    toast.success('Nouveau gabarit créé', `Prêt pour l'édition de "${newTpl.name}"`);
  };

  const handleDuplicateTemplate = async (tpl: LabelTemplate) => {
    const cloned = await storeDuplicateTemplate(tpl.name);
    if (cloned) {
      toast.info('Gabarit dupliqué', `Création de "${cloned.name}"`);
    }
  };

  const handleDeleteTemplate = async (templateName: string) => {
    await storeDeleteTemplate(templateName);
    toast.warning('Gabarit supprimé', `Le gabarit "${templateName}" a été retiré.`);
  };

  const handleImportTemplate = async (imported: LabelTemplate) => {
    const result = await storeImportTemplate(imported);
    toast.success('Gabarit importé', `Chargement réussi du gabarit "${result.name}"`);
  };

  return (
    <div className="h-full flex flex-col font-sans select-none overflow-hidden bg-slate-100 text-slate-900">
      {/* Top Application Navigation Bar with Integrated History & Centralized State */}
      <AppTopNavigationBar />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <Suspense fallback={<ViewLoadingFallback />}>
          {currentView === 'home' && (
            <HomeDashboard
              onDuplicateTemplate={handleDuplicateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onImportTemplate={handleImportTemplate}
            />
          )}

          {currentView === 'editor' && (activeTemplate || templates[0]) && (
            <TemplateEditor
              initialTemplate={activeTemplate || templates[0] || DEFAULT_TEMPLATES[0]}
              onSaveTemplate={handleSaveTemplate}
              onBackToHome={() => navigateTo('home')}
              onOpenGeneration={(tpl) => {
                setActiveTemplate(tpl);
                setMobileInitialData(undefined, undefined);
                navigateTo('generation');
              }}
              onOpenRulesModal={() => openModal('isRulesModalOpen')}
            />
          )}

          {currentView === 'generation' && (activeTemplate || templates[0]) && (
            <GenerationWorkspace
              template={activeTemplate || templates[0] || DEFAULT_TEMPLATES[0]}
              initialProducts={mobileInitialProducts}
              initialBatchName={mobileInitialBatchName}
              onBack={() => navigateTo('home')}
            />
          )}

          {currentView === 'mobile' && (
            <MobileTerminalView
              templates={templates}
              onBackToDesktop={() => navigateTo('home')}
            />
          )}

          {currentView === 'database' && (
            <MasterDatabaseStudio
              onBack={() => navigateTo('home')}
              templates={templates}
              onGenerateFromDatabase={handleGenerateFromDatabaseProducts}
            />
          )}

          {/* Mobile Gateway & Lots Ingestion Modal */}
          <MobileSyncHubModal
            isOpen={modals.isMobileSyncOpen}
            onClose={() => closeModal('isMobileSyncOpen')}
            templates={templates}
            onGenerateLot={handleGenerateFromMobileLot}
            onOpenInEditor={(tplName) => {
              const tpl = templates.find((t) => t.name === tplName);
              if (tpl) {
                selectToEdit(tpl);
                closeModal('isMobileSyncOpen');
              }
            }}
            onOpenMobileSimulator={() => {
              closeModal('isMobileSyncOpen');
              navigateTo('mobile');
            }}
          />

          {/* Mapping Dictionary Modal */}
          <MappingDictionaryModal
            isOpen={modals.isMappingDictionaryOpen}
            onClose={() => closeModal('isMappingDictionaryOpen')}
          />

          {/* Omni-Channel Rules Engine & Simulator Modal */}
          <OmniChannelStudioModal
            isOpen={modals.isRulesModalOpen}
            onClose={() => closeModal('isRulesModalOpen')}
            currentTemplateName={activeTemplate?.name}
          />

          {/* Font Manager Modal */}
          <FontManagerModal
            isOpen={modals.isFontManagerOpen}
            onClose={() => closeModal('isFontManagerOpen')}
          />

          {/* Audit Trail Modal */}
          <AuditTrailModal
            isOpen={modals.isAuditTrailOpen}
            onClose={() => closeModal('isAuditTrailOpen')}
          />

          {/* New Gabarit Wizard Modal */}
          <NewGabaritWizard
            isOpen={modals.isWizardOpen}
            onClose={() => closeModal('isWizardOpen')}
            onCreate={handleCreateNewTemplate}
          />

          {/* Accessibility & UI Preferences Modal */}
          <AccessibilityPreferencesModal
            isOpen={modals.isPreferencesModalOpen}
            onClose={() => closeModal('isPreferencesModalOpen')}
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
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </MappingDictionaryProvider>
    </TooltipProvider>
  );
}

export default App;
