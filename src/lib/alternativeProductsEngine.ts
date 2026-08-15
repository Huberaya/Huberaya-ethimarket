// src/lib/alternativeProductsEngine.ts
// Semantic Comparison & Intelligent Alternative Product Recommendation Engine

import { Product } from './supabase';
import { normalizeText, ParsedSearchQuery } from './naturalLanguageSearchService';

export interface ProductComparisonMetric {
  key: string;
  label: string;
  unit?: string;
  winnerProductId?: string;
  betterDirection: 'higher' | 'lower' | 'boolean';
  values: Record<string, string | number | boolean>;
}

export interface AlternativeRecommendation {
  alternativeProduct: Product;
  referenceProduct?: Product;
  priceDifferencePercentage: number;
  carbonReductionKg: number;
  carbonReductionPercentage: number;
  scoreDifference: number;
  advantages: string[];
  tradeoffs: string[];
  recommendationReason: string;
  matchScore: number;
}

export interface ComparisonReport {
  title: string;
  products: Product[];
  metrics: ProductComparisonMetric[];
  bestValueProductId?: string;
  lowestCarbonProductId?: string;
  highestTrustProductId?: string;
  summaryVerdict: string;
}

/**
 * Finds intelligent alternatives for a specific reference product based on user criteria
 */
export function findAlternativeProducts(
  referenceProduct: Product,
  allCatalogProducts: Product[],
  parsedQuery?: ParsedSearchQuery
): AlternativeRecommendation[] {
  const normCategory = referenceProduct.category_id;
  const normName = normalizeText(referenceProduct.name);
  const refType = referenceProduct.product_type ? normalizeText(referenceProduct.product_type) : '';

  // Filter candidates in the same category/product type excluding the reference product
  const candidates = allCatalogProducts.filter(p => {
    if (p.id === referenceProduct.id) return false;
    if (p.category_id && normCategory && p.category_id === normCategory) return true;
    if (refType && p.product_type && normalizeText(p.product_type) === refType) return true;
    if (normName.includes('miel') && normalizeText(p.name).includes('miel')) return true;
    if (normName.includes('café') && normalizeText(p.name).includes('café')) return true;
    if (normName.includes('chocolat') && normalizeText(p.name).includes('chocolat')) return true;
    if (normName.includes('t-shirt') && normalizeText(p.name).includes('t-shirt')) return true;
    return false;
  });

  const recommendations: AlternativeRecommendation[] = candidates.map(candidate => {
    const advantages: string[] = [];
    const tradeoffs: string[] = [];

    // 1. Price comparison
    const priceDiff = candidate.price - referenceProduct.price;
    const priceDiffPct = referenceProduct.price > 0 ? (priceDiff / referenceProduct.price) * 100 : 0;

    if (priceDiff < 0) {
      advantages.push(`${Math.abs(Math.round(priceDiffPct))}% moins cher (${Math.abs(priceDiff).toFixed(2)} € d'économie)`);
    } else if (priceDiff > 0) {
      tradeoffs.push(`+${Math.round(priceDiffPct)}% plus cher`);
    }

    // 2. Carbon comparison
    const refCo2 = referenceProduct.carbon_footprint_kg || (parseFloat(referenceProduct.co2_estimate || '0') || 2.5);
    const candCo2 = candidate.carbon_footprint_kg || (parseFloat(candidate.co2_estimate || '0') || 1.8);
    const co2Reduction = refCo2 - candCo2;
    const co2ReductionPct = refCo2 > 0 ? (co2Reduction / refCo2) * 100 : 0;

    if (co2Reduction > 0.2) {
      advantages.push(`-${Math.round(co2ReductionPct)}% d'émissions CO2 (-${co2Reduction.toFixed(1)} kg)`);
    }

    // 3. Traceability comparison
    const refTrace = !!(referenceProduct.trace_qr_code || referenceProduct.gps_coordinates);
    const candTrace = !!(candidate.trace_qr_code || candidate.gps_coordinates);
    if (candTrace && !refTrace) {
      advantages.push('Traçabilité complète par QR code & GPS certifié');
    }

    // 4. Trust Score comparison
    const scoreDiff = (candidate.confidence_score || candidate.product_score || 80) - 
                      (referenceProduct.confidence_score || referenceProduct.product_score || 80);
    if (scoreDiff > 5) {
      advantages.push(`Score éthique supérieur (+${scoreDiff} pts)`);
    }

    // 5. Local / Origin bonus
    if (candidate.country === 'France' && referenceProduct.country !== 'France') {
      advantages.push('Alternative locale fabriquée en France');
    }

    // Calculate overall alternative matching score
    let matchScore = 70;
    if (priceDiff < 0) matchScore += 15;
    if (co2Reduction > 0) matchScore += 10;
    if (candTrace) matchScore += 10;
    if (scoreDiff > 0) matchScore += 10;

    // Apply parsed query priorities if specified
    if (parsedQuery?.cheaperPriority && priceDiff < 0) matchScore += 20;
    if (parsedQuery?.lowerCarbonPriority && co2Reduction > 0) matchScore += 20;
    if (parsedQuery?.fullTraceability && candTrace) matchScore += 20;
    if (parsedQuery?.manufacturingCountry && candidate.country === parsedQuery.manufacturingCountry) matchScore += 15;

    // Reason synthesis
    let recommendationReason = 'Alternative équivalente';
    if (priceDiff < 0 && candTrace) {
      recommendationReason = 'Excellente alternative : plus économique avec une meilleure traçabilité';
    } else if (priceDiff < 0) {
      recommendationReason = 'Alternative économique directe';
    } else if (co2Reduction > 0) {
      recommendationReason = 'Alternative écologique à plus faible empreinte carbone';
    }

    return {
      alternativeProduct: candidate,
      referenceProduct,
      priceDifferencePercentage: Math.round(priceDiffPct),
      carbonReductionKg: Number(co2Reduction.toFixed(2)),
      carbonReductionPercentage: Math.round(co2ReductionPct),
      scoreDifference: scoreDiff,
      advantages,
      tradeoffs,
      recommendationReason,
      matchScore
    };
  });

  // Sort by match score descending
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations;
}

