// src/pages/Catalogue.tsx
// Intelligent Multi-criteria Marketplace Catalogue with Natural Language Search

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  LayoutGrid,
  LayoutList,
  Sparkles,
  MapPin,
  Clock,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bookmark
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { ProductCardSkeleton } from '../components/Skeleton';
import { supabase, type Product, type Category } from '../lib/supabase';
import { IntelligentSearchBar } from '../components/search/IntelligentSearchBar';
import { AdvancedFiltersSidebar } from '../components/search/AdvancedFiltersSidebar';
import { SearchResultsGrid } from '../components/search/SearchResultsGrid';
import { SearchResultsTable } from '../components/search/SearchResultsTable';
import { SearchResultsMap } from '../components/search/SearchResultsMap';
import { ProductComparisonDrawer } from '../components/search/ProductComparisonDrawer';
import {
  executeIntelligentSearch,
  SearchResultItem,
  StructuredFilters
} from '../lib/productSearchEngine';
import { findAlternativeProducts, AlternativeRecommendation } from '../lib/alternativeProductsEngine';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Pertinence & Score éthique' },
  { value: 'price_asc', label: 'Prix : Moins cher au plus cher' },
  { value: 'price_desc', label: 'Prix : Plus cher au moins cher' },
  { value: 'confidence', label: 'Score de confiance maximal' },
  { value: 'carbon', label: 'Empreinte carbone minimale' },
  { value: 'rating', label: 'Meilleures notes clients' },
  { value: 'newest', label: 'Nouveaux arrivages' }
];

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Raw data from DB
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<StructuredFilters>(() => {
    const cat = searchParams.get('category');
    return {
      categories: cat ? [cat] : undefined,
      sortBy: 'relevance'
    };
  });

  // Search Execution state
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [executionStats, setExecutionStats] = useState<{ count: number; timeMs: number; confidence: number }>({
    count: 0,
    timeMs: 0,
    confidence: 0.9
  });

  // Multi-view states
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Comparison & Alternatives state
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [alternativeTarget, setAlternativeTarget] = useState<Product | null>(null);
  const [alternativeRecommendations, setAlternativeRecommendations] = useState<AlternativeRecommendation[]>([]);

  // 1. Fetch baseline products from Supabase
  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const { data: prodData } = await supabase
          .from('products')
          .select('*, producers(*), categories(*)')
          .order('featured', { ascending: false });

        if (prodData) {
          setRawProducts(prodData as Product[]);
        }

        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (catData) {
          setCategories(catData);
        }
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // 2. Execute intelligent hybrid search whenever query or filters change
  const runSearch = useCallback(async (currentQuery: string, currentFilters: StructuredFilters) => {
    const searchResponse = await executeIntelligentSearch(currentQuery, currentFilters, rawProducts);
    setSearchResults(searchResponse.results);
    setExecutionStats({
      count: searchResponse.totalCount,
      timeMs: searchResponse.executionTimeMs,
      confidence: searchResponse.parsedQuery.confidence
    });

    // Check if query is an alternative search request
    if (searchResponse.parsedQuery.intent === 'alternative_search' && searchResponse.parsedQuery.referenceTarget) {
      const refTarget = searchResponse.parsedQuery.referenceTarget.toLowerCase();
      const matchRef = rawProducts.find(p => p.name.toLowerCase().includes(refTarget));
      if (matchRef) {
        const alts = findAlternativeProducts(matchRef, rawProducts, searchResponse.parsedQuery);
        setAlternativeTarget(matchRef);
        setAlternativeRecommendations(alts);
      }
    } else {
      setAlternativeTarget(null);
      setAlternativeRecommendations([]);
    }
  }, [rawProducts]);

  useEffect(() => {
    if (rawProducts.length > 0) {
      runSearch(query, filters);
    }
  }, [query, filters, rawProducts, runSearch]);

  // Sync query URL
  const handleQuerySubmit = (newQuery: string) => {
    setQuery(newQuery);
    if (newQuery) {
      setSearchParams({ q: newQuery });
    } else {
      setSearchParams({});
    }
    runSearch(newQuery, filters);
  };

  const handleResetFilters = () => {
    setFilters({ sortBy: 'relevance' });
    setQuery('');
    setSearchParams({});
  };

  // Compare handlers
  const handleToggleCompare = (product: Product) => {
    setComparedProducts(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 5) {
        alert('Vous pouvez comparer jusqu\'à 5 produits simultanément.');
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleSearchAlternativesForProduct = (product: Product) => {
    const alts = findAlternativeProducts(product, rawProducts);
    setAlternativeTarget(product);
    setAlternativeRecommendations(alts);
    // Scroll smoothly to alternative section
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.certifications?.length) count += filters.certifications.length;
    if (filters.countries?.length) count += filters.countries.length;
    if (filters.maxPrice !== undefined) count += 1;
    if (filters.minPrice !== undefined) count += 1;
    if (filters.maxCo2 !== undefined) count += 1;
    if (filters.isVegan) count += 1;
    if (filters.isRecycled) count += 1;
    if (filters.livingWage) count += 1;
    if (filters.isCooperative) count += 1;
    if (filters.plasticFree) count += 1;
    if (filters.fullTraceability) count += 1;
    if (filters.minConfidenceScore) count += 1;
    if (filters.inStockOnly) count += 1;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col">
      <SEOHead
        title="Catalogue Éthique & Moteur de Recherche Intelligent | EthiMarket"
        description="Trouvez des produits éthiques, bios et équitables grâce à notre moteur de recherche multicritères en langage naturel sans coût d'API."
      />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Search Hero Bar */}
        <div className="bg-gradient-to-br from-emerald-900 to-neutral-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Moteur de recherche multicritères & langage naturel (Zéro API externe)</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Trouvez exactement le produit éthique qu'il vous faut
            </h1>
            <p className="text-sm md:text-base text-neutral-300">
              Tapez votre recherche en langage naturel, spécifiez vos exigences (bio, origine, salaire décent, CO2) ou demandez des alternatives comparatives.
            </p>

            {/* Prominent Search Bar */}
            <div className="pt-2">
              <IntelligentSearchBar
                query={query}
                onQueryChange={setQuery}
                onSearchSubmit={handleQuerySubmit}
                onToggleFilters={() => setIsMobileFiltersOpen(true)}
                activeFiltersCount={activeFiltersCount}
                catalogProducts={rawProducts}
              />
            </div>
          </div>
        </div>

        {/* Alternative Recommendation Banner if triggered */}
        {alternativeTarget && alternativeRecommendations.length > 0 && (
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-base">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>Alternatives recommandées pour : "{alternativeTarget.name}"</span>
              </div>
              <button
                type="button"
                onClick={() => setAlternativeTarget(null)}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold underline"
              >
                Masquer
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alternativeRecommendations.slice(0, 3).map((alt, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                      <span>{alt.alternativeProduct.country_flag} {alt.alternativeProduct.country}</span>
                      <span className="font-bold text-emerald-700">
                        {alt.alternativeProduct.price} €
                      </span>
                    </div>
                    <h4 className="font-bold text-neutral-900 text-sm mb-2">
                      {alt.alternativeProduct.name}
                    </h4>
                    <p className="text-xs text-indigo-900 bg-indigo-50/70 p-2 rounded-lg font-medium mb-2">
                      💡 {alt.recommendationReason}
                    </p>
                    <div className="space-y-1">
                      {alt.advantages.map((adv, i) => (
                        <div key={i} className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                          <span>✓</span>
                          <span>{adv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleCompare(alt.alternativeProduct)}
                      className="text-xs text-indigo-700 hover:underline font-semibold"
                    >
                      + Comparer
                    </button>
                    <Link
                      to={`/produits/${alt.alternativeProduct.slug}`}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg font-semibold"
                    >
                      Voir le produit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Layout: Sidebar Filters + Results Grid/Table */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Faceted Filters Sidebar */}
          <div className="lg:col-span-1">
            <AdvancedFiltersSidebar
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={handleResetFilters}
              onSaveSearchModalOpen={() => alert('Recherche enregistrée avec succès dans vos alertes !')}
              catalogProducts={rawProducts}
              totalResultsCount={searchResults.length}
              isOpenMobile={isMobileFiltersOpen}
              onCloseMobile={() => setIsMobileFiltersOpen(false)}
            />
          </div>

          {/* Right Results Section */}
          <div className="lg:col-span-3 space-y-4">
            {/* Control Bar: Results stats, Sort dropdown & View switcher */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Left: Execution stats */}
              <div className="flex items-center gap-3 text-xs text-neutral-600">
                <span className="font-bold text-neutral-900 text-sm">
                  {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
                </span>
                <span>•</span>
                <span className="text-neutral-400">
                  Traité en {executionStats.timeMs}ms
                </span>
                {query && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      NLP Match {Math.round(executionStats.confidence * 100)}%
                    </span>
                  </>
                )}
              </div>

              {/* Right: Sort & Layout toggles */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Sort selector */}
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <select
                    value={filters.sortBy || 'relevance'}
                    onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View switcher buttons */}
                <div className="flex items-center bg-neutral-100 rounded-xl p-1 border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                    title="Vue grille"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'table' ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                    title="Vue liste condensée B2B"
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'map' ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                    title="Vue carte géographique"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading skeletons */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              viewMode === 'grid' ? (
                <SearchResultsGrid
                  results={searchResults}
                  selectedComparisonIds={comparedProducts.map(p => p.id)}
                  onToggleCompare={handleToggleCompare}
                  onSearchAlternative={handleSearchAlternativesForProduct}
                />
              ) : viewMode === 'table' ? (
                <SearchResultsTable
                  results={searchResults}
                  selectedComparisonIds={comparedProducts.map(p => p.id)}
                  onToggleCompare={handleToggleCompare}
                />
              ) : (
                <SearchResultsMap
                  results={searchResults}
                  selectedComparisonIds={comparedProducts.map(p => p.id)}
                  onToggleCompare={handleToggleCompare}
                />
              )
            ) : (
              /* Zero result empty state */
              <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Aucun produit ne correspond exactement à vos critères
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  Essayez d'élargir votre recherche, de réduire les filtres stricts ou de tester un exemple en langage naturel.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Réinitialiser tous les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Comparator Drawer (up to 5 products) */}
      <ProductComparisonDrawer
        selectedProducts={comparedProducts}
        onRemoveProduct={id => setComparedProducts(prev => prev.filter(p => p.id !== id))}
        onClearAll={() => setComparedProducts([])}
      />

      <Footer />
    </div>
  );
}
