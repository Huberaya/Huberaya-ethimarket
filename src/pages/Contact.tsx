import { useState } from 'react';
import {
  Mail, Phone, MapPin, Clock, Send, CheckCircle,
  MessageSquare, BookOpen, HelpCircle, ArrowRight,
  Twitter, Linkedin, Instagram, Facebook,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SOCIAL_ICONS = [
  { icon: Twitter,   href: '#', label: 'Twitter' },
  { icon: Linkedin,  href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook,  href: '#', label: 'Facebook' },
];

const OTHER_METHODS = [
  { icon: MessageSquare, title: 'Chat en direct', desc: 'Support instantané 9h-18h', action: 'Ouvrir le chat' },
  { icon: BookOpen,      title: 'Centre d\'aide',   desc: 'Trouvez vos réponses',     action: 'Consulter' },
  { icon: HelpCircle,    title: 'FAQ',              desc: 'Questions fréquentes',     action: 'Voir les FAQ' },
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', profile: '', subject: '', message: '', consent: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.consent) setSent(true);
  };

  const update = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* HERO */}
      <section className="pt-32 pb-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-3">Support</p>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Contactez EthiMarket</h1>
          <p className="text-lg text-gray-500">Notre équipe vous répond en moins de 2h en semaine</p>
        </div>
      </section>

      {/* FORM + INFOS */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* FORM */}
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Envoyez-nous un message</h2>
              {sent ? (
                <div className="bg-brand-50 border-2 border-brand-200 rounded-2xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-brand-500 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Message envoyé !</h3>
                  <p className="text-sm text-gray-500">Nous vous répondrons à l'adresse {form.email} dans les 2 heures ouvrées.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom complet *</label>
                    <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all text-sm" placeholder="Jean Dupont" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                    <input type="email" required value={form.email} onChange={e => update('email', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all text-sm" placeholder="jean@entreprise.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone (optionnel)</label>
                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all text-sm" placeholder="+33 6 12 34 56 78" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vous êtes</label>
                      <select value={form.profile} onChange={e => update('profile', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all text-sm bg-white">
                        <option value="">Sélectionner...</option>
                        <option value="acheteur">Acheteur</option>
                        <option value="producteur">Producteur</option>
                        <option value="investisseur">Investisseur</option>
                        <option value="presse">Presse</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sujet</label>
                      <select value={form.subject} onChange={e => update('subject', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all text-sm bg-white">
                        <option value="">Sélectionner...</option>
                        <option value="generale">Question générale</option>
                        <option value="technique">Support technique</option>
                        <option value="partenariat">Partenariat</option>
                        <option value="presse">Presse</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message *</label>
                    <textarea required rows={5} value={form.message} onChange={e => update('message', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all text-sm resize-none" placeholder="Décrivez votre demande..." />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.consent} onChange={e => update('consent', e.target.checked)} className="mt-1 w-4 h-4 accent-brand-500" />
                    <span className="text-xs text-gray-500 leading-relaxed">J'accepte la <a href="/confidentialite" className="text-brand-600 font-semibold hover:underline">politique de confidentialité</a></span>
                  </label>
                  <button type="submit" disabled={!form.consent}
                    className="btn-primary w-full py-3.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send className="w-4 h-4" /> Envoyer le message
                  </button>
                </form>
              )}
            </div>

            {/* INFOS */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-6">Nos coordonnées</h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">Email</p>
                      <p className="text-sm text-gray-500">contact@ethimarket.com</p>
                      <p className="text-sm text-gray-500">support@ethimarket.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">Téléphone</p>
                      <p className="text-sm text-gray-500">+33 1 23 45 67 89</p>
                      <p className="text-xs text-gray-400">Lundi-Vendredi 9h-18h</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">Adresse</p>
                      <p className="text-sm text-gray-500">EthiMarket SAS</p>
                      <p className="text-sm text-gray-500">123 rue de l'Impact</p>
                      <p className="text-sm text-gray-500">75001 Paris, France</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">Horaires support</p>
                      <p className="text-sm text-gray-500">Lun-Ven : 9h00 - 18h00</p>
                      <p className="text-sm text-gray-500">Sam : 10h00 - 15h00</p>
                      <p className="text-sm text-gray-500">Dim : Fermé</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-4">Suivez-nous</h3>
                <div className="flex gap-3">
                  {SOCIAL_ICONS.map(({ icon: Icon, href, label }) => (
                    <a key={label} href={href} aria-label={label}
                      className="w-10 h-10 bg-gray-100 hover:bg-brand-50 rounded-xl flex items-center justify-center text-gray-500 hover:text-brand-600 transition-all">
                      <Icon className="w-4.5 h-4.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUTRES MOYENS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {OTHER_METHODS.map(({ icon: Icon, title, desc, action }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 text-center hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500 mb-4">{desc}</p>
                <button className="inline-flex items-center gap-1 text-brand-600 font-semibold text-xs hover:gap-1.5 transition-all">
                  {action} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
