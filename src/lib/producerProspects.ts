/**
 * Base de prospection producteurs Ethimarket.
 *
 * Les données proviennent de `public/data/prospects.json`, généré par
 * `scripts/generate_prospects.py` à partir de la base producteur consolidée
 * (3 500+ producteurs réels, 70+ pays, sources publiques : Fairtrade/FLOCERT,
 * WFTO, PromPerú, NSTIAM, Spices Board India, TNAU, Conseil Café-Cacao,
 * Conseil oléicole international, IFOAM, sites officiels de coopératives).
 *
 * Aucune donnée n'est inventée : un champ absent vaut `''` et s'affiche
 * « Non trouvé » dans l'interface.
 */

export interface RawProspect {
  id: string;
  n: string; // Nom du producteur
  c: string; // Pays
  k: string; // Continent
  r: string; // Région / Ville
  t: string; // Type de producteur
  p: string; // Produits principaux
  b: string; // Bio
  f: string; // Équitable
  z: string; // Certification
  w: string; // Site internet
  e: string; // Email
  h: string; // Téléphone
  a: string; // WhatsApp
  l: string; // LinkedIn
  i: string; // Instagram
  o: string; // Facebook
  m: string; // Contact / Responsable
  d: string; // Adresse
  s: string; // Source
  x: string; // Notes
  g: string; // Catégorie produit (calculée)
}

export type PipelineStatus = 'nouveau' | 'a_qualifier' | 'contacte' | 'reponse' | 'refere' | 'refuse';

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  nouveau: 'Nouveau',
  a_qualifier: 'À qualifier',
  contacte: 'Contacté',
  reponse: 'Réponse obtenue',
  refere: 'Référé / onboardé',
  refuse: 'Écarté',
};

export const PIPELINE_ORDER: PipelineStatus[] = ['nouveau', 'a_qualifier', 'contacte', 'reponse', 'refere', 'refuse'];

export interface Prospect extends Omit<RawProspect, 'g'> {
  category: string;
  status: PipelineStatus;
  note: string;
  hasEmail: boolean;
  hasPhone: boolean;
  hasWebsite: boolean;
  hasContact: boolean;
  contactable: boolean;
}

export interface ProspectStats {
  total: number;
  countries: number;
  withEmail: number;
  withPhone: number;
  withWebsite: number;
  withWhatsapp: number;
  withContact: number;
}

export interface ProspectDataset {
  generatedAt: string;
  source: string;
  stats: ProspectStats;
  prospects: Prospect[];
  countries: string[];
  continents: string[];
  categories: string[];
  types: string[];
}

const DATA_URL = `${import.meta.env.BASE_URL ?? '/'}data/prospects.json`.replace('//', '/');
const STORAGE_KEY = 'ethimarket.prospection.v1';

interface StoredEntry {
  status?: PipelineStatus;
  note?: string;
  at?: string;
}

/* ------------------------------------------------------------------ */
/* Persistance locale du pipeline de prospection                       */
/* ------------------------------------------------------------------ */

type Store = Record<string, StoredEntry>;

let memoryStore: Store = {};

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryStore;
    const parsed = JSON.parse(raw) as Store;
    memoryStore = parsed && typeof parsed === 'object' ? parsed : {};
    return memoryStore;
  } catch {
    return memoryStore;
  }
}

export function saveProspectState(id: string, patch: StoredEntry): void {
  const store = readStore();
  store[id] = { ...store[id], ...patch, at: new Date().toISOString() };
  memoryStore = store;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / mode privé : l'état reste en mémoire pour la session */
  }
}

export function resetProspectState(id?: string): void {
  if (id) {
    const store = readStore();
    delete store[id];
    memoryStore = store;
  } else {
    memoryStore = {};
  }
  try {
    if (id) localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignoré */
  }
}

export function readAllProspectStates(): Store {
  return readStore();
}

/* ------------------------------------------------------------------ */
/* Chargement du dataset                                               */
/* ------------------------------------------------------------------ */

let cache: ProspectDataset | null = null;
let inflight: Promise<ProspectDataset> | null = null;

function toProspect(raw: RawProspect, store: Store): Prospect {
  const entry = store[raw.id] ?? {};
  const { g: category, ...rest } = raw;
  return {
    ...rest,
    category: category || 'Non précisé',
    status: entry.status ?? 'nouveau',
    note: entry.note ?? '',
    hasEmail: Boolean(raw.e),
    hasPhone: Boolean(raw.h),
    hasWebsite: Boolean(raw.w),
    hasContact: Boolean(raw.m),
    contactable: Boolean(raw.e || raw.h || raw.a),
  };
}

