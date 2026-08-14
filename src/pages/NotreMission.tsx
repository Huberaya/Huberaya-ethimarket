import { Link } from 'react-router-dom';
import {
  Sprout, Scale, Handshake, Globe, Lightbulb,
  ArrowRight, Target,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TIMELINE = [
  { period: '2023',        title: 'L\'idée',          desc: "Face au constat des inégalités dans le commerce bio, un expert en environnement décide d'agir." },
  { period: 'Début 2024',  title: 'La conception',     desc: "6 mois de recherche, rencontres avec 200 producteurs et 100 acheteurs pour comprendre les besoins." },
  { period: 'Mi-2024',     title: 'Le lancement',       desc: "Ouverture d'EthiMarket avec les 50 premiers producteurs pilotes." },
  { period: 'Fin 2024',    title: 'La croissance',      desc: "12 000+ producteurs dans 45 pays. Les premières révolutions dans les coopératives." },
  { period: '2025',        title: 'L\'expansion',       desc: "Nouveaux marchés (Asie, Amérique du Nord), outils IA avancés, programme reforestation." },
];

const VALUES = [
  { emoji: '🌱', icon: Sprout,    title: 'Respect de la nature',       desc: "L'agriculture bio n'est pas une mode, c'est la seule voie viable pour l'avenir de notre planète." },
  { emoji: '⚖️', icon: Scale,     title: 'Justice économique',         desc: "Chaque producteur mérite un revenu digne pour son travail. Zéro intermédiaire qui s'enrichit sur son dos." },
  { emoji: '🤝', icon: Handshake, title: 'Transparence totale',        desc: "De la ferme à l'assiette, chaque étape est traçable. Nous n'avons rien à cacher." },
  { emoji: '🌍', icon: Globe,    title: 'Impact positif',             desc: "Chaque commande passée soutient une famille, préserve un sol, réduit une empreinte carbone." },
  { emoji: '💡', icon: Lightbulb, title: 'Innovation responsable',    desc: "L'IA et la technologie au service de l'humain et de la planète, jamais l'inverse." },
];

const COMMITMENTS = [
  { value: '15 000',    label: 'arbres préservés' },
  { value: '850 t',     label: 'CO2 évitées' },
  { value: '12 000+',   label: 'familles soutenues' },
  { value: '2,3 M',     label: 'litres d\'eau économisés' },
  { value: '45',        label: 'pays impactés' },
  { value: '100%',      label: 'certifications vérifiées' },
];

const PARTNERS = ['Ecocert', 'Fairtrade International', 'Rainforest Alliance', 'GlobalG.A.P.', 'Agence Bio', 'FNAB'];

export default function NotreMission() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* HERO MANIFESTE */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-brand-200 font-semibold text-xs uppercase tracking-widest mb-4">Notre raison d'être</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-8">Notre mission</h1>
          <p className="text-xl sm:text-2xl text-white/90 leading-relaxed font-medium max-w-3xl mx-auto">
            Redonner sa juste valeur au travail des producteurs bio, transformer le commerce mondial en outil de justice sociale et environnementale, et construire ensemble le monde de demain.
          </p>
        </div>
      </section>

      {/* NOTRE HISTOIRE */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Parcours</p>
            <h2 className="text-3xl font-black text-gray-900">Notre histoire</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-brand-100 -translate-x-1/2" />
            <div className="space-y-10">
              {TIMELINE.map((item, i) => (
                <div key={i} className={`relative flex items-start gap-6 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                  <div className="absolute left-4 sm:left-1/2 w-4 h-4 bg-brand-500 rounded-full -translate-x-1/2 mt-1.5 ring-4 ring-brand-100 z-10" />
                  <div className={`pl-12 sm:pl-0 sm:w-1/2 ${i % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12'}`}>
                    <p className="text-xs font-black text-brand-500 mb-1">{item.period}</p>
                    <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="hidden sm:block sm:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NOS VALEURS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Ce qui nous anime</p>
            <h2 className="text-3xl font-black text-gray-900">Nos 5 valeurs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map(({ emoji, icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all">
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

      {/* ENGAGEMENTS CHIFFRÉS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Notre impact</p>
            <h2 className="text-3xl font-black text-gray-900">Nos engagements chiffrés</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {COMMITMENTS.map(({ value, label }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-7 text-center border border-gray-100 hover:border-brand-300 hover:shadow-md transition-all">
                <div className="text-3xl font-black text-brand-600 mb-1">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTENAIRES */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-2">Confiance</p>
            <h2 className="text-3xl font-black text-gray-900">Nos partenaires</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {PARTNERS.map(name => (
              <div key={name} className="bg-white rounded-2xl p-6 border border-gray-100 flex items-center justify-center text-center hover:shadow-md transition-all">
                <span className="font-bold text-gray-700 text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-teal-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="w-6 h-6 text-white" />
            <h2 className="text-3xl font-black text-white">Vous partagez notre vision ?</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link to="/devenir-vendeur" className="px-6 py-3.5 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-lg text-sm inline-flex items-center gap-2">
              Devenir producteur <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/inscription" className="px-6 py-3.5 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl border border-white/30 hover:bg-white/20 transition-colors text-sm inline-flex items-center gap-2">
              Devenir acheteur <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/contact" className="px-6 py-3.5 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl border border-white/30 hover:bg-white/20 transition-colors text-sm inline-flex items-center gap-2">
              Nous contacter <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
