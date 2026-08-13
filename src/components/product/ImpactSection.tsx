import { Sprout, Globe, Users, Heart, Droplets, TreePine, GraduationCap, ShieldCheck, Scale, Award } from 'lucide-react';
import type { Product } from '../../lib/supabase';
import { SectionTitle } from './GuaranteesSection';
import {
  calculateCarbonFootprint,
  calculateWaterFootprint,
  calculateBiodiversityImpact,
  calculateEconomicImpact,
  calculateSocialImpact,
} from '../../lib/calculations';

export default function ImpactSection({
  product,
  producer,
  quantity,
}: {
  product: Product;
  producer?: any;
  quantity: number;
}) {
  const qtyKg = Math.max(1, quantity);
  const orderAmount = (product.price || 0) * qtyKg;
  const productType = product.category_name || product.name || 'café';
  const originCountry = product.country || producer?.country || 'Éthiopie';

  // Dynamic calculations based on scientific models
  const carbon = calculateCarbonFootprint(productType, qtyKg, originCountry, 'France', 'sea', 'jute', 0.05);
  const water = calculateWaterFootprint(productType, qtyKg);
  const surfaceHa = Math.max(0.1, Math.round((qtyKg / 500) * 100) / 100);
  const bio = calculateBiodiversityImpact(surfaceHa, 'organic_shade', 'tropical_africa');
  const eco = calculateEconomicImpact(orderAmount, 'EUR', originCountry);
  const soc = calculateSocialImpact(orderAmount, producer?.employees_count || 10);

  return (
    <section className="py-12 border-t border-gray-100">
      <SectionTitle icon={Sprout} title="Votre impact positif" />

      <div className="bg-brand-50/60 rounded-2xl p-4 border border-brand-100 my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-700">
            Impact mesuré pour <span className="font-bold text-gray-900">{qtyKg.toLocaleString('fr-FR')} {product.price_unit}</span> de {product.name} ({orderAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €)
          </p>
          <p className="text-xs text-brand-700 font-medium mt-0.5">
            ⚡ Tous les indicateurs se mettent à jour en temps réel avec la quantité commandée.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-white px-3 py-1.5 rounded-xl border border-brand-200 shadow-2xs whitespace-nowrap">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          Auditabilité scientifique certifiée
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Environmental */}
        <ImpactCard
          icon={TreePine}
          title="Impact Environnemental"
          subtitle="Méthodes : GHG Protocol + Water Footprint + IBAT"
          color="emerald"
        >
          <ImpactRow
            label="CO2 économisé"
            value={`${carbon.savedCO2e.toLocaleString('fr-FR')} kg CO2e`}
            subtext="Méthode GHG Protocol Scope 1-3 (ADEME)"
            icon={Sprout}
          />
          <ImpactRow
            label="Eau économisée"
            value={`${water.savedWaterL.toLocaleString('fr-FR')} Litres`}
            subtext="Méthode Water Footprint Network"
            icon={Droplets}
          />
          <ImpactRow
            label="Arbres préservés"
            value={`${bio.treesPreserved.toLocaleString('fr-FR')} arbres`}
            subtext="Méthode Agroforesterie FAO"
            icon={TreePine}
          />
          <ImpactRow
            label="Biodiversité protégée"
            value={`${bio.speciesProtected} espèces/ha`}
            subtext="Méthode Indice IBAT"
            icon={Award}
          />
        </ImpactCard>

        {/* 2. Economic */}
        <ImpactCard
          icon={Globe}
          title="Impact Économique Direct"
          subtitle="Méthode : Fairtrade Impact Assessment"
          color="brand"
        >
          <ImpactRow
            label="Prix au producteur (87%)"
            value={`${eco.producerRevenue.toLocaleString('fr-FR')} €`}
            subtext="Direct sans intermédiaire (vs 40% habituel)"
            icon={Scale}
          />
          <ImpactRow
            label="Familles bénéficiaires"
            value={`${eco.familiesBeneficiary} familles`}
            subtext="Taille moyenne 4.5 pers/foyer"
            icon={Users}
          />
          <ImpactRow
            label="Gain vs conventionnel"
            value={`+${eco.revenueIncrease}%`}
            subtext="Revenu net garanti supérieur au living wage"
            icon={Globe}
          />
          <ImpactRow
            label="Prime Fairtrade réservée"
            value={`${eco.fairtradePremuim.toLocaleString('fr-FR')} €`}
            subtext="Investissement projets communautaires"
            icon={ShieldCheck}
          />
        </ImpactCard>

        {/* 3. Social */}
        <ImpactCard
          icon={Heart}
          title="Impact Social & Communautaire"
          subtitle="Méthode : UN SDG Framework 2030"
          color="amber"
        >
          <ImpactRow
            label="Emplois soutenus"
            value={`${soc.jobsSupported} personnes`}
            subtext="Emplois locaux décents durables"
            icon={Users}
          />
          <ImpactRow
            label="Formation dispensée"
            value={`${soc.trainingHours} heures`}
            subtext="Bilan & pratiques durables"
            icon={GraduationCap}
          />
          <ImpactRow
            label="Éducation & écoles"
            value={`${soc.educationContribution.toLocaleString('fr-FR')} €`}
            subtext={`${soc.childrenImpacted} enfant(s) scolarisé(s)`}
            icon={Heart}
          />
          <ImpactRow
            label="Couverture santé"
            value="Guarantie 100%"
            subtext="Soins d'urgence & assurance santé"
            icon={ShieldCheck}
          />
        </ImpactCard>
      </div>

      {/* Methodological notice */}
      <div className="mt-8 bg-gray-50 rounded-2xl p-4 border border-gray-200 text-center text-xs text-gray-500 font-medium">
        <p>
          ⚖️ <span className="font-bold text-gray-700">Traçabilité & Méthodologies :</span> Calculs basés sur <span className="font-semibold text-gray-800">GHG Protocol (Scopes 1, 2, 3)</span>, <span className="font-semibold text-gray-800">ADEME Base Carbone®</span>, <span className="font-semibold text-gray-800">Water Footprint Network</span>, <span className="font-semibold text-gray-800">FAO Agroforestry</span>, et le cadre <span className="font-semibold text-gray-800">UN SDG Framework</span>.
        </p>
      </div>
    </section>
  );
}

function ImpactCard({
  icon: Icon,
  title,
  subtitle,
  color,
  children,
}: {
  icon: typeof Globe;
  title: string;
  subtitle: string;
  color: 'brand' | 'emerald' | 'amber';
  children: React.ReactNode;
}) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{title}</h3>
            <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
          </div>
        </div>
        <div className="space-y-3 mt-4">{children}</div>
      </div>
    </div>
  );
}

function ImpactRow({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon?: typeof Sprout;
}) {
  return (
    <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600 inline-flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
          {label}
        </span>
        <span className="text-xs font-black text-gray-900 text-right">{value}</span>
      </div>
      {subtext && <p className="text-[10px] text-gray-400 mt-0.5 ml-5">{subtext}</p>}
    </div>
  );
}
