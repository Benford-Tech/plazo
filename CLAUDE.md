# Projet : Plazo (nom de travail, à confirmer) — logiciel pour opérateurs de parkings d'aéroport

## Contexte

Logiciel SaaS pour les opérateurs de parkings privés situés autour des aéroports
(parkings avec navette gratuite vers les terminaux, parfois voiturier). Premier marché :
aéroport Lyon Saint-Exupéry. Un premier client (client n°1) est déjà engagé.

Positionnement en deux phases (voir SPEC.md, section 3 bis) :
- **Phase 1 (MVP, à construire maintenant)** : un outil POUR L'OPÉRATEUR, avec sa propre page de
  réservation. Ses clients réservent sur sa page, il gère tout depuis un seul espace.
- **Phase 2 (plus tard)** : place de marché grand public (recherche, comparaison, paiement en ligne,
  commission, plusieurs loueurs). À ne lancer que quand 3 à 5 loueurs sont actifs sur un même aéroport.
  Ne pas la construire pendant le MVP, mais concevoir le modèle de données multi-opérateurs dès le départ.

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
- Voituriers qui déplacent les véhicules (clés confiées) OU clients qui se garent eux-mêmes ? :
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

2. **Plan du parking et affectation des véhicules**
   - Cartographie du parking sur Google Maps (vue satellite) aux dimensions réelles : zones,
     rangées, places, entrée/sortie, point de remise ; génération automatique des places.
   - Affectation de chaque véhicule à un emplacement à l'arrivée.
   - Optimisation : maximiser le nombre de places, ranger par date de retour (aucun véhicule
     bloqué derrière un autre), réduire les trajets du voiturier. Voir SPEC.md, bloc 2.
   - Retrouver un véhicule en quelques secondes (plaque, emplacement, emplacement des clés).
   - Si voiturier : suivi des clés confiées.

3. **Navette au retour**
   - N° de vol retour saisi à la réservation.
   - Suivi de l'heure d'atterrissage réelle (API de suivi de vols, à choisir).
   - File des clients à récupérer, triée par heure d'arrivée, pour le chauffeur (vue mobile).
   - SMS au client au moment de l'atterrissage (point de rendez-vous, délai).

## Liste « plus tard » (le « bien plus »), hors MVP

État des lieux photo, lecture de plaque, tarification dynamique,
connecteurs agrégateurs (Parkos, ParkMundo, Onepark, Free2move…), multi-parkings,
statistiques et facturation. Le paiement en ligne arrive au jalon 3 de la page du loueur,
puis la commission et les reversements en phase 2 (place de marché ouverte aux voyageurs).

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
  passport-jwt, bcrypt, envalid, winston, Swagger (`/api-docs`), tâches de fond pg-boss.
  Docker, déployé sur DigitalOcean comme LoveNest.
- **Base de données** : PostgreSQL + PostGIS, hébergée sur Supabase (région Paris `eu-west-3`).
- **Espace pro (`admin/`)** : Vite + React 18 + shadcn/ui (Tailwind 3), React Router, React Query,
  sonner. Héberge l'espace pro du loueur, puis sa page de réservation (jalon 3).
- **App mobile (`mobile/`, jalon 6)** : Flutter, architecture de `lovenest-frontend` (bloc, auto_route,
  get_it, retrofit + dio, freezed, easy_localization, OneSignal pour les notifications, Codemagic
  pour les builds). Deux apps à terme (« pro » et « voyageur ») : un seul projet d'abord, deux
  parcours bien séparés, puis deux points d'entrée (flavors).
- Cartographie : Google Maps Platform. SMS et email : Brevo.
- Suivi de vols : AirLabs (offre gratuite) derrière une interface interchangeable, repli AeroDataBox.

Contraintes : application web responsive, application mobile native iOS et Android,
interface en français, données personnelles clients → RGPD (minimiser, durée de conservation).
Le nom du produit doit rester dans UN seul fichier de configuration (il peut encore changer).

## Structure du dépôt

- `product.json` : nom du produit et libellés de marque (seul endroit où le nom apparaît ;
  lu par le serveur et l'espace pro).
- `backend/` : API REST. Les routes du personnel du loueur sont sous `/internal/...`
  (`StaffAuthMiddleware`, jetons stockés en base et révocables), comme les routes staff de LoveNest.
- `admin/` : espace pro (et plus tard la page de réservation publique).
- `mobile/` : app Flutter (à venir).

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
- `npm run dev` : serveur de développement (port 3005, docs sur `/api-docs`)
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`
- `npm run prisma:migrate -- --name xxx` : nouvelle migration ; `npm run prisma:deploy` : appliquer
- `npm run seed:operator -- --operator … --capacity … --name … --email … --password …`

Dans `admin/` :
- `npm run dev` (port 8080), `npm test`, `npm run lint`, `npm run build`

## Règles de travail

- **Toujours un design avant le code** pour tout changement d'interface : proposer une ou plusieurs
  directions, attendre le choix de Joanny, puis implémenter (« Design : propose, je tranche et tu
  implémentes », 01/10/2026). Un bug, une traduction ou une route serveur se corrigent directement.
- Livrer par petites étapes utilisables par le client n°1, montrer chaque étape.
- Ne pas ajouter de fonctionnalité hors périmètre sans demande explicite.
- Code et commentaires en anglais, interface et documentation utilisateur en français.
