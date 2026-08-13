import { useState } from 'react';
import { Truck, Plane, Ship, Calculator, FileCheck, Info } from 'lucide-react';
import type { Product } from '../../lib/supabase';
import { SectionTitle } from './GuaranteesSection';
import { calculateShipping, calculateCustomsAndVAT, calculateOrderTotal } from '../../lib/calculations';

export default function DeliverySection({ product, quantity }: { product: Product; quantity: number }) {
  const [address, setAddress] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('France');
  const [selected, setSelected] = useState<'dhl' | 'ups' | 'maritime'>('dhl');

  const shippingOptions = calculateShipping(
    product.country || 'France',
    destinationCountry,
    1, // weight per unit
    quantity
  );

  const customsAndVAT = calculateCustomsAndVAT(
    product.price * quantity,
    product.category_id || 'alimentaire',
    product.country || 'France',
    destinationCountry
  );

  const orderTotal = calculateOrderTotal(
    product,
    quantity,
    selected,
    destinationCountry,
    1
  );

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
              <label className="block text-xs font-bold text-gray-600 mb-1">Adresse ou pays de livraison</label>
              <div className="flex gap-2">
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Saisissez votre adresse..."
                  className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                />
                <select
                  value={destinationCountry}
                  onChange={e => setDestinationCountry(e.target.value)}
                  className="px-3 py-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-gray-50"
                >
                  <option value="France">🇫🇷 France</option>
                  <option value="Allemagne">🇩🇪 Allemagne</option>
                  <option value="Espagne">🇪🇸 Espagne</option>
                  <option value="Italie">🇮🇹 Italie</option>
                  <option value="Belgique">🇧🇪 Belgique</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Quantité</label>
              <div className="px-3 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-100 font-semibold text-gray-800">
                {quantity} {product.price_unit}
              </div>
            </div>
          </div>

          {/* Shipping options */}
          <div className="mt-4 space-y-2">
            {(['dhl', 'ups', 'maritime'] as const).map(optKey => {
              const opt = shippingOptions[optKey];
              const Icon = optKey === 'maritime' ? Ship : Plane;
              const isSel = selected === optKey;
              return (
                <button
                  key={optKey}
                  onClick={() => setSelected(optKey)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    isSel ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSel ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900">{opt.name}</p>
                    <p className="text-xs text-gray-500">{opt.days} • {opt.price.toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="flex gap-1">
                    {opt.tracking && <span className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded font-bold">Suivi</span>}
                    {opt.eco && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">Éco</span>}
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
            <SummaryRow label="Prix produit" value={`${orderTotal.productPrice.toLocaleString('fr-FR')} €`} />
            <SummaryRow label={`Livraison (${orderTotal.shippingName})`} value={`${orderTotal.shippingFee.toLocaleString('fr-FR')} €`} />
            <SummaryRow label="Commission EthiMarket (5%)" value={`${orderTotal.commission.toLocaleString('fr-FR')} €`} />
            <SummaryRow label={`Douane + TVA (${customsAndVAT.vatRatePercent}%)`} value={`${orderTotal.totalTax.toLocaleString('fr-FR')} €`} />
            <div className="border-t border-gray-100 pt-2.5 mt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-gray-900">TOTAL</span>
                <span className="text-xl font-black text-brand-600">{orderTotal.total.toLocaleString('fr-FR')} €</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Tout inclus, sans surprise</p>
            </div>
          </div>

          {/* Customs info */}
          <div className="mt-5 bg-blue-50 rounded-xl p-3.5 border border-blue-100">
            <h4 className="font-bold text-xs text-blue-900 flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5" /> Détails douane & conformité UE
            </h4>
            <div className="space-y-1 text-xs text-blue-700">
              <p>• Droits de douane : {customsAndVAT.customsRatePercent}% {customsAndVAT.isACPAgreement ? '(Accord ACP Équitable)' : ''}</p>
              <p>• TVA à l'import ({destinationCountry}) : {customsAndVAT.vatRatePercent}%</p>
              <p>• Total taxes : {customsAndVAT.totalTax.toLocaleString('fr-FR')} €</p>
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
