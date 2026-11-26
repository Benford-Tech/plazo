-- 26/11/2026 (after yourvaletbrothers.com): a black and white look for a parking's site.
ALTER TABLE "operator_sites" DROP CONSTRAINT "operator_sites_theme";
ALTER TABLE "operator_sites"
  ADD CONSTRAINT "operator_sites_theme" CHECK ("theme" IN ('simple', 'showcase', 'night', 'postcard', 'home', 'express', 'park', 'valet', 'prestige'));
