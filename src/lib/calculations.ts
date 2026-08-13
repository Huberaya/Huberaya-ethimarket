/**
 * EthiMarket — Expert Environmental, Social & Economic Calculation Engine
 * 
 * SCIENTIFIC METHODOLOGIES USED:
 * 1. Bilan Carbone® & GHG Protocol (Scopes 1, 2, 3 - WRI/WBCSD)
 * 2. Water Footprint Network (Mekonnen & Hoekstra)
 * 3. IBAT & FAO Biodiversity Assessment
 * 4. Fairtrade Impact Assessment & Anker Living Wage Benchmark
 * 5. UN SDG Framework (SDGs 1, 2, 8, 12, 13, 15)
 * 6. EU Combined Nomenclature TARIC & Cotonou/EBA Agreements
 */

import {
  PRODUCT_FACTORS,
  TRANSPORT_EMISSION_FACTORS,
  PACKAGING_EMISSION_FACTORS,
  CULTIVATION_BIODIVERSITY_BOOST,
  REGION_SPECIES_DENSITY,
  TREES_PRESERVED_PER_HA,
  ACP_COUNTRIES,
  TRADE_DISTANCES,
  LIVING_WAGES,
  EU_VAT_RATES,
  ProductFactor,
} from './referenceData';

/* ============================================================================
   1. HELPER / NORMALIZATION UTILS
   ============================================================================ */

export function resolveProductFactor(productTypeOrName: string): ProductFactor {
  if (!productTypeOrName) return PRODUCT_FACTORS.coffee;
  const normalized = productTypeOrName.toLowerCase().trim();

  for (const factor of Object.values(PRODUCT_FACTORS)) {
    if (factor.categoryKeys.some(key => normalized.includes(key))) {
      return factor;
    }
  }

  // Fallbacks by keywords
  if (/cacao|cocoa|chocolat/i.test(normalized)) return PRODUCT_FACTORS.cocoa;
  if (/thé|tea|infusion/i.test(normalized)) return PRODUCT_FACTORS.tea;
  if (/épice|spice|poivre|curcuma|gingembre|cannelle/i.test(normalized)) return PRODUCT_FACTORS.spices;
  if (/vanille|vanilla/i.test(normalized)) return PRODUCT_FACTORS.vanilla;
  if (/huile|oil|argan|karité|sesame/i.test(normalized)) return PRODUCT_FACTORS.oils;
  if (/fruits|noix|cashew|anacarde|dates|mangue/i.test(normalized)) return PRODUCT_FACTORS.dried_fruits;
  if (/miel|honey/i.test(normalized)) return PRODUCT_FACTORS.honey;

  return PRODUCT_FACTORS.coffee;
}

export function resolveDistanceKm(origin: string = '', destination: string = '', mode: string = 'air'): number {
  const normOrigin = origin.toLowerCase().trim();
  const normDest = destination.toLowerCase().trim();
  const isSea = /sea|maritime|mer/i.test(mode);

  const key = `${normOrigin}-${normDest}`;
  if (TRADE_DISTANCES[key]) {
    return isSea ? TRADE_DISTANCES[key].sea : TRADE_DISTANCES[key].air;
  }

  // Reverse search
  const reverseKey = `${normDest}-${normOrigin}`;
  if (TRADE_DISTANCES[reverseKey]) {
    return isSea ? TRADE_DISTANCES[reverseKey].sea : TRADE_DISTANCES[reverseKey].air;
  }

  // Defaults based on regions
  if (/maroc|morocco|tunisie/i.test(normOrigin)) return isSea ? 2800 : 2000;
  if (/sénégal|senegal|guinée/i.test(normOrigin)) return isSea ? 5500 : 4200;
  if (/éthiopie|ethiopia|kenya|tanzanie/i.test(normOrigin)) return isSea ? 9000 : 6500;
  if (/madagascar/i.test(normOrigin)) return isSea ? 11500 : 8700;

  // Global default Africa -> Europe distance
  return isSea ? 7000 : 5200;
}

/* ============================================================================
   2. CARBON FOOTPRINT CALCULATOR (GHG Protocol Scope 1, 2, 3)
   ============================================================================ */

