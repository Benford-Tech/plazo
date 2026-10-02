import type { PayoutSchedule } from "./types";

/** Display order of the payout tiles (the mockup's). */
export const SCHEDULES: PayoutSchedule[] = ["AT_DROP_OFF", "AFTER_STAY", "WEEKLY", "MONTHLY"];
/** The default schedule, marked « conseillé ». */
export const RECOMMENDED_SCHEDULE: PayoutSchedule = "AFTER_STAY";

/** Sends the browser to a Stripe page (onboarding or dashboard): a full navigation, Stripe refuses frames. Tests replace it. */
export const stripeNavigation = {
  goTo(url: string) {
    window.location.assign(url);
  },
};
