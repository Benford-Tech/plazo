import type {
  CancellationPolicy,
  ListingService,
  ListingStatus,
  PayoutSchedule,
  ReservationChannel,
  PlatformAudience,
  ReservationStatus,
  ShuttleStopKind,
  SmsMode,
  StaffRole,
  AlertKind,
  InboundEmailStatus,
  ShuttleDirection,
  WaveState,
} from "./types";
import { ApiError } from "./api";
import { PRODUCT } from "./product";

// All user-facing strings live here so the interface can be translated later.
export const fr = {
  common: {
    close: "Fermer",
    confirm: { title: "Confirmer", yes: "Confirmer", no: "Annuler" },
    save: "Enregistrer",
    saved: "Modifications enregistrées",
    never: "Jamais",
    loading: "Chargement…",
  },
  roles: {
    manager: "Gérant",
    agent: "Agent d'accueil",
    driver: "Chauffeur navette",
    valet: "Voiturier",
  } satisfies Record<StaffRole, string>,
  errors: {
    required: "Champ obligatoire.",
    too_long: "Texte trop long.",
    invalid_lat: "Position invalide.",
    invalid_lng: "Position invalide.",
    invalid_email: "Adresse email invalide.",
    invalid_role: "Rôle invalide.",
    integer: "Nombre entier attendu.",
    min_1: "Doit être au moins 1.",
    too_large: "Valeur trop grande.",
    margin_range: "Entre 0 et 50 %.",
    shuttle_range: "Entre 1 et 120 minutes.",
    password_too_short: "Au moins 10 caractères.",
    invalid_credentials: "Email ou mot de passe incorrect.",
    too_many_attempts: "Trop de tentatives. Réessayez dans 15 minutes.",
    too_many_requests: "Trop de demandes. Réessayez dans un instant.",
    daily_limit:
      "Limite atteinte : deux envois aux voyageurs par jour au plus.",
    invalid_audience: "Destinataires inconnus.",
    email_taken: "Cette adresse email est déjà utilisée.",
    cannot_demote_self:
      "Vous ne pouvez pas retirer vos propres droits de gérant ni désactiver votre compte.",
    last_manager: "Il doit rester au moins un gérant actif.",
    wrong_current_password: "Mot de passe actuel incorrect.",
    forbidden: "Vous n'avez pas accès à cette action.",
    trip_already_running:
      "Un trajet est déjà en cours : terminez-le avant d'en démarrer un autre.",
    inbound_unavailable:
      "La réception des mails n'est pas configurée sur la plateforme.",
    trip_not_running: "Ce trajet est terminé.",
    invalid_passengers:
      "Un des clients ne peut pas monter dans cette navette (statut changé ?). Actualisez la liste.",
    already_on_trip: "Un des clients est déjà sur un trajet en cours.",
    invalid_direction: "Sens du trajet invalide.",
    position_too_old: "Position trop ancienne : nouvel essai en cours.",
    too_many_positions: "Patientez quelques secondes.",
    not_found: "Élément introuvable.",
    unauthorized: "Votre session a expiré. Reconnectez-vous.",
    validation_failed: "Certains champs sont à corriger.",
    network: "Le serveur ne répond pas. Vérifiez votre connexion.",
    invalid_datetime: "Date ou heure invalide.",
    return_before_arrival: "Le retour doit être après l'arrivée.",
    stay_too_long: "Séjour de plus de 90 jours.",
    passengers_range: "Entre 1 et 9 passagers.",
    invalid_phone: "Numéro de téléphone invalide.",
    invalid_plate: "Plaque invalide.",
    invalid_flight: "Numéro de vol invalide (ex. TO 3627).",
    invalid_channel: "Canal invalide.",
    invalid_status: "Statut invalide.",
    invalid_transition: "Ce changement de statut n'est pas possible.",
    invalid_seats: "Entre 1 et 60 places.",
    invalid_driver: "Ce chauffeur ne fait pas partie de l'équipe.",
    vehicle_out_of_service: "Ce véhicule est hors service.",
    vehicle_taken: "Ce véhicule est déjà pris aujourd'hui par un collègue.",
    invalid_stop: "Cette desserte n'existe pas (ou plus).",
    too_many_passengers: "Plus de passagers que de places dans ce véhicule.",
    overbooked: "Au moins une nuit est complète.",
    reservation_closed: "Cette réservation est close.",
    unrecognised_email:
      "Ce texte ne ressemble à aucun mail de comparateur connu.",
    already_imported: "Cette réservation a déjà été importée.",
    min_0: "Doit être positif.",
    invalid_slug:
      "Lettres minuscules, chiffres et tirets seulement (ex. parking-demo).",
    slug_taken: "Cette adresse est déjà prise par un autre parking.",
    unknown_airport: "Aéroport inconnu.",
    invalid_url: "Adresse web invalide (http:// ou https://).",
    invalid_service: "Service inconnu.",
    invalid_policy: "Politique d'annulation inconnue.",
    number: "Nombre attendu.",
    pricing_required:
      "Enregistrez d'abord vos tarifs : une fiche sans prix ne peut pas être envoyée en validation.",
    duplicate_days: "Deux forfaits ont la même durée.",
    unknown: "Une erreur est survenue. Réessayez.",
    gateway: "Le serveur n'a pas répondu à temps. Réessayez dans un instant.",
    geo_unavailable:
      "Le service de l'IGN ne répond pas. Réessayez dans un instant.",
    ai_unavailable:
      "La proposition par Claude n'est pas disponible : clé API absente ou réponse inexploitable.",
    ai_refused:
      "Claude n'a pas pu lire cette photo. Peignez les zones de parking vous-même.",
    ai_busy: "Claude est saturé pour l'instant. Réessayez dans une minute.",
    ai_failed: "La lecture par Claude a échoué",
    ai_timeout: "Claude a mis trop de temps à lire la photo. Réessayez.",
    no_outline: "Repérez d'abord le terrain (étape 1).",
    geo_timeout:
      "Le service de l'IGN a mis trop de temps à répondre. Réessayez.",
    bbox_too_large: "Zoomez davantage pour afficher les parkings.",
    invalid_geometry: "Forme invalide.",
    too_many_vertices: "Forme trop détaillée (trop de sommets).",
    too_many_items: "Trop d'éléments.",
    invalid_item: "Élément invalide.",
    scale_range: "Échelle entre × 0,5 et × 2.",
    password_mismatch: "Les deux mots de passe ne sont pas identiques.",
    terms_required: "Acceptez les conditions pour continuer.",
    invalid_link: "Ce lien n'est plus valable : il a expiré ou a déjà servi.",
    account_suspended: `Ce compte est suspendu. Contactez l'équipe ${PRODUCT.name}.`,
    view_as_read_only:
      "En consultation, l'équipe, les mots de passe et les paiements du loueur ne se modifient pas.",
    view_as_ended: "La consultation de l'espace du loueur est terminée.",
    email_not_verified:
      "Confirmez d'abord votre adresse email (lien reçu par email).",
    listing_required: "Enregistrez d'abord votre fiche.",
    commission_range: "Entre 0 et 50 %.",
    cannot_suspend_platform:
      "Le compte de la plateforme ne peut pas être suspendu.",
    no_pending_invitation: "Aucune invitation en attente pour ce loueur.",
    payout_not_failed: "Ce reversement n'est pas en échec.",
    operator_account_not_ready:
      "Le compte Stripe du loueur ne peut pas encore recevoir de virement.",
    payments_disabled: "Le paiement en ligne n'est pas activé.",
    payments_not_connected: "Activez d'abord les paiements en ligne.",
    payments_unavailable: "Stripe ne répond pas. Réessayez dans un instant.",
    invalid_payout_schedule: "Calendrier de reversement inconnu.",
    invalid_date: "Date invalide.",
    invalid_sms_mode: "Choix inconnu.",
    invalid_tracking: "Choix inconnu.",
    shuttle_tracking_off:
      "Le suivi des navettes est désactivé pour ce parking.",
    unknown_variable:
      "Une variable entre accolades est inconnue : utilisez celles proposées.",
    invalid_time: "Heure non proposée.",
    reminder_not_tonight: "Seuls les SMS de ce soir peuvent partir maintenant.",
    reminder_already_sent: "Le SMS est déjà parti.",
    out_of_range: "Date hors de la période possible.",
    sms_not_configured: "Choisissez d'abord comment envoyer vos SMS.",
    sms_encryption_key_missing: `Le serveur ${PRODUCT.name} n'a pas sa clé de chiffrement des mots de passe : contactez l'équipe ${PRODUCT.name}.`,
    sms_encryption_key_invalid: `La clé de chiffrement du serveur ${PRODUCT.name} est invalide : contactez l'équipe ${PRODUCT.name}.`,
    sms_password_unreadable:
      "Le mot de passe enregistré ne peut plus être lu : saisissez-le à nouveau.",
    brevo_unavailable: `${PRODUCT.name} ne peut pas envoyer de SMS pour le moment : choisissez le téléphone du parking.`,
    sms_gateway_unauthorized:
      "Identifiant ou mot de passe refusé par l'appli : recopiez ceux affichés dans « Cloud server ».",
    sms_gateway_unreachable:
      "Le serveur de l'appli ne répond pas. Réessayez dans un instant.",
    sms_gateway_offline:
      "Le téléphone du parking est hors ligne : ouvrez l'appli et vérifiez qu'elle est « Online ».",
    sms_gateway_rejected: "L'appli a refusé le SMS (numéro ou texte invalide).",
    sms_gateway_error: "L'appli SMS a renvoyé une erreur. Réessayez.",
    sms_gateway_failed:
      "Le téléphone n'a pas pu envoyer le SMS (réseau ou forfait).",
    booking_refunded:
      "Réservation remboursée : elle ne peut plus être rouverte.",
    refund_failed: "Le remboursement a échoué. Réessayez.",
    spot_not_found: "Place introuvable.",
    spot_inactive: "Cette place est désactivée.",
    not_placeable: "Cette réservation ne peut pas être placée.",
    duplicate_code: "Code de place déjà utilisé.",
    no_spots:
      "Aucune place ne tient sur ce terrain : agrandissez-le ou vérifiez le tracé.",
    not_site_booking: `Seules les réservations ${PRODUCT.name} ont un lien de gestion.`,
    invalid_code: "Code de place invalide.",
    invalid_kind: "Type invalide.",
    boolean: "Oui ou non attendu.",
    invalid_stay_class: "Zone de séjour invalide.",
    invalid_layout: "Disposition invalide.",
    invalid_key_hook:
      "Crochet : 12 caractères max, lettres, chiffres, espace ou tiret.",
    invalid_airport: "Code aéroport invalide (3 lettres).",
    invalid: "Valeur invalide.",
    invalid_coordinate: "Coordonnées invalides.",
    invalid_bbox: "Zone invalide.",
    too_short: "Saisissez au moins 3 caractères.",
  } as Record<string, string>,
  login: {
    title: "Connexion",
    subtitle: "Espace professionnel",
    welcome: "Bienvenue",
    intro: "Connectez-vous avec le compte de votre parking.",
    email: "Email",
    password: "Mot de passe",
    submit: "Se connecter",
    passwordChanged: "Mot de passe modifié. Reconnectez-vous.",
    noAccount: "Pas encore de compte ?",
    signup: "Inscrire mon parking",
  },
  signup: {
    title: "Inscrire mon parking",
    subtitle: (product: string) =>
      `Rejoignez ${product} : votre fiche est vérifiée par notre équipe avant d'être en ligne.`,
    company: "Entreprise",
    parkingName: "Nom du parking",
    capacity: "Capacité (places)",
    airport: "Aéroport",
    chooseAirport: "Choisir un aéroport",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    phone: "Téléphone",
    password: "Mot de passe",
    passwordHelp: "Au moins 10 caractères.",
    passwordConfirmation: "Confirmer le mot de passe",
    terms:
      "J'accepte les conditions d'utilisation de l'espace professionnel et le traitement de ces données pour gérer mon compte.",
    termsLink: "Lire les conditions",
    privacy:
      "Nous ne gardons que ce qui sert à votre compte : votre nom, votre email et votre téléphone.",
    submit: "Créer mon compte",
    submitting: "Création du compte…",
    hasAccount: "Déjà un compte ?",
    login: "Se connecter",
    honeypot: "Ne pas remplir ce champ",
    // The account may already exist: the API answers the same, the login then fails.
    checkInbox:
      "Si cette adresse n'avait pas encore de compte, il vient d'être créé. Sinon, un email vous a été envoyé : connectez-vous avec votre mot de passe habituel.",
  },
  onboarding: {
    title: "Bienvenue ! Votre compte est créé.",
    steps: [
      "Remplissez votre fiche et vos tarifs.",
      "Envoyez-la pour validation : notre équipe la vérifie avant sa mise en ligne.",
    ],
  },
  emailBanner: {
    text: "Confirmez votre adresse email : nous vous avons envoyé un lien. Il faut l'avoir confirmée pour envoyer votre fiche en validation.",
    resend: "Renvoyer le lien",
    resent: "Nouveau lien envoyé.",
    devLink:
      "Email non configuré (développement) : ouvrir le lien de confirmation",
  },
  verifyEmail: {
    title: "Confirmation de l'adresse email",
    checking: "Vérification du lien…",
    done: "Adresse email confirmée. Vous pouvez envoyer votre fiche en validation.",
    missing: "Lien incomplet : ouvrez le lien reçu par email.",
    toSpace: "Aller à mon espace",
    toLogin: "Se connecter",
  },
  invitation: {
    title: "Choisir mon mot de passe",
    intro: (operator: string, email: string) =>
      `Espace de ${operator} · ${email}`,
    checking: "Vérification de l'invitation…",
    password: "Mot de passe",
    passwordConfirmation: "Confirmer le mot de passe",
    submit: "Accéder à mon espace",
    invalid: `Cette invitation n'est plus valable : elle a expiré ou a déjà servi. Demandez à l'équipe ${PRODUCT.name} de vous la renvoyer.`,
  },
  viewAs: {
    banner: (name: string) => `Vous consultez l'espace de ${name}`,
    note: "Vos modifications sont tracées dans le journal à votre nom.",
    back: "Revenir à la plateforme",
    readOnly:
      "En consultation, l'équipe, les mots de passe et le compte du loueur sont en lecture seule.",
  },
  nav: {
    planning: "Planning",
    shuttles: "Navettes",
    plazo: `Sur ${PRODUCT.name}`,
    reservations: "Réservations",
    dashboard: "Tableau de bord",
    parking: "Parking",
    team: "Équipe",
    account: "Mon compte",
    logout: "Se déconnecter",
    platform: "Plateforme",
  },
  dashboard: {
    hello: (name: string) => `Bonjour ${name}`,
    title: "Tableau de bord",
    today: (date: string) => `Aujourd'hui · ${date}`,
    refreshed: (ago: string) => `Actualisé ${ago}`,
    loadError: "Impossible de charger le tableau de bord.",
    kpi: {
      onSite: "Sur le parking",
      onSiteSub: (free: number | null, planned: number) =>
        free === null
          ? `${planned === 0 ? "plan à dessiner" : ""}`
          : `${free} libre${free > 1 ? "s" : ""} sur ${planned}`,
      arrivals: "Arrivées",
      arrivalsSub: (arrived: number, total: number) =>
        `${arrived} / ${total} sur place`,
      returns: "Retours",
      returnsSub: (week: number) => `${week} cette semaine`,
      shuttles: "Navettes",
      shuttlesSub: (n: number) =>
        n === 0 ? "aucune en route" : n === 1 ? "en route" : "en route",
      nextWave: (time: string, passengers: number, vehicles: number | null) =>
        `prochaine ${time} · ${passengers} pass.${vehicles && vehicles > 1 ? ` · ${vehicles} navettes` : ""}`,
      toTreat: "À traiter",
      toTreatSub: (urgent: number) =>
        urgent === 0
          ? "rien d'urgent"
          : `${urgent} urgent${urgent > 1 ? "s" : ""}`,
    },
    services: {
      title: "Services",
      ok: "OK",
      warn: "À voir",
      off: "Off",
      flights: "Vols",
      flightsOn: (provider: string | null) =>
        provider ? `suivi ${provider}` : "suivi actif",
      flightsOff: "non configuré",
      sms: "SMS",
      smsOff: "désactivés",
      smsPending: (n: number) => `${n} en attente`,
      smsOk: "prêts",
      smsStale: "en retard",
      push: "Notifications",
      pushOn: (devices: number) =>
        `${devices} appareil${devices > 1 ? "s" : ""}`,
      pushOff: "non configurées",
      stripe: "Paiements",
      stripeOn: "reversements actifs",
      stripePending: "compte à finaliser",
      stripeOff: "non connecté",
      importLabel: "Import",
      importAt: (ago: string) => `dernier ${ago}`,
      importNever: "jamais",
    },
    alerts: {
      title: "À traiter maintenant",
      urgentCount: (n: number) => `${n} urgent${n > 1 ? "s" : ""}`,
      empty: "Rien à traiter : tout est en ordre.",
      since: (minutes: number) => `depuis ${minutes} min`,
      severity: { urgent: "Urgent", watch: "À surveiller", todo: "À faire" },
      kind: {
        no_spot: "Sur place sans place",
        no_free_spot: "Plus de place libre",
        arriving_unplaced: "Arrivée sans place prévue",
        flight_delayed: "Vol retardé",
        flight_cancelled: "Vol annulé",
        waiting_at_meeting_point: "Attend au point de rendez-vous",
        keys_missing: "Clés non accrochées",
        sms_pending: "SMS en attente",
        overbooked: "Surréservation",
        departure_cancelled: "Vol aller annulé",
        departure_delayed: "Vol aller retardé",
        wave_overflow: "Vague au-delà d'une navette",
        no_show_suspected: "Attendu, toujours pas là",
        blocked_return: "Retour du jour bloqué : sortir d'abord",
        inbound_to_check: "Mails à vérifier",
      } satisfies Record<AlertKind, string>,
      waveDetail: (
        direction: ShuttleDirection,
        time: string,
        passengers: number,
      ) =>
        `${direction === "dropoff" ? "Vers le terminal" : "Depuis l'aéroport"} ${time} · ${passengers} passagers`,
    },
    vehicles: {
      title: "Véhicules sur le parking",
      count: (n: number) => `${n} véhicule${n > 1 ? "s" : ""}`,
      empty: "Aucun véhicule sur le parking.",
      noSpot: "Sans place",
      keys: (hook: string) => `Clés ${hook}`,
      noKeys: "Clés ?",
      returnToday: (time: string) => `Retour ${time}`,
      returnLater: (day: string) => `Retour ${day}`,
      onTrip: {
        pickup: "Navette · retour",
        dropoff: "Navette · terminal",
      } satisfies Record<ShuttleDirection, string>,
      stay: {
        short: "zone court",
        medium: "zone moyen",
        long: "zone long",
      } as Record<string, string>,
      all: "Tous les véhicules",
      pax: (n: number) => `${n} pass.`,
      keysHook: (hook: string) => `Clés : crochet ${hook}`,
      flight: (code: string, time: string) => `Vol ${code} · ${time}`,
      badge: {
        returnToday: "Retour du jour",
        landed: "Atterri",
        delayed: (min: number) => `Retardé +${min} min`,
        cancelled: "Vol annulé",
        onTrip: "Sur un trajet",
        shuttled: "Navette faite",
        waiting: "Attend la navette",
        onSite: "Sur place",
        noSpot: "Sans place",
        noKeys: "Clés ?",
      },
    },
    map: {
      title: "Navettes en direct",
      none: "Aucune navette en route.",
      parking: "Parking",
      direction: {
        pickup: "Retours · aéroport",
        dropoff: "Départs · terminal",
      } satisfies Record<ShuttleDirection, string>,
      passengers: (n: number) => `${n} pass.`,
      toStop: (name: string, min: number) => `${name} dans ${min} min`,
      toParking: (min: number) => `parking dans ${min} min`,
      noPosition: "position inconnue",
      open: "Ouvrir les retours",
      shuttle: (n: number) => `Navette ${String(n).padStart(2, "0")}`,
      since: (at: Date) =>
        `partie à ${new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(at)}`,
      legend: { fresh: "position récente", stale: "position ancienne" },
    },
    totalCapacity: "Places au total",
    bookableCapacity: "Places réservables",
    safetyMargin: "Marge de sécurité",
    shuttle: "Trajet navette",
    minutes: (n: number) => `${n} min`,
    places: (n: number) => `${n} place${n > 1 ? "s" : ""}`,
    bookableHelp:
      "Capacité totale moins la marge de sécurité : c'est le plafond utilisé contre la surréservation.",
  },
  parking: {
    tabs: {
      plan: "Plan",
      occupation: "Occupation",
      planning: "Planning des places",
      settings: "Réglages",
    },
    title: "Réglages du parking",
    name: "Nom du parking",
    address: "Adresse",
    totalCapacity: "Nombre de places au total",
    safetyMarginPct: "Marge de sécurité (%)",
    safetyMarginHelp:
      "Part des places jamais proposées à la réservation (imprévus, prolongations).",
    shuttleTravelMinutes: "Durée du trajet navette (minutes)",
    shuttleHelp: "Entre le parking et le terminal.",
    terminalLeadMinutes: "Présence au terminal avant le décollage (minutes)",
    terminalLeadHelp:
      "La navette aller part ce délai plus le trajet avant le décollage du vol aller.",
    landingDelayMinutes: "Délai après l'atterrissage (minutes)",
    landingDelayHelp:
      "Bagages, douane : le temps entre l'atterrissage et le point de rendez-vous.",
    bookablePreview: (n: number) =>
      `Places réservables avec ces réglages : ${n}`,
  },
  meetingPoint: {
    title: "Point de rendez-vous au retour",
    intro:
      "Là où la navette récupère vos clients à l'aéroport. Le voyageur y est guidé à pied depuis le terminal, avec vos consignes et votre photo.",
    none: "Aucun point défini : l'aéroport de votre fiche est utilisé.",
    search: "Rechercher une adresse ou un lieu",
    searchPlaceholder: "ex. Aéroport Lyon Saint-Exupéry, Terminal 1",
    searchAction: "Chercher",
    noResult: "Aucun résultat.",
    mapHelp:
      "Cliquez sur la carte (ou déplacez le repère) pour placer le point exact.",
    label: "Libellé",
    labelPlaceholder: "ex. Terminal 1 · Porte 12 · Arrêt navettes parkings",
    instructions: "Consignes pour le voyageur",
    instructionsHelp: (left: number) =>
      `Chemin depuis la sortie bagages, repères, où attendre. ${left} caractères restants.`,
    photoUrl: "Photo du point de rendez-vous (adresse web)",
    photoUrlHelp:
      "Pas encore d'envoi de fichier : collez l'adresse d'une photo en ligne (https://…), comme pour les photos de votre fiche.",
    photoPreview: "Aperçu de la photo du point de rendez-vous",
    coordinates: (lat: number, lng: number) =>
      `Position : ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    clear: "Supprimer le point",
    saved: "Point de rendez-vous enregistré.",
    cleared: "Point de rendez-vous supprimé.",
    needPoint: "Placez d'abord le point sur la carte.",
  },
  vehicles: {
    title: "Navettes",
    intro:
      "Vos véhicules : le chauffeur choisit le sien au départ d'un trajet, et le voyageur sait quelle navette attendre.",
    empty:
      "Aucune navette enregistrée : le chauffeur saisira son véhicule à la main.",
    model: "Modèle",
    modelPlaceholder: "ex. Mercedes Vito",
    colour: "Couleur",
    colourPlaceholder: "ex. blanche",
    plate: "Plaque",
    seats: "Places passagers",
    seatsHelp: "Hors chauffeur ; limite le nombre de clients d'un trajet.",
    seatsShort: (n: number) => `${n} pl.`,
    driver: "Chauffeur habituel",
    driverNone: "Aucun (au choix du chauffeur)",
    inService: "En service",
    outOfService: "Hors service",
    outOfServiceHelp:
      "Un véhicule hors service n'est pas proposé au départ d'un trajet.",
    add: "Ajouter la navette",
    edit: "Modifier",
    editLabel: (model: string) => `Modifier la navette ${model}`,
    editing: (model: string) => `Modification de ${model}`,
    save: "Enregistrer",
    cancel: "Annuler",
    remove: "Retirer",
    removeLabel: (model: string) => `Retirer la navette ${model}`,
    added: "Navette ajoutée.",
    updated: "Navette modifiée.",
    removed: "Navette retirée.",
  },
  stops: {
    title: "Dessertes de la navette",
    intro:
      "Les lieux desservis en plus de l'aéroport (gare TGV, hôtel…). Le chauffeur choisit la desserte au départ d'un trajet ; une réservation peut en indiquer une.",
    airport: "Aéroport",
    airportHelp: "Toujours desservi : le point de rendez-vous ci-dessus.",
    airportUnset: "Aéroport : point de rendez-vous à définir ci-dessus.",
    empty: "Aucune autre desserte : la navette ne va qu'à l'aéroport.",
    kind: "Type",
    kinds: {
      airport: "Aéroport",
      station: "Gare",
      other: "Autre lieu",
    } as Record<ShuttleStopKind, string>,
    name: "Nom",
    namePlaceholder: "ex. Gare Saint-Exupéry TGV",
    search: "Adresse ou lieu",
    searchPlaceholder: "ex. Gare Lyon Saint-Exupéry",
    searchAction: "Chercher",
    noResult: "Aucun lieu trouvé.",
    coordinates: (lat: number, lng: number) =>
      `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    needPoint: "Cherchez d'abord le lieu pour le placer.",
    instructions: "Consignes pour le voyageur (facultatif)",
    instructionsHelp: (left: number) => `${left} caractères restants.`,
    add: "Ajouter la desserte",
    edit: "Modifier",
    editLabel: (name: string) => `Modifier la desserte ${name}`,
    editing: (name: string) => `Modification de ${name}`,
    save: "Enregistrer",
    cancel: "Annuler",
    remove: "Retirer",
    removeLabel: (name: string) => `Retirer la desserte ${name}`,
    added: "Desserte ajoutée.",
    updated: "Desserte modifiée.",
    removed: "Desserte retirée.",
  },
  team: {
    title: "Équipe",
    postToday: "Poste du jour",
    vehicleToday: "Véhicule du jour",
    postSince: (when: string) => `depuis ${when}`,
    add: "Ajouter un membre",
    name: "Nom",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    phone: "Téléphone",
    role: "Rôle",
    active: "Actif",
    inactive: "Désactivé",
    lastLogin: "Dernière connexion",
    password: "Mot de passe provisoire",
    passwordHelp:
      "À communiquer à la personne, qui le changera dans « Mon compte ».",
    create: "Créer le compte",
    created: "Compte créé",
    updated: "Membre mis à jour",
    deactivate: "Désactiver",
    reactivate: "Réactiver",
    resetPassword: "Nouveau mot de passe",
    passwordReset: "Mot de passe réinitialisé. Ses sessions ont été fermées.",
    you: "vous",
  },
  account: {
    title: "Mon compte",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    submit: "Changer le mot de passe",
  },
  status: {
    upcoming: "Attendu",
    arrived: "Sur place",
    shuttled_out: "Parti en navette",
    return_requested: "Retour demandé",
    back_at_parking: "De retour au parking",
    returned: "Rendu",
    cancelled: "Annulé",
    no_show: "Non venu",
  } satisfies Record<ReservationStatus, string>,
  statusAction: {
    upcoming: "Remettre en attente",
    arrived: "Enregistrer l'arrivée",
    shuttled_out: "Parti en navette",
    return_requested: "Client au point de rendez-vous",
    back_at_parking: "Client de retour au parking",
    returned: "Véhicule rendu",
    cancelled: "Annuler la réservation",
    no_show: "Marquer non venu",
  } satisfies Record<ReservationStatus, string>,
  channels: {
    website: "Site",
    phone: "Téléphone",
    counter: "Comptoir",
    aggregator: "Comparateur",
    import: "Import",
    // Booked by a traveller on the public site.
    plazo: PRODUCT.name,
  } satisfies Record<ReservationChannel, string>,
  planning: {
    today: "Aujourd'hui",
    previousDay: "Jour précédent",
    nextDay: "Jour suivant",
    newReservation: "+ Réservation",
    nightsTitle: "Occupation des nuits",
    overbookedBy: (n: number) => `Surréservé +${n}`,
    almostFull: "Presque plein",
    free: (n: number) => `${n} libre${n > 1 ? "s" : ""}`,
    arrivals: "Arrivées",
    returns: "Retours",
    arrivalsCount: (total: number, here: number) =>
      `${total} · ${here} sur place`,
    noArrival: "Aucune arrivée ce jour.",
    noReturn: "Aucun retour ce jour.",
    pax: (n: number) => `${n} pers.`,
    from: (city: string) => `de ${city}`,
    // Travellers telling the parking they are coming (live position or announce).
    approaching: (eta: number | null) =>
      eta === null ? "En route" : `En approche · ${eta} min`,
    announced: (minutes: number) => `Prévenu · « dans ${minutes} min »`,
    atReception: "À l'accueil",
    atMeetingPoint: "Au point de rendez-vous",
    positionUpdated: (seconds: number) =>
      seconds < 60
        ? `Position mise à jour il y a ${seconds} s`
        : `Position mise à jour il y a ${Math.floor(seconds / 60)} min`,
    etaAround: (time: string) => `arrivée estimée ${time}`,
    distance: (meters: number) =>
      meters < 1000
        ? `${meters} m`
        : `${(meters / 1000).toFixed(1).replace(".", ",")} km`,
    miniMap: (name: string) =>
      `Position de ${name} par rapport au point de rendez-vous`,
    meetingPointMark: "P",
    toastApproaching: (who: string, eta: number | null, plate: string) =>
      eta === null
        ? `${who} est en route — ${plate}`
        : `${who} arrive dans ${eta} min — ${plate}`,
    toastAnnounced: (who: string, minutes: number, plate: string) =>
      `${who} : « J'arrive dans ${minutes} min » — ${plate}`,
    /** E: the traveller's word, after the banner. */
    toastNote: (note: string) => ` · « ${note} »`,
    toastAtReception: (who: string, plate: string) =>
      `${who} est à l'accueil — ${plate}`,
    toastAtMeetingPoint: (who: string, plate: string) =>
      `Retour : ${who} est au point de rendez-vous — ${plate}`,
    toastSee: "Voir ›",
    toastClose: "Fermer l'alerte",
    // The driver's trip picking this traveller up (position shared with them).
    shuttleOnTheWay: (driver: string) => `Navette en route (${driver})`,
    smsWarning: (n: number) => `${n} SMS en attente · téléphone injoignable`,
    smsWarningHint:
      "Allumez le téléphone du parking et ouvrez l'appli SMS Gateway. Les SMS en attente plus de 2 h sont abandonnés.",
  },
  reservation: {
    pricePaid: "Prix payé",
    newTitle: "Nouvelle réservation",
    editTitle: "Modifier la réservation",
    arrival: "Arrivée",
    return: "Retour",
    date: "Date",
    time: "Heure",
    customerName: "Client",
    customerPhone: "Téléphone",
    customerEmail: "Email (facultatif)",
    email: "Email",
    plate: "Plaque",
    returnFlight: "Vol retour",
    returnFlightHelp:
      "Pour suivre l'atterrissage et prévoir la navette retour.",
    departureFlight: "Vol aller (facultatif)",
    departureFlightHelp:
      "Pour prévoir la navette vers le terminal avant le décollage.",
    departureStatus: {
      scheduled: "à l'heure",
      delayed: "retardé",
      departed: "parti",
      landed: "parti",
      cancelled: "annulé",
      diverted: "dérouté",
      unknown: "vol inconnu",
    } as Record<string, string>,
    takeOff: (time: string) => `décollage ${time}`,
    carPosition: "Position de la voiture",
    carBy: {
      traveller: "donnée par le client",
      staff: "prise par l'équipe",
    } as Record<string, string>,
    carAccuracy: (m: number) => `± ${m} m`,
    carDirections: "Itinéraire à pied",
    stop: "Desserte",
    stopAirport: "Aéroport",
    passengers: "Passagers",
    channel: "Canal",
    channelDetail: "Nom du comparateur",
    notes: "Notes",
    /** E (06/10/2026): what the traveller told the parking. */
    customerNote: "Message du client",
    vehicleModel: "Modèle du véhicule",
    vehicleColour: "Couleur",
    vehicleDetails: (
      model: string | null | undefined,
      colour: string | null | undefined,
    ) => [model, colour].filter(Boolean).join(" · "),
    returnNotice: "Signalé au retour",
    returnNoticeKinds: {
      flight_delayed: "Mon vol a du retard",
      luggage: "Bagage perdu ou retardé",
      other: "Un mot du voyageur",
    } as Record<string, string>,
    returnNoticeLine: (kind: string, text: string | null, time: string) =>
      `${kind === "other" && text ? `« ${text} »` : `${{ flight_delayed: "Mon vol a du retard", luggage: "Bagage perdu ou retardé", other: "Un mot du voyageur" }[kind] ?? kind}${text ? ` · « ${text} »` : ""}`} · ${time}`,
    nights: (n: number) => `${n} nuit${n > 1 ? "s" : ""}`,
    save: "Enregistrer",
    saved: "Réservation enregistrée",
    full: (days: string) => `Complet : ${days}.`,
    fullHelp:
      "Refusée sur la page publique. Au comptoir, vous pouvez l'enregistrer quand même en connaissance de cause.",
    fullNoForce: "Seul un agent ou le gérant peut l'enregistrer quand même.",
    force: "Enregistrer quand même (surréservation)",
    available: (n: number) =>
      `Disponible : au moins ${n} place${n > 1 ? "s" : ""} libre${n > 1 ? "s" : ""} chaque nuit.`,
    reference: "Référence",
    overbookedBadge: "Surréservation",
    edit: "Modifier",
    cancelEdit: "Annuler la modification",
    status: "Statut",
    journey: "Étapes",
    contact: "Contact",
    stay: "Séjour",
    created: "Créée le",
    searchPlaceholder: "Plaque, nom, téléphone ou référence",
    search: "Rechercher",
    noResult: "Aucune réservation trouvée.",
    previous: "Précédent",
    next: "Suivant",
    page: (p: number, total: number) => `Page ${p} / ${total}`,
    listTitle: "Réservations",
    back: "Retour",
  },
  payments: {
    kicker: "Paiements en ligne · à activer",
    title: `Recevez l'argent des réservations ${PRODUCT.name} sur votre compte bancaire`,
    intro: {
      before: `Les voyageurs paient par carte sur ${PRODUCT.name}. ${PRODUCT.name} garde sa commission (`,
      after:
        ") et vous reverse le reste automatiquement. Vos réservations en ligne sont déjà ouvertes : tant que ce n'est pas activé, vos reversements restent en attente.",
    },
    commissionUnset: "à définir",
    steps: [
      "1. Vos informations et votre IBAN chez Stripe",
      "2. Vérification (quelques minutes à 2 jours)",
      "3. Réservations ouvertes",
    ],
    activate: "Activer les paiements ›",
    redirectNote:
      "Vous serez redirigé vers Stripe, notre prestataire de paiement.",
    testModeNote: "Mode test : aucun argent réel.",
    pendingKicker: "Paiements en ligne · vérification",
    pendingTitle: "Vérification en cours chez Stripe",
    pendingText:
      "Stripe vérifie vos informations, en général de quelques minutes à 2 jours. Vos réservations en ligne s'ouvrent dès que c'est fait. Si Stripe demande un document, complétez votre dossier.",
    complete: "Compléter mon dossier ›",
    active: "Paiements en ligne : actifs",
    manage: "Gérer sur Stripe ›",
    disabled: `Paiements en ligne : pas encore ouverts sur ${PRODUCT.name}. Les voyageurs réservent et paient au parking.`,
    readOnly:
      "Consultation : seul le loueur peut activer ses paiements et choisir quand recevoir son argent.",
    returned: "Dossier envoyé à Stripe",
    expired: "Lien expiré, recommencez",
    scheduleTitle: "Quand recevoir votre argent ?",
    scheduleSaved: "Calendrier de reversement enregistré",
    scheduleFootnote: `${PRODUCT.name} encaisse le paiement du voyageur, garde sa commission et vous vire le reste à la date choisie. Stripe verse ensuite sur votre IBAN sous 2 à 7 jours.`,
    recommended: "conseillé",
    schedule: {
      AT_DROP_OFF: {
        title: "Au dépôt",
        text: "le lendemain de l'arrivée du véhicule",
      },
      AFTER_STAY: { title: "Fin du séjour", text: "le lendemain du retour" },
      WEEKLY: { title: "Chaque semaine", text: "le lundi, séjours terminés" },
      MONTHLY: { title: "Chaque mois", text: "le 1er, séjours terminés" },
    } satisfies Record<PayoutSchedule, { title: string; text: string }>,
  },
  sms: {
    title: "SMS aux voyageurs",
    kickerSetup: "Envoi des SMS · à configurer",
    kickerGateway: "Envoi des SMS · téléphone du parking",
    kickerBrevo: `Envoi des SMS · ${PRODUCT.name} envoie pour vous`,
    kickerNone: "Envoi des SMS · désactivé",
    headline:
      "Envoyez les SMS depuis le téléphone de votre parking, gratuitement",
    intro:
      "Confirmation, rappel du point de rendez-vous à l'atterrissage, navette en approche : les SMS partent de votre propre numéro, avec votre forfait. Les voyageurs peuvent y répondre ou vous rappeler.",
    modes: {
      gateway: {
        title: "Téléphone du parking",
        text: "Gratuit · un Android allumé avec SMS illimités",
      },
      brevo: {
        title: `${PRODUCT.name} envoie pour moi`,
        text: "0,05 € par SMS, décompté sur vos reversements",
      },
      none: { title: "Pas de SMS", text: "Email seulement" },
    } satisfies Record<SmsMode, { title: string; text: string }>,
    steps: [
      {
        before:
          "Sur le téléphone Android du parking, installez l'appli gratuite ",
        strong: "SMS Gateway for Android",
        after: " (Play Store ou GitHub).",
      },
      {
        before: "Ouvrez-la, choisissez ",
        strong: "« Cloud server »",
        after:
          " et activez-la : elle affiche un identifiant et un mot de passe.",
      },
      {
        before: "Recopiez-les ici, puis envoyez un SMS de test.",
        strong: "",
        after: "",
      },
    ],
    login: "Identifiant affiché par l'appli",
    loginPlaceholder: "ex. AB12CD",
    password: "Mot de passe affiché par l'appli",
    passwordKept: "Laissez vide pour garder celui enregistré.",
    senderPhone: "Numéro du téléphone (expéditeur)",
    testRecipient: "Envoyer un SMS de test à",
    phonePlaceholder: "+33 6 …",
    advanced: "Serveur (avancé)",
    advancedHelp:
      "Vide : le serveur public de l'appli. Sinon l'adresse https:// de votre serveur privé.",
    link: "Relier et tester",
    linking: "Liaison…",
    noAndroid: "Je n'ai pas de téléphone Android",
    chooseOther: "Choisir",
    saved: "Réglage enregistré",
    linked: "Téléphone relié",
    testSent: (to: string) =>
      `SMS de test envoyé à ${to} : vérifiez sa réception.`,
    testQueued: (to: string) =>
      `SMS de test transmis au téléphone pour ${to} : il part dès que le téléphone est en ligne.`,
    testFailed: "Le SMS de test n'est pas parti.",
    linkedStatus: "Relié",
    lastSent: (ago: string) => `dernier SMS envoyé ${ago}`,
    neverSent: "aucun SMS envoyé pour l'instant",
    sender: "Expéditeur",
    monthSent: (n: number) => `${n} SMS envoyé${n > 1 ? "s" : ""} ce mois`,
    monthFailed: (n: number) => `${n} échec${n > 1 ? "s" : ""}`,
    pending: (n: number) => `${n} en attente`,
    pendingStale: "téléphone injoignable",
    sendTest: "Envoyer un SMS de test",
    sendTestTo: "Numéro qui recevra le SMS de test",
    send: "Envoyer",
    cancel: "Annuler",
    edit: "Modifier",
    disable: "Désactiver",
    disableConfirm:
      "Désactiver les SMS ? Les voyageurs ne recevront plus que les emails.",
    disabled: "SMS désactivés",
    offlineWarning:
      "Si le téléphone est éteint ou hors ligne, les SMS sont mis en attente 2 h puis abandonnés ; le planning le signale.",
    lastError: (ago: string) => `Dernière erreur ${ago} :`,
    brevoActive: `${PRODUCT.name} envoie vos SMS depuis son propre numéro, 0,05 € par SMS décomptés sur vos reversements.`,
    noneActive: `${PRODUCT.name} n'envoie pas de SMS pour votre parking : les voyageurs reçoivent les emails seulement.`,
    changeChannel: "Changer",
    footnote: `Tant que rien n'est configuré, ${PRODUCT.name} n'envoie pas de SMS pour votre parking (les emails partent quand même). Le mot de passe est chiffré côté serveur et jamais réaffiché.`,
    readOnly:
      "Consultation : seul le loueur peut relier son téléphone ou changer l'envoi des SMS.",
  },
  listingStatus: {
    draft: "Brouillon",
    pending_review: "À valider",
    published: "Publiée",
    rejected: "Refusée",
  } satisfies Record<ListingStatus, string>,
  plazo: {
    tabs: { listing: "Ma fiche", pricing: "Mes tarifs" },
    submit: "Envoyer pour validation",
    submitted:
      "Fiche envoyée : notre équipe la vérifie avant sa mise en ligne.",
    withdraw: `Retirer de ${PRODUCT.name}`,
    cancelRequest: "Annuler la demande",
    withdrawn: "Votre fiche n'est plus en ligne.",
    requestCancelled: "Demande de validation annulée.",
    statusHelp: {
      draft:
        "Votre fiche n'est pas visible. Remplissez-la, enregistrez vos tarifs, puis envoyez-la pour validation.",
      pending_review:
        "Notre équipe vérifie votre fiche. Vous pouvez encore la modifier.",
      published:
        "Votre fiche est en ligne. Vos modifications s'appliquent tout de suite.",
      rejected:
        "Votre fiche est à corriger. Corrigez-la, puis envoyez-la à nouveau.",
    } satisfies Record<ListingStatus, string>,
    reviewMessage: `Message de l'équipe ${PRODUCT.name}`,
    verifyFirst: "Confirmez votre email pour pouvoir envoyer votre fiche.",
    saved: "Fiche enregistrée",
    airport: "Aéroport",
    title: "Nom affiché",
    slug: "Adresse de la page",
    description: "Présentation",
    services: "Services",
    shuttleMinutes: "Navette (min)",
    distanceKm: "Distance (km)",
    openingHours: "Horaires",
    openingHoursPlaceholder: "24h/24",
    cancellation: "Annulation",
    photos: "Photos (la première sert de vignette)",
    photoUrl: "Adresse de la photo (https://…)",
    addPhoto: "+ Photo",
    removePhoto: "Retirer la photo",
    photosHelp:
      "Collez l'adresse d'une photo en ligne. L'envoi de fichiers depuis l'ordinateur arrive bientôt.",
    preview: `Aperçu dans les résultats ${PRODUCT.name}`,
    from: (price: string) => `dès ${price}`,
    noPrice: "prix à définir",
    newOnPlazo: `Nouveau sur ${PRODUCT.name}`,
    see: "Voir",
    viewPage: "Voir ma page",
    save: "Enregistrer",
    pricingIntro:
      "Un séjour paie le forfait le moins cher qui le couvre. Les jours se comptent du jour d'arrivée au jour de retour inclus.",
    duration: "Durée",
    priceAll: "Prix tout compris",
    upTo: "Jusqu'à",
    dayUnit: (n: number) => (n > 1 ? "jours" : "jour"),
    removeTier: "Supprimer ce forfait",
    addTier: "+ Ajouter un forfait",
    extraDay: (days: number) =>
      `Au-delà de ${days} jour${days > 1 ? "s" : ""}, chaque jour en plus :`,
    extraDayNoTier: "Chaque jour au-delà du plus long forfait :",
    extraDayLabel: "Prix du jour supplémentaire",
    savePricing: "Enregistrer les tarifs",
    pricingSaved: "Tarifs enregistrés",
    unsaved: "Modifié · non enregistré",
    simulationTitle: "Ce que paie le voyageur",
    simDays: (n: number) => `${n} j`,
    simTier: (n: number) => `Forfait ${n} jour${n > 1 ? "s" : ""}`,
    simExtra: (base: number, extra: number, price: string) =>
      `${base} jours + ${extra} × ${price}`,
    simNone: "Pas de prix : ajoutez un forfait plus long ou un prix par jour",
    commission: (pct: string) =>
      `Sur une réservation payée en ligne, ${PRODUCT.name} retient sa commission (${pct} %) et vous reverse le reste. Les réservations au comptoir, par téléphone ou via les comparateurs ne sont pas concernées.`,
    commissionUnset: `Sur une réservation payée en ligne, ${PRODUCT.name} retient une commission (taux à convenir) et vous reverse le reste. Les réservations au comptoir, par téléphone ou via les comparateurs ne sont pas concernées.`,
    invalidPrice: "Prix invalide (ex. 34,99).",
    invalidDays: "Entre 1 et 90 jours.",
  },
  services: {
    shuttle: "Navette",
    open_24h: "24h/24",
    fenced: "Clôturé",
    cctv: "Vidéosurveillance",
    valet: "Voiturier",
    covered: "Couvert",
    ev_charging: "Recharge électrique",
  } satisfies Record<ListingService, string>,
  cancellation: {
    free_24h: ["Gratuite 24 h avant", "remboursement total"],
    free_48h: ["Gratuite 48 h avant", "remboursement total"],
    free_until_arrival: ["Jusqu'à l'arrivée", "remboursement total"],
    non_refundable: ["Non remboursable", ""],
  } satisfies Record<CancellationPolicy, [string, string]>,
  cancellationShort: {
    free_24h: "Annulation gratuite 24 h",
    free_48h: "Annulation gratuite 48 h",
    free_until_arrival: "Annulation gratuite",
    non_refundable: "Non remboursable",
  } satisfies Record<CancellationPolicy, string>,
  capacity: {
    steps: ["Repérer le terrain", "Découper en zones", "Estimer la capacité"],
    study: "Étude",
    rename: "Renommer l'étude",
    saving: "Enregistrement…",
    saved: "Enregistré",
    saveError: "Non enregistré",
    // Study list
    listTitle: "Mes études",
    listSubtitle:
      "Estimations de capacité des terrains des loueurs (outil réservé à la plateforme).",
    newStudy: "Nouvelle étude",
    newStudyName: "Nouvelle étude",
    empty: "Aucune étude pour l'instant.",
    colName: "Étude",
    colParcels: "Parcelles",
    colRange: "Fourchette",
    colUpdated: "Mise à jour",
    open: "Ouvrir",
    delete: "Supprimer",
    confirmDelete: (name: string) => `Supprimer l'étude « ${name} » ?`,
    deleted: "Étude supprimée",
    rangeShort: (a: number, b: number) => `${a} à ${b} voitures`,
    // Step 1
    tools: {
      pan: "Déplacer",
      addVertex: "Sommet +",
      removeVertex: "Sommet −",
      cut: "Exclure une partie",
      draw: "Dessiner",
    },
    toolHelp: {
      pan: "Cliquez sur le terrain pour ajouter ou retirer sa parcelle cadastrale.",
      addVertex:
        "Faites glisser un sommet, ou un point milieu pour en ajouter un.",
      removeVertex: "Cliquez sur un sommet pour le retirer.",
      cut: "Dessinez la partie à retirer du contour ; double-cliquez pour terminer.",
      draw: "Cliquez chaque coin du terrain ; double-cliquez pour terminer.",
      dimension:
        "Cliquez deux sommets du contour, puis saisissez la distance mesurée sur place.",
    },
    address: "Adresse ou point sur la carte",
    addressPlaceholder: "Adresse, commune ou « latitude, longitude »",
    pointLabel: (lat: number, lon: number) =>
      `Point ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    searching: "Recherche…",
    noResult: "Aucune adresse trouvée.",
    outline: "Contour proposé",
    noOutline: "Pas encore de contour",
    noOutlineHelp:
      "Cliquez sur le terrain : sa parcelle cadastrale est proposée comme contour. Cliquez les parcelles voisines pour les ajouter.",
    drawByHand: "ou dessiner le contour à la main",
    parcelsLabel: (ids: string) => `Parcelles cadastrales ${ids}`,
    clippedWithParking:
      "recoupées avec la surface de parking repérée par l'IGN (BD TOPO)",
    editedByHand: "contour corrigé à la main",
    drawnByHand: "Contour dessiné à la main",
    clipToParking: "Recouper avec le parking BD TOPO",
    parcelLoading: "Recherche de la parcelle…",
    parcelNone: "Aucune parcelle cadastrale à cet endroit.",
    sources: "Sources affichées",
    sourcePhoto: "Photo aérienne IGN",
    sourcePhotoHelp: (date: string) => `20 cm · ${date} · licence ouverte`,
    sourceParcels: "Parcelles cadastrales",
    sourceParcelsHelp: "API Carto · cadastre",
    sourceParkings: "Parkings BD TOPO",
    sourceParkingsHelp: "IGN · surfaces de parking",
    // B-A (07/10/2026): the IGN buildings become exclusions by themselves.
    sourceBuildings: "Bâtiments BD TOPO",
    sourceBuildingsHelp: "IGN · emprise des bâtiments",
    ignBuildings: "Exclure les bâtiments repérés par l'IGN",
    ignBuildingsCount: (n: number) =>
      n === 0
        ? "Aucun bâtiment IGN sur le terrain"
        : `${n} bâtiment${n > 1 ? "s" : ""} IGN exclu${n > 1 ? "s" : ""} (1 m de marge, à retirer d'un clic à l'étape Zones)`,
    ignBuildingsLoading: "Recherche des bâtiments IGN…",
    ignBuildingsError:
      "Bâtiments IGN indisponibles pour l'instant : ajoutez-les à la main à l'étape Zones.",
    parkingsZoom: "zoomez pour les afficher",
    help: "Corrigez le contour à la souris (déplacer un sommet, en ajouter, en retirer), puis saisissez une cote mesurée sur place pour caler l'échelle.",
    addDimension: "Ajouter une cote",
    validateOutline: "Valider le contour",
    dimension: "Cote mesurée",
    dimensionPick: (n: number) =>
      n === 0 ? "Cliquez le premier sommet." : "Cliquez le second sommet.",
    dimensionOnMap: (m: string) => `Sur la photo : ${m} m`,
    dimensionMeasured: "Distance mesurée sur place (m)",
    apply: "Appliquer",
    cancel: "Annuler",
    scale: "Échelle",
    scaleNone: "× 1 (aucune cote saisie)",
    scaleValue: (factor: string, measured: string) =>
      `× ${factor} · cote de ${measured} m mesurée sur place`,
    removeScale: "Retirer la cote",
    // Step 2
    zonesTitle: (area: string) => `Zones du terrain · ${area} m²`,
    zoneName: (letter: string) => `Zone ${letter}`,
    zoneSubtitle: "stationnement",
    zoneDetail: "voitures légères",
    // P-A (07/10/2026): the brush of the zones step.
    brush: "Zone de parking",
    eraser: "Zone de passage",
    brushWidth: "Largeur",
    brushHelp:
      "Maintenez le clic et peignez où les voitures peuvent se garer ; les traits qui se touchent fusionnent.",
    eraserHelp:
      "Maintenez le clic et peignez les zones de passage : allées, accès, endroits où l'on ne peut pas se garer.",
    // V-A (07/10/2026): Claude proposes the zones from the photo.
    suggest: "Proposer les zones avec Claude",
    suggesting: "Claude lit la photo…",
    suggestHelp:
      "Claude lit la photo aérienne du terrain et propose les surfaces où l'on peut garer. Vous gardez la main : la proposition s'ajoute à vos zones, à compléter avec « Zone de parking » et « Zone de passage » avant ou après.",
    suggestGrass: "Herbe autorisée (pelouse, pré)",
    suggestion: {
      title: (n: number) =>
        n === 0
          ? "Aucune surface reconnue"
          : `${n} zone${n > 1 ? "s" : ""} proposée${n > 1 ? "s" : ""}`,
      none: "Claude n'a reconnu aucune surface garable dans le contour. Peignez les zones de parking vous-même.",
      surfaces: {
        asphalt: "enrobé",
        gravel: "gravier",
        concrete: "béton",
        grass: "herbe",
        other: "autre sol",
      },
      confidence: (pct: number) => `sûr à ${pct} %`,
      apply: "Ajouter à mes zones",
      dismiss: "Ignorer",
      applied: (n: number, total: number) =>
        `${n} zone${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""}, ${total} au total : ajustez-les avec « Zone de parking » et « Zone de passage » si besoin.`,
      cost: (model: string, tokens: number) => `${model} · ${tokens} jetons`,
    },
    // T-A (07/10/2026): the zones follow the land and its exclusions unless drawn by hand.
    autoZones: "Zones automatiques",
    autoZonesOn:
      "Zones découpées automatiquement autour des bâtiments et des parties exclues : chacune reçoit sa propre orientation. Ajoutez ou modifiez une zone pour les tracer vous-même.",
    autoZonesOff: "Zones tracées à la main.",
    addZone: "+ Zone de stationnement",
    addExclusion: "+ Partie exclue (bâtiment, arbre, poteau)",
    chooseExclusion: "Quelle partie exclure ?",
    exclusionKinds: {
      building: "Bâtiment",
      reception: "Accueil et remise des clés",
      shuttle_lane: "Voie navette",
      tree: "Arbre",
      post: "Poteau",
      other: "Autre partie",
    },
    exclusionSubtitle: {
      building: "exclu du stationnement",
      reception: "exclue du stationnement",
      shuttle_lane: "circulation, exclue",
      tree: "dégagement autour du tronc",
      post: "dégagement autour",
      other: "exclue du stationnement",
    },
    laneWidth: "Largeur (m)",
    clearance: "Dégagement (m)",
    drawZoneHelp:
      "Dessinez la zone sur la carte ; double-cliquez pour terminer.",
    drawLineHelp: "Tracez l'axe de la voie ; double-cliquez pour terminer.",
    drawPointHelp: "Cliquez l'emplacement sur la carte.",
    editHelp: "Faites glisser les sommets de l'élément sélectionné.",
    remove: "Retirer",
    back: "Retour",
    estimate: "Estimer la capacité",
    noZone: "Ajoutez au moins une zone de stationnement.",
    // Step 3
    compared: (zone: string, area: string) =>
      `${zone} · ${area} m² · 3 dispositions comparées`,
    zonesCount: (n: number) => `${n} zones`,
    computing: "Calcul des dispositions…",
    layouts: {
      selfPark: "Clients garés seuls",
      valet24: "Voiturier · files de 2 à 4",
      valet5: "Voiturier · files de 5",
      valetEdge: "Voiturier · peigne",
    },
    cars: "voitures",
    perCar: (m2: string) => `${m2} m² par voiture`,
    selfParkDetail: (slot: string, aisle: string, endStalls: boolean) =>
      `Épi 90°, places ${slot} m, allées ${aisle} m${endStalls ? ", places en bout d'allée" : ""}`,
    valet24Detail: (pattern: string, depth: number) =>
      `Blocs ${pattern}, aucune voiture à plus de ${depth} rangs d'une allée`,
    valet5Detail: (pattern: string) =>
      `Blocs ${pattern} : plus dense, mais fragile en cas de retour avancé`,
    valetEdgeDetail: (deepest: number) =>
      `Allées de service en peigne reliées par une allée de bout, files jusqu'à ${deepest} voitures de chaque côté, restes remplis dans l'autre sens`,
    aisle: "allée",
    range: (a: number, b: number) => `${a} à ${b} voitures`,
    rangeLabel: "Fourchette à annoncer : ",
    ceiling: (n: number) => `Plafond théorique sans aucune allée : ${n}.`,
    photoCheck: "Contrôle sur la photo : ",
    photoCounted: (n: number) => `≈ ${n} voitures comptées`,
    photoOn: (date: string) => ` le ${date} (comptage à la main).`,
    photoTodo: "compter les voitures sur la photo",
    settings: "Réglages",
    overlaySlot: "Place",
    overlayAisle: "Allée",
    overlayOrientation: "Orientation",
    overlayDepth: "Profondeur max",
    auto: "auto",
    selfParkSlot: "Place client (largeur × longueur, m)",
    valetSlot: "Place voiturier (largeur × longueur, m)",
    aisleWidth: "Largeur d'allée (m)",
    maxDepth: "Profondeur max entre deux allées",
    setback: "Retrait en bordure (m)",
    orientation: "Orientation (°, vide = auto)",
    endStalls: "Places en bout d'allée (clients)",
    crossAisles: "Allées transversales aux extrémités",
    export: "Exporter (GeoJSON)",
    createPlan: "Créer le plan du parking",
    soon: "Bientôt (jalon 4)",
    noResult3: "Aucune place ne tient : vérifiez les zones et les réglages.",
    // Photo check
    photoTitle: "Contrôle sur la photo",
    photoHelp: (date: string) =>
      `voitures comptées sur la photo IGN du ${date} (cliquez sur chaque voiture ; cliquez à nouveau pour la retirer)`,
    occupied: (area: string) => `Surface occupée : ${area} m²`,
    observed: "Constaté : ",
    perCarSuffix: " par voiture",
    estimated: "Estimé (voiturier 2–4) : ",
    photoNote:
      "La photo date de juillet 2023, un jour quelconque : elle montre un remplissage, pas une capacité maximale. À comparer avec le pic réel donné par le gérant.",
    clearCount: "Effacer le comptage",
    save: "Enregistrer",
    backToEstimate: "Retour à l'estimation",
  },
  // Bloc 2, step "Planning des places" (P-A, 04/10/2026): one line per spot over the coming days.
  spotPlanning: {
    title: "Planning des places",
    intro:
      "Une ligne par place : qui l'occupe, qui est attendu, et les jours où il manquera des places.",
    noPlan: "Générez d'abord les places dans le volet Plan.",
    today: "Aujourd'hui",
    prev: "Semaine précédente",
    next: "Semaine suivante",
    windowLabel: "Fenêtre",
    window: (days: number) => `${days} jours`,
    load: "Besoin / places",
    legend: {
      onSite: "Sur place",
      upcoming: "Attendu",
      leaving: "Départ aujourd'hui",
    },
    alerts: "Alertes",
    noAlert: "Rien à signaler sur la fenêtre.",
    overCapacity: (date: string, n: number) =>
      `${date} : ${n} véhicule${n > 1 ? "s" : ""} de trop pour les places`,
    unplacedAlert: (n: number) =>
      `${n} réservation${n > 1 ? "s" : ""} sans place`,
    inactiveUsed: (code: string, ref: string) =>
      `${code} est désactivée mais tient ${ref}`,
    blockedAlert: (n: number) =>
      `${n} voiture${n > 1 ? "s" : ""} derrière une autre qui repart plus tard`,
    unplaced: (n: number) => `Sans place · ${n}`,
    allPlaced: "Toutes les réservations de la fenêtre ont une place.",
    preassign: "Pré-affecter",
    preassignHint:
      "Donne une place à chaque réservation sans place : libre sur tout le séjour, près de la remise, retours groupés par rangée.",
    preassigned: (n: number, skipped: number) =>
      `${n} place${n > 1 ? "s" : ""} attribuée${n > 1 ? "s" : ""}${skipped ? ` · ${skipped} sans solution` : ""}`,
    stay: "Séjour",
    moveTo: "Déplacer vers",
    placeIn: "Placer en",
    choose: "Choisir…",
    noFree: "Aucune place libre sur ce séjour.",
    release: "Libérer la place",
    clickBar: "Cliquez un séjour pour le déplacer.",
    moved: (plate: string, code: string) => `${plate} placé en ${code}`,
    released: (plate: string) => `${plate} n'a plus de place`,
    spotTaken: "Cette place est déjà prise sur ces dates.",
    openBooking: "Ouvrir la réservation",
  },
  // Bloc 2, step "Occupation" (P-A, 04/10/2026): who is where, where the arrivals go.
  occupation: {
    title: "Occupation",
    intro:
      "Le plan en couleurs, les véhicules à placer et la recherche d'un véhicule par plaque, nom ou référence.",
    noPlan: "Générez d'abord les places dans le volet Plan.",
    search: "Rechercher un véhicule",
    searchPlaceholder: "Plaque, nom ou référence",
    noResult: "Aucun véhicule ne correspond.",
    // D-B (07/10/2026): the plan read by stay length, the classes of the plan's stay zones.
    mode: { state: "Par état", stay: "Par durée" },
    stayLegend: {
      short: "Court séjour",
      medium: "Moyen séjour",
      long: "Long séjour",
      freeZone: "Libre : sa zone en pâle",
      none: "Hors zone de séjour",
    },
    stayLine: (nights: number, stay: string, zone: string | null) =>
      `${nights} nuit${nights > 1 ? "s" : ""} · ${stay}${zone ? ` · place en ${zone}` : ""}`,
    legend: {
      occupied: "Occupée",
      leaving: "Départ aujourd'hui",
      booked: "Réservée (à venir)",
      free: "Libre",
      inactive: "Désactivée",
      // O-A (06/10/2026) marks on the plan.
      proposed: "Proposée",
      toTakeOut: "À sortir avant un retour",
      manoeuvre: "Manœuvre",
    },
    stats: (occupied: number, active: number, leaving: number) =>
      `${occupied} / ${active} places occupées · ${leaving} départ${leaving > 1 ? "s" : ""} aujourd'hui`,
    arrivals: (n: number) => `Arrivées à placer · ${n}`,
    stayZone: {
      short: "zone court séjour",
      medium: "zone moyen séjour",
      long: "zone long séjour",
    },
    noArrival: "Toutes les arrivées du jour ont une place.",
    suggested: (code: string) => `→ ${code} proposé`,
    reason: {
      near_handover: (m: number) => `à ${m} m de la remise`,
      near_entrance: (m: number) => `à ${m} m de l'entrée`,
      free: "libre pendant le séjour",
    },
    // O-A (06/10/2026): the file keeps its order, or cars will have to move.
    noMove: "sans déplacement",
    movesOut: (n: number, code: string, when: string) =>
      `${n} voiture${n > 1 ? "s" : ""} à sortir (${code}, retour ${when})`,
    movesBlocked: (n: number, code: string) =>
      `bloquerait ${n} voiture${n > 1 ? "s" : ""} (${code})`,
    blockedBy: (code: string, when: string) =>
      `Derrière ${code} · retour ${when}`,
    place: "Placer",
    chooseOnMap: "Choisir sur le plan",
    choosing: (plate: string) =>
      `Cliquez une place libre pour y mettre ${plate}.`,
    cancelChoice: "Annuler",
    spot: "Place",
    noSpot: "Pas de place",
    rowIndex: (row: number, index: number) => `Rangée ${row}, place ${index}`,
    keyHook: "Clés : crochet",
    keyHookPlaceholder: "n°",
    carPosition: (
      by: "traveller" | "staff",
      time: string,
      accuracy: number | null,
    ) =>
      `Position GPS ${by === "staff" ? "prise par l'équipe" : "donnée par le client"} à ${time}${accuracy !== null ? ` (± ${accuracy} m)` : ""}`,
    carDirections: "Itinéraire",
    legendCar: "Position GPS d'une voiture",
    saveKeys: "Enregistrer",
    returnOn: (date: string) => `Retour ${date}`,
    flight: (flight: string) => `vol ${flight}`,
    move: "Déplacer",
    release: "Libérer la place",
    placed: (plate: string, code: string) => `${plate} placé en ${code}`,
    released: (plate: string) => `${plate} n'a plus de place`,
    keysSaved: "Crochet enregistré",
    openBooking: "Ouvrir la réservation",
    freeSpot: "Place libre",
    clickSpot: "Cliquez une place sur le plan pour voir qui l'occupe.",
    bookedFor: (plate: string, date: string) => `${plate} attendu le ${date}`,
    spotTaken: "Cette place est déjà prise sur ces dates.",
  },
  // Bloc 2, step "Plan" (P-A, 03/10/2026): the operator's own parking plan.
  // R-A (07/10/2026): the plan editor, one map and one toolbar; see CLAUDE.md, bloc 2.
  planEditor: {
    tools: {
      contour: "Contour",
      parking: "Zone de parking",
      passage: "Zone de passage",
      obstacle: "Obstacle",
      landmark: "Repères",
      spots: "Places",
    },
    toolHelp: {
      contour:
        "Cliquez votre terrain : sa parcelle cadastrale devient le contour. Cliquez les voisines pour les ajouter.",
      parking:
        "Maintenez le clic et peignez où les voitures peuvent se garer ; les traits qui se touchent fusionnent.",
      passage:
        "Maintenez le clic et peignez les allées, accès et endroits où l'on ne peut pas se garer.",
      obstacle:
        "Choisissez un obstacle puis cliquez ou tracez-le sur la carte. Cliquez un obstacle existant pour le modifier.",
      landmark:
        "Choisissez un repère puis cliquez son emplacement. Un repère d'un même type remplace le précédent.",
      spots:
        "Choisissez une disposition et générez les places, puis cliquez une place pour la désactiver ou changer son type.",
    },
    count: (n: number) => `${n} place${n > 1 ? "s" : ""}`,
    countEstimated: "estimation",
    countGenerated: (active: number, total: number) =>
      active === total ? "générées" : `actives sur ${total}`,
    noOutlineYet: "Pas encore de contour",
    settings: "Réglages…",
    // The first pass (R-C): the parking arrives already filled in, the operator corrects.
    auto: {
      title: "Préparation du plan",
      intro:
        "Depuis l'adresse du parking : parcelle, bâtiments, zones et places. Vous corrigerez ensuite.",
      steps: {
        parcel: "Parcelle cadastrale",
        buildings: "Bâtiments IGN",
        zones: "Zones garables",
        spots: "Places",
      },
      zonesByClaude: "proposées par Claude",
      zonesAuto: "tout le terrain hors bâtiments",
      noParcel:
        "Aucune parcelle à l'adresse du parking : cliquez votre terrain ou tracez son contour.",
      noPosition:
        "Le parking n'a pas d'adresse localisée : cliquez votre terrain ou tracez son contour.",
      done: (n: number) =>
        `Plan préparé : ${n} place${n > 1 ? "s" : ""}. Corrigez ce qui ne va pas.`,
      failed: "La préparation s'est arrêtée : continuez à la main.",
    },
    contour: {
      parcels: (ids: string) => `Parcelles ${ids}`,
      drawn: "Contour tracé à la main",
      draw: "Tracer à la main",
      drawHelp:
        "Cliquez chaque coin du terrain ; double-cliquez pour terminer.",
      edit: "Corriger les sommets",
      editHelp:
        "Faites glisser un sommet, ou un point milieu pour en ajouter un.",
      cut: "Retirer une partie",
      cutHelp:
        "Tracez la partie à retirer du contour ; double-cliquez pour terminer.",
      stop: "Terminer",
      clear: "Effacer le contour",
      clearConfirm:
        "Effacer le contour ? Les zones, obstacles et places tracés dessus seront effacés aussi.",
      area: (m2: string) => `${m2} m²`,
    },
    brush: {
      width: "Largeur",
      zones: (n: number) =>
        n === 0 ? "Aucune zone" : `${n} zone${n > 1 ? "s" : ""}`,
      removeZone: "Retirer",
      autoHelp: "Sans tracé, les zones suivent le terrain hors obstacles.",
    },
    obstacle: {
      add: "Ajouter",
      selected: "Obstacle sélectionné",
      clearance: "Marge (m)",
      remove: "Supprimer",
      list: (n: number) =>
        n === 0 ? "Aucun obstacle" : `${n} obstacle${n > 1 ? "s" : ""}`,
      ign: "repéré par l'IGN",
      drawPolygon: "Tracez son contour ; double-cliquez pour terminer.",
      drawLine: "Tracez l'axe de la voie ; double-cliquez pour terminer.",
      drawPoint:
        "Cliquez son emplacement. Cliquez ailleurs pour en placer d'autres.",
    },
    landmark: {
      placed: "Placés",
      none: "Aucun repère pour l'instant.",
      remove: "Retirer",
      placeHelp: (kind: string) => `Cliquez l'emplacement de « ${kind} ».`,
    },
    spots: {
      layout: "Disposition",
      generate: (n: number) => `Générer ${n} place${n > 1 ? "s" : ""}`,
      regenerate: (n: number) => `Régénérer (${n} place${n > 1 ? "s" : ""})`,
      adjust: "Ajuster",
      needZones: "Peignez d'abord une zone de parking.",
      // P-B (07/10/2026): a row of spots along a line drawn on the map.
      row: "+ Rangée de places",
      rowHelp:
        "Tracez l'axe de la rangée ; double-cliquez pour terminer. Les places se posent côte à côte le long du trait.",
      rowAdded: (n: number) =>
        `${n} place${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""} à la main`,
      rowTooShort: "Trait trop court pour une place.",
      remove: "Supprimer",
      removeHelp:
        "Cliquez une place posée à la main pour la supprimer ; une place générée se désactive.",
      removed: "Place supprimée",
      manualCount: (n: number) => `${n} à la main`,
    },
    drawer: {
      title: "Réglages du plan",
      geometry: "Dimensions",
      aisleWidth: "Largeur d'allée (m)",
      setback: "Recul au bord des zones (m)",
      edgeMaxFiles: "Files au plus, de chaque côté d'une allée",
      valetSlot: "Place voiturier (largeur × longueur, m)",
      selfParkSlot: "Place client (largeur × longueur, m)",
      orientation: "Orientation des rangées",
      orientationAuto: "Automatique",
      orientationFixed: "Fixe (degrés)",
      stays: "Zones de séjour",
      stayShort: "Court séjour jusqu'à (nuits)",
      stayMedium: "Moyen séjour jusqu'à (nuits)",
      sources: "Sources IGN",
      ignBuildings: "Exclure les bâtiments repérés par l'IGN",
      clipToParking: "Recouper le contour avec le parking BD TOPO",
      photo: "Photo aérienne",
      scale: "Échelle de la photo",
      scaleHelp:
        "Facteur appliqué aux distances mesurées sur la photo (1 = telle quelle).",
      close: "Fermer",
    },
  },
  parkingPlan: {
    steps: ["Repérer le terrain", "Découper en zones", "Générer les places"],
    title: "Plan du parking",
    intro:
      "Tracez votre terrain sur la photo aérienne, découpez-le en zones, puis générez les places : la capacité déclarée se recalcule depuis les places actives.",
    saving: "Enregistrement…",
    saved: "Enregistré",
    saveError: "Non enregistré",
    // R-A (07/10/2026): start again, in whole or in part.
    reset: "Réinitialiser…",
    resetAll: "Tout le plan",
    resetAllHelp:
      "Contour, zones, parties exclues, repères et places : la carte repart vide, sur l'adresse du parking.",
    resetZones: "Les zones et parties exclues",
    resetZonesHelp:
      "Le contour reste ; les zones sont redécoupées, les bâtiments IGN gardés.",
    resetSpots: "Les places seulement",
    resetSpotsHelp:
      "Le tracé reste ; les places sont effacées, la capacité déclarée ne bouge pas.",
    resetConfirm: {
      all: "Effacer tout le plan (contour, zones, parties exclues, repères et places) ? La capacité déclarée ne change pas.",
      zones:
        "Effacer les zones et les parties exclues tracées à la main ? Les places générées seront effacées aussi.",
      spots: "Effacer toutes les places ? La capacité déclarée ne change pas.",
    },
    resetDone: "Plan réinitialisé",
    layout: "Disposition",
    layouts: {
      selfPark: "Clients garés seuls",
      valet24: "Voiturier · files de 2 à 4",
      valet5: "Voiturier · files de 5",
      valetEdge: "Voiturier · peigne",
    },
    computing: "Calcul des dispositions…",
    places: (n: number) => `${n} place${n > 1 ? "s" : ""}`,
    /** M-A: the yield of a layout, usable area over places (aisles included). */
    perCar: (m2: number) => `${m2} m² par place`,
    // Z-A (04/10/2026): stay classes by rank in the file.
    stayZones: "Zones de séjour",
    stayClasses: {
      short: "Court séjour",
      medium: "Moyen séjour",
      long: "Long séjour",
    },
    stayClassesHelp: (short: number, medium: number) =>
      `Premier rang depuis l'allée : court séjour (jusqu'à ${short} nuits) ; fond de file : long séjour (plus de ${medium} nuits) ; entre les deux : moyen. La pré-affectation suit ces zones.`,
    stayClassCount: (n: number) => `${n}`,
    generate: "Générer les places",
    regenerate: "Régénérer les places",
    regenerateConfirm:
      "Régénérer remplace toutes les places et leurs réglages (places désactivées, types). Continuer ?",
    generated: (n: number) => `${n} places générées`,
    generatedOn: (date: string, layout: string) =>
      `Généré le ${date} · ${layout}`,
    noSpots:
      "Aucune place pour l'instant : choisissez une disposition et générez les places.",
    counts: "Places",
    countGenerated: "Générées",
    countActive: "Actives",
    countDeclared: "Capacité déclarée",
    applyCapacity: (n: number) => `Recalculer la capacité → ${n}`,
    capacityApplied: (n: number) => `Capacité déclarée : ${n} places`,
    capacityInSync: "Capacité déclarée à jour",
    adjust: "Ajuster à la main",
    adjustHelp:
      "Cliquez une place pour la désactiver ou la réactiver ; choisissez un type puis cliquez des places pour le leur donner.",
    tools: { toggle: "Activer / désactiver", kind: "Type de place" },
    spotKinds: {
      standard: "Standard",
      large: "Grand gabarit",
      covered: "Couverte",
      pmr: "PMR",
      reserved: "Réservée",
    },
    landmarks: "Repères",
    landmarksHelp:
      "Placez l'entrée, la sortie, la remise des clés, l'arrêt navette et la boîte à clés : ils servent aux distances et aux consignes.",
    landmarkKinds: {
      entrance: "Entrée",
      exit: "Sortie",
      handover: "Remise des clés",
      shuttle_stop: "Arrêt navette",
      key_box: "Boîte à clés",
    },
    placeLandmark: (kind: string) =>
      `Cliquez l'emplacement de « ${kind} » sur la carte.`,
    remove: "Retirer",
    back: "Retour",
    next: "Suivant",
    spotUpdated: "Place mise à jour",
    legend: { active: "Active", inactive: "Désactivée" },
    noZones: "Découpez d'abord le terrain en zones.",
  },
  platform: {
    brand: "Plateforme",
    tabs: {
      operators: "Loueurs",
      listings: "Annonces",
      reservations: "Réservations",
      payments: "Paiements",
      notifications: "Notifications",
      capacity: "Outil capacité",
    },
    notifications: {
      title: "Notifications",
      intro:
        "Un message push aux téléphones qui ont activé les notifications : le personnel de tous les parkings, les voyageurs qui ont une réservation en cours, ou l'équipe d'un seul loueur. À réserver aux informations utiles (incident, nouveauté, fermeture).",
      notConfigured:
        "OneSignal n'est pas configuré sur le serveur : l'envoi n'atteindra personne.",
      audience: "Destinataires",
      audiences: {
        staff: "Tout le personnel",
        travellers: "Tous les voyageurs",
        operator: "Un loueur",
      } as Record<PlatformAudience, string>,
      operator: "Loueur",
      operatorNone: "Choisir un loueur",
      titleField: "Titre",
      titlePlaceholder: "ex. Mise à jour de Plazo Pro",
      body: "Message",
      bodyPlaceholder:
        "ex. Une nouvelle version est disponible : mettez l'application à jour.",
      charsLeft: (n: number) => `${n} caractères restants.`,
      url: "Lien à l'ouverture (facultatif)",
      urlHelp: "Adresse https ouverte quand on touche la notification.",
      counting: "Comptage des téléphones…",
      reach: (n: number) =>
        n === 0
          ? "Aucun téléphone à joindre"
          : `${n} téléphone${n > 1 ? "s" : ""} à joindre`,
      send: (n: number) => `Envoyer à ${n} téléphone${n > 1 ? "s" : ""}`,
      confirmTitle: "Confirmer l'envoi",
      confirm: (n: number, audience: string) =>
        `Envoyer ce message à ${n} téléphone${n > 1 ? "s" : ""} (${audience.toLowerCase()}) ? Il ne peut pas être rappelé.`,
      confirmYes: "Envoyer",
      cancel: "Annuler",
      travellersLimit: "Voyageurs : deux envois par jour au plus.",
      sent: (n: number) => `Envoyé à ${n} téléphone${n > 1 ? "s" : ""}.`,
      history: "Envois précédents",
      historyEmpty: "Aucun envoi pour le moment.",
      colWhen: "Date",
      colAudience: "Destinataires",
      colMessage: "Message",
      colRecipients: "Téléphones",
      colBy: "Par",
    },
    view: "Vue :",
    viewAll: "Toute la plateforme",
    viewOwn: (name: string) => `Mon espace (${name})`,
    viewMenu: "Changer de vue",
    logout: "Se déconnecter",
    operators: {
      title: "Loueurs",
      invite: "+ Inviter un loueur",
      colOperator: "Loueur",
      colManager: "Gérant",
      colListing: "Annonce",
      colPayments: "Paiements",
      colCommission: "Commission",
      colBookings: "Résa. du mois",
      parkingsPlaces: (parkings: number, places: number) =>
        `${parkings} parking${parkings > 1 ? "s" : ""} · ${places} places`,
      invitedOn: (date: string) => `invitation envoyée le ${date}`,
      invitationExpired: (date: string) =>
        `invitation expirée (envoyée le ${date})`,
      suspendedOn: (date: string) => `suspendu le ${date}`,
      platformAccount: "compte de la plateforme",
      emailToConfirm: "email à confirmer",
      paymentsActive: "Actifs",
      paymentsToActivate: "À activer",
      paymentsNone: "Non connectés",
      noListing: "Pas de fiche",
      defaultCommission: (pct: string) => `${pct} % (défaut)`,
      noCommission: "à définir",
      open: "Ouvrir son espace ›",
      resend: "Renvoyer l'invitation",
      resent: "Invitation renvoyée.",
      suspend: "Suspendre",
      reactivate: "Réactiver",
      confirmSuspend: (name: string) =>
        `Suspendre ${name} ? Son équipe sera déconnectée et ne pourra plus se connecter, et ses fiches seront retirées du site.`,
      suspended: "Loueur suspendu.",
      reactivated: "Loueur réactivé.",
      editCommission: (name: string) => `Modifier la commission de ${name}`,
      commissionLabel: "Commission (%)",
      commissionSaved: "Commission enregistrée.",
      commissionHelp: "Vide : taux par défaut de la plateforme.",
      cancel: "Annuler",
      save: "Enregistrer",
      empty: "Aucun loueur pour l'instant.",
      statusSuspended: "Suspendu",
      statusDemo: "Démo",
      demoHint: "Loueur fictif créé par les données de démonstration",
      inviteTitle: "Inviter un loueur",
      inviteName: "Nom de l'entreprise / du parking",
      inviteEmail: "Email du gérant",
      inviteCapacity: "Capacité (places)",
      inviteCommission: (pct: string | null) =>
        pct ? `Commission (par défaut ${pct} %)` : "Commission (%)",
      inviteSubmit: "Envoyer l'invitation",
      inviteHelp:
        "Le gérant reçoit un email avec un lien (valable 7 jours) pour choisir son mot de passe. Personne d'autre ne connaît son mot de passe.",
      invited: "Invitation envoyée.",
      linkTitle: "L'email n'a pas pu partir",
      linkWarning:
        "L'envoi d'emails n'est pas configuré. Copiez ce lien et transmettez-le vous-même au gérant : il ne sera plus affiché. Il est valable 7 jours et ne sert qu'une fois.",
      copy: "Copier le lien",
      copied: "Lien copié.",
      close: "Fermer",
      canDoTitle: "Ce que vous pouvez faire sur un loueur",
      canDo: [
        "Valider / dépublier son annonce",
        "Régler sa commission",
        "Ouvrir son espace (bandeau jaune « Vous consultez l'espace de … »), actions tracées dans le journal",
        "Suspendre le compte",
      ],
    },
    listings: {
      title: "Annonces",
      filters: {
        pending_review: "À valider",
        published: "Publiées",
        rejected: "Refusées",
        draft: "Brouillons",
        all: "Toutes",
      },
      empty: "Aucune annonce dans cette liste.",
      submittedOn: (date: string) => `envoyée le ${date}`,
      updatedOn: (date: string) => `modifiée le ${date}`,
      approve: "Valider",
      reject: "Refuser",
      unpublish: "Dépublier",
      details: "Voir la fiche",
      hideDetails: "Masquer la fiche",
      approved: "Annonce publiée.",
      rejected: "Annonce refusée. Le loueur voit votre message sur sa fiche.",
      unpublished: "Annonce dépubliée.",
      rejectLabel: "Message au loueur (obligatoire)",
      rejectPlaceholder: "Ce qu'il faut corriger avant la mise en ligne…",
      unpublishLabel: "Message au loueur (facultatif)",
      confirmReject: "Refuser l'annonce",
      confirmUnpublish: "Dépublier l'annonce",
      cancel: "Annuler",
      previewNote:
        "Aperçu tel qu'il apparaîtra dans les résultats ; la page publique n'existe qu'une fois l'annonce validée.",
      viewPage: "Voir la page publique",
      operatorSuspended: "loueur suspendu",
      address: "Adresse",
      description: "Présentation",
      prices: "Tarifs",
      noPrices: "Aucun tarif enregistré.",
      upTo: (days: number, price: string) => `Jusqu'à ${days} j : ${price}`,
      photos: "Photos",
      noPhoto: "Aucune photo.",
      lastMessage: "Dernier message envoyé",
      places: (n: number) => `${n} places`,
    },
    reservations: {
      title: "Réservations",
      operator: "Loueur",
      allOperators: "Tous les loueurs",
      from: "Arrivée du",
      to: "au",
      colArrival: "Arrivée",
      colOperator: "Loueur",
      colParking: "Parking",
      colReference: "Référence",
      colPlate: "Plaque",
      colStatus: "Statut",
      colAmount: "Montant",
      colChannel: "Canal",
      empty: "Aucune réservation pour ces filtres.",
      total: (n: number) => `${n} réservation${n > 1 ? "s" : ""}`,
      privacy:
        "Lecture seule. Les coordonnées des voyageurs ne sont pas affichées ici.",
      pendingPayment: "Paiement en cours",
    },
    payments: {
      title: "Paiements",
      disabled:
        "Le paiement en ligne n'est pas activé (pas de clé Stripe) : les voyageurs paient au parking.",
      colOperator: "Loueur",
      colStripe: "Stripe",
      colSchedule: "Reversement",
      colPending: "En attente",
      colFailed: "En échec",
      stripeActive: "Virements actifs",
      stripeIncomplete: "Inscription à finir",
      stripeNone: "Non connecté",
      pending: (n: number, amount: string) => (n ? `${n} · ${amount}` : "—"),
      none: "—",
      retry: "Relancer",
      retried: {
        transferred: "Reversement effectué.",
        failed: "Stripe refuse encore ce virement.",
        skipped: "Virement reporté : il sera retenté par la tâche quotidienne.",
      },
      failedRow: (reference: string, amount: string) =>
        `${reference} · ${amount}`,
      readOnly:
        "Lecture seule. Un reversement refusé par Stripe peut être relancé.",
    },
    payoutSchedule: {
      AFTER_STAY: "Le lendemain du séjour",
      AT_DROP_OFF: "Le lendemain du dépôt",
      WEEKLY: "Chaque lundi",
      MONTHLY: "Le 1er du mois",
    } satisfies Record<PayoutSchedule, string>,
  },
  notFound: {
    title: "Page introuvable",
    back: "Retour au tableau de bord",
  },
};

