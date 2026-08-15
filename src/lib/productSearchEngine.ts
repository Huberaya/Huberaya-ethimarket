// src/lib/productSearchEngine.ts
// Hybrid Search & Multi-criteria Ranking Engine (PostgreSQL RPC + Client-side Fallback & Fuzzy Search)

import { supabase, Product } from './supabase';
import { parseNaturalLanguageQuery, ParsedSearchQuery, normalizeText } from './naturalLanguageSearchService';

export interface StructuredFilters {
  categories?: string[];
  productTypes?: string[];
  materials?: string[];
  certifications?: string[];
  countries?: string[];
  regions?: string[];
  gender?: 'homme' | 'femme' | 'unisexe' | 'enfant' | 'bebe' | 'all';
  minPrice?: number;
  maxPrice?: number;
  maxCo2?: number;
  maxWater?: number;
  isVegan?: boolean;
  isRecycled?: boolean;
  minRecycledPercent?: number;
  livingWage?: boolean;
  isCooperative?: boolean;
  socialProtection?: boolean;
  plasticFree?: boolean;
  fullTraceability?: boolean;
  minConfidenceScore?: number;
  minRating?: number;
  minReviewsCount?: number;
  inStockOnly?: boolean;
  maxDeliveryDays?: number;
  producerId?: string;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'confidence' | 'carbon' | 'rating' | 'newest' | 'distance';
  limit?: number;
  offset?: number;
}

export interface SearchResultItem extends Product {
  searchScore: number;
  matchReasons: string[];
  highlights?: {
    name?: string;
    description?: string;
  };
}

export interface SearchExecutionResponse {
  results: SearchResultItem[];
  totalCount: number;
  parsedQuery: ParsedSearchQuery;
  executionTimeMs: number;
  didYouMean?: string;
  suggestedFilters?: {
    certifications: { label: string; count: number }[];
    countries: { label: string; count: number }[];
    materials: { label: string; count: number }[];
  };
}

/**
 * Calculates string similarity using trigram-like Sørensen-Dice coefficient
 */
function calculateDiceSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return s1.includes(s2) || s2.includes(s1) ? 0.6 : 0.0;

  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);
  let intersection = 0;

  bg1.forEach(bg => {
    if (bg2.has(bg)) intersection++;
  });

  return (2.0 * intersection) / (bg1.size + bg2.size);
}

/**
 * Score and rank products client-side for ultra-fast response & offline fallback
 */
