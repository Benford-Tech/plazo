# Projet : Plazo (nom de travail, à confirmer) — logiciel pour opérateurs de parkings d'aéroport

## Contexte

Logiciel SaaS pour les opérateurs de parkings privés situés autour des aéroports
(parkings avec navette gratuite vers les terminaux, parfois voiturier). Premier marché :
aéroport Lyon Saint-Exupéry. Un premier client (client n°1) est déjà engagé.

**Plazo est une plateforme de réservation** (décision du 01/10/2026, qui remplace le découpage en
deux phases) : la place de marché grand public fait partie du MVP. Deux faces, un seul produit :
- **Site Plazo pour les voyageurs** (à la marque Plazo) : recherche par aéroport et dates, comparaison
  des parkings partenaires (prix total, filtres, avis), fiche parking, réservation et **paiement en ligne**
  (Stripe Connect : Plazo encaisse, prélève sa commission, reverse le loueur). Voir SPEC.md, section 3 bis.
- **Espace pro pour les loueurs** : planning, plan du parking, navette, import des autres canaux
  (blocs 1 à 3 ci-dessous), plus leur fiche Plazo, leurs tarifs et leurs reversements.
- À valider avec un juriste / expert-comptable **avant la mise en ligne du paiement** : statut de la
  plateforme, TVA sur la commission, mandat de facturation, CGU/CGV.
- Le site doit être utile même avec un seul loueur au lancement (client n°1) : les pages aéroport
  et loueur servent aussi au référencement.

Le métier de ces opérateurs :
- recevoir des réservations par plusieurs canaux (site propre, comparateurs, téléphone) ;
- accueillir le client à l'aller, garer le véhicule (le client ou un voiturier), conduire le client au terminal en navette ;
- récupérer le client au retour (aujourd'hui souvent : le client appelle le parking à l'atterrissage, attentes parfois longues) ;
- restituer le véhicule, encaisser, gérer les litiges (rayures, dégâts) ;
- parfois des services annexes : lavage, plein, recharge électrique.

## Client n°1 — À COMPLÉTER AVANT DE CODER

- Nom / parking :
- Capacité (places) :
- Navettes / chauffeurs :
- Voituriers qui déplacent les véhicules (clés confiées) OU clients qui se garent eux-mêmes ? : voituriers (01/10/2026)
- Sol du parking : gravier, sans marquage (à confirmer sur place)
- Réservations par jour (moyenne / pic) :
- Canaux de réservation actuels :
- Outil actuel (logiciel, Excel, papier) :
- Sa douleur n°1 (avec ses mots) :
- Prix convenu et date attendue de la première version :

## Périmètre du MVP : trois blocs

Ne construire QUE ce qui règle la douleur n°1 du client.

1. **Réservations**
   - Saisie manuelle (téléphone, comptoir) + import des réservations des autres canaux
     (au départ : import CSV / copier-coller de mails de confirmation ; connecteurs plus tard).
   - Page de réservation propre à l'opérateur (formulaire simple, confirmation par mail/SMS).
   - Vue planning : arrivées et retours du jour, taux d'occupation, alerte de surréservation
     calculée sur la capacité réelle.
   - Fiche réservation : client, téléphone, plaque, dates/heures, n° de vol retour, nb de passagers, statut.

