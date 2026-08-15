// src/components/search/IntelligentSearchBar.tsx
// Prominent Natural Language Search Bar with animated placeholders, live parsing badges & voice input

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, SlidersHorizontal, CornerDownLeft } from 'lucide-react';
import { VoiceSearchButton } from './VoiceSearchButton';
import { SearchAutocompleteDropdown } from './SearchAutocompleteDropdown';
import { parseNaturalLanguageQuery, ParsedSearchQuery } from '../../lib/naturalLanguageSearchService';
import { Product } from '../../lib/supabase';

interface IntelligentSearchBarProps {
  query: string;
  onQueryChange: (newQuery: string) => void;
  onSearchSubmit: (query: string) => void;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  catalogProducts?: Product[];
  className?: string;
}

const ROTATING_PLACEHOLDERS = [
  'Recherchez en langage naturel (ex: "T-shirt coton bio homme, moins de 15 €, Europe")',
  'Essayez : "Café équitable colombien en grains 1kg maximum 30€"',
  'Essayez : "Meilleur chocolat noir bio 70% sans gluten avec livraison rapide"',
  'Essayez : "Alternative moins chère au miel Manuka avec traçabilité complète"',
  'Essayez : "Vêtements enfants bio fabriqués en France MOQ inférieur à 50"'
];

export const IntelligentSearchBar: React.FC<IntelligentSearchBarProps> = ({
  query,
  onQueryChange,
  onSearchSubmit,
  onToggleFilters,
  activeFiltersCount,
  catalogProducts = [],
  className = ''
}) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ethimarket_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotating placeholder effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parsedQuery: ParsedSearchQuery = React.useMemo(() => {
    return parseNaturalLanguageQuery(query);
  }, [query]);

  // Preview matching products
  const previewMatchingProducts = React.useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    const lower = query.toLowerCase();
    return catalogProducts
      .filter(p => p.name.toLowerCase().includes(lower) || (p.description && p.description.toLowerCase().includes(lower)))
      .slice(0, 4);
  }, [query, catalogProducts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      onSearchSubmit(query.trim());
      setIsDropdownOpen(false);
    }
  };

  const saveRecentSearch = (text: string) => {
    const updated = [text, ...recentSearches.filter(s => s !== text)].slice(0, 10);
    setRecentSearches(updated);
    try {
      localStorage.setItem('ethimarket_recent_searches', JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleSelectSuggestion = (text: string) => {
    onQueryChange(text);
    saveRecentSearch(text);
    onSearchSubmit(text);
    setIsDropdownOpen(false);
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('ethimarket_recent_searches');
    } catch {
      // Ignore
    }
  };

  return (
    <div id="intelligent-search-bar-container" ref={searchContainerRef} className={`relative w-full ${className}`}>
      {/* Main Search Input Form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center bg-white rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-500 shadow-xl shadow-emerald-950/5 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100 transition-all p-1.5"
      >
        {/* Animated Search Icon */}
        <div className="pl-3.5 pr-2 text-emerald-700">
          <Search className="w-5 h-5 animate-pulse" />
        </div>

        {/* Text Input */}
        <input
          id="input-intelligent-search"
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            onQueryChange(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={ROTATING_PLACEHOLDERS[placeholderIndex]}
          className="w-full py-2.5 px-1 text-sm md:text-base text-neutral-900 placeholder-neutral-400 bg-transparent focus:outline-none"
        />

        {/* Action Controls Inside Input */}
        <div className="flex items-center gap-1.5 pr-2">
          {/* Clear button */}
          {query && (
            <button
              id="btn-clear-search-input"
              type="button"
              onClick={() => {
                onQueryChange('');
                inputRef.current?.focus();
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              title="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Search Mic */}
          <VoiceSearchButton
            onTranscript={transcript => {
              onQueryChange(transcript);
              saveRecentSearch(transcript);
              onSearchSubmit(transcript);
            }}
          />

          {/* Submit Search Button */}
          <button
            id="btn-submit-search"
            type="submit"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-medium text-sm transition shadow-sm"
          >
            <span>Rechercher</span>
            <CornerDownLeft className="w-3.5 h-3.5 opacity-75" />
          </button>

          {/* Advanced Filters Toggle Button */}
          <button
            id="btn-toggle-advanced-filters"
            type="button"
            onClick={onToggleFilters}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
              activeFiltersCount > 0
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden md:inline">Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-xs flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      <SearchAutocompleteDropdown
        query={query}
        parsedQuery={parsedQuery}
        matchingProducts={previewMatchingProducts}
        recentSearches={recentSearches}
        onSelectSuggestion={handleSelectSuggestion}
        onClearHistory={handleClearHistory}
        isOpen={isDropdownOpen}
      />
    </div>
  );
};
