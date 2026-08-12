import { useState, useEffect } from 'react';
import { Upload, Save, Loader2, CheckCircle, Store } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { saveProducerFields } from '../../lib/dbHelpers';

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

export default function MyShop() {
  const { user, producer, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(producer?.logo_url ?? null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(producer?.banner_url ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', story: '',
    country: 'France', region: '',
    founded_year: '', employee_count: '',
    website: '',
  });

  useEffect(() => {
    if (producer) {
      setForm({
        name: producer.name ?? '',
        description: producer.description ?? '',
        story: producer.story ?? '',
        country: producer.country ?? 'France',
        region: producer.region ?? '',
        founded_year: producer.founded_year?.toString() ?? '',
        employee_count: producer.employee_count?.toString() ?? '',
        website: producer.website ?? '',
      });
      setLogoPreview(producer.logo_url);
      setBannerPreview(producer.banner_url);
    }
  }, [producer]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !producer) return;
    setSaving(true);
    setSaved(false);

    let logoUrl = producer.logo_url;
    let bannerUrl = producer.banner_url;

    // Upload logo
    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const fileName = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('stores').upload(fileName, logoFile);
      if (!error) logoUrl = supabase.storage.from('stores').getPublicUrl(fileName).data.publicUrl;
    }

    // Upload banner
    if (bannerFile) {
      const ext = bannerFile.name.split('.').pop();
      const fileName = `${user.id}/banner-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('stores').upload(fileName, bannerFile);
      if (!error) bannerUrl = supabase.storage.from('stores').getPublicUrl(fileName).data.publicUrl;
    }

    await saveProducerFields(supabase, producer.id, {
      name: form.name,
      description: form.description || null,
      story: form.story || null,
      country: form.country,
      country_flag: COUNTRY_FLAGS[form.country] ?? '🌍',
      region: form.region || null,
      founded_year: form.founded_year,
      employee_count: form.employee_count,
      website: form.website || null,
      logo_url: logoUrl,
      banner_url: bannerUrl,
    });

    await refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

  if (!producer) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Store className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h3 className="font-bold text-gray-900 mb-2">Boutique non configurée</h3>
        <p className="text-gray-500 text-sm">Votre profil producteur n'a pas encore été créé.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Ma boutique</h1>
        <p className="text-gray-500 text-sm mt-1">Personnalisez la page publique de votre boutique</p>
      </div>

      {saved && (
        <div className="bg-brand-50 border border-brand-200 text-brand-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Modifications enregistrées avec succès !
        </div>
      )}

      <form onSubmit={handleSave} className="max-w-3xl space-y-5">
        {/* Logo + Banner */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          {/* Banner */}
          <div>
            <label className={labelClass}>Bannière</label>
            <div className="relative h-32 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Bannière" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-7 h-7 text-gray-300" />
              )}
              <input type="file" accept="image/*" onChange={handleBannerChange} id="banner-upload" className="hidden" />
              <label htmlFor="banner-upload" className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-1.5">
                <Upload className="w-3 h-3" /> {bannerPreview ? 'Changer' : 'Uploader'}
              </label>
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className={labelClass}>Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleLogoChange} id="logo-upload" className="hidden" />
              <label htmlFor="logo-upload" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer transition-colors">
                <Upload className="w-4 h-4" /> {logoPreview ? 'Changer le logo' : 'Uploader un logo'}
              </label>
            </div>
          </div>
        </div>

        {/* Shop info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className={labelClass}>Nom de la boutique *</label>
            <input type="text" required value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea rows={3} value={form.description} onChange={e => update('description', e.target.value)}
              placeholder="Une description courte de votre boutique" className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className={labelClass}>Story (histoire)</label>
            <textarea rows={4} value={form.story} onChange={e => update('story', e.target.value)}
              placeholder="Racontez l'histoire de votre coopérative, votre engagement, vos valeurs..." className={`${inputClass} resize-none`} />
          </div>
        </div>

        {/* Location + details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Localisation et détails</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Pays</label>
              <select value={form.country} onChange={e => update('country', e.target.value)} className={inputClass}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Région</label>
              <input type="text" value={form.region} onChange={e => update('region', e.target.value)}
                placeholder="Ex: Souss-Massa" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Année de fondation</label>
              <input type="number" value={form.founded_year} onChange={e => update('founded_year', e.target.value)}
                placeholder="2010" min="1900" max="2026" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nombre d'employés</label>
              <input type="number" value={form.employee_count} onChange={e => update('employee_count', e.target.value)}
                placeholder="10" min="0" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Site web</label>
            <input type="url" value={form.website} onChange={e => update('website', e.target.value)}
              placeholder="https://www.maboutique.com" className={inputClass} />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="btn-primary px-8 py-3.5 text-sm inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : <><Save className="w-4 h-4" /> Enregistrer les modifications</>}
        </button>
      </form>
    </div>
  );
}
