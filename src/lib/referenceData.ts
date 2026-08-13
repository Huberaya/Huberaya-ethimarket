/**
 * EthiMarket — Scientifically Backed Environmental & Economic Reference Data
 * 
 * Sources & Methodologies:
 * - Carbon Footprint: WRI/WBCSD GHG Protocol (Scopes 1, 2, 3), ADEME Base Carbone®, Agribalyse 3.1
 * - Water Footprint: Water Footprint Network (Mekonnen & Hoekstra, UNESCO-IHE)
 * - Biodiversity: IBAT (Integrated Biodiversity Assessment Tool), FAO Agroforestry Guidelines
 * - Economic & Social: Fairtrade International Impact Assessment, UN Sustainable Development Goals (SDGs)
 * - Customs & Trade: EU Combined Nomenclature (TARIC), Cotonou / Everything But Arms (EBA) Agreements
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

export const PRODUCT_FACTORS: Record<string, ProductFactor> = {
  coffee: {
    name: 'Café',
    categoryKeys: ['café', 'coffee', 'cafe'],
    bioEmissionFactor: 1.2,
    convEmissionFactor: 4.5,
    bioWaterFootprint: 5400,
    convWaterFootprint: 18900,
    hsCode: '0901',
  },
  cocoa: {
    name: 'Cacao',
    categoryKeys: ['cacao', 'cocoa', 'chocolat'],
    bioEmissionFactor: 2.8,
    convEmissionFactor: 8.0,
    bioWaterFootprint: 8200,
    convWaterFootprint: 27000,
    hsCode: '1801',
  },
  tea: {
    name: 'Thé',
    categoryKeys: ['thé', 'tea', 'infusion'],
    bioEmissionFactor: 0.9,
    convEmissionFactor: 3.2,
    bioWaterFootprint: 2700,
    convWaterFootprint: 8860,
    hsCode: '0902',
  },
  spices: {
    name: 'Épices',
    categoryKeys: ['épices', 'spices', 'poivre', 'gingembre', 'curcuma', 'cannelle'],
    bioEmissionFactor: 0.5,
    convEmissionFactor: 2.0,
    bioWaterFootprint: 1500,
    convWaterFootprint: 5000,
    hsCode: '0910',
  },
  vanilla: {
    name: 'Vanille',
    categoryKeys: ['vanille', 'vanilla'],
    bioEmissionFactor: 1.8,
    convEmissionFactor: 5.5,
    bioWaterFootprint: 7500,
    convWaterFootprint: 25000,
    hsCode: '0905',
  },
  oils: {
    name: 'Huiles',
    categoryKeys: ['huile', 'oil', 'argan', 'karité', 'sesame'],
    bioEmissionFactor: 1.5,
    convEmissionFactor: 4.0,
    bioWaterFootprint: 3200,
    convWaterFootprint: 14400,
    hsCode: '1515',
  },
  dried_fruits: {
    name: 'Fruits secs & Noix',
    categoryKeys: ['fruits secs', 'noix', 'anacarde', 'mangue', 'dates', 'raisins', 'dried fruit'],
    bioEmissionFactor: 0.8,
    convEmissionFactor: 2.5,
    bioWaterFootprint: 4000,
    convWaterFootprint: 9063,
    hsCode: '0813',
  },
  honey: {
    name: 'Miel',
    categoryKeys: ['miel', 'honey'],
    bioEmissionFactor: 0.3,
    convEmissionFactor: 1.2,
    bioWaterFootprint: 800,
    convWaterFootprint: 3000,
    hsCode: '0409',
  },
};

/**
  * ADEME Base Carbone® Freight Transport Emission Factors (kg CO2e / t.km)
  */
export const TRANSPORT_EMISSION_FACTORS: Record<string, number> = {
  air: 0.602,    // Transport aérien long-courrier cargo
  sea: 0.016,    // Navire porte-conteneurs transocéanique
  road: 0.062,   // Poids lourd articulé >33t
  rail: 0.023,   // Fret ferroviaire électriqué
};

/**
 * Packaging Emission Factors (kg CO2e / kg of packaging material)
 */
export const PACKAGING_EMISSION_FACTORS: Record<string, number> = {
  cardboard: 0.3, // Carton recyclé FSC
  jute: 0.1,      // Toile de jute 100% biodégradable
  plastic: 2.0,   // Plastique Vierge PE/PP
  glass: 0.8,     // Verre moulé léger
};

/**
 * Biodiversity Preservation Boost Factors (IBAT methodology vs. conventional intensive monoculture)
 */
export const CULTIVATION_BIODIVERSITY_BOOST: Record<string, number> = {
  organic: 0.30,          // +30% d'espèces préservées (Bio contrôlé)
  agroforestry: 0.50,     // +50% d'espèces préservées (Agroforesterie sous ombrage)
  permaculture: 0.45,      // +45% d'espèces préservées (Permaculture régénérative)
  organic_shade: 0.60,    // +60% d'espèces préservées (Bio + couvert arboré dense)
};

/**
 * Species density per hectare by geographic region (IBAT Species Richness Index)
 */
export const REGION_SPECIES_DENSITY: Record<string, number> = {
  tropical_africa: 150,   // Afrique tropicale (ex: Côte d'Ivoire, Cameroun, Ghana)
  latin_america: 200,     // Amérique latine (Amazonie, Amérique Centrale)
  southeast_asia: 180,    // Asie du Sud-Est (Indonésie, Vietnam)
  mediterranean: 80,      // Région Méditerranéenne (Maroc, Tunisie)
  sub_saharan: 120,       // Afrique subsaharienne est (Éthiopie, Kenya)
};

/**
 * Trees preserved per hectare by practice
 */
export const TREES_PRESERVED_PER_HA: Record<string, number> = {
  organic: 80,
  agroforestry: 200,
  permaculture: 160,
  organic_shade: 220,
};

/**
 * ACP (Africa, Caribbean, Pacific) Countries exempt from EU import duties under EPA/EBA
 */
export const ACP_COUNTRIES = [
  'éthiopie', 'ethiopia', 'ghana', 'kenya', 'madagascar', 'maroc', 'morocco',
  'côte d\'ivoire', 'ivory coast', 'cameroun', 'cameroon', 'tanzanie', 'tanzania',
  'sénégal', 'senegal', 'togo', 'bénin', 'benin', 'tunisie', 'tunisia', 'ouganda', 'uganda',
  'rwanda', 'mali', 'burkina faso', 'guinée', 'guinea'
];

/**
 * Real distances between producing countries and destination countries (km)
 */
export const TRADE_DISTANCES: Record<string, { air: number; sea: number }> = {
  'éthiopie-france': { air: 5800, sea: 8200 },
  'ghana-france': { air: 5100, sea: 6500 },
  'kenya-france': { air: 6500, sea: 9800 },
  'madagascar-france': { air: 8700, sea: 11500 },
  'maroc-france': { air: 2000, sea: 2800 },
  'côte d\'ivoire-france': { air: 4800, sea: 6200 },
  'cameroun-france': { air: 5000, sea: 6800 },
  'tanzanie-france': { air: 7200, sea: 10500 },
  'sénégal-france': { air: 4200, sea: 5500 },
};

/**
 * Minimum monthly living wage standards (USD/EUR equivalent) by country (Fairtrade / Anker Methodology)
 */
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

/**
 * European Union Food & General VAT Rates by Destination Country
 */
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
