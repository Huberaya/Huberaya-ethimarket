import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, Star, CheckCircle, Shield, DollarSign,
  Globe, Handshake, Play, ChevronRight, Users, Package, TrendingUp,
  X, Calendar, Clock, Target,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import SEOHead from '../components/SEOHead';
import { supabase, type Product, type Category, type Producer, type Article } from '../lib/supabase';

/* ─── Constants ────────────────────────────────────────── */

const STATS = [
  { icon: Globe,      value: '45',      unit: 'pays',        label: 'représentés' },
  { icon: Users,      value: '12 000+', unit: 'producteurs', label: 'certifiés' },
  { icon: Package,    value: '50 000+', unit: 'produits',    label: 'référencés' },
  { icon: TrendingUp, value: '4.9/5',   unit: '',            label: 'satisfaction' },
];

const TRUST_FEATURES = [
  { icon: Shield,     title: 'Certifications vérifiées',    desc: 'Chaque producteur est audité physiquement. Bio, Fairtrade, Ecocert — tout est contrôlé.', tag: 'Sécurité' },
  { icon: DollarSign, title: 'Prix directs producteurs',    desc: 'Éliminez les 3 à 5 intermédiaires habituels. Économisez jusqu\'à 40% sur vos achats.', tag: 'Économies' },
  { icon: Globe,      title: '45 pays, livraison mondiale', desc: 'Réseau logistique certifié couvrant les 5 continents. Délais maîtrisés, assurance incluse.', tag: 'Global' },
  { icon: Handshake,  title: 'Commerce équitable garanti',  desc: 'Charte éthique contraignante. Rémunération juste des producteurs, conditions de travail dignes.', tag: 'Éthique' },
];

const POPULAR = ["Huile d'argan", 'Café éthiopien', 'Safran', 'Vanille', 'Quinoa', 'Spiruline'];

const HERO_IMG = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=80';
const VIDEO_POSTER = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80';

const VIDEO_BADGES = [
  { icon: '⏱️', text: '2 minutes pour comprendre' },
  { icon: '🎯', text: 'Notre mission expliquée' },
  { icon: '🌍', text: 'Disponible en 5 langues' },
];

const DEMARCHE_CARDS = [
  {
    emoji: '🌾',
    title: 'POUR LES PRODUCTEURS',
    subtitle: 'Reprendre le pouvoir sur son travail',
    points: ['+40% de marges en moyenne', 'Accès direct aux marchés mondiaux', 'Outils digitaux gratuits (IA, traduction)', 'Zéro intermédiaire, prix justes', 'Visibilité internationale'],
    bg: 'bg-brand-50 border-brand-200',
    iconBg: 'bg-brand-500',
    textColor: 'text-gray-900',
  },
  {
    emoji: '🏪',
    title: 'POUR LES ACHETEURS',
    subtitle: 'Sourcer bio, éthique et responsable',
    points: ['-35% sur les coûts d\'approvisionnement', 'Traçabilité totale de la ferme à l\'assiette', 'Qualité garantie et certifiée', 'Gain de temps considérable (-80%)', 'Fournisseurs vérifiés physiquement'],
    bg: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-500',
    textColor: 'text-gray-900',
  },
  {
    emoji: '👥',
    title: 'POUR LES CONSOMMATEURS FINAUX',
    subtitle: 'Consommer en conscience',
    points: ['Produits authentiques et vérifiés', 'Origine traçable en 1 clic', 'Impact positif sur les producteurs', 'Prix reflétant la vraie valeur', 'Soutien direct à l\'agriculture familiale'],
    bg: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-500',
    textColor: 'text-gray-900',
  },
  {
    emoji: '🌍',
    title: 'POUR NOTRE PLANÈTE',
    subtitle: 'Un monde plus vivable pour demain',
    points: ['-60% d\'émissions CO2 vs commerce classique', 'Biodiversité préservée', 'Sols vivants et fertiles', 'Océans protégés', 'Circuits courts optimisés'],
    bg: 'bg-brand-800 border-brand-700',
    iconBg: 'bg-brand-400',
    textColor: 'text-white',
  },
];

