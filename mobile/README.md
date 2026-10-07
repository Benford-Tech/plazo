# Application mobile (Flutter)

Un seul projet, deux apps (flavors `traveller` et `pro`, décision A-B du 04/10/2026) : **Plazo** pour le voyageur
(trois onglets Rechercher / Mes réservations / Plus) et **Plazo Pro** pour le personnel (quatre onglets Aujourd'hui ·
Réservations · Parking · Plus). Depuis le 04/10/2026, l'app voyageur n'embarque plus l'espace pro : les routes `/pro…`
n'existent que dans Plazo Pro (`if (AppConstants.isPro)` dans `app_router.dart`).

- **Voyageur — réserver** (maquettes A1 à A5, mêmes chemins que le site) : recherche (aéroport, « Vos dates » en
  feuille : créneaux de 30 min, pas avant aujourd'hui à l'heure du parking, retour après le dépôt, jours comptés comme
  l'API), résultats `/:aeroport/recherche` en liste ou sur la carte IGN (pastilles de prix, mêmes tris et filtres que
  le site), fiche `/:aeroport/:parking` (À l'aller, Au retour, Tarifs, Accès, Itinéraire ; barre « Réserver » avec le
  prix total de l'API, « Réservation en ligne bientôt disponible » si le loueur n'encaisse pas encore), réservation
  `/:aeroport/:parking/reserver` (mêmes champs et contrôles que le site, erreurs de l'API traduites), paiement
  `/ma-reservation/REF/paiement` (compte à rebours de la place tenue, **feuille de paiement native Stripe** avec
  Apple Pay / Google Pay ; la version web passe par Stripe Checkout ; sans paiement en ligne côté serveur, la
  réservation est indisponible, comme sur le site), confirmation « C'est réservé ! ». Aucun prix n'est calculé dans l'app.
- **Voyageur — Mes réservations** (`/ma-reservation`) : les réservations gardées sur le téléphone (référence + clé de
  gestion dans le trousseau, pas de compte), À venir / Passées, « Ajouter une réservation » (référence + email),
  Modifier le vol, Itinéraire, Annuler (règles et remboursement du site), « Je suis en route » le jour J.
- **Voyageur — le jour J** (`/ma-reservation/REF`) : ouvrir sa réservation par le lien reçu par email ou SMS
  (`https://<domaine>/ma-reservation/REF?cle=…`, le même que celui du site) ou par référence + email ;
  le jour J, **prévenir le parking de son arrivée** : partage de la position en direct jusqu'à l'arrivée
  (2 h au plus, puis effacée), ou « J'arrive dans 10 / 20 / 30 min » sans position.
- **Voyageur — le jour du retour** (maquette « Votre retour », `/ma-reservation/REF`) : ligne de temps (vol suivi par
  l'API ou « J'ai atterri », point de rendez-vous, navette, voiture), « Itinéraire vers le point de rendez-vous »
  (`/ma-reservation/REF/point-de-rendez-vous` : chemin piéton IGN calculé par l'API depuis la position du téléphone ou
  le terminal, consignes et photo du loueur, « Ouvrir dans Plans »), « Je suis au point de rendez-vous », puis la
  **navette en direct** (position du chauffeur, ETA, véhicule, prénom ; interrogée toutes les 10 s).
- **Voyageur — ma voiture** (06/10/2026) : carte « Ma voiture » sur la réservation, du dépôt au retour : « Enregistrer où je
  suis garé » (position du téléphone, repère facultatif), corriger, effacer ; « Retrouver ma voiture » mène à l'épingle.
  Si le voiturier a pris la position depuis Plazo Pro, elle prime et ne se change plus dans l'app.
- **Voyageur — pendant le séjour** (bloc « Navette » de `/ma-reservation/REF`, S-A du 04/10/2026) : du jour d'arrivée
  au jour du retour, les navettes du parking en route (véhicule, prénom, sens, carte, distance au parking ou au point de
  rendez-vous), la sienne mise en avant ; interrogé toutes les 12 s (`StayShuttlesBloc`).
- **Pro — mode chauffeur** (`/pro/navette`, bouton « Navette » du planning) : deux sens (T-A du 04/10/2026) : « Aller
  chercher à l'aéroport » (retours à récupérer par terminal avec leur état vol prévu / atterri / au point de rendez-vous)
  ou « Déposer au terminal » (clients arrivés au parking), « Démarrer le trajet (N clients) » après le choix du véhicule
  (le sien présélectionné, places vérifiées, hors service exclus), position partagée avec les passagers jusqu'à
  « Clients récupérés · retour parking » / « Clients déposés au terminal » (90 min au plus).
  En tête de l'écran, la **Ligne du jour** (V-A du 05/10/2026) : les vagues de navettes du jour (`GET /internal/shuttle/forecast`,
  toutes les 30 s ; puces aujourd'hui / demain / après-demain), avec « Démarrer ce trajet » qui présélectionne le sens, la
  desserte et les clients de la vague.
- **Pro — véhicule du jour** (`/pro/vehicule`, V-A du 05/10/2026) : après le poste Chauffeur, « Mon véhicule aujourd'hui »
  (navettes en service, celles prises par un collègue en gris, « Sans véhicule attitré »), enregistré sur le compte
  (`PATCH /internal/staff/me/vehicle`), présélectionné au départ d'un trajet, puis Plus › Mon véhicule.
- **Pro — dessertes et navettes en direct** (D-A et P-A du 05/10/2026) : puces « Desserte » (Aéroport, gare…) au départ
  d'un trajet quand le parking en déclare ; carte « Navettes en cours » (`LiveShuttlesBloc`, `GET /internal/shuttle/live`,
  toutes les 12 s) en tête de l'écran Navette et bandeau sur Aujourd'hui.
