# Publier Plazo et Plazo Pro sur les stores

État au 11/10/2026 : les deux fiches Google Play existent ; Apple, Codemagic et le premier envoi restent à faire.

Les comptes existent déjà : ceux qui publient Thempo, LoveNest et Yoon. Plazo s'y ajoute, signé et publié comme Thempo,
qui sort sur les deux stores depuis la même équipe Codemagic. Les pipelines sont dans `codemagic.yaml`, à la racine du
dépôt ; aucun build de Plazo n'a encore tourné. Depuis le 11/10/2026 (« unifie le pipeline »), **un seul workflow de
publication** construit les six paquets d'une version (APK, AAB et IPA de Plazo et de Plazo Pro) et les envoie aux deux
stores ; un second, **Android seul** (`mobile-release-android`), fait la moitié Google Play sans rien demander à Apple : il
sert au premier envoi sur Google Play sans attendre les profils Apple, puis chaque fois que seul Google Play doit recevoir
une version.

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

Ce qui manque encore : les quatre fiches d'app (deux chez Apple, deux chez Google), les deux profils de signature Apple
et les réglages push (APNs, FCM) de chaque app OneSignal. La clé d'import Android est celle de Thempo, déjà dans
Codemagic (choix du 11/10/2026, étape 3.2).

## Les pipelines

| Où | Quand | Ce qu'il fait |
| --- | --- | --- |
| GitHub Actions `Mobile CI` | chaque PR et push sur `main` qui touche `mobile/` | nom du produit à jour, `flutter analyze`, `flutter test` (gratuit) |
| Codemagic `mobile-check` | à la main | les mêmes vérifications + APK **debug** des deux apps, à installer pour essayer |
| Codemagic `mobile-release` | tag `mobile-vX.Y.Z` ou à la main | les vérifications une fois, puis pour **Plazo et Plazo Pro** : AAB + APK signés (clé d'import de Thempo `tempo_eleves_upload`) et IPA signé (certificat de l'équipe), **même version et même numéro de build** pour les quatre paquets ; chaque AAB → **Google Play, tests internes**, chaque IPA → **TestFlight**, testeurs internes ; les six fichiers dans **Artifacts** |
| Codemagic `mobile-release-android` | à la main | **Android seul**, les mêmes étapes que la moitié Android de `mobile-release` : les vérifications, AAB + APK signés des deux apps, chaque AAB → **Google Play, tests internes** ; les quatre fichiers dans **Artifacts**. Ni certificat ni profil Apple |

- **Version** = le `version:` de `mobile/pubspec.yaml` (ex. `1.0.0`). Le tag doit la reprendre : `mobile-v1.0.0`, sinon le
  build s'arrête tout de suite (« le tag … ne correspond pas à la version … »).
- **Numéro de build** = compteur Codemagic + 100, jamais en dessous du dernier build connu d'un des quatre stores (les
  deux fiches Google Play, les deux apps TestFlight) : un seul numéro pour les quatre paquets.
- Les stores reçoivent une version **de test** ; la mise en production se décide dans chaque console.
- **Les envois sont indépendants** : chaque AAB puis chaque IPA est envoyé même si un autre envoi a échoué ; le dernier
  pas, « Bilan de la publication », liste les envois et met le build en erreur si l'un a échoué. Les paquets restent
  dans Artifacts.
- `mobile-release` a besoin, **avant son premier lancement**, de la clé d'import Android et des **deux profils Apple**
  dans les Code signing identities de l'équipe : sans l'un d'eux, Codemagic s'arrête à « Set up code signing », avant de
  construire quoi que ce soit. `mobile-release-android` n'a besoin que de la clé d'import Android et de la clé du compte
  de service Google Play : les sections 1 et 3 suffisent.
- Les minutes d'une équipe Codemagic sont **payantes** (pas de minutes gratuites en équipe) : une publication complète
  prend de l'ordre d'une heure de machine (deux apps Android, deux apps iOS), Android seul une demi-heure. C'est pourquoi
  les vérifications de chaque modification tournent sur GitHub Actions, gratuitement.

## 0. À décider avant de commencer

- [x] **Les identifiants des apps** (décidés le 11/10/2026, Plazo Pro déjà créée sur Google Play) : les mêmes sur les deux
  stores.

  | | Android (Play) | iOS (Apple) |
  |---|---|---|
  | Plazo | `com.benfordtech.plazo` | `com.benfordtech.plazo` |
  | Plazo Pro | `com.benfordtech.plazopro` | `com.benfordtech.plazopro` |

  Ils ne changent plus après le premier envoi (Google) ou la création de l'App ID (Apple). Le code, `codemagic.yaml` et
  `deep_links/` les portent déjà.
- [ ] **Qui publie.** Avec les comptes existants, le vendeur affiché sur les stores est **Benford Tech**. Si c'est une autre
  société (par ex. « Plazo Aéroports »), il faut d'autres comptes Apple et Google à son nom, avec son D-U-N-S.