const IMPACT_METRICS = [
  { emoji: '🌳', value: '15 000',     label: 'arbres préservés',            color: 'text-brand-600' },
  { emoji: '💧', value: '2,3 M',      label: 'litres d\'eau économisés',    color: 'text-blue-600' },
  { emoji: '♻️', value: '60%',        label: 'de déchets plastique évités', color: 'text-teal-600' },
  { emoji: '🌱', value: '850 t',      label: 'de CO2 évitées',              color: 'text-brand-600' },
  { emoji: '🐝', value: '+45%',       label: 'plus de pollinisateurs protégés', color: 'text-amber-600' },
  { emoji: '👨‍🌾', value: '12 000+',   label: 'familles de producteurs soutenues', color: 'text-purple-600' },
];

const CARBON_COMPARISON = [
  { label: 'Commerce conventionnel',    co2: '100 kg CO₂', pct: 100, color: 'bg-red-500' },
  { label: 'Circuit court bio classique', co2: '40 kg CO₂',  pct: 40,  color: 'bg-amber-500' },
  { label: 'EthiMarket direct',          co2: '20 kg CO₂',  pct: 20,  color: 'bg-brand-500' },
];

const COMMITMENTS_2025 = [
  'Neutralité carbone sur toutes nos opérations',
  '100% emballages recyclables ou compostables',
  '50 000 producteurs certifiés référencés',
  'Programme de reforestation en Afrique et Amérique du Sud',
];

const ARTICLE_CATEGORIES: Record<string, string> = {
  'Agriculture':         'bg-brand-50 text-brand-700 border-brand-200',
  'Commerce équitable':  'bg-blue-50 text-blue-700 border-blue-200',
  'Environnement':       'bg-amber-50 text-amber-700 border-amber-200',
};

/* ─── Skeleton ──────────────────────────────────────────── */
function CardSkeleton() {
  return <div className="bg-gray-100 rounded-2xl h-72 skeleton" />;
}

