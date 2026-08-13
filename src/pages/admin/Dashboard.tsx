import { useState, useEffect, useCallback } from 'react';
import {
  Users, ShieldCheck, ShoppingCart, Wallet, Award, TrendingUp,
  TrendingDown, Globe, Package, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';

type Kpi = { label: string; value: string; icon: typeof Users; color: string; bg: string; trend?: number };

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [signups, setSignups] = useState<{ date: string; count: number }[]>([]);
  const [revenue, setRevenue] = useState<{ month: string; amount: number }[]>([]);
  const [countries, setCountries] = useState<{ country: string; count: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; emoji: string; orders: number; revenue: number }[]>([]);

  const load = useCallback(async () => {
    const [producersRes, pendingRes, approvedRes, rejectedRes, profilesRes, ordersRes, avgScoreRes] = await Promise.all([
      supabase.from('producers').select('*', { count: 'exact', head: true }),
      supabase.from('producers').select('*', { count: 'exact', head: true }).eq('verification_status', 'submitted'),
      supabase.from('producers').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
      supabase.from('producers').select('*', { count: 'exact', head: true }).eq('verification_status', 'rejected'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase.from('producers').select('ethimarket_score'),
    ]);

    const monthOrders = ordersRes.data ?? [];
    const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.commission_amount), 0);
    const scores = (avgScoreRes.data ?? []).map((p: { ethimarket_score: number }) => p.ethimarket_score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const totalAudited = (approvedRes.count ?? 0) + (rejectedRes.count ?? 0);
    const approvalRate = totalAudited > 0 ? Math.round(((approvedRes.count ?? 0) / totalAudited) * 100) : 100;

    setKpis([
      { label: 'Producteurs', value: String(producersRes.count ?? 0), icon: ShieldCheck, color: 'text-brand-600', bg: 'bg-brand-50' },
      { label: 'Dossiers en attente', value: String(pendingRes.count ?? 0), icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Taux d\'approbation', value: `${approvalRate}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Acheteurs', value: String(profilesRes.count ?? 0), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'CA du mois', value: `${monthRevenue.toLocaleString('fr-FR')} €`, icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Score moyen', value: `${avgScore}/100`, icon: Award, color: 'text-gray-700', bg: 'bg-gray-100' },
    ]);

    // Signups last 30 days (from profiles + producers created_at)
    const { data: recentProfiles } = await supabase.from('profiles').select('created_at').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());
    const { data: recentProducers } = await supabase.from('producers').select('created_at').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());
    const allSignups = [...(recentProfiles ?? []).map((p: { created_at: string }) => p.created_at), ...(recentProducers ?? []).map((p: { created_at: string }) => p.created_at)];
    const signupMap: Record<string, number> = {};
    for (const d of allSignups) {
      const day = new Date(d).toISOString().slice(0, 10);
      signupMap[day] = (signupMap[day] ?? 0) + 1;
    }
    const signupArr = Object.entries(signupMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
    setSignups(signupArr.slice(-15));

    // Revenue last 12 months (from orders)
    const { data: allOrders } = await supabase.from('orders').select('commission_amount, created_at');
    const revMap: Record<string, number> = {};
    for (const o of (allOrders ?? [])) {
      const m = new Date(o.created_at).toISOString().slice(0, 7);
      revMap[m] = (revMap[m] ?? 0) + Number(o.commission_amount);
    }
    const revArr = Object.entries(revMap).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
    setRevenue(revArr);

    // Countries
    const { data: prodCountries } = await supabase.from('producers').select('country');
    const countryMap: Record<string, number> = {};
    for (const p of (prodCountries ?? [])) {
      countryMap[p.country] = (countryMap[p.country] ?? 0) + 1;
    }
    setCountries(Object.entries(countryMap).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count));

    // Top products by order count
    const { data: topOrders } = await supabase.from('orders').select('product_id, total_amount, products(name, emoji)').not('product_id', 'is', null);
    const prodMap: Record<string, { name: string; emoji: string; orders: number; revenue: number }> = {};
    for (const o of (topOrders ?? [])) {
      const pid = o.product_id as string;
      const prod = o.products as { name: string; emoji: string } | null;
      if (!prod) continue;
      if (!prodMap[pid]) prodMap[pid] = { name: prod.name, emoji: prod.emoji, orders: 0, revenue: 0 };
      prodMap[pid].orders += 1;
      prodMap[pid].revenue += Number(o.total_amount);
    }
    setTopProducts(Object.values(prodMap).sort((a, b) => b.orders - a.orders).slice(0, 10));

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="w-6 h-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    );
  }

  const maxSignup = Math.max(...signups.map(s => s.count), 1);
  const maxRev = Math.max(...revenue.map(r => r.amount), 1);
  const maxCountry = Math.max(...countries.map(c => c.count), 1);
  const maxTopOrder = Math.max(...topProducts.map(p => p.orders), 1);

  return (
    <div>
      <AdminPageHeader title="Tableau de bord" subtitle="Vue d'ensemble de la plateforme en temps réel" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.bg}`}>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Signups chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-sm text-gray-900">Inscriptions (30 jours)</h3>
            <TrendingUp className="w-4 h-4 text-brand-500" />
          </div>
          {signups.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="flex items-end gap-1 h-40">
              {signups.map(s => (
                <div key={s.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full bg-brand-100 rounded-t-md group-hover:bg-brand-300 transition-colors relative" style={{ height: `${(s.count / maxSignup) * 100}%` }}>
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">{s.count}</span>
                  </div>
                  <span className="text-[8px] text-gray-400 -rotate-45 origin-left whitespace-nowrap">{new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-sm text-gray-900">Évolution CA (12 mois)</h3>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          {revenue.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="flex items-end gap-1 h-40">
              {revenue.map(r => (
                <div key={r.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full bg-emerald-100 rounded-t-md group-hover:bg-emerald-300 transition-colors relative" style={{ height: `${(r.amount / maxRev) * 100}%` }}>
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{r.amount.toFixed(0)}€</span>
                  </div>
                  <span className="text-[8px] text-gray-400">{r.month.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Countries */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-sm text-gray-900">Répartition par pays</h3>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          {countries.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="space-y-3">
              {countries.map(c => (
                <div key={c.country}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{c.country}</span>
                    <span className="text-sm font-bold text-gray-900">{c.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.count / maxCountry) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-sm text-gray-900">Top 10 produits</h3>
            <Package className="w-4 h-4 text-purple-500" />
          </div>
          {topProducts.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{p.name}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(p.orders / maxTopOrder) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-900 flex-shrink-0">{p.orders} cmd</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{p.revenue.toLocaleString('fr-FR')} €</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { to: '/admin/verifications', label: 'Vérifications', icon: ShieldCheck, color: 'text-brand-600' },
          { to: '/admin/orders', label: 'Commandes', icon: ShoppingCart, color: 'text-purple-600' },
          { to: '/admin/disputes', label: 'Litiges', icon: TrendingDown, color: 'text-red-600' },
          { to: '/admin/finances', label: 'Finances', icon: Wallet, color: 'text-emerald-600' },
        ].map(q => {
          const Icon = q.icon;
          return (
            <Link key={q.to} to={q.to} className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all group">
              <Icon className={`w-5 h-5 ${q.color} mb-2`} />
              <p className="text-sm font-bold text-gray-900">{q.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 group-hover:text-gray-600 transition-colors">
                Accéder <ArrowRight className="w-3 h-3" />
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function EmptyChart() {
  return <div className="h-40 flex items-center justify-center text-sm text-gray-300">Pas encore de données</div>;
}
