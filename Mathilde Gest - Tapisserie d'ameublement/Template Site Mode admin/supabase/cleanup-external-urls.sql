-- Script de Nettoyage: Supprimer les URLs Externes
-- Ce script supprime toutes les entrées static_content qui pointent vers des URLs externes
-- (unsplash, placeholder services, etc.)

-- 1. Lister les entrées avant suppression (pour vérification)
SELECT key, content 
FROM static_content 
WHERE content LIKE 'http%' 
  AND content NOT LIKE '%supabase.co%';

-- 2. Supprimer les URLs externes (DÉCOMMENTER POUR EXÉCUTER)
DELETE FROM static_content 
WHERE content LIKE 'http%' 
 AND content NOT LIKE '%supabase.co%';

-- 3. Vérifier les clés restantes
SELECT key, content FROM static_content ORDER BY key;

-- NOTES:
-- - Ce script supprime UNIQUEMENT les URLs qui ne sont PAS de Supabase
-- - Les images uploadées via le mode édition (Supabase Storage) seront préservées
-- - Après exécution, seules les images uploadées par l'admin resteront
