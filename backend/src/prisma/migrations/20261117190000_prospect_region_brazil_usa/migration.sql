-- 17/11/2026 (« ajoute le Brésil », « Les états unis aussi »): Brazil and the United States join the countries a prospect may be filed under by hand.
ALTER TABLE "prospects" DROP CONSTRAINT "prospects_region_key";
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_region_key" CHECK (
    "region" IS NULL OR "region" IN ('auvergne-rhone-alpes', 'bourgogne-franche-comte', 'bretagne', 'centre-val-de-loire', 'corse', 'grand-est', 'hauts-de-france', 'ile-de-france', 'normandie', 'nouvelle-aquitaine', 'occitanie', 'pays-de-la-loire', 'provence-alpes-cote-d-azur', 'guadeloupe', 'martinique', 'guyane', 'la-reunion', 'mayotte', 'suisse', 'allemagne', 'autriche', 'belgique', 'danemark', 'espagne', 'estonie', 'finlande', 'grece', 'hongrie', 'irlande', 'italie', 'luxembourg', 'norvege', 'pays-bas', 'pologne', 'portugal', 'republique-tcheque', 'roumanie', 'royaume-uni', 'suede', 'bresil', 'etats-unis')
);
