// Shapes returned by the backend (names follow the API).
import type { ChildSeats } from "./child-seats";

export type { ChildSeats };

export type StaffRole = "manager" | "agent" | "driver" | "valet";

export interface TokenObj {
  token: string;
  expires: string;
}

export interface TokenData {
  access: TokenObj;
  refresh: TokenObj;
}

export interface Staff {
  id: string;
  operatorId: string;
  email: string;
  /** First and last name (06/10/2026); `name` is the display form "Prénom Nom". */
  firstName?: string;
  lastName?: string;
  name: string;
  phone: string | null;
  role: StaffRole;
  isActive: boolean;
  lastLoginAt: string | null;
  /** The post held today (R-C, chosen in the app); null until chosen. */
  post?: StaffRole | null;
  postSetAt?: string | null;
  effectivePost?: StaffRole;
  /** The shuttle taken for the day (V-A), null when none. */
  vehicle?: {
    id: string;
    model: string;
    colour: string | null;
    plate: string | null;
    seats: number | null;
  } | null;
  createdAt: string;
  operatorName?: string;
  /** Platform owner (PLATFORM_ADMIN_EMAILS): sees the "Plateforme" space. */
  isPlatformAdmin?: boolean;
  /** False until a self sign-up confirms its email (the listing cannot be sent for review before). */
  emailVerified?: boolean;
  /** Set while a platform admin views an operator's space ("Ouvrir son espace"). */
  /** platformAccount: the platform's own account (« Plazo (tests) »), whose team can be managed in consultation. */
  viewAs?: { operatorId: string; operatorName: string; platformAccount?: boolean } | null;
  /** Team list (13/10/2026): how the member signs in to Plazo Pro (missing from an older API). */
  signIn?: SignInMethod[];
  /** Session user (13/10/2026): whether a usable password is set, and the linked Apple / Google identities. */
  hasPassword?: boolean;
  identities?: { provider: IdentityProvider; email: string | null }[];
  /** 21/10/2026: set inside the prospects' demo (« Parking des Cèdres »), with its next nightly reset. */
  demo?: { resetsAt: string } | null;
}

/** 13/10/2026: Plazo Pro can be signed in to with Apple (iPhone) or Google (Android). */
export type IdentityProvider = "apple" | "google";
export type SignInMethod = "password" | IdentityProvider;

/** GET /internal/auth/providers (googleClientId: 22/10/2026, absent from an older API). */
export interface AuthProviders {
  apple: boolean;
  google: boolean;
  googleClientId?: string | null;
}

/** POST /internal/auth/google: a member signed in, or a Google account in no team yet (onboarding, Plazo Pro only). */
export type IdentitySignIn =
  | { status: "signed_in"; tokenData: TokenData; user: Staff }
  | { status: "onboarding"; onboardingToken: string };

/** The roles a person can be given when a manager accepts their request (never « Gérant »). */
export type JoinRole = Exclude<StaffRole, "manager">;

/** GET /internal/staff/join-code: today's code of the operator, changing by itself at local midnight. */
export interface JoinCode {
  /** « K7QM2-XP9TD » */
  code: string;
  /** Local day of the operator's first parking (YYYY-MM-DD). */
  day: string;
  validUntil: string;
  operatorName: string;
  /** False for a demo, suspended or archived operator: the API refuses its code (absent from an older API). */
  accepting?: boolean;
}

/** A pending request to join the team (GET /internal/staff/join-requests). */
export interface JoinRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** An Apple « Masquer mon adresse » relay address. */
  isPrivateEmail: boolean;
  provider: IdentityProvider;
  wishedRole: JoinRole;
  createdAt: string;
  expiresAt: string;
}

export type JoinRequestStatus = "pending" | "accepted" | "refused" | "cancelled" | "expired";

/** A request as its author sees it (answer of the refusal). */
export interface JoinRequestView {
  id: string;
  status: JoinRequestStatus;
  operatorName: string;
  firstName: string;
  lastName: string;
  wishedRole: JoinRole;
  role: JoinRole | null;
  createdAt: string;
  decidedAt: string | null;
  expiresAt: string;
}

export interface Parking {
  id: string;
  name: string;
  address: string | null;
  timezone: string;
  totalCapacity: number;
  safetyMarginPct: number;
  shuttleTravelMinutes: number;
  /** Shuttle waves (V-A, 05/10/2026). */
  terminalLeadMinutes: number;
  landingDelayMinutes: number;
  /** R-B (07/10/2026): who sees the position of the shuttles. */
  shuttleTracking: ShuttleTracking;
  /**
   * 09/10/2026: `totalCapacity` and `declaredCapacity` are the figure typed by the operator;
   * `effectiveCapacity` is the one used everywhere (the plan's files, else its active spots, else
   * the declared figure) and `bookableCapacity` is taken from it.
   */
  declaredCapacity: number;
  effectiveCapacity: number;
  capacitySource: CapacitySource;
  bookableCapacity: number;
  /** The parking's position (its address's when not placed), null when unknown. */
  lat: number | null;
  lng: number | null;
}

/** R-B (07/10/2026): nobody (the drivers do not share it), the team only, or the team and the travellers. */
export type ShuttleTracking = "off" | "team" | "everyone";

/** Where the capacity used everywhere comes from (09/10/2026). */
export type CapacitySource = "files" | "spots" | "declared";

export interface ParkingSettings {
  name: string;
  address: string | null;
  totalCapacity: number;
  safetyMarginPct: number;
  shuttleTravelMinutes: number;
  terminalLeadMinutes?: number;
  landingDelayMinutes?: number;
}

export interface NewStaff {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  password: string;
}

export type ReservationStatus =
  | "upcoming"
  | "arrived"
  | "shuttled_out"
  | "return_requested"
  | "back_at_parking"
  | "returned"
  | "cancelled"
  | "no_show";
export type ReservationChannel =
  | "website"
  | "phone"
  | "counter"
  | "aggregator"
  | "import"
  | "plazo";

