import React from 'react';
import { AppView } from '../services/navigationService';
import { Database, Layers, Smartphone, Printer, ChevronRight, Check } from 'lucide-react';

interface WorkflowStepperBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  totalProductsCount: number;
  templatesCount: number;
  pendingLotsCount: number;
}

export const WorkflowStepperBar: React.FC<WorkflowStepperBarProps> = ({
  currentView,
  onNavigate,
  totalProductsCount,
  templatesCount,
  pendingLotsCount,
}) => {
  const steps = [
    {
      id: 'step_database',
      view: 'database' as AppView,
      stepNumber: 1,
      label: 'Catalogue & Données',
      sublabel: `${totalProductsCount} articles indexés`,
      icon: Database,
      isActive: currentView === 'database',
      isCompleted: totalProductsCount > 0,
    },
    {
      id: 'step_editor',
      view: 'editor' as AppView,
      stepNumber: 2,
      label: 'Conception Gabarit',
      sublabel: `${templatesCount} gabarits actifs`,
      icon: Layers,
      isActive: currentView === 'editor',
      isCompleted: templatesCount > 0,
    },
    {
      id: 'step_mobile',
      view: 'mobile' as AppView,
      stepNumber: 3,
      label: 'Collecte & Scans',
      sublabel: pendingLotsCount > 0 ? `${pendingLotsCount} lot(s) en attente` : 'Terminaux synchronisés',
      icon: Smartphone,
      isActive: currentView === 'mobile',
      isCompleted: pendingLotsCount > 0,
      highlightBadge: pendingLotsCount > 0 ? `${pendingLotsCount}` : undefined,
    },
    {
      id: 'step_generation',
      view: 'generation' as AppView,
      stepNumber: 4,
      label: 'Imposition & Tirage',
      sublabel: 'Planches PDF / ZPL / PPTX',
      icon: Printer,
      isActive: currentView === 'generation',
      isCompleted: false,
    },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 shrink-0 select-none shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2 hidden sm:flex">
          <span>Pipeline</span>
          <span className="text-slate-600">/</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => onNavigate(step.view)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition shrink-0 group ${
                    step.isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title={`Étape ${step.stepNumber}: ${step.label}`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition ${
                      step.isActive
                        ? 'bg-blue-700 text-white'
                        : step.isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {step.isCompleted && !step.isActive ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold tracking-tight truncate">{step.label}</span>
                      {step.highlightBadge && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full animate-pulse">
                          {step.highlightBadge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] leading-tight truncate hidden md:inline ${
                        step.isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {step.sublabel}
                    </span>
                  </div>
                </button>

                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Quick Return to Overview */}
        <button
          onClick={() => onNavigate('home')}
          className={`text-xs font-medium px-2.5 py-1 rounded-md transition shrink-0 ${
            currentView === 'home'
              ? 'bg-slate-800 text-blue-400 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Vue Vue d'ensemble
        </button>
      </div>
    </div>
  );
};
