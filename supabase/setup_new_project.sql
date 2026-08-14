-- ════════════════════════════════════════════════════════════════
-- EthiMarket — Script de déploiement complet pour un nouveau projet Supabase
-- ════════════════════════════════════════════════════════════════
-- INSTRUCTIONS :
-- 1. Connectez-vous à votre projet Supabase (https://supabase.com/dashboard)
-- 2. Ouvrez le "SQL Editor"
-- 3. Collez ce script entier et cliquez sur "Run"
-- 4. Toutes les tables, politiques RLS et données de démo seront créées
-- ════════════════════════════════════════════════════════════════


-- ─── TABLE 1 : PROFILES (comptes utilisateurs) ───────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  company text,
  phone text,
  role text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'producer', 'admin')),
  is_admin boolean DEFAULT false,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);


-- ─── TABLE 2 : CATEGORIES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL,
  product_count integer DEFAULT 0,
  slug text UNIQUE NOT NULL,
  image_url text,
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


-- ─── TABLE 3 : PRODUCERS ─────────────────────────────────────────
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


-- ─── TABLE 4 : PRODUCTS ──────────────────────────────────────────
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
  image_url text,
  user_id uuid DEFAULT auth.uid(),
  short_description text,
  region text,
  currency text DEFAULT 'EUR',
  status text DEFAULT 'active',
  batch_number text,
  planting_date date,
  harvest_date date,
  packaging_date date,
  farming_method text,
  gps_coordinates text,
  co2_estimate text,
  trace_qr_code text,
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


-- ─── TABLE 5 : REVIEWS ───────────────────────────────────────────
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


-- ─── TABLE 6 : ORDERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  producer_id uuid REFERENCES producers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity numeric(10,2) NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  total_price numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address text,
  tracking_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_orders" ON orders;
CREATE POLICY "read_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = producer_id);

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = producer_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = producer_id);

DROP POLICY IF EXISTS "delete_own_orders" ON orders;
CREATE POLICY "delete_own_orders" ON orders FOR DELETE
  TO authenticated USING (auth.uid() = buyer_id);


-- ─── TABLE 7 : ARTICLES (blog) ───────────────────────────────────
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


-- ═══════════════════════════════════════════════════════════════
-- DONNÉES DE DÉMONSTRATION
-- ═══════════════════════════════════════════════════════════════


