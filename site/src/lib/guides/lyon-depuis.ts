// 17/11/2026 (« fais les pages ville et gare », mockup A « Page depuis une ville »): one page per city the travellers of
// Lyon Saint-Exupéry drive from. The road figures were read on 17/11/2026 with OSRM (OpenStreetMap data, router
// project-osrm.org), from the city centre to Terminal 1, without traffic; distances rounded to the kilometre, times to five
// minutes. Tolls are not stated (not checked). Trains: only the cities the airport itself lists as served from its TGV
// station (lyonaeroports.com, page « Gare TGV Lyon Saint-Exupéry », read 17/11/2026).
import { capitalise, LYON_OFFICIAL, offerText, rideMinutes, type GuideSection, type GuideTrip, type TopicFacts, type TopicGuide } from "../airport-guides";
import { PRODUCT_NAME } from "../product";
import { topicPath, type GuideTopicSlug } from "./topics";

const AIRPORT = "lyon-saint-exupery";
const CHECKED = "2026-11-17";
const SOURCE = "Itinéraire calculé le 17 novembre 2026 avec OSRM (données OpenStreetMap), du centre-ville au Terminal 1, sans circulation. Les péages ne sont pas indiqués.";

interface City {
  slug: Extract<GuideTopicSlug, `depuis-${string}`>;
  name: string;
  /** « de Grenoble », « d’Annecy ». */
  of: string;
  km: number;
  /** OSRM duration, rounded to the minute. */
  minutes: number;
  roads: string[];
  /** The airport lists a daily train to this city from its TGV station. */
  train: boolean;
  /** One sentence on the road that only this city has. */
  road: string;
}

// Figures of the OSRM run of 17/11/2026 (km and minutes as returned, rounded).
const CITIES: City[] = [
  { slug: "depuis-grenoble", name: "Grenoble", of: "de Grenoble", km: 91, minutes: 63, roads: ["A48", "A43", "A432"], train: true,
    road: "On quitte Grenoble par l’A48 en direction de Lyon, on rejoint l’A43 vers Lyon, puis on prend l’A432 vers l’aéroport, signalé depuis l’autoroute." },
  { slug: "depuis-chambery", name: "Chambéry", of: "de Chambéry", km: 87, minutes: 63, roads: ["A43", "A432"], train: true,
    road: "Depuis Chambéry, l’A43 mène presque jusqu’à l’aéroport : on la suit en direction de Lyon, puis on bifurque sur l’A432, signalée vers l’aéroport." },
  { slug: "depuis-annecy", name: "Annecy", of: "d’Annecy", km: 125, minutes: 83, roads: ["A41", "A43", "A432"], train: true,
    road: "Depuis Annecy, on descend l’A41 vers Chambéry, on prend l’A43 en direction de Lyon, puis l’A432 vers l’aéroport." },
  { slug: "depuis-saint-etienne", name: "Saint-Étienne", of: "de Saint-Étienne", km: 76, minutes: 66, roads: ["A47", "A46", "A43", "A432"], train: false,
    road: "Depuis Saint-Étienne, l’A47 rejoint la vallée du Rhône ; on contourne ensuite Lyon par l’est avec l’A46, puis on prend l’A43 et l’A432 vers l’aéroport." },
  { slug: "depuis-bourgoin-jallieu", name: "Bourgoin-Jallieu", of: "de Bourgoin-Jallieu", km: 28, minutes: 24, roads: ["A43", "A432"], train: false,
    road: "Bourgoin-Jallieu est sur l’A43 : on la prend en direction de Lyon, puis l’A432 vers l’aéroport, quelques kilomètres plus loin." },
  { slug: "depuis-vienne", name: "Vienne", of: "de Vienne", km: 46, minutes: 38, roads: ["A7", "A46", "A43", "A432"], train: false,
    road: "Depuis Vienne, on remonte l’A7 vers Lyon, on prend l’A46 qui contourne Lyon par l’est, puis l’A43 et l’A432 vers l’aéroport." },
  { slug: "depuis-villefranche-sur-saone", name: "Villefranche-sur-Saône", of: "de Villefranche-sur-Saône", km: 54, minutes: 42, roads: ["A6", "A46", "A432"], train: false,
    road: "Depuis Villefranche-sur-Saône, on descend l’A6 vers Lyon, on prend l’A46 qui contourne Lyon par l’est, puis l’A432 vers l’aéroport, sans traverser Lyon." },
  { slug: "depuis-macon", name: "Mâcon", of: "de Mâcon", km: 93, minutes: 67, roads: ["A6", "A46", "A432"], train: false,
    road: "Depuis Mâcon, on descend l’A6 vers Lyon, on prend l’A46 qui contourne Lyon par l’est, puis l’A432 vers l’aéroport, sans traverser Lyon." },
  { slug: "depuis-bourg-en-bresse", name: "Bourg-en-Bresse", of: "de Bourg-en-Bresse", km: 76, minutes: 59, roads: ["A40", "A42", "A432"], train: false,
    road: "Depuis Bourg-en-Bresse, on prend l’A40, puis l’A42 en direction de Lyon, et l’A432 vers l’aéroport, qui arrive par le nord." },
];

