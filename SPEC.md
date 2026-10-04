# SPEC — Plazo (nom de travail)

Logiciel de gestion pour opérateurs de parkings privés d'aéroport (parking + navette, avec ou sans voiturier).
Version : 0.4 — 1er octobre 2026 — À valider avec le client n°1 avant développement.
Changements v0.4 : cartographie du parking sur Google Maps aux dimensions réelles et optimisation du stationnement dans le MVP (bloc 2) ; jalons recalés, pilote en semaine 12.
Changements v0.3 : ajout d'une application mobile native (App Store et Google Play) dès le MVP, pour le personnel, le gérant et les voyageurs (section 3 ter) ; deux apps à terme, construites d'abord dans un seul projet Flutter.
Changements v0.2 : ajout de la phase 2 « place de marché grand public » (section 3 bis), des rôles et données associés, du paiement et de la commission.

---

## 1. Objectif

Donner à un opérateur de parking d'aéroport un seul outil pour :
1. recevoir et centraliser ses réservations (son site + autres canaux) sans surréservation ;
2. savoir où est chaque véhicule dans son parking et le retrouver instantanément ;
3. organiser les navettes, surtout au retour, en fonction de l'heure réelle d'atterrissage.

Positionnement en deux phases :
- **Phase 1 (MVP)** : outil POUR L'OPÉRATEUR, avec sa propre page de réservation et le paiement en ligne pour ses clients. Le loueur amène ses propres voyageurs.
- **Phase 2** : place de marché grand public où plusieurs loueurs proposent leurs places et où les voyageurs cherchent, comparent, réservent et paient (section 3 bis). Elle se construit sur le même modèle de données ; on l'ouvre quand 3 à 5 opérateurs sont actifs sur un même aéroport.

Raison de l'ordre : sans budget d'acquisition, une place de marché vide n'attire personne, alors que les comparateurs existants (Parkos, ParkMundo, Onepark, Free2move…) ont déjà le trafic. Il faut d'abord des loueurs actifs et utiles.

## 2. Utilisateurs et rôles

| Rôle | Qui | Besoins principaux |
|---|---|---|
| Gérant | Propriétaire / responsable du parking | Planning, taux de remplissage, réglages (capacité, tarifs, plan), accès à tout |
| Agent d'accueil | Personnel au parking | Enregistrer arrivées/départs, affecter les places, remettre les véhicules |
| Chauffeur navette | Conduit la navette | File des clients à récupérer, prise en charge, sur téléphone |
| Voiturier (optionnel) | Déplace les véhicules | Liste des véhicules à garer/sortir, clés confiées |
| Client voyageur | Réserve et utilise le parking | Réserver, recevoir confirmation et SMS, être récupéré vite |
| Voyageur avec compte (phase 2) | Cherche et réserve sur la place de marché | Comparer, payer, retrouver ses réservations, modifier/annuler, laisser un avis |
| Administrateur plateforme (super admin, `PLATFORM_ADMIN_EMAILS`) | Toi / ton équipe | Espace « Plateforme » : valider les annonces, fixer la commission, inviter, suspendre, ouvrir l'espace d'un loueur, suivre réservations et reversements ; plus tard litiges et modération des avis |

Un compte opérateur = un loueur (multi-parkings possible plus tard). Les rôles limitent les écrans visibles. En phase 2, un même voyageur peut réserver chez plusieurs loueurs avec un seul compte.

## 3. Périmètre du MVP

### Bloc 1 — Réservations

Fonctionnel :
- Page publique de réservation propre à l'opérateur (URL dédiée) : dates/heures d'arrivée et de retour, nb de passagers, plaque, téléphone, n° de vol retour (facultatif mais encouragé), options (lavage…).
- Calcul du prix selon une grille tarifaire simple (par jour, forfaits).
- Confirmation par email et SMS.
- Saisie manuelle par le personnel (téléphone, comptoir).
- Import des réservations d'autres canaux : CSV et saisie assistée à partir d'un mail de confirmation (connecteurs directs aux comparateurs : hors MVP).
- Vue planning : arrivées et retours du jour, par heure.
- Contrôle de capacité : blocage ou alerte quand les réservations dépassent la capacité réelle sur une date.
- Statuts : à venir → arrivé (véhicule déposé) → parti en navette → retour demandé → véhicule rendu / annulé / no-show.
- Annulation et modification (règles configurables).

Règles métier :
- Capacité calculée par nuit, pas seulement à l'arrivée (un véhicule occupe sa place du jour d'arrivée au jour de retour).
- Une marge de sécurité configurable (ex. 5 % de places non réservables).
- Les fuseaux horaires sont gérés en Europe/Paris côté interface, UTC en base.

Paiement : le MVP peut démarrer avec paiement sur place (le plus simple pour le client n°1), mais la page de réservation doit être conçue pour accueillir le paiement en ligne dès le jalon 3 (voir section 3 bis, qui le détaille). Hors MVP : codes promo, avoirs, facturation automatique.

### Bloc 2 — Plan du parking et affectation des véhicules

Fonctionnel :
- Cartographie du parking aux dimensions réelles, tracée sur la photo aérienne de l'IGN (détail ci-dessous). Le plan garde la hiérarchie zones → rangées → emplacements.
- Une vue liste/grille du plan reste disponible pour le travail rapide au comptoir et sur téléphone.
- Types d'emplacements : standard, grand gabarit, couvert, PMR, réservé.
- À l'arrivée, affectation d'un emplacement au véhicule (manuelle ou suggérée).
- Suggestion d'emplacement optimisée (détail ci-dessous) : date de retour, véhicules bloqués, trajets du voiturier.
- Recherche de véhicule par plaque, nom, n° de réservation → emplacement affiché en gros, emplacement de la clé si confiée.
- Suivi des clés confiées (voiturier) : boîte/crochet numéroté, qui l'a, à quelle heure.
- Vue d'occupation en temps réel (places libres / occupées par zone).

Règles métier :
- Un emplacement ne peut contenir qu'un véhicule à la fois (ou un nombre défini pour les files).
- Si le client se gare lui-même, l'agent confirme l'emplacement a posteriori.
- Changer un véhicule d'emplacement est tracé (qui, quand, pourquoi).

#### Cartographie sur la photo aérienne de l'IGN