- **Voyageur — direction T-A « Parking »** (05/10/2026, T-A + F-A) : fond gris clair, cartes blanches 22 px, plus d'en-tête
  orange, Manrope ; accueil avec la carte du séjour (`SearchBloc.preview`, pilules, carte orange du moins cher) ; jour du
  retour avec l'anneau de compte à rebours (`ReturnRing`) et les pilules « En direct » (`LivePill`) ; écran « Retrouver ma
  voiture » (`FindCarPage`, place du voiturier et itinéraire à pied).
- **Pro — tableau de bord** (05/10/2026, le même que l'accueil de l'espace pro web) : l'onglet Aujourd'hui s'ouvre sur
  « Tableau de bord » (barre « Tableau de bord · Planning ») : cinq tuiles (Sur le parking, Arrivées, Retours, Navettes,
  À traiter), état des services (vols, SMS, notifs, paiements, import), « À traiter maintenant » classé, véhicules sur le
  parking avec place et clés, carte des navettes en cours. Feature `pro_dashboard` (`GET /internal/dashboard`,
  `ProDashboardBloc` toutes les 30 s). Les onglets Arrivées / Retours du chauffeur gardent le planning seul.
- **Notifications navette** (N-A du 05/10/2026) : réglage « Navettes » du personnel ; côté voyageur, le téléphone est
  enregistré pendant le séjour (`PUT /public/bookings/:ref/devices`, `EnableShuttlePushesUseCase`) pour « Votre navette est
  partie » / « est là » — l'app voyageur a sa propre app OneSignal (`ONESIGNAL_APP_ID` à la compilation de ce flavor).
- **Pro — poste du jour** (`/pro/poste`, R-C du 04/10/2026) : « Aujourd'hui, je suis… » après la première connexion, puis
  Plus › Mon poste ; enregistré sur le compte (`PATCH /internal/staff/me/post`), visible du gérant dans Équipe ; les quatre
  onglets de `ProShellPage` suivent le poste (`core/helpers/posts.dart`), les droits restent ceux du rôle.
- **Pro — véhicules de navette** (`/pro/navettes`, gérants, V-A) : fiche de chaque navette (modèle, couleur, plaque,
  places, en service, chauffeur habituel), ajout, modification, retrait.
