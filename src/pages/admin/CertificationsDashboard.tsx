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
  Calendar
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

  // Date limite dans 30 jours au format ISO pour le lien
  const in30DaysDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  // Calculs KPI
  const pendingCount = stats ? (stats.unverified + stats.pending + stats.contact_sent) : 0;
  const actionRequiredCount = stats ? (stats.rejected + stats.expired + stats.manual_required) : 0;
  const verifiedRate = stats && stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Tableau de bord certifications"
        subtitle="Supervision mondiale des certifications et labels éthiques des producteurs"
      >
        <button
          type="button"
          onClick={fetchStats}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 shadow-xs transition-colors disabled:opacity-50"
          aria-label="Actualiser les données"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </AdminPageHeader>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
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
          {/* Skeleton Grid */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && stats && (
        <>
          {/* SECTION 1 — KPI Cards (Ligne de 4 cartes) */}
          <section aria-label="Indicateurs clés de performance" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Carte 1 : Total des certifications */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total certifications</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{stats.total}</p>
                <p className="text-xs text-gray-400 mt-0.5">Toutes régions confondues</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* Carte 2 : En attente de vérification */}
            <Link
              to="/admin/certifications/producers?status=pending"
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">En attente de vérif.</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{pendingCount}</p>
                <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1 font-medium group-hover:underline">
                  <span>Examiner les dossiers</span>
                  <ArrowRight className="w-3 h-3" />
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </Link>

            {/* Carte 3 : Vérifiées et conformes */}
            <Link
              to="/admin/certifications/producers?status=verified"
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Vérifiées & Conformes</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{stats.verified}</p>
                <p className="text-xs text-emerald-600 mt-0.5 font-medium">{verifiedRate}% de taux de conformité</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </Link>

            {/* Carte 4 : Action requise */}
            <Link
              to="/admin/certifications/producers?status=manual_required"
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-red-300 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Action requise</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{actionRequiredCount}</p>
                <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1 font-medium group-hover:underline">
                  <span>Rejetées / Expirées / Manuel</span>
                  <ArrowRight className="w-3 h-3" />
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </Link>
          </section>

          {/* SECTION 2 — Alerte expiration imminente */}
          {stats.expiring_soon > 0 && (
            <div
              role="alert"
              className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-amber-950">
                    ⚠️ {stats.expiring_soon} certification{stats.expiring_soon > 1 ? 's' : ''} expire{stats.expiring_soon > 1 ? 'nt' : ''} dans moins de 30 jours
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Planifiez le renouvellement ou contactez les producteurs pour obtenir les certificats actualisés.
                  </p>
                </div>
              </div>
              <Link
                to={`/admin/certifications/producers?expires_before=${in30DaysDate}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                <span>Voir les certifications</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* SECTION 3 — Répartition par statut */}
          <section aria-label="Répartition des certifications par statut" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-gray-900">Répartition par statut</h2>
                <p className="text-xs text-gray-500 mt-0.5">Ventilation globale du portefeuille de certifications</p>
              </div>
              <span className="text-xs font-semibold text-gray-400">{stats.total} dossiers au total</span>
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
                      <span className={`w-3 h-3 rounded-full ${seg.color} flex-shrink-0`} />
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
          <section aria-label="Répartition géographique des certifications" className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
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
            {/* Raccourci 1 */}
            <Link
              to="/admin/certifications/producers?status=pending"
              className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-brand-300 hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors flex items-center gap-1.5">
                  <span>Vérifier en attente</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Examiner et valider en 1 clic les certifications soumises par les producteurs.
                </p>
              </div>
            </Link>

            {/* Raccourci 2 */}
            <Link
              to="/admin/certifications/bodies"
              className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <span>Gérer les organismes</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Consulter l'annuaire mondial des organismes, canaux API, contacts et formulaires.
                </p>
              </div>
            </Link>

            {/* Raccourci 3 */}
            <Link
              to="/admin/certifications/templates"
              className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors flex items-center gap-1.5">
                  <span>Templates de messages</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Personnaliser les modèles de courriels et messages WhatsApp multilingues.
                </p>
              </div>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
