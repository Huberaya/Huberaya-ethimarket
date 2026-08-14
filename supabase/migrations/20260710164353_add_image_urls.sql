/*
# Ajout des images Unsplash aux produits et catégories

1. Modifications
- `products` : ajout colonne `image_url` (text)
- `categories` : ajout colonne `image_url` (text)

2. Mise à jour des données existantes avec des URLs Unsplash
*/

-- Ajout des colonnes images
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url text;

-- Images des catégories (Unsplash)
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' WHERE slug = 'huiles-graisses';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80' WHERE slug = 'epices-herbes';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80' WHERE slug = 'cafe-the-cacao';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1490818387583-1d2d933e2c2d?auto=format&fit=crop&w=600&q=80' WHERE slug = 'fruits-legumes';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=600&q=80' WHERE slug = 'cereales-graines';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1587049352846-b01740690b73?auto=format&fit=crop&w=600&q=80' WHERE slug = 'miel-sucres';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80' WHERE slug = 'cosmetiques';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80' WHERE slug = 'textile';

-- Images des produits (Unsplash)
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80' WHERE slug = 'huile-argan-bio';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80' WHERE slug = 'cafe-ethiopien-yirgacheffe';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587132137056-bfbf0166af86?auto=format&fit=crop&w=800&q=80' WHERE slug = 'safran-premium';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584196112476-7b9f7a69e98c?auto=format&fit=crop&w=800&q=80' WHERE slug = 'vanille-bourbon';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80' WHERE slug = 'quinoa-bio';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=800&q=80' WHERE slug = 'cacao-brut';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587049352846-b01740690b73?auto=format&fit=crop&w=800&q=80' WHERE slug = 'miel-thym';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80' WHERE slug = 'the-vert-sencha';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80' WHERE slug = 'spiruline-bio';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80' WHERE slug = 'huile-coco-bio';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80' WHERE slug = 'curcuma-moulu';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80' WHERE slug = 'sirop-agave';