2. **Plan du parking et affectation des véhicules** (direction P-A du 03/10/2026 : trois vues
   Plan · Occupation · Planning des places dans l'onglet « Parking » ; les étapes Plan et Occupation sont livrées)
   - Cartographie du parking sur la photo aérienne IGN aux dimensions réelles : zones,
     rangées, places, entrée/sortie, point de remise ; génération automatique des places.
   - Affectation de chaque véhicule à un emplacement à l'arrivée.
   - Optimisation : maximiser le nombre de places, ranger par date de retour (aucun véhicule
     bloqué derrière un autre), réduire les trajets du voiturier. Voir SPEC.md, bloc 2.
     Décisions du 04/10/2026 : **T-A** disposition « Voiturier · files depuis le bord » (`valetEdge` : une allée
     de service le long d'un bord, files perpendiculaires aussi profondes que le terrain, sans allée intérieure ;
     `mode: 'edge'` dans `layout.ts`, profondeur max `edgeMaxFiles`) et **Z-A** zones de séjour par rang dans la file
     (`ParkingSpot.depth`, `fileLength`, `stayClass` court / moyen / long ; seuils `stayShortMaxNights` 3 et
     `stayMediumMaxNights` 8 dans les réglages du plan) : suggestions et pré-affectation prennent d'abord la zone
     de la durée du séjour, puis la zone voisine.
   - Retrouver un véhicule en quelques secondes (plaque, emplacement, emplacement des clés).
   - Si voiturier : suivi des clés confiées.

3. **Navette au retour**
   - N° de vol retour saisi à la réservation.
   - Suivi de l'heure d'atterrissage réelle (API de suivi de vols, à choisir).
   - File des clients à récupérer, triée par heure d'arrivée, pour le chauffeur (vue mobile).
   - SMS au client au moment de l'atterrissage (point de rendez-vous, délai).
   - Décisions du 04/10/2026 : **V-A** fiche véhicule complète (modèle, couleur, plaque, places passagers, en service /
     hors service, chauffeur habituel ; `ShuttleVehicle.seats/inService/driverId`, Réglages web et Plus › Véhicules de
     navette dans l'app pro ; au départ d'un trajet, les places limitent les passagers et un véhicule hors service n'est
     pas proposé) ; **T-A** trajets dans les deux sens (`ShuttleTrip.direction` `pickup` vers l'aéroport pour les retours,
     `dropoff` vers le terminal avec les clients arrivés, `GET /internal/shuttle/departures`, fin d'une dépose = statut
     « Parti en navette ») ; **S-A** navette en direct pour le voyageur du jour d'arrivée au jour du retour
     (`GET /public/bookings/:ref/shuttles` : navettes du parking en cours, véhicule, prénom, position, distance au parking
     ou au point de rendez-vous, la sienne repérée ; bloc « Navette » de la réservation dans l'app, interrogé toutes les 12 s ;
     le site n'a pas ce bloc : le SMS d'atterrissage renvoie simplement vers la réservation).
   - Décisions du 05/10/2026 : **V-A** véhicule du jour (`Staff.vehicleId/vehicleSetAt`, `PATCH /internal/staff/me/vehicle`,
     409 `vehicle_taken` ; écran « Mon véhicule aujourd'hui » après le poste Chauffeur puis Plus › Mon véhicule ; présélectionné
     au départ d'un trajet ; un autre poste le rend ; visible du gérant dans Équipe) ; **D-A** dessertes (`shuttle_stops` par
     parking : gare TGV, hôtel… avec coordonnées et consignes ; l'aéroport reste la desserte intégrée = point de rendez-vous ;
     `ShuttleTrip.stopId` + instantané, `Reservation.stopId` ; routes `/internal/shuttle/stops` ; puces « Desserte » au départ
     d'un trajet, bloc « Dessertes de la navette » dans Réglages web, champ « Desserte » d'une réservation) ; **P-A** navettes en
     direct pour toute l'équipe (`GET /internal/shuttle/live` : parking, dessertes, trajets avec position, distance à la desserte
     et au parking ; carte IGN et lignes en tête de l'écran Navette, bandeau sur Aujourd'hui, toutes les 12 s) ; **N-A** pushs
     OneSignal (`Staff.notifyShuttles`, réglage « Navettes » : départ et retour d'une navette, sauf au chauffeur ; au voyageur
     « Votre navette est partie » puis « Votre navette est là » à 150 m de la desserte, via `traveller_devices` enregistrés par
     `PUT /public/bookings/:ref/devices` avec le jeton de la réservation ; app voyageur = seconde app OneSignal,
     `ONESIGNAL_TRAVELLER_APP_ID/_REST_API_KEY`, à défaut celles du personnel).

## Liste « plus tard » (le « bien plus »), hors MVP

