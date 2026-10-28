import { PRODUCT_NAME } from "./product";
import type { ProTopicSlug } from "./site";

const P = PRODUCT_NAME;

/**
 * Plazo Pro's pages by topic (28/10/2026, « Fais la FAQ et les autres », SEO mockups 3A of
 * https://claude.ai/artifact/CgbGFAaeD43sga93Np8hSm): one page per search a parking operator makes, on the home page's
 * template. Like the home page, they say what the parking gains, never how (no technical words), and only true facts:
 * what the product does today, no customer counts, no quotes.
 */
export type ScreenRow = { hour?: string; text: string; pill?: { tone: "ok" | "warn" | "info"; label: string } };
export type ProTopic = {
  slug: ProTopicSlug;
  /** The breadcrumb's last step and the menu's label. */
  label: string;
  metaTitle: string;
  metaDescription: string;
  title: string;
  accent: string;
  lead: string;
  problem: { title: string; paragraphs: string[] };
  gains: { title: string; text: string }[];
  screens: { title: string; rows: ScreenRow[] }[];
  sections: { title: string; paragraphs: string[] }[];
  faq: [string, string][];
  /** The other pages worth reading next (by slug). */
  next: ProTopicSlug[];
};

export const PRO_TOPICS: Record<ProTopicSlug, ProTopic> = {
  navette: {
    slug: "navette",
    label: "Navette",
    metaTitle: `Logiciel de navette pour parking d’aéroport · ${P} Pro`,
    metaDescription: `Gérez la navette de votre parking d’aéroport : qui emmener, qui récupérer, départ au bon moment, retards d’avion, navette en direct pour vos clients.`,
    title: "La navette de votre parking,",
    accent: "à l’heure",
    lead: "Votre chauffeur sait qui emmener, qui aller chercher et quand partir. Vos clients voient la navette arriver et vous préviennent en un geste.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Au retour, le client atterrit et appelle le parking. Le comptoir décroche, cherche la réservation, appelle le chauffeur, qui fait déjà un autre aller. Le client attend sur le trottoir, rappelle, et l’équipe passe la soirée au téléphone plutôt qu’à garer des voitures.",
        "À l’aller, c’est l’inverse : trois clients arrivent en même temps pour des vols différents, le chauffeur ne sait pas s’il doit partir maintenant ou attendre le suivant, et un avion en retard fait partir la navette pour rien. Chacun garde la journée en tête, sur un carnet ou dans un groupe de messages.",
      ],
    },
    gains: [
      { title: "Une liste par sens", text: "Aller et Retour, par créneau de 15 minutes : le chauffeur coche les clients et part, la destination de chacun est écrite sur sa ligne." },
      { title: "Le bon moment pour partir", text: "L’heure de départ conseillée tient compte de l’heure du vol et du temps qu’il faut pour être au terminal." },
      { title: "Les retards d’avion", text: `${P} suit l’heure d’atterrissage réelle : un avion en retard ne fait plus partir la navette trop tôt.` },
      { title: "La navette en direct", text: "Toute l’équipe voit les navettes en route sur la carte. Si vous le choisissez, vos clients aussi, sur leur réservation." },
      { title: "Des clients qui préviennent", text: "« Je suis en route », « J’arrive dans 10 min », « Mon vol a du retard », « Je suis au point de rendez-vous » : le message arrive à l’équipe." },
      { title: "Les sièges auto", text: "Le client indique les sièges dont il a besoin, par âge. Le chauffeur voit ce qu’il faut charger avant de partir." },
    ],
    screens: [
      {
        title: "Aller · 6",
        rows: [
          { hour: "14:30", text: "départ conseillé" },
          { text: "Dupont · 3 pers. · vers Terminal 1", pill: { tone: "ok", label: "Sur place" } },
          { text: "Leroy · 2 pers. · vers Terminal 1", pill: { tone: "warn", label: "Attendu 14:20" } },
          { text: "Partir vers Terminal 1 · 5 pers." },
        ],
      },
      {
        title: "Retour · 3",
        rows: [
          { hour: "22:10", text: "Martin · atterrit vers 22:10", pill: { tone: "warn", label: "Vol en retard" } },
          { hour: "22:25", text: "Petit · au point de rendez-vous", pill: { tone: "ok", label: "Arrivé" } },
          { text: "Aller chercher à l’aéroport · 3 pers." },
        ],
      },
      {
        title: "En route",
        rows: [
          { text: "Karim · Vito blanc · 5 pers. à bord", pill: { tone: "info", label: "En direct" } },
          { text: "Terminal 1 dans 7 min" },
          { text: "Clients déposés · retour au parking" },
        ],
      },
    ],
    sections: [
      {
        title: "Pour le chauffeur : une liste, un bouton",
        paragraphs: [
          `Dans l’application ${P} Pro, le chauffeur ouvre son onglet Navette sur trois listes : Aller (les clients à conduire), Retour (ceux à aller chercher) et En route. Chaque liste est rangée par créneau de 15 minutes, avec l’heure de départ conseillée en tête. Il coche les personnes, ou tout le créneau d’un geste, et le bouton dit où il part : « Partir vers Gare TGV · 6 pers. » ou « Aller chercher à l’aéroport · 3 pers. ».`,
          "Un client qui n’est pas encore pointé à l’accueil peut être embarqué quand même : il passe « Sur place » au départ, et sa voiture reste à placer pour le voiturier, avec ses clés. À la fin du trajet, un geste suffit : « Clients déposés » à l’aller, « Tout le monde est à bord » au retour.",
          "Chaque navette a sa fiche : modèle, couleur, plaque, nombre de places, en service ou non. Le chauffeur choisit son véhicule du jour une fois, et les places limitent le nombre de passagers d’un trajet.",
        ],
      },
      {
        title: "Pour le gérant : la journée prévue d’avance",
        paragraphs: [
          "La page Navettes montre la ligne du jour : les départs prévus, regroupés en vagues de clients qui partent ensemble, pour aujourd’hui, demain et après-demain. Une vague trop grosse pour un seul véhicule est signalée, comme un vol annulé ou retardé.",
          "Vos dessertes sont les vôtres : le terminal, une gare, un hôtel, avec leurs consignes. Chaque réservation porte la sienne, et la navette sait où déposer chacun.",
          "Vous choisissez qui voit la navette en route : personne, l’équipe seulement, ou l’équipe et les clients. Le réglage se change à tout moment.",
        ],
      },
      {
        title: "Pour le client : moins d’attente, moins d’appels",
        paragraphs: [
          "Le jour du dépôt comme au retour, le client retrouve sa réservation en un lien, dans l’application Plazo ou simplement dans son navigateur. Il y voit la navette arriver, l’heure prévue au terminal, le point de rendez-vous et sa photo.",
          "Il prévient l’équipe sans appeler : il est en route, il arrive dans 20 minutes, son vol a du retard, son bagage est perdu. Quand son avion atterrit, il reçoit un message avec le point de rendez-vous. Au comptoir, le téléphone sonne moins.",
        ],
      },
      {
        title: "Ce qui se met en place le premier jour",
        paragraphs: [
          "Vous déclarez vos navettes (places, couleur, plaque) et vos dessertes, puis vos chauffeurs rejoignent votre équipe avec le code du jour du parking, que vous acceptez en un clic. Chacun choisit son poste et son véhicule du jour, et l’onglet Navette est prêt.",
          "Les réservations qui portent un vol retour font le reste : elles remplissent les listes Aller et Retour à l’heure qu’il faut, que la réservation vienne d’un comparateur, du téléphone, du comptoir ou de votre fiche sur Plazo. La veille du dépôt, chaque client reçoit un rappel avec l’heure et le lieu du rendez-vous, à l’heure que vous choisissez.",
          "Rien n’oblige à tout utiliser dès le début : la liste du chauffeur suffit pour commencer, la carte et les messages des clients viennent quand vous le voulez.",
        ],
      },
    ],
    faq: [
      ["Le chauffeur a-t-il besoin d’un ordinateur ?", `Non : tout se fait dans l’application ${P} Pro, sur son téléphone Android, ou sur le web. L’application iPhone est en cours de validation chez Apple.`],
      ["Que se passe-t-il quand un avion a du retard ?", `${P} suit l’heure d’atterrissage réelle du vol retour indiqué sur la réservation. Le retour se décale tout seul dans la liste du chauffeur, et l’équipe voit le retard sur le tableau de bord.`],
      ["Mes clients doivent-ils installer une application ?", "Non. Le lien de leur réservation s’ouvre aussi dans le navigateur. L’application Plazo leur ajoute les notifications."],
      ["Peut-on desservir une gare ou un hôtel ?", "Oui. Vous ajoutez vos dessertes avec leurs consignes, et chaque réservation peut avoir la sienne. Le chauffeur voit la destination de chaque client sur sa ligne."],
      ["Et si je ne veux pas montrer la navette aux clients ?", "Vous réglez le suivi sur « Équipe seulement », ou vous le coupez. Les clients ne voient alors ni la position ni la distance de la navette."],
    ],
    next: ["voiturier", "comparateurs"],
  },
  voiturier: {
    slug: "voiturier",
    label: "Voiturier",
    metaTitle: `Gestion de parking voiturier à l’aéroport · ${P} Pro`,
    metaDescription: `Logiciel de parking voiturier d’aéroport : files rangées par date de retour, clés, plan sur photo aérienne, voiturier au terminal. Démo gratuite.`,
    title: "Chaque voiture rangée",
    accent: "pour repartir",
    lead: "Sur un parking voiturier, la voiture qui part demain ne doit pas être derrière celle qui part dans dix jours. Plazo Pro range chaque voiture pour qu’elle sorte sans en déplacer une autre.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Sur un terrain sans marquage, les voitures sont garées en files, les unes derrière les autres. Tant que chacun range au mieux, tout va bien. Puis un client rentre plus tôt, ou la voiture du matin est au fond de la file : il faut en sortir trois pour atteindre la bonne, pendant que le client attend.",
        "Les clés sont accrochées quelque part, la place est notée sur un papier, et le nouveau voiturier ne sait pas où regarder. Le matin d’un gros jour de retours, l’équipe passe son temps à déplacer des voitures plutôt qu’à les rendre.",
      ],
    },
    gains: [
      { title: "Des files, pas des places", text: "L’unité de rangement est la file. Une voiture entre devant les autres, et une file est saine quand chacune repart avant celles de derrière." },
      { title: "La bonne file à l’arrivée", text: "Plazo Pro propose la file : celle qui sert déjà ce jour de retour, sinon celle où la voiture se glisse sans gêner." },
      { title: "Préparé la veille", text: "Des files vides sont gardées pour les gros jours de retour des deux semaines à venir. Un tiers reste libre." },
      { title: "« À sortir aujourd’hui »", text: "Le matin, la liste des voitures qui repartent, file par file, et celles qu’il faudrait déplacer, s’il y en a." },
      { title: "Les clés", text: "Clés laissées en un clic, ou le numéro du crochet. Au retour, le voiturier sait où les prendre." },
      { title: "Voiturier au terminal", text: "Pour les réservations voiturier, la voiture est prise et rendue au terminal. Les courses attendent un voiturier qui les prend." },
    ],
    screens: [
      {
        title: "Arrivées à placer",
        rows: [
          { text: "AB-123-CD · Dupont · retour 3 nov.", pill: { tone: "ok", label: "Ranger en F07" } },
          { text: "EF-456-GH · Leroy · retour 30 oct.", pill: { tone: "ok", label: "Ranger en F02" } },
          { text: "Pointé à l’embarquement par Karim", pill: { tone: "info", label: "Clés au comptoir" } },
        ],
      },
      {
        title: "File F07 · 6 voitures",
        rows: [
          { hour: "1er", text: "AB-123-CD · retour 3 nov." },
          { hour: "2e", text: "KL-789-MN · retour 5 nov." },
          { hour: "3e", text: "PQ-012-RS · retour 9 nov." },
          { text: "File saine : chacune repart avant celles de derrière", pill: { tone: "ok", label: "OK" } },
        ],
      },
      {
        title: "À sortir aujourd’hui · 9",
        rows: [
          { hour: "08:40", text: "TU-345-VW · F02, 1re", pill: { tone: "ok", label: "Crochet 12" } },
          { hour: "11:15", text: "XY-678-ZA · F05, 2e", pill: { tone: "warn", label: "1 voiture à sortir" } },
          { hour: "21:40", text: "BC-901-DE · F07, 1re", pill: { tone: "info", label: "Vol en retard" } },
        ],
      },
    ],
    sections: [
      {
        title: "Le plan de votre terrain",
        paragraphs: [
          "Votre parking est dessiné sur la photo aérienne, aux dimensions réelles : le contour du terrain, les bâtiments repérés tout seuls, les zones où l’on gare et celles où l’on passe. Plazo Pro vous propose les files d’après la forme du terrain, puis vous les ajustez d’un trait : une file par trait, sa capacité déduite de sa longueur.",
          "Le nombre de voitures que vous pouvez garder vient de ce plan, et c’est lui qui compte partout : réservations, alerte de surréservation, planning. Vous ne vendez pas une place que vous n’avez pas.",
        ],
      },
      {
        title: "À l’arrivée : ranger sans réfléchir",
        paragraphs: [
          "Quand la voiture arrive, le voiturier ouvre « Arrivées à placer » dans l’application. Plazo Pro propose une file d’après la date de retour : d’abord la file qui sert déjà ce jour-là, puis la file où la voiture se range juste derrière une autre qui part plus tard, puis une file vide gardée pour ce jour. Il range, note les clés, et passe à la suivante.",
          "Une voiture rendue, une réservation annulée ou un client qui ne vient pas libèrent leur place tout seuls, et le planning des files montre, jour par jour, les retours, la place qui reste et les files gardées. Un gérant peut garder une file à la main pour un jour précis.",
        ],
      },
      {
        title: "Au retour : rendre la bonne voiture, vite",
        paragraphs: [
          "Le matin, « À sortir aujourd’hui » liste les voitures qui repartent avec leur file, leur rang depuis l’allée et leurs clés. On retrouve n’importe quelle voiture en tapant sa plaque ou le nom du client. Si un vol a du retard, la voiture le dit.",
          "Pour les réservations voiturier au terminal, deux courses sont créées : récupérer la voiture à l’arrivée, la rendre au départ. Un voiturier les prend dans l’onglet Terminal, l’équipe est prévenue 30 minutes avant, et la remise passe la réservation au bon statut. À la remise, l’état des lieux du dépôt est là, photos comprises, pour comparer.",
        ],
      },
      {
        title: "Ce qui se met en place le premier jour",
        paragraphs: [
          "Vous ouvrez le plan, l’adresse de votre parking cale la photo aérienne sur votre terrain, et Plazo Pro prépare un premier plan : contour, bâtiments à éviter, files proposées. Vous corrigez ce qui ne va pas d’un trait ou d’un coup de gomme, et vous annulez un geste comme dans n’importe quel logiciel.",
          "Vos voituriers rejoignent l’équipe avec le code du jour du parking. Le premier matin, ils rangent les arrivées dans les files proposées ; dès le lendemain, les retours sortent sans manœuvre, et la préparation de la nuit garde la place des jours chargés.",
          "Le nombre de voitures que votre plan peut accueillir devient la capacité de votre parking : une réservation de trop est signalée avant qu’elle n’arrive.",
        ],
      },
    ],
    faq: [
      ["Ça marche pour un parking sans marquage au sol ?", "Oui, c’est pour lui que les files existent. Vous tracez vos files sur la photo aérienne, et Plazo Pro range chaque voiture selon sa date de retour."],
      ["Faut-il saisir la place de chaque voiture ?", "Le voiturier accepte la file proposée, ou en choisit une autre. Tout le reste (rang dans la file, voitures à déplacer, retours du jour) se calcule seul."],
      ["Et les clés ?", "En un clic, on note que le client a laissé ses clés, ou le numéro du crochet. La fiche de la voiture le dit jusqu’à sa remise."],
      ["Peut-on aussi rendre la voiture au terminal ?", "Oui : une réservation peut être « Voiturier au terminal ». Les courses d’arrivée et de départ apparaissent aux voituriers, qui les prennent et les terminent dans l’application."],
      ["Mes voituriers ont-ils besoin d’une formation ?", `Chacun choisit son poste du jour et ne voit que ce qu’il a à faire. Un tutoriel s’affiche la première fois, et la démo permet d’essayer avant, sans inscription.`],
    ],
    next: ["navette", "comparateurs"],
  },
  comparateurs: {
    slug: "comparateurs",
    label: "Comparateurs",
    metaTitle: `Réservations Allopark, Onepark, ParkVia au même endroit · ${P} Pro`,
    metaDescription: `Centralisez les réservations de votre parking : Allopark, Onepark, Parclick, ParkMundo, ParkVia et Park Hit arrivent seules dans un planning.`,
    title: "Toutes vos réservations",
    accent: "au même endroit",
    lead: "Allopark, Onepark, Parclick, ParkMundo, ParkVia et Park Hit : vous faites suivre leurs mails à l’adresse de votre parking, et la réservation se crée seule dans votre planning.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Chaque comparateur envoie ses réservations par mail, chacun avec sa mise en page. Quelqu’un les lit, recopie le nom, la plaque, les dates et le vol dans un tableau ou un cahier, puis recommence quand le client modifie ou annule. Une ligne oubliée, et c’est une voiture qu’on n’attendait pas, ou une place vendue deux fois.",
        "À la fin du mois, il faut encore additionner ce que chaque comparateur a vendu et ce qu’il a retenu, pour savoir ce que le parking a vraiment gagné.",
      ],
    },
    gains: [
      { title: "Six comparateurs reconnus", text: "Allopark, Onepark, Parclick, ParkMundo, ParkVia et Park Hit sont lus tels quels, sans ressaisie." },
      { title: "Une adresse pour votre parking", text: "Elle est créée avec votre compte. Vous la donnez à vos comparateurs, ou vous faites suivre leurs mails depuis votre messagerie." },
      { title: "Modifications et annulations", text: "Les modifications d’Allopark et les annulations de ParkVia et d’Onepark sont appliquées seules. Les autres sont signalées." },
      { title: "Pas de doublon", text: "Un mail reçu deux fois, ou le même voyageur déjà saisi au téléphone pour la même arrivée : le mail est rattaché, rien n’est recréé." },
      { title: "Une boîte « À traiter »", text: "Un mail incomplet attend avec ce qui a été compris. Vous le complétez en un clic." },
      { title: "Le chiffre d’affaires net", text: "Le taux de chaque comparateur posé une fois : vous voyez ce que vous gardez, par canal et par jour." },
    ],
    screens: [
      {
        title: "Boîte de réception",
        rows: [
          { hour: "06:12", text: "Allopark · Confirmation AL-884880719", pill: { tone: "ok", label: "Importé" } },
          { hour: "07:40", text: "ParkVia · Annulation PC2610482", pill: { tone: "ok", label: "Annulée" } },
          { hour: "08:05", text: "Onepark · Nouvelle réservation", pill: { tone: "warn", label: "À traiter" } },
        ],
      },
      {
        title: "Planning du mar. 27",
        rows: [
          { hour: "07:10", text: "Bernard · retour 3 nov.", pill: { tone: "info", label: "Onepark" } },
          { hour: "08:00", text: "Leroy · retour 30 oct.", pill: { tone: "info", label: "Park Hit" } },
          { hour: "09:15", text: "Petit · retour 2 nov.", pill: { tone: "ok", label: "Plazo · payé" } },
        ],
      },
      {
        title: "Chiffre d’affaires · octobre",
        rows: [
          { text: "Encaissé par les clients · 6 840 €" },
          { text: "Allopark 18 % · −612 €", pill: { tone: "warn", label: "Commission" } },
          { text: "Vous gardez · 5 988 €", pill: { tone: "ok", label: "Net" } },
        ],
      },
    ],
    sections: [
      {
        title: "Mettre en place en quelques minutes",
        paragraphs: [
          `Votre parking a son adresse de réception dès son inscription sur ${P} Pro. Le plus simple est de la donner à chaque comparateur comme adresse de notification de son espace partenaire. Si vous ne pouvez pas, un assistant vous guide pour créer la règle de transfert dans votre messagerie (Gmail, Outlook et les autres), et coche chaque étape quand le premier mail arrive.`,
          "Les réglages montrent, pour chaque comparateur, le dernier mail reçu et la façon dont il arrive. Un comparateur qui n’a rien envoyé depuis trois jours est signalé dans le mail du matin.",
        ],
      },
      {
        title: "Ce que devient chaque mail",
        paragraphs: [
          "Une réservation complète est créée seule, avec le nom, le téléphone, les dates, la plaque, le vol, le véhicule et le prix payé. Il manque un renseignement ? Le mail attend dans « À traiter », avec ce qui a été compris et le champ qui manque, et vous complétez en un clic. Sans plaque, la réservation est créée quand même : la plaque se note à l’arrivée.",
          "Les modifications d’Allopark sont appliquées à la réservation, champ par champ, avec une ligne par changement (« Date de retour : 13 déc. 20:30 → 15 déc. 18:00 »). Les annulations de ParkVia et d’Onepark annulent la réservation et libèrent sa place. Ce qui est risqué, comme une voiture déjà arrivée, est laissé à l’équipe avec la raison.",
          "Depuis la fiche d’une réservation, vous retrouvez le mail qui l’a créée et ceux qui l’ont modifiée.",
        ],
      },
      {
        title: "Ce que vous gagnez vraiment",
        paragraphs: [
          "Vous posez une fois le taux de commission de chaque comparateur, avec sa date. Le chiffre d’affaires se lit brut ou net : ce que les clients ont payé, ce que chaque comparateur a retenu, et ce que vous gardez. Une réservation sans prix est signalée pour que le total soit juste.",
          `Votre fiche sur ${P} s’ajoute à vos canaux : les clients réservent et paient en ligne, et la réservation arrive dans le même planning que les autres, avec 15 % de commission par réservation payée.`,
        ],
      },
      {
        title: "Ce qui se met en place le premier jour",
        paragraphs: [
          "Vous inscrivez votre parking, l’adresse de réception est déjà là. Vous la donnez à vos comparateurs, ou vous créez la règle de transfert avec l’assistant, et le premier mail qui arrive apparaît dans la boîte de réception avec ce que Plazo Pro en a compris.",
          "Chaque matin, si vous le voulez, un mail vous résume la journée : arrivées et retours, chiffre d’affaires de la veille, mails reçus et importés, et ce qui reste à traiter. Dans la journée, l’équipe reçoit une notification à chaque nouvelle réservation, ou un récapitulatif toutes les heures, au choix de chacun.",
          "Vos anciennes réservations ne se perdent pas : saisissez celles qui restent à venir : un mail de comparateur qui arrive ensuite pour le même voyageur s’y rattache au lieu d’en créer une seconde.",
        ],
      },
    ],
    faq: [
      ["Quels comparateurs Plazo Pro lit-il ?", "Allopark, Onepark, Parclick, ParkMundo, ParkVia et Park Hit. Les autres mails de réservation sont lus aussi, et attendent votre accord quand un renseignement manque."],
      ["Dois-je changer quelque chose chez mes comparateurs ?", "Non, vous gardez vos comptes. Vous donnez l’adresse de votre parking comme adresse de notification, ou vous faites suivre leurs mails depuis votre messagerie."],
      ["Et les réservations prises au téléphone ?", "Elles se saisissent dans le même planning, sur ordinateur ou dans l’application. Si le mail d’un comparateur arrive ensuite pour le même voyageur et la même arrivée, il est rattaché à la réservation au lieu d’en créer une seconde."],
      ["Une annulation est-elle appliquée toute seule ?", "Celles de ParkVia et d’Onepark, oui, tant que la voiture n’est pas arrivée. Les autres arrivent dans « À traiter », marquées « Annulation », et vous l’appliquez vous-même."],
      ["Combien ça coûte ?", "De 79 € à 229 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["navette", "voiturier"],
  },
};

export const PRO_TOPIC_LIST = Object.values(PRO_TOPICS);

/** Every text of a topic page, for the word count and the « no technical words » rule. */
export function proTopicTexts(topic: ProTopic): string[] {
  return [
    topic.title,
    topic.accent,
    topic.lead,
    topic.problem.title,
    ...topic.problem.paragraphs,
    ...topic.gains.flatMap(gain => [gain.title, gain.text]),
    ...topic.screens.flatMap(screen => [screen.title, ...screen.rows.flatMap(row => [row.hour ?? "", row.text, row.pill?.label ?? ""])]),
    ...topic.sections.flatMap(section => [section.title, ...section.paragraphs]),
    ...topic.faq.flat(),
  ];
}

export const wordCount = (texts: string[]) => texts.join(" ").split(/\s+/).filter(word => /[\p{L}\d]/u.test(word)).length;
