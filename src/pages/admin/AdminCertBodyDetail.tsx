import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Globe,
  Mail,
  MessageCircle,
  ExternalLink,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  FileCheck,
  UserCheck,
  Award
} from 'lucide-react';
import ChannelBadge from '../../components/admin/ChannelBadge';
import CertificationStatusBadge from '../../components/admin/CertificationStatusBadge';
import {
  getCertificationBodyById,
  updateCertificationBody,
  addCertificationStandard,
  deleteCertificationStandard,
  addCertificationBodyContact,
  deleteCertificationBodyContact,
  getProducerCertifications
} from '../../lib/certificationVerificationService';
import type {
  CertificationBody,
  ProducerCertification,
  CertificationType,
  TrustLevel,
  CertificationRegion
} from '../../lib/supabase';
import {
  CERTIFICATION_REGIONS,
  CERTIFICATION_TYPES,
  TRUST_LEVELS
} from '../../lib/supabase';

export default function AdminCertBodyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [body, setBody] = useState<(CertificationBody & { producer_certifications_count?: number }) | null>(null);
  const [producerCerts, setProducerCerts] = useState<ProducerCertification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'standards' | 'contacts' | 'certifications'>('overview');

  // Modals
  const [isEditBodyModalOpen, setIsEditBodyModalOpen] = useState<boolean>(false);
  const [isAddStandardModalOpen, setIsAddStandardModalOpen] = useState<boolean>(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Formulaire d'édition de l'organisme
  const [editFormData, setEditFormData] = useState({
    name: '',
    acronym: '',
    country: '',
    region: 'Europe' as CertificationRegion,
    sub_region: '',
    website: '',
    verification_url: '',
    api_endpoint: '',
    api_key_required: false,
    email_contact: '',
    phone: '',
    whatsapp: '',
    contact_form_url: '',
    languages: 'fr, en',
    certification_types: ['organic'] as CertificationType[],
    trust_level: 'verified' as TrustLevel,
    internal_notes: '',
    is_active: true
  });

  // Formulaire Nouveau Standard
  const [newStandardData, setNewStandardData] = useState<{
    name: string;
    code: string;
    type: CertificationType;
    scope: string;
    description: string;
    geographic_coverage: string;
  }>({
    name: '',
    code: '',
    type: 'organic',
    scope: 'Production agricole biologique et transformation',
    description: '',
    geographic_coverage: ''
  });

  // Formulaire Nouveau Contact
  const [newContactData, setNewContactData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    language: 'fr',
    is_primary: false,
    notes: ''
  });

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [bodyRes, certsRes] = await Promise.all([
        getCertificationBodyById(id),
        getProducerCertifications({ certification_body_id: id }, 1, 50)
      ]);

      if (bodyRes.error || !bodyRes.data) {
        setError(bodyRes.error || 'Organisme introuvable');
        setBody(null);
      } else {
        setBody(bodyRes.data);
        setProducerCerts(certsRes.data || []);
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

  const handleOpenEditModal = () => {
    if (!body) return;
    setEditFormData({
      name: body.name || '',
      acronym: body.acronym || '',
      country: body.country || '',
      region: body.region || 'Europe',
      sub_region: body.sub_region || '',
      website: body.website || '',
      verification_url: body.verification_url || '',
      api_endpoint: body.api_endpoint || '',
      api_key_required: body.api_key_required ?? false,
      email_contact: body.email_contact || '',
      phone: body.phone || '',
      whatsapp: body.whatsapp || '',
      contact_form_url: body.contact_form_url || '',
      languages: (body.languages || []).join(', '),
      certification_types: body.certification_types || ['organic'],
      trust_level: body.trust_level || 'verified',
      internal_notes: body.internal_notes || '',
      is_active: body.is_active ?? true
    });
    setIsEditBodyModalOpen(true);
  };

  const handleUpdateBody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editFormData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: editFormData.name.trim(),
        acronym: editFormData.acronym.trim() || null,
        country: editFormData.country.trim(),
        region: editFormData.region,
        sub_region: editFormData.sub_region.trim() || null,
        website: editFormData.website.trim() || null,
        verification_url: editFormData.verification_url.trim() || null,
        api_endpoint: editFormData.api_endpoint.trim() || null,
        api_key_required: editFormData.api_key_required,
        email_contact: editFormData.email_contact.trim() || null,
        phone: editFormData.phone.trim() || null,
        whatsapp: editFormData.whatsapp.trim() || null,
        contact_form_url: editFormData.contact_form_url.trim() || null,
        languages: editFormData.languages.split(',').map(l => l.trim()).filter(Boolean),
        certification_types: editFormData.certification_types,
        trust_level: editFormData.trust_level,
        internal_notes: editFormData.internal_notes.trim() || null,
        is_active: editFormData.is_active
      };

      const res = await updateCertificationBody(id, payload);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage('Fiche de l’organisme mise à jour');
        setIsEditBodyModalOpen(false);
        loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur mise à jour';
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleAddStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newStandardData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await addCertificationStandard({
        certification_body_id: id,
        name: newStandardData.name.trim(),
        code: newStandardData.code.trim() || null,
        type: newStandardData.type,
        scope: newStandardData.scope.trim() || null,
        description: newStandardData.description.trim() || null,
        geographic_coverage: newStandardData.geographic_coverage.trim() || null
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage(`Standard "${newStandardData.name}" ajouté avec succès`);
        setIsAddStandardModalOpen(false);
        setNewStandardData({
          name: '',
          code: '',
          type: 'organic',
          scope: '',
          description: '',
          geographic_coverage: ''
        });
        loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur ajout standard';
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleDeleteStandard = async (standardId: string, name: string) => {
    if (!window.confirm(`Confirmez-vous la suppression du standard "${name}" ?`)) return;
    try {
      const res = await deleteCertificationStandard(standardId);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage(`Standard "${name}" supprimé`);
        loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression standard';
      setError(msg);
    } finally {
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newContactData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await addCertificationBodyContact({
        certification_body_id: id,
        name: newContactData.name.trim(),
        role: newContactData.role.trim() || null,
        email: newContactData.email.trim() || null,
        phone: newContactData.phone.trim() || null,
        language: newContactData.language.trim() || null,
        is_primary: newContactData.is_primary,
        notes: newContactData.notes.trim() || null
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage(`Contact "${newContactData.name}" ajouté`);
        setIsAddContactModalOpen(false);
        setNewContactData({
          name: '',
          role: '',
          email: '',
          phone: '',
          language: 'fr',
          is_primary: false,
          notes: ''
        });
        loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur ajout contact';
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleDeleteContact = async (contactId: string, name: string) => {
    if (!window.confirm(`Supprimer le contact "${name}" ?`)) return;
    try {
      const res = await deleteCertificationBodyContact(contactId);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage(`Contact "${name}" supprimé`);
        loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression contact';
      setError(msg);
    } finally {
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-xl w-1/3" />
        <div className="h-64 bg-white rounded-2xl border border-gray-100 p-6" />
      </div>
    );
  }

  if (!body && !isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Organisme introuvable</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Cet organisme n'existe pas ou a été supprimé du répertoire mondial.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/certifications/bodies')}
          className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
        >
          Retour à l'annuaire des organismes
        </button>
      </div>
    );
  }

  const standards = body?.standards || [];
  const contacts = body?.contacts || [];

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton retour et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/certifications/bodies')}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
            title="Retour à l'annuaire"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">{body?.name}</h1>
              {body?.acronym && (
                <span className="px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-800 font-mono font-bold text-xs">
                  {body.acronym}
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  body?.trust_level === 'verified'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : body?.trust_level === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {body?.trust_level === 'verified'
                  ? 'Organisme Officiel Vérifié'
                  : body?.trust_level === 'pending'
                  ? 'En cours de validation'
                  : 'Non vérifié'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {body?.country} • Région <strong>{body?.region}</strong> {body?.sub_region && `(${body.sub_region})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Edit2 className="w-4 h-4" />
            <span>Modifier la fiche</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Navigation Onglets */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Vue d'ensemble & Canaux</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('standards')}
          className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'standards'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Standards & Labels ({standards.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'contacts'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Interlocuteurs ({contacts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('certifications')}
          className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'certifications'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Certificats Producteurs ({producerCerts.length})</span>
        </button>
      </div>

      {/* CONTENU ONGLET 1 : VUE D'ENSEMBLE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Canaux de contact & vérification */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Canaux de vérification configurés
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* API Directe */}
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-600" />
                      API de vérification
                    </span>
                    <ChannelBadge channel="api" size="sm" />
                  </div>
                  {body?.api_endpoint ? (
                    <p className="font-mono text-[11px] text-gray-800 break-all bg-white p-2 rounded-lg border border-gray-200">
                      {body.api_endpoint}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic text-[11px]">Non configurée</p>
                  )}
                </div>

                {/* Email Direct */}
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Email officiel
                    </span>
                    <ChannelBadge channel="email" size="sm" />
                  </div>
                  {body?.email_contact ? (
                    <a
                      href={`mailto:${body.email_contact}`}
                      className="block font-bold text-blue-600 hover:underline break-all bg-white p-2 rounded-lg border border-gray-200"
                    >
                      {body.email_contact}
                    </a>
                  ) : (
                    <p className="text-gray-400 italic text-[11px]">Non configuré</p>
                  )}
                </div>

                {/* Portail Web */}
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      Portail en ligne
                    </span>
                    <ChannelBadge channel="form" size="sm" />
                  </div>
                  {body?.verification_url || body?.website ? (
                    <a
                      href={body.verification_url || body.website || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between font-bold text-emerald-700 hover:underline bg-white p-2 rounded-lg border border-gray-200"
                    >
                      <span className="truncate">{body.verification_url || body.website}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                  ) : (
                    <p className="text-gray-400 italic text-[11px]">Non configuré</p>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      WhatsApp Direct
                    </span>
                    <ChannelBadge channel="whatsapp" size="sm" />
                  </div>
                  {body?.whatsapp ? (
                    <p className="font-bold text-green-700 bg-white p-2 rounded-lg border border-gray-200">
                      {body.whatsapp}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic text-[11px]">Non configuré</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes internes et consignes */}
            {body?.internal_notes && (
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
                <h3 className="font-bold text-gray-900 text-sm">Consignes & Notes d'audit</h3>
                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {body.internal_notes}
                </p>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
                Métadonnées & Couverture
              </h3>

              <div className="space-y-2">
                <p className="text-gray-500">
                  Langues acceptées :{' '}
                  <strong className="text-gray-800">{(body?.languages || []).join(', ').toUpperCase()}</strong>
                </p>
                <p className="text-gray-500">
                  Standards actifs : <strong className="text-gray-800">{standards.length}</strong>
                </p>
                <p className="text-gray-500">
                  Certificats producteurs liés :{' '}
                  <strong className="text-gray-800">{producerCerts.length}</strong>
                </p>
                <p className="text-gray-500">
                  Dernière mise à jour :{' '}
                  <strong className="text-gray-800">
                    {body?.last_updated_at ? new Date(body.last_updated_at).toLocaleDateString('fr-FR') : '—'}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 2 : STANDARDS */}
      {activeTab === 'standards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Référentiel des standards accrédités</h2>
              <p className="text-xs text-gray-500">
                Normes, certifications et cahiers des charges certifiés par {body?.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddStandardModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un standard</span>
            </button>
          </div>

          {standards.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 space-y-2">
              <Award className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500 font-medium">Aucun standard enregistré pour cet organisme.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {standards.map(std => (
                <div
                  key={std.id}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-gray-900">{std.name}</h4>
                      {std.code && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[11px] font-mono font-bold rounded-md">
                          {std.code}
                        </span>
                      )}
                    </div>
                    {std.scope && <p className="text-xs text-gray-600 font-medium">{std.scope}</p>}
                    {std.geographic_coverage && (
                      <p className="text-[11px] text-gray-400">Couverture : {std.geographic_coverage}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Type : {std.type || 'Standard'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteStandard(std.id, std.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET 3 : INTERLOCUTEURS */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Interlocuteurs & Contacts Référents</h2>
              <p className="text-xs text-gray-500">
                Personnes de contact, auditeurs et chargés de conformité auprès de l'organisme
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddContactModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un contact</span>
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 space-y-2">
              <UserCheck className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500 font-medium">Aucun contact nominatif enregistré.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {contacts.map(c => (
                <div
                  key={c.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-gray-900">{c.name}</h4>
                      {c.is_primary && (
                        <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    {c.role && <p className="text-gray-500 font-medium">{c.role}</p>}
                    {c.email && (
                      <p className="text-blue-600 font-semibold truncate">
                        <a href={`mailto:${c.email}`} className="hover:underline">
                          {c.email}
                        </a>
                      </p>
                    )}
                    {c.phone && <p className="text-gray-700">{c.phone}</p>}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Langue : {c.language?.toUpperCase() || 'FR'}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteContact(c.id, c.name)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET 4 : CERTIFICATIONS PRODUCTEURS */}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              Certificats producteurs rattachés ({producerCerts.length})
            </h2>
          </div>

          {producerCerts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 space-y-2">
              <FileCheck className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500 font-medium">
                Aucun producteur n'a encore soumis de certificat délivré par cet organisme.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Producteur</th>
                      <th className="py-3 px-4">N° Certificat</th>
                      <th className="py-3 px-4">Standard</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4">Expiration</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {producerCerts.map(cert => (
                      <tr key={cert.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {cert.producer?.name || 'Inconnu'}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-gray-800">
                          {cert.certificate_number || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {cert.certification_standard?.name || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <CertificationStatusBadge status={cert.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {cert.expires_at ? new Date(cert.expires_at).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/admin/certifications/producers/${cert.id}`}
                            className="text-xs font-bold text-brand-600 hover:text-brand-700"
                          >
                            Examiner
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL AJOUT STANDARD */}
      {isAddStandardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Ajouter un standard de certification</h3>
            <form onSubmit={handleAddStandard} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Nom du standard / Label *</label>
                <input
                  type="text"
                  required
                  value={newStandardData.name}
                  onChange={e => setNewStandardData({ ...newStandardData, name: e.target.value })}
                  placeholder="Ex: Agriculture Biologique Européenne (CE 834/2007)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Code / Référence</label>
                <input
                  type="text"
                  value={newStandardData.code}
                  onChange={e => setNewStandardData({ ...newStandardData, code: e.target.value })}
                  placeholder="Ex: AB, EU-BIO, FLO-ID..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Périmètre / Portée</label>
                <input
                  type="text"
                  value={newStandardData.scope}
                  onChange={e => setNewStandardData({ ...newStandardData, scope: e.target.value })}
                  placeholder="Ex: Cultures agricoles brutes, café, miel..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddStandardModalOpen(false)}
                  className="px-3 py-1.5 text-gray-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl"
                >
                  {isSubmitting ? 'Ajout...' : 'Ajouter le standard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJOUT CONTACT */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Ajouter un interlocuteur référent</h3>
            <form onSubmit={handleAddContact} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Nom & Prénom *</label>
                <input
                  type="text"
                  required
                  value={newContactData.name}
                  onChange={e => setNewContactData({ ...newContactData, name: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Fonction / Rôle</label>
                <input
                  type="text"
                  value={newContactData.role}
                  onChange={e => setNewContactData({ ...newContactData, role: e.target.value })}
                  placeholder="Ex: Responsable des accréditations export"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Email</label>
                <input
                  type="email"
                  value={newContactData.email}
                  onChange={e => setNewContactData({ ...newContactData, email: e.target.value })}
                  placeholder="contact@organisme.org"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Téléphone</label>
                <input
                  type="text"
                  value={newContactData.phone}
                  onChange={e => setNewContactData({ ...newContactData, phone: e.target.value })}
                  placeholder="+331..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-3 py-1.5 text-gray-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl"
                >
                  {isSubmitting ? 'Ajout...' : 'Enregistrer le contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÉDITION ORGANISME */}
      {isEditBodyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Modifier l'organisme certificateur</h3>
              <button
                type="button"
                onClick={() => setIsEditBodyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateBody} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-gray-700">Nom officiel de l'organisme *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Sigle / Acronyme</label>
                  <input
                    type="text"
                    value={editFormData.acronym}
                    onChange={e => setEditFormData({ ...editFormData, acronym: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Pays *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.country}
                    onChange={e => setEditFormData({ ...editFormData, country: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Région continentale</label>
                  <select
                    value={editFormData.region}
                    onChange={e => setEditFormData({ ...editFormData, region: e.target.value as CertificationRegion })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  >
                    {CERTIFICATION_REGIONS.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Niveau de confiance</label>
                  <select
                    value={editFormData.trust_level}
                    onChange={e => setEditFormData({ ...editFormData, trust_level: e.target.value as TrustLevel })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  >
                    {TRUST_LEVELS.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.labelFr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Email officiel de vérification</label>
                  <input
                    type="email"
                    value={editFormData.email_contact}
                    onChange={e => setEditFormData({ ...editFormData, email_contact: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Numéro WhatsApp</label>
                  <input
                    type="text"
                    value={editFormData.whatsapp}
                    onChange={e => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">URL du portail de vérification en ligne</label>
                <input
                  type="url"
                  value={editFormData.verification_url}
                  onChange={e => setEditFormData({ ...editFormData, verification_url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Endpoint API de vérification directe</label>
                <input
                  type="url"
                  value={editFormData.api_endpoint}
                  onChange={e => setEditFormData({ ...editFormData, api_endpoint: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Types de certifications couvertes</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {CERTIFICATION_TYPES.map(t => (
                    <label key={t} className="inline-flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormData.certification_types.includes(t)}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...editFormData.certification_types, t]
                            : editFormData.certification_types.filter(item => item !== t);
                          setEditFormData({ ...editFormData, certification_types: next });
                        }}
                        className="rounded text-brand-600"
                      />
                      <span className="capitalize">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Notes internes & consignes d'audit</label>
                <textarea
                  rows={3}
                  value={editFormData.internal_notes}
                  onChange={e => setEditFormData({ ...editFormData, internal_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditBodyModalOpen(false)}
                  className="px-3 py-1.5 text-gray-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Sauvegarder les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

