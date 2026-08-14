import { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart, Download, Calendar, Globe, Award, Loader2,
  TrendingUp,
} from 'lucide-react';
import { supabase, type Order, type Producer } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';

type ReportType = 'monthly' | 'annual' | 'country' | 'certification';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [orders, setOrders] = useState<(Order & { producers?: { name: string; country: string } | null; products?: { name: string } | null })[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);

  const load = useCallback(async () => {
    const [{ data: ord }, { data: prod }] = await Promise.all([
      supabase.from('orders').select('*, producers(name, country), products(name)').order('created_at', { ascending: false }),
      supabase.from('producers').select('*'),
    ]);
    setOrders((ord as (Order & { producers?: { name: string; country: string } | null; products?: { name: string } | null })[]) ?? []);
    setProducers((prod as Producer[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const generateReport = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = 'rapport';

    if (reportType === 'monthly') {
      headers = ['Mois', 'Commandes', 'GMV', 'Commissions', 'Escrow'];
      const map: Record<string, { count: number; gmv: number; comm: number; esc: number }> = {};
      for (const o of orders) {
        const m = new Date(o.created_at).toISOString().slice(0, 7);
        if (!map[m]) map[m] = { count: 0, gmv: 0, comm: 0, esc: 0 };
        map[m].count++; map[m].gmv += Number(o.total_amount); map[m].comm += Number(o.commission_amount); map[m].esc += Number(o.escrow_amount);
      }
      rows = Object.entries(map).map(([m, v]) => [m, v.count, v.gmv.toFixed(2), v.comm.toFixed(2), v.esc.toFixed(2)]);
      filename = 'rapport_mensuel';
    } else if (reportType === 'annual') {
      headers = ['Année', 'Commandes', 'GMV', 'Commissions'];
      const map: Record<string, { count: number; gmv: number; comm: number }> = {};
      for (const o of orders) {
        const y = new Date(o.created_at).getFullYear().toString();
        if (!map[y]) map[y] = { count: 0, gmv: 0, comm: 0 };
        map[y].count++; map[y].gmv += Number(o.total_amount); map[y].comm += Number(o.commission_amount);
      }
      rows = Object.entries(map).map(([y, v]) => [y, v.count, v.gmv.toFixed(2), v.comm.toFixed(2)]);
      filename = 'rapport_annuel';
    } else if (reportType === 'country') {
      headers = ['Pays', 'Producteurs', 'Score moyen', 'Commandes', 'GMV'];
      const map: Record<string, { producers: number; scores: number[]; orders: number; gmv: number }> = {};
      for (const p of producers) {
        if (!map[p.country]) map[p.country] = { producers: 0, scores: [], orders: 0, gmv: 0 };
        map[p.country].producers++; map[p.country].scores.push(p.ethimarket_score);
      }
      for (const o of orders) {
        const c = o.producers?.country ?? '—';
        if (!map[c]) map[c] = { producers: 0, scores: [], orders: 0, gmv: 0 };
        map[c].orders++; map[c].gmv += Number(o.total_amount);
      }
      rows = Object.entries(map).map(([c, v]) => [c, v.producers, v.scores.length > 0 ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : 0, v.orders, v.gmv.toFixed(2)]);
      filename = 'rapport_pays';
    } else if (reportType === 'certification') {
      headers = ['Certification', 'Producteurs', 'Score moyen'];
      const map: Record<string, { producers: number; scores: number[] }> = {};
      for (const p of producers) {
        for (const cert of p.certifications) {
          if (!map[cert]) map[cert] = { producers: 0, scores: [] };
          map[cert].producers++; map[cert].scores.push(p.ethimarket_score);
        }
      }
      rows = Object.entries(map).map(([c, v]) => [c, v.producers, v.scores.length > 0 ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : 0]);
      filename = 'rapport_certifications';
    }

    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>;

  const REPORT_TYPES: { id: ReportType; label: string; icon: typeof Calendar; desc: string }[] = [
    { id: 'monthly', label: 'Rapport mensuel', icon: Calendar, desc: 'Commandes, GMV et commissions par mois' },
    { id: 'annual', label: 'Rapport annuel', icon: TrendingUp, desc: 'Synthèse globale par année' },
    { id: 'country', label: 'Rapport par pays', icon: Globe, desc: 'Producteurs et ventes par pays' },
    { id: 'certification', label: 'Rapport par certification', icon: Award, desc: 'Distribution des certifications' },
  ];

  // Preview data
  const preview = (() => {
    if (reportType === 'monthly') {
      const map: Record<string, number> = {};
      for (const o of orders) { const m = new Date(o.created_at).toISOString().slice(0, 7); map[m] = (map[m] ?? 0) + Number(o.total_amount); }
      return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    }
    if (reportType === 'country') {
      const map: Record<string, number> = {};
      for (const p of producers) map[p.country] = (map[p.country] ?? 0) + 1;
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }
    if (reportType === 'certification') {
      const map: Record<string, number> = {};
      for (const p of producers) for (const c of p.certifications) map[c] = (map[c] ?? 0) + 1;
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }
    // annual
    const map: Record<string, number> = {};
    for (const o of orders) { const y = new Date(o.created_at).getFullYear().toString(); map[y] = (map[y] ?? 0) + Number(o.total_amount); }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  })();

  return (
    <div>
      <AdminPageHeader title="Rapports" subtitle="Générez et exportez des rapports détaillés" />

      {/* Report type selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          const isActive = reportType === rt.id;
          return (
            <button key={rt.id} onClick={() => setReportType(rt.id)} className={`text-left bg-white rounded-2xl border-2 p-4 transition-all ${isActive ? 'border-brand-500 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
              <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
              <p className={`font-bold text-sm ${isActive ? 'text-brand-700' : 'text-gray-900'}`}>{rt.label}</p>
              <p className="text-xs text-gray-500 mt-1">{rt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-sm text-gray-900">Aperçu — {REPORT_TYPES.find(r => r.id === reportType)?.label}</h3>
          <FileBarChart className="w-4 h-4 text-gray-400" />
        </div>
        {preview.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune donnée pour ce rapport.</p>
        ) : (
          <div className="space-y-2">
            {preview.map(([label, value], i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className="text-sm font-bold text-gray-900">{typeof value === 'number' && reportType !== 'country' && reportType !== 'certification' ? `${value.toLocaleString('fr-FR')} €` : value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export button */}
      <button onClick={generateReport} className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors">
        <Download className="w-4 h-4" /> Exporter en CSV
      </button>
    </div>
  );
}
