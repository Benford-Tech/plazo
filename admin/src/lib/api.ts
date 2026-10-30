import type { ImportRow } from "./booking-import";
import type {
  FileBoard,
  FileChoice,
  FileInput,
  FilesPlanning,
  ParkingFile,
} from "@/lib/plan/parkingFiles";
import type {
  Airport,
  ExtraKind,
  ExtraSettings,
  PaymentMethod,
  ReservationExtra,
  ExtrasBoard,
  ExtrasBoardView,
  ContractFileKind,
  MyContract,
  PartnerContract,
  Dashboard,
  ValetRuns,
  LiveShuttles,
  InboundSettings,
  InboundEmail,
  LinkedEmail,
  BookingReminder,
  HistoryEvent,
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
  NightSettings,
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
  DemoLink,
  MorningEmailPreference,
  DemoRole,
  Prospect,
  ProspectImportReport,
  ProspectInput,
  ProspectingSettings,
  ProspectingStep,
  ProspectList,
  ProspectSendResult,
  ProspectStatus,
  ReturnMeetingPoint,
  ShuttleStop,
  ShuttleStopInput,
  ShuttleVehicle,
  ShuttleVehicleInput,
  LiveArrivals,
  Planning,
  PlanningForecast,
  ImportPreview,
  ReservationImportSummary,
  Reservation,
  ReservationInput,
  ReservationStatus,
  Staff,
  AuthProviders,
  IdentityProvider,
  IdentitySignIn,
  StaffRole,
  JoinCode,
  JoinRequest,
  JoinRequestView,
  JoinRole,
  TokenData,
  Staying,
  ComparatorCommission,
  CommissionRate,
  ReservationCommission,
  RevenueBasis,
  RevenueReport,
  RevenueSummary,
  GettingStarted,
  BookingContract,
  ContractField,
  ContractTemplates,
  SignedContractFileKind,
  SignedContractsPage,
  SignedContractsQuery,
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
async function authorizedFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
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
export async function apiFile(
  endpoint: string,
): Promise<{ blob: Blob; filename: string | null }> {
  const res = await authorizedFetch(endpoint);
  const filename =
    /filename="([^"]+)"/.exec(
      res.headers.get("Content-Disposition") ?? "",
    )?.[1] ?? null;
  return { blob: await res.blob(), filename };
}

const json = (body: unknown) => JSON.stringify(body);

