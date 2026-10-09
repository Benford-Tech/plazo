// Topic guide « Parking longue durée » of Lyon Saint-Exupéry (09/10/2026): lyonaeroports.com (parkings, parking FAQ, P5+ page, chargers, T2 closure) and its 2026 tariff sheet, TCS advice on long immobilisation, 2026-2027 school calendar.
import { capitalise, LYON_OFFICIAL, offerText, rideMinutes, type GuideSection, type TopicFacts, type TopicGuide } from "../airport-guides";
import { PRODUCT_NAME } from "../product";

type Grid = keyof typeof LYON_OFFICIAL.grid;
type Offer = { priceCents: number; days: number };

/** « 167,90 € » → 167.9 (and « + 4 € par jour » → 4). */
const amount = (text: string) => Number(text.replace(/[^\d,]/g, "").replace(",", "."));
/** 5.5967 → « 5,60 € ». */
const euros = (value: number) => `${value.toFixed(2).replace(".", ",")} €`;
/** Price of a grid column divided by its days. */
const perDay = (text: string, days: number) => euros(amount(text) / days);
/** « 4 € », the price of each day after the 30th. */
const extraDay = (parking: Grid) => LYON_OFFICIAL.grid[parking][7].replace(/^\+\s*/, "").replace(/\s*par jour$/, "");
/** Price of the 30-day column plus twelve extra days (six weeks). */
const sixWeeks = (parking: Grid) => euros(amount(LYON_OFFICIAL.grid[parking][6]) + 12 * amount(LYON_OFFICIAL.grid[parking][7]));
/** An offer of the partners, per billable day. */
const offerPerDay = ({ priceCents, days }: Offer) => euros(priceCents / 100 / days);

/**
 * Overstay fees of an airport booking already started (TTC, paid at the exit terminal), from the FAQ « Réservation
 * Parking » of lyonaeroports.com read on 09/10/2026: up to 1 h, 1 to 4 h, 4 to 12 h, 12 to 24 h, each further 24 h.
 */
const OVERSTAY: string[][] = [
  ["P0 · P1", "Gratuit", "2,00 €", "4,00 €", "6,00 €", "20,00 €"],
  ["P2", "Gratuit", "2,50 €", "7,00 €", "10,00 €", "9,00 €"],
  ["P3", "Gratuit", "2,00 €", "5,00 €", "10,00 €", "12,00 €"],
  ["P4", "Gratuit", "2,00 €", "4,00 €", "8,00 €", "8,00 €"],
  ["P5 · P7", "Gratuit", "2,00 €", "2,00 €", "2,50 €", "6,00 €"],
];

