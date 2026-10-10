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
  **Présentation par Claude (09/10/2026)** : « Rédiger avec Claude » (« Améliorer avec Claude » quand le champ a déjà un
  texte) propose une présentation écrite d'après les seules données réelles du parking (fiche enregistrée, adresse, aéroport,
  prix de départ, navettes en service, dessertes, point de rendez-vous, voiturier) ; « Utiliser ce texte » la met dans le
  champ, le gérant relit puis enregistre ; un texte qui cite un chiffre absent des données est écarté (`ANTHROPIC_API_KEY`,
  modèle `LISTING_DESCRIPTION_MODEL`, Claude Opus 5.5 par défaut).
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
- [ ] Jalon 4 — Cartographie et affectation. **Capacité = places du plan (09/10/2026)** : dès que le plan a de la
  place, son nombre compte partout (réservations du personnel, imports, aperçu du formulaire, planning, recherche et
  réservation du site, paiement tardif, tableau de bord, Plateforme) : la capacité des files actives, sinon les places
  actives (posées à la main et réservées comprises), sinon le chiffre déclaré (`effectiveCapacity` dans
  `backend/src/domain/capacity.ts`, lu dans la même requête que la charge des nuits) ; la marge s'applique ensuite.
  Le chiffre déclaré (`totalCapacity`) reste enregistré et ne sert que sans plan ; Réglages (web et app) l'affichent en
  lecture seule « Calculé depuis le plan du parking » dès que le plan compte.
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
  --first-name "Prénom" --last-name "Nom" --email gerant@exemple.fr --password "mot-de-passe-solide"
# (--name "Prénom Nom" marche encore : le prénom est le premier mot, le reste est le nom ; un nom vide est refusé)
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

## Avant d'ouvrir aux vrais clients (état au 08/10/2026)

Audit de mise en production du 08/10/2026 (six lecteurs : configuration, paiement et juridique, démonstration et
premier loueur, exploitation, sécurité, app et notifications). Le code est prêt ; ce qui suit est hors code ou demande
une décision de Joanny. Cocher au fur et à mesure.

**Décisions à prendre**
- [ ] **Paiement en ligne réel ou saisie manuelle au lancement.** Les clés Stripe de production sont des clés de test
  (`pk_test_` servie par `/api/public/payments/config`) et `STRIPE_ALLOW_LIVE` est repassé à `false` le 08/10/2026 : une clé
  `sk_live_` est refusée au démarrage tant que la variable n'est pas `true` (à poser dans le même geste que les clés live ;
  le cron `payouts` de 06:00 UTC fait alors de vrais virements). Avant une clé live : validation
  juriste / expert-comptable (statut, TVA, mandat d'encaissement), compte Stripe de Plazo Aéroports activé, Connect en
  live, webhooks live vers `https://www.plazo.fr/api/public/stripe/webhook` (deux `whsec_` dans `STRIPE_WEBHOOK_SECRET`),
  libellé de relevé « PLAZO ». Vérifier que les trois clés Stripe sont du même mode (`sk_`, `pk_`, `whsec_`). Avec une
  clé de test, aucune vraie carte ne passe et le site ne le dit pas.
- [ ] **Commission** : 10 % TTC par défaut (`PLATFORM_COMMISSION_BPS=1000`), surcharge par loueur dans Plateforme ›
  Loueurs ; à confirmer avec le client n°1 et l'expert-comptable (HT ou TTC, TVA de Plazo), figée dans chaque paiement.
- [x] **Parkings de démonstration** : archivés le 09/10/2026 (demande de Joanny, « archive tous les parkings de démo ») :
  `DEMO_LISTINGS=archive` sur Vercel, le build suspend les quatre loueurs fictifs (`[seed-demo] Archived 4 demo operator(s)` dans
  le journal), qui disparaissent du site, de l'app et de `/api/public/search` et dont les comptes sont refusés ; ils restent en
  base, `true` les rétablit. **Archivés le 09/10/2026** (« archive les parkings suspendus ») : `Operator.archivedAt`, posé par
  la migration `operator_archived` sur tout loueur suspendu à son déploiement et par `DEMO_LISTINGS=archive` ; un loueur archivé
  quitte Plateforme › Loueurs (filtre « Archivés ») et Annonces, et les tâches automatiques (rappels, suivi des vols, préparation
  des files ; les reversements continuent) ; « Désarchiver » le ramène suspendu, « Réactiver » actif. Retrait définitif : `DEMO_LISTINGS=remove` puis redéployer et vérifier
  `[seed-demo] Removed` dans le journal du build (irréversible : supprime aussi toute réservation faite sur une démo), puis
  supprimer `DEMO_LISTINGS` et `DEMO_SEED_PASSWORD`.
- [ ] **Vercel Pro** : l'offre Hobby est réservée à un usage non commercial, plafonne à 100 déploiements par jour, garde
  les journaux une heure et n'offre que des crons quotidiens (100 par projet, déclenchés à ± 59 min : les six de
  `vercel.json` passent). Pro (~20 $/mois) lève tout cela (Vercel › Settings › Billing).
- [ ] **Dépôt GitHub public** : `Benford-Tech/plazo` est public (code, CLAUDE.md, cette liste, le schéma des adresses de
  réception ; aucun secret trouvé dans l'historique). Le passer en privé (Settings › General › Change visibility) sauf
  volonté d'ouvrir le code (vérifier d'abord que Codemagic est relié par l'application GitHub, sinon ses pipelines ne
  pourront plus cloner un dépôt privé) ; dans les deux cas activer Secret scanning + Push protection (Settings › Code security).
