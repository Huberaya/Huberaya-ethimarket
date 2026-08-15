import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  Mail,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Globe2,
  FileSpreadsheet,
  MessageSquare,
  Phone,
  MapPin,
  Map as MapIcon,
  LayoutGrid,
  Filter,
  Send,
  AlertTriangle
} from 'lucide-react';
import ChannelBadge from '../../components/admin/ChannelBadge';
import UniversalContactModal from '../../components/admin/UniversalContactModal';
import ReportProblemModal from '../../components/admin/ReportProblemModal';
import CertBodiesImportExportModal from '../../components/admin/CertBodiesImportExportModal';
import {
  getCertificationBodies,
  createCertificationBody,
  updateCertificationBody,
  deleteCertificationBody
} from '../../lib/certificationBodiesService';
import type {
  CertificationBody,
  CertificationBodyInsert,
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

  // Vue Active : Grille Cartes ou Carte Interactive
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filtres
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<CertificationRegion | 'ALL'>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedTrustLevel, setSelectedTrustLevel] = useState<TrustLevel | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<CertificationType | 'ALL'>('ALL');

  // Filtres booléens canaux
  const [filterHasEmail, setFilterHasEmail] = useState<boolean>(false);
  const [filterHasWhatsapp, setFilterHasWhatsapp] = useState<boolean>(false);
  const [filterHasPhone, setFilterHasPhone] = useState<boolean>(false);
  const [filterHasForm, setFilterHasForm] = useState<boolean>(false);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingBody, setEditingBody] = useState<CertificationBody | null>(null);
  const [deletingBodyId, setDeletingBodyId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modale Contact Universel
  const [contactTargetBody, setContactTargetBody] = useState<CertificationBody | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);

  // Modale Signalement
  const [reportTargetBody, setReportTargetBody] = useState<CertificationBody | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Modale Import/Export/Seed
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState<boolean>(false);

  // État du Formulaire (Création / Édition)
  const [formData, setFormData] = useState<{
    name: string;
    acronym: string;
    country: string;
    region: CertificationRegion;
    sub_region: string;
    city: string;
    address: string;
    postal_code: string;
    latitude: string;
    longitude: string;
    foundation_year: string;
    employee_count: string;
    website: string;
    verification_url: string;
    email_contact: string;
    phone: string;
    whatsapp: string;
    contact_form_url: string;
    languages: string;
    certification_types: CertificationType[];
    accreditations: string;
    domains: string;
    trust_level: TrustLevel;
    reliability_score: number;
    average_cost: string;
    average_duration: string;
    timezone: string;
    contact_hours: string;
    verification_sources: string;
    internal_notes: string;
  }>({
    name: '',
    acronym: '',
    country: 'France',
    region: 'Europe',
    sub_region: '',
    city: '',
    address: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    foundation_year: '',
    employee_count: '25-50',
    website: '',
    verification_url: '',
    email_contact: '',
    phone: '',
    whatsapp: '',
    contact_form_url: '',
    languages: 'Français, English',
    certification_types: ['organic'],
    accreditations: 'IFOAM, ISO/IEC 17065',
    domains: 'Agriculture Biologique, Commerce Équitable',
    trust_level: 'verified',
    reliability_score: 95,
    average_cost: '',
    average_duration: '',
    timezone: 'UTC+1',
    contact_hours: 'Lun-Ven: 09:00 - 18:00',
    verification_sources: 'Annuaire Officiel',
    internal_notes: ''
  });

  // Chargement des organismes
  const loadBodies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCertificationBodies({
        search: searchTerm,
        region: selectedRegion,
        country: selectedCountry !== 'ALL' ? selectedCountry : undefined,
        trust_level: selectedTrustLevel,
        certification_type: selectedType !== 'ALL' ? selectedType : undefined,
        has_email: filterHasEmail ? true : undefined,
        has_whatsapp: filterHasWhatsapp ? true : undefined,
        has_phone: filterHasPhone ? true : undefined,
        has_form: filterHasForm ? true : undefined
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
  }, [
    searchTerm,
    selectedRegion,
    selectedCountry,
    selectedTrustLevel,
    selectedType,
    filterHasEmail,
    filterHasWhatsapp,
    filterHasPhone,
    filterHasForm
  ]);

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
      city: '',
      address: '',
      postal_code: '',
      latitude: '',
      longitude: '',
      foundation_year: '',
      employee_count: '25-50',
      website: '',
      verification_url: '',
      email_contact: '',
      phone: '',
      whatsapp: '',
      contact_form_url: '',
      languages: 'Français, English',
      certification_types: ['organic'],
      accreditations: 'IFOAM, ISO/IEC 17065',
      domains: 'Agriculture Biologique, Commerce Équitable',
      trust_level: 'verified',
      reliability_score: 95,
      average_cost: '',
      average_duration: '',
      timezone: 'UTC+1',
      contact_hours: 'Lun-Ven: 09:00 - 18:00',
      verification_sources: 'Annuaire Officiel',
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
      city: body.city || '',
      address: body.address || '',
      postal_code: body.postal_code || '',
      latitude: body.latitude !== undefined && body.latitude !== null ? String(body.latitude) : '',
      longitude: body.longitude !== undefined && body.longitude !== null ? String(body.longitude) : '',
      foundation_year: body.foundation_year ? String(body.foundation_year) : '',
      employee_count: body.employee_count || '25-50',
      website: body.website || '',
      verification_url: body.verification_url || '',
      email_contact: body.email_contact || '',
      phone: body.phone || '',
      whatsapp: body.whatsapp || '',
      contact_form_url: body.contact_form_url || '',
      languages: (body.languages || []).join(', '),
      certification_types: body.certification_types || ['organic'],
      accreditations: (body.accreditations || []).join(', '),
      domains: (body.domains || []).join(', '),
      trust_level: body.trust_level || 'verified',
      reliability_score: body.reliability_score || 95,
      average_cost: body.average_cost || '',
      average_duration: body.average_duration || '',
      timezone: body.timezone || '',
      contact_hours: body.contact_hours || '',
      verification_sources: (body.verification_sources || []).join(', '),
      internal_notes: body.internal_notes || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.country.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<CertificationBody> = {
        name: formData.name.trim(),
        acronym: formData.acronym.trim() || undefined,
        country: formData.country.trim(),
        region: formData.region,
        sub_region: formData.sub_region.trim() || undefined,
        city: formData.city.trim() || undefined,
        address: formData.address.trim() || undefined,
        postal_code: formData.postal_code.trim() || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        foundation_year: formData.foundation_year ? parseInt(formData.foundation_year, 10) : undefined,
        employee_count: formData.employee_count.trim() || undefined,
        website: formData.website.trim() || undefined,
        verification_url: formData.verification_url.trim() || undefined,
        email_contact: formData.email_contact.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        whatsapp: formData.whatsapp.trim() || undefined,
        contact_form_url: formData.contact_form_url.trim() || undefined,
        languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
        certification_types: formData.certification_types,
        accreditations: formData.accreditations.split(',').map(l => l.trim()).filter(Boolean),
        domains: formData.domains.split(',').map(l => l.trim()).filter(Boolean),
        trust_level: formData.trust_level,
        reliability_score: Number(formData.reliability_score) || 95,
        average_cost: formData.average_cost.trim() || undefined,
        average_duration: formData.average_duration.trim() || undefined,
        timezone: formData.timezone.trim() || undefined,
        contact_hours: formData.contact_hours.trim() || undefined,
        verification_sources: formData.verification_sources.split(',').map(l => l.trim()).filter(Boolean),
        internal_notes: formData.internal_notes.trim() || undefined,
        is_active: true
      };

      if (editingBody && editingBody.id) {
        const res = await updateCertificationBody(editingBody.id, payload);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage(`Organisme "${payload.name}" mis à jour avec succès.`);
          setIsCreateModalOpen(false);
          resetForm();
          loadBodies();
        }
      } else {
        const res = await createCertificationBody(payload as CertificationBodyInsert);
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
    if (!window.confirm(`Confirmez-vous la suppression définitive de l organisme "${name}" ?`)) return;
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

  // Liste des pays uniques pour le filtre
  const availableCountries = Array.from(new Set(bodies.map(b => b.country).filter(Boolean))).sort();

  // Statistiques
  const statsTotal = bodies.length;
  const statsWithEmail = bodies.filter(b => b.email_contact).length;
  const statsWithWa = bodies.filter(b => b.whatsapp).length;
  const statsWithPortal = bodies.filter(b => b.verification_url || b.contact_form_url).length;
  const statsVerified = bodies.filter(b => b.trust_level === 'verified').length;

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-400/30">
              <Globe2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Annuaire Mondial des Organismes Certificateurs
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-0.5">
                Tiers de confiance accrédités IFOAM, IAF, FSC & Fairtrade — Coordonnées manuelles et directes
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsImportExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-md transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Données & Base Mondiale</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un organisme</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Référencés</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{statsTotal}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Contact Email</p>
            <Mail className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-1">{statsWithEmail}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">WhatsApp Pro</p>
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{statsWithWa}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Portail Public</p>
            <Globe2 className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-teal-600 mt-1">{statsWithPortal}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Fiabilité Vérifiée</p>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{statsVerified}</p>
        </div>
      </div>

      {/* Barre de Recherche, Filtres & Vues */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Recherche textuelle */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, sigle, pays, ville, accréditation..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
            />
          </div>

          {/* Sélecteurs de filtres */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtre Région */}
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value as CertificationRegion | 'ALL')}
              className="py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
            >
              <option value="ALL">Toutes les régions</option>
              {CERTIFICATION_REGIONS.map(reg => (
                <option key={reg.value} value={reg.value}>
                  {reg.labelFr}
                </option>
              ))}
            </select>

            {/* Filtre Pays */}
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              className="py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium max-w-[150px]"
            >
              <option value="ALL">Tous les pays</option>
              {availableCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Filtre Label/Type */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as CertificationType | 'ALL')}
              className="py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
            >
              <option value="ALL">Tous les labels</option>
              {CERTIFICATION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.labelFr}</option>
              ))}
            </select>

            {/* Bascule Vue Grille / Carte */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vue Grille de Cartes"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grille</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'map'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vue Carte Géographique"
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Carte</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtres de canaux rapides */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Canaux disponibles :
          </span>

          <button
            type="button"
            onClick={() => setFilterHasEmail(!filterHasEmail)}
            className={`px-3 py-1.5 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
              filterHasEmail
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Email ({bodies.filter(b => b.email_contact).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterHasWhatsapp(!filterHasWhatsapp)}
            className={`px-3 py-1.5 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
              filterHasWhatsapp
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp ({bodies.filter(b => b.whatsapp).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterHasForm(!filterHasForm)}
            className={`px-3 py-1.5 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
              filterHasForm
                ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Portail / Formulaire ({bodies.filter(b => b.verification_url || b.contact_form_url).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterHasPhone(!filterHasPhone)}
            className={`px-3 py-1.5 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
              filterHasPhone
                ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-amber-600" />
            <span>Téléphone Direct ({bodies.filter(b => b.phone).length})</span>
          </button>
        </div>
      </div>

      {/* VUE 1 : GRILLE DES ORGANISMES */}
      {viewMode === 'grid' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse p-6" />
              ))}
            </div>
          ) : bodies.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 space-y-4 shadow-xs">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Aucun organisme certificateur trouvé</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Aucun organisme ne correspond à vos filtres actuels. Vous pouvez réinitialiser vos critères ou charger la base de référence mondiale.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRegion('ALL');
                  setSelectedCountry('ALL');
                  setSelectedTrustLevel('ALL');
                  setSelectedType('ALL');
                  setFilterHasEmail(false);
                  setFilterHasWhatsapp(false);
                  setFilterHasPhone(false);
                  setFilterHasForm(false);
                }}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bodies.map(body => {
                const hasEmail = Boolean(body.email_contact);
                const hasWa = Boolean(body.whatsapp);
                const hasPhone = Boolean(body.phone);
                const hasUrl = Boolean(body.verification_url || body.contact_form_url);
                const hasPostal = Boolean(body.address || body.city || body.country);

                return (
                  <div
                    key={body.id}
                    className="bg-white rounded-3xl border border-slate-100 hover:border-emerald-200 hover:shadow-lg transition-all p-6 flex flex-col justify-between space-y-4 group relative"
                  >
                    <div className="space-y-3.5">
                      {/* En-tête de carte */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                              {body.name}
                            </h3>
                            {body.acronym && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200">
                                {body.acronym}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{body.city ? `${body.city}, ` : ''}<strong>{body.country}</strong></span>
                            <span>•</span>
                            <span className="text-slate-600">{body.region}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            body.trust_level === 'verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : body.trust_level === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {body.trust_level === 'verified' ? '✓ Vérifié' : 'En attente'}
                        </span>
                      </div>

                      {/* Badges de canaux actifs */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Canaux de contact directs
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {hasEmail && <ChannelBadge channel="email" size="sm" />}
                          {hasWa && <ChannelBadge channel="whatsapp" size="sm" />}
                          {hasUrl && <ChannelBadge channel="form" size="sm" />}
                          {hasPhone && <ChannelBadge channel="phone" size="sm" />}
                          {hasPostal && <ChannelBadge channel="postal" size="sm" />}
                        </div>
                      </div>

                      {/* Accréditations ISO / IFOAM */}
                      {body.accreditations && body.accreditations.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                            Accréditations reconnues
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {body.accreditations.slice(0, 3).map((acc, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] text-slate-700 font-semibold"
                              >
                                {acc}
                              </span>
                            ))}
                            {body.accreditations.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium self-center">
                                +{body.accreditations.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Domaines d'expertise */}
                      {body.domains && body.domains.length > 0 && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          <strong>Filières :</strong> {body.domains.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Actions de la carte */}
                    <div className="pt-3.5 border-t border-slate-100 space-y-2.5">
                      {/* Bouton Contact Universel en 1 clic */}
                      <button
                        type="button"
                        onClick={() => {
                          setContactTargetBody(body);
                          setIsContactModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Contacter en 1 clic</span>
                      </button>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <Link
                          to={`/admin/certifications/bodies/${body.id}`}
                          className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-emerald-700"
                        >
                          <span>Fiche détaillée</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setReportTargetBody(body);
                              setIsReportModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Signaler une anomalie"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(body)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingBodyId === body.id}
                            onClick={() => handleDelete(body.id, body.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VUE 2 : CARTE GÉOGRAPHIQUE MONDIALE */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-emerald-600" />
              Répartition Géographique Mondiale ({bodies.length} organismes)
            </h3>
            <span className="text-xs text-slate-500">
              Coordonnées GPS et adresses des sièges
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bodies.filter(b => b.latitude && b.longitude).map(body => (
              <div
                key={body.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-emerald-300 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-xs text-slate-900">{body.name}</div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {body.country}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  GPS : {body.latitude?.toFixed(4)}, {body.longitude?.toFixed(4)}
                </div>
                <div className="text-xs text-slate-600 line-clamp-1">
                  {body.address || body.city}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContactTargetBody(body);
                    setIsContactModalOpen(true);
                  }}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Contacter</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALE 1 : CONTACT UNIVERSEL (EMAIL, WHATSAPP, PORTAIL, TÉLÉPHONE, POSTAL) */}
      <UniversalContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        body={contactTargetBody}
      />

      {/* MODALE 2 : SIGNALEMENT ANOMALIE */}
      <ReportProblemModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        body={reportTargetBody}
        onReported={loadBodies}
      />

      {/* MODALE 3 : GESTION DES DONNÉES / IMPORT / EXPORT / SEED MONDIAL */}
      <CertBodiesImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        currentBodies={bodies}
        onDataChanged={loadBodies}
      />

      {/* MODALE 4 : CRÉATION / ÉDITION D'ORGANISME */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  {editingBody ? 'Modifier l organisme certificateur' : 'Ajouter un organisme certificateur'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5 text-xs">
              {/* Informations Générales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Nom officiel de l organisme *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Ecocert, USDA Organic, IBD Certificações..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Sigle / Acronyme</label>
                  <input
                    type="text"
                    value={formData.acronym}
                    onChange={e => setFormData({ ...formData, acronym: e.target.value })}
                    placeholder="Ex: ECOCERT, FLO, AB..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Niveau de confiance</label>
                  <select
                    value={formData.trust_level}
                    onChange={e => setFormData({ ...formData, trust_level: e.target.value as TrustLevel })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  >
                    {TRUST_LEVELS.map(tl => (
                      <option key={tl.value} value={tl.value}>
                        {tl.labelFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Région *</label>
                  <select
                    value={formData.region}
                    onChange={e => setFormData({ ...formData, region: e.target.value as CertificationRegion })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  >
                    {CERTIFICATION_REGIONS.map(reg => (
                      <option key={reg.value} value={reg.value}>
                        {reg.labelFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Pays du siège *</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Ex: Sénégal, Inde, Pérou, France..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ville du siège</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex: Dakar, Jaipur, Lima, Paris..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Adresse postale complète</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Route des Almadies, Immeuble Horizon..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Coordonnées GPS (Latitude, Longitude)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.latitude}
                      onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="Lat: 14.7408"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono text-xs"
                    />
                    <input
                      type="text"
                      value={formData.longitude}
                      onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="Lng: -17.5186"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Canaux de contact directs (SANS API) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Canaux de contact directs & permanences</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Email direct vérification</label>
                    <input
                      type="email"
                      value={formData.email_contact}
                      onChange={e => setFormData({ ...formData, email_contact: e.target.value })}
                      placeholder="verification@organisme.org"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Numéro WhatsApp Pro</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+221 77 123 45 67"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Ligne Téléphonique directe</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+221 33 820 45 67"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Portail web / Registre public (URL)</label>
                    <input
                      type="url"
                      value={formData.verification_url}
                      onChange={e => setFormData({ ...formData, verification_url: e.target.value })}
                      placeholder="https://directory.ecocert.com"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Site Web officiel</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.organisme.org"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Accréditations & Domaines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Accréditations reconnues (séparées par virgule)</label>
                  <input
                    type="text"
                    value={formData.accreditations}
                    onChange={e => setFormData({ ...formData, accreditations: e.target.value })}
                    placeholder="Ex: IFOAM, ISO/IEC 17065, COFRAC, USDA NOP..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Domaines / Filières (séparés par virgule)</label>
                  <input
                    type="text"
                    value={formData.domains}
                    onChange={e => setFormData({ ...formData, domains: e.target.value })}
                    placeholder="Ex: Café & Thé Bio, Cacao Équitable, Vins Biodynamiques..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              {/* Types de certifications */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="font-bold text-slate-700">Types de certifications couvertes :</label>
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
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
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
                <label className="font-bold text-slate-700">Notes internes d audit & consignes</label>
                <textarea
                  rows={2}
                  value={formData.internal_notes}
                  onChange={e => setFormData({ ...formData, internal_notes: e.target.value })}
                  placeholder="Délai moyen de réponse constaté, contacts privilégiés..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting
                    ? 'Enregistrement...'
                    : editingBody
                    ? 'Mettre à jour'
                    : 'Créer l organisme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
