import { createHash } from 'crypto';
import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import { parisTime, pdfSafe, wrap } from './partner-contract';

/**
 * The two contracts Plazo writes for every operator (17/11/2026, « Il faut un contrat pour publier des annonces et un
 * contrat d'utilisation de Plazo Pro », choice C « Un parcours, deux signatures »): the terms of use of Plazo Pro (the
 * software, with the data processing annex) and the listing contract (selling on plazo.fr: collection mandate,
 * commission, payouts). Drafted from the way Plazo really works, filled with the operator's own figures, to be reviewed
 * by a lawyer. Pure functions: the documents, their fingerprint and their PDF.
 */

export const AGREEMENT_KINDS = ['pro_terms', 'listing'] as const;
export type AgreementKind = (typeof AGREEMENT_KINDS)[number];

/** The version of each text: change it with the text, and every operator signs again. */
export const AGREEMENT_VERSIONS: Record<AgreementKind, string> = {
  pro_terms: '2026-11-17',
  listing: '2026-11-17',
};

export const AGREEMENT_TITLES: Record<AgreementKind, string> = {
  pro_terms: "Conditions d'utilisation de Plazo Pro",
  listing: 'Contrat de diffusion des annonces',
};

/** « 17/11/2026 » for « 2026-11-17 ». */
export const versionLabel = (version: string) => version.split('-').reverse().join('/');

export const isAgreementKind = (value: unknown): value is AgreementKind => AGREEMENT_KINDS.includes(value as AgreementKind);

// The plans of « Mon contrat » and of the site's Tarifs page (admin/src/lib/pro-plans.ts), excluding VAT.
export const PRO_PLANS = {
  essentiel: { name: 'Essentiel', monthlyEuros: 99 },
  operations: { name: 'Opérations', monthlyEuros: 199 },
  complet: { name: 'Complet', monthlyEuros: 399 },
} as const;
export type ProPlanId = keyof typeof PRO_PLANS;
export const isProPlan = (value: unknown): value is ProPlanId => typeof value === 'string' && value in PRO_PLANS;
export const YEARLY_DISCOUNT_PERCENT = 10;
/** The monthly price of a yearly plan, rounded to the euro as « Mon contrat » shows it. */
export const yearlyMonthly = (monthly: number) => Math.round((monthly * (100 - YEARLY_DISCOUNT_PERCENT)) / 100);

export type PayoutScheduleId = 'AFTER_STAY' | 'AT_DROP_OFF' | 'WEEKLY' | 'MONTHLY';

export interface AgreementFacts {
  productName: string;
  supportEmail: string;
  siteUrl: string;
  company: { name: string; legalForm: string; address: string; registration: string; vatNumber: string };
  operator: { name: string; legalName: string | null; address: string | null; siret: string | null; vatNumber: string | null };
  /** Basis points (1500 = 15 %). */
  commissionBps: number;
  payoutSchedule: PayoutScheduleId;
  plan: { id: ProPlanId; yearly: boolean } | null;
}

export interface AgreementArticle {
  heading: string;
  paragraphs: string[];
}

export interface AgreementDocument {
  kind: AgreementKind;
  version: string;
  title: string;
  parties: string[];
  articles: AgreementArticle[];
}

