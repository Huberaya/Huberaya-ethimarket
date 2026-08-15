// src/components/search/SearchResultsGrid.tsx
// Rich Grid View for Intelligent Search Results with Match Reasons and Comparison Action

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Scale, Leaf, ArrowUpRight, Sparkles } from 'lucide-react';
import { SearchResultItem } from '../../lib/productSearchEngine';
import { Product } from '../../lib/supabase';

interface SearchResultsGridProps {
  results: SearchResultItem[];
  selectedComparisonIds: string[];
  onToggleCompare: (product: Product) => void;
  onSearchAlternative?: (product: Product) => void;
}

export const SearchResultsGrid: React.FC<SearchResultsGridProps> = ({
  results,
  selectedComparisonIds,
  onToggleCompare,
  onSearchAlternative
}) => {
  if (results.length === 0) return null;

  return (
    <div
      id="search-results-grid"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
    >
      {results.map(prod => {
        const isCompared = selectedComparisonIds.includes(prod.id);
        const score = prod.confidence_score || prod.product_score || 85;
        const co2 = prod.carbon_footprint_kg ?? (parseFloat(prod.co2_estimate || '0') || 1.8);

        return (
          <div
            key={prod.id}
            id={`product-card-${prod.id}`}
            className="group relative bg-white rounded-2xl border border-neutral-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-200 flex flex-col overflow-hidden"
          >
            {/* Top Media / Thumbnail */}
            <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
              {prod.image_url ? (
                <img
                  src={prod.image_url}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl bg-emerald-50 text-emerald-800">
                  {prod.emoji || '📦'}
                </div>
              )}

              {/* Badges on Top of Image */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-white/95 text-emerald-900 shadow-md backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Score {score}/100</span>
                </span>
                {co2 > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/95 text-neutral-800 shadow-md backdrop-blur-sm">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{co2} kg CO2</span>
                  </span>
                )}
              </div>

              {/* Compare Toggle Button */}
              <button
                type="button"
                onClick={() => onToggleCompare(prod)}
                title={isCompared ? 'Retirer du comparateur' : 'Ajouter au comparateur'}
                className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-md ${
                  isCompared
                    ? 'bg-emerald-600 text-white ring-2 ring-white'
                    : 'bg-white/90 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <Scale className="w-4 h-4" />
              </button>
            </div>

            {/* Card Content Body */}
            <div className="p-4 flex-1 flex flex-col">
              {/* Producer & Origin */}
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
                <span className="truncate max-w-[180px]">
                  {prod.producers?.company_name || 'Producteur certifié'}
                </span>
                <span className="flex items-center gap-1 font-medium text-neutral-700 shrink-0">
                  <span>{prod.country_flag}</span>
                  <span>{prod.country}</span>
                </span>
              </div>

              {/* Title */}
              <Link to={`/produits/${prod.slug}`} className="group-hover:text-emerald-700 transition">
                <h3 className="font-bold text-neutral-900 text-base leading-snug line-clamp-2 mb-2">
                  {prod.name}
                </h3>
              </Link>

              {/* Match reasons pills */}
              {prod.matchReasons && prod.matchReasons.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {prod.matchReasons.slice(0, 3).map((reason, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-md flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{reason}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Certifications badges */}
              {prod.certifications && prod.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {prod.certifications.slice(0, 3).map((cert, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded"
                    >
                      {cert}
                    </span>
                  ))}
                  {prod.certifications.length > 3 && (
                    <span className="text-[10px] text-neutral-400 font-medium self-center">
                      +{prod.certifications.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Bottom Price & Call to Action */}
              <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <div className="text-lg font-black text-neutral-900">
                    {prod.price} {prod.currency || '€'}
                    <span className="text-xs font-normal text-neutral-500 ml-1">
                      /{prod.price_unit || 'unité'}
                    </span>
                  </div>
                  {prod.moq_value && (
                    <div className="text-[11px] text-neutral-400">
                      MOQ: {prod.moq_value} {prod.moq_unit || 'unités'}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {onSearchAlternative && (
                    <button
                      type="button"
                      onClick={() => onSearchAlternative(prod)}
                      title="Chercher des alternatives à ce produit"
                      className="p-2 text-xs bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 text-neutral-600 rounded-xl transition font-medium"
                    >
                      Alternatives
                    </button>
                  )}
                  <Link
                    to={`/produits/${prod.slug}`}
                    className="p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition flex items-center justify-center shadow-sm"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
