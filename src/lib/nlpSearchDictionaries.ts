// src/lib/nlpSearchDictionaries.ts
// Multilingual NLP dictionaries (FR, EN, ES) for intelligent e-commerce and ethical search

export interface DictionaryItem {
  id: string;
  canonical: string;
  synonyms: string[];
  category?: string;
}

export interface CountryDictionaryItem extends DictionaryItem {
  code: string;
  flag: string;
  region: string;
  continent: string;
}

// 1. PRODUCT CATEGORIES & TYPES
export const PRODUCT_TYPES_DICT: DictionaryItem[] = [
  // Textile & Mode
  { id: 'tshirt', canonical: 't-shirt', synonyms: ['t-shirt', 'tshirt', 'tee-shirt', 'tee shirt', 'teeshirt', 't shirts', 't-shirts', 'camiseta', 'camisetas', 'top'] },
  { id: 'shirt', canonical: 'chemise', synonyms: ['chemise', 'chemises', 'chemisette', 'shirt', 'shirts', 'camisa', 'camisas'] },
  { id: 'hoodie', canonical: 'sweat-shirt', synonyms: ['sweat', 'sweatshirt', 'sweat-shirt', 'hoodie', 'hoodies', 'pull', 'pullover', 'sudadera', 'sudaderas'] },
  { id: 'pants', canonical: 'pantalon', synonyms: ['pantalon', 'pantalons', 'jeans', 'jean', 'trousers', 'pants', 'pantalon', 'pantalones'] },
  { id: 'dress', canonical: 'robe', synonyms: ['robe', 'robes', 'dress', 'dresses', 'vestido', 'vestidos'] },
  { id: 'shoes', canonical: 'chaussures', synonyms: ['chaussure', 'chaussures', 'sneakers', 'baskets', 'shoes', 'footwear', 'zapatos', 'zapatillas'] },
  { id: 'socks', canonical: 'chaussettes', synonyms: ['chaussette', 'chaussettes', 'socks', 'sock', 'calcetines'] },
  { id: 'clothing', canonical: 'vêtements', synonyms: ['vêtement', 'vêtements', 'vetement', 'vetements', 'habits', 'clothes', 'clothing', 'apparel', 'ropa'] },
  { id: 'bag', canonical: 'sac', synonyms: ['sac', 'sacs', 'sacoche', 'cabas', 'tote bag', 'totebag', 'bag', 'bags', 'bolso', 'bolsos'] },

  // Alimentation & Épicerie
  { id: 'coffee', canonical: 'café', synonyms: ['café', 'cafe', 'coffee', 'coffees', 'cafés', 'cafes', 'caffé', 'espresso'] },
  { id: 'tea', canonical: 'thé', synonyms: ['thé', 'the', 'tea', 'teas', 'tisane', 'infusion', 'matcha', 'té'] },
  { id: 'chocolate', canonical: 'chocolat', synonyms: ['chocolat', 'chocolats', 'cacao', 'cocoa', 'chocolate', 'chocolates'] },
  { id: 'honey', canonical: 'miel', synonyms: ['miel', 'miels', 'honey', 'honeys', 'mieles', 'gelée royale'] },
  { id: 'oil', canonical: 'huile', synonyms: ['huile', 'huiles', 'huile d\'olive', 'olive oil', 'oil', 'oils', 'aceite', 'aceites'] },
  { id: 'spice', canonical: 'épices', synonyms: ['épice', 'épices', 'epice', 'epices', 'spices', 'spice', 'poivre', 'sel', 'cannelle', 'curcuma', 'especias'] },
  { id: 'wine', canonical: 'vin', synonyms: ['vin', 'vins', 'wine', 'wines', 'vino', 'vinos'] },
  { id: 'beer', canonical: 'bière', synonyms: ['bière', 'biere', 'bieres', 'bières', 'beer', 'beers', 'cerveza', 'cervezas'] },
  { id: 'flour', canonical: 'farine', synonyms: ['farine', 'farines', 'flour', 'flours', 'harina'] },
  { id: 'pasta', canonical: 'pâtes', synonyms: ['pâte', 'pâtes', 'pates', 'pasta', 'pastas'] },

  // Cosmétiques & Maison
  { id: 'soap', canonical: 'savon', synonyms: ['savon', 'savons', 'soap', 'soaps', 'jabón', 'jabon'] },
  { id: 'shampoo', canonical: 'shampoing', synonyms: ['shampoing', 'shampooing', 'shampoo', 'champú', 'champu'] },
  { id: 'cream', canonical: 'crème', synonyms: ['crème', 'creme', 'cream', 'crema', 'baume', 'balm'] },
  { id: 'candle', canonical: 'bougie', synonyms: ['bougie', 'bougies', 'candle', 'candles', 'vela', 'velas'] }
];

