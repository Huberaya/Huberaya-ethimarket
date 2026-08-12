/*
# Correction des images Unsplash (catégories et produits)

1. Catégories : 5 URLs corrigées
2. Produits : 4 URLs corrigées (safran, vanille, cacao, sirop agave)
*/

-- Catégories
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80' WHERE slug = 'fruits-legumes';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80' WHERE slug = 'cosmetiques';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' WHERE slug = 'cereales-graines';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80' WHERE slug = 'miel-sucres';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80' WHERE slug = 'textile';

-- Produits
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1611065842937-8ea27ac07bcd?auto=format&fit=crop&w=800&q=80' WHERE slug = 'safran-premium';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1611080541599-8c6dbde6ed28?auto=format&fit=crop&w=800&q=80' WHERE slug = 'vanille-bourbon';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80' WHERE slug = 'cacao-brut';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80' WHERE slug = 'sirop-agave';