export function lyonLongueDuree(facts: TopicFacts): TopicGuide {
  const o = LYON_OFFICIAL;
  const g = o.grid;
  const p0 = g["P0 · P1"];
  const twoWeeks = facts.twoWeeks ? offerText(facts.twoWeeks) : null;
  const rideWords = facts.shuttle ? rideMinutes(facts.shuttle) : null;
  const P = PRODUCT_NAME;

  const sections: GuideSection[] = [
    {
      id: "prix-longue-duree",
      short: "Les prix pour 2 semaines, 3 semaines, 1 mois",
      title: "Combien coûte un parking longue durée à Lyon Saint-Exupéry ?",
      paragraphs: [
        `Sur un long séjour, l’écart entre deux parkings se compte en centaines d’euros. Sans réservation, la grille 2026 de l’aéroport fait payer un mois ${g.P5[6]} au P5, soit environ ${perDay(g.P5[6], 30)} par jour, et ${p0[6]} au P0 ou au P1, soit environ ${perDay(p0[6], 30)} par jour. En ligne et à l’avance, l’aéroport annonce des prix « à partir de ${o.online.from} », selon les dates et les places restantes.`,
        `Attention au décompte : la grille sans réservation de l’aéroport avance par tranches de 24 heures (« 2e jour », « 3e jour »…). Un dépôt un samedi à 8 h et un retour deux samedis plus tard à 20 h dépassent quatorze fois 24 heures : c’est le prix du 15e jour qui s’applique. Chez nos parkings partenaires, ce sont les jours du calendrier qui comptent, arrivée et retour compris : d’un samedi à l’autre, deux semaines font 15 jours facturés.`,
      ],
      table: {
        caption: "Parkings de l’aéroport : tarifs 2026 sans réservation pour un long séjour",
        columns: ["2 semaines", "3 semaines", "1 mois", "Par jour sur un mois", "Au-delà d’un mois"],
        rows: (Object.keys(g) as Grid[]).map(parking => [parking, g[parking][4], g[parking][5], g[parking][6], perDay(g[parking][6], 30), g[parking][7]]),
        note: `Grille 2026 de Lyon Aéroport, tarifs sans réservation, relevée le ${o.readOn} ; prix par jour calculé par nous (prix du mois divisé par 30).`,
      },
      parts: [
        {
          title: "Deux semaines",
          paragraphs: [
            `Sans réservation, deux semaines coûtent ${o.twoWeeks.p5} au P5, ${g.P4[4]} au P4 et ${o.twoWeeks.p0} au P0 ou au P1. ` +
              (twoWeeks
                ? `Chez nos parkings partenaires, elles coûtent aujourd’hui ${twoWeeks}, navette et commission de ${P} comprises.`
                : `Chez nos parkings partenaires, indiquez vos dates en haut de la page pour voir le prix total, navette comprise.`) +
              (facts.week && facts.twoWeeks
                ? ` Par jour facturé, la semaine la moins chère revient à ${offerPerDay(facts.week)} et les deux semaines les moins chères à ${offerPerDay(facts.twoWeeks)}.`
                : ""),
          ],
        },
        {
          title: "Trois semaines, un mois et plus",
          paragraphs: [
            `Trois semaines coûtent ${g.P5[5]} au P5 et ${p0[5]} au P0 ; le P4, à ${o.walk.p4} à pied du Terminal 1, en demande ${g.P4[5]}. Après le 30e jour, chaque jour de plus coûte ${extraDay("P5")} au P5 et ${extraDay("P0 · P1")} au P0 : six semaines reviennent ainsi à ${sixWeeks("P5")} au P5, contre ${sixWeeks("P0 · P1")} au P0, toujours sans réservation.`,
          ],
        },
      ],
    },
    {
      id: "duree-maximale",
      short: "Durée maximale de stationnement",
      title: "Jusqu’à combien de temps peut-on laisser sa voiture à l’aéroport ?",
      paragraphs: [
        `Réservée en ligne sur le site de l’aéroport, une place couvre de 4 heures à 120 jours : la grille 2026 l’indique (« Durée de stationnement : jusqu’à 120 jours ») et la foire aux questions de l’aéroport le confirme (relevé le ${o.readOn}). Seule exception pour un voyage : le P5 robotisé, limité aux séjours de 3 à 30 jours.`,
        "Une réservation de l’aéroport ne permet qu’une entrée et une sortie : ressortir chercher un objet oublié met fin au stationnement.",
        `Chez les parkings privés, la durée possible dépend de la grille de chacun. Sur ${P}, un parking n’apparaît comme disponible que s’il a de la place pour chaque nuit du séjour et un prix pour sa durée.`,
      ],
    },
    {
      id: "p5-robotise-p7",
      short: "Le P5, le P5 robotisé et le P7",
      title: "P5, P5 robotisé, P7 : les parkings longue durée de l’aéroport",
      paragraphs: [
        `Le P5 et le P5 robotisé sont les parkings que l’aéroport conseille pour la longue durée ; le P7 s’y ajoute aux périodes chargées. Tous trois sont reliés au Terminal 1 par une navette gratuite.`,
      ],
      parts: [
        {
          title: "Le P5, le parking économique",
          paragraphs: [
            `Sa navette passe ${o.p5Shuttle.every} ; l’aéroport compte ${o.p5Shuttle.door} de la voiture au Terminal 1, marche et attente comprises. Le parking est découpé en quatre îlots aux noms de villes, comme Agadir ou Berlin, repris par les arrêts de la navette : photographiez le panneau du vôtre avant de partir. Hauteur maximale : ${o.p5Height}.`,
          ],
        },
        {
          title: "Le P5 robotisé (P5+)",
          paragraphs: [
            "Vous garez la voiture dans un box, gardez vos clés et scannez votre réservation ; un robot la range ensuite dans un espace extérieur clôturé, fermé au public, et la photographie à la prise en charge comme à la restitution. Séjours de 3 à 30 jours, numéro du vol retour obligatoire, environ 30 minutes jusqu’au Terminal 1. Le robot refuse les véhicules de plus de 2,30 m de haut, de 5 m de long ou de 2,6 tonnes, les roues de plus de 21 pouces, les châssis surbaissés et les véhicules avec coffre de toit ou porte-vélos.",
          ],
        },
        {
          title: "Le P7, en période d’affluence",
          paragraphs: [
            `Parking de débord saisonnier, le P7 n’ouvre qu’aux périodes chargées, sur réservation en ligne seulement, sans hauteur maximale annoncée. Sa navette passe ${o.p7Shuttle.every} et met ${o.p7Shuttle.ride} jusqu’au Terminal 1 ; l’annulation y est possible jusqu’à 4 heures avant l’arrivée. L’aéroport le présente comme le moins cher de ses parkings officiels.`,
          ],
        },
      ],
    },
    {
      id: "parkings-prives",
      short: "Parkings privés avec navette",
      title: "Parkings privés avec navette : le bon calcul pour un long séjour",
      paragraphs: [
        `Avec un parking privé, la navette ajoute quelques minutes à l’aller et au retour ; sur un mois, elles pèsent peu face à l’écart de prix. Elle vous conduit au Terminal 1, à l’endroit que le parking vous indique${rideWords ? `, en ${rideWords} chez nos partenaires` : ""}, et vient vous reprendre au retour.`,
        `Sur ${P}, chaque partenaire fixe ses forfaits par durée et, au-delà du plus long, un prix par jour supplémentaire. Le prix affiché est le total pour vos dates, commission comprise, payé en ligne par carte : rien ne s’ajoute à l’arrivée.`,
        "Avec un voiturier, les clés restent au parking tout le séjour ; dans les parkings rangés en files, la voiture est placée selon sa date de retour, pour éviter qu’elle reste coincée derrière une autre qui part après elle : donnez une date de retour juste. Chaque fiche indique si le terrain est clôturé et sous vidéosurveillance et à quelles heures l’accueil est ouvert.",
      ],
      table: {
        caption: "Un long séjour à l’aéroport ou chez un partenaire",
        columns: ["Parkings de l’aéroport (en ligne)", `Partenaires de ${P}`],
        rows: [
          ["Durée possible", "4 heures à 120 jours ; 3 à 30 jours au P5 robotisé", "Selon la grille du parking"],
          ["Deux semaines", `${o.twoWeeks.p5} au P5, ${o.twoWeeks.p0} au P0 sans réservation`, twoWeeks ? capitalise(twoWeeks) : "Prix total affiché pour vos dates"],
          ["Jours comptés", "Par tranches de 24 heures", "Jours du calendrier, arrivée et retour compris"],
          ["Vol retour en retard", "Garantie retard si le vol est renseigné, sauf au P1", "Navette calée sur le vol ; prolongation facturée après l’heure réservée"],
          ["Retour plus tardif", "Tarif de dépassement à la borne de sortie", "Prolongation facturée par le parking, à son tarif"],
        ],
        note: `Aéroport : grille 2026 et foire aux questions de lyonaeroports.com, relevées le ${o.readOn}.`,
      },
    },
    {
      id: "preparer-la-voiture",
      short: "Préparer la voiture",
      title: "Préparer sa voiture pour plusieurs semaines sans rouler",
      paragraphs: ["Un mois sans rouler sollicite surtout la batterie et les pneus. Voici ce qui s’applique à un parking d’aéroport, d’après notamment le Touring Club Suisse (TCS)."],
      parts: [
        {
          title: "La batterie",
          paragraphs: [
            "Même moteur coupé, la batterie alimente en continu l’alarme et l’électronique : fatiguée, elle peut ne plus démarrer au retour. Faites tester une batterie de plusieurs années avant de partir. Dans un parking avec voiturier, ne la débranchez pas : le personnel doit pouvoir démarrer et déplacer la voiture.",
          ],
        },
        {
          title: "Les pneus",
          paragraphs: [
            "Selon le TCS, un pneu perd en moyenne 0,1 à 0,3 bar par mois à l’arrêt, et un pneu sous-gonflé chauffe davantage en roulant. Gonflez à froid à la valeur haute du constructeur avant de partir, et contrôlez la pression à la première station au retour.",
          ],
        },
        {
          title: "Carburant, papiers, assurance",
          paragraphs: [],
          list: [
            "Gardez assez de carburant pour rejoindre une station au retour, même tard le soir.",
            "Emportez la carte grise et les objets de valeur ; ne laissez rien de visible dans l’habitacle.",
            "Ne suspendez pas votre assurance : même immobile, la voiture reste exposée au vol, au bris de glace et aux dégâts de carrosserie. Vérifiez qu’elle comprend une assistance en cas de panne.",
          ],
        },
      ],
    },
    {
      id: "retour-plus-tard",
      short: "Rentrer plus tard (ou plus tôt)",
      title: "Rentrer plus tard que prévu : prolongation et frais",
      paragraphs: ["Correspondance manquée, vacances prolongées : les règles d’un retour tardif diffèrent selon le parking."],
      parts: [
        {
          title: `Chez un parking partenaire de ${P}`,
          paragraphs: [
            "La date de retour ne se modifie pas en ligne : appelez le parking dès que vous savez que vous rentrez plus tard. Un retour après la date et l’heure réservées prolonge le séjour, et la prolongation est facturée par le parking, à son tarif, y compris quand l’avion se pose après l’heure réservée.",
          ],
        },
        {
          title: "À l’aéroport : le tarif de dépassement",
          paragraphs: [
            "Une réservation commencée ne se prolonge pas : à la sortie, la borne calcule un supplément, payable par carte ou badge de télépéage, après une heure de tolérance. Si le numéro du vol retour figure dans la réservation et que ce vol a du retard, la « garantie retard » ajuste l’heure de sortie sans supplément, sauf au P1, géré par Lyon Parc Auto (LPA) ; elle ne couvre pas un retour que vous repoussez.",
          ],
          table: {
            caption: "Parkings de l’aéroport : tarifs de dépassement d’une réservation en ligne",
            columns: ["Jusqu’à 1 h", "1 h à 4 h", "4 h à 12 h", "12 h à 24 h", "Chaque 24 h de plus"],
            rows: OVERSTAY,
            note: `Tarifs TTC, foire aux questions « Réservation Parking » de lyonaeroports.com, relevée le ${o.readOn}.`,
          },
        },
        {
          title: "Et si vous rentrez plus tôt ?",
          paragraphs: [`Un retour anticipé n’est remboursé ni à l’aéroport ni chez les partenaires de ${P}. Prévenez quand même le parking et mettez à jour votre vol retour, pour que la navette soit là au bon moment.`],
        },
      ],
    },
    {
      id: "changer-de-vol",
      short: "Changer de vol en cours de voyage",
      title: "Changer de vol pendant un long voyage",
      paragraphs: [
        `Sur ${P}, vous modifiez vous-même vos numéros de vol depuis Ma réservation, jusqu’au retour : le parking suit le nouveau vol, et le SMS d’atterrissage, qui donne le point de rendez-vous de la navette, part pour le bon avion. Sans numéro de vol retour, pas de SMS d’atterrissage. Un changement de date, d’heure ou de véhicule passe par le parking.`,
        "À l’aéroport, une réservation se modifie jusqu’à 1 heure avant l’arrivée au parking (2 heures au P1), plus ensuite. Si vous rentrez sur un autre vol que celui indiqué et qu’il a du retard, donnez son numéro à l’interphone de la borne de sortie : les agents vérifient le retard.",
      ],
    },
    {
      id: "voiture-electrique",
      short: "Voiture électrique",
      title: "Voiture électrique : recharger pendant un long séjour",
      paragraphs: [
        `À l’aéroport, le P4 Elec et le P5 Elec, 100 % électriques, se réservent en ligne et comptent ${o.chargers.dedicated} bornes dédiées : l’aéroport y assure un point de recharge du début à la fin du voyage. Les bornes en libre-service des P2, P3, P4 et P5 ne se réservent pas, et rien ne garantit d’en trouver une libre.`,
        "Chez nos partenaires, la recharge est un service annexe, non réservable en ligne et payé au parking : repérez-la avec le filtre « Recharge électrique », puis appelez le parking pour la demander.",
        "Sans recharge prévue, partez avec une batterie bien remplie : le TCS conseille environ 80 % avant une longue immobilisation, pour éviter une décharge complète.",
      ],
    },
    {
      id: "saisons",
      short: "Vacances : quand réserver",
      title: "Été, Noël, ski : réserver un long séjour au bon moment",
      paragraphs: [
        "Les voyages de deux semaines et plus tombent souvent pendant les vacances scolaires : juillet et août, Noël, l’hiver. En 2026-2027, la zone A, dont fait partie l’académie de Lyon, est en vacances du 17 octobre au 2 novembre 2026, du 19 décembre 2026 au 4 janvier 2027, du 13 février au 1er mars 2027 et du 10 au 26 avril 2027 (la seconde date est celle de la reprise des cours).",
        "Chez nos partenaires, un séjour n’est réservable que s’il reste de la place chaque nuit, du dépôt au retour : plus il est long, plus il risque de croiser une nuit complète. L’aéroport prévient que ses parkings, P5 compris, peuvent afficher complet pendant les vacances scolaires, et ses réservations ouvrent 9 mois à l’avance.",
        "Réservez dès que les billets d’avion sont pris, avec une formule annulable si vos dates peuvent encore bouger. Si l’aéroport signale une forte saturation, il conseille 1 heure de marge en plus des 2 h 30 recommandées avant le décollage.",
      ],
    },
    {
      id: "reserver",
      short: `Réserver sur ${P}`,
      title: `Réserver un long séjour sur ${P}`,
      paragraphs: ["Quelques points comptent davantage quand le séjour dure plusieurs semaines."],
      list: [
        "Indiquez vos dates et heures : le formulaire de cette page est réglé sur deux semaines.",
        "Comparez le prix total : navette, commission et, quand le parking en a, voiturier ou place couverte sont compris.",
        "Regardez la formule d’annulation du parking : gratuite jusqu’à l’heure de dépôt, 24 h ou 48 h avant, ou non annulable. Dans le délai, le remboursement est automatique ; après, le prix reste dû, sauf geste commercial du parking.",
        "Payez en ligne par carte : l’e-mail de confirmation, doublé d’un SMS si le parking en envoie, donne le point de rendez-vous du retour quand le parking l’a indiqué.",
        "La veille du dépôt, un rappel vous est en principe envoyé. L’application montre la place de la voiture pendant tout le séjour, dès qu’elle est enregistrée ; le site, le jour du retour.",
        "Au retour, Ma réservation affiche un compte à rebours jusqu’à l’atterrissage, puis jusqu’à l’arrivée de la navette si le parking a activé le suivi en direct.",
      ],
    },
  ];

  return {
    slug: "parking-longue-duree",
    short: "Parking longue durée",
    metaTitle: "Parking longue durée aéroport Lyon : 2 semaines à 1 mois",
    metaDescription: "Parking 2 semaines, 3 semaines ou 1 mois à Lyon Saint-Exupéry : tarifs 2026 de l’aéroport, durée maximale, P5 robotisé, retour tardif et parkings privés.",
    title: "Parking longue durée à l’aéroport de Lyon Saint-Exupéry : 2 semaines, 3 semaines, 1 mois",
    intro: `Pour deux semaines, trois semaines ou un mois, le prix par jour et ce qui se passe au retour comptent plus que la distance au terminal. Ce guide donne les tarifs 2026 de l’aéroport de Lyon Saint-Exupéry pour ces durées, la durée maximale, le P5 et le P5 robotisé, le coût d’un retour tardif et la préparation de la voiture. Les parkings partenaires ci-dessous sont affichés pour deux semaines. Chiffres de l’aéroport relevés le ${o.readOn} ; depuis le ${o.t2Closed}, tous les vols partent du Terminal 1.`,
    published: "2026-10-09",
    updated: "2026-10-09",
    sections,
    faq: [
      [
        "Combien coûte un parking pour 2 semaines à l’aéroport de Lyon ?",
        (twoWeeks
          ? `Chez les parkings partenaires de ${P}, deux semaines coûtent aujourd’hui ${twoWeeks}, navette comprise. `
          : `Chez les parkings partenaires de ${P}, le prix total de deux semaines s’affiche dès que vous indiquez vos dates. `) +
          `À l’aéroport de Lyon Saint-Exupéry, la grille 2026 sans réservation affiche ${o.twoWeeks.p5} au P5 et ${o.twoWeeks.p0} au P0 ; réservées en ligne à l’avance, les places coûtent moins.`,
      ],
      [
        "Combien coûte un mois de parking au P5 de Lyon Saint-Exupéry ?",
        `${g.P5[6]} pour 30 jours sans réservation, selon la grille 2026 de l’aéroport relevée le ${o.readOn}, puis ${extraDay("P5")} par jour ; trois semaines y coûtent ${g.P5[5]}. En ligne et à l’avance, c’est en général moins cher.`,
      ],
      [
        "Combien de temps peut-on laisser sa voiture à l’aéroport de Lyon Saint-Exupéry ?",
        `Jusqu’à 120 jours avec une réservation en ligne sur le site de l’aéroport, sauf au P5 robotisé, limité à 3 à 30 jours (relevé le ${o.readOn}). Chez les parkings privés, la durée dépend de la grille de chacun.`,
      ],
      [
        "Quel est le parking le moins cher pour 3 semaines à l’aéroport de Lyon ?",
        `Sur la grille 2026 sans réservation, le P5 : ${g.P5[5]} pour trois semaines, contre ${p0[5]} au P0. L’aéroport présente le P7 comme le moins cher de ses parkings officiels, mais il n’ouvre qu’en période d’affluence. Les parkings privés avec navette se comparent au prix total pour vos dates.`,
      ],
      [
        "Que se passe-t-il si je rentre de voyage plus tard que prévu ?",
        `Chez un parking partenaire de ${P}, le séjour est prolongé et la prolongation est facturée par le parking, à son tarif : prévenez-le. À l’aéroport de Lyon, un tarif de dépassement se règle à la borne de sortie après une heure de tolérance ; si c’est le vol indiqué dans la réservation qui arrive en retard, la garantie retard évite ce supplément, sauf au P1.`,
      ],
      [
        "Mon vol retour change pendant le voyage : que faire pour le parking ?",
        `Sur ${P}, modifiez le numéro de vol depuis Ma réservation, jusqu’au retour : le parking suit le nouveau vol et le SMS d’atterrissage donne le point de rendez-vous de la navette. Une nouvelle date ou heure de retour se règle avec le parking, par téléphone.`,
      ],
      [
        "Faut-il débrancher la batterie avant de laisser sa voiture un mois au parking ?",
        "Pas dans un parking avec voiturier, qui doit pouvoir démarrer et déplacer la voiture. Faites plutôt tester une batterie ancienne avant de partir, et vérifiez que votre assurance comprend une assistance en cas de panne au retour.",
      ],
      [
        "Peut-on recharger une voiture électrique pendant un long séjour à l’aéroport de Lyon ?",
        `Oui : le P4 Elec et le P5 Elec, 100 % électriques, se réservent en ligne et comptent ${o.chargers.dedicated} bornes dédiées. Les autres bornes de l’aéroport sont en libre-service, sans garantie d’en trouver une libre. Chez les parkings privés, la recharge est un service annexe, payé sur place.`,
      ],
      [
        "Ma voiture est-elle surveillée pendant un mois de parking à l’aéroport de Lyon ?",
        `Selon sa grille 2026, l’aéroport assure une surveillance 24 h sur 24 et 7 jours sur 7 sur tous ses parcs. Chez les parkings partenaires de ${P}, chaque fiche indique si le terrain est clôturé et sous vidéosurveillance. Dans tous les cas, gardez votre assurance active.`,
      ],
    ],
    partners: {
      filter: "all",
      stayDays: 14,
      title: "Les parkings partenaires les moins chers pour deux semaines",
      lead: "La liste montre les parkings partenaires qui ont de la place pour tout le séjour, du moins cher au plus cher d’après le prix total, aux dates du formulaire ci-dessus : deux semaines par défaut.",
      empty: "Aucun parking partenaire n’est encore réservable en ligne pour ces dates. Revenez bientôt, et consultez en attendant le guide complet du parking à l’aéroport de Lyon Saint-Exupéry pour comparer les parkings officiels.",
    },
  };
}
