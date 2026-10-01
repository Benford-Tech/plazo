import type {
  CapacityPreview,
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

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3005").replace(/\/$/, "");
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
  changeReservationStatus: (id: string, status: ReservationStatus) =>
    apiRequest<{ data: Reservation }>(`/internal/reservations/${id}/status`, { method: "POST", body: json({ status }) }),
};
