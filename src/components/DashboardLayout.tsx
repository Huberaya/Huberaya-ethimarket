import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, PlusCircle, Store, ShoppingCart,
  MessageSquare, Settings, Leaf, Bell, LogOut, Menu, X,
  ChevronRight, UserCircle, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const NAV = [
  { icon: LayoutDashboard, label: 'Vue d\'ensemble', path: '/dashboard' },
  { icon: ShieldCheck,    label: 'Vérification',     path: '/dashboard/verification', producerOnly: true },
  { icon: Package,         label: 'Mes produits',    path: '/dashboard/mes-produits' },
  { icon: PlusCircle,      label: 'Ajouter un produit', path: '/dashboard/ajouter-produit', producerOnly: true },
  { icon: Store,           label: 'Ma boutique',     path: '/dashboard/ma-boutique' },
  { icon: UserCircle,      label: 'Mon profil',       path: '/dashboard/mon-profil' },
  { icon: ShoppingCart,    label: 'Commandes',        path: '/dashboard/commandes' },
  { icon: MessageSquare,   label: 'Messages',         path: '/dashboard/messages' },
  { icon: Settings,        label: 'Paramètres',       path: '/dashboard/parametres' },
] as const;

function VerificationBadge({ producerId }: { producerId: string }) {
  const [status, setStatus] = useState<string>('pending');
  useEffect(() => {
    supabase.from('producer_verifications')
      .select('section_1_status, section_2_status, section_3_status, section_4_status, section_5_status')
      .eq('producer_id', producerId).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const statuses = [data.section_1_status, data.section_2_status, data.section_3_status, data.section_4_status, data.section_5_status];
        if (statuses.every((s: string) => s === 'approved')) setStatus('approved');
        else if (statuses.some((s: string) => s === 'submitted')) setStatus('submitted');
        else setStatus('pending');
      });
  }, [producerId]);

  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-500',
    submitted: 'bg-amber-100 text-amber-600',
    approved: 'bg-brand-100 text-brand-700',
  };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors[status]}`}>{status === 'approved' ? '✓' : '!'}</span>;
}

function UnreadMessagesBadge({ userId }: { userId: string }) {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!userId) return;

    const fetchUnread = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('participant_1, participant_2, unread_count_1, unread_count_2')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

      if (!data) return;
      let total = 0;
      data.forEach((c) => {
        if (c.participant_1 === userId) total += c.unread_count_1 || 0;
        if (c.participant_2 === userId) total += c.unread_count_2 || 0;
      });
      setUnreadCount(total);
    };

    fetchUnread();

    const channel = supabase
      .channel(`unread_badge_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `participant_1=eq.${userId}` },
        () => fetchUnread()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `participant_2=eq.${userId}` },
        () => fetchUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (unreadCount <= 0) return null;

  return (
    <span className="bg-brand-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
      {unreadCount}
    </span>
  );
}

export default function DashboardLayout() {
  const { user, profile, producer, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = profile?.full_name ?? user?.email ?? 'Mon compte';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col shadow-xl transition-transform duration-300 lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:z-auto`}>
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-black text-brand-800 text-lg">EthiMarket</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
            <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{producer?.name ?? 'Boutique non configurée'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV.filter(item => !('producerOnly' in item) || (item as { producerOnly?: boolean }).producerOnly === !!producer).map(({ icon: Icon, label, path }) => (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive(path) ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive(path) ? 'text-brand-600' : 'text-gray-400'}`} />
                  <span className="flex-1 text-left">{label}</span>
                  {path === '/dashboard/verification' && producer && (
                    <VerificationBadge producerId={producer.id} />
                  )}
                  {path === '/dashboard/messages' && user && (
                    <UnreadMessagesBadge userId={user.id} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 space-y-2">
          {producer && (
            <Link to={`/boutique/${producer.slug}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-brand-600 transition-colors font-medium">
              <ChevronRight className="w-3.5 h-3.5" />
              Voir ma boutique publique
            </Link>
          )}
          <button onClick={handleSignOut} className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-500 transition-colors font-medium">
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between gap-4 flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <Link to="/" className="hover:text-brand-600 transition-colors">Accueil</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-700 font-semibold">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
            </button>
            <Link to="/dashboard/ajouter-produit" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors">
              <PlusCircle className="w-4 h-4" />
              Ajouter un produit
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