const euros = (n: number) => `${n.toLocaleString('fr-FR').replace(/ | /g, ' ')} €`;
export const percentOf = (bps: number) => `${(bps / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;

function payoutText(schedule: PayoutScheduleId): string {
  switch (schedule) {
    case 'AT_DROP_OFF':
      return "le lendemain du jour d'arrivée du voyageur";
    case 'WEEKLY':
      return 'le lundi qui suit la semaine (du lundi au dimanche) au cours de laquelle le séjour a pris fin';
    case 'MONTHLY':
      return 'le 1er du mois qui suit celui au cours duquel le séjour a pris fin';
    default:
      return 'le lendemain du jour de retour du voyageur';
  }
}

function parties(f: AgreementFacts): string[] {
  const c = f.company;
  const companyLine = [
    c.name,
    c.legalForm,
    c.address ? `dont le siège est ${c.address}` : '',
    c.registration ? `immatriculée ${c.registration}` : '',
    c.vatNumber ? `TVA ${c.vatNumber}` : '',
  ]
    .filter(Boolean)
    .join(', ');
  const o = f.operator;
  const operatorLine = [
    o.legalName || o.name,
    o.legalName && o.legalName !== o.name ? `exploitant le parking « ${o.name} »` : '',
    o.address ? `dont l'adresse est ${o.address}` : '',
    o.siret ? `SIRET ${o.siret}` : '',
    o.vatNumber ? `TVA ${o.vatNumber}` : '',
  ]
    .filter(Boolean)
    .join(', ');
  return [
    `${companyLine}, qui exploite la plateforme ${f.productName} (ci-après « ${f.productName} »),`,
    `et ${operatorLine}, représenté par le gérant qui signe ci-dessous (ci-après « le Loueur »).`,
  ];
}

function planText(f: AgreementFacts): string[] {
  if (!f.plan) {
    return [
      `La formule et son prix sont ceux du devis accepté par le Loueur ou, à défaut, ceux de la page Tarifs de ${f.productName} Pro au jour où le Loueur commence à l'utiliser.`,
    ];
  }
  const plan = PRO_PLANS[f.plan.id];
  if (f.plan.yearly) {
    const monthly = yearlyMonthly(plan.monthlyEuros);
    return [
      `Le Loueur a choisi la formule ${plan.name}, à l'année : ${euros(monthly)} HT par mois (remise de ${YEARLY_DISCOUNT_PERCENT} % sur le prix mensuel de ${euros(plan.monthlyEuros)} HT), soit ${euros(monthly * 12)} HT par an.`,
    ];
  }
  return [`Le Loueur a choisi la formule ${plan.name}, au mois : ${euros(plan.monthlyEuros)} HT par mois.`];
}

