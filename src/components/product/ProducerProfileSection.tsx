import { Link } from 'react-router-dom';
import {
  Award, MapPin, Star, Package, Globe, Zap, CheckCircle2,
  ArrowRight, MessageSquare,
} from 'lucide-react';
import type { Producer } from '../../lib/supabase';
import { SectionTitle } from './GuaranteesSection';

export default function ProducerProfileSection({ producer }: { producer: Producer | null }) {
  if (!producer) return null;

  return (
    <section className="py-12 border-t border-gray-100">
      <SectionTitle icon={Award} title="Qui produit ce produit ?" />

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="h-2" style={{ backgroundColor: producer.banner_color }} />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-md"
              style={{ backgroundColor: producer.avatar_color }}>
              {producer.avatar_initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-xl font-black text-gray-900">{producer.name}</h3>
                {producer.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Vérifié
                  </span>
                )}
                {producer.top_seller && (
                  <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">TOP VENDEUR</span>
                )}
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
                <MapPin className="w-3.5 h-3.5" /> {producer.country_flag} {producer.country}
                {producer.region && ` • ${producer.region}`}
                {producer.founded_year && ` • Depuis ${producer.founded_year}`}
              </p>
              {producer.story && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{producer.story}</p>
              )}
              {producer.description && !producer.story && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{producer.description}</p>
              )}

              {/* Certifications */}
              {producer.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {producer.certifications.map(cert => (
                    <span key={cert} className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                      {cert}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Stat icon={Star} value={`${producer.rating}/5`} label={`${producer.review_count} avis`} color="text-amber-500" />
                <Stat icon={Package} value={`${producer.order_count}`} label="commandes" color="text-brand-600" />
                <Stat icon={Globe} value="23" label="pays de vente" color="text-blue-600" />
                <Stat icon={Zap} value={producer.response_time} label="réponse moy." color="text-purple-600" />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Link to={`/boutique/${producer.slug}`} className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
                  Voir tous ses produits <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="btn-outline px-5 py-2.5 text-sm inline-flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Contacter le producteur
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, value, label, color }: { icon: typeof Star; value: string; label: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <p className="text-sm font-black text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}
