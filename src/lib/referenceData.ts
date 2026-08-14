/**
 * EthiMarket — Scientific Environmental & Economic Reference Data
 * 
 * Sources & Methodologies:
 * - Carbon Footprint: ADEME Base Carbone® 2024, WRI/WBCSD GHG Protocol (Scopes 1-3)
 * - Water Footprint: Water Footprint Network (Hoekstra et al., 2011 / UNESCO-IHE)
 * - Biodiversity: IBAT (Integrated Biodiversity Assessment Tool) & FAO Agroforestry
 * - Economic & Social: Fairtrade Impact Assessment, Anker Living Wage Benchmark, UN SDGs
 * - Trade & Customs: EU TARIC Combined Nomenclature & ACP / EBA Duty-Free Agreements
 */

export interface ProductFactor {
  name: string;
  categoryKeys: string[];
  bioEmissionFactor: number;        // kg CO2e / kg product
  convEmissionFactor: number;       // kg CO2e / kg product
  bioWaterFootprint: number;        // Liters / kg product
  convWaterFootprint: number;       // Liters / kg product
  hsCode: string;                   // EU Customs HS Code
}

export const PRODUCTION_FACTORS: Record<string, { bio: number; conv: number; unit: string }> = {
  coffee: { bio: 1.2, conv: 4.5, unit: 'kg CO2e/kg' },
  cocoa: { bio: 2.8, conv: 8.0, unit: 'kg CO2e/kg' },
  tea: { bio: 0.9, conv: 3.2, unit: 'kg CO2e/kg' },
  spices: { bio: 0.5, conv: 2.0, unit: 'kg CO2e/kg' },
  vanilla: { bio: 1.8, conv: 5.5, unit: 'kg CO2e/kg' },
  oils: { bio: 1.5, conv: 4.0, unit: 'kg CO2e/kg' },
  dried_fruits: { bio: 0.8, conv: 2.5, unit: 'kg CO2e/kg' },
  honey: { bio: 0.3, conv: 1.2, unit: 'kg CO2e/kg' },
  cereals: { bio: 0.6, conv: 1.8, unit: 'kg CO2e/kg' },
  cosmetics: { bio: 2.0, conv: 6.0, unit: 'kg CO2e/kg' },
};

export const WATER_FACTORS: Record<string, { bio: number; conv: number }> = {
  coffee: { bio: 5400, conv: 18900 },
  cocoa: { bio: 8200, conv: 27000 },
  tea: { bio: 2700, conv: 8860 },
  spices: { bio: 1500, conv: 5000 },
  vanilla: { bio: 7500, conv: 25000 },
  oils: { bio: 3200, conv: 14400 },
  dried_fruits: { bio: 4000, conv: 9063 },
  honey: { bio: 800, conv: 3000 },
  cereals: { bio: 1200, conv: 3500 },
  cosmetics: { bio: 2000, conv: 8000 },
};

