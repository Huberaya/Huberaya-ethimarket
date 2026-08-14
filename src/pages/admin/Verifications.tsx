import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, CheckCircle2, Clock, Loader2,
  Filter, FileText, ArrowUpDown, AlertCircle, ShieldCheck, UserCheck
} from 'lucide-react';
import { supabase, type Producer } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';

export default function AdminVerifications() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const loadProducers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('producers')
      .select('*')
      .order('submitted_at', { ascending: sortOrder === 'asc' });

    if (data) {
      setProducers(data as Producer[]);
    }
    setLoading(false);
  }, [sortOrder]);

  useEffect(() => {
    loadProducers();
  }, [loadProducers]);

  // KPI calculations
  const pendingCount = producers.filter(p => p.verification_status === 'submitted').length;
  const underReviewCount = producers.filter(p => p.verification_status === 'under_review').length;
  
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const approvedThisMonth = producers.filter(
    p => p.verification_status === 'approved' && p.reviewed_at && p.reviewed_at >= firstDayOfMonth
  ).length;

  const rejectedThisMonth = producers.filter(
    p => p.verification_status === 'rejected' && p.reviewed_at && p.reviewed_at >= firstDayOfMonth
  ).length;

  // Filter producers list
  const filtered = producers.filter(p => {
    const name = p.name || '';
    const email = p.business_email || '';
    const query = search.toLowerCase();

    if (query && !name.toLowerCase().includes(query) && !email.toLowerCase().includes(query)) {
      return false;
    }

    if (statusFilter !== 'all') {
      const pStatus = p.verification_status || 'draft';
      if (pStatus !== statusFilter) return false;
    }

    if (countryFilter !== 'all') {
      if (p.country !== countryFilter) return false;
    }

    return true;
  });

  const countries = Array.from(new Set(producers.map(p => p.country).filter(Boolean)));

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 bg-brand-100 text-brand-700 font-bold text-xs rounded-full inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-brand-600" /> Approuvé</span>;
      case 'submitted':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full inline-flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" /> Soumis</span>;
      case 'under_review':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full inline-flex items-center gap-1"><UserCheck className="w-3 h-3 text-blue-600" /> En examen</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full inline-flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-600" /> Rejeté</span>;
      case 'suspended':
        return <span className="px-2.5 py-1 bg-gray-800 text-white font-bold text-xs rounded-full">Suspendu</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 font-bold text-xs rounded-full">Brouillon</span>;
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Centre de vérification Bureau Veritas"
        subtitle="Contrôle d'accréditation et validation des dossiers producteurs"
      />

      {/* KPI Counters Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase">En attente</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{pendingCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Dossiers soumis</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-700 uppercase">En cours d'examen</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{underReviewCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">En cours par l'admin</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-brand-700 uppercase">Approuvés (Ce mois)</p>
            <p className="text-2xl font-black text-brand-600 mt-1">{approvedThisMonth}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Boutiques en ligne</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-red-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-700 uppercase">Rejetés (Ce mois)</p>
            <p className="text-2xl font-black text-red-600 mt-1">{rejectedThisMonth}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Corrections demandées</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher nom, email ou SIRET..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="submitted">Soumis (🟡)</option>
              <option value="under_review">En examen (🔵)</option>
              <option value="draft">Brouillon (🟠)</option>
              <option value="approved">Approuvé (🟢)</option>
              <option value="rejected">Rejeté (🔴)</option>
            </select>
          </div>

          {/* Country filter */}
          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Tous les pays</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort order */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === 'desc' ? 'Plus récents' : 'Plus anciens'}
          </button>
        </div>
      </div>

      {/* Table of Producers */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin mb-2" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Aucun dossier producteur ne correspond à vos filtres.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Producteur</th>
                  <th className="p-4">Pays</th>
                  <th className="p-4">Date soumission</th>
                  <th className="p-4">Complétude</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(producer => (
                  <tr key={producer.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                          style={{ backgroundColor: producer.avatar_color || '#16a34a' }}
                        >
                          {producer.avatar_initials || 'PR'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{producer.name}</p>
                          <p className="text-[11px] text-gray-500">{producer.business_email || 'Pas d\'email'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-gray-700">
                        {producer.country_flag} {producer.country}
                      </span>
                    </td>

                    <td className="p-4 text-gray-600">
                      {producer.submitted_at ? (
                        new Date(producer.submitted_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })
                      ) : (
                        <span className="text-gray-400">Non soumis</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${producer.profile_completion ?? 50}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-700">{producer.profile_completion ?? 50}%</span>
                      </div>
                    </td>

                    <td className="p-4">
                      {getStatusBadge(producer.verification_status)}
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        to={`/admin/verification/${producer.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl transition-colors shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Examiner →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
