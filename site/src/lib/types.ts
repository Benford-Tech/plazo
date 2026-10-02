// Shapes of the backend's public API (/api/public/...). Datetimes are local parking times "YYYY-MM-DDTHH:mm".

export type Service = "shuttle" | "valet" | "covered" | "ev_charging" | "open_24h" | "fenced" | "cctv";
export type CancellationPolicy = "free_until_arrival" | "free_24h" | "free_48h" | "non_refundable";
export type BookingStatus = "upcoming" | "arrived" | "shuttled_out" | "return_requested" | "returned" | "cancelled" | "no_show";

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
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AirportResponse {
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
  airport: { code: string; name: string; slug: string; location?: LatLng | null };
  results: SearchResult[];
}

export interface PricingTier {
  days: number;
  priceCents: number;
}

export interface ParkingResponse {
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
  passengers: number;
  /** Must be true; false gets the "terms_required" field error back. */
  acceptTerms: boolean;
  /** Random key of the booking form: sending it again returns the booking already made. */
  idempotencyKey?: string;
}

export interface PublicBooking {
  reference: string;
  status: BookingStatus;
  paymentMode: "on_site";
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