export function scoreProductClientSide(
  product: Product,
  parsed: ParsedSearchQuery,
  filters?: StructuredFilters
): { score: number; matchReasons: string[] } {
  let score = 50; // Base score
  const matchReasons: string[] = [];

  const normName = normalizeText(product.name || '');
  const normDesc = normalizeText(product.description || '');
  const normProducer = normalizeText(product.producers?.company_name || '');
  const normCountry = normalizeText(product.country || '');
  const normType = normalizeText(product.product_type || '');

  // 1. Text & Semantic Matching
  if (parsed.rawQuery && parsed.rawQuery.trim() !== '') {
    const nameSim = calculateDiceSimilarity(normName, parsed.rawQuery);
    if (nameSim > 0.3) {
      score += nameSim * 50;
      matchReasons.push('Correspondance titre');
    }

    if (parsed.productTypeCanonical && (normName.includes(normalizeText(parsed.productTypeCanonical)) || normType.includes(normalizeText(parsed.productTypeCanonical)))) {
      score += 35;
      matchReasons.push(`Type: ${parsed.productTypeCanonical}`);
    }

    parsed.residualKeywords.forEach(kw => {
      const nkw = normalizeText(kw);
      if (normName.includes(nkw)) {
        score += 15;
        matchReasons.push(`Mot-clé: "${kw}"`);
      } else if (normDesc.includes(nkw)) {
        score += 8;
      }
    });
  }

  // 2. Material Match
  if (parsed.materials.length > 0) {
    parsed.materials.forEach(mat => {
      const nMat = normalizeText(mat);
      if (normName.includes(nMat) || normDesc.includes(nMat) || (product.attributes?.materials && product.attributes.materials.some(m => normalizeText(m).includes(nMat)))) {
        score += 25;
        matchReasons.push(`Matière: ${mat}`);
      }
    });
  }

  // 3. Certification Match
  const productCerts = (product.certifications || []).map(c => normalizeText(c));
  const requestedCerts = [
    ...parsed.certifications,
    ...(filters?.certifications || [])
  ];

  requestedCerts.forEach(cert => {
    const nCert = normalizeText(cert);
    if (productCerts.some(pc => pc.includes(nCert) || nCert.includes(pc))) {
      score += 30;
      matchReasons.push(`Certifié ${cert}`);
    }
  });

  // 4. Country & Origin Match
  const requestedCountries = [
    ...parsed.countries,
    ...(filters?.countries || [])
  ];

  if (requestedCountries.length > 0) {
    const matchedCountry = requestedCountries.some(c => normCountry.includes(normalizeText(c)));
    if (matchedCountry) {
      score += 30;
      matchReasons.push(`Origine ${product.country}`);
    }
  }

  // 5. Gender Match
  if (parsed.gender || (filters?.gender && filters.gender !== 'all')) {
    const targetG = parsed.gender || (filters?.gender as any);
    const prodG = product.target_gender || product.attributes?.gender || 'unisexe';
    if (prodG === targetG || prodG === 'unisexe') {
      score += 15;
    } else {
      score -= 30; // Mismatch penalty
    }
  }

  // 6. Price & Budget Optimization
  const targetMaxPrice = filters?.maxPrice ?? parsed.maxPrice;
  const targetMinPrice = filters?.minPrice ?? parsed.minPrice;
  if (targetMaxPrice !== undefined) {
    if (product.price <= targetMaxPrice) {
      score += 20;
      matchReasons.push(`Prix sous ${targetMaxPrice}€`);
    } else {
      score -= 40;
    }
  }
  if (targetMinPrice !== undefined && product.price < targetMinPrice) {
    score -= 40;
  }

  // 7. Ethical, Ecological & Trust Bonuses
  if (product.product_score) {
    score += (product.product_score / 100) * 20;
  }
  if (product.confidence_score) {
    score += (product.confidence_score / 100) * 15;
  }
  if (product.carbon_footprint_kg !== undefined && product.carbon_footprint_kg <= 2) {
    score += 15;
    matchReasons.push('Faible empreinte carbone');
  }
  if (product.living_wage_guaranteed || parsed.livingWage || filters?.livingWage) {
    if (product.living_wage_guaranteed) {
      score += 15;
      matchReasons.push('Salaire décent garanti');
    }
  }
  if (product.is_vegan || parsed.isVegan || filters?.isVegan) {
    if (product.is_vegan) {
      score += 15;
      matchReasons.push('100% Végane');
    }
  }
  if (parsed.fullTraceability || filters?.fullTraceability) {
    if (product.trace_qr_code || product.gps_coordinates) {
      score += 20;
      matchReasons.push('Traçabilité complète');
    }
  }

  return { score: Math.round(score), matchReasons: Array.from(new Set(matchReasons)) };
}

/**
 * Execute intelligent search with automatic NLP parsing, RPC call & fallback
 */