function proTerms(f: AgreementFacts): AgreementArticle[] {
  const p = f.productName;
  return [
    {
      heading: '1. Objet',
      paragraphs: [
        `${p} met à la disposition du Loueur le logiciel ${p} Pro, accessible par l'espace pro de son site et par l'application ${p} Pro sur iPhone et Android, pour organiser ses réservations, son planning, son parking, sa navette, ses messages aux voyageurs, ses contrats et ses états des lieux.`,
        `Les présentes conditions et leur annexe « Données personnelles » forment le contrat entre ${p} et le Loueur pour l'usage du logiciel. La vente des places du Loueur sur le site et l'application ${p} des voyageurs relève d'un contrat distinct, le Contrat de diffusion des annonces.`,
      ],
    },
    {
      heading: '2. Comptes et équipe',
      paragraphs: [
        'Le Loueur désigne au moins un gérant. Le gérant ajoute les membres de son équipe, choisit leur rôle (gérant, accueil, chauffeur, voiturier) et peut les retirer à tout moment.',
        'Chaque membre se connecte avec ses propres identifiants (adresse e-mail et mot de passe, Apple ou Google) et ne les communique à personne. Le Loueur répond des actions faites avec les comptes de son équipe et prévient sans délai ' +
          `${p} de tout accès qu'il n'a pas autorisé.`,
      ],
    },
    {
      heading: '3. Formule et prix',
      paragraphs: [
        ...planText(f),
        "Les prix s'entendent hors taxes ; la TVA s'y ajoute au taux en vigueur. Les options (mise en route, paquets de SMS, page de réservation) sont facturées au prix du devis ou de la page Tarifs.",
        `${p} peut faire évoluer ses prix ; le nouveau prix est annoncé au Loueur au moins 60 jours avant de s'appliquer, et le Loueur peut alors mettre fin au contrat sans frais avant cette date.`,
      ],
    },
    {
      heading: '4. Facturation et paiement',
      paragraphs: [
        `${p} facture la formule d'avance, chaque mois ou chaque année selon la formule choisie. La facture est payable à réception.`,
        "Tout retard de paiement entraîne, de plein droit, des pénalités au taux de trois fois le taux d'intérêt légal et l'indemnité forfaitaire de 40 € pour frais de recouvrement (article L. 441-10 du code de commerce). " +
          `Après une relance restée sans effet pendant 15 jours, ${p} peut suspendre l'accès au logiciel jusqu'au paiement.`,
      ],
    },
    {
      heading: '5. Durée et fin du contrat',
      paragraphs: [
        "Au mois, le contrat est sans engagement de durée : le Loueur y met fin à tout moment, pour la fin du mois en cours. À l'année, il est conclu pour douze mois et se renouvelle pour douze mois, sauf si le Loueur y met fin au moins un mois avant l'échéance.",
        `Le Loueur y met fin par e-mail à ${f.supportEmail}. ${p} peut y mettre fin avec un préavis de trois mois, ou après une mise en demeure restée sans effet pendant 30 jours en cas de manquement grave du Loueur.`,
      ],
    },
    {
      heading: '6. Le service',
      paragraphs: [
        `${p} fait de son mieux pour que le logiciel soit disponible à toute heure, mais ne garantit pas un fonctionnement sans interruption. Les maintenances prévues sont faites autant que possible en dehors des heures d'activité et annoncées à l'avance quand elles durent.`,
        `${p} fait évoluer le logiciel ; une fonction peut changer ou être remplacée, sans retirer au Loueur l'essentiel de ce que comprend sa formule. L'assistance est assurée par e-mail à ${f.supportEmail}.`,
      ],
    },
    {
      heading: '7. Services de tiers',
      paragraphs: [
        'Certaines fonctions reposent sur des services de tiers : suivi des vols, envoi des SMS (par le téléphone du parking ou par le prestataire de ' +
          `${p}), WhatsApp, notifications des téléphones, cartes, lecture automatique des mails. ${p} les choisit avec soin mais ne répond pas de leurs pannes ni de leurs erreurs.`,
        "Une heure d'atterrissage, une position de navette ou une réservation lue dans un mail est une aide : le Loueur garde la responsabilité de l'accueil de ses clients.",
      ],
    },
    {
      heading: '8. Messages aux voyageurs',
      paragraphs: [
        `Les messages que le logiciel envoie aux voyageurs (confirmation, message de la veille, atterrissage, réponses de l'équipe) partent au nom du Loueur et ne servent qu'aux réservations. Le Loueur choisit et modifie leurs textes sous sa responsabilité, et ne s'en sert pas pour de la prospection.`,
        `Les SMS envoyés par le prestataire de ${p} sont limités par jour ; ceux qui partent du téléphone du parking dépendent de ce téléphone et de son forfait.`,
      ],
    },
    {
      heading: '9. Mails transférés et lecture automatique',
      paragraphs: [
        `Le Loueur peut transférer à ${p} les mails des comparateurs et de son site. ${p} les lit par des règles propres à chaque comparateur et, pour les mails qu'elles ne reconnaissent pas, par un service d'intelligence artificielle (Claude, d'Anthropic), pour créer, modifier ou annuler les réservations.`,
        'Le Loueur vérifie les réservations ainsi créées, notamment celles signalées « À traiter ». Le texte des mails est effacé 30 jours après leur réception.',
      ],
    },
    {
      heading: '10. Contrats et états des lieux',
      paragraphs: [
        `Le logiciel permet de faire signer au voyageur le contrat de stationnement du Loueur et ses états des lieux, par une signature électronique simple (articles 1366 et 1367 du code civil, règlement européen eIDAS n° 910/2014) : code reçu par SMS ou signature à la main sur l'écran. ${p} garde le document signé, son empreinte et la preuve de signature ; ${p} n'est pas un prestataire de confiance qualifié.`,
        'Le contenu du contrat de stationnement, quand le Loueur dépose le sien, relève de la seule responsabilité du Loueur.',
      ],
    },
    {
      heading: '11. Les données du Loueur',
      paragraphs: [
        `Les données saisies ou reçues pour le Loueur (réservations, clients, planning, contrats, photos) restent les siennes. ${p} ne s'en sert que pour fournir le service, et peut en tirer des statistiques qui ne permettent d'identifier ni le Loueur ni ses clients.`,
        `À la fin du contrat, le Loueur dispose de 30 jours pour exporter ses données (réservations, contrats signés, factures) ; ${p} les efface ensuite, sauf ce que la loi l'oblige à garder (les factures, dix ans).`,
      ],
    },
    {
      heading: '12. Données personnelles',
      paragraphs: [
        `Pour les données personnelles traitées pour le compte du Loueur (ses clients et son équipe), le Loueur est responsable du traitement et ${p} son sous-traitant, dans les conditions de l'article 28 du règlement général sur la protection des données, précisées en annexe.`,
      ],
    },
    {
      heading: '13. Sécurité et confidentialité',
      paragraphs: [
        `${p} protège les données par des moyens adaptés : connexions chiffrées, mots de passe chiffrés, accès limités par rôle, cloisonnement entre loueurs, photos et documents dans un stockage privé.`,
        "Chaque partie garde confidentielles les informations de l'autre qu'elle apprend par le contrat (prix, chiffres, clients), pendant le contrat et cinq ans après.",
      ],
    },
    {
      heading: '14. Propriété intellectuelle',
      paragraphs: [
        `${p} reste seul titulaire du logiciel, de ses marques et de ses contenus. Le Loueur reçoit, pour la durée du contrat, un droit d'utiliser le logiciel pour son activité, personnel, non exclusif et non cessible.`,
      ],
    },
    {
      heading: '15. Responsabilité',
      paragraphs: [
        `${p} est tenu d'une obligation de moyens. Il ne répond pas des dommages indirects (perte de chiffre d'affaires, de clientèle ou de données dont le Loueur pouvait garder une copie).`,
        `Sauf faute lourde ou intentionnelle, la responsabilité de ${p} est limitée, tous dommages confondus, aux sommes payées par le Loueur au titre de ce contrat pendant les douze mois qui précèdent le fait en cause.`,
      ],
    },
    {
      heading: '16. Modification des conditions',
      paragraphs: [
        `${p} peut modifier ces conditions. La nouvelle version est annoncée au Loueur au moins 30 jours avant de s'appliquer et proposée à la signature dans son espace pro ; s'il ne l'accepte pas, le Loueur peut mettre fin au contrat sans frais avant cette date.`,
      ],
    },
    {
      heading: '17. Droit applicable et litiges',
      paragraphs: [
        "Le contrat est soumis au droit français. Les parties cherchent d'abord une solution amiable ; à défaut, le litige est porté devant le tribunal de commerce de Vienne.",
      ],
    },
    {
      heading: 'Annexe · Données personnelles (article 28 du RGPD)',
      paragraphs: [
        'Objet et durée : héberger et organiser les réservations du Loueur, envoyer ses messages, suivre ses navettes, garder ses contrats et ses états des lieux, pour la durée du contrat.',
        "Personnes concernées et données : les clients du Loueur (nom, téléphone, e-mail, plaque et véhicule, numéros de vol, dates, messages, signatures, photos d'état des lieux, position de la voiture) et les membres de son équipe (nom, e-mail, rôle, position partagée pendant un trajet de navette).",
        `Instructions : ${p} ne traite ces données que pour fournir le service et sur instruction du Loueur, que constituent ce contrat et ses réglages dans l'espace pro. Ses personnes autorisées sont tenues à la confidentialité.`,
        "Durées : réservations anonymisées 12 mois après le retour ; photos d'état des lieux effacées 90 jours après le retour (365 jours en cas de réserve) ; texte des mails reçus et messages WhatsApp et SMS : 30 jours.",
        'Sous-traitants ultérieurs, que le Loueur autorise : Vercel (hébergement), Neon (base de données), Brevo (e-mails et SMS), Cloudflare (réception des mails), OneSignal (notifications), Meta Platforms (WhatsApp), Anthropic (lecture des mails et rédaction), AeroDataBox (numéros de vol seulement), Stripe (paiements en ligne). ' +
          `${p} prévient le Loueur de tout changement au moins 30 jours avant ; le Loueur peut s'y opposer en mettant fin au contrat. Un transfert hors de l'Union européenne est encadré par une décision d'adéquation ou par les clauses contractuelles types de la Commission européenne.`,
        `Aide au Loueur : ${p} l'aide à répondre aux demandes des personnes (accès, rectification, effacement), le prévient de toute violation de données dans les meilleurs délais et au plus tard 48 heures après en avoir eu connaissance, et lui fournit les informations utiles pour démontrer le respect de ces obligations.`,
        "Fin du contrat : les données sont rendues au Loueur par export puis effacées, dans les conditions de l'article 11.",
      ],
    },
  ];
}

