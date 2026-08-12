import { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowRight, ArrowUpRight, Mail } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase, type Article } from '../lib/supabase';

const CATEGORIES = ['Tous', 'Agriculture', 'Commerce équitable', 'Environnement', 'Portraits', 'Guides pratiques'];

const CATEGORY_COLORS: Record<string, string> = {
  'Agriculture':         'bg-brand-50 text-brand-700 border-brand-200',
  'Commerce équitable':  'bg-blue-50 text-blue-700 border-blue-200',
  'Environnement':       'bg-amber-50 text-amber-700 border-amber-200',
  'Portraits':           'bg-purple-50 text-purple-700 border-purple-200',
  'Guides pratiques':    'bg-teal-50 text-teal-700 border-teal-200',
};

export default function Blog() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    supabase.from('articles').select('*').order('published_at', { ascending: false })
      .then(({ data }) => data && setArticles(data));
  }, []);

  const filtered = activeCategory === 'Tous'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const featured = filtered.find(a => a.featured) ?? filtered[0];
  const rest = filtered.filter(a => a.id !== featured?.id);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* HERO */}
      <section className="pt-32 pb-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-3">Actualités</p>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Le magazine EthiMarket</h1>
          <p className="text-lg text-gray-500">Actualités du bio, portraits de producteurs, guides pratiques</p>
        </div>
      </section>

      {/* FILTRES */}
      <section className="py-6 bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ARTICLE VEDETTE */}
      {featured && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <a href="#" className="group block rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative overflow-hidden" style={{ minHeight: '320px' }}>
                  {featured.image_url && (
                    <img src={featured.image_url} alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <span className={`inline-block self-start text-xs font-bold px-3 py-1.5 rounded-full border mb-4 ${CATEGORY_COLORS[featured.category] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {featured.category.toUpperCase()}
                  </span>
                  <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-4 group-hover:text-brand-600 transition-colors leading-tight">
                    {featured.title}
                  </h2>
                  <p className="text-gray-500 leading-relaxed mb-6">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(featured.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featured.read_time} min de lecture
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-brand-600 font-bold text-sm group-hover:gap-2.5 transition-all">
                    Lire l'article <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* GRILLE ARTICLES */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {rest.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(article => (
                <a key={article.id} href="#"
                  className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative overflow-hidden" style={{ height: '200px' }}>
                    {article.image_url ? (
                      <img src={article.image_url} alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 bg-brand-100 flex items-center justify-center text-4xl">📄</div>
                    )}
                    <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-full border backdrop-blur-sm ${CATEGORY_COLORS[article.category] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {article.category.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{article.excerpt}</p>
                    <div className="mt-auto flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.read_time} min
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-brand-600 font-bold group-hover:gap-1.5 transition-all">
                        Lire <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-80 skeleton" />)}
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex items-center justify-center gap-2 mt-12">
            <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-300 transition-colors text-sm">‹</button>
            {[1, 2, 3].map(p => (
              <button key={p} className={`w-10 h-10 rounded-full font-semibold text-sm transition-all ${p === 1 ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>{p}</button>
            ))}
            <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-300 transition-colors text-sm">›</button>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-teal-500">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-3xl font-black text-white mb-3">Recevez notre magazine chaque semaine</h2>
          <p className="text-white/70 mb-8">Guides, portraits d'inspiration et tendances du bio directement dans votre boîte mail.</p>
          {subscribed ? (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white font-semibold">
              Merci ! Vous êtes bien inscrit à notre newsletter.
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                className="flex-1 px-4 py-3.5 rounded-xl bg-white/95 outline-none text-gray-800 placeholder-gray-400 text-sm"
                required
              />
              <button type="submit" className="px-6 py-3.5 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors text-sm whitespace-nowrap inline-flex items-center gap-2 justify-center">
                <Mail className="w-4 h-4" /> S'inscrire
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