/**
 * Generates an exhaustive side-by-side comparison report for 2 to 5 products
 */
export function generateComparisonReport(products: Product[]): ComparisonReport {
  if (!products || products.length === 0) {
    return {
      title: 'Comparatif de produits',
      products: [],
      metrics: [],
      summaryVerdict: 'Aucun produit sélectionné pour la comparaison.'
    };
  }

  const metrics: ProductComparisonMetric[] = [];

  // Price metric
  const priceValues: Record<string, number> = {};
  let minPrice = Infinity;
  let minPriceId = '';
  products.forEach(p => {
    priceValues[p.id] = p.price;
    if (p.price < minPrice) {
      minPrice = p.price;
      minPriceId = p.id;
    }
  });
  metrics.push({
    key: 'price',
    label: 'Prix unitaire',
    unit: '€',
    betterDirection: 'lower',
    winnerProductId: minPriceId,
    values: priceValues
  });

  // Trust / EthiMarket Score metric
  const scoreValues: Record<string, number> = {};
  let maxScore = -1;
  let maxScoreId = '';
  products.forEach(p => {
    const s = p.product_score || p.confidence_score || 80;
    scoreValues[p.id] = s;
    if (s > maxScore) {
      maxScore = s;
      maxScoreId = p.id;
    }
  });
  metrics.push({
    key: 'score',
    label: 'Score de confiance éthique',
    unit: '/100',
    betterDirection: 'higher',
    winnerProductId: maxScoreId,
    values: scoreValues
  });

  // Carbon footprint metric
  const carbonValues: Record<string, number> = {};
  let minCo2 = Infinity;
  let minCo2Id = '';
  products.forEach(p => {
    const co2 = p.carbon_footprint_kg ?? (parseFloat(p.co2_estimate || '0') || 2.0);
    carbonValues[p.id] = co2;
    if (co2 < minCo2) {
      minCo2 = co2;
      minCo2Id = p.id;
    }
  });
  metrics.push({
    key: 'co2',
    label: 'Empreinte carbone',
    unit: 'kg CO2',
    betterDirection: 'lower',
    winnerProductId: minCo2Id,
    values: carbonValues
  });

  // Certifications metric
  const certValues: Record<string, string> = {};
  products.forEach(p => {
    certValues[p.id] = (p.certifications && p.certifications.length > 0) ? p.certifications.join(', ') : 'Aucune';
  });
  metrics.push({
    key: 'certifications',
    label: 'Labels & Certifications',
    betterDirection: 'higher',
    values: certValues
  });

  // Traceability & Origin
  const originValues: Record<string, string> = {};
  products.forEach(p => {
    originValues[p.id] = `${p.country_flag || '🌍'} ${p.country || 'Non renseigné'}`;
  });
  metrics.push({
    key: 'origin',
    label: 'Pays d\'origine',
    betterDirection: 'boolean',
    values: originValues
  });

  // MOQ
  const moqValues: Record<string, number> = {};
  products.forEach(p => {
    moqValues[p.id] = p.moq_value || 1;
  });
  metrics.push({
    key: 'moq',
    label: 'Quantité minimale (MOQ)',
    betterDirection: 'lower',
    values: moqValues
  });

  // Summary Verdict
  const bestValueProd = products.find(p => p.id === minPriceId);
  const bestEcoProd = products.find(p => p.id === minCo2Id);
  const bestTrustProd = products.find(p => p.id === maxScoreId);

  const summaryVerdict = `Le produit "${bestValueProd?.name}" propose le meilleur tarif (${bestValueProd?.price} €), tandis que "${bestEcoProd?.name}" offre le meilleur bilan environnemental (${carbonValues[bestEcoProd?.id || '']} kg CO2). Pour la fiabilité maximale, privilégiez "${bestTrustProd?.name}" (Score ${scoreValues[bestTrustProd?.id || '']}/100).`;

  return {
    title: `Comparatif de ${products.length} produits`,
    products,
    metrics,
    bestValueProductId: minPriceId,
    lowestCarbonProductId: minCo2Id,
    highestTrustProductId: maxScoreId,
    summaryVerdict
  };
}
