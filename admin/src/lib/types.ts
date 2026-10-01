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
export type ReservationChannel = "website" | "phone" | "counter" | "aggregator" | "import";

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

export interface Planning {
  date: string;
  timezone: string;
  parking: { id: string; name: string; bookableCapacity: number };
  arrivals: Reservation[];
  returns: Reservation[];
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

export interface Listing {
  id: string;
  slug: string;
  published: boolean;
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
  published: boolean;
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
