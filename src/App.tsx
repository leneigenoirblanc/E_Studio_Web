import React, { useState, useEffect } from 'react';
import { LabelTemplate } from './types';
import { DEFAULT_TEMPLATES } from './defaultTemplates';
import { HomeDashboard } from './components/HomeDashboard';
import { TemplateEditor } from './components/TemplateEditor';
import { GenerationWorkspace } from './components/GenerationWorkspace';
import { NewGabaritWizard } from './components/NewGabaritWizard';
import { PythonCodeModal } from './components/PythonCodeModal';

const STORAGE_KEY = 'estudio_templates_v1';

export function App() {
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

  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'generation'>('home');
  const [activeTemplate, setActiveTemplate] = useState<LabelTemplate | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);

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
          onOpenPythonModal={() => setIsPythonModalOpen(true)}
        />
      )}

      {currentView === 'editor' && activeTemplate && (
        <TemplateEditor
          initialTemplate={activeTemplate}
          onSaveTemplate={handleSaveTemplate}
          onBackToHome={() => setCurrentView('home')}
          onOpenGeneration={(tpl) => {
            setActiveTemplate(tpl);
            setCurrentView('generation');
          }}
        />
      )}

      {currentView === 'generation' && activeTemplate && (
        <GenerationWorkspace
          template={activeTemplate}
          onBack={() => setCurrentView('home')}
        />
      )}

      {/* New Gabarit Wizard Modal */}
      <NewGabaritWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreate={handleCreateNewTemplate}
      />

      {/* Python Source Code & Desktop GUI Modal */}
      <PythonCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />
    </div>
  );
}

export default App;
