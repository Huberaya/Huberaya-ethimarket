import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, ShoppingCart, Eye, Star, PlusCircle, Package,
  TrendingUp, ArrowRight, Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase, type Product } from '../lib/supabase';

export default function Dashboard() {
  const { user, profile, producer } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('products').select('*, producers(*), categories(*)')
      .eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setProducts(data);
        setLoading(false);
      });
  }, [user]);

  const displayName = profile?.full_name ?? user?.email ?? '';
  const firstName = displayName.split(' ')[0];
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const productCount = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock_value || 0), 0);
  const isNewProducer = productCount === 0;

  return (
    <div>
      {/* Greeting */}
      <div className="mb-7">
        <h1 className="text-2xl font-black text-gray-900">Bonjour, {firstName} 👋</h1>
        <p className="text-gray-500 text-sm mt-0.5 capitalize">{today}</p>
      </div>

      {/* Verification Status Banner */}
      {producer && (
        <>
          {producer.verification_status === 'draft' && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-200 text-amber-900 font-black text-xs rounded-full uppercase tracking-wider">
                      ⚠️ Boutique non publiée
                    </span>
                    <span className="text-xs font-bold text-amber-800">
                      Vérification requise
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900">
                    Votre boutique n'est pas encore en ligne.
                  </h2>
                  <p className="text-sm text-gray-700">
                    Complétez votre profil et soumettez votre dossier pour validation par notre équipe Bureau Veritas.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/dashboard/mon-profil"
                    className="px-5 py-2.5 bg-white text-gray-900 hover:bg-gray-100 text-xs font-bold rounded-xl border border-gray-200 transition-colors shadow-sm"
                  >
                    Compléter mon profil →
                  </Link>
                  <Link
                    to="/dashboard/verification"
                    className="btn-primary px-5 py-2.5 text-xs font-bold whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white shadow"
                  >
                    Soumettre mon dossier →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {producer.verification_status === 'submitted' && (
            <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-6 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-200 text-amber-900 font-black text-xs rounded-full uppercase tracking-wider">
                      🟡 Dossier soumis
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900">
                    Dossier soumis ! Notre équipe le vérifie sous 48h.
                  </h2>
                  <p className="text-sm text-gray-700">
                    Votre demande d'accréditation est enregistrée. Vous recevrez une alerte dès la mise en ligne de votre boutique.
                  </p>
                </div>

                <Link
                  to="/dashboard/verification"
                  className="btn-primary px-5 py-2.5 text-xs font-bold whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white shadow"
                >
                  Suivre mon statut →
                </Link>
              </div>
            </div>
          )}

          {producer.verification_status === 'under_review' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-200 text-blue-900 font-black text-xs rounded-full uppercase tracking-wider">
                      🔵 En cours d'examen
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900">
                    Votre dossier est en cours d'examen par notre équipe.
                  </h2>
                  <p className="text-sm text-gray-700">
                    L'auditeur Bureau Veritas analyse vos pièces justificatives et vos certifications.
                  </p>
                </div>

                <Link
                  to="/dashboard/verification"
                  className="btn-primary px-5 py-2.5 text-xs font-bold whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white shadow"
                >
                  Voir les détails →
                </Link>
              </div>
            </div>
          )}

          {producer.verification_status === 'rejected' && (
            <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-red-200 text-red-900 font-black text-xs rounded-full uppercase tracking-wider">
                      ❌ Dossier rejeté
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900">
                    Dossier rejeté. Motif : <span className="font-bold text-red-700">{producer.rejection_reason || 'Documents incomplets ou illisibles'}</span>
                  </h2>
                  <p className="text-sm text-gray-700">
                    Veuillez corriger les éléments manquants ou non conformes pour que nous puissions réexaminer votre boutique.
                  </p>
                </div>

                <Link
                  to="/dashboard/verification"
                  className="btn-primary px-5 py-2.5 text-xs font-bold whitespace-nowrap bg-red-600 hover:bg-red-700 text-white shadow"
                >
                  Corriger et resoumettre →
                </Link>
              </div>
            </div>
          )}

          {producer.verification_status === 'approved' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 mb-6 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-black text-gray-900 text-sm">Votre boutique est en ligne !</p>
                  <p className="text-xs text-emerald-800">Accrédité Bureau Veritas — Vos produits sont visibles publiquement sur le catalogue.</p>
                </div>
              </div>
              <Link
                to={`/boutique/${producer.id}`}
                target="_blank"
                className="px-4 py-2 bg-white text-emerald-700 border border-emerald-300 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-colors"
              >
                Voir ma boutique publique ↗
              </Link>
            </div>
          )}
        </>
      )}

      {/* Welcome banner for new producers */}
      {isNewProducer && !loading && (
        <div className="bg-gradient-to-r from-brand-500 to-teal-400 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-black text-lg mb-1">Bienvenue sur EthiMarket !</h2>
              <p className="text-white/80 text-sm mb-4">Commencez par ajouter votre premier produit pour lancer votre boutique.</p>
              <Link to="/dashboard/ajouter-produit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-600 font-bold text-sm rounded-xl hover:bg-brand-50 transition-colors">
                <PlusCircle className="w-4 h-4" />
                Ajouter mon premier produit
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Chiffre d'affaires", value: '0 €',      change: 'Nouveau compte',     icon: CreditCard,   color: 'bg-brand-50 text-brand-600' },
          { label: 'Commandes',          value: '0',         change: 'Nouveau compte',     icon: ShoppingCart,  color: 'bg-blue-50 text-blue-600' },
          { label: 'Vues produits',       value: '0',         change: 'Nouveau compte',     icon: Eye,           color: 'bg-violet-50 text-violet-600' },
          { label: 'Note moyenne',        value: '—',        change: 'Pas encore d\'avis', icon: Star,          color: 'bg-amber-50 text-amber-500' },
        ].map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-2">{value}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-400">{change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Products summary + quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900">Mes produits</h2>
              <p className="text-sm text-gray-400 mt-0.5">{productCount} produit{productCount > 1 ? 's' : ''} au total</p>
            </div>
            <Link to="/dashboard/mes-produits" className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl skeleton" />)}
            </div>
          ) : productCount > 0 ? (
            <div className="space-y-3">
              {products.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg" style={{ backgroundColor: p.bg_color }}>{p.emoji}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.price.toFixed(2)} {p.currency === 'EUR' ? '€' : p.currency} / {p.price_unit} · Stock: {p.stock_value} {p.stock_unit}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'active' ? 'Actif' : 'Brouillon'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">Vous n'avez pas encore de produits.</p>
              <Link to="/dashboard/ajouter-produit" className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Ajouter un produit
              </Link>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Aperçu</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-brand-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Produits actifs</span>
              </div>
              <span className="text-lg font-black text-gray-900">{productCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Stock total</span>
              </div>
              <span className="text-lg font-black text-gray-900">{totalStock.toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Avis reçus</span>
              </div>
              <span className="text-lg font-black text-gray-900">0</span>
            </div>
          </div>

          {producer && (
            <Link to={`/boutique/${producer.slug}`} className="mt-5 btn-outline w-full py-2.5 text-sm flex items-center justify-center gap-2">
              Voir ma boutique publique <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
