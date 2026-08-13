import { CheckCircle2, Circle } from 'lucide-react';

export interface VerificationChecklistState {
  identityVerified: boolean;
  businessDocsCompliant: boolean;
  certificationValid: boolean;
  farmPhotosCoherent: boolean;
  ethicalEngagementSatisfactory: boolean;
  charterSigned: boolean;
}

interface VerificationChecklistProps {
  state: VerificationChecklistState;
  onChange: (state: VerificationChecklistState) => void;
  disabled?: boolean;
}

export function VerificationChecklist({ state, onChange, disabled = false }: VerificationChecklistProps) {
  const items = [
    { key: 'identityVerified', label: 'Identité vérifiée (CNI / Passeport officiel en cours de validité)' },
    { key: 'businessDocsCompliant', label: 'Documents entreprise conformes (Registre du commerce / Statuts)' },
    { key: 'certificationValid', label: 'Au moins 1 certification valide (Bio / Fairtrade / Rainforest)' },
    { key: 'farmPhotosCoherent', label: 'Photos exploitation et coordonnées GPS cohérentes' },
    { key: 'ethicalEngagementSatisfactory', label: 'Engagement éthique satisfaisant (Salaire min, absence travail des enfants)' },
    { key: 'charterSigned', label: 'Charte éthique EthiMarket signée' },
  ] as const;

  const toggle = (key: keyof VerificationChecklistState) => {
    if (disabled) return;
    onChange({
      ...state,
      [key]: !state[key],
    });
  };

  const completedCount = Object.values(state).filter(Boolean).length;
  const total = items.length;
  const isAllChecked = completedCount === total;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <span>📋</span> Checklist de vérification Bureau Veritas
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Cochez les critères validés avant de soumettre la décision finale.
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          isAllChecked ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {completedCount}/{total} valides
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map(item => {
          const checked = state[item.key as keyof VerificationChecklistState];
          return (
            <button
              key={item.key}
              type="button"
              disabled={disabled}
              onClick={() => toggle(item.key as keyof VerificationChecklistState)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                checked
                  ? 'bg-brand-50/50 border-brand-200 text-gray-900'
                  : 'bg-gray-50/50 border-gray-100 text-gray-600 hover:border-gray-200'
              } ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
            >
              {checked ? (
                <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
              )}
              <span className={`text-xs font-semibold ${checked ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
