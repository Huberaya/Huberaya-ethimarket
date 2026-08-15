import { CertificationBody } from './supabase';
import { MOCK_GLOBAL_CERTIFICATION_BODIES } from './mockGlobalCertificationBodies';
import { GLOBAL_CERTIFICATION_STANDARDS, STANDARDS_BODIES_MAP, StandardDefinition } from './referenceStandardsData';
import { detectStandardWithFuzzy, normalizeText } from './fuzzyCertificationMatcher';
import { COUNTRIES_LIST } from './countries';

export type MatchQuality = 'perfect' | 'regional' | 'continental' | 'hq' | 'none';

export interface MatchReason {
  category: 'standard' | 'geography' | 'language' | 'trust' | 'channels';
  label: string;
  points: number;
  isPositive: boolean;
}

export interface MatchingEvaluation {
  body: CertificationBody;
  totalScore: number; // 0 to 100
  quality: MatchQuality;
  reasons: MatchReason[];
  isNationalOffice: boolean;
  isRegionalOffice: boolean;
  isHeadquarters: boolean;
  matchedStandard: StandardDefinition;
  fuzzySuggestion?: string;
  recommendedChannel: 'email' | 'whatsapp' | 'phone' | 'form' | 'portal';
  targetLanguage: string;
}

export interface FindBestMatchResult {
  primaryMatch: CertificationBody | null;
  primaryEvaluation: MatchingEvaluation | null;
  alternativeMatches: MatchingEvaluation[];
  matchScore: number;
  matchQuality: MatchQuality;
  matchReasons: string[];
  recognizedStandard: StandardDefinition | null;
  fuzzyCorrectionSuggestion?: string;
  producerCountryNormalized: string;
}

export interface MatchingParams {
  standardName: string;
  producerCountry: string;
  producerLanguage?: string;
  rawCertificationInput?: string;
  candidateBodies?: CertificationBody[];
}

/**
 * Normalizes country strings and extracts ISO code if possible
 */
export function resolveCountryInfo(countryInput: string) {
  const norm = normalizeText(countryInput);
  const found = COUNTRIES_LIST.find(
    c => normalizeText(c.name) === norm ||
         normalizeText(c.code) === norm ||
         (c.currency && normalizeText(c.currency) === norm)
  );

  return {
    raw: countryInput,
    normalized: norm,
    code: found ? found.code : countryInput.toUpperCase().slice(0, 3),
    name: found ? found.name : countryInput,
    continent: found ? found.continent : 'Afrique',
    language: (found && 'language' in found && typeof (found as Record<string, unknown>).language === 'string')
      ? ((found as Record<string, unknown>).language as string)
      : 'fr'
  };
}

/**
 * Calculates a match score for a specific CertificationBody against requested parameters
 */
