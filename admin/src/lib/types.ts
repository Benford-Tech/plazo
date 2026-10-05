// Shapes returned by the backend (names follow the API).
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
  vehicle?: { id: string; model: string; colour: string | null; plate: string | null; seats: number | null } | null;
  createdAt: string;
  operatorName?: string;
  /** Platform owner (PLATFORM_ADMIN_EMAILS): sees the "Plateforme" space. */
  isPlatformAdmin?: boolean;
  /** False until a self sign-up confirms its email (the listing cannot be sent for review before). */
  emailVerified?: boolean;
  /** Set while a platform admin views an operator's space ("Ouvrir son espace"). */
  viewAs?: { operatorId: string; operatorName: string } | null;
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
  bookableCapacity: number;
}

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
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
  password: string;
}

export type ReservationStatus = "upcoming" | "arrived" | "shuttled_out" | "return_requested" | "returned" | "cancelled" | "no_show";
export type ReservationChannel = "website" | "phone" | "counter" | "aggregator" | "import" | "plazo";

export interface Reservation {
  id: string;
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
  customerName: string;
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
  externalReference: string | null;
  priceCents: number | null;
  overbooked: boolean;
  /** Terms accepted by the traveller (bookings made on the public site only). */
  cancellationPolicy: CancellationPolicy | null;
  arrivedAt: string | null;
  returnedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  /** Bloc 2, Occupation: the spot and the key hook (null until placed). */
  spotId?: string | null;
  keyHook?: string | null;
  /** D-A: the stop serving this traveller (null: the airport). */
  stopId?: string | null;
  stop?: { id: string; name: string; kind: ShuttleStopKind } | null;
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
  shuttleTrip?: Pick<ShuttleTripSummary, "id" | "driverName" | "startedAt"> | null;
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
  stats: { arrivals: number; arrived: number; returns: number; returnsWithFlight: number };
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
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  plate: string;
  returnFlight?: string | null;
  departureFlight?: string | null;
  /** D-A: a stop of the parking, or null for the airport. */
  stopId?: string | null;
  notes?: string | null;
  externalReference?: string;
  priceCents?: number;
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

/** What the server read from a pasted confirmation email. Dates are local, "YYYY-MM-DDTHH:mm". */
export interface ParsedBooking {
  provider: string;
  externalReference?: string;
  arrivalAt?: string;
  returnAt?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  plate?: string;
  returnFlight?: string;
  departureFlight?: string;
  passengers?: number;
  priceCents?: number;
}

export interface EmailImportResult {
  parsed: ParsedBooking;
  missing: ("arrivalAt" | "returnAt" | "customerName" | "customerPhone" | "plate")[];
  duplicate: { id: string; reference: string } | null;
  capacity: CapacityPreview | null;
}

export type CancellationPolicy = "free_until_arrival" | "free_24h" | "free_48h" | "non_refundable";
export type ListingService = "shuttle" | "valet" | "covered" | "ev_charging" | "open_24h" | "fenced" | "cctv";

/** Review by the platform: draft -> pending_review -> published, or rejected (with a message). */
export type ListingStatus = "draft" | "pending_review" | "published" | "rejected";

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
  distanceKm: number | null;
  openingHours: string | null;
  cancellationPolicy: CancellationPolicy;
  photos: string[];
}

export interface ListingResponse {
  listing: Listing | null;
  parking: { id: string; name: string; address: string | null; shuttleTravelMinutes: number };
}

export interface PricingTier {
  days: number;
  priceCents: number;
}

export interface Pricing {
  tiers: PricingTier[];
  extraDayPriceCents: number | null;
  commissionBps: number | null;
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
  managerName: string;
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
  createdAt: string;
  isPlatform: boolean;
  /** Fictional operator of the demo seed (backend `npm run seed:demo`). */
  isDemo?: boolean;
  parkings: number;
  places: number;
  manager: { name: string; email: string; emailVerified: boolean } | null;
  listing: { id: string; status: ListingStatus } | null;
  payments: StripeState;
  commissionBps: number | null;
  bookingsThisMonth: number;
  invitation: { sentAt: string; expiresAt: string; expired: boolean } | null;
}

export interface PlatformOperators {
  defaultCommissionBps: number | null;
  operators: PlatformOperator[];
}

export interface InviteInput {
  operatorName: string;
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
  parking: { id: string; name: string; address: string | null; totalCapacity: number };
  operator: { id: string; name: string; status: OperatorStatus };
  pricingTiers: PricingTier[];
  fromPriceCents: number | null;
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

export type PlatformReservations = Paginated<PlatformReservation> & { operators: { id: string; name: string }[] };

export type PayoutSchedule = "AFTER_STAY" | "AT_DROP_OFF" | "WEEKLY" | "MONTHLY";

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
    failed: { reservationId: string; reference: string; amountCents: number | null; arrivalAt: string; returnAt: string }[];
  }[];
}

// ---- SMS to travellers (the operator's channel) ----------------------------------------------

export type SmsMode = "gateway" | "brevo" | "none";

/** GET /internal/sms/settings. The gateway password is never returned. */
export interface SmsSettings {
  mode: SmsMode;
  /** "Plazo envoie pour moi" exists only while the platform has Brevo. */
  brevoAvailable: boolean;
  gateway: { baseUrl: string | null; login: string; senderPhone: string | null; linkedAt: string | null } | null;
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
  vehicle: { model: string | null; colour: string | null; plate: string | null };
  stop: ShuttleStop | null;
  passengers: number;
  startedAt: string;
  expiresAt: string;
  position: { lat: number; lng: number } | null;
  positionAgeSeconds: number | null;
  toStop: { distanceM: number; etaMinutes: number } | null;
  toParking: { distanceM: number; etaMinutes: number } | null;
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
  | "wave_overflow";

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
}

/** The pro space's home (05/10/2026). */
export interface Dashboard {
  serverTime: string;
  date: string;
  parking: { id: string; name: string; timezone: string; bookableCapacity: number; plannedSpots: number };
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
    flights: { configured: boolean; provider: string | null; lastCheckedAt: string | null };
    sms: { mode: string; pending: number; stale: boolean; lastSentAt: string | null };
    push: { configured: boolean; devices: number };
    stripe: { connected: boolean; payoutsEnabled: boolean };
    lastImportAt: string | null;
  };
  alerts: DashboardAlert[];
  /** The next shuttle wave still to run today (V-A). */
  nextWave: { leaveAt: string; direction: ShuttleDirection; stopName: string | null; passengers: number; vehiclesNeeded: number | null; flights: string[] } | null;
  breakdown: { onSiteQuiet: number; toPlaceToday: number; returnsThisWeek: number; toTreat: number; freeSpots: number | null };
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
  times: { shuttleTravelMinutes: number; terminalLeadMinutes: number; landingDelayMinutes: number };
  seats: number | null;
  vehiclesInService: number;
  waves: ShuttleWave[];
}
