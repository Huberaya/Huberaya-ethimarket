import { CheckCircle2, AlertCircle, Globe, Building2 } from 'lucide-react';
import { MatchQuality } from '../../lib/certificationMatchingService';

interface MatchingQualityBadgeProps {
  quality: MatchQuality;
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  reasons?: string[];
}

export default function MatchingQualityBadge({
  quality,
  score,
  showScore = true,
  size = 'md',
  reasons = []
}: MatchingQualityBadgeProps) {
  const getBadgeConfig = () => {
    switch (quality) {
      case 'perfect':
        return {
          label: 'Correspondance Parfaite',
          subLabel: 'Bureau National',
          bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dotColor: 'bg-emerald-500',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600'
        };
      case 'regional':
        return {
          label: 'Correspondance Régionale',
          subLabel: 'Bureau Régional',
          bgColor: 'bg-amber-50 text-amber-800 border-amber-300',
          dotColor: 'bg-amber-500',
          icon: Globe,
          iconColor: 'text-amber-600'
        };
      case 'continental':
        return {
          label: 'Antenne Continentale',
          subLabel: 'Bureau Continental',
          bgColor: 'bg-blue-50 text-blue-800 border-blue-300',
          dotColor: 'bg-blue-500',
          icon: Building2,
          iconColor: 'text-blue-600'
        };
      case 'hq':
        return {
          label: 'Siège International',
          subLabel: 'Secrétariat Mondial',
          bgColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
          dotColor: 'bg-indigo-500',
          icon: Building2,
          iconColor: 'text-indigo-600'
        };
      case 'none':
      default:
        return {
          label: 'Aucun match direct',
          subLabel: 'Saisie Manuelle Requise',
          bgColor: 'bg-rose-50 text-rose-800 border-rose-300',
          dotColor: 'bg-rose-500',
          icon: AlertCircle,
          iconColor: 'text-rose-600'
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2 gap-1.5',
    md: 'text-xs py-1 px-2.5 gap-2',
    lg: 'text-sm py-1.5 px-3 gap-2.5'
  }[size];

  return (
    <div className="relative group inline-flex items-center">
      <span
        className={`inline-flex items-center font-medium rounded-full border shadow-2xs transition-colors ${config.bgColor} ${sizeClasses}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`} />
        <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
        <span>{config.label}</span>
        {showScore && score > 0 && (
          <span className="font-bold opacity-90 border-l border-current/20 pl-1.5 ml-0.5">
            {score}%
          </span>
        )}
      </span>

      {/* Tooltip on hover if reasons exist */}
      {reasons.length > 0 && (
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl border border-gray-800 pointer-events-none transition-opacity duration-200">
          <p className="font-semibold text-gray-200 mb-1.5 flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-brand-400" />
            Critères de matching ({score}%) :
          </p>
          <ul className="space-y-1 text-gray-300">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-brand-400 mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
