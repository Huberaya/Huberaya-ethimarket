import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Loader2, Ban, ShieldCheck,
  Mail, MapPin, X,
} from 'lucide-react';
import { supabase, type Profile, type Producer } from '../../lib/supabase';
import { AdminPageHeader } from '../../components/AdminLayout';

type UserRow = {
  profile: Profile;
  producer: Producer | null;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selected, setSelected] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    const [{ data: profiles }, { data: producers }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('producers').select('*'),
    ]);
    const producerMap = new Map((producers as Producer[] ?? []).map(p => [p.user_id, p]));
    const rows: UserRow[] = (profiles as Profile[] ?? []).map(p => ({ profile: p, producer: producerMap.get(p.id) ?? null }));
    setUsers(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateRole = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    await supabase.from('admin_audit_log').insert({ action: 'update_user_role', target_type: 'user', target_id: id, details: { role } });
    load();
    if (selected) setSelected({ ...selected, profile: { ...selected.profile, role } });
  };

  const filtered = users.filter(u => {
    if (search && !u.profile.full_name?.toLowerCase().includes(search.toLowerCase()) && !u.profile.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole !== 'all' && u.profile.role !== filterRole) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>;

  return (
    <div>
      <AdminPageHeader title="Utilisateurs" subtitle="Gérez tous les comptes utilisateurs" />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher (nom, email)..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white appearance-none cursor-pointer">
            <option value="all">Tous rôles</option>
            <option value="admin">Admin</option>
            <option value="producer">Producteur</option>
            <option value="buyer">Acheteur</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                <th className="text-left py-3 px-4">Nom</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Rôle</th>
                <th className="text-left py-3 px-4">Pays</th>
                <th className="text-left py-3 px-4">Inscrit le</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">Aucun utilisateur trouvé.</td></tr>}
              {filtered.map(u => (
                <tr key={u.profile.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelected(u)}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">{(u.profile.full_name ?? '?')[0]}</div>
                      <span className="font-semibold text-gray-900">{u.profile.full_name ?? 'Sans nom'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{u.profile.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.profile.role === 'admin' ? 'bg-red-100 text-red-700' : u.profile.role === 'producer' ? 'bg-brand-100 text-brand-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.profile.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{u.producer?.country ?? '—'}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{new Date(u.profile.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-xs font-bold text-brand-600 hover:underline">Gérer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Gérer l'utilisateur</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">{(selected.profile.full_name ?? '?')[0]}</div>
                <div>
                  <p className="font-bold text-gray-900">{selected.profile.full_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {selected.profile.email}</p>
                </div>
              </div>

              {selected.producer && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-gray-500 uppercase">Producteur associé</p>
                  <p className="text-sm font-semibold text-gray-900">{selected.producer.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {selected.producer.country_flag} {selected.producer.country}</p>
                  <p className="text-xs text-gray-500">Score: {selected.producer.ethimarket_score}/100 {selected.producer.badge_level && `• ${selected.producer.badge_level}`}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Rôle</p>
                <div className="flex gap-2">
                  {['admin', 'producer', 'buyer'].map(r => (
                    <button key={r} onClick={() => updateRole(selected.profile.id, r)} className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selected.profile.role === r ? 'bg-brand-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{r}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => updateRole(selected.profile.id, 'buyer')} className="flex-1 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 py-2.5 rounded-xl flex items-center justify-center gap-1.5"><Ban className="w-4 h-4" /> Suspendre</button>
                <button className="flex-1 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 py-2.5 rounded-xl flex items-center justify-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Vérifier</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