// 2. MATERIALS & INGREDIENTS
export const MATERIALS_DICT: DictionaryItem[] = [
  { id: 'cotton', canonical: 'coton', synonyms: ['coton', 'cotton', 'algodón', 'algodon'] },
  { id: 'wool', canonical: 'laine', synonyms: ['laine', 'wool', 'merinos', 'mérinos', 'alpaga', 'lana'] },
  { id: 'linen', canonical: 'lin', synonyms: ['lin', 'linen', 'flax', 'lino'] },
  { id: 'hemp', canonical: 'chanvre', synonyms: ['chanvre', 'hemp', 'cáñamo', 'canamo'] },
  { id: 'silk', canonical: 'soie', synonyms: ['soie', 'silk', 'seda'] },
  { id: 'bamboo', canonical: 'bambou', synonyms: ['bambou', 'bamboo', 'bambú'] },
  { id: 'leather_veg', canonical: 'cuir végétal', synonyms: ['cuir végétal', 'cuir vegetal', 'vegan leather', 'apple leather', 'pinatex', 'cuero vegano'] },
  { id: 'wood', canonical: 'bois', synonyms: ['bois', 'wood', 'wooden', 'madera'] },
  { id: 'glass', canonical: 'verre', synonyms: ['verre', 'glass', 'vidrio'] }
];

// 3. CERTIFICATIONS
export const CERTIFICATIONS_DICT: DictionaryItem[] = [
  { id: 'bio', canonical: 'Bio', synonyms: ['bio', 'biologique', 'organic', 'orgánico', 'organico', 'ab', 'agriculture biologique', 'bio ue', 'usda', 'jas'] },
  { id: 'fairtrade', canonical: 'Commerce Équitable', synonyms: ['équitable', 'equitable', 'fairtrade', 'fair trade', 'commerce équitable', 'commerce equitable', 'max havelaar', 'wfto', 'comercio justo'] },
  { id: 'gots', canonical: 'GOTS', synonyms: ['gots', 'global organic textile standard'] },
  { id: 'oeko_tex', canonical: 'OEKO-TEX', synonyms: ['oeko-tex', 'oekotex', 'oeko tex', 'standard 100'] },
  { id: 'fsc', canonical: 'FSC', synonyms: ['fsc', 'pefc', 'bois certifié', 'forêt durable'] },
  { id: 'rainforest', canonical: 'Rainforest Alliance', synonyms: ['rainforest', 'rainforest alliance', 'utz'] },
  { id: 'demeter', canonical: 'Demeter', synonyms: ['demeter', 'biodynamie', 'biodynamique', 'naturland'] },
  { id: 'cruelty_free', canonical: 'Cruelty-Free', synonyms: ['cruelty free', 'cruelty-free', 'leaping bunny', 'sans cruauté'] },
  { id: 'bcorp', canonical: 'B-Corp', synonyms: ['b-corp', 'bcorp', 'b corp', 'certified b'] }
];

