import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, ArrowLeft, Loader2, Sprout } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase, type Category } from '../../lib/supabase';
import { COUNTRIES, getCountryFlag } from '../../lib/countries';

const CERT_OPTIONS = ['Bio', 'Fairtrade', 'Ecocert', 'Rainforest Alliance', 'GlobalGAP'];
const CURRENCIES = ['EUR', 'USD', 'MAD', 'XOF'];
const UNITS = ['kg', 'L', 'pièce', 'palette'];
const FARMING_METHODS = ['Agriculture biologique', 'Permaculture', 'Biodynamie', 'Agroforesterie', 'Agriculture raisonnée'];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export default function AddProduct() {
  const { user, producer } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
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
    planting_date: '', harvest_date: '', packaging_date: '',
    farming_method: '', gps_coordinates: '', co2_estimate: '',
  });

  useEffect(() => {
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => data && setCategories(data));
  }, []);

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
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSubmitting(true);

    try {
      const { data: producerRow } = await supabase.from('producers')
        .select('id').eq('user_id', user.id).maybeSingle();

      let producerId = producerRow?.id;

      if (!producerId) {
        const fullName = (user.user_metadata?.full_name) || (user.user_metadata?.first_name + ' ' + user.user_metadata?.last_name).trim() || user.email?.split('@')[0] || 'Producteur';
        const colors = ['#15803d', '#92400e', '#b45309', '#7c2d12', '#451a03', '#0369a1'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const initials = fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const { data: newProd, error: createErr } = await supabase.from('producers').insert({
          user_id: user.id,
          name: fullName,
          slug: slugify(`${fullName}-${Date.now().toString().slice(-4)}`),
          country: 'France',
          country_flag: '🇫🇷',
          avatar_initials: initials,
          avatar_color: color,
          banner_color: color,
          verified: false,
          top_seller: false,
          rating: 0,
          review_count: 0,
          product_count: 0,
          order_count: 0,
          satisfaction_rate: 100,
          response_time: '24h',
          certifications: [],
          profile_status: 'incomplete',
        }).select('id').single();

        if (createErr || !newProd) {
          setError('Impossible de créer votre profil producteur: ' + (createErr?.message ?? 'erreur inconnue'));
          setSubmitting(false);
          return;
        }
        producerId = newProd.id;
      }

      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, imageFile);
        if (uploadErr) {
          setError('Erreur lors de l\'upload de l\'image: ' + uploadErr.message);
          setSubmitting(false);
          return;
        }
        imageUrl = supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl;
      }

      const { error: insertErr } = await supabase.from('products').insert({
        name: form.name,
        slug: slugify(`${form.name}-${Date.now().toString().slice(-4)}`),
        producer_id: producerId,
        category_id: form.category_id || null,
        country: form.country,
        country_flag: getCountryFlag(form.country),
        description: form.description || null,
        short_description: form.short_description || null,
        region: form.region || null,
        price: parseFloat(form.price) || 0,
        price_unit: form.moq_unit,
        moq_value: parseInt(form.moq_value) || 1,
        moq_unit: form.moq_unit,
        stock_value: parseInt(form.stock_value) || 0,
        stock_unit: form.stock_unit,
        monthly_capacity: 0,
        delivery_days: '5-7',
        certifications: form.certifications,
        rating: 0,
        review_count: 0,
        emoji: '🌿',
        bg_color: '#dcfce7',
        image_url: imageUrl,
        currency: form.currency,
        status: 'active',
        featured: false,
        top_seller: false,
        planting_date: form.planting_date || null,
        harvest_date: form.harvest_date || null,
        packaging_date: form.packaging_date || null,
        farming_method: form.farming_method || null,
        gps_coordinates: form.gps_coordinates || null,
        co2_estimate: form.co2_estimate || null,
      });

      if (insertErr) {
        setError(insertErr.message);
        setSubmitting(false);
        return;
      }

      navigate('/dashboard/mes-produits?success=1');
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/dashboard/mes-produits')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" /> Retour aux produits
        </button>
        <h1 className="text-2xl font-black text-gray-900">Ajouter un produit</h1>
        <p className="text-gray-500 text-sm mt-1">Renseignez les informations de votre produit</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
          {error}
        </div>
      )}

      {producer && (!producer.name || !producer.country) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl mb-5">
          Complétez votre profil producteur pour augmenter votre visibilité et celle de vos produits.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {/* Image upload */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className={labelClass}>Photo du produit</label>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 flex-shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-7 h-7 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <input type="file" accept="image/*" onChange={handleImageChange} id="product-image" className="hidden" />
              <label htmlFor="product-image" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                {imageFile ? 'Changer l\'image' : 'Choisir une image'}
              </label>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG ou WebP. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className={labelClass}>Nom du produit *</label>
            <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="Ex: Huile d'argan bio 250ml" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description courte</label>
            <input type="text" value={form.short_description} onChange={e => update('short_description', e.target.value)}
              placeholder="Une phrase qui résume votre produit" className={inputClass} maxLength={120} />
          </div>
          <div>
            <label className={labelClass}>Description longue</label>
            <textarea rows={4} value={form.description} onChange={e => update('description', e.target.value)}
              placeholder="Décrivez votre produit en détail: origine, méthode de production, qualités..." className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className={labelClass}>Catégorie</label>
            <select value={form.category_id} onChange={e => update('category_id', e.target.value)} className={inputClass}>
              <option value="">Sélectionner une catégorie...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Prix et quantité</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Prix *</label>
              <input type="number" step="0.01" required value={form.price} onChange={e => update('price', e.target.value)}
                placeholder="0.00" min="0" className={inputClass} />
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
              <label className={labelClass}>MOQ (quantité min.) *</label>
              <input type="number" required value={form.moq_value} onChange={e => update('moq_value', e.target.value)}
                min="1" placeholder="1" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Stock disponible</label>
              <input type="number" value={form.stock_value} onChange={e => update('stock_value', e.target.value)}
                min="0" placeholder="0" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Origin */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Origine</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Pays d'origine</label>
              <select value={form.country} onChange={e => update('country', e.target.value)} className={inputClass}>
                {COUNTRIES.map(c => <option key={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Région</label>
              <input type="text" value={form.region} onChange={e => update('region', e.target.value)}
                placeholder="Ex: Souss-Massa" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Certifications */}
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

        {/* Traceability */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Sprout className="w-4 h-4 text-brand-500" /> Traçabilité (optionnel)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Date de plantation / production</label>
              <input type="date" value={form.planting_date} onChange={e => update('planting_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date de récolte</label>
              <input type="date" value={form.harvest_date} onChange={e => update('harvest_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date d'emballage</label>
              <input type="date" value={form.packaging_date} onChange={e => update('packaging_date', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Méthode de culture</label>
            <select value={form.farming_method} onChange={e => update('farming_method', e.target.value)} className={inputClass}>
              <option value="">Sélectionner...</option>
              {FARMING_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Coordonnées GPS de la parcelle</label>
              <input type="text" value={form.gps_coordinates} onChange={e => update('gps_coordinates', e.target.value)}
                placeholder="Ex: 30.4, -9.5" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Impact carbone estimé</label>
              <input type="text" value={form.co2_estimate} onChange={e => update('co2_estimate', e.target.value)}
                placeholder="Ex: 0.5 kg CO2/kg" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={submitting}
            className="btn-primary flex-1 py-3.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Publication...</>
            ) : (
              <>Publier le produit</>
            )}
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
