import React, { useState } from 'react';
import { X, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { CertificationBody } from '../../lib/supabase';
import { reportCertificationBodyProblem } from '../../lib/certificationBodiesService';

export interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  body: CertificationBody | null;
  onReported?: () => void;
}

export default function ReportProblemModal({
  isOpen,
  onClose,
  body,
  onReported
}: ReportProblemModalProps) {
  const [reason, setReason] = useState('invalid_contact');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !body) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.id) return;

    setIsSubmitting(true);
    const { error } = await reportCertificationBodyProblem(body.id, reason, details);
    setIsSubmitting(false);

    if (!error) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDetails('');
        onClose();
        if (onReported) onReported();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* En-tête */}
        <div className="bg-rose-600 p-5 text-white flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Signaler une anomalie
              </h3>
              <p className="text-xs text-rose-100">
                {body.name} ({body.country})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Signalement enregistré</h4>
            <p className="text-xs text-slate-600">
              L anomalie a été consignée dans les notes internes de l organisme. Merci pour votre vigilance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type d anomalie constatée
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="invalid_contact">Coordonnées de contact invalides (email en bounce, téléphone non attribué)</option>
                <option value="broken_link">Lien du registre ou site web inaccessible (Erreur 404 / 500)</option>
                <option value="accreditation_lost">Perte ou suspension de l accréditation officielle (ISO/IFOAM)</option>
                <option value="closed_agency">Fermeture définitive ou fusion de l organisme</option>
                <option value="other">Autre problème de données / doublon</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Détails complémentaires ou nouvelles coordonnées
              </label>
              <textarea
                rows={4}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Ex: Le numéro de téléphone a changé pour le +221..., l email officiel est désormais info@..."
                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Transmission...' : 'Envoyer le signalement'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
