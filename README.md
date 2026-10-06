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
  **synchronisation de la boîte mail** (M-A, 06/10/2026 : adresse de réception par loueur, webhook Brevo, lecteur Allopark de `domain/importers`, « Mails à vérifier ») ; l'import par copier-coller a été retiré le 06/10/2026.
  Reste : lecteurs Parkos, Onepark… (un exemple de mail par comparateur), import CSV si besoin.
- [ ] **Jalon 3a — Fiche et tarifs** (fait) : dans l'espace pro, onglet « Sur Plazo » : « Ma fiche » (présentation,
  services, annulation, photos par adresse, aperçu en direct, envoi en validation refusé tant qu'il n'y a pas de tarifs)
  et « Mes tarifs » (forfaits par nombre de jours, prix du jour supplémentaire, simulation du prix payé).
  Reste : envoi de photos depuis l'ordinateur.
- [x] **Espace « Plateforme », inscription libre et validation des annonces** (maquette S-1) : voir « Rôles,
  inscription et validation » ci-dessous.
- [x] **Estimateur de capacité** (réservé à la plateforme, `PLATFORM_ADMIN_EMAILS`) : onglet « Outil capacité » de
  l'espace Plateforme (`/pro/plateforme/capacite` ; l'ancienne adresse `/pro/outil/capacite` y renvoie). Trois étapes sur la photo aérienne de l'IGN (BD ORTHO) :
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
- [ ] **Jalon 5 — Navette au retour** (en cours, maquette validée « Votre retour ») : fait — **suivi automatique du vol
  retour** (AeroDataBox par RapidAPI, AirLabs en secours ; rafraîchi par un cron et à la lecture avec un cache de
  5 min ; à l'atterrissage : push au personnel « Vol TO 3627 atterri · C. Martin » et SMS au voyageur, une seule fois),
  **« Votre retour aujourd'hui »** dans l'app (ligne de temps : vol → point de rendez-vous → navette → voiture, ou
  « J'ai atterri » sans suivi), **chemin à pied vers le point de rendez-vous** (itinéraire piéton Géoplateforme IGN
  calculé par l'API, consignes et photo du loueur, « Ouvrir dans Plans »), **suivi de la navette en direct** (position
  du chauffeur, ETA, véhicule, prénom), **mode chauffeur** dans l'app pro (retours à récupérer par terminal, « Démarrer le
  trajet », position partagée avec les passagers seulement, « Clients récupérés »), point de rendez-vous (carte, libellé,
  consignes, photo) et navettes dans l'espace pro, « Navette en route (Karim) » sur le planning. Reste : « bagages
  récupérés / pris en charge » détaillés, regroupement par vague, SMS au voyageur sans réservation Plazo.
  **Communication voyageur ↔ parking (E, 06/10/2026)** : à la réservation (site, app, saisie pro) un message pour le parking
  (`customerNote`) et le véhicule (`vehicleModel`, `vehicleColour`) ; un mot joint aux signaux d'arrivée (`note`, dans le push et
  le bandeau) ; le jour du retour « Mon vol a du retard », « Bagage perdu » ou un mot libre (`POST …/return/notice`), poussé aux
  retours et affiché dans la file du chauffeur, la fiche opérationnelle et la fiche complète.
  **Le site au niveau de l'app le jour J (D, 06/10/2026)** : sur « Ma réservation », « Prévenir de mon arrivée » (position du
  navigateur partagée avec consentement, « J'arrive dans 10 / 20 / 30 min », « Je suis au point de rendez-vous »), bloc
  « Navette » du séjour, « J'ai atterri » sans vol suivi, consignes, photo et itinéraire du point de rendez-vous.
