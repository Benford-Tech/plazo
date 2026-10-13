import { companyIdentity } from "./legal";
import { COMPANY, hasSupportEmail, PRODUCT_NAME, SUPPORT_EMAIL, type Company } from "./product";

/**
 * /suppression-compte (13/10/2026): how a member of a parking's team deletes their Plazo Pro account, asked by Apple
 * (App Review 5.1.1(v)) and Google Play (a web page to request it). Written from what the API does:
 * DELETE /internal/staff/me anonymises the member (« Compte supprimé »), deletes sessions, devices and Apple / Google
 * identities, revokes Apple's token; refused while a shuttle trip runs; the last manager is warned, not blocked.
 *
 * Texts: « **bold** » for the words of the app, « [label](/path) » for an internal link.
 */
export const ACCOUNT_DELETION_PATH = "/suppression-compte";

export interface Section {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface AccountDeletionPage {
  title: string;
  description: string;
  eyebrow: string;
  lead: string;
  steps: { title: string; items: string[]; notes: string[] };
  deleted: { title: string; items: string[] };
  kept: { title: string; items: string[] };
  /** Final, and « Quitter ce parking » to change parking instead. */
  definitive: Section;
  travellers: Section;
  contact: {
    title: string;
    intro: string;
    company: string;
    /** The support address, or null while product.json holds a placeholder (shown « [à compléter] »). */
    email: string | null;
    address: string;
    delay: string;
  };
}

export function accountDeletionPage(company: Company = COMPANY, email: string = SUPPORT_EMAIL, p: string = PRODUCT_NAME): AccountDeletionPage {
  const c = companyIdentity(company, email);
  const pro = `${p} Pro`;
  return {
    title: `Supprimer un compte ${pro}`,
    description: `Comment supprimer votre compte ${pro}, l’application des équipes des parkings : depuis l’application ou en nous écrivant, ce qui est effacé et ce qui reste.`,
    eyebrow: `${pro} · équipes des parkings`,
    lead: `${pro} est l’application des équipes des parkings partenaires de ${p} : gérants, accueil, chauffeurs et voituriers. Chacun peut supprimer son compte lui-même, à tout moment, depuis l’application.`,
    steps: {
      title: "Depuis l’application",
      items: [
        `Ouvrez **${pro}** et connectez-vous.`,
        "Touchez **Plus**, puis **Mon compte**.",
        "Touchez **Supprimer mon compte**.",
        "Confirmez avec **Apple**, **Google** ou votre **mot de passe**, selon votre façon de vous connecter.",
      ],
      notes: [
        "Votre demande pour rejoindre un parking est encore en attente ? Le lien **Supprimer mon compte** est sur l’écran d’attente.",
        "Un trajet de navette en cours doit d’abord être terminé.",
        "Vous êtes le dernier gérant de votre parking ? L’application vous prévient avant : nommez d’abord un autre gérant dans Équipe, sinon plus personne ne pourra gérer l’équipe.",
      ],
    },
    deleted: {
      title: "Ce qui est effacé",
      items: [
        "votre prénom, votre nom, votre adresse e-mail et votre téléphone ;",
        "votre mot de passe et vos sessions de connexion ;",
        `le lien avec votre identifiant Apple ou Google ; pour un compte lié à Apple, ${p} demande aussi à Apple de retirer l’accès de l’application ;`,
        "l’inscription de vos téléphones aux notifications ;",
        "vos demandes pour rejoindre un parking.",
      ],
    },
    kept: {
      title: "Ce qui reste",
      items: [
        "les trajets de navette que vous avez conduits et les actions que vous avez faites sur les réservations (arrivée, place, véhicule rendu…) restent dans l’historique du parking, avec la mention « Compte supprimé » à la place de votre nom ;",
        "les réservations elles-mêmes, qui appartiennent au parking et à ses clients.",
      ],
    },
    definitive: {
      id: "definitif",
      title: "Une suppression définitive",
      paragraphs: [
        `La suppression ne s’annule pas. Pour revenir, il faudra vous connecter de nouveau à ${pro}, taper le code du jour de votre parking et attendre qu’un gérant accepte votre demande.`,
        `Pour changer de parking sans supprimer votre compte, touchez plutôt **Quitter ce parking** dans **Mon compte** : vous quittez l’équipe, et vous pourrez rejoindre un autre parking avec son code du jour.`,
      ],
    },
    travellers: {
      id: "voyageurs",
      title: "Vous êtes voyageur ?",
      paragraphs: [
        `Les voyageurs n’ont pas de compte ${p} : une réservation se retrouve avec sa référence et son adresse e-mail dans [Ma réservation](/ma-reservation). Ses données sont anonymisées automatiquement 12 mois après la date de retour. Dans l’application ${p}, les références de vos réservations restent sur votre téléphone jusqu’à ce que vous les retiriez ou que vous désinstalliez l’application.`,
        "Pour faire effacer plus tôt les données d’une réservation, écrivez-nous à l’adresse indiquée plus haut, avec sa référence. Le détail des données et de leur durée de conservation est dans la [politique de confidentialité](/confidentialite).",
      ],
    },
    contact: {
      title: "Sans l’application",
      intro: `Vous ne pouvez plus ouvrir ${pro} ? Écrivez-nous depuis l’adresse e-mail de votre compte, en indiquant le nom de votre parking : nous supprimons le compte de la même façon. En attendant, votre gérant peut désactiver votre accès tout de suite depuis Équipe.`,
      company: c.name,
      email: hasSupportEmail(email) ? email : null,
      address: c.address,
      delay: "Nous répondons dans un délai d’un mois au plus.",
    },
  };
}
