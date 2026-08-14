import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, ShieldCheck, Ban, CheckCircle2,
  Mail, MapPin, X, ChevronLeft, ChevronRight, Award,
  SlidersHorizontal, Eye, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, type Producer, type Profile } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';
import { calculateEthiMarketScore, calculateProfileCompletion } from '../../lib/calculations';

type ProducerRow = Producer & {
  profiles?: Profile | null;
  calculatedScore?: number;
  calculatedCompletion?: number;
  status?: 'verified' | 'pending' | 'suspended';
};

const ITEMS_PER_PAGE = 10;

export default function AdminProducers() {
  const [producers, setProducers] = useState<ProducerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [selectedProducer, setSelectedProducer] = useState<ProducerRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProducers = useCallback(async () => {
    setLoading(true);
    const [{ data: prodsData }, { data: profsData }] = await Promise.all([
      supabase.from('producers').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
    ]);

    const profMap = new Map((profsData as Profile[] ?? []).map(p => [p.id, p]));

    const rows: ProducerRow[] = (prodsData as Producer[] ?? []).map(p => {
      const userProfile = p.user_id ? profMap.get(p.user_id) ?? null : null;
      const scoreObj = calculateEthiMarketScore(p);
      const completion = calculateProfileCompletion(p);
      
      let status: 'verified' | 'pending' | 'suspended' = 'pending';
      if (p.verified) {
        status = 'verified';
      } else if (p.response_time === 'suspended') {
        status = 'suspended';
      }

      return {
        ...p,
        profiles: userProfile,
        calculatedScore: p.ethimarket_score && p.ethimarket_score > 0 ? p.ethimarket_score : scoreObj.score,
        calculatedCompletion: p.profile_completion && p.profile_completion > 0 ? p.profile_completion : completion,
        status,
      };
    });

    setProducers(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducers();
  }, [loadProducers]);

  const toggleVerification = async (prod: ProducerRow, targetStatus: 'verified' | 'pending' | 'suspended') => {
    setActionLoading(true);
    const isVerified = targetStatus === 'verified';
    const updateData: Record<string, unknown> = {
      verified: isVerified,
    };
    if (targetStatus === 'suspended') {
      updateData.response_time = 'suspended';
    } else if (prod.response_time === 'suspended') {
      updateData.response_time = '24h';
    }

    await supabase.from('producers').update(updateData).eq('id', prod.id);
    await supabase.from('admin_audit_log').insert({
      action: `producer_status_${targetStatus}`,
      target_type: 'producer',
      target_id: prod.id,
      details: { name: prod.name },
    });

    setActionLoading(false);
    setSelectedProducer(null);
    loadProducers();
  };

  // Get unique countries
  const countries = Array.from(new Set(producers.map(p => p.country))).filter(Boolean).sort();

  // Filter logic
  const filtered = producers.filter(p => {
    // Search filter
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase()) ||
      p.profiles?.email?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // Country filter
    if (countryFilter !== 'all' && p.country !== countryFilter) return false;

    // Score filter
    if ((p.calculatedScore ?? 0) < minScore) return false;

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <AdminPageHeader
        title="Gestion des Producteurs"
        subtitle="Consultez, filtrez et validez l'ensemble des producteurs partenaires"
      />

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher nom, email..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="verified">Vérifiés (Validés)</option>
              <option value="pending">En attente de vérification</option>
              <option value="suspended">Suspendus</option>
            </select>
          </div>

          {/* Country filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={countryFilter}
              onChange={e => { setCountryFilter(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white cursor-pointer"
            >
              <option value="all">Tous les pays</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Min score slider */}
          <div className="flex flex-col justify-center px-2">
            <div className="flex justify-between items-center mb-1 text-xs text-gray-600 font-bold">
              <span className="flex items-center gap-1"><SlidersHorizontal className="w-3 h-3 text-brand-500" /> Score min :</span>
              <span className="text-brand-600 font-black">{minScore} pts</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minScore}
              onChange={e => { setMinScore(Number(e.target.value)); setPage(1); }}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement des producteurs...
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ShieldCheck className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            Aucun producteur ne correspond à vos critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="py-3.5 px-4">Producteur</th>
                  <th className="py-3.5 px-4">Pays</th>
                  <th className="py-3.5 px-4">Score EthiMarket</th>
                  <th className="py-3.5 px-4">Profil Complété</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Produits</th>
                  <th className="py-3.5 px-4">Inscription</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(p => {
                  const score = p.calculatedScore ?? 0;
                  const completion = p.calculatedCompletion ?? 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0"
                            style={{ backgroundColor: p.avatar_color || '#15803d' }}
                          >
                            {p.avatar_initials || p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">{p.name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-gray-300" />
                              {p.profiles?.email || 'Sans email'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Country */}
                      <td className="py-3.5 px-4 font-medium text-gray-700">
                        <span className="mr-1.5">{p.country_flag}</span>
                        {p.country}
                      </td>

                      {/* Score EthiMarket */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                            score >= 90
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : score >= 75
                              ? 'bg-gray-200 text-gray-800'
                              : score >= 60
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {score}/100
                          </span>
                        </div>
                      </td>

                      {/* Completion */}
                      <td className="py-3.5 px-4">
                        <div className="w-28">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-gray-600">{completion}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {p.status === 'verified' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Vérifié
                          </span>
                        )}
                        {p.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            En attente
                          </span>
                        )}
                        {p.status === 'suspended' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                            <Ban className="w-3.5 h-3.5 text-red-600" /> Suspendu
                          </span>
                        )}
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-4 font-bold text-gray-800">
                        {p.product_count || 0}
                      </td>

                      {/* Joined date */}
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {new Date(p.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProducer(p)}
                            className="p-2 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/boutique/${p.slug}`}
                            target="_blank"
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Voir la boutique publique"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {p.status !== 'verified' ? (
                            <button
                              onClick={() => toggleVerification(p, 'verified')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg transition-colors"
                            >
                              Vérifier
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleVerification(p, 'suspended')}
                              className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-lg transition-colors"
                            >
                              Suspendre
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
            <p>Affichage de {((page - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length} producteurs</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-gray-700">Page {page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedProducer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedProducer(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Fiche Producteur</h2>
              <button onClick={() => setSelectedProducer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                  style={{ backgroundColor: selectedProducer.avatar_color || '#15803d' }}
                >
                  {selectedProducer.avatar_initials || selectedProducer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-xl text-gray-900">{selectedProducer.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">
                    {selectedProducer.country_flag} {selectedProducer.country} {selectedProducer.region && `• ${selectedProducer.region}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{selectedProducer.profiles?.email || 'Email non disponible'}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3.5 rounded-2xl text-center">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Score EthiMarket</p>
                  <p className="text-lg font-black text-brand-600">{selectedProducer.calculatedScore}/100</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Complétion</p>
                  <p className="text-lg font-black text-blue-600">{selectedProducer.calculatedCompletion}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Produits</p>
                  <p className="text-lg font-black text-gray-900">{selectedProducer.product_count || 0}</p>
                </div>
              </div>

              {/* Story/Description */}
              {selectedProducer.description && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl leading-relaxed">{selectedProducer.description}</p>
                </div>
              )}

              {/* Certifications */}
              {selectedProducer.certifications && selectedProducer.certifications.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Certifications déclarées</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProducer.certifications.map((cert, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs font-bold bg-brand-50 text-brand-700 px-3 py-1 rounded-full border border-brand-200">
                        <Award className="w-3.5 h-3.5 text-brand-500" /> {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                {selectedProducer.status !== 'verified' ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => toggleVerification(selectedProducer, 'verified')}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approuver et Vérifier
                  </button>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={() => toggleVerification(selectedProducer, 'suspended')}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Ban className="w-4 h-4" /> Suspendre le compte
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
