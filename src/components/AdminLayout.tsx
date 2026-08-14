import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShieldCheck, Award, Package, ShoppingCart,
  AlertTriangle, Wallet, Users, Bell, Menu, X,
  LogOut, ChevronDown, Leaf, Settings, Building2,
  ClipboardCheck, Globe, FileText
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase, type AdminNotification } from '../lib/supabase';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
      { to: '/admin/producteurs', label: 'Producteurs', icon: Users },
      { to: '/admin/verifications', label: 'Vérifications', icon: ShieldCheck },
      { to: '/admin/organismes', label: 'Organismes certif.', icon: Building2 },
    ]
  },
  {
    title: 'Certifications & Audit',
    items: [
      { to: '/admin/certifications', label: 'Tableau de bord certifications', icon: ShieldCheck, end: true },
      { to: '/admin/certifications/producers', label: 'Certifications producteurs', icon: ClipboardCheck },
      { to: '/admin/certifications/bodies', label: 'Organismes mondiaux', icon: Globe },
      { to: '/admin/certifications/templates', label: 'Templates de messages', icon: FileText },
    ]
  },
  {
    title: 'Gestion & Commerce',
    items: [
      { to: '/admin/produits', label: 'Produits', icon: Package },
      { to: '/admin/commandes', label: 'Commandes', icon: ShoppingCart },
      { to: '/admin/litiges', label: 'Litiges', icon: AlertTriangle },
      { to: '/admin/finances', label: 'Finances', icon: Wallet },
      { to: '/admin/configuration', label: 'Configuration', icon: Settings },
    ]
  }
];

const NOTIF_ICONS: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  new_producer: { icon: ShieldCheck, color: 'text-brand-600', bg: 'bg-brand-50' },
  dispute: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  expiring_cert: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
  fraud: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  new_order: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<AdminNotification[]>([]);
  const [pendingVerifsCount, setPendingVerifsCount] = useState(0);
  const [pendingCertCount, setPendingCertCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadNotifsAndCounts = useCallback(async () => {
    try {
      const [{ data: nData }, { count: verifCount }, { count: certCount }] = await Promise.all([
        supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('producers')
          .select('*', { count: 'exact', head: true })
          .in('verification_status', ['submitted', 'under_review']),
        supabase
          .from('producer_certifications')
          .select('*', { count: 'exact', head: true })
          .in('status', ['unverified', 'pending', 'contact_sent', 'manual_required']),
      ]);

      setNotifs((nData as AdminNotification[]) ?? []);
      setPendingVerifsCount(verifCount ?? 0);
      setPendingCertCount(certCount ?? 0);
    } catch {
      // Fallback gracieux si une table n'est pas accessible
    }
  }, []);

  useEffect(() => { loadNotifsAndCounts(); }, [loadNotifsAndCounts]);

  const unreadCount = notifs.filter(n => !n.read && !n.is_read).length;

  const markAllRead = async () => {
    await supabase.from('admin_notifications').update({ read: true }).eq('read', false);
    loadNotifsAndCounts();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-100 flex flex-col transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm leading-tight">EthiMarket</p>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Administration</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.title && (
                <div className="px-3 pb-1 pt-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {group.title}
                  </p>
                </div>
              )}
              {group.items.map(item => {
                const Icon = item.icon;
                const isVerifications = item.to === '/admin/verifications';
                const isProducerCerts = item.to === '/admin/certifications/producers';
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isVerifications && pendingVerifsCount > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-black bg-red-500 text-white rounded-full ml-2 flex-shrink-0">
                        {pendingVerifsCount}
                      </span>
                    )}
                    {isProducerCerts && pendingCertCount > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-black bg-amber-500 text-white rounded-full ml-2 flex-shrink-0">
                        {pendingCertCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 h-16 flex items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setNotifOpen(o => !o); if (!notifOpen && unreadCount > 0) markAllRead(); }} className="relative w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-12 z-40 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-50">
                    <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {notifs.length === 0 && <p className="p-4 text-sm text-gray-400 text-center">Aucune notification</p>}
                    {notifs.map(n => {
                      const info = NOTIF_ICONS[n.type] ?? NOTIF_ICONS.new_order;
                      const Icon = info.icon;
                      return (
                        <button
                          key={n.id}
                          onClick={() => { if (n.link) navigate(n.link); setNotifOpen(false); }}
                          className="w-full flex items-start gap-3 p-4 hover:bg-gray-50 text-left transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${info.bg}`}>
                            <Icon className={`w-4 h-4 ${info.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('fr-FR')}</p>
                          </div>
                          {n.priority === 'urgent' && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">URGENT</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button onClick={() => setProfileOpen(o => !o)} className="flex items-center gap-2 hover:bg-gray-100 rounded-xl px-2 py-1.5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                {(profile?.full_name ?? 'A')[0]}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[120px] truncate">{profile?.full_name ?? 'Admin'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-12 z-40 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                  </div>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export type AdminPageHeaderProps = { title: string; subtitle?: string; children?: ReactNode };
export function AdminPageHeader({ title, subtitle, children }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