export function errorMessage(code: string | undefined): string {
  if (!code) return fr.errors.unknown;
  return fr.errors[code] ?? fr.errors.unknown;
}

/** French message for any error thrown by the API client. */
export function describeError(error: unknown): string {
  // A gateway answer (the function cut short, the API down) carries no code of ours.
  if (
    error instanceof ApiError &&
    !error.code &&
    error.status >= 502 &&
    error.status <= 504
  )
    return fr.errors.gateway;
  if (error instanceof ApiError) return errorMessage(error.code);
  if (error instanceof TypeError) return fr.errors.network;
  return fr.errors.unknown;
}

export const dateTime = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export const flightCheckFr = {
  title: "Tester le suivi de vol",
  intro:
    "Interroge le fournisseur de suivi de vols pour un vol et une date, et montre sa réponse telle quelle.",
  flight: "Numéro de vol",
  date: "Date (locale)",
  role: "Côté",
  arrival: "Atterrissage à l'aéroport (vol retour)",
  departure: "Décollage de l'aéroport (vol aller)",
  run: "Interroger",
  running: "Interrogation…",
  provider: (provider: string, host: string | null) =>
    `Fournisseur : ${provider}${host ? ` · ${host}` : ""}`,
  outcome: {
    not_configured:
      "Aucun fournisseur configuré : ajoutez AERODATABOX_API_KEY (ou AIRLABS_API_KEY) sur Vercel.",
    found: "Vol trouvé.",
    not_found:
      "Le fournisseur ne connaît pas ce vol à cette date (vérifiez le numéro et la date).",
    error: "Le fournisseur a refusé la demande.",
  } as Record<string, string>,
  errorHint: (error: string) =>
    /403/.test(error)
      ? `${error} — clé refusée ou endpoint hors forfait : sur RapidAPI, vérifiez l'abonnement au plan Basic d'AeroDataBox et la clé X-RapidAPI-Key.`
      : /401/.test(error)
        ? `${error} — clé invalide.`
        : /429/.test(error)
          ? `${error} — quota du forfait épuisé.`
          : error,
  fields: {
    status: "Statut",
    scheduled: "Prévu",
    estimated: "Révisé",
    actual: "Réel",
    airport: "Aéroport",
    terminal: "Terminal",
    gate: "Porte",
  },
};

