// C-A (08/10/2026): the guide of an airport page, written for the travellers who search "parking aéroport …".
// 09/10/2026 (« 4 200 mots, FAQ balisée »): the Lyon guide is a full page, the size of the comparators' guides,
// with the airport's own parkings, their 2026 price grid and about twenty questions, all marked up as FAQPage.
// Facts about the airport were checked on its own site (lyonaeroports.com and its 2026 tariff sheet, 08/10/2026,
// fact-checked again on 09/10/2026: Terminal 2 closed since 01/04/2026, P1 run by LPA) and are dated in the text;
// figures about the partners are read from the live offers of real parkings only, never from the demo ones.
import { daysLabel } from "./dates";
import { topicPath } from "./guides/topics";
import { formatEuros } from "./money";
import { PRODUCT_NAME } from "./product";
import type { AirportResponse, SearchResponse } from "./types";

/** What the guide may say in figures about the partners: only what the real ones offer right now. */
export interface GuideFacts {
  /** Cheapest bookable real parking for the default stay of a week (its billable days). */
  week: { priceCents: number; days: number } | null;
  /** Shortest and longest shuttle ride of the real partners, in minutes. */
  shuttle: { min: number; max: number } | null;
}

export interface GuideTable {
  caption: string;
  /** Column headings, after the row header. */
  columns: string[];
  /** Row header, then one cell per column. */
  rows: string[][];
  /** Where the figures come from and when they were read, under the table. */
  note?: string;
}

/** A sub-heading (h4) inside a section. */
export interface GuidePart {
  title: string;
  paragraphs: string[];
  table?: GuideTable;
  list?: string[];
}

