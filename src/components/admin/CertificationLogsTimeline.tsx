import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Mail,
  Globe,
  MessageSquare,
  Phone,
  UserCheck,
  ShieldCheck,
  History,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import type {
  CertificationVerificationLog,
  VerificationChannel,
  ProducerCertificationStatus
} from '../../lib/supabase';
import { getCertificationLogs } from '../../lib/certificationVerificationService';
import CertificationStatusBadge from './CertificationStatusBadge';

export interface CertificationLogsTimelineProps {
  certificationId: string;
  logs?: CertificationVerificationLog[];
  isLoading?: boolean;
  maxItems?: number;
  showAll?: boolean;
  className?: string;
}

const ACTION_LABELS: Record<string, string> = {
  STATUS_UPDATED: 'Statut mis à jour manuellement',
  API_VERIFY_SUCCESS: 'Vérification API réussie avec succès',
  API_VERIFY_FAILED: 'Échec de la vérification via API',
  EMAIL_VERIFY_SENT: 'Email de demande de vérification envoyé',
  PORTAL_VERIFY_TRIGGERED: 'Portail de vérification officiel ouvert',
  WHATSAPP_VERIFY_TRIGGERED: 'Message WhatsApp de vérification préparé',
  PHONE_VERIFY_QUEUED: 'Vérification téléphonique en attente',
  MANUAL_RESPONSE_RECORDED: 'Réponse manuelle de l’organisme enregistrée',
  MANUAL_REQUIRED_FALLBACK: 'Vérification manuelle requise (aucun canal direct)',
  MANUAL_REQUIRED_BODY_NULL: 'Vérification manuelle requise (aucun organisme associé)',
  CERTIFICATION_CREATED: 'Certification ajoutée au dossier'
};

const ACTION_POINT_COLORS: Record<string, string> = {
  STATUS_UPDATED: 'bg-blue-500 ring-blue-100',
  API_VERIFY_SUCCESS: 'bg-emerald-500 ring-emerald-100',
  API_VERIFY_FAILED: 'bg-red-500 ring-red-100',
  EMAIL_VERIFY_SENT: 'bg-sky-500 ring-sky-100',
  PORTAL_VERIFY_TRIGGERED: 'bg-teal-500 ring-teal-100',
  WHATSAPP_VERIFY_TRIGGERED: 'bg-green-500 ring-green-100',
  PHONE_VERIFY_QUEUED: 'bg-amber-500 ring-amber-100',
  MANUAL_RESPONSE_RECORDED: 'bg-purple-500 ring-purple-100',
  MANUAL_REQUIRED_FALLBACK: 'bg-orange-500 ring-orange-100',
  MANUAL_REQUIRED_BODY_NULL: 'bg-orange-500 ring-orange-100'
};

function getChannelIcon(channel?: VerificationChannel | null) {
  switch (channel) {
    case 'api':
      return Cpu;
    case 'email':
      return Mail;
    case 'form':
      return Globe;
    case 'whatsapp':
      return MessageSquare;
    case 'phone':
      return Phone;
    case 'manual':
      return UserCheck;
    default:
      return ShieldCheck;
  }
}

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return dateString;
  }
}

