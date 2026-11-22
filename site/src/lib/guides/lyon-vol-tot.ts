// Use-case guide « Vol tôt le matin » of Lyon Saint-Exupéry (22/11/2026): opening hours, night fees, when to leave home, the
// evening before, the late return. Airport facts from LYON_OFFICIAL (lyonaeroports.com, read on 09/10/2026); Plazo's own rules
// from site/src/lib/legal.ts and the booking messages (night fees frozen on the booked hours, message the evening before,
// « Prévenir de mon arrivée », return flight followed). Partner figures only from the live offers of real parkings.
import { LYON_OFFICIAL, offerText, rideMinutes, type TopicFacts, type TopicGuide } from "../airport-guides";
import { formatEuros } from "../money";
import { PRODUCT_NAME } from "../product";
import { topicPath } from "./topics";

export function lyonVolTot(facts: TopicFacts): TopicGuide {
  const o = LYON_OFFICIAL;
  const P = PRODUCT_NAME;
  const ride = facts.shuttle ? rideMinutes(facts.shuttle) : null;
  const open24 = facts.open24 ?? 0;
  const fee = facts.early?.fee ?? null;
  const early = facts.early?.offer ? offerText(facts.early.offer) : null;
  const feeText = fee ? (fee.min === fee.max ? formatEuros(fee.min) : `de ${formatEuros(fee.min)} à ${formatEuros(fee.max)}`) : null;

  const openSentence = open24
    ? `${open24 === 1 ? "Un de nos parkings partenaires est" : `${open24} de nos parkings partenaires sont`} aujourd’hui ouverts 24 heures sur 24 : la liste de cette page ne montre qu’eux, et le filtre « Ouvert 24h/24 » des résultats fait de même pour vos dates.`
    : "Le filtre « Ouvert 24h/24 » des résultats ne garde que les parkings ouverts toute la nuit, et chaque fiche donne ses horaires d’accueil.";
  const feeSentence = feeText
    ? `Pour un dépôt à 4 h 30, les frais de dépôt de nuit de nos parkings partenaires qui en demandent vont aujourd’hui ${fee!.min === fee!.max ? `jusqu’à ${feeText}` : feeText}, déjà compris dans le prix total affiché.`
    : "Quand un parking demande des frais de nuit, ils sont déjà compris dans le prix total affiché pour vos heures, et détaillés sur sa fiche.";
  const earlyOffer = early
    ? `Avec un dépôt à 4 h 30 et un retour une semaine plus tard, le moins cher de nos parkings partenaires est aujourd’hui proposé ${early}, frais de nuit compris.`
    : "Avec un dépôt au petit matin, le prix total de chaque parking pour vos heures exactes s’affiche dès que vous lancez la recherche, frais de nuit compris.";
  const rideSentence = ride
    ? `Chez nos parkings partenaires, la navette jusqu’au Terminal 1 dure ${ride} selon le parking.`
    : "La durée de la navette jusqu’au Terminal 1 est indiquée sur chaque fiche.";

  return {
    slug: "parking-vol-tot-le-matin",
    short: "Vol tôt le matin",
    metaTitle: "Parking aéroport Lyon pour un vol tôt le matin : horaires, prix",
    metaDescription: "Vol à 6 h à Lyon Saint-Exupéry : parkings ouverts la nuit, frais de dépôt de nuit, heure de départ de chez vous, navette, retour tard le soir.",
    title: "Parking à l’aéroport de Lyon Saint-Exupéry pour un vol tôt le matin",
    intro: `Décoller à 6 h, c’est déposer sa voiture vers 4 h, quand la plupart des accueils sont encore fermés. Ce guide explique comment choisir un parking pour un vol matinal : lesquels ouvrent la nuit, ce que coûte un dépôt en pleine nuit et comment le prix est calculé, à quelle heure quitter la maison, ce qui se prépare la veille au soir et comment se passe le retour quand on rentre tard. Informations de l’aéroport relevées le ${o.readOn} ; depuis le ${o.t2Closed}, tous les vols partent du Terminal 1.`,
    published: "2026-11-22",
    updated: "2026-11-22",
    sections: [
      {
        id: "ce-qui-compte",
        short: "Ce qui compte la nuit",
        title: "Ce qui compte quand on dépose sa voiture en pleine nuit",
        paragraphs: [
          "Pour un vol matinal, le prix n’est qu’un critère parmi d’autres. Trois questions passent avant : le parking accueille-t-il quelqu’un à l’heure où vous arrivez, la navette roule-t-elle déjà, et y a-t-il un supplément pour un dépôt de nuit ? Un parking bon marché qui ouvre à 6 h ne sert à rien pour un vol à 6 h 30.",
          openSentence,
          "Viennent ensuite le temps de trajet entre le parking et l’aérogare, qui s’ajoute à votre route, et la façon dont le parking gère les arrivées décalées : un retard sur l’autoroute à 4 h du matin est rare, mais un oubli à la maison arrive. Prévenir le parking de votre arrivée évite que la navette parte sans vous.",
        ],
        table: {
          caption: "Un vol matinal : ce qu’il faut vérifier avant de réserver",
          columns: ["Pourquoi", "Où le voir"],
          rows: [
            ["Horaires d’accueil", "Quelqu’un doit prendre vos clés ou vous indiquer votre place", "Fiche du parking, filtre « Ouvert 24h/24 »"],
            ["Frais de nuit", "Certains parkings ajoutent un supplément pour un dépôt de nuit", "Détail du prix sur la fiche, une fois vos heures saisies"],
            ["Durée de la navette", "Elle s’ajoute au trajet depuis chez vous", "Encart « Navette gratuite » de chaque résultat"],
            ["Annulation", "Un vol avancé ou annulé arrive aussi le matin", "Fiche, récapitulatif avant paiement, confirmation"],
          ],
          note: `Ce que montrent les fiches et les résultats de ${P}.`,
        },
      },
      {
        id: "parkings-ouverts-la-nuit",
        short: "Les parkings ouverts la nuit",
        title: "Quels parkings accueillent les voyageurs la nuit ?",
        paragraphs: [
          `À l’aéroport, les parkings officiels sont accessibles à toute heure : on entre par une borne, sans personne à l’accueil. Depuis le P0, le P1 ou le P3, on rejoint le Terminal 1 à pied, en ${o.walk.p3} depuis le P3 et ${o.walk.p0} depuis le P0. Le P5, plus éloigné et moins cher, est relié à l’aérogare par une navette qui passe ${o.p5Shuttle.every}.`,
          "Chez les parkings privés, c’est très variable. Certains sont ouverts 24 heures sur 24, avec une équipe de nuit et une navette qui tourne à toute heure ; d’autres ouvrent à 4 h, 5 h ou 6 h et ferment le soir ; d’autres encore acceptent les arrivées de nuit sur rendez-vous. Ne vous fiez pas au nom du parking ou à une ancienne habitude : lisez les horaires de la fiche, qui sont ceux que le parking a déclarés.",
          "Un parking qui n’ouvre pas 24 heures sur 24 peut tout de même convenir : pour un vol à 7 h 30, un accueil qui ouvre à 5 h laisse le temps de déposer la voiture et de prendre la navette. Faites le calcul à rebours, en partant de l’heure à laquelle vous devez être à l’aérogare.",
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-pas-cher"), label: "Comparer tous les prix des parkings de Lyon Saint-Exupéry" },
      },
      {
        id: "frais-de-nuit",
        short: "Les frais de nuit",
        title: "Les frais de nuit : comment ils sont calculés",
        paragraphs: [
          `Certains parkings privés demandent un supplément pour un dépôt ou un retour pendant leurs heures de nuit, par exemple entre 22 h et 6 h. Chaque parking choisit sa plage, la même tous les jours, et deux montants : un pour le dépôt de nuit, un pour le retour de nuit. Sur ${P}, ces frais de nuit sont compris dans le prix total affiché, détaillés sur la fiche du parking (« Frais de nuit · dépôt à 04:30 ») et rappelés avant le paiement.`,
          feeSentence,
          "Les frais sont calculés sur les heures que vous réservez, pas sur l’heure à laquelle vous arrivez réellement. Ils sont figés au moment de la réservation : un départ plus tôt que prévu ou un vol retour qui atterrit en pleine nuit ne les ajoutent pas après coup, et une arrivée en retard ne les retire pas. Le début de la plage compte comme la nuit, la fin non : avec une plage de 22 h à 6 h, un dépôt à 6 h n’en paie pas.",
          earlyOffer,
        ],
        parts: [
          {
            title: "Déposer la veille au soir ou au petit matin ?",
            paragraphs: [
              "Pour un vol à 6 h, deux façons de faire : déposer la voiture vers 4 h, ou la veille au soir et dormir à l’hôtel près de l’aéroport. Le dépôt de la veille ajoute en général un jour facturé, puisque les jours du calendrier comptent, arrivée et retour compris, et parfois des frais de nuit s’il tombe après le début de la plage. Le dépôt au petit matin, lui, peut entraîner des frais de dépôt de nuit.",
              "Saisissez les deux hypothèses dans la recherche : le prix total affiché pour chacune comprend tout, et la comparaison se fait en quelques secondes.",
            ],
          },
        ],
      },
      {
        id: "a-quelle-heure-partir",
        short: "À quelle heure partir",
        title: "À quelle heure partir de chez soi pour un vol de 6 h ?",
        paragraphs: [
          `L’aéroport recommande d’être au terminal ${o.advice}. Pour un vol en France à 6 h, il faut donc être au Terminal 1 vers 4 h. À ce temps s’ajoutent la navette du parking, l’attente de la navette et le dépôt de la voiture lui-même : se présenter à l’accueil, laisser les clés si le parking les prend, charger les bagages.`,
          rideSentence,
          `Le parking peut aussi calculer pour vous l’heure de la navette. Si vous donnez votre vol aller en réservant, ${P} suit son horaire de décollage et indique dans Ma réservation l’heure à laquelle la navette vers le terminal est prévue ; les parkings regroupent les voyageurs par créneau d’un quart d’heure. Le jour même, l’heure peut bouger si votre vol est retardé.`,
        ],
        table: {
          caption: "Un vol en France à 6 h : le calcul à rebours",
          columns: ["Étape", "Précision"],
          rows: [
            ["6 h 00", "Décollage", "Vol en France"],
            ["4 h 00", "Arrivée au Terminal 1", `Recommandation de l’aéroport : 2 h avant un vol en France`],
            ["3 h 30 environ", "Départ de la navette du parking", "Selon la durée de navette indiquée sur la fiche"],
            ["3 h 15 environ", "Arrivée au parking", "Dépôt, clés, bagages"],
            ["Selon votre route", "Départ de chez vous", "Ajoutez une marge pour l’imprévu"],
          ],
          note: `Recommandation de l’aéroport relevée le ${o.readOn} ; les autres heures sont un exemple, à adapter à la navette et à l’accueil du parking choisi.`,
        },
      },
      {
        id: "la-veille",
        short: "Ce qui se prépare la veille",
        title: "La veille au soir : ce qui se prépare pour partir sereinement",
        paragraphs: [
          `La veille du dépôt, ${P} vous envoie en général un message de rappel, à l’heure choisie par le parking, en général en fin de journée : l’adresse du parking, l’heure de votre dépôt, le lien de votre réservation et, quand le parking les a donnés, ses consignes. Si vous réservez tard le soir pour le lendemain matin, ce message part tout de suite après la réservation.`,
          "Profitez de la soirée pour vérifier trois choses dans Ma réservation : l’heure de dépôt (une heure de 4 h 30 ne se change pas le matin même), votre numéro de vol retour, que vous pouvez corriger vous-même jusqu’au retour, et le numéro du parking, à garder sous la main.",
        ],
        list: [
          "Préparez les papiers de la voiture et retirez les objets de valeur : vous n’aurez pas l’esprit clair à 3 h du matin.",
          "Notez l’adresse exacte du parking dans votre GPS : de nuit, les panneaux se voient mal.",
          "Faites le plein la veille : certaines stations ne sont pas ouvertes la nuit, et un détour coûte de précieuses minutes.",
          "Si vous avez des enfants, demandez les sièges auto pour la navette depuis Ma réservation, tant que la réservation est « Attendu ».",
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-en-famille"), label: "Partir de nuit avec des enfants : le guide en famille" },
      },
      {
        id: "le-matin-meme",
        short: "Le matin même",
        title: "Le matin même : prévenir le parking de son arrivée",
        paragraphs: [
          `Depuis Ma réservation, sur le site ou dans l’application ${P}, le bouton « Prévenir de mon arrivée » permet de dire au parking que vous êtes en route : en partageant votre position, si vous l’acceptez, ou simplement en annonçant « J’arrive dans 10, 20 ou 30 minutes ». L’équipe sait ainsi qui arrive, et quand ; c’est précieux la nuit, quand elle est réduite.`,
          "Une fois sur place, « Je suis au point de rendez-vous » prévient l’équipe que vous attendez. Vous pouvez joindre un mot au message, par exemple pour signaler un bagage encombrant ou un passager de plus.",
          "Chez les parkings qui montrent leurs navettes aux voyageurs, la navette apparaît en direct sur la carte de votre réservation, du jour du dépôt au jour du retour : vous voyez quand elle part et où elle se trouve.",
        ],
      },
      {
        id: "retour-tard",
        short: "Le retour tard le soir",
        title: "Le retour tard le soir : la même attention",
        paragraphs: [
          "Un vol matinal à l’aller est souvent un vol tardif au retour. Mêmes questions : le parking accueille-t-il quelqu’un à l’heure où vous atterrissez, y a-t-il des frais de retour de nuit ? Ils se voient aussi dans le prix total, calculés sur l’heure de retour réservée.",
          `Donnez votre numéro de vol retour en réservant : ${P} suit l’atterrissage et le parking reçoit l’heure réelle, ce qui lui permet d’ajuster la navette si votre vol arrive en retard. À l’atterrissage, un message vous indique le point de rendez-vous et ce qu’il faut faire ; un vol en retard ne vous fait pas payer de frais de nuit en plus, puisque seuls comptent les horaires réservés.`,
          "Si le retard est important ou si vos bagages se font attendre, prévenez le parking depuis Ma réservation (« Mon vol a du retard », « Bagage perdu ») : l’équipe le voit tout de suite.",
        ],
      },
      {
        id: "reserver",
        short: "Réserver sur " + P,
        title: `Réserver un parking pour un vol matinal sur ${P}`,
        paragraphs: [
          `Saisissez votre heure de dépôt réelle, même très tôt, et votre heure de retour : le prix total de chaque parking est calculé pour ces heures, frais de nuit compris. Le paiement se fait en ligne, par carte, au moment de la réservation ; il n’y a rien à régler au parking pour la place réservée.`,
          "Chaque parking choisit ses conditions d’annulation parmi quatre formules : gratuite jusqu’à l’heure de dépôt, jusqu’à 24 heures avant, jusqu’à 48 heures avant, ou non remboursable. Pour un vol très matinal, une annulation gratuite jusqu’à l’heure de dépôt laisse le plus de souplesse si votre vol est annulé la veille.",
        ],
      },
    ],
    faq: [
      [
        "Existe-t-il des parkings ouverts toute la nuit près de l’aéroport de Lyon ?",
        "Oui. Les parkings officiels de l’aéroport sont accessibles à toute heure par borne, et certains parkings privés sont ouverts 24 heures sur 24. Le filtre « Ouvert 24h/24 » des résultats ne garde que ceux-là, et chaque fiche donne ses horaires d’accueil.",
      ],
      [
        "Les frais de nuit sont-ils ajoutés à l’arrivée au parking ?",
        "Non. Les frais de nuit sont compris dans le prix total affiché, calculés sur les heures que vous réservez, et figés à la réservation. Ils sont détaillés sur la fiche et rappelés avant le paiement ; rien ne s’ajoute sur place pour la place réservée.",
      ],
      [
        "Mon vol retour arrive en retard en pleine nuit : vais-je payer des frais de nuit ?",
        "Non. Les frais de nuit dépendent uniquement des heures de dépôt et de retour réservées. Un retard de vol ne les ajoute pas après coup ; en revanche, prévenez le parking depuis Ma réservation pour qu’il ajuste la navette.",
      ],
      [
        "À quelle heure arriver au parking pour un vol à 6 h ?",
        "L’aéroport recommande d’être au terminal 2 heures avant un vol en France. Ajoutez la durée de la navette indiquée sur la fiche, l’attente et le temps du dépôt : pour un vol à 6 h, comptez en général une arrivée au parking vers 3 h 15.",
      ],
      [
        "Vaut-il mieux déposer la voiture la veille au soir ?",
        "Cela dépend du parking : le dépôt de la veille ajoute en général un jour facturé, le dépôt au petit matin peut entraîner des frais de nuit. Saisissez les deux hypothèses dans la recherche et comparez les prix totaux affichés.",
      ],
      [
        "Comment prévenir le parking que j’arrive en pleine nuit ?",
        "Depuis Ma réservation, le bouton « Prévenir de mon arrivée » permet de partager votre position ou d’annoncer votre arrivée dans 10, 20 ou 30 minutes, puis de signaler que vous êtes au point de rendez-vous.",
      ],
      [
        "Puis-je réserver la veille au soir pour le lendemain matin ?",
        "Oui, tant que le parking a de la place pour vos dates. Le message de rappel de la veille vous est alors envoyé juste après la réservation, avec l’adresse, l’heure de dépôt et le lien de votre réservation.",
      ],
      [
        "La navette roule-t-elle à 4 h du matin ?",
        "Chaque parking organise sa navette d’après les dépôts réservés et ses horaires d’accueil. Vérifiez sur la fiche que l’accueil est ouvert à votre heure de dépôt : c’est l’équipe présente qui conduit la navette vers le terminal.",
      ],
      [
        "Que faire si mon vol du matin est annulé la veille ?",
        "Annulez depuis Ma réservation dans le délai d’annulation gratuite du parking : le remboursement est automatique. Après ce délai, adressez-vous au parking, libre de consentir un geste commercial.",
      ],
      [
        "Le parking de l’aéroport est-il plus simple pour un vol très matinal ?",
        "Il évite la navette d’un parking privé quand on choisit le P0, le P1 ou le P3, à quelques minutes à pied du Terminal 1, mais il coûte en général plus cher pour plusieurs jours. Comparez le temps gagné et la différence de prix.",
      ],
    ],
    partners: {
      filter: open24 ? "open_24h" : "all",
      stayDays: 7,
      title: open24 ? "Les parkings partenaires ouverts 24h/24" : "Les parkings partenaires pour un dépôt au petit matin",
      lead: "La liste montre les parkings partenaires qui ont de la place pour un dépôt à 4 h 30 et un retour une semaine plus tard, du moins cher au plus cher d’après le prix total, frais de nuit compris ; pour d’autres heures, indiquez les vôtres et lancez la recherche.",
      empty: "Aucun parking partenaire n’est encore réservable en ligne pour ces heures. Revenez bientôt, et consultez en attendant le guide complet du parking à l’aéroport de Lyon Saint-Exupéry pour comparer les parkings officiels.",
    },
  };
}
