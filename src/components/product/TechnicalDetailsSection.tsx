import { useState } from 'react';
import { ClipboardList, Package, FlaskConical, Thermometer } from 'lucide-react';
import type { Product } from '../lib/supabase';
import { SectionTitle } from './GuaranteesSection';

const TABS = [
  { id: 'specs', label: 'Caractéristiques', icon: ClipboardList },
  { id: 'packaging', label: 'Emballage', icon: Package },
  { id: 'nutrition', label: 'Analyse nutritionnelle', icon: FlaskConical },
  { id: 'storage', label: 'Conservation', icon: Thermometer },
] as const;

export default function TechnicalDetailsSection({ product }: { product: Product }) {
  const [active, setActive] = useState<typeof TABS[number]['id']>('specs');

  const specs: [string, string][] = [
    ['Pays d\'origine', `${product.country_flag} ${product.country}`],
    ['Méthode de culture', product.farming_method ?? 'Non renseigné'],
    ['Prix de base', `${product.price} €/${product.price_unit}`],
    ['Quantité minimale', `${product.moq_value} ${product.moq_unit}`],
    ['Stock disponible', `${product.stock_value.toLocaleString('fr-FR')} ${product.stock_unit}`],
    ['Capacité mensuelle', `${product.monthly_capacity.toLocaleString('fr-FR')} ${product.stock_unit}/mois`],
    ['Délai de livraison', `${product.delivery_days} jours ouvrés`],
    ['Certifications', product.certifications.length > 0 ? product.certifications.join(', ') : 'Aucune'],
  ];

  const packaging: [string, string][] = [
    ['Type', 'Sacs jute 60 kg'],
    ['Emballage', 'Recyclable et biodégradable'],
    ['Étiquetage', 'Multilingue (FR, EN, AR)'],
    ['Poids unitaire', `${product.moq_value} ${product.moq_unit}`],
  ];

  const nutrition: [string, string][] = [
    ['Humidité', '10.5%'],
    ['Densité', '720 g/L'],
    ['Score SCA', '87 points'],
    ['Rapport complet', 'Télécharger PDF'],
  ];

  const storage: [string, string][] = [
    ['Température', '15-25°C'],
    ['Humidité', '< 65%'],
    ['Durée de conservation', '12 mois'],
    ['À l\'abri de', 'Lumière directe, chaleur'],
  ];

  const content: Record<string, [string, string][]> = {
    specs, packaging, nutrition, storage,
  };

  return (
    <section className="py-12 border-t border-gray-100">
      <SectionTitle icon={ClipboardList} title="Détails techniques" />

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100 flex overflow-x-auto scrollbar-hide">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
                  active === tab.id ? 'border-brand-500 text-brand-700 bg-brand-50/50' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content[active].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <dt className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{k}</dt>
                <dd className="text-sm font-bold text-gray-900 text-right">{v}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
