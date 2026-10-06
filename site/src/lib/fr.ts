import { daysLabel } from "./dates";
import { PRODUCT_NAME } from "./product";
import type { BookingStatus, CancellationPolicy, Service } from "./types";

const P = PRODUCT_NAME;

/** Every text of the site. The product name always comes from product.json. */
export const fr = {
  meta: {
    defaultTitle: `${P} · Parkings d’aéroport avec navette`,
    defaultDescription:
      "Comparez les parkings privés avec navette autour de l’aéroport, voyez le prix total pour vos dates et réservez en ligne. Paiement sur place.",
    airportTitle: (airport: string) => `Parking aéroport ${airport} avec navette`,
    airportDescription: (airport: string) =>
      `Parkings privés à l’aéroport de ${airport} avec navette gratuite vers les terminaux : prix total pour vos dates, réservation en ligne, paiement sur place.`,
    resultsTitle: (airport: string) => `Parkings disponibles à ${airport}`,
    parkingTitle: (parking: string, airport: string) => `${parking} · parking aéroport ${airport}`,
    parkingDescription: (parking: string, airport: string) =>
      `${parking}, parking avec navette pour l’aéroport de ${airport} : tarifs, services, accès et réservation en ligne.`,
    bookingTitle: "Finaliser la réservation",
    manageTitle: "Ma réservation",
    notFoundTitle: "Page introuvable",
  },
  a11y: {
    skipToContent: "Aller au contenu",
    mainNav: "Navigation principale",
    breadcrumb: "Fil d’Ariane",
    photoPlaceholder: "Photos du parking à venir",
    photoOf: (title: string, n: number) => `${title}, photo ${n}`,
    opensNewTab: "(nouvel onglet)",
  },
  /** Fictional parkings of the demo data: shown like the others, with a discreet badge. */
  demo: {
    badge: "Démo",
    hint: "Parking fictif, présenté à titre de démonstration",
  },
  nav: {
    airports: "Aéroports",
    myBooking: "Ma réservation",
    forOperators: "Vous êtes un parking ?",
    home: "Accueil",
    results: "Résultats",
  },
  footer: {
    pitch: "Les parkings d’aéroport avec navette, comparés et réservés en ligne. Prix total affiché.",
    airports: "Aéroports",
    moreAirports: "Bientôt d’autres aéroports",
    travellers: "Voyageurs",
    faq: "Questions fréquentes",
    contact: "Nous contacter",
    product: P,
    terms: "Conditions générales",
    privacy: "Confidentialité",
    legal: "Mentions légales",
  },
  search: {
    airport: "Aéroport",
    dropOff: "Dépôt de la voiture",
    pickUp: "Retour (atterrissage)",
    dropOffDate: "Date de dépôt",
    dropOffTime: "Heure de dépôt",
    pickUpDate: "Date de retour",
    pickUpTime: "Heure de retour",
    submit: "Rechercher",
    update: "Mettre à jour",
    modify: "Modifier la recherche",
  },
  picker: {
    yourDates: "Vos dates",
    dropOff: "Dépôt",
    pickUp: "Retour",
    time: "Heure",
    choose: "Choisir",
    dropOffTime: "Heure de dépôt",
    pickUpTime: "Heure de retour",
    hint: "1er clic : dépôt · 2e clic : retour",
    pickDropOff: "Choisissez la date de dépôt",
    pickReturn: "choisissez le retour",
    clear: "Effacer",
    confirm: "Valider",
    confirmDates: "Valider les dates",
    close: "Fermer",
    prevMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    moreTimes: "défiler pour plus d’horaires",
    today: "aujourd’hui",
    /** Accessible name of a pill: "Date de dépôt : samedi 10 octobre 2026". */
    pill: (label: string, value: string | null) => `${label} : ${value ?? "à choisir"}`,
    /** Accessible name of the phone's single dates pill. */
    summary: (start: string | null, end: string | null) => (start && end ? `Vos dates : du ${start} au ${end}` : "Vos dates : à choisir"),
    chooseDates: "Choisir vos dates",
  },
  home: {
    heroTitle: (airport: string) => `Parking à l’aéroport de ${airport}, navette comprise`,
    /** Phones: a shorter title, the airport being named just above it. */
    heroTitleShort: "Parking aéroport, navette comprise",
    photoCredit: "Photo : Pexels",
    /** Phones: the reassurance strip becomes three chips on the photo. */
    chips: ["Prix total", "Navette gratuite", "Annulation claire"],
    heroLead: "Comparez les parkings privés autour de l’aéroport, voyez le prix total pour vos dates et réservez en ligne.",
    /** T-A (05/10/2026): the title in two tones, "Trouvons votre parking" then the airport. */
    heroFind: "Trouvons votre parking",
    heroNear: (airport: string) => `à ${airport}`,
    heroKicker: "Prêt à partir ?",
    mapAvailable: (n: number) => (n === 0 ? "Aucune place à ces dates" : n === 1 ? "1 parking disponible" : `${n} parkings disponibles`),
    mapDistance: (km: string | null, shuttle: number | null) =>
      [km ? `${km} km` : null, shuttle ? `navette ${shuttle} min` : null].filter(Boolean).join(" · "),
    featuredFrom: (price: string) => `dès ${price}`,
    featuredSub: (valet: boolean, shuttle: number | null) => `${valet ? "Voiturier" : "Vous vous garez"}${shuttle ? ` · navette ${shuttle} min` : ""}`,
    featuredSee: (title: string) => `Voir ${title}`,
    mapStay: (days: number) => `pour vos dates · ${days} jour${days > 1 ? "s" : ""}`,
    trust: [
      ["Prix total affiché", "aucun frais ajouté"],
      ["Navette gratuite", "jusqu’aux terminaux"],
      ["Annulation claire", "conditions visibles avant de réserver"],
    ] as [string, string][],
    howTitle: "Comment ça marche",
    how: [
      ["Réservez en ligne", "Comparez les parkings et choisissez le vôtre. Votre place est garantie pour toutes vos dates."],
      ["Déposez votre voiture", "Présentez-vous à l’accueil du parking et réglez sur place. La navette vous conduit au terminal en quelques minutes."],
      ["La navette vous attend au retour", "Indiquez votre vol retour : le parking suit l’heure d’atterrissage et vous prévient par SMS."],
    ] as [string, string][],
    partnersTitle: (airport: string) => `Les parkings partenaires à ${airport}`,
    partnersCount: (n: number) => `${n} parking${n > 1 ? "s" : ""}${n < 3 ? " · d’autres arrivent" : ""}`,
    noPartners: (airport: string) => `Aucun parking n’est encore en ligne à ${airport}. Revenez bientôt.`,
    from: "dès",
    seeParking: "Voir le parking",
    ownerCallout: "Vous gérez un parking près de l’aéroport ?",
    ownerJoin: `Rejoignez ${P}`,
    ownerPitch: "planning, navette et réservations en ligne au même endroit.",
    faqTitle: "Bon à savoir",
    faqLead: (airport: string) => `Les réponses aux questions les plus fréquentes sur le stationnement à ${airport}.`,
    faq: [
      [
        "Combien de temps avant mon vol dois-je arriver au parking ?",
        "Comptez le temps de navette indiqué sur chaque parking (souvent moins de 15 minutes) en plus du délai conseillé par votre compagnie.",
      ],
      [
        "Comment fonctionne le retour ?",
        "Le parking suit votre vol retour. À l’atterrissage, vous recevez un SMS avec le point de rendez-vous de la navette.",
      ],
      ["Comment je paie ?", "Rien n’est payé en ligne : vous réglez le prix total affiché directement à l’accueil du parking."],
      [
        "Puis-je annuler ?",
        "Oui, selon les conditions du parking choisi, affichées sur sa fiche et rappelées avant de réserver. Comme rien n’est payé en ligne, il n’y a rien à rembourser.",
      ],
    ] as [string, string][],
    airportFaq: {
      "lyon-saint-exupery": [
        [
          "Où sont les terminaux de Lyon Saint-Exupéry ?",
          "Les terminaux 1 et 2 sont reliés ; la navette vous dépose devant celui de votre vol.",
        ],
      ],
    } as Record<string, [string, string][]>,
  },
  results: {
    available: (n: number) => (n === 0 ? "Aucun parking disponible" : `${n} parking${n > 1 ? "s" : ""} disponible${n > 1 ? "s" : ""}`),
    filters: "Filtres",
    showFilters: "Filtrer les résultats",
    services: "Services",
    cancellation: "Annulation",
    freeCancellation: "Annulation gratuite",
    shuttle: "Trajet en navette",
    shuttleMax: (n: number) => `${n} min max`,
    shuttleAny: "Peu importe",
    totalPrice: "Prix total",
    maxPrice: "Prix total maximum",
    upTo: (price: string) => `jusqu’à ${price}`,
    apply: "Appliquer les filtres",
    clear: "Effacer les filtres",
    sort: "Trier",
    sortBy: { prix: "Prix", navette: "Navette la plus courte", distance: "Distance" },
    cheapest: "Le moins cher",
    fastestShuttle: "Navette la plus rapide",
    allIn: (days: number) => `${daysLabel(days)}, tout compris`,
    seeAndBook: "Voir et réserver",
    full: "Complet à ces dates",
    fullHint: "Essayez d’autres dates",
    noPrice: "Pas de tarif pour cette durée",
    noPriceHint: "Essayez un séjour plus court",
    footnote:
      "Prix totaux pour vos dates, frais compris, payés sur place. Le jour d’arrivée et le jour de retour comptent chacun pour une journée.",
    noneTitle: "Aucun parking pour ces dates",
    noneText: "Aucun parking partenaire n’a de place pour tout votre séjour. Essayez d’autres dates.",
    noMatchTitle: "Aucun parking ne correspond à vos filtres",
    noMatchText: "Élargissez vos critères pour voir plus de parkings.",
    datesTitle: "Indiquez vos dates",
    datesText: "Choisissez vos dates de dépôt et de retour pour voir les parkings disponibles et leur prix total.",
  },
  /** Trust band of a parking page, fact chips and badges of the results. */
  highlights: {
    perDay: (price: string) => `${price}/jour`,
    newOnPlatform: `Nouveau sur ${P}`,
    bandLabel: "L’essentiel",
    shuttleChip: (min: number) => `${min} min`,
    evChip: "Recharge",
    cancelChip: {
      untilArrival: "Gratuit jusqu’à l’arrivée",
      h24: "Gratuit 24 h",
      h48: "Gratuit 48 h",
      nonRefundable: "Non remboursable",
    },
    kmFromTerminals: (km: string) => `À ${km} km des terminaux`,
    tiles: {
      shuttle: (min: number) => `Navette ${min} min`,
      shuttleFree: "gratuite vers les terminaux",
      shuttleHours: (hours: string) => `gratuite, ${hours}`,
      secured: "Sécurisé",
      fenced: "clôturé",
      cctv: "vidéosurveillance",
      freeCancellation: "Annulation gratuite",
      cancellationText: {
        free_until_arrival: "jusqu’à l’arrivée",
        free_24h: "jusqu’à 24 h avant",
        free_48h: "jusqu’à 48 h avant",
      } as Record<string, string>,
      nonRefundable: "Non remboursable",
      nonRefundableText: "aucun remboursement en cas d’annulation",
      valet: "Voiturier",
      valetText: "vous laissez les clés à l’accueil",
      selfPark: "Vous vous garez",
      selfParkText: "vous gardez vos clés",
    },
  },
  map: {
    show: "Afficher la carte",
    hide: "Masquer la carte",
    title: "Carte des parkings",
    filters: "Filtres",
    terminals: "Terminaux",
    noPosition: "Position non renseignée",
    full: "Complet",
    noPrice: "Sans tarif",
    loading: "Chargement de la carte…",
    failed: "La carte n’a pas pu s’afficher.",
    attribution: "© IGN – Plan IGN",
    marker: (title: string, state: string) => `${title}, ${state}`,
    /** Texts of the map's own controls (MapLibre). */
    controls: {
      "Map.Title": "Carte",
      "NavigationControl.ZoomIn": "Zoomer",
      "NavigationControl.ZoomOut": "Dézoomer",
      "AttributionControl.ToggleAttribution": "Afficher les crédits",
      "CooperativeGesturesHandler.WindowsHelpText": "Utilisez Ctrl + molette pour zoomer la carte",
      "CooperativeGesturesHandler.MacHelpText": "Utilisez ⌘ + molette pour zoomer la carte",
      "CooperativeGesturesHandler.MobileHelpText": "Utilisez deux doigts pour déplacer la carte",
    },
    notDrawn: (n: number) => (n === 1 ? "1 parking n’a pas de position sur la carte." : `${n} parkings n’ont pas de position sur la carte.`),
  },
  parking: {
    itinerary: "Itinéraire",
    kmFromTerminals: (km: string) => `${km} km des terminaux`,
    shuttle: "Navette",
    shuttleValue: (min: number) => `${min} min, gratuite`,
    hours: "Horaires",
    parkingType: "Stationnement",
    covered: "Couvert",
    outdoor: "Extérieur",
    fenced: "clôturé",
    cancellation: "Annulation",
    presentation: "Présentation",
    howItGoes: "Comment ça se passe",
    outbound: "À l’aller",
    outboundText: (min: number | null) =>
      `Présentez-vous à l’accueil du parking avec votre plaque. Vous laissez la voiture, la navette vous dépose au terminal${min ? ` en ${min} minutes` : ""}.`,
    inbound: "Au retour",
    inboundText: "Donnez votre numéro de vol : le parking suit votre atterrissage. Vous recevez un SMS avec le point de rendez-vous de la navette.",
    access: "Accès",
    openInMaps: "Ouvrir dans Google Maps",
    addressUnknown: "Adresse communiquée à la réservation.",
    // Booking card
    forStay: (days: number) => `pour ${daysLabel(days)}, tout compris`,
    from: "dès",
    dropOff: "Dépôt",
    pickUp: "Retour",
    availableForDates: "Place disponible pour vos dates",
    fullForDates: "Complet à ces dates",
    noPriceForDates: "Pas de tarif pour cette durée",
    packageLine: (days: number) => `Forfait ${daysLabel(days)}`,
    serviceFee: "Frais de service",
    total: "Total",
    payOnSite: "À payer sur place",
    book: "Réserver",
    // Online payment on, but this parking's operator cannot take it yet.
    onlineSoon: "Réservation en ligne bientôt disponible",
    onlineSoonHint: "Ce parking n’accepte pas encore les réservations sur le site.",
    checkDates: "Voir le prix",
    askDates: "Indiquez vos dates pour voir le prix total et la disponibilité.",
    otherParkings: "Voir les autres parkings",
  },
  booking: {
    back: "‹ Retour au parking",
    title: "Finaliser la réservation",
    yourDetails: "Vos informations",
    name: "Prénom et nom",
    phone: "Téléphone mobile (pour le SMS de la navette)",
    email: "Email (confirmation)",
    plate: "Plaque d’immatriculation",
    plateHint: "Plaque française ou étrangère.",
    flight: "Vol retour (conseillé)",
    flightHint: "Ex. TO 3627 : la navette suit votre atterrissage.",
    outboundFlight: "Vol aller (facultatif)",
    outboundFlightHint: "Ex. AF 7641 : la navette vers le terminal est prévue avant votre décollage.",
    passengers: "Passagers",
    payment: "Paiement sur place",
    paymentText: (total: string) =>
      `Vous ne payez rien en ligne : vous réglez ${total} directement à l’accueil du parking. Aucune carte bancaire n’est demandée ici.`,
    termsBefore: "J’accepte les ",
    termsLink: `conditions de ${P}`,
    termsAfter: " et celles du parking. Mes données servent uniquement à ce séjour.",
    submit: "Confirmer la réservation",
    submitting: "Réservation en cours…",
    // Two steps when the booking is paid online.
    steps: "Étapes de la réservation",
    stepDetails: "1 · Vos informations",
    stepPayment: "2 · Paiement",
    currentStep: "(étape en cours)",
    paymentNext: (total: string) => `Paiement sécurisé par carte à l’étape suivante : ${total}.`,
    noAccount: "Pas de compte à créer : vous recevez la confirmation par email et par SMS.",
    summaryDropOff: "Dépôt",
    summaryPickUp: "Retour",
    modify: "Modifier",
    totalOnSite: "Total à payer sur place",
    fixErrors: "Certains champs sont à corriger.",
    unavailableTitle: "Ce parking n’est plus disponible pour vos dates",
    // Abbreviated months already end with a period ("4 oct."): never print two.
    fullNights: (nights: string) => `Nuits complètes : ${nights}${nights.endsWith(".") ? "" : "."}`,
    seeOtherParkings: "Voir les autres parkings",
    changeDates: "Changer de dates",
  },
  pay: {
    title: "Paiement",
    recap: "Récapitulatif",
    modify: "Modifier",
    total: "Total",
    days: (n: number) => daysLabel(n),
    /** Server-rendered, then updated every second: "Votre place est réservée pendant 29:41". */
    holdLeft: (time: string) => `Votre place est réservée pendant ${time}`,
    button: (total: string) => `Payer ${total} ›`,
    redirecting: "Redirection…",
    redirectNote: "Vous allez être redirigé vers la page de paiement sécurisée Stripe.",
    expiredTitle: "Le délai est dépassé",
    expiredText: "Votre place n’est plus réservée et rien n’a été débité. Vous pouvez recommencer : vos informations sont gardées.",
    restart: "Recommencer la réservation",
    verifyingTitle: "Paiement en cours de vérification…",
    verifyingText: "Cela prend quelques secondes. Cette page se met à jour toute seule.",
    refresh: "Actualiser",
  },
  manage: {
    title: "Ma réservation",
    lookupLead: "Pas de compte : le lien de votre email suffit. Sinon, entrez votre référence et votre email.",
    reference: "Référence",
    email: "Email",
    find: "Retrouver ma réservation",
    finding: "Recherche…",
    confirmedTitle: (name: string) => (name ? `C’est réservé, ${name} !` : "C’est réservé !"),
    // The confirmation SMS goes to French mobiles only (phone null otherwise).
    confirmedText: (email: string | null, phone: string | null) =>
      email && phone
        ? `Votre confirmation part à ${email} et par SMS au ${phone}.`
        : email
          ? `Votre confirmation part à ${email}.`
          : phone
            ? `Votre confirmation part par SMS au ${phone}.`
            : "Gardez bien votre référence.",
    dropOff: "Dépôt",
    pickUp: "Retour",
    flight: "Vol retour",
    outbound: "Vol aller",
    outboundShuttle: (time: string) => `navette vers le terminal prévue vers ${time}`,
    outboundStatus: {
      scheduled: "à l’heure",
      delayed: "retardé",
      departed: "parti",
      landed: "parti",
      cancelled: "annulé",
      diverted: "dérouté",
      unknown: "vol non trouvé",
    } as Record<string, string>,
    noFlight: "Non renseigné",
    vehicle: "Véhicule",
    passengers: "Passagers",
    toPayOnSite: "À payer sur place",
    nothingToPay: "Rien à payer",
    paid: "Payé",
    refunded: "Remboursé",
    stayPrice: "Prix du séjour",
    freeUntil: (when: string) => `Annulation gratuite jusqu’au ${when}`,
    nonRefundable: "Non annulable en ligne",
    dayTitle: "Le jour du départ",
    step1Title: "Rendez-vous au parking",
    step1Text: (address: string | null, min: number | null) =>
      `${address ? `${address}. ` : ""}Prévoyez ${min ? `${min} min de navette` : "le trajet en navette"} avant l’heure conseillée par votre compagnie.`,
    step2Title: "Donnez votre référence ou votre plaque",
    step2Text: (total: string | null) =>
      `L’accueil vous attend : vous réglez ${total ?? "votre séjour"}, vous laissez la voiture et la navette vous dépose au terminal.`,
    step3Title: "Au retour, on suit votre vol",
    step3Text: (flight: string | null) =>
      flight
        ? `Dès l’atterrissage du ${flight}, vous recevez un SMS avec le point de rendez-vous de la navette.`
        : "Indiquez votre vol retour ci-dessous : à l’atterrissage, vous recevez un SMS avec le point de rendez-vous de la navette.",
    itinerary: "Itinéraire vers le parking",
    addToCalendar: "Ajouter à l’agenda",
    manageLink: "Gérer ma réservation",
    flightTitle: "Vos vols",
    flightLabel: "Vol retour",
    outboundLabel: "Vol aller",
    flightSave: "Enregistrer",
    flightEdit: "Modifier",
    flightSaving: "Enregistrement…",
    flightHelp: "Changez-le si votre vol change : la navette suit le nouveau. Laissez vide pour l’effacer.",
    flightSaved: "Vols enregistrés.",
    flightLocked: "Le vol retour ne peut plus être modifié en ligne.",
    cancelTitle: "Annuler",
    cancelText: (until: string) => `Gratuit jusqu’au ${until}. Rien n’a été payé en ligne : il n’y a rien à rembourser.`,
    cancelButton: "Annuler ma réservation",
    cancelConfirm: "Confirmer l’annulation",
    cancelConfirmText: "Votre place sera libérée. Cette action est définitive.",
    cancelKeep: "Garder ma réservation",
    cancelling: "Annulation…",
    cancelled: "Cette réservation est annulée.",
    cancelledRefunded: "Cette réservation est annulée. Remboursement intégral sur votre carte sous 5 à 10 jours.",
    cancelledNow: "Votre réservation est annulée. Un email de confirmation vous est envoyé.",
    cancelClosed: (until: string) => `Le délai d’annulation en ligne est passé (${until}).`,
    cancelNonRefundable: "Cette réservation ne peut pas être annulée en ligne.",
    contactParkingPhone: "Contactez le parking au",
    contactParkingDesk: "Adressez-vous à l’accueil du parking.",
    dayQuestion: (parking: string) => `Une question le jour J ? ${parking} :`,
    changeDates: (until: string) => `Pour changer les dates, annulez puis réservez de nouveau (gratuit avant le ${until}).`,
    notFoundTitle: "Réservation introuvable",
    notFoundText: "Ce lien n’est pas valide ou a expiré. Entrez votre référence et votre email pour retrouver votre réservation.",
    or: "puis",
  },
  /** The live return block of a booking (T-A, 05/10/2026): the same words as the app's ring. */
  live: {
    live: "En direct",
    ago: (seconds: number) => (seconds < 60 ? `il y a ${seconds} s` : `il y a ${Math.floor(seconds / 60)} min`),
    title: (flight: string | null) => (flight ? `Vol ${flight}` : "Votre retour"),
    landsIn: "atterrit dans",
    anyMinute: "imminent",
    planned: (time: string) => `prévu ${time}`,
    plannedLate: (time: string, late: number) => `prévu ${time} · retard +${late} min`,
    landed: "atterri à",
    goMeeting: "rejoignez le point de rendez-vous",
    waitingShuttle: "le chauffeur vient vous chercher",
    cancelled: "vol annulé",
    cancelledHelp: "Appelez le parking pour convenir d’un nouveau rendez-vous.",
    shuttleIn: "navette dans",
    shuttleWaiting: "en attente de sa position",
    shuttleAway: (distance: string) => `à ${distance} de vous`,
    stepLanding: "Atterrissage",
    stepMeeting: "Rendez-vous",
    stepShuttle: "Navette",
    meetingPoint: (label: string) => `Point de rendez-vous : ${label}`,
    meetingDefault: "point de rendez-vous de la navette",
    shuttleLine: (driver: string, vehicle: string | null) => [driver ? `Chauffeur : ${driver}` : null, vehicle].filter(Boolean).join(" · "),
    position: "Position",
    carTitle: "Retrouver ma voiture",
    carSpot: (code: string) => `Place ${code}`,
    carZone: { short: "zone séjours courts", medium: "zone séjours moyens", long: "zone séjours longs" } as Record<string, string>,
    carKeys: "Les clés vous attendent à l’accueil du parking.",
    carRoute: "Itinéraire à pied jusqu’au parking",
    carRouteToCar: "Itinéraire à pied jusqu’à ma voiture",
    carPosition: (by: "traveller" | "staff", time: string, accuracy: number | null) =>
      `Position GPS ${by === "staff" ? "enregistrée par le parking" : "que vous avez enregistrée"} à ${time}${accuracy !== null ? ` (± ${accuracy} m)` : ""}.`,
    carNoSpot: "Votre voiture",
    offline: "Impossible de lire l’état du retour pour le moment.",
  },
  status: {
    pending_payment: "En attente de paiement",
    upcoming: "Confirmée",
    arrived: "En cours",
    shuttled_out: "En cours",
    return_requested: "En cours",
    returned: "Terminée",
    cancelled: "Annulée",
    no_show: "Non présentée",
  } satisfies Record<BookingStatus, string>,
  services: {
    shuttle: "Navette gratuite",
    valet: "Voiturier",
    covered: "Couvert",
    ev_charging: "Recharge électrique",
    open_24h: "Ouvert 24h/24",
    fenced: "Clôturé",
    cctv: "Vidéosurveillance",
  } satisfies Record<Service, string>,
  servicesShort: {
    shuttle: "Navette",
    valet: "Voiturier",
    covered: "Couvert",
    ev_charging: "Recharge électrique",
    open_24h: "24h/24",
    fenced: "Clôturé",
    cctv: "Vidéosurveillance",
  } satisfies Record<Service, string>,
  cancellation: {
    free_until_arrival: "Annulation gratuite jusqu’à l’arrivée",
    free_24h: "Annulation gratuite jusqu’à 24 h avant",
    free_48h: "Annulation gratuite jusqu’à 48 h avant",
    non_refundable: "Non annulable",
  } satisfies Record<CancellationPolicy, string>,
  cancellationShort: {
    free_until_arrival: "Gratuite jusqu’à l’arrivée",
    free_24h: "Gratuite 24 h avant",
    free_48h: "Gratuite 48 h avant",
    non_refundable: "Non annulable",
  } satisfies Record<CancellationPolicy, string>,
  calendar: {
    dropOff: (parking: string) => `Dépôt de la voiture · ${parking}`,
    pickUp: (parking: string) => `Retour · navette ${parking}`,
    description: (reference: string, total: string | null, manageUrl: string) =>
      `Réservation ${reference}. ${total ? `${total} à payer sur place. ` : "Paiement sur place. "}Gérer la réservation : ${manageUrl}`,
  },
  legal: {
    pending: "À compléter avec le juriste",
    pendingText: "Ce texte sera rédigé et validé avec un juriste avant l’ouverture du service au public.",
    terms: "Conditions générales",
    privacy: "Politique de confidentialité",
    legalNotice: "Mentions légales",
  },
  notFound: {
    title: "Page introuvable",
    text: "Cette page n’existe pas ou n’est plus en ligne.",
    home: "Retour à l’accueil",
  },
  error: {
    title: "Le service ne répond pas",
    text: "Nous n’avons pas pu charger cette page. Réessayez dans un instant.",
    retry: "Réessayer",
    home: "Retour à l’accueil",
  },
  // Backend codes (error `code` and per-field `fields` codes), translated.
  errors: {
    required: "Champ obligatoire.",
    too_long: "Texte trop long.",
    invalid_email: "Adresse email invalide.",
    integer: "Nombre entier attendu.",
    invalid_datetime: "Date ou heure invalide.",
    return_before_arrival: "Le retour doit être après le dépôt.",
    arrival_in_past: "La date de dépôt est passée.",
    stay_too_long: "Séjour de plus de 90 jours.",
    passengers_range: "Entre 1 et 9 passagers.",
    invalid_phone: "Numéro de téléphone invalide.",
    invalid_plate: "Plaque invalide.",
    invalid_flight: "Numéro de vol invalide (ex. TO 3627).",
    terms_required: "Merci d’accepter les conditions pour réserver.",
    invalid_name: "Indiquez votre prénom et votre nom (lettres, espaces, apostrophes et tirets).",
    duplicate_booking: "Ce véhicule a déjà une réservation à ces dates. Retrouvez-la dans « Ma réservation ».",
    too_many_bookings: "Vous avez déjà plusieurs réservations en cours avec ces coordonnées. Gérez-les dans « Ma réservation ».",
    invalid_idempotency_key: "Le formulaire a expiré. Rechargez la page et réessayez.",
    invalid_slug: "Adresse invalide.",
    unknown_airport: "Aéroport inconnu.",
    validation_failed: "Certains champs sont à corriger.",
    overbooked: "Ce parking est complet pour au moins une nuit de votre séjour.",
    no_price: "Ce parking n’a pas de tarif pour la durée de votre séjour.",
    not_found: "Introuvable.",
    lookup_not_found: "Aucune réservation ne correspond à cette référence et cet email.",
    flight_locked: "Le vol retour ne peut plus être modifié en ligne.",
    cancellation_closed: "Cette réservation ne peut plus être annulée en ligne.",
    online_booking_unavailable: "Ce parking n’accepte pas encore les réservations en ligne.",
    hold_expired: "Le délai de paiement est dépassé : votre place n’est plus réservée.",
    already_paid: "Le paiement est déjà passé : votre réservation est confirmée.",
    refund_failed: "Le remboursement n’a pas pu être lancé. Réessayez dans un instant ; votre réservation n’a pas été annulée.",
    payments_unavailable: "Le paiement en ligne est momentanément indisponible. Réessayez dans un instant.",
    too_many_requests: "Trop de tentatives. Réessayez dans quelques minutes.",
    too_many_attempts: "Trop de tentatives. Réessayez dans 15 minutes.",
    network: "Le service ne répond pas. Vérifiez votre connexion et réessayez.",
    server_error: "Une erreur est survenue de notre côté. Réessayez dans un instant.",
    unknown: "Une erreur est survenue. Réessayez.",
  } as Record<string, string>,
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (...args: never[]) => unknown ? T[K] : T[K] extends unknown[] ? T[K] : DeepPartial<T[K]> };

