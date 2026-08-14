/*
# Table articles pour le blog EthiMarket

## Table créée
- `articles` : articles de blog (guides produit, portraits de producteurs, tendances du marché)
  - title, slug, excerpt, category, image_url, author_name, author_avatar, published_at, read_time, featured

## Sécurité
- RLS activé, lecture publique (anon + authenticated), écriture authentifiée
*/

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text NOT NULL,
  category text NOT NULL,
  image_url text,
  author_name text NOT NULL,
  author_avatar text,
  published_at timestamptz DEFAULT now(),
  read_time integer DEFAULT 5,
  featured boolean DEFAULT false
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_articles" ON articles;
CREATE POLICY "public_read_articles" ON articles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_articles" ON articles;
CREATE POLICY "auth_insert_articles" ON articles FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_articles" ON articles;
CREATE POLICY "auth_update_articles" ON articles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_articles" ON articles;
CREATE POLICY "auth_delete_articles" ON articles FOR DELETE
  TO authenticated USING (true);

INSERT INTO articles (title, slug, excerpt, category, image_url, author_name, author_avatar, published_at, read_time, featured) VALUES
  ('Guide complet : comment choisir son huile d''argan bio', 'guide-huile-argan-bio', 'Huile alimentaire ou cosmétique ? Pression à froid ou solvant ? Notre guide vous aide à distinguer les qualités et à acheter malin.', 'Guide produit', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80', 'Marie Dupont', 'MD', '2024-07-15', 8, true),
  ('Portrait : Aisha et la coopérative des femmes de l''Atlas', 'portrait-aisha-cooperative-atlas', 'Rencontre avec Aisha Amrani, présidente d''une coopérative de 45 femmes qui produisent l''une des meilleures huiles d''argan du Maroc.', 'Producteur', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', 'Karim Benali', 'KB', '2024-07-10', 6, true),
  ('Commerce équitable : les chiffres qui changent tout en 2024', 'commerce-equitable-chiffres-2024', 'Le commerce équitable représente désormais 12 milliards d''euros dans le monde. Analyse des tendances et impact sur les producteurs du Sud.', 'Tendances', 'https://images.unsplash.com/photo-1521791136064-7986c5920216?auto=format&fit=crop&w=800&q=80', 'Sophie Martin', 'SM', '2024-07-05', 10, true)
ON CONFLICT (slug) DO NOTHING;
