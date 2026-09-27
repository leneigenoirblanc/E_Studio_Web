import React, { useEffect, Suspense, lazy } from 'react';
import { LabelTemplate, ProductRecord } from './types';
import { DEFAULT_TEMPLATES } from './defaultTemplates';
import { HomeDashboard } from './components/HomeDashboard';
import { TooltipProvider } from './context/TooltipContext';
import { MappingDictionaryProvider } from './context/MappingDictionaryContext';
import { ToastProvider, useToast } from './components/ToastNotification';
import { MobileScanLot, OfflineIndicator } from './pwa';
import { AppTopNavigationBar } from './components/AppTopNavigationBar';
import { useAppStore } from './store/useAppStore';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Direct imports for core studio views to eliminate dynamic chunk loading failures
import { TemplateEditor } from './components/TemplateEditor';
import { GenerationWorkspace } from './components/GenerationWorkspace';
import { MasterDatabaseStudio } from './components/MasterDatabaseStudio';
import { NewGabaritWizard } from './components/NewGabaritWizard';
import { OmniChannelStudioModal } from './components/OmniChannelStudioModal';
import { AccessibilityPreferencesModal } from './components/AccessibilityPreferencesModal';
import { FontManagerModal } from './components/FontManagerModal';
import { AuditTrailModal } from './components/AuditTrailModal';
import { MappingDictionaryModal } from './components/MappingDictionaryModal';
import { LabelsHubStudio } from './components/LabelsHubStudio';
import { PrintersStudio } from './components/PrintersStudio';
import { PrintJobsStudio } from './components/PrintJobsStudio';
import { PrintingSettingsModal } from './components/PrintingSettingsModal';
import { MobileTerminalView } from './pwa/components/MobileTerminalView';
import { MobileSyncHubModal } from './pwa/components/MobileSyncHubModal';

function AppContent() {
  const toast = useToast();

  // Centralized Zustand Domain State
  const {
    templates,
    activeTemplate,
    currentView,
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

      {/* Main Viewport Container protected with ErrorBoundary */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <ErrorBoundary onReset={() => navigateTo('home')}>
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

          {currentView === 'labels' && (
            <LabelsHubStudio
              onSelectTemplateToEdit={selectToEdit}
              onSelectTemplateToGenerate={selectToGenerate}
              onCreateNewTemplate={() => openModal('isWizardOpen')}
            />
          )}

          {currentView === 'printers' && <PrintersStudio />}

          {currentView === 'jobs' && <PrintJobsStudio />}

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

          {/* Printing & Internationalization Settings Modal */}
          <PrintingSettingsModal
            isOpen={modals.isPrintingSettingsOpen}
            onClose={() => closeModal('isPrintingSettingsOpen')}
          />
        </ErrorBoundary>
      </div>

      {/* Global PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <MappingDictionaryProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </MappingDictionaryProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
