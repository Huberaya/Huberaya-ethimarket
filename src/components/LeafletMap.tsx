import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet's CSS references don't work with bundlers)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

type MarkerData = {
  lat: number;
  lng: number;
  popupHtml?: string;
  label?: string;
};

export function LeafletMap({
  markers,
  center,
  zoom,
  height = '400px',
  className = '',
  onMapClick,
}: {
  markers: MarkerData[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize map once
    if (!mapRef.current) {
      const defaultCenter: [number, number] = center ?? [20, 0];
      mapRef.current = L.map(containerRef.current, {
        center: defaultCenter,
        zoom: zoom ?? 2,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    mapRef.current.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add markers
    const bounds: L.LatLngExpression[] = [];
    markers.forEach(m => {
      if (m.lat && m.lng && !isNaN(m.lat) && !isNaN(m.lng)) {
        const marker = L.marker([m.lat, m.lng]).addTo(mapRef.current!);
        if (m.popupHtml) marker.bindPopup(m.popupHtml);
        else if (m.label) marker.bindPopup(m.label);
        bounds.push([m.lat, m.lng]);
      }
    });

    // Fit bounds if multiple markers
    if (bounds.length > 1 && mapRef.current) {
      mapRef.current.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40] });
    } else if (bounds.length === 1 && mapRef.current) {
      mapRef.current.setView(bounds[0] as L.LatLngExpression, zoom ?? 10);
    }

    // Click handler
    if (onMapClick && mapRef.current) {
      mapRef.current.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }
  }, [markers, center, zoom, onMapClick]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden border border-gray-200 ${className}`}
      style={{ height }}
    />
  );
}
