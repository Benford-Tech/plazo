// Topic guide « Parking pas cher » of Lyon Saint-Exupéry (09/10/2026): total price vs day price, one and two weeks compared,
// P7 vs P5, hidden costs, cheap ways without parking. Sources read on 09/10/2026: lyonaeroports.com (parkings, parking FAQ,
// « S’organiser et être à l’heure », TCL buses, access FAQ), store.lyonaeroports.com (low-cost and P7 pages), the 2026 tariff
// sheet, rhonexpress.fr (fares, timetable, stations); Plazo's own rules from site/src/lib/legal.ts and backend/src/domain/pricing.ts.
import {
  capitalise,
  LYON_OFFICIAL,
  offerText,
  rideMinutes,
  rideText,
  type TopicFacts,
  type TopicGuide,
} from "../airport-guides";
import { PRODUCT_NAME } from "../product";
import { topicPath } from "./topics";

/** 2026 tariff sheet without booking: price of the « 8e jour » and of the « 15e jour » (a stay just over one or two weeks). */
const DAY_8 = {
  p0: "216,90 €",
  p2: "189,90 €",
  p3: "172,90 €",
  p4: "149,40 €",
  p5: "79,90 €",
} as const;
const DAY_15 = {
  p0: "363,90 €",
  p2: "322,90 €",
  p3: "277,90 €",
  p4: "198,40 €",
  p5: "107,90 €",
} as const;

/** « Tarifs de dépassement parking (TTC) », lyonaeroports.com parking FAQ (« Comment prolonger ma réservation déjà commencée ? »). */
const OVERSTAY: string[][] = [
  ["P0 et P1", "2,00 € de 1 à 4 h, 4,00 € de 4 à 12 h", "6,00 €", "20,00 €"],
  [
    "P2 et P2 bis",
    "2,50 € de 1 à 4 h, 7,00 € de 4 à 12 h",
    "10,00 €",
    "9,00 €",
  ],
  ["P3", "2,00 € de 1 à 4 h, 5,00 € de 4 à 12 h", "10,00 €", "12,00 €"],
  ["P4", "2,00 € de 1 à 4 h, 4,00 € de 4 à 12 h", "8,00 €", "8,00 €"],
  ["P5 et P7", "2,00 € de 1 à 12 h", "2,50 €", "6,00 €"],
];

/** rhonexpress.fr/fr_FR/tarifs, read on 09/10/2026 (online price, then ticket machine price). */
const RHONEXPRESS = {
  single: "16,30 €",
  singleMachine: "17,40 €",
  return: "28,50 €",
  returnMachine: "30,30 €",
  youthSingle: "10,70 €",
  youthReturn: "20,30 €",
  earlyOneMonth: "26,20 €",
  earlyTwoMonths: "22,90 €",
} as const;

/** « 76,90 € » → 7690. */
const cents = (price: string) =>
  Math.round(Number(price.replace(/[^\d,]/g, "").replace(",", ".")) * 100);
/** 7690 → « 76,90 € » (same spacing as LYON_OFFICIAL). */
const euros = (value: number) =>
  `${(value / 100).toFixed(2).replace(".", ",")} €`;
/** « environ 12 minutes » → « environ 12 min », for table cells. */
const short = (text: string) => text.replace(" minutes", " min");

