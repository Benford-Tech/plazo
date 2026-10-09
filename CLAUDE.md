# Projet : Plazo (nom de travail, à confirmer) — logiciel pour opérateurs de parkings d'aéroport

## Contexte

Logiciel SaaS pour les opérateurs de parkings privés situés autour des aéroports
(parkings avec navette gratuite vers les terminaux, parfois voiturier). Premier marché :
aéroport Lyon Saint-Exupéry. Un premier client (client n°1) est déjà engagé.

**Plazo est une plateforme de réservation** (décision du 01/10/2026, qui remplace le découpage en
deux phases) : la place de marché grand public fait partie du MVP. Deux faces, un seul produit :
- **Site Plazo pour les voyageurs** (à la marque Plazo) : recherche par aéroport et dates, comparaison
  des parkings partenaires (prix total, filtres, avis), fiche parking, réservation et **paiement en ligne**
  (Stripe Connect : Plazo encaisse, prélève sa commission, reverse le loueur). Voir SPEC.md, section 3 bis.
  **Décision du 06/10/2026 : tout paiement se fait en ligne**, plus de paiement sur place ; sans clé Stripe la
  réservation en ligne est indisponible (409 `online_booking_unavailable`), la saisie manuelle du loueur reste.
  **Décision du 06/10/2026 (soir) : le compte Stripe Connect du loueur n'est pas obligatoire** : réservable dès que la
  plateforme a ses clés et une commission (`PaymentService.modeFor`) ; le reversement reste `pending` tant que le compte
  n'est pas relié (`runPayouts` → `waitingForAccount`) ; les loueurs `isDemo` ne sont réservables qu'avec des clés Stripe de test.
- **Espace pro pour les loueurs** : planning, plan du parking, navette, import des autres canaux
  (blocs 1 à 3 ci-dessous), plus leur fiche Plazo, leurs tarifs et leurs reversements.
- À valider avec un juriste / expert-comptable **avant la mise en ligne du paiement** : statut de la
  plateforme, TVA sur la commission, mandat de facturation, CGU/CGV.
- Le site doit être utile même avec un seul loueur au lancement (client n°1) : les pages aéroport
  et loueur servent aussi au référencement.

Le métier de ces opérateurs :
- recevoir des réservations par plusieurs canaux (site propre, comparateurs, téléphone) ;
- accueillir le client à l'aller, garer le véhicule (le client ou un voiturier), conduire le client au terminal en navette ;
- récupérer le client au retour (aujourd'hui souvent : le client appelle le parking à l'atterrissage, attentes parfois longues) ;
- restituer le véhicule, encaisser, gérer les litiges (rayures, dégâts) ;
- parfois des services annexes : lavage, plein, recharge électrique.

## Client n°1 — À COMPLÉTER AVANT DE CODER

- Nom / parking :
- Capacité (places) :
- Navettes / chauffeurs :
- Voituriers qui déplacent les véhicules (clés confiées) OU clients qui se garent eux-mêmes ? : voituriers (01/10/2026)
- Sol du parking : gravier, sans marquage (à confirmer sur place)
- Réservations par jour (moyenne / pic) :
- Canaux de réservation actuels :
- Outil actuel (logiciel, Excel, papier) :
- Sa douleur n°1 (avec ses mots) :
- Prix convenu et date attendue de la première version :

## Périmètre du MVP : trois blocs

Ne construire QUE ce qui règle la douleur n°1 du client.

