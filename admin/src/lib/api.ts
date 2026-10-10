import type {
  FileBoard,
  FileChoice,
  FileInput,
  FilesPlanning,
  ParkingFile,
} from "@/lib/plan/parkingFiles";
import type {
  Airport,
  Dashboard,
  LiveShuttles,
  InboundSettings,
  InboundEmail,
  InboundEmailList,
  InboundReanalysis,
  InboundEmailView,
  MeetingPoint,
  PickupRow,
  DepartureRow,
  StaffTrip,
  StartTripInput,
  ShuttleForecast,
  FlightCheck,
  CapacityPreview,
  InvitationResult,
  InviteInput,
  PlatformListings,
  PlatformOperators,
  OperatorDeletion,
  PaymentStatus,
  PayoutSchedule,
  PlatformPayments,
  SmsSettings,
  SmsSettingsInput,
  SmsStatus,
  PlatformReservations,
  ReminderBoard,
  ReminderSettingsInput,
  ShuttleTracking,
  SignupInput,
  ListingInput,
  ListingResponse,
  Listing,
  DescriptionSuggestion,
  Pricing,
  PricingTier,
  NewStaff,
  Paginated,
  ReservationPage,
  Parking,
  ParkingSettings,
  PlatformAudience,
  PlatformNotification,
  PlatformNotificationInput,
  ReturnMeetingPoint,
  ShuttleStop,
  ShuttleStopInput,
  ShuttleVehicle,
  ShuttleVehicleInput,
  LiveArrivals,
  Planning,
  Reservation,
  ReservationInput,
  ReservationStatus,
  Staff,
  StaffRole,
  TokenData,
  Staying,
  RevenueBasis,
  RevenueReport,
  RevenueSummary,
} from "./types";

import type {
  CapacityStudy,
  CapacityStudySummary,
  GeoPolygon,
  LayoutKey,
  ParcelRef,
  StudyPatch,
} from "./capacity/types";
import type { OccupationBoard, VehicleHit } from "./plan/occupation";
import type { PreassignResult, SpotPlanning } from "./plan/spotPlanning";
import type {
  ParkingPlanView,
  PlanPatch,
  Spot,
  SpotInput,
  SpotKind,
} from "./plan/types";
import type {
  ZoneSuggestion,
  ZoneSuggestionOptions,
} from "@/lib/capacity/types";

export interface ParcelFeature extends ParcelRef {
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
}
export interface ParkingFeature {
  id: string;
  name: string | null;
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
}

/** A BD TOPO building (B-A). */
export interface BuildingFeature {
  id: string;
  nature: string | null;
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
const VIEW_AS_KEY = "plazo_admin_view_as";
/** Development only: the email confirmation link the API returns when it could not email it. */
export const DEV_VERIFICATION_KEY = "plazo_dev_verification_url";
/** Fired when the view-as session stops working (expired or revoked). */
export const VIEW_AS_ENDED_EVENT = "plazo:view-as-ended";

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

/**
 * "Ouvrir son espace": a platform admin's short-lived session scoped to one operator. While it is
 * set, every call of the operator's space uses it; the auth and platform routes keep the person's
 * own session.
 */
export interface ViewAsSession {
  token: string;
  expires: string;
  operator: { id: string; name: string };
}

export function getViewAs(): ViewAsSession | null {
  try {
    const raw = localStorage.getItem(VIEW_AS_KEY);
    const session = raw ? (JSON.parse(raw) as ViewAsSession) : null;
    return session && new Date(session.expires).getTime() > Date.now()
      ? session
      : null;
  } catch {
    return null;
  }
}

export function setViewAs(session: ViewAsSession) {
  localStorage.setItem(VIEW_AS_KEY, JSON.stringify(session));
}

export function clearViewAs() {
  localStorage.removeItem(VIEW_AS_KEY);
}

const usesOwnSession = (endpoint: string) =>
  endpoint.startsWith("/internal/platform") ||
  endpoint.startsWith("/internal/auth/");

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

/** A call with the session's token (refreshed once on a 401); errors become ApiError. */
async function authorizedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const send = (token?: string) =>
    fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
      },
    });

  const viewAs = usesOwnSession(endpoint) ? null : getViewAs();
  let res = await send(viewAs?.token ?? getTokens()?.access?.token);
  if (res.status === 401 && viewAs) {
    // No refresh for a view-as session: back to the platform.
    clearViewAs();
    window.dispatchEvent(new Event(VIEW_AS_ENDED_EVENT));
    throw new ApiError(401, "View-as session ended", "view_as_ended");
  }
  if (
    res.status === 401 &&
    getTokens()?.refresh?.token &&
    !endpoint.startsWith("/internal/auth/")
  ) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await send(fresh);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.message ?? `HTTP ${res.status}`,
      body.code,
      body.fields,
      body.details,
    );
  }
  return res;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await authorizedFetch(endpoint, options);
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

