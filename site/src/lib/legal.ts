import { fr } from "./fr";
import { COMPANY, hasSupportEmail, PRODUCT_NAME, SUPPORT_EMAIL, type Company } from "./product";

/**
 * Texts of the legal pages (terms, legal notice, privacy policy), drafted from how the platform actually works
 * and still to be validated by a lawyer. Product and company names come from product.json; a
 * missing company detail shows as "[à compléter]".
 *
 * A block is a paragraph, or a list when it is an array. "[label](/path)" makes an internal link.
 */
export type LegalBlock = string | string[];

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  title: string;
  version: string;
  lead: string;
  sections: LegalSection[];
}

export const LEGAL_VERSION = "6 octobre 2026";
export const TO_COMPLETE = "[à compléter]";

const filled = (value: string) => value.trim() || TO_COMPLETE;

function identity(company: Company, email: string) {
  return {
    name: filled(company.name),
    legalForm: filled(company.legalForm),
    shareCapital: filled(company.shareCapital),
    address: filled(company.address),
    registration: filled(company.registration),
    vatNumber: filled(company.vatNumber),
    phone: filled(company.phone),
    publicationDirector: filled(company.publicationDirector),
    mediator: filled(company.mediator),
    email: hasSupportEmail(email) ? email : TO_COMPLETE,
  };
}

