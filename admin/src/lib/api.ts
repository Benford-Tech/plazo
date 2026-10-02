import type {
  CapacityPreview,
  EmailImportResult,
  ListingInput,
  ListingResponse,
  Listing,
  Pricing,
  PricingTier,
  NewStaff,
  Paginated,
  Parking,
  ParkingSettings,
  Planning,
  Reservation,
  ReservationInput,
  ReservationStatus,
  Staff,
  StaffRole,
  TokenData,
} from "./types";

import type { CapacityStudy, CapacityStudySummary, GeoPolygon, ParcelRef, StudyPatch } from "./capacity/types";

export interface ParcelFeature extends ParcelRef {
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
}
export interface ParkingFeature {
  id: string;
  name: string | null;
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
}
export interface GeocodeResult {
  label: string;
  type: string;
  lon: number;
  lat: number;
}
export type { GeoPolygon };

// Same origin by default (/api, proxied to the backend in development); VITE_API_URL overrides it.
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TOKENS_KEY = "plazo_admin_tokens";

/** API error with the backend's machine-readable code and per-field validation codes. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public fields?: Record<string, string>,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getTokens(): TokenData | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as TokenData) : null;
  } catch {
    return null;
  }
}

export function setTokens(tokens: TokenData) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(TOKENS_KEY);
}

// One refresh at a time: parallel 401s wait for the same rotation.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getTokens()?.refresh?.token;
  if (!refreshToken) return null;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}/internal/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const { tokenData } = (await res.json()) as { tokenData: TokenData };
      setTokens(tokenData);
      return tokenData.access.token;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function apiRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const send = (token?: string) =>
    fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
      },
    });

  let res = await send(getTokens()?.access?.token);
  if (res.status === 401 && getTokens()?.refresh?.token && !endpoint.startsWith("/internal/auth/")) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await send(fresh);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`, body.code, body.fields, body.details);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

const json = (body: unknown) => JSON.stringify(body);

export const adminApi = {
  login: (email: string, password: string) =>
    apiRequest<{ tokenData: TokenData; user: Staff }>("/internal/auth/login", { method: "POST", body: json({ email, password }) }),
  logout: () => apiRequest<void>("/internal/auth/logout", { method: "POST" }),
  getMe: () => apiRequest<Staff>("/internal/staff/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ message: string }>("/internal/staff/me/password", { method: "PATCH", body: json({ currentPassword, newPassword }) }),

  getParking: () => apiRequest<Parking>("/internal/parking"),
  updateParking: (id: string, settings: ParkingSettings) =>
    apiRequest<{ data: Parking }>(`/internal/parkings/${id}`, { method: "PATCH", body: json(settings) }),

  getTeam: () => apiRequest<Staff[]>("/internal/staff"),
  createStaff: (staff: NewStaff) => apiRequest<{ data: Staff }>("/internal/staff", { method: "POST", body: json(staff) }),
  updateStaff: (id: string, patch: { role?: StaffRole; isActive?: boolean }) =>
    apiRequest<{ data: Staff }>(`/internal/staff/${id}`, { method: "PATCH", body: json(patch) }),
  resetStaffPassword: (id: string, password: string) =>
    apiRequest<{ message: string }>(`/internal/staff/${id}/reset-password`, { method: "POST", body: json({ password }) }),

  getPlanning: (date?: string) => apiRequest<Planning>(`/internal/planning${date ? `?date=${date}` : ""}`),
  previewCapacity: (arrivalAt: string, returnAt: string, excludeId?: string) =>
    apiRequest<CapacityPreview>(
      `/internal/capacity?${new URLSearchParams({ arrivalAt, returnAt, ...(excludeId ? { excludeId } : {}) }).toString()}`,
    ),
  searchReservations: (params: { q?: string; page?: number }) =>
    apiRequest<Paginated<Reservation>>(
      `/internal/reservations?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), page: String(params.page ?? 1) }).toString()}`,
    ),
  getReservation: (id: string) => apiRequest<Reservation>(`/internal/reservations/${id}`),
  createReservation: (input: ReservationInput) => apiRequest<{ data: Reservation }>("/internal/reservations", { method: "POST", body: json(input) }),
  updateReservation: (id: string, input: Partial<ReservationInput>) =>
    apiRequest<{ data: Reservation }>(`/internal/reservations/${id}`, { method: "PATCH", body: json(input) }),
  parseEmail: (text: string) => apiRequest<EmailImportResult>("/internal/imports/email", { method: "POST", body: json({ text }) }),
  getListing: () => apiRequest<ListingResponse>("/internal/listing"),
  updateListing: (input: ListingInput) => apiRequest<{ data: Listing }>("/internal/listing", { method: "PUT", body: json(input) }),
  getPricing: () => apiRequest<Pricing>("/internal/pricing"),
  updatePricing: (tiers: PricingTier[], extraDayPriceCents: number | null) =>
    apiRequest<{ data: Pricing }>("/internal/pricing", { method: "PUT", body: json({ tiers, extraDayPriceCents }) }),

  // Internal tools of the platform owner (capacity estimator).
  listCapacityStudies: () => apiRequest<CapacityStudySummary[]>("/internal/platform/capacity-studies"),
  getCapacityStudy: (id: string) => apiRequest<CapacityStudy>(`/internal/platform/capacity-studies/${id}`),
  createCapacityStudy: (name: string) =>
    apiRequest<{ data: CapacityStudy }>("/internal/platform/capacity-studies", { method: "POST", body: json({ name }) }),
  updateCapacityStudy: (id: string, patch: StudyPatch) =>
    apiRequest<{ data: CapacityStudy }>(`/internal/platform/capacity-studies/${id}`, { method: "PATCH", body: json(patch) }),
  deleteCapacityStudy: (id: string) => apiRequest<void>(`/internal/platform/capacity-studies/${id}`, { method: "DELETE" }),
  parcelsAt: (lon: number, lat: number) =>
    apiRequest<{ parcels: ParcelFeature[] }>(`/internal/platform/geo/parcels?${new URLSearchParams({ lon: String(lon), lat: String(lat) }).toString()}`),
  parkingsIn: (bbox: [number, number, number, number]) =>
    apiRequest<{ parkings: ParkingFeature[] }>(`/internal/platform/geo/parkings?bbox=${bbox.map(n => n.toFixed(6)).join(",")}`),
  geocode: (q: string) => apiRequest<{ results: GeocodeResult[] }>(`/internal/platform/geo/geocode?${new URLSearchParams({ q }).toString()}`),

  changeReservationStatus: (id: string, status: ReservationStatus) =>
    apiRequest<{ data: Reservation }>(`/internal/reservations/${id}/status`, { method: "POST", body: json({ status }) }),
};
