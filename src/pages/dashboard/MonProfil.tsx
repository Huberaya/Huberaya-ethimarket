import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Save, Loader2, CheckCircle, MapPin, Plus, Trash2,
  Building2, Sprout, Award, Truck, Heart, Image as ImageIcon, X,
  Navigation, Star, FileText, User, AlertCircle, ExternalLink,
  ShieldCheck, FileCheck, Clock,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { COUNTRIES, getCountryFlag, getCountryDialCode } from '../../lib/countries';
import {
  saveProducerFields,
  toIntOrNull,
  toFloatOrNull,
  toStringOrNull,
  sanitizeProducerPayload as baseSanitizeProducerPayload,
} from '../../lib/dbHelpers';
import { FileUpload } from '../../components/ui/FileUpload';
import { MultiFileUpload } from '../../components/ui/MultiFileUpload';

/* ─── Constants ─────────────────────────────────────────── */

const ORG_TYPES = [
  { value: 'producteur', label: 'Producteur individuel', icon: '👤' },
  { value: 'cooperative', label: 'Coopérative', icon: '🏘️' },
  { value: 'association', label: 'Association', icon: '🤝' },
  { value: 'entreprise', label: 'Entreprise agricole', icon: '🏢' },
  { value: 'artisan', label: 'Artisan transformateur', icon: '🎨' },
];

const PRODUCT_TYPES = [
  { label: 'Café (arabica, robusta)', icon: '☕' },
  { label: 'Cacao et chocolat', icon: '🍫' },
  { label: 'Thé (vert, noir, blanc)', icon: '🍵' },
  { label: 'Épices (safran, poivre, curcuma...)', icon: '🌶️' },
  { label: 'Vanille', icon: '🌸' },
  { label: 'Huiles végétales (argan, olive, coco)', icon: '🫒' },
  { label: 'Fruits secs et graines', icon: '🥜' },
  { label: 'Miel et sucres naturels', icon: '🍯' },
  { label: 'Céréales et légumineuses', icon: '🌾' },
  { label: 'Cosmétiques naturels', icon: '🧴' },
  { label: 'Textile éthique (coton bio)', icon: '🧵' },
  { label: 'Autre', icon: '➕' },
];

const FARMING_METHODS = [
  { label: 'Agriculture biologique', icon: '🌱' },
  { label: 'Permaculture', icon: '🌿' },
  { label: 'Biodynamie', icon: '🌾' },
  { label: 'Agroforesterie', icon: '🌳' },
  { label: 'Agriculture raisonnée', icon: '🚜' },
  { label: 'Agriculture régénérative', icon: '🏞️' },
  { label: 'Agriculture conventionnelle (à éviter)', icon: '🌍' },
];

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const CERT_TYPES = [
  'Agriculture Biologique (AB)', 'EU Organic (BIO Europe)', 'USDA Organic',
  'Fairtrade International', 'Ecocert', 'Rainforest Alliance', 'GlobalG.A.P.',
  'Demeter (biodynamie)', 'UTZ', 'Bio Suisse', 'Nature & Progrès', 'Autre',
];

const ID_TYPES = [
  { value: 'cni', label: 'Carte nationale d\'identité (CNI)' },
  { value: 'passport', label: 'Passeport' },
  { value: 'license', label: 'Permis de conduire' },
  { value: 'other', label: 'Autre document officiel' },
];

const TRANSPORT_MODES = [
  { label: 'Route (camion)', icon: '🚛' },
  { label: 'Maritime (bateau/container)', icon: '🚢' },
  { label: 'Aérien (avion)', icon: '✈️' },
  { label: 'Rail (train)', icon: '🚂' },
];

const PACKAGING_TYPES = [
  { label: 'Biodégradable', icon: '🌱' },
  { label: 'Recyclable', icon: '♻️' },
  { label: 'Réutilisable', icon: '🔄' },
  { label: 'Verre', icon: '🍶' },
  { label: 'Carton', icon: '📦' },
  { label: 'Plastique (à éviter)', icon: '🥤' },
];

const LANGUAGES = ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Portugais', 'Swahili', 'Hausa', 'Amharique', 'Autre'];

const BUSINESS_DOC_KEYS = [
  { key: 'statutes', label: 'Statuts de l\'entreprise', required: true },
  { key: 'registry', label: 'Registre du commerce', required: true },
  { key: 'legal_existence', label: 'Attestation d\'existence légale', required: true },
  { key: 'domicile', label: 'Justificatif de domicile (< 3 mois)', required: true },
  { key: 'phytosanitary', label: 'Certificats phytosanitaires (si export)', required: false },
];

const CURRENCIES = ['EUR', 'USD', 'MAD', 'ETB', 'XOF', 'GHS', 'BRL', 'INR', 'CNY'];

const SECTION_WEIGHTS: Record<string, number> = {
  '1': 10, '2': 10, '3': 10, '4': 10, '5': 15, '6': 15, '7': 10, '8': 5, '9': 10, '10': 5,
};

const SECTIONS = [
  { id: '1', label: 'Informations personnelles', icon: User },
  { id: '2', label: 'Pièces d\'identité', icon: FileText },
  { id: '3', label: 'Organisation professionnelle', icon: Building2 },
  { id: '4', label: 'Localisation', icon: MapPin },
  { id: '5', label: 'Production', icon: Sprout },
  { id: '6', label: 'Certifications', icon: Award },
  { id: '7', label: 'Justificatifs et documents', icon: FileCheck },
  { id: '8', label: 'Logistique et livraison', icon: Truck },
  { id: '9', label: 'Engagement éthique', icon: Heart },
  { id: '10', label: 'Médias (photos/vidéos)', icon: ImageIcon },
];

/* ─── Types ────────────────────────────────────────────── */

type CertEntry = {
  id?: string;
  cert_type: string;
  cert_number: string;
  issue_date: string;
  expiry_date: string;
  cert_body: string;
  document_url: string | null;
  status: string;
};