État des lieux photo, lecture de plaque, tarification dynamique,
connecteurs agrégateurs (Parkos, ParkMundo, Onepark, Free2move…), multi-parkings,
statistiques et facturation (hors commission et reversements, qui font partie du MVP).

## Concurrence à connaître avant de coder

- **ParkFlow** : système de gestion de réservations spécialisé parkings d'aéroport
  (agrège les canaux, intégrations paiement, facturation, barrières). À comparer : tarifs,
  ce qu'il ne fait pas (suivi de vol, file de navettes au retour, plan des places).
- Autres : ParkAlto (hors-aéroport), O-Valet (voiturier, suivi de vols), netPark, SMS Valet.

## Stack — DÉCIDÉE : celle de LoveNest (1er octobre 2026)

Plazo reprend la stack et les conventions des dépôts `lovenest-backend`, `lovenest-admin` et
`lovenest-frontend` (décision du 01/10/2026 : « tout LoveNest »).

- **Serveur (`backend/`)** : Express 5 + TypeScript, Prisma 6 (schéma `src/prisma/schema.prisma`,
  client généré dans `src/generated/prisma-client`), services typedi, DTO class-validator,
  passport-jwt, bcrypt, envalid, winston, Swagger (`/api/docs`). Toutes les routes sont sous `/api`.
- **Hébergement : Vercel** (décision du 01/10/2026 : « pas DigitalOcean, plutôt Vercel »), région
  Paris `cdg1`. **Un seul projet Vercel avec trois services** (`vercel.json` à la racine) sur un même
  domaine : `backend` sur `/api/*`, `admin` sur `/pro/*`, `site` (Next.js) sur le reste ; le site appelle
  l'API côté serveur par une liaison (`BACKEND_URL`). L'API tourne dans une seule fonction
  (`backend/index.js`, qui charge le code compilé dans `lib/`).
  Conséquences : pas de pg-boss (pas de processus permanent), les tâches planifiées sont des routes
  `/internal/cron/...` appelées par Vercel Cron (`vercel.json` à la racine, protégées par `CRON_SECRET` ; Vercel Hobby
  n'accepte que des crons quotidiens, les lectures rafraîchissent aussi les vols) ;
  pas de fichiers de logs (winston écrit dans la console, que Vercel collecte).
- **Base de données** : PostgreSQL + PostGIS, hébergée sur **Neon** via l'intégration Vercel (base `Plazo-db`,
  02/10/2026, à la place de Supabase). Variables injectées par Vercel : `POSTGRES_PRISMA_URL` (connexion
  mutualisée, utilisée par l'API), `DATABASE_URL_UNPOOLED` (directe, pour les migrations).
- **Espace pro (`admin/`)** : Vite + React 18 + shadcn/ui (Tailwind 3), React Router, React Query,
  sonner. Héberge l'espace pro du loueur, puis sa page de réservation (jalon 3).
- **App mobile (`mobile/`, jalon 6)** : Flutter, architecture de `lovenest-frontend` (bloc, auto_route,
  get_it, retrofit + dio, freezed, easy_localization, OneSignal pour les notifications, Codemagic
  pour les builds). Deux apps à terme (« pro » et « voyageur ») : un seul projet d'abord, deux
  parcours bien séparés, puis deux points d'entrée (flavors). **Décision du 04/10/2026 : app pro complète, équivalente
  à l'espace pro web** (A-B : deux apps « Plazo » et « Plazo Pro » sur un seul projet ; N-A : quatre onglets
  Aujourd'hui · Réservations · Parking · Plus), livrée par étapes : 1 réservations (fait), 2 flavors et onglets (fait : `--flavor pro --dart-define=APP_FLAVOR=pro`,
  `ProShellPage` à quatre onglets sous `/pro`, icône Pro brun foncé ; iOS : second schéma Xcode à créer),
  **R-C « Poste du jour » (04/10/2026)** : chaque membre choisit son poste (gérant, accueil, chauffeur, voiturier) parmi ceux
  que son rôle couvre (`allowedPosts` dans `domain/roles.ts`, `Staff.post/postSetAt`, `PATCH /internal/staff/me/post`) ; les quatre
  onglets suivent le poste (`core/helpers/posts.dart` : chauffeur Navette · Arrivées · Retours · Plus, voiturier Parking ·
  Aujourd'hui · Places · Plus, accueil et gérant Aujourd'hui · Réservations · Parking · Plus), les droits restent ceux du rôle ;
  le gérant voit le poste du jour dans Équipe (web et app). Étapes de l'app pro :
  3 planning des places (fait : `/pro/planning-places`, feature `pro_spot_planning`), 4 équipe / compte / réglages (fait :
  `/pro/equipe`, `/pro/compte`, `/pro/reglages` avec le canal SMS, feature `pro_settings` ; le point de rendez-vous reste sur le web),
  5 Sur Plazo (fiche, tarifs, Stripe), 6 inscription.
