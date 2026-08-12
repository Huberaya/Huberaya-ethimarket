import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { COUNTRIES } from '../lib/countries';
import { sanitizeProducerPayload } from '../lib/dbHelpers';

type Role = 'producer' | 'buyer' | 'distributor';

const ROLES = [
  {
    id: 'producer' as Role,
    emoji: '🌾',
    title: 'Producteur / Coopérative',
    desc: 'Je veux vendre mes produits bio et équitables',
    color: 'border-brand-400 bg-brand-50',
    dot: 'bg-brand-500',
  },
  {
    id: 'buyer' as Role,
    emoji: '🏪',
    title: 'Acheteur professionnel',
    desc: 'Magasin bio, restaurant gastronomique, grossiste...',
    color: 'border-blue-400 bg-blue-50',
    dot: 'bg-blue-500',
  },
  {
    id: 'distributor' as Role,
    emoji: '🏭',
    title: 'Importateur / Distributeur',
    desc: 'Je distribue des produits responsables à grande échelle',
    color: 'border-violet-400 bg-violet-50',
    dot: 'bg-violet-500',
  },
];

const COUNTRIES_LIST = COUNTRIES.map(c => c.name);

function pwStrength(pw: string): { label: string; color: string; pct: string } {
  if (!pw)         return { label: '',        color: 'bg-gray-200', pct: '0%' };
  if (pw.length < 6) return { label: 'Faible', color: 'bg-red-400',   pct: '25%' };
  if (pw.length < 10) return { label: 'Moyen',  color: 'bg-amber-400', pct: '55%' };
  if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Bon', color: 'bg-blue-400', pct: '75%' };
  return { label: 'Fort', color: 'bg-brand-500', pct: '100%' };
}

export default function Register() {
  const [step,      setStep]      = useState<1 | 2>(1);
  const [role,      setRole]      = useState<Role | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [phone,     setPhone]     = useState('');
  const [country,   setCountry]   = useState('France');
  const [showPw,    setShowPw]    = useState(false);
  const [agreed,    setAgreed]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const navigate = useNavigate();

  const strength = pwStrength(password);

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (!agreed) { setError('Veuillez accepter les CGU pour continuer.'); return; }
    setError(''); setLoading(true);

    const fullName = `${firstName} ${lastName}`;
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { first_name: firstName, last_name: lastName, role, country, phone } },
    });

    if (err) {
      setLoading(false);
      setError(err.message.includes('already') ? 'Un compte existe déjà avec cet email.' : err.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      setError('Erreur: impossible de récupérer l\'ID utilisateur.');
      return;
    }

    // Create profile
    await supabase.from('profiles').insert({
      id: userId,
      email,
      full_name: fullName,
      phone: phone || null,
      role,
    });

    // If producer role, create producer entry
    if (role === 'producer') {
      const shopName = `${firstName} ${lastName}`;
      const initials = (firstName[0] ?? '') + (lastName[0] ?? '');
      const colors = ['#15803d', '#92400e', '#b45309', '#7c2d12', '#451a03', '#0369a1'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const flags: Record<string, string> = Object.fromEntries(COUNTRIES.map(c => [c.name, c.flag]));

      await supabase.from('producers').insert(sanitizeProducerPayload({
        user_id: userId,
        name: shopName,
        slug: slugify(`${shopName}-${Date.now().toString().slice(-4)}`),
        country,
        country_flag: flags[country] ?? '🌍',
        avatar_initials: initials.toUpperCase(),
        avatar_color: color,
        banner_color: color,
        description: null,
        verified: false,
        top_seller: false,
        rating: 0,
        review_count: 0,
        product_count: 0,
        order_count: 0,
        satisfaction_rate: 100,
        response_time: '24h',
        certifications: [],
      }));
    }

    setLoading(false);
    navigate(role === 'producer' ? '/dashboard/verification' : '/dashboard');
  };

  const fieldClass = "w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-brand-500 outline-none transition-colors bg-gray-50 focus:bg-white";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Side image */}
      <div className="hidden xl:block xl:w-[38%] relative">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=60"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 to-brand-800/60" />
        <div className="relative z-10 flex flex-col h-full p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">EthiMarket</span>
          </Link>
          <div className="mt-auto mb-12">
            <h3 className="text-3xl font-black text-white mb-4">Rejoignez la communauté</h3>
            <p className="text-white/60 leading-relaxed">
              Plus de 12 000 producteurs certifiés vous attendent sur la marketplace du commerce équitable.
            </p>
            <div className="flex items-center gap-2 mt-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-brand-400/40 border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              <span className="text-white/60 text-sm ml-2">+12 000 membres</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-start justify-center overflow-y-auto py-8 px-4 sm:px-8">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8 xl:hidden">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-brand-800 font-bold text-xl">EthiMarket</span>
          </Link>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-black text-gray-900">Créer mon compte</h1>
              <p className="text-gray-500 text-sm mt-1">Accès gratuit à 50 000+ produits bio certifiés</p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 1 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className={`text-sm font-semibold ${step >= 1 ? 'text-brand-600' : 'text-gray-400'}`}>Votre rôle</span>
              </div>
              <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${step > 1 ? 'bg-brand-500' : 'bg-gray-200'}`} />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 2 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  2
                </div>
                <span className={`text-sm font-semibold ${step >= 2 ? 'text-brand-600' : 'text-gray-400'}`}>Vos informations</span>
              </div>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div>
                <button className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all mb-5">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-gray-400 font-medium">ou</span></div>
                </div>

                <p className="text-sm font-bold text-gray-700 mb-3">Vous êtes... <span className="text-gray-400 font-normal">(choisissez votre rôle)</span></p>
                <div className="space-y-3">
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                        role === r.id ? r.color : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-3xl">{r.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">{r.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        role === r.id ? `${r.dot} border-transparent` : 'border-gray-300'
                      }`}>
                        {role === r.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  disabled={!role}
                  onClick={() => setStep(2)}
                  className="btn-primary w-full py-3.5 mt-6 text-base disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuer <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Prénom *</label>
                    <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" className={fieldClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Nom *</label>
                    <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" className={fieldClass} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Email professionnel *</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@entreprise.com" className={fieldClass} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Mot de passe *</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 caractères" className={`${fieldClass} pr-12`} />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.pct }} />
                      </div>
                      <p className={`text-xs mt-1 font-semibold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Confirmer le mot de passe *</label>
                  <input type="password" required value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Répétez votre mot de passe" className={`${fieldClass} ${confirmPw && confirmPw !== password ? 'border-red-400' : ''}`} />
                  {confirmPw && confirmPw !== password && <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Téléphone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 ..." className={fieldClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Pays *</label>
                    <select value={country} onChange={e => setCountry(e.target.value)}
                      className={`${fieldClass} appearance-none cursor-pointer`}>
                      {COUNTRIES_LIST.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group py-1">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded accent-brand-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    J'accepte les{' '}
                    <a href="#" className="text-brand-600 font-semibold hover:underline">Conditions d'utilisation</a>
                    {' '}et la{' '}
                    <a href="#" className="text-brand-600 font-semibold hover:underline">Politique de confidentialité</a>
                    {' '}d'EthiMarket.
                  </span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm">
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button type="submit" disabled={loading}
                    className="btn-primary flex-1 py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? 'Création...' : <><span>Créer mon compte</span> <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            )}

            <p className="text-center text-sm text-gray-400 mt-6">
              Déjà membre ?{' '}
              <Link to="/connexion" className="text-brand-600 font-bold hover:underline">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
