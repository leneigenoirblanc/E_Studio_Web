import React, { useState, useEffect } from 'react';
import { LabelTemplate, ProductRecord } from './types';
import { DEFAULT_TEMPLATES } from './defaultTemplates';
import { HomeDashboard } from './components/HomeDashboard';
import { TemplateEditor } from './components/TemplateEditor';
import { GenerationWorkspace } from './components/GenerationWorkspace';
import { NewGabaritWizard } from './components/NewGabaritWizard';
import { OmniChannelStudioModal } from './components/OmniChannelStudioModal';
import { TooltipProvider, useTooltip } from './context/TooltipContext';
import { AccessibilityPreferencesModal } from './components/AccessibilityPreferencesModal';
import { FontManagerModal } from './components/FontManagerModal';
import { AuditTrailModal } from './components/AuditTrailModal';
import { MappingDictionaryModal } from './components/MappingDictionaryModal';
import { MappingDictionaryProvider } from './context/MappingDictionaryContext';
import { MasterDatabaseStudio } from './components/MasterDatabaseStudio';
import {
  MobileTerminalView,
  MobileSyncHubModal,
  mobileSyncService,
  MobileScanLot,
  OfflineIndicator,
} from './pwa';

const STORAGE_KEY = 'estudio_templates_v1';

function AppContent() {
  const { isPreferencesModalOpen, closePreferencesModal } = useTooltip();
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

  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'generation' | 'mobile' | 'database'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'mobile' || mode === 'pwa') {
        return 'mobile';
      }
    }
    return 'home';
  });

  const [activeTemplate, setActiveTemplate] = useState<LabelTemplate | null>(null);
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

  useEffect(() => {
    const unsub = mobileSyncService.subscribe((lots) => {
      setMobileLots(lots);
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

  const handleSelectToEdit = (tpl: LabelTemplate) => {
    setActiveTemplate(tpl);
    setCurrentView('editor');
  };

  const handleSelectToGenerate = (tpl: LabelTemplate) => {
    // Snapshots template for production session safety
    const snapshot: LabelTemplate = JSON.parse(JSON.stringify(tpl));
    setActiveTemplate(snapshot);
    setMobileInitialProducts(undefined);
    setMobileInitialBatchName(undefined);
    setCurrentView('generation');
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
    setCurrentView('generation');
  };

  const handleGenerateFromDatabaseProducts = (products: ProductRecord[]) => {
    const defaultTemplate = templates[0] || DEFAULT_TEMPLATES[0];
    const snapshot: LabelTemplate = JSON.parse(JSON.stringify(defaultTemplate));
    setActiveTemplate(snapshot);
    setMobileInitialProducts(products);
    setMobileInitialBatchName(`Impression Base de Données (${products.length} réf.)`);
    setCurrentView('generation');
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
    setCurrentView('editor');
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
      setActiveTemplate(null);
      setCurrentView('home');
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
    setCurrentView('editor');
  };

  const pendingLotsCount = mobileLots.filter(
    (l) => l.status === 'ready' || l.status === 'received'
  ).length;

  return (
    <div className="h-full flex flex-col font-sans select-none overflow-hidden bg-slate-100 text-slate-900">
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
          onOpenMasterDatabase={() => setCurrentView('database')}
          pendingLotsCount={pendingLotsCount}
        />
      )}

      {currentView === 'editor' && activeTemplate && (
        <TemplateEditor
          initialTemplate={activeTemplate}
          onSaveTemplate={handleSaveTemplate}
          onBackToHome={() => setCurrentView('home')}
          onOpenGeneration={(tpl) => {
            setActiveTemplate(tpl);
            setMobileInitialProducts(undefined);
            setMobileInitialBatchName(undefined);
            setCurrentView('generation');
          }}
          onOpenRulesModal={() => setIsRulesModalOpen(true)}
        />
      )}

      {currentView === 'generation' && activeTemplate && (
        <GenerationWorkspace
          template={activeTemplate}
          initialProducts={mobileInitialProducts}
          initialBatchName={mobileInitialBatchName}
          onBack={() => setCurrentView('home')}
        />
      )}

      {currentView === 'mobile' && (
        <MobileTerminalView
          templates={templates}
          onBackToDesktop={() => setCurrentView('home')}
        />
      )}

      {currentView === 'database' && (
        <MasterDatabaseStudio
          onBack={() => setCurrentView('home')}
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
          setCurrentView('mobile');
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
