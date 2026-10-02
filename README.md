# Plazo (nom de travail)

Logiciel pour les opérateurs de parkings privés d'aéroport : réservations, plan du parking
et affectation des véhicules, navette au retour.

- Cadrage du projet (contexte, périmètre du MVP, règles de travail) : [CLAUDE.md](CLAUDE.md)
- Spécification détaillée (rôles, blocs fonctionnels, modèle de données, jalons) : [SPEC.md](SPEC.md)

## État d'avancement

- [x] **Jalon 1 — Socle** (stack LoveNest) : comptes du personnel, rôles (gérant, agent d'accueil,
  chauffeur, voiturier), opérateur et parking, capacité et marge de sécurité, base PostgreSQL + PostGIS,
  API documentée, espace pro.
- [ ] **Jalon 2 — Réservations** (en cours) : fait — saisie manuelle, planning du jour (arrivées et retours,
  7 nuits), contrôle de capacité par nuit avec surréservation forcée et tracée, statuts, fiche et recherche,
  import des mails de confirmation Allopark par copier-coller (doublons refusés).
  Reste : lecteurs Parkos, Onepark… (un exemple de mail par comparateur), import CSV si besoin.
- [ ] **Jalon 3a — Fiche et tarifs** (fait) : dans l'espace pro, onglet « Sur Plazo » : « Ma fiche » (présentation,
  services, annulation, photos par adresse, aperçu en direct, mise en ligne refusée tant qu'il n'y a pas de tarifs)
  et « Mes tarifs » (forfaits par nombre de jours, prix du jour supplémentaire, simulation du prix payé).
  Reste : envoi de photos depuis l'ordinateur.
- [x] **Outil interne — Estimateur de capacité** (réservé à la plateforme, `PLATFORM_ADMIN_EMAILS`) : dans l'espace
  pro, entrée « Outil interne » (`/pro/outil/capacite`). Trois étapes sur la photo aérienne de l'IGN (BD ORTHO) :
  repérer le terrain (adresse ou « latitude, longitude », parcelles cadastrales cliquées, recoupe avec les parkings
  BD TOPO, sommets à la souris, cote mesurée pour caler l'échelle), découper en zones (zones de stationnement,
  parties exclues : bâtiment, accueil, voie navette, arbre, poteau), estimer la capacité (clients garés seuls,
  voiturier en files de 2 à 4, voiturier en files de 5 ; fourchette à annoncer, plafond théorique, export GeoJSON),
  plus un contrôle sur la photo (voitures comptées à la main). Études enregistrées automatiquement (« Mes études »).
  Surfaces et longueurs en Lambert-93.
- [ ] Jalon 3b — Site Plazo voyageurs (Next.js, direction M3)
- [ ] **Jalon 3c — Paiement en ligne** (en cours, **mode test Stripe**) : fait — paiement par carte sur Stripe Checkout en
  deux étapes (place tenue 30 minutes), confirmation au retour et par webhook, expiration, remboursement intégral à
  l'annulation gratuite (voyageur ou loueur), **Plazo encaisse, puis reverse la part du loueur le lendemain de la fin du
  séjour** (ou selon le calendrier choisi), compte Stripe Express du loueur (routes seulement). Reste : écrans de l'espace
  pro (connexion Stripe, calendrier de reversement), validation juridique avant le paiement réel.
- [ ] Jalon 4 — Cartographie et affectation
- [ ] Jalon 5 — Navette au retour
- [ ] Jalon 6 — App mobile (Flutter)
- [ ] Jalon 7 — Pilote chez le client n°1

## Lancer en local

Prérequis : Node.js 22, PostgreSQL 16 avec l'extension PostGIS.

```bash
# Serveur (API sur http://localhost:3005/api, documentation sur /api/docs)
cd backend
cp .env.example .env          # adapter les URL de base de données et SECRET_KEY
npm install
npm run prisma:deploy         # crée les tables
npm run seed:operator -- --operator "Mon parking" --capacity 250 \
  --name "Prénom Nom" --email gerant@exemple.fr --password "mot-de-passe-solide"
npm run dev

# Espace pro (http://localhost:8080/pro/ ; /api est relayé vers le serveur local)
cd ../admin
cp .env.example .env
npm install
npm run dev

# Site voyageurs (http://localhost:3000)
cd ../site
cp .env.example .env.local    # BACKEND_URL=http://localhost:3005
npm install
npm run dev
```

Le compte gérant ainsi créé ajoute ensuite son équipe depuis la page « Équipe ».

Tests : `npm test` dans `backend/` (base `DATABASE_URL_TEST`, dont le nom doit finir par `_test` ;
elle est entièrement vidée à chaque lancement), dans `admin/` et dans `site/`.

## Mise en ligne (Supabase + Vercel)

