import { useState } from 'react';
import {
  Sprout, Leaf, Calendar, Package, Truck, MapPin,
  ChevronRight, Coffee,
} from 'lucide-react';
import type { Product } from '../lib/supabase';
import { LeafletMap } from '../LeafletMap';
import { SectionTitle, formatDate } from './GuaranteesSection';

export default function TraceabilitySection({ product }: { product: Product }) {
  const [openStep, setOpenStep] = useState<number | null>(0);

  const steps = [
    {
      icon: Sprout, title: 'Plantation',
      date: product.planting_date ? formatDate(product.planting_date) : 'Non renseigné',
      detail: `Lieu: ${product.country}. Méthode: ${product.farming_method ?? 'Non renseigné'}.`,
      photo: product.image_url ?? null,
    },
    {
      icon: Leaf, title: 'Croissance',
      date: '30 mois',
      detail: 'Méthode bio, ombragé. Sans pesticides ni engrais chimiques.',
      photo: null,
    },
    {
      icon: Calendar, title: 'Récolte',
      date: product.harvest_date ? formatDate(product.harvest_date) : 'Non renseigné',
      detail: 'Cueillette manuelle. Photos de la récolte disponibles.',
      photo: product.image_url ?? null,
    },
    {
      icon: Coffee, title: 'Traitement',
      date: product.harvest_date ? formatDate(product.harvest_date) : '—',
      detail: 'Méthode lavée. Séchage solaire. Durée 12 jours.',
      photo: null,
    },
    {
      icon: Package, title: 'Emballage',
      date: product.packaging_date ? formatDate(product.packaging_date) : 'Non renseigné',
      detail: 'Sacs jute biodégradables. Étiquetage conforme UE.',
      photo: null,
    },
    {
      icon: Truck, title: 'Prêt pour expédition',
      date: 'Disponible maintenant',
      detail: `Volume disponible: ${product.stock_value.toLocaleString('fr-FR')} ${product.stock_unit}.`,
      photo: null,
    },
  ];

  const [lat, lng] = product.gps_coordinates
    ? product.gps_coordinates.split(',').map(s => parseFloat(s.trim()))
    : [NaN, NaN];

  return (
    <section className="py-12 border-t border-gray-100">
      <SectionTitle icon={MapPin} title="Voyage de votre produit" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <div className="relative">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isOpen = openStep === i;
              return (
                <div key={i} className="flex gap-4 pb-4 relative">
                  {i < steps.length - 1 && (
                    <div className="absolute left-5 top-12 w-0.5 h-[calc(100%-1rem)] bg-gradient-to-b from-brand-200 to-brand-50" />
                  )}
                  <button
                    onClick={() => setOpenStep(isOpen ? null : i)}
                    className="w-10 h-10 rounded-xl bg-brand-50 border-2 border-brand-200 flex items-center justify-center flex-shrink-0 z-10 hover:bg-brand-100 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-brand-600" />
                  </button>
                  <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <button onClick={() => setOpenStep(isOpen ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{step.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{step.date}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                        <p className="text-sm text-gray-600 leading-relaxed">{step.detail}</p>
                        {step.photo && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
                            <img src={step.photo} alt={step.title} className="w-full h-40 object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
            <div className="p-4 border-b border-gray-50">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-500" /> Trajet du produit
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">De l'exploitation à votre destination</p>
            </div>
            {!isNaN(lat) && !isNaN(lng) ? (
              <LeafletMap
                markers={[
                  { lat, lng, label: `Origine — ${product.country}` },
                  { lat: 48.8566, lng: 2.3522, label: 'Votre destination (Paris)' },
                ]}
                height="280px"
                zoom={2}
              />
            ) : (
              <div className="h-[280px] bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                Coordonnées GPS non renseignées
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <span className="text-gray-600">Origine: {product.country_flag} {product.country}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-gray-600">Destination: Votre adresse</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
