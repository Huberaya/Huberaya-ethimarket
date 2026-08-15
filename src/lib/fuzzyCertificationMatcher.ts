import { GLOBAL_CERTIFICATION_STANDARDS, StandardDefinition } from './referenceStandardsData';

export interface FuzzyMatchCandidate {
  standard: StandardDefinition;
  similarity: number; // 0 to 1
  matchedTerm: string;
  isExactMatch: boolean;
  correctionSuggestion?: string;
}

/**
 * Normalizes strings by lowercasing, stripping accents, removing punctuation, and trimming
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ')   // replace non-alphanumeric with spaces
    .replace(/\s+/g, ' ')           // collapse multi-spaces
    .trim();
}

/**
 * Levenshtein distance calculation
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = normalizeText(a);
  const s2 = normalizeText(b);

  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deletion
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Calculates string similarity between 0 and 1 using combined Levenshtein + Token overlap (Dice/Jaccard)
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeText(s1);
  const norm2 = normalizeText(s2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  // Substring inclusion bonus
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    const lenRatio = minLen / maxLen;
    return Math.max(0.75, 0.7 + 0.3 * lenRatio);
  }

  // Token / word overlap
  const tokens1 = new Set(norm1.split(' ').filter(t => t.length > 1));
  const tokens2 = new Set(norm2.split(' ').filter(t => t.length > 1));

  let intersectionCount = 0;
  tokens1.forEach(t => {
    if (tokens2.has(t)) intersectionCount++;
  });

  const unionCount = new Set([...tokens1, ...tokens2]).size;
  const jaccardScore = unionCount > 0 ? intersectionCount / unionCount : 0;

  // Levenshtein similarity
  const maxLen = Math.max(norm1.length, norm2.length);
  const levDist = levenshteinDistance(norm1, norm2);
  const levScore = 1.0 - levDist / maxLen;

  return Math.max(0, Math.min(1, 0.6 * levScore + 0.4 * jaccardScore));
}

/**
 * Detects the standard definition from user input with typo tolerance and alias lookup
 */
export function detectStandardWithFuzzy(input: string): FuzzyMatchCandidate | null {
  if (!input || !input.trim()) return null;

  const normalizedInput = normalizeText(input);
  let bestCandidate: FuzzyMatchCandidate | null = null;
  let highestScore = 0;

  for (const std of GLOBAL_CERTIFICATION_STANDARDS) {
    // 1. Check exact ID or primary name
    if (normalizedInput === normalizeText(std.id) || normalizedInput === normalizeText(std.name)) {
      return {
        standard: std,
        similarity: 1.0,
        matchedTerm: std.name,
        isExactMatch: true
      };
    }

    // 2. Check aliases
    for (const alias of std.aliases) {
      const normAlias = normalizeText(alias);
      if (normalizedInput === normAlias) {
        return {
          standard: std,
          similarity: 1.0,
          matchedTerm: alias,
          isExactMatch: true
        };
      }

      const score = calculateStringSimilarity(normalizedInput, normAlias);
      if (score > highestScore) {
        highestScore = score;
        bestCandidate = {
          standard: std,
          similarity: score,
          matchedTerm: alias,
          isExactMatch: score >= 0.95,
          correctionSuggestion: score < 0.95 && score >= 0.65 ? std.name : undefined
        };
      }
    }

    // 3. Check keywords
    for (const kw of std.keywords) {
      if (normalizedInput.includes(normalizeText(kw))) {
        const keywordScore = 0.70;
        if (keywordScore > highestScore) {
          highestScore = keywordScore;
          bestCandidate = {
            standard: std,
            similarity: keywordScore,
            matchedTerm: kw,
            isExactMatch: false,
            correctionSuggestion: std.name
          };
        }
      }
    }
  }

  // Threshold check: return candidate if score >= 0.50
  if (bestCandidate && bestCandidate.similarity >= 0.50) {
    return bestCandidate;
  }

  return null;
}