- [ ] **Jalon 6 — App mobile (Flutter)** (commencé, `mobile/`) : fait — **« Prévenir de son arrivée »** (maquette
  validée) : le voyageur ouvre sa réservation par le lien reçu ou par référence + email, partage sa position jusqu'à
  son arrivée (2 h au plus, effacée ensuite, arrêt automatique à 150 m de l'accueil) ou annonce « J'arrive dans
  10 / 20 / 30 min » ; au retour, « Je suis au point de rendez-vous ». Côté pro : planning du jour dans l'app (l'arrivée
  en approche en tête avec sa mini-carte) et dans l'espace pro web (liseré jaune, bandeau, interrogation toutes les
  12 s), notifications push OneSignal par personne (arrivées, retours). **Parcours voyageur complet** (une seule
  app, onglets Rechercher / Mes réservations / Plus) : recherche et dates comme le site, résultats en liste ou sur la
  carte IGN avec les mêmes tris et filtres, fiche parking, réservation en deux étapes et **paiement natif Stripe**
  (feuille de paiement, Apple Pay / Google Pay ; Checkout sur la version web), réservations gardées sur le téléphone
  sans compte (modifier le vol, itinéraire, annuler). Reste : comptes stores, OneSignal et Firebase, identifiant
  marchand Apple Pay, liens universels, file navette complète (jalon 5), bloc « Je suis en route » sur la page « Ma
  réservation » du site.
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
# (le prénom est le premier mot, le reste est le nom : chaque membre a un prénom et un nom depuis le 06/10/2026)
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

Application mobile (Flutter stable, hors du dépôt) : voir [mobile/README.md](mobile/README.md).