function listing(f: AgreementFacts): AgreementArticle[] {
  const p = f.productName;
  const rate = percentOf(f.commissionBps);
  return [
    {
      heading: '1. Objet',
      paragraphs: [
        `${p} présente l'offre de stationnement du Loueur aux voyageurs, sur son site (${f.siteUrl.replace(/^https?:\/\//, '')}) et dans son application ${p}, et leur permet de réserver et de payer en ligne. Le contrat de stationnement est conclu entre le voyageur et le Loueur ; ${p} agit comme intermédiaire.`,
        `L'usage du logiciel ${p} Pro relève des Conditions d'utilisation de ${p} Pro, signées à part.`,
      ],
    },
    {
      heading: '2. La fiche du parking',
      paragraphs: [
        "Le Loueur rédige et tient à jour la fiche de son parking : adresse, photos, description, horaires, navette (durée du trajet, attente), voiturier, remise des clés, équipements, consignes et suppléments éventuels. Il garantit qu'elle est exacte et qu'il a le droit d'utiliser les photos.",
        `${p} relit chaque fiche avant sa mise en ligne. ${p} peut en corriger la forme, et refuser ou retirer un contenu inexact, trompeur ou illicite, en le disant au Loueur.`,
      ],
    },
    {
      heading: '3. Prix et places',
      paragraphs: [
        'Le Loueur fixe librement ses prix (grille par durée, frais de nuit). Le voyageur voit le prix total de son séjour, toutes taxes comprises, avant de réserver.',
        `Les places proposées sont celles du plan du parking ou, à défaut, la capacité déclarée, moins la marge choisie par le Loueur. Le Loueur tient ses places à jour ; une réservation faite sur ${p} dans la limite de ces places l'engage.`,
        'Si le Loueur ne peut pas honorer une réservation, il propose au voyageur une solution équivalente à ses frais ; à défaut, le voyageur est remboursé en entier et le Loueur supporte les frais que cela entraîne.',
      ],
    },
    {
      heading: "4. Mandat d'encaissement",
      paragraphs: [
        `Le Loueur donne mandat à ${f.company.name || p} d'encaisser, en son nom et pour son compte, le prix des réservations et des services faits sur ${p}. Le paiement est fait en ligne par carte, par l'intermédiaire de Stripe ; le voyageur qui a payé ${p} est libéré envers le Loueur.`,
        `Les frais de paiement de Stripe sont à la charge de ${p}.`,
      ],
    },
    {
      heading: '5. Commission',
      paragraphs: [
        `Pour chaque réservation payée sur ${p}, ${p} retient une commission de ${rate} du montant payé par le voyageur, frais de nuit et services additionnels compris. Aucun autre frais n'est dû pour la diffusion de la fiche.`,
        `La commission s'entend hors taxes ; ${p} adresse chaque mois au Loueur une facture de ses commissions, avec la TVA due. ${p} peut faire évoluer son taux en le disant au Loueur au moins 30 jours avant ; le nouveau taux ne s'applique qu'aux réservations faites après cette date.`,
      ],
    },
    {
      heading: '6. Reversements',
      paragraphs: [
        `${p} reverse au Loueur le montant payé moins la commission et les sommes remboursées, ${payoutText(f.payoutSchedule)}, sur le compte Stripe que le Loueur relie depuis son espace pro. Le calendrier se change dans l'espace pro, pour les séjours à venir.`,
        "Tant que le compte n'est pas relié, les sommes restent dues et sont reversées dès qu'il l'est. Le Loueur trouve le détail de chaque reversement dans son espace pro.",
      ],
    },
    {
      heading: '7. Annulations et remboursements',
      paragraphs: [
        `Le voyageur annule et est remboursé selon les conditions générales de ${p} et les conditions d'annulation affichées sur la fiche. ${p} fait le remboursement ; une somme remboursée n'est pas reversée au Loueur, ou est retenue sur le reversement suivant si elle l'a déjà été.`,
        "Un voyageur qui ne vient pas n'est pas remboursé, sauf si le Loueur en décide autrement.",
      ],
    },
    {
      heading: '8. Services additionnels',
      paragraphs: [
        `Le voyageur peut commander et payer sur ${p} les services que le Loueur propose (lavage, recharge…), aux prix fixés par le Loueur. La commission de l'article 5 s'y applique. Un service fait est reversé ; un service que le Loueur ne peut pas faire est marqué « Pas possible » et remboursé au voyageur.`,
      ],
    },
    {
      heading: '9. Engagements du Loueur',
      paragraphs: [
        'Le Loueur accueille le voyageur aux heures réservées, assure la navette ou le voiturier annoncés, garde le véhicule et le restitue au retour. Il est assuré pour son activité, notamment pour la garde des véhicules qui lui sont confiés.',
        `Il ne demande au voyageur aucune somme qui n'était pas annoncée sur la fiche ou dans les conditions du parking, et ne l'invite pas à annuler pour réserver la même place hors de ${p}.`,
      ],
    },
    {
      heading: '10. Réclamations des voyageurs',
      paragraphs: [
        `Le Loueur traite les réclamations qui portent sur le stationnement (accueil, navette, dégâts) ; ${p} celles qui portent sur la réservation et le paiement. Chacun informe l'autre de ce qui le concerne.`,
        `Si ${p} publie un jour des avis de voyageurs, seuls ceux qui ont réservé pourront en donner ; ${p} ne les modifiera pas et ne les classera pas contre rémunération, et le Loueur pourra y répondre.`,
      ],
    },
    {
      heading: '11. Classement des offres',
      paragraphs: [
        `${p} présente les parkings disponibles aux dates choisies par le voyageur, du moins cher au plus cher par défaut ; le voyageur peut trier et filtrer (navette en direct, voiturier, équipements). Aucun parking ne paie pour être mieux placé (règlement européen « P2B » n° 2019/1150).`,
      ],
    },
    {
      heading: '12. Données personnelles',
      paragraphs: [
        `Pour les réservations faites sur ${p}, ${p} est responsable du traitement des données des voyageurs pour la réservation, le paiement et la relation avec eux ; le Loueur l'est pour l'exécution du stationnement. Le Loueur n'utilise ces données que pour cette réservation.`,
      ],
    },
    {
      heading: '13. Durée, suspension et fin',
      paragraphs: [
        'Le contrat est conclu sans durée. Le Loueur peut retirer sa fiche à tout moment ; les réservations déjà faites sont honorées.',
        `${p} peut y mettre fin avec un préavis de 30 jours, en disant pourquoi. En cas de manquement grave (fiche trompeuse, réservations non honorées, fraude), ${p} peut suspendre la fiche sans attendre, en donnant au Loueur le motif par écrit, et le Loueur peut le contester par le moyen de l'article 15.`,
      ],
    },
    {
      heading: '14. Modification du contrat',
      paragraphs: [
        `${p} peut modifier ce contrat. La nouvelle version est annoncée au Loueur au moins 30 jours avant de s'appliquer et proposée à la signature dans son espace pro ; s'il ne l'accepte pas, le Loueur peut retirer sa fiche avant cette date.`,
      ],
    },
    {
      heading: '15. Réclamations du Loueur et litiges',
      paragraphs: [
        `Le Loueur adresse ses réclamations à ${f.supportEmail} ; ${p} y répond dans les 30 jours. Les parties peuvent recourir à une médiation.`,
        "Le contrat est soumis au droit français. À défaut d'accord amiable, le litige est porté devant le tribunal de commerce de Vienne.",
      ],
    },
  ];
}

