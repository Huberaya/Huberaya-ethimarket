import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const LEGAL_CONTENT: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  '/conditions-utilisation': {
    title: "Conditions Générales d'Utilisation",
    sections: [
      { heading: '1. Objet', body: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme EthiMarket, marketplace B2B dédiée aux produits biologiques et équitables. En accédant à la plateforme, vous acceptez sans réserve les présentes conditions." },
      { heading: '2. Définitions', body: "EthiMarket : la société éditrice de la plateforme. Utilisateur : toute personne physique ou morale inscrite. Acheteur : utilisateur recherchant des produits. Producteur : utilisateur proposant des produits à la vente. Produit : bien matériel listé sur la plateforme." },
      { heading: '3. Inscription et compte', body: "L'inscription est gratuite. L'utilisateur s'engage à fournir des informations exactes et à les maintenir à jour. Le compte est personnel et non transférable. L'utilisateur est responsable de la sécurité de ses identifiants." },
      { heading: '4. Utilisation de la plateforme', body: "EthiMarket met en relation acheteurs et producteurs. La plateforme agit comme intermédiaire technique. Les transactions sont sécurisées par escrow via notre partenaire Stripe. La commission d'EthiMarket est de 5% sur les ventes réalisées." },
      { heading: '5. Obligations des producteurs', body: "Les producteurs s'engagent à vendre des produits conformes aux certifications affichées, à respecter les délais d'expédition annoncés, et à fournir des informations exactes sur leurs produits. Tout manquement peut entraîner la suspension du compte." },
      { heading: '6. Obligations des acheteurs', body: "Les acheteurs s'engagent à payer les commandes confirmées et à respecter les conditions de chaque producteur (MOQ, délais). Le paiement est sécurisé par escrow et débloqué à la réception." },
      { heading: '7. Paiements et escrow', body: "Les paiements sont traités par Stripe. Les fonds sont bloqués jusqu'à confirmation de réception par l'acheteur. Le producteur reçoit son paiement sous 7 jours après livraison confirmée." },
      { heading: '8. Litiges et réclamations', body: "En cas de litige, l'utilisateur doit contacter le support dans un délai de 14 jours. EthiMarket se réserve le droit de trancher les litiges et de retenir les fonds en escrow si nécessaire." },
      { heading: '9. Propriété intellectuelle', body: "Tous les éléments de la plateforme (marque, logo, contenus) sont la propriété d'EthiMarket. Toute reproduction sans autorisation est interdite." },
      { heading: '10. Responsabilité', body: "EthiMarket est un intermédiaire technique et ne peut être tenu responsable de la qualité des produits, des retards de livraison ou des manquements contractuels entre acheteurs et producteurs." },
      { heading: '11. Modification des CGU', body: "EthiMarket se réserve le droit de modifier les présentes CGU à tout moment. Les modifications prennent effet à leur publication sur la plateforme." },
      { heading: '12. Loi applicable', body: "Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront compétents." },
    ],
  },
  '/confidentialite': {
    title: 'Politique de Confidentialité',
    sections: [
      { heading: 'Données collectées', body: "EthiMarket collecte les données suivantes : nom, prénom, email, numéro de téléphone, adresse, informations professionnelles (entreprise, SIRET), données de transaction (commandes, paiements), données de navigation (cookies, adresse IP)." },
      { heading: 'Utilisation des données', body: "Vos données sont utilisées pour : créer et gérer votre compte, traiter les commandes et paiements, assurer le support client, améliorer la plateforme, envoyer des communications (newsletter, notifications). Vos données ne sont jamais vendues à des tiers." },
      { heading: 'Vos droits (RGPD)', body: "Conformément au RGPD, vous disposez des droits suivants : droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition. Pour exercer ces droits, contactez notre DPO à l'adresse privacy@ethimarket.com." },
      { heading: 'Cookies', body: "EthiMarket utilise des cookies pour assurer le fonctionnement de la plateforme (session, panier), mesurer l'audience (analytics) et personnaliser l'expérience. Vous pouvez gérer vos préférences via notre politique de cookies." },
      { heading: 'Sécurité des données', body: "Vos données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). L'accès est limité aux employés autorisés. Nous effectuons des audits de sécurité réguliers." },
      { heading: 'Conservation des données', body: "Les données de compte sont conservées tant que le compte est actif. Les données de transaction sont conservées 10 ans (obligations légales). Les données de navigation sont conservées 13 mois maximum." },
      { heading: 'Contact DPO', body: "Pour toute question relative à la protection de vos données : privacy@ethimarket.com ou par courrier à EthiMarket SAS, 123 rue de l'Impact, 75001 Paris, France." },
    ],
  },
  '/cookies': {
    title: 'Politique de Cookies',
    sections: [
      { heading: 'Qu\'est-ce qu\'un cookie ?', body: "Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d'un site web. Il permet de mémoriser des informations sur votre navigation pour améliorer votre expérience." },
      { heading: 'Cookies essentiels', body: "Ces cookies sont nécessaires au fonctionnement de la plateforme : session utilisateur, panier d'achat, sécurité anti-CSRF. Ils ne peuvent pas être désactivés." },
      { heading: 'Cookies de mesure d\'audience', body: "Nous utilisons des cookies analytics pour mesurer le trafic, les pages visitées et le parcours utilisateur. Ces données sont anonymisées." },
      { heading: 'Cookies de personnalisation', body: "Ces cookies mémorisent vos préférences (langue, filtres de recherche, produits favoris) pour personnaliser votre expérience." },
      { heading: 'Gestion des cookies', body: "Vous pouvez à tout moment gérer vos cookies via les paramètres de votre navigateur ou notre bandeau de consentement. La désactivation de certains cookies peut affecter le fonctionnement de la plateforme." },
      { heading: 'Tableau des cookies', body: "Cookie de session (ethimarket_session) : essentiel, expire à la fermeture. Cookie panier (ethimarket_cart) : essentiel, 30 jours. Cookie analytics (_ga) : mesure d'audience, 13 mois. Cookie préférences (ethimarket_prefs) : personnalisation, 1 an." },
    ],
  },
};

export default function Legal() {
  const location = useLocation();
  const content = LEGAL_CONTENT[location.pathname];

  if (!content) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead title={`${content.title} | EthiMarket`} description={content.sections[0]?.body || 'Mentions légales EthiMarket.'} />
      <Header />
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-600 font-semibold text-xs uppercase tracking-widest mb-3">Mentions légales</p>
          <h1 className="text-4xl font-black text-gray-900 mb-10">{content.title}</h1>
          <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 22 juillet 2024</p>

          <div className="space-y-8">
            {content.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-lg font-bold text-gray-900 mb-2">{section.heading}</h2>
                <p className="text-gray-600 leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-brand-50 rounded-2xl border border-brand-100">
            <p className="text-sm text-gray-600 leading-relaxed">
              Ce document est un modèle placeholder. Il devra être personnalisé et validé par un avocat
              avant publication officielle.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
