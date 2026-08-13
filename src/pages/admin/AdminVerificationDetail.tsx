import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, ExternalLink, Calendar,
  Loader2, Mail, Phone, CheckCircle2,
  Clock, AlertTriangle, Building2, UserCheck, Check, History
} from 'lucide-react';
import { supabase, type Producer, type ProducerVerification, type VerificationDocument, type VerificationCertification, type VerificationEthicalCommitment, type VerificationHistory } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';
import { DocumentViewer } from '../../components/admin/DocumentViewer';
import { DecisionPanel } from '../../components/admin/DecisionPanel';
import { type VerificationChecklistState } from '../../components/admin/VerificationChecklist';
import { LeafletMap } from '../../components/LeafletMap';

export default function AdminVerificationDetail() {
  const { producerId } = useParams<{ producerId: string }>();
  const navigate = useNavigate();

  const [producer, setProducer] = useState<Producer | null>(null);
  const [verification, setVerification] = useState<ProducerVerification | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [certifications, setCertifications] = useState<VerificationCertification[]>([]);
  const [ethical, setEthical] = useState<VerificationEthicalCommitment | null>(null);
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [docStatuses, setDocStatuses] = useState<Record<string, { status: 'valid' | 'invalid'; comment: string }>>({});
  const [nextAuditDate, setNextAuditDate] = useState('');

  const loadData = useCallback(async () => {
    if (!producerId) return;
    setLoading(true);

    // 1. Fetch producer
    const { data: pData } = await supabase
      .from('producers')
      .select('*')
      .eq('id', producerId)
      .maybeSingle();

    if (!pData) {
      // Try search by user_id
      const { data: pByUser } = await supabase
        .from('producers')
        .select('*')
        .eq('user_id', producerId)
        .maybeSingle();
      if (pByUser) setProducer(pByUser as Producer);
    } else {
      setProducer(pData as Producer);
    }

    const actualProducerId = pData?.id || producerId;

    // 2. Fetch verification record
    const { data: vData } = await supabase
      .from('producer_verifications')
      .select('*')
      .eq('producer_id', actualProducerId)
      .maybeSingle();

    if (vData) {
      setVerification(vData as ProducerVerification);

      // 3. Fetch docs
      const { data: docs } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('verification_id', vData.id);
      setDocuments((docs as VerificationDocument[]) ?? []);

      // 4. Fetch certs
      const { data: certs } = await supabase
        .from('verification_certifications')
        .select('*')
        .eq('verification_id', vData.id);
      setCertifications((certs as VerificationCertification[]) ?? []);

      // 5. Fetch ethical commitment
      const { data: eth } = await supabase
        .from('verification_ethical_commitments')
        .select('*')
        .eq('verification_id', vData.id)
        .maybeSingle();
      setEthical(eth as VerificationEthicalCommitment | null);
    }

    // 6. Fetch verification history
    const { data: hist } = await supabase
      .from('verification_history')
      .select('*')
      .eq('producer_id', actualProducerId)
      .order('created_at', { ascending: false });
    setHistory((hist as VerificationHistory[]) ?? []);

    setLoading(false);
  }, [producerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
        <p className="text-sm font-semibold">Chargement du dossier producteur Bureau Veritas...</p>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Producteur introuvable</h2>
        <Link to="/admin/verifications" className="btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </Link>
      </div>
    );
  }

  const identityDocs = documents.filter(d => d.section === 1);
  const locationDocs = documents.filter(d => d.section === 2);
  const locationDataDoc = locationDocs.find(d => d.doc_type === 'location_data');
  
  let parsedLocation: { address?: string; city?: string; region?: string; lat?: string; lng?: string } = {};
  if (locationDataDoc?.label) {
    try {
      parsedLocation = JSON.parse(locationDataDoc.label);
    } catch {
      // Ignore json parse error
    }
  }

  const status = producer.verification_status || 'draft';

  const handleDocStatusChange = (docId: string, status: 'valid' | 'invalid', comment: string) => {
    setDocStatuses(prev => ({
      ...prev,
      [docId]: { status, comment },
    }));
  };

  // Status badge helper
  const renderStatusBadge = () => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-brand-100 text-brand-700 font-bold text-xs rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Approuvé — En ligne</span>;
      case 'submitted':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Soumis — À examiner</span>;
      case 'under_review':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> En cours d'examen</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Rejeté — Corrections requises</span>;
      case 'suspended':
        return <span className="px-3 py-1 bg-gray-800 text-white font-bold text-xs rounded-full">Suspendu</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold text-xs rounded-full">Brouillon</span>;
    }
  };

  // Actions
  const updateProducerStatus = async (
    newStatus: 'approved' | 'rejected' | 'draft',
    internalNotes: string,
    producerComment: string,
    checklist: VerificationChecklistState
  ) => {
    setActionLoading(true);

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      verification_status: newStatus,
      reviewed_at: now,
      reviewed_by: 'Admin Bureau Veritas',
      verification_notes: internalNotes,
      rejection_reason: newStatus === 'approved' ? null : producerComment,
      verified: newStatus === 'approved',
    };

    if (newStatus === 'approved') {
      updatePayload.last_audit_date = now;
      updatePayload.next_audit_date = nextAuditDate ? new Date(nextAuditDate).toISOString() : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
      updatePayload.audit_count = (producer.audit_count || 0) + 1;
    }

    // Update Producer table
    await supabase.from('producers').update(updatePayload).eq('id', producer.id);

    // Update producer_verifications if exists
    if (verification) {
      const isApproved = newStatus === 'approved';
      await supabase.from('producer_verifications').update({
        section_1_status: isApproved ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'pending',
        section_2_status: isApproved ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'pending',
        section_3_status: isApproved ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'pending',
        section_4_status: isApproved ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'pending',
        section_5_status: isApproved ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'pending',
        onboarding_complete: isApproved,
        validated_at: isApproved ? now : null,
      }).eq('id', verification.id);
    }

    // Insert Log in verification_history
    await supabase.from('verification_history').insert({
      producer_id: producer.id,
      action: newStatus === 'approved' ? 'APPROVE_PRODUCER' : newStatus === 'rejected' ? 'REJECT_PRODUCER' : 'REQUEST_CHANGES',
      old_status: status,
      new_status: newStatus,
      reason: producerComment || internalNotes || 'Décision administrateur',
      details: { docStatuses, internalNotes, checklist },
    });

    // Send Admin Notification
    await supabase.from('admin_notifications').insert({
      type: newStatus === 'approved' ? 'PRODUCER_APPROVED' : 'PRODUCER_REJECTED',
      title: newStatus === 'approved' ? `Producteur approuvé : ${producer.name}` : `Dossier rejeté : ${producer.name}`,
      message: producerComment || `Changement de statut en ${newStatus}`,
      producer_id: producer.id,
      user_id: producer.user_id,
      data: { status: newStatus },
    });

    setActionLoading(false);
    await loadData();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/verifications')}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux vérifications
        </button>
        {renderStatusBadge()}
      </div>

      <AdminPageHeader
        title={`Audit Producteur : ${producer.name}`}
        subtitle={`Examen de conformité Bureau Veritas • ID : ${producer.id.slice(0, 8)}`}
      />

      {/* SECTION A: RESUME DU PRODUCTEUR */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>SECTION A</span> • Résumé du Profil Producteur
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-sm" style={{ backgroundColor: producer.avatar_color || '#16a34a' }}>
              {producer.avatar_initials || 'PR'}
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">{producer.name}</h2>
              <p className="text-xs text-gray-500 font-medium">{producer.country_flag} {producer.country} • {producer.city || 'Ville non précisée'}</p>
              <p className="text-xs text-brand-600 font-bold mt-1">Score EthiMarket : {producer.ethimarket_score ?? 80}/100</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-gray-600 border-l border-gray-100 pl-4">
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold">{producer.business_email || 'Email non renseigné'}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold">{producer.phone || producer.whatsapp || 'Téléphone non renseigné'}</span>
            </p>
            <p className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <span>Org: {producer.org_type || 'Indépendant'} (N° {producer.registration_number || 'En attente'})</span>
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-gray-500">Profil complété :</span>
              <span className="text-gray-900 font-bold">{producer.profile_completion ?? 75}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${producer.profile_completion ?? 75}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-gray-500 pt-1">
              <span>Audits réalisés : {producer.audit_count || 0}</span>
              <span>Dernier : {producer.last_audit_date ? new Date(producer.last_audit_date).toLocaleDateString('fr-FR') : 'Aucun'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: DOCUMENTS D'IDENTITÉ */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <span>🪪</span> SECTION B : Documents d'Identité Officiels
          </h3>
          <span className="text-xs font-semibold text-gray-500">
            N° {producer.identity_number || 'Non renseigné'} • Expiration : {producer.identity_expiry || '—'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocumentViewer
            title="Pièce d'identité (Recto)"
            url={producer.identity_recto_url || identityDocs.find(d => d.doc_type === 'id_card')?.file_path}
            docType="image"
            status={docStatuses['id_recto']?.status || 'pending'}
            comment={docStatuses['id_recto']?.comment || ''}
            onStatusChange={(st, c) => handleDocStatusChange('id_recto', st, c)}
            required
          />
          <DocumentViewer
            title="Pièce d'identité (Verso)"
            url={producer.identity_verso_url || identityDocs.find(d => d.doc_type === 'id_card_verso')?.file_path}
            docType="image"
            status={docStatuses['id_verso']?.status || 'pending'}
            comment={docStatuses['id_verso']?.comment || ''}
            onStatusChange={(st, c) => handleDocStatusChange('id_verso', st, c)}
            required
          />
        </div>
      </div>

      {/* SECTION C: DOCUMENTS ENTREPRISE */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 pb-3 border-b border-gray-100">
          <span>🏢</span> SECTION C : Conformité Légale & Documents d'Entreprise
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocumentViewer
            title="Registre du commerce / RCCM / SIRET"
            url={identityDocs.find(d => d.doc_type === 'business_reg')?.file_path || producer.business_documents?.trade_register}
            status={docStatuses['business_reg']?.status || 'pending'}
            onStatusChange={(st, c) => handleDocStatusChange('business_reg', st, c)}
            required
          />
          <DocumentViewer
            title="Statuts de la société"
            url={identityDocs.find(d => d.doc_type === 'company_statutes')?.file_path || producer.business_documents?.statutes}
            status={docStatuses['company_statutes']?.status || 'pending'}
            onStatusChange={(st, c) => handleDocStatusChange('company_statutes', st, c)}
            required
          />
          <DocumentViewer
            title="Attestation d'existence légale (< 6 mois)"
            url={identityDocs.find(d => d.doc_type === 'legal_existence')?.file_path}
            status={docStatuses['legal_existence']?.status || 'pending'}
            onStatusChange={(st, c) => handleDocStatusChange('legal_existence', st, c)}
          />
          <DocumentViewer
            title="Justificatif de domicile de l'exploitation"
            url={identityDocs.find(d => d.doc_type === 'proof_of_address')?.file_path}
            status={docStatuses['proof_of_address']?.status || 'pending'}
            onStatusChange={(st, c) => handleDocStatusChange('proof_of_address', st, c)}
            required
          />
        </div>
      </div>

      {/* SECTION D: CERTIFICATIONS */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <span>🌱</span> SECTION D : Certifications Bio & Éthiques
          </h3>
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
            {certifications.length} certification(s) déclarée(s)
          </span>
        </div>

        {certifications.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Aucune certification formelle téléversée. Au moins 1 certificat valide est exigé pour l'homologation Bio/Éthique.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {certifications.map(cert => (
              <div key={cert.id} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">{cert.cert_type}</span>
                    <h4 className="font-bold text-sm text-gray-900 mt-1">N° Certificat : {cert.cert_number}</h4>
                    <p className="text-xs text-gray-500">Organisme : {cert.certifying_body} • Valide du {cert.issued_at} au {cert.expires_at}</p>
                  </div>

                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(cert.certifying_body + ' verification ' + cert.cert_number)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-brand-600" />
                    Vérifier sur le site de l'organisme
                  </a>
                </div>

                <DocumentViewer
                  title={`Document Certificat - ${cert.cert_type}`}
                  url={cert.file_path}
                  status={docStatuses[`cert_${cert.id}`]?.status || 'pending'}
                  onStatusChange={(st, c) => handleDocStatusChange(`cert_${cert.id}`, st, c)}
                  required
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION E: EXPLOITATION */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 pb-3 border-b border-gray-100">
          <span>🚜</span> SECTION E : Exploitation & Photos de Terrain
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold text-gray-700 mb-2">Localisation & Coordonnées GPS</h4>
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs space-y-1 mb-3">
              <p><span className="font-semibold text-gray-500">Adresse :</span> {parsedLocation.address || producer.address || 'Non renseignée'}</p>
              <p><span className="font-semibold text-gray-500">Ville / Région :</span> {parsedLocation.city || producer.city}, {parsedLocation.region || producer.region}</p>
              <p><span className="font-semibold text-gray-500">GPS :</span> {parsedLocation.lat && parsedLocation.lng ? `${parsedLocation.lat}, ${parsedLocation.lng}` : producer.latitude && producer.longitude ? `${producer.latitude}, ${producer.longitude}` : 'Non saisi'}</p>
            </div>

            {((parsedLocation.lat && parsedLocation.lng) || (producer.latitude && producer.longitude)) && (
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <LeafletMap
                  markers={[{
                    lat: parseFloat(parsedLocation.lat || String(producer.latitude!)),
                    lng: parseFloat(parsedLocation.lng || String(producer.longitude!)),
                    label: producer.name
                  }]}
                  height="200px"
                  zoom={12}
                />
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-700 mb-2">Photos de l'exploitation (Min. 5 recommandées)</h4>
            {producer.farm_photos && producer.farm_photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {producer.farm_photos.map((photoUrl, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img src={photoUrl} alt={`Exploitation ${i+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-500">
                Aucune photo d'exploitation téléversée dans la galerie principale.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION F: ENGAGEMENT ÉTHIQUE */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 pb-3 border-b border-gray-100">
          <span>📜</span> SECTION F : Charte Éthique & Conditions Sociales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Charte éthique signée</p>
            <div className="flex items-center gap-2">
              {producer.ethical_charter_signed ? (
                <span className="text-xs font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Oui (Signée)
                </span>
              ) : (
                <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Non signée</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Employés déclarés</p>
            <p className="text-sm font-black text-gray-900">
              {ethical?.employee_count || producer.employee_count || 0} personnes
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Salaire minimum garanti</p>
            <p className="text-sm font-black text-brand-600">
              {ethical?.min_wage || producer.min_wage || 'Non spécifié'}
            </p>
          </div>
        </div>

        {ethical && (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-xs">
            <p className="font-bold text-gray-900">Description des conditions de travail :</p>
            <p className="text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-gray-200">
              {ethical.working_conditions_desc || 'Aucune description fournie.'}
            </p>
          </div>
        )}
      </div>

      {/* CONTINUOUS CONTROL / SCHEDULE AUDIT */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Contrôle Continu & Prochain Audit Périodique (Bureau Veritas)
          </h4>
          <p className="text-xs text-blue-700 mt-0.5">
            Définissez la date du prochain audit obligatoire de contrôle continu (recommandé : 6 mois).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-blue-600" />
          <input
            type="date"
            value={nextAuditDate}
            onChange={e => setNextAuditDate(e.target.value)}
            className="px-3 py-2 text-xs border border-blue-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800"
          />
        </div>
      </div>

      {/* SECTION G: DÉCISION FINALE */}
      <DecisionPanel
        currentStatus={status}
        onApprove={(intNotes, prodComment, checklist) => updateProducerStatus('approved', intNotes, prodComment, checklist)}
        onReject={(intNotes, prodComment, checklist) => updateProducerStatus('rejected', intNotes, prodComment, checklist)}
        onRequestChanges={(intNotes, prodComment, checklist) => updateProducerStatus('draft', intNotes, prodComment, checklist)}
        loading={actionLoading}
      />

      {/* HISTORIQUE DES ACTIONS D'AUDIT */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 pb-3 border-b border-gray-100">
            <History className="w-4 h-4 text-gray-500" /> Historique des Audits & Décisions Passées
          </h3>
          <div className="space-y-2">
            {history.map((h, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900">{h.action}</span>
                  <span className="text-gray-500 ml-2">({h.old_status || 'draft'} ➔ {h.new_status})</span>
                  {h.reason && <p className="text-gray-600 mt-0.5">Motif : {h.reason}</p>}
                </div>
                <span className="text-gray-400 font-medium">
                  {new Date(h.created_at).toLocaleDateString('fr-FR')} {new Date(h.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