export function agreementDocument(kind: AgreementKind, facts: AgreementFacts): AgreementDocument {
  return {
    kind,
    version: AGREEMENT_VERSIONS[kind],
    title: AGREEMENT_TITLES[kind],
    parties: parties(facts),
    articles: kind === 'pro_terms' ? proTerms(facts) : listing(facts),
  };
}

/** The text signed, word for word: what the fingerprint covers. */
export function agreementText(doc: AgreementDocument): string {
  return [
    doc.title,
    `Version du ${versionLabel(doc.version)}`,
    'Entre',
    ...doc.parties,
    ...doc.articles.flatMap(a => [a.heading, ...a.paragraphs]),
  ].join('\n\n');
}

export const textSha256 = (doc: AgreementDocument) => createHash('sha256').update(agreementText(doc), 'utf8').digest('hex');
export const bytesSha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

export interface AgreementSignature {
  id: string;
  operatorName: string;
  signerName: string;
  signerEmail: string;
  signedAt: Date;
  ip: string | null;
  userAgent: string | null;
  textSha256: string;
}

export const agreementAcceptance = (title: string, operatorName: string) =>
  `Lu et approuvé. J'ai lu « ${title} » en entier et je l'accepte au nom de ${operatorName}.`;

const A4: [number, number] = [595.28, 841.89];
const LEFT = 56;
const WIDTH = A4[0] - LEFT * 2;
const INK = rgb(0.1, 0.11, 0.1);
const SOFT = rgb(0.42, 0.45, 0.5);

