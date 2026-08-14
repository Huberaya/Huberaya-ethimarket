import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { PlusCircle, Package, Pencil, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase, type Product } from '../../lib/supabase';

export default function MyProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const showSuccess = searchParams.get('success') === '1';

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('products').select('*, producers(*), categories(*)')
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ? Cette action est irréversible.')) return;
    setDeleting(id);
    await supabase.from('products').delete().eq('id', id);
    setDeleting(null);
    fetchProducts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Mes produits</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} produit{products.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/dashboard/ajouter-produit" className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Ajouter un produit
        </Link>
      </div>

      {showSuccess && (
        <div className="bg-brand-50 border border-brand-200 text-brand-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Produit publié avec succès ! Il est maintenant visible dans le catalogue.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl skeleton" />)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <Link to={`/produit/${p.id}`} className="block relative h-40 overflow-hidden bg-gray-100">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl" style={{ backgroundColor: p.bg_color }}>{p.emoji}</div>
                )}
                <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${p.status === 'active' ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {p.status === 'active' ? 'Actif' : 'Brouillon'}
                </span>
              </Link>
              <div className="p-4">
                <Link to={`/produit/${p.id}`}>
                  <h3 className="font-bold text-gray-900 text-sm mb-1 hover:text-brand-600 transition-colors">{p.name}</h3>
                </Link>
                <p className="text-xs text-gray-500 mb-3">{p.price.toFixed(2)} {p.currency === 'EUR' ? '€' : p.currency} / {p.price_unit} · Stock: {p.stock_value} {p.stock_unit}</p>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/dashboard/modifier-produit/${p.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                    {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Aucun produit</h3>
          <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">Vous n'avez pas encore ajouté de produits. Commencez dès maintenant !</p>
          <Link to="/dashboard/ajouter-produit" className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Ajouter mon premier produit
          </Link>
        </div>
      )}
    </div>
  );
}
