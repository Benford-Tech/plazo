# Publier Plazo et Plazo Pro sur les stores

État au 09/10/2026. Les pipelines sont dans `codemagic.yaml`, à la racine du dépôt. Aucun build n'a encore tourné : ce
document est la marche à suivre, dans l'ordre, pour que le premier tourne.

Codemagic n'existe qu'en anglais : ses libellés restent en anglais ici. Pour Google, les libellés sont en français, avec
l'anglais entre parenthèses quand il aide. Les consoles Apple sont citées en anglais.

## Les pipelines

Cinq workflows Codemagic, un par store et par app, pour que Google Play n'attende pas Apple :

| Workflow | Quand | Ce qu'il fait |
| --- | --- | --- |
| `mobile-check` | push sur `main` qui touche `mobile/` | nom du produit à jour, `flutter analyze`, `flutter test`, APK **debug** des deux apps |
| `plazo-android-release` | tag `mobile-vX.Y.Z` ou à la main | Plazo (voyageurs) : AAB signé → **Google Play, tests internes** |
| `plazo-ios-release` | tag `mobile-vX.Y.Z` ou à la main | Plazo (voyageurs) : IPA signé → **TestFlight** |
| `plazo-pro-android-release` | tag `mobile-vX.Y.Z` ou à la main | Plazo Pro (personnel) : AAB signé → Google Play, tests internes |
| `plazo-pro-ios-release` | tag `mobile-vX.Y.Z` ou à la main | Plazo Pro (personnel) : IPA signé → TestFlight |

- **Version** = le `version:` de `mobile/pubspec.yaml` (ex. `1.0.0`). Le tag doit la reprendre : `mobile-v1.0.0`, sinon le
  build s'arrête tout de suite (« le tag … ne correspond pas à la version … »).
- **Numéro de build** = compteur Codemagic + 100, jamais en dessous du dernier build connu du store (lu au moment du build).
- Les stores reçoivent une version **de test** (tests internes, TestFlight) : la mise en production se décide dans chaque
  console.
- Tant qu'Apple n'est pas prêt, lancer les deux workflows Android **à la main** plutôt que poser un tag : un tag lance
  aussi les deux workflows iOS, qui échoueraient à la signature.

## 0. À décider avant de commencer

- [ ] **Les identifiants des apps sont-ils définitifs ?** Aujourd'hui :

  | | Android (Play) | iOS (Apple) |
  |---|---|---|
  | Plazo | `com.benfordtech.parking_app` | `com.benfordtech.parkingApp` |
  | Plazo Pro | `com.benfordtech.parking_app.pro` | `com.benfordtech.parkingApp.pro` |

  - Un nom de package Android est « unique et permanent » : il ne peut être ni supprimé ni réutilisé.
  - Le Bundle ID iOS ne change plus après l'envoi du premier build.
  - Pour en changer, le dire à Claude **avant** de créer les App ID Apple et les apps dans les consoles.
- [ ] **Quelle société publie ?** Il faut une société existante, avec un numéro D-U-N-S. Son nom s'affiche comme vendeur
  sur l'App Store. Le même D-U-N-S sert pour Apple et pour Google.
- [ ] **Un gestionnaire de mots de passe** (Bitwarden, 1Password…). On y garde la clé d'import Android, ses mots de passe,
  la clé `.p8` Apple, la clé `cert_key` et le JSON Google. Jamais dans le dépôt, jamais dans une conversation.

---

## 1. Codemagic

1. [ ] **Créer le compte** sur https://codemagic.io/signup avec « Sign up with GitHub ».
   - **Ne pas créer d'équipe (« Team »).** Les 500 minutes gratuites par mois (machines macOS M2) ne valent que pour le
     compte personnel ; une équipe est facturée à la minute. Une publication des quatre workflows consomme environ
     une heure : activer la facturation (Billing) avant de manquer de minutes.
2. [ ] **Relier GitHub et donner accès au dépôt `Benford-Tech/plazo`.**
   - Dans Applications, cliquer sur **Add application**, puis choisir **GitHub**.
   - Cliquer sur **Install GitHub App** et choisir l'organisation **Benford-Tech**. Il faut être propriétaire de
     l'organisation, sinon GitHub envoie une demande d'approbation.
   - Choisir **Only select repositories**, puis `plazo`, et **Install & Authorize**.
   - Pour revoir les accès plus tard : GitHub › Settings › Applications › Codemagic CI/CD › Configure.
