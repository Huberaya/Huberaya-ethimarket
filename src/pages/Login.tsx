import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, ArrowRight, Globe, Users, Package } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { supabase } from '../lib/supabase';

const HERO_TESTIMONIALS = [
  { quote: "EthiMarket a transformé notre approvisionnement.", name: "M. Dubois", role: "Directeur achats, Naturalia" },
  { quote: "Qualité exceptionnelle, producteurs transparents.", name: "S. Martin",  role: "Chef cuisinière, étoilée" },
];

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError('Email ou mot de passe incorrect. Vérifiez vos identifiants.');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      <SEOHead
        title="Connexion | EthiMarket"
        description="Connectez-vous à votre espace EthiMarket pour gérer vos commandes B2B, vos produits bio certifiés et vos messages direct avec les producteurs."
      />
      {/* ── Left panel (green) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=60"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/95 via-brand-800/90 to-brand-700/80" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-auto">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">EthiMarket</span>
          </Link>

          {/* Center content */}
          <div className="mb-auto mt-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/70 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 mb-6">
              Commerce équitable · Certifié · Mondial
            </div>
            <h2 className="text-4xl font-black text-white leading-tight mb-5">
              Des produits bio exceptionnels, des producteurs qui les méritent
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-sm">
              Rejoignez 50 000+ acheteurs professionnels qui sourcent directement auprès de 12 000 producteurs certifiés.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-5 mb-10">
              {[
                { icon: Globe,   value: '45',      label: 'pays' },
                { icon: Users,   value: '12 000+', label: 'producteurs' },
                { icon: Package, value: '50 000+', label: 'produits' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl py-4">
                  <Icon className="w-5 h-5 text-brand-300 mx-auto mb-2" />
                  <div className="text-2xl font-black text-white">{value}</div>
                  <div className="text-xs text-white/50 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <p className="text-white/80 italic text-sm leading-relaxed mb-3">"{HERO_TESTIMONIALS[0].quote}"</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-brand-400/30 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {HERO_TESTIMONIALS[0].name.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{HERO_TESTIMONIALS[0].name}</p>
                  <p className="text-white/40 text-[10px]">{HERO_TESTIMONIALS[0].role}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-white/30 text-xs">© 2024 EthiMarket SAS</p>
        </div>
      </div>

      {/* ── Right panel (white) ── */}
      <div className="flex-1 flex items-center justify-center bg-white p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-brand-800 font-bold text-xl">EthiMarket</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900">Bon retour 👋</h1>
            <p className="text-gray-500 mt-1.5">Connectez-vous à votre espace professionnel</p>
          </div>

          {/* Google */}
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
            <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-gray-400 font-medium">ou avec votre email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-brand-500 outline-none transition-colors bg-gray-50 focus:bg-white" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Mot de passe</label>
                <a href="#" className="text-xs text-brand-600 hover:text-brand-700 font-semibold hover:underline">Mot de passe oublié ?</a>
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 text-sm border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-brand-500 outline-none transition-colors bg-gray-50 focus:bg-white" />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-brand-500" />
              <span className="text-sm text-gray-600">Se souvenir de moi pendant 30 jours</span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Connexion...
                </>
              ) : (
                <>Se connecter <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-7">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-brand-600 font-bold hover:text-brand-700 hover:underline">
              Créer un compte gratuit
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
