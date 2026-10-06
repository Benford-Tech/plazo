// Shapes of the backend's public API (/api/public/...). Datetimes are local parking times "YYYY-MM-DDTHH:mm".

export type Service = "shuttle" | "valet" | "covered" | "ev_charging" | "open_24h" | "fenced" | "cctv";
export type CancellationPolicy = "free_until_arrival" | "free_24h" | "free_48h" | "non_refundable";
export type BookingStatus = "pending_payment" | "upcoming" | "arrived" | "shuttled_out" | "return_requested" | "back_at_parking" | "returned" | "cancelled" | "no_show";

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
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** GET /public/airports/:slug/live (K-A): the airport's parkings and the shuttles on the road, anonymous. */
export interface AirportLive {
  serverTime: string;
  airport: { code: string; name: string; slug: string; location: LatLng };
  parkings: { slug: string; title: string; services: string[]; shuttleMinutes: number | null; location: LatLng | null }[];
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
}

export interface AirportResponse {
  /** Missing from an older API: paid at the parking. */
  payments?: PaymentsMode;
  airport: { code: string; name: string; city: string; slug: string; timezone: string; location?: LatLng | null };
  /** Lowest package price and the number of days it covers ("dès 15,00 € la journée"). */
  listings: (ListingSummary & { fromPriceCents: number | null; fromDays?: number | null })[];
}

export interface Offer {
  available: boolean;
  days: number;
  priceCents: number | null;
}

export type SearchResult = ListingSummary & Offer;

export interface SearchResponse {
  /** Missing from an older API: paid at the parking. */
  payments?: PaymentsMode;
  airport: { code: string; name: string; slug: string; location?: LatLng | null };
  results: SearchResult[];
}

export interface PricingTier {
  days: number;
  priceCents: number;
}

export interface ParkingResponse {
  /** Missing from an older API: paid at the parking. */
  payments?: PaymentsMode;
  airport: { code: string; name: string; slug: string; location?: LatLng | null };
  parking: ListingSummary & {
    description: string | null;
    photos: string[];
    address: string | null;
    /** Phone travellers can call, when the parking gave one. */
    phone?: string | null;
    pricing: { tiers: PricingTier[]; extraDayPriceCents: number | null };
  };
  offer: Offer | null;
}

export interface BookingInput {
  airport: string;
  parking: string;
  arrivalAt: string;
  returnAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  plate: string;
  returnFlight?: string;
  departureFlight?: string;
  passengers: number;
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
  /** Total to pay at the parking, computed by the API (null if the stay could not be priced). */
  priceCents: number | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  plate: string;
  returnFlight: string | null;
  /** Outbound flight (V-A, 05/10/2026) and, when tracked, when the shuttle to the terminal leaves (local). */
  departureFlight: string | null;
  car: CarLocation | null;
  outbound: { status: string | null; scheduledAt: string | null; estimatedAt: string | null; terminal: string | null; shuttleAt: string | null } | null;
  passengers: number;
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

/** The payment page to go to, or the news that the booking is already paid. */
export type CheckoutResult = { url: string } | { paid: true };

export interface SiteConfig {
  payments: PaymentsMode;
}

/** GET /api/public/bookings/:ref/return (the app's return day), read live by the booking page. */
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
  meetingPoint: { lat: number; lng: number; label: string | null; instructions: string | null } | null;
  atMeetingPointAt: string | null;
  shuttle: {
    tripId: string;
    direction: "pickup" | "dropoff";
    mine: boolean;
    startedAt: string;
    vehicle: { model: string | null; colour: string | null; plate: string | null };
    driverFirstName: string;
    position: LatLng | null;
    positionAgeSeconds: number | null;
    distanceM: number | null;
    etaMinutes: number | null;
    etaAt: string | null;
  } | null;
  parking: { name: string; phone: string | null; shuttleMinutes: number | null; address: string | null; location: LatLng | null };
  plate: string;
  spot: { code: string; stayClass: string | null } | null;
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
