// src/lib/naturalLanguageSearchService.ts
// 100% In-house Zero-API Natural Language Search Parser

import {
  PRODUCT_TYPES_DICT,
  MATERIALS_DICT,
  CERTIFICATIONS_DICT,
  GENDERS_DICT,
  COUNTRIES_DICT,
  REGIONS_DICT,
  ETHICAL_FLAGS_DICT,
  INTENT_PATTERNS
} from './nlpSearchDictionaries';

export type SearchIntentType = 'standard_search' | 'alternative_search' | 'comparison_search';

export interface ParsedSearchQuery {
  rawQuery: string;
  normalizedQuery: string;
  intent: SearchIntentType;
  referenceTarget?: string;
  comparisonTarget?: string;
  
  // Categorical & Product criteria
  productType?: string;
  productTypeCanonical?: string;
  materials: string[];
  certifications: string[];
  gender?: 'homme' | 'femme' | 'unisexe' | 'enfant' | 'bebe';
  
  // Geographical criteria
  countries: string[];
  manufacturingCountry?: string;
  regions: string[];
  
  // Financial & Commercial criteria
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  maxMoq?: number;
  fastDelivery?: boolean;
  
  // Quality & Environmental criteria
  minPercentage?: number; // e.g., 70% cacao or 100% coton
  weightQuantity?: string; // e.g., 1kg, 500g
  isVegan?: boolean;
  isRecycled?: boolean;
  livingWage?: boolean;
  isCooperative?: boolean;
  socialProtection?: boolean;
  plasticFree?: boolean;
  glutenFree?: boolean;
  fullTraceability?: boolean;
  cheaperPriority?: boolean;
  lowerCarbonPriority?: boolean;
  
  // Tokenization & NLP metrics
  extractedKeywords: string[];
  residualKeywords: string[];
  confidence: number;
}

/**
 * Clean & normalize a string (lowercase, trim accents for comparison)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Main NLP Parser function
 */
