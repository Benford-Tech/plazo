-- 15/11/2026 (« voici le message à envoyer pour les réservations de type voiturier »): each parking's valet day-before text.
ALTER TABLE "reminder_settings" ADD COLUMN "valetTemplate" TEXT;
ALTER TABLE "reminder_settings" ADD CONSTRAINT "reminder_settings_valet_template_length"
  CHECK ("valetTemplate" IS NULL OR char_length("valetTemplate") BETWEEN 1 AND 2000);

-- APL Parking's own text, as sent to Plazo (its parkings only, never over a text already set).
WITH apl AS (
  SELECT p."id" FROM "parkings" p JOIN "operators" o ON o."id" = p."operatorId"
  WHERE o."name" ILIKE 'APL Parking%' AND o."name" NOT ILIKE '%(tests)%' AND o."isDemo" = false
), text AS (
  SELECT $apl$(Merci de lire attentivement les informations ci-dessous)
Bonjour {prénom},
Nous vous confirmons votre service voiturier prévu le {date} à {heure}.
🚨 Merci de nous prévenir 10 minutes avant votre arrivée.
📍 Point de rendez-vous
Merci de choisir l'un des emplacements suivants et de nous le préciser en répondant à ce message :
Dépose-minute du Terminal 1 Parking A
Dépose-minute de la gare TGV (train)
Une fois sur place, le voiturier vous contactera directement.
👉 Merci de vous stationner sur les places disponibles situées au fond.
⸻
✈️ Terminal 1
Aéroport de Lyon-Saint-Exupéry
Rue d'Espagne
69124 Colombier-Saugnieu
Coordonnées : 45.71897 N, 5.07910 E
🚆 Gare TGV
Aéroport de Lyon-Saint-Exupéry
2 Rue de Grèce
69124 Colombier-Saugnieu
Coordonnées : 45.72109 N, 5.07469 E
⸻
🔑 Restitution du véhicule
Afin d'assurer une restitution rapide, merci de nous envoyer deux messages :
À votre atterrissage
Une fois sorti de l'aéroport
⏱️ Délai de restitution : 5 à 10 minutes
👉 Cela permet d'éviter tout frais au dépose-minute.
⸻
⏱️ Conditions :
Retard de plus de 30 minutes : supplément de 10 € (service sur rendez-vous)
Prise en charge ou restitution effectuée entre 22h et 6h : supplément de 10 €
Service de dépannage (batterie, etc.) : 5 €
Service sous demande :
• Lavage intérieur + shampouineuse : 50 €
• Rechargement pour véhicules hybrides : 15 €
• Rechargement pour véhicules électriques : 30 €
⸻
Pour toute modification, vous pouvez répondre directement par SMS à ce numéro.
Cordialement,
APL Parking$apl$ AS t
)
INSERT INTO "reminder_settings" ("id", "parkingId", "valetTemplate", "updatedAt")
SELECT 'valet_' || md5(apl."id"), apl."id", text.t, CURRENT_TIMESTAMP FROM apl, text
ON CONFLICT ("parkingId") DO UPDATE SET "valetTemplate" = EXCLUDED."valetTemplate"
  WHERE "reminder_settings"."valetTemplate" IS NULL;