3. [ ] **Ajouter l'application.**
   - Choisir le dépôt `Benford-Tech/plazo`, type de projet **Flutter App**. Si on vous propose « Workflow Editor » ou
     `codemagic.yaml`, prendre **codemagic.yaml**.
   - Cliquer sur **Finish: Add application**. Codemagic lit le fichier à la racine du dépôt ; chaque workflow travaille
     dans `mobile/`.
4. [ ] **Vérifier que les workflows sont reconnus.**
   - Sur la page de l'app, onglet `codemagic.yaml` : choisir la branche `main`, puis **Check for configuration file**.
   - Cinq workflows doivent apparaître, sous leur nom affiché : « Mobile — vérifications + APK de test (debug) »,
     « Plazo (voyageurs) — Google Play, tests internes », « Plazo (voyageurs) — TestFlight », « Plazo Pro (personnel) —
     Google Play, tests internes », « Plazo Pro (personnel) — TestFlight ».
5. [ ] **Créer le groupe de variables `mobile_secrets`.**
   - Sur la page de l'app : onglet **Environment variables**.
   - Pour chaque variable : remplir **Variable name** et **Variable value**, taper le groupe `mobile_secrets` (le créer la
     première fois), cocher **Secret**, puis cliquer sur **Add**.
   - Une variable « Secret » ne se relit plus. Pour la changer, la supprimer puis la recréer.

   | Variable (nom exact) | Valeur | Où l'obtenir |
   |---|---|---|
   | `KEYSTORE_FILE` | base64 de la clé d'import `.jks` | étape 3.3 |
   | `KEY_PROPERTIES_FILE` | base64 du fichier `key.properties` | étape 3.4 |
   | `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` | **tout le contenu du fichier JSON**, collé tel quel (pas en base64) | étape 3.5 |
   | `CERTIFICATE_PRIVATE_KEY` | contenu de `cert_key`, lignes `-----BEGIN…` et `-----END…` comprises | étape 2.7 |
   | `ONESIGNAL_APP_ID` | App ID OneSignal de **Plazo Pro** (OneSignal › Settings › Keys & IDs) | OneSignal |
   | `ONESIGNAL_TRAVELLER_APP_ID` | App ID OneSignal de **Plazo** : une app OneSignal par app, car ses réglages iOS ne tiennent qu'un Bundle ID | OneSignal |
   | `API_BASE_URL` | facultatif : `https://www.plazo.fr/api` est déjà la valeur par défaut | — |
   | `STRIPE_MERCHANT_ID` | facultatif, plus tard : Merchant ID Apple Pay, une fois Apple Pay ajouté à l'app par Claude | Apple |

   Sans app OneSignal, le build passe, mais les notifications de cette version sont coupées (« ATTENTION » dans le journal).

   **Et dans Vercel** (Settings › Environment Variables, Production, puis redéployer), avant d'envoyer une version de Plazo
   aux testeurs : `ONESIGNAL_TRAVELLER_APP_ID` et `ONESIGNAL_TRAVELLER_REST_API_KEY` de l'app OneSignal Plazo (à côté de
   `ONESIGNAL_APP_ID` et `ONESIGNAL_REST_API_KEY` de Plazo Pro). Sans elles, l'API envoie les notifications des voyageurs
   par l'app OneSignal du personnel, qui ne connaît pas leurs téléphones : elles se perdent sans bruit.
