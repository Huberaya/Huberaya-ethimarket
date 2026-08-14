import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  Mail,
  ExternalLink,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import ChannelBadge from '../../components/admin/ChannelBadge';
import {
  getCertificationBodies,
  createCertificationBody,
  updateCertificationBody,
  deleteCertificationBody
} from '../../lib/certificationVerificationService';
import type {
  CertificationBody,
  CertificationRegion,
  CertificationType,
  TrustLevel
} from '../../lib/supabase';
import {
  CERTIFICATION_REGIONS,
  CERTIFICATION_TYPES,
  TRUST_LEVELS
} from '../../lib/supabase';

export default function AdminCertBodiesDirectory() {
  const [bodies, setBodies] = useState<CertificationBody[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<CertificationRegion | 'ALL'>('ALL');
  const [selectedTrustLevel, setSelectedTrustLevel] = useState<TrustLevel | 'ALL'>('ALL');
  const [filterHasApi, setFilterHasApi] = useState<boolean>(false);
  const [filterHasEmail, setFilterHasEmail] = useState<boolean>(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingBody, setEditingBody] = useState<CertificationBody | null>(null);
  const [deletingBodyId, setDeletingBodyId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    acronym: string;
    country: string;
    region: CertificationRegion;
    sub_region: string;
    website: string;
    verification_url: string;
    api_endpoint: string;
    api_key_required: boolean;
    email_contact: string;
    phone: string;
    whatsapp: string;
    contact_form_url: string;
    languages: string;
    certification_types: CertificationType[];
    trust_level: TrustLevel;
    internal_notes: string;
  }>({
    name: '',
    acronym: '',
    country: 'France',
    region: 'Europe',
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
    certification_types: ['organic'],
    trust_level: 'verified',
    internal_notes: ''
  });

  const loadBodies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCertificationBodies({
        search: searchTerm,
        region: selectedRegion,
        trust_level: selectedTrustLevel,
        has_api: filterHasApi ? true : undefined,
        has_email: filterHasEmail ? true : undefined
      });

      if (res.error) {
        setError(res.error);
      } else {
        setBodies(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedRegion, selectedTrustLevel, filterHasApi, filterHasEmail]);

  useEffect(() => {
    loadBodies();
  }, [loadBodies]);

  const resetForm = () => {
    setFormData({
      name: '',
      acronym: '',
      country: 'France',
      region: 'Europe',
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
      certification_types: ['organic'],
      trust_level: 'verified',
      internal_notes: ''
    });
    setEditingBody(null);
  };

  const handleOpenEdit = (body: CertificationBody) => {
    setEditingBody(body);
    setFormData({
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
      internal_notes: body.internal_notes || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        acronym: formData.acronym.trim() || null,
        country: formData.country.trim(),
        region: formData.region,
        sub_region: formData.sub_region.trim() || null,
        website: formData.website.trim() || null,
        verification_url: formData.verification_url.trim() || null,
        api_endpoint: formData.api_endpoint.trim() || null,
        api_key_required: formData.api_key_required,
        email_contact: formData.email_contact.trim() || null,
        phone: formData.phone.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
        contact_form_url: formData.contact_form_url.trim() || null,
        languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
        certification_types: formData.certification_types,
        trust_level: formData.trust_level,
        internal_notes: formData.internal_notes.trim() || null
      };

      if (editingBody) {
        const res = await updateCertificationBody(editingBody.id, payload);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage(`Organisme "${payload.name}" mis à jour.`);
          setIsCreateModalOpen(false);
          resetForm();
          loadBodies();
        }
      } else {
        const res = await createCertificationBody(payload);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage(`Nouvel organisme "${payload.name}" ajouté avec succès.`);
          setIsCreateModalOpen(false);
          resetForm();
          loadBodies();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l enregistrement';
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Confirmez-vous la suppression de l'organisme "${name}" ?`)) return;
    setDeletingBodyId(id);
    try {
      const res = await deleteCertificationBody(id);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage(`Organisme "${name}" supprimé.`);
        loadBodies();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(msg);
    } finally {
      setDeletingBodyId(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleTypeToggle = (type: CertificationType) => {
    setFormData(prev => {
      const exists = prev.certification_types.includes(type);
      return {
        ...prev,
        certification_types: exists
          ? prev.certification_types.filter(t => t !== type)
          : [...prev.certification_types, type]
      };
    });
  };

  // Statistiques rapides
  const statsTotal = bodies.length;
  const statsWithApi = bodies.filter(b => b.api_endpoint).length;
  const statsWithEmail = bodies.filter(b => b.email_contact).length;
  const statsVerified = bodies.filter(b => b.trust_level === 'verified').length;

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-600" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              Annuaire Mondial des Organismes Certificateurs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Répertoire international des autorités et labels accrédités (Afrique, Europe, Amériques, Asie, etc.)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un organisme</span>
          </button>
        </div>
      </div>

      {/* Messages d'alerte / succès */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Cartes de statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Total Référencés</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{statsTotal}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">Canal API Direct</p>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-1">{statsWithApi}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">Contact Email</p>
            <Mail className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-1">{statsWithEmail}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">Niveau Vérifié</p>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{statsVerified}</p>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Recherche textuelle */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, sigle, pays..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
            />
          </div>

          {/* Filtre Région */}
          <div>
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value as CertificationRegion | 'ALL')}
              className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">Toutes les régions</option>
              {CERTIFICATION_REGIONS.map(reg => (
                <option key={reg.value} value={reg.value}>
                  {reg.labelFr}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Niveau de Confiance */}
          <div>
            <select
              value={selectedTrustLevel}
              onChange={e => setSelectedTrustLevel(e.target.value as TrustLevel | 'ALL')}
              className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">Tous les niveaux de confiance</option>
              {TRUST_LEVELS.map(tl => (
                <option key={tl.value} value={tl.value}>
                  {tl.labelFr}
                </option>
              ))}
            </select>
          </div>

          {/* Filtres d'automatisation rapides */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterHasApi(!filterHasApi)}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
                filterHasApi
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Avec API</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterHasEmail(!filterHasEmail)}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
                filterHasEmail
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grille des Organismes */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-56 bg-white rounded-2xl border border-gray-100 animate-pulse p-5" />
          ))}
        </div>
      ) : bodies.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 space-y-3">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">Aucun organisme trouvé</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Aucun organisme ne correspond à vos filtres. Essayez de réinitialiser vos critères ou ajoutez-en un nouveau.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bodies.map(body => {
            const hasApi = Boolean(body.api_endpoint);
            const hasEmail = Boolean(body.email_contact);
            const hasWa = Boolean(body.whatsapp);
            const hasPhone = Boolean(body.phone);
            const hasUrl = Boolean(body.verification_url || body.contact_form_url);

            return (
              <div
                key={body.id}
                className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Haut de carte */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{body.name}</h3>
                        {body.acronym && (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-mono font-bold">
                            {body.acronym}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {body.country} • <span className="font-medium text-gray-700">{body.region}</span>
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        body.trust_level === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : body.trust_level === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {body.trust_level === 'verified'
                        ? 'Vérifié'
                        : body.trust_level === 'pending'
                        ? 'En attente'
                        : 'Non vérifié'}
                    </span>
                  </div>

                  {/* Badges de canaux actifs */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      Canaux de vérification
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {hasApi && <ChannelBadge channel="api" size="sm" />}
                      {hasEmail && <ChannelBadge channel="email" size="sm" />}
                      {hasUrl && <ChannelBadge channel="form" size="sm" />}
                      {hasWa && <ChannelBadge channel="whatsapp" size="sm" />}
                      {hasPhone && <ChannelBadge channel="phone" size="sm" />}
                      {!hasApi && !hasEmail && !hasUrl && !hasWa && !hasPhone && (
                        <ChannelBadge channel="manual" size="sm" />
                      )}
                    </div>
                  </div>

                  {/* Types de certification couverts */}
                  {body.certification_types && body.certification_types.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {body.certification_types.map(t => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] text-gray-600 font-medium"
                        >
                          {t === 'organic'
                            ? 'Bio'
                            : t === 'fair_trade'
                            ? 'Équitable'
                            : t === 'ethical'
                            ? 'Éthique'
                            : t === 'sustainable'
                            ? 'Durable'
                            : t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Standards associés */}
                  {body.standards && body.standards.length > 0 && (
                    <p className="text-[11px] text-gray-500">
                      <strong>{body.standards.length} standard(s)</strong> rattaché(s)
                    </p>
                  )}
                </div>

                {/* Pied de carte avec actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/admin/certifications/bodies/${body.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    <span>Fiche complète</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(body)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingBodyId === body.id}
                      onClick={() => handleDelete(body.id, body.name)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CRÉATION / ÉDITION D'ORGANISME */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  {editingBody ? 'Modifier l’organisme certificateur' : 'Ajouter un organisme certificateur'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5 text-xs">
              {/* Informations Générales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-gray-700">Nom officiel de l’organisme *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Ecocert, USDA Organic, Fairtrade International..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Sigle / Acronyme</label>
                  <input
                    type="text"
                    value={formData.acronym}
                    onChange={e => setFormData({ ...formData, acronym: e.target.value })}
                    placeholder="Ex: ECOCERT, FLO, AB..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Niveau de confiance</label>
                  <select
                    value={formData.trust_level}
                    onChange={e => setFormData({ ...formData, trust_level: e.target.value as TrustLevel })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                  >
                    {TRUST_LEVELS.map(tl => (
                      <option key={tl.value} value={tl.value}>
                        {tl.labelFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Région *</label>
                  <select
                    value={formData.region}
                    onChange={e => setFormData({ ...formData, region: e.target.value as CertificationRegion })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                  >
                    {CERTIFICATION_REGIONS.map(reg => (
                      <option key={reg.value} value={reg.value}>
                        {reg.labelFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Pays du siège *</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Ex: France, Allemagne, Côte d'Ivoire..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              {/* Canaux de communication */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Canaux de vérification & Coordonnées</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Email de contact vérification</label>
                    <input
                      type="email"
                      value={formData.email_contact}
                      onChange={e => setFormData({ ...formData, email_contact: e.target.value })}
                      placeholder="verification@organisme.org"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Portail web de vérification (URL)</label>
                    <input
                      type="url"
                      value={formData.verification_url}
                      onChange={e => setFormData({ ...formData, verification_url: e.target.value })}
                      placeholder="https://verify.organisme.org"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Numéro WhatsApp direct</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+33612345678"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Téléphone direct</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+33123456789"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-gray-700">Endpoint API de vérification (si disponible)</label>
                    <input
                      type="url"
                      value={formData.api_endpoint}
                      onChange={e => setFormData({ ...formData, api_endpoint: e.target.value })}
                      placeholder="https://api.organisme.org/v1/verify"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Types de certifications */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <label className="font-bold text-gray-700">Types de certifications couvertes :</label>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATION_TYPES.map(type => {
                    const isSelected = formData.certification_types.includes(type.value);
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleTypeToggle(type.value)}
                        className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                          isSelected
                            ? 'bg-brand-50 border-brand-300 text-brand-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {type.labelFr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes internes */}
              <div className="space-y-1 pt-2">
                <label className="font-bold text-gray-700">Notes internes d'audit</label>
                <textarea
                  rows={2}
                  value={formData.internal_notes}
                  onChange={e => setFormData({ ...formData, internal_notes: e.target.value })}
                  placeholder="Délai moyen de réponse, consignes particulières pour cet organisme..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Enregistrement...'
                    : editingBody
                    ? 'Mettre à jour'
                    : 'Créer l’organisme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

