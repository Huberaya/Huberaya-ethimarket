import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Loader2, X,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, type Order, type OrderStatus } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Nouvelle' },
  processing: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En cours' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Expédiée' },
  delivered: { bg: 'bg-brand-100', text: 'text-brand-700', label: 'Livrée' },
  disputed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Litige' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Annulée' },
  refunded: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Remboursée' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<(Order & { producers?: { name: string } | null; products?: { name: string; emoji: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<(Order & { producers?: { name: string } | null; products?: { name: string; emoji: string } | null }) | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*, producers(name), products(name, emoji)').order('created_at', { ascending: false });
    setOrders((data as (Order & { producers?: { name: string } | null; products?: { name: string; emoji: string } | null })[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    await supabase.from('admin_audit_log').insert({ action: 'update_order_status', target_type: 'order', target_id: id, details: { status } });
    load();
    if (selected) setSelected({ ...selected, status });
  };

  const filtered = orders.filter(o => {
    if (search) {
      const s = search.toLowerCase();
      if (!o.products?.name?.toLowerCase().includes(s) && !o.producers?.name?.toLowerCase().includes(s) && !o.tracking_number?.toLowerCase().includes(s)) return false;
    }
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>;

  return (
    <div>
      <AdminPageHeader title="Commandes" subtitle="Toutes les commandes de la plateforme" />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher (produit, producteur, suivi)..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white appearance-none cursor-pointer">
            <option value="all">Tous statuts</option>
            {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                <th className="text-left py-3 px-4">Produit</th>
                <th className="text-left py-3 px-4">Producteur</th>
                <th className="text-left py-3 px-4">Montant</th>
                <th className="text-left py-3 px-4">Commission</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-right py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">Aucune commande trouvée.</td></tr>}
              {filtered.map(o => {
                const st = STATUS_STYLES[o.status];
                return (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{o.products?.emoji ?? '📦'}</span>
                        <span className="font-semibold text-gray-900">{o.products?.name ?? '—'}</span>
                      </div>
                      <span className="text-xs text-gray-400">{o.quantity} {o.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{o.producers?.name ?? '—'}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{o.total_amount.toLocaleString('fr-FR')} €</td>
                    <td className="py-3 px-4 text-gray-600">{o.commission_amount.toLocaleString('fr-FR')} €</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 px-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>{st.label}</span></td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => setSelected(o)} className="text-xs font-bold text-brand-600 hover:underline">Détails</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Commande</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Info label="Produit" value={selected.products?.name ?? '—'} />
                <Info label="Producteur" value={selected.producers?.name ?? '—'} />
                <Info label="Quantité" value={`${selected.quantity} ${selected.unit}`} />
                <Info label="Prix unitaire" value={`${selected.unit_price} €`} />
                <Info label="Total" value={`${selected.total_amount.toLocaleString('fr-FR')} €`} />
                <Info label="Commission" value={`${selected.commission_amount.toLocaleString('fr-FR')} €`} />
                <Info label="Escrow" value={`${selected.escrow_amount.toLocaleString('fr-FR')} €`} />
                <Info label="Livraison" value={`${selected.shipping_cost} €`} />
                <Info label="Douane" value={`${selected.customs_cost} €`} />
                <Info label="Suivi" value={selected.tracking_number ?? '—'} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Statut</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_STYLES) as OrderStatus[]).map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${selected.status === s ? `${STATUS_STYLES[s].bg} ${STATUS_STYLES[s].text} ring-2 ring-offset-1 ring-gray-300` : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      {STATUS_STYLES[s].label}
                    </button>
                  ))}
                </div>
              </div>
              {selected.status === 'disputed' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <Link to="/admin/disputes" className="text-sm font-bold text-red-600 hover:underline">Voir le litige associé</Link>
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
