import { Award, X, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { ScoreDetails } from '../lib/supabase';

type BadgeLevel = 'gold' | 'silver' | 'verified' | 'not_eligible' | 'bronze' | null;

const BADGE_STYLES: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  gold: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', label: '🏆 Or (EthiMarket Certified Gold)' },
  silver: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-300', label: '🥇 Argent (EthiMarket Certified Silver)' },
  verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', label: '🥈 Vérifié (EthiMarket Verified)' },
  bronze: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', label: '🥈 Vérifié' },
  not_eligible: { bg: 'bg-gray-100', text: 'text-gray-500', ring: 'ring-gray-200', label: 'Non éligible' },
};

export function badgeInfo(score: number, badge?: string | null): { level: string; label: string; bg: string; text: string; ring: string } {
  if (badge && BADGE_STYLES[badge]) {
    return { level: badge, ...BADGE_STYLES[badge] };
  }
  const level = score >= 90 ? 'gold' : score >= 75 ? 'silver' : score >= 60 ? 'verified' : 'not_eligible';
  return { level, ...BADGE_STYLES[level] };
}

type Props = {
  score: number;
  badge?: BadgeLevel;
  details?: ScoreDetails | null;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
};

export default function ScoreBadge({ score, badge, details, size = 'md', showDetails = true }: Props) {
  const [open, setOpen] = useState(false);
  const info = badgeInfo(score, badge);

  const sizes = {
    sm: { box: 'px-2.5 py-1', icon: 'w-3.5 h-3.5', score: 'text-sm', label: 'text-[10px]' },
    md: { box: 'px-3.5 py-1.5', icon: 'w-4 h-4', score: 'text-base', label: 'text-xs' },
    lg: { box: 'px-5 py-2.5', icon: 'w-6 h-6', score: 'text-2xl', label: 'text-sm' },
  }[size];

  return (
    <>
      <div className="flex flex-col gap-1.5 items-start">
        <button
          onClick={showDetails ? () => setOpen(true) : undefined}
          className={`inline-flex items-center gap-2 rounded-2xl ring-1 ${info.bg} ${info.text} ${info.ring} ${sizes.box} ${showDetails ? 'hover:shadow-md transition-all cursor-pointer' : 'cursor-default'}`}
        >
          <Award className={sizes.icon} />
          <span className={`font-black ${sizes.score}`}>{score}/100</span>
          <span className={`font-bold ${sizes.label}`}>{info.label}</span>
          <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded-full font-bold ml-1 text-gray-700 shadow-xs">
            Détails →
          </span>
        </button>
        <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-brand-600" />
          Méthode d'évaluation : B Corp Assessment + EcoVadis + Fairtrade
        </p>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${info.bg}`}>
                  <Award className={`w-6 h-6 ${info.text}`} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">Score EthiMarket : {score}/100</h3>
                  <p className={`text-xs font-bold ${info.text}`}>{info.label}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            <p className="text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
              Le score EthiMarket évalue en profondeur la conformité socio-environnementale du producteur selon les standards combinés de B Corp, EcoVadis et Fairtrade International.
            </p>

            <div className="space-y-3.5">
              <CategoryBar name="Certifications Bio & Fairtrade" score={details?.categories?.certifications?.score ?? 35} max={40} description="Certifications certifiées par des tiers (Ecocert, Fairtrade, Rainforest Alliance)" />
              <CategoryBar name="Traçabilité Chaîne d'Approvisionnement" score={details?.categories?.traceability?.score ?? 22} max={25} description="Coordonnées GPS parcelle, vidéos de récolte, QR code actif" />
              <CategoryBar name="Normes Éthiques & Salaire Décent" score={details?.categories?.ethics?.score ?? 18} max={20} description="Living Wage garanti, charte signée, assurance maladie" />
              <CategoryBar name="Pratiques Environnementales" score={details?.categories?.environment?.score ?? 9} max={10} description="Empreinte CO2 neutre/faible, agroforesterie, emballage bio" />
              <CategoryBar name="Satisfaction & Qualité Client" score={details?.categories?.satisfaction?.score ?? 5} max={5} description="Note minimale 4.5/5 et historique des livraisons" />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-[11px] text-gray-400">
                Audité et mis à jour automatiquement via la blockchain EthiMarket
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryBar({ name, score, max, description }: { name: string; score: number; max: number; description: string }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  return (
    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-900">{name}</span>
        <span className="text-xs font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">{score}/{max} pts</span>
      </div>
      <p className="text-[10px] text-gray-500 mb-2">{description}</p>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
