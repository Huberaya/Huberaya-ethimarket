import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  Clock,
  Building2,
  AlertCircle,
  FileCheck2,
  ArrowUpDown
} from 'lucide-react';
import { AdminPageHeader } from '../../components/AdminLayout';
import CertificationStatusBadge from '../../components/admin/CertificationStatusBadge';
import ChannelBadge from '../../components/admin/ChannelBadge';
import OneClickVerificationButton from '../../components/admin/OneClickVerificationButton';
import { getProducerCertifications } from '../../lib/certificationVerificationService';
import { useAuth } from '../../lib/auth';
import type {
  ProducerCertification,
  ProducerCertificationStatus
} from '../../lib/supabase';
import {
  PRODUCER_CERTIFICATION_STATUSES,
  CERTIFICATION_REGIONS,
  CERTIFICATION_TYPES
} from '../../lib/supabase';

// Table des drapeaux pour les pays courants
const COUNTRY_FLAGS: Record<string, string> = {
  'France': '🇫🇷',
  'Côte d\'Ivoire': '🇨🇮',
  'Cote d\'Ivoire': '🇨🇮',
  'Ghana': '🇬🇭',
  'Madagascar': '🇲🇬',
  'Pérou': '🇵🇪',
  'Peru': '🇵🇪',
  'Colombie': '🇨🇴',
  'Colombia': '🇨🇴',
  'Brésil': '🇧🇷',
  'Brazil': '🇧🇷',
  'Maroc': '🇲🇦',
  'Tunisie': '🇹🇳',
  'Sénégal': '🇸🇳',
  'Senegal': '🇸🇳',
  'Vietnam': '🇻🇳',
  'Inde': '🇮🇳',
  'India': '🇮🇳',
  'Indonésie': '🇮🇩',
  'Indonesia': '🇮🇩',
  'Kenya': '🇰🇪',
  'Éthiopie': '🇪🇹',
  'Ethiopia': '🇪🇹',
  'Italie': '🇮🇹',
  'Espagne': '🇪🇸',
  'Allemagne': '🇩🇪',
  'Belgique': '🇧🇪',
  'Suisse': '🇨🇭',
  'Canada': '🇨🇦',
  'États-Unis': '🇺🇸',
  'USA': '🇺🇸',
  'Mexique': '🇲🇽',
  'Guatemala': '🇬🇹',
  'Costa Rica': '🇨🇷',
  'Équateur': '🇪🇨',
  'Ecuador': '🇪🇨',
  'Chine': '🇨🇳',
  'Japon': '🇯🇵',
  'Australie': '🇦🇺',
  'Nouvelle-Zélande': '🇳🇿'
};

const ITEMS_PER_PAGE = 20;

type SortField = 'status' | 'expires_at' | 'updated_at';
type SortOrder = 'asc' | 'desc';

