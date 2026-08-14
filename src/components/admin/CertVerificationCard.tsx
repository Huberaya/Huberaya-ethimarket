import { useState, useMemo } from 'react';
import { 
  Building2, ExternalLink, CheckCircle2, XCircle, Clock, 
  Copy, Check, Globe, Mail, Phone, AlertCircle, FileText,
  Search, ShieldCheck, HelpCircle
} from 'lucide-react';
import type { CertificationBody } from '../../lib/supabase';
import { DocumentViewer } from './DocumentViewer';

export interface ProducerCertItem {
  id: string;
  cert_type: string;
  cert_number?: string;
  certifying_body?: string;
  issued_at?: string;
  expires_at?: string;
  file_path?: string;
  status?: string;
  notes?: string;
}

interface CertVerificationCardProps {
  cert: ProducerCertItem;
  knownBodies?: CertificationBody[];
  onStatusChange?: (status: 'verified' | 'rejected' | 'pending', notes: string) => void;
  initialStatus?: 'verified' | 'rejected' | 'pending';
  initialNotes?: string;
}

// Built-in fallback database in case DB hasn't been populated yet
const DEFAULT_BODIES: Partial<CertificationBody>[] = [
  {
    name: 'Ecocert SA',
    short_name: 'Ecocert',
    website: 'https://www.ecocert.com',
    verification_url: 'https://certificat.ecocert.com',
    verification_instructions: 'Entrez le numéro de certificat sur certificat.ecocert.com pour vérifier sa validité.',
    headquarters_country: 'France',
    contact_email: 'info@ecocert.com',
    certification_types: ['Bio', 'EU Organic', 'Cosmétique bio', 'Textile bio', 'Commerce équitable']
  },
  {
    name: 'Bureau Veritas Certification',
    short_name: 'Bureau Veritas',
    website: 'https://www.bureauveritas.fr',
    verification_url: 'https://certification.bureauveritas.com/verification',
    verification_instructions: 'Utilisez le portail de vérification Bureau Veritas avec le numéro de certificat.',
    headquarters_country: 'France',
    contact_email: 'certification@bureauveritas.com',
    certification_types: ['ISO 9001', 'ISO 14001', 'FSSC 22000', 'Bio', 'RSE']
  },
  {
    name: 'AFNOR Certification',
    short_name: 'AFNOR',
    website: 'https://certification.afnor.org',
    verification_url: 'https://certification.afnor.org/recherche-certificat',
    verification_instructions: 'Recherchez le certificat sur le portail AFNOR Certification.',
    headquarters_country: 'France',
    contact_email: 'certification@afnor.org',
    certification_types: ['NF', 'ISO', 'Bio AB']
  },
  {
    name: 'Control Union Certifications',
    short_name: 'Control Union',
    website: 'https://www.controlunion.com',
    verification_url: 'https://www.controlunion.com/certificate-database',
    verification_instructions: 'Recherchez dans la base de données des certificats Control Union.',
    headquarters_country: 'Pays-Bas',
    contact_email: 'info@controlunion.com',
    certification_types: ['Bio', 'GOTS', 'GlobalG.A.P.', 'UTZ', 'Rainforest Alliance']
  },
  {
    name: 'SGS SA',
    short_name: 'SGS',
    website: 'https://www.sgs.com',
    verification_url: 'https://www.sgs.com/en/certified-clients-and-products',
    verification_instructions: 'Vérifiez les clients certifiés SGS via leur portail de recherche.',
    headquarters_country: 'Suisse',
    contact_email: 'sgs.verification@sgs.com',
    certification_types: ['ISO', 'HACCP', 'Bio', 'GlobalG.A.P.', 'BRC', 'IFS']
  },
  {
    name: 'Fairtrade International',
    short_name: 'Fairtrade',
    website: 'https://www.fairtrade.net',
    verification_url: 'https://www.fairtrade.net/about/find-producers',
    verification_instructions: 'Recherchez le producteur dans la base Fairtrade Producer Search. Entrez le FLO-ID ou le nom.',
    headquarters_country: 'Allemagne',
    contact_email: 'info@fairtrade.net',
    certification_types: ['Fairtrade', 'Commerce équitable']
  },
  {
    name: 'FLO-CERT',
    short_name: 'FLO-CERT',
    website: 'https://www.flocert.net',
    verification_url: 'https://www.flocert.net/about-flocert/customer-search/',
    verification_instructions: 'Utilisez la recherche FLO-CERT Customer Search avec le nom de l\'organisation.',
    headquarters_country: 'Allemagne',
    contact_email: 'info@flocert.net',
    certification_types: ['Fairtrade']
  },
  {
    name: 'Demeter International',
    short_name: 'Demeter',
    website: 'https://www.demeter.net',
    verification_url: 'https://www.demeter.net/find-demeter/',
    verification_instructions: 'Recherchez les producteurs Demeter certifiés sur le portail Find Demeter.',
    headquarters_country: 'Allemagne',
    contact_email: 'info@demeter.net',
    certification_types: ['Biodynamie', 'Demeter']
  },
  {
    name: 'Rainforest Alliance',
    short_name: 'Rainforest Alliance',
    website: 'https://www.rainforest-alliance.org',
    verification_url: 'https://www.rainforest-alliance.org/find-certified/',
    verification_instructions: 'Utilisez la recherche Find Certified pour vérifier un producteur Rainforest Alliance.',
    headquarters_country: 'États-Unis',
    contact_email: 'info@ra.org',
    certification_types: ['Rainforest Alliance Certified', 'UTZ']
  },
  {
    name: 'GlobalG.A.P.',
    short_name: 'GlobalGAP',
    website: 'https://www.globalgap.org',
    verification_url: 'https://database.globalgap.org/globalgap/search/SearchMain.faces',
    verification_instructions: 'Recherchez le producteur dans la base de données GLOBALG.A.P. (GGN).',
    headquarters_country: 'Allemagne',
    contact_email: 'info@globalgap.org',
    certification_types: ['GlobalG.A.P.', 'GRASP']
  },
  {
    name: 'USDA Organic',
    short_name: 'USDA',
    website: 'https://www.usda.gov',
    verification_url: 'https://organic.ams.usda.gov/integrity/',
    verification_instructions: 'Recherchez dans la base Organic Integrity Database de l\'USDA.',
    headquarters_country: 'États-Unis',
    contact_email: 'organic@usda.gov',
    certification_types: ['USDA Organic', 'NOP']
  },
  {
    name: 'GOTS (Global Organic Textile Standard)',
    short_name: 'GOTS',
    website: 'https://global-standard.org',
    verification_url: 'https://global-standard.org/find-suppliers-shops/certified-suppliers/',
    verification_instructions: 'Recherchez les fournisseurs certifiés GOTS dans leur base publique.',
    headquarters_country: 'Allemagne',
    contact_email: 'info@global-standard.org',
    certification_types: ['GOTS', 'Textile bio']
  },
  {
    name: 'OEKO-TEX',
    short_name: 'OEKO-TEX',
    website: 'https://www.oeko-tex.com',
    verification_url: 'https://www.oeko-tex.com/en/buying-guide',
    verification_instructions: 'Vérifiez les labels OEKO-TEX via le Buying Guide.',
    headquarters_country: 'Suisse',
    contact_email: 'info@oeko-tex.com',
    certification_types: ['OEKO-TEX Standard 100', 'OEKO-TEX Made in Green']
  },
  {
    name: 'Certisys',
    short_name: 'Certisys',
    website: 'https://www.certisys.eu',
    verification_url: 'https://www.certisys.eu/fr/rechercher-un-operateur',
    verification_instructions: 'Recherchez un opérateur certifié sur le portail Certisys.',
    headquarters_country: 'Belgique',
    contact_email: 'info@certisys.eu',
    certification_types: ['Bio', 'EU Organic']
  }
];

