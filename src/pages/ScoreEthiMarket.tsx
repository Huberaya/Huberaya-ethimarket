import { Link } from 'react-router-dom';
import {
  Award, ShieldCheck, MapPin, Heart, Sprout, Star, X,
  CheckCircle, AlertTriangle, ChevronRight, TrendingUp,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CATEGORIES = [
  {
    icon: ShieldCheck, name: 'Certifications', max: 40, color: 'text-brand-600', bg: 'bg-brand-50',
    items: [
      { label: 'Certification bio vérifiée', points: 15 },
      { label: 'Fairtrade', points: 10 },
      { label: 'Autres certifications (+2 chacune, max 10)', points: 10 },
      { label: 'Analyses laboratoire à jour', points: 5 },
    ],
  },
  {
    icon: MapPin, name: 'Traçabilité', max: 25, color: 'text-blue-600', bg: 'bg-blue-50',
    items: [
      { label: 'Coordonnées GPS renseignées', points: 10 },
      { label: 'Photos exploitation (min. 5)', points: 5 },
      { label: 'Historique 3 ans', points: 5 },
      { label: 'Vidéo de présentation', points: 5 },
    ],
  },
  {
    icon: Heart, name: 'Éthique', max: 20, color: 'text-rose-600', bg: 'bg-rose-50',
    items: [
      { label: 'Charte signée', points: 5 },
      { label: 'Salaires documentés', points: 10 },
      { label: 'Rapport social annuel', points: 5 },
    ],
  },
  {
    icon: Sprout, name: 'Environnement', max: 10, color: 'text-emerald-600', bg: 'bg-emerald-50',
    items: [
      { label: 'Bilan carbone', points: 5 },
      { label: 'Actions durables', points: 5 },
    ],
  },
  {
    icon: Star, name: 'Satisfaction', max: 5, color: 'text-amber-500', bg: 'bg-amber-50',
    items: [
      { label: 'Note moyenne ≥ 4,5/5', points: 5 },
      { label: 'Note 4,0–4,4/5', points: 3 },
      { label: 'Note < 4,0/5', points: 0 },
    ],
  },
];

const BADGES = [
  { range: '90–100', label: 'Certifié Or', icon: '🏆', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Excellence — producteur exemplaire sur tous les critères' },
  { range: '75–89', label: 'Certifié Argent', icon: '🥈', color: 'bg-gray-100 text-gray-700 border-gray-300', desc: 'Très bon — producteur fiable et transparent' },
  { range: '60–74', label: 'Vérifié Bronze', icon: '🥉', color: 'bg-orange-100 text-orange-700 border-orange-200', desc: 'Conforme — producteur validé, en progression' },
  { range: '< 60', label: 'Non éligible', icon: '⚠️', color: 'bg-gray-100 text-gray-500 border-gray-200', desc: 'Score insuffisant — amélioration nécessaire' },
];

const PENALTIES = [
  { event: 'Certificat expiré', points: -10, icon: AlertTriangle },
  { event: 'Réclamation acheteur', points: -5, icon: AlertTriangle },
  { event: 'Litige non résolu', points: -20, icon: AlertTriangle },
  { event: 'Faux document détecté', points: -50, icon: X, suspend: true },
];

const IMPROVEMENT_TIPS = [
  { icon: ShieldCheck, text: 'Ajoutez et faites valider toutes vos certifications' },
  { icon: MapPin, text: 'Renseignez les coordonnées GPS de votre exploitation' },
  { icon: MapPin, text: 'Téléchargez au moins 5 photos de votre exploitation' },
  { icon: MapPin, text: 'Ajoutez une vidéo de présentation (+5 pts)' },
  { icon: Heart, text: 'Documentez les salaires versés à vos employés' },
  { icon: Sprout, text: 'Rédigez un bilan carbone et un rapport environnemental' },
  { icon: Star, text: 'Maintenez une note moyenne supérieure à 4,5/5' },
];

export default function ScoreEthiMarket() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <div className="pt-16 bg-gradient-to-br from-brand-50 via-white to-amber-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 mb-5">
            <Award className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Le Score EthiMarket</h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Une note sur 100 qui résume en un coup d'œil la fiabilité, la qualité
            et l'éthique d'un producteur. Plus le score est élevé, plus vous pouvez
            acheter en confiance.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* How it's calculated */}
        <section className="mb-14">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Comment est calculé le score ?</h2>
          <p className="text-gray-500 mb-8">Le score est réparti sur 100 points selon 5 catégories :</p>

          <div className="space-y-5">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.name} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.bg}`}>
                        <Icon className={`w-5 h-5 ${cat.color}`} />
                      </div>
                      <h3 className="font-bold text-gray-900">{cat.name}</h3>
                    </div>
                    <span className="text-sm font-black text-gray-900">{cat.max} pts</span>
                  </div>
                  <div className="p-5 space-y-2">
                    {cat.items.map(item => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-bold text-brand-600">+{item.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Badges */}
        <section className="mb-14">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Les badges</h2>
          <p className="text-gray-500 mb-8">Selon le score obtenu, le producteur reçoit un badge visible sur sa fiche :</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BADGES.map(badge => (
              <div key={badge.label} className={`rounded-2xl border-2 p-5 ${badge.color}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{badge.icon}</span>
                  <div>
                    <p className="font-black">{badge.label}</p>
                    <p className="text-xs opacity-80">Score {badge.range}</p>
                  </div>
                </div>
                <p className="text-sm opacity-90">{badge.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Penalties */}
        <section className="mb-14">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Système de pénalités</h2>
          <p className="text-gray-500 mb-8">Le score peut être réduit en cas de manquement :</p>

          <div className="space-y-3">
            {PENALTIES.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.event} className={`flex items-center gap-3 p-4 rounded-xl border ${p.suspend ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${p.suspend ? 'text-red-500' : 'text-amber-500'}`} />
                  <span className="flex-1 text-sm font-semibold text-gray-700">{p.event}</span>
                  <span className={`text-sm font-black ${p.suspend ? 'text-red-600' : 'text-amber-600'}`}>{p.points} pts</span>
                  {p.suspend && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">+ SUSPENSION</span>}
                </div>
              );
            })}
          </div>
        </section>

        {/* Automatic updates */}
        <section className="mb-14">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Mise à jour automatique</h2>
          <p className="text-gray-500 mb-8">Le score est recalculé automatiquement :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Chaque semaine (cron job)',
              'Après chaque validation de certification',
              'Après chaque nouvel avis acheteur',
              'Après chaque changement de certification',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" /> {item}
              </div>
            ))}
          </div>
        </section>

        {/* Improvement tips */}
        <section className="mb-14">
          <h2 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-500" /> Comment améliorer son score
          </h2>
          <p className="text-gray-500 mb-8">Conseils pour les producteurs qui souhaitent monter en grade :</p>
          <div className="bg-brand-50 rounded-2xl p-6 space-y-3">
            {IMPROVEMENT_TIPS.map((tip, i) => {
              const Icon = tip.icon;
              return (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <Icon className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" /> {tip.text}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-gray-50 rounded-3xl p-8">
          <h2 className="text-xl font-black text-gray-900 mb-3">Prêt à acheter en confiance ?</h2>
          <p className="text-gray-500 mb-5">Parcourez notre catalogue de producteurs vérifiés.</p>
          <Link to="/catalogue" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            Voir le catalogue <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