export const shuttleWavesFr = {
  title: "Navettes",
  wavesTitle: "Ligne du jour",
  subtitle:
    "Ligne du jour : quand chaque navette doit partir, avec combien de passagers.",
  today: "Aujourd'hui",
  tomorrow: "Demain",
  dayAfter: (day: string) => day,
  refreshed: (ago: string) => `Actualisé ${ago}`,
  loadError: "Impossible de charger la prévision des navettes.",
  empty: "Aucune navette à prévoir ce jour-là.",
  emptyUpcoming: "Plus aucune navette à prévoir aujourd'hui.",
  pastCount: (n: number) =>
    n > 1 ? `${n} créneaux passés` : "1 créneau passé",
  pastShow: "Afficher",
  pastHide: "Masquer",
  seats: (seats: number | null, vehicles: number) =>
    seats === null
      ? `${vehicles} véhicule${vehicles > 1 ? "s" : ""} en service · places inconnues`
      : `${vehicles} véhicule${vehicles > 1 ? "s" : ""} en service · ${seats} places`,
  times: (lead: number, delay: number, travel: number) =>
    `Au terminal ${lead} min avant le décollage · rendez-vous ${delay} min après l'atterrissage · trajet ${travel} min`,
  settings: "Modifier les délais",
  wave: {
    count: (n: number) => `${n} vague${n > 1 ? "s" : ""}`,
    countUpcoming: (n: number) => `${n} à venir`,
    direction: {
      dropoff: "Vers le terminal",
      pickup: "Depuis l'aéroport",
    } satisfies Record<ShuttleDirection, string>,
    airport: "Aéroport",
    passengers: (n: number, seats: number | null) =>
      seats === null ? `${n}` : `${n} / ${seats}`,
    vehicles: (n: number) => `${n} navettes`,
    meetAt: (time: string) => `rendez-vous ${time}`,
    noFlight: (n: number) => (n === 1 ? "1 sans vol" : `${n} sans vol`),
    state: {
      planned: "À venir",
      running: "En cours",
      done: "Faite",
    } satisfies Record<WaveState, string>,
    pax: (n: number) => `${n} pass.`,
    flight: {
      scheduled: "à l'heure",
      delayed: (minutes: number) => `retardé +${minutes}`,
      departed: "parti",
      landed: "atterri",
      cancelled: "annulé",
      diverted: "dérouté",
      unknown: "vol inconnu",
      none: "heure saisie",
    },
    takeOff: (time: string) => `décollage ${time}`,
    landing: (time: string) => `atterrissage ${time}`,
    bookingTime: (time: string) => `heure saisie ${time}`,
  },
};

