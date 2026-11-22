// Use-case guide « Week-end » of Lyon Saint-Exupéry (22/11/2026): short stays of two to four days. Airport grid without booking
// (24 h, 2 days, 4 days, LYON_OFFICIAL, read on 09/10/2026, billed by 24-hour slices) against private parkings billed by calendar
// days (arrival and return included), the drop-off at the minute parking, the timing of a Friday departure, cancellation.
import { LYON_OFFICIAL, offerText, rideMinutes, type TopicFacts, type TopicGuide } from "../airport-guides";
import { PRODUCT_NAME } from "../product";
import { topicPath } from "./topics";

type Grid = keyof typeof LYON_OFFICIAL.grid;

export function lyonWeekEnd(facts: TopicFacts): TopicGuide {
  const o = LYON_OFFICIAL;
  const g = o.grid;
  const P = PRODUCT_NAME;
  const ride = facts.shuttle ? rideMinutes(facts.shuttle) : null;
  const weekend = facts.weekend ? offerText(facts.weekend) : null;

  const weekendSentence = weekend
    ? `Pour un séjour de trois jours du calendrier, le moins cher de nos parkings partenaires est aujourd’hui proposé ${weekend}, navette comprise.`
    : "Pour un séjour de trois jours, le prix total de chaque parking s’affiche dès que vous lancez la recherche, navette comprise.";
  const rideSentence = ride
    ? `Chez nos parkings partenaires, la navette jusqu’au Terminal 1 dure ${ride} selon le parking.`
    : "La durée de la navette jusqu’au Terminal 1 est indiquée sur chaque fiche.";

  return {
    slug: "parking-week-end",
    short: "Parking week-end",
    metaTitle: "Parking aéroport Lyon pour un week-end : 2 à 4 jours, prix",
    metaDescription: "Un week-end au départ de Lyon Saint-Exupéry : tarifs 2026 de l’aéroport pour 24 h, 2 et 4 jours, parkings privés, décompte des jours, dépose-minute.",
    title: "Parking à l’aéroport de Lyon Saint-Exupéry pour un week-end ou un court séjour",
    intro: `Pour un week-end à Barcelone ou trois jours à Lisbonne, le parking pèse vite lourd dans le budget : il peut coûter plus cher que le billet d’avion. Ce guide compare, pour les séjours de deux à quatre jours, les tarifs officiels de l’aéroport de Lyon Saint-Exupéry et les parkings privés avec navette, explique comment les jours sont comptés de part et d’autre, puis donne les bons réflexes pour un départ le vendredi soir et un retour le dimanche. Informations de l’aéroport relevées le ${o.readOn} ; depuis le ${o.t2Closed}, tous les vols partent du Terminal 1.`,
    published: "2026-11-22",
    updated: "2026-11-22",
    sections: [
      {
        id: "prix-court-sejour",
        short: "Les prix pour 2 à 4 jours",
        title: "Combien coûte un parking pour un week-end à Lyon Saint-Exupéry ?",
        paragraphs: [
          `Sans réservation, la grille 2026 de l’aéroport fait payer deux jours ${g.P5[1]} au P5, le moins cher, et ${g["P0 · P1"][1]} au P0 ou au P1, au pied du terminal. Pour quatre jours, on passe à ${g.P5[2]} au P5 et ${g["P0 · P1"][2]} au P0 ou au P1. En ligne et à l’avance, l’aéroport annonce des prix plus bas, selon les dates et les places restantes.`,
          weekendSentence,
        ],
        table: {
          caption: "Parkings de l’aéroport : tarifs 2026 sans réservation pour un court séjour",
          columns: ["24 h", "2 jours", "4 jours"],
          rows: (Object.keys(g) as Grid[]).map(parking => [parking, g[parking][0], g[parking][1], g[parking][2]]),
          note: `Grille 2026 de Lyon Aéroport, tarifs sans réservation, relevée le ${o.readOn}.`,
        },
      },
      {
        id: "decompte",
        short: "Comment les jours sont comptés",
        title: "Comment les jours sont comptés : tranches de 24 heures ou jours du calendrier",
        paragraphs: [
          "Sur un court séjour, le décompte des jours change tout. La grille sans réservation de l’aéroport avance par tranches de 24 heures : un dépôt le vendredi à 7 h et un retour le dimanche à 21 h font 62 heures, soit plus de deux fois 24 heures ; c’est alors le tarif suivant qui s’applique.",
          "Chez nos parkings partenaires, ce sont les jours du calendrier qui comptent, arrivée et retour compris, quelle que soit l’heure : du vendredi au dimanche, trois jours sont facturés, que vous partiez à 7 h ou à 18 h et que vous rentriez à 9 h ou à 23 h. Pour un départ le vendredi soir et un retour le dimanche soir, c’est souvent plus avantageux ; pour un départ le samedi matin et un retour le dimanche midi, les deux se valent.",
          "Le prix total affiché pour vos heures exactes tient compte de ces règles : saisissez vos vraies heures plutôt qu’une journée entière, et comparez.",
        ],
        table: {
          caption: "Un séjour du vendredi au dimanche : deux façons de compter",
          columns: ["Durée comptée", "Ce qui compte"],
          rows: [
            ["Aéroport, sans réservation", "Plus de 2 × 24 h pour 62 heures", "Les heures exactes de dépôt et de retour"],
            ["Parkings privés partenaires", "3 jours du calendrier", "Le jour de dépôt et le jour de retour, quelle que soit l’heure"],
          ],
          note: `Exemple : dépôt le vendredi à 7 h, retour le dimanche à 21 h. Règles de la grille 2026 de l’aéroport et de ${P}.`,
        },
      },
      {
        id: "depose-minute",
        short: "Se faire déposer",
        title: "Se faire déposer : le dépose-minute et ses limites",
        paragraphs: [
          `Pour deux jours, se faire déposer par un proche est tentant. Au dépose-minute du Terminal 1, l’arrêt est gratuit pendant ${o.minute.free} ; ensuite, ${o.minute.then}. Et ${o.minute.cap}. C’est parfait pour descendre une valise, beaucoup moins pour attendre un voyageur en retard.`,
          "Le calcul est vite fait : quelqu’un qui vous dépose à l’aller et vient vous chercher au retour fait deux fois l’aller-retour jusqu’à l’aéroport. Entre le carburant, le péage éventuel et le temps passé, un parking avec navette revient souvent moins cher pour un week-end, et ne dépend de personne.",
        ],
      },
      {
        id: "vendredi-soir",
        short: "Partir le vendredi soir",
        title: "Partir le vendredi soir : la route et la navette",
        paragraphs: [
          "Le vendredi en fin de journée, la rocade et les autoroutes qui mènent à l’aéroport sont chargées. Prévoyez une marge, d’autant que l’aéroport recommande d’être au terminal 2 heures avant un vol en France et 2 h 30 avant un vol dans l’espace Schengen.",
          rideSentence,
          `Le jour du départ, prévenez le parking de votre arrivée depuis Ma réservation, sur le site ou dans l’application ${P} : en partageant votre position, si vous l’acceptez, ou en annonçant « J’arrive dans 20 minutes ». L’équipe sait qui arrive, et la navette ne part pas sans vous.`,
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-vol-tot-le-matin"), label: "Partir tôt le samedi matin : horaires et frais de nuit" },
      },
      {
        id: "retour-dimanche",
        short: "Rentrer le dimanche",
        title: "Rentrer le dimanche soir sans attendre",
        paragraphs: [
          `Le dimanche soir, beaucoup de vols arrivent en même temps. Donnez votre numéro de vol retour en réservant : ${P} suit l’atterrissage et le parking reçoit l’heure réelle, ce qui lui permet d’organiser ses navettes. À l’atterrissage, un message vous indique le point de rendez-vous et ce qu’il faut faire.`,
          "Si votre vol a du retard, rien à faire : le parking voit la nouvelle heure. Si vos bagages se font attendre, prévenez-le depuis Ma réservation, en un geste. Un retour réservé tard le soir peut entraîner des frais de nuit chez certains parkings : ils sont alors compris dans le prix total affiché, calculés sur l’heure de retour réservée, jamais ajoutés après coup.",
          "Vous pouvez corriger vous-même votre numéro de vol retour depuis Ma réservation, jusqu’au retour, si vous changez de vol pendant le week-end.",
        ],
      },
      {
        id: "petit-bagage",
        short: "Un petit bagage",
        title: "Un petit bagage, des clés et c’est tout",
        paragraphs: [
          "Pour un week-end, on voyage souvent avec un simple bagage cabine. Profitez-en pour alléger la voiture : retirez les objets de valeur, ne laissez rien de visible et gardez les papiers du véhicule avec vous si le parking ne les demande pas.",
          "Chez un parking avec voiturier, vous laissez les clés à l’accueil et montez directement dans la navette : c’est le dépôt le plus rapide, appréciable un vendredi soir. Ailleurs, l’équipe vous indique votre place.",
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-voiturier"), label: "Toutes les formules de voiturier à Lyon Saint-Exupéry" },
      },
      {
        id: "parkings-de-l-aeroport",
        short: "Les parkings de l’aéroport",
        title: "Les parkings de l’aéroport pour un court séjour",
        paragraphs: [
          `Pour deux jours, la proximité compte davantage que pour deux semaines : on veut rentrer vite le dimanche soir. Le P3, face au Terminal 1, est à ${o.walk.p3} à pied ; le P0 et le P1 à ${o.walk.p0} et ${o.walk.p1}. Le P2 et le P4, en plein air près de la gare TGV, sont à ${o.walk.p2} à pied.`,
          `Le P5, le plus économique de la grille sans réservation, est éloigné : une navette passe ${o.p5Shuttle.every}, et l’aéroport compte ${o.p5Shuttle.door} de la voiture au terminal, marche et attente comprises. Pour un week-end, ce temps se compte deux fois, à l’aller et au retour.`,
          "L’aéroport vend aussi ses places en ligne, à l’avance, à des prix plus bas que sa grille sans réservation, selon les dates et les places restantes. Comparez ces prix en ligne, la grille sans réservation et les parkings privés pour vos heures exactes : sur un court séjour, l’écart peut aller dans un sens comme dans l’autre.",
        ],
      },
      {
        id: "a-l-avance",
        short: "À l’avance ou au dernier moment",
        title: "Réserver à l’avance ou au dernier moment ?",
        paragraphs: [
          "Les week-ends de départs en vacances, les ponts de mai et les grands week-ends d’hiver, les parkings proches de l’aéroport se remplissent vite. Réserver dès que les billets d’avion sont pris garantit une place, et les conditions d’annulation gratuite laissent la possibilité de changer d’avis.",
          "En dehors de ces périodes, une réservation la veille, voire le jour même, reste souvent possible, tant que le parking a de la place pour vos dates. Le prix affiché par un parking privé dépend de sa grille et de vos dates, pas de la date à laquelle vous réservez.",
          "Une réservation faite tard le soir pour le lendemain matin déclenche tout de suite le message de rappel : vous recevez l’adresse, l’heure de dépôt et le lien de votre réservation sans attendre.",
        ],
        list: [
          "Week-end de départs en vacances ou pont : réservez dès l’achat des billets.",
          "Week-end ordinaire : quelques jours avant suffisent en général.",
          "Départ décidé au dernier moment : la recherche n’affiche que les parkings qui ont encore de la place.",
        ],
      },
      {
        id: "budget",
        short: "Le budget d’un week-end",
        title: "Le budget d’un week-end : où passe l’argent",
        paragraphs: [
          "Sur un week-end, le parking se compare à d’autres façons de rejoindre l’aéroport : un taxi ou un VTC dans les deux sens, un proche qui fait deux allers-retours, les transports en commun. Pour une personne seule avec un bagage cabine, le train ou le tram peuvent l’emporter ; pour un couple ou une famille, la voiture et un parking avec navette deviennent vite plus simples et moins chers.",
          "Dans le prix d’un parking privé réservé en ligne, tout est compris : la place pour vos dates, la navette aller et retour, et les éventuels frais de nuit de vos heures. Rien d’autre à payer pour la place réservée ; seuls les services commandés en plus, comme un lavage, et les jours au-delà de la date de retour réservée s’ajoutent.",
          "Le calcul se fait donc en une recherche : saisissez vos heures, regardez les prix totaux, et comparez-les au coût des autres solutions pour le même trajet.",
        ],
      },
      {
        id: "reserver",
        short: "Réserver sur " + P,
        title: `Réserver un parking pour un week-end sur ${P}`,
        paragraphs: [
          `Saisissez vos heures exactes de dépôt et de retour : le prix total de chaque parking est calculé pour elles, frais de nuit compris le cas échéant. Le paiement se fait en ligne, par carte, au moment de la réservation ; il n’y a rien à régler au parking pour la place réservée.`,
          "Chaque parking choisit ses conditions d’annulation parmi quatre formules : gratuite jusqu’à l’heure de dépôt, jusqu’à 24 heures avant, jusqu’à 48 heures avant, ou non remboursable. Pour un week-end décidé au dernier moment, ou soumis à la météo, une annulation gratuite jusqu’à l’heure de dépôt laisse le plus de souplesse.",
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-pas-cher"), label: "Trouver le parking le moins cher à Lyon Saint-Exupéry" },
      },
    ],
    faq: [
      [
        "Que comprend le prix d’un parking privé pour un week-end ?",
        "La place pour vos dates, la navette aller et retour jusqu’au Terminal 1 et les éventuels frais de nuit de vos heures réservées. Seuls les services commandés en plus et les jours au-delà du retour réservé s’ajoutent.",
      ],
      [
        "Le prix d’un parking privé baisse-t-il si je réserve longtemps à l’avance ?",
        "Non : le prix affiché par un parking privé dépend de sa grille et de vos dates, pas du jour où vous réservez. Réserver tôt sert surtout à garantir une place les week-ends chargés.",
      ],
      [
        "Combien coûte un parking pour un week-end à l’aéroport de Lyon ?",
        `Sans réservation, la grille 2026 de l’aéroport affiche ${g.P5[1]} pour deux jours au P5 et ${g["P0 · P1"][1]} au P0 ou au P1 (relevé le ${o.readOn}). Les parkings privés avec navette affichent leur prix total pour vos dates dans la recherche.`,
      ],
      [
        "Du vendredi au dimanche, combien de jours sont facturés ?",
        "Chez les parkings privés partenaires, trois jours du calendrier, arrivée et retour compris, quelle que soit l’heure. À l’aéroport, sans réservation, les heures comptent par tranches de 24 heures.",
      ],
      [
        "Vaut-il mieux se faire déposer pour deux jours ?",
        "Pas toujours : le dépose-minute n’est gratuit que 10 minutes, et la personne qui vous dépose fait deux allers-retours. Pour un week-end, un parking avec navette revient souvent moins cher et ne dépend de personne.",
      ],
      [
        "Peut-on réserver un parking pour une seule nuit ?",
        "Oui : saisissez vos dates et heures dans la recherche. Chez les parkings privés, deux jours du calendrier sont alors facturés, le jour du dépôt et celui du retour.",
      ],
      [
        "Mon vol du dimanche soir a du retard : dois-je prévenir le parking ?",
        "Si vous avez donné votre numéro de vol retour, le parking reçoit l’heure réelle d’atterrissage. Prévenez-le seulement si quelque chose d’autre vous retient, comme un bagage perdu.",
      ],
      [
        "Un retour tard le dimanche soir coûte-t-il plus cher ?",
        "Chez certains parkings, un retour pendant leurs heures de nuit entraîne des frais de nuit. Ils sont compris dans le prix total affiché, calculés sur l’heure de retour réservée, jamais ajoutés après coup.",
      ],
      [
        "Puis-je changer de vol retour pendant le week-end ?",
        "Oui, corrigez votre numéro de vol retour depuis Ma réservation, jusqu’au retour : le parking suit alors le bon vol. Pour un autre jour de retour, contactez le parking.",
      ],
      [
        "Le parking de l’aéroport est-il plus pratique pour un week-end ?",
        "Le P0, le P1 et le P3 sont à quelques minutes à pied du Terminal 1, sans navette à attendre, mais ils coûtent plus cher. Comparez le temps gagné et l’écart de prix pour vos heures.",
      ],
      [
        "Peut-on annuler un parking réservé pour un week-end ?",
        "Oui, dans le délai d’annulation gratuite du parking, depuis Ma réservation : le remboursement est automatique. Le délai, choisi par chaque parking, est affiché sur la fiche et dans la confirmation.",
      ],
    ],
    partners: {
      filter: "all",
      stayDays: 3,
      title: "Les parkings partenaires les moins chers pour un week-end",
      lead: "La liste montre les parkings partenaires qui ont de la place pour les trois jours préremplis dans le formulaire, du moins cher au plus cher d’après le prix total ; pour d’autres dates, indiquez les vôtres et lancez la recherche.",
      empty: "Aucun parking partenaire n’est encore réservable en ligne pour ces dates. Revenez bientôt, et consultez en attendant le guide complet du parking à l’aéroport de Lyon Saint-Exupéry pour comparer les parkings officiels.",
    },
  };
}