export default function CertVerificationCard({
  cert,
  knownBodies = [],
  onStatusChange,
  initialStatus = 'pending',
  initialNotes = ''
}: CertVerificationCardProps) {
  const [verifStatus, setVerifStatus] = useState<'verified' | 'rejected' | 'pending'>(initialStatus);
  const [adminNotes, setAdminNotes] = useState(initialNotes || cert.notes || '');
  const [copied, setCopied] = useState(false);

  // All bodies pool
  const allBodies = useMemo(() => {
    const map = new Map<string, Partial<CertificationBody>>();
    DEFAULT_BODIES.forEach(b => map.set(b.name!.toLowerCase(), b));
    knownBodies.forEach(b => map.set(b.name.toLowerCase(), b));
    return Array.from(map.values());
  }, [knownBodies]);

  // Auto-matching algorithm
  const matchedBody = useMemo(() => {
    const rawBody = (cert.certifying_body || '').trim().toLowerCase();
    const rawType = (cert.cert_type || '').trim().toLowerCase();
    const rawNum = (cert.cert_number || '').trim().toLowerCase();

    if (!rawBody && !rawType) return null;

    // 1. Direct match by body name / short_name
    for (const b of allBodies) {
      const bName = (b.name || '').toLowerCase();
      const bShort = (b.short_name || '').toLowerCase();
      if (rawBody.includes(bShort) || rawBody.includes(bName) || bName.includes(rawBody)) {
        return b;
      }
    }

    // 2. Match by known keywords in certifying body
    if (rawBody.includes('ecocert') || rawType.includes('ecocert')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'ecocert');
    }
    if (rawBody.includes('fairtrade') || rawType.includes('fairtrade') || rawNum.startsWith('flo')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'fairtrade');
    }
    if (rawBody.includes('flocert') || rawBody.includes('flo-cert')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'flo-cert');
    }
    if (rawBody.includes('bureau veritas') || rawBody.includes('bv') || rawType.includes('bureau veritas')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'bureau veritas');
    }
    if (rawBody.includes('afnor') || rawType.includes('afnor') || rawType.includes('ab')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'afnor');
    }
    if (rawBody.includes('control union') || rawType.includes('control union')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'control union');
    }
    if (rawBody.includes('sgs') || rawType.includes('sgs')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'sgs');
    }
    if (rawBody.includes('demeter') || rawType.includes('demeter') || rawType.includes('biodynamie')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'demeter');
    }
    if (rawBody.includes('rainforest') || rawType.includes('rainforest') || rawType.includes('utz')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'rainforest alliance');
    }
    if (rawBody.includes('globalgap') || rawBody.includes('globalg.a.p') || rawType.includes('globalgap')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'globalgap');
    }
    if (rawBody.includes('usda') || rawType.includes('usda') || rawType.includes('nop')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'usda');
    }
    if (rawBody.includes('gots') || rawType.includes('gots')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'gots');
    }
    if (rawBody.includes('oeko') || rawType.includes('oeko')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'oeko-tex');
    }
    if (rawBody.includes('certisys')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'certisys');
    }

    // 3. Fallback heuristic on type
    if (rawType.includes('bio') || rawType.includes('organic')) {
      return allBodies.find(b => b.short_name?.toLowerCase() === 'ecocert');
    }

    return null;
  }, [cert, allBodies]);

  const handleCopyNum = () => {
    if (cert.cert_number) {
      navigator.clipboard.writeText(cert.cert_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStatusChange = (newStatus: 'verified' | 'rejected' | 'pending') => {
    setVerifStatus(newStatus);
    onStatusChange?.(newStatus, adminNotes);
  };

  const handleNotesChange = (val: string) => {
    setAdminNotes(val);
    onStatusChange?.(verifStatus, val);
  };

  // Expiration calculation
  const isExpired = cert.expires_at ? new Date(cert.expires_at) < new Date() : false;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-5 transition-all">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-brand-100 text-brand-800 font-black text-xs rounded-full">
              {cert.cert_type}
            </span>
            {isExpired ? (
              <span className="px-2.5 py-0.5 bg-red-100 text-red-700 font-bold text-[11px] rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Expiré le {cert.expires_at}
              </span>
            ) : cert.expires_at ? (
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 font-medium text-[11px] rounded-full">
                Expire le : {cert.expires_at}
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <h4 className="font-black text-base text-gray-900">
              N° : <span className="font-mono text-brand-700">{cert.cert_number || 'Non précisé'}</span>
            </h4>
            {cert.cert_number && (
              <button
                type="button"
                onClick={handleCopyNum}
                title="Copier le numéro"
                className="p-1 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-600 mt-1">
            Organisme déclaré : <strong className="text-gray-900">{cert.certifying_body || 'Non spécifié'}</strong>
            {cert.issued_at && ` • Délivré le : ${cert.issued_at}`}
          </p>
        </div>

        {/* Status indicator on top right */}
        <div>
          {verifStatus === 'verified' && (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Vérifié officiel
            </span>
          )}
          {verifStatus === 'rejected' && (
            <span className="px-3 py-1.5 bg-red-100 text-red-800 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs">
              <XCircle className="w-4 h-4 text-red-600" /> Non valide / Faux
            </span>
          )}
          {verifStatus === 'pending' && (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs">
              <Clock className="w-4 h-4 text-amber-600" /> En attente de contrôle
            </span>
          )}
        </div>
      </div>

      {/* VÉRIFICATION RAPIDE (1 CLIC) */}
      <div className="bg-gradient-to-br from-emerald-50/70 via-gray-50 to-blue-50/50 border-2 border-brand-200/80 rounded-2xl p-4 md:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-brand-600 text-white rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-brand-900">
              Vérification Rapide & Organisme Certificateur
            </span>
          </div>
          {matchedBody && (
            <span className="text-[11px] font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-md">
              Organisme auto-détecté ⚡
            </span>
          )}
        </div>

        {matchedBody ? (
          <div className="bg-white/90 backdrop-blur-xs rounded-xl p-4 border border-brand-100 space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <h5 className="font-black text-sm text-gray-900">{matchedBody.name}</h5>
                  {matchedBody.headquarters_country && (
                    <span className="text-[11px] text-gray-500 font-medium">({matchedBody.headquarters_country})</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 pt-0.5">
                  {matchedBody.website && (
                    <a
                      href={matchedBody.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-600 flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      {matchedBody.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {matchedBody.contact_email && (
                    <a
                      href={`mailto:${matchedBody.contact_email}`}
                      className="hover:text-brand-600 flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {matchedBody.contact_email}
                    </a>
                  )}
                  {matchedBody.contact_phone && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {matchedBody.contact_phone}
                    </span>
                  )}
                </div>
              </div>

              {/* DIRECT VERIFICATION BUTTON */}
              {matchedBody.verification_url ? (
                <a
                  href={matchedBody.verification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-4 py-2.5 text-xs font-black bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center gap-2 shadow-md whitespace-nowrap transition-transform active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  <span>Vérifier sur {matchedBody.short_name || 'le portail'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              ) : (
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent((matchedBody.name || '') + ' verification certificat ' + (cert.cert_number || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                >
                  <Search className="w-3.5 h-3.5 text-gray-500" />
                  Rechercher sur Google
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Instructions box */}
            {matchedBody.verification_instructions && (
              <div className="p-3 bg-brand-50/60 border border-brand-100 rounded-xl text-xs text-brand-900 flex items-start gap-2">
                <span className="font-bold text-brand-700 flex-shrink-0">ℹ️ Consigne :</span>
                <span className="italic leading-relaxed">{matchedBody.verification_instructions}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/80 rounded-xl p-4 border border-amber-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-gray-900">Organisme non reconnu automatiquement</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Effectuez une recherche manuelle avec le numéro de certificat pour confirmer l'accréditation.
                  </p>
                </div>
              </div>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent((cert.certifying_body || cert.cert_type || '') + ' verification certificat ' + (cert.cert_number || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-xs font-bold bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5 text-gray-500" />
                Recherche Web
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* PDF / File Document Viewer */}
      {cert.file_path && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-600" /> Document officiel fourni par le producteur :
          </h5>
          <DocumentViewer
            title={`Certificat — ${cert.cert_type} (${cert.cert_number || 'Sans numéro'})`}
            url={cert.file_path}
            docType="pdf"
            status={verifStatus === 'verified' ? 'valid' : verifStatus === 'rejected' ? 'invalid' : 'pending'}
            comment={adminNotes}
            onStatusChange={(newSt, comment) => {
              const mapped = newSt === 'valid' ? 'verified' : newSt === 'invalid' ? 'rejected' : 'pending';
              handleStatusChange(mapped);
              if (comment) handleNotesChange(comment);
            }}
            required
          />
        </div>
      )}

      {/* DECISION & NOTES INTERACTIVES */}
      <div className="pt-3 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-700 mr-1">Résultat :</span>
          
          <button
            type="button"
            onClick={() => handleStatusChange('verified')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              verifStatus === 'verified'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            ✅ Vérifié & Conforme
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('rejected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              verifStatus === 'rejected'
                ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-600/30'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            ❌ Faux / Expiré
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              verifStatus === 'pending'
                ? 'bg-gray-800 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            ⏳ En attente
          </button>
        </div>

        {/* Admin Notes */}
        <div className="w-full md:w-80">
          <input
            type="text"
            value={adminNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Notes d'audit (ex: vérifié sur base officielle)..."
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-gray-50/50"
          />
        </div>
      </div>
    </div>
  );
}