/** The driver's part of the Navettes page (06/10/2026): the same trips as the Plazo Pro app. */
export const shuttleTripsFr = {
  card: "Fiche du client",
  live: {
    title: "Navettes en cours",
    none: "Aucune navette en route pour le moment.",
    passengers: (n: number) => `${n} client${n > 1 ? "s" : ""}`,
    since: (time: string) => `partie à ${time}`,
    noPosition: "position en attente",
    toStop: (name: string, min: number) => `${name} dans ${min} min`,
    toParking: (min: number) => `parking dans ${min} min`,
    end: "Terminer ce trajet",
    endConfirm: (driver: string) =>
      `Terminer le trajet de ${driver} ? Sa position ne sera plus partagée.`,
  },
  running: {
    pickup: "En route vers l'aéroport · position partagée",
    dropoff: "En route vers le terminal · position partagée",
    // R-B: the parking turned the tracking off.
    pickupNoShare: "En route vers l'aéroport · suivi désactivé",
    dropoffNoShare: "En route vers le terminal · suivi désactivé",
    stop: (name: string) => `Desserte : ${name}`,
    vehicle: (v: string) => `Véhicule : ${v}`,
    passengers: (n: number) =>
      `${n} client${n > 1 ? "s" : ""} suivent votre trajet`,
    left: (m: number) => `arrêt automatique dans ${m} min`,
    endPickup: "Clients récupérés · retour parking",
    endDropoff: "Clients déposés · retour parking",
    ended:
      "Trajet terminé : votre position n'est plus partagée et a été effacée.",
    locationDenied:
      "Sans accès à la position, les clients ne verront pas la navette avancer. Autorisez la position dans le navigateur.",
    sharing: "Position partagée",
    noGeolocation:
      "Ce navigateur ne donne pas la position : le trajet est visible sans sa position.",
  },
  start: {
    title: "Démarrer un trajet",
    introPickup:
      "Vos clients de retour, à récupérer à l'aéroport. Démarrez le trajet : ils suivent votre position.",
    introDropoff:
      "Vos clients arrivés au parking, à conduire au terminal. Démarrez le trajet : ils suivent votre position.",
    direction: {
      pickup: "Retours · aéroport",
      dropoff: "Départs · terminal",
    } satisfies Record<ShuttleDirection, string>,
    stop: "Desserte",
    airport: "Aéroport",
    meetingPoint: (label: string) => `Point de rendez-vous : ${label}`,
    meetingPointNone:
      "Point de rendez-vous : l'aéroport (à définir dans Parking › Réglages).",
    toPickUp: (terminal: string) => `À récupérer · ${terminal}`,
    noTerminal: "Terminal",
    toDropOff: "À conduire au terminal",
    emptyPickup: "Aucun retour à récupérer pour le moment.",
    emptyDropoff: "Aucun client arrivé n'attend la navette.",
    pax: (n: number) => `${n} pass.`,
    flight: (n: string) => `vol ${n}`,
    gate: (g: string) => `Porte ${g}`,
    arrivedAt: (t: string) => `Arrivé ${t}`,
    arrivalPlanned: (t: string) => `Arrivée prévue ${t}`,
    /** F-A (06/10/2026): the driver's tour in three bands. */
    tourTitle: "Ma tournée",
    bandTake: (n: number) => `À emmener · ${n}`,
    bandFetch: (n: number) => `À récupérer · ${n}`,
    bandRoute: (n: number) => `En route · ${n}`,
    bandStay: (n: number) => `En séjour · ${n}`,
    bandBack: (n: number) => `Rendus · ${n}`,
    bandTakeName: "À emmener",
    bandFetchName: "À récupérer",
    leaveAt: (time: string) => `Départ conseillé ${time}`,
    toDropOffStop: (stop: string) => `À conduire · ${stop}`,
    expectedAt: (t: string) => `Attendu ${t}`,
    routeNone: (band: string) =>
      `Aucun trajet en cours. Cochez des voyageurs dans « ${band} » puis partez.`,
    routePassengers: "Passagers du trajet",
    stayNone:
      "Personne en séjour : les voyageurs déposés au terminal apparaîtront ici jusqu'à leur retour.",
    stayDay: (day: string, n: number) =>
      `${day} · ${n} retour${n > 1 ? "s" : ""}`,
    backToday: "Revenus aujourd'hui",
    backNone: "Personne n'est encore revenu aujourd'hui.",
    selectedSummary: (travellers: number, passengers: number) =>
      `${travellers} voyageur${travellers > 1 ? "s" : ""} · ${passengers} pass. coché${travellers > 1 ? "s" : ""}`,
    spot: (code: string) => `Place ${code}`,
    badge: {
      onTrip: "Sur un trajet",
      atPoint: (t: string) => `Au point de RDV ${t}`,
      noticeFlightDelayed: "Vol en retard (client)",
      noticeLuggage: "Bagage perdu",
      noticeOther: (text: string | null) =>
        text ? `« ${text} »` : "Mot du client",
      landed: (t: string) => `Atterri ${t} · en chemin`,
      cancelled: "Vol annulé",
      returnAt: (t: string) => `Retour prévu ${t}`,
      delayed: (t: string) => `Retardé · ${t}`,
      planned: (t: string) => `Vol prévu ${t}`,
    },
    vehicle: "Véhicule",
    vehicleFree: "Autre véhicule",
    vehicleSeats: (n: number) => `${n} places`,
    vehicleOut: "hors service",
    vehicleModel: "Modèle",
    vehicleColour: "Couleur",
    vehiclePlate: "Plaque",
    vehicleHelp: "Vos clients verront ce véhicule et votre prénom.",
    tooMany: (p: number, seats: number) =>
      `${p} passagers pour ${seats} places : choisissez un autre véhicule ou moins de clients.`,
    none: "Sélectionnez des clients",
    pickup: (n: number) =>
      n === 1
        ? "Partir à l'aéroport · 1 client"
        : `Partir à l'aéroport · ${n} clients`,
    dropoff: (n: number) =>
      n === 1
        ? "Partir au terminal · 1 client"
        : `Partir au terminal · ${n} clients`,
    starting: "Démarrage…",
    needsStatus:
      "Seuls les chauffeurs, voituriers, agents et gérants peuvent démarrer un trajet.",
    loadError: "Impossible de charger les clients à transporter.",
  },
};

