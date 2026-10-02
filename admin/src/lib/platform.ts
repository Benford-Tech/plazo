import type { ListingStatus } from "./types";

/** Basis points as a French percentage: 1200 -> "12", 1250 -> "12,5". */
export const percent = (bps: number) => (bps / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 });

/** Colour of a listing status in the platform lists (direction B; amber for "à valider", as in S-1). */
export const LISTING_TONE: Record<ListingStatus, string> = {
  published: "text-success",
  pending_review: "text-[#e8a33c]",
  rejected: "text-destructive",
  draft: "text-muted-foreground",
};

export const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
