# Plazo (nom de travail)

Logiciel pour les opérateurs de parkings privés d'aéroport : réservations, plan du parking
et affectation des véhicules, navette au retour.

- Cadrage du projet (contexte, périmètre du MVP, règles de travail) : [CLAUDE.md](CLAUDE.md)
- Spécification détaillée (rôles, blocs fonctionnels, modèle de données, jalons) : [SPEC.md](SPEC.md)

## État d'avancement

- [x] **Jalon 1 — Socle** (stack LoveNest) : comptes du personnel, rôles (gérant, agent d'accueil,
  chauffeur, voiturier), opérateur et parking, capacité et marge de sécurité, base PostgreSQL + PostGIS,
  API documentée, espace pro.
- [ ] Jalon 2 — Réservations
- [ ] Jalon 3 — Page publique et notifications
- [ ] Jalon 4 — Cartographie et affectation
- [ ] Jalon 5 — Navette au retour
- [ ] Jalon 6 — App mobile (Flutter)
- [ ] Jalon 7 — Pilote chez le client n°1

## Lancer en local

Prérequis : Node.js 22, PostgreSQL 16 avec l'extension PostGIS.

```bash
# Serveur (API sur http://localhost:3005, documentation sur /api-docs)
cd backend
cp .env.example .env          # adapter les URL de base de données et SECRET_KEY
npm install
npm run prisma:deploy         # crée les tables
npm run seed:operator -- --operator "Mon parking" --capacity 250 \
  --name "Prénom Nom" --email gerant@exemple.fr --password "mot-de-passe-solide"
npm run dev

# Espace pro (http://localhost:8080)
cd ../admin
cp .env.example .env          # VITE_API_URL=http://localhost:3005
npm install
npm run dev
```

Le compte gérant ainsi créé ajoute ensuite son équipe depuis la page « Équipe ».

Tests : `npm test` dans `backend/` (base `DATABASE_URL_TEST`, dont le nom doit finir par `_test` ;
elle est entièrement vidée à chaque lancement) et dans `admin/`.

## Mise en ligne

1. **Base (Supabase)** : projet en région Paris (`eu-west-3`), extension PostGIS activée.
   - `DATABASE_URL` : « Transaction pooler » (port 6543) avec `?pgbouncer=true` ;
   - `DIRECT_URL` : « Direct connection » (port 5432), pour les migrations ;
   - `BOSS_DATABASE_URL` : connexion directe ou « Session pooler » (pg-boss a besoin d'une session).
2. **Serveur (DigitalOcean, comme LoveNest)** : image Docker construite depuis la racine du dépôt
   (`docker build -f backend/Dockerfile -t plazo-backend .`). Au démarrage, le conteneur applique
   les migrations puis lance l'API sur le port 3005. Variables : celles de `backend/.env.example`,
   avec `NODE_ENV=production` et `CLIENT_URL` = l'adresse de l'espace pro.
3. **Espace pro** : `npm run build` dans `admin/` avec `VITE_API_URL` = l'adresse de l'API,
   puis publier `admin/dist` sur un hébergement statique (LoveNest utilise Firebase Hosting).
   Toutes les routes doivent renvoyer `index.html`.
4. Créer le premier opérateur avec `npm run seed:operator` pointé sur la base Supabase.

## API

Documentation interactive : `/api-docs` (Swagger). Routes du jalon 1, toutes sous `/internal` :

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
