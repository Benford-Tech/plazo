import { PRODUCT_NAME } from "../product";
import type { ProTopic } from "../pro-topics";

const P = PRODUCT_NAME;

/**
 * « Plazo Pro ou Excel » (17/11/2026): what changes when a parking leaves a spreadsheet, paper or a notebook for Plazo Pro.
 * Same rules as the other topic pages: true facts only (CLAUDE.md), what the parking gains and never how, no competitor named.
 */
export const EXCEL_TOPICS = {
  "logiciel-ou-excel": {
    slug: "logiciel-ou-excel",
    updated: "2026-11-17",
    label: `${P} Pro ou Excel`,
    metaTitle: `Logiciel de gestion de parking ou Excel ? · ${P} Pro`,
    metaDescription: `Passer d’un tableur ou d’un cahier à un logiciel de parking d’aéroport : import de votre fichier, planning, équipe en direct, chiffre net. Démo gratuite.`,
    title: "Du tableur au logiciel,",
    accent: "sans tout perdre",
    lead: `Votre fichier Excel a tenu le parking jusqu’ici. ${P} Pro reprend vos réservations telles quelles, puis fait ce qu’un tableur ne sait pas faire : recevoir les comparateurs, compter les places et tenir toute l’équipe sur la même liste.`,
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Un tableur, un cahier au comptoir ou un planning papier, c’est simple et ça ne coûte rien. Tant qu’une seule personne le tient, tout va bien. Puis les mails des comparateurs arrivent, le téléphone sonne, et chacun recopie le nom, la plaque, les dates et le vol à la main. Une ligne oubliée, une date tapée de travers, et c’est une voiture qu’on n’attendait pas, ou une place vendue deux fois.",
        "Le fichier vit sur un ordinateur, le chauffeur n’y a pas accès, et deux personnes qui l’ouvrent en même temps ne voient pas la même chose. Personne ne sait qui a changé une date ni pourquoi. À la fin du mois, il faut encore additionner ce que chaque comparateur a vendu et ce qu’il a retenu, pour savoir ce que le parking a vraiment gagné.",
      ],
    },
    gains: [
      { title: "Votre fichier repris", text: "« Importer » lit votre Excel ou votre CSV, montre chaque ligne avant de valider, et « Retirer cet import » revient en arrière." },
      { title: "Les comparateurs arrivent seuls", text: "Leurs mails deviennent des réservations dans le planning, sans ressaisie. Ce qui est incomplet attend dans « À traiter »." },
      { title: "Pas de place vendue deux fois", text: "La surréservation est calculée sur la capacité réelle de votre parking, nuit par nuit, et signalée avant que la voiture n’arrive." },
      { title: "Une seule liste, en direct", text: "Comptoir, chauffeur, voiturier et gérant voient la même liste, sur ordinateur ou sur téléphone, à jour en quelques secondes." },
      { title: "Qui a fait quoi", text: "Chaque réservation garde son historique : chaque action, avec son auteur et l’heure, et chaque champ changé avant et après." },
      { title: "Le chiffre net", text: "Le chiffre d’affaires par canal, brut ou net de commissions, mois par mois, et un export CSV pour votre comptable." },
    ],
    screens: [
      {
        title: "Importer · planning-2026.xlsx",
        rows: [
          { text: "412 lignes lues · colonnes reconnues", pill: { tone: "ok", label: "Aperçu" } },
          { text: "Dupont · 12/11 08:30 → 19/11 · Allopark", pill: { tone: "ok", label: "À créer" } },
          { text: "Leroy · 14/11 · nuit déjà complète", pill: { tone: "warn", label: "À vérifier" } },
          { text: "Martin · même arrivée, même voyageur", pill: { tone: "info", label: "Déjà dans Plazo" } },
          { text: "Importer 398 réservations" },
        ],
      },
      {
        title: "Prévisionnel · novembre",
        rows: [
          { hour: "sam. 21", text: "↑ 14 arrivées · ↓ 9 départs · 76 voitures", pill: { tone: "warn", label: "92 %" } },
          { hour: "dim. 22", text: "↑ 6 arrivées · ↓ 18 départs · 64 voitures", pill: { tone: "ok", label: "77 %" } },
          { hour: "ven. 27", text: "↑ 21 arrivées · ↓ 7 départs", pill: { tone: "warn", label: "Complet +2" } },
        ],
      },
      {
        title: "Historique · Dupont",
        rows: [
          { hour: "09:47", text: "Karim · Attendu → Sur place", pill: { tone: "ok", label: "État" } },
          { hour: "08:12", text: "Sophie · Date de retour : 18 nov. → 19 nov.", pill: { tone: "info", label: "Modification" } },
          { hour: "hier", text: "Importée · « planning-2026.xlsx »" },
        ],
      },
    ],
    sections: [
      {
        title: "Reprendre votre fichier, sans le recopier",
        paragraphs: [
          `Dans Réservations, le bouton « Importer » accepte un fichier Excel ou un CSV, celui que vous tenez déjà. ${P} Pro reconnaît les colonnes par leur titre (« Nom client », « Tél », « Immat », « Date dépôt », « Date retour », « Prix TTC », « Canal », « N° résa »…) et vous les corrigez sur place si besoin. Les dates à la française, en lettres ou au format d’Excel sont lues, comme un prix écrit « 54,00 € », le moyen de paiement ou la prise en charge en navette ou en voiturier.`,
          "Avant d’écrire quoi que ce soit, l’aperçu montre chaque ligne : « À créer », « À vérifier » (par exemple une nuit déjà complète), « Déjà dans Plazo » (même numéro, ou même voyageur le même jour) ou « Erreur », avec la raison. Vous validez quand tout vous convient, jusqu’à 2 000 lignes d’un coup, réservations passées et à venir comprises.",
          "Une erreur de fichier ? « Retirer cet import » enlève les réservations de cet import, à tout moment : seules celles que personne n’a touchées depuis partent, les autres restent. Chaque réservation importée dit de quel fichier elle vient.",
        ],
      },
      {
        title: "Ce qu’un tableur ne fait pas tout seul",
        paragraphs: [
          "Les mails des comparateurs ne passent plus par le copier-coller : vous les faites suivre à l’adresse de votre parking, et la réservation se crée seule dans le planning. Un mail incomplet attend dans « À traiter », avec ce qui a été compris.",
          "Le nombre de places vient de votre parking, de son plan ou de ses files de voiturier. Chaque réservation est comptée nuit par nuit, et une nuit pleine est signalée : sur la fiche, un badge « Surréservation » suit l’occupation réelle du parking, voitures rendues en avance comprises.",
          "Le planning du jour avance avec l’horloge : prochaine arrivée, prochain départ, et ceux qui sont en retard. Le prévisionnel montre la semaine, le mois ou trois mois d’un coup d’œil : arrivées, départs, voitures garées la nuit et jours complets. Un clic sur un jour ouvre son planning.",
        ],
      },
      {
        title: "Toute l’équipe, la même information",
        paragraphs: [
          `L’espace pro sur ordinateur et l’application ${P} Pro sur téléphone montrent la même liste. Quand le comptoir enregistre une arrivée ou que le chauffeur part en navette, les autres le voient dans les secondes qui suivent, sans recharger ni se rappeler. L’application Android est disponible ; l’application iPhone est en cours de validation chez Apple.`,
          "Chaque réservation garde son historique : qui l’a créée, qui a changé la date de retour et quand, qui l’a passée « Sur place » ou « Rendu », et ce que les comparateurs ont modifié ou annulé. En cas de doute, la réponse est sur la fiche, pas dans la mémoire de quelqu’un.",
          "Au comptoir, le client signe son contrat de stationnement sur le téléphone du parking, et l’état des lieux se fait en photos au dépôt puis au retour, côte à côte, avec les dégâts notés sur la silhouette de la voiture. Une facture au nom de votre parking, avec votre logo et un numéro sans trou, se crée depuis la réservation et part par e-mail au client.",
        ],
      },
      {
        title: "Ce que le tableur garde, et comment démarrer",
        paragraphs: [
          "Soyons honnêtes : un tableur est gratuit, et il se plie à tout. Vous ajoutez une colonne quand vous voulez, vous le triez à votre façon, vous le connaissez par cœur. Rien ne vous empêche de le garder pour vos propres calculs : le chiffre d’affaires et les réservations s’exportent en CSV pour lui.",
          `${P} Pro coûte de 149 € à 399 € HT par mois selon la formule, −10 % à l’année. Ce qu’il rend, c’est le temps passé à recopier, à vérifier et à se demander qui a raison.`,
          "Rien n’oblige à tout changer d’un coup. Commencez par importer votre fichier et faire suivre les mails des comparateurs : le planning se remplit seul. Le chauffeur et le voiturier rejoignent l’équipe quand vous êtes prêt, le contrat et l’état des lieux viennent ensuite. La démo est gratuite, sans inscription, pour essayer avant.",
        ],
      },
    ],
    faq: [
      ["Puis-je reprendre mon fichier Excel actuel ?", "Oui. « Importer » lit un fichier Excel ou un CSV, reconnaît les colonnes par leur titre et vous montre chaque ligne avant de valider. Les réservations passées et à venir sont reprises, jusqu’à 2 000 lignes d’un coup."],
      ["Et si l’import se passe mal ?", "« Retirer cet import » enlève les réservations de ce fichier, à tout moment. Celles que quelqu’un a déjà modifiées depuis restent, pour ne rien perdre du travail de l’équipe."],
      ["Mes colonnes ne s’appellent pas comme les vôtres, est-ce un problème ?", `Non. ${P} Pro devine la colonne d’après son titre, et vous corrigez sur place celles qu’il n’a pas reconnues avant de lancer l’aperçu.`],
      ["Est-ce que je peux encore travailler dans Excel ?", "Oui. Le chiffre d’affaires et ses réservations s’exportent en CSV, ouvert directement dans un tableur, pour vos calculs ou votre comptable."],
      ["Toute mon équipe doit-elle changer le même jour ?", "Non. Le gérant peut commencer seul avec l’import et les mails des comparateurs, puis inviter le comptoir, les chauffeurs et les voituriers quand il le souhaite."],
      ["Combien ça coûte ?", "De 149 € à 399 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["planning-reservations", "comparateurs", "choisir-logiciel-parking-aeroport"],
  },
} satisfies Record<string, ProTopic>;

