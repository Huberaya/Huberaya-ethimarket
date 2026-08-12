/*
# EthiMarket — schéma complet de la marketplace

## Tables créées
1. `categories` — catégories de produits (bio, épices, etc.)
2. `producers` — coopératives et producteurs certifiés
3. `products` — catalogue de produits avec certifications et prix dégressifs
4. `reviews` — avis des acheteurs sur les produits

## Sécurité
- RLS activé sur toutes les tables
- Données publiquement lisibles (marketplace publique, pas d'auth obligatoire pour naviguer)
- Les insertions/mises à jour sont réservées aux utilisateurs authentifiés
*/

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL,
  product_count integer DEFAULT 0,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_categories" ON categories;
CREATE POLICY "auth_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_categories" ON categories;
CREATE POLICY "auth_update_categories" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_categories" ON categories;
CREATE POLICY "auth_delete_categories" ON categories FOR DELETE
  TO authenticated USING (true);

-- PRODUCERS
CREATE TABLE IF NOT EXISTS producers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  country text NOT NULL,
  country_flag text NOT NULL,
  description text,
  avatar_initials text NOT NULL,
  avatar_color text NOT NULL DEFAULT '#16a34a',
  rating numeric(3,1) DEFAULT 4.5,
  review_count integer DEFAULT 0,
  product_count integer DEFAULT 0,
  order_count integer DEFAULT 0,
  satisfaction_rate numeric(5,2) DEFAULT 95,
  response_time text DEFAULT '2h',
  verified boolean DEFAULT false,
  top_seller boolean DEFAULT false,
  founded_year integer,
  employee_count integer,
  banner_color text DEFAULT '#14532d',
  certifications text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE producers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_producers" ON producers;