class Writer {
  page;
  y = A4[1] - 64;
  constructor(
    private doc: PDFDocument,
    private footer: string,
    private regular: PDFFont,
  ) {
    this.page = this.addPage();
  }
  private addPage() {
    const page = this.doc.addPage(A4);
    page.drawText(pdfSafe(this.footer), { x: LEFT, y: 32, size: 8, font: this.regular, color: SOFT });
    this.y = A4[1] - 64;
    return page;
  }
  text(value: string, font: PDFFont, size: number, color = INK, gapAfter = 4) {
    for (const line of wrap(value, font, size, WIDTH)) {
      if (this.y < 64) this.page = this.addPage();
      this.page.drawText(line, { x: LEFT, y: this.y, size, font, color });
      this.y -= size * 1.4;
    }
    this.y -= gapAfter;
  }
  space(points: number) {
    this.y -= points;
    if (this.y < 64) this.page = this.addPage();
  }
  newPage() {
    this.page = this.addPage();
  }
}

export function signatureLines(doc: AgreementDocument, sig: AgreementSignature, pdfSha256?: string): [string, string][] {
  return [
    ['Contrat', `${doc.title} · version du ${versionLabel(doc.version)}`],
    ['Loueur', sig.operatorName],
    ['Signé par', `${sig.signerName} (${sig.signerEmail})`],
    ['Mention acceptée', agreementAcceptance(doc.title, sig.operatorName)],
    ['Date et heure', `${parisTime(sig.signedAt)} (heure de Paris) · ${sig.signedAt.toISOString()}`],
    ['Adresse IP', sig.ip ?? 'inconnue'],
    ['Navigateur', sig.userAgent ? sig.userAgent.slice(0, 300) : 'inconnu'],
    ['Empreinte SHA-256 du texte signé', sig.textSha256],
    ...(pdfSha256 ? ([['Empreinte SHA-256 du PDF signé', pdfSha256]] as [string, string][]) : []),
    ['Référence', sig.id],
  ];
}

