import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap,
  Loader2,
  AlertTriangle,
  Cpu,
  Mail,
  Globe,
  MessageSquare,
  Phone,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  X,
  Building2,
  AlertCircle
} from 'lucide-react';
import type {
  CertificationBody,
  ProducerCertificationStatus,
  VerificationChannel,
  VerificationResult,
  CertificationMessageTemplate
} from '../../lib/supabase';
import { detectBestChannel } from '../../lib/certificationBodiesService';
import { triggerOneClickVerification } from '../../lib/certificationVerificationService';
import { getTemplates, getDefaultTemplate } from '../../lib/certificationTemplatesService';
import ChannelBadge from './ChannelBadge';

export interface OneClickVerificationButtonProps {
  certificationId: string;
  certificationBody: CertificationBody | null;
  currentStatus: ProducerCertificationStatus;
  adminId: string;
  onVerificationComplete: (result: VerificationResult) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CHANNEL_CONFIG = {
  api: {
    label: 'Vérification automatique',
    icon: Cpu,
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Interrogation directe et instantanée de l’API officielle de l’organisme.'
  },
  email: {
    label: 'Contacter par email',
    icon: Mail,
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Envoi d’un email formel de demande d’authentification avec modèle personnalisable.'
  },
  form: {
    label: 'Portail officiel',
    icon: Globe,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Ouverture du registre public ou portail de vérification en ligne de l’organisme.'
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageSquare,
    badgeBg: 'bg-green-50 text-green-700 border-green-200',
    description: 'Préparation d’un message WhatsApp direct pour le contact officiel de l’organisme.'
  },
  phone: {
    label: 'Appel téléphonique',
    icon: Phone,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Planification d’un contact téléphonique direct avec les numéros officiels.'
  },
  manual: {
    label: 'Contact manuel requis',
    icon: UserCheck,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Aucun canal automatisé disponible. Vérification manuelle requise.'
  }
} as const;

export default function OneClickVerificationButton({
  certificationId,
  certificationBody,
  currentStatus,
  adminId,
  onVerificationComplete,
  disabled = false,
  size = 'md',
  className = ''
}: OneClickVerificationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pour le canal email : templates
  const [emailTemplates, setEmailTemplates] = useState<CertificationMessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<CertificationMessageTemplate | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Détection du meilleur canal
  const bestChannel: VerificationChannel = useMemo(() => {
    if (!certificationBody) return 'manual';
    return detectBestChannel(certificationBody);
  }, [certificationBody]);

  const channelInfo = CHANNEL_CONFIG[bestChannel] || CHANNEL_CONFIG.manual;
  const isAlreadyVerified = currentStatus === 'verified';
  const isButtonDisabled = disabled || isAlreadyVerified || isLoading || !certificationBody;

  // Chargement des templates si canal email
  useEffect(() => {
    if (isModalOpen && bestChannel === 'email') {
      let isMounted = true;
      setIsLoadingTemplates(true);

      const loadEmailData = async () => {
        const [allRes, defRes] = await Promise.all([
          getTemplates({ channel: 'email' }),
          getDefaultTemplate('email', 'fr')
        ]);

        if (!isMounted) return;

        if (allRes.data && allRes.data.length > 0) {
          setEmailTemplates(allRes.data);
          const defaultOne = defRes.data || allRes.data[0];
          setSelectedTemplateId(defaultOne.id);
          setSelectedTemplate(defaultOne);
        }
        setIsLoadingTemplates(false);
      };

      loadEmailData();

      return () => {
        isMounted = false;
      };
    }
  }, [isModalOpen, bestChannel]);

  // Escape key pour la modale
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const found = emailTemplates.find(t => t.id === tmplId) || null;
    setSelectedTemplate(found);
  };

