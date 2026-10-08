// C-A (08/10/2026): the guide of an airport page, written for the travellers who search "parking aéroport …".
// Facts about the airport were checked on its own site (lyonaeroports.com, 08/10/2026); figures about the
// partners are read from the live offers of real parkings only, never from the demo ones.
import { daysLabel } from "./dates";
import { formatEuros } from "./money";
import { PRODUCT_NAME } from "./product";
import type { AirportResponse, SearchResponse } from "./types";

/** What the guide may say in figures: only what the real partners offer right now. */
export interface GuideFacts {
  /** Cheapest bookable real parking for the default stay of a week (its billable days). */
  week: { priceCents: number; days: number } | null;
  /** Shortest and longest shuttle ride of the real partners, in minutes. */
  shuttle: { min: number; max: number } | null;
}

export interface GuideTable {
  caption: string;
  columns: [string, string];
  rows: [string, string, string][];
}

export interface GuideSection {
  id: string;
  /** Label in the "Sur cette page" list. */
  short: string;
  title: string;
  paragraphs: string[];
  table?: GuideTable;
  list?: string[];
}

export interface AirportGuide {
  title: string;
  intro: string;
  sections: GuideSection[];
  /** Questions about this airport, after the site's general ones. */
  faq: [string, string][];
}

export function guideFacts(listings: AirportResponse["listings"], preview: SearchResponse | null): GuideFacts {
  const offers = (preview?.results ?? []).filter(r => !r.isDemo && r.available && r.priceCents !== null);
  const cheapest = offers.reduce<(typeof offers)[number] | null>((best, r) => (best === null || r.priceCents! < best.priceCents! ? r : best), null);
  const rides = listings.filter(l => !l.isDemo && l.services.includes("shuttle") && l.shuttleMinutes).map(l => l.shuttleMinutes!);
  return {
    week: cheapest ? { priceCents: cheapest.priceCents!, days: cheapest.days } : null,
    shuttle: rides.length ? { min: Math.min(...rides), max: Math.max(...rides) } : null,
  };
}

function rideText({ min, max }: { min: number; max: number }): string {
  return min === max ? `${min} min` : `${min} à ${max} min`;
}