Le gérant dessine son parking sur la photo aérienne de l'IGN (BD ORTHO, 20 cm, licence ouverte, servie sans clé
par la Géoplateforme), dans l'application web (sur ordinateur, plus précis qu'au doigt). Pas sur la vue satellite
de Google Maps : ses conditions interdisent de tracer ou d'analyser son imagerie, et sa Drawing Library est retirée ;
le dessin passe par MapLibre GL JS et Terra Draw. Longueurs et surfaces sont calculées en Lambert-93.
- contour de chaque zone (polygone), avec surface et longueurs des côtés affichées en mètres ;
- éléments fixes : entrée, sortie, point de remise des véhicules, arrêt navette, bureau/boîte à clés, allées de circulation, obstacles (poteaux, bordures, bâtiments) ;
- calage sur le terrain : le gérant saisit une ou deux cotes mesurées sur place (par exemple la longueur d'une rangée) et le plan s'ajuste ; la photo aérienne peut être décalée de quelques décimètres et dater de plusieurs mois (Rhône : prise de vue du 08/07/2023) ;
- génération automatique des places dans une zone : dimensions des places (par défaut 2,50 m × 5,00 m, grand gabarit et PMR configurables), largeur d'allée (par défaut 6 m en épi à 90°, moins en épi incliné), orientation, sens de circulation. L'outil propose la disposition puis le gérant ajuste à la main (déplacer, supprimer, ajouter, renuméroter) ;
- mode voiturier : rangées « en file » (plusieurs véhicules l'un derrière l'autre sans allée) pour gagner de la place, avec la profondeur de file configurable ;
- la capacité du parking est recalculée à partir des places actives du plan.

#### Estimateur de capacité (outil interne)

Avant de vendre, la plateforme estime la capacité du terrain d'un loueur (outil réservé aux administrateurs de la
plateforme, `PLATFORM_ADMIN_EMAILS`, pas aux loueurs). Trois étapes sur la photo IGN : repérer le terrain (union des
parcelles cadastrales cliquées via API Carto, recoupée au besoin avec la surface de parking BD TOPO, sommets corrigés
à la souris, une cote mesurée sur place cale l'échelle), découper en zones (zones de stationnement et parties exclues
avec leur dégagement : bâtiment, accueil, voie navette, arbre, poteau), puis comparer trois dispositions générées
automatiquement : clients garés seuls (épi 90°, places 2,50 × 5,00 m, allées 6 m), voiturier en files de 2 à 4
(places 2,40 × 5,00 m, aucune voiture à plus de 3 rangs d'une allée) et voiturier en files de 5. Chaque allée est
fermée à ses deux bouts par une allée transversale ; un retrait de 1 m est gardé en bordure. L'outil affiche la
fourchette à annoncer (clients garés seuls → voiturier 2 à 4), le plafond théorique sans allée et un contrôle sur la
photo (voitures comptées à la main). Référence : un rectangle de 100 m × 60 m donne 245 places (261 avec les places en
bout d'allée), 324 en voiturier 2 à 4 et 360 en files de 5. Export GeoJSON ; la création du plan à partir de
l'estimation viendra avec le jalon 4.

Dans l'app mobile, le plan s'affiche sur la carte : emplacement du véhicule recherché mis en évidence, itinéraire à pied depuis le point de remise, occupation par zone en couleurs.

#### Optimisation du stationnement

Trois objectifs, pondérables par le gérant :
1. **Maximiser le nombre de places** : à la création du plan, comparer plusieurs dispositions (orientation des rangées, épi à 90° ou incliné, places en file pour le voiturier) et afficher le nombre de places de chacune ; le gérant choisit.
2. **Ranger selon la date de retour** : dans une file, un véhicule qui repart plus tôt ne doit jamais être derrière un véhicule qui repart plus tard. La suggestion respecte cette règle et signale tout blocage existant (par exemple après une prolongation de séjour).
3. **Réduire les trajets** : les véhicules qui repartent bientôt sont placés près du point de remise ; les séjours longs au fond. Distances calculées sur les allées du plan, pas à vol d'oiseau.

À l'arrivée d'un véhicule, l'outil propose les 3 meilleurs emplacements avec la raison (« retour dans 2 jours, près de la sortie, ne bloque personne »). L'agent peut toujours choisir un autre emplacement.

Une vue « réorganisation » propose, en heure creuse, une liste de déplacements pour remettre le parking en ordre (après retards, prolongations, no-show), triée par gain.

Hors MVP : caméras, lecture de plaque, capteurs de présence sur les places.

### Bloc 3 — Navette au retour

Fonctionnel :
- Récupération automatique de l'heure d'atterrissage prévue/réelle à partir du n° de vol et de la date (API de suivi de vols, à choisir).
- File des retours triée par heure d'arrivée estimée, avec statut de chaque client (vol en retard, atterri, bagages récupérés, appelé, pris en charge).
- Vue chauffeur sur téléphone : prochains clients à récupérer, point de rendez-vous, bouton « pris en charge » et « déposé au parking ».
- SMS automatique au client à l'atterrissage : point de rendez-vous, délai estimé, numéro à appeler en cas de souci.
- Lien/bouton « Je suis prêt » côté client pour signaler qu'il a ses bagages (remplace l'appel téléphonique).
- Aide à l'affectation des navettes quand plusieurs partent en même temps (regroupement par vague).

Règles métier :
- Si le n° de vol est absent, repli sur l'heure de retour saisie par le client.
- Si le vol est annulé/dérouté, alerte au gérant et au client, pas d'envoi de navette tant qu'il n'y a pas de nouvelle info.
- Temps de trajet navette configurable (par exemple 8 minutes).

Hors MVP : optimisation d'itinéraire.

#### Véhicules, deux sens, navette en direct pendant le séjour (décisions du 04/10/2026, mis en œuvre)

- **V-A « Fiche complète »** : chaque navette a une fiche (modèle, couleur, plaque, places passagers hors chauffeur,
  en service / hors service, chauffeur habituel), tenue dans Réglages › Navettes (espace pro web) et dans Plus › Véhicules
  de navette (Plazo Pro, gérants). Au départ d'un trajet, le chauffeur retrouve son véhicule habituel présélectionné, un
  véhicule hors service n'est pas proposé, et le nombre de passagers de la sélection ne peut pas dépasser les places
  (`too_many_passengers`, vérifié dans l'app et par l'API).
- **T-A « Deux sens »** : le chauffeur démarre soit un trajet **vers l'aéroport** (aller chercher les retours, comme
  avant), soit un trajet **vers le terminal** avec les clients arrivés au parking (statut « arrivé », arrivée des
  dernières heures). Même partage de position, même fin ; la fin d'une dépose passe ses passagers à « Parti en navette ».
- **S-A « Navette en direct le jour J »** : du jour d'arrivée au jour du retour, la réservation du voyageur montre un
  bloc « Navette » : les navettes du parking en route (véhicule, prénom du chauffeur, sens, position sur la carte,
  distance et délai jusqu'au parking le jour d'arrivée et pendant le séjour, jusqu'au point de rendez-vous le jour du
  retour), la sienne mise en avant ; « Aucune navette en route » sinon ; rien hors de ces jours. Interrogé toutes les
  12 s tant que la réservation est ouverte. Bloc de l'app seulement : le site n'a pas de suivi de navette, et le SMS
  d'atterrissage renvoie vers la réservation sans promettre ce suivi. Le jour du retour, quand sa propre navette vient le chercher, c'est la carte
  « Navette en route vers vous » qui prend le relais.