/** Conditions générales d'utilisation et de vente of the traveller site and apps. */
export function termsDoc(company: Company = COMPANY, email: string = SUPPORT_EMAIL, p: string = PRODUCT_NAME): LegalDoc {
  const c = identity(company, email);
  return {
    title: fr.legal.terms,
    version: LEGAL_VERSION,
    lead: `Ces conditions s’appliquent à l’utilisation du site et des applications ${p} et à chaque réservation de parking faite par leur intermédiaire. Le voyageur les accepte au moment de réserver ; la version applicable est celle en vigueur ce jour-là.`,
    sections: [
      {
        id: "editeur",
        title: `1. Qui est ${p}`,
        blocks: [
          `${p} est une marque exploitée par ${c.name}, ${c.legalForm} au capital de ${c.shareCapital}, dont le siège est situé ${c.address}, immatriculée sous le numéro ${c.registration}, numéro de TVA intracommunautaire ${c.vatNumber}.`,
          `Service client : ${c.email} · ${c.phone}. Les autres informations sur l’éditeur figurent dans les [mentions légales](/mentions-legales).`,
        ],
      },
      {
        id: "role",
        title: `2. Le rôle de ${p}`,
        blocks: [
          `${p} est une plateforme de réservation en ligne : elle présente des parkings privés situés autour des aéroports, exploités par des professionnels indépendants (ci-après « le parking »), et permet de les réserver et de les payer en ligne.`,
          "Le contrat de stationnement est conclu directement entre le voyageur et le parking choisi, dont le nom figure sur sa fiche et sur la confirmation de réservation. Le parking exécute seul la prestation : accueil, stationnement et garde du véhicule, navette, service de voiturier le cas échéant, restitution du véhicule et des clés.",
          `${p} n’est ni le propriétaire ni l’exploitant des parkings présentés, qui ne sont ni ses agents ni ses salariés. ${p} répond de son propre service : présentation des offres, enregistrement de la réservation, encaissement du paiement et remboursements, transmission de la réservation au parking, envoi des confirmations et des informations de navette.`,
        ],
      },
      {
        id: "classement",
        title: "3. Parkings présentés et classement des offres",
        blocks: [
          `Seuls des professionnels peuvent proposer un parking sur ${p}. Chaque parking est lié à ${p} par un contrat et lui verse une commission sur chaque réservation (voir l’article 4). Une fiche n’est publiée qu’après vérification par ${p}, qui peut la refuser, la retirer ou suspendre un parking, notamment en cas d’informations inexactes ou de manquement à ses engagements. Le parking peut aussi retirer sa fiche à tout moment.`,
          "Pour une recherche (aéroport et dates), les parkings disponibles pour tout le séjour apparaissent avant ceux qui sont complets. Dans chaque groupe, les offres sont classées par prix total croissant ou, au choix du voyageur, par distance de l’aéroport ou par durée de navette. Les filtres (services, annulation gratuite, durée de navette, prix maximal) ne font que retirer des offres de la liste.",
          `Le classement ne dépend ni du montant de la commission ni d’aucun paiement : aucun parking ne peut acheter une meilleure place dans les résultats.`,
        ],
      },
      {
        id: "prix",
        title: "4. Prix",
        blocks: [
          `Chaque parking fixe librement ses tarifs. Le prix affiché est le prix total du séjour pour les dates et heures choisies, en euros toutes taxes comprises : ${p} n’ajoute aucun frais de service. Le jour de dépôt et le jour de retour comptent chacun pour une journée.`,
          `La commission de ${p} est comprise dans ce prix : elle est due par le parking, pas par le voyageur.`,
          "Les tarifs peuvent évoluer à tout moment ; le prix dû est celui affiché et confirmé au moment de la réservation.",
          "Les services que le parking proposerait sur place sans qu’ils aient été réservés en ligne (lavage, recharge…) et la prolongation du séjour au-delà de la date de retour réservée sont facturés par le parking, selon ses propres tarifs.",
        ],
      },
      {
        id: "reservation",
        title: "5. Réservation",
        blocks: [
          "Pour réserver, le voyageur choisit un parking et ses dates, puis indique ses prénom et nom, son téléphone mobile, son adresse e-mail, la plaque d’immatriculation du véhicule, le nombre de passagers et, de préférence, ses numéros de vol aller et retour. Il garantit l’exactitude de ces informations : le parking s’en sert pour l’accueillir, organiser la navette et lui rendre son véhicule.",
          "La réservation se fait en deux étapes, « Vos informations » puis « Paiement ». À la fin de la première, la place est gardée au voyageur pendant 30 minutes pour lui laisser le temps de payer. Sans paiement dans ce délai, la réservation est annulée et la place libérée. Si un paiement arrive après ce délai, la réservation est maintenue lorsque la place est encore libre ; sinon, le paiement est intégralement remboursé.",
          "La réservation est ferme dès la confirmation du paiement. Le voyageur reçoit alors un e-mail et un SMS de confirmation, avec sa référence, l’adresse et le téléphone du parking et un lien vers [Ma réservation](/ma-reservation), où il peut la consulter et, selon les conditions applicables, la modifier ou l’annuler. S’il ne reçoit rien dans l’heure, il vérifie ses courriers indésirables puis contacte le service client.",
          "Les disponibilités affichées sont calculées en temps réel sur la capacité du parking. Si, exceptionnellement, le parking ne peut pas honorer une réservation confirmée, il prévient le voyageur au plus tôt et peut lui proposer une solution équivalente, que le voyageur est libre de refuser ; dans ce cas, la réservation est annulée et intégralement remboursée.",
        ],
      },
      {
        id: "paiement",
        title: "6. Paiement",
        blocks: [
          "Le prix est payé en totalité en ligne, au moment de la réservation, par carte bancaire ou, selon l’appareil, par Apple Pay ou Google Pay. Rien n’est à régler au parking pour la prestation réservée.",
          `${p} encaisse le prix au nom et pour le compte du parking, par l’intermédiaire de son prestataire de paiement Stripe, puis reverse au parking sa part, commission déduite. Le paiement fait à ${p} vaut paiement au parking.`,
          `Le paiement s’effectue sur les pages sécurisées de Stripe : ${p} ne reçoit ni ne conserve les données de carte bancaire.`,
          "Les remboursements sont faits sur le moyen de paiement utilisé et apparaissent en général sous 5 à 10 jours, selon la banque.",
          `Le parking, qui fournit la prestation, en est le vendeur ; la facture de la prestation peut lui être demandée directement ou par l’intermédiaire de ${p}.`,
        ],
      },
      {
        id: "annulation",
        title: "7. Modification et annulation",
        blocks: [
          "Chaque parking choisit ses conditions d’annulation parmi les suivantes. Elles figurent sur sa fiche et sont rappelées avant le paiement et dans la confirmation :",
          [
            "annulation gratuite jusqu’à l’heure de dépôt prévue ;",
            "annulation gratuite jusqu’à 24 heures avant l’heure de dépôt prévue ;",
            "annulation gratuite jusqu’à 48 heures avant l’heure de dépôt prévue ;",
            "non annulable : aucun remboursement en cas d’annulation par le voyageur.",
          ],
          "Dans le délai d’annulation gratuite, le voyageur annule lui-même depuis Ma réservation, sur le site ou dans l’application : le prix est intégralement remboursé, automatiquement.",
          "Après ce délai, ou pour une réservation non annulable, l’annulation en ligne n’est plus possible et le prix reste dû. Le voyageur peut s’adresser au parking, libre d’accepter un geste commercial. Un retour anticipé, un dépôt plus tardif que prévu ou l’absence au rendez-vous ne donnent lieu à aucun remboursement.",
          "Si le parking annule la réservation, le voyageur est intégralement remboursé.",
          "Les numéros de vol aller et retour se modifient en ligne depuis Ma réservation jusqu’au retour. Pour toute autre modification (dates, heures, véhicule), le voyageur contacte le parking ; à défaut d’accord, il peut annuler dans les conditions ci-dessus et réserver à nouveau.",
        ],
      },
      {
        id: "retractation",
        title: "8. Droit de rétractation",
        blocks: [
          "La réservation porte sur une prestation de stationnement fournie à une date ou pendant une période déterminée. En application de l’article L221-28, 12°, du Code de la consommation, elle n’ouvre pas droit au délai de rétractation de quatorze jours : seules s’appliquent les conditions d’annulation du parking (article 7).",
        ],
      },
      {
        id: "depot",
        title: "9. Le jour du départ",
        blocks: [
          "Le voyageur se présente au parking à la date et à l’heure de dépôt réservées, avec sa référence de réservation. Il prévoit le temps de navette indiqué sur la fiche, en plus du délai conseillé par sa compagnie aérienne.",
          "En cas d’avance ou de retard, il prévient le parking, par téléphone ou depuis l’application (« Prévenez le parking de votre arrivée »). Un retard non signalé peut allonger l’attente de la navette.",
          `Ni ${p} ni le parking ne sont responsables d’un vol manqué en raison d’une arrivée tardive du voyageur au parking ou d’informations inexactes qu’il a fournies.`,
          "Sauf mention contraire sur la fiche du parking, la réservation vaut pour une voiture particulière de dimensions courantes. Pour un utilitaire, un camping-car, un véhicule surélevé ou attelé, le voyageur vérifie auprès du parking avant de réserver : le parking peut le refuser ou appliquer le supplément prévu par ses conditions.",
          "Le véhicule doit être assuré, en état de circuler et conforme à la réglementation. Il est conseillé de n’y laisser aucun objet de valeur.",
        ],
      },
      {
        id: "voiturier",
        title: "10. Voiturier et clés confiées",
        blocks: [
          "Lorsque le parking assure un service de voiturier, le voyageur lui remet ses clés et autorise son personnel à conduire et déplacer le véhicule pour les besoins de la prestation : le garer, le ranger selon les dates de retour, le préparer pour la restitution. Les clés restent au parking pendant tout le séjour et sont rendues avec le véhicule.",
          "Le parking assure son activité, y compris la conduite des véhicules qui lui sont confiés ; le voyageur garde sa propre assurance automobile.",
        ],
      },
      {
        id: "retour",
        title: "11. Le retour et la navette",
        blocks: [
          "Pour retrouver le véhicule plus vite, le parking note sa place, et le parking ou le voyageur peut enregistrer sa position GPS ; cette position est effacée deux jours après le retour.",
          "Grâce au numéro de vol retour, le parking suit l’heure d’atterrissage : le voyageur reçoit un SMS à l’atterrissage avec le point de rendez-vous de la navette. S’il change de vol, il le met à jour dans Ma réservation ou prévient le parking.",
          "Les horaires de vol proviennent d’un service tiers de suivi des vols. Comme les heures de navette, la position des navettes en direct et les distances affichées, ils sont donnés à titre indicatif.",
          "Un retour après la date et l’heure réservées prolonge le séjour ; la prolongation est facturée par le parking, selon ses tarifs.",
          "À la restitution, le voyageur vérifie l’état de son véhicule avant de quitter le parking et signale tout dommage au personnel en le faisant constater (photos, mention écrite). Un signalement plus tardif reste possible, mais la preuve en est plus difficile.",
        ],
      },
      {
        id: "responsabilites",
        title: "12. Responsabilités",
        blocks: [
          "Le parking répond de l’exécution de la prestation de stationnement, de la garde et de la restitution du véhicule et des clés qui lui sont confiés, de la navette et du service de voiturier, dans les conditions prévues par la loi. Ses propres conditions générales de vente s’appliquent aussi à la prestation ; le voyageur peut les lui demander avant de réserver.",
          `${p} n’étant pas partie au contrat de stationnement, sa responsabilité ne peut être recherchée pour un manquement du parking dans l’exécution de la prestation. ${p} répond de ses propres manquements : fonctionnement de la plateforme, enregistrement et transmission de la réservation, paiement et remboursements.`,
          `Les fiches (photos, description, services, horaires, distance, durée de navette) sont rédigées par les parkings, sous leur responsabilité. ${p} les vérifie avant publication sans pouvoir en garantir l’exactitude à tout moment ; toute erreur peut lui être signalée.`,
          `Ni ${p} ni le parking ne répondent d’une inexécution due à un cas de force majeure au sens de l’article 1218 du Code civil.`,
          "Ces stipulations ne privent le voyageur d’aucun des droits que la loi lui reconnaît en tant que consommateur.",
        ],
      },
      {
        id: "reclamations",
        title: "13. Réclamations",
        blocks: [
          "Pendant le séjour, le voyageur s’adresse d’abord au parking, dont le téléphone figure sur la confirmation et dans Ma réservation.",
          `Pour une réclamation sur la prestation (dommage, perte, attente excessive, service non rendu), le voyageur contacte le parking et en informe ${p} à ${c.email}, avec sa référence et toute pièce utile (photos, échanges). ${p} transmet la réclamation au parking, communique ses coordonnées complètes sur demande et suit le dossier.`,
          `Si le parking n’a pas fourni la prestation réservée (parking fermé, absence de personnel, refus injustifié), le voyageur le signale à ${p} au plus vite, si possible le jour même, avec tout élément montrant sa présence (appel au parking, photo). Lorsque la réclamation est fondée, le prix est intégralement remboursé.`,
        ],
      },
      {
        id: "litiges",
        title: "14. Médiation et droit applicable",
        blocks: [
          "Ces conditions sont soumises au droit français.",
          `En cas de litige, le voyageur adresse d’abord une réclamation écrite au service client. S’il n’obtient pas satisfaction, il peut saisir gratuitement le médiateur de la consommation dans l’année qui suit sa réclamation : ${c.mediator}.`,
          "À défaut d’accord, le voyageur consommateur peut saisir, à son choix, l’une des juridictions territorialement compétentes selon le Code de procédure civile ou celle du lieu où il demeurait lors de la réservation (article R631-3 du Code de la consommation).",
        ],
      },
      {
        id: "donnees",
        title: "15. Données personnelles",
        blocks: [
          `${p} et le parking utilisent les informations de la réservation pour l’exécuter : confirmation, accueil, navette, suivi des vols, messages pratiques (e-mail, SMS, notifications de l’application) et restitution du véhicule. ${p} ne s’en sert pas pour de la prospection commerciale sans l’accord du voyageur et ne les vend pas.`,
          "Le partage de la position du voyageur à son arrivée est facultatif ; la position n’est gardée que jusqu’à l’arrivée, deux heures au plus, puis effacée.",
          "Le détail des traitements, leurs durées de conservation et les droits du voyageur (accès, rectification, effacement, opposition) figurent dans la [politique de confidentialité](/confidentialite).",
        ],
      },
      {
        id: "utilisation",
        title: "16. Utilisation du site et des applications",
        blocks: [
          `Le voyageur s’engage à réserver de bonne foi. Sont notamment interdits les réservations fictives, l’extraction automatisée du contenu et toute atteinte au fonctionnement du service.`,
          `Le site et les applications contiennent des liens vers des services tiers (cartes, itinéraires, compagnies aériennes, paiement), dont ${p} ne contrôle pas le contenu.`,
          "Les contenus du site et des applications sont protégés : voir les [mentions légales](/mentions-legales).",
        ],
      },
      {
        id: "modification",
        title: "17. Modification des conditions",
        blocks: [
          `${p} peut faire évoluer ces conditions. Une réservation reste régie par la version acceptée au moment où elle a été faite.`,
        ],
      },
    ],
  };
}

