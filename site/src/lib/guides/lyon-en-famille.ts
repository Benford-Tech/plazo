// Use-case guide « En famille » of Lyon Saint-Exupéry (22/11/2026): child seats in the shuttle (Plazo's rule of 24/10/2026: free,
// by age, up to four of each, children counted as passengers, changeable while the booking is « Attendu »), passengers and
// luggage, valet, timing with children, the return. Airport facts from LYON_OFFICIAL; partner figures from real offers only.
import { LYON_OFFICIAL, offerText, rideMinutes, type TopicFacts, type TopicGuide } from "../airport-guides";
import { PRODUCT_NAME } from "../product";
import { topicPath } from "./topics";

export function lyonEnFamille(facts: TopicFacts): TopicGuide {
  const o = LYON_OFFICIAL;
  const P = PRODUCT_NAME;
  const ride = facts.shuttle ? rideMinutes(facts.shuttle) : null;
  const week = facts.week ? offerText(facts.week) : null;
  const valetCount = facts.valet?.count ?? 0;

  const rideSentence = ride
    ? `Chez nos parkings partenaires, la navette jusqu’au Terminal 1 dure ${ride} selon le parking : un trajet court, mais qu’il faut faire avec les enfants attachés.`
    : "La durée de la navette jusqu’au Terminal 1 est indiquée sur chaque fiche : un trajet court, mais qu’il faut faire avec les enfants attachés.";
  const priceSentence = week
    ? `Pour une semaine, le moins cher de nos parkings partenaires est aujourd’hui proposé ${week} : le prix est celui de la place, quel que soit le nombre de passagers, et les sièges auto ne coûtent rien de plus.`
    : "Le prix d’un parking privé est celui de la place, quel que soit le nombre de passagers, et les sièges auto de la navette ne coûtent rien de plus.";
  const valetSentence = valetCount
    ? `${valetCount === 1 ? "Un de nos parkings partenaires propose" : `${valetCount} de nos parkings partenaires proposent`} un voiturier : vous laissez les clés à l’accueil et montez directement dans la navette avec les enfants et les bagages.`
    : "Le filtre « Voiturier » des résultats garde les parkings où l’on vous prend les clés : vous montez directement dans la navette avec les enfants et les bagages.";

  return {
    slug: "parking-en-famille",
    short: "Parking en famille",
    metaTitle: "Parking aéroport Lyon en famille : sièges auto et navette",
    metaDescription: "Partir de Lyon Saint-Exupéry en famille : sièges auto gratuits dans la navette, passagers et bagages, voiturier, horaires avec enfants et retour.",
    title: "Parking à l’aéroport de Lyon Saint-Exupéry en famille : sièges auto, navette et bagages",
    intro: `Partir en vacances avec des enfants, c’est une poussette, des valises en plus, un siège auto pour chacun et un horaire qui laisse peu de place à l’imprévu. Ce guide explique comment choisir un parking pour une famille à l’aéroport de Lyon Saint-Exupéry : les sièges auto dans la navette, le nombre de passagers, les bagages, le voiturier, le bon horaire et le retour, quand tout le monde est fatigué. Informations de l’aéroport relevées le ${o.readOn} ; depuis le ${o.t2Closed}, tous les vols partent du Terminal 1.`,
    published: "2026-11-22",
    updated: "2026-11-22",
    sections: [
      {
        id: "sieges-auto",
        short: "Les sièges auto dans la navette",
        title: "Les sièges auto dans la navette : gratuits, à demander à la réservation",
        paragraphs: [
          `La question qui inquiète le plus les parents : que deviennent les sièges auto pendant le trajet en navette ? Sur ${P}, vous indiquez en réservant, dans « Des enfants à bord ? », combien de sièges il faut et pour quel âge. Le parking installe ces sièges dans la navette, à l’aller comme au retour. Le service est gratuit et ne demande aucun réglage de votre part.`,
          "Trois tranches d’âge sont proposées, jusqu’à quatre sièges de chaque sorte : le siège bébé, installé dos à la route, jusqu’à 12 mois ; le siège enfant, de 1 à 4 ans ; le réhausseur, de 4 à 10 ans. Les enfants comptent parmi les passagers, et le nombre de sièges ne peut pas dépasser celui des passagers moins un adulte.",
          rideSentence,
        ],
        table: {
          caption: "Les sièges auto proposés dans la navette",
          columns: ["Âge", "Installation"],
          rows: [
            ["Siège bébé", "Jusqu’à 12 mois", "Dos à la route"],
            ["Siège enfant", "De 1 à 4 ans", "Siège à harnais"],
            ["Réhausseur", "De 4 à 10 ans", "Avec la ceinture du véhicule"],
          ],
          note: `Règles de ${P} : jusqu’à quatre sièges de chaque sorte, gratuits, installés à l’aller et au retour.`,
        },
        parts: [
          {
            title: "Changer d’avis après la réservation",
            paragraphs: [
              "Un enfant de plus, un réhausseur au lieu d’un siège enfant ? Depuis Ma réservation, sur le site ou dans l’application, le bloc « Sièges auto » se modifie tant que la réservation est « Attendu », c’est-à-dire jusqu’au dépôt de la voiture. Si vous ajoutez des sièges pour des enfants qui n’étaient pas comptés, le nombre de passagers suit. Le parking voit le changement tout de suite, et son chauffeur sait quels sièges charger avant de partir.",
            ],
          },
          {
            title: "Et si je préfère mes propres sièges ?",
            paragraphs: [
              "Rien ne vous empêche de les prendre : ils resteront alors dans le coffre de la voiture garée, ou voyageront avec vous si votre compagnie les accepte en soute. Dans la navette, le parking installe les siens, que vous avez demandés à la réservation : vous n’avez pas à démonter et remonter vos sièges sur le parking.",
            ],
          },
        ],
      },
      {
        id: "passagers-et-bagages",
        short: "Passagers et bagages",
        title: "Passagers et bagages : ce que le parking doit savoir",
        paragraphs: [
          "Indiquez le nombre exact de passagers en réservant, enfants compris. Le parking s’en sert pour organiser ses navettes : chaque véhicule a un nombre de places limité, et le chauffeur doit savoir qui il emmène. Une famille de cinq avec deux grosses valises par adulte ne voyage pas comme un couple avec un sac cabine.",
          priceSentence,
          "Une poussette, un lit parapluie, des skis ? Écrivez-le dans le message au parking, en réservant, ou joignez un mot quand vous le prévenez de votre arrivée. L’équipe peut ainsi prévoir la place dans la navette, ou vous conseiller de laisser certaines affaires dans la voiture.",
        ],
        list: [
          "Comptez chaque enfant comme passager, même un bébé porté.",
          "Demandez un siège par enfant qui en a besoin, dans la bonne tranche d’âge.",
          "Signalez les bagages encombrants dans le message au parking.",
          "Gardez dans un sac à main ce dont les enfants auront besoin pendant le trajet : la navette n’attend pas qu’on ouvre le coffre.",
        ],
      },
      {
        id: "voiturier-ou-navette",
        short: "Voiturier ou navette",
        title: "Voiturier ou parking avec navette : le plus simple avec des enfants",
        paragraphs: [
          "Dans un parking où vous garez la voiture vous-même, il faut trouver sa place, décharger les bagages, porter les enfants jusqu’à l’arrêt de navette et attendre. Avec un voiturier, vous vous arrêtez à l’accueil, laissez les clés et montez directement dans la navette : c’est souvent le plus confortable en famille.",
          valetSentence,
          "Au retour, même logique : chez un parking avec voiturier, c’est l’équipe qui vous rend la voiture. Faites le tour du véhicule avec elle, comme au dépôt : quand le parking fait un état des lieux avec photos, il compare celles du dépôt et du retour.",
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-voiturier"), label: "Toutes les formules de voiturier à Lyon Saint-Exupéry" },
      },
      {
        id: "horaires",
        short: "Le bon horaire",
        title: "Le bon horaire avec des enfants",
        paragraphs: [
          `L’aéroport recommande d’être au terminal ${o.advice}. Avec des enfants, ajoutez une marge : le passage aux contrôles prend plus de temps, et les imprévus sont plus nombreux. Comptez aussi le temps du dépôt et de la navette, et celui de l’installation des enfants dans leurs sièges.`,
          `Donnez votre vol aller en réservant : ${P} suit son horaire et indique dans Ma réservation l’heure à laquelle la navette vers le terminal est prévue. Si vous partez très tôt, lisez aussi le guide du vol matinal, qui explique les horaires d’accueil et les frais de nuit.`,
          "Le jour du départ, prévenez le parking de votre arrivée depuis Ma réservation (« J’arrive dans 20 minutes ») : le chauffeur sait combien de sièges préparer, et la navette ne part pas sans vous.",
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-vol-tot-le-matin"), label: "Partir tôt le matin : horaires et frais de nuit" },
      },
      {
        id: "pendant-le-sejour",
        short: "Pendant le séjour",
        title: "Pendant le séjour : retrouver sa réservation et sa voiture",
        paragraphs: [
          `Tout est dans Ma réservation, sur le site ou dans l’application ${P} : dates, plaque, passagers, sièges auto, numéro du parking. Dans l’application, la carte « Ma voiture » garde l’emplacement de la voiture quand vous l’avez enregistré ou que le voiturier l’a noté, et « Retrouver ma voiture » vous y mène à pied.`,
          "Si votre retour change, corrigez votre numéro de vol retour vous-même depuis Ma réservation : le parking suit alors le bon vol. Pour de nouvelles dates, contactez le parking, qui peut modifier la réservation s’il a de la place.",
        ],
      },
      {
        id: "le-retour",
        short: "Le retour",
        title: "Le retour, quand tout le monde est fatigué",
        paragraphs: [
          `Au retour, ${P} suit l’atterrissage de votre vol et le parking reçoit l’heure réelle. À l’atterrissage, un message vous indique le point de rendez-vous de la navette et ce qu’il faut faire ; dans Ma réservation, vous voyez où en est le retour, et chez les parkings qui la montrent, la navette en direct.`,
          "Les sièges auto que vous avez demandés sont installés aussi au retour : pas besoin de les redemander. Si les bagages se font attendre ou qu’un enfant est malade, prévenez le parking depuis Ma réservation (« Bagage perdu » ou un message libre) : l’équipe adapte la navette.",
          "Une fois au parking, prenez le temps de faire le tour de la voiture avant de repartir. Une rayure découverte à la maison est bien plus difficile à faire reconnaître.",
        ],
      },
      {
        id: "jour-du-depart",
        short: "Le jour du départ, pas à pas",
        title: "Le jour du départ, étape par étape",
        paragraphs: [
          "Avec des enfants, un départ réussi est un départ préparé. Voici l’ordre qui fonctionne le mieux, de la maison au terminal, quand on part avec un parking privé et sa navette.",
        ],
        list: [
          "La veille au soir, relisez le message de rappel du parking : adresse, heure de dépôt, consignes. Vérifiez dans Ma réservation le nombre de passagers et les sièges auto demandés.",
          "Chargez la voiture la veille, en gardant à part un sac pour le trajet : couches, eau, doudou, jeux, papiers d’identité et cartes d’embarquement.",
          "En partant, prévenez le parking depuis Ma réservation (« J’arrive dans 30 minutes ») : le chauffeur prépare les sièges dans la navette.",
          "À l’arrivée, laissez d’abord les enfants dans la voiture, le temps de vous présenter à l’accueil et de savoir où se garer ou à qui laisser les clés.",
          "Faites le tour de la voiture avec l’équipe si le parking fait un état des lieux, puis déchargez les bagages près de la navette.",
          "Installez chaque enfant dans le siège prévu pour son âge, attachez-le, et seulement ensuite chargez les dernières valises.",
          "Au terminal, gardez un adulte avec les enfants pendant que l’autre récupère les bagages de la navette.",
        ],
      },
      {
        id: "choisir",
        short: "Choisir son parking",
        title: "Choisir son parking quand on part en famille",
        paragraphs: [
          "Le moins cher n’est pas toujours le meilleur choix avec des enfants. Une navette courte, un accueil ouvert à votre heure et un voiturier peuvent valoir quelques euros de plus. À l’inverse, pour un séjour de deux semaines, l’écart de prix entre deux parkings se compte vite en dizaines d’euros, et mérite d’être regardé.",
          "Pour comparer, lisez sur chaque fiche la durée de la navette, les horaires d’accueil, la présence d’un voiturier et les conditions d’annulation. Les résultats de la recherche affichent le prix total pour vos dates, que vous partiez à deux ou à six : comparez des prix totaux, jamais des prix par jour.",
        ],
        table: {
          caption: "Les critères d’une famille, et ce qu’ils changent",
          columns: ["Ce que ça change"],
          rows: [
            ["Durée de la navette", "Moins de temps à tenir les enfants assis, moins de stress avant les contrôles"],
            ["Voiturier", "Pas de place à chercher ni de valises à porter jusqu’à l’arrêt"],
            ["Horaires d’accueil", "Indispensables pour un vol très matinal ou un retour tard le soir"],
            ["Annulation gratuite jusqu’au dépôt", "De la souplesse si un enfant tombe malade la veille du départ"],
          ],
          note: `Critères lus sur les fiches et dans les résultats de ${P}.`,
        },
      },
      {
        id: "reserver",
        short: "Réserver sur " + P,
        title: `Réserver un parking en famille sur ${P}`,
        paragraphs: [
          `Saisissez vos dates et vos heures, puis, dans le formulaire de réservation, le nombre de passagers et les sièges auto de chaque enfant. Le prix total affiché est celui de la place ; les sièges sont gratuits. Le paiement se fait en ligne, par carte, au moment de la réservation.`,
          "Chaque parking choisit ses conditions d’annulation parmi quatre formules : gratuite jusqu’à l’heure de dépôt, jusqu’à 24 heures avant, jusqu’à 48 heures avant, ou non remboursable. Avec des enfants, un imprévu de dernière minute arrive : une annulation gratuite jusqu’à l’heure de dépôt laisse le plus de souplesse.",
        ],
      },
    ],
    faq: [
      [
        "Les sièges auto sont-ils fournis dans la navette du parking ?",
        `Oui, sur ${P} : vous les demandez en réservant, dans « Des enfants à bord ? », et le parking les installe dans la navette à l’aller et au retour. Le service est gratuit.`,
      ],
      [
        "Quels sièges auto peut-on demander ?",
        "Un siège bébé dos à la route jusqu’à 12 mois, un siège enfant de 1 à 4 ans et un réhausseur de 4 à 10 ans, jusqu’à quatre de chaque sorte, dans la limite du nombre de passagers.",
      ],
      [
        "Peut-on ajouter un siège auto après avoir réservé ?",
        "Oui, depuis Ma réservation, tant que la réservation est « Attendu », c’est-à-dire jusqu’au dépôt de la voiture. Si vous ajoutez des enfants, le nombre de passagers est mis à jour.",
      ],
      [
        "Le prix change-t-il avec le nombre de passagers ?",
        "Non. Le prix d’un parking privé est celui de la place pour vos dates, quel que soit le nombre de passagers, et les sièges auto ne coûtent rien de plus.",
      ],
      [
        "Les enfants comptent-ils comme passagers ?",
        "Oui. Indiquez chaque enfant, même un bébé porté : le parking organise ses navettes d’après le nombre de passagers, et le nombre de sièges ne peut pas dépasser celui des passagers moins un adulte.",
      ],
      [
        "Où mettre la poussette pendant le trajet en navette ?",
        "Signalez-la dans le message au parking en réservant ou quand vous le prévenez de votre arrivée : l’équipe prévoit la place dans la navette, ou vous conseille de la laisser dans la voiture.",
      ],
      [
        "Le voiturier est-il plus pratique avec des enfants ?",
        "Souvent oui : vous laissez les clés à l’accueil et montez directement dans la navette avec les enfants et les bagages, sans chercher de place ni porter les valises jusqu’à l’arrêt.",
      ],
      [
        "Combien de temps avant le vol arriver au parking avec des enfants ?",
        "L’aéroport recommande d’être au terminal 2 heures avant un vol en France, davantage pour un vol international. Ajoutez la navette, le dépôt, l’installation des enfants et une marge pour l’imprévu.",
      ],
      [
        "Les sièges auto sont-ils aussi installés au retour ?",
        "Oui. Les sièges demandés à la réservation valent pour l’aller et le retour ; vous n’avez rien à redemander. Prévenez simplement le parking si votre retour change.",
      ],
      [
        "Que faire si nos bagages sont perdus au retour ?",
        "Prévenez le parking depuis Ma réservation avec « Bagage perdu » : l’équipe sait que vous serez en retard au point de rendez-vous et adapte la navette.",
      ],
    ],
    partners: {
      filter: "all",
      stayDays: 7,
      title: "Les parkings partenaires pour partir en famille",
      lead: "La liste montre les parkings partenaires qui ont de la place pour la semaine préremplie dans le formulaire, du moins cher au plus cher d’après le prix total ; les sièges auto se demandent ensuite, gratuitement, dans le formulaire de réservation.",
      empty: "Aucun parking partenaire n’est encore réservable en ligne pour ces dates. Revenez bientôt, et consultez en attendant le guide complet du parking à l’aéroport de Lyon Saint-Exupéry pour comparer les parkings officiels.",
    },
  };
}
