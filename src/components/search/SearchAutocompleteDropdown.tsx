// src/components/search/SearchAutocompleteDropdown.tsx
// Real-time intelligent search suggestions & autocomplete dropdown

import React from 'react';
import { Search, Sparkles, History, ArrowUpRight, Award, ShieldCheck } from 'lucide-react';
import { Product } from '../../lib/supabase';
import { ParsedSearchQuery } from '../../lib/naturalLanguageSearchService';

interface SearchAutocompleteDropdownProps {
  query: string;
  parsedQuery: ParsedSearchQuery;
  matchingProducts: Product[];
  recentSearches: string[];
  onSelectSuggestion: (text: string) => void;
  onClearHistory: () => void;
  isOpen: boolean;
}

const POPULAR_SEARCH_EXAMPLES = [
  'T-shirt coton bio homme, moins de 15 €, Europe',
  'Café équitable colombien en grains 1kg maximum 30€',
  'Meilleur chocolat noir bio 70% sans gluten avec livraison rapide',
  'Alternative moins chère au miel Manuka avec traçabilité complète',
  'Vêtements enfants bio fabriqués en France MOQ inférieur à 50'
];

export const SearchAutocompleteDropdown: React.FC<SearchAutocompleteDropdownProps> = ({
  query,
  parsedQuery,
  matchingProducts,
  recentSearches,
  onSelectSuggestion,
  onClearHistory,
  isOpen
}) => {
  if (!isOpen) return null;

  const hasExtractedEntities =
    parsedQuery.productType ||
    parsedQuery.certifications.length > 0 ||
    parsedQuery.materials.length > 0 ||
    parsedQuery.countries.length > 0 ||
    parsedQuery.maxPrice !== undefined;

  return (
    <div
      id="search-autocomplete-dropdown"
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-neutral-200 z-50 overflow-hidden divide-y divide-neutral-100 max-h-[75vh] overflow-y-auto"
    >
      {/* 1. Natural Language Extracted Understanding Preview */}
      {query.trim().length > 2 && hasExtractedEntities && (
        <div className="p-3.5 bg-emerald-50/80 border-b border-emerald-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Critères extraits de votre langage naturel :</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-800 font-medium">
              Confiance {Math.round(parsedQuery.confidence * 100)}%
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {parsedQuery.productTypeCanonical && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-white text-emerald-800 border border-emerald-200 shadow-sm font-medium">
                📦 {parsedQuery.productTypeCanonical}
              </span>
            )}
            {parsedQuery.materials.map(m => (
              <span key={m} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-white text-emerald-800 border border-emerald-200 shadow-sm font-medium">
                🌿 {m}
              </span>
            ))}
            {parsedQuery.certifications.map(c => (
              <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-emerald-600 text-white shadow-sm font-medium">
                ✓ {c}
              </span>
            ))}
            {parsedQuery.gender && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-white text-emerald-800 border border-emerald-200 shadow-sm font-medium">
                👤 {parsedQuery.gender}
              </span>
            ))}
            {parsedQuery.countries.map(c => (
              <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-white text-emerald-800 border border-emerald-200 shadow-sm font-medium">
                🌍 {c}
              </span>
            ))}
            {parsedQuery.maxPrice !== undefined && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-amber-100 text-amber-900 border border-amber-300 shadow-sm font-semibold">
                💰 ≤ {parsedQuery.maxPrice} €
              </span>
            )}
            {parsedQuery.intent === 'alternative_search' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-indigo-100 text-indigo-900 border border-indigo-300 font-semibold">
                🔄 Recherche d'alternative à {parsedQuery.referenceTarget}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Top Matching Products Instant Preview */}
      {matchingProducts.length > 0 && (
        <div className="p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-2">
            Produits correspondants ({matchingProducts.length})
          </div>
          <div className="space-y-1">
            {matchingProducts.slice(0, 4).map(prod => (
              <button
                key={prod.id}
                type="button"
                onClick={() => onSelectSuggestion(prod.name)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  {prod.image_url ? (
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-10 h-10 rounded-lg object-cover bg-neutral-100 border border-neutral-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      {prod.emoji || '📦'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                      {prod.name}
                      {prod.country_flag && <span className="text-xs">{prod.country_flag}</span>}
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-2">
                      <span>{prod.producers?.company_name || prod.country}</span>
                      {prod.certifications && prod.certifications.length > 0 && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                          {prod.certifications[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-neutral-900">
                    {prod.price} {prod.currency || '€'}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 justify-end">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Score {prod.confidence_score || prod.product_score || 85}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Popular / Complex Prompt Examples */}
      <div className="p-3 bg-neutral-50/50">
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-2 flex items-center justify-between">
          <span>Exemples de requêtes en langage naturel</span>
          <span className="text-[10px] font-normal text-neutral-400">Cliquez pour tester</span>
        </div>
        <div className="space-y-1">
          {POPULAR_SEARCH_EXAMPLES.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion(example)}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-neutral-700 hover:bg-emerald-50 hover:text-emerald-900 transition text-left group"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-600 shrink-0" />
              <span className="truncate">{example}</span>
              <ArrowUpRight className="w-3 h-3 text-neutral-300 group-hover:text-emerald-600 ml-auto shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 4. Recent Searches History */}
      {recentSearches.length > 0 && (
        <div className="p-3">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-2">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Recherches récentes
            </span>
            <button
              type="button"
              onClick={onClearHistory}
              className="text-[10px] text-neutral-400 hover:text-rose-600 font-normal lowercase"
            >
              Effacer
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 px-1">
            {recentSearches.slice(0, 6).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSuggestion(item)}
                className="px-2.5 py-1 rounded-lg text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition flex items-center gap-1"
              >
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
