import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, Search, Filter, Globe, ExternalLink, Mail, Phone,
  Plus, Check, X, Loader2, ShieldCheck, MapPin, Award,
  Info
} from 'lucide-react';
import { supabase, type CertificationBody } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';

// Fallback dataset in case table is freshly created before migration script run
const FALLBACK_BODIES: Partial<CertificationBody>[] = [
  {
    name: 'Ecocert SA',
    short_name: 'Ecocert',
    website: 'https://www.ecocert.com',
    verification_url: 'https://certificat.ecocert.com',
    verification_instructions: 'Entrez le numéro de certificat sur certificat.ecocert.com pour vérifier sa validité.',
    description: 'Organisme de certification bio leader mondial, fondé en 1991.',
    headquarters_country: 'France',
    coverage: ['Mondial', 'Europe', 'Afrique', 'Asie', 'Amérique'],
    certification_types: ['Bio', 'EU Organic', 'Cosmétique bio', 'Textile bio', 'Commerce équitable'],
    contact_email: 'info@ecocert.com',
    is_active: true
  },
  {
    name: 'Bureau Veritas Certification',
    short_name: 'Bureau Veritas',
    website: 'https://www.bureauveritas.fr',
    verification_url: 'https://certification.bureauveritas.com/verification',
    verification_instructions: 'Utilisez le portail de vérification Bureau Veritas avec le numéro de certificat.',
    description: 'Leader mondial en certification, inspection et audit.',
    headquarters_country: 'France',
    coverage: ['Mondial'],
    certification_types: ['ISO 9001', 'ISO 14001', 'FSSC 22000', 'Bio', 'RSE'],
    contact_email: 'certification@bureauveritas.com',
    is_active: true
  },
  {
    name: 'AFNOR Certification',
    short_name: 'AFNOR',
    website: 'https://certification.afnor.org',
    verification_url: 'https://certification.afnor.org/recherche-certificat',
    verification_instructions: 'Recherchez le certificat sur le portail AFNOR Certification.',
    description: 'Association française de normalisation.',
    headquarters_country: 'France',
    coverage: ['France', 'Europe', 'Afrique francophone'],
    certification_types: ['NF', 'ISO', 'Bio AB'],
    contact_email: 'certification@afnor.org',
    is_active: true
  },
  {
    name: 'Control Union Certifications',
    short_name: 'Control Union',
    website: 'https://www.controlunion.com',
    verification_url: 'https://www.controlunion.com/certificate-database',
    verification_instructions: 'Recherchez dans la base de données des certificats Control Union.',
    description: 'Organisme néerlandais de certification durable.',
    headquarters_country: 'Pays-Bas',
    coverage: ['Mondial', 'Europe', 'Asie', 'Afrique'],
    certification_types: ['Bio', 'GOTS', 'GlobalG.A.P.', 'UTZ', 'Rainforest Alliance'],
    contact_email: 'info@controlunion.com',
    is_active: true
  },
  {
    name: 'SGS SA',
    short_name: 'SGS',
    website: 'https://www.sgs.com',
    verification_url: 'https://www.sgs.com/en/certified-clients-and-products',
    verification_instructions: 'Vérifiez les clients certifiés SGS via leur portail de recherche.',
    description: 'Société Générale de Surveillance, leader mondial inspection.',
    headquarters_country: 'Suisse',
    coverage: ['Mondial'],
    certification_types: ['ISO', 'HACCP', 'Bio', 'GlobalG.A.P.', 'BRC', 'IFS'],
    contact_email: 'sgs.verification@sgs.com',
    is_active: true
  },
  {
    name: 'Fairtrade International',
    short_name: 'Fairtrade',
    website: 'https://www.fairtrade.net',
    verification_url: 'https://www.fairtrade.net/about/find-producers',
    verification_instructions: 'Recherchez le producteur dans la base Fairtrade Producer Search. Entrez le FLO-ID.',
    description: 'Organisation mondiale du commerce équitable, label le plus reconnu.',
    headquarters_country: 'Allemagne',
    coverage: ['Mondial', 'Afrique', 'Amérique latine', 'Asie'],
    certification_types: ['Fairtrade', 'Commerce équitable'],
    contact_email: 'info@fairtrade.net',
    is_active: true
  },
  {
    name: 'FLO-CERT',
    short_name: 'FLO-CERT',
    website: 'https://www.flocert.net',
    verification_url: 'https://www.flocert.net/about-flocert/customer-search/',
    verification_instructions: 'Utilisez la recherche FLO-CERT Customer Search avec le nom de l organisme.',
    description: 'Organisme de certification indépendant de Fairtrade.',
    headquarters_country: 'Allemagne',
    coverage: ['Mondial'],
    certification_types: ['Fairtrade'],
    contact_email: 'info@flocert.net',
    is_active: true
  },
  {
    name: 'World Fair Trade Organization',
    short_name: 'WFTO',
    website: 'https://wfto.com',
    verification_url: 'https://wfto.com/who-we-are#members',
    verification_instructions: 'Vérifiez si le producteur est membre du WFTO via la liste des membres.',
    description: 'Réseau mondial du commerce équitable.',
    headquarters_country: 'Pays-Bas',
    coverage: ['Mondial'],
    certification_types: ['Commerce équitable', 'WFTO Guarantee System'],
    contact_email: 'info@wfto.com',
    is_active: true
  },
  {
    name: 'SPP Global',
    short_name: 'SPP',
    website: 'https://spp.coop',
    verification_url: 'https://spp.coop/registre/',
    verification_instructions: 'Consultez le registre SPP des petits producteurs certifiés.',
    description: 'Symbole des Petits Producteurs, certification pour organisations paysannes.',
    headquarters_country: 'Mexique',
    coverage: ['Amérique latine', 'Afrique', 'Asie'],
    certification_types: ['SPP', 'Commerce équitable petits producteurs'],
    contact_email: 'info@spp.coop',
    is_active: true
  },
  {
    name: 'Demeter International',
    short_name: 'Demeter',
    website: 'https://www.demeter.net',
    verification_url: 'https://www.demeter.net/find-demeter/',
    verification_instructions: 'Recherchez les producteurs Demeter certifiés sur le portail Find Demeter.',
    description: 'Certification biodynamique, la plus exigeante du bio.',
    headquarters_country: 'Allemagne',
    coverage: ['Mondial', 'Europe', 'Amérique', 'Asie'],
    certification_types: ['Biodynamie', 'Demeter'],
    contact_email: 'info@demeter.net',
    is_active: true
  },
  {
    name: 'Nature & Progrès',
    short_name: 'N&P',
    website: 'https://www.natureetprogres.org',
    verification_url: 'https://www.natureetprogres.org/les-professionnels/',
    verification_instructions: 'Consultez la liste des professionnels certifiés Nature & Progrès.',
    description: 'Association française de promotion de l agriculture bio et biodynamique.',
    headquarters_country: 'France',
    coverage: ['France'],
    certification_types: ['Bio', 'Mention Nature & Progrès'],
    contact_email: 'federation@natureetprogres.org',
    is_active: true
  },
  {
    name: 'Rainforest Alliance',
    short_name: 'RA',
    website: 'https://www.rainforest-alliance.org',
    verification_url: 'https://www.rainforest-alliance.org/find-certified/',
    verification_instructions: 'Utilisez la recherche Find Certified pour vérifier un producteur Rainforest Alliance.',
    description: 'Organisation de certification pour agriculture durable.',
    headquarters_country: 'États-Unis',
    coverage: ['Mondial', 'Afrique', 'Amérique latine', 'Asie'],
    certification_types: ['Rainforest Alliance Certified', 'UTZ'],
    contact_email: 'info@ra.org',
    is_active: true
  },
  {
    name: 'GlobalG.A.P.',
    short_name: 'GlobalGAP',
    website: 'https://www.globalgap.org',
    verification_url: 'https://database.globalgap.org/globalgap/search/SearchMain.faces',
    verification_instructions: 'Recherchez le producteur dans la base de données GLOBALG.A.P.',
    description: 'Standard mondial de bonnes pratiques agricoles.',
    headquarters_country: 'Allemagne',
    coverage: ['Mondial'],
    certification_types: ['GlobalG.A.P.', 'GRASP', 'localg.a.p.'],
    contact_email: 'info@globalgap.org',
    is_active: true
  },
  {
    name: 'USDA Organic',
    short_name: 'USDA',
    website: 'https://www.usda.gov',
    verification_url: 'https://organic.ams.usda.gov/integrity/',
    verification_instructions: 'Recherchez dans la base Organic Integrity Database de l USDA.',
    description: 'Certification biologique du Département de l Agriculture des États-Unis.',
    headquarters_country: 'États-Unis',
    coverage: ['États-Unis', 'Mondial'],
    certification_types: ['USDA Organic', 'NOP'],
    contact_email: 'organic@usda.gov',
    is_active: true
  },
  {
    name: 'Canada Organic',
    short_name: 'COR',
    website: 'https://inspection.canada.ca',
    verification_url: 'https://inspection.canada.ca/organic-products',
    verification_instructions: 'Vérifiez via l Agence canadienne d inspection des aliments.',
    description: 'Régime biologique canadien.',
    headquarters_country: 'Canada',
    coverage: ['Canada'],
    certification_types: ['Canada Organic', 'COR'],
    contact_email: 'cfia.organic@inspection.gc.ca',
    is_active: true
  },
  {
    name: 'GOTS',
    short_name: 'GOTS',
    website: 'https://global-standard.org',
    verification_url: 'https://global-standard.org/find-suppliers-shops/certified-suppliers/',
    verification_instructions: 'Recherchez les fournisseurs certifiés GOTS dans leur base de données.',
    description: 'Global Organic Textile Standard, textile bio.',
    headquarters_country: 'Allemagne',
    coverage: ['Mondial'],
    certification_types: ['GOTS', 'Textile bio'],
    contact_email: 'info@global-standard.org',
    is_active: true
  },
  {
    name: 'OEKO-TEX',
    short_name: 'OEKO-TEX',
    website: 'https://www.oeko-tex.com',
    verification_url: 'https://www.oeko-tex.com/en/buying-guide',
    verification_instructions: 'Vérifiez les labels OEKO-TEX via le Buying Guide.',
    description: 'Association internationale pour la sécurité textile.',
    headquarters_country: 'Suisse',
    coverage: ['Mondial'],
    certification_types: ['OEKO-TEX Standard 100', 'OEKO-TEX Made in Green'],
    contact_email: 'info@oeko-tex.com',
    is_active: true
  }
];