function evaluateBodyForStandardAndCountry(
  body: CertificationBody,
  standard: StandardDefinition,
  countryInfo: ReturnType<typeof resolveCountryInfo>,
  preferredLanguage?: string
): MatchingEvaluation {
  const reasons: MatchReason[] = [];
  let score = 0;

  // 1. STANDARD MATCH (Up to 40 Points)
  // Check if body directly declares or is linked to the standard
  const links = STANDARDS_BODIES_MAP.filter(
    l => l.standardId === standard.id && 
         (normalizeText(l.bodyAcronym) === normalizeText(body.acronym) ||
          normalizeText(l.bodyName) === normalizeText(body.name) ||
          l.bodyName.toLowerCase().includes(body.name.toLowerCase().slice(0, 8)))
  );

  const directTypeMatch = body.certification_types.some(t => {
    const normT = normalizeText(t);
    return normT.includes(normalizeText(standard.id)) ||
           normT.includes(normalizeText(standard.name)) ||
           standard.aliases.some(a => normT.includes(normalizeText(a)));
  });

  if (links.length > 0 || directTypeMatch) {
    score += 40;
    reasons.push({
      category: 'standard',
      label: `Standard "${standard.name}" officiellement géré et accrédité`,
      points: 40,
      isPositive: true
    });
  } else {
    // Partial standard relevance check
    const partialMatch = body.domains.some(d => standard.keywords.some(k => normalizeText(d).includes(normalizeText(k))));
    if (partialMatch) {
      score += 20;
      reasons.push({
        category: 'standard',
        label: `Domaine d'intervention compatible (${body.domains.slice(0, 2).join(', ')})`,
        points: 20,
        isPositive: true
      });
    } else {
      reasons.push({
        category: 'standard',
        label: `Standard non répertorié pour cet organisme`,
        points: 0,
        isPositive: false
      });
    }
  }

  // 2. GEOGRAPHIC PROXIMITY (Up to 30 Points)
  let isNational = false;
  let isRegional = false;
  let isHq = false;

  const bodyCountryNorm = normalizeText(body.country);
  const prodCountryNorm = countryInfo.normalized;
  const sameCountry = bodyCountryNorm === prodCountryNorm || 
                      body.country.toLowerCase().includes(countryInfo.name.toLowerCase());

  // Check explicit link mapping coverage
  const linkWithCoverage = links.find(l => 
    l.countryCode === countryInfo.code ||
    l.coverageCountries.includes(countryInfo.code) ||
    l.coverageCountries.includes('WORLDWIDE')
  );

  if (sameCountry || (linkWithCoverage && linkWithCoverage.isNationalOffice)) {
    isNational = true;
    score += 30;
    reasons.push({
      category: 'geography',
      label: `Bureau national dans le même pays (${countryInfo.name})`,
      points: 30,
      isPositive: true
    });
  } else if (linkWithCoverage && linkWithCoverage.isRegionalOffice) {
    isRegional = true;
    score += 22;
    reasons.push({
      category: 'geography',
      label: `Bureau régional couvrant la zone géographique (${linkWithCoverage.countryName})`,
      points: 22,
      isPositive: true
    });
  } else if (body.region === countryInfo.continent || (body.sub_region && body.sub_region.includes(countryInfo.continent))) {
    isRegional = true;
    score += 15;
    reasons.push({
      category: 'geography',
      label: `Antenne continentale (${body.region})`,
      points: 15,
      isPositive: true
    });
  } else if (body.is_active && (linkWithCoverage?.isHeadquarters || body.name.toLowerCase().includes('international') || body.name.toLowerCase().includes('gmbh') || body.name.toLowerCase().includes('secretariat'))) {
    isHq = true;
    score += 8;
    reasons.push({
      category: 'geography',
      label: `Siège international de référence (${body.country})`,
      points: 8,
      isPositive: true
    });
  } else {
    reasons.push({
      category: 'geography',
      label: `Organisme situé hors zone (${body.country})`,
      points: 0,
      isPositive: false
    });
  }

  // 3. COMMON LANGUAGE (Up to 15 Points)
  const targetProdLang = preferredLanguage || countryInfo.language || 'en';
  const bodyLangs = body.languages.map(l => l.toLowerCase());
  
  if (bodyLangs.some(l => l.startsWith(targetProdLang) || targetProdLang.startsWith(l))) {
    score += 15;
    reasons.push({
      category: 'language',
      label: `Langue commune disponible (${targetProdLang.toUpperCase()})`,
      points: 15,
      isPositive: true
    });
  } else if (bodyLangs.includes('en') || bodyLangs.includes('fr')) {
    score += 10;
    reasons.push({
      category: 'language',
      label: `Langue internationale supportée (${body.languages.join(', ')})`,
      points: 10,
      isPositive: true
    });
  } else {
    reasons.push({
      category: 'language',
      label: `Langues d'échange restreintes (${body.languages.join(', ')})`,
      points: 0,
      isPositive: false
    });
  }

  // 4. TRUST LEVEL & RELIABILITY (Up to 10 Points)
  const reliability = body.reliability_score || 85;
  const trustPoints = Math.round((reliability / 100) * 10);
  score += trustPoints;
  reasons.push({
    category: 'trust',
    label: `Niveau de confiance certifié : ${body.trust_level} (${reliability}%)`,
    points: trustPoints,
    isPositive: true
  });

  // 5. OPERATIONAL CONTACT CHANNELS (Up to 5 Points)
  const hasEmail = Boolean(body.email_contact && body.email_contact.includes('@'));
  const hasWhatsApp = Boolean(body.whatsapp && body.whatsapp.length > 5);
  const hasPortal = Boolean(body.verification_url || body.contact_form_url);

  let channelPoints = 0;
  if (hasEmail) channelPoints += 3;
  if (hasWhatsApp) channelPoints += 1;
  if (hasPortal) channelPoints += 1;

  score += channelPoints;
  reasons.push({
    category: 'channels',
    label: `Canaux de contact disponibles : ${[
      hasEmail ? 'Email direct' : null,
      hasWhatsApp ? 'WhatsApp' : null,
      hasPortal ? 'Portail Web' : null
    ].filter(Boolean).join(', ')}`,
    points: channelPoints,
    isPositive: true
  });

  // Normalize final score between 0 and 100
  const totalScore = Math.min(100, Math.max(0, score));

  // Determine Match Quality
  let quality: MatchQuality = 'none';
  if (totalScore >= 85 && isNational) {
    quality = 'perfect';
  } else if (totalScore >= 60 || isRegional) {
    quality = 'regional';
  } else if (totalScore >= 40) {
    quality = 'continental';
  } else if (isHq || totalScore >= 25) {
    quality = 'hq';
  } else {
    quality = 'none';
  }

  // Best channel
  let recommendedChannel: 'email' | 'whatsapp' | 'phone' | 'form' | 'portal' = 'email';
  if (body.whatsapp && (isNational || sameCountry)) {
    recommendedChannel = 'whatsapp';
  } else if (body.email_contact) {
    recommendedChannel = 'email';
  } else if (body.contact_form_url) {
    recommendedChannel = 'form';
  } else if (body.verification_url) {
    recommendedChannel = 'portal';
  } else if (body.phone) {
    recommendedChannel = 'phone';
  }

  return {
    body,
    totalScore,
    quality,
    reasons,
    isNationalOffice: isNational,
    isRegionalOffice: isRegional,
    isHeadquarters: isHq,
    matchedStandard: standard,
    recommendedChannel,
    targetLanguage: bodyLangs.includes(targetProdLang) ? targetProdLang : (bodyLangs[0] || 'en')
  };
}