/** The operational card (C-A, 06/10/2026): the same short sheet from Planning, Navettes and Occupation, with the next gesture. */
export const quickCardFr = {
  title: "Fiche",
  close: "Fermer",
  open: "Ouvrir la fiche complète",
  call: "Appeler",
  sms: "SMS",
  loadError: "Impossible de charger la réservation.",
  arrival: "Dépôt",
  return: "Retour",
  flight: "Vol retour",
  departureFlight: "Vol aller",
  noFlight: "sans vol",
  flightState: {
    landed: (t: string) => `atterri ${t}`,
    delayed: (t: string) => `retardé · ${t}`,
    cancelled: "annulé",
    diverted: "dérouté",
    scheduled: (t: string) => `prévu ${t}`,
    unknown: "vol inconnu",
  },
  terminal: (t: string) => `Terminal ${t}`,
  gate: (g: string) => `porte ${g}`,
  spot: "Place",
  noSpot: "pas de place",
  keys: "Clés",
  noKeys: "crochet non noté",
  car: "Voiture",
  carDirections: "itinéraire",
  stop: "Desserte",
  passengers: (n: number) => `${n} pass.`,
  notes: "Notes",
  customerNote: "Message du client",
  vehicle: "Véhicule",
  returnNotice: "Signalé au retour",
  next: {
    title: "Prochaine étape",
    place: "Placer la voiture",
    placeHelp:
      "Sur le plan, avec le crochet des clés : le client passe « Sur place ».",
    dropOff: "Déposer au terminal",
    dropOffHelp: "Ouvre la navette, côté départs, avec ce client sélectionné.",
    pickUp: "Récupérer à l'aéroport",
    pickUpHelp: "Ouvre la navette, côté retours, avec ce client sélectionné.",
    handOver: "Rendre le véhicule",
    handOverHelp: "Clés rendues, état du véhicule, remarque éventuelle.",
    closed: "Réservation close.",
    more: "Autres actions…",
    confirmCancel: "Annuler cette réservation ? Le client ne sera pas attendu.",
    confirmNoShow: "Marquer le client comme non venu ?",
  },
  handover: {
    title: "Rendre le véhicule",
    keys: "Clés rendues au client",
    keysHelp: "Le crochet est libéré.",
    keysRequired: "Confirmez que les clés sont rendues.",
    note: "Remarque (dégât, litige, objet oublié…)",
    noteHint: "Facultatif · gardée dans les notes, datée et signée",
    confirm: "Véhicule rendu",
    back: "Retour",
  },
};

