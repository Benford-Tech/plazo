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
  **Passage aux clés réelles (14/10/2026, « passer stripe en mode prod », validation juridique confirmée)** : le mode du compte
  Connect (`Operator.stripeAccountLive`) et de chaque paiement (`Reservation.stripeLive`, nul = test) est gardé (migration
  `stripe_mode`) ; `PaymentService.accountOf` ne rend que le compte du mode des clés (un compte de test = non relié : statut,
  lien du tableau de bord, reversements en attente, Plateforme, tableau de bord ; l'inscription crée un compte réel à sa place,
  jamais un compte de test à la place d'un compte réel) ; `testUnderLiveKeys` : un paiement de test sous clés réelles n'est
  ni reversé (`payoutStatus` `cancelled`, `testPayments` du cron) ni remboursé chez Stripe (`stripeRefundId` nul), sa page ou
  sa feuille est oubliée (`forgetTestPayment`) ; le webhook ignore un évènement `livemode: false` sous clés réelles.
- **Espace pro pour les loueurs** : planning, plan du parking, navette, import des autres canaux
  (blocs 1 à 3 ci-dessous), plus leur fiche Plazo, leurs tarifs et leurs reversements.
  **Présentation par Claude (09/10/2026, « pouvoir générer une Présentation pour son parking »)** : sur « Ma fiche »
  (`ListingPage`), « Rédiger avec Claude » (« Améliorer avec Claude » quand le champ a un texte, envoyé en `current`) →
  `POST /internal/listing/description/suggest` (`ListingDescriptionService`, `parking:manage`, `LISTING_DESCRIPTION_MODEL`,
  30 s) ; `domain/listing-description.ts` : `descriptionFacts` (seulement les vraies données : fiche enregistrée, adresse,
  aéroport et Terminal 1 pour LYS, prix de départ de la grille, navettes en service et places, dessertes, rendez-vous du
  retour, voiturier si service ou files), consignes en français (texte brut, 2 à 4 paragraphes, ≤ 1 200 caractères,
  première phrase autonome en 160 caractères pour Google, ni superlatif, ni Terminal 2, ni paiement sur place), et
  `checkDescription` qui écarte (502 `ai_unreliable`, `details.figures`) un chiffre absent des faits ou du texte actuel (en
  chiffres, ou en lettres devant une unité : « dix minutes », `spelledNumbersIn`), le
  Terminal 2 ou plus de 2 000 caractères ; rien n'est enregistré : carte « Proposition de Claude » (« Utiliser ce texte »,
  « Proposer une autre version », « Ignorer »), puis « Enregistrer » ; champ limité à 2 000 caractères avec compteur ;
  textes d'erreur propres à la rédaction (`describeError(err, fr.plazo.writing.errors)`).
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

## Périmètre du MVP : trois blocs (et un quatrième, le contrat et l'état des lieux, demandé le 19/10/2026)

Ne construire QUE ce qui règle la douleur n°1 du client.

