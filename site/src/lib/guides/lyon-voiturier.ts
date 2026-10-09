// Topic guide « Parking avec voiturier » of Lyon Saint-Exupéry (09/10/2026): the airport's valet (Alyse Premium, Ector), independent
// meet-and-greet valets, private parkings with an on-site valet, departure and return days, keys, état des lieux, liability, price.
// Sources read on 09/10/2026: store.lyonaeroports.com (« Service voiturier », the Alyse Premium and Ector pages, CGV version of
// 12/02/2026, annexes 5 and 5 bis), the airport's parking rules applicable since 01/01/2024, lyonaeroports.com (« Parkings »,
// « S’organiser et être à l’heure », « Terminal 2 fermé »); Plazo's own rules from site/src/lib/legal.ts.
import { capitalise, LYON_OFFICIAL, offerText, rideMinutes, rideText, type TopicFacts, type TopicGuide } from "../airport-guides";
import { PRODUCT_NAME } from "../product";
import { topicPath } from "./topics";

/**
 * The airport's valet service and parking rules, as read on 09/10/2026. Ector's page and the store's CGV disagree on its booking
 * deadline (30 h on the page, 31 h in the CGV): both are quoted.
 */
const AIRPORT_VALET = {
  cgvVersion: "12 février 2026",
  rulesSince: "1er janvier 2024",
  /** « Depuis le dépose-minute du T1, il faut compter environ 3 minutes de marche » (lyonaeroports.com, « S’organiser et être à l’heure »). */
  walkFromMinute: "environ 3 minutes",
} as const;

