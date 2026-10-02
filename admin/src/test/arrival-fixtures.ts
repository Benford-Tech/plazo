import type { ArrivalSignal } from "@/lib/types";

/** A live arrival signal as the API returns it (tests). */
export const signal = (overrides: Partial<ArrivalSignal> = {}): ArrivalSignal => ({
  id: "s1",
  reservationId: "r1",
  reference: "R7KQ2M",
  kind: "outbound",
  state: "sharing",
  customerName: "Camille Martin",
  plate: "AB-123-CD",
  passengers: 2,
  returnFlight: null,
  scheduledAt: "2026-10-03T06:00:00.000Z",
  startedAt: "2026-10-03T05:30:00.000Z",
  expiresAt: "2026-10-03T07:30:00.000Z",
  distanceM: 8400,
  etaMinutes: 12,
  etaAt: "2026-10-03T05:52:00.000Z",
  announcedMinutes: null,
  atMeetingPointAt: null,
  position: { lat: 45.8, lng: 5.05, accuracyM: 10 },
  positionUpdatedAt: "2026-10-03T05:40:00.000Z",
  positionAgeSeconds: 20,
  meetingPoint: { lat: 45.73, lng: 5.05, source: "parking", label: null },
  ...overrides,
});
