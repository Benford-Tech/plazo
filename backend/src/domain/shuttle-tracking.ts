import { ShuttleTracking } from '@/database';

/**
 * R-B (07/10/2026): who sees the position of a parking's shuttles during the trips. "off": the
 * drivers do not share it; "team": the staff's live maps only; "everyone": also the travellers (their
 * booking, the home map, "Votre navette est là") and "EN DIRECT" in the search results.
 * "Votre navette est partie" does not depend on it.
 */
export const SHUTTLE_TRACKING_LEVELS = ['off', 'team', 'everyone'] as const satisfies readonly ShuttleTracking[];

/** The drivers' phones (and the web driver mode) share the position during a trip. */
export const sharesPosition = (tracking: ShuttleTracking) => tracking !== 'off';

/** The travellers see the shuttle's position, and the site says "EN DIRECT". */
export const travellersSeePosition = (tracking: ShuttleTracking) => tracking === 'everyone';
