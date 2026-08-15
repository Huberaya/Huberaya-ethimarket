// src/components/search/SavedSearchesModal.tsx
// Modal for saving searches, managing buyer alerts, and reloading previous search configurations

import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Bell,
  X,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';
import { StructuredFilters } from '../../lib/productSearchEngine';
import { SavedSearch, SavedSearchesService } from '../../lib/savedSearchesService';

interface SavedSearchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuery: string;
  currentFilters: StructuredFilters;
  onApplySavedSearch: (query: string, filters: StructuredFilters) => void;
  userId?: string;
}

export const SavedSearchesModal: React.FC<SavedSearchesModalProps> = ({
  isOpen,
  onClose,
  currentQuery,
  currentFilters,
  onApplySavedSearch,
  userId
}) => {
  const [activeTab, setActiveTab] = useState<'save_current' | 'history'>('save_current');
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly' | 'none'>('weekly');
  const [savedList, setSavedList] = useState<SavedSearch[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSearches();
      if (!title) {
        setTitle(currentQuery ? `Recherche : ${currentQuery}` : 'Veille catalogue sur-mesure');
      }
    }
  }, [isOpen, currentQuery]);

  const loadSearches = async () => {
    const list = await SavedSearchesService.getSavedSearches(userId);
    setSavedList(list);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await SavedSearchesService.saveSearch(title, currentQuery, currentFilters, frequency, userId);
    setSavedSuccess(true);
    await loadSearches();
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('history');
    }, 1200);
  };

  const handleDelete = async (id: string) => {
    await SavedSearchesService.deleteSavedSearch(id, userId);
    setSavedList(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateFreq = async (id: string, newFreq: 'instant' | 'daily' | 'weekly' | 'none') => {
    await SavedSearchesService.updateFrequency(id, newFreq, userId);
    setSavedList(prev => prev.map(s => (s.id === id ? { ...s, alert_frequency: newFreq } : s)));
  };

  if (!isOpen) return null;

  return (
    <div
      id="saved-searches-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">
                Recherches & Alertes Nouveautés
              </h3>
              <p className="text-xs text-neutral-500">
                Sauvegardez vos critères pour être alerté des nouveaux produits arrivants
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 px-5 pt-3 gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('save_current')}
            className={`pb-3 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'save_current'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enregistrer la recherche active</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Mes alertes & sauvegardes ({savedList.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'save_current' ? (
            <form onSubmit={handleSave} className="space-y-4">
              {savedSuccess ? (
                <div className="p-8 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <div className="font-bold text-emerald-900 text-sm">
                    Recherche enregistrée avec succès !
                  </div>
                  <div className="text-xs text-emerald-700">
                    Vous recevrez des notifications selon la fréquence choisie.
                  </div>
                </div>
              ) : (
                <>
                  {/* Current search preview */}
                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-1.5">
                    <div className="font-semibold text-neutral-700 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Requête : {currentQuery || 'Tous les produits (catalogue complet)'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[11px] text-neutral-500">
                      {currentFilters.certifications?.map(c => (
                        <span key={c} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                          ✓ {c}
                        </span>
                      ))}
                      {currentFilters.countries?.map(c => (
                        <span key={c} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                          🌍 {c}
                        </span>
                      ))}
                      {currentFilters.maxPrice !== undefined && (
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold">
                          💰 ≤ {currentFilters.maxPrice} €
                        </span>
                      )}
                      {currentFilters.isVegan && <span className="bg-neutral-200 px-2 py-0.5 rounded">Vegan</span>}
                      {currentFilters.livingWage && <span className="bg-neutral-200 px-2 py-0.5 rounded">Salaire décent</span>}
                    </div>
                  </div>

                  {/* Title input */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Nom de la recherche / de l'alerte
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Ex: T-shirts coton bio Europe à moins de 15€"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Frequency radio buttons */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Fréquence d'alerte email pour les nouveaux produits
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'weekly', label: 'Hebdomadaire', desc: '1 email récapitulatif / semaine' },
                        { id: 'daily', label: 'Quotidien', desc: '1 email par jour si nouveautés' },
                        { id: 'instant', label: 'Instantané', desc: 'Dès publication d\'un nouveau lot' },
                        { id: 'none', label: 'Désactivé', desc: 'Recherche sauvegardée sans alertes' }
                      ].map(opt => (
                        <label
                          key={opt.id}
                          className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                            frequency === opt.id
                              ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500'
                              : 'border-neutral-200 hover:border-neutral-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-neutral-900">{opt.label}</span>
                            <input
                              type="radio"
                              name="frequency"
                              checked={frequency === opt.id}
                              onChange={() => setFrequency(opt.id as any)}
                              className="w-3.5 h-3.5 accent-emerald-600"
                            />
                          </div>
                          <span className="text-[11px] text-neutral-500">{opt.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>Enregistrer et activer l'alerte</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            /* History List */
            <div className="space-y-3">
              {savedList.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 space-y-2">
                  <Bookmark className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs">Aucune recherche sauvegardée pour le moment.</p>
                </div>
              ) : (
                savedList.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-neutral-200 bg-white hover:border-emerald-400 transition shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-neutral-900 text-sm">{item.title}</h4>
                        {item.query && (
                          <div className="text-xs text-neutral-500 italic mt-0.5">
                            "{item.query}"
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onApplySavedSearch(item.query, item.filters);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          title="Lancer cette recherche"
                        >
                          <Play className="w-3 h-3" />
                          <span>Lancer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Frequency selector pill */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                      <span className="text-[11px] text-neutral-400">
                        Créée le {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                        <Bell className="w-3 h-3 text-neutral-400" />
                        <select
                          value={item.alert_frequency}
                          onChange={e => handleUpdateFreq(item.id, e.target.value as any)}
                          className="text-[11px] bg-neutral-100 border-none rounded px-2 py-0.5 font-medium text-neutral-700 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="weekly">Alerte : Hebdomadaire</option>
                          <option value="daily">Alerte : Quotidienne</option>
                          <option value="instant">Alerte : Instantanée</option>
                          <option value="none">Alerte : Désactivée</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
