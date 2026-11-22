// Use-case guide « Voyage d'affaires » of Lyon Saint-Exupéry (22/11/2026): the invoice (Plazo's rule of 06-07/11/2026: issued by
// the parking in its own name, asked for from « Ma réservation » with an optional company and address, sent by email, PDF in the
// booking), online payment, time saved (valet, flight followed, return message), changing a flight, short trips and cancellation.
import { LYON_OFFICIAL, offerText, rideMinutes, type TopicFacts, type TopicGuide } from "../airport-guides";
import { PRODUCT_NAME } from "../product";
import { topicPath } from "./topics";

export function lyonVoyageAffaires(facts: TopicFacts): TopicGuide {
  const o = LYON_OFFICIAL;
  const P = PRODUCT_NAME;
  const ride = facts.shuttle ? rideMinutes(facts.shuttle) : null;
  const week = facts.week ? offerText(facts.week) : null;
  const valetCount = facts.valet?.count ?? 0;

  const rideSentence = ride
    ? `Chez nos parkings partenaires, la navette jusqu’au Terminal 1 dure ${ride} selon le parking : un temps à compter, comme le passage aux contrôles.`
    : "La durée de la navette jusqu’au Terminal 1 est indiquée sur chaque fiche : un temps à compter, comme le passage aux contrôles.";
  const valetSentence = valetCount
    ? `${valetCount === 1 ? "Un de nos parkings partenaires propose" : `${valetCount} de nos parkings partenaires proposent`} un voiturier : vous laissez les clés à l’accueil et montez dans la navette sans chercher de place.`
    : "Le filtre « Voiturier » des résultats garde les parkings où l’on vous prend les clés à l’accueil : vous montez dans la navette sans chercher de place.";
  const weekSentence = week
    ? `Pour une semaine, le moins cher de nos parkings partenaires est aujourd’hui proposé ${week}, navette comprise.`
    : "Le prix total de chaque parking pour vos dates s’affiche dès que vous lancez la recherche, navette comprise.";

  return {
    slug: "parking-voyage-affaires",
    short: "Voyage d’affaires",
    metaTitle: "Parking aéroport Lyon pour un voyage d’affaires : facture",
    metaDescription: "Voyage d’affaires depuis Lyon Saint-Exupéry : facture au nom de votre société, paiement en ligne, voiturier, vol suivi, changement de vol et annulation.",
    title: "Parking à l’aéroport de Lyon Saint-Exupéry pour un voyage d’affaires : facture, temps gagné et imprévus",
    intro: `En déplacement professionnel, on attend d’un parking trois choses : une facture en règle pour la note de frais, un dépôt et un retour qui ne font pas perdre de temps, et de la souplesse quand une réunion déplace le vol. Ce guide explique comment obtenir la facture d’un parking réservé sur ${P}, au nom de votre société, comment gagner du temps au départ et au retour, et comment gérer un vol changé ou un déplacement annulé. Informations de l’aéroport relevées le ${o.readOn} ; depuis le ${o.t2Closed}, tous les vols partent du Terminal 1.`,
    published: "2026-11-22",
    updated: "2026-11-22",
    sections: [
      {
        id: "facture",
        short: "La facture",
        title: "La facture : au nom du parking, à celui de votre société",
        paragraphs: [
          `Le parking, qui vous rend le service, en est le vendeur : c’est lui qui établit la facture, à son nom, avec ses mentions légales. Sur ${P}, vous la demandez depuis Ma réservation, sur le site ou dans l’application, avec « Demander la facture ». Vous pouvez y indiquer le nom de votre société et son adresse, facultatifs, pour qu’ils figurent sur la facture.`,
          "Le parking est prévenu de votre demande et crée la facture. Elle vous est envoyée par e-mail dès qu’elle est prête, et reste ensuite disponible en PDF dans Ma réservation, à télécharger quand votre service comptable la réclame. Une seule demande suffit par réservation.",
          "Si la facture doit être corrigée, le parking émet un avoir qui l’annule, puis une nouvelle facture : une facture émise n’est jamais modifiée. L’avoir apparaît dans Ma réservation sous la facture qu’il annule.",
        ],
        table: {
          caption: "Ce que contient la facture du parking",
          columns: ["Contenu"],
          rows: [
            ["Le vendeur", "Le parking : raison sociale, adresse, SIRET, numéro de TVA ou mention d’exonération"],
            ["Le client", "Votre nom, et le nom et l’adresse de votre société si vous les avez donnés"],
            ["La prestation", "Le stationnement, les dates, la plaque, puis les services faits"],
            ["Les montants", "Hors taxes, TVA et toutes taxes comprises, et le moyen de paiement"],
            ["Le numéro", "Un numéro unique, dans la suite des factures du parking"],
          ],
          note: `Factures émises par les parkings sur ${P}.`,
        },
      },
      {
        id: "paiement",
        short: "Le paiement",
        title: "Le paiement : en ligne, par carte, une seule fois",
        paragraphs: [
          `Sur ${P}, la place est payée en ligne, par carte, au moment de la réservation : avec une carte professionnelle, la dépense apparaît sur le relevé de votre société sans avance de frais. Il n’y a rien à régler au parking pour la place réservée ; les frais de nuit éventuels sont compris dans le prix total affiché, calculés sur vos heures réservées.`,
          weekSentence,
          "Un service commandé en plus, comme un lavage intérieur ou une recharge quand le parking les propose, est payé à part, en ligne, et figure sur la facture une fois fait.",
        ],
      },
      {
        id: "gagner-du-temps",
        short: "Gagner du temps",
        title: "Gagner du temps au départ",
        paragraphs: [
          `L’aéroport recommande d’être au terminal ${o.advice}. En voyage d’affaires, chaque minute compte : choisissez un parking dont la navette est courte et l’accueil rapide.`,
          rideSentence,
          valetSentence,
          `Donnez votre vol aller en réservant : ${P} suit son horaire et indique dans Ma réservation l’heure à laquelle la navette vers le terminal est prévue. Le jour même, prévenez le parking de votre arrivée depuis Ma réservation (« J’arrive dans 10 minutes ») : la navette vous attend.`,
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-voiturier"), label: "Toutes les formules de voiturier à Lyon Saint-Exupéry" },
      },
      {
        id: "retour",
        short: "Le retour",
        title: "Le retour : vol suivi, navette prête",
        paragraphs: [
          `Donnez votre numéro de vol retour : ${P} suit l’atterrissage et le parking reçoit l’heure réelle, même si le vol est avancé ou retardé. À l’atterrissage, un message vous indique le point de rendez-vous de la navette et ce qu’il faut faire ; pas besoin d’appeler le parking depuis le tapis à bagages.`,
          "Chez les parkings qui montrent leurs navettes aux voyageurs, vous suivez la navette en direct sur la carte de votre réservation, et savez quand elle arrive au point de rendez-vous.",
          "Un retour tardif après une réunion qui s’éternise ? Si le retour tombe pendant les heures de nuit d’un parking, les frais de nuit dépendent de l’heure de retour réservée, pas de l’heure réelle : un vol en retard ne les ajoute pas après coup.",
        ],
      },
      {
        id: "imprevus",
        short: "Les imprévus",
        title: "Un vol changé, une réunion annulée",
        paragraphs: [
          "Les déplacements professionnels bougent souvent. Si vous changez de vol retour, corrigez vous-même le numéro depuis Ma réservation, jusqu’au retour : le parking suit alors le bon vol. Pour un autre jour de retour, contactez le parking, qui peut modifier la réservation s’il a de la place.",
          "Si le déplacement est annulé, annulez depuis Ma réservation dans le délai d’annulation gratuite du parking : le remboursement est automatique. Chaque parking choisit sa formule : gratuite jusqu’à l’heure de dépôt, jusqu’à 24 heures avant, jusqu’à 48 heures avant, ou non remboursable. Pour un agenda incertain, préférez une annulation gratuite jusqu’à l’heure de dépôt.",
          "Si vous restez plus longtemps que prévu, les jours au-delà de la date de retour réservée sont réglés directement au parking, à son tarif : prévenez-le dès que vous le savez.",
        ],
      },
      {
        id: "allers-retours",
        short: "Les allers-retours fréquents",
        title: "Des allers-retours fréquents",
        paragraphs: [
          `Si vous partez souvent, l’application ${P} garde vos réservations à portée de main : Mes réservations, la prochaine en tête, avec le parking, les dates et le lien vers la navette en direct. Les messages de la veille, de l’atterrissage et de fin de séjour arrivent au même numéro de téléphone, et les factures restent dans chaque réservation.`,
          "Pour un aller-retour dans la journée, le parking compte un seul jour du calendrier chez nos parkings partenaires ; à l’aéroport, sans réservation, ce sont les heures qui comptent, par tranches de 24 heures.",
        ],
        more: { href: topicPath("lyon-saint-exupery", "parking-week-end"), label: "Les courts séjours : comment les jours sont comptés" },
      },
      {
        id: "note-de-frais",
        short: "La note de frais",
        title: "La note de frais : ce qu’il faut garder",
        paragraphs: [
          "Pour la plupart des services comptables, la facture suffit : elle porte le nom du parking, ses mentions légales, la prestation, les dates, les montants et le moyen de paiement. Demandez-la dès votre retour, depuis Ma réservation, plutôt que d’attendre la fin du mois : elle arrive par e-mail et reste disponible en PDF.",
          "Si votre société doit figurer sur la facture, indiquez son nom et son adresse au moment de la demande : ils ne peuvent plus être ajoutés une fois la facture émise, sinon par un avoir et une nouvelle facture. Vérifiez aussi l’e-mail de la réservation : c’est à cette adresse que la facture est envoyée.",
          "Le parking est le vendeur de la prestation : c’est son nom, et non celui de la plateforme, qui figure comme fournisseur. Si votre service comptable demande un justificatif de paiement en plus, la facture indique le moyen utilisé, et le relevé de votre carte fait foi.",
        ],
        list: [
          "Demandez la facture depuis Ma réservation, dès le retour.",
          "Indiquez le nom et l’adresse de votre société au moment de la demande.",
          "Téléchargez le PDF et joignez-le à votre note de frais.",
          "En cas d’erreur, demandez au parking un avoir et une nouvelle facture.",
        ],
      },
      {
        id: "pour-un-collegue",
        short: "Réserver pour un collègue",
        title: "Réserver pour un collègue ou pour son responsable",
        paragraphs: [
          "Une assistante, un office manager ou un collègue peuvent réserver pour vous. Indiquez alors le nom, le téléphone et l’e-mail de la personne qui voyage : c’est elle qui reçoit le message de rappel la veille, le message d’atterrissage et le lien de la réservation, et c’est elle que le parking accueille.",
          "Le paiement peut se faire avec la carte de la société. La facture se demande ensuite depuis Ma réservation, par le voyageur ou par la personne qui a reçu le lien : un seul lien donne accès à tout, de la facture au point de rendez-vous du retour.",
          "Pour plusieurs voyageurs qui partent ensemble dans la même voiture, une seule réservation suffit : indiquez le nombre de passagers, pour que le parking prévoie la place dans la navette.",
        ],
      },
      {
        id: "choisir",
        short: "Choisir son parking",
        title: "Choisir son parking selon le déplacement",
        paragraphs: [
          "Pour un aller-retour dans la journée, le temps prime : un parking de l’aéroport à quelques minutes à pied du terminal, ou un parking privé dont la navette est courte et l’accueil rapide. Pour une mission de plusieurs jours, le prix reprend sa place : l’écart entre deux parkings se compte en dizaines d’euros sur une semaine.",
          "Dans tous les cas, regardez les horaires d’accueil si vous partez tôt ou rentrez tard, les conditions d’annulation si votre agenda est incertain, et la présence d’un voiturier si vous voulez gagner les minutes du dépôt.",
        ],
        table: {
          caption: "Le bon parking selon le déplacement",
          columns: ["Ce qui compte", "À regarder sur la fiche"],
          rows: [
            ["Aller-retour dans la journée", "Le temps de trajet jusqu’au terminal", "Durée de la navette, voiturier"],
            ["Deux ou trois jours", "Un retour rapide, une facture", "Horaires d’accueil, annulation"],
            ["Une semaine ou plus", "Le prix total du séjour", "Prix total pour vos dates"],
          ],
          note: `Informations lues sur les fiches et dans les résultats de ${P}.`,
        },
      },
      {
        id: "reserver",
        short: "Réserver sur " + P,
        title: `Réserver un parking pour un voyage d’affaires sur ${P}`,
        paragraphs: [
          `Saisissez vos dates et vos heures, votre vol aller et votre vol retour, puis réservez et payez en ligne. Une fois la réservation faite, « Demander la facture » dans Ma réservation suffit pour recevoir la facture du parking à votre nom ou à celui de votre société.`,
          "Gardez le lien de votre réservation : il donne accès à tout, de la facture au point de rendez-vous du retour, sans compte à créer.",
        ],
      },
    ],
    faq: [
      [
        "Quand faut-il demander la facture du parking ?",
        "Quand vous voulez, depuis Ma réservation, une fois la réservation faite. Le plus simple est de la demander dès votre retour, en indiquant le nom et l’adresse de votre société s’ils doivent y figurer.",
      ],
      [
        "Le parking peut-il facturer les services commandés en plus ?",
        "Oui. Les services faits, comme un lavage intérieur ou une recharge commandés dans l’application, figurent sur la facture à la suite du stationnement, avec leurs montants.",
      ],
      [
        "Un collègue peut-il réserver le parking pour moi ?",
        "Oui. Indiquez alors le nom, le téléphone et l’e-mail de la personne qui voyage : c’est elle qui reçoit les messages du séjour et le lien de la réservation, et c’est elle que le parking accueille.",
      ],
      [
        `Peut-on obtenir une facture pour un parking réservé sur ${P} ?`,
        "Oui. Depuis Ma réservation, « Demander la facture » prévient le parking, qui l’établit à son nom ; elle vous est envoyée par e-mail et reste disponible en PDF dans votre réservation.",
      ],
      [
        "La facture peut-elle être au nom de ma société ?",
        "Oui. En demandant la facture, indiquez le nom de votre société et son adresse : ils figurent alors sur la facture, à côté de votre nom.",
      ],
      [
        `Qui émet la facture : ${P} ou le parking ?`,
        "Le parking, qui vous rend le service et en est le vendeur. La facture porte son nom, son adresse, son SIRET et sa situation au regard de la TVA.",
      ],
      [
        "La TVA apparaît-elle sur la facture ?",
        "Oui, quand le parking y est soumis : la facture donne les montants hors taxes, la TVA et le total toutes taxes comprises. Un parking qui n’est pas soumis à la TVA porte la mention d’exonération prévue par la loi.",
      ],
      [
        "Comment corriger une facture déjà émise ?",
        "Le parking émet un avoir qui l’annule, puis une nouvelle facture : une facture émise n’est jamais modifiée. L’avoir apparaît dans Ma réservation sous la facture qu’il annule.",
      ],
      [
        "Peut-on payer avec une carte professionnelle ?",
        "Oui. La place est payée en ligne, par carte, au moment de la réservation : avec une carte professionnelle, la dépense est directement débitée de votre société.",
      ],
      [
        "Mon vol retour change : que dois-je faire ?",
        "Corrigez votre numéro de vol retour depuis Ma réservation, jusqu’au retour : le parking suit alors le bon vol. Pour un autre jour de retour, contactez le parking.",
      ],
      [
        "Mon déplacement est annulé : suis-je remboursé ?",
        "Oui, si vous annulez dans le délai d’annulation gratuite du parking, depuis Ma réservation : le remboursement est automatique. Après ce délai, le parking reste libre de consentir un geste commercial.",
      ],
      [
        "Faut-il créer un compte pour retrouver ses factures ?",
        "Non. Le lien de votre réservation, envoyé dans la confirmation, donne accès à Ma réservation et à ses factures ; vous pouvez aussi la retrouver avec son numéro et votre e-mail ou votre téléphone.",
      ],
      [
        "Un aller-retour dans la journée est-il facturé un jour ?",
        "Chez les parkings privés partenaires, un seul jour du calendrier est facturé quand le dépôt et le retour tombent le même jour. À l’aéroport, sans réservation, les heures comptent par tranches de 24 heures.",
      ],
    ],
    partners: {
      filter: "all",
      stayDays: 7,
      title: "Les parkings partenaires pour un déplacement",
      lead: "La liste montre les parkings partenaires qui ont de la place pour la semaine préremplie dans le formulaire, du moins cher au plus cher d’après le prix total ; pour d’autres dates, indiquez les vôtres et lancez la recherche.",
      empty: "Aucun parking partenaire n’est encore réservable en ligne pour ces dates. Revenez bientôt, et consultez en attendant le guide complet du parking à l’aéroport de Lyon Saint-Exupéry pour comparer les parkings officiels.",
    },
  };
}
