import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, TrendingUp, DollarSign, Download,
  Loader2, ArrowUpRight,
} from 'lucide-react';
import { supabase, type Order } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';

export default function AdminFinances() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number; escrow: number; payouts: number }[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const allOrders = (data as Order[]) ?? [];
    setOrders(allOrders);

    // Aggregate by month
    const map: Record<string, { revenue: number; escrow: number; payouts: number }> = {};
    for (const o of allOrders) {
      const m = new Date(o.created_at).toISOString().slice(0, 7);
      if (!map[m]) map[m] = { revenue: 0, escrow: 0, payouts: 0 };
      map[m].revenue += Number(o.commission_amount);
      map[m].escrow += Number(o.escrow_amount);
      // Payouts = total - commission (what goes to producer) for delivered orders
      if (o.status === 'delivered') {
        map[m].payouts += Number(o.total_amount) - Number(o.commission_amount);
      }
    }
    setMonthlyData(Object.entries(map).map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>;

  const totalRevenue = orders.reduce((s, o) => s + Number(o.commission_amount), 0);
  const totalEscrow = orders.reduce((s, o) => s + Number(o.escrow_amount), 0);
  const totalPayouts = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (Number(o.total_amount) - Number(o.commission_amount)), 0);
  const totalGMV = orders.reduce((s, o) => s + Number(o.total_amount), 0);

  const exportCSV = () => {
    const headers = ['Mois', 'Revenus (commissions)', 'Escrow', 'Paiements producteurs'];
    const rows = monthlyData.map(d => [d.month, d.revenue.toFixed(2), d.escrow.toFixed(2), d.payouts.toFixed(2)]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ethimarket_finances.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const maxRev = Math.max(...monthlyData.map(d => d.revenue), 1);

  return (
    <div>
      <AdminPageHeader title="Finances" subtitle="Revenus, commissions et paiements">
        <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </AdminPageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FinanceCard label="Revenus totaux" value={`${totalRevenue.toLocaleString('fr-FR')} €`} icon={Wallet} color="text-emerald-600" bg="bg-emerald-50" trend="+12%" />
        <FinanceCard label="Commissions générées" value={`${totalRevenue.toLocaleString('fr-FR')} €`} icon={TrendingUp} color="text-brand-600" bg="bg-brand-50" trend="+8%" />
        <FinanceCard label="Montants en escrow" value={`${totalEscrow.toLocaleString('fr-FR')} €`} icon={DollarSign} color="text-amber-600" bg="bg-amber-50" />
        <FinanceCard label="Paiements aux producteurs" value={`${totalPayouts.toLocaleString('fr-FR')} €`} icon={ArrowUpRight} color="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* GMV summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Volume total (GMV)</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{totalGMV.toLocaleString('fr-FR')} €</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-semibold uppercase">Taux de commission moyen</p>
            <p className="text-3xl font-black text-gray-900 mt-1">5%</p>
          </div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-sm text-gray-900 mb-5">Rapport mensuel</h3>
        {monthlyData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune donnée financière disponible.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="text-left py-3 px-4">Mois</th>
                  <th className="text-right py-3 px-4">Commissions</th>
                  <th className="text-right py-3 px-4">Escrow</th>
                  <th className="text-right py-3 px-4">Paiements producteurs</th>
                  <th className="text-left py-3 px-4">Évolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthlyData.map((d) => (
                  <tr key={d.month} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-semibold text-gray-900">{d.month}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{d.revenue.toLocaleString('fr-FR')} €</td>
                    <td className="py-3 px-4 text-right text-amber-600">{d.escrow.toLocaleString('fr-FR')} €</td>
                    <td className="py-3 px-4 text-right text-blue-600">{d.payouts.toLocaleString('fr-FR')} €</td>
                    <td className="py-3 px-4">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(d.revenue / maxRev) * 100}%` }} />
                      </div>
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

function FinanceCard({ label, value, icon: Icon, color, bg, trend }: { label: string; value: string; icon: typeof Wallet; color: string; bg: string; trend?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {trend && <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> {trend}</span>}
      </div>
      <p className="text-xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
