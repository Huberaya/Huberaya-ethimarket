import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, Heart, Minus, Plus, ChevronRight, CheckCircle,
  Package, MapPin, Clock, Truck, Award,
  QrCode, ZoomIn, MessageSquare, Loader2
} from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';
import QRCode from 'qrcode';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase, type Product, type Producer, type Review } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import GuaranteesSection from '../components/product/GuaranteesSection';
import TraceabilitySection from '../components/product/TraceabilitySection';
import ProducerProfileSection from '../components/product/ProducerProfileSection';
import ImpactSection from '../components/product/ImpactSection';
import TechnicalDetailsSection from '../components/product/TechnicalDetailsSection';
import DeliverySection from '../components/product/DeliverySection';
import ReviewsSection from '../components/product/ReviewsSection';
import FAQSection from '../components/product/FAQSection';
import StickyActions from '../components/product/StickyActions';

const CERT_BADGE: Record<string, string> = {
  Bio: 'badge-bio', Fairtrade: 'badge-fairtrade', Ecocert: 'badge-ecocert',
  'Rainforest Alliance': 'badge-rainforest', GlobalGAP: 'badge-globalgap',
};

function Skeleton() {
  return (
    <div className="bg-gray-50 pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-14">
        <div className="space-y-3">
          <div className="bg-gray-200 rounded-3xl h-96 skeleton" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 rounded-xl h-20 skeleton" />)}
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => <div key={i} className={`bg-gray-200 rounded-xl skeleton ${i === 0 ? 'h-8 w-1/2' : i === 1 ? 'h-12 w-3/4' : 'h-6'}`} />)}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [contacting, setContacting] = useState(false);

  const handleContactSeller = async () => {
    if (!user) {
      navigate('/connexion');
      return;
    }

    const producer = (product as Product & { producers?: Producer }).producers;
    const sellerUserId = producer?.user_id;

    if (!sellerUserId) {
      alert('Producteur indisponible pour la messagerie.');
      return;
    }

    if (sellerUserId === user.id) {
      alert('Vous êtes le propriétaire de ce produit !');
      return;
    }

    setContacting(true);

    try {
      // Find existing conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${sellerUserId}),and(participant_1.eq.${sellerUserId},participant_2.eq.${user.id})`)
        .maybeSingle();

      if (existing?.id) {
        navigate(`/dashboard/messages?id=${existing.id}`);
        return;
      }

      // Create conversation
      const initialText = `Bonjour, je suis intéressé(e) par votre produit : ${product?.name}.`;
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          participant_1: user.id,
          participant_2: sellerUserId,
          last_message: initialText,
          last_message_at: new Date().toISOString(),
          unread_count_2: 1,
        })
        .select('id')
        .single();

      if (newConv?.id) {
        await supabase.from('messages').insert({
          conversation_id: newConv.id,
          sender_id: user.id,
          content: initialText,
          type: 'text',
        });

        navigate(`/dashboard/messages?id=${newConv.id}`);
      } else {
        console.error('Error creating conversation:', convErr);
        alert('Impossible de créer la conversation.');
      }
    } catch (err) {
      console.error('Error contacting seller:', err);
    } finally {
      setContacting(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('products').select('*, producers(*), categories(*)').eq('id', id).maybeSingle(),
      supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false }),
    ]).then(([{ data: prod }, { data: rev }]) => {
      if (prod) { setProduct(prod as Product & { producers?: Producer }); setQty((prod as Product).moq_value); }
      if (rev) setReviews(rev as Review[]);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!product) return;
    QRCode.toDataURL(`${window.location.origin}/produit/${product.id}`, { width: 160, margin: 1, color: { dark: '#15803d' } })
      .then(setQrUrl).catch(() => {});
  }, [product]);

  if (loading) return <Skeleton />;

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Produit introuvable</h2>
          <Link to="/catalogue" className="text-brand-600 hover:underline font-medium">Retour au catalogue</Link>
        </div>
      </div>
    );
  }

  const producer = (product as Product & { producers?: Producer }).producers ?? null;

  // Build gallery (reuse image if only one available)
  const baseImage = product.image_url && !imgError ? product.image_url : null;
  const gallery = baseImage ? [baseImage, baseImage, baseImage, baseImage, baseImage] : null;

  const priceTiers = [
    { range: `${product.moq_value}–${product.moq_value * 5 - 1} ${product.moq_unit}`, price: product.price, eco: null },
    { range: `${product.moq_value * 5}–${product.moq_value * 25 - 1} ${product.moq_unit}`, price: +(product.price * 0.89).toFixed(2), eco: '-11%' },
    { range: `${product.moq_value * 25}+ ${product.moq_unit}`, price: +(product.price * 0.79).toFixed(2), eco: '-21%' },
    { range: `${product.moq_value * 50}+ ${product.moq_unit}`, price: null, eco: 'Sur devis' },
  ];

  // EthiMarket score from database (computed by scoring system)
  const ethiScore = producer?.ethimarket_score ?? 0;
  const producerBadge = producer?.badge_level ?? null;
  const scoreDetails = producer?.score_details ?? null;

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0">
      <Header />

      {/* Breadcrumb */}
      <div className="pt-16 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs text-gray-400 overflow-hidden">
            <Link to="/" className="hover:text-brand-600 transition-colors whitespace-nowrap">Accueil</Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <Link to="/catalogue" className="hover:text-brand-600 transition-colors whitespace-nowrap">Catalogue</Link>
            {product.categories && (
              <>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                <Link to={`/catalogue?category=${product.categories.slug}`} className="hover:text-brand-600 transition-colors whitespace-nowrap">
                  {product.categories.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <span className="text-gray-700 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── HEADER: Gallery + Main info ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mb-10">
          {/* Gallery */}
          <div>
            <div
              className="relative rounded-3xl overflow-hidden mb-3 bg-gray-100 group cursor-zoom-in"
              style={{ height: '440px' }}
              onClick={() => setZoom(true)}
            >
              {gallery ? (
                <img src={gallery[activeImg]} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={() => setImgError(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-9xl" style={{ backgroundColor: product.bg_color }}>{product.emoji}</div>
              )}
              {/* Cert overlay */}
              {product.certifications.length > 0 && (
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.certifications.slice(0, 3).map(cert => (
                    <span key={cert} className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm ${CERT_BADGE[cert] ?? 'bg-gray-100 text-gray-700'}`}>{cert}</span>
                  ))}
                </div>
              )}
              {product.top_seller && (
                <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1.5 rounded-full shadow-md">TOP VENDEUR</div>
              )}
              {/* Zoom hint */}
              <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3.5 h-3.5" /> Agrandir
              </div>
            </div>
            {/* Thumbnails */}
            <div className="grid grid-cols-5 gap-2">
              {(gallery ?? [null, null, null, null, null]).map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-brand-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                  style={{ height: '72px' }}>
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl" style={{ backgroundColor: product.bg_color }}>{product.emoji}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            {/* Producer link */}
            {producer && (
              <Link to={`/boutique/${producer.slug}`} className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-semibold mb-3 hover:underline">
                <Award className="w-4 h-4" /> {producer.name}
              </Link>
            )}

            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>

            {/* Origin + Rating */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-gray-400" /> {product.country_flag} {product.country}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">{product.rating}</span>
                <span className="text-sm text-gray-400">({product.review_count} avis)</span>
              </div>
            </div>

            {/* Cert badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              {product.certifications.map(cert => (
                <span key={cert} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${CERT_BADGE[cert] ?? 'bg-gray-100 text-gray-700'}`}>
                  <CheckCircle className="w-3 h-3" /> {cert}
                </span>
              ))}
            </div>

            {/* EthiMarket score */}
            <div className="mb-5">
              <ScoreBadge score={ethiScore} badge={producerBadge} details={scoreDetails} size="lg" />
            </div>

            {/* Price */}
            <div className="mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gray-900">{product.price.toFixed(2)} €</span>
                <span className="text-lg text-gray-400 font-medium">/{product.price_unit}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Prix dégressifs disponibles selon volume</p>
            </div>

            {/* Price tiers */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 mb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Quantité</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Prix</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Économie</th>
                  </tr>
                </thead>
                <tbody>
                  {priceTiers.map((tier, i) => (
                    <tr key={i} className={`border-b border-gray-100 last:border-0 ${i === 0 ? 'bg-brand-50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="py-3 px-4 text-gray-700 font-medium text-xs">{tier.range}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{tier.price !== null ? `${tier.price.toFixed(2)} €/${product.price_unit}` : '—'}</td>
                      <td className="py-3 px-4">
                        {tier.eco === 'Sur devis' ? <span className="text-brand-600 font-bold text-xs">Sur devis</span>
                          : tier.eco ? <span className="text-brand-600 font-bold text-xs bg-brand-50 px-2 py-0.5 rounded-full">{tier.eco}</span>
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">Quantité</span>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(product.moq_value, q - 1))} className="px-3.5 py-2.5 hover:bg-gray-100 transition-colors text-gray-600"><Minus className="w-4 h-4" /></button>
                <input type="number" value={qty} min={product.moq_value} onChange={e => setQty(Math.max(product.moq_value, parseInt(e.target.value) || product.moq_value))} className="w-16 text-center text-sm font-bold py-2.5 bg-transparent border-x border-gray-200 outline-none" />
                <button onClick={() => setQty(q => q + 1)} className="px-3.5 py-2.5 hover:bg-gray-100 transition-colors text-gray-600"><Plus className="w-4 h-4" /></button>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-lg font-medium">MOQ min. {product.moq_value} {product.moq_unit}</span>
            </div>

            {/* Stock info */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: Package, label: 'Stock', value: `${product.stock_value.toLocaleString('fr-FR')} ${product.stock_unit}`, color: 'text-brand-600' },
                { icon: Clock, label: 'Livraison', value: `${product.delivery_days} jours`, color: 'text-blue-600' },
                { icon: Truck, label: 'Capacité', value: `${product.monthly_capacity.toLocaleString('fr-FR')} ${product.stock_unit}/mois`, color: 'text-purple-600' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Main CTA */}
            <div className="flex gap-3 mb-3">
              <button className="btn-primary flex-1 py-3.5 text-base inline-flex items-center justify-center gap-2">
                Commander maintenant
              </button>
              <button
                onClick={handleContactSeller}
                disabled={contacting}
                className="btn-outline flex-1 py-3.5 text-base inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {contacting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                💬 Contacter le vendeur
              </button>
            </div>
            <button onClick={() => setFavorited(f => !f)} className={`flex items-center gap-2 text-sm font-semibold w-full justify-center py-2.5 rounded-xl transition-all border-2 ${favorited ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-400 hover:bg-red-50'}`}>
              <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500' : ''}`} /> {favorited ? 'Retiré des favoris' : 'Ajouter aux favoris'}
            </button>

            {/* QR Code */}
            {qrUrl && (
              <div className="mt-5 flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <img src={qrUrl} alt="QR Code" className="w-14 h-14 rounded-lg border border-gray-100" />
                <div>
                  <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-brand-500" /> QR Code de traçabilité</p>
                  <p className="text-[10px] text-gray-400">Scannez pour vérifier l'authenticité</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── All sections ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GuaranteesSection product={product} producer={producer} />
        <TraceabilitySection product={product} />
        <ProducerProfileSection producer={producer} />
        <ImpactSection product={product} quantity={qty} />
        <TechnicalDetailsSection product={product} />
        <DeliverySection product={product} quantity={qty} />
        <ReviewsSection product={product} reviews={reviews} />
        <FAQSection />
      </div>

      <Footer />

      {/* Sticky actions */}
      <StickyActions product={product} quantity={qty} />

      {/* Zoom modal */}
      {zoom && gallery && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setZoom(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl">✕</button>
          <img src={gallery[activeImg]} alt={product.name} className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}
