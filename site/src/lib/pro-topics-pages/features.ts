import { PRODUCT_NAME } from "../product";
import type { ProTopic } from "../pro-topics";

const P = PRODUCT_NAME;

/**
 * One page per feature (17/11/2026, « ameliore le SEO plazo pro »), on the template of the three first topic pages:
 * what the parking gains, never how (no technical words), and only facts that hold today.
 */
export const FEATURE_TOPICS = {
  "contrat-etat-des-lieux": {
    slug: "contrat-etat-des-lieux",
    updated: "2026-11-17",
    label: "Contrat et état des lieux",
    metaTitle: `Contrat de stationnement et état des lieux · ${P} Pro`,
    metaDescription: `Faites signer le contrat de votre parking d’aéroport au comptoir ou dans l’app du client, photos du dépôt et du retour côte à côte. Démo gratuite.`,
    title: "Un contrat signé,",
    accent: "des photos qui comptent",
    lead: "Le client signe votre contrat au comptoir ou depuis son téléphone. Au dépôt comme au retour, l’état de la voiture est photographié, et une rayure ne se discute plus.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Le contrat est une feuille imprimée que le client signe sur le comptoir, quand il a le temps. On la range dans un classeur, et le jour où un client conteste quelque chose, il faut la retrouver, si elle existe. Les dates, la plaque et le prix sont recopiés à la main, avec les erreurs qui vont avec.",
        "Au retour, un client montre une rayure sur sa portière. Était-elle là au dépôt ? Personne ne s’en souvient, les photos prises au téléphone d’un employé sont introuvables, et le parking finit souvent par payer pour avoir la paix.",
      ],
    },
    gains: [
      { title: "Votre contrat, pas un modèle", text: "Vous déposez le PDF de votre parking. Sans lui, un contrat de stationnement prêt à l’emploi est proposé." },
      { title: "Déjà rempli", text: "Nom, téléphone, plaque, véhicule, dates, prix, vol et date de signature s’écrivent seuls aux endroits que vous avez choisis." },
      { title: "Signé au comptoir ou chez lui", text: "Au comptoir, par un code reçu sur le mobile du client ou une signature au doigt ; ou avant d’arriver, dans son application Plazo." },
      { title: "Quatre photos guidées", text: "Avant, droite, arrière, gauche, puis les gros plans des dégâts posés sur la silhouette de la voiture." },
      { title: "Dépôt et retour côte à côte", text: "Au retour, chaque côté est comparé à celui du dépôt, et un dégât est marqué « Déjà au dépôt » ou « Nouveau »." },
      { title: "Un registre des contrats", text: "Tous les contrats signés, classés par mois et par année, avec le PDF signé et la preuve de signature." },
    ],
    screens: [
      {
        title: "Contrat · Dupont",
        rows: [
          { text: "Contrat du parking · version 3 · 4 pages" },
          { text: "Pré-rempli : 9 informations placées", pill: { tone: "ok", label: "Prêt" } },
          { text: "Code envoyé au 06 •• •• •• 78", pill: { tone: "info", label: "En attente" } },
          { hour: "09:47", text: "Signé par Jean Dupont", pill: { tone: "ok", label: "Signé" } },
        ],
      },
      {
        title: "État des lieux · retour",
        rows: [
          { text: "Avant · droite · arrière · gauche", pill: { tone: "ok", label: "4 photos" } },
          { text: "Dégât 1 · portière avant droite", pill: { tone: "info", label: "Déjà au dépôt" } },
          { text: "Dégât 2 · pare-chocs arrière", pill: { tone: "warn", label: "Nouveau" } },
          { text: "Carburant · 3/4 au dépôt, 1/2 au retour" },
        ],
      },
      {
        title: "Contrats · Novembre 2026 · 14",
        rows: [
          { hour: "12/11", text: "Leroy · AB-123-CD · PDF v3", pill: { tone: "ok", label: "Signé" } },
          { hour: "10/11", text: "Martin · EF-456-GH · PDF v3", pill: { tone: "warn", label: "Avec réserve" } },
          { text: "PDF signé · Preuve · Contrat du parking" },
        ],
      },
    ],
    sections: [
      {
        title: "Le contrat de votre parking, rempli tout seul",
        paragraphs: [
          `Dans les réglages du parking, vous déposez votre contrat de stationnement en PDF. ${P} Pro le garde tel quel, version après version : quand vous le remplacez, les contrats déjà signés restent liés à la version que le client a lue. Si vous n’avez pas encore de contrat, un modèle est proposé, et vous passez au vôtre quand vous voulez.`,
          "Une seule fois par version, vous placez sur les pages de votre PDF les informations à remplir : le nom du client, son téléphone, la plaque, le véhicule, les dates d’arrivée et de retour, le prix, le numéro de réservation, le vol ou le train, le kilométrage au dépôt, la date et la signature. Vous les glissez sur la page, vous ajustez la taille du texte, et un aperçu avec un exemple montre le résultat.",
          "Ensuite, chaque contrat sort déjà rempli avec la réservation. Le client lit un document à son nom, avec ses dates et son prix, et personne ne recopie plus rien.",
        ],
      },
      {
        title: "La signature : au comptoir ou depuis le téléphone du client",
        paragraphs: [
          `Au comptoir, sur le téléphone du parking, le client signe de deux façons : avec un code à 6 chiffres qu’il reçoit par message sur son mobile, ou par une signature à la main, au doigt. Le contrat se signe une fois, du séjour à venir jusqu’au dépôt de la voiture.`,
          "Le client peut aussi signer avant d’arriver, depuis sa réservation dans l’application Plazo : il ouvre le contrat, coche « J’ai lu et j’accepte », saisit le code reçu sur son mobile et signe au doigt. L’équipe est prévenue dès que c’est fait, et une icône « contrat signé » s’affiche à côté de son nom sur le planning et dans la liste des réservations.",
          "Une copie du contrat signé part au client par e-mail. Le parking garde le PDF signé et une preuve de signature, qui dit qui a signé, comment, à quelle heure, et devant quel membre de l’équipe.",
        ],
      },
      {
        title: "L’état des lieux, au dépôt puis au retour",
        paragraphs: [
          `Dans l’application ${P} Pro, l’équipe photographie la voiture en quatre prises guidées : l’avant, le côté droit, l’arrière et le côté gauche. Un dégât se touche sur la silhouette de la voiture, il est numéroté, et jusqu’à 12 gros plans peuvent l’accompagner. On ajoute le niveau de carburant, le kilométrage si on le veut et une remarque, puis « Terminer » verrouille l’état des lieux.`,
          "Le client répond « conforme » ou écrit une réserve avec ses mots, sur le téléphone du parking ou dans son application. Un état des lieux du dépôt resté sans réponse vaut accord quand le client part en navette. Le client peut aussi envoyer ses propres photos au dépôt et au retour : l’équipe les voit en tête de l’état des lieux.",
          "Au retour, les photos du dépôt et du retour s’affichent côte à côte, côté par côté. Chaque dégât est marqué « Déjà au dépôt » ou « Nouveau », et l’écart de kilométrage et de carburant est calculé. La discussion se règle en regardant deux photos.",
        ],
      },
      {
        title: "Le registre : retrouver n’importe quel contrat",
        paragraphs: [
          "La page Contrats réunit tous les contrats signés, classés par année et par mois. On cherche un client, une plaque ou une réservation, on filtre ceux qui portent une réserve, et chaque ligne donne le PDF signé, la preuve de signature et la version du contrat du parking. Un export en tableur prend la liste en cours.",
          "Les contrats des séjours terminés s’archivent d’un clic, un par un ou tous ceux d’avant une date, sans rien effacer. Sur ordinateur, la fiche d’une réservation montre le contrat signé, les photos en grand et la réponse du client. Les photos sont gardées 90 jours après le retour, un an quand le client a fait une réserve.",
        ],
      },
    ],
    faq: [
      ["Le client doit-il installer une application pour signer ?", "Non. Au comptoir, il signe sur le téléphone du parking, avec le code reçu sur son mobile ou au doigt. L’application Plazo lui permet en plus de signer avant d’arriver."],
      ["Puis-je utiliser mon propre contrat ?", "Oui. Vous déposez le PDF de votre parking, vous placez une fois les informations à remplir, et chaque contrat sort pré-rempli avec la réservation. Un nouveau dépôt crée une nouvelle version."],
      ["Les photos sont-elles obligatoires ?", "Non. Les quatre photos guidées et le kilométrage sont facultatifs ; seul le niveau de carburant est demandé pour terminer l’état des lieux."],
      ["Comment prouver qu’un dégât était déjà là ?", "Au retour, les photos du dépôt et du retour s’affichent côte à côte, et chaque dégât est marqué « Déjà au dépôt » ou « Nouveau ». L’état des lieux du dépôt est verrouillé, avec la réponse du client."],
      ["Mon équipe peut-elle le faire sur téléphone ?", `Oui, contrat et état des lieux se font dans l’application ${P} Pro, sur Android ou sur le web. L’application iPhone est en cours de validation chez Apple.`],
      ["Combien ça coûte ?", "De 149 € à 399 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["voiturier", "plan-du-parking", "logiciel-ou-excel"],
  },
  "planning-reservations": {
    slug: "planning-reservations",
    updated: "2026-11-17",
    label: "Planning des réservations",
    metaTitle: `Planning des réservations de parking d’aéroport · ${P} Pro`,
    metaDescription: `Le planning de votre parking d’aéroport : arrivées et départs du jour, retards, prévisionnel à 3 mois, import Excel et chiffre d’affaires net.`,
    title: "Votre journée,",
    accent: "dans le bon ordre",
    lead: "Toutes vos réservations dans un seul planning : la prochaine arrivée, le prochain départ, les retards, et les trois mois qui viennent d’un coup d’œil.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Les réservations vivent dans un tableau, un cahier et les boîtes mail des comparateurs. Le matin, quelqu’un recopie la journée sur une feuille, et la feuille est fausse dès la première modification. Un client arrive, on cherche son nom dans trois endroits.",
        "Pour savoir si le parking est plein dans quinze jours, il faut compter à la main les voitures déjà là, celles qui arrivent et celles qui repartent. Et à la fin du mois, personne ne sait vraiment ce que le parking a gagné une fois les commissions retirées.",
      ],
    },
    gains: [
      { title: "Le prochain, toujours en tête", text: "Deux cartes, « Prochaine arrivée » et « Prochain départ », passent seules au suivant au fil de la journée." },
      { title: "Les retards repérés", text: "Une arrivée ou un départ pas fait une minute après son heure rejoint l’encart « En retard », avec depuis combien de temps." },
      { title: "Trois mois devant vous", text: "Le prévisionnel montre, jour par jour, les arrivées, les départs et les voitures garées la nuit, sur une semaine, un mois ou trois." },
      { title: "Votre ancien fichier repris", text: "Un fichier Excel ou un tableau importé en une fois, avec un aperçu de chaque ligne avant de valider." },
      { title: "Aucune réservation sans prix", text: "Celles qui n’ont pas de montant sont surlignées, et le prix se saisit sur la ligne." },
      { title: "Ce que vous gardez", text: "Le chiffre d’affaires brut ou net de commissions, par canal, jour par jour et mois par mois." },
    ],
    screens: [
      {
        title: "Planning · jeudi 12",
        rows: [
          { hour: "11:15", text: "Prochaine arrivée · S. Morel · dans 25 min", pill: { tone: "ok", label: "Arrivée" } },
          { hour: "11:40", text: "Prochain départ · I. Garcia · à l’aéroport", pill: { tone: "info", label: "Départ" } },
          { hour: "10:20", text: "Bernard · arrivée prévue", pill: { tone: "warn", label: "En retard · 34 min" } },
          { text: "Déjà passés · 8" },
        ],
      },
      {
        title: "Prévisionnel · Novembre",
        rows: [
          { hour: "sam. 7", text: "↑ 14 · ↓ 9 · 76 voitures la nuit", pill: { tone: "warn", label: "Complet" } },
          { hour: "dim. 8", text: "↑ 6 · ↓ 18 · 64 voitures la nuit" },
          { hour: "lun. 9", text: "↑ 11 · ↓ 7 · 68 voitures la nuit", pill: { tone: "ok", label: "Place libre" } },
        ],
      },
      {
        title: "Chiffre d’affaires · octobre",
        rows: [
          { text: "142 réservations · panier moyen 48 €" },
          { text: "Commissions des comparateurs", pill: { tone: "warn", label: "Retenues" } },
          { text: "3 réservations sans prix", pill: { tone: "info", label: "À compléter" } },
        ],
      },
    ],
    sections: [
      {
        title: "Le planning du jour avance avec vous",
        paragraphs: [
          "Le planning du jour sépare les arrivées et les départs, chacun dans sa couleur. En tête, deux cartes donnent la prochaine arrivée et le prochain départ : l’heure, le client, « dans 25 min » ou « maintenant ». Elles passent seules au suivant dès qu’un client est venu ou qu’une voiture est rendue, et ce qui est fait se replie sous « Déjà passés ».",
          "Sous chaque carte, l’encart « En retard » liste ce qui aurait dû se passer et ne s’est pas passé, avec le nombre de minutes. Quand le vol est connu, la ligne le dit : « décolle 16:35 · Lisbonne » pour une arrivée, « atterri 14:12 · de Porto » pour un départ, et la destination de la navette.",
          "Un clic sur une ligne ouvre la réservation : téléphone, plaque, vol, place et clés, et un seul bouton pour la prochaine étape. Les dates en tête du planning ouvrent le calendrier, et chaque nuit de la bande d’occupation affiche son nombre de voitures face à vos places.",
        ],
      },
      {
        title: "Le prévisionnel : une semaine, un mois ou trois",
        paragraphs: [
          "Le prévisionnel affiche une semaine, un mois ou trois mois en calendrier, du lundi au dimanche. Chaque jour porte ses arrivées, ses départs et le nombre de voitures garées la nuit, avec une jauge qui passe à l’ambre au-dessus de 85 % et au rouge quand le parking est complet. Un clic sur un jour ouvre son planning.",
          "Les chiffres viennent de vos réservations enregistrées, tous canaux confondus, et de l’état réel du parking : une voiture rendue en avance n’est plus comptée, une voiture encore là après sa date de retour l’est jusqu’au soir. Rien n’est inventé, et la capacité est celle de votre plan. Une réservation de trop est signalée avant d’arriver.",
        ],
      },
      {
        title: "Saisir au téléphone, importer un fichier",
        paragraphs: [
          "Une réservation prise au téléphone ou au comptoir se saisit en une page, sur ordinateur ou dans l’application : dates, client, voiture, vol, passagers, canal, prix et moyen de paiement. La plaque et le vol retour sont facultatifs. Une réservation prise en direct, sans intermédiaire, est marquée d’une poignée de main, pour voir ce que rapportent vos ventes sans commission.",
          "Vos anciennes réservations et celles déjà prévues arrivent d’un fichier Excel ou d’un tableau. Les colonnes sont reconnues par leur titre et se corrigent sur place. Chaque ligne est montrée avant d’importer : à créer, à vérifier, déjà présente ou en erreur, avec la raison. Un import se retire à tout moment : les réservations que personne n’a touchées depuis repartent.",
          "Les réservations des comparateurs arrivent seules dans le même planning, comme celles de votre fiche sur Plazo. On retrouve n’importe laquelle par le nom du client, sans se soucier des accents, ou par le numéro du comparateur.",
        ],
      },
      {
        title: "Un chiffre d’affaires juste, net de commissions",
        paragraphs: [
          "Une réservation sans prix fausse le total : elle est surlignée dans la liste avec « + Prix à saisir », filtrée d’un clic, et rappelée sur le tableau de bord. Le prix se corrige après coup, sauf pour une réservation payée en ligne sur Plazo.",
          "La page Chiffre d’affaires additionne vos réservations par jour d’arrivée ou par jour de réservation : total, panier moyen, durée moyenne, répartition par canal et par moyen de paiement, et les douze derniers mois en barres. Vous posez une fois le taux de commission de chaque comparateur, avec sa date de départ, et le chiffre se lit brut ou net : ce que les clients ont payé, ce que chaque comparateur a retenu, ce que vous gardez. Un export en tableur suit.",
        ],
      },
    ],
    faq: [
      ["Puis-je reprendre les réservations de mon fichier actuel ?", "Oui. Vous importez un fichier Excel ou un tableau, les colonnes sont reconnues par leur titre, et chaque ligne est montrée avant de valider. Un import se retire à tout moment."],
      ["Le planning tient-il compte des réservations des comparateurs ?", "Oui. Les réservations des comparateurs, du téléphone, du comptoir et de votre fiche sur Plazo arrivent dans le même planning et le même prévisionnel."],
      ["Jusqu’où voit-on à l’avance ?", "Le prévisionnel s’affiche sur une semaine, un mois ou trois mois, et on avance période par période aussi loin que nécessaire."],
      ["Comment savoir ce que le parking a vraiment gagné ?", "Vous posez le taux de commission de chaque comparateur une fois. Le chiffre d’affaires se lit alors net : ce que les clients ont payé moins ce que chaque comparateur a retenu."],
      ["Le planning est-il sur téléphone ?", `Oui, dans l’application ${P} Pro sur Android et sur le web. L’application iPhone est en cours de validation chez Apple.`],
      ["Combien ça coûte ?", "De 149 € à 399 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["comparateurs", "logiciel-ou-excel", "navette"],
  },
  "plan-du-parking": {
    slug: "plan-du-parking",
    updated: "2026-11-17",
    label: "Plan du parking",
    metaTitle: `Plan de parking et gestion des clés · ${P} Pro`,
    metaDescription: `Dessinez votre parking d’aéroport sur la photo aérienne, rangez les voitures en files selon leur retour, notez les clés et retrouvez chaque voiture.`,
    title: "Votre parking sur un plan,",
    accent: "chaque clé à sa place",
    lead: "Votre terrain dessiné sur la photo aérienne, les voitures rangées selon leur date de retour, et les clés notées en un clic. N’importe qui retrouve une voiture en quelques secondes.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Combien de voitures tient vraiment le terrain ? On répond de tête, et le chiffre déclaré n’est pas celui du terrain : un jour chargé, on vend une place qu’on n’a pas. Sur un sol sans marquage, chacun range au mieux, et la voiture qui repart demain finit derrière celle qui part dans dix jours.",
        "Les clés sont sur un tableau, la place est notée sur un papier ou dans la tête du voiturier du matin. Quand il n’est pas là, retrouver une voiture veut dire faire le tour du parking.",
      ],
    },
    gains: [
      { title: "Le terrain aux vraies dimensions", text: "Votre parking dessiné sur la photo aérienne : contour, bâtiments repérés seuls, zones de parking et de passage." },
      { title: "Une capacité qui compte partout", text: "Le nombre de places de votre plan sert aux réservations, au planning et à l’alerte de surréservation." },
      { title: "Des files rangées par retour", text: "Chaque voiture va dans la file où elle repartira sans en déplacer une autre." },
      { title: "La veille, la place des gros jours", text: "Des files vides sont gardées pour les grosses journées de retour des deux semaines à venir." },
      { title: "Les clés en un clic", text: "« Clés laissées » ou le numéro du crochet, qui suit la place de la voiture." },
      { title: "Retrouver une voiture", text: "La plaque, le nom ou la référence suffisent : la place, la file, le rang et le crochet s’affichent." },
    ],
    screens: [
      {
        title: "Plan · Contour · Files · Repères",
        rows: [
          { text: "Capacité utilisée partout : 120 places", pill: { tone: "ok", label: "Plan" } },
          { text: "10 files · F01 à F10 · 12 voitures chacune" },
          { text: "2 bâtiments exclus", pill: { tone: "info", label: "Repérés" } },
        ],
      },
      {
        title: "Arrivées à placer · 3",
        rows: [
          { text: "AB-123-CD · Dupont · retour 3 nov.", pill: { tone: "ok", label: "Ranger en F07" } },
          { text: "EF-456-GH · Leroy · retour 30 oct.", pill: { tone: "ok", label: "Sans déplacement" } },
          { text: "KL-789-MN · Petit · retour 9 nov.", pill: { tone: "warn", label: "1 voiture à sortir" } },
        ],
      },
      {
        title: "Recherche · AB-123",
        rows: [
          { text: "AB-123-CD · Jean Dupont · retour 3 nov." },
          { text: "File F07 · 3e depuis l’allée", pill: { tone: "info", label: "Sur place" } },
          { hour: "09:47", text: "Clés laissées · crochet F07-3", pill: { tone: "ok", label: "Clés" } },
        ],
      },
    ],
    sections: [
      {
        title: "Dessiner le parking sur la photo aérienne",
        paragraphs: [
          "Le plan s’ouvre sur la photo aérienne, calée sur l’adresse de votre parking. À la première ouverture, un premier plan se prépare : le contour du terrain, les bâtiments à éviter, les zones où l’on gare, puis les places ou les files. Vous corrigez au pinceau ce qui est garable et à la gomme ce qui sert de passage, et vous annulez un geste comme dans n’importe quel logiciel.",
          "La carte tourne pour aligner le terrain sur l’écran, et le tracé s’accroche au contour et aux bâtiments. Les places peuvent aussi se poser à la main, une rangée d’un seul trait. Le nombre de places du plan devient la capacité de votre parking, utilisée partout : réservations de l’équipe, imports, planning, fiche sur Plazo. Une réservation de trop est signalée au lieu d’être vendue.",
        ],
      },
      {
        title: "Des files rangées selon la date de retour",
        paragraphs: [
          "Sur un parking voiturier, l’unité de rangement est la file : une voiture entre devant les autres, et une file est saine quand chacune repart avant celles de derrière. Dans l’outil Files, un trait suffit pour en créer une, sa capacité est déduite de sa longueur, et des files peuvent être proposées d’après la forme du terrain.",
          "À l’arrivée, une file est proposée dans cet ordre : celle qui sert déjà ce jour de retour, puis celle où la voiture se glisse derrière une autre qui part plus tard, puis une file vide gardée pour ce jour, puis une file vide libre. La voiture qui devrait faire bouger d’autres voitures est annoncée : « 1 voiture à sortir ». Chaque nuit, des files vides sont gardées pour les grosses journées de retour des 14 jours à venir, un tiers restant libre, et un gérant peut garder une file à la main pour un jour précis.",
          "Le planning des files donne, jour par jour, les retours, la place qui reste et les files gardées. Le matin, « À sortir aujourd’hui » liste les voitures qui repartent, file par file, avec leur rang depuis l’allée.",
        ],
      },
      {
        title: "Les clés et les crochets",
        paragraphs: [
          "Sur le tableau de bord, chaque voiture au parking montre l’état de ses clés en trois positions : « Clés ? », « Laissées » avec l’heure, ou « Crochet n° » avec un numéro. Un clic suffit, sur ordinateur comme dans l’application, et un second clic annule une erreur.",
          "Quand les clés sont laissées sans numéro tapé, elles vont au crochet de la place de la voiture : le code de la place, ou dans une file son code et son rang compté depuis le fond, par exemple « F07-3 », qui ne bouge pas quand les voitures de devant vont et viennent. Une voiture déplacée emporte ce crochet vers sa nouvelle place. À la remise, « Rendu » libère le crochet avec la place.",
        ],
      },
      {
        title: "Retrouver n’importe quelle voiture",
        paragraphs: [
          "L’Occupation montre le plan en couleurs, une voiture vue de dessus dans chaque place occupée, la plaque, le nom et le retour dès qu’on zoome. On cherche une plaque, un nom ou une référence, et la voiture s’affiche avec sa place ou sa file, son rang et ses clés. Le plan se lit aussi par durée de séjour : court, moyen ou long.",
          "Le tableau de bord liste les voitures sur le parking, triées par retour, avec des filtres « Retours du jour », « Clés ? » et « Vol en retard ». Une voiture dont le retour est passé depuis trois heures est signalée, comme un retour du jour bloqué derrière une voiture qui part plus tard. Un nouveau voiturier trouve la bonne voiture sans demander.",
        ],
      },
    ],
    faq: [
      ["Faut-il un plan du parking existant ?", "Non. Le plan se dessine sur la photo aérienne à partir de l’adresse du parking, et un premier plan est préparé à la première ouverture. Vous le corrigez ensuite."],
      ["Mon parking n’a pas de marquage au sol, est-ce un problème ?", "Non, c’est le cas pour lequel les files existent. Vous tracez vos files, et chaque voiture est rangée selon sa date de retour."],
      ["Comment noter les clés ?", "En un clic : « Clés laissées », ou le numéro du crochet. Sans numéro tapé, le crochet est celui de la place de la voiture, et il la suit si elle est déplacée."],
      ["Le nombre de places du plan remplace-t-il ma capacité déclarée ?", "Oui, dès que le plan a des places ou des files. Il sert alors aux réservations, au planning et à l’alerte de surréservation."],
      ["Mes voituriers peuvent-ils le faire sur téléphone ?", `Oui, dans l’application ${P} Pro sur Android et sur le web. L’application iPhone est en cours de validation chez Apple.`],
      ["Combien ça coûte ?", "De 149 € à 399 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["voiturier", "planning-reservations", "contrat-etat-des-lieux"],
  },
  "messages-clients": {
    slug: "messages-clients",
    updated: "2026-11-17",
    label: "Messages aux clients",
    metaTitle: `Messages aux clients de parking d’aéroport · ${P} Pro`,
    metaDescription: `Message de la veille, message à l’atterrissage, réponses des clients réunies au même endroit : votre parking d’aéroport prévient sans téléphoner.`,
    title: "Vos clients prévenus,",
    accent: "sans décrocher",
    lead: "La veille du dépôt, à l’atterrissage, et chaque fois qu’il faut écrire : les messages partent tout seuls, et les réponses arrivent au même endroit pour toute l’équipe.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "La veille, quelqu’un appelle ou écrit à chaque client du lendemain pour rappeler l’heure et l’adresse, depuis son propre téléphone. Les clients qui n’ont pas eu le message appellent le matin même, ou se trompent d’entrée.",
        "Au retour, le client atterrit et appelle pour savoir où attendre la navette. Les réponses des clients arrivent sur le téléphone d’un employé, se perdent dans ses conversations, et le collègue du soir n’en sait rien.",
      ],
    },
    gains: [
      { title: "Le message de la veille", text: "À l’heure que vous choisissez, chaque client du lendemain reçoit l’heure, l’adresse, le rendez-vous et le lien de sa réservation." },
      { title: "Votre texte, pour chaque client", text: "Prénom, date, heure, plaque, rendez-vous, téléphone du parking : le texte se remplit seul." },
      { title: "WhatsApp, et un repli", text: "Quand WhatsApp ne passe pas, un message texte part à la place, une seule fois." },
      { title: "Le rendez-vous à l’atterrissage", text: "Quand l’avion se pose, le client reçoit le point de rendez-vous et le délai." },
      { title: "Une seule messagerie", text: "Les réponses WhatsApp, les messages écrits au téléphone du parking et ceux de l’application Plazo arrivent au même endroit." },
      { title: "« Écrire au client »", text: "Depuis la fiche d’une réservation, un message part au client, et sa réponse arrive dans la messagerie." },
    ],
    screens: [
      {
        title: "Message de la veille · jeudi",
        rows: [
          { hour: "18:00", text: "Envoi automatique · 12 départs demain" },
          { text: "Dupont · 06 12 34 56 78", pill: { tone: "ok", label: "WhatsApp · lu" } },
          { text: "Leroy · 07 98 76 54 32", pill: { tone: "info", label: "Pas de confirmation" } },
          { text: "Martin · ne pas envoyer", pill: { tone: "warn", label: "Exclu" } },
        ],
      },
      {
        title: "Messages · À traiter · 3",
        rows: [
          { hour: "21:42", text: "Camille Martin · « Mon vol a 40 min de retard »", pill: { tone: "warn", label: "Non lu" } },
          { hour: "20:15", text: "Jean Dupont · « Merci, à demain »", pill: { tone: "ok", label: "WhatsApp" } },
          { hour: "19:03", text: "Paul Leroy · question sur l’adresse", pill: { tone: "info", label: "App Plazo" } },
        ],
      },
      {
        title: "Messages au voyageur · Dupont",
        rows: [
          { hour: "10:02", text: "Confirmation", pill: { tone: "ok", label: "Remis" } },
          { hour: "18:00", text: "Veille du dépôt", pill: { tone: "ok", label: "Lu à 18:05" } },
          { hour: "22:14", text: "Atterrissage · point de rendez-vous", pill: { tone: "ok", label: "Remis" } },
        ],
      },
    ],
    sections: [
      {
        title: "Le message de la veille, réglé une fois",
        paragraphs: [
          "Vous choisissez l’heure de l’envoi, de 16:00 à 21:30, et votre texte. Il se remplit seul pour chaque client avec ses informations : prénom, date et heure du dépôt, plaque, numéro de réservation, lien de sa réservation, mais aussi l’adresse du parking, son téléphone, le point de rendez-vous du retour, vos consignes, vos services et leurs prix, et vos suppléments à connaître. Un aperçu montre le message avant l’envoi, et « M’envoyer un test » le fait arriver sur votre téléphone.",
          "La page « Message de la veille » montre les soirées d’hier à cinq jours : pour chacune, l’heure, la pause éventuelle et les départs du lendemain avec l’état de chaque message. On retire un client d’un envoi avec « Ne pas envoyer », on le rétablit d’un clic, on envoie la soirée tout de suite avec « Envoyer maintenant ». Les réservations voiturier peuvent avoir leur propre texte.",
          "Une réservation prise le jour même pour le jour même reçoit son message juste après la réservation. Depuis la fiche d’une réservation, le message de la veille s’envoie ou se renvoie à ce seul client, à toute heure.",
        ],
      },
      {
        title: "WhatsApp quand il passe, un message texte sinon",
        paragraphs: [
          "La confirmation de la réservation et le message à l’atterrissage partent d’abord par WhatsApp quand le parking l’a allumé. Si WhatsApp refuse le message ou ne le remet pas dans les cinq minutes, un message texte part à la place, une seule fois. Le message de la veille part par message texte ou par WhatsApp, selon le réglage.",
          "L’état affiché est l’état réel : « remis » ou « lu » seulement quand la livraison est confirmée, « pas de confirmation » sinon. La fiche de chaque réservation liste les messages envoyés au client, avec leur canal et leur état, et la page de la veille compte ceux qui sont arrivés.",
          "À l’atterrissage, l’heure d’atterrissage réelle du vol retour déclenche le message : le point de rendez-vous et le délai, ou pour une réservation voiturier, l’endroit où la voiture attend. Le client ne cherche plus qui appeler.",
        ],
      },
      {
        title: "Une messagerie pour toute l’équipe",
        paragraphs: [
          "La page Messages réunit ce que les clients écrivent : leurs réponses par WhatsApp, les messages texte envoyés au téléphone du parking et ceux écrits depuis l’application Plazo. Chaque conversation est reliée à la réservation du client, avec les messages que le parking lui a envoyés. Les pilules Non lus, À traiter, Traités et Envoyés font le tri, et « Marquer comme traité » ferme une question.",
          "Une notification prévient l’équipe à chaque nouveau message, chauffeurs compris. Sur ordinateur, une barre de messages reste ouverte à droite de chaque page, et une conversation s’ouvre en petite fenêtre sans quitter le planning. Chaque parking ne voit que ses propres clients.",
        ],
      },
      {
        title: "« Écrire au client » depuis sa réservation",
        paragraphs: [
          `Dans l’application ${P} Pro, la fiche d’une réservation a un bouton pour écrire au client, aux chauffeurs comme à l’accueil. Le message part par WhatsApp ou par message texte depuis le téléphone du parking, et la réponse du client arrive dans la messagerie, dans la même conversation. Si WhatsApp ne passe pas, un message texte part à la place.`,
          "Depuis une conversation, on peut aussi basculer sur un message texte ou un appel avec son propre téléphone, d’un geste. Le comptoir, le chauffeur et le gérant voient la même conversation : personne ne répond deux fois, personne n’oublie de répondre.",
        ],
      },
    ],
    faq: [
      ["Mes clients doivent-ils avoir WhatsApp ?", "Non. Quand WhatsApp ne passe pas, un message texte part à la place, une seule fois. Le client n’a rien à installer."],
      ["Puis-je écrire mon propre message de la veille ?", "Oui. Vous écrivez votre texte avec les informations à remplir (prénom, date, heure, plaque, rendez-vous…), vous le voyez en aperçu et vous vous l’envoyez en test."],
      ["Où arrivent les réponses des clients ?", "Dans la page Messages, que toute l’équipe partage : réponses WhatsApp, messages écrits au téléphone du parking et messages de l’application Plazo, reliés à la réservation du client."],
      ["Comment savoir si un client a reçu le message ?", "Chaque message montre son état réel : « remis » ou « lu » quand la livraison est confirmée, « pas de confirmation » sinon. La fiche de la réservation les liste tous."],
      ["Le chauffeur peut-il écrire au client ?", `Oui. Le chauffeur, l’accueil et le gérant écrivent depuis la fiche de la réservation dans l’application ${P} Pro, sur Android. L’application iPhone est en cours de validation chez Apple.`],
      ["Combien ça coûte ?", "De 149 € à 399 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["navette", "comparateurs", "planning-reservations"],
  },
} satisfies Record<string, ProTopic>;
