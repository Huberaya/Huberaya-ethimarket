import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, ArrowLeft, Loader2, Sprout, PackagePlus, Sparkles, ShieldCheck } from 'lucide-react';
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
  'Conventionnelle'
];

const PACKAGING_TYPES = [
  'Jute biodégradable',
  'Carton recyclé',
  'Sac papier',
  'Plastique recyclable',
  'Verre',
  'Autre'
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
    country: 'Éthiopie',
    region: '',
    certifications: [] as string[],
    farming_method: 'Agriculture biologique',
    packaging_type: 'Jute biodégradable',
    planting_date: '',
    harvest_date: '',
    packaging_date: '',
    gps_coordinates: '',
    batch_number: '',
    co2_estimate: '',
  });

  // Load categories and auto-retrieve or auto-create user's producer profile
  useEffect(() => {
    let isMounted = true;

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
        const { data: existingProducer, error: fetchErr } = await supabase
          .from('producers')
          .select('id, country')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!fetchErr && existingProducer?.id) {
          if (isMounted) {
            setProducerId(existingProducer.id);
            if (existingProducer.country) {
              setForm(f => ({ ...f, country: existingProducer.country }));
            }
            setLoadingProducer(false);
          }
          return;
        }

        const fullName =
          (user.user_metadata?.full_name) ||
          [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') ||
          user.email?.split('@')[0] ||
          'Producteur';

        const slug = slugify(`${fullName}-${Date.now().toString().slice(-4)}`);
        const initials = fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'EM';

        const newProducerPayload = cleanPayload({
          user_id: user.id,
          name: fullName,
          slug: slug,
          country: 'Éthiopie',
          country_flag: '🇪🇹',
          avatar_initials: initials,
          avatar_color: '#15803d',
          banner_color: '#15803d',
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

    // MANDATORY FIELD VALIDATIONS
    if (!form.name.trim()) {
      setError('Le nom du produit est obligatoire.');
      return;
    }

    if (!form.category_id) {
      setError('La catégorie du produit est obligatoire.');
      return;
    }

    if (!form.price || parseFloat(form.price) <= 0) {
      setError('Le prix unitaire est obligatoire et doit être un nombre supérieur à 0.');
      return;
    }

    if (!form.moq_value || parseInt(form.moq_value) < 1) {
      setError('La quantité minimale de commande (MOQ) est obligatoire.');
      return;
    }

    if (form.stock_value === '' || parseInt(form.stock_value) < 0) {
      setError('Le stock disponible est obligatoire.');
      return;
    }

    if (!form.country) {
      setError('Le pays d\'origine est obligatoire.');
      return;
    }

    if (!form.farming_method) {
      setError('La méthode de culture est obligatoire pour calculer précisément le bilan carbone et l\'impact biodiversité.');
      return;
    }

    if (!form.packaging_type) {
      setError('Le type d\'emballage est obligatoire pour le calcul de l\'empreinte écologique.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
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
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Producteur';
          const slug = slugify(`${fullName}-${Date.now().toString().slice(-4)}`);

          const { data: createdP, error: pErr } = await supabase
            .from('producers')
            .insert(cleanPayload({
              user_id: user.id,
              name: fullName,
              slug: slug,
              country: form.country || 'Éthiopie',
              country_flag: getCountryFlag(form.country || 'Éthiopie'),
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

      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, imageFile);

        if (uploadErr) {
          throw new Error('Erreur lors du téléversement de la photo: ' + uploadErr.message);
        }

        imageUrl = supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl;
      }

      const productSlug = slugify(`${form.name}-${Date.now().toString().slice(-4)}`);
      const countryFlag = getCountryFlag(form.country);

      const rawProductData = {
        user_id: user.id,
        producer_id: currentProducerId,
        name: toStringOrNull(form.name),
        slug: productSlug,
        category_id: toStringOrNull(form.category_id),
        country: toStringOrNull(form.country) ?? 'Éthiopie',
        origin_country: toStringOrNull(form.country) ?? 'Éthiopie',
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
        cultivation_method: toStringOrNull(form.farming_method),
        packaging_type: toStringOrNull(form.packaging_type),
        gps_coordinates: toStringOrNull(form.gps_coordinates),
        co2_estimate: toStringOrNull(form.co2_estimate),
        batch_number: toStringOrNull(form.batch_number),
      };

      const payloadToInsert: Record<string, unknown> = cleanPayload(rawProductData);
      let insertResult = await supabase.from('products').insert(payloadToInsert);

      let maxAttempts = 20;
      while (insertResult.error && maxAttempts > 0) {
        const errMsg = insertResult.error.message || '';
        const match =
          errMsg.match(/Could not find the '([^']+)' column/i) ||
          errMsg.match(/column ["']?([^"'\s]+)["']? of relation/i) ||
          errMsg.match(/column ["']([^"']+)["']/i);

        if (match && match[1] && match[1] in payloadToInsert) {
          const missingColumn = match[1];
          delete payloadToInsert[missingColumn];
          insertResult = await supabase.from('products').insert(payloadToInsert);
          maxAttempts--;
        } else {
          break;
        }
      }

      if (insertResult.error) {
        throw new Error('Erreur lors de la sauvegarde du produit: ' + insertResult.error.message);
      }

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
            <p className="text-gray-500 text-sm mt-0.5">Renseignez les données d'exploitation réelles pour générer vos impacts scientifiques</p>
          </div>
        </div>
      </div>

      <div className="bg-brand-50/70 rounded-2xl p-4 border border-brand-100 mb-6 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-brand-900 leading-relaxed">
          <p className="font-bold mb-1">💡 Transparence Scientifique EthiMarket :</p>
          Vous n'avez pas besoin de calculer vous-même votre bilan carbone ou empreinte eau. Notre moteur expert transforme automatiquement vos données terrain réelles (méthode de culture, emballage, origine) en impacts certifiés via les facteurs ADEME & Water Footprint Network.
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
          {/* Photo */}
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
                  Format JPG, PNG ou WebP. Max 5 Mo.
                </p>
              </div>
            </div>
          </div>

          {/* General info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Informations générales</h2>
            
            <div>
              <label className={labelClass}>
                Nom du produit <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="Ex: Café Arabica Yirgacheffe Grand Cru Bio 1kg"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Catégorie du produit <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  required
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
                <label className={labelClass}>
                  Méthode de culture <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  required
                  value={form.farming_method}
                  onChange={e => update('farming_method', e.target.value)}
                  className={inputClass}
                >
                  {FARMING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Nécessaire pour les facteurs d'émission CO2 & biodiversité ADEME
                </p>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Type d'emballage <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                required
                value={form.packaging_type}
                onChange={e => update('packaging_type', e.target.value)}
                className={inputClass}
              >
                {PACKAGING_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Détermine l'empreinte emballage (ADEME 2024)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Résumé court (aperçu)</label>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Améliore votre score +2 pts
                </span>
              </div>
              <input
                type="text"
                value={form.short_description}
                onChange={e => update('short_description', e.target.value)}
                placeholder="Ex: Café pure origine cultivé sous ombrage naturel à 2000m d'altitude."
                className={inputClass}
                maxLength={140}
              />
              {!form.short_description && (
                <p className="text-[11px] text-gray-500 mt-1">
                  💡 Renseigner ce champ améliore votre Score EthiMarket de +2 points et augmente la confiance des acheteurs.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Description détaillée & Terroir</label>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Améliore votre score +4 pts
                </span>
              </div>
              <textarea
                rows={4}
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Décrivez votre terroir, les techniques de récolte manuelle, la coopérative et les histoires de familles..."
                className={`${inputClass} resize-none`}
              />
              {!form.description && (
                <p className="text-[11px] text-gray-500 mt-1">
                  💡 Renseigner une description détaillée améliore votre Score EthiMarket de +4 points.
                </p>
              )}
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Prix, Unité et Stock</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>
                  Prix unitaire <span className="text-red-500 font-bold">*</span>
                </label>
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
                <label className={labelClass}>
                  Unité de mesure <span className="text-red-500 font-bold">*</span>
                </label>
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
                <label className={labelClass}>
                  Commande minimale (MOQ) <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.moq_value}
                  onChange={e => update('moq_value', e.target.value)}
                  placeholder="1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Stock disponible <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.stock_value}
                  onChange={e => update('stock_value', e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Origin */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Origine & Traçabilité Régionale</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Pays d'origine <span className="text-red-500 font-bold">*</span>
                </label>
                <select value={form.country} onChange={e => update('country', e.target.value)} className={inputClass}>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Région / Vallée / Terroir</label>
                <input
                  type="text"
                  value={form.region}
                  onChange={e => update('region', e.target.value)}
                  placeholder="Ex: Yirgacheffe, Kaffa, Sidama"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Certifications & Labels</label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Garantit les exonérations douanières UE 0%
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">Sélectionnez les certifications valides de votre exploitation :</p>
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
              <Sprout className="w-5 h-5 text-brand-600" /> Traçabilité de Récolte & Terroir
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">Date de plantation</label>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">+2 pts</span>
                </div>
                <input
                  type="date"
                  value={form.planting_date}
                  onChange={e => update('planting_date', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">Date de récolte</label>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">+3 pts</span>
                </div>
                <input
                  type="date"
                  value={form.harvest_date}
                  onChange={e => update('harvest_date', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">Date d'emballage</label>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">+2 pts</span>
                </div>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">Coordonnées GPS de la parcelle</label>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">+5 pts</span>
                </div>
                <input
                  type="text"
                  value={form.gps_coordinates}
                  onChange={e => update('gps_coordinates', e.target.value)}
                  placeholder="Ex: 6.134, 38.204"
                  className={inputClass}
                />
                {!form.gps_coordinates && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    💡 Renseigner vos coordonnées GPS améliore votre Score EthiMarket de +5 points et débloque la carte satellite.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">Numéro de lot (Batch)</label>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">+3 pts</span>
                </div>
                <input
                  type="text"
                  value={form.batch_number}
                  onChange={e => update('batch_number', e.target.value)}
                  placeholder="Ex: LOT-2026-YIRG-01"
                  className={inputClass}
                />
                {!form.batch_number && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    💡 Renseigner le numéro de lot améliore votre Score EthiMarket de +3 points.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 py-4 text-base font-bold inline-flex items-center justify-center gap-2 rounded-xl shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
              className="px-6 py-4 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
