import { useState, useEffect } from 'react';
import { ShoppingCart, MessageSquare, Settings, Loader2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { COUNTRIES, getCountryFlag } from '../../lib/countries';
import { toIntOrNull, toFloatOrNull, toStringOrNull, sanitizeProducerPayload, saveProducerFields } from '../../lib/dbHelpers';

export function Orders() {
  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-1">Commandes</h1>
      <p className="text-gray-500 text-sm mb-6">Gérez vos commandes reçues</p>
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h3 className="font-bold text-gray-900 mb-2">Aucune commande pour l'instant</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">Vos commandes apparaîtront ici dès qu'un acheteur passera commande sur vos produits.</p>
      </div>
    </div>
  );
}

export function Messages() {
  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-1">Messages</h1>
      <p className="text-gray-500 text-sm mb-6">Vos conversations avec les acheteurs</p>
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h3 className="font-bold text-gray-900 mb-2">Aucun message</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">Les messages des acheteurs intéressés par vos produits s'afficheront ici.</p>
      </div>
    </div>
  );
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export function SettingsPage() {
  const { user, profile, producer, refresh } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [country, setCountry] = useState('France');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fullName = profile?.full_name ?? user?.user_metadata?.full_name ?? '';
    const [f, ...rest] = fullName.split(' ');
    setFirstName(profile?.first_name ?? user?.user_metadata?.first_name ?? f ?? '');
    setLastName(profile?.last_name ?? user?.user_metadata?.last_name ?? rest.join(' ') ?? '');
    setPhone(profile?.phone ?? user?.user_metadata?.phone ?? producer?.phone ?? '');
    setWhatsapp(profile?.whatsapp ?? user?.user_metadata?.whatsapp ?? producer?.whatsapp ?? '');
    setCountry(profile?.country ?? user?.user_metadata?.country ?? producer?.country ?? 'France');
    setCity(profile?.city ?? user?.user_metadata?.city ?? producer?.city ?? '');
  }, [profile, producer, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const flag = getCountryFlag(country);

      // 1. Update Auth user metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          phone: toStringOrNull(phone) || undefined,
          whatsapp: toStringOrNull(whatsapp) || undefined,
          country,
          city: toStringOrNull(city) || undefined,
        },
      });
      if (authErr) console.warn('Auth metadata update warning:', authErr.message);

      // 2. Upsert in profiles table
      const userRole = profile?.role || user.user_metadata?.role || 'producer';
      const { error: profErr } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone: toStringOrNull(phone),
        whatsapp: toStringOrNull(whatsapp),
        country,
        city: toStringOrNull(city),
        role: userRole,
      }, { onConflict: 'id' });

      if (profErr) {
        console.error('Profile upsert error:', profErr);
        throw new Error('Erreur profil: ' + profErr.message);
      }

      // 3. Upsert in producers table
      if (userRole === 'producer' || producer) {
        // Retrieve existing producer record
        const { data: existingProd } = await supabase
          .from('producers')
          .select('id, slug')
          .eq('user_id', user.id)
          .maybeSingle();

        const prodSlug = existingProd?.slug || slugify(`${fullName}-${user.id.slice(0, 8)}`);
        const colors = ['#15803d', '#92400e', '#b45309', '#7c2d12', '#451a03', '#0369a1'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const initials = ((firstName[0] || '') + (lastName[0] || '') || fullName.slice(0, 2)).toUpperCase();

        const producerPayload: Record<string, string | boolean | number | null | string[]> = {
          user_id: user.id,
          name: fullName,
          first_name: toStringOrNull(firstName),
          last_name: toStringOrNull(lastName),
          phone: toStringOrNull(phone),
          whatsapp: toStringOrNull(whatsapp),
          country,
          country_flag: flag,
          city: toStringOrNull(city),
        };

        if (existingProd?.id) {
          const { error: prodUpdateErr } = await saveProducerFields(supabase, existingProd.id, producerPayload);

          if (prodUpdateErr) {
            console.error('Producer update error:', prodUpdateErr);
            throw new Error('Erreur producteur: ' + prodUpdateErr.message);
          }
        } else {
          producerPayload.slug = prodSlug;
          producerPayload.avatar_initials = initials;
          producerPayload.avatar_color = color;
          producerPayload.banner_color = color;
          producerPayload.verified = false;
          producerPayload.top_seller = false;
          producerPayload.rating = toFloatOrNull(0);
          producerPayload.review_count = toIntOrNull(0);
          producerPayload.product_count = toIntOrNull(0);
          producerPayload.order_count = toIntOrNull(0);
          producerPayload.satisfaction_rate = toIntOrNull(100);
          producerPayload.response_time = '24h';
          producerPayload.certifications = [];
          producerPayload.profile_completion = toIntOrNull(10);

          const { error: prodUpsertErr } = await supabase
            .from('producers')
            .upsert(sanitizeProducerPayload(producerPayload), { onConflict: 'user_id' });

          if (prodUpsertErr) {
            console.error('Producer upsert error:', prodUpsertErr);
            throw new Error('Erreur producteur: ' + prodUpsertErr.message);
          }
        }
      }

      // 4. Refresh global Auth context so components reload new state
      await refresh();

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('handleSave exception:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-1">Paramètres</h1>
      <p className="text-gray-500 text-sm mb-6">Gérez vos informations de compte</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="bg-brand-50 border border-brand-200 text-brand-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> Modifications enregistrées avec succès.
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 max-w-2xl space-y-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" /> Informations du compte
        </h3>

        <div>
          <label className={labelClass}>Email</label>
          <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100">{user?.email}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Prénom <span className="text-red-500">*</span></label>
            <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} placeholder="Jean" />
          </div>
          <div>
            <label className={labelClass}>Nom <span className="text-red-500">*</span></label>
            <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} placeholder="Dupont" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Téléphone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+33 6 ..." />
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={inputClass} placeholder="+33 6 ..." />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Pays</label>
            <select value={country} onChange={e => setCountry(e.target.value)} className={inputClass}>
              {COUNTRIES.map(c => <option key={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Ville</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} className={inputClass} placeholder="Votre ville" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Rôle</label>
          <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100 capitalize">{profile?.role ?? 'N/A'}</div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
}
