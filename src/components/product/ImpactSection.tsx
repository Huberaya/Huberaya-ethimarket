import { Sprout, Globe, Users, Heart, Droplets, TreePine, GraduationCap, ShieldCheck, Scale, Award, Info } from 'lucide-react';
import type { Product } from '../../lib/supabase';
import { SectionTitle } from './GuaranteesSection';
import {
  calculateCarbonFootprint,
  calculateWaterFootprint,
  calculateBiodiversity,
  calculateEconomicImpact,
  calculateSocialImpact,
} from '../../lib/calculations';

export default function ImpactSection({
  product,
  producer,
  quantity,
}: {
  product: Product;
  producer?: Record<string, unknown> | null;
  quantity: number;
}) {
  const qtyKg = Math.max(1, quantity);
  const orderAmount = (product.price || 0) * qtyKg;

  // Dynamic calculations based on scientific models
  const carbon = calculateCarbonFootprint(product, producer, qtyKg, 'France', 'maritime');
  const water = calculateWaterFootprint(product, producer, qtyKg);
  const bio = calculateBiodiversity(producer, qtyKg, product);
  const eco = calculateEconomicImpact(product, producer, qtyKg, orderAmount);
  const soc = calculateSocialImpact(producer, qtyKg, orderAmount);

  const producerSourceBadge = producer?.surface_value || producer?.farm_size || producer?.full_time_employees || producer?.families_impacted
    ? '📊 Données producteur'
    : '📈 Estimation sectorielle';

  return (
    <section className="py-12 border-t border-gray-100">
      <SectionTitle icon={Sprout} title="Votre impact positif certifié" />

      <div className="bg-brand-50/60 rounded-2xl p-4 border border-brand-100 my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-700">
            Impact mesuré pour <span className="font-bold text-gray-900">{qtyKg.toLocaleString('fr-FR')} {product.price_unit || 'kg'}</span> de {product.name} ({orderAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €)
          </p>
          <p className="text-xs text-brand-700 font-medium mt-0.5">
            ⚡ Calculs mis à jour en temps réel selon le GHG Protocol, ADEME Base Carbone® et Water Footprint Network.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-white px-3 py-1.5 rounded-xl border border-brand-200 shadow-2xs whitespace-nowrap">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          Transparent & Auditabilité Expert
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Environmental */}
        <ImpactCard
          icon={TreePine}
          title="Impact Climat & Eau"
          subtitle="Méthodes : GHG Protocol + ADEME + Water Footprint"
          color="emerald"
        >
          <ImpactRow
            label="CO2 économisé"
            value={`${carbon.savedCO2e.toLocaleString('fr-FR')} kg CO2e`}
            sourceBadge={producerSourceBadge}
            subtext="Calcul Scope 1-3 vs production conventionnelle"
            methodology={carbon.methodology}
            icon={Sprout}
          />
          <ImpactRow
            label="Eau économisée"
            value={`${water.savedWaterL.toLocaleString('fr-FR')} Litres`}
            sourceBadge="📈 Estimation sectorielle"
            subtext="Volume préservé grâce au mode de culture"
            methodology={water.methodology}
            icon={Droplets}
          />
          <ImpactRow
            label="Arbres préservés / planted"
            value={`${bio.treesPreserved.toLocaleString('fr-FR')} arbres`}
            sourceBadge={producerSourceBadge}
            subtext="Sur la surface d'exploitation associée"
            methodology={bio.methodology}
            icon={TreePine}
          />
          <ImpactRow
            label="Biodiversité préservée"
            value={`${bio.speciesProtected} espèces`}
            sourceBadge={producerSourceBadge}
            subtext="Basé sur les densités régionales (IBAT)"
            methodology={bio.methodology}
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
            label="Revenu producteur (87%)"
            value={`${eco.producerRevenue.toLocaleString('fr-FR')} €`}
            sourceBadge="📊 Modèle EthiMarket"
            subtext="Paiement direct sans intermédiaire commercial"
            methodology={eco.methodology}
            icon={Scale}
          />
          <ImpactRow
            label="Familles bénéficiaires"
            value={`${eco.familiesBeneficiary} famille(s)`}
            sourceBadge={eco.inputs.dataSource}
            subtext="Basé sur l'impact d'exploitation calculé"
            methodology={eco.methodology}
            icon={Users}
          />
          <ImpactRow
            label="Gain vs conventionnel"
            value={`+${eco.revenueIncrease}%`}
            sourceBadge="📊 Modèle EthiMarket"
            subtext="Revenu net garanti supérieur au prix du marché"
            methodology={eco.methodology}
            icon={Globe}
          />
          <ImpactRow
            label="Prime développement"
            value={`${eco.fairtradePremuim.toLocaleString('fr-FR')} €`}
            sourceBadge="📊 Modèle EthiMarket"
            subtext="Fonds géré directement par la coopérative"
            methodology={eco.methodology}
            icon={ShieldCheck}
          />
        </ImpactCard>

        {/* 3. Social */}
        <ImpactCard
          icon={Heart}
          title="Impact Social & Emploi"
          subtitle="Méthode : UN SDG Framework 2030"
          color="amber"
        >
          <ImpactRow
            label="Emplois soutenus"
            value={`${soc.jobsSupported} personne(s)`}
            sourceBadge={soc.inputs.dataSource}
            subtext="Emplois agricoles décents et locaux"
            methodology={soc.methodology}
            icon={Users}
          />
          <ImpactRow
            label="Formation technique"
            value={`${soc.trainingHours} heure(s)`}
            sourceBadge="📊 Modèle EthiMarket"
            subtext="Budget dédié aux bonnes pratiques"
            methodology={soc.methodology}
            icon={GraduationCap}
          />
          <ImpactRow
            label="Fonds Éducation"
            value={`${soc.educationContribution.toLocaleString('fr-FR')} €`}
            sourceBadge="📊 Modèle EthiMarket"
            subtext={`Soutient ~${soc.childrenImpacted} enfant(s)`}
            methodology={soc.methodology}
            icon={Heart}
          />
          <ImpactRow
            label="Garanties sociales"
            value={soc.healthCoverage ? 'Couverture Santé' : 'Garanties de base'}
            sourceBadge="📊 Données producteur"
            subtext="Assurance maladie & congés payés"
            methodology={soc.methodology}
            icon={ShieldCheck}
          />
        </ImpactCard>
      </div>

      {/* Global Disclaimer */}
      <div className="mt-8 bg-gray-50 rounded-2xl p-4 border border-gray-200 text-center text-xs text-gray-600 font-medium leading-relaxed">
        <p>
          ⚖️ <span className="font-bold text-gray-800">Avertissement de transparence :</span> Les impacts sont calculés sur la base des données déclarées par le producteur et des facteurs d'émission reconnus internationalement (ADEME Base Carbone®, GHG Protocol, Water Footprint Network, IBAT & FAO). Les résultats sont des estimations indicatives auditables.
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
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{title}</h3>
            <p className="text-[10px] text-gray-500 font-medium">{subtitle}</p>
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
  sourceBadge,
  subtext,
  methodology,
  icon: Icon,
}: {
  label: string;
  value: string;
  sourceBadge?: string;
  subtext?: string;
  methodology?: string;
  icon?: typeof Sprout;
}) {
  return (
    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700 inline-flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
          {label}
        </span>
        <span className="text-xs font-black text-gray-900 text-right">{value}</span>
      </div>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        {subtext && <p className="text-[10px] text-gray-500">{subtext}</p>}
        {sourceBadge && (
          <span className="text-[9px] font-bold text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap ml-auto">
            {sourceBadge}
          </span>
        )}
      </div>

      {methodology && (
        <p className="text-[9px] text-gray-400 italic border-t border-gray-100 pt-1 mt-1 flex items-center gap-1">
          <Info className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
          <span>Méthode: {methodology}</span>
        </p>
      )}
    </div>
  );
}
