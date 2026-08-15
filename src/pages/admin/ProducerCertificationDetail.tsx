import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Clock,
  Send,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  History,
  Download,
  Info,
  Sparkles
} from 'lucide-react';
import CertificationStatusBadge from '../../components/admin/CertificationStatusBadge';
import ChannelBadge from '../../components/admin/ChannelBadge';
import OneClickVerificationButton from '../../components/admin/OneClickVerificationButton';
import MatchingQualityBadge from '../../components/admin/MatchingQualityBadge';
import BodyAlternativeSelector from '../../components/admin/BodyAlternativeSelector';
import UniversalContactModal from '../../components/admin/UniversalContactModal';
import {
  getProducerCertificationById,
  updateCertificationStatus,
  recordManualResponse
} from '../../lib/certificationVerificationService';
import { findBestMatchingBody, FindBestMatchResult } from '../../lib/certificationMatchingService';
import { useAuth } from '../../lib/auth';
import type {
  ProducerCertification,
  ProducerCertificationStatus,
  CertificationBody
} from '../../lib/supabase';
import { PRODUCER_CERTIFICATION_STATUSES } from '../../lib/supabase';

export default function ProducerCertificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [certification, setCertification] = useState<ProducerCertification | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // États pour la modale de contact & redirection intelligente
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [matchingResult, setMatchingResult] = useState<FindBestMatchResult | null>(null);
  const [activeBody, setActiveBody] = useState<CertificationBody | null>(null);

  // États pour la mise à jour manuelle
  const [selectedStatus, setSelectedStatus] = useState<ProducerCertificationStatus>('verified');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusActionSuccess, setStatusActionSuccess] = useState<string | null>(null);

  // État pour enregistrer la réponse d'une requête spécifique
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [manualResponseText, setManualResponseText] = useState<string>('');
  const [responseResultStatus, setResponseResultStatus] = useState<ProducerCertificationStatus>('verified');
  const [isSavingResponse, setIsSavingResponse] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getProducerCertificationById(id);
      if (res.error || !res.data) {
        setError(res.error || 'Certification introuvable');
        setCertification(null);
      } else {
        setCertification(res.data);
        setSelectedStatus(res.data.status);
        setAdminNotes(res.data.admin_notes || '');
        setActiveBody(res.data.certification_body || null);

        // Exécution du moteur de matching
        const prodCountry = res.data.producer?.country || res.data.country_of_issue || 'France';
        const declared = res.data.certification_type || res.data.certification_standard?.name || 'Bio';

        const match = await findBestMatchingBody({
          standardName: declared,
          producerCountry: prodCountry,
          rawCertificationInput: declared
        });
        setMatchingResult(match);
        if (!res.data.certification_body && match.primaryMatch) {
          setActiveBody(match.primaryMatch);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Formatage des dates
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Mise à jour directe du statut
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !profile) return;

    setIsUpdatingStatus(true);
    setStatusActionSuccess(null);
    try {
      const res = await updateCertificationStatus(id, selectedStatus, profile.id, adminNotes);
      if (res.error) {
        setError(res.error);
      } else {
        setStatusActionSuccess('Statut mis à jour avec succès');
        setTimeout(() => setStatusActionSuccess(null), 4000);
        await loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Validation / Rejet direct en 1 clic
  const handleQuickDecision = async (newStatus: 'verified' | 'rejected') => {
    if (!id || !profile) return;
    setIsUpdatingStatus(true);
    setStatusActionSuccess(null);
    try {
      const res = await updateCertificationStatus(
        id,
        newStatus,
        profile.id,
        newStatus === 'verified' ? 'Validation de conformité effectuée par l\'administrateur' : 'Dossier rejeté par l\'administrateur'
      );
      if (res.error) {
        setError(res.error);
      } else {
        setStatusActionSuccess(newStatus === 'verified' ? 'Certificat validé avec succès !' : 'Certificat rejeté');
        setTimeout(() => setStatusActionSuccess(null), 4000);
        await loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      setError(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Enregistrer une réponse manuelle d'organisme
  const handleSaveManualResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestId || !profile) return;

    setIsSavingResponse(true);
    try {
      const res = await recordManualResponse(
        activeRequestId,
        manualResponseText,
        responseResultStatus,
        profile.id
      );
      if (res.error) {
        setError(res.error);
      } else {
        setActiveRequestId(null);
        setManualResponseText('');
        setStatusActionSuccess('Réponse de l\'organisme enregistrée avec succès');
        setTimeout(() => setStatusActionSuccess(null), 4000);
        await loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      setError(msg);
    } finally {
      setIsSavingResponse(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white rounded-2xl border border-gray-100 p-6" />
            <div className="h-48 bg-white rounded-2xl border border-gray-100 p-6" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-white rounded-2xl border border-gray-100 p-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!certification && !isLoading) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin/certifications/producers')}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des certifications</span>
        </button>

        <div className="p-8 rounded-2xl bg-white border border-gray-100 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Dossier introuvable</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Cette certification n'existe pas ou a été supprimée.
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/certifications/producers')}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
          >
            Voir toutes les certifications
          </button>
        </div>
      </div>
    );
  }

  const standard = certification?.certification_standard;
  const requests = certification?.verification_requests || [];
  const logs = certification?.logs || [];

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton Retour et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/certifications/producers')}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                Certificat {certification?.certificate_number || 'N/A'}
              </h1>
              {certification && <CertificationStatusBadge status={certification.status} size="md" />}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Producteur : <strong className="text-gray-800">{certification?.producer?.name || 'Inconnu'}</strong>
              {certification?.producer?.country && ` (${certification.producer.country})`}
            </p>
          </div>
        </div>

        {/* Boutons d'actions en haut à droite */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Contacter l'Organisme</span>
          </button>

          {certification && certification.status !== 'verified' && (
            <OneClickVerificationButton
              certificationId={certification.id}
              certificationBody={activeBody || null}
              currentStatus={certification.status}
              adminId={profile?.id || ''}
              size="md"
              onVerificationComplete={() => {
                loadData();
              }}
            />
          )}
        </div>
      </div>

      {/* Messages d'alerte / succès */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm">Une erreur est survenue</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-bold text-red-800 hover:underline"
          >
            Fermer
          </button>
        </div>
      )}

      {statusActionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <p className="text-xs font-bold">{statusActionSuccess}</p>
        </div>
      )}

      {/* Grille Principale 2 Colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE (2/3) : Détails du certificat + Organisme & Matching + Historique */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARTE 1 : Informations générales du certificat */}
          <section aria-label="Informations du certificat" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-bold text-gray-900">Détails du certificat</h2>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                Standard : {certification?.certification_type}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-gray-400 font-medium">Standard associé</span>
                <p className="font-bold text-gray-900 text-sm">{standard?.name || certification?.certification_type || 'Standard non rattaché'}</p>
                {standard?.code && <p className="text-gray-500 font-mono text-[11px]">{standard.code}</p>}
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-medium">Pays d'émission</span>
                <p className="font-bold text-gray-900 text-sm">
                  {certification?.country_of_issue || certification?.producer?.country || 'Non renseigné'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-medium">Date d'émission</span>
                <p className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatDate(certification?.issued_at)}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-medium">Date d'expiration</span>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatDate(certification?.expires_at)}</span>
                  </p>
                  {certification?.is_expired && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                      Expiré
                    </span>
                  )}
                  {!certification?.is_expired && certification?.expires_soon && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                      Expire sous 30j
                    </span>
                  )}
                </div>
              </div>

              {certification?.verified_at && (
                <div className="space-y-1">
                  <span className="text-gray-400 font-medium">Vérifié le</span>
                  <p className="font-bold text-emerald-700 text-sm">{formatDate(certification.verified_at)}</p>
                  {certification.verified_by_profile && (
                    <p className="text-gray-500 text-[11px]">
                      Par {certification.verified_by_profile.first_name} {certification.verified_by_profile.last_name}
                    </p>
                  )}
                </div>
              )}

              {certification?.document_path && (
                <div className="space-y-1 sm:col-span-2 pt-2 border-t border-gray-100">
                  <span className="text-gray-400 font-medium">Document justificatif fourni</span>
                  <div className="mt-1 flex items-center gap-3">
                    <a
                      href={certification.document_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-brand-700 font-bold border border-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Consulter le document / certificat</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* CARTE 2 : Redirection Intelligente & Organisme Recommandé */}
          <section aria-label="Organisme certificateur" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-gray-900">Organisme Certificateur & Redirection Intelligente</h2>
              </div>
              {matchingResult && (
                <MatchingQualityBadge
                  quality={matchingResult.matchQuality}
                  score={matchingResult.matchScore}
                  reasons={matchingResult.matchReasons}
                  size="sm"
                />
              )}
            </div>

            <BodyAlternativeSelector
              currentBody={activeBody}
              alternatives={matchingResult?.alternativeMatches || []}
              onSelectBody={(b) => setActiveBody(b)}
              fuzzyCorrectionSuggestion={matchingResult?.fuzzyCorrectionSuggestion}
            />

            {activeBody && (
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ouvrir la console de contact multicanal</span>
                </button>

                <Link
                  to={`/admin/certifications/bodies/${activeBody.id}`}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <span>Consulter la fiche complète</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </section>

          {/* CARTE 3 : Historique des demandes de vérification */}
          <section aria-label="Historique des demandes" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-gray-900">Demandes de vérification envoyées</h2>
              </div>
              <span className="text-xs font-bold text-gray-500">{requests.length} tentative(s)</span>
            </div>

            {requests.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                Aucune demande de vérification n'a encore été enregistrée pour ce certificat.
              </p>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ChannelBadge channel={req.channel} size="sm" />
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : req.status === 'sent'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(req.sent_at)}
                      </span>
                    </div>

                    {req.message_sent && (
                      <div className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200/70 font-mono whitespace-pre-wrap text-[11px] max-h-32 overflow-y-auto">
                        {req.message_sent}
                      </div>
                    )}

                    {req.response_received ? (
                      <div className="text-xs text-emerald-900 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                        <p className="font-bold text-[11px] text-emerald-700 mb-1">
                          Réponse reçue {req.responded_at ? `le ${formatDateTime(req.responded_at)}` : ''} :
                        </p>
                        <p className="text-[11px] whitespace-pre-wrap">{req.response_received}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-amber-700 italic">En attente de réponse...</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRequestId(req.id);
                            setManualResponseText('');
                          }}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 underline"
                        >
                          Enregistrer une réponse
                        </button>
                      </div>
                    )}

                    {/* Formulaire inline pour enregistrer la réponse manuelle */}
                    {activeRequestId === req.id && (
                      <form onSubmit={handleSaveManualResponse} className="mt-3 p-3 bg-white rounded-xl border border-brand-200 space-y-3">
                        <h4 className="text-xs font-bold text-gray-900">Enregistrer la réponse de l'organisme</h4>
                        <textarea
                          required
                          value={manualResponseText}
                          onChange={e => setManualResponseText(e.target.value)}
                          placeholder="Collez ici l'email ou la confirmation reçue de l'organisme..."
                          rows={3}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">Nouveau statut :</span>
                            <select
                              value={responseResultStatus}
                              onChange={e => setResponseResultStatus(e.target.value as ProducerCertificationStatus)}
                              className="text-xs py-1 px-2 border border-gray-200 rounded-lg bg-gray-50"
                            >
                              <option value="verified">Vérifiée / Conforme</option>
                              <option value="rejected">Rejetée / Non conforme</option>
                              <option value="pending">En attente d'éléments complémentaires</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveRequestId(null)}
                              className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                              Annuler
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingResponse || !manualResponseText.trim()}
                              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                            >
                              {isSavingResponse ? 'Enregistrement...' : 'Valider la réponse'}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* CARTE 4 : Journal d'audit et logs complets */}
          <section aria-label="Journal d'audit" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600" />
                <h2 className="text-base font-bold text-gray-900">Journal d'audit & Traçabilité</h2>
              </div>
              <span className="text-xs font-bold text-gray-500">{logs.length} entrée(s)</span>
            </div>

            {logs.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">Aucun événement journalisé</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {logs.map(log => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-[11px] text-gray-800">{log.action}</span>
                        {log.channel_used && <ChannelBadge channel={log.channel_used} size="sm" />}
                      </div>
                      <p className="text-gray-600 text-[11px]">
                        {log.previous_status ? `${log.previous_status} → ` : ''}
                        <strong>{log.new_status || 'Modifié'}</strong>
                      </p>
                      {log.admin_profile && (
                        <p className="text-[10px] text-gray-400">
                          Par {log.admin_profile.first_name} {log.admin_profile.last_name} ({log.admin_profile.email})
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* COLONNE DROITE (1/3) : Actions Administrateur et Producteur */}
        <div className="space-y-6">
          {/* CARTE : Actions d'audit et Décision manuelle */}
          <section aria-label="Décision manuelle" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Action administrateur
            </h2>

            {/* Décisions express */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500">Décision express :</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDecision('verified')}
                  disabled={isUpdatingStatus || certification?.status === 'verified'}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider conforme</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDecision('rejected')}
                  disabled={isUpdatingStatus || certification?.status === 'rejected'}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rejeter</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label htmlFor="select-status" className="font-semibold text-gray-700">Changer le statut :</label>
                  <select
                    id="select-status"
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value as ProducerCertificationStatus)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 font-medium text-gray-800"
                  >
                    {PRODUCER_CERTIFICATION_STATUSES.map(st => (
                      <option key={st.value} value={st.value}>
                        {st.labelFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="admin-notes" className="font-semibold text-gray-700">Notes internes d'audit :</label>
                  <textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={3}
                    placeholder="Commentaire de vérification ou motif..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Enregistrement...' : 'Mettre à jour le dossier'}
                </button>
              </form>
            </div>
          </section>

          {/* CARTE : Fiche du producteur */}
          <section aria-label="Informations producteur" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-700" />
                <h2 className="text-base font-bold text-gray-900">Producteur</h2>
              </div>
              {certification?.producer && (
                <Link
                  to={`/admin/producers`}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  Voir dans la liste
                </Link>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-sm text-gray-900">{certification?.producer?.name || 'Inconnu'}</p>
                <p className="text-gray-500">{certification?.producer?.country || 'Pays non renseigné'}</p>
              </div>

              <div className="p-3 bg-brand-50/50 rounded-xl border border-brand-100 text-[11px] text-brand-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-3.5 h-3.5 text-brand-600" />
                  <span>Impact sur le score éthique</span>
                </div>
                <p>
                  La validation de ce certificat crédite automatiquement le score de confiance et d'impact du producteur sur la marketplace.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Modale de contact universelle */}
      {isContactModalOpen && (
        <UniversalContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          body={activeBody}
          certificateNumber={certification.certificate_number || 'N/A'}
          producerName={certification.producer?.name || 'Producteur Partenaire'}
          producerCountry={certification.producer?.country || certification.country_of_issue || 'France'}
          declaredStandard={certification.certification_type || certification.certification_standard?.name || 'Bio'}
          onBodySelected={(b) => setActiveBody(b)}
        />
      )}
    </div>
  );
}
