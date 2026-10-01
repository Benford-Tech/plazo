# Plazo (nom de travail)

Logiciel pour les opérateurs de parkings privés d'aéroport : réservations, plan du parking
et affectation des véhicules, navette au retour.

- Cadrage du projet (contexte, périmètre du MVP, règles de travail) : [CLAUDE.md](CLAUDE.md)
- Spécification détaillée (rôles, blocs fonctionnels, modèle de données, jalons) : [SPEC.md](SPEC.md)

## État d'avancement

- [x] **Jalon 1 — Socle** : comptes du personnel, rôles (gérant, agent d'accueil, chauffeur, voiturier),
  opérateur et parking, capacité et marge de sécurité, base PostgreSQL + PostGIS, API de connexion pour l'app mobile.
- [ ] Jalon 2 — Réservations
- [ ] Jalon 3 — Page publique et notifications
- [ ] Jalon 4 — Cartographie et affectation
- [ ] Jalon 5 — Navette au retour
- [ ] Jalon 6 — App mobile (Flutter)
- [ ] Jalon 7 — Pilote chez le client n°1

## Lancer l'application en local

Prérequis : Node.js 20.9+, pnpm, PostgreSQL 16 avec l'extension PostGIS.

```bash
cd web
cp .env.example .env        # adapter les URL de base de données
pnpm install
pnpm db:migrate             # crée les tables
pnpm seed:operator --operator "Mon parking" --capacity 250 \
  --name "Prénom Nom" --email gerant@exemple.fr --password "mot-de-passe-solide"
pnpm dev                    # http://localhost:3000
```

Le compte gérant ainsi créé ajoute ensuite son équipe depuis la page « Équipe ».

Tests : `pnpm test` (utilise la base `DATABASE_URL_TEST`, entièrement vidée à chaque lancement).

## Mise en ligne (Supabase + Vercel)

1. **Supabase** : créer un projet en région Paris (`eu-west-3`), activer l'extension PostGIS
   (Database → Extensions), puis récupérer deux chaînes de connexion :
   - « Transaction pooler » (port 6543) → `DATABASE_URL` ;
   - « Direct connection » (port 5432) → `MIGRATION_DATABASE_URL`.
2. Appliquer les migrations depuis un poste : `MIGRATION_DATABASE_URL=… pnpm db:migrate`.
3. **Vercel** : importer le dépôt, dossier racine `web`, région des fonctions Paris (`cdg1`),
   variable d'environnement `DATABASE_URL`. L'option « Include files outside the root directory »
   doit rester activée (le nom du produit est lu dans `product.json` à la racine).
4. Créer le premier opérateur avec `pnpm seed:operator` pointé sur la base Supabase.

## API pour l'app mobile

| Méthode | Chemin | Rôle |
|---|---|---|
| POST | `/api/v1/auth/login` | `{ email, password }` → `{ token, expiresAt, user }` (session de 30 jours) |
| POST | `/api/v1/auth/logout` | Révoque le jeton (`Authorization: Bearer …`) |
| GET | `/api/v1/me` | Utilisateur connecté et parking |