export function lyonPasCher(facts: TopicFacts): TopicGuide {
  const o = LYON_OFFICIAL;
  const p = PRODUCT_NAME;
  const week = facts.week ? offerText(facts.week) : null;
  const twoWeeks = facts.twoWeeks ? offerText(facts.twoWeeks) : null;
  const ride = facts.shuttle ? rideMinutes(facts.shuttle) : null;
  const rideCell = facts.shuttle ? rideText(facts.shuttle) : null;
  const valet = facts.valet;

  const secondWeekP5 = euros(cents(o.twoWeeks.p5) - cents(o.week.p5));
  const secondWeekP0 = euros(cents(o.twoWeeks.p0) - cents(o.week.p0));
  const couple = euros(2 * cents(RHONEXPRESS.return));
  const coupleEarly = euros(2 * cents(RHONEXPRESS.earlyTwoMonths));

  const partnerPrices = [
    week ? `une semaine revient aujourd’hui ${week}` : null,
    twoWeeks ? `deux semaines ${twoWeeks}` : null,
  ]
    .filter(Boolean)
    .join(" et ");
  const partnersSentence = partnerPrices
    ? `Chez nos parkings partenaires, ${partnerPrices}, prix total navette comprise ; indiquez vos dates en haut de la page pour voir le vôtre.`
    : "Chez nos parkings partenaires, le prix total du séjour, navette comprise, s’affiche dès que vous indiquez vos dates en haut de la page.";
  const valetSentence = valet
    ? `${valet.count === 1 ? "Un de nos parkings partenaires propose" : `${valet.count} de nos parkings partenaires proposent`} un voiturier${valet.week ? ` : une semaine ${offerText(valet.week)}, voiturier compris` : ""}.`
    : "Le filtre « Voiturier » des résultats ne garde que les parkings qui en proposent un.";

  return {
    slug: "parking-pas-cher",
    short: "Parking pas cher",
    metaTitle: "Parking aéroport Lyon pas cher : vrais prix et astuces 2026",
    metaDescription:
      "Parking pas cher à l’aéroport de Lyon : prix total d’une ou deux semaines, P5 ou P7, frais de dépassement, Rhônexpress et parkings privés avec navette.",
    title:
      "Parking aéroport Lyon pas cher : comment payer vraiment moins à Saint-Exupéry",
    intro: `Le parking le moins cher de Lyon Saint-Exupéry n’est pas celui qui affiche le plus petit prix par jour, mais celui qui coûte le moins pour vos dates exactes, jours facturés, navette et dépassements compris. Ce guide compare une et deux semaines dans les parkings de l’aéroport et chez les parkings privés avec navette, départage le P7 et le P5, liste les frais cachés et chiffre les solutions sans voiture. Tarifs de l’aéroport relevés le ${o.readOn} ; depuis le ${o.t2Closed}, tous les vols partent du Terminal 1.`,
    published: "2026-10-09",
    updated: "2026-10-09",
    sections: [
      {
        id: "prix-total",
        short: "Prix par jour ou prix total",
        title: "Prix par jour ou prix total : ce que vous payez vraiment",
        paragraphs: [
          "Un prix « par jour » ne dit presque rien de ce que coûtera le voyage. Ce qui compte, c’est le total pour vos heures de dépôt et de retour, et il dépend de la façon dont le parking compte les jours. Comparez donc toujours deux offres sur les mêmes heures.",
        ],
        parts: [
          {
            title: "Les jours du calendrier : dépôt et retour comptent chacun",
            paragraphs: [
              `Chez les parkings partenaires de ${p}, chaque jour du calendrier touché par le séjour est facturé, celui du dépôt comme celui du retour. Une voiture déposée un samedi à 6 h et reprise le samedi suivant à 22 h compte ainsi 8 jours facturés. Déposer la voiture la veille au soir d’un vol matinal ajoute donc un jour, la reprendre après minuit aussi. Le prix affiché est le prix total du séjour, commission de ${p} comprise, sans frais ajoutés à l’arrivée, et il se paie en ligne par carte.`,
            ],
          },
          {
            title: "La grille de l’aéroport : des tranches de 24 heures",
            paragraphs: [
              `La grille 2026 de l’aéroport, sans réservation, compte en durée : jusqu’à 24 heures, puis « 2e jour », « 3e jour », etc. Le voyage du samedi 6 h au samedi suivant 22 h dure 7 jours et 16 heures : il passe sur la ligne du 8e jour, soit ${DAY_8.p5} au P5 au lieu de ${o.week.p5}. Réservé en ligne sur le site de l’aéroport, le prix dépend des dates et heures choisies, des places restantes et de l’avance avec laquelle vous réservez.`,
            ],
          },
        ],
      },
      {
        id: "comparatif",
        short: "Une ou deux semaines : le comparatif",
        title: "Une ou deux semaines de parking : le comparatif des prix",
        paragraphs: [
          "Le tableau compare les parkings de l’aéroport, au tarif sans réservation de sa grille 2026, et les parkings privés avec navette. Entre parenthèses, le prix dû dès que le séjour dépasse sept ou quatorze fois 24 heures.",
          `Réservés à l’avance sur le site de l’aéroport, ses parkings sont annoncés « à partir de ${o.online.from} » sur la grille et « à partir de ${o.online.listed} » sur la page des parkings : des prix d’appel, « soumis à conditions et disponibilité », que seule une simulation à vos dates confirme.`,
          partnersSentence,
          `L’écart se creuse avec la durée : au P5, la deuxième semaine coûte ${secondWeekP5} de plus que la première, au P0 et au P1 ${secondWeekP0}.`,
        ],
        table: {
          caption: "Une et deux semaines de parking à Lyon Saint-Exupéry",
          columns: ["Une semaine", "Deux semaines", "Accès au Terminal 1"],
          rows: [
            [
              "P0 et P1 (couverts)",
              `${o.week.p0} (${DAY_8.p0})`,
              `${o.twoWeeks.p0} (${DAY_15.p0})`,
              `À pied, ${short(o.walk.p1)} (P1) ou ${short(o.walk.p0)} (P0)`,
            ],
            [
              "P2",
              `${o.week.p2} (${DAY_8.p2})`,
              `${o.grid.P2[4]} (${DAY_15.p2})`,
              `À pied, ${short(o.walk.p2)}`,
            ],
            [
              "P3 (couvert)",
              `${o.week.p3} (${DAY_8.p3})`,
              `${o.grid.P3[4]} (${DAY_15.p3})`,
              `À pied, ${short(o.walk.p3)}`,
            ],
            [
              "P4",
              `${o.week.p4} (${DAY_8.p4})`,
              `${o.grid.P4[4]} (${DAY_15.p4})`,
              `À pied, ${short(o.walk.p4)}`,
            ],
            [
              "P5",
              `${o.week.p5} (${DAY_8.p5})`,
              `${o.twoWeeks.p5} (${DAY_15.p5})`,
              `Navette, ${short(o.p5Shuttle.door)} de la voiture au terminal`,
            ],
            [
              "P7 (saisonnier)",
              "En ligne seulement",
              "En ligne seulement",
              `Navette ${short(o.p7Shuttle.every)}, ${short(o.p7Shuttle.ride)} de trajet`,
            ],
            [
              `Parkings privés partenaires`,
              week ? capitalise(week) : "Prix total pour vos dates",
              twoWeeks ? capitalise(twoWeeks) : "Prix total pour vos dates",
              rideCell
                ? `Navette, ${rideCell}`
                : "Navette, durée sur chaque fiche",
            ],
          ],
          note: `Grille 2026 de l’aéroport, tarifs sans réservation, relevée le ${o.readOn} sur lyonaeroports.com ; entre parenthèses, les lignes « 8e jour » et « 15e jour ». Parkings partenaires : offres en ligne du moment.`,
        },
        more: {
          href: topicPath("lyon-saint-exupery", "parking-longue-duree"),
          label: "Plus de deux semaines : le guide du parking longue durée",
        },
      },
      {
        id: "p7-ou-p5",
        short: "P7 ou P5 ?",
        title: "P7 ou P5 : quel est le moins cher des parkings officiels ?",
        paragraphs: [
          "Les deux réponses circulent, et toutes deux sont justes : l’une vient de l’aéroport, l’autre de sa grille publique.",
        ],
        parts: [
          {
            title: "Le P7, le moins cher selon l’aéroport, mais saisonnier",
            paragraphs: [
              `Sur sa page des parkings économiques, l’aéroport présente le P7 comme le moins cher de ses parkings officiels. Ce parking de débord en plein air n’ouvre qu’en période de forte affluence, et uniquement sur réservation en ligne. Sa navette gratuite passe ${o.p7Shuttle.every} et rejoint le Terminal 1 en ${o.p7Shuttle.ride} ; aucune hauteur maximale n’est annoncée. Son prix ne figure pas sur la grille : seule une recherche à vos dates le donne. La réservation s’annule jusqu’à 4 heures avant l’arrivée.`,
            ],
          },
          {
            title: "Le P5, le moins cher de la grille 2026",
            paragraphs: [
              `Ouvert toute l’année, le P5 est le moins cher de la grille sans réservation : ${o.week.p5} la semaine, ${o.twoWeeks.p5} les deux semaines, puis ${o.grid.P5[7].replace("+ ", "")} au-delà d’un mois. Le prix bas se paie en temps : malgré une navette gratuite ${o.p5Shuttle.every}, l’aéroport compte ${o.p5Shuttle.door} de la voiture au Terminal 1, marche et attente comprises. Hauteur maximale : ${o.p5Height}.`,
            ],
          },
          {
            title: "P5 robotisé et P6 Eco",
            paragraphs: [
              "Le P5 robotisé (3 à 30 jours, 2,30 m au plus) se réserve uniquement en ligne, au plus tôt trois mois avant. Le P6 Eco, encore sur la page des parkings économiques de l’aéroport, y est signalé fermé pour travaux.",
            ],
          },
        ],
      },
      {
        id: "parkings-prives",
        short: "Parkings privés avec navette",
        title: "Parkings privés avec navette : où se fait l’économie",
        paragraphs: [
          `Les parkings privés des communes voisines accueillent la voiture, la gardent et vous conduisent en navette à l’aérogare, puis vous reprennent au retour. ${ride ? `Chez nos partenaires, la navette met ${ride} jusqu’au Terminal 1.` : "La durée de la navette jusqu’au Terminal 1 figure sur chaque fiche."} Elle s’arrête à l’endroit que l’aéroport réserve aux navettes des parkings extérieurs, à quelques minutes à pied de l’aérogare, et le parking vous indique le point exact.`,
        ],
        parts: [
          {
            title: "Compris dans le prix, ou à part",
            paragraphs: [
              `Le prix total affiché sur ${p} couvre le stationnement, la garde de la voiture et la navette aller et retour. Voiturier et places couvertes, quand un parking les propose, sont compris dans son prix. ${valetSentence} Les services annexes (lavage, plein, recharge électrique) ne se réservent pas en ligne : ils se règlent au parking, à ses tarifs ; demandez le prix avant d’accepter. Dans les résultats, classés par prix total croissant, le filtre « Prix total maximum » écarte ce qui dépasse votre budget.`,
            ],
          },
        ],
      },
      {
        id: "quand-reserver",
        short: "Quand réserver",
        title: "Quand réserver son parking pour payer moins cher",
        paragraphs: [
          "Le bon moment dépend de la façon dont le prix se calcule.",
        ],
        parts: [
          {
            title: "À l’aéroport, plus tôt c’est moins cher",
            paragraphs: [
              "Sur le site de l’aéroport, le prix dépend des dates, des places restantes et de l’avance : « plus vous réservez tôt, moins c’est cher », dit sa page des parkings économiques. Les réservations ouvrent neuf mois avant, et le tarif Internet ne vaut pas sur place. Le parrainage offre 5 € au filleul sur sa première réservation et 5 € au parrain une fois celle-ci utilisée ; il n’existe ni tarif senior ni tarif de groupe.",
            ],
          },
          {
            title: `Sur ${p}, le prix suit la durée`,
            paragraphs: [
              "Chez nos parkings partenaires, le prix dépend aujourd’hui du nombre de jours facturés, pas du jour où vous réservez. Réserver tôt garantit donc surtout la place, ce qui compte aux dates chargées ; c’est le prix confirmé au paiement qui s’applique.",
            ],
          },
          {
            title: "Les dates où tout se remplit",
            paragraphs: [
              "Selon sa FAQ, c’est notamment pendant les vacances scolaires que les parkings de l’aéroport saturent : sans réservation, on est alors orienté vers un parking de débord plus éloigné. Pour partir pendant les vacances, réservez dès que vos billets d’avion sont pris.",
            ],
          },
        ],
      },
      {
        id: "frais-caches",
        short: "Les frais cachés",
        title: "Les frais cachés qui font grimper la note",
        paragraphs: [
          "Un parking bon marché peut coûter cher en fin de séjour. Quatre postes à vérifier avant de payer.",
        ],
        parts: [
          {
            title: "Dépasser l’heure réservée à l’aéroport",
            paragraphs: [
              "Une réservation à l’aéroport couvre un créneau précis : entrée au plus tôt 30 minutes avant l’heure prévue, tolérance de 60 minutes après l’heure de sortie, puis frais de dépassement prélevés à la borne. Une seule entrée et une seule sortie : toute sortie est définitive. Un vol retardé n’entraîne aucun frais si vous avez indiqué vos numéros de vol (garantie retard, hors P1, géré par Lyon Parc Auto).",
            ],
            table: {
              caption:
                "Frais de dépassement à l’aéroport, après une heure gratuite",
              columns: ["Jusqu’à 12 h", "De 12 à 24 h", "Par 24 h de plus"],
              rows: OVERSTAY,
              note: `Tarifs TTC de la FAQ « Réservation parking » de lyonaeroports.com, relevés le ${o.readOn}.`,
            },
          },
          {
            title: "Revenir plus tard, ou plus tôt, chez un parking privé",
            paragraphs: [
              "Chez nos parkings partenaires, un retour après la date et l’heure réservées prolonge le séjour, facturé par le parking à ses tarifs : demandez-les avant de partir. Si vos dates changent, contactez le parking ; vos numéros de vol, eux, se corrigent en ligne depuis Ma réservation jusqu’au retour. À l’inverse, un retour anticipé n’est remboursé ni par nos partenaires ni par l’aéroport.",
            ],
          },
          {
            title: "Les offres non remboursables",
            paragraphs: [
              "Chaque parking partenaire choisit une formule d’annulation : gratuite jusqu’à l’heure de dépôt, jusqu’à 24 heures avant, jusqu’à 48 heures avant, ou non remboursable. Dans le délai, le remboursement est automatique ; après, le prix reste dû, sauf geste commercial du parking. À l’aéroport, l’annulation est gratuite jusqu’à 1 heure avant l’entrée (4 heures au P7), sauf au P1.",
            ],
          },
          {
            title: "Le parking minute au-delà de 10 minutes",
            paragraphs: [
              `Le parking minute est gratuit 10 minutes ; ensuite, ${o.minute.then}. Vingt minutes d’arrêt dépassent donc 7 €. ${capitalise(o.minute.cap)}.`,
            ],
          },
        ],
      },
      {
        id: "sans-parking",
        short: "Sans voiture : Rhônexpress, bus, dépose",
        title: "Sans parking : Rhônexpress, bus TCL ou dépose-minute",
        paragraphs: [
          "Le parking le moins cher est parfois celui qu’on ne prend pas. Seul ou à deux, faites le calcul.",
        ],
        parts: [
          {
            title: "Le Rhônexpress depuis Lyon Part-Dieu",
            paragraphs: [
              "Le tram express Rhônexpress relie la gare de Lyon Part-Dieu (sortie Porte Alpes) à la gare Lyon Saint-Exupéry en 30 minutes environ, de 4 h 25 à minuit, toutes les 15 minutes en journée. Comptez ensuite une douzaine de minutes à pied jusqu’au Terminal 1, selon l’aéroport.",
              `Le ${o.readOn}, l’aller-retour coûtait ${RHONEXPRESS.return} en ligne (${RHONEXPRESS.returnMachine} au distributeur), ${RHONEXPRESS.youthReturn} pour les 12-25 ans, et les moins de 12 ans voyagent gratuitement. Acheté à l’avance, il descend à ${RHONEXPRESS.earlyOneMonth} (utilisable un mois après l’achat) ou ${RHONEXPRESS.earlyTwoMonths} (deux mois après). Pour une semaine, un couple paie ainsi ${couple}, contre ${o.week.p5} au P5 sans réservation${week ? ` et ${week} chez le moins cher de nos partenaires` : ""}, mais il faut rejoindre Part-Dieu avec les bagages.`,
            ],
            table: {
              caption: "Le Rhônexpress aller-retour selon le groupe",
              columns: ["En ligne", "Acheté deux mois avant"],
              rows: [
                ["Un adulte", RHONEXPRESS.return, RHONEXPRESS.earlyTwoMonths],
                ["Deux adultes", couple, coupleEarly],
                [
                  "Deux adultes et deux enfants de moins de 12 ans",
                  couple,
                  coupleEarly,
                ],
                [
                  "Un jeune de 12 à 25 ans",
                  RHONEXPRESS.youthReturn,
                  `Tarif 12-25 ans plus bas (${RHONEXPRESS.youthReturn})`,
                ],
              ],
              note: `Tarifs relevés le ${o.readOn} sur rhonexpress.fr ; la FAQ de l’aéroport cite des montants légèrement différents.`,
            },
          },
          {
            title: "Les bus TCL",
            paragraphs: [
              "Selon la page de l’aéroport consacrée aux bus, deux lignes TCL le desservent au prix d’un ticket ordinaire (2,10 €, ou 2,50 € payé au chauffeur) : la C200 depuis Vaulx-en-Velin La Soie, dont un bus sur trois en semaine et un sur deux le week-end va jusqu’à l’aéroport, et la 248 depuis Meyzieu ZI, de 5 h 30 à 22 h en semaine. Arrivée à la gare routière, à environ 7 minutes à pied du Terminal 1. Vérifiez les horaires sur le site des TCL avant un vol matinal.",
            ],
          },
          {
            title: "Se faire déposer, et reprendre",
            paragraphs: [
              "Un proche qui vous dépose au parking minute du Terminal 1 ne paie rien s’il repart dans les 10 minutes. Au retour, il attend gratuitement en zone d’attente, aux entrées de l’aéroport, une heure au plus et conducteur présent. Pour vous accompagner jusqu’aux contrôles, le « forfait accompagnant », réservé plus de 24 heures avant, coûte 6 € de 1 à 2 heures et 9 € de 2 à 4 heures au P4.",
            ],
          },
        ],
      },
      {
        id: "check-list",
        short: "La check-list",
        title: "La check-list du parking pas cher",
        paragraphs: ["Sept vérifications avant de payer."],
        list: [
          "Comparez des prix totaux pour les mêmes heures, jamais des prix par jour.",
          "Réservez jusqu’à l’heure où vous reprendrez vraiment la voiture, bagages et navette compris.",
          "À l’aéroport, réservez en ligne : le tarif Internet ne s’applique pas sur place.",
          "Lisez la formule d’annulation ; si vos dates peuvent bouger, gardez le filtre « Annulation gratuite ».",
          "Donnez vos numéros de vol : garantie retard à l’aéroport (hors P1), SMS d’atterrissage chez nos partenaires.",
          "Demandez le prix des services annexes et de la prolongation avant d’en avoir besoin.",
          "Seul ou à deux, comparez avec le Rhônexpress ou le bus TCL.",
        ],
      },
    ],
    faq: [
      [
        "Quel est le parking le moins cher de l’aéroport de Lyon Saint-Exupéry ?",
        `L’aéroport présente le P7 comme le moins cher de ses parkings officiels, mais il n’ouvre qu’en période d’affluence, sur réservation en ligne. Ouvert toute l’année, le P5 est le moins cher de sa grille 2026 : ${o.week.p5} la semaine sans réservation. ${week ? `Chez les parkings privés partenaires de ${p}, une semaine revient aujourd’hui ${week}.` : `Sur ${p}, les parkings privés avec navette sont classés par prix total.`}`,
      ],
      [
        "Combien coûte une semaine de parking à l’aéroport de Lyon ?",
        `Sans réservation, de ${o.week.p5} au P5 à ${o.week.p0} au P0 et au P1 pour sept jours, puis de ${DAY_8.p5} à ${DAY_8.p0} au 8e jour (grille 2026). En ligne et à l’avance, l’aéroport annonce « à partir de ${o.online.from} ». ${week ? `Chez les partenaires de ${p}, une semaine revient aujourd’hui ${week}.` : `Chez les partenaires de ${p}, le prix total s’affiche pour vos dates.`}`,
      ],
      [
        "Combien coûtent deux semaines de parking à Lyon Saint-Exupéry ?",
        `Sur la grille 2026 sans réservation, ${o.twoWeeks.p5} au P5 et ${o.twoWeeks.p0} au P0 ou au P1 ; un jour de plus fait passer le P5 à ${DAY_15.p5}. ${twoWeeks ? `Chez les partenaires de ${p}, deux semaines reviennent aujourd’hui ${twoWeeks}.` : `Chez les partenaires de ${p}, le prix total de deux semaines s’affiche pour vos dates.`}`,
      ],
      [
        "Réserver son parking en ligne coûte-t-il moins cher ?",
        `À l’aéroport, oui : ses tarifs en ligne sont en général plus bas que la grille appliquée sur place, et d’autant plus avantageux qu’on réserve tôt. Chez les partenaires de ${p}, le prix dépend du nombre de jours facturés, pas de la date de réservation : réserver tôt garantit surtout la place.`,
      ],
      [
        "Pourquoi une semaine de parking est-elle facturée 8 jours ?",
        `Chez les partenaires de ${p}, le jour du dépôt et celui du retour comptent chacun : du samedi au samedi suivant, cela fait 8 jours facturés. La grille de l’aéroport compte par tranches de 24 heures : sept jours et quelques heures passent au tarif du 8e jour, ${DAY_8.p5} au P5 au lieu de ${o.week.p5}.`,
      ],
      [
        "Que se passe-t-il si je reste plus longtemps que prévu au parking ?",
        `À l’aéroport, après une heure de tolérance, des frais de dépassement sont prélevés à la sortie, par exemple 6 € par 24 heures de plus au P5 et 20 € au P0, sauf vol retardé déclaré avec ses numéros (hors P1). Chez les partenaires de ${p}, un retour après la date et l’heure réservées prolonge le séjour, facturé par le parking à ses tarifs.`,
      ],
      [
        "Un retour anticipé est-il remboursé ?",
        `Non. Ni l’aéroport ni les parkings partenaires de ${p} ne remboursent les jours non utilisés. Si la compagnie aérienne a avancé le retour, l’aéroport suggère de lui demander un geste commercial.`,
      ],
      [
        "Combien coûte le Rhônexpress entre Lyon et l’aéroport ?",
        `Le ${o.readOn}, sur rhonexpress.fr : aller simple ${RHONEXPRESS.single} en ligne (${RHONEXPRESS.singleMachine} au distributeur), aller-retour ${RHONEXPRESS.return} en ligne, ${RHONEXPRESS.youthSingle} l’aller simple pour les 12-25 ans, gratuit avant 12 ans. L’aller-retour acheté deux mois à l’avance descend à ${RHONEXPRESS.earlyTwoMonths}. Le trajet depuis Lyon Part-Dieu dure environ 30 minutes.`,
      ],
      [
        "Vaut-il mieux prendre le Rhônexpress ou se garer à l’aéroport ?",
        `Pour une semaine, deux adultes paient ${couple} l’aller-retour en Rhônexpress, contre ${o.week.p5} au P5 sans réservation. Le tram coûte autant quelle que soit la durée, mais chaque voyageur de 12 ans et plus paie : il l’emporte pour un voyageur seul ou un long séjour, la voiture pour un groupe ou un week-end.`,
      ],
      [
        "Peut-on déposer quelqu’un gratuitement à l’aéroport de Lyon ?",
        `Oui : les parkings minute du Terminal 1 et de la gare TGV sont gratuits 10 minutes ; ensuite, ${o.minute.then}. Pour venir chercher quelqu’un, les zones d’attente aux entrées de l’aéroport sont gratuites une heure au plus, conducteur présent.`,
      ],
      [
        "Le parking P7 de l’aéroport de Lyon est-il ouvert toute l’année ?",
        `Non. Ce parking de débord n’ouvre qu’en période de forte affluence, et uniquement sur réservation en ligne. L’aéroport le présente comme le moins cher de ses parkings officiels ; sa navette gratuite passe ${o.p7Shuttle.every} et rejoint le Terminal 1 en ${o.p7Shuttle.ride}.`,
      ],
    ],
    partners: {
      filter: "all",
      stayDays: 7,
      title: "Les parkings partenaires les moins chers pour une semaine",
      lead: "La liste ne garde que les parkings partenaires disponibles pour les dates du formulaire, du moins cher au plus cher d’après le prix total du séjour, navette comprise.",
      empty:
        "Aucun parking partenaire n’est encore réservable en ligne pour ces dates. Revenez bientôt ou essayez d’autres dates ; en attendant, le guide de l’aéroport de Lyon Saint-Exupéry présente ses parkings officiels et leurs tarifs 2026.",
    },
  };
}