type FormState = {
  avatar_url: string;
  first_name: string;
  last_name: string;
  phone: string;
  whatsapp: string;
  birth_date: string;
  languages_spoken: string[];
  identity_type: string;
  identity_number: string;
  identity_country: string;
  identity_issue_date: string;
  identity_expiry: string;
  identity_recto_url: string;
  identity_verso_url: string;
  org_type: string;
  org_name: string;
  registration_number: string;
  founded_year: string;
  employee_count: string;
  families_impacted: string;
  website: string;
  business_email: string;
  short_description: string;
  long_description: string;
  country: string;
  region: string;
  city: string;
  address: string;
  postal_code: string;
  landmark: string;
  latitude: string;
  longitude: string;
  product_types: string[];
  surface_value: string;
  surface_unit: string;
  annual_capacity: string;
  capacity_unit: string;
  average_yield: string;
  farming_methods: string[];
  techniques_description: string;
  seasonality: string[];
  current_available_volume: string;
  delivery_countries: string[];
  transport_modes: string[];
  delivery_days_avg: string;
  packaging_types: string[];
  has_insurance: boolean;
  shipping_paid_by: string;
  logistics_partners: string;
  logo_url: string;
  banner_url: string;
  team_photos: string[];
  product_photos: string[];
  video_url: string;
  full_time_employees: string;
  part_time_employees: string;
  min_wage: string;
  min_wage_currency: string;
  working_hours_per_week: string;
  paid_leave: string;
  health_insurance: boolean;
  working_conditions: string;
  co2_saved: string;
  water_saved: string;
  trees_preserved: string;
  protected_area: string;
  social_actions: string;
  ethical_charter_signed: boolean;
  ethical_charter_url: string;
  business_documents: Record<string, string | null>;
  lab_analysis_url: string;
  farm_photos: string[];
};

const EMPTY_FORM: FormState = {
  avatar_url: '', first_name: '', last_name: '', phone: '', whatsapp: '', birth_date: '', languages_spoken: [],
  identity_type: 'cni', identity_number: '', identity_country: 'France', identity_issue_date: '', identity_expiry: '', identity_recto_url: '', identity_verso_url: '',
  org_type: 'producteur', org_name: '', registration_number: '', founded_year: '', employee_count: '', families_impacted: '', website: '', business_email: '',
  short_description: '', long_description: '',
  country: 'France', region: '', city: '', address: '', postal_code: '', landmark: '', latitude: '', longitude: '',
  product_types: [], surface_value: '', surface_unit: 'hectares', annual_capacity: '', capacity_unit: 'tonnes', average_yield: '', farming_methods: [], techniques_description: '', seasonality: [], current_available_volume: '',
  delivery_countries: [], transport_modes: [], delivery_days_avg: '', packaging_types: [], has_insurance: false, shipping_paid_by: 'producteur', logistics_partners: '',
  logo_url: '', banner_url: '', team_photos: [], product_photos: [], video_url: '',
  full_time_employees: '', part_time_employees: '', min_wage: '', min_wage_currency: 'EUR', working_hours_per_week: '', paid_leave: '', health_insurance: false,
  working_conditions: '', co2_saved: '', water_saved: '', trees_preserved: '', protected_area: '', social_actions: '', ethical_charter_signed: false, ethical_charter_url: '',
  business_documents: {}, lab_analysis_url: '', farm_photos: [],
};

/* ─── Type helper conversion & payload sanitization ───── */

function sanitizeProducerPayload(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = baseSanitizeProducerPayload(data);

  if ('org_name' in data) {
    sanitized.name = toStringOrNull(data.org_name as string);
    delete sanitized.org_name;
  }
  if ('long_description' in data) {
    const val = toStringOrNull(data.long_description as string);
    sanitized.long_description = val;
    sanitized.story = val;
  }
  if ('min_wage' in data) {
    const val = toFloatOrNull(data.min_wage);
    sanitized.min_wage = val;
    sanitized.minimum_wage = val;
  }
  if ('min_wage_currency' in data) {
    sanitized.minimum_wage_currency = toStringOrNull(data.min_wage_currency as string);
  }
  if ('avatar_url' in data && !('logo_url' in data)) {
    sanitized.logo_url = toStringOrNull(data.avatar_url as string);
  }

  return sanitized;
}

/* ─── Completion calculation ─────────────────────────────── */

function sectionComplete(section: string, f: FormState, certs: CertEntry[]): boolean {
  switch (section) {
    case '1': return !!(f.first_name && f.last_name && f.phone && f.languages_spoken.length > 0);
    case '2': return !!(f.identity_type && f.identity_number && f.identity_recto_url);
    case '3': return !!(f.org_type && f.org_name && f.short_description && f.long_description.length >= 50);
    case '4': return !!(f.country && f.city && f.address && f.latitude && f.longitude);
    case '5': return !!(f.product_types.length > 0 && f.farming_methods.length > 0 && f.surface_value);
    case '6': return certs.length > 0 && certs.some(c => c.cert_type && c.cert_number);
    case '7': return !!(f.business_documents.statutes && f.business_documents.registry && f.farm_photos.length >= 5);
    case '8': return !!(f.delivery_countries.length > 0 && f.transport_modes.length > 0 && f.delivery_days_avg);
    case '9': return !!(f.min_wage && f.working_conditions.length >= 50 && f.ethical_charter_signed);
    case '10': return !!(f.logo_url && f.banner_url && f.short_description);
    default: return false;
  }
}

function calcCompletion(f: FormState, certs: CertEntry[]): number {
  let total = 0;
  for (const sec of Object.keys(SECTION_WEIGHTS)) {
    if (sectionComplete(sec, f, certs)) total += SECTION_WEIGHTS[sec];
  }
  return Math.min(100, total);
}

/* ─── Main component ─────────────────────────────────────── */