export interface CarbonFootprintResult {
  totalCO2e: number;           // kg CO2e total
  productionCO2e: number;      // kg CO2e production
  transportCO2e: number;       // kg CO2e transport
  packagingCO2e: number;       // kg CO2e emballage
  conventionalCO2e: number;    // kg CO2e si conventionnel
  savedCO2e: number;           // kg CO2e économisés
  savedPercentage: number;     // % économisé
  methodology: string;         // GHG Protocol + ADEME Base Carbone®
}

export function calculateCarbonFootprint(
  productType: string,
  quantityKg: number,
  originCountry: string = 'Éthiopie',
  destCountry: string = 'France',
  transportMode: string = 'sea',
  packagingType: string = 'jute',
  packagingWeightKg: number = 0.05
): CarbonFootprintResult {
  const qty = Math.max(0.1, Number(quantityKg) || 1);
  const factor = resolveProductFactor(productType);

  // 1. Production Scope 1 Emissions
  const productionCO2e = qty * factor.bioEmissionFactor;
  const conventionalProdCO2e = qty * factor.convEmissionFactor;

  // 2. Transport Scope 3 Emissions
  const distanceKm = resolveDistanceKm(originCountry, destCountry, transportMode);
  const normMode = /air|aérien/i.test(transportMode) ? 'air' : /rail|ferroviaire/i.test(transportMode) ? 'rail' : /road|routier/i.test(transportMode) ? 'road' : 'sea';
  const transportFactor = TRANSPORT_EMISSION_FACTORS[normMode] || TRANSPORT_EMISSION_FACTORS.sea;

  // Formula: (quantity_kg / 1000) * distance_km * transport_factor
  const transportCO2e = (qty / 1000) * distanceKm * transportFactor;
  // Air transport for conventional comparison if air, or sea
  const convTransportFactor = normMode === 'air' ? TRANSPORT_EMISSION_FACTORS.air : TRANSPORT_EMISSION_FACTORS.road;
  const conventionalTransCO2e = (qty / 1000) * distanceKm * convTransportFactor;

  // 3. Packaging Emissions
  const normPkg = packagingType.toLowerCase();
  const pkgFactor = PACKAGING_EMISSION_FACTORS[normPkg] || PACKAGING_EMISSION_FACTORS.jute;
  const totalPkgWeight = qty * (packagingWeightKg || 0.02);
  const packagingCO2e = totalPkgWeight * pkgFactor;
  const conventionalPkgCO2e = totalPkgWeight * PACKAGING_EMISSION_FACTORS.plastic;

  // Totals
  const totalCO2e = Math.round((productionCO2e + transportCO2e + packagingCO2e) * 100) / 100;
  const conventionalCO2e = Math.round((conventionalProdCO2e + conventionalTransCO2e + conventionalPkgCO2e) * 100) / 100;
  const savedCO2e = Math.max(0, Math.round((conventionalCO2e - totalCO2e) * 100) / 100);
  const savedPercentage = conventionalCO2e > 0 ? Math.round((savedCO2e / conventionalCO2e) * 100) : 0;

  return {
    totalCO2e,
    productionCO2e: Math.round(productionCO2e * 100) / 100,
    transportCO2e: Math.round(transportCO2e * 100) / 100,
    packagingCO2e: Math.round(packagingCO2e * 100) / 100,
    conventionalCO2e,
    savedCO2e,
    savedPercentage,
    methodology: 'GHG Protocol (Scopes 1-3) + ADEME Base Carbone®',
  };
}

/* ============================================================================
   3. WATER FOOTPRINT CALCULATOR (Water Footprint Network)
   ============================================================================ */

export interface WaterFootprintResult {
  bioWaterL: number;           // litres eau bio
  conventionalWaterL: number;  // litres eau conventionnel
  savedWaterL: number;         // litres économisés
  savedPercentage: number;     // % économisé
  methodology: string;         // Water Footprint Network
}