#### Le jour du retour (mis en œuvre, maquette validée « Votre retour »)

Le flux réel, côté voyageur (app, réservation Plazo ouverte par le lien ou par référence + email) :
1. **Vol suivi tout seul** : le n° de vol et la date de retour sont interrogés chez AeroDataBox (ou AirLabs selon la configuration),
   au plus une fois toutes les 5 minutes par réservation, dans les 24 h avant l'atterrissage prévu, par le cron
   `track-return-flights` et à chaque lecture (app, planning, file du chauffeur) ; statut (prévu, retardé, en vol,
   atterri, annulé, dérouté), heure prévue / révisée / réelle, terminal et porte. Sans n° de vol ou sans clé, le
   voyageur appuie sur « J'ai atterri ».
2. **À l'atterrissage** : push au personnel (« Vol TO 3627 atterri · C. Martin · AB-123-CD · 10:02 », une fois) et
   SMS au voyageur (point de rendez-vous, consignes, lien de la réservation ; une fois, seulement si le fournisseur a vu
   l'atterrissage et si le loueur a un canal SMS, voir « Canal SMS par loueur »).

#### Canal SMS par loueur (mis en œuvre, maquette validée « SMS aux voyageurs »)

Tous les SMS aux voyageurs (confirmation, atterrissage, et les suivants : navette en approche, annulation…) passent par
un seul point du serveur qui applique le choix du loueur, fait dans *Mon compte › SMS aux voyageurs* (gérant ; en
lecture seule pour le super admin en consultation) :
- **Téléphone du parking** (gratuit) : l'appli libre *SMS Gateway for Android* (capcom6) en mode *Cloud server* sur un
  Android du parking ; le serveur dépose les SMS chez l'appli (Basic auth avec l'identifiant et le mot de passe
  affichés par l'appli, serveur privé possible) et le téléphone les envoie depuis son numéro, que les voyageurs peuvent
  rappeler. Le mot de passe est chiffré au repos (AES-256-GCM, clé serveur `SMS_GATEWAY_ENCRYPTION_KEY`) et jamais
  renvoyé. Liaison en trois étapes (installer l'appli, activer *Cloud server*, recopier identifiant et mot de passe),
  SMS de test, puis état « Relié · dernier SMS envoyé il y a X », expéditeur, compteurs du mois (envoyés / échecs),
  « Envoyer un SMS de test », « Modifier », « Désactiver ».
- **Plazo envoie pour moi** : Brevo depuis le numéro de la plateforme, 0,05 € par SMS décompté sur les reversements
  (le décompte lui-même reste à faire) ; proposé seulement quand la plateforme a Brevo.
- **Pas de SMS** : emails seulement. C'est le réglage tant que rien n'est configuré.

Règles : seuls les mobiles français reçoivent un SMS (anti-pompage, quel que soit le canal). Un SMS déposé chez l'appli
que le téléphone n'envoie pas (éteint, hors ligne) attend 2 h — réessayé à chaque lecture du planning (au plus une fois
par minute), par le cron des vols et par le cron de nuit, le texte étant reconstruit depuis la réservation — puis est
abandonné et compté en échec ; après 10 minutes d'attente, le planning affiche « SMS en attente · téléphone
injoignable ». Un échec de SMS ne fait jamais échouer l'action qui l'a déclenché.

Rétention : la boîte d'envoi (`sms_outbox`) garde par SMS le loueur, la réservation, le type, le **numéro du
destinataire** (nécessaire aux nouveaux essais), l'**empreinte SHA-256 du texte** (jamais le texte), le fournisseur,
l'identifiant chez le fournisseur, l'état et le nombre d'essais ; ses lignes sont supprimées **après 30 jours** par le
cron de nuit. Les journaux ne contiennent ni numéro, ni texte, ni identifiant de l'appli ; les erreurs sont des codes.
3. **« Votre retour aujourd'hui »** : ligne de temps vol → « Rejoignez le point de rendez-vous » (libellé du loueur,
   porte, minutes à pied) → « La navette vient vous chercher » → « Récupérez votre voiture » (clés à l'accueil, plaque) ;
   « Itinéraire vers le point de rendez-vous » et « Je suis au point de rendez-vous » (le signal existant).
4. **Chemin à pied** : itinéraire piéton calculé par l'API auprès de la Géoplateforme IGN (profil piéton, sans clé),
   depuis la position du téléphone (demandée à ce moment, jamais stockée) ou depuis le terminal si elle est refusée ;
   cache de 3 minutes par réservation, ligne droite signalée si le service ne répond pas ; consignes écrites (≤ 500
   caractères) et photo du loueur ; « Ouvrir dans Plans » pour la navigation vocale.
5. **Navette en direct** : quand un trajet du chauffeur inclut la réservation, la carte montre la navette, l'ETA (à vol
   d'oiseau à 40 km/h, au moins 1 min), l'heure d'arrivée, le véhicule (modèle, couleur, plaque) et le prénom du
   chauffeur ; interrogation toutes les 10 s tant que l'écran est ouvert, qui s'arrête à la fin du trajet.

Côté personnel (mode chauffeur dans l'app pro, « Navette ») : les retours du jour à récupérer, groupés par terminal,
avec leur état (vol prévu / retardé / atterri, au point de rendez-vous) ; « Démarrer le trajet (N clients) » après le
choix du véhicule (navettes du loueur, ou saisie libre) ; la position part en arrière-plan (service au premier plan
Android « Trajet navette en cours — position partagée avec vos clients », mode location iOS) au plus toutes les 10 s ;
« Clients récupérés · retour parking » termine le trajet. Espace pro web : point de rendez-vous (carte IGN, recherche
d'adresse, libellé, consignes, photo par adresse) et navettes dans « Parking » ; « Navette en route (Karim) » sur les
retours du planning.

**RGPD** : la position du chauffeur n'existe que pendant un trajet (contrainte en base) ; **seule la dernière** est
gardée, visible **uniquement des passagers du trajet** ; elle est **effacée** à la fin du trajet et **au bout de 90
minutes** au plus tard (à la lecture et par la purge nocturne) ; le journal d'audit trace démarrage et fin (nombre de
passagers, véhicule) sans coordonnées ; la position du voyageur pour l'itinéraire ne sert qu'à la requête ; aucune
position dans les journaux ; le voyageur ne voit jamais les autres passagers.

#### Prévenir de son arrivée (mis en œuvre, maquette validée « eta »)

Le voyageur prévient le parking qu'il arrive, sans appeler. Deux moments, avec chacun son point de rendez-vous :
- **à l'aller** (réservation « à venir », de 2 h avant l'heure de dépôt à 2 h après) : l'accueil du parking
  (`Parking.location`) ;
- **au retour** (véhicule sur place, de 2 h avant l'heure de retour à 6 h après) : le point de rendez-vous de la navette
  à l'aéroport (`Parking.returnMeetingPoint` + libellé, réglable par le gérant par l'API ; à défaut l'aéroport de la fiche,
  puis le parking).

Trois façons de prévenir, depuis l'app (lien de la confirmation ou référence + email, aucun compte) :
- **« Je suis en route — partager ma position »** : la position est envoyée au plus toutes les 10 s ; l'arrivée estimée
  est la distance à vol d'oiseau à 40 km/h (au moins 1 min), sans service de calcul d'itinéraire payant. Le partage
  s'arrête tout seul à moins de 150 m du point de rendez-vous, au bout de 2 h, quand le voyageur l'arrête, ou quand le
  personnel enregistre le dépôt ;
- **« Prévenir sans partager ma position »** : « J'arrive dans 10 / 20 / 30 min » ;
- **« Je suis au point de rendez-vous »** (au retour surtout ; position ponctuelle facultative) : la réservation passe
  en « retour demandé », le chauffeur le voit dans sa file.

Côté personnel : la carte de l'arrivée en approche passe en tête du planning avec un liseré, l'ETA, une mini-carte et
l'âge de la position (« il y a 20 s ») ; « Prévenu · dans 20 min » ; « Au point de rendez-vous » dans les retours ; un
bandeau à chaque nouvel évènement. Le planning interroge l'API toutes les 12 s (pas de connexion permanente sur
Vercel). Notifications push sur les téléphones du personnel (OneSignal) : au départ (« C. Martin arrive dans 12 min »),
une seule fois au passage sous 10 min, et à l'arrivée ; chaque personne choisit arrivées, retours, ou les deux.

