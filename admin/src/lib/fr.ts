import type {
  CancellationPolicy,
  ListingService,
  ListingStatus,
  PayoutSchedule,
  PaidBy,
  ReservationChannel,
  PlatformAudience,
  ProspectStatus,
  ReservationStatus,
  ShuttleStopKind,
  SmsMode,
  StaffRole,
  AlertKind,
  JoinRole,
  SignInMethod,
  InboundChangeReason,
  ComparatorArrival,
  InboundEmailStatus,
  InboundEmailView,
  MailProviderId,
  InboundPageOutcome,
  InboundReadingKind,
  InboundReadingOutageCause,
  ShuttleDirection,
  WaveState,
} from "./types";
import { ApiError } from "./api";
import { PRODUCT } from "./product";

// All user-facing strings live here so the interface can be translated later.
/** « A », « A et B », « A, B et C ». */
function frenchList(items: string[]): string {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

/** What deleting an operator takes with it, in words: « son parking, sa fiche, ses tarifs, ses 3 réservations et … ». */
function deletionSummary(counts: {
  parkings: number;
  listings?: number;
  reservations: number;
  staff: number;
}): string {
  const listings = counts.listings ?? 0;
  const parts = [
    ...(counts.parkings === 0
      ? []
      : [
          counts.parkings > 1
            ? `ses ${counts.parkings} parkings`
            : "son parking",
        ]),
    ...(listings === 0
      ? []
      : listings > 1
        ? [`ses ${listings} fiches`, "leurs tarifs"]
        : ["sa fiche", "ses tarifs"]),
    ...(counts.reservations === 0
      ? []
      : [
          counts.reservations === 1
            ? "sa réservation"
            : `ses ${counts.reservations} réservations`,
        ]),
    ...(counts.staff === 0
      ? []
      : [
          counts.staff > 1
            ? `les ${counts.staff} comptes de son équipe`
            : "le compte de son gérant",
        ]),
  ];
  if (parts.length < 2) return parts[0] ?? "ses données";
  return `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}`;
}

/**
 * 16/10/2026 (the Anthropic account ran out of credit that morning): why Claude could not read a mail, in the inbox and
 * the dashboard's « Import » service.
 */
export const readingOutageCause: Record<InboundReadingOutageCause, string> = {
  credit: "crédit Anthropic épuisé",
  auth: "clé Anthropic refusée",
  rate_limit: "trop de demandes à Anthropic",
  overloaded: "Anthropic surchargé ou indisponible",
  timeout: "Claude n'a pas répondu à temps",
  network: "Anthropic injoignable",
  other: "erreur d'Anthropic",
};

export const fr = {
  // « Voiturier au terminal » (27/10/2026, direction B): the dashboard's runs.
  valetRuns: {
    title: "Courses au terminal",
    meetingPoint: (point: string) => `Rendez-vous : ${point}`,
    kinds: { arrival: "Arrivée", departure: "Départ" } as Record<"arrival" | "departure", string>,
    todo: "À prendre",
    taken: "Prise",
    done: "Faite",
    todoCount: (n: number) => `${n} à prendre`,
    takenCount: (n: number) => `${n} en cours`,
  },
  common: {
    close: "Fermer",
    confirm: { title: "Confirmer", yes: "Confirmer", no: "Annuler" },
    save: "Enregistrer",
    saved: "Modifications enregistrées",
    never: "Jamais",
    loading: "Chargement…",
    /** 15/10/2026: in the plate of a booking imported without one (read on arrival). */
    plateMissing: "À saisir",
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
    // T-A (08/10/2026): the two refusals of the inbox.
    archived: "Ce mail est archivé : il ne peut plus être marqué comme traité.",
    forwarding: "Une confirmation de transfert ne s'archive pas.",
    // « Relancer l'analyse » (10/10/2026); `already_imported` is worded for the inbox in `inboundFr.list.errors`.
    text_gone:
      "Le texte de ce mail a été effacé (30 jours) : il ne peut plus être analysé.",
    // Refused within 30 s of the last analysis, whether it is still running or already done.
    analysis_running:
      "Ce mail vient d'être analysé : réessayez dans 30 secondes.",
    trip_not_running: "Ce trajet est terminé.",
    invalid_passengers:
      "Un des clients ne peut pas monter dans cette navette (statut changé ?). Actualisez la liste.",
    already_on_trip: "Un des clients est déjà sur un trajet en cours.",
    invalid_direction: "Sens du trajet invalide.",
    position_too_old: "Position trop ancienne : nouvel essai en cours.",
    too_many_positions: "Patientez quelques secondes.",
    not_found: "Élément introuvable.",
    // The Plazo ↔ operator contract (20/10/2026).
    already_signed: "Ce contrat est déjà signé.",
    not_pending: "Ce contrat n'attend plus de signature.",
    // The prospects' demo (21/10/2026).
    demo_read_only:
      "Pas dans la démo : l'équipe, les mots de passe, les paiements et les envois vers l'extérieur sont simulés.",
    demo_link_expired:
      "Ce lien de démo a expiré. Vous pouvez entrer dans la démo sans lien.",
    demo_link_unknown:
      "Ce lien de démo n'existe pas. Vous pouvez entrer dans la démo sans lien.",
    view_as_cannot_sign:
      "Seul un gérant du parking peut signer son contrat, pas la plateforme en consultation.",
    file_unavailable:
      "Le fichier du contrat est indisponible pour l'instant. Réessayez dans quelques minutes.",
    email_unavailable:
      "Aucun e-mail n'a pu partir : vérifiez l'envoi des e-mails et les gérants du parking.",
    photos_unavailable: "Le stockage des fichiers n'est pas configuré.",
    payload_too_large: "Fichier trop lourd.",
    unauthorized: "Votre session a expiré. Reconnectez-vous.",
    validation_failed: "Certains champs sont à corriger.",
    network: "Le serveur ne répond pas. Vérifiez votre connexion.",
    invalid_datetime: "Date ou heure invalide.",
    return_before_arrival: "Le retour doit être après l'arrivée.",
    stay_too_long: "Séjour de plus de 90 jours.",
    // 16/10/2026 (« relie les mail deja traité »): a mail read again after its stay; Plazo only links it to its booking.
    stay_over: "Séjour déjà terminé, Plazo ne la crée pas de lui-même.",
    passengers_range: "Entre 1 et 9 passagers.",
    // « Sièges auto » (24/10/2026): fewer seats than passengers (one adult at least), 0 to 4 of each kind.
    child_seats_exceed_passengers:
      "Les enfants comptent dans les passagers : il faut moins de sièges que de passagers.",
    child_seats_range: "Entre 0 et 4 sièges de chaque sorte.",
    // « Voiturier au terminal » (27/10/2026).
    invalid_handover: "Choisissez navette ou voiturier au terminal.",
    not_valet: "Cette réservation prend la navette, pas le voiturier.",
    run_taken: "Un autre voiturier a déjà pris cette course.",
    run_closed: "Cette course est déjà faite.",
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
    invalid_amount: "Montant invalide (ex. 45,50).",
    price_locked: `Le prix d'une réservation payée sur ${PRODUCT.name} ne se modifie pas.`,
    unrecognised_email:
      "Ce texte ne ressemble à aucun mail de comparateur connu.",
    already_imported: "Cette réservation a déjà été importée.",
    min_0: "Doit être positif.",
    invalid_slug:
      "Lettres minuscules, chiffres et tirets seulement (ex. parking-demo).",
    slug_taken: "Cette adresse est déjà prise par un autre parking.",
    slug_reserved:
      "Cette adresse est réservée au site Plazo : choisissez-en une autre.",
    unknown_airport: "Aéroport inconnu.",
    invalid_url: "Adresse web invalide (http:// ou https://).",
    invalid_service: "Service inconnu.",
    invalid_policy: "Politique d'annulation inconnue.",
    number: "Nombre attendu.",
    pricing_required:
      "Enregistrez d'abord vos tarifs : une fiche sans prix ne peut pas être envoyée en validation.",
    duplicate_days: "Deux forfaits ont la même durée.",
    // Night fees (12/10/2026).
    same_time: "Le début et la fin de la nuit doivent être différents.",
    fee_required:
      "Indiquez au moins un montant de frais de nuit : dépôt ou retour.",
    // S-C files (07/10/2026).
    file_occupied: "Cette file contient des voitures : videz-la d'abord.",
    file_full: "Cette file est complète.",
    file_not_found: "Cette file n'existe pas (ou plus).",
    no_valet_spots:
      "Le plan n'a pas de files de voiturier : générez des places en peigne ou tracez les files d'un trait.",
    invalid_day: "Jour invalide.",
    invalid_window: "Fenêtre invalide.",
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
    ai_unreliable:
      "La proposition de Claude ne s'appuie pas sur vos données : elle a été écartée. Réessayez.",
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
    view_as_not_driver:
      "En consultation, vous ne conduisez pas la navette : démarrez le trajet depuis le compte d'un chauffeur.",
    view_as_ended: "La consultation de l'espace du loueur est terminée.",
    email_not_verified:
      "Confirmez d'abord votre adresse email (lien reçu par email).",
    listing_required: "Enregistrez d'abord votre fiche.",
    commission_range: "Entre 0 et 50 %.",
    not_suspended:
      "Suspendez d'abord ce loueur pour pouvoir l'archiver ou le supprimer.",
    has_payments:
      "Ce loueur a reçu des paiements en ligne : ils restent dans la comptabilité. Archivez-le plutôt que de le supprimer.",
    payment_in_progress:
      "Un paiement en ligne est en cours chez ce loueur : réessayez dans une demi-heure.",
    cannot_delete_platform:
      "Le compte de la plateforme ne peut pas être supprimé.",
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
    invalid_region: "Région inconnue (ex. Auvergne-Rhône-Alpes).",
    invalid: "Valeur invalide.",
    invalid_coordinate: "Coordonnées invalides.",
    invalid_bbox: "Zone invalide.",
    too_short: "Saisissez au moins 3 caractères.",
    invalid_name: "Lettres, espaces, apostrophes et tirets seulement.",
    // 13/10/2026: joining a parking with the code of the day, Apple / Google sign-in, leaving and deleting an account.
    join_request_closed:
      "Cette demande n'est plus en attente : elle a été annulée, a expiré ou a déjà été traitée.",
    join_code_invalid:
      "Ce code ne marche pas. Vérifiez-le, ou demandez celui d'aujourd'hui à votre gérant.",
    join_request_pending: "Une demande est déjà en attente.",
    already_member: "Ce compte fait déjà partie d'une équipe.",
    not_member: "Ce compte ne fait partie d'aucune équipe.",
    identity_taken: "Cet identifiant est déjà lié à un autre compte.",
    already_linked: "Cet identifiant est déjà lié à votre compte.",
    sign_in_required:
      "C'est votre seule façon de vous connecter : gardez-la, ou définissez d'abord un mot de passe.",
    reauth_failed: "La confirmation a échoué. Réessayez.",
    trip_running: "Un trajet de navette est en cours : terminez-le d'abord.",
    provider_unavailable:
      "Cette connexion n'est pas disponible pour le moment.",
    provider_unreachable:
      "Le service de connexion ne répond pas. Réessayez dans un instant.",
    identity_invalid: "La connexion n'a pas pu être vérifiée. Réessayez.",
    account_disabled: "Ce compte est désactivé. Parlez-en à votre gérant.",
    // Prospection (18/10/2026).
    prospect_exists: "Ce prospect est déjà dans la liste.",
    suppressed:
      "Cette adresse a demandé à ne plus être contactée : elle ne peut pas être ajoutée.",
    prospecting_unavailable:
      "L'envoi n'est pas configuré sur le serveur (Brevo, expéditeur, adresse du site) : rien n'est parti.",
    unsubscribed: "Ce prospect s'est désinscrit : il ne change plus d'état.",
    delay_range: "Entre 1 et 90 jours.",
    delay_order: "Le dernier message doit partir après la relance.",
    cap_range: "Entre 1 et 300 mails par jour.",
    too_many_rows: "2 000 lignes au plus par import.",
    email_failed: "Brevo a refusé le mail. Réessayez dans un instant.",
    no_email: "Votre compte n'a pas d'adresse e-mail.",
  } as Record<string, string>,
  // The prospects' demo (21/10/2026, choice A + B + C).
  demo: {
    badge: "Démo",
    title: "Essayez Plazo Pro sur un parking fictif",
    intro:
      "Parking des Cèdres · 120 places · 3 navettes. Les réservations bougent en direct, rien n'est réel.",
    welcome: (company: string) => `Bonjour ${company} : voici votre démo.`,
    linkExpired:
      "Ce lien a expiré : vous pouvez tout de même entrer dans la démo.",
    linkUnknown:
      "Ce lien n'est pas reconnu : vous pouvez tout de même entrer dans la démo.",
    chooseRole: "Dans quel rôle voulez-vous l'essayer ?",
    roles: {
      manager: {
        label: "Gérant",
        hint: "Tableau de bord, chiffre d'affaires, plan du parking",
      },
      agent: {
        label: "Accueil",
        hint: "Arrivées, mails des comparateurs, réservations",
      },
      driver: {
        label: "Chauffeur",
        hint: "Qui emmener, qui récupérer, la navette en direct",
      },
      valet: { label: "Voiturier", hint: "Où ranger chaque voiture, les clés" },
    },
    enter: "Entrer dans la démo",
    entering: "Ouverture…",
    footnote: "Sans compte · dans le navigateur · remis à zéro chaque nuit",
    banner: "Démo",
    bannerNote: "données fictives · remise à zéro cette nuit",
    quit: "Quitter",
    simulated:
      "Les gestes qui écrivent à l'extérieur (SMS, e-mails, paiements, équipe) sont simulés.",
    tryTitle: "À essayer",
    tryBody: {
      manager:
        "Ouvrez « Chiffre d'affaires » pour voir ce que vous prennent les comparateurs, puis complétez une réservation sans prix.",
      agent:
        "Ouvrez les réservations du jour, puis « Mails » pour voir comment Plazo lit les confirmations des comparateurs.",
      driver:
        "Ouvrez « Navettes » : les clients à emmener et à récupérer s'y ajoutent au fil de la journée.",
      valet:
        "Ouvrez « Parking » puis « Occupation » : rangez une arrivée dans la file proposée.",
    } as Record<string, string>,
    tryLink: {
      manager: {
        to: "/chiffre-affaires",
        label: "Ouvrir le chiffre d'affaires",
      },
      agent: { to: "/reservations", label: "Ouvrir les réservations" },
      driver: { to: "/navettes", label: "Ouvrir les navettes" },
      valet: { to: "/parking/occupation", label: "Ouvrir l'occupation" },
    } as Record<string, { to: string; label: string }>,
    loginLink: "Essayer la démo",
    loginLinkIntro: "Pas encore client ?",
  },
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
    // Choice B of 21/10/2026 (« Un champ à la fois »), as in Plazo Pro.
    tagline: "Le parking, de l'arrivée au retour.",
    emailTitle: "Votre adresse e-mail",
    passwordTitle: "Votre mot de passe",
    next: "Continuer",
    changeEmail: "Changer d'adresse e-mail",
    invalidEmail: "Adresse e-mail invalide.",
    help: "Mot de passe perdu ? Votre gérant peut vous en donner un nouveau.",
    step: (n: number) => `Étape ${n} sur 2`,
    or: "ou",
    googleNotMember:
      "Ce compte Google n'est lié à aucun parking. Connectez-vous avec votre e-mail puis liez Google dans Mon compte, ou rejoignez une équipe avec le code du jour dans l'app Plazo Pro.",
  },
  // « Continuer avec Google » (22/10/2026).
  google: {
    unavailable:
      "La connexion avec Google ne se charge pas. Vérifiez votre connexion ou utilisez votre e-mail.",
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
    // 26/10/2026: a team member installs Plazo Pro once the password is chosen (the web space is the managers').
    nextApp: `Ensuite, vous installerez l'application ${PRODUCT.name} Pro sur votre téléphone.`,
    doneTitle: "Votre mot de passe est enregistré",
    doneIntro: (email: string) =>
      `Installez l'application ${PRODUCT.name} Pro sur votre téléphone et connectez-vous avec ${email} et le mot de passe que vous venez de choisir.`,
    googlePlay: "Disponible sur Google Play",
    appStore: "Télécharger dans l'App Store",
    appStoreSoon:
      "Validation par Apple en cours : le lien vous sera envoyé dès que l'app est publiée.",
    continueWeb: "Continuer sur le web",
  },
  viewAs: {
    banner: (name: string) => `Vous consultez l'espace de ${name}`,
    note: "Vos modifications sont tracées dans le journal à votre nom.",
    back: "Revenir à la plateforme",
    readOnly:
      "En consultation, l'équipe, les mots de passe et les paiements du loueur ne se modifient pas.",
  },
  nav: {
    planning: "Planning",
    shuttles: "Navettes",
    plazo: `Sur ${PRODUCT.name}`,
    reservations: "Réservations",
    revenue: "Chiffre d'affaires",
    dashboard: "Tableau de bord",
    parking: "Parking",
    team: "Équipe",
    account: "Mon compte",
    contract: "Mon contrat",
    contracts: "Contrats",
    logout: "Se déconnecter",
    platform: "Plateforme",
    // Direction A (30/10/2026): four groups, each page of a group under it.
    sections: {
      today: "Aujourd'hui",
      reservations: "Réservations",
      parking: "Parking",
      manager: "Gérant",
    },
    sub: {
      planningDay: "Jour",
      forecast: "Prévisionnel",
      allReservations: "Toutes",
      inbox: "Boîte de réception",
      extras: "Services à faire",
      reminders: "SMS de la veille",
      importFile: "Importer un fichier",
      occupation: "Occupation",
      plan: "Plan",
      spotPlanning: "Planning des places",
      settings: "Réglages",
      listing: "Fiche",
      pricing: "Tarifs",
      signedContracts: "Contrats signés",
      plazoContract: `Mon contrat ${PRODUCT.name}`,
    },
    expand: (label: string) => `Afficher les pages de ${label}`,
    collapse: (label: string) => `Masquer les pages de ${label}`,
    toDo: (n: number) => `${n} à traiter`,
    accountMenu: "Mon compte et déconnexion",
    changePhoto: "Changer ma photo",
  },
  // 30/10/2026 (« pouvoir mettre sa photo »): the card of Mon compte and the cropping.
  photo: {
    title: "Ma photo",
    intro: "Votre équipe la voit dans le menu, la page Équipe et à côté de votre prénom.",
    choose: "Choisir une photo",
    change: "Changer ma photo",
    remove: "Retirer",
    hint: "JPEG, PNG ou WebP. Elle est recadrée en carré.",
    cropTitle: "Cadrer ma photo",
    cropHint: "Glissez pour déplacer la photo, zoomez avec le curseur.",
    zoom: "Zoom",
    save: "Enregistrer",
    cancel: "Annuler",
    saved: "Photo enregistrée.",
    removed: "Photo retirée.",
    unreadable: "Cette image ne s'ouvre pas dans le navigateur. Choisissez un JPEG ou un PNG.",
    errors: {
      too_large: "Photo trop lourde, même recadrée. Choisissez-en une autre.",
      not_an_image: "Ce fichier n'est pas une image.",
      photos_unavailable: "L'enregistrement des photos n'est pas encore activé.",
      view_as_read_only: "En consultation, la photo du membre ne se change pas.",
      demo_read_only: "Démo : la photo ne se change pas.",
    } as Record<string, string>,
  },
  // CA-B + CA-A (09/10/2026): the revenue of the bookings, managers only.
  revenue: {
    title: "Chiffre d'affaires",
    periods: "Période",
    today: "Aujourd'hui",
    week: "7 jours",
    custom: "Dates…",
    from: "Du",
    to: "au",
    apply: "Afficher",
    countBy: "Compter par",
    basis: { arrival: "jour d'arrivée", booked: "jour de réservation" },
    cancelledOut: "annulées exclues",
    total: (period: string) => `Total ${period}`,
    span: (from: string, to: string) =>
      from === to ? `le ${from}` : `du ${from} au ${to}`,
    bookings: "Réservations",
    bookingsSub: (missing: number) =>
      missing === 0 ? "toutes avec un montant" : `dont ${missing} sans montant`,
    average: "Panier moyen",
    averageSub: (days: number | null) =>
      days === null ? "—" : `${days.toLocaleString("fr-FR")} jours en moyenne`,
    byChannel: "Par canal",
    byPaymentMethod: "Par moyen de paiement",
    paidByUnknown: "Non précisé",
    bookingsShort: (n: number) => `${n} rés.`,
    paidByHint: "Choisissez « Payé par » dans le formulaire de chaque réservation. Aussi dans l'export CSV.",
    channel: "Canal",
    count: "Réservations",
    amount: "Chiffre d'affaires",
    share: "Part",
    noRevenue: "Aucune réservation avec un montant sur cette période.",
    missing: (n: number) =>
      n === 1
        ? "1 réservation sans montant n'est pas comptée."
        : `${n} réservations sans montant ne sont pas comptées.`,
    complete: "Les compléter",
    hide: "Masquer",
    missingTitle: "Réservations sans montant",
    missingMore: "Les 50 plus récentes sont listées.",
    amountLabel: (reference: string) => `Montant de ${reference} en euros`,
    save: "Enregistrer",
    saved: "Montant enregistré",
    invalidAmount: "Montant invalide",
    byDay: "Jour par jour",
    dayLabel: (date: string, amount: string, count: number) =>
      `${date} : ${amount}, ${count} réservation${count > 1 ? "s" : ""}`,
    export: "Exporter en CSV",
    exporting: "Export…",
    todayMark: "aujourd'hui",
    // Dashboard tile (CA-A).
    tile: (month: string) => `Chiffre d'affaires · ${month}`,
    tileSub: (today: string, week: string, count: number) =>
      `Aujourd'hui ${today} · 7 jours ${week} · ${count} réservation${count > 1 ? "s" : ""}`,
    tileMissing: (n: number) => `${n} sans montant`,
    // Choice A of 20/10/2026: gross − commissions = net.
    tileGross: "Encaissé par les clients",
    tileCommissions: "Commissions",
    tileShare: (pct: string) => `${pct} du chiffre`,
    tileKept: "Vous gardez",
    tileMissingRate: (name: string) => `${name} : taux à régler`,
    // 27/10/2026: the platform admin can hide the revenue on this browser.
    mask: {
      hide: "Masquer le CA",
      show: "Afficher le CA",
      hideTitle: "Masquer le chiffre d'affaires sur ce navigateur",
      showTitle: "Afficher de nouveau le chiffre d'affaires",
      hidden: "Chiffre d'affaires masqué",
      hiddenNote:
        "Les montants ne sont pas affichés sur ce navigateur. Les autres membres de l'équipe les voient toujours.",
      reveal: "Afficher le chiffre d'affaires",
    },
    // 19/10/2026: what the comparators take (choice « les 3 », A).
    view: "Afficher",
    views: { gross: "Brut", net: "Net de commissions" },
    totalNet: (period: string) => `Vous gardez ${period}`,
    netSub: (paid: string, commission: string) =>
      `payé ${paid} · commissions − ${commission}`,
    grossSub: (commission: string) =>
      `dont ${commission} de commissions des comparateurs`,
    commission: "Commission",
    net: "Net",
    rateLabel: (name: string) => `Taux de commission de ${name} en %`,
    rateHint: (from: string) =>
      `Un taux changé ici vaut pour les réservations faites à partir du ${from}.`,
    rateSaved: (name: string) => `Taux de ${name} enregistré`,
    noRate: "sans taux",
    plazoCommission: "commission Plazo · Reversements",
  },
  commission: {
    // Parking › Réglages › Comparateurs (19/10/2026, B).
    title: "Ce que chaque comparateur vous prend",
    intro:
      "Plazo s'en sert pour calculer ce que vous gardez de chaque réservation. Un changement vaut pour les réservations faites à partir de la date choisie ; les précédentes gardent leur taux.",
    comparator: "Comparateur",
    rate: "Pourcentage",
    fixed: "Par réservation",
    since: "À partir du",
    thisMonth: "Résa. ce mois",
    rateLabel: (name: string) => `Pourcentage de ${name}`,
    fixedLabel: (name: string) =>
      `Frais fixes par réservation de ${name}, en euros`,
    sinceLabel: (name: string) => `Date d'effet du taux de ${name}`,
    save: "Enregistrer",
    saved: (name: string) => `Taux de ${name} enregistré`,
    current: (rate: string, since: string) => `${rate} depuis le ${since}`,
    upcoming: (rate: string, since: string) => `${rate} à partir du ${since}`,
    none: "Aucun taux : ses réservations comptent sans commission.",
    remove: "Retirer",
    removed: "Taux retiré",
    removeTitle: (name: string, since: string) =>
      `Retirer le taux de ${name} du ${since} ?`,
    removeBody: "Les réservations qu'il couvrait reprennent le taux d'avant.",
    footnote:
      "Un comparateur apparaît ici dès sa première réservation. Sans taux, ses réservations comptent sans commission.",
    example: "Exemple",
    exampleLine: (price: string, rate: string, amount: string, net: string) =>
      `Réservation de ${price} − ${rate} = ${amount} : vous gardez ${net}`,
    invalidRate: "Pourcentage invalide (ex. 18 ou 17,5).",
    invalidFixed: "Montant invalide (ex. 1,50).",
    // The booking's sheet (C).
    line: (name: string) => `Commission ${name}`,
    keep: "Vous gardez",
    fromRate: (name: string, since: string) =>
      `Taux de ${name} du ${since}, réglé dans Parking › Réglages.`,
    noneSet: (name: string) =>
      `Aucun taux réglé pour ${name} : rien n'est retenu.`,
    override: "Fixée pour cette réservation.",
    change: "Changer pour cette réservation",
    reset: "Revenir au taux du comparateur",
    overrideTitle:
      "Commission de cette réservation (promotion, accord ponctuel)",
    overrideRate: "Taux en %",
    overrideAmount: "ou montant en €",
    overrideSaved: "Commission enregistrée",
    overrideBoth: "Indiquez un taux ou un montant, pas les deux.",
    cancel: "Annuler",
    keeps: (net: string) => `garde ${net}`,
  },
  // 21/10/2026 (« Mets en évidence les réservations sans prix », choice A + C).
  // T-A (26/10/2026): « Bien démarrer avec Plazo Pro », the dashboard card with the setup steps of the post.
  gettingStarted: {
    title: "Bien démarrer",
    progress: (done: number, total: number) => `${done} / ${total} étapes`,
    allDone: "Tout est en place.",
    // 27/10/2026: the welcome dialog at the first sign-in on this browser.
    welcome: {
      title: (firstName: string) =>
        firstName ? `Bienvenue, ${firstName} !` : "Bienvenue sur Plazo Pro !",
      body: (done: number, total: number) =>
        done > 0
          ? `Votre parking est en route : ${done} étape${done > 1 ? "s" : ""} sur ${total} déjà en place. Voici les prochaines.`
          : `Quelques étapes mettent votre parking en route sur Plazo. Voici les premières.`,
      hint: "Vous retrouvez la liste complète à tout moment dans le menu de gauche, sous « Bien démarrer ».",
      start: (step: string) => `Commencer : ${step}`,
      ok: "C'est parti",
      later: "Plus tard",
    },
    hide: "Masquer",
    show: "Afficher",
    done: "Fait",
    todo: "À faire",
    open: "Ouvrir",
    steps: {
      parking: {
        title: "Votre parking",
        body: "Adresse, nombre de places, plan ou files de voiturier.",
      },
      bookings: {
        title: "Vos réservations",
        body: "Donnez votre adresse Plazo aux comparateurs : chaque mail crée la réservation.",
      },
      team: {
        title: "Votre équipe",
        body: "Ajoutez vos chauffeurs, voituriers et l'accueil, ou partagez le code du jour.",
      },
      shuttles: {
        title: "Vos navettes",
        body: "Les véhicules en service et le point de rendez-vous au retour.",
      },
      listing: {
        title: "Vos tarifs et votre fiche Plazo",
        body: "La grille tarifaire et la fiche que voient les voyageurs.",
      },
      contract: {
        title: "Votre contrat de stationnement",
        body: "Votre propre PDF, ou le modèle Plazo.",
      },
      sms: {
        title: "Le SMS de la veille",
        body: "L'heure et le texte envoyés à vos clients avant leur dépôt.",
      },
      post: {
        title: "Votre poste du jour",
        body: "Choisi dans Plazo Pro, sous « Plus ».",
      },
      vehicle: {
        title: "Votre véhicule du jour",
        body: "Pris dans Plazo Pro avant le premier trajet.",
      },
      notifications: {
        title: "Les notifications",
        body: "Autorisées sur votre téléphone, dans Plazo Pro.",
      },
      tracking: {
        title: "Le suivi des navettes",
        body: "Votre position partagée pendant un trajet.",
      },
      plan: {
        title: "Le plan du parking",
        body: "Les files ou les places où ranger les voitures.",
      },
      keys: {
        title: "Les clés",
        body: "Clés laissées ou crochet noté à chaque voiture.",
      },
      reservations: {
        title: "Une réservation saisie",
        body: "Reçue par téléphone ou au comptoir.",
      },
      inbox: {
        title: "La boîte de réception",
        body: "Les mails des comparateurs à vérifier.",
      },
    },
  },
  noPrice: {
    filter: (n: number) => `Sans prix · ${n}`,
    filterOff: "Toutes",
    filterHint:
      "Ces réservations ne comptent ni dans votre chiffre d'affaires ni dans vos commissions.",
    toFill: "Prix à saisir",
    input: (reference: string) => `Prix payé de ${reference} en euros`,
    save: "OK",
    cancel: "Annuler",
    saved: "Prix enregistré",
    invalid: "Montant invalide (ex. 45,50).",
    locked: `Payé sur ${PRODUCT.name}`,
    none: "Toutes les réservations ont un prix.",
    cardTitle: (n: number) => `Les compléter · ${n}`,
    cardAll: (n: number) => (n === 1 ? "Voir la réservation" : `Voir les ${n}`),
    alertDetail: (n: number) =>
      `${n} réservation${n > 1 ? "s" : ""} · le chiffre d'affaires est incomplet`,
    alertAction: "Les compléter",
    toTreatSub: (sub: string, n: number) => `${sub} · ${n} sans prix`,
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
      // S-C (07/10/2026): on a parking stored in files, the figure that matters.
      movesSub: (moves: number) =>
        moves === 0
          ? "aucune voiture à sortir aujourd'hui"
          : `${moves} voiture${moves > 1 ? "s" : ""} à sortir aujourd'hui`,
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
      // Payments are centralised: Plazo takes every payment. The tile only says whether travellers can pay online.
      stripeOn: "en ligne, encaissés par Plazo",
      stripeOff: "paiement en ligne non activé par Plazo",
      importLabel: "Import",
      importAt: (ago: string) => `dernier ${ago}`,
      importNever: "jamais",
      // 16/10/2026: a mail that needed Claude could not be read within the hour.
      importReadingOutage: (cause: InboundReadingOutageCause) =>
        `Lecture par Claude en panne : ${readingOutageCause[cause]}`,
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
        join_request: "Demande pour rejoindre l'équipe",
        price_missing: "Réservations sans prix",
        extras_due: "Services à faire avant le retour",
      } satisfies Record<AlertKind, string>,
      // 21/10/2026: « Camille Martin · Lavage intérieur et shampouineuse · retour 18:40 ».
      extrasDetail: (
        name: string | null,
        services: string | null,
        returnTime: string | null,
      ) =>
        [name, services, returnTime ? `retour ${returnTime}` : null]
          .filter(Boolean)
          .join(" · "),
      // 13/10/2026: « Julie Martin », « Julie Martin et 2 autres », or the count alone.
      joinDetail: (count: number, name: string | null) =>
        name
          ? count > 1
            ? `${name} et ${count - 1} autre${count > 2 ? "s" : ""}`
            : name
          : `${count} demande${count > 1 ? "s" : ""}`,
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
      // Direction A (26/10/2026): one aligned row per car, filters, keys in three positions.
      filters: {
        all: "Tous",
        returnsToday: "Retours du jour",
        noSpot: "Sans place",
        noKeys: "Clés ?",
        flightLate: "Vol en retard",
      },
      searchAria: "Trouver un véhicule",
      searchPlaceholder: "Plaque, nom…",
      noMatch: "Aucun véhicule ne correspond.",
      columns: {
        plate: "Plaque · client",
        place: "Place · file",
        keys: "Clés",
        return: "Départ",
        state: "État",
      },
      keysSeg: {
        none: "Clés ?",
        left: "Laissées",
        hook: "Crochet n°",
        hookN: (n: string) => `Crochet ${n}`,
        hookAria: "Numéro du crochet",
        hookPlaceholder: "n°",
        hookDone: (n: string) => `Clés au crochet ${n}.`,
      },
      shown: (n: number, total: number) =>
        n === total
          ? `${total} véhicule${total > 1 ? "s" : ""} · triés par retour`
          : `${n} sur ${total} · triés par retour`,
      more: (n: number) => `Voir les ${n} autres ›`,
      less: "Réduire",
      pax: (n: number) => `${n} pass.`,
      keysHook: (hook: string) => `Clés : crochet ${hook}`,
      keysLeft: (time: string) => `Clés laissées · ${time}`,
      markKeysLeft: "Clés laissées",
      markKeysLeftAria: "Marquer : le client a laissé ses clés",
      keysLeftDone: "Clés laissées notées.",
      keysLeftUndone: "Clés laissées : annulé.",
      undoKeysLeftAria: (time: string) =>
        `Clés laissées à ${time} · cliquer pour annuler`,
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
      // Direction B (23/10/2026): the plates on the map.
      noPositionShort: "sans position",
      persons: (n: number) => `${n} pers.`,
      open: "Ouvrir les retours",
      // 27/10/2026: the map folds so the vehicles panel takes the whole width.
      collapse: "Replier la carte",
      expand: "Afficher la carte",
      running: (n: number) =>
        n === 0
          ? "Aucune navette en route"
          : `${n} navette${n > 1 ? "s" : ""} en route`,
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
    // 09/10/2026: once the plan has room, its figure replaces the typed one everywhere.
    capacityValue: (n: number) => `${n} place${n > 1 ? "s" : ""}`,
    capacityFromPlan: (source: "files" | "spots") =>
      `Calculé depuis le plan du parking (${source === "files" ? "files de voiturier" : "places du plan"}) : c'est ce nombre qui compte partout (réservations, site, planning).`,
    openPlan: "Ouvrir le plan",
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
    valetMeetingPoint: "Rendez-vous du voiturier à l'aéroport",
    valetMeetingPointPlaceholder: "Terminal 1 · dépose-minute",
    valetMeetingPointHelp:
      "Pour les réservations « Voiturier au terminal » : là où le voiturier prend et rend la voiture. Vide : Terminal 1 · dépose-minute.",
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
    // 26/10/2026: the member chooses their own password from an invitation email.
    invite: "Renvoyer l'invitation",
    readOnlyInvite:
      "Vous pouvez seulement renvoyer l'invitation d'un membre qui n'a pas reçu son e-mail.",
    invited:
      "Invitation envoyée : un lien « Choisir mon mot de passe » lui est parti par e-mail (valable 7 jours).",
    inviteNotSent:
      "L'e-mail n'a pas pu partir : donnez-lui le mot de passe provisoire, ou réessayez plus tard.",
    createdInvited:
      "Compte créé. Un e-mail l'invite à choisir son mot de passe ; le mot de passe provisoire marche en attendant.",
    createdNotInvited:
      "Compte créé, mais l'e-mail d'invitation n'a pas pu partir : donnez-lui le mot de passe provisoire.",
    you: "vous",
    // 09/10/2026: a manager corrects a member's first and last name.
    rename: "Modifier le nom",
    renameTitle: (name: string) => `Nom de ${name}`,
    save: "Enregistrer",
    cancel: "Annuler",
    // 13/10/2026: how each member signs in to Plazo Pro.
    signIn: {
      password: "E-mail",
      apple: "Apple",
      google: "Google",
    } satisfies Record<SignInMethod, string>,
    signInPrefix: "Se connecte avec :",
    // 13/10/2026: the code of the day (changes by itself at the parking's midnight) and the requests it brings.
    code: {
      title: "Code du jour",
      changes: "change à minuit",
      copyCode: "Copier le code",
      copyMessage: "Copier un message prêt à envoyer",
      help: `Une nouvelle recrue télécharge ${PRODUCT.name} Pro, se connecte avec Apple ou Google et tape ce code. Vous validez ensuite sa demande ici ou dans l'app.`,
      message: (parking: string, code: string) =>
        `Rejoignez l’équipe de ${parking} sur ${PRODUCT.name} Pro : installez l’app, connectez-vous avec Apple ou Google, puis tapez le code du jour ${code}. Il change à minuit.`,
      codeCopied: "Code copié.",
      messageCopied: "Message copié : collez-le dans un SMS ou un mail.",
      copyFailed: "Copie impossible : sélectionnez le texte et copiez-le.",
      // The API refuses every code of a demo, suspended or archived operator (`accepting: false`).
      notAccepting:
        "Ce parking n'accepte pas de nouvelles demandes (démonstration, suspendu ou archivé).",
    },
    requests: {
      title: "Demandes en attente",
      count: (n: number) => `${n} demande${n > 1 ? "s" : ""} en attente`,
      privateEmail: "adresse relais d'Apple",
      via: (provider: string) => `Connexion avec ${provider}`,
      refuse: "Refuser",
      accept: "Accepter…",
      acceptLabel: (name: string) => `Accepter ${name}`,
      refuseLabel: (name: string) => `Refuser ${name}`,
      refuseTitle: "Refuser la demande",
      refuseConfirm: (name: string) =>
        `${name} ne rejoindra pas l'équipe. La personne pourra refaire une demande avec le code du jour.`,
      refused: (name: string) => `Demande de ${name} refusée.`,
      dialogTitle: (name: string) => `Accepter ${name}`,
      sentAt: (when: string) => `demande envoyée ${when}`,
      roleLabel: "Son rôle",
      roleHelp:
        "Préréglé sur le poste demandé ; le rôle se change ensuite dans l'équipe.",
      // `phrase`: the role inside a sentence (« Accepter comme agent d'accueil »).
      roles: {
        agent: {
          label: "Accueil",
          phrase: "agent d'accueil",
          help: "Réservations, arrivées, retours",
        },
        driver: {
          label: "Chauffeur",
          phrase: "chauffeur",
          help: "La navette, les arrivées et retours",
        },
        valet: {
          label: "Voiturier",
          phrase: "voiturier",
          help: "Placer et sortir les voitures, les clés",
        },
      } satisfies Record<
        JoinRole,
        { label: string; phrase: string; help: string }
      >,
      confirm: (phrase: string) => `Accepter comme ${phrase}`,
      accepted: (name: string, phrase: string) =>
        `${name} a rejoint l'équipe comme ${phrase}.`,
      cancel: "Annuler",
      // Worded for this screen (describeError's texts).
      errors: {
        // Most often a former member of this team (deactivated): reactivating that account keeps their history.
        email_taken: `Cette adresse e-mail est déjà celle d'un compte ${PRODUCT.name}, peut-être un ancien compte de votre équipe : réactivez-le dans la liste et donnez-lui au besoin un nouveau mot de passe ; la personne liera ensuite Apple ou Google dans Mon compte de l'app. Sinon, refusez la demande.`,
        not_found: "Cette demande n'existe plus.",
      } as Record<string, string>,
    },
  },
  account: {
    // Mon compte › Connexion (22/10/2026).
    signIn: {
      title: "Connexion",
      password: "E-mail et mot de passe",
      provider: { apple: "Apple", google: "Google" } as Record<
        "apple" | "google",
        string
      >,
      unlink: "Délier",
      unlinkTitle: (provider: string) =>
        `Ne plus se connecter avec ${provider} ?`,
      unlinkMessage: "Vous pourrez le lier de nouveau à tout moment.",
      linkGoogleHelp:
        "Liez votre compte Google pour vous connecter en un clic, ici et dans Plazo Pro.",
      linked: "Compte Google lié.",
      unlinked: "Connexion retirée.",
    },
    title: "Mon compte",
    // 09/10/2026: one's own first and last name.
    nameTitle: "Votre nom",
    firstName: "Prénom",
    lastName: "Nom",
    saveName: "Enregistrer",
    nameSaved: "Nom enregistré.",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    submit: "Changer le mot de passe",
    // « Mail du matin » (21/10/2026, choice A).
    morning: {
      section: "NOTIFICATIONS",
      title: "Mail du matin",
      intro:
        "Chaque jour, le planning, le chiffre d'affaires et l'état des intégrations dans votre boîte mail.",
      introStaff:
        "Chaque jour, le planning et l'état des intégrations dans votre boîte mail.",
      hour: "Heure d'envoi",
      hourHint: "Heure du parking, de 05:00 à 10:00.",
      to: "Envoyé à",
      sendNow: "M'envoyer celui d'aujourd'hui",
      sending: "Envoi…",
      sent: "Mail envoyé : il arrive dans quelques instants.",
      on: "Mail du matin activé.",
      off: "Mail du matin coupé.",
      saved: "Heure enregistrée.",
      who: "Qui le reçoit",
      whoText:
        "Allumé d'office pour les gérants, éteint pour l'accueil, les chauffeurs et les voituriers, qui peuvent l'allumer ici. Le lien « Ne plus le recevoir » en bas du mail l'éteint en un clic, sans se connecter.",
    },
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
  // 29/10/2026 (« le moyen de paiement », direction A « Payé par »).
  paidBy: {
    card: "Carte bancaire",
    cash: "Espèces",
    cheque: "Chèque",
    transfer: "Virement",
    holiday_vouchers: "Chèques-vacances",
    comparator: "Au comparateur",
    online: `En ligne sur ${PRODUCT.name}`,
  } satisfies Record<PaidBy, string>,
  // « Arrivées · Départs » (28/10/2026): the kind of a movement, on its green or indigo pill.
  movement: { arrival: "Arrivée", departure: "Départ" },
  // « Planning prévisionnel » (28/10/2026, direction A « Calendrier par mois »).
  forecast: {
    tabs: { day: "Jour", forecast: "Prévisionnel" },
    tabsLabel: "Vue du planning",
    title: "Planning prévisionnel",
    views: { semaine: "Semaine", mois: "Mois", "3mois": "3 mois" } as Record<string, string>,
    viewsLabel: "Période affichée",
    previous: "Période précédente",
    next: "Période suivante",
    today: "Aujourd'hui",
    legend: { arrivals: "Arrivées", departures: "Départs", high: "Plus de 85 %", full: "Complet" },
    weekdays: ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."],
    full: "Complet",
    overbooked: (n: number) => `Complet +${n}`,
    summary: (arrivals: number, departures: number) =>
      `${arrivals} arrivée${arrivals > 1 ? "s" : ""} · ${departures} départ${departures > 1 ? "s" : ""}`,
    busiest: (pct: number, day: string) => `Nuit la plus chargée : ${pct} % (${day})`,
    fullNights: (n: number) => `${n} nuit${n > 1 ? "s" : ""} complète${n > 1 ? "s" : ""}`,
    note: "Réservations enregistrées, tous canaux, sans les annulées. Les nuits sont comptées sur la capacité réelle du parking.",
    dayLabel: (date: string, arrivals: number, departures: number, load: string) =>
      `${date} : ${arrivals} arrivée${arrivals > 1 ? "s" : ""}, ${departures} départ${departures > 1 ? "s" : ""}, ${load}. Ouvrir le planning du jour.`,
    loadPct: (pct: number) => `occupation ${pct} %`,
  },
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
    returns: "Départs",
    arrivalsCount: (total: number, here: number) =>
      `${total} · ${here} sur place`,
    noArrival: "Aucune arrivée ce jour.",
    noReturn: "Aucun départ ce jour.",
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
    // 15/10/2026: a booking imported without its plate (read on arrival) leaves the « — plate » out.
    toastApproaching: (who: string, eta: number | null, plate: string) =>
      eta === null
        ? `${who} est en route${plate.trim() ? ` — ${plate}` : ""}`
        : `${who} arrive dans ${eta} min${plate.trim() ? ` — ${plate}` : ""}`,
    toastAnnounced: (who: string, minutes: number, plate: string) =>
      `${who} : « J'arrive dans ${minutes} min »${plate.trim() ? ` — ${plate}` : ""}`,
    /** E: the traveller's word, after the banner. */
    toastNote: (note: string) => ` · « ${note} »`,
    toastAtReception: (who: string, plate: string) =>
      `${who} est à l'accueil${plate.trim() ? ` — ${plate}` : ""}`,
    toastAtMeetingPoint: (who: string, plate: string) =>
      `Retour : ${who} est au point de rendez-vous${plate.trim() ? ` — ${plate}` : ""}`,
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
    // 10/10/2026 (« Pouvoir modifier le prix après l'intégration du mail »).
    priceHelp: "Ce que paie le client, sans les frais du comparateur.",
    priceLocked: `Payé en ligne sur ${PRODUCT.name} : le prix ne se modifie pas.`,
    paidBy: "Payé par",
    paidByHelp: "Facultatif. Cliquez de nouveau pour retirer le choix.",
    priceInput: "Prix payé en euros",
    editPrice: "Modifier le prix",
    addPrice: "Ajouter le prix",
    savePrice: "Enregistrer",
    cancelPrice: "Annuler",
    priceSaved: "Prix enregistré",
    // Night fees (12/10/2026): included in the price paid, frozen at booking.
    nightFeeIncluded: (price: string) => `dont ${price} de frais de nuit`,
    newTitle: "Nouvelle réservation",
    editTitle: "Modifier la réservation",
    arrival: "Arrivée",
    return: "Retour",
    date: "Date",
    time: "Heure",
    customerFirstName: "Prénom",
    customerLastName: "Nom",
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
    // « Voiturier au terminal » (27/10/2026, direction B).
    handover: "Prise en charge",
    handovers: { shuttle: "Navette", valet: "Voiturier au terminal" } as Record<"shuttle" | "valet", string>,
    handoverValetHelp:
      "Un voiturier prend la voiture au terminal à l'arrivée et la ramène au retour : le client ne prend pas la navette.",
    passengers: "Passagers",
    /** « Sièges auto » (24/10/2026, direction B « par âge »): the child seats to install in the shuttle. */
    childSeats: {
      label: "Sièges auto",
      title: "Sièges auto pour la navette",
      help: "Installés dans la navette, à l'aller comme au retour. Les enfants comptent dans les passagers.",
      none: "Aucun",
      exceed: "Les enfants comptent dans les passagers.",
      less: (ages: string) => `Un ${ages} de moins`,
      more: (ages: string) => `Un ${ages} de plus`,
    },
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
    // « Embarquer en un geste » (14/10/2026): the line « Pointé à l'embarquement par Karim · 09:47 ».
    boardingCheckIn: "Pointage",
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
    // 29/10/2026: the file a booking was imported from.
    imported: "Importée",
    importedFrom: (file: string, when: string) => `${file ? `« ${file} »` : "Depuis un fichier"} le ${when}`,
    importOpen: "Voir les imports",
    searchPlaceholder: "Plaque, nom, téléphone ou référence",
    search: "Rechercher",
    noResult: "Aucune réservation trouvée.",
    noneFromToday: "Aucune réservation à partir d'aujourd'hui.",
    orderFromToday: "Par date d'arrivée, à partir d'aujourd'hui",
    orderBeforeToday: "Par date d'arrivée, avant aujourd'hui",
    orderSearch: "Par date d'arrivée",
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
      "Démo : relier un téléphone ou changer l'envoi des SMS n'est pas possible ici.",
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
    descriptionHelp:
      "Les 160 premiers caractères servent de description dans Google.",
    // Both numbers formatted alike (« 1 500 / 2 000 », same space).
    descriptionCount: (n: number) =>
      `${n.toLocaleString("fr-FR")} / ${(2000).toLocaleString("fr-FR")}`,
    // 09/10/2026: Claude writes the « Présentation » from the parking's real data (nothing saved).
    writing: {
      write: "Rédiger avec Claude",
      improve: "Améliorer avec Claude",
      busy: "Claude rédige…",
      title: "Proposition de Claude",
      basis:
        "Rédigée d'après votre fiche enregistrée et les réglages du parking. Relisez-la avant d'enregistrer.",
      use: "Utiliser ce texte",
      another: "Proposer une autre version",
      dismiss: "Ignorer",
      used: "Texte repris dans la présentation : relisez-le, puis enregistrez la fiche.",
      unreliable: (figures: string[]) =>
        figures.length
          ? `Claude a cité ${figures.length > 1 ? "des chiffres absents" : "un chiffre absent"} de vos données (${figures.map((f) => Number(f).toLocaleString("fr-FR")).join(" ; ")}) : sa proposition est écartée. Demandez une autre version.`
          : "La proposition de Claude ne respecte pas les règles de la fiche : elle est écartée. Demandez une autre version.",
      // The zones' texts speak of a photo: these say the same for the presentation.
      errors: {
        ai_unavailable:
          "La rédaction par Claude n'est pas disponible : clé ANTHROPIC_API_KEY absente ou refusée.",
        ai_refused:
          "Claude n'a pas voulu rédiger cette présentation. Écrivez-la vous-même.",
        ai_failed: "La rédaction par Claude a échoué",
        ai_timeout: "Claude a mis trop de temps à rédiger. Réessayez.",
      } as Record<string, string>,
    },
    services: "Services",
    shuttleMinutes: "Trajet en navette (min)",
    // 14/10/2026 (« attente déclarée »): the shuttle's average wait, shown as a tag on the Plazo results and page.
    shuttleWaitMinutes: "Attente moyenne de la navette (min)",
    shuttleWaitHelp: "Facultatif. Laissé vide, le tag n'apparaît pas.",
    shuttleWaitInvalid: "Nombre entier, entre 0 et 120 minutes.",
    // The tags travellers see on the Plazo results (14/10/2026, direction C), worded exactly as on the site
    // (site/src/lib/fr.ts: highlights.shuttleBox, chips, evChip, cancelChip, cancellation), apostrophes included.
    previewTags: {
      label: "Tags de l'annonce",
      shuttle: "Navette gratuite",
      ride: "trajet",
      wait: "attente moy.",
      waitFull: "attente moyenne",
      minutes: (minutes: number) => `${minutes} min`,
      outdoor: "Extérieur",
      covered: "Couvert",
      keysValet: "Vous devez remettre vos clés",
      keysSelf: "Vous gardez vos clés",
      open24h: "Ouvert 24h/24",
      openHours: (hours: string) => `Ouvert ${hours}`,
      fenced: "Clôturé",
      ev: "Recharge",
      evTitle: "Recharge électrique",
      cancel: {
        free_until_arrival: "Gratuit jusqu’à l’arrivée",
        free_24h: "Gratuit 24 h",
        free_48h: "Gratuit 48 h",
        non_refundable: "Non remboursable",
      } satisfies Record<CancellationPolicy, string>,
      cancelTitle: {
        free_until_arrival: "Annulation gratuite jusqu’à l’arrivée",
        free_24h: "Annulation gratuite jusqu’à 24 h avant",
        free_48h: "Annulation gratuite jusqu’à 48 h avant",
        non_refundable: "Non annulable",
      } satisfies Record<CancellationPolicy, string>,
    },
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
    // With night fees on, the commission applies to the whole total (12/10/2026).
    commissionNight: (pct: string) =>
      `Sur une réservation payée en ligne, ${PRODUCT.name} retient sa commission (${pct} %), frais de nuit compris, et vous reverse le reste. Les réservations au comptoir, par téléphone ou via les comparateurs ne sont pas concernées.`,
    commissionUnsetNight: `Sur une réservation payée en ligne, ${PRODUCT.name} retient une commission (taux à convenir), frais de nuit compris, et vous reverse le reste. Les réservations au comptoir, par téléphone ou via les comparateurs ne sont pas concernées.`,
    // Night fees (12/10/2026, « ajoute des frais de nuit pour les arrivées et départs en heure définie par le parking »).
    night: "Frais de nuit",
    nightNew: "Nouveau",
    nightSwitch: "Appliquer des frais de nuit",
    nightFrom: "Heures de nuit : de",
    nightTo: "à",
    nightStart: "Début de la nuit",
    nightEnd: "Fin de la nuit",
    nightArrival: "Dépôt de nuit",
    nightReturn: "Retour de nuit",
    nightHelp: (start: string, end: string) =>
      `Un dépôt ou un retour réservé entre ${start} et ${end} ajoute ces frais au séjour. Le voyageur les voit compris dans le prix total, avec une ligne « Frais de nuit ». ${start} compte comme la nuit, ${end} non.`,
    nightScope: `Seulement pour les réservations faites sur ${PRODUCT.name} : les réservations des comparateurs et celles saisies par l'équipe gardent leur prix.`,
    nightOff:
      "Ajoutez des frais quand un dépôt ou un retour est réservé pendant les heures de nuit du parking.",
    nightErrors: {
      same_time: "Choisissez une fin différente du début.",
      invalid_fee: "Montant invalide (ex. 15,00), 1 000 € au plus.",
      fee_required: "Indiquez au moins un montant : dépôt ou retour de nuit.",
    },
    simNightTitle: "Avec frais de nuit",
    simNightArrival: "dépôt à",
    simNightReturn: "retour à",
    simNightAnd: "et",
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
    moved: (plate: string, code: string) =>
      `${plate || "Véhicule"} placé en ${code}`,
    released: (plate: string) =>
      plate ? `${plate} n'a plus de place` : "Le véhicule n'a plus de place",
    spotTaken: "Cette place est déjà prise sur ces dates.",
    openBooking: "Ouvrir la réservation",
  },
  // "Planning des files" (07/10/2026): the coming days read in files, on a parking stored in files.
  filesPlanning: {
    title: "Planning des files",
    intro: `Pour chaque jour : les retours attendus, les files qui les servent, et ce qui manque. ${PRODUCT.name} garde des files vides pour les gros jours ; vous pouvez en réserver une à la main.`,
    window: (days: number) => `${days} jours`,
    windowLabel: "Fenêtre",
    capacity: (n: number) => `${n} place${n > 1 ? "s" : ""} en file`,
    alerts: "Alertes",
    noAlert: "Rien à signaler sur la fenêtre.",
    missingRoom: (date: string, n: number) =>
      `${date} : il manque ${n} place${n > 1 ? "s" : ""} en file`,
    overCapacity: (date: string, n: number) =>
      `${date} : ${n} voiture${n > 1 ? "s" : ""} de trop pour les files`,
    // The server counts the cars blocked behind one leaving later.
    unsound: (code: string, n: number) =>
      `File ${code} : ${n} voiture${n > 1 ? "s" : ""} bloquée${n > 1 ? "s" : ""} derrière une autre`,
    columns: {
      day: "Jour",
      returns: "Retours",
      serving: "Files qui servent",
      kept: "Files gardées",
      room: "Place",
      missing: "Manque",
    },
    returnsCell: (toCome: number, placed: number) =>
      `${toCome} à venir · ${placed} placée${placed > 1 ? "s" : ""}`,
    onSite: (n: number) => `${n} sur place`,
    none: "—",
    keep: "Réserver une file…",
    keepFor: (date: string) => `Garder une file vide pour ${date}`,
    noEmptyFile: "Aucune file vide à réserver.",
    kept: (code: string, date: string) => `File ${code} gardée pour ${date}`,
    release: "Libérer",
    released: (code: string) => `File ${code} libérée`,
    files: "Files",
    byHand: "à la main",
    unsoundBadge: "à remettre en ordre",
    prepare: "Préparer les files",
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
      `Cliquez une place libre pour y mettre ${plate || "le véhicule"}.`,
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
    placed: (plate: string, code: string) =>
      `${plate || "Véhicule"} placé en ${code}`,
    released: (plate: string) =>
      plate ? `${plate} n'a plus de place` : "Le véhicule n'a plus de place",
    keysSaved: "Crochet enregistré",
    openBooking: "Ouvrir la réservation",
    freeSpot: "Place libre",
    clickSpot: "Cliquez une place sur le plan pour voir qui l'occupe.",
    bookedFor: (plate: string, date: string) =>
      `${plate || "Véhicule"} attendu le ${date}`,
    // « Embarquer en un geste » (14/10/2026): the traveller was checked in by the driver as they boarded.
    boardingCheckIn: (driver: string | null) =>
      driver
        ? `Pointé à l'embarquement par ${driver}`
        : "Pointé à l'embarquement",
    // S-C (07/10/2026): the occupation read in files.
    files: {
      intro:
        "Chaque file se lit de l'allée vers le fond : une voiture ne doit jamais repartir après celle qui est derrière elle. Plazo dit dans quelle file ranger chaque arrivée.",
      movesToday: "À sortir aujourd'hui",
      movesHelp:
        "Voitures à déplacer pour que les retours du jour sortent. L'objectif : 0.",
      cars: (cars: number, capacity: number) =>
        `${cars} / ${capacity} voitures`,
      filesCount: (sound: number, total: number) =>
        `${total} file${total > 1 ? "s" : ""}${sound < total ? ` · ${total - sound} à remettre en ordre` : ""}`,
      aisle: "Allée",
      back: "Fond",
      empty: "Vide",
      freeFile: "Libre",
      keptFor: (day: string) => `Gardée pour ${day}`,
      returnsOf: (day: string) => `Retours ${day}`,
      full: "Complète",
      toTakeOut: (n: number) => `${n} à sortir avant`,
      blockedBy: (plates: string) => `Bloquée par ${plates}`,
      takeOut: "Retirer de la file",
      removed: (plate: string) => `${plate || "Voiture"} retirée de sa file`,
      placed: (plate: string, code: string) =>
        `${plate || "Voiture"} rangée en ${code}`,
      place: "Ranger",
      placeIn: (code: string) => `Ranger en ${code}`,
      otherFile: "Autre file…",
      noFile: "Aucune file ne convient sans déplacement : choisissez-en une.",
      reason: {
        planned_day: "retours du même jour",
        tight_fit: "derrière un retour plus tard",
        empty: "file vide",
        moves: (n: number) =>
          `${n} voiture${n > 1 ? "s" : ""} à sortir plus tard`,
        full: "complète",
      },
      choiceLine: (
        code: string,
        cars: number,
        capacity: number,
        reason: string,
      ) => `${code} · ${cars}/${capacity} · ${reason}`,
      prepare: "Préparer les files",
      prepared: (planned: number, free: number) =>
        `${planned} file${planned > 1 ? "s" : ""} gardée${planned > 1 ? "s" : ""} pour les gros retours, ${free} libre${free > 1 ? "s" : ""}`,
      keysPrompt: "Crochet des clés (facultatif)",
      confirm: "Confirmer",
      cancel: "Annuler",
      noArrival: "Aucune arrivée à placer.",
      arrivals: (n: number) => `Arrivées à placer · ${n}`,
      position: (n: number) =>
        n === 1 ? "1re depuis l'allée" : `${n}e depuis l'allée`,
      plan: "Modifier les files sur le plan",
      inFile: (code: string) => `File ${code}`,
    },
    spotTaken: "Cette place est déjà prise sur ces dates.",
  },
  // Bloc 2, step "Plan" (P-A, 03/10/2026): the operator's own parking plan.
  // R-A (07/10/2026): the plan editor, one map and one toolbar; see CLAUDE.md, bloc 2.
  planEditor: {
    /** The pin on the parking's address, and the map button that brings it back into view. */
    addressPin: "Adresse du parking",
    recenter: "Recentrer sur le parking",
    /** R-A (09/10/2026): the map turns. */
    rotation: {
      north: "Nord",
      northUp: "Remettre le nord en haut",
      align: "Aligner sur le parking",
      hint: "Met le grand côté du parking à l'horizontale. Pour tourner la carte à la main : clic droit + glisser, ou Ctrl + glisser (deux doigts sur téléphone).",
    },
    /** P-B (09/10/2026): the palette folds. */
    palette: {
      collapse: "Replier la palette",
      expand: "Déplier la palette",
    },
    /** Ctrl+Z / Ctrl+Maj+Z (09/10/2026). */
    history: {
      undone: "Modification annulée",
      redone: "Modification rétablie",
      nothingToUndo: "Rien à annuler",
      nothingToRedo: "Rien à rétablir",
    },
    tools: {
      contour: "Contour",
      parking: "Zone de parking",
      passage: "Zone de passage",
      obstacle: "Obstacle",
      landmark: "Repères",
      files: "Files",
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
      files:
        "Une file = un trait sur la photo, de l'allée vers le fond : les voitures s'y rangent nez à queue, la première entrée au fond. C'est l'unité de rangement d'un parking voiturier.",
      spots:
        "Choisissez une disposition et générez les places, puis cliquez une place pour la désactiver ou changer son type.",
    },
    /** The estimator's tools (zones, obstacles, spots), folded under the three of the plan in files. */
    advanced: "Avancé",
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
        files: "Files de rangement",
      },
      zonesByClaude: "proposées par Claude",
      zonesAuto: "tout le terrain hors bâtiments",
      // Notes of the steps skipped when the pass runs on a plan already begun.
      outlineKept: "contour actuel",
      zonesKept: "zones actuelles conservées",
      noValetSpots: "aucune file de voiturier",
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
    // S-C (07/10/2026): files as the unit of storage.
    files: {
      draw: "+ Tracer une file",
      drawHelp:
        "Cliquez au bord de l'allée puis au fond de la file ; double-cliquez pour terminer. La capacité se déduit de la longueur, corrigez-la si besoin.",
      count: (n: number) => `${n} file${n > 1 ? "s" : ""}`,
      cars: (n: number) => `${n} voiture${n > 1 ? "s" : ""}`,
      capacity: "voitures",
      code: "Code",
      name: "Nom (facultatif)",
      none: `Aucune file pour l'instant. Tracez-en une d'un trait, ou laissez ${PRODUCT.name} vous en proposer.`,
      propose: "Me proposer des files",
      proposeHelp: `${PRODUCT.name} découpe le terrain en files de voiturier (peigne) et vous les propose ; vous pouvez ensuite les corriger d'un trait.`,
      proposeReplaces:
        "Les files actuelles seront remplacées par la proposition.",
      proposed: (n: number) =>
        `${n} file${n > 1 ? "s" : ""} proposée${n > 1 ? "s" : ""} : corrigez-l${n > 1 ? "es" : "a"} d'un trait si besoin`,
      noValetSpots:
        "Aucune file n'est sortie du terrain : tracez-les d'un trait.",
      remove: "Retirer",
      removeConfirm: (code: string) => `Retirer la file ${code} ?`,
      occupied: "Cette file contient des voitures : videz-la d'abord.",
      duplicate: "Ce code est déjà pris.",
      added: (code: string, n: number) =>
        `File ${code} tracée : ${n} voiture${n > 1 ? "s" : ""}`,
      tooShort: "Trait trop court pour une voiture.",
      headline: (files: number, cars: number) =>
        `${files} file${files > 1 ? "s" : ""} · ${cars} voiture${cars > 1 ? "s" : ""}`,
      subline: "Rangement en files (voiturier)",
      occupation: "Voir l'occupation en files",
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
      "Tracez votre terrain sur la photo aérienne, découpez-le en zones, puis générez les places : leur nombre (ou la capacité des files de voiturier) est la capacité utilisée partout (réservations, site, planning).",
    saving: "Enregistrement…",
    saved: "Enregistré",
    saveError: "Non enregistré",
    // R-A (07/10/2026): start again, in whole or in part.
    reset: "Réinitialiser…",
    resetAll: "Tout le plan",
    resetAllHelp:
      "Contour, zones, parties exclues, repères, places et files vides : la carte repart vide, sur l'adresse du parking.",
    resetZones: "Les zones et parties exclues",
    resetZonesHelp:
      "Le contour reste ; les zones sont redécoupées, les bâtiments IGN gardés.",
    resetSpots: "Les places seulement",
    resetSpotsHelp:
      "Le tracé reste ; toutes les places sont effacées, même celles posées à la main ; sans places, la capacité utilisée partout redevient le chiffre déclaré (ou celle des files).",
    resetFiles: "Files seulement",
    resetFilesHelp:
      "Retire les files vides ; les places et le terrain restent. Sans files, le nombre de places redevient la capacité utilisée partout.",
    resetConfirm: {
      all: "Effacer tout le plan (contour, zones, parties exclues, repères, places et files vides) ? La capacité utilisée partout redeviendra le chiffre déclaré dans les réglages (ou la capacité des files qui gardent des voitures).",
      zones:
        "Effacer les zones et les parties exclues tracées à la main ? Toutes les places seront effacées aussi, même celles posées à la main ; sans places, la capacité utilisée partout redevient le chiffre déclaré (ou celle des files).",
      spots:
        "Effacer toutes les places, même celles posées à la main ? Sans places, la capacité utilisée partout redevient le chiffre déclaré (ou celle des files).",
      files:
        "Retirer toutes les files ? Une file qui contient des voitures ne peut pas être retirée. Sans files, la capacité utilisée partout redevient le nombre de places du plan (ou le chiffre déclaré).",
    },
    resetDone: "Plan réinitialisé",
    resetFilesDone: "Files retirées",
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
    // 09/10/2026: the plan's spots or files are the capacity used everywhere.
    capacityUsed: (n: number) =>
      `Capacité utilisée partout : ${n} place${n > 1 ? "s" : ""}`,
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
      prospecting: "Prospection",
      capacity: "Outil capacité",
    },
    prospecting: {
      // 21/10/2026 (C): the prospect's own demo link.
      colDemo: "Démo",
      demoCreate: "Créer un lien de démo",
      demoCreating: "Création…",
      demoOpened: (n: number, when: string | null) =>
        `Ouverte ${n} fois${when ? ` · ${when}` : ""}`,
      demoNotOpened: "Pas encore ouverte",
      demoValidUntil: (day: string) => `Lien valable jusqu'au ${day}`,
      demoExpired: "Lien expiré",
      demoRenew: "Nouveau lien",
      demoPanelTitle: (company: string) => `Lien de démo pour ${company}`,
      demoPanelNote:
        "Ouvre la démo sans compte, valable 14 jours. Vous voyez quand elle est ouverte ; la relance peut l'inclure ({lien_demo}).",
      demoCopy: "Copier",
      demoCopied: "Lien copié.",
      demoClose: "Fermer",
      demoShow: "Voir le lien",
      title: "Prospection",
      intro:
        "Parkings d'aéroport à faire venir sur Plazo. Les réponses arrivent dans votre boîte mail.",
      importCsv: "Importer un CSV",
      add: "+ Ajouter un prospect",
      notConfigured:
        "L'envoi n'est pas configuré sur le serveur (clé Brevo, expéditeur, adresse du site) : vous pouvez préparer la liste, rien ne partira.",
      filters: "Filtrer par état",
      all: "Tous",
      filterLabels: {
        to_contact: "À contacter",
        contacted: "Contactés",
        replied: "Ont répondu",
        interested: "Intéressés",
        not_interested: "Pas intéressés",
        unsubscribed: "Désinscrits",
      } as Record<ProspectStatus, string>,
      airport: "Aéroport",
      airportAll: "Tous les aéroports",
      // Classement par région (19/10/2026, « Groupés par région » + « De l'aéroport »).
      region: "Région",
      regionAll: "Toutes les régions",
      regionNone: "Sans région",
      regionOption: (label: string, n: number) => `${label} (${n})`,
      regionBlock: (label: string, n: number) => `${label} · ${n}`,
      regionExpand: (label: string) => `Déplier ${label}`,
      regionCollapse: (label: string) => `Replier ${label}`,
      regionCheckAll: "Tout cocher dans la région",
      regionUncheckAll: "Tout décocher dans la région",
      regionManual: "choisie à la main",
      regionAuto: "Automatique (d'après l'aéroport)",
      regionHelp:
        "Par défaut, la région de l'aéroport. Choisissez-en une si le parking n'en dépend pas.",
      colParking: "Parking",
      colContact: "Contact",
      colAirport: "Aéroport",
      colState: "État",
      colNext: "Prochain envoi",
      selectAll: "Tout choisir",
      selectOne: (name: string) => `Choisir ${name}`,
      chosen: (n: number) =>
        n === 0
          ? "Aucun prospect choisi"
          : `${n} prospect${n > 1 ? "s" : ""} choisi${n > 1 ? "s" : ""}`,
      empty:
        "Aucun prospect pour le moment : importez un fichier CSV ou ajoutez-en un.",
      emptyFilter: "Aucun prospect dans cette vue.",
      states: {
        to_contact: "À contacter",
        waiting: "En attente",
        contacted: [
          "Mail 1 envoyé",
          "Mail 1 envoyé",
          "Relance envoyée",
          "Dernier envoyé",
        ],
        replied: "A répondu",
        interested: "Intéressé",
        not_interested: "Pas intéressé",
        unsubscribed: "Désinscrit",
      },
      stepShort: { 1: "Mail 1", 2: "Relance", 3: "Dernier" } as Record<
        number,
        string
      >,
      next: {
        stopped: "— arrêté",
        finished: "— terminé",
        never: "— jamais plus",
        none: "—",
      },
      failed: (n: number) => `Envoi refusé ${n} fois`,
      // The panel « Envoyer à N prospects ».
      panelTitle: (n: number) =>
        n === 0
          ? "Envoyer à des prospects"
          : `Envoyer à ${n} prospect${n > 1 ? "s" : ""}`,
      today: (sent: number, cap: number) => `${sent} / ${cap} aujourd'hui`,
      pickSome: "Cochez les prospects à contacter dans la liste.",
      sequence: "La séquence",
      stepTitle: {
        1: "1 · Premier contact",
        2: "2 · Relance",
        3: "3 · Dernier message",
      } as Record<number, string>,
      stepWhen: (delay: number) => (delay === 0 ? "J0" : `J+${delay}`),
      stepOff: "Désactivé",
      editSteps: "Modifier les mails",
      previewFor: (name: string) => `Aperçu pour ${name}`,
      previewSample: "Aperçu",
      footerNote:
        "Ajouté en bas de chaque mail : qui écrit (Benford Tech) et « Ne plus recevoir de messages de Plazo ».",
      variables: "Variables :",
      rules:
        "Une relance ne part jamais à qui a répondu ou s'est désinscrit. Envoi du lundi au vendredi, de 9 h à 18 h.",
      sendTest: "M'envoyer un test",
      testSent: (email: string) => `Test envoyé à ${email}.`,
      send: (n: number) => `Envoyer à ${n} prospect${n > 1 ? "s" : ""}`,
      notEligible: (n: number) =>
        `${n} déjà contacté${n > 1 ? "s" : ""} ou fermé${n > 1 ? "s" : ""} : ignoré${n > 1 ? "s" : ""}.`,
      confirmTitle: "Envoyer la séquence",
      confirm: (n: number, remaining: number) =>
        `Le premier mail part maintenant pour ${Math.min(n, remaining)} prospect${Math.min(n, remaining) > 1 ? "s" : ""}` +
        (n > remaining
          ? `, les ${n - remaining} autres au prochain créneau (plafond du jour)`
          : "") +
        ". Les relances suivront d'elles-mêmes.",
      confirmYes: "Envoyer",
      sent: (sent: number, queued: number, failed: number) =>
        [
          sent
            ? `${sent} mail${sent > 1 ? "s" : ""} envoyé${sent > 1 ? "s" : ""}`
            : "Aucun mail envoyé",
          queued ? `${queued} en attente du prochain créneau` : "",
          failed
            ? `${failed} refusé${failed > 1 ? "s" : ""} par Brevo (nouvel essai dans une heure)`
            : "",
        ]
          .filter(Boolean)
          .join(" · ") + ".",
      // Per prospect.
      actions: "Actions",
      actionsFor: (name: string) => `Actions pour ${name}`,
      replied: "A répondu",
      interested: "Intéressé",
      notInterested: "Pas intéressé",
      markUnsubscribed: "Désinscrire",
      stop: "Arrêter les relances",
      invite: "Inviter sur Plazo",
      edit: "Modifier",
      remove: "Supprimer",
      removeConfirm: (name: string) =>
        `Supprimer ${name} de la liste ? Son historique d'envoi part avec lui.`,
      unsubscribeConfirm: (name: string) =>
        `Désinscrire ${name} ? Son adresse ne pourra plus jamais être contactée ni réimportée.`,
      stopConfirm: (name: string) =>
        `Arrêter les relances de ${name} ? Son état ne change pas.`,
      updated: "Prospect mis à jour.",
      removed: "Prospect supprimé.",
      // The form.
      formAdd: "Ajouter un prospect",
      formEdit: "Modifier le prospect",
      fields: {
        companyName: "Parking",
        contactFirstName: "Prénom",
        contactLastName: "Nom",
        email: "E-mail",
        town: "Ville",
        airportCode: "Aéroport (code)",
        region: "Région",
        phone: "Téléphone",
        notes: "Notes",
      },
      airportHelp: "Code IATA, ex. LYS.",
      save: "Enregistrer",
      cancel: "Annuler",
      added: "Prospect ajouté.",
      // The import.
      importTitle: "Importer un CSV",
      importHelp:
        "Première ligne : les noms des colonnes. Reconnues : parking, prénom, nom, e-mail, ville, aéroport, région (facultative, sinon celle de l'aéroport), téléphone, notes (séparateur ; ou ,). Seulement des adresses professionnelles que vous avez le droit d'utiliser.",
      importFile: "Fichier CSV",
      importReading: "Lecture…",
      importMissing: (cols: string[]) =>
        `Colonne manquante : ${cols.join(", ")}.`,
      importIgnored: (cols: string[]) =>
        `Colonnes ignorées : ${cols.join(", ")}.`,
      importEmpty: "Le fichier ne contient aucune ligne.",
      importCounts: (c: {
        new: number;
        duplicate: number;
        suppressed: number;
        invalid: number;
      }) =>
        `${c.new} à ajouter · ${c.duplicate} déjà dans la liste · ${c.suppressed} désinscrit${c.suppressed > 1 ? "s" : ""} · ${c.invalid} en erreur`,
      outcomes: {
        new: "À ajouter",
        duplicate: "Déjà dans la liste",
        suppressed: "Désinscrit",
        invalid: "Erreur",
      },
      importRow: "Ligne",
      importSubmit: (n: number) => `Importer ${n} prospect${n > 1 ? "s" : ""}`,
      imported: (n: number) =>
        `${n} prospect${n > 1 ? "s" : ""} importé${n > 1 ? "s" : ""}.`,
      // The editor.
      editorTitle: "Modifier les mails",
      editorHelp:
        "Les relances partent N jours après le premier contact. Une relance éteinte est sautée.",
      subject: "Objet",
      body: "Message",
      delay: "Jours après le premier contact",
      enabled: "Envoyer cette étape",
      dailyCap: "Mails par jour au plus",
      testStep: "M'envoyer ce mail",
      saved: "Mails enregistrés.",
      senderLine: (name: string, email: string) =>
        `Expéditeur : ${name} <${email}>`,
      replyLine: (email: string | null) =>
        email ? `Réponses à : ${email}` : "Réponses à : votre adresse",
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
      archivedOn: (date: string) => `archivé le ${date}`,
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
      // 09/10/2026 (« archive les parkings suspendus »).
      views: "Afficher",
      viewCurrent: "Loueurs",
      viewArchived: "Archivés",
      archive: "Archiver",
      unarchive: "Désarchiver",
      confirmArchive: (name: string) =>
        `Archiver ${name} ? Il quitte les listes Loueurs et Annonces et les tâches automatiques (rappels, suivi des vols). Ses données sont gardées : « Désarchiver » le ramène, toujours suspendu.`,
      archived: "Loueur archivé.",
      unarchived: "Loueur désarchivé, toujours suspendu.",
      statusArchived: "Archivé",
      emptyArchived: "Aucun loueur archivé.",
      // 09/10/2026 (« pouvoir supprimer un parking »).
      delete: "Supprimer",
      deleteTitle: "Supprimer définitivement ce loueur ?",
      confirmDelete: (
        name: string,
        counts: {
          parkings: number;
          listings?: number;
          reservations: number;
          staff: number;
        },
        options: { canArchive: boolean },
      ) =>
        `${name} sera effacé avec ${deletionSummary(counts)}. Cette action est définitive${
          options.canArchive
            ? " : pour le garder sans qu'il apparaisse, archivez-le."
            : "."
        }`,
      deleteConfirm: "Supprimer définitivement",
      paidKeptArchived:
        "Ce loueur a reçu des paiements en ligne : il reste archivé pour la comptabilité et ne peut pas être supprimé.",
      paidSuspendFirst:
        "Ce loueur a reçu des paiements en ligne : ils restent dans la comptabilité. Suspendez-le puis archivez-le plutôt que de le supprimer.",
      deleted: (name: string) => `${name} est supprimé.`,
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
      inviteFirstName: "Prénom du gérant",
      inviteLastName: "Nom du gérant",
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
        "Archiver un loueur suspendu (filtre « Archivés »), le désarchiver",
        "Supprimer un loueur invité par erreur, ou suspendu sans paiement en ligne (définitif)",
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
      // 12/10/2026: everything a traveller can be charged.
      extraDay: (price: string) => `Jour en plus : ${price}`,
      night: (start: string, end: string) =>
        `Frais de nuit de ${start} à ${end} :`,
      nightArrival: (price: string) => `dépôt ${price}`,
      nightReturn: (price: string) => `retour ${price}`,
      noNight: "Sans frais de nuit.",
      photos: "Photos",
      noPhoto: "Aucune photo.",
      // 14/10/2026: the shuttle's average wait declared on « Ma fiche ».
      shuttleWait: (minutes: number) => `Attente moyenne : ${minutes} min`,
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

/**
 * French message for any error thrown by the API client. `texts` overrides the wording of some codes for one screen
 * (the `ai_*` codes speak of a photo for the zones, of a text for the presentation).
 */
export function describeError(
  error: unknown,
  texts?: Record<string, string>,
): string {
  // A gateway answer (the function cut short, the API down) carries no code of ours.
  if (
    error instanceof ApiError &&
    !error.code &&
    error.status >= 502 &&
    error.status <= 504
  )
    return fr.errors.gateway;
  if (error instanceof ApiError)
    return (error.code && texts?.[error.code]) || errorMessage(error.code);
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
    passengers: (n: number) => `${n} pers.`,
    since: (time: string) => `partie à ${time}`,
    noPosition: "position en attente",
    toStop: (name: string, min: number) => `${name} dans ${min} min`,
    toParking: (min: number) => `parking dans ${min} min`,
    end: "Terminer ce trajet",
    endConfirm: (driver: string) =>
      `Terminer le trajet de ${driver} ? Sa position ne sera plus partagée.`,
  },
  running: {
    // 22/10/2026: the real place (« Gare TGV », « l'aéroport »).
    to: (where: string) => `En route vers ${where} · position partagée`,
    // R-B: the parking turned the tracking off.
    toNoShare: (where: string) => `En route vers ${where} · suivi désactivé`,
    leftAt: (time: string) => `Parti à ${time}`,
    vehicle: (v: string) => `Véhicule : ${v}`,
    peopleGo: (n: number) => `${n} pers. à bord`,
    peopleBack: (n: number) => `${n} pers. à récupérer`,
    left: (m: number) => `arrêt automatique dans ${m} min`,
    endBack: "Tout le monde est à bord · retour au parking",
    endGo: "Clients déposés · retour au parking",
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
    // B (22/10/2026): « Aller » and « Retour » by time slot, the destination from each booking.
    introBack:
      "Les clients à aller chercher, dans l'ordre de leur retour. Cochez ceux que vous récupérez, puis partez : ils suivent votre position.",
    // « Embarquer en un geste » (14/10/2026): the expected travellers board too, checked in as the trip starts.
    introGo:
      "Les clients à conduire, dans l'ordre du planning. Cochez ceux qui montent, même « Attendu », puis partez : ils suivent votre position.",
    direction: {
      pickup: "Retour",
      dropoff: "Aller",
    } satisfies Record<ShuttleDirection, string>,
    tabGo: (n: number | null) => (n === null ? "Aller" : `Aller · ${n}`),
    tabBack: (n: number | null) => (n === null ? "Retour" : `Retour · ${n}`),
    theAirport: "l'aéroport",
    slotLeave: "départ conseillé",
    slotNoTime: "Sans heure",
    slotAll: "Tout cocher",
    slotNone: "Tout décocher",
    toDest: (where: string) => `vers ${where}`,
    atDest: (where: string) => `à ${where}`,
    startGo: (where: string, people: number) =>
      `Partir vers ${where} · ${people} pers.`,
    startBack: (where: string, people: number) =>
      `Aller chercher à ${where} · ${people} pers.`,
    startGoMany: (people: number, n: number) =>
      `Partir · ${people} pers. · ${n} destinations`,
    startBackMany: (people: number, n: number) =>
      `Aller chercher ${people} pers. · ${n} destinations`,
    noneGo: "Cochez les personnes qui montent",
    noneBack: "Cochez les personnes à récupérer",
    meetingPoint: (label: string) => `Point de rendez-vous : ${label}`,
    meetingPointNone:
      "Point de rendez-vous : l'aéroport (à définir dans Parking › Réglages).",
    emptyPickup: "Personne à aller chercher pour le moment.",
    emptyDropoff: "Personne à conduire pour le moment.",
    pax: (n: number) => `${n} pass.`,
    flight: (n: string) => `vol ${n}`,
    gate: (g: string) => `Porte ${g}`,
    arrivedAt: (t: string) => `Arrivé ${t}`,
    arrivalPlanned: (t: string) => `Arrivée prévue ${t}`,
    /** F-A (06/10/2026): the driver's tour in three bands. */
    tourTitle: "Ma tournée",
    bandRoute: (n: number) => `En route · ${n}`,
    expectedAt: (t: string) => `Attendu ${t}`,
    onSite: "Sur place",
    /** Checked in as they boarded this trip (« Embarquer en un geste »). */
    onSiteAt: (t: string) => `Sur place · ${t}`,
    /** The ticked travellers not checked in yet: one by name, else how many. */
    notCheckedIn: (names: string[]) =>
      names.length === 1
        ? `${names[0]} n'est pas encore pointé : il passera « Sur place » à l'embarquement.`
        : `${names.length} clients ne sont pas encore pointés : ils passeront « Sur place » à l'embarquement.`,
    /** The cars of the running trip checked in at boarding, waiting for the valet. */
    checkedInNote: (n: number) =>
      n === 1
        ? "1 voiture pointée à l'embarquement : le voiturier la retrouve dans « Arrivées à placer », avec ses clés."
        : `${n} voitures pointées à l'embarquement : le voiturier les retrouve dans « Arrivées à placer », avec leurs clés.`,
    /**
     * Travellers added by hand (from a booking's « Embarquer ») whom the lists read again after a refused start left out
     * of the selection: named, « Sarah Cohen » or « Sarah Cohen et Paul Dupont » (the same texts in Plazo Pro).
     */
    unpinned: (names: string[]) =>
      names.length === 1
        ? `${names[0]}, ajouté à la main, a été retiré de la sélection : vérifiez sa réservation.`
        : `${frenchList(names)}, ajoutés à la main, ont été retirés de la sélection : vérifiez leurs réservations.`,
    /** Opened from a booking's « Embarquer » for a traveller who cannot board now. */
    cannotBoard:
      "Ce client ne peut pas embarquer maintenant : il est déjà parti, annulé ou attendu un autre jour.",
    routeNone:
      "Aucun trajet en cours. Cochez des personnes dans « Aller » ou « Retour », puis partez.",
    routePassengers: "Passagers du trajet",
    spot: (code: string) => `Place ${code}`,
    /** « Sièges auto » (24/10/2026): « dont 2 enfants » after « 4 pers. », and the seats to load before leaving. */
    children: (n: number) => (n === 1 ? "dont 1 enfant" : `dont ${n} enfants`),
    loadTitle: "À charger avant de partir",
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
  arrival: "Arrivée",
  return: "Départ",
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
  // S-C (07/10/2026): "F07 · 3e depuis l'allée".
  inFile: (code: string, position: number | null) =>
    position === null
      ? code
      : `${code} · ${position === 1 ? "1re" : `${position}e`} depuis l'allée`,
  keys: "Clés",
  noKeys: "crochet non noté",
  keysLeft: "laissées",
  car: "Voiture",
  carDirections: "itinéraire",
  stop: "Desserte",
  passengers: (n: number) => `${n} pass.`,
  childSeats: "Sièges auto",
  notes: "Notes",
  customerNote: "Message du client",
  vehicle: "Véhicule",
  returnNotice: "Signalé au retour",
  /** « Pointé à l'embarquement par Karim · 09:47 » (14/10/2026). */
  boardingCheckIn: (driver: string | null, time: string) =>
    `${fr.occupation.boardingCheckIn(driver)} · ${time}`,
  next: {
    title: "Prochaine étape",
    place: "Placer la voiture",
    placeHelp:
      "Sur le plan, avec le crochet des clés : le client passe « Sur place ».",
    dropOff: "Déposer au terminal",
    dropOffHelp: "Ouvre la navette, côté départs, avec ce client sélectionné.",
    // « Embarquer en un geste » (14/10/2026): an expected traveller boards the shuttle and is checked in as it starts.
    board: "Embarquer",
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
  // C (14/10/2026, « C puis A »): the comparators write to the Plazo address; the mailbox rule is the fallback.
  intro:
    "Le plus simple : donnez votre adresse Plazo à chaque comparateur, comme adresse de notification des réservations. Les mails arrivent directement dans Plazo, sans règle dans votre messagerie. Gardez votre adresse habituelle à côté si l'espace partenaire le permet.",
  comparators: {
    title: "Vos comparateurs",
    columns: {
      provider: "Comparateur",
      last: "Dernier mail reçu par Plazo",
      arrival: "Arrive",
    },
    never: "Aucun mail reçu",
    last: (ago: string, what: string) => (what ? `${ago} · ${what}` : ago),
    lastStatus: {
      imported: "réservation importée",
      duplicate: "déjà dans Plazo",
      incomplete: "à compléter",
      unrecognised: "à lire",
      dismissed: "traité",
      handled: "traité",
      archived: "archivé",
      forwarding: "",
      ignored: "",
    } satisfies Record<InboundEmailStatus, string>,
    arrival: {
      direct: "Directement",
      forwarded: "Par votre messagerie",
      manual: "Transféré à la main",
      unknown: "Reçu",
      none: "À régler",
    } satisfies Record<ComparatorArrival, string>,
    howTo: "Comment faire",
    hide: "Masquer",
    steps: (provider: string) =>
      `Dans votre espace partenaire ${provider}, cherchez l'adresse e-mail qui reçoit les réservations (souvent dans « Mon compte », « Notifications » ou « Contact ») et ajoutez votre adresse Plazo. Gardez la vôtre à côté si l'espace le permet.`,
    ask: (provider: string) =>
      `Vous ne trouvez pas ? Demandez-le à ${provider} avec ce message :`,
    message: (address: string) =>
      `Bonjour,\n\nPourriez-vous ajouter l'adresse ${address} aux destinataires des confirmations de réservation de notre parking ? Nous gardons aussi notre adresse habituelle.\n\nMerci !`,
    copyMessage: "Copier le message",
    messageCopied: "Message copié",
    fallback:
      "Un comparateur ne permet pas de changer l'adresse ? Reliez plutôt votre boîte mail : elle transférera ses mails.",
  },
  // A (14/10/2026): a rule that forwards every email brings the parking's own emails; Plazo sets them aside.
  unexpected: {
    title: "Plazo reçoit aussi vos autres mails",
    text: (n: number) =>
      `${n === 1 ? "1 mail" : `${n} mails`} de ces 7 derniers jours ne ${n === 1 ? "venait" : "venaient"} pas d'un comparateur : votre messagerie semble transférer tous vos mails. Ne gardez que la règle des comparateurs. Plazo écarte ces mails sans les garder.`,
    action: "Corriger le réglage",
  },
  // G-B (07/10/2026): the step-by-step wizard replaces the "Comment faire" list.
  connect: "Relier ma boîte mail",
  reviewSteps: "Revoir les étapes",
  unavailable:
    "La réception des mails n'est pas encore configurée sur la plateforme (domaine de réception et relais Cloudflare).",
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
    handled: "Traités",
    archived: "Archivés",
    forwarding: "Confirmation de transfert",
    ignored: "Écartés",
  } satisfies Record<InboundEmailStatus, string>,
  toCheck: (n: number) =>
    n === 0
      ? "Rien à vérifier"
      : n === 1
        ? "1 mail à vérifier"
        : `${n} mails à vérifier`,
  openList: "Voir les mails",
  // M-A « Boîte de réception » + T-A « Deux gestes » (08/10/2026): three tabs, a list and a reading pane.
  list: {
    title: "Boîte de réception",
    subtitle:
      "Les mails transférés à votre adresse Plazo : ceux à traiter, puis les traités et les archivés.",
    tabs: {
      todo: "À traiter",
      done: "Traités",
      archived: "Archivés",
    } satisfies Record<InboundEmailView, string>,
    empty: {
      todo: "Aucun mail à traiter.",
      done: "Aucun mail traité ces 30 derniers jours.",
      archived: "Aucun mail archivé ces 90 derniers jours.",
    } satisfies Record<InboundEmailView, string>,
    loadError: "Impossible de charger les mails.",
    /** The badge of one mail (singular; the counts of the Parking block use `status` above). */
    status: {
      imported: "Enregistré",
      duplicate: "Déjà connu",
      incomplete: "Incomplet",
      unrecognised: "Non reconnu",
      dismissed: "Classé",
      handled: "Traité",
      archived: "Archivé",
      forwarding: "Confirmation de transfert",
      ignored: "Écarté",
    } satisfies Record<InboundEmailStatus, string>,
    /**
     * 10/10/2026 (relecture): the badge of an Allopark change Plazo recognised but left to the staff, in place of
     * « Non reconnu ».
     */
    changeLeftStatus: "À faire à la main",
    noSubject: "(sans objet)",
    unknownSender: "expéditeur inconnu",
    from: "De",
    /** "Nom <adresse>", or whichever of the two the mail carried. */
    sender: (name: string | null, address: string | null) =>
      name && address
        ? `${name} <${address}>`
        : (name ?? address ?? "expéditeur inconnu"),
    received: "Reçu le",
    recognised: "Reconnu",
    /**
     * 10/10/2026 (« Prévent captcha »): the Allopark booking page of the mail. Plazo never passes an anti-robot check:
     * the staff open the page in their own browser, then « Compléter » or « Relancer l'analyse ».
     */
    alloparkPage: {
      label: "Page Allopark",
      outcome: {
        read: "lue, champs complétés",
        protected: "vérification anti-robot demandée",
        unavailable: "indisponible",
        not_found: "réservation introuvable sur la page",
      } satisfies Record<InboundPageOutcome, string>,
      open: "Ouvrir la page Allopark",
      // 11/10/2026 (« Lance l'analyse automatiquement pour allopark »): Plazo analyses the mail again by itself.
      retryAt: (time: string, attempt: number, of: number) =>
        `Nouvel essai automatique vers ${time} (${attempt} sur ${of})`,
      retrySoon: (attempt: number, of: number) =>
        `Nouvel essai automatique dans quelques minutes (${attempt} sur ${of})`,
      retriesDone: (count: number) =>
        `Plazo a réessayé ${count} fois sans trouver la réservation : ouvrez la page Allopark ou relancez l'analyse.`,
    },
    /** L-A (08/10/2026): what Claude made of a mail no importer knew. */
    reading: {
      title: "Lu par Claude",
      /** 16/10/2026 (« analyser sans passer par Claude »): what Plazo's rules per mail type made of it. */
      rulesTitle: "Reconnu par Plazo",
      /** 16/10/2026: Claude could not read the mail, which waits for it. */
      outage: (cause: InboundReadingOutageCause) =>
        `Claude n'a pas pu lire ce mail (${readingOutageCause[cause]}) : Plazo le relira dès que la lecture fonctionne de nouveau.`,
      kind: {
        booking: "Réservation",
        modification: "Modification",
        cancellation: "Annulation",
        other: "Autre mail",
      } satisfies Record<InboundReadingKind, string>,
      confidence: (percent: number) => `confiance ${percent} %`,
      unsure: "lecture incertaine : vérifiez chaque champ",
      notBooking:
        "Rien n'est créé de lui-même : lisez le mail et agissez sur la réservation concernée.",
    },
    understood: "Ce que Plazo a compris",
    missingBadge: "manquant",
    /** The server refused a complete mail at import (codes of `missing` that are not fields). */
    refused: (reasons: string) => `Réservation refusée à l'import : ${reasons}`,
    refusal: (code: string) =>
      fr.errors[code as keyof typeof fr.errors] ?? code,
    field: {
      arrivalAt: "date d'arrivée",
      returnAt: "date de retour",
      customerName: "nom du client",
      customerPhone: "téléphone",
      customerEmail: "e-mail du client",
      plate: "plaque",
      externalReference: "référence",
      departureFlight: "vol aller",
      returnFlight: "vol retour",
      passengers: "passagers",
      priceCents: "prix",
      vehicleModel: "véhicule",
      status: "statut",
    } as Record<string, string>,
    /**
     * 10/10/2026 (« C'est une modification »): an Allopark change of a booking, applied by Plazo or left to the staff;
     * one line per change, « Date de retour : 13 déc. 20:30 → 15 déc. 18:00 ».
     */
    change: {
      applied: "Modification appliquée à la réservation",
      upToDate: "Modification déjà prise en compte dans la réservation",
      manual: "Modification à faire à la main",
      /** 10/10/2026 (relecture): « Modification à faire à la main · réservation R7KQ2M ». */
      manualOn: "réservation",
      reason: {
        reservation_closed: "La réservation est close.",
        already_arrived:
          "La voiture est déjà arrivée : la date d'arrivée n'a pas été changée.",
        no_room: "Plus de place aux nouvelles dates.",
        plazo_booking: "Réservation faite sur Plazo.",
        invalid_stay: "Les nouvelles dates ne forment pas un séjour valable.",
        // 10/10/2026 (« Tu n'as pas récupéré le prix pour la modif »): bookings typed without the reference.
        ambiguous: "Plusieurs réservations correspondent : à faire à la main.",
        unknown_booking: "Aucune réservation de Plazo ne porte ce numéro.",
      } satisfies Record<InboundChangeReason, string>,
      nothingDone:
        "Plazo n'a rien changé : faites ces changements vous-même si besoin.",
      // 21/10/2026 (« apprends à traiter les annulations ParkVia »): the same block for a comparator's cancellation.
      cancelApplied: "Annulation appliquée à la réservation",
      cancelUpToDate: "Réservation déjà annulée",
      cancelManual: "Annulation à faire à la main",
      cancelReason: {
        reservation_closed: "La réservation est close.",
        already_arrived:
          "La voiture est déjà au parking : Plazo ne l'annule pas.",
        unknown_booking: "Aucune réservation de Plazo ne porte ce numéro.",
        ambiguous:
          "Plusieurs réservations portent ce numéro : à faire à la main.",
      } as Partial<Record<InboundChangeReason, string>>,
      cancelNothingDone:
        "Plazo n'a rien annulé : vérifiez la réservation vous-même.",
      none: "Aucun changement : la réservation était déjà à jour.",
      empty: "—",
    },
    complete: "Compléter et enregistrer",
    typeIt: "Saisir la réservation",
    openBooking: (ref: string) =>
      ref ? `Ouvrir la réservation ${ref}` : "Ouvrir la réservation",
    textGone: "Texte effacé (30 jours).",
    handle: "Marquer comme traité",
    archive: "Archiver",
    handled: "Mail marqué comme traité.",
    archived: "Mail archivé.",
    attached: "Mail rattaché à la réservation.",
    actions: "Actions du mail",
    /** « Relancer l'analyse » (10/10/2026): the reception's pipeline again, for a mail not attached to a booking. */
    reanalyse: "Relancer l'analyse",
    reanalysing: "Analyse en cours…",
    analysedAgain: "Analysé de nouveau le",
    reanalysed: {
      imported: (ref: string | null) =>
        ref
          ? `Réservation ${ref} créée depuis ce mail.`
          : "Réservation créée depuis ce mail.",
      duplicate: "Cette réservation existait déjà : le mail y est rattaché.",
      /** 20/10/2026: Onepark's daily summary, which completes the bookings it lists. */
      handled:
        "Récapitulatif lu : les réservations qu'il liste sont complétées.",
      /** 10/10/2026 (« C'est une modification »). */
      changed: (ref: string | null) =>
        ref
          ? `Modification appliquée à la réservation ${ref}.`
          : "Modification appliquée à la réservation.",
      changeLeft: "Analyse relancée : la modification reste à faire à la main.",
      /** 21/10/2026: a comparator's cancellation applied, or left to the staff. */
      cancelled: (ref: string | null) =>
        ref
          ? `Annulation appliquée à la réservation ${ref}.`
          : "Annulation appliquée à la réservation.",
      cancelLeft: "Analyse relancée : l'annulation reste à faire à la main.",
      /** The missing fields, listed after a colon by their labels: « champs encore manquants : téléphone et plaque ». */
      missing: (labels: string[]) =>
        `Analyse relancée, ${labels.length > 1 ? "champs encore manquants" : "champ encore manquant"} : ${
          labels.length > 1
            ? `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`
            : labels[0]
        }.`,
      refused: (reasons: string) =>
        `Analyse relancée. Réservation refusée à l'import : ${reasons}`,
      unsure:
        "Analyse relancée : la lecture reste incertaine, vérifiez chaque champ.",
      incomplete: "Analyse relancée : il manque encore des informations.",
      unrecognised:
        "Analyse relancée : ce mail n'est toujours pas reconnu comme une réservation.",
      /** 16/10/2026: recognised as another kind than a booking (« Annulation », « Autre mail »…), as the inbox says it. */
      notBooking: (kind: string) =>
        `Analyse relancée : mail reconnu (${kind}), rien n'est créé de lui-même.`,
      /** 16/10/2026: an Allopark modification recognised, its booking page still not read (the incident's mail). */
      pageNotRead:
        "Analyse relancée : modification Allopark reconnue, mais la page de la réservation n'a pas pu être lue : rien n'a changé.",
      /** 16/10/2026: Claude could not read it: the real cause, never « pas reconnu ». */
      outage: (cause: InboundReadingOutageCause) =>
        `Analyse relancée, mais Claude n'a pas pu lire ce mail (${readingOutageCause[cause]}) : Plazo le relira dès que la lecture fonctionne de nouveau.`,
    },
    /** 29/10/2026 (« pouvoir importer en collant le contenu du mail », direction A). */
    paste: {
      button: "Coller un mail",
      title: "Coller un mail",
      intro:
        "Ouvrez le mail du comparateur, sélectionnez tout son texte (Ctrl+A, ou ⌘A sur Mac), copiez-le et collez-le ici. Plazo le lit comme s'il l'avait reçu et suit ses liens (la page de la réservation Allopark).",
      subject: "Objet du mail",
      subjectHint: "facultatif, aide à le reconnaître",
      text: "Texte du mail",
      chars: (n: number) => `${n.toLocaleString("fr-FR")} caractère${n > 1 ? "s" : ""}`,
      /** 29/10/2026: the mail's links kept from the clipboard (Plazo follows them, the Allopark booking page first). */
      links: (n: number) => `${n} lien${n > 1 ? "s" : ""} du mail récupéré${n > 1 ? "s" : ""}`,
      cancel: "Annuler",
      submit: "Analyser ce mail",
      submitting: "Analyse en cours…",
      tooShort: "Collez le texte entier du mail : celui-ci est trop court.",
      waiting: "Mail ajouté à « À traiter » : vérifiez ce que Plazo a compris, puis « Compléter ».",
      by: (name: string | null) => (name ? `Collé par ${name}` : "Collé dans Plazo"),
      errors: {
        paste_limit: "Trop de mails collés cette heure-ci : réessayez dans un moment.",
        operator_inactive: "Ce compte est suspendu : aucun mail ne peut être ajouté.",
      } as Record<string, string>,
    },
    /** The refusals of « Relancer l'analyse » worded for this screen (`text_gone`, `analysis_running`: `fr.errors`). */
    errors: {
      already_imported: "Ce mail est déjà rattaché à une réservation.",
    } as Record<string, string>,
    back: "Réservations",
    backToList: "Retour",
  },
};

/** One line of a step: plain text with **bold** words, and an optional field to copy under it. */
export interface WizardLine {
  text: string;
  copy?: "sender" | "address";
}

export type MailProvider = MailProviderId;

/**
 * A (14/10/2026, « C puis A »; G-B of the 07/10/2026 before): « Relier votre boîte mail » on one page — the mail service
 * (detected by the server, or picked), its settings in blocks, each with the page to open, and « Ce que Plazo voit »,
 * ticked by what reaches the Plazo address.
 */
export const inboundWizardFr = {
  title: "Relier votre boîte mail",
  close: "Fermer",
  later: "Plus tard",
  copy: "Copier",
  copied: "Copié",
  preparing: "Préparation de votre adresse…",
  addressLabel: "Votre adresse Plazo",
  detected: (provider: string, email: string) =>
    `${provider}, détecté d'après ${email}`,
  change: "Changer",
  choose: {
    title: "Sur quelle messagerie recevez-vous les mails des comparateurs ?",
    legend: "Messagerie",
  },
  providers: {
    gmail: { label: "Gmail", hint: "Gmail ou Google Workspace" },
    outlook: { label: "Outlook", hint: "Outlook.com ou Microsoft 365" },
    ovh: { label: "OVH", hint: "Webmail OVH (Roundcube)" },
    other: { label: "Autre messagerie", hint: "Orange, Free, Ionos…" },
  } satisfies Record<MailProvider, { label: string; hint: string }>,
  lead: {
    gmail:
      "Trois réglages dans Gmail, sur un ordinateur : l'application Gmail ne crée pas de filtre. Chaque bouton ouvre Gmail à la bonne page, dans un nouvel onglet. Plazo coche chaque étape dès qu'il la voit.",
    outlook:
      "Une règle dans Outlook sur le web, sur un ordinateur. Plazo coche chaque étape dès qu'il la voit.",
    ovh: "Un filtre dans le webmail OVH, sur un ordinateur. Plazo coche chaque étape dès qu'il la voit.",
    other:
      "Une règle dans votre messagerie, sur un ordinateur. Plazo coche chaque étape dès qu'il la voit.",
  } satisfies Record<MailProvider, string>,
  state: { done: "Fait", waiting: "En attente" },
  open: {
    gmailForwarding: "Ouvrir Gmail · Transfert",
    gmailFilters: "Ouvrir Gmail · Filtres",
    outlook: "Ouvrir Outlook",
    outlookWork: "Ouvrir Outlook (Microsoft 365)",
  },
  gmail: {
    add: {
      title: "Ajouter l'adresse Plazo dans Gmail",
      lines: [
        {
          text: "Dans **Transfert et POP/IMAP**, cliquez **Ajouter une adresse de transfert** et collez votre adresse Plazo :",
          copy: "address",
        },
        {
          text: "**Suivant** › **Continuer** : Gmail envoie un code à Plazo, qui l'affiche ci-dessous. Collez-le dans Gmail et cliquez **Valider**.",
        },
      ] satisfies WizardLine[],
      waiting: "En attente du code de Gmail…",
      received: (when: string) => `Code de confirmation Gmail reçu ${when}`,
      requester: (email: string) => `Demandé par ${email}`,
      copyCode: "Copier le code",
      // 08/10/2026: Gmail's email no longer puts the code in its subject; its acceptance link confirms as well.
      openLink: "Confirmer par le lien",
      linkOnly:
        "Gmail n'a pas mis de code dans ce mail : confirmez par le lien.",
      workspace:
        "Google Workspace : si « Ajouter une adresse de transfert » n'apparaît pas, l'administrateur de votre domaine doit autoriser le transfert.",
    },
    filter: {
      title: "Créer le filtre des comparateurs",
      lines: [
        {
          text: "Dans **Filtres et adresses bloquées**, cliquez **Créer un filtre**. Dans **De**, collez les expéditeurs des comparateurs :",
          copy: "sender",
        },
        {
          text: "**Créer un filtre**, cochez **Transférer à** et choisissez votre adresse Plazo :",
          copy: "address",
        },
        { text: "Validez avec **Créer un filtre**." },
      ] satisfies WizardLine[],
      keepOff:
        "Dans **Transfert et POP/IMAP**, laissez **Désactiver le transfert** coché : sinon Gmail transfère tous vos mails à Plazo. Seul le filtre transfère, et uniquement les mails des comparateurs.",
      note: "L'adresse n'apparaît pas dans « Transférer à » ? Gmail doit d'abord la valider avec le code de l'étape 1.",
    },
  },
  rule: {
    outlook: {
      title: "Créer la règle dans Outlook",
      lines: [
        {
          text: "Dans Outlook sur le web, ouvrez la roue dentée › **Courrier** › **Règles** › **Ajouter une nouvelle règle**.",
        },
        {
          text: "Nommez-la « Plazo ». Condition : **De**, puis collez les expéditeurs des comparateurs (un par condition si Outlook le demande) :",
          copy: "sender",
        },
        {
          text: "Action : **Transférer à**, puis collez votre adresse Plazo :",
          copy: "address",
        },
        { text: "Cliquez **Enregistrer**." },
      ] satisfies WizardLine[],
      note: "Messagerie d'entreprise (Microsoft 365) : le transfert vers une adresse extérieure peut être bloqué. Si rien n'arrive, demandez à la personne qui gère la messagerie de l'autoriser.",
    },
    ovh: {
      title: "Créer le filtre dans le webmail OVH",
      lines: [
        {
          text: "Dans le webmail, ouvrez **Paramètres** › **Filtres**, puis **Créer** (+).",
        },
        {
          text: "Nom du filtre : « Plazo ». Règle : **De** contient, puis collez les expéditeurs des comparateurs (une règle par expéditeur si besoin) :",
          copy: "sender",
        },
        {
          text: "Action : **Envoyer une copie du message à**, puis collez votre adresse Plazo :",
          copy: "address",
        },
        { text: "Cliquez **Enregistrer**." },
      ] satisfies WizardLine[],
      note: "Choisissez bien « Envoyer une copie » : avec « Rediriger », le mail quitterait votre boîte.",
    },
    other: {
      title: "Créer la règle de transfert",
      lines: [
        {
          text: "Dans les réglages de votre messagerie, cherchez **Règles**, **Filtres** ou **Redirection**.",
        },
        {
          text: "Condition : l'expéditeur est l'un des comparateurs :",
          copy: "sender",
        },
        {
          text: "Action : transférer une copie à votre adresse Plazo :",
          copy: "address",
        },
        { text: "Enregistrez, en gardant le mail dans votre boîte." },
      ] satisfies WizardLine[],
      note: "Vous ne trouvez pas ? Envoyez ces étapes à la personne qui gère votre messagerie, avec le lien en bas de cette fenêtre.",
    },
  } satisfies Record<
    Exclude<MailProvider, "gmail">,
    { title: string; lines: WizardLine[]; note: string }
  >,
  test: {
    title: "Tester avec un ancien mail",
    lines: [
      {
        text: "Transférez à la main une ancienne confirmation d'un comparateur à votre adresse Plazo :",
        copy: "address",
      },
      { text: "Elle doit devenir une réservation en quelques secondes." },
    ] satisfies WizardLine[],
    ok: "C'est relié. Les prochaines réservations des comparateurs arriveront toutes seules dans le planning.",
    toCheck:
      "Bien reçu. Plazo n'a pas pu le lire en entier : il attend dans « À vérifier », où vous pouvez le compléter.",
    openToCheck: "Voir les mails à vérifier",
  },
  seen: {
    title: "Ce que Plazo voit",
    live: "En direct",
    confirmation: "Gmail connaît l'adresse Plazo",
    confirmationAt: (when: string) => `Code de confirmation reçu ${when}`,
    comparator: "Mail d'un comparateur arrivé seul",
    comparatorWaiting:
      "Coché dès qu'un mail d'Allopark, Onepark, Parclick ou ParkMundo arrive sans être transféré à la main.",
    comparatorAt: (provider: string, when: string) => `${provider} · ${when}`,
    booking: "Une réservation créée",
    bookingWaiting: "La preuve que tout fonctionne de bout en bout.",
    bookingAt: (when: string) => `La dernière ${when}`,
    recent: "Derniers mails reçus",
    none: "Aucun mail reçu pour l'instant.",
    status: {
      imported: "Enregistrée",
      duplicate: "Déjà connue",
      incomplete: "Incomplet",
      unrecognised: "Non reconnu",
      dismissed: "Classé",
      handled: "Traité",
      archived: "Archivé",
      forwarding: "Code Gmail",
      ignored: "Écarté",
    } satisfies Record<InboundEmailStatus, string>,
  },
  unexpected: {
    gmail:
      "Dans Gmail › Transfert et POP/IMAP, cochez « Désactiver le transfert ».",
    other: "Dans votre messagerie, ne gardez que la règle des comparateurs.",
  },
  done: {
    gmail: "J'ai créé le filtre",
    outlook: "J'ai créé la règle",
    ovh: "J'ai créé le filtre",
    other: "J'ai créé la règle",
  } satisfies Record<MailProvider, string>,
  share: {
    link: "Envoyer ces étapes à la personne qui gère notre messagerie",
    subject: "Relier notre boîte mail à Plazo",
    intro:
      "Bonjour,\n\nPour que nos réservations des comparateurs (Allopark, Onepark, Parclick, ParkMundo…) arrivent toutes seules dans Plazo, pourrais-tu créer une règle de transfert dans notre messagerie ?",
    sender: (address: string) => `Expéditeurs : ${address}`,
    address: (address: string) => `Transférer une copie à : ${address}`,
    gmailCode:
      "Gmail envoie alors un code de confirmation à Plazo : je te le transmets dès qu'il s'affiche. Une fois l'adresse validée, laisse « Désactiver le transfert » coché dans Transfert et POP/IMAP : seul le filtre transfère.",
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

/** The Plazo ↔ operator contract (20/10/2026, « Pouvoir stocker le contrat à faire signer », choice 2a). */
export const contractFr = {
  // Plateforme › Loueurs
  column: "Contrat",
  none: "Aucun",
  pendingPill: (v: number) => `À signer · v${v}`,
  signedPill: (v: number) => `Signé · v${v}`,
  manage: "Contrat",
  hide: "Fermer",
  cardTitle: (name: string) => `Contrat de ${name}`,
  status: {
    pending: "En attente de signature",
    signed: "Signé",
    superseded: "Remplacé",
  } as Record<string, string>,
  fileLine: (name: string, size: string, date: string, by: string | null) =>
    `${name} · ${size} · déposé le ${date}${by ? ` par ${by}` : ""}`,
  view: "Voir le PDF",
  replace: "Remplacer",
  remove: "Retirer",
  removeConfirm: (v: number) =>
    `Retirer la version ${v} ? Le gérant ne la verra plus. Ce contrat n'a pas été signé.`,
  removeTitle: "Retirer ce contrat",
  removed: "Contrat retiré.",
  signerExpected: "Signataire attendu",
  signerExpectedValue: "Un gérant du parking",
  notified: "Prévenu",
  notifiedValue: (date: string) => `par e-mail · ${date}`,
  notNotified: "pas encore (e-mails non configurés ?)",
  reminder: "Relance",
  remind: "Renvoyer l'e-mail",
  reminded: "E-mail renvoyé aux gérants.",
  history: "Historique",
  historyLine: (c: { version: number; status: string }) =>
    c.status === "signed"
      ? `v${c.version} signée`
      : c.status === "pending"
        ? `v${c.version} déposée, en attente de signature`
        : `v${c.version} remplacée avant signature`,
  signedBy: (name: string) => `par ${name}`,
  signedPdf: "PDF signé",
  proof: "Preuve",
  dropTitle: "Déposer un nouveau contrat",
  dropHint:
    "PDF de 4 Mo au plus. Les gérants sont prévenus par e-mail et le signent depuis leur espace pro ; une version en attente est remplacée, une version signée reste dans l'historique.",
  titleLabel: "Titre (facultatif)",
  titlePlaceholder: `Contrat de partenariat ${PRODUCT.name}`,
  choose: "Choisir un PDF",
  uploading: "Envoi…",
  uploaded: (v: number) => `Version ${v} déposée : les gérants sont prévenus.`,
  empty: "Aucun contrat déposé pour ce loueur.",
  loadError: "Impossible de lire les contrats.",
  fileErrors: {
    empty: "Le fichier est vide.",
    too_large: "Le PDF dépasse 4 Mo.",
    not_a_pdf: "Ce fichier n'est pas un PDF.",
    pdf_encrypted:
      "Ce PDF est protégé par un mot de passe : déposez une version sans protection.",
    pdf_unreadable: "Ce PDF est illisible.",
    payload_too_large: "Le PDF dépasse 4 Mo.",
  } as Record<string, string>,

  // Gérant : bandeau et page « Mon contrat »
  banner: (product: string) => `Votre contrat ${product} est prêt à signer.`,
  bannerAction: "Le lire et le signer",
  pageTitle: "Mon contrat",
  noneYet: (product: string) =>
    `${product} n'a pas encore déposé de contrat pour votre parking. Vous serez prévenu par e-mail.`,
  download: "Télécharger le PDF",
  previewTitle: "Aperçu du contrat",
  previewLoading: "Chargement du contrat…",
  previewFallback: "L'aperçu ne s'affiche pas dans ce navigateur :",
  signTitle: "Signer le contrat",
  depositedBy: (product: string, date: string) =>
    `Déposé par ${product} le ${date}. Seul un gérant du parking peut le signer.`,
  nameLabel: "Votre nom complet, comme signature",
  acceptLabel: (operator: string) =>
    `J'ai lu le contrat en entier et je l'accepte au nom de ${operator}. « Lu et approuvé ».`,
  sign: "Signer le contrat",
  signing: "Signature…",
  signConfirm: (name: string) =>
    `Vous signez ce contrat au nom de votre parking, sous le nom « ${name} ». Cette signature vous engage.`,
  signConfirmTitle: "Signer le contrat",
  signedToast: "Contrat signé. Une copie part par e-mail.",
  proofNote: `${PRODUCT.name} garde votre nom, la date et l'heure, votre adresse IP, votre navigateur et l'empreinte du PDF signé.`,
  viewAsNote:
    "En consultation, la plateforme lit le contrat mais ne le signe pas : seul un gérant du parking le peut.",
  signErrors: {
    required: "Tapez votre nom complet.",
    full_name: "Tapez votre prénom et votre nom.",
    too_long: "Nom trop long.",
  } as Record<string, string>,
  signedBadge: "Signé",
  signedLine: (date: string, name: string) => `Signé le ${date} par ${name}`,
  proofRows: {
    typedName: "Nom tapé",
    mention: "Mention",
    mentionValue: "« J'ai lu le contrat en entier et je l'accepte » cochée",
    date: "Date et heure (Paris)",
    ip: "Adresse IP",
    hash: "Empreinte du PDF signé (SHA-256)",
    originalHash: "Empreinte du contrat déposé (SHA-256)",
    deposited: "Déposé par",
  },
  downloadSigned: "Télécharger le PDF signé",
  downloadProof: "Télécharger la preuve de signature",
  signedNote: `Le PDF signé est le contrat d'origine, plus une dernière page « Signature » avec ces informations. ${PRODUCT.name} garde les deux ; personne ne peut les modifier.`,
  previous: "Versions précédentes",
};

// The parking's own contract (26/10/2026, choice A « Mon PDF ») and the register of the signed contracts (R-A).
/** « Mails liés » of a booking (27/10/2026, direction C). */
export const linkedEmailsFr = {
  title: (n: number) => `Mails liés · ${n}`,
  role: {
    created: "À l'origine",
    change: "Modification",
    cancellation: "Annulation",
    duplicate: "Doublon",
    linked: "Rattaché",
  },
  view: "Voir",
  close: "Fermer",
  openInbox: "Ouvrir dans la Boîte de réception",
  leftInbox: "Ce mail n'est plus listé dans la Boîte de réception.",
  textGone: "Texte effacé 30 jours après la réception.",
  dialog: "Mail lié à la réservation",
};

/** « Placer les informations » (30/10/2026, direction A): the fields stamped on the parking's PDF. */
export const contractFieldsFr = {
  crumb: "Réglages du parking",
  title: "Placer les informations",
  subtitle: (title: string, v: number) => `${title} · version ${v}`,
  intro:
    "Glissez chaque information à l'endroit prévu sur votre contrat (les pointillés). Plazo la remplit sur chaque contrat : avant la signature avec les données de la réservation, puis avec la date et la signature une fois signé.",
  palette: "Informations à placer",
  paletteHint: "Glissez-les sur la page, ou touchez-les pour les poser au milieu.",
  keys: {
    customer_name: "Nom du client",
    phone: "Téléphone",
    plate: "Immatriculation",
    vehicle: "Véhicule",
    arrival_at: "Date et heure de dépôt",
    return_at: "Date et heure de retour",
    price: "Prix payé",
    reference: "Référence",
    return_flight: "Vol retour",
    departure_flight: "Vol aller",
    travel: "Vol ou train",
    mileage: "Kilométrage au dépôt",
    signed_on: "Fait le (date de signature)",
    signature: "Signature",
  } as Record<string, string>,
  samples: {
    customer_name: "Claire Martin",
    phone: "06 12 34 56 78",
    plate: "GH-456-JK",
    vehicle: "Renault Zoé blanche",
    arrival_at: "12/11/2026 08:00",
    return_at: "19/11/2026 18:30",
    price: "54,00 €",
    reference: "R7KQ2M",
    return_flight: "TO 3627",
    departure_flight: "TO 3626",
    travel: "Aller TO 3626 · Retour TO 3627",
    mileage: "48 210 km",
    signed_on: "12/11/2026",
    signature: "Signature du client",
  } as Record<string, string>,
  page: (n: number, total: number) => `Page ${n} / ${total}`,
  previousPage: "Page précédente",
  nextPage: "Page suivante",
  selected: "Information choisie",
  size: "Taille du texte",
  remove: "Retirer",
  removeAria: (label: string) => `Retirer « ${label} »`,
  placedCount: (n: number) =>
    n === 0 ? "Aucune information placée" : n === 1 ? "1 information placée" : `${n} informations placées`,
  save: "Enregistrer",
  saving: "Enregistrement…",
  saved: "Informations enregistrées : vos prochains contrats sont pré-remplis.",
  preview: "Aperçu avec un exemple",
  previewing: "Préparation…",
  loading: "Chargement du PDF…",
  loadError: "Impossible d'ouvrir le PDF.",
  noTemplate: "Déposez d'abord votre contrat en PDF dans Réglages du parking.",
  errors: {
    template_retired: "Cette version n'est plus en vigueur : rouvrez la version actuelle.",
    invalid_box: "Une information sort de la page : replacez-la.",
    too_many: "40 informations au plus.",
  } as Record<string, string>,
};

export const contractTemplateFr = {
  title: "Contrat de stationnement",
  intro:
    "Le contrat que vos clients signent au comptoir, le jour du dépôt (code SMS ou signature à la main). Déposez le vôtre en PDF : chaque signature garde ce PDF tel quel, plus une page « Réservation et signature » avec les données du client et la preuve.",
  plazoTemplate: `Modèle ${PRODUCT.name}`,
  plazoTemplateHint: `Sans PDF, vos clients signent le modèle ${PRODUCT.name} (objet, clés, état des lieux, dommages, objets personnels, annulation, données, signature).`,
  inForce: "En vigueur",
  current: (title: string, v: number) => `${title} · version ${v}`,
  fileLine: (
    name: string,
    pages: number,
    size: string,
    date: string,
    by: string | null,
  ) =>
    `${name} · ${pages} page${pages > 1 ? "s" : ""} · ${size} · déposé le ${date}${by ? ` par ${by}` : ""}`,
  signedCount: (n: number) =>
    n === 0
      ? "aucun contrat signé sur cette version"
      : n === 1
        ? "1 contrat signé"
        : `${n} contrats signés`,
  plazoSignedCount: (n: number) =>
    n === 0
      ? ""
      : n === 1
        ? `1 contrat signé sur le modèle ${PRODUCT.name}`
        : `${n} contrats signés sur le modèle ${PRODUCT.name}`,
  view: "Voir le PDF",
  placeFields: "Placer les informations",
  fieldsLine: (n: number) =>
    n === 0
      ? "Pas encore pré-rempli : placez le nom, la plaque, les dates et la date de signature sur votre PDF."
      : `Pré-rempli : ${n} information${n > 1 ? "s" : ""} placée${n > 1 ? "s" : ""} sur le PDF.`,
  replace: "Remplacer",
  upload: "Déposer mon PDF",
  choose: "Choisir un PDF",
  uploading: "Envoi…",
  titleLabel: "Titre du contrat (facultatif)",
  titlePlaceholder: "Contrat de stationnement",
  hint: "PDF de 4 Mo au plus, sans mot de passe. Il s'applique aux signatures à venir ; les contrats déjà signés gardent leur version.",
  uploaded: (v: number) =>
    `Version ${v} en vigueur : vos clients la signent dès maintenant.`,
  revert: `Revenir au modèle ${PRODUCT.name}`,
  revertConfirm: (v: number) =>
    `Retirer la version ${v} ? Vos clients signeront le modèle ${PRODUCT.name} ; les contrats déjà signés sur cette version sont gardés.`,
  revertTitle: `Revenir au modèle ${PRODUCT.name}`,
  reverted: `Vos clients signent de nouveau le modèle ${PRODUCT.name}.`,
  history: "Versions précédentes",
  historyLine: (v: number, title: string, from: string, to: string) =>
    `v${v} · ${title} · du ${from} au ${to}`,
  loadError: "Impossible de lire le contrat.",
  storageUnavailable:
    "Le stockage des fichiers n'est pas configuré : le dépôt d'un PDF est indisponible.",
  fileErrors: {
    empty: "Le fichier est vide.",
    too_large: "Le PDF dépasse 4 Mo.",
    not_a_pdf: "Ce fichier n'est pas un PDF.",
    pdf_encrypted:
      "Ce PDF est protégé par un mot de passe : déposez une version sans protection.",
    pdf_unreadable: "Ce PDF est illisible.",
    payload_too_large: "Le PDF dépasse 4 Mo.",
    photos_unavailable: "Le stockage des fichiers n'est pas configuré.",
    demo_read_only: "Indisponible dans la démo.",
  } as Record<string, string>,
  register: "Tous les contrats signés",
  // Page « Contrats »
  page: {
    title: "Contrats signés",
    intro:
      "Chaque contrat tel que signé, avec sa preuve. Les contrats sont gardés avec la réservation, puis effacés à son anonymisation.",
    signed: (n: number) => `Signés · ${n}`,
    reserved: (n: number) => `Avec réserve · ${n}`,
    searchAria: "Trouver un contrat",
    searchPlaceholder: "Plaque, nom, référence…",
    from: "Du",
    to: "au",
    apply: "Afficher",
    export: "Exporter en CSV",
    exported: "Export téléchargé.",
    empty: "Aucun contrat signé sur cette période.",
    columns: {
      signedAt: "Signé le",
      customer: "Client",
      plate: "Plaque",
      stay: "Séjour",
      method: "Moyen",
      version: "Version",
      proof: "Preuve",
      files: "Fichiers",
    },
    method: {
      sms_code: "Code SMS",
      handwritten: "À la main",
      booking_link: "Lien",
    } as Record<string, string>,
    methodWith: (how: string, witness: string | null) =>
      witness ? `${how} · ${witness}` : how,
    version: (v: string, template: number | null) =>
      template ? `PDF v${template}` : `${PRODUCT.name} ${v}`,
    reservedPill: "réserve au retour",
    signedPdf: "PDF signé",
    proof: "Preuve",
    templatePdf: "Contrat du parking",
    noFiles: "texte signé seulement",
    pageOf: (page: number, total: number) => `Page ${page} / ${total}`,
    previous: "Précédent",
    next: "Suivant",
    shown: (n: number, total: number) =>
      n === total
        ? `${total} contrat${total > 1 ? "s" : ""}`
        : `${n} sur ${total}`,
  },
  // Bloc « Contrat de stationnement » de la fiche réservation
  booking: {
    title: "Contrat de stationnement",
    signed: "Signé",
    unsigned: "Pas encore signé",
    atCounter:
      "Se signe au comptoir le jour du dépôt, dans l'application Plazo Pro.",
    closed: "Non signé (la réservation est passée).",
    signedLine: (date: string, how: string) => `Signé le ${date} · ${how}`,
    how: {
      sms_code: (phone: string | null) =>
        `code SMS${phone ? ` (${phone})` : ""}`,
      handwritten: () => "signature à la main",
      booking_link: () => "lien de réservation",
    } as Record<string, (phone: string | null) => string>,
    version: (
      v: string,
      template: { title: string; version: number } | null,
    ) =>
      template
        ? `${template.title} · PDF v${template.version}`
        : `Modèle ${PRODUCT.name} ${v}`,
    willSign: (template: { title: string; version: number } | null) =>
      template
        ? `Le client signera « ${template.title} » (version ${template.version}).`
        : `Le client signera le modèle ${PRODUCT.name}.`,
    proof: (sha: string) => `Empreinte ${sha.slice(0, 16)}…`,
  },
};

// Services for the car (21/10/2026): the parking's offer (Parking › Réglages) and the orders on a booking.
export const extrasFr = {
  settings: {
    title: "Services additionnels",
    intro:
      "Vos clients les commandent dans l'app Plazo, avec leur réservation ou plus tard, même après avoir déposé leur voiture. Ils les paient en ligne.",
    offered: (label: string) => `Proposer : ${label}`,
    priceLabel: (label: string) => `Prix : ${label}`,
    defaultPrice: (price: string) => `Prix conseillé : ${price}`,
    leadHours: "Commande possible jusqu'à",
    leadHoursUnit: "h avant le retour",
    commission:
      "Commission Plazo prise sur chaque service, comme sur les séjours. Votre part vous est reversée avec la réservation, une fois le service fait.",
    refundNote:
      "Un service pas fait au moment de rendre la voiture est remboursé au client.",
    save: "Enregistrer",
    saved: "Services enregistrés",
    errors: {
      price: "Montant invalide (ex. 50,00).",
      range: "Entre 1 € et 1 000 €.",
      leadHours: "Entre 0 et 168 heures.",
    },
  },
  orders: {
    title: "Services commandés",
    toDoCount: (n: number) => `${n} à faire`,
    paidWithBooking: "payé avec la réservation",
    paidOn: (when: string) => `payé le ${when}`,
    status: {
      ordered: "À faire",
      done: "Fait",
      refused: "Pas possible · remboursé",
      refunded: "Remboursé",
    },
    doneLine: (when: string, by: string | null) =>
      `Fait ${when}${by ? ` par ${by}` : ""}`,
    refusedLine: (reason: string | null) =>
      reason ? `Motif : ${reason}` : "Remboursé au client",
    done: "Fait",
    accept: "Accepter",
    acceptedLine: (when: string, by: string | null) =>
      `Accepté ${when}${by ? ` par ${by}` : ""} · le client est prévenu`,
    acceptedToast: "Service accepté : le client est prévenu.",
    refuse: "Pas possible",
    reasonLabel: "Pourquoi ? (facultatif)",
    reasonPlaceholder: "Borne en panne, câble absent…",
    confirmRefuse: "Rembourser le client",
    cancel: "Annuler",
    doneToast: "Service marqué fait : le client est prévenu.",
    refusedToast: "Service remboursé au client.",
    hint: "Pas possible : le client est remboursé tout de suite.",
    errors: {
      not_to_do: "Ce service n'est plus à faire.",
      refund_failed: "Le remboursement n'a pas abouti, réessayez.",
    } as Record<string, string>,
  },
  // 29/10/2026 (A): « Services à faire », sorted by « à faire avant » (one hour before the expected return).
  board: {
    link: "Services à faire",
    title: "Services à faire",
    crumb: "Réservations › Services à faire",
    intro:
      "Les services commandés par vos clients sur Plazo, à faire une heure avant leur retour (l'atterrissage quand le vol est suivi). Le client reçoit une notification quand vous acceptez, quand c'est fait ou si ce n'est pas possible.",
    tabs: { todo: "À faire", done: "Faits aujourd'hui", refused: "Pas possibles" } as Record<string, string>,
    columns: { due: "À faire avant", service: "Service", client: "Client · voiture", place: "Place", paid: "Payé" },
    late: "En retard",
    today: "Aujourd'hui",
    tomorrow: "Demain",
    later: "Plus tard",
    returnLine: (time: string) => `retour ${time}`,
    flightLine: (flight: string, time: string) => `vol ${flight} · atterrit ${time}`,
    overdue: "dépassé",
    inLine: (text: string) => `dans ${text}`,
    file: (code: string, rank: number | null) => (rank ? `File ${code} · ${rank === 1 ? "1re" : `${rank}e`}` : `File ${code}`),
    spot: (code: string) => `Place ${code}`,
    noPlace: "Pas encore rangée",
    accepted: (by: string | null) => (by ? `Accepté par ${by}` : "Accepté"),
    doneAt: (time: string, by: string | null) => `Fait à ${time}${by ? ` par ${by}` : ""}`,
    refusedAt: (when: string, reason: string | null) => `${when}${reason ? ` · ${reason}` : ""} · remboursé`,
    empty: {
      todo: "Aucun service à faire. Les commandes de vos clients arriveront ici.",
      done: "Aucun service fait aujourd'hui.",
      refused: "Aucun service refusé ces 7 derniers jours.",
    } as Record<string, string>,
    loadError: "Les services n'ont pas pu être chargés.",
  },
};

// Import of old (and upcoming) bookings from a file (28/10/2026, direction A).
export const bookingImportFr = {
  link: "Importer",
  title: "Importer des réservations",
  crumb: "Réservations › Importer",
  intro:
    "Déposez un fichier Excel (.xlsx) ou CSV de vos réservations, passées ou à venir. Plazo reconnaît les colonnes, puis montre ce que donne chaque ligne. Rien n'est créé avant « Importer », et aucun message ne part : ni SMS, ni mail, ni notification.",
  drop: "Déposez votre fichier ici, ou",
  choose: "Choisir un fichier",
  change: "Changer de fichier",
  lines: (n: number) => `${n} ligne${n > 1 ? "s" : ""}`,
  sheet: "Feuille",
  firstRow: "première ligne = titres des colonnes",
  columns: "Colonnes reconnues · choisissez pour corriger",
  ignored: "ignorée",
  missing: (fields: string[]) => `Choisissez la colonne : ${fields.join(", ")}.`,
  reading: "Lecture des lignes…",
  monthFirst: "Dates lues au format mois/jour/année, comme dans un fichier américain : « 11/20/2026 » est le 20 novembre 2026.",
  fields: {
    name: "Nom (complet)",
    firstName: "Prénom",
    lastName: "Nom",
    phone: "Téléphone",
    email: "E-mail",
    plate: "Plaque",
    arrivalDate: "Arrivée (date)",
    arrivalTime: "Arrivée (heure)",
    returnDate: "Départ (date)",
    returnTime: "Départ (heure)",
    returnFlight: "Vol (ou train) retour",
    departureFlight: "Vol (ou train) aller",
    passengers: "Passagers",
    price: "Prix payé",
    channel: "Canal",
    reference: "Référence",
    status: "Statut",
    bookedAt: "Réservée le",
    vehicle: "Véhicule",
    notes: "Notes",
    handover: "Prise en charge",
    commission: "Commission",
    payment: "Payé par",
    destination: "Destination",
  } as Record<string, string>,
  required: { name: "Nom", arrivalDate: "Arrivée", returnDate: "Départ" } as Record<string, string>,
  filters: {
    all: "Toutes",
    create: "À créer",
    check: "À vérifier",
    duplicate: "Déjà dans Plazo",
    error: "Erreur",
  },
  columnsTable: { line: "Ligne", state: "État", client: "Client", plate: "Plaque", arrival: "Arrivée", departure: "Départ", channel: "Canal", price: "Prix" },
  timing: { past: "Séjour passé", current: "En cours", future: "À venir" },
  sameReference: (ref: string) => `Déjà dans Plazo : ${ref}`,
  sameLine: (line: number) => `Comme la ligne ${line}`,
  errors: {
    name_missing: "Nom manquant",
    arrival_missing: "Date d'arrivée manquante",
    arrival_invalid: "Date d'arrivée illisible",
    return_missing: "Date de départ manquante",
    return_invalid: "Date de départ illisible",
    return_before_arrival: "Départ avant l'arrivée",
    stay_too_long: "Séjour de plus d'un an",
  } as Record<string, string>,
  warnings: {
    no_phone: "Pas de téléphone",
    plate_unreadable: "Plaque illisible, laissée vide",
    flight_unreadable: "Vol illisible, mis dans les notes",
    price_unreadable: "Prix illisible, laissé vide",
    commission_unreadable: "Commission illisible, taux du comparateur appliqué",
    handover_unreadable: "Service non reconnu, navette par défaut",
    payment_unreadable: "Moyen de paiement non reconnu, laissé vide",
    email_not_traveller: "Adresse du comparateur, pas celle du client : e-mail laissé vide",
    passengers_unreadable: "Passagers illisibles, 1 par défaut",
    booked_at_unreadable: "Date de réservation illisible",
    full_night: "Nuit déjà complète",
  } as Record<string, string>,
  more: (n: number) => `Afficher ${n} lignes de plus`,
  footnote:
    "Les doublons et les lignes en erreur sont laissés de côté. Séjours passés : « Rendu ». En cours : « Sur place ». À venir : « Attendu », sans SMS de la veille (rétablissable). Sans heure : arrivée à 08:00, départ à 18:00.",
  cancel: "Annuler",
  importN: (n: number) => `Importer ${n} réservation${n > 1 ? "s" : ""}`,
  confirmTitle: (n: number) => `Importer ${n} réservation${n > 1 ? "s" : ""} ?`,
  confirmText: "Elles apparaîtront dans le planning, les réservations et le chiffre d'affaires. Chacune garde le nom du fichier : vous pourrez retirer cet import plus tard.",
  confirm: "Importer",
  done: (n: number) => `${n} réservation${n > 1 ? "s" : ""} importée${n > 1 ? "s" : ""}.`,
  seeReservations: "Voir les réservations",
  recent: "Imports récents",
  recentLine: (n: number, when: string, by: string | null) => `${n} réservation${n > 1 ? "s" : ""} · ${when}${by ? ` · ${by}` : ""}`,
  removed: (n: number) => `retiré (${n} supprimée${n > 1 ? "s" : ""})`,
  undo: "Retirer cet import",
  undoTitle: "Retirer cet import ?",
  undoText: "Les réservations de cet import que personne n'a modifiées depuis seront supprimées. Les autres restent.",
  undoConfirm: "Retirer",
  undone: (removed: number, kept: number) =>
    `${removed} réservation${removed > 1 ? "s" : ""} retirée${removed > 1 ? "s" : ""}${kept ? `, ${kept} gardée${kept > 1 ? "s" : ""} (modifiées depuis)` : ""}.`,
  fileErrors: {
    not_a_workbook: "Ce fichier Excel n'a pas pu être lu. Enregistrez-le en .xlsx ou en CSV, puis réessayez.",
    old_excel: "Les fichiers .xls (ancien Excel) ne sont pas lus : enregistrez-le en .xlsx ou en CSV.",
    empty: "Ce fichier ne contient aucune ligne sous les titres.",
  } as Record<string, string>,
  apiErrors: {
    too_many_rows: "2 000 lignes au plus par import : coupez le fichier en plusieurs.",
    already_undone: "Cet import a déjà été retiré.",
    undo_expired: "Cet import ne peut plus être retiré.",
  } as Record<string, string>,
};
