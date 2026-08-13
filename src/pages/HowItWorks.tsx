import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus, Search, MessageSquare, ShieldCheck, Truck,
  Store, Package, Bell, Send, Wallet, ChevronDown,
  ArrowRight,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const BUYER_STEPS = [
  { icon: UserPlus,    title: 'Inscription gratuite',       desc: "Créez votre compte acheteur en 2 minutes. Accès immédiat au catalogue complet." },
  { icon: Search,      title: 'Recherche avancée',           desc: "Filtrez par pays, certification, prix, volume. Notre IA vous recommande les meilleurs fournisseurs." },
  { icon: MessageSquare, title: 'Contact direct producteur', desc: "Discutez avec le producteur via notre messagerie sécurisée. Négociez prix, quantités, délais." },
  { icon: ShieldCheck, title: 'Commande sécurisée',          desc: "Passez commande. Paiement protégé par escrow (argent bloqué jusqu'à réception)." },
  { icon: Truck,       title: 'Livraison et suivi',          desc: "Suivi en temps réel via nos partenaires logistiques (DHL, UPS, Maersk)." },
];

const PRODUCER_STEPS = [
  { icon: Store,   title: 'Créer votre boutique',   desc: "Boutique en ligne professionnelle gratuite. Notre IA vous aide à rédiger votre présentation." },
  { icon: Package, title: 'Ajouter vos produits',    desc: "Uploadez photos et infos. L'IA génère automatiquement des descriptions optimisées et traduit en 12 langues." },
  { icon: Bell,    title: 'Recevoir des commandes',  desc: "Notifications en temps réel. Acceptez ou refusez selon votre capacité de production." },
  { icon: Send,    title: 'Expédier vos produits',   desc: "Génération automatique des étiquettes. Nos transporteurs partenaires viennent chercher vos colis chez vous." },
  { icon: Wallet,  title: 'Recevoir vos paiements',  desc: "Argent versé sous 7 jours après livraison confirmée. Virement direct sur votre compte bancaire." },
];

const FAQ_ITEMS = [
  { q: "Combien coûte l'utilisation d'EthiMarket ?", a: "Inscription gratuite. Commission de 5% uniquement sur les ventes réalisées. Pas de frais cachés." },
  { q: 'Comment sont vérifiées les certifications ?', a: "Chaque certificat est contrôlé physiquement par notre équipe et validé par les organismes certificateurs (Ecocert, Fairtrade, Rainforest Alliance)." },
  { q: 'Quels sont les délais de paiement ?', a: "Les producteurs reçoivent leur paiement 7 jours après confirmation de livraison par l'acheteur." },
  { q: 'Puis-je vendre à l\'international ?', a: "Oui ! EthiMarket est présent dans 45 pays et gère la logistique internationale et les douanes." },
  { q: 'Comment sont sélectionnés les producteurs ?', a: "Audit physique de la ferme, vérification des certifications, test de la qualité des produits." },
  { q: 'Existe-t-il une commande minimum ?', a: "Chaque producteur fixe son propre MOQ (Minimum Order Quantity), affiché clairement sur chaque produit." },
  { q: 'Comment fonctionne l\'escrow ?', a: "L'argent de l'acheteur est bloqué chez notre partenaire Stripe jusqu'à confirmation de la livraison, protégeant les deux parties." },
  { q: 'Puis-je essayer avant d\'acheter en gros ?', a: "Oui, la plupart des producteurs proposent des échantillons payants pour tester la qualité." },
  { q: 'Quelles langues sont supportées ?', a: "L'interface est disponible en 12 langues et la messagerie traduit automatiquement." },
  { q: 'Comment contacter le support ?', a: "Chat en direct, email (support@ethimarket.com) ou téléphone (+33 1 23 45 67 89), 7j/7." },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900 text-sm">{item.q}</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead
        title="Comment ça marche ? | EthiMarket B2B"
        description="Découvrez comment EthiMarket connecte directement les acheteurs bio et les producteurs certifiés : inscription, commande sécurisée, paiement escrow et livraison."
      />
      <Header />

      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Comment fonctionne EthiMarket</h1>
          <p className="text-xl text-white/80">3 étapes simples pour transformer votre commerce</p>
        </div>
      </section>

      {/* ACHETEURS */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900 mb-3">🛒 Pour les acheteurs professionnels</h2>
            <p className="text-gray-500 text-lg">De la recherche à la livraison en 5 étapes</p>
          </div>
          <div className="space-y-4">
            {BUYER_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-5 p-6 rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-black text-brand-500">ÉTAPE {i + 1}</span>
                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTEURS */}
      <section className="py-24 bg-brand-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900 mb-3">🌾 Pour les producteurs et coopératives</h2>
            <p className="text-gray-500 text-lg">De la création de boutique à la vente en 5 étapes</p>
          </div>
          <div className="space-y-4">
            {PRODUCER_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-5 p-6 rounded-2xl bg-white border border-brand-100 hover:shadow-md transition-all">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-black text-brand-500">ÉTAPE {i + 1}</span>
                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-3xl font-black text-gray-900">Questions fréquentes</h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-teal-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-8">Prêt à révolutionner votre commerce ?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/inscription" className="px-8 py-3.5 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-lg text-sm inline-flex items-center gap-2">
              Créer un compte gratuit <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/catalogue" className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl border border-white/30 hover:bg-white/20 transition-colors text-sm inline-flex items-center gap-2">
              Voir le catalogue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
