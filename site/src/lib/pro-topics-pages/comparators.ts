import { PRODUCT_NAME } from "../product";
import type { ProTopic } from "../pro-topics";

const P = PRODUCT_NAME;

/**
 * One page per comparator (17/11/2026, « ameliore le SEO plazo pro »): what Plazo Pro does with the notices each one sends,
 * only what is true today (CLAUDE.md, block 1), no technical words, no partnership claimed.
 */
export const COMPARATOR_TOPICS = {
  allopark: {
    slug: "allopark",
    updated: "2026-11-17",
    label: "Allopark",
    metaTitle: `Réservations Allopark dans votre planning · ${P} Pro`,
    metaDescription: `Vos réservations Allopark créées seules dans votre planning, modifications appliquées, renseignements complétés. Logiciel de parking d’aéroport.`,
    title: "Vos réservations Allopark,",
    accent: "sans les recopier",
    lead: `Chaque confirmation d’Allopark devient une réservation dans votre planning, avec le nom, les dates, la plaque, le vol et le prix. Quand le client change ses dates, ${P} Pro met la réservation à jour.`,
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Le mail de confirmation d’Allopark arrive, mais il ne dit pas tout : souvent, les renseignements du client sont sur la page de la réservation, pas dans le mail. Quelqu’un ouvre le lien, relève le téléphone, la plaque et le vol retour, puis les recopie dans un tableau ou un cahier, entre deux clients au comptoir.",
        "Puis le client décale son retour de deux jours. Un nouveau mail « Modification de votre réservation » arrive, presque identique au premier. Il faut retrouver la bonne ligne, comparer, corriger la date, vérifier qu’il reste de la place ces nuits-là. Une modification lue trop vite, et la navette part chercher quelqu’un qui n’est pas encore rentré.",
      ],
    },
    gains: [
      { title: "Créée seule", text: "Une confirmation Allopark complète devient une réservation, avec la référence AL-…, sans que personne ne la tape." },
      { title: "Les renseignements complétés", text: "Quand le mail ne donne pas le téléphone, la plaque ou le vol, la page de la réservation est lue pour les retrouver, avec le prix payé." },
      { title: "Les modifications appliquées", text: "Dates, passagers, plaque, vols, téléphone, véhicule, prix : chaque changement est appliqué et noté sur une ligne." },
      { title: "Les cas risqués laissés à l’équipe", text: "Une voiture déjà arrivée, une réservation close, plus de place ces nuits-là : rien ne bouge, et la raison est écrite." },
      { title: "Votre prix reste le vôtre", text: "Si vous corrigez le prix d’une réservation, une modification Allopark ne le touche que si Allopark a changé son montant." },
      { title: "Ce qu’Allopark vous coûte", text: "Posez son taux de commission une fois : vous voyez, réservation par réservation, ce que vous gardez." },
    ],
    screens: [
      {
        title: "Boîte de réception",
        rows: [
          { hour: "06:12", text: "Confirmation de votre réservation AL-884880719", pill: { tone: "ok", label: "Importé" } },
          { hour: "09:48", text: "Modification de votre réservation AL-884512230", pill: { tone: "ok", label: "Modification" } },
          { hour: "11:05", text: "Annulation · réservation AL-883970114", pill: { tone: "warn", label: "À traiter" } },
        ],
      },
      {
        title: "Modification appliquée",
        rows: [
          { text: "Réservation AL-884512230 · Martin" },
          { text: "Date de retour : 13 déc. 20:30 → 15 déc. 18:00" },
          { text: "Vol retour : TO 3627 → TO 3631", pill: { tone: "info", label: "Allopark" } },
        ],
      },
      {
        title: "Fiche réservation",
        rows: [
          { text: "Prix payé · 54,00 €" },
          { text: "Commission Allopark − 9,72 € · 18 %", pill: { tone: "warn", label: "Commission" } },
          { text: "Vous gardez 44,28 €", pill: { tone: "ok", label: "Net" } },
        ],
      },
    ],
    sections: [
      {
        title: "De la confirmation à la réservation",
        paragraphs: [
          `Votre parking a son adresse de réception dès son inscription sur ${P} Pro. Vous la donnez à Allopark comme adresse de notification, ou vous faites suivre ses mails depuis votre messagerie : un assistant vous guide pour Gmail, Outlook et les autres. À partir de là, chaque confirmation Allopark est reconnue à sa mise en page, même transférée à la main.`,
          "La réservation est créée avec la référence AL-…, le nom du client, ses dates à l’heure de votre parking, le nombre de passagers et le prix payé, sans les frais d’Allopark. Comme le mail laisse souvent vides les renseignements du client, la page de la réservation est lue pour retrouver le téléphone, la plaque, le modèle de la voiture et les vols. Si la page n’affiche pas encore la réservation, un nouvel essai se fait plus tard, tout seul, plusieurs fois. Si Allopark demande de prouver qu’on n’est pas un robot, rien n’est forcé : le mail attend avec un lien « Ouvrir la page Allopark », pour la passer vous-même.",
          "Un vol mal écrit par le client ne bloque rien : la réservation est créée, et ce qu’il a tapé est gardé dans les notes. Sans plaque, la réservation est créée quand même ; la plaque se note à l’arrivée de la voiture.",
        ],
      },
      {
        title: "Quand le client change ses dates",
        paragraphs: [
          "Un mail « Modification de votre réservation AL-… » est reconnu comme tel. La réservation est comparée champ par champ à son état actuel : dates, passagers, plaque, vols, téléphone, nom, e-mail, véhicule et prix. Les changements sont appliqués, la place des nouvelles nuits est vérifiée, et la boîte de réception affiche une ligne par changement, comme « Date de retour : 13 déc. 20:30 → 15 déc. 18:00 ». L’équipe reçoit une notification « Réservation modifiée · Allopark ».",
          "Si la réservation avait été saisie au téléphone sans sa référence, elle est retrouvée par la plaque, ou par le téléphone et le nom, et la référence lui est ajoutée. Plusieurs réservations possibles ? Rien n’est choisi au hasard : le mail est marqué « Plusieurs réservations correspondent : à faire à la main ».",
          "Ce qui est risqué n’est jamais appliqué seul : une arrivée déplacée alors que la voiture est déjà là, une réservation déjà rendue ou annulée, des nuits déjà complètes. Le mail reste « À faire à la main », avec la raison et les changements demandés. Pour une réservation close, l’équipe peut créer la nouvelle réservation d’un clic, avec les nouvelles valeurs déjà remplies.",
        ],
      },
      {
        title: "Et les annulations ?",
        paragraphs: [
          "Une annulation Allopark n’est pas appliquée toute seule. Elle arrive dans « À traiter », marquée « Annulation », à côté de la réservation qu’elle nomme, et un membre de l’équipe l’annule en un geste. C’est un choix de prudence : une place libérée par erreur est une voiture qu’on n’attend plus.",
          "Depuis la fiche d’une réservation, vous retrouvez le mail qui l’a créée et ceux qui l’ont modifiée ou annulée, avec ce que chacun a changé.",
        ],
      },
      {
        title: "Ce qui se met en place le premier jour",
        paragraphs: [
          "Vous inscrivez votre parking, vous donnez l’adresse de réception à Allopark ou vous créez la règle de transfert, et la prochaine confirmation apparaît dans la boîte de réception avec ce que Plazo Pro en a compris. Un mail arrivé ailleurs se colle dans la boîte de réception avec « Coller un mail », et il est lu de la même façon.",
          "Vous posez le taux de commission d’Allopark avec sa date d’effet. Le chiffre d’affaires se lit brut ou net de commissions, et la page Statistiques compare ce que chaque plateforme vous laisse par réservation.",
          "La veille du dépôt, le client Allopark reçoit votre message avec l’heure et le lieu du rendez-vous, comme vos autres clients. Il retrouve sa réservation avec son numéro AL-… et son e-mail ou son téléphone.",
        ],
      },
    ],
    faq: [
      [`${P} Pro est-il partenaire d’Allopark ?`, `Non. ${P} Pro lit les mails qu’Allopark vous envoie déjà, et la page de la réservation à laquelle ces mails mènent. Vous gardez votre compte Allopark et vos conditions avec lui.`],
      ["Une modification Allopark est-elle appliquée sans moi ?", "Oui, quand elle est sans risque : dates, passagers, plaque, vols, téléphone, véhicule ou prix. Une arrivée déplacée alors que la voiture est là, une réservation close ou des nuits complètes restent à l’équipe, avec la raison."],
      ["Et une annulation Allopark ?", "Elle n’est pas appliquée seule. Elle arrive dans « À traiter », marquée « Annulation », et vous l’annulez en un geste."],
      ["J’ai déjà saisi la réservation au téléphone. Elle sera en double ?", "Non. Le mail est rattaché à la réservation du même voyageur pour la même arrivée, au lieu d’en créer une seconde."],
      ["Le prix compté est-il celui du client ?", "C’est le prix du parking payé par le client, sans les frais d’Allopark. Vous pouvez le corriger ensuite ; votre correction reste tant qu’Allopark ne change pas son montant."],
      ["Combien ça coûte ?", "De 99 € à 299 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["comparateurs", "onepark", "parkvia"],
  },
  onepark: {
    slug: "onepark",
    updated: "2026-11-17",
    label: "Onepark",
    metaTitle: `Réservations Onepark dans votre planning · ${P} Pro`,
    metaDescription: `Avis Onepark lus seuls : réservations créées, annulations et modifications appliquées, récapitulatif du jour rapproché. Pour parkings d’aéroport.`,
    title: "Les avis Onepark,",
    accent: "rangés dans votre planning",
    lead: "Nouvelle réservation, modification, annulation, récapitulatif du jour : chaque avis que Onepark envoie à votre parking met votre planning à jour, sans ressaisie.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Onepark écrit souvent à votre parking : un avis à chaque réservation, un autre quand le client la modifie ou l’annule, et un récapitulatif des séjours en cours et à venir. Chaque avis a sa forme : parfois le tableau complet, parfois quelques lignes, la date écrite en toutes lettres et le nom en un seul bloc.",
        "Tout cela se lit à la main et se reporte à la main. Une annulation qui passe inaperçue, et la place reste bloquée pour un client qui ne viendra pas. Un récapitulatif jamais comparé au planning, et une réservation oubliée apparaît le matin même, au comptoir.",
      ],
    },
    gains: [
      { title: "Avis long ou court", text: "L’avis complet comme l’avis en quelques lignes créent la réservation : nom, téléphone, dates, montant, et le reste quand il est donné." },
      { title: "Annulations appliquées", text: "Une annulation Onepark annule la réservation et libère sa place, tant que la voiture n’est pas arrivée." },
      { title: "Modifications appliquées", text: "Quand le client change sa réservation, les nouveaux renseignements sont reportés, avec une ligne par changement." },
      { title: "Le récapitulatif du jour", text: "Chaque séjour du récapitulatif complète la réservation qui lui correspond, et celles qui manquent sont créées." },
      { title: "Retrouvée sans son numéro", text: "Une réservation saisie au téléphone sans le numéro Onepark est retrouvée par le voyageur et l’arrivée." },
      { title: "Votre marge Onepark", text: "Le taux de commission de Onepark posé une fois, vous lisez ce que vous gardez sur chaque réservation." },
    ],
    screens: [
      {
        title: "Boîte de réception · Onepark",
        rows: [
          { hour: "07:02", text: "Nouvelle réservation · #5916717", pill: { tone: "ok", label: "Importé" } },
          { hour: "10:31", text: "Annulation de la réservation #5908369", pill: { tone: "ok", label: "Annulée" } },
          { hour: "14:20", text: "Le client a modifié la réservation #5904227", pill: { tone: "ok", label: "Modification" } },
        ],
      },
      {
        title: "Récapitulatif du jour",
        rows: [
          { text: "12 séjours lus · 9 déjà dans votre planning" },
          { text: "2 créées · téléphone à saisir", pill: { tone: "warn", label: "À compléter" } },
          { text: "1 annulée dans votre planning", pill: { tone: "info", label: "Signalée" } },
        ],
      },
    ],
    sections: [
      {
        title: "Chaque avis de réservation",
        paragraphs: [
          "L’avis complet que Onepark envoie au parking donne le prénom, le nom, le portable, le début et la fin du forfait, le montant, le modèle de la voiture, la plaque, le nombre de passagers et le vol retour. La réservation est créée avec tout cela ; l’heure de retour est celle de la récupération prévue quand l’avis la donne, sinon la fin du forfait.",
          "L’avis court ne dit que l’essentiel : la date écrite en lettres, comme « ven. 23 oct. 2026 à 09:00 », le nom entier, le téléphone et le montant, sans numéro ni plaque. Il crée aussi la réservation : le nom est découpé en prénom et nom, et si le même voyageur a déjà été saisi pour la même arrivée, le mail lui est rattaché au lieu d’en faire une seconde. Un numéro étranger, suisse par exemple, est gardé tel quel.",
        ],
      },
      {
        title: "Les annulations et les modifications",
        paragraphs: [
          "L’avis « Annulation de la réservation #… » que Onepark envoie au parking annule la réservation de ce numéro, libère sa file ou sa place et ajoute la note « Annulée par Onepark (mail d’annulation). ». L’équipe en est prévenue. Si la réservation avait été saisie sans son numéro, elle est retrouvée par le voyageur : la plaque, ou le téléphone et un mot du nom, et la même arrivée. Le numéro lui est ajouté au passage.",
          "Rien n’est annulé quand la voiture est déjà au parking, que la réservation est close ou que plusieurs réservations correspondent : le mail attend « À faire à la main », avec la raison. Les mêmes mots écrits ailleurs, par exemple par la personne qui transfère le mail, ne suffisent jamais à annuler.",
          "L’avis « Le client … a modifié la réservation #… » est appliqué comme une modification : la réservation de ce numéro est mise à jour, sinon celle saisie sans lui, sinon elle est créée. Elle n’est jamais recréée si un autre mail a déjà annulé ce numéro.",
        ],
      },
      {
        title: "Le récapitulatif, rapproché de votre planning",
        paragraphs: [
          "Le mail « Voici le résumé des réservations en cours et à venir » liste chaque séjour avec son numéro, le nom, la plaque, l’arrivée et le départ. Chaque séjour complète la réservation qui porte ce numéro, ou la seule réservation Onepark sans numéro à la même arrivée avec le même nom : le numéro est ajouté, la plaque aussi quand elle manque, jamais remplacée.",
          "Un séjour à venir qui n’est pas dans votre planning est créé, avec un téléphone à saisir puisque le récapitulatif n’en donne pas. Une réservation que vous avez annulée est signalée, jamais modifiée ni recréée. Le mail passe ensuite dans « Traités », avec un résumé de ce qui reste à voir.",
        ],
      },
      {
        title: "Ce qui se met en place le premier jour",
        paragraphs: [
          "Vous donnez l’adresse de réception de votre parking à Onepark, ou vous faites suivre ses mails depuis votre messagerie. Le premier avis apparaît dans la boîte de réception, reconnu comme Onepark. Un avis reçu ailleurs se colle avec « Coller un mail ».",
          "Le taux de commission de Onepark se pose une fois, avec sa date d’effet ; un nouveau taux ne change jamais les réservations faites avant. Le chiffre d’affaires se lit brut ou net, et la page Statistiques montre ce que Onepark vous laisse par réservation face à vos autres canaux.",
          "Votre client Onepark reçoit votre message la veille de son dépôt, et retrouve sa réservation avec son numéro Onepark, comme « #5908369 », et son e-mail ou son téléphone.",
        ],
      },
    ],
    faq: [
      [`${P} Pro est-il partenaire de Onepark ?`, `Non. ${P} Pro lit les avis que Onepark envoie déjà à votre parking. Vous gardez votre compte Onepark et vos conditions avec lui.`],
      ["Une annulation Onepark est-elle appliquée toute seule ?", "Oui, tant que la voiture n’est pas arrivée et qu’une seule réservation correspond. Sinon, le mail attend l’équipe avec la raison."],
      ["L’avis court suffit-il à créer la réservation ?", "Oui. Le nom, le téléphone, les dates et le montant suffisent ; la plaque se note à l’arrivée de la voiture."],
      ["À quoi sert le récapitulatif du jour ?", "Il complète les réservations de votre planning (numéro, plaque) et crée les séjours à venir qui manquent, avec un téléphone à saisir."],
      ["J’ai saisi un client Onepark au téléphone. Que se passe-t-il ?", "Le mail de Onepark qui arrive ensuite pour le même voyageur et la même arrivée lui est rattaché, et son numéro lui est ajouté."],
      ["Combien ça coûte ?", "De 99 € à 299 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["comparateurs", "allopark", "parkvia"],
  },
  parkvia: {
    slug: "parkvia",
    updated: "2026-11-17",
    label: "ParkVia",
    metaTitle: `Réservations ParkVia dans votre planning · ${P} Pro`,
    metaDescription: `Notifications ParkVia lues seules : réservation créée avec numéro, dates et téléphone, annulation appliquée tant que la voiture n’est pas arrivée.`,
    title: "Vos clients ParkVia,",
    accent: "attendus à la minute",
    lead: "Chaque notification de ParkVia crée la réservation dans votre planning, téléphone international compris. Quand le client annule, sa place se libère.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "ParkVia amène souvent des voyageurs de l’étranger. Sa notification donne la remise et la récupération du véhicule à la seconde, le nombre de passagers, le total, et un « Tel Portable » écrit sans le 0, avec l’indicatif du pays entre parenthèses à la fin. Recopié à la main, ce numéro devient vite faux, et le jour du retour personne ne peut joindre le client.",
        "Puis arrive « ParkVia - Cancellation » : la réservation est annulée. Il faut la retrouver par son numéro PC…, la barrer, libérer la place et prévenir l’équipe. Une annulation oubliée, et vous refusez un client pour une place qui était libre.",
      ],
    },
    gains: [
      { title: "Créée seule", text: "La notification devient une réservation : numéro PC…, nom, dates, passagers, plaque et total." },
      { title: "Le bon numéro de téléphone", text: "« 912345678 (351) » devient « +351 912345678 » : l’équipe appelle le client du premier coup." },
      { title: "Annulations appliquées", text: "L’avis d’annulation annule la réservation et libère sa place, tant que la voiture n’est pas au parking." },
      { title: "L’équipe prévenue", text: "Une notification « Réservation annulée · ParkVia » part à l’équipe, et la fiche garde la trace de l’annulation." },
      { title: "Ce que ParkVia vous laisse", text: "Son taux de commission posé une fois, le chiffre d’affaires se lit brut ou net." },
    ],
    screens: [
      {
        title: "ParkVia - Nouvelle notification",
        rows: [
          { text: "Réservation PC2610482 · Silva · 2 pass." },
          { hour: "09:30", text: "Remise du véhicule · ven. 20 nov.", pill: { tone: "ok", label: "Importé" } },
          { text: "Tél. +351 912345678" },
        ],
      },
      {
        title: "ParkVia - Cancellation",
        rows: [
          { hour: "07:40", text: "Réservation PC2610482", pill: { tone: "ok", label: "Annulée" } },
          { text: "Statut : Attendu → Annulé" },
          { text: "Place libérée · note ajoutée" },
        ],
      },
      {
        title: "À faire à la main",
        rows: [
          { hour: "18:05", text: "Annulation PC2598811 · voiture déjà au parking", pill: { tone: "warn", label: "À traiter" } },
        ],
      },
    ],
    sections: [
      {
        title: "La notification de réservation",
        paragraphs: [
          "La « ParkVia - Nouvelle notification de réservation » donne le numéro PC…, la remise et la récupération du véhicule, le total, le nombre de passagers, le nom, le téléphone portable et l’immatriculation. La réservation est créée avec tout cela, aux heures de votre parking, et apparaît dans le planning du jour de l’arrivée avec l’étiquette ParkVia.",
          "Le téléphone est remis dans sa forme internationale : le numéro écrit sans son 0 et suivi de l’indicatif entre parenthèses devient un numéro que votre équipe compose tel quel. Le montant est ce que paie le client pour le parking, et il se corrige ensuite si besoin.",
          "Si votre équipe avait déjà saisi ce voyageur pour la même arrivée, le mail est rattaché à sa réservation, sans en créer une seconde.",
        ],
      },
      {
        title: "L’annulation, appliquée tant que c’est sûr",
        paragraphs: [
          "L’avis « ParkVia - Cancellation », ou « Notification d’annulation de réservation », qui dit « Cette réservation a été annulée », annule la réservation de son numéro. Seule une réservation encore « Attendu » est annulée : sa file ou sa place est libérée, la note « Annulée par ParkVia (mail d’annulation). » est ajoutée, et l’historique de la réservation montre le changement.",
          "Si la réservation avait été saisie sans son numéro PC…, elle est retrouvée par le voyageur que nomme l’avis : la même plaque, ou le même téléphone et un mot du nom, et la même journée d’arrivée. Une seule correspond ? Elle est annulée et le numéro lui est ajouté.",
          "Rien n’est fait quand la voiture est déjà au parking, que la réservation est close, inconnue, ou que plusieurs pourraient correspondre. Le mail reste « Annulation à faire à la main », avec la raison, et l’équipe décide. Les mêmes mots écrits par quelqu’un d’autre, par exemple au-dessus d’un mail transféré, n’annulent jamais rien.",
        ],
      },
      {
        title: "Ce qui se met en place le premier jour",
        paragraphs: [
          "Vous donnez l’adresse de réception de votre parking à ParkVia, ou vous faites suivre ses mails depuis votre messagerie. Les notifications suivantes arrivent dans la boîte de réception, reconnues comme ParkVia. Une notification reçue ailleurs se colle avec « Coller un mail ».",
          "Le taux de commission de ParkVia se pose avec sa date d’effet. Vous lisez ensuite le chiffre d’affaires brut ou net de commissions, et la page Statistiques compare ce que chaque plateforme vous laisse par réservation.",
          "Le client ParkVia reçoit, la veille de son dépôt, votre message avec l’heure et le lieu du rendez-vous. Il retrouve sa réservation avec son numéro PC… et son e-mail ou son téléphone, et voit la navette le jour venu.",
        ],
      },
    ],
    faq: [
      [`${P} Pro est-il partenaire de ParkVia ?`, `Non. ${P} Pro lit les notifications que ParkVia envoie déjà à votre parking. Vous gardez votre compte ParkVia et vos conditions avec lui.`],
      ["Une annulation ParkVia libère-t-elle la place toute seule ?", "Oui, tant que la réservation est encore attendue. Si la voiture est déjà au parking, rien ne change et l’équipe est prévenue avec la raison."],
      ["Le téléphone des clients étrangers est-il bien repris ?", "Oui : le numéro écrit sans son 0 et suivi de l’indicatif est remis dans sa forme internationale, comme « +351 912345678 »."],
      ["Et si l’équipe a déjà saisi la réservation sans le numéro ParkVia ?", "Le mail de réservation lui est rattaché. Une annulation la retrouve aussi par le voyageur et l’arrivée, et lui ajoute le numéro."],
      ["Mes réservations ParkVia comptent-elles dans le chiffre d’affaires ?", "Oui, avec la commission de ParkVia déduite une fois son taux posé. Vous voyez ce que vous gardez par canal et par jour."],
      ["Combien ça coûte ?", "De 99 € à 299 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["comparateurs", "onepark"],
  },
  "park-hit": {
    slug: "park-hit",
    updated: "2026-11-17",
    label: "Park Hit",
    metaTitle: `Réservations Park Hit dans votre planning · ${P} Pro`,
    metaDescription: `Les fiches Park Hit lues seules : réservation créée avec voyageurs, véhicule, vols et commentaire du client, sans ressaisie. Pour parkings d’aéroport.`,
    title: "Les fiches Park Hit,",
    accent: "sans rien recopier",
    lead: "La fiche de réservation que Park Hit envoie à votre parking devient une réservation complète dans votre planning, commentaire du client compris.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "L’avis « Park Hit: Nouvelle réservation » est une longue fiche : un champ par ligne, chacun terminé par un point-virgule. Réservation, prénom, nom, type de véhicule, nombre de voyageurs, dépôt, récupération, e-mail, téléphone, immatriculation, coût, commentaires, vols aller et retour. Tout y est, mais tout est à recopier.",
        "Le client écrit parfois son vol sans la compagnie, « 7841 », et ajoute un mot dans les commentaires : un siège bébé, une arrivée tardive, un bagage encombrant. Recopié à moitié, ce mot se perd entre l’accueil et le chauffeur, et c’est au client de le redire.",
      ],
    },
    gains: [
      { title: "Créée seule", text: "La fiche devient une réservation : référence, nom, voyageurs, véhicule, dates, plaque, téléphone et coût." },
      { title: "Le commentaire du client gardé", text: "Ce que le client a écrit passe dans les notes de la réservation, sous les yeux de l’équipe." },
      { title: "Un vol sans compagnie bien rangé", text: "« 7841 » n’est jamais pris pour un numéro de vol : il va dans les notes, tel qu’il est écrit." },
      { title: "Même transférée à la main", text: "La fiche est reconnue à sa mise en page, que Park Hit vous l’envoie ou qu’un collègue la fasse suivre." },
      { title: "La commission de Park Hit", text: "Son taux posé une fois, vous lisez ce que vous gardez, réservation par réservation." },
    ],
    screens: [
      {
        title: "Park Hit: Nouvelle réservation F2006A65BCF7",
        rows: [
          { text: "Durand · 4 voyageurs · SUV", pill: { tone: "ok", label: "Importé" } },
          { hour: "06:45", text: "Dépôt · sam. 21 nov." },
          { hour: "23:10", text: "Récupération · sam. 28 nov." },
        ],
      },
      {
        title: "Notes de la réservation",
        rows: [
          { text: "Vol aller indiqué sur la fiche : 7841 (sans compagnie)", pill: { tone: "warn", label: "À vérifier" } },
          { text: "Commentaire du client : nous aurons une poussette" },
        ],
      },
      {
        title: "Planning du sam. 21",
        rows: [
          { hour: "06:45", text: "Durand · retour 28 nov.", pill: { tone: "info", label: "Park Hit" } },
          { hour: "07:30", text: "Moreau · retour 24 nov.", pill: { tone: "info", label: "Onepark" } },
        ],
      },
    ],
    sections: [
      {
        title: "La fiche, lue champ par champ",
        paragraphs: [
          "Chaque ligne de la fiche Park Hit trouve sa place : la référence de la réservation, le prénom et le nom, le type de véhicule, le nombre de voyageurs, la date et l’heure du dépôt et de la récupération, l’adresse mail et le téléphone du client, l’immatriculation, le coût de la réservation et les numéros de vol aller et retour. La réservation est créée aux heures de votre parking, avec l’étiquette Park Hit dans le planning.",
          "La fiche est reconnue à sa forme, même quand son texte ne nomme pas Park Hit : un collègue qui la fait suivre depuis sa propre boîte n’empêche rien. Elle est aussi reconnue à son expéditeur et à son objet, « Park Hit: Nouvelle réservation » suivi de la référence.",
        ],
      },
      {
        title: "Les vols et les commentaires, sans perte",
        paragraphs: [
          "Un vol donné avec sa compagnie est enregistré comme vol aller ou vol retour, et la navette s’en sert. Un vol donné sans compagnie, « 7841 », n’est jamais deviné : il part dans les notes avec la mention « Vol aller indiqué sur la fiche : 7841 (sans compagnie) », pour que l’équipe le complète en appelant le client si besoin.",
          "Les commentaires du client sont gardés tels qu’il les a écrits, dans les notes de la réservation : « Commentaire du client : … ». L’accueil, le chauffeur et le voiturier les voient sur la fiche, sans que personne n’ait eu à les recopier.",
          "Si votre équipe avait déjà saisi ce voyageur au téléphone pour la même arrivée, le mail lui est rattaché au lieu de créer une seconde réservation.",
        ],
      },
      {
        title: "Ce qui se met en place le premier jour",
        paragraphs: [
          "Vous donnez l’adresse de réception de votre parking à Park Hit, ou vous faites suivre ses mails depuis votre messagerie : l’assistant de réglage connaît déjà son expéditeur. Une fiche reçue ailleurs se colle dans la boîte de réception avec « Coller un mail ».",
          "Le prix compté est le coût de la réservation donné par la fiche, et vous pouvez le corriger ensuite. Le taux de commission de Park Hit se pose avec sa date d’effet : le chiffre d’affaires se lit brut ou net, et la page Statistiques compare Park Hit à vos autres canaux, net par réservation.",
          "La veille du dépôt, votre client Park Hit reçoit votre message avec l’heure et le lieu du rendez-vous. Il retrouve sa réservation avec la référence Park Hit et son e-mail ou son téléphone.",
        ],
      },
    ],
    faq: [
      [`${P} Pro est-il partenaire de Park Hit ?`, `Non. ${P} Pro lit les fiches que Park Hit envoie déjà à votre parking. Vous gardez votre compte Park Hit et vos conditions avec lui.`],
      ["Que devient le commentaire écrit par le client ?", "Il est gardé dans les notes de la réservation, tel qu’il l’a écrit, et toute l’équipe le voit sur la fiche."],
      ["Et un vol écrit sans la compagnie ?", "Il n’est pas pris pour un numéro de vol. Il va dans les notes, tel quel, pour que l’équipe le complète."],
      ["Un collègue transfère les fiches depuis sa boîte. Ça marche ?", "Oui. La fiche est reconnue à sa mise en page, même transférée à la main."],
      ["Les annulations Park Hit sont-elles appliquées ?", "Non, pas toutes seules : un mail qui n’est pas une nouvelle réservation attend dans « À traiter », et l’équipe décide."],
      ["Combien ça coûte ?", "De 99 € à 299 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["comparateurs", "parkvia"],
  },
  parclick: {
    slug: "parclick",
    updated: "2026-11-17",
    label: "Parclick",
    metaTitle: `Réservations Parclick dans votre planning · ${P} Pro`,
    metaDescription: `Mails Parclick lus seuls, bon joint compris pour le nom et le téléphone du client. Annulations et modifications signalées. Pour parkings d’aéroport.`,
    title: "Vos réservations Parclick,",
    accent: "bon compris",
    lead: "Le mail de Parclick donne les dates et la référence, le bon joint donne le client. Plazo Pro lit les deux et range la réservation dans votre planning.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Avec Parclick, le corps du mail donne l’arrivée, la sortie et la référence, mais le nom et le téléphone du client sont souvent dans le bon joint au mail. Il faut l’ouvrir, le lire, recopier le client, puis revenir au mail pour les dates. Deux documents pour une seule réservation, à chaque fois.",
        "Et le jour où le client annule ou change ses dates, un autre mail arrive, qui ressemble beaucoup au premier. Lu trop vite, il passe pour une nouvelle réservation, ou il est classé sans que la place soit libérée.",
      ],
    },
    gains: [
      { title: "Le mail et le bon, ensemble", text: "Les dates et la référence viennent du mail, le nom et le téléphone du bon joint : une seule réservation, complète." },
      { title: "Même transféré", text: "Le bon reste joint quand le mail est transféré : il est lu de la même façon." },
      { title: "Annulations et modifications reconnues", text: "Elles ne sont jamais prises pour une nouvelle réservation : elles attendent dans « À traiter », marquées comme telles." },
      { title: "Un mail incomplet pré-rempli", text: "Quand il manque le client, le mail attend avec ce qui a été compris ; vous complétez en un clic." },
      { title: "Sa commission, une fois", text: "Le taux de Parclick posé avec sa date, votre chiffre d’affaires se lit net de commissions." },
    ],
    screens: [
      {
        title: "Boîte de réception · Parclick",
        rows: [
          { hour: "08:15", text: "Nouvelle réservation BQE32P55 · bon joint", pill: { tone: "ok", label: "Importé" } },
          { hour: "12:40", text: "Voici votre réservation ! · BQE41K02", pill: { tone: "warn", label: "À traiter" } },
          { hour: "16:02", text: "Annulation · BQE29T88", pill: { tone: "warn", label: "Annulation" } },
        ],
      },
      {
        title: "Ce que Plazo Pro a compris",
        rows: [
          { text: "Arrivée · lun. 23 nov. 07:30" },
          { text: "Sortie · ven. 27 nov. 19:00" },
          { text: "Nom du client", pill: { tone: "warn", label: "manquant" } },
          { text: "Compléter la réservation" },
        ],
      },
    ],
    sections: [
      {
        title: "Du mail et du bon à la réservation",
        paragraphs: [
          "Le mail que Parclick envoie à votre parking donne l’arrivée, la sortie et la référence de la réservation. Le bon joint au mail est lu à la réception, sans que personne ne l’ouvre : il apporte le nom et le téléphone du client. La réservation est créée aux heures de votre parking, avec la référence Parclick et son étiquette dans le planning.",
          "Les conditions écrites sur le bon, comme une annulation gratuite, ne font jamais passer une réservation pour une annulation : seul le mail décide de ce qu’il est.",
          "Si le voyageur avait déjà été saisi par l’équipe pour la même arrivée, le mail est rattaché à sa réservation, sans doublon.",
        ],
      },
      {
        title: "Quand il manque quelque chose",
        paragraphs: [
          "Parclick envoie aussi au voyageur une confirmation « Voici votre réservation ! », que celui-ci vous transfère parfois. Elle donne la référence et les dates, mais ni le nom ni le téléphone du voyageur. Plutôt que de créer une réservation à moitié, le mail attend dans « À traiter », pré-rempli de ce qu’il dit, avec les champs manquants marqués « manquant ».",
          "Un clic sur « Compléter » ouvre le formulaire de réservation déjà rempli : vous ajoutez le nom et le téléphone, et la réservation est créée, le mail rattaché.",
        ],
      },
      {
        title: "Annulations et modifications : reconnues, puis décidées par l’équipe",
        paragraphs: [
          "Un mail d’annulation ou de modification Parclick est reconnu comme tel et n’est jamais importé comme une réservation. Il arrive dans « À traiter », marqué « Annulation » ou « Modification », et un membre de l’équipe l’applique à la réservation en quelques gestes.",
          "Ce choix vient d’une règle simple : n’appliquer seul que ce qui a été vérifié sur de vrais mails. Tant que ce n’est pas le cas pour les annulations et modifications Parclick, la décision reste à vous, et rien ne change dans votre planning sans votre accord.",
        ],
      },
      {
        title: "Ce qui se met en place le premier jour",
        paragraphs: [
          "Vous donnez l’adresse de réception de votre parking à Parclick, ou vous faites suivre ses mails depuis votre messagerie, bon joint compris. Un mail reçu ailleurs se colle avec « Coller un mail ».",
          "Le prix compté est celui que paie le client, sans les frais de Parclick, et il se corrige ensuite. Posez le taux de commission de Parclick avec sa date d’effet : tant qu’il manque, il est signalé « Parclick : taux à régler » sur le tableau de bord. Ensuite, la page Statistiques montre ce que Parclick vous laisse par réservation, face à vos autres canaux.",
          "Votre client Parclick reçoit votre message la veille de son dépôt, et retrouve sa réservation avec sa référence Parclick et son e-mail ou son téléphone.",
        ],
      },
    ],
    faq: [
      [`${P} Pro est-il partenaire de Parclick ?`, `Non. ${P} Pro lit les mails que Parclick envoie déjà à votre parking, et le bon qui y est joint. Vous gardez votre compte Parclick et vos conditions avec lui.`],
      ["Faut-il ouvrir le bon joint au mail ?", "Non. Le bon est lu à la réception : le nom et le téléphone du client sont repris dans la réservation."],
      ["Une annulation Parclick est-elle appliquée toute seule ?", "Non. Elle est reconnue, marquée « Annulation » dans « À traiter », et l’équipe l’applique."],
      ["Que se passe-t-il avec la confirmation envoyée au voyageur ?", "Elle n’a ni nom ni téléphone : elle attend dans « À traiter », pré-remplie, et vous complétez en un clic."],
      ["Le prix compté comprend-il les frais de Parclick ?", "Non, c’est ce que paie le client pour le parking. Vous pouvez le corriger ensuite sur la réservation."],
      ["Combien ça coûte ?", "De 99 € à 299 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["comparateurs", "parkmundo"],
  },
  parkmundo: {
    slug: "parkmundo",
    updated: "2026-11-17",
    label: "ParkMundo",
    metaTitle: `Réservations ParkMundo dans votre planning · ${P} Pro`,
    metaDescription: `Mails ParkMundo lus seuls : référence PM…, vols aller et retour, voiture et couleur, prix du parking sans les frais. Pour parkings d’aéroport.`,
    title: "Les voyages ParkMundo,",
    accent: "prêts pour la navette",
    lead: "Le mail de ParkMundo détaille le voyage : vols aller et retour, voiture, couleur. Plazo Pro en fait une réservation prête pour l’accueil et la navette.",
    problem: {
      title: "Ce qui coûte du temps aujourd’hui",
      paragraphs: [
        "Le mail de ParkMundo est riche : la référence PM…, les détails du voyage avec le vol aller et le vol retour, la voiture et sa couleur. Recopier tout cela prend du temps, et c’est justement ce qui sert le jour J : le vol retour pour la navette, la couleur pour retrouver la voiture.",
        "Il donne aussi deux montants : le prix du parking et le coût de réservation de ParkMundo. Additionnés par erreur, ils gonflent votre chiffre d’affaires, et le calcul de ce que vous gardez devient faux à la fin du mois.",
      ],
    },
    gains: [
      { title: "Créée seule", text: "Le mail devient une réservation : référence PM…, client, dates, vols aller et retour, voiture et couleur." },
      { title: "Le bon prix", text: "Le montant compté est le prix du parking, sans le coût de réservation de ParkMundo." },
      { title: "La navette informée", text: "Les vols aller et retour sont sur la réservation : la liste du chauffeur s’en sert." },
      { title: "Annulations et modifications reconnues", text: "Elles ne sont jamais importées comme une réservation : elles attendent dans « À traiter »." },
      { title: "Ce que ParkMundo vous laisse", text: "Son taux de commission posé une fois, le chiffre d’affaires se lit net, par canal." },
    ],
    screens: [
      {
        title: "Réservation PM4821736",
        rows: [
          { text: "Garcia · Peugeot 308 grise", pill: { tone: "ok", label: "Importé" } },
          { hour: "06:20", text: "Vol aller · AF 7641" },
          { hour: "22:35", text: "Vol retour · AF 7648", pill: { tone: "info", label: "ParkMundo" } },
        ],
      },
      {
        title: "Montant",
        rows: [
          { text: "Prix du parking · 62,00 €", pill: { tone: "ok", label: "Compté" } },
          { text: "Coût de réservation ParkMundo", pill: { tone: "warn", label: "Non compté" } },
        ],
      },
      {
        title: "Boîte de réception",
        rows: [
          { hour: "15:12", text: "ParkMundo · modification PM4790210", pill: { tone: "warn", label: "Modification" } },
        ],
      },
    ],
    sections: [
      {
        title: "Le voyage entier dans la réservation",
        paragraphs: [
          "Le mail de ParkMundo est lu en entier : la référence PM…, le nom du client, ses dates, les détails du voyage avec le vol aller et le vol retour, la voiture et sa couleur. La réservation est créée aux heures de votre parking, avec l’étiquette ParkMundo dans le planning.",
          "Ces détails servent tout de suite. Le vol aller aide à prévoir le départ de la navette vers le terminal, le vol retour place le client dans la liste du chauffeur à la bonne heure, et la couleur de la voiture aide le voiturier à la retrouver.",
          "Si le même voyageur avait déjà été saisi par l’équipe pour la même arrivée, le mail est rattaché à sa réservation, sans doublon.",
        ],
      },
      {
        title: "Le prix du parking, pas les frais de ParkMundo",
        paragraphs: [
          "Le mail donne le « Prix du parking » et, à part, le « Coût de réservation » que ParkMundo facture au voyageur. Seul le prix du parking est compté dans la réservation : c’est ce qui vous revient avant commission, et c’est lui qui fait votre chiffre d’affaires.",
          "Le taux de commission de ParkMundo se pose une fois, avec sa date d’effet, et un nouveau taux ne change jamais les réservations faites avant. Le chiffre d’affaires se lit brut ou net de commissions, et la page Statistiques compare ce que ParkMundo vous laisse par réservation à vos autres canaux. Le prix d’une réservation se corrige à tout moment sur sa fiche.",
        ],
      },
      {
        title: "Annulations et modifications : à vous de décider",
        paragraphs: [
          "Un mail d’annulation ou de modification ParkMundo est reconnu comme tel. Il n’est jamais importé comme une nouvelle réservation, et il n’est pas non plus appliqué seul : il attend dans « À traiter », marqué « Annulation » ou « Modification », et un membre de l’équipe met la réservation à jour.",
          "Vous gardez la main : rien ne change dans votre planning sans votre accord, et depuis la fiche de la réservation vous retrouvez le mail qui l’a créée et celui qui demande le changement.",
        ],
      },
      {
        title: "Ce qui se met en place le premier jour",
        paragraphs: [
          "Vous donnez l’adresse de réception de votre parking à ParkMundo, ou vous faites suivre ses mails depuis votre messagerie. Un mail reçu ailleurs se colle avec « Coller un mail », et il est lu de la même façon.",
          "La veille du dépôt, le client ParkMundo reçoit votre message avec l’heure et le lieu du rendez-vous. Il retrouve sa réservation avec sa référence PM… et son e-mail ou son téléphone.",
        ],
      },
    ],
    faq: [
      [`${P} Pro est-il partenaire de ParkMundo ?`, `Non. ${P} Pro lit les mails que ParkMundo envoie déjà à votre parking. Vous gardez votre compte ParkMundo et vos conditions avec lui.`],
      ["Quel montant est compté ?", "Le prix du parking, sans le coût de réservation que ParkMundo facture au voyageur. Vous pouvez le corriger ensuite."],
      ["Les vols du client sont-ils repris ?", "Oui, le vol aller et le vol retour, avec la voiture et sa couleur. La navette et le voiturier s’en servent."],
      ["Une annulation ParkMundo est-elle appliquée seule ?", "Non. Elle est reconnue et attend dans « À traiter », marquée « Annulation », et l’équipe l’applique."],
      ["Et si la réservation a déjà été saisie au téléphone ?", "Le mail de ParkMundo est rattaché à la réservation du même voyageur pour la même arrivée, sans en créer une seconde."],
      ["Combien ça coûte ?", "De 99 € à 299 € HT par mois et par parking selon la formule, −10 % à l’année. La démo est gratuite, sans inscription."],
    ],
    next: ["comparateurs", "parclick"],
  },
} satisfies Record<string, ProTopic>;
