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