**RGPD** : consentement explicite (le bouton, sous l'explication ; l'API refuse sans `consent: true`) ; **seule la dernière
position** est gardée, jamais d'historique ; elle est **effacée** à l'arrêt, à l'arrivée (150 m), quand le dépôt est
enregistré et **au bout de 2 h** au plus tard (à la lecture, et par la purge nocturne) ; le journal d'audit trace les
évènements sans coordonnées ; aucune position dans les journaux ; les notifications ne donnent que l'initiale du prénom,
le nom et la plaque.

## 3 bis. Phase 2 — Place de marché grand public

Objectif : un site grand public où le voyageur choisit un aéroport et des dates, compare les parkings de plusieurs loueurs, réserve et paie en ligne. Chaque loueur utilise son espace pro (le MVP) pour tout le reste : planning, plan, navette.

Condition de lancement : 3 à 5 loueurs actifs sur au moins un même aéroport (Lyon Saint-Exupéry en premier), avec leurs disponibilités à jour dans l'outil. Sans cela, ne pas ouvrir le site public.

### Écrans grand public

1. **Accueil et recherche** : aéroport, dates et heures d'arrivée et de retour, nombre de passagers.
2. **Résultats** : liste et carte, filtres (navette, voiturier, couvert, recharge électrique, annulation gratuite, note), tri (prix, distance, avis). Le prix affiché est le prix total du séjour, tout compris.
3. **Fiche parking** : photos, description, services, distance et durée de navette, horaires, conditions d'annulation, avis, politique de retour (appel, SMS, bouton « Je suis prêt »).
4. **Récapitulatif et paiement** : coordonnées, plaque, n° de vol retour, options, paiement par carte (et Apple Pay / Google Pay), conditions générales.
5. **Confirmation et billet** : email et SMS, QR code ou code d'entrée, instructions d'arrivée, lien de gestion.
6. **Espace voyageur** : réservations à venir et passées, modification, annulation, facture, avis après séjour.

Version mobile d'abord (la majorité des réservations se fait sur téléphone), puis bureau.

### Paiement et commission

