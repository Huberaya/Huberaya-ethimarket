import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Globe,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Send
} from 'lucide-react';
import { AdminPageHeader } from '../../components/AdminLayout';
import { getCertificationDashboardStats } from '../../lib/certificationVerificationService';
import type { CertificationDashboardStats, CertificationRegion } from '../../lib/supabase';
import { CERTIFICATION_REGIONS } from '../../lib/supabase';

// Régions mondiales avec libellés et drapeaux
const REGION_METADATA: Record<CertificationRegion, { labelFr: string; flag: string; color: string; bg: string; border: string }> = {
  'Africa': { labelFr: 'Afrique', flag: '🌍', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Asia': { labelFr: 'Asie', flag: '🌏', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  'Latin America': { labelFr: 'Amérique Latine', flag: '🌎', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Europe': { labelFr: 'Europe', flag: '🇪🇺', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  'North America': { labelFr: 'Amérique du Nord', flag: '🌎', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  'Oceania': { labelFr: 'Océanie', flag: '🌏', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  'Middle East': { labelFr: 'Moyen-Orient', flag: '🌍', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
};

// Configuration des segments de statut
const STATUS_SEGMENTS = [
  { key: 'verified', label: 'Vérifiées', color: 'bg-emerald-500', text: 'text-emerald-700', bgLight: 'bg-emerald-50' },
  { key: 'pending', label: 'En attente', color: 'bg-amber-500', text: 'text-amber-700', bgLight: 'bg-amber-50' },
  { key: 'contact_sent', label: 'Contact envoyé', color: 'bg-blue-500', text: 'text-blue-700', bgLight: 'bg-blue-50' },
  { key: 'unverified', label: 'Non vérifiées', color: 'bg-gray-400', text: 'text-gray-700', bgLight: 'bg-gray-100' },
  { key: 'manual_required', label: 'Action manuelle', color: 'bg-purple-500', text: 'text-purple-700', bgLight: 'bg-purple-50' },
  { key: 'rejected', label: 'Rejetées', color: 'bg-red-500', text: 'text-red-700', bgLight: 'bg-red-50' },
  { key: 'expired', label: 'Expirées', color: 'bg-orange-500', text: 'text-orange-700', bgLight: 'bg-orange-50' },
] as const;

export default function CertificationsDashboard() {
  const [stats, setStats] = useState<CertificationDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCertificationDashboardStats();
      if (res.error) {
        setError(res.error);
      } else {
        setStats(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Calculs KPI
  const pendingCount = stats ? (stats.unverified + stats.pending + stats.contact_sent) : 0;
  const actionRequiredCount = stats ? (stats.rejected + stats.expired + stats.manual_required) : 0;
  const verifiedRate = stats && stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Tableau de bord certifications"
        subtitle="Supervision mondiale des certifications et mise en relation automatique intelligente"
      >
        <button
          type="button"
          onClick={fetchStats}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 shadow-2xs transition-colors disabled:opacity-50"
          aria-label="Actualiser les données"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </AdminPageHeader>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm">Impossible de charger les statistiques</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchStats}
            className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Bannière Moteur de Redirection Intelligente */}
      <div className="bg-gradient-to-r from-emerald-900 via-brand-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Moteur de Matching Producteur ↔ Organisme Actif</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Redirection Automatique & Précision Géolocalisée
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Mise en correspondance multi-critères instantanée sur 105+ organismes accrédités et 25+ standards mondiaux avec tolérance phonétique et linguistique.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/admin/certifications/producers"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
              <span>Gérer les vérifications</span>
            </Link>
            <Link
              to="/admin/certifications/bodies"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm border border-white/20 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Annuaire organismes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Skeleton Loading */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          {/* Skeleton KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 h-28 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-300 rounded w-1/3" />
              </div>
            ))}
          </div>
          {/* Skeleton Progress */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 h-36 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      )}

      {!isLoading && stats && (
        <>
          {/* SECTION 1 — KPI Cards (Ligne de 4 cartes) */}
          <section aria-label="Indicateurs clés de performance" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Carte 1 : Total des certifications */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total certifications</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{stats.total}</p>
                <p className="text-xs text-gray-400 mt-0.5">Toutes régions confondues</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* Carte 2 : Taux de validation */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Taux de conformité</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{verifiedRate}%</p>
                <p className="text-xs text-emerald-700 mt-0.5">{stats.verified} vérifiées</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Carte 3 : Dossiers en cours */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">En cours de traitement</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{pendingCount}</p>
                <p className="text-xs text-amber-700 mt-0.5">Non vérifiées ou attente</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Carte 4 : Attention requise */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attention requise</p>
                <p className="text-2xl sm:text-3xl font-black text-red-600 mt-1">{actionRequiredCount}</p>
                <p className="text-xs text-red-700 mt-0.5">{stats.expired} expirées, {stats.rejected} rejetées</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </section>

          {/* SECTION 3 — Barre de progression globale des statuts */}
          <section aria-label="Répartition par statut" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-gray-900">État du parc des certifications</h2>
                <p className="text-xs text-gray-500 mt-0.5">Ventilation en temps réel selon les étapes d'audit</p>
              </div>
              <Link
                to="/admin/certifications/producers"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Voir toutes les certifications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Barre horizontale segmentée */}
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
              {stats.total === 0 ? (
                <div className="w-full h-full bg-gray-200" title="Aucune donnée" />
              ) : (
                STATUS_SEGMENTS.map(seg => {
                  const count = (stats as unknown as Record<string, number>)[seg.key] || 0;
                  const pct = (count / stats.total) * 100;
                  if (count === 0) return null;
                  return (
                    <div
                      key={seg.key}
                      style={{ width: `${pct}%` }}
                      className={`h-full ${seg.color} transition-all duration-500`}
                      title={`${seg.label}: ${count} (${Math.round(pct)}%)`}
                    />
                  );
                })
              )}
            </div>

            {/* Légende détaillée */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
              {STATUS_SEGMENTS.map(seg => {
                const count = (stats as unknown as Record<string, number>)[seg.key] || 0;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <Link
                    key={seg.key}
                    to={`/admin/certifications/producers?status=${seg.key}`}
                    className={`flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-gray-300 ${seg.bgLight} transition-all`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-3 h-3 rounded-full ${seg.color} shrink-0`} />
                      <span className={`text-xs font-bold ${seg.text} truncate`}>{seg.label}</span>
                    </div>
                    <span className="text-xs font-black text-gray-900 ml-2">
                      {count} <span className="text-[10px] font-normal text-gray-500">({pct}%)</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* SECTION 4 — Répartition par région */}
          <section aria-label="Répartition géographique des certifications" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-black text-gray-900">Répartition par région mondiale</h2>
              <p className="text-xs text-gray-500 mt-0.5">Distribution des certifications selon l'organisme d'attache</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {CERTIFICATION_REGIONS.map(regionKey => {
                const meta = REGION_METADATA[regionKey];
                const count = stats.by_region[regionKey] || 0;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

                return (
                  <Link
                    key={regionKey}
                    to={`/admin/certifications/producers?region=${encodeURIComponent(regionKey)}`}
                    className={`p-3.5 rounded-2xl border ${meta.border} ${meta.bg} hover:shadow-md transition-all flex flex-col justify-between group`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl" role="img" aria-label={meta.labelFr}>{meta.flag}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 text-gray-600 shadow-2xs">
                        {pct}%
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${meta.color} leading-tight truncate`}>{meta.labelFr}</p>
                      <p className="text-lg font-black text-gray-900 mt-1">{count}</p>
                      <p className="text-[10px] text-gray-500">certif{count > 1 ? 's' : ''}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* SECTION 5 — Raccourcis d'actions rapides */}
          <section aria-label="Raccourcis d'actions administratives" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/certifications/producers?status=pending"
              className="p-5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:border-brand-300 hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors flex items-center gap-1.5">
                  <span>Vérifier en attente</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Examiner et valider avec matching automatique les certifications soumises.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/certifications/bodies"
              className="p-5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:border-blue-300 hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <span>Gérer les organismes</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Consulter l'annuaire mondial des 105+ organismes, canaux API et formulaires.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/certifications/templates"
              className="p-5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:border-purple-300 hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors flex items-center gap-1.5">
                  <span>Templates multilingues</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Personnaliser les modèles de courriels et messages WhatsApp en 7 langues.
                </p>
              </div>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