export const PRODUCT_FACTORS: Record<string, ProductFactor> = {
  coffee: {
    name: 'Café',
    categoryKeys: ['café', 'coffee', 'cafe'],
    bioEmissionFactor: PRODUCTION_FACTORS.coffee.bio,
    convEmissionFactor: PRODUCTION_FACTORS.coffee.conv,
    bioWaterFootprint: WATER_FACTORS.coffee.bio,
    convWaterFootprint: WATER_FACTORS.coffee.conv,
    hsCode: '0901',
  },
  cocoa: {
    name: 'Cacao',
    categoryKeys: ['cacao', 'cocoa', 'chocolat'],
    bioEmissionFactor: PRODUCTION_FACTORS.cocoa.bio,
    convEmissionFactor: PRODUCTION_FACTORS.cocoa.conv,
    bioWaterFootprint: WATER_FACTORS.cocoa.bio,
    convWaterFootprint: WATER_FACTORS.cocoa.conv,
    hsCode: '1801',
  },
  tea: {
    name: 'Thé',
    categoryKeys: ['thé', 'tea', 'infusion'],
    bioEmissionFactor: PRODUCTION_FACTORS.tea.bio,
    convEmissionFactor: PRODUCTION_FACTORS.tea.conv,
    bioWaterFootprint: WATER_FACTORS.tea.bio,
    convWaterFootprint: WATER_FACTORS.tea.conv,
    hsCode: '0902',
  },
  spices: {
    name: 'Épices',
    categoryKeys: ['épices', 'spices', 'poivre', 'gingembre', 'curcuma', 'cannelle'],
    bioEmissionFactor: PRODUCTION_FACTORS.spices.bio,
    convEmissionFactor: PRODUCTION_FACTORS.spices.conv,
    bioWaterFootprint: WATER_FACTORS.spices.bio,
    convWaterFootprint: WATER_FACTORS.spices.conv,
    hsCode: '0910',
  },
  vanilla: {
    name: 'Vanille',
    categoryKeys: ['vanille', 'vanilla'],
    bioEmissionFactor: PRODUCTION_FACTORS.vanilla.bio,
    convEmissionFactor: PRODUCTION_FACTORS.vanilla.conv,
    bioWaterFootprint: WATER_FACTORS.vanilla.bio,
    convWaterFootprint: WATER_FACTORS.vanilla.conv,
    hsCode: '0905',
  },
  oils: {
    name: 'Huiles',
    categoryKeys: ['huile', 'oil', 'argan', 'karité', 'sesame'],
    bioEmissionFactor: PRODUCTION_FACTORS.oils.bio,
    convEmissionFactor: PRODUCTION_FACTORS.oils.conv,
    bioWaterFootprint: WATER_FACTORS.oils.bio,
    convWaterFootprint: WATER_FACTORS.oils.conv,
    hsCode: '1515',
  },
  dried_fruits: {
    name: 'Fruits secs & Noix',
    categoryKeys: ['fruits secs', 'noix', 'anacarde', 'mangue', 'dates', 'raisins', 'dried fruit'],
    bioEmissionFactor: PRODUCTION_FACTORS.dried_fruits.bio,
    convEmissionFactor: PRODUCTION_FACTORS.dried_fruits.conv,
    bioWaterFootprint: WATER_FACTORS.dried_fruits.bio,
    convWaterFootprint: WATER_FACTORS.dried_fruits.conv,
    hsCode: '0813',
  },
  honey: {
    name: 'Miel',
    categoryKeys: ['miel', 'honey'],
    bioEmissionFactor: PRODUCTION_FACTORS.honey.bio,
    convEmissionFactor: PRODUCTION_FACTORS.honey.conv,
    bioWaterFootprint: WATER_FACTORS.honey.bio,
    convWaterFootprint: WATER_FACTORS.honey.conv,
    hsCode: '0409',
  },
  cereals: {
    name: 'Céréales & Grains',
    categoryKeys: ['céréales', 'grains', 'riz', 'fonio', 'quinoa', 'cereals'],
    bioEmissionFactor: PRODUCTION_FACTORS.cereals.bio,
    convEmissionFactor: PRODUCTION_FACTORS.cereals.conv,
    bioWaterFootprint: WATER_FACTORS.cereals.bio,
    convWaterFootprint: WATER_FACTORS.cereals.conv,
    hsCode: '1008',
  },
  cosmetics: {
    name: 'Cosmétiques Naturels',
    categoryKeys: ['cosmétique', 'savon', 'baume', 'creme', 'cosmetics'],
    bioEmissionFactor: PRODUCTION_FACTORS.cosmetics.bio,
    convEmissionFactor: PRODUCTION_FACTORS.cosmetics.conv,
    bioWaterFootprint: WATER_FACTORS.cosmetics.bio,
    convWaterFootprint: WATER_FACTORS.cosmetics.conv,
    hsCode: '3304',
  },
};

