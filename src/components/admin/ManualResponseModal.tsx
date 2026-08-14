import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Building2,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { ProducerCertificationStatus } from '../../lib/supabase';
import { recordManualResponse } from '../../lib/certificationVerificationService';

export interface ManualResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificationId: string;
  requestId: string;
  certificationNumber: string | null;
  producerName: string;
  bodyName: string;
  adminId: string;
  onResponseRecorded: (newStatus: ProducerCertificationStatus) => void;
}

type StatusOption = {
  value: 'verified' | 'rejected' | 'pending' | 'expired';
  label: string;
  desc: string;
  icon: typeof CheckCircle2;
  activeColor: string;
  borderColor: string;
  iconColor: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'verified',
    label: 'Vérifié & Conforme',
    desc: 'L’organisme confirme l’authenticité et la validité du certificat.',
    icon: CheckCircle2,
    activeColor: 'bg-emerald-50 border-emerald-500 text-emerald-900',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
    iconColor: 'text-emerald-600'
  },
  {
    value: 'rejected',
    label: 'Rejeté / Invalide',
    desc: 'Certificat faux, révoqué, ou non reconnu par l’organisme.',
    icon: XCircle,
    activeColor: 'bg-red-50 border-red-500 text-red-900',
    borderColor: 'border-red-200 hover:border-red-400',
    iconColor: 'text-red-600'
  },
  {
    value: 'pending',
    label: 'En attente de réponse',
    desc: 'L’organisme a accusé réception ou demande des pièces complémentaires.',
    icon: Clock,
    activeColor: 'bg-amber-50 border-amber-500 text-amber-900',
    borderColor: 'border-amber-200 hover:border-amber-400',
    iconColor: 'text-amber-600'
  },
  {
    value: 'expired',
    label: 'Certificat expiré',
    desc: 'Le certificat était authentique mais sa date de validité est dépassée.',
    icon: AlertTriangle,
    activeColor: 'bg-orange-50 border-orange-500 text-orange-900',
    borderColor: 'border-orange-200 hover:border-orange-400',
    iconColor: 'text-orange-600'
  }
];

const RESPONSE_CHANNELS = [
  'Email',
  'Téléphone',
  'Courrier',
  'WhatsApp',
  'Portail web',
  'Autre'
] as const;

export default function ManualResponseModal({
  isOpen,
  onClose,
  certificationId,
  requestId,
  certificationNumber,
  producerName,
  bodyName,
  adminId,
  onResponseRecorded
}: ManualResponseModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusOption['value']>('verified');
  const [responseContent, setResponseContent] = useState<string>('');
  const [channelReceived, setChannelReceived] = useState<string>('Email');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Autofocus
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus('verified');
      setResponseContent('');
      setChannelReceived('Email');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = responseContent.trim();
    if (trimmed.length < 10) {
      setErrorMessage('Le contenu de la réponse doit comporter au moins 10 caractères.');
      textareaRef.current?.focus();
      return;
    }

    if (!adminId) {
      setErrorMessage('Identifiant administrateur manquant. Veuillez vous reconnecter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullResponseText = `[Canal : ${channelReceived}] ${trimmed}`;
      const result = await recordManualResponse(
        certificationId,
        requestId,
        fullResponseText,
        selectedStatus,
        adminId
      );

      if (!result.success) {
        setErrorMessage(result.error || 'Erreur lors de l’enregistrement de la réponse.');
        setIsSubmitting(false);
        return;
      }

      onResponseRecorded(selectedStatus);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 bg-gray-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-brand-50 text-brand-700">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 id="modal-title" className="text-lg sm:text-xl font-black text-gray-900">
                Enregistrer une réponse reçue
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1 font-semibold text-gray-700">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {producerName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                {bodyName}
              </span>
              {certificationNumber && (
                <>
                  <span>•</span>
                  <span className="font-mono bg-gray-200/80 px-1.5 py-0.5 rounded text-gray-700">
                    N° {certificationNumber}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Champ 1 : Sélecteur de statut visuel */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              1. Résultat de la vérification <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STATUS_OPTIONS.map(opt => {
                const isSelected = selectedStatus === opt.value;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedStatus(opt.value)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${opt.activeColor} ring-2 ring-offset-1 ring-brand-500`
                        : `bg-white border-gray-200 hover:bg-gray-50/80 text-gray-800`
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${opt.iconColor}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Champ 2 : Canal de réception */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              2. Via quel canal avez-vous reçu la réponse ?
            </label>
            <div className="flex flex-wrap gap-2">
              {RESPONSE_CHANNELS.map(ch => {
                const isSelected = channelReceived === ch;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannelReceived(ch)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Champ 3 : Zone de texte */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="manual-response-content" className="text-sm font-bold text-gray-900">
                3. Contenu de la réponse reçue <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">
                {responseContent.trim().length} / min. 10 car.
              </span>
            </div>
            <textarea
              id="manual-response-content"
              ref={textareaRef}
              rows={4}
              value={responseContent}
              onChange={e => setResponseContent(e.target.value)}
              placeholder="Copier ici la réponse de l'organisme ou noter les informations obtenues par téléphone (nom de l'interlocuteur, date de validité confirmée, motifs éventuels de refus)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm text-gray-900 placeholder:text-gray-400 transition-colors"
              required
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || responseContent.trim().length < 10}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enregistrer la réponse</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