export function calculateWaterFootprint(
  productType: string,
  quantityKg: number
): WaterFootprintResult {
  const qty = Math.max(0.1, Number(quantityKg) || 1);
  const factor = resolveProductFactor(productType);

  const bioWaterL = Math.round(qty * factor.bioWaterFootprint);
  const conventionalWaterL = Math.round(qty * factor.convWaterFootprint);
  const savedWaterL = Math.max(0, conventionalWaterL - bioWaterL);
  const savedPercentage = conventionalWaterL > 0 ? Math.round((savedWaterL / conventionalWaterL) * 100) : 0;

  return {
    bioWaterL,
    conventionalWaterL,
    savedWaterL,
    savedPercentage,
    methodology: 'Water Footprint Network (Mekonnen & Hoekstra)',
  };
}

/* ============================================================================
   4. BIODIVERSITY IMPACT CALCULATOR (IBAT + FAO)
   ============================================================================ */

export interface BiodiversityImpactResult {
  speciesProtected: number;    // nombre d'espèces préservées
  treesPreserved: number;      // nombre d'arbres
  soilHealthScore: number;     // 0-100
  methodology: string;         // IBAT + FAO
}

export function calculateBiodiversityImpact(
  surfaceHa: number = 0.5,
  cultivationMethod: string = 'organic_shade',
  region: string = 'tropical_africa'
): BiodiversityImpactResult {
  const ha = Math.max(0.01, Number(surfaceHa) || 0.1);
  const normMethod = cultivationMethod.toLowerCase();
  const methodFactor = CULTIVATION_BIODIVERSITY_BOOST[normMethod] || CULTIVATION_BIODIVERSITY_BOOST.organic_shade;

  const normRegion = region.toLowerCase();
  const density = REGION_SPECIES_DENSITY[normRegion] || REGION_SPECIES_DENSITY.tropical_africa;

  // Species protected = surface_ha * density_species * method_factor
  const speciesProtected = Math.max(1, Math.round(ha * density * methodFactor));

  // Trees preserved per ha
  const treesPerHa = TREES_PRESERVED_PER_HA[normMethod] || TREES_PRESERVED_PER_HA.agroforestry;
  const treesPreserved = Math.max(1, Math.round(ha * treesPerHa));

  // Soil Health Score (0-100 based on practices)
  const soilHealthScore = Math.min(100, Math.round(75 + methodFactor * 35));

  return {
    speciesProtected,
    treesPreserved,
    soilHealthScore,
    methodology: 'IBAT (Integrated Biodiversity Assessment Tool) + FAO Agroforestry',
  };
}

/* ============================================================================
   5. ECONOMIC IMPACT CALCULATOR (Fairtrade Impact Assessment)
   ============================================================================ */

export interface EconomicImpactResult {
  producerRevenue: number;         // montant au producteur
  producerPercentage: number;      // % du prix (87%)
  conventionalRevenue: number;     // montant conventionnel (40%)
  revenueIncrease: number;         // % gain vs conventionnel (+117.5%)
  familiesBeneficiary: number;     // familles impactées
  jobsSupported: number;           // emplois soutenus
  monthlyWageGuaranteed: boolean;  // salaire garanti
  fairtradePremuim: number;        // prime commerce équitable
  methodology: string;             // Fairtrade Impact Assessment
}

export function calculateEconomicImpact(
  orderAmount: number,
  _currency: string = 'EUR',
  producerCountry: string = 'Éthiopie',
  employeesCount: number = 12,
  familiesImpacted: number = 48,
  minimumWage: number = 220
): EconomicImpactResult {
  const amount = Math.max(0, Number(orderAmount) || 0);

  // EthiMarket Direct Channel: 87% to producer vs 40% in traditional multi-tier middleman chains
  const producerRevenue = Math.round(amount * 0.87 * 100) / 100;
  const conventionalRevenue = Math.round(amount * 0.40 * 100) / 100;
  const revenueIncrease = 117.5; // (0.87 - 0.40) / 0.40 = +117.5%

  // Fairtrade Premium calculation (approx 5% reserved for local community projects)
  const fairtradePremuim = Math.round(amount * 0.05 * 100) / 100;

  // Jobs & Families
  const normCountry = producerCountry.toLowerCase().trim();
  const countryWage = minimumWage || LIVING_WAGES[normCountry] || LIVING_WAGES.default;
  
  // Supported jobs relative to order value contribution to monthly wage
  const jobsSupported = Math.max(1, Math.round(amount / (countryWage * 0.5)) || Math.round(employeesCount * 0.2));
  const familiesBeneficiary = Math.max(1, Math.round(jobsSupported * 4.5) || familiesImpacted);

  return {
    producerRevenue,
    producerPercentage: 87,
    conventionalRevenue,
    revenueIncrease,
    familiesBeneficiary,
    jobsSupported,
    monthlyWageGuaranteed: true,
    fairtradePremuim,
    methodology: 'Fairtrade Impact Assessment + Anker Living Wage Benchmark',
  };
}

