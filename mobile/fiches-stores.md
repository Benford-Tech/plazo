# Fiches des stores : Plazo et Plazo Pro

État au 13/10/2026. Ce document rassemble les textes à copier-coller pour créer les quatre fiches : Plazo et Plazo Pro sur App Store Connect, Plazo et Plazo Pro sur Google Play.

Il complète [publier-sur-les-stores.md](publier-sur-les-stores.md), qui couvre déjà les comptes, les App ID, la signature, Codemagic, OneSignal et le premier envoi. Ces étapes ne sont pas répétées ici.

Comment lire ce document :
- Les libellés des consoles restent dans la langue où la console les affiche : l'anglais pour Apple, le français pour Google.
- Les textes à coller sont dans des blocs de code.
- « À confirmer » signale un point qui n'a pas pu être tranché d'après le code, avec la raison.
- Le nombre de caractères est indiqué entre parenthèses. Les limites ont été vérifiées en caractères et, pour les mots-clés Apple, aussi en octets (les accents comptent double).

Règles suivies dans tous les textes :
- seules les fonctions qui existent dans le code sont citées ;
- aucun superlatif ;
- tout se paie en ligne, jamais au parking ;
- aucune mention d'avis voyageurs ni d'Apple Pay (ni l'un ni l'autre n'est actif) ;
- aucun aéroport n'est nommé : l'app n'est pas réservée à Lyon (décision de Joanny du 13/10/2026). Elle propose les aéroports où Plazo a des parkings partenaires (`GET /public/airports`, choix de l'aéroport dès qu'il y en a deux), et les textes n'en promettent aucun autre ;
- le texte App Store ne cite aucune autre plateforme mobile (règle 2.3.10 d'Apple).

---

## 0. À régler avant d'envoyer en revue

Les fiches peuvent être créées dès maintenant. En revanche, plusieurs points feront refuser les apps ou rendront les déclarations fausses s'ils ne sont pas réglés avant l'envoi.

| # | Point | App | Ce qu'il faut faire |
|---|---|---|---|
| 1 | **Aucun parking en ligne.** En production, la recherche à Lyon ne renvoie aucun parking (les démos sont archivées depuis le 09/10/2026). Le relecteur ne verrait que « Aucun parking pour ces dates », ce qui mène à un refus probable (règles 2.1 et 4.2 d'Apple). | Plazo | Mettre en ligne la fiche du client n°1 (le mieux), ou rétablir les démos pendant la revue (`DEMO_LISTINGS=true`). Elles portent alors un badge « DÉMO » à côté de leur nom, dans l'app comme sur le site (« Parking fictif, présenté à titre de démonstration » n'est lu que par le lecteur d'écran, et en info-bulle sur le site). **Décision de Joanny.** Sur le parking du client n°1, les réservations de la revue sont de vraies réservations chez lui, même en clés de test (voir 4.4). |
| 2 | **Paiements en mode test** (`pk_test`, `STRIPE_ALLOW_LIVE=false`). Un loueur réel (non `isDemo`) se réserve aussi avec des clés de test (`PaymentService.modeFor` : clés de la plateforme et commission). | Plazo | Soit passer en clés réelles après l'avis du juriste et de l'expert-comptable, soit l'indiquer dans les notes de revue (carte de test, voir 4.4). **Décision.** |
| 3 | **E-mail de support** (réglé le 22/10/2026 : `contact@plazo.fr` dans `product.json`, formulaire `/contact` en ligne ; reste la page d'aide pour la Support URL d'Apple) : `product.json` contient `support@example.com`, que l'app affiche dans « Nous contacter ». Il n'existe **aucune page support ou contact** (`/contact` et `/support` renvoient 404). Apple exige une Support URL, Google un e-mail de contact. | les deux | Créer une vraie adresse, par exemple `support@plazo.fr`, avec sa propre règle Cloudflare comme `reservations@`. La mettre dans `product.json`, puis lancer `dart run tool/sync_product.dart`. Publier ensuite une page d'aide avec cette adresse (URL proposée : `https://www.plazo.fr/aide`, à créer). |
| 4 | **Politique de confidentialité à l'état de projet** : page en `noindex`, texte à faire valider par un juriste (le bandeau « Projet, à valider avec un juriste » est retiré depuis le 13/10/2026). `company` de `product.json` est rempli depuis le 15/10/2026 (Benford Tech, siège, RCS, TVA, directeur de la publication), sauf le capital, le téléphone et le médiateur. Restent 3 mentions « [à compléter] » : l'e-mail de contact, aux §1 et §8, qui est `SUPPORT_EMAIL` (point 0.3), affiché « [à compléter] » tant qu'il est factice, et la région de la base Neon au §4, écrite en dur dans `site/src/lib/legal.ts`. | les deux | Mettre une vraie adresse dans `supportEmail` (point 0.3), indiquer la région de Neon dans `legal.ts` §4 (et adapter `site/src/lib/__tests__/legal.test.ts`, qui attend « région [à compléter] »), faire valider la politique. Les conditions et les mentions légales gardent 5 et 4 « [à compléter] » : l'e-mail, le capital social, le téléphone de l'éditeur et, dans les conditions, le médiateur de la consommation (à donner par Joanny). |
| 5 | **Pas de compte de revue pour Plazo Pro** : les gérants des démos sont refusés (403 `account_suspended`). La revue de Thempo a été refusée pour cette raison. | Pro | Créer un loueur de revue dédié, avec des données fictives (voir 4.4). |
| 6 | **Textes iOS de localisation et de caméra écrits pour le voyageur.** Les deux apps partagent le même `ios/Runner/Info.plist`. Un chauffeur lirait « prévenir le voiturier ou le chauffeur de votre arrivée » et « scanner votre carte bancaire ». Refus probable (règle 5.1.1(ii)). | Pro | Garder un seul `Info.plist` et passer les trois textes en variables de build, comme `APP_DISPLAY_NAME` : `$(LOCATION_WHEN_IN_USE_TEXT)`, `$(LOCATION_ALWAYS_TEXT)` et `$(CAMERA_TEXT)`, définies dans les configurations Debug, Release et Profile de chaque flavor (à coder). **Ne retirer ni `NSLocationAlwaysAndWhenInUseUsageDescription` ni `NSCameraUsageDescription` de Plazo Pro** : geolocator_apple 2.3.14 référence `requestAlwaysAuthorization` (et le projet n'a pas de Podfile pour définir `BYPASS_PERMISSION_LOCATION_ALWAYS`), et le SDK Stripe, lié dans les deux apps, utilise la caméra. Sans ces clés, App Store Connect rejette le build (ITMS-90683). Seule l'autorisation « When In Use » est demandée : le texte « Always » n'est jamais affiché. Texte de localisation proposé pour -pro : « Votre position est partagée avec l'équipe du parking pendant un trajet de navette seulement (90 min au plus), puis effacée. Si le parking l'a choisi, ses clients voient aussi la navette, et la carte publique de Plazo la montre sans votre nom. Elle sert aussi à noter où une voiture est garée et à centrer le plan. » Caméra pour -pro : un texte neutre, jamais affiché. |
| 7 | **Texte de localisation incomplet pour Plazo** : il parle seulement du « trajet vers le point de rendez-vous ». Or la position sert aussi à « Ma voiture » et à l'itinéraire à pied. | Plazo | Dans `$(LOCATION_WHEN_IN_USE_TEXT)` des configurations -traveller (point 0.6), garder le texte actuel et le compléter avec « Ma voiture » et l'itinéraire à pied (à coder). |
| 8 | **Pas de lien vers la confidentialité dans Plazo Pro** : l'onglet Plus n'a ni la confidentialité, ni les conditions, ni le contact. Apple (5.1.1(i)) et Google exigent ce lien dans l'app. | Pro | Ajouter les liens dans Plus (changement d'interface : design d'abord). |
| 9 | **Fait le 13/10/2026 : suppression de compte dans Plazo Pro.** Plus › Mon compte › « Supprimer mon compte » (`DELETE /internal/staff/me`), confirmée par le mot de passe, Apple ou Google ; le compte est anonymisé (« Compte supprimé » : nom, e-mail, téléphone, mot de passe, sessions, appareils et identités Apple ou Google effacés ; trajets et actions gardés dans l'historique du parking), sans blocage du dernier gérant (avertissement seulement) ; avec Apple, le jeton est **révoqué** chez Apple (5.1.1(v)). Page publique `https://www.plazo.fr/suppression-compte` qui nomme « Plazo Pro », donne les étapes, ce qui est supprimé et ce qui est gardé. Arrivé avec la connexion Apple / Google et le code du jour (des comptes se créent maintenant aussi depuis l'app). | Pro | **Reste** : une vraie adresse de support dans `product.json` (point 3), sans quoi la page affiche « [à compléter] » pour qui n'a plus l'app ; la clé « Sign in with Apple » dans Vercel (sinon Apple n'est pas proposé, donc rien à révoquer). |
| 10 | **Textes faux en mode « Équipe seulement ».** La notification Android dit « Trajet navette en cours — position partagée avec vos clients » et l'écran Navette dit « ils suivent votre position », même quand les clients ne voient rien. | Pro | Adapter le texte au réglage du parking (à coder). |
| 11 | **La déconnexion ne coupe pas les notifications.** Un téléphone partagé continue de recevoir des noms et des plaques. | Pro | Désinscrire l'appareil à la déconnexion (à coder). |
| 12 | **L'app promet des choses inactives** : « Prix total, avis, navette » (il n'y a pas d'avis) et « carte, Apple Pay ou Google Pay » (Apple Pay n'est pas actif ; le pipeline l'active dès que le profil de Plazo porte la capacité, 31/10/2026, `publier-sur-les-stores.md` section 3 ter). | Plazo | Corriger ces deux textes dans `fr-FR.json`. |
| 13 | **La politique ne décrit pas tout ce que fait le code**, et Google compare la politique aux déclarations. Le détail des écarts et des corrections de `site/src/lib/legal.ts` est sous ce tableau. | les deux | Aligner la politique ou le code avant l'envoi. Les réponses de la section 3 décrivent **le code tel qu'il est**. |
| 14 | **Réglé le 15/10/2026 : le vendeur affiché est Benford Tech**, la société que nomment aussi les pages légales (`product.json` › `company`, d'après les registres publics). | les deux | Rien : les comptes Apple et Google existants conviennent (point 0 de publier-sur-les-stores.md), copyright `2026 Benford Tech` (2.1). |
| 15 | **L'app est déclarée iPhone et iPad.** Confirmé : `TARGETED_DEVICE_FAMILY = "1,2"` dans les 9 configurations du projet (Debug, Release, Profile et leurs variantes -traveller et -pro), dont héritent les configurations de la cible Runner, qui ne le redéfinissent pas ; icônes iPad présentes, quatre orientations iPad déclarées, pas de `UIRequiresFullScreen`. L'envoi passera, mais les deux apps seront relues sur iPad (Split View et Slide Over compris) et les captures iPad 13" seront obligatoires. Le choix est **définitif dès la première version publiée** : App Store Connect refuse un build qui retire une famille d'appareils déjà publiée. | les deux | Recommandé, **avant le premier envoi** : remplacer les 9 `TARGETED_DEVICE_FAMILY = "1,2";` par `TARGETED_DEVICE_FAMILY = 1;` dans `mobile/ios/Runner.xcodeproj/project.pbxproj`. Les apps restent installables sur iPad en mode iPhone. Retirer ensuite la ligne iPad de 5.1 et la mention iPad de 5.2. Si l'iPad est gardé : faire tester les deux apps sur iPad en Split View avant la soumission, et fournir les captures iPad. |
| 16 | **Identifiant publicitaire** : le code source ne déclare pas `AD_ID`, mais une bibliothèque peut l'ajouter au manifeste fusionné. | les deux | Vérifier sur l'AAB de production : `bundletool dump manifest --bundle=plazo-….aab \| grep AD_ID`. Si la permission est présente, la retirer (`tools:node="remove"`) plutôt que la déclarer. |
| 17 | **L'effacement des positions n'est pas garanti.** `ArrivalService.sweep` et `ShuttleService.sweep` ne tournent qu'à la lecture (suivi du voyageur, écrans en direct de l'équipe) et dans la purge de nuit `purge-expired-tokens` (01:00 UTC, `vercel.json`). La route `/api/internal/cron/expire-arrival-signals` existe, mais aucun planificateur ne l'appelle : ni `vercel.json`, ni la minuterie du relais `email-worker/` (qui n'appelle que `/public/inbound/retry`), ni cron-job.org. Sur cron-job.org, seul le moniteur `/api/health` a été vu tourner ; `remind-tomorrow` et `booking-digest` y sont prévus, mais leurs appels n'apparaissaient pas dans les journaux le 08/10/2026 (voir le README, « Avant d'ouvrir aux vrais clients »). Si le téléphone cesse d'envoyer et qu'aucun écran ne lit, la dernière position d'un voyageur ou d'un chauffeur reste en base jusqu'à la nuit suivante, soit jusqu'à 23 h environ. Une fin normale (arrivée, « Arrêter le partage », fin du trajet) efface la position tout de suite. | les deux | Sur cron-job.org, appeler `GET https://www.plazo.fr/api/internal/cron/expire-arrival-signals` toutes les 10 minutes, avec `Authorization: Bearer <CRON_SECRET>`. Cette route efface les signaux d'arrivée et les trajets de navette. L'ajouter à la liste « Avant d'ouvrir » du README. Les textes de ce document (2.1, 2.3, 3.1 à 3.3, 4.4, 4.6) supposent **cette tâche active** : position masquée après 2 h (90 min pour une navette), effacée dans les 10 minutes. Sans elle, écrire partout « effacée au plus tard la nuit suivante », y compris dans `legal.ts` §6. |
| 18 | **Les journaux d'accès gardent les recherches.** `backend/src/app.ts` journalise chaque requête avec `morgan('common')` : l'IP et l'URL complète avec ses paramètres, gardées dans les journaux de Vercel. On y trouve la recherche du voyageur (`GET public/search?airport&arrivalAt&returnAt`), la position de l'itinéraire à pied (`return/route?lat&lng`), et dans Plazo Pro les recherches par nom, plaque ou téléphone de clients (`GET internal/reservations?q=`, `occupation/search?q=`) et les adresses cherchées (`internal/geo/geocode?q=`). Apple compte comme collectée toute donnée gardée plus longtemps que le temps de servir la requête. | les deux | Recommandé : journaliser le chemin sans paramètres (jeton morgan personnalisé sur `req.originalUrl.split('?')[0]`, à coder). « Search History » devient alors vrai en « non collecté » : retirer les lignes Search History et Historique des recherches de la section 3, et la ligne de l'itinéraire du point 0.13. **D'ici là, ces recherches sont déclarées** (section 3). |
| 19 | **Suivi des vols** : le plan gratuit AeroDataBox tient un ou deux jours (README, « Avant d'ouvrir aux vrais clients »). Sans plan payant, l'atterrissage n'est pas suivi. | Plazo | Choisir un plan de suivi payant avant la sortie (**décision**). La description de 2.1 est écrite pour rester vraie dans les deux cas. Le texte promotionnel « vol retour suivi » ne s'utilise qu'avec un plan payant (variante en 2.1). |

Non bloquant : les liens des e-mails de réservation n'ouvrent pas encore l'app. Le domaine des liens profonds est provisoire et les fichiers `.well-known` renvoient 404.

### Détail du point 0.13

Ce que la politique ne décrit pas, ou décrit mal :
- **OneSignal démarre à chaque lancement** (`bootstrap.dart` → `OneSignalPushService.initialize`), alors que la politique dit « si vous les autorisez ». Il recueille les sessions (nombre, durée), l'ouverture des notifications, le modèle, le système, l'opérateur, la langue, le fuseau, le pays et l'IP. Les formulaires les déclarent pour l'Analytics, mais la politique n'a aucune finalité de mesure : elle ne cite que « l'identifiant d'abonnement … si vous les autorisez ».
- **Les signaux d'appareil et d'usage du SDK Stripe** (stripe-android 23.17.1 / stripe_ios) ne sont pas décrits.
- **Cloudflare** proxifie www.plazo.fr, donc tout le trafic de l'app vers `https://www.plazo.fr/api`. La politique ne cite Cloudflare que pour la réception des e-mails.
- **Conservation chez OneSignal** : la section 6 dit « Téléphones inscrits … supprimés 2 jours après le retour », mais seule la ligne `traveller_devices` est supprimée. L'abonnement OneSignal (jeton, modèle, sessions) reste chez OneSignal.
- **La position envoyée pour l'itinéraire à pied finit dans les journaux d'accès** (point 0.18).
- **L'itinéraire de l'IGN n'est pas cité** : `RoutingService.fetchRoute` envoie la position de départ précise du voyageur à `data.geopf.fr/navigation/itineraire`.
- **Les destinataires des données du chauffeur sont sous-estimés.** Quel que soit le réglage, les passagers de chaque trajet de récupération reçoivent le prénom du chauffeur et le véhicule dans la notification « Votre navette est partie » (`shuttleLeavingPush`). Ils voient aussi le prénom, le véhicule et sa plaque dans leur réservation pendant le trajet (`GET /public/bookings/:ref/shuttle` et `…/return`). « Votre navette est là » (`shuttleArrivedPush`) et la position ne leur parviennent qu'en mode « Équipe et clients ». En mode « Équipe et clients », tous les voyageurs du parking en séjour, passagers ou non, voient tous ses trajets en cours : prénom du chauffeur, véhicule et plaque, position en direct, heure d'arrivée (`GET /public/bookings/:ref/shuttles`). Dans ce même mode, pour un parking publié qui propose la navette, n'importe qui voit sans nom la position, le modèle et la couleur des navettes sur la carte d'accueil de plazo.fr et de l'app Plazo (`GET /public/airports/:slug/live`, sans authentification). La position prise par le voiturier au placement est montrée au voyageur (`TravellerReturn.car`).
- **La section 10 (pros)** ne cite ni l'ID de notification, ni la position prise au placement d'une voiture.
- **Les durées d'effacement des positions** (section 6, « au plus tard 2 heures après le début ») ne sont vraies qu'une fois le point 0.17 réglé.

Corrections à faire dans `site/src/lib/legal.ts` :
- **§2** : ajouter « Dans l'application : dès son ouverture, un identifiant d'appareil créé par OneSignal, les sessions (nombre, durée), l'ouverture des notifications et les caractéristiques de l'appareil (modèle, système, opérateur, langue, fuseau, pays) ; dans l'écran de paiement, les signaux d'appareil et d'usage recueillis par Stripe contre la fraude ».
- **§3** : ajouter « Mesurer le fonctionnement des notifications (OneSignal) : intérêt légitime ».
- **§4** : « Cloudflare (acheminement et protection du site, de l'API et des applications ; réception des e-mails…) » ; compléter la ligne de l'IGN, citée seulement pour les fonds de carte, avec l'itinéraire à pied calculé à partir de la position du voyageur (le fournisseur de suivi des vols y figure déjà) ; corriger « les passagers concernés… les autres voyageurs ne voient jamais » selon les destinataires ci-dessus.
- **§6** : après le point 0.17, « masquée après 2 heures (90 minutes pour une navette), effacée dans les 10 minutes » au lieu de « au plus tard 2 heures après le début » ; sans lui, « effacée au plus tard la nuit suivante ». Indiquer la durée de conservation de OneSignal, ou supprimer l'abonnement par l'API de OneSignal dans `ReturnService.purgeDevices`.
- **§10** : corriger « ou aussi les voyageurs » (passagers notifiés quel que soit le réglage ; en mode « Équipe et clients », tous les voyageurs du parking en séjour, et la carte publique sans nom), et ajouter l'ID de notification et la position prise au placement d'une voiture.

---

## 1. Création des fiches

### 1.1 App Store Connect › Apps › (+) › New App

Il faut d'abord créer les App ID `com.benfordtech.plazo` et `com.benfordtech.plazopro` (publier-sur-les-stores.md, étape 2.1), sinon le Bundle ID n'apparaît pas dans la liste. L'identifiant ne se change plus après la création de la fiche : une fiche créée avec un autre identifiant (par exemple l'ancien `com.benfordtech.parkingApp`) ne recevrait jamais les builds. Ce tableau remplace l'étape 2.2 de publier-sur-les-stores.md pour le nom : saisir celui du tableau, et non « Plazo » ou « Plazo Pro » seul.

| Champ | Plazo | Plazo Pro |
|---|---|---|
| Platforms | iOS | iOS |
| Name (≤ 30) | `Plazo – Parking aéroport` (24) | `Plazo Pro – Équipes parking` (27) |
| Primary Language | French | French |
| Bundle ID | `com.benfordtech.plazo` | `com.benfordtech.plazopro` |
| SKU | `PLAZO-IOS` | `PLAZO-PRO-IOS` |
| User Access | Full Access | Full Access |

- Le nom sous l'icône reste « Plazo » ou « Plazo Pro » (`APP_DISPLAY_NAME`, tiré de `product.json`). Le nom de la fiche peut porter un complément, et il se change à chaque nouvelle version.
- Un nom de fiche doit être unique sur l'App Store, et « Plazo » seul a de bonnes chances d'être déjà pris. Si le nom est refusé, essayer `Plazo : parking d'aéroport` (26) ou `Plazo Pro – Personnel parking` (29).

### 1.2 Google Play Console › Toutes les applications

Les deux fiches existent déjà : créées le 11/10/2026 sous les noms « Plazo » et « Plazo Pro » (publier-sur-les-stores.md, étape 3.1). **Ne pas les recréer.** Dans Fiche principale du Play Store, remplacer ces noms par ceux du tableau.

| Champ | Plazo | Plazo Pro |
|---|---|---|
| Nom de l'application (≤ 30), à saisir | `Plazo – Parking aéroport` | `Plazo Pro – Équipes parking` |
| Nom du package | `com.benfordtech.plazo` (fixé par le premier AAB importé) | `com.benfordtech.plazopro` (fixé par le premier AAB importé) |
| Langue par défaut | Français (France) – fr-FR | Français (France) – fr-FR |
| Application ou jeu | Application | Application |
| Gratuite ou payante | Gratuite (choisie à la création, définitif) | Gratuite (choisie à la création, définitif) |

Le nom de l'application sur Google Play n'a pas besoin d'être unique. Le namespace Android `com.benfordtech.parking_app` reste interne au code et n'apparaît jamais dans les consoles.

---

## 2. Fiche du store

### 2.1 Plazo, App Store (App Store Connect › l'app › iOS App › 1.0 et App Information)

| Champ | Valeur |
|---|---|
| Name | `Plazo – Parking aéroport` (24) |
| Subtitle (≤ 30) | `Parkings privés et navette` (26) |
| Keywords (≤ 100) | `stationnement,voiturier,réservation,garer,voiture,vol,avion,terminal,longue durée,vacances` (90 caractères, 92 octets). Les mots du nom et du sous-titre sont déjà indexés, ils ne sont pas répétés. Aucun nom d'aéroport : l'app n'est pas réservée à Lyon. |
| Support URL | `https://www.plazo.fr/aide` : **à créer** (point 0.3). En attendant, les Mentions légales une fois complétées, à condition qu'elles donnent un e-mail. |
| Marketing URL | `https://www.plazo.fr` |
| Privacy Policy URL | `https://www.plazo.fr/confidentialite` |
| User Privacy Choices URL (facultatif) | `https://www.plazo.fr/confidentialite#droits` |
| Category | Primary : **Travel** · Secondary : **Navigation** (facultatif ; l'app guide à pied jusqu'au point de rendez-vous et jusqu'à la voiture) |
| Copyright | `2026 Benford Tech` (la société éditrice de Plazo, point 0.14). Apple demande l'année puis le titulaire, sans URL. |
| Content Rights | « contains third-party content » : **Yes**. Il s'agit des fonds de carte IGN (Licence Ouverte, mention « © IGN » visible), des photos Pexels et des photos fournies par les parkings. Puis « I have the necessary rights » : Yes. À confirmer pour les photos des parkings : leur droit d'usage doit figurer dans le contrat avec chaque parking. |
| Price | Free (Tier 0), pas d'achat intégré |
| Availability | France (l'app n'existe qu'en français et la carte IGN ne couvre que la France) |

Promotional Text (≤ 170 ; il se change sans nouvelle revue).

Avec un plan de suivi des vols payant (point 0.19) :

```text
Réservez un parking près de votre aéroport : prix total pour vos dates, paiement en ligne, vol retour suivi et itinéraire jusqu'à la navette.
```
(141)

Tant que ce plan n'est pas pris :

```text
Réservez un parking près de votre aéroport : prix total pour vos dates, paiement en ligne et itinéraire à pied jusqu'à la navette au retour.
```
(140)

Description (≤ 4 000) :

```text
Plazo vous aide à réserver un parking privé près de votre aéroport, puis vous accompagne pendant tout le séjour : du dépôt de la voiture jusqu'à votre retour.

TROUVER VOTRE PARKING
• Choisissez vos dates de dépôt et de retour : la carte montre les parkings partenaires avec leur prix total pour votre séjour, ou « Complet ».
• Comparez en liste ou sur la carte, triez par prix, par durée de navette ou par distance.
• Filtrez par service (navette gratuite, voiturier, couvert, recharge électrique, ouvert 24h/24, clôturé, vidéosurveillance), par annulation gratuite, par durée de navette ou par prix total maximal.
• Le classement ne dépend d'aucune commission : aucun parking ne paie pour être mieux placé.
• Chaque fiche présente le parking : photos, services, déroulé à l'aller et au retour, accès, itinéraire et conditions d'annulation.

RÉSERVER SANS CRÉER DE COMPTE
• Deux étapes : vos informations, puis le paiement en ligne par carte bancaire, sécurisé par Stripe.
• Le prix affiché est le prix total de votre séjour. Tout se paie en ligne : rien à régler au parking.
• Laissez un mot au parking en réservant : poussette, siège bébé, arrivée tardive…
• Confirmation par e-mail, et par SMS quand le parking les envoie. La réservation est gardée sur votre téléphone, dans « Mes réservations ».
• Une réservation faite sur plazo.fr s'ajoute avec sa référence et votre e-mail.
• Modifiez votre vol retour en ligne. Pendant le délai d'annulation gratuite du parking, annulez vous-même : le remboursement est intégral et automatique.

LE JOUR DU DÉPÔT
• Prévenez le parking de votre arrivée : partagez votre position pendant le trajet (2 heures au plus, puis elle est effacée dans les 10 minutes), ou dites simplement « J'arrive dans 10, 20 ou 30 min ».
• Joignez un mot à votre message : 2 enfants, poussette…
• Donnez votre vol aller : quand son décollage est connu, vous voyez l'heure prévue de la navette vers le terminal.
• Vous vous garez vous-même ? Enregistrez la position GPS de votre voiture : elle reste sur votre réservation pendant le séjour et réapparaît quand le parking a noté votre retour au parking.

AU RETOUR
• Donnez votre vol retour : un compte à rebours vous accompagne jusqu'à l'atterrissage, à l'heure annoncée du vol quand il est suivi, sinon à l'heure de retour réservée. Sans numéro de vol, ou si le vol n'est pas suivi, touchez « J'ai atterri ».
• Itinéraire à pied jusqu'au point de rendez-vous de la navette, avec sa photo et les consignes du parking quand il les a ajoutées.
• « Je suis au point de rendez-vous » prévient le chauffeur. « Mon vol a du retard » ou « Bagage perdu ou retardé » prévient l'équipe.
• Notifications utiles : navette partie vous chercher, et « Votre navette est là » quand le parking partage la position de ses navettes.
• Quand le parking a choisi le suivi en direct, vous voyez la navette approcher sur la carte, avec le prénom du chauffeur et le véhicule.
• Retrouvez votre voiture : place ou file indiquée par le voiturier, avec sa position GPS quand elle a été enregistrée, et l'itinéraire à pied.
• Appelez le parking en un geste.

À SAVOIR
• Plazo propose les aéroports où il travaille avec des parkings partenaires.
• Chaque parking est exploité par un professionnel partenaire de Plazo, qui gère aussi sa navette.
• Vos informations servent à votre séjour et sont transmises au parking que vous réservez. Politique de confidentialité : https://www.plazo.fr/confidentialite
```
(environ 3 440 caractères)

Tant que la tâche du point 0.17 n'est pas planifiée, remplacer « (2 heures au plus, puis elle est effacée dans les 10 minutes) » par « (2 heures au plus ; elle est effacée au plus tard la nuit suivante) ».

### 2.2 Plazo, Google Play (Croissance › Présence sur le Play Store › Fiche principale du Play Store, et Paramètres de la fiche)

| Champ | Valeur |
|---|---|
| Nom de l'application (≤ 30) | `Plazo – Parking aéroport` |
| Description courte (≤ 80) | `Réservez un parking près de votre aéroport, du dépôt jusqu'à votre retour.` (74) |
| Description complète (≤ 4 000) | le texte de 2.1 avec une seule ligne changée (voir ci-dessous), environ 3 460 caractères |
| Catégorie | Application › **Voyages et infos locales** |
| Tags | jusqu'à 5, à choisir dans la liste de la console. Viser ceux qui touchent au voyage, au transport et au stationnement. À confirmer : la liste n'est visible que dans la console. |
| Adresse e-mail (publique) | `contact@plazo.fr` (point 0.3) |
| Site Web | `https://www.plazo.fr` |
| Téléphone | facultatif, à laisser vide |
| Règles de confidentialité (Contenu de l'application) | `https://www.plazo.fr/confidentialite` |
| Pays / régions (Tester et publier › Production › Pays/régions) | France |

Ligne à remplacer dans la description complète. La ligne de l'App Store :
```text
• Deux étapes : vos informations, puis le paiement en ligne par carte bancaire, sécurisé par Stripe.
```
devient, sur Google Play :
```text
• Deux étapes : vos informations, puis le paiement en ligne par carte bancaire ou Google Pay, sécurisé par Stripe.
```

### 2.3 Plazo Pro, App Store

| Champ | Valeur |
|---|---|
| Name | `Plazo Pro – Équipes parking` (27) |
| Subtitle (≤ 30) | `Réservations, places, navette` (29) |
| Keywords (≤ 100) | `gestion,aéroport,voiturier,chauffeur,planning,occupation,clés,personnel,arrivées,retours,accueil` (96 caractères, 99 octets) |
| Support URL | la même page d'aide que Plazo (**à créer**) |
| Marketing URL | facultatif : `https://www.plazo.fr`, ou rien |
| Privacy Policy URL | `https://www.plazo.fr/confidentialite` (sa section 10 couvre les comptes des professionnels) |
| Category | Primary : **Business** · Secondary : **Productivity** |
| Copyright | comme Plazo |
| Content Rights | Yes (fonds de carte et photo aérienne IGN, « © IGN ») ; rights : Yes |
| Price / Availability | Free, France |
| Distribution | publique, avec un compte de revue. Si Apple conteste une app réservée à des équipes, la solution de repli est la distribution « Unlisted » (demande à Apple), ou une app personnalisée via Apple Business Manager. Décision de Joanny. |

Promotional Text (≤ 170) :

```text
L'app des équipes des parkings partenaires de Plazo : arrivées, retours, places, clés et navette du jour au même endroit. Votre compte est créé par votre gérant.
```
(161)

Description (≤ 4 000 ; la même sur les deux stores) :

```text
Plazo Pro est l'application des équipes des parkings d'aéroport partenaires de Plazo : gérants, agents d'accueil, chauffeurs de navette et voituriers. Elle réunit le travail du jour sur le parking et dans la navette.

RÉSERVÉE AU PERSONNEL DES PARKINGS PARTENAIRES
L'application ne propose pas d'inscription : le gérant de votre parking crée votre compte et vous donne vos identifiants. Gérants : votre compte s'ouvre dans l'espace pro web de Plazo. Vous êtes voyageur ? Téléchargez l'application Plazo.

VOTRE POSTE DU JOUR
• Choisissez votre poste du jour parmi ceux de votre rôle (gérant, accueil, chauffeur ou voiturier) : les onglets s'adaptent à votre travail.

AUJOURD'HUI
• Tableau de bord : véhicules sur le parking, arrivées, retours, navettes et points à traiter, avec la place et les clés de chaque véhicule.
• Planning des arrivées et des retours du jour, avec le vol retour et l'état des voyageurs (en approche, au point de rendez-vous).
• Carte des navettes en circulation.

RÉSERVATIONS
• Toutes les réservations du parking par date d'arrivée : Plazo, site du parking, téléphone, comptoir et comparateurs.
• Recherche par plaque, nom, téléphone ou référence.
• Saisie d'une réservation prise au téléphone ou au comptoir, avec contrôle des places disponibles.
• Fiche réservation : appeler le client ou lui envoyer un SMS, la prochaine étape en un seul bouton (placer, déposer, récupérer, rendre), remise du véhicule avec les clés et une remarque.

PARKING ET CLÉS
• Plan du parking en couleurs, par état ou par durée de séjour.
• Arrivées à placer avec une place proposée qui limite les voitures à déplacer, crochet des clés, position GPS de la voiture prise au placement.
• Files de voiturier : voitures à sortir aujourd'hui et file conseillée pour chaque arrivée.
• Planning des places sur 7 ou 14 jours.

NAVETTE
• Aller et retour : les clients par créneau de départ, cochés puis emmenés ; la destination vient de chaque réservation.
• Partez avec le véhicule du jour. Si votre parking a activé le suivi des navettes, votre position est partagée pendant le trajet seulement (90 minutes au plus), puis effacée dans les 10 minutes.
• Messages des voyageurs : vol en retard, bagage perdu, mot du client.

NOTIFICATIONS
• Arrivées des clients, retours, navettes et messages de Plazo : activez ou coupez chaque type.
• Nouvelles réservations : à chaque réservation, toutes les heures ou jamais.

POUR LES GÉRANTS
• Équipe : comptes, rôles, nouveaux mots de passe.
• Réglages du parking : marge, temps de navette, suivi des navettes (pas de suivi, équipe seulement, équipe et clients), SMS aux voyageurs.
• Plan du parking sur la photo aérienne de l'IGN, génération des places, véhicules de navette.
• Chiffre d'affaires : le mois, la semaine ou le jour, par canal, et les réservations sans montant à compléter.
• Les mails des comparateurs, la fiche Plazo, les tarifs, l'export comptable et les reversements se gèrent dans l'espace pro web.
```
(environ 3 090 caractères)

Tant que la tâche du point 0.17 n'est pas planifiée, remplacer « puis effacée dans les 10 minutes » par « puis effacée au plus tard la nuit suivante ».

### 2.4 Plazo Pro, Google Play

| Champ | Valeur |
|---|---|
| Nom de l'application | `Plazo Pro – Équipes parking` |
| Description courte (≤ 80) | `Pour les équipes des parkings partenaires : réservations, places et navette.` (76) |
| Description complète | le texte de 2.3, sans changement |
| Catégorie | Application › **Entreprise** |
| Tags | jusqu'à 5 dans la liste de la console (gestion, entreprise, transport). À confirmer dans la console. |
| Adresse e-mail / Site Web | la même adresse de support (à créer) / `https://www.plazo.fr` |
| Règles de confidentialité | `https://www.plazo.fr/confidentialite` |
| Pays / régions | France |

---

### 2.5 Notes de version 1.0.0 (les deux apps, les deux stores)

Où elles vont :

- **Google Play** : à la création de chaque version (Tests internes › Créer une version › **Notes de version**), 500 caractères
  au plus par langue, entre les balises de langue que la console affiche (`<fr-FR>` … `</fr-FR>`). Le texte est public sur la
  fiche, sous « Nouveautés ». Facultatif, mais à remplir dès la 1.0.0.
- **App Store Connect** : le champ « Nouveautés de cette version » (*What's New*) n'existe pas pour la première version ; il
  apparaît à partir de la 1.0.1 (4 000 caractères au plus). Pour la 1.0.0, le texte Apple ci-dessous sert au champ **« Que
  tester »** (*What to Test*) de TestFlight, puis de base pour les notes de la version suivante.
- Les textes reprennent les descriptions des sections 2.1 à 2.4 : rien n'y est promis qui ne soit dans l'app. Le compte à
  rebours « jusqu'à l'atterrissage » suit l'heure annoncée du vol quand le suivi des vols est actif (point 0.19), sinon
  l'heure de retour réservée : la formulation vaut dans les deux cas. Ni Apple Pay ni Google Pay ne sont nommés.

Plazo, Google Play (≤ 500) :

```text
Première version de Plazo.
• Trouvez un parking près de votre aéroport : prix total pour vos dates, en liste ou sur la carte, filtres par service.
• Réservez et payez en ligne, sans créer de compte.
• Le jour du dépôt, prévenez le parking de votre arrivée.
• Au retour : compte à rebours jusqu'à l'atterrissage, itinéraire à pied jusqu'à la navette, « Votre navette est là » si le parking partage sa position, et retrouvez votre voiture sur le parking.
```
(452 caractères)

Plazo, App Store (« Que tester » de TestFlight pour la 1.0.0, « Nouveautés » dès la 1.0.1) :

```text
Première version de Plazo, pour réserver un parking privé près de votre aéroport et être accompagné du dépôt de la voiture jusqu'au retour.

• Choisissez vos dates : la carte et la liste montrent les parkings partenaires avec leur prix total pour le séjour. Triez par prix, durée de navette ou distance ; filtrez par service.
• Réservez en deux étapes, sans créer de compte, et payez en ligne par carte bancaire. Rien à régler au parking.
• Le jour du dépôt, prévenez le parking de votre arrivée, avec ou sans partage de position, et notez où vous avez garé la voiture.
• Au retour, un compte à rebours vous accompagne jusqu'à l'atterrissage, puis l'itinéraire à pied vous mène au point de rendez-vous de la navette. Vous êtes prévenu quand la navette part vous chercher et, si le parking partage la position de ses navettes, quand elle est là.
• Retrouvez votre voiture : place ou file indiquée par le voiturier, et sa position GPS quand elle a été enregistrée.

Plazo propose les aéroports où il travaille avec des parkings partenaires.
```
(1038 caractères)

Plazo Pro, Google Play (≤ 500) :

```text
Première version de Plazo Pro, l'application des équipes des parkings partenaires de Plazo.
• Aujourd'hui : véhicules sur le parking, arrivées, retours, navettes et points à traiter.
• Réservations de tous les canaux par date d'arrivée, saisie au comptoir, prochaine étape en un bouton.
• Parking : plan, places, files de voiturier et clés.
• Navette : aller et retour par créneau, trajets avec position partagée.
• Notifications réglables. Votre compte est créé par votre gérant.
```
(478 caractères)

Plazo Pro, App Store (« Que tester » de TestFlight pour la 1.0.0, « Nouveautés » dès la 1.0.1) :

```text
Première version de Plazo Pro, l'application des équipes des parkings d'aéroport partenaires de Plazo : gérants, accueil, chauffeurs de navette et voituriers.

• Votre poste du jour : les onglets s'adaptent à votre travail.
• Aujourd'hui : tableau de bord des véhicules sur le parking, arrivées, retours, navettes et points à traiter ; planning du jour avec les voyageurs en approche.
• Réservations : toutes les réservations du parking par date d'arrivée, quel que soit le canal ; recherche par plaque, nom ou référence ; saisie d'une réservation prise au téléphone ou au comptoir ; fiche avec la prochaine étape en un seul bouton.
• Parking et clés : plan en couleurs, place proposée à chaque arrivée, files de voiturier, crochet des clés, planning des places.
• Navette : aller et retour par créneau de départ, trajets avec véhicule et desserte, messages des voyageurs.
• Notifications : arrivées, retours, navettes et nouvelles réservations, chacune réglable.

L'application ne propose pas d'inscription : votre gérant crée votre compte.
```
(1114 caractères)

---

## 3. Confidentialité

Les réponses ci-dessous décrivent le code au 11/10/2026.

Points communs aux deux apps :
- aucun SDK de mesure d'audience, de publicité ou de plantage (OneSignal et Stripe recueillent toutefois des données d'usage et d'appareil, déclarées ci-dessous) ;
- pas d'App Tracking Transparency ;
- tout passe en HTTPS ;
- prestataires : Vercel, Neon, Cloudflare, Brevo, OneSignal (avec FCM/APNs), Stripe (Plazo seulement), IGN Géoplateforme (fonds de carte ; itinéraire à pied calculé à partir de la position du voyageur), fournisseur de suivi de vols (FlightAware, AeroDataBox ou AirLabs, un seul à la fois selon `FLIGHT_TRACKING_PROVIDER` : numéro et date du vol), SMS Gateway for Android (si le parking le choisit : numéro et texte du SMS).

**OneSignal démarre à chaque lancement, avant tout consentement** (point 0.13). Les données de session et l'identifiant d'appareil sont donc déclarés comme **obligatoires**. Si le code change pour démarrer OneSignal seulement après l'accord de l'utilisateur, ces deux lignes passeront en « facultatif ».

**Position approximative** : sur Android 12 et plus, l'utilisateur peut choisir « Approximative » (`ACCESS_COARSE_LOCATION` est déclarée) ; sur iOS, il peut désactiver « Position exacte ». Dans les deux cas, `GeolocatorLocationService.requestAccess()` renvoie quand même `granted`, et l'app envoie au serveur les coordonnées approximatives reçues. Elle est donc déclarée dans les quatre formulaires.

**Effacement des positions** : les durées indiquées supposent la tâche du point 0.17 active. Sans elle, écrire « effacée au plus tard la nuit suivante ».

### 3.1 Plazo, Apple App Privacy (App Store Connect › App Privacy)

Réponses générales :
- « Do you or your third-party partners collect data from this app? » : **Yes**.
- **Data Used to Track You : aucune** (ni IDFA, ni publicité, ni courtier de données).

| Catégorie › type | Collecté | Linked to user | Tracking | Purposes | Ce que c'est |
|---|---|---|---|---|---|
| Contact Info › Name | Yes | Yes | No | App Functionality | prénom et nom de la réservation |
| Contact Info › Email Address | Yes | Yes | No | App Functionality | confirmation, reçu Stripe, « Ajouter une réservation » |
| Contact Info › Phone Number | Yes | Yes | No | App Functionality | SMS (rappel, atterrissage), appels du parking |
| Contact Info › Physical Address | Yes (prudent) | Yes | No | App Functionality | pays et code postal de facturation saisis dans la feuille Stripe |
| Location › Precise Location | Yes | Yes | No | App Functionality | partage d'arrivée (2 h au plus, dernière position seulement, effacée dans les 10 minutes après la fin du partage), « Ma voiture », point de rendez-vous, itinéraire à pied |
| Location › Coarse Location | Yes | Yes | No | App Functionality | les mêmes usages quand l'utilisateur n'accorde que la position approximative |
| Financial Info › Payment Info | Yes | Yes | No | App Functionality | carte saisie dans la feuille de paiement Stripe (Plazo ne la voit pas) |
| Purchases › Purchase History | Yes | Yes | No | App Functionality | réservation, prix, état du paiement |
| User Content › Other User Content | Yes | Yes | No | App Functionality | mot pour le parking, mot joint à l'arrivée, « Un souci ? », note de « Ma voiture » |
| Search History | Yes | **No** (Data Not Linked to You) | No | App Functionality | aéroport et dates de la recherche, gardés avec l'IP dans les journaux d'accès (point 0.18) |
| Identifiers › User ID | Yes (choix prudent) | Yes | No | App Functionality | référence de réservation |
| Identifiers › Device ID | Yes | Yes | No | App Functionality | ID d'abonnement OneSignal et jeton de notification ; identifiants antifraude de Stripe |
| Usage Data › Product Interaction | Yes | Yes | No | Analytics, App Functionality | sessions et clics de notification (OneSignal), interactions dans la feuille de paiement (Stripe) |
| Diagnostics › Other Diagnostic Data | Yes (choix prudent) | Yes | No | Analytics | modèle, système et réseau envoyés par OneSignal (sur l'abonnement que Plazo relie à la réservation) et par Stripe |
| Diagnostics › Performance Data | Yes (choix prudent) | Yes | No | Analytics | temps de chargement de la feuille de paiement, envoyés par le SDK Stripe |
| Other Data › Other Data Types | Yes | Yes | No | App Functionality | plaque, modèle et couleur du véhicule, vols aller et retour, passagers, dates |

**Non collecté** : Health & Fitness, Sensitive Info, Contacts, Emails or Text Messages, Photos or Videos, Audio, Gameplay Content, Customer Support (« Nous contacter » ouvre l'app de mail du téléphone), Browsing History, Crash Data, Advertising Data, Credit Info, Other Financial Info.

L'appareil photo ne sert qu'au scanner de carte de Stripe. L'image reste sur le téléphone : rien n'est collecté.

### 3.2 Plazo, Google Play, Sécurité des données (Contenu de l'application › Sécurité des données)

Réponses générales :
- L'application collecte ou partage des données : **Oui**.
- Toutes les données sont chiffrées en transit : **Oui**.
- Création de compte : **« Mon application ne permet pas aux utilisateurs de créer un compte »**. On ouvre une réservation avec sa référence et un jeton ; il n'y a ni compte ni connexion.
- Moyen de demander la suppression des données : **Oui**, par e-mail, à l'adresse de la politique. URL facultative : `https://www.plazo.fr/confidentialite#droits`. **L'adresse doit d'abord exister** (points 0.3 et 0.4 : vraie adresse dans `product.json`, puis politique complétée). L'identité est de toute façon anonymisée 12 mois après le retour.
- Évaluation de sécurité indépendante : Non.

« Partagé » ci-dessous veut dire : transmis **au parking réservé**. Le parking est un responsable de traitement distinct, pas un prestataire de Plazo. C'est le choix prudent. On pourrait invoquer l'exception « transfert déclenché par l'utilisateur », mais elle se discute (**à confirmer** avec le juriste). Les transferts à Stripe, Brevo, OneSignal, Cloudflare et aux hébergeurs ne sont pas des partages : ce sont des prestataires. L'IGN reçoit la position de départ de l'itinéraire, sans nom ni référence ; le fournisseur de vols reçoit le numéro et la date du vol ; aucun ne reçoit d'identité.

| Catégorie › type | Collecté | Partagé | Obligatoire ou facultatif | Éphémère | Finalités |
|---|---|---|---|---|---|
| Informations personnelles › Nom | Oui | Oui | Obligatoire | Non | Fonctionnement de l'appli |
| › Adresse e-mail | Oui | Oui | Obligatoire | Non | Fonctionnement de l'appli ; Prévention des fraudes, sécurité et conformité |
| › Numéro de téléphone | Oui | Oui | Obligatoire | Non | Fonctionnement de l'appli |
| › Adresse (pays et code postal de facturation, feuille Stripe ; prudent) | Oui | Non | Obligatoire pour payer | Non | Fonctionnement de l'appli ; Prévention des fraudes, sécurité et conformité |
| › ID utilisateur (référence de réservation, prudent) | Oui | Oui | Obligatoire | Non | Fonctionnement de l'appli |
| › Autres informations (plaque, véhicule, vols, passagers) | Oui | Oui | Obligatoire (la plaque l'est, le reste est facultatif) | Non | Fonctionnement de l'appli |
| Informations financières › Informations de paiement de l'utilisateur | Oui (SDK Stripe) | Non | Obligatoire pour payer | Non | Fonctionnement de l'appli ; Prévention des fraudes, sécurité et conformité |
| › Historique des achats | Oui | Oui (le parking voit le prix) | Obligatoire | Non | Fonctionnement de l'appli |
| Position › Position exacte | Oui | Oui | Facultative | Non (du partage d'arrivée, seule la dernière position est gardée en base : masquée après 2 h, effacée dans les 10 minutes ; celle de la voiture jusqu'à la purge de nuit (01:00 UTC) qui suit le 2e jour après le retour, soit 3 jours environ au plus ; la position envoyée pour l'itinéraire à pied reste, avec l'adresse IP, dans les journaux d'accès tant que le point 0.18 n'est pas réglé) | Fonctionnement de l'appli |
| Position › Position approximative | Oui | Oui | Facultative | Non | Fonctionnement de l'appli |
| Messages › Autres messages intégrés à l'application | Oui | Oui | Facultatif | Non | Fonctionnement de l'appli |
| Activité dans les applications › Interactions avec l'application | Oui (OneSignal, Stripe) | Non | Obligatoire | Non | Analyses ; Communications du développeur ; Prévention des fraudes, sécurité et conformité |
| › Historique des recherches dans l'application | Oui (aéroport et dates, dans les journaux d'accès, point 0.18) | Non | Obligatoire | Non | Fonctionnement de l'appli |
| Infos et performances de l'appli › Diagnostics | Oui (SDK Stripe) | Non | Obligatoire | Non | Analyses ; Prévention des fraudes, sécurité et conformité |
| Appareil ou autres identifiants | Oui (OneSignal, jeton FCM, Stripe) | Non | Obligatoire | Non | Fonctionnement de l'appli ; Communications du développeur ; Prévention des fraudes, sécurité et conformité |

**Non collecté** : autres Informations personnelles, Informations financières autres, Santé, Photos et vidéos, Fichiers audio, Fichiers et documents, Agenda, Contacts, E-mails, SMS, Applications installées, Historique de navigation, Journaux de plantage.

Diagnostics : le SDK Stripe Android démarré dans Plazo (`StripePaymentSheetService`) envoie des événements d'analyse (modèle, version du système, temps de chargement et erreurs de la feuille de paiement), déclarés aussi chez Apple. La documentation de OneSignal n'en déclare pas pour Android. À revoir si un SDK de plantage est ajouté un jour.

### 3.3 Plazo Pro, Apple App Privacy

Réponses générales :
- Collecte : **Yes**. Tracking : **aucun**.
- Le SDK Stripe est inclus dans l'app mais n'est jamais démarré dans Plazo Pro : rien n'est déclaré pour lui.
- L'appareil photo n'est jamais utilisé dans Plazo Pro.

| Catégorie › type | Collecté | Linked | Tracking | Purposes | Ce que c'est |
|---|---|---|---|---|---|
| Contact Info › Name | Yes | Yes | No | App Functionality | prénom et nom du membre ; noms des clients saisis |
| Contact Info › Email Address | Yes | Yes | No | App Functionality | identifiant de connexion, e-mails des membres créés, e-mails des clients |
| Contact Info › Phone Number | Yes | Yes | No | App Functionality | téléphone facultatif du membre, téléphones des clients, numéros du canal SMS |
| Location › Precise Location | Yes | Yes | No | App Functionality | chauffeur pendant un trajet (90 min au plus, dernière position seulement, effacée dans les 10 minutes après la fin du partage) ; position prise quand un voiturier place une voiture |
| Location › Coarse Location | Yes | Yes | No | App Functionality | les mêmes usages quand le membre n'accorde que la position approximative |
| Purchases › Purchase History | Yes | Yes | No | App Functionality | prix payé saisi ou corrigé par l'équipe |
| Search History | Yes | No | No | App Functionality | recherches par nom, plaque, téléphone ou référence, et adresses cherchées pour le plan, gardées dans les journaux d'accès (point 0.18) |
| Identifiers › User ID | Yes | Yes | No | App Functionality | identifiant du compte, sessions |
| Identifiers › Device ID | Yes | Yes | No | App Functionality | ID d'abonnement OneSignal et jeton de notification |
| Usage Data › Product Interaction | Yes | Yes | No | Analytics, App Functionality | sessions OneSignal ; historique des actions de l'équipe sur les réservations |
| User Content › Other User Content | Yes | Yes | No | App Functionality | notes, remarques de remise |
| Diagnostics › Other Diagnostic Data | Yes (prudent) | Yes | No | Analytics | métadonnées d'appareil de OneSignal, sur l'abonnement que Plazo relie au membre (`staff_devices`) |
| Other Data › Other Data Types | Yes | Yes | No | App Functionality | plaques, véhicules, vols, crochet des clés, place ou file |

La position du plan (« ma position ») n'est pas collectée : elle sert seulement à centrer la carte et n'est pas envoyée au serveur.

### 3.4 Plazo Pro, Google Play, Sécurité des données

Réponses générales :
- Collecte : **Oui**. Chiffrement en transit : **Oui**.
- Création de compte : **« Nom d'utilisateur et mot de passe »** et **« Connexion avec un compte tiers »** (Apple sur iPhone, Google sur Android, depuis le 13/10/2026 ; la personne rejoint ensuite son parking avec le code du jour, et un gérant accepte). Les comptes e-mail sont créés dans l'app par le gérant (Équipe). **URL de suppression de compte** : `https://www.plazo.fr/suppression-compte` (point 0.9, fait le 13/10/2026).
- Suppression des données sans supprimer le compte : Oui, par e-mail (politique, section 8).

| Catégorie › type | Collecté | Partagé | Obligatoire ou facultatif | Finalités |
|---|---|---|---|---|
| Informations personnelles › Nom | Oui | Oui (prénom du chauffeur et véhicule, plaque comprise, montrés aux passagers de chaque trajet de récupération, par notification et sur l'écran du retour de l'app Plazo et de plazo.fr, quel que soit le réglage, et, en mode « Équipe et clients », à tous les voyageurs du parking en séjour) | Obligatoire | Fonctionnement de l'appli ; Gestion du compte |
| › Adresse e-mail | Oui | Non | Obligatoire | Fonctionnement de l'appli ; Gestion du compte |
| › Numéro de téléphone | Oui | Non | Obligatoire (le numéro du client est nécessaire pour enregistrer une réservation ; celui du membre reste facultatif) | Fonctionnement de l'appli |
| › ID utilisateur | Oui | Non | Obligatoire | Fonctionnement de l'appli ; Gestion du compte |
| › Autres informations (plaques, véhicules, vols, clés) | Oui | Non | Obligatoire | Fonctionnement de l'appli |
| Informations financières › Historique des achats | Oui (prix payé saisi ou corrigé par l'équipe) | Non | Facultatif | Fonctionnement de l'appli |
| Position › Position exacte | Oui | Oui (voir ci-dessous) | Obligatoire, par prudence (voir ci-dessous) | Fonctionnement de l'appli |
| Position › Position approximative | Oui | Oui (comme la position exacte) | Obligatoire, par prudence | Fonctionnement de l'appli |
| Activité › Interactions avec l'application | Oui | Non | Obligatoire | Analyses ; Fonctionnement de l'appli ; Communications du développeur |
| Activité › Historique des recherches dans l'application | Oui (journaux d'accès, non éphémère, point 0.18) | Non | Obligatoire | Fonctionnement de l'appli |
| Activité › Autres contenus générés par l'utilisateur (notes, remarques) | Oui | Non | Facultatif | Fonctionnement de l'appli |
| Appareil ou autres identifiants | Oui | Non | Obligatoire | Fonctionnement de l'appli ; Communications du développeur |

Pourquoi la position de Plazo Pro est « partagée » :
- En mode « Équipe et clients », tous les voyageurs du parking en séjour voient la position du chauffeur, et le public la voit sans nom sur la carte d'accueil du site et de l'app.
- La position de la voiture prise par le voiturier au placement est montrée au voyageur.

Pourquoi elle est marquée « obligatoire » par prudence : un chauffeur ne peut pas démarrer de trajet sans donner sa position quand le suivi est activé. Pour le voiturier, en revanche, elle est facultative.

**Non collecté** : Informations de paiement de l'utilisateur, Informations de crédit, Autres informations financières, Messages, Photos, Audio, Fichiers, Agenda, Contacts, Applications installées, Journaux de plantage.

Remplir le formulaire **séparément** pour chaque app : le paiement et le partage d'arrivée n'existent pas dans Plazo Pro.

### 3.5 Points de confidentialité à confirmer

- Le parking réservé, déclaré « partagé » sur Google : avis du juriste.
- La position de Plazo Pro « obligatoire » : voir 3.4.
- OneSignal au lancement : réponses à revoir si le code change (point 0.13).
- Stripe Link : s'il est activé dans le tableau de bord Stripe, la feuille de paiement peut demander un e-mail, un téléphone ou une adresse. C'est couvert par les lignes Contact, Adresse et Paiement.
- Adresse de facturation : déclarée par prudence, car la feuille Stripe garde ses réglages par défaut (`initPaymentSheet` sans `billingDetailsCollectionConfiguration`, intention créée avec `automatic_payment_methods: { enabled: true }`). Elle demande alors le pays, et le code postal pour certains pays (États-Unis, Royaume-Uni, Canada). Pour retirer cette déclaration : vérifier sur une feuille en clés réelles qu'aucun champ d'adresse n'apparaît, et le noter ici.
- Identifiant publicitaire : point 0.16.
- Recherches dans les journaux d'accès : `morgan('common')` garde l'URL complète des requêtes, donc les recherches du voyageur (aéroport, dates) et celles de Plazo Pro (nom, plaque, téléphone, référence, adresse). Elles sont déclarées en « Search History » (Apple) et en « Historique des recherches dans l'application » (Google) tant que `backend/src/app.ts` n'est pas corrigé (point 0.18). Une fois corrigé, retirer ces lignes.

---

## 4. Classification, public, revue et déclarations

### 4.1 Apple, Age Rating (App Information › Age Rating ; même réponse pour les deux apps)

| Groupe de questions | Réponse | Pourquoi |
|---|---|---|
| In-App Controls : Parental Controls, Age Assurance | No | |
| Capabilities : Unrestricted Web Access | No | les liens s'ouvrent hors de l'app, sans navigateur intégré |
| Capabilities : User-Generated Content | No | les mots au parking ne sont lus que par l'équipe, rien n'est public |
| Capabilities : Messaging and Chat | No | aucun échange entre utilisateurs ; les appels et SMS passent par les apps du téléphone. À confirmer : un mot envoyé par le voyageur à l'équipe pourrait être vu comme un message ; même avec « Yes », la note devrait rester 4+ |
| Capabilities : Advertising | No | |
| Mature Themes (Profanity or Crude Humor, Horror/Fear, Alcohol/Tobacco/Drugs) | None | |
| Medical or Wellness | None | |
| Sexuality or Nudity | None | |
| Violence (dont Guns or Other Weapons) | None | |
| Chance-Based Activities (Simulated Gambling, Contests, Gambling, Loot Boxes) | None / No | |
| Made for Kids | No | |

Note attendue : **4+**. Les libellés suivent le questionnaire d'Apple de 2025 et peuvent légèrement changer dans la console.

### 4.2 Google, Classification du contenu (questionnaire IARC)

- **Catégorie** : « Utilitaire, productivité, communication ou autre » pour les deux apps.
- **Violence, sexualité, langage, substances, humour grossier, jeux d'argent** : Non partout.
- **Questions diverses** (les libellés peuvent varier) :

| Question | Plazo | Plazo Pro |
|---|---|---|
| Les utilisateurs peuvent-ils interagir ou échanger du contenu entre eux ? | **Oui** (prudent : le voyageur envoie de courts messages à l'équipe du parking) | **Oui** (prudent : l'équipe lit ces messages) |
| L'app partage-t-elle la position actuelle de l'utilisateur avec d'autres utilisateurs ? | **Oui** (avec l'équipe du parking) | **Oui** (position du chauffeur, selon le réglage du parking ; sans nom sur la carte publique) |
| L'app partage-t-elle des informations personnelles avec des tiers ? | **Oui** (le parking reçoit la réservation) | **Oui** (prénom du chauffeur et véhicule envoyés aux passagers, et en mode « Équipe et clients » à tous les voyageurs du parking en séjour) |
| Achat de biens numériques ? | Non (le stationnement est un service physique) | Non |
| Navigateur ou moteur de recherche ? Contenu d'actualité ou éducatif ? Symboles nazis ? | Non | Non |

Résultat attendu : PEGI 3, USK 0, ESRB « Everyone », avec des éléments interactifs (interaction entre utilisateurs, partage de la position, partage d'informations). Ces éléments ne changent pas l'âge minimal.

### 4.3 Public cible et publicités (Google ; Apple n'a pas d'équivalent)

- **Public cible et contenu** : groupe d'âge **18 ans et plus** uniquement, pour les deux apps. Plazo demande un véhicule et un paiement par carte ; Plazo Pro est un outil de travail.
- « L'app pourrait-elle attirer involontairement les enfants ? » : Non.
- **Annonces** : « Non, mon application ne contient pas d'annonces » (les deux).
- **Applications gouvernementales** : Non.
- **Fonctionnalités financières** : « Mon application ne propose aucune fonctionnalité financière ». Plazo encaisse le prix d'un service par Stripe ; ce n'est ni un portefeuille ni un service de paiement.
- **Applications de santé** : Non.
- **Identifiant publicitaire** : « Non », après la vérification du point 0.16.

### 4.4 Accès à l'application et informations pour la revue

Les identifiants et les références de test ne vont **que** dans les champs de revue des consoles :
- Apple : App Review Information › Sign-In Information et Notes ;
- Google : Contenu de l'application › Accès à l'application.

Ils ne vont **jamais** dans le dépôt, ni dans ce fichier, ni dans une conversation.

Les relecteurs travaillent en anglais : les notes ci-dessous sont en anglais, avec les libellés français de l'app entre guillemets.

#### Plazo : aucun compte nécessaire

À préparer avant l'envoi :
- un parking en ligne (point 0.1) ;
- **une réservation faite dans l'app** sur ce parking, avec des données fictives et un retour assez lointain : le lien de gestion expire 30 jours après le retour. Une réservation saisie par l'équipe ne se retrouve pas par « Ajouter une réservation », qui ne cherche que les réservations Plazo. Avec des dates aussi lointaines, cette réservation ne montre jamais le partage d'arrivée : les notes expliquent comment le tester ;
- **une courte vidéo du partage d'arrivée** (la même que pour Google, 4.6), dont le lien va dans les notes ;
- **si la revue se fait sur le parking du client n°1** : même en clés de test, chaque réservation du relecteur et la réservation de test préparée sont de vraies réservations chez lui. Elles prennent une place de sa capacité, déclenchent le push « Nouvelle réservation », l'e-mail et le SMS de son canal, et entrent dans son chiffre d'affaires. Prévenir le client n°1 avant chaque soumission, nommer les réservations de test « Apple Review » ou « Google Review », et les annuler après la décision. Si les démos sont rétablies pour la revue (`DEMO_LISTINGS=true`), faire la réservation de test sur une démo.

Réglages des consoles :
- Apple : Sign-in required **décoché** ; coordonnées de contact de Joanny (dans la console seulement).
- Google : « Toutes les fonctionnalités ou certaines sont restreintes ». Ajouter une instruction « Réservation de test » : la référence et l'e-mail.

Notes (Apple) et instructions (Google) :

```text
Plazo lets travellers book a private car park near Lyon Saint-Exupéry airport (France) and follow their stay: drop-off, shuttle, return flight, car pick-up. The app is in French. No account is needed: a booking is opened with its reference and the e-mail used to book.

How to test
1. « Rechercher » tab: choose drop-off and pick-up dates, tap « Rechercher ».
2. Open a car park, tap « Réserver », fill in the form (please use « Review » as the last name), accept the terms, tap « Continuer vers le paiement ».
3. Payments are in Stripe test mode: pay with the test card 4242 4242 4242 4242, any future expiry date, any CVC. No money is charged.
4. To see an existing booking: « Mes réservations » > « Ajouter une réservation », reference <RÉFÉRENCE>, e-mail <E-MAIL>.

Location
- Only when the traveller asks for it: « Je suis en route — partager ma position » shares the position with the car park staff until arrival, 2 hours at most; when sharing ends, the position is erased within 10 minutes. Sharing continues in the background (UIBackgroundModes: location, blue indicator) so the traveller can drive with the phone locked or in a navigation app. If the app is closed, or the traveller leaves the booking screen, positions stop being sent; sharing resumes when the booking is opened again, while it is still on (2 hours at most from the start).
- To test it, book with a drop-off time within the next 2 hours, French time (Europe/Paris): the app shows the car park's local time. Open the booking in « Mes réservations »: « Je suis en route — partager ma position » is offered from 2 h before to 2 h after the drop-off time.
- Demo video of the arrival sharing: <LIEN DE LA VIDÉO>
- One-off positions: « Ma voiture » (where the car is parked) and the walking route to the shuttle meeting point.
Camera: only Stripe's optional card scanner.
Notifications: updates about the current booking (car parked, shuttle on its way).
Payment: the parking stay is a service used outside the app (guideline 3.1.3(e)); it is paid by card through Stripe. No digital content is sold.
```

La ligne Notifications des notes ne se vérifie que sur un parking en « Équipe et clients ».

Retirer le point 3 si les paiements sont passés en clés réelles. Il faut alors une réservation déjà payée pour le point 4. Une heure de dépôt passée de moins d'une heure reste acceptée à la réservation (`PublicService.parseStay`).

#### Plazo Pro : un compte du personnel de démonstration est nécessaire

Créer un **loueur de revue dédié**, avec des données fictives. Ne jamais utiliser les données du client n°1. Ne pas réactiver un loueur de démo : sa fiche reviendrait sur www.plazo.fr.

1. Sur `www.plazo.fr/pro/plateforme` › Loueurs › Inviter : loueur « Parking Revue », 50 places, gérant <Prénom> <Nom>, adresse dédiée. Accepter l'invitation depuis cette boîte et choisir un mot de passe d'au moins 10 caractères ; l'e-mail est vérifié à l'acceptation. L'invitation crée le loueur sans aéroport ni fiche Plazo : rien n'apparaît sur le site. Garder le mot de passe dans le gestionnaire de mots de passe.
   Solution de repli, depuis `backend/` contre la base de production (elle oblige à mettre l'URL de la base Neon de production sur un poste local) :
   ```text
   npm run seed:operator -- --operator "Parking Revue" --parking "Parking Revue" --capacity 50 --first-name <Prénom> --last-name <Nom> --email <adresse dédiée> --password <mot de passe d'au moins 10 caractères>
   ```
2. Dans l'espace pro web (`/pro`), avec ce compte :
   - ajouter un véhicule de navette : Modèle « Navette 1 », Couleur vide, Places passagers 8 (l'app affiche le modèle, suivi de la couleur s'il y en a une) ;
   - régler le suivi des navettes sur « Équipe et clients », jamais sur « Pas de suivi » : sans suivi, aucune position n'est prise et le service de premier plan déclaré en 4.6 ne démarre pas. Tant que le point 0.10 n'est pas corrigé, c'est aussi ce qui rend la notification vraie ;
   - ne relier **aucun canal SMS**. Sans canal SMS, Plazo n'envoie aucun SMS aux voyageurs (`SmsService.sendTravellerSms` → `skipped`). Vérifier avant chaque soumission que le canal du loueur de revue est toujours sur aucun : le relecteur, qui est gérant, peut en relier un dans Plus › Réglages du parking ;
   - créer 4 à 6 réservations fictives autour de la date d'envoi (arrivées et retours du jour et du lendemain, dont une avec un vol retour ; téléphones dans la tranche 06 39 98 xx xx, réservée à la fiction par l'ARCEP), pour que le tableau de bord, le planning, la navette et l'Occupation aient du contenu (Apple refuse souvent une app sans contenu à tester, règle 2.1, et les captures de 5.2 en ont besoin). Les recréer si la revue tarde, car les dates passent ;
   - tracer un plan simple (Parking › Plan), sinon « Placer » mène à une Occupation vide.
3. Apple : cocher Sign-in required, puis saisir l'e-mail et le mot de passe. Google : Accès à l'application › « Toutes les fonctionnalités ou certaines sont restreintes » › une instruction avec le même nom d'utilisateur, le même mot de passe et le texte ci-dessous.
4. Avant chaque soumission : vérifier que le compte de revue existe encore et se connecte (une fois le point 0.9 livré, le relecteur peut le supprimer), que le canal SMS est sur aucun, que le suivi est sur « Équipe et clients » et que les réservations fictives sont à jour.

```text
Plazo Pro is the staff app of the car parks that partner with Plazo (managers, desk agents, shuttle drivers, valets). It is not for travellers. There is no sign-up in the app: each car park manager creates the accounts of their team. This demo account belongs to a fictitious car park with fictitious data.

How to test a shuttle trip (about 2 minutes)
1. Sign in. If « Aujourd'hui, je suis… » appears, choose « Gérant », then « C'est parti ». Android 13+: first open « Plus » › « Notifications », tap « Activer les notifications sur ce téléphone » and allow, so the trip's ongoing notification is shown.
2. « Réservations » tab > « Nouvelle »: any first and last name, phone +33 6 39 98 00 01 (a number reserved for fiction), plate AB-123-CD, keep the proposed dates, tap « Enregistrer ».
3. You are back on the « Réservations » list: open this booking (type « AB-123-CD » in the search field), then « Autres actions » > « Enregistrer l'arrivée ».
4. « Prochaine étape » > « Déposer au terminal »: the shuttle screen opens with this client selected. Tap « Embarquer et partir · 1 client », choose « Navette 1 », « Confirmer et démarrer », allow location (a driver who took a vehicle for the day skips the vehicle choice: the trip starts on the first tap).
5. Put the app in the background: the trip keeps sharing the driver's position (iOS blue indicator; Android notification « Trajet navette en cours — position partagée avec vos clients »). Come back and tap « Clients déposés · retour parking »: sharing stops and the position is erased.

Location
- Shuttle trips only, between the start of the trip (« Confirmer et démarrer », or « Embarquer et partir » with the vehicle of the day) and its end (90 minutes at most), at most every 10 seconds, so the car park team (and, when the car park chose 'team and customers', all its travellers during their stay, and anonymously anyone viewing the live shuttle map of plazo.fr and the Plazo app) can see the shuttle. UIBackgroundModes: location is needed because drivers drive with the phone locked or in a navigation app.
- One-off position when a valet places a car, to record where it is parked.
- One-off position when a manager taps « Me géolocaliser » in « Plus » › « Plan du parking » (first step), to centre the map on the car park; it is not sent to the server.
Please do not link an SMS channel (« Plus » › « Réglages du parking »).
No payment and no in-app purchase in this app.
```

Si le point 0.10 est corrigé, remplacer le titre de la notification Android par le nouveau texte (étape 5 ci-dessus et description de 4.6).

### 4.4 bis Réponse à Apple, règle 2.1 « Information Needed » (31/10/2026)

Apple a demandé, pour la première soumission, six informations dans le champ **Notes** d'App Review Information (App Store
Connect › l'app › la version › App Review Information), puis une nouvelle soumission. Les textes ci-dessous les donnent dans
l'ordre d'Apple, en anglais ; ils tiennent sous les 4 000 caractères du champ. Les remplacer **dans la console seulement** :
`<VIDEO LINK>`, et les identifiants dans Sign-In Information (jamais ici).

**Comptes de revue (créés le 31/10/2026)** : loueur fictif « Parking Revue » (inscription publique, 50 places, aéroport LYS,
fiche Plazo restée en brouillon donc absente du site, suivi des navettes « Équipe et clients », navette « Navette 1 » de 8
places, aucun canal SMS), avec 57 réservations fictives `RV-101-PZ` à `RV-157-PZ` (trois arrivées par jour du 27/10 au
14/11/2026, séjours de 3 ou 4 nuits, téléphones 06 39 98 01 xx, SMS de la veille exclu, aucun e-mail). Trois comptes,
adresses `apple-review-gerant@`, `apple-review-accueil@` et `apple-review-video@plazo.fr` (le catch-all les renvoie à
`FALLBACK_ADDRESS`) : Gérant, Accueil (postes Accueil, Chauffeur, Voiturier) et un Accueil jetable pour la vidéo. Mots de
passe dans le gestionnaire de Joanny, jamais ici. Après le 14/11/2026, ou si le relecteur supprime un compte, recréer les
réservations et les comptes (demander à Claude). Le compte `PLAZO_TEST_EMAIL` de « Plazo (tests) » n'est jamais donné à Apple.

**À faire par Joanny avant de renvoyer** :
1. Mettre l'adresse et le mot de passe du compte **Accueil** dans Sign-In Information, ceux du **Gérant** à la place de
   `<EMAIL B> / <PASSWORD B>` dans les notes.
2. **Vidéo sur un vrai iPhone** (enregistrement de l'écran de Centre de contrôle), de l'ouverture de l'app à la suppression du
   compte, 3 à 4 minutes, mise en ligne en lien non répertorié (YouTube « Non répertoriée » ou Google Drive « Tous les
   utilisateurs disposant du lien »). Plazo Pro, avec le compte jetable `apple-review-video@plazo.fr` (supprimé à la fin) :
   ouverture → e-mail et mot de passe → « Aujourd'hui, je suis… » → tableau de bord et Planning (prochaine arrivée, prochain
   départ) → Réservations › une fiche → onglet Parking → Plus › Navette : cocher deux personnes, « Partir vers … », mettre l'app
   en arrière-plan (indicateur bleu), revenir, « Clients déposés · retour au parking » → Plus › Mon compte › « Supprimer mon
   compte » › confirmer → retour à l'écran de connexion. Plazo : recherche → fiche → réservation → paiement avec la carte de
   test → Mes réservations → retrouver une réservation par numéro et e-mail.
3. **Distribution publique (règle 3.2)** : la réponse ci-dessous la défend (toute société de parking peut s'inscrire). Si Apple
   maintient le refus, passer Plazo Pro en distribution « Unlisted » (formulaire d'Apple) plutôt qu'en app personnalisée :
   les loueurs suivants n'auraient pas à passer par Apple Business Manager.

#### Notes de Plazo Pro (anglais, à coller)

```text
1. SCREEN RECORDING (physical iPhone, from app launch to account deletion): <VIDEO LINK>

2. PURPOSE AND AUDIENCE
Plazo Pro is the staff app of private car parks located near airports (first market: Lyon Saint-Exupéry, France). These car parks keep the traveller's car during the trip and drive the traveller to the terminal and back by shuttle. The app is used only by their employees: managers, desk agents, shuttle drivers and valets. Travellers use our separate app "Plazo".
Problem solved: bookings arrive from several websites and by phone, the team must know who arrives and leaves at what time, where each car and its keys are, and who to drive to the airport or pick up after landing. Today this is done on paper and by phone.
Value: one shared real-time view of the day for the whole team (planning with the next arrival and departure, late ones, shuttle lists, car locations, bookings imported from the booking websites).
Distribution: Plazo Pro is not made for one company. Any airport car park operator can register on https://www.plazo.fr/pro/inscription and use the same app with its own team; each operator's data is kept separate.

3. HOW TO TEST
The app is in French. No in-app sign-up: accounts are created by the car park manager (e-mail invitation), or a new employee signs in with Apple/Google and enters the car park's daily code, then a manager accepts the request.
Account A (desk agent of "Parking Revue", a fictitious car park with fictitious bookings every day): credentials in Sign-In Information.
- Tap "Continuer", enter the password, "Se connecter". At "Aujourd'hui, je suis…" choose "Chauffeur".
- "Planning" tab: next arrival, next departure, late ones, the day's list.
- "Navette" tab: "Aller" (travellers to drive) / "Retour" (to pick up). Tick people, tap "Partir vers… · N pers.", allow location. Put the app in the background (blue indicator), come back, tap "Clients déposés · retour au parking".
- "Plus" > "Mon poste du jour" to switch to "Accueil" (bookings) or "Voiturier".
Account B (manager of the same car park): <EMAIL B> / <PASSWORD B>. Adds team, revenue and settings ("Plus").
Account deletion: "Plus" > "Mon compte" > "Supprimer mon compte", confirm with the password.
No user-generated content is shared between users (no public posts, chat or profiles), so there is nothing to report or block.
No paid content, no subscription and no in-app purchase in this app; the car park's subscription is contracted outside the app.

4. EXTERNAL SERVICES
Our own API (Vercel, Paris region; PostgreSQL by Neon). Sign in with Apple and Google Sign-In (optional sign-in). OneSignal (push notifications). IGN, the French national mapping agency (map and aerial photo tiles). Brevo (transactional e-mails and SMS sent by our server). AeroDataBox (flight arrival times, server side). Anthropic Claude (server side only: reads booking confirmation e-mails forwarded by the car park to create bookings; no data from the device). Stripe SDK is linked but not used by this app.

5. REGIONS
The app works the same in every region where it is available (France). Content is in French. No feature differs by country.

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
Not a regulated activity (car park management software). Benford Tech (SAS, RCS Vienne 910 729 102) publishes the app and owns its content. Maps and aerial photos: IGN Géoplateforme, open licence (Licence Ouverte Etalab 2.0), credited "© IGN" on the map.
```

#### Notes de Plazo (anglais, à coller ; 01/11/2026, « plazo n'a pas de connexion plutôt une réservation à importer »)

Plazo n'a ni compte ni connexion : le relecteur **retrouve une réservation** (« Mes réservations › Ajouter une réservation »,
numéro + e-mail ou téléphone). Réservation fictive créée le 01/11/2026 sur « Parking Revue » (fiche en brouillon, absente du
site, aucun canal SMS) : **RLY23Q**, téléphone **06 39 98 01 99**, « Apple Review », du 12/11/2026 09:30 au 16/11/2026 18:45,
vol retour AF 7641, plaque RV-199-PZ, SMS de la veille exclu ; vérifiée par `POST /public/bookings/lookup`. Retrouvable jusqu'à
30 jours après le retour ; la recréer si la revue va au-delà. Les paiements sont en clés réelles depuis le 14/10/2026 : le
relecteur peut parcourir la recherche et la fiche, mais une réservation payée serait réelle (remboursée sur demande).
Vidéo (vrai iPhone) : ouverture → Rechercher (dates, résultats, fiche d'un parking) → Mes réservations › Ajouter une
réservation › RLY23Q + 06 39 98 01 99 → la réservation (navette, sièges auto, contrat à lire, photos) → Plus.

```text
1. SCREEN RECORDING (physical iPhone, from app launch): <VIDEO LINK>

2. PURPOSE AND AUDIENCE
Plazo lets travellers book a private car park near an airport (first market: Lyon Saint-Exupéry, France), pay online and follow their stay: drop-off, free shuttle to the terminal, return flight, car pick-up. Audience: travellers who drive to the airport. Problem solved: comparing car parks by total price and shuttle, then not having to phone the car park on the trip day (the shuttle is shown live, the car park knows when the traveller lands).

3. HOW TO TEST
The app is in French. There is no account, no sign-up and no login in Plazo: a booking is opened with its booking number and the phone number or e-mail used to book. Since there is no account, there is no account to delete.
Test booking (fictitious car park "Parking Revue", fictitious traveller "Apple Review", 12 to 16 November 2026):
- Tab "Mes réservations" > "Ajouter une réservation".
- Booking number: RLY23Q
- E-mail or phone: 06 39 98 01 99
- The booking opens: dates, car park, shuttle, return flight, child seats, parking contract to read, photos of the car, cancellation rules.
Search and booking flow: tab "Rechercher", choose dates, "Rechercher", open a car park, "Réserver". Payment is made by card through Stripe with live keys, so please do not complete a payment (or tell us and we refund it at once); the test booking above shows everything that follows a booking.
No user-generated content (no reviews, chat or public profiles), so nothing to report or block.
Payment: the parking stay is a physical service used outside the app (guideline 3.1.3(e)), paid by card through Stripe. No digital content is sold, no subscription, no in-app purchase.

4. EXTERNAL SERVICES
Our own API (Vercel, Paris region; PostgreSQL by Neon). Stripe (card payment of the stay). OneSignal (notifications about the booking). IGN, the French national mapping agency (maps). Brevo (confirmation e-mails and SMS, server side). AeroDataBox (flight times, server side). Anthropic Claude (server side, car park staff tools only; never the traveller's data entered in this app).

5. REGIONS
Same app and features in every region where it is available. Content in French; car parks listed today are in France.

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
Car park booking is not a regulated activity. Benford Tech (SAS, RCS Vienne 910 729 102) publishes the app and is the platform that takes the payment and pays the car park. Maps: IGN Géoplateforme, open licence (Licence Ouverte Etalab 2.0), credited "© IGN".
```

### 4.5 Conformité export (les deux apps)

- `ITSAppUsesNonExemptEncryption = false` est déjà dans `Info.plist`. App Store Connect ne pose donc aucune question à l'envoi, et aucune déclaration française n'est nécessaire. Ce choix est justifié : TLS standard pour les seuls échanges de l'app, aucun algorithme propriétaire, et une fonction principale sans rapport avec la sécurité de l'information.
- Chiffrement : TLS standard (HTTPS, via le BoringSSL de Flutter et les piles réseau des SDK), Trousseau et Keystore pour le stockage ; aucun algorithme propriétaire.
- Si App Store Connect pose un jour la question, la trancher avec l'expert-comptable ou le juriste. Ne pas cocher « Standard encryption algorithms instead of, or in addition to, using or accessing the encryption within Apple's operating system » : cette réponse mène à la question sur la France et à la déclaration française.
- Google ne demande rien. Dans Sécurité des données, la case « chiffrées en transit » est cochée **Oui**.

À vérifier dans App Store Connect › Business : le statut de professionnel (« trader ») exigé par le DSA pour la distribution dans l'Union européenne. Il se règle au niveau du compte et a sans doute déjà été fait pour Thempo.

### 4.6 Service de premier plan « location » (Google Play › Contenu de l'application › Autorisations de service de premier plan)

Les deux apps partagent le même manifeste. **Chacune** déclare donc `FOREGROUND_SERVICE_LOCATION`, avec un **lien vers une courte vidéo** : YouTube non répertoriée ou Drive en lecture publique, 30 à 60 s.

Le formulaire n'apparaît qu'après l'import d'un premier AAB (publier-sur-les-stores.md, étape 3.7). Type : **Localisation** ; tâche : partage de position déclenché par l'utilisateur (choisir le libellé le plus proche dans la liste).

Sur Android 13 et plus, la notification d'un service de premier plan n'apparaît dans le volet que si `POST_NOTIFICATIONS` est accordée ; sinon, elle n'est visible que dans le gestionnaire de tâches. Plazo Pro ne demande cette permission que dans Plus › Notifications (bouton « Activer les notifications sur ce téléphone »). Plazo la demande seulement à l'ouverture d'une réservation, du jour du dépôt au jour du retour, et seulement si le parking a choisi « Équipe et clients » (jamais en « Équipe seulement » ni en « Pas de suivi » : le téléphone n'est alors pas enregistré et le voyageur ne reçoit aucune notification). **Tourner les deux vidéos avec les notifications déjà autorisées** (pour Plazo, dans les réglages Android de l'app, avant « Je suis en route »). Mieux, côté code : demander la permission de notification juste avant `_startTracking()` dans `ShuttleBloc` et dans `ArrivalBloc` (à coder).

**Plazo Pro**

Description :
```text
The shuttle driver starts a trip by tapping « Confirmer et démarrer » (or « Embarquer et partir » when they took a vehicle for the day). Only when the car park has shuttle tracking on (« Équipe seulement » or « Équipe et clients »); with tracking off, no position is taken and no service starts. While the trip lasts, the app sends the driver's position at most every 10 seconds so the car park team (and, when the car park chose 'team and customers', all its travellers during their stay, and anonymously anyone viewing the live shuttle map of plazo.fr and the Plazo app) can see the shuttle approaching. A persistent notification « Trajet navette en cours — position partagée avec vos clients » is shown. Sharing stops when the driver ends the trip (« Clients déposés · retour parking » or « Clients récupérés · retour parking ») or after 90 minutes; only the last position is kept, and it is erased within 10 minutes after sharing ends. If the app is reopened during a running trip, the same trip's sharing resumes.
```
Impact si le service est différé ou interrompu :
```text
Travellers waiting at the meeting point and the team would lose sight of the shuttle, and the « Votre navette est là » alert (150 m) would not be sent. The driver must be able to lock the phone or use a navigation app during the trip.
```
Vidéo : le parcours de 4.4 (Plazo Pro), avec les notifications déjà autorisées. On y voit la demande d'autorisation du système, la notification permanente avec l'app en arrière-plan, puis « Clients déposés · retour parking » qui la fait disparaître.

Données du tournage (12/10/2026) : le workflow GitHub « Données fictives du parking de test » (`test-parking-data.yml`, action `fill`) prépare sur le loueur « Plazo (tests) » de la production une journée fictive autour de l'heure du lancement : suivi des navettes sur « Équipe et clients », une navette en service, deux voitures « Sur place » à emmener au terminal, deux arrivées dans la journée, deux retours du jour et deux arrivées le lendemain (plaques `TS-1xx-PZ`, téléphones en 06 39 98, aucun e-mail, SMS de la veille désactivé). Le relancer juste avant de filmer remet la journée à l'heure, sans doublon, et termine un trajet resté en cours qui porte une réservation `TS-1xx`. Depuis le 15/10/2026, le serveur entretient aussi tout seul un flux continu de voyageurs fictifs sur ce loueur (`TS-201-PZ` à `TS-240-PZ`, réapprovisionnés à chaque lecture des listes du chauffeur), si bien qu'un chauffeur a toujours quelqu'un à emmener et à récupérer à toute heure ; les actions `feed-status`, `feed-on`, `feed-off` et `feed-run` du même workflow le montrent et le règlent. Il demande deux secrets GitHub, `PLAZO_TEST_EMAIL` et `PLAZO_TEST_PASSWORD`, d'un membre **Accueil** de « Plazo (tests) » créé pour cela dans Équipe, jamais un gérant ni le super admin (un gérant de ce loueur peut réinitialiser le mot de passe du super admin) ; le suivi des navettes et la navette, réservés aux gérants, se règlent alors une fois à la main, le workflow avertit s'ils manquent. Il refuse tout autre loueur.

**Plazo**

Description :
```text
From 2 hours before to 2 hours after the drop-off time, the traveller can tap « Je suis en route — partager ma position ». Until they arrive, the app sends their position at most every 10 seconds to the car park they booked, so the valet is ready at the desk. A persistent notification « Partage de position avec le parking en cours » is shown. Sharing stops on arrival, when the traveller taps « Arrêter le partage », or after 2 hours; only the last position is kept, and it is erased within 10 minutes after sharing ends.
```
Impact :
```text
The traveller drives to the car park with the phone locked or in a navigation app. If the service were deferred, the car park would not know when to expect them and the estimated arrival time shown to the staff would be wrong.
```
Vidéo : une réservation avec dépôt dans les 2 heures, avec les notifications déjà autorisées. On y voit l'explication dans l'app, « Je suis en route — partager ma position », la demande d'autorisation, la notification permanente, puis « Arrêter le partage ».

Tant que la tâche du point 0.17 n'est pas planifiée, remplacer dans les deux descriptions « erased within 10 minutes after sharing ends » par « erased when sharing ends, or at the latest the following night ».

### 4.7 Autorisations sensibles

| Autorisation | Plazo | Plazo Pro | Remarque |
|---|---|---|---|
| Position « pendant l'utilisation » (Android FINE et COARSE ; iOS When In Use) | partage d'arrivée, « Ma voiture », itinéraire à pied | trajets de navette, placement d'une voiture, centrage du plan | l'utilisateur peut n'accorder que la position approximative, qui est alors envoyée (déclarée en section 3) ; textes iOS en variables de build (points 0.6 et 0.7) ; le texte « Always » n'est jamais affiché, mais sa clé doit rester |
| Position en arrière-plan | iOS : `UIBackgroundModes` location ; Android : service de premier plan | idem, seulement si le suivi des navettes n'est pas sur « Pas de suivi » | **pas** de `ACCESS_BACKGROUND_LOCATION` : aucune déclaration Google « position en arrière-plan », seulement celle de 4.6 |
| `FOREGROUND_SERVICE_LOCATION`, `WAKE_LOCK` | oui | oui | déclaration 4.6 avec vidéo |
| Notifications (`POST_NOTIFICATIONS`, `remote-notification`) | demandées à l'ouverture d'une réservation, du jour du dépôt au jour du retour, si le parking est en « Équipe et clients » (sinon jamais), sans écran d'explication avant | demandées seulement depuis Plus › Notifications | Android 13+ : sans elles, la notification du service de premier plan n'apparaît pas dans le volet (4.6) |
| Caméra (`NSCameraUsageDescription`) | scanner de carte de Stripe, facultatif | jamais utilisée ; la clé doit rester (SDK Stripe lié dans les deux apps, sinon ITMS-90683), avec un texte neutre | point 0.6 |
| Non demandées | contacts, photos, micro, fichiers, SMS, agenda, Bluetooth, suivi publicitaire (pas d'ATT) | idem | `AD_ID` : point 0.16 |

---

## 5. Visuels à fournir

Aucune capture n'existe encore dans le dépôt.

Les icônes App Store sont fournies par le build lui-même (icône 1024 des jeux d'icônes) : rien à téléverser chez Apple.

### 5.1 Tailles

| Store | Visuel | Taille et format |
|---|---|---|
| Apple | iPhone 6,9" (**obligatoire**) | 1320 × 2868 (simulateur iPhone 16 Pro Max) ou 1290 × 2796 ; portrait ; PNG ou JPEG sans transparence ; 1 à 10 captures, 5 ou 6 conseillées. **Faites (11/10/2026)** : `brand/stores/screenshots/plazo/app-store/` et `brand/stores/screenshots/plazo-pro/app-store/`, sept captures 1320 × 2868 par app (mêmes écrans et même ordre que Google Play, viewport 440 × 956 à 3 pixels par point), par le même `run.sh` (`DEVICE=iphone` de `capture.mjs`). |
| Apple et Google | Images commerciales (à la place des captures brutes, choix A du 13/10/2026) | `brand/stores/marketing/A/plazo/` et `brand/stores/marketing/A/plazo-pro/`, sept par app à chaque taille : `appstore69` (1320 × 2868, iPhone 6,9"), `appstore63` (1206 × 2622, iPhone 6,3"), `play` (1080 × 1920, Google Play). Fond orange (Plazo) ou citron (Plazo Pro), titre et ligne repris de cette fiche, la vraie capture dans un téléphone. Rendues par `cd site && STYLE=A node ../brand/stores/tools/marketing.mjs`. |
| Apple | En-tête de la fiche et résultats de recherche (facultatifs, iOS 27) | En-tête 3840 × 1646 (21:9), résultats de recherche 1920 × 1280 à 3840 × 2560 (3:2), ou 5244 × 2950 (16:9, PNG) pour les deux ; sans transparence ; revus par Apple ; ni prix, ni adresse web. **Faits (13/10/2026)** : `brand/stores/creative/plazo/` et `brand/stores/creative/plazo-pro/` (`header-3840x1646.png`, `search-3840x2560.png`), style A, icône et titre dans la zone sûre centrée, par `brand/stores/tools/creative.mjs`. Vérifier le rendu dans l'aperçu d'App Store Connect (iPhone, iPad, mode sombre). |
| Apple | iPhone 6,3" (facultatif : sans elles, Apple réduit les captures 6,9") | 1206 × 2622 ou 1179 × 2556, portrait (2622 × 1206 ou 2556 × 1179 en paysage). **Faites (13/10/2026)** : `brand/stores/screenshots/plazo/app-store-6.3/` et `brand/stores/screenshots/plazo-pro/app-store-6.3/`, sept captures 1206 × 2622 par app (mêmes écrans et même ordre, viewport 402 × 874 à 3 pixels par point, l'iPhone 16 Pro), par le même `run.sh` (`DEVICE=iphone63`). Aperçus vidéo de cette taille : 886 × 1920, aucun pour l'instant. |
| Apple | iPhone 6,5" | 1284 × 2778 ou 1242 × 2688, seulement si aucune capture 6,9" n'est fournie (sinon Apple réduit les captures 6,9") |
| Apple | iPad 13" (**obligatoire seulement si l'iPad est gardé**, point 0.15 ; ligne à retirer si les apps passent en iPhone seul) | 2064 × 2752 (simulateur iPad Pro 13 pouces M4) ou 2048 × 2732. **Faites (13/10/2026)**, App Store Connect les demandant : captures brutes dans `brand/stores/screenshots/{plazo,plazo-pro}/app-store-ipad-13/` (vraies apps à 1032 × 1376 points × 2, `DEVICE=ipad13`), et images commerciales du style A dans `brand/stores/marketing/A/{plazo,plazo-pro}/ipad13/` (cadre de tablette). |
| Apple | Aperçu vidéo | facultatif |
| Google | Icône | 512 × 512, PNG 32 bits (avec canal alpha), 1 Mo au plus, carré plein (Google arrondit lui-même). **Faites (11/10/2026)** : `brand/stores/play-icon-plazo-512.png` et `brand/stores/play-icon-plazo-pro-512.png`, tirées des icônes 1024 de l'app (`mobile/assets/brand/app-icon.png`, `app-icon-pro.png` ; icône « Plazo écrit à partir du P », choix B du 11/10/2026), 23 à 27 Ko. `brand/icon-512.png` est l'icône du site : ce n'est pas la bonne. |
| Google | Image de présentation | 1024 × 500, JPEG ou PNG 24 bits sans transparence. **Faites (11/10/2026), deux variantes par app au choix de Joanny** : `brand/stores/plazo-feature-A.png` / `plazo-feature-B.png` et `brand/stores/plazo-pro-feature-A.png` / `plazo-pro-feature-B.png` (PNG 24 bits, 29 à 52 Ko), voir ci-dessous. |
| Google | Captures téléphone | 2 à 8 ; JPEG ou PNG 24 bits ; côtés entre 320 et 3840 px, **le grand côté au plus 2 fois le petit**. **1080 × 1920** est conseillé : un écran 1080 × 2400 brut dépasse ce rapport. Au moins 4 captures d'au moins 1080 px pour être mis en avant. **Faites (11/10/2026)** : `brand/stores/screenshots/plazo/` et `brand/stores/screenshots/plazo-pro/`, sept captures 1080 × 1920 par app, dans l'ordre de 5.2, prises sur les vraies apps avec des données fictives par `brand/stores/tools/screenshots/run.sh` (ou Actions › Store screenshots) ; à importer dans cet ordre. |
| Google | Captures tablette | facultatives |

Conseils de capture :
- iOS, sur un Mac : `xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100`, puis `xcrun simctl io booted screenshot capture.png`.
- Android : `adb exec-out screencap -p > capture.png`, sur un émulateur en 1080 × 1920.
- Garder la mention « © IGN » visible sur les cartes.
- N'utiliser que des données fictives ou des données publiées avec l'accord du parking.
- Éviter le badge « DÉMO » et tout signe du mode test de Stripe.

Images de présentation (`brand/stores/`, 11/10/2026), deux variantes par app, à choisir par Joanny :
- **Plazo A** (`plazo-feature-A.png`) : fond orange `#FF6600`, le P et l'avion de l'icône, « Votre parking à l'aéroport »
  en Playfair italique blanc, « Prix total affiché, navette, retour en direct. » en Manrope.
- **Plazo B** (`plazo-feature-B.png`) : le fond gris clair `#ECECEE` de l'app, la tuile de l'icône, surtitre « Plazo · parking aéroport », « Votre parking, du dépôt au retour. » en Playfair italique brun, pilule orange « Prix total affiché ».
- **Plazo Pro A** (`plazo-pro-feature-A.png`) : fond vert citron `#A3E635`, le P et l'avion verts, « L'app des équipes de parking »
  en Archivo Narrow capitales vert foncé `#0F2A14`, « Réservations · places · clés · navette » en Inter.
- **Plazo Pro B** (`plazo-pro-feature-B.png`) : le fond `#EEF0EE` de l'espace pro, la tuile de l'icône, surtitre « Plazo Pro ·
  parkings partenaires », « Arrivées, retours, places et navette » en Archivo Narrow, pilule citron « Le travail du jour, au même endroit ».

Peu de texte, dans les quatre cas. Elles sont rendues par Chromium depuis `brand/stores/tools/build.mjs` (polices de l'app
embarquées, vecteurs de `brand/app/`) puis aplaties par `brand/stores/tools/finish.py`, qui fait aussi les icônes 512 :
`cd site && node ../brand/stores/tools/build.mjs && python3 ../brand/stores/tools/finish.py`.

### 5.2 Écrans à capturer

**Plazo**, dans cet ordre (mêmes écrans pour l'iPad si l'iPad est gardé, point 0.15), sur un parking en ligne avec des dates à venir :
1. Rechercher : carte avec les pastilles de prix et la carte orange du moins cher.
2. Résultats en liste : prix « tout compris », tri, filtres.
3. Fiche d'un parking : photos, l'essentiel, « Réserver ».
4. Réservation, étape « Vos informations », ou l'écran « C'est réservé ! ».
5. Jour du dépôt : « Prévenez le parking de votre arrivée ».
6. Jour du retour : compte à rebours de l'atterrissage et étapes Rendez-vous › Navette › Voiture.
7. « Retrouver ma voiture ».

**Plazo Pro**, sur le loueur de revue avec des données fictives :
1. Tableau de bord : tuiles et « À traiter maintenant ».
2. Planning du jour : arrivées et retours.
3. Fiche réservation avec « Prochaine étape ».
4. Parking : les files de voiturier (« À sortir aujourd'hui », arrivées à ranger). Un plan en couleurs demande de tracer un plan pour le parking de revue (4.4).
5. Navette : Aller · Retour (poste Chauffeur).
6. Trajet en cours : « En route vers le terminal · position partagée ».
7. « Aujourd'hui, je suis… » (poste du jour).

---

## 6. Ce que Claude ne peut pas faire

App Store Connect et la Play Console demandent la connexion d'un membre du compte qui a les droits nécessaires (chez Apple : Account Holder, Admin ou App Manager ; chez Google : le propriétaire ou un utilisateur à qui il a donné les autorisations voulues), avec sa double authentification : Claude n'y a pas accès. Chaque étape qui se fait dans une console revient donc à Joanny. Les changements de fichiers du dépôt listés en section 0 (`Info.plist` et `project.pbxproj`, `fr-FR.json`, `product.json`, `legal.ts`, serveur et écrans) peuvent être faits par Claude, après les décisions et les designs demandés.

Apple et Google n'offrent aucune API pour créer une app : les deux fiches App Store Connect se créent à la main (les deux fiches Google Play existent déjà, voir 1.2). Le premier AAB de chaque app Google Play s'importe aussi à la main, depuis un build du workflow `mobile-release-android` (publier-sur-les-stores.md, section 3, étape 6). Ensuite, `mobile-release` envoie les builds aux deux stores, une fois les deux profils Apple en place, et `mobile-release-android` les envoie quand seul Google Play doit recevoir une version.