  const handleConfirmVerification = async () => {
    if (!adminId || !certificationId) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const result = await triggerOneClickVerification(certificationId, adminId, selectedTemplateId || undefined);

      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.message || 'Vérification déclenchée avec succès.'
        });

        // Ouverture de l'URL externe si présente (formulaire, portail, whatsapp)
        if (result.external_url) {
          window.open(result.external_url, '_blank', 'noopener,noreferrer');
        }

        onVerificationComplete(result);
        setIsModalOpen(false);
      } else {
        setFeedback({
          type: 'error',
          message: result.error || result.message || 'Échec lors de la vérification.'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];

  return (
    <div className={`inline-flex flex-col items-start gap-1.5 ${className}`}>
      {/* Alerte si aucun organisme */}
      {!certificationBody && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
          <AlertTriangle className="w-3.5 h-3.5" />
          Aucun organisme associé
        </span>
      )}

      {/* Conteneur bouton + badge canal */}
      <div className="flex flex-wrap items-center gap-2">
        {certificationBody && (
          <ChannelBadge channel={bestChannel} size={size === 'lg' ? 'md' : 'sm'} />
        )}

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isButtonDisabled}
          className={`inline-flex items-center font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-600 active:scale-98 ${sizeClasses}`}
          title={
            isAlreadyVerified
              ? 'Certification déjà vérifiée'
              : !certificationBody
              ? 'Associez un organisme certificateur pour vérifier'
              : 'Déclencher la vérification en 1 clic'
          }
        >
          {isLoading ? (
            <>
              <Loader2 className={`${iconSizes} animate-spin`} />
              <span>Vérification...</span>
            </>
          ) : (
            <>
              <Zap className={`${iconSizes} fill-current text-amber-300`} />
              <span>Vérifier en 1 clic</span>
            </>
          )}
        </button>
      </div>

      {/* Message de feedback inline rapide si présent */}
      {feedback && (
        <div
          className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* MODALE DE CONFIRMATION */}
      {isModalOpen && certificationBody && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Header modale */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs">
                  <Zap className="w-5 h-5 fill-current text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight">
                    Vérification en 1 clic
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Canal sélectionné : <strong>{channelInfo.label}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps de la modale */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Carte récapitulative organisme */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Organisme :</span>
                  <span className="font-bold text-gray-900 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    {certificationBody.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Pays / Région :</span>
                  <span className="font-semibold text-gray-700">
                    {certificationBody.country} ({certificationBody.region})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Action prévue :</span>
                  <span className="font-semibold text-brand-700">{channelInfo.label}</span>
                </div>
                <p className="text-xs text-gray-500 pt-2 border-t border-gray-200/60 leading-relaxed">
                  {channelInfo.description}
                </p>
              </div>

              {/* Détails spécifiques selon le canal */}

              {/* CANAL : API */}
              {bestChannel === 'api' && (
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2 text-xs text-indigo-900">
                  <div className="flex items-center gap-2 font-bold text-indigo-950">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    <span>Endpoint API cible :</span>
                  </div>
                  <code className="block p-2 rounded-lg bg-white border border-indigo-200 font-mono text-[11px] break-all text-indigo-800">
                    {certificationBody.api_endpoint || 'Endpoint officiel configuré'}
                  </code>
                  <p className="text-[11px] text-indigo-700">
                    L'API officielle sera interrogée avec le numéro de certificat pour obtenir une confirmation instantanée.
                  </p>
                </div>
              )}

              {/* CANAL : EMAIL */}
              {bestChannel === 'email' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Destinataire :</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {certificationBody.email_contact}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Modèle de message à envoyer :
                    </label>
                    {isLoadingTemplates ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                        <span>Chargement des modèles...</span>
                      </div>
                    ) : (
                      <select
                        value={selectedTemplateId}
                        onChange={e => handleTemplateChange(e.target.value)}
                        className="w-full text-xs font-medium bg-white px-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                      >
                        {emailTemplates.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.language.toUpperCase()}) {t.is_default ? '★ Défaut' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedTemplate && (
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs space-y-1.5">
                      <p className="font-bold text-blue-950 truncate">
                        Sujet : <span className="font-normal text-blue-800">{selectedTemplate.subject || 'Demande de vérification de certification'}</span>
                      </p>
                      <div className="max-h-28 overflow-y-auto p-2 bg-white rounded-lg border border-blue-100 text-[11px] text-gray-700 font-mono whitespace-pre-wrap">
                        {selectedTemplate.body}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CANAL : FORMULAIRE / PORTAIL */}
              {bestChannel === 'form' && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-2 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-emerald-950">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Portail officiel de vérification :</span>
                  </div>
                  <a
                    href={certificationBody.verification_url || certificationBody.contact_form_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-white border border-emerald-200 font-mono text-[11px] text-emerald-700 hover:text-emerald-900 break-all"
                  >
                    <span>{certificationBody.verification_url || certificationBody.contact_form_url}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                  <p className="text-[11px] text-emerald-700">
                    Le portail web officiel sera ouvert dans un nouvel onglet et une requête de vérification sera archivée.
                  </p>
                </div>
              )}

              {/* CANAL : WHATSAPP */}
              {bestChannel === 'whatsapp' && (
                <div className="p-4 rounded-xl bg-green-50/70 border border-green-100 space-y-2 text-xs text-green-900">
                  <div className="flex items-center justify-between font-bold text-green-950">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      Numéro WhatsApp officiel :
                    </span>
                    <span className="font-mono font-bold">{certificationBody.whatsapp}</span>
                  </div>
                  <p className="text-[11px] text-green-700">
                    Un lien WhatsApp Web pré-rempli sera ouvert pour contacter directement l'agent de l'organisme.
                  </p>
                </div>
              )}

              {/* CANAL : TÉLÉPHONE */}
              {bestChannel === 'phone' && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 space-y-2 text-xs text-amber-900">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-amber-600" />
                      Numéro de téléphone officiel :
                    </span>
                    <a
                      href={`tel:${certificationBody.phone}`}
                      className="font-mono font-bold underline text-amber-800"
                    >
                      {certificationBody.phone}
                    </a>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Une tâche de vérification téléphonique sera enregistrée. Vous pourrez saisir le compte-rendu d'appel.
                  </p>
                </div>
              )}

              {/* CANAL : MANUEL */}
              {bestChannel === 'manual' && (
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 space-y-2 text-xs text-purple-900">
                  <div className="flex items-center gap-2 font-bold text-purple-950">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>Vérification manuelle requise</span>
                  </div>
                  <p className="text-[11px] text-purple-700">
                    Le statut passera à « Action manuelle requise » et un audit sera inscrit pour suivi par l’équipe de conformité.
                  </p>
                </div>
              )}
            </div>

            {/* Footer de la modale */}
            <div className="flex items-center justify-end gap-3 p-5 sm:p-6 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmVerification}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Déclenchement...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current text-amber-300" />
                    <span>Confirmer et vérifier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
