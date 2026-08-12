import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, CheckCircle, ArrowRight, Search, Map as MapIcon, LayoutGrid } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { LeafletMap } from '../components/LeafletMap';
import { supabase, type Producer } from '../lib/supabase';
import { COUNTRIES } from '../lib/countries';

export default function Producers() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [countryFilter, setCountryFilter] = useState('Tous les pays');

  useEffect(() => {
    supabase.from('producers').select('*').order('rating', { ascending: false })
      .then(({ data }) => {
        if (data) setProducers(data);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => producers.filter(p => {
    if (countryFilter !== 'Tous les pays' && p.country !== countryFilter) return false;
    return p.name.toLowerCase().includes(search.toLowerCase()) ||
           p.country.toLowerCase().includes(search.toLowerCase());
  }), [producers, search, countryFilter]);

  const mapMarkers = useMemo(() => filtered
    .filter(p => p.latitude != null && p.longitude != null)
    .map(p => ({
      lat: p.latitude!,
      lng: p.longitude!,
      popupHtml: `
        <div style="min-width: 180px;">
          <div style="font-weight: 700; margin-bottom: 4px; color: #1f2937;">${p.name}</div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">${p.country_flag} ${p.country}</div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${p.product_count} produits · ⭐ ${p.rating}</div>
          <a href="/boutique/${p.slug}" style="display: inline-block; padding: 6px 12px; background: #15803d; color: white; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none;">Voir la boutique</a>
        </div>
      `,
    })), [filtered]);

  const countriesWithProducers = useMemo(() => {
    const set = new Set(producers.map(p => p.country));
    return ['Tous les pays', ...COUNTRIES.filter(c => set.has(c.name)).map(c => c.name)];
  }, [producers]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* HERO */}
      <section className="pt-32 pb-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-3">Communauté</p>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Producteurs certifiés</h1>
          <p className="text-lg text-gray-500">Découvrez les coopératives et producteurs vérifiés d'EthiMarket</p>
        </div>
      </section>

      {/* CONTROLS */}
      <section className="py-4 bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex-1">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un producteur ou un pays..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
            />
          </div>
          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="py-3 px-4 text-sm border border-gray-200 rounded-xl bg-white outline-none cursor-pointer"
          >
            {countriesWithProducers.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button onClick={() => setView('grid')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'grid' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400'}`}>
              <LayoutGrid className="w-4 h-4" /> Grille
            </button>
            <button onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'map' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400'}`}>
              <MapIcon className="w-4 h-4" /> Carte
            </button>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-12 bg-gray-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-56 skeleton" />)}
            </div>
          ) : view === 'map' ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">{mapMarkers.length} producteur{mapMarkers.length > 1 ? 's' : ''} géolocalisé{mapMarkers.length > 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-400">Cliquez sur un marqueur pour voir le producteur</p>
              </div>
              {mapMarkers.length > 0 ? (
                <LeafletMap markers={mapMarkers} height="600px" zoom={2} />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <MapIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">Aucun producteur géolocalisé</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">Les producteurs qui ont renseigné leurs coordonnées GPS apparaîtront sur cette carte.</p>
                </div>
              )}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-6">{filtered.length} producteur{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(producer => (
                  <Link key={producer.id} to={`/boutique/${producer.slug}`} className="card p-6 group">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md"
                        style={{ backgroundColor: producer.avatar_color }}>
                        {producer.avatar_initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{producer.name}</h3>
                          {producer.verified && <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />}
                          {producer.top_seller && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">TOP</span>}
                        </div>
                        <p className="text-xs text-gray-500">{producer.country_flag} {producer.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-4">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(producer.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-gray-800">{producer.rating}</span>
                      <span className="text-xs text-gray-400">({producer.review_count} avis)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {producer.certifications.slice(0, 3).map(c => (
                        <span key={c} className="text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-100">{c}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-4">
                      <span className="font-medium">{producer.product_count} produits</span>
                      <span className="flex items-center gap-1 text-brand-600 font-semibold group-hover:gap-1.5 transition-all">
                        Voir la boutique <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Aucun producteur trouvé pour "{search}"</p>
              <button onClick={() => { setSearch(''); setCountryFilter('Tous les pays'); }} className="mt-4 text-brand-600 font-semibold text-sm hover:underline">Réinitialiser la recherche</button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
