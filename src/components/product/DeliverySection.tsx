import { useState } from 'react';
import { Truck, Plane, Ship, Calculator, FileCheck, Leaf, ShieldCheck } from 'lucide-react';
import type { Product } from '../../lib/supabase';
import { SectionTitle } from './GuaranteesSection';
import { calculateShipping, calculateCustomsAndVAT, calculateOrderTotal } from '../../lib/calculations';

export default function DeliverySection({ product, quantity }: { product: Product; quantity: number }) {
  const [address, setAddress] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('France');
  const [selectedMode, setSelectedMode] = useState<'maritime' | 'dhl' | 'ups'>('maritime');

  const originCountry = product.country || 'Éthiopie';
  const qtyKg = Math.max(1, quantity);

  // Dynamic calculations
  const shippingResult = calculateShipping(
    originCountry,
    destinationCountry,
    qtyKg,
    selectedMode
  );

  const hsCode = product.hs_code || '0901';
  const customsAndVAT = calculateCustomsAndVAT(
    product.price * qtyKg,
    hsCode,
    originCountry,
    destinationCountry,
    true,
    true
  );

  const orderTotal = calculateOrderTotal(
    product,
    null,
    qtyKg,
    destinationCountry,
    selectedMode
  );

  return (
    <section className="py-12 border-t border-gray-100">
      <SectionTitle icon={Truck} title="Livraison & Transparence Tarifaire" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Calculator */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-brand-600" /> Calculateur Fret & Bilan Carbone Transport
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Destination de livraison (UE)</label>
              <div className="flex gap-2">
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Adresse ou code postal..."
                  className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                />
                <select
                  value={destinationCountry}
                  onChange={e => setDestinationCountry(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="France">🇫🇷 France</option>
                  <option value="Allemagne">🇩🇪 Allemagne</option>
                  <option value="Espagne">🇪🇸 Espagne</option>
                  <option value="Italie">🇮🇹 Italie</option>
                  <option value="Belgique">🇧🇪 Belgique</option>
                  <option value="Pays-Bas">🇳🇱 Pays-Bas</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600">Volume calculé :</span>
              <span className="font-black text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200">{qtyKg.toLocaleString('fr-FR')} {product.price_unit} (~{qtyKg} kg)</span>
            </div>

            {/* Mode selection with CO2e footprint */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Mode de transport au choix :</label>
              <div className="space-y-2.5">
                {(['maritime', 'dhl', 'ups'] as const).map(optKey => {
                  const opt = shippingResult.options[optKey];
                  const Icon = optKey === 'maritime' ? Ship : Plane;
                  const isSel = selectedMode === optKey;

                  return (
                    <button
                      key={optKey}
                      onClick={() => setSelectedMode(optKey)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                        isSel ? 'border-brand-500 bg-brand-50/70 shadow-xs' : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSel ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-gray-900">{opt.name}</p>
                          <span className="font-black text-brand-700 text-sm">{opt.price.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>⏱️ {opt.deliveryDays}</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <Leaf className="w-3 h-3 text-emerald-600" /> {opt.co2eTransport} kg CO2e
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Transparent Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
              <FileCheck className="w-4 h-4 text-brand-600" /> Récapitulatif transparent
            </h3>

            <div className="space-y-3">
              <SummaryRow
                label={`Prix produit (${qtyKg} ${product.price_unit})`}
                value={`${orderTotal.productPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
              />
              <SummaryRow
                label={`Fret transport (${orderTotal.shippingName})`}
                value={`${orderTotal.shippingCost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                subtext={`Empreinte CO2 transport : ${shippingResult.options[selectedMode].co2eTransport} kg CO2e`}
              />
              <SummaryRow
                label="Commission EthiMarket (5%)"
                value={`${orderTotal.ethimarketCommission.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                subtext="Frais de fonctionnement de la plateforme directe"
              />
              <SummaryRow
                label={`Droits de douane UE (${customsAndVAT.customsRate}%)`}
                value={`${customsAndVAT.customsDuty.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                subtext={customsAndVAT.exemptionReason}
                highlight={customsAndVAT.isExempt}
              />
              <SummaryRow
                label={`TVA à l'importation (${destinationCountry} - ${customsAndVAT.vatRate}%)`}
                value={`${customsAndVAT.vatAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                subtext={`Taux réduit sur les denrées alimentaires bio en ${destinationCountry}`}
              />

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-gray-900 text-base">TOTAL TTC TOUT INCLUS</span>
                  <span className="text-2xl font-black text-brand-700">
                    {orderTotal.totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>
                <p className="text-xs text-brand-600 font-semibold mt-1">
                  ✓ Tarification certifiée sans frais cachés ni intermédiaire secondaire
                </p>
              </div>
            </div>
          </div>

          {/* EU Customs & ACP Box */}
          <div className="mt-6 bg-blue-50/80 rounded-xl p-4 border border-blue-100">
            <h4 className="font-bold text-xs text-blue-900 flex items-center gap-1.5 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Confort douanier & Accord UE-ACP
            </h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              En vertu des accords UE-ACP (Cotonou / EBA), les produits certifiés originaires de pays partenaires bénéficient de <span className="font-bold">0% de droits de douane</span>. Tous les documents Phytosanitaires (EUR.1, Certificat Bio UE) sont automatiquement générés.
            </p>
          </div>
        </div>
      </div>

      {/* Methodological notice */}
      <div className="mt-8 bg-gray-50 rounded-2xl p-4 border border-gray-200 text-center text-xs text-gray-500 font-medium">
        <p>
          Calculs basés sur <span className="font-semibold text-gray-800">GHG Protocol</span>, <span className="font-semibold text-gray-800">ADEME</span>, <span className="font-semibold text-gray-800">Water Footprint Network</span>, <span className="font-semibold text-gray-800">FAO</span>, et <span className="font-semibold text-gray-800">UN SDG Framework</span>.
        </p>
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
  subtext,
  highlight,
}: {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className={`font-black ${highlight ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200' : 'text-gray-900'}`}>{value}</span>
      </div>
      {subtext && <p className="text-[10px] text-gray-400 mt-0.5">{subtext}</p>}
    </div>
  );
}