---

## 1. Codemagic (dans l'équipe existante)

1. [ ] **Ouvrir l'équipe** qui contient Thempo (menu de gauche **Teams**), puis **Applications › Add application ›
   GitHub**, et choisir `Benford-Tech/plazo`.
   - Si `plazo` n'apparaît pas : GitHub › organisation **Benford-Tech** › **Settings › GitHub Apps › Codemagic CI/CD ›
     Configure**, **Repository access** : ajouter `plazo`, **Save**.
   - Type de projet **Flutter App**, configuration **codemagic.yaml** (pas le Workflow Editor), **Finish: Add application**.
2. [ ] **Vérifier les workflows** : onglet `codemagic.yaml`, branche `main`, **Check for configuration file** : trois
   workflows (« Mobile — vérifications + APK de test (debug, à la main) », « Plazo + Plazo Pro — APK, AAB, IPA →
   Google Play (tests internes) + TestFlight » et « Plazo + Plazo Pro — Android seul (APK, AAB) → Google Play (tests
   internes) »).
3. [ ] **Vérifier la facturation de l'équipe** (Team settings › **Billing**) : sans moyen de paiement actif, les builds
   restent en file d'attente.
4. [x] **Clé d'import Android : rien à téléverser** (choix du 11/10/2026). Les deux apps Plazo sont signées avec la clé
   d'import de Thempo, déjà dans Team settings › **Code signing identities › Android keystores** sous la référence
   `tempo_eleves_upload` (voir l'étape 3.2).
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
   - [ ] `com.benfordtech.plazo` (description « Plazo ») : **Push Notifications** + **Associated Domains** ;
   - [ ] `com.benfordtech.plazopro` (description « Plazo Pro ») : **Push Notifications**.
2. [ ] **Créer les deux apps** dans App Store Connect : **Apps › (+) › New App**, iOS, nom « Plazo » ou « Plazo Pro »,
   langue Français, le Bundle ID de l'étape 1, SKU `PLAZO-IOS` / `PLAZO-PRO-IOS`.
3. [ ] **Créer les deux profils de signature, avec le certificat qui existe déjà** (Apple n'en accepte que 3 par compte :
   **ne pas en créer un nouveau**).
   - Repérer le certificat : Codemagic › Team settings › **Code signing identities › iOS certificates** montre
     `thempo-distribution` et sa date d'expiration.
   - Apple : **Profiles › (+) › Distribution › App Store Connect › Continue**, l'App ID `com.benfordtech.plazo`, puis
     le certificat **Apple Distribution** qui expire à cette date, nom « Plazo App Store », **Generate**. Même chose pour
     `com.benfordtech.plazopro`, nom « Plazo Pro App Store ».
4. [ ] **Les importer dans Codemagic** : **Code signing identities › iOS provisioning profiles › Fetch profiles**, cocher
   les deux profils, et leur donner **exactement** les Reference name `plazo_app_store` (Plazo) et `plazo_pro_app_store`
   (Plazo Pro) : `codemagic.yaml` les appelle par ces noms. Vérifier aussi, dans **iOS certificates**, que le certificat
   de l'équipe porte le Reference name `thempo-distribution` (sinon le dire à Claude, qui l'adapte dans `codemagic.yaml`).
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

1. [x] **Créer les deux apps** (fait le 11/10/2026) : **Toutes les applications › Créer une application**, « Plazo » puis
   « Plazo Pro », Français, appli, gratuite ; **Déclarations** : tout accepter, y compris la signature d'application Play.
   Leurs identifiants (`com.benfordtech.plazo`, `com.benfordtech.plazopro`) se fixent au premier AAB importé (étape 6).
