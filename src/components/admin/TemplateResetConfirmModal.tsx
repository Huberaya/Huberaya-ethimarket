import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Info,
  RotateCcw,
  Download,
  Loader2,
  X,
  ShieldAlert
} from 'lucide-react';
import {
  resetToDefaultTemplates,
  exportTemplatesAsJSON
} from '../../lib/certificationTemplatesService';

export type TemplateResetConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: (count: number) => void;
  userId?: string;
  currentTemplatesCount: number;
};

export default function TemplateResetConfirmModal({
  isOpen,
  onClose,
  onConfirmed,
  userId,
  currentTemplatesCount
}: TemplateResetConfirmModalProps) {
  const [confirmText, setConfirmText] = useState<string>('');
  const [createBackup, setCreateBackup] = useState<boolean>(true);
  const [overwriteDuplicates, setOverwriteDuplicates] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setCreateBackup(true);
      setOverwriteDuplicates(false);
      setIsSubmitting(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmationMatched = confirmText.trim() === 'REINITIALISER';

  const handleExecuteReset = async () => {
    if (!isConfirmationMatched || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Sauvegarde automatique si demandée
      if (createBackup) {
        try {
          const jsonStr = await exportTemplatesAsJSON();
          const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `backup_before_reset_${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (backupErr) {
          console.warn('Erreur lors du téléchargement de la sauvegarde:', backupErr);
        }
      }

      // 2. Appel au service de réinitialisation
      const res = await resetToDefaultTemplates(userId);

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        onConfirmed(res.count);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur imprévue lors de la réinitialisation';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-red-100 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* EN-TÊTE D'ALERTE */}
        <div className="p-6 text-center space-y-3 bg-gradient-to-b from-amber-50/80 via-white to-white border-b border-amber-100 relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h2 id="reset-modal-title" className="text-base font-black text-gray-900 tracking-tight">
              Réinitialiser les modèles d'usine
            </h2>
            <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
              Vous êtes sur le point de restaurer les <strong>12 modèles de messages par défaut</strong> d'EthiMarket.
            </p>
          </div>
        </div>

        {/* CORPS DE LA MODALE */}
        <div className="p-6 space-y-5 text-xs">
          {/* Bloc d'informations jaune */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cette action va :</span>
            </div>
            <ul className="space-y-1.5 pl-5 list-disc text-[11px] leading-relaxed text-amber-800">
              <li>
                Créer les <strong>12 templates officiels</strong> (Email FR/EN/ES/PT, WhatsApp FR/EN, Formulaire FR/EN, API FR/EN, Relance FR/EN).
              </li>
              <li>
                <strong>Ne PAS supprimer</strong> vos templates personnalisés existants ({currentTemplatesCount} modèles actuellement actifs).
              </li>
              <li>
                Les nouveaux templates seront marqués par défaut selon les règles standard.
              </li>
            </ul>
          </div>

          {/* Options de reset */}
          <div className="space-y-3">
            {/* Toggle Sauvegarde automatique */}
            <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={createBackup}
                onChange={(e) => setCreateBackup(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 mt-0.5"
              />
              <div>
                <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-brand-600" />
                  <span>Créer une sauvegarde avant réinitialisation</span>
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Un fichier JSON contenant tous vos modèles actuels sera téléchargé automatiquement sur votre machine.
                </span>
              </div>
            </label>

            {/* Toggle Écraser les existants */}
            <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={overwriteDuplicates}
                onChange={(e) => setOverwriteDuplicates(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 mt-0.5"
              />
              <div>
                <span className="font-bold text-gray-800 text-xs block">
                  Écraser les templates existants portant le même nom
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Si activé, les modèles d'usine existants seront remplacés par leur version d'origine.
                </span>
              </div>
            </label>
          </div>

          {/* Message d'erreur éventuel */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Champ de confirmation textuelle */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-[11px] font-bold text-gray-700 block">
              Pour confirmer, tapez <span className="font-mono text-red-600 select-all font-black">REINITIALISER</span> ci-dessous :
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="REINITIALISER"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-900 tracking-wider focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* BARRE D'ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs border border-gray-200 transition-colors shadow-2xs disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleExecuteReset}
            disabled={!isConfirmationMatched || isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs shadow-md transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Restauration en cours...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Confirmer la réinitialisation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