/** M-A (06/10/2026): the mailbox synchronisation by an inbound address. */
export const inboundFr = {
  title: "Mails entrants",
  intro:
    "Vos réservations Allopark arrivent toutes seules dans le planning : votre messagerie transfère les mails de confirmation à votre adresse Plazo. Les mails incomplets ou inconnus attendent dans « À vérifier ».",
  // G-B (07/10/2026): the step-by-step wizard replaces the "Comment faire" list.
  connect: "Relier ma boîte mail",
  reviewSteps: "Revoir les étapes",
  unavailable:
    "La réception des mails n'est pas encore configurée sur la plateforme (domaine de réception et secret Brevo).",
  addressLabel: "Votre adresse Plazo",
  regenerate: "Nouvelle adresse",
  regenerateConfirm:
    "Remplacer l'adresse ? L'ancienne ne recevra plus rien : pensez à mettre à jour la règle de transfert.",
  copy: "Copier",
  copied: "Adresse copiée",
  lastReceived: (ago: string) => `Dernier mail reçu ${ago}`,
  neverReceived: "Aucun mail reçu pour l'instant",
  counts30: "Sur 30 jours",
  status: {
    imported: "Enregistrées",
    duplicate: "Déjà connues",
    incomplete: "Incomplets",
    unrecognised: "Non reconnus",
    dismissed: "Classés",
    forwarding: "Confirmation de transfert",
  } satisfies Record<InboundEmailStatus, string>,
  toCheck: (n: number) =>
    n === 0
      ? "Rien à vérifier"
      : n === 1
        ? "1 mail à vérifier"
        : `${n} mails à vérifier`,
  openList: "Voir les mails",
  list: {
    title: "Mails à vérifier",
    subtitle:
      "Les mails transférés que Plazo n'a pas pu enregistrer seul, puis ceux des 30 derniers jours.",
    empty: "Aucun mail à vérifier.",
    loadError: "Impossible de charger les mails.",
    from: (name: string | null, address: string | null) =>
      [name, address].filter(Boolean).join(" · ") || "expéditeur inconnu",
    received: (at: string) => `reçu le ${at}`,
    provider: (p: string) => `Reconnu : ${p}`,
    missing: (fields: string) => `Manque : ${fields}`,
    field: {
      arrivalAt: "date d'arrivée",
      returnAt: "date de retour",
      customerName: "nom du client",
      customerPhone: "téléphone",
      plate: "plaque",
    } as Record<string, string>,
    complete: "Compléter et enregistrer",
    typeIt: "Saisir la réservation",
    openBooking: (ref: string) => `Ouvrir ${ref}`,
    showText: "Voir le mail",
    hideText: "Masquer le mail",
    textGone: "Texte effacé (30 jours).",
    dismiss: "Classer sans suite",
    dismissed: "Mail classé.",
    attached: "Mail rattaché à la réservation.",
    back: "Réservations",
  },
};

