import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, FileText, MapPin, Award, FlaskConical, Heart,
  CheckCircle2, XCircle, Clock, Upload, Loader2, AlertCircle,
  ChevronDown, ChevronUp, Plus, Trash2,
  Navigation, X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase, type ProducerVerification, type VerificationDocument, type VerificationCertification, type VerificationLabAnalysis, type VerificationEthicalCommitment } from '../../lib/supabase';
import { LeafletMap } from '../../components/LeafletMap';

type SectionStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

const SECTIONS = [
  { id: 1, title: 'Documents d\'identité', icon: FileText, desc: 'Pièce d\'identité, justificatif de domicile, documents légaux' },
  { id: 2, title: 'Localisation de l\'exploitation', icon: MapPin, desc: 'Adresse, coordonnées GPS, photos de l\'exploitation' },
  { id: 3, title: 'Certifications bio/éthiques', icon: Award, desc: 'Au moins une certification obligatoire avec justificatif' },
  { id: 4, title: 'Analyses qualité produits', icon: FlaskConical, desc: 'Analyses laboratoire, certificats phytosanitaires' },
  { id: 5, title: 'Engagement éthique', icon: Heart, desc: 'Questionnaire détaillé sur conditions sociales et environnementales' },
] as const;

const STATUS_CONFIG: Record<SectionStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:   { label: 'En attente',   color: 'text-gray-500',   bg: 'bg-gray-100',   icon: Clock },
  submitted: { label: 'En attente de validation',   color: 'text-amber-600',  bg: 'bg-amber-50',  icon: Clock },
  approved:  { label: 'Validé',       color: 'text-brand-600',  bg: 'bg-brand-50',  icon: CheckCircle2 },
  rejected:  { label: 'Rejeté',      color: 'text-red-600',    bg: 'bg-red-50',    icon: XCircle },
};

const CERT_TYPES = [
  'Agriculture Biologique (AB)', 'Ecocert', 'Fairtrade International',
  'Rainforest Alliance', 'GlobalG.A.P.', 'EU Organic', 'USDA Organic',
  'Demeter (biodynamie)', 'UTZ', 'Bio Suisse', 'Autre',
];

