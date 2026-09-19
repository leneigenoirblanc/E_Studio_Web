import React from 'react';
import { useTooltip } from '../context/TooltipContext';
import { Sliders, Eye, Sun, Moon, ShieldAlert, X, MousePointer, Layers, Ruler, Lock, Unlock } from 'lucide-react';

interface AccessibilityPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityPreferencesModal: React.FC<AccessibilityPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    tooltipSettings,
    updateTooltipSettings,
    gridSnapSensitivityMm,
    setGridSnapSensitivityMm,
    themeMode,
    setThemeMode,
    uiPreferences,
    updateUIPreferences,
    rulerSettings,
    updateRulerSettings,
  } = useTooltip();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Accessibilité & Préférences Studio</h2>
              <p className="text-[11px] text-slate-500">Personnalisez l'ergonomie, les bulles d'aide et la sensibilité de grille</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs flex-1">
          {/* 1. Tooltips Configuration */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-100 pb-1">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Infobulles & Assistances Contextuelles</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 block">Activer les infobulles contextuelles</span>
                <span className="text-[11px] text-slate-500">Affiche des explications au survol des éléments</span>
              </div>
              <button
                onClick={() => updateTooltipSettings({ enabled: !tooltipSettings.enabled })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  tooltipSettings.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    tooltipSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {tooltipSettings.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                {/* Pointer Hover Latency */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                    <span className="flex items-center gap-1">
                      <MousePointer className="w-3 h-3 text-indigo-600" />
                      Délai de Survol (Hover Latency)
                    </span>
                    <span className="font-mono text-indigo-700">{tooltipSettings.hoverDelayMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={tooltipSettings.hoverDelayMs}
                    onChange={(e) => updateTooltipSettings({ hoverDelayMs: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>100ms (Rapide)</span>
                    <span>2000ms (Lent)</span>
                  </div>
                </div>

                {/* Opacity Percent */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                    <span>Opacité des Infobulles</span>
                    <span className="font-mono text-indigo-700">{tooltipSettings.opacityPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={tooltipSettings.opacityPercent}
                    onChange={(e) => updateTooltipSettings({ opacityPercent: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>50% (Semi-Transparent)</span>
                    <span>100% (Opaque)</span>
                  </div>
                </div>

                {/* Auto Dismiss Timer */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 sm:col-span-2">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                    <span>Minuterie Masquage Automatique (Auto-Dismiss)</span>
                    <span className="font-mono text-indigo-700">
                      {tooltipSettings.autoDismissSec === 0 ? 'Infinie (Permanent)' : `${tooltipSettings.autoDismissSec} s`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={tooltipSettings.autoDismissSec}
                    onChange={(e) => updateTooltipSettings({ autoDismissSec: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>0s (Permanent)</span>
                    <span>5s (Standard)</span>
                    <span>15s (Long)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Grid Snap Sensitivity */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-100 pb-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Sensibilité du Magnétisme / Grille</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                <span>Pas de Magnétisme (Grid Snap Sensitivity) :</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono font-bold">
                  {gridSnapSensitivityMm} mm
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                value={gridSnapSensitivityMm}
                onChange={(e) => setGridSnapSensitivityMm(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.1 mm (Ultra-Précis)</span>
                <span>1.0 mm (Standard)</span>
                <span>5.0 mm (Saut Grossier)</span>
              </div>
            </div>
          </div>

          {/* 3. Theme Properties */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-100 pb-1">
              <Sun className="w-3.5 h-3.5 text-indigo-600" />
              <span>3. Thème & Mode d'Affichage</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setThemeMode('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  themeMode === 'light'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-400/30 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs">Clair (Standard)</span>
              </button>

              <button
                onClick={() => setThemeMode('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 border-indigo-500 text-white ring-2 ring-indigo-400/30 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs">Sombre (Dark)</span>
              </button>

              <button
                onClick={() => setThemeMode('eink_high_contrast')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  themeMode === 'eink_high_contrast'
                    ? 'bg-black border-white text-white ring-2 ring-white/50 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-black'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span className="text-xs">Haut Contraste E-Ink</span>
              </button>
            </div>
          </div>

          {/* 4. Workspace Rulers Decoupled Configuration */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-100 pb-1">
              <Ruler className="w-3.5 h-3.5 text-indigo-600" />
              <span>4. Règles Millimétriques & HUD Flottant (Workspace Rulers)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => updateUIPreferences({ rulerMode: 'window_frame' })}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  uiPreferences?.rulerMode === 'window_frame'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-400/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-[11px] font-semibold block">Cadre Viewport Fenêtre</span>
                <span className="text-[9px] text-slate-500 font-normal">Ancrées sous le ruban haut et au bord gauche de l'écran</span>
              </button>

              <button
                onClick={() => updateUIPreferences({ rulerMode: 'sheet_margins' })}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  uiPreferences?.rulerMode === 'sheet_margins'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-400/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-[11px] font-semibold block">Marges Feuille</span>
                <span className="text-[9px] text-slate-500 font-normal">Ancrées autour du gabarit avec dégagement configurable</span>
              </button>

              <button
                onClick={() => updateUIPreferences({ rulerMode: 'hidden' })}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  uiPreferences?.rulerMode === 'hidden'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-400/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-[11px] font-semibold block">Masquer Règles</span>
                <span className="text-[9px] text-slate-500 font-normal">Masquer les règles de bordure principales</span>
              </button>
            </div>

            {/* Toggle Ruler Instance Controls */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-1">
                Activation Individuelle des Règles (Toggle Ruler Instances)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  onClick={() => updateRulerSettings({ showHorizontal: !rulerSettings.showHorizontal })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between ${
                    rulerSettings.showHorizontal
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>Règle Haut</span>
                  <span className="text-[10px] opacity-80">{rulerSettings.showHorizontal ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => updateRulerSettings({ showVertical: !rulerSettings.showVertical })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between ${
                    rulerSettings.showVertical
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>Règle Gauche</span>
                  <span className="text-[10px] opacity-80">{rulerSettings.showVertical ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => updateRulerSettings({ showSheet: !rulerSettings.showSheet })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between ${
                    rulerSettings.showSheet
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>Règles Feuille</span>
                  <span className="text-[10px] opacity-80">{rulerSettings.showSheet ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => updateRulerSettings({ showHud: !rulerSettings.showHud })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between ${
                    rulerSettings.showHud
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>HUD Flottant</span>
                  <span className="text-[10px] opacity-80">{rulerSettings.showHud ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Independent Floating Ruler HUD Section */}
            <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-100">HUD Règle Flottant Indépendant</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateRulerSettings({ showHud: !rulerSettings.showHud })}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      rulerSettings.showHud
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {rulerSettings.showHud ? 'Activé (Visible)' : 'Désactivé (Masqué)'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                <span>Position actuelle du HUD:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-indigo-300">
                    {uiPreferences?.hudPosition
                      ? `X: ${uiPreferences.hudPosition.x}px, Y: ${uiPreferences.hudPosition.y}px (Ancré)`
                      : 'Sous le Ruban d\'outils haut (Par défaut)'}
                  </span>
                  {uiPreferences?.hudPosition && (
                    <button
                      onClick={() => updateUIPreferences({ hudPosition: null })}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white rounded text-[10px] transition border border-slate-700"
                    >
                      Réinitialiser la Position
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Le HUD Flottant est indépendant des règles de cadre/feuille. Vous pouvez le déplacer librement par glisser-déposer et l'ancrer à n'importe quel emplacement sur l'écran. Il affiche la taille du gabarit et les coordonnées exactes du pointeur en temps réel.
              </p>
            </div>

            {/* Ruler Clearance Offset Slider Parameter */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Dégagement & Écart des Règles Feuille (Clearance Offset)
                </span>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                  <span>{uiPreferences?.rulerOffsetPx || 40} px</span>
                  <span className="text-[10px] text-slate-500">
                    (~{Math.round(((uiPreferences?.rulerOffsetPx || 40) / 3.78) * 10) / 10} mm)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="2"
                  value={uiPreferences?.rulerOffsetPx || 40}
                  onChange={(e) =>
                    updateUIPreferences({
                      rulerOffsetPx: Number(e.target.value),
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                Ajuste l'espacement de dégagement entre les règles millimétriques et les bordures du gabarit en mode Marges Feuille.
              </p>
            </div>
          </div>

          {/* 5. Individual Panel Lock Parameters (Anti-Collapsing) */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-100 pb-1">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>5. Verrouillage des Panneaux (Panel Lock Controls)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Property Inspector Lock */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {uiPreferences?.lockPropertyInspector ? (
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>Inspecteur de Propriétés</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Empêche l'inspecteur de se fermer lors d'un clic sur la zone de travail.
                  </p>
                </div>

                <button
                  onClick={() =>
                    updateUIPreferences({
                      lockPropertyInspector: !uiPreferences?.lockPropertyInspector,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                    uiPreferences?.lockPropertyInspector
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {uiPreferences?.lockPropertyInspector ? 'Verrouillé' : 'Libre'}
                </button>
              </div>

              {/* Left Sidebar Lock */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {uiPreferences?.lockLeftSidebar ? (
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>Palette d'Outils Latérale</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Maintient la barre d'outils et de calques ouverte en permanence.
                  </p>
                </div>

                <button
                  onClick={() =>
                    updateUIPreferences({
                      lockLeftSidebar: !uiPreferences?.lockLeftSidebar,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                    uiPreferences?.lockLeftSidebar
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {uiPreferences?.lockLeftSidebar ? 'Verrouillé' : 'Libre'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-2xs transition"
          >
            Enregistrer & Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
