// src/components/search/ProductComparisonDrawer.tsx
// Side-by-side Product Comparator Modal & Floating Bar (up to 5 products)

import React, { useState } from 'react';
import { X, Scale, Check, Trophy, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { Product } from '../../lib/supabase';
import { generateComparisonReport } from '../../lib/alternativeProductsEngine';
import { Link } from 'react-router-dom';

interface ProductComparisonDrawerProps {
  selectedProducts: Product[];
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
}

export const ProductComparisonDrawer: React.FC<ProductComparisonDrawerProps> = ({
  selectedProducts,
  onRemoveProduct,
  onClearAll
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);

  if (selectedProducts.length === 0) return null;

  const report = generateComparisonReport(selectedProducts);

  return (
    <>
      {/* Floating Bottom Bar */}
      <div
        id="comparator-floating-bar"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-4 max-w-4xl w-[92vw]"
      >
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-400" />
          <span className="text-xs md:text-sm font-semibold">
            Comparateur ({selectedProducts.length}/5) :
          </span>
        </div>

        {/* Selected Products Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto flex-1 py-1">
          {selectedProducts.map(p => (
            <div
              key={p.id}
              className="relative flex items-center gap-2 bg-neutral-800 rounded-xl px-2.5 py-1 text-xs shrink-0 border border-neutral-700"
            >
              <span>{p.country_flag || '📦'}</span>
              <span className="font-medium max-w-[120px] truncate">{p.name}</span>
              <span className="text-emerald-400 font-bold">{p.price} €</span>
              <button
                type="button"
                onClick={() => onRemoveProduct(p.id)}
                className="text-neutral-400 hover:text-rose-400 p-0.5"
                title="Retirer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-neutral-400 hover:text-white underline p-1"
          >
            Vider
          </button>
          <button
            id="btn-open-comparison-modal"
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-bold px-4 py-2 rounded-xl transition shadow-md"
          >
            <span>Comparer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Comparison Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            id="comparison-modal-dialog"
            className="bg-white rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-neutral-900">
                    Tableau comparatif multicritères
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Analyse détaillée côte-à-côte de {selectedProducts.length} produits
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verdict Summary Box */}
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-emerald-950 font-medium">
                <span className="font-bold">Synthèse de l'analyse : </span>
                {report.summaryVerdict}
              </div>
            </div>

            {/* Comparison Grid Table */}
            <div className="p-6 overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-xs font-bold uppercase text-neutral-400 w-1/4">
                      Critères d'évaluation
                    </th>
                    {selectedProducts.map(p => (
                      <th key={p.id} className="p-3 text-center min-w-[200px]">
                        <div className="flex flex-col items-center">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-16 h-16 rounded-xl object-cover mb-2 border border-neutral-200"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-emerald-50 text-emerald-700 text-2xl flex items-center justify-center font-bold mb-2">
                              {p.emoji || '📦'}
                            </div>
                          )}
                          <span className="font-bold text-sm text-neutral-900 text-center line-clamp-2">
                            {p.name}
                          </span>
                          <span className="text-xs text-neutral-500 mt-0.5">
                            {p.country_flag} {p.producers?.company_name || p.country}
                          </span>
                          <Link
                            to={`/produits/${p.slug}`}
                            className="mt-2 text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                          >
                            <span>Fiche produit</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {report.metrics.map(metric => (
                    <tr key={metric.key} className="hover:bg-neutral-50/50">
                      <td className="p-3 font-semibold text-neutral-700 text-xs">
                        {metric.label}
                      </td>
                      {selectedProducts.map(p => {
                        const val = metric.values[p.id];
                        const isWinner = metric.winnerProductId === p.id;
                        return (
                          <td
                            key={p.id}
                            className={`p-3 text-center ${
                              isWinner ? 'bg-emerald-50/50 font-bold text-emerald-950' : 'text-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              <span>
                                {typeof val === 'boolean'
                                  ? val ? 'Oui' : 'Non'
                                  : `${val} ${metric.unit || ''}`}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Comparateur propulsé par EthiMarket Intelligence (100% neutre & indépendant)
              </span>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