export default function MonProfil() {
  const { user, producer, refresh } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [certs, setCerts] = useState<CertEntry[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('1');
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!producer) { setLoading(false); return; }
    const [firstName, ...rest] = (producer.name ?? '').split(' ');
    const lastName = rest.join(' ');
    setForm({
      avatar_url: producer.logo_url ?? '',
      first_name: firstName ?? '',
      last_name: lastName,
      phone: producer.phone ?? '',
      whatsapp: producer.whatsapp ?? '',
      birth_date: producer.birth_date ?? '',
      languages_spoken: producer.languages_spoken ?? [],
      identity_type: producer.identity_type ?? 'cni',
      identity_number: producer.identity_number ?? '',
      identity_country: producer.identity_country ?? 'France',
      identity_issue_date: producer.identity_issue_date ?? '',
      identity_expiry: producer.identity_expiry ?? '',
      identity_recto_url: producer.identity_recto_url ?? '',
      identity_verso_url: producer.identity_verso_url ?? '',
      org_type: producer.org_type ?? 'producteur',
      org_name: producer.name ?? '',
      registration_number: producer.registration_number ?? '',
      founded_year: producer.founded_year?.toString() ?? '',
      employee_count: producer.employee_count?.toString() ?? '',
      families_impacted: producer.families_impacted?.toString() ?? '',
      website: producer.website ?? '',
      business_email: producer.business_email ?? '',
      short_description: producer.short_description ?? '',
      long_description: producer.long_description ?? producer.story ?? '',
      country: producer.country ?? 'France',
      region: producer.region ?? '',
      city: producer.city ?? '',
      address: producer.address ?? '',
      postal_code: producer.postal_code ?? '',
      landmark: producer.landmark ?? '',
      latitude: producer.latitude?.toString() ?? '',
      longitude: producer.longitude?.toString() ?? '',
      product_types: producer.product_types ?? [],
      surface_value: producer.surface_value?.toString() ?? '',
      surface_unit: producer.surface_unit ?? 'hectares',
      annual_capacity: producer.annual_capacity ?? '',
      capacity_unit: 'tonnes',
      average_yield: producer.average_yield ?? '',
      farming_methods: producer.farming_methods ?? [],
      techniques_description: producer.techniques_description ?? '',
      seasonality: producer.seasonality ?? [],
      current_available_volume: producer.current_available_volume ?? '',
      delivery_countries: producer.delivery_countries ?? [],
      transport_modes: producer.transport_modes ?? [],
      delivery_days_avg: producer.delivery_days_avg?.toString() ?? '',
      packaging_types: producer.packaging_types ?? [],
      has_insurance: producer.has_insurance ?? false,
      shipping_paid_by: producer.shipping_paid_by ?? 'producteur',
      logistics_partners: producer.logistics_partners ?? '',
      logo_url: producer.logo_url ?? '',
      banner_url: producer.banner_url ?? '',
      team_photos: producer.team_photos ?? [],
      product_photos: producer.product_photos ?? [],
      video_url: producer.video_url ?? '',
      full_time_employees: producer.full_time_employees?.toString() ?? '',
      part_time_employees: producer.part_time_employees?.toString() ?? '',
      min_wage: producer.minimum_wage ?? producer.min_wage ?? '',
      min_wage_currency: producer.minimum_wage_currency ?? 'EUR',
      working_hours_per_week: producer.working_hours_per_week?.toString() ?? '',
      paid_leave: producer.paid_leave ?? '',
      health_insurance: producer.health_insurance ?? false,
      working_conditions: producer.working_conditions ?? '',
      co2_saved: producer.co2_saved ?? '',
      water_saved: producer.water_saved ?? '',
      trees_preserved: producer.trees_preserved ?? '',
      protected_area: producer.protected_area ?? '',
      social_actions: producer.social_actions ?? '',
      ethical_charter_signed: producer.ethical_charter_signed ?? false,
      ethical_charter_url: producer.ethical_charter_url ?? '',
      business_documents: producer.business_documents ?? {},
      lab_analysis_url: producer.lab_analysis_url ?? '',
      farm_photos: producer.farm_photos ?? [],
    });

    supabase.from('producer_certifications').select('*').eq('producer_id', producer.id)
      .then(({ data }) => {
        if (data) setCerts(data as CertEntry[]);
        setLoading(false);
      });
  }, [producer]);

  const completion = calcCompletion(form, certs);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section-id');
            if (id) setActiveSection(id);
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  const update = (field: keyof FormState, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const saveField = async (field: string, value: unknown) => {
    update(field as keyof FormState, value);
    if (!producer) return;
    try {
      const updateData: Record<string, unknown> = {
        [field]: value,
        last_updated_at: new Date().toISOString()
      };
      if (field === 'avatar_url') {
        updateData.logo_url = value;
      }
      const { error: updateErr } = await supabase
        .from('producers')
        .update(updateData)
        .eq('id', producer.id);

      if (updateErr) {
        console.error(`Error saving field ${field}:`, updateErr);
      } else {
        setLastAutoSave(new Date());
      }
    } catch (e) {
      console.error(`Exception saving field ${field}:`, e);
    }
  };

  const toggleArray = (field: keyof FormState, value: string) => {
    setForm(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) { setError('Géolocalisation non supportée par votre navigateur.'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        update('latitude', pos.coords.latitude.toFixed(6));
        update('longitude', pos.coords.longitude.toFixed(6));
      },
      () => setError('Impossible de détecter votre position.'),
    );
  };

  const saveSection = useCallback(async (section: string, data: Partial<FormState>) => {
    if (!producer) return;
    setSaving(section);
    setError('');

    try {
      const cleanData = sanitizeProducerPayload(data as Record<string, unknown>);
      const updateData: Record<string, unknown> = {
        ...cleanData,
        profile_completion: calcCompletion({ ...form, ...data }, certs),
      };

      const { error: err } = await saveProducerFields(supabase, producer.id, updateData);

      if (err) {
        console.error('Error saving producer section:', err);
        setError(`Erreur lors de la sauvegarde : ${err.message}`);
      } else {
        await refresh();
        setSavedSection(section);
        setLastAutoSave(new Date());
        setTimeout(() => setSavedSection(null), 2500);
      }
    } catch (e) {
      console.error('Exception in saveSection:', e);
      setError('Erreur inattendue lors de la sauvegarde.');
    } finally {
      setSaving(null);
    }
  }, [producer, form, certs, refresh]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!producer) return;
    const interval = setInterval(() => {
      const allData: Partial<FormState> = { ...form };
      saveSection('auto', allData);
      setLastAutoSave(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [producer, form, saveSection]);

  const addCert = () => setCerts(prev => [...prev, { cert_type: '', cert_number: '', issue_date: '', expiry_date: '', cert_body: '', document_url: null, status: 'pending' }]);
  const removeCert = async (idx: number) => {
    const cert = certs[idx];
    if (cert.id) await supabase.from('producer_certifications').delete().eq('id', cert.id);
    setCerts(prev => prev.filter((_, i) => i !== idx));
  };
  const updateCert = (idx: number, field: keyof CertEntry, value: string) => {
    setCerts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const saveCerts = async () => {
    if (!producer) return;
    setSaving('certs');
    setError('');
    for (const cert of certs) {
      if (!cert.cert_type) continue;
      if (cert.id) {
        await supabase.from('producer_certifications').update({
          cert_type: cert.cert_type, cert_number: cert.cert_number,
          issue_date: cert.issue_date || null, expiry_date: cert.expiry_date || null,
          cert_body: cert.cert_body, document_url: cert.document_url,
        }).eq('id', cert.id);
      } else {
        await supabase.from('producer_certifications').insert({
          producer_id: producer.id, cert_type: cert.cert_type, cert_number: cert.cert_number,
          issue_date: cert.issue_date || null, expiry_date: cert.expiry_date || null,
          cert_body: cert.cert_body, document_url: cert.document_url, status: 'pending',
        });
      }
    }
    setSaving(null);
    setSavedSection('certs');
    setLastAutoSave(new Date());
    setTimeout(() => setSavedSection(null), 2500);
  };

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const inputClass = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>;
  }

  if (!producer) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h3 className="font-bold text-gray-900 mb-2">Profil producteur non trouvé</h3>
        <p className="text-gray-500 text-sm">Votre profil n'a pas encore été créé. Veuillez vous déconnecter puis reconnecter, ou contacter le support.</p>
      </div>
    );
  }

  const badge = completion >= 100
    ? { label: 'Profil vérifié', bg: 'bg-brand-100', text: 'text-brand-700', icon: ShieldCheck }
    : completion >= 80
      ? { label: 'Presque complet', bg: 'bg-amber-100', text: 'text-amber-700', icon: Star }
      : completion >= 50
        ? { label: 'En cours', bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle }
        : { label: 'À compléter', bg: 'bg-gray-100', text: 'text-gray-600', icon: AlertCircle };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Mon Profil Producteur</h1>
            <p className="text-gray-500 text-sm mt-1">Complétez votre profil pour créer la confiance avec les acheteurs professionnels</p>
          </div>
          {producer.slug && (
            <Link to={`/boutique/${producer.slug}`} target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              <ExternalLink className="w-4 h-4" /> Aperçu boutique publique
            </Link>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Profil complété à {completion}%</span>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
              <badge.icon className="w-3.5 h-3.5" /> {badge.label}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${completion}%` }} />
          </div>
          {lastAutoSave && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Dernière sauvegarde: {lastAutoSave.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sticky sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 p-3 shadow-card">
            <nav className="space-y-0.5">
              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const complete = sectionComplete(id, form, certs);
                const isActive = activeSection === id;
                return (
                  <button key={id} onClick={() => scrollToSection(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                    <span className="flex-1 text-left text-xs leading-tight">{label}</span>
                    {complete ? (
                      <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* SECTION 1 — Informations personnelles */}
          <SectionCard ref={el => { sectionRefs.current['1'] = el; }} data-section-id="1" id="1" title="Informations personnelles" icon={User} saved={savedSection === '1'} complete={sectionComplete('1', form, certs)}>
            <FileUpload
              bucket="profile-photos"
              folder="avatar"
              accept=".jpg,.jpeg,.png,.webp"
              maxSizeMB={5}
              label="Photo de profil"
              description="Format JPG, PNG ou WEBP, max 5 MB"
              currentFileUrl={form.avatar_url}
              onUploadComplete={(url) => {
                update('avatar_url', url);
                update('logo_url', url);
                saveField('avatar_url', url);
              }}
              onDelete={() => {
                update('avatar_url', '');
                update('logo_url', '');
                saveField('avatar_url', null);
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom <span className="text-red-500">*</span></label>
                <input type="text" value={form.first_name} onChange={e => update('first_name', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nom <span className="text-red-500">*</span></label>
                <input type="text" value={form.last_name} onChange={e => update('last_name', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100">{user?.email}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Téléphone principal <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <span className="px-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600 whitespace-nowrap">{getCountryDialCode(form.country)}</span>
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className={`${inputClass} flex-1`} placeholder="6 12 34 56 78" />
                </div>
              </div>
              <div>
                <label className={labelClass}>WhatsApp Business</label>
                <div className="flex gap-2">
                  <span className="px-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600 whitespace-nowrap">{getCountryDialCode(form.country)}</span>
                  <input type="tel" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} className={`${inputClass} flex-1`} placeholder="6 12 34 56 78" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Date de naissance</label>
              <input type="date" value={form.birth_date} onChange={e => update('birth_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Langues parlées <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button key={l} type="button" onClick={() => toggleArray('languages_spoken', l)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.languages_spoken.includes(l) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <SaveButton onClick={() => saveSection('1', { logo_url: form.avatar_url || null, name: `${form.first_name} ${form.last_name}`.trim(), phone: form.phone || null, whatsapp: form.whatsapp || null, languages_spoken: form.languages_spoken, birth_date: form.birth_date || null })} saving={saving === '1'} />
          </SectionCard>

          {/* SECTION 2 — Pièces d'identité */}
          <SectionCard ref={el => { sectionRefs.current['2'] = el; }} data-section-id="2" id="2" title="Pièces d'identité" icon={FileText} saved={savedSection === '2'} complete={sectionComplete('2', form, certs)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type de pièce <span className="text-red-500">*</span></label>
                <select value={form.identity_type} onChange={e => update('identity_type', e.target.value)} className={inputClass}>
                  {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Numéro de la pièce <span className="text-red-500">*</span></label>
                <input type="text" value={form.identity_number} onChange={e => update('identity_number', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pays émetteur <span className="text-red-500">*</span></label>
                <select value={form.identity_country} onChange={e => update('identity_country', e.target.value)} className={inputClass}>
                  {COUNTRIES.map(c => <option key={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Date d'expiration <span className="text-red-500">*</span></label>
                <input type="date" value={form.identity_expiry} onChange={e => update('identity_expiry', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Date de délivrance</label>
              <input type="date" value={form.identity_issue_date} onChange={e => update('identity_issue_date', e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUpload
                bucket="identity-documents"
                folder="identity"
                accept=".pdf,.jpg,.jpeg,.png"
                maxSizeMB={10}
                label="Pièce d'identité (recto) *"
                description="Format PDF ou image, max 10 MB"
                currentFileUrl={form.identity_recto_url}
                onUploadComplete={(url) => {
                  update('identity_recto_url', url);
                  saveField('identity_recto_url', url);
                }}
                onDelete={() => {
                  update('identity_recto_url', '');
                  saveField('identity_recto_url', null);
                }}
              />
              <FileUpload
                bucket="identity-documents"
                folder="identity"
                accept=".pdf,.jpg,.jpeg,.png"
                maxSizeMB={10}
                label="Pièce d'identité (verso)"
                description="Format PDF ou image, max 10 MB"
                currentFileUrl={form.identity_verso_url}
                onUploadComplete={(url) => {
                  update('identity_verso_url', url);
                  saveField('identity_verso_url', url);
                }}
                onDelete={() => {
                  update('identity_verso_url', '');
                  saveField('identity_verso_url', null);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${producer.identity_verified ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'}`}>
                {producer.identity_verified ? `✓ Vérifié le ${producer.identity_verified_at ? new Date(producer.identity_verified_at).toLocaleDateString('fr-FR') : ''}` : '🟡 En attente de vérification'}
              </span>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">Vos documents sont sécurisés et vérifiés par notre équipe sous 48h. Ils ne sont visibles que par vous et l'équipe EthiMarket.</p>
            <SaveButton onClick={() => saveSection('2', { identity_type: form.identity_type, identity_number: form.identity_number || null, identity_country: form.identity_country || null, identity_issue_date: form.identity_issue_date || null, identity_expiry: form.identity_expiry || null, identity_recto_url: form.identity_recto_url || null, identity_verso_url: form.identity_verso_url || null })} saving={saving === '2'} />
          </SectionCard>

          {/* SECTION 3 — Organisation professionnelle */}
          <SectionCard ref={el => { sectionRefs.current['3'] = el; }} data-section-id="3" id="3" title="Organisation professionnelle" icon={Building2} saved={savedSection === '3'} complete={sectionComplete('3', form, certs)}>
            <div>
              <label className={labelClass}>Type d'organisation <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ORG_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => update('org_type', t.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${form.org_type === t.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <span className="text-xl">{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nom de l'organisation <span className="text-red-500">*</span></label>
                <input type="text" value={form.org_name} onChange={e => update('org_name', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Numéro d'enregistrement (SIRET, RCCM...)</label>
                <input type="text" value={form.registration_number} onChange={e => update('registration_number', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date de création <span className="text-red-500">*</span></label>
                <input type="number" value={form.founded_year} onChange={e => update('founded_year', e.target.value)} min="1900" max="2026" placeholder="2010" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nombre d'employés <span className="text-red-500">*</span></label>
                <input type="number" value={form.employee_count} onChange={e => update('employee_count', e.target.value)} min="0" placeholder="10" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nombre de familles impactées (si coopérative)</label>
                <input type="number" value={form.families_impacted} onChange={e => update('families_impacted', e.target.value)} min="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Site web <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <input type="url" value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://..." className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email professionnel de l'organisation</label>
              <input type="email" value={form.business_email} onChange={e => update('business_email', e.target.value)} placeholder="contact@coopérative.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Description courte <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(max 200 caractères)</span></label>
              <textarea rows={2} maxLength={200} value={form.short_description} onChange={e => update('short_description', e.target.value)} placeholder="Une phrase qui résume votre activité" className={`${inputClass} resize-none`} />
              <p className="text-xs text-gray-400 mt-1">{form.short_description.length}/200</p>
            </div>
            <div>
              <label className={labelClass}>Description longue / Histoire <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(min 500 caractères)</span></label>
              <textarea rows={5} value={form.long_description} onChange={e => update('long_description', e.target.value)} placeholder="Racontez l'histoire de votre organisation, vos valeurs, votre mission..." className={`${inputClass} resize-none`} />
              <p className="text-xs text-gray-400 mt-1">{form.long_description.length} caractères</p>
            </div>
            <SaveButton onClick={() => saveSection('3', { org_type: form.org_type, name: form.org_name || null, registration_number: form.registration_number || null, founded_year: toIntOrNull(form.founded_year), employee_count: toIntOrNull(form.employee_count), families_impacted: toIntOrNull(form.families_impacted), website: form.website || null, business_email: form.business_email || null, short_description: form.short_description || null, long_description: form.long_description || null, story: form.long_description || null })} saving={saving === '3'} />
          </SectionCard>

          {/* SECTION 4 — Localisation */}
          <SectionCard ref={el => { sectionRefs.current['4'] = el; }} data-section-id="4" id="4" title="Localisation" icon={MapPin} saved={savedSection === '4'} complete={sectionComplete('4', form, certs)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Pays <span className="text-red-500">*</span></label>
                <select value={form.country} onChange={e => update('country', e.target.value)} className={inputClass}>
                  {COUNTRIES.map(c => <option key={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Région / Province <span className="text-red-500">*</span></label>
                <input type="text" value={form.region} onChange={e => update('region', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Ville <span className="text-red-500">*</span></label>
                <input type="text" value={form.city} onChange={e => update('city', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Code postal</label>
                <input type="text" value={form.postal_code} onChange={e => update('postal_code', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Adresse complète <span className="text-red-500">*</span></label>
              <textarea rows={3} value={form.address} onChange={e => update('address', e.target.value)} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Point de repère <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input type="text" value={form.landmark} onChange={e => update('landmark', e.target.value)} placeholder="Ex: près de la rivière..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Coordonnées GPS <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <input type="text" value={form.latitude} onChange={e => update('latitude', e.target.value)} placeholder="Latitude" className={`${inputClass} flex-1`} />
                <input type="text" value={form.longitude} onChange={e => update('longitude', e.target.value)} placeholder="Longitude" className={`${inputClass} flex-1`} />
                <button type="button" onClick={detectLocation} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-50 text-brand-600 text-sm font-semibold rounded-xl hover:bg-brand-100 transition-colors whitespace-nowrap">
                  <Navigation className="w-4 h-4" /> Détecter
                </button>
              </div>
              {form.latitude && form.longitude && (
                <div className="mt-3 h-72 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                  <iframe title="map" width="100%" height="100%" loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.longitude) - 0.01},${Number(form.latitude) - 0.01},${Number(form.longitude) + 0.01},${Number(form.latitude) + 0.01}&marker=${form.latitude},${form.longitude}`} />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">Ces coordonnées seront visibles publiquement sur les fiches produits pour garantir la traçabilité.</p>
            <SaveButton onClick={() => saveSection('4', { country: form.country, country_flag: getCountryFlag(form.country), region: form.region || null, city: form.city || null, address: form.address || null, postal_code: form.postal_code || null, landmark: form.landmark || null, latitude: form.latitude ? parseFloat(form.latitude) : null, longitude: form.longitude ? parseFloat(form.longitude) : null })} saving={saving === '4'} />
          </SectionCard>

          {/* SECTION 5 — Production */}
          <SectionCard ref={el => { sectionRefs.current['5'] = el; }} data-section-id="5" id="5" title="Production" icon={Sprout} saved={savedSection === '5'} complete={sectionComplete('5', form, certs)}>
            <div>
              <label className={labelClass}>Types de produits <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_TYPES.map(t => (
                  <button key={t.label} type="button" onClick={() => toggleArray('product_types', t.label)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.product_types.includes(t.label) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Surface cultivée <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input type="number" value={form.surface_value} onChange={e => update('surface_value', e.target.value)} min="0" className={`${inputClass} flex-1`} />
                  <select value={form.surface_unit} onChange={e => update('surface_unit', e.target.value)} className={`${inputClass} w-32`}>
                    <option>hectares</option><option>m²</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Capacité de production annuelle <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input type="text" value={form.annual_capacity} onChange={e => update('annual_capacity', e.target.value)} className={`${inputClass} flex-1`} placeholder="50" />
                  <select value={form.capacity_unit} onChange={e => update('capacity_unit', e.target.value)} className={`${inputClass} w-32`}>
                    <option>kg</option><option>tonnes</option><option>litres</option><option>pièces</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Rendement moyen <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input type="text" value={form.average_yield} onChange={e => update('average_yield', e.target.value)} placeholder="Ex: 2 tonnes/ha" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Méthodes de culture <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {FARMING_METHODS.map(m => (
                  <button key={m.label} type="button" onClick={() => toggleArray('farming_methods', m.label)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.farming_methods.includes(m.label) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <span>{m.icon}</span>{m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Techniques utilisées</label>
              <textarea rows={3} value={form.techniques_description} onChange={e => update('techniques_description', e.target.value)} placeholder="Décrivez vos techniques : irrigation, protection des cultures, récolte, etc." className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Saisonnalité de production <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {MONTHS.map((m) => (
                  <button key={m} type="button" onClick={() => toggleArray('seasonality', m)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${form.seasonality.includes(m) ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {m.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Volume disponible actuellement</label>
              <input type="text" value={form.current_available_volume} onChange={e => update('current_available_volume', e.target.value)} placeholder="Ex: 10 tonnes" className={inputClass} />
            </div>
            <SaveButton onClick={() => saveSection('5', { product_types: form.product_types, surface_value: form.surface_value ? parseFloat(form.surface_value) : null, surface_unit: form.surface_unit, annual_capacity: form.annual_capacity || null, average_yield: form.average_yield || null, farming_methods: form.farming_methods, techniques_description: form.techniques_description || null, seasonality: form.seasonality, current_available_volume: form.current_available_volume || null })} saving={saving === '5'} />
          </SectionCard>

          {/* SECTION 6 — Certifications */}
          <SectionCard ref={el => { sectionRefs.current['6'] = el; }} data-section-id="6" id="6" title="Certifications" icon={Award} saved={savedSection === 'certs'} complete={sectionComplete('6', form, certs)}>
            <p className="text-xs text-gray-400">Ajoutez toutes vos certifications (bio, éthique, qualité). Les certifications sont vérifiées auprès des organismes émetteurs sous 5 jours ouvrés.</p>
            <div className="space-y-4">
              {certs.map((cert, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative">
                  <button type="button" onClick={() => removeCert(idx)} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Type de certification <span className="text-red-500">*</span></label>
                      <select value={cert.cert_type} onChange={e => updateCert(idx, 'cert_type', e.target.value)} className={inputClass}>
                        <option value="">Sélectionner...</option>
                        {CERT_TYPES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Numéro <span className="text-red-500">*</span></label>
                      <input type="text" value={cert.cert_number} onChange={e => updateCert(idx, 'cert_number', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Organisme certificateur <span className="text-red-500">*</span></label>
                      <input type="text" value={cert.cert_body} onChange={e => updateCert(idx, 'cert_body', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Date d'obtention <span className="text-red-500">*</span></label>
                      <input type="date" value={cert.issue_date} onChange={e => updateCert(idx, 'issue_date', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Date d'expiration <span className="text-red-500">*</span></label>
                      <input type="date" value={cert.expiry_date} onChange={e => updateCert(idx, 'expiry_date', e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <FileUpload
                      bucket="certifications"
                      folder="bio"
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSizeMB={10}
                      label="Document justificatif / Certificat officiel *"
                      description="Format PDF ou image scannée, max 10 MB"
                      currentFileUrl={cert.document_url || undefined}
                      onUploadComplete={async (url) => {
                        updateCert(idx, 'document_url', url);
                        if (cert.id) {
                          await supabase
                            .from('producer_certifications')
                            .update({ document_url: url })
                            .eq('id', cert.id);
                        }
                      }}
                      onDelete={async () => {
                        updateCert(idx, 'document_url', '');
                        if (cert.id) {
                          await supabase
                            .from('producer_certifications')
                            .update({ document_url: null })
                            .eq('id', cert.id);
                        }
                      }}
                    />
                  </div>
                  <div className="mt-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                      {cert.status === 'approved' ? '✓ Vérifiée' : cert.status === 'rejected' ? '✗ Rejetée' : '🟡 En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addCert} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:border-brand-400 hover:text-brand-600 transition-all w-full">
              <Plus className="w-4 h-4" /> Ajouter une certification
            </button>
            <SaveButton onClick={saveCerts} saving={saving === 'certs'} />
          </SectionCard>

          {/* SECTION 7 — Justificatifs */}
          <SectionCard ref={el => { sectionRefs.current['7'] = el; }} data-section-id="7" id="7" title="Justificatifs et documents" icon={FileCheck} saved={savedSection === '7'} complete={sectionComplete('7', form, certs)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BUSINESS_DOC_KEYS.map(doc => (
                <FileUpload
                  key={doc.key}
                  bucket="business-documents"
                  folder="statuts"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSizeMB={10}
                  label={`${doc.label} ${doc.required ? '*' : ''}`}
                  description="Format PDF ou image, max 10 MB"
                  currentFileUrl={form.business_documents[doc.key] ?? undefined}
                  onUploadComplete={async (url) => {
                    const updatedBizDocs = { ...form.business_documents, [doc.key]: url };
                    update('business_documents', updatedBizDocs);
                    if (producer) {
                      await supabase
                        .from('producers')
                        .update({ business_documents: updatedBizDocs, last_updated_at: new Date().toISOString() })
                        .eq('id', producer.id);
                    }
                  }}
                  onDelete={async () => {
                    const updatedBizDocs = { ...form.business_documents, [doc.key]: null };
                    update('business_documents', updatedBizDocs);
                    if (producer) {
                      await supabase
                        .from('producers')
                        .update({ business_documents: updatedBizDocs, last_updated_at: new Date().toISOString() })
                        .eq('id', producer.id);
                    }
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUpload
                bucket="lab-analyses"
                folder="lab"
                accept=".pdf,.jpg,.jpeg,.png"
                maxSizeMB={10}
                label="Analyses laboratoire des produits (PDF)"
                description="Rapports d'analyse qualité, traçabilité et pureté"
                currentFileUrl={form.lab_analysis_url}
                onUploadComplete={(url) => {
                  update('lab_analysis_url', url);
                  saveField('lab_analysis_url', url);
                }}
                onDelete={() => {
                  update('lab_analysis_url', '');
                  saveField('lab_analysis_url', null);
                }}
              />
              <FileUpload
                bucket="business-documents"
                folder="ethics"
                accept=".pdf,.jpg,.jpeg,.png"
                maxSizeMB={10}
                label="Attestation d'absence de travail des enfants *"
                description="Charte signée ou attestation officielle d'engagement"
                currentFileUrl={form.ethical_charter_url}
                onUploadComplete={(url) => {
                  update('ethical_charter_url', url);
                  saveField('ethical_charter_url', url);
                }}
                onDelete={() => {
                  update('ethical_charter_url', '');
                  saveField('ethical_charter_url', null);
                }}
              />
            </div>
            <div>
              <MultiFileUpload
                bucket="farm-photos"
                folder="farm"
                accept=".jpg,.jpeg,.png,.webp"
                maxSizeMB={5}
                maxFiles={10}
                minFiles={5}
                label="Photos de l'exploitation (min 5) *"
                description="Minimum 5 photos requises. Vue générale, cultures, installations, équipe..."
                currentFiles={form.farm_photos || []}
                onFilesChange={(urls) => {
                  update('farm_photos', urls);
                  saveField('farm_photos', urls);
                }}
              />
            </div>
            <SaveButton onClick={() => saveSection('7', { business_documents: form.business_documents, lab_analysis_url: form.lab_analysis_url || null, ethical_charter_url: form.ethical_charter_url || null, farm_photos: form.farm_photos })} saving={saving === '7'} />
          </SectionCard>

          {/* SECTION 8 — Logistique */}
          <SectionCard ref={el => { sectionRefs.current['8'] = el; }} data-section-id="8" id="8" title="Logistique et livraison" icon={Truck} saved={savedSection === '8'} complete={sectionComplete('8', form, certs)}>
            <div>
              <label className={labelClass}>Pays vers lesquels vous livrez <span className="text-red-500">*</span></label>
              <div className="flex gap-2 mb-2">
                <select onChange={e => { if (e.target.value === '__all__') { update('delivery_countries', COUNTRIES.map(c => c.name)); } else if (e.target.value) toggleArray('delivery_countries', e.target.value); e.target.value = ''; }} className={inputClass}>
                  <option value="">+ Ajouter un pays...</option>
                  <option value="__all__">Tous les pays</option>
                  {COUNTRIES.filter(c => !form.delivery_countries.includes(c.name)).map(c => <option key={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.delivery_countries.map(c => (
                  <span key={c} className="flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {getCountryFlag(c)} {c}
                    <button onClick={() => toggleArray('delivery_countries', c)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Moyens de transport <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_MODES.map(m => (
                  <button key={m.label} type="button" onClick={() => toggleArray('transport_modes', m.label)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.transport_modes.includes(m.label) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <span>{m.icon}</span>{m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Délai moyen de livraison (jours) <span className="text-red-500">*</span></label>
                <input type="number" value={form.delivery_days_avg} onChange={e => update('delivery_days_avg', e.target.value)} min="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Assurance transport incluse <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => update('has_insurance', true)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.has_insurance ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>Oui</button>
                  <button type="button" onClick={() => update('has_insurance', false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${!form.has_insurance ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>Non</button>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Coût livraison à charge de</label>
              <select value={form.shipping_paid_by} onChange={e => update('shipping_paid_by', e.target.value)} className={inputClass}>
                <option value="producteur">Producteur</option>
                <option value="acheteur">Acheteur</option>
                <option value="partage">Partagé</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Type d'emballage utilisé <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {PACKAGING_TYPES.map(p => (
                  <button key={p.label} type="button" onClick={() => toggleArray('packaging_types', p.label)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.packaging_types.includes(p.label) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <span>{p.icon}</span>{p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Partenaires logistiques <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input type="text" value={form.logistics_partners} onChange={e => update('logistics_partners', e.target.value)} placeholder="DHL, UPS, Maersk, etc." className={inputClass} />
            </div>
            <SaveButton onClick={() => saveSection('8', { delivery_countries: form.delivery_countries, transport_modes: form.transport_modes, delivery_days_avg: toIntOrNull(form.delivery_days_avg), packaging_types: form.packaging_types, has_insurance: form.has_insurance, shipping_paid_by: form.shipping_paid_by, logistics_partners: form.logistics_partners || null })} saving={saving === '8'} />
          </SectionCard>

          {/* SECTION 9 — Engagement éthique */}
          <SectionCard ref={el => { sectionRefs.current['9'] = el; }} data-section-id="9" id="9" title="Engagement éthique" icon={Heart} saved={savedSection === '9'} complete={sectionComplete('9', form, certs)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Employés à temps plein <span className="text-red-500">*</span></label>
                <input type="number" value={form.full_time_employees} onChange={e => update('full_time_employees', e.target.value)} min="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Employés à temps partiel</label>
                <input type="number" value={form.part_time_employees} onChange={e => update('part_time_employees', e.target.value)} min="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Salaire minimum garanti <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input type="number" value={form.min_wage} onChange={e => update('min_wage', e.target.value)} min="0" placeholder="1500" className={`${inputClass} flex-1`} />
                  <select value={form.min_wage_currency} onChange={e => update('min_wage_currency', e.target.value)} className={`${inputClass} w-24`}>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Heures de travail par semaine <span className="text-red-500">*</span></label>
                <input type="number" value={form.working_hours_per_week} onChange={e => update('working_hours_per_week', e.target.value)} min="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Congés payés</label>
                <select value={form.paid_leave} onChange={e => update('paid_leave', e.target.value)} className={inputClass}>
                  <option value="">Sélectionner...</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                  <option value="details">Oui, avec détails</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Sécurité sociale / assurance maladie</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => update('health_insurance', true)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.health_insurance ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>Oui</button>
                  <button type="button" onClick={() => update('health_insurance', false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${!form.health_insurance ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>Non</button>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Conditions de travail (min 200 caractères) <span className="text-red-500">*</span></label>
              <textarea rows={3} value={form.working_conditions} onChange={e => update('working_conditions', e.target.value)} placeholder="Décrivez les conditions de travail : sécurité, formation, avantages, etc." className={`${inputClass} resize-none`} />
              <p className="text-xs text-gray-400 mt-1">{form.working_conditions.length} caractères</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>CO2 économisé/an (tonnes)</label>
                <input type="text" value={form.co2_saved} onChange={e => update('co2_saved', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Eau économisée/an (litres)</label>
                <input type="text" value={form.water_saved} onChange={e => update('water_saved', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Arbres préservés</label>
                <input type="text" value={form.trees_preserved} onChange={e => update('trees_preserved', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Superficie protégée (ha)</label>
                <input type="text" value={form.protected_area} onChange={e => update('protected_area', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Actions communautaires</label>
              <textarea rows={3} value={form.social_actions} onChange={e => update('social_actions', e.target.value)} placeholder="Décrivez vos actions : école, santé, formation, infrastructure, etc." className={`${inputClass} resize-none`} />
            </div>
            <div className="bg-brand-50 rounded-2xl p-4 border border-brand-100">
              <h4 className="font-bold text-brand-800 text-sm mb-2">Charte éthique EthiMarket</h4>
              <p className="text-xs text-brand-700 mb-3 leading-relaxed">
                En signant cette charte, vous vous engagez à respecter les droits humains, à garantir l'absence de travail des enfants,
                à assurer des conditions de travail dignes et à promouvoir le commerce équitable.
              </p>
              <label className="flex items-start gap-3 cursor-pointer py-1">
                <input type="checkbox" checked={form.ethical_charter_signed} onChange={e => update('ethical_charter_signed', e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-brand-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 leading-relaxed font-semibold">
                  J'atteste avoir lu et signé la Charte éthique EthiMarket, garantissant l'absence de travail des enfants et le respect des droits humains. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
            <SaveButton onClick={() => saveSection('9', { full_time_employees: toIntOrNull(form.full_time_employees), part_time_employees: toIntOrNull(form.part_time_employees), minimum_wage: form.min_wage || null, minimum_wage_currency: form.min_wage_currency, working_hours_per_week: toIntOrNull(form.working_hours_per_week), paid_leave: form.paid_leave || null, health_insurance: form.health_insurance, working_conditions: form.working_conditions || null, co2_saved: form.co2_saved || null, water_saved: form.water_saved || null, trees_preserved: form.trees_preserved || null, protected_area: form.protected_area || null, social_actions: form.social_actions || null, ethical_charter_signed: form.ethical_charter_signed, ethical_charter_url: form.ethical_charter_url || null, ethical_charter_signed_at: form.ethical_charter_signed ? new Date().toISOString() : null, min_wage: form.min_wage || null })} saving={saving === '9'} />
          </SectionCard>

          {/* SECTION 10 — Médias */}
          <SectionCard ref={el => { sectionRefs.current['10'] = el; }} data-section-id="10" id="10" title="Médias (photos/vidéos)" icon={ImageIcon} saved={savedSection === '10'} complete={sectionComplete('10', form, certs)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUpload
                bucket="organization-logos"
                folder="logo"
                accept=".jpg,.jpeg,.png,.webp,.svg"
                maxSizeMB={5}
                label="Logo de l'organisation *"
                description="Format image carré recommandé (PNG, JPG)"
                currentFileUrl={form.logo_url}
                onUploadComplete={(url) => {
                  update('logo_url', url);
                  saveField('logo_url', url);
                }}
                onDelete={() => {
                  update('logo_url', '');
                  saveField('logo_url', null);
                }}
              />
              <FileUpload
                bucket="farm-photos"
                folder="banner"
                accept=".jpg,.jpeg,.png,.webp"
                maxSizeMB={5}
                label="Bannière de profil *"
                description="Format 1920x600 recommandé"
                currentFileUrl={form.banner_url}
                onUploadComplete={(url) => {
                  update('banner_url', url);
                  saveField('banner_url', url);
                }}
                onDelete={() => {
                  update('banner_url', '');
                  saveField('banner_url', null);
                }}
              />
            </div>
            <div>
              <MultiFileUpload
                bucket="farm-photos"
                folder="team"
                accept=".jpg,.jpeg,.png,.webp"
                maxSizeMB={5}
                maxFiles={5}
                label="Photos de l'équipe (max 5)"
                description="Mettez en avant vos collaborateurs, récoltants et partenaires"
                currentFiles={form.team_photos || []}
                onFilesChange={(urls) => {
                  update('team_photos', urls);
                  saveField('team_photos', urls);
                }}
              />
            </div>
            <div>
              <MultiFileUpload
                bucket="product-photos"
                folder="products"
                accept=".jpg,.jpeg,.png,.webp"
                maxSizeMB={5}
                maxFiles={10}
                label="Photos des produits (max 10)"
                description="Présentation de vos récoltes et produits finis"
                currentFiles={form.product_photos || []}
                onFilesChange={(urls) => {
                  update('product_photos', urls);
                  saveField('product_photos', urls);
                }}
              />
            </div>
            <div>
              <label className={labelClass}>Vidéo de présentation <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input type="url" value={form.video_url} onChange={e => update('video_url', e.target.value)} placeholder="https://youtube.com/..." className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">Durée conseillée : 2-3 minutes</p>
            </div>
            <SaveButton onClick={() => saveSection('10', { logo_url: form.logo_url || null, banner_url: form.banner_url || null, team_photos: form.team_photos, product_photos: form.product_photos, video_url: form.video_url || null })} saving={saving === '10'} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* ─── Section card wrapper ─────────────────────────────── */

type SectionCardProps = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  saved: boolean;
  complete: boolean;
  children: React.ReactNode;
  'data-section-id': string;
};

const SectionCard = ({ id, title, icon: Icon, saved, complete, children, ref, ...rest }: SectionCardProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const status = complete
    ? { label: 'Complète', bg: 'bg-brand-100', text: 'text-brand-700', icon: CheckCircle }
    : saved
      ? { label: 'Partielle', bg: 'bg-amber-100', text: 'text-amber-700', icon: Star }
      : { label: 'Vide', bg: 'bg-gray-100', text: 'text-gray-500', icon: AlertCircle };

  return (
    <div ref={ref} {...rest} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card scroll-mt-20">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-base">{title}</h2>
          {saved && <p className="text-xs text-brand-600 font-semibold flex items-center gap-1 mt-0.5"><CheckCircle className="w-3 h-3" /> Enregistré</p>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
            <status.icon className="w-3 h-3" /> {status.label}
          </span>
          <span className="text-xs font-bold text-gray-300 bg-gray-50 w-7 h-7 rounded-lg flex items-center justify-center">{id}</span>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={saving}
      className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {saving ? 'Enregistrement...' : 'Enregistrer cette section'}
    </button>
  );
}