- Le paiement en ligne passe par **Stripe Connect** en mode « charges et transferts séparés » : **Plazo encaisse, puis reverse la part du loueur** (par défaut le lendemain de la fin du séjour), sans que la plateforme ait à détenir elle-même un statut d'établissement de paiement. À valider avec un juriste ou un expert-comptable **avant la mise en ligne du paiement réel** (statut, TVA sur la commission, mandat de facturation, CGU/CGV). D'ici là : **mode test Stripe uniquement** (une clé live est refusée en production sans `STRIPE_ALLOW_LIVE=true`).
- Chaque loueur est « onboardé » chez Stripe (compte Express : vérification d'identité et coordonnées bancaires saisies chez Stripe, jamais stockées par la plateforme). Un parking n'est réservable en ligne que si son loueur a un compte Stripe avec les **virements activés** (`payouts_enabled`) et une commission (la sienne ou celle de la plateforme). Sinon, le site affiche « Réservation en ligne bientôt disponible ».
- Commission : pourcentage par réservation, configurable par loueur (`commissionBps`, à défaut `PLATFORM_COMMISSION_BPS`) ; l'affichage au voyageur reste le prix total. Valeur à fixer après échange avec le client n°1 et les futurs loueurs.
- **Montants** (calculés par le serveur à la création, jamais repris du navigateur) : montant payé, commission Plazo, part du loueur, en centimes (montant = commission + part, au centime).
- **Reversements** : **le loueur choisit quand il reçoit son argent : le lendemain du dépôt, le lendemain de la fin du séjour (par défaut), chaque semaine ou chaque mois.** (`AT_DROP_OFF`, `AFTER_STAY`, `WEEKLY` = le lundi pour les séjours terminés la semaine précédente, `MONTHLY` = le 1er pour les séjours terminés le mois précédent ; dates à l'heure du parking). La date se calcule au moment du reversement avec le choix actuel du loueur ; une part déjà reversée ne l'est jamais une deuxième fois. Une tâche quotidienne fait un transfert Stripe par réservation (`source_transaction` = le paiement, clé d'idempotence par réservation), sauf si la réservation est annulée. Si le compte du loueur ne peut pas encore encaisser, le reversement reste en attente et repart à la tâche suivante.
- **Remboursements** : annulation par le voyageur dans le délai d'annulation gratuite → remboursement intégral automatique depuis le compte Plazo (« Remboursement intégral sur votre carte sous 5 à 10 jours »), le reversement prévu est annulé. Hors délai → règles du loueur (pas d'annulation en ligne). Annulation par le loueur dans l'espace pro d'une réservation payée en ligne → remboursement intégral aussi. Si un remboursement arrive après le reversement (ne devrait pas arriver), le transfert au loueur est repris (« transfer reversal ») et l'évènement est journalisé.
- Facturation : le loueur reste l'émetteur de la prestation de parking ; la facture de commission de la plateforme est séparée. Mentions légales à faire valider. Relevé téléchargeable pour le loueur : plus tard.
- Aucune donnée de carte bancaire ne transite ni n'est stockée par la plateforme (page de paiement hébergée par Stripe).

#### Arrivée des loueurs et validation des annonces (mis en œuvre, maquette S-1)

- **Inscription libre** (`/pro/inscription`, lien « Vous êtes un parking ? » du site) : entreprise, nom du parking,
  capacité, aéroport, prénom et nom, email, téléphone, mot de passe (confirmé), conditions acceptées. Crée le loueur,
  son parking et sa fiche en brouillon ; le gérant est connecté et doit confirmer son email (lien de 48 h) avant
  d'envoyer sa fiche. Protection : limite par adresse IP, champ piège, réponse identique si l'email a déjà un compte
  (son titulaire est prévenu par email), données minimales.
- **Invitation** par le super admin : nom, email du gérant, capacité, commission ; lien de 7 jours pour choisir son
  mot de passe. Liens à usage unique, stockés hachés.
- **Statut d'une fiche** : brouillon → à valider → publiée ou refusée (message obligatoire, montré au loueur). Une fiche
  publiée modifiée reste en ligne (modifications tracées) ; la plateforme peut la dépublier, le loueur la retirer.
  Le site ne montre que les fiches publiées de loueurs non suspendus ; un email prévient le loueur de chaque décision.
- **Suspension** d'un loueur : équipe déconnectée, connexion refusée, fiches retirées du site.
- **Ouvrir son espace** : le super admin agit dans l'espace d'un loueur (session de 60 minutes, bandeau jaune) ;
  chaque écriture est tracée à son nom ; équipe, mots de passe et compte du loueur en lecture seule.

#### Parcours de paiement (mis en œuvre)

1. **Étape 1 « Vos informations »** (formulaire de réservation, avec « 1 · Vos informations / 2 · Paiement ») : « Continuer vers le paiement » crée la réservation en **attente de paiement**. Elle **tient la place** (elle compte dans la capacité et la surréservation) pendant **30 minutes** (durée minimale d'une page de paiement Stripe), et n'apparaît pas encore dans l'espace pro.
2. **Étape 2 « Paiement »** (page Plazo) : récapitulatif, lien « Modifier » (retour à l'étape 1 avec les informations gardées ; la place est rendue), « Votre place est réservée pendant mm:ss », bouton « Payer 55,00 € › » et « Vous allez être redirigé vers la page de paiement sécurisée Stripe. »
3. **« Payer »** ouvre (ou rouvre, si elle est encore ouverte) une page Stripe Checkout (aux couleurs réglées dans le tableau de bord Stripe, langue française, email prérempli). La place est tenue tant que la page de paiement est ouverte. Retour sans payer → étape 2.
4. **Confirmation** : au retour, le serveur interroge Stripe et confirme aussitôt si c'est payé ; le webhook de Stripe fait de même (sans doublon). En attendant : « Paiement en cours de vérification… » (la page se met à jour seule). L'email et le SMS de confirmation partent une seule fois, après le paiement.
5. **Expiration** : à la fin du délai sans paiement (webhook `checkout.session.expired`, lecture de la réservation, tâche planifiée), la réservation est annulée et la place libérée ; l'étape 2 affiche « Le délai est dépassé » avec « Recommencer la réservation ». Un paiement arrivé juste après l'expiration garde la réservation si la place est encore libre, sinon il est remboursé.
6. **Dans l'app mobile**, l'étape 2 ouvre la **feuille de paiement native de Stripe** (carte, Apple Pay, Google Pay) au lieu de quitter l'app : le serveur crée (ou reprend) un *PaymentIntent* pour la réservation tenue (`POST /public/bookings/:ref/payment-intent`, mêmes montants et même commission que Checkout, une seule façon de payer à la fois : la page Checkout ouverte est fermée, et inversement). La confirmation est la même (webhook `payment_intent.succeeded` ou lecture de la réservation, messages envoyés une fois, paiement tardif gardé ou remboursé) ; un refus de carte (`payment_intent.payment_failed`) laisse la place tenue pour réessayer. La version web de l'app garde la page Checkout.
7. **Sans clé Stripe** (`STRIPE_SECRET_KEY` vide), rien ne change : réservation confirmée tout de suite, paiement sur place, textes « paiement sur place ».

### Règles métier spécifiques

- **Disponibilité en temps réel** : l'offre affichée vient de la capacité réelle de chaque loueur (bloc 1 du MVP). Une réservation payée en ligne tient la place le temps du paiement (30 minutes, voir « Parcours de paiement »).
- **Pas de surréservation** : la même vérification de capacité que la page propre du loueur s'applique, sur la même source de vérité.
- **Un loueur peut rester hors place de marché** : il garde sa page de réservation propre sans être listé.
- **Avis** : uniquement après un séjour réel et terminé, modérés, avec réponse possible du loueur.
- **Conditions d'annulation** : chaque loueur choisit parmi quelques modèles (gratuite jusqu'à X heures, non remboursable, etc.), affichés clairement avant le paiement.
- **Litiges** : un voyageur peut ouvrir un litige (dommage, attente excessive, service non rendu) avec pièces jointes ; l'administrateur arbitre ou renvoie vers le loueur.
- **Référencement (SEO)** : une page par aéroport et par loueur, avec contenu utile (itinéraire, durée de navette, tarifs types) ; c'est le principal canal d'acquisition sans budget publicitaire.

### Hors périmètre de la phase 2 initiale

Programme de fidélité, abonnements, multi-devises, cartes cadeaux, accords avec les compagnies aériennes, intégration directe aux comparateurs existants.

## 3 ter. Application mobile native (MVP)

Une application mobile native, publiée sur l'App Store et Google Play, fait partie du MVP. Elle s'appuie sur le même back-end et les mêmes données que l'application web. Le contenu affiché dépend du rôle de la personne connectée.

### Personnel du parking (chauffeur, agent d'accueil, voiturier)

- Chauffeur : file des retours triée par heure estimée, point de rendez-vous, boutons « pris en charge » et « déposé au parking », notification push quand un client appuie sur « Je suis prêt » ou quand un vol atterrit.
- Agent d'accueil : recherche par plaque, nom ou n° de réservation, confirmation d'arrivée, affectation d'emplacement, remise du véhicule.
- Voiturier : véhicules à garer ou à sortir, suivi des clés.
- Utilisable d'une main, gros boutons, lisible en plein soleil.

### Gérant

- Planning du jour, taux de remplissage, alertes (surréservation, vol annulé ou dérouté, échec d'envoi de SMS) en notification push.
- Les réglages (plan, tarifs, capacité, comptes) restent dans l'application web.

### Voyageurs

- Retrouver sa réservation sans créer de compte au MVP (référence + email, ou lien reçu par SMS/email).
- Voir les instructions d'arrivée, l'adresse et l'itinéraire, le point de rendez-vous au retour.
- Bouton « Je suis prêt » et suivi de la prise en charge (statut, délai estimé), notifications push en plus des SMS.
- Réserver depuis l'app (mis en œuvre, maquettes A1 à A5) : l'app **Plazo** (voyageurs ; l'espace du personnel est dans **Plazo Pro**, décision A-B du 04/10/2026), onglets **Rechercher / Mes réservations / Plus**. Recherche (aéroport, « Vos dates » en feuille avec créneaux de 30 min), résultats en liste ou sur la carte IGN (mêmes tris et filtres que le site), fiche parking (À l'aller, Au retour, Tarifs, Accès, barre « Réserver » avec le prix total calculé par l'API), réservation en deux étapes avec paiement natif (Apple Pay / Google Pay), confirmation. « Mes réservations » : les réservations gardées sur le téléphone (référence + clé de gestion dans le trousseau, sans compte), À venir / Passées, « Ajouter une réservation » (référence + email), Modifier le vol, Itinéraire, Annuler (mêmes règles que le site), « Je suis en route » le jour J. « Plus » : questions fréquentes, conditions, confidentialité, mentions légales (pages du site), contact, version.
### Une app ou deux

Décision (faite le 04/10/2026, A-B) : deux apps sur les stores, **Plazo** (voyageurs) et **Plazo Pro** (personnel et gérant), construites dans un seul projet Flutter avec deux flavors ; chaque app n'embarque que son parcours.

Pour que la séparation reste simple :
- deux espaces d'écrans bien distincts dans le code (`pro` et `voyageur`), sans écran partagé entre les deux ;
- le code commun (client d'API, modèles de données, composants d'interface, textes) dans le même projet, sous `lib/src/core`, `shared` et `services` ;
- un seul point d'entrée (`lib/main.dart`) et le flavor choisi à la compilation (`--flavor pro|traveller` et `--dart-define=APP_FLAVOR=pro|traveller`, lu par `AppConstants.flavor`) : deux identifiants d'app, deux noms, deux icônes, deux routeurs (les routes `/pro…` n'existent que dans Plazo Pro, les routes voyageur et les App Links que dans Plazo).

### Règles

- Les SMS restent le canal de référence vers le voyageur : beaucoup de clients n'installeront pas l'app pour un seul séjour. L'app améliore l'expérience, elle ne la conditionne pas.
- Comptes de développeur Apple et Google au nom de l'entreprise, à ouvrir tôt (vérifications et délais de validation).
- Mises à jour : prévoir un mécanisme de mise à jour à distance pour corriger vite sans attendre la validation des stores (pour Flutter : Shorebird, à évaluer).
- Mode dégradé côté personnel : la liste du jour reste consultable sans réseau.

## 4. Modèle de données (esquisse)

- **Operator** : id, nom, adresse, coordonnées, fuseau, paramètres.
- **User** : id, operator_id, nom, email, téléphone, rôle, actif.
- **Parking** : id, operator_id, nom, capacité totale, marge, temps de trajet navette.
- **Zone / Row / Spot** : hiérarchie du plan, avec géométrie réelle (PostGIS, coordonnées WGS84).
  - Zone : id, parking_id, nom, contour (polygone), type (épi, file voiturier, mixte).
  - Row : id, zone_id, ligne de référence, orientation, angle d'épi, profondeur de file.
  - Spot : id, rangée, libellé, type, actif, position (polygone de la place), dimensions (m), rang dans la file.
- **MapFeature** : id, parking_id, type (entrée, sortie, point de remise, arrêt navette, boîte à clés, allée, obstacle), géométrie.
- **LayoutVersion** : id, parking_id, date, auteur, nombre de places, actif (on garde l'historique des plans).
- **Reservation** : id, parking_id, canal (site, téléphone, comparateur…), statut, arrivée prévue, retour prévu, nb passagers, nom client, téléphone, email, plaque, n° vol retour, prix, notes.
- **VehicleStay** : id, reservation_id, spot_id, arrivée réelle, retour réel, clés (oui/non, emplacement clé), état des lieux (texte, photos plus tard).
- **FlightStatus** : id, reservation_id, vol, heure prévue, heure estimée/réelle, statut, dernière mise à jour.
- **ShuttleTrip** : id, parking_id, chauffeur_id, heure, direction (aller/retour), passagers liés.
- **Notification** : id, reservation_id, canal (SMS/email/push), type, contenu, statut d'envoi, horodatage.
- **PricingRule** : id, parking_id, règles (par jour, forfait, haute saison).
- **AuditLog** : qui a fait quoi, quand (affectations, annulations, changements d'emplacement).
- **DeviceToken** : id, user_id ou reservation_id, plateforme (iOS/Android), jeton push, dernière activité.
- **ArrivalSignal** (mis en œuvre) : une ligne par réservation et par moment (aller / retour), réutilisée : état
  (partage, annoncé, au point de rendez-vous, terminé, avec la raison), **dernière position seulement** (lat, lng,
  précision, horodatages, effacés hors partage — contrainte CHECK), distance, ETA, minutes annoncées, début et fin
  (2 h), notifications déjà envoyées. Mis en œuvre comme **StaffDevice** (abonnement OneSignal par personne) +
  préférences `notifyArrivals` / `notifyReturns` sur le personnel ; **Parking.returnMeetingPoint** (+ libellé).

Ajouts phase 2 (marketplace) :
- **Traveler** : id, email, nom, téléphone, préférences, date de création (compte voyageur, optionnel au début).
- **Listing** : id, parking_id, statut (brouillon, à valider, publiée, refusée) avec le message de la plateforme et les dates d'envoi et de décision, slug, titre, description, photos, services, politique d'annulation, distance et durée de navette, ordre d'affichage.
- **Airport** : id, code (LYS…), nom, ville, coordonnées, slug de la page SEO.
- **Payment** : id, reservation_id, prestataire, identifiant externe, montant, devise, statut (en attente, payé, remboursé, partiel, échoué), horodatage.
- **Payout** : id, operator_id, période, montant brut, commission, montant net, statut, identifiant externe.
- **CommissionRule** : id, operator_id (ou global), pourcentage, valide du/au.
- **Review** : id, reservation_id, note, commentaire, réponse du loueur, statut de modération.
- **Dispute** : id, reservation_id, motif, pièces jointes, statut, décision.
- **SlotHold** : id, parking_id, dates, expire_à (verrou temporaire pendant le paiement).
- Dans **Reservation** : ajouter `traveler_id` (nullable), `source` (page loueur / marketplace / import), `payment_status`, `commission_amount`.

## 5. Parcours clés

1. **Réservation en ligne** : client → page publique → choisit dates → voit prix → saisit infos → reçoit confirmation (email + SMS).
2. **Arrivée au parking** : agent ouvre la fiche (plaque ou nom) → confirme l'arrivée → affecte l'emplacement → (si voiturier) enregistre la clé → le client monte dans la navette.
3. **Retour** : vol suivi → atterrissage → SMS au client → il appuie sur « Je suis prêt » → le chauffeur voit le client en tête de file → prise en charge → arrivée au parking → l'agent affiche l'emplacement du véhicule → remise → statut « rendu ».
4. **Surréservation évitée** : une réservation qui dépasserait la capacité sur au moins une nuit est refusée sur la page publique et signalée au personnel en saisie manuelle.
5. **Retard de vol** : l'API remonte un retard → l'heure estimée se met à jour → la file se réordonne → le client reçoit un SMS d'info si le décalage dépasse un seuil.

## 6. Exigences non fonctionnelles

- **Responsive et mobile** : application web responsive ; application mobile native iOS et Android pour le personnel, le gérant et les voyageurs (section 3 ter).
- **Disponibilité** : un parking d'aéroport fonctionne 24h/24 ; viser une disponibilité élevée et un mode dégradé (consultation hors ligne de la liste du jour, à étudier).
- **Performance** : recherche de véhicule par plaque en moins d'une seconde ; suggestion d'emplacement en moins de 2 secondes ; le plan reste affichable sans réseau dans l'app du personnel (dernière version gardée sur le téléphone).
- **RGPD — position des voyageurs** (« Prévenir de son arrivée ») : sur consentement, dernière position seulement,
  effacée à l'arrivée, à l'arrêt ou au bout de 2 h au plus tard ; jamais dans l'historique, le journal d'audit ni les logs.
- **RGPD** : données minimales (nom, téléphone, plaque, vol), finalité claire, durée de conservation limitée (par exemple suppression ou anonymisation quelques mois après le retour), registre de traitement, mentions sur la page de réservation, hébergement dans l'UE.
- **Sécurité** : authentification forte pour le personnel, rôles, journal d'audit, sauvegardes, aucune donnée de carte bancaire stockée par l'outil au MVP.
- **Langue** : interface en français ; chaînes externalisées pour traduire plus tard (anglais notamment).
- **Observabilité** : logs d'erreurs, suivi des échecs d'envoi de SMS et d'appels à l'API de vols.

## 7. Intégrations

| Besoin | Piste | Remarque |
|---|---|---|
| SMS | Par loueur : son téléphone Android (appli *SMS Gateway for Android*, gratuit) ou Brevo via Plazo (0,05 €/SMS) | Voir « Canal SMS par loueur » (bloc 3) ; mot de passe de l'appli chiffré au repos |
| Email | Un service transactionnel (Resend, Brevo…) | Domaine d'envoi authentifié |
| Suivi de vols | Une API de statut de vols (AeroDataBox, AviationStack, FlightAware…) | À choisir sur couverture France, prix et limites d'appels |
| Notifications push | OneSignal (comme LoveNest) | Complète les SMS, ne les remplace pas |
| Cartographie du parking | Tracé et analyse : photo aérienne IGN BD ORTHO (WMTS de la Géoplateforme, sans clé), MapLibre GL JS + Terra Draw ; cadastre (API Carto) et parkings BD TOPO (WFS) en suggestion. Affichage : Plan IGN v2 et photo IGN (`flutter_map` dans l'app) ; Google Maps seulement pour les liens d'itinéraire | Les conditions de Google interdisent de tracer ou d'analyser son imagerie : jamais de tracé sur la vue satellite Google |
| Itinéraire voyageur | Lien vers l'app de navigation du téléphone | Pour l'adresse et l'itinéraire |
| Paiement en ligne et reversement aux loueurs | Stripe Connect (ou équivalent) | Jalon 3 pour la page propre du loueur, phase 2 pour la commission et les reversements ; valider statut, TVA et CGU avec un professionnel |
| Recherche géographique (phase 2) | Carte (OpenStreetMap / MapLibre) et index de recherche | Distance au terminal, filtres rapides |
| Avis et modération (phase 2) | Interne au départ | Avis uniquement après séjour terminé |

À vérifier avant de choisir : tarifs réels, limites d'appels, qualité des données sur les vols low cost, conditions d'usage commercial.

## 8. Stack retenue

Plazo reprend la stack de LoveNest (décision du 1er octobre 2026) :
- Serveur : Express 5 + TypeScript + Prisma 6, services typedi, validation class-validator, authentification JWT (passport-jwt, jetons stockés en base donc révocables), documentation Swagger.
- Hébergement : Vercel (région Paris) pour l'API (une fonction serverless) et l'espace pro. Les tâches planifiées (mise à jour des vols, envois de SMS, purges RGPD) passent par Vercel Cron.
- Base : PostgreSQL + PostGIS hébergée sur Neon via l'intégration Vercel (décision du 02/10/2026, à la place de Supabase).
- Espace pro et page de réservation : Vite + React + shadcn/ui, React Query.
- App mobile : Flutter, architecture de LoveNest (bloc, auto_route, get_it, retrofit, freezed, easy_localization), notifications OneSignal, builds Codemagic. Deux apps à terme via les flavors.
- Email : Brevo. SMS : le téléphone du loueur (*SMS Gateway for Android*, mode Cloud server) ou Brevo, au choix du loueur.
- Suivi de vols : AeroDataBox par défaut (RapidAPI ou API.Market), AirLabs au choix (`FLIGHT_TRACKING_PROVIDER`, inscriptions fermées pour l'instant) ; un fournisseur à la fois, une requête par vol suivi (cache de 5 minutes, 24 h avant l'atterrissage), pas de repli automatique. Le code passe par une interface interchangeable. Flightradar24 n'a pas d'offre gratuite et OpenSky est réservé à l'usage non commercial.
- Le web (TypeScript) et le mobile (Dart) ne partagent pas de code : le contrat est l'API, décrite par Swagger ; toutes les règles métier (capacité, statuts, prix) vivent côté serveur.

## 9. Découpage en jalons

> Révision du 1er octobre 2026 : « Plazo est une plateforme de réservation ». La place de marché
> (ancienne phase 2) et le paiement en ligne entrent dans le MVP ; les jalons 3a à 3c remplacent
> l'ancien jalon 3 « page publique du loueur ».

1. **Socle** (semaine 1) : comptes, rôles, opérateur et parking, capacité, base de données (avec PostGIS). *Fait.*
2. **Réservations** (semaines 1-2) : saisie manuelle, planning du jour, contrôle de capacité, statuts, import des mails de comparateurs. *Fait (Allopark).*
3a. **Fiche et tarifs du loueur** : fiche publique (photos, description, services, distance et durée de navette, politique d'annulation), grille tarifaire, aéroports.
3b. **Site Plazo voyageurs** : page aéroport (SEO), recherche par dates, résultats et filtres, fiche parking, tunnel de réservation sans compte obligatoire, confirmation, email + SMS (Brevo), lien de gestion de la réservation.
3c. **Paiement et reversements** : Stripe Connect (onboarding des loueurs), paiement par carte / Apple Pay / Google Pay, verrou de place pendant le paiement, commission, remboursements selon la politique d'annulation, relevés de reversement. Validation juridique avant mise en ligne.
4. **Cartographie et affectation** (semaines 4-7) :
   - semaine 4 : éditeur sur la photo aérienne de l'IGN (zones, éléments fixes, mesures, calage) ;
   - semaine 5 : génération automatique des places et comparaison des dispositions ;
   - semaine 6 : affectation à l'arrivée, recherche par plaque, suivi des clés ;
   - semaine 7 : suggestion optimisée (date de retour, blocages, trajets) et vue réorganisation.
5. **Navette au retour** (semaines 8-9) : API de vols, file des retours, vue chauffeur, SMS à l'atterrissage, « Je suis prêt ».
6. **App mobile** (en parallèle des jalons 4 et 5, puis semaines 10-11) : app personnel et gérant (file des retours, recherche par plaque, plan sur la carte, affectation, alertes push), app voyageur (ma réservation, « Je suis prêt », suivi), publication sur les stores.
7. **Pilote chez le client n°1** (semaine 12) : données réelles, retours terrain, corrections.

Les durées sont indicatives et à ajuster avec la date attendue par le client. L'app native ajoute environ deux semaines au MVP, plus les délais de validation des stores ; la cartographie et l'optimisation en ajoutent environ trois.

**Après le MVP** :

8. **Espace voyageur et confiance** : comptes voyageurs, avis après séjour, litiges, outils d'administration plateforme.
9. **Ouverture progressive** : d'autres loueurs à Lyon, mesure de la conversion, puis d'autres aéroports.

## 10. Critères d'acceptation du MVP

- Impossible de dépasser la capacité sur une nuit via la page publique.
- Un agent retrouve l'emplacement d'un véhicule par sa plaque en moins de 10 secondes.
- Un client qui a saisi son n° de vol reçoit un SMS à l'atterrissage sans intervention humaine.
- Le chauffeur voit la file des retours triée par heure estimée et peut la mettre à jour en un geste.
- Le gérant cartographie son parking sur la photo aérienne de l'IGN et l'écart entre le nombre de places du plan et le comptage sur le terrain est inférieur à 3 %.
- Sur une semaine de pilote, aucun véhicule suggéré par l'outil ne se retrouve bloqué derrière un véhicule qui repart plus tard.
- Le client n°1 utilise l'outil sur une semaine réelle sans repasser par ses anciens tableurs ou cahiers.
- Les apps sont publiées sur l'App Store et Google Play ; le chauffeur reçoit une notification push quand un client appuie sur « Je suis prêt ».

Critères d'acceptation de la place de marché (dans le MVP depuis le 01/10/2026) :
- Un voyageur réserve et paie un parking en moins de 3 minutes sur téléphone, sans créer de compte obligatoire.
- La commission et le reversement net sont calculés correctement sur 100 % des réservations de test, remboursements partiels inclus.
- Aucune réservation payée ne dépasse la capacité d'un loueur, même avec deux paiements simultanés sur la dernière place.
- Un loueur ouvre son compte de paiement et publie sa fiche en moins de 30 minutes.
- Les pages aéroport et loueur sont indexables et se chargent rapidement sur mobile.

## 11. Questions ouvertes (à poser au client n°1)

1. Voituriers qui déplacent les véhicules (clés confiées) ou clients qui se garent eux-mêmes ?
2. Capacité, nombre de navettes et de chauffeurs, pic de réservations par jour ?
3. Canaux de réservation actuels (comparateurs, site, téléphone) et part de chacun ?
4. Outil actuel et ce qui l'énerve le plus ?
5. Combien paie-t-il aujourd'hui en commissions aux comparateurs ?
6. Gère-t-il déjà un état des lieux des véhicules (photos, rayures) ?
7. Paiement : sur place, à la réservation, ou via les comparateurs ?
8. Prix convenu, date de mise en service attendue, nombre de parkings concernés ?
9. Téléphones du personnel : fournis par le parking ou personnels ? iPhone, Android, les deux ?
10. Plan actuel du parking : existe-t-il un plan coté (géomètre, architecte) ? Dimensions des places, places en file pour le voiturier, marquage au sol ?

Questions pour la phase 2 (à poser au client n°1 et à d'autres loueurs) :

11. Accepterait-il d'être listé sur une place de marché avec une commission ? À partir de quel pourcentage ça devient trop cher pour lui ?
12. Quelles commissions paie-t-il aujourd'hui aux comparateurs, et sur quelle part de ses réservations ?
13. Connaît-il d'autres loueurs autour du même aéroport prêts à tester ?
14. Quelle politique d'annulation pratique-t-il, et comment gère-t-il les remboursements aujourd'hui ?
15. Préfère-t-il être payé à la réservation ou après le séjour ?

## 12. Risques

- **Concurrence** (ParkFlow notamment) : comparer fonctionnalités et prix avant de coder ; l'avantage visé est le suivi de vols, la file de navettes et le plan des places, en français.
- **Précision de la cartographie** : l'imagerie satellite peut être décalée ou ancienne ; prévoir le calage par cotes mesurées sur place et une vérification sur le terrain avec le client.
- **Complexité de l'optimisation** : commencer par des règles simples et explicables (pas de blocage, proximité de la sortie), mesurer, puis affiner ; le personnel doit comprendre pourquoi une place est proposée.
- **Coût de Google Maps** : surveiller la consommation, mettre en cache le plan côté app.
- **Fiabilité des données de vols** : prévoir un repli (heure saisie) et mesurer la qualité avec le client.
- **Dépendance à un seul client** : prévoir dès le début un modèle multi-opérateurs, même si un seul est actif.
- **Nom du produit** : rester dans un fichier de configuration unique tant que le nom n'est pas validé (INPI, domaine).
- **Problème de l'œuf et de la poule (phase 2)** : une place de marché a besoin de loueurs et de voyageurs ; sans budget de publicité, le trafic doit venir du SEO et des loueurs eux-mêmes. D'où l'ordre : outil utile d'abord, site public ensuite.
- **Concurrence sur le trafic** : Parkos, ParkMundo, Onepark, Free2move et Parclick dominent déjà la recherche ; viser un aéroport à la fois, avec des pages locales plus utiles que les leurs.
- **Juridique et fiscal du paiement** : statut de la plateforme, TVA sur la commission, mandat de facturation, conditions générales, responsabilité en cas de litige ; à faire valider par un professionnel avant la mise en ligne du paiement.
- **Dépendance aux loueurs** : un loueur qui sort de la plateforme emporte ses clients ; prévoir une valeur forte côté outil (planning, plan, navette) pour qu'il reste.
- **Fuite de commission** : un voyageur peut réserver hors plateforme la fois suivante ; accepter ce risque ou le réduire par le service (billet, suivi de vol, avis).