/* ─── Component ─────────────────────────────────────────── */
export default function Home() {
  const [categories, setCategories]               = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts]   = useState<Product[]>([]);
  const [featuredProducers, setFeaturedProducers] = useState<Producer[]>([]);
  const [articles, setArticles]                   = useState<Article[]>([]);
  const [search, setSearch]                       = useState('');
  const [heroLoaded, setHeroLoaded]               = useState(false);
  const [videoOpen, setVideoOpen]                 = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('categories').select('*').order('product_count', { ascending: false })
      .then(({ data }) => data && setCategories(data));
    supabase.from('products').select('*, producers(*), categories(*)').eq('featured', true).limit(4)
      .then(({ data }) => data && setFeaturedProducts(data));
    supabase.from('producers').select('*').eq('verified', true).limit(3)
      .then(({ data }) => data && setFeaturedProducers(data));
    supabase.from('articles').select('*').order('published_at', { ascending: false }).limit(3)
      .then(({ data }) => data && setArticles(data));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalogue?q=${encodeURIComponent(search.trim())}`);
    else navigate('/catalogue');
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <SEOHead
        title="EthiMarket - Marketplace B2B Équitable & Traçable Afrique-Europe"
        description="Achetez en direct auprès de producteurs certifiés dans 45 pays. Cacao, café, épices, fruits secs, huiles avec traçabilité blockchain et score éthique."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'EthiMarket',
          url: 'https://ethimarket.com',
          logo: 'https://ethimarket.com/logo.png',
          description: 'Marketplace B2B équitable et traçable connectant producteurs africains et acheteurs mondiaux.',
          sameAs: [
            'https://facebook.com/ethimarket',
            'https://linkedin.com/company/ethimarket',
            'https://twitter.com/ethimarket',
          ],
        }}
      />
      <Header />

      {/* ═══ 1. HERO ═══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMG} alt="Marché bio"
            className={`w-full h-full object-cover transition-opacity duration-700 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setHeroLoaded(true)} />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/92 via-brand-950/75 to-brand-900/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 via-transparent to-transparent" />
        </div>

        <div className="absolute top-28 right-6 lg:right-16 z-20 hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-full text-white text-sm font-medium shadow-lg">
          <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></span>
          12 000+ producteurs actifs aujourd'hui
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-500/20 backdrop-blur-sm text-brand-200 text-xs font-semibold px-4 py-2 rounded-full border border-brand-400/30 mb-6">
              <CheckCircle className="w-3.5 h-3.5 text-brand-300" />
              Marketplace B2B certifiée · 45 pays · Commerce équitable
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.08] tracking-tight mb-6 text-balance">
              La marketplace{' '}
              <span className="relative inline-block">
                <span className="text-brand-400">mondiale</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 280 8" fill="none" preserveAspectRatio="none">
                  <path d="M2 6 C70 2 210 2 278 6" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>{' '}
              des produits{' '}
              <span className="text-brand-400">bio & équitables</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/75 mb-10 leading-relaxed max-w-xl">
              Connectez-vous directement aux coopératives et producteurs certifiés.
              Achetez en gros, <strong className="text-white font-semibold">sans intermédiaire</strong>, depuis 45 pays.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 bg-white rounded-2xl p-2 shadow-2xl mb-5 max-w-2xl">
              <div className="flex-1 flex items-center gap-3 px-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un produit bio : huile, café, épices..."
                  className="flex-1 text-gray-800 placeholder-gray-400 bg-transparent outline-none text-base py-1" />
              </div>
              <button type="submit"
                className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm text-sm whitespace-nowrap">
                Rechercher <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-white/50 font-medium">Tendances :</span>
              {POPULAR.map(tag => (
                <button key={tag} onClick={() => navigate(`/catalogue?q=${encodeURIComponent(tag)}`)}
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs font-medium transition-all border border-white/10 hover:border-white/30">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="text-white/40 text-xs">Défiler</span>
          <div className="w-5 h-8 border-2 border-white/20 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══ 2. STATS BAR ═══ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
            {STATS.map(({ icon: Icon, value, unit, label }) => (
              <div key={label} className="flex items-center gap-4 px-8 py-8 group">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">
                    {value} <span className="text-brand-500 text-lg font-bold">{unit}</span>
                  </div>
                  <div className="text-sm text-gray-500 capitalize">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3. CATEGORIES ═══ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Parcourir</p>
              <h2 className="text-4xl font-black text-gray-900">Toutes les catégories</h2>
              <p className="text-gray-500 mt-2 text-base">8 familles de produits bio et équitables</p>
            </div>
            <Link to="/catalogue" className="hidden sm:flex items-center gap-1.5 text-brand-600 font-semibold text-sm hover:gap-2.5 transition-all">
              Voir tout le catalogue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.length > 0
              ? categories.map(cat => (
                  <Link key={cat.id} to={`/catalogue?category=${cat.slug}`}
                    className="group relative rounded-2xl overflow-hidden aspect-square shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 bg-brand-100 flex items-center justify-center text-5xl">{cat.emoji}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="text-2xl mb-1">{cat.emoji}</div>
                      <h3 className="font-bold text-white text-sm leading-tight">{cat.name}</h3>
                      <p className="text-white/60 text-xs mt-0.5">{cat.product_count.toLocaleString('fr-FR')} produits</p>
                    </div>
                    <div className="absolute top-3 right-3 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </Link>
                ))
              : [...Array(8)].map((_, i) => <div key={i} className="rounded-2xl aspect-square skeleton" />)
            }
          </div>
        </div>
      </section>

      {/* ═══ 4. FEATURED PRODUCTS ═══ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Sélection EthiMarket</p>
              <h2 className="text-4xl font-black text-gray-900">Produits vedettes</h2>
              <p className="text-gray-500 mt-2">Les meilleurs produits certifiés du moment</p>
            </div>
            <Link to="/catalogue" className="hidden sm:flex items-center gap-1.5 text-brand-600 font-semibold text-sm hover:gap-2.5 transition-all">
              Tout le catalogue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.length > 0
              ? featuredProducts.map(p => <ProductCard key={p.id} product={p} />)
              : [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
            }
          </div>
          <div className="mt-10 text-center">
            <Link to="/catalogue" className="btn-primary px-8 py-3.5 text-base shadow-md hover:shadow-lg">
              Explorer les 50 000+ produits <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 5. VIDÉO DE PRÉSENTATION ═══ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">En vidéo</p>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Découvrez EthiMarket en 2 minutes</h2>
            <p className="text-gray-500 text-lg">Comment nous révolutionnons le commerce bio et équitable mondial</p>
          </div>

          <button onClick={() => setVideoOpen(true)}
            className="group relative w-full rounded-3xl overflow-hidden shadow-2xl block"
            style={{ aspectRatio: '16 / 9' }}>
            <img src={VIDEO_POSTER} alt="Vidéo de présentation EthiMarket"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/30 to-brand-950/20" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 text-brand-600 fill-brand-600 ml-1" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30 mb-3">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Vidéo · 2 min 14
              </div>
              <h3 className="text-white text-xl sm:text-2xl font-black mb-1">Le commerce équitable, simplement</h3>
              <p className="text-white/60 text-sm">Suivez le parcours d'une huile d'argan du Maroc jusqu'à un magasin bio à Paris.</p>
            </div>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {VIDEO_BADGES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-card">
                <span className="text-2xl">{icon}</span>
                <span className="font-semibold text-gray-900 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 6. NOTRE DÉMARCHE ═══ */}
      <section id="comment-ca-marche" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-3">Notre mission</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Notre démarche</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Pourquoi EthiMarket existe et comment nous transformons le commerce mondial
            </p>
          </div>

          {/* Manifeste */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-brand-50 border-2 border-brand-100 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-40 h-40 bg-brand-200/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-brand-200/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="text-5xl text-brand-300 mb-6 font-serif">❝</div>
                <p className="text-lg sm:text-xl text-gray-800 leading-relaxed font-medium mb-6">
                  Le commerce mondial actuel appauvrit les producteurs, pollue notre planète et déshumanise les échanges commerciaux.
                </p>
                <p className="text-lg sm:text-xl text-gray-800 leading-relaxed font-medium mb-6">
                  EthiMarket redonne le pouvoir aux producteurs bio, assure une juste rémunération, réduit l'empreinte carbone et rebâtit la confiance entre tous les acteurs du commerce responsable.
                </p>
                <p className="text-lg sm:text-xl text-brand-700 leading-relaxed font-bold">
                  Nous croyons profondément qu'un monde meilleur commence par des échanges plus justes et plus transparents.
                </p>
              </div>
            </div>
          </div>

          {/* 4 cartes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {DEMARCHE_CARDS.map(card => (
              <div key={card.title} className={`rounded-3xl border-2 p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${card.bg}`}>
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${card.iconBg}`}>
                    {card.emoji}
                  </div>
                  <div>
                    <h3 className={`font-black text-lg leading-tight ${card.textColor}`}>{card.title}</h3>
                    <p className={`text-sm font-medium ${card.textColor === 'text-white' ? 'text-white/70' : 'text-gray-500'}`}>
                      {card.subtitle}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {card.points.map(point => (
                    <li key={point} className={`flex items-start gap-2.5 text-sm ${card.textColor === 'text-white' ? 'text-white/90' : 'text-gray-700'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${card.textColor === 'text-white' ? 'text-brand-300' : 'text-brand-600'}`} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bandeau final */}
          <div className="rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500 p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight text-balance">
                Ensemble, construisons le monde de demain :<br className="hidden sm:block" /> plus juste, plus vert, plus humain.
              </h3>
              <Link to="/inscription" className="inline-flex items-center gap-2 mt-6 px-8 py-3.5 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-lg text-sm">
                Rejoindre le mouvement <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 7. PRODUCERS VERIFIED ═══ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Confiance & transparence</p>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Producteurs vérifiés</h2>
            <p className="text-gray-500 text-lg">Audités sur place, certifications contrôlées, engagement éthique signé.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {featuredProducers.length > 0
              ? featuredProducers.map(producer => (
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
                ))
              : [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-56 skeleton" />)
            }
          </div>
          <div className="text-center">
            <Link to="/catalogue" className="btn-outline px-8 py-3.5 text-base">
              Découvrir tous les producteurs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 8. IMPACT ENVIRONNEMENTAL ═══ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Impact mesuré</p>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Notre impact environnemental</h2>
            <p className="text-gray-500 text-lg">Des chiffres réels, vérifiés, actualisés chaque mois</p>
          </div>

          {/* 6 stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {IMPACT_METRICS.map(({ emoji, value, label, color }) => (
              <div key={label} className="bg-white rounded-3xl border-2 border-gray-100 hover:border-brand-300 p-7 text-center shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{emoji}</div>
                <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
                <div className="text-sm text-gray-500 leading-tight">{label}</div>
              </div>
            ))}
          </div>

          {/* Graphique empreinte carbone */}
          <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 mb-16">
            <h3 className="font-black text-gray-900 text-xl mb-8 text-center">Empreinte carbone comparée</h3>
            <div className="space-y-6 max-w-2xl mx-auto">
              {CARBON_COMPARISON.map(({ label, co2, pct, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <span className="text-sm font-black text-gray-900">{co2}</span>
                  </div>
                  <div className="h-8 bg-white rounded-xl overflow-hidden border border-gray-200">
                    <div className={`h-full ${color} rounded-xl flex items-center justify-end pr-3 transition-all duration-1000`}
                      style={{ width: `${pct}%` }}>
                      <span className="text-white text-xs font-bold">{pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">Moyenne par tonne de produit livré</p>
          </div>

          {/* Engagements 2025 */}
          <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-600 p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-8">
                <Target className="w-6 h-6 text-white" />
                <h3 className="text-2xl font-black text-white">Nos engagements 2025</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 max-w-3xl mx-auto">
                {COMMITMENTS_2025.map(commitment => (
                  <div key={commitment} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-brand-300" />
                    </div>
                    <span className="text-white/90 text-sm font-medium leading-relaxed">{commitment}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 9. WHY ETHIMARKET ═══ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Nos engagements</p>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Pourquoi EthiMarket ?</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Une plateforme conçue pour les professionnels exigeants qui veulent sourcer mieux.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_FEATURES.map(({ icon: Icon, title, desc, tag }) => (
              <div key={title} className="group relative p-7 rounded-3xl border border-gray-100 bg-white hover:border-brand-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-3xl" />
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-5">{tag}</div>
                <div className="w-11 h-11 bg-brand-50 group-hover:bg-brand-100 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2.5 leading-tight">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 10. TESTIMONIAL ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-500 to-teal-500" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-6">❝</div>
          <blockquote className="text-2xl sm:text-3xl font-bold text-white leading-relaxed mb-8 text-balance">
            "Grâce à EthiMarket, nous avons réduit nos coûts d'approvisionnement de 35% tout en améliorant la traçabilité de nos produits."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">MV</div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">Marie Valentin</p>
              <p className="text-white/60 text-xs">Directrice achats, Bio Planet (500 magasins)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 11. BLOG / ARTICLES ═══ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Actualités</p>
              <h2 className="text-4xl font-black text-gray-900">Le magazine EthiMarket</h2>
              <p className="text-gray-500 mt-2 text-base">Actualités du bio, conseils d'experts, histoires de producteurs</p>
            </div>
            <a href="#" className="hidden sm:flex items-center gap-1.5 text-brand-600 font-semibold text-sm hover:gap-2.5 transition-all">
              Tous les articles <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map(article => (
                <a key={article.id} href="#"
                  className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                  <div className="relative overflow-hidden" style={{ height: '200px' }}>
                    {article.image_url ? (
                      <img src={article.image_url} alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 bg-brand-100 flex items-center justify-center text-4xl">📄</div>
                    )}
                    <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-full border backdrop-blur-sm ${ARTICLE_CATEGORIES[article.category] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {article.category.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.read_time} min
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">{article.excerpt}</p>
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1 text-xs text-brand-600 font-bold group-hover:gap-2 transition-all">
                        Lire l'article <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-96 skeleton" />)}
            </div>
          )}

          <div className="mt-10 text-center">
            <a href="#" className="btn-primary px-8 py-3.5 text-base shadow-md hover:shadow-lg">
              Découvrir tous les articles <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ 12. CTA FINAL ═══ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-4">Rejoignez-nous</p>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-5 text-balance">
            Prêt à transformer votre approvisionnement ?
          </h2>
          <p className="text-xl text-gray-500 mb-10 max-w-lg mx-auto">
            Que vous soyez producteur ou acheteur professionnel, créez votre compte en 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/inscription" className="btn-primary px-8 py-4 text-base shadow-lg hover:shadow-brand-500/25">
              Créer mon compte gratuit <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/catalogue" className="btn-outline px-8 py-4 text-base">
              Explorer le catalogue
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            Gratuit · Sans carte bancaire · Accès immédiat à 50 000+ produits
          </p>
        </div>
      </section>

      {/* ── Video modal ── */}
      {videoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-up"
          onClick={() => setVideoOpen(false)}>
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()} style={{ aspectRatio: '16 / 9' }}>
            <button onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <img src={VIDEO_POSTER} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                </div>
                <p className="text-white font-bold text-lg mb-1">Vidéo de présentation EthiMarket</p>
                <p className="text-white/50 text-sm">2 min 14 · Le parcours d'un produit équitable</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
