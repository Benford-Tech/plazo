import { daysLabel } from "./dates";
import { PRODUCT_NAME } from "./product";
import type { BookingStatus, CancellationPolicy, Service } from "./types";

const P = PRODUCT_NAME;

/** Every text of the site. The product name always comes from product.json. */
const frBase = {
  meta: {
    defaultTitle: `${P} · Parkings d’aéroport avec navette`,
    defaultDescription:
      "Comparez les parkings privés avec navette autour de l’aéroport, voyez le prix total pour vos dates et réservez en ligne. Paiement sur place.",
    airportTitle: (airport: string) =>
      `Parking aéroport ${airport} avec navette`,
    airportDescription: (airport: string) =>
      `Parkings privés à l’aéroport de ${airport} avec navette gratuite vers les terminaux : prix total pour vos dates, réservation en ligne, paiement sur place.`,
    resultsTitle: (airport: string) => `Parkings disponibles à ${airport}`,
    parkingTitle: (parking: string, airport: string) =>
      `${parking} · parking aéroport ${airport}`,
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
    /** Visible caption of the missing-photo ground (Boutique), short enough for the 96 px photo column. */
    photoSoon: "Photos à venir",
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
    pitch:
      "Les parkings d’aéroport avec navette, comparés et réservés en ligne. Prix total affiché.",
    airports: "Aéroports",
    moreAirports: "Bientôt d’autres aéroports",
    travellers: "Voyageurs",
    faq: "Questions fréquentes",
    contact: "Nous contacter",
    product: P,
    terms: "Conditions générales",
    privacy: "Confidentialité",
    legal: "Mentions légales",
    // 13/10/2026: the public page the stores ask for.
    deleteProAccount: `Supprimer un compte ${P} Pro`,
    // Footer A (15/10/2026).
    proLogin: "Se connecter à l’espace loueur",
    paymentTitle: "Paiement sécurisé",
    paymentMethods: "Moyens de paiement acceptés",
    // The means of payment of the terms (« 6. Paiement »): a bank card (CB, Visa, Mastercard), Apple Pay, Google Pay.
    paymentChips: ["CB", "Visa", "Mastercard", "Apple Pay", "Google Pay"],
    paymentText:
      "Payé en ligne à la réservation, par Stripe. Rien à régler au parking.",
    followTitle: "Suivez-nous",
    followOn: (network: string) => `${P} sur ${network}`,
    rights: "Tous droits réservés",
    vat: (number: string) => `TVA ${number}`,
  },
  /** Footer A (15/10/2026): the help card above the footer, on the ivory ground. */
  help: {
    eyebrow: "Besoin d’aide ?",
    title: "Une question sur votre réservation ?",
    /** `hours` from product.json, its first letter lowered: « du lundi au vendredi, de 9 h à 18 h ». */
    leadHours: (hours: string) => `Notre équipe vous répond ${hours}.`,
    leadBoth: "Notre équipe vous répond par téléphone ou par écrit.",
    leadPhone: "Notre équipe vous répond par téléphone.",
    leadWritten: "Écrivez-nous : notre équipe vous répond par e-mail.",
    /** Neither a phone line nor a support address yet: where the answers are. */
    leadSelf:
      "Votre réservation se retrouve en ligne avec sa référence et votre e-mail, et les réponses aux questions les plus courantes sont dans notre FAQ.",
    dayOfDeparture:
      "Le jour du départ, appelez directement le parking : son numéro est dans votre confirmation et dans « Ma réservation ».",
    byPhone: "Par téléphone",
    call: "Appeler",
    /** Accessible name of « Appeler » (it starts with the visible word). */
    callLabel: "Appeler le service client",
    inWriting: "Par écrit",
    contactForm: "Formulaire de contact",
    replyWithin: (delay: string) => `Réponse par e-mail sous ${delay}.`,
    replyByEmail: "Réponse par e-mail.",
    write: "Nous écrire",
    findBooking: "Retrouver ma réservation",
    faq: "Questions fréquentes",
  },
  /** /contact (15/10/2026): the form is sent by e-mail to the service client (POST /public/contact). */
  // Plazo Pro « Tarifs » (27/10/2026, mockup validated by Joanny): the operators' pricing page, /loueurs/tarifs.
  proPricing: {
    metaTitle: `Tarifs ${P} Pro`,
    metaDescription: `Logiciel pour parkings d’aéroport : réservations, comparateurs, plan, navette. Composez votre offre ${P} Pro et voyez le prix tout de suite.`,
    navPricing: "Tarifs",
    navTravellers: "Pour les voyageurs",
    login: "Se connecter",
    tryDemo: "Essayer la démo",
    signup: "Inscrire mon parking",
    eyebrow: "Tarifs",
    title: "Composez l’offre de votre parking",
    lead: "Choisissez votre formule, ajoutez votre fiche sur Plazo et vos options : le total se calcule tout seul, au mois ou à l’année.",
    anchors: { software: "Logiciel", marketplace: `Fiche sur ${P}`, options: "Options" },
    billing: "Facturation",
    monthly: "Mensuel",
    yearly: "Annuel",
    softwareTitle: "Le logiciel du parking",
    softwareLead: `Web et application ${P} Pro (iPhone, Android) dans toutes les formules. Chaque formule reprend tout ce que fait la précédente.`,
    plans: "Formule",
    recommended: "Recommandé",
    perMonth: "HT / mois",
    choose: "Choisir",
    chosen: "Choisie",
    marketTitle: `Votre fiche sur ${P}`,
    marketLead: `Les voyageurs trouvent votre parking sur plazo.fr et dans l’app ${P}, réservent et paient en ligne. ${P} encaisse et vous reverse votre part.`,
    marketHeadline: "Pas d’abonnement, une commission par réservation",
    marketPitch: `Vous ne payez que ce que ${P} vous apporte.`,
    marketPoints: [
      "Fiche avec photos, tarifs, navette en direct et avis",
      "Paiement en ligne par carte, Apple Pay et Google Pay",
      "Réservations directement dans votre planning",
      "Services additionnels vendus au voyageur (lavage, recharge)",
    ],
    marketToggle: `Ajouter ma fiche sur ${P}`,
    marketRate: `par réservation payée sur ${P}, prélevée sur le reversement`,
    example: "Exemple",
    exampleStay: "Séjour d’une semaine",
    exampleCommission: `Commission ${P}`,
    exampleNet: "Vous recevez",
    optionsTitle: "Options",
    optionsLead: "À ajouter quand vous en avez besoin.",
    soon: "Bientôt",
    onQuote: "Sur devis",
    once: "une fois",
    recap: "Votre sélection",
    commissionLine: (rate: number) => `${rate} % par réservation`,
    commissionNote: `La commission n’est due que sur les réservations payées sur ${P}.`,
    total: (yearly: boolean) => `Total ${yearly ? "annuel" : "mensuel"} HT`,
    perMonthShort: " / mois",
    perYearShort: " / an",
    yearlyNote: (monthly: string) => `soit ${monthly} par mois`,
    noCommitment: "sans engagement",
    atOrder: (amount: string) => ` · + ${amount} à la commande`,
    askQuote: "Demander un devis",
    trust: ["Sans engagement en mensuel", "Mise en route avec vous : plan, comparateurs, équipe"],
    totalShort: "Total HT",
    questionTitle: "Une question sur nos tarifs ?",
    questionLead: "Essayez la démo de Plazo Pro sans compte, ou laissez vos coordonnées : nous vous rappelons pour regarder votre parking ensemble.",
    form: {
      firstName: "Prénom",
      lastName: "Nom",
      parking: "Parking",
      email: "E-mail",
      phone: "Téléphone",
      airport: "Aéroport",
      airportOther: "Autre aéroport",
      optional: "facultatif",
      sending: "Envoi…",
      sent: "Demande envoyée",
      sentText: "Merci : nous vous écrivons très vite avec un devis pour votre parking.",
      honeypot: "Ne pas remplir ce champ",
    },
    footerPitch: "Le parking, de l’arrivée au retour.",
  },
  contact: {
    title: "Nous contacter",
    description: `Écrivez au service client de ${P} : une question sur une réservation, un parking ou le site.`,
    lead: (delay: string | null) =>
      `Une question sur une réservation, un parking ou le site ? Écrivez-nous : notre équipe vous répond par e-mail${delay ? ` sous ${delay}` : ""}.`,
    name: "Prénom et nom",
    email: "E-mail",
    emailHint: "Nous vous répondons à cette adresse.",
    reference: "Référence de réservation",
    optional: "facultatif",
    referenceHint: "Elle figure dans votre e-mail de confirmation.",
    message: "Votre message",
    messageHint:
      "Entre 10 et 2 000 caractères. N’écrivez jamais vos données de carte bancaire.",
    honeypot: "Ne pas remplir ce champ",
    submit: "Envoyer le message",
    sending: "Envoi…",
    privacy: `Votre message part par e-mail au service client de ${P}, qui vous répond à l’adresse indiquée ; ${P} ne le garde pas au-delà de cet envoi.`,
    privacyLink: "Confidentialité",
    sentTitle: "Message envoyé",
    sentText: (delay: string | null) =>
      `Merci, notre équipe vous répond par e-mail${delay ? ` sous ${delay}` : ""}. Pensez à regarder vos courriers indésirables.`,
    writeAnother: "Écrire un autre message",
    phoneTitle: "Par téléphone",
    unavailableTitle: "Le formulaire de contact arrive bientôt",
    unavailableText:
      "En attendant, retrouvez votre réservation dans « Ma réservation » avec sa référence et votre e-mail, et les réponses aux questions les plus courantes dans notre FAQ.",
  },
  /** « La lettre Plazo » in the footer (15/10/2026): Brevo double opt-in, nothing stored by Plazo. */
  newsletter: {
    title: `La lettre ${P}`,
    text: "Nouveaux aéroports, nouveaux parkings et offres de saison.",
    placeholder: "Votre e-mail",
    submit: "S’inscrire",
    sending: "Un instant…",
    consent: `En vous inscrivant, vous acceptez de recevoir la lettre ${P} par e-mail ; votre adresse ne sert qu’à cela.`,
    unsubscribe: "Désinscription en un clic, dans chaque lettre.",
    privacyLink: "Confidentialité",
    sent: "Merci ! Confirmez votre inscription avec le lien de l’e-mail que nous vous envoyons. Déjà inscrit ? Vous n’avez rien à faire.",
    honeypot: "Ne pas remplir ce champ",
  },
  /** /lettre/confirmee: where Brevo sends the reader after the confirmation link. */
  letterConfirmed: {
    title: "Inscription confirmée",
    text: `Merci ! Vous recevrez la lettre ${P} à cette adresse : nouveaux aéroports, nouveaux parkings et offres de saison. Pour vous désinscrire, un clic suffit, depuis chaque lettre.`,
    home: "Retour à l’accueil",
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
    pill: (label: string, value: string | null) =>
      `${label} : ${value ?? "à choisir"}`,
  },
  home: {
    heroTitle: (airport: string) =>
      `Parking à l’aéroport de ${airport}, navette comprise`,
    /** Phones: a shorter title, the airport being named just above it. */
    heroTitleShort: "Parking aéroport, navette comprise",
    photoCredit: "Photo : Pexels",
    /** Phones: the reassurance strip becomes three chips on the photo. */
    chips: ["Prix total", "Navette gratuite", "Annulation claire"],
    heroLead:
      "Comparez les parkings privés autour de l’aéroport, voyez le prix total pour vos dates et réservez en ligne.",
    /** T-A (05/10/2026): the title in two tones, "Votre parking à" then the airport (C-A, 08/10/2026: "l’aéroport de …", the travellers' words). */
    heroFind: "Votre parking à",
    heroNear: (airport: string) => `l’aéroport de ${airport}`,
    heroKicker: "Prêt à partir ?",
    mapAvailable: (n: number) =>
      n === 0
        ? "Aucune place à ces dates"
        : n === 1
          ? "1 parking disponible"
          : `${n} parkings disponibles`,
    mapDistance: (km: string | null, shuttle: number | null) =>
      [km ? `${km} km` : null, shuttle ? `navette ${shuttle} min` : null]
        .filter(Boolean)
        .join(" · "),
    featuredSub: (valet: boolean, shuttle: number | null) =>
      `${valet ? "Voiturier" : "Vous vous garez"}${shuttle ? ` · navette ${shuttle} min` : ""}`,
    featuredSee: (title: string) => `Voir ${title}`,
    /** K-A (06/10/2026): the shuttles on the road right now, from the live layer. */
    mapShuttles: (n: number) =>
      n === 1 ? "1 navette en circulation" : `${n} navettes en circulation`,
    mapFull: "Complet à ces dates",
    mapSeeAnyway: "Voir le parking",
    trust: [
      // Night fees (12/10/2026) are in the displayed total: nothing is added to it, but « aucun frais » would be untrue.
      ["Prix total affiché", "frais compris"],
      ["Navette gratuite", "jusqu’aux terminaux"],
      ["Annulation claire", "conditions visibles avant de réserver"],
    ] as [string, string][],
    howTitle: "Comment ça marche",
    how: [
      [
        "Réservez en ligne",
        "Comparez les parkings et choisissez le vôtre. Votre place est garantie pour toutes vos dates.",
      ],
      [
        "Déposez votre voiture",
        "Présentez-vous à l’accueil du parking et réglez sur place. La navette vous conduit au terminal en quelques minutes.",
      ],
      [
        "La navette vous attend au retour",
        "Indiquez votre vol retour : le parking suit l’heure d’atterrissage et vous prévient par SMS.",
      ],
    ] as [string, string][],
    partnersTitle: (airport: string) => `Les parkings partenaires à ${airport}`,
    partnersCount: (n: number) =>
      `${n} parking${n > 1 ? "s" : ""}${n < 3 ? " · d’autres arrivent" : ""}`,
    noPartners: (airport: string) =>
      `Aucun parking n’est encore en ligne à ${airport}. Revenez bientôt.`,
    from: "dès",
    seeParking: "Voir le parking",
    ownerCallout: "Vous gérez un parking près de l’aéroport ?",
    ownerJoin: `Rejoignez ${P}`,
    ownerPitch: "planning, navette et réservations en ligne au même endroit.",
    faqTitle: "Questions fréquentes",
    faqLead: (airport: string) =>
      `Les questions les plus fréquentes sur le parking à l’aéroport de ${airport}.`,
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
        "Rien n’est payé en ligne : vous réglez le prix total affiché directement à l’accueil du parking.",
      ],
      [
        "Puis-je annuler ?",
        "Oui, selon les conditions du parking choisi, affichées sur sa fiche et rappelées avant de réserver. Comme rien n’est payé en ligne, il n’y a rien à rembourser.",
      ],
    ] as [string, string][],
  },
  /** C-A (08/10/2026): the airport's guide (its text is in airport-guides.ts). */
  guide: {
    onThisPage: "Sur cette page",
    /** Topic guides (09/10/2026). */
    updated: (date: string) => `Mis à jour le ${date}`,
    searchTitle: "Comparez les prix pour vos dates",
    seeAllResults: "Voir tous les parkings pour ces dates",
    faqTitle: "Questions fréquentes",
    otherGuides: "Les autres guides",
    airportGuide: (airport: string) =>
      `Le guide complet du parking à l’aéroport de ${airport}`,
    footerLink: (topic: string, airport: string) => `${topic} à ${airport}`,
  },
  results: {
    available: (n: number) =>
      n === 0
        ? "Aucun parking disponible"
        : `${n} parking${n > 1 ? "s" : ""} disponible${n > 1 ? "s" : ""}`,
    filters: "Filtres",
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
    sortBy: {
      prix: "Prix",
      navette: "Navette la plus courte",
      distance: "Distance",
    },
    cheapest: "Le moins cher",
    fastestShuttle: "Navette la plus rapide",
    /** 14/10/2026: keeps the parkings whose shuttles are shown live (?direct=1). */
    liveFilter: "Navette en direct",
    allIn: (days: number) => `${daysLabel(days)}, tout compris`,
    /** Direction B (12/10/2026): under the heading when a shown result's total includes a night fee. */
    nightFeesIncluded: "Prix totaux pour vos dates, frais de nuit compris.",
    // R-B + I-C (07/10/2026): the parking shows its shuttles to the travellers.
    live: "En direct",
    liveTitle:
      "Navette suivie en direct : vous la verrez arriver dans votre réservation.",
    seeAndBook: "Voir et réserver",
    full: "Complet à ces dates",
    fullHint: "Essayez d’autres dates",
    noPrice: "Pas de tarif pour cette durée",
    noPriceHint: "Essayez un séjour plus court",
    footnote:
      "Prix totaux pour vos dates, frais compris, payés sur place. Le jour d’arrivée et le jour de retour comptent chacun pour une journée.",
    noneTitle: "Aucun parking pour ces dates",
    noneText:
      "Aucun parking partenaire n’a de place pour tout votre séjour. Essayez d’autres dates.",
    noMatchTitle: "Aucun parking ne correspond à vos filtres",
    noMatchText: "Élargissez vos critères pour voir plus de parkings.",
    datesTitle: "Indiquez vos dates",
    datesText:
      "Choisissez vos dates de dépôt et de retour pour voir les parkings disponibles et leur prix total.",
  },
  /** Trust band of a parking page, fact chips, the shuttle box and badges of the results. */
  highlights: {
    perDay: (price: string) => `${price}/jour`,
    newOnPlatform: `Nouveau sur ${P}`,
    bandLabel: "L’essentiel",
    evChip: "Recharge",
    cancelChip: {
      untilArrival: "Gratuit jusqu’à l’arrivée",
      h24: "Gratuit 24 h",
      h48: "Gratuit 48 h",
      nonRefundable: "Non remboursable",
    },
    /** Tags of a parking (14/10/2026, direction C): the long wording, and the short one of a narrow card. */
    chips: {
      outdoor: "Extérieur",
      covered: "Couvert",
      keysValet: "Vous devez remettre vos clés",
      keysValetShort: "Clés à remettre",
      keysSelf: "Vous gardez vos clés",
      keysSelfShort: "Clés gardées",
      open24h: "Ouvert 24h/24",
      open24hShort: "24h/24",
      openHours: (hours: string) => `Ouvert ${hours}`,
    },
    /** The shuttle box of a card (« encart navette ») and its live rail (L3, 14/10/2026). */
    shuttleBox: {
      title: "Navette gratuite",
      ride: "Trajet",
      wait: "Attente moy.",
      waitShort: "Attente",
      waitFull: "Attente moyenne",
      minutes: (min: number) => `${min} min`,
      live: "Navette en direct",
      dayJ: "Suivie en direct le jour J",
      parking: "Parking",
      terminal1: "Terminal 1",
      airport: "Aéroport",
      destination: (place: string, min: number | null) =>
        min ? `${place} · ${min} min` : place,
      /**
       * The rail's spoken name, the place with its article (« au Terminal 1 », « et l’aéroport »): the parking's running
       * shuttles (null until the page's first live answer, which says nothing yet), and how many of them the rail places.
       */
      rail: (
        place: "terminal1" | "airport",
        running: number | null,
        placed: number,
      ) => {
        const to = place === "terminal1" ? "au Terminal 1" : "à l’aéroport";
        if (running === null) return `Trajet du parking ${to}`;
        if (running === 0)
          return `Trajet du parking ${to}, aucune navette en route en ce moment`;
        const s = running > 1 ? "s" : "";
        const road = `${running} navette${s} en route entre le parking et ${place === "terminal1" ? "le Terminal 1" : "l’aéroport"}`;
        return placed === 0
          ? `${road}, pas encore placée${s} sur le trajet`
          : road;
      },
    },
    kmFromTerminals: (km: string) => `À ${km} km des terminaux`,
    tiles: {
      shuttleLive: "Navette en direct",
      shuttleFree: "Navette gratuite",
      free: "gratuite",
      ride: (min: number) => `trajet ${min} min`,
      wait: (min: number) => `attente moyenne ${min} min`,
      followLive: "suivez-la sur la carte le jour J",
      /** A shuttle tile with no ride, no wait and no live tracking (R4): where it goes, Terminal 1 at Lyon. */
      toTerminal1: "vers le Terminal 1",
      toAirport: "vers l’aéroport",
      outdoor: "Extérieur",
      outdoorText: "Parking à ciel ouvert",
      covered: "Couvert",
      coveredText: "Parking couvert",
      fenced: "clôturé",
      cctv: "vidéosurveillance",
      keysValet: "Vous devez remettre vos clés",
      keysValetText: "Un voiturier gare votre voiture",
      keysSelf: "Vous gardez vos clés",
      keysSelfText: "Vous vous garez vous-même",
      open24h: "Ouvert 24h/24",
      open24hText: "Dépôt et retour à toute heure",
      openHours: (hours: string) => `Ouvert ${hours}`,
      openHoursText: "Dépôt et retour pendant ces horaires",
      freeCancellation: "Annulation gratuite",
      cancellationText: {
        free_until_arrival: "jusqu’à l’arrivée",
        free_24h: "jusqu’à 24 h avant",
        free_48h: "jusqu’à 48 h avant",
      } as Record<string, string>,
      nonRefundable: "Non remboursable",
      nonRefundableText: "aucun remboursement en cas d’annulation",
    },
  },
  map: {
    show: "Afficher la carte",
    hide: "Masquer la carte",
    title: "Carte des parkings",
    terminals: "Terminaux",
    noPosition: "Position non renseignée",
    full: "Complet",
    noPrice: "Sans tarif",
    loading: "Chargement de la carte…",
    failed: "La carte n’a pas pu s’afficher.",
    attribution: "© IGN – Plan IGN",
    marker: (title: string, state: string) => `${title}, ${state}`,
    markerLive: (title: string, state: string) =>
      `${title}, ${state}, navette suivie en direct`,
    shuttle: (parking: string, direction: "pickup" | "dropoff") =>
      `Navette de ${parking} · ${direction === "dropoff" ? "vers le terminal" : "vers l’aéroport"}`,
    shuttleAge: (seconds: number) =>
      seconds < 60
        ? `position il y a ${seconds} s`
        : `position il y a ${Math.round(seconds / 60)} min`,
    /** Texts of the map's own controls (MapLibre). */
    controls: {
      "Map.Title": "Carte",
      "NavigationControl.ZoomIn": "Zoomer",
      "NavigationControl.ZoomOut": "Dézoomer",
      "AttributionControl.ToggleAttribution": "Afficher les crédits",
      "CooperativeGesturesHandler.WindowsHelpText":
        "Utilisez Ctrl + molette pour zoomer la carte",
      "CooperativeGesturesHandler.MacHelpText":
        "Utilisez ⌘ + molette pour zoomer la carte",
      "CooperativeGesturesHandler.MobileHelpText":
        "Utilisez deux doigts pour déplacer la carte",
    },
    notDrawn: (n: number) =>
      n === 1
        ? "1 parking n’a pas de position sur la carte."
        : `${n} parkings n’ont pas de position sur la carte.`,
  },
  parking: {
    itinerary: "Itinéraire",
    kmFromTerminals: (km: string) => `${km} km des terminaux`,
    shuttle: "Navette",
    hours: "Horaires",
    parkingType: "Stationnement",
    fenced: "clôturé",
    cancellation: "Annulation",
    presentation: "Présentation",
    howItGoes: "Comment ça se passe",
    outbound: "À l’aller",
    outboundText: (min: number | null) =>
      `Présentez-vous à l’accueil du parking avec votre plaque. Vous laissez la voiture, la navette vous dépose au terminal${min ? ` en ${min} minutes` : ""}.`,
    inbound: "Au retour",
    inboundText:
      "Donnez votre numéro de vol : le parking suit votre atterrissage. Vous recevez un SMS avec le point de rendez-vous de la navette.",
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
    /**
     * Direction B (12/10/2026): the stay's night fee in the price lines, « Frais de nuit · dépôt à 23:30 » (or
     * « · retour à 05:30 », « · dépôt à 22:30 et retour à 05:30 »; built by lib/night-fees.ts), and the parking's rule
     * under the lines, the amounts in short euros.
     */
    nightFee: "Frais de nuit",
    nightFeeDropOff: "dépôt à",
    nightFeeReturn: "retour à",
    nightFeeAnd: "et",
    nightRule: (fees: string, start: string, end: string) =>
      `Ce parking ajoute ${fees} entre ${start} et ${end}.`,
    nightRuleSame: (amount: string) => `${amount} pour un dépôt ou un retour`,
    nightRuleEach: (dropOff: string, pickUp: string) =>
      `${dropOff} pour un dépôt et ${pickUp} pour un retour`,
    nightRuleDropOff: (amount: string) => `${amount} pour un dépôt`,
    nightRuleReturn: (amount: string) => `${amount} pour un retour`,
    serviceFee: "Frais de service",
    total: "Total",
    payOnSite: "À payer sur place",
    book: "Réserver",
    // Online payment on, but this parking's operator cannot take it yet.
    onlineSoon: "Réservation en ligne bientôt disponible",
    onlineSoonHint:
      "Ce parking n’accepte pas encore les réservations sur le site.",
    checkDates: "Voir le prix",
    askDates: "Indiquez vos dates pour voir le prix total et la disponibilité.",
    otherParkings: "Voir les autres parkings",
  },
  booking: {
    back: "Retour au parking",
    title: "Finaliser la réservation",
    yourDetails: "Vos informations",
    firstName: "Prénom",
    lastName: "Nom",
    phone: "Téléphone mobile (pour le SMS de la navette)",
    email: "Email (confirmation)",
    plate: "Plaque d’immatriculation",
    plateHint: "Plaque française ou étrangère.",
    flight: "Vol retour (conseillé)",
    flightHint: "Ex. TO 3627 : la navette suit votre atterrissage.",
    outboundFlight: "Vol aller (facultatif)",
    outboundFlightHint:
      "Ex. AF 7641 : la navette vers le terminal est prévue avant votre décollage.",
    passengers: "Passagers",
    /** E (06/10/2026): the vehicle and a message, so the parking knows what to expect. */
    vehicleTitle: "Pour vous reconnaître (facultatif)",
    vehicleModel: "Modèle du véhicule",
    vehicleModelHint: "Ex. Peugeot 308",
    vehicleColour: "Couleur",
    vehicleColourHint: "Ex. grise",
    message: "Un mot pour le parking",
    messageHint:
      "Poussette, arrivée tardive… Le parking le lit avant votre venue.",
    /** Child seats for the shuttle (24/10/2026, direction B « par âge »): the block under Plaque / Passagers. */
    childSeats: {
      title: "Des enfants à bord ?",
      subtitle: "Le parking prépare les sièges dans la navette",
      switchLabel: "Demander des sièges auto",
      hint: "Les enfants comptent dans les passagers. Sièges prêtés à l’aller comme au retour, gratuit.",
      kinds: {
        infant: {
          label: "Bébé · jusqu’à 12 mois",
          hint: "Siège dos à la route",
          fewer: "Un bébé de moins",
          more: "Un bébé de plus",
          count: (n: number) => `${n} ${n > 1 ? "bébés" : "bébé"}`,
        },
        toddler: {
          label: "1 à 4 ans",
          hint: "Siège enfant",
          fewer: "Un enfant de 1 à 4 ans de moins",
          more: "Un enfant de 1 à 4 ans de plus",
          count: (n: number) =>
            `${n} ${n > 1 ? "enfants" : "enfant"} de 1 à 4 ans`,
        },
        booster: {
          label: "4 à 10 ans",
          hint: "Réhausseur",
          fewer: "Un enfant de 4 à 10 ans de moins",
          more: "Un enfant de 4 à 10 ans de plus",
          count: (n: number) =>
            `${n} ${n > 1 ? "enfants" : "enfant"} de 4 à 10 ans`,
        },
      },
    },
    termsBefore: "J’accepte les ",
    termsLink: `conditions de ${P}`,
    termsAfter:
      " et celles du parking. Mes données servent uniquement à ce séjour.",
    submit: "Confirmer la réservation",
    submitting: "Réservation en cours…",
    // Two steps when the booking is paid online.
    steps: "Étapes de la réservation",
    stepDetails: "1 · Vos informations",
    stepPayment: "2 · Paiement",
    currentStep: "(étape en cours)",
    paymentNext: (total: string) =>
      `Paiement sécurisé par carte à l’étape suivante : ${total}.`,
    noAccount:
      "Pas de compte à créer : vous recevez la confirmation par email et par SMS.",
    summaryDropOff: "Dépôt",
    summaryPickUp: "Retour",
    modify: "Modifier",
    totalOnSite: "Total à payer sur place",
    fixErrors: "Certains champs sont à corriger.",
    unavailableTitle: "Ce parking n’est plus disponible pour vos dates",
    // Abbreviated months already end with a period ("4 oct."): never print two.
    fullNights: (nights: string) =>
      `Nuits complètes : ${nights}${nights.endsWith(".") ? "" : "."}`,
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
    button: (total: string) => `Payer ${total}`,
    redirecting: "Redirection…",
    redirectNote:
      "Vous allez être redirigé vers la page de paiement sécurisée Stripe.",
    /** « 3 passagers », followed by the child seats asked (« · 1 siège bébé ») when there are some. */
    passengers: (n: number) => `${n} passager${n > 1 ? "s" : ""}`,
    expiredTitle: "Le délai est dépassé",
    expiredText:
      "Votre place n’est plus réservée et rien n’a été débité. Vous pouvez recommencer : vos informations sont gardées.",
    restart: "Recommencer la réservation",
    verifyingTitle: "Paiement en cours de vérification…",
    verifyingText:
      "Cela prend quelques secondes. Cette page se met à jour toute seule.",
    refresh: "Actualiser",
  },
  manage: {
    title: "Ma réservation",
    lookupLead:
      "Pas de compte : le lien de votre SMS ou de votre email suffit. Sinon, entrez le numéro reçu de Plazo ou du site où vous avez réservé.",
    reference: "Numéro de réservation",
    referenceHint: "Plazo, Allopark, Onepark, ParkVia…",
    contact: "E-mail ou téléphone",
    email: "Email",
    find: "Retrouver ma réservation",
    finding: "Recherche…",
    confirmedTitle: (name: string) =>
      name ? `C’est réservé, ${name} !` : "C’est réservé !",
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
    outboundShuttle: (time: string) =>
      `navette vers le terminal prévue vers ${time}`,
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
    vehicleDetails: (model: string | null, colour: string | null) =>
      [model, colour].filter(Boolean).join(" · "),
    message: "Votre mot pour le parking",
    passengers: "Passagers",
    toPayOnSite: "À payer sur place",
    nothingToPay: "Rien à payer",
    paid: "Payé",
    refunded: "Remboursé",
    stayPrice: "Prix du séjour",
    /** Under the paid amount when the booking paid night fees (12/10/2026). */
    nightFeeIncluded: (amount: string) => `dont ${amount} de frais de nuit`,
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
    flightHelp:
      "Changez-le si votre vol change : la navette suit le nouveau. Laissez vide pour l’effacer.",
    flightSaved: "Vols enregistrés.",
    flightLocked: "Le vol retour ne peut plus être modifié en ligne.",
    /** Child seats for the shuttle (24/10/2026): the « Sièges auto » card, editable while the booking is « Attendu ». */
    childSeats: {
      title: "Sièges auto",
      none: "Aucun siège demandé",
      inShuttle:
        "Installés dans la navette, à l’aller comme au retour. Gratuit.",
      edit: "Modifier",
      save: "Enregistrer",
      saving: "Enregistrement…",
      cancel: "Annuler",
      saved: "Sièges auto enregistrés.",
      locked:
        "Les sièges auto ne se modifient plus en ligne : dites-le au parking.",
    },
    cancelTitle: "Annuler",
    cancelText: (until: string) =>
      `Gratuit jusqu’au ${until}. Rien n’a été payé en ligne : il n’y a rien à rembourser.`,
    cancelButton: "Annuler ma réservation",
    cancelConfirm: "Confirmer l’annulation",
    cancelConfirmText: "Votre place sera libérée. Cette action est définitive.",
    cancelKeep: "Garder ma réservation",
    cancelling: "Annulation…",
    cancelled: "Cette réservation est annulée.",
    cancelledRefunded:
      "Cette réservation est annulée. Remboursement intégral sur votre carte sous 5 à 10 jours.",
    cancelledNow:
      "Votre réservation est annulée. Un email de confirmation vous est envoyé.",
    cancelClosed: (until: string) =>
      `Le délai d’annulation en ligne est passé (${until}).`,
    cancelNonRefundable: "Cette réservation ne peut pas être annulée en ligne.",
    contactParkingPhone: "Contactez le parking au",
    contactParkingDesk: "Adressez-vous à l’accueil du parking.",
    dayQuestion: (parking: string) => `Une question le jour J ? ${parking} :`,
    changeDates: (until: string) =>
      `Pour changer les dates, annulez puis réservez de nouveau (gratuit avant le ${until}).`,
    notFoundTitle: "Réservation introuvable",
    notFoundText:
      "Ce lien n’est pas valide ou a expiré. Entrez votre référence et votre email pour retrouver votre réservation.",
    or: "puis",
  },
  /** The rebound page of the short link (direction B, 27/10/2026): a phone without the app. */
  appLink: {
    title: (reference: string) =>
      `Votre réservation ${reference} vous attend dans l’app`,
    lead: (parking: string) =>
      `${parking}. Installez l’app : elle s’ouvrira sur votre réservation. Navette en direct, retrouver ma voiture, photos de l’état des lieux.`,
    install: "Installer l’app",
    alreadyInstalled: "J’ai déjà l’app",
    continueWeb: "Continuer sur le site",
    iosSoon:
      "Bientôt sur l’App Store : en attendant, votre réservation est sur le site.",
    playBadge: "Disponible sur Google Play",
    appStoreBadge: "Télécharger dans l’App Store",
    invalidTitle: "Lien inconnu ou expiré",
    invalidText:
      "Ce lien ne mène plus à une réservation. Retrouvez la vôtre avec sa référence et votre email.",
  },
  /** The live return block of a booking (T-A, 05/10/2026): the same words as the app's ring. */
  live: {
    live: "En direct",
    ago: (seconds: number) =>
      seconds < 60
        ? `il y a ${seconds} s`
        : `il y a ${Math.floor(seconds / 60)} min`,
    title: (flight: string | null) =>
      flight ? `Vol ${flight}` : "Votre retour",
    landsIn: "atterrit dans",
    anyMinute: "imminent",
    planned: (time: string) => `prévu ${time}`,
    plannedLate: (time: string, late: number) =>
      `prévu ${time} · retard +${late} min`,
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
    shuttleLine: (driver: string, vehicle: string | null) =>
      [driver ? `Chauffeur : ${driver}` : null, vehicle]
        .filter(Boolean)
        .join(" · "),
    position: "Position",
    carTitle: "Retrouver ma voiture",
    carSpot: (code: string) => `Place ${code}`,
    /** S-C (07/10/2026): "File F07 · 3e depuis l’allée" (the position is a separate label, shown smaller). */
    carFile: (code: string) => `File ${code}`,
    carFilePosition: (position: number) =>
      `${position === 1 ? "1re" : `${position}e`} depuis l’allée`,
    carZone: {
      short: "zone séjours courts",
      medium: "zone séjours moyens",
      long: "zone séjours longs",
    } as Record<string, string>,
    carKeys: "Les clés vous attendent à l’accueil du parking.",
    carRoute: "Itinéraire à pied jusqu’au parking",
    carRouteToCar: "Itinéraire à pied jusqu’à ma voiture",
    carPosition: (
      by: "traveller" | "staff",
      time: string,
      accuracy: number | null,
    ) =>
      `Position GPS ${by === "staff" ? "enregistrée par le parking" : "que vous avez enregistrée"} à ${time}${accuracy !== null ? ` (± ${accuracy} m)` : ""}.`,
    carNoSpot: "Votre voiture",
    offline: "Impossible de lire l’état du retour pour le moment.",
    /** D (06/10/2026): the same gestures as the app on the return day. */
    landedButton: "J’ai atterri",
    landedHelp:
      "Sans suivi de votre vol, dites-nous quand vous avez atterri : le parking prépare la navette.",
    instructions: "Consignes du parking",
    photoAlt: "Photo du point de rendez-vous",
    routeToMeeting: "Itinéraire vers le point de rendez-vous",
    /** E (06/10/2026): a word to the parking on the return day. */
    noticeTitle: "Un souci ? Prévenez le parking",
    noticeHelp: "Le chauffeur et l’accueil le voient aussitôt dans leur file.",
    noticeFlightDelayed: "Mon vol a du retard",
    noticeLuggage: "Bagage perdu ou retardé",
    noticeOther: "Autre…",
    noticeOtherPlaceholder: "Dites-nous en un mot (200 caractères)",
    noticeSend: "Envoyer",
    noticeSending: "Envoi…",
    noticeKinds: {
      flight_delayed: "Mon vol a du retard",
      luggage: "Bagage perdu ou retardé",
      other: "Votre message",
    } as Record<string, string>,
    noticed: (label: string, time: string) =>
      `Transmis au parking à ${time} : ${label}.`,
    noticeAgain: "Signaler autre chose",
  },
  /** D (06/10/2026): "Prévenir de mon arrivée", the app's block on the site (same words). */
  arrival: {
    title: "Prévenir de mon arrivée",
    notYetOutbound: (when: string) =>
      `Le jour de votre dépôt, à partir de ${when}, vous pourrez prévenir le parking de votre arrivée.`,
    notYetReturn: (when: string) =>
      `Au retour, à partir de ${when}, vous pourrez dire au chauffeur que vous êtes au point de rendez-vous.`,
    explainTitle: "Prévenez le parking de votre arrivée",
    explainBefore:
      "Le voiturier vous attend à l’accueil. Votre position est partagée avec le parking ",
    explainOnly: "uniquement",
    explainAfter: " jusqu’à votre arrivée (2 h maximum), puis effacée.",
    share: "Je suis en route — partager ma position",
    sharing: "Partage en cours…",
    announceToggle: "Prévenir sans partager ma position",
    announceIn: (minutes: number) => `J’arrive dans ${minutes} min`,
    returnAnnounceIn: (minutes: number) => `J’y suis dans ${minutes} min`,
    stopAnytime: "Vous pouvez arrêter le partage à tout moment.",
    live: "Position partagée avec le parking",
    etaLabel: "Arrivée estimée",
    etaMinutes: (minutes: number) => `${minutes} min`,
    etaUnknown: "—",
    arrivalAround: (time: string) => `arrivée vers ${time}`,
    waitingPosition: "Recherche de votre position…",
    notified: "Le parking a été prévenu · le voiturier vous attend à l’accueil",
    notifiedReturn: "Le chauffeur a été prévenu",
    autoStop: (left: string) =>
      `Arrêt automatique à l’arrivée, ou dans ${left}`,
    stop: "Arrêter le partage",
    arrivedTitle: "Vous êtes arrivé·e",
    arrivedText:
      "Le partage s’est arrêté et votre position a été effacée. Le voiturier vous attend à l’accueil.",
    announcedText: (minutes: number, time: string) =>
      `Le parking est prévenu : vous arrivez dans ${minutes} min${time ? ` (vers ${time})` : ""}.`,
    announcedReturnText: (minutes: number, time: string) =>
      `Le chauffeur est prévenu : vous serez au point de rendez-vous dans ${minutes} min${time ? ` (vers ${time})` : ""}.`,
    cancelAnnounce: "Annuler",
    endedExpired:
      "Le partage s’est arrêté au bout de 2 h et votre position a été effacée.",
    endedStopped: "Partage arrêté. Votre position a été effacée.",
    meetingReception: "Accueil",
    meetingReturn: "Point de rendez-vous",
    returnExplainTitle: "Prévenez le chauffeur",
    returnExplain: (meeting: string) =>
      `Une fois vos bagages récupérés, rejoignez le point de rendez-vous : ${meeting}. Le chauffeur de la navette voit votre message dans sa file.`,
    atPoint: "Je suis au point de rendez-vous",
    withPosition: "Joindre ma position (une seule fois, pour situer le point)",
    atPointDoneTitle: "Le chauffeur sait que vous êtes là",
    atPointDoneText: (meeting: string) =>
      `Restez au point de rendez-vous : ${meeting}. La navette arrive.`,
    noteLabel: "Un mot pour le parking (facultatif)",
    notePlaceholder: "Ex. 2 enfants, poussette",
    noteSent: (note: string) => `Votre mot : « ${note} »`,
    locationDenied:
      "Sans accès à votre position, vous pouvez prévenir le parking sans la partager.",
    locationUnavailable:
      "Votre navigateur ne donne pas accès à votre position : prévenez sans la partager.",
    errors: {
      arrival_window_closed:
        "Ce n’est pas encore le moment, ou il est passé : la page va se mettre à jour.",
      not_sharing: "Le partage n’est plus actif.",
      consent_required:
        "Votre accord est nécessaire pour partager votre position.",
    } as Record<string, string>,
  },
  /** D (06/10/2026): the "Navette" block during the stay (S-A in the app). */
  stayShuttles: {
    title: "Navette",
    titleLive: (n: number) => `Navette · ${n} en route`,
    mine: "Votre navette",
    vehicle: (colour: string | null) =>
      colour ? `Navette ${colour}` : "Navette",
    driver: (name: string) => `chauffeur : ${name}`,
    noPosition: "position en attente",
    etaParking: (minutes: number) => `à ${minutes} min du parking`,
    etaMeeting: (minutes: number) => `à ${minutes} min du point de rendez-vous`,
    direction: {
      pickup: "va chercher des voyageurs à l’aéroport",
      dropoff: "dépose des voyageurs au terminal",
    } as Record<string, string>,
    none: {
      arrival:
        "Aucune navette en route pour le moment : à votre arrivée, l’équipe vous conduit au terminal.",
      stay: "Aucune navette en route pour le moment.",
      return:
        "Aucune navette en route pour le moment : à l’atterrissage, prévenez le parking depuis cette page.",
    } as Record<string, string>,
  },
  status: {
    pending_payment: "En attente de paiement",
    upcoming: "Confirmée",
    arrived: "En cours",
    shuttled_out: "En cours",
    return_requested: "En cours",
    back_at_parking: "En cours",
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
    version: (date: string) => `Version du ${date}`,
    contents: "Sommaire",
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
    invalid_name: "Lettres, espaces, apostrophes et tirets seulement.",
    duplicate_booking:
      "Ce véhicule a déjà une réservation à ces dates. Retrouvez-la dans « Ma réservation ».",
    too_many_bookings:
      "Vous avez déjà plusieurs réservations en cours avec ces coordonnées. Gérez-les dans « Ma réservation ».",
    invalid_idempotency_key:
      "Le formulaire a expiré. Rechargez la page et réessayez.",
    invalid_slug: "Adresse invalide.",
    unknown_airport: "Aéroport inconnu.",
    validation_failed: "Certains champs sont à corriger.",
    overbooked:
      "Ce parking est complet pour au moins une nuit de votre séjour.",
    no_price: "Ce parking n’a pas de tarif pour la durée de votre séjour.",
    not_found: "Introuvable.",
    lookup_not_found:
      "Aucune réservation ne correspond à ce numéro avec cet e-mail ou ce téléphone.",
    flight_locked: "Le vol retour ne peut plus être modifié en ligne.",
    child_seats_exceed_passengers:
      "Les enfants comptent dans les passagers : ajoutez-les au nombre de passagers.",
    child_seats_range: "Entre 0 et 4 sièges de chaque sorte.",
    child_seats_locked:
      "Les sièges auto ne se modifient plus en ligne : dites-le au parking.",
    cancellation_closed:
      "Cette réservation ne peut plus être annulée en ligne.",
    online_booking_unavailable:
      "Ce parking n’accepte pas encore les réservations en ligne.",
    hold_expired:
      "Le délai de paiement est dépassé : votre place n’est plus réservée.",
    already_paid:
      "Le paiement est déjà passé : votre réservation est confirmée.",
    refund_failed:
      "Le remboursement n’a pas pu être lancé. Réessayez dans un instant ; votre réservation n’a pas été annulée.",
    payments_unavailable:
      "Le paiement en ligne est momentanément indisponible. Réessayez dans un instant.",
    too_many_requests: "Trop de tentatives. Réessayez dans quelques minutes.",
    rate_limited: "Trop de tentatives. Réessayez dans quelques minutes.",
    invalid: "Valeur invalide.",
    too_short: "Texte trop court.",
    message_too_short: "10 caractères au moins.",
    message_too_long: "2 000 caractères au plus.",
    consent_required: "Votre accord est nécessaire pour recevoir la lettre.",
    contact_unavailable:
      "Le formulaire de contact n’est pas encore ouvert. Retrouvez votre réservation dans « Ma réservation ».",
    contact_failed:
      "Votre message n’a pas pu partir. Réessayez dans un instant.",
    newsletter_unavailable:
      "L’inscription à la lettre n’est pas encore ouverte. Revenez bientôt.",
    newsletter_failed:
      "L’inscription n’a pas pu aboutir. Réessayez dans un instant.",
    too_many_attempts: "Trop de tentatives. Réessayez dans 15 minutes.",
    network: "Le service ne répond pas. Vérifiez votre connexion et réessayez.",
    server_error:
      "Une erreur est survenue de notre côté. Réessayez dans un instant.",
    unknown: "Une erreur est survenue. Réessayez.",
  } as Record<string, string>,
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends unknown[]
      ? T[K]
      : DeepPartial<T[K]>;
};