async function writeSignature(
  w: Writer,
  doc: AgreementDocument,
  sig: AgreementSignature,
  fonts: { regular: PDFFont; bold: PDFFont; mono: PDFFont },
  pdfSha256?: string,
) {
  w.text('Signature électronique', fonts.bold, 18, INK, 6);
  w.text(
    "Le signataire s'est connecté à son espace professionnel, a lu le contrat, a tapé son nom complet et a coché la mention ci-dessous avant de signer.",
    fonts.regular,
    9.5,
    SOFT,
    12,
  );
  for (const [label, value] of signatureLines(doc, sig, pdfSha256)) {
    w.text(label.toUpperCase(), fonts.bold, 8, SOFT, 1);
    w.text(value, /^[0-9a-f]{64}$/.test(value) ? fonts.mono : fonts.regular, 10.5, INK, 8);
  }
}

/** The contract as a PDF: the text, then (when signed) the signature page; and the proof (that page alone). */
export async function buildAgreementPdf(
  doc: AgreementDocument,
  productName: string,
  signature?: AgreementSignature,
): Promise<{ pdf: Buffer; pdfSha256: string; proof: Buffer | null }> {
  const make = async (withText: boolean, pdfSha256?: string) => {
    const pdf = await PDFDocument.create();
    pdf.setTitle(pdfSafe(withText ? doc.title : `Preuve de signature · ${doc.title}`));
    pdf.setProducer(productName);
    const fonts = {
      regular: await pdf.embedFont(StandardFonts.Helvetica),
      bold: await pdf.embedFont(StandardFonts.HelveticaBold),
      mono: await pdf.embedFont(StandardFonts.Courier),
    };
    const w = new Writer(pdf, `${productName} · ${doc.title} · version du ${versionLabel(doc.version)}`, fonts.regular);
    if (withText) {
      w.text(doc.title, fonts.bold, 20, INK, 4);
      w.text(`Version du ${versionLabel(doc.version)}`, fonts.regular, 10, SOFT, 14);
      w.text('ENTRE', fonts.bold, 8, SOFT, 2);
      for (const p of doc.parties) w.text(p, fonts.regular, 10.5, INK, 6);
      w.space(8);
      for (const article of doc.articles) {
        w.text(article.heading, fonts.bold, 12, INK, 4);
        for (const p of article.paragraphs) w.text(p, fonts.regular, 10.5, INK, 6);
        w.space(6);
      }
      if (signature) w.newPage();
    }
    if (signature) await writeSignature(w, doc, signature, fonts, pdfSha256);
    return Buffer.from(await pdf.save());
  };
  const pdf = await make(true);
  const pdfSha256 = bytesSha256(pdf);
  const proof = signature ? await make(false, pdfSha256) : null;
  return { pdf, pdfSha256, proof };
}

