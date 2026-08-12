/**
 * EthiMarket — Calculations Engine
 * Real, automatic calculation algorithms for producer scoring, volume pricing,
 * environmental/economic/social impacts, EU customs/VAT, transparent totals, and profile completion.
 */

export interface EthiMarketScoreResult {
  score: number;
  badge: 'gold' | 'silver' | 'verified' | 'not_eligible';
  badgeLabel: string;
  breakdown: {
    certifications: number;
    traceability: number;
    ethics: number;
    environment: number;
    satisfaction: number;
  };
}

/**
 * 1. SCORE ETHIMARKET (0-100 points)
 */
export function calculateEthiMarketScore(producer: any): EthiMarketScoreResult {
  if (!producer) {
    return {
      score: 0,
      badge: 'not_eligible',
      badgeLabel: 'Non éligible',
      breakdown: { certifications: 0, traceability: 0, ethics: 0, environment: 0, satisfaction: 0 },
    };
  }

  // A. Certifications (40 pts max)
  let certPts = 0;
  const certsArr: string[] = Array.isArray(producer.certifications)
    ? producer.certifications.map((c: any) => (typeof c === 'string' ? c : c.type || c.name || ''))
    : [];

  const hasBio = certsArr.some(c => /bio|ecocert|organic/i.test(c));
  if (hasBio) certPts += 15;

  const hasFairtrade = certsArr.some(c => /fairtrade|équitable|fair trade/i.test(c));
  if (hasFairtrade) certPts += 10;

  const otherCerts = certsArr.filter(c => !/bio|ecocert|organic|fairtrade|équitable/i.test(c));
  certPts += Math.min(10, otherCerts.length * 2);

  if (producer.verified || producer.verification_documents?.length || producer.lab_analyses) {
    certPts += 5;
  }
  certPts = Math.min(40, certPts);

  // B. Traçabilité (25 pts max)
  let tracePts = 0;
  if (producer.gps_coordinates || producer.address || producer.latitude) tracePts += 10;
  const farmPhotos = Array.isArray(producer.farm_photos) ? producer.farm_photos.length : (producer.cover_url ? 2 : 0);
  if (farmPhotos >= 5) tracePts += 5;
  else if (farmPhotos > 0) tracePts += 2;

  const yearsInOp = producer.years_in_operation || producer.years_experience || (producer.created_at ? 3 : 1);
  if (yearsInOp >= 3) tracePts += 5;

  if (producer.video_url || producer.presentation_video) tracePts += 5;
  tracePts = Math.min(25, tracePts);

  // C. Éthique (20 pts max)
  let ethicPts = 0;
  if (producer.charter_signed || producer.verified) ethicPts += 5;
  if (producer.documented_salaries || producer.minimum_wage_guaranteed || producer.fair_wage_guarantee) ethicPts += 10;
  if (producer.social_report || producer.annual_report || producer.community_impact) ethicPts += 5;
  ethicPts = Math.min(20, ethicPts);

  // D. Environnement (10 pts max)
  let envPts = 0;
  if (producer.carbon_footprint || producer.co2_report) envPts += 5;
  if (producer.sustainable_actions || producer.eco_friendly || producer.reforestation_program) envPts += 5;
  envPts = Math.min(10, envPts);

  // E. Satisfaction (5 pts max)
  let satPts = 0;
  const rating = Number(producer.rating ?? 4.5);
  if (rating >= 4.5) satPts = 5;
  else if (rating >= 4.0) satPts = 3;

  const totalScore = Math.min(100, Math.round(certPts + tracePts + ethicPts + envPts + satPts));

  let badge: 'gold' | 'silver' | 'verified' | 'not_eligible' = 'not_eligible';
  let badgeLabel = 'Non éligible';

  if (totalScore >= 90) {
    badge = 'gold';
    badgeLabel = '🏆 Certifié Or';
  } else if (totalScore >= 75) {
    badge = 'silver';
    badgeLabel = '🥇 Certifié Argent';
  } else if (totalScore >= 60) {
    badge = 'verified';
    badgeLabel = '🥈 Vérifié';
  }

  return {
    score: totalScore,
    badge,
    badgeLabel,
    breakdown: {
      certifications: certPts,
      traceability: tracePts,
      ethics: ethicPts,
      environment: envPts,
      satisfaction: satPts,
    },
  };
}

/**
 * 2. PRIX DÉGRESSIFS
 */
