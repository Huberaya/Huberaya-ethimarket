/*
# Mise à jour des articles du blog EthiMarket

Remplace les 3 articles existants par les 3 nouveaux articles demandés.
*/

DELETE FROM articles;

INSERT INTO articles (title, slug, excerpt, category, image_url, author_name, author_avatar, published_at, read_time, featured) VALUES
  (
    'Comment obtenir la certification bio pour votre production ?',
    'certification-bio-production',
    'Guide complet en 5 étapes pour transformer votre exploitation et accéder au marché mondial du bio.',
    'Agriculture',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    'Marie Dupont',
    'MD',
    '2024-11-15',
    5,
    true
  ),
  (
    'Fairtrade vs Bio : comprendre les certifications',
    'fairtrade-vs-bio-certifications',
    'Décryptage complet des principales certifications internationales et leur signification pour les acheteurs.',
    'Commerce équitable',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    'Karim Benali',
    'KB',
    '2024-11-10',
    3,
    true
  ),
  (
    '5 gestes concrets pour réduire l''empreinte carbone de votre restaurant',
    'reduire-empreinte-carbone-restaurant',
    'De la sélection des fournisseurs à la gestion des déchets, découvrez comment agir efficacement.',
    'Environnement',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    'Sophie Martin',
    'SM',
    '2024-11-05',
    7,
    true
  );