/** Mentions légales: publisher, hosting, intellectual property, personal data and cookies. */
export function legalNoticeDoc(company: Company = COMPANY, email: string = SUPPORT_EMAIL, p: string = PRODUCT_NAME): LegalDoc {
  const c = identity(company, email);
  return {
    title: fr.legal.legalNotice,
    version: LEGAL_VERSION,
    lead: `Informations sur l’éditeur et l’hébergeur du site ${p} et des applications ${p} et ${p} Pro.`,
    sections: [
      {
        id: "editeur",
        title: "Éditeur",
        blocks: [
          `${p} est une marque de ${c.name}.`,
          [
            `Dénomination : ${c.name}`,
            `Forme juridique et capital : ${c.legalForm}, au capital de ${c.shareCapital}`,
            `Siège social : ${c.address}`,
            `Immatriculation : ${c.registration}`,
            `TVA intracommunautaire : ${c.vatNumber}`,
            `E-mail : ${c.email}`,
            `Téléphone : ${c.phone}`,
          ],
          `Directeur de la publication : ${c.publicationDirector}.`,
        ],
      },
      {
        id: "hebergement",
        title: "Hébergement",
        blocks: [
          "Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (vercel.com). Les traitements du site s’exécutent dans la région de Paris (France).",
        ],
      },
      {
        id: "propriete",
        title: "Propriété intellectuelle",
        blocks: [
          `La marque ${p}, ses logos, les textes, la mise en page et le code du site et des applications appartiennent à ${c.name} ou sont utilisés avec l’accord de leurs titulaires. Toute reproduction ou réutilisation sans autorisation écrite est interdite.`,
          "Les photos et descriptions des parkings sont fournies par leurs exploitants, qui en garantissent les droits.",
          "Fonds de carte et photographies aériennes : © IGN – Géoplateforme (Plan IGN, BD ORTHO), sous Licence Ouverte Etalab 2.0.",
          "Les autres marques citées (aéroports, compagnies aériennes, moyens de paiement) appartiennent à leurs titulaires.",
        ],
      },
      {
        id: "donnees",
        title: "Données personnelles et cookies",
        blocks: [
          "Les données des voyageurs sont traitées comme décrit dans la [politique de confidentialité](/confidentialite).",
          "Le site ne dépose aucun cookie publicitaire ni de mesure d’audience. Il n’utilise que des cookies nécessaires à son fonctionnement : l’accès à une réservation depuis le lien reçu par e-mail ou SMS, et la reprise d’un formulaire de réservation en cours.",
        ],
      },
      {
        id: "signalement",
        title: "Signaler un contenu",
        blocks: [
          `Pour signaler un contenu illicite ou inexact (fiche de parking, photo, texte), écrivez à ${c.email} en précisant la page concernée.`,
        ],
      },
    ],
  };
}