const LAB_NAMES = ['Bureau Veritas', 'SGS', 'Eurofins', 'Intertek', 'Autre'];
const ANALYSIS_TYPES = ['Absence de pesticides', 'Absence de métaux lourds', 'Absence de mycotoxines', 'Tests microbiologiques', 'Composition nutritionnelle'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PRODUCT_TYPES = [
  'Café (arabica, robusta)', 'Cacao et chocolat', 'Thé (vert, noir, blanc)',
  'Épices (safran, poivre, curcuma, etc.)', 'Vanille', 'Huiles (argan, olive, coco, palme)',
  'Fruits secs et graines', 'Miel et sucres naturels', 'Céréales et légumineuses',
  'Cosmétiques naturels', 'Textile éthique (coton bio)', 'Autres',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VOLUME_OPTIONS = [
  { value: 'Petit producteur (< 1 tonne/an)', label: 'Petit producteur', desc: 'Moins de 1 tonne/an' },
  { value: 'Moyen (1-10 tonnes/an)', label: 'Moyen', desc: '1 à 10 tonnes/an' },
  { value: 'Grand (10-100 tonnes/an)', label: 'Grand', desc: '10 à 100 tonnes/an' },
  { value: 'Très grand (> 100 tonnes/an)', label: 'Très grand', desc: 'Plus de 100 tonnes/an' },
];

export default function Verification() {
  const { user, producer, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<ProducerVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<number | null>(1);

  const loadVerification = useCallback(async () => {
    if (!producer) return;
    const { data } = await supabase
      .from('producer_verifications')
      .select('*')
      .eq('producer_id', producer.id)
      .maybeSingle();
    if (data) {
      setVerification(data as ProducerVerification);
    } else {
      const { data: created } = await supabase
        .from('producer_verifications')
        .insert({ producer_id: producer.id })
        .select('*')
        .maybeSingle();
      setVerification(created as ProducerVerification | null);
    }
    setLoading(false);
  }, [producer]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/connexion'); return; }
    if (!producer) { navigate('/dashboard'); return; }
    loadVerification();
  }, [user, producer, authLoading, navigate, loadVerification]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="text-center py-20 text-gray-500">
        Impossible de charger votre vérification. Veuillez réessayer.
      </div>
    );
  }

  const statuses = [
    verification.section_1_status,
    verification.section_2_status,
    verification.section_3_status,
    verification.section_4_status,
    verification.section_5_status,
  ];
  const approvedCount = statuses.filter(s => s === 'approved').length;
  const progress = Math.round((approvedCount / 5) * 100);
  const allApproved = approvedCount === 5;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Vérification producteur</h1>
        <p className="text-gray-500 text-sm mt-1">
          Aucune vente possible tant que toutes les sections ne sont pas validées.
        </p>
      </div>

      {/* Progress banner */}
      <div className={`rounded-2xl border p-5 mb-6 ${allApproved ? 'border-brand-200 bg-brand-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {allApproved ? (
              <ShieldCheck className="w-6 h-6 text-brand-600" />
            ) : (
              <Clock className="w-6 h-6 text-amber-600" />
            )}
            <div>
              <p className={`font-bold ${allApproved ? 'text-brand-700' : 'text-amber-700'}`}>
                {allApproved ? 'Vérification complète ! Vous pouvez vendre' : 'Vérification en cours'}
              </p>
              <p className="text-sm text-gray-600">
                {approvedCount}/5 sections validées
                {verification.badge_level && ` • Badge ${verification.badge_level}`}
              </p>
            </div>
          </div>
          <span className={`text-2xl font-black ${allApproved ? 'text-brand-600' : 'text-amber-600'}`}>
            {progress}%
          </span>
        </div>
        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allApproved ? 'bg-brand-500' : 'bg-amber-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.map(section => {
          const status = statuses[section.id - 1] as SectionStatus;
          const cfg = STATUS_CONFIG[status];
          const isOpen = openSection === section.id;
          const Icon = section.icon;
          const StatusIcon = cfg.icon;
          return (
            <div key={section.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">SECTION {section.id}/5</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{section.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{section.desc}</p>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-5">
                  {verification.rejection_reasons[String(section.id)] && (
                    <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Motif du rejet :</p>
                        <p className="mt-0.5">{verification.rejection_reasons[String(section.id)]}</p>
                      </div>
                    </div>
                  )}
                  {section.id === 1 && <Section1 verification={verification} onChanged={loadVerification} />}
                  {section.id === 2 && <Section2 verification={verification} onChanged={loadVerification} />}
                  {section.id === 3 && <Section3 verification={verification} onChanged={loadVerification} />}
                  {section.id === 4 && <Section4 verification={verification} onChanged={loadVerification} />}
                  {section.id === 5 && <Section5 verification={verification} onChanged={loadVerification} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Shared upload helper ─── */
async function uploadFile(file: File, producerId: string, folder: string): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${producerId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('verifications').upload(path, file);
  if (error) return null;
  return supabase.storage.from('verifications').getPublicUrl(path).data.publicUrl;
}

function FileUploadButton({ onUploaded, label, accept = '.pdf,.png,.jpg,.jpeg' }: { onUploaded: (path: string) => void; label: string; accept?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { producer } = useAuth();

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !producer) return;
    setUploading(true); setError('');
    const path = await uploadFile(file, producer.id, 'documents');
    setUploading(false);
    if (path) onUploaded(path);
    else setError('Échec de l\'envoi. Réessayez.');
  };

  return (
    <div>
      <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer transition-colors">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Envoi...' : label}
        <input type="file" accept={accept} onChange={handle} className="hidden" />
      </label>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/* ─── Section 1: Identity Documents ─── */
function Section1({ verification, onChanged }: { verification: ProducerVerification; onChanged: () => void }) {
  const [docs, setDocs] = useState<VerificationDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadDocs = useCallback(async () => {
    const { data } = await supabase.from('verification_documents')
      .select('*').eq('verification_id', verification.id).eq('section', 1);
    setDocs((data as VerificationDocument[]) ?? []);
  }, [verification.id]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const requiredDocs = [
    { type: 'id_card', label: 'Pièce d\'identité (recto/verso)' },
    { type: 'proof_of_address', label: 'Justificatif de domicile (< 3 mois)' },
    { type: 'business_reg', label: 'Numéro d\'enregistrement entreprise (SIRET, RCCM...)' },
    { type: 'company_statutes', label: 'Statuts de la société' },
    { type: 'legal_existence', label: 'Certificat d\'existence légale (< 6 mois)' },
  ];

  const hasDoc = (type: string) => docs.some(d => d.doc_type === type);
  const allUploaded = requiredDocs.every(d => hasDoc(d.type));

  const addDoc = async (type: string, label: string, filePath: string) => {
    const { data } = await supabase.from('verification_documents')
      .insert({ verification_id: verification.id, section: 1, doc_type: type, file_path: filePath, label })
      .select('*').maybeSingle();
    if (data) setDocs(prev => [...prev, data as VerificationDocument]);
  };

  const removeDoc = async (id: string) => {
    await supabase.from('verification_documents').delete().eq('id', id);
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const submit = async () => {
    if (!allUploaded) return;
    setSubmitting(true);
    await supabase.from('producer_verifications').update({
      section_1_status: 'submitted',
      submitted_at_1: new Date().toISOString(),
    }).eq('id', verification.id);
    setSubmitting(false);
    onChanged();
  };

  const status = verification.section_1_status;
  if (status === 'submitted') return <InfoBox text="Vos documents sont en cours de vérification. Vous recevrez une notification sous 48h." />;
  if (status === 'approved') return <ApprovedBox />;

  return (
    <div className="space-y-3">
      {requiredDocs.map(doc => (
        <div key={doc.type} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2.5 min-w-0">
            {hasDoc(doc.type) ? <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" /> : <Clock className="w-4 h-4 text-gray-300 flex-shrink-0" />}
            <span className="text-sm text-gray-700 truncate">{doc.label}</span>
          </div>
          {hasDoc(doc.type) ? (
            <button onClick={() => removeDoc(docs.find(d => d.doc_type === doc.type)!.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Retirer
            </button>
          ) : (
            <FileUploadButton label="Téléverser" onUploaded={path => addDoc(doc.type, doc.label, path)} />
          )}
        </div>
      ))}
      <button disabled={!allUploaded || submitting} onClick={submit}
        className="btn-primary w-full py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-2">
        {submitting ? 'Envoi...' : 'Envoyer pour vérification'}
      </button>
    </div>
  );
}

/* ─── Section 2: Farm Location ─── */
function Section2({ verification, onChanged }: { verification: ProducerVerification; onChanged: () => void }) {
  const { producer } = useAuth();
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const photoLabels = ['Entrée exploitation', 'Parcelles cultivées', 'Équipement/matériel', 'Zone de stockage', 'Bureaux/administration'];

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setLat(pos.coords.latitude.toFixed(6));
      setLng(pos.coords.longitude.toFixed(6));
    });
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !producer) return;
    const path = await uploadFile(file, producer.id, 'photos');
    if (path) setPhotos(prev => { const n = [...prev]; n[index] = path; return n; });
  };

  const submit = async () => {
    if (!address || !city || !lat || !lng || photos.length < 5) return;
    setSubmitting(true);
    await supabase.from('verification_documents').insert(
      photos.map((p, i) => ({
        verification_id: verification.id, section: 2,
        doc_type: 'farm_photo', file_path: p, label: photoLabels[i],
      }))
    );
    await supabase.from('verification_documents').insert({
      verification_id: verification.id, section: 2,
      doc_type: 'location_data',
      file_path: '',
      label: JSON.stringify({ address, region, city, postalCode, lat, lng }),
    });
    await supabase.from('producer_verifications').update({
      section_2_status: 'submitted',
      submitted_at_2: new Date().toISOString(),
    }).eq('id', verification.id);
    setSubmitting(false);
    onChanged();
  };

  const status = verification.section_2_status;
  if (status === 'submitted') return <InfoBox text="Localisation en cours de vérification. Notification sous 48h." />;
  if (status === 'approved') return <ApprovedBox />;

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-600 mb-1">Adresse complète *</label>
          <input value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="Route rurale N°12, Douar..." />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Région *</label>
          <input value={region} onChange={e => setRegion(e.target.value)} className={inputClass} placeholder="Souss-Massa" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Ville *</label>
          <input value={city} onChange={e => setCity(e.target.value)} className={inputClass} placeholder="Agadir" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Code postal</label>
          <input value={postalCode} onChange={e => setPostalCode(e.target.value)} className={inputClass} placeholder="80000" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-600">Coordonnées GPS *</label>
          <button onClick={detectLocation} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
            <Navigation className="w-3.5 h-3.5" /> Détecter ma position
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input value={lat} onChange={e => setLat(e.target.value)} className={inputClass} placeholder="Latitude" />
          <input value={lng} onChange={e => setLng(e.target.value)} className={inputClass} placeholder="Longitude" />
        </div>
      </div>

      {lat && lng && (
        <div className="rounded-xl overflow-hidden border border-gray-100">
          <LeafletMap
            markers={[{ lat: parseFloat(lat), lng: parseFloat(lng), label: 'Mon exploitation' }]}
            height="250px"
            zoom={12}
            onMapClick={(c) => { setLat(c.lat.toFixed(6)); setLng(c.lng.toFixed(6)); }}
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2">Photos de l'exploitation (5 obligatoires) *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photoLabels.map((label, i) => (
            <div key={i}>
              {photos[i] ? (
                <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-100">
                  <img src={photos[i]} alt={label} className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos(prev => { const n = [...prev]; n.splice(i, 1); return n; })}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
                  <Upload className="w-5 h-5 text-gray-300" />
                  <span className="text-[10px] text-gray-400 text-center px-1">{label}</span>
                  <input type="file" accept="image/*" onChange={e => uploadPhoto(e, i)} className="hidden" />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      <button disabled={!address || !city || !lat || !lng || photos.length < 5 || submitting} onClick={submit}
        className="btn-primary w-full py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
        {submitting ? 'Envoi...' : 'Envoyer pour vérification'}
      </button>
    </div>
  );
}

/* ─── Section 3: Certifications ─── */
function Section3({ verification, onChanged }: { verification: ProducerVerification; onChanged: () => void }) {
  const [certs, setCerts] = useState<VerificationCertification[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadCerts = useCallback(async () => {
    const { data } = await supabase.from('verification_certifications')
      .select('*').eq('verification_id', verification.id);
    setCerts((data as VerificationCertification[]) ?? []);
  }, [verification.id]);

  useEffect(() => { loadCerts(); }, [loadCerts]);

  const addCert = async (cert: Omit<VerificationCertification, 'id' | 'verification_id' | 'status' | 'created_at'>) => {
    const { data } = await supabase.from('verification_certifications')
      .insert({ verification_id: verification.id, ...cert })
      .select('*').maybeSingle();
    if (data) setCerts(prev => [...prev, data as VerificationCertification]);
  };

  const removeCert = async (id: string) => {
    await supabase.from('verification_certifications').delete().eq('id', id);
    setCerts(prev => prev.filter(c => c.id !== id));
  };

  const submit = async () => {
    if (certs.length === 0) return;
    setSubmitting(true);
    await supabase.from('producer_verifications').update({
      section_3_status: 'submitted',
      submitted_at_3: new Date().toISOString(),
    }).eq('id', verification.id);
    setSubmitting(false);
    onChanged();
  };

  const status = verification.section_3_status;
  if (status === 'submitted') return <InfoBox text="Certifications en cours de vérification. Nous contactons l'organisme certificateur (5 jours ouvrés)." />;
  if (status === 'approved') return <ApprovedBox />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Au moins une certification est obligatoire. Notre équipe contactera l'organisme certificateur pour vérification.</p>
      {certs.map(cert => (
        <div key={cert.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-sm text-gray-900">{cert.cert_type}</p>
              <p className="text-xs text-gray-500 mt-0.5">N° {cert.cert_number} • {cert.certifying_body}</p>
              <p className="text-xs text-gray-400 mt-0.5">Valide du {cert.issued_at} au {cert.expires_at}</p>
            </div>
            <button onClick={() => removeCert(cert.id)} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <CertForm onAdd={addCert} />
      <button disabled={certs.length === 0 || submitting} onClick={submit}
        className="btn-primary w-full py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
        {submitting ? 'Envoi...' : 'Envoyer pour vérification'}
      </button>
    </div>
  );
}

function CertForm({ onAdd }: { onAdd: (cert: Omit<VerificationCertification, 'id' | 'verification_id' | 'status' | 'created_at'>) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cert_type: '', cert_number: '', certifying_body: '', issued_at: '', expires_at: '' });
  const [filePath, setFilePath] = useState('');
  const [stickerPath, setStickerPath] = useState('');

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white';

  const save = () => {
    if (!form.cert_type || !form.cert_number || !form.certifying_body || !form.issued_at || !form.expires_at || !filePath) return;
    onAdd({ ...form, file_path: filePath, sticker_path: stickerPath || null });
    setForm({ cert_type: '', cert_number: '', certifying_body: '', issued_at: '', expires_at: '' });
    setFilePath(''); setStickerPath('');
    setOpen(false);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors">
      <Plus className="w-4 h-4" /> Ajouter une certification
    </button>
  );

  return (
    <div className="bg-white border-2 border-brand-100 rounded-xl p-4 space-y-3">
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">Type de certification *</label>
        <select value={form.cert_type} onChange={e => setForm({ ...form, cert_type: e.target.value })} className={inputClass}>
          <option value="">Sélectionner...</option>
          {CERT_TYPES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Numéro *</label>
          <input value={form.cert_number} onChange={e => setForm({ ...form, cert_number: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Organisme *</label>
          <input value={form.certifying_body} onChange={e => setForm({ ...form, certifying_body: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Date d'obtention *</label>
          <input type="date" value={form.issued_at} onChange={e => setForm({ ...form, issued_at: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Date d'expiration *</label>
          <input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5">Certificat (PDF obligatoire, max 10 MB) *</label>
        {filePath ? (
          <div className="flex items-center gap-2 text-sm text-brand-600"><CheckCircle2 className="w-4 h-4" /> Certificat téléversé</div>
        ) : (
          <FileUploadButton label="Téléverser le certificat" onUploaded={setFilePath} accept=".pdf" />
        )}
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5">Photo du sticker/tampon (optionnel)</label>
        {stickerPath ? (
          <div className="flex items-center gap-2 text-sm text-brand-600"><CheckCircle2 className="w-4 h-4" /> Photo téléversée</div>
        ) : (
          <FileUploadButton label="Téléverser la photo" onUploaded={setStickerPath} accept="image/*" />
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Annuler</button>
        <button onClick={save} disabled={!form.cert_type || !form.cert_number || !form.certifying_body || !form.issued_at || !form.expires_at || !filePath}
          className="btn-primary flex-1 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">Ajouter cette certification</button>
      </div>
    </div>
  );
}

/* ─── Section 4: Lab Analyses ─── */
function Section4({ verification, onChanged }: { verification: ProducerVerification; onChanged: () => void }) {
  const [labs, setLabs] = useState<VerificationLabAnalysis[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadLabs = useCallback(async () => {
    const { data } = await supabase.from('verification_lab_analyses')
      .select('*').eq('verification_id', verification.id);
    setLabs((data as VerificationLabAnalysis[]) ?? []);
  }, [verification.id]);

  useEffect(() => { loadLabs(); }, [loadLabs]);

  const addLab = async (lab: Omit<VerificationLabAnalysis, 'id' | 'verification_id' | 'created_at'>) => {
    const { data } = await supabase.from('verification_lab_analyses')
      .insert({ verification_id: verification.id, ...lab })
      .select('*').maybeSingle();
    if (data) setLabs(prev => [...prev, data as VerificationLabAnalysis]);
  };

  const removeLab = async (id: string) => {
    await supabase.from('verification_lab_analyses').delete().eq('id', id);
    setLabs(prev => prev.filter(l => l.id !== id));
  };

  const submit = async () => {
    if (labs.length === 0) return;
    setSubmitting(true);
    await supabase.from('producer_verifications').update({
      section_4_status: 'submitted',
      submitted_at_4: new Date().toISOString(),
    }).eq('id', verification.id);
    setSubmitting(false);
    onChanged();
  };

  const status = verification.section_4_status;
  if (status === 'submitted') return <InfoBox text="Analyses en cours de vérification. Notification sous 5 jours ouvrés." />;
  if (status === 'approved') return <ApprovedBox />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Téléversez vos analyses laboratoire récentes (moins de 12 mois) et certificats phytosanitaires/sanitaires.</p>
      {labs.map(lab => (
        <div key={lab.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-sm text-gray-900">{lab.lab_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Date: {lab.analysis_date}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {lab.analysis_types.map(t => <span key={t} className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full">{t}</span>)}
              </div>
            </div>
            <button onClick={() => removeLab(lab.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
      <LabForm onAdd={addLab} />
      <button disabled={labs.length === 0 || submitting} onClick={submit}
        className="btn-primary w-full py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
        {submitting ? 'Envoi...' : 'Envoyer pour vérification'}
      </button>
    </div>
  );
}

function LabForm({ onAdd }: { onAdd: (lab: Omit<VerificationLabAnalysis, 'id' | 'verification_id' | 'created_at'>) => void }) {
  const [open, setOpen] = useState(false);
  const [labName, setLabName] = useState('');
  const [analysisDate, setAnalysisDate] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [filePath, setFilePath] = useState('');

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white';

  const toggleType = (t: string) => setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const save = () => {
    if (!labName || !analysisDate || types.length === 0 || !filePath) return;
    onAdd({ lab_name: labName, analysis_date: analysisDate, analysis_types: types, file_path: filePath });
    setLabName(''); setAnalysisDate(''); setTypes([]); setFilePath('');
    setOpen(false);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors">
      <Plus className="w-4 h-4" /> Ajouter une analyse
    </button>
  );

  return (
    <div className="bg-white border-2 border-brand-100 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Laboratoire *</label>
          <select value={labName} onChange={e => setLabName(e.target.value)} className={inputClass}>
            <option value="">Sélectionner...</option>
            {LAB_NAMES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Date de l'analyse *</label>
          <input type="date" value={analysisDate} onChange={e => setAnalysisDate(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5">Type d'analyse effectuée *</label>
        <div className="flex flex-wrap gap-2">
          {ANALYSIS_TYPES.map(t => (
            <button key={t} type="button" onClick={() => toggleType(t)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-all ${types.includes(t) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5">Rapport d'analyse (PDF) *</label>
        {filePath ? (
          <div className="flex items-center gap-2 text-sm text-brand-600"><CheckCircle2 className="w-4 h-4" /> Rapport téléversé</div>
        ) : (
          <FileUploadButton label="Téléverser le rapport" onUploaded={setFilePath} accept=".pdf" />
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Annuler</button>
        <button onClick={save} disabled={!labName || !analysisDate || types.length === 0 || !filePath}
          className="btn-primary flex-1 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">Ajouter</button>
      </div>
    </div>
  );
}

/* ─── Section 5: Ethical Commitment ─── */
function Section5({ verification, onChanged }: { verification: ProducerVerification; onChanged: () => void }) {
  const [form, setForm] = useState<VerificationEthicalCommitment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { producer } = useAuth();

  const loadForm = useCallback(async () => {
    const { data } = await supabase.from('verification_ethical_commitments')
      .select('*').eq('verification_id', verification.id).maybeSingle();
    if (data) setForm(data as VerificationEthicalCommitment);
  }, [verification.id]);

  useEffect(() => { loadForm(); }, [loadForm]);

  const f = form ?? {
    id: '', verification_id: verification.id, employee_count: 0, min_wage: '', weekly_hours: '',
    has_paid_leave: false, has_social_security: false, working_conditions_desc: '', ppe_photos: [],
    anti_discrimination_path: null, no_child_labor_path: null, impacted_families: 0, community_actions: '',
    environment_policy: '', water_management: '', waste_management: '', uses_renewable_energy: false,
    co2_estimate: '', charter_signature: '', created_at: '',
  };

  const update = (patch: Partial<VerificationEthicalCommitment>) => setForm({ ...f, ...patch } as VerificationEthicalCommitment);

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white';

  const submit = async () => {
    if (f.working_conditions_desc.length < 500 || !f.charter_signature || !f.anti_discrimination_path || !f.no_child_labor_path) return;
    setSubmitting(true);
    await supabase.from('verification_ethical_commitments').upsert({
      verification_id: verification.id,
      employee_count: f.employee_count, min_wage: f.min_wage, weekly_hours: f.weekly_hours,
      has_paid_leave: f.has_paid_leave, has_social_security: f.has_social_security,
      working_conditions_desc: f.working_conditions_desc, ppe_photos: f.ppe_photos,
      anti_discrimination_path: f.anti_discrimination_path, no_child_labor_path: f.no_child_labor_path,
      impacted_families: f.impacted_families, community_actions: f.community_actions,
      environment_policy: f.environment_policy, water_management: f.water_management,
      waste_management: f.waste_management, uses_renewable_energy: f.uses_renewable_energy,
      co2_estimate: f.co2_estimate, charter_signature: f.charter_signature,
    });
    await supabase.from('producer_verifications').update({
      section_5_status: 'submitted',
      submitted_at_5: new Date().toISOString(),
    }).eq('id', verification.id);
    setSubmitting(false);
    onChanged();
  };

  const status = verification.section_5_status;
  if (status === 'submitted') return <InfoBox text="Engagement éthique en cours d'évaluation par notre équipe." />;
  if (status === 'approved') return <ApprovedBox />;

  const addPpePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !producer) return;
    const path = await uploadFile(file, producer.id, 'ppe');
    if (path) update({ ppe_photos: [...f.ppe_photos, path] });
  };

  return (
    <div className="space-y-5">
      {/* 1. Rémunération */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3">1. Rémunération des employés</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Nombre d'employés *</label>
            <input type="number" min="0" value={f.employee_count} onChange={e => update({ employee_count: parseInt(e.target.value) || 0 })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Salaire min. garanti *</label>
            <input value={f.min_wage} onChange={e => update({ min_wage: e.target.value })} placeholder="Ex: 300€/mois" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Heures/semaine *</label>
            <input value={f.weekly_hours} onChange={e => update({ weekly_hours: e.target.value })} placeholder="Ex: 48h" className={inputClass} />
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={f.has_paid_leave} onChange={e => update({ has_paid_leave: e.target.checked })} className="w-4 h-4 rounded accent-brand-500" />
            Congés payés
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={f.has_social_security} onChange={e => update({ has_social_security: e.target.checked })} className="w-4 h-4 rounded accent-brand-500" />
            Sécurité sociale
          </label>
        </div>
      </div>

      {/* 2. Conditions de travail */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3">2. Conditions de travail</h4>
        <textarea rows={5} value={f.working_conditions_desc} onChange={e => update({ working_conditions_desc: e.target.value })}
          placeholder="Décrivez les conditions de travail (minimum 500 caractères)..." className={`${inputClass} resize-none`} />
        <p className={`text-xs mt-1 ${f.working_conditions_desc.length >= 500 ? 'text-brand-600' : 'text-gray-400'}`}>
          {f.working_conditions_desc.length}/500 caractères
        </p>
        <div className="mt-3">
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Photos des équipements de protection</label>
          <div className="flex flex-wrap gap-2">
            {f.ppe_photos.map((p, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100">
                <img src={p} alt="" className="w-full h-full object-cover" />
                <button onClick={() => update({ ppe_photos: f.ppe_photos.filter((_, idx) => idx !== i) })}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-brand-300">
              <Upload className="w-4 h-4 text-gray-300" />
              <input type="file" accept="image/*" onChange={addPpePhoto} className="hidden" />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Politique anti-discrimination (PDF) *</label>
            {f.anti_discrimination_path ? (
              <div className="flex items-center gap-2 text-sm text-brand-600"><CheckCircle2 className="w-4 h-4" /> Téléversé</div>
            ) : (
              <FileUploadButton label="Téléverser" onUploaded={path => update({ anti_discrimination_path: path })} accept=".pdf" />
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Attestation absence travail des enfants (PDF) *</label>
            {f.no_child_labor_path ? (
              <div className="flex items-center gap-2 text-sm text-brand-600"><CheckCircle2 className="w-4 h-4" /> Téléversé</div>
            ) : (
              <FileUploadButton label="Téléverser" onUploaded={path => update({ no_child_labor_path: path })} accept=".pdf" />
            )}
          </div>
        </div>
      </div>

      {/* 3. Impact social */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3">3. Impact social</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Familles impactées *</label>
            <input type="number" min="0" value={f.impacted_families} onChange={e => update({ impacted_families: parseInt(e.target.value) || 0 })} className={inputClass} />
          </div>
        </div>
        <textarea rows={3} value={f.community_actions} onChange={e => update({ community_actions: e.target.value })}
          placeholder="Actions communautaires (école, santé, formation)..." className={`${inputClass} resize-none mt-3`} />
      </div>

      {/* 4. Environnement */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-3">4. Environnement</h4>
        <textarea rows={3} value={f.environment_policy} onChange={e => update({ environment_policy: e.target.value })}
          placeholder="Politique environnementale..." className={`${inputClass} resize-none`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Gestion de l'eau</label>
            <input value={f.water_management} onChange={e => update({ water_management: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Gestion des déchets</label>
            <input value={f.waste_management} onChange={e => update({ waste_management: e.target.value })} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={f.uses_renewable_energy} onChange={e => update({ uses_renewable_energy: e.target.checked })} className="w-4 h-4 rounded accent-brand-500" />
            Énergies renouvelables
          </label>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Bilan carbone estimé annuel</label>
            <input value={f.co2_estimate} onChange={e => update({ co2_estimate: e.target.value })} placeholder="Ex: 12 tonnes CO2" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="border-t border-gray-100 pt-4">
        <label className="block text-xs font-bold text-gray-600 mb-1">Signature électronique de la Charte Éthique EthiMarket *</label>
        <input value={f.charter_signature} onChange={e => update({ charter_signature: e.target.value })}
          placeholder="Tapez votre nom complet pour signer" className={inputClass} />
        <p className="text-xs text-gray-400 mt-1">En signant, vous vous engagez à respecter la Charte Éthique EthiMarket.</p>
      </div>

      <button
        disabled={f.working_conditions_desc.length < 500 || !f.charter_signature || !f.anti_discrimination_path || !f.no_child_labor_path || submitting}
        onClick={submit}
        className="btn-primary w-full py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
        {submitting ? 'Envoi...' : 'Envoyer l\'engagement éthique'}
      </button>
    </div>
  );
}

/* ─── Small UI helpers ─── */
function InfoBox({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <p className="text-sm text-amber-700">{text}</p>
    </div>
  );
}

function ApprovedBox() {
  return (
    <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl p-4">
      <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
      <p className="text-sm text-brand-700">Section validée. Merci pour votre rigueur !</p>
    </div>
  );
}
