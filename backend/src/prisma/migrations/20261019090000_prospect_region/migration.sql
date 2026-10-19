-- 19/10/2026 (« classe les prospects par région », choix « Groupés par région » + « De l'aéroport »): the region a
-- prospect is filed under when the platform admin chose it by hand; null: the region of its airport (domain/prospect-regions.ts).
ALTER TABLE "prospects" ADD COLUMN "region" TEXT;
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_region_key" CHECK (
    "region" IS NULL OR "region" IN ('auvergne-rhone-alpes', 'bourgogne-franche-comte', 'bretagne', 'centre-val-de-loire', 'corse', 'grand-est', 'hauts-de-france', 'ile-de-france', 'normandie', 'nouvelle-aquitaine', 'occitanie', 'pays-de-la-loire', 'provence-alpes-cote-d-azur', 'guadeloupe', 'martinique', 'guyane', 'la-reunion', 'mayotte')
);