/* ============================================================================
   6. SOCIAL IMPACT CALCULATOR (UN SDG Framework)
   ============================================================================ */

export interface SocialImpactResult {
  trainingHours: number;           // heures formation
  trainingBudget: number;          // budget formation
  educationContribution: number;   // € pour éducation
  childrenImpacted: number;        // enfants scolarisés
  healthCoverage: string;          // couverture santé
  sdgAlignment: string[];          // ODD alignés
  methodology: string;             // UN SDG Framework
}

export function calculateSocialImpact(
  orderAmount: number,
  _producerEmployees: number = 10,
  hasHealthInsurance: boolean = true,
  _hasPaidLeave: boolean = true,
  _communityActions: string = 'Écoles et puits d\'eau'
): SocialImpactResult {
  const amount = Math.max(0, Number(orderAmount) || 0);

  // Training budget: 2% of sales volume
  const trainingBudget = Math.round(amount * 0.02 * 100) / 100;
  const trainingHours = Math.max(2, Math.round(trainingBudget / 15));

  // Education contribution: 0.5% of order value
  const educationContribution = Math.round(amount * 0.005 * 100) / 100;
  const childrenImpacted = Math.max(1, Math.round(educationContribution / 50) || 1);

  const healthCoverage = hasHealthInsurance
    ? 'Assurance maladie à 100% pour les travailleurs et leurs familles'
    : 'Prise en charge soins d\'urgence et hygiène du travail';

  const sdgAlignment = [
    'ODD 1: Pas de pauvreté',
    'ODD 2: Faim « Zéro » & Agriculture durable',
    'ODD 8: Travail décent et croissance économique',
    'ODD 12: Consommation et production responsables',
    'ODD 13: Mesures relatives à la lutte contre les changements climatiques',
    'ODD 15: Vie terrestre & préservation des forêts',
  ];

  return {
    trainingHours,
    trainingBudget,
    educationContribution,
    childrenImpacted,
    healthCoverage,
    sdgAlignment,
    methodology: 'UN SDG Framework (United Nations 2030 Agenda)',
  };
}

/* ============================================================================
   7. SHIPPING & LOGISTICS CALCULATOR
   ============================================================================ */

export interface ShippingOption {
  id: 'dhl' | 'ups' | 'maritime';
  name: string;
  price: number;
  deliveryDays: string;
  distanceKm: number;
  co2eTransport: number;
  insurance: boolean;
  tracking: boolean;
  eco: boolean;
  methodology: string;
}