export function lyonVoiturier(facts: TopicFacts): TopicGuide {
  const o = LYON_OFFICIAL;
  const P = PRODUCT_NAME;
  const v = AIRPORT_VALET;
  const valet = facts.valet;
  const valetWeek = valet?.week ? offerText(valet.week) : null;
  const rideWords = facts.shuttle ? rideMinutes(facts.shuttle) : null;
  const rideCell = facts.shuttle ? rideText(facts.shuttle) : null;

  const valetCount = valet
    ? `${valet.count === 1 ? "Un de nos parkings partenaires propose" : `${valet.count} de nos parkings partenaires proposent`} aujourd’hui un voiturier, et le filtre « Voiturier » des résultats ne garde que les parkings de ce type.`
    : "Le filtre « Voiturier » des résultats ne garde que les parkings qui proposent ce service, et chaque fiche précise si l’on vous prend les clés ou si vous vous garez vous-même.";

  const cheaperWithout = facts.week && valet?.week && facts.week.priceCents < valet.week.priceCents ? offerText(facts.week) : null;
  const valetPrice = valetWeek
    ? `Chez nos parkings partenaires avec voiturier, une semaine revient aujourd’hui ${valetWeek}, voiturier et navette compris.` +
      (cheaperWithout ? ` Sans voiturier, une semaine est proposée ${cheaperWithout} : l’écart donne une idée du prix du service.` : "")
    : "Chez nos parkings partenaires, le voiturier est une caractéristique du parking : il est compris dans le prix total affiché pour vos dates, comme la navette.";

  return {
    slug: "parking-voiturier",
    short: "Parking avec voiturier",
    metaTitle: "Voiturier aéroport Lyon Saint-Exupéry : 3 formules et prix",
    metaDescription:
      "Voiturier à l’aéroport de Lyon : service de l’aéroport au dépose-minute du Terminal 1, voituriers indépendants, parkings privés. Clés, état des lieux, prix.",
    title: "Parking avec voiturier à l’aéroport de Lyon Saint-Exupéry : les trois formules, pas à pas",
    intro: `À Lyon Saint-Exupéry, « voiturier » recouvre trois services bien différents : celui que vend l’aéroport, qui prend votre voiture au dépose-minute du Terminal 1, les voituriers indépendants qui vous donnent rendez-vous à l’aérogare, et les parkings privés où un voiturier range la voiture sur place pendant qu’une navette vous emmène. Ce guide explique chacun, le jour du départ et celui du retour, ce qu’il faut laisser ou garder, l’état des lieux, la responsabilité en cas de dommage et la logique des prix. Informations de l’aéroport relevées le ${o.readOn} ; depuis le ${o.t2Closed}, tous les vols partent du Terminal 1.`,
    published: "2026-10-09",
    updated: "2026-10-09",
    sections: [
      {
        id: "trois-formules",
        short: "Les trois formules",
        title: "Trois façons de confier sa voiture à un voiturier",
        paragraphs: [
          "Un voiturier conduit et gare votre voiture à votre place. Autour de l’aéroport, le service prend trois formes, qui diffèrent d’abord par l’endroit où vous rendez les clés : à l’aérogare avec le voiturier de l’aéroport ou une société indépendante, sans navette à prendre ; à l’accueil d’un parking privé, dont la navette assure la fin du trajet.",
        ],
        table: {
          caption: "Les trois formules de voiturier à Lyon Saint-Exupéry",
          columns: ["Voiturier de l’aéroport", "Voiturier indépendant", "Parking privé avec voiturier"],
          rows: [
            ["Remise des clés", "Au dépose-minute du Terminal 1", "À l’aérogare, au lieu convenu", "À l’accueil du parking"],
            ["Où reste la voiture", "Parking officiel de l’aéroport (ou annexe d’Alyse Premium)", "Terrain de la société, parfois à plusieurs kilomètres", "Terrain du parking, sous la garde de son équipe"],
            ["Jusqu’au Terminal 1", "À pied, environ 3 min", "À pied depuis le rendez-vous", rideCell ? `Navette, ${rideCell} chez nos partenaires` : "Navette, durée sur chaque fiche"],
            ["Réservation", "En ligne seulement, sur store.lyonaeroports.com", "Site de la société ou comparateur", `Sur ${P}, paiement en ligne par carte`],
            ["Prix", "Affiché une fois les dates saisies", "Propre à chaque société", valetWeek ? `${capitalise(valetWeek)}, voiturier compris` : "Prix total pour vos dates, voiturier compris"],
          ],
          note: `Service de l’aéroport : store.lyonaeroports.com et lyonaeroports.com, relevés le ${o.readOn}. Parkings partenaires : fiches et offres du moment.`,
        },
      },
      {
        id: "voiturier-de-l-aeroport",
        short: "Le voiturier de l’aéroport",
        title: "Le service voiturier de l’aéroport : Alyse Premium et Ector",
        paragraphs: [
          `L’aéroport vend sur sa boutique en ligne, store.lyonaeroports.com, un service voiturier assuré par deux sociétés partenaires : Alyse Premium et Ector. Le rendez-vous est le même à l’aller et au retour, le « dépose-minute de votre terminal », c’est-à-dire celui du Terminal 1 depuis la fermeture du Terminal 2 pour travaux, le ${o.t2Closed}. De là, l’aéroport compte ${v.walkFromMinute} de marche jusqu’à l’aérogare.`,
          "Le service se réserve uniquement en ligne et, selon le règlement intérieur des parkings, s’achète avec une réservation de place. Aucune grille n’est publiée : le tarif s’affiche une fois vos dates saisies, selon la durée prévue, et il est payé à la réservation.",
        ],
        parts: [
          {
            title: "Comment ça marche, du coupon à la borne de sortie",
            paragraphs: [],
            list: [
              "Vous réservez avec un compte client : vols, plaque, marque et couleur de la voiture, téléphone portable.",
              "Un coupon (un QR code) arrive par e-mail, puis, la veille ou le matin du départ, un SMS avec le contact de votre voiturier.",
              "Vous l’appelez en approchant : 20 minutes avant d’arriver chez Alyse Premium, 15 minutes chez Ector.",
              "Au dépose-minute, vous scannez le coupon, faites l’état des lieux avec le voiturier et lui laissez la clé ; il gare la voiture sur un parking officiel de l’aéroport, ou sur un parking annexe chez Alyse Premium.",
              "Au retour, il vous attend au même endroit avec la voiture ; après un nouvel état des lieux, vous sortez en scannant le coupon.",
            ],
          },
          {
            title: "Alyse Premium ou Ector : les conditions qui changent",
            paragraphs: [
              "Les deux pages annoncent que « vous ne payez pas de supplément en cas de retard de vol ou de train ». Les règles de réservation et d’annulation, elles, diffèrent : ce sont celles du prestataire choisi qui s’appliquent.",
            ],
            table: {
              caption: "Le voiturier de l’aéroport : Alyse Premium et Ector",
              columns: ["Alyse Premium", "Ector"],
              rows: [
                ["Réserver", "De 9 mois à 12 h avant la prise en charge", "De 9 mois à 30 h avant (31 h selon les CGV)"],
                ["Annuler", "Non remboursable, sauf « Protection Annulation » : jusqu’à 2 h avant", "Remboursement intégral jusqu’à 24 h avant"],
                ["Modifier", "En ligne jusqu’à 13 h avant", "En ligne jusqu’à 30 h avant ; nouveau vol ou nouvelles dates : nouvelle réservation"],
                ["À la remise", "État des lieux avec vous, parfois sous un portique à caméras", "Brève vérification d’identité, puis état des lieux avec vous"],
                ["En option", "Nettoyage, recharge, place couverte, révision, contrôle technique", "Lavage ou révision"],
              ],
              note: `Pages Alyse Premium et Ector de store.lyonaeroports.com et annexes 5 et 5 bis de ses conditions générales de vente (version au ${v.cgvVersion}), relevées le ${o.readOn}.`,
            },
          },
        ],
      },
      {
        id: "voituriers-independants",
        short: "Les voituriers indépendants",
        title: "Les voituriers indépendants qui donnent rendez-vous à l’aérogare",
        paragraphs: [
          "D’autres sociétés, présentes sur les comparateurs, prennent aussi la voiture à l’aérogare, sans passer par la boutique de l’aéroport. Vous réservez sur leur site, vous appelez en approchant, un voiturier vous retrouve au lieu convenu et gare la voiture sur un terrain de la société, parfois à plusieurs kilomètres ; au retour, vous rappelez une fois vos bagages récupérés.",
          `Ce rendez-vous obéit aux règles de l’aéroport. Son règlement intérieur des parkings, applicable depuis le ${v.rulesSince}, réserve les parkings minute « à l’usage exclusif des particuliers » et interdit dans les parcs les « offres de services non autorisées » par Aéroports de Lyon. Le parking minute est gratuit ${o.minute.free} ; ensuite, ${o.minute.then}. Demandez qui paie l’attente.`,
          "Faites-vous préciser aussi où la voiture sera gardée, les horaires du service et ce que prévoient ses conditions en cas de dommage.",
        ],
      },
      {
        id: "parking-prive-avec-voiturier",
        short: "Parking privé avec voiturier",
        title: "Parking privé avec voiturier : les clés à l’accueil, la voiture reste sur place",
        paragraphs: [
          "Dans un parking privé avec voiturier, vous laissez les clés à l’accueil et un voiturier de l’équipe range la voiture sur le terrain, où elle reste jusqu’à votre retour. Vous montez directement dans la navette, qui vous dépose au Terminal 1, dans la zone où l’aéroport fait arrêter les navettes des parkings extérieurs, à quelques minutes à pied de l’aérogare ; le parking vous indique l’endroit exact.",
          `${valetCount} Les fiches indiquent aussi si le terrain est clôturé et sous vidéosurveillance.`,
        ],
        parts: [
          {
            title: "Des files rangées selon la date de retour",
            paragraphs: [
              "Sur un terrain tenu par des voituriers, les voitures sont souvent garées en files, l’une derrière l’autre, rangées selon leur date de retour pour éviter qu’une voiture qui repart tôt se retrouve derrière une autre qui reste plus longtemps. Une date et une heure de retour justes comptent donc. Si votre vol change, mettez-le à jour sur Ma réservation ; pour une autre date, prévenez le parking.",
            ],
          },
          {
            title: "La place et les clés, notées par le parking",
            paragraphs: [
              "Le parking note la place ou la file de la voiture et le crochet de ses clés. Sur le site, Ma réservation montre où la voiture est rangée le jour du retour ; dans l’application, pendant tout le séjour.",
            ],
          },
        ],
      },
      {
        id: "prix-du-voiturier",
        short: "Le prix du voiturier",
        title: "Combien coûte un voiturier à l’aéroport de Lyon ?",
        more: { href: topicPath("lyon-saint-exupery", "parking-pas-cher"), label: "Le guide du parking pas cher à Lyon Saint-Exupéry" },
        paragraphs: [
          "Il n’existe pas de prix unique : chaque formule fixe le sien, pour vos dates exactes. Le prix du voiturier de l’aéroport s’affiche sur sa boutique en ligne une fois les dates saisies ; les indépendants ont leurs propres tarifs, dont il faut vérifier ce qu’ils comprennent.",
          `Pour se repérer, une semaine dans les parkings de l’aéroport, sans voiturier et sans réservation, va de ${o.week.p5} au P5, relié par navette, à ${o.week.p0} au P0, couvert et sous les terminaux (grille 2026).`,
          valetPrice,
          `Sur ${P}, le prix affiché est le prix total, commission comprise, payé en ligne par carte, sans frais ajoutés à l’arrivée. Seuls les services en plus (lavage, plein, recharge), qui ne se réservent pas en ligne, et les jours au-delà du retour réservé se règlent au parking, à son tarif.`,
        ],
      },
      {
        id: "jour-du-depart",
        short: "Le jour du départ",
        title: "Le jour du départ, étape par étape",
        paragraphs: [
          `L’aéroport conseille d’être à l’aérogare ${o.advice}. Comptez à rebours à partir de cette heure, en ajoutant la remise des clés et, avec un parking privé, la navette.`,
        ],
        parts: [
          {
            title: "Avec le voiturier de l’aéroport",
            paragraphs: [],
            list: [
              "Gardez à portée de main le coupon reçu par e-mail et le SMS avec le contact du voiturier.",
              "Appelez-le en approchant, puis suivez la signalétique du dépose-minute du Terminal 1.",
              "Scannez le coupon, sortez vos bagages, faites le tour de la voiture avec le voiturier et remettez-lui la clé.",
              `Rejoignez l’aérogare à pied, ${v.walkFromMinute} selon l’aéroport.`,
            ],
          },
          {
            title: "Avec un parking privé avec voiturier",
            paragraphs: [],
            list: [
              "Partez avec l’e-mail de confirmation, qui donne l’adresse et le téléphone du parking ; la veille, un rappel vous est en principe envoyé.",
              "Sur la route, prévenez le parking depuis Ma réservation (« J’arrive dans… » ou partage de votre position) : le voiturier vous attend à l’accueil.",
              "Donnez la clé et signalez ce que l’équipe doit savoir : alarme, démarrage particulier, boîte automatique.",
              rideWords
                ? `Montez dans la navette : chez nos parkings partenaires, elle met ${rideWords} jusqu’au Terminal 1.`
                : "Montez dans la navette, qui vous dépose au Terminal 1 ; sa durée figure sur la fiche du parking.",
            ],
          },
        ],
      },
      {
        id: "jour-du-retour",
        short: "Le jour du retour",
        title: "Le jour du retour : retrouver sa voiture sans chercher",
        paragraphs: [],
        parts: [
          {
            title: "Avec le voiturier de l’aéroport",
            paragraphs: [
              "La veille ou le matin du retour, un SMS vous redonne le contact du voiturier. Bagages récupérés, vous le retrouvez au dépose-minute du Terminal 1 avec la voiture, vous en faites le tour ensemble, puis vous sortez en scannant le coupon.",
            ],
          },
          {
            title: "Avec un parking privé avec voiturier",
            paragraphs: [
              "Si vous avez donné votre numéro de vol retour, le parking suit l’atterrissage et vous envoie un SMS avec le point de rendez-vous de la navette. Sur Ma réservation, vous pouvez signaler un vol en retard, un bagage perdu ou un autre imprévu. En général, l’équipe prépare la voiture pendant que la navette vous ramène ; on vous rend la voiture et les clés, et un dernier message de clôture suit la remise.",
              "Le suivi du vol cale la navette, pas la réservation : un retour après la date et l’heure réservées prolonge le séjour, et la prolongation est facturée par le parking, à son tarif. Un nouveau numéro de vol se saisit sur Ma réservation jusqu’au retour ; pour une autre date, appelez le parking. Un retour anticipé n’est pas remboursé.",
            ],
          },
        ],
      },
      {
        id: "cles-papiers-etat-des-lieux",
        short: "Clés, papiers, état des lieux",
        title: "Clés, papiers et état des lieux : quoi laisser, quoi vérifier",
        paragraphs: [],
        parts: [
          {
            title: "Ne laisser que la clé de la voiture",
            paragraphs: [],
            list: [
              "Détachez la clé du trousseau : ni clés de la maison, ni badge d’immeuble.",
              "Gardez la carte grise avec vos papiers plutôt que dans la boîte à gants : en cas de vol de la voiture, elle en faciliterait la revente.",
              "Retirez objets de valeur, appareils électroniques et badge de télépéage.",
              `Sur ${P}, le champ « Un mot pour le parking » du formulaire prévient l’équipe d’une particularité du véhicule avant votre arrivée.`,
            ],
          },
          {
            title: "L’état des lieux, à l’aller et au retour",
            paragraphs: [
              "Avant de remettre la clé, photographiez les quatre côtés, les jantes, le pare-brise, l’intérieur, puis le compteur et la jauge ; gardez ces photos datées jusqu’après le retour. Les voituriers de l’aéroport font l’état des lieux avec vous, et Alyse Premium peut aussi passer la voiture sous un portique à caméras.",
              "Au retour, refaites le même tour avant de partir. Un dommage se signale tout de suite au personnel, en le faisant constater (photos, mention écrite) : plus tard, la preuve est plus difficile. Comparez aussi le kilométrage : sur un parking avec voiturier, la voiture ne devrait faire que les manœuvres du terrain.",
            ],
          },
        ],
      },
      {
        id: "responsabilite-assurance",
        short: "Responsabilité et assurance",
        title: "Responsabilité et assurance : qui répond de la voiture ?",
        paragraphs: [
          "Se garer soi-même et confier ses clés ne reviennent pas au même. Dans les parkings de l’aéroport, le règlement intérieur précise que « le stationnement a lieu aux risques et périls de l’usager », les redevances étant « de simples droits de stationnement et non de gardiennage ». Avec un voiturier, vous remettez la voiture et ses clés à un professionnel qui la conduit et la garde, dans les conditions prévues par la loi et par ses conditions générales : demandez-les avant de réserver.",
          `Chez les parkings partenaires de ${P}, le parking répond de la garde et de la restitution du véhicule et des clés qui lui sont confiés, et il assure son activité, conduite des voitures comprise. Votre propre assurance reste en vigueur. ${P} n’est pas partie au contrat de stationnement : en cas de dommage, adressez-vous au parking et prévenez ${P} avec votre référence et vos photos, pour que la réclamation soit transmise et suivie.`,
        ],
      },
      {
        id: "voiturier-ou-se-garer",
        short: "Voiturier ou se garer soi-même",
        title: "Voiturier ou se garer soi-même : comparer avant de réserver",
        paragraphs: [
          "Le voiturier épargne du temps et de la fatigue, surtout avec des enfants, beaucoup de bagages ou un vol à l’aube ; se garer soi-même laisse les clés dans votre poche et coûte en général moins cher.",
        ],
        table: {
          caption: "Avec ou sans voiturier",
          columns: ["Avec voiturier", "Sans voiturier"],
          rows: [
            ["Les clés", "Remises pour tout le séjour", "Dans votre poche"],
            ["À l’arrivée", "Vous laissez la voiture et partez", "Vous cherchez la place, puis la navette ou l’aérogare"],
            ["Au retour", "La voiture vous est rendue", "Vous la retrouvez vous-même"],
            ["Garde de la voiture", "Le professionnel qui la conduit en répond", "À l’aéroport, « aux risques et périls de l’usager »"],
            ["Prix", "En général plus élevé", "En général moins cher"],
          ],
          note: `Règlement intérieur des parcs de stationnement de l’aéroport, applicable depuis le ${v.rulesSince} (article 4), relu le ${o.readOn}.`,
        },
        parts: [
          {
            title: "Les questions à poser avant de réserver",
            paragraphs: [],
            list: [
              "Où et à quelles heures remet-on les clés, à l’aller comme au retour ?",
              `Où la voiture passe-t-elle le séjour, et le terrain est-il clôturé et sous vidéosurveillance ? Sur ${P}, chaque fiche l’indique.`,
              "Comment se fait l’état des lieux, et que se passe-t-il en cas de dommage ?",
              "Que se passe-t-il si mon vol arrive en retard, ou après la fermeture de l’accueil ?",
              "Quelles sont les conditions d’annulation, et combien coûte un jour de plus ?",
            ],
          },
        ],
      },
    ],
    faq: [
      [
        "Comment fonctionne le voiturier de l’aéroport de Lyon Saint-Exupéry ?",
        `Il se réserve en ligne sur store.lyonaeroports.com et il est assuré par Alyse Premium ou Ector. Au dépose-minute du Terminal 1, vous scannez le coupon reçu par e-mail et remettez la clé au voiturier après un état des lieux ; au retour, il vous attend au même endroit (relevé le ${o.readOn}).`,
      ],
      [
        "Combien coûte un voiturier à l’aéroport de Lyon ?",
        "L’aéroport ne publie pas de grille pour son service voiturier : le prix s’affiche une fois vos dates saisies sur sa boutique en ligne. " +
          (valetWeek
            ? `Chez nos parkings partenaires avec voiturier, une semaine coûte aujourd’hui ${valetWeek}, voiturier et navette compris.`
            : "Dans un parking privé avec voiturier, le service est compris dans le prix total affiché pour vos dates : indiquez-les en haut de la page pour comparer."),
      ],
      [
        "Où remettre ses clés au voiturier à Lyon Saint-Exupéry ?",
        `Avec le service de l’aéroport, au dépose-minute du Terminal 1, à ${v.walkFromMinute} à pied de l’aérogare : depuis le ${o.t2Closed}, le Terminal 2 est fermé et tous les vols partent du Terminal 1. Avec un parking privé avec voiturier, à l’accueil du parking, avant de prendre sa navette.`,
      ],
      [
        "Peut-on réserver un voiturier à l’aéroport de Lyon au dernier moment ?",
        `Pas toujours : sur le site de l’aéroport, Alyse Premium accepte les réservations jusqu’à 12 h avant la prise en charge, Ector jusqu’à 30 h avant selon sa page. Sur ${P}, un parking privé avec voiturier se réserve jusqu’à l’heure de dépôt, tant qu’il reste de la place.`,
      ],
      [
        "Faut-il laisser la carte grise au voiturier ?",
        "En général, non : laissez seulement la clé de la voiture et gardez la carte grise avec vos papiers ; oubliée dans la boîte à gants, elle faciliterait la revente de la voiture en cas de vol.",
      ],
      [
        "Que se passe-t-il si mon vol retour a du retard avec un voiturier ?",
        "Alyse Premium et Ector, les voituriers de l’aéroport, annoncent qu’un retard de vol ou de train ne coûte pas de supplément. Dans un parking privé, le parking suit votre atterrissage et adapte sa navette si vous avez donné votre vol retour, mais un retour après la date et l’heure réservées prolonge le séjour, et la prolongation est facturée par le parking, à son tarif.",
      ],
      [
        "Qui est responsable si le voiturier abîme ma voiture ?",
        "Le professionnel à qui vous confiez la voiture et ses clés en a la garde, dans les conditions prévues par la loi et par ses conditions générales ; votre assurance reste en vigueur. Signalez tout dommage sur place, avant de partir, en le faisant constater par le personnel avec photos et mention écrite.",
      ],
      [
        "Le voiturier peut-il laver ou recharger ma voiture pendant le voyage ?",
        "Souvent, en option : Alyse Premium propose nettoyage, recharge électrique, révision ou contrôle technique, Ector le lavage ou la révision. Dans un parking privé, ces services ne se réservent pas en ligne : demandez-les au parking, qui les facture à son tarif.",
      ],
      [
        "Quelle différence entre un voiturier à l’aérogare et un parking avec voiturier ?",
        "Avec le voiturier de l’aéroport ou une société indépendante, vous laissez et retrouvez la voiture à l’aérogare, sans navette. Avec un parking privé avec voiturier, vous laissez les clés à l’accueil, la voiture reste sur son terrain, et sa navette vous conduit au Terminal 1 puis vous ramène.",
      ],
      [
        "Peut-on annuler une réservation de voiturier ?",
        `Cela dépend du prestataire : chez Ector, remboursement intégral jusqu’à 24 h avant l’entrée au dépose-minute ; chez Alyse Premium, pas de remboursement sans « Protection Annulation ». Sur ${P}, chaque parking choisit l’une de quatre formules (gratuite jusqu’à l’heure de dépôt, 24 h ou 48 h avant, ou non annulable), et le remboursement est automatique dans le délai.`,
      ],
    ],
    partners: {
      filter: "valet",
      stayDays: 7,
      title: "Les parkings partenaires avec voiturier les moins chers pour une semaine",
      lead: "La liste ne garde que les parkings partenaires qui proposent un voiturier et ont de la place pour tout le séjour, du moins cher au plus cher d’après le prix total, aux dates du formulaire de recherche : une semaine par défaut.",
      empty:
        "Aucun parking partenaire avec voiturier n’est encore réservable en ligne pour ces dates. Revenez bientôt ou essayez d’autres dates, et lisez en attendant le guide complet du parking à l’aéroport de Lyon Saint-Exupéry pour comparer toutes les solutions.",
    },
  };
}