CREATE POLICY "public_read_producers" ON producers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_producers" ON producers;
CREATE POLICY "auth_insert_producers" ON producers FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_producers" ON producers;
CREATE POLICY "auth_update_producers" ON producers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_producers" ON producers;
CREATE POLICY "auth_delete_producers" ON producers FOR DELETE
  TO authenticated USING (true);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  producer_id uuid REFERENCES producers(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  country text NOT NULL,
  country_flag text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  price_unit text NOT NULL DEFAULT 'kg',
  moq_value integer DEFAULT 1,
  moq_unit text DEFAULT 'kg',
  stock_value integer DEFAULT 0,
  stock_unit text DEFAULT 'kg',
  monthly_capacity integer DEFAULT 0,
  delivery_days text DEFAULT '5-7',
  certifications text[] DEFAULT '{}',
  rating numeric(3,1) DEFAULT 4.5,
  review_count integer DEFAULT 0,
  emoji text NOT NULL DEFAULT '🌿',
  bg_color text NOT NULL DEFAULT '#dcfce7',
  featured boolean DEFAULT false,
  top_seller boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_products" ON products;
CREATE POLICY "auth_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_products" ON products;
CREATE POLICY "auth_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_products" ON products;
CREATE POLICY "auth_delete_products" ON products FOR DELETE
  TO authenticated USING (true);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_company text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_reviews" ON reviews;
CREATE POLICY "auth_insert_reviews" ON reviews FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_reviews" ON reviews;
CREATE POLICY "auth_update_reviews" ON reviews FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_reviews" ON reviews;
CREATE POLICY "auth_delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (true);

-- SEED CATEGORIES
INSERT INTO categories (name, emoji, product_count, slug) VALUES
  ('Huiles & Graisses', '🫒', 1240, 'huiles-graisses'),
  ('Épices & Herbes', '🌶️', 890, 'epices-herbes'),
  ('Café, Thé & Cacao', '☕', 650, 'cafe-the-cacao'),
  ('Fruits & Légumes', '🥦', 1100, 'fruits-legumes'),
  ('Céréales & Graines', '🌾', 430, 'cereales-graines'),
  ('Miel & Sucres naturels', '🍯', 310, 'miel-sucres'),
  ('Cosmétiques naturels', '🧴', 520, 'cosmetiques'),
  ('Textile éthique', '🧶', 280, 'textile')
ON CONFLICT (slug) DO NOTHING;

-- SEED PRODUCERS
INSERT INTO producers (name, slug, country, country_flag, avatar_initials, avatar_color, rating, review_count, product_count, order_count, satisfaction_rate, response_time, verified, top_seller, founded_year, employee_count, banner_color, certifications, description) VALUES
  ('Coopérative Argan Atlas', 'argan-atlas', 'Maroc', '🇲🇦', 'AA', '#15803d', 4.9, 213, 8, 420, 98.2, '2h', true, true, 2008, 45, '#14532d', ARRAY['Bio', 'Fairtrade'], 'Coopérative féminine spécialisée dans l''huile d''argan pure du Maroc.'),
  ('Yirgacheffe Coffee Union', 'yirgacheffe-union', 'Éthiopie', '🇪🇹', 'YC', '#92400e', 4.8, 187, 5, 380, 97.5, '4h', true, true, 2005, 120, '#78350f', ARRAY['Bio', 'Rainforest Alliance'], 'Union de producteurs de café de la région Yirgacheffe.'),
  ('Saffron Fields Iran', 'saffron-fields', 'Iran', '🇮🇷', 'SF', '#b45309', 4.9, 94, 3, 156, 99.1, '1h', true, false, 2012, 18, '#92400e', ARRAY['Bio', 'Ecocert'], 'Exploitation familiale de safran premium de Khorasan.')
ON CONFLICT (slug) DO NOTHING;

-- SEED PRODUCTS
WITH cat_huiles AS (SELECT id FROM categories WHERE slug='huiles-graisses'),
     cat_cafe AS (SELECT id FROM categories WHERE slug='cafe-the-cacao'),
     cat_epices AS (SELECT id FROM categories WHERE slug='epices-herbes'),
     cat_cereales AS (SELECT id FROM categories WHERE slug='cereales-graines'),
     cat_miel AS (SELECT id FROM categories WHERE slug='miel-sucres'),
     cat_cosmetiques AS (SELECT id FROM categories WHERE slug='cosmetiques'),
     prod_argan AS (SELECT id FROM producers WHERE slug='argan-atlas'),
     prod_yirg AS (SELECT id FROM producers WHERE slug='yirgacheffe-union'),
     prod_saffron AS (SELECT id FROM producers WHERE slug='saffron-fields')
INSERT INTO products (name, slug, producer_id, category_id, country, country_flag, description, price, price_unit, moq_value, moq_unit, stock_value, stock_unit, monthly_capacity, delivery_days, certifications, rating, review_count, emoji, bg_color, featured, top_seller) VALUES
  ('Huile d''Argan Bio', 'huile-argan-bio', (SELECT id FROM prod_argan), (SELECT id FROM cat_huiles), 'Maroc', '🇲🇦', 'Huile d''argan 100% pure, extraite à froid par des femmes de coopératives certifiées. Idéale pour la cosmétique et l''alimentation.', 28.00, 'L', 20, 'L', 2500, 'L', 5000, '5-7', ARRAY['Bio', 'Fairtrade'], 4.9, 127, '🫒', '#fef9c3', true, true),
  ('Café Éthiopien Yirgacheffe', 'cafe-ethiopien-yirgacheffe', (SELECT id FROM prod_yirg), (SELECT id FROM cat_cafe), 'Éthiopie', '🇪🇹', 'Café d''exception aux notes florales et fruitées. Torréfaction légère pour préserver les arômes naturels.', 18.00, 'kg', 10, 'kg', 800, 'kg', 2000, '7-10', ARRAY['Bio', 'Rainforest Alliance'], 4.8, 98, '☕', '#fef3c7', true, false),
  ('Safran Premium', 'safran-premium', (SELECT id FROM prod_saffron), (SELECT id FROM cat_epices), 'Iran', '🇮🇷', 'Safran de grade 1 de la région de Khorasan, récolté à la main au lever du soleil. Teneur en safranal exceptionnelle.', 8.00, 'g', 100, 'g', 5000, 'g', 10000, '5-7', ARRAY['Bio', 'Ecocert'], 4.9, 76, '🌸', '#fce7f3', true, false),
  ('Vanille Bourbon', 'vanille-bourbon', NULL, (SELECT id FROM cat_epices), 'Madagascar', '🇲🇬', 'Gousses de vanille Bourbon de Madagascar, longues et charnues, riches en vanilline naturelle.', 45.00, '100g', 500, 'g', 3000, 'g', 6000, '7-14', ARRAY['Bio'], 4.7, 54, '🌿', '#f0fdf4', true, true),
  ('Quinoa Bio', 'quinoa-bio', NULL, (SELECT id FROM cat_cereales), 'Pérou', '🇵🇪', 'Quinoa blanc des hauts plateaux andins, sans gluten, riche en protéines.', 6.00, 'kg', 25, 'kg', 5000, 'kg', 10000, '10-14', ARRAY['Bio', 'Fairtrade'], 4.6, 43, '🌾', '#fef9c3', false, false),
  ('Cacao Brut', 'cacao-brut', NULL, (SELECT id FROM cat_cafe), 'Ghana', '🇬🇭', 'Poudre de cacao 100% naturelle, non dégraissée. Riche en flavonoïdes et magnésium.', 12.00, 'kg', 20, 'kg', 3000, 'kg', 8000, '7-10', ARRAY['Bio', 'Fairtrade'], 4.8, 67, '🍫', '#fef3c7', false, false),
  ('Miel de Thym', 'miel-thym', NULL, (SELECT id FROM cat_miel), 'Grèce', '🇬🇷', 'Miel de thym du mont Hymette, l''un des plus prisés au monde pour ses vertus médicinales.', 14.00, 'kg', 12, 'kg', 800, 'kg', 2000, '5-7', ARRAY['Bio'], 4.9, 112, '🍯', '#fef9c3', false, true),
  ('Thé Vert Sencha', 'the-vert-sencha', NULL, (SELECT id FROM cat_cafe), 'Japon', '🇯🇵', 'Thé vert Sencha de première récolte (Ichiban-cha). Notes herbacées, légèrement sucrées.', 22.00, '100g', 200, 'g', 1000, 'g', 3000, '7-10', ARRAY['Bio', 'GlobalGAP'], 4.7, 38, '🍵', '#f0fdf4', false, false),
  ('Spiruline Bio', 'spiruline-bio', NULL, (SELECT id FROM cat_cosmetiques), 'France', '🇫🇷', 'Spiruline cultivée en France en bassin ouvert, séchée à basse température pour préserver les nutriments.', 35.00, 'kg', 5, 'kg', 500, 'kg', 1500, '3-5', ARRAY['Bio', 'Ecocert'], 4.8, 29, '💚', '#f0fdf4', false, false),
  ('Huile de Coco Bio', 'huile-coco-bio', NULL, (SELECT id FROM cat_huiles), 'Sri Lanka', '🇱🇰', 'Huile de coco vierge extraite à froid, non raffinée. Idéale pour la cuisine et la cosmétique.', 8.00, 'L', 20, 'L', 2000, 'L', 5000, '7-10', ARRAY['Bio', 'Fairtrade'], 4.6, 81, '🥥', '#f0fdf4', false, false),
  ('Curcuma Moulu', 'curcuma-moulu', NULL, (SELECT id FROM cat_epices), 'Inde', '🇮🇳', 'Curcuma de Kerala, teneur en curcumine supérieure à 5%. Arôme puissant et couleur intense.', 9.00, 'kg', 10, 'kg', 3000, 'kg', 8000, '7-14', ARRAY['Bio', 'Ecocert'], 4.7, 95, '🌿', '#fef9c3', false, false),
  ('Sirop d''Agave', 'sirop-agave', NULL, (SELECT id FROM cat_miel), 'Mexique', '🇲🇽', 'Sirop d''agave bleu clair, indice glycémique faible, idéal pour remplacer le sucre raffiné.', 7.00, 'L', 15, 'L', 1500, 'L', 4000, '10-14', ARRAY['Bio', 'Fairtrade'], 4.5, 47, '🌵', '#fef9c3', false, false)
ON CONFLICT (slug) DO NOTHING;