/** Politique de confidentialité: what the platform does with personal data, as built (06/10/2026). */
export function privacyDoc(company: Company = COMPANY, email: string = SUPPORT_EMAIL, p: string = PRODUCT_NAME): LegalDoc {
  const c = identity(company, email);
  return {
    title: fr.legal.privacy,
    version: LEGAL_VERSION,
    lead: `Cette politique explique quelles données personnelles ${p} traite quand vous utilisez le site ou les applications ${p} et ${p} Pro, pourquoi, avec qui elles sont partagées, combien de temps elles sont gardées et comment exercer vos droits. Nous ne collectons que ce qui sert à votre séjour.`,
    sections: [
      {
        id: "responsable",
        title: "1. Qui est responsable de vos données",
        blocks: [
          `${c.name}, qui exploite ${p} (siège : ${c.address}), est responsable des traitements liés au site, aux applications et aux réservations faites sur ${p}. Contact pour vos données : ${c.email}.`,
          "Le parking que vous réservez reçoit les informations de votre réservation pour vous accueillir, garer votre véhicule, organiser la navette et vous le rendre. Il en est responsable pour ces usages, comme pour ses propres registres.",
          `Lorsque vous réservez directement auprès d’un parking (téléphone, comptoir, autre site) et que celui-ci gère ses réservations avec ${p}, y compris en transférant à ${p} les e-mails de confirmation qu’il reçoit, c’est le parking qui est responsable de vos données ; ${p} les traite pour son compte, comme sous-traitant, et vous pouvez exercer vos droits auprès de lui comme auprès de nous.`,
        ],
      },
      {
        id: "donnees",
        title: "2. Les données que nous traitons",
        blocks: [
          "Quand vous réservez :",
          [
            "prénom et nom, téléphone mobile, adresse e-mail ;",
            "plaque d’immatriculation, et modèle et couleur du véhicule si vous les indiquez ;",
            "dates et heures de dépôt et de retour, nombre de passagers, desserte de la navette le cas échéant ;",
            "numéros de vol aller et retour, si vous les indiquez, et les horaires de ces vols (décollage, atterrissage, terminal).",
          ],
          "Quand vous payez : le montant, l’adresse e-mail transmise à Stripe et les identifiants des opérations (paiement, remboursement). Vos données de carte sont saisies chez Stripe : nous ne les voyons pas.",
          "Pendant votre séjour :",
          [
            "la place de votre véhicule et le crochet de ses clés, notés par le parking ;",
            "la position GPS de votre voiture, si le voiturier ou vous-même l’enregistrez, avec une note facultative ;",
            "votre position, seulement si vous choisissez de la partager pour prévenir le parking de votre arrivée (dernière position uniquement), ou le délai que vous annoncez à la place ;",
            "ce que vous écrivez au parking : un mot à la réservation ou à votre arrivée, un message sur votre retour (vol retardé, bagages…) ;",
            "le statut de la réservation et l’historique de ses modifications par l’équipe du parking.",
          ],
          "Dans l’application : l’identifiant d’abonnement aux notifications de votre téléphone, si vous les autorisez, et, sur le téléphone lui-même, les références et clés d’accès de vos réservations.",
          "Quand vous naviguez : votre adresse IP, utilisée un court instant pour limiter les abus, et les cookies nécessaires au fonctionnement du site (voir l’article 9).",
          "Quand vous nous écrivez : votre message et nos échanges.",
        ],
      },
      {
        id: "finalites",
        title: "3. Pourquoi, et sur quelle base",
        blocks: [
          [
            "Enregistrer et confirmer votre réservation, encaisser le paiement, rembourser une annulation, transmettre la réservation au parking : exécution du contrat.",
            "Vous envoyer les messages pratiques du séjour (confirmation, rappel la veille, voiture garée, atterrissage, navette, fin de séjour, annulation) par e-mail, SMS ou notification : exécution du contrat.",
            "Suivre vos vols pour caler la navette : exécution du contrat.",
            "Partager votre position à l’arrivée, enregistrer vous-même la position de votre voiture, recevoir des notifications sur votre téléphone : votre consentement, que vous retirez à tout moment (arrêt du partage, effacement de la position, réglages du téléphone).",
            `Sécuriser le service, prévenir la fraude et les abus, garder la trace des modifications des réservations, traiter vos réclamations et défendre nos droits : intérêt légitime de ${p} et du parking.`,
            "Tenir la comptabilité et répondre aux autorités : obligation légale.",
          ],
          `${p} ne vend pas vos données, ne fait pas de publicité ciblée et ne vous envoie pas de prospection commerciale sans votre accord. Les notifications envoyées par ${p} pendant un séjour ne portent que sur le service (par exemple une perturbation à l’aéroport).`,
        ],
      },
      {
        id: "destinataires",
        title: "4. Qui reçoit vos données",
        blocks: [
          "L’équipe du parking réservé (accueil, voituriers, chauffeurs, gérant), qui ne voit que les réservations de son parking.",
          "Nos prestataires, qui agissent sur nos instructions et seulement pour ce service :",
          [
            `Vercel (hébergement du site et de l’API, fonctions exécutées à Paris) et Neon (base de données, région ${TO_COMPLETE}) ;`,
            "Stripe (paiement et remboursements) ; Stripe traite aussi certaines données en tant que responsable distinct, pour ses obligations de lutte contre la fraude et le blanchiment ;",
            "Brevo (e-mails et, selon le choix du parking, SMS) ;",
            "Cloudflare (réception des e-mails de confirmation que les parkings nous transfèrent, relayés aussitôt vers notre serveur) ;",
            "selon le choix du parking, l’application SMS Gateway for Android, qui envoie les SMS depuis le téléphone du parking : votre numéro et le texte du message passent alors par le serveur de cette application ;",
            "OneSignal (notifications de l’application) ;",
            "un fournisseur de suivi des vols, qui ne reçoit que le numéro et la date du vol, jamais votre nom ;",
            "l’IGN (Géoplateforme), dont les serveurs fournissent les fonds de carte à votre navigateur ou à l’application.",
          ],
          "Les autorités, uniquement lorsque la loi l’exige.",
          "Pendant un trajet de navette, les passagers concernés voient le prénom du chauffeur, le véhicule et, si le parking a choisi de la montrer, sa position ; les autres voyageurs ne voient jamais vos informations.",
        ],
      },
      {
        id: "transferts",
        title: "5. Transferts hors de l’Union européenne",
        blocks: [
          "Certains prestataires (Vercel, Neon, Stripe, OneSignal, Cloudflare) sont des sociétés américaines et peuvent accéder aux données depuis les États-Unis. Ces transferts sont encadrés par la décision d’adéquation de la Commission européenne pour les sociétés adhérant au Data Privacy Framework UE–États-Unis, ou à défaut par les clauses contractuelles types de la Commission européenne.",
        ],
      },
      {
        id: "conservation",
        title: "6. Combien de temps",
        blocks: [
          [
            "Réservation (identité, coordonnées, véhicule, vols, notes et messages au parking, y compris dans l’historique de ses modifications) : pendant le séjour, puis 12 mois après la date de retour pour traiter les réclamations et litiges. Elle est ensuite anonymisée automatiquement : il ne reste que sa référence, le parking, les dates, le nombre de passagers et les montants.",
            "Éléments comptables (référence, dates, montants, paiements et remboursements) : 10 ans, comme l’impose le Code de commerce.",
            "Accès à Ma réservation par le lien reçu par e-mail ou SMS : jusqu’à 30 jours après le retour.",
            "Position partagée à l’arrivée : seule la dernière est gardée ; elle est effacée à l’arrivée, à l’arrêt du partage et au plus tard 2 heures après le début.",
            "Position GPS de la voiture : effacée 2 jours après le retour.",
            "Téléphones inscrits aux notifications du séjour : supprimés 2 jours après le retour.",
            "File d’envoi des SMS (numéro du destinataire ; le texte n’est pas conservé) : 30 jours.",
            "E-mails de confirmation transférés par un parking : texte effacé après 30 jours, trace de réception supprimée après 90 jours.",
            "Adresse IP : quelques minutes en mémoire pour limiter les abus ; les journaux techniques de l’hébergeur sont gardés quelques jours au plus.",
            "Sur votre téléphone : les références de vos réservations restent dans l’application jusqu’à ce que vous les retiriez ou que vous la désinstalliez.",
          ],
        ],
      },
      {
        id: "securite",
        title: "7. Sécurité",
        blocks: [
          "Les échanges sont chiffrés (HTTPS). Chaque membre d’une équipe a son propre compte, ses droits dépendent de son rôle et il ne voit que les réservations de son parking ; les mots de passe sont stockés sous forme hachée et les modifications des réservations sont tracées.",
          "Le lien de votre réservation contient une clé secrète : ne le transférez qu’à des personnes de confiance. En cas de doute, le parking peut le désactiver ; vous retrouvez alors l’accès depuis [Ma réservation](/ma-reservation) avec votre référence et votre e-mail.",
          `Aucune donnée de carte bancaire n’est stockée par ${p}.`,
        ],
      },
      {
        id: "droits",
        title: "8. Vos droits",
        blocks: [
          "Vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation de leur traitement ou leur portabilité, et vous opposer à un traitement fondé sur l’intérêt légitime. Vous pouvez retirer votre consentement à tout moment, sans effet sur ce qui a été fait avant. Vous pouvez aussi définir des directives sur le sort de vos données après votre décès.",
          `Écrivez à ${c.email} ou à ${c.name}, ${c.address}, en indiquant si possible la référence de votre réservation. Nous répondons dans un délai d’un mois. Certaines données peuvent être gardées malgré une demande d’effacement lorsque la loi l’impose (comptabilité) ou pendant un séjour en cours.`,
          "Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (cnil.fr, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07).",
        ],
      },
      {
        id: "cookies",
        title: "9. Cookies",
        blocks: [
          "Le site ne dépose aucun cookie publicitaire ni de mesure d’audience, et ne demande donc pas de consentement. Il utilise seulement deux cookies nécessaires à son fonctionnement :",
          [
            "l’accès à votre réservation depuis le lien reçu par e-mail ou SMS, limité aux pages de cette réservation ;",
            "la reprise du formulaire de réservation quand vous revenez le modifier avant de payer.",
          ],
          "Les pages de paiement de Stripe déposent leurs propres cookies, nécessaires à la sécurité du paiement.",
        ],
      },
      {
        id: "professionnels",
        title: "10. Comptes des professionnels",
        blocks: [
          `Pour les équipes des parkings qui utilisent l’espace pro et l’application ${p} Pro, ${p} traite : prénom et nom, e-mail, téléphone facultatif, rôle, poste et véhicule du jour, préférences de notifications, mot de passe haché, sessions de connexion (30 jours au plus) et historique des actions sur les réservations. Pendant un trajet de navette, si le parking a activé le suivi, seule la dernière position du chauffeur est gardée ; elle est effacée à la fin du trajet. Le parking choisit qui la voit : personne (pas de suivi), son équipe seulement, ou aussi les voyageurs.`,
          `Ces données servent à fournir l’espace pro au parking, qui décide de son organisation ; elles sont gardées tant que le compte existe, puis le temps des obligations légales. Les informations de l’entreprise et du gérant fournies à l’inscription servent au contrat entre le parking et ${p}. Les droits ci-dessus s’exercent de la même façon.`,
        ],
      },
      {
        id: "modifications",
        title: "11. Modifications",
        blocks: [
          `${p} peut mettre à jour cette politique, notamment quand le service évolue. La date de version figure en haut de la page.`,
        ],
      },
    ],
  };
}
