-- Supprimer l'image hero uploadée pour revenir au placeholder
DELETE FROM static_content WHERE key = 'home_hero_image';

-- Vérifier la suppression
SELECT key, content FROM static_content WHERE key = 'home_hero_image';
