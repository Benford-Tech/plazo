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
  bookableCapacity: number;
}

export interface ParkingSettings {
  name: string;
  address: string | null;
  totalCapacity: number;
  safetyMarginPct: number;
  shuttleTravelMinutes: number;
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
  arrivalAt: string;
  returnAt: string;
  passengers: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  plate: string;
  returnFlight: string | null;
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

export interface ShuttleVehicle {
  id: string;
  model: string;
  colour: string | null;
  plate: string | null;
}

export interface Planning {
  date: string;
  timezone: string;
  parking: { id: string; name: string; bookableCapacity: number };
  arrivals: PlanningRow[];
  returns: PlanningRow[];
  nights: NightLoad[];
  stats: { arrivals: number; arrived: number; returns: number; returnsWithFlight: number };
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
