import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown, ArrowRight, CheckCircle, Store, Package,
  Bell, Send, Wallet, DollarSign, Globe, Bot, Camera,
  BarChart3, ShieldCheck, Star,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const STATS = [
  { emoji: '💰', value: '+40%', label: 'de marges en moyenne' },
  { emoji: '🌍', value: '45',    label: 'pays d\'acheteurs' },
  { emoji: '📈', value: '8 250€',label: 'CA mensuel moyen' },
  { emoji: '⭐', value: '4.9/5', label: 'satisfaction producteurs' },
];

const BENEFITS = [
  { emoji: '💰', icon: DollarSign,  title: 'Marges décuplées',        desc: "Vendez directement, sans les 3-5 intermédiaires habituels. Gardez la valeur de votre travail." },
  { emoji: '🌍', icon: Globe,      title: 'Marchés internationaux',   desc: "Accédez aux acheteurs de 45 pays. Notre équipe gère la logistique et les douanes." },
  { emoji: '🤖', icon: Bot,        title: 'Outils IA gratuits',       desc: "L'IA rédige vos descriptions, améliore vos photos, traduit en 12 langues automatiquement." },
  { emoji: '📸', icon: Camera,     title: 'Photos professionnelles',  desc: "Améliorez vos photos avec notre outil IA gratuit. Fond neutre, lumière parfaite en 1 clic." },
  { emoji: '📊', icon: BarChart3,  title: 'Statistiques détaillées',  desc: "Suivez vos ventes, vos vues, votre trafic. Optimisez votre boutique avec les données." },
  { emoji: '💳', icon: ShieldCheck, title: 'Paiements sécurisés',     desc: "Escrow sur toutes les transactions. Argent versé sous 7 jours après livraison confirmée." },
];

const STEPS = [
  { icon: Store,   title: 'Créer votre boutique',  desc: '2 minutes, gratuit' },
  { icon: Package, title: 'Ajouter vos produits',  desc: 'Avec l\'IA' },
  { icon: Bell,    title: 'Recevoir des commandes', desc: 'Notifications temps réel' },
  { icon: Send,    title: 'Expédier facilement',   desc: 'Étiquettes auto' },
  { icon: Wallet,  title: 'Recevoir vos paiements', desc: 'Sous 7 jours' },
];

const TESTIMONIALS = [
  { name: 'Fatima Benali',    role: 'Coopérative Argan Atlas',    text: "En 6 mois sur EthiMarket, mes ventes ont triplé. Je peux enfin payer mes 80 employées un salaire décent.", initials: 'FB', color: '#22c55e' },
  { name: 'Karim Hosseini',   role: 'Saffron Fields Iran',        text: "Fini les intermédiaires qui prenaient 60% de ma marge. Je vends directement à des chefs étoilés en France.",   initials: 'KH', color: '#f59e0b' },
  { name: 'Ana Rodriguez',    role: 'Café Colombia Coop',         text: "L'outil IA est incroyable. Il a traduit mes 25 produits en anglais, espagnol, allemand en 5 minutes.",        initials: 'AR', color: '#3b82f6' },
];

const VENDOR_FAQ = [
  { q: 'Combien de temps pour créer ma boutique ?', a: 'Moins de 2 minutes. Notre IA vous aide à rédiger votre présentation et génère votre boutique automatiquement.' },
  { q: 'Quand vais-je recevoir mon premier paiement ?', a: 'Sous 7 jours après confirmation de livraison par l\'acheteur. Le virement est direct sur votre compte bancaire.' },
  { q: 'Comment envoyer mes produits ?', a: 'Génération automatique des étiquettes d\'expédition. Nos transporteurs partenaires (DHL, UPS) viennent chercher vos colis.' },
  { q: 'Que faire en cas de litige ?', a: 'Contactez le support. EthiMarket retient les fonds en escrow et arbitre le litige dans les 14 jours.' },
  { q: 'Puis-je fixer mes propres prix ?', a: 'Oui, vous êtes libre de fixer vos prix et votre MOQ (commande minimum) pour chaque produit.' },
];

const PRICING_POINTS = [
  'Inscription : 100% gratuite',
  'Création boutique : gratuite',
  'Ajout de produits : illimité',
  'Commission : 5% uniquement sur les ventes',
  'Pas de frais cachés',
  'Pas d\'engagement',
];

function VendorFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {VENDOR_FAQ.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
            <span className="font-semibold text-gray-900 text-sm">{item.q}</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

export default function DevenirVendeur() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80"
          alt="Producteur" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/90 to-brand-900/60" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Vendez vos produits bio dans le monde entier</h1>
          <p className="text-xl text-white/80 mb-8">Rejoignez 12 000+ producteurs qui ont doublé leurs revenus avec EthiMarket</p>
          <Link to="/inscription" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-lg text-sm">
            Créer ma boutique gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {STATS.map(({ emoji, value, label }) => (
              <div key={label} className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-3xl mb-2">{emoji}</div>
                <div className="text-2xl font-black text-brand-600 mb-1">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BÉNÉFICES */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Avantages</p>
            <h2 className="text-3xl font-black text-gray-900">Pourquoi rejoindre EthiMarket ?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map(({ emoji, icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-brand-50 rounded-2xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <span className="text-2xl">{emoji}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Démarrage</p>
            <h2 className="text-3xl font-black text-gray-900">Comment ça marche</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {STEPS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
                    <step.icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-brand-500 text-white text-xs font-black rounded-full flex items-center justify-center">{i + 1}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-50 border-2 border-brand-200 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-8">Une tarification simple et juste</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-8 max-w-md mx-auto text-left">
              {PRICING_POINTS.map(point => (
                <div key={point} className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">{point}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-sm text-gray-500 mb-2">Exemple concret :</p>
              <p className="text-lg font-bold text-gray-900">Vous vendez 1 000€ → Vous recevez 950€</p>
              <p className="text-xs text-gray-400 mt-1">Nous prélevons 50€ (5%) pour maintenir la plateforme</p>
            </div>
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Témoignages</p>
            <h2 className="text-3xl font-black text-gray-900">Ils ont transformé leur commerce</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ VENDEURS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-3xl font-black text-gray-900">Questions fréquentes vendeurs</h2>
          </div>
          <VendorFaq />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-teal-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Prêt à révolutionner votre commerce ?</h2>
          <p className="text-white/70 mb-8">Créez votre boutique en 2 minutes, gratuitement</p>
          <Link to="/inscription" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-lg text-sm">
            Créer ma boutique maintenant <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
