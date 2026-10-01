import type { StaffRole } from "./types";
import { ApiError } from "./api";

// All user-facing strings live here so the interface can be translated later.
export const fr = {
  common: {
    save: "Enregistrer",
    saved: "Modifications enregistrées",
    never: "Jamais",
    loading: "Chargement…",
  },
  roles: {
    manager: "Gérant",
    agent: "Agent d'accueil",
    driver: "Chauffeur navette",
    valet: "Voiturier",
  } satisfies Record<StaffRole, string>,
  errors: {
    required: "Champ obligatoire.",
    too_long: "Texte trop long.",
    invalid_email: "Adresse email invalide.",
    invalid_role: "Rôle invalide.",
    integer: "Nombre entier attendu.",
    min_1: "Doit être au moins 1.",
    too_large: "Valeur trop grande.",
    margin_range: "Entre 0 et 50 %.",
    shuttle_range: "Entre 1 et 120 minutes.",
    password_too_short: "Au moins 10 caractères.",
    invalid_credentials: "Email ou mot de passe incorrect.",
    too_many_attempts: "Trop de tentatives. Réessayez dans 15 minutes.",
    email_taken: "Cette adresse email est déjà utilisée.",
    cannot_demote_self: "Vous ne pouvez pas retirer vos propres droits de gérant ni désactiver votre compte.",
    last_manager: "Il doit rester au moins un gérant actif.",
    wrong_current_password: "Mot de passe actuel incorrect.",
    forbidden: "Vous n'avez pas accès à cette action.",
    not_found: "Élément introuvable.",
    unauthorized: "Votre session a expiré. Reconnectez-vous.",
    validation_failed: "Certains champs sont à corriger.",
    network: "Le serveur ne répond pas. Vérifiez votre connexion.",
    unknown: "Une erreur est survenue. Réessayez.",
  } as Record<string, string>,
  login: {
    title: "Connexion",
    subtitle: "Espace professionnel",
    email: "Email",
    password: "Mot de passe",
    submit: "Se connecter",
    passwordChanged: "Mot de passe modifié. Reconnectez-vous.",
  },
  nav: {
    dashboard: "Tableau de bord",
    parking: "Parking",
    team: "Équipe",
    account: "Mon compte",
    logout: "Se déconnecter",
  },
  dashboard: {
    hello: (name: string) => `Bonjour ${name}`,
    totalCapacity: "Places au total",
    bookableCapacity: "Places réservables",
    safetyMargin: "Marge de sécurité",
    shuttle: "Trajet navette",
    minutes: (n: number) => `${n} min`,
    places: (n: number) => `${n} place${n > 1 ? "s" : ""}`,
    bookableHelp: "Capacité totale moins la marge de sécurité : c'est le plafond utilisé contre la surréservation.",
  },
  parking: {
    title: "Réglages du parking",
    name: "Nom du parking",
    address: "Adresse",
    totalCapacity: "Nombre de places au total",
    safetyMarginPct: "Marge de sécurité (%)",
    safetyMarginHelp: "Part des places jamais proposées à la réservation (imprévus, prolongations).",
    shuttleTravelMinutes: "Durée du trajet navette (minutes)",
    shuttleHelp: "Entre le parking et le terminal.",
    bookablePreview: (n: number) => `Places réservables avec ces réglages : ${n}`,
  },
  team: {
    title: "Équipe",
    add: "Ajouter un membre",
    name: "Nom",
    email: "Email",
    phone: "Téléphone",
    role: "Rôle",
    active: "Actif",
    inactive: "Désactivé",
    lastLogin: "Dernière connexion",
    password: "Mot de passe provisoire",
    passwordHelp: "À communiquer à la personne, qui le changera dans « Mon compte ».",
    create: "Créer le compte",
    created: "Compte créé",
    updated: "Membre mis à jour",
    deactivate: "Désactiver",
    reactivate: "Réactiver",
    resetPassword: "Nouveau mot de passe",
    passwordReset: "Mot de passe réinitialisé. Ses sessions ont été fermées.",
    you: "vous",
  },
  account: {
    title: "Mon compte",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    submit: "Changer le mot de passe",
  },
  notFound: {
    title: "Page introuvable",
    back: "Retour au tableau de bord",
  },
};

export function errorMessage(code: string | undefined): string {
  if (!code) return fr.errors.unknown;
  return fr.errors[code] ?? fr.errors.unknown;
}

/** French message for any error thrown by the API client. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) return errorMessage(error.code);
  if (error instanceof TypeError) return fr.errors.network;
  return fr.errors.unknown;
}

export const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });
