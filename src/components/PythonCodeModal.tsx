import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Download, FileCode } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPy = async () => {
    try {
      const resp = await fetch('/estudio_desktop.py');
      const text = await resp.text();
      downloadFile('estudio_desktop.py', text);
    } catch {
      alert('Erreur lors du téléchargement du fichier Python.');
    }
  };

  const handleDownloadZip = () => {
    const a = document.createElement('a');
    a.href = '/estudio_pyside6_source.zip';
    a.download = 'estudio_pyside6_full_source.zip';
    a.click();
  };

  const handleDownloadReq = () => {
    const reqText = `PySide6>=6.5.0\nreportlab>=4.0.0\npython-barcode>=0.15.0\nopenpyxl>=3.1.0\nqrcode>=7.4.2\npillow>=10.0.0\n`;
    downloadFile('requirements.txt', reqText);
  };

  const copyInstallCommand = () => {
    navigator.clipboard.writeText('pip install PySide6 reportlab python-barcode openpyxl qrcode[pil] pillow');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Application Bureau Python (PySide6)</h2>
              <p className="text-xs text-slate-500">
                Code source complet et autonome avec PySide6, ReportLab, python-barcode et openpyxl.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-slate-700">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. Installation des dépendances</h3>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl flex items-center justify-between font-mono text-xs">
              <code>pip install PySide6 reportlab python-barcode openpyxl qrcode[pil] pillow</code>
              <button
                onClick={copyInstallCommand}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">2. Lancer l'application</h3>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-xs flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <code>python estudio_desktop.py</code>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2">
            <p className="font-semibold text-blue-950">Ce qui est inclus dans le script Python :</p>
            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li><strong>Interface graphique native PySide6 (Qt6)</strong> avec système d'onglets (Éditeur, Données, Imposition).</li>
              <li><strong>Canvas interactif millimétrique</strong> (échelle vectorielle 96 DPI avec déplacement des objets).</li>
              <li><strong>Moteur d'imposition automatique</strong> (A4, A3, Letter avec centrage optimal et traits de coupe).</li>
              <li><strong>Générateur PDF vectoriel ReportLab</strong> (tracé net haute résolution pour impression industrielle).</li>
              <li><strong>Liaison de données Excel & CSV</strong> avec parsing des paliers de prix multiples (Tiers).</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Télécharger tout le projet Python (39 modules PySide6) en archive ZIP"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le Projet Python Complet (.zip)</span>
            </button>
            <button
              onClick={handleDownloadPy}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>estudio_desktop.py</span>
            </button>
            <button
              onClick={handleDownloadReq}
              className="px-2.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <span>requirements.txt</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
