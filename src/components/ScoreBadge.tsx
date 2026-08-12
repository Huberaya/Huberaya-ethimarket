import { Award, X } from 'lucide-react';
import { useState } from 'react';
import type { ScoreDetails } from '../lib/supabase';

type BadgeLevel = 'bronze' | 'silver' | 'gold' | null;

const BADGE_STYLES: Record<NonNullable<BadgeLevel>, { bg: string; text: string; ring: string; label: string }> = {
  gold: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', label: 'Certifié Or' },
  silver: { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-300', label: 'Certifié Argent' },
  bronze: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', label: 'Vérifié Bronze' },
};

export function badgeInfo(score: number): { level: BadgeLevel; label: string; bg: string; text: string; ring: string } {
  const level: BadgeLevel = score >= 90 ? 'gold' : score >= 75 ? 'silver' : score >= 60 ? 'bronze' : null;
  if (!level) return { level: null, label: 'Non éligible', bg: 'bg-gray-100', text: 'text-gray-500', ring: 'ring-gray-200' };
  return { level, ...BADGE_STYLES[level] };
}

type Props = {
  score: number;
  badge: BadgeLevel;
  details?: ScoreDetails | null;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
};

export default function ScoreBadge({ score, details, size = 'md', showDetails = true }: Props) {
  const [open, setOpen] = useState(false);
  const info = badgeInfo(score);
  const sizes = {
    sm: { box: 'px-2.5 py-1', icon: 'w-3.5 h-3.5', score: 'text-sm', label: 'text-[10px]' },
    md: { box: 'px-3.5 py-1.5', icon: 'w-4 h-4', score: 'text-base', label: 'text-xs' },
    lg: { box: 'px-5 py-2.5', icon: 'w-6 h-6', score: 'text-2xl', label: 'text-sm' },
  }[size];

  return (
    <>
      <button
        onClick={showDetails ? () => setOpen(true) : undefined}
        className={`inline-flex items-center gap-2 rounded-full ring-1 ${info.bg} ${info.text} ${info.ring} ${sizes.box} ${showDetails ? 'hover:shadow-sm transition-shadow cursor-pointer' : 'cursor-default'}`}
      >
        <Award className={sizes.icon} />
        <span className={`font-black ${sizes.score}`}>{score}/100</span>
        <span className={`font-semibold ${sizes.label} opacity-80`}>{info.label}</span>
      </button>

      {open && details && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${info.bg}`}>
                  <Award className={`w-6 h-6 ${info.text}`} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900">Score EthiMarket : {score}/100</h3>
                  <p className={`text-sm font-bold ${info.text}`}>{info.label}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              {Object.entries(details.categories).map(([key, cat]) => (
                <CategoryBar key={key} name={CATEGORY_LABELS[key]} score={cat.score} max={cat.max} />
              ))}
              {details.penalties.total < 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-sm font-semibold text-red-700">Pénalités actives</span>
                  <span className="text-sm font-black text-red-700">{details.penalties.total} pts</span>
                </div>
              )}
            </div>

            <a href="/score-ethimarket" className="block mt-5 text-center text-sm font-bold text-brand-600 hover:underline">
              En savoir plus sur le score EthiMarket →
            </a>
          </div>
        </div>
      )}
    </>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  certifications: 'Certifications',
  traceability: 'Traçabilité',
  ethics: 'Éthique',
  environment: 'Environnement',
  satisfaction: 'Satisfaction',
};

function CategoryBar({ name, score, max }: { name: string; score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-700">{name}</span>
        <span className="text-sm font-bold text-gray-900">{score}/{max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
