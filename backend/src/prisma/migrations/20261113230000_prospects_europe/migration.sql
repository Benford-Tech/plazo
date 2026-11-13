-- 13/11/2026 (« fais les 3 », the European prospects): the email becomes optional (a prospect without one is called), the
-- parking's site and the language of the mails are kept, the sequence gets its German and English texts, and the
-- European countries join the regions a prospect may be filed under by hand.
ALTER TABLE "prospects" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "prospects" ADD COLUMN "website" TEXT;
ALTER TABLE "prospects" ADD COLUMN "language" TEXT;
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_language_key" CHECK ("language" IS NULL OR "language" IN ('fr', 'de', 'en'));
ALTER TABLE "prospecting_settings" ADD COLUMN "translations" JSONB;

ALTER TABLE "prospects" DROP CONSTRAINT "prospects_region_key";
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_region_key" CHECK (
    "region" IS NULL OR "region" IN ('auvergne-rhone-alpes', 'bourgogne-franche-comte', 'bretagne', 'centre-val-de-loire', 'corse', 'grand-est', 'hauts-de-france', 'ile-de-france', 'normandie', 'nouvelle-aquitaine', 'occitanie', 'pays-de-la-loire', 'provence-alpes-cote-d-azur', 'guadeloupe', 'martinique', 'guyane', 'la-reunion', 'mayotte', 'suisse', 'allemagne', 'autriche', 'belgique', 'danemark', 'espagne', 'estonie', 'finlande', 'grece', 'hongrie', 'irlande', 'italie', 'luxembourg', 'norvege', 'pays-bas', 'pologne', 'portugal', 'republique-tcheque', 'roumanie', 'royaume-uni', 'suede')
);