/** « environ 1 h 05 », « environ 40 min » (rounded to five minutes). */
export function driveText(minutes: number): string {
  const rounded = Math.max(5, Math.round(minutes / 5) * 5);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

const roadsText = (roads: string[]) => (roads.length === 1 ? roads[0] : `${roads.slice(0, -1).join(", ")} puis ${roads[roads.length - 1]}`);

function cityGuide(city: City, facts: TopicFacts): TopicGuide {
  const o = LYON_OFFICIAL;
  const drive = driveText(city.minutes);
  const ride = facts.shuttle ? rideMinutes(facts.shuttle) : null;
  const week = facts.week ? offerText(facts.week) : null;
  const trip: GuideTrip = { from: city.name, km: city.km, minutes: city.minutes, roads: city.roads, note: SOURCE };
  const others = CITIES.filter(c => c.slug !== city.slug);

  const sections: GuideSection[] = [
    {
      id: "trajet",
      short: "Le trajet",
      title: `Le trajet ${city.of} à l’aéroport`,
      paragraphs: [
        `${city.name} est à environ ${city.km} km de l’aéroport de Lyon Saint-Exupéry par la route, soit environ ${drive} de voiture sans circulation, du centre-ville au Terminal 1. ${city.road}`,
        "Ce temps est celui d’une route dégagée. Aux heures de pointe autour de Lyon, le matin et en fin de journée, et les jours de grands départs, comptez davantage : les abords de l’aéroport, l’A43 et l’A432 sont chargés les samedis d’hiver et au début des vacances scolaires.",
        `Le parking privé que vous choisissez n’est pas au terminal mais dans une commune voisine : la fiche de chaque parking donne son adresse et son itinéraire. La navette gratuite du parking vous conduit ensuite au Terminal 1${ride ? `, en ${ride} chez les parkings partenaires de ${PRODUCT_NAME}` : ""}.`,
      ],
    },
    {
      id: "trois-temps",
      short: "Votre départ",
      title: "Votre départ, en trois temps",
      paragraphs: [
        "Le jour du départ, l’heure à laquelle quitter la maison se calcule à rebours, à partir de l’heure à laquelle votre compagnie vous demande d’être à l’aéroport : elle figure sur votre billet ou dans l’application de la compagnie.",
      ],
      table: {
        caption: `De ${city.name} au Terminal 1`,
        columns: ["Combien de temps", "Ce qu’il faut savoir"],
        rows: [
          ["1. La route", `Environ ${drive} sans circulation`, `${city.km} km par ${roadsText(city.roads)} ; davantage aux heures de pointe`],
          ["2. L’accueil au parking", "Quelques minutes", "Vous laissez la voiture à l’accueil ; prévenez de votre arrivée depuis « Ma réservation »"],
          ["3. La navette", ride ? capitalise(ride) : "Indiqué sur chaque fiche", "Gratuite, jusqu’au Terminal 1, où partent tous les vols"],
        ],
        note: SOURCE,
      },
    },
    {
      id: "terminal-1",
      short: "Terminal 1",
      title: "Tous les vols partent du Terminal 1",
      paragraphs: [
        `Depuis le ${o.t2Closed}, le Terminal 2 est fermé pour travaux et tous les vols partent du Terminal 1. La navette du parking s’arrête là où l’aéroport autorise les navettes des parkings extérieurs, à quelques minutes à pied de l’aérogare ; le parking vous indique l’endroit exact au moment de la réservation.`,
      ],
    },
    {
      id: "prix",
      short: "Le prix",
      title: "Combien coûte le parking pour une semaine",
      paragraphs: [
        week
          ? `Pour une semaine, les parkings partenaires de ${PRODUCT_NAME} sont réservables ${week}, navette comprise. Le prix affiché est le prix total du séjour, payé en ligne à la réservation.`
          : `Le prix affiché par ${PRODUCT_NAME} est le prix total du séjour, navette comprise, payé en ligne à la réservation. Indiquez vos dates dans le formulaire pour voir les parkings disponibles et leur prix.`,
        `À titre de repère, la grille 2026 de l’aéroport, sans réservation, affiche ${o.week.p5} la semaine au parking économique P5 et ${o.week.p3} au P3, couvert et face au Terminal 1. Le guide de l’aéroport détaille tous les parkings officiels et leurs tarifs.`,
      ],
      more: { href: topicPath(AIRPORT, "parking-pas-cher"), label: "Se garer pas cher à Lyon Saint-Exupéry" },
    },
    {
      id: "retour",
      short: "Au retour",
      title: `Au retour, avant de reprendre la route ${city.of.replace(/^de /, "vers ").replace(/^d’/, "vers ")}`,
      paragraphs: [
        "Au retour, le parking suit votre vol quand vous avez donné son numéro à la réservation : il connaît l’heure réelle d’atterrissage, et un message vous indique où retrouver la navette. Depuis « Ma réservation », vous pouvez aussi signaler un retard ou un bagage perdu.",
        `La navette vous ramène au parking, où vous reprenez la voiture pour environ ${drive} de route jusqu’à ${city.name}. Après un vol de nuit ou un long voyage, prévoyez une pause si la fatigue se fait sentir.`,
      ],
    },
  ];
  if (city.train) {
    sections.push({
      id: "train",
      short: "En train",
      title: `${city.name} et l’aéroport en train`,
      paragraphs: [
        `L’aéroport a sa propre gare TGV, à quelques minutes à pied des terminaux. Selon l’aéroport, des trains la relient chaque jour à ${city.name} : horaires et billets sur le site de la SNCF ou aux bornes de la gare, l’aéroport n’ayant pas de guichet de vente. Si vous préférez la voiture, la page consacrée à la gare explique aussi où se garer à côté.`,
      ],
      more: { href: topicPath(AIRPORT, "parking-gare-tgv"), label: "Parking près de la gare TGV Lyon Saint-Exupéry" },
    });
  }
  sections.push({
    id: "villes-voisines",
    short: "Autres villes",
    title: "Depuis les autres villes de la région",
    paragraphs: ["Les mêmes repères, relevés le même jour et de la même façon, pour les autres villes d’où partent les voyageurs de Lyon Saint-Exupéry."],
    table: {
      caption: "Trajet en voiture jusqu’au Terminal 1",
      columns: ["Distance", "Sans circulation", "Autoroutes"],
      rows: others.map(c => [c.name, `${c.km} km`, driveText(c.minutes), c.roads.join(", ")]),
      note: SOURCE,
    },
  });

  const faq: [string, string][] = [
    [
      `Combien de temps faut-il pour aller ${city.of} à l’aéroport de Lyon Saint-Exupéry ?`,
      `Environ ${drive} en voiture sans circulation, pour environ ${city.km} km du centre ${city.of} au Terminal 1. Comptez davantage aux heures de pointe autour de Lyon et les jours de grands départs.`,
    ],
    [
      `Quelle route prendre ${city.of} pour l’aéroport ?`,
      `${city.road} L’aéroport est signalé depuis l’A432, qui le dessert par deux sorties.`,
    ],
    [
      "À quelle heure partir de chez moi ?",
      `Partez de l’heure à laquelle votre compagnie vous demande d’être à l’aéroport, puis retirez le temps de la navette du parking${ride ? ` (${ride})` : ""}, quelques minutes d’accueil et environ ${drive} de route. Les jours chargés, un départ 30 minutes plus tôt suffit en général.`,
    ],
    [
      "Le parking est-il à l’aéroport ?",
      "Non : les parkings privés sont dans les communes voisines, à quelques minutes de route de l’aérogare. Leur navette gratuite vous conduit au Terminal 1 et vient vous rechercher au retour.",
    ],
    [
      "Combien coûte une semaine de parking ?",
      week
        ? `Les parkings partenaires de ${PRODUCT_NAME} sont réservables ${week}, navette comprise, au prix total affiché. Les dates du formulaire donnent le prix exact de votre séjour.`
        : `Le prix total du séjour, navette comprise, s’affiche dès que vous indiquez vos dates dans le formulaire de recherche ${PRODUCT_NAME}, et il est payé en ligne à la réservation.`,
    ],
  ];
  if (city.train) {
    faq.push([
      `Peut-on aller ${city.of} à l’aéroport en train ?`,
      `Oui, selon l’aéroport, des trains relient chaque jour sa gare TGV à ${city.name}. La gare est à quelques minutes à pied des terminaux ; les billets s’achètent en ligne ou aux bornes de la gare.`,
    ]);
  }

  return {
    slug: city.slug,
    short: `Depuis ${city.name}`,
    metaTitle: `Parking aéroport Lyon Saint-Exupéry depuis ${city.name}`,
    metaDescription: `${city.name} – aéroport de Lyon Saint-Exupéry : ${city.km} km, environ ${drive} par ${city.roads.join(" et ")}. Parkings avec navette au Terminal 1, prix total affiché.`.slice(0, 160),
    title: `Parking à l’aéroport de Lyon Saint-Exupéry quand on part ${city.of}`,
    intro: `Vous partez ${city.of} et prenez l’avion à Lyon Saint-Exupéry ? Voici le trajet en voiture, relevé et daté, ce qu’il faut prévoir le jour du départ, et les parkings avec navette où laisser la voiture le temps du voyage.`,
    published: CHECKED,
    updated: CHECKED,
    trip,
    sections,
    faq,
    partners: {
      filter: "all",
      stayDays: 7,
      title: "Les parkings avec navette, pour une semaine",
      lead: "La liste ne garde que les parkings partenaires disponibles pour les dates du formulaire, du moins cher au plus cher d’après le prix total du séjour, navette comprise.",
      empty: "Aucun parking partenaire n’est réservable en ligne pour ces dates. Essayez d’autres dates avec le formulaire de recherche ; le guide de l’aéroport présente aussi les parkings officiels et leurs tarifs 2026.",
    },
  };
}

export const LYON_CITIES = CITIES;

type CitySlug = Extract<GuideTopicSlug, `depuis-${string}`>;

export const lyonCityGuides = Object.fromEntries(CITIES.map(city => [city.slug, (facts: TopicFacts) => cityGuide(city, facts)])) as Record<CitySlug, (facts: TopicFacts) => TopicGuide>;
