import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, X, Mail, Phone, Globe, MessageCircle, Linkedin, Instagram, Facebook,
  Download, MapPin, Leaf, Handshake, Award, User, ChevronLeft, ChevronRight,
  Users, Building2, FileSpreadsheet, RotateCcw, ExternalLink, Copy, Check, AlertCircle,
} from 'lucide-react';
import { AdminPageHeader } from '../../components/AdminLayout';
import {
  loadProspects, filterProspects, downloadCsv, saveProspectState, resetProspectState,
  displayOr, mailtoHref, normalizeUrl, EMPTY_FILTERS, PIPELINE_LABELS, PIPELINE_ORDER,
  type Prospect, type ProspectDataset, type ProspectFilters, type PipelineStatus,
} from '../../lib/producerProspects';

const PER_PAGE = 25;

const STATUS_STYLES: Record<PipelineStatus, string> = {
  nouveau: 'bg-gray-100 text-gray-700 ring-gray-200',
  a_qualifier: 'bg-amber-50 text-amber-700 ring-amber-200',
  contacte: 'bg-blue-50 text-blue-700 ring-blue-200',
  reponse: 'bg-violet-50 text-violet-700 ring-violet-200',
  refere: 'bg-brand-50 text-brand-700 ring-brand-200',
  refuse: 'bg-red-50 text-red-600 ring-red-200',
};

function StatCard({ icon: Icon, label, value, hint, tone }: {
  icon: typeof Users; label: string; value: string | number; hint?: string; tone: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold truncate">{label}</p>
        <p className="text-xl font-black text-gray-900 leading-tight">{value}</p>
        {hint && <p className="text-[11px] text-gray-400 truncate">{hint}</p>}
      </div>
    </div>
  );
}

