// Use-case guide « Voiture électrique » of Lyon Saint-Exupéry (22/11/2026): the airport's chargers (LYON_OFFICIAL, lyonaeroports.com
// read on 09/10/2026), private parkings with a charge (the « Recharge électrique » filter), the paid charge ordered in the Plazo app
// (services additionnels, 21/10/2026: paid online, done before the return, refunded in full when not done), what to ask, the
// battery during a long stay. No price of a partner's charge is quoted: each parking sets its own.
import { LYON_OFFICIAL, offerText, type TopicFacts, type TopicGuide } from "../airport-guides";
import { PRODUCT_NAME } from "../product";
import { topicPath } from "./topics";

export function lyonVoitureElectrique(facts: TopicFacts): TopicGuide {
  const o = LYON_OFFICIAL;
  const c = o.chargers;
  const P = PRODUCT_NAME;
  const ev = facts.ev ?? 0;
  const week = facts.week ? offerText(facts.week) : null;

  const partnersSentence = ev
    ? `${ev === 1 ? "Un de nos parkings partenaires propose" : `${ev} de nos parkings partenaires proposent`} aujourd’hui la recharge électrique : la liste de cette page ne montre qu’eux, et le filtre « Recharge électrique » des résultats fait de même pour vos dates.`
    : "Le filtre « Recharge électrique » des résultats ne garde que les parkings qui proposent la recharge, et chaque fiche le signale dans ses services.";
  const weekSentence = week
    ? `Pour comparer, le moins cher de nos parkings partenaires, toutes options confondues, propose aujourd’hui une semaine ${week} : la recharge, quand elle est commandée, s’ajoute à ce prix.`
    : "Sur la fiche, le prix total affiché est celui de la place ; la recharge, quand elle est commandée, s’ajoute à ce prix.";

  return {
    slug: "parking-voiture-electrique",
    short: "Voiture électrique",
    metaTitle: "Parking aéroport Lyon voiture électrique : bornes et recharge",
    metaDescription: "Voiture électrique à Lyon Saint-Exupéry : bornes de l’aéroport, P4 Elec et P5 Elec, parkings privés qui rechargent pendant le voyage, ce qu’il faut demander.",
    title: "Parking à l’aéroport de Lyon Saint-Exupéry avec une voiture électrique : où recharger pendant le voyage",
    intro: `Laisser une voiture électrique une semaine à l’aéroport soulève deux questions : pourra-t-on la recharger pendant le voyage, et dans quel état sera la batterie au retour ? Ce guide compare les bornes de l’aéroport de Lyon Saint-Exupéry, ses deux parkings entièrement électriques et les parkings privés qui rechargent la voiture pendant votre absence, puis donne les questions à poser et les bons réflexes pour un long séjour. Informations de l’aéroport relevées le ${o.readOn} ; depuis le ${o.t2Closed}, tous les vols partent du Terminal 1.`,
    published: "2026-11-22",
    updated: "2026-11-22",
    sections: [
      {
        id: "trois-solutions",
        short: "Trois solutions",
        title: "Trois façons de recharger pendant le voyage",
        paragraphs: [
          "Autour de l’aéroport, une voiture électrique peut être rechargée de trois façons : sur une borne en libre-service d’un parking de l’aéroport, sur une place réservée d’un parking entièrement électrique de l’aéroport, ou par l’équipe d’un parking privé, qui branche la voiture pendant votre absence. Elles diffèrent surtout par la garantie : une borne en libre-service peut être occupée, une place réservée ne l’est pas.",
        ],
        table: {
          caption: "Recharger une voiture électrique à Lyon Saint-Exupéry",
          columns: ["Bornes en libre-service", "P4 Elec et P5 Elec", "Parking privé avec recharge"],
          rows: [
            ["Où", `P2 (${c.p2}), P4 (${c.p4}), P5 (${c.p5}) et P3`, "Parkings de l’aéroport entièrement électriques", "Terrain du parking, près de l’aéroport"],
            ["Réservation de la borne", "Non : premier arrivé", `Oui, en ligne, ${c.dedicated} bornes dédiées`, "Service demandé au parking"],
            ["Qui branche", "Vous", "Vous", "L’équipe du parking"],
            ["Jusqu’au terminal", "À pied ou navette de l’aéroport", "À pied ou navette de l’aéroport", "Navette du parking"],
          ],
          note: `Bornes et parkings de l’aéroport : lyonaeroports.com, relevé le ${o.readOn}. Parkings privés : services affichés sur leurs fiches.`,
        },
      },
      {
        id: "aeroport",
        short: "Les bornes de l’aéroport",
        title: "Les bornes de l’aéroport et ses parkings 100 % électriques",
        paragraphs: [
          `L’aéroport équipe plusieurs de ses parkings de bornes en libre-service : ${c.p2} au P2, ${c.p4} au P4 et ${c.p5} au P5, ainsi que le P3. Elles ne se réservent pas : réserver une place au P4 ne garantit pas d’y trouver une borne libre, et une voiture déjà chargée peut rester branchée. C’est une bonne solution pour un court séjour, moins pour un long voyage où l’on veut retrouver une batterie pleine.`,
          `Pour une garantie, l’aéroport propose deux parkings entièrement électriques, le P4 Elec et le P5 Elec, qui se réservent en ligne et comptent ${c.dedicated} bornes dédiées. La place réservée est équipée d’une borne : vous branchez la voiture en arrivant. Leurs tarifs et leurs conditions se lisent sur le site de l’aéroport.`,
          `Depuis le P4, on rejoint le Terminal 1 à pied en ${o.walk.p4} ; le P5, plus éloigné, est relié par une navette qui passe ${o.p5Shuttle.every}.`,
        ],
      },
      {
        id: "parkings-prives",
        short: "Les parkings privés qui rechargent",
        title: "Les parkings privés qui rechargent la voiture pendant votre absence",
        paragraphs: [
          "Dans un parking privé, la recharge est un service : l’équipe branche la voiture sur une de ses prises ou bornes, au moment qui l’arrange, et vous la rend chargée. Vous n’avez rien à faire en arrivant, sinon signaler que vous voulez la recharge et laisser le câble si le parking le demande.",
          partnersSentence,
          `Quand le parking la propose comme service sur ${P}, la recharge se commande dans l’application ${P}, avec la réservation ou plus tard, même après avoir déposé la voiture, jusqu’au délai indiqué avant le retour. Elle est payée en ligne, au prix affiché au moment de la commande, et faite par le parking avant votre retour. Si le parking ne peut pas la faire, ou si elle n’est pas faite quand la voiture vous est rendue, elle est remboursée en entier.`,
          weekSentence,
        ],
        parts: [
          {
            title: "Recharge électrique ou recharge hybride",
            paragraphs: [
              "Certains parkings distinguent la recharge d’une voiture électrique et celle d’une hybride rechargeable, dont la batterie est plus petite. Choisissez celle qui correspond à votre voiture : une seule recharge peut être commandée par réservation.",
            ],
          },
        ],
      },
      {
        id: "questions",
        short: "Les questions à poser",
        title: "Les questions à poser avant de réserver",
        paragraphs: [
          `Une recharge pendant le voyage, c’est simple, à condition de savoir ce qui est promis. Avant de réserver, lisez la fiche ; une fois la réservation faite, vous pouvez aussi écrire au parking depuis Ma réservation, dans l’application ${P}. Voici ce qu’il est utile de savoir :`,
        ],
        list: [
          "La voiture sera-t-elle chargée à 100 %, ou jusqu’à un niveau fixé par le parking ?",
          "Faut-il laisser son propre câble, et de quel type ?",
          "Quand la recharge est-elle faite : à l’arrivée, ou juste avant le retour ?",
          "Que se passe-t-il si le vol retour est avancé ou retardé ?",
          "La voiture est-elle garée en extérieur ou à couvert pendant le séjour ?",
        ],
      },
      {
        id: "long-sejour",
        short: "Pendant un long séjour",
        title: "La batterie pendant un long séjour",
        paragraphs: [
          "Une voiture électrique à l’arrêt perd un peu de charge chaque jour, davantage par grand froid ou si certaines fonctions restent actives. Pour un voyage de plusieurs semaines, mieux vaut la laisser avec une charge suffisante plutôt que vide, et consulter la notice du constructeur sur l’immobilisation prolongée.",
          "Désactivez si possible les fonctions qui réveillent la voiture à distance (préchauffage programmé, mode surveillance). Si vous confiez les clés à un voiturier, dites-le-lui : il saura comment la déplacer sans la réveiller inutilement.",
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-longue-duree"), label: "Partir longtemps : le guide du parking longue durée" },
      },
      {
        id: "voiturier-et-cles",
        short: "Clés et voiturier",
        title: "Clés, carte et voiturier",
        paragraphs: [
          "Chez un parking avec voiturier, l’équipe déplace la voiture pour la ranger et la brancher : elle a besoin de la clé, ou de la carte, et parfois de l’application du constructeur pour démarrer. Vérifiez que la clé laissée suffit à démarrer et à charger la voiture, et retirez du véhicule ce dont vous n’avez pas besoin pendant le voyage.",
          `Le parking note où sont rangées vos clés ; dans l’application ${P}, la carte « Ma voiture » garde l’emplacement de la voiture quand il a été noté, pour la retrouver vite au retour.`,
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-voiturier"), label: "Toutes les formules de voiturier à Lyon Saint-Exupéry" },
      },
      {
        id: "selon-la-duree",
        short: "Selon la durée du voyage",
        title: "Quelle solution selon la durée du voyage ?",
        paragraphs: [
          "Pour une journée ou un week-end, une borne en libre-service de l’aéroport peut suffire, à condition d’en trouver une libre : vous rechargez en partie, et vous ne dépendez de personne. Si vous arrivez avec assez de charge pour le trajet du retour, la recharge pendant le voyage n’est qu’un confort.",
          "Pour une semaine ou plus, l’enjeu change : on veut retrouver une batterie pleine, sans chercher de borne au retour. Une place réservée dans un parking entièrement électrique de l’aéroport, ou un parking privé qui recharge la voiture pendant votre absence, donnent cette garantie. Dans le second cas, la voiture est en général rechargée peu avant votre retour, au moment qui convient au parking.",
          "Pour plusieurs semaines, ajoutez la question de la batterie à l’arrêt : une voiture électrique perd un peu de charge chaque jour, et une recharge juste avant le retour évite de retrouver une batterie entamée par le froid.",
        ],
        table: {
          caption: "La recharge selon la durée du voyage",
          columns: ["Ce qui compte", "Solution adaptée"],
          rows: [
            ["Un ou deux jours", "Repartir avec assez d’autonomie", "Borne en libre-service, si elle est libre"],
            ["Une semaine", "Retrouver une batterie pleine", "P4 Elec ou P5 Elec, ou parking privé avec recharge"],
            ["Plusieurs semaines", "Compenser la perte de charge à l’arrêt", "Recharge faite peu avant le retour"],
          ],
          note: `Bornes et parkings de l’aéroport relevés le ${o.readOn} ; services des parkings privés affichés sur leurs fiches.`,
        },
      },
      {
        id: "arriver",
        short: "Arriver avec assez de charge",
        title: "Arriver à l’aéroport avec assez de charge",
        paragraphs: [
          "Partez de chez vous avec une marge : un bouchon sur la rocade, un détour ou un froid vif consomment plus que prévu. Si votre autonomie est juste, rechargez en route plutôt que de compter sur une borne libre à l’aéroport, surtout aux heures de départ chargées.",
          "Pensez aussi au retour : si la voiture n’est pas rechargée pendant le voyage, il faut assez d’autonomie pour rentrer chez vous, ou jusqu’à une borne rapide. Notez avant de partir celles qui se trouvent sur votre route, et vérifiez qu’elles sont compatibles avec votre carte ou votre abonnement.",
          "Enfin, dites au parking que votre voiture est électrique, même si vous ne commandez pas de recharge : l’équipe saura comment la déplacer, et évitera de la garer loin d’une prise si vous changez d’avis pendant le voyage.",
        ],
      },
      {
        id: "au-retour",
        short: "Au retour",
        title: "Au retour : vérifier la charge avant de partir",
        paragraphs: [
          "Quand la voiture vous est rendue, regardez le niveau de charge avant de quitter le parking, comme vous feriez le tour de la carrosserie. Si une recharge commandée n’a pas été faite, dites-le tout de suite à l’équipe : une recharge non faite au moment de la remise est remboursée en entier, et il est plus simple de le constater sur place.",
          `Donnez votre numéro de vol retour en réservant : ${P} suit l’atterrissage, et le parking sait à quelle heure vous arrivez. Une recharge faite peu avant le retour laisse ainsi la batterie au plus haut, et un vol retardé ne vous fait pas retrouver une batterie qui a eu le temps de baisser.`,
          "Enfin, débranchez et rangez votre câble si vous l’aviez laissé : il arrive qu’on l’oublie sur le parking, et un câble de recharge coûte cher à remplacer.",
        ],
      },
      {
        id: "reserver",
        short: "Réserver sur " + P,
        title: `Réserver un parking avec recharge sur ${P}`,
        paragraphs: [
          `Lancez la recherche avec vos dates, puis cochez le filtre « Recharge électrique » : il ne reste que les parkings qui la proposent. Le prix total affiché est celui de la place ; le paiement se fait en ligne, par carte, au moment de la réservation. La recharge, quand le parking la propose comme service, se commande ensuite dans l’application ${P}.`,
          "Chaque parking choisit ses conditions d’annulation parmi quatre formules : gratuite jusqu’à l’heure de dépôt, jusqu’à 24 heures avant, jusqu’à 48 heures avant, ou non remboursable. Une réservation annulée et remboursée l’est avec ses services.",
        ],
      },
    ],
    faq: [
      [
        "Faut-il prévenir le parking que ma voiture est électrique ?",
        "Oui, même sans commander de recharge : l’équipe saura comment la déplacer et la démarrer, et pourra la garer près d’une prise si vous décidez de la faire recharger pendant le voyage.",
      ],
      [
        "Peut-on recharger une voiture électrique à l’aéroport de Lyon Saint-Exupéry ?",
        `Oui : des bornes en libre-service au P2, au P3, au P4 et au P5, et deux parkings entièrement électriques, le P4 Elec et le P5 Elec, réservables en ligne avec ${c.dedicated} bornes dédiées (relevé le ${o.readOn}).`,
      ],
      [
        "Les bornes en libre-service de l’aéroport se réservent-elles ?",
        "Non. Elles sont libres d’accès, au premier arrivé : réserver une place au parking ne garantit pas d’y trouver une borne libre. Pour une borne garantie, l’aéroport propose le P4 Elec et le P5 Elec.",
      ],
      [
        "Un parking privé peut-il recharger ma voiture pendant le voyage ?",
        "Oui, quand il propose ce service. Le filtre « Recharge électrique » des résultats ne garde que ceux-là ; l’équipe branche la voiture pendant votre absence et vous la rend chargée.",
      ],
      [
        `Comment commander la recharge sur ${P} ?`,
        `Quand le parking la propose comme service, dans l’application ${P} : avec la réservation ou plus tard, même après le dépôt, jusqu’au délai indiqué avant le retour. Elle est payée en ligne au prix affiché.`,
      ],
      [
        "Que se passe-t-il si la recharge n’est pas faite ?",
        "Une recharge commandée que le parking ne peut pas faire, ou qui n’est pas faite quand la voiture vous est rendue, est remboursée en entier, automatiquement.",
      ],
      [
        "Faut-il laisser son câble de recharge ?",
        "Cela dépend du parking : certains ont des bornes avec câble, d’autres demandent le vôtre. Posez la question en réservant, et laissez le câble dans le coffre si on vous le demande.",
      ],
      [
        "Ma batterie va-t-elle se vider pendant trois semaines de voyage ?",
        "Une voiture à l’arrêt perd un peu de charge chaque jour, davantage par grand froid. Laissez-la avec une charge suffisante, désactivez les fonctions qui la réveillent à distance et consultez la notice du constructeur.",
      ],
      [
        "Peut-on recharger une hybride rechargeable ?",
        "Oui, chez les parkings qui proposent la recharge hybride, distincte de la recharge électrique. Une seule recharge peut être commandée par réservation : choisissez celle qui correspond à votre voiture.",
      ],
      [
        "La recharge est-elle comprise dans le prix du parking ?",
        "Non. Le prix total affiché est celui de la place pour vos dates ; la recharge, quand elle est commandée comme service, s’y ajoute au prix affiché par le parking au moment de la commande.",
      ],
      [
        "Si j’annule ma réservation, la recharge est-elle remboursée ?",
        "Oui. Une réservation annulée dans le délai d’annulation gratuite et remboursée l’est avec ses services, recharge comprise.",
      ],
    ],
    partners: {
      filter: ev ? "ev_charging" : "all",
      stayDays: 7,
      title: ev ? "Les parkings partenaires avec recharge électrique" : "Les parkings partenaires pour une semaine",
      lead: "La liste montre les parkings partenaires qui ont de la place pour la semaine préremplie dans le formulaire, du moins cher au plus cher d’après le prix total ; pour d’autres dates, indiquez les vôtres et lancez la recherche avec le filtre « Recharge électrique ».",
      empty: "Aucun parking partenaire n’est encore réservable en ligne pour ces dates. Revenez bientôt, et consultez en attendant le guide complet du parking à l’aéroport de Lyon Saint-Exupéry pour comparer les parkings officiels.",
    },
  };
}
