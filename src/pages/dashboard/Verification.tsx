import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, FileText, MapPin, Award, Heart,
  CheckCircle2, Clock, Upload, Loader2, AlertCircle,
  ChevronDown, ChevronUp, Trash2, Send,
  Navigation, X, ShieldAlert, Ban, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase, type Producer, type ProducerVerification, type VerificationDocument, type VerificationCertification } from '../../lib/supabase';
import { LeafletMap } from '../../components/LeafletMap';

type VerificationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';

const STATUS_CONFIG: Record<VerificationStatus, { label: string; desc: string; color: string; bg: string; icon: typeof Clock }> = {
  draft:        { label: 'BROUILLON', desc: 'Profil en cours de création', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  submitted:    { label: 'SOUMIS', desc: 'En attente de vérification par notre équipe', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
  under_review: { label: 'EN EXAMEN', desc: 'L\'équipe examine votre dossier', color: 'text-blue-700', bg: 'bg-blue-50', icon: Clock },
  approved:     { label: 'APPROUVÉ', desc: 'Votre boutique est en ligne !', color: 'text-brand-700', bg: 'bg-brand-50', icon: CheckCircle2 },
  rejected:     { label: 'REJETÉ', desc: 'Corrections nécessaires demandées', color: 'text-red-700', bg: 'bg-red-50', icon: AlertCircle },
  suspended:    { label: 'SUSPENDU', desc: 'Compte suspendu par l\'administration', color: 'text-gray-700', bg: 'bg-gray-200', icon: Ban },
};

export default function Verification() {
  const { user, producer, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<ProducerVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<number | null>(1);
  const [submittingAll, setSubmittingAll] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Verification documents state
  const [docs, setDocs] = useState<VerificationDocument[]>([]);
  const [certs, setCerts] = useState<VerificationCertification[]>([]);

  const loadVerification = useCallback(async () => {
    if (!producer) return;
    setLoading(true);

    // 1. Fetch main record
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

    // 2. Fetch docs & certs
    if (producer) {
      const { data: dData } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('verification_id', data?.id);
      setDocs((dData as VerificationDocument[]) ?? []);

      const { data: cData } = await supabase
        .from('verification_certifications')
        .select('*')
        .eq('verification_id', data?.id);
      setCerts((cData as VerificationCertification[]) ?? []);
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

  const vStatus = (producer?.verification_status as VerificationStatus) || 'draft';
  const cfg = STATUS_CONFIG[vStatus] || STATUS_CONFIG.draft;

  // Check mandatory requirements
  const hasIdCard = docs.some(d => d.doc_type === 'id_card');
  const hasBusinessReg = docs.some(d => d.doc_type === 'business_reg');
  const hasCompanyStatutes = docs.some(d => d.doc_type === 'company_statutes');
  const hasFarmPhotos = docs.filter(d => d.doc_type === 'farm_photo').length >= 5;
  const hasGps = producer?.latitude != null && producer?.longitude != null;
  const hasEthicalCharter = producer?.ethical_charter_signed === true;
  const hasNoChildLabor = docs.some(d => d.doc_type === 'no_child_labor');

  const allMandatoryUploaded = hasIdCard && hasBusinessReg && hasCompanyStatutes && hasFarmPhotos && hasGps && hasEthicalCharter && hasNoChildLabor;

  // Global submission handler
  const handleFinalSubmission = async () => {
    if (!producer || !allMandatoryUploaded) return;
    setSubmittingAll(true);

    const now = new Date().toISOString();

    // 1. Update producer status
    await supabase.from('producers').update({
      verification_status: 'submitted',
      submitted_at: now,
    }).eq('id', producer.id);

    // 2. Insert notification for admins
    await supabase.from('admin_notifications').insert({
      type: 'new_producer_submission',
      title: `Nouveau dossier soumis : ${producer.name}`,
      message: `Le producteur ${producer.name} (${producer.country}) a soumis son dossier complet pour accréditation.`,
      producer_id: producer.id,
      user_id: user?.id,
    });

    // 3. Insert history record
    await supabase.from('verification_history').insert({
      producer_id: producer.id,
      action: 'SUBMIT_DOSSIER',
      old_status: vStatus,
      new_status: 'submitted',
      reason: 'Soumission initiale par le producteur',
    });

    setSubmittingAll(false);
    setSubmitSuccess(true);
    await loadVerification();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Vérification & Accréditation Producteur</h1>
        <p className="text-gray-500 text-sm mt-1">
          Inspiré des standards Amazon Seller Central x Bureau Veritas. Votre boutique sera visible dès validation admin.
        </p>
      </div>

      {/* Main Status Badge Banner */}
      <div className={`rounded-3xl border p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        vStatus === 'approved'
          ? 'bg-brand-50 border-brand-200'
          : vStatus === 'rejected'
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50/80 border-amber-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
            {vStatus === 'approved' ? (
              <ShieldCheck className="w-7 h-7 text-brand-600" />
            ) : vStatus === 'rejected' ? (
              <ShieldAlert className="w-7 h-7 text-red-600" />
            ) : (
              <Clock className="w-7 h-7 text-amber-600" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-xs font-semibold text-gray-500">
                Statut actuel
              </span>
            </div>
            <p className="font-bold text-gray-900 text-base mt-1">{cfg.desc}</p>
          </div>
        </div>

        {vStatus === 'submitted' && (
          <div className="text-xs font-semibold text-amber-800 bg-white/80 px-4 py-2 rounded-xl border border-amber-200">
            ⏳ Notre équipe examine votre dossier sous 48h.
          </div>
        )}
      </div>

      {/* Rejection Alert Box */}
      {vStatus === 'rejected' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 text-red-900 space-y-3">
          <div className="flex items-center gap-2 font-black text-red-800 text-base">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>❌ Votre dossier a été rejeté — Corrections nécessaires</span>
          </div>

          {producer?.rejection_reason && (
            <div className="p-4 bg-white rounded-2xl border border-red-200 text-xs space-y-1">
              <p className="font-bold text-gray-900">Commentaire de l'administrateur Bureau Veritas :</p>
              <p className="text-gray-700 italic">"{producer.rejection_reason}"</p>
            </div>
          )}

          <p className="text-xs text-red-700">
            Veuillez mettre à jour les documents signalés ci-dessous puis soumettre à nouveau votre dossier.
          </p>
        </div>
      )}

      {/* Submission Success Alert Box */}
      {submitSuccess && (
        <div className="bg-brand-50 border border-brand-200 rounded-3xl p-6 text-brand-900 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-brand-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-600" /> Votre dossier a été soumis avec succès !
            </h3>
            <p className="text-xs text-brand-700 mt-1">
              Notre équipe vérifie votre dossier sous 48h. Vous recevrez une notification d'activation de votre boutique.
            </p>
          </div>
          <button onClick={() => setSubmitSuccess(false)} className="text-xs font-bold text-brand-800 underline">
            Fermer
          </button>
        </div>
      )}

      {/* MANDATORY CHECKLIST BEFORE SUBMISSION */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
          <span>📋</span> Checklist des Documents & Exigences Obligatoires
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Identité */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-700">1. Pièce d'identité (Recto & Verso)</span>
            {hasIdCard ? (
              <span className="text-brand-600 font-bold flex items-center gap-1">✅ Téléversé</span>
            ) : (
              <span className="text-red-500 font-bold flex items-center gap-1">❌ Manquant</span>
            )}
          </div>

          {/* Entreprise */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-700">2. Registre du Commerce (RCCM / SIRET)</span>
            {hasBusinessReg ? (
              <span className="text-brand-600 font-bold flex items-center gap-1">✅ Téléversé</span>
            ) : (
              <span className="text-red-500 font-bold flex items-center gap-1">❌ Manquant</span>
            )}
          </div>

          {/* Statuts */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-700">3. Statuts de l'entreprise</span>
            {hasCompanyStatutes ? (
              <span className="text-brand-600 font-bold flex items-center gap-1">✅ Téléversé</span>
            ) : (
              <span className="text-red-500 font-bold flex items-center gap-1">❌ Manquant</span>
            )}
          </div>

          {/* Photos */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-700">4. Photos de l'exploitation (min 5)</span>
            {hasFarmPhotos ? (
              <span className="text-brand-600 font-bold flex items-center gap-1">✅ {docs.filter(d => d.doc_type === 'farm_photo').length}/5</span>
            ) : (
              <span className="text-red-500 font-bold flex items-center gap-1">❌ {docs.filter(d => d.doc_type === 'farm_photo').length}/5</span>
            )}
          </div>

          {/* GPS */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-700">5. Coordonnées GPS de l'exploitation</span>
            {hasGps ? (
              <span className="text-brand-600 font-bold flex items-center gap-1">✅ Renseigné</span>
            ) : (
              <span className="text-red-500 font-bold flex items-center gap-1">❌ Non Saisi</span>
            )}
          </div>

          {/* Éthique */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-700">6. Charte éthique signée & Attestation</span>
            {hasEthicalCharter ? (
              <span className="text-brand-600 font-bold flex items-center gap-1">✅ Signée</span>
            ) : (
              <span className="text-red-500 font-bold flex items-center gap-1">❌ Non Signée</span>
            )}
          </div>
        </div>

        {/* Global Submit Action */}
        <div className="pt-3">
          {allMandatoryUploaded ? (
            <button
              onClick={handleFinalSubmission}
              disabled={submittingAll || vStatus === 'submitted'}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md bg-brand-600 hover:bg-brand-700 text-white"
            >
              {submittingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : vStatus === 'rejected' ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{vStatus === 'rejected' ? 'Corriger et resoumettre mon dossier' : 'Soumettre mon dossier pour validation Bureau Veritas'}</span>
            </button>
          ) : (
            <div className="text-center space-y-2">
              <button
                disabled
                className="w-full py-3.5 text-sm font-bold bg-gray-200 text-gray-500 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Soumettre mon dossier pour validation</span>
              </button>
              <p className="text-xs text-amber-700 font-medium">
                ⚠️ Complétez les documents manquants dans les sections ci-dessous avant de pouvoir soumettre.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTIONS LIST */}
      <div className="space-y-4">
        {/* Section 1: Documents d'identité */}
        <SectionAccordion
          title="1. Documents d'identité & Entreprise"
          icon={FileText}
          isOpen={openSection === 1}
          onToggle={() => setOpenSection(openSection === 1 ? null : 1)}
        >
          <Section1Form
            verification={verification!}
            docs={docs}
            producer={producer!}
            onRefresh={loadVerification}
          />
        </SectionAccordion>

        {/* Section 2: Farm Location & GPS */}
        <SectionAccordion
          title="2. Localisation & Photos d'Exploitation"
          icon={MapPin}
          isOpen={openSection === 2}
          onToggle={() => setOpenSection(openSection === 2 ? null : 2)}
        >
          <Section2Form
            verification={verification!}
            producer={producer!}
            onRefresh={loadVerification}
          />
        </SectionAccordion>

        {/* Section 3: Certifications */}
        <SectionAccordion
          title="3. Certifications Bio & Éthiques"
          icon={Award}
          isOpen={openSection === 3}
          onToggle={() => setOpenSection(openSection === 3 ? null : 3)}
        >
          <Section3Form
            verification={verification!}
            certs={certs}
            onRefresh={loadVerification}
          />
        </SectionAccordion>

        {/* Section 5: Engagement éthique */}
        <SectionAccordion
          title="4. Engagement Éthique & Charte"
          icon={Heart}
          isOpen={openSection === 5}
          onToggle={() => setOpenSection(openSection === 5 ? null : 5)}
        >
          <Section5Form
            verification={verification!}
            producer={producer!}
            onRefresh={loadVerification}
          />
        </SectionAccordion>
      </div>
    </div>
  );
}

// Section Accordion Wrapper
function SectionAccordion({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: typeof FileText;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-black text-gray-900 text-sm">{title}</span>
        </div>

        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {isOpen && <div className="p-6 border-t border-gray-100 space-y-4">{children}</div>}
    </div>
  );
}

// Helpers
async function uploadFile(file: File, producerId: string, folder: string): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${producerId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('verifications').upload(path, file);
  if (error) return null;
  return supabase.storage.from('verifications').getPublicUrl(path).data.publicUrl;
}

function FileUploadBtn({ onUploaded, label }: { onUploaded: (path: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  const { producer } = useAuth();

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !producer) return;
    setUploading(true);
    const path = await uploadFile(file, producer.id, 'documents');
    setUploading(false);
    if (path) onUploaded(path);
  };

  return (
    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm">
      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
      <span>{uploading ? 'Téléversement...' : label}</span>
      <input type="file" onChange={handle} className="hidden" />
    </label>
  );
}

// Section 1 Form
function Section1Form({ verification, docs, producer, onRefresh }: { verification: ProducerVerification; docs: VerificationDocument[]; producer: Producer; onRefresh: () => void }) {
  const addDoc = async (type: string, label: string, filePath: string) => {
    await supabase.from('verification_documents').insert({
      verification_id: verification.id, section: 1, doc_type: type, file_path: filePath, label
    });
    if (type === 'id_card') {
      await supabase.from('producers').update({ identity_recto_url: filePath }).eq('id', producer.id);
    }
    onRefresh();
  };

  const removeDoc = async (id: string) => {
    await supabase.from('verification_documents').delete().eq('id', id);
    onRefresh();
  };

  const requiredDocs = [
    { type: 'id_card', label: 'Pièce d\'identité Recto (CNI / Passeport)' },
    { type: 'business_reg', label: 'Registre du commerce (RCCM / SIRET)' },
    { type: 'company_statutes', label: 'Statuts de l\'entreprise' },
  ];

  return (
    <div className="space-y-3">
      {requiredDocs.map(item => {
        const doc = docs.find(d => d.doc_type === item.type);
        return (
          <div key={item.type} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs">
            <span className="font-bold text-gray-800">{item.label}</span>
            {doc ? (
              <div className="flex items-center gap-2">
                <span className="text-brand-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Fichier reçu</span>
                <button onClick={() => removeDoc(doc.id)} className="text-red-500 hover:text-red-700 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <FileUploadBtn label="Téléverser" onUploaded={path => addDoc(item.type, item.label, path)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Section 2 Form
function Section2Form({ verification, producer, onRefresh }: { verification: ProducerVerification; producer: Producer; onRefresh: () => void }) {
  const [address, setAddress] = useState(producer?.address || '');
  const [city, setCity] = useState(producer?.city || '');
  const [lat, setLat] = useState(producer?.latitude?.toString() || '');
  const [lng, setLng] = useState(producer?.longitude?.toString() || '');
  const [photos, setPhotos] = useState<string[]>(producer?.farm_photos || []);
  const [saving, setSaving] = useState(false);

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
    if (!file) return;
    const path = await uploadFile(file, producer.id, 'photos');
    if (path) {
      const updated = [...photos];
      updated[index] = path;
      setPhotos(updated);
    }
  };

  const saveFarm = async () => {
    setSaving(true);
    await supabase.from('producers').update({
      address,
      city,
      latitude: parseFloat(lat) || null,
      longitude: parseFloat(lng) || null,
      farm_photos: photos,
    }).eq('id', producer.id);

    // Also register documents
    await supabase.from('verification_documents').insert(
      photos.map((p, i) => ({
        verification_id: verification.id, section: 2,
        doc_type: 'farm_photo', file_path: p, label: photoLabels[i] || 'Photo'
      }))
    );

    setSaving(false);
    onRefresh();
  };

  const inputClass = 'w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white';

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Adresse complète *</label>
          <input value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="Ex: Route Rurale..." />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Ville / Commune *</label>
          <input value={city} onChange={e => setCity(e.target.value)} className={inputClass} placeholder="Ex: Agadir" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-bold text-gray-700">Coordonnées GPS *</label>
          <button onClick={detectLocation} className="text-brand-600 font-bold flex items-center gap-1 hover:underline">
            <Navigation className="w-3 h-3" /> Détecter ma position GPS
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input value={lat} onChange={e => setLat(e.target.value)} className={inputClass} placeholder="Latitude (ex: 30.4278)" />
          <input value={lng} onChange={e => setLng(e.target.value)} className={inputClass} placeholder="Longitude (ex: -9.5981)" />
        </div>
      </div>

      {lat && lng && (
        <div className="rounded-2xl overflow-hidden border border-gray-200">
          <LeafletMap
            markers={[{ lat: parseFloat(lat), lng: parseFloat(lng), label: 'Mon exploitation' }]}
            height="200px"
            zoom={12}
          />
        </div>
      )}

      <div>
        <label className="block font-bold text-gray-700 mb-2">Photos de l'exploitation (5 obligatoires) *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photoLabels.map((label, i) => (
            <div key={i}>
              {photos[i] ? (
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200">
                  <img src={photos[i]} alt={label} className="w-full h-full object-cover" />
                  <button onClick={() => { const n = [...photos]; n.splice(i, 1); setPhotos(n); }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-brand-300 hover:bg-brand-50/20">
                  <Upload className="w-5 h-5 text-gray-300" />
                  <span className="text-[10px] text-gray-400 text-center px-1">{label}</span>
                  <input type="file" accept="image/*" onChange={e => uploadPhoto(e, i)} className="hidden" />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={saveFarm} disabled={saving} className="btn-primary w-full py-2.5 text-xs font-bold">
        {saving ? 'Enregistrement...' : 'Enregistrer la localisation et photos'}
      </button>
    </div>
  );
}

// Section 3 Form
function Section3Form({ verification, certs, onRefresh }: { verification: ProducerVerification; certs: VerificationCertification[]; onRefresh: () => void }) {
  const [certType, setCertType] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [body, setBody] = useState('');
  const [filePath, setFilePath] = useState('');
  const [saving, setSaving] = useState(false);

  const addCert = async () => {
    if (!certType || !certNumber || !body || !filePath) return;
    setSaving(true);
    await supabase.from('verification_certifications').insert({
      verification_id: verification.id,
      cert_type: certType,
      cert_number: certNumber,
      certifying_body: body,
      issued_at: new Date().toISOString().slice(0, 10),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      file_path: filePath,
    });
    setCertType(''); setCertNumber(''); setBody(''); setFilePath('');
    setSaving(false);
    onRefresh();
  };

  const inputClass = 'w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white';

  return (
    <div className="space-y-4 text-xs">
      {certs.map(c => (
        <div key={c.id} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">{c.cert_type}</p>
            <p className="text-[11px] text-gray-500">N° {c.cert_number} • {c.certifying_body}</p>
          </div>
          <span className="text-brand-600 font-bold flex items-center gap-1">✅ Certificat prêt</span>
        </div>
      ))}

      <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl space-y-3">
        <h4 className="font-bold text-gray-800">Ajouter une certification Bio / Éthique</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={certType} onChange={e => setCertType(e.target.value)} placeholder="Type (Ex: AB, Fairtrade)" className={inputClass} />
          <input value={certNumber} onChange={e => setCertNumber(e.target.value)} placeholder="N° Certificat" className={inputClass} />
          <input value={body} onChange={e => setBody(e.target.value)} placeholder="Organisme (Ex: Ecocert)" className={inputClass} />
        </div>

        <div className="flex items-center justify-between">
          {filePath ? (
            <span className="text-brand-600 font-bold flex items-center gap-1">✅ PDF Téléversé</span>
          ) : (
            <FileUploadBtn label="Téléverser le PDF du certificat" onUploaded={setFilePath} />
          )}

          <button onClick={addCert} disabled={saving || !certType || !filePath} className="btn-primary px-4 py-2 text-xs font-bold">
            Ajouter certification
          </button>
        </div>
      </div>
    </div>
  );
}

// Section 5 Form
function Section5Form({ verification, producer, onRefresh }: { verification: ProducerVerification; producer: Producer; onRefresh: () => void }) {
  const [signed, setSigned] = useState(producer?.ethical_charter_signed || false);
  const [childLaborDoc, setChildLaborDoc] = useState('');
  const [saving, setSaving] = useState(false);

  const saveEthics = async () => {
    setSaving(true);
    await supabase.from('producers').update({
      ethical_charter_signed: signed,
      ethical_charter_signed_at: signed ? new Date().toISOString() : null,
    }).eq('id', producer.id);

    if (childLaborDoc) {
      await supabase.from('verification_documents').insert({
        verification_id: verification.id, section: 5,
        doc_type: 'no_child_labor', file_path: childLaborDoc, label: 'Attestation absence travail des enfants'
      });
    }

    setSaving(false);
    onRefresh();
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
        <label className="flex items-center gap-3 font-bold text-gray-900 cursor-pointer">
          <input
            type="checkbox"
            checked={signed}
            onChange={e => setSigned(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded accent-brand-600"
          />
          <span>Je soussigné(e) confirme signer la Charte Éthique & Environnementale EthiMarket x Bureau Veritas.</span>
        </label>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900">Attestation d'absence de travail des enfants</p>
          <p className="text-[11px] text-gray-500">Document officiel attestant du respect des conventions OIT.</p>
        </div>
        {childLaborDoc ? (
          <span className="text-brand-600 font-bold flex items-center gap-1">✅ Téléversé</span>
        ) : (
          <FileUploadBtn label="Téléverser" onUploaded={setChildLaborDoc} />
        )}
      </div>

      <button onClick={saveEthics} disabled={saving} className="btn-primary w-full py-2.5 text-xs font-bold">
        {saving ? 'Enregistrement...' : 'Enregistrer les engagements éthiques'}
      </button>
    </div>
  );
}
