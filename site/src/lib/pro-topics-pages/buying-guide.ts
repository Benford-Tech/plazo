import { PRODUCT_NAME } from "../product";
import type { ProTopic } from "../pro-topics";

const P = PRODUCT_NAME;

/**
 * « Choisir un logiciel de parking d'aéroport » (17/11/2026, « Plazo doit ressortir si on tape "logiciel aeroport
 * parking" sur google » → « fais la page guide d'achat »): a buying guide for the broad search, on the topic pages'
 * template. Same rules: true facts only (CLAUDE.md), no competitor named, no technical words; the criteria are worth
 * asking any vendor, and what Plazo Pro does is said as such.
 */
export const BUYING_GUIDE_TOPICS = {
  "choisir-logiciel-parking-aeroport": {
    slug: "choisir-logiciel-parking-aeroport",
    updated: "2026-11-17",
    label: "Guide d’achat",
    metaTitle: `Logiciel de parking d’aéroport : bien le choisir · ${P} Pro`,
    metaDescription: `Comment choisir un logiciel pour votre parking d’aéroport : comparateurs, navette, voiturier, plan, contrat, prix. Les questions à poser avant de signer.`,
    title: "Choisir un logiciel de parking",
    accent: "d’aéroport",
    lead: "Navette, voituriers, comparateurs, clés, retards d’avion : un parking d’aéroport n’est pas un parking de centre-ville. Voici ce qu’un logiciel doit savoir faire pour vous, et les questions à poser avant de signer.",
    problem: {
      title: "Pourquoi un logiciel de parking ordinaire ne suffit pas",
      paragraphs: [
        "La plupart des logiciels de parking sont faits pour des barrières, des tickets et des abonnements : une voiture entre, paie et ressort. Un parking d’aéroport fonctionne autrement. Le client réserve des semaines à l’avance, souvent sur un comparateur, dépose sa voiture, part en navette vers le terminal, puis revient à une heure qui dépend de son avion. Entre les deux, quelqu’un a garé la voiture, rangé les clés et doit la retrouver vite.",
        "Le métier tient donc en trois moments : recevoir les réservations de partout, accueillir et conduire le client au départ, le récupérer et lui rendre sa voiture au retour. Un bon logiciel de parking d’aéroport couvre ces trois moments, pour tous les membres de l’équipe, et pas seulement la caisse.",
      ],
    },
    gains: [
      { title: "Les réservations de tous vos canaux", text: "Comparateurs, téléphone, comptoir, votre site : tout doit arriver dans un seul planning, sans ressaisie." },
      { title: "La capacité réelle", text: "Le logiciel doit compter vos vraies places, nuit par nuit, et prévenir avant qu’une nuit ne soit vendue deux fois." },
      { title: "La navette et le retour", text: "Qui emmener, qui aller chercher, quand partir, et l’heure réelle d’atterrissage de chaque avion." },
      { title: "Le parking lui-même", text: "Où est chaque voiture, où sont ses clés, et dans quel ordre ranger les voitures pour ne pas les déplacer." },
      { title: "Le contrat et l’état des lieux", text: "Une signature au comptoir et des photos au dépôt puis au retour, gardées avec la réservation." },
      { title: "Ce que vous gagnez vraiment", text: "Le chiffre d’affaires par canal, et ce que chaque comparateur retient en commission." },
    ],
    screens: [
      {
        title: "Les questions à poser",
        rows: [
          { text: "Les mails de mes comparateurs deviennent-ils des réservations ?", pill: { tone: "ok", label: "Réservations" } },
          { text: "Le chauffeur a-t-il sa liste sur son téléphone ?", pill: { tone: "ok", label: "Navette" } },
          { text: "Le planning suit-il les retards d’avion ?", pill: { tone: "info", label: "Retour" } },
          { text: "Retrouve-t-on une voiture et ses clés en quelques secondes ?", pill: { tone: "info", label: "Parking" } },
        ],
      },
      {
        title: "Avant de signer",
        rows: [
          { text: "Puis-je reprendre mon fichier actuel ?", pill: { tone: "ok", label: "Démarrage" } },
          { text: "Quel est le prix tout compris, mise en route comprise ?", pill: { tone: "warn", label: "Prix" } },
          { text: "Puis-je essayer avant, avec mon équipe ?", pill: { tone: "ok", label: "Démo" } },
          { text: "Mes données restent-elles à moi ?", pill: { tone: "info", label: "Données" } },
        ],
      },
    ],
    sections: [
      {
        title: "1. Les réservations : tout au même endroit",
        paragraphs: [
          "Un parking d’aéroport reçoit ses réservations par plusieurs canaux : les comparateurs, le téléphone, le comptoir et parfois son propre site. Si chaque canal vit dans sa boîte mail ou son cahier, quelqu’un passe ses journées à recopier le nom, la plaque, les dates et le vol, avec le risque d’une ligne oubliée ou d’une date mal tapée.",
          "Demandez d’abord comment les réservations des comparateurs arrivent dans le logiciel. Le mieux est qu’elles se créent seules à partir des mails que vous recevez déjà, sans que vous changiez vos comptes chez eux. Demandez aussi ce qui se passe quand un mail est incomplet, quand le comparateur modifie les dates ou annule : la réservation doit suivre, ou au moins vous prévenir.",
          `Dans ${P} Pro, les mails d’Allopark, Onepark, Parclick, ParkMundo, ParkVia et Park Hit deviennent des réservations dans le planning. Un mail incomplet attend dans « À traiter » avec ce qui a été compris ; les modifications d’Allopark et les annulations de ParkVia et d’Onepark sont appliquées à la réservation. Les réservations du téléphone et du comptoir se saisissent dans le même planning.`,
        ],
      },
      {
        title: "2. La capacité : ne jamais vendre une place deux fois",
        paragraphs: [
          "La surréservation coûte cher : un client qui arrive pour une place qui n’existe pas, c’est une soirée de stress et souvent un mauvais avis. Un logiciel doit compter, nuit par nuit, les voitures attendues face au nombre réel de places, et vous prévenir avant que la nuit ne soit pleine.",
          "Posez une question précise : d’où vient le nombre de places ? Un chiffre tapé une fois dans les réglages vieillit vite. Il est plus juste quand il vient du plan du parking lui-même, et quand les voitures rendues en avance ou restées après leur date sont comptées comme elles le sont vraiment.",
          `${P} Pro compte les places du plan de votre parking (ou de vos files de voiturier), signale une nuit complète, et propose un prévisionnel sur une semaine, un mois ou trois mois : arrivées, départs et voitures garées chaque nuit.`,
        ],
      },
      {
        title: "3. La navette : le bon client au bon moment",
        paragraphs: [
          "La navette est le cœur du métier, et c’est là que l’équipe perd le plus de temps au téléphone. À l’aller, le chauffeur doit savoir qui emmener et quand partir. Au retour, le client atterrit, appelle, et attend parfois longtemps sur le trottoir.",
          "Vérifiez que le chauffeur a sa propre liste sur son téléphone, triée par heure, et qu’il peut partir en quelques gestes. Vérifiez surtout que le logiciel connaît l’heure réelle d’atterrissage des avions : un vol en retard ne doit pas faire partir la navette pour rien. Enfin, demandez si vos clients peuvent prévenir de leur arrivée et voir la navette approcher : c’est autant d’appels en moins.",
          `Dans ${P} Pro, le chauffeur a deux listes, Aller et Retour, par créneau de 15 minutes, avec la destination de chaque client. L’heure d’atterrissage réelle est suivie, l’équipe voit les navettes en route sur une carte et, si vous le choisissez, vos clients aussi. Ils peuvent dire « Je suis en route » ou « Mon vol a du retard » depuis leur réservation.`,
        ],
      },
      {
        title: "4. Le parking : chaque voiture à sa place, avec ses clés",
        paragraphs: [
          "Avec des voituriers, les voitures sont souvent garées en files, l’une derrière l’autre. Une voiture qui repart demain, coincée derrière une voiture qui repart dans deux semaines, c’est un quart d’heure perdu à déplacer des voitures pendant que le client attend.",
          "Demandez si le logiciel connaît le plan de votre parking, s’il propose où ranger chaque voiture selon sa date de retour, et s’il note où sont les clés. Le jour du retour, l’équipe doit retrouver une voiture et ses clés en quelques secondes, par la plaque ou le nom.",
          `${P} Pro dessine le plan de votre parking sur la photo aérienne, place chaque voiture dans une file selon son jour de retour pour qu’aucune ne soit bloquée, et note le crochet des clés. La recherche par plaque, nom ou numéro de réservation est sur ordinateur comme sur téléphone.`,
        ],
      },
      {
        title: "5. Le contrat et l’état des lieux : se protéger en cas de litige",
        paragraphs: [
          "Une rayure découverte au retour, et c’est la parole du client contre celle du parking. Un logiciel utile garde la preuve : un contrat signé par le client avant de remettre ses clés, et des photos de la voiture au dépôt puis au retour.",
          "Vérifiez que la signature se fait simplement au comptoir, que vous pouvez utiliser votre propre contrat, et que les photos sont rangées avec la réservation. Au retour, l’équipe doit pouvoir comparer les deux états côte à côte.",
          `Dans ${P} Pro, le client signe sur le téléphone du parking, votre contrat en PDF ou le modèle proposé, et reçoit sa copie par e-mail. L’état des lieux se fait en quatre photos guidées, avec les dégâts notés sur la silhouette de la voiture, et le retour se compare au dépôt.`,
        ],
      },
      {
        title: "6. Le chiffre : ce que vous gardez vraiment",
        paragraphs: [
          "Un comparateur apporte des clients, mais il retient une commission. Sans la compter, il est difficile de savoir quel canal vous rapporte vraiment. Demandez si le logiciel montre le chiffre d’affaires par canal, brut et net de commissions, et s’il signale les réservations sans prix.",
          `${P} Pro calcule le chiffre d’affaires par jour, par mois et par canal, net de la commission de chaque comparateur à partir du taux que vous posez, et l’exporte pour votre comptable. Une facture au nom de votre parking se crée depuis la réservation.`,
        ],
      },
      {
        title: "7. Le prix et la mise en route",
        paragraphs: [
          "Comparez le prix tout compris : l’abonnement, mais aussi la mise en route, les options et ce qui est facturé à la réservation. Demandez si vous pouvez reprendre votre fichier actuel, combien de temps prend le démarrage et si l’équipe peut essayer avant de s’engager.",
          `${P} Pro coûte de 149 € à 399 € HT par mois et par parking selon la formule, 10 % de moins à l’année. La mise en route sur place (plan du parking, transfert des mails des comparateurs, formation de l’équipe) est une option à 290 € HT, une fois. Votre fichier Excel ou CSV se reprend avec « Importer », et la démo est gratuite, sans inscription, avec un rôle au choix : gérant, accueil, chauffeur ou voiturier.`,
        ],
      },
    ],
    faq: [
      ["Qu’est-ce qu’un logiciel de parking d’aéroport ?", "Un logiciel qui gère tout le séjour d’une voiture dans un parking proche d’un aéroport : la réservation, l’accueil, la navette vers le terminal, la place et les clés, le retour du client et la remise de la voiture."],
      ["Quelle différence avec un logiciel de parking classique ?", "Un logiciel de parking classique gère des barrières, des tickets et des abonnements. Un parking d’aéroport a besoin en plus des réservations des comparateurs, de la navette, des retards d’avion et souvent des voituriers."],
      ["Faut-il changer mes comptes chez les comparateurs ?", `Non. Avec ${P} Pro, vous gardez vos comptes : les mails que vous recevez déjà deviennent des réservations dans le planning.`],
      ["Le logiciel fonctionne-t-il sur téléphone ?", `Oui. ${P} Pro s’utilise sur ordinateur et dans une application pour l’équipe : chaque membre voit ce qui le concerne selon son poste du jour, gérant, accueil, chauffeur ou voiturier.`],
      ["Combien coûte un logiciel de parking d’aéroport ?", `Les prix varient selon les éditeurs : demandez toujours le prix tout compris. ${P} Pro coûte de 149 € à 399 € HT par mois et par parking, −10 % à l’année.`],
      ["Puis-je essayer avant de choisir ?", `Oui : la démo de ${P} Pro est gratuite et sans inscription. Vous parcourez un parking fictif, remis à zéro chaque nuit.`],
    ],
    next: ["logiciel-ou-excel", "comparateurs", "navette"],
  },
} satisfies Record<string, ProTopic>;