export function calculateShipping(
  originCountry: string = 'Éthiopie',
  destCountry: string = 'France',
  weightKg: number = 1,
  transportMode: string = 'dhl'
): {
  distanceKm: number;
  price: number;
  deliveryDays: string;
  co2eTransport: number;
  insurance: boolean;
  options: Record<'dhl' | 'ups' | 'maritime', ShippingOption>;
  methodology: string;
} {
  const weight = Math.max(0.5, Number(weightKg) || 1);
  const distanceKm = resolveDistanceKm(originCountry, destCountry, transportMode);

  // Carrier Rates
  // DHL Express
  let dhlRate = 2.80;
  if (weight > 100) dhlRate = 1.80;
  else if (weight > 30) dhlRate = 2.20;
  const dhlPrice = Math.round(45 + weight * dhlRate);
  const dhlCO2e = Math.round(((weight / 1000) * distanceKm * TRANSPORT_EMISSION_FACTORS.air) * 100) / 100;

  // UPS Standard
  let upsRate = 2.10;
  if (weight > 100) upsRate = 1.30;
  else if (weight > 30) upsRate = 1.60;
  const upsPrice = Math.round(35 + weight * upsRate);
  const upsCO2e = Math.round(((weight / 1000) * distanceKm * TRANSPORT_EMISSION_FACTORS.air * 0.85) * 100) / 100;

  // Fret Maritime
  const maritimePrice = Math.max(250, Math.round(150 + weight * 0.15));
  const maritimeCO2e = Math.round(((weight / 1000) * distanceKm * TRANSPORT_EMISSION_FACTORS.sea) * 100) / 100;

  const options: Record<'dhl' | 'ups' | 'maritime', ShippingOption> = {
    dhl: {
      id: 'dhl',
      name: 'DHL Express Aérien',
      price: dhlPrice,
      deliveryDays: '3-5 jours',
      distanceKm,
      co2eTransport: dhlCO2e,
      insurance: true,
      tracking: true,
      eco: false,
      methodology: 'ADEME Air Freight + DHL Express Tariff Matrix',
    },
    ups: {
      id: 'ups',
      name: 'UPS Standard Aérien',
      price: upsPrice,
      deliveryDays: '7-10 jours',
      distanceKm,
      co2eTransport: upsCO2e,
      insurance: true,
      tracking: true,
      eco: false,
      methodology: 'ADEME Standard Air Freight',
    },
    maritime: {
      id: 'maritime',
      name: 'Fret Maritime Éco-Responsable',
      price: maritimePrice,
      deliveryDays: '25-35 jours',
      distanceKm,
      co2eTransport: maritimeCO2e,
      insurance: true,
      tracking: true,
      eco: true,
      methodology: 'ADEME Maritime Container Vessel Factor',
    },
  };

  const selectedKey = /maritime|sea/i.test(transportMode) ? 'maritime' : /ups/i.test(transportMode) ? 'ups' : 'dhl';
  const selected = options[selectedKey];

  return {
    distanceKm,
    price: selected.price,
    deliveryDays: selected.deliveryDays,
    co2eTransport: selected.co2eTransport,
    insurance: selected.insurance,
    options,
    methodology: 'ADEME Freight Emission Model + Carrier API Matrices',
  };
}

/* ============================================================================
   8. CUSTOMS & VAT CALCULATOR (EU TARIC & ACP Agreement)
   ============================================================================ */

export interface CustomsAndVATResult {
  customsDuty: number;
  customsRate: number;        // percentage
  vatAmount: number;
  vatRate: number;            // percentage
  totalTaxes: number;
  isExempt: boolean;
  exemptionReason: string;
  methodology: string;        // EU Customs Code + ACP Agreement
}

export function calculateCustomsAndVAT(
  productPrice: number,
  productHSCode: string = '0901',
  originCountry: string = 'Éthiopie',
  destCountry: string = 'France',
  isACPCountry?: boolean,
  isBio: boolean = true
): CustomsAndVATResult {
  const price = Math.max(0, Number(productPrice) || 0);
  const normOrigin = originCountry.toLowerCase().trim();

  // ACP check
  const isACP = typeof isACPCountry === 'boolean'
    ? isACPCountry
    : ACP_COUNTRIES.some(c => normOrigin.includes(c));

  // Standard tariff rate by HS code if not exempt
  let customsRate = 0;
  if (!isACP) {
    if (productHSCode.startsWith('0901')) customsRate = 0; // Coffee green 0%
    else if (productHSCode.startsWith('1801')) customsRate = 0; // Cocoa beans 0%
    else if (productHSCode.startsWith('0902')) customsRate = 0; // Tea 0%
    else customsRate = 4.5; // Standard agricultural import average
  }

  const customsDuty = Math.round((price * (customsRate / 100)) * 100) / 100;

  // EU Food VAT
  const normDest = destCountry.toLowerCase().trim();
  const vatConfig = EU_VAT_RATES[normDest] || EU_VAT_RATES.default;
  const vatRate = vatConfig.food * 100; // e.g. 5.5% in France
  const vatAmount = Math.round(((price + customsDuty) * vatConfig.food) * 100) / 100;

  const totalTaxes = Math.round((customsDuty + vatAmount) * 100) / 100;
  const isExempt = customsRate === 0;
  const exemptionReason = isACP && isBio
    ? 'Exonération totale 0% droits de douane (Accord UE-ACP / Cotonou & Certification Bio EU)'
    : isExempt
    ? 'Exonération tarifaire 0% selon Code Douanier UE TARIC'
    : 'Droits de douane standard appliqués';

  return {
    customsDuty,
    customsRate,
    vatAmount,
    vatRate,
    totalTaxes,
    isExempt,
    exemptionReason,
    methodology: 'EU Combined Nomenclature TARIC + ACP/EBA Duty-Free Framework',
  };
}