- [ ] **Suivi des vols** : le plan gratuit AeroDataBox (RapidAPI) tient un ou deux jours ; choisir AeroDataBox payant,
  FlightAware AeroAPI (`FLIGHTAWARE_API_KEY`), ou accepter le suivi dégradé (« J'ai atterri » reste).
- [ ] **Pages légales** : encore « projet à valider par un juriste », non indexées ; après relecture, retirer le bandeau et
  le `noindex` (`site/src/lib/legal.ts`, `LEGAL_VERSION`). Désigner un médiateur de la consommation (obligatoire).
- [ ] **Factures** : Plazo n'émet ni facture ni reçu ; choisir reçu Stripe (Settings › Emails › Paiements réussis) + facture
  du parking, ou facture Plazo avec mandat de facturation.
- [ ] **Apps** : identifiants `com.benfordtech.*` définitifs ou non (plus modifiables après le premier envoi) ; publier
  Plazo Pro seule d'abord (lancer `plazo-pro-android-release` puis `plazo-pro-ios-release` à la main) ou les deux (tag
  `mobile-vX.Y.Z`).
- [ ] **SMS** : « Plazo envoie pour moi » n'a aucun crédit SMS Brevo ; recommander « Téléphone du parking ».

**À faire par Joanny (tableaux de bord)**
- [x] Vercel (Claude, 08/10/2026) : `PLATFORM_BOOTSTRAP_PASSWORD` neutralisée (valeur vide, cible `development` ; l'API
  ne supprime pas une variable : la supprimer dans Settings › Environment Variables) ; `SECRET_KEY`, `CRON_SECRET` et
  `SITE_API_KEY` sont bien 32 octets aléatoires (64 hex) ; `INBOUND_EMAIL_SECRET` a été saisie à la main (type sensitive,
  illisible : le relais répond 200, donc elle correspond à celle du Worker) ; les six crons quotidiens sont acceptés par le
  plan Hobby et `remind-tomorrow` a été vu à 19:02 UTC ; `FALLBACK_ADDRESS` déplacée hors production (cible `development`,
  rien ne la lit sur Vercel : voir GitHub ci-dessous) ; le domaine `web-eight-indol.vercel.app` a été retiré du projet le
  08/10/2026 au soir. Reste à supprimer les deux variables neutralisées dans le tableau de bord.