// 4. GENDERS & AUDIENCES
export const GENDERS_DICT: DictionaryItem[] = [
  { id: 'homme', canonical: 'homme', synonyms: ['homme', 'hommes', 'man', 'men', 'male', 'masculin', 'pour homme', 'hombre', 'hombres', 'para hombre'] },
  { id: 'femme', canonical: 'femme', synonyms: ['femme', 'femmes', 'woman', 'women', 'female', 'féminin', 'pour femme', 'mujer', 'mujeres', 'para mujer'] },
  { id: 'enfant', canonical: 'enfant', synonyms: ['enfant', 'enfants', 'kid', 'kids', 'child', 'children', 'garçon', 'fille', 'niño', 'niños', 'para niños'] },
  { id: 'bebe', canonical: 'bébé', synonyms: ['bébé', 'bebe', 'bébés', 'baby', 'babies', 'infant', 'toddler', 'bebé', 'bebés'] },
  { id: 'unisexe', canonical: 'unisexe', synonyms: ['unisexe', 'unisex', 'mixte', 'tout genre'] }
];

// 5. COUNTRIES & REGIONS
export const COUNTRIES_DICT: CountryDictionaryItem[] = [
  { id: 'FR', canonical: 'France', code: 'FR', flag: '🇫🇷', region: 'Europe de l\'Ouest', continent: 'Europe', synonyms: ['france', 'français', 'française', 'french', 'francia', 'made in france', 'fabriqué en france'] },
  { id: 'CO', canonical: 'Colombie', code: 'CO', flag: '🇨🇴', region: 'Amérique du Sud', continent: 'Amérique', synonyms: ['colombie', 'colombien', 'colombienne', 'colombia', 'colombian'] },
  { id: 'PE', canonical: 'Pérou', code: 'PE', flag: '🇵🇪', region: 'Amérique du Sud', continent: 'Amérique', synonyms: ['pérou', 'perou', 'péruvien', 'peru', 'peruvian'] },
  { id: 'MG', canonical: 'Madagascar', code: 'MG', flag: '🇲🇬', region: 'Afrique de l\'Est', continent: 'Afrique', synonyms: ['madagascar', 'malgache'] },
  { id: 'IT', canonical: 'Italie', code: 'IT', flag: '🇮🇹', region: 'Europe du Sud', continent: 'Europe', synonyms: ['italie', 'italien', 'italienne', 'italy', 'italian', 'italia'] },
  { id: 'ES', canonical: 'Espagne', code: 'ES', flag: '🇪🇸', region: 'Europe du Sud', continent: 'Europe', synonyms: ['espagne', 'espagnol', 'spain', 'spanish', 'españa'] },
  { id: 'PT', canonical: 'Portugal', code: 'PT', flag: '🇵🇹', region: 'Europe du Sud', continent: 'Europe', synonyms: ['portugal', 'portugais', 'portuguese'] },
  { id: 'DE', canonical: 'Allemagne', code: 'DE', flag: '🇩🇪', region: 'Europe de l\'Ouest', continent: 'Europe', synonyms: ['allemagne', 'allemand', 'germany', 'german', 'alemania'] },
  { id: 'BE', canonical: 'Belgique', code: 'BE', flag: '🇧🇪', region: 'Europe de l\'Ouest', continent: 'Europe', synonyms: ['belgique', 'belge', 'belgium'] },
  { id: 'ET', canonical: 'Éthiopie', code: 'ET', flag: '🇪🇹', region: 'Afrique de l\'Est', continent: 'Afrique', synonyms: ['éthiopie', 'ethiopie', 'ethiopien', 'ethiopia', 'ethiopian'] },
  { id: 'IN', canonical: 'Inde', code: 'IN', flag: '🇮🇳', region: 'Asie du Sud', continent: 'Asie', synonyms: ['inde', 'indien', 'india', 'indian'] },
  { id: 'NZ', canonical: 'Nouvelle-Zélande', code: 'NZ', flag: '🇳🇿', region: 'Océanie', continent: 'Océanie', synonyms: ['nouvelle-zélande', 'nouvelle zelande', 'new zealand', 'manuka'] }
];

export const REGIONS_DICT: DictionaryItem[] = [
  { id: 'europe', canonical: 'Europe', synonyms: ['europe', 'européen', 'européenne', 'european', 'ue', 'eu'] },
  { id: 'africa', canonical: 'Afrique', synonyms: ['afrique', 'africain', 'africa', 'african'] },
  { id: 'south_america', canonical: 'Amérique du Sud', synonyms: ['amérique du sud', 'amerique du sud', 'south america', 'latino', 'amérique latine'] },
  { id: 'asia', canonical: 'Asie', synonyms: ['asie', 'asiatique', 'asia', 'asian'] },
  { id: 'local', canonical: 'Local', synonyms: ['local', 'locale', 'circuit court', 'proximité', 'locales', 'proche de moi'] }
];