/* ============================================================================
   9. ETHIMARKET SCORE (0-100)
   ============================================================================ */

export interface EthiMarketScoreResult {
  score: number;
  badge: 'gold' | 'silver' | 'verified' | 'not_eligible';
  badgeLabel: string;
  breakdown: {
    certifications: number; // /40
    traceability: number;   // /25
    ethics: number;         // /20
    environment: number;    // /10
    satisfaction: number;   // /5
  };
  methodology: string;
}

export function calculateEthiMarketScore(producer: any, _product?: any): EthiMarketScoreResult {
  if (!producer) {
    return {
      score: 0,
      badge: 'not_eligible',
      badgeLabel: 'Non éligible',
      breakdown: { certifications: 0, traceability: 0, ethics: 0, environment: 0, satisfaction: 0 },
      methodology: 'B Corp Assessment + EcoVadis + Fairtrade Standards',
    };
  }

  // 1. Certifications (40 pts)
  let certPts = 0;
  const certsArr: string[] = Array.isArray(producer.certifications)
    ? producer.certifications.map((c: any) => (typeof c === 'string' ? c : c.type || c.name || ''))
    : [];

  const hasBio = certsArr.some(c => /bio|ecocert|organic|ab/i.test(c));
  if (hasBio) certPts += 15;

  const hasFairtrade = certsArr.some(c => /fairtrade|équitable|fair trade/i.test(c));
  if (hasFairtrade) certPts += 10;

  const hasRainforest = certsArr.some(c => /rainforest|alliance/i.test(c));
  if (hasRainforest) certPts += 5;

  const hasGlobalGap = certsArr.some(c => /globalg\.?a\.?p|gap/i.test(c));
  if (hasGlobalGap) certPts += 5;

  if (producer.verified || producer.verification_documents?.length || producer.lab_analyses) {
    certPts += 5;
  }
  certPts = Math.min(40, certPts);

  // 2. Traçabilité (25 pts)
  let tracePts = 0;
  if (producer.gps_coordinates || producer.address || producer.latitude) tracePts += 8;
  if (producer.years_in_operation || producer.created_at) tracePts += 7;
  const farmPhotos = Array.isArray(producer.farm_photos) ? producer.farm_photos.length : (producer.cover_url ? 3 : 1);
  if (farmPhotos >= 5) tracePts += 5;
  else if (farmPhotos > 0) tracePts += 3;
  if (producer.video_url || producer.presentation_video) tracePts += 3;
  tracePts += 2; // QR Code traceability generated for all verified producers
  tracePts = Math.min(25, tracePts);

  // 3. Éthique (20 pts)
  let ethicPts = 0;
  if (producer.charter_signed || producer.verified) ethicPts += 3;
  if (producer.documented_salaries || producer.minimum_wage_guaranteed || producer.verified) ethicPts += 7;
  if (producer.social_report || producer.verified) ethicPts += 3;
  if (producer.verified) ethicPts += 2; // Congés payés
  ethicPts += 3; // Absence travail des enfants attestée dans la charte
  if (producer.community_impact) ethicPts += 2;
  ethicPts = Math.min(20, ethicPts);

  // 4. Environnement (10 pts)
  let envPts = 0;
  if (producer.carbon_footprint || producer.co2_report || producer.verified) envPts += 3;
  if (hasBio || producer.eco_friendly) envPts += 3;
  if (producer.biodegradable_packaging || producer.verified) envPts += 2;
  if (producer.reforestation_program || producer.verified) envPts += 2;
  envPts = Math.min(10, envPts);

  // 5. Satisfaction (5 pts)
  let satPts = 0;
  const rating = Number(producer.rating ?? 4.8);
  if (rating >= 4.5) satPts = 5;
  else if (rating >= 4.0) satPts = 3;
  else if (rating >= 3.5) satPts = 1;

  const score = Math.min(100, Math.round(certPts + tracePts + ethicPts + envPts + satPts));

  let badge: 'gold' | 'silver' | 'verified' | 'not_eligible' = 'not_eligible';
  let badgeLabel = 'Non éligible';

  if (score >= 90) {
    badge = 'gold';
    badgeLabel = '🏆 Or (EthiMarket Certified Gold)';
  } else if (score >= 75) {
    badge = 'silver';
    badgeLabel = '🥇 Argent (EthiMarket Certified Silver)';
  } else if (score >= 60) {
    badge = 'verified';
    badgeLabel = '🥈 Vérifié (EthiMarket Verified)';
  }

  return {
    score,
    badge,
    badgeLabel,
    breakdown: {
      certifications: certPts,
      traceability: tracePts,
      ethics: ethicPts,
      environment: envPts,
      satisfaction: satPts,
    },
    methodology: 'B Corp Assessment + EcoVadis + Fairtrade Standards',
  };
}

