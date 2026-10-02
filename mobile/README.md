# Application mobile (Flutter)

Une seule application, deux parcours bien séparés (les « flavors » viendront ensuite, voir SPEC.md, 3 ter) :

- **Voyageur** (`/ma-reservation…`) : ouvrir sa réservation par le lien reçu par email ou SMS
  (`https://<domaine>/ma-reservation/REF?cle=…`, le même que celui du site) ou par référence + email ;
  le jour J, **prévenir le parking de son arrivée** : partage de la position en direct jusqu'à l'arrivée
  (2 h au plus, puis effacée), ou « J'arrive dans 10 / 20 / 30 min » sans position ; au retour,
  « Je suis au point de rendez-vous ».
- **Pro** (`/pro…`) : connexion du personnel (mêmes comptes que l'espace pro), planning du jour
  Arrivées / Retours (onglets sur téléphone, deux colonnes sur tablette) avec les signaux en direct
  (interrogés toutes les 12 s), l'arrivée en approche en tête avec sa mini-carte, et les notifications
  push (OneSignal) réglables par personne : arrivées, retours, ou les deux.

Architecture reprise de `lovenest-frontend` : bloc, auto_route, get_it, retrofit + dio, freezed,
easy_localization (français), OneSignal, Codemagic. Couches par fonctionnalité :
`lib/src/features/<x>/{data/{client,datasources,models},domain/{repositories,usecases},presentation/{bloc,pages,widgets}}`,
injection dans `lib/src/di/`, réseau et erreurs dans `lib/src/core/`. Les erreurs de l'API (`code`, `fields`)
sont traduites par `assets/l10n/fr-FR.json` (clés `errors.<code>`).

Direction visuelle **D** : en-tête prune `#4b164c`, accent violet `#a427c3`, pêche `#f0a36b` pour le temps
fort, dégradé violet → rose → pêche sur les actions principales, Playfair Display (titres) + Inter,
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
flutter run --dart-define=API_BASE_URL=http://localhost:3005/api      # API locale (émulateur Android : 10.0.2.2)
flutter build web --dart-define=API_BASE_URL=http://localhost:3005/api # essai dans un navigateur
```

Réglages de construction (`--dart-define`, jamais de secret : ils sont lisibles dans l'app) :

| Nom | Défaut | Rôle |
| --- | --- | --- |
| `API_BASE_URL` | `https://plazo-benford-tech.vercel.app/api` | l'API |
| `ONESIGNAL_APP_ID` | vide (push coupées) | app OneSignal du personnel |

En local, l'API doit accepter l'origine de la version web : `CLIENT_URL=http://localhost:<port>` dans `backend/.env`.

## Position et vie privée

- L'autorisation de position n'est demandée qu'au moment où le voyageur appuie sur « Je suis en route — partager
  ma position », juste sous l'explication (avec qui, combien de temps, effacée ensuite). Appuyer vaut consentement
  (`consent: true` envoyé à l'API, qui le refuse sinon).
- Au plus une position toutes les 10 s ; le serveur ne garde que la dernière, l'efface à l'arrêt, à moins de 150 m du
  point de rendez-vous et au bout de 2 h. Sur le téléphone, la position ne vit qu'en mémoire (pour la carte).
- Android : service au premier plan avec la notification « Partage de position avec le parking en cours »
  (pas de permission « position en arrière-plan »). iOS : mode d'arrière-plan `location`, indicateur bleu,
  textes d'usage en français dans `Info.plist`. Web : seulement tant que la page reste ouverte.
- Le jeton de gestion de la réservation et la session du personnel sont dans le trousseau / keystore
  (`flutter_secure_storage`), jamais dans les journaux ; les journaux réseau n'écrivent que méthode, chemin et statut.

## À fournir par Joanny pour publier

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
7. **Codemagic** : l'app ajoutée sur le dépôt avec `mobile/codemagic.yaml`, le groupe de variables `mobile_secrets`
   (voir l'en-tête du fichier).