/**
 * Texts that change when bookings are paid by card on the site (Stripe): everything that says
 * "paid at the parking" says "paid online" instead. The rest of `fr` stays as it is.
 */
export const frOnline: DeepPartial<typeof frBase> = {
  meta: {
    defaultDescription:
      "Comparez les parkings privés avec navette autour de l’aéroport, voyez le prix total pour vos dates et réservez en ligne. Paiement sécurisé par carte.",
    airportDescription: (airport: string) =>
      `Parkings privés à l’aéroport de ${airport} avec navette gratuite vers les terminaux : prix total pour vos dates, réservation et paiement sécurisé en ligne.`,
  },
  home: {
    how: [
      [
        "Réservez et payez en ligne",
        "Comparez les parkings et choisissez le vôtre. Paiement sécurisé par carte : votre place est garantie pour toutes vos dates.",
      ],
      [
        "Déposez votre voiture",
        "Présentez-vous à l’accueil du parking : tout est déjà réglé. La navette vous conduit au terminal en quelques minutes.",
      ],
      [
        "La navette vous attend au retour",
        "Indiquez votre vol retour : le parking suit l’heure d’atterrissage et vous prévient par SMS.",
      ],
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
    step2Text: () =>
      "L’accueil vous attend : tout est déjà réglé, vous laissez la voiture et la navette vous dépose au terminal.",
    cancelText: (until: string) =>
      `Gratuit jusqu’au ${until} : remboursement intégral sur votre carte sous 5 à 10 jours.`,
    cancelConfirmText:
      "Votre place sera libérée et le paiement remboursé intégralement. Cette action est définitive.",
    cancelledNow:
      "Votre réservation est annulée. Remboursement intégral sur votre carte sous 5 à 10 jours. Un email de confirmation vous est envoyé.",
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
  for (const [key, value] of Object.entries(
    overrides as Record<string, unknown>,
  )) {
    out[key] =
      isPlainObject(value) && isPlainObject(out[key])
        ? merge(out[key], value as never)
        : value;
  }
  return out as T;
}

/** The site's texts. Every Plazo booking is paid online (06/10/2026): the online wording is the only one. */
export const fr: typeof frBase = merge(frBase, frOnline);

/** Kept for the callers that switched copy by payment mode: there is one copy now. */
export function texts(_online?: boolean): typeof fr {
  return fr;
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