1. **Réservations**
   - Saisie manuelle (téléphone, comptoir) + import des réservations des autres canaux
     (06/10/2026 : l'import par copier-coller d'un mail est retiré ; **M-A « synchronisation de la boîte mail »** : adresse de
     réception `Operator.inboundSlug@INBOUND_EMAIL_DOMAIN` **créée avec le loueur** (08/10/2026, « configurée dès le départ » :
     `allocateInboundSlug` à la création, migration `inbound_slug_for_all` pour les loueurs existants, plus de bouton « Activer » ;
     `POST /internal/inbound/address` ne sert plus qu'à « Nouvelle adresse »), règle de transfert dans la messagerie du loueur,
     réception par **Cloudflare Email Routing** et le relais `email-worker/` (08/10/2026, à la place de Brevo, payant ; le relais
     poste chaque mail **brut** (`message/rfc822`, enveloppe en `X-Envelope-From` / `X-Envelope-To`, coupé à 4 Mo) sur `POST /public/inbound/email` avec l'en-tête `X-Inbound-Secret`, et l'API le décode avec `postal-mime` (`domain/inbound-mime.ts` ; 08/10/2026 : les 10 ms de CPU de l'offre Workers Free ne suffisaient pas à décoder une vraie confirmation, « Worker call failed after 3 attempts »)), `InboundEmailService` + `domain/inbound-email.ts`,
     table `inbound_emails`, réservation créée seule si complète (`ReservationService.createFromImport` ; la plaque n'est plus requise, 15/10/2026), sinon page
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
     migré en `handled` ; remplace « Classer sans suite ») et « Archiver » (`POST …/emails/:id/archive`, aussi permis au super admin depuis « Ouvrir son espace » le 10/10/2026, comme tous les gestes de la boîte depuis la règle de consultation du même jour ; → `archived` depuis tout
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
     doublon par la référence externe, sinon même plaque, ou sans plaque même téléphone et même nom, et même arrivée) ; champ requis absent ou confiance plus basse →
     `incomplete` pré-rempli (`missing` : les champs, ou `confidence`) ; modification, annulation ou autre → `unrecognised`,
     rien n'est créé ni modifié (sauf une modification Allopark, appliquée depuis le 10/10/2026, voir plus bas). `InboundEmail.reading` `{ kind, provider, confidence, summary, model }` (migration
     `inbound_reading`), `InboundEmailView.reading` ; boîte de réception : ligne « Lu par Claude : Réservation · confiance 92 % »
     avec le résumé, pastille du genre dans la liste. Sans clé, échec, refus ou délai (30 s) : le mail attend comme avant.
     **Comparateurs du client n°1 (09/10/2026, « forme-toi avec ces modèles »)** : importateurs déterministes `onepark.ts`
     (avis au parking : prénom, nom, portable, début, fin du forfait, montant, modèle, plaque, passagers, vol retour ; le retour
     est la « récupération prévue » quand elle est donnée, sinon la fin du forfait ; **avis court du 20/10/2026** : « Début : ven.
     23 oct. 2026 à 09:00 » en lettres, « Montant résa », nom entier dans « Nom » sans « Prénom » (découpé par `importedNames`),
     « Téléphone », ni numéro ni plaque : importé, doublon par téléphone, nom et arrivée ; fixture `onepark-notification-short.html` ; **récapitulatif du
     jour du 20/10/2026** « Voici le résumé des réservations en cours et à venir » : règle `onepark.summary` (genre « Autre »,
     sans Claude), `parseOneparkSummary` (numéro, nom, immatriculation, arrivée, départ ; pas de téléphone, donc jamais une
     réservation créée à lui seul… jusqu'au 20/10/2026), `ReservationService.completeFromSummary` : chaque séjour complète la réservation Onepark qui a ce
     numéro, sinon la seule sans numéro à la même arrivée locale avec un mot du nom en commun (numéro ajouté, plaque ajoutée
     si elle manque, jamais remplacée), historique `reservation.updated` `source: 'onepark_summary'` ; **« Les créer » (20/10/2026,
     « Non reconnu » sur un récapitulatif de 10 séjours absents)** : un séjour absent et pas encore terminé prend le numéro de la
     seule réservation de la même plaque qui recoupe le séjour (sinon `ambiguous`), ou est créé par `createFromImport` (Onepark,
     numéro, nom, plaque, dates, téléphone `''` à saisir ; `created` du compte rendu, « N créée(s), téléphone à saisir : … ») ;
     **toujours « Traité » (21/10/2026, « Toujours dans Traités, je veux voir les réservations même annulées »)** (issue `handled`),
     le résumé disant ce qui reste : « absent(s) de Plazo : 59… », « plusieurs réservations possibles », « autre plaque dans
     Plazo », « annulée(s) dans Plazo » (numéros seulement) ; une réservation annulée ou non venue est retrouvée comme les
     autres (numéro, nom et arrivée, plaque), signalée (`cancelled` du compte rendu), jamais modifiée ni recréée ; fixture `onepark-summary.txt` ; reconnu à sa mise en page
     même quand ni l'expéditeur ni l'objet ne nomment Onepark, transfert à la main compris (`providerOf`, 20/10/2026 : « ce mail n'a pas
     été reconnu »)), `parkmundo.ts` (référence `PM…`, détails
     du voyage avec vols aller et retour, véhicule et couleur ; montant = « Prix du parking », sans le « Coût de réservation »
     de ParkMundo) `parclick.ts` (arrivée, sortie, référence) et `parkvia.ts` (20/10/2026, « ParkVia - Nouvelle notification de réservation » :
     numéro `PC…`, remise et récupération du véhicule à la seconde, « Total », passagers, nom, « Tel Portable » écrit sans le 0 et suivi
     de l'indicatif entre parenthèses, `parkviaPhone` « 912345678 (351) » → « +351 912345678 », immatriculation ; comparateur `ParkVia`
     dans `inbound-kind.ts` et `KNOWN_COMPARATORS` ; fixture `parkvia-notification.txt`) ; **annulations ParkVia appliquées (21/10/2026, « apprends à traiter les
     annulations ParkVia »)** : l'avis d'annulation de ParkVia (« ParkVia - Cancellation » ou « Notification d'annulation de
     réservation » en objet ou en titre, « Cette réservation a été annulée » dans son texte, numéro `PC…` ; règle
     `parkvia.cancellation`, `isParkViaCancellation` ; les mêmes mots ailleurs ou écrits par celui qui transfère :
     `parkvia.cancellation-wording`, rien d'appliqué) annule la réservation de ce numéro (`ReservationService.applyImportCancellation` :
     même loueur, comparateur ParkVia ou vide, jamais Plazo ; ligne verrouillée et relue ; seulement « Attendu » ; file ou place
     libérée par `statusSideEffects`, note « Annulée par ParkVia (mail d'annulation). », historique `reservation.status_changed`
     `source: 'parkvia_cancellation'`, push « Réservation annulée · ParkVia » à l'audience `bookingChanges`) ; mail rattaché
     (« Annulation appliquée à la réservation … », `InboundEmail.change.kind: 'cancellation'`, ligne « Statut : Attendu → Annulé »),
     déjà annulée → doublon rattaché ; laissée à l'équipe, rien changé (« Annulation à faire à la main ») pour une voiture déjà
     au parking (`already_arrived`), une réservation close, inconnue (`unknown_booking`) ou plusieurs ; fixture
     `parkvia-cancellation.txt` ; un mail reçu avant le 21/10/2026 se traite par « Relancer l'analyse » ; **annulations Onepark
     appliquées (25/10/2026, « mail pas compris »)** : l'avis d'annulation que Onepark envoie au parking (titre « Annulation de la
     réservation #5908369 », « Une réservation Onepark a été annulée sur votre parking », `isOneparkCancellation`, règle
     `onepark.cancellation`, numéro « Numéro de réservation : … ») suit le même chemin que celui de ParkVia (`comparatorCancellation`
     → `applyImportCancellation`, source `onepark_cancellation`, note « Annulée par Onepark (mail d'annulation). ») ; les mêmes mots
     ailleurs ou écrits par celui qui transfère : `onepark.cancellation-wording`, rien d'appliqué ; fixture `onepark-cancellation.txt` ;
     **retrouvée par le voyageur (25/10/2026, l'avis #5908369 « À faire à la main », `unknown_booking` en production : la
     réservation avait été saisie sans le numéro)** : quand aucune réservation ne porte le numéro, `applyImportCancellation` (ParkVia
     et Onepark) cherche la réservation du voyageur que l'avis nomme (champs lus par l'importateur du comparateur : plaque si les
     deux en ont une, sinon téléphone et un mot du nom, `sameTraveller`) arrivant le même jour local, sans référence (ou avec un
     numéro qui ne nomme aucun comparateur), ni annulée ni non venue (`cancellationByTraveller`) : une seule → annulée et le
     numéro lui est ajouté ; plusieurs → `ambiguous` ; aucune → `unknown_booking` ;
     **Park Hit (25/10/2026, « celui ci aussi », puis « pas compris par plazo » avec l'expéditeur `noreply@parkhit.com`)** :
     `importers/parkhit.ts` lit l'avis « Park Hit: Nouvelle réservation F2006A65BCF7 » au parking, une fiche « Clé : valeur » à
     raison d'un champ par ligne terminé par « ; » (Réservation, Prénom, Nom, Type de véhicule, Nombre de voyageurs, Date et
     Heure de dépôt / de récupération, Adresse mail, Téléphone du client, Immatriculation, Coût de la réservation, Commentaires,
     Numéro de vol aller / retour ; `sheetFields`), reconnue à sa mise en page (le corps ne nomme jamais Park Hit : un transfert
     à la main est lu aussi) ou à son expéditeur et son objet (`BRANDS`, `/park\s*hit/`, référence de l'objet) ; comparateur
     « Park Hit » (`PARKHIT_PROVIDER`, `Comparator`, `KNOWN_COMPARATORS`, expéditeur `parkhit` du filtre de transfert, règle
     `parkhit.booking`) ; un vol donné sans compagnie (« 7841 », que `formatFlight` lirait « 78 41 ») n'est jamais pris pour
     un numéro de vol : `ParsedBooking.notes` (« Vol aller indiqué sur la fiche : 7841 (sans compagnie) », « Commentaire du
     client : … ») passe dans les notes de la réservation ; fixture `parkhit-notification.txt`, tests
     `import-comparators.test.ts`, `inbound-rules.test.ts`, en plus d'`allopark.ts` (qui lit aussi la confirmation
     envoyée au voyageur) ; aides `flatten`, `numericDateTime`, `amountAfter`, `PHONE`, `PLATE`, `NOM`, `FLIGHT` dans
     `importers/common.ts` ; `ParsedBooking.vehicleModel/vehicleColour` enregistrés par `createFromImport` ; une annulation ou
     une modification n'est jamais lue comme une réservation (`isCancellationOrChange`) ; un mail reconnu mais incomplet est
     **complété par Claude** (`fillGaps` : les champs de l'importateur restent, Claude remplit les trous ; confiance basse →
     « À vérifier » seulement si Claude a apporté un champ requis ; une plaque incertaine seule est écartée) ; `stripHtml` garde le texte alternatif des images (logos) ;
     consigne de Claude : le montant est le prix du parking, sans les frais de la plateforme. Expéditeurs pour le filtre de
     transfert : `info@allopark.com`, puis les mots `onepark`, `parclick`, `parkmundo` (adresses exactes inconnues ; Gmail
     les reconnaît) ; textes de l'assistant G-B au pluriel (« les expéditeurs des comparateurs »).
     **Page de réservation Allopark (10/10/2026, « il faut naviguer vers [la page] pour récupérer les infos des réservations
     Allopark »)** : les mails Allopark laissent « Vos informations » vides ; quand il manque un champ requis,
     `InboundEmailService` ouvre d'abord la page de la réservation (`AlloparkPageService`, `domain/importers/allopark-page.ts`) :
     le lien « Consulter ma réservation » du mail reconstruit sur `https://www.allopark.com/<langue>/confirmation` avec ses seuls
     `email`, `reference` et `view`, sinon la page (`view=parking`) de chaque destinataire du mail transféré hors adresse Plazo,
     deux au plus ; https d'allopark.com seulement, redirections comprises, 8 s, 1,5 Mo, rien du lien dans les journaux ;
     `parseAlloparkPage` lit le formulaire `edit_reservation` (`date_in` / `date_out`, `people_navette`, plaque, marque + modèle,
     `fly_arrival` = vol aller, `fly_departure` = vol retour, téléphone, prénom, nom, e-mail) d'une page qui nomme bien la
     référence ; la page remplit les trous (le montant reste celui du mail, son prénom et son nom remplacent la salutation),
     puis Claude complète ce qui manque encore.
     **« Relancer l'analyse » (10/10/2026, « pouvoir relancer l'analyse d'un mail », aussi pour le super admin en
     consultation)** : `POST /internal/inbound/emails/:id/reanalyse` (`reservations:manage`, pas de `RefuseInViewAs`, tracé
     `view_as.write`) rejoue la lecture de la réception (`InboundEmailService.analyse` partagé : importateurs, page Allopark,
     Claude, `createFromImport`) sur un mail sans réservation et avec son texte → `{ email, outcome }` (`imported` ·
     `duplicate` · `incomplete` · `unrecognised`) ; 404 `not_found` (autre loueur, confirmation de transfert), 409
     `already_imported`, `text_gone`, `analysis_running` (une relance par mail toutes les 30 s, réservée par `analysedAt`) ;
     un mail traité ou archivé garde son état s'il ne s'importe pas ; une panne de Claude ne fait rien perdre de la lecture
     précédente ; tracé `inbound.reanalysed`. Pour retrouver la page Allopark sans le HTML, `InboundEmail.recipients` (To/Cc
     du mail hors adresse Plazo) et `InboundEmail.links` (liens allopark.com ; sans paramètres hors page de confirmation)
     sont gardés et effacés avec le texte à 30 jours (migration `inbound_reanalysis`) ; les adresses essayées sont les
     destinataires puis l'adresse Gmail qui transfère vers Plazo (`requester` des confirmations de transfert), à la
     réception comme à la relance. Boîte de réception : bouton « Relancer l'analyse » (« Analyse en cours… », toast selon
     le résultat, « Analysé de nouveau le … ») ; **les boutons d'action sont en haut du mail**, dans une barre au-dessus de
     l'objet (« mets les boutons d'action en haut du mail », 10/10/2026).
     **Page Allopark trouvée dans plus de cas (10/10/2026, « tu ne vas pas chercher dans les liens »)** : liens lus dans tout
     le mail avant la coupe des 100 000 caractères (`InboundItem.Links`, `parseRawEmail`) ; sans lien de confirmation, jusqu'à
     3 pages (`MAX_PAGES`, un seul budget de 8 s) aux adresses du parking, dans l'ordre : destinataires du mail, ligne « À : »
     d'un en-tête de transfert, expéditeur d'un transfert à la main, adresse Gmail qui transfère vers Plazo, gérants actifs du
     loueur (jamais Plazo, allopark.com ni un comparateur, `isComparatorAddress`) ; page essayée aussi quand aucun importateur
     n'a reconnu un mail qui nomme Allopark et porte une référence `AL-…` (`alloparkReferenceOf`), jamais pour une annulation,
     une modification ou un remboursement (`isAlloparkCancellationOrChange`, objet compris) ; une réservation complétée par la
     page est relue par Claude quand la clé existe (une modification ou un autre mail n'en prend rien), et sans importateur
     elle n'est importée que si Claude la lit comme réservation sûre, sinon « À traiter ». Journaux sans données personnelles
     (référence, lien ou non, nombre de pages, statut HTTP, chemin sans paramètres, formulaire et référence trouvés).
     **Captcha et prix (10/10/2026, « Prévent captcha, et récupère aussi le prix de la réservation »)** : le prix payé est lu
     dans le bloc `price-payed` de la page (`alloparkPagePrice`) et ne remplit qu'un trou ; une vérification anti-robot
     (Cloudflare `cf-mitigated: challenge`, « Just a moment », Turnstile, reCAPTCHA, hCaptcha ; le script `jsd/main.js` des pages
     normales n'en est pas une) n'est jamais contournée : Plazo s'arrête (de même sur un 429 ou un refus de Cloudflare),
     le mail attend et `InboundEmail.pageLookup` `{ outcome: read | protected | unavailable | not_found, url, at }` (migration
     `inbound_page_lookup`, effacé avec le texte et au rattachement) donne dans la boîte de réception la ligne « Page Allopark :
     … » et le lien « Ouvrir la page Allopark » pour la passer soi-même, puis « Compléter » ou « Relancer l'analyse ».
     **Consultation (10/10/2026, « En consultation, l'équipe, les mots de passe et les paiements du loueur ne se modifient
     pas »)** : `RefuseInViewAs(code?, message?)` ne garde que l'équipe (routes `staff`, renvoi de la confirmation d'e-mail),
     les mots de passe et identifiants (canal SMS), les paiements et les réglages personnels (appareils et préférences de
     notification) ; les mails entrants (traité, rattaché, nouvelle adresse), le « SMS de la veille », le suivi des navettes,
     les dessertes et la fin d'un trajet sont permis et tracés `view_as.write` ; démarrer un trajet ou partager sa position
     reste refusé avec 403 `view_as_not_driver` (le super admin n'est pas chauffeur du loueur). **Canal SMS réglable par le super
     admin (27/10/2026, « le super admin peut configurer les paramètres des SMS »)** : `PUT /internal/sms/settings`, `POST /internal/sms/test`
     et `POST /internal/sms/disable` passent de `RefuseInViewAs` à `RefuseInDemo` (permis en consultation, tracés `view_as.write` ; la
     démo reste refusée) ; la carte « SMS aux voyageurs » de Mon compte est modifiable en consultation, en lecture seule dans la démo
     seulement (`user.demo`, texte « Démo : … »).
     **Son propre loueur n'est pas une consultation (12/10/2026, « je veux pouvoir ajouter des comptes sur le parking de test »)** :
     « Ouvrir son espace » sur le compte de la plateforme (« Plazo (tests) ») donne la session normale du super admin (`config/passport.ts` :
     pas d'`actingAs` quand le loueur ouvert est le sien), avec son rôle et ses droits : équipe, mots de passe et réglages s'y modifient,
     sans bandeau ni trace `view_as.write`.
     **Équipe du compte de la plateforme (13/10/2026, « j'arrive toujours pas à me connecter, fais le nécessaire »)** : quand « Plazo (tests) »
     n'est pas le loueur du super admin connecté (un autre administrateur de `PLATFORM_ADMIN_EMAILS` en est le gérant), la consultation
     garde l'équipe modifiable : `ActingAs.platformAccount` (un administrateur de la plateforme est membre du loueur ouvert, calculé dans
     `config/passport.ts`), `RefuseInViewAsOutsidePlatformAccount` sur l'ajout, la modification et le nouveau mot de passe d'un membre,
     `viewAs.platformAccount` de `/staff/me` pour la page Équipe ; écritures tracées `view_as.write` ; mots de passe et réglages personnels
     restent refusés, et l'équipe d'un client reste en lecture seule.
     **Modifications Allopark appliquées par Plazo (10/10/2026, « C'est une modification » → choix « Appliquer seul »)** :
     un mail Allopark qui annonce une modification faite (objet « Modification… », « modifiée », « changement » ; texte
     « réservation … modifiée », « Vos nouvelles dates : »… ; ou lu par Claude comme modification ; une annulation l'emporte
     toujours et reste sans effet) est confirmé par Claude quand la clé existe, puis la page de la réservation (état actuel) est
     lue : réservation inconnue → créée (`createFromImport`) ; connue → `ReservationService.applyImportChange` compare champ par
     champ (dates locales du parking, personnes, plaque, vols, téléphone, nom, e-mail, véhicule, prix ; `domain/import-change.ts`)
     et applique sous le verrou des places (nuits nouvelles seulement, sans forcer), historique `reservation.updated` avec
     `source: 'allopark_change'`, suivi de vol relancé si un vol change, push « Réservation modifiée · Allopark » (audience
     `bookingChanges` : réglages « immédiat » et « toutes les heures ») ; rien de différent → `duplicate` ; cas risqués non
     appliqués, mail « À faire à la main » avec la raison (`plazo_booking`, `reservation_closed`, `already_arrived` pour une
     arrivée déplacée après l'arrivée — un retour seul est appliqué —, `no_room`, `invalid_stay`) ; page illisible → rien.
     `InboundEmail.change` `{ applied, reason?, reservationId?, reference?, changes: [{ field, from, to }], at }` (migration
     `inbound_change`, effacé avec le texte et au rattachement) ; boîte de réception : bloc « Modification appliquée à la
     réservation … » ou « Modification à faire à la main · réservation … » avec une ligne par changement (« Date de retour :
     13 déc. 20:30 → 15 déc. 18:00 »), pastille « Modification », « À faire à la main » en ambre ; « Relancer l'analyse » →
     résultat `changed`. Les annulations d'Allopark ne sont toujours pas appliquées (celles de ParkVia et d'Onepark le sont, par leur avis propre).
     **Suite (10/10/2026, « Tu n'as pas récupéré le prix pour la modif »)** : un vol qu'un import ne sait pas lire (le voyageur
     a tapé « U2AB3C » chez Allopark) ne bloque plus la réservation : `createFromImport` et `applyImportChange` la créent ou
     la changent sans ce vol (prix compris), le texte part dans les notes (« Vol retour indiqué par Allopark : … (numéro non
     reconnu) », une seule fois ; `domain/imported-flights.ts`), et un vol illisible ne compte jamais comme un changement ; les
     formulaires de l'équipe refusent toujours un vol invalide. Une modification retrouve une réservation saisie à la main sans
     la référence (même loueur, comparateur vide ou Allopark, même plaque, ou sans plaque même téléphone et un mot du nom en commun, séjour qui se recoupe ou même jour d'arrivée, ni
     close ni Plazo) : une seule → la référence lui est ajoutée sous le verrou des places puis la modification s'applique ;
     plusieurs → raison `ambiguous` (« Plusieurs réservations correspondent : à faire à la main », « Ce que Plazo a compris »
     reste affiché, pas de « Compléter »). `alloparkPageUrls` donne le lien du mail puis les pages des adresses du parking
     (3 au plus) : un lien qui mène ailleurs (« gérer ma réservation ») n'arrête plus la recherche. « Compléter » préremplit
     aussi le modèle et la couleur du véhicule.
     **Import sans plaque (15/10/2026, « ne pas planter à l'import quand la plaque est manquante »)** : la plaque n'est plus
     requise pour créer une réservation depuis un mail (`REQUIRED_FOR_IMPORT` sans `plate`) ; Plazo la cherche encore
     (`SOUGHT_FOR_IMPORT` : page Allopark, Claude) sans faire attendre le mail ; une plaque dont Claude doute est écartée (lue à
     l'arrivée) ; « pas de plaque » est enregistré `''` (jamais `null` : apps des stores), affiché « À saisir » dans la plaque
     (`Plate`, `FrenchPlate`) ; une plaque lue doit contenir un chiffre (`importedPlate`, `PLATE` des importateurs : plus de
     « ENTR » ni « MARQUE ») ; doublon sans référence : même plaque, sinon même téléphone et un mot du nom en commun, même
     arrivée (`sameTraveller`) ; une modification Allopark retrouve aussi une réservation sans plaque par le téléphone et un
     mot du nom (`sameTraveller` : jamais la réservation d'un autre voyageur au même téléphone), et la plaque d'une voiture
     déjà arrivée (lue sur la voiture par l'équipe) n'est jamais remplacée par celle du comparateur (`applyImportChange`) ;
     création par l'équipe sans plaque pour le canal comparateur (« Compléter ») ; PATCH `plate` vide ou `null` : inchangé sur
     une réservation sans plaque, 400 `required` sinon (une plaque n'est jamais effacée), et pour faire passer une réservation
     sans plaque au téléphone ou au comptoir (« -- » n'est pas une plaque) ; sans plaque, le planning des places, le plan de
     l'Occupation et l'alerte `blocked_return` nomment le client, les messages disent « Véhicule » / « Le véhicule » (« Voiture »
     dans les files ; web et Plazo Pro), les pushs et les bandeaux d'arrivée de l'équipe et les mails au voyageur n'en disent
     rien (`plateSegment`, pas de ligne « Véhicule ») ; les mails qui n'attendaient que leur
     plaque (7 derniers jours) sont importés par `POST /public/inbound/retry` (`importWaitingForPlate`, `plateOnly`, aucune
     analyse lancée après les 10 premières secondes de l'appel) ; relecture : ce rattrapage et la relance automatique
     Allopark laissent à l'équipe un mail dont elle a saisi la réservation à la main pendant qu'il attendait
     (`ReservationService.typedSince` : réservation créée depuis la réception du mail, même annulée ou non venue depuis, séjour
     qui se recoupe ou même jour d'arrivée, même téléphone ou même nom, autre référence ; plus large que `sameTraveller` exprès,
     puisqu'elle ne fait que laisser le mail « À traiter » ; `typedByHand` dans le compte rendu ; jamais
     pour une modification Allopark, qui retrouve elle-même la réservation saisie), pour ne jamais faire deux réservations de
     la même voiture.
     **Analyse relancée automatiquement (11/10/2026, « Lance l'analyse automatiquement pour allopark »)** : à la réception,
     Allopark montrait parfois « gérer ma réservation » au lieu de la réservation (journaux de production : la même page lue
     18 min plus tard) ; un mail Allopark dont la page n'a pas été lue (`pageLookup` `not_found` ou `unavailable`, jamais
     `protected` ni un refus d'Allopark — 429, blocage de Cloudflare, `refused: true` dans `pageLookup` —, laissés à
     l'équipe comme un captcha) et qui attend encore (« À traiter », sans réservation, texte gardé, reçu depuis moins de 48 h, loueur non
     suspendu) est analysé de nouveau par Plazo lui-même, comme « Relancer l'analyse », 10 min, 30 min, 1 h, 3 h puis 8 h
     après l'essai précédent (`domain/inbound-retry.ts`, `nextAutoRetry`, 5 essais au plus, `InboundEmail.autoRetries`,
     migration `inbound_auto_retries`) : `InboundEmailService.retryAllopark` (même verrou `analysedAt` que la relance,
     3 mails par passage, un nouveau seulement dans les 10 premières secondes, passage arrêté dès qu'Allopark demande une
     vérification ou refuse Plazo ; réservation créée ou modification appliquée
     avec leurs notifications ; tracé `inbound.reanalysed` avec `auto: true`, sans membre de l'équipe ; `rerun` partagé avec
     la relance manuelle), appelé par `POST /public/inbound/retry` (même `X-Inbound-Secret` que les mails) que la minuterie
     du relais `email-worker/` appelle toutes les 10 minutes (`[triggers] crons`, `scheduled()`, `PLAZO_RETRY_URL`) : rien à
     régler ailleurs. Boîte de réception : sous « Page Allopark : … », « Nouvel essai automatique vers 07:10 (2 sur 5) »
     (`autoRetries`, `autoRetryAt` de la vue), puis « Plazo a réessayé 5 fois sans trouver la réservation : ouvrez la page
     Allopark ou relancez l'analyse. ».
     **C puis A « Relier sa boîte mail » (14/10/2026, « propose un [outil] permettant de configurer sa boîte mail pour y ajouter
     une redirection vers l'adresse mail du parking » → maquettes https://claude.ai/artifact/6WPQwd9sn5YHUUNCReZzog, choix « C puis
     A »)** : **C** : le bloc Mails entrants (`InboundEmailCard`) propose d'abord de donner l'adresse Plazo à chaque comparateur
     (adresse de notification de son espace partenaire), une ligne par comparateur (`InboundSettings.comparators`,
     `domain/inbound-comparators.ts` : dernier mail reçu, son état, et comment il arrive : « Directement », « Par votre
     messagerie », « Transféré à la main », « Reçu » (avant le 14/10), « À régler »), « Comment faire » (étapes génériques et
     message prêt à copier pour le comparateur ; les écrans de chaque espace partenaire restent à vérifier avec le client n°1),
     puis « Relier ma boîte mail » pour qui ne le peut pas. `InboundEmail.delivery` (`direct` · `forwarded` · `manual`, migration
     `inbound_delivery`, `domain/inbound-delivery.ts`) : `forwarded` quand une règle de messagerie l'a envoyé (en-têtes
     `X-Forwarded-To/For` de Gmail, `X-MS-Exchange-Inbox-Rules-Loop`, `Resent-*`, `Auto-Submitted: auto-forwarded` : `InboundItem.AutoForwarded`
     lu par `parseRawEmail`) ou que l'adresse Plazo n'est que dans l'enveloppe, `direct` quand elle est dans To/Cc et que
     l'expéditeur est un comparateur, `manual` sinon. **A** : l'assistant (`InboundSetupWizard`) tient sur une page : messagerie
     détectée (`InboundSettings.mailProvider` : Gmail quand Gmail a demandé à transférer, sinon le domaine ou les MX de l'adresse du
     membre (`MailProviderService`, cache d'un jour, 1,5 s au plus, jamais un domaine d'exemple ; en consultation, celle des
     gérants), pastille « Gmail, détecté d'après … » et « Changer »), réglages en blocs cochés par ce que Plazo voit (`progress` :
     code Gmail, mail d'un comparateur arrivé seul, réservation créée), boutons « Ouvrir Gmail · Transfert / Filtres » vers
     `#settings/fwdandpop` et `#settings/filters`, « Ouvrir Outlook » (outlook.live.com et/ou outlook.office.com : les règles
     n'ont pas d'adresse propre), note Google Workspace pour un domaine propre, panneau « Ce que Plazo voit » en direct (5 s) avec
     les derniers mails ; l'aperçu simplifié des écrans de G-B est retiré. **Mails écartés** : un mail envoyé par une règle, d'un
     expéditeur qui n'est pas un comparateur et sans mot de réservation (`looksLikeBooking`) n'est ni lu par Claude ni gardé :
     statut `ignored` sans expéditeur, objet ni texte, jamais listé, effacé à 7 jours ; `unexpected` en compte 7 jours et l'alerte
     « Plazo reçoit aussi vos autres mails » s'affiche dans le bloc et l'assistant (« Désactiver le transfert » pour Gmail).
     **« Analyser sans passer par Claude » (16/10/2026, « trouve un moyen d'analyser sans passer par claude. faire du scrapping par
     type de mail par exemple » ; le matin même le crédit Anthropic était épuisé, « Your credit balance is too low », et chaque
     modification Allopark attendait Claude)** : chaque mail est d'abord classé par des règles fixes par comparateur et type de
     mail (`domain/inbound-kind.ts`, `classifyMail` → `{ provider, kind: booking · change · cancellation · other · unknown,
     reference, rule, sure }`, `rule` dans les journaux), sur le seul message du comparateur (`comparatorMessageOf` : sous l'en-tête
     d'un transfert à la main, « Message transféré » / « De : … Objet : » / « Début du message réexpédié », le mot de celui qui
     transfère à part ; une réponse coupée à sa citation « Le … a écrit : ») ; une annulation l'emporte sur une modification, une
     modification sur une réservation, et le mot de celui qui transfère ne peut que rendre la lecture plus prudente (relecture :
     une demande écrite au-dessus, « je souhaite annuler », « merci de décaler le retour », ou l'objet d'un message qui en
     transfère un autre, « Annulation… » au-dessus de la confirmation, en fait un autre mail `….note` laissé « À traiter »). Table :
     Allopark (référence `AL-…`) : annulation ou remboursement (`isAlloparkCancellation`) ; **modification sûre** = objet ou titre
     « Modification de votre réservation AL-… » et corps du modèle d'Allopark (ligne « AL-… | Parking », « … est confirmée »,
     coupon, « Réservation N° AL-… » ou lien « Consulter ma réservation » de cette référence : le corps d'une modification est mot
     pour mot celui d'une confirmation) ; modification par ses seuls mots (`allopark.change-wording`) ; **réservation sûre** =
     « Confirmation de votre réservation AL-… » et le même corps ; un autre mail Allopark avec référence = réservation à confirmer
     (`allopark.reference`, comme avant) ; Onepark, Parclick, ParkMundo : annulations et modifications par les mêmes mots
     (`TEXT_CANCELLATION`, `TEXT_CHANGE`, `cancellationIn`, `changeIn`, `SUBJECT_CANCELLATION_STRICT` dans `importers/common.ts` ;
     jamais appliquées, sauf l'avis d'annulation propre à Onepark depuis le 25/10/2026, voir plus haut : une annulation Onepark qui garde son tableau n'est plus importée), réservation = mise en page de leur
     lecteur ; une réponse (« Re: », « RE : », « AW: », « SV: ») à propos d'un comparateur = autre mail ; le reste (autre
     comparateur, site du parking, client) = inconnu. Traitement (`InboundEmailService.analyse`) : annulation, autre mail,
     modification hors Allopark → « À traiter » avec leur genre, sans Claude ni page ; modification Allopark sûre → page de la
     réservation puis `applyImportChange` / `createFromImport` sans confirmation de Claude ; modification par ses seuls mots →
     Claude la confirme s'il répond, sinon les règles décident avec deux garde-fous (aucune réservation créée pour une référence
     inconnue : « À traiter » pré-rempli, `missing: ['confidence']` ; une page sans différence reste « À traiter », jamais un
     doublon muet) ; réservation sûre → lecteur (même sans le mot « Allopark » dans le texte, `parseBookingEmail`) puis page,
     importée sans relecture de Claude (la page est celle de la référence que nomme le modèle et `parseAlloparkPage` refuse
     une page qui ne la nomme pas) ; Claude ne complète plus que les champs manquants d'une réservation connue d'Onepark,
     Parclick ou ParkMundo (jamais d'Allopark : son mail n'en dit pas plus que sa page) et lit seul les mails inconnus. La
     lecture des règles est gardée comme celle de Claude (`InboundEmail.reading` avec `source: 'rules'`, `rule`, résumé sans
     donnée personnelle « Modification Allopark de la réservation AL-… » ; sans migration) ; boîte de réception : « Reconnu par
     Plazo : Modification · Allopark » (sans confiance) au lieu de « Lu par Claude », pastille du genre inchangée. **Panne de
     Claude** : `EmailReadingService.read` rend `answered` · `declined` (refus, réponse coupée ou mal formée) · `outage` (cause
     `credit` : 400 « credit balance », 402, `billing_error` ; `auth` : 401, 403 ; `rate_limit` : 429 ; `overloaded` : 529, 5xx ;
     `timeout`, `network`, `other` ; `outageCauseOf` dans `domain/email-reading.ts`) · `unavailable` (sans clé) ; une ligne de
     journal sans le mail (erreur la première fois, puis avertissement ; plus de « Anthropic answered undefined »), dernier appel
     gardé par instance (`lastCall`). Un mail qui n'attend que Claude garde `reading.outage { cause, at }` (vue `readingOutage` :
     « Claude n'a pas pu lire ce mail (crédit Anthropic épuisé) : Plazo le relira dès que la lecture fonctionne de nouveau. »,
     seulement tant que Plazo le relira : « À traiter » et reçu depuis moins de 7 jours ; toast de « Relancer l'analyse » avec
     la cause, jamais « n'est toujours pas reconnu », ni pour un mail reconnu d'un autre genre : « mail reconnu (Annulation),
     rien n'est créé de lui-même », « modification Allopark reconnue, mais la page de la réservation n'a pas pu être lue : rien
     n'a changé ») ; `POST /public/inbound/retry` le relit dès que Claude répond (`retryReading` : reçu depuis moins de 7 jours,
     pour un crédit épuisé tout un week-end, 5 min après son dernier essai, le moins récemment essayé d'abord, 3 par passage,
     verrou `analysedAt`, jamais un mail rattaché ni un mail dont l'équipe a saisi la réservation entre-temps (`typedByHand`,
     et pour toute relecture automatique, d'après ce qu'elle vient de lire : `AnalysisInput.typedSince` → « À traiter »),
     passage arrêté au premier mail que Claude ne lit toujours pas, rien sans clé) ; tableau de bord (web et Plazo Pro) :
     service « Import » « À voir » « Lecture par Claude en panne : crédit Anthropic épuisé » quand un mail qui avait besoin de
     Claude n'a pu être lu dans l'heure (`services.reading { configured, outage }`). Rattrapage : les mails
     restés « À traiter » avant les règles (non reconnus ou lecture incertaine, sans lecture, changement ni page non lue, 7 jours)
     que les règles connaissent sont relus par le même relais (`analyseWaitingForRules`, compté dans `autoRetries`, réponse
     `rules`). Tests : `inbound-kind.test.ts` (table des règles, chaque type de mail, transferts Gmail / Apple Mail / Outlook,
     réponses), `inbound-rules.test.ts` (Claude absent, crédit épuisé ou répondant : mêmes résultats sans l'appeler pour les mails
     connus ; panne, relecture, rattrapage). Restent inconnus : les vrais modèles d'annulation d'Allopark et de modification ou
     d'annulation d'Onepark, Parclick et ParkMundo (lus par leurs mots, jamais appliqués), Allopark en néerlandais ou en anglais.
     **Relecture des mails déjà traités (16/10/2026, « relie les mail deja traité »)** : en dernier, le relais (`POST
     /public/inbound/retry`, `reread`, `InboundEmailService.rereadWithRules`) relit une fois avec les règles les mails de 30
     jours, sans réservation, « À traiter » ou traités (jamais archivés), d'un loueur actif, que `classifyMail` lit comme une
     réservation d'un modèle connu ou une modification Allopark (jamais une annulation, même lue par Claude, ni un mail dont un autre mail du loueur annule la référence `AL-…` / `PM…` sur 90 jours, `cancelledReferences`) ; repère sans
     migration : lecture qui n'est pas celle des règles et pas encore de trace `inbound.reread` (écrite à la prise, une fois
     par mail ; pas une date, pour reprendre aussi un mail que l'équipe a relancé avec l'ancien code avant le déploiement) ; les mails d'une autre relecture lui restent ; réservation créée ou mail rattaché à la réservation
     existante, modification appliquée ou « À faire à la main », un mail traité qui ne s'importe pas garde son état ; jamais
     une réservation du même voyageur saisie à la main, avant la réception du mail comme après (`typedSince` depuis toujours) ni un séjour terminé créé (`linkOnlyIfOverAt` : rattaché, sinon
     `missing` `stay_over`) ; trois par passage, les plus récents d'abord. Formules resserrées (`importers/common.ts`, `saidIn` :
     mots de condition avant, « gratuite » / « possible » après, question) : « Pour toute annulation de votre réservation… »,
     « Toute réservation annulée… », « Si vous avez annulé », « Free cancellation… » (mots de condition dans les six mots avant, un deux-points ouvrant la nouvelle : « Aucune action n'est requise : votre réservation a été annulée » reste une annulation) ne font plus d'une confirmation une
     annulation ou une modification ; tests `inbound-reread.test.ts`, `inbound-kind.test.ts` (`confirmation-conditions.txt`).
   - **« Coller un mail », direction A (29/10/2026, « pouvoir importer en collant le contenu du mail », maquettes
     https://claude.ai/artifact/RJGgDZou8Fy1dMnzCtZGWA ; l'import par copier-coller retiré le 06/10/2026 revient, par la boîte
     de réception)** : bouton « Coller un mail » en tête de la Boîte de réception (`PasteMailDialog` d'`InboundEmailsPage` : objet
     facultatif, texte du mail, « Analyser ce mail », Échap ou clic hors de la fenêtre ferme) → `POST /internal/inbound/emails/paste`
     `{ text, subject? }` (`reservations:manage`, `RefuseInDemo`, permis en consultation ; 400 `text` `required` · `too_short`
     (40 caractères) · `too_long`, 429 `paste_limit` au-delà de 60 par heure et par loueur, 409 `operator_inactive`) :
     `InboundEmailService.paste` lit le texte exactement comme un mail reçu (`analyse` : règles par comparateur, page Allopark par
     les liens du texte, Claude, `createFromImport`, modifications et annulations, doublons), l'expéditeur et l'objet repris des
     lignes « De : » / « Objet : » du texte quand il en a (`pastedSenderOf`, `pastedSubjectOf`), et le garde dans la boîte comme
     les autres (`InboundEmail.delivery` `pasted`, `pastedBy` = prénom de qui l'a collé ; migration `inbound_pasted` ; compté
     « Transféré à la main » dans le tableau des comparateurs, jamais « arrivé seul ») ; tracé `inbound.pasted` ; réponse
     `{ email, outcome }` comme « Relancer l'analyse ». La page ouvre l'onglet du mail et le sélectionne, toast « Réservation …
     créée depuis ce mail. » ou « Mail ajouté à « À traiter »… » ; liste et volet disent « Collé par Joanny ». **Les liens du
     mail aussi (29/10/2026, « faut que tu ailles récupérer les infos dans les liens aussi »)** : le texte copié perd les liens
     (« Consulter ma réservation ») ; le champ garde le HTML que le presse-papiers donne avec le texte (`onPaste`,
     `clipboardData.getData("text/html")`, « N liens du mail récupérés » sous le champ) et l'envoie en `html` (3 Mo au plus, corps
     JSON jusqu'à 4 Mo sur cette route, `INBOUND_PASTE_PATH` dans `app.ts`) : le serveur n'en garde que les liens (`alloparkLinks`),
     pour ouvrir la page de la réservation Allopark comme pour un mail reçu, et lit le HTML seul quand rien d'autre n'est collé.
     Tests `inbound-paste.test.ts`, `InboundEmailsPage.test.tsx`. Web seulement.
   - Page de réservation propre à l'opérateur (formulaire simple, confirmation par mail/SMS).
   - Vue planning : arrivées et retours du jour, taux d'occupation, alerte de surréservation
     calculée sur la capacité réelle.
   - Fiche réservation : client, téléphone, plaque, dates/heures, n° de vol retour, nb de passagers, statut.
   - **Planning prévisionnel, direction A « Calendrier par mois » (28/10/2026, « un calendrier/planning prévisionnel affichable
     sur 1 semaine à 3 mois », maquettes https://claude.ai/artifact/VDdfnQyG8f56DMPVa4FPFF)** : pilules « Jour · Prévisionnel »
     (`PlanningTabs`) en tête du menu Planning ; page `/pro/planning/previsionnel` (`ForecastPage`, `lib/forecast.ts`) : Semaine
     (du lundi) · Mois (civil, par défaut) · 3 mois (`?vue=semaine|3mois`, `?date=`), ‹ période ›, grilles du lundi au dimanche ;
     chaque jour : ↑ arrivées (vert), ↓ départs (indigo), jauge des voitures garées la nuit (pâle sous 70 %, citron, ambre au-dessus
     de 85 %, rouge « Complet » ou « Complet +N » avec la case teintée), aujourd'hui cerclé de citron, jours passés estompés ; un clic
     ouvre le planning du jour (`/planning?date=`) ; ligne « N arrivées · N départs », nuit la plus chargée, nuits complètes ; trois
     mois côte à côte dès `xl`, l'un sous l'autre plus étroit. Serveur : `GET /internal/planning/forecast?from=&days=`
     (`ReservationService.forecast`, `reservations:view`, 1 à 92 jours, 31 par défaut) → `{ today, timezone, from, to,
     bookableCapacity, days: [{ date, arrivals, returns, parked, bookable, free, overbooked }] }` : réservations enregistrées, tous
     canaux, sans annulées, non venues ni attentes de paiement, jour local du parking ; nuits par `CapacityService.nights` (capacité
     réelle, marge comprise) ; aucune prévision inventée. Tests `planning-forecast.test.ts`,
     `forecast.test.ts`, `ForecastPage.test.tsx`. **Dans Plazo Pro (28/10/2026, « Ajoute-le aussi dans Plazo Pro »)** : bouton
     calendrier `date-forecast` au bout de la barre de date du planning (`PlanningDateBar.onForecast`) → page `/pro/previsionnel`
     (`features/pro_forecast` : `ProForecastPage`, `ForecastDataSource` par Dio sans freezed, `domain/forecast_period.dart` = les
     règles de `lib/forecast.ts`) : pilules Semaine · Mois · 3 mois, ‹ période ›, légende, résumé, grilles du lundi au dimanche (trois
     mois l'un sous l'autre), la semaine en lignes ; toucher un jour revient au planning de ce jour. `ProTodayView.clock` (horloge
     fixe des tests : `planning_list_test.dart` datait la barre au vrai jour). Test `forecast_test.dart`.
   - **Le planning avance avec la journée (30/10/2026, « au fil de la journée il faut que le planning avance pour qu'on sache le
     prochain départ et retour », maquettes https://claude.ai/artifact/DTyWFj3Fj4f99fNRA2yw1v, choix « A mobile et B web », puis « finalement la A pour le web aussi »)** :
     aujourd'hui seulement ; fait = arrivée dont le client est venu, départ rendu au parking ou clos (la règle de « Déjà passés »).
     Deux cartes « Prochaine arrivée » (vert) et « Prochain départ » (indigo) : heure, client, « dans 25 min » / « dans 1 h 05 » /
     « maintenant » / « en retard · 10 min » en ambre, un clic ouvre la fiche, « Plus de départ aujourd'hui. » quand tout est fait ;
     elles passent seules au suivant (horloge de 5 s, liste relue). **Plazo Pro** : au-dessus de la liste du jour (`_NextCards`,
     `nextOf`, `untilLabel` de `pro_today_page.dart`, clé `planning-next`). **Web** : au-dessus des deux colonnes, chacune sur la
     sienne (`NextCard` de `PlanningPage.tsx`, `lib/planning-now.ts` : `nextOf`, `splitAtNow`, `untilLabel`), et ce qui est fait
     replié en tête de chaque colonne sous « Déjà passés · N » (`past-arrival`, `past-return`). Tests `planning_list_test.dart`, `PlanningPage.test.tsx`.
   - **Import d'anciennes réservations (28/10/2026, « je veux importer des anciennes réservations dans plazo et avoir un aperçu
     avant de valider », direction A « Tout sur une page » des maquettes https://claude.ai/artifact/Fzieue7HmuASJQUqWrq1ao, « avec
     les réservations à venir aussi »)** : Réservations › « Importer » (gérants, `parking:manage`) → `/pro/reservations/importer`
     (`ImportReservationsPage`) : un fichier Excel `.xlsx` (lu dans le navigateur sans bibliothèque, `lib/xlsx.ts` :
     `DecompressionStream` + `DOMParser`, choix de la feuille) ou CSV (`parseCsvCells`), colonnes reconnues par leur titre
     (`lib/booking-import.ts`, `guessMapping` : « Nom client », « Tél », « Immat », « Date dépôt », « Date retour », « Prix TTC »,
     « Source », « N° résa »…) et corrigées sur place, puis l'aperçu de chaque ligne par le serveur (pilules À créer · À vérifier ·
     Déjà dans Plazo · Erreur avec la raison) et « Importer N réservations » (confirmé). Serveur : `POST /internal/reservations/import`
     `{ rows, fileName, dryRun }` (2 000 lignes au plus, JSON jusqu'à 4 Mo sur cette route), `domain/booking-import.ts` lit chaque
     cellule (dates françaises, ISO, en lettres ou numéro de série Excel ; heure à part ou non, 08:00 et 18:00 par défaut ; prix
     « 54,00 € » ; mobile sans son 0 ; canal : comparateur connu, téléphone, comptoir, site, autre nom = comparateur, vide = Import ;
     statut « Annulée » / « Non venu » du fichier, sinon Rendu, Sur place ou Attendu d'après les dates) ; `BookingImportService` :
     doublon = même référence, sinon même voyageur (`sameTraveller`) le même jour d'arrivée, dans Plazo ou plus haut dans le fichier ;
     une nuit à venir déjà complète importe la ligne en « À vérifier » (`overbooked`) ; l'import refait tout sous le verrou des places
     et crée d'un coup (`createManyAndReturn`) sans push, SMS ni mail (SMS de la veille en « Ne pas envoyer », messages d'un séjour
     commencé comptés envoyés, récapitulatif horaire sans les imports), `createdAt` = « Réservée le » du fichier, sinon l'arrivée
     d'un séjour commencé, sinon l'import. Table `reservation_imports` et `Reservation.importId` (migration `reservation_imports`) ;
     `GET /internal/reservations/imports` (10 derniers) et « Retirer cet import » `POST …/imports/:id/undo` pendant 24 h : supprime
     les réservations de l'import que personne n'a touchées (aucune trace après l'import, ni trajet, mail, contrat, état des lieux,
     service ou SMS), garde les autres (`{ removed, kept }`, 409 `already_undone` / `undo_expired`). **Fichier américain et « Canal » (29/10/2026, d'après le fichier de réservations de Joanny)** : l'ordre des dates numériques
     est lu sur tout le fichier (`dateOrderOf` : mois d'abord seulement si une date ne peut être que « 11/20/2026 » et aucune
     « 20/11/2026 », `parseImportDate(raw, order)`), rendu en `dateOrder` et dit dans l'aperçu (« Dates lues au format
     mois/jour/année… ») ; « Canal », « Comparateur » ou « Plateforme » passent avant « Source », « Origine » ou « Provenance »
     pour le canal (règles `weak` de `guessMapping`). **Service et commission (29/10/2026, « Service à l'import, Commission à l'import »)** : colonne « Service » / « Prise en charge » → `handover` (`importedHandover` : « Voiturier », « valet », « terminal » = voiturier ; vide, « Parking », « Navette » = navette ; autre mot = navette et avertissement `handover_unreadable`) ; colonne « Commission » / « Commission (€) » → `commissionOverrideCents`, l'exception de commission de la réservation, gardée seulement pour un comparateur ou un import sans canal (CHECK `reservations_commission_override`), illisible = taux du comparateur et `commission_unreadable`. **Moyen de paiement, direction A « Payé par » (29/10/2026, « il manque des champs dans plazo comme le prix, le moyen de paiement », maquettes https://claude.ai/artifact/FdVFpLj4GEZjgNpnLqj1Co)** : `Reservation.paymentMethod` (enum `PaymentMethod` card · cash · cheque · transfer · holiday_vouchers · comparator, nul = non précisé ; migration `payment_method`, CHECK : jamais sur une réservation Plazo) ; `domain/payment-method.ts` (`paidBy` : `online` « En ligne sur Plazo » pour le canal `plazo`, jamais enregistré ; `importedPaymentMethod` : « CB », « Liquide », « ANCV », « Prépayé » ou le nom d'un comparateur…) ; `POST/PATCH /internal/reservations` et `PUT …/price` acceptent `paymentMethod` (absent = inchangé, nul = non précisé ; 400 `price_locked` sur une réservation Plazo) ; `GET /internal/revenue` rend `byPaymentMethod [{ method, count, totalCents }]` (« non précisé » en dernier), CSV avec « Payé par » ; import : colonne « Paiement » / « Mode de règlement » → `payment`, mot inconnu = vide et `payment_unreadable`. Web : pastilles « Payé par » sous le prix du formulaire (un second clic retire le choix), pastille sur la ligne « Prix payé » de la fiche, moyen sous le prix dans la liste (gérants), carte « Par moyen de paiement » du Chiffre d'affaires. Plazo Pro ne l'a pas encore. **Retirer un import à tout moment (29/10/2026, « marque tous les imports faits par fichier pour que l'on puisse revenir en arrière »)** : plus de limite de 24 h (`undo_expired` n'est plus renvoyé ; `GET …/imports` rend les 50 derniers avec `undoable`), la règle reste : seules les réservations que personne n'a touchées depuis partent ; chaque réservation importée dit son fichier (`GET /internal/reservations/:id` › `import { id, fileName, createdAt, undoneAt }`, ligne « Importée · « planning.xlsx » le … » de la fiche avec « Voir les imports » pour les gérants). **Recherche par nom sans accents (29/10/2026, « je ne retrouve pas la réservation en saisissant le nom »)** : `ReservationService.idsByName` (chaque mot tapé, accents et casse ignorés par `translate(lower(…))`, dans n'importe quel ordre : « gwenael » trouve « Gwénaël », « dupont jean » « Jean Dupont ») et le numéro du comparateur (`externalReference`). **E-mail, vol ou train, destination et prise en charge (29/10/2026, « il manque le champ email, vol / train, destination », « prise en charge (Parking ou voiturier) n'est pas reconnu »)** : titres reconnus en plus : « E-mail client », « Vol », « Train », « Vol / Train », « N° de vol » (→ vol retour, celui que la navette attend), « Destination », « Desserte », « Gare », « Lieu de dépose » (→ `destination`), « Prise en charge (Parking ou voiturier) » (les mots entre parenthèses suivent) ; un train (« TGV 6612 », « Ouigo », « TER »…, `TRAIN`) n'est jamais lu comme un vol : il part dans les notes sans avertissement ; `withDestinations` met la desserte du parking dont le nom correspond (accents et casse ignorés) dans `stopId`, laisse l'aéroport par défaut (« Aéroport », « Terminal », « Saint-Exupéry »), et met toute autre destination dans les notes (« Destination indiquée dans le fichier : Lisbonne ») ; une réservation voiturier n'a pas de desserte ; une valeur de service qui contient « parking » ou « navette » vaut navette. **E-mail du voyageur, jamais celui du comparateur (29/10/2026, « récupère le mail du passager au lieu de celui du comparateur »)** :
     `domain/traveller-email.ts` (`travellerEmail` : écarte une adresse d'un domaine de comparateur ou de plateforme, allopark, onepark,
     parkvia, parkmundo, parclick, parkhit, parkos, zenpark…, une adresse de robot, noreply, ne-pas-repondre, notification…, et
     l'adresse Plazo du parking ; `travellerEmailIn` : la première adresse « E-mail : » du texte qui est celle du voyageur) sert à
     l'import d'un fichier (colonne E-mail laissée vide avec l'avertissement `email_not_traveller`), aux importateurs des mails, à la
     page Allopark, à la lecture par Claude, à `createFromImport` et aux modifications (`importChanges` ne remplace jamais l'e-mail
     par celui du comparateur) ; test `traveller-email.test.ts`. Tests `booking-import.test.ts`
     (serveur et web), `ImportReservationsPage.test.tsx`. Web seulement.
   - **Prix modifiable après l'import d'un mail (10/10/2026, « Pouvoir modifier le prix après l'intégration du mail »)** :
     champ « Prix payé » (euros, « Ce que paie le client, sans les frais du comparateur. ») dans le formulaire de réservation
     web (création, « Compléter » d'un mail prérempli avec le montant lu, « Modifier ») et dans celui de Plazo Pro ; à la
     modification il ne part que s'il a changé (`null` s'il est vidé) ; `UpdateReservationDto.priceCents` (centimes, `null`
     efface, tracé dans `reservation.updated`) ; jamais le prix d'une réservation payée sur Plazo (`isPriceLocked` de
     `domain/reservation.ts` : canal `plazo`, paiement ou montant encaissé ; 400 `price_locked`, champ en lecture seule « Payé
     en ligne sur Plazo : le prix ne se modifie pas. ») ; fiche web : « Modifier le prix » / « Ajouter le prix » sur la ligne
     « Prix payé » (`PriceLine`, `PUT /internal/reservations/:id/price`, aussi après le séjour, pas une réservation annulée) ;
     montant invalide → « Montant invalide (ex. 45,50). » sans appel. Relecture : `Reservation.importedPriceCents` (migration
     `reservation_imported_price`, reprise du prix des réservations importées) garde le dernier montant du comparateur
     (`createFromImport`, `applyImportChange`, et `importedPriceCents` envoyé par « Compléter ») : une modification Allopark ne
     touche le prix que si le montant d'Allopark a changé (`importChanges`), un prix corrigé par l'équipe reste le sien.
   - **« Mails liés » d'une réservation (27/10/2026, « pouvoir retrouver le mail qui a permis de créer la réservation », direction C
     des maquettes https://claude.ai/artifact/DKEMgx5YaEnganwdmnqfnx)** : `GET /internal/reservations/:id/emails`
     (`InboundEmailService.forReservation`, `reservations:manage`, 404 pour la réservation d'un autre loueur) rend, du plus ancien au
     plus récent, les mails rattachés à la réservation et ceux d'une modification ou d'une annulation lue contre elle, même laissée à
     l'équipe (`change.reservationId`), jamais une confirmation de transfert ni un mail écarté ; chacun avec la vue de la boîte de
     réception, `role` (`created` : le premier reçu avant la création de la réservation, hors modification ; `change`, `cancellation`,
     `duplicate`, `linked`) et `inboxView` (l'onglet qui le liste encore, nul après les 30 jours des Traités ou les 90 des Archivés).
     « Compléter » (`attach`) garde désormais le texte du mail jusqu'à la purge des 30 jours, comme un import automatique (il
     l'effaçait au rattachement). Web : bloc « Mails liés · N » de la fiche réservation (`LinkedEmails`, après le contrat, caché sans
     mail et pour les rôles sans boîte de réception), pastilles « À l'origine · Modification · Annulation · Doublon · Rattaché »,
     « Voir › » ouvre un tiroir (`role="dialog"`, Échap ou clic hors du tiroir) : rôle et état, objet, expéditeur, date, « Reconnu »,
     lecture, texte (`MailBody`) ou « Texte effacé 30 jours après la réception. », bloc de la modification (`ChangeBlock`) ou « Ce que
     Plazo a compris » (`Understood`), puis « Ouvrir dans la Boîte de réception » vers `/reservations/a-verifier?vue=<onglet>&mail=<id>`
     (la boîte s'ouvre désormais sur l'onglet `?vue=`) ou « Ce mail n'est plus listé dans la Boîte de réception. ». Plazo Pro : même
     bloc sur la fiche réservation (`LinkedEmailsCard`, `LinkedEmailsDataSource` par Dio sans freezed), feuille du mail (texte
     sélectionnable, résumé, une ligne par changement « Date de retour : … → … »). Tests `reservation-emails.test.ts`,
     `LinkedEmails.test.tsx`, `InboundEmailsPage.test.tsx`, `linked_emails_card_test.dart`.
   - **Historique d'une réservation, direction A (30/10/2026, « avoir un historique des actions et de l'auteur sur les
     réservations », maquettes https://claude.ai/artifact/RwN9LbUC1vB2W2EvwYXkRJ)** : `GET /internal/reservations/:id/history`
     (`ReservationHistoryService`, `reservations:view`, 404 pour un autre loueur, 300 entrées au plus) lit le journal `audit_logs`
     de la réservation (passé compris) et le rend lisible (`domain/reservation-history.ts`) : du plus récent au plus ancien, chaque
     action avec son auteur (`staff` : prénom et photo ; `traveller` : `by: 'traveller'`, signaux d'arrivée, création sur Plazo ;
     `comparator` : `provider`, `source` « parkvia_cancellation »… ou le comparateur de la réservation pour un mail ; `system` :
     Plazo, « (consultation) » pour le super admin), son groupe (`status` · `change` · `message` · `other`), les champs changés
     avant → après (liste blanche `SHOWN_FIELDS`, dates à l'heure du parking, euros, libellés ; jamais les colonnes techniques) et
     les seuls détails utiles (`info`) ; une modification sans champ montré est omise. Web : bloc « Historique · N actions » en bas
     de la fiche réservation (`ReservationHistory` : pilules Tout · États · Modifications · Messages, jours « Aujourd'hui », « Hier »,
     date, photo ou initiales du membre, pastilles d'état, « Voir les N plus anciennes » après 15). Plazo Pro ne l'a pas encore.
     Tests `reservation-history.test.ts`, `ReservationHistory.test.tsx`.
   - **Listes chronologiques (10/10/2026, « Les réservations doivent être affichées de manière chronologique »)** : la liste
     Réservations (web `/pro/reservations`, app Plazo Pro) et Plateforme › Réservations vont par date d'arrivée, la plus
     ancienne d'abord (puis `id`) ; sans recherche (ni filtre de dates pour la plateforme), la page 1 commence à la première
     arrivée d'aujourd'hui (jour local du parking, Europe/Paris pour la plateforme) et les pages 0, -1… remontent le temps
     (`domain/chronological-pages.ts`, `chronologicalPage` ; réponse `page`, `pageNumber` pour « Page 3 / 4 », `totalPages`,
     `hasPrevPage`) ; une recherche liste tout depuis la plus ancienne. Web : ligne « Par date d'arrivée, à partir
     d'aujourd'hui » (« avant aujourd'hui » sur les pages d'avant), « Précédent » remonte ; app : bouton « Réservations
     précédentes » en tête de liste, une réservation créée dans l'app prend sa place par arrivée.
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
     **Pour une réservation donnée, choix A (30/10/2026, « pouvoir envoyer un sms de la veille à une réservation donnée »)** : bloc
     « SMS de la veille » de la fiche réservation web (`BookingReminderCard`, `reservations:manage` : « Prévu ce soir à 18:00 »,
     « Envoyé demain à 10:00 », ou l'état de la page SMS de la veille ; « Envoyer maintenant », puis « Renvoyer le SMS » avec
     confirmation ; caché une fois la voiture déposée sans SMS) ; `GET /internal/reservations/:id/reminder` (`status`, `at`, `sentAt`,
     `resend`, `canSend`, `refusal`) et `POST …/reminder/send` (`ReminderService.forReservation` / `sendOne`) : le premier envoi fait tout
     le rappel (SMS, mail, push) même si la réservation est « Ne pas envoyer », un renvoi n'envoie que le SMS, 10 minutes au moins après
     le dernier (`RESEND_AFTER_MS`, réservation par `reminderSentAt`) ; 409 `reminder_not_upcoming` (pas « Attendu » ou dépôt passé),
     `reminder_no_mobile`, `reminder_no_channel`, `reminder_quiet_hours` (22:00 à 07:00), `reminder_too_soon` ; tracé `sms.reminder_sent`
     (« a envoyé le SMS de la veille » dans l'Historique). Tests `reminders.test.ts`, `BookingReminderCard.test.tsx`.
   - **Importateurs des comparateurs (09/10/2026, d'après cinq mails de Joanny)** : Allopark, Onepark, Parclick et ParkMundo
     lus sans Claude (`domain/importers/*`, `detect` / `parse` sur le texte aplati, `common.ts` ; montant = ce que paie le
     client, hors frais du comparateur ; modèle et couleur du véhicule ; une plaque doit contenir un chiffre, 15/10/2026) ; Claude ne complète que les champs manquants d'un mail
     reconnu (`fillGaps`) ; un mail d'annulation ou de modification n'est jamais importé (`isCancellationOrChange`).
   - **CA-B + CA-A « Chiffre d'affaires » (09/10/2026, « additionner le CA des réservations »)** : page `/pro/chiffre-affaires`
     (gérants, permission `revenue:view` ; `RevenuePage.tsx`) : périodes Aujourd'hui · 7 jours · mois en cours · mois précédent ·
     Dates…, « Compter par » jour d'arrivée (par défaut) ou jour de réservation, annulées exclues (non venus comptés) ; total,
     réservations, panier moyen et durée moyenne, « Par canal » (les comparateurs par leur nom), « N sans montant » avec la
     liste « Les compléter » (saisie du montant, `PUT /internal/reservations/:id/price`, 400 `validation_failed` avec
     `fields.priceCents` = `price_locked` pour une réservation Plazo, 400 `reservation_closed` si annulée ; tracé dans
     l'historique), « Jour par jour » et « Exporter en CSV »
     (« ; », UTF-8 avec BOM). Tuile CA-A en bas des tuiles du tableau de bord (`RevenueTile`, gérants : total du mois,
     aujourd'hui, 7 jours, « N sans montant »). Serveur : `domain/revenue.ts` (calcul pur, jour local du parking),
     `RevenueService`, `GET /internal/revenue?from=&to=&basis=`, `…/revenue/summary`, `…/revenue/export` (366 jours au plus).
     **Dans Plazo Pro (13/10/2026, « Dans l'appli le gérant doit avoir le chiffre d'affaire », choix « Tuile T-A + page P-B »)** :
     feature `pro_revenue`, gérants seulement (`revenue:view` dans `core/helpers/roles.dart`) ; **T-A** carte pleine largeur sous
     les cinq tuiles du tableau de bord (`RevenueTile`, « CHIFFRE D'AFFAIRES · OCTOBRE », total du mois, Aujourd'hui, 7 jours,
     pastille ambre « N sans montant » ; `RevenueSummaryBloc` fourni paresseusement par `ProTodayPage`, donc jamais demandé pour
     un autre rôle, relu toutes les 5 min, au tirer-pour-rafraîchir et au retour de la page ; cachée tant que rien n'est lu) ;
     **P-B** page `/pro/chiffre-affaires` (aussi Plus › « Chiffre d'affaires ») : bande vert foncé avec Jour · Semaine · Mois
     (semaine du lundi au dimanche), ‹ période ›, total en citron, « N réservation(s) · panier moyen … · … jours » ; carte « Par
     jour d'arrivée » / « Par jour de réservation » (bascule, barres à l'échelle : aujourd'hui citron, passé vert foncé, jours à
     venir pâles, toucher ou glisser pour lire un jour, sinon « Meilleur jour ») ; ligne « À compléter » vers l'écran
     `/pro/chiffre-affaires/a-completer` (les 50 plus récentes sans montant, plaque, montant en euros, « Enregistrer », erreurs
     `price_locked`, `reservation_closed`, montant invalide ; la ligne part et le chiffre est relu) ; « Par canal ». Les dates
     sont celles du parking : `GET /internal/revenue` renvoie aussi `today` (date locale du parking) et `missing[].plate` ; la
     page ouvre sur le mois du téléphone et se recale sur `today` s'il n'y est pas (`domain/revenue_period.dart`,
     `ProRevenueBloc` : seule la dernière lecture lancée s'applique, un montant enregistré relit la carte du tableau de bord par
     `RevenueRepository.changes`, quel que soit le chemin d'ouverture). L'export CSV reste sur le web.
   - **Commission des comparateurs (19/10/2026, « pouvoir paramétrer le taux de commission de chaque comparateur », choix « les 3 »
     des maquettes https://claude.ai/artifact/KSy3XYBvdx9aHTquZXqd6J)** : table `comparator_commissions` (migration
     `comparator_commission` : par loueur et comparateur, `comparatorKey` = nom en minuscules comme `channelDetail`, `label`,
     `rateBp` 0 à 10 000, `fixedCents` 0 à 1 000 €, `effectiveFrom` jour local « AAAA-MM-JJ », unique par jour) et l'exception d'une
     réservation `Reservation.commissionOverrideBp` / `commissionOverrideCents` (l'un ou l'autre, comparateur seulement, CHECK) ;
     `domain/comparator-commission.ts` (`commissionOf` : l'exception, sinon le taux en vigueur le jour où la réservation a été faite,
     arrondi au centime + frais fixes, jamais plus que le prix ; un taux posé plus tard ne bouge jamais les réservations d'avant ;
     sans taux, rien de retenu), `CommissionService`. Routes (gérants, `revenue:view`) : `GET/PUT /internal/comparators/commissions`
     (les quatre comparateurs connus, chaque nom des réservations et chaque taux posé ; en vigueur, à venir, historique, réservations
     du mois), `DELETE …/commissions/:key/:effectiveFrom`, `PUT /internal/reservations/:id/commission` `{ rateBp | amountCents | rien }`
     (400 `not_comparator`, `rate_or_amount`) ; écritures tracées. **B** : bloc « Ce que chaque comparateur vous prend » de Parking ›
     Réglages (`ComparatorCommissionCard` : pourcentage, frais par réservation, « À partir du », « Retirer » un taux à venir,
     exemple de calcul). **A** : « Chiffre d'affaires » : bascule « Brut · Net de commissions », colonnes Commission (taux modifiable
     sur la ligne du comparateur, posé à partir du premier jour affiché) et Net ; `GET /internal/revenue` rend `commissionCents`,
     `netCents` (total, canaux, jours), `byChannel[].comparatorKey/rate` ; la ligne Plazo déduit la commission de la plateforme
     (`Reservation.commissionCents`) ; CSV avec « Commission (€) » et « Net (€) » ; `summary.month.netCents`. **C** : fiche réservation
     « Commission Allopark − 9,72 € · 18 % · Vous gardez 44,28 € », « Changer pour cette réservation » (taux ou montant), « Revenir au
     taux du comparateur » ; liste des réservations : prix et « garde … » sous chaque réservation de comparateur. `commission` est
     servi aux gérants seulement (null pour les autres rôles) sur `GET /internal/reservations/:id` et la liste. Plazo Pro ne montre
     pas encore le net. **Masquer le CA (27/10/2026, « pouvoir masquer le
     chiffre d'affaires pour le super admin de la plateforme »)** : bouton « Masquer le CA » / « Afficher le CA » (œil, `RevenueMaskToggle`)
     dans la barre haute de l'espace pro pour le super admin seulement (`isPlatformAdmin`, dans son espace comme en consultation) ; choix
     gardé dans le navigateur (`plazo:revenue-hidden`, `lib/revenue-mask.ts`, `useRevenueHidden`) : la tuile du tableau de bord devient
     « Chiffre d'affaires masqué · Afficher le CA » (`kpi-revenue-hidden`) et la page Chiffre d'affaires une carte « Chiffre d'affaires
     masqué » avec « Afficher le chiffre d'affaires », sans rien demander à l'API ; les autres membres ne voient pas le bouton et gardent
     leurs chiffres. **Tableau de bord (20/10/2026, « mets en avant les commissions », choix A des maquettes
     https://claude.ai/artifact/MsqXE6C4ZsDwZppBbPCMkD)** : la tuile `RevenueTile` dit « Encaissé par les clients − Commissions (N % du
     chiffre) = Vous gardez », puis une pastille par canal qui a retenu (« Allopark 18 % · −612,00 € », « Plazo · −240,00 € ») et
     « Parclick : taux à régler » en ambre pour un comparateur sans taux ; `GET /internal/revenue/summary` rend `month.commissionCents`
     et `commissions[] { label, comparatorKey, rateBp, amountCents, count, missingRate }` (`RevenueService.commissionLines`).
   - **Réservations sans prix (21/10/2026, « Mets en évidence les réservations sans prix », choix A + C des maquettes
     https://claude.ai/artifact/52eBik9pMeUsVmUfg9KD2o)** : sans prix = pas annulée et `priceCents` nul, quelle que soit la date
     (`ReservationService.noPriceWhere`), gérants seulement (`revenue:view`). **A** : liste Réservations, ligne teintée ambre avec
     « + Prix à saisir » qui ouvre le champ sur la ligne (`QuickPrice`, `PUT …/price` ; « Payé sur Plazo » pour un paiement en ligne),
     pilules « Toutes · Sans prix · N » (`?sansprix=1` ; API `GET /internal/reservations?noPrice=1`, `noPriceCount` nul pour les
     autres rôles). **C** : tableau de bord, alerte « À faire » `price_missing` (« N réservations · le chiffre d'affaires est
     incomplet », vers le filtre), sous-titre de la tuile « À traiter » « · N sans prix », carte « Les compléter · N » avec les trois
     plus proches d'aujourd'hui à saisir sur place (`Dashboard.noPrice { count, next }`, `ReservationService.noPrice`). Plazo Pro :
     libellé de l'alerte seulement.
   - **Services additionnels (21/10/2026, nommés « Services pour la voiture » jusqu'au renommage du même jour, « pouvoir demander un service lavage intérieur et shampouineuse, 50 € ; recharge
     hybride, 15 € ; recharge électrique, 30 € via Plazo même après avoir déposé son véhicule », direction A des maquettes
     https://claude.ai/artifact/AydgcS9sKMY5LWRHAb5LH1, « oui à tout », app Plazo seulement)** : chaque parking active ses
     services et ses prix (`parking_extras`, `kind` `interior_wash` · `hybrid_charge` · `ev_charge`, 1 € à 1 000 €, rien de
     proposé tant que le gérant ne l'active pas, prix par défaut 50 / 15 / 30 €) et le délai `Parking.extrasLeadHours` (24 h,
     0 à 168) ; `domain/extras.ts` (`orderRefusal` : réservation Plazo payée, statut à venir, sur place ou parti en navette,
     avant le délai, une commande active par service, une seule recharge) ; `ExtraService`. Le voyageur commande dans Plazo
     (carte « Services additionnels » de Ma réservation, feuille de paiement Stripe ; `GET/POST /public/bookings/:ref/extras`,
     `…/:id/sync`, `DELETE …/:id`) ou avec la réservation (`extras` de `POST /public/bookings`, payé dans le même paiement :
     `Reservation.extrasChargedCents` en plus de `chargedCents`, `PublicBooking.extrasCents`, mails « dont N € de services ») ;
     chaque commande `reservation_extras` (migration `reservation_extras` : nom et montants figés, commission Plazo au taux du
     loueur, `withBooking` ou son propre PaymentIntent `metadata.extraId`, index unique partiel par service actif) passe
     `pending_payment` → `ordered` → `done` (« Fait », push au voyageur) ou `refused` (« Pas possible », remboursé ; partiel sur le
     paiement de la réservation si `withBooking`) ; `refunded` quand la réservation est annulée et remboursée, ou par la passe de
     15 minutes (`remind-tomorrow` → `settle`) pour un service encore à faire sur une réservation rendue, annulée ou non venue ;
     feuille abandonnée → `expired` (un paiement tardif est remboursé). Push « Service commandé » à l'équipe (audience
     `bookingChanges`), alerte `extras_due` du tableau de bord (retour dans les 36 h, « à surveiller » à 6 h). Reversement de
     la part du loueur à la date de la réservation, une fois fait (`ExtraService.runPayouts` dans `cron/payouts`). Équipe :
     `GET/PUT /internal/parkings/:id/extras` (gérants), `GET /internal/reservations/:id/extras`, `POST …/:extraId/done|refuse`.
     Espace pro web : carte « Services additionnels » de Parking › Réglages, bloc « Services commandés » de la fiche et de la
     fiche opérationnelle ; Plazo Pro : même bloc sur la fiche, réglages dans Plus › Réglages. Conditions générales (article 11).
     Le chiffre d'affaires ne compte pas encore les services.
     **« Services à faire », A + C (29/10/2026, « une vue des services additionnels à faire avant le retour des passagers »,
     maquettes https://claude.ai/artifact/9tmsMsH4pm8RhMTpUjviFD, « l'utilisateur reçoit une notif quand c'est accepté, refusé,
     fait »)** : `GET /internal/extras?view=todo|done|refused` (`ExtraService.board`, `reservations:view` ; à faire = commandés d'une
     réservation pas close, triés par `dueAt` = 1 h avant le retour attendu, l'atterrissage du vol quand il est connu
     (`extraDueAt`, `EXTRA_DUE_BEFORE_MS`), `late` ; faits du jour local, refusés sur 7 jours ; `counts`, place ou file de la
     voiture) ; « Accepter » `POST /internal/reservations/:id/extras/:extraId/accept` (`reservations:status`, 409 `not_to_do`,
     `ReservationExtra.acceptedAt/acceptedById`, migration `extra_accepted`, tracé `extra.accepted`, push au voyageur
     « Recharge électrique : accepté » une seule fois) ; « Fait » et « Pas possible » préviennent déjà le voyageur. **A** web :
     page `/pro/reservations/services` (`ExtrasTodoPage`, lien « Services à faire » de Réservations ; onglets À faire · Faits
     · Pas possibles `?vue=`, groupes En retard · Aujourd'hui · Demain · Plus tard, colonnes À faire avant · Service · Client
     · voiture · Place · Payé, « Accepter » · « Fait » · « Pas possible » sur la ligne, relue toutes les 60 s) et « Accepter »
     dans le bloc de la fiche. **C** Plazo Pro : onglet **Services** du poste Voiturier (`features/pro_extras`,
     `ProExtrasPage`, `/pro/services`, cartes rouges en retard, ambre aujourd'hui ; Places passe dans Plus › Voiturier), Plus ›
     Accueil › « Services à faire », « Accepter » dans `StaffExtrasCard`. Tests `extras.test.ts`, `ExtrasTodoPage.test.tsx`,
     `extras_board_test.dart`, `extras_test.dart`.
   - **Mail du matin (21/10/2026, « un mail quotidien avec l'état des intégrations, le CA et le planning ; ce mail peut être
     désactivé », choix A « Tableau du jour » des maquettes https://claude.ai/artifact/Ge2zVYZ95ZfJ11tMKtQJtz)** : chaque matin, à
     l'heure choisie (07:00 par défaut, de 05:00 à 10:00, heure du premier parking), un mail aux couleurs de l'espace pro : planning
     du jour (arrivées et première heure, retours et dernière heure, occupation de ce soir, les 6 premiers mouvements puis « et N
     autres »), chiffre d'affaires pour les gérants seulement (`revenue:view` : hier par jour de réservation, mois encaissé,
     commissions, « vous gardez », réservations sans prix) et intégrations (mails des comparateurs reçus et importés en 24 h,
     « N à traiter », un comparateur qui n'a rien envoyé depuis 3 jours en « À voir », suivi des vols, SMS, paiements, lecture par
     Claude) ; objet « <parking> · jeudi 22 oct. : 14 arrivées, 9 retours ». `Staff.morningEmail` (nul = d'office : allumé pour les
     gérants, éteint pour les autres), `morningEmailHour` (CHECK 5 à 10), `morningEmailSentOn` (jour local du dernier envoi ; migration
     `morning_email`) ; `domain/morning-email.ts` (`wantsMorningEmail`, `morningEmailDue` : de l'heure choisie jusqu'à midi, une fois
     par jour, `morningEmail` HTML et texte), `MorningEmailService` (`run` : loueurs ni suspendus, ni archivés, ni de démo ; jour
     réservé avant l'envoi, 40 par passage ; données de `DashboardService.get`, `planning`, `RevenueService`), envoyé par le passage de
     15 minutes de `remind-tomorrow` (son propre try/catch, `morning` dans la réponse) et `GET /internal/cron/morning-email` ;
     `NotificationService.emailStaff` accepte des en-têtes (`List-Unsubscribe` + `List-Unsubscribe-Post`). Réglage :
     `GET/PATCH /internal/notifications/preferences` `morningEmail { enabled, hour, email }` (400 hors 5 à 10 ; refusé en consultation
     et en démo), `POST /internal/notifications/morning-email/send` (« M'envoyer celui d'aujourd'hui », ne compte pas pour le jour) ;
     Mon compte (`MorningEmailCard` : interrupteur, heure, adresse, « Qui le reçoit »). « Ne plus le recevoir » :
     `GET /public/morning-email/unsubscribe/:jeton` (page avec un bouton, ne coupe rien d'elle-même) et `POST` (bouton et désinscription
     en un clic, RFC 8058), jeton = id + HMAC de `SECRET_KEY`. Plazo Pro n'a pas encore le réglage. Tests `morning-email.test.ts`,
     `MorningEmailCard.test.tsx`.
   - **Frais de nuit (12/10/2026, choix B « Dans le détail du prix seulement », « ajoute des frais de nuit pour les arrivées
     et départs en heure définie par le parking »)** : une plage par parking, la même chaque jour, pour les dépôts comme pour
     les retours (`Parking.nightFeeEnabled`, `nightStart` / `nightEnd` « HH:mm », `nightArrivalFeeCents` « Dépôt de nuit »,
     `nightReturnFeeCents` « Retour de nuit » ; migration `night_fees` avec ses CHECK) : le début compte (22:00 paie), la fin
     non (06:00 ne paie pas), la plage peut passer minuit, début = fin refusé ; les deux frais s'additionnent si les deux bouts
     du séjour tombent la nuit, et s'ajoutent au jour facturable de plus d'une arrivée tardive. Calculés sur les heures
     réservées (horloge locale du parking, `domain/night-fees.ts` : `inNightWindow`, `nightFeesForStay`, `nightRule`,
     `validateNightSettings`) pour les seules réservations faites sur Plazo, **figés** sur la réservation
     (`Reservation.nightArrivalFeeCents/nightReturnFeeCents`, CHECK : > 0 et canal `plazo` seulement ; un vol en retard, une
     heure changée par l'équipe ou un vol modifié ne les recalculent jamais) et compris dans le total `priceCents` (grille +
     frais), payé en ligne, remboursé avec le séjour, commission Plazo sur le tout ; imports et saisies de l'équipe : jamais.
     `GET/PUT /internal/pricing` : `night { enabled, start, end, arrivalFeeCents, returnFeeCents }` (absent au PUT =
     inchangé, valeurs gardées quand c'est coupé ; allumé : heures requises et différentes, `same_time`, au moins un montant
     > 0, `fee_required`, 0 à 1 000 € ; erreurs par champ `night.start`… ; tracé dans `pricing.updated`). Offres publiques
     (recherche et fiche) : `priceCents` = total (tri, filtre de prix, « Le moins cher », pastilles), `basePriceCents` (grille),
     `nightFee { arrivalCents, returnCents, totalCents } | null` ; fiche : `pricing.night { start, end, arrivalFeeCents,
     returnFeeCents } | null` ; `PublicBooking.basePriceCents/nightFee` lus de l'instantané ; les prix « dès » restent la
     grille. Stripe : une seule ligne, « · dont frais de nuit 15,00 € » ; mails de confirmation et de clôture « Total : 51,60 €
     (dont 15,00 € de frais de nuit), payé en ligne par carte. », SMS inchangé. Voyageurs (site et app) : cartes et pastilles
     au total seul, « Prix totaux pour vos dates, frais de nuit compris. » sous le titre des résultats quand un résultat en
     comprend ; ligne « Frais de nuit · dépôt à 23:30 » (« · retour à 05:30 », « · dépôt à 22:30 et retour à 05:30 ») entre
     « Forfait N jours » et le total, règle du parking dessous (« Ce parking ajoute 15 € pour un dépôt ou un retour entre
     22:00 et 06:00. ») : sur le site, carte de réservation de la fiche (`BookingCard`) et récapitulatif `/reserver` ; dans
     l'app, récapitulatif de « Vos informations » (`_Recap`), la fiche de l'app n'ayant que le total dans sa barre ; au
     paiement (site et app, tuiles Dépôt / Retour avec les heures) la ligne seule, sans la règle (`PublicBooking` ne la
     porte pas) ; « Ma réservation » : « dont 15,00 € de frais de nuit ». Espace pro : carte « Frais de nuit » de « Mes
     tarifs » (interrupteur de 44 px, heures à la demi-heure, 22:00 → 06:00 par défaut, deux montants, erreurs montrées une
     fois le champ changé ou quitté, simulation « Avec frais de nuit », commission « frais de nuit compris ») ; fiche
     réservation « dont … de frais de nuit » sous « Prix payé » ; revue des annonces de la plateforme : jour en plus et règle
     de nuit. Conditions générales (`legal.ts`, « 4. Prix ») et guides mis à jour.

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
     **A « le plan se cale sur l'adresse » (09/10/2026, « le plan doit être focus sur l'adresse de parking »)** : épingle
     « Adresse du parking » sur la photo (étiquette `address` de `MapView`, ancrée par la pointe, sans capter les clics) à la
     position géocodée du parking ; ouverture sur le contour et l'adresse ensemble, ou ~200 m autour de l'adresse sans contour
     (`homeBounds` dans `PlanEditor.tsx`) ; retour sur l'adresse après « Réinitialiser… › Tout le plan » (`onReset` renvoie
     vrai une fois fait, pas sur « Annuler ») et « Effacer le contour » ; bouton « Recentrer sur le parking » en bas à droite
     de la carte. Web seulement.
     **Ctrl+Z (09/10/2026, « prends en compte le ctrl+Z »)** : dans l'éditeur du plan, Ctrl+Z (⌘Z) annule le dernier geste,
     Ctrl+Maj+Z ou Ctrl+Y le rétablit (toast « Modification annulée / rétablie », « Rien à annuler ») ; `plan/history.ts`
     (`PlanHistory`, 100 étapes, gestes du même genre à moins de 600 ms fusionnés) : une étape garde le dessin entier d'avant le
     geste (contour, parcelles, zones, parties exclues, repères, réglages : les zones et bâtiments IGN qui suivent le contour
     reviennent avec lui, les mises à jour automatiques ne sont pas des gestes) et / ou la liste des files (trait, capacité,
     suppression, « Me proposer des files », remise par `PUT …/files`) ; une réinitialisation s'annule aussi (dessin, et files
     pour « Tout le plan »), pas les places du serveur ; rien dans un champ texte ni pendant une question ; la passe automatique
     vide l'historique.
     **R-A + P-B (09/10/2026, « faire une rotation du parking, les palettes ne doivent pas occuper le plan »)** : la carte de
     l'éditeur tourne (`MapView.rotatable` : clic droit + glisser, Ctrl + glisser, deux doigts sur téléphone, jamais
     d'inclinaison ; le pinceau laisse passer ces gestes) ; boutons en bas à droite « Nord » (boussole, quand la carte est
     tournée), « Aligner sur le parking » (`lib/plan/alignment.ts` `alignBearing` : rectangle le plus serré autour du contour,
     grand côté à l'horizontale, au plus près du nord) et « Recentrer sur le parking », qui garde l'angle (`fitTo` passe
     `bearing`) ; l'angle est gardé par parking dans le navigateur (`plazo:plan-bearing:<id>`). La palette de l'outil se replie en
     une barre (« Replier / Déplier la palette », gardé dans `plazo:plan-palette`, repliée par défaut sur téléphone) et se
     replie d'elle-même pendant qu'on trace (mode de dessin armé) ou qu'on peint (`MapView.onPaintStart`), en gardant la ligne
     d'aide et « Terminer » ; le double-clic qui termine un trait ne zoome plus la carte.
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
   - **Capacité = places du plan (09/10/2026, « le nombre de places généré doit être pris en compte dans toute
     l'application »)** : `effectiveCapacity` (`domain/capacity.ts`) = capacité des files actives, sinon places actives du
     plan (à la main et réservées comprises), sinon `Parking.totalCapacity` (le chiffre déclaré, gardé pour l'absence de
     plan) ; marge par-dessus (`bookableCapacity`). `CapacityService.nights` le lit dans la même requête (CTE) : réservations
     du personnel, imports, aperçu du formulaire, planning, recherche et réservation du site, paiement tardif ;
     `loadPlanCapacity` (plusieurs parkings en une requête) pour `GET /internal/parking` (`declaredCapacity`,
     `effectiveCapacity`, `capacitySource`), le tableau de bord, la vue du plan, les plannings des places et des files et
     la Plateforme (`places`, annonces) ; `ParkingService.getPrimary` rend la ligne seule (navettes, chiffre d'affaires…),
     `getPrimaryWithCapacity` y ajoute la capacité pour les écrans qui la montrent, et le planning la prend avec ses nuits.
     Réglages web et app : chiffre en lecture seule « Calculé depuis le plan du parking » avec « Ouvrir le plan » (l'app
     recharge au retour) ; éditeur : « Capacité utilisée partout : N places » à la place de « Recalculer la capacité »,
     textes de « Réinitialiser… » qui préviennent du retour au chiffre déclaré (ou aux files) ; plan de l'app : « Files de
     voiturier : N places · utilisées partout » quand les files comptent ; `apply-capacity` reste pour les anciennes
     versions de l'app.
   - Retrouver un véhicule en quelques secondes (plaque, emplacement, emplacement des clés).
   - **« Clés laissées » en un clic (26/10/2026, « pouvoir marquer en un clic qu'une personne a laissé ses clés »)** : sur le
     tableau de bord web, la pilule ambre « Clés ? · Clés laissées » de chaque véhicule sans crochet noté est un bouton (hors de la
     carte cliquable, jamais imbriqué) : un clic enregistre `Reservation.keysLeftAt` (migration `reservation_keys_left`,
     `PUT /internal/reservations/:id/keys` `{ left }`, `reservations:status`, 400 `vehicle_not_on_site` hors statuts sur place,
     `OccupationService.setKeys`, tracé `reservation.keys`), la pilule devient « Clés laissées · 09:47 » (verte), l'alerte
     `keys_missing` s'éteint, fiche, fiche opérationnelle et « Rendre » disent « Clés laissées » tant qu'aucun crochet n'est noté
     (le crochet, posé depuis l'Occupation, l'emporte) ; « Rendu » l'efface avec le crochet (`statusSideEffects`) ; `left: false`
     annule (web : un clic sur la pilule verte « Clés laissées · 09:47 » l'annule, 26/10/2026, « il doit être possible de changer
     l'état des clés laissées »). `DashboardVehicle.keysLeftAt`, `Reservation.keysLeftAt`. Plazo Pro ne l'a pas encore.
   - **Véhicules sur le parking, direction A (26/10/2026, « améliore l'ergonomie d'affichage des véhicules sur le parking, il
     doit être possible de changer l'état des clés laissées », choix « A » des maquettes
     https://claude.ai/artifact/4p2CFzeMX6c1HxgRpXq9pP, section 5)** : `components/dashboard/VehiclesTable.tsx` remplace les cartes
     du tableau de bord web : une ligne alignée par voiture (plaque et client cliquables vers la fiche opérationnelle, place ou
     file avec sa zone, clés, retour « Vol TO 3627 · 21:40 » / heure / jour, badges d'état ; **la plaque est posée au-dessus du nom** en gras sur sa propre ligne, colonne « Plaque · client » qui prend la place laissée par les colonnes fixes, le badge « Sans place » n'est plus doublé dans « État » (26/10/2026, « les noms ne sont pas assez visibles » : le nom était tronqué à une lettre à côté de la carte)), triée par retour, 8 lignes puis
     « Voir les N autres › » ; filtres avec comptage « Tous · Retours du jour · Sans place · Clés ? · Vol en retard »
     (`data-testid="vehicle-filters"`, un filtre vide est caché) et recherche plaque ou nom (accents et tirets ignorés) ;
     **clés en trois positions** (`KeysControl`, groupe « Clés ») : « Clés ? » (ambre : rien) · « Laissées » (vert, titre
     « Clés laissées · 09:47 ») · « Crochet n° » qui ouvre un champ sur place (Entrée ou perte du focus enregistre, Échap
     annule, « Crochet 12 » une fois posé) ; chaque position est un clic : `PUT /internal/reservations/:id/keys` accepte aussi
     `keyHook` (`KeysDto`, absent = inchangé, nul ou blanc = sans crochet ; un crochet vaut clés laissées :
     `OccupationService.setKeys` pose `keysLeftAt`, détails `{ left, keyHook, from }`) ; `adminApi.setKeys(id, { left, keyHook? })`.
     Plazo Pro garde ses tuiles.
   - **« À traiter maintenant » par type (26/10/2026, « compacte… ça prend trop de place », puis « mets plutôt un nombre à
     traiter catégorisé par type de demandes »)** : une pastille par type d'alerte avec son nombre (« 2 Sur place sans place »,
     bordure de la gravité, dans l'ordre du serveur : urgent d'abord ; `AlertList`, `data-testid="alert-kinds"`), rien de déplié
     par défaut ; cliquer une pastille montre ses lignes seules (une ligne dense par alerte : point de gravité, titre · détail,
     « depuis N min », plaque ; `AlertRow`, `alertDetail`), cliquer de nouveau la replie. **Plazo Pro aussi (26/10/2026, « pareil dans Plazo Pro »)** : `_AlertKinds` / `_AlertKindPill`
     (`Key('alert-kind-<kind>')`) sur l'onglet Aujourd'hui, mêmes règles ; test `pro_dashboard_test.dart`.
   - **Planning de Plazo Pro en une liste, direction A (27/10/2026, « le header prend trop de place, pour différencier les
     aller et retour », maquettes https://claude.ai/artifact/G9oXqHvSaNGdARTWAc3t56, « Ajoute une couleur de fond »)** : sur
     téléphone, l'onglet Aujourd'hui › Planning perd le titre, l'horloge et la bande de la semaine : une ligne de date
     `PlanningDateBar` (« ‹ MAR. 27 OCT. › », jour par jour, pilule « Aujourd'hui » citron ou bouton de retour, calendrier),
     puis les pilules « Tout · 22 · ● Dépôts · 9 · ● Retours · 13 » (`TodayFilter`, `planning-filter-*`) et une seule liste
     chronologique (`mergeDay` : rendez-vous, en approche, puis par heure, les deux sens mêlés ; `DayEntry`) ; chaque carte
     porte un fond vert pâle « DÉPÔT » ou indigo pâle « RETOUR » avec un liseré de 4 px et la pastille pleine
     (`TodayRowTile.tagged`) ; ce qui est fait (dépôt dont le client est venu, retour rendu au parking ou clos) est replié
     sous « Déjà passés · N » (`planning-past`, cartes estompées) ; le bandeau d'arrivée « Voir » choisit la pilule du sens.
     Tablette (≥ 760 px) : deux colonnes inchangées ; onglets Arrivées / Retours du chauffeur (`only`) : la même ligne de
     date, listes inchangées. `ProTodayView.initialMode` ; test `planning_list_test.dart`.
     **Le même style partout (28/10/2026, « mets à niveau Plazo Pro avec le style des arrivées, départs »)** : une arrivée est
     verte, un départ indigo, chaque carte a le fond pâle de sa couleur, un liseré de 4 px à gauche et la pastille pleine
     « ARRIVÉE » / « DÉPART » ; le prochain mouvement d'une réservation = son arrivée tant qu'elle est « Attendu », son départ tant
     que la voiture est au parking (`nextMovementOf`). Plazo Pro (`shared/widgets/movement_kind.dart` : `Movement`, `MovementPill`,
     `MovementEdge`) : onglets Arrivées / Départs du chauffeur et deux colonnes de la tablette (cartes teintées, titre à point de
     couleur « Départs », plus « Retours »), liste Réservations (`ReservationTile` : carte teintée, « ARRIVÉE · sam. 4 oct.
     06:30 »), Navette (lignes Aller en vert, Retour en indigo). Espace pro web (`lib/movement.ts`, `components/MovementPill.tsx`) :
     planning du jour (colonnes « Arrivées » / « Départs » à point de couleur, cartes teintées et arrondies, pastille sous l'heure,
     état et vol en pilules), liste Réservations (ligne teintée et pastille datée ; une ligne sans prix reste ambre), fiche
     opérationnelle (pastilles Arrivée / Départ devant les deux dates), véhicules du tableau de bord (colonne « Départ », pastille
     indigo pour un départ du jour). Tests `movement_kind_test.dart`, `MovementPill.test.tsx`.
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
   - Décision **F-A du 06/10/2026 (« Ma tournée »)**, remplacée par B le 22/10/2026 (ci-dessous) : l'onglet Navette de Plazo Pro et le mode chauffeur du web en trois
     bandes À emmener · En route · En séjour (retours : À récupérer · En route · Rendus) ; `leaveAt` sur `PickupRow` et
     `DepartureRow`, `DepartureRow.expected` (attendu ; grisé jusqu'au 14/10/2026), `GET /internal/shuttle/staying` (`days[]`, `returnedToday`) ;
     `ShuttleState.band`, `_BandBar` ; `ShuttleTripsPanel` onglets `band-0/1/2`.
     **Ligne du jour cohérente avec l'heure (06/10/2026)** : aujourd'hui, seules les vagues à venir sont listées (`ShuttleWavesState.upcoming`,
     une vague est passée si elle est faite ou devait partir il y a plus de 30 min) ; les passées sont repliées sous « N créneaux passés »
     (app `waves-past`, web `waves-past`, heure du serveur) ; le compteur devient « N à venir ».
   - Décision **« Embarquer en un geste » (14/10/2026, « simplifie le process du chauffeur… Une voiture arrivée est
     automatiquement marquée garée si son propriétaire a embarqué » ; maquette validée https://claude.ai/artifact/8dAScBE8MCNNQ8uzgKfJ4g)** :
     le chauffeur coche les clients prévus, « Attendu » compris (`DepartureRow.expected` n'est plus grisé, pilule ambre « Attendu
     HH:MM »), ou les ajoute à la main : « Embarquer » sur l'onglet Arrivées du chauffeur (aujourd'hui, Attendu ou Sur place),
     « Récupérer » sur Retours, « Embarquer » dans « Autres actions » d'une réservation attendue, « Déposer au terminal » de la fiche
     (ligne épinglée quand le client n'est pas dans la liste, retirée et nommée si le départ est refusé : « …, ajouté à la main, a
     été retiré de la sélection : vérifiez sa réservation. ») ; puis « Embarquer et partir · N clients » : le trajet part avec le
     véhicule du jour, sans feuille (ligne « Vito blanc · GH-456-JK · 3 pass. sur 8 » et « Changer » dans l'app ; véhicule du jour
     présélectionné sur le web), et un client encore « Attendu » passe « Sur place » au départ. Serveur : `canBoard(direction,
     { status, arrivalAt }, now)` accepte en dépose un `upcoming` dont l'arrivée est à ±24 h (`BOARDING_CHECK_IN_HOURS`,
     `checksInAtBoarding`) ; `ShuttleService.start` crée le trajet et pointe ces arrivées dans une seule transaction (lignes des
     passagers verrouillées, `trip_already_running` et `already_on_trip` revérifiés, annulation concurrente → 422
     `invalid_passengers` et rien n'est gardé ; historique `reservation.status_changed` avec `via: 'boarding'`) ;
     `Reservation.boardingTripId` (migration `boarding_check_in`, remis à nul au retour à « Attendu ») donne
     `boardingCheckIn { driverFirstName, at }` à la fiche, aux arrivées et voitures de l'Occupation et des files et aux véhicules du
     tableau de bord : « Pointé à l'embarquement par Karim » dans « Arrivées à placer » (web et app) ; la voiture d'un client pointé
     à l'embarquement reste « à placer » (alerte `no_spot`, `toPlaceToday`) après la dépose ; passagers du trajet
     `checkedInAtBoarding` / `arrivedAt` (« Sur place · 09:47 », note « 1 voiture pointée à l'embarquement : le voiturier la
     retrouve dans « Arrivées à placer », avec ses clés. ») ; les attendus des départs remontent à 6 h (un retardataire reste
     embarquable) ; `changeStatus` verrouille la réservation et la relit (un client pointé à l'embarquement n'est pas annulé
     par-dessus son trajet : 400 `invalid_transition`). Web : mêmes règles dans le mode chauffeur de la page Navettes
     (`ShuttleTripsPanel`, `?sens=dropoff&reservation=` accepte un client attendu et l'épingle, refus « trajet déjà en cours »
     pendant son propre trajet ; `lib/boarding.ts`), « Embarquer » dans `NextStep` ; app : `ShuttleBoarding` /
     `ShuttleBoardingRequests` (bascule vers l'onglet Navette), une demande arrivée pendant un départ en cours attend son issue.
   - Décision **B « Aller / Retour » (22/10/2026, « le workflow n'est pas bon. j'ai une liste de personnes selon un planning
     d'arrivée. Je les sélectionne. et je vais les déposer à la gare. pareil au retour » ; maquettes
     https://claude.ai/artifact/4hCVXX8zhe94z4Ax1dqXBZ)** : l'onglet Navette de Plazo Pro et le mode chauffeur du web ont trois
     onglets **Aller · N** (les clients à conduire), **Retour · N** (ceux à aller chercher) et **En route · N**, chaque liste par
     créneau de 15 min de l'heure de départ conseillée (« 14:30 · départ conseillé », « Tout cocher » / « Tout décocher » par
     créneau, les sans heure en dernier) ; plus de sens ni de desserte à choisir avant de partir : **la destination vient de chaque
     réservation** (`Reservation.stopId`, « Desserte » ; l'aéroport sinon), écrite sur la ligne (« vers Gare TGV », « à
     l'aéroport »), et le bouton la dit d'après les personnes cochées (« Partir vers Gare TGV · 6 pers. », « Aller chercher à
     l'aéroport · 3 pers. », « Partir · 5 pers. · 2 destinations » ; le trajet part avec `stopId` = la desserte commune, nulle
     pour un mélange) ; « En route vers Gare TGV · position partagée », « N pers. à bord » / « à récupérer », fins « Clients déposés
     · retour au parking » / « Tout le monde est à bord · retour au parking » ; « client(s) » devient « pers. » (navettes en cours
     aussi) ; pendant un trajet, l'autre onglet attend sa fin. Retirés : « Départs · terminal » / « Retours · aéroport », les puces
     de desserte, la carte « Ligne du jour » de l'onglet (la page Navettes du web la garde), les bandes « En séjour » / « Rendus »
     (`GET /internal/shuttle/staying` n'est plus lu par les apps). App : `ShuttleState.slots/selectedStopId/selectedDestinations`,
     `ShuttleSlotToggled`, `startLabel` ; web : `slotsOf`, `SlotHeader`, onglets `tab-go|back|route`. Serveur inchangé.
   - **Sièges auto pour la navette (24/10/2026, « Pouvoir signaler qu'on a besoin de siège auto pour la navette », choix « B et B »
     des maquettes https://claude.ai/artifact/LwPrcpvfmH7G2dqLXyfmZg : par tranche d'âge, côté voyageur comme côté chauffeur)** :
     `Reservation.childSeatInfant/childSeatToddler/childSeatBooster` (migration `child_seats`, CHECK 0 à 4 chacun),
     `domain/child-seats.ts` (`ChildSeats { infant, toddler, booster }`, bébé jusqu'à 12 mois = siège dos à la route, 1 à 4 ans =
     siège enfant, 4 à 10 ans = réhausseur ; `childSeatsRefusal` : moins de sièges que de passagers, les enfants comptent dans les
     passagers, `child_seats_exceed_passengers` / `child_seats_range` ; `childSeatsSummary` « 1 siège bébé · 2 réhausseurs »,
     `sumChildSeats` pour « À charger avant de partir »). API : `childSeats` sur `PublicBooking`, la fiche et la liste du
     personnel, `PickupRow`, `DepartureRow` et les passagers d'un trajet ; `POST /public/bookings`, `POST/PATCH
     /internal/reservations` acceptent `childSeats` (`ChildSeatsDto`, PATCH : absent = inchangé) ; le voyageur change les siens
     par `PUT /public/bookings/:ref/child-seats` tant que la réservation est « Attendu » (409 `child_seats_locked`, tracé
     `reservation.updated` `by: 'traveller'`) ; mail de confirmation : ligne « Sièges auto : 1 siège bébé, 1 réhausseur (installés
     dans la navette, aller et retour) ». Gratuit, sans réglage du parking ; aucun import ne le lit. Site et app Plazo : carte
     « Des enfants à bord ? » (interrupteur, trois compteurs) sous Passagers, récapitulatif, bloc « Sièges auto » de Ma réservation
     avec « Modifier » ; espace pro web et Plazo Pro : bloc du formulaire, ligne de la fiche, pastilles « Siège bébé · Siège 1 à
     4 ans · Réhausseur » et « dont N enfants » sur les lignes Aller / Retour / En route du chauffeur, bandeau « À charger avant de
     partir » au-dessus de « Partir ». Tests `child-seats.test.ts`, `public-booking.test.ts`, `shuttle-day.test.ts`.
   - **Voiturier au terminal, direction B (27/10/2026, « certaines réservations sont service Voiturier : récupération du véhicule
     au terminal à l'arrivée et au retour », puis « B et change Dépôt et Retours en arrivée et départ », maquette
     https://claude.ai/artifact/5Xu8o9kZgNxKTjfpG3HxqP avec le petit voiturier indigo)** : `Reservation.handover` `shuttle` | `valet`
     (migration `valet_handover` ; `valetArrivalById/TakenAt`, `valetDepartureById/TakenAt`, `valetArrival/DepartureNotifiedAt`, CHECK :
     courses seulement sur une réservation voiturier) ; `Parking.valetMeetingPoint` (≤ 80, vide = « Terminal 1 · dépose-minute » à LYS,
     sinon « Aéroport · dépose-minute », `valetMeetingPointOf`). Une réservation voiturier n'est jamais dans Aller / Retour du chauffeur,
     la prévision des navettes ni un trajet (422 `invalid_passengers`), jamais « Parti en navette » (`valetStatuses`) ; SMS
     d'atterrissage « Votre voiture vous attend : <point>. ». Deux courses par réservation (`domain/valet.ts`, `ValetService`) :
     arrivée (ouverte tant que « Attendu ») et départ (ouverte de « Sur place » à « De retour au parking ») ;
     `GET /internal/valet/runs` (de 6 h avant à 18 h après, faites du jour ; « Prise » d'abord), `POST
     /internal/valet/runs/:id/:kind/take` (409 `run_taken`), `…/release` (son voiturier ou un gérant), `…/done` (arrivée → « Sur
     place », départ → « Rendu » par `changeStatus` ; une course non prise devient la sienne) ; 400 `not_valet`, 409 `run_closed` ;
     push « Course à prendre · 08:15 · <point> » aux voituriers et gérants (audience `valets`) une fois, 30 min avant de partir,
     par le passage de 15 minutes de `remind-tomorrow` (`valet` dans sa réponse) ; repasser en navette efface les courses.
     Réservable par l'équipe et à la main seulement : ni plazo.fr ni import (exemples de mails voiturier des comparateurs attendus).
     Web : « Prise en charge · Navette | Voiturier au terminal » du formulaire (desserte cachée en voiturier), pastille indigo
     `ValetPill` (`lib/valet-icon.tsx`) sur la fiche, la fiche opérationnelle et le planning, carte « Courses au terminal » du tableau
     de bord (`ValetRunsCard`, cachée sans course), « Rendez-vous du voiturier à l'aéroport » dans Parking › Réglages. Plazo Pro :
     onglet **Terminal** du poste Voiturier (`features/pro_valet`, `ProValetPage`, `/pro/terminal` : À faire · En cours · Faites,
     « Je prends », « Voiture récupérée au terminal » / « Voiture rendue au client », « Je ne peux plus », Appeler ; relu toutes
     les 30 s), choix dans le formulaire, ligne de la fiche, pastille sur le planning, pas d'« Embarquer » pour un voiturier ;
     **planning en une liste renommé** : pilules « Arrivées · Départs » et pastilles « ARRIVÉE » / « DÉPART ». Tests
     `valet.test.ts`, `ValetRunsCard.test.tsx`, `ReservationForm.test.tsx`, `valet_runs_test.dart`.
   - Décisions **R-B + I-C du 07/10/2026 (« suivi des navettes réglable », règle 1)** : `Parking.shuttleTracking` `off` | `team` |
     `everyone` (`team` par défaut pour un nouveau parking ; les parkings existants et ceux de démonstration à `everyone`),
     `PUT /internal/parkings/:id/shuttle-tracking` (`parking:manage`), `domain/shuttle-tracking.ts` ; bloc « Suivi des navettes »
     de la page Parking (`ShuttleTrackingCard`) et section de Plus › Réglages du parking dans Plazo Pro ; `off` : trajets sans
     position (409 `shuttle_tracking_off`, `sharePosition` faux sur `pickups`, `departures` et le trajet, ni le web ni l'app ne
     demandent la localisation) ; `team` : l'équipe seule, aucune position, distance ni « Votre navette est là » au voyageur, pas de
     navette sur la carte d'accueil ; `everyone` : comme avant. `liveShuttle` sur les résultats et fiches (navette proposée et
     `everyone`) : pilule blanche « EN DIRECT » sur la photo (`LiveShuttlePill` site : depuis Boutique, 11/10/2026, pilule papier
     en coin haut gauche de la photo, capitales encre et point orange qui respire, comme `LivePill` du jour J ; `LiveShuttleTag`
     app) et minibus devant le prix sur la pastille de la carte des résultats.
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
   - **« Ma réservation » pour tous les canaux (27/10/2026, « impossible de retrouver la réservation avec le code et le mail » :
     les tentatives de la soirée répondaient 404)** : `POST /public/bookings/lookup` (référence + e-mail), `PublicBookingService.load`
     (lien de gestion) et `AppLinkService` (lien court) acceptaient seulement le canal `plazo` ; or les SMS de la veille et
     d'atterrissage envoient ce lien à toutes les réservations d'un parking présent sur Plazo (téléphone, comptoir, comparateurs,
     `SmsService.bookingLink`). Désormais toute réservation d'un parking qui a une fiche est retrouvée et consultée par son voyageur
     (même e-mail, 30 jours après le retour au plus) ; **l'annulation en ligne reste réservée aux réservations faites sur Plazo**
     (409 `cancellation_closed` pour les autres : c'est l'affaire du parking ou du comparateur) ; paiement et services additionnels
     inchangés (déjà réservés aux réservations Plazo payées). Test `public-booking.test.ts` « retrouver sa réservation » **Numéro du comparateur et
     téléphone (27/10/2026, « pouvoir récupérer n'importe quelle réservation dans Plazo », direction A des maquettes
     https://claude.ai/artifact/WcdeKCQT1Tg8Sx93Vevj76)** : `POST /public/bookings/lookup` `{ reference, contact }` (`email` encore
     accepté des anciennes apps) : le numéro est la référence Plazo ou `externalReference` (« AL-884880719 », « #5908369 » : casse,
     espaces et « # » ignorés, `lookupNumber`), le contact l'e-mail de la réservation ou son téléphone (9 derniers chiffres,
     `phoneKey`) ; même 404 pour tout refus, réservations anonymisées exclues, limite par numéro (`lookupReferenceKey`). Site
     (`LookupForm` : « Numéro de réservation » avec « Plazo, Allopark, Onepark, ParkVia… », « E-mail ou téléphone ») et app Plazo
     (« Ajouter une réservation », `open.contact`) ; tests `public-booking.test.ts`, `actions.test.ts`, `booking_bloc_test.dart`.
   - **« Lien court Plazo » (27/10/2026, « Lien profond pour télécharger et utiliser Plazo directement sur sa réservation »,
     direction B des maquettes https://claude.ai/artifact/RengaLdiu3ex2eB9yhot7d)** : les SMS (confirmation, veille, atterrissage)
     et les mails (confirmation, rappel) portent `https://www.plazo.fr/a/<REF>-<code>` à la place du lien long (`domain/app-link.ts` :
     `appLinkCode` = référence + 8 caractères d'un HMAC de `SECRET_KEY` sur l'id et `manageTokenVersion`, révoqué avec le lien
     de gestion ; `NotificationService.appLinkUrl(booking)`, `bookingConfirmed` / `bookingReminder` reçoivent le lien). Sur un
     téléphone avec l'app, l'OS ouvre l'app lui-même (`/a/*` dans `apple-app-site-association` et le manifeste Android du flavor
     voyageur ; route `/a/:code`, `AppLinkPage` → `GET /public/app-link/:code` → `MyBookingRoute` avec la clé ; schéma `plazo://a/<code>`
     pour « J'ai déjà l'app », `CFBundleURLTypes` du plist, que les pipelines remplacent pour Plazo Pro). Sans l'app, la page de
     rebond du site `app/a/[code]` (`force-dynamic`, `noindex`, `Referrer-Policy: same-origin`, `Cache-Control: no-store`) :
     ordinateur → redirection vers `/ma-reservation/REF?cle=…` ; iPhone ou Android → `POST /public/app-link/:code/claim`
     (`{ platform }` : le téléphone est retenu 24 h par `sha256(adresse|plateforme)`, table `app_link_claims`, migration
     `app_link_claims`, purgée par le cron de nuit, `appLinkClaimsDeleted`), puis « Installer l'app » (Google Play avec
     `referrer=plazo_code=<code>` ; App Store `PLAZO_APP_STORE_URL`, variable Vercel du site à poser quand Apple publie Plazo,
     sinon « Bientôt sur l'App Store »), « J'ai déjà l'app », « Continuer sur le site ». Premier lancement de l'app
     (`AppLinkResumeGate` autour de la coquille voyageur, une fois par téléphone, `shared_preferences` `app_link.resume_checked`,
     jamais dans Plazo Pro ni dans les tests, `AppLinkResumeGate.enabled`) : `POST /public/app-link/resume` `{ platform, code? }`
     → `{ found: false }` ou `{ found: true, match: 'code' | 'device', reference, manageToken, firstName, parking, arrivalAt,
     returnAt }` (l'attente est consommée) → feuille « Retrouvée pour vous · R7KQ2M · parking · date », « Ouvrir ma réservation »
     (clé enregistrée) ou « Ce n'est pas moi ». `AppLinkService`, `appLinkLimiter` (40 par 15 min), `visitorAddress(req)` dans
     `rateLimiter.ts`, `SITE_API_KEY=test-site-key` dans le setup des tests. Reste à faire : l'empreinte de signature Play dans
     `assetlinks.json` (sans elle Android ouvre le navigateur même avec l'app) et le lecteur de l'Install Referrer dans l'app (le
     code est déjà passé au store ; d'ici là Android est retrouvé comme iPhone, par l'adresse). Politique de confidentialité à
     compléter (hachage 24 h). Tests `app-link.test.ts`, `app-link.test.ts` (site), `app_link_test.dart`.

4. **Contrat signé et état des lieux (19/10/2026, « Intègre un outil de signature numérique des contrats et un état des lieux
   utilisateur et loueur avant et après réservation », « comme Yousign » ; maquettes https://claude.ai/artifact/USWr2tiiqbgJ2eZsTum5w9,
   choix « A, tout dans les applis »)** : signature électronique simple faite par Plazo (pas Yousign), écrans dans Plazo et Plazo Pro
   seulement. **Contrat** (`ReservationContract`, `domain/contract.ts`, modèle `CONTRACT_VERSION` à faire relire par un juriste) :
   texte entier signé gardé avec son SHA-256 et une empreinte de preuve (`proofOf` : texte, signataire, moyen, heure, tracé) ; signé
   une fois, du séjour à venir jusqu'au dépôt (`upcoming`, `arrived`), **au comptoir seulement (20/10/2026, « A au comptoir »)** : sur
   le téléphone du parking avec un code à 6 chiffres reçu par SMS par le voyageur (`SignatureCode`, HMAC de `SECRET_KEY` seulement, 10 min, 5 essais, un nouveau code au plus toutes les 60 s et 5 par
   heure, toujours par le Brevo de Plazo quel que soit le canal SMS du loueur : `SmsService.sendSignatureCode`, sortie `signature_code`),
   ou par signature manuscrite `strokes` [[[x, y]…]] de 0 à 1 ; l'app du voyageur montre le contrat à lire (`contract.atCounter`,
   `canSign` faux pour le voyageur) et `POST /public/bookings/:ref/contract/code|sign` répondent 409 `contract_at_counter` ; copie
   envoyée par e-mail (`NotificationService.emailTraveller`, `emailedAt`) ; seul le numéro masqué « 06 •• •• •• 78 » est gardé.
   **États des lieux** (`VehicleInspection`
   `dropoff` | `return`, `InspectionPhoto`, `domain/inspection.ts`) faits dans Plazo Pro (`reservations:status`) : quatre photos guidées facultatives (avant, droite, arrière, gauche depuis le 30/10/2026,
   « ne demande que 4 photos et ne les rend pas obligatoire » : `GUIDED_SLOTS`, « Terminer » ne demande plus que le kilométrage et le
   carburant ; compteur et intérieur, `LEGACY_SLOTS`, restent acceptés pour les anciens rapports ; jusque-là six photos obligatoires
   (avant, droite, arrière, gauche, compteur, intérieur ; une photo reprise remplace la précédente) et jusqu'à 12 gros plans de dégâts,
   dégâts touchés sur la silhouette (x, y de 0 à 1, numérotés), kilométrage, carburant (0 à 4 quarts), remarques ; « Terminer »
   verrouille (400 avec les champs manquants) ; dépôt possible en `upcoming`/`arrived`, retour dès `arrived` jusqu'à `returned`. Le
   voyageur répond « conforme » ou fait une réserve avec ses mots : sur le téléphone du parking (signature manuscrite) ou dans l'app
   (`booking_link`, connecté par le lien de sa réservation) ; un dépôt sans réponse quand le voyageur part en navette vaut accord
   (`accepted_by_default`, posé à la lecture) ; empreinte de l'état des lieux tel qu'accepté (`proofSha256`). Au retour, Plazo Pro
   montre les photos du dépôt et du retour côte à côte (pastilles par côté), les dégâts « Déjà au dépôt » / « Nouveau » (à plus de
   8 % de la silhouette d'un dégât du dépôt), l'écart de kilométrage et de carburant (`comparison`). **Les photos du voyageur
   (20/10/2026, « les deux peuvent faire l'état des lieux », écran 5 des maquettes)** : `VehicleInspection.author` `staff` |
   `traveller` (migration `inspection_author`, unique par réservation, sens et auteur ; CHECK : un rapport du voyageur n'a pas de
   réponse) ; dans Plazo, « Vos photos au dépôt » (`upcoming`/`arrived`, avant de remettre les clés) et « Vos photos au retour »
   (`back_at_parking`/`returned`), facultatives : les photos guidées (quatre depuis le 30/10/2026 ; pas de gros plan), un mot, « Envoyer mes photos au
   parking » (une photo au moins, puis verrouillé, empreinte `proofSha256`) ; routes `POST|PATCH /public/bookings/:ref/inspections/:kind/mine`,
   `POST …/mine/photos?slot=` (`photoUploadLimiter`, 40 par 15 min), `DELETE …/mine/photos/:photoId`, `POST …/mine/complete` ;
   vue `travellerReports { dropoff, return }` (le brouillon pour le voyageur, l'envoi seulement pour l'équipe) et
   `travellerCanPhotograph` (voyageur) ; Plazo Pro montre « Photos du client » en tête de l'état des lieux du même sens ; chacun ne
   voit que ses brouillons et les envois de l'autre ; tracé `inspection.traveller_sent`. **Photos** : stockage privé
   Vercel Blob (`@vercel/blob` 2.8, `access: 'private'`, `PhotoStorageService`, `BLOB_READ_WRITE_TOKEN` posé par Vercel quand un Blob
   store est relié au projet ; sans lui 503 `photos_unavailable` et le reste marche), jamais de lien public : l'API les sert
   (`Cache-Control: private`) à l'équipe du loueur ou au voyageur avec le jeton de sa réservation ; envoyées en octets bruts (JPEG,
   PNG, HEIC, WebP reconnus à leurs premiers octets, 3 Mo au plus, `RawBodyMiddleware` sur la route dans `app.ts`), réduites par l'app
   (1 600 px, qualité 70, `image_picker`) ; effacées 90 jours après le retour, 365 avec une réserve (`PaperworkService.purge`, cron
   de nuit, avec les codes de plus d'un jour), contrat et états des lieux supprimés à l'anonymisation (12 mois). Routes : staff
   `GET /internal/reservations/:id/paperwork`, `POST …/contract/code|sign`, `POST|PATCH …/inspections/:kind`,
   `POST …/inspections/:kind/photos?slot=`, `GET|DELETE …/photos/:photoId`, `POST …/complete|answer` ; voyageur
   `GET /public/bookings/:ref/paperwork`, `POST …/inspections/:kind/answer`, `GET …/photos/:photoId`, ses photos sous `…/mine`
   (`x-booking-token`) ; migrations `contract_inspection` (20261019130000) et `inspection_author` (20261020090000). Apps : feature `paperwork` ; Plazo Pro : carte « Contrat et état des
   lieux » de la fiche réservation, `/pro/reservations/:id/contrat` (code par SMS ou signature à la main),
   `/pro/reservations/:id/etat-des-lieux/:kind` ; Plazo : blocs « Contrat de stationnement » (à lire), « Vos photos » et « État des
   lieux » de Ma réservation, `/ma-reservation/:ref/contrat`, `/ma-reservation/:ref/mes-photos/:kind`,
   `/ma-reservation/:ref/etat-des-lieux/:kind`. Conditions générales (articles 9 et 11) et politique de confidentialité mises à jour
   (19/10/2026, puis 20/10/2026 : signature au comptoir, photos du voyageur). Le web n'a pas ces écrans.
   **Le contrat du parking et le registre des contrats signés (26/10/2026, « chaque parking peut héberger le contrat de
   stationnement à ses clients. chaque contrat est stocké ainsi que la preuve de signature », choix « A » (Mon PDF) des maquettes
   https://claude.ai/artifact/WFFKgJUsqFDWQvebjayV6J, registre R-A pris par défaut)** : table `operator_contract_templates`
   (migration `operator_contract_template` : PDF par loueur, `version` 1, 2, 3…, `title`, `fileName`, `pageCount`, `sha256`,
   `blobKey` dans le magasin Blob privé, `retiredAt` ; index unique partiel = une seule version en vigueur), `ReservationContract.templateId`
   (version signée, `version` « pdf-3 »), `signedBlobKey` / `signedSha256` / `proofBlobKey`. `domain/contract-template.ts` :
   `templateDocument` (le texte signé lie la signature au PDF : ligne « Contrat : « titre », version N (P pages), empreinte SHA-256 … »
   et trois clauses Contrat · État des lieux · Signature ; les clauses du parking sont dans son PDF), `buildSignedContractPdf`
   (`pdf-lib` : le PDF du parking intact, ou le modèle Plazo mis en page, plus une page « Réservation et signature » : lignes de la
   réservation, référence, signataire, moyen et appareil, témoin, heure du parking, empreintes du texte, du contrat du parking et
   de la signature, les clauses signées, le tracé manuscrit ; la preuve = cette page seule avec l'empreinte du PDF signé),
   `signedFileNames`. `ContractTemplateService` : `GET/POST /internal/contract-template` (PDF brut, `?fileName=&title=`,
   `RawBodyMiddleware`, `checkPdf` de `partner-contract.ts`, 4 Mo ; gérants `parking:manage`, `RefuseInDemo` ; versions et nombre de
   signés par version, `plazoSignedCount`), `POST …/revert` (retour au modèle Plazo, 409 `no_template`), `GET …/:id/file`
   (relu contre son empreinte), registre `GET /internal/contracts?from=&to=&q=&reserved=1&page=` (50 par page, `plateKey`,
   nom, référence ; `reservedCount`) et `GET /internal/contracts/export` (CSV « ; » avec BOM, 5 000 lignes), fichiers
   `GET /internal/reservations/:id/contract/file?kind=template|signed|proof` (`reservations:view`) et
   `GET /public/bookings/:ref/contract/file?kind=` (jeton). `PaperworkService.sign` : le PDF en vigueur est relu (empreinte) avant
   la signature, le texte signé est celui de `templateDocument`, puis le PDF signé et la preuve sont construits et stockés (jamais
   une signature échouée pour ça : sans magasin, texte et preuve seuls, `files` à faux) ; la copie par e-mail joint le PDF signé
   (`NotificationService.emailTraveller` accepte des pièces jointes) ; vue `contract.template { id, title, version, pageCount,
   fileName }` et `contract.files { template, signed, proof }`, `signed.signedSha256`. Les PDF signés sont effacés à
   l'anonymisation (`RetentionService`) et avec le loueur (`ContractTemplateService.blobKeysOf`). Web : carte « Contrat de
   stationnement » de Parking › Réglages (`ContractTemplateCard` : modèle Plazo ou version en vigueur, « Voir le PDF »,
   « Remplacer », « Revenir au modèle Plazo », versions précédentes avec leur nombre de signés), page « Contrats » `/pro/contrats`
   (menu, gérants ; `ContractsPage` : pilules Signés · Avec réserve, dates, recherche, tableau avec moyen et témoin, version
   « PDF v3 » / « Plazo 2026-10-19 », empreinte, boutons « PDF signé » · « Preuve » · « Contrat du parking », export CSV), bloc
   « Contrat de stationnement » de la fiche réservation (`BookingContractCard` : signé ou non, ce que le client signera, PDF signé
   et preuve). Apps (freezed édité à la main, sans SDK) : `ContractModel.template` / `files`, carte « Contrat du parking » avec
   « Ouvrir le PDF » avant la signature, « PDF signé » et « Preuve de signature » après (fichiers lus par
   `PaperworkDataSource.contractFile` et ouverts par la feuille de partage, `ShareService.shareBytes`). Conditions générales
   (article 9) et politique de confidentialité (données gardées, durées) mises à jour. Tests `contract-template.test.ts`,
   `ContractTemplateCard.test.tsx`, `ContractsPage.test.tsx`.
   **PDF du parking lisible avant la signature (29/10/2026, « impossible de visualiser le contrat et de le signer »)** :
   `contract/file?kind=template` (voyageur et équipe) rendait 404 tant qu'aucun contrat n'était signé (pas de ligne
   `reservation_contracts`) ; il sert désormais le PDF en vigueur du loueur, comme le dit la vue (`files.template`), puis celui signé.
   **Contrat pré-rempli, direction A « Calque placé par le gérant » (30/10/2026, « le contrat doit être pré-rempli avec les infos et
   la date de signature », maquettes https://claude.ai/artifact/MQjG7RcXy893kwj2M7a9ii)** : le gérant place une fois, par version du
   PDF, où va chaque information (`OperatorContractTemplate.fields` `[{ key, page, x, y, w, h, size? }]`, fractions de la page depuis
   son coin haut gauche, et `fieldsSetAt` ; migration `contract_template_fields`) ; clés `customer_name` · `phone` · `plate` ·
   `vehicle` · `arrival_at` · `return_at` · `price` · `reference` · `return_flight` · `signed_on` · `signature`
   (`domain/contract-fields.ts` : `validateFields`, 40 au plus, cadre dans la page, 6 à 24 pt ; `fieldValues` « 30/10/2026 08:00 »,
   « 54,00 € » ; `stampFields` écrit chaque valeur dans son cadre, réduite pour y tenir, sans ajouter de page). Le PDF lu avant la
   signature (`contract/file?kind=template`, voyageur et équipe) est pré-rempli avec la réservation et « Fait le » = aujourd'hui (heure
   du parking), le cadre de signature vide ; le PDF signé porte les mêmes valeurs, la date de signature et la signature (le tracé
   manuscrit, ou « Signé par code SMS · 09:47 », `signatureStamp`), puis la page « Réservation et signature » comme avant (empreinte
   du PDF d'origine inchangée dans le texte signé). Routes (gérants) : `PUT /internal/contract-template/:id/fields` (`RefuseInDemo`,
   409 `template_retired`, 400 `fields` invalid · too_many · invalid_key · invalid_page · invalid_box · invalid_size, tracé
   `contract_template.fields`) et `POST …/:id/preview` (`{ fields }` → le PDF avec des valeurs d'exemple). Web : « Placer les
   informations » de la carte « Contrat de stationnement » (ligne « Pré-rempli : N informations placées » ou ambre « Pas encore
   pré-rempli ») → page `/pro/parking/contrat/:templateId/champs` (`ContractFieldsPage`, chargée à part avec pdf.js, `lib/pdf-render.ts`) :
   palette des informations (glisser sur la page ou toucher pour poser au milieu), la page du PDF dessinée avec les cadres en citron
   (valeur d'exemple, déplacer, agrandir par le coin, retirer, taille du texte), pages ‹ ›, « Enregistrer », « Aperçu avec un
   exemple ». Un PDF sans champs reste servi tel quel ; les rotations de page ne sont pas gérées. Tests `contract-fields.test.ts`,
   `ContractFieldsPage.test.tsx`.
   **Kilométrage et vol ou train (30/10/2026, « sur les documents à signer il manque le kilométrage, le numéro de vol ou train »)** :
   trois clés de plus, `departure_flight` (« Vol aller »), `travel` (« Vol ou train » : « Aller AF 7641 · Retour TO 3627 », un seul vol,
   sinon le train écrit dans les notes par l'import, `trainOf` / `travelLine`) et `mileage` (« Kilométrage au dépôt » : celui de l'état
   des lieux du dépôt fait par l'équipe, « 48 210 km », vide tant qu'il n'est pas saisi) ; le texte signé (modèle Plazo et page
   « Réservation et signature ») porte aussi « Vol ou train : … » et « Kilométrage au dépôt : … » quand ils sont connus
   (`ContractFacts.travel` / `mileageKm`).

## Liste « plus tard » (le « bien plus »), hors MVP

Lecture de plaque, tarification dynamique,
connecteurs agrégateurs (Parkos, ParkMundo, Onepark, Free2move…), multi-parkings,
statistiques et facturation (hors commission, reversements et chiffre d'affaires CA-B, qui font partie du MVP).

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
  `vercel-build` compile d'abord puis ne migre et ne lance les scripts qu'en production (`VERCEL_ENV`) ; **la migration est
  retentée quand Neon se réveille (14/10/2026)** : `lib/scripts/migrate-deploy.js` relance `prisma migrate deploy` sur P1001, P1002
  ou P1017 (5 essais en une minute environ, `domain/migrate-retry.ts`), jamais sur une migration en échec ;
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
  Xcode `traveller` et `pro` avec leurs configurations `-traveller` / `-pro`, identifiants `com.benfordtech.plazo` / `com.benfordtech.plazopro` sur iOS et Android (11/10/2026, Plazo Pro créée sur Google Play), `AppIcon-pro`, `RunnerPro.entitlements`
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
  lu par le serveur, l'espace pro et le site ; `supportEmail` = `contact@plazo.fr` depuis le 22/10/2026, « configure avec brevo une
  adresse mail contact@plazo.fr » : reçue par le relais `email-worker/` et renvoyée à `FALLBACK_ADDRESS`, envoyée par Brevo), et `company` : la société éditrice, lue par le site seul (pages légales et
  `/suppression-compte`) ; un champ vide s'affiche « [à compléter] » (sauf dans le pied de page, qui l'omet) ; `support`
  (`phone`, `hours`, `responseTime`), `social` (`instagram`, `facebook`, `linkedin`) et `newsletter` (booléen) : pied de page A
  du 15/10/2026, lus par le site, chaque bloc caché tant que sa valeur est vide. **Benford Tech** (15/10/2026, d'après les registres
  publics : Sirene, BODACC et VIES ; Pappers refuse les lectures automatiques) : société par actions simplifiée, siège
  29 chemin des Collines, 38080 L'Isle-d'Abeau, 910 729 102 RCS Vienne, TVA FR55910729102, directeur de la publication
  Joanny Simpore ; Plazo est sa marque, et les conditions générales disent que « Plazo » désigne aussi cette société.
  Restent à fournir par Joanny : capital social, téléphone de l'éditeur, médiateur de la consommation. Changer `company`
  change les trois textes légaux : leurs dates de version bougent avec (`legal.ts`).
- `site/src/lib/legal.ts` : textes des Conditions générales (`/conditions`), des Mentions légales (`/mentions-legales`)
  et de la Politique de confidentialité (`/confidentialite`, durées de conservation reprises du code ; réservations
  anonymisées 12 mois après le retour par le cron de nuit, `backend/src/domain/retention.ts`, `Reservation.anonymizedAt`),
  rédigés d'après le fonctionnement réel (06/10/2026), **projet à faire valider par un juriste** (pages non indexées ;
  le bandeau « Projet, à valider avec un juriste » a été retiré le 13/10/2026 à la demande de Joanny, « enlève ») ; à tenir
  à jour quand une règle change (paiement, annulation, classement, données).
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
  les voyageurs (appareils enregistrés, deux envois par jour au plus, 429 `daily_limit`). **Archivage des loueurs (09/10/2026,
  « archive les parkings suspendus »)** : `Operator.archivedAt` (CHECK : archivé ⇒ suspendu ; migration `operator_archived`, qui
  archive tout loueur suspendu à son déploiement), `POST /internal/platform/operators/:id/archive` (409 `not_suspended`) et
  `…/unarchive`, `GET …/operators?view=archived` (+ `counts`), « Réactiver » désarchive ; Loueurs : pilules « Loueurs · Archivés »
  (`?vue=archives`), « Archiver » sur un loueur suspendu, « Désarchiver » ; les annonces d'un loueur archivé quittent Annonces ;
  rappels, suivi des vols et préparation des files l'ignorent (pas les reversements) ; `DemoSeedService.archive` archive aussi.
  **Mail d'invitation (22/10/2026, « inclure le lien de l'env de démo, les liens stores, la validation Apple en cours »)** :
  `invitationEmail` (`domain/account-messages.ts`) ajoute, sous le bouton « Choisir mon mot de passe », un paragraphe et trois liens :
  « Essayer la démo » (`siteUrl('/pro/demo')`), « Plazo Pro sur Google Play (Android) » (`PLAZO_PRO_PLAY_STORE_URL`, déduit du
  nom de paquet) et « Plazo Pro sur l'App Store (iPhone) » : le lien `PLAZO_PRO_APP_STORE_URL` (variable Vercel à poser dès
  qu'Apple a publié l'app), sinon la mention « validation par Apple en cours, le lien vous sera envoyé dès qu'elle est
  publiée » ; « Renvoyer l'invitation » envoie le même mail ; test `account-messages.test.ts`. **Gabarit aux couleurs de l'espace pro
  (23/10/2026, « mets à jour le template »)** : les mails du loueur (`account-messages.ts` : invitation, confirmation d'adresse,
  fiche, contrat) passent du noir et jaune de la direction B à C-B (fond `#EEF0EE`, carte blanche arrondie, plaque citron
  « Plazo » et « PRO » vert foncé, bouton citron en pilule, titres et liens vert foncé) ; test envoyé à Joanny par Brevo
  (gabarit transactionnel n° 1 « Plazo · Invitation du loueur (test du 23/10/2026) », à supprimer ou garder comme aperçu). **Badges officiels des stores (23/10/2026, « mets les liens derrière des icônes officielles des stores »)** : les deux
  liens des stores sont les badges « Disponible sur Google Play » et « Télécharger dans l'App Store » (PNG dans `site/public/badges/`,
  servis par le site, `badgesBase` = `siteUrl('')` ; `StoreBadge`, `STORE_BADGE_PATHS`), côte à côte sous le lien de la démo ; sans
  adresse App Store, le badge Apple est grisé, sans lien, avec la mention sous lui ; sans adresse du site, liens en texte.
  **« Ouvrir son espace » pendant l'invitation (09/10/2026, « pouvoir commencer à modifier un parking en cours
  d'invitation »)** : le bouton est aussi proposé à côté de « Renvoyer l'invitation » ; la plateforme prépare réglages, plan,
  fiche et tarifs (écritures tracées `view_as.write`), le gérant les retrouve en acceptant ; la colonne Annonce montre la
  fiche préparée. **Suppression d'un loueur (09/10/2026, « pouvoir supprimer un parking »)** : « Supprimer » sur une invitation
  jamais acceptée ou un loueur suspendu (archivé ou non) ; `GET /internal/platform/operators/:id/deletion` (ce qui part :
  `counts` ; `deletable`, `reason`) puis `DELETE /internal/platform/operators/:id` (cascades de la base : parkings, plan, fiche,
  tarifs, réservations, équipe, mails, navettes) ; refusé pour le compte de la plateforme (400 `cannot_delete_platform`), un
  loueur actif qui a servi (409 `not_suspended`) et un loueur avec un paiement en ligne payé, remboursé ou reversé (409
  `has_payments` : comptabilité, l'archiver), sauf une démo ; 409 `payment_in_progress` pendant une attente de paiement, et
  `PaymentService.closeLingeringPayments` ferme d'abord chez Stripe les paiements des attentes échues (intention annulée, page
  expirée ; payé entre-temps → confirmé, le loueur reste) ; effacement sous le verrou des paiements et tracé `operator.deleted`
  dans la même transaction, au journal du loueur de la plateforme (`actingAs.realOperatorId`).
  **Prospection (18/10/2026, « ajoute un outil d'envoi d'email de prospection pour la gestion de la plateforme », choix « A avec
  les relances de B » des maquettes https://claude.ai/artifact/HqTwh9jmTKSJKB5oUNYtpq)** : onglet Plateforme › Prospection
  `/pro/plateforme/prospection` (`ProspectingPage.tsx`, dialogues dans `pages/platform/prospecting/`, `lib/prospecting.ts`) :
  « Importer un CSV » (lu dans le navigateur, colonnes parking, prénom, nom, e-mail, ville, aéroport, téléphone, notes, séparateur
  ; ou , ; aperçu par l'API en `dryRun` : à ajouter, déjà dans la liste, désinscrit, erreur, puis « Importer N prospects »),
  « + Ajouter un prospect », pilules Tous · À contacter · Contactés · Ont répondu · Intéressés · Pas intéressés · Désinscrits
  avec comptages et filtre d'aéroport, tableau (parking et ville, contact et e-mail, aéroport, état, prochain envoi « Relance ·
  21 oct. »), menu par prospect (A répondu, Intéressé, Pas intéressé, Arrêter les relances, Inviter sur Plazo → formulaire
  d'invitation de Loueurs prérempli par `?inviter=1&parking=&prenom=&nom=&email=`, Modifier, Désinscrire, Supprimer ; questions
  par `useConfirm`) ; panneau « Envoyer à N prospects » : la séquence de B (1 Premier contact J0, 2 Relance J+4, 3 Dernier
  message J+10 par défaut, variables `{prénom} {nom} {parking} {aéroport} {ville}`), aperçu pour le premier choisi, « 12 / 50
  aujourd'hui », « M'envoyer un test », « Envoyer à N prospects » (confirmé) ; « Modifier les mails » (objet, message, délai,
  relance éteinte, plafond du jour). Serveur : migration `prospecting`, tables `prospects` (adresse en minuscules unique,
  `source` manual | csv, `status` to_contact | contacted | replied | interested | not_interested | unsubscribed, `step` dernier
  mail envoyé, `nextSendAt`, `firstContactedAt` = J0, `stoppedAt`, `sendingAt` (réservation d'un passage), `failedAttempts`,
  `enrolledById` ; CHECK : rien de prévu pour un prospect fermé), `prospect_messages` (objet, id Brevo, sent | failed, code
  d'erreur ; pas le texte), `prospecting_settings` (ligne unique `default` : étapes JSON, `dailyCap` 50, 1 à 300) et
  `prospect_suppressions` (sha256 de l'adresse, gardé après la suppression du prospect : ni réimport ni envoi) ;
  `domain/prospecting.ts` (variables, échappement HTML, mail avec l'éditeur de `product.json` › `company` et le lien de
  désinscription, fenêtre du lundi au vendredi 09:00–18:00 Europe/Paris, relance N jours après J0 à la même heure remise dans la
  fenêtre, plafond, validation d'un prospect et de la séquence) ; `ProspectingService` + routes
  `/api/internal/platform/prospects…` (`PlatformAdminMiddleware`, écritures tracées `prospect.*` / `prospecting.*` sans adresse
  ni nom) : `sendNow` inscrit les prospects « À contacter » jamais écrits et envoie le mail 1 tout de suite dans la limite du
  plafond du jour (les autres partent à la prochaine ouverture), `runDue` envoie dans la fenêtre et sous le plafond, chaque
  prospect réservé d'abord (`FOR UPDATE SKIP LOCKED` sur `sendingAt`) : deux passages n'envoient jamais deux fois ; une réponse,
  un intérêt, un refus ou une désinscription arrêtent tout ; un refus de Brevo est retenté une heure plus tard, 3 refus
  arrêtent ; mails par Brevo (`NotificationService.emailProspect`) avec `List-Unsubscribe` (https et mailto de la réponse) et
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. Lien public `GET /api/public/prospecting/unsubscribe/:token` (petite page
  avec un bouton, ne désinscrit pas d'elle-même) et `POST` (bouton et désinscription en un clic, RFC 8058) ; jeton = id + HMAC de
  `SECRET_KEY`, comparé à temps constant. Envoi par le passage de 15 minutes de `remind-tomorrow` (dans son propre try/catch, sans
  changer son statut) et `GET /internal/cron/prospecting` ; purge de nuit 3 ans après le dernier contact (ou la saisie).
  **Réglages par défaut, à confirmer par Joanny** : expéditeur `PROSPECTING_SENDER_EMAIL` / `PROSPECTING_SENDER_NAME` (sinon
  `EMAIL_FROM`), réponses à `PROSPECTING_REPLY_TO` (sinon l'administrateur qui a envoyé), téléphone `PROSPECTING_PHONE` sous la signature (19/10/2026, numéro
  français écrit « 07 21 17 75 90 », `displayPhone` ; rien sans lui), prospects saisis à la main ou importés
  d'un CSV fourni (aucune collecte sur les comparateurs), textes des trois mails modifiables (par défaut, depuis le 19/10/2026, à la voix d'une équipe de développeurs : « nous »,
  faits vérifiables seulement, ni années d'expérience ni nombre de clients ; `defaultSteps`). Politique de confidentialité :
  section 11 « Prospection des parkings ». **Gabarit mis à niveau (23/10/2026, « mets à niveau le mail de prospection »)** : `prospectEmail` prend la forme
  des mails du loueur (fond clair, carte blanche, plaque citron « Plazo »), le texte de l'étape gardé tel quel en paragraphes
  (adresses tapées rendues cliquables, `linkify`), un bouton citron « Voir la démo de Plazo » quand l'étape porte `{lien_demo}`,
  la signature, puis **les badges des stores de Plazo Pro** (« avec les liens des apps sur le store », même jour : `proStoreBadges` et
  `storeBadgesHtml` partagés avec l'invitation, `ProspectingService.stores()` ; Google Play cliquable, App Store grisé tant que
  `PLAZO_PRO_APP_STORE_URL` manque ; deux lignes dans la version texte), puis sous la carte la raison, l'éditeur et le lien de
  désinscription.
  **Démo de Plazo Pro pour les prospects (21/10/2026, « mets un environnement de démo de l'app », choix « Prospects (loueurs) »,
  « Plazo Pro seulement », puis « A + B + C » des maquettes https://claude.ai/artifact/PEfDugiJ1UzV5upZcDwHur)** : la démo tourne dans
  l'espace pro web (`/pro/demo`), pas dans un build Flutter. **A** : `DemoEntryPage` (`/pro/demo` pour tous, `/pro/demo/<jeton>` pour le
  lien d'un prospect : « Bonjour <parking> : voici votre démo. », un lien expiré ou inconnu laisse entrer sans compter) : rôle Gérant ·
  Accueil · Chauffeur · Voiturier puis « Entrer dans la démo » (`POST /internal/auth/demo` `{ role, token? }`, `demoLimiter` 30 par
  15 min ; 400 `invalid_role`, 404 `demo_link_unknown`, 410 `demo_link_expired`) ; lien « Essayer la démo » sur la connexion. **B** :
  loueur unique `Operator.prospectDemo` (« Parking des Cèdres (démo) », index unique partiel, migration `prospect_demo`), sans fiche
  publique, semé à la première entrée (`ProspectDemoService.ensure` : 10 files de 12, 3 navettes, tarifs, commissions Allopark 18 % et
  Onepark 20 %, 5 réservations de comparateurs dont 2 sans prix, quatre membres `demo-*@demo.plazo.invalid` au mot de passe aléatoire
  que personne ne connaît), animé par le flux continu du chauffeur (`TestFeedService` accepte ce loueur), effacé et resemé chaque nuit
  par `purge-expired-tokens` (01:00 UTC, `reset`, sessions comprises) ; session marquée `demo` (`config/passport.ts`,
  `user.demo.resetsAt` de `/staff/me`) : `RefuseInViewAs` refuse tout ce qu'il refuse en consultation (équipe, mots de passe,
  paiements, réglages personnels) avec 403 `demo_read_only`, sauf les gestes du chauffeur (`allowDemo`) ; aucun SMS (`sendTravellerSms`
  → `skipped`, code de signature refusé) ni e-mail du contrat ne part (`isProspectDemoOperator`, `services/demo-guard.ts`) ; bandeau
  citron `DemoBanner` « Démo · données fictives · remise à zéro cette nuit » avec « Quitter » (vers `/demo`), carte « À essayer » du
  tableau de bord selon le rôle (`DemoTryCard`). **C** : Plateforme › Prospection, colonne « Démo » : « Créer un lien de démo »
  (`POST /internal/platform/prospects/:id/demo-link` `{ renew? }`, table `demo_links` : jeton de 12 caractères, 14 jours, gardé tant
  qu'il vaut, `opens`, `lastOpenedAt`), « Ouverte N fois · <date> », « Lien valable jusqu'au … », « Lien expiré » → « Nouveau lien »,
  carte du lien avec « Copier » ; `demo` sur chaque prospect de la liste ; variable `{lien_demo}` des mails (le lien du prospect, créé à
  l'envoi ; un exemple dans l'aperçu et le test) ; `GET /public/demo/links/:jeton` (état, nom du parking). Tests
  `prospect-demo.test.ts`, `DemoEntryPage.test.tsx`.
  **Classement par région (19/10/2026, « classe les prospects par région », choix « Groupés par région » + « De l'aéroport »)** :
  le tableau est découpé en blocs repliables, un par région (en-tête « AUVERGNE-RHÔNE-ALPES · 14 », nombre sous les filtres en
  cours ; régions dans l'ordre alphabétique, « Sans région » en dernier ; replis gardés dans le navigateur,
  `plazo:prospects-collapsed-regions`), « Tout cocher dans la région » / « Tout décocher » par bloc (le panneau d'envoi suit la
  sélection), filtre « Toutes les régions » à côté des pilules et de l'aéroport (options : régions qui ont des prospects avec leur
  nombre, puis « Sans région ») ; région affichée sous le code de l'aéroport (« · choisie à la main »). Région = celle choisie à la
  main (`Prospect.region`, migration `prospect_region` avec CHECK des 18 clés), sinon celle de l'aéroport
  (`domain/prospect-regions.ts` : 13 régions métropolitaines + Guadeloupe, Martinique, Guyane, La Réunion, Mayotte ;
  `AIRPORT_REGIONS` ne liste que des aéroports vérifiés : BVA en Hauts-de-France, BSL/MLH en Grand Est, Brive laissé de côté),
  sinon aucune ; formulaire : « Région : Automatique (d'après l'aéroport) | <région> » ; colonne CSV facultative « région »
  (`parseRegion` : nom ou clé, casse, accents, espaces et tirets ignorés, PACA / AURA / IDF ; inconnue → ligne en erreur
  `invalid_region`). API : `region { key, label, manual }` et `regionOverride` par prospect, `regions` (toutes, alphabétiques) et
  `regionCounts` (par clé et `none`, sous le filtre d'aéroport), `?region=<clé>|none` ; les pilules d'état suivent les filtres
  d'aéroport et de région. La liste n'est pas paginée (2 000 prospects au plus, comme avant) : la page reçoit tout ce que
  montrent les filtres et forme les blocs elle-même (`groupByRegion` de `admin/src/lib/prospecting.ts`).
- `site/` : site Plazo voyageurs (Next.js), servi à la racine du domaine. **Référencement (08/10/2026)** : données structurées
  schema.org (`src/lib/structured-data.ts`, composant `JsonLd` : Organization et WebSite sur l'accueil, FAQPage et ItemList des
  parkings sur la page aéroport, ParkingFacility + BreadcrumbList sur une fiche) ; un parking de démo (`isDemo`) n'est ni décrit,
  ni dans le sitemap, et sa fiche est en `noindex` (22/10/2026 : le parking de test de la plateforme, loueur « … (tests) », est servi
  `isDemo` par l'API publique, `isTestOperatorName`, après que la Search Console a listé « Parking test Plazo ») ; liens internes vers l'adresse canonique d'un aéroport (`airportPath` : `/` pour Lyon).
  **C-A « Le guide sur la page Lyon » (08/10/2026)** : titre « Votre parking à l'aéroport de Lyon Saint-Exupéry », guide sous la liste
  des parkings (`src/lib/airport-guides.ts`, composant `AirportGuide` : « Sur cette page », aéroport ou privé avec tableau comparatif
  empilé sur téléphone, prix d'une semaine, navette, voiturier, accès, conseils) et « Questions fréquentes » (4 générales + 5 de Lyon,
  aussi en FAQPage) ; les chiffres (prix d'une semaine, durée de navette) viennent des offres en ligne des seuls parkings réels
  (`guideFacts`), sans parking réel le texte n'en donne aucun ; faits sur l'aéroport relus sur lyonaeroports.com le 08/10/2026.
  **C « technique et vitesse » (09/10/2026)** : la page aéroport et les guides sont en ISR (`revalidate` 300, `generateStaticParams`
  vide : rien au build) sur des lectures d'API partagées (`sharedRead`, sans IP visiteur, cache 300 s ; `api.airport`,
  `api.sharedSearch`) ; plus de `app/page.tsx` : `/` est réécrit vers `/lyon-saint-exupery` et `/lyon-saint-exupery` redirige
  (308) vers `/` (`next.config.ts`) ; `lastmod` des guides dans le sitemap ; `src/app/favicon.ico`.
  **A « 4 200 mots, FAQ balisée » (09/10/2026)** : le guide Lyon fait ~6 400 mots, 14 sections (`GuideSection.parts` pour des
  sous-titres h4, `GuideTable.columns` à N colonnes avec `note` de source), 3 tableaux (aéroport ou privé ; parkings officiels P0 à
  P7 : emplacement, accès, couvert, hauteur ; grille 2026 sans réservation de 24 h à 1 mois) et 19 questions, toutes dans le FAQPage
  avec les 4 générales ; les chiffres de l'aéroport sont dans la constante `LYON_OFFICIAL` (grille tarifaire PDF 2026 et pages
  de lyonaeroports.com relevées le 08/10/2026, revérifiées le 09/10/2026, date citée dans le texte ; **Terminal 2 fermé depuis le
  01/04/2026** : le guide envoie tout le monde au Terminal 1 ; P1 géré par LPA ; les navettes des parkings extérieurs ne déposent
  pas devant l'aérogare (règlement des parcs) ; deux relectures contradictoires, 90 corrections) et ceux des partenaires restent ceux de
  `guideFacts` ; `guideTexts` / `guideWordCount` servent aux tests (≥ 4 200 mots avec ou sans partenaire).
  **Pages guide (09/10/2026, « fais les trois pages guide »)** : route `/[airport]/guide/[topic]` (`TopicGuideView` : fil d'Ariane,
  H1, date de mise à jour, `SearchForm` prérempli, parkings partenaires réels de la page en `ResultCard`, `GuideToc` +
  `GuideSections` niveau h2 partagés avec le guide de l'accueil, FAQ, autres guides ; JSON-LD Article + FAQPage + BreadcrumbList),
  registre `src/lib/guides` (`topics.ts` : slugs `parking-pas-cher`, `parking-longue-duree`, `parking-voiturier` ; `index.ts` :
  `topicGuide`, `topicLinks` ; contenus `lyon-*.ts` qui renvoient un `TopicGuide`), faits des partenaires `topicFacts` (semaine,
  deux semaines pour la longue durée, voituriers), liens « → » depuis trois sections du guide de l'accueil (`GuideSection.more`),
  pied de page et plan du site ; tests ≥ 2 000 mots, ≥ 9 questions, aucun chiffre de partenaire sans partenaire réel. Les parkings de démo
  sont archivés (`DEMO_LISTINGS=archive` : `DemoSeedService.archive` suspend les loueurs `isDemo`, `true` les rétablit).
  **Tags des annonces (14/10/2026, « il faut ces tags sur les annonces de parking » d'après Parkos, puis « mets plus en valeur la
  navette en direct » ; choix « C et L3, avec le filtre, attente déclarée », maquette https://claude.ai/artifact/Jn6SAzsYGLt6VD5GbpxELg)** :
  sur chaque carte de résultat (site `ResultCard` + `ShuttleBox`, app `result_card.dart` + `shuttle_box.dart`), un **encart navette**
  « Navette gratuite » avec deux chiffres TRAJET (`shuttleMinutes`) et ATTENTE MOY. (`Listing.shuttleWaitMinutes`, laissé de côté
  s'il n'est pas déclaré), puis les pastilles « Extérieur » / « Couvert », « Vous devez remettre vos clés » (voiturier) ou « Vous
  gardez vos clés » (« Clés à remettre » / « Clés gardées » sur carte étroite), « Ouvert 24h/24 » (« 24h/24 ») ou « Ouvert
  {horaires} », Clôturé, Recharge, annulation (l'ancienne pastille « 8 min » est dans l'encart) ; **L3 « le trajet en direct »**
  pour un parking `liveShuttle` : dans l'encart, « ● Navette en direct » et « il y a N s », un rail P → avion avec chaque navette
  en route placée à sa vraie progression (distance parking → navette / parking → aéroport, bornée à 5–95 %, 3 au plus, aucune sans
  position ; `site/src/lib/shuttle-rail.ts`, `mobile/…/domain/logic/shuttle_rail.dart`), « Parking » / « Terminal 1 · 5 min »
  (« Terminal 1 » à LYS, sinon « Aéroport »), vide avant la première réponse, « Suivie en direct le jour J » quand rien ne roule ;
  une seule lecture de `GET /public/airports/:slug/live` toutes les 12 s par page (site `AirportLiveProvider` /
  `useSharedAirportLive`, qui ne lit que tant qu'un rail est affiché ; app `ResultsBloc`, seulement en liste avec un résultat
  `liveShuttle` visible ; la carte compacte de l'app garde une ligne « ● Navette en direct » sans rail) ; filtre « Navette en
  direct » (`?direct=1`, point orange devant, comptage) ; fiche parking « L'essentiel » (`trustTiles(listing, airportCode)`) :
  tuiles « Navette en direct » ou « Navette gratuite » (trajet, attente, « suivez-la sur la carte le jour J »), « Extérieur » /
  « Couvert » (sécurité), clés, horaires, annulation, la navette en pleine largeur sur téléphone puis deux par deux, la dernière
  impaire étirée ; « Vers le Terminal 1 » / « Vers l'aéroport » quand la navette n'a aucun chiffre. Serveur :
  `Listing.shuttleWaitMinutes` (migration `listing_shuttle_wait`, CHECK `listings_shuttle_wait_range` 0 à 120 ou nul), « Ma fiche »
  « Attente moyenne de la navette » (minutes, facultatif ; vide ou blanc = non déclaré, `UpdateListingDto` ; absent du PUT =
  inchangé), relu par la plateforme (« Attente moy. N min »), dans toutes les fiches publiques (`PublicService.summary`) et dans les
  faits de la « Présentation » par Claude ; aperçu de « Ma fiche » avec les mêmes tags (`admin/src/lib/listing-tags.ts`).
  **Pied de page A (15/10/2026, « ajoute ça pour plazo » d'après le pied de page d'Allopark ; maquettes « A · Bande d'aide » de
  https://claude.ai/artifact/85y2fNCrSbe86BcvZXJ2Gf)** : sur le fond ivoire, au-dessus du pied de page espresso, la carte blanche
  « Besoin d'aide ? » (`HelpCard` : « Une question sur votre réservation ? », note crème « Le jour du départ, appelez directement le
  parking… », tuile « Par téléphone » avec « Appeler » en `tel:`, tuile « Par écrit » avec « Nous écrire » vers `/contact` ; trois
  colonnes dès `lg`, une ligne par moyen sur téléphone et la note en dernier ; pas reprise sous le formulaire de `/contact`,
  `HiddenOn`) ; puis le pied de page (`SiteFooter`) : logo et accroche, colonnes Aéroports · Voyageurs · Plazo (« Se connecter à
  l'espace loueur » vers `/pro/login`, `PRO_LOGIN_PATH` ; sur téléphone la colonne Plazo sur toute la largeur, liens deux par
  deux), rangée « Paiement sécurisé » (pastilles CB · Visa · Mastercard · Apple Pay · Google Pay, jeton `--color-visa`, « Payé en
  ligne à la réservation, par Stripe. Rien à régler au parking. »), « Suivez-nous » (boutons ronds de 44 px), « La lettre Plazo »
  (`NewsletterForm` : e-mail et « S'inscrire » ; la phrase « En vous inscrivant, vous acceptez de recevoir la lettre Plazo par
  e-mail ; votre adresse ne sert qu'à cela. » fait de l'envoi l'accord, `consent: true`, que Brevo fait confirmer par e-mail),
  ligne légale « © <année> Benford Tech · Tous droits réservés » avec forme sociale, RCS et TVA de `product.json` › `company`
  (`legalLine`, champ vide omis, année à l'heure de Paris). **Ce qui dépend de faits pas encore donnés vient de `product.json` et
  reste caché tant que c'est vide** (`lib/footer.ts`, `footerConfig`) : `support.phone` (tuile téléphone, 6 chiffres au moins),
  `support.hours` (sous le numéro et après « Notre équipe vous répond » : l'écrire « Du lundi au vendredi, de 9 h à 18 h »),
  `support.responseTime` (« Réponse par e-mail sous 48 h. », sinon « Réponse par e-mail. »), une vraie `supportEmail`
  (`hasSupportEmail` : tuile écrite, lien « Nous contacter », formulaire), `social.*` (adresses https seulement, `socialUrl`) et
  `newsletter: true` ; sans téléphone ni adresse, la carte garde son titre, un texte court, la note et deux liens discrets
  « Retrouver ma réservation » et « Questions fréquentes ». `/contact` (`ContactView`, `ContactForm`, non indexée) : prénom et nom,
  e-mail, référence facultative, message de 10 à 2 000 caractères, champ piège `website`, confirmation qui prend le focus ; sans
  vraie adresse, « Le formulaire de contact arrive bientôt » avec « Ma réservation » et la FAQ. `/lettre/confirmee` : retour du
  lien de confirmation de Brevo (non indexée). Les deux formulaires passent par des actions serveur (`lib/contact-actions.ts` →
  `api.contact` / `api.newsletter`, `POST /public/contact` et `/public/newsletter`) qui portent la clé du site et l'adresse du
  visiteur jusqu'aux limites de l'API ; rien de ce qui est tapé n'est journalisé. `organizationLd` ajoute `sameAs` et
  `contactPoint` une fois configurés. Relecture : la destination est fixe (`supportEmail`), le visiteur n'est qu'en Reply-To, nom
  nettoyé des caractères qui font une liste d'adresses (`replyToName`) ; la lettre répond 202 même au-delà de 3 demandes par jour
  pour une boîte (`newsletterAddressKey` : sous-adresses `+…` et points de Gmail ramenés à la même boîte), et un refus de Brevo qui
  nomme le modèle ou la redirection (modèle inactif) répond 502 `newsletter_failed` au lieu d'un faux succès. **Mail du formulaire de
  contact mis à niveau (23/10/2026, « mets à niveau le mail de contact »)** : `contactEmail` (`domain/contact.ts`) prend la forme des
  mails du loueur, aux couleurs du site : plaque orange « Plazo » et libellé « Formulaire de contact », titre « Nouveau message
  de <nom> », lignes Nom · E-mail · Réservation · Envoyé le, le message dans un encart, bouton orange « Répondre à <nom> »
  (`mailto:` avec l'objet « Re: votre message à Plazo · <référence> »), rappel que répondre au mail écrit au visiteur (Reply-To). Politique de confidentialité (formulaire envoyé par e-mail au service client, pas gardé
  au-delà ; lettre chez Brevo, double confirmation, gardée jusqu'à la désinscription en un clic, puis marquée désinscrite chez
  Brevo) et conditions générales (le
  formulaire à côté de l'adresse du service client, dès qu'elle est réelle) mises à jour.
- **Tarifs de Plazo Pro (27/10/2026, « le site de plazo pro doit ressembler à » la page Tarifs de Solution Park ; maquette
  https://claude.ai/artifact/S4fcSrSC28DS8UMSwwdcJ3 validée, « garde ces prix pour l'instant »)** : page `/loueurs/tarifs` du site
  (`site/src/app/loueurs/`, sa propre mise en page aux couleurs de l'espace pro : jetons `pro-*` et `lime*` de `globals.css`, Inter et
  Archivo Narrow posés par `loueurs/layout.tsx` ; l'en-tête et le pied de page des voyageurs sont cachés sous `/loueurs` par
  `HiddenOn prefixes`) : formules Essentiel 79 €, Opérations 149 € (recommandée), Complet 229 € HT par mois, « Annuel −10 % »,
  fiche sur Plazo à 15 % par réservation payée (exemple 60 € → 51 €), options (mise en route 290 € une fois, 1 000 SMS 49 € une fois,
  page de réservation 29 €/mois, deuxième parking « Bientôt »), récapitulatif collant avec le total (barre en bas sur téléphone),
  sélection gardée dans le navigateur (`plazo:pro-pricing`), « Essayer la démo » (`/pro/demo`), « Inscrire mon parking »,
  « Demander un devis » (`quoteAction` : la sélection relue depuis ses identifiants, envoyée par `POST /public/contact` à
  `supportEmail`). Prix et contenu dans `site/src/lib/pro-pricing.ts` (`quote`, `selectionSummary`) ; « Vous êtes un parking ? »
  (en-tête et pied de page) mène à cette page ; dans le plan du site. Prix provisoires, à confirmer par Joanny.
- **Accueil de Plazo Pro (27/10/2026, « un vrai site Plazo Pro avec page d'accueil », « inspire-toi de Solution Park », « ne montre
  pas les moyens techniques mis en place » ; maquette https://claude.ai/artifact/XBPQJUEg1qcto8MCwj7woY, « Go »)** : page `/loueurs`
  (`site/src/app/loueurs/page.tsx`, `components/loueurs/ProHome.tsx`, textes `fr.proHome`) sur le déroulé de la page d'accueil de
  Solution Park : bande vert foncé « Le logiciel des parkings d'aéroport » avec « Essayer la démo » et « Construire mon offre », trois
  faits vrais (6 comparateurs reconnus, 4 postes, web · iPhone · Android) et un téléphone ; les quatre produits en alternance (Logiciel,
  Application Plazo Pro, Vendre sur Plazo, Contrat et état des lieux ; ancres `#logiciel`, `#application`, `#vendre-sur-plazo`,
  `#contrat`, « L'essayer dans la démo ») ; « Centralisez vos réservations » avec les canaux et trois gains ; « Fait sur le terrain »
  (client n°1 jamais nommé) ; « Construisez votre offre » (`PRO_PLANS`) ; « Un renseignement ? » : `QuoteForm` sans sélection
  (`request=demo`, « Demande de démo Plazo Pro » envoyée par `quoteAction` à `supportEmail`) ; barre « Essayer la démo » collée en bas
  sur téléphone. Ce que le parking gagne, jamais comment Plazo le fait ; ni avis, ni nombre de clients. En-tête des pages `/loueurs` :
  Logiciel · Application · Vendre sur Plazo · Contrat et état des lieux · Tarifs ; pied de page Solutions · Commencer · Plazo ; chaque
  page pose sa largeur (`main` pleine largeur). « Vous êtes un parking ? » (en-tête et pied de page voyageurs) mène à `/loueurs`
  (`PRO_HOME_PATH`), au plan du site aussi.
  **Navette en direct et messages des clients (27/10/2026, « mets en avant la carte avec le suivi navette, la communication avec le
  parking », choix « A et B » des maquettes https://claude.ai/artifact/QgoMEx8FgeqMt4mv6LpLvC)** : **A** la carte dessinée
  (`components/loueurs/LiveShuttleMap.tsx`, SVG et non des tuiles : parking « P » au halo citron, route vers le Terminal 1, navette
  « Karim · 3 pers. » qui roule, `.pro-bus` immobile en `prefers-reduced-motion`, « Terminal 1 · 7 min », pilule « En direct ») remplace
  le téléphone de la bande d'accueil, avec deux messages de clients par-dessus (dessous sur téléphone) ; **B** bande sombre « Vos
  clients ne vous appellent plus » juste après (`#navette-et-clients` : la carte, « Ce que reçoit votre équipe » avec quatre messages
  `MessageCard`, quatre bénéfices sur fond blanc) ; le menu « Application » devient « Navette et clients ». Aucun mot technique (ni GPS,
  ni SMS, ni suivi de vol : test `ProHome.test.tsx`).
  **pro.plazo.fr (27/10/2026, « Le site pro est sur pro.plazo.fr »)** : domaine ajouté au projet Vercel `plazo` ; sur cet hôte,
  `/` sert `/loueurs` et `/tarifs` sert `/loueurs/tarifs` (réécritures `has: host` de `next.config.ts`, `PRO_HOST`), `/pro` et `/api`
  restent les autres services. Les liens, l'adresse canonique et la redirection 308 de `/loueurs` vers pro.plazo.fr ne basculent
  avec `NEXT_PUBLIC_PRO_SITE_URL=https://pro.plazo.fr` (variable Vercel de production, posée le 27/10/2026 ; sans elle, tout reste
  sous `/loueurs`). DNS (« Fais le », 27/10/2026) : CNAME `pro` → `cname.vercel-dns.com`, sans proxy, posé par le workflow GitHub
  « Cloudflare DNS record » (`cloudflare-dns.yml`, `.github/scripts/cloudflare_dns.py`, à la main : `CLOUDFLARE_DNS_TOKEN` de
  l'environnement Production s'il existe, sinon le jeton Workers `CLOUDFLARE_API_TOKEN` ; jamais un enregistrement d'un autre type
  remplacé). **En-tête des voyageurs caché sur pro.plazo.fr (28/10/2026, « Enlève le bandeau plazo en haut »)** : là, le chemin est
  « / », que `HiddenOn` ne reconnaît pas ; la mise en page des loueurs porte `data-pro-site` et `globals.css` cache l'en-tête et le
  pied de page des voyageurs (`data-traveller-chrome` du layout racine) par `body:has([data-pro-site])`, sans rendre les pages dynamiques.
  **Favicon vert (28/10/2026, « le favicon doit être vert pour Plazo Pro »)** : les pages `/loueurs` déclarent le panneau citron de
  l'espace pro (`metadata.icons` de `loueurs/layout.tsx` : `site/public/brand/favicon-pro.svg`, `favicon-pro.ico` 16/32/48,
  `apple-touch-icon-pro.png`, copies de `brand/favicon-pro*`) et, sur pro.plazo.fr, `/favicon.ico` est réécrit vers
  `/brand/favicon-pro.ico` (`next.config.ts`) : le lien du favicon racine et la demande propre des navigateurs y reçoivent le vert.
  **Audit SEO (28/10/2026, « utilise le skill seo-audit »)** : pro.plazo.fr a son `robots.txt` et
  son `sitemap.xml` (la page d'accueil et `/tarifs`, `isProHost` de `lib/pro-host.ts` dans `robots.ts` et `sitemap.ts`) ; toute autre
  page demandée sur pro.plazo.fr (pages des voyageurs, `/a/…`) part en 308 vers son adresse sur www (`next.config.ts`, fichiers et
  `_next` exclus, jamais si www était pro.plazo.fr) ; titres « Logiciel de gestion de parking d'aéroport · Plazo Pro » et « Tarifs du
  logiciel de parking d'aéroport · Plazo Pro », descriptions sous 160 caractères, `og:site_name` « Plazo Pro » (`proOpenGraph`) ;
  JSON-LD `SoftwareApplication` avec les trois formules HT (`proSoftwareLd`) sur l'accueil et les tarifs, plus un `BreadcrumbList` sur
  les tarifs ; test `pro-seo.test.ts`. **Carte de partage verte (28/10/2026, choix « 1A » des maquettes
  https://claude.ai/artifact/CgbGFAaeD43sga93Np8hSm)** : les pages Plazo Pro s'affichent dans les aperçus de lien (WhatsApp, LinkedIn,
  mail) avec leur carte 1200 × 630 : bande vert foncé, plaque citron « Plazo PRO », « Le logiciel des parkings d'aéroport », la petite
  carte de la navette vers le Terminal 1 et « pro.plazo.fr » (`brand/social-card-pro.html`, rendue par `brand/tools/social-card-pro.mjs`
  en `brand/png/social-card-pro-1200x630.png` et `site/public/brand/social-card-pro.png` ; `PRO_SOCIAL_CARD` de `lib/seo.ts`, posée
  par `proOpenGraph`) ; le site voyageurs garde sa carte orange. **FAQ et pages par sujet (28/10/2026, « Fais la FAQ et les autres », choix 2A et 3A des mêmes maquettes)** : sur
  l'accueil, « Questions fréquentes » avant « Un renseignement ? » (`ProFaq` : `<details>` natifs, la première ouverte, réponses
  dans le HTML ; six questions `fr.proHome.faq` en `FAQPage`) ; trois pages `/navette`, `/voiturier`, `/comparateurs` sur
  pro.plazo.fr (`app/loueurs/[topic]/page.tsx`, `dynamicParams` faux, `ProTopicView` : bande vert foncé avec fil d'Ariane, le
  problème et ce qui change, trois écrans dessinés, quatre sections, FAQ, « À lire aussi », démo ; textes ~1 000 mots dans
  `lib/pro-topics.ts`, vrais faits seulement, aucun mot technique ; JSON-LD `BreadcrumbList` + `FAQPage`) ; `PRO_TOPIC_SLUGS` /
  `proTopicPath` de `lib/site.ts` ; `next.config.ts` : réécriture sur l'hôte pro, 308 de `/loueurs/<sujet>`, sujets exclus du
  renvoi vers www ; sitemap de pro.plazo.fr ; menu « Logiciel · Navette · Voiturier · Comparateurs · Contrat et état des lieux ·
  Tarifs » (le pied de page garde « Vendre sur Plazo ») et liens « En savoir plus › » depuis l'accueil. Tests `pro-topics.test.ts`,
  `ProTopicView.test.tsx`, `ProHome.test.tsx`.
- `email-worker/` : relais des mails entrants (Cloudflare Email Worker, `postal-mime`) : Email Routing lui passe chaque mail de
  `plazo.fr` (règle « catch-all » du domaine principal), il le poste sur l'API ; déployé par GitHub Actions (`email-worker-ci.yml`,
  job `deploy`, environnement GitHub Production : secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `INBOUND_EMAIL_SECRET`, variable `FALLBACK_ADDRESS` ; rien dans le tableau de bord Cloudflare, qu'un déploiement écrase ; Worker `plazo`) ; mise en place dans son README. **Le lien Git de Cloudflare (Workers Builds) n'est plus branché (vérifié le 23/10/2026)** : quand il l'était, chaque fusion sur `main` déployait un Worker sans gestionnaire de mails (« Destination worker not found », mails refusés du 14/10 19:02 au 15/10 08:02 UTC) ; ne pas le rebrancher (Workers & Pages › `plazo` › Settings › Build). `email-worker-ci.yml` ne redéploie plus que sur un push qui touche le relais (plus d'attente de 3 min) et vérifie toujours toutes les heures que le Worker en ligne a ses gestionnaires `email` et `scheduled` (`.github/scripts/worker_health.py`), sinon il le redéploie. **`FALLBACK_ADDRESS` = l'adresse Gmail de Joanny depuis le 23/10/2026** (variable de l'environnement GitHub Production, destination vérifiée dans Email Routing) : `contact@plazo.fr` et les adresses qui ne sont à aucun parking y sont transférées.
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
  nom du produit recopié depuis `product.json` par `tool/sync_product.dart`, builds par `codemagic.yaml` (racine du dépôt, `working_directory: mobile`). **Pipelines de publication (07/10/2026, revus le 09/10/2026 :
  Codemagic retenu par Joanny, avec les comptes de Thempo, LoveNest et Yoon)** : Plazo rejoint **le compte Codemagic** qui publie
  Thempo (11/10/2026 : le **compte personnel** de Joanny, sans équipe, apps `tempo-app`, `lovenest-frontend`, `yoon` ; 500 minutes
  gratuites par mois sur Mac mini M2, un seul build à la fois, Linux seulement avec la facturation, compteur et « Enable billing »
  sur codemagic.io/billing/user ; réglages sous Teams › Personal account ; **`xcode: 26.5` épinglé le 11/10/2026** dans
  `env_versions_android` : la version d'Xcode choisit le pool de Mac mini M2 même pour Android, et celui de l'image par défaut
  26.6 était saturé depuis le 08/10/2026, builds en file plus d'une heure sans incident déclaré, discussion codemagic-ci-cd
  #3570 ; à remettre en `latest` plus tard) et signe comme lui (intégration Developer Portal `lovenest-asc` de l'équipe Apple Benford Tech `3BX4795V2Y` ;
  `ios_signing` avec le certificat Apple Distribution déjà téléversé, Apple n'en acceptant que 3 ; clé d'import
  propre à Plazo créée par le workflow GitHub `android-keystore.yml` (« Android keystore (Plazo upload key) », 11/10/2026 :
  mot de passe aléatoire, rien ne passe par une conversation) et envoyée par `.github/scripts/codemagic_keystore.py` avec
  l'API v3 de Codemagic (jeton en secret GitHub `CODEMAGIC_API_TOKEN` ; pas d'API pour les Code signing identities) dans le
  groupe de variables Secure `plazo_android_signing` de l'app (`CM_KEYSTORE` en base64, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`,
  `CM_KEY_PASSWORD`, décodées par l'étape `key.properties` ; `android_signing: [plazo_upload]` reste possible si la clé est
  un jour téléversée à la main), puis build `mobile-release-android` lancé ; le groupe `mobile_secrets` est créé vide s'il manque, Codemagic refusant un
  build dont un groupe n'existe pas ; artefact d'un jour pour le gestionnaire de mots de passe ; refus de remplacer une clé
  déjà envoyée sans la case « replace » ; jamais de base64 collé à la main ; **`codemagic-build.yml` « Codemagic build
  (start, status, groups) »** (`.github/scripts/codemagic_build.py`, client commun `codemagic_api.py`) : `start` d'un
  workflow sur une branche, `status` d'un build (état, artefacts ; étape rouge si le build a échoué), `steps`, `logs` (13/10/2026 :
  fin du journal des étapes en échec et des envois aux stores, lue dans `buildActions[].subactions[].logUrl` de l'API v1), `cancel` (API v1),
  `groups` (noms des variables seulement), `ensure-group`, `team` (pourquoi un build attend : dernier build de chaque app du
  compte), `mapping` (15/10/2026 : les noms masqués d'un avertissement Google Play, « u41.Q go3.e », retrouvés dans le
  `mapping.txt` des builds récents) : c'est par là que Claude suit et relance les builds Codemagic ; compte Google Play Benford Tech et, depuis le
  13/10/2026, le compte de service créé pour Yoon (projet Google Cloud `yoon-beige`), dont la clé JSON se colle aussi dans le
  groupe `mobile_secrets` de l'app `plazo` sous le nom de Yoon, `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` (lu par `codemagic.yaml`
  à défaut de `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` ; Codemagic ne copie pas un secret d'une app à l'autre)) ; **un seul workflow `mobile-release` (11/10/2026, « unifie le pipeline »)** à la place des quatre d'avant (un par
  store et par app) : tag `mobile-v…` ou manuel (version calculée seule depuis le 21/10/2026) ; vérifications une fois,
  puis pour chaque flavor AAB + APK signés et IPA signé, les quatre paquets sous la même version et le même numéro de build
  (compteur Codemagic + 100, jamais sous le dernier des quatre stores) ; `ios_signing` par Reference name (certificat
  `thempo-distribution`, profils `plazo_app_store` et `plazo_pro_app_store`, un `bundle_identifier` automatique ne prenant
  qu'une app), `xcode-project use-profiles` puis un export options plist par app (PlistBuddy) ; envois par les outils en ligne
  de commande (`google-play bundles publish --track $PLAY_TRACK [--draft]` par AAB, `app-store-connect publish` par IPA,
  `TESTFLIGHT_BETA_GROUPS` pour la relecture bêta, absente par défaut car Codemagic refuse une variable vide), chacun tenté (`ignore_failure` ;
  chaque AAB renvoyé une fois 60 s après un échec, 13/10/2026 : une modification faite dans la Play Console pendant l'envoi l'annule), « Bilan de la publication » en erreur si
  l'un a échoué ; plus de bloc `publishing:` (il n'envoie qu'une app et doublerait l'envoi) ; App ID OneSignal dans le fichier,
  `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` seul secret du groupe `mobile_secrets`) ; **publication en production (21/10/2026, « les pipelines doivent
  publier en production avec release note »)** : Google Play piste `production` sans brouillon, App Store : TestFlight puis
  revue et sortie dès l'accord (`APP_STORE_SUBMIT`, `APP_STORE_RELEASE_TYPE` `AFTER_APPROVAL`, `--cancel-previous-submissions`,
  IPA envoyés d'abord sans attendre puis soumis avec `--skip-package-upload`, 20 min d'attente du traitement, `max_build_duration` 120, le maximum de Codemagic) ; **pipeline raccourci (21/10/2026, « essaie de raccourcir la durée du pipeline »,
  d'après le build de 42 min du 13/10)** : plus de cache (sa sauvegarde prenait 8 min, sa lecture ne trouvait rien), plus de
  `flutter analyze` / `flutter test` dans les builds de publication (déjà faits par `mobile-ci.yml`, seul `sync_product --check`
  reste, ancre `release_checks`), APK seulement avec `BUILD_APK` `"true"` (les stores ne prennent que l'AAB), notes de version en français par app dans
  `mobile/release-notes/plazo.txt|plazo-pro.txt`, à tenir à jour avec chaque changement des apps (500 caractères au plus,
  « Nouveautés » fr-FR des deux stores ; absentes ou trop longues → arrêt avant les builds) ; **version calculée seule**
  (« les versions se mettent à jour automatiquement ») : `MAJEUR.MINEUR` de `pubspec.yaml` + le numéro de build
  (`--build-name`, ex. 1.0.131), le tag `mobile-v…` ne fait plus que lancer la publication ; **`mobile-release-android` (11/10/2026,
  « un build Android seul pour le Play Store »)**, à la main : la moitié Android de `mobile-release` (étapes partagées par des
  ancres YAML de `definitions.scripts`, variables `android_vars`), sans `ios_signing` ni intégration `lovenest-asc`, donc
  lançable avant les profils Apple (premier envoi Google Play) ; `mobile-check` à la main seulement, les vérifications de chaque modification
  tournant sur GitHub Actions (`mobile-ci.yml`, gratuit, les minutes gratuites du compte étant comptées) ; marche à suivre
  `mobile/publier-sur-les-stores.md` ; **fiches des stores** `mobile/fiches-stores.md` (11/10/2026, « crée l'app sur les
  stores ») : textes, confidentialité, notes de revue et visuels des quatre fiches, rédigés d'après le code et relus contre
  lui, section 0 = ce qui reste à régler avant la revue (parking en ligne, e-mail de support, compte de revue et suppression
  de compte dans Plazo Pro, politique de confidentialité, textes iOS par flavor…) ; **visuels Google Play** (11/10/2026,
  « Image de présentation 1 024 × 500, icône 512 × 512 ») dans `brand/stores/` : deux images de présentation par app
  (A : aplat orange ou citron avec le P et l'avion ; B : le fond de l'app, la tuile de l'icône, une pilule), au choix de
  Joanny, et les icônes 512, rendues par `brand/stores/tools/build.mjs` (Chromium, polices de l'app embarquées en data URI)
  et `finish.py` ; **captures téléphone** (11/10/2026, « Captures d'écran pour téléphone ») dans `brand/stores/screenshots/`
  (sept par app en 1080 × 1920, et dans `app-store/` en 1320 × 2868 pour l'iPhone 6,9" de l'App Store, `DEVICE=iphone` de
  `capture.mjs`, 11/10/2026, et dans `app-store-6.3/` en 1206 × 2622 pour l'iPhone 6,3", `DEVICE=iphone63`, 13/10/2026, et dans `app-store-ipad-13/` en
  2064 × 2752 pour l'iPad 13", `DEVICE=ipad13`, 13/10/2026, les apps étant déclarées iPad ; `DEVICES` de `run.sh` choisit les passes) prises sur les vraies apps construites pour le web par `brand/stores/tools/screenshots/run.sh`
  (base neuve `…_shots` avec les données de démo, API à 14:05 au parking par `fake-clock.cjs`, journée préparée par
  `scenario.mjs` et `stage.sql`, Chromium piloté par `capture.mjs`), ou par le workflow GitHub `store-screenshots.yml`
  (artefact) ; **images commerciales** (13/10/2026, « il faut plutôt des images d'illustration commerciale », choix A « aplat de
  marque avec le texte qui ressort mieux ») dans `brand/stores/marketing/A/{plazo,plazo-pro}/{appstore69,appstore63,play,ipad13}/` (iPad : les captures iPad dans un cadre de tablette) : chaque
  capture 6,9" dans un téléphone dessiné sous un titre Manrope 800 blanc sur l'orange (Archivo Narrow vert foncé sur le citron
  pour Plazo Pro) et une ligne dans la couleur la plus foncée, par `brand/stores/tools/marketing.mjs` (titres repris des fiches,
  relus contre le code, deux lignes au plus, signalé sinon) ; **en-tête et résultats de recherche de l'App Store** (13/10/2026) dans
  `brand/stores/creative/{plazo,plazo-pro}/` (`header-3840x1646.png` 21:9, `search-3840x2560.png` 3:2, PNG opaques), même style A,
  icône et titre dans la zone sûre centrée des gabarits d'Apple (1646 × 661 et 2168 × 1030, `SAFE=1` la dessine), deux téléphones
  aux vraies captures en décor sur les côtés, par `brand/stores/tools/creative.mjs` ; **fiches sans Lyon** (13/10/2026, « l'app n'est pas réservée
  qu'à l'aéroport de Lyon ») : aucun aéroport nommé dans les textes des stores, aucun autre promis ; **données fictives du parking de test** (12/10/2026, « crée des données factices sur le parking de test », pour filmer
  les vidéos du service de premier plan) : workflow `test-parking-data.yml` (`fill` / `clear`, à la main) et
  `.github/scripts/test_parking_data.py`, qui se connecte à l'API de production avec les secrets GitHub `PLAZO_TEST_EMAIL` /
  `PLAZO_TEST_PASSWORD` (un membre Accueil de « Plazo (tests) », jamais un gérant, qui pourrait réinitialiser le mot de passe du
  super admin ; refus de tout autre loueur), termine un trajet resté en cours, met le suivi
  sur « Équipe et clients » et ajoute une navette si aucune n'est en service (avec un compte gérant ; avec un compte Accueil,
  avertissement seulement) et place 8 réservations fictives autour de l'heure du
  lancement (plaques `TS-101-PZ` à `TS-108-PZ` retrouvées et remises à l'heure à chaque passage, sans doublon ; 06 39 98, aucun
  e-mail, SMS de la veille désactivé) ; **flux continu pour le chauffeur (15/10/2026, « ajoute en continu des données de tests pour le chauffeur pour qu'il ait toujours des personnes à emmener »)** : sur « Plazo (tests) » seulement (nom en « (tests) », un membre actif de `PLATFORM_ADMIN_EMAILS`, ni démo, ni suspendu, ni archivé ; table `test_feeds`, allumé d'office), le serveur réapprovisionne lui-même 40 réservations fictives `TS-201-PZ` à `TS-240-PZ` (`externalReference` `TEST-FEED-…`, créées une fois annulées et datées de 7 jours, puis recyclées par Prisma, jamais par `ReservationService.create` : ni push, ni récapitulatif, ni SMS, ni mail, ni vol) à la lecture des listes du chauffeur (`departures`, `pickups`, `forecast.day`, `planning` → `TestFeedService.maybeRun`, au plus toutes les 3 min, réservé par `test_feeds.ranAt`) : 3 à 8 voyageurs « À emmener » (vagues espacées de 45 à 90 min, de 90 à 150 min la nuit, ≤ 8 places), 2 retours dans les 2 h et 4 « À récupérer », pointage « Sur place » 0 à 10 min après l'heure d'arrivée, « Retour demandé » 20 min avant pour un voyageur sur deux, « Rendu » 45 min après « De retour au parking », séjours d'au moins 25 h (personne dans les deux listes), au plus la moitié de la capacité réservable, 30 écritures par passage (12 gardées pour remplir les listes) et 8 arrivées refaites par heure (une de plus quand personne n'est à emmener) ; il ne démarre ni ne termine aucun trajet et ne touche ni un passager d'un trajet en cours ou terminé depuis moins de 10 min, ni une réservation verrouillée par une autre écriture (`SKIP LOCKED`) ou modifiée par quelqu'un depuis moins de 10 min, et ne fait sortir personne d'une liste (`domain/test-feed.ts`, `planFeed`) ; `GET/PUT /internal/test-feed`, `POST /internal/test-feed/run`, actions `feed-status`, `feed-on`, `feed-off`, `feed-run` du workflow ; `TEST_FEED=off` coupe tout ; `fill` ne termine plus que les trajets qui portent une réservation `TS-1xx` ; `smsRecipient` refuse la tranche 06 39 98 ; une plaque reprise ne garde rien de son séjour d'avant (téléphones enregistrés et signaux d'arrivée effacés, lien de gestion révoqué par `manageTokenVersion`, données personnelles retirées de son historique), l'historique écrit par le flux est effacé après 7 jours, un passage ne fait plus rien si le flux a été éteint entre-temps, `feed-on` déjà allumé ne relance pas le budget horaire, et un loueur qui a eu le flux garde `GET`/`PUT … { enabled: false }` même renommé ; **polices de l'app variables** (11/10/2026 : `Manrope.ttf` était l'instance statique ExtraLight et
  `ArchivoNarrow.ttf` / `JetBrainsMono.ttf` des Regular statiques, tout le texte de l'app voyageur sortait en très fin et
  les titres de Plazo Pro sans gras ; remplacées par les polices variables de Google Fonts, `wght` 200–800, 400–700,
  100–800, que `_font` de `theme.dart` règle déjà) ; carte de l'accueil Rechercher cadrée avec une marge de 108 / 120 px
  (120 / 170 laissaient 50 px pour les parkings et la carte montrait toute la région). Le nom iOS vit dans
  `APP_DISPLAY_NAME` des configurations Xcode (mis à jour par `sync_product.dart`) ; Google Pay suit la clé Stripe servie
  (`pk_live_` = production).
  **Android 15 de bord à bord (15/10/2026, avertissements de la Play Console sur le build 114)** : `MainActivity.kt` appelle
  `enableEdgeToEdge()` après `super.onCreate`, `bootstrap.dart` met `SystemUiMode.edgeToEdge` (Android seulement), `app.dart`
  pose `appSystemUiStyle` (barres transparentes, icônes foncées ; `find_car_page` en icônes claires) ; les feuilles ajoutent
  `MediaQuery.paddingOf(context).bottom` sous leur dernier bouton, les pages poussées et les coquilles des deux apps sont en
  `SafeArea(top: false…)` ; tests `*_edge_to_edge_test.dart` avec `test/helpers/system_bars.dart` ; workflow
  `mobile-android-emulator.yml` (APK release R8, émulateurs API 35 et 36, gestes puis trois boutons avec encoche, captures,
  feuille Stripe par `lib/stripe_smoke_main.dart` en clé de test, rapport R8 ; `tool/emulator/`). Les API obsolètes citées
  sont dans AndroidX, Flutter et Stripe, le décodage d'images dans OneSignal (images de notification, jamais envoyées), et
  le faible taux R8 vient de la règle `-keep class com.stripe.** { *; }` de flutter_stripe, gardée exprès (3D Secure) ;
  détail dans `mobile/publier-sur-les-stores.md`.
  **Soumettre sans reconstruire (29/10/2026, Plazo Pro 1.0.123 « KO App Store » : l'IPA était sur TestFlight, mais Apple annulait encore l'ancienne soumission, 409 « pre-release build could not be added »)** : workflow Codemagic `mobile-submit-app-store` (à la main, `SUBMIT_APPS` = `plazo-pro` par défaut, ou `plazo plazo-pro`) : dernier build TestFlight de chaque app soumis à la revue (`builds submit-to-app-store`, version `MAJEUR.MINEUR.<numéro>`, notes de version, trois essais à 3 min d'écart), sans rien construire ; lancé par `codemagic-build.yml` › `start`. Le numéro ne monte qu'à un nouveau build : relancer le bilan d'un build ne le change pas.
  **Pipeline des stores sur GitHub Actions (23/10/2026, « Refais le pipeline codemagic dans github avec la publication sur les
  deux stores » ; Codemagic répondait 402 « Billing error »)** : `.github/workflows/mobile-release.yml` « Mobile release (Google
  Play + App Store) », tag `mobile-v…` ou à la main (stores, piste Google Play, brouillon, revue Apple et sortie, APK,
  `ios_create_signing`) : `prepare` (version `MAJEUR.MINEUR` + numéro au-dessus des quatre stores et de Codemagic, run + 300 ;
  notes de version vérifiées), `android` (Ubuntu, clé d'import ouverte par `keytool` avant le build, AAB signés → Google Play),
  `ios` (macos-26, Xcode 26.6, `app-store-connect fetch-signing-files` + `keychain` + `xcode-project use-profiles`, Sign in with
  Apple selon le profil, schéma d'URL Google, IPA → TestFlight puis revue) ; outils Codemagic (`codemagic-cli-tools` 0.70.0) ;
  secrets et variables de l'environnement GitHub `stores` (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
  `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `APP_STORE_CONNECT_ISSUER_ID` / `_KEY_IDENTIFIER` / `_PRIVATE_KEY`,
  `IOS_CERTIFICATE_PRIVATE_KEY` ; variables `GOOGLE_SERVER_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`…), pas à pas dans
  `mobile/publier-sur-les-stores.md` ; Codemagic ne se déclenche plus sur les tags. `android-apks.yml` (même jour) : APK
  release des deux apps signés avec une clé de debug, à installer à la main.
  **Tutoriels (21/10/2026, « des tutoriels à afficher à la première connexion et à souhait pour Plazo et Plazo Pro », choix
  A + B des maquettes https://claude.ai/artifact/GmDEYEEhFy9ETAB5A43jjL)** : **A** carrousel de bienvenue plein écran (4 pages,
  « Passer », « C'est parti ») au premier lancement de Plazo, et dans Plazo Pro un par poste du jour (« CHAUFFEUR · 2 / 4 »),
  montré la première fois que ce poste est tenu sur le téléphone ; **B** bulles guidées sur les vrais écrans (le reste assombri,
  la cible cerclée de la couleur d'action, « 1 sur 3 », « Passer », « Suivant », « J'ai compris ») à la première ouverture de
  Rechercher et de Ma réservation (Plazo), d'Aujourd'hui, Réservations, Navette et Parking (Plazo Pro), après le carrousel ;
  une bulle dont la cible n'est pas à l'écran est sautée, une page sans aucune cible réessaie (chargement) puis laisse le
  tutoriel à voir. Plus › Tutoriels (`TutorialsPage`) : chaque tutoriel avec « Voir » / « Revoir », « Tout revoir » ; dans Plazo Pro
  le choix du poste parmi ceux que le rôle couvre ; les bulles d'un onglet se rejouent tout de suite, les autres à la prochaine
  ouverture. `lib/src/shared/tutorials/` (`tutorial_catalog.dart` : tutoriels, pages et cibles = `Key` déjà posées sur les
  écrans ; `TutorialService` : « vu » dans `shared_preferences` sur le téléphone seulement ; `TutorialSpot` autour des coquilles et
  des pages ; `WelcomeCarousel`, `CoachMarks`), textes `tutorials.*` de `fr-FR.json` ; `--dart-define=TUTORIALS=false` pour les
  captures des stores et les essais sur émulateur, coupés aussi dans les tests (`setUpLocalizedTests`) sauf
  `test/shared/tutorials/tutorials_test.dart`.
  **Menu du web, direction A, et photo de profil (30/10/2026, « Réorganise le menu sur le web. Pouvoir mettre sa photo »,
  maquettes https://claude.ai/artifact/8XWAMJ28UwJFmvFBxuv66i)** : le rail de l'espace pro (`AdminLayout.tsx`, 236 px) a quatre
  groupes par usage, Aujourd'hui (Tableau de bord, Planning › Jour · Prévisionnel, Navettes), Réservations (Toutes, Boîte de
  réception, Services à faire, SMS de la veille, Importer un fichier), Parking (Occupation, Plan, Planning des places, Réglages) et
  Gérant (Chiffre d'affaires, Sur Plazo › Fiche · Tarifs, Équipe, Contrats signés, Mon contrat Plazo) ; une entrée à pages se
  déplie (ouverte tant qu'une de ses pages est affichée, chevron pour l'ouvrir à la main), chaque page selon les droits du rôle ;
  compteurs ambre « Boîte de réception 3 », « Services à faire 2 » (total sur l'entrée repliée) par `GET /internal/nav/counts`
  `{ inbox, extras }` (`reservations:view`, `inbox` nul sans `reservations:manage`, relu chaque minute) ; sur téléphone, les
  entrées en rangée et les pages du groupe courant en seconde rangée (`nav-subrow`). Le compte est en bas du rail
  (`AccountMenu` : photo, nom, rôle ; menu Mon compte · Changer ma photo · Plateforme pour son administrateur · Se déconnecter ;
  sur téléphone la photo seule en haut) ; la barre haute ne garde que le parking, « Changer de vue » et « Masquer le CA ».
  **Photo** : `Staff.photoKey` / `photoUpdatedAt` (migration `staff_photo` ; `photoKey` jamais servi, `toPublicStaff`) dans le
  magasin Blob privé des photos ; `POST /internal/staff/me/photo` (octets bruts JPEG, PNG ou WebP, 2 Mo, `RawBodyMiddleware`,
  `STAFF_PHOTO_PATH` ; remplace la précédente ; 400 `photo` required · too_large · not_an_image), `DELETE …/me/photo`
  (`RefuseInViewAs` : refusées en consultation et en démo ; tracées `staff.photo_set` / `staff.photo_removed`),
  `GET /internal/staff/:id/photo` (équipe du loueur, `Cache-Control: private`, 404 `photo_not_found`) ; effacée quand le membre
  quitte le parking ou supprime son compte (`detachMember`) et avec le loueur ; `StaffPhotoService`. Web : carte « Ma photo » en
  tête de Mon compte (`PhotoCard`, `#photo` : choisir, cadrer dans un rond en glissant et en zoomant, envoyée en carré JPEG de
  512 px ; « Retirer » ; lecture seule en démo), `Avatar` (photo lue avec la session et gardée par sa date, sinon initiales sur une
  pastille) dans le menu et la page Équipe. Visible de l'équipe seulement (pas du voyageur). **Plazo Pro (30/10/2026, « ajoute la photo
  dans Plazo Pro »)** : carte « Ma photo » en tête de Mon compte (`StaffPhotoCard`, `StaffAvatar` : photo ou initiales, « Prendre une
  photo » avec l'appareil, « Choisir une photo » / « Changer ma photo » dans la galerie, réduite à 1 024 px en JPEG par `image_picker`,
  « Retirer » ; lecture seule en démo), `StaffPhotoDataSource` par Dio sans freezed (date lue sur `GET /internal/staff/me`, photo
  gardée en mémoire par sa date), l'étape `photo` de « Bien démarrer » y mène ; textes iOS de l'appareil photo et de la galerie mis à
  jour ; **page Équipe (30/10/2026, « ajoute les photos dans la page Équipe de Plazo Pro »)** : chaque membre avec sa photo ou ses
  initiales (`StaffAvatar` de 36 px, estompé pour un membre désactivé, `member-avatar-<id>` ; `TeamMemberModel.photoUpdatedAt`, déjà
  servi par `GET /internal/staff`). Tests
  `staff-photo.test.ts`, `AdminLayout.test.tsx`, `PhotoCard.test.tsx`, `staff_photo_test.dart`.
  **Menu par rôle et « Bien démarrer » (26/10/2026, « réorganise le menu par rôle, gérant, chauffeur, accueil, ajoute un tutoriel
  pour bien démarrer avec Plazo Pro », choix « M-A + W-A + T-A + T-B » des maquettes https://claude.ai/artifact/6rWrzpDZ712eQCaRRCRwbs)** :
  **M-A** Plus de Plazo Pro en blocs : « Mon poste du jour » (poste, véhicule du jour pour un chauffeur, « Bien démarrer »),
  « Gérant » (chiffre d'affaires, équipe, plan, véhicules de navette, réglages ; selon les droits du rôle), puis un bloc par
  poste que le membre peut tenir (« Chauffeur » : Navette ; « Accueil » : Réservations ; « Voiturier » : Planning des places ;
  `staff.allowedPosts`, sinon `coveredPosts(role)` de `core/helpers/roles.dart`, le miroir de `allowedPosts` du serveur) et
  « Compte » (notifications, tutoriels, mon compte, déconnexion) ; mêmes clés `pmore-*`, plus `pmore-start` et
  `pmore-reservations` ; test `pro_more_menu_test.dart`. **W-A** rail de l'espace pro web en trois sections « Exploitation »
  (Tableau de bord, Planning, Navettes, Réservations, Parking), « Gérant » (Chiffre d'affaires, Sur Plazo, Équipe, Mon contrat,
  Contrats) et « Compte » (Mon compte, Plateforme) : `NavItem.section` dans `AdminLayout.tsx`, en-tête visible dès `lg`, une
  section sans lien pour le rôle n'apparaît pas ; test `AdminLayout.test.tsx`. **T-A** `GET /internal/getting-started`
  (`GettingStartedService`, `reservations:view` ; rien d'enregistré) rend `{ post, steps[{ key, done, detail }], done, total }`
  pour le poste du jour (`effectivePost`) : gérant `parking` (adresse et places : files, plan ou capacité déclarée), `bookings`
  (un mail de comparateur reçu ou une réservation importée), `team` (2 membres actifs, demandes en attente dans le détail),
  `shuttles` (un véhicule en service, rendez-vous du retour), `listing` (grille et fiche, statut), `contract` (PDF en vigueur,
  sinon « Le modèle Plazo pour l'instant »), `sms` (ligne `reminder_settings`) ; chauffeur `post`, `vehicle`, `notifications`
  (un appareil), `tracking` (suivi non coupé) ; voiturier `post`, `plan`, `keys` (clés laissées ou crochet notés une fois),
  `notifications` ; accueil `post`, `reservations` (une saisie par l'équipe), `inbox`, `notifications` ; **et pour tous, en
  dernier, `photo` (30/10/2026, « ajoute la demande de photo dans les étapes de Bien démarrer ») : cochée dès que le membre a sa
  photo (`photoUpdatedAt`), lien web `/mon-compte#photo`, Mon compte dans Plazo Pro** ; test
  `getting-started.test.ts`. Web : **dans le rail de gauche** (même jour, « les étapes bien démarrer doivent être sur la nav
  bar de gauche » : la carte du tableau de bord est retirée) : sous les sections, bloc `GettingStartedNav` « BIEN DÉMARRER ·
  N / 7 étapes » avec sa barre, une ligne par étape (coche verte ou cercle, titre, détail en info-bulle) qui mène à la page de
  réglage, repliable d'un clic (gardé dans le navigateur `plazo:getting-started-hidden`), absent quand tout est fait ; écran
  large seulement (`lg`). **Pop-up de bienvenue (27/10/2026, « mets en avant le Bien démarrer : une pop-up à la première
  connexion »)** : `GettingStartedWelcome` (même fichier) s'ouvre la première fois qu'un membre ouvre l'espace pro sur ce navigateur
  tant que des étapes restent (« Bienvenue, Joanny ! », avancement, les trois prochaines étapes, « Commencer : <étape> » vers sa page,
  « Plus tard », Échap ou clic hors de la boîte) ; vu une fois par membre et par navigateur (`plazo:getting-started-welcome`, ids séparés
  par des virgules), jamais en démo ni en consultation. Plazo Pro : carte `GettingStartedCard` sous le chiffre
  d'affaires du tableau de bord (avancement et les deux prochaines étapes, `features/pro_start/`, `GettingStartedDataSource` par
  Dio sans freezed) et page `/pro/bien-demarrer` (`ProGettingStartedPage`, aussi Plus › « Bien démarrer ») : chaque étape cochée
  mène à l'écran de l'app qui la règle, ou dit « À régler sur l'espace pro web » (mails, fiche, contrat, SMS). **T-B** visite guidée
  `pro.start` (`Tutorials.proStart`, carrousel de six écrans : parking · réservations et comparateurs · équipe et code du jour ·
  navettes · tarifs, fiche et contrat · SMS et notifications ; textes `tutorials.pro_start.*`), ouverte par « Voir la visite
  guidée » de la page et listée dans Plus › Tutoriels pour chaque poste, après le carrousel du poste ; test
  `getting_started_test.dart`.
  Voir `mobile/README.md`.

- **Contrat Plazo ↔ loueur (20/10/2026, « Pouvoir stocker le contrat à faire signer », « Signé dans Plazo » puis choix 2a « bandeau
  puis page Mon contrat » des maquettes https://claude.ai/artifact/LJq6ptLmA4hcPf3YUamUgt)** : la plateforme dépose un PDF par loueur
  (Plateforme › Loueurs, colonne « Contrat » : pastille « À signer · v2 » / « Signé · v1 », carte `OperatorContractPanel` avec « Voir le
  PDF », « Remplacer », « Retirer » (non signé seulement), « Renvoyer l'e-mail », historique avec PDF signé et preuve, dépôt d'un nouveau
  PDF avec titre facultatif ; `?contrat=<id>` ouvre la carte) ; un nouveau dépôt remplace la version en attente (`superseded`), une
  version signée reste. Les gérants actifs reçoivent un e-mail et voient le bandeau ambre `ContractBanner` (« Votre contrat Plazo est
  prêt à signer. » · « Le lire et le signer ») jusqu'à la signature, sans blocage ; page `/pro/mon-contrat` (`ContractPage`, menu « Mon
  contrat », `parking:manage`) : aperçu du PDF, nom complet tapé (deux mots au moins), case « Lu et approuvé », confirmation, puis la
  preuve (nom, mention, date et heure de Paris, IP, empreintes SHA-256 du contrat déposé et du PDF signé, « Télécharger le PDF signé »,
  « Télécharger la preuve de signature ») et les versions précédentes. Jamais signé en consultation (403 `view_as_cannot_sign`, lecture
  permise). Serveur : table `partner_contracts` (migration `partner_contract` : version par loueur, `status` pending · signed · superseded,
  une seule version en attente par loueur (index partiel), CHECK des preuves), `domain/partner-contract.ts` (`checkPdf` : 4 Mo au plus,
  limite de Vercel, ni chiffré ni illisible ; `checkSignature` ; `buildSignedPdf` avec `pdf-lib` : le PDF d'origine intact plus une page
  « Signature électronique », et la preuve = cette page seule avec l'empreinte du PDF signé), `PartnerContractService` (empreinte du PDF
  relue avant la signature, signature sous condition `status = pending`, e-mails au signataire et aux administrateurs de la plateforme,
  traces `partner_contract.uploaded|reminded|removed|signed`), routes `/internal/platform/operators/:id/contracts…` (dépôt en octets
  bruts `application/pdf`, `?fileName=&title=`, `RawBodyMiddleware`) et `/internal/contract…` ; PDF dans le magasin Blob privé des
  photos (`PhotoStorageService`), effacés avec le loueur ; `contract` dans la liste des loueurs. Politique de confidentialité, section 10.
  Valeur de preuve d'une signature simple : à confirmer avec le juriste en même temps que les CGU.

## Personnel

- Chaque membre a un **prénom et un nom** (06/10/2026 : `Staff.firstName/lastName`, `name` = « Prénom Nom » calculé par le serveur,
  `domain/staff-name.ts`) : création d'un membre, inscription du gérant et invitation par la plateforme en deux champs ; les pushs
  et la remarque de remise utilisent le prénom.
- **Tous les utilisateurs ont un prénom et un nom (09/10/2026)** : le voyageur aussi (`Reservation.customerFirstName/LastName`,
  `customerName` = « Prénom Nom » recalculé par le serveur à chaque écriture, migration `reservation_customer_first_last_name` qui découpe
  les anciens noms au premier espace ; `domain/customer-name.ts`) : champs « Prénom » et « Nom » sur le site, l'app et la saisie pro
  (`customerFirstName` / `customerLastName`, 60 caractères ; un ancien `customerName` seul est encore accepté et découpé, et une ancienne
  app qui renvoie le même nom garde le découpage), importateurs Onepark et Allopark et lecture par Claude séparés, salutations, `{prénom}`
  `{nom}` du SMS de la veille et « C. Martin » d'après les champs, anonymisation « Client » / « anonymisé ». Personnel : noms nettoyés avant
  contrôle (un nom fait d'espaces est refusé), invitation qui exige prénom et nom du gérant, `PATCH /internal/staff/me` (« Votre nom » de
  Mon compte, web et app) et prénom / nom dans `PATCH /internal/staff/:id` (« Modifier le nom » d'Équipe), gérant démo « Gérant Démo ».
- **Invitation d'un membre (26/10/2026, « Nawfel et Pascal n'ont pas reçu le mail afin de créer leur compte »)** : jusque-là, créer un
  membre n'envoyait rien (le gérant choisissait le mot de passe et devait le transmettre). Désormais `StaffService.create` envoie à
  chaque membre créé (web ou Plazo Pro) le mail `teamInvitationEmail` (`account-messages.ts` : « Bienvenue dans l'équipe de … »,
  « <gérant> vous a ajouté … en tant que chauffeur de navette », bouton « Choisir mon mot de passe » vers `/pro/invitation#<jeton>`,
  jeton `invitation` de 7 jours à usage unique comme celui du gérant invité, badges des stores) ; le mot de passe provisoire tapé par
  le gérant marche en attendant ; un mail qui ne part pas ne fait pas échouer la création (`invitation { emailSent }` dans la
  réponse de `POST /internal/staff`, toast « Compte créé. Un e-mail l'invite… » ou « … l'e-mail d'invitation n'a pas pu partir »),
  tracé `staff.invited` ; `POST /internal/staff/:id/invite` et bouton « Renvoyer l'invitation » dans Équipe (membre actif seulement,
  400 `staff_inactive` ; un nouveau lien annule le précédent). **Permis au super admin en consultation (26/10/2026, « en super
  admin je veux pouvoir renvoyer les mails d'invitation »)** : la seule écriture d'équipe qui passe en consultation (`RefuseInDemo`
  à la place de `RefuseInViewAsOutsidePlatformAccount` : la démo reste refusée), tracée `view_as.write` ; le mail dit alors
  « Plazo vous a ajouté… » au lieu du nom de l'administrateur ; page Équipe en lecture seule : le bouton reste sur chaque membre
  actif, avec la phrase « Vous pouvez seulement renvoyer l'invitation… ». **Deux étapes (26/10/2026, « le mail doit permettre
  d'installer plazo pro, définir son mot de passe » ; Brevo avait livré les cinq mails du matin, mais la page envoyait un chauffeur
  vers « Ma fiche », page de gérant)** : le mail numérote « 1. Choisissez votre mot de passe » (bouton) puis « 2. Installez
  l'application Plazo Pro … et connectez-vous avec cette adresse » (badges des stores) ; `POST /internal/auth/invitation` rend aussi
  `role` et `stores { playStoreUrl, appStoreUrl }` ; `AcceptInvitationPage` : un membre qui n'est pas gérant lit « Ensuite, vous
  installerez l'application… » sous l'intro, puis, le mot de passe enregistré, « Votre mot de passe est enregistré » avec les badges
  (Google Play relié, App Store grisé avec la note d'Apple tant que `PLAZO_PRO_APP_STORE_URL` manque ; images `/badges/*` servies par
  le site) et « Continuer sur le web » ; un gérant va toujours sur « Ma fiche ». Tests `staff.test.ts`, `TeamPage.test.tsx`,
  `AcceptInvitationPage.test.tsx`. Plazo Pro n'a pas encore le bouton « Renvoyer ». **Mise en forme (26/10/2026, « mets en forme le
  mail plazo »)** : les deux étapes sont deux cartes teintées numérotées (`stepCard` de `account-messages.ts` : disque citron avec le
  numéro, titre vert foncé, texte, puis le bouton ou les badges).
- **Rejoindre un parking avec Apple / Google et le code du jour (13/10/2026, « dans plazopro je peux me connecter avec icloud puis je
  rejoins un parking avec un code à 10 chiffres et lettres lié au parking et qui change tous les jours » ; maquettes validées
  https://claude.ai/artifact/PehnSk6Tq34iPELj9LDWtB, champ variante A)** : dans Plazo Pro, « Continuer avec Apple » sur iPhone et
  « Continuer avec Google » sur Android (l'e-mail et le mot de passe restent pour tous ; **22/10/2026, « ajoute la connexion
  google »** : Google aussi sur iPhone, `GOOGLE_IOS_CLIENT_ID` de Codemagic qui ajoute le schéma d'URL inversé, et sur l'espace pro
  web : bouton de Google (Google Identity Services, `lib/google-identity.ts`, `GoogleSignInButton`) sous « ou » de la connexion et
  carte « Connexion » de Mon compte (`SignInMethodsCard` : lier Google, délier Apple ou Google), client Web donné par
  `GET /internal/auth/providers` › `googleClientId` ; un compte Google relié à aucun membre est renvoyé vers Plazo Pro et sa session
  d'accueil fermée ; origine `https://www.plazo.fr` à déclarer dans le client Web de Google Cloud),
  puis le **code du jour** du loueur : 10 caractères Crockford (`domain/join-code.ts` : HMAC de `SECRET_KEY` sur loueur + jour local du
  premier parking, affiché `XXXXX-XXXXX`, O lu 0, I et L lus 1, U refusé), **qui change seul à minuit** (ni bouton ni interrupteur) ;
  le code crée une **demande** que **un gérant accepte** (rôle Accueil, Chauffeur ou Voiturier, préréglé sur le poste demandé, jamais
  Gérant) ou refuse ; une demande sans réponse expire après 7 jours ; un loueur suspendu, archivé ou de démo refuse tout code
  (`accepting` faux). Serveur : tables `staff_identities` (Apple / Google, `staffId` nul tant que la personne n'a pas rejoint),
  `identity_tokens` (session d'accueil, JWT `type: onboarding`, refusée par toutes les routes du personnel), `staff_join_requests`,
  `join_attempts` (essais comptés par compte et par adresse, jamais le code tapé), `used_identity_tokens` (une preuve Apple ou Google
  ne sert qu'une fois) ; `Staff.passwordSetAt/leftAt/deletedAt` (migration `staff_identities_join_requests`) ; routes publiques
  `GET /internal/auth/providers`, `POST /internal/auth/apple|google` (→ `signed_in` ou `onboarding`), `/internal/auth/onboarding*`
  (état, `join`, `session`, annuler, se déconnecter, supprimer l'identité), gérants `GET /internal/staff/join-code`,
  `GET /internal/staff/join-requests`, `POST …/join-requests/:id/accept|refuse` (consultation : comme les autres écritures d'équipe),
  soi-même `POST|DELETE /internal/staff/me/identities/…`, `POST /internal/staff/me/leave` (« Quitter ce parking », 409 `last_manager`)
  et `DELETE /internal/staff/me` (« Supprimer mon compte » : anonymisation « Compte supprimé », confirmée par le mot de passe, Apple ou
  Google ; avec Apple, le code d'autorisation est échangé puis **révoqué** chez Apple, règle 5.1.1(v)) ; limites : 5 codes faux en
  15 min et 20 par jour par compte, 30 par heure par adresse, 3 demandes par jour par compte ; push « Demande pour rejoindre
  l'équipe » aux gérants (audience `team`), alerte `join_request` du tableau de bord ; purge de nuit (demandes expirées, essais à
  7 jours, tentatives de connexion à 30 jours, identités jamais liées à 30 jours) ; variables `APPLE_TEAM_ID`, `APPLE_CLIENT_IDS`,
  `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_PRIVATE_KEY` (Apple proposé seulement avec la clé), `GOOGLE_CLIENT_IDS`. Web : cartes « Code du
  jour » (« Copier le code », « Copier un message prêt à envoyer ») et « Demandes en attente » (« Accepter… » avec le rôle, « Refuser »)
  dans Équipe, pastilles E-mail / Apple / Google des membres, ligne « À traiter » du tableau de bord. App : `/pro/rejoindre` (code,
  prénom et nom, « Je suis », attente relue toutes les 10 s, refus et expiration), carte du code et demandes dans Équipe, bloc
  « Connexion » de Mon compte (lier / délier Apple ou Google, quitter, supprimer). Site : page `/suppression-compte` et politique de
  confidentialité. Build : `--dart-define=GOOGLE_SERVER_CLIENT_ID` (client « Application Web » du projet Google Cloud) pour Plazo Pro
  Android ; sur iOS, l'étape « Sign in with Apple » de `mobile-release` n'ajoute l'entitlement et `APPLE_SIGN_IN=true` que si le profil
  `plazo_pro_app_store` porte la capacité (sinon Plazo Pro est construit sans le bouton) ; réglages chez Apple, Google et Vercel dans
  `mobile/publier-sur-les-stores.md`.

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
  vert foncé** (`brand/logo-horizontal-pro.svg`), et favicon de l'espace pro vert aussi (09/10/2026 : `brand/favicon-pro.svg`,
  servi en `admin/public/favicon-pro.svg` et `apple-touch-icon-pro.png`) ; fond de connexion = grille citron sur le fond clair. Les paragraphes
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
  direct (`GET /internal/shuttle/live`). **Carte des navettes, direction B « Halo et trajets » (23/10/2026, « sur la carte
  rend la localisation du parking plus visible et fais apparaître la navette », choix « WEB B » des maquettes
  https://claude.ai/artifact/QepufQmAXnWzkBB3buUdvB)** : `LiveShuttlesMap` (tableau de bord et page Navettes) : le parking
  est un disque vert foncé « P » de 52 px à bord citron avec un halo citron qui respire (`.plazo-live-halo`, coupé en
  `prefers-reduced-motion`) et son nom en pilule citron ; chaque navette qui a une position est un rond blanc de 48 px bordé
  de la couleur de son sens, minibus tourné, chevron de cap sur le bord, pilule « Karim · 3 pers. » avec le point vert
  (position récente) ou ambre ; son trajet est tracé en deux morceaux (`lib/live-map.ts`, `tripLines` : parking → navette en
  trait plein, navette → desserte en pointillé, couches GeoJSON MapLibre) ; les dessertes sont des ronds blancs avec leur
  icône (avion, train, épingle) et leur nom, « Terminal 1 dans 7 min » en pilule colorée quand une navette y va
  (`stopEta`) ; **une navette sans position apparaît toujours** : fantôme gris en pointillé à côté du parking, « Nadia ·
  partie à 14:02 · sans position » (`ghosts`). Plazo Pro garde l'ancienne carte pour l'instant. **Carte repliable (27/10/2026,
  « la carte doit être repliable pour que l'on puisse filtrer les voitures et les parcourir »)** : « Replier la carte » sur la carte
  du tableau de bord la réduit à une ligne (titre, « N navettes en route », « Afficher la carte ») et le panneau des véhicules prend
  toute la largeur (`lg:grid-cols-1`) ; choix gardé dans le navigateur `plazo:dashboard-map-collapsed`. **Tuile Paiements (07/10/2026, « les paiements sont centralisés »)** : OK « en ligne, encaissés par Plazo » si
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
- **Site Plazo voyageurs (web)** : **direction « Boutique » (choix de Joanny du 11/10/2026, « refaire Plazo pour en plus
  design, plus élégant » ; remplace T-A sur le site seulement)** : un hôtel-boutique plutôt qu'un comparateur. Fond ivoire
  `#F7F3EE`, cartes blanches à filet chaud 1 px `#E7DDD1` et coins de 16 px, ombre réservée à ce qui flotte, Playfair Display
  regular (plus d'italique) pour les titres, petites capitales espacées pour les libellés, pilules d'état douces (sauge, ambre,
  rose), JetBrains Mono pour les heures seulement ; l'orange `#FF6600` ne sert qu'à l'action (boutons pleins, texte blanc gras)
  et au meilleur prix, tout texte orange de moins de 18 px en `accent-dark` ; la sélection est espresso `#2B211B`. Carte IGN
  désaturée et réchauffée par le fond `#EEE8DF` (`MAP_PAINT` de `ResultsMap`), pour que l'orange ne désigne que le moins cher.
  Jetons dans `site/src/app/globals.css` (aucune couleur en dur dans les composants), maquette `boutique.html` du canevas de
  directions. Ce qui suit (T-A et avant) reste pour mémoire.
  Avant Boutique : **aligné sur la direction T-A « Parking » de l'app (05/10/2026)** : fond gris clair
  `#ECECEE` (`--color-ground`), cartes blanches 22 px à ombre douce (utilitaire `card`), en-tête sur le fond (plus de bande
  orange ; logo et liens sombres, « Pour les loueurs » en pilule blanche), pied de page brun foncé, Manrope (`--font-manrope`)
  avec Playfair italique sur les titres, orange `#FF6600` réservé à l'action (`btn-primary` plein) et à une carte par écran.
  Accueil : titre en deux tons « Votre parking à … », carte de recherche blanche, carte IGN du séjour par défaut
  (`api.sharedSearch` dans `AirportView`, `HomeMapPanel` → `HomeMap` sur `ResultsMap`) avec pilules « N parkings disponibles » et distance, carte
  orange du moins cher. **K-A « Carte vivante » (06/10/2026, site et app)** : la carte d'accueil est interactive (glisser, zoomer,
  boutons de zoom ; deux doigts sur téléphone), montre tous les parkings du séjour en pastilles (prix, ou « Complet »), les
  navettes en circulation en marqueurs orange animés (`GET /public/airports/:slug/live`, anonyme : position, sens, véhicule ;
  toutes les 12 s, `useAirportLive` / `SearchLivePolled`) et la pilule « N navettes en circulation » ; toucher une pastille met ce
  parking dans la carte du bas (sur le site depuis Boutique, 11/10/2026 : carte papier blanche, « Le moins cher » et prix orange
  pour le moins cher, pilule rose « Complet à ces dates » s'il n'a pas de place ; la pastille du moins cher est orange à texte
  encre, celle qu'on choisit devient espresso). **I-C « Icône navette » (06/10/2026,
  site, app et pro)** : pictogramme de minibus vu de côté (Material `airport_shuttle`), tourné dans le sens du déplacement (cap
  calculé côté client entre deux positions, `bearing` / `shuttleBearing`), couleur par sens : orange vers le terminal, pêche vers
  l'aéroport, gris sans position (vert foncé / vert / gris dans l'espace pro ; sur le site depuis Boutique : jetons seulement,
  orange `accent` vers le terminal, sauge `ok` vers l'aéroport, gris chaud `soft` sans position, encre quand le minibus illustre
  un titre ; marqueur de carte de 30 px à filet de 2 px et ombre `--shadow-pin`) ; `site/src/lib/shuttle-icon.tsx`,
  `admin/src/lib/shuttle-icon.tsx`, `mobile/lib/src/shared/widgets/shuttle_icon.dart` (`ShuttleIcon`, `ShuttlePin`) ; repris sur
  la carte d'accueil, le bloc Navette, le retour en direct, la carte et les lignes des navettes pro, et sur le site dans les
  puces « 8 min » et la tuile « Navette » de « L'essentiel » (`FactIcon`) ; la pilule « N navettes en circulation » du site
  porte depuis Boutique le point orange du direct au lieu du minibus. Page Ma réservation, véhicule sur place : bloc `ReturnLive` (client, `GET /api/public/bookings/:ref/return`
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
  **choix B du 21/10/2026 (« revois la page de connexion de plazo pro », puis « revoi le design sur web aussi », maquettes
  https://claude.ai/artifact/2hNzBfHaph589Vdhjing8h, « Un champ à la fois » ; remplace le choix A du matin, bandeau vert foncé
  et « Bonjour, prêt pour le service ? »)** : écran citron plein avec le nom en citron sur une plaque vert foncé et « PRO »,
  « Le parking, de l'arrivée au retour. », puis une feuille blanche qui demande une chose à la fois (deux points d'étape) :
  « Votre adresse e-mail » et « Continuer » (une adresse sans @ refusée sur place), Apple sur iPhone ou Google sur Android sous
  « ou », lien « Nouveau ? J'ai un code du jour » (feuille qui explique : Apple ou Google, puis le code du jour) ; puis « Votre
  mot de passe », l'adresse avec « Changer d'adresse e-mail », « Se connecter » et le mot de passe perdu. Icônes de la barre
  d'état foncées. Même écran sur l'espace pro web (`LoginPage.tsx` : panneau citron à gauche et panneau blanc de 440 px à
  droite, l'un sous l'autre sur téléphone ; champ d'adresse caché à l'étape 2 pour les gestionnaires de mots de passe ;
  « Inscrire mon parking » et « Essayer la démo » sous le panneau). Rien ne nomme un parking avant la connexion (l'app sert
  plusieurs parkings).
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
  avion brun foncé). **Choix B du 11/10/2026 (« sur l'icône écris Plazo en te servant du P »)** : l'icône des deux apps
  écrit le nom à partir du P : le P et son avion gardent leur place, « lazo » en Playfair italique (celui du mot-symbole)
  se niche sous la panse du P sur la même ligne de base (`build_svg.py` : `ICON_P_CAP` 50, `ICON_L_CAP` 16,5, le l doit
  rester sous la panse) ; l'en-tête de l'app garde le symbole (P seul) à côté du mot-symbole ; déclinaisons natives
  (mipmaps et avant-plans adaptatifs Android des deux flavors, jeux `AppIcon` / `AppIcon-pro` iOS, icônes web, copies de
  `mobile/assets/brand`) écrites sans SDK par `brand/app/tools/native_icons.py`, l'équivalent de `flutter_launcher_icons` ;
  les visuels Google Play (`brand/stores/`) reprennent la nouvelle icône. Fichiers et règles dans `brand/README.md`.

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
