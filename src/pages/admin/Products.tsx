import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, CheckCircle2, Ban, Loader2,
  Eye, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, type Product } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';

export default function AdminProducts() {
  const [products, setProducts] = useState<(Product & { producers?: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<Product & { producers?: { name: string } | null } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('products').select('*, producers(name)').order('created_at', { ascending: false });
    setProducts((data as (Product & { producers?: { name: string } | null })[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Moderation status is inferred from product_score and featured flags
  // For demo: score 0 = pending, >0 = approved, featured = approved
  const getStatus = (p: Product) => {
    if (p.product_score > 0) return 'approved';
    return 'pending';
  };

  const setStatus = async (p: Product, status: 'approved' | 'rejected' | 'suspended') => {
    if (status === 'approved') {
      await supabase.from('products').update({ featured: true }).eq('id', p.id);
    } else {
      await supabase.from('products').update({ featured: false }).eq('id', p.id);
    }
    await supabase.from('admin_audit_log').insert({ action: `product_${status}`, target_type: 'product', target_id: p.id, details: {} });
    load();
  };

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && getStatus(p) !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>;

  return (
    <div>
      <AdminPageHeader title="Gestion des produits" subtitle="Modérez tous les produits de la plateforme" />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white appearance-none cursor-pointer">
            <option value="all">Tous statuts</option>
            <option value="approved">Approuvés</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && <div className="col-span-full text-center py-16 text-gray-400 text-sm">Aucun produit trouvé.</div>}
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="relative h-32 bg-gray-100 flex items-center justify-center text-5xl" style={{ backgroundColor: p.bg_color }}>
              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : p.emoji}
              <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full ${getStatus(p) === 'approved' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'}`}>
                {getStatus(p) === 'approved' ? 'Approuvé' : 'En attente'}
              </span>
            </div>
            <div className="p-4">
              <p className="font-bold text-sm text-gray-900 truncate">{p.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{p.producers?.name ?? '—'} • {p.country_flag} {p.country}</p>
              <p className="text-sm font-black text-gray-900 mt-2">{p.price.toFixed(2)} €/{p.price_unit}</p>
              <div className="flex items-center gap-1.5 mt-3">
                <button onClick={() => setSelected(p)} className="flex-1 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 py-1.5 rounded-lg flex items-center justify-center gap-1"><Eye className="w-3.5 h-3.5" /> Détails</button>
                {getStatus(p) !== 'approved' ? (
                  <button onClick={() => setStatus(p, 'approved')} className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 flex items-center justify-center" title="Approuver"><CheckCircle2 className="w-4 h-4" /></button>
                ) : (
                  <button onClick={() => setStatus(p, 'rejected')} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center" title="Suspendre"><Ban className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative h-40 flex items-center justify-center text-6xl" style={{ backgroundColor: selected.bg_color }}>
              {selected.image_url ? <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover" /> : selected.emoji}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <h2 className="text-lg font-black text-gray-900">{selected.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{selected.description}</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Info label="Prix" value={`${selected.price.toFixed(2)} €/${selected.price_unit}`} />
                <Info label="MOQ" value={`${selected.moq_value} ${selected.moq_unit}`} />
                <Info label="Stock" value={`${selected.stock_value} ${selected.stock_unit}`} />
                <Info label="Livraison" value={`${selected.delivery_days} j`} />
                <Info label="Pays" value={`${selected.country_flag} ${selected.country}`} />
                <Info label="Score" value={`${selected.product_score}/100`} />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {selected.certifications.map(c => <span key={c} className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{c}</span>)}
              </div>
              <div className="flex gap-2 mt-5">
                <Link to={`/produit/${selected.id}`} target="_blank" className="flex-1 text-center text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 py-2.5 rounded-xl">Voir la fiche</Link>
                <button onClick={() => setStatus(selected, 'approved')} className="flex-1 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 py-2.5 rounded-xl">Approuver</button>
                <button onClick={() => setStatus(selected, 'rejected')} className="flex-1 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 py-2.5 rounded-xl">Suspendre</button>
              </div>
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
