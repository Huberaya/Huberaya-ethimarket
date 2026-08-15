// src/components/search/AdvancedFiltersSidebar.tsx
// Comprehensive Multi-criteria Faceted Filter Sidebar

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Bookmark,
  ShieldCheck,
  Globe,
  Leaf,
  Users,
  CreditCard,
  Award,
  Check
} from 'lucide-react';
import { StructuredFilters } from '../../lib/productSearchEngine';
import { Product } from '../../lib/supabase';

interface AdvancedFiltersSidebarProps {
  filters: StructuredFilters;
  onFilterChange: (newFilters: StructuredFilters) => void;
  onResetFilters: () => void;
  onSaveSearchModalOpen: () => void;
  catalogProducts: Product[];
  totalResultsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const AVAILABLE_CERTIFICATIONS = [
  { id: 'Bio', label: 'Agriculture Biologique (AB / Bio UE / USDA)', icon: '🌱' },
  { id: 'Commerce Équitable', label: 'Commerce Équitable (Fairtrade / WFTO)', icon: '🤝' },
  { id: 'GOTS', label: 'GOTS (Global Organic Textile Standard)', icon: '👕' },
  { id: 'OEKO-TEX', label: 'OEKO-TEX Standard 100', icon: '🧵' },
  { id: 'FSC', label: 'FSC / PEFC (Forêt Durable)', icon: '🌲' },
  { id: 'Rainforest Alliance', label: 'Rainforest Alliance / UTZ', icon: '🐸' },
  { id: 'Demeter', label: 'Demeter (Biodynamie)', icon: '✨' },
  { id: 'Cruelty-Free', label: 'Cruelty-Free / Leaping Bunny', icon: '🐰' }
];

const AVAILABLE_COUNTRIES = [
  { code: 'France', label: 'France', flag: '🇫🇷' },
  { code: 'Colombie', label: 'Colombie', flag: '🇨🇴' },
  { code: 'Pérou', label: 'Pérou', flag: '🇵🇪' },
  { code: 'Madagascar', label: 'Madagascar', flag: '🇲🇬' },
  { code: 'Italie', label: 'Italie', flag: '🇮🇹' },
  { code: 'Espagne', label: 'Espagne', flag: '🇪🇸' },
  { code: 'Portugal', label: 'Portugal', flag: '🇵🇹' },
  { code: 'Éthiopie', label: 'Éthiopie', flag: '🇪🇹' }
];

export const AdvancedFiltersSidebar: React.FC<AdvancedFiltersSidebarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onSaveSearchModalOpen,
  catalogProducts,
  totalResultsCount,
  isOpenMobile,
  onCloseMobile
}) => {
  // Collapsible section states
  const [openSections, setOpenSections] = useState({
    certs: true,
    origin: true,
    environment: true,
    social: true,
    commercial: true,
    quality: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCertToggle = (cert: string) => {
    const current = filters.certifications || [];
    const next = current.includes(cert)
      ? current.filter(c => c !== cert)
      : [...current, cert];
    onFilterChange({ ...filters, certifications: next.length > 0 ? next : undefined });
  };

  const handleCountryToggle = (country: string) => {
    const current = filters.countries || [];
    const next = current.includes(country)
      ? current.filter(c => c !== country)
      : [...current, country];
    onFilterChange({ ...filters, countries: next.length > 0 ? next : undefined });
  };

  // Helper count badges
  const getCertCount = (cert: string) => {
    return catalogProducts.filter(p => (p.certifications || []).includes(cert)).length;
  };

  const getCountryCount = (country: string) => {
    return catalogProducts.filter(p => p.country === country).length;
  };

  return (
    <aside
      id="advanced-filters-sidebar"
      className={`bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-6 ${
        isOpenMobile ? 'fixed inset-4 z-50 overflow-y-auto' : 'hidden lg:block'
      }`}
    >
      {/* Header with Title, Reset & Save Search */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div>
          <h2 className="font-bold text-neutral-900 text-base flex items-center gap-2">
            <span>Filtres multicritères</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {totalResultsCount} produits
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-reset-filters"
            type="button"
            onClick={onResetFilters}
            className="text-xs text-neutral-500 hover:text-rose-600 flex items-center gap-1 font-medium p-1 transition"
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Effacer</span>
          </button>
          {isOpenMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden text-xs bg-neutral-900 text-white px-3 py-1 rounded-lg font-medium"
            >
              Appliquer
            </button>
          )}
        </div>
      </div>

      {/* Button: Sauvegarder cette recherche */}
      <button
        id="btn-save-search"
        type="button"
        onClick={onSaveSearchModalOpen}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition"
      >
        <Bookmark className="w-4 h-4 text-emerald-600" />
        <span>Sauvegarder cette recherche</span>
      </button>

      {/* 1. SECTION: CERTIFICATIONS & LABELS */}
      <div className="border-b border-neutral-100 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('certs')}
          className="w-full flex items-center justify-between font-semibold text-sm text-neutral-900 mb-3"
        >
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            Certifications & Labels
          </span>
          {openSections.certs ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>

        {openSections.certs && (
          <div className="space-y-2">
            {AVAILABLE_CERTIFICATIONS.map(cert => {
              const checked = (filters.certifications || []).includes(cert.id);
              const count = getCertCount(cert.id);
              return (
                <label
                  key={cert.id}
                  className="flex items-center justify-between text-xs text-neutral-700 hover:text-neutral-900 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCertToggle(cert.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>{cert.icon} {cert.label}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium px-1.5 py-0.5 rounded bg-neutral-50 group-hover:bg-neutral-100">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. SECTION: ORIGINE GÉOGRAPHIQUE */}
      <div className="border-b border-neutral-100 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('origin')}
          className="w-full flex items-center justify-between font-semibold text-sm text-neutral-900 mb-3"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Origine & Fabrication
          </span>
          {openSections.origin ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>

        {openSections.origin && (
          <div className="space-y-2">
            {AVAILABLE_COUNTRIES.map(country => {
              const checked = (filters.countries || []).includes(country.code);
              const count = getCountryCount(country.code);
              return (
                <label
                  key={country.code}
                  className="flex items-center justify-between text-xs text-neutral-700 hover:text-neutral-900 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCountryToggle(country.code)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>{country.flag} {country.label}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium px-1.5 py-0.5 rounded bg-neutral-50 group-hover:bg-neutral-100">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SECTION: IMPACT ENVIRONNEMENTAL */}
      <div className="border-b border-neutral-100 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('environment')}
          className="w-full flex items-center justify-between font-semibold text-sm text-neutral-900 mb-3"
        >
          <span className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            Impact Environnemental
          </span>
          {openSections.environment ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>

        {openSections.environment && (
          <div className="space-y-3.5 text-xs">
            {/* Max CO2 Slider */}
            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>Empreinte carbone max :</span>
                <span className="font-bold text-emerald-700">
                  {filters.maxCo2 !== undefined ? `${filters.maxCo2} kg CO2` : 'Toutes'}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={filters.maxCo2 || 10}
                onChange={e => onFilterChange({ ...filters, maxCo2: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* Toggles */}
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-neutral-700">100% Végane</span>
              <input
                type="checkbox"
                checked={filters.isVegan || false}
                onChange={e => onFilterChange({ ...filters, isVegan: e.target.checked || undefined })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-neutral-700">Matières recyclées / Upcyclées</span>
              <input
                type="checkbox"
                checked={filters.isRecycled || false}
                onChange={e => onFilterChange({ ...filters, isRecycled: e.target.checked || undefined })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-neutral-700">Emballage sans plastique</span>
              <input
                type="checkbox"
                checked={filters.plasticFree || false}
                onChange={e => onFilterChange({ ...filters, plasticFree: e.target.checked || undefined })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
            </label>
          </div>
        )}
      </div>

      {/* 4. SECTION: IMPACT SOCIAL */}
      <div className="border-b border-neutral-100 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('social')}
          className="w-full flex items-center justify-between font-semibold text-sm text-neutral-900 mb-3"
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Impact Social & Travail
          </span>
          {openSections.social ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>

        {openSections.social && (
          <div className="space-y-2.5 text-xs">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-neutral-700">Salaire décent garanti</span>
              <input
                type="checkbox"
                checked={filters.livingWage || false}
                onChange={e => onFilterChange({ ...filters, livingWage: e.target.checked || undefined })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-neutral-700">Coopérative de producteurs</span>
              <input
                type="checkbox"
                checked={filters.isCooperative || false}
                onChange={e => onFilterChange({ ...filters, isCooperative: e.target.checked || undefined })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
            </label>
          </div>
        )}
      </div>

      {/* 5. SECTION: CONDITIONS COMMERCIALES */}
      <div className="border-b border-neutral-100 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('commercial')}
          className="w-full flex items-center justify-between font-semibold text-sm text-neutral-900 mb-3"
        >
          <span className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            Prix & Disponibilité
          </span>
          {openSections.commercial ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>

        {openSections.commercial && (
          <div className="space-y-3.5 text-xs">
            {/* Max Price Slider */}
            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>Prix max :</span>
                <span className="font-bold text-neutral-900">
                  {filters.maxPrice !== undefined ? `${filters.maxPrice} €` : 'Illimité'}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={filters.maxPrice || 200}
                onChange={e => onFilterChange({ ...filters, maxPrice: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* In stock only */}
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-neutral-700">En stock uniquement</span>
              <input
                type="checkbox"
                checked={filters.inStockOnly || false}
                onChange={e => onFilterChange({ ...filters, inStockOnly: e.target.checked || undefined })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
            </label>
          </div>
        )}
      </div>

      {/* 6. SECTION: CONFIANCE & TRAÇABILITÉ */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('quality')}
          className="w-full flex items-center justify-between font-semibold text-sm text-neutral-900 mb-3"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Confiance & Traçabilité
          </span>
          {openSections.quality ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>

        {openSections.quality && (
          <div className="space-y-3 text-xs">
            {/* Minimum Trust Score */}
            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>Score de confiance min :</span>
                <span className="font-bold text-emerald-700">
                  {filters.minConfidenceScore || 0}/100
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="95"
                step="5"
                value={filters.minConfidenceScore || 0}
                onChange={e => onFilterChange({ ...filters, minConfidenceScore: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* Full Traceability */}
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-neutral-700">Traçabilité complète (QR / GPS)</span>
              <input
                type="checkbox"
                checked={filters.fullTraceability || false}
                onChange={e => onFilterChange({ ...filters, fullTraceability: e.target.checked || undefined })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
            </label>
          </div>
        )}
      </div>
    </aside>
  );
};