- [ ] cron-job.org : le moniteur `/api/health` tourne bien (vu toutes les 5 min), mais **aucun appel de `remind-tomorrow` ni de
  `booking-digest`** dans les journaux Vercel (08/10/2026, 18:50 → 20:06 UTC : un seul passage de `remind-tomorrow` à 19:02,
  celui du cron Vercel) : vérifier l'URL exacte `https://www.plazo.fr/api/internal/cron/remind-tomorrow` (pas `plazo.fr` : la
  redirection 308 n'atteint pas l'API), l'en-tête `Authorization: Bearer <CRON_SECRET>` et l'historique d'exécution ; ajouter le
  **récapitulatif horaire** `GET https://www.plazo.fr/api/internal/cron/booking-digest` à la minute 0 de chaque heure (même
  en-tête), sans quoi il ne part jamais ; notifications « on failure » sur chaque tâche ; tant que Vercel reste en Hobby (une
  heure de journaux, aucune trace le matin), doubler aussi les cinq crons de nuit (`purge-expired-tokens`, `expire-payment-holds`,
  `prepare-files`, `track-return-flights`, `payouts`, tous idempotents) une fois par jour sur cron-job.org avec « Save responses » ;
  ajouter `GET https://www.plazo.fr/api/health?deep=1` toutes les 15 minutes (pas plus souvent : la base doit pouvoir se
  mettre en veille) : il interroge la base et répond 503 « degraded » si elle ne répond pas en 3 s ; ajouter
  `track-return-flights` toutes les 10 minutes de 05:00 à 23:50 dès que le plan de suivi des vols le permet. Depuis le
  08/10/2026, `remind-tomorrow`, `track-return-flights` et `payouts` répondent 500 quand tout ce qui a été tenté a échoué
  (rien n'est parti, aucun vol lu, aucun virement) : l'alerte « on failure » suffit.
- [ ] GitHub › Settings › Environments › Production (Claude n'y a pas accès : l'API des environnements lui est fermée) :
  secret `INBOUND_EMAIL_SECRET` (le déploiement du 08/10 à 16:08 a
  signalé « not set in the Production environment » : le Worker garde celui posé à la main, mais chaque déploiement doit
  le reposer) et variable `FALLBACK_ADDRESS` (posée sur Vercel par erreur le 08/10 : elle n'y est lue par rien ; une boîte
  Plazo plutôt que personnelle : les mails égarés contiennent des données de voyageurs), puis relancer le job `deploy` de
  « Email worker CI » et vérifier que `env.FALLBACK_ADDRESS` apparaît dans sa sortie.
- [ ] Cloudflare › DNS : `www` et l'apex sont **proxiés** (nuage orange : `server: cloudflare` sur www.plazo.fr) ; passer les
  deux en « DNS only » (nuage gris) vers les cibles affichées dans Vercel › Settings › Domains (un CNAME pour `www`, des
  enregistrements A pour l'apex), pour que Vercel (pare-feu, journaux) voie les vraies adresses. Depuis le 08/10/2026 l'API
  et le site lisent eux-mêmes l'adresse du visiteur derrière le proxy (`cf-connecting-ip`, acceptée seulement quand la
  requête vient des plages publiées de Cloudflare : `backend/src/domain/client-ip.ts`, `site/src/lib/client-ip.ts`), donc
  les limites de débit ne sont plus faussées ; le changement de DNS n'est plus bloquant. Email Routing (MX) n'est pas concerné.
- [ ] Brevo : authentifier `plazo.fr` (DKIM `mail._domainkey`, DMARC `_dmarc` chez Cloudflare, SPF gardant
  `include:_spf.mx.cloudflare.net`) ; plan Free = 300 mails/jour avec logo Brevo, Starter pour lever les deux.
- [ ] Neon : vérifier la fenêtre de restauration du plan gratuit ; sauvegarde manuelle avant l'ouverture puis chaque
  semaine : `pg_dump "$DATABASE_URL_UNPOOLED" --no-owner -Fc -f plazo-$(date +%F).dump`, conservée hors Vercel ; surveiller
  les CU-heures consommées (plan Free : 100 CU-heures de calcul par mois ; le tableau de bord pro interrogé toutes les 12 à
  60 s et le cron de 15 min empêchent la base de se mettre en veille) et prévoir le plan Launch avant que l'équipe du client
  n°1 n'utilise l'espace pro tous les jours ; activer les alertes d'usage par e-mail dans la console Neon.
- [ ] Stores (pas à pas : `mobile/publier-sur-les-stores.md`) avec les comptes qui publient déjà Thempo, LoveNest et Yoon
  (Apple Benford Tech `3BX4795V2Y`, Google Play Benford Tech, équipe Codemagic avec `lovenest-asc`) : Plazo ajouté à
  l'équipe Codemagic (facturation active), clé d'import `plazo_upload` dans ses Code signing identities, groupe
  `mobile_secrets` (`GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` : le compte de service de Thempo, ouvert aux deux apps Plazo),
  App ID et apps chez Apple, deux profils App Store avec le certificat existant puis « Fetch profiles », deux apps chez
  Google, premier AAB à la main, `APP_STORE_APP_ID` ; identifiants des apps confirmés avant tout envoi ; OneSignal : les deux
  apps et leurs clés Vercel existent, reste APNs et FCM sur chacune.
- [ ] `product.json` › `company` : forme juridique, capital, siège, RCS, TVA, téléphone, directeur de la publication,
  médiateur, et une adresse support réelle (aujourd'hui `support@example.com`) ; Claude les pose puis
  `dart run tool/sync_product.dart`.
- [ ] Client n°1 : inscription libre (`/pro/inscription`) ou invitation (Plateforme › Loueurs), e-mail confirmé, fiche
  envoyée puis validée (Plateforme › Annonces), canal SMS réglé (Mon compte › SMS aux voyageurs, « Téléphone du parking »),
  Stripe Express relié avant le premier reversement, pushs activés par chaque membre dans Plazo Pro (Plus › Notifications),
  mail de transfert de la messagerie (assistant « Relier votre boîte mail », transfert global désactivé).

**Référencement (audit du 08/10/2026 : on-page, SERP et concurrents, performance, local, contenus ; 39 constats confirmés)**
- Réalité : domaine de deux jours, une seule URL indexable (`/`, ~1 100 mots), aucun parking réel, aucun avis ; rien n'est
  encore indexé (`site:plazo.fr` vide sur Google et Bing). La SERP « parking aéroport lyon » appartient à Parkos (4 200 mots,
  FAQPage, milliers d'avis), Parclick, Onepark (six guides Lyon), Holiday Extras, ParkMundo, Allopark et lyonaeroports.com ;
  le pack local est aux exploitants. « Tête de liste » sur cette requête n'est pas atteignable en 2026. Objectifs réalistes :
  3 mois → indexé, 1er sur « plazo parking », page 1 sur « <client n°1> parking » ; 6 mois → page 1 sur deux ou trois requêtes
  de longue traîne (longue durée, voiturier, prix d'une semaine) ; 12 mois → page 1 sur la requête principale, avec des avis
  et des liens.
- [ ] Search Console : l'enregistrement TXT `google-site-verification` est déjà dans le DNS Cloudflare ; ajouter la propriété
  Domaine `plazo.fr`, soumettre `https://www.plazo.fr/sitemap.xml`, demander l'indexation de `/` ; Bing Webmaster Tools par
  « Import from Google Search Console ».
- [x] Parkings de démonstration archivés le 09/10/2026 (« archive tous les parkings de démo ») : `DEMO_LISTINGS=archive` sur
  Vercel, les quatre loueurs fictifs sont suspendus au build suivant (plus sur le site, dans l'app ni dans `/api/public/search`,
  comptes de démo refusés) et restent en base ; `true` les rétablit, `remove` les supprime. Tant que la fiche du client n°1
  n'est pas publiée, la page d'accueil dit « Aucun parking n'est encore en ligne » au-dessus du guide.
- [ ] Google Business Profile du **client n°1** (Plazo n'y est pas éligible : place de marché) : catégorie « Parking », NAP
  identique à sa fiche Plazo, lien de réservation `https://www.plazo.fr/lyon-saint-exupery/<slug>`, routine d'avis Google.
- [ ] `product.json › company` et une adresse support réelle avant tout contact presse ou annuaire (`/mentions-legales`
  affiche encore « [à compléter] »).
- Directions à trancher (09/10/2026, voir les propositions de Claude) : **A** guide Lyon étoffé (parkings officiels P0–P5
  chiffrés et datés, FAQ avec les questions « People also ask ») et trois pages d'intention sous `/lyon-saint-exupery/guide/…`
  (pas cher et prix d'une semaine, longue durée, voiturier) ; **B** avis après séjour (table `reviews`, « Notez votre séjour »
  dans le mail de clôture, AggregateRating) et fiche parking plus riche (grille de prix visible, titre « dès X €/semaine ») ;
  **C** technique et vitesse (pages aéroport et fiche en ISR, MapLibre différé, photo LCP, favicon, lastmod) ;
  **D** notoriété (presse travel-tech et lyonnaise, annuaires, pages `/presse` et `/pour-les-loueurs`).
- Fait le 09/10/2026 (**A**, « 4 200 mots, FAQ balisée ») : le guide de la page Lyon fait ~6 400 mots (14 sections, 3 tableaux,
  19 questions, toutes dans le FAQPage avec les 4 générales) : parkings officiels P0 à P7 (emplacement, temps de marche jusqu'au
  Terminal 1, hauteur, bornes) et grille 2026 sans réservation (24 h → 1 mois), parkings privés, prix par durée, longue durée, pas
  cher, navette, voiturier, couvert / électrique / moto / véhicules hauts, accès, saisons, fonctionnement de Plazo, annulation,
  check-list. Faits de l'aéroport dans la constante `LYON_OFFICIAL` (`site/src/lib/airport-guides.ts`), relevés le 08/10/2026 sur
  la grille tarifaire PDF et les pages de lyonaeroports.com puis vérifiés à nouveau le 09/10/2026 par une relecture contradictoire
  (49 corrections confirmées : **Terminal 2 fermé pour travaux depuis le 01/04/2026**, tous les vols au Terminal 1 ; P1 géré par
  Lyon Parc Auto, exclu de l'annulation gratuite et de la garantie retard ; P5 à 2,60 m sur la page des parkings contre 2,50 m sur
  la grille ; P7 saisonnier sans limite de hauteur ; P4 Elec et P5 Elec réservables ; marge conseillée 2 h / 2 h 30 / 3 h ;
  itinéraires A46, A48, A46 Sud ; aucune promesse au-delà des CGV : un retour tardif est une prolongation facturée par le parking),
  puis une seconde passe (41 corrections : service voiturier de l'aéroport ; le P7 présenté par l'aéroport comme son parking le
  moins cher ; navettes des parkings extérieurs arrêtées là où le règlement de l'aéroport les autorise, pas « devant le
  terminal » ; annulation 4 h avant au P7 ; P5 robotisé limité à 2,30 m ; ce que contiennent vraiment la confirmation, le rappel,
  le SMS d'atterrissage et Ma réservation).
  À relire avant toute modification et à chaque nouvelle grille annuelle. Les chiffres des partenaires restent ceux de `guideFacts`
  (aucun sans parking réel).
- Fait le 09/10/2026 (« fais les trois pages guide ») : `/lyon-saint-exupery/guide/parking-pas-cher` (~2 900 mots, 11 questions),
  `…/parking-longue-duree` (~3 050 mots, 9 questions, partenaires chiffrés pour deux semaines) et `…/parking-voiturier` (~3 050
  mots, 10 questions, partenaires avec voiturier seulement) : H1, recherche préremplie, parkings partenaires réels de la page
  (aucun tant qu'aucun n'est en ligne), guide avec « Sur cette page », questions fréquentes, autres guides ; JSON-LD Article,
  FAQPage et BreadcrumbList ; dans le plan du site, le pied de page et le guide de l'accueil. Chaque page a été rédigée puis
  relue par trois relecteurs (faits, règles de Plazo, français) avec contre-vérification de chaque constat : 27, 35 et 32
  corrections. Sources datées du 09/10/2026 : grille tarifaire 2026, pages et FAQ de lyonaeroports.com, store.lyonaeroports.com
  (voiturier Alyse Premium et Ector, P5 robotisé, P7), règlement des parcs 2024, rhonexpress.fr. À relire à chaque nouvelle
  grille annuelle ou changement de l'aéroport (contenus dans `site/src/lib/guides/lyon-*.ts`).
- Fait le 09/10/2026 : les segments du site (`recherche`, `guide`, `avis`…) ne peuvent plus être pris comme adresse de fiche
  (`RESERVED_LISTING_SLUGS`, erreur `slug_reserved`).
- Fait le 09/10/2026 (**C**, « technique et vitesse ») : la page d'accueil répondait en 1,7 à 2,1 s (rendue à chaque visite,
  deux appels à l'API ; Lighthouse mobile 69, « document latency » ~1,6 s). La page aéroport (et `/`, réécrit vers elle) et les
  trois guides sont désormais en **ISR** (`revalidate` 300 s, plafonné à 60 s par la lecture de `/public/config` du layout ;
  rien n'est rendu au build, `generateStaticParams` vide) sur des **lectures partagées** (`sharedRead` dans `site/src/lib/api.ts` :
  sans l'IP du visiteur, cache de 300 s ; `api.airport`, `api.sharedSearch` pour le séjour par défaut ; la recherche du voyageur
  et la fiche restent rendues à chaque visite). En local : 1,2 s au premier passage, 8 ms ensuite. `/lyon-saint-exupery`
  redirige (308) vers `/` ; le plan du site donne la date de relecture des guides (`lastmod`) ; `favicon.ico` (16/32/48 px,
  `site/src/app/favicon.ico`, tiré d'`icon.svg`). Restent : MapLibre (≈ 1,3 s de blocage du fil principal au chargement sur
  mobile) et une seule redirection pour `http://plazo.fr` (aujourd'hui deux : → `https://plazo.fr` → `https://www.plazo.fr`,
  règle de redirection Cloudflare à poser).

**Fait le 08/10/2026 (code)** : accès Plateforme réservé à un e-mail vérifié ; Swagger coupé en production ; secret du
relais mail accepté en en-tête seulement ; libellés échappés sur la carte des navettes ; app par défaut sur
`https://www.plazo.fr/api` ; `ITSAppUsesNonExemptEncryption` dans `Info.plist` ; prévisualisations Vercel coupées pour
les branches `claude/*`. **Fait le 08/10/2026 (Vercel, soir)** : `main` (`f6e9aee`) en production à 19:51 UTC ; **Ignored
Build Step « production seulement »** (Settings › Build and Deployment ; à repasser sur « Automatic » pour retrouver des
prévisualisations) : jusque-là toute branche construisait une prévisualisation qui lançait `prisma migrate deploy` sur la base
de production avec les secrets de production (variables Neon et clés présentes aussi en `preview`) ; les builds annulés
comptent quand même dans les 100 déploiements par jour (`git.deploymentEnabled` évite même la création pour `claude/*`) ;
`vercel-build` compile d'abord puis ne migre et ne lance les scripts qu'en production (`VERCEL_ENV`) ; les 12 Mo de
Swagger UI ne sont plus embarqués dans la fonction ; `STRIPE_ALLOW_LIVE=false` ; `STRIPE_SUPPRESS_NOTICES=true` (l'avis du SDK
Stripe n'encombre plus la liste des erreurs) ; les `logger.error` / `warn` arrivent enfin aux niveaux « error » / « warning »
des journaux Vercel (tout partait en « info » sur stdout). **Fait le 08/10/2026 (code, nuit)** : `GET /api/health?deep=1`
(base interrogée, 503 « degraded ») ; `remind-tomorrow`, `track-return-flights` et `payouts` répondent 500 quand tout ce qui a
été tenté a échoué (`failed` / `errors` dans le JSON) ; adresse du visiteur lue derrière le proxy Cloudflare (API et site) ;
relance d'un SMS de passerelle réservée par ligne (plus de doublon quand Vercel et cron-job.org appellent `remind-tomorrow`
au même instant) ; nouvelles adresses de réception à 8 caractères aléatoires (les existantes ne changent pas) ; lecture des
mails par Claude avec 4 000 jetons de réponse. **Reste côté code, sur
décision** : reversement « payé à la main » (sinon double paiement si
Joanny vire puis que le loueur relie Stripe),
App Links sur `www.plazo.fr` (empreinte Play et Team ID Apple à fournir), plafond quotidien des lectures Claude par
loueur et liste d'expéditeurs admis (les adresses créées avant le 08/10/2026 n'ont que 16 bits d'aléa : « Nouvelle adresse »
en donne une à 32 bits), `maxDuration` à 300 s (Hobby avec Fluid compute) avec un budget de temps dans `runPayouts` et
l'envoi des rappels, une CSP en « report-only » sur l'espace pro et le site, et un magasin partagé pour les limites de débit
(aujourd'hui en mémoire de chaque instance : acceptable pour un seul loueur).

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
   des mails), pour la proposition des zones, la lecture des mails et la rédaction de la présentation par Claude `ANTHROPIC_API_KEY` (et
   `ZONE_SUGGESTION_MODEL`, `EMAIL_READING_MODEL`, `LISTING_DESCRIPTION_MODEL`, facultatifs), pour les mails et SMS `BREVO_API_KEY`, `EMAIL_FROM`, `SMS_SENDER`,
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
   Les autres opérateurs se créent par l'inscription libre (`/pro/inscription`) ou par une invitation depuis
   `/pro/plateforme/loueurs` ; depuis un poste, `npm run seed:operator` dans `backend/`, avec `DATABASE_URL` **et**
   `DIRECT_URL` pointés sur la connexion directe Neon (`DATABASE_URL_UNPOOLED`), crée le loueur, son parking et un gérant
   déjà vérifié, sans fiche Plazo (le gérant la crée dans `/pro/plazo/fiche`).
   **Données de démonstration** (facultatif) : pour essayer le site et les apps avec des parkings fictifs,
   mettre `DEMO_LISTINGS=true` et `DEMO_SEED_PASSWORD` (10 caractères minimum) sur Vercel et redéployer. Le
   déploiement crée (ou rafraîchit, sans doublon) cinq loueurs fictifs autour de Lyon Saint-Exupéry (Parkair Lyon,
   Aéroparc Saint-Exupéry, Les Hangars de Colombier, Parking Premium Terminal, EcoPark Pusignan), chacun avec
   une fiche publiée, une grille de tarifs de 1 à 15 jours, un point de rendez-vous et une navette, plus trois
   réservations à venir chez Parkair Lyon. Comptes gérants : `demo-<slug>@plazo.test` (par exemple
   `demo-parkair-lyon@plazo.test`), mot de passe `DEMO_SEED_PASSWORD` (jamais modifié pour un compte existant).
   Ces loueurs portent la marque « Démo » sur le site, dans l'app et dans l'espace Plateforme. Pour les archiver :
   `DEMO_LISTINGS=archive` et redéployer (suspend les loueurs de démo, qui disparaissent du site et des apps mais restent
   en base ; `true` les rétablit). Pour les retirer : `DEMO_LISTINGS=remove` et redéployer (supprime uniquement les
   loueurs marqués démo, avec leurs fiches, comptes et réservations), puis enlever la variable. Depuis un poste :
   `npm run seed:demo -- --apply`, `--archive` ou `--remove` dans `backend/`. Le script n'échoue jamais le déploiement
   et ne journalise que des comptages.

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
     Webhooks*, créer une destination vers **`https://www.plazo.fr/api/public/stripe/webhook`** pour les
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
   [mobile/README.md](mobile/README.md)). L'app voyageur a sa propre app OneSignal (un Bundle ID iOS par app OneSignal) :
   `ONESIGNAL_TRAVELLER_APP_ID` et `ONESIGNAL_TRAVELLER_REST_API_KEY` sur Vercel (les deux App ID sont aussi écrits dans
   `codemagic.yaml`, `vars: ONESIGNAL_APP_ID` de chaque workflow : rien à créer dans Codemagic) ;
   sans elles l'API passe par l'app du personnel, qui ne connaît pas les téléphones des voyageurs.
   « Prévenir de son arrivée » n'a besoin d'aucune nouvelle tâche planifiée : les signaux de plus de 2 h sont terminés
   (position effacée) à chaque lecture et par la purge nocturne existante ; `/api/internal/cron/expire-arrival-signals`
   existe pour une passe plus fréquente si besoin.

7. **Synchronisation de la boîte mail (M-A, 06/10/2026 ; réception par Cloudflare depuis le 08/10/2026)** — facultatif :
   sans `INBOUND_EMAIL_DOMAIN` et `INBOUND_EMAIL_SECRET`, le bloc « Mails entrants » des réglages explique que la
   réception n'est pas configurée.
   Principe : chaque loueur a son adresse `<slug>@<INBOUND_EMAIL_DOMAIN>` dès sa création (08/10/2026 ; migration
   `inbound_slug_for_all` pour les loueurs plus anciens ; Parking › Réglages, assistant « Relier ma boîte mail ») et crée
   dans sa messagerie une règle qui lui transfère les mails des comparateurs ; **Cloudflare
   Email Routing** reçoit le domaine (gratuit, adresses illimitées, aucune boîte mail à créer) et passe chaque mail au
   relais [`email-worker/`](email-worker/README.md), qui l'envoie tel quel (`message/rfc822`, enveloppe en en-têtes) à
   `POST /api/public/inbound/email` avec l'en-tête `X-Inbound-Secret`, l'API le décodant elle-même ; un mail reconnu et complet (Allopark, Onepark, Parclick, ParkMundo ; un mail Allopark aux champs vides est complété par la page de la réservation vers laquelle il renvoie, 10/10/2026) crée la réservation (canal comparateur, doublon refusé
   par la référence externe, push « Nouvelle réservation » à ceux qui le veulent à chaque réservation, sinon le récapitulatif
   horaire) ; un mail incomplet ou inconnu attend dans la **boîte de réception** « Mails à vérifier » (`/pro/reservations/a-verifier`,
   alerte du tableau de bord ; M-A du 08/10/2026 : liste et volet de lecture, onglets « À traiter · Traités · Archivés »), où
   l'équipe le complète dans le formulaire prérempli, le marque comme traité, l'archive (T-A) ou en relance l'analyse (10/10/2026 ; la page de réservation Allopark est cherchée dans tout le mail et aux adresses du parking, son prix est lu, et une vérification anti-robot n'est jamais contournée : le mail donne alors le lien « Ouvrir la page Allopark » ; une modification Allopark est appliquée à la réservation depuis la page, sauf cas risqué laissé à l'équipe avec la raison). **Lecture par Claude (L-A,
   08/10/2026)** : un mail qu'aucun importateur ne reconnaît est lu par Claude (`ANTHROPIC_API_KEY`, modèle `EMAIL_READING_MODEL`,
   Claude Opus 5.5 par défaut) : réservation complète et sûre → créée aussitôt (source lue en canal) ; sinon « À traiter »
   pré-rempli ; annulations et modifications signalées, jamais appliquées seules. Texte des mails gardé 30 jours,
   lignes 90.
   Mise en place (domaine gardé chez Hostinger, DNS chez Cloudflare, Email Routing sur `plazo.fr` lui-même car Cloudflare
   n'offre le « catch-all » que sur le domaine principal (R-A, 08/10/2026), Worker, règle `reservations@` vers la boîte de
   Plazo, variables Vercel) : voir [`email-worker/README.md`](email-worker/README.md).

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
     parking, point de rendez-vous au retour, « le jour du dépôt » en étapes), rappel la veille (mail + SMS + push, à l'heure
     et avec le texte choisis par le parking dans « SMS de la veille », voir plus bas), push « Votre voiture est garée » (place et crochet) quand le voiturier la place, push « Bon voyage ! »
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

### SMS de la veille et planificateur externe

Chaque parking choisit dans **Réservations › SMS de la veille** l'heure du rappel (16:00 à 21:30), son texte, et peut
décaler ou mettre en pause une soirée. Vercel Hobby ne lance une tâche planifiée qu'une fois par jour : la route
`/api/internal/cron/remind-tomorrow` est donc appelée **toutes les 15 minutes par un planificateur externe gratuit**
(cron-job.org). Le Vercel Cron de 19:00 UTC reste un filet si le planificateur s'arrête (les rappels partent alors à
21:00 l'été, 20:00 l'hiver). Appeler la route plusieurs fois ne renvoie rien en double ; elle relance aussi les SMS en
attente du téléphone du parking. Mise en place :
1. Créer un compte gratuit sur [cron-job.org](https://cron-job.org), puis **Create cronjob**.
2. *Title* « Plazo · SMS de la veille », *URL* `https://www.plazo.fr/api/internal/cron/remind-tomorrow`, *Execution
   schedule* **Every 15 minutes**.
3. Onglet *Advanced* : méthode **GET**, en-tête **`Authorization`** = `Bearer ` suivi de la valeur de `CRON_SECRET` (Vercel ›
   Settings › Environment Variables), *Timeout* au maximum.
4. Enregistrer, puis **Test run** : la réponse doit être `200` avec `{"checked":…,"sent":…,"sms":{…}}` ; un `401` signale
   un secret erroné.

**Récapitulatif horaire des réservations (N-A, 08/10/2026)** : la route `/api/internal/cron/booking-digest` envoie, chaque heure
pile, un push « N réservations reçues » aux membres réglés sur « récapitulatif horaire » (les gérants par défaut), tous canaux
confondus (hors attentes de paiement et annulées), et rien entre 22 h et 07 h (le récapitulatif de 07 h couvre la nuit). Un second cronjob sur cron-job.org, de la même
façon : *Title* « Plazo · Récapitulatif horaire », *URL* `https://www.plazo.fr/api/internal/cron/booking-digest`, *Execution
schedule* **Every hour at minute 0**, même en-tête `Authorization`. Un appel de trop ne renvoie rien en double (un récapitulatif
de moins de 50 minutes est passé) ; la réponse attendue est `{"operators":…,"sent":…,"skipped":…}`.

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
  Possible aussi pendant l'invitation (09/10/2026) : la plateforme prépare le parking (réglages, plan, fiche, tarifs)
  avant que le gérant accepte, et il retrouve tout en se connectant ; la colonne « Annonce » montre la fiche préparée.
  Chaque écriture est tracée dans le journal (`audit_logs`, action `view_as.write`) au nom réel du super admin ;
  l'équipe, les mots de passe et le compte du loueur restent en lecture seule. Dans la boîte de réception des mails, le
  super admin peut « Archiver » (10/10/2026) ; « Marquer comme traité » et le rattachement restent au loueur.
- **Suspension** : l'équipe du loueur est déconnectée et ne peut plus se connecter, ses fiches quittent le site.
- **Suppression** (09/10/2026) : « Supprimer » sur un loueur invité dont l'invitation n'a jamais été acceptée, ou sur un
  loueur suspendu (archivé ou non). La confirmation dit ce qui part (parkings, fiche et tarifs, réservations, comptes de
  l'équipe), puis tout est effacé, sans retour possible. Jamais le compte de la plateforme ; jamais un loueur qui a reçu un
  paiement en ligne (payé, remboursé ou reversé : la comptabilité le garde, il s'archive), sauf un loueur de démo (paiements de
  test) ; et pas pendant un paiement en cours (« réessayez dans une demi-heure »). Avant d'effacer, Plazo ferme chez Stripe les
  paiements des attentes échues qui pourraient encore passer (aucun argent ne peut arriver sur une réservation disparue ; un
  paiement passé entre-temps garde le loueur). La suppression est tracée dans le journal de la plateforme (`operator.deleted`,
  nom et chiffres du loueur), avec l'effacement lui-même.

## API

Documentation interactive : `/api/docs` (Swagger). Toutes les routes sont sous `/api` (le tableau omet ce préfixe) :

| Méthode | Chemin | Rôle |
|---|---|---|
| POST | `/internal/auth/login` | `{ email, password }` → `{ tokenData: { access, refresh }, user }` |
| POST | `/internal/auth/refresh` | `{ refreshToken }` → nouvelle paire (l'ancienne est révoquée) |
| POST | `/internal/auth/logout` | Révoque la session courante |
| GET | `/internal/staff/me` | Membre connecté |
| PATCH | `/internal/staff/me` | Changer son prénom et son nom `{ firstName, lastName }` (refusé en « Ouvrir son espace ») |
| PATCH | `/internal/staff/me/password` | Changer son mot de passe (déconnecte tous les appareils) |
| GET / POST | `/internal/staff` | Équipe (gérant) |
| PATCH | `/internal/staff/:id` | Rôle, activation, prénom et nom (gérant) |
| POST | `/internal/staff/:id/reset-password` | Mot de passe provisoire (gérant) |
| GET | `/internal/parking` | Parking et capacité : `totalCapacity` / `declaredCapacity` (chiffre déclaré), `effectiveCapacity` et `capacitySource` (`files`, `spots` ou `declared`), `bookableCapacity` (capacité retenue moins la marge) |
| PATCH | `/internal/parkings/:id` | Réglages du parking (gérant, tracé ; `totalCapacity` = chiffre déclaré, utilisé sans plan) |
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
| POST | `/internal/listing/description/suggest` | Claude rédige la « Présentation » de la fiche d'après les vraies données du parking (fiche enregistrée, adresse, aéroport, grille, navettes en service, dessertes, files de voiturier) ; `{ current? }` (≤ 2 000) : améliore ce texte ; rien n'est enregistré → `{ text, model }` ; 409 `ai_unavailable` sans `ANTHROPIC_API_KEY` ou clé refusée, 502 `ai_refused` / `ai_failed`, 503 `ai_busy`, 504 `ai_timeout` (30 s), 502 `ai_unreliable` quand le texte cite un chiffre absent des données, en chiffres ou en lettres devant une unité (`details.figures`), le Terminal 2 ou dépasse 2 000 caractères ; gérant |
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
| POST | `/public/inbound/email` | Relais Cloudflare (M-A) : le mail brut (`message/rfc822`, `X-Inbound-Secret`, `X-Envelope-From` / `X-Envelope-To`, coupé à 4 Mo) ou l'ancien `{ items: [...] }` → `{ received, imported, toCheck, ignored }` |
| GET | `/internal/inbound/settings` | Adresse de réception du loueur, dernier mail, comptages sur 30 jours, mails à vérifier |
| POST | `/internal/inbound/address` | Gérant : renvoie l'adresse (créée avec le loueur) ; `{ regenerate: true }` : nouvelle adresse |
| GET | `/internal/inbound/emails?view=todo\|done\|archived&status=` | Boîte de réception (M-A, 08/10/2026) : un onglet (`todo` par défaut : incomplete et unrecognised ; `done` : imported, duplicate, handled sur 30 jours ; `archived` : 90 jours), du plus récent au plus ancien, `{ data, counts: { todo, done, archived } }` ; `?status=` filtre encore (seul, il cherche dans l'onglet de cet état) ; les confirmations de transfert jamais listées |
| POST | `/internal/inbound/emails/:id/handle` | T-A « Marquer comme traité » → `handled` (imported inchangé ; 409 `archived` ; 404 pour une confirmation de transfert) ; `…/dismiss` : alias déprécié |
| POST | `/internal/inbound/emails/:id/archive` | T-A « Archiver » → `archived` depuis tout état sauf une confirmation de transfert (409 `forwarding`), texte gardé jusqu'à la purge |
| POST | `/internal/inbound/emails/:id/attach` | Rattacher à la réservation saisie (`{ reservationId }`) → `imported`, texte effacé |
| GET / PATCH | `/internal/notifications/preferences` | Ce que chacun reçoit en push : `arrivals`, `returns`, `shuttles`, `platform` (booléens) et `bookings` : `immediate` (push par réservation) \| `hourly` (récapitulatif horaire) \| `never` (N-A, 08/10/2026 ; gérants `hourly` par défaut, autres rôles `immediate`) |
| GET | `/internal/cron/booking-digest` | Planificateur externe, chaque heure pile : « Récapitulatif horaire » des réservations reçues depuis le dernier (tous canaux) aux membres en `hourly`, rien de 22 h à 07 h (`Operator.bookingDigestAt`) → `{ operators, sent, skipped }` |
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
| GET | `/internal/platform/operators/:id/deletion` | Ce que la suppression effacerait (`counts`) et si elle est possible (`deletable`, `reason`) |
| DELETE | `/internal/platform/operators/:id` | Supprimer un loueur et tout ce qui en dépend (400 `cannot_delete_platform`, 409 `not_suspended` / `has_payments` / `payment_in_progress`) |
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
| GET | `/internal/platform/geo/buildings?bbox=` | Bâtiments BD TOPO de la vue (B-A, même relais) |
| POST | `/internal/parkings/:id/plan/suggest-zones` | V-A : Claude lit la photo IGN du terrain et propose les zones (corps `{ allowGrass }`, vrai par défaut ; rien n'est enregistré ; 409 `ai_unavailable` sans `ANTHROPIC_API_KEY`) |
| POST | `/internal/parkings/:id/plan/spots` | P-B : places posées à la main (rangée tracée sur la carte), gardées à la régénération ; 400 `duplicate_code` |
| POST | `/internal/parkings/:id/plan/apply-capacity` | Copie le nombre de places actives dans le chiffre déclaré (anciennes versions de l'app ; depuis le 09/10/2026 le plan compte de lui-même) |
| DELETE | `/internal/parkings/:id/plan/spots/:spotId` | P-B : retire une place posée à la main (409 `not_manual` pour une place générée) |
| GET | `/internal/parkings/:id/files` | S-C : les files du parking avec leur pile (allée → fond), les arrivées à placer avec la file choisie, « à sortir aujourd'hui » |
| PUT | `/internal/parkings/:id/files` | S-C : enregistre les files du plan (code, capacité, trait) ; 400 `duplicate_code`, 409 `file_occupied` |
| GET | `/internal/parkings/:id/files/choices?reservationId=` | S-C : les files classées pour une réservation |
| POST | `/internal/parkings/:id/files/from-plan` | S-C : crée les files depuis les files de places du plan peigne (409 `no_valet_spots`) |
| POST | `/internal/parkings/:id/files/prepare` | S-C : préparation de la veille à la demande (files vides gardées pour les gros jours de retour) |
| POST | `/internal/reservations/:id/file` | S-C : range la voiture dans une file (devant les autres) ou l'en retire (`fileId: null`), avec le crochet des clés ; 409 `file_full` |
| GET | `/internal/parkings/:id/files/planning?from=&days=` | S-C : planning des files (par jour : retours, en file / à venir, files qui servent, files gardées, place, manque ; alertes `missing_room`, `over_capacity`, `unsound`) |
| PUT | `/internal/parkings/:id/files/:fileId/keep` | S-C : garde une file vide pour un jour à la main (`{ day }`, `keptByHand`) ou la libère (`{ day: null }`) ; 409 `file_occupied`, 400 `invalid_day` / `file_inactive` |
| GET | `/internal/cron/prepare-files` | S-C : préparation de la veille de tous les parkings en files (Vercel Cron 02:00 UTC) |
| GET | `/internal/platform/geo/geocode?q=` | Recherche d'adresse (relais vers le géocodage de la Géoplateforme) |
