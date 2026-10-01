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
- [ ] Jalon 3b — Site Plazo voyageurs (Next.js, direction M3)
- [ ] Jalon 3c — Paiement en ligne (Stripe Connect), commission et reversements
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

1. **Base (Supabase)** : projet en région Paris (`eu-west-3`), extension PostGIS activée.
   - `DATABASE_URL` : « Transaction pooler » (port 6543) avec `?pgbouncer=true&connection_limit=1` ;
   - `DIRECT_URL` : « Direct connection » (port 5432), pour les migrations.
2. **Projet Vercel** : importer le dépôt, dossier racine = racine du dépôt (là où se trouve
   `vercel.json`) ; les fonctions tournent à Paris (`cdg1`). Variables (communes aux trois services) :
   `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, `SECRET_KEY`, `CRON_SECRET`, `SITE_API_KEY`
   (secret partagé entre le site et l'API), `PUBLIC_SITE_URL` (adresse publique du site, pour les liens
   des mails), et pour les mails et SMS `BREVO_API_KEY`, `EMAIL_FROM`, `SMS_SENDER`.
   Chaque déploiement applique les migrations (`npm run vercel-build` dans `backend/`) ; la purge
   nocturne des jetons est un Vercel Cron (`/api/internal/cron/purge-expired-tokens`).
3. Créer le premier opérateur depuis un poste : `npm run seed:operator` dans `backend/`, avec
   `DATABASE_URL` pointé sur la base Supabase.

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
| POST | `/internal/reservations/:id/status` | Étape suivante : arrivée, navette, retour, rendu, annulation… |
