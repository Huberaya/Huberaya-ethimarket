import { describe, it, expect, beforeEach } from 'vitest';
import {
  filterProspects, EMPTY_FILTERS, prospectsToCsv, normalizeUrl, displayOr, mailtoHref,
  saveProspectState, resetProspectState, readAllProspectStates, PIPELINE_LABELS,
  type Prospect,
} from '../lib/producerProspects';

function makeProspect(over: Partial<Prospect> = {}): Prospect {
  const base: Prospect = {
    id: 'ETH-00001',
    n: 'Coopérative Café de Test',
    c: 'Pérou',
    k: 'Amérique latine & Caraïbes',
    r: 'Cusco',
    t: 'Coopérative / organisation de petits producteurs',
    p: 'Café arabica',
    b: 'Oui',
    f: 'Oui',
    z: 'Fairtrade (FLOCERT)',
    w: 'www.coop-test.pe',
    e: 'contact@coop-test.pe',
    h: '+51 84 123456',
    a: '',
    l: '',
    i: '',
    o: '',
    m: 'Maria Quispe',
    d: 'Cusco, Pérou',
    s: 'Fairtrade Finder / FLOCERT',
    x: '',
    category: 'Café',
    status: 'nouveau',
    note: '',
    hasEmail: true,
    hasPhone: true,
    hasWebsite: true,
    hasContact: true,
    contactable: true,
  };
  return { ...base, ...over };
}

describe('filterProspects', () => {
  const prospects = [
    makeProspect(),
    makeProspect({
      id: 'ETH-00002', n: 'Kymen Luomu Osk', c: 'Finlande', k: 'Europe', r: 'Kymi',
      t: 'Coopérative de producteurs bio', p: 'Céréales bio', b: 'Oui', f: '', z: '',
      w: '', e: '', h: '+358 50 3301556', category: 'Céréales & graines',
      hasEmail: false, hasWebsite: false, hasContact: false, m: '',
    }),
    makeProspect({
      id: 'ETH-00003', n: 'Coopérative sans coordonnées', c: 'Pérou', k: 'Amérique latine & Caraïbes',
      p: 'Cacao', category: 'Cacao', b: 'À vérifier', f: 'À vérifier', m: '', hasContact: false,
      w: '', e: '', h: '', hasEmail: false, hasPhone: false, hasWebsite: false, contactable: false,
    }),
  ];

  it('ne renvoie rien de perdu quand aucun filtre n’est actif', () => {
    expect(filterProspects(prospects, EMPTY_FILTERS)).toHaveLength(3);
  });

  it('filtre par pays, continent et catégorie', () => {
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, country: 'Pérou' })).toHaveLength(2);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, continent: 'Europe' })).toHaveLength(1);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, category: 'Cacao' })).toHaveLength(1);
  });

  it('recherche plein texte insensible à la casse et multi-termes', () => {
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, search: 'café arabica' })).toHaveLength(1);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, search: 'MARIA QUISPE' })).toHaveLength(1);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, search: 'pérou cacao' })).toHaveLength(1);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, search: 'inexistant' })).toHaveLength(0);
  });

  it('filtre sur la disponibilité des coordonnées', () => {
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, contact: 'email' })).toHaveLength(1);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, contact: 'phone' })).toHaveLength(2);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, contact: 'website' })).toHaveLength(1);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, contact: 'none' })).toHaveLength(1);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, contact: 'any' })).toHaveLength(2);
  });

  it('filtre sur les labels bio / équitable confirmés', () => {
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, bio: 'oui' })).toHaveLength(2);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, bio: 'verifier' })).toHaveLength(1);
    expect(filterProspects(prospects, { ...EMPTY_FILTERS, fairTrade: 'oui' })).toHaveLength(1);
  });

  it('filtre sur le statut de prospection', () => {
    const avecStatut = prospects.map((p, i) => (i === 0 ? { ...p, status: 'contacte' as const } : p));
    expect(filterProspects(avecStatut, { ...EMPTY_FILTERS, status: 'contacte' })).toHaveLength(1);
    expect(filterProspects(avecStatut, { ...EMPTY_FILTERS, status: 'refere' })).toHaveLength(0);
  });
});

describe('prospectsToCsv', () => {
  it('produit un CSV Excel-compatible (BOM, séparateur ;, guillemets échappés)', () => {
    const csv = prospectsToCsv([
      makeProspect({ n: 'Coop "Test", SARL', x: 'ligne1\nligne2' }),
    ]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const [head, row] = csv.slice(1).split('\r\n');
    expect(head.split(';')[0]).toBe('ID');
    expect(head).toContain('Statut prospection');
    expect(row).toContain('"Coop ""Test"", SARL"');
    expect(row).toContain('"ligne1\nligne2"');
    expect(row).toContain(PIPELINE_LABELS.nouveau);
  });

  it('exporte une ligne par producteur', () => {
    const csv = prospectsToCsv([makeProspect(), makeProspect({ id: 'ETH-00002' })]);
    expect(csv.slice(1).split('\r\n')).toHaveLength(3); // en-tête + 2 lignes
  });
});

describe('helpers d’affichage', () => {
  it('affiche « Non trouvé » pour une donnée absente, sans jamais inventer', () => {
    expect(displayOr('')).toBe('Non trouvé');
    expect(displayOr('   ')).toBe('Non trouvé');
    expect(displayOr('Cusco')).toBe('Cusco');
  });

  it('normalise les URLs sans schéma', () => {
    expect(normalizeUrl('www.coop-test.pe')).toBe('https://www.coop-test.pe');
    expect(normalizeUrl('https://corab.fr')).toBe('https://corab.fr');
    expect(normalizeUrl('')).toBe('');
  });

  it('construit un mailto seulement si un email existe', () => {
    expect(mailtoHref(makeProspect(), 'Sujet')).toBe('mailto:contact@coop-test.pe?subject=Sujet');
    expect(mailtoHref(makeProspect({ e: '' }))).toBeNull();
  });
});

describe('persistance du pipeline de prospection', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProspectState();
  });

  it('enregistre puis relit statut et note interne', () => {
    saveProspectState('ETH-00001', { status: 'contacte', note: 'Appel du 07/09' });
    const store = readAllProspectStates();
    expect(store['ETH-00001']?.status).toBe('contacte');
    expect(store['ETH-00001']?.note).toBe('Appel du 07/09');
    expect(store['ETH-00001']?.at).toBeTruthy();
  });

  it('fusionne les mises à jour successives', () => {
    saveProspectState('ETH-00001', { status: 'contacte' });
    saveProspectState('ETH-00001', { note: 'Relance prévue' });
    const store = readAllProspectStates();
    expect(store['ETH-00001']).toMatchObject({ status: 'contacte', note: 'Relance prévue' });
  });

  it('réinitialise un prospect ou toute la base locale', () => {
    saveProspectState('ETH-00001', { status: 'refere' });
    saveProspectState('ETH-00002', { status: 'refuse' });
    resetProspectState('ETH-00001');
    expect(readAllProspectStates()['ETH-00001']).toBeUndefined();
    expect(readAllProspectStates()['ETH-00002']?.status).toBe('refuse');
    resetProspectState();
    expect(readAllProspectStates()).toEqual({});
  });
});