1. **Réservations**
   - Saisie manuelle (téléphone, comptoir) + import des réservations des autres canaux
     (06/10/2026 : l'import par copier-coller d'un mail est retiré ; **M-A « synchronisation de la boîte mail »** : adresse de
     réception `Operator.inboundSlug@INBOUND_EMAIL_DOMAIN` **créée avec le loueur** (08/10/2026, « configurée dès le départ » :
     `allocateInboundSlug` à la création, migration `inbound_slug_for_all` pour les loueurs existants, plus de bouton « Activer » ;
     `POST /internal/inbound/address` ne sert plus qu'à « Nouvelle adresse »), règle de transfert dans la messagerie du loueur,
     réception par **Cloudflare Email Routing** et le relais `email-worker/` (08/10/2026, à la place de Brevo, payant ; le relais
     poste chaque mail **brut** (`message/rfc822`, enveloppe en `X-Envelope-From` / `X-Envelope-To`, coupé à 4 Mo) sur `POST /public/inbound/email` avec l'en-tête `X-Inbound-Secret`, et l'API le décode avec `postal-mime` (`domain/inbound-mime.ts` ; 08/10/2026 : les 10 ms de CPU de l'offre Workers Free ne suffisaient pas à décoder une vraie confirmation, « Worker call failed after 3 attempts »)), `InboundEmailService` + `domain/inbound-email.ts`,
     table `inbound_emails`, réservation créée seule si complète (`ReservationService.createFromImport`), sinon page
     « Mails à vérifier » `/pro/reservations/a-verifier` et alerte `inbound_to_check` ; connecteurs plus tard).
     **G-B (07/10/2026) « Relier votre boîte mail »** : bouton du bloc Mails entrants (Parking › Réglages) ouvrant un assistant
     en quatre étapes (Adresse · Messagerie · Transfert · Vérification ; `InboundSetupWizard`, Gmail / Outlook / OVH / autre,
     aperçu simplifié de l'écran de la messagerie, lien « Envoyer ces étapes… » en mailto) ; la confirmation de transfert de
     Gmail (`forwarding-noreply@google.com`) est reconnue (`forwardingConfirmationOf`, statut `forwarding`, hors « À vérifier »,
     sans le texte) et son code affiché en direct 7 jours, ou son lien d'acceptation « Confirmer par le lien » depuis que Gmail
     ne met plus le code dans l'objet (08/10/2026 ; le code est lu dans le corps) ; `InboundSettings.senders/forwarding/recent`, `EmailImporter.senders`.
     **M-A + T-A + N-A (08/10/2026)** : **« Boîte de réception »** `/pro/reservations/a-verifier` (`InboundEmailsPage`) en deux
     volets dès `md` (liste ~360 px : expéditeur, objet, heure, état, résumé « Dupont · AB-123-CD · 12 oct. 08:30 · AL-123 » ;
     volet de lecture : objet ou « (sans objet) », état, « De : », « Reçu le », « Reconnu : Allopark », corps rendu lisible, bloc
     « Ce que Plazo a compris » avec les champs manquants en pilule « manquant », actions), onglets « À traiter · Traités ·
     Archivés » avec comptages ; mail choisi dans `?mail=`, le premier sélectionné sur grand écran, la sélection avance après un
     geste ; sur téléphone la liste puis la fiche plein écran avec « Retour ». API : `GET /internal/inbound/emails?view=todo|done|archived`
     → `{ data, counts: { todo, done, archived } }` (todo = incomplete et unrecognised, done = imported / duplicate / handled sur
     30 jours, archived sur 90 jours ; `?status=` filtre encore, et seul il cherche dans l'onglet de cet état ; les `forwarding` jamais listés). **Deux gestes (T-A)** :
     « Marquer comme traité » (`POST …/emails/:id/handle` → `handled` depuis incomplete / unrecognised / duplicate / dismissed ; le web ne le propose pas pour un doublon, déjà rattaché à sa réservation,
     imported inchangé, 409 `archived`, 404 pour un `forwarding` ; `/dismiss` alias déprécié ; `dismissed` déprécié dans l'enum,
     migré en `handled` ; remplace « Classer sans suite ») et « Archiver » (`POST …/emails/:id/archive` → `archived` depuis tout
     sauf `forwarding` → 409, texte gardé ; la purge efface toujours les textes à 30 jours et les lignes à 90). **Récapitulatif
     horaire (N-A)** : `Staff.bookingNotify` (`BookingNotify` immediate · hourly · never, remplace `notifyBookings` ; gérants
     `hourly`, autres rôles `immediate` : `defaultBookingNotify` dans `domain/roles.ts` ; champ `bookings` de
     `GET/PATCH /internal/notifications/preferences`), audiences push `bookings` (immediate, push par réservation) et
     `bookingDigest` (hourly) ; `GET /internal/cron/booking-digest` toutes les heures pile (cron-job.org, `CRON_SECRET`) →
     `BookingDigestService.run(now)` : par loueur actif, les réservations créées (tous canaux, hors attentes de paiement et annulées) dans
     `(Operator.bookingDigestAt ?? now − 1 h, now]`, un push « 3 réservations reçues » · « 2 Plazo, 1 Allopark · 1 mail à vérifier »
     (« · depuis 21:00 » quand la fenêtre dépasse 70 min ; sources « Plazo », « site du parking », « téléphone », « comptoir » ou le nom du comparateur ; `domain/booking-digest.ts` ; `data { type: 'booking', event: 'digest' }`, `ttl` 12 h,
     `collapseId digest-<operatorId>`), rien de 22:00 à 07:00 (heure du premier parking, repère inchangé : le récapitulatif de
     07:00 couvre la nuit), ni quand le dernier date de moins de 50 min ; le repère avance à chaque passage hors heures creuses.
     **L-A « Lecture par Claude » (08/10/2026, « les mails doivent créer automatiquement les réservations »)** : un mail qu'aucun
     importateur ne reconnaît est lu par Claude (`EmailReadingService`, `@anthropic-ai/sdk`, sortie structurée JSON,
     `ANTHROPIC_API_KEY`, `EMAIL_READING_MODEL` ; `domain/email-reading.ts` : consignes avec le fuseau du parking et la date du
     jour, schéma de réponse, `toParsedBooking` qui écarte sans corriger une date impossible, un retour avant l'arrivée, une
     plaque ou un téléphone douteux). Claude classe le mail (`kind` : réservation · modification · annulation · autre), en lit les
     champs et donne une confiance et un résumé. Réservation complète et confiance ≥ 0,7 (`MIN_CONFIDENCE`) → réservation créée
     par `createFromImport` (canal comparateur, `channelDetail` = source lue : « Parkos », « Site du parking », « Client »… ;
     doublon par la référence externe, sinon même plaque et même arrivée) ; champ requis absent ou confiance plus basse →
     `incomplete` pré-rempli (`missing` : les champs, ou `confidence`) ; modification, annulation ou autre → `unrecognised`,
     rien n'est créé ni modifié. `InboundEmail.reading` `{ kind, provider, confidence, summary, model }` (migration
     `inbound_reading`), `InboundEmailView.reading` ; boîte de réception : ligne « Lu par Claude : Réservation · confiance 92 % »
     avec le résumé, pastille du genre dans la liste. Sans clé, échec, refus ou délai (30 s) : le mail attend comme avant.
   - Page de réservation propre à l'opérateur (formulaire simple, confirmation par mail/SMS).
   - Vue planning : arrivées et retours du jour, taux d'occupation, alerte de surréservation
     calculée sur la capacité réelle.
   - Fiche réservation : client, téléphone, plaque, dates/heures, n° de vol retour, nb de passagers, statut.
   - **Décision A du 06/10/2026 (« un seul geste par étape », voir SPEC.md bloc 1)** : statut `back_at_parking` « De retour au
     parking » entre « Retour demandé » et « Rendu » ; placer la voiture = arrivée enregistrée ; fin de navette de retour =
     « De retour au parking » ; « Rendu » décroche les clés et accepte une remarque ; alerte `no_show_suspected` (sur les arrivées des 24 dernières heures) ; push
     « Nouvelle réservation » (`Staff.bookingNotify`, N-A du 08/10/2026) ; `nextStatuses` servi par l'API, listes dans `domain/reservation.ts`.
     Libellés unifiés web et app : Attendu · Sur place · Parti en navette · Retour demandé · De retour au parking · Rendu ·
     Annulé · Non venu.
   - **Décision S-A + S-B du 06/10/2026 (« SMS de la veille »)** : page `/pro/reservations/sms-veille` (lien depuis Réservations) :
     réglages habituels (envoi activé, heure de 16:00 à 21:30 par demi-heure, téléphone d'envoi), les sept soirées d'hier à J+5
     (heure changée, en pause, envoyés, échecs), la soirée choisie (heure de cet envoi, pause, « Envoyer maintenant », départs du
     lendemain avec l'état de chaque SMS, « Ne pas envoyer » / « Rétablir »), le texte du parking avec ses variables `{prénom}
     {nom} {date} {heure} {plaque} {référence} {lien}`, compteur de SMS (GSM-7 ou Unicode), « Retirer les émojis et signes »,
     « Version courte avec lien », aperçu et « M'envoyer un test ». Tables `reminder_settings` et `reminder_evenings`,
     `Reservation.reminderExcludedAt/ById`, `domain/day-before-sms.ts`, `ReminderService` : le rappel (SMS au texte du parking,
     mail et push de B) part une fois, à l'heure de sa soirée ou dès la réservation si elle est plus tardive, jamais de 22:00 à
     07:00, ni le jour du dépôt pour un envoi manqué la veille ; sans ligne `reminder_settings` : activé, 18:00, texte de Plazo.
     `GET /internal/cron/remind-tomorrow` est appelé **toutes les 15 minutes par un planificateur externe** (cron-job.org,
     `Authorization: Bearer <CRON_SECRET>`), le Vercel Cron quotidien de 19:00 UTC restant un filet ; routes
     `/internal/parkings/:id/reminders…` et `PUT /internal/reservations/:id/reminder`. Web seulement pour l'instant.

2. **Plan du parking et affectation des véhicules** (direction P-A du 03/10/2026 : trois vues
   Plan · Occupation · Planning des places dans l'onglet « Parking » ; les étapes Plan et Occupation sont livrées)
   - Cartographie du parking sur la photo aérienne IGN aux dimensions réelles : zones,
     rangées, places, entrée/sortie, point de remise ; génération automatique des places.
   - Affectation de chaque véhicule à un emplacement à l'arrivée.
   - Optimisation : maximiser le nombre de places, ranger par date de retour (aucun véhicule
     bloqué derrière un autre), réduire les trajets du voiturier. Voir SPEC.md, bloc 2.
     Décisions du 04/10/2026 : **T-A** disposition « Voiturier · files depuis le bord » (`valetEdge` : une allée
     de service le long d'un bord, files perpendiculaires aussi profondes que le terrain, sans allée intérieure ;
     `mode: 'edge'` dans `layout.ts`, profondeur max `edgeMaxFiles`) et **Z-A** zones de séjour par rang dans la file
     (`ParkingSpot.depth`, `fileLength`, `stayClass` court / moyen / long ; seuils `stayShortMaxNights` 3 et
     `stayMediumMaxNights` 8 dans les réglages du plan) : suggestions et pré-affectation prennent d'abord la zone
     de la durée du séjour, puis la zone voisine.
     **Décisions du 07/10/2026 (« l'estimation n'est pas réelle, bâtiment non reconnu, tracé difficile »)** :
     **M-A « Voiturier · peigne »** remplace les files depuis le bord sous la même clé `valetEdge` (`mode: 'comb'` dans
     `layout.ts`, web et serveur) : autant d'allées de service que le terrain en demande, files jusqu'à `edgeMaxFiles`
     de chaque côté, une allée de bout (« spine ») les relie du côté de l'entrée, orientation cherchée dans les deux
     sens de chaque bord (alignée sur un bord sauf gain > 1 %), puis les restes reçoivent des files dans l'autre sens
     depuis une courte allée qui touche le réseau (`fillLeftovers`) ; `LayoutResult.aisles` et
     `LayoutEstimate.aisles` (allées hachurées sur l'aperçu, « N m² par place » sous chaque disposition) ;
     **B-A bâtiments IGN** : `GET /internal/geo/buildings?bbox=` (BD TOPO `batiment`), à l'étape Terrain les
     bâtiments qui touchent le contour deviennent des exclusions `kind: 'building'` avec `source: 'ign'`, `ref`
     et 1 m de marge (`withIgnBuildings`, case « Exclure les bâtiments repérés par l'IGN », réglages
     `ignBuildings` / `ignBuildingsSynced`), retirables d'un clic à l'étape Zones ; le serveur fait de même quand
     l'app n'envoie que le contour (`ParkingPlanService.followLand`) ; **T-A zones automatiques** : les zones
     sont les morceaux du terrain hors exclusions (`autoZones`, une orientation par morceau, réglage `zonesAuto`,
     bouton « Zones automatiques », passage en manuel dès qu'une zone est tracée ou modifiée) et le tracé
     s'aimante aux parcelles, parkings, bâtiments et au contour (`snapToRings`, `MapView.snapTo`).
     **P-A pinceau (07/10/2026)** : à l'étape Zones, « Zone de parking » (pinceau) et « Zone de passage » (gomme ; libellés métier du 07/10/2026) (largeur 3 / 6 / 12 m) : glisser sur la carte
     peint une surface (`MapView.paint` / `onPaintStroke`, anneau du curseur à la largeur réelle, `metresToPixels`),
     `admin/src/lib/capacity/brush.ts` (`strokeArea`, `paintZones` : les zones touchées et le trait fusionnent,
     `eraseZones` : retrait, coupe en deux ou disparition) ; passe les zones en manuel. **R-A réinitialiser** : menu
     « Réinitialiser… » dans la barre des étapes (tout le plan / zones et parties exclues, bâtiments IGN gardés / places
     seulement), avec confirmation ; la capacité déclarée ne change jamais.
     **E-A (07/10/2026)** : le peigne essaie toutes les profondeurs de files (1 à `edgeMaxFiles` de chaque côté) sur les
     orientations finalistes et garde la meilleure (la plus profonde à égalité) : un terrain étroit ou découpé reçoit une
     allée au milieu au lieu de rester vide. **V-A (07/10/2026)** : `POST /internal/parkings/:id/plan/suggest-zones`
     (`ZoneSuggestionService`) assemble les tuiles IGN du terrain (`domain/layout/tiles.ts`, zoom 19, 4 tuiles de côté au
     plus, contour tracé en vert, `jpeg-js`), demande à Claude Opus 5.5 (`@anthropic-ai/sdk`, sortie structurée JSON,
     `ANTHROPIC_API_KEY`, `ZONE_SUGGESTION_MODEL`) les surfaces garables en pixels, les reconvertit, les coupe au contour
     moins les exclusions (`autoZonesFrom`) et renvoie des zones sans rien enregistrer ; bouton « Proposer les zones avec
     Claude » à l'étape Zones (proposition en bleu, carte « N zones proposées » avec sol et confiance, « Ajouter à mes
     zones » / Ignorer) ; 409 `ai_unavailable` sans clé, `ai_refused` si Claude décline. **H-A + Z-A (07/10/2026)** : case
     « Herbe autorisée » (réglage `suggestGrass`, vrai par défaut, corps `{ allowGrass }` de la route, `systemPrompt(allowGrass)`,
     sol `grass`) et la proposition **s'ajoute** aux zones déjà tracées (fusion des zones qui se touchent par `paintZones`),
     avant ou après le pinceau ; « Réinitialiser… » pour repartir de zéro.
     **R-A + R-C « éditeur du plan » (07/10/2026, « la page est inutilisable »)** : plus d'étapes ni de panneau latéral ;
     `admin/src/pages/parking/plan/PlanEditor.tsx` (barre d'outils, carte flottante de l'outil, compteur de places en
     direct recalculé 500 ms après chaque trait, tiroir `PlanSettings.tsx` pour allée, recul, files, gabarits, séjours,
     sources IGN, échelle), `planLayers.ts` (couches et étiquettes), `autoSetup.ts` (**première ouverture d'un plan vide** :
     parcelle à l'adresse du parking → bâtiments IGN → zones par Claude, sinon tout le terrain hors bâtiments → places
     « Voiturier · peigne », chaque étape enregistrée ; bandeau « Préparation du plan » ; jamais rejoué après une
     réinitialisation). L'outil Obstacle regroupe les parties exclues (clic sur un obstacle : marge, suppression) ;
     l'étape « Places » de l'ancien `SpotsStep.tsx` est fondue dans l'outil Places. Les pages `capacity/TerrainStep` et
     `ZonesStep` ne servent plus qu'à l'outil capacité de la plateforme.
     **P-B « Une rangée d'un trait » (07/10/2026, places à la main)** : dans l'outil Places, « + Rangée de places » puis un
     trait sur la carte : des places au gabarit voiturier se posent côte à côte le long du trait, perpendiculaires et
     centrées dessus (`admin/src/lib/plan/manualRow.ts`, codes `M-01`, `M-02`…, zone du point milieu) ;
     `ParkingSpot.manual`, `POST /internal/parkings/:id/plan/spots` (`AddSpotsDto`, 400 `duplicate_code`),
     `DELETE /internal/parkings/:id/plan/spots/:spotId` (409 `not_manual`) ; une régénération ne remplace que les places
     générées ; outil « Supprimer » (une place générée se désactive) ; bord blanc tireté sur la carte.
   - Décision **O-A « File triée » (06/10/2026)** : sur une file de voiturier, les retours doivent décroître de l'allée vers le
     fond ; `domain/files.ts` reconstitue les files (profondeur + position) et score chaque place libre par le nombre de
     voitures à déplacer (`blocking` devant partant après, `blocked` derrière partant avant ; même vague = 2 h) ;
     suggestions de l'Occupation et pré-affectation : d'abord 0 déplacement, puis zone de séjour, puis ajustement serré,
     puis distance ; `Suggestion.moves/blocking/blocked`, planning `stays[].blockedBy` + alerte `blocked`, tableau de bord
     `blocked_return` (retour du jour derrière une voiture partant plus tard) ; libellés « sans déplacement » /
     « N voitures à sortir » (web et app).
     **Plan de l'Occupation web (06/10/2026, maquette validée)** : `SpotState.depth/fileKey` ; `admin/src/lib/plan/files.ts`
     (files, cap des voitures vers l'allée, bande de manœuvre `MANOEUVRE_M` 3 m devant chaque file) ; `MapView` accepte les
     couches `symbol` (`layout`), des icônes SVG (`icons`) et des étiquettes `spot` masquées sous `minZoom` ; voiture vue de
     dessus dans chaque place occupée (couleur de l'état), plaque + nom + retour dès le zoom 19, file de l'arrivée survolée
     avec la place proposée cerclée d'orange et les voitures à sortir en ambre, légende « Proposée · À sortir avant un
     retour · Manœuvre ».
     **D-B « Par durée » (07/10/2026)** : pilules « Par état · Par durée » en tête de l'Occupation ; par durée, chaque voiture
     prend la couleur de la classe de son séjour (court jaune pâle, moyen citron, long ocre, comme les zones du plan ; gris
     hors classe), les places libres montrent leur zone de séjour en pâle, légende adaptée ; la fiche d'une place dit « N nuits ·
     Moyen séjour · place en zone court séjour » ; le serveur ajoute `occupant.nights` et `occupant.stayClass` au tableau
     (`OccupationService.board`, seuils du plan).
   - **Décision S-C « Des files, pas des places » (07/10/2026, « la modélisation est bancale, le voiturier passe son temps à
     déplacer les voitures »)** : sur un parking voiturier l'unité de rangement est la **file** (table `parking_files` : code,
     capacité, trait allée → fond facultatif ; `Reservation.fileId/fileRank`), plus la place. `domain/file-stacks.ts` : une
     voiture entre devant les autres ; file saine = chaque voiture repart avant celles de derrière (2 h de tolérance) ; à
     l'arrivée `rankFiles` choisit 1) la file servant déjà ce jour de retour, 2) l'ajustement serré derrière un retour plus
     tard, 3) une file vide gardée pour ce jour, 4) une file vide libre, 5) une file gardée pour un autre jour, puis celles à
     déplacements, puis les complètes ; `planEmptyFiles` = préparation de la veille (cron `prepare-files` 02:00 UTC, bouton,
     et au premier affichage du jour : files vides gardées pour les gros jours de retour des 14 prochains jours, un tiers reste
     libre). `FileService` (`GET/PUT /internal/parkings/:id/files`, `…/files/choices`, `…/files/from-plan`, `…/files/prepare`,
     `POST /internal/reservations/:id/file`, 409 `file_full` / `file_occupied`). Dès qu'un parking a des files : Occupation web
     (`FilesOccupation.tsx` : « À sortir aujourd'hui » en tête, piles, « Ranger en F07 » avec clés, « Autre file… », retrait)
     et app (`filesMode` du `ProOccupationBloc`, `_FilesSummary`, `_FileArrivalRow`, `_FileCard`, `showFilePicker`), fiches
     « File F07 · 3e depuis l'allée » (web, fiche opérationnelle, app, `TravellerReturn.file`), tableau de bord (`breakdown.movesToday`,
     `parking.storedInFiles`, capacité = somme des files, alerte `blocked_return` depuis les files), « Rendu » / annulé / non venu
     libèrent la file. Éditeur du plan : outil **Files** (un trait = une file, capacité déduite de la longueur, liste modifiable).
     **Suite du 08/10/2026** : barre d'outils Contour · Files · Repères, les outils de l'estimateur repliés sous « Avancé »
     (`PRIMARY_TOOLS` / `ADVANCED_TOOLS` dans `plan/types.ts`) ; « Me proposer des files » (files déduites des places de voiturier,
     sinon passe automatique en peigne puis files ; `AutoStep` `files` à la fin de la passe R-C, marquée dans
     `settings.autoSetupAt` pour ne jamais rejouer d'elle-même, même après une réinitialisation) ; « Réinitialiser… › Files
     seulement » ; une réinitialisation (« Tout le plan », « Places seulement ») efface aussi les places posées à la main
     (`includeManual` de `PUT …/plan/spots`) et « Tout le plan » retire les files vides (08/10/2026, « ces places restent affichées »). **Planning des files** : `GET /internal/parkings/:id/files/planning?from=&days=` (par jour : retours, en
     file / à venir, `filesServing`, `filesKept`, `room`, `missing` ; alertes `missing_room`, `over_capacity`, `unsound`),
     `PUT /internal/parkings/:id/files/:fileId/keep` `{ day | null }` (`ParkingFile.keptByHand`, migration
     `20261008090000_file_kept_by_hand` ; la préparation respecte une file gardée à la main jusqu'à son jour, `isKeptByHand`) ;
     web `FilesPlanningPage.tsx` servie par `/parking/planning` dès que le parking a des files, app : mode files du
     `ProSpotPlanningBloc` (`_FilesPlanningView`). Voyageur : `TravellerReturn.file` affiché dans « Retrouver ma voiture »
     (site `ReturnLive`, app `find_car_page` / `return_block`).
   - Retrouver un véhicule en quelques secondes (plaque, emplacement, emplacement des clés).
   - Si voiturier : suivi des clés confiées.

3. **Navette au retour**
   - N° de vol retour saisi à la réservation.
   - Suivi de l'heure d'atterrissage réelle (API de suivi de vols, à choisir).
   - File des clients à récupérer, triée par heure d'arrivée, pour le chauffeur (vue mobile).
   - SMS au client au moment de l'atterrissage (point de rendez-vous, délai).
   - Décisions du 04/10/2026 : **V-A** fiche véhicule complète (modèle, couleur, plaque, places passagers, en service /
     hors service, chauffeur habituel ; `ShuttleVehicle.seats/inService/driverId`, Réglages web et Plus › Véhicules de
     navette dans l'app pro ; au départ d'un trajet, les places limitent les passagers et un véhicule hors service n'est
     pas proposé) ; **T-A** trajets dans les deux sens (`ShuttleTrip.direction` `pickup` vers l'aéroport pour les retours,
     `dropoff` vers le terminal avec les clients arrivés, `GET /internal/shuttle/departures`, fin d'une dépose = statut
     « Parti en navette ») ; **S-A** navette en direct pour le voyageur du jour d'arrivée au jour du retour
     (`GET /public/bookings/:ref/shuttles` : navettes du parking en cours, véhicule, prénom, position, distance au parking
     ou au point de rendez-vous, la sienne repérée ; bloc « Navette » de la réservation dans l'app, interrogé toutes les 12 s ;
     le site n'a pas ce bloc : le SMS d'atterrissage renvoie simplement vers la réservation).
   - Décisions du 05/10/2026 : **V-A** véhicule du jour (`Staff.vehicleId/vehicleSetAt`, `PATCH /internal/staff/me/vehicle`,
     409 `vehicle_taken` ; écran « Mon véhicule aujourd'hui » après le poste Chauffeur puis Plus › Mon véhicule ; présélectionné
     au départ d'un trajet ; un autre poste le rend ; visible du gérant dans Équipe) ; **D-A** dessertes (`shuttle_stops` par
     parking : gare TGV, hôtel… avec coordonnées et consignes ; l'aéroport reste la desserte intégrée = point de rendez-vous ;
     `ShuttleTrip.stopId` + instantané, `Reservation.stopId` ; routes `/internal/shuttle/stops` ; puces « Desserte » au départ
     d'un trajet, bloc « Dessertes de la navette » dans Réglages web, champ « Desserte » d'une réservation) ; **P-A** navettes en
     direct pour toute l'équipe (`GET /internal/shuttle/live` : parking, dessertes, trajets avec position, distance à la desserte
     et au parking ; carte IGN et lignes en tête de l'écran Navette, bandeau sur Aujourd'hui, toutes les 12 s) ; **N-A** pushs
     OneSignal (`Staff.notifyShuttles`, réglage « Navettes » : départ et retour d'une navette, sauf au chauffeur ; au voyageur
     « Votre navette est partie » puis « Votre navette est là » à 150 m de la desserte, via `traveller_devices` enregistrés par
     `PUT /public/bookings/:ref/devices` avec le jeton de la réservation ; app voyageur = seconde app OneSignal,
     `ONESIGNAL_TRAVELLER_APP_ID/_REST_API_KEY`, à défaut celles du personnel).
   - Décisions du 05/10/2026 (soir) : **V-A « Ligne du jour »** et **F-A vol aller suivi** : le vol aller
     (`Reservation.departureFlight`, suivi du décollage dans `departure*` par le même fournisseur, même cache, rafraîchi par le
     cron `track-return-flights` et par la prévision ; champ facultatif sur le site, l'app, la saisie pro et l'import) et deux
     réglages du parking (`terminalLeadMinutes` 120, `landingDelayMinutes` 30) donnent l'heure à laquelle chaque navette doit
     partir ; `domain/shuttle-waves.ts` regroupe en **vagues** (15 min, même sens, même desserte ; passagers face aux places du
     plus grand véhicule en service, « 2 navettes » au-delà) ; `GET /internal/shuttle/forecast?date=` ; page **Navettes**
     (`/pro/navettes`, aujourd'hui / demain / après-demain ; depuis le 06/10/2026 elle porte aussi le **mode chauffeur du web**,
     `ShuttleTripsPanel` : navettes en cours sur la carte IGN avec « Terminer ce trajet » pour le chauffeur ou un gérant, mon trajet avec
     position partagée par le navigateur, « Démarrer un trajet » retours / départs avec véhicule et desserte, comme l'onglet Navette de Plazo Pro) et tuile « Navettes » du tableau de bord (prochaine vague, alertes
     `departure_cancelled`, `departure_delayed`, `wave_overflow`) ; dans Plazo Pro, carte « Ligne du jour » en tête de l'onglet
     Navette avec « Démarrer ce trajet » (sens, desserte et passagers présélectionnés) ; le voyageur voit « navette vers le
     terminal prévue vers HH:MM » (`PublicBooking.outbound`).
   - Décision **F-A du 06/10/2026 (« Ma tournée »)** : l'onglet Navette de Plazo Pro et le mode chauffeur du web en trois
     bandes À emmener · En route · En séjour (retours : À récupérer · En route · Rendus) ; `leaveAt` sur `PickupRow` et
     `DepartureRow`, `DepartureRow.expected` (attendu, grisé), `GET /internal/shuttle/staying` (`days[]`, `returnedToday`) ;
     `ShuttleState.band`, `_BandBar` ; `ShuttleTripsPanel` onglets `band-0/1/2`.
     **Ligne du jour cohérente avec l'heure (06/10/2026)** : aujourd'hui, seules les vagues à venir sont listées (`ShuttleWavesState.upcoming`,
     une vague est passée si elle est faite ou devait partir il y a plus de 30 min) ; les passées sont repliées sous « N créneaux passés »
     (app `waves-past`, web `waves-past`, heure du serveur) ; le compteur devient « N à venir ».
   - Décisions **R-B + I-C du 07/10/2026 (« suivi des navettes réglable », règle 1)** : `Parking.shuttleTracking` `off` | `team` |
     `everyone` (`team` par défaut pour un nouveau parking ; les parkings existants et ceux de démonstration à `everyone`),
     `PUT /internal/parkings/:id/shuttle-tracking` (`parking:manage`), `domain/shuttle-tracking.ts` ; bloc « Suivi des navettes »
     de la page Parking (`ShuttleTrackingCard`) et section de Plus › Réglages du parking dans Plazo Pro ; `off` : trajets sans
     position (409 `shuttle_tracking_off`, `sharePosition` faux sur `pickups`, `departures` et le trajet, ni le web ni l'app ne
     demandent la localisation) ; `team` : l'équipe seule, aucune position, distance ni « Votre navette est là » au voyageur, pas de
     navette sur la carte d'accueil ; `everyone` : comme avant. `liveShuttle` sur les résultats et fiches (navette proposée et
     `everyone`) : pilule blanche « EN DIRECT » sur la photo (`LiveShuttlePill` site, `LiveShuttleTag` app) et minibus devant le
     prix sur la pastille de la carte des résultats.
   - Décision **E du 06/10/2026 (communication voyageur ↔ parking)** : `Reservation.customerNote` (message à la réservation, ≤ 300),
     `vehicleModel` / `vehicleColour` (site, app, saisie et modification pro, fiche, fiche opérationnelle) ; `ArrivalSignal.note`
     (mot joint à « Je suis en route », « J'arrive dans… », « Je suis au point de rendez-vous », champ sur le site et dans l'app
     `ArrivalNoteChanged` / `ArrivalState.note` ; dans le push et le bandeau) ;
     `returnNoticeKind/Text/At` + `POST /public/bookings/:ref/return/notice` (« Mon vol a du retard », « Bagage perdu », autre ;
     409 `vehicle_not_on_site` ; push `returns` ; `PickupRow.notice`, `TravellerReturn.notice`) ; textes `domain/return-messages.ts`.
   - Décision **B du 06/10/2026 (messages au voyageur)** : confirmation enrichie (vol aller, navette aller, téléphone, rendez-vous
     au retour, étapes du jour du dépôt), rappel la veille (mail, SMS, push ; heure et texte du SMS choisis par le parking depuis
     « SMS de la veille », `ReminderService`, `Reservation.reminderSentAt`),
     push « Votre voiture est garée » (`parkedNotifiedAt`), push « Bon voyage ! » à la fin de la dépose, SMS d'atterrissage pour
     tous les canaux, mail et push de clôture après la remise (`closingSentAt`) ; `domain/booking-messages.ts`,
     `services/traveller-messages.service.ts` ; un message n'échoue jamais l'action qui le déclenche.
   - Décision du 06/10/2026 : **position GPS de la voiture** enregistrée par la personne qui la gare : le voyageur depuis
     l'app (carte « Ma voiture » sur la réservation, du dépôt au retour, note facultative ; `PUT/DELETE
     /public/bookings/:ref/car-location`) ou le voiturier depuis Plazo Pro (fix pris automatiquement à l'affectation de la
     place, `AssignSpotDto.car`, ou `PUT/DELETE /internal/reservations/:id/car-location`) ; la position de l'équipe prime
     (409 `car_location_locked` pour le voyageur). Champs `Reservation.car*`, `domain/car-location.ts`, vue
     `PublicBooking.car` / `TravellerReturn.car` ; « Retrouver ma voiture » (app) et le bloc du site mènent à l'épingle ;
     épingle sur l'Occupation web et ligne sur les fiches ; effacée deux jours après le retour par le cron de nuit.

## Liste « plus tard » (le « bien plus »), hors MVP

État des lieux photo, lecture de plaque, tarification dynamique,
connecteurs agrégateurs (Parkos, ParkMundo, Onepark, Free2move…), multi-parkings,
statistiques et facturation (hors commission et reversements, qui font partie du MVP).

## Concurrence à connaître avant de coder

- **ParkFlow** : système de gestion de réservations spécialisé parkings d'aéroport
  (agrège les canaux, intégrations paiement, facturation, barrières). À comparer : tarifs,
  ce qu'il ne fait pas (suivi de vol, file de navettes au retour, plan des places).
- Autres : ParkAlto (hors-aéroport), O-Valet (voiturier, suivi de vols), netPark, SMS Valet.

## Stack — DÉCIDÉE : celle de LoveNest (1er octobre 2026)

Plazo reprend la stack et les conventions des dépôts `lovenest-backend`, `lovenest-admin` et
`lovenest-frontend` (décision du 01/10/2026 : « tout LoveNest »).

- **Serveur (`backend/`)** : Express 5 + TypeScript, Prisma 6 (schéma `src/prisma/schema.prisma`,
  client généré dans `src/generated/prisma-client`), services typedi, DTO class-validator,
  passport-jwt, bcrypt, envalid, winston, Swagger (`/api/docs`). Toutes les routes sont sous `/api`.
- **Hébergement : Vercel** (décision du 01/10/2026 : « pas DigitalOcean, plutôt Vercel »), région
  Paris `cdg1`. **Un seul projet Vercel avec trois services** (`vercel.json` à la racine) sur un même
  domaine : `backend` sur `/api/*`, `admin` sur `/pro/*`, `site` (Next.js) sur le reste ; le site appelle
  l'API côté serveur par une liaison (`BACKEND_URL`). L'API tourne dans une seule fonction
  (`backend/index.js`, qui charge le code compilé dans `lib/`).
  Conséquences : pas de pg-boss (pas de processus permanent), les tâches planifiées sont des routes
  `/internal/cron/...` appelées par Vercel Cron (`vercel.json` à la racine, protégées par `CRON_SECRET` ; Vercel Hobby
  n'accepte que des crons quotidiens, les lectures rafraîchissent aussi les vols ; `remind-tomorrow` est aussi appelé toutes
  les 15 minutes par un planificateur externe, cron-job.org) ; **Ignored Build Step « production seulement » (08/10/2026)** :
  aucune branche ne construit de prévisualisation (une prévisualisation migrait la base de production avec ses secrets), et
  `vercel-build` compile d'abord puis ne migre et ne lance les scripts qu'en production (`VERCEL_ENV`) ;
  pas de fichiers de logs (winston écrit dans la console, que Vercel collecte ; erreurs sur stderr, avertissements par
  `console.warn`, pour que les journaux Vercel portent le niveau). **Exploitation (08/10/2026)** : `GET /api/health` ne touche
  rien, `GET /api/health?deep=1` interroge la base (503 `degraded`) ; `remind-tomorrow`, `track-return-flights` et `payouts`
  répondent 500 quand tout ce qui a été tenté a échoué (cron-job.org alerte sur les non-2xx) ; www.plazo.fr est proxié par
  Cloudflare : l'adresse du visiteur vient de `cf-connecting-ip`, acceptée seulement quand la requête arrive des plages
  publiées de Cloudflare (`backend/src/domain/client-ip.ts`, `site/src/lib/client-ip.ts`).
- **Base de données** : PostgreSQL + PostGIS, hébergée sur **Neon** via l'intégration Vercel (base `Plazo-db`,
  02/10/2026, à la place de Supabase). Variables injectées par Vercel : `POSTGRES_PRISMA_URL` (connexion
  mutualisée, utilisée par l'API), `DATABASE_URL_UNPOOLED` (directe, pour les migrations).
- **Espace pro (`admin/`)** : Vite + React 18 + shadcn/ui (Tailwind 3), React Router, React Query,
  sonner. Héberge l'espace pro du loueur, puis sa page de réservation (jalon 3).
- **App mobile (`mobile/`, jalon 6)** : Flutter, architecture de `lovenest-frontend` (bloc, auto_route,
  get_it, retrofit + dio, freezed, easy_localization, OneSignal pour les notifications, Codemagic
  pour les builds). Deux apps à terme (« pro » et « voyageur ») : un seul projet d'abord, deux
  parcours bien séparés, puis deux points d'entrée (flavors). **Décision du 04/10/2026 : app pro complète, équivalente
  à l'espace pro web** (A-B : deux apps « Plazo » et « Plazo Pro » sur un seul projet ; N-A : quatre onglets
  Aujourd'hui · Réservations · Parking · Plus), livrée par étapes : 1 réservations (fait), 2 flavors et onglets (fait : `--flavor pro --dart-define=APP_FLAVOR=pro`,
  `ProShellPage` à quatre onglets sous `/pro`, icône Pro vert citron (P et avion vert foncé, C-B 05/10/2026) ; iOS : schémas
  Xcode `traveller` et `pro` avec leurs configurations `-traveller` / `-pro`, bundle id `.pro`, `AppIcon-pro`, `RunnerPro.entitlements`
  (07/10/2026)),
  **R-C « Poste du jour » (04/10/2026)** : chaque membre choisit son poste (gérant, accueil, chauffeur, voiturier) parmi ceux
  que son rôle couvre (`allowedPosts` dans `domain/roles.ts`, `Staff.post/postSetAt`, `PATCH /internal/staff/me/post`) ; les quatre
  onglets suivent le poste (`core/helpers/posts.dart` : chauffeur Navette · Arrivées · Retours · Plus, voiturier Parking ·
  Aujourd'hui · Places · Plus, accueil et gérant Aujourd'hui · Réservations · Parking · Plus), les droits restent ceux du rôle ;
  le gérant voit le poste du jour dans Équipe (web et app). Étapes de l'app pro :
  3 planning des places (fait : `/pro/planning-places`, feature `pro_spot_planning`), 4 équipe / compte / réglages (fait :
  `/pro/equipe`, `/pro/compte`, `/pro/reglages` avec le canal SMS, feature `pro_settings` ; le point de rendez-vous reste sur le web),
  5 Sur Plazo (fiche, tarifs, Stripe), 6 inscription.
- Cartographie : photo aérienne IGN BD ORTHO et Plan IGN (MapLibre + Terra Draw sur le web, `flutter_map` dans l'app) ; Google Maps
  seulement pour les liens d'itinéraire, ses conditions interdisant de tracer ou d'analyser sur son imagerie. SMS et envoi des e-mails :
  Brevo ; réception des e-mails transférés par les loueurs : Cloudflare Email Routing + relais `email-worker/` (08/10/2026 ; le domaine
  `plazo.fr` reste enregistré chez Hostinger, ses DNS sont chez Cloudflare, adresses `<slug>@plazo.fr` illimitées ; **R-A du
  08/10/2026** : sur le domaine principal, pas sur `in.plazo.fr`, car Cloudflare n'offre le « catch-all » que sur le domaine
  principal ; `reservations@plazo.fr` a sa propre règle vers la boîte de Plazo, et le Worker renvoie à `FALLBACK_ADDRESS` les
  mails des adresses qui ne sont à aucun parking).
- Suivi de vols : AeroDataBox par défaut, AirLabs au choix (`FLIGHT_TRACKING_PROVIDER`), derrière une interface
  interchangeable ; un seul fournisseur à la fois, une requête par vol, pas de repli automatique.

Contraintes : application web responsive, application mobile native iOS et Android,
interface en français, données personnelles clients → RGPD (minimiser, durée de conservation).
Le nom du produit doit rester dans UN seul fichier de configuration (il peut encore changer).

## Structure du dépôt

- `vercel.json` : le projet Vercel et ses trois services (`backend` sur `/api`, `admin` sur `/pro`,
  `site` sur le reste), la liaison site → API et le Cron ; `git.deploymentEnabled` coupe les prévisualisations des branches
  `claude/*` (08/10/2026 : le plan Hobby plafonne à 100 déploiements par 24 h, chaque push en consommait un).
- `product.json` : nom du produit et libellés de marque (seul endroit où le nom apparaît ;
  lu par le serveur, l'espace pro et le site), et `company` : la société éditrice (« Plazo Aéroports », forme, siège,
  immatriculation, TVA, directeur de la publication, médiateur ; un champ vide s'affiche « [à compléter] »).
- `site/src/lib/legal.ts` : textes des Conditions générales (`/conditions`), des Mentions légales (`/mentions-legales`)
  et de la Politique de confidentialité (`/confidentialite`, durées de conservation reprises du code ; réservations
  anonymisées 12 mois après le retour par le cron de nuit, `backend/src/domain/retention.ts`, `Reservation.anonymizedAt`),
  rédigés d'après le fonctionnement réel (06/10/2026), **projet à faire valider par un juriste** (bandeau sur la page,
  pages non indexées) ; à tenir à jour quand une règle change (paiement, annulation, classement, données).
- `backend/` : API REST sous `/api` (`index.js` = point d'entrée Vercel). Les routes du personnel du loueur
  sont sous `/api/internal/...` (`StaffAuthMiddleware`, jetons stockés en base et révocables), comme les
  routes staff de LoveNest ; celles du site voyageurs sous `/api/public/...`.
- `admin/` : espace pro, servi sous `/pro`. L'onglet « Parking » a quatre volets : `/parking/plan` (bloc 2, étape
  « Plan », **éditeur R-A du 07/10/2026** : une seule carte IGN, une barre d'outils à gauche Contour · Zone de parking ·
  Zone de passage · Obstacle · Repères · Places, une carte flottante par outil, le nombre de places en tête ; moteur de
  l'estimateur `src/lib/capacity/*`, pages `src/pages/parking/plan/*`, places numérotées par `src/lib/plan/numbering.ts`,
  routes `/api/internal/parkings/:id/plan…`, tables `parking_plans` et `parking_spots` ; les anciens chemins
  `/parking/plan/terrain|zones|places` ouvrent l'outil correspondant), `/parking/occupation` (étape « Occupation », 04/10/2026 : plan en couleurs, arrivées à placer avec
  place proposée, recherche par plaque / nom / référence, crochet des clés ; routes `/api/internal/parkings/:id/occupation…`
  et `POST /api/internal/reservations/:id/spot` ; champs `Reservation.spotId` et `keyHook`), `/parking/planning` (étape
  « Planning des places ») et `/parking/reglages`.
  L'onglet « Parking » est ouvert à tout le personnel (`reservations:view`) ; Plan et Réglages restent aux gérants. L'espace « Plateforme » du super admin (`PLATFORM_ADMIN_EMAILS`) est sous
  `/pro/plateforme` (pages `src/pages/platform/*`, routes serveur `/api/internal/platform/...` protégées par
  `PlatformAdminMiddleware`) ; l'inscription libre des loueurs sous `/pro/inscription`. Notifications de la plateforme
  (choix E-A + C-A du 05/10/2026) : `/pro/plateforme/notifications`, table `platform_notifications`, routes
  `/api/internal/platform/notifications[/audience]` ; envoi push à tous les pros (réglage `Staff.notifyPlatform`) ou à tous
  les voyageurs (appareils enregistrés, deux envois par jour au plus, 429 `daily_limit`).
- `site/` : site Plazo voyageurs (Next.js), servi à la racine du domaine. **Référencement (08/10/2026)** : données structurées
  schema.org (`src/lib/structured-data.ts`, composant `JsonLd` : Organization et WebSite sur l'accueil, FAQPage et ItemList des
  parkings sur la page aéroport, ParkingFacility + BreadcrumbList sur une fiche) ; un parking de démo (`isDemo`) n'est ni décrit,
  ni dans le sitemap, et sa fiche est en `noindex` ; liens internes vers l'adresse canonique d'un aéroport (`airportPath` : `/` pour Lyon).
  **C-A « Le guide sur la page Lyon » (08/10/2026)** : titre « Votre parking à l'aéroport de Lyon Saint-Exupéry », guide sous la liste
  des parkings (`src/lib/airport-guides.ts`, composant `AirportGuide` : « Sur cette page », aéroport ou privé avec tableau comparatif
  empilé sur téléphone, prix d'une semaine, navette, voiturier, accès, conseils) et « Questions fréquentes » (4 générales + 5 de Lyon,
  aussi en FAQPage) ; les chiffres (prix d'une semaine, durée de navette) viennent des offres en ligne des seuls parkings réels
  (`guideFacts`), sans parking réel le texte n'en donne aucun ; faits sur l'aéroport relus sur lyonaeroports.com le 08/10/2026.
  **A « 4 200 mots, FAQ balisée » (09/10/2026)** : le guide Lyon fait ~6 400 mots, 14 sections (`GuideSection.parts` pour des
  sous-titres h4, `GuideTable.columns` à N colonnes avec `note` de source), 3 tableaux (aéroport ou privé ; parkings officiels P0 à
  P7 : emplacement, accès, couvert, hauteur ; grille 2026 sans réservation de 24 h à 1 mois) et 19 questions, toutes dans le FAQPage
  avec les 4 générales ; les chiffres de l'aéroport sont dans la constante `LYON_OFFICIAL` (grille tarifaire PDF 2026 et pages
  de lyonaeroports.com relevées le 08/10/2026, revérifiées le 09/10/2026, date citée dans le texte ; **Terminal 2 fermé depuis le
  01/04/2026** : le guide envoie tout le monde au Terminal 1 ; P1 géré par LPA ; les navettes des parkings extérieurs ne déposent
  pas devant l'aérogare (règlement des parcs) ; deux relectures contradictoires, 90 corrections) et ceux des partenaires restent ceux de
  `guideFacts` ; `guideTexts` / `guideWordCount` servent aux tests (≥ 4 200 mots avec ou sans partenaire). Les parkings de démo
  sont archivés (`DEMO_LISTINGS=archive` : `DemoSeedService.archive` suspend les loueurs `isDemo`, `true` les rétablit).
- `email-worker/` : relais des mails entrants (Cloudflare Email Worker, `postal-mime`) : Email Routing lui passe chaque mail de
  `plazo.fr` (règle « catch-all » du domaine principal), il le poste sur l'API ; déployé par GitHub Actions (`email-worker-ci.yml`,
  job `deploy`, environnement GitHub Production : secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `INBOUND_EMAIL_SECRET`, variable `FALLBACK_ADDRESS` ; rien dans le tableau de bord Cloudflare, qu'un déploiement écrase ; Worker `plazo`) ; mise en place dans son README.
- `mobile/` : app Flutter (jalon 6 commencé) : un seul projet, deux apps (`AppConstants.flavor`) : « Plazo », onglets
  Rechercher / Mes réservations / Plus pour le voyageur (mêmes chemins que le site : `/:airport/recherche`, `/:airport/:parking`, `/ma-reservation…`), et le
  parcours pro (`/pro…`, comptes du personnel ; `/pro/plan` et `/pro/parking` (Occupation) pour le bloc 2 ; `/pro/reservations…` : liste,
  recherche, fiche avec « Prochaine étape » unique et menu « Autres actions » (C-B du 06/10/2026 : Placer → Occupation ciblée,
  Déposer / Récupérer → Navette présélectionnée, Rendre → feuille clés + remarque), saisie, feature `pro_reservations`, 04/10/2026) **dans Plazo Pro seulement**
  (décision du 04/10/2026 : l'app voyageur n'embarque plus l'espace pro, et Plazo Pro aucun écran voyageur), dont le plan du parking pour les gérants
  (`/pro/plan`, M-A + rectangle auto du 04/10/2026 : adresse ou GPS, coins sur la photo IGN, génération côté serveur
  par `/plan/estimate` et `/plan/generate`) ; paiement par la feuille native Stripe
  (`flutter_stripe`) ; architecture de `lovenest-frontend`
  (`lib/src/features/<x>/{data,domain,presentation}`, `di/`, `core/`), textes dans `assets/l10n/fr-FR.json`,
  nom du produit recopié depuis `product.json` par `tool/sync_product.dart`, builds par `codemagic.yaml` (racine du dépôt, `working_directory: mobile`). **Pipelines de publication (07/10/2026)** :
  `mobile-check` (chaque push : vérifications + APK debug), `plazo-release` et `plazo-pro-release` (tag `mobile-v*` ou manuel :
  AAB signé → Google Play piste interne, IPA signé → TestFlight ; numéro de build = compteur Codemagic + 100, jamais sous le
  dernier des stores ; secrets dans le groupe Codemagic `mobile_secrets` et l'intégration `plazo-asc`, voir `mobile/README.md`
  « Publier sur les stores »).
  Voir `mobile/README.md`.

## Personnel

- Chaque membre a un **prénom et un nom** (06/10/2026 : `Staff.firstName/lastName`, `name` = « Prénom Nom » calculé par le serveur,
  `domain/staff-name.ts`) : création d'un membre, inscription du gérant et invitation par la plateforme en deux champs ; les pushs
  et la remarque de remise utilisent le prénom.

## Conventions (reprises de LoveNest)

- Serveur : une route `xxx.route.ts` (classe `Routes`, JSDoc Swagger) → un contrôleur
  (`catchAsync`, `http-status`) → un service typedi qui porte les règles et les contrôles d'accès.
  Erreurs : `HttpException(status, message, code)` ; le corps d'erreur est `{ message, code?, fields? }`,
  et les clients traduisent `code` et `fields` en français.
- Toute donnée est filtrée par `operatorId` du personnel connecté (multi-opérateurs dès le départ).
- Prisma : ids `cuid()`, champs camelCase, tables snake_case au pluriel (`@@map`), PostGIS en
  `Unsupported("geometry(...)")` lu et écrit en SQL brut ; les contraintes CHECK s'ajoutent à la main
  dans la migration.
- Espace pro : `src/lib/api.ts` (`adminApi`), `AuthContext`, pages `XxxPage.tsx`, composants shadcn
  dans `components/ui`, textes dans `src/lib/fr.ts`.
  **Plus d'alerte native (07/10/2026)** : jamais `window.confirm` / `window.alert` ; une question se pose avec
  `useConfirm()` (`components/ui/confirm-context.ts`, promesse de booléen, options `title`, `confirmLabel`,
  `destructive`), servie par `ConfirmProvider` (`components/ui/confirm.tsx`) monté dans `App.tsx` autour de l'espace pro ;
  sans fournisseur (test d'un composant seul), repli sur la boîte native.
- Tests serveur : Jest + supertest contre une vraie base de test (`DATABASE_URL_TEST`, nom en `_test`
  obligatoire). Tests espace pro : Vitest + Testing Library.

## Commandes

Dans `backend/` :
- `npm run dev` : serveur de développement (port 3005, API sous `/api`, docs sur `/api/docs`)
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`
- `npm run prisma:migrate -- --name xxx` : nouvelle migration ; `npm run prisma:deploy` : appliquer
- `npm run seed:operator -- --operator … --capacity … --name … --email … --password …`

Dans `admin/` :
- `npm run dev` (http://localhost:8080/pro/, relaie `/api` vers le port 3005), `npm test`, `npm run lint`, `npm run build`

Dans `mobile/` (SDK Flutter stable hors du dépôt) :
- `flutter pub get`, `dart run build_runner build` (après un changement de modèle, d'état, de client ou de route)
- `flutter analyze`, `flutter test`
- `flutter run --dart-define=API_BASE_URL=http://localhost:3005/api` (API locale) ; `flutter build web` pour un essai navigateur
- `dart run tool/sync_product.dart` (après un changement de `product.json` ; `--check` en CI)

Dans `email-worker/` :
- `npm ci`, `npm test`, `npm run typecheck` ; `npx wrangler deploy` pour un déploiement à la main

Dans `site/` :
- `npm run dev` (port 3000, `BACKEND_URL` par défaut http://localhost:3005), `npm test`, `npm run lint`,
  `npm run typecheck`, `npm run build`

## Direction visuelle — DÉCIDÉE (1er octobre 2026)

Canevas de référence : https://claude.ai/artifact/6ezoCDyLXFNwhAH5ZWUf4u (rangée « Retenu »).

- **Espace pro (web, `admin/`)** : **direction C-B « Opérations » (choix du 05/10/2026, d'après la maquette 2 de Joanny ;
  remplace la direction B noir et jaune)** : fond gris très clair `#EEF0EE`, cartes blanches arrondies (14 px, `--radius`),
  filets `#E4E6E2`, texte `#1A1D1A`, gris `#6B7280`, **vert citron `#A3E635`** en aplat seulement (boutons, section courante, jour sélectionné, épingles ; texte vert
  foncé `#0F2A14` dessus), **vert foncé `#1E5E2E`** pour tout ce qui est texte, icône ou contour d'accent (classe
  `text-lime-deep` ; dans l'app `AppColors.accent` = vert foncé et `AppColors.action` = citron, décision du 05/10/2026 :
  « pas assez voyant » en citron sur blanc) ; états en pilules teintées
  (vert `#16A34A`, ambre `#D97706`, rouge `#DC2626`, indigo `#4F46E5` sur fonds pâles) ; Inter pour le texte (Archivo Narrow
  disponible en `font-narrow`), JetBrains Mono pour les heures et les chiffres ; **logo pro = panneau vert citron, lettres
  vert foncé** (`brand/logo-horizontal-pro.svg`) ; fond de connexion = grille citron sur le fond clair. Les paragraphes
  suivants décrivent la composition, qui reste celle de la fusion Flotte + Opérations ; leurs mentions de noir et de jaune
  sont caduques.
  Ancienne direction **B « Tableau des vols »** (01/10 → 05/10/2026) — fond noir `#0B0B0C`,
  jaune `#F5C400` pour l'action et les heures, texte `#F3F3F0`, gris `#A8A8A2`, filets `#3A3A38` ;
  Archivo Narrow (capitales pour les titres) + JetBrains Mono (heures, chiffres, vols) ; angles vifs.
  Avec deux emprunts à C : **arrivées et retours en deux colonnes séparées**, et les **plaques**
  dessinées comme une plaque française (bande bleue `#1F3FA6` « F », fond blanc).
  Connexion et inscription web (choix F-A + L-A du 05/10/2026) : la grille « tableau des vols » de l'app Pro en fond
  (`BoardBackdrop`), formulaire dans une carte bordée de jaune ; **logo pro = panneau jaune `#F5C400`, lettres noires**
  (`brand/logo-horizontal-pro.svg`) dans tout l'espace pro web, le panneau orange restant au site voyageurs.
  **Coquille et accueil (fusion « Flotte + Opérations », 05/10/2026)** : rail noir à gauche (icône + libellé par
  section, la courante en jaune ; rangée défilante sur téléphone), barre haute fine (parking, compte) ; page d'accueil
  « Tableau de bord » (`/pro/`, `GET /api/internal/dashboard`) : cinq tuiles (Sur le parking, Arrivées, Retours,
  Navettes, À traiter), bandeau d'état des services (vols, SMS, notifications, paiements, import), liste « À traiter
  maintenant » (urgent → à surveiller → à faire), véhicules sur le parking avec place et clés, carte IGN des navettes en
  direct (`GET /internal/shuttle/live`). **Tuile Paiements (07/10/2026, « les paiements sont centralisés »)** : OK « en ligne, encaissés par Plazo » si
  `services.stripe.online` (clés Stripe de la plateforme + commission, `PaymentService.modeFor`), sinon Off ; le compte Stripe
  du loueur n'y apparaît pas (il ne sert qu'aux reversements, page Reversements), web et app. Le planning passe à `/pro/planning`. **Fiche opérationnelle (C-A, 06/10/2026)** :
  `ReservationQuickCard` (tiroir, `QuickCardProvider` dans `App.tsx`, `useQuickCard().open(id)`) ouverte depuis les lignes du
  planning, les alertes et véhicules du tableau de bord, les tuiles de la page Navettes et « Ouvrir la réservation » de
  l'Occupation : appel / SMS, vols et état, place et clés, voiture, desserte, puis `NextStep` (un bouton « Prochaine étape » :
  Placer → `/parking/occupation?focus=`, Déposer / Récupérer → `/navettes?sens=&reservation=`, Rendre → formulaire clés +
  remarque ; « Autres actions… » pour les autres statuts, servis par `nextStatuses`) ; même `NextStep` sur la fiche complète. Palette de ces maquettes (web et app) : cartes
  arrondies 12 px sur anthracite `#17171B` / `#1D1D22`, filets `#2A2A30`, jaune pour l'action et les épingles, et quatre
  couleurs d'état en badges pleins (vert `#22C55E` atterri / sur place, ambre `#F59E0B` retardé / à surveiller, rouge `#EF4444`
  sans place / urgent, bleu `#60A5FA` retour du jour) ; pilules teintées « OK · À voir · Off » pour les services
  (jetons Tailwind `panel`, `ok`, `warn`, `bad`, `info` ; `AppStatus` et `AppColors.panel*` dans l'app). **Même tableau de bord dans l'app Plazo Pro**
  (05/10/2026) : onglet Aujourd'hui, barre « Tableau de bord · Planning » (feature `pro_dashboard`, `ProDashboardBloc` toutes
  les 30 s, `DashboardView` avec la carte des navettes `LiveShuttlesCard`) ; les onglets Arrivées / Retours du chauffeur
  restent le planning seul.
- **Site Plazo voyageurs (web)** : **aligné sur la direction T-A « Parking » de l'app (05/10/2026)** : fond gris clair
  `#ECECEE` (`--color-ground`), cartes blanches 22 px à ombre douce (utilitaire `card`), en-tête sur le fond (plus de bande
  orange ; logo et liens sombres, « Pour les loueurs » en pilule blanche), pied de page brun foncé, Manrope (`--font-manrope`)
  avec Playfair italique sur les titres, orange `#FF6600` réservé à l'action (`btn-primary` plein) et à une carte par écran.
  Accueil : titre en deux tons « Votre parking à … », carte de recherche blanche, carte IGN du séjour par défaut
  (`api.search` dans `AirportView`, `HomeMapPanel` → `HomeMap` sur `ResultsMap`) avec pilules « N parkings disponibles » et distance, carte
  orange du moins cher. **K-A « Carte vivante » (06/10/2026, site et app)** : la carte d'accueil est interactive (glisser, zoomer,
  boutons de zoom ; deux doigts sur téléphone), montre tous les parkings du séjour en pastilles (prix, ou « Complet »), les
  navettes en circulation en marqueurs orange animés (`GET /public/airports/:slug/live`, anonyme : position, sens, véhicule ;
  toutes les 12 s, `useAirportLive` / `SearchLivePolled`) et la pilule « N navettes en circulation » ; toucher une pastille met ce
  parking dans la carte orange (sombre et « Complet à ces dates » s'il n'a pas de place). **I-C « Icône navette » (06/10/2026,
  site, app et pro)** : pictogramme de minibus vu de côté (Material `airport_shuttle`), tourné dans le sens du déplacement (cap
  calculé côté client entre deux positions, `bearing` / `shuttleBearing`), couleur par sens : orange vers le terminal, pêche vers
  l'aéroport, gris sans position (vert foncé / vert / gris dans l'espace pro) ; `site/src/lib/shuttle-icon.tsx`,
  `admin/src/lib/shuttle-icon.tsx`, `mobile/lib/src/shared/widgets/shuttle_icon.dart` (`ShuttleIcon`, `ShuttlePin`) ; repris sur
  la carte d'accueil, la pilule « N navettes », le bloc Navette, le retour en direct, la carte et les lignes des navettes pro. Page Ma réservation, véhicule sur place : bloc `ReturnLive` (client, `GET /api/public/bookings/:ref/return`
  toutes les 10 s avec le jeton en en-tête) : anneau de compte à rebours à la seconde, puces Atterrissage · Rendez-vous ·
  Navette, pilule « En direct · il y a N s », âge de la position de la navette, encart sombre « Retrouver ma voiture »
  avec la place du voiturier. **D (06/10/2026) : le site au niveau de l'app le jour J** : bloc `ArrivalBlock` « Prévenir de mon
  arrivée » (`GET/POST /public/bookings/:ref/arrival…` : partage de la position du navigateur avec consentement, « J'arrive dans
  10 / 20 / 30 min », « Je suis au point de rendez-vous » avec position jointe facultative, arrêt), bloc `StayShuttles` « Navette »
  du jour d'arrivée au jour du retour (`GET …/shuttles`, 12 s), et dans `ReturnLive` « J'ai atterri » sans vol suivi
  (`POST …/return/landed`), consignes et photo du point de rendez-vous, itinéraire vers le rendez-vous ; appels du navigateur par
  `lib/booking-client.ts`. Ancienne direction M3 (01/10 → 05/10/2026), pour mémoire : **en-tête orange easyJet `#FF6600`** (T-A, 03/10/2026, à la place du prune),
  bandeau photo sous un voile orange, pied de page orange foncé `#E65C00`, titres en Playfair Display italique,
  Inter pour le texte, accent **orange léger `#FF8A3D`** (V-A, 03/10/2026, à la place du violet), brun foncé
  `#2C1A0E` pour les surfaces sombres, bouton principal en dégradé orange léger → pêche, cartes arrondies (16 px),
  plaques façon C. **Plus aucun violet ni prune.** Maquettes : artboards `Plazo-M3-*` du canevas (couleurs d'origine).
- **App Plazo Pro (Flutter, flavor `pro`)** : les couleurs de l'espace pro web, **direction C-B « Opérations » depuis le
  05/10/2026** : fond `#EEF0EE`, cartes blanches 14 px, vert citron `#A3E635` (texte vert foncé `#0F2A14`), vert foncé
  `#1E5E2E` pour les titres et le « live », états en pastels (`AppStatus`), barre d'app blanche, Archivo Narrow pour les
  titres et JetBrains Mono pour les heures et les chiffres (jusqu'au 05/10/2026 : direction B noir `#0B0B0C` et jaune `#F5C400`). Les couleurs, rayons et polices sont des constantes choisies
  à la compilation selon le flavor (`AppColors`, `AppRadius`, `AppFonts` dans `shared/theme/theme.dart`). Écran de connexion :
  direction **C-C « Tableau des vols »** (04/10/2026) : grille d'affichage sous un voile noir, formulaire dans une carte bordée de
  jaune ; rien ne nomme un parking avant la connexion (l'app sert plusieurs parkings).
- **App Plazo voyageur (Flutter)** : **direction T-A « Parking » (choix T-A + F-A du 05/10/2026, d'après la maquette de Joanny)** :
  fond gris clair `#ECECEE`, cartes blanches très arrondies (22 px) à ombre douce, **plus d'en-tête orange** (barre sur le
  fond gris, logo ou titre brun), une seule carte orange `#FF6600` par écran (parking recommandé, bouton d'action), pilules
  flottantes sur la carte, police **Manrope** pour le texte et les chiffres, Playfair italique gardé sur le titre d'accueil et
  les petits mots de l'anneau ; **accent sur le temps réel** : pilule « EN DIRECT · il y a N s » (`LivePill`) partout où
  l'app interroge l'API, anneau de compte à rebours à la seconde (`ReturnRing` : atterrissage, puis navette), écran
  « Retrouver ma voiture » (`/ma-reservation/:ref/ma-voiture`, place et zone du voiturier via `TravellerReturn.spot`,
  position du parking, itinéraire à pied). Accueil Rechercher : salutation, titre, dates et bouton dans une carte blanche,
  carte IGN du séjour avec « N parkings disponibles », distance et navette, carte orange du moins cher
  (`SearchBloc.preview`) ; depuis K-A (06/10/2026) la carte est interactive, chaque parking est une pastille touchable
  (`_ParkingPin`, `SearchParkingSelected`) et les navettes en circulation y bougent (`_ShuttleMarker`, `SearchBloc.live`). L'ancienne direction D reste documentée ci-dessous pour mémoire.
  Direction **D « style Thempo »** (jusqu'au 05/10/2026) — **en-tête orange easyJet `#FF6600`** (T-A,
  03/10/2026, à la place du prune), brun foncé `#2C1A0E` pour les textes forts et les surfaces sombres, accent
  **orange léger `#FF8A3D`** (V-A, 03/10/2026, à la place du violet), pêche `#f0a36b` pour le temps fort,
  dégradé orange léger → pêche sur les actions principales, Playfair Display (titres) + Inter, cartes arrondies ; plaques façon C aussi.
  Icônes (choix H-B du 03/10/2026) : icônes pleines arrondies (Material « rounded ») posées sur des
  tuiles au dégradé orange léger → pêche (`IconTile`) ; onglets loupe / billet / « ··· ».
- **Logo (choix E-A du 03/10/2026)** : le panneau de parking, « Plazo » en Inter 800 blanc dans un rectangle
  **orange easyJet `#FF6600`** aux angles arrondis (O-D, 03/10/2026) ; symbole = le panneau réduit au « P » ;
  pour le site et l'espace pro. **L'app mobile
  garde le logo L-B** (P Playfair + avion en papier, mot-symbole italique) pour son icône et son en-tête
  (`brand/app/`) ; depuis le 03/10/2026 (choix O-A + O-B, puis T-A) l'avion est orange easyJet `#FF6600`,
  l'en-tête de l'app affiche le carré blanc avec P et avion orange, et l'icône d'app est orange plein (P blanc,
  avion brun foncé). Fichiers et règles dans `brand/README.md`.

## Règles de travail

- **Toujours un design avant le code** pour tout changement d'interface : proposer une ou plusieurs
  directions, attendre le choix de Joanny, puis implémenter (« Design : propose, je tranche et tu
  implémentes », 01/10/2026). Un bug, une traduction ou une route serveur se corrigent directement.
- Livrer par petites étapes utilisables par le client n°1, montrer chaque étape.
- Ne pas ajouter de fonctionnalité hors périmètre sans demande explicite.
- Code et commentaires en anglais, interface et documentation utilisateur en français.
- **Mise en production (08/10/2026)** : la liste « Avant d'ouvrir aux vrais clients » du README est l'état de référence
  (décisions de Joanny, tableaux de bord, ce qui est fait) ; la tenir à jour à chaque point réglé.
- **Livraison (07/10/2026)** : une fois le travail vérifié (lint, tests, build) et poussé sur la branche, ouvrir
  automatiquement la PR vers `main` puis la fusionner, sans attendre de demande.