- **Pro** (`/pro…`) : connexion du personnel (mêmes comptes que l'espace pro), planning du jour
  Arrivées / Retours (onglets sur téléphone, deux colonnes sur tablette) avec les signaux en direct
  (interrogés toutes les 12 s), l'arrivée en approche en tête avec sa mini-carte, et les notifications
  push (OneSignal) réglables par personne : arrivées, retours, ou les deux.

Architecture reprise de `lovenest-frontend` : bloc, auto_route, get_it, retrofit + dio, freezed,
easy_localization (français), OneSignal, Codemagic. Couches par fonctionnalité :
`lib/src/features/<x>/{data/{client,datasources,models},domain/{repositories,usecases},presentation/{bloc,pages,widgets}}`,
injection dans `lib/src/di/`, réseau et erreurs dans `lib/src/core/`. Les erreurs de l'API (`code`, `fields`)
sont traduites par `assets/l10n/fr-FR.json` (clés `errors.<code>`).

Direction visuelle **D** : en-tête orange easyJet `#FF6600` (T-A, 03/10/2026), brun foncé `#2C1A0E` pour les surfaces sombres, accent orange léger `#FF8A3D` (V-A, 03/10/2026), pêche `#f0a36b` pour le temps
fort, dégradé orange léger → pêche sur les actions principales, Playfair Display (titres) + Inter,
cartes arrondies, plaques façon plaque française. Cartes : IGN Géoplateforme « Plan IGN v2 » (sans clé),
attribution « © IGN – Plan IGN ».

Le nom du produit vient de `../product.json` (seul endroit) : `dart run tool/sync_product.dart` le recopie
dans `lib/src/core/constants/product.g.dart`, le libellé Android, le nom iOS et le titre web ;
`--check` échoue s'ils ne sont plus à jour (lancé par Codemagic).

## Commandes

```bash
cd mobile
flutter pub get
dart run build_runner build          # après un changement de modèle, d'état, de client ou de route
flutter analyze
flutter test
dart run flutter_launcher_icons   # icône d'app (Android adaptative, iOS, web) depuis assets/brand/ (copies de /brand)
flutter run --dart-define=API_BASE_URL=http://localhost:3005/api      # API locale (émulateur Android : 10.0.2.2)
flutter build web --dart-define=API_BASE_URL=http://localhost:3005/api # essai dans un navigateur
```

Réglages de construction (`--dart-define`, jamais de secret : ils sont lisibles dans l'app) :

| Nom | Défaut | Rôle |
| --- | --- | --- |
| `API_BASE_URL` | `https://plazo-benford-tech.vercel.app/api` | l'API |
| `ONESIGNAL_APP_ID` | vide (push coupées) | app OneSignal du personnel |
| `SITE_URL` | l'adresse de l'API sans `/api` | le site (conditions, confidentialité, mentions légales, FAQ) |
| `STRIPE_MERCHANT_ID` | vide (pas d'Apple Pay) | identifiant marchand Apple Pay (`merchant.…`) |
| `GOOGLE_PAY_TEST` | `true` | Google Pay en environnement de test Stripe (`false` avec les clés live) |
| `PAYMENT_SHEET_DEMO` | vide | essais dans un navigateur seulement : `success` ou `fail` remplace la feuille Stripe par une imitation (avec un faux Stripe côté API) |

En local, l'API doit accepter l'origine de la version web : `CLIENT_URL=http://localhost:<port>` dans `backend/.env`.

## Paiement (flutter_stripe)

L'app ne connaît que la **clé publiable** Stripe, donnée par l'API (`GET /api/public/payments/config`, variable
`STRIPE_PUBLISHABLE_KEY` côté serveur). Le serveur crée le *PaymentIntent* (`POST /api/public/bookings/REF/payment-intent`,
mêmes montants et commission que Checkout) et confirme la réservation (webhook `payment_intent.succeeded`, ou lecture
de la réservation) ; l'app attend seulement que la réservation passe à « Confirmée ». Sans clé publiable, ou dans la
version web, « Payer » ouvre la page Stripe Checkout.

- **Android** : `MainActivity` hérite de `FlutterFragmentActivity` et le thème est `Theme.MaterialComponents`
  (exigés par la feuille de paiement). **Google Pay** : `com.google.android.gms.wallet.api.enabled` dans le manifeste,
  activé dans le tableau de bord Stripe (*Moyens de paiement*) ;
  `GOOGLE_PAY_TEST=true` jusqu'aux clés live, puis demande d'accès à la production Google Pay (console Google Pay &
  Wallet) avec des captures du parcours.
- **iOS — Apple Pay** : créer un *Merchant ID* (`merchant.com.<entreprise>.plazo`) dans le compte Apple Developer,
  le certificat de traitement Apple Pay à générer **depuis Stripe** (*Paramètres → Apple Pay*), ajouter la capacité
  **Apple Pay** à l'App ID et la clé `com.apple.developer.in-app-payments` (tableau avec le Merchant ID) dans
  `ios/Runner/Runner.entitlements` (non ajoutée tant que l'identifiant n'existe pas : le profil de signature la
  refuserait), puis construire avec `--dart-define=STRIPE_MERCHANT_ID=merchant.…`. Sans lui, la feuille propose la
  carte seule.
- Webhook Stripe : ajouter `payment_intent.succeeded` et `payment_intent.payment_failed` aux évènements du compte
  (voir README à la racine).

## Position et vie privée

- L'autorisation de position n'est demandée qu'au moment où le voyageur appuie sur « Je suis en route — partager
  ma position », juste sous l'explication (avec qui, combien de temps, effacée ensuite). Appuyer vaut consentement
  (`consent: true` envoyé à l'API, qui le refuse sinon).
- Au plus une position toutes les 10 s ; le serveur ne garde que la dernière, l'efface à l'arrêt, à moins de 150 m du
  point de rendez-vous et au bout de 2 h. Sur le téléphone, la position ne vit qu'en mémoire (pour la carte).
- Android : service au premier plan avec la notification « Partage de position avec le parking en cours »
  (pas de permission « position en arrière-plan »). iOS : mode d'arrière-plan `location`, indicateur bleu,
  textes d'usage en français dans `Info.plist`. Web : seulement tant que la page reste ouverte.
- **Chauffeur** : même mécanique pendant un trajet navette (« Démarrer le trajet » demande l'autorisation ; position
  envoyée au plus toutes les 10 s, visible des passagers du trajet seulement ; notification Android « Trajet navette
  en cours — position partagée avec vos clients », mode `location` iOS). Le partage s'arrête à « Clients récupérés »,
  au bout de 90 min, ou si le serveur a terminé le trajet ; le serveur efface alors la position.
- **Itinéraire piéton** : la position n'est demandée qu'à l'ouverture de l'écran « Point de rendez-vous », envoyée une
  fois à l'API pour le calcul (jamais stockée) ; refusée, le chemin part du terminal.
- Le jeton de gestion de la réservation et la session du personnel sont dans le trousseau / keystore
  (`flutter_secure_storage`), jamais dans les journaux ; les journaux réseau n'écrivent que méthode, chemin et statut.

## À fournir par Joanny pour publier

0. **Paiement** : la clé publiable de test (`STRIPE_PUBLISHABLE_KEY` dans Vercel), le Merchant ID Apple Pay et son
   certificat (voir « Paiement »), l'accès production Google Pay au moment des clés live.
1. **Identifiants de l'app** (définitifs avant le premier envoi sur les stores) : aujourd'hui des valeurs provisoires,
   `com.benfordtech.parking_app` (Android, `android/app/build.gradle.kts`) et `com.benfordtech.parkingApp`
   (iOS, projet Xcode), à remplacer partout (dont `codemagic.yaml` et `deep_links/`).
2. **Apple** : compte Apple Developer (entreprise) ; l'app créée dans App Store Connect avec ce bundle id ;
   l'App ID avec les capacités **Push Notifications** et **Associated Domains** ; une **clé API App Store Connect**
   (rôle App Manager) enregistrée dans Codemagic sous le nom `plazo-asc` ; une clé privée RSA pour le certificat
   de distribution (`CERTIFICATE_PRIVATE_KEY`).
3. **Google Play** : compte Google Play Console (entreprise) ; une **clé d'import** (keystore `.jks`) et son
   `key.properties` (`storeFile=upload.jks`, `storePassword`, `keyAlias`, `keyPassword`) ; premier envoi de l'AAB
   à la main ; déclaration de l'usage de la position (premier plan, service « location »).
4. **OneSignal + Firebase** : une app OneSignal (son *App ID* → `ONESIGNAL_APP_ID` dans l'app et dans l'API ; sa
   *REST API key* → `ONESIGNAL_REST_API_KEY` dans Vercel seulement) ; un projet Firebase pour FCM (clé de compte de
   service à importer dans OneSignal pour Android) ; une clé APNs `.p8` (Apple) importée dans OneSignal pour iOS.
5. **Liens de réservation qui ouvrent l'app** : publier sur le domaine de production
   `/.well-known/assetlinks.json` (empreinte SHA-256 de la signature Play) et
   `/.well-known/apple-app-site-association` (Team ID) — modèles dans `deep_links/` ; puis remplacer le domaine
   provisoire dans `AndroidManifest.xml` et `ios/Runner/Runner.entitlements`.
6. **Fiches des stores** : nom, sous-titre, description courte et longue, captures (téléphone et tablette), icône,
   politique de confidentialité (URL), coordonnées d'assistance, catégorie, classification, justification de la
   position en arrière-plan (Apple) et formulaire « Sécurité des données » (Google).
7. **Codemagic** : l'app ajoutée sur le dépôt avec `codemagic.yaml` (à la racine du dépôt), le groupe de variables `mobile_secrets`
   (voir l'en-tête du fichier) et l'intégration App Store Connect `plazo-asc`.

## Publier sur les stores (pipelines, 07/10/2026)

Trois workflows Codemagic dans `codemagic.yaml` (racine du dépôt, `working_directory: mobile`) :

| Workflow | Quand | Ce qu'il fait |
| --- | --- | --- |
| `mobile-check` | chaque push qui touche `mobile/` | nom du produit à jour, `flutter analyze`, `flutter test`, APK **debug** des deux apps (à installer pour essayer) |
| `plazo-release` | tag `mobile-v*` ou lancement manuel | Plazo (voyageurs) : AAB signé → **Google Play, piste interne** ; IPA signé → **TestFlight** |
| `plazo-pro-release` | tag `mobile-v*` ou lancement manuel | Plazo Pro (personnel) : idem avec le flavor `pro` (id `.pro`, schéma iOS `pro`) |

- Une version = le `version:` de `pubspec.yaml` (ex. `1.0.0`) + un numéro de build = compteur Codemagic + 100, jamais
  inférieur au dernier build connu de Google Play ou de TestFlight (lu au moment du build). Pour publier : monter
  `version:` dans `pubspec.yaml`, pousser, poser le tag `mobile-v1.0.0` (les deux workflows partent), ou lancer un workflow
  depuis Codemagic.
- Les deux stores reçoivent une version **de test** (piste interne, TestFlight) : la mise en production se décide dans
  chaque console. `submit_as_draft: true` tant que l'app n'a pas été publiée une première fois sur Google Play, puis `false`.
- Le **premier envoi** de chaque app sur Google Play se fait à la main dans la Play Console (la fiche doit exister avant
  que l'API accepte un bundle) ; sur App Store Connect, l'app doit être créée avec son bundle id avant le premier build.
- Secrets, dans Codemagic seulement (jamais dans le dépôt ni dans une conversation) : groupe `mobile_secrets` avec
  `KEYSTORE_FILE`, `KEY_PROPERTIES_FILE`, `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` (compte de service Google Play, rôle
  « Release manager » sur les deux apps), `CERTIFICATE_PRIVATE_KEY`, `ONESIGNAL_APP_ID`, `ONESIGNAL_TRAVELLER_APP_ID`,
  `API_BASE_URL` ; intégration App Store Connect `plazo-asc` (clé API, rôle App Manager). Les capacités de l'App ID :
  Push Notifications (les deux apps) et Associated Domains (Plazo seulement).
- À remplacer dans `codemagic.yaml` quand les apps existent dans App Store Connect : `APP_STORE_APP_ID` (Apple ID numérique
  de chaque app, sert à lire le dernier build TestFlight ; `"0"` = ignoré).

- `/pro/parking` (onglet Parking) : Occupation (bloc 2, étape 2) — recherche par plaque, place proposée à l'arrivée, crochet des clés.
- `/pro/equipe` (gérants : membres, rôles, accès, mot de passe provisoire), `/pro/compte` (changement de mot de passe), `/pro/reglages` (gérants : nom, adresse, places, marge, navette, canal SMS avec le téléphone Android du parking).
- `/pro/planning-places` : planning des places (une ligne par place sur 7 ou 14 jours, besoin par jour, alertes, sans place, pré-affectation, déplacement d'un séjour).
- `/pro/reservations`, `/pro/reservations/:id`, `/pro/reservations/formulaire` : réservations du personnel (liste et recherche, fiche avec **une seule « Prochaine étape »** (C-B, 06/10/2026 : Placer la voiture → Occupation avec la carte du véhicule ouverte, `/pro/occupation?focus=` ; Déposer au terminal / Récupérer à l'aéroport → Navette avec le côté et le client présélectionnés, `/pro/navette?sens=&reservation=` ; Rendre le véhicule → feuille clés rendues + remarque, envoyée avec le statut), les autres statuts derrière « Autres actions », saisie, modification). Dans Occupation, « Placer » demande le crochet des clés dans le même geste. Les statuts suivants viennent de l'API (`nextStatuses`), le serveur reste l'autorité.

## Deux apps, un projet (A-B, 04/10/2026)

- **Plazo** (voyageurs) : flavor Android `traveller`, `--dart-define=APP_FLAVOR=traveller` (défaut), id `com.benfordtech.parking_app`.
- **Plazo Pro** (personnel, direction B de l'espace pro web : noir, jaune, angles vifs, Archivo Narrow + JetBrains Mono ; `AppColors` / `AppRadius` / `AppFonts` suivent le flavor) : flavor Android `pro`, `--dart-define=APP_FLAVOR=pro`, id `com.benfordtech.parking_app.pro`,
  icône vert citron, P et avion vert foncé (C-B, 05/10/2026 ; `assets/brand/app-icon-pro*.png`, `dart run flutter_launcher_icons -f flutter_launcher_icons-pro.yaml`).
  Elle s'ouvre sur ses quatre onglets (`ProShellPage` : Aujourd'hui · Réservations · Parking · Plus) et n'embarque aucun
  écran voyageur (décision du 04/10/2026 : les routes voyageur et les App Links `/ma-reservation` n'existent que dans le
  flavor `traveller`, `android/app/src/traveller/AndroidManifest.xml`).
- Exemple : `flutter build apk --release --flavor pro --dart-define=APP_FLAVOR=pro`. Toujours passer le même nom aux deux
  options (le flavor choisit l'id et l'icône, la define choisit le parcours).
- iOS (07/10/2026) : deux schémas partagés `traveller` et `pro` (`ios/Runner.xcodeproj/xcshareddata/xcschemes/`) et les
  configurations `Debug-… / Release-… / Profile-…` de chaque flavor dans le projet Xcode : bundle id `com.benfordtech.parkingApp`
  ou `.pro`, nom affiché (`APP_DISPLAY_NAME` → `CFBundleDisplayName`), jeu d'icônes `AppIcon` ou `AppIcon-pro`
  (`Assets.xcassets/AppIcon-pro.appiconset`, généré depuis `assets/brand/app-icon-pro.png`), droits `Runner.entitlements`
  (push + liens universels) ou `RunnerPro.entitlements` (push seul). `flutter build ipa --flavor pro --dart-define=APP_FLAVOR=pro`.
  Le schéma `Runner` d'origine reste l'app voyageur (configurations de base).