/** A file the API sends (a CSV export), with the name it gives it. */
export async function apiFile(endpoint: string): Promise<{ blob: Blob; filename: string | null }> {
  const res = await authorizedFetch(endpoint);
  const filename = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? null;
  return { blob: await res.blob(), filename };
}

const json = (body: unknown) => JSON.stringify(body);

export type GeoScope = "operator" | "platform";
const geoBase = (scope: GeoScope) =>
  scope === "platform" ? "/internal/platform/geo" : "/internal/geo";

export const adminApi = {
  login: (email: string, password: string) =>
    apiRequest<{ tokenData: TokenData; user: Staff }>("/internal/auth/login", {
      method: "POST",
      body: json({ email, password }),
    }),
  logout: () => apiRequest<void>("/internal/auth/logout", { method: "POST" }),
  getMe: () => apiRequest<Staff>("/internal/staff/me"),
  /** 09/10/2026: one's own first and last name; answers like getMe. */
  updateMe: (names: { firstName: string; lastName: string }) =>
    apiRequest<Staff>("/internal/staff/me", {
      method: "PATCH",
      body: json(names),
    }),
  signup: (input: SignupInput) =>
    apiRequest<{ message: string; devVerificationUrl?: string }>(
      "/internal/auth/signup",
      { method: "POST", body: json(input) },
    ),
  getAirports: () => apiRequest<Airport[]>("/public/airports"),
  verifyEmail: (token: string) =>
    apiRequest<{ verified: true }>("/internal/auth/verify-email", {
      method: "POST",
      body: json({ token }),
    }),
  resendVerification: () =>
    apiRequest<{ alreadyVerified: boolean; devVerificationUrl?: string }>(
      "/internal/auth/verify-email/resend",
      { method: "POST" },
    ),
  getInvitation: (token: string) =>
    apiRequest<{ email: string; operatorName: string }>(
      "/internal/auth/invitation",
      { method: "POST", body: json({ token }) },
    ),
  acceptInvitation: (token: string, password: string) =>
    apiRequest<{ tokenData: TokenData; user: Staff }>(
      "/internal/auth/invitation/accept",
      { method: "POST", body: json({ token, password }) },
    ),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ message: string }>("/internal/staff/me/password", {
      method: "PATCH",
      body: json({ currentPassword, newPassword }),
    }),

  getParking: () => apiRequest<Parking>("/internal/parking"),
  getReturnMeetingPoint: () =>
    apiRequest<{ data: ReturnMeetingPoint | null }>(
      "/internal/parking/return-meeting-point",
    ),
  setReturnMeetingPoint: (point: ReturnMeetingPoint | null) =>
    apiRequest<{ data: ReturnMeetingPoint | null }>(
      "/internal/parking/return-meeting-point",
      {
        method: "PUT",
        body: json(point ?? { lat: null, lng: null }),
      },
    ),
  getVehicles: () =>
    apiRequest<{ data: ShuttleVehicle[] }>("/internal/shuttle/vehicles"),
  addVehicle: (vehicle: ShuttleVehicleInput) =>
    apiRequest<{ data: ShuttleVehicle }>("/internal/shuttle/vehicles", {
      method: "POST",
      body: json(vehicle),
    }),
  updateVehicle: (id: string, vehicle: Partial<ShuttleVehicleInput>) =>
    apiRequest<{ data: ShuttleVehicle }>(`/internal/shuttle/vehicles/${id}`, {
      method: "PATCH",
      body: json(vehicle),
    }),
  removeVehicle: (id: string) =>
    apiRequest<void>(`/internal/shuttle/vehicles/${id}`, { method: "DELETE" }),
  // D-A: the places the shuttle serves (the airport first, built in, then the parking's stops).
  getStops: () =>
    apiRequest<{ data: ShuttleStop[] }>("/internal/shuttle/stops"),
  addStop: (stop: ShuttleStopInput) =>
    apiRequest<{ data: ShuttleStop }>("/internal/shuttle/stops", {
      method: "POST",
      body: json(stop),
    }),
  updateStop: (id: string, stop: Partial<ShuttleStopInput>) =>
    apiRequest<{ data: ShuttleStop }>(`/internal/shuttle/stops/${id}`, {
      method: "PATCH",
      body: json(stop),
    }),
  removeStop: (id: string) =>
    apiRequest<void>(`/internal/shuttle/stops/${id}`, { method: "DELETE" }),
  setShuttleTracking: (id: string, tracking: ShuttleTracking) =>
    apiRequest<{ data: Parking }>(`/internal/parkings/${id}/shuttle-tracking`, {
      method: "PUT",
      body: json({ tracking }),
    }),
  updateParking: (id: string, settings: ParkingSettings) =>
    apiRequest<{ data: Parking }>(`/internal/parkings/${id}`, {
      method: "PATCH",
      body: json(settings),
    }),

  // Bloc 2, step "Plan": the operator's parking plan and its spots.
  getParkingPlan: (parkingId: string) =>
    apiRequest<ParkingPlanView>(`/internal/parkings/${parkingId}/plan`),
  updateParkingPlan: (parkingId: string, patch: PlanPatch) =>
    apiRequest<{ data: ParkingPlanView }>(
      `/internal/parkings/${parkingId}/plan`,
      { method: "PATCH", body: json(patch) },
    ),
  /** `includeManual` (a reset) also drops the spots laid by hand, which a regeneration keeps. */
  replaceSpots: (
    parkingId: string,
    layout: LayoutKey,
    spots: SpotInput[],
    options: { includeManual?: boolean } = {},
  ) =>
    apiRequest<{ data: ParkingPlanView }>(
      `/internal/parkings/${parkingId}/plan/spots`,
      {
        method: "PUT",
        body: json({
          layout,
          spots,
          ...(options.includeManual ? { includeManual: true } : {}),
        }),
      },
    ),
  /** P-B (07/10/2026): spots laid by hand, kept through regenerations. */
  addSpots: (parkingId: string, spots: SpotInput[]) =>
    apiRequest<{ data: ParkingPlanView }>(
      `/internal/parkings/${parkingId}/plan/spots`,
      { method: "POST", body: json({ spots }) },
    ),
  deleteSpot: (parkingId: string, spotId: string) =>
    apiRequest<{ data: ParkingPlanView }>(
      `/internal/parkings/${parkingId}/plan/spots/${spotId}`,
      { method: "DELETE" },
    ),
  updateSpot: (
    parkingId: string,
    spotId: string,
    patch: { active?: boolean; kind?: SpotKind; code?: string },
  ) =>
    apiRequest<{ data: Spot }>(
      `/internal/parkings/${parkingId}/plan/spots/${spotId}`,
      { method: "PATCH", body: json(patch) },
    ),
  /** V-A (07/10/2026): Claude reads the IGN photo of the land and proposes the zones (nothing saved). */
  suggestZones: (parkingId: string, options: ZoneSuggestionOptions) =>
    apiRequest<ZoneSuggestion>(
      `/internal/parkings/${parkingId}/plan/suggest-zones`,
      { method: "POST", body: json(options) },
    ),

  // Bloc 2, step "Occupation".
  // S-C (07/10/2026): files as the unit of storage.
  getFiles: (parkingId: string) =>
    apiRequest<FileBoard>(`/internal/parkings/${parkingId}/files`),
  replaceFiles: (parkingId: string, files: FileInput[]) =>
    apiRequest<{ data: ParkingFile[] }>(
      `/internal/parkings/${parkingId}/files`,
      {
        method: "PUT",
        body: json({ files }),
      },
    ),
  filesFromPlan: (parkingId: string) =>
    apiRequest<{ data: ParkingFile[] }>(
      `/internal/parkings/${parkingId}/files/from-plan`,
      { method: "POST" },
    ),
  prepareFiles: (parkingId: string) =>
    apiRequest<{ data: { planned: number; free: number } }>(
      `/internal/parkings/${parkingId}/files/prepare`,
      { method: "POST" },
    ),
  // "Planning des files" (07/10/2026): the coming days in files, a file kept by hand for a return day.
  // Without `from`, the server starts the window on the parking's local day.
  getFilesPlanning: (parkingId: string, days: number, from?: string) =>
    apiRequest<FilesPlanning>(
      `/internal/parkings/${parkingId}/files/planning?${new URLSearchParams({
        days: String(days),
        ...(from ? { from } : {}),
      }).toString()}`,
    ),
  keepFile: (parkingId: string, fileId: string, day: string | null) =>
    apiRequest<{ data: ParkingFile }>(
      `/internal/parkings/${parkingId}/files/${fileId}/keep`,
      { method: "PUT", body: json({ day }) },
    ),
  fileChoices: (parkingId: string, reservationId: string) =>
    apiRequest<{ choices: FileChoice[] }>(
      `/internal/parkings/${parkingId}/files/choices?${new URLSearchParams({ reservationId }).toString()}`,
    ),
  assignFile: (
    reservationId: string,
    patch: { fileId: string | null; keyHook?: string | null },
  ) =>
    apiRequest<{
      data: Reservation & {
        file: { id: string; code: string; name: string | null } | null;
        filePosition: number | null;
      };
    }>(`/internal/reservations/${reservationId}/file`, {
      method: "POST",
      body: json(patch),
    }),
  getOccupation: (parkingId: string) =>
    apiRequest<OccupationBoard>(`/internal/parkings/${parkingId}/occupation`),
  searchVehicles: (parkingId: string, q: string) =>
    apiRequest<{ results: VehicleHit[] }>(
      `/internal/parkings/${parkingId}/occupation/search?${new URLSearchParams({ q }).toString()}`,
    ),
  assignSpot: (
    reservationId: string,
    patch: { spotId: string | null; keyHook?: string | null },
  ) =>
    apiRequest<{ data: Reservation & { spot: { code: string } | null } }>(
      `/internal/reservations/${reservationId}/spot`,
      { method: "POST", body: json(patch) },
    ),

  // Bloc 2, step "Planning des places".
  getSpotPlanning: (parkingId: string, from: string, days: number) =>
    apiRequest<SpotPlanning>(
      `/internal/parkings/${parkingId}/spot-planning?${new URLSearchParams({ from, days: String(days) }).toString()}`,
    ),
  preassignSpots: (parkingId: string, from: string, days: number) =>
    apiRequest<{ data: PreassignResult }>(
      `/internal/parkings/${parkingId}/spot-planning/preassign?${new URLSearchParams({ from, days: String(days) }).toString()}`,
      {
        method: "POST",
      },
    ),

  getTeam: () => apiRequest<Staff[]>("/internal/staff"),
  createStaff: (staff: NewStaff) =>
    apiRequest<{ data: Staff }>("/internal/staff", {
      method: "POST",
      body: json(staff),
    }),
  updateStaff: (
    id: string,
    patch: { role?: StaffRole; isActive?: boolean; firstName?: string; lastName?: string },
  ) =>
    apiRequest<{ data: Staff }>(`/internal/staff/${id}`, {
      method: "PATCH",
      body: json(patch),
    }),
  resetStaffPassword: (id: string, password: string) =>
    apiRequest<{ message: string }>(`/internal/staff/${id}/reset-password`, {
      method: "POST",
      body: json({ password }),
    }),

  getPlanning: (date?: string) =>
    apiRequest<Planning>(`/internal/planning${date ? `?date=${date}` : ""}`),
  getLiveArrivals: () => apiRequest<LiveArrivals>("/internal/arrivals/live"),
  getDashboard: () => apiRequest<Dashboard>("/internal/dashboard"),
  // CA-B + CA-A (09/10/2026): the revenue, managers only.
  getRevenue: (from: string, to: string, basis: RevenueBasis) =>
    apiRequest<RevenueReport>(`/internal/revenue?${new URLSearchParams({ from, to, basis })}`),
  getRevenueSummary: () => apiRequest<RevenueSummary>("/internal/revenue/summary"),
  exportRevenue: (from: string, to: string, basis: RevenueBasis) => apiFile(`/internal/revenue/export?${new URLSearchParams({ from, to, basis })}`),
  setReservationPrice: (id: string, priceCents: number | null) =>
    apiRequest<{ id: string; priceCents: number | null }>(`/internal/reservations/${id}/price`, { method: "PUT", body: json({ priceCents }) }),
  getLiveShuttles: () => apiRequest<LiveShuttles>("/internal/shuttle/live"),
  // « SMS de la veille » (S-A + S-B, 06/10/2026): the usual rule, the evenings and each booking's SMS.
  getReminders: (parkingId: string, evening?: string) =>
    apiRequest<ReminderBoard>(
      `/internal/parkings/${parkingId}/reminders${evening ? `?evening=${evening}` : ""}`,
    ),
  updateReminders: (parkingId: string, input: ReminderSettingsInput) =>
    apiRequest<ReminderBoard>(`/internal/parkings/${parkingId}/reminders`, {
      method: "PUT",
      body: json(input),
    }),
  updateReminderEvening: (
    parkingId: string,
    date: string,
    input: { sendTime?: string | null; paused?: boolean },
  ) =>
    apiRequest<ReminderBoard>(
      `/internal/parkings/${parkingId}/reminders/evenings/${date}`,
      { method: "PUT", body: json(input) },
    ),
  sendRemindersNow: (parkingId: string, date: string) =>
    apiRequest<ReminderBoard>(
      `/internal/parkings/${parkingId}/reminders/evenings/${date}/send`,
      { method: "POST" },
    ),
  testReminder: (
    parkingId: string,
    input: { to?: string; template?: string },
  ) =>
    apiRequest<{ outcome: string; to: string }>(
      `/internal/parkings/${parkingId}/reminders/test`,
      { method: "POST", body: json(input) },
    ),
  setReminderExcluded: (reservationId: string, excluded: boolean) =>
    apiRequest<{ excluded: boolean }>(
      `/internal/reservations/${reservationId}/reminder`,
      { method: "PUT", body: json({ excluded }) },
    ),
  // M-A (06/10/2026): the inbound address and the forwarded confirmation emails.
  getInboundSettings: () =>
    apiRequest<InboundSettings>("/internal/inbound/settings"),
  enableInboundAddress: (regenerate = false) =>
    apiRequest<InboundSettings>("/internal/inbound/address", {
      method: "POST",
      body: json({ regenerate }),
    }),
  // M-A « Boîte de réception » (08/10/2026): one tab at a time, the counts of all three.
  getInboundEmails: (view: InboundEmailView = "todo") =>
    apiRequest<InboundEmailList>(`/internal/inbound/emails?view=${view}`),
  // T-A « Deux gestes »: handled (with or without a booking) or archived.
  handleInboundEmail: (id: string) =>
    apiRequest<{ data: InboundEmail }>(
      `/internal/inbound/emails/${id}/handle`,
      { method: "POST" },
    ),
  archiveInboundEmail: (id: string) =>
    apiRequest<{ data: InboundEmail }>(
      `/internal/inbound/emails/${id}/archive`,
      { method: "POST" },
    ),
  // « Relancer l'analyse » (10/10/2026): the reception's pipeline again (importers, Allopark page, Claude).
  reanalyseInboundEmail: (id: string) =>
    apiRequest<InboundReanalysis>(`/internal/inbound/emails/${id}/reanalyse`, {
      method: "POST",
    }),
  attachInboundEmail: (id: string, reservationId: string) =>
    apiRequest<{ message: string }>(`/internal/inbound/emails/${id}/attach`, {
      method: "POST",
      body: json({ reservationId }),
    }),
  // The driver's screen on the web (06/10/2026): the same trips as Plazo Pro.
  getPickups: () =>
    apiRequest<{
      serverTime: string;
      meetingPoint: MeetingPoint | null;
      rows: PickupRow[];
    }>("/internal/shuttle/pickups"),
  getDepartures: () =>
    apiRequest<{ serverTime: string; rows: DepartureRow[] }>(
      "/internal/shuttle/departures",
    ),
  getStaying: () => apiRequest<Staying>("/internal/shuttle/staying"),
  getCurrentTrip: () =>
    apiRequest<{ trip: StaffTrip | null }>("/internal/shuttle/trips/current"),
  startTrip: (input: StartTripInput) =>
    apiRequest<{ trip: StaffTrip }>("/internal/shuttle/trips", {
      method: "POST",
      body: json(input),
    }),
  sendTripPosition: (
    tripId: string,
    position: {
      lat: number;
      lng: number;
      accuracy?: number | null;
      recordedAt: string;
    },
  ) =>
    apiRequest<{ trip: StaffTrip }>(
      `/internal/shuttle/trips/${tripId}/position`,
      { method: "POST", body: json(position) },
    ),
  endTrip: (tripId: string) =>
    apiRequest<{ trip: StaffTrip }>(`/internal/shuttle/trips/${tripId}/end`, {
      method: "POST",
    }),
  checkFlight: (flight: string, date: string, role: "arrival" | "departure") =>
    apiRequest<FlightCheck>(
      `/internal/flights/check?flight=${encodeURIComponent(flight)}&date=${date}&role=${role}`,
    ),
  getShuttleForecast: (date?: string) =>
    apiRequest<ShuttleForecast>(
      `/internal/shuttle/forecast${date ? `?date=${date}` : ""}`,
    ),
  previewCapacity: (arrivalAt: string, returnAt: string, excludeId?: string) =>
    apiRequest<CapacityPreview>(
      `/internal/capacity?${new URLSearchParams({ arrivalAt, returnAt, ...(excludeId ? { excludeId } : {}) }).toString()}`,
    ),
  searchReservations: (params: { q?: string; page?: number }) =>
    apiRequest<ReservationPage>(
      `/internal/reservations?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), page: String(params.page ?? 1) }).toString()}`,
    ),
  getReservation: (id: string) =>
    apiRequest<Reservation>(`/internal/reservations/${id}`),
  createReservation: (input: ReservationInput) =>
    apiRequest<{ data: Reservation }>("/internal/reservations", {
      method: "POST",
      body: json(input),
    }),
  updateReservation: (
    id: string,
    input: Partial<Omit<ReservationInput, "externalReference" | "priceCents">>,
  ) =>
    apiRequest<{ data: Reservation }>(`/internal/reservations/${id}`, {
      method: "PATCH",
      body: json(input),
    }),
  getListing: () => apiRequest<ListingResponse>("/internal/listing"),
  updateListing: (input: ListingInput) =>
    apiRequest<{ data: Listing }>("/internal/listing", {
      method: "PUT",
      body: json(input),
    }),
  /** 09/10/2026: Claude writes the « Présentation », or improves `current` (nothing saved). */
  suggestListingDescription: (current: string | null) =>
    apiRequest<DescriptionSuggestion>("/internal/listing/description/suggest", {
      method: "POST",
      body: json(current ? { current } : {}),
    }),
  submitListing: () =>
    apiRequest<{ data: Listing }>("/internal/listing/submit", {
      method: "POST",
    }),
  withdrawListing: () =>
    apiRequest<{ data: Listing }>("/internal/listing/withdraw", {
      method: "POST",
    }),
  getPricing: () => apiRequest<Pricing>("/internal/pricing"),
  updatePricing: (tiers: PricingTier[], extraDayPriceCents: number | null) =>
    apiRequest<{ data: Pricing }>("/internal/pricing", {
      method: "PUT",
      body: json({ tiers, extraDayPriceCents }),
    }),

  // The platform owner's space (super admin).
  getPlatformOperators: (view?: "archived") =>
    apiRequest<PlatformOperators>(
      `/internal/platform/operators${view ? `?view=${view}` : ""}`,
    ),
  setCommission: (id: string, commissionBps: number | null) =>
    apiRequest<{ data: { id: string; commissionBps: number | null } }>(
      `/internal/platform/operators/${id}/commission`,
      {
        method: "PATCH",
        body: json({ commissionBps }),
      },
    ),
  suspendOperator: (id: string) =>
    apiRequest<{ data: unknown }>(
      `/internal/platform/operators/${id}/suspend`,
      { method: "POST" },
    ),
  reactivateOperator: (id: string) =>
    apiRequest<{ data: unknown }>(
      `/internal/platform/operators/${id}/reactivate`,
      { method: "POST" },
    ),
  archiveOperator: (id: string) =>
    apiRequest<{ data: unknown }>(
      `/internal/platform/operators/${id}/archive`,
      { method: "POST" },
    ),
  unarchiveOperator: (id: string) =>
    apiRequest<{ data: unknown }>(
      `/internal/platform/operators/${id}/unarchive`,
      { method: "POST" },
    ),
  // 09/10/2026 (« pouvoir supprimer un parking »): what would go, then the deletion itself.
  getOperatorDeletion: (id: string) =>
    apiRequest<{ data: OperatorDeletion }>(
      `/internal/platform/operators/${id}/deletion`,
    ),
  deleteOperator: (id: string) =>
    apiRequest<{ data: { id: string; name: string } }>(
      `/internal/platform/operators/${id}`,
      { method: "DELETE" },
    ),
  startViewAs: (id: string) =>
    apiRequest<{
      access: { token: string; expires: string };
      operator: { id: string; name: string };
    }>(`/internal/platform/operators/${id}/view-as`, {
      method: "POST",
    }),
  /** Revokes a view-as session (a logout made with its own token). */
  endViewAs: (token: string) =>
    apiRequest<void>("/internal/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
  inviteOperator: (input: InviteInput) =>
    apiRequest<InvitationResult>("/internal/platform/invitations", {
      method: "POST",
      body: json(input),
    }),
  resendInvitation: (id: string) =>
    apiRequest<InvitationResult>(
      `/internal/platform/operators/${id}/invitation`,
      { method: "POST" },
    ),
  getPlatformListings: (status?: string) =>
    apiRequest<PlatformListings>(
      `/internal/platform/listings${status ? `?${new URLSearchParams({ status }).toString()}` : ""}`,
    ),
  approveListing: (id: string) =>
    apiRequest<{ data: Listing }>(`/internal/platform/listings/${id}/approve`, {
      method: "POST",
    }),
  rejectListing: (id: string, message: string) =>
    apiRequest<{ data: Listing }>(`/internal/platform/listings/${id}/reject`, {
      method: "POST",
      body: json({ message }),
    }),
  unpublishListing: (id: string, message?: string) =>
    apiRequest<{ data: Listing }>(
      `/internal/platform/listings/${id}/unpublish`,
      { method: "POST", body: json(message ? { message } : {}) },
    ),
  getPlatformReservations: (params: {
    operatorId?: string;
    from?: string;
    to?: string;
    page?: number;
  }) => {
    const query = new URLSearchParams();
    // Page 0 and below are the pages before today (10/10/2026): sent too.
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") query.set(k, String(v));
    return apiRequest<PlatformReservations>(
      `/internal/platform/reservations?${query.toString()}`,
    );
  },
  // Online payments (the operator's Stripe account; manager).
  getPaymentStatus: () =>
    apiRequest<PaymentStatus>("/internal/payments/status"),
  startPaymentOnboarding: () =>
    apiRequest<{ url: string; expiresAt: string }>(
      "/internal/payments/onboarding",
      { method: "POST" },
    ),
  getStripeDashboardLink: () =>
    apiRequest<{ url: string }>("/internal/payments/dashboard-link", {
      method: "POST",
    }),
  getPayoutSettings: () =>
    apiRequest<{ payoutSchedule: PayoutSchedule }>(
      "/internal/payments/settings",
    ),
  updatePayoutSettings: (payoutSchedule: PayoutSchedule) =>
    apiRequest<{ payoutSchedule: PayoutSchedule }>(
      "/internal/payments/settings",
      { method: "PUT", body: json({ payoutSchedule }) },
    ),

  // SMS to travellers: the operator's channel (their own Android phone, Brevo, or none; manager).
  getSmsSettings: () => apiRequest<SmsSettings>("/internal/sms/settings"),
  updateSmsSettings: (input: SmsSettingsInput) =>
    apiRequest<SmsSettings>("/internal/sms/settings", {
      method: "PUT",
      body: json(input),
    }),
  testSms: (to: string) =>
    apiRequest<{ outcome: "sent" | "queued" }>("/internal/sms/test", {
      method: "POST",
      body: json({ to }),
    }),
  disableSms: () =>
    apiRequest<SmsSettings>("/internal/sms/disable", { method: "POST" }),
  getSmsStatus: () => apiRequest<SmsStatus>("/internal/sms/status"),

  getPlatformPayments: () =>
    apiRequest<PlatformPayments>("/internal/platform/payments"),
  // E-A: the platform's broadcasts.
  getPlatformNotifications: () =>
    apiRequest<{ data: PlatformNotification[] }>(
      "/internal/platform/notifications",
    ),
  getPlatformNotificationAudience: (
    audience: PlatformAudience,
    operatorId?: string | null,
  ) =>
    apiRequest<{ devices: number; configured: boolean }>(
      `/internal/platform/notifications/audience?${new URLSearchParams({ audience, ...(operatorId ? { operatorId } : {}) })}`,
    ),
  sendPlatformNotification: (input: PlatformNotificationInput) =>
    apiRequest<{ data: PlatformNotification }>(
      "/internal/platform/notifications",
      {
        method: "POST",
        body: json(input),
      },
    ),
  retryPayout: (reservationId: string) =>
    apiRequest<{
      result: "transferred" | "failed" | "skipped";
      payoutStatus: string;
    }>(`/internal/platform/payouts/${reservationId}/retry`, {
      method: "POST",
    }),

  // Capacity estimator (platform space).
  listCapacityStudies: () =>
    apiRequest<CapacityStudySummary[]>("/internal/platform/capacity-studies"),
  getCapacityStudy: (id: string) =>
    apiRequest<CapacityStudy>(`/internal/platform/capacity-studies/${id}`),
  createCapacityStudy: (name: string) =>
    apiRequest<{ data: CapacityStudy }>("/internal/platform/capacity-studies", {
      method: "POST",
      body: json({ name }),
    }),
  updateCapacityStudy: (id: string, patch: StudyPatch) =>
    apiRequest<{ data: CapacityStudy }>(
      `/internal/platform/capacity-studies/${id}`,
      { method: "PATCH", body: json(patch) },
    ),
  deleteCapacityStudy: (id: string) =>
    apiRequest<void>(`/internal/platform/capacity-studies/${id}`, {
      method: "DELETE",
    }),
  // The geo helpers exist twice: for an operator's plan (manager of that operator) and for the
  // platform's capacity studies (platform admin, whatever their own staff role).
  parcelsAt: (lon: number, lat: number, scope: GeoScope = "operator") =>
    apiRequest<{ parcels: ParcelFeature[] }>(
      `${geoBase(scope)}/parcels?${new URLSearchParams({ lon: String(lon), lat: String(lat) }).toString()}`,
    ),
  parkingsIn: (
    bbox: [number, number, number, number],
    scope: GeoScope = "operator",
  ) =>
    apiRequest<{ parkings: ParkingFeature[] }>(
      `${geoBase(scope)}/parkings?bbox=${bbox.map((n) => n.toFixed(6)).join(",")}`,
    ),
  buildingsIn: (
    bbox: [number, number, number, number],
    scope: GeoScope = "operator",
  ) =>
    apiRequest<{ buildings: BuildingFeature[] }>(
      `${geoBase(scope)}/buildings?bbox=${bbox.map((n) => n.toFixed(6)).join(",")}`,
    ),
  geocode: (q: string, scope: GeoScope = "operator") =>
    apiRequest<{ results: GeocodeResult[] }>(
      `${geoBase(scope)}/geocode?${new URLSearchParams({ q }).toString()}`,
    ),

  changeReservationStatus: (
    id: string,
    status: ReservationStatus,
    note?: string,
  ) =>
    apiRequest<{ data: Reservation }>(`/internal/reservations/${id}/status`, {
      method: "POST",
      body: json(note ? { status, note } : { status }),
    }),
};
