-- Seed Data for Mathilde Gest Website
-- Run this in Supabase SQL Editor to populate your site with test content

-- 1. Static Content (Text)
insert into static_content (key, content) values
('home_hero_title', 'Bienvenue chez Mathilde Gest'),
('home_hero_subtitle', 'Artisan Tapissier & Créatrice d''Atmosphères à Metz'),
('home_featured_title', 'Dernières Réalisations'),
('categories_title', 'Nos Créations'),
('categories_subtitle', 'Explorez nos différentes collections de tapisserie d''ameublement'),
('cat_chairs', 'Fauteuils'),
('cat_chairs_desc', 'Pièces uniques restaurées avec soin'),
('cat_sofas', 'Canapés'),
('cat_sofas_desc', 'Confort et élégance réunis'),
('cat_chairs_dining', 'Chaises'),
('cat_chairs_dining_desc', 'Élégance pour votre salle à manger'),
('cat_curtains', 'Rideaux & Voilages'),
('cat_curtains_desc', 'Sur mesure pour vos fenêtres'),
('cta_title', 'Un Projet en Tête?'),
('cta_text', 'Contactez-moi pour discuter de votre projet de restauration ou de création sur mesure.'),
('presentation_title', 'L''Atelier Mathilde Gest'),
('presentation_bio_p1', 'Installée au cœur de Metz, je redonne vie à vos sièges et fauteuils avec passion. Mon approche mêle techniques traditionnelles et audace moderne.'),
('presentation_bio_p2', 'Chaque pièce est unique, travaillée avec des tissus d''éditeurs sélectionnés pour leur qualité et leur impact visuel.'),
('cat_fauteuils_image', 'assets/category-fauteuils.jpg'),
('cat_canapes_image', 'assets/category-canapes.jpg'),
('cat_chaises_image', 'assets/category-chaises.jpg'),
('cat_rideaux_image', 'assets/category-rideaux.jpg'),
('piece_month_title', 'La Pièce du Mois'),
('piece_month_name', 'Fauteuil Voltaire - Collection "Jungle Urbaine"'),
('piece_month_desc', 'Restauration complète en crin végétal. Tissu velours imprimé feuillage exotique. Finition double passepoil contrasté.'),
('contact_title', 'Retrouvez l''Atelier'),
('contact_intro', 'N''hésitez pas à me contacter pour discuter de votre projet de restauration ou de création sur mesure.'),
('contact_address', '12 Rue des Clercs, 57000 Metz'),
('contact_phone', '06 12 34 56 78'),
('contact_email', 'atelier@mathildegest.fr')
on conflict (key) do update set content = excluded.content;

-- 2. Products (Catalog)
-- Images are set to null so they will show the placeholder default in JS
insert into products (title, description, price, category, image_url) values
('Fauteuil Voltaire Vintage', 'Restauration complète avec tissu à motifs floraux audacieux', 450.00, 'fauteuils', null),
('Fauteuil Bergère', 'Tapisserie raffinée avec velours coloré', 520.00, 'fauteuils', null),
('Canapé 3 places', 'Remise à neuf complète avec tissu artisanal', 890.00, 'canapes', null),
('Canapé d''angle moderne', 'Restauration avec tissu géométrique vibrant', 1200.00, 'canapes', null),
('Chaise médaillon', 'Ensemble de 4 chaises style Louis XVI', 280.00, 'chaises', null),
('Chaise scandinave', 'Rénovation avec tissu moderne coloré', 120.00, 'chaises', null),
('Rideaux sur mesure', 'Confection de rideaux avec tissus d''éditeur', 350.00, 'rideaux', null),
('Voilages brodés', 'Création de voilages légers et élégants', 180.00, 'rideaux', null)
on conflict (id) do nothing;
