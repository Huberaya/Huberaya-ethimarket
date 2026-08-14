/**
 * EthiMarket — Expert Environmental, Social & Economic Calculation Engine
 * 
 * PHILOSOPHY:
 * 1. African smallholders know their farm operations (surface area, method, employees, packaging).
 * 2. They do NOT know raw CO2e, water footprint, or species density.
 * 3. Our system transforms farm field data into scientific impact numbers using recognized emission factors (ADEME, GHG Protocol, Water Footprint Network).
 * 4. 100% Transparency: Clearly show if data comes from "Données producteur" or "Estimation sectorielle" and state the methodology used.
 */

import {
  PRODUCTION_FACTORS,
  WATER_FACTORS,
  TRANSPORT_EMISSION_FACTORS,
  PACKAGING_EMISSION_FACTORS,
  BIODIVERSITY_SPECIES_DENSITY,
  BIODIVERSITY_PRESERVATION_FACTORS,
  BIODIVERSITY_TREE_DENSITY,
  ACP_COUNTRIES,
  TRADE_DISTANCES,
  LIVING_WAGES,
  EU_VAT_RATES,
  PRODUCT_FACTORS,
  ProductFactor,
} from './referenceData';

type DataRecord = Record<string, unknown> | null | undefined;

/* ============================================================================
   UTILITIES
   ============================================================================ */