export interface Reservation {
  id: string;
  /** What the comparator takes and what the operator keeps (managers only; 19/10/2026). */
  commission?: ReservationCommission | null;
  commissionOverrideBp?: number | null;
  commissionOverrideCents?: number | null;
  reference: string;
  parkingId: string;
  channel: ReservationChannel;
  channelDetail: string | null;
  status: ReservationStatus;
  /** Online payments only (Plazo bookings); a refunded booking cannot be reopened. */
  paymentStatus?: "pending" | "paid" | "expired" | "refunded" | null;
  arrivalAt: string;
  returnAt: string;
  passengers: number;
  /** The display form "Prénom Nom", recomputed by the server (09/10/2026: first and last name apart; missing from an older API). */
  customerName: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone: string;
  customerEmail: string | null;
  plate: string;
  returnFlight: string | null;
  /** Outbound flight (V-A) and its tracking. */
  departureFlight: string | null;
  departureStatus: string | null;
  departureScheduledAt: string | null;
  departureEstimatedAt: string | null;
  departureTerminal: string | null;
  notes: string | null;
  /** E (06/10/2026): the traveller's message for the parking, their vehicle, and today's return notice. */
  customerNote?: string | null;
  vehicleModel?: string | null;
  vehicleColour?: string | null;
  returnNoticeKind?: ReturnNoticeKind | null;
  returnNoticeText?: string | null;
  returnNoticeAt?: string | null;
  externalReference: string | null;
  priceCents: number | null;
  /** What the traveller was charged online (Plazo bookings). */
  chargedCents?: number | null;
  /**
   * Night fees (12/10/2026): the « Dépôt de nuit » and « Retour de nuit » fees a Plazo booking was charged, frozen at
   * booking and included in `priceCents`; null when none (and always for staff bookings and imports).
   */
  nightArrivalFeeCents?: number | null;
  nightReturnFeeCents?: number | null;
  overbooked: boolean;
  /** Terms accepted by the traveller (bookings made on the public site only). */
  cancellationPolicy: CancellationPolicy | null;
  arrivedAt: string | null;
  returnedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  /** The statuses this staff member may set next (served by GET /internal/reservations/:id, 06/10/2026). */
  nextStatuses?: ReservationStatus[];
  /** Return flight tracking (bloc 3), on the full row. */
  flightStatus?: string | null;
  flightScheduledAt?: string | null;
  flightEstimatedAt?: string | null;
  flightLandedAt?: string | null;
  flightTerminal?: string | null;
  flightGate?: string | null;
  /** The spot's code, when placed (GET /internal/reservations/:id includes it). */
  spot?: { code: string } | null;
  /** S-C (07/10/2026): the file the car stands in and its position from the aisle (1 = first out). */
  file?: { id: string; code: string; name: string | null } | null;
  filePosition?: number | null;
  /** Bloc 2, Occupation: the spot and the key hook (null until placed). */
  spotId?: string | null;
  keyHook?: string | null;
  /** Where the car is parked (06/10/2026): GPS fix by the traveller or the valet. */
  carLat?: number | null;
  carLng?: number | null;
  carAccuracyM?: number | null;
  carLocatedAt?: string | null;
  carLocatedBy?: "traveller" | "staff" | null;
  carNote?: string | null;
  /** D-A: the stop serving this traveller (null: the airport). */
  stopId?: string | null;
  stop?: { id: string; name: string; kind: ShuttleStopKind } | null;
  /** « Embarquer en un geste » (14/10/2026): checked in as they boarded a drop-off (GET /internal/reservations/:id). */
  boardingCheckIn?: BoardingCheckIn | null;
  /** « Sièges auto » (24/10/2026): the child seats to install in the shuttle; missing from an older API. */
  childSeats?: ChildSeats | null;
}

/**
 * « Pointé à l'embarquement par Karim » (14/10/2026): a traveller checked in ("Sur place") by the driver as they boarded
 * the shuttle to the terminal; null when checked in otherwise.
 */
export interface BoardingCheckIn {
  /** The trip's driver, null when unknown. */
  driverFirstName: string | null;
  /** When they were checked in (the booking's arrivedAt). */
  at: string;
}

export interface NightLoad {
  date: string;
  count: number;
  bookable: number;
  free: number;
  overbooked: boolean;
}

/** A traveller telling the parking they are coming (live position, announce, or at the meeting point). */
export type ArrivalKind = "outbound" | "return";
export type ArrivalState = "sharing" | "announced" | "at_meeting_point";

export interface MeetingPoint {
  lat: number;
  lng: number;
  source: "parking" | "return_point" | "airport";
  label: string | null;
}

export interface ArrivalSignal {
  id: string;
  reservationId: string;
  reference: string;
  kind: ArrivalKind;
  state: ArrivalState;
  customerName: string;
  /** 09/10/2026: the first and last name apart, when the server sends them (the banner then matches the push). */
  customerFirstName?: string | null;
  customerLastName?: string | null;
  plate: string;
  passengers: number;
  returnFlight: string | null;
  scheduledAt: string;
  startedAt: string;
  expiresAt: string;
  distanceM: number | null;
  etaMinutes: number | null;
  etaAt: string | null;
  announcedMinutes: number | null;
  atMeetingPointAt: string | null;
  position: { lat: number; lng: number; accuracyM: number | null } | null;
  positionUpdatedAt: string | null;
  positionAgeSeconds: number | null;
  meetingPoint: MeetingPoint | null;
  /** E (06/10/2026): the traveller's word for the parking, sent with the signal. */
  note?: string | null;
}

/** A driver's running trip (position shared with its passengers), as the planning shows it. */
export interface ShuttleTripSummary {
  id: string;
  /** pickup: to the airport for returning travellers; dropoff: to the terminal with arrived ones. */
  direction: "pickup" | "dropoff";
  driverId: string;
  driverName: string;
  startedAt: string;
  reservationIds: string[];
}

export interface LiveArrivals {
  serverTime: string;
  signals: ArrivalSignal[];
  shuttleTrips?: ShuttleTripSummary[];
}

/** A planning row: the booking, its traveller's live signal and the shuttle trip picking them up, if any. */
export type PlanningRow = Reservation & {
  arrivalSignal?: ArrivalSignal | null;
  shuttleTrip?: Pick<
    ShuttleTripSummary,
    "id" | "driverName" | "startedAt"
  > | null;
};

/** Where the shuttle meets travellers at the airport on their return (Parking page). */
export interface ReturnMeetingPoint {
  lat: number;
  lng: number;
  label: string | null;
  instructions: string | null;
  photoUrl: string | null;
}

/** The vehicle sheet (V-A "Fiche complète", 04/10/2026). */
export interface ShuttleVehicle {
  id: string;
  model: string;
  colour: string | null;
  plate: string | null;
  /** Passenger seats, the driver's excluded; null when unknown. */
  seats: number | null;
  inService: boolean;
  /** The usual driver, preselected in their app. */
  driverId: string | null;
  driverName: string | null;
  /** Who took it today (V-A), null when free. */
  holderId?: string | null;
  holderName?: string | null;
}

export type ShuttleStopKind = "airport" | "station" | "other";

/** A place the shuttle serves (D-A, 05/10/2026): the airport (built in, id null) or a stop of the parking. */
export interface ShuttleStop {
  id: string | null;
  kind: ShuttleStopKind;
  name: string;
  lat: number;
  lng: number;
  instructions: string | null;
  builtIn: boolean;
}

export interface ShuttleStopInput {
  kind: ShuttleStopKind;
  name: string;
  lat: number;
  lng: number;
  instructions: string | null;
}

export type ShuttleVehicleInput = Omit<ShuttleVehicle, "id" | "driverName">;

