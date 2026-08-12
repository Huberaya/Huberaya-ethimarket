import { Sprout, Globe, Users, Heart, Droplets, TreePine, GraduationCap } from 'lucide-react';
import type { Product } from '../lib/supabase';
import { SectionTitle } from './GuaranteesSection';

export default function ImpactSection({ product, quantity }: { product: Product; quantity: number }) {
  // Dynamic calculations based on quantity
  const producerShare = Math.round(product.price * quantity * 0.87);
  const familiesBenef = Math.max(1, Math.round(quantity / 2.2));
  const co2Saved = Math.round(quantity * 0.85);
  const treesPreserved = +(quantity * 0.032).toFixed(1);
  const waterSaved = Math.round(quantity * 4.8);
  const jobsSupported = Math.max(1, Math.round(quantity / 16));
  const eduContribution = Math.round(quantity * 0.45);

  return (
    <section className="py-12 border-t border-gray-100">
      <SectionTitle icon={Sprout} title="Votre impact positif" />

      <p className="text-sm text-gray-500 mt-3 mb-8">
        Pour <span className="font-bold text-gray-900">{quantity} {product.price_unit}</span> de {product.name} acheté :
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Economic */}
        <ImpactCard icon={Globe} title="Impact économique" color="brand">
          <ImpactRow label="Prix payé au producteur" value={`${producerShare.toLocaleString('fr-FR')} € (87%)`} />
          <ImpactRow label="Familles bénéficiaires" value={`${familiesBenef}`} />
          <ImpactRow label="Salaire mensuel garanti" value="Assuré" check />
        </ImpactCard>

        {/* Environmental */}
        <ImpactCard icon={TreePine} title="Impact environnemental" color="emerald">
          <ImpactRow label="CO2 économisé vs classique" value={`${co2Saved} kg`} icon={Sprout} />
          <ImpactRow label="Arbres préservés" value={`${treesPreserved}`} icon={TreePine} />
          <ImpactRow label="Eau économisée" value={`${waterSaved} L`} icon={Droplets} />
          <ImpactRow label="Biodiversité protégée" value="15 espèces" />
        </ImpactCard>

        {/* Social */}
        <ImpactCard icon={Heart} title="Impact social" color="amber">
          <ImpactRow label="Emplois soutenus" value={`${jobsSupported} personnes`} icon={Users} />
          <ImpactRow label="Formation dispensée" value="12h" icon={GraduationCap} />
          <ImpactRow label="Contribution éducation" value={`${eduContribution} €`} />
        </ImpactCard>
      </div>
    </section>
  );
}

function ImpactCard({ icon: Icon, title, color, children }: { icon: typeof Globe; title: string; color: 'brand' | 'emerald' | 'amber'; children: React.ReactNode }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function ImpactRow({ label, value, icon: Icon, check }: { label: string; value: string; icon?: typeof Sprout; check?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-gray-500 inline-flex items-center gap-1.5">
        {Icon ? <Icon className="w-3.5 h-3.5 text-gray-400" /> : check ? <Heart className="w-3.5 h-3.5 text-brand-500" /> : null}
        {label}
      </span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}
