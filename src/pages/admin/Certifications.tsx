import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, CheckCircle2, Mail, Ban,
  Award, Loader2, AlertTriangle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';

type CertRow = {
  id: string;
  producer_id: string;
  verification_id: string;
  cert_type: string;
  cert_number: string;
  certifying_body: string;
  issued_at: string;
  expires_at: string;
  file_path: string;
  status: string;
  producers?: { name: string; country: string } | null;
};

export default function AdminCertifications() {
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('verification_certifications')
      .select('*, producer_verifications(producer_id, producers(name, country))')
      .order('created_at', { ascending: false });
    // Flatten producer info
    const rows: CertRow[] = (data ?? []).map((c: Record<string, unknown>) => {
      const pv = c.producer_verifications as { producer_id: string; producers: { name: string; country: string } } | null;
      return {
        id: c.id as string,
        producer_id: pv?.producer_id ?? '',
        verification_id: c.verification_id as string,
        cert_type: c.cert_type as string,
        cert_number: c.cert_number as string,
        certifying_body: c.certifying_body as string,
        issued_at: c.issued_at as string,
        expires_at: c.expires_at as string,
        file_path: c.file_path as string,
        status: c.status as string,
        producers: pv?.producers ?? null,
      };
    });
    setCerts(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('verification_certifications').update({ status }).eq('id', id);
    await supabase.from('admin_audit_log').insert({ action: `cert_${status}`, target_type: 'producer', details: { cert_id: id } });
    load();
  };

  const filtered = certs.filter(c => {
    if (search && !c.cert_type.toLowerCase().includes(search.toLowerCase()) && !c.cert_number.toLowerCase().includes(search.toLowerCase()) && !(c.producers?.name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const daysUntilExpiry = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>;

  return (
    <div>
      <AdminPageHeader title="Gestion des certifications" subtitle="Vérifiez et suivez les certifications des producteurs" />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher (type, n°, producteur)..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white appearance-none cursor-pointer">
            <option value="all">Tous statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Vérifiée</option>
            <option value="rejected">Suspendue</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Award className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Aucune certification enregistrée pour le moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="text-left py-3 px-4">Producteur</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">N°</th>
                  <th className="text-left py-3 px-4">Organisme</th>
                  <th className="text-left py-3 px-4">Expiration</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => {
                  const days = daysUntilExpiry(c.expires_at);
                  const expiringSoon = days <= 30 && days > 0;
                  const expired = days <= 0;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{c.producers?.name ?? '—'}</td>
                      <td className="py-3 px-4"><span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-700">{c.cert_type}</span></td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{c.cert_number}</td>
                      <td className="py-3 px-4 text-gray-600">{c.certifying_body}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-semibold ${expired ? 'text-red-600' : expiringSoon ? 'text-amber-600' : 'text-gray-600'}`}>
                          {new Date(c.expires_at).toLocaleDateString('fr-FR')}
                          {expiringSoon && <span className="ml-1.5 inline-flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> {days}j</span>}
                          {expired && <span className="ml-1.5 text-red-600">Expiré</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.status === 'approved' ? 'bg-brand-100 text-brand-700' : c.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {c.status === 'approved' ? 'Vérifiée' : c.status === 'rejected' ? 'Suspendue' : 'En attente'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status !== 'approved' && (
                            <button onClick={() => updateStatus(c.id, 'approved')} title="Marquer vérifiée" className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></button>
                          )}
                          {c.status !== 'rejected' && (
                            <button onClick={() => updateStatus(c.id, 'rejected')} title="Suspendre" className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"><Ban className="w-4 h-4" /></button>
                          )}
                          {expiringSoon && (
                            <button title="Email rappel" className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center"><Mail className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