/** The pricing page's questions (17/11/2026): only what pro-pricing.ts and CLAUDE.md say, no commitment length invented. */
export const PRICING_FAQ: [string, string][] = [
  [
    "Y a-t-il un engagement ?",
    "La durée et les conditions se décident avec vous avant de commencer. Posez votre question dans « Un renseignement ? » ou demandez un devis depuis cette page : nous vous répondons par e-mail.",
  ],
  [
    "Puis-je essayer avant de choisir ?",
    `Oui : la démo de ${P} Pro est gratuite, sans inscription. Vous choisissez un rôle (gérant, accueil, chauffeur ou voiturier) et vous parcourez un parking fictif, remis à zéro chaque nuit.`,
  ],
  [
    "Qu’est-ce qui est compris dans chaque formule ?",
    "Essentiel (149 € HT par mois) réunit les réservations : saisie au téléphone et au comptoir, mails des comparateurs lus tout seuls, planning, tableau de bord et chiffre d’affaires. Opérations (299 €) ajoute le plan du parking, les files de voiturier, la navette et l’équipe. Complet (399 €) ajoute la commission de chaque comparateur et le chiffre net, le contrat signé et l’état des lieux en photos, et le mail du matin. À l’année, chaque formule coûte 10 % de moins.",
  ],
  [
    "Comment fonctionne la commission de la fiche sur Plazo ?",
    `La fiche sur ${P} est facultative. Vous ne payez que 15 % d’une réservation payée en ligne par un client sur ${P} : pour un séjour à 60 €, vous gardez 51 €. Sans réservation payée, rien n’est retenu.`,
  ],
  [
    "Quelles options puis-je ajouter ?",
    "La mise en route sur place (plan du parking, transfert des mails des comparateurs, formation de l’équipe) à 290 € HT une fois, un pack de 1 000 messages aux voyageurs à 49 € une fois, et une page de réservation à votre nom à 29 € HT par mois.",
  ],
  [
    "Combien de parkings puis-je gérer ?",
    "Une formule couvre un parking. Un deuxième parking du même loueur, avec son plan et son équipe, arrive bientôt : demandez un devis pour en parler.",
  ],
];
