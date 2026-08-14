import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Loader2, X, AlertTriangle, MessageSquare,
  CheckCircle2, DollarSign, Phone,
} from 'lucide-react';
import { supabase, type Dispute, type DisputeStatus, type DisputePriority } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';

const PRIORITY_STYLES: Record<DisputePriority, { bg: string; text: string; label: string }> = {
  urgent: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgent' },
  normal: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Normal' },
  low: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Faible' },
};

const STATUS_STYLES: Record<DisputeStatus, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-red-100', text: 'text-red-700', label: 'Ouvert' },
  investigating: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En cours' },
  resolved: { bg: 'bg-brand-100', text: 'text-brand-700', label: 'Résolu' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Fermé' },
};

const REASON_LABELS: Record<string, string> = {
  quality: 'Qualité', delivery: 'Livraison', authenticity: 'Authenticité', payment: 'Paiement', other: 'Autre',
};

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<(Dispute & { producers?: { name: string } | null; orders?: { total_amount: number; products?: { name: string } | null } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<(Dispute & { producers?: { name: string } | null; orders?: { total_amount: number; products?: { name: string } | null } | null }) | null>(null);
  const [resolution, setResolution] = useState('');
  const [refund, setRefund] = useState('0');

  const load = useCallback(async () => {
    const { data } = await supabase.from('disputes').select('*, producers(name), orders(total_amount, products(name))').order('created_at', { ascending: false });
    setDisputes((data as (Dispute & { producers?: { name: string } | null; orders?: { total_amount: number; products?: { name: string } | null } | null })[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolveDispute = async (status: DisputeStatus) => {
    if (!selected) return;
    const update: Record<string, unknown> = { status };
    if (status === 'resolved') {
      update.resolution = resolution;
      update.refund_amount = parseFloat(refund) || 0;
      update.resolved_at = new Date().toISOString();
    }
    await supabase.from('disputes').update(update).eq('id', selected.id);
    await supabase.from('admin_audit_log').insert({ action: `dispute_${status}`, target_type: 'dispute', target_id: selected.id, details: { resolution, refund } });
    setResolution('');
    setRefund('0');
    load();
    setSelected(null);
  };

  const filtered = disputes.filter(d => {
    if (search && !d.producers?.name?.toLowerCase().includes(search.toLowerCase()) && !d.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>;

  return (
    <div>
      <AdminPageHeader title="Litiges" subtitle="Gérez les réclamations entre acheteurs et producteurs" />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white appearance-none cursor-pointer">
            <option value="all">Tous statuts</option>
            <option value="open">Ouverts</option>
            <option value="investigating">En cours</option>
            <option value="resolved">Résolus</option>
            <option value="closed">Fermés</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && <div className="text-center py-16 text-gray-400 text-sm">Aucun litige trouvé.</div>}
        {filtered.map(d => {
          const ps = PRIORITY_STYLES[d.priority];
          const ss = STATUS_STYLES[d.status];
          return (
            <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelected(d)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ps.bg} ${ps.text}`}>{ps.label}</span>
                  <span className="text-xs font-semibold text-gray-500">{REASON_LABELS[d.reason] ?? d.reason}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ss.bg} ${ss.text}`}>{ss.label}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{d.producers?.name ?? '—'} — {d.orders?.products?.name ?? 'Produit'}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.description}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(d.created_at).toLocaleDateString('fr-FR')} • {d.orders?.total_amount.toLocaleString('fr-FR')} €</p>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-black text-gray-900">Litige</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Info label="Producteur" value={selected.producers?.name ?? '—'} />
                <Info label="Motif" value={REASON_LABELS[selected.reason] ?? selected.reason} />
                <Info label="Priorité" value={PRIORITY_STYLES[selected.priority].label} />
                <Info label="Montant" value={`${selected.orders?.total_amount.toLocaleString('fr-FR') ?? 0} €`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Description</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{selected.description}</p>
              </div>

              {selected.status === 'open' || selected.status === 'investigating' ? (
                <>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Décision / Résolution</p>
                    <textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Décrivez la résolution..." rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Remboursement (€)</p>
                    <input type="number" value={refund} onChange={e => setRefund(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => resolveDispute('investigating')} className="flex-1 text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 py-2.5 rounded-xl flex items-center justify-center gap-1.5"><MessageSquare className="w-4 h-4" /> Enquêter</button>
                    <button disabled={!resolution} onClick={() => resolveDispute('resolved')} className="flex-1 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-40"><CheckCircle2 className="w-4 h-4" /> Résoudre</button>
                    <button onClick={() => resolveDispute('closed')} className="flex-1 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 py-2.5 rounded-xl flex items-center justify-center gap-1.5"><X className="w-4 h-4" /> Fermer</button>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl flex items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contacter l'acheteur</button>
                    <button className="flex-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl flex items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contacter le producteur</button>
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Résolution</p>
                  <p className="text-sm text-gray-700">{selected.resolution ?? 'Aucune résolution enregistrée'}</p>
                  {selected.refund_amount > 0 && <p className="text-sm font-bold text-red-600 mt-2 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Remboursement: {selected.refund_amount.toLocaleString('fr-FR')} €</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-[10px] text-gray-500 font-semibold uppercase">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