export interface Planning {
  date: string;
  timezone: string;
  parking: { id: string; name: string; bookableCapacity: number };
  arrivals: PlanningRow[];
  returns: PlanningRow[];
  nights: NightLoad[];
  stats: {
    arrivals: number;
    arrived: number;
    returns: number;
    returnsWithFlight: number;
  };
  /** A gateway SMS waiting for the operator's phone for more than 10 minutes, else null. */
  smsWarning?: { pending: number } | null;
}

export interface CapacityPreview {
  nights: NightLoad[];
  fullNights: string[];
  canForce: boolean;
}

/** Dates are local to the parking, "YYYY-MM-DDTHH:mm". */
export interface ReservationInput {
  channel: ReservationChannel;
  channelDetail?: string | null;
  arrivalAt: string;
  returnAt: string;
  passengers: number;
  /** 09/10/2026: the traveller's first and last name; the server builds `customerName` from them. */
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail?: string | null;
  plate: string;
  returnFlight?: string | null;
  departureFlight?: string | null;
  /** D-A: a stop of the parking, or null for the airport. */
  stopId?: string | null;
  notes?: string | null;
  customerNote?: string | null;
  vehicleModel?: string | null;
  vehicleColour?: string | null;
  externalReference?: string;
  /** 10/10/2026: null clears it on an edit (never a Plazo booking's). */
  priceCents?: number | null;
  /** The amount read in the comparator's email (« Compléter »), on creation only. */
  importedPriceCents?: number;
  /** « Sièges auto » (24/10/2026): each 0 to 4, fewer than the passengers; on an edit, absent = unchanged, null = none. */
  childSeats?: ChildSeats | null;
  force?: boolean;
}