/** One line of a step: plain text with **bold** words, and an optional field to copy under it. */
export interface WizardLine {
  text: string;
  copy?: "sender" | "address";
}

/** A row of the simplified screen preview (G-B): a labelled field, a checkbox or the screen's button. */
export interface PreviewRow {
  kind: "field" | "check" | "button";
  label: string;
  /** Shown in the field: the sender, the Plazo address, or a fixed text. */
  value?: "sender" | "address" | string;
  highlight?: boolean;
  checked?: boolean;
}

export type MailProvider = "gmail" | "outlook" | "ovh" | "other";

/** G-B (07/10/2026): « Relier votre boîte mail », the four-step wizard of the inbound mail block. */
export const inboundWizardFr = {
  title: "Relier votre boîte mail",
  close: "Fermer",
  progress: "Progression",
  steps: ["Adresse", "Messagerie", "Transfert", "Vérification"],
  stepMail: (provider: string) => `Messagerie · ${provider}`,
  back: "Retour",
  next: "Continuer",
  finish: "Terminer",
  copy: "Copier",
  copied: "Copié",
  address: {
    title: "Votre adresse Plazo",
    intro:
      "Plazo reçoit les mails de réservation à cette adresse. Seuls les mails que votre messagerie y transfère arrivent dans Plazo : vos autres mails restent privés.",
    enable: "Activer mon adresse",
  },
  mail: {
    title: "Sur quelle messagerie recevez-vous les mails d'Allopark ?",
    legend: "Messagerie",
    providers: {
      gmail: { label: "Gmail", hint: "Gmail ou Google Workspace" },
      outlook: { label: "Outlook", hint: "Outlook.com ou Microsoft 365" },
      ovh: { label: "OVH", hint: "Webmail OVH (Roundcube)" },
      other: { label: "Autre messagerie", hint: "Orange, Free, Ionos…" },
    } satisfies Record<MailProvider, { label: string; hint: string }>,
    noAuth:
      "Pas d'autorisation à donner à cette messagerie : la règle de l'étape suivante suffit.",
    gmail: {
      title: "Autorisez Gmail à transférer vers Plazo",
      lines: [
        {
          text: "Dans Gmail, ouvrez la roue dentée › **Voir tous les paramètres** › onglet **Transfert et POP/IMAP**.",
        },
        {
          text: "Cliquez **Ajouter une adresse de transfert**, collez votre adresse Plazo, puis **Suivant** › **Continuer** :",
          copy: "address",
        },
        {
          text: "Gmail envoie un code de confirmation à Plazo : il s'affiche ci-dessous. Collez-le dans Gmail et cliquez **Valider**.",
        },
      ] satisfies WizardLine[],
      waiting: "En attente du code de Gmail…",
      received: (time: string) => `Code de confirmation Gmail reçu à ${time}`,
      requester: (email: string) => `Demandé par ${email}`,
      copyCode: "Copier le code",
      keepOff:
        "Laissez « Désactiver le transfert » coché : seul le filtre de l'étape suivante transfère, et uniquement les mails d'Allopark.",
    },
  },
  forward: {
    gmail: {
      title: "Créez le filtre dans Gmail",
      lines: [
        {
          text: "Dans la barre de recherche de Gmail, cliquez l'icône des options de recherche, à droite.",
        },
        {
          text: "Dans **De**, collez l'expéditeur d'Allopark :",
          copy: "sender",
        },
        {
          text: "Cliquez **Créer un filtre**, cochez **Transférer à** et choisissez votre adresse Plazo :",
          copy: "address",
        },
        { text: "Validez avec **Créer un filtre**." },
      ] satisfies WizardLine[],
      note: "L'adresse n'apparaît pas dans « Transférer à » ? Gmail doit d'abord la valider : revenez à l'étape 2, le code de confirmation y est affiché.",
      done: "J'ai créé le filtre",
      screen: "Gmail",
      preview: [
        { kind: "field", label: "De", value: "sender", highlight: true },
        { kind: "field", label: "À" },
        { kind: "field", label: "Objet" },
        { kind: "field", label: "Contient les mots" },
        { kind: "check", label: "Ignorer la boîte de réception" },
        { kind: "check", label: "Marquer comme lu" },
        {
          kind: "check",
          label: "Transférer à",
          value: "address",
          highlight: true,
          checked: true,
        },
        { kind: "check", label: "Supprimer" },
        { kind: "button", label: "Créer un filtre" },
      ] satisfies PreviewRow[],
    },
    outlook: {
      title: "Créez la règle dans Outlook",
      lines: [
        {
          text: "Dans Outlook sur le web, ouvrez la roue dentée › **Courrier** › **Règles** › **Ajouter une nouvelle règle**.",
        },
        {
          text: "Nommez-la « Plazo ». Condition : **De**, puis collez l'expéditeur d'Allopark :",
          copy: "sender",
        },
        {
          text: "Action : **Transférer à**, puis collez votre adresse Plazo :",
          copy: "address",
        },
        { text: "Cliquez **Enregistrer**." },
      ] satisfies WizardLine[],
      note: "Messagerie d'entreprise (Microsoft 365) : le transfert vers une adresse extérieure peut être bloqué. Si rien n'arrive à l'étape 4, demandez à la personne qui gère la messagerie de l'autoriser.",
      done: "J'ai créé la règle",
      screen: "Outlook",
      preview: [
        { kind: "field", label: "Nom", value: "Plazo" },
        {
          kind: "field",
          label: "Condition · De",
          value: "sender",
          highlight: true,
        },
        {
          kind: "field",
          label: "Action · Transférer à",
          value: "address",
          highlight: true,
        },
        { kind: "check", label: "Arrêter le traitement d'autres règles" },
        { kind: "button", label: "Enregistrer" },
      ] satisfies PreviewRow[],
    },
    ovh: {
      title: "Créez le filtre dans le webmail OVH",
      lines: [
        {
          text: "Dans le webmail, ouvrez **Paramètres** › **Filtres**, puis **Créer** (+).",
        },
        {
          text: "Nom du filtre : « Plazo ». Règle : **De** contient, puis collez l'expéditeur d'Allopark :",
          copy: "sender",
        },
        {
          text: "Action : **Envoyer une copie du message à**, puis collez votre adresse Plazo :",
          copy: "address",
        },
        { text: "Cliquez **Enregistrer**." },
      ] satisfies WizardLine[],
      note: "Choisissez bien « Envoyer une copie » : avec « Rediriger », le mail quitterait votre boîte.",
      done: "J'ai créé le filtre",
      screen: "webmail OVH",
      preview: [
        { kind: "field", label: "Nom du filtre", value: "Plazo" },
        {
          kind: "field",
          label: "De · contient",
          value: "sender",
          highlight: true,
        },
        {
          kind: "field",
          label: "Envoyer une copie du message à",
          value: "address",
          highlight: true,
        },
        { kind: "button", label: "Enregistrer" },
      ] satisfies PreviewRow[],
    },
    other: {
      title: "Créez la règle de transfert",
      lines: [
        {
          text: "Dans les réglages de votre messagerie, cherchez **Règles**, **Filtres** ou **Redirection**.",
        },
        { text: "Condition : l'expéditeur est", copy: "sender" },
        {
          text: "Action : transférer une copie à votre adresse Plazo :",
          copy: "address",
        },
        { text: "Enregistrez, en gardant le mail dans votre boîte." },
      ] satisfies WizardLine[],
      note: "Vous ne trouvez pas ? Envoyez ces étapes à la personne qui gère votre messagerie, avec le lien en bas de cette fenêtre.",
      done: "J'ai créé la règle",
      screen: "votre messagerie",
      preview: [
        {
          kind: "field",
          label: "Si l'expéditeur est",
          value: "sender",
          highlight: true,
        },
        {
          kind: "field",
          label: "Transférer une copie à",
          value: "address",
          highlight: true,
        },
        { kind: "check", label: "Garder le mail dans la boîte", checked: true },
        { kind: "button", label: "Enregistrer" },
      ] satisfies PreviewRow[],
    },
  } satisfies Record<
    MailProvider,
    {
      title: string;
      lines: WizardLine[];
      note: string;
      done: string;
      screen: string;
      preview: PreviewRow[];
    }
  >,
  preview: (screen: string) => `Aperçu simplifié de l'écran ${screen}`,
  check: {
    title: "Vérifiez que tout arrive",
    lines: [
      {
        text: "Dans votre messagerie, ouvrez un ancien mail de réservation Allopark et transférez-le à votre adresse Plazo :",
        copy: "address",
      },
      { text: "Il apparaît ci-dessous en quelques secondes." },
    ] satisfies WizardLine[],
    received: "Ce que Plazo a reçu",
    live: "En direct",
    waiting: "En attente du premier mail…",
    waitingHint:
      "Il apparaît ici quelques secondes après son arrivée dans votre boîte.",
    ok: "C'est relié. Les prochaines réservations Allopark arriveront toutes seules dans le planning.",
    toCheck:
      "Bien reçu. Plazo n'a pas pu le lire en entier : il attend dans « À vérifier », où vous pouvez le compléter.",
    openToCheck: "Voir les mails à vérifier",
    status: {
      imported: "Enregistrée",
      duplicate: "Déjà connue",
      incomplete: "Incomplet",
      unrecognised: "Non reconnu",
      dismissed: "Classé",
      forwarding: "Code Gmail",
    } satisfies Record<InboundEmailStatus, string>,
  },
  share: {
    link: "Envoyer ces étapes à la personne qui gère notre messagerie",
    subject: "Relier notre boîte mail à Plazo",
    intro:
      "Bonjour,\n\nPour que nos réservations Allopark arrivent toutes seules dans Plazo, pourrais-tu créer une règle de transfert dans notre messagerie ?",
    sender: (address: string) => `Expéditeur : ${address}`,
    address: (address: string) => `Transférer une copie à : ${address}`,
    gmailCode:
      "Gmail envoie alors un code de confirmation à Plazo : je te le transmets dès qu'il s'affiche.",
    outro:
      "Seuls ces mails sont transférés ; nos autres mails restent privés. Merci !",
  },
};