function lyonSaintExupery(facts: GuideFacts): AirportGuide {
  const week = facts.week ? `dès ${formatEuros(facts.week.priceCents)} pour ${daysLabel(facts.week.days)}` : null;
  return {
    title: "Se garer à l’aéroport de Lyon Saint-Exupéry",
    intro:
      "L’aéroport de Lyon Saint-Exupéry est à Colombier-Saugnieu, à environ 25 km à l’est de Lyon. Pour y laisser sa voiture le temps d’un voyage, deux choix : les parkings de l’aéroport, au pied des terminaux ou reliés par une navette, et les parkings privés des environs, reliés aux terminaux par une navette gratuite.",
    sections: [
      {
        id: "aeroport-ou-prive",
        short: "Parkings de l’aéroport ou privés",
        title: "Parkings de l’aéroport ou parkings privés avec navette ?",
        paragraphs: [
          "Les parkings de l’aéroport vont du P0, sous le terminal, aux parkings éloignés comme le P5 et le P7, desservis par une navette. Ils se réservent sur le site de l’aéroport.",
          "Les parkings privés sont à quelques minutes de route et souvent moins chers : vous y laissez la voiture, et leur navette gratuite vous dépose devant votre terminal.",
        ],
        table: {
          caption: "Aéroport ou parking privé : l’essentiel",
          columns: ["Parkings de l’aéroport", "Parkings privés partenaires"],
          rows: [
            [
              "Accès aux terminaux",
              "À pied depuis les plus proches, en navette depuis les parkings éloignés (P5, P7)",
              facts.shuttle ? `Navette gratuite, ${rideText(facts.shuttle)}` : "Navette gratuite jusqu’au terminal",
            ],
            ["Réservation", "Sur le site de l’aéroport", `Sur ${PRODUCT_NAME}, paiement en ligne par carte`],
            ["Prix", "Selon le parking et la date de réservation", week ? `${week[0].toUpperCase()}${week.slice(1)}, frais compris` : "Prix total affiché pour vos dates"],
            ["Au retour", "Vous rejoignez le parking à pied ou en navette", "Le parking suit votre vol et vous prévient par SMS à l’atterrissage"],
          ],
        },
      },
      {
        id: "prix",
        short: "Combien coûte une semaine",
        title: "Combien coûte une semaine de parking ?",
        paragraphs: [
          week
            ? `Chez nos parkings partenaires, une semaine coûte aujourd’hui ${week}, frais compris : le jour d’arrivée et le jour de retour comptent chacun pour une journée.`
            : "Chez nos parkings partenaires, le prix affiché est le prix total pour vos dates, frais compris : le jour d’arrivée et le jour de retour comptent chacun pour une journée.",
          "Le prix dépend des dates et de la durée : indiquez les vôtres en haut de la page pour comparer. Pendant les vacances scolaires, réservez tôt pour garder le choix.",
        ],
      },
      {
        id: "navette",
        short: "La navette, aller et retour",
        title: "La navette, à l’aller et au retour",
        paragraphs: [
          `À l’aller, vous laissez la voiture à l’accueil du parking et la navette vous conduit devant votre terminal${facts.shuttle ? `, en ${rideText(facts.shuttle)}` : ""}. Au retour, indiquez votre numéro de vol : le parking suit l’heure d’atterrissage et vous envoie un SMS avec le point de rendez-vous.`,
        ],
      },
      {
        id: "voiturier",
        short: "Voiturier ou pas",
        title: "Voiturier ou on se gare soi-même ?",
        paragraphs: [
          "Avec un voiturier, vous confiez les clés à l’accueil et le parking range la voiture ; sinon, vous la garez vous-même à la place indiquée. Chaque fiche dit ce que propose le parking, et le filtre « Voiturier » des résultats ne garde que ceux qui le font.",
        ],
      },
      {
        id: "acces",
        short: "Venir en voiture",
        title: "Venir en voiture",
        paragraphs: [
          "L’A432, qui relie l’A42 au nord et l’A43 au sud, dessert directement l’aéroport. Chaque fiche de parking donne l’adresse exacte et un lien d’itinéraire.",
        ],
      },
      {
        id: "conseils",
        short: "Payer moins cher",
        title: "Payer moins cher",
        paragraphs: [],
        list: [
          "Réservez dès que vos dates sont connues.",
          "Comparez le prix total pour vos dates, pas le prix à la journée.",
          "Regardez les conditions d’annulation avant de payer.",
        ],
      },
    ],
    faq: [
      ["Où sont les terminaux de Lyon Saint-Exupéry ?", "Les terminaux 1 et 2 sont reliés ; la navette vous dépose devant celui de votre vol."],
      [
        "Quel est le parking le moins cher à l’aéroport de Lyon ?",
        "Cela dépend de vos dates. Indiquez-les en haut de la page : les parkings partenaires sont classés du moins cher au plus cher, prix total compris.",
      ],
      [
        "Combien coûte une semaine de parking à Lyon Saint-Exupéry ?",
        week
          ? `${week[0].toUpperCase()}${week.slice(1)} chez nos parkings partenaires, frais compris. Le prix exact dépend de vos dates.`
          : "Le prix dépend du parking et de vos dates : indiquez-les en haut de la page pour voir le prix total de chaque parking.",
      ],
      [
        "Existe-t-il un parking gratuit à l’aéroport de Lyon ?",
        "Pas pour un voyage. Les déposes-minute devant les terminaux sont gratuites quelques minutes, le temps de déposer quelqu’un.",
      ],
      ["La navette est-elle gratuite ?", "Oui : chez nos parkings partenaires, la navette jusqu’aux terminaux est comprise dans le prix."],
    ],
  };
}

const GUIDES: Record<string, (facts: GuideFacts) => AirportGuide> = {
  "lyon-saint-exupery": lyonSaintExupery,
};

/** The guide of an airport page; null for an airport that has none yet. */
export function airportGuide(slug: string, facts: GuideFacts): AirportGuide | null {
  return GUIDES[slug]?.(facts) ?? null;
}