export async function loadProspects(): Promise<ProspectDataset> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch(DATA_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`prospects.json introuvable (HTTP ${res.status})`);
    const payload = (await res.json()) as {
      generatedAt?: string;
      source?: string;
      producers?: RawProspect[];
      total?: number;
      countries?: number;
      withEmail?: number;
      withPhone?: number;
      withWebsite?: number;
      withWhatsapp?: number;
      withContact?: number;
    };

    const store = readStore();
    const prospects = (payload.producers ?? []).map((raw) => toProspect(raw, store));

    const uniq = (values: string[]) =>
      Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

    cache = {
      generatedAt: payload.generatedAt ?? '',
      source: payload.source ?? '',
      stats: {
        total: prospects.length,
        countries: uniq(prospects.map((p) => p.c)).length,
        withEmail: prospects.filter((p) => p.hasEmail).length,
        withPhone: prospects.filter((p) => p.hasPhone).length,
        withWebsite: prospects.filter((p) => p.hasWebsite).length,
        withWhatsapp: prospects.filter((p) => p.a).length,
        withContact: prospects.filter((p) => p.hasContact).length,
      },
      prospects,
      countries: uniq(prospects.map((p) => p.c)),
      continents: uniq(prospects.map((p) => p.k)),
      categories: uniq(prospects.map((p) => p.category)),
      types: uniq(prospects.map((p) => p.t)),
    };
    return cache;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/* ------------------------------------------------------------------ */
/* Filtres & export                                                    */
/* ------------------------------------------------------------------ */

export interface ProspectFilters {
  search: string;
  country: string;
  continent: string;
  category: string;
  type: string;
  bio: string;
  fairTrade: string;
  contact: string; // 'all' | 'any' | 'email' | 'phone' | 'website' | 'none'
  status: PipelineStatus | 'all';
}

export const EMPTY_FILTERS: ProspectFilters = {
  search: '',
  country: 'all',
  continent: 'all',
  category: 'all',
  type: 'all',
  bio: 'all',
  fairTrade: 'all',
  contact: 'all',
  status: 'all',
};

function matchesSearch(p: Prospect, needle: string): boolean {
  if (!needle) return true;
  const terms = needle
    .toLowerCase()
    .split(/[\s,;]+/)
    .filter((t) => t.length > 1);
  if (!terms.length) return true;
  const hay = [p.n, p.c, p.k, p.r, p.t, p.p, p.category, p.m, p.e, p.w, p.s, p.z].join(' | ').toLowerCase();
  return terms.every((term) => hay.includes(term));
}

export function filterProspects(prospects: Prospect[], filters: ProspectFilters): Prospect[] {
  const search = filters.search.trim();
  return prospects.filter((p) => {
    if (!matchesSearch(p, search)) return false;
    if (filters.country !== 'all' && p.c !== filters.country) return false;
    if (filters.continent !== 'all' && p.k !== filters.continent) return false;
    if (filters.category !== 'all' && p.category !== filters.category) return false;
    if (filters.type !== 'all' && p.t !== filters.type) return false;
    if (filters.bio === 'oui' && !/^oui/i.test(p.b)) return false;
    if (filters.bio === 'verifier' && !/vérifier|verifier/i.test(p.b)) return false;
    if (filters.fairTrade === 'oui' && !/^oui/i.test(p.f)) return false;
    if (filters.fairTrade === 'verifier' && !/vérifier|verifier/i.test(p.f)) return false;
    if (filters.contact === 'any' && !p.contactable) return false;
    if (filters.contact === 'email' && !p.hasEmail) return false;
    if (filters.contact === 'phone' && !p.hasPhone) return false;
    if (filters.contact === 'website' && !p.hasWebsite) return false;
    if (filters.contact === 'none' && (p.hasEmail || p.hasPhone || p.hasWebsite)) return false;
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    return true;
  });
}

const EXPORT_COLUMNS: Array<[string, keyof Prospect]> = [
  ['ID', 'id'],
  ['Nom du producteur', 'n'],
  ['Pays', 'c'],
  ['Continent', 'k'],
  ['Région / Ville', 'r'],
  ['Catégorie', 'category'],
  ['Type de producteur', 't'],
  ['Produits principaux', 'p'],
  ['Bio', 'b'],
  ['Équitable', 'f'],
  ['Certification', 'z'],
  ['Site internet', 'w'],
  ['Email', 'e'],
  ['Téléphone', 'h'],
  ['WhatsApp', 'a'],
  ['LinkedIn', 'l'],
  ['Instagram', 'i'],
  ['Facebook', 'o'],
  ['Contact / Responsable', 'm'],
  ['Adresse', 'd'],
  ['Statut prospection', 'status'],
  ['Note interne', 'note'],
  ['Source', 's'],
  ['Notes', 'x'],
];

function csvCell(value: unknown): string {
  const v = value === null || value === undefined ? '' : String(value);
  return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function prospectsToCsv(prospects: Prospect[]): string {
  const head = EXPORT_COLUMNS.map(([label]) => csvCell(label)).join(';');
  const body = prospects.map((p) =>
    EXPORT_COLUMNS.map(([, key]) => csvCell(key === 'status' ? PIPELINE_LABELS[p.status] : p[key])).join(';'),
  );
  return `\uFEFF${[head, ...body].join('\r\n')}`;
}

export function downloadCsv(prospects: Prospect[], filename = 'prospection-producteurs-ethimarket.csv'): void {
  const blob = new Blob([prospectsToCsv(prospects)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function mailtoHref(p: Prospect, subject?: string): string | null {
  if (!p.e) return null;
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  const query = params.toString();
  return `mailto:${p.e}${query ? `?${query}` : ''}`;
}

export function normalizeUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, '')}`;
}

export function displayOr(value: string, fallback = 'Non trouvé'): string {
  return value && value.trim() ? value.trim() : fallback;
}
