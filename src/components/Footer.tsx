import { Link } from 'react-router-dom';
import { Leaf, Twitter, Linkedin, Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';

const FOOTER_LINKS = {
  Marketplace: [
    { label: 'Catalogue produits', href: '/catalogue' },
    { label: 'Producteurs certifiés', href: '/producteurs' },
    { label: 'Devenir vendeur', href: '/devenir-vendeur' },
    { label: 'Tarifs & abonnements', href: '/tarifs' },
    { label: 'Blog & actualités', href: '/blog' },
  ],
  'À propos': [
    { label: 'Notre mission', href: '/notre-mission' },
    { label: 'Notre équipe', href: '/notre-equipe' },
    { label: 'Certifications', href: '/certifications' },
    { label: 'Presse', href: '/presse' },
    { label: 'Partenaires', href: '/partenaires' },
  ],
  Support: [
    { label: 'Centre d\'aide', href: '/centre-aide' },
    { label: 'Nous contacter', href: '/contact' },
    { label: "Conditions d'utilisation", href: '/conditions-utilisation' },
    { label: 'Confidentialité', href: '/confidentialite' },
    { label: 'Cookies', href: '/cookies' },
  ],
};

const SOCIALS = [
  { Icon: Twitter,   label: 'Twitter' },
  { Icon: Linkedin,  label: 'LinkedIn' },
  { Icon: Instagram, label: 'Instagram' },
  { Icon: Facebook,  label: 'Facebook' },
];

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-16 border-b border-white/10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">EthiMarket</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              La marketplace mondiale dédiée aux produits biologiques, éthiques et issus du commerce équitable. Connectez-vous directement aux producteurs certifiés de 45 pays.
            </p>

            {/* Contact */}
            <div className="space-y-2 mb-6">
              {[
                { Icon: Mail,  text: 'contact@ethimarket.com' },
                { Icon: Phone, text: '+33 1 23 45 67 89' },
                { Icon: MapPin, text: 'Paris, France' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-gray-400">
                  <Icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 bg-white/5 hover:bg-brand-500 rounded-lg flex items-center justify-center transition-colors group"
                >
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">{section}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-sm text-gray-400 hover:text-brand-300 transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <p className="text-sm text-gray-500">© 2024 EthiMarket SAS. Tous droits réservés.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse"></span>
              Tous systèmes opérationnels
            </span>
            <span className="text-gray-700">·</span>
            <span className="text-xs text-gray-500">v2.4.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
