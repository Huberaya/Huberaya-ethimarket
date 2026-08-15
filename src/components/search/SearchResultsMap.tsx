// src/components/search/SearchResultsMap.tsx
// Interactive Geographic Map View of Search Results using OpenStreetMap & Leaflet

import React, { useMemo } from 'react';
import { LeafletMap } from '../LeafletMap';
import { SearchResultItem } from '../../lib/productSearchEngine';
import { Product } from '../../lib/supabase';

interface SearchResultsMapProps {
  results: SearchResultItem[];
  selectedComparisonIds?: string[];
  onToggleCompare?: (product: Product) => void;
}

// Fallback country coordinates if no exact GPS is given
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  'France': [46.603354, 1.888334],
  'Colombie': [4.570868, -74.297333],
  'Pérou': [-9.189967, -75.015152],
  'Madagascar': [-18.766947, 46.869107],
  'Italie': [41.87194, 12.56738],
  'Espagne': [40.463667, -3.74922],
  'Portugal': [39.399872, -8.224454],
  'Allemagne': [51.165691, 10.451526],
  'Belgique': [50.503887, 4.469936],
  'Éthiopie': [9.145, 40.489673],
  'Inde': [20.593684, 78.96288],
  'Nouvelle-Zélande': [-40.900557, 174.885971]
};

export const SearchResultsMap: React.FC<SearchResultsMapProps> = ({
  results
}) => {
  const markers = useMemo(() => {
    return results.map((prod, index) => {
      let lat = 0;
      let lng = 0;

      // 1. Try parsing gps_coordinates "lat, lng"
      if (prod.gps_coordinates) {
        const parts = prod.gps_coordinates.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          lat = parts[0];
          lng = parts[1];
        }
      }

      // 2. Fallback to Country coordinates with slight jitter to prevent marker overlap
      if ((lat === 0 && lng === 0) && prod.country && COUNTRY_COORDINATES[prod.country]) {
        const base = COUNTRY_COORDINATES[prod.country];
        const jitter = (index % 5) * 0.15 - 0.3;
        lat = base[0] + jitter;
        lng = base[1] + jitter;
      }

      const score = prod.confidence_score || prod.product_score || 85;

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 180px;">
          <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; margin-bottom: 2px;">
            ${prod.country_flag || '🌍'} ${prod.country}
          </div>
          <div style="font-weight: 800; font-size: 13px; color: #111827; margin-bottom: 4px;">
            ${prod.name}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 12px;">
            <span style="font-weight: 900; color: #059669;">${prod.price} €</span>
            <span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 6px; font-weight: 700;">Score ${score}/100</span>
          </div>
          <div style="margin-top: 8px;">
            <a href="/produits/${prod.slug}" style="display: block; text-align: center; background: #047857; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none;">
              Voir le produit →
            </a>
          </div>
        </div>
      `;

      return {
        lat,
        lng,
        popupHtml,
        label: prod.name
      };
    }).filter(m => m.lat !== 0 && m.lng !== 0);
  }, [results]);

  if (results.length === 0) return null;

  return (
    <div id="search-results-map-view" className="space-y-4">
      {/* Map Container */}
      <div className="relative rounded-3xl overflow-hidden shadow-sm border border-neutral-200 bg-white">
        <LeafletMap
          markers={markers}
          center={[20, 0]}
          zoom={2}
          height="520px"
          className="w-full"
        />

        {/* Map Legend Floating Card */}
        <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-neutral-200 text-xs space-y-1.5 hidden sm:block pointer-events-auto">
          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
            <span>🌍 Répartition mondiale</span>
          </div>
          <div className="text-neutral-500">
            {markers.length} exploitations & ateliers géo-localisés
          </div>
        </div>
      </div>
    </div>
  );
};