export interface SignRequest {
  name: string;
  kinds: AgreementKind[];
  read: Partial<Record<AgreementKind, string>>;
}

/** { signerName, kinds: ['pro_terms', 'listing'], read: { kind: textSha256 } }: the name typed, one box per contract. */
export function checkSignRequest(body: {
  signerName?: unknown;
  kinds?: unknown;
  read?: unknown;
}): { ok: true; value: SignRequest } | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  const name = typeof body.signerName === 'string' ? body.signerName.replace(/\s+/g, ' ').trim() : '';
  if (!name) fields.signerName = 'required';
  else if (name.length > 120) fields.signerName = 'too_long';
  else if (name.split(' ').filter(w => /\p{L}/u.test(w)).length < 2) fields.signerName = 'full_name';
  const kinds = Array.isArray(body.kinds) ? [...new Set(body.kinds)] : [];
  if (!kinds.length) fields.kinds = 'required';
  else if (!kinds.every(isAgreementKind)) fields.kinds = 'invalid';
  const read: Partial<Record<AgreementKind, string>> = {};
  if (body.read && typeof body.read === 'object') {
    for (const [k, v] of Object.entries(body.read as Record<string, unknown>)) if (isAgreementKind(k) && typeof v === 'string') read[k] = v;
  }
  if (!fields.kinds && kinds.some(k => !read[k as AgreementKind])) fields.read = 'required';
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, value: { name, kinds: kinds as AgreementKind[], read } };
}