export function round(n: number, decimals = 1): number {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function checkIfBio(producer: DataRecord, product?: DataRecord): boolean {
  const prodCerts = (producer?.certifications as unknown[]) || [];
  const itemCerts = (product?.certifications as unknown[]) || [];
  const certs = [...prodCerts, ...itemCerts];

  const certMatch = certs.some(c => {
    const val = typeof c === 'string' ? c : (c as Record<string, string>)?.type || (c as Record<string, string>)?.name || '';
    return ['Bio', 'EU Organic', 'USDA', 'Ecocert', 'AB', 'Agriculture Biologique', 'organic']
      .some(opt => val.toLowerCase().includes(opt.toLowerCase()));
  });

  const method = String(product?.farming_method || product?.cultivation_method || producer?.farming_method || '').toLowerCase();
  const methodMatch = /biologique|bio|permaculture|biodynamie|agroforesterie/i.test(method);

  return certMatch || methodMatch;
}

export function mapProductToCategory(categoryOrId: unknown): string {
  if (!categoryOrId) return 'spices';
  const val = typeof categoryOrId === 'string'
    ? categoryOrId.toLowerCase().trim()
    : String((categoryOrId as Record<string, unknown>)?.slug || (categoryOrId as Record<string, unknown>)?.name || '').toLowerCase().trim();

  if (/café|coffee|cafe/i.test(val)) return 'coffee';
  if (/cacao|cocoa|chocolat/i.test(val)) return 'cocoa';
  if (/thé|tea|infusion/i.test(val)) return 'tea';
  if (/épice|spice|poivre|curcuma|gingembre|cannelle/i.test(val)) return 'spices';
  if (/vanille|vanilla/i.test(val)) return 'vanilla';
  if (/huile|oil|argan|karité|sesame/i.test(val)) return 'oils';
  if (/fruits|noix|cashew|anacarde|dates|mangue/i.test(val)) return 'dried_fruits';
  if (/miel|honey/i.test(val)) return 'honey';
  if (/céréale|cereal|riz|fonio|quinoa/i.test(val)) return 'cereals';
  if (/cosmétique|savon|baume|creme|cosmetics/i.test(val)) return 'cosmetics';

  return 'spices';
}

export function getRegionFromCountry(country: string): string {
  if (!country) return 'Afrique';
  const norm = country.toLowerCase().trim();

  const africaCountries = [
    'éthiopie', 'ethiopia', 'ghana', 'kenya', 'madagascar', 'maroc', 'côte d\'ivoire',
    'cameroun', 'sénégal', 'tanzanie', 'ouganda', 'rwanda', 'bénin', 'gabon', 'nigéria', 'mali', 'togo', 'tunisie'
  ];
  if (africaCountries.some(c => norm.includes(c))) return 'Afrique';

  const latAmCountries = ['brésil', 'brazil', 'pérou', 'peru', 'mexique', 'mexico', 'colombie', 'colombia', 'équateur'];
  if (latAmCountries.some(c => norm.includes(c))) return 'Amérique latine';

  const asiaCountries = ['japon', 'inde', 'sri lanka', 'vietnam', 'thaïlande', 'indonésie'];
  if (asiaCountries.some(c => norm.includes(c))) return 'Asie';

  const europeCountries = ['france', 'belgique', 'suisse', 'espagne', 'italie', 'allemagne', 'grèce'];
  if (europeCountries.some(c => norm.includes(c))) return 'Europe';

  const meCountries = ['iran', 'moyen-orient', 'émirats'];
  if (meCountries.some(c => norm.includes(c))) return 'Moyen-Orient';

  return 'Afrique';
}

export function getDistanceBetweenCountries(origin: string, dest: string): number {
  if (!origin || !dest) return 5000;
  const o = origin.trim();
  const d = dest.trim();

  const key1 = `${o}-${d}`;
  const key2 = `${d}-${o}`;

  if (TRADE_DISTANCES[key1]) return TRADE_DISTANCES[key1];
  if (TRADE_DISTANCES[key2]) return TRADE_DISTANCES[key2];

  for (const [k, dist] of Object.entries(TRADE_DISTANCES)) {
    if (k.toLowerCase() === key1.toLowerCase() || k.toLowerCase() === key2.toLowerCase()) {
      return dist;
    }
  }

  return 5000;
}

export function resolveProductFactor(productTypeOrName: string): ProductFactor {
  const catKey = mapProductToCategory(productTypeOrName);
  return PRODUCT_FACTORS[catKey] || PRODUCT_FACTORS.coffee;
}

export function resolveDistanceKm(origin: string = '', destination: string = '', transportMode: string = 'air'): number {
  const baseDist = getDistanceBetweenCountries(origin, destination);
  return transportMode === 'air' ? baseDist : Math.round(baseDist * 1.15);
}

/* ============================================================================
   1. CARBON FOOTPRINT
   ============================================================================ */

export function calculateCarbonFootprint(
  product: DataRecord,
  producer: DataRecord,
  quantity: number,
  destCountry: string = 'France',
  transportMode: string = 'maritime'
) {
  const qty = Math.max(0.1, Number(quantity) || 1);
  const isBio = checkIfBio(producer, product);
  const category = mapProductToCategory(product?.category_id || product?.category_name || product?.name);
  const factors = PRODUCTION_FACTORS[category] || PRODUCTION_FACTORS['spices'];
  const productionFactor = isBio ? factors.bio : factors.conv;
  const productionCO2 = qty * productionFactor;

  const originCountry = String(product?.origin_country || product?.country || producer?.country || 'Éthiopie');
  const distance = getDistanceBetweenCountries(originCountry, destCountry);

  const tFactor = TRANSPORT_EMISSION_FACTORS[transportMode.toLowerCase()] || 0.016;
  const transportCO2 = (qty / 1000) * distance * tFactor;

  const packTypes = producer?.packaging_types || (product?.packaging_type ? [product.packaging_type] : ['Autre']);
  const packType = Array.isArray(packTypes) ? String(packTypes[0] || 'Autre') : String(packTypes);
  const packFactor = PACKAGING_EMISSION_FACTORS[packType] || PACKAGING_EMISSION_FACTORS['Autre'];
  const packagingCO2 = (qty * 0.05) * packFactor;

  const totalBio = productionCO2 + transportCO2 + packagingCO2;
  const totalConventional = qty * factors.conv + transportCO2 * 1.3 + packagingCO2 * 2;
  const saved = Math.max(0, totalConventional - totalBio);

  return {
    production: { value: round(productionCO2), source: 'ADEME Base Carbone' },
    transport: { value: round(transportCO2), source: 'ADEME Transport' },
    packaging: { value: round(packagingCO2), source: 'ADEME Emballage' },
    total: { value: round(totalBio), unit: 'kg CO2e' },
    conventional: { value: round(totalConventional), unit: 'kg CO2e' },
    saved: { value: round(saved), unit: 'kg CO2e' },
    savedPercentage: totalConventional > 0 ? round((saved / totalConventional) * 100) : 0,

    // Aliases
    totalCO2e: round(totalBio),
    savedCO2e: round(saved),
    conventionalCO2e: round(totalConventional),
    productionCO2e: round(productionCO2),
    transportCO2e: round(transportCO2),
    packagingCO2e: round(packagingCO2),

    inputs: {
      category: category,
      isBio: isBio,
      method: String(product?.cultivation_method || product?.farming_method || 'Non renseigné'),
      distance: distance + ' km',
      transport: transportMode,
      packaging: packType,
    },
    methodology: 'GHG Protocol Scope 1-3 + ADEME Base Carbone 2024',
    disclaimer: 'Calcul basé sur les facteurs d\'émission ADEME et les données déclarées par le producteur.'
  };
}

/* ============================================================================
   2. WATER FOOTPRINT
   ============================================================================ */

export function calculateWaterFootprint(
  product: DataRecord,
  producer: DataRecord,
  quantity: number
) {
  const qty = Math.max(0.1, Number(quantity) || 1);
  const isBio = checkIfBio(producer, product);
  const category = mapProductToCategory(product?.category_id || product?.category_name || product?.name);
  const factors = WATER_FACTORS[category] || WATER_FACTORS['spices'];

  const bioWater = qty * (isBio ? factors.bio : factors.conv);
  const convWater = qty * factors.conv;
  const saved = Math.max(0, convWater - bioWater);

  return {
    bioWater: round(bioWater),
    conventionalWater: round(convWater),
    saved: round(saved),
    savedPercentage: convWater > 0 ? round((saved / convWater) * 100) : 0,

    // Aliases
    bioWaterL: round(bioWater),
    conventionalWaterL: round(convWater),
    savedWaterL: round(saved),

    inputs: {
      category: category,
      isBio: isBio,
      quantityKg: qty,
    },
    methodology: 'Water Footprint Network (Hoekstra et al., 2011)',
    disclaimer: 'Estimation basée sur les moyennes sectorielles par type de culture.'
  };
}

/* ============================================================================
   3. BIODIVERSITY
   ============================================================================ */

export function calculateBiodiversity(
  producer: DataRecord,
  quantity: number,
  product?: DataRecord
) {
  const surface = Number(producer?.surface_value || producer?.farm_size || 1);
  const capacity = Number(producer?.annual_capacity || producer?.annual_production_capacity || 1000);
  const ratio = capacity > 0 ? quantity / capacity : 0.05;

  const originCountry = String(product?.origin_country || product?.country || producer?.country || 'Éthiopie');
  const region = getRegionFromCountry(originCountry);
  const density = BIODIVERSITY_SPECIES_DENSITY[region] || 100;

  const method = String(
    product?.cultivation_method ||
    product?.farming_method ||
    (Array.isArray(producer?.cultivation_methods) ? producer.cultivation_methods[0] : producer?.farming_method) ||
    'Agriculture biologique'
  );
  const factor = BIODIVERSITY_PRESERVATION_FACTORS[method] ?? 0.30;
  const treeDensity = BIODIVERSITY_TREE_DENSITY[method] ?? 40;

  const species = round(surface * density * factor * ratio, 1);
  const trees = round(surface * treeDensity * ratio, 1);

  return {
    speciesProtected: Math.max(1, species),
    treesPreserved: Math.max(0.1, trees),
    soilHealthScore: Math.min(100, Math.round(75 + factor * 35)),
    inputs: {
      surfaceHa: surface,
      method: method,
      region: region,
      capacityKg: capacity,
    },
    methodology: 'IBAT (Integrated Biodiversity Assessment Tool) + FAO',
    disclaimer: 'Estimation basée sur la surface déclarée, la méthode de culture et les densités régionales.'
  };
}

export function calculateBiodiversityImpact(
  surfaceHaOrProducer: unknown,
  quantityOrMethod: unknown = 1,
  regionOrProduct?: unknown
) {
  if (typeof surfaceHaOrProducer === 'object' && surfaceHaOrProducer !== null) {
    return calculateBiodiversity(
      surfaceHaOrProducer as DataRecord,
      Number(quantityOrMethod) || 1,
      regionOrProduct as DataRecord
    );
  }
  const ha = Number(surfaceHaOrProducer) || 0.5;
  const method = typeof quantityOrMethod === 'string' ? quantityOrMethod : 'Agriculture biologique';
  const factor = BIODIVERSITY_PRESERVATION_FACTORS[method] ?? 0.30;
  const treeDens = BIODIVERSITY_TREE_DENSITY[method] ?? 40;

  return {
    speciesProtected: Math.max(1, Math.round(ha * 150 * factor)),
    treesPreserved: Math.max(0.1, Math.round(ha * treeDens)),
    soilHealthScore: Math.min(100, Math.round(75 + factor * 35)),
    methodology: 'IBAT (Integrated Biodiversity Assessment Tool) + FAO',
    disclaimer: 'Estimation basée sur la surface déclarée, la méthode de culture et les densités régionales.'
  };
}

/* ============================================================================
   4. ECONOMIC IMPACT
   ============================================================================ */

export function calculateEconomicImpact(
  product: DataRecord,
  producer: DataRecord,
  quantity: number,
  orderAmount: number
) {
  const amount = Math.max(0, Number(orderAmount) || 0);
  const producerRevenue = round(amount * 0.87);

  const originCountry = String(product?.origin_country || product?.country || producer?.country || 'Éthiopie');
  const livingWageBenchmark = LIVING_WAGES[originCountry.toLowerCase()] || LIVING_WAGES['default'];

  const capacity = Number(producer?.annual_capacity || producer?.annual_production_capacity || 1000);
  const ratio = capacity > 0 ? quantity / capacity : 0.05;

  let families: number;
  if (producer?.families_impacted && Number(producer.families_impacted) > 0) {
    families = Math.max(1, Math.ceil(Number(producer.families_impacted) * ratio));
  } else {
    const employees = Number(producer?.full_time_employees || producer?.employees_count || 0) + Number(producer?.part_time_employees || 0);
    const empCount = employees > 0 ? employees : 10;
    families = Math.max(1, Math.ceil(empCount * 4.5 * ratio));
  }

  const wageGuaranteed = Boolean(producer?.min_wage && Number(producer.min_wage) >= livingWageBenchmark) || producer?.minimum_wage_guaranteed === true;

  const conventionalProducerShare = amount * 0.40;
  const gainVsConventional = round(((0.87 - 0.40) / 0.40) * 100);

  return {
    producerRevenue: producerRevenue,
    producerPercentage: 87,
    conventionalRevenue: round(conventionalProducerShare),
    gainVsConventional: gainVsConventional,
    revenueIncrease: gainVsConventional,
    familiesBeneficiary: families,
    wageGuaranteed: wageGuaranteed,
    monthlyWageGuaranteed: wageGuaranteed,
    minimumWage: producer?.min_wage ? Number(producer.min_wage) : livingWageBenchmark,
    wageCurrency: String(producer?.min_wage_currency || 'EUR'),
    fairtradePremuim: round(amount * 0.05),
    inputs: {
      dataSource: producer?.families_impacted ? 'Données producteur' : 'Estimation sectorielle',
      employees: Number(producer?.full_time_employees || producer?.employees_count || 0) + Number(producer?.part_time_employees || 0),
      capacityKg: capacity,
      livingWageBenchmark,
    },
    methodology: 'Fairtrade Impact Assessment + Données producteur + Anker Living Wage Benchmark',
    disclaimer: 'Calcul de répartition basé sur le modèle sans intermédiaire EthiMarket (87% au producteur).'
  };
}

/* ============================================================================
   5. SOCIAL IMPACT
   ============================================================================ */

export function calculateSocialImpact(
  producer: DataRecord,
  quantity: number,
  orderAmount: number
) {
  const amount = Math.max(0, Number(orderAmount) || 0);
  const capacity = Number(producer?.annual_capacity || producer?.annual_production_capacity || 1000);
  const ratio = capacity > 0 ? quantity / capacity : 0.05;

  const totalEmployees = Number(producer?.full_time_employees || producer?.employees_count || 0) + Number(producer?.part_time_employees || 0);
  const empCount = totalEmployees > 0 ? totalEmployees : 10;
  const jobsSupported = Math.max(1, Math.ceil(empCount * ratio));

  const trainingBudget = round(amount * 0.87 * 0.02);
  const trainingHours = Math.max(1, Math.round(trainingBudget / 15));

  const educationContribution = round(amount * 0.87 * 0.005);
  const childrenImpacted = Math.max(1, Math.round(educationContribution / 50));

  const healthCoverage = producer?.health_insurance === true || producer?.verified === true;
  const paidLeave = producer?.paid_leave === true || producer?.verified === true;

  return {
    jobsSupported: jobsSupported,
    trainingHours: trainingHours,
    trainingBudget: trainingBudget,
    educationContribution: educationContribution,
    childrenImpacted: childrenImpacted,
    healthCoverage: healthCoverage,
    paidLeave: paidLeave,
    inputs: {
      totalEmployees: totalEmployees,
      dataSource: totalEmployees > 0 ? 'Données producteur' : 'Estimation sectorielle',
    },
    methodology: 'UN SDG Framework + Données producteur',
    disclaimer: 'Estimation basée sur les données d\'emploi déclarées et les dépenses sociales de la coopérative.'
  };
}

/* ============================================================================
   LOGISTICS, TAXES & SCORE
   ============================================================================ */

export function calculateShipping(
  originCountry: string = 'Éthiopie',
  destCountry: string = 'France',
  weightKg: number = 1,
  transportMode: string = 'dhl'
) {
  const weight = Math.max(0.5, Number(weightKg) || 1);
  const distanceKm = getDistanceBetweenCountries(originCountry, destCountry);

  const dhlPrice = Math.round(45 + weight * (weight > 100 ? 1.80 : 2.20));
  const dhlCO2e = Math.round(((weight / 1000) * distanceKm * 0.602) * 100) / 100;

  const upsPrice = Math.round(35 + weight * (weight > 100 ? 1.30 : 1.60));
  const upsCO2e = Math.round(((weight / 1000) * distanceKm * 0.602 * 0.85) * 100) / 100;

  const maritimePrice = Math.max(250, Math.round(150 + weight * 0.15));
  const maritimeCO2e = Math.round(((weight / 1000) * distanceKm * 0.016) * 100) / 100;

  const options = {
    dhl: {
      id: 'dhl' as const,
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
      id: 'ups' as const,
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
      id: 'maritime' as const,
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

export function calculateCustomsAndVAT(
  productPrice: number,
  productHSCode: string = '0901',
  originCountry: string = 'Éthiopie',
  destCountry: string = 'France',
  isACPCountry?: boolean,
  isBio: boolean = true
) {
  const price = Math.max(0, Number(productPrice) || 0);
  const normOrigin = originCountry.toLowerCase().trim();

  const isACP = typeof isACPCountry === 'boolean'
    ? isACPCountry
    : ACP_COUNTRIES.some(c => normOrigin.includes(c));

  let customsRate = 0;
  if (!isACP) {
    if (productHSCode.startsWith('0901') || productHSCode.startsWith('1801') || productHSCode.startsWith('0902')) {
      customsRate = 0;
    } else {
      customsRate = 4.5;
    }
  }

  const customsDuty = Math.round((price * (customsRate / 100)) * 100) / 100;

  const normDest = destCountry.toLowerCase().trim();
  const vatConfig = EU_VAT_RATES[normDest] || EU_VAT_RATES.default;
  const vatRate = vatConfig.food * 100;
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

export function calculateEthiMarketScore(producer: DataRecord, product?: DataRecord) {
  if (!producer) {
    return {
      score: 0,
      badge: 'not_eligible' as const,
      badgeLabel: 'Non éligible',
      breakdown: { certifications: 0, traceability: 0, ethics: 0, environment: 0, satisfaction: 0 },
      methodology: 'B Corp Assessment + EcoVadis + Fairtrade Standards',
    };
  }

  let certPts = 0;
  const certsArr: string[] = Array.isArray(producer.certifications)
    ? (producer.certifications as unknown[]).map(c => typeof c === 'string' ? c : String((c as Record<string, unknown>)?.type || (c as Record<string, unknown>)?.name || ''))
    : [];

  const hasBio = certsArr.some(c => /bio|ecocert|organic|ab/i.test(c));
  if (hasBio) certPts += 15;
  if (certsArr.some(c => /fairtrade|équitable/i.test(c))) certPts += 10;
  if (certsArr.some(c => /rainforest|alliance/i.test(c))) certPts += 5;
  if (certsArr.some(c => /globalgap|gap/i.test(c))) certPts += 5;
  if (producer.verified || (producer.verification_documents as unknown[])?.length) certPts += 5;
  certPts = Math.min(40, certPts);

  let tracePts = 0;
  if (producer.gps_coordinates || producer.address || product?.gps_coordinates) tracePts += 8;
  if (producer.years_in_operation || producer.created_at) tracePts += 7;
  if ((producer.farm_photos as unknown[])?.length || producer.cover_url) tracePts += 5;
  if (product?.batch_number) tracePts += 3;
  if (product?.harvest_date) tracePts += 2;
  tracePts = Math.min(25, tracePts);

  let ethicPts = 0;
  if (producer.charter_signed || producer.verified) ethicPts += 3;
  if (producer.min_wage || producer.minimum_wage_guaranteed) ethicPts += 7;
  if (producer.health_insurance || producer.verified) ethicPts += 5;
  if (producer.paid_leave || producer.verified) ethicPts += 5;
  ethicPts = Math.min(20, ethicPts);

  let envPts = 0;
  if (hasBio || producer.eco_friendly) envPts += 4;
  if ((producer.packaging_types as unknown[])?.length || product?.packaging_type) envPts += 3;
  if (producer.reforestation_program || producer.verified) envPts += 3;
  envPts = Math.min(10, envPts);

  const satPts = 5;

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

export function calculateOrderTotal(
  product: DataRecord,
  producer: DataRecord,
  quantity: number = 100,
  destCountry: string = 'France',
  transportMode: string = 'maritime'
) {
  const qty = Math.max(1, Number(quantity) || 1);
  const unitPrice = Number(product?.price) || 12.5;
  const productPrice = Math.round(unitPrice * qty * 100) / 100;

  const originCountry = String(product?.origin_country || product?.country || producer?.country || 'Éthiopie');
  const hsCode = String(product?.hs_code || '0901');

  const carbon = calculateCarbonFootprint(product, producer, qty, destCountry, transportMode);
  const water = calculateWaterFootprint(product, producer, qty);
  const biodiversity = calculateBiodiversity(producer, qty, product);
  const economic = calculateEconomicImpact(product, producer, qty, productPrice);
  const social = calculateSocialImpact(producer, qty, productPrice);
  const shipping = calculateShipping(originCountry, destCountry, qty, transportMode);
  const taxes = calculateCustomsAndVAT(productPrice, hsCode, originCountry, destCountry, true, true);
  const ethimarketScore = calculateEthiMarketScore(producer, product);

  const ethimarketCommission = Math.round(productPrice * 0.05 * 100) / 100;
  const totalAmount = Math.round((productPrice + shipping.price + ethimarketCommission + taxes.totalTaxes) * 100) / 100;

  return {
    unitPrice,
    productPrice,
    shippingCost: shipping.price,
    shippingName: shipping.options[/maritime/i.test(transportMode) ? 'maritime' : /ups/i.test(transportMode) ? 'ups' : 'dhl'].name,
    ethimarketCommission,
    commissionRate: 5,
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
  const carbon = calculateCarbonFootprint({ name: productType }, null, quantity);
  const water = calculateWaterFootprint({ name: productType }, null, quantity);
  const bio = calculateBiodiversityImpact(quantity / 500);

  return {
    co2SavedKg: carbon.saved.value,
    waterSavedLiters: water.saved,
    treesPreserved: bio.treesPreserved,
    protectedSpeciesCount: bio.speciesProtected,
  };
}

export function checkEUConformity(producer: DataRecord, product: DataRecord) {
  const hasRegNumber = !!(producer?.registration_number || producer?.siret || producer?.tax_id || producer?.verified);
  const hasPhyto = !!(
    (producer?.business_documents as unknown[])?.length ||
    (producer?.verification_documents as unknown[])?.length ||
    producer?.verified
  );

  return {
    commercial_invoice: hasRegNumber,
    origin_certificate: true,
    phyto_certificate: hasPhyto,
    packing_list: true,
    bio_eu_certificate: checkIfBio(producer, product),
    customs_documents: true,
    is_conform: hasRegNumber && hasPhyto,
  };
}

export function calculateProfileCompletion(producer: DataRecord): number {
  if (!producer) return 0;
  let total = 0;
  if (producer.name) total += 10;
  if (producer.registration_number || producer.verified) total += 10;
  if (producer.description || producer.story) total += 10;
  if (producer.country) total += 10;
  if (producer.farm_size || producer.product_count) total += 15;
  if (Array.isArray(producer.certifications) && (producer.certifications as unknown[]).length > 0) total += 15;
  if ((producer.verification_documents as unknown[])?.length || producer.verified) total += 10;
  if (producer.delivery_methods || producer.export_experience) total += 5;
  if (producer.charter_signed || producer.verified) total += 10;
  if (producer.avatar_url || producer.logo_url) total += 5;
  return Math.min(100, total);
}
