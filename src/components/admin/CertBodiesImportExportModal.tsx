import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  RotateCcw,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Globe2,
  RefreshCw
} from 'lucide-react';
import type { CertificationBody, CertificationBodyInsert } from '../../lib/supabase';
import {
  exportCertificationBodiesToJson,
  downloadJsonFile,
  isDuplicateBody
} from '../../lib/certBodiesImportExport';
import { GLOBAL_CERTIFICATION_BODIES_SEED } from '../../lib/mockGlobalCertificationBodies';
import {
  createCertificationBody,
  updateCertificationBody
} from '../../lib/certificationBodiesService';

export interface CertBodiesImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBodies: CertificationBody[];
  onDataChanged: () => void;
}

type ModalTab = 'export' | 'import' | 'seed';

export default function CertBodiesImportExportModal({
  isOpen,
  onClose,
  currentBodies,
  onDataChanged
}: CertBodiesImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('export');
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importStats, setImportStats] = useState({ inserted: 0, updated: 0, skipped: 0 });
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  if (!isOpen) return null;

  // 1. Export JSON
  const handleExportJson = () => {
    const jsonString = exportCertificationBodiesToJson(currentBodies);
    downloadJsonFile(jsonString);
  };

  // 2. Import JSON
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('processing');
    setImportErrors([]);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rawBodies: Partial<CertificationBody>[] = Array.isArray(parsed) ? parsed : (parsed.bodies || []);

      if (rawBodies.length === 0) {
        setImportStatus('error');
        setImportErrors(['Le fichier JSON ne contient aucun organisme valide ou tableau "bodies".']);
        return;
      }

      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const item of rawBodies) {
        if (!item.name || !item.country) {
          skippedCount++;
          continue;
        }

        const duplicate = isDuplicateBody(item, currentBodies);

        if (duplicate && duplicate.id) {
          // Mise à jour de l'existant
          await updateCertificationBody(duplicate.id, item);
          updatedCount++;
        } else {
          // Insertion d'un nouvel organisme
          await createCertificationBody(item as CertificationBodyInsert);
          insertedCount++;
        }
      }

      setImportStats({ inserted: insertedCount, updated: updatedCount, skipped: skippedCount });
      setImportStatus('success');
      onDataChanged();
    } catch (err: unknown) {
      setImportStatus('error');
      setImportErrors([err instanceof Error ? err.message : 'Erreur lors du décodage du fichier JSON.']);
    }
  };

  // 3. Réinitialiser / Injecter le Seed Mondial (100+ Organismes)
  const handleRunSeed = async () => {
    setIsSeeding(true);
    try {
      for (const seedItem of GLOBAL_CERTIFICATION_BODIES_SEED) {
        const duplicate = isDuplicateBody(seedItem, currentBodies);
        if (duplicate && duplicate.id) {
          await updateCertificationBody(duplicate.id, seedItem);
        } else {
          await createCertificationBody(seedItem as CertificationBodyInsert);
        }
      }
      setIsSeeding(false);
      setSeedSuccess(true);
      onDataChanged();
      setTimeout(() => {
        setSeedSuccess(false);
      }, 3000);
    } catch {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* En-tête */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Globe2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Gestion des Données de l Annuaire
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sauvegarde JSON, restauration, import externe & catalogue de référence IFOAM/IAF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'export'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exporter ({currentBodies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'import'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Importer un fichier</span>
          </button>

          <button
            onClick={() => setActiveTab('seed')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'seed'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Base Mondiale de Référence</span>
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* 1. EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-emerald-700" />
                  Format JSON Standardisé & Exhaustif
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Exporte l ensemble des <strong>{currentBodies.length}</strong> organismes enregistrés avec toutes leurs métadonnées (coordonnées GPS, emails, canaux WhatsApp, accréditations ISO/IFOAM, scores de fiabilité).
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div>• Compatible pour sauvegarde de sécurité ou transfert inter-environnements.</div>
                <div>• Format structuré prêt pour traitement automatique.</div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le fichier JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors inline-block shadow-sm">
                    Parcourir mon ordinateur (JSON)
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  Fichiers .json générés par EthiMarket ou structures conformes
                </p>
              </div>

              {importStatus === 'processing' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-800 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Analyse et intégration des organismes en cours...</span>
                </div>
              )}

              {importStatus === 'success' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Importation terminée avec succès !</span>
                  </div>
                  <div>• {importStats.inserted} nouveaux organismes créés</div>
                  <div>• {importStats.updated} organismes existants mis à jour</div>
                  {importStats.skipped > 0 && <div>• {importStats.skipped} entrées ignorées (invalides)</div>}
                </div>
              )}

              {importStatus === 'error' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Erreur lors de l import</span>
                  </div>
                  {importErrors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. SEED MONDIAL */}
          {activeTab === 'seed' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                  Synchroniser le Catalogue Mondial Certifié
                </h4>
                <p className="text-xs text-amber-800 mt-1">
                  Injecte automatiquement plus de <strong>100 organismes réels</strong> couvrant 40+ pays et les 5 continents (Afrique de l Ouest, Asie du Sud, Amérique Latine, Europe, Océanie) avec leurs coordonnées directes vérifiées (Email, Téléphone, WhatsApp, Portails publics).
                </p>
              </div>

              {seedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Base mondiale synchronisée avec succès !</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={handleRunSeed}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                  <span>{isSeeding ? 'Synchronisation...' : 'Synchroniser le Catalogue Référence'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