export default function AdminCertBodies() {
  const [bodies, setBodies] = useState<CertificationBody[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Modals
  const [selectedBody, setSelectedBody] = useState<CertificationBody | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingNew, setSavingNew] = useState(false);

  // New Body Form State
  const [newBody, setNewBody] = useState({
    name: '',
    short_name: '',
    website: '',
    verification_url: '',
    verification_instructions: '',
    description: '',
    headquarters_country: 'France',
    coverage: 'Mondial',
    certification_types: 'Bio, Éthique',
    contact_email: '',
    contact_phone: '',
  });

  const loadBodies = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certification_bodies')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        // Fallback
        setBodies(FALLBACK_BODIES as CertificationBody[]);
      } else {
        setBodies(data as CertificationBody[]);
      }
    } catch (e) {
      console.warn('Error loading cert bodies:', e);
      setBodies(FALLBACK_BODIES as CertificationBody[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBodies();
  }, [loadBodies]);

  // Countries list for filter
  const countries = useMemo(() => {
    const set = new Set<string>();
    bodies.forEach(b => {
      if (b.headquarters_country) set.add(b.headquarters_country);
    });
    return Array.from(set).sort();
  }, [bodies]);

  // Types list for filter
  const allTypes = useMemo(() => {
    const set = new Set<string>();
    bodies.forEach(b => {
      b.certification_types?.forEach(t => set.add(t));
    });
    return Array.from(set).sort();
  }, [bodies]);

  // Filtered bodies
  const filtered = useMemo(() => {
    return bodies.filter(b => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(q) || b.short_name?.toLowerCase().includes(q);
        const matchesDesc = b.description?.toLowerCase().includes(q);
        const matchesType = b.certification_types?.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesType) return false;
      }

      if (selectedCountry !== 'all' && b.headquarters_country !== selectedCountry) {
        return false;
      }

      if (selectedType !== 'all' && !b.certification_types?.includes(selectedType)) {
        return false;
      }

      return true;
    });
  }, [bodies, search, selectedCountry, selectedType]);

  // Handle create new body
  const handleCreateBody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.name || !newBody.website) return;

    setSavingNew(true);
    const payload = {
      name: newBody.name.trim(),
      short_name: newBody.short_name.trim() || newBody.name.trim(),
      website: newBody.website.trim(),
      verification_url: newBody.verification_url.trim() || null,
      verification_instructions: newBody.verification_instructions.trim() || null,
      description: newBody.description.trim() || null,
      headquarters_country: newBody.headquarters_country.trim() || 'France',
      coverage: newBody.coverage.split(',').map(s => s.trim()).filter(Boolean),
      certification_types: newBody.certification_types.split(',').map(s => s.trim()).filter(Boolean),
      contact_email: newBody.contact_email.trim() || null,
      contact_phone: newBody.contact_phone.trim() || null,
      is_active: true,
    };

    try {
      const { data, error } = await supabase
        .from('certification_bodies')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        setBodies(prev => [data as CertificationBody, ...prev]);
      } else {
        // Fallback local update
        setBodies(prev => [{ ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() } as CertificationBody, ...prev]);
      }
      setShowAddModal(false);
      setNewBody({
        name: '',
        short_name: '',
        website: '',
        verification_url: '',
        verification_instructions: '',
        description: '',
        headquarters_country: 'France',
        coverage: 'Mondial',
        certification_types: 'Bio, Éthique',
        contact_email: '',
        contact_phone: '',
      });
    } catch (e) {
      console.error('Error inserting cert body:', e);
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Organismes de Certification Mondiaux"
        subtitle="Répertoire officiel et portails de vérification en 1 clic (Ecocert, Fairtrade, Bureau Veritas, Demeter...)"
      />

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{bodies.length}</div>
            <div className="text-xs font-semibold text-gray-500">Organismes répertoriés</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{countries.length}</div>
            <div className="text-xs font-semibold text-gray-500">Pays d'implantation</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {bodies.filter(b => Boolean(b.verification_url)).length}
            </div>
            <div className="text-xs font-semibold text-gray-500">Portails vérif. directe (1 clic)</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{allTypes.length}</div>
            <div className="text-xs font-semibold text-gray-500">Normes & Labels gérés</div>
          </div>
        </div>
      </div>

      {/* TOOLBAR & FILTERS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, label (Ecocert, Fairtrade, Bio...)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white shadow-xs"
            />
          </div>

          {/* Country filter */}
          <div className="relative w-full sm:w-48">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white appearance-none cursor-pointer shadow-xs"
            >
              <option value="all">Tous les pays</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white appearance-none cursor-pointer shadow-xs"
            >
              <option value="all">Tous les labels</option>
              {allTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un organisme</span>
        </button>
      </div>

      {/* TABLE DES ORGANISMES */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
            <p className="text-xs font-semibold">Chargement de la base des organismes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-900 text-sm">Aucun organisme trouvé</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Modifiez votre recherche ou ajoutez un nouvel organisme certificateur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-black uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4">Organisme</th>
                  <th className="py-3.5 px-4">Pays du siège</th>
                  <th className="py-3.5 px-4">Types Certifications</th>
                  <th className="py-3.5 px-4">Site Web</th>
                  <th className="py-3.5 px-4">Vérification en 1 clic</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filtered.map(body => (
                  <tr key={body.id || body.name} className="hover:bg-gray-50/80 transition-colors">
                    {/* Nom / Sigle */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-brand-100">
                          {body.short_name?.slice(0, 2).toUpperCase() || body.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                            {body.name}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            Sigle : {body.short_name || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Pays */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-[11px] font-semibold">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        {body.headquarters_country || 'Mondial'}
                      </span>
                    </td>

                    {/* Types */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {body.certification_types?.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-brand-50 text-brand-700 font-bold text-[10px] rounded-md">
                            {t}
                          </span>
                        ))}
                        {(body.certification_types?.length ?? 0) > 3 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 font-medium text-[10px] rounded-md">
                            +{(body.certification_types?.length ?? 0) - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Site Web */}
                    <td className="py-3.5 px-4">
                      {body.website ? (
                        <a
                          href={body.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>{body.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Vérification 1-clic */}
                    <td className="py-3.5 px-4">
                      {body.verification_url ? (
                        <a
                          href={body.verification_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl font-black text-[11px] inline-flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Search className="w-3 h-3 text-emerald-600" />
                          <span>Vérifier en 1 clic</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Vérification manuelle</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBody(body)}
                        className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-colors shadow-xs inline-flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5 text-gray-500" />
                        Détail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETAIL D'UN ORGANISME */}
      {selectedBody && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-black text-base flex items-center justify-center flex-shrink-0">
                  {selectedBody.short_name?.slice(0, 2).toUpperCase() || selectedBody.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{selectedBody.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {selectedBody.headquarters_country} • Sigle : <strong>{selectedBody.short_name}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBody(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            {selectedBody.description && (
              <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                {selectedBody.description}
              </p>
            )}

            {/* PORTAIL DE VÉRIFICATION */}
            <div className="p-4 bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Portail Officiel de Vérification des Certificats
                </span>
                {selectedBody.verification_url && (
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded-md">
                    Actif 1-Clic
                  </span>
                )}
              </div>

              {selectedBody.verification_instructions && (
                <p className="text-xs text-emerald-900 bg-white/80 p-3 rounded-xl border border-emerald-100 leading-relaxed">
                  <strong>Consigne d'audit :</strong> {selectedBody.verification_instructions}
                </p>
              )}

              {selectedBody.verification_url ? (
                <a
                  href={selectedBody.verification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  Ouvrir le portail de vérification ({selectedBody.verification_url})
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  Aucun portail de vérification en ligne public. Veuillez contacter l'organisme par email pour vérification manuelle.
                </p>
              )}
            </div>

            {/* Normes et Couverture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-brand-600" /> Types de certifications :
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBody.certification_types?.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white text-gray-800 font-bold text-[11px] rounded-lg border border-gray-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" /> Couverture géographique :
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBody.coverage?.map((c, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white text-gray-800 font-semibold text-[11px] rounded-lg border border-gray-200">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Contacts & Liens */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-2">
              <h5 className="font-bold text-gray-900">Coordonnées officielles de contact :</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                {selectedBody.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <a href={selectedBody.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                      {selectedBody.website}
                    </a>
                  </div>
                )}
                {selectedBody.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`mailto:${selectedBody.contact_email}`} className="text-brand-600 hover:underline">
                      {selectedBody.contact_email}
                    </a>
                  </div>
                )}
                {selectedBody.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{selectedBody.contact_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBody(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUTER UN ORGANISME */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateBody}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900">Ajouter un organisme de certification</h3>
                  <p className="text-[11px] text-gray-500">Ajout à la base mondiale pour vérification rapide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={newBody.name}
                  onChange={e => setNewBody({ ...newBody, name: e.target.value })}
                  placeholder="Ex: Ecocert SA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Sigle / Nom court</label>
                <input
                  type="text"
                  value={newBody.short_name}
                  onChange={e => setNewBody({ ...newBody, short_name: e.target.value })}
                  placeholder="Ex: Ecocert"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Site Web *</label>
                <input
                  type="url"
                  required
                  value={newBody.website}
                  onChange={e => setNewBody({ ...newBody, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Pays du siège</label>
                <input
                  type="text"
                  value={newBody.headquarters_country}
                  onChange={e => setNewBody({ ...newBody, headquarters_country: e.target.value })}
                  placeholder="Ex: France, Allemagne..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-gray-700">URL du portail de vérification</label>
                <input
                  type="url"
                  value={newBody.verification_url}
                  onChange={e => setNewBody({ ...newBody, verification_url: e.target.value })}
                  placeholder="https://certificat.organisme.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-gray-700">Instructions de vérification</label>
                <textarea
                  rows={2}
                  value={newBody.verification_instructions}
                  onChange={e => setNewBody({ ...newBody, verification_instructions: e.target.value })}
                  placeholder="Ex: Entrez le numéro de certificat pour vérifier la validité..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-gray-700">Types de certifications (séparés par des virgules)</label>
                <input
                  type="text"
                  value={newBody.certification_types}
                  onChange={e => setNewBody({ ...newBody, certification_types: e.target.value })}
                  placeholder="Bio, Fairtrade, ISO 9001..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Email de contact</label>
                <input
                  type="email"
                  value={newBody.contact_email}
                  onChange={e => setNewBody({ ...newBody, contact_email: e.target.value })}
                  placeholder="contact@organisme.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Téléphone de contact</label>
                <input
                  type="text"
                  value={newBody.contact_phone}
                  onChange={e => setNewBody({ ...newBody, contact_phone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingNew}
                className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-2"
              >
                {savingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Enregistrer l'organisme
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
