import { useState } from 'react';
import { Star, BadgeCheck, MessageSquare } from 'lucide-react';
import type { Product, Review } from '../lib/supabase';
import { SectionTitle } from './GuaranteesSection';

export default function ReviewsSection({ product, reviews }: { product: Product; reviews: Review[] }) {
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = verifiedOnly ? reviews.filter(r => r.author_company) : reviews;

  return (
    <section className="py-12 border-t border-gray-100">
      <SectionTitle icon={Star} title="Avis d'acheteurs professionnels" />

      {/* Summary */}
      <div className="mt-8 flex flex-col sm:flex-row items-start gap-6 mb-8">
        <div className="bg-gray-50 rounded-2xl p-5 text-center min-w-[160px]">
          <div className="text-5xl font-black text-gray-900">{product.rating}</div>
          <div className="flex justify-center my-1.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-500">{product.review_count} avis</p>
        </div>

        <div className="flex-1">
          {/* Filter toggle */}
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded accent-brand-500"
            />
            <BadgeCheck className="w-4 h-4 text-brand-500" />
            Vérifiés seulement <span className="text-xs text-gray-400">(recommandé)</span>
          </label>

          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="font-semibold text-gray-700 text-sm">Aucun avis pour l'instant</p>
              <p className="text-gray-400 text-xs">Soyez le premier à évaluer ce produit.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(r => (
                <div key={r.id} className="p-4 bg-white rounded-2xl border border-gray-100">
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 font-bold text-sm">
                        {r.author_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-900 text-sm">{r.author_name}</p>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-full">
                            <BadgeCheck className="w-3 h-3" /> Achat vérifié
                          </span>
                        </div>
                        {r.author_company && <p className="text-xs text-gray-400">{r.author_company}</p>}
                      </div>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{r.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
