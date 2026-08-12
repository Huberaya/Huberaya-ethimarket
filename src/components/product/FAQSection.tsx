import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { SectionTitle } from './GuaranteesSection';

const FAQS = [
  {
    q: 'Comment vérifier l\'authenticité du certificat bio ?',
    a: 'Notre équipe contacte directement Ecocert pour vérifier chaque certificat. Vous pouvez aussi vérifier vous-même sur ecocert.com avec le numéro fourni.',
  },
  {
    q: 'Que se passe-t-il si le produit reçu n\'est pas conforme ?',
    a: 'Vous avez 7 jours pour signaler un problème. Le paiement reste bloqué. Nous investiguons sous 48h. Vous êtes intégralement remboursé si non-conformité prouvée.',
  },
  {
    q: 'Combien de temps entre la commande et la livraison ?',
    a: 'Selon l\'option choisie : DHL Express (5-7 jours), UPS (10-14 jours), Maritime (30-45 jours).',
  },
  {
    q: 'Puis-je commander un échantillon avant ?',
    a: 'Oui, pour la plupart des producteurs. Contactez-les directement via la messagerie.',
  },
  {
    q: 'Comment sont calculés les frais de douane ?',
    a: 'Automatiquement selon le pays destination et le type de produit. Détails transparents avant paiement.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-12 border-t border-gray-100">
      <SectionTitle icon={HelpCircle} title="Questions fréquentes" />

      <div className="mt-8 space-y-3">
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className="font-bold text-sm text-gray-900">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
