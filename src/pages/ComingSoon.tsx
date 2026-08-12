import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Leaf } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PAGE_TITLES: Record<string, string> = {
  '/notre-equipe': 'Notre équipe',
  '/certifications': 'Certifications',
  '/presse': 'Presse',
  '/partenaires': 'Partenaires',
  '/centre-aide': 'Centre d\'aide',
  '/tarifs': 'Tarifs & abonnements',
};

export default function ComingSoon() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'Page';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Leaf className="w-10 h-10 text-brand-500" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">{title}</h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-8">
            Cette section sera disponible très prochainement. En attendant, contactez-nous à{' '}
            <a href="mailto:contact@ethimarket.com" className="text-brand-600 font-semibold hover:underline">
              contact@ethimarket.com
            </a>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="btn-primary px-6 py-3 text-sm inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
            </Link>
            <a href="mailto:contact@ethimarket.com" className="btn-outline px-6 py-3 text-sm inline-flex items-center gap-2">
              <Mail className="w-4 h-4" /> Nous contacter
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