export const TRANSPORT_EMISSION_FACTORS: Record<string, number> = {
  air: 0.602,      // kg CO2e par tonne.km (aérien cargo)
  dhl: 0.602,      // express aérien
  ups: 0.602,      // express aérien
  sea: 0.016,      // maritime porte-conteneurs
  maritime: 0.016,  // maritime
  road: 0.062,     // routier
  rail: 0.023,     // ferroviaire
};

export const PACKAGING_EMISSION_FACTORS: Record<string, number> = {
  'Jute biodégradable': 0.1,
  'Carton recyclé': 0.3,
  'Sac papier': 0.25,
  'Plastique recyclable': 1.5,
  'Verre': 0.8,
  'Autre': 0.5,
  // Alias keys
  cardboard: 0.3,
  jute: 0.1,
  plastic: 1.5,
  glass: 0.8,
};

export const BIODIVERSITY_SPECIES_DENSITY: Record<string, number> = {
  'Afrique': 150,
  'Amérique latine': 200,
  'Asie': 180,
  'Europe': 80,
  'Moyen-Orient': 60,
};

export const BIODIVERSITY_PRESERVATION_FACTORS: Record<string, number> = {
  'Agriculture biologique': 0.30,
  'Permaculture': 0.45,
  'Biodynamie': 0.40,
  'Agroforesterie': 0.60,
  'Agriculture raisonnée': 0.15,
  'Conventionnelle': 0.0,
};

export const BIODIVERSITY_TREE_DENSITY: Record<string, number> = {
  'Agriculture biologique': 40,
  'Agroforesterie': 200,
  'Permaculture': 120,
  'Biodynamie': 80,
  'Agriculture raisonnée': 20,
  'Conventionnelle': 5,
};

export const ACP_COUNTRIES = [
  'éthiopie', 'ethiopia', 'ghana', 'kenya', 'madagascar', 'maroc', 'morocco',
  'côte d\'ivoire', 'ivory coast', 'cameroun', 'cameroon', 'tanzanie', 'tanzania',
  'sénégal', 'senegal', 'togo', 'bénin', 'benin', 'tunisie', 'tunisia', 'ouganda', 'uganda',
  'rwanda', 'mali', 'burkina faso', 'guinée', 'guinea', 'gabon', 'nigéria', 'nigeria'
];

export const TRADE_DISTANCES: Record<string, number> = {
  'Éthiopie-France': 5800,
  'Ghana-France': 5100,
  'Kenya-France': 6500,
  'Madagascar-France': 8700,
  'Maroc-France': 2000,
  'Côte d\'Ivoire-France': 4800,
  'Cameroun-France': 5000,
  'Sénégal-France': 4200,
  'Tanzanie-France': 7200,
  'Iran-France': 4500,
  'Bénin-France': 4700,
  'Gabon-France': 5400,
  'Nigéria-France': 4600,
};

export const LIVING_WAGES: Record<string, number> = {
  'éthiopie': 180,
  'ghana': 220,
  'kenya': 250,
  'madagascar': 160,
  'maroc': 320,
  'côte d\'ivoire': 240,
  'cameroun': 230,
  'tanzanie': 200,
  'sénégal': 220,
  'default': 210,
};

export const EU_VAT_RATES: Record<string, { food: number; general: number }> = {
  'france': { food: 0.055, general: 0.20 },
  'allemagne': { food: 0.07, general: 0.19 },
  'germany': { food: 0.07, general: 0.19 },
  'belgique': { food: 0.06, general: 0.21 },
  'belgium': { food: 0.06, general: 0.21 },
  'espagne': { food: 0.10, general: 0.21 },
  'spain': { food: 0.10, general: 0.21 },
  'italie': { food: 0.04, general: 0.22 },
  'italy': { food: 0.04, general: 0.22 },
  'pays-bas': { food: 0.09, general: 0.21 },
  'netherlands': { food: 0.09, general: 0.21 },
  'default': { food: 0.055, general: 0.20 },
};