export default function ProducerCertificationsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Filtres issus de l'URL
  const querySearch = searchParams.get('search') || '';
  const queryStatus = searchParams.get('status') || 'ALL';
  const queryRegion = searchParams.get('region') || 'ALL';
  const queryType = searchParams.get('type') || 'ALL';
  const queryExpiresBefore = searchParams.get('expires_before') || '';
  const queryExpiresAfter = searchParams.get('expires_after') || '';
  const queryPage = parseInt(searchParams.get('page') || '1', 10);

  // États locaux
  const [searchInput, setSearchInput] = useState(querySearch);
  const [certifications, setCertifications] = useState<ProducerCertification[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tri local
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Synchronisation délayée (débounce) de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== querySearch) {
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set('search', searchInput.trim());
          } else {
            next.delete('search');
          }
          next.set('page', '1');
          return next;
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, querySearch, setSearchParams]);

  // Chargement des données
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await getProducerCertifications(
        {
          status: queryStatus !== 'ALL' ? (queryStatus as ProducerCertificationStatus) : undefined,
          search: querySearch || undefined,
          expires_before: queryExpiresBefore || undefined,
          expires_after: queryExpiresAfter || undefined,
          country: undefined
        },
        queryPage,
        ITEMS_PER_PAGE
      );

      if (res.error) {
        setError(res.error);
        setCertifications([]);
        setTotalCount(0);
      } else {
        let items = res.data;

        // Filtrage côté client additionnel pour région et type si spécifiés
        if (queryRegion !== 'ALL') {
          items = items.filter(c => c.certification_body?.region === queryRegion);
        }
        if (queryType !== 'ALL') {
          items = items.filter(c => c.certification_type === queryType);
        }

        setCertifications(items);
        setTotalCount(res.count);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des certifications';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [queryStatus, querySearch, queryExpiresBefore, queryExpiresAfter, queryRegion, queryType, queryPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Gestion des modifications de filtres dans l'URL
  const handleFilterChange = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'ALL') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Basculement du tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Certifications triées
  const sortedCertifications = useMemo(() => {
    const list = [...certifications];
    list.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      if (sortField === 'status') {
        aVal = a.status || '';
        bVal = b.status || '';
      } else if (sortField === 'expires_at') {
        aVal = a.expires_at || '9999-12-31';
        bVal = b.expires_at || '9999-12-31';
      } else if (sortField === 'updated_at') {
        aVal = a.updated_at || '';
        bVal = b.updated_at || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [certifications, sortField, sortOrder]);

  // Export CSV
  const handleExportCSV = () => {
    if (certifications.length === 0) return;

    const headers = [
      'producteur',
      'pays',
      'numéro_certificat',
      'type_certification',
      'organisme',
      'région',
      'statut',
      'date_émission',
      'date_expiration',
      'dernière_action'
    ];

    const rows = sortedCertifications.map(c => [
      `"${(c.producer?.name || 'Inconnu').replace(/"/g, '""')}"`,
      `"${(c.producer?.country || c.country_of_issue || '').replace(/"/g, '""')}"`,
      `"${(c.certificate_number || '').replace(/"/g, '""')}"`,
      `"${c.certification_type || ''}"`,
      `"${(c.certification_body?.name || '').replace(/"/g, '""')}"`,
      `"${c.certification_body?.region || ''}"`,
      `"${c.status}"`,
      c.issued_at || '',
      c.expires_at || '',
      c.updated_at || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `certifications_ethimarket_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters =
    querySearch !== '' ||
    queryStatus !== 'ALL' ||
    queryRegion !== 'ALL' ||
    queryType !== 'ALL' ||
    queryExpiresBefore !== '' ||
    queryExpiresAfter !== '';

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1 — En-tête de page */}
      <AdminPageHeader
        title="Certifications producteurs"
        subtitle="Vérification et audit des certifications soumises par les producteurs"
      >
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700">
            {totalCount} certification{totalCount > 1 ? 's' : ''} au total
          </span>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={certifications.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </AdminPageHeader>

      {/* SECTION 2 — Barre de filtres */}
      <section aria-label="Filtres de recherche" className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filtre 1 : Recherche texte */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Numéro de certificat, nom..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Filtre 2 : Statut */}
          <div>
            <select
              value={queryStatus}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 font-medium text-gray-700"
            >
              <option value="ALL">Tous les statuts</option>
              {PRODUCER_CERTIFICATION_STATUSES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.labelFr}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre 3 : Région */}
          <div>
            <select
              value={queryRegion}
              onChange={e => handleFilterChange('region', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 font-medium text-gray-700"
            >
              <option value="ALL">Toutes les régions</option>
              {CERTIFICATION_REGIONS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre 4 : Type de certification */}
          <div>
            <select
              value={queryType}
              onChange={e => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 font-medium text-gray-700"
            >
              <option value="ALL">Tous les types</option>
              {CERTIFICATION_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ligne 2 : Dates d'expiration & Reset */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Expire après :</span>
              <input
                type="date"
                value={queryExpiresAfter}
                onChange={e => handleFilterChange('expires_after', e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Expire avant :</span>
              <input
                type="date"
                value={queryExpiresBefore}
                onChange={e => handleFilterChange('expires_before', e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      </section>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm">Erreur lors de la récupération des certifications</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* SECTION 3 — Tableau de données */}
      <section aria-label="Tableau des certifications" className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold text-xs uppercase tracking-wider">
                <th scope="col" className="py-3.5 px-4 sm:px-6">Producteur</th>
                <th scope="col" className="py-3.5 px-4">Certification</th>
                <th scope="col" className="py-3.5 px-4">Organisme</th>
                <th scope="col" className="py-3.5 px-4 cursor-pointer select-none hover:text-gray-900" onClick={() => handleSort('expires_at')}>
                  <div className="flex items-center gap-1">
                    <span>Expiration</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="py-3.5 px-4 cursor-pointer select-none hover:text-gray-900" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    <span>Statut</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="py-3.5 px-4 cursor-pointer select-none hover:text-gray-900" onClick={() => handleSort('updated_at')}>
                  <div className="flex items-center gap-1">
                    <span>Dernière action</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* État Loading : Skeleton de 5 lignes */}
              {isLoading && (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="h-4 bg-gray-200 rounded w-28 mb-1.5" />
                        <div className="h-3 bg-gray-100 rounded w-16" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1.5" />
                        <div className="h-3 bg-gray-100 rounded w-14" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 bg-gray-200 rounded w-28 mb-1.5" />
                        <div className="h-3 bg-gray-100 rounded w-20" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 bg-gray-200 rounded w-20" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-6 bg-gray-200 rounded-full w-24" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 bg-gray-200 rounded w-20" />
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="h-8 bg-gray-200 rounded-xl w-24 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* État vide */}
              {!isLoading && sortedCertifications.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <FileCheck2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      Aucune certification ne correspond aux filtres appliqués
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                      Modifiez ou réinitialisez vos critères de recherche pour afficher les certifications des producteurs.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Réinitialiser les filtres</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}

              {/* Lignes du tableau */}
              {!isLoading &&
                sortedCertifications.map(cert => {
                  const producerCountry = cert.producer?.country || cert.country_of_issue || '';
                  const flag = COUNTRY_FLAGS[producerCountry] || '🌐';

                  return (
                    <tr
                      key={cert.id}
                      onClick={() => navigate(`/admin/certifications/producers/${cert.id}`)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Col 1 : Producteur */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                          {cert.producer?.name || 'Producteur inconnu'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <span>{flag}</span>
                          <span>{producerCountry || 'Pays non renseigné'}</span>
                        </div>
                      </td>

                      {/* Col 2 : Certification */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-semibold text-gray-900">
                          {cert.certificate_number || 'Sans numéro'}
                        </div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1">
                          {cert.certification_type}
                        </span>
                      </td>

                      {/* Col 3 : Organisme */}
                      <td className="py-3.5 px-4">
                        {cert.certification_body ? (
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{cert.certification_body.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-gray-500">{cert.certification_body.region}</span>
                              <ChannelBadge
                                channel={cert.certification_body.api_endpoint ? 'api' : cert.certification_body.email_contact ? 'email' : 'manual'}
                                size="sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded font-medium border border-orange-200">
                            Non associé
                          </span>
                        )}
                      </td>

                      {/* Col 4 : Expiration */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-gray-700 font-medium">{formatDate(cert.expires_at)}</div>
                        {cert.is_expired && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Expiré
                          </span>
                        )}
                        {!cert.is_expired && cert.expires_soon && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
                            <Clock className="w-2.5 h-2.5" /> Expire bientôt
                          </span>
                        )}
                      </td>

                      {/* Col 5 : Statut */}
                      <td className="py-3.5 px-4">
                        <CertificationStatusBadge status={cert.status} size="sm" />
                      </td>

                      {/* Col 6 : Dernière action */}
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {formatDate(cert.updated_at)}
                      </td>

                      {/* Col 7 : Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/certifications/producers/${cert.id}`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Voir la fiche détaillée"
                            aria-label="Voir le détail de la certification"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Bouton de vérification inline compact */}
                          {cert.status !== 'verified' && (
                            <OneClickVerificationButton
                              certificationId={cert.id}
                              certificationBody={cert.certification_body || null}
                              currentStatus={cert.status}
                              adminId={profile?.id || ''}
                              size="sm"
                              onVerificationComplete={() => {
                                loadData();
                              }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* SECTION 4 — Pagination */}
        {!isLoading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Affichage de{' '}
              <strong className="text-gray-800">
                {(queryPage - 1) * ITEMS_PER_PAGE + 1}
              </strong>{' '}
              à{' '}
              <strong className="text-gray-800">
                {Math.min(queryPage * ITEMS_PER_PAGE, totalCount)}
              </strong>{' '}
              sur <strong className="text-gray-800">{totalCount}</strong> certifications
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(queryPage - 1)}
                disabled={queryPage <= 1}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Boutons pages */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && queryPage > 3) {
                  p = queryPage - 3 + i;
                  if (p > totalPages) p = totalPages - (4 - i);
                }

                const isActive = p === queryPage;

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handlePageChange(queryPage + 1)}
                disabled={queryPage >= totalPages}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