```bash
cd mobile
flutter pub get
flutter test
flutter run --dart-define=API_BASE_URL=http://localhost:3005/api
```

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
   des mails), pour les mails et SMS `BREVO_API_KEY`, `EMAIL_FROM`, `SMS_SENDER`,
   `SMS_GATEWAY_ENCRYPTION_KEY` (clé qui chiffre les mots de passe des téléphones reliés par les loueurs, voir
   « SMS depuis le téléphone du parking » ; `openssl rand -base64 32`), et
   `PLATFORM_ADMIN_EMAILS` (emails des administrateurs de la plateforme, séparés par des virgules : eux seuls
   voient l'espace Plateforme).
   Chaque déploiement applique les migrations (`npm run vercel-build` dans `backend/`) ; la purge
   nocturne (jetons, SMS en attente abandonnés après 2 h, boîte d'envoi des SMS après 30 jours, position de la voiture et
   téléphones du voyageur 2 jours après le retour, anonymisation des réservations 12 mois après le retour) est un Vercel Cron
   (`/api/internal/cron/purge-expired-tokens`).
3. Compte de l'administrateur de la plateforme : mettre un mot de passe (10 caractères minimum) dans
   `PLATFORM_BOOTSTRAP_PASSWORD` sur Vercel et redéployer. Le déploiement crée alors l'opérateur
   « Plazo (tests) » dont le gérant est le premier email de `PLATFORM_ADMIN_EMAILS` (rien si le compte
   existe déjà : le mot de passe n'est jamais écrasé). Supprimer la variable ensuite.
   Les autres opérateurs se créent depuis un poste : `npm run seed:operator` dans `backend/`, avec
   `DATABASE_URL` pointé sur la base Neon (connexion directe).
   **Données de démonstration** (facultatif) : pour essayer le site et les apps avec des parkings fictifs,
   mettre `DEMO_LISTINGS=true` et `DEMO_SEED_PASSWORD` (10 caractères minimum) sur Vercel et redéployer. Le
   déploiement crée (ou rafraîchit, sans doublon) cinq loueurs fictifs autour de Lyon Saint-Exupéry (Parkair Lyon,
   Aéroparc Saint-Exupéry, Les Hangars de Colombier, Parking Premium Terminal, EcoPark Pusignan), chacun avec
   une fiche publiée, une grille de tarifs de 1 à 15 jours, un point de rendez-vous et une navette, plus trois
   réservations à venir chez Parkair Lyon. Comptes gérants : `demo-<slug>@plazo.test` (par exemple
   `demo-parkair-lyon@plazo.test`), mot de passe `DEMO_SEED_PASSWORD` (jamais modifié pour un compte existant).
   Ces loueurs portent la marque « Démo » sur le site, dans l'app et dans l'espace Plateforme. Pour les retirer :
   `DEMO_LISTINGS=remove` et redéployer (supprime uniquement les loueurs marqués démo, avec leurs fiches, comptes
   et réservations), puis enlever la variable. Depuis un poste : `npm run seed:demo -- --apply` ou `--remove`
   dans `backend/`. Le script n'échoue jamais le déploiement et ne journalise que des comptages.

4. **Paiement en ligne (Stripe Connect, mode test)** — **obligatoire pour réserver sur le site et l'app** : sans
   `STRIPE_SECRET_KEY`, la réservation en ligne est indisponible (plus de paiement sur place depuis le 06/10/2026 ; la saisie
   manuelle de l'espace pro reste possible). Pour l'activer :
   - Variables : `STRIPE_SECRET_KEY` (clé **de test** `sk_test_…` ; une clé `sk_live_`/`rk_live_` est refusée en production
     tant que `STRIPE_ALLOW_LIVE` n'est pas `true`), `STRIPE_WEBHOOK_SECRET` (secret(s) de signature `whsec_…` des
     destinations du webhook, séparés par des virgules), `PLATFORM_COMMISSION_BPS` (commission par défaut, ex. `1200` =
     12 %, sinon par loueur), `PUBLIC_SITE_URL` (adresses de retour de Stripe). `STRIPE_API_BASE` sert seulement aux tests
     locaux (faux Stripe) et est ignorée en production. `STRIPE_PUBLISHABLE_KEY` (facultative, `pk_test_…` du même
     compte) : donnée à l'app mobile pour sa feuille de paiement native (`GET /api/public/payments/config`) ; sans elle,
     l'app passe par la page Stripe Checkout.
   - Tableau de bord Stripe (mode test) : activer **Connect** (comptes **Express**, pays France) ; dans *Paramètres →
     Image de marque*, logo et couleurs Plazo (la page de paiement en reprend l'apparence) ; dans *Développeurs →
     Webhooks*, créer une destination vers **`https://plazo-benford-tech.vercel.app/api/public/stripe/webhook`** pour les
     évènements **de votre compte** : `checkout.session.completed`, `checkout.session.expired`,
     `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, et pour l'app
     `payment_intent.succeeded`, `payment_intent.payment_failed` ; et une seconde destination,
     même adresse, pour les évènements **des comptes connectés** : `account.updated`. Mettre les deux secrets de signature
     dans `STRIPE_WEBHOOK_SECRET` (séparés par une virgule).
   - Tâches planifiées (Vercel Cron, `Authorization: Bearer <CRON_SECRET>`) : `/api/internal/cron/payouts` **chaque jour**
     (reversements aux loueurs) ; `/api/internal/cron/expire-payment-holds` facultative (nettoyage : une place tenue expirée
     ne compte déjà plus).
   - Plazo encaisse, puis reverse la part du loueur : par défaut le lendemain de la fin du séjour. Le loueur choisit quand
     il reçoit son argent : le lendemain du dépôt, le lendemain de la fin du séjour (par défaut), chaque semaine ou chaque mois.

5. **Notifications push du personnel (OneSignal)** — facultatif : sans `ONESIGNAL_APP_ID` et `ONESIGNAL_REST_API_KEY`,
   aucune notification n'est envoyée (les arrivées s'affichent quand même dans l'espace pro et l'app). La clé REST
   reste sur Vercel ; l'*App ID* est aussi donné à l'app (`--dart-define=ONESIGNAL_APP_ID=…`, voir
   [mobile/README.md](mobile/README.md)).
   « Prévenir de son arrivée » n'a besoin d'aucune nouvelle tâche planifiée : les signaux de plus de 2 h sont terminés
   (position effacée) à chaque lecture et par la purge nocturne existante ; `/api/internal/cron/expire-arrival-signals`
   existe pour une passe plus fréquente si besoin.

7. **Synchronisation de la boîte mail (M-A, 06/10/2026)** — facultatif : sans `INBOUND_EMAIL_DOMAIN` et
   `INBOUND_EMAIL_SECRET`, le bloc « Mails entrants » des réglages explique que la réception n'est pas configurée.
   Principe : chaque loueur active une adresse `<slug>@<INBOUND_EMAIL_DOMAIN>` (Parking › Réglages) et crée dans sa
   messagerie une règle qui lui transfère les mails des comparateurs ; Brevo (*Inbound parsing*) reçoit le domaine et
   appelle `POST /api/public/inbound/email?secret=<INBOUND_EMAIL_SECRET>` ; un mail reconnu et complet (Allopark) crée
   la réservation (canal comparateur, doublon refusé par la référence externe, push « Nouvelle réservation ») ; un
   mail incomplet ou inconnu attend dans « Mails à vérifier » (`/pro/reservations/a-verifier`, alerte du tableau de
   bord), où l'équipe le complète dans le formulaire prérempli ou le classe. Texte des mails gardé 30 jours, lignes 90.
   Mise en place côté Brevo : choisir un sous-domaine (ex. `in.plazo.fr`), y mettre l'enregistrement MX que Brevo
   indique (Transactional › Inbound parsing › *Add a domain*), puis créer le webhook *inbound* avec ce domaine et
   l'URL ci-dessus (le secret dans l'URL ; Brevo ne signe pas ses appels).

6. **Suivi des vols au retour** — facultatif : sans clé, les vols ne sont pas suivis (le voyageur dit « J'ai atterri »
   dans l'app, et l'heure de retour saisie fait foi). Trois fournisseurs derrière la même interface, choisis par
   `FLIGHT_TRACKING_PROVIDER` (`flightaware` | `aerodatabox` | `airlabs` ; vide : celui dont la clé est renseignée, dans
   cet ordre) :
   - **FlightAware AeroAPI** (recommandé, 05/10/2026) : sur [flightaware.com/aeroapi](https://www.flightaware.com/aeroapi/),
     plan **Personal** : 5 $ de requêtes offerts chaque mois (carte demandée à l'inscription, rien n'est prélevé en
     dessous), une recherche de vol = 0,005 $ ; créer une clé API et la mettre dans `FLIGHTAWARE_API_KEY`. Compter une
     trentaine de vols suivis par mois dans l'enveloppe gratuite avec les règles frugales ci-dessous.
   - **AeroDataBox** : sur [rapidapi.com](https://rapidapi.com), chercher
     « AeroDataBox », s'abonner au plan **Basic (gratuit)**, copier la clé *X-RapidAPI-Key* dans `AERODATABOX_API_KEY`.
     Acheté sur API.Market plutôt que RapidAPI ? Mettre aussi `AERODATABOX_BASE_URL=https://prod.api.market/api/v1/aedbx/aerodatabox`
     (la clé part alors dans l'en-tête `x-magicapi-key`). Appels frugaux : une recherche par réservation et par passage
     (cron ou lecture), au plus une toutes les 5 minutes, jamais plus de 24 h avant l'atterrissage prévu, plus rien
     après atterri / annulé / dérouté.
   - **AirLabs** (`AIRLABS_API_KEY`) : inscriptions fermées pour l'instant (liste d'attente) ; gardé en secours.
   - Tâche planifiée `/api/internal/cron/track-return-flights` (`Authorization: Bearer <CRON_SECRET>`), à ajouter dans
     `vercel.json` : **toutes les 10 minutes de 5 h à minuit** (`*/10 5-23 * * *`, heure UTC sur Vercel). Vercel Hobby
     n'accepte que des crons quotidiens : les lectures (app, planning, file du chauffeur) rafraîchissent aussi le vol
     avec le même cache de 5 minutes, donc le bloc fonctionne sans cron (seul le SMS à l'atterrissage dépend alors d'une
     lecture).
   - **Messages au voyageur (décision B du 06/10/2026)** : confirmation enrichie (vol aller, navette aller prévue, téléphone du
     parking, point de rendez-vous au retour, « le jour du dépôt » en étapes), rappel la veille (mail + SMS + push, cron
     `remind-tomorrow`), push « Votre voiture est garée » (place et crochet) quand le voiturier la place, push « Bon voyage ! »
     à la fin de la navette de dépose, SMS d'atterrissage pour tous les canaux (plus seulement Plazo), mail et push de clôture
     après la remise (`closingSentAt`). Textes dans `domain/booking-messages.ts`, service `TravellerMessagesService`.
   - Le SMS d'atterrissage (point de rendez-vous, consignes, lien de la réservation) part par le canal SMS du loueur
     (voir « SMS depuis le téléphone du parking ») une seule fois par réservation, seulement quand le fournisseur a vu
     l'atterrissage (pas quand le voyageur l'a déclaré lui-même : il est déjà dans l'app).

### SMS depuis le téléphone du parking

Chaque loueur choisit, dans **Mon compte › SMS aux voyageurs** (gérant), comment partent ses SMS (confirmation,
atterrissage…) : **le téléphone du parking** (gratuit, avec son forfait), **« Plazo envoie pour moi »** (Brevo, 0,05 €
par SMS, proposé seulement si `BREVO_API_KEY` est configurée ; la facturation elle-même n'est pas encore faite) ou
**pas de SMS** (emails seulement, le choix par défaut tant que rien n'est configuré). Le téléphone du parking passe par
l'appli libre et gratuite [SMS Gateway for Android](https://github.com/capcom6/android-sms-gateway) (capcom6) en mode
*Cloud server* : l'API dépose les SMS sur `https://api.sms-gate.app/3rdparty/v1` (Basic auth avec l'identifiant et le
mot de passe de l'appli, `POST /messages`, état par `GET /messages/{id}`) et le téléphone les envoie. Un serveur privé
(« Serveur (avancé) ») remplace l'adresse du cloud si le loueur héberge le sien.

Pour relier le téléphone (un Android allumé, chargé, avec des SMS illimités) :
1. Sur le téléphone, installer **SMS Gateway for Android** (Play Store, ou l'APK des *Releases* GitHub) et accepter
   l'autorisation d'envoyer des SMS.
2. Dans l'appli, basculer l'interrupteur **Cloud server** sur *on*, puis appuyer sur le bouton **Online** en bas de
   l'écran : la section *Cloud server* affiche un **identifiant** (login) et un **mot de passe**.
3. Dans l'espace pro, *Mon compte › SMS aux voyageurs*, choisir **Téléphone du parking**, recopier l'identifiant et le
   mot de passe, saisir le **numéro du téléphone** (expéditeur, affiché aux voyageurs) et un numéro qui recevra un **SMS
   de test**, puis **Relier et tester**. Le mot de passe est chiffré en base (AES-256-GCM, `SMS_GATEWAY_ENCRYPTION_KEY`,
   obligatoire dès qu'un loueur relie un téléphone ; en changer délie tous les téléphones) et n'est jamais réaffiché.
4. Laisser l'appli active (exclure des économies de batterie). Un SMS que le téléphone n'a pas envoyé reste en attente
   2 h (réessayé à chaque lecture du planning, par le cron des vols et par le cron de nuit) puis est abandonné ; après
   10 minutes d'attente le planning affiche « SMS en attente · téléphone injoignable ». L'état, l'expéditeur, les
   compteurs du mois (envoyés / échecs) et la dernière erreur sont dans *Mon compte*.

La boîte d'envoi (`sms_outbox`) garde le destinataire et l'empreinte SHA-256 du texte, jamais le texte (reconstruit
depuis la réservation pour un nouvel essai) ; ses lignes sont purgées après 30 jours par le cron de nuit.

Vérifier la configuration sans déployer : `npx vercel build` (avec un `.vercel/project.json` local),
ou `vercel dev` pour lancer les trois services ensemble.

## Rôles, inscription et validation

- **Super admin de la plateforme** : les emails de `PLATFORM_ADMIN_EMAILS` (joannysimpore@gmail.com). Son compte
  appartient au loueur de test « Plazo (tests) » (créé au déploiement, voir plus bas) ; il passe de cet espace à
  l'espace **Plateforme** (`/pro/plateforme`) par le sélecteur « Vue : … ▾ » ou l'entrée « Plateforme » du menu.
  Onglets : **Loueurs** (annonce, paiements Stripe, commission modifiable, réservations du mois ; « Ouvrir son
  espace », suspendre / réactiver ; inviter un loueur), **Annonces** (file « À valider », aperçu, Valider / Refuser
  avec message obligatoire / Dépublier), **Réservations** (tous les loueurs, lecture seule, sans coordonnées des
  voyageurs), **Paiements** (compte Stripe, calendrier, reversements en attente ou en échec, « Relancer »),
  **Outil capacité**.
- **Loueurs** : le gérant administre son espace et sa fiche, comme avant (rôles gérant, agent, chauffeur, voiturier).
- **Inscription libre** (`/pro/inscription`, lien « Vous êtes un parking ? » du site) : entreprise, parking, capacité,
  aéroport, gérant, mot de passe, acceptation des conditions. Crée le loueur, son parking et sa fiche en brouillon ; le
  gérant est connecté tout de suite et doit **confirmer son email** (lien de 48 h) avant d'envoyer sa fiche. Limitée
  par adresse IP (5 par heure), champ piège anti-robots, même réponse si l'email a déjà un compte (son titulaire
  reçoit un email). Sans Brevo, en développement seulement, le lien de confirmation est renvoyé par l'API et proposé
  dans le bandeau.
- **Invitation** (onglet Loueurs) : crée le loueur et envoie au gérant un lien (7 jours, usage unique) pour choisir son
  mot de passe (`/pro/invitation`). Sans Brevo, le lien est montré une seule fois au super admin, à copier.
  Les liens ne sont stockés que hachés (SHA-256) et voyagent dans le fragment de l'URL (`#…`), jamais dans les logs.
- **Statut d'une fiche** : brouillon → à valider (« Envoyer pour validation ») → publiée (« Valider ») ou refusée
  (« Refuser », message montré au loueur, qui corrige et renvoie). Une fiche publiée reste en ligne quand le loueur la
  modifie (chaque modification est tracée) ; le super admin peut la dépublier, le loueur la retirer. Le site ne montre
  que les fiches publiées des loueurs non suspendus.
- **Ouvrir son espace** : session de 60 minutes limitée à ce loueur, bandeau jaune « Vous consultez l'espace de … ».
  Chaque écriture est tracée dans le journal (`audit_logs`, action `view_as.write`) au nom réel du super admin ;
  l'équipe, les mots de passe et le compte du loueur restent en lecture seule.
- **Suspension** : l'équipe du loueur est déconnectée et ne peut plus se connecter, ses fiches quittent le site.

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
| POST | `/internal/auth/signup` | Inscription libre d'un loueur (publique, limitée par IP, réponse identique si l'email existe) |
| POST | `/internal/auth/verify-email` | `{ token }` : confirme l'email (lien de 48 h, usage unique) |
| POST | `/internal/auth/verify-email/resend` | Nouveau lien de confirmation pour la personne connectée |
| POST | `/internal/auth/invitation` / `…/accept` | Invitation : `{ token }` → `{ email, operatorName }` ; `{ token, password }` → session |
| GET / PUT | `/internal/listing` | Fiche Plazo du loueur (gérant ; l'enregistrement ne change pas son statut) |
| POST | `/internal/listing/submit` / `…/withdraw` | Envoyer pour validation (tarifs et email confirmé requis) / retirer de Plazo |
| GET / PUT | `/internal/pricing` | Grille tarifaire : forfaits « jusqu'à N jours » + prix du jour supplémentaire |
| GET | `/public/airports` | Aéroports desservis (formulaire d'inscription) |
| GET | `/public/airports/:slug` | Site voyageurs : parkings publiés d'un aéroport (sans authentification) |
| GET | `/public/airports/:slug/live` | Carte vivante de l'accueil (K-A) : parkings publiés et navettes en circulation (position, sens, véhicule ; jamais de chauffeur ni de passager), interrogée toutes les 12 s, `Cache-Control: no-store` |
| GET | `/public/search?airport=&arrivalAt=&returnAt=` | Site voyageurs : disponibilité et prix total pour un séjour |
| GET | `/public/airports/:airport/parkings/:slug` | Site voyageurs : fiche parking, avec l'offre si des dates sont données |
| POST | `/internal/reservations/:id/status` | Étape suivante : arrivée, navette, retour, rendu, annulation… (annuler une réservation payée en ligne la rembourse) |
| GET | `/public/config` | Site voyageurs : `{ payments: "online" \| "on_site" }` |
| POST | `/public/bookings` | Réservation du site (en attente de paiement si le paiement en ligne est actif) |
| POST | `/public/bookings/:ref/checkout` | Page de paiement Stripe Checkout `{ url }` (ou `{ paid: true }`) |
| POST | `/public/bookings/:ref/payment-intent` | App : PaymentIntent de la feuille de paiement native `{ clientSecret, paymentIntentId, amountCents, currency, holdExpiresAt }` (ou `{ paid: true }`) |
| GET | `/public/payments/config` | App : `{ payments, publishableKey, merchantDisplayName, merchantCountryCode, currency }` |
| POST | `/public/bookings/:ref/release` | « Modifier » : rend la place tenue |
| POST | `/public/bookings/:ref/cancel` | Annulation en ligne (remboursement intégral si payée en ligne) |
| POST | `/public/stripe/webhook` | Évènements Stripe signés (corps brut) |
| POST | `/internal/payments/onboarding` | Gérant : crée le compte Stripe Express si besoin, renvoie le lien d'inscription Stripe |
| GET | `/internal/payments/status` | Gérant : `{ connected, chargesEnabled, payoutsEnabled, payoutSchedule }` |
| GET / PUT | `/internal/payments/settings` | Gérant : `{ payoutSchedule }` (`AFTER_STAY`, `AT_DROP_OFF`, `WEEKLY`, `MONTHLY`) |
| GET / PUT | `/internal/sms/settings` | Gérant : canal SMS `{ mode: gateway \| brevo \| none, brevoAvailable, gateway: { baseUrl, login, senderPhone, linkedAt } }` (mot de passe jamais renvoyé) |
| POST | `/internal/sms/test` | Gérant : SMS de test `{ to }` → `{ outcome: sent \| queued }`, 502 avec le code de l'appli en cas de refus |
| POST | `/internal/sms/disable` | Gérant : plus de SMS, identifiants oubliés |
| GET | `/internal/sms/status` | Gérant : `{ lastSentAt, month: { sent, failed }, pending, pendingStale, lastError }` (relance la file au passage) |
| POST | `/public/inbound/email?secret=` | Webhook *Inbound parsing* de Brevo (M-A) : `{ items: [...] }` → `{ received, imported, toCheck, ignored }` |
| GET | `/internal/inbound/settings` | Adresse de réception du loueur, dernier mail, comptages sur 30 jours, mails à vérifier |
| POST | `/internal/inbound/address` | Gérant : active l'adresse (`{ regenerate: true }` : nouvelle adresse) |
| GET | `/internal/inbound/emails?status=` | « Mails à vérifier » : en attente d'abord, puis 30 jours |
| POST | `/internal/inbound/emails/:id/dismiss` · `/attach` | Classer sans suite · rattacher à la réservation saisie (`{ reservationId }`) |
| GET | `/internal/cron/payouts` | Vercel Cron, chaque jour : transferts des parts dues aux loueurs |
| GET | `/internal/cron/expire-payment-holds` | Vercel Cron (facultatif) : expire les places tenues non payées |
| GET | `/internal/cron/remind-tomorrow` | Vercel Cron, 16 h UTC : rappel de la veille aux réservations attendues le lendemain (mail, SMS par le canal du loueur, push ; une fois, `reminderSentAt`) |
| GET | `/internal/cron/track-return-flights` | Vercel Cron, toutes les 10 min (5 h – 0 h) : vols retour du jour (push et SMS à l'atterrissage), vols aller du jour (décollage), SMS en attente réessayés |
| GET | `/internal/shuttle/forecast?date=` | Vagues de navettes du jour (V-A) : `{ date, times, seats, vehiclesInService, waves[] }` ; vols aller et retour rafraîchis si dus |
| PUT / DELETE | `/internal/reservations/:id/car-location` | Position GPS de la voiture prise par l'équipe `{ lat, lng, accuracyM?, note? }` (aussi `car` dans `POST …/spot`) |
| PUT / DELETE | `/public/bookings/:ref/car-location` | Le voyageur enregistre ou efface où il s'est garé (jeton en en-tête) ; 409 `car_location_locked` quand l'équipe l'a prise |
| GET / PUT | `/internal/parking/return-meeting-point` | Point de rendez-vous au retour : `{ lat, lng, label, instructions (≤ 500), photoUrl }` (gérant) |
| GET | `/public/bookings/:ref/return` | App, jour du retour : vol (rafraîchi si dû), point de rendez-vous, signal, navette en route |
| POST | `/public/bookings/:ref/return/landed` | « J'ai atterri » (push au personnel) |
| POST | `/public/bookings/:ref/return/notice` | E (06/10/2026) : « Mon vol a du retard », « Bagage perdu » ou un mot `{ kind: flight_delayed·luggage·other, text? }` pendant que le véhicule est sur place (409 `vehicle_not_on_site`) ; gardé sur la réservation (`returnNotice*`), push aux retours, visible dans la file du chauffeur et la fiche |
| GET | `/public/bookings/:ref/return/route?lat=&lng=` | Chemin à pied vers le point de rendez-vous (IGN, cache 3 min, ligne droite en repli) |
| GET | `/public/bookings/:ref/shuttle` | La navette qui vient (position, ETA, véhicule) : seulement pendant un trajet qui inclut la réservation |
| GET | `/internal/shuttle/pickups` | Chauffeur : retours à récupérer (vol, terminal, au point de rendez-vous, trajet, `leaveAt` heure de départ conseillée) |
| GET | `/internal/shuttle/staying` | F-A : voyageurs en séjour par jour de retour (`days[]`) et revenus aujourd'hui (`returnedToday`) |
| GET / POST | `/internal/shuttle/vehicles`, DELETE `…/:id` | Navettes du loueur (gérant) |
| GET | `/internal/shuttle/trips/current` | Le trajet en cours du chauffeur connecté |
| POST | `/internal/shuttle/trips` | « Démarrer le trajet » `{ reservationIds, vehicleId \| vehicle }` (un par chauffeur, 90 min max) |
| POST | `/internal/shuttle/trips/:id/position` | Position du chauffeur (une par 10 s, dernière seule, chauffeur uniquement) |
| POST | `/internal/shuttle/trips/:id/end` | « Clients récupérés » : fin du trajet, position effacée |
| GET | `/internal/platform/operators` | Plateforme (`PLATFORM_ADMIN_EMAILS`, 403 sinon) : tous les loueurs et leurs chiffres |
| PATCH | `/internal/platform/operators/:id/commission` | `{ commissionBps }` (null : taux par défaut) |
| POST | `/internal/platform/operators/:id/suspend` / `…/reactivate` | Suspendre / réactiver un loueur |
| POST | `/internal/platform/operators/:id/view-as` | « Ouvrir son espace » : jeton de 60 min limité au loueur |
| POST | `/internal/platform/invitations` | Inviter un loueur (lien renvoyé si l'email ne peut pas partir) |
| POST | `/internal/platform/operators/:id/invitation` | Renvoyer l'invitation (nouveau lien) |
| GET | `/internal/platform/listings?status=` | Fiches de tous les loueurs, nombre par statut |
| POST | `/internal/platform/listings/:id/approve` / `…/reject` / `…/unpublish` | Valider / refuser (`{ message }` obligatoire) / dépublier |
| GET | `/internal/platform/reservations?operatorId=&from=&to=&page=` | Réservations de tous les loueurs (sans coordonnées) |
| GET | `/internal/platform/payments` | Comptes Stripe, reversements en attente et en échec |
| POST | `/internal/platform/payouts/:reservationId/retry` | Relancer un reversement refusé par Stripe |
| GET / POST | `/internal/platform/capacity-studies` | Outil capacité : études de capacité |
| GET / PATCH / DELETE | `/internal/platform/capacity-studies/:id` | Une étude (enregistrement automatique par PATCH) |
| GET | `/internal/platform/geo/parcels?lon=&lat=` | Parcelles cadastrales au point cliqué (relais vers API Carto de l'IGN) |
| GET | `/internal/platform/geo/parkings?bbox=` | Parkings BD TOPO de la vue (relais vers le WFS de la Géoplateforme) |
| GET | `/internal/platform/geo/geocode?q=` | Recherche d'adresse (relais vers le géocodage de la Géoplateforme) |