Un seul projet Vercel, avec trois « services » déclarés dans [`vercel.json`](vercel.json), sur un même domaine :

| Adresse | Service | Dossier |
|---|---|---|
| `/api/…` | API (Express, une fonction) | `backend/` |
| `/pro/…` | Espace pro (Vite, fichiers statiques) | `admin/` |
| tout le reste | Site voyageurs (Next.js) | `site/` |

Le site appelle l'API côté serveur par une liaison interne (`BACKEND_URL`, injectée par Vercel) ;
le navigateur de l'espace pro appelle `/api` sur le même domaine (pas de CORS).

1. **Base (Neon, via Vercel)** : base `Plazo-db` créée depuis l'onglet *Storage* du projet Vercel ; elle
   ajoute elle-même `DATABASE_URL`, `DATABASE_URL_UNPOOLED` et `POSTGRES_PRISMA_URL`. L'API se connecte par
   `POSTGRES_PRISMA_URL` et applique les migrations par la connexion directe (`DIRECT_URL`, ou à défaut
   `DATABASE_URL_UNPOOLED`). PostGIS est activé par la première migration.
2. **Projet Vercel** : importer le dépôt, dossier racine = racine du dépôt (là où se trouve
   `vercel.json`) ; les fonctions tournent à Paris (`cdg1`). Variables (communes aux trois services) :
   `NODE_ENV=production`, `SECRET_KEY`, `CRON_SECRET`, `SITE_API_KEY`
   (secret partagé entre le site et l'API), `PUBLIC_SITE_URL` (adresse publique du site, pour les liens
   des mails), pour les mails et SMS `BREVO_API_KEY`, `EMAIL_FROM`, `SMS_SENDER`, et
   `PLATFORM_ADMIN_EMAILS` (emails des administrateurs de la plateforme, séparés par des virgules : eux seuls
   voient l'outil interne).
   Chaque déploiement applique les migrations (`npm run vercel-build` dans `backend/`) ; la purge
   nocturne des jetons est un Vercel Cron (`/api/internal/cron/purge-expired-tokens`).
3. Compte de l'administrateur de la plateforme : mettre un mot de passe (10 caractères minimum) dans
   `PLATFORM_BOOTSTRAP_PASSWORD` sur Vercel et redéployer. Le déploiement crée alors l'opérateur
   « Plazo (tests) » dont le gérant est le premier email de `PLATFORM_ADMIN_EMAILS` (rien si le compte
   existe déjà : le mot de passe n'est jamais écrasé). Supprimer la variable ensuite.
   Les autres opérateurs se créent depuis un poste : `npm run seed:operator` dans `backend/`, avec
   `DATABASE_URL` pointé sur la base Neon (connexion directe).

4. **Paiement en ligne (Stripe Connect, mode test)** — facultatif : sans `STRIPE_SECRET_KEY`, le site garde le
   paiement sur place. Pour l'activer :
   - Variables : `STRIPE_SECRET_KEY` (clé **de test** `sk_test_…` ; une clé `sk_live_`/`rk_live_` est refusée en production
     tant que `STRIPE_ALLOW_LIVE` n'est pas `true`), `STRIPE_WEBHOOK_SECRET` (secret(s) de signature `whsec_…` des
     destinations du webhook, séparés par des virgules), `PLATFORM_COMMISSION_BPS` (commission par défaut, ex. `1200` =
     12 %, sinon par loueur), `PUBLIC_SITE_URL` (adresses de retour de Stripe). `STRIPE_API_BASE` sert seulement aux tests
     locaux (faux Stripe) et est ignorée en production.
   - Tableau de bord Stripe (mode test) : activer **Connect** (comptes **Express**, pays France) ; dans *Paramètres →
     Image de marque*, logo et couleurs Plazo (la page de paiement en reprend l'apparence) ; dans *Développeurs →
     Webhooks*, créer une destination vers **`https://plazo-benford-tech.vercel.app/api/public/stripe/webhook`** pour les
     évènements **de votre compte** : `checkout.session.completed`, `checkout.session.expired`,
     `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` ; et une seconde destination,
     même adresse, pour les évènements **des comptes connectés** : `account.updated`. Mettre les deux secrets de signature
     dans `STRIPE_WEBHOOK_SECRET` (séparés par une virgule).
   - Tâches planifiées (Vercel Cron, `Authorization: Bearer <CRON_SECRET>`) : `/api/internal/cron/payouts` **chaque jour**
     (reversements aux loueurs) ; `/api/internal/cron/expire-payment-holds` facultative (nettoyage : une place tenue expirée
     ne compte déjà plus).
   - Plazo encaisse, puis reverse la part du loueur : par défaut le lendemain de la fin du séjour. Le loueur choisit quand
     il reçoit son argent : le lendemain du dépôt, le lendemain de la fin du séjour (par défaut), chaque semaine ou chaque mois.

Vérifier la configuration sans déployer : `npx vercel build` (avec un `.vercel/project.json` local),
ou `vercel dev` pour lancer les trois services ensemble.

## API

Documentation interactive : `/api/docs` (Swagger). Toutes les routes sont sous `/api` (le tableau omet ce préfixe) :

| Méthode | Chemin | Rôle |
|---|---|---|
| POST | `/internal/auth/login` | `{ email, password }` → `{ tokenData: { access, refresh }, user }` |
| POST | `/internal/auth/refresh` | `{ refreshToken }` → nouvelle paire (l'ancienne est révoquée) |
| POST | `/internal/auth/logout` | Révoque la session courante |
| GET | `/internal/staff/me` | Membre connecté |
| PATCH | `/internal/staff/me/password` | Changer son mot de passe (déconnecte tous les appareils) |
| GET / POST | `/internal/staff` | Équipe (gérant) |
| PATCH | `/internal/staff/:id` | Rôle, activation (gérant) |
| POST | `/internal/staff/:id/reset-password` | Mot de passe provisoire (gérant) |
| GET | `/internal/parking` | Parking et capacité réservable |
| PATCH | `/internal/parkings/:id` | Réglages du parking (gérant, tracé) |
| GET | `/internal/planning?date=` | Arrivées, retours et charge des 7 nuits d'une journée |
| GET | `/internal/capacity?arrivalAt=&returnAt=` | Charge de chaque nuit d'un séjour, nuits complètes |
| GET / POST | `/internal/reservations` | Recherche (plaque, nom, téléphone, référence) / création |
| GET / PATCH | `/internal/reservations/:id` | Fiche / modification (les dates revérifient la capacité) |
| POST | `/internal/imports/email` | Lit un mail de comparateur collé (Allopark) : champs trouvés, manquants, doublon, capacité |
| GET / PUT | `/internal/listing` | Fiche Plazo du loueur (gérant ; publication seulement avec une grille tarifaire) |
| GET / PUT | `/internal/pricing` | Grille tarifaire : forfaits « jusqu'à N jours » + prix du jour supplémentaire |
| GET | `/public/airports/:slug` | Site voyageurs : parkings publiés d'un aéroport (sans authentification) |
| GET | `/public/search?airport=&arrivalAt=&returnAt=` | Site voyageurs : disponibilité et prix total pour un séjour |
| GET | `/public/airports/:airport/parkings/:slug` | Site voyageurs : fiche parking, avec l'offre si des dates sont données |
| POST | `/internal/reservations/:id/status` | Étape suivante : arrivée, navette, retour, rendu, annulation… (annuler une réservation payée en ligne la rembourse) |
| GET | `/public/config` | Site voyageurs : `{ payments: "online" \| "on_site" }` |
| POST | `/public/bookings` | Réservation du site (en attente de paiement si le paiement en ligne est actif) |
| POST | `/public/bookings/:ref/checkout` | Page de paiement Stripe Checkout `{ url }` (ou `{ paid: true }`) |
| POST | `/public/bookings/:ref/release` | « Modifier » : rend la place tenue |
| POST | `/public/bookings/:ref/cancel` | Annulation en ligne (remboursement intégral si payée en ligne) |
| POST | `/public/stripe/webhook` | Évènements Stripe signés (corps brut) |
| POST | `/internal/payments/onboarding` | Gérant : crée le compte Stripe Express si besoin, renvoie le lien d'inscription Stripe |
| GET | `/internal/payments/status` | Gérant : `{ connected, chargesEnabled, payoutsEnabled, payoutSchedule }` |
| GET / PUT | `/internal/payments/settings` | Gérant : `{ payoutSchedule }` (`AFTER_STAY`, `AT_DROP_OFF`, `WEEKLY`, `MONTHLY`) |
| GET | `/internal/cron/payouts` | Vercel Cron, chaque jour : transferts des parts dues aux loueurs |
| GET | `/internal/cron/expire-payment-holds` | Vercel Cron (facultatif) : expire les places tenues non payées |
| GET / POST | `/internal/platform/capacity-studies` | Outil interne (`PLATFORM_ADMIN_EMAILS`, 403 sinon) : études de capacité |
| GET / PATCH / DELETE | `/internal/platform/capacity-studies/:id` | Une étude (enregistrement automatique par PATCH) |
| GET | `/internal/platform/geo/parcels?lon=&lat=` | Parcelles cadastrales au point cliqué (relais vers API Carto de l'IGN) |
| GET | `/internal/platform/geo/parkings?bbox=` | Parkings BD TOPO de la vue (relais vers le WFS de la Géoplateforme) |
| GET | `/internal/platform/geo/geocode?q=` | Recherche d'adresse (relais vers le géocodage de la Géoplateforme) |