/**
 * Main Engine API: Finds the single best matching CertificationBody + sorted alternatives
 */
export async function findBestMatchingBody(params: MatchingParams): Promise<FindBestMatchResult> {
  const {
    standardName,
    producerCountry,
    producerLanguage,
    rawCertificationInput,
    candidateBodies = MOCK_GLOBAL_CERTIFICATION_BODIES
  } = params;

  const countryInfo = resolveCountryInfo(producerCountry);

  // 1. Detect Standard via Fuzzy Matcher
  const queryStr = standardName || rawCertificationInput || '';
  const fuzzyDetection = detectStandardWithFuzzy(queryStr);

  const recognizedStandard = fuzzyDetection 
    ? fuzzyDetection.standard 
    : GLOBAL_CERTIFICATION_STANDARDS[0]; // fallback default standard

  const fuzzyCorrectionSuggestion = fuzzyDetection?.correctionSuggestion;

  // 2. Evaluate all candidate certification bodies
  const evaluations: MatchingEvaluation[] = candidateBodies.map(body => 
    evaluateBodyForStandardAndCountry(body, recognizedStandard, countryInfo, producerLanguage)
  );

  // 3. Sort evaluations by totalScore descending
  evaluations.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // Tie-breaker: prefer national office, then regional
    if (b.isNationalOffice !== a.isNationalOffice) {
      return b.isNationalOffice ? 1 : -1;
    }
    return (b.body.reliability_score || 0) - (a.body.reliability_score || 0);
  });

  const primaryEvaluation = evaluations[0] && evaluations[0].totalScore >= 30 ? evaluations[0] : null;
  const primaryMatch = primaryEvaluation ? primaryEvaluation.body : null;

  const alternativeMatches = evaluations
    .filter((e, idx) => idx > 0 && e.totalScore >= 30)
    .slice(0, 5);

  const matchScore = primaryEvaluation ? primaryEvaluation.totalScore : 0;
  const matchQuality = primaryEvaluation ? primaryEvaluation.quality : 'none';

  const matchReasons = primaryEvaluation 
    ? primaryEvaluation.reasons.map(r => r.label)
    : ['Aucun organisme certificateur correspondant avec un niveau de confiance suffisant n\'a été trouvé.'];

  return {
    primaryMatch,
    primaryEvaluation,
    alternativeMatches,
    matchScore,
    matchQuality,
    matchReasons,
    recognizedStandard: fuzzyDetection ? recognizedStandard : null,
    fuzzyCorrectionSuggestion,
    producerCountryNormalized: countryInfo.name
  };
}
