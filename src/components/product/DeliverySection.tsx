import { useState } from 'react';
import { Truck, Plane, Ship, Calculator, FileCheck, Info } from 'lucide-react';
import type { Product } from '../lib/supabase';
import { SectionTitle } from './GuaranteesSection';

const SHIPPING_OPTIONS = [
  { id: 'dhl', name: 'DHL Express', icon: Plane, duration: '5-7 jours', cost: 245, tracking: true, insurance: true, eco: false },
  { id: 'ups', name: 'UPS Standard', icon: Plane, duration: '10-14 jours', cost: 180, tracking: true, insurance: false, eco: false },
  { id: 'maritime', name: 'Maritime', icon: Ship, duration: '30-45 jours', cost: 65, tracking: false, insurance: false, eco: true },
] as const;

export default function DeliverySection({ product, quantity }: { product: Product; quantity: number }) {
  const [address, setAddress] = useState('');
  const [selected, setSelected] = useState<string>('dhl');

  const productPrice = product.price * quantity;
  const shipping = SHIPPING_OPTIONS.find(o => o.id === selected)?.cost ?? 0;
  const commission = Math.round(productPrice * 0.05);
  const customs = Math.round(productPrice * 0.055);
  const total = productPrice + shipping + commission + customs;

  return (
    <section className="py-12 border-t border-gray-100">
      <SectionTitle icon={Truck} title="Comment ça arrive chez vous ?" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Calculator */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-brand-500" /> Calculateur de livraison
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Adresse de livraison</label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Saisissez votre adresse..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Quantité</label>
              <div className="px-3 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-100">
                {quantity} {product.price_unit}
              </div>
            </div>
          </div>

          {/* Shipping options */}
          <div className="mt-4 space-y-2">
            {SHIPPING_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSel = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    isSel ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSel ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900">{opt.name}</p>
                    <p className="text-xs text-gray-500">{opt.duration} • {opt.cost} €</p>
                  </div>
                  <div className="flex gap-1">
                    {opt.tracking && <span className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">Suivi</span>}
                    {opt.eco && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Éco</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
            <FileCheck className="w-4 h-4 text-brand-500" /> Récapitulatif transparent
          </h3>
          <div className="space-y-2.5">
            <SummaryRow label="Prix produit" value={`${productPrice.toLocaleString('fr-FR')} €`} />
            <SummaryRow label={`Livraison (${SHIPPING_OPTIONS.find(o => o.id === selected)?.name})`} value={`${shipping} €`} />
            <SummaryRow label="Commission EthiMarket (5%)" value={`${commission} €`} />
            <SummaryRow label="Douane + TVA (5.5%)" value={`${customs} €`} />
            <div className="border-t border-gray-100 pt-2.5 mt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-gray-900">TOTAL</span>
                <span className="text-xl font-black text-brand-600">{total.toLocaleString('fr-FR')} €</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Tout inclus, sans surprise</p>
            </div>
          </div>

          {/* Customs info */}
          <div className="mt-5 bg-blue-50 rounded-xl p-3.5 border border-blue-100">
            <h4 className="font-bold text-xs text-blue-900 flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5" /> Détails douane UE
            </h4>
            <div className="space-y-1 text-xs text-blue-700">
              <p>• Droits de douane : 0% (accord ACP)</p>
              <p>• TVA à l'import : 5.5% (produits alimentaires)</p>
              <p>• Total douane : 5.5% × montant produit</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
