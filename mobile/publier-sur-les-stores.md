# Publier Plazo et Plazo Pro sur les stores

État au 09/10/2026. Les comptes existent déjà : ceux qui publient Thempo, LoveNest et Yoon. Plazo s'y ajoute, signé et
publié comme Thempo, qui sort sur les deux stores depuis la même équipe Codemagic. Les pipelines sont dans
`codemagic.yaml`, à la racine du dépôt ; aucun build de Plazo n'a encore tourné.

Codemagic n'existe qu'en anglais : ses libellés restent en anglais ici. Pour Google, les libellés sont en français. Les
consoles Apple sont citées en anglais.

## Ce qui existe déjà

Relevé le 09/10/2026 dans les projets Thempo, LoveNest et Yoon (dépôts et sessions Claude), sans aucune valeur secrète.

| Où | Ce qui existe | Pour Plazo |
| --- | --- | --- |
| Apple | Équipe Apple Developer **Benford Tech**, Team ID **3BX4795V2Y** (LoveNest, Thempo, Yoon) | même équipe : pas de nouvelle inscription |
| Google Play | Compte développeur **Benford Tech** (Thempo publié par l'API, Yoon et LoveNest à la main) | même compte |
| Codemagic | Une **équipe** (Team) qui construit Thempo, LoveNest et Yoon ; intégration Developer Portal **`lovenest-asc`** (clé API App Store Connect de l'équipe Apple) ; certificat **Apple Distribution** dans Code signing identities (`thempo-distribution`) | Plazo rejoint cette équipe ; `codemagic.yaml` utilise `lovenest-asc` et ce certificat |
| Google Cloud | Le compte de service qui publie Thempo sur Google Play (clé JSON dans le groupe `google_play` de l'app Thempo) | le même, ouvert aux deux apps Plazo |
| OneSignal | Les deux apps de Plazo : Plazo Pro `89a1124f-3ba0-481e-b9f1-545d254e435d`, Plazo `dd3c2a74-a7b0-4117-ba18-ab5a1edfe0a3` | App ID déjà dans `codemagic.yaml` et dans Vercel, clés REST dans Vercel : **rien à faire** côté API |

Ce qui manque encore : les quatre fiches d'app (deux chez Apple, deux chez Google), les deux profils de signature Apple, la
clé d'import Android de Plazo, et les réglages push (APNs, FCM) de chaque app OneSignal.

## Les pipelines

| Où | Quand | Ce qu'il fait |
| --- | --- | --- |
| GitHub Actions `Mobile CI` | chaque PR et push sur `main` qui touche `mobile/` | nom du produit à jour, `flutter analyze`, `flutter test` (gratuit) |
| Codemagic `mobile-check` | à la main | les mêmes vérifications + APK **debug** des deux apps, à installer pour essayer |
| Codemagic `plazo-android-release` / `plazo-pro-android-release` | tag `mobile-vX.Y.Z` ou à la main | AAB signé → **Google Play, tests internes** (sans rien d'Apple) |
| Codemagic `plazo-ios-release` / `plazo-pro-ios-release` | tag `mobile-vX.Y.Z` ou à la main | IPA signé → **TestFlight**, testeurs internes |

- **Version** = le `version:` de `mobile/pubspec.yaml` (ex. `1.0.0`). Le tag doit la reprendre : `mobile-v1.0.0`, sinon le
  build s'arrête tout de suite (« le tag … ne correspond pas à la version … »).
- **Numéro de build** = compteur Codemagic + 100, jamais en dessous du dernier build connu du store.
- Les stores reçoivent une version **de test** ; la mise en production se décide dans chaque console.
- Tant que les profils Apple n'existent pas, lancer les deux workflows Android **à la main** plutôt que poser un tag.
- Les minutes d'une équipe Codemagic sont **payantes** (pas de minutes gratuites en équipe) : une publication des quatre
  workflows prend de l'ordre d'une heure de machine. C'est pourquoi les vérifications de chaque modification tournent sur
  GitHub Actions, gratuitement.

## 0. À décider avant de commencer

- [ ] **Les identifiants des apps.** Aujourd'hui :

  | | Android (Play) | iOS (Apple) |
  |---|---|---|
  | Plazo | `com.benfordtech.parking_app` | `com.benfordtech.parkingApp` |
  | Plazo Pro | `com.benfordtech.parking_app.pro` | `com.benfordtech.parkingApp.pro` |

  Ils ne changent plus après la création des fiches. Recommandation : **les garder**, ils sont neutres alors que le nom
  « Plazo » peut encore changer (les voyageurs ne voient jamais ces identifiants). Pour en changer, le dire à Claude
  **avant** l'étape 2.
- [ ] **Qui publie.** Avec les comptes existants, le vendeur affiché sur les stores est **Benford Tech**. Si c'est une autre
  société (par ex. « Plazo Aéroports »), il faut d'autres comptes Apple et Google à son nom, avec son D-U-N-S.

---

## 1. Codemagic (dans l'équipe existante)

1. [ ] **Ouvrir l'équipe** qui contient Thempo (menu de gauche **Teams**), puis **Applications › Add application ›
   GitHub**, et choisir `Benford-Tech/plazo`.
   - Si `plazo` n'apparaît pas : GitHub › organisation **Benford-Tech** › **Settings › GitHub Apps › Codemagic CI/CD ›
     Configure**, **Repository access** : ajouter `plazo`, **Save**.
   - Type de projet **Flutter App**, configuration **codemagic.yaml** (pas le Workflow Editor), **Finish: Add application**.
2. [ ] **Vérifier les workflows** : onglet `codemagic.yaml`, branche `main`, **Check for configuration file** : cinq
   workflows (« Mobile — vérifications + APK de test (debug, à la main) », « Plazo (voyageurs) — Google Play, tests
   internes », « Plazo (voyageurs) — TestFlight », « Plazo Pro (personnel) — Google Play, tests internes », « Plazo Pro
   (personnel) — TestFlight »).
3. [ ] **Vérifier la facturation de l'équipe** (Team settings › **Billing**) : sans moyen de paiement actif, les builds
   restent en file d'attente.
4. [ ] **Téléverser la clé d'import Android de Plazo** (créée à l'étape 3.2) : Team settings › **Code signing identities ›
   Android keystores › Upload keystore** : le fichier `.jks`, son mot de passe, l'alias `upload` et le mot de passe de la
   clé, **Reference name** exactement `plazo_upload`.
5. [ ] **Le groupe de variables `mobile_secrets`** : page de l'app › **Environment variables** › variable
   `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS`, groupe `mobile_secrets`, cocher **Secret**, **Add**. La valeur : **tout le
   contenu** d'une clé JSON du compte de service qui publie déjà Thempo (étape 3.4), collé tel quel (pas en base64).
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
   - [ ] `com.benfordtech.parkingApp` (description « Plazo ») : **Push Notifications** + **Associated Domains** ;
   - [ ] `com.benfordtech.parkingApp.pro` (description « Plazo Pro ») : **Push Notifications**.
2. [ ] **Créer les deux apps** dans App Store Connect : **Apps › (+) › New App**, iOS, nom « Plazo » ou « Plazo Pro »,
   langue Français, le Bundle ID de l'étape 1, SKU `PLAZO-IOS` / `PLAZO-PRO-IOS`.
3. [ ] **Créer les deux profils de signature, avec le certificat qui existe déjà** (Apple n'en accepte que 3 par compte :
   **ne pas en créer un nouveau**).
   - Repérer le certificat : Codemagic › Team settings › **Code signing identities › iOS certificates** montre
     `thempo-distribution` et sa date d'expiration.
   - Apple : **Profiles › (+) › Distribution › App Store Connect › Continue**, l'App ID `com.benfordtech.parkingApp`, puis
     le certificat **Apple Distribution** qui expire à cette date, nom « Plazo App Store », **Generate**. Même chose pour
     `com.benfordtech.parkingApp.pro`, nom « Plazo Pro App Store ».
4. [ ] **Les importer dans Codemagic** : **Code signing identities › iOS provisioning profiles › Fetch profiles**, cocher
   les deux profils, les enregistrer.
5. [ ] **Relever l'Apple ID numérique de chaque app** (app › **App Information** › **Apple ID**) et le donner à Claude, qui
   le pose dans `codemagic.yaml` (`APP_STORE_APP_ID`).
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

1. [ ] **Créer les deux apps** : **Toutes les applications › Créer une application**, « Plazo » puis « Plazo Pro »,
   Français, appli, gratuite ; **Déclarations** : tout accepter, y compris la signature d'application Play.
2. [ ] **Créer la clé d'import de Plazo**, une pour les deux apps, alias `upload`. **Jamais celle de Thempo, de LoveNest ou
   de Yoon** : le premier envoi fixe la clé d'une app pour toujours (un AAB de Yoon a déjà été refusé pour avoir été signé
   avec la clé de Thempo).
   - Mac : `keytool -genkey -v -keystore ~/plazo-upload.jks -keyalg RSA -storetype JKS -keysize 2048 -validity 10000 -alias upload`
   - Sans Java (Mac : « Unable to locate a Java Runtime »), avec celui d'Android Studio :
     `"/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" -genkey -v -keystore ~/plazo-upload.jks -keyalg RSA -storetype JKS -keysize 2048 -validity 10000 -alias upload`
   - Windows (PowerShell) :
     `& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore $env:USERPROFILE\plazo-upload.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
   - Mot de passe : **lettres et chiffres seulement**, 20 caractères ou plus ; même mot de passe pour la clé (Entrée).
   - Garder `plazo-upload.jks` et son mot de passe dans le gestionnaire de mots de passe, puis le téléverser dans
     Codemagic (étape 1.4).
3. [ ] **Ouvrir le compte de service aux deux apps** : **Utilisateurs et autorisations**, la ligne du compte de service
   (`…@….iam.gserviceaccount.com`, celui de Thempo) › **Autorisations des applications › Ajouter une application** : Plazo et
   Plazo Pro, cocher la section **Versions** (publier dans les canaux de test, gérer les canaux de test et les listes de
   testeurs, publier en production), **Appliquer**, puis enregistrer.
4. [ ] **Sa clé JSON pour Codemagic** : Google Cloud › **IAM et administration › Comptes de service** › ce compte ›
   **Clés › Ajouter une clé › Créer une clé › JSON**. Ouvrir le fichier, tout copier dans
   `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` (étape 1.5), puis le supprimer de l'ordinateur.
5. [ ] **Liste des testeurs internes** (pour chaque app) : **Tester et publier › Tests › Tests internes › Testeurs ›
   Créer une liste de diffusion** (comptes Google), **Enregistrer les modifications**.
6. [ ] **Premier envoi à la main** (l'API refuse une app jamais publiée) :
   - Codemagic : **Start new build**, `main`, workflow `plazo-pro-android-release` (puis `plazo-android-release`).
     L'envoi vers Google Play échoue sur ce premier build (« Package not found ») : **c'est attendu**.
   - **Artifacts** du build : télécharger `plazo-pro-v1.0.0-<n°>.aab` (ou `plazo-v1.0.0-<n°>.aab`).
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
9. [ ] **`submit_as_draft` à `false`** quand les deux apps ont une première version déployée : le dire à Claude. D'ici là,
   chaque build arrive en **brouillon** dans Tests internes : ouvrir la version, **Démarrer le déploiement**.
10. [ ] **Notifications Android** (OneSignal) : chaque app OneSignal › **Settings › Push & In-App › Google Android (FCM)**
   demande la clé JSON d'un compte de service **Firebase**. Plazo n'a pas encore de projet Firebase : en créer un
   (« plazo »), y ajouter les deux apps Android (`com.benfordtech.parking_app` et `.pro`), puis **Paramètres du projet ›
   Comptes de service › Générer une nouvelle clé privée** et la déposer dans les deux apps OneSignal.

---

## 4. Ce qu'il faut renvoyer à Claude, et ce qu'il ne faut jamais coller

**À envoyer (valeurs non secrètes) :**
- [ ] l'Apple ID numérique de Plazo et de Plazo Pro (il remplace `APP_STORE_APP_ID: "0"`) ;
- [ ] les identifiants définitifs, s'ils changent, **avant** toute création dans les consoles ;
- [ ] les empreintes **SHA-256** de la clé de signature Play (Play Console › Protégé avec Play › Signature d'application
  Play), pour `assetlinks.json` ; le Team ID Apple est connu (`3BX4795V2Y`) ;
- [ ] « première version interne déployée sur les deux apps », pour passer `submit_as_draft` à `false` ;
- [ ] si un build échoue : le lien du build Codemagic et le message d'erreur.

**À ne jamais coller dans une conversation ni dans le dépôt :** le fichier `plazo-upload.jks` et ses mots de passe, la clé
JSON du compte de service (elle contient `private_key`), les fichiers `.p8` (API App Store Connect, APNs), les clés
REST OneSignal, tout jeton Codemagic, les mots de passe et codes de double authentification. Ils vont seulement dans
Codemagic (Code signing identities, variables « Secret »), OneSignal, Vercel et le gestionnaire de mots de passe.

## Sources (relues le 09/10/2026)

- Codemagic : https://docs.codemagic.io/yaml-code-signing/signing-ios/ (« Apple limits the number of Apple Distribution
  certificates to 3 », Fetch profiles) · https://docs.codemagic.io/yaml-code-signing/signing-android/ ·
  https://docs.codemagic.io/yaml-publishing/google-play/ · https://docs.codemagic.io/yaml-publishing/app-store-connect/ ·
  https://docs.codemagic.io/yaml-running-builds/webhooks/ · https://docs.codemagic.io/billing/pricing/
- Modèle qui publie déjà : `Benford-Tech/tempo-app`, `codemagic.yaml` (workflow `release`, version 1.1.3 publiée sur Google
  Play et App Store Connect le 09/10/2026).
- Apple : https://developer.apple.com/help/account/identifiers/register-an-app-id/ ·
  https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/
- Google : https://developers.google.com/android-publisher/getting_started ·
  https://support.google.com/googleplay/android-developer/answer/9844686 ·
  https://support.google.com/googleplay/android-developer/answer/13392821