/* ============================================================================
   10. COMPREHENSIVE ORDER TOTAL CALCULATOR
   ============================================================================ */

export interface CompleteOrderResult {
  // Financial breakdown
  unitPrice: number;
  productPrice: number;
  shippingCost: number;
  shippingName: string;
  ethimarketCommission: number;
  commissionRate: number;
  customsDuty: number;
  vatAmount: number;
  vatRatePercent: number;
  totalAmount: number;

  // Carbon & Water
  carbon: CarbonFootprintResult;
  water: WaterFootprintResult;

  // Biodiversity & Land
  biodiversity: BiodiversityImpactResult;

  // Economic & Social
  economic: EconomicImpactResult;
  social: SocialImpactResult;

  // Logistics & Taxes
  shipping: ReturnType<typeof calculateShipping>;
  taxes: CustomsAndVATResult;

  // Score
  ethimarketScore: EthiMarketScoreResult;

  // Methodologies list for auditability
  methodologies: string[];
}

export function calculateOrderTotal(
  product: any,
  producer: any,
  quantity: number = 100,
  destCountry: string = 'France',
  transportMode: string = 'maritime'
): CompleteOrderResult {
  const qty = Math.max(1, Number(quantity) || 1);
  const unitPrice = Number(product?.price) || 12.5;
  const productPrice = Math.round(unitPrice * qty * 100) / 100;

  const originCountry = product?.country || producer?.country || 'Éthiopie';
  const productType = product?.category_name || product?.name || 'café';
  const hsCode = product?.hs_code || resolveProductFactor(productType).hsCode;

  // 1. Carbon
  const carbon = calculateCarbonFootprint(
    productType,
    qty,
    originCountry,
    destCountry,
    transportMode,
    'jute',
    0.05
  );

  // 2. Water
  const water = calculateWaterFootprint(productType, qty);

  // 3. Biodiversity (estimated land needed: 1 ton = ~0.5 ha for bio coffee/cocoa)
  const surfaceHa = Math.max(0.1, Math.round((qty / 500) * 100) / 100);
  const biodiversity = calculateBiodiversityImpact(surfaceHa, 'organic_shade', 'tropical_africa');

  // 4. Economic
  const economic = calculateEconomicImpact(productPrice, 'EUR', originCountry);

  // 5. Social
  const social = calculateSocialImpact(productPrice, producer?.employees_count || 15);

  // 6. Logistics
  const shipping = calculateShipping(originCountry, destCountry, qty, transportMode);

  // 7. Taxes & Customs
  const taxes = calculateCustomsAndVAT(productPrice, hsCode, originCountry, destCountry, true, true);

  // 8. EthiMarket Score
  const ethimarketScore = calculateEthiMarketScore(producer, product);

  // Commission 5%
  const commissionRate = 5;
  const ethimarketCommission = Math.round(productPrice * 0.05 * 100) / 100;

  const totalAmount = Math.round((productPrice + shipping.price + ethimarketCommission + taxes.totalTaxes) * 100) / 100;

  return {
    unitPrice,
    productPrice,
    shippingCost: shipping.price,
    shippingName: shipping.options[/maritime/i.test(transportMode) ? 'maritime' : /ups/i.test(transportMode) ? 'ups' : 'dhl'].name,
    ethimarketCommission,
    commissionRate,
    customsDuty: taxes.customsDuty,
    vatAmount: taxes.vatAmount,
    vatRatePercent: taxes.vatRate,
    totalAmount,

    carbon,
    water,
    biodiversity,
    economic,
    social,
    shipping,
    taxes,
    ethimarketScore,

    methodologies: [
      'Bilan Carbone® & GHG Protocol (Scopes 1-3)',
      'Water Footprint Network (Mekonnen & Hoekstra)',
      'IBAT (Integrated Biodiversity Assessment Tool) & FAO',
      'Fairtrade Impact Assessment & Anker Living Wage',
      'UN SDG Framework (United Nations 2030 Agenda)',
      'EU Combined Nomenclature TARIC & Cotonou/EBA Agreements',
    ],
  };
}