- Cartographie : photo aérienne IGN BD ORTHO et Plan IGN (MapLibre + Terra Draw sur le web, `flutter_map` dans l'app) ; Google Maps
  seulement pour les liens d'itinéraire, ses conditions interdisant de tracer ou d'analyser sur son imagerie. SMS et email : Brevo.
- Suivi de vols : AeroDataBox par défaut, AirLabs au choix (`FLIGHT_TRACKING_PROVIDER`), derrière une interface
  interchangeable ; un seul fournisseur à la fois, une requête par vol, pas de repli automatique.

Contraintes : application web responsive, application mobile native iOS et Android,
interface en français, données personnelles clients → RGPD (minimiser, durée de conservation).
Le nom du produit doit rester dans UN seul fichier de configuration (il peut encore changer).

## Structure du dépôt

- `vercel.json` : le projet Vercel et ses trois services (`backend` sur `/api`, `admin` sur `/pro`,
  `site` sur le reste), la liaison site → API et le Cron.
- `product.json` : nom du produit et libellés de marque (seul endroit où le nom apparaît ;
  lu par le serveur, l'espace pro et le site).
- `backend/` : API REST sous `/api` (`index.js` = point d'entrée Vercel). Les routes du personnel du loueur
  sont sous `/api/internal/...` (`StaffAuthMiddleware`, jetons stockés en base et révocables), comme les
  routes staff de LoveNest ; celles du site voyageurs sous `/api/public/...`.
- `admin/` : espace pro, servi sous `/pro`. L'onglet « Parking » a quatre volets : `/parking/plan/:step` (bloc 2, étape
  « Plan » : terrain, zones, places, repères, tracés sur la photo IGN avec le moteur de l'estimateur `src/lib/capacity/*`,
  places numérotées par `src/lib/plan/numbering.ts`, routes `/api/internal/parkings/:id/plan…`, tables `parking_plans` et
  `parking_spots`), `/parking/occupation` (étape « Occupation », 04/10/2026 : plan en couleurs, arrivées à placer avec
  place proposée, recherche par plaque / nom / référence, crochet des clés ; routes `/api/internal/parkings/:id/occupation…`
  et `POST /api/internal/reservations/:id/spot` ; champs `Reservation.spotId` et `keyHook`), `/parking/planning` (étape
  « Planning des places ») et `/parking/reglages`.
  L'onglet « Parking » est ouvert à tout le personnel (`reservations:view`) ; Plan et Réglages restent aux gérants. L'espace « Plateforme » du super admin (`PLATFORM_ADMIN_EMAILS`) est sous
  `/pro/plateforme` (pages `src/pages/platform/*`, routes serveur `/api/internal/platform/...` protégées par
  `PlatformAdminMiddleware`) ; l'inscription libre des loueurs sous `/pro/inscription`.
- `site/` : site Plazo voyageurs (Next.js), servi à la racine du domaine.
- `mobile/` : app Flutter (jalon 6 commencé) : un seul projet, deux apps (`AppConstants.flavor`) : « Plazo », onglets
  Rechercher / Mes réservations / Plus pour le voyageur (mêmes chemins que le site : `/:airport/recherche`, `/:airport/:parking`, `/ma-reservation…`), et le
  parcours pro (`/pro…`, comptes du personnel ; `/pro/plan` et `/pro/parking` (Occupation) pour le bloc 2 ; `/pro/reservations…` : liste,
  recherche, fiche avec statuts, saisie, import d'un mail, feature `pro_reservations`, 04/10/2026) **dans Plazo Pro seulement**
  (décision du 04/10/2026 : l'app voyageur n'embarque plus l'espace pro, et Plazo Pro aucun écran voyageur), dont le plan du parking pour les gérants
  (`/pro/plan`, M-A + rectangle auto du 04/10/2026 : adresse ou GPS, coins sur la photo IGN, génération côté serveur
  par `/plan/estimate` et `/plan/generate`) ; paiement par la feuille native Stripe
  (`flutter_stripe`) ; architecture de `lovenest-frontend`
  (`lib/src/features/<x>/{data,domain,presentation}`, `di/`, `core/`), textes dans `assets/l10n/fr-FR.json`,
  nom du produit recopié depuis `product.json` par `tool/sync_product.dart`, builds par `codemagic.yaml` (racine du dépôt, `working_directory: mobile`).
  Voir `mobile/README.md`.

## Conventions (reprises de LoveNest)

- Serveur : une route `xxx.route.ts` (classe `Routes`, JSDoc Swagger) → un contrôleur
  (`catchAsync`, `http-status`) → un service typedi qui porte les règles et les contrôles d'accès.
  Erreurs : `HttpException(status, message, code)` ; le corps d'erreur est `{ message, code?, fields? }`,
  et les clients traduisent `code` et `fields` en français.
- Toute donnée est filtrée par `operatorId` du personnel connecté (multi-opérateurs dès le départ).
- Prisma : ids `cuid()`, champs camelCase, tables snake_case au pluriel (`@@map`), PostGIS en
  `Unsupported("geometry(...)")` lu et écrit en SQL brut ; les contraintes CHECK s'ajoutent à la main
  dans la migration.
- Espace pro : `src/lib/api.ts` (`adminApi`), `AuthContext`, pages `XxxPage.tsx`, composants shadcn
  dans `components/ui`, textes dans `src/lib/fr.ts`.
- Tests serveur : Jest + supertest contre une vraie base de test (`DATABASE_URL_TEST`, nom en `_test`
  obligatoire). Tests espace pro : Vitest + Testing Library.

## Commandes

Dans `backend/` :
- `npm run dev` : serveur de développement (port 3005, API sous `/api`, docs sur `/api/docs`)
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`
- `npm run prisma:migrate -- --name xxx` : nouvelle migration ; `npm run prisma:deploy` : appliquer
- `npm run seed:operator -- --operator … --capacity … --name … --email … --password …`

Dans `admin/` :
- `npm run dev` (http://localhost:8080/pro/, relaie `/api` vers le port 3005), `npm test`, `npm run lint`, `npm run build`

Dans `mobile/` (SDK Flutter stable hors du dépôt) :
- `flutter pub get`, `dart run build_runner build` (après un changement de modèle, d'état, de client ou de route)
- `flutter analyze`, `flutter test`
- `flutter run --dart-define=API_BASE_URL=http://localhost:3005/api` (API locale) ; `flutter build web` pour un essai navigateur
- `dart run tool/sync_product.dart` (après un changement de `product.json` ; `--check` en CI)

Dans `site/` :
- `npm run dev` (port 3000, `BACKEND_URL` par défaut http://localhost:3005), `npm test`, `npm run lint`,
  `npm run typecheck`, `npm run build`

## Direction visuelle — DÉCIDÉE (1er octobre 2026)

Canevas de référence : https://claude.ai/artifact/6ezoCDyLXFNwhAH5ZWUf4u (rangée « Retenu »).

- **Espace pro (web, `admin/`)** : direction **B « Tableau des vols »** — fond noir `#0B0B0C`,
  jaune `#F5C400` pour l'action et les heures, texte `#F3F3F0`, gris `#A8A8A2`, filets `#3A3A38` ;
  Archivo Narrow (capitales pour les titres) + JetBrains Mono (heures, chiffres, vols) ; angles vifs.
  Avec deux emprunts à C : **arrivées et retours en deux colonnes séparées**, et les **plaques**
  dessinées comme une plaque française (bande bleue `#1F3FA6` « F », fond blanc).
- **Site Plazo voyageurs (web)** : direction **M3 « Plazo voyageur »** (choix du 01/10/2026), le même
  univers que l'app voyageur : **en-tête orange easyJet `#FF6600`** (T-A, 03/10/2026, à la place du prune),
  bandeau photo sous un voile orange, pied de page orange foncé `#E65C00`, titres en Playfair Display italique,
  Inter pour le texte, accent **orange léger `#FF8A3D`** (V-A, 03/10/2026, à la place du violet), brun foncé
  `#2C1A0E` pour les surfaces sombres, bouton principal en dégradé orange léger → pêche, cartes arrondies (16 px),
  plaques façon C. **Plus aucun violet ni prune.** Maquettes : artboards `Plazo-M3-*` du canevas (couleurs d'origine).
- **App Plazo Pro (Flutter, flavor `pro`, décision du 04/10/2026)** : les couleurs de l'espace pro web, direction B : noir
  `#0B0B0C`, jaune `#F5C400`, texte `#F3F3F0`, gris `#A8A8A2`, filets `#3A3A38`, angles vifs, Archivo Narrow pour les
  titres et JetBrains Mono pour les heures et les chiffres. Les couleurs, rayons et polices sont des constantes choisies
  à la compilation selon le flavor (`AppColors`, `AppRadius`, `AppFonts` dans `shared/theme/theme.dart`). Écran de connexion :
  direction **C-C « Tableau des vols »** (04/10/2026) : grille d'affichage sous un voile noir, formulaire dans une carte bordée de
  jaune ; rien ne nomme un parking avant la connexion (l'app sert plusieurs parkings).
- **App Plazo voyageur (Flutter)** : direction **D « style Thempo »** — **en-tête orange easyJet `#FF6600`** (T-A,
  03/10/2026, à la place du prune), brun foncé `#2C1A0E` pour les textes forts et les surfaces sombres, accent
  **orange léger `#FF8A3D`** (V-A, 03/10/2026, à la place du violet), pêche `#f0a36b` pour le temps fort,
  dégradé orange léger → pêche sur les actions principales, Playfair Display (titres) + Inter, cartes arrondies ; plaques façon C aussi.
  Icônes (choix H-B du 03/10/2026) : icônes pleines arrondies (Material « rounded ») posées sur des
  tuiles au dégradé orange léger → pêche (`IconTile`) ; onglets loupe / billet / « ··· ».
- **Logo (choix E-A du 03/10/2026)** : le panneau de parking, « Plazo » en Inter 800 blanc dans un rectangle
  **orange easyJet `#FF6600`** aux angles arrondis (O-D, 03/10/2026) ; symbole = le panneau réduit au « P » ;
  pour le site et l'espace pro. **L'app mobile
  garde le logo L-B** (P Playfair + avion en papier, mot-symbole italique) pour son icône et son en-tête
  (`brand/app/`) ; depuis le 03/10/2026 (choix O-A + O-B, puis T-A) l'avion est orange easyJet `#FF6600`,
  l'en-tête de l'app affiche le carré blanc avec P et avion orange, et l'icône d'app est orange plein (P blanc,
  avion brun foncé). Fichiers et règles dans `brand/README.md`.

## Règles de travail

- **Toujours un design avant le code** pour tout changement d'interface : proposer une ou plusieurs
  directions, attendre le choix de Joanny, puis implémenter (« Design : propose, je tranche et tu
  implémentes », 01/10/2026). Un bug, une traduction ou une route serveur se corrigent directement.
- Livrer par petites étapes utilisables par le client n°1, montrer chaque étape.
- Ne pas ajouter de fonctionnalité hors périmètre sans demande explicite.
- Code et commentaires en anglais, interface et documentation utilisateur en français.