export default function CertificationLogsTimeline({
  certificationId,
  logs: propLogs,
  isLoading: propLoading = false,
  maxItems = 5,
  showAll: initialShowAll = false,
  className = ''
}: CertificationLogsTimelineProps) {
  const [internalLogs, setInternalLogs] = useState<CertificationVerificationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(propLogs === undefined);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(initialShowAll);

  const fetchLogs = useCallback(async () => {
    if (!certificationId) return;
    setLoading(true);
    setError(null);
    const res = await getCertificationLogs(certificationId);
    if (res.error) {
      setError(res.error);
    } else {
      setInternalLogs(res.data);
    }
    setLoading(false);
  }, [certificationId]);

  useEffect(() => {
    if (propLogs === undefined) {
      fetchLogs();
    }
  }, [propLogs, fetchLogs]);

  const displayedLogs = propLogs !== undefined ? propLogs : internalLogs;
  const isCurrentlyLoading = propLoading || (propLogs === undefined && loading);

  // Skeleton loader
  if (isCurrentlyLoading) {
    return (
      <div className={`space-y-4 py-2 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>Erreur lors du chargement des logs : {error}</span>
      </div>
    );
  }

  if (!displayedLogs || displayedLogs.length === 0) {
    return (
      <div className={`p-6 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200 ${className}`}>
        <History className="w-8 h-8 mx-auto text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-500">
          Aucune action enregistrée pour cette certification.
        </p>
      </div>
    );
  }

  const itemsToRender = expanded ? displayedLogs : displayedLogs.slice(0, maxItems);
  const hasMore = displayedLogs.length > maxItems;

  return (
    <div className={`relative ${className}`}>
      {/* Timeline entries list */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
        {itemsToRender.map((log) => {
          const ChannelIcon = getChannelIcon(log.channel_used);
          const pointColorClass = ACTION_POINT_COLORS[log.action] ?? 'bg-gray-400 ring-gray-100';
          const actionText = ACTION_LABELS[log.action] || log.action.replace(/_/g, ' ');

          // Profil admin
          const adminName = log.admin_profile
            ? `${log.admin_profile.first_name || ''} ${log.admin_profile.last_name || ''}`.trim() || log.admin_profile.email
            : 'Système automatique';

          // Extraction des détails utiles
          const details = log.details || {};
          const detailStrings: string[] = [];

          if (typeof details.to === 'string' && details.to) {
            detailStrings.push(`Destinataire : ${details.to}`);
          }
          if (typeof details.subject === 'string' && details.subject) {
            detailStrings.push(`Objet : ${details.subject}`);
          }
          if (typeof details.url === 'string' && details.url) {
            detailStrings.push(`URL : ${details.url}`);
          }
          if (typeof details.phone === 'string' && details.phone) {
            detailStrings.push(`Tél : ${details.phone}`);
          }
          if (typeof details.reason === 'string' && details.reason) {
            detailStrings.push(`Motif : ${details.reason}`);
          }
          if (typeof details.adminNotes === 'string' && details.adminNotes) {
            detailStrings.push(`Notes : ${details.adminNotes}`);
          }
          if (typeof details.response === 'string' && details.response) {
            detailStrings.push(`Réponse : ${details.response}`);
          }

          return (
            <div key={log.id} className="relative group">
              {/* Point marqueur */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full ring-4 flex items-center justify-center text-white ${pointColorClass}`}
              >
                <ChannelIcon className="w-2.5 h-2.5" />
              </div>

              {/* Contenu */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-100 shadow-xs hover:border-gray-200 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <span className="text-sm font-bold text-gray-900 leading-snug">
                    {actionText}
                  </span>
                  <time className="text-xs text-gray-400 font-medium whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </time>
                </div>

                {/* Transition de statut */}
                {(log.previous_status || log.new_status) && log.previous_status !== log.new_status && (
                  <div className="flex items-center flex-wrap gap-1.5 my-2">
                    {log.previous_status && (
                      <CertificationStatusBadge
                        status={log.previous_status as ProducerCertificationStatus}
                        size="sm"
                      />
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {log.new_status && (
                      <CertificationStatusBadge
                        status={log.new_status as ProducerCertificationStatus}
                        size="sm"
                      />
                    )}
                  </div>
                )}

                {/* Détails secondaires */}
                {detailStrings.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    {detailStrings.map((str, idx) => (
                      <p key={idx} className="break-words font-mono text-[11px]">
                        {str}
                      </p>
                    ))}
                  </div>
                )}

                {/* Auteur */}
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-gray-400" />
                    <span>Par : <strong className="text-gray-600 font-semibold">{adminName}</strong></span>
                  </span>
                  {log.ip_address && (
                    <span className="font-mono text-[10px] text-gray-300">
                      IP: {log.ip_address}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton déplier / replier */}
      {hasMore && (
        <div className="mt-4 pt-2 text-center">
          <button
            type="button"
            onClick={() => setExpanded(prev => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Réduire l'historique</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Voir tout l'historique ({displayedLogs.length} actions)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
