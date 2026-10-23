# Publier Plazo et Plazo Pro sur les stores

État au 11/10/2026 (soir) : les deux fiches Google Play existent ; Codemagic construit (premier build Android abouti, version 1.0.0
build 112, AAB et APK des deux apps dans les Artifacts du build) ; restent le premier import des AAB dans la Play Console, la clé du
compte de service Google Play, puis Apple.

Les comptes existent déjà : ceux qui publient Thempo, LoveNest et Yoon. Plazo s'y ajoute, signé et publié comme Thempo,
qui sort sur les deux stores depuis le même compte Codemagic (le **compte personnel** de Joanny, sans équipe : relevé par
l'API le 11/10/2026). Les pipelines sont dans `codemagic.yaml`, à la racine du dépôt ; le premier build Android de Plazo a
abouti le 11/10/2026 (build 112 : `plazo-v1.0.0-112.aab`, `plazo-pro-v1.0.0-112.aab`, leurs APK et `mapping.txt` ; seule
l'étape Google Play en erreur, faute de clé de compte de service, comme prévu). Depuis le 11/10/2026 (« unifie le pipeline »), **un seul workflow de
publication** construit les six paquets d'une version (APK, AAB et IPA de Plazo et de Plazo Pro) et les envoie aux deux
stores ; un second, **Android seul** (`mobile-release-android`), fait la moitié Google Play sans rien demander à Apple : il
sert au premier envoi sur Google Play sans attendre les profils Apple, puis chaque fois que seul Google Play doit recevoir
une version. Les textes des quatre fiches (noms, descriptions, mots-clés, réponses de confidentialité, notes pour la revue,
visuels à fournir) sont dans [fiches-stores.md](fiches-stores.md), rédigés d'après le code et relus contre lui.

Codemagic n'existe qu'en anglais : ses libellés restent en anglais ici. Pour Google, les libellés sont en français. Les
consoles Apple sont citées en anglais.

## Ce qui existe déjà

Relevé le 09/10/2026 dans les projets Thempo, LoveNest et Yoon (dépôts et sessions Claude), sans aucune valeur secrète.

| Où | Ce qui existe | Pour Plazo |
| --- | --- | --- |
| Apple | Équipe Apple Developer **Benford Tech**, Team ID **3BX4795V2Y** (LoveNest, Thempo, Yoon) | même équipe : pas de nouvelle inscription |
| Google Play | Compte développeur **Benford Tech** (Thempo publié par l'API, Yoon et LoveNest à la main) | même compte |
| Codemagic | Le **compte personnel** de Joanny (pas d'équipe ; apps `tempo-app`, `lovenest-frontend`, `yoon`, relevé par l'API le 11/10/2026 ; réglages sous **Teams › Personal account**) ; intégration Developer Portal **`lovenest-asc`** (clé API App Store Connect de l'équipe Apple) ; certificat **Apple Distribution** dans Code signing identities (`thempo-distribution`) | Plazo y est ajouté (app `plazo`) ; `codemagic.yaml` utilise `lovenest-asc` et ce certificat |
| Google Cloud | Le compte de service créé pour Yoon le 13/10/2026 (projet `yoon-beige`, adresse `…@yoon-beige.iam.gserviceaccount.com`, API Google Play Android Developer activée ; clé JSON dans la variable `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` du groupe `yoon` de l'app Yoon) | **le même**, ouvert aux deux apps Plazo ; sa clé JSON collée aussi dans l'app `plazo` (Codemagic ne copie pas un secret d'une app à l'autre, et un compte personnel n'a plus de variables globales) |
| OneSignal | Les deux apps de Plazo : Plazo Pro `89a1124f-3ba0-481e-b9f1-545d254e435d`, Plazo `dd3c2a74-a7b0-4117-ba18-ab5a1edfe0a3` | App ID déjà dans `codemagic.yaml` et dans Vercel, clés REST dans Vercel : **rien à faire** côté API |

Ce qui manque encore : les quatre fiches d'app (deux chez Apple, deux chez Google), les deux profils de signature Apple,
la clé d'import Android de Plazo dans Codemagic (créée et envoyée par GitHub dès que le jeton Codemagic est dans GitHub,
étape 3.2) et les réglages push (APNs, FCM) de chaque app OneSignal.

## Les pipelines

| Où | Quand | Ce qu'il fait |
| --- | --- | --- |
| GitHub Actions `Mobile CI` | chaque PR et push sur `main` qui touche `mobile/` | nom du produit à jour, `flutter analyze`, `flutter test` (gratuit) |
| Codemagic `mobile-check` | à la main | les mêmes vérifications + APK **debug** des deux apps, à installer pour essayer |
| GitHub Actions `Mobile release (Google Play + App Store)` (23/10/2026) | tag `mobile-v…` ou à la main (Actions › Run workflow : stores, piste Google Play, brouillon, revue Apple, APK) | **le même pipeline que `mobile-release` de Codemagic, sur GitHub** : voir « GitHub Actions » ci-dessous |
| Codemagic `mobile-release` | à la main (le tag part sur GitHub Actions depuis le 23/10/2026) ; **version calculée seule** (`MAJEUR.MINEUR` de `pubspec.yaml` + numéro de build, ex. 1.0.131, 21/10/2026) | les vérifications une fois, puis pour **Plazo et Plazo Pro** : AAB signés (APK avec `BUILD_APK=true` ; clé du groupe `plazo_android_signing`) et IPA signé (certificat du compte), **même version et même numéro de build** pour les quatre paquets ; chaque AAB → **Google Play, production** (21/10/2026), chaque IPA → **TestFlight** puis **revue App Store** et sortie dès l'accord d'Apple, avec les **notes de version** de `mobile/release-notes/plazo.txt` et `plazo-pro.txt` (voir son README ; sans elles le build s'arrête) ; les six fichiers dans **Artifacts** |
| Codemagic `mobile-release-android` | à la main | **Android seul**, les mêmes étapes que la moitié Android de `mobile-release` : les vérifications, AAB + APK signés des deux apps, chaque AAB → **Google Play, tests internes** ; les quatre fichiers dans **Artifacts**. Ni certificat ni profil Apple |

- **Version** = le `version:` de `mobile/pubspec.yaml` (ex. `1.0.0`). Le tag doit la reprendre : `mobile-v1.0.0`, sinon le
  build s'arrête tout de suite (« le tag … ne correspond pas à la version … »).
- **Numéro de build** = compteur Codemagic + 100, jamais en dessous du dernier build connu d'un des quatre stores (les
  deux fiches Google Play, les deux apps TestFlight) : un seul numéro pour les quatre paquets.
- Les stores reçoivent une version **de test** ; la mise en production se décide dans chaque console.
- **Les envois sont indépendants** : chaque AAB puis chaque IPA est envoyé même si un autre envoi a échoué ; le dernier
  pas, « Bilan de la publication », liste les envois et met le build en erreur si l'un a échoué. Les paquets restent
  dans Artifacts.
- `mobile-release` a besoin, **avant son premier lancement**, du certificat et des **deux profils Apple** dans les Code
  signing identities du compte (sans l'un d'eux, Codemagic s'arrête à « Set up code signing », avant de construire quoi
  que ce soit) et du groupe de variables `plazo_android_signing` (la clé d'import Android, écrite par GitHub, étape 3.2).
  `mobile-release-android` n'a besoin que de ce groupe et de la clé du compte de service Google Play : les sections 1 et 3
  suffisent.
- Le compte personnel a **500 minutes gratuites par mois** sur Mac mini M2 (compteur sur <https://codemagic.io/billing/user>,
  remis à zéro le 1er du mois), **un seul build à la fois**, et rien sur Linux ni Windows sans facturation ; au-delà,
  **Enable billing** sur cette page (macOS M2 0,095 $/min, Linux 0,045 $/min). Une publication complète prend de l'ordre
  d'une heure de machine (deux apps Android, deux apps iOS), Android seul une demi-heure : les minutes gratuites couvrent
  quelques publications par mois, partagées avec Thempo, LoveNest et Yoon. C'est pourquoi les vérifications de chaque
  modification tournent sur GitHub Actions, gratuitement.
- Un build qui reste **Queued** alors que rien d'autre ne tourne sur le compte (workflow GitHub « Codemagic build »,
  action `team`) : minutes du mois épuisées, file d'attente Codemagic (<https://status.codemagic.io>) ou **pool de
  machines saturé pour l'image Xcode choisie** : la version d'Xcode désigne l'image macOS, donc le pool de Mac mini M2,
  même pour un build Android. Le 11/10/2026, les deux premiers builds Android de Plazo sont restés en file plus d'une
  heure (117 minutes sur 500 consommées, aucun autre build) : depuis le 08/10/2026 le pool de l'image par défaut
  (Xcode 26.6) est surchargé, sans incident déclaré ; Codemagic conseille `xcode: 26.5` ou `26.4`
  ([discussion codemagic-ci-cd #3570](https://github.com/orgs/codemagic-ci-cd/discussions/3570)), d'où `xcode: 26.5`
  dans `env_versions_android` de `codemagic.yaml`, à remettre en `latest` plus tard. Codemagic annule de lui-même un
  build en attente depuis 5 h, l'action `cancel` l'annule avant.

## GitHub Actions : le même pipeline sans Codemagic (23/10/2026)

Le 23/10/2026, Codemagic a répondu « Billing error » (402) à un nouveau build : « Refais le pipeline codemagic dans github
avec la publication sur les deux stores ». Le workflow `.github/workflows/mobile-release.yml` refait `mobile-release` sur
GitHub Actions, avec les mêmes outils de publication (les outils en ligne de commande de Codemagic, un paquet libre) :

1. **Version et notes** (Linux) : `MAJEUR.MINEUR` de `pubspec.yaml` + un numéro de build au-dessus du dernier des quatre
   stores (et au-dessus des numéros de Codemagic) ; notes de `mobile/release-notes/` vérifiées (1 à 500 caractères).
2. **Android** (Linux) : AAB signés des deux apps (APK si demandé), envoyés à Google Play (piste choisie, production par
   défaut) avec les notes ; paquets et `mapping.txt` dans l'artefact `android-<version>` (30 jours).
3. **iOS** (macOS 26, Xcode 26.6) : certificat et profils App Store récupérés chez Apple, IPA signés des deux apps envoyés
   à App Store Connect (TestFlight, puis revue App Store et sortie dès l'accord, sauf choix contraire) avec les notes ;
   IPA et dSYM dans l'artefact `ios-<version>`.

Chaque envoi est tenté même si un autre échoue ; le résumé du passage liste les envois, et un job finit en rouge si l'un des
siens a échoué. Lancer : un tag `mobile-v…` (les deux stores, production, revue Apple), ou **Actions › Mobile release ›
Run workflow** (stores, piste, brouillon, revue, APK au choix).

**Coût** : sur un dépôt privé, une minute macOS compte pour dix minutes gratuites de GitHub (2 000 par mois sur l'offre
gratuite) : le job iOS, environ 35 minutes, en consomme environ 350. Android et la préparation comptent normalement.

### À poser une fois : l'environnement « stores »

GitHub › dépôt `Benford-Tech/plazo` › **Settings › Environments › New environment** › `stores`. On peut y cocher
**Required reviewers** (soi-même) pour valider chaque publication avant qu'elle parte. Puis, dans cet environnement,
**sans jamais coller ces valeurs dans une conversation** :

| Secret | D'où il vient |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | le fichier `plazo-upload.jks` (artefact du workflow « Android keystore », rangé dans le gestionnaire de mots de passe) en base64, en une ligne : sur Mac `base64 -i plazo-upload.jks \| pbcopy`, ou mieux sans presse-papiers `gh secret set ANDROID_KEYSTORE_BASE64 --env stores --repo Benford-Tech/plazo < <(base64 -i plazo-upload.jks)`. Le job ouvre la clé avant de construire et affiche son empreinte publique : un base64 coupé s'arrête là |
| `ANDROID_KEYSTORE_PASSWORD` | `plazo-upload-password.txt` (le même mot de passe pour le fichier et la clé, alias `upload`) |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | le fichier JSON entier de la clé du compte de service Google Play (celui de Yoon, projet `yoon-beige`, déjà ouvert aux deux apps) ; si le fichier n'est plus là : Google Cloud › IAM › Comptes de service › ce compte › Clés › Ajouter une clé › JSON |
| `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_IDENTIFIER`, `APP_STORE_CONNECT_PRIVATE_KEY` | App Store Connect › Users and Access › Integrations › App Store Connect API › Team Keys › **+**, rôle **App Manager** : l'Issuer ID (en haut de la page), le Key ID, et tout le contenu du fichier `.p8` (téléchargeable une seule fois) |
| `IOS_CERTIFICATE_PRIVATE_KEY` | la clé privée RSA (PEM, « -----BEGIN … PRIVATE KEY----- ») du certificat **Apple Distribution**. Celle du certificat de Codemagic (`thempo-distribution`) n'en sort pas : si on ne l'a pas ailleurs, en créer une (`openssl genrsa -out plazo_distribution.key 2048` sur son ordinateur), la mettre ici, puis lancer une fois le workflow avec **ios_create_signing** coché : il crée un certificat pour cette clé et les profils App Store des deux apps (Apple accepte **3** certificats de distribution par équipe : en supprimer un inutilisé dans Certificates s'il y en a déjà 3). Ranger la clé dans le gestionnaire de mots de passe |

| Variable (publique) | Valeur |
| --- | --- |
| `GOOGLE_SERVER_CLIENT_ID` | le client OAuth « Application Web » (section 3 bis) : « Continuer avec Google » dans Plazo Pro |
| `GOOGLE_IOS_CLIENT_ID` | le client OAuth « iOS » (section 3 bis, point 7) : « Continuer avec Google » sur iPhone |
| `API_BASE_URL`, `SITE_URL`, `STRIPE_MERCHANT_ID` | facultatives, comme sur Codemagic |

Sign in with Apple suit le profil comme sur Codemagic : le bouton Apple n'apparaît que si le profil App Store de Plazo Pro
porte la capacité. Codemagic ne se déclenche plus sur les tags : un tag ne publie qu'une fois, par GitHub.

## 0. À décider avant de commencer

- [x] **Les identifiants des apps** (décidés le 11/10/2026, Plazo Pro déjà créée sur Google Play) : les mêmes sur les deux
  stores.

  | | Android (Play) | iOS (Apple) |
  |---|---|---|
  | Plazo | `com.benfordtech.plazo` | `com.benfordtech.plazo` |
  | Plazo Pro | `com.benfordtech.plazopro` | `com.benfordtech.plazopro` |

  Ils ne changent plus après le premier envoi (Google) ou la création de l'App ID (Apple). Le code, `codemagic.yaml` et
  `site/public/.well-known/` les portent déjà.
- [x] **Qui publie** (15/10/2026) : **Benford Tech**, la société éditrice de Plazo, que nomment aussi les pages légales
  (`product.json` › `company`). Les comptes Apple et Google existants, à son nom, conviennent.

---

## 1. Codemagic (sur le compte existant)

1. [x] **Ouvrir le compte** qui contient Thempo (menu de gauche **Teams › Personal account**), puis **Applications ›
   Add application › GitHub**, et choisir `Benford-Tech/plazo` (fait : app `plazo`, 11/10/2026).
   - Si `plazo` n'apparaît pas : GitHub › organisation **Benford-Tech** › **Settings › GitHub Apps › Codemagic CI/CD ›
     Configure**, **Repository access** : ajouter `plazo`, **Save**.
   - Type de projet **Flutter App**, configuration **codemagic.yaml** (pas le Workflow Editor), **Finish: Add application**.
2. [ ] **Vérifier les workflows** : onglet `codemagic.yaml`, branche `main`, **Check for configuration file** : trois
   workflows (« Mobile — vérifications + APK de test (debug, à la main) », « Plazo + Plazo Pro — APK, AAB, IPA →
   Google Play (tests internes) + TestFlight » et « Plazo + Plazo Pro — Android seul (APK, AAB) → Google Play (tests
   internes) »).
3. [ ] **Vérifier les minutes** sur <https://codemagic.io/billing/user> (minutes gratuites consommées ce mois-ci ; **Enable
   billing** pour continuer au-delà des 500, ou pour construire sur Linux) : sans minutes ni facturation, les builds
   restent en file d'attente.
4. [ ] **Le jeton de l'API Codemagic dans GitHub**, pour que GitHub envoie lui-même la clé d'import Android (étape 3.2) :
   Codemagic › **Teams › Personal account › Integrations › Codemagic API › Show** (le jeton de ton compte), puis GitHub › `plazo` ›
   **Settings › Secrets and variables › Actions › New repository secret**, nom `CODEMAGIC_API_TOKEN`, coller le jeton,
   **Add secret**. Rien à téléverser dans Code signing identities pour Android : la clé vit dans le groupe de variables
   `plazo_android_signing` de l'app (variables Secure `CM_KEYSTORE`, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`,
   `CM_KEY_PASSWORD`, écrites par GitHub ; Codemagic n'a pas d'API pour les Code signing identities). Avec ce jeton, le
   workflow GitHub **« Codemagic build (start, status, groups) »** (Actions › Run workflow) lance un build Codemagic,
   donne l'état, les étapes et les artefacts d'un build, l'annule (`cancel`), dit pourquoi un build attend (`team`), liste
   les groupes de variables (noms seulement) ou en crée un vide : Claude suit et relance les builds par là, sans accès à
   Codemagic.
5. [ ] **Le groupe de variables `mobile_secrets`** : page de l'app `plazo` › **Environment variables** › variable
   `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` (le nom de Yoon ; `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` marche aussi), groupe
   `mobile_secrets`, cocher **Secret**, **Add**. La valeur : **tout le contenu** de la clé JSON du compte de service de
   Yoon (étape 3.4), collé tel quel (pas en base64) : le même fichier que pour Yoon s'il est encore là, sinon une nouvelle
   clé du même compte.
   - Une variable « Secret » ne se relit plus : pour la changer, la supprimer puis la recréer.
   - Plus tard, facultatif : `STRIPE_MERCHANT_ID` (Apple Pay), quand Claude aura ajouté Apple Pay à l'app.
6. [ ] **Les déclenchements** : après le prochain tag `mobile-v…`, ouvrir l'onglet **Webhooks** de l'app. Si aucune
   livraison n'apparaît, ajouter le webhook dans GitHub : `plazo` › **Settings › Webhooks › Add webhook**, URL
   `https://api.codemagic.io/hooks/<appId>` (la partie qui suit `codemagic.io/app/` dans l'adresse), type
   `application/json`, événements « Branch or tag creation » et « Pushes ».
7. [ ] **Essai** : **Start new build**, branche `main`, workflow `mobile-check` : deux APK de test dans **Artifacts**.

---

## 2. Apple (équipe Benford Tech, 3BX4795V2Y)

1. [ ] **Créer les deux App ID** : **Certificates, Identifiers & Profiles › Identifiers › (+) › App IDs › App**,
   **Explicit** :
   - [ ] `com.benfordtech.plazo` (description « Plazo ») : **Push Notifications** + **Associated Domains** (les liens
     de réservation `https://www.plazo.fr/ma-reservation/…` ouvrent l'app ; le site sert déjà le fichier d'association) ;
   - [ ] `com.benfordtech.plazopro` (description « Plazo Pro ») : **Push Notifications**.
2. [ ] **Créer les deux apps** dans App Store Connect : **Apps › (+) › New App**, iOS, nom « Plazo » ou « Plazo Pro »,
   langue Français, le Bundle ID de l'étape 1, SKU `PLAZO-IOS` / `PLAZO-PRO-IOS`.
3. [ ] **Créer les deux profils de signature, avec le certificat qui existe déjà** (Apple n'en accepte que 3 par compte :
   **ne pas en créer un nouveau**).
   - Repérer le certificat : Codemagic › Teams › Personal account › **Code signing identities › iOS certificates** montre
     `thempo-distribution` et sa date d'expiration.
   - Apple : **Profiles › (+) › Distribution › App Store Connect › Continue**, l'App ID `com.benfordtech.plazo`, puis
     le certificat **Apple Distribution** qui expire à cette date, nom « Plazo App Store », **Generate**. Même chose pour
     `com.benfordtech.plazopro`, nom « Plazo Pro App Store ».
4. [ ] **Les importer dans Codemagic** : **Code signing identities › iOS provisioning profiles › Fetch profiles**, cocher
   les deux profils, et leur donner **exactement** les Reference name `plazo_app_store` (Plazo) et `plazo_pro_app_store`
   (Plazo Pro) : `codemagic.yaml` les appelle par ces noms. Vérifier aussi, dans **iOS certificates**, que le certificat
   du compte porte le Reference name `thempo-distribution` (sinon le dire à Claude, qui l'adapte dans `codemagic.yaml`).
5. [ ] **Relever l'Apple ID numérique de chaque app** (app › **App Information** › **Apple ID**, ou le nombre après `apps/`
   dans l'adresse) et le donner à Claude, qui le pose dans `codemagic.yaml` (`APP_STORE_APP_ID_PLAZO` /
   `APP_STORE_APP_ID_PLAZO_PRO`). Fait le 11/10/2026 : Plazo `6821635235`, Plazo Pro `6821635650`.
6. [ ] **Notifications iOS** (OneSignal) : **Certificates, Identifiers & Profiles › Keys**.
   - Réutiliser une clé APNs existante seulement si sa fiche (**View Key Details**) indique **Sandbox & Production** et
     **Team Scoped (All Topics)**, *et* si son fichier `.p8` est dans le gestionnaire de mots de passe (il ne se télécharge
     qu'une fois).
   - Sinon **(+)**, Key Name « Plazo APNs », cocher **Apple Push Notifications service (APNs)** › **Configure** :
     Environment **Sandbox & Production**, Key Restriction **Team Scoped (All Topics)**, **Save** › **Continue** ›
     **Register**, noter le **Key ID**, **Download** (une seule fois possible).
   - Si Apple refuse une nouvelle clé (limite atteinte), ne jamais révoquer une clé de Thempo, LoveNest ou Yoon : demander
     à Claude.
   - Dans chaque app OneSignal (Plazo, Plazo Pro) › **Settings › Push & In-App › Apple iOS (APNs) Settings › .p8 Auth
     Key** : le `.p8`, son Key ID, le Team ID `3BX4795V2Y` et le Bundle ID de l'app.
7. [ ] **Testeurs TestFlight internes** : app › **TestFlight** › (+) à côté de **Internal Testing**, cocher **Enable
   automatic distribution**, puis **Invite Testers** (utilisateurs d'App Store Connect, 100 au plus). Pour le personnel du
   client n°1, qui n'a pas de compte App Store Connect, il faudra un groupe **External Testing** et la relecture bêta
   d'Apple : le dire à Claude le moment venu.

---

## 3. Google Play (compte Benford Tech)

1. [x] **Créer les deux apps** (fait le 11/10/2026) : **Toutes les applications › Créer une application**, « Plazo » puis
   « Plazo Pro », Français, appli, gratuite ; **Déclarations** : tout accepter, y compris la signature d'application Play.
   Leurs identifiants (`com.benfordtech.plazo`, `com.benfordtech.plazopro`) se fixent au premier AAB importé (étape 6).
2. [ ] **Créer la clé d'import de Plazo**, une pour les deux apps, alias `upload`. **Jamais celle de Thempo, de LoveNest ou
   de Yoon** : le premier envoi fixe la clé d'une app pour toujours (un AAB de Yoon a déjà été refusé pour avoir été signé
   avec la clé de Thempo). **Depuis le 11/10/2026, GitHub la crée et l'envoie à Codemagic** (« génère une clé pour plazo
   et plazo pro », « fais-le ») : ni la clé ni son mot de passe ne passent par une conversation.
   - D'abord le jeton Codemagic dans GitHub (étape 1.4).
   - GitHub › `plazo` › **Actions › « Android keystore (Plazo upload key) » › Run workflow** (branche `main`, cases
     « replace » décochée et « start_build » cochée). Une fois. Le workflow crée la clé, l'envoie dans le groupe de
     variables `plazo_android_signing` de l'app Codemagic (variables Secure) et lance le build `mobile-release-android`
     sur `main` ; le lien du build est dans le résumé du run. Il refuse de remplacer une clé déjà envoyée, sauf avec la
     case « replace » : à ne cocher que si aucun AAB n'a encore été importé sur Google Play.
   - Sur la page du run, **Artifacts › `plazo-upload-keystore`** : l'archive contient `plazo-upload.jks`,
     `plazo-upload-password.txt` (mot de passe aléatoire de 32 lettres et chiffres, le même pour le fichier et la clé),
     `upload_certificate.pem` (le certificat public, pour une réinitialisation chez Google plus tard) et `LISEZ-MOI.txt`.
     L'artefact **disparaît au bout d'un jour** : le télécharger tout de suite, pour le gestionnaire de mots de passe
     (Codemagic ne rend jamais une clé, et Google Play exigera la même pour chaque envoi).
   - Supprimer l'artefact sur la page du run (icône de corbeille à côté de son nom), puis les fichiers téléchargés.
   - Sans jeton Codemagic dans GitHub, le workflow ne fait que l'artefact : téléverser alors la clé à la main dans Teams ›
     Personal account › **Code signing identities › Android keystores › Upload keystore** (alias `upload`, Reference name
     `plazo_upload`) et demander à Claude de remettre `android_signing: [plazo_upload]` dans `codemagic.yaml`.
   - Si une version signée avec une autre clé avait déjà été importée dans la Play Console, la clé d'import de cette app
     serait fixée : il faudrait alors, pour chaque app, Play Console › **Intégrité de l'application › Signature
     d'application Play › Demander la réinitialisation de la clé d'importation** avec `upload_certificate.pem`.
   À la main, sans GitHub (mêmes réglages) :
   - Mac : `keytool -genkey -v -keystore ~/plazo-upload.jks -keyalg RSA -storetype JKS -keysize 2048 -validity 10000 -alias upload`
   - Sans Java (Mac : « Unable to locate a Java Runtime »), avec celui d'Android Studio :
     `"/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" -genkey -v -keystore ~/plazo-upload.jks -keyalg RSA -storetype JKS -keysize 2048 -validity 10000 -alias upload`
   - Windows (PowerShell) :
     `& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore $env:USERPROFILE\plazo-upload.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
   - Mot de passe : **lettres et chiffres seulement**, 20 caractères ou plus ; même mot de passe pour la clé (Entrée).
   - Garder `plazo-upload.jks` et son mot de passe dans le gestionnaire de mots de passe, puis le téléverser dans
     Codemagic (Code signing identities, référence `plazo_upload`, et `android_signing` dans `codemagic.yaml`).
3. [x] **Ouvrir le compte de service aux deux apps** : **Utilisateurs et autorisations**, la ligne du compte de service
   (`…@yoon-beige.iam.gserviceaccount.com`, celui de Yoon, 13/10/2026) › **Autorisations des applications › Ajouter une application** : Plazo et
   Plazo Pro, cocher la section **Versions** (publier dans les canaux de test, gérer les canaux de test et les listes de
   testeurs, publier en production), **Appliquer**, puis enregistrer.
4. [x] **Sa clé JSON pour Codemagic** : le fichier JSON déjà créé pour Yoon s'il est encore sur l'ordinateur, sinon Google
   Cloud (projet `yoon-beige`) › **IAM et administration › Comptes de service** › ce compte › **Clés › Ajouter une clé ›
   Créer une clé › JSON**. Ouvrir le fichier, tout copier dans `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` de l'app `plazo`
   (étape 1.5 ; le groupe `mobile_secrets` existe déjà, créé vide par le workflow de la clé Android : Codemagic refuse un
   build dont un groupe manque), puis le supprimer de l'ordinateur. Jamais dans une conversation.
   Vide jusqu'au 13/10/2026 : les deux envois Google Play du build 113 (`mobile-release`) avaient échoué pour cette raison.
   Fait le 13/10/2026 : clé collée dans `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`, et le build 114 (`mobile-release`,
   `6ace256e546ce6236cee23c3`, version 1.0.0, 42 min) a tout envoyé : les deux AAB en **tests internes** (en brouillon,
   `PLAY_SUBMIT_AS_DRAFT`) et les deux IPA vers **TestFlight**, bilan vert.
   Build 115 (13/10/2026) : envoi de Plazo Pro refusé par Google Play (« A change was made to the application outside of
   this Edit ») parce que Plazo Pro était modifiée dans la Play Console au même moment ; les trois autres envois sont
   passés. Depuis, chaque AAB est envoyé une seconde fois 60 s après un échec. Pour voir ce qu'un store a répondu : GitHub ›
   Actions › « Codemagic build » › action **`logs`** (fin du journal des étapes en échec et des envois aux stores).
   Conseil : ne pas modifier une app dans la Play Console pendant que le build l'envoie (dernières minutes du build).
5. [ ] **Liste des testeurs internes** (pour chaque app) : **Tester et publier › Tests › Tests internes › Testeurs ›
   Créer une liste de diffusion** (comptes Google), **Enregistrer les modifications**.
6. [x] **Premier envoi à la main** (l'API refuse une app jamais publiée), une fois la section 1 et l'étape 2 faites ;
   **ni Apple ni la clé du compte de service ne sont nécessaires** pour cet import dans la Play Console (les étapes 3 et 4
   ne servent qu'aux envois automatiques suivants). Fait : l'envoi automatique du build 114 (13/10/2026) a été accepté
   par Google Play pour les deux apps, ce que l'API refuse à une app jamais importée. Pour mémoire, la marche suivie :
   - Codemagic : **Start new build**, `main`, workflow **« Plazo + Plazo Pro — Android seul »** (`mobile-release-android`).
     Les deux envois Google Play échouent sur ce premier build (« Package not found ») et le bilan le met en erreur :
     **c'est attendu**. Fait le 11/10/2026 (build `6acbd661546ce6236ced943f`, version 1.0.0, build 112, 24 min). (Avec `mobile-release`, une fois Apple prêt, c'est pareil, et les deux IPA partent vers TestFlight.)
   - **Artifacts** du build : télécharger `plazo-pro-v1.0.0-<n°>.aab` et `plazo-v1.0.0-<n°>.aab`.
   - Play Console : **Tests internes › Créer une version**, garder la signature d'application Play proposée, **Importer**
     l'AAB, **Suivant**, **Enregistrer** : la version reste en brouillon.
7. [ ] **Contenu de l'application** (*App content*), après cet import (le formulaire du service de premier plan n'apparaît
   qu'une fois l'AAB importé) et avant le déploiement : sécurité des données, classification, public cible, URL de
   confidentialité `https://www.plazo.fr/confidentialite`, déclaration du **service de premier plan « location »** (avec un
   **lien vers une vidéo**), et pour **Plazo Pro** l'**accès à l'application** : un compte du personnel de démonstration (la
   revue de Thempo a été refusée faute d'identifiants valides). Sans la déclaration, Google refuse tout déploiement, même en
   tests internes.
8. [ ] **Démarrer le premier déploiement** : **Tests internes**, la version enregistrée › **Vérifier la version** ›
   **Démarrer le déploiement**.
9. [x] **Production (21/10/2026, « les pipelines doivent publier en production avec release note »)** : `PLAY_TRACK`
   `production` et `PLAY_SUBMIT_AS_DRAFT` `"false"` ; côté Apple `APP_STORE_SUBMIT` `"true"` et `APP_STORE_RELEASE_TYPE`
   `AFTER_APPROVAL` (`MANUAL` pour sortir à la main). Pour un build de test, les remettre à `internal` / `"true"` /
   `"false"` dans **Start new build › Environment variables**. La première version en production demande la fiche du store
   complète (textes, captures, confidentialité, classification, accès de revue de Plazo Pro) : sinon l'envoi est refusé et le
   bilan le dit. Ancienne consigne : **`PLAY_SUBMIT_AS_DRAFT` à `"false"`** (dans `codemagic.yaml`) quand les deux apps ont une première version
   déployée : le dire à Claude. D'ici là, chaque build arrive en **brouillon** dans Tests internes : ouvrir la version,
   **Démarrer le déploiement**.
10. [ ] **Notifications Android** (OneSignal) : chaque app OneSignal › **Settings › Push & In-App › Google Android (FCM)**
   demande la clé JSON d'un compte de service **Firebase**. Projet Firebase de Plazo : `plazo-eac2e` (nom affiché
   « Plazo-Pro », il sert aux deux apps), compte joannysimpore@gmail.com ; apps Android déclarées le 21/10/2026 :
   `com.benfordtech.plazo` et `com.benfordtech.plazopro` (les anciennes `com.benfordtech.parking_app…` ne servent plus).
   Reste à faire à la main : console Firebase › `plazo-eac2e` › **Paramètres du projet › Comptes de service › Générer une
   nouvelle clé privée**, puis déposer ce JSON dans les deux apps OneSignal (jamais dans le dépôt ni dans une conversation).


### Avertissements de la Play Console sur le build 114 (15/10/2026)

La Play Console a signalé quatre points sur le build 1.0.0 (114). Les noms masqués qu'elle cite (« u41.Q », « go3.e »…)
se retrouvent avec l'action **`mapping`** du workflow GitHub « Codemagic build » : y coller les noms, elle lit le
`mapping.txt` de chaque build récent et donne la classe d'origine.

- **Affichage de bord à bord (Android 15)** : traité. L'app (qui vise Android 16, SDK 36) s'affiche sous la barre d'état
  et la barre de navigation sur tous les Android : `MainActivity.kt` appelle `enableEdgeToEdge()`, et chaque écran garde
  ses boutons hors des barres. Le workflow GitHub « Android emulator (edge-to-edge) » le vérifie sur Android 15 et 16 avec
  des captures. L'avertissement peut rester affiché : il se fonde sur la présence des API ci-dessous.
- **API obsolètes** (`setStatusBarColor`, `setNavigationBarColor`, `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`) : aucune
  n'est dans le code de Plazo. Elles sont dans **AndroidX** (`EdgeToEdgeApi23/26/29/35`, c'est-à-dire
  `enableEdgeToEdge()` lui-même : u41, v41, x41, z41), dans le **moteur Flutter** (l1) et dans **Stripe**
  (`ElementsBottomSheetLayout`, thème de Financial Connections, encore présents dans la dernière version de Stripe). Rien à
  faire de notre côté : elles disparaîtront avec les mises à jour de ces bibliothèques, et Android 15 les ignore.
- **Images téléchargées et décodées à la main** (go3.e, io3.a) : c'est **OneSignal**, pour l'image d'une notification
  (`NotificationDisplayBuilder.getBitmapFromURL`, `NotificationDisplayer.addBackgroundImage`). Plazo n'envoie jamais
  d'image dans ses notifications : ce code ne tourne pas. Rien à faire.
- **Optimisation R8 faible (36-37 %)** : la règle `-keep class com.stripe.** { *; }` que **flutter_stripe** impose à
  toute app (elle évite un plantage pendant la validation 3D Secure) garde tout le SDK de Stripe sans le réduire. Une app
  ne peut pas retirer la règle d'une bibliothèque ; la contourner ferait courir le risque de casser le paiement. Choix du
  15/10/2026 : on la garde. Le rapport R8 du workflow de l'émulateur montre la part de Stripe dans l'app.

---

## 3 bis. Connexion avec Apple et Google dans Plazo Pro (13/10/2026)

Plazo Pro propose « Continuer avec Apple » sur iPhone et « Continuer avec Google » sur Android et, depuis le 22/10/2026, sur
iPhone et sur l'espace pro web (plazo.fr/pro) ; la personne tape ensuite le
code du jour de son parking et un gérant accepte sa demande. Le code est livré ; chaque bouton n'apparaît qu'une fois ses
réglages faits ci-dessous. Tant qu'ils ne le sont pas, les builds marchent comme avant, sans le bouton (l'étape « Sign in with
Apple » de `mobile-release` le dit dans son journal).

**Apple** (compte Account Holder ou Admin de l'équipe Benford Tech `3BX4795V2Y`) :
1. [ ] **Capacité** : [developer.apple.com](https://developer.apple.com/account) › Certificates, Identifiers & Profiles ›
   **Identifiers** › `com.benfordtech.plazopro` › cocher **Sign In with Apple** (« Enable as a primary App ID ») › **Save**.
   Le profil « Plazo Pro App Store » passe alors à **Invalid**.
2. [ ] **Profil** : **Profiles** › le profil App Store de Plazo Pro › **Edit**, garder le même certificat (celui de Thempo) ›
   **Save**.
3. [ ] **Codemagic** : Teams › Personal account › **Code signing identities** › iOS provisioning profiles : supprimer
   `plazo_pro_app_store`, **Fetch profiles**, choisir le nouveau profil de Plazo Pro et lui redonner **exactement** le nom de
   référence `plazo_pro_app_store`. Au build suivant, l'étape « Sign in with Apple » dit « capacité présente ».
4. [ ] **Clé** : **Keys** › **+** › nom « Plazo Sign in with Apple », cocher **Sign in with Apple** › **Configure** › Primary App
   ID `com.benfordtech.plazopro` › **Save** › **Continue** › **Register** › **Download** (le fichier `.p8` ne se télécharge
   qu'une fois) ; noter le **Key ID**. Les clés APNs et App Store Connect existantes ne servent pas ici.
5. [ ] **Vercel** (Production, type Sensitive) : `APPLE_SIGNIN_KEY_ID` = le Key ID, `APPLE_SIGNIN_PRIVATE_KEY` = tout le
   contenu du `.p8` (copié du fichier, jamais dans une conversation), puis **Redeploy**. Ranger le `.p8` dans le gestionnaire
   de mots de passe et le supprimer de l'ordinateur. Sans cette clé, l'API répond qu'Apple n'est pas disponible et le bouton
   reste caché, car elle sert à **révoquer** l'accès quand quelqu'un supprime son compte (règle 5.1.1(v)).
   `APPLE_TEAM_ID` (3BX4795V2Y) et `APPLE_CLIENT_IDS` (`com.benfordtech.plazopro`) ont déjà la bonne valeur par défaut.
6. [ ] **Adresses relais** : Certificates, Identifiers & Profiles › **Services** › « Sign in with Apple for Email
   Communication » › **Configure** : ajouter le domaine `plazo.fr` et l'adresse d'envoi de Brevo (`EMAIL_FROM`), puis vérifier
   SPF et DKIM. Sans cela, les e-mails envoyés à une adresse `@privaterelay.appleid.com` (« Masquer mon adresse ») n'arrivent pas.

**Google** (Android) :
1. [ ] **Projet** : [console.cloud.google.com](https://console.cloud.google.com) › nouveau projet **« Plazo »** (pas celui de
   Yoon : l'écran de connexion montre le nom et le logo de l'app de ce projet).
2. [ ] **Google Auth Platform** › **Branding** : nom « Plazo Pro », e-mail d'assistance (le vrai, point 0.3 de
   `fiches-stores.md`), page d'accueil `https://www.plazo.fr`, confidentialité `https://www.plazo.fr/confidentialite`, domaine
   autorisé `plazo.fr`. **Audience** : External, puis **Publish app** (seuls openid, email et profile sont demandés : pas de
   vérification par Google).
3. [ ] **Clients** › **Create client** › **Web application**, nom « Plazo Pro (serveur) » : son **Client ID** (public, se
   termine par `.apps.googleusercontent.com`) va dans Vercel `GOOGLE_CLIENT_IDS` **et** dans Codemagic, groupe `mobile_secrets`
   de l'app `plazo`, sous le nom `GOOGLE_SERVER_CLIENT_ID`.
4. [ ] **Clients** › **Create client** › **Android**, paquet `com.benfordtech.plazopro`, empreinte **SHA-1 de la clé de
   signature d'application** (Play Console › Plazo Pro › Tester et publier › **Intégrité de l'application** › Signature
   d'application › « Certificat de la clé de signature d'application ») ; puis un **second** client Android, même paquet, avec la
   SHA-1 du « Certificat de la clé d'importation » (même page), pour les APK installés directement depuis Codemagic.
5. [ ] **Redeploy** Vercel, puis lancer `mobile-release` ou `mobile-release-android` : le journal ne doit plus dire
   « GOOGLE_SERVER_CLIENT_ID absent ».
6. [ ] **Espace pro web** (22/10/2026) : dans le client **Web application** du point 3 › **Authorized JavaScript origins**,
   ajouter `https://www.plazo.fr` (et `http://localhost:8080` pour les essais en local) › **Save**. Le bouton Google de
   plazo.fr/pro/login et de Mon compte utilise ce même client (l'API le donne à la page) ; sans l'origine, Google affiche
   « origin_mismatch ». Un compte Google relié à aucun membre est renvoyé vers Plazo Pro et le code du jour.
7. [ ] **iPhone** (22/10/2026) : **Clients** › **Create client** › **iOS**, Bundle ID `com.benfordtech.plazopro` (Team ID
   `3BX4795V2Y`) : son **Client ID** (public) va dans Codemagic, groupe `mobile_secrets` de l'app `plazo`, sous le nom
   `GOOGLE_IOS_CLIENT_ID`. Le build iOS de Plazo Pro ajoute alors l'adresse de retour de Google (`com.googleusercontent.apps.…`)
   et le bouton ; sans lui, le journal dit « Plazo Pro iPhone sans « Continuer avec Google » ».

**Revue** : les relecteurs ne peuvent pas recevoir un code du jour. Le compte de revue (point 0.5 de `fiches-stores.md`)
reste un compte e-mail et mot de passe ; les notes de revue peuvent expliquer que le gérant de revue voit le code dans
Plus › Équipe, qu'un second compte (Apple) peut le taper, puis être accepté.

---

## 4. Ce qu'il faut renvoyer à Claude, et ce qu'il ne faut jamais coller

**À envoyer (valeurs non secrètes) :**
- [x] l'Apple ID numérique de Plazo (`6821635235`) et de Plazo Pro (`6821635650`), posés le 11/10/2026 ;
- [ ] les identifiants définitifs, s'ils changent, **avant** toute création dans les consoles ;
- [ ] les empreintes **SHA-256** de la clé de signature Play (Play Console › Protégé avec Play › Signature d'application
  Play), pour `site/public/.well-known/assetlinks.json` ; le Team ID Apple est connu (`3BX4795V2Y`) et déjà dans
  `site/public/.well-known/apple-app-site-association` ;
- [ ] « première version interne déployée sur les deux apps », pour passer `PLAY_SUBMIT_AS_DRAFT` à `"false"` ;
- [ ] les noms des groupes de testeurs externes TestFlight, le jour où le personnel du client doit recevoir les builds
  (`TESTFLIGHT_BETA_GROUPS`) ;
- [ ] si un build échoue : le lien du build Codemagic et le message d'erreur.

**À ne jamais coller dans une conversation ni dans le dépôt :** les fichiers de clé Android (`.jks`) et leurs mots de passe, le jeton de l'API Codemagic (il va dans un secret GitHub), la clé
JSON du compte de service (elle contient `private_key`), les fichiers `.p8` (API App Store Connect, APNs), les clés
REST OneSignal, tout jeton Codemagic, les mots de passe et codes de double authentification. Ils vont seulement dans
Codemagic (Code signing identities, variables « Secret »), OneSignal, Vercel et le gestionnaire de mots de passe.

## Sources (relues le 09/10/2026)

- Codemagic : https://docs.codemagic.io/yaml-code-signing/signing-ios/ (« Apple limits the number of Apple Distribution
  certificates to 3 », Fetch profiles, profils et certificat par Reference name) ·
  https://docs.codemagic.io/yaml-code-signing/signing-android/ ·
  https://docs.codemagic.io/yaml-publishing/google-play/ · https://docs.codemagic.io/yaml-publishing/app-store-connect/ ·
  https://docs.codemagic.io/yaml-running-builds/webhooks/ · https://docs.codemagic.io/billing/pricing/ ; outils en ligne
  de commande (11/10/2026, envoi de plusieurs paquets depuis un workflow) :
  https://github.com/codemagic-ci-cd/cli-tools/blob/master/docs/google-play/bundles/publish.md ·
  https://github.com/codemagic-ci-cd/cli-tools/blob/master/docs/app-store-connect/publish.md ·
  https://help.codemagic.io/articles/5483007174-how-do-i-automatically-submit-and-release-production-apps-to-the-app-store-and-google-play-from-my-codemagic-pipeline
  (« remove the corresponding `publishing:` block »)
- Modèle qui publie déjà : `Benford-Tech/tempo-app`, `codemagic.yaml` (workflow `release`, version 1.1.3 publiée sur Google
  Play et App Store Connect le 09/10/2026).
- Apple : https://developer.apple.com/help/account/identifiers/register-an-app-id/ ·
  https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/
- Google : https://developers.google.com/android-publisher/getting_started ·
  https://support.google.com/googleplay/android-developer/answer/9844686 ·
  https://support.google.com/googleplay/android-developer/answer/13392821