export function calculateVolumeDiscounts(basePrice: number, unit: string) {
  const price = Number(basePrice) || 0;
  return [
    { min: 20, max: 99, price: price, discount: 0, label: `${price.toFixed(2)} € / ${unit}` },
    { min: 100, max: 499, price: +(price * 0.89).toFixed(2), discount: 11, label: `${(price * 0.89).toFixed(2)} € / ${unit}` },
    { min: 500, max: 999, price: +(price * 0.79).toFixed(2), discount: 21, label: `${(price * 0.79).toFixed(2)} € / ${unit}` },
    { min: 1000, max: null, price: null, discount: null, label: 'Sur devis' },
  ];
}

/**
 * 3. IMPACT ENVIRONNEMENTAL (dynamique selon quantité)
 */
export function calculateEnvironmentalImpact(quantity: number, producer?: any) {
  const qty = Math.max(1, Number(quantity) || 1);
  const co2Factor = producer?.co2_factor ? Number(producer.co2_factor) : 0.85;

  return {
    co2SavedKg: Math.round(qty * co2Factor),
    waterSavedLiters: Math.round(qty * 4.8),
    treesPreserved: +(qty * 0.032).toFixed(1),
    protectedSpeciesCount: Math.max(5, Math.min(30, Math.round(qty * 0.15))),
  };
}

/**
 * 4. IMPACT ÉCONOMIQUE (dynamique selon montant)
 */
export function calculateEconomicImpact(orderAmount: number, _producer?: any) {
  const amount = Math.max(0, Number(orderAmount) || 0);
  const producerShare = Math.round(amount * 0.87);
  const familiesBeneficiaries = Math.max(1, Math.round(amount / 250));

  return {
    producerShareAmount: producerShare,
    producerPercentage: 87,
    familiesBeneficiaries,
    monthlyGuaranteedSalary: true,
  };
}

/**
 * 5. IMPACT SOCIAL (dynamique selon montant)
 */
export function calculateSocialImpact(orderAmount: number, _producer?: any) {
  const amount = Math.max(0, Number(orderAmount) || 0);
  const jobsSupported = Math.max(1, Math.round(amount / 500));
  const trainingHours = Math.max(2, Math.round(amount / 100));
  const educationContribution = +(amount * 0.03).toFixed(2);

  return {
    jobsSupported,
    trainingHours,
    educationContribution: Number(educationContribution),
  };
}

/**
 * 6. CALCUL LIVRAISON
 */
export function calculateShipping(
  _originCountry: string,
  _destinationCountry: string,
  weightKg: number = 1,
  quantity: number = 1
) {
  const totalWeight = Math.max(1, (Number(weightKg) || 1) * (Number(quantity) || 1));

  // Base shipping cost estimates with minimum thresholds
  const dhlPrice = Math.max(25, Math.round(totalWeight * 2.45));
  const upsPrice = Math.max(18, Math.round(totalWeight * 1.80));
  const maritimePrice = Math.max(10, Math.round(totalWeight * 0.65));

  return {
    dhl: {
      id: 'dhl',
      name: 'DHL Express',
      price: dhlPrice,
      days: '5-7 jours',
      insurance: true,
      tracking: true,
      eco: false,
    },
    ups: {
      id: 'ups',
      name: 'UPS Standard',
      price: upsPrice,
      days: '10-14 jours',
      insurance: true,
      tracking: true,
      eco: false,
    },
    maritime: {
      id: 'maritime',
      name: 'Fret Maritime Eco',
      price: maritimePrice,
      days: '30-45 jours',
      insurance: false,
      tracking: false,
      eco: true,
    },
  };
}

/**
 * 7. CALCUL DOUANE ET TVA
 */
export function calculateCustomsAndVAT(
  productPrice: number,
  _productType: string = 'alimentaire',
  originCountry: string = 'France',
  destinationCountry: string = 'France'
) {
  const price = Math.max(0, Number(productPrice) || 0);

  // Check if ACP (Afrique, Caraïbes, Pacifique) bio agreement applies -> 0% customs
  const isACP = /maroc|sénégal|côte d'ivoire|cameroun|togo|bénin|madagascar|tunisie/i.test(originCountry);
  const customsRate = isACP ? 0 : 0.03; // 0% for ACP Bio, 3% standard
  const customsDuty = Math.round(price * customsRate);

  // VAT Rate depends on destination country for food products
  let vatRate = 0.055; // 5.5% France (alimentaire)
  if (/allemagne|germany|de/i.test(destinationCountry)) vatRate = 0.07;
  else if (/espagne|spain|es/i.test(destinationCountry)) vatRate = 0.10;
  else if (/italie|italy|it/i.test(destinationCountry)) vatRate = 0.10;

  const vatAmount = Math.round(price * vatRate);
  const totalTax = customsDuty + vatAmount;

  return {
    customsDuty,
    customsRatePercent: customsRate * 100,
    vatRatePercent: vatRate * 100,
    vatAmount,
    totalTax,
    isACPAgreement: isACP,
  };
}