6. [ ] **Relier App Store Connect sous le nom exact `plazo-asc`** (une fois l'étape 2.6 faite).
   - Compte personnel : menu de gauche **Teams › Personal Account › Integrations**.
   - Sur la ligne **Developer Portal**, cliquer sur **Connect** et remplir : **App Store Connect API key name** =
     `plazo-asc`, **Issuer ID**, **Key ID**, **API key** = le fichier `.p8`. Cliquer sur **Save**.
   - Une intégration du compte personnel ne sert qu'aux apps qui ne sont dans aucune équipe.
7. [ ] **Lancer `mobile-check` à la main**, tout de suite : il n'a besoin d'aucun secret.
   - Sur la page de l'app : **Start new build**, branche `main`, workflow `mobile-check`, puis **Start new build**.
   - Il produit deux APK de test dans **Artifacts**, à installer sur un téléphone Android pour essayer.
8. [ ] **Vérifier les déclenchements automatiques.**
   - Après le prochain push sur `main` qui modifie `mobile/`, ouvrir l'onglet **Webhooks** de l'app.
   - Si aucune livraison n'apparaît, ajouter le webhook dans GitHub : `plazo` › **Settings › Webhooks › Add webhook**.
     - Payload URL : `https://api.codemagic.io/hooks/<appId>` (l'`appId` est la partie qui suit `codemagic.io/app/`
       dans l'adresse) ;
     - Content type : `application/json` ;
     - événements : « Branch or tag creation », « Pushes ».
   - Si `mobile-check` est marqué « skipped » alors que `mobile/` a changé, le signaler à Claude.
9. [ ] **Publier une version par tag** (une fois les étapes 2 et 3 faites).
   - Demander à Claude de monter `version:` dans `mobile/pubspec.yaml` ; une fois une version publiée sur l'App Store,
     TestFlight refuse les builds qui gardent le même numéro.
   - Poser le tag sans ligne de commande : GitHub › **Releases › Draft a new release**, taper `mobile-v1.0.1` (la version de
     `pubspec.yaml`) dans le champ du tag, « Create new tag », cible `main`, puis **Publish release**. Claude peut aussi le
     poser. Les quatre workflows de publication partent.

---

## 2. Apple

1. [ ] **S'inscrire à l'Apple Developer Program comme organisation** : https://developer.apple.com/programs/enroll/
   - Prérequis : un compte Apple avec la double authentification, au prénom et au nom légaux de la personne ; une entité
     juridique (Apple refuse les noms commerciaux et les succursales) ; le pouvoir d'engager la société ; un site web
     public de la société et un e-mail professionnel sur son domaine.
   - **D-U-N-S** : le vérifier ou le demander gratuitement via https://developer.apple.com/enroll/duns-lookup/. D&B met
     jusqu'à 5 jours ouvrés pour l'attribuer, et Apple jusqu'à 2 jours de plus pour le voir.
   - Prix : 99 USD par an, affiché en devise locale.
   - Accepter tout nouvel accord affiché (compte développeur et App Store Connect) : un accord en attente bloque les envois.
2. [ ] **Noter le Team ID** : developer.apple.com/account › Membership details › Team ID. Il servira aux liens qui ouvrent
   l'app.
3. [ ] **Créer les deux App ID à la main**, avant tout build, avec leurs capacités.
   - Chemin : **Certificates, Identifiers & Profiles › Identifiers › (+) › App IDs › Continue › App › Continue**, puis
     **Description**, **Explicit** + **Bundle ID**, cocher les capacités, **Continue**, **Register**.
     - [ ] `com.benfordtech.parkingApp` (description « Plazo ») : **Push Notifications** + **Associated Domains**.
     - [ ] `com.benfordtech.parkingApp.pro` (description « Plazo Pro ») : **Push Notifications** seulement.
   - Pourquoi à la main : si l'App ID manque, le pipeline le crée sans aucune capacité ; le profil de signature n'aurait
     alors ni les notifications ni les domaines associés, et la signature iOS échouerait.
4. [ ] **Créer les deux apps dans App Store Connect** : **Apps › (+) › New App**.
   - Platforms : iOS. Name : « Plazo » ou « Plazo Pro » (si le nom est pris sur l'App Store, en choisir un autre : le nom
     sous l'icône ne change pas). Primary Language : Français. Bundle ID : celui de l'étape 3.
   - SKU : par ex. `PLAZO-IOS` et `PLAZO-PRO-IOS` (il ne change plus ensuite). User Access : Full Access, puis **Create**.
5. [ ] **Relever l'Apple ID numérique de chaque app** : app › **App Information** › General Information › **Apple ID**
   (une suite de chiffres). Le donner à Claude, qui le pose dans `codemagic.yaml` (`APP_STORE_APP_ID`).
6. [ ] **Créer la clé API App Store Connect.**
   - Une seule fois, par le titulaire du compte (Account Holder) : **Users and Access › Integrations › App Store Connect
     API › Request Access**, cocher les conditions, **Submit**.
   - Ensuite : **Team Keys › Generate API Key** (ou (+)). Name : « Codemagic ». Access : **App Manager**. **Generate**.
   - **Download API Key** : le fichier `AuthKey_XXXXXXXX.p8` **ne se télécharge qu'une fois**.
   - Noter l'**Issuer ID** (au-dessus du tableau des clés) et le **Key ID** (dans la ligne de la clé), à saisir dans
     Codemagic avec le `.p8` (étape 1.6).
7. [ ] **Créer la clé privée du certificat de distribution** (`CERTIFICATE_PRIVATE_KEY`).
   - Mac, dans le Terminal : `ssh-keygen -t rsa -b 2048 -m PEM -f ~/Desktop/cert_key -q -N ""`
   - Windows (PowerShell) : `ssh-keygen -t rsa -b 2048 -m PEM -f "$env:USERPROFILE\Desktop\cert_key" -q`, puis deux fois
     Entrée pour une phrase secrète vide.
   - Copier le contenu : Mac `pbcopy < ~/Desktop/cert_key` ; Windows
     `Get-Content "$env:USERPROFILE\Desktop\cert_key" -Raw | Set-Clipboard`. Le coller dans `CERTIFICATE_PRIVATE_KEY`.
   - Garder `cert_key` (le `.pub` est inutile) : chaque build réutilise **la même** clé. Au premier build, Codemagic crée
     avec elle le certificat « Apple Distribution » ; Apple en limite le nombre à 3 (en révoquer un inutilisé au besoin).
   - Si la signature iOS échoue avec une erreur 403 ou « forbidden » : vérifier les accords en attente, puis, si l'erreur
     persiste, recréer la clé API avec l'accès Admin.
8. [ ] **Testeurs TestFlight.**
   - Internes : des utilisateurs d'App Store Connect, 100 au plus, invités par **Users and Access › (+)**. Puis app ›
     **TestFlight** › (+) à côté de **Internal Testing**, nommer le groupe, cocher **Enable automatic distribution**,
     **Create**, puis **Invite Testers**. Les testeurs installent l'app TestFlight.
   - Le pipeline soumet aussi chaque build à la relecture bêta d'Apple : remplir **TestFlight › Test Information**
     (description, e-mail de retour, contact) et, pour Plazo Pro, un **compte de démonstration** du personnel. Sinon cette
     soumission échoue sans bruit ; les testeurs internes reçoivent quand même le build.
   - Pour le personnel du client n°1, qui n'a pas de compte App Store Connect : créer un groupe **External Testing** et en
     donner le nom à Claude.

---

## 3. Google Play

1. [ ] **Créer un compte développeur « Organisation »** : https://play.google.com/apps/publish/signup
   - 25 USD une seule fois. D-U-N-S obligatoire, plus le site web de l'organisation, le contact pour Google, l'e-mail et le
     téléphone du développeur (vérifiés par code), un profil de paiement au nom et à l'adresse de la société.
   - La règle « test fermé de 12 testeurs pendant 14 jours avant la production » ne vise que les comptes personnels.
2. [ ] **Créer les deux apps** : **Toutes les applications › Créer une application**.
   - Nom (« Plazo », puis « Plazo Pro »), langue par défaut Français, appli, gratuite, e-mail de contact.
   - **Déclarations** : tout accepter, y compris les conditions de la signature d'application Play, puis **Créer
     l'application**. Le nom de package se fixe au premier envoi de l'AAB.
3. [ ] **Créer la clé d'import** (alias `upload`, la même pour les deux apps).
   - `keytool` vient de Java. Avec Java installé :
     - Mac : `keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -storetype JKS -keysize 2048 -validity 10000 -alias upload`
     - Windows (PowerShell) :
       `keytool -genkey -v -keystore $env:USERPROFILE\upload-keystore.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
   - Sans Java (sur Mac, `keytool` répond alors « Unable to locate a Java Runtime ») : installer Android Studio et utiliser
     le sien, chemin entre guillemets :
     - Mac : `"/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -storetype JKS -keysize 2048 -validity 10000 -alias upload`
     - Windows (PowerShell) :
       `& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore $env:USERPROFILE\upload-keystore.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
   - Mot de passe : **lettres et chiffres seulement**, 20 caractères ou plus (une barre oblique inverse serait mal lue dans
     `key.properties`). Répondre aux questions (nom, société, ville, code pays `FR`) ; au mot de passe de la clé, Entrée
     pour garder le même.
   - Sauvegarder `upload-keystore.jks` et le mot de passe : si on les perd, il faut demander une réinitialisation de la clé
     d'import dans la console.
4. [ ] **Préparer `key.properties`, puis passer les deux fichiers en base64.**
   - Contenu exact, en texte brut (sur Mac, dans TextEdit : Format › Convertir au format texte) :
     ```
     # Plazo - cle d'import Google Play
     storePassword=MOT_DE_PASSE
     keyPassword=MOT_DE_PASSE
     keyAlias=upload
     storeFile=upload.jks
     ```
   - `storeFile` doit être **exactement `upload.jks`** (pas le chemin de votre ordinateur) : le pipeline dépose la clé sous
     ce nom. La ligne de commentaire protège contre l'en-tête invisible de certains éditeurs Windows.
   - **Enregistrer sous le nom exact `key.properties`, dans le dossier personnel**, à côté de `upload-keystore.jks` :
     - Mac (TextEdit) : dans la fenêtre d'enregistrement, Cmd+Maj+H pour le dossier de départ ; si TextEdit propose
       `.txt`, choisir « Utiliser .properties » ;
     - Windows (Bloc-notes) : dossier `C:\Users\<vous>`, Type « Tous les fichiers (*.*) ».
     - Vérifier : Mac `cat ~/key.properties`, Windows `Get-Content "$env:USERPROFILE\key.properties"` affichent les cinq
       lignes.
   - Mac : `cat ~/upload-keystore.jks | base64 | pbcopy` → `KEYSTORE_FILE` ; `cat ~/key.properties | base64 | pbcopy` →
     `KEY_PROPERTIES_FILE`.
   - Windows (PowerShell, chemin complet obligatoire) :
     `[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\upload-keystore.jks")) | Set-Clipboard`, puis la
     même commande avec `"$env:USERPROFILE\key.properties"`. **Pas `certutil -encode`**, qui ajoute des lignes
     « BEGIN/END CERTIFICATE ».
   - Le pipeline vérifie les deux variables et les quatre lignes de `key.properties`, et dit laquelle manque.
5. [ ] **Créer le compte de service pour l'API Google Play.**
   - Dans Google Cloud (https://console.cloud.google.com) : créer ou choisir un projet.
   - Activer l'API : https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com (Google Play Android
     Developer API), bouton **Activer**. Sans elle, toute publication répond 403.
   - **IAM et administration › Comptes de service › Créer un compte de service** (nom `codemagic-play`), terminer.
   - Ouvrir le compte : onglet **Clés › Ajouter une clé › Créer une clé › JSON › Créer**. Ouvrir le `.json` téléchargé
     dans un éditeur de texte, tout sélectionner et coller dans `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS`.
   - Si la console répond que la création de clés est désactivée (organisation Google Cloud créée depuis mai 2024) :
     utiliser un projet hors organisation, ou faire lever la contrainte `iam.disableServiceAccountKeyCreation`.
   - Il n'est plus nécessaire de relier le projet Cloud dans la Play Console (l'ancienne page « Accès API »).
6. [ ] **Inviter le compte de service dans la Play Console** : **Utilisateurs et autorisations › Inviter de nouveaux
   utilisateurs**, e-mail du compte de service (`…@….iam.gserviceaccount.com`).
   - Onglet **Autorisations des applications › Ajouter une application** : Plazo et Plazo Pro, **Appliquer**, puis cocher
     « Publier des applications sur des canaux de test », « Gérer les canaux de test et modifier les listes de
     testeurs », et « Mettre les applications à disposition de tous les utilisateurs… » pour la suite.
   - **Autorisations du compte** : rien (pas d'accès Admin). Cliquer sur **Inviter un utilisateur**.
   - Il n'existe pas de rôle « Release manager » : ce sont ces autorisations-là.
7. [ ] **Liste des testeurs internes** (pour chaque app) : **Tester et publier › Tests › Tests internes**, onglet
   **Testeurs**, **Créer une liste de diffusion** (100 comptes Google au plus), **Enregistrer les modifications**. Le lien
   d'activation à envoyer aux testeurs n'apparaît qu'une fois une version publiée.
8. [ ] **Premier envoi à la main** (obligatoire : l'API refuse tant qu'aucun bundle n'a été importé dans la console).
   - Dans Codemagic, lancer **`plazo-pro-android-release`** (puis `plazo-android-release`) par **Start new build**, sur
     `main`. Il n'a pas besoin d'Apple.
   - L'envoi vers Google Play échoue sur ce premier build (« Package not found ») : **c'est attendu**.
   - Dans **Artifacts**, sur la page du build, télécharger `plazo-pro-v1.0.0-<n°>.aab` (ou `plazo-v1.0.0-<n°>.aab`).
   - Play Console : **Tester et publier › Tests › Tests internes › Créer une version**. Signature d'application Play :
     garder le choix par défaut (Google garde la clé de signature). **Importer** l'AAB, nom de version, **Suivant**,
     **Enregistrer**, puis **Démarrer le déploiement**.
   - Avant ce déploiement, la console demande les formulaires de l'étape 10 (au moins la déclaration du service de premier
     plan « location »).
9. [ ] **Passer `submit_as_draft` à `false`** quand **les deux** apps ont une première version déployée en tests internes :
   le dire à Claude. D'ici là, chaque build automatique arrive en **brouillon** dans Tests internes : ouvrir la version,
   puis **Démarrer le déploiement**. Ensuite, les builds arrivent seuls chez les testeurs.
10. [ ] **Contenu de l'application** (*App content*) : sécurité des données, classification, public cible, URL de
    confidentialité (`https://www.plazo.fr/confidentialite`), et déclaration du **service de premier plan « location »**
    (description, impact, **lien vers une vidéo** de démonstration). Pour les liens qui ouvrent l'app : relever les
    empreintes **SHA-256** de la clé de signature (**Protégé avec Play › Distribution sur le Play Store › Accéder à la
    signature d'application Play**, section « Clé de signature d'applications »).

---

## 4. Ce qu'il faut renvoyer à Claude, et ce qu'il ne faut jamais coller

**À envoyer (valeurs non secrètes) :**
- [ ] l'Apple ID numérique de Plazo et de Plazo Pro (il remplace `APP_STORE_APP_ID: "0"`) ;
- [ ] les identifiants définitifs, s'ils changent : packages Android et Bundle ID iOS, **avant** toute création dans les
  consoles ;
- [ ] le Team ID Apple et les empreintes SHA-256 de la clé de signature Play, pour `apple-app-site-association` et
  `assetlinks.json` ;
- [ ] « première version interne déployée sur les deux apps », pour passer `submit_as_draft` à `false` ;
- [ ] le nom du groupe TestFlight externe, s'il y en a un ;
- [ ] si un build échoue : le lien du build Codemagic et le message d'erreur ; et si `mobile-check` reste « skipped ».

**À ne jamais coller dans une conversation ni dans le dépôt :**
- le fichier `upload-keystore.jks`, son base64 et ses mots de passe ;
- `key.properties`, en clair ou en base64 ;
- le fichier `AuthKey_….p8` et son contenu ;
- `cert_key` (« BEGIN RSA PRIVATE KEY ») ;
- le JSON du compte de service Google (il contient `private_key`) ;
- les mots de passe et codes de double authentification Apple et Google ;
- la clé REST API de OneSignal et tout jeton Codemagic.

Ces valeurs vont seulement dans Codemagic (variables « Secret ») et dans le gestionnaire de mots de passe.

## Sources (relues le 09/10/2026)

- Codemagic : https://docs.codemagic.io/getting-started/adding-apps/ · https://docs.codemagic.io/yaml-basic-configuration/configuring-environment-variables/ · https://docs.codemagic.io/yaml-running-builds/webhooks/ · https://docs.codemagic.io/billing/pricing/ · https://docs.codemagic.io/yaml-publishing/app-store-connect/ · https://docs.codemagic.io/yaml-code-signing/signing-ios/ · https://docs.codemagic.io/yaml-code-signing/alternative-code-signing-methods/ · https://docs.codemagic.io/yaml-publishing/google-play/ · https://docs.codemagic.io/yaml-code-signing/signing-android/
- cli-tools : https://github.com/codemagic-ci-cd/cli-tools (`fetch-signing-files`, `google_play/argument_types.py`)
- Apple : https://developer.apple.com/programs/enroll/ · https://developer.apple.com/help/account/identifiers/register-an-app-id/ · https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/ · https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/ · https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/
- Google : https://developers.google.com/android-publisher/getting_started · https://support.google.com/googleplay/android-developer/answer/9844686 · https://support.google.com/googleplay/android-developer/answer/9859348 · https://support.google.com/googleplay/android-developer/answer/13392821 · https://docs.flutter.dev/deployment/android
