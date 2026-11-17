// 17/11/2026 (« fais les pages ville et gare »): parking near the TGV station of Lyon Saint-Exupéry. Station facts read on
// 17/11/2026 on lyonaeroports.com (pages « Gare TGV Lyon Saint-Exupéry », « Parkings », « Parking minute ») and, for its
// history and the walkway, on the French Wikipedia page « Gare de Lyon-Saint-Exupéry TGV ». Not stated because not
// checked: the walking time from the station to Terminal 1, whether the walkway is covered, TER services.
import { offerText, rideMinutes, LYON_OFFICIAL, type TopicFacts, type TopicGuide } from "../airport-guides";
import { PRODUCT_NAME } from "../product";
import { topicPath } from "./topics";

const AIRPORT = "lyon-saint-exupery";

/** What the airport says about its station, read on 17/11/2026. */
export const LYON_STATION = {
  readOn: "17 novembre 2026",
  trains: "des trains SNCF (TGV et OUIGO) et Trenitalia",
  cities: "30 villes en France et en Italie",
  walkway: "une passerelle de 250 m équipée d’un trottoir roulant",
  rhonexpress: "au niveau -1 de la gare",
};

export function lyonGareTgv(facts: TopicFacts): TopicGuide {
  const o = LYON_OFFICIAL;
  const s = LYON_STATION;
  const ride = facts.shuttle ? rideMinutes(facts.shuttle) : null;
  const week = facts.week ? offerText(facts.week) : null;
  return {
    slug: "parking-gare-tgv",
    short: "Parking gare TGV",
    metaTitle: "Parking gare TGV Lyon Saint-Exupéry : où se garer",
    metaDescription: "Se garer près de la gare TGV Lyon Saint-Exupéry : parkings P2, P3 et P4, dépose-minute de la gare, Rhônexpress et parkings privés avec navette.",
    title: "Parking près de la gare TGV Lyon Saint-Exupéry",
    intro: `La gare TGV Lyon Saint-Exupéry est dans l’enceinte de l’aéroport, à quelques minutes à pied des terminaux. Que vous preniez le train ou l’avion, voici où laisser la voiture à côté, ce que coûte le dépose-minute de la gare et comment la rejoindre sans voiture. Faits relevés le ${s.readOn} sur le site de l’aéroport.`,
    published: "2026-11-17",
    updated: "2026-11-17",
    sections: [
      {
        id: "la-gare",
        short: "La gare",
        title: "La gare TGV de l’aéroport",
        paragraphs: [
          `Selon l’aéroport, ${s.trains} relient chaque jour la gare à ${s.cities}, parmi lesquelles Paris, Lille, Grenoble, Chambéry, Annecy, Marseille, Montpellier et Nice. La gare est reliée à l’aéroport par ${s.walkway}, et elle est à quelques minutes à pied des terminaux et de la gare routière de l’aéroport.`,
          "Il n’y a pas de guichet de vente à l’aéroport : les billets s’achètent en ligne ou aux bornes libre-service de la gare.",
          "Conçue par l’architecte Santiago Calatrava avec l’agence d’étude des gares de la SNCF, la gare a été inaugurée en 1994 sous le nom de Satolas-TGV ; elle porte son nom actuel depuis 2000.",
        ],
      },
      {
        id: "parkings-officiels",
        short: "Parkings officiels",
        title: "Les parkings de l’aéroport près de la gare",
        paragraphs: [
          "L’aéroport cite trois parkings à proximité de la gare TGV : le P4, situé en face de la gare, le P2, en plein air près de la gare, et le P3, couvert, face au Terminal 1. Ils se réservent sur le site de l’aéroport, et le P4 a une version entièrement électrique, le P4 Elec.",
        ],
        table: {
          caption: "Parkings officiels près de la gare TGV",
          columns: ["Emplacement", "Couvert", "Hauteur", "Une semaine sans réservation"],
          rows: [
            ["P4", "En plein air, face à la gare TGV", "Non", "2,50 m", o.week.p4],
            ["P2", "En plein air, près de la gare TGV", "Non", "2,50 m", o.week.p2],
            ["P3", "Couvert, face au Terminal 1", "Oui", "2,10 m", o.week.p3],
          ],
          note: `Grille 2026 de l’aéroport, tarifs sans réservation, relevée le ${o.readOn} ; emplacements d’après le site de l’aéroport, relus le ${s.readOn}.`,
        },
      },
      {
        id: "depose-minute",
        short: "Dépose-minute",
        title: "Déposer quelqu’un à la gare",
        paragraphs: [
          `Le parking minute de la gare TGV est au pied de la gare. Les ${o.minute.free} sont gratuites ; ${o.minute.then}. ${o.minute.cap.charAt(0).toUpperCase()}${o.minute.cap.slice(1)}.`,
          "Pour attendre quelqu’un plus longtemps, l’aéroport propose une offre accompagnant au P2, au P3 et au P4 : 6 € pour deux heures et 9 € pour quatre heures, d’après son site.",
        ],
      },
      {
        id: "parking-prive",
        short: "Parking privé",
        title: "Laisser la voiture dans un parking privé avec navette",
        paragraphs: [
          `Pour un voyage de plusieurs jours, les parkings privés des environs coûtent en général moins cher que ceux de l’aéroport. Vous laissez la voiture à l’accueil, et la navette gratuite du parking vous conduit à l’aérogare${ride ? `, en ${ride} chez les parkings partenaires de ${PRODUCT_NAME}` : ""}. La navette s’arrête là où l’aéroport autorise les navettes des parkings extérieurs ; la gare est à quelques minutes à pied des terminaux.`,
          week
            ? `Pour une semaine, les parkings partenaires de ${PRODUCT_NAME} sont réservables ${week}, navette comprise, au prix total affiché et payé en ligne.`
            : `${PRODUCT_NAME} affiche le prix total du séjour, navette comprise, payé en ligne à la réservation : indiquez vos dates pour voir les parkings disponibles.`,
          "Certains parkings desservent aussi d’autres arrêts que l’aérogare : la fiche de chaque parking liste ses dessertes. Si vous partez en train, dites-le au parking pour savoir où la navette vous dépose et vous reprend.",
        ],
        more: { href: topicPath(AIRPORT, "parking-pas-cher"), label: "Se garer pas cher à Lyon Saint-Exupéry" },
      },
      {
        id: "rhonexpress",
        short: "Rhônexpress",
        title: "Sans voiture : le Rhônexpress",
        paragraphs: [
          `Le terminus du tram Rhônexpress est ${s.rhonexpress} TGV. Il relie l’aéroport au centre de Lyon, gare de la Part-Dieu, en moins de 30 minutes selon l’aéroport. C’est la solution la plus simple si vous habitez près d’une gare lyonnaise.`,
        ],
      },
      {
        id: "retour",
        short: "Au retour",
        title: "Au retour",
        paragraphs: [
          "Si vous rentrez en avion, le parking suit votre vol quand vous avez donné son numéro à la réservation, et un message vous indique où retrouver la navette à l’atterrissage. Si vous rentrez en train, prévenez le parking de votre heure d’arrivée depuis « Ma réservation » ou par téléphone : sa fiche donne ses consignes et son numéro.",
        ],
      },
    ],
    faq: [
      [
        "Où se garer près de la gare TGV Lyon Saint-Exupéry ?",
        `Les parkings de l’aéroport les plus proches de la gare sont le P4, en face d’elle, le P2 et le P3. Sans réservation, une semaine coûte ${o.week.p4} au P4, ${o.week.p2} au P2 et ${o.week.p3} au P3 d’après la grille 2026 ; les parkings privés avec navette sont en général moins chers.`,
      ],
      [
        "Le dépose-minute de la gare TGV est-il gratuit ?",
        `Oui pendant les ${o.minute.free} : ensuite, ${o.minute.then}. Au-delà de cinq passages en 24 h, tous parkings minute confondus, l’aéroport applique un forfait de 80 €.`,
      ],
      [
        "La gare TGV est-elle loin des terminaux ?",
        `Non : selon l’aéroport, elle est à quelques minutes à pied des terminaux. Elle est reliée à l’aéroport par ${s.walkway}. Tous les vols partent aujourd’hui du Terminal 1.`,
      ],
      [
        "Quels trains desservent la gare de l’aéroport ?",
        `D’après l’aéroport, ${s.trains}, vers ${s.cities}. Les billets s’achètent en ligne ou aux bornes de la gare, l’aéroport n’ayant pas de guichet de vente.`,
      ],
      [
        "Le Rhônexpress s’arrête-t-il à la gare TGV ?",
        `Oui, son terminus est ${s.rhonexpress} TGV. Il relie l’aéroport à la gare de Lyon Part-Dieu en moins de 30 minutes selon l’aéroport.`,
      ],
      [
        "Peut-on laisser sa voiture dans un parking privé pour prendre le train à l’aéroport ?",
        "Oui : la navette gratuite du parking vous conduit à l’aérogare, et la gare est à quelques minutes à pied. Prévenez le parking que vous partez en train, pour savoir où la navette vous dépose et vous reprend au retour.",
      ],
    ],
    partners: {
      filter: "all",
      stayDays: 7,
      title: "Les parkings avec navette, pour une semaine",
      lead: "La liste ne garde que les parkings partenaires disponibles pour les dates du formulaire, du moins cher au plus cher d’après le prix total du séjour, navette comprise.",
      empty: "Aucun parking partenaire n’est réservable en ligne pour ces dates. Essayez d’autres dates avec le formulaire de recherche, ou voyez les parkings officiels de l’aéroport plus bas.",
    },
  };
}