-- ─── CATÉGORIES (8) ──────────────────────────────────────────────
INSERT INTO categories (name, emoji, product_count, slug, image_url) VALUES
  ('Huiles & Graisses', '🫒', 1240, 'huiles-graisses', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80'),
  ('Épices & Herbes', '🌶️', 890, 'epices-herbes', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80'),
  ('Café, Thé & Cacao', '☕', 650, 'cafe-the-cacao', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80'),
  ('Fruits & Légumes', '🥦', 1100, 'fruits-legumes', 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80'),
  ('Céréales & Graines', '🌾', 430, 'cereales-graines', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'),
  ('Miel & Sucres naturels', '🍯', 310, 'miel-sucres', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80'),
  ('Cosmétiques naturels', '🧴', 520, 'cosmetiques', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80'),
  ('Textile éthique', '🧶', 280, 'textile', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (slug) DO NOTHING;


-- ─── PRODUCTEURS (6) ─────────────────────────────────────────────
INSERT INTO producers (name, slug, country, country_flag, avatar_initials, avatar_color, rating, review_count, product_count, order_count, satisfaction_rate, response_time, verified, top_seller, founded_year, employee_count, banner_color, certifications, description) VALUES
  ('Coopérative Argan Atlas', 'argan-atlas', 'Maroc', '🇲🇦', 'AA', '#15803d', 4.9, 213, 8, 420, 98.2, '2h', true, true, 2008, 45, '#14532d', ARRAY['Bio', 'Fairtrade'], 'Coopérative féminine spécialisée dans l''huile d''argan pure du Maroc.'),
  ('Yirgacheffe Coffee Union', 'yirgacheffe-union', 'Éthiopie', '🇪🇹', 'YC', '#92400e', 4.8, 187, 5, 380, 97.5, '4h', true, true, 2005, 120, '#78350f', ARRAY['Bio', 'Rainforest Alliance'], 'Union de producteurs de café de la région Yirgacheffe.'),
  ('Saffron Fields Iran', 'saffron-fields', 'Iran', '🇮🇷', 'SF', '#b45309', 4.9, 94, 3, 156, 99.1, '1h', true, false, 2012, 18, '#92400e', ARRAY['Bio', 'Ecocert'], 'Exploitation familiale de safran premium de Khorasan.'),
  ('Vanille Bourbon Madagascar', 'vanille-bourbon-mg', 'Madagascar', '🇲🇬', 'VB', '#7c2d12', 4.7, 68, 4, 92, 96.3, '6h', true, false, 2010, 32, '#7c2d12', ARRAY['Bio', 'Fairtrade'], 'Coopérative de producteurs de vanille Bourbon de la côte est.'),
  ('Quinoa Andes Coop', 'quinoa-andes', 'Pérou', '🇵🇪', 'QA', '#92400e', 4.6, 51, 3, 78, 95.8, '8h', true, false, 2015, 25, '#92400e', ARRAY['Bio', 'Fairtrade'], 'Coopérative de quinoa des hauts plateaux andins.'),
  ('Cacao Ghana Cooperative', 'cacao-ghana', 'Ghana', '🇬🇭', 'CG', '#451a03', 4.8, 73, 4, 110, 97.2, '3h', true, true, 2007, 85, '#451a03', ARRAY['Bio', 'Fairtrade'], 'Coopérative de cacao-fèves du Ghana central.')
ON CONFLICT (slug) DO NOTHING;


-- ─── PRODUITS (12) ──────────────────────────────────────────────
WITH cat_huiles AS (SELECT id FROM categories WHERE slug='huiles-graisses'),
     cat_cafe AS (SELECT id FROM categories WHERE slug='cafe-the-cacao'),
     cat_epices AS (SELECT id FROM categories WHERE slug='epices-herbes'),
     cat_cereales AS (SELECT id FROM categories WHERE slug='cereales-graines'),
     cat_miel AS (SELECT id FROM categories WHERE slug='miel-sucres'),
     cat_cosmetiques AS (SELECT id FROM categories WHERE slug='cosmetiques'),
     prod_argan AS (SELECT id FROM producers WHERE slug='argan-atlas'),
     prod_yirg AS (SELECT id FROM producers WHERE slug='yirgacheffe-union'),
     prod_saffron AS (SELECT id FROM producers WHERE slug='saffron-fields'),
     prod_vanille AS (SELECT id FROM producers WHERE slug='vanille-bourbon-mg'),
     prod_quinoa AS (SELECT id FROM producers WHERE slug='quinoa-andes'),
     prod_cacao AS (SELECT id FROM producers WHERE slug='cacao-ghana')
INSERT INTO products (name, slug, producer_id, category_id, country, country_flag, description, price, price_unit, moq_value, moq_unit, stock_value, stock_unit, monthly_capacity, delivery_days, certifications, rating, review_count, emoji, bg_color, image_url, featured, top_seller) VALUES
  ('Huile d''Argan Bio', 'huile-argan-bio', (SELECT id FROM prod_argan), (SELECT id FROM cat_huiles), 'Maroc', '🇲🇦', 'Huile d''argan 100% pure, extraite à froid par des femmes de coopératives certifiées. Idéale pour la cosmétique et l''alimentation.', 28.00, 'L', 20, 'L', 2500, 'L', 5000, '5-7', ARRAY['Bio', 'Fairtrade'], 4.9, 127, '🫒', '#fef9c3', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80', true, true),
  ('Café Éthiopien Yirgacheffe', 'cafe-ethiopien-yirgacheffe', (SELECT id FROM prod_yirg), (SELECT id FROM cat_cafe), 'Éthiopie', '🇪🇹', 'Café d''exception aux notes florales et fruitées. Torréfaction légère pour préserver les arômes naturels.', 18.00, 'kg', 10, 'kg', 800, 'kg', 2000, '7-10', ARRAY['Bio', 'Rainforest Alliance'], 4.8, 98, '☕', '#fef3c7', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80', true, false),
  ('Safran Premium', 'safran-premium', (SELECT id FROM prod_saffron), (SELECT id FROM cat_epices), 'Iran', '🇮🇷', 'Safran de grade 1 de la région de Khorasan, récolté à la main au lever du soleil. Teneur en safranal exceptionnelle.', 8.00, 'g', 100, 'g', 5000, 'g', 10000, '5-7', ARRAY['Bio', 'Ecocert'], 4.9, 76, '🌸', '#fce7f3', 'https://images.unsplash.com/photo-1611065842937-8ea27ac07bcd?auto=format&fit=crop&w=800&q=80', true, false),
  ('Vanille Bourbon', 'vanille-bourbon', (SELECT id FROM prod_vanille), (SELECT id FROM cat_epices), 'Madagascar', '🇲🇬', 'Gousses de vanille Bourbon de Madagascar, longues et charnues, riches en vanilline naturelle.', 45.00, '100g', 500, 'g', 3000, 'g', 6000, '7-14', ARRAY['Bio'], 4.7, 54, '🌿', '#f0fdf4', 'https://images.unsplash.com/photo-1611080541599-8c6dbde6ed28?auto=format&fit=crop&w=800&q=80', true, true),
  ('Quinoa Bio', 'quinoa-bio', (SELECT id FROM prod_quinoa), (SELECT id FROM cat_cereales), 'Pérou', '🇵🇪', 'Quinoa blanc des hauts plateaux andins, sans gluten, riche en protéines.', 6.00, 'kg', 25, 'kg', 5000, 'kg', 10000, '10-14', ARRAY['Bio', 'Fairtrade'], 4.6, 43, '🌾', '#fef9c3', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', false, false),
  ('Cacao Brut', 'cacao-brut', (SELECT id FROM prod_cacao), (SELECT id FROM cat_cafe), 'Ghana', '🇬🇭', 'Poudre de cacao 100% naturelle, non dégraissée. Riche en flavonoïdes et magnésium.', 12.00, 'kg', 20, 'kg', 3000, 'kg', 8000, '7-10', ARRAY['Bio', 'Fairtrade'], 4.8, 67, '🍫', '#fef3c7', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', false, false),
  ('Miel de Thym', 'miel-thym', NULL, (SELECT id FROM cat_miel), 'Grèce', '🇬🇷', 'Miel de thym du mont Hymette, l''un des plus prisés au monde pour ses vertus médicinales.', 14.00, 'kg', 12, 'kg', 800, 'kg', 2000, '5-7', ARRAY['Bio'], 4.9, 112, '🍯', '#fef9c3', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80', false, true),
  ('Thé Vert Sencha', 'the-vert-sencha', NULL, (SELECT id FROM cat_cafe), 'Japon', '🇯🇵', 'Thé vert Sencha de première récolte (Ichiban-cha). Notes herbacées, légèrement sucrées.', 22.00, '100g', 200, 'g', 1000, 'g', 3000, '7-10', ARRAY['Bio', 'GlobalGAP'], 4.7, 38, '🍵', '#f0fdf4', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80', false, false),
  ('Spiruline Bio', 'spiruline-bio', NULL, (SELECT id FROM cat_cosmetiques), 'France', '🇫🇷', 'Spiruline cultivée en France en bassin ouvert, séchée à basse température pour préserver les nutriments.', 35.00, 'kg', 5, 'kg', 500, 'kg', 1500, '3-5', ARRAY['Bio', 'Ecocert'], 4.8, 29, '💚', '#f0fdf4', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', false, false),
  ('Huile de Coco Bio', 'huile-coco-bio', NULL, (SELECT id FROM cat_huiles), 'Sri Lanka', '🇱🇰', 'Huile de coco vierge extraite à froid, non raffinée. Idéale pour la cuisine et la cosmétique.', 8.00, 'L', 20, 'L', 2000, 'L', 5000, '7-10', ARRAY['Bio', 'Fairtrade'], 4.6, 81, '🥥', '#f0fdf4', 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80', false, false),
  ('Curcuma Moulu', 'curcuma-moulu', NULL, (SELECT id FROM cat_epices), 'Inde', '🇮🇳', 'Curcuma de Kerala, teneur en curcumine supérieure à 5%. Arôme puissant et couleur intense.', 9.00, 'kg', 10, 'kg', 3000, 'kg', 8000, '7-14', ARRAY['Bio', 'Ecocert'], 4.7, 95, '🌿', '#fef9c3', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80', false, false),
  ('Sirop d''Agave', 'sirop-agave', NULL, (SELECT id FROM cat_miel), 'Mexique', '🇲🇽', 'Sirop d''agave bleu clair, indice glycémique faible, idéal pour remplacer le sucre raffiné.', 7.00, 'L', 15, 'L', 1500, 'L', 4000, '10-14', ARRAY['Bio', 'Fairtrade'], 4.5, 47, '🌵', '#fef9c3', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80', false, false)
ON CONFLICT (slug) DO NOTHING;


-- ─── AVIS (reviews de démonstration) ───────────────────────────
INSERT INTO reviews (product_id, author_name, author_company, rating, content) VALUES
  ((SELECT id FROM products WHERE slug='huile-argan-bio'), 'Sophie Martin', 'Bio Cosmetics SARL', 5, 'Qualité exceptionnelle. Nous utilisons cette huile pour toute notre gamme cosmétique. Les retours clients sont excellents.'),
  ((SELECT id FROM products WHERE slug='huile-argan-bio'), 'Karim Benali', 'Atlas Distribution', 5, 'Pureté incomparable. Le goût est délicat et l''arôme authentique. Nous commandons régulièrement.'),
  ((SELECT id FROM products WHERE slug='cafe-ethiopien-yirgacheffe'), 'Marie Dupont', 'Café Parisien', 5, 'Le meilleur Yirgacheffe que j''ai goûté. Notes florales magnifiques, nos clients l''adorent.'),
  ((SELECT id FROM products WHERE slug='cafe-ethiopien-yirgacheffe'), 'Thomas Laurent', 'Brûlerie Artisan', 4, 'Très bon café, torréfaction parfaite. Délai de livraison un peu long mais ça vaut l''attente.'),
  ((SELECT id FROM products WHERE slug='safran-premium'), 'Olivier Petit', 'Gastronomia', 5, 'Safran d''exception. Couleur intense, parfum envoûtant. Nos chefs étoilés l''adorent.'),
  ((SELECT id FROM products WHERE slug='vanille-bourbon'), 'Claire Moreau', 'Pâtisserie Royale', 5, 'Gousses magnifiques, longues et charnues. Arôme puissant et persistant. Le top !'),
  ((SELECT id FROM products WHERE slug='miel-thym'), 'Antoine Roux', 'Natural Stores', 5, 'Miel de thym exceptionnel. Goût intense et médicinal. Nos clients en redemandent.'),
  ((SELECT id FROM products WHERE slug='cacao-brut'), 'Julie Fournier', 'Chocolaterie Artisan', 5, 'Cacao d''une grande finesse. Parfait pour nos chocolats noirs grand cru. Très satisfaite.'),
  ((SELECT id FROM products WHERE slug='curcuma-moulu'), 'Nadia Cherif', 'Epices du Monde', 4, 'Couleur vive et arôme puissant. Très bonne qualité, conforme à nos attentes.'),
  ((SELECT id FROM products WHERE slug='spiruline-bio'), 'Marc Lefevre', 'Bio Nutrition', 5, 'Spiruline de très haute qualité. La couleur et l''odeur sont parfaites. Producteur sérieux.')
ON CONFLICT DO NOTHING;


-- ─── ARTICLES (10 articles de blog) ────────────────────────────
INSERT INTO articles (title, slug, excerpt, category, image_url, author_name, author_avatar, published_at, read_time, featured) VALUES
  ('Rencontre avec Fatima Benali, présidente de la coopérative Argan Atlas', 'portrait-fatima-benali-argan-atlas', 'Depuis 20 ans, elle transforme la vie de 80 femmes berbères grâce à l''huile d''argan bio. Histoire d''un combat pour l''indépendance économique.', 'Portraits', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', 'Karim Benali', 'KB', '2024-11-20', 8, true),
  ('Certification bio : le guide complet pour producteurs', 'certification-bio-guide-producteurs', 'Tout ce qu''il faut savoir pour obtenir la certification biologique : démarches, coûts, organismes, délais et pièges à éviter.', 'Agriculture', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80', 'Marie Dupont', 'MD', '2024-11-15', 5, false),
  ('Fairtrade vs Rainforest Alliance : les différences', 'fairtrade-vs-rainforest-alliance', 'Deux labels majeurs du commerce équitable, mais des approches très différentes. Décryptage pour faire le bon choix.', 'Commerce équitable', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80', 'Sophie Martin', 'SM', '2024-11-10', 3, false),
  ('5 gestes pour réduire l''empreinte carbone en cuisine', '5-gestes-reduire-empreinte-carbone-cuisine', 'De la sélection des fournisseurs à la gestion des déchets, découvrez comment agir efficacement dans votre restaurant.', 'Environnement', 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=800&q=80', 'Sophie Martin', 'SM', '2024-11-05', 7, false),
  ('Yirgacheffe Coffee Union : 187 familles éthiopiennes', 'yirgacheffe-coffee-union-ethiopie', 'Portrait d''une coopérative emblématique qui exporte son café d''exception dans le monde entier grâce au commerce direct.', 'Portraits', 'https://images.unsplash.com/photo-1447933601403-0c6688de966e?auto=format&fit=crop&w=800&q=80', 'Karim Benali', 'KB', '2024-10-28', 6, false),
  ('Comment choisir ses fournisseurs bio en 5 étapes', 'choisir-fournisseurs-bio-5-etapes', 'Méthode pratique pour identifier, évaluer et sélectionner les meilleurs fournisseurs biologiques pour votre entreprise.', 'Guides pratiques', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80', 'Marie Dupont', 'MD', '2024-10-20', 4, false),
  ('Permaculture : révolution douce dans nos champs', 'permaculture-revolution-douce-champs', 'La permaculture gagne du terrain. Comment cette approche régénératrice transforme l''agriculture et restaure les sols.', 'Agriculture', 'https://images.unsplash.com/photo-1409172645-11033-4e9e9c7e0c7e?auto=format&fit=crop&w=800&q=80', 'Marie Dupont', 'MD', '2024-10-15', 9, false),
  ('L''agriculture bio peut-elle nourrir 10 milliards d''humains ?', 'agriculture-bio-nourrir-10-milliards', 'Étude des rendements, des coûts et des défis. La transition bio est-elle viable à l''échelle mondiale ?', 'Environnement', 'https://images.unsplash.com/photo-1574323347408-f3bfed9c5e9e?auto=format&fit=crop&w=800&q=80', 'Sophie Martin', 'SM', '2024-10-08', 10, false),
  ('Saffron Fields Iran : la renaissance du safran ancestral', 'saffron-fields-iran-renaissance-safran', 'Dans les hauts plateaux iraniens, une coopérative fait revivre la culture millénaire du safran avec des méthodes bio.', 'Portraits', 'https://images.unsplash.com/photo-1611065842937-8ea27ac07bcd?auto=format&fit=crop&w=800&q=80', 'Karim Benali', 'KB', '2024-10-01', 6, false),
  ('Négociation : obtenir les meilleurs prix bio', 'negociation-obtenir-meilleurs-prix-bio', 'Techniques et stratégies pour négocier efficacement avec vos fournisseurs bio sans sacrifier la qualité.', 'Guides pratiques', 'https://images.unsplash.com/photo-1521791136064-83865001e31c?auto=format&fit=crop&w=800&q=80', 'Marie Dupont', 'MD', '2024-09-25', 5, false)
ON CONFLICT (slug) DO NOTHING;


-- ─── BUCKETS DE STOCKAGE SUPABASE (STORAGE) ──────────────────────
-- Création des 3 buckets nécessaires aux téléversements d'images et documents
INSERT INTO storage.buckets (id, name, public) VALUES ('stores', 'stores', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('verifications', 'verifications', true) ON CONFLICT (id) DO NOTHING;

-- Politiques de lecture publique (SELECT)
DROP POLICY IF EXISTS "Public Read Access for Stores" ON storage.objects;
CREATE POLICY "Public Read Access for Stores" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'stores');

DROP POLICY IF EXISTS "Public Read Access for Products" ON storage.objects;
CREATE POLICY "Public Read Access for Products" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Public Read Access for Verifications" ON storage.objects;
CREATE POLICY "Public Read Access for Verifications" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'verifications');

-- Politiques d'upload et de modification (INSERT, UPDATE)
DROP POLICY IF EXISTS "Allow upload to Stores" ON storage.objects;
CREATE POLICY "Allow upload to Stores" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'stores');

DROP POLICY IF EXISTS "Allow upload to Products" ON storage.objects;
CREATE POLICY "Allow upload to Products" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Allow upload to Verifications" ON storage.objects;
CREATE POLICY "Allow upload to Verifications" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'verifications');

DROP POLICY IF EXISTS "Allow update to Stores" ON storage.objects;
CREATE POLICY "Allow update to Stores" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'stores');

DROP POLICY IF EXISTS "Allow update to Products" ON storage.objects;
CREATE POLICY "Allow update to Products" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Allow update to Verifications" ON storage.objects;
CREATE POLICY "Allow update to Verifications" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'verifications');


-- ═══════════════════════════════════════════════════════════════
-- MESSAGERIE PRODUCTEUR-ACHETEUR
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID REFERENCES auth.users(id),
  participant_2 UUID REFERENCES auth.users(id),
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count_1 INTEGER DEFAULT 0,
  unread_count_2 INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own conversations" ON conversations;
CREATE POLICY "Users see own conversations" ON conversations FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Users create conversations" ON conversations;
CREATE POLICY "Users create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = participant_1);

DROP POLICY IF EXISTS "Users update own conversations" ON conversations;
CREATE POLICY "Users update own conversations" ON conversations FOR UPDATE USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Users see conversation messages" ON messages;
CREATE POLICY "Users see conversation messages" ON messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM conversations WHERE participant_1 = auth.uid() OR participant_2 = auth.uid())
);

DROP POLICY IF EXISTS "Users send messages" ON messages;
CREATE POLICY "Users send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users update own messages" ON messages;
CREATE POLICY "Users update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users upload chat files" ON storage.objects;
CREATE POLICY "Authenticated users upload chat files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "Users read chat files" ON storage.objects;
CREATE POLICY "Users read chat files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chat-files');

-- ═══════════════════════════════════════════════════════════════
-- FIN DU SCRIPT
-- ═══════════════════════════════════════════════════════════════

-- Vérifiez que tout s''est bien exécuté sans erreur.
-- Vous devriez avoir :
--   7 tables : profiles, categories, producers, products, reviews, orders, articles
--   3 buckets de stockage : stores, products, verifications
-- ═══════════════════════════════════════════════════════════════