2. [x] **Clé d'import : celle de Thempo** (choix de Joanny du 11/10/2026, faute de pouvoir créer celle de Plazo) :
   `tempo_eleves_upload`, déjà dans Codemagic. Le premier AAB importé en fait la clé d'import de Plazo et de Plazo Pro.
   - Ça marche parce que les apps Plazo n'ont encore reçu aucun AAB (l'AAB de Yoon refusé l'avait été parce que Yoon
     avait déjà sa propre clé).
   - Conséquence : qui détient cette clé peut signer Thempo **et** Plazo. Si l'import d'un AAB est refusé avec un message
     du genre « … also used to sign APKs that are delivered to users », c'est que cette clé signe aussi les APK de
     Thempo : il faut alors la clé propre à Plazo, ci-dessous.
   - **Donner plus tard sa propre clé à Plazo** : la créer (commandes ci-dessous), la téléverser dans Codemagic sous la
     référence `plazo_upload`, exporter son certificat
     (`keytool -export -rfc -keystore plazo-upload.jks -alias upload -file upload_certificate.pem`), puis, pour chaque app,
     Play Console › **Intégrité de l'application › Signature d'application Play** › **Demander la réinitialisation de la
     clé d'importation** avec ce fichier. Une fois la nouvelle clé acceptée par Google (quelques jours), demander à Claude
     de remettre `plazo_upload` dans `codemagic.yaml`.
   Commandes pour créer la clé propre à Plazo, une pour les deux apps, alias `upload` :
   - Mac : `keytool -genkey -v -keystore ~/plazo-upload.jks -keyalg RSA -storetype JKS -keysize 2048 -validity 10000 -alias upload`
   - Sans Java (Mac : « Unable to locate a Java Runtime »), avec celui d'Android Studio :
     `"/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" -genkey -v -keystore ~/plazo-upload.jks -keyalg RSA -storetype JKS -keysize 2048 -validity 10000 -alias upload`
   - Windows (PowerShell) :
     `& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore $env:USERPROFILE\plazo-upload.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
   - Mot de passe : **lettres et chiffres seulement**, 20 caractères ou plus ; même mot de passe pour la clé (Entrée).
   - Garder `plazo-upload.jks` et son mot de passe dans le gestionnaire de mots de passe, puis le téléverser dans
     Codemagic : Team settings › **Code signing identities › Android keystores › Upload keystore**, l'alias `upload`,
     **Reference name** exactement `plazo_upload`.
3. [ ] **Ouvrir le compte de service aux deux apps** : **Utilisateurs et autorisations**, la ligne du compte de service
   (`…@….iam.gserviceaccount.com`, celui de Thempo) › **Autorisations des applications › Ajouter une application** : Plazo et
   Plazo Pro, cocher la section **Versions** (publier dans les canaux de test, gérer les canaux de test et les listes de
   testeurs, publier en production), **Appliquer**, puis enregistrer.
4. [ ] **Sa clé JSON pour Codemagic** : Google Cloud › **IAM et administration › Comptes de service** › ce compte ›
   **Clés › Ajouter une clé › Créer une clé › JSON**. Ouvrir le fichier, tout copier dans
   `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` (étape 1.5), puis le supprimer de l'ordinateur.
5. [ ] **Liste des testeurs internes** (pour chaque app) : **Tester et publier › Tests › Tests internes › Testeurs ›
   Créer une liste de diffusion** (comptes Google), **Enregistrer les modifications**.
6. [ ] **Premier envoi à la main** (l'API refuse une app jamais publiée), une fois la section 1 et les étapes 2 à 4
   faites ; **Apple n'est pas nécessaire** :
   - Codemagic : **Start new build**, `main`, workflow **« Plazo + Plazo Pro — Android seul »** (`mobile-release-android`).
     Les deux envois Google Play échouent sur ce premier build (« Package not found ») et le bilan le met en erreur :
     **c'est attendu**. (Avec `mobile-release`, une fois Apple prêt, c'est pareil, et les deux IPA partent vers TestFlight.)
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
9. [ ] **`PLAY_SUBMIT_AS_DRAFT` à `"false"`** (dans `codemagic.yaml`) quand les deux apps ont une première version
   déployée : le dire à Claude. D'ici là, chaque build arrive en **brouillon** dans Tests internes : ouvrir la version,
   **Démarrer le déploiement**.
10. [ ] **Notifications Android** (OneSignal) : chaque app OneSignal › **Settings › Push & In-App › Google Android (FCM)**
   demande la clé JSON d'un compte de service **Firebase**. Plazo n'a pas encore de projet Firebase : en créer un
   (« plazo »), y ajouter les deux apps Android (`com.benfordtech.plazo` et `com.benfordtech.plazopro`), puis **Paramètres du projet ›
   Comptes de service › Générer une nouvelle clé privée** et la déposer dans les deux apps OneSignal.

---

## 4. Ce qu'il faut renvoyer à Claude, et ce qu'il ne faut jamais coller

**À envoyer (valeurs non secrètes) :**
- [ ] l'Apple ID numérique de Plazo et de Plazo Pro (ils remplacent `APP_STORE_APP_ID_PLAZO: "0"` et
  `APP_STORE_APP_ID_PLAZO_PRO: "0"`) ;
- [ ] les identifiants définitifs, s'ils changent, **avant** toute création dans les consoles ;
- [ ] les empreintes **SHA-256** de la clé de signature Play (Play Console › Protégé avec Play › Signature d'application
  Play), pour `assetlinks.json` ; le Team ID Apple est connu (`3BX4795V2Y`) ;
- [ ] « première version interne déployée sur les deux apps », pour passer `PLAY_SUBMIT_AS_DRAFT` à `"false"` ;
- [ ] les noms des groupes de testeurs externes TestFlight, le jour où le personnel du client doit recevoir les builds
  (`TESTFLIGHT_BETA_GROUPS`) ;
- [ ] si un build échoue : le lien du build Codemagic et le message d'erreur.

**À ne jamais coller dans une conversation ni dans le dépôt :** les fichiers de clé Android (`.jks`) et leurs mots de passe, la clé
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
