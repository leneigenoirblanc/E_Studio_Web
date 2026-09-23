import React, { useState } from 'react';
import { LabelTemplate } from '../types';
import { LabelRenderer } from './LabelRenderer';
import { ContextTooltip, useTooltip } from '../context/TooltipContext';
import {
  Plus,
  Printer,
  Edit3,
  Copy,
  Trash2,
  Download,
  Upload,
  Layers,
  Search,
  CheckCircle,
  Tag,
  Grid,
  FileCode,
  Cpu,
  Settings,
  History,
  Type,
  BookOpen,
  Smartphone,
} from 'lucide-react';
import { PWAInstallButton } from '../pwa';

interface HomeDashboardProps {
  templates: LabelTemplate[];
  onSelectTemplateToEdit: (template: LabelTemplate) => void;
  onSelectTemplateToGenerate: (template: LabelTemplate) => void;
  onOpenNewWizard: () => void;
  onDuplicateTemplate: (template: LabelTemplate) => void;
  onDeleteTemplate: (templateName: string) => void;
  onImportTemplate: (template: LabelTemplate) => void;
  onOpenRulesModal: () => void;
  onOpenAuditLogs?: () => void;
  onOpenFontManager?: () => void;
  onOpenMappingDictionary?: () => void;
  onOpenMobileSync?: () => void;
  pendingLotsCount?: number;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  templates,
  onSelectTemplateToEdit,
  onSelectTemplateToGenerate,
  onOpenNewWizard,
  onDuplicateTemplate,
  onDeleteTemplate,
  onImportTemplate,
  onOpenRulesModal,
  onOpenAuditLogs,
  onOpenFontManager,
  onOpenMappingDictionary,
  onOpenMobileSync,
  pendingLotsCount = 0,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { openPreferencesModal } = useTooltip();

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.name && json.width_mm && json.height_mm) {
          onImportTemplate(json);
        } else {
          alert('Fichier JSON de gabarit invalide (propriétés manquantes).');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON: ' + String(err));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
      {/* Top Welcome & Quick Actions Banner */}
      <div className="bg-white border-b border-slate-200 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1 font-semibold text-xs uppercase tracking-wider">
              <Tag className="w-4 h-4" />
              <span>Studio d'Étiquetage & Imposition de Prix</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              E-Studio Web
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Conception vectorielle d'étiquettes de rayon, gestion des paliers prix Cash & Carry, liaison de données Excel et imposition automatique sur planches d'impression.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <ContextTooltip
              title="Dictionnaire de Mapping & Alias"
              content="Gérer les alias de colonnes Excel, mots-clés de détection automatique et champs personnalisés"
              category="Données"
            >
              <button
                onClick={onOpenMappingDictionary}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Mapping & Alias</span>
              </button>
            </ContextTooltip>

            <ContextTooltip
              title="Polices & Typographies"
              content="Gérer les polices web et typographies installées pour les étiquettes"
              category="Typographie"
            >
              <button
                onClick={onOpenFontManager}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition"
              >
                <Type className="w-3.5 h-3.5 text-slate-600" />
                <span>Polices</span>
              </button>
            </ContextTooltip>

            <ContextTooltip
              title="Journal d'Audit & Traçabilité"
              content="Consulter les logs et l'historique complet des actions effectuées"
              category="Traçabilité"
            >
              <button
                onClick={onOpenAuditLogs}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition"
              >
                <History className="w-3.5 h-3.5 text-slate-600" />
                <span>Audit</span>
              </button>
            </ContextTooltip>

            <PWAInstallButton compact />

            <ContextTooltip
              title="Passerelle Mobiles & Lots Scannés"
              content="Réceptionner les scans de rayons depuis iPhones (PWA) et terminaux Android (Zebra), appairer par QR Code et lancer l'impression des lots"
              category="Mobile"
            >
              <button
                onClick={onOpenMobileSync}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition relative"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mobiles & Lots</span>
                {pendingLotsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white animate-pulse">
                    {pendingLotsCount}
                  </span>
                )}
              </button>
            </ContextTooltip>

            <ContextTooltip
              title="Préférences & Accessibilité"
              content="Configurer le système d'info-bulles contextuelles (délai, opacité) et le mode de zoom par défaut"
              category="Système"
              shortcut="Alt+A"
            >
              <button
                onClick={openPreferencesModal}
                className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg transition flex items-center justify-center"
              >
                <Settings className="w-4 h-4 text-slate-700" />
              </button>
            </ContextTooltip>

            <ContextTooltip
              title="Moteur de Règles Omni-Canal"
              content="Simulateur multi-device pour étiquettes électroniques ESL, étiquettes papier et écrans LCD de rayon"
              category="Automatisation"
            >
              <button
                onClick={onOpenRulesModal}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <Cpu className="w-4 h-4 text-blue-200" />
                <span>Règles Omni-Canal (ESL / Print / LCD)</span>
              </button>
            </ContextTooltip>

            <ContextTooltip
              title="Importer Gabarit JSON"
              content="Importer un fichier de gabarit .json créé précédemment pour le modifier ou l'imprimer"
              category="Fichier"
            >
              <label className="cursor-pointer px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Importer Gabarit JSON</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </ContextTooltip>

            <ContextTooltip
              title="Créer un Nouveau Gabarit"
              content="Assistant pas à pas pour définir un nouveau format d'étiquette, papier ou banderole de rayon"
              category="Création"
            >
              <button
                onClick={onOpenNewWizard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Gabarit</span>
              </button>
            </ContextTooltip>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-8 py-8 space-y-6">
        {/* Search and Filters Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un gabarit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center gap-3">
            <span>
              <strong className="text-slate-900 font-bold">{templates.length}</strong> gabarits disponibles
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Grid className="w-3.5 h-3.5 text-slate-400" />
              Imposition A4/A3 automatique
            </span>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.name}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden group"
            >
              {/* Header Title */}
              <div className="p-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                    {tpl.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {tpl.width_mm} × {tpl.height_mm} mm • {tpl.items.length} objets
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                  v{tpl.schema_version}
                </span>
              </div>

              {/* Vector Render Preview Thumbnail */}
              <div
                onClick={() => onSelectTemplateToEdit(tpl)}
                className="p-6 bg-slate-100/60 flex items-center justify-center cursor-pointer min-h-[170px] overflow-hidden"
                title="Cliquez pour éditer ce gabarit"
              >
                <div className="shadow-md transition-transform group-hover:scale-[1.02] duration-150">
                  <LabelRenderer
                    template={tpl}
                    zoom={0.7}
                    showBleed={false}
                    showInnerMargins={true}
                    interactive={false}
                  />
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <ContextTooltip
                    title="Dupliquer le Gabarit"
                    content="Créer une copie clone de ce format d'étiquette pour vos déclinaisons"
                    category="Gabarit"
                  >
                    <button
                      onClick={() => onDuplicateTemplate(tpl)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </ContextTooltip>

                  <ContextTooltip
                    title="Télécharger Fichier JSON"
                    content="Exporter la définition vectorielle complète de l'étiquette au format JSON"
                    category="Export"
                  >
                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(tpl, null, 2);
                        const blob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${tpl.name.toLowerCase().replace(/\s+/g, '_')}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </ContextTooltip>

                  {templates.length > 1 && (
                    <ContextTooltip
                      title="Supprimer le Gabarit"
                      content="Retirer définitivement ce gabarit de la liste"
                      category="Gabarit"
                    >
                      <button
                        onClick={() => {
                          if (confirm(`Voulez-vous supprimer le gabarit "${tpl.name}" ?`)) {
                            onDeleteTemplate(tpl.name);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </ContextTooltip>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <ContextTooltip
                    title="Éditer le Gabarit"
                    content="Ouvrir le studio de création vectorielle pour modifier les dimensions et calques"
                    category="Éditeur"
                  >
                    <button
                      onClick={() => onSelectTemplateToEdit(tpl)}
                      className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 font-semibold rounded transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3 text-slate-500" />
                      <span>Éditer</span>
                    </button>
                  </ContextTooltip>

                  <ContextTooltip
                    title="Générer Planches"
                    content="Passer à l'espace de génération par lots, liaison de données Excel et impression"
                    category="Production"
                  >
                    <button
                      onClick={() => onSelectTemplateToGenerate(tpl)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-xs transition flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Générer</span>
                    </button>
                  </ContextTooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
