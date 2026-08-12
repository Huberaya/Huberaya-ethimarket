import { Link } from 'react-router-dom';
import { Star, MapPin, ArrowRight, Award } from 'lucide-react';
import type { Product } from '../lib/supabase';
import { badgeInfo } from './ScoreBadge';

const CERT_BADGE: Record<string, string> = {
  Bio:                 'badge-bio',
  Fairtrade:           'badge-fairtrade',
  Ecocert:             'badge-ecocert',
  'Rainforest Alliance': 'badge-rainforest',
  GlobalGAP:           'badge-globalgap',
};

type Props = { product: Product };

export default function ProductCard({ product }: Props) {
  const imageUrl = product.image_url ?? null;

  return (
    <article className="card flex flex-col overflow-hidden group">
      {/* Image */}
      <Link to={`/produit/${product.id}`} className="block relative overflow-hidden" style={{ height: '200px' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500"
            style={{ backgroundColor: product.bg_color }}
          >
            {product.emoji}
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.top_seller && (
            <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              TOP VENDEUR
            </span>
          )}
          {product.certifications[0] && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${CERT_BADGE[product.certifications[0]] ?? 'bg-gray-100 text-gray-700'}`}>
              {product.certifications[0].toUpperCase()}
            </span>
          )}
        </div>
        {/* Score badge */}
        {product.product_score > 0 && (
          <div className="absolute bottom-3 left-3">
            {(() => {
              const info = badgeInfo(product.product_score);
              return (
                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ring-1 ${info.bg} ${info.text} ${info.ring} shadow-sm`}>
                  <Award className="w-3 h-3" /> {product.product_score}
                </span>
              );
            })()}
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Origin */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>{product.country_flag} {product.country}</span>
        </div>

        {/* Name */}
        <Link to={`/produit/${product.id}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 hover:text-brand-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-3 h-3 ${s <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
            ))}
          </div>
          <span className="text-xs font-medium text-gray-700">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.review_count})</span>
        </div>

        {/* Certs */}
        <div className="flex flex-wrap gap-1 mb-4">
          {product.certifications.slice(0, 3).map(c => (
            <span key={c} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CERT_BADGE[c] ?? 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
              {c}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto">
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-gray-900">{product.price.toFixed(2)} €</span>
              <span className="text-xs text-gray-400 ml-0.5">/{product.price_unit}</span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
              MOQ {product.moq_value} {product.moq_unit}
            </span>
          </div>

          <Link
            to={`/produit/${product.id}`}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-semibold text-brand-600 border-2 border-brand-500 rounded-xl hover:bg-brand-500 hover:text-white transition-all duration-200 group/btn"
          >
            Voir le produit
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}