function signedContractsParams(q: SignedContractsQuery): string {
  const params = new URLSearchParams();
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  if (q.q?.trim()) params.set("q", q.q.trim());
  if (q.reserved) params.set("reserved", "1");
  if (q.page && q.page > 1) params.set("page", String(q.page));
  return params.toString();
}

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
  /** 22/10/2026: which sign-ins the API verifies, with the Web client ID for Google's button. */
  authProviders: () => apiRequest<AuthProviders>("/internal/auth/providers"),
  /** « Continuer avec Google »: a member's session, or an onboarding one (a Google account in no team yet). */
  googleSignIn: (idToken: string) =>
    apiRequest<IdentitySignIn>("/internal/auth/google", {
      method: "POST",
      body: json({ idToken }),
    }),
  /** Ends the onboarding session the web cannot use (joining a team is done in Plazo Pro). */
  onboardingLogout: (onboardingToken: string) =>
    apiRequest<void>("/internal/auth/onboarding/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${onboardingToken}` },
    }),
  /** Mon compte › Connexion: link one's Google account, or unlink Apple / Google. */
  linkGoogle: (idToken: string) =>
    apiRequest<{ user: Staff }>("/internal/staff/me/identities/google", {
      method: "POST",
      body: json({ idToken }),
    }),
  unlinkIdentity: (provider: IdentityProvider) =>
    apiRequest<{ user: Staff }>(`/internal/staff/me/identities/${provider}`, {
      method: "DELETE",
    }),
  /** 21/10/2026: the prospects' demo in a role, with the prospect's own link when there is one. */
  enterDemo: (role: DemoRole, token?: string) =>
    apiRequest<{ tokenData: TokenData; user: Staff }>("/internal/auth/demo", {
      method: "POST",
      body: json({ role, ...(token ? { token } : {}) }),
    }),
  demoLink: (token: string) =>
    apiRequest<{
      status: "valid" | "expired" | "unknown";
      companyName: string | null;
    }>(`/public/demo/links/${encodeURIComponent(token)}`),
  getMe: () => apiRequest<Staff>("/internal/staff/me"),
  /** 21/10/2026: « Mail du matin », read with the other notification settings. */
  getMorningEmail: () =>
    apiRequest<{ morningEmail: MorningEmailPreference }>(
      "/internal/notifications/preferences",
    ).then((r) => r.morningEmail),
  updateMorningEmail: (patch: { enabled?: boolean; hour?: number }) =>
    apiRequest<{ morningEmail: MorningEmailPreference }>(
      "/internal/notifications/preferences",
      {
        method: "PATCH",
        body: json({ morningEmail: patch }),
      },
    ).then((r) => r.morningEmail),
  sendMorningEmail: () =>
    apiRequest<{ sent: boolean }>(
      "/internal/notifications/morning-email/send",
      { method: "POST" },
    ),
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
    apiRequest<{
      email: string;
      operatorName: string;
      role: string;
      stores: { playStoreUrl: string; appStoreUrl: string | null };
    }>("/internal/auth/invitation", { method: "POST", body: json({ token }) }),
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
  // Services for the car (21/10/2026).
  getExtraSettings: (parkingId: string) =>
    apiRequest<ExtraSettings>(`/internal/parkings/${parkingId}/extras`),
  updateExtraSettings: (
    parkingId: string,
    body: {
      leadHours?: number;
      offers?: { kind: ExtraKind; enabled: boolean; priceCents: number }[];
    },
  ) =>
    apiRequest<ExtraSettings>(`/internal/parkings/${parkingId}/extras`, {
      method: "PUT",
      body: json(body),
    }),
  getReservationExtras: (id: string) =>
    apiRequest<{ extras: ReservationExtra[] }>(
      `/internal/reservations/${id}/extras`,
    ),
  getExtrasBoard: (view: ExtrasBoardView) =>
    apiRequest<ExtrasBoard>(`/internal/extras?view=${view}`),
  acceptExtra: (id: string, extraId: string) =>
    apiRequest<{ extras: ReservationExtra[] }>(
      `/internal/reservations/${id}/extras/${extraId}/accept`,
      { method: "POST" },
    ),
  markExtraDone: (id: string, extraId: string) =>
    apiRequest<{ extras: ReservationExtra[] }>(
      `/internal/reservations/${id}/extras/${extraId}/done`,
      { method: "POST" },
    ),
  refuseExtra: (id: string, extraId: string, reason: string) =>
    apiRequest<{ extras: ReservationExtra[] }>(
      `/internal/reservations/${id}/extras/${extraId}/refuse`,
      {
        method: "POST",
        body: json({ reason }),
      },
    ),
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
  /** « Clés laissées » in one click (26/10/2026). */
  setKeys: (
    reservationId: string,
    patch: { left: boolean; keyHook?: string | null },
  ) =>
    apiRequest<{ data: { keysLeftAt: string | null; keyHook: string | null } }>(
      `/internal/reservations/${reservationId}/keys`,
      { method: "PUT", body: json(patch) },
    ),
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
    apiRequest<{ data: Staff; invitation?: { emailSent: boolean } }>(
      "/internal/staff",
      {
        method: "POST",
        body: json(staff),
      },
    ),
  updateStaff: (
    id: string,
    patch: {
      role?: StaffRole;
      isActive?: boolean;
      firstName?: string;
      lastName?: string;
    },
  ) =>
    apiRequest<{ data: Staff }>(`/internal/staff/${id}`, {
      method: "PATCH",
      body: json(patch),
    }),
  // 26/10/2026: « Renvoyer l'invitation » (a new « Choisir mon mot de passe » link by email).
  inviteStaff: (id: string) =>
    apiRequest<{ invitation: { emailSent: boolean } }>(
      `/internal/staff/${id}/invite`,
      { method: "POST" },
    ),
  resetStaffPassword: (id: string, password: string) =>
    apiRequest<{ message: string }>(`/internal/staff/${id}/reset-password`, {
      method: "POST",
      body: json({ password }),
    }),
  // 13/10/2026: the code of the day (managers; read-only for the platform in consultation) and the requests it brings.
  getJoinCode: () => apiRequest<JoinCode>("/internal/staff/join-code"),
  getJoinRequests: () =>
    apiRequest<{ data: JoinRequest[] }>("/internal/staff/join-requests"),
  acceptJoinRequest: (id: string, role: JoinRole) =>
    apiRequest<{ staff: Staff }>(
      `/internal/staff/join-requests/${encodeURIComponent(id)}/accept`,
      { method: "POST", body: json({ role }) },
    ),
  refuseJoinRequest: (id: string) =>
    apiRequest<{ request: JoinRequestView }>(
      `/internal/staff/join-requests/${encodeURIComponent(id)}/refuse`,
      { method: "POST" },
    ),

  getPlanning: (date?: string) =>
    apiRequest<Planning>(`/internal/planning${date ? `?date=${date}` : ""}`),
  // Import of old bookings from a file (28/10/2026): the preview (dryRun), then the import.
  importReservations: (body: { rows: ImportRow[]; fileName?: string; dryRun: boolean }) =>
    apiRequest<ImportPreview>("/internal/reservations/import", { method: "POST", body: JSON.stringify(body) }),
  getReservationImports: () => apiRequest<{ data: ReservationImportSummary[] }>("/internal/reservations/imports"),
  undoReservationImport: (id: string) =>
    apiRequest<{ removed: number; kept: number }>(`/internal/reservations/imports/${id}/undo`, { method: "POST" }),
  getPlanningForecast: (from: string, days: number) =>
    apiRequest<PlanningForecast>(`/internal/planning/forecast?from=${from}&days=${days}`),
  getLiveArrivals: () => apiRequest<LiveArrivals>("/internal/arrivals/live"),
  getDashboard: () => apiRequest<Dashboard>("/internal/dashboard"),
  // « Voiturier au terminal » (27/10/2026).
  valetRuns: () => apiRequest<ValetRuns>("/internal/valet/runs"),
  // CA-B + CA-A (09/10/2026): the revenue, managers only.
  getRevenue: (from: string, to: string, basis: RevenueBasis) =>
    apiRequest<RevenueReport>(
      `/internal/revenue?${new URLSearchParams({ from, to, basis })}`,
    ),
  getRevenueSummary: () =>
    apiRequest<RevenueSummary>("/internal/revenue/summary"),
  // T-A (26/10/2026): « Bien démarrer » on the dashboard.
  getGettingStarted: () =>
    apiRequest<GettingStarted>("/internal/getting-started"),
  exportRevenue: (from: string, to: string, basis: RevenueBasis) =>
    apiFile(
      `/internal/revenue/export?${new URLSearchParams({ from, to, basis })}`,
    ),
  // 19/10/2026: what each comparator takes, from a day on, and a booking's own exception.
  getComparatorCommissions: () =>
    apiRequest<{ today: string; comparators: ComparatorCommission[] }>(
      "/internal/comparators/commissions",
    ),
  setComparatorCommission: (body: {
    label: string;
    rateBp: number;
    fixedCents: number;
    effectiveFrom: string;
  }) =>
    apiRequest<CommissionRate>("/internal/comparators/commissions", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  removeComparatorCommission: (key: string, effectiveFrom: string) =>
    apiRequest<void>(
      `/internal/comparators/commissions/${encodeURIComponent(key)}/${effectiveFrom}`,
      { method: "DELETE" },
    ),
  setReservationCommission: (
    id: string,
    body: { rateBp: number | null; amountCents: number | null },
  ) =>
    apiRequest<{ id: string; commission: ReservationCommission | null }>(
      `/internal/reservations/${id}/commission`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    ),
  setReservationPrice: (id: string, priceCents: number | null) =>
    apiRequest<{ id: string; priceCents: number | null; paymentMethod?: PaymentMethod | null }>(
      `/internal/reservations/${id}/price`,
      { method: "PUT", body: json({ priceCents }) },
    ),
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
  // 30/10/2026: one booking's day-before SMS, on its page; sent (or sent again) by hand.
  getBookingReminder: (reservationId: string) =>
    apiRequest<BookingReminder>(`/internal/reservations/${reservationId}/reminder`),
  sendBookingReminder: (reservationId: string) =>
    apiRequest<BookingReminder>(`/internal/reservations/${reservationId}/reminder/send`, { method: "POST" }),
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
  // « Coller un mail » (29/10/2026): read like a received mail, kept in the inbox.
  pasteInboundEmail: (body: { text: string; subject?: string; html?: string }) =>
    apiRequest<InboundReanalysis>("/internal/inbound/emails/paste", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  // « Mails liés » (27/10/2026): the mails of a booking, oldest first.
  getReservationHistory: (reservationId: string) =>
    apiRequest<{ data: HistoryEvent[] }>(`/internal/reservations/${reservationId}/history`),
  getReservationEmails: (reservationId: string) =>
    apiRequest<{ data: LinkedEmail[] }>(
      `/internal/reservations/${reservationId}/emails`,
    ),
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
  searchReservations: (params: {
    q?: string;
    page?: number;
    noPrice?: boolean;
  }) =>
    apiRequest<ReservationPage>(
      `/internal/reservations?${new URLSearchParams({
        ...(params.q ? { q: params.q } : {}),
        page: String(params.page ?? 1),
        ...(params.noPrice ? { noPrice: "1" } : {}),
      }).toString()}`,
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
    input: Partial<
      Omit<ReservationInput, "externalReference" | "importedPriceCents">
    >,
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
  /** `night` absent: the night fees stay as they are (12/10/2026). */
  updatePricing: (
    tiers: PricingTier[],
    extraDayPriceCents: number | null,
    night?: NightSettings,
  ) =>
    apiRequest<{ data: Pricing }>("/internal/pricing", {
      method: "PUT",
      body: json(
        night
          ? { tiers, extraDayPriceCents, night }
          : { tiers, extraDayPriceCents },
      ),
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
  // The Plazo ↔ operator contract (20/10/2026).
  getOperatorContracts: (operatorId: string) =>
    apiRequest<{ contracts: PartnerContract[] }>(
      `/internal/platform/operators/${operatorId}/contracts`,
    ),
  uploadOperatorContract: (operatorId: string, file: File, title?: string) =>
    apiRequest<PartnerContract>(
      `/internal/platform/operators/${operatorId}/contracts?${new URLSearchParams({ fileName: file.name, ...(title ? { title } : {}) })}`,
      {
        method: "POST",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      },
    ),
  remindOperatorContract: (operatorId: string, contractId: string) =>
    apiRequest<PartnerContract>(
      `/internal/platform/operators/${operatorId}/contracts/${contractId}/remind`,
      { method: "POST" },
    ),
  removeOperatorContract: (operatorId: string, contractId: string) =>
    apiRequest<void>(
      `/internal/platform/operators/${operatorId}/contracts/${contractId}`,
      { method: "DELETE" },
    ),
  operatorContractFile: (
    operatorId: string,
    contractId: string,
    kind: ContractFileKind,
  ) =>
    apiFile(
      `/internal/platform/operators/${operatorId}/contracts/${contractId}/file?kind=${kind}`,
    ),
  // The parking's own contract and the signed contracts (26/10/2026, choice A + R-A).
  getContractTemplate: () =>
    apiRequest<ContractTemplates>("/internal/contract-template"),
  uploadContractTemplate: (file: File, title?: string) =>
    apiRequest<ContractTemplates>(
      `/internal/contract-template?${new URLSearchParams({ fileName: file.name, ...(title ? { title } : {}) })}`,
      {
        method: "POST",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      },
    ),
  revertContractTemplate: () =>
    apiRequest<ContractTemplates>("/internal/contract-template/revert", {
      method: "POST",
    }),
  contractTemplateFile: (templateId: string) =>
    apiFile(`/internal/contract-template/${templateId}/file`),
  // 30/10/2026: where each piece of information is stamped on the parking's PDF, and its preview with example values.
  setContractFields: (templateId: string, fields: ContractField[]) =>
    apiRequest<ContractTemplates>(
      `/internal/contract-template/${templateId}/fields`,
      { method: "PUT", body: json({ fields }) },
    ),
  contractFieldsPreview: async (templateId: string, fields: ContractField[]) => {
    const res = await authorizedFetch(
      `/internal/contract-template/${templateId}/preview`,
      { method: "POST", body: json({ fields }) },
    );
    return res.blob();
  },
  // 30/10/2026: one's own photo (a cropped square JPEG), a member's photo for the team, and the menu's counters.
  setMyPhoto: (photo: Blob) =>
    apiRequest<{ photoUpdatedAt: string }>("/internal/staff/me/photo", {
      method: "POST",
      body: photo,
      headers: { "Content-Type": photo.type || "image/jpeg" },
    }),
  removeMyPhoto: () =>
    apiRequest<void>("/internal/staff/me/photo", { method: "DELETE" }),
  staffPhoto: async (staffId: string, version: string) => {
    const res = await authorizedFetch(
      `/internal/staff/${staffId}/photo?v=${encodeURIComponent(version)}`,
    );
    return res.blob();
  },
  navCounts: () =>
    apiRequest<{ inbox: number | null; extras: number }>("/internal/nav/counts"),
  getSignedContracts: (query: SignedContractsQuery) =>
    apiRequest<SignedContractsPage>(
      `/internal/contracts?${signedContractsParams(query)}`,
    ),
  exportSignedContracts: (query: SignedContractsQuery) =>
    apiFile(`/internal/contracts/export?${signedContractsParams(query)}`),
  reservationContractFile: (
    reservationId: string,
    kind: SignedContractFileKind,
  ) =>
    apiFile(
      `/internal/reservations/${reservationId}/contract/file?kind=${kind}`,
    ),
  getBookingContract: (reservationId: string) =>
    apiRequest<{ contract: BookingContract }>(
      `/internal/reservations/${reservationId}/paperwork`,
    ),
  getMyContract: () => apiRequest<MyContract>("/internal/contract"),
  signMyContract: (contractId: string, signerName: string) =>
    apiRequest<MyContract>(`/internal/contract/${contractId}/sign`, {
      method: "POST",
      body: json({ signerName, accepted: true }),
    }),
  myContractFile: (contractId: string, kind: ContractFileKind) =>
    apiFile(`/internal/contract/${contractId}/file?kind=${kind}`),
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
    for (const [k, v] of Object.entries(params))
      if (v !== undefined && v !== "") query.set(k, String(v));
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
  // Prospection (18/10/2026).
  getProspects: (
    filters: {
      status?: ProspectStatus | null;
      airport?: string | null;
      region?: string | null;
    } = {},
  ) =>
    apiRequest<ProspectList>(
      `/internal/platform/prospects?${new URLSearchParams({
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.airport ? { airport: filters.airport } : {}),
        ...(filters.region ? { region: filters.region } : {}),
      })}`,
    ),
  createProspect: (input: ProspectInput) =>
    apiRequest<{ data: Prospect }>("/internal/platform/prospects", {
      method: "POST",
      body: json(input),
    }),
  updateProspect: (id: string, input: Partial<ProspectInput>) =>
    apiRequest<{ data: Prospect }>(
      `/internal/platform/prospects/${encodeURIComponent(id)}`,
      { method: "PATCH", body: json(input) },
    ),
  createProspectDemoLink: (id: string, renew = false) =>
    apiRequest<{ data: DemoLink }>(
      `/internal/platform/prospects/${encodeURIComponent(id)}/demo-link`,
      { method: "POST", body: json({ renew }) },
    ),
  deleteProspect: (id: string) =>
    apiRequest<{ data: { id: string } }>(
      `/internal/platform/prospects/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  importProspects: (rows: Partial<ProspectInput>[], dryRun: boolean) =>
    apiRequest<ProspectImportReport>("/internal/platform/prospects/import", {
      method: "POST",
      body: json({ rows, dryRun }),
    }),
  setProspectStatus: (
    id: string,
    status: "replied" | "interested" | "not_interested" | "unsubscribed",
  ) =>
    apiRequest<{ data: Prospect }>(
      `/internal/platform/prospects/${encodeURIComponent(id)}/status`,
      { method: "POST", body: json({ status }) },
    ),
  stopProspect: (id: string) =>
    apiRequest<{ data: Prospect }>(
      `/internal/platform/prospects/${encodeURIComponent(id)}/stop`,
      { method: "POST" },
    ),
  sendProspects: (ids: string[]) =>
    apiRequest<ProspectSendResult>("/internal/platform/prospects/send", {
      method: "POST",
      body: json({ ids }),
    }),
  sendProspectTest: (input: {
    step: number;
    prospectId?: string | null;
    subject?: string;
    body?: string;
  }) =>
    apiRequest<{ sentTo: string }>("/internal/platform/prospects/test", {
      method: "POST",
      body: json(input),
    }),
  getProspectingSettings: () =>
    apiRequest<{ data: ProspectingSettings }>(
      "/internal/platform/prospects/settings",
    ),
  updateProspectingSettings: (input: {
    steps: ProspectingStep[];
    dailyCap: number;
  }) =>
    apiRequest<{ data: ProspectingSettings }>(
      "/internal/platform/prospects/settings",
      { method: "PUT", body: json(input) },
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
