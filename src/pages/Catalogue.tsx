import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Star, LayoutGrid, LayoutList, ArrowRight,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import SEOHead from '../components/SEOHead';
import { ProductCardSkeleton } from '../components/Skeleton';
import { supabase, type Product, type Category } from '../lib/supabase';
import { COUNTRIES } from '../lib/countries';

/* ─── Constants ─────────────────────────────────────────── */

const COUNTRY_NAMES = ['Tous les pays', ...COUNTRIES.map(c => c.name)];

const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Pertinence' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'rating',     label: 'Meilleures notes' },
  { value: 'newest',     label: 'Nouveautés' },
];

const CERTS = [
  { label: 'Agriculture Biologique', value: 'Bio' },
  { label: 'Fairtrade',              value: 'Fairtrade' },
  { label: 'Ecocert',                value: 'Ecocert' },
  { label: 'Rainforest Alliance',    value: 'Rainforest Alliance' },
  { label: 'GlobalG.A.P.',           value: 'GlobalGAP' },
];

const PER_PAGE = 12;

/* ─── Main component ─────────────────────────────────────── */

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [gridView,    setGridView]    = useState(true);

  const [search,           setSearch]           = useState(searchParams.get('q') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? '');
  const [selectedCountry,  setSelectedCountry]  = useState('Tous les pays');
  const [selectedCerts,    setSelectedCerts]    = useState<string[]>([]);
  const [minRating,        setMinRating]        = useState(0);
  const [priceMin,         setPriceMin]         = useState(0);
  const [priceMax,         setPriceMax]         = useState(500);
  const [maxMoq,           setMaxMoq]           = useState(0);
  const [minScore,         setMinScore]         = useState(0);
  const [sort,             setSort]             = useState('relevance');
  const [page,             setPage]             = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, producers(*), categories(*)', { count: 'exact' });

    // Search in name OR description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Category filter — use category_id
    if (selectedCategory) {
      // Look up category id by slug
      const cat = categories.find(c => c.slug === selectedCategory);
      if (cat) query = query.eq('category_id', cat.id);
    }

    // Country filter
    if (selectedCountry !== 'Tous les pays') {
      query = query.eq('country', selectedCountry);
    }

    // Rating filter
    if (minRating > 0) {
      query = query.gte('rating', minRating);
    }

    // Certifications filter (array overlaps)
    if (selectedCerts.length > 0) {
      query = query.overlaps('certifications', selectedCerts);
    }

    // Price range filter
    if (priceMin > 0) {
      query = query.gte('price', priceMin);
    }
    if (priceMax < 500) {
      query = query.lte('price', priceMax);
    }

    // MOQ max filter
    if (maxMoq > 0) {
      query = query.lte('moq_value', maxMoq);
    }

    // Score minimum filter (uses producer's ethimarket_score via join)
    if (minScore > 0) {
      query = query.gte('product_score', minScore);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':  query = query.order('price', { ascending: true }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'rating':     query = query.order('rating', { ascending: false }); break;
      case 'newest':     query = query.order('created_at', { ascending: false }); break;
      default:           query = query.order('featured', { ascending: false }); break;
    }

    const from = (page - 1) * PER_PAGE;
    query = query.range(from, from + PER_PAGE - 1);

    const { data, count } = await query;
    if (data)          setProducts(data);
    if (count !== null) setTotal(count);
    setLoading(false);
  }, [search, selectedCategory, selectedCountry, selectedCerts, minRating, priceMin, priceMax, maxMoq, minScore, sort, page, categories]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    supabase.from('categories').select('*').order('product_count', { ascending: false })
      .then(({ data }) => data && setCategories(data));
  }, []);

  const toggleCert = (val: string) => {
    setSelectedCerts(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
    setPage(1);
  };

  const reset = () => {
    setSearch(''); setSelectedCategory(''); setSelectedCountry('Tous les pays');
    setSelectedCerts([]); setMinRating(0); setPriceMin(0); setPriceMax(500); setMaxMoq(0);
    setSort('relevance'); setPage(1);
    setMinScore(0);
    setSearchParams({});
  };

  const totalPages = Math.ceil(total / PER_PAGE);
  const activeFilterCount =
    (selectedCountry !== 'Tous les pays' ? 1 : 0) +
    selectedCerts.length +
    (minRating > 0 ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (priceMin > 0 ? 1 : 0) +
    (priceMax < 500 ? 1 : 0) +
    (maxMoq > 0 ? 1 : 0) +
    (minScore > 0 ? 1 : 0) +
    (search ? 1 : 0);

  /* ── Sidebar content (shared between desktop + mobile) ── */
  const SidebarContent = () => (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-base">Filtres</h2>
        {activeFilterCount > 0 && (
          <button onClick={reset} className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Réinitialiser ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Recherche */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recherche</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Nom ou description..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Catégorie */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Catégorie</p>
        <div className="space-y-1 max-h-52 overflow-y-auto scrollbar-hide">
          <label className="flex items-center gap-2.5 cursor-pointer py-1 group">
            <input type="radio" name="category" checked={!selectedCategory}
              onChange={() => { setSelectedCategory(''); setPage(1); }}
              className="w-4 h-4 accent-brand-500" />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Toutes les catégories</span>
          </label>
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer py-1 group">
              <input type="radio" name="category" checked={selectedCategory === cat.slug}
                onChange={() => { setSelectedCategory(cat.slug); setPage(1); }}
                className="w-4 h-4 accent-brand-500" />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors flex-1">{cat.emoji} {cat.name}</span>
              <span className="text-xs text-gray-400">{cat.product_count.toLocaleString('fr-FR')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pays */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Pays d'origine</p>
        <select
          value={selectedCountry}
          onChange={e => { setSelectedCountry(e.target.value); setPage(1); }}
          className="w-full py-2.5 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white appearance-none cursor-pointer"
        >
          {COUNTRY_NAMES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Fourchette de prix */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Fourchette de prix</p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="number" min="0" max={priceMax} value={priceMin}
              onChange={e => { setPriceMin(Math.min(Number(e.target.value), priceMax)); setPage(1); }}
              className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
            <span className="text-xs text-gray-400">à</span>
            <input type="number" min={priceMin} max="500" value={priceMax}
              onChange={e => { setPriceMax(Math.max(Number(e.target.value), priceMin)); setPage(1); }}
              className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
            <span className="text-xs text-gray-400">€</span>
          </div>
          <input type="range" min="0" max="500" value={priceMin}
            onChange={e => { setPriceMin(Math.min(Number(e.target.value), priceMax)); setPage(1); }}
            className="w-full accent-brand-500" />
          <input type="range" min="0" max="500" value={priceMax}
            onChange={e => { setPriceMax(Math.max(Number(e.target.value), priceMin)); setPage(1); }}
            className="w-full accent-brand-500" />
        </div>
      </div>

      {/* MOQ maximum */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">MOQ maximum</p>
        <input type="number" min="0" value={maxMoq}
          onChange={e => { setMaxMoq(Number(e.target.value)); setPage(1); }}
          placeholder="Aucune limite"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
        <p className="text-xs text-gray-400 mt-1">Filtrer les produits avec un MOQ ≤ cette valeur</p>
      </div>

      {/* Certifications */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Certifications</p>
        <div className="space-y-2">
          {CERTS.map(cert => (
            <label key={cert.value} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
              <input type="checkbox" checked={selectedCerts.includes(cert.value)}
                onChange={() => toggleCert(cert.value)}
                className="w-4 h-4 rounded accent-brand-500" />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{cert.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Note minimale */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Note minimale</p>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(s => (
            <button
              key={s}
              onClick={() => { setMinRating(s === minRating ? 0 : s); setPage(1); }}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star className={`w-6 h-6 transition-colors ${s <= minRating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200 hover:text-amber-300 hover:fill-amber-300'}`} />
            </button>
          ))}
          {minRating > 0 && <span className="ml-1 text-xs text-gray-500">{minRating}+</span>}
        </div>
      </div>

      {/* Score EthiMarket minimum */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Score EthiMarket minimum</p>
        <input
          type="range" min="0" max="100" step="5" value={minScore}
          onChange={e => { setMinScore(Number(e.target.value)); setPage(1); }}
          className="w-full accent-brand-500"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-400">0</span>
          <span className="text-sm font-black text-brand-600">{minScore}+</span>
          <span className="text-xs text-gray-400">100</span>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Filtre les produits dont le score est ≥ {minScore}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Catalogue Produits Bio & Équitables | EthiMarket"
        description="Parcourez plus de 50 000 produits bio certifiés en direct des coopératives agricoles : cacao, café, épices, fruits, huiles. Prix directs sans intermédiaire."
      />
      <Header />

      {/* Page header */}
      <div className="pt-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Link to="/" className="hover:text-brand-600 transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-semibold">Catalogue</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900">Catalogue produits</h1>
              <p className="text-gray-500 mt-1">Produits bio certifiés du monde entier</p>
            </div>
            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 4).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug); setPage(1); }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    selectedCategory === cat.slug
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600 bg-white'
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-7">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <SidebarContent />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Controls bar */}
            <div className="flex items-center justify-between gap-4 mb-5 bg-white rounded-2xl border border-gray-100 px-5 py-3.5 shadow-card">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-brand-600 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtres
                  {activeFilterCount > 0 && (
                    <span className="bg-brand-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <span className="hidden lg:block text-sm text-gray-500">
                  <span className="font-bold text-gray-900">{total.toLocaleString('fr-FR')}</span> produit{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value); setPage(1); }}
                  className="py-1.5 px-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => setGridView(true)}
                    className={`p-1.5 rounded-md transition-colors ${gridView ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400 hover:text-gray-700'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setGridView(false)}
                    className={`p-1.5 rounded-md transition-colors ${!gridView ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400 hover:text-gray-700'}`}>
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {search && (
                  <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 border border-gray-200 text-xs px-3 py-1.5 rounded-full font-semibold">
                    "{search}"
                    <button onClick={() => { setSearch(''); setPage(1); }} className="hover:text-gray-900"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 text-xs px-3 py-1.5 rounded-full font-semibold">
                    {categories.find(c => c.slug === selectedCategory)?.emoji}{' '}
                    {categories.find(c => c.slug === selectedCategory)?.name}
                    <button onClick={() => { setSelectedCategory(''); setPage(1); }} className="hover:text-brand-900"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCountry !== 'Tous les pays' && (
                  <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-3 py-1.5 rounded-full font-semibold">
                    {selectedCountry}
                    <button onClick={() => { setSelectedCountry('Tous les pays'); setPage(1); }} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {(priceMin > 0 || priceMax < 500) && (
                  <span className="flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 text-xs px-3 py-1.5 rounded-full font-semibold">
                    {priceMin}€ – {priceMax}€
                    <button onClick={() => { setPriceMin(0); setPriceMax(500); setPage(1); }} className="hover:text-teal-900"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {maxMoq > 0 && (
                  <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 text-xs px-3 py-1.5 rounded-full font-semibold">
                    MOQ ≤ {maxMoq}
                    <button onClick={() => { setMaxMoq(0); setPage(1); }} className="hover:text-purple-900"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCerts.map(cert => (
                  <span key={cert} className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1.5 rounded-full font-semibold">
                    {cert}
                    <button onClick={() => toggleCert(cert)} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {minRating > 0 && (
                  <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs px-3 py-1.5 rounded-full font-semibold">
                    {minRating}+ étoiles
                    <button onClick={() => { setMinRating(0); setPage(1); }} className="hover:text-yellow-900"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {minScore > 0 && (
                  <span className="flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 text-xs px-3 py-1.5 rounded-full font-semibold">
                    Score ≥ {minScore}
                    <button onClick={() => { setMinScore(0); setPage(1); }} className="hover:text-brand-900"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Product grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(9)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length > 0 ? (
              <div className={gridView
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'flex flex-col gap-4'
              }>
                {products.map(p =>
                  gridView
                    ? <ProductCard key={p.id} product={p} />
                    : <ListRow key={p.id} product={p} />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-4xl mb-5">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-500 text-sm mb-5 max-w-xs">Essayez d'ajuster vos critères de recherche ou de supprimer certains filtres.</p>
                <button onClick={reset} className="btn-primary px-6 py-2.5">Réinitialiser les filtres</button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-10 h-10 text-sm font-semibold rounded-xl transition-all ${
                        page === p ? 'bg-brand-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-600'
                      }`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">Filtres</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

/* ─── List row view ──────────────────────────────────────── */

const CERT_BADGE: Record<string, string> = {
  Bio: 'badge-bio', Fairtrade: 'badge-fairtrade', Ecocert: 'badge-ecocert',
  'Rainforest Alliance': 'badge-rainforest', GlobalGAP: 'badge-globalgap',
};

function ListRow({ product }: { product: Product }) {
  return (
    <div className="card flex gap-4 p-4 group">
      <Link to={`/produit/${product.id}`} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl" style={{ backgroundColor: product.bg_color }}>
            {product.emoji}
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to={`/produit/${product.id}`}>
              <h3 className="font-bold text-gray-900 hover:text-brand-600 transition-colors">{product.name}</h3>
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">{product.country_flag} {product.country}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-black text-gray-900">{product.price.toFixed(2)} €<span className="text-xs text-gray-400 font-normal">/{product.price_unit}</span></div>
            <div className="text-xs text-gray-500">MOQ {product.moq_value} {product.moq_unit}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-3 h-3 ${s <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
            ))}
            <span className="text-xs text-gray-500 ml-0.5">({product.review_count})</span>
          </div>
          <div className="flex gap-1">
            {product.certifications.slice(0, 3).map(c => (
              <span key={c} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CERT_BADGE[c] ?? 'bg-gray-100 text-gray-700'}`}>{c}</span>
            ))}
          </div>
          <Link to={`/produit/${product.id}`} className="ml-auto btn-outline py-1.5 px-4 text-xs">
            Voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