export interface GuideSection {
  id: string;
  /** Label in the "Sur cette page" list. */
  short: string;
  title: string;
  paragraphs: string[];
  table?: GuideTable;
  list?: string[];
  parts?: GuidePart[];
  /** A link at the end of the section, to the page that goes further (a topic guide). */
  more?: { href: string; label: string };
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

/** Facts of a topic guide (09/10/2026): those of the airport guide, plus the long stay and the valets of the real partners. */
export interface TopicFacts extends GuideFacts {
  /** Cheapest bookable real parking for a stay of two weeks (its billable days). */
  twoWeeks: { priceCents: number; days: number } | null;
  /** Real partners with a valet: how many there are, and the cheapest week among them. */
  valet: { count: number; week: { priceCents: number; days: number } | null } | null;
}

/** A topic guide: one page per search intent (« parking pas cher », « longue durée », « voiturier »). */
export interface TopicGuide {
  /** Address segment, under /<airport>/guide/. */
  slug: string;
  /** Link label in the other guides and the footer. */
  short: string;
  /** <title> without the product name (the page adds it), about 60 characters. */
  metaTitle: string;
  /** Meta description, 160 characters at most. */
  metaDescription: string;
  /** H1. */
  title: string;
  /** Lead paragraph under the H1. */
  intro: string;
  /** Day the page was first published and day its facts were last checked, as ISO dates (« 2026-10-09 »). */
  published: string;
  updated: string;
  sections: GuideSection[];
  faq: [string, string][];
  /** The partner parkings shown on the page, with the length of the stay they are priced for. */
  partners: { filter: "all" | "valet"; stayDays: number; title: string; lead: string; empty: string };
}

type Offer = { priceCents: number; days: number };

function cheapestOffer(preview: SearchResponse | null, keep: (slug: string) => boolean = () => true): Offer | null {
  const offers = (preview?.results ?? []).filter(r => !r.isDemo && r.available && r.priceCents !== null && keep(r.slug));
  const best = offers.reduce<(typeof offers)[number] | null>((b, r) => (b === null || r.priceCents! < b.priceCents! ? r : b), null);
  return best ? { priceCents: best.priceCents!, days: best.days } : null;
}

export function topicFacts(listings: AirportResponse["listings"], week: SearchResponse | null, twoWeeks: SearchResponse | null): TopicFacts {
  const valets = new Set(listings.filter(l => !l.isDemo && l.services.includes("valet")).map(l => l.slug));
  return {
    ...guideFacts(listings, week),
    twoWeeks: cheapestOffer(twoWeeks),
    valet: valets.size ? { count: valets.size, week: cheapestOffer(week, slug => valets.has(slug)) } : null,
  };
}

export function rideText({ min, max }: { min: number; max: number }): string {
  return min === max ? `${min} min` : `${min} à ${max} min`;
}

/** The ride in a sentence: minutes in words, as everywhere else in the prose. */
export function rideMinutes({ min, max }: { min: number; max: number }): string {
  return min === max ? `${min} minutes` : `${min} à ${max} minutes`;
}

export const capitalise = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

/** « dès 56,00 € pour 8 jours facturés » (an offer in a sentence). */
export function offerText({ priceCents, days }: Offer): string {
  return `dès ${formatEuros(priceCents)} pour ${daysLabel(days)} facturé${days > 1 ? "s" : ""}`;
}

/**
 * The airport's own figures, read on lyonaeroports.com (pages « Parkings », « Terminal 2 fermé », « Bornes de recharge » and
 * the parking FAQ) and on its 2026 tariff sheet (« tarifs sans réservation », valid from 01/01/2026 to 31/12/2026);
 * read on 08/10/2026, checked again on 09/10/2026. Re-read them before changing anything: the text quotes the date,
 * and a wrong public figure costs more than none.
 */
export const LYON_OFFICIAL = {
  readOn: "9 octobre 2026",
  /** Since 01/04/2026 every flight leaves from Terminal 1 (works, no reopening date). */
  t2Closed: "1er avril 2026",
  /** Day rates without a booking, in euros: 24 h, 2, 4, 7, 14, 21 and 30 days, then each extra day. */
  grid: {
    "P0 · P1": ["32,90 €", "64,90 €", "116,90 €", "194,90 €", "342,90 €", "489,90 €", "678,90 €", "+ 21 € par jour"],
    P2: ["30,90 €", "56,90 €", "104,90 €", "170,90 €", "303,90 €", "436,90 €", "607,90 €", "+ 19 € par jour"],
    P3: ["30,90 €", "56,90 €", "100,90 €", "156,90 €", "262,90 €", "367,90 €", "502,90 €", "+ 15 € par jour"],
    P4: ["26,90 €", "51,40 €", "97,40 €", "139,40 €", "191,40 €", "240,40 €", "303,40 €", "+ 7 € par jour"],
    P5: ["24,40 €", "46,90 €", "64,90 €", "76,90 €", "103,90 €", "131,90 €", "167,90 €", "+ 4 € par jour"],
  },
  gridColumns: ["24 h", "2 jours", "4 jours", "1 semaine", "2 semaines", "3 semaines", "1 mois", "Au-delà"],
  week: { p5: "76,90 €", p4: "139,40 €", p3: "156,90 €", p2: "170,90 €", p0: "194,90 €", moto: "97,50 €" },
  twoWeeks: { p5: "103,90 €", p0: "342,90 €", moto: "171,50 €" },
  online: { from: "40 € la semaine", listed: "50 € la semaine" },
  minute: { free: "10 minutes", then: "la 11e minute coûte 2,20 €, et chacune des suivantes 0,60 €", cap: "au-delà de cinq passages en 24 h, tous parkings minute confondus, un forfait de 80 € s’applique" },
  /** Free-access chargers (not bookable); P4 Elec and P5 Elec are the bookable, all-electric parks. */
  chargers: { p2: 40, p4: 89, p5: 164, dedicated: "plus de 240" },
  /** Walking time to Terminal 1, from the airport's FAQ. */
  walk: { p0: "environ 12 minutes", p1: "environ 10 minutes", p2: "environ 15 minutes", p3: "environ 7 minutes", p4: "environ 15 minutes" },
  p5Shuttle: { every: "toutes les 7 minutes de 6 h à minuit et toutes les 10 minutes la nuit", door: "environ 40 minutes" },
  p7Shuttle: { every: "toutes les 20 minutes", ride: "environ 10 minutes" },
  /** The P5 height differs between the parkings page (2,60 m) and the tariff sheet (2,50 m). */
  p5Height: "2,60 m selon la page des parkings (2,50 m sur la grille 2026)",
  /** What the airport advises its passengers, at the terminal. */
  advice: "2 h avant un vol en France, 2 h 30 avant un vol dans l’espace Schengen et 3 h avant un vol international",
} as const;

function lyonSaintExupery(facts: GuideFacts): AirportGuide {
  const week = facts.week ? offerText(facts.week) : null;
  const ride = facts.shuttle ? rideText(facts.shuttle) : null;
  const rideWords = facts.shuttle ? rideMinutes(facts.shuttle) : null;
  const o = LYON_OFFICIAL;
  const source = `Chiffres relevés le ${o.readOn} sur lyonaeroports.com et sur sa grille tarifaire 2026 (tarifs sans réservation, valables du 1er janvier au 31 décembre 2026) ; les parkings de l’aéroport réservés en ligne à l’avance sont annoncés « à partir de ${o.online.from} ».`;
  const terminal = `Depuis le ${o.t2Closed}, le Terminal 2 est fermé pour travaux : tous les vols partent du Terminal 1.`;

  return {
    title: "Se garer à l’aéroport de Lyon Saint-Exupéry : le guide complet",
    intro:
      "L’aéroport de Lyon Saint-Exupéry est à Colombier-Saugnieu, à environ 25 km à l’est de Lyon, entre l’A42 et l’A43, reliées par l’A432. Pour y laisser sa voiture le temps d’un voyage, deux grandes familles de parkings : ceux de l’aéroport, au pied des terminaux ou reliés par une navette, et les parkings privés des environs, reliés à l’aérogare par une navette gratuite. Ce guide compare les deux, donne les tarifs officiels 2026 de l’aéroport, explique la navette, le voiturier, les options couvertes et électriques, l’accès par la route, les périodes chargées et la façon dont une réservation se passe sur " +
      PRODUCT_NAME +
      `. ${terminal} Les chiffres de l’aéroport ont été relevés le ${LYON_OFFICIAL.readOn} sur son site ; ceux des parkings partenaires viennent de leurs offres du moment.`,
    sections: [
      {
        id: "aeroport-ou-prive",
        short: "Parkings de l’aéroport ou privés",
        title: "Parkings de l’aéroport ou parkings privés avec navette ?",
        paragraphs: [
          "Les parkings de l’aéroport vont du P0, sous les terminaux, aux parkings éloignés comme le P5 et le P7, desservis par une navette interne. Ils sont exploités par l’aéroport, sauf le P1, confié à Lyon Parc Auto (LPA), et se réservent tous sur le site de l’aéroport. Leur atout, c’est la proximité : depuis le P0, le P1 ou le P3, vous rejoignez le Terminal 1 à pied en 7 à 12 minutes, valise à la main, sans attendre personne.",
          "Les parkings privés sont installés dans les communes voisines, à quelques minutes de route de l’aérogare. Vous y laissez la voiture à l’accueil, le parking vous conduit au terminal avec sa navette, et il vient vous rechercher au retour. Ils sont en général nettement moins chers que les parkings couverts de l’aéroport et se situent, pour une semaine, au niveau du parking économique P5 ou en dessous, avec en prime un accueil par une personne et un suivi de votre vol au retour.",
          "Le bon choix dépend de la durée et de ce que vous attendez. Pour une journée ou une nuit, un parking de proximité de l’aéroport est souvent le plus simple. À partir de quelques jours, et plus encore pour une ou deux semaines, un parking privé avec navette fait baisser la note sans compliquer le trajet : la navette prend en charge le dernier kilomètre, et vous n’avez pas à chercher une place.",
        ],
        table: {
          caption: "Aéroport ou parking privé : l’essentiel",
          columns: ["Parkings de l’aéroport", "Parkings privés partenaires"],
          rows: [
            ["Accès aux terminaux", "À pied depuis les plus proches (7 à 15 min jusqu’au Terminal 1), en navette depuis les parkings éloignés (P5, P7)", ride ? `Navette gratuite, ${ride}` : "Navette gratuite jusqu’au terminal"],
            ["Réservation", "Sur le site de l’aéroport", `Sur ${PRODUCT_NAME}, paiement en ligne par carte`],
            ["Prix", `Selon le parking et la date de réservation (une semaine au P5 : ${o.week.p5} sans réservation, grille 2026)`, week ? `Aujourd’hui, ${week}, frais compris` : "Prix total affiché pour vos dates"],
            ["Au retour", "Vous rejoignez le parking à pied ou en navette", "Le parking suit votre vol et vous prévient par SMS à l’atterrissage"],
            ["Voiturier", "En option, sur réservation en ligne : un voiturier partenaire de l’aéroport prend la voiture au dépose-minute du Terminal 1 et vous l’y rend ; sinon, vous la garez vous-même", "Selon le parking : voiturier ou place indiquée, précisé sur chaque fiche"],
          ],
        },
      },
      {
        id: "parkings-officiels",
        short: "Les parkings de l’aéroport (P0 à P7)",
        title: "Les parkings officiels de l’aéroport, du P0 au P7",
        paragraphs: [
          "L’aéroport compte une dizaine de parcs, numérotés de P0 à P7, plus les déposes-minute et les zones d’attente. Ils se distinguent par leur distance au terminal, leur couverture, la hauteur acceptée et le prix. Tous sont surveillés 24 h sur 24 et 7 jours sur 7, et tous se réservent en ligne, sauf les déposes-minute et les zones d’attente, qui restent sans réservation. " +
            terminal,
          `Le tableau ci-dessous résume ce que chacun propose. Les hauteurs comptent : les parkings couverts P0 et P1 sont limités à 1,90 m, ce qui exclut la plupart des monospaces hauts, des utilitaires et des véhicules équipés d’un coffre de toit ; le P3 accepte 2,10 m, le P2 et le P4 2,50 m, le P5 ${o.p5Height}, et le P7 n’annonce aucune limite.`,
        ],
        table: {
          caption: "Les parkings de l’aéroport de Lyon Saint-Exupéry",
          columns: ["Emplacement", "Accès au Terminal 1", "Couvert", "Hauteur maximale", "À savoir"],
          rows: [
            ["P0", "Souterrain, sous les terminaux", "À pied, environ 12 min", "Oui", "1,90 m", "Le seul parking qui accepte les motos, à moitié prix"],
            ["P1", "Au pied du Terminal 1", "À pied, environ 10 min", "Oui", "1,90 m", "Géré par Lyon Parc Auto (LPA) : exclu de l’annulation gratuite jusqu’à 1 h avant et de la garantie retard"],
            ["P2", "En plein air, près de la gare TGV", "À pied, environ 15 min", "Non", "2,50 m", `${o.chargers.p2} bornes de recharge en libre-service`],
            ["P3", "Face au Terminal 1", "À pied, environ 7 min", "Oui", "2,10 m", "Bornes de recharge en libre-service"],
            ["P4", "En plein air, face à la gare TGV", "À pied, environ 15 min", "Non", "2,50 m", `${o.chargers.p4} bornes en libre-service ; le P4 Elec, 100 % électrique, se réserve en ligne`],
            ["P5", "Parking économique, éloigné", "Navette gratuite toutes les 7 min (10 min la nuit), environ 40 min de la voiture au terminal", "Non", "2,60 m (2,50 m sur la grille 2026), voie dédiée aux véhicules plus hauts", `${o.chargers.p5} bornes en libre-service ; P5 Elec, 100 % électrique, et P5 robotisé (3 à 30 jours, hauteur limitée à 2,30 m), en ligne seulement`],
            ["P7", "Parking économique saisonnier", "Navette gratuite toutes les 20 min, environ 10 min de trajet", "Non", "Aucune limite annoncée, utilitaires et camping-cars compris", "Ouvert en période d’affluence, sur réservation en ligne seulement"],
          ],
          note: source,
        },
        parts: [
          {
            title: "P0 et P1 : au plus près, pour les courts séjours",
            paragraphs: [
              `Le P0 est le parking souterrain situé sous les terminaux, entre le Terminal 1 et le Terminal 2 ; comptez ${o.walk.p0} à pied jusqu’au Terminal 1. Le P1 est au pied du Terminal 1, couvert lui aussi, à ${o.walk.p1} de marche. Ce sont les parkings les plus chers de l’aéroport, pensés pour une journée ou un aller-retour rapide. Sans réservation, la grille 2026 affiche ${o.week.p0} pour une semaine et ${o.twoWeeks.p0} pour deux semaines, puis 21 € par jour au-delà du trentième jour. Le P0 est aussi le seul parking à accepter les motos, avec un tarif réduit de moitié (${o.week.moto} la semaine).`,
              "À noter : la hauteur est limitée à 1,90 m, et le P1, géré par Lyon Parc Auto et non par l’aéroport, est exclu de la souplesse d’annulation et de la « garantie retard » que l’aéroport accorde aux autres parkings réservés en ligne.",
            ],
          },
          {
            title: "P2, P3 et P4 : les parkings de proximité",
            paragraphs: [
              `Les parkings de proximité restent accessibles à pied : ${o.walk.p3} du P3 au Terminal 1, ${o.walk.p2} depuis le P2 ou le P4. Le P3, couvert et face au Terminal 1, accepte 2,10 m. Le P2 et le P4 sont en plein air, près de la gare TGV, et acceptent 2,50 m. Tous trois ont des bornes de recharge en libre-service, et le P4 Elec, entièrement électrique, se réserve en ligne. Pour une semaine sans réservation, comptez ${o.week.p3} au P3, ${o.week.p2} au P2 et ${o.week.p4} au P4, puis 15 €, 19 € et 7 € par jour supplémentaire au-delà d’un mois.`,
            ],
          },
          {
            title: "P5, P5 robotisé et P7 : les parkings économiques",
            paragraphs: [
              `Le P5 est le grand parking économique de l’aéroport, en plein air et éloigné du terminal. Une navette gratuite passe ${o.p5Shuttle.every} ; l’aéroport compte ${o.p5Shuttle.door} de la voiture au Terminal 1, marche et attente comprises. C’est le moins cher de la grille 2026 sans réservation : ${o.week.p5} la semaine et ${o.twoWeeks.p5} les deux semaines, puis 4 € par jour au-delà d’un mois ; l’aéroport présente toutefois le P7, ouvert en période d’affluence et réservable en ligne seulement, comme le moins cher de ses parkings officiels. La hauteur est limitée à ${o.p5Height}, et les véhicules plus hauts ont une voie dédiée à l’entrée. Le P5 a aussi le plus grand nombre de bornes en libre-service de l’aéroport, et le P5 Elec, entièrement électrique, se réserve en ligne.`,
              `Deux autres formules se réservent uniquement en ligne : le P5 robotisé, où un robot range votre voiture, pour des séjours de 3 à 30 jours et des véhicules de 2,30 m au plus, et le P7, un parking de débord saisonnier ouvert à la réservation en période d’affluence. La navette du P7 passe ${o.p7Shuttle.every} et met ${o.p7Shuttle.ride} jusqu’au Terminal 1 ; aucune limite de hauteur n’y est annoncée, utilitaires et camping-cars compris.`,
            ],
          },
          {
            title: "Déposes-minute et zones d’attente",
            paragraphs: [
              `Les parkings minute T1A et T1B, au pied du Terminal 1, et celui de la gare TGV sont gratuits les 10 premières minutes ; ${o.minute.then}. ${capitalise(o.minute.cap)}. Celui du Terminal 2 n’est plus accessible depuis la fermeture du terminal. Les zones d’attente, aux entrées de l’aéroport, sont gratuites une heure au maximum, le conducteur devant rester présent : elles servent à patienter avant d’aller chercher quelqu’un, pas à stationner.`,
            ],
          },
        ],
      },
      {
        id: "parkings-prives",
        short: "Les parkings privés avec navette",
        title: "Les parkings privés avec navette : comment ça marche",
        paragraphs: [
          "Autour de Saint-Exupéry, à Saint-Laurent-de-Mure, Saint-Bonnet-de-Mure, Grenay, Pusignan, Janneyrias et dans les communes voisines, des entreprises indépendantes exploitent des parkings réservés aux voyageurs de l’aéroport. Le principe est simple : vous arrivez à l’heure convenue, une personne vous accueille, vous laissez la voiture, et une navette vous conduit au terminal. Au retour, la navette vous reprend au point de rendez-vous et vous ramène à votre voiture.",
          "Ces parkings existent sous plusieurs formes. Les plus courants sont des terrains clôturés et surveillés, en plein air, parfois avec une partie couverte ou des box fermés. Certains proposent un voiturier, qui prend la voiture à l’accueil et la range lui-même ; d’autres vous indiquent une place. Les services annexes varient : lavage, plein, recharge électrique, contrôle technique pendant votre absence.",
          "Avant de choisir, regardez quatre choses : la durée réelle de la navette jusqu’au terminal, les horaires d’ouverture (un vol très matinal ou un retour tard le soir demande un parking ouvert à ces heures), les conditions d’annulation et la façon dont le parking vous récupère au retour. Sur " +
            PRODUCT_NAME +
            ", chaque fiche donne la durée de la navette, les horaires, les services et les conditions d’annulation, et les filtres des résultats permettent de ne garder que les parkings ouverts 24 h sur 24, avec voiturier, couverts ou annulables gratuitement ; quand le parking l’a indiqué, le point de rendez-vous du retour figure dans l’e-mail de confirmation.",
          rideWords
            ? `Chez nos parkings partenaires, la navette met ${rideWords} jusqu’au terminal, et elle est comprise dans le prix.`
            : "Chez nos parkings partenaires, la navette jusqu’au terminal est comprise dans le prix, et chaque fiche indique sa durée.",
        ],
      },
      {
        id: "prix",
        short: "Les prix selon la durée",
        title: "Combien coûte le parking à l’aéroport de Lyon ?",
        paragraphs: [
          "Le prix dépend d’abord de trois choses : le parking, la durée et la date de réservation. À l’aéroport, la grille sans réservation est la référence haute ; une réservation en ligne, surtout faite plusieurs semaines à l’avance, descend bien en dessous, « à partir de " +
            o.online.from +
            " » selon la grille 2026 et « à partir de " +
            o.online.listed +
            " » sur la page des parkings au " +
            o.readOn +
            ". Dans les parkings privés, le prix est en général dégressif : la journée supplémentaire coûte de moins en moins cher à mesure que le séjour s’allonge.",
          week
            ? `Chez nos parkings partenaires, une semaine coûte aujourd’hui ${week}, frais compris : le jour d’arrivée et le jour de retour comptent chacun pour une journée, et le prix affiché est celui que vous payez, sans frais de dossier ni supplément à l’arrivée.`
            : "Chez nos parkings partenaires, le prix affiché est le prix total pour vos dates, frais compris : le jour d’arrivée et le jour de retour comptent chacun pour une journée, et il n’y a ni frais de dossier ni supplément à l’arrivée.",
          "Pour vous repérer, voici la grille 2026 des parkings de l’aéroport sans réservation, pour les durées les plus courantes. Indiquez vos dates en haut de la page pour comparer le prix total de chaque parking partenaire.",
        ],
        table: {
          caption: "Tarifs 2026 des parkings de l’aéroport sans réservation, selon la durée",
          columns: [...o.gridColumns],
          rows: Object.entries(o.grid).map(([parking, prices]) => [parking, ...prices]),
          note: source,
        },
        parts: [
          {
            title: "Un week-end ou deux jours",
            paragraphs: [
              `Pour deux jours, la différence entre les parkings de l’aéroport est encore modeste : de ${o.grid.P5[1]} au P5 à ${o.grid["P0 · P1"][1]} au P0. Si vous partez tôt et rentrez tard, la proximité peut valoir le supplément. Dans les parkings privés, le week-end est souvent le séjour le moins avantageux au prorata, parce que les deux journées comptent pleinement ; comparez le prix total plutôt que le prix à la journée.`,
            ],
          },
          {
            title: "Une semaine",
            paragraphs: [
              `La semaine est la durée la plus demandée, celle des vacances et des voyages d’affaires longs. À l’aéroport, elle va de ${o.week.p5} au P5 à ${o.week.p0} au P0 sans réservation ; en ligne et à l’avance, l’aéroport l’annonce « à partir de ${o.online.from} ». ` +
                (week ? `Chez nos partenaires, elle coûte aujourd’hui ${week}, du jour d’arrivée au jour de retour, navette comprise.` : "Chez nos partenaires, la navette est comprise dans le prix affiché pour vos dates."),
            ],
          },
          {
            title: "Deux ou trois semaines",
            paragraphs: [
              `Au-delà d’une semaine, l’écart se creuse entre les parkings couverts de proximité et les parkings économiques ou privés : deux semaines coûtent ${o.twoWeeks.p0} au P0 contre ${o.twoWeeks.p5} au P5, et trois semaines ${o.grid["P0 · P1"][5]} contre ${o.grid.P5[5]}. C’est pour ces durées qu’un parking privé avec navette prend tout son sens : le trajet en navette est le même pour un week-end que pour trois semaines, alors que l’économie, elle, grandit avec la durée du séjour.`,
            ],
          },
          {
            title: "Ce qui fait varier le prix",
            paragraphs: [],
            list: [
              "La date de réservation : les tarifs en ligne de l’aéroport et de nombreux parkings privés montent à mesure que le parking se remplit.",
              "La période : vacances scolaires, ponts, samedis d’hiver et grands départs d’été coûtent plus cher, et les parkings y affichent complet plus vite.",
              `Le type de parking : couvert, avec voiturier ou proche du terminal, il coûte plus cher ; sur ${PRODUCT_NAME}, ce sont des caractéristiques du parking, comprises dans le prix total affiché.`,
              "Les services annexes : recharge électrique, lavage ou plein se paient en plus, quand le parking les propose.",
              "La taille du véhicule : les utilitaires, camping-cars et véhicules hauts n’ont pas accès à tous les parkings et relèvent parfois d’un tarif spécifique.",
            ],
          },
        ],
      },
      {
        id: "longue-duree",
        short: "Longue durée",
        more: { href: topicPath("lyon-saint-exupery", "parking-longue-duree"), label: "Le guide du parking longue durée à Lyon Saint-Exupéry" },
        title: "Parking longue durée : deux semaines, un mois et plus",
        paragraphs: [
          `Pour un long séjour, le prix à la journée compte plus que la distance. À l’aéroport, le P5 est fait pour cela : ${o.grid.P5[6]} le mois sans réservation, puis 4 € par jour, là où le P0 atteint ${o.grid["P0 · P1"][6]} et ajoute 21 € par jour. La version robotisée du P5 accepte les séjours de 3 à 30 jours. Les parkings privés sont, eux aussi, conçus pour la longue durée, avec des tarifs dégressifs et parfois des forfaits au mois.`,
          "Quelques précautions avant un mois d’absence. Une batterie fatiguée peut lâcher pendant l’immobilisation : faites-la contrôler, ou prévenez le parking, qui pourra vous aider au retour. Gonflez les pneus à la pression haute, laissez le réservoir au moins au quart, retirez tout ce qui a de la valeur et notez où vous avez garé la voiture. Au retour, laissez tourner le moteur quelques minutes avant de reprendre l’autoroute.",
          "Sur " +
            PRODUCT_NAME +
            ", la réservation d’un long séjour se fait comme les autres : vous choisissez vos dates, le prix total s’affiche, vous payez en ligne, et vous pouvez modifier vos numéros de vol jusqu’au retour depuis Ma réservation. Si vous rentrez plus tard que prévu, prévenez le parking : un retour après la date et l’heure réservées prolonge le séjour, et la prolongation est facturée par le parking, à son tarif.",
        ],
      },
      {
        id: "pas-cher",
        short: "Se garer pas cher",
        more: { href: topicPath("lyon-saint-exupery", "parking-pas-cher"), label: "Le guide du parking pas cher à Lyon Saint-Exupéry" },
        title: "Se garer pas cher à Lyon Saint-Exupéry : les bonnes pratiques",
        paragraphs: ["Le parking le moins cher n’est pas toujours le plus éloigné, et le prix à la journée affiché en gros ne dit rien du prix total. Voici ce qui fait vraiment baisser la facture."],
        list: [
          "Réservez dès que vos dates sont connues : à l’aéroport comme chez les parkings privés, les tarifs en ligne les plus bas partent en premier.",
          "Comparez le prix total pour vos dates, frais compris, pas le prix à la journée : deux parkings annoncés au même tarif peuvent compter les jours différemment.",
          "Acceptez la navette : les parkings qui demandent quelques minutes de trajet sont presque toujours moins chers que ceux où l’on marche jusqu’au terminal.",
          "Évitez les parkings couverts si votre voiture n’en a pas besoin : à l’aéroport, une semaine au P0 coûte plus du double d’une semaine au P5.",
          "Regardez les conditions d’annulation avant de payer : une offre annulable gratuitement vaut souvent quelques euros de plus qu’une offre non remboursable.",
          "Partez hors des pointes quand c’est possible : un départ en milieu de semaine, hors vacances scolaires, trouve de la place à meilleur prix.",
          "Pensez aux solutions sans voiture : le Rhônexpress relie Lyon Part-Dieu à l’aéroport en une trentaine de minutes, et se faire déposer au parking minute reste gratuit pendant 10 minutes.",
        ],
      },
      {
        id: "navette",
        short: "La navette, aller et retour",
        title: "La navette, à l’aller et au retour",
        paragraphs: [
          "À l’aller, vous laissez la voiture à l’accueil du parking et la navette vous conduit au Terminal 1" +
            (rideWords ? `, en ${rideWords}` : "") +
            ` : depuis la fermeture du Terminal 2 pour travaux, le ${o.t2Closed}, c’est de là que partent tous les vols. Elle s’arrête là où l’aéroport autorise les navettes des parkings extérieurs, à quelques minutes à pied de l’aérogare ; le parking vous indique l’endroit exact. Présentez-vous au parking avec un peu de marge : comptez la durée de la navette, le temps de l’accueil et, en période chargée, quelques minutes d’attente pour le départ suivant.`,
          "Au retour, tout se joue sur le numéro de vol que vous indiquez à la réservation. Le parking suit l’heure d’atterrissage réelle de votre avion : si le vol a du retard, la navette attend ; s’il est en avance, elle est là plus tôt. À l’atterrissage, vous recevez un SMS avec le point de rendez-vous de la navette. Vous récupérez vos bagages, vous rejoignez le point indiqué, et la navette vous ramène au parking, où votre voiture vous attend.",
          "Sur " +
            PRODUCT_NAME +
            ", vous pouvez aussi prévenir le parking de votre arrivée depuis votre téléphone (« J’arrive dans 10 min », « Je suis au point de rendez-vous »), signaler un vol en retard, un bagage perdu ou, en quelques mots, tout autre imprévu, et suivre la navette du parking en direct quand il a activé ce suivi. Le jour du dépôt, si vous avez renseigné votre vol aller, la page Ma réservation vous indique l’heure à laquelle la navette vers le terminal est prévue pour vous.",
        ],
        parts: [
          {
            title: "La durée de la navette",
            paragraphs: [
              rideWords
                ? `Elle varie d’un parking à l’autre : chez nos partenaires, la navette met ${rideWords} jusqu’au terminal. Les parkings de l’aéroport les plus proches se rejoignent à pied ; au P5, l’aéroport compte ${o.p5Shuttle.door} de la voiture au Terminal 1, marche et attente comprises.`
                : `Elle varie d’un parking à l’autre et figure sur chaque fiche. Les parkings de l’aéroport les plus proches se rejoignent à pied ; au P5, l’aéroport compte ${o.p5Shuttle.door} de la voiture au Terminal 1, marche et attente comprises.`,
            ],
          },
          {
            title: "Si votre vol a du retard",
            paragraphs: [
              "Rien à faire de votre côté : le parking suit votre vol et ajuste la navette. Si vous prenez un autre vol le même jour, modifiez le numéro de vol depuis Ma réservation jusqu’au retour ; si votre retour est reporté à un autre jour, prévenez le parking par téléphone, car la date de retour réservée ne se modifie pas en ligne. Un retour après la date et l’heure réservées prolonge le séjour, et la prolongation est facturée par le parking, à son tarif ; le prix étant compté à la journée, un retour le lendemain ajoute en général une journée.",
            ],
          },
        ],
      },
      {
        id: "voiturier",
        short: "Voiturier ou pas",
        more: { href: topicPath("lyon-saint-exupery", "parking-voiturier"), label: "Le guide du parking avec voiturier à Lyon Saint-Exupéry" },
        title: "Voiturier ou se garer soi-même ?",
        paragraphs: [
          "Avec un voiturier, vous confiez les clés à l’accueil et le parking range la voiture ; vous ne cherchez ni place ni chemin, et au retour la voiture est avancée pour vous. Sans voiturier, vous la garez vous-même à la place indiquée et vous gardez vos clés. Chaque fiche dit ce que propose le parking, et le filtre « Voiturier » des résultats ne garde que les parkings qui en proposent un.",
          "Le voiturier des parkings privés n’a rien à voir avec le voiturier d’hôtel : il travaille sur le parking lui-même, à quelques dizaines de mètres de l’accueil, et la voiture ne quitte pas l’enceinte. Les parkings organisés en files rangent les voitures selon la date de retour, pour éviter qu’un véhicule se retrouve bloqué derrière un autre qui part plus tard. Au retour, la voiture est en général prête quand la navette arrive.",
          "Quelques bons réflexes avec un voiturier : laissez seulement la clé de la voiture, pas tout le trousseau ; retirez les objets de valeur ; relevez le kilométrage et prenez quelques photos de la carrosserie à l’arrivée, pour que tout le monde soit d’accord au retour ; signalez une particularité du véhicule (boîte, démarrage, alarme). Le parking est responsable du véhicule qu’on lui confie, et une remarque au moment de la remise des clés règle la plupart des questions sur-le-champ.",
          "Si vous préférez garder vos clés, choisissez un parking où l’on se gare soi-même : vous suivez la personne de l’accueil ou l’indication de place, vous notez l’emplacement, et vous retrouvez la voiture exactement comme vous l’avez laissée.",
        ],
      },
      {
        id: "couvert-electrique-moto",
        short: "Couvert, électrique, moto, véhicules hauts",
        title: "Parking couvert, voiture électrique, moto et véhicules hauts",
        paragraphs: [
          "Un parking couvert protège de la grêle, du soleil d’été et du givre d’hiver, et évite de retrouver la voiture sous la neige au retour d’un séjour aux sports d’hiver. À l’aéroport, les parkings couverts sont le P0, le P1 et le P3 ; ils sont aussi parmi les plus chers et les plus bas de plafond (1,90 m au P0 et au P1, 2,10 m au P3). Certains parkings privés proposent une partie couverte ou des box : le filtre « Couvert » des résultats les repère.",
          `Pour recharger une voiture électrique pendant le voyage, l’aéroport propose deux solutions. Ses parkings P2, P3, P4 et P5 ont des bornes en libre-service (${o.chargers.p2} au P2, ${o.chargers.p4} au P4 et ${o.chargers.p5} au P5), mais elles ne se réservent pas : réserver le parking ne garantit pas d’en trouver une libre. Ses deux parkings 100 % électriques, le P4 Elec et le P5 Elec, se réservent en ligne et comptent ${o.chargers.dedicated} bornes dédiées. Dans les parkings privés, la recharge pendant le séjour est un service à part, signalé sur la fiche quand le parking le propose (filtre « Recharge électrique ») : demandez-la en réservant, et faites préciser si la batterie sera pleine à votre retour ou seulement rechargée en partie.`,
          `Les motos ne sont acceptées qu’au P0, à moitié prix (${o.week.moto} la semaine, ${o.twoWeeks.moto} les deux semaines sans réservation). Dans les parkings privés, demandez avant de réserver : certains acceptent les deux-roues à un tarif particulier.`,
          `Pour un monospace haut, un utilitaire, un van ou un camping-car, le tableau des parkings officiels donne la hauteur maximale de chacun : les parkings couverts ne dépassent pas 2,10 m, le P2 et le P4 s’arrêtent à 2,50 m, et au-delà restent le P5, qui réserve une voie aux véhicules plus hauts à son entrée, et le P7, ouvert en période d’affluence, sans limite annoncée. Les parkings privés en plein air n’ont en général pas de limite de hauteur, mais un camping-car occupe plusieurs places : contactez le parking, qui vous dira s’il l’accepte et à quel prix.`,
        ],
      },
      {
        id: "acces",
        short: "Venir en voiture",
        title: "Venir à l’aéroport de Lyon en voiture",
        paragraphs: [
          "L’aéroport est desservi par l’A432, qui relie l’A46 et l’A42 au nord à l’A43 au sud, avec deux sorties signalées vers l’aéroport. Depuis Lyon, prenez l’A43 vers Grenoble puis l’A432, ou la rocade Est (N346) puis l’A43 et l’A432 ; comptez 30 à 40 minutes depuis le centre selon la circulation, davantage aux heures de pointe du matin et du soir. Depuis Chambéry et les vallées alpines, l’A43 puis l’A432 ; depuis Grenoble, l’A48 puis l’A43 et l’A432 ; depuis Genève, Bourg-en-Bresse et l’Ain, l’A42 puis l’A432 ; depuis Saint-Étienne, l’A47 puis l’A46 Sud, l’A43 et l’A432.",
          `Sur place, tous les vols partent du Terminal 1, et une signalisation vous oriente dès votre arrivée ; si vous avez réservé un parking de l’aéroport, son billet électronique donne un plan et les coordonnées GPS de l’entrée. Les parkings privés sont dans les communes autour de l’aéroport : chaque fiche donne l’adresse exacte, la distance par la route et un lien d’itinéraire, et la confirmation reprend le téléphone du parking, au cas où vous vous perdriez. Prévoyez d’être au terminal ${o.advice}, comme le conseille l’aéroport, et ajoutez le temps de l’accueil au parking et de la navette.`,
          "Si un proche vous conduit à l’aéroport sans s’y garer, il peut vous déposer au parking minute T1A ou T1B, à quelques minutes à pied du Terminal 1 : les 10 premières minutes y sont gratuites.",
        ],
      },
      {
        id: "saisons",
        short: "Quand réserver",
        title: "Vacances, hiver, ski : quand réserver son parking ?",
        paragraphs: [
          "Lyon Saint-Exupéry est la porte d’entrée des Alpes : chaque samedi d’hiver, de décembre à avril, les skieurs qui arrivent ou repartent remplissent le terminal, et les parkings avec lui. Les vacances de Noël, les vacances de février (Lyon est en zone A) et les ponts de printemps sont les périodes les plus tendues, avec juillet, août et la rentrée de septembre pour les départs au soleil, et la Toussaint pour les longs week-ends.",
          "Pendant ces périodes, réservez deux à quatre semaines à l’avance pour garder le choix et les meilleurs tarifs ; les parkings de proximité de l’aéroport et les parkings privés les plus proches affichent complet en premier. En dehors des pointes, quelques jours suffisent, et la veille reste souvent possible. Sur " +
            PRODUCT_NAME +
            ", les parkings complets pour vos dates sont affichés en fin de liste, signalés « Complet à ces dates », pour que vous ne perdiez pas de temps avec eux.",
          "Le jour du départ, donnez-vous de la marge les samedis d’hiver et les jours de grand départ : l’A43 et l’A432 sont chargées, les files à l’accueil des parkings s’allongent, et les navettes tournent à plein. Un départ 30 minutes plus tôt que d’habitude suffit en général.",
        ],
      },
      {
        id: "plazo",
        short: `Comment ça marche sur ${PRODUCT_NAME}`,
        title: `Réserver son parking sur ${PRODUCT_NAME} : comment ça marche`,
        paragraphs: [
          PRODUCT_NAME +
            " est une plateforme de réservation dédiée aux parkings privés avec navette autour des aéroports. Vous indiquez vos dates et heures de dépôt et de retour, et la liste affiche les parkings disponibles pour tout le séjour, classés du moins cher au plus cher d’après le prix total. Chaque fiche décrit le parking, sa navette, ses services, ses conditions d’annulation et ses horaires.",
          "La réservation se fait en deux étapes : vos informations (nom, téléphone, plaque, numéros de vol, nombre de passagers) puis le paiement en ligne par carte. La place est garantie dès le paiement, et vous recevez aussitôt un e-mail de confirmation avec l’adresse et le téléphone du parking, le point de rendez-vous du retour quand le parking l’a indiqué, et un lien vers Ma réservation ; si le parking envoie des SMS, un SMS reprend la référence, les dates et ce lien. La veille du dépôt, un rappel vous est en principe envoyé, avec l’heure de dépôt prévue et l’adresse du parking.",
          "Le jour J, vous retrouvez sur Ma réservation l’heure prévue de votre navette (si vous avez indiqué votre vol aller) et un bouton pour prévenir le parking de votre arrivée. Le jour du retour, la page indique aussi l’endroit où la voiture est garée, dès que sa place ou sa position a été enregistrée (dans l’application, cette position s’affiche pendant tout le séjour). L’atterrissage est suivi, le SMS vous indique le point de rendez-vous, et la page montre un compte à rebours jusqu’à l’atterrissage puis, une fois la navette en route, jusqu’à son arrivée si le parking a activé le suivi en direct. Après la remise de la voiture, vous recevez un dernier message de clôture.",
          "Le prix affiché est celui que vous payez : la commission de " +
            PRODUCT_NAME +
            " est comprise, et il n’y a pas de frais ajoutés à l’arrivée. Les services annexes (lavage, plein, recharge), qui ne se réservent pas en ligne, et les jours au-delà de la date de retour réservée sont réglés directement au parking, à son tarif.",
        ],
      },
      {
        id: "annulation",
        short: "Annulation et modification",
        title: "Annulation, modification, retard : ce qu’il faut savoir",
        paragraphs: [
          "Chaque parking partenaire choisit ses conditions d’annulation parmi quatre formules : annulation gratuite jusqu’à l’heure de dépôt prévue, jusqu’à 24 heures avant, jusqu’à 48 heures avant, ou non annulable. Elles sont affichées sur la fiche, rappelées avant le paiement et dans la confirmation. Dans le délai d’annulation gratuite, vous annulez vous-même depuis Ma réservation et le prix est intégralement remboursé, automatiquement. Après ce délai, le prix reste dû ; vous pouvez vous adresser au parking, libre de consentir un geste commercial.",
          "Les numéros de vol se modifient en ligne jusqu’au retour. Pour un changement de dates, d’heures ou de véhicule, contactez le parking ; à défaut d’accord, vous pouvez annuler dans les conditions ci-dessus et réserver à nouveau. Un retour anticipé ne donne pas lieu à remboursement ; un retour plus tard que prévu prolonge le séjour, et la prolongation est facturée par le parking, à son tarif.",
          `À titre de comparaison, l’aéroport annonce pour ses parkings réservés en ligne, sauf le P1, géré par Lyon Parc Auto, une annulation gratuite jusqu’à une heure avant l’arrivée prévue au parking (quatre heures au P7) et une « garantie retard » : pas de supplément si votre avion atterrit en retard, à condition d’avoir indiqué votre numéro de vol retour (relevé le ${o.readOn}). Dans les parkings privés, le suivi du vol sert d’abord à la navette, qui vous attend ; il ne vous dispense pas de payer la prolongation, facturée par le parking, si vous rentrez après la date et l’heure réservées.`,
        ],
      },
      {
        id: "conseils",
        short: "La check-list",
        title: "Jour du dépôt, jour du retour : la check-list",
        paragraphs: ["Quelques gestes simples évitent la plupart des petits tracas au parking, à l’aller comme au retour."],
        list: [
          "Gardez la confirmation à portée de main : la référence, l’adresse et le téléphone du parking y sont.",
          "Arrivez au parking à l’heure indiquée, avec la marge de la navette et de l’accueil, et prévenez en cas de retard.",
          "Prenez quelques photos de la voiture et notez le kilométrage ; avec un voiturier, laissez seulement la clé du véhicule.",
          "Retirez les objets de valeur, les papiers (carte grise comprise) et les appareils.",
          "Notez votre place ou votre file, ou enregistrez la position de la voiture dans l’application.",
          "Vérifiez vos numéros de vol aller et retour sur Ma réservation : c’est ce qui permet au parking de suivre votre atterrissage.",
          "Au retour, allumez votre téléphone dès l’atterrissage : le SMS du parking indique le point de rendez-vous de la navette.",
          "Avant de reprendre la route, faites le tour de la voiture avec la personne du parking et signalez tout de suite ce qui vous paraît anormal.",
        ],
      },
    ],
    faq: [
      [
        "Où sont les terminaux de Lyon Saint-Exupéry ?",
        `L’aéroport a deux terminaux, le Terminal 1 et le Terminal 2, reliés entre eux et voisins de la gare TGV. Depuis le ${o.t2Closed}, le Terminal 2 est fermé pour travaux et tous les vols partent du Terminal 1, où la navette du parking vous conduit.`,
      ],
      [
        "Quel est le parking le moins cher à l’aéroport de Lyon ?",
        `Selon l’aéroport, le moins cher de ses parkings officiels est le P7, mais il n’ouvre qu’en période d’affluence et se réserve en ligne seulement. Sur la grille 2026 sans réservation, le moins cher est le P5, le parking économique desservi par navette : ${o.week.p5} la semaine, moins en ligne à l’avance. Les parkings privés avec navette sont souvent au même niveau ou en dessous : indiquez vos dates en haut de la page, et les partenaires s’affichent du moins cher au plus cher d’après le prix total.`,
      ],
      [
        "Combien coûte une semaine de parking à Lyon Saint-Exupéry ?",
        week
          ? `Aujourd’hui, ${week} (du jour d’arrivée au jour de retour) chez nos parkings partenaires, frais compris. À l’aéroport, une semaine sans réservation va de ${o.week.p5} au P5 à ${o.week.p0} au P0 (grille 2026), et les tarifs en ligne à l’avance sont annoncés « à partir de ${o.online.from} ».`
          : `À l’aéroport, une semaine sans réservation va de ${o.week.p5} au P5 à ${o.week.p0} au P0 (grille 2026), et les tarifs en ligne à l’avance sont annoncés « à partir de ${o.online.from} ». Chez nos parkings partenaires, le prix dépend du parking et de vos dates : indiquez-les en haut de la page pour voir le prix total de chacun.`,
      ],
      [
        "Existe-t-il un parking gratuit à l’aéroport de Lyon ?",
        `Pas pour un voyage. Les parkings minute au pied du Terminal 1 et à la gare TGV sont gratuits pendant ${o.minute.free}, le temps de déposer quelqu’un, puis facturés à la minute ; les zones d’attente aux entrées de l’aéroport sont gratuites une heure, conducteur présent.`,
      ],
      ["La navette est-elle gratuite ?", "Oui : chez nos parkings partenaires, la navette jusqu’au terminal et le retour sont compris dans le prix. À l’aéroport, les navettes du P5 et du P7 sont gratuites elles aussi."],
      [
        "Combien coûte le parking P5 de l’aéroport de Lyon ?",
        `Sans réservation, la grille 2026 du P5 affiche ${o.grid.P5[0]} pour 24 h, ${o.week.p5} pour une semaine, ${o.twoWeeks.p5} pour deux semaines et ${o.grid.P5[6]} pour un mois, puis 4 € par jour (relevé le ${o.readOn}). Pour une réservation en ligne à l’avance, l’aéroport annonce des tarifs « à partir de ${o.online.from} ».`,
      ],
      [
        "Quels parkings de l’aéroport de Lyon sont couverts ?",
        "Le P0 (souterrain, sous les terminaux), le P1 (au pied du Terminal 1) et le P3 (face au Terminal 1). Les deux premiers sont limités à 1,90 m de hauteur, le P3 à 2,10 m. Chez les parkings privés, le filtre « Couvert » des résultats repère ceux qui proposent une partie couverte ou des box.",
      ],
      [
        "Où se garer avec un véhicule haut, un van ou un camping-car ?",
        `Pas dans les parkings couverts de l’aéroport (1,90 m au P0 et au P1, 2,10 m au P3). Le P2 et le P4 acceptent 2,50 m, le P5 ${o.p5Height}, avec une voie dédiée aux véhicules plus hauts, et le P7, ouvert en période d’affluence, n’annonce aucune limite de hauteur. Les parkings privés en plein air n’ont généralement pas de limite, mais demandez-leur avant de réserver pour un camping-car, qui occupe plusieurs places.`,
      ],
      [
        "Peut-on laisser sa voiture trois semaines ou un mois ?",
        `Oui. À l’aéroport, le P5 est fait pour la longue durée (${o.grid.P5[5]} pour trois semaines, ${o.grid.P5[6]} pour un mois sans réservation, puis 4 € par jour), et sa version robotisée accepte les séjours de 3 à 30 jours. Les parkings privés proposent des tarifs dégressifs et acceptent les séjours longs ; vérifiez la batterie avant de partir et prévenez le parking si vous rentrez plus tard.`,
      ],
      [
        "Combien de temps dure la navette jusqu’au terminal ?",
        rideWords
          ? `Chez nos parkings partenaires, la navette met ${rideWords} selon le parking ; la durée est indiquée sur chaque fiche. À l’aéroport, la navette du P5 passe ${o.p5Shuttle.every}, et l’aéroport compte ${o.p5Shuttle.door} de la voiture au Terminal 1.`
          : `Cela dépend du parking : chaque fiche indique la durée de sa navette jusqu’au terminal. À l’aéroport, la navette du P5 passe ${o.p5Shuttle.every}, et l’aéroport compte ${o.p5Shuttle.door} de la voiture au Terminal 1, marche et attente comprises.`,
      ],
      [
        "Que se passe-t-il si mon vol retour a du retard ?",
        "Si vous avez indiqué votre numéro de vol retour, le parking suit l’heure d’atterrissage réelle de votre vol et adapte sa navette : vous n’avez rien à faire. À l’atterrissage, vous recevez un SMS avec le point de rendez-vous. Si le retard vous fait rentrer après l’heure réservée, le séjour est prolongé et la prolongation est facturée par le parking, à son tarif.",
      ],
      [
        "Mon vol est annulé ou mes dates changent : que faire ?",
        "Changez vos numéros de vol vous-même depuis Ma réservation, jusqu’au retour. Pour de nouvelles dates, contactez le parking ; à défaut d’accord, vous pouvez annuler dans le délai d’annulation gratuite indiqué dans votre confirmation (jusqu’à l’heure de dépôt, 24 h ou 48 h avant selon le parking) et réserver à nouveau : le remboursement est automatique. Pour une réservation non annulable, ou une fois ce délai passé, le prix reste dû ; vous pouvez vous adresser au parking, libre de consentir un geste commercial.",
      ],
      [
        "Peut-on réserver un parking la veille ou le jour même ?",
        "Oui, tant qu’il reste de la place : la réservation est possible jusqu’à l’heure de dépôt. En période chargée (samedis d’hiver, vacances scolaires, ponts), réservez plutôt deux à quatre semaines à l’avance, les parkings les plus proches affichant complet en premier.",
      ],
      [
        "Faut-il laisser ses clés au parking ?",
        "Seulement dans un parking avec voiturier, où le parking range et avance la voiture pour vous ; laissez alors la clé du véhicule seule, pas tout le trousseau. Dans un parking où l’on se gare soi-même, vous gardez vos clés. Chaque fiche précise la formule, et le filtre « Voiturier » ne garde que les parkings qui le proposent.",
      ],
      [
        "La voiture est-elle surveillée et assurée pendant le séjour ?",
        "Les parkings de l’aéroport sont surveillés 24 h sur 24 et 7 jours sur 7. Chez les parkings privés partenaires, chaque fiche indique si le terrain est clôturé et s’il est sous vidéosurveillance, et un parking avec voiturier est responsable du véhicule qu’on lui confie. Dans tous les cas, votre propre assurance reste en vigueur : retirez les objets de valeur et faites le tour de la voiture à l’arrivée et au retour.",
      ],
      [
        "Peut-on recharger une voiture électrique pendant le séjour ?",
        `À l’aéroport, oui : ${o.chargers.p2} bornes au P2, ${o.chargers.p4} au P4 et ${o.chargers.p5} au P5, en libre-service et sans réservation, et deux parkings entièrement électriques réservables en ligne, le P4 Elec et le P5 Elec (relevé le ${o.readOn}). Chez les parkings privés, la recharge est un service à part, affiché sur la fiche quand il existe : filtrez sur « Recharge électrique » et précisez-le à la réservation.`,
      ],
      [
        "Y a-t-il un parking moto à l’aéroport de Lyon ?",
        `Oui, au P0 uniquement, à moitié prix : ${o.week.moto} la semaine et ${o.twoWeeks.moto} les deux semaines sans réservation (grille 2026). Chez les parkings privés, renseignez-vous avant de réserver : certains acceptent les deux-roues, à un tarif qui leur est propre.`,
      ],
      [
        "Quelle est la différence entre un parking minute et un parking de proximité ?",
        `Le parking minute sert à déposer ou à récupérer quelqu’un : les 10 premières minutes sont gratuites, puis ${o.minute.then} ; ${o.minute.cap}. Un parking de proximité (P2, P3 ou P4), comme les parkings couverts P0 et P1, sert à stationner le temps d’un voyage, à la journée ou à la semaine.`,
      ],
      [
        "Comment rejoindre l’aéroport de Lyon sans voiture ?",
        "En tram express, le Rhônexpress part de la gare de Lyon Part-Dieu et met une trentaine de minutes ; en train, on rejoint le terminal à pied depuis la gare TGV Lyon Saint-Exupéry. Si quelqu’un vous dépose en voiture, le parking minute est gratuit 10 minutes.",
      ],
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

/** Every text of a guide, in reading order: what a traveller (and a search engine) reads. */
export function guideTexts(guide: AirportGuide): string[] {
  const table = (t: GuideTable | undefined) => (t ? [t.caption, ...t.columns, ...t.rows.flat(), ...(t.note ? [t.note] : [])] : []);
  return [
    guide.title,
    guide.intro,
    ...guide.sections.flatMap(s => [s.title, ...s.paragraphs, ...table(s.table), ...(s.list ?? []), ...(s.parts ?? []).flatMap(p => [p.title, ...p.paragraphs, ...table(p.table), ...(p.list ?? [])])]),
    ...guide.faq.flat(),
  ];
}

/** Words of a guide, the way a word counter sees them (the « 4 200 mots » target of 09/10/2026). */
export function guideWordCount(guide: AirportGuide): number {
  return guideTexts(guide)
    .join(" ")
    .split(/\s+/)
    .filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}