/**
 * Texts that change when bookings are paid by card on the site (Stripe): everything that says
 * "paid at the parking" says "paid online" instead. The rest of `fr` stays as it is.
 */
export const frOnline: DeepPartial<typeof fr> = {
  meta: {
    defaultDescription:
      "Comparez les parkings privés avec navette autour de l’aéroport, voyez le prix total pour vos dates et réservez en ligne. Paiement sécurisé par carte.",
    airportDescription: (airport: string) =>
      `Parkings privés à l’aéroport de ${airport} avec navette gratuite vers les terminaux : prix total pour vos dates, réservation et paiement sécurisé en ligne.`,
  },
  home: {
    how: [
      ["Réservez et payez en ligne", "Comparez les parkings et choisissez le vôtre. Paiement sécurisé par carte : votre place est garantie pour toutes vos dates."],
      ["Déposez votre voiture", "Présentez-vous à l’accueil du parking : tout est déjà réglé. La navette vous conduit au terminal en quelques minutes."],
      ["La navette vous attend au retour", "Indiquez votre vol retour : le parking suit l’heure d’atterrissage et vous prévient par SMS."],
    ],
    faq: [
      [
        "Combien de temps avant mon vol dois-je arriver au parking ?",
        "Comptez le temps de navette indiqué sur chaque parking (souvent moins de 15 minutes) en plus du délai conseillé par votre compagnie.",
      ],
      [
        "Comment fonctionne le retour ?",
        "Le parking suit votre vol retour. À l’atterrissage, vous recevez un SMS avec le point de rendez-vous de la navette.",
      ],
      [
        "Comment je paie ?",
        `Par carte bancaire, en ligne, au moment de réserver : paiement sécurisé par carte sur ${P}, sur la page de notre prestataire Stripe. Nous ne voyons jamais votre carte, et il n’y a rien à régler au parking.`,
      ],
      [
        "Puis-je annuler ?",
        "Oui, selon les conditions du parking choisi, affichées sur sa fiche et rappelées avant de réserver. Une annulation gratuite est remboursée intégralement sur votre carte sous 5 à 10 jours.",
      ],
    ],
  },
  results: {
    footnote:
      "Prix totaux pour vos dates, frais compris, payés en ligne par carte. Le jour d’arrivée et le jour de retour comptent chacun pour une journée.",
  },
  parking: {
    payOnSite: "Total à payer en ligne",
  },
  booking: {
    submit: "Continuer vers le paiement",
    submitting: "Un instant…",
    totalOnSite: "Total",
  },
  manage: {
    toPayOnSite: "Payé",
    step2Text: () => "L’accueil vous attend : tout est déjà réglé, vous laissez la voiture et la navette vous dépose au terminal.",
    cancelText: (until: string) => `Gratuit jusqu’au ${until} : remboursement intégral sur votre carte sous 5 à 10 jours.`,
    cancelConfirmText: "Votre place sera libérée et le paiement remboursé intégralement. Cette action est définitive.",
    cancelledNow: "Votre réservation est annulée. Remboursement intégral sur votre carte sous 5 à 10 jours. Un email de confirmation vous est envoyé.",
  },
  calendar: {
    description: (reference: string, total: string | null, manageUrl: string) =>
      `Réservation ${reference}. ${total ? `${total} payés en ligne. ` : "Payée en ligne. "}Gérer la réservation : ${manageUrl}`,
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function merge<T>(base: T, overrides: DeepPartial<T>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    out[key] = isPlainObject(value) && isPlainObject(out[key]) ? merge(out[key], value as never) : value;
  }
  return out as T;
}

const FR_ONLINE = merge(fr, frOnline);

/** The site's texts: `fr` when travellers pay at the parking, with the online-payment wording otherwise. */
export function texts(online: boolean): typeof fr {
  return online ? FR_ONLINE : fr;
}

/** Unit after a "dès" price: the days the cheapest package covers ("la journée", "pour 3 jours"). */
export function fromPriceUnit(days: number | null | undefined): string {
  if (!days) return "";
  return days === 1 ? "la journée" : `pour ${daysLabel(days)}`;
}

/** French message of a backend code; unknown codes get a generic message. */
export function errorMessage(code: string | null | undefined): string {
  if (!code) return fr.errors.unknown;
  return fr.errors[code] ?? fr.errors.unknown;
}

export function serviceLabel(service: string, short = false): string {
  const labels: Record<string, string> = short ? fr.servicesShort : fr.services;
  return labels[service] ?? service;
}
