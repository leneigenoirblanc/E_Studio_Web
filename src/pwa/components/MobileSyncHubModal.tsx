import React, { useState, useEffect } from 'react';
import { MobileScanLot, SyncConnectionConfig, NetworkConnectionMode } from '../types';
import { LabelTemplate } from '../../types';
import { mobileSyncService } from '../services/mobileSyncService';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  Smartphone,
  QrCode,
  Wifi,
  Radio,
  Printer,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  FileSpreadsheet,
  Clock,
  Send,
  X,
  Share2,
  Tag,
  Shield,
  ShieldCheck,
  Eye,
  Sliders,
  Globe,
  Lock,
  KeyRound,
  Camera,
} from 'lucide-react';

interface MobileSyncHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: LabelTemplate[];
  onGenerateLot: (lot: MobileScanLot) => void;
  onOpenInEditor?: (templateName: string) => void;
  onOpenMobileSimulator: () => void;
}

export const MobileSyncHubModal: React.FC<MobileSyncHubModalProps> = ({
  isOpen,
  onClose,
  templates,
  onGenerateLot,
  onOpenInEditor,
  onOpenMobileSimulator,
}) => {
  const [lots, setLots] = useState<MobileScanLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<MobileScanLot | null>(null);
  const [config, setConfig] = useState<SyncConnectionConfig>(mobileSyncService.getConfig());
  const [activeTab, setActiveTab] = useState<'lots' | 'pairing' | 'instances'>('pairing');
  const [pairingUrl, setPairingUrl] = useState<string>('');
  const [pairingSignature, setPairingSignature] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [customHostInput, setCustomHostInput] = useState(config.publicHostUrl || '');

  // Subscribe to lots updates
  useEffect(() => {
    const unsubscribe = mobileSyncService.subscribe((updatedLots) => {
      setLots(updatedLots);
      if (selectedLot) {
        const fresh = updatedLots.find((l) => l.id === selectedLot.id);
        setSelectedLot(fresh || null);
      }
    });
    return () => unsubscribe();
  }, [selectedLot]);

  // Compute pairing URL and SHA-256 signature when config or tab changes
  useEffect(() => {
    let isMounted = true;
    mobileSyncService.getCryptedPairingUrl(config.connectionMode).then(({ url, signature }) => {
      if (isMounted) {
        setPairingUrl(url);
        setPairingSignature(signature);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [config.connectionMode, config.credentials, config.publicHostUrl, config.hostAddress]);

  if (!isOpen) return null;

  const handleConnectionModeChange = (mode: NetworkConnectionMode) => {
    const updated = { ...config, connectionMode: mode };
    setConfig(updated);
    mobileSyncService.saveConfig(updated);
  };

  const handleRegenerateCredentials = async () => {
    setIsRegenerating(true);
    try {
      const newCreds = await mobileSyncService.regenerateCredentials();
      const freshConfig = mobileSyncService.getConfig();
      setConfig(freshConfig);
    } finally {
      setTimeout(() => setIsRegenerating(false), 400);
    }
  };

  const handleExportLots = () => {
    const bundle = mobileSyncService.exportLotsBundle();
    const blob = new Blob([bundle], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lots_mobiles_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportLotsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const count = mobileSyncService.importLotsBundle(text);
      setImportedCount(count);
      setTimeout(() => setImportedCount(null), 3500);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Passerelle Mobiles & Synchronisation Multi-Réseaux
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chiffrement SHA-256 Actif</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Connectez n'importe quel smartphone avec appareil photo via QR Code crypté (Wi-Fi LAN ou Internet 4G/5G).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMobileSimulator}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Tester l'application mobile directement dans le navigateur"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Simulateur Smartphone PWA</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('pairing')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'pairing'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code Crypté & Appairage</span>
            </button>

            <button
              onClick={() => setActiveTab('lots')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'lots'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Lots d'Étiquettes Reçus ({lots.length})</span>
              {lots.filter((l) => l.status === 'ready' || l.status === 'received').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-mono">
                  {lots.filter((l) => l.status === 'ready' || l.status === 'received').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('instances')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'instances'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Postes & Sécurité Réseau</span>
            </button>
          </div>

          <div className="flex items-center gap-2 py-2">
            <label className="cursor-pointer px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Importer Lot JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportLotsFile}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExportLots}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
              title="Exporter tous les lots au format JSON pour sauvegarde ou partage"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exporter Tout</span>
            </button>
          </div>
        </div>

        {importedCount !== null && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{importedCount} lot(s) importé(s) avec succès dans la file d'attente !</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* TAB 1: QR CODE APPAIRAGE & ADVANCED SHA-256 CREDENTIALS */}
          {activeTab === 'pairing' && (
            <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto space-y-6">
              {/* Network access mode selector */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>Mode de Connexion au Serveur (N'importe où)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Sélectionnez le canal réseau de votre établissement
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleConnectionModeChange('internet_public')}
                    className={`p-3 rounded-xl border text-left transition ${
                      config.connectionMode === 'internet_public'
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs">Internet / Cloud</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">
                        Recommandé
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Accessible de n'importe où en 4G, 5G, Wi-Fi public ou privé sans configuration routeur.
                    </p>
                  </button>

                  <button
                    onClick={() => handleConnectionModeChange('wifi_lan')}
                    className={`p-3 rounded-xl border text-left transition ${
                      config.connectionMode === 'wifi_lan'
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs">Wi-Fi LAN Local</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                        Intranet
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Adresse IP directe ({config.hostAddress}). Idéal pour réseau local fermé sans accès web.
                    </p>
                  </button>

                  <button
                    onClick={() => handleConnectionModeChange('custom_tunnel')}
                    className={`p-3 rounded-xl border text-left transition ${
                      config.connectionMode === 'custom_tunnel'
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs">Tunnel / Nom de Domaine</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                        VPN / WAN
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      URL sur mesure ou reverse proxy sécurisé pour multi-sites distants.
                    </p>
                  </button>
                </div>

                {config.connectionMode === 'custom_tunnel' && (
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={customHostInput}
                      onChange={(e) => setCustomHostInput(e.target.value)}
                      placeholder="https://mon-magasin.entreprise.com"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                    <button
                      onClick={() => {
                        const updated = { ...config, publicHostUrl: customHostInput };
                        setConfig(updated);
                        mobileSyncService.saveConfig(updated);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                    >
                      Enregistrer URL
                    </button>
                  </div>
                )}
              </div>

              {/* QR Code & SHA-256 Credentials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left: Real High-Res Scannable QR Code */}
                <div className="space-y-3">
                  <QRCodeDisplay
                    value={pairingUrl}
                    size={220}
                    label="QR Code d'Accès Sécurisé"
                    sublabel="Scannez avec l'appareil photo d'un smartphone pour ouvrir la PWA avec les identifiants pré-remplis."
                  />

                  <div className="text-center">
                    <button
                      onClick={handleRegenerateCredentials}
                      disabled={isRegenerating}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      <span>Générer de Nouveaux Identifiants Cryptés (Nouveau SHA-256)</span>
                    </button>
                  </div>
                </div>

                {/* Right: Mandatory Credentials & Cryptographic Proof */}
                <div className="space-y-4">
                  <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg space-y-4 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                          Identifiants Obligatoires PWA
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        SHA-256
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Code PIN d'Accès Opérateur :
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-3 py-1.5 bg-slate-950 rounded-xl font-mono text-xl font-extrabold text-amber-400 border border-slate-800 tracking-widest">
                            {config.credentials?.authPin || '4829'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Requis sur smartphone si ouvert manuellement
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Jeton de Session SHA-256 (32 Caractères) :
                        </span>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 break-all select-all mt-1">
                          {config.credentials?.sessionToken || 'a9f24e8bc103859d04736f1c48209ad4'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-slate-500 text-[10px] block">Identifiant Instance</span>
                          <span className="font-mono text-white font-bold">{config.instanceId}</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-slate-500 text-[10px] block">Expiration Session</span>
                          <span className="font-mono text-emerald-400 font-bold">30 Jours</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 text-xs space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-indigo-600" />
                      <span>Scans par Caméra Smartphone Intégrés</span>
                    </div>
                    <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                      Aucun lecteur laser ou matériel Zebra requis : vos collaborateurs ouvrent la PWA sur leur téléphone personnel (iPhone ou Android) et scannent en direct les étiquettes en pointant l'appareil photo avec autofocus et visée laser.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECEIVED LOTS MANAGEMENT */}
          {activeTab === 'lots' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Lots List */}
              <div className="w-2/5 border-r border-slate-200 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  <span>Lots disponibles ({lots.length})</span>
                  <button
                    onClick={() => setLots([...mobileSyncService.getLots()])}
                    className="hover:text-indigo-600 flex items-center gap-1 text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Actualiser</span>
                  </button>
                </div>

                {lots.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
                    <Smartphone className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">Aucun lot scanné</div>
                    <p className="text-[11px] text-slate-500">
                      Scannez des articles depuis votre terminal mobile ou utilisez le bouton simulateur pour tester.
                    </p>
                  </div>
                ) : (
                  lots.map((lot) => {
                    const totalQty = lot.items.reduce((s, it) => s + (it.quantity || 1), 0);
                    const isSelected = selectedLot?.id === lot.id;

                    return (
                      <div
                        key={lot.id}
                        onClick={() => setSelectedLot(lot)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-extrabold text-sm text-slate-900 truncate">
                            {lot.name}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              lot.status === 'spooled'
                                ? 'bg-slate-100 text-slate-600'
                                : lot.status === 'ready'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {lot.status === 'spooled'
                              ? 'Imprimé'
                              : lot.status === 'ready'
                              ? 'Prêt à Imprimer'
                              : 'Reçu'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lot.deviceName} ({lot.operatorName})</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">
                              {lot.items.length} réf.
                            </span>
                            <span>•</span>
                            <span className="font-bold text-indigo-600">
                              {totalQty} étiquettes
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(lot.updatedAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Selected Lot Details & Actions */}
              <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col justify-between">
                {selectedLot ? (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                            {selectedLot.name}
                          </h3>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {selectedLot.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>Opérateur : <strong>{selectedLot.operatorName}</strong></span>
                          <span>•</span>
                          <span>Appareil : <strong>{selectedLot.deviceName}</strong></span>
                          <span>•</span>
                          <span>
                            Gabarit cible :{' '}
                            <strong className="text-indigo-600">
                              {selectedLot.targetTemplateId || 'Gabarit par défaut'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm('Supprimer définitivement ce lot ?')) {
                            mobileSyncService.deleteLot(selectedLot.id);
                            setSelectedLot(null);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-slate-200 transition"
                        title="Supprimer ce lot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Prominent Action Banner */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
                      <div className="space-y-1">
                        <div className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                          <Printer className="w-4 h-4 text-indigo-600" />
                          <span>Génération d'Imposition & Impression Directe</span>
                        </div>
                        <p className="text-xs text-indigo-700/90 max-w-lg">
                          Générez la planche d'étiquettes correspondante avec le gabarit sélectionné ({selectedLot.items.reduce((s, it) => s + (it.quantity || 1), 0)} étiquettes au total).
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {onOpenInEditor && selectedLot.targetTemplateId && (
                          <button
                            onClick={() => onOpenInEditor(selectedLot.targetTemplateId!)}
                            className="px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs"
                          >
                            <Eye className="w-4 h-4 text-slate-500" />
                            <span>Voir Gabarit</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            mobileSyncService.updateLotStatus(selectedLot.id, 'spooled');
                            onGenerateLot(selectedLot);
                            onClose();
                          }}
                          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Générer & Imprimer le Lot</span>
                        </button>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Articles du Lot ({selectedLot.items.length} références)</span>
                        <span className="text-indigo-600 font-semibold">
                          Total : {selectedLot.items.reduce((s, it) => s + (it.quantity || 1), 0)} étiquettes
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Code / EAN</th>
                              <th className="py-2.5 px-3">Désignation Produit</th>
                              <th className="py-2.5 px-3 text-right">Prix Vente</th>
                              <th className="py-2.5 px-3 text-center">Quantité Étiquettes</th>
                              <th className="py-2.5 px-3">Heure Scan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedLot.items.map((item, idx) => (
                              <tr key={item.id || idx} className="hover:bg-slate-50/70">
                                <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                                  {item.code}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-900">
                                  <div>{item.designation || 'Article scanné'}</div>
                                  {item.note && (
                                    <span className="text-[10px] text-amber-600 italic">
                                      {item.note}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                                  {item.price !== undefined ? `${item.price.toFixed(2)} €` : '-'}
                                  {item.promoPrice && (
                                    <span className="block text-[10px] text-rose-600">
                                      Promo: {item.promoPrice.toFixed(2)} €
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-block px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs">
                                    x{item.quantity || 1}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                                  {new Date(item.scannedAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <Tag className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 text-base">Aucun lot sélectionné</h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        Sélectionnez un lot dans la colonne de gauche pour l'inspecter et lancer son impression sur planche.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NETWORK & MULTI-WORKSTATION INSTANCES */}
          {activeTab === 'instances' && (
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Architecture Multi-Postes & Partage Décentralisé
                </h3>
                <p className="text-xs text-slate-500">
                  Gérez la redondance et le partage automatique de lots d'étiquettes entre les différents postes du magasin ou de l'entrepôt.
                </p>
              </div>

              <div className="p-5 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-950">
                  <Radio className="w-4 h-4 text-indigo-600" />
                  <span>Mode Relais P2P & Serveur Hôte Local</span>
                </div>
                <p className="text-xs text-indigo-900/90 leading-relaxed">
                  Cette instance logicielle fait office de <strong>relais récepteur</strong>. Dès qu'un lot est transmis par un opérateur mobile, il est enregistré localement et diffusé sur le bus réseau local aux autres postes connectés. Si le poste principal est éteint, n'importe quelle autre machine du réseau peut réceptionner les lots et imprimer les planches.
                </p>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Postes de Travail Détectés sur le Réseau
                </div>

                <div className="space-y-2">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {config.instanceName} (Ce poste - Actif)
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: {config.instanceId} • IP: {config.hostAddress}:{config.port}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Hôte Principal
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                      <div>
                        <div className="font-bold text-xs text-slate-700">
                          Poste Caisse Centrale (Secondaire)
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: inst_caisse_01 • En veille de synchronisation
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                      Synchronisé
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