export async function executeIntelligentSearch(
  rawQuery: string,
  filters: StructuredFilters = {},
  fallbackProducts: Product[] = []
): Promise<SearchExecutionResponse> {
  const startTime = performance.now();
  const parsed = parseNaturalLanguageQuery(rawQuery);

  let searchResults: SearchResultItem[] = [];

  try {
    // 1. Try PostgreSQL RPC search first
    const { data: rpcData, error: rpcError } = await supabase.rpc('search_products_advanced', {
      p_query: parsed.rawQuery || null,
      p_min_price: filters.minPrice ?? parsed.maxPrice !== undefined ? undefined : undefined,
      p_max_price: filters.maxPrice ?? parsed.maxPrice,
      p_max_co2: filters.maxCo2,
      p_is_vegan: filters.isVegan ?? (parsed.isVegan ? true : null),
      p_is_recycled: filters.isRecycled ?? (parsed.isRecycled ? true : null),
      p_living_wage: filters.livingWage ?? (parsed.livingWage ? true : null),
      p_is_cooperative: filters.isCooperative ?? (parsed.isCooperative ? true : null),
      p_sort_by: filters.sortBy || 'relevance',
      p_limit: filters.limit || 50,
      p_offset: filters.offset || 0
    });

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      searchResults = rpcData.map((item: any) => {
        const { score, matchReasons } = scoreProductClientSide(item as Product, parsed, filters);
        return {
          ...item,
          searchScore: score,
          matchReasons
        };
      });
    }
  } catch (err) {
    console.warn('RPC search unavailable, switching to client-side search engine', err);
  }

  // 2. Client-side fallback if RPC returned empty or errored
  if (searchResults.length === 0 && fallbackProducts.length > 0) {
    const scoredList = fallbackProducts.map(p => {
      const { score, matchReasons } = scoreProductClientSide(p, parsed, filters);
      return {
        ...p,
        searchScore: score,
        matchReasons
      };
    });

    // Apply strict filtering
    searchResults = scoredList.filter(p => {
      // Filter by max price
      const maxP = filters.maxPrice ?? parsed.maxPrice;
      if (maxP !== undefined && p.price > maxP) return false;

      // Filter by min price
      const minP = filters.minPrice ?? parsed.minPrice;
      if (minP !== undefined && p.price < minP) return false;

      // Filter by category
      if (filters.categories && filters.categories.length > 0) {
        if (!p.category_id || !filters.categories.includes(p.category_id)) return false;
      }

      // Filter by certifications
      const allCerts = [...(filters.certifications || []), ...parsed.certifications];
      if (allCerts.length > 0) {
        const prodCerts = (p.certifications || []).map(c => normalizeText(c));
        const hasCert = allCerts.some(c => prodCerts.some(pc => pc.includes(normalizeText(c))));
        if (!hasCert) return false;
      }

      // Filter by country
      const allCountries = [...(filters.countries || []), ...parsed.countries];
      if (allCountries.length > 0) {
        const hasCountry = allCountries.some(c => normalizeText(p.country).includes(normalizeText(c)));
        if (!hasCountry) return false;
      }

      // Filter by vegan
      if ((filters.isVegan || parsed.isVegan) && !p.is_vegan && !normalizeText(p.name).includes('vegan')) return false;

      // Filter by confidence score
      if (filters.minConfidenceScore && (p.confidence_score || 0) < filters.minConfidenceScore) return false;

      // Filter by in stock
      if (filters.inStockOnly && (p.stock_value || 0) <= 0) return false;

      return p.searchScore > 35;
    });

    // Sort client-side
    searchResults.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'confidence': return (b.confidence_score || 0) - (a.confidence_score || 0);
        case 'carbon': return (a.carbon_footprint_kg || 99) - (b.carbon_footprint_kg || 99);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'newest': return new Date(b.planting_date || 0).getTime() - new Date(a.planting_date || 0).getTime();
        default: return b.searchScore - a.searchScore;
      }
    });
  }

  const executionTimeMs = Math.round(performance.now() - startTime);

  // Build aggregate suggested filters
  const certCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};
  const materialCounts: Record<string, number> = {};

  searchResults.forEach(p => {
    (p.certifications || []).forEach(c => {
      certCounts[c] = (certCounts[c] || 0) + 1;
    });
    if (p.country) {
      countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
    }
    (p.attributes?.materials || []).forEach(m => {
      materialCounts[m] = (materialCounts[m] || 0) + 1;
    });
  });

  return {
    results: searchResults,
    totalCount: searchResults.length,
    parsedQuery: parsed,
    executionTimeMs,
    suggestedFilters: {
      certifications: Object.entries(certCounts).map(([label, count]) => ({ label, count })),
      countries: Object.entries(countryCounts).map(([label, count]) => ({ label, count })),
      materials: Object.entries(materialCounts).map(([label, count]) => ({ label, count }))
    }
  };
}