/** « SMS de la veille » (S-A + S-B, 06/10/2026). */
export const remindersFr = {
  title: "SMS de la veille",
  subtitle:
    "Chaque soir, un SMS part à chaque client qui dépose sa voiture le lendemain.",
  back: "Retour aux réservations",
  loadError: "Impossible de charger les SMS de la veille.",
  link: "SMS de la veille",
  test: {
    open: "M’envoyer un test",
    label: "Numéro qui reçoit le test",
    placeholder: "06 12 34 56 78 (le vôtre si vide)",
    send: "Envoyer le test",
    sent: (to: string) => `Test envoyé au ${to}.`,
    queued: (to: string) => `Test confié au téléphone d’envoi pour le ${to}.`,
    required: "Indiquez le numéro qui doit recevoir le test.",
  },
  settings: {
    enabled: "Envoi automatique",
    on: "Activé",
    off: "Désactivé",
    usualTime: "Heure habituelle, la veille",
    from: "Envoyé depuis",
    channel: {
      gateway: "Mon téléphone",
      brevo: `${PRODUCT.name} (Brevo)`,
      none: "Aucun canal SMS",
    },
    channelNote: {
      gateway: "Les réponses des clients arrivent sur ce téléphone.",
      brevo: "Les clients ne peuvent pas répondre à ce SMS.",
      none: "Seuls le mail et la notification de l’app partent.",
    },
    chooseChannel: "Choisir un canal",
    ok: "OK",
    saved: "Réglage enregistré.",
  },
  week: {
    title: "Les envois de la semaine",
    tonight: (day: string) => `Ce soir · ${day}`,
    sent: (n: number) => `${n} envoyé${n > 1 ? "s" : ""}`,
    planned: (n: number) => `${n} SMS prévu${n > 1 ? "s" : ""}`,
    failed: (n: number) => `${n} échec${n > 1 ? "s" : ""}`,
    in: (minutes: number) =>
      minutes < 60
        ? `dans ${minutes} min`
        : `dans ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`,
    timeChanged: "heure changée",
    paused: "En pause",
  },
  evening: {
    title: (
      when: "past" | "tonight" | "future",
      day: string,
      count: number,
      departuresDay: string,
    ) =>
      `${when === "tonight" ? `Ce soir, ${day}` : day} · pour ${count === 0 ? "aucun départ" : `${count === 1 ? "le départ" : `les ${count} départs`}`} de ${departuresDay}`,
    planned: (n: number, time: string) =>
      `${n} SMS prévu${n > 1 ? "s" : ""} à ${time}`,
    sent: (n: number) => `${n} envoyé${n > 1 ? "s" : ""}`,
    waiting: (n: number) => `${n} en attente du téléphone`,
    failed: (n: number) => `${n} échec${n > 1 ? "s" : ""}`,
    withoutSms: (n: number) => `${n} sans SMS`,
    time: "Heure de cet envoi",
    pause: "Mettre en pause",
    resume: "Reprendre",
    sendNow: "Envoyer maintenant",
    sentNow: (n: number) =>
      n === 0 ? "Aucun SMS à envoyer." : `${n} SMS envoyé${n > 1 ? "s" : ""}.`,
    empty: "Aucun départ ce jour-là.",
    late: "Une réservation pour le lendemain enregistrée après l’heure d’envoi reçoit son SMS tout de suite, sauf entre 22:00 et 7:00 : il part alors à 7:00.",
    columns: {
      arrival: "Dépôt",
      customer: "Client",
      phone: "Mobile",
      channel: "Canal",
      sms: "SMS",
      action: "Action",
    },
    exclude: "Ne pas envoyer",
    include: "Rétablir",
    fixPhone: "Corriger le numéro",
  },
  status: {
    planned: (time: string) => `Prévu ${time}`,
    sent: (time: string) => `Envoyé ${time}`,
    waiting: "En attente du téléphone",
    failed: "Échec",
    excluded: (by: string | null) => (by ? `Exclu par ${by}` : "Exclu"),
    disabled: "Envoi coupé",
    no_mobile: "Pas de mobile",
    foreign: "Numéro hors France",
    no_channel: "Pas de canal SMS",
    not_sent: "Non envoyé",
    paused: "Soirée en pause",
    same_day: "Réservé le jour même",
    too_late: "Trop tard",
  },
  message: {
    title: "Le message",
    label: "Texte du SMS",
    updated: (by: string | null, when: string) =>
      `Modifié${by ? ` par ${by}` : ""}, le ${when}`,
    plazoText: `Texte de ${PRODUCT.name}, tant que vous n’écrivez pas le vôtre.`,
    insert: "Insérer",
    variableHint: {
      prénom: "Prénom du client",
      nom: "Nom du client",
      date: "Date du dépôt, 07/10/2026",
      heure: "Heure du dépôt, 08:30",
      plaque: "Plaque",
      référence: "Référence de la réservation",
      lien: "Lien vers la réservation (photo, retour, infos)",
    },
    count: (segments: number) => `${segments} SMS`,
    perClient: (characters: number) =>
      `par client · ${characters.toLocaleString("fr-FR")} caractères`,
    unicode: (chars: string) =>
      `Ces signes font passer le message en Unicode : ${chars}. Il tient alors en 67 caractères par SMS au lieu de 153.`,
    long: `Un long message arrive parfois en plusieurs morceaux, et chaque SMS compte s’il part par ${PRODUCT.name} (Brevo).`,
    noPhoto:
      "Une photo ne peut pas partir par SMS : mettez-la sur votre fiche, le lien y mène.",
    toGsm7: (segments: number) =>
      `Retirer les émojis et signes · ${segments} SMS`,
    short: (segments: number) => `Version courte avec lien · ${segments} SMS`,
    unknown: (tokens: string) =>
      `Variable inconnue : ${tokens}. Utilisez celles proposées.`,
    noLink: "Votre parking n’est pas encore sur le site : {lien} restera vide.",
    save: "Enregistrer le message",
    saved: "Message enregistré.",
    discard: "Annuler les modifications",
    reset: `Revenir au texte de ${PRODUCT.name}`,
    readOnly: "Seul un gérant peut modifier le message.",
  },
  preview: {
    title: "Aperçu",
    for: (name: string, date: string, time: string) =>
      `Tel que le recevra ${name}, dépôt le ${date} à ${time}`,
    sentAt: (day: string, time: string) => `${day} · ${time}`,
    also: "Le mail de rappel et la notification de l’app partent en même temps.",
  },
};

/** R-B (07/10/2026): who sees the position of the shuttles. */
export const shuttleTrackingFr = {
  title: "Suivi des navettes",
  intro: "Qui voit la position de vos navettes pendant les trajets ?",
  legend: "Niveau de suivi",
  recommended: "Recommandé",
  levels: {
    off: {
      title: "Pas de suivi",
      text: "Les chauffeurs ne partagent pas leur position.",
    },
    team: {
      title: "Équipe seulement",
      text: "La position sert à organiser les navettes. Vos clients ne la voient pas.",
    },
    everyone: {
      title: "Équipe et clients",
      text: "Vos clients suivent leur navette et reçoivent « Votre navette est là ». Votre parking porte la mention « En direct » dans les résultats.",
    },
  },
  who: { team: "Équipe", clients: "Clients", mention: "Mention" },
  yes: "oui",
  no: "non",
  always:
    "Dans tous les cas, « Votre navette est partie » est envoyé au départ de chaque trajet.",
  save: "Enregistrer",
  saved: "Suivi des navettes enregistré.",
};
