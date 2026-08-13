import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Star, CheckCircle, Package, Zap, ArrowLeft, MessageSquare,
  MapPin, Calendar, Users, Award, ArrowRight, Share2, Loader2,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { LeafletMap } from '../components/LeafletMap';
import { supabase, type Producer, type Product } from '../lib/supabase';
import ScoreBadge from '../components/ScoreBadge';

function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16">
        <div className="h-64 bg-gray-200 skeleton" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-8">
            <div className="flex gap-5">
              <div className="w-20 h-20 bg-gray-200 rounded-2xl skeleton" />
              <div className="flex-1 space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className={`h-4 bg-gray-200 skeleton rounded-lg ${i === 0 ? 'w-1/2' : i === 2 ? 'w-3/4' : 'w-full'}`} />)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-gray-200 rounded-2xl skeleton" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProducerShop() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [producer, setProducer] = useState<Producer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'produits' | 'apropos'>('produits');
  const [contacting, setContacting] = useState(false);

  const handleContactProducer = async () => {
    if (!user) {
      navigate(`/connexion?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    const recipientUserId = producer?.user_id;
    if (!recipientUserId) {
      alert("Le profil de ce producteur n'est pas encore configuré pour la messagerie directe.");
      return;
    }

    if (user.id === recipientUserId) {
      alert("Il s'agit de votre propre boutique.");
      return;
    }

    setContacting(true);

    try {
      const { data: existingConvs } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${recipientUserId}),and(participant_1.eq.${recipientUserId},participant_2.eq.${user.id})`);

      if (existingConvs && existingConvs.length > 0) {
        navigate(`/dashboard/messages?conversation=${existingConvs[0].id}`);
        return;
      }

      const { data: newConv, error: createErr } = await supabase
        .from('conversations')
        .insert({
          participant_1: user.id,
          participant_2: recipientUserId,
          last_message: `Prise de contact depuis la boutique : ${producer?.name}`,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createErr || !newConv) {
        throw createErr || new Error('Erreur de création de la conversation');
      }

      navigate(`/dashboard/messages?conversation=${newConv.id}`);
    } catch (err) {
      console.error('Contact producer error:', err);
      alert('Impossible d\'ouvrir la conversation avec le producteur.');
    } finally {
      setContacting(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('producers').select('*').eq('slug', id).maybeSingle(),
      supabase.from('products').select('*, producers(*), categories(*)').eq('producers.slug', id),
    ]).then(([{ data: prod }, { data: prods }]) => {
      if (prod)  setProducer(prod);
      if (prods) setProducts(prods);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Skeleton />;

  if (!producer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Boutique introuvable</h2>
          <Link to="/catalogue" className="btn-primary px-6 py-2.5">Retour au catalogue</Link>
        </div>
      </div>
    );
  }

  const heroImage = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=60';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16">
        {/* ── Banner ── */}
        <div className="relative h-64 sm:h-80 overflow-hidden">
          <img
            src={heroImage}
            alt={producer.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ backgroundColor: `${producer.banner_color}CC` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          <div className="relative z-10 flex items-start justify-between p-6 max-w-7xl mx-auto h-full">
            <Link to="/catalogue"
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl mt-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
            <button className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl mt-2">
              <Share2 className="w-4 h-4" /> Partager
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Producer info card ── */}
          <div className="relative -mt-14 mb-8 z-10">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Avatar */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg border-4 border-white ring-2 ring-gray-100"
                  style={{ backgroundColor: producer.avatar_color }}
                >
                  {producer.avatar_initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{producer.name}</h1>
                    {producer.verified && (
                      <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1 rounded-full border border-brand-200">
                        <CheckCircle className="w-3.5 h-3.5" /> Vérifié
                      </span>
                    )}
                    {producer.top_seller && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                        🏆 Top vendeur
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {producer.country_flag} {producer.country}
                    </span>
                    {producer.founded_year && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Fondée en {producer.founded_year}
                      </span>
                    )}
                    {producer.employee_count && (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {producer.employee_count} employés
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                      {producer.product_count} produits
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(producer.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{producer.rating}</span>
                    <span className="text-sm text-gray-400">({producer.review_count} avis clients)</span>
                  </div>

                  {/* Score EthiMarket */}
                  {producer.ethimarket_score > 0 && (
                    <div className="mb-5">
                      <ScoreBadge score={producer.ethimarket_score} badge={producer.badge_level} details={producer.score_details} size="lg" />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleContactProducer}
                      disabled={contacting}
                      className="btn-primary py-2.5 px-5 text-sm inline-flex items-center gap-2"
                    >
                      {contacting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                      {contacting ? 'Ouverture...' : '💬 Contacter'}
                    </button>
                    <Link to="/catalogue" className="btn-outline py-2.5 px-5 text-sm">
                      Voir le catalogue <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Stats bar */}
              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 mt-6 pt-6">
                {[
                  { icon: Package,    value: producer.order_count.toString(),        label: 'Commandes',    color: 'text-brand-600 bg-brand-50' },
                  { icon: CheckCircle, value: `${producer.satisfaction_rate}%`,      label: 'Satisfaction', color: 'text-teal-600 bg-teal-50' },
                  { icon: Zap,        value: `< ${producer.response_time}`,          label: 'Réponse',      color: 'text-amber-600 bg-amber-50' },
                ].map(({ icon: Icon, value, label, color }) => (
                  <div key={label} className="text-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-lg font-black text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Certifications ── */}
          {producer.certifications.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              {producer.certifications.map(cert => (
                <span key={cert}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-xl font-semibold shadow-card hover:border-brand-300 transition-colors">
                  <Award className="w-4 h-4 text-brand-500" />
                  {cert}
                </span>
              ))}
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="border-b border-gray-200 mb-8">
            <div className="flex">
              {([
                { id: 'produits', label: `Produits (${products.length})` },
                { id: 'apropos',  label: 'À propos' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-7 py-3.5 text-sm font-bold border-b-2 transition-all -mb-px ${
                    tab === t.id
                      ? 'border-brand-500 text-brand-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Products tab ── */}
          {tab === 'produits' && (
            <div className="pb-20">
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
                  <Package className="w-12 h-12 text-gray-200 mb-4" />
                  <h3 className="font-bold text-gray-700 mb-2">Aucun produit publié</h3>
                  <p className="text-gray-400 text-sm max-w-xs">Ce producteur n'a pas encore ajouté de produits à son catalogue.</p>
                </div>
              )}
            </div>
          )}

          {/* ── About tab ── */}
          {tab === 'apropos' && (
            <div className="pb-20 max-w-3xl">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-8">
                {/* Hero image */}
                <div className="relative h-48 rounded-2xl overflow-hidden mb-7">
                  <img
                    src={`https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=60`}
                    alt="Champs"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-black text-xl">{producer.name}</p>
                    <p className="text-white/70 text-sm">{producer.country_flag} {producer.country}</p>
                  </div>
                </div>

                <h2 className="font-black text-gray-900 text-xl mb-4">Notre histoire</h2>
                <p className="text-gray-600 leading-relaxed mb-7">
                  {producer.description ??
                    `${producer.name} est une coopérative engagée dans la production durable et équitable${producer.founded_year ? ` depuis ${producer.founded_year}` : ''}. Nous travaillons en direct avec les communautés locales pour garantir une rémunération juste et des pratiques agricoles respectueuses de l'environnement et de la biodiversité.`
                  }
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ['Pays', `${producer.country_flag} ${producer.country}`],
                    ['Fondée en', producer.founded_year?.toString() ?? 'N/A'],
                    ['Employés', producer.employee_count ? `${producer.employee_count}+` : 'N/A'],
                    ['Produits', `${producer.product_count}`],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                      <dt className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1.5">{k}</dt>
                      <dd className="font-black text-gray-900 text-sm">{v}</dd>
                    </div>
                  ))}
                </div>

                {/* Map if coordinates exist */}
                {producer.latitude != null && producer.longitude != null && (
                  <div className="mt-6">
                    <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-500" />
                      Localisation
                    </h3>
                    <LeafletMap
                      markers={[{ lat: producer.latitude, lng: producer.longitude, popupHtml: `<b>${producer.name}</b><br/>${producer.country_flag} ${producer.country}` }]}
                      height="250px"
                      zoom={10}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
