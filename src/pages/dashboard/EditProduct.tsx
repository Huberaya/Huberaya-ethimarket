import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, Check, ArrowLeft, Loader2, Save } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase, type Category, type Product } from '../../lib/supabase';

const COUNTRIES = [
  'France', 'Belgique', 'Suisse', 'Canada', 'Maroc', 'Éthiopie', 'Iran', 'Madagascar',
  'Pérou', 'Ghana', 'Grèce', 'Japon', 'Sri Lanka', 'Inde', 'Mexique', 'Brésil', 'Vietnam', 'Thaïlande',
];

const COUNTRY_FLAGS: Record<string, string> = {
  'France': '🇫🇷', 'Belgique': '🇧🇪', 'Suisse': '🇨🇭', 'Canada': '🇨🇦',
  'Maroc': '🇲🇦', 'Éthiopie': '🇪🇹', 'Iran': '🇮🇷', 'Madagascar': '🇲🇬',
  'Pérou': '🇵🇪', 'Ghana': '🇬🇭', 'Grèce': '🇬🇷', 'Japon': '🇯🇵',
  'Sri Lanka': '🇱🇰', 'Inde': '🇮🇳', 'Mexique': '🇲🇽', 'Brésil': '🇧🇷',
  'Vietnam': '🇻🇳', 'Thaïlande': '🇹🇭',
};

const CERT_OPTIONS = ['Bio', 'Fairtrade', 'Ecocert', 'Rainforest Alliance', 'GlobalGAP'];
const CURRENCIES = ['EUR', 'USD', 'MAD', 'XOF'];
const UNITS = ['kg', 'L', 'pièce', 'palette'];

export default function EditProduct() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: '', short_description: '', description: '',
    category_id: '', price: '', currency: 'EUR',
    moq_value: '1', moq_unit: 'kg',
    stock_value: '0', stock_unit: 'kg',
    country: 'France', region: '',
    certifications: [] as string[],
    status: 'active',
  });

  useEffect(() => {
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => data && setCategories(data));

    if (!id || !user) return;
    supabase.from('products').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const p = data as Product;
          setProduct(p);
          setForm({
            name: p.name, short_description: p.short_description ?? '', description: p.description ?? '',
            category_id: p.category_id ?? '', price: p.price.toString(), currency: p.currency,
            moq_value: p.moq_value.toString(), moq_unit: p.moq_unit,
            stock_value: p.stock_value.toString(), stock_unit: p.stock_unit,
            country: p.country, region: p.region ?? '',
            certifications: p.certifications, status: p.status,
          });
          setImagePreview(p.image_url);
        }
        setLoading(false);
      });
  }, [id, user]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleCert = (cert: string) => {
    setForm(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    setSaving(true);
    setError('');

    let imageUrl = product.image_url;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, imageFile);
      if (!uploadErr) imageUrl = supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl;
    }

    const { error: updateErr } = await supabase.from('products').update({
      name: form.name,
      short_description: form.short_description || null,
      description: form.description || null,
      category_id: form.category_id || null,
      price: parseFloat(form.price) || 0,
      currency: form.currency,
      moq_value: parseInt(form.moq_value) || 1,
      moq_unit: form.moq_unit,
      stock_value: parseInt(form.stock_value) || 0,
      stock_unit: form.stock_unit,
      country: form.country,
      country_flag: COUNTRY_FLAGS[form.country] ?? '🌍',
      region: form.region || null,
      certifications: form.certifications,
      status: form.status,
      image_url: imageUrl,
    }).eq('id', product.id).eq('user_id', user.id);

    if (updateErr) setError(updateErr.message);
    else navigate('/dashboard/mes-produits?success=2');
    setSaving(false);
  };

  const inputClass = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>;

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Produit introuvable ou vous n'avez pas la permission de le modifier.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/dashboard/mes-produits')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" /> Retour aux produits
        </button>
        <h1 className="text-2xl font-black text-gray-900">Modifier le produit</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className={labelClass}>Photo du produit</label>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 flex-shrink-0">
              {imagePreview ? <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" /> : <Upload className="w-7 h-7 text-gray-300" />}
            </div>
            <div className="flex-1">
              <input type="file" accept="image/*" onChange={handleImageChange} id="edit-product-image" className="hidden" />
              <label htmlFor="edit-product-image" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer transition-colors">
                <Upload className="w-4 h-4" /> {imageFile ? 'Changer l\'image' : 'Choisir une image'}
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className={labelClass}>Nom du produit *</label>
            <input type="text" required value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description courte</label>
            <input type="text" value={form.short_description} onChange={e => update('short_description', e.target.value)} className={inputClass} maxLength={120} />
          </div>
          <div>
            <label className={labelClass}>Description longue</label>
            <textarea rows={4} value={form.description} onChange={e => update('description', e.target.value)} className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className={labelClass}>Catégorie</label>
            <select value={form.category_id} onChange={e => update('category_id', e.target.value)} className={inputClass}>
              <option value="">Sélectionner...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Statut</label>
            <select value={form.status} onChange={e => update('status', e.target.value)} className={inputClass}>
              <option value="active">Actif (visible dans le catalogue)</option>
              <option value="draft">Brouillon (non visible)</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Prix et quantité</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Prix *</label>
              <input type="number" step="0.01" required value={form.price} onChange={e => update('price', e.target.value)} min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Devise</label>
              <select value={form.currency} onChange={e => update('currency', e.target.value)} className={inputClass}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Unité</label>
              <select value={form.moq_unit} onChange={e => { update('moq_unit', e.target.value); update('stock_unit', e.target.value); }} className={inputClass}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>MOQ *</label>
              <input type="number" required value={form.moq_value} onChange={e => update('moq_value', e.target.value)} min="1" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input type="number" value={form.stock_value} onChange={e => update('stock_value', e.target.value)} min="0" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Origine</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Pays</label>
              <select value={form.country} onChange={e => update('country', e.target.value)} className={inputClass}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Région</label>
              <input type="text" value={form.region} onChange={e => update('region', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className={labelClass}>Certifications</label>
          <div className="flex flex-wrap gap-2">
            {CERT_OPTIONS.map(cert => (
              <button key={cert} type="button" onClick={() => toggleCert(cert)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.certifications.includes(cert) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {form.certifications.includes(cert) && <Check className="w-3.5 h-3.5" />}
                {cert}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="btn-primary flex-1 py-3.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : <><Save className="w-4 h-4" /> Enregistrer les modifications</>}
          </button>
          <button type="button" onClick={() => navigate('/dashboard/mes-produits')}
            className="px-6 py-3.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
