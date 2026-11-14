import type { Airport, PromotionFilters, PromotionLink } from "@/lib/types";
import { fr } from "@/lib/fr";

const t = fr.platform.notifications.promo;

/** "19 déc." from a stay time `YYYY-MM-DDTHH:mm` (its date only). */
export function stayDay(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

/** The airport's city ("Lyon") when known, else its slug. */
export function airportLabel(slug: string, airports: Airport[] | undefined): string {
  return airports?.find(a => a.slug === slug)?.city ?? slug;
}

/** « Recherche · Lyon · 19 déc. → 3 janv. », « Fiche d'un parking · Lyon · parking-des-cedres », « Accueil de l'app ». */
export function promotionLinkSummary(link: PromotionLink | null | undefined, airports: Airport[] | undefined): string {
  if (!link) return t.summaryHome;
  const parts = [link.kind === "parking" ? t.openParking : t.summarySearch, airportLabel(link.airport, airports)];
  if (link.kind === "parking") parts.push(link.parking);
  if (link.arrival && link.return) parts.push(`${stayDay(link.arrival)} → ${stayDay(link.return)}`);
  return parts.join(" · ");
}

/** « ont accepté les offres · ont déjà réservé à Lyon · sans réservation à venir ». */
export function promotionFiltersSummary(filters: PromotionFilters | null | undefined, airports: Airport[] | undefined): string {
  const parts = [t.allTravellers];
  if (filters?.airport) parts.push(lowerFirst(t.bookedAt(airportLabel(filters.airport, airports))));
  if (filters?.noUpcoming) parts.push(lowerFirst(t.noUpcoming));
  return parts.join(" · ");
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