export interface Paginated<T> {
  docs: T[];
  totalDocs: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

/**
 * GET /internal/reservations (10/10/2026): chronological, by arrival. Without a search page 1 opens on today, pages 0
 * and below go back in time; `pageNumber` is the page's place among all of them, for « Page 3 / 4 ».
 */
export interface ReservationPage extends Paginated<Reservation> {
  pageNumber?: number;
  /** 21/10/2026: how many bookings have no price (managers only; null for the other roles). */
  noPriceCount?: number | null;
}

/** A booking without a price on the dashboard's « Les compléter » card (21/10/2026). */
export interface NoPriceBooking {
  id: string;
  reference: string;
  customerName: string;
  plate: string;
  arrivalAt: string;
  channel: ReservationChannel;
  detail: string | null;
}

/** What the server read from a pasted confirmation email. Dates are local, "YYYY-MM-DDTHH:mm". */
export interface ParsedBooking {
  provider: string;
  externalReference?: string;
  arrivalAt?: string;
  returnAt?: string;
  customerName?: string;
  /** When the email tells them apart (Onepark, Allopark, Claude's reading). */
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  customerEmail?: string;
  plate?: string;
  returnFlight?: string;
  departureFlight?: string;
  passengers?: number;
  priceCents?: number;
  /** 09/10/2026: the car, as the comparator gives it (Onepark, ParkMundo, Allopark's booking page). */
  vehicleModel?: string;
  vehicleColour?: string;
}

/** M-A (06/10/2026): the operator's inbound address and the forwarded confirmation emails. */
export type InboundEmailStatus =
  | "imported"
  | "duplicate"
  | "incomplete"
  | "unrecognised"
  /** @deprecated T-A (08/10/2026): "handled" replaces it; the server moved the old rows. */
  | "dismissed"
  | "handled"
  | "archived"
  | "forwarding"
  /** A (14/10/2026): sent on by a too-wide mailbox rule, set aside without its content; never listed, only counted. */
  | "ignored";

/** C (14/10/2026): how a comparator's emails reach Plazo (domain/inbound-comparators.ts on the server). */
export type ComparatorArrival = "direct" | "forwarded" | "manual" | "unknown" | "none";

export interface InboundComparator {
  provider: string;
  lastReceivedAt: string | null;
  lastStatus: InboundEmailStatus | null;
  arrival: ComparatorArrival;
}

/** A (14/10/2026): the mail services the setup wizard knows. */
export type MailProviderId = "gmail" | "outlook" | "ovh" | "other";

/** M-A « Boîte de réception » (08/10/2026): the three tabs of the inbox. */
export type InboundEmailView = "todo" | "done" | "archived";

export interface InboundSettings {
  available: boolean;
  address: string | null;
  lastReceivedAt: string | null;
  counts: Record<InboundEmailStatus, number>;
  toCheck: number;
  /** G-B: the comparators' sender addresses, for the forwarding rule. */
  senders: { provider: string; address: string }[];
  /** G-B: Gmail's latest forwarding confirmation (7 days): its code, or its acceptance link when Gmail sent no code. */
  forwarding: {
    provider: "gmail";
    code: string | null;
    link: string | null;
    requester: string | null;
    receivedAt: string;
  } | null;
  /** G-B: the last emails received, newest first. */
  recent: InboundRecent[];
  /** C (14/10/2026): one line per comparator (missing from an older API). */
  comparators?: InboundComparator[];
  /** A (14/10/2026): what Plazo saw of the setup, latest first. */
  progress?: { confirmationAt: string | null; comparatorMailAt: string | null; comparator: string | null; bookingAt: string | null };
  /** A: the emails a too-wide rule sent on these 7 days, set aside without their content. */
  unexpected?: { count: number; lastAt: string | null };
  /** A: the mail service the wizard opens on, and the address it was read from. */
  mailProvider?: { id: MailProviderId; business: boolean; email: string; source: "forwarding" | "account" } | null;
}

export interface InboundRecent {
  id: string;
  status: InboundEmailStatus;
  fromAddress: string | null;
  fromName: string | null;
  subject: string | null;
  provider: string | null;
  reservationReference: string | null;
  receivedAt: string;
}

export interface InboundEmail {
  id: string;
  status: InboundEmailStatus;
  fromAddress: string | null;
  fromName: string | null;
  subject: string | null;
  textBody: string | null;
  provider: string | null;
  parsed: ParsedBooking | null;
  missing: string[];
  reservationId: string | null;
  reservationReference: string | null;
  /**
   * L-A (08/10/2026): what Claude made of a mail no importer knew; null when it was not read. 16/10/2026: or what
   * Plazo's rules per mail type made of it (`source: "rules"`).
   */
  reading: InboundReading | null;
  /**
   * 16/10/2026: Claude could not read the mail (credit, key, load…), which waits for it: Plazo reads it again once Claude
   * answers. Optional: an older server does not send it.
   */
  readingOutage?: InboundReadingOutage | null;
  receivedAt: string;
  /** « Relancer l'analyse » (10/10/2026): when the server last analysed the mail again; null when never. */
  analysedAt: string | null;
  /**
   * 11/10/2026 (« Lance l'analyse automatiquement pour allopark »): the re-analyses Plazo made by itself, and when it makes
   * the next one (null: none planned). Optional: an older server does not send them.
   */
  autoRetries?: number;
  autoRetryAt?: string | null;
  /**
   * 10/10/2026 (« Prévent captcha »): what became of the Allopark booking page at the last analysis; null when no page was
   * tried. Optional: an older server does not send it.
   */
  pageLookup?: InboundPageLookup | null;
  /**
   * 10/10/2026 (« C'est une modification »): what Plazo did of an Allopark change of a booking; null for any other mail.
   * Optional: an older server does not send it.
   */
  change?: InboundChange | null;
}

/** The fields a comparator's change may update (the server's `ImportChangeField`). */
export type InboundChangeField =
  | "arrivalAt"
  | "returnAt"
  | "passengers"
  | "plate"
  | "departureFlight"
  | "returnFlight"
  | "customerPhone"
  | "customerName"
  | "customerEmail"
  | "vehicleModel"
  | "priceCents"
  // 21/10/2026: a comparator's cancellation (ParkVia), « Statut : Attendu → Annulé ».
  | "status";

/**
 * Why a change was left to the staff; 10/10/2026 (« Tu n'as pas récupéré le prix pour la modif »): `ambiguous`, several
 * bookings typed without the comparator's reference match it (same car, same stay), none was chosen.
 */
export type InboundChangeReason =
  | "reservation_closed"
  | "already_arrived"
  | "no_room"
  | "plazo_booking"
  | "invalid_stay"
  | "ambiguous"
  // 21/10/2026: a comparator's cancellation of a booking Plazo does not have.
  | "unknown_booking";

/**
 * An Allopark change of a booking read against its booking page: applied, not needed (no changes: the mail is a
 * duplicate) or left to the staff with its reason. Dates are local to the parking (« 2026-12-15T18:00 »), the price in
 * cents.
 */
export interface InboundChange {
  applied: boolean;
  reason: InboundChangeReason | null;
  reservationId: string | null;
  /** The booking's Plazo reference. */
  reference: string | null;
  changes: { field: InboundChangeField; from: string | number | null; to: string | number | null }[];
  at: string;
  /** 21/10/2026: `cancellation` for a comparator's cancellation (ParkVia) Plazo applied or left to the staff. */
  kind?: "cancellation";
}

/**
 * The Allopark booking page of a mail: `read` (its fields completed the mail), `protected` (Allopark asked for an
 * anti-robot check, which Plazo never passes), `unavailable` (no answer) or `not_found` (no page showed this booking).
 */
export type InboundPageOutcome = "read" | "protected" | "unavailable" | "not_found";

export interface InboundPageLookup {
  outcome: InboundPageOutcome;
  /** The page to open by hand, for the three failures only. */
  url: string | null;
  at: string;
}

/**
 * What « Relancer l'analyse » came to: a booking created or found, an Allopark change applied (`changed`, 10/10/2026),
 * or the mail still waiting.
 */
export type InboundReanalysisOutcome = "imported" | "changed" | "duplicate" | "incomplete" | "unrecognised" | "handled";

export interface InboundReanalysis {
  email: InboundEmail;
  outcome: InboundReanalysisOutcome;
}

export type InboundReadingKind = "booking" | "modification" | "cancellation" | "other";

export interface InboundReading {
  kind: InboundReadingKind;
  provider: string | null;
  /** 0 to 1. */
  confidence: number;
  /** One French sentence for the operator. */
  summary: string;
  model: string;
  /**
   * 16/10/2026 (« analyser sans passer par Claude »): who read the mail: Claude (also when absent), or Plazo's rules per
   * comparator and mail type (`rule`: the template that matched).
   */
  source?: "claude" | "rules";
  rule?: string;
}

/** 16/10/2026: why Claude could not read a mail (the server's `ReadingOutageCause`). */
export type InboundReadingOutageCause = "credit" | "auth" | "rate_limit" | "overloaded" | "timeout" | "network" | "other";

export interface InboundReadingOutage {
  cause: InboundReadingOutageCause;
  at: string;
}

/** One tab of the inbox, with the size of all three. */
export interface InboundEmailList {
  data: InboundEmail[];
  counts: Record<InboundEmailView, number>;
}

export type CancellationPolicy =
  | "free_until_arrival"
  | "free_24h"
  | "free_48h"
  | "non_refundable";
export type ListingService =
  | "shuttle"
  | "valet"
  | "covered"
  | "ev_charging"
  | "open_24h"
  | "fenced"
  | "cctv";

/** Review by the platform: draft -> pending_review -> published, or rejected (with a message). */
export type ListingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected";

export interface Listing {
  id: string;
  slug: string;
  status: ListingStatus;
  /** The platform's message with its last decision (always set on a refusal). */
  reviewMessage: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  title: string;
  description: string | null;
  services: ListingService[];
  shuttleMinutes: number | null;
  /** 14/10/2026: the shuttle's average wait declared by the operator, whole minutes 0–120 (null: not declared). */
  shuttleWaitMinutes: number | null;
  distanceKm: number | null;
  openingHours: string | null;
  cancellationPolicy: CancellationPolicy;
  photos: string[];
  airport: { code: string; name: string; slug: string };
}

export interface ListingInput {
  airportCode: string;
  slug: string;
  title: string;
  description: string | null;
  services: ListingService[];
  shuttleMinutes: number | null;
  shuttleWaitMinutes: number | null;
  distanceKm: number | null;
  openingHours: string | null;
  cancellationPolicy: CancellationPolicy;
  photos: string[];
}

/** 09/10/2026: Claude's proposal for the « Présentation » (nothing saved). */
export interface DescriptionSuggestion {
  text: string;
  model: string;
}

export interface ListingResponse {
  listing: Listing | null;
  parking: {
    id: string;
    name: string;
    address: string | null;
    shuttleTravelMinutes: number;
  };
}

export interface PricingTier {
  days: number;
  priceCents: number;
}

/**
 * Night fees (12/10/2026): one window per parking, the same every day ("HH:mm"; the start counts as night, the end
 * does not, and it may cross midnight), a « Dépôt de nuit » and a « Retour de nuit » fee. Kept while switched off, so
 * that switching them back on restores them; times and fees are null while never set.
 */
export interface NightSettings {
  enabled: boolean;
  start: string | null;
  end: string | null;
  arrivalFeeCents: number | null;
  returnFeeCents: number | null;
}

/** The night rule travellers are charged (null when none); a side without a fee is null. */
export interface NightRule {
  start: string;
  end: string;
  arrivalFeeCents: number | null;
  returnFeeCents: number | null;
}

/** The night fees of one stay, in cents (0 for an end that pays nothing). */
export interface NightFee {
  arrivalCents: number;
  returnCents: number;
  totalCents: number;
}

export interface Pricing {
  tiers: PricingTier[];
  extraDayPriceCents: number | null;
  commissionBps: number | null;
  /** Missing from an older API. */
  night?: NightSettings;
}

// ---- Sign-up and invitations ----------------------------------------------------------------------

export interface Airport {
  code: string;
  name: string;
  city: string;
  slug: string;
}

export interface SignupInput {
  companyName: string;
  parkingName: string;
  totalCapacity: number;
  airportCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
  acceptTerms: boolean;
  /** Honeypot: always empty for a person. */
  website: string;
}

// ---- Platform space (super admin) --------------------------------------------------------------------

export type OperatorStatus = "active" | "suspended";

export interface StripeState {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export interface PlatformOperator {
  id: string;
  name: string;
  status: OperatorStatus;
  suspendedAt: string | null;
  /** 09/10/2026: a suspended operator filed away (out of the Loueurs and Annonces lists and of the crons). */
  archivedAt?: string | null;
  createdAt: string;
  isPlatform: boolean;
  /** Fictional operator of the demo seed (backend `npm run seed:demo`). */
  isDemo?: boolean;
  parkings: number;
  /** Sum of the parkings' capacity used everywhere (the plan's, else the declared figure; 09/10/2026). */
  places: number;
  manager: { name: string; email: string; emailVerified: boolean } | null;
  listing: { id: string; status: ListingStatus } | null;
  payments: StripeState;
  commissionBps: number | null;
  bookingsThisMonth: number;
  /** The latest contract (20/10/2026); missing from an older API. */
  contract?: { status: "pending" | "signed"; version: number } | null;
  invitation: { sentAt: string; expiresAt: string; expired: boolean } | null;
}

/** 09/10/2026 (« pouvoir supprimer un parking »): what deleting an operator would erase, and whether it may. */
export interface OperatorDeletion {
  id: string;
  name: string;
  deletable: boolean;
  reason: "cannot_delete_platform" | "not_suspended" | "has_payments" | "payment_in_progress" | null;
  /** `listings`: missing from an older API. */
  counts: { parkings: number; listings?: number; reservations: number; staff: number; paidReservations: number };
}

export interface PlatformOperators {
  defaultCommissionBps: number | null;
  /** Size of the two lists (current: active and suspended; archived). Missing from an older API. */
  counts?: { current: number; archived: number };
  operators: PlatformOperator[];
}

export interface InviteInput {
  operatorName: string;
  /** 09/10/2026: the manager's first and last name, both required. */
  managerFirstName: string;
  managerLastName: string;
  managerEmail: string;
  totalCapacity: number;
  commissionBps: number | null;
}

export interface InvitationResult {
  operator: { id: string; name: string };
  emailSent: boolean;
  expiresAt: string;
  /** Only when the email could not be sent: to pass on by hand, shown once. */
  inviteUrl?: string;
}

export interface PlatformListing {
  id: string;
  slug: string;
  status: ListingStatus;
  title: string;
  description: string | null;
  services: ListingService[];
  shuttleMinutes: number | null;
  /** 14/10/2026: the declared average wait of the shuttle (null: not declared). */
  shuttleWaitMinutes: number | null;
  distanceKm: number | null;
  openingHours: string | null;
  contactPhone: string | null;
  cancellationPolicy: CancellationPolicy;
  photos: string[];
  reviewMessage: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  updatedAt: string;
  airport: { code: string; name: string; slug: string };
  parking: {
    id: string;
    name: string;
    address: string | null;
    /** The declared figure. */
    totalCapacity: number;
    /** The capacity used everywhere (09/10/2026; missing from an older API). */
    effectiveCapacity?: number;
  };
  operator: { id: string; name: string; status: OperatorStatus };
  pricingTiers: PricingTier[];
  fromPriceCents: number | null;
  /** 12/10/2026: everything a traveller can be charged (missing from an older API). */
  extraDayPriceCents?: number | null;
  night?: NightRule | null;
}

export interface PlatformListings {
  counts: Record<ListingStatus, number>;
  listings: PlatformListing[];
}

export interface PlatformReservation {
  id: string;
  reference: string;
  status: ReservationStatus | "pending_payment";
  channel: ReservationChannel;
  channelDetail: string | null;
  arrivalAt: string;
  returnAt: string;
  createdAt: string;
  plate: string;
  amountCents: number | null;
  paymentStatus: "pending" | "paid" | "expired" | "refunded" | null;
  operator: { id: string; name: string };
  parking: { name: string };
}

/** By arrival, the earliest first; without a date filter page 1 opens on today (10/10/2026, as `ReservationPage`). */
export type PlatformReservations = Paginated<PlatformReservation> & {
  operators: { id: string; name: string }[];
  pageNumber?: number;
};

export type PayoutSchedule =
  | "AFTER_STAY"
  | "AT_DROP_OFF"
  | "WEEKLY"
  | "MONTHLY";

/** The operator's online payment state (GET /internal/payments/status). */
export interface PaymentStatus {
  /** False while the platform has no Stripe key: travellers pay at the parking. */
  enabled: boolean;
  /** A Stripe test key: no real money moves. */
  testMode: boolean;
  connected: boolean;
  /** The onboarding was sent to Stripe (verification pending until payouts are enabled). */
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  commissionBps: number | null;
  payoutSchedule: PayoutSchedule;
}

export type PlatformAudience = "staff" | "travellers" | "operator";

/** A push sent by the platform (E-A, 05/10/2026). */
export interface PlatformNotification {
  id: string;
  audience: PlatformAudience;
  operatorId: string | null;
  operatorName: string | null;
  title: string;
  body: string;
  url: string | null;
  recipients: number;
  sentByName: string;
  createdAt: string;
}

export interface PlatformNotificationInput {
  audience: PlatformAudience;
  operatorId?: string | null;
  title: string;
  body: string;
  url?: string | null;
}

export interface PlatformPayments {
  paymentsEnabled: boolean;
  operators: {
    id: string;
    name: string;
    status: OperatorStatus;
    stripe: StripeState;
    payoutSchedule: PayoutSchedule;
    commissionBps: number | null;
    pending: { count: number; amountCents: number };
    failed: {
      reservationId: string;
      reference: string;
      amountCents: number | null;
      arrivalAt: string;
      returnAt: string;
    }[];
  }[];
}

// ---- SMS to travellers (the operator's channel) ----------------------------------------------

export type SmsMode = "gateway" | "brevo" | "none";

/** GET /internal/sms/settings. The gateway password is never returned. */
export interface SmsSettings {
  mode: SmsMode;
  /** "Plazo envoie pour moi" exists only while the platform has Brevo. */
  brevoAvailable: boolean;
  gateway: {
    baseUrl: string | null;
    login: string;
    senderPhone: string | null;
    linkedAt: string | null;
  } | null;
}

export interface SmsSettingsInput {
  mode: SmsMode;
  login?: string;
  password?: string;
  senderPhone?: string;
  baseUrl?: string | null;
}

/** GET /internal/sms/status */
export interface SmsStatus {
  mode: SmsMode;
  brevoAvailable: boolean;
  linkedAt: string | null;
  lastSentAt: string | null;
  senderPhone: string | null;
  month: { sent: number; failed: number };
  pending: number;
  pendingStale: boolean;
  lastError: string | null;
  lastErrorAt: string | null;
}

/** Direction of a shuttle trip (T-A): towards the airport for returns, towards the terminal for arrivals. */
export type ShuttleDirection = "pickup" | "dropoff";

/** A running trip as GET /internal/shuttle/live shows it (P-A, 05/10/2026). */
export interface LiveTrip {
  id: string;
  direction: ShuttleDirection;
  driverId: string;
  driverName: string;
  vehicle: {
    model: string | null;
    colour: string | null;
    plate: string | null;
  };
  stop: ShuttleStop | null;
  passengers: number;
  startedAt: string;
  expiresAt: string;
  position: { lat: number; lng: number } | null;
  positionAgeSeconds: number | null;
  toStop: { distanceM: number; etaMinutes: number } | null;
  toParking: { distanceM: number; etaMinutes: number } | null;
}

/** The flight of a traveller to pick up (GET /internal/shuttle/pickups). */
export interface PickupFlight {
  number: string | null;
  status: string | null;
  scheduledAt: string | null;
  estimatedAt: string | null;
  landedAt: string | null;
  landedSource: string | null;
  terminal: string | null;
  gate: string | null;
  checkedAt: string | null;
}

/** A returning traveller to fetch at the airport today. */
export interface PickupRow {
  reservationId: string;
  reference: string;
  customerName: string;
  passengers: number;
  plate: string;
  status: ReservationStatus;
  returnAt: string;
  flight: PickupFlight;
  terminal: string | null;
  stopId: string | null;
  stopName: string | null;
  atMeetingPointAt: string | null;
  tripId: string | null;
  /** E (06/10/2026): what the traveller signalled today. */
  notice?: ReturnNotice | null;
  /** F-A: when the shuttle should leave the parking (missing from an older API). */
  leaveAt?: string;
  /** « Sièges auto » (24/10/2026): the child seats to load for this traveller. */
  childSeats?: ChildSeats | null;
}

/** An arrived traveller waiting at the parking for the shuttle to the terminal (drop-off). */
export interface DepartureRow {
  reservationId: string;
  reference: string;
  customerName: string;
  passengers: number;
  plate: string;
  status: ReservationStatus;
  arrivalAt: string;
  arrivedAt: string | null;
  spot: string | null;
  stopId: string | null;
  stopName: string | null;
  tripId: string | null;
  /**
   * F-A: when the shuttle should leave for the terminal; `expected`: still to come (status upcoming), selectable all the
   * same since « Embarquer en un geste » (14/10/2026): checked in when the trip starts.
   */
  leaveAt?: string;
  expected?: boolean;
  /** « Sièges auto » (24/10/2026): the child seats to load for this traveller. */
  childSeats?: ChildSeats | null;
}

/** F-A: a traveller dropped at the terminal (or fetched back), kept on the driver's list until their return. */
export interface StayingRow {
  reservationId: string;
  reference: string;
  customerName: string;
  passengers: number;
  plate: string;
  status: ReservationStatus;
  returnAt: string;
  returnFlight: string | null;
  flight: PickupFlight;
  spot: string | null;
  stopName: string | null;
  returnedAt: string | null;
}

export interface Staying {
  serverTime: string;
  days: { date: string; rows: StayingRow[] }[];
  returnedToday: StayingRow[];
}

/** A shuttle trip as its driver (or the team) sees it. */
export interface StaffTrip {
  id: string;
  status: string;
  direction: ShuttleDirection;
  driverId: string;
  driverName: string;
  vehicle: {
    model: string | null;
    colour: string | null;
    plate: string | null;
  };
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  endReason: string | null;
  secondsLeft: number;
  passengers: {
    reservationId: string;
    reference: string;
    customerName: string;
    passengers: number;
    plate: string;
    terminal: string | null;
    /** When the traveller was checked in ("Sur place"); missing from an older API. */
    arrivedAt?: string | null;
    /** « Embarquer en un geste » (14/10/2026): checked in as they boarded this trip (« Sur place · 09:47 »). */
    checkedInAtBoarding?: boolean;
    /** « Sièges auto » (24/10/2026). */
    childSeats?: ChildSeats | null;
  }[];
  positionUpdatedAt: string | null;
  meetingPoint: MeetingPoint | null;
  stop: ShuttleStop | null;
  /** R-B: false when the parking turned the tracking off: the browser does not share its position. */
  sharePosition: boolean;
}

export interface StartTripInput {
  reservationIds: string[];
  direction: ShuttleDirection;
  stopId: string | null;
  vehicleId?: string | null;
  vehicle?: {
    model: string;
    colour?: string | null;
    plate?: string | null;
  } | null;
}

export interface LiveShuttles {
  serverTime: string;
  parking: { id: string; name: string; lat: number | null; lng: number | null };
  stops: ShuttleStop[];
  trips: LiveTrip[];
}

export type AlertSeverity = "urgent" | "watch" | "todo";
export type AlertKind =
  | "no_spot"
  | "no_free_spot"
  | "arriving_unplaced"
  | "flight_delayed"
  | "flight_cancelled"
  | "waiting_at_meeting_point"
  | "keys_missing"
  | "sms_pending"
  | "overbooked"
  | "departure_cancelled"
  | "departure_delayed"
  | "wave_overflow"
  | "no_show_suspected"
  | "inbound_to_check"
  | "blocked_return"
  // 13/10/2026: someone asks to join the team with the code of the day (managers; opens Équipe).
  | "join_request"
  // 21/10/2026: bookings without a price (managers; `detail` = how many).
  | "price_missing"
  // 21/10/2026: services for the car to do before a return within 36 h (`detail` = their names, `since` = the return).
  | "extras_due";

/** A row of the home's "À traiter" list (GET /internal/dashboard). */
export interface DashboardAlert {
  kind: AlertKind;
  severity: AlertSeverity;
  reservationId: string | null;
  reference: string | null;
  customerName: string | null;
  plate: string | null;
  detail: string | null;
  since: string | null;
  minutes: number | null;
}

export interface DashboardVehicle {
  id: string;
  reference: string;
  customerName: string;
  passengers: number;
  plate: string;
  status: ReservationStatus;
  arrivalAt: string;
  returnAt: string;
  spotCode: string | null;
  stayClass: string | null;
  keyHook: string | null;
  returnFlight: string | null;
  flightStatus: string | null;
  flightScheduledAt: string | null;
  flightEstimatedAt: string | null;
  flightLandedAt: string | null;
  tripDirection: ShuttleDirection | null;
  stopName: string | null;
  returnsToday: boolean;
  /** « Embarquer en un geste » (14/10/2026): checked in as they boarded a drop-off (missing from an older API). */
  boardingCheckIn?: BoardingCheckIn | null;
}

/** The pro space's home (05/10/2026). */
export interface Dashboard {
  /** 21/10/2026: bookings without a price and the nearest ones (managers only, else null; absent from an older API). */
  noPrice?: { count: number; next: NoPriceBooking[] } | null;
  serverTime: string;
  date: string;
  parking: {
    id: string;
    name: string;
    timezone: string;
    bookableCapacity: number;
    plannedSpots: number;
    /** S-C (07/10/2026): the parking is stored in files (missing from an older API). */
    storedInFiles?: boolean;
  };
  counts: {
    onSite: number;
    arrivalsToday: number;
    arrivedToday: number;
    returnsToday: number;
    shuttlesRunning: number;
    freeSpots: number | null;
    toTreat: number;
  };
  services: {
    flights: {
      configured: boolean;
      provider: string | null;
      lastCheckedAt: string | null;
    };
    sms: {
      mode: string;
      pending: number;
      stale: boolean;
      lastSentAt: string | null;
    };
    push: { configured: boolean; devices: number };
    stripe: { online?: boolean; connected: boolean; payoutsEnabled: boolean };
    lastImportAt: string | null;
    /**
     * 16/10/2026: Claude's reading of the mails no rule knows; `outage` when a mail that needed Claude could not be read
     * within the hour. Optional: an older server does not send it.
     */
    reading?: { configured: boolean; outage: InboundReadingOutage | null };
  };
  alerts: DashboardAlert[];
  /** The next shuttle wave still to run today (V-A). */
  nextWave: {
    leaveAt: string;
    direction: ShuttleDirection;
    stopName: string | null;
    passengers: number;
    vehiclesNeeded: number | null;
    flights: string[];
  } | null;
  breakdown: {
    onSiteQuiet: number;
    toPlaceToday: number;
    /** S-C (07/10/2026): cars to take out today so the returns of the day get out (missing from an older API). */
    movesToday?: number;
    returnsThisWeek: number;
    toTreat: number;
    freeSpots: number | null;
  };
  vehicles: DashboardVehicle[];
}

// ---------------------------------------------------------------- shuttle waves (V-A, 05/10/2026)

export type WaveState = "planned" | "running" | "done";

export interface WaveFlight {
  number: string;
  status: string | null;
  scheduledAt: string | null;
  estimatedAt: string | null;
  actualAt: string | null;
  terminal: string | null;
}

export interface WaveMember {
  reservationId: string;
  reference: string;
  customerName: string;
  passengers: number;
  plate: string;
  status: ReservationStatus;
  direction: ShuttleDirection;
  stopId: string | null;
  stopName: string | null;
  leaveAt: string;
  meetAt: string | null;
  flight: WaveFlight | null;
  noFlight: boolean;
  state: WaveState;
  tripId: string | null;
}

export interface ShuttleWave {
  id: string;
  direction: ShuttleDirection;
  stopId: string | null;
  stopName: string | null;
  leaveAt: string;
  meetAt: string | null;
  passengers: number;
  seats: number | null;
  vehiclesNeeded: number | null;
  noFlight: number;
  flights: string[];
  state: WaveState;
  members: WaveMember[];
}

export interface ShuttleForecast {
  serverTime: string;
  date: string;
  times: {
    shuttleTravelMinutes: number;
    terminalLeadMinutes: number;
    landingDelayMinutes: number;
  };
  seats: number | null;
  vehiclesInService: number;
  waves: ShuttleWave[];
}

/** GET /internal/flights/check: the flight provider's answer for one flight (diagnostic). */
export interface FlightCheck {
  provider: string;
  host: string | null;
  flight: string;
  date: string;
  role: "arrival" | "departure";
  outcome: "not_configured" | "found" | "not_found" | "error";
  info: {
    status: string;
    scheduledArrivalAt: string | null;
    estimatedArrivalAt: string | null;
    actualArrivalAt: string | null;
    arrivalAirport: string | null;
    terminal: string | null;
    gate: string | null;
    scheduledDepartureAt: string | null;
    estimatedDepartureAt: string | null;
    actualDepartureAt: string | null;
    departureAirport: string | null;
    departureTerminal: string | null;
  } | null;
  error: string | null;
}

/** E (06/10/2026): what a traveller can signal on the return day. */
export type ReturnNoticeKind = "flight_delayed" | "luggage" | "other";
export interface ReturnNotice {
  kind: ReturnNoticeKind;
  text: string | null;
  at: string;
}

/** « SMS de la veille » (S-A + S-B, 06/10/2026): what happens to one booking's day-before SMS. */
export type ReminderRowStatus =
  | "planned"
  | "sent"
  | "waiting"
  | "failed"
  | "excluded"
  | "disabled"
  | "no_mobile"
  | "foreign"
  | "no_channel"
  | "not_sent"
  | "paused"
  | "same_day"
  | "too_late";
export type TemplateVariable =
  | "prénom"
  | "nom"
  | "date"
  | "heure"
  | "plaque"
  | "référence"
  | "lien";
export type TemplateValues = Record<TemplateVariable, string>;
export interface ReminderRow {
  reservationId: string;
  reference: string;
  /** Local "YYYY-MM-DDTHH:mm" of the drop-off. */
  arrivalAt: string;
  customerName: string;
  customerPhone: string;
  channel: ReservationChannel;
  channelDetail: string | null;
  status: ReminderRowStatus;
  /** Local "YYYY-MM-DDTHH:mm": when it leaves (planned) or left. */
  at: string | null;
  excludedBy: string | null;
}
export interface ReminderEvening {
  date: string;
  departuresDate: string;
  when: "past" | "tonight" | "future";
  sendTime: string;
  timeChanged: boolean;
  paused: boolean;
  canSendNow: boolean;
  counts: {
    departures: number;
    planned: number;
    sent: number;
    waiting: number;
    failed: number;
    withoutSms: number;
  };
}
export interface ReminderBoard {
  parkingId: string;
  today: string;
  settings: {
    enabled: boolean;
    sendTime: string;
    template: string;
    custom: boolean;
    updatedAt: string | null;
    updatedBy: string | null;
  };
  defaults: { template: string; short: string };
  sendTimes: string[];
  variables: TemplateVariable[];
  channel: { mode: SmsMode; repliesReachParking: boolean };
  linkAvailable: boolean;
  evenings: ReminderEvening[];
  evening: ReminderEvening & { rows: ReminderRow[] };
  sample: { customerName: string; values: TemplateValues };
  can: { edit: boolean; manage: boolean };
}
export interface ReminderSettingsInput {
  enabled?: boolean;
  sendTime?: string;
  template?: string | null;
}

/** CA-B + CA-A (09/10/2026): the revenue of the bookings, managers only. */
export type RevenueBasis = "arrival" | "booked";

export interface RevenueChannel {
  channel: ReservationChannel;
  /** A comparator's name (« Allopark »…); null for the other channels. */
  detail: string | null;
  count: number;
  totalCents: number;
  /** What the comparator took, and what the operator keeps (19/10/2026). */
  commissionCents: number;
  netCents: number;
  /** A comparator's key (« allopark ») and its rate in force today, edited in place; null for the other channels. */
  comparatorKey: string | null;
  rate: CommissionRate | null;
}

/** What a comparator takes, from a local day on (19/10/2026). */
export interface CommissionRate {
  comparatorKey: string;
  label: string;
  /** 1800 = 18 %. */
  rateBp: number;
  fixedCents: number;
  effectiveFrom: string;
}

export interface ComparatorCommission {
  key: string;
  label: string;
  current: CommissionRate | null;
  upcoming: CommissionRate[];
  history: CommissionRate[];
  bookingsThisMonth: number;
}

/** A comparator booking's commission: its own exception, its comparator's rate, or none set yet. */
export interface ReservationCommission {
  comparator: string;
  source: "override" | "rate" | "none";
  rateBp: number | null;
  fixedCents: number;
  amountCents: number | null;
  netCents: number | null;
  effectiveFrom: string | null;
}

export interface RevenueReport {
  from: string;
  to: string;
  basis: RevenueBasis;
  timezone: string;
  totalCents: number;
  commissionCents: number;
  netCents: number;
  count: number;
  averageCents: number | null;
  averageDays: number | null;
  withoutAmount: number;
  byChannel: RevenueChannel[];
  byDay: { date: string; count: number; totalCents: number; netCents: number }[];
  /** Bookings of the period without an amount (50 at most), to complete. */
  missing: { id: string; reference: string; customerName: string; arrivalAt: string; channel: ReservationChannel; detail: string | null }[];
}

export interface RevenueSummary {
  today: string;
  month: { from: string; to: string; totalCents: number; commissionCents?: number; netCents?: number; count: number; withoutAmount: number };
  todayCents: number;
  weekCents: number;
  /** What each channel took this month (20/10/2026); missing from an older API. */
  commissions?: { label: string; comparatorKey: string | null; rateBp: number | null; amountCents: number; count: number; missingRate: boolean }[];
}

// ---- Prospection (Plateforme › Prospection, 18/10/2026) ----------------------------------------------------------------

export type ProspectStatus = "to_contact" | "contacted" | "replied" | "interested" | "not_interested" | "unsubscribed";

export interface Prospect {
  id: string;
  email: string;
  companyName: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  town: string | null;
  airportCode: string | null;
  airportName: string | null;
  /** The region it is filed under: chosen by hand (`manual`), else its airport's; null: « Sans région » (19/10/2026). */
  region: ProspectRegion | null;
  /** The region chosen by hand (a key), null: automatic. */
  regionOverride: string | null;
  phone: string | null;
  notes: string | null;
  source: "manual" | "csv";
  status: ProspectStatus;
  /** Last step sent (0: none). */
  step: number;
  nextStep: number | null;
  nextSendAt: string | null;
  firstContactedAt: string | null;
  lastContactedAt: string | null;
  stoppedAt: string | null;
  failedAttempts: number;
  lastError: string | null;
  createdAt: string;
  /** 21/10/2026 (C): the prospect's demo link, its opens and its expiry; null until « Créer un lien de démo ». */
  demo?: DemoLink | null;
}

export interface DemoLink {
  url: string;
  expiresAt: string;
  expired: boolean;
  opens: number;
  lastOpenedAt: string | null;
}

export type DemoRole = "manager" | "agent" | "driver" | "valet";

/** « Mail du matin » (21/10/2026): on or off, the local hour it leaves at (5 to 10), and where it goes. */
export interface MorningEmailPreference {
  enabled: boolean;
  hour: number;
  email: string;
}

export interface ProspectInput {
  companyName: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  email: string;
  town: string | null;
  airportCode: string | null;
  /** A region key (form) or name (CSV column « région »); null: automatic (the airport's). */
  region?: string | null;
  phone: string | null;
  notes: string | null;
}

export interface ProspectRegion {
  key: string;
  label: string;
  manual: boolean;
}

export interface ProspectList {
  data: Prospect[];
  counts: Record<ProspectStatus | "all", number>;
  airports: { code: string; name: string | null; count: number }[];
  /** Every region, alphabetical. */
  regions: { key: string; label: string }[];
  /** Prospects per region key (and `none`), under the airport filter. */
  regionCounts: Record<string, number>;
  today: { sent: number; cap: number; remaining: number };
  window: { open: boolean; nextOpening: string };
  configured: boolean;
}

export interface ProspectingStep {
  step: 1 | 2 | 3;
  enabled: boolean;
  delayDays: number;
  subject: string;
  body: string;
}

export interface ProspectingSettings {
  steps: ProspectingStep[];
  dailyCap: number;
  updatedAt: string | null;
  sender: { name: string; email: string } | null;
  replyTo: string | null;
  configured: boolean;
}

export type ProspectImportOutcome = "new" | "duplicate" | "suppressed" | "invalid";

export interface ProspectImportReport {
  dryRun: boolean;
  results: { row: number; outcome: ProspectImportOutcome; email?: string; fields?: Record<string, string> }[];
  counts: Record<ProspectImportOutcome, number>;
  created: number;
}

export interface ProspectSendResult {
  enrolled: number;
  sent: number;
  failed: number;
  queued: number;
  skipped: number;
  nextOpening: string | null;
}

/** The Plazo ↔ operator contract (20/10/2026, « Pouvoir stocker le contrat à faire signer », choice 2a). */
export type PartnerContractStatus = "pending" | "signed" | "superseded";
export type ContractFileKind = "original" | "signed" | "proof";

export interface PartnerContract {
  id: string;
  version: number;
  title: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  status: PartnerContractStatus;
  uploadedAt: string;
  uploadedBy: string | null;
  notifiedAt: string | null;
  signedAt: string | null;
  signer: { name: string; email: string | null } | null;
  signerIp: string | null;
  signedSha256: string | null;
}

/** « Mon contrat »: the one to sign (else the latest signed) and the versions signed before. */
export interface MyContract {
  current: PartnerContract | null;
  history: PartnerContract[];
  canSign: boolean;
}

// ---- Services for the car (21/10/2026) -----------------------------------------------------------------------------

export type ExtraKind = "interior_wash" | "hybrid_charge" | "ev_charge";
export type ExtraStatus = "ordered" | "done" | "refused" | "refunded";

/** A service of the parking (Parking › Réglages): offered or not, at its price. */
export interface ExtraOffer {
  kind: ExtraKind;
  label: string;
  description: string;
  enabled: boolean;
  priceCents: number;
  defaultPriceCents: number;
}

/** GET/PUT /internal/parkings/:id/extras */
export interface ExtraSettings {
  leadHours: number;
  offers: ExtraOffer[];
}

/** A service ordered by the traveller on a booking (GET /internal/reservations/:id/extras). */
export interface ReservationExtra {
  id: string;
  kind: ExtraKind;
  label: string;
  priceCents: number;
  status: ExtraStatus;
  withBooking: boolean;
  paidAt: string | null;
  doneAt: string | null;
  refusedAt: string | null;
  refusedReason: string | null;
  refundedAt: string | null;
  doneBy: string | null;
  refusedBy: string | null;
}
