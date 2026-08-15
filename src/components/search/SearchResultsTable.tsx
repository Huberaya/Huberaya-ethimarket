// src/components/search/SearchResultsTable.tsx
// Tabular List View for B2B Procurement Buyers with Dense Metrics

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Scale, ArrowUpRight, Leaf } from 'lucide-react';
import { SearchResultItem } from '../../lib/productSearchEngine';
import { Product } from '../../lib/supabase';

interface SearchResultsTableProps {
  results: SearchResultItem[];
  selectedComparisonIds: string[];
  onToggleCompare: (product: Product) => void;
}

export const SearchResultsTable: React.FC<SearchResultsTableProps> = ({
  results,
  selectedComparisonIds,
  onToggleCompare
}) => {
  if (results.length === 0) return null;

  return (
    <div
      id="search-results-table-container"
      className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden overflow-x-auto"
    >
      <table className="w-full text-left border-collapse text-sm">
        <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wider">
          <tr>
            <th className="p-3 text-center w-10">Comp.</th>
            <th className="p-3">Produit & Producteur</th>
            <th className="p-3">Origine</th>
            <th className="p-3">Certifications</th>
            <th className="p-3 text-center">Score EthiMarket</th>
            <th className="p-3 text-center">CO2 / Unité</th>
            <th className="p-3 text-center">MOQ</th>
            <th className="p-3 text-right">Prix Unitaire</th>
            <th className="p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {results.map(prod => {
            const isCompared = selectedComparisonIds.includes(prod.id);
            const score = prod.confidence_score || prod.product_score || 85;
            const co2 = prod.carbon_footprint_kg ?? (parseFloat(prod.co2_estimate || '0') || 1.8);

            return (
              <tr key={prod.id} className="hover:bg-neutral-50/80 transition">
                {/* Compare Checkbox */}
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => onToggleCompare(prod)}
                    className={`p-1.5 rounded-lg border transition ${
                      isCompared
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-neutral-300 hover:border-emerald-500 text-neutral-400'
                    }`}
                    title="Comparer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                  </button>
                </td>

                {/* Product Name & Producer */}
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {prod.image_url ? (
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                        {prod.emoji || '📦'}
                      </div>
                    )}
                    <div>
                      <Link
                        to={`/produits/${prod.slug}`}
                        className="font-bold text-neutral-900 hover:text-emerald-700 transition"
                      >
                        {prod.name}
                      </Link>
                      <div className="text-xs text-neutral-500">
                        {prod.producers?.company_name || 'Producteur certifié'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Origin */}
                <td className="p-3 text-xs text-neutral-700">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span>{prod.country_flag}</span>
                    <span>{prod.country}</span>
                  </span>
                </td>

                {/* Certifications */}
                <td className="p-3">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {prod.certifications && prod.certifications.length > 0 ? (
                      prod.certifications.slice(0, 2).map((cert, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200/60"
                        >
                          {cert}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-400">-</span>
                    )}
                  </div>
                </td>

                {/* Trust Score */}
                <td className="p-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{score}</span>
                  </span>
                </td>

                {/* CO2 */}
                <td className="p-3 text-center text-xs">
                  <span className="inline-flex items-center gap-1 text-neutral-600 font-medium">
                    <Leaf className="w-3 h-3 text-emerald-600" />
                    <span>{co2} kg</span>
                  </span>
                </td>

                {/* MOQ */}
                <td className="p-3 text-center text-xs text-neutral-600 font-medium">
                  {prod.moq_value || 1} {prod.moq_unit || 'u.'}
                </td>

                {/* Price */}
                <td className="p-3 text-right font-bold text-neutral-900">
                  {prod.price} {prod.currency || '€'}
                </td>

                {/* Action Link */}
                <td className="p-3 text-center">
                  <Link
                    to={`/produits/${prod.slug}`}
                    className="p-1.5 inline-flex items-center justify-center rounded-lg bg-neutral-100 hover:bg-emerald-100 hover:text-emerald-800 text-neutral-700 transition"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