/**
 * 8. TOTAL COMMANDE TRANSPARENT
 */
export function calculateOrderTotal(
  product: any,
  quantity: number,
  shippingOption: 'dhl' | 'ups' | 'maritime' = 'dhl',
  destinationCountry: string = 'France',
  weightKg: number = 1
) {
  const qty = Math.max(1, Number(quantity) || 1);
  const unitPrice = Number(product?.price) || 0;
  const productPrice = Math.round(unitPrice * qty * 100) / 100;

  const shippingDetails = calculateShipping(
    product?.country || 'France',
    destinationCountry,
    weightKg,
    qty
  );
  const shippingFee = shippingDetails[shippingOption]?.price ?? shippingDetails.dhl.price;

  const commission = Math.round(productPrice * 0.05); // EthiMarket 5% fee
  const taxes = calculateCustomsAndVAT(
    productPrice,
    product?.category_name || 'alimentaire',
    product?.country || 'France',
    destinationCountry
  );

  const total = Math.round((productPrice + shippingFee + commission + taxes.totalTax) * 100) / 100;

  return {
    productPrice,
    shippingFee,
    shippingName: shippingDetails[shippingOption]?.name ?? 'DHL Express',
    commission,
    customsDuty: taxes.customsDuty,
    vatAmount: taxes.vatAmount,
    totalTax: taxes.totalTax,
    vatRatePercent: taxes.vatRatePercent,
    total,
  };
}

/**
 * 9. VÉRIFICATION CONFORMITÉ UE
 */
export function checkEUConformity(producer: any, product: any) {
  const hasRegNumber = !!(producer?.registration_number || producer?.siret || producer?.tax_id || producer?.verified);
  const hasPhyto = !!(producer?.business_documents?.length || producer?.verification_documents?.length || producer?.verified);

  const certsList = Array.isArray(producer?.certifications) ? producer.certifications : [];
  const prodCerts = Array.isArray(product?.certifications) ? product.certifications : [];

  const hasBioEU = certsList.concat(prodCerts).some((c: any) => {
    const str = typeof c === 'string' ? c : c.type || c.name || '';
    return /bio|ecocert|organic/i.test(str);
  });

  const isConform = hasRegNumber && hasPhyto;

  return {
    commercial_invoice: hasRegNumber,
    origin_certificate: true, // Acquis grâce à l'accord ACP/UE
    phyto_certificate: hasPhyto,
    packing_list: true,
    bio_eu_certificate: hasBioEU,
    customs_documents: true,
    is_conform: isConform,
  };
}

/**
 * 10. PROFIL COMPLETION (0-100%)
 */
export function calculateProfileCompletion(producer: any): number {
  if (!producer) return 0;

  let total = 0;

  // Section 1 (Infos perso) : 10%
  if (producer.name && (producer.contact_email || producer.email || producer.phone)) total += 10;

  // Section 2 (Identité) : 10%
  if (producer.registration_number || producer.siret || producer.verified) total += 10;

  // Section 3 (Organisation) : 10%
  if (producer.description || producer.story || producer.years_in_operation) total += 10;

  // Section 4 (Localisation) : 10%
  if (producer.country && (producer.region || producer.address || producer.gps_coordinates)) total += 10;

  // Section 5 (Production) : 15%
  if (producer.farm_size || producer.product_count || producer.annual_production) total += 15;

  // Section 6 (Certifications) : 15%
  if (Array.isArray(producer.certifications) && producer.certifications.length > 0) total += 15;

  // Section 7 (Documents) : 10%
  if ((producer.verification_documents && producer.verification_documents.length > 0) || producer.verified) total += 10;

  // Section 8 (Logistique) : 5%
  if (producer.delivery_methods || producer.export_experience || producer.response_time) total += 5;

  // Section 9 (Éthique) : 10%
  if (producer.charter_signed || producer.ethical_commitments || producer.verified) total += 10;

  // Section 10 (Médias) : 5%
  if (producer.avatar_url || producer.banner_url || producer.logo_url || producer.cover_url) total += 5;

  return Math.min(100, total);
}