// 6. ETHICAL, SOCIAL & ENVIRONMENTAL FLAGS
export const ETHICAL_FLAGS_DICT = {
  vegan: ['vegan', 'végane', 'vegetalien', 'végétalien', '100% végétal', 'plant-based', 'vegano'],
  recycled: ['recyclé', 'recycle', 'recycled', 'upcyclé', 'upcycled', 'circulaire', 'reciclado'],
  living_wage: ['salaire décent', 'salaire decent', 'living wage', 'rémunération juste', 'juste rémunération', 'salario digno'],
  cooperative: ['coopérative', 'cooperative', 'coop', 'coopérative de producteurs', 'cooperativa'],
  social_protection: ['protection sociale', 'social protection', 'sécurité sociale', 'couverture santé'],
  plastic_free: ['sans plastique', 'sans-plastique', 'zero plastique', 'zéro plastique', 'plastic free', 'plastic-free', 'sin plastico'],
  biodegradable: ['biodégradable', 'biodegradable', 'compostable', 'emballage recyclable'],
  gluten_free: ['sans gluten', 'sans-gluten', 'gluten free', 'gluten-free', 'sin gluten'],
  dark_chocolate: ['noir', 'dark', 'chocolat noir', 'negro'],
  milk_chocolate: ['lait', 'milk', 'chocolat au lait'],
  beans_form: ['en grains', 'en grain', 'grains', 'beans', 'whole bean', 'en grano'],
  ground_form: ['moulu', 'ground', 'moulus', 'molido']
};

// 7. COMPARATIVE & INTENT TRIGGERS
export const INTENT_PATTERNS = {
  alternative: [
    /(?:trouve(?:-moi)?|cherche|montre(?:-moi)?|quelle est|donne(?:-moi)?)\s+(?:une\s+)?alternative\s+(?:[a-zÀ-ÿ-]+\s+)*(?:à|au|aux|pour|de)\s+([^,]+)/i,
    /alternative\s+(?:[a-zÀ-ÿ-]+\s+)*(?:à|au|aux|pour|de)\s+([^,]+)/i,
    /remplacer\s+([^,]+)/i,
    /équivalent\s+(?:[a-zÀ-ÿ-]+\s+)*(?:à|au|aux|pour|de)\s+([^,]+)/i,
    /substitut\s+(?:[a-zÀ-ÿ-]+\s+)*(?:à|au|aux|pour|de)\s+([^,]+)/i
  ],
  comparison: [
    /compare(?:r)?\s+(?:les|la|le)?\s*([^,]+)/i,
    /comparatif\s+(?:entre|de|des)?\s*([^,]+)/i,
    /versus|vs|par rapport à/i
  ],
  better_traceability: [
    /meilleure?\s+tra[çc]abilit[ée]/i,
    /plus\s+tra[çc]able/i,
    /tra[çc]abilit[ée]\s+compl[èe]te/i,
    /transparence\s+totale/i
  ],
  cheaper: [
    /moins\s+ch[eè]re?/i,
    /plus\s+[ée]conomique/i,
    /meilleur\s+prix/i,
    /cheaper/i,
    /m[aá]s\s+barato/i,
    /co[uû]te\s+moins\s+ch[eè]re?/i
  ],
  lower_carbon: [
    /moins\s+de\s+co2/i,
    /empreinte\s+carbone\s+inf[ée]rieure/i,
    /plus\s+[ée]colo/i,
    /bas\s+carbone/i,
    /low\s+carbon/i
  ],
  fast_delivery: [
    /livraison\s+rapide/i,
    /d[ée]lai\s+court/i,
    /rapide/i,
    /express/i,
    /fast\s+delivery/i,
    /urgente?/i
  ]
};