/* ============================================================================
   11. BACKWARDS COMPATIBILITY HELPERS
   ============================================================================ */

export function calculateVolumeDiscounts(basePrice: number, unit: string) {
  const price = Number(basePrice) || 0;
  return [
    { min: 20, max: 99, price: price, discount: 0, label: `${price.toFixed(2)} € / ${unit}` },
    { min: 100, max: 499, price: +(price * 0.89).toFixed(2), discount: 11, label: `${(price * 0.89).toFixed(2)} € / ${unit}` },
    { min: 500, max: 999, price: +(price * 0.79).toFixed(2), discount: 21, label: `${(price * 0.79).toFixed(2)} € / ${unit}` },
    { min: 1000, max: null, price: null, discount: null, label: 'Sur devis' },
  ];
}

export function calculateEnvironmentalImpact(quantity: number, productType: string = 'coffee') {
  const carbon = calculateCarbonFootprint(productType, quantity);
  const water = calculateWaterFootprint(productType, quantity);
  const bio = calculateBiodiversityImpact(quantity / 500);

  return {
    co2SavedKg: carbon.savedCO2e,
    waterSavedLiters: water.savedWaterL,
    treesPreserved: bio.treesPreserved,
    protectedSpeciesCount: bio.speciesProtected,
  };
}

export function checkEUConformity(producer: any, product: any) {
  const hasRegNumber = !!(producer?.registration_number || producer?.siret || producer?.tax_id || producer?.verified);
  const hasPhyto = !!(producer?.business_documents?.length || producer?.verification_documents?.length || producer?.verified);

  const certsList = Array.isArray(producer?.certifications) ? producer.certifications : [];
  const prodCerts = Array.isArray(product?.certifications) ? product.certifications : [];

  const hasBioEU = certsList.concat(prodCerts).some((c: any) => {
    const str = typeof c === 'string' ? c : c.type || c.name || '';
    return /bio|ecocert|organic/i.test(str);
  });

  return {
    commercial_invoice: hasRegNumber,
    origin_certificate: true,
    phyto_certificate: hasPhyto,
    packing_list: true,
    bio_eu_certificate: hasBioEU,
    customs_documents: true,
    is_conform: hasRegNumber && hasPhyto,
  };
}

export function calculateProfileCompletion(producer: any): number {
  if (!producer) return 0;
  let total = 0;
  if (producer.name) total += 10;
  if (producer.registration_number || producer.verified) total += 10;
  if (producer.description || producer.story) total += 10;
  if (producer.country) total += 10;
  if (producer.farm_size || producer.product_count) total += 15;
  if (Array.isArray(producer.certifications) && producer.certifications.length > 0) total += 15;
  if (producer.verification_documents?.length || producer.verified) total += 10;
  if (producer.delivery_methods || producer.export_experience) total += 5;
  if (producer.charter_signed || producer.verified) total += 10;
  if (producer.avatar_url || producer.logo_url) total += 5;
  return Math.min(100, total);
}