export function parseNaturalLanguageQuery(query: string): ParsedSearchQuery {
  if (!query || query.trim() === '') {
    return {
      rawQuery: '',
      normalizedQuery: '',
      intent: 'standard_search',
      materials: [],
      certifications: [],
      countries: [],
      regions: [],
      extractedKeywords: [],
      residualKeywords: [],
      confidence: 0
    };
  }

  const rawQuery = query.trim();
  const lowerQuery = query.toLowerCase();
  const normalized = normalizeText(query);
  let workingQuery = lowerQuery;

  let intent: SearchIntentType = 'standard_search';
  let referenceTarget: string | undefined;
  let comparisonTarget: string | undefined;

  // 1. Detect Intent: Alternative / Comparison / Standard
  for (const pattern of INTENT_PATTERNS.alternative) {
    const match = query.match(pattern);
    if (match && match[1]) {
      intent = 'alternative_search';
      referenceTarget = match[1].trim();
      break;
    }
  }

  if (intent === 'standard_search') {
    for (const pattern of INTENT_PATTERNS.comparison) {
      const match = query.match(pattern);
      if (match && match[1]) {
        intent = 'comparison_search';
        comparisonTarget = match[1].trim();
        break;
      }
    }
  }

  const extractedKeywords: string[] = [];

  // 2. Extract Prices & Currency
  let minPrice: number | undefined;
  let maxPrice: number | undefined;
  let currency: string | undefined = 'EUR';

  if (/([$]|dollar|dollars)/i.test(query)) currency = 'USD';
  if (/([£]|livre|gbp)/i.test(query)) currency = 'GBP';

  // Pattern: "moins de 15 €", "< 15€", "max 15€", "maximum 30€", "jusqu'à 50€"
  const maxPriceMatch = query.match(/(?:moins\s+de|<|max(?:imum)?|inf[ée]rieur\s+à|jusqu['\s]à)\s*(\d+(?:[.,]\d+)?)\s*(?:€|eur|euros|\$|[£])?/i);
  if (maxPriceMatch) {
    maxPrice = parseFloat(maxPriceMatch[1].replace(',', '.'));
    extractedKeywords.push(maxPriceMatch[0]);
    workingQuery = workingQuery.replace(maxPriceMatch[0], ' ');
  }

  // Pattern: "plus de 20 €", "> 20€", "min 20€", "minimum 20€", "à partir de 20€"
  const minPriceMatch = query.match(/(?:plus\s+de|>|min(?:imum)?|sup[ée]rieur\s+à|[àa]\s+partir\s+de)\s*(\d+(?:[.,]\d+)?)\s*(?:€|eur|euros|\$|[£])?/i);
  if (minPriceMatch) {
    minPrice = parseFloat(minPriceMatch[1].replace(',', '.'));
    extractedKeywords.push(minPriceMatch[0]);
    workingQuery = workingQuery.replace(minPriceMatch[0], ' ');
  }

  // Pattern: "entre 10 et 50 €"
  const rangePriceMatch = query.match(/entre\s+(\d+(?:[.,]\d+)?)\s*(?:€|eur)?\s*et\s*(\d+(?:[.,]\d+)?)\s*(?:€|eur|euros)?/i);
  if (rangePriceMatch) {
    minPrice = parseFloat(rangePriceMatch[1].replace(',', '.'));
    maxPrice = parseFloat(rangePriceMatch[2].replace(',', '.'));
    extractedKeywords.push(rangePriceMatch[0]);
    workingQuery = workingQuery.replace(rangePriceMatch[0], ' ');
  }

  // Standalone price with currency: "15 €" or "15€" if preceded by nothing specific
  if (maxPrice === undefined && minPrice === undefined) {
    const standalonePriceMatch = query.match(/(\d+(?:[.,]\d+)?)\s*(?:€|eur|euros)/i);
    if (standalonePriceMatch) {
      maxPrice = parseFloat(standalonePriceMatch[1].replace(',', '.'));
      extractedKeywords.push(standalonePriceMatch[0]);
      workingQuery = workingQuery.replace(standalonePriceMatch[0], ' ');
    }
  }

  // 3. Extract MOQ (Minimum Order Quantity)
  let maxMoq: number | undefined;
  const moqMatch = query.match(/moq\s*(?:inf[ée]rieur\s*[àa]|<|max(?:imum)?|de\s*moins\s*de)?\s*(\d+)/i);
  if (moqMatch) {
    maxMoq = parseInt(moqMatch[1], 10);
    extractedKeywords.push(moqMatch[0]);
    workingQuery = workingQuery.replace(moqMatch[0], ' ');
  }

  // 4. Extract Percentage (e.g. 70% or 70 % or 100%)
  let minPercentage: number | undefined;
  const percentMatch = query.match(/(\d+)\s*%/);
  if (percentMatch) {
    minPercentage = parseInt(percentMatch[1], 10);
    extractedKeywords.push(percentMatch[0]);
    workingQuery = workingQuery.replace(percentMatch[0], ' ');
  }

  // 5. Extract Weight / Volume / Format (e.g. 1kg, 500g, 250ml)
  let weightQuantity: string | undefined;
  const weightMatch = query.match(/(\d+(?:[.,]\d+)?\s*(?:kg|kilo|g|grammes|l|litres|ml))/i);
  if (weightMatch) {
    weightQuantity = weightMatch[1].toLowerCase();
    extractedKeywords.push(weightMatch[0]);
    workingQuery = workingQuery.replace(weightMatch[0], ' ');
  }

  // 6. Extract Product Type
  let productType: string | undefined;
  let productTypeCanonical: string | undefined;
  for (const item of PRODUCT_TYPES_DICT) {
    for (const syn of item.synonyms) {
      const regex = new RegExp(`\\b${normalizeText(syn)}\\b`, 'i');
      if (regex.test(normalizeText(workingQuery))) {
        productType = item.id;
        productTypeCanonical = item.canonical;
        extractedKeywords.push(syn);
        break;
      }
    }
    if (productType) break;
  }

  // 7. Extract Materials
  const materials: string[] = [];
  for (const item of MATERIALS_DICT) {
    for (const syn of item.synonyms) {
      const regex = new RegExp(`\\b${normalizeText(syn)}\\b`, 'i');
      if (regex.test(normalizeText(workingQuery))) {
        materials.push(item.canonical);
        extractedKeywords.push(syn);
        break;
      }
    }
  }

  // 8. Extract Certifications
  const certifications: string[] = [];
  for (const item of CERTIFICATIONS_DICT) {
    for (const syn of item.synonyms) {
      const regex = new RegExp(`\\b${normalizeText(syn)}\\b`, 'i');
      if (regex.test(normalizeText(workingQuery))) {
        certifications.push(item.canonical);
        extractedKeywords.push(syn);
        break;
      }
    }
  }

  // 9. Extract Gender
  let gender: 'homme' | 'femme' | 'unisexe' | 'enfant' | 'bebe' | undefined;
  for (const item of GENDERS_DICT) {
    for (const syn of item.synonyms) {
      const regex = new RegExp(`\\b${normalizeText(syn)}\\b`, 'i');
      if (regex.test(normalizeText(workingQuery))) {
        gender = item.id as 'homme' | 'femme' | 'unisexe' | 'enfant' | 'bebe';
        extractedKeywords.push(syn);
        break;
      }
    }
    if (gender) break;
  }

  // 10. Extract Countries & Manufacturing
  const countries: string[] = [];
  let manufacturingCountry: string | undefined;
  
  // Specific check for "fabriqué en [Pays]" or "made in [Country]"
  const madeInMatch = query.match(/(?:fabriqu[ée]\s+en|made\s+in|origine)\s+([a-zA-Z\u00C0-\u017F-]+)/i);
  if (madeInMatch) {
    const rawTarget = normalizeText(madeInMatch[1]);
    for (const c of COUNTRIES_DICT) {
      if (c.synonyms.some(s => normalizeText(s) === rawTarget || rawTarget.includes(normalizeText(s)))) {
        manufacturingCountry = c.canonical;
        countries.push(c.canonical);
        extractedKeywords.push(madeInMatch[0]);
        break;
      }
    }
  }

  for (const item of COUNTRIES_DICT) {
    for (const syn of item.synonyms) {
      const regex = new RegExp(`\\b${normalizeText(syn)}\\b`, 'i');
      if (regex.test(normalizeText(workingQuery)) && !countries.includes(item.canonical)) {
        countries.push(item.canonical);
        extractedKeywords.push(syn);
        break;
      }
    }
  }

  // 11. Extract Regions & Continents
  const regions: string[] = [];
  for (const item of REGIONS_DICT) {
    for (const syn of item.synonyms) {
      const regex = new RegExp(`\\b${normalizeText(syn)}\\b`, 'i');
      if (regex.test(normalizeText(workingQuery))) {
        regions.push(item.canonical);
        extractedKeywords.push(syn);
        break;
      }
    }
  }

  // 12. Extract Ethical, Social & Environmental Flags
  const isVegan = ETHICAL_FLAGS_DICT.vegan.some(s => new RegExp(`\\b${normalizeText(s)}\\b`, 'i').test(normalized));
  const isRecycled = ETHICAL_FLAGS_DICT.recycled.some(s => new RegExp(`\\b${normalizeText(s)}\\b`, 'i').test(normalized));
  const livingWage = ETHICAL_FLAGS_DICT.living_wage.some(s => new RegExp(`\\b${normalizeText(s)}\\b`, 'i').test(normalized));
  const isCooperative = ETHICAL_FLAGS_DICT.cooperative.some(s => new RegExp(`\\b${normalizeText(s)}\\b`, 'i').test(normalized));
  const socialProtection = ETHICAL_FLAGS_DICT.social_protection.some(s => new RegExp(`\\b${normalizeText(s)}\\b`, 'i').test(normalized));
  const plasticFree = ETHICAL_FLAGS_DICT.plastic_free.some(s => new RegExp(`\\b${normalizeText(s)}\\b`, 'i').test(normalized));
  const glutenFree = ETHICAL_FLAGS_DICT.gluten_free.some(s => new RegExp(`\\b${normalizeText(s)}\\b`, 'i').test(normalized));

  const fullTraceability = INTENT_PATTERNS.better_traceability.some(p => p.test(query));
  const cheaperPriority = INTENT_PATTERNS.cheaper.some(p => p.test(query));
  const lowerCarbonPriority = INTENT_PATTERNS.lower_carbon.some(p => p.test(query));
  const fastDelivery = INTENT_PATTERNS.fast_delivery.some(p => p.test(query));

  // 13. Calculate residual keywords & Confidence Score
  const stopWords = new Set([
    'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'en', 'pour', 'avec', 'sans', 
    'et', 'ou', 'au', 'aux', 'ce', 'cette', 'ces', 'par', 'dans', 'sur', 'qui', 'que',
    'moins', 'plus', 'environ', 'maximum', 'minimum', 'trouve', 'moi', 'cherche',
    'a', 'an', 'the', 'in', 'on', 'with', 'without', 'and', 'or', 'for', 'to', 'from'
  ]);

  const allWords = normalizeText(query)
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));

  const residualKeywords = allWords.filter(w => 
    !extractedKeywords.some(ek => normalizeText(ek).includes(w))
  );

  // Confidence calculation
  let matchedCriteriaCount = 0;
  if (productType) matchedCriteriaCount += 2;
  if (materials.length > 0) matchedCriteriaCount += 1;
  if (certifications.length > 0) matchedCriteriaCount += 1.5;
  if (gender) matchedCriteriaCount += 1;
  if (countries.length > 0 || regions.length > 0) matchedCriteriaCount += 1.5;
  if (maxPrice !== undefined || minPrice !== undefined) matchedCriteriaCount += 1.5;
  if (isVegan || isRecycled || livingWage || isCooperative || glutenFree) matchedCriteriaCount += 1;
  if (intent !== 'standard_search') matchedCriteriaCount += 2;

  const confidence = Math.min(0.98, Math.max(0.4, 0.4 + (matchedCriteriaCount * 0.08)));

  return {
    rawQuery,
    normalizedQuery: normalized,
    intent,
    referenceTarget,
    comparisonTarget,
    productType,
    productTypeCanonical,
    materials,
    certifications,
    gender,
    countries,
    manufacturingCountry,
    regions,
    minPrice,
    maxPrice,
    currency,
    maxMoq,
    fastDelivery,
    minPercentage,
    weightQuantity,
    isVegan,
    isRecycled,
    livingWage,
    isCooperative,
    socialProtection,
    plasticFree,
    glutenFree,
    fullTraceability,
    cheaperPriority,
    lowerCarbonPriority,
    extractedKeywords: Array.from(new Set(extractedKeywords)),
    residualKeywords,
    confidence: Number(confidence.toFixed(2))
  };
}
