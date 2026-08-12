import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, ArrowLeft, Loader2, Sprout, PackagePlus } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase, type Category } from '../../lib/supabase';
import { COUNTRIES, getCountryFlag } from '../../lib/countries';
import { cleanPayload, toFloatOrNull, toIntOrNull, toStringOrNull, toDateOrNull } from '../../lib/dbHelpers';

const CERT_OPTIONS = ['Bio', 'Fairtrade', 'Ecocert', 'Rainforest Alliance', 'GlobalGAP'];
const CURRENCIES = ['EUR', 'USD', 'MAD', 'XOF'];
const UNITS = ['kg', 'g', 'L', 'mL', 'pièce', 'palette', 'tonnes'];
const FARMING_METHODS = [
  'Agriculture biologique',
  'Permaculture',
  'Biodynamie',
  'Agroforesterie',
  'Agriculture raisonnée',
  'Traditionnelle'
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export default function AddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [producerId, setProducerId] = useState<string | null>(null);
  const [loadingProducer, setLoadingProducer] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: '',
    short_description: '',
    description: '',
    category_id: '',
    price: '',
    currency: 'EUR',
    moq_value: '1',
    moq_unit: 'kg',
    stock_value: '10',
    stock_unit: 'kg',
    country: 'France',
    region: '',
    certifications: [] as string[],
    planting_date: '',
    harvest_date: '',
    packaging_date: '',
    farming_method: '',
    gps_coordinates: '',
    co2_estimate: '',
    batch_number: '',
  });

  // Load categories and auto-retrieve or auto-create user's producer profile
  useEffect(() => {
    let isMounted = true;

    // Load categories
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => {
        if (isMounted && data) setCategories(data);
      });

    async function ensureProducer() {
      if (!user) {
        if (isMounted) setLoadingProducer(false);
        return;
      }

      try {
        // 1. Try finding existing producer record
        const { data: existingProducer, error: fetchErr } = await supabase
          .from('producers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!fetchErr && existingProducer?.id) {
          if (isMounted) {
            setProducerId(existingProducer.id);
            setLoadingProducer(false);
          }
          return;
        }

        // 2. If no producer exists, create one automatically
        const fullName =
          (user.user_metadata?.full_name) ||
          [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') ||
          user.email?.split('@')[0] ||
          'Producteur';

        const slug = slugify(`${fullName}-${Date.now().toString().slice(-4)}`);
        const initials = fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'EM';
        const colors = ['#15803d', '#92400e', '#b45309', '#7c2d12', '#0369a1'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const newProducerPayload = cleanPayload({
          user_id: user.id,
          name: fullName,
          slug: slug,
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
        });

        const { data: newProd, error: createErr } = await supabase
          .from('producers')
          .insert(newProducerPayload)
          .select('id')
          .single();

        if (!createErr && newProd?.id) {
          if (isMounted) setProducerId(newProd.id);
        } else {
          console.error('Auto-creation of producer profile error:', createErr);
        }
      } catch (err) {
        console.error('Error ensuring producer:', err);
      } finally {
        if (isMounted) setLoadingProducer(false);
      }
    }

    ensureProducer();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image est trop lourde (maximum 5 Mo).');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Vous devez être connecté pour publier un produit.');
      return;
    }

    if (!form.name.trim()) {
      setError('Le nom du produit est obligatoire.');
      return;
    }

    if (!form.price || parseFloat(form.price) <= 0) {
      setError('Le prix doit être un nombre supérieur à 0.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // Ensure we have a valid producer ID
      let currentProducerId = producerId;

      if (!currentProducerId) {
        const { data: pData } = await supabase
          .from('producers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (pData?.id) {
          currentProducerId = pData.id;
        } else {
          // Fallback auto-creation if not created earlier
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Producteur';
          const slug = slugify(`${fullName}-${Date.now().toString().slice(-4)}`);

          const { data: createdP, error: pErr } = await supabase
            .from('producers')
            .insert(cleanPayload({
              user_id: user.id,
              name: fullName,
              slug: slug,
              country: form.country || 'France',
              country_flag: getCountryFlag(form.country || 'France'),
              verified: false,
              rating: 0,
              profile_status: 'incomplete'
            }))
            .select('id')
            .single();

          if (pErr || !createdP?.id) {
            throw new Error('Impossible de configurer le profil producteur: ' + (pErr?.message ?? 'erreur inconnue'));
          }
          currentProducerId = createdP.id;
        }
      }

      // Handle product image upload
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, imageFile);

        if (uploadErr) {
          throw new Error('Erreur lors du téléversement de la photo du produit: ' + uploadErr.message);
        }

        imageUrl = supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl;
      }

      // Build product insert payload using cleanPayload
      const productSlug = slugify(`${form.name}-${Date.now().toString().slice(-4)}`);
      const countryFlag = getCountryFlag(form.country);

      const rawProductData = {
        user_id: user.id,
        producer_id: currentProducerId,
        name: toStringOrNull(form.name),
        slug: productSlug,
        category_id: toStringOrNull(form.category_id),
        country: toStringOrNull(form.country) ?? 'France',
        country_flag: countryFlag,
        region: toStringOrNull(form.region),
        short_description: toStringOrNull(form.short_description),
        description: toStringOrNull(form.description),
        price: toFloatOrNull(form.price) ?? 0,
        currency: toStringOrNull(form.currency) ?? 'EUR',
        price_unit: form.moq_unit,
        moq_value: toIntOrNull(form.moq_value) ?? 1,
        moq_unit: form.moq_unit,
        stock_value: toIntOrNull(form.stock_value) ?? 0,
        stock_unit: form.stock_unit,
        monthly_capacity: 0,
        delivery_days: '5-7',
        certifications: form.certifications && form.certifications.length > 0 ? form.certifications : [],
        rating: 0,
        review_count: 0,
        emoji: '🌿',
        bg_color: '#dcfce7',
        image_url: imageUrl,
        status: 'active',
        featured: false,
        top_seller: false,
        planting_date: toDateOrNull(form.planting_date),
        harvest_date: toDateOrNull(form.harvest_date),
        packaging_date: toDateOrNull(form.packaging_date),
        farming_method: toStringOrNull(form.farming_method),
        gps_coordinates: toStringOrNull(form.gps_coordinates),
        co2_estimate: toStringOrNull(form.co2_estimate),
        batch_number: toStringOrNull(form.batch_number),
      };

      const cleanedProductData = cleanPayload(rawProductData);

      const { error: insertErr } = await supabase.from('products').insert(cleanedProductData);

      if (insertErr) {
        throw new Error('Erreur lors de la sauvegarde du produit: ' + insertErr.message);
      }

      // Navigate back to product list with success message
      navigate('/dashboard/mes-produits?success=1');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard/mes-produits')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux produits
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Ajouter un produit</h1>
            <p className="text-gray-500 text-sm mt-0.5">Renseignez les informations et la traçabilité de votre produit</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl mb-6 flex items-start gap-2.5">
          <span className="font-bold">Erreur :</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {loadingProducer ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Préparation du formulaire d'ajout...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image upload */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <label className={labelClass}>Photo principale du produit</label>
            <div className="flex items-center gap-5 mt-2">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 flex-shrink-0 relative group">
                {imagePreview ? (
                  <img src={imagePreview} alt="Aperçu du produit" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-3">
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Aucune photo</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  id="product-image"
                  className="hidden"
                />
                <label
                  htmlFor="product-image"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-gray-600" />
                  {imageFile ? "Changer la photo" : "Téléverser une photo"}
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  Format JPG, PNG ou WebP. Taille maximale : 5 Mo.
                </p>
              </div>
            </div>
          </div>

          {/* Basic information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Informations générales</h2>
            <div>
              <label className={labelClass}>Nom du produit *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="Ex: Huile d'Argan Bio Pur Pressée à Froid 250ml"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Catégorie</label>
              <select
                value={form.category_id}
                onChange={e => update('category_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Sélectionner une catégorie...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.emoji ? `${c.emoji} ` : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Résumé court (aperçu)</label>
              <input
                type="text"
                value={form.short_description}
                onChange={e => update('short_description', e.target.value)}
                placeholder="Ex: Huile 100% pure produite artisanalement dans le Souss-Massa."
                className={inputClass}
                maxLength={140}
              />
            </div>
            <div>
              <label className={labelClass}>Description détaillée</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Décrivez votre produit : méthode d'extraction, qualités gustatives, bienfaits, engagements éthiques..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Price, Stock and MOQ */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Prix, Unité et Stock</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Prix unitaire *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={form.price}
                  onChange={e => update('price', e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Devise</label>
                <select value={form.currency} onChange={e => update('currency', e.target.value)} className={inputClass}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Unité de mesure</label>
                <select
                  value={form.moq_unit}
                  onChange={e => {
                    update('moq_unit', e.target.value);
                    update('stock_unit', e.target.value);
                  }}
                  className={inputClass}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Commande minimale (MOQ) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.moq_value}
                  onChange={e => update('moq_value', e.target.value)}
                  placeholder="1"
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1">Quantité minimale qu'un client doit commander.</p>
              </div>
              <div>
                <label className={labelClass}>Stock disponible</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock_value}
                  onChange={e => update('stock_value', e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1">Quantité globale actuellement en stock.</p>
              </div>
            </div>
          </div>

          {/* Origin */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Origine & Terroir</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Pays d'origine</label>
                <select value={form.country} onChange={e => update('country', e.target.value)} className={inputClass}>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Région / Terroir</label>
                <input
                  type="text"
                  value={form.region}
                  onChange={e => update('region', e.target.value)}
                  placeholder="Ex: Souss-Massa, Provence, Atlas"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <label className={labelClass}>Certifications & Labels</label>
            <p className="text-xs text-gray-500 mb-3">Sélectionnez les certifications applicables à ce produit :</p>
            <div className="flex flex-wrap gap-2.5">
              {CERT_OPTIONS.map(cert => {
                const isSelected = form.certifications.includes(cert);
                return (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => toggleCert(cert)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4 text-brand-600" /> : null}
                    {cert}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Traceability */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-brand-600" /> Traçabilité & Transparent Sourcing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Date de plantation / production</label>
                <input
                  type="date"
                  value={form.planting_date}
                  onChange={e => update('planting_date', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date de récolte</label>
                <input
                  type="date"
                  value={form.harvest_date}
                  onChange={e => update('harvest_date', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date de conditionnement</label>
                <input
                  type="date"
                  value={form.packaging_date}
                  onChange={e => update('packaging_date', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Méthode de culture / production</label>
                <select
                  value={form.farming_method}
                  onChange={e => update('farming_method', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sélectionner une méthode...</option>
                  {FARMING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Numéro de lot (Batch)</label>
                <input
                  type="text"
                  value={form.batch_number}
                  onChange={e => update('batch_number', e.target.value)}
                  placeholder="Ex: LOT-2026-A04"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Coordonnées GPS de la parcelle</label>
                <input
                  type="text"
                  value={form.gps_coordinates}
                  onChange={e => update('gps_coordinates', e.target.value)}
                  placeholder="Ex: 30.421, -9.598"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Empreinte CO2 estimée</label>
                <input
                  type="text"
                  value={form.co2_estimate}
                  onChange={e => update('co2_estimate', e.target.value)}
                  placeholder="Ex: 0.45 kg CO2e / kg"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 py-4 text-base font-bold inline-flex items-center justify-center gap-2 rounded-xl shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Publication du produit en cours...
                </>
              ) : (
                <>Publier le produit dans le catalogue</>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/mes-produits')}
              className="px-6 py-4 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