function ContactPill({ href, icon: Icon, label, value, tone }: {
  href?: string | null; icon: typeof Mail; label: string; value?: string; tone: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      title={value ? `${label} : ${value}` : label}
      className={`w-7 h-7 rounded-lg flex items-center justify-center ${tone}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </a>
  );
}

function Field({ icon: Icon, label, value, href }: {
  icon?: typeof Mail; label: string; value: string; href?: string;
}) {
  const empty = !value;
  const content = (
    <>
      {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
        <p className={`text-sm break-words ${empty ? 'italic text-gray-400' : 'text-gray-800'}`}>
          {empty ? 'Non trouvé' : value}
        </p>
      </div>
    </>
  );
  return href && !empty ? (
    <a href={href} target="_blank" rel="noreferrer" className="flex gap-2.5 hover:opacity-80">
      {content}
    </a>
  ) : (
    <div className="flex gap-2.5">{content}</div>
  );
}

export default function AdminProspection() {
  const [dataset, setDataset] = useState<ProspectDataset | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProspectFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let alive = true;
    loadProspects()
      .then((data) => { if (alive) setDataset(data); })
      .catch((e: Error) => { if (alive) setError(e.message || 'Impossible de charger la base de prospection.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const all = dataset?.prospects ?? [];

  const filtered = useMemo(() => filterProspects(all, filters), [all, filters]);

  useEffect(() => { setPage(1); }, [filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page],
  );

  const statusCounts = useMemo(() => {
    const counts = new Map<PipelineStatus, number>();
    PIPELINE_ORDER.forEach((s) => counts.set(s, 0));
    all.forEach((p) => counts.set(p.status, (counts.get(p.status) ?? 0) + 1));
    return counts;
  }, [all]);

  const update = useCallback((prospect: Prospect, patch: { status?: PipelineStatus; note?: string }) => {
    const next: Prospect = { ...prospect, ...patch };
    setSelected(next);
    saveProspectState(prospect.id, patch);
    setDataset((prev) => prev ? {
      ...prev,
      prospects: prev.prospects.map((p) => (p.id === prospect.id ? next : p)),
    } : prev);
  }, []);

  const copy = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch { /* presse-papiers indisponible */ }
  }, []);

  const setFilter = <K extends keyof ProspectFilters>(key: K, value: ProspectFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const activeFilterCount = (Object.keys(EMPTY_FILTERS) as Array<keyof ProspectFilters>)
    .filter((k) => filters[k] !== EMPTY_FILTERS[k]).length;

  if (loading) {
    return (
      <div>
        <AdminPageHeader title="Prospection" subtitle="Base de prospection des producteurs réels" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-10 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Chargement de la base producteurs…</p>
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div>
        <AdminPageHeader title="Prospection" subtitle="Base de prospection des producteurs réels" />
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-700">Base de prospection indisponible</p>
            <p className="text-sm text-red-600 mt-1">{error || 'Données absentes.'}</p>
            <p className="text-xs text-red-500 mt-2">
              Régénérez le fichier avec <code className="bg-white px-1 rounded">python3 scripts/generate_prospects.py</code> puis redéployez.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const s = dataset.stats;

  return (
    <div>
      <AdminPageHeader
        title="Prospection"
        subtitle={`${s.total.toLocaleString('fr-FR')} producteurs réels · ${s.countries} pays · base générée le ${dataset.generatedAt || '—'}`}
      >
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Search className="w-4 h-4" /> Filtres
          {activeFilterCount > 0 && (
            <span className="bg-brand-600 text-white text-[11px] rounded-full px-1.5 py-0.5">{activeFilterCount}</span>
          )}
        </button>
        <button
          onClick={() => downloadCsv(filtered)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-card"
        >
          <Download className="w-4 h-4" /> Exporter ({filtered.length.toLocaleString('fr-FR')})
        </button>
      </AdminPageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <StatCard icon={Users} label="Producteurs" value={s.total.toLocaleString('fr-FR')} hint={`${s.countries} pays · 7 continents`} tone="bg-brand-50 text-brand-600" />
        <StatCard icon={Mail} label="Avec email" value={s.withEmail.toLocaleString('fr-FR')} hint={`${Math.round((s.withEmail / s.total) * 100)} % de la base`} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={Phone} label="Avec téléphone" value={s.withPhone.toLocaleString('fr-FR')} hint={`${s.withWhatsapp} WhatsApp`} tone="bg-violet-50 text-violet-600" />
        <StatCard icon={Globe} label="Avec site web" value={s.withWebsite.toLocaleString('fr-FR')} hint={`${s.withContact} contacts nommés`} tone="bg-amber-50 text-amber-600" />
        <StatCard icon={Handshake} label="Pipeline actif" value={(statusCounts.get('contacte')! + statusCounts.get('reponse')! + statusCounts.get('refere')!).toLocaleString('fr-FR')} hint={`${statusCounts.get('refere')!} référés`} tone="bg-brand-50 text-brand-700" />
      </div>

      {/* Recherche + filtres */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Rechercher un producteur, un pays, un produit, une certification, un contact…"
              className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            {filters.search && (
              <button onClick={() => setFilter('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value as ProspectFilters['status'])}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="all">Tous les statuts</option>
            {PIPELINE_ORDER.map((st) => (
              <option key={st} value={st}>{PIPELINE_LABELS[st]} ({statusCounts.get(st) ?? 0})</option>
            ))}
          </select>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100">
            <select value={filters.continent} onChange={(e) => setFilter('continent', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="all">Tous les continents</option>
              {dataset.continents.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.country} onChange={(e) => setFilter('country', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="all">Tous les pays ({dataset.countries.length})</option>
              {dataset.countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="all">Toutes les catégories</option>
              {dataset.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="all">Tous les types</option>
              {dataset.types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filters.bio} onChange={(e) => setFilter('bio', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="all">Bio : tous</option>
              <option value="oui">Bio confirmé</option>
              <option value="verifier">Bio à vérifier</option>
            </select>
            <select value={filters.fairTrade} onChange={(e) => setFilter('fairTrade', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="all">Équitable : tous</option>
              <option value="oui">Équitable confirmé</option>
              <option value="verifier">Équitable à vérifier</option>
            </select>
            <select value={filters.contact} onChange={(e) => setFilter('contact', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="all">Coordonnées : toutes</option>
              <option value="any">Contactable (email ou tél.)</option>
              <option value="email">Avec email</option>
              <option value="phone">Avec téléphone</option>
              <option value="website">Avec site web</option>
              <option value="none">Sans coordonnée</option>
            </select>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-800">{filtered.length.toLocaleString('fr-FR')}</span> producteur{filtered.length > 1 ? 's' : ''} · page {page}/{pageCount}
          </p>
          <p className="text-[11px] text-gray-400 hidden sm:block">Statut et note interne enregistrés dans ce navigateur</p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Aucun producteur ne correspond à ces critères.</p>
            <button onClick={() => setFilters(EMPTY_FILTERS)} className="mt-3 text-sm font-semibold text-brand-600 hover:underline">
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Producteur</th>
                  <th className="py-3 px-4">Pays / région</th>
                  <th className="py-3 px-4">Catégorie & produits</th>
                  <th className="py-3 px-4">Labels</th>
                  <th className="py-3 px-4">Coordonnées</th>
                  <th className="py-3 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageRows.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-50/30 cursor-pointer transition-colors" onClick={() => setSelected(p)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-black shrink-0">
                          {p.n.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate max-w-[220px]">{p.n}</p>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> <span className="truncate max-w-[190px]">{displayOr(p.t, 'Type non précisé')}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-700">{displayOr(p.c)}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> <span className="truncate max-w-[150px]">{displayOr(p.r)}</span>
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-md px-2 py-0.5">{p.category}</span>
                      <p className="text-[11px] text-gray-500 mt-1 truncate max-w-[230px]">{displayOr(p.p, 'Produits non précisés')}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {/^oui/i.test(p.b) && (
                          <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-[11px] font-semibold rounded-md px-1.5 py-0.5">
                            <Leaf className="w-3 h-3" /> Bio
                          </span>
                        )}
                        {/^oui/i.test(p.f) && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] font-semibold rounded-md px-1.5 py-0.5">
                            <Handshake className="w-3 h-3" /> Équitable
                          </span>
                        )}
                        {p.z && (
                          <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 text-[11px] font-semibold rounded-md px-1.5 py-0.5 max-w-[160px] truncate">
                            <Award className="w-3 h-3 shrink-0" /> {p.z}
                          </span>
                        )}
                        {!/^oui/i.test(p.b) && !/^oui/i.test(p.f) && !p.z && (
                          <span className="text-[11px] text-gray-400 italic">À vérifier</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <ContactPill href={mailtoHref(p, 'Ethimarket — mise en relation producteurs')} icon={Mail} label="Email" value={p.e} tone="bg-blue-50 text-blue-600 hover:bg-blue-100" />
                        <ContactPill href={p.h ? `tel:${p.h.replace(/\s/g, '')}` : null} icon={Phone} label="Téléphone" value={p.h} tone="bg-violet-50 text-violet-600 hover:bg-violet-100" />
                        <ContactPill href={p.w ? normalizeUrl(p.w) : null} icon={Globe} label="Site web" value={p.w} tone="bg-gray-100 text-gray-600 hover:bg-gray-200" />
                        <ContactPill href={p.a ? `https://wa.me/${p.a.replace(/[^\d]/g, '')}` : null} icon={MessageCircle} label="WhatsApp" value={p.a} tone="bg-brand-50 text-brand-600 hover:bg-brand-100" />
                        {!p.hasEmail && !p.hasPhone && !p.hasWebsite && <span className="text-[11px] text-gray-400 italic">Non trouvé</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={p.status}
                        onChange={(e) => update(p, { status: e.target.value as PipelineStatus })}
                        className={`text-[11px] font-bold rounded-lg px-2 py-1.5 border-0 ring-1 cursor-pointer ${STATUS_STYLES[p.status]}`}
                      >
                        {PIPELINE_ORDER.map((st) => <option key={st} value={st}>{PIPELINE_LABELS[st]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <span className="text-xs text-gray-500">{page} / {pageCount}</span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-3 max-w-4xl">
        Sources publiques uniquement ({dataset.source || 'annuaires certifiés'}). Aucun champ inventé : les informations
        non publiées par la source apparaissent en « Non trouvé », les labels non confirmés en « À vérifier ».
      </p>

      {/* Fiche détaillée */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={() => setSelected(null)} />
          <aside className="relative w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto animate-fade-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3 z-10">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{selected.id} · {selected.category}</p>
                <h2 className="text-lg font-black text-gray-900 leading-tight break-words">{selected.n}</h2>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {displayOr(selected.r)}, {displayOr(selected.c)} · {displayOr(selected.k)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              <div className="flex flex-wrap gap-2">
                <a
                  href={mailtoHref(selected, 'Ethimarket — proposition de partenariat') ?? undefined}
                  onClick={(e) => { if (!selected.e) e.preventDefault(); }}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${selected.e ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  <Mail className="w-4 h-4" /> {selected.e ? 'Envoyer un email' : 'Email non trouvé'}
                </a>
                {selected.h && (
                  <a href={`tel:${selected.h.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700">
                    <Phone className="w-4 h-4" /> Appeler
                  </a>
                )}
                {selected.a && (
                  <a href={`https://wa.me/${selected.a.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                )}
                {selected.w && (
                  <a href={normalizeUrl(selected.w)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
                    <ExternalLink className="w-4 h-4" /> Site web
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field icon={Mail} label="Email" value={selected.e} href={mailtoHref(selected) ?? undefined} />
                <Field icon={Phone} label="Téléphone" value={selected.h} href={selected.h ? `tel:${selected.h.replace(/\s/g, '')}` : undefined} />
                <Field icon={MessageCircle} label="WhatsApp" value={selected.a} href={selected.a ? `https://wa.me/${selected.a.replace(/[^\d]/g, '')}` : undefined} />
                <Field icon={Globe} label="Site internet" value={selected.w} href={selected.w ? normalizeUrl(selected.w) : undefined} />
                <Field icon={User} label="Contact / Responsable" value={selected.m} />
                <Field icon={Building2} label="Type de producteur" value={selected.t} />
                <Field icon={Leaf} label="Produits principaux" value={selected.p} />
                <Field icon={MapPin} label="Adresse" value={selected.d} />
                <Field icon={Award} label="Certification" value={selected.z} />
                <Field icon={Leaf} label="Bio" value={selected.b} />
                <Field icon={Handshake} label="Équitable" value={selected.f} />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {selected.l && <a href={normalizeUrl(selected.l)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-[#0a66c2]/10 text-[#0a66c2] flex items-center justify-center hover:bg-[#0a66c2]/20"><Linkedin className="w-4 h-4" /></a>}
                {selected.i && <a href={normalizeUrl(selected.i)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-100"><Instagram className="w-4 h-4" /></a>}
                {selected.o && <a href={normalizeUrl(selected.o)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><Facebook className="w-4 h-4" /></a>}
                {selected.e && (
                  <button onClick={() => copy(selected.e, 'mail')} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    {copied === 'mail' ? <Check className="w-3.5 h-3.5 text-brand-600" /> : <Copy className="w-3.5 h-3.5" />} Copier l'email
                  </button>
                )}
                {selected.h && (
                  <button onClick={() => copy(selected.h, 'tel')} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    {copied === 'tel' ? <Check className="w-3.5 h-3.5 text-brand-600" /> : <Copy className="w-3.5 h-3.5" />} Copier le tél.
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold block mb-1.5">Statut de prospection</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PIPELINE_ORDER.map((st) => (
                      <button
                        key={st}
                        onClick={() => update(selected, { status: st })}
                        className={`text-[11px] font-bold rounded-lg px-2.5 py-1.5 ring-1 transition ${selected.status === st ? STATUS_STYLES[st] + ' ring-2' : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-100'}`}
                      >
                        {PIPELINE_LABELS[st]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold block mb-1.5">Note interne</label>
                  <textarea
                    value={selected.note}
                    onChange={(e) => update(selected, { note: e.target.value })}
                    rows={3}
                    placeholder="Compte-rendu d'appel, prochaine action, personne rencontrée…"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
                {(selected.status !== 'nouveau' || selected.note) && (
                  <button
                    onClick={() => { resetProspectState(selected.id); update(selected, { status: 'nouveau', note: '' }); }}
                    className="text-xs font-semibold text-gray-500 hover:text-red-600 inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser ce prospect
                  </button>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <Field icon={FileSpreadsheet} label="Source" value={selected.s} />
                {selected.x && <Field label="Notes de collecte" value={selected.x} />}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
