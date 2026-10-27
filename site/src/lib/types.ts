// Shapes of the backend's public API (/api/public/...). Datetimes are local parking times "YYYY-MM-DDTHH:mm".

export type Service =
  | "shuttle"
  | "valet"
  | "covered"
  | "ev_charging"
  | "open_24h"
  | "fenced"
  | "cctv";
export type CancellationPolicy =
  | "free_until_arrival"
  | "free_24h"
  | "free_48h"
  | "non_refundable";
export type BookingStatus =
  | "pending_payment"
  | "upcoming"
  | "arrived"
  | "shuttled_out"
  | "return_requested"
  | "back_at_parking"
  | "returned"
  | "cancelled"
  | "no_show";

/** How travellers pay on the site: by card online (Stripe), or at the parking. */
export type PaymentsMode = "online" | "on_site";
/** A parking's booking on the site: paid online, paid at the parking, or not bookable online yet. */
export type ParkingPayment = "online" | "on_site" | "unavailable";
export type PaymentStatus = "pending" | "paid" | "expired" | "refunded";

export interface ListingSummary {
  slug: string;
  title: string;
  /** Known services, possibly with values this site does not know yet. */
  services: string[];
  shuttleMinutes: number | null;
  /** Average wait for the shuttle as the operator declares it (14/10/2026, « ATTENTE MOY. »); null or missing: not declared. */
  shuttleWaitMinutes?: number | null;
  distanceKm: number | null;
  openingHours: string | null;
  cancellationPolicy: CancellationPolicy;
  photo: string | null;
  /** Entrance of the parking for the map; null (or missing from an older API) when unknown. */
  location?: LatLng | null;
  /** Missing from an older API: paid at the parking. */
  payment?: ParkingPayment;
  /** Fictional parking of the demo data (a small "Démo" badge); missing from an older API. */
  isDemo?: boolean;
  /** R-B + I-C (07/10/2026): the parking shows its shuttles to the travellers ("EN DIRECT"); missing from an older API. */
  liveShuttle?: boolean;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** GET /public/airports/:slug/live (K-A): the airport's parkings and the shuttles on the road, anonymous. */
export interface AirportLive {
  serverTime: string;
  airport: { code: string; name: string; slug: string; location: LatLng };
  parkings: {
    slug: string;
    title: string;
    services: string[];
    shuttleMinutes: number | null;
    location: LatLng | null;
    liveShuttle?: boolean;
  }[];
  shuttles: LiveShuttle[];
}

export interface LiveShuttle {
  id: string;
  /** Slug of the parking the shuttle belongs to. */
  parking: string;
  direction: "pickup" | "dropoff";
  vehicle: { model: string | null; colour: string | null };
  position: LatLng | null;
  positionAgeSeconds: number | null;
  startedAt: string;
  /** I-C: computed in the browser from the previous position (never sent by the API). */
  heading?: number | null;
}

export interface AirportResponse {
  /** Missing from an older API: paid at the parking. */
  payments?: PaymentsMode;
  airport: {
    code: string;
    name: string;
    city: string;
    slug: string;
    timezone: string;
    location?: LatLng | null;
  };
  /** Lowest package price and the number of days it covers ("dès 15,00 € la journée"). */
  listings: (ListingSummary & {
    fromPriceCents: number | null;
    fromDays?: number | null;
  })[];
}

/**
 * Night fees of a stay (12/10/2026): what a drop-off and a return booked within the parking's night hours add.
 * Each end counts on its own (both add up); the amounts are already in the total (`priceCents`).
 */
export interface NightFee {
  arrivalCents: number;
  returnCents: number;
  totalCents: number;
}

/**
 * A parking's night rule: a drop-off or a return booked from `start` (included) to `end` (excluded), local
 * "HH:mm", the window possibly crossing midnight ("22:00" → "06:00"), pays the fee of that end (null: none).
 */
export interface NightRule {
  start: string;
  end: string;
  arrivalFeeCents: number | null;
  returnFeeCents: number | null;
}

export interface Offer {
  available: boolean;
  days: number;
  /** Total for the stay, night fees included: what the traveller pays. */
  priceCents: number | null;
  /** The price grid's part of the total (« Forfait N jours »); missing from an older API. */
  basePriceCents?: number | null;
  /** The night fees in the total; null when the stay pays none (missing from an older API). */
  nightFee?: NightFee | null;
}

export type SearchResult = ListingSummary & Offer;

export interface SearchResponse {
  /** Missing from an older API: paid at the parking. */
  payments?: PaymentsMode;
  airport: {
    code: string;
    name: string;
    slug: string;
    location?: LatLng | null;
  };
  results: SearchResult[];
}

export interface PricingTier {
  days: number;
  priceCents: number;
}

export interface ParkingResponse {
  /** Missing from an older API: paid at the parking. */
  payments?: PaymentsMode;
  airport: {
    code: string;
    name: string;
    slug: string;
    location?: LatLng | null;
  };
  parking: ListingSummary & {
    description: string | null;
    photos: string[];
    address: string | null;
    /** Phone travellers can call, when the parking gave one. */
    phone?: string | null;
    pricing: {
      tiers: PricingTier[];
      extraDayPriceCents: number | null;
      /** The parking's night fees; null when it charges none (missing from an older API). */
      night?: NightRule | null;
    };
  };
  offer: Offer | null;
}

/**
 * Child car seats for the shuttle (24/10/2026, direction B « par âge »): how many children of each age group ride
 * along; the parking installs the seats, both ways, for free. Children count in `passengers` (one adult at least).
 */
export interface ChildSeats {
  /** Up to 12 months: rear-facing seat. */
  infant: number;
  /** 1 to 4 years: child seat. */
  toddler: number;
  /** 4 to 10 years: booster. */
  booster: number;
}

export interface BookingInput {
  airport: string;
  parking: string;
  arrivalAt: string;
  returnAt: string;
  /** Each is required by the API; it stores "Prénom Nom" as the display name. */
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  plate: string;
  returnFlight?: string;
  departureFlight?: string;
  passengers: number;
  /** E (06/10/2026): a message for the parking, and the vehicle so the valet spots it. */
  customerNote?: string;
  vehicleModel?: string;
  vehicleColour?: string;
  /** Child seats for the shuttle; sent only when at least one is asked (each 0 to 4, fewer than `passengers`). */
  childSeats?: Partial<ChildSeats>;
  /** Must be true; false gets the "terms_required" field error back. */
  acceptTerms: boolean;
  /** Random key of the booking form: sending it again returns the booking already made. */
  idempotencyKey?: string;
}

export interface PublicBooking {
  reference: string;
  status: BookingStatus;
  /** "online": paid by card on the site; "on_site": paid at the parking. */
  paymentMode: "on_site" | "online";
  /** Online payment; null when paid at the parking (missing from an older API). */
  payment?: {
    status: PaymentStatus;
    /** End of the place's hold (UTC, ISO 8601) while the payment is pending. */
    holdExpiresAt: string | null;
    /** Seconds left on the hold when the API answered. */
    holdSecondsLeft: number | null;
  } | null;
  parking: {
    title: string;
    slug: string;
    airport: { slug: string; name: string };
    address: string | null;
    shuttleMinutes: number | null;
    openingHours: string | null;
    phone?: string | null;
  };
  arrivalAt: string;
  returnAt: string;
  days: number;
  /** Total of the stay, night fees included, computed by the API (null if the stay could not be priced). */
  priceCents: number | null;
  /**
   * The night fees charged at booking, frozen on the reservation (never recomputed), and the rest of the total
   * (`basePriceCents`, the price grid's part); both missing from an older API.
   */
  basePriceCents?: number | null;
  nightFee?: NightFee | null;
  /** Display form "Prénom Nom", computed by the API from the two fields below. */
  customerName: string;
  /** As typed by the traveller (missing from an older API). */
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail: string | null;
  customerPhone: string;
  plate: string;
  /** E (06/10/2026): the traveller's message for the parking, and their vehicle (missing from an older API). */
  customerNote?: string | null;
  vehicle?: { model: string | null; colour: string | null };
  returnFlight: string | null;
  /** Outbound flight (V-A, 05/10/2026) and, when tracked, when the shuttle to the terminal leaves (local). */
  departureFlight: string | null;
  car: CarLocation | null;
  outbound: {
    status: string | null;
    scheduledAt: string | null;
    estimatedAt: string | null;
    terminal: string | null;
    shuttleAt: string | null;
  } | null;
  passengers: number;
  /** Child seats for the shuttle (zeros when none); missing from an older API. */
  childSeats?: ChildSeats;
  cancellationPolicy: CancellationPolicy;
  /** Local datetime until which the traveller may cancel online; null when non-refundable. */
  cancellableUntil: string | null;
  canCancel: boolean;
  canEditFlight: boolean;
}

export interface CreatedBooking {
  reference: string;
  manageToken: string;
  booking: PublicBooking;
}

export interface BookingAccess {
  reference: string;
  manageToken: string;
}

/** GET /api/public/app-link/:code (27/10/2026): what the rebound page needs to open or name a booking. */
export interface AppLinkTarget extends BookingAccess {
  firstName: string;
  parking: { title: string };
  /** Local time of the parking, "YYYY-MM-DDTHH:mm". */
  arrivalAt: string;
  returnAt: string;
}

/** The payment page to go to, or the news that the booking is already paid. */
export type CheckoutResult = { url: string } | { paid: true };

export interface SiteConfig {
  payments: PaymentsMode;
}

/** GET /api/public/bookings/:ref/return (the app's return day), read live by the booking page. */
/** GET /public/bookings/:ref/arrival (D, 06/10/2026): the "Prévenir de mon arrivée" block, as in the app. */
export type ArrivalKind = "outbound" | "return";
export type ArrivalSignalState =
  | "sharing"
  | "announced"
  | "at_meeting_point"
  | "ended";
export interface TravellerArrival {
  reference: string;
  /** The moment offered now (open) or the next one (opensAt); null when nothing is left. */
  moment: {
    kind: ArrivalKind;
    open: boolean;
    opensAt: string;
    closesAt: string;
  } | null;
  meetingPoint: {
    lat: number;
    lng: number;
    source: "parking" | "return_point" | "airport";
    label: string | null;
    instructions?: string | null;
    photoUrl?: string | null;
  } | null;
  signal: {
    kind: ArrivalKind;
    state: ArrivalSignalState;
    endReason: string | null;
    startedAt: string;
    expiresAt: string;
    secondsLeft: number;
    distanceM: number | null;
    etaMinutes: number | null;
    etaAt: string | null;
    announcedMinutes: number | null;
    atMeetingPointAt: string | null;
    positionUpdatedAt: string | null;
    /** E: the traveller's word for the parking. */
    note?: string | null;
  } | null;
  rules: {
    maxMinutes: number;
    arrivedWithinMeters: number;
    positionIntervalSeconds: number;
    announceMinutes: number[];
  };
}

/** GET /public/bookings/:ref/shuttles (S-A): the parking's shuttles on the road during the stay. */
export interface StayShuttles {
  /** null: outside the arrival day → return day window (the block is hidden). */
  phase: "arrival" | "stay" | "return" | null;
  serverTime: string;
  shuttles: TravellerShuttle[];
}

export interface TravellerShuttle {
  tripId: string;
  direction: "pickup" | "dropoff";
  mine: boolean;
  startedAt: string;
  vehicle: {
    model: string | null;
    colour: string | null;
    plate: string | null;
  };
  driverFirstName: string;
  position: LatLng | null;
  positionAgeSeconds: number | null;
  distanceM: number | null;
  etaMinutes: number | null;
  etaAt: string | null;
  destination: {
    kind: "parking" | "meeting_point";
    lat: number;
    lng: number;
    label: string | null;
  } | null;
}

export interface TravellerReturn {
  reference: string;
  status: BookingStatus;
  returnAt: string;
  returnDay: boolean;
  flight: {
    number: string | null;
    status: string | null;
    scheduledAt: string | null;
    estimatedAt: string | null;
    landedAt: string | null;
    landedSource: string | null;
    terminal: string | null;
    gate: string | null;
  };
  flightTracked: boolean;
  meetingPoint: {
    lat: number;
    lng: number;
    label: string | null;
    instructions: string | null;
    photoUrl?: string | null;
  } | null;
  atMeetingPointAt: string | null;
  shuttle: {
    tripId: string;
    direction: "pickup" | "dropoff";
    mine: boolean;
    startedAt: string;
    vehicle: {
      model: string | null;
      colour: string | null;
      plate: string | null;
    };
    driverFirstName: string;
    position: LatLng | null;
    positionAgeSeconds: number | null;
    distanceM: number | null;
    etaMinutes: number | null;
    etaAt: string | null;
  } | null;
  parking: {
    name: string;
    phone: string | null;
    shuttleMinutes: number | null;
    address: string | null;
    location: LatLng | null;
  };
  plate: string;
  spot: { code: string; stayClass: string | null } | null;
  /** S-C (07/10/2026): the file the valet put the car in and its position from the aisle (1 = first out). */
  file: { code: string; position: number | null } | null;
  /** E (06/10/2026): what the traveller signalled today ("mon vol a du retard", "bagage perdu"). */
  notice?: ReturnNotice | null;
  /** Where the car is parked (06/10/2026), recorded by the traveller or the valet; null until then. */
  car: CarLocation | null;
}

export interface CarLocation {
  lat: number;
  lng: number;
  accuracyM: number | null;
  at: string;
  by: "traveller" | "staff";
  note: string | null;
}

export type ReturnNoticeKind = "flight_delayed" | "luggage" | "other";
export interface ReturnNotice {
  kind: ReturnNoticeKind;
  text: string | null;
  at: string;
}
