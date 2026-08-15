import { useState } from 'react';
import { ChevronDown, Check, Sparkles, Plus, Search, ShieldCheck } from 'lucide-react';
import { CertificationBody } from '../../lib/supabase';
import { MatchingEvaluation } from '../../lib/certificationMatchingService';
import MatchingQualityBadge from './MatchingQualityBadge';

interface BodyAlternativeSelectorProps {
  currentBody: CertificationBody | null;
  alternatives: MatchingEvaluation[];
  onSelectBody: (body: CertificationBody) => void;
  onOpenManualSearch?: () => void;
  onAddNewBody?: () => void;
  fuzzyCorrectionSuggestion?: string;
  onApplyCorrection?: (standardName: string) => void;
}

export default function BodyAlternativeSelector({
  currentBody,
  alternatives,
  onSelectBody,
  onOpenManualSearch,
  onAddNewBody,
  fuzzyCorrectionSuggestion,
  onApplyCorrection
}: BodyAlternativeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Fuzzy Correction Banner if a typo was detected */}
      {fuzzyCorrectionSuggestion && onApplyCorrection && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Suggestion intelligente : voulez-vous cibler le standard officiel <strong>« {fuzzyCorrectionSuggestion} »</strong> ?
            </span>
          </div>
          <button
            type="button"
            onClick={() => onApplyCorrection(fuzzyCorrectionSuggestion)}
            className="ml-3 px-2.5 py-1 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors shrink-0 shadow-2xs"
          >
            Appliquer
          </button>
        </div>
      )}

      {/* Main Selected Body Card with switch toggle */}
      <div className="border border-brand-200 bg-brand-50/40 rounded-2xl p-4 transition-all hover:border-brand-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white border border-brand-100 flex items-center justify-center font-black text-brand-700 text-sm shadow-2xs shrink-0">
              {currentBody ? currentBody.acronym.slice(0, 4) : 'CB'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-gray-900 text-sm truncate">
                  {currentBody ? currentBody.name : 'Aucun organisme sélectionné'}
                </h4>
                {currentBody && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-brand-600" />
                    {currentBody.trust_level}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-2">
                <span>📍 {currentBody ? `${currentBody.country} (${currentBody.region})` : 'N/A'}</span>
                <span>•</span>
                <span>🗣️ {currentBody ? currentBody.languages.join(', ').toUpperCase() : 'N/A'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-white border border-brand-200 hover:bg-brand-50 rounded-xl transition-colors shrink-0 shadow-2xs"
          >
            <span>{alternatives.length > 0 ? `${alternatives.length} Alternative${alternatives.length > 1 ? 's' : ''}` : 'Changer'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown list of alternative matched bodies */}
        {isOpen && (
          <div className="mt-4 pt-4 border-t border-brand-100 space-y-2.5 animate-fadeIn">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Autres organismes pertinents (classés par score) :
            </p>

            {alternatives.length === 0 ? (
              <div className="p-3 bg-white rounded-xl border border-gray-100 text-xs text-gray-500 text-center">
                Aucune autre alternative automatique avec un score suffisant.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {alternatives.map((alt) => {
                  const isSelected = currentBody?.id === alt.body.id;
                  return (
                    <button
                      key={alt.body.id}
                      type="button"
                      onClick={() => {
                        onSelectBody(alt.body);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-brand-500 text-white border-brand-600 shadow-xs'
                          : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {alt.body.acronym.slice(0, 3)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate">{alt.body.name}</p>
                          <p className={`text-[11px] truncate ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                            📍 {alt.body.country} • {alt.body.region}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <MatchingQualityBadge
                          quality={alt.quality}
                          score={alt.totalScore}
                          size="sm"
                          showScore={true}
                        />
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Actions inside selector */}
            <div className="flex items-center justify-between pt-2 text-xs border-t border-gray-100">
              {onOpenManualSearch && (
                <button
                  type="button"
                  onClick={onOpenManualSearch}
                  className="text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  Rechercher dans tout l'annuaire (105+ CB)
                </button>
              )}
              {onAddNewBody && (
                <button
                  type="button"
                  onClick={onAddNewBody}
                  className="text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter un organisme
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
