import type { Dict } from "../../fr-dict";
import { PRODUCT_NAME } from "../../product";

const P = PRODUCT_NAME;

/** Romanian plural: "1 zi", "3 zile", "20 de zile" (numbers ending in 01–19 take no "de"). */
const rp = (n: number, one: string, many: string) => {
  if (n === 1) return `1 ${one}`;
  const rest = n % 100;
  return n === 0 || (rest >= 1 && rest <= 19) ? `${n} ${many}` : `${n} de ${many}`;
};

const roDays = (days: number) => rp(days, "zi", "zile");

/** Romanian texts of the site. */
export const ro: Dict = {
  dates: {
    weekdays: ["dum.", "lun.", "mar.", "mie.", "joi", "vin.", "sâm."],
    months: ["ian.", "feb.", "mar.", "apr.", "mai", "iun.", "iul.", "aug.", "sept.", "oct.", "nov.", "dec."],
    longMonths: ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"],
    day: (weekday: string, day: number, month: string) => `${weekday} ${day} ${month}`,
    longDate: (day: number, month: string, year: number) => `${day} ${month} ${year}`,
    at: (day: string, time: string) => `${day} la ${time}`,
    days: roDays,
  },
  money: {
    decimal: ",",
    group: ".",
    symbolFirst: false,
  },
  units: {
    oneDay: "pentru o zi",
    forDays: (days: string) => `pentru ${days}`,
  },
  meta: {
    defaultTitle: `${P} · Parcări la aeroport cu navetă`,
    defaultDescription:
      "Comparați parcările private cu navetă din jurul aeroportului, vedeți prețul total pentru datele dumneavoastră și rezervați online. Plată securizată cu cardul.",
    airportTitle: (airport: string) => `Parcare aeroport ${airport} cu navetă`,
    airportDescription: (airport: string) =>
      `Parcări private la aeroportul ${airport} cu navetă gratuită până la terminale: preț total pentru datele dumneavoastră, rezervare și plată online.`,
    resultsTitle: (airport: string) => `Parcări disponibile la ${airport}`,
    parkingTitle: (parking: string, airport: string) =>
      `${parking} · parcare aeroport ${airport}`,
    parkingDescription: (parking: string, airport: string) =>
      `${parking}, parcare cu navetă pentru aeroportul ${airport}: tarife, servicii, acces și rezervare online.`,
    bookingTitle: "Finalizați rezervarea",
    manageTitle: "Rezervarea mea",
    notFoundTitle: "Pagină negăsită",
  },
  a11y: {
    skipToContent: "Mergeți la conținut",
    mainNav: "Navigare principală",
    breadcrumb: "Traseu de navigare",
    photoPlaceholder: "Fotografiile parcării vor fi adăugate în curând",
    photoSoon: "Fotografii în curând",
    photoOf: (title: string, n: number) => `${title}, fotografia ${n}`,
    opensNewTab: "(filă nouă)",
  },
  demo: {
    badge: "Demo",
    hint: "Parcare fictivă, prezentată în scop demonstrativ",
  },
  nav: {
    airports: "Aeroporturi",
    myBooking: "Rezervarea mea",
    forOperators: "Administrați o parcare?",
    home: "Acasă",
    results: "Rezultate",
  },
  footer: {
    pitch:
      "Parcările de aeroport cu navetă, comparate și rezervate online. Prețul total afișat.",
    airports: "Aeroporturi",
    moreAirports: "În curând, alte aeroporturi",
    travellers: "Călători",
    faq: "Întrebări frecvente",
    contact: "Contactați-ne",
    product: P,
    terms: "Condiții generale",
    privacy: "Confidențialitate",
    legal: "Mențiuni legale",
    deleteProAccount: `Ștergerea unui cont ${P} Pro`,
    proLogin: "Conectare la spațiul pentru operatori",
    paymentTitle: "Plată securizată",
    paymentMethods: "Metode de plată acceptate",
    paymentChips: ["CB", "Visa", "Mastercard", "Apple Pay", "Google Pay"],
    paymentText:
      "Plătit online la rezervare, prin Stripe. Nimic de achitat la parcare.",
    followTitle: "Urmăriți-ne",
    followOn: (network: string) => `${P} pe ${network}`,
    rights: "Toate drepturile rezervate",
    vat: (number: string) => `TVA ${number}`,
  },
  help: {
    eyebrow: "Aveți nevoie de ajutor?",
    title: "O întrebare despre rezervarea dumneavoastră?",
    leadHours: (hours: string) => `Echipa noastră vă răspunde ${hours}.`,
    leadBoth: "Echipa noastră vă răspunde la telefon sau în scris.",
    leadPhone: "Echipa noastră vă răspunde la telefon.",
    leadWritten: "Scrieți-ne: echipa noastră vă răspunde prin e-mail.",
    leadSelf:
      "Rezervarea dumneavoastră se găsește online cu referința și adresa de e-mail, iar răspunsurile la cele mai frecvente întrebări sunt în secțiunea noastră de întrebări frecvente.",
    dayOfDeparture:
      "În ziua plecării, sunați direct parcarea: numărul se află în confirmare și în „Rezervarea mea”.",
    byPhone: "La telefon",
    call: "Sunați",
    callLabel: "Sunați serviciul clienți",
    inWriting: "În scris",
    contactForm: "Formular de contact",
    replyWithin: (delay: string) => `Răspuns prin e-mail în ${delay}.`,
    replyByEmail: "Răspuns prin e-mail.",
    write: "Scrieți-ne",
    findBooking: "Găsiți rezervarea mea",
    faq: "Întrebări frecvente",
  },
  proHome: {
    metaTitle: `Software de gestionare a parcărilor de aeroport · ${P} Pro`,
    metaDescription: `Software pentru parcări de aeroport cu navetă și valet: rezervările de pe comparatoare, plan, navetă, contract și constatarea stării mașinii. Demo gratuit.`,
    nav: { software: "Software", live: "Navetă și clienți", marketplace: `Vindeți pe ${P}`, paperwork: "Contract și constatarea stării", pricing: "Tarife" },
    heroTitle: "Software-ul parcărilor",
    heroAccent: "de aeroport",
    heroLead: "Pentru parcările cu navetă și valeți: navetele în timp real, clienți care vă anunță, fiecare mașină la locul ei. Pe calculator și pe telefon.",
    map: {
      label: "Hartă: parcarea, o navetă în drum spre Terminal 1",
      live: "În direct",
      liveSection: "Navetă în direct · Terminal 1 în 7 min",
      driver: "Karim · 3 pers.",
      terminal: "Terminal 1 · 7 min",
    },
    liveTitle: "Clienții nu vă mai sună",
    liveAccent: "deloc",
    liveLead: "Văd naveta venind și vă anunță dintr-o atingere: sosire, întârzierea zborului, bagaj pierdut.",
    feedTitle: "Ce primește echipa dumneavoastră",
    messages: [
      { tone: "info", icon: "↗", title: "Dupont · Sunt pe drum", text: "„Venim cu o bicicletă pe plafon”", at: "06:05" },
      { tone: "info", icon: "10", title: "Leroy · Ajung în 10 min", text: "AB-123-CD", at: "06:20" },
      { tone: "ok", icon: "✓", title: "Petit · Sunt la punctul de întâlnire", text: "Terminal 1 · ieșirea 4", at: "14:42" },
      { tone: "warn", icon: "!", title: "Martin · Zborul meu are întârziere", text: "aterizează în jur de 22:10", at: "21:05" },
    ],
    liveGains: [
      "Naveta pleacă la momentul potrivit: șoferul știe cine așteaptă și unde.",
      "Mai puține apeluri la recepție: clientul vede naveta în rezervarea sa.",
      "O întârziere a zborului nu mai face naveta să aștepte degeaba.",
      "Clientul este anunțat când mașina îl așteaptă.",
    ],
    buildOffer: "Alcătuiți oferta mea",
    facts: [
      { value: "6", label: "comparatoare recunoscute" },
      { value: "4", label: "posturi: administrator, recepție, șofer, valet" },
      { value: "Web · iPhone · Android", label: "aceeași echipă peste tot" },
    ],
    productsTitle: "Tot ce îi trebuie unei parcări de aeroport",
    productsLead: "Patru instrumente care lucrează împreună. Alegeți-le în formula care vi se potrivește.",
    tryInDemo: "Încercați în demo ›",
    products: {
      software: {
        tag: "Software",
        title: "Parcarea dumneavoastră dintr-o privire",
        points: [
          "Toate rezervările într-un singur planning",
          "Fiecare mașină parcată astfel încât să plece fără a muta alta",
          "Cifra de afaceri, fără comisioanele comparatoarelor",
        ],
      },
      app: {
        tag: `Aplicația ${P} Pro`,
        title: "Pentru șofer, valet și recepție",
        points: ["Fiecare vede ce are de făcut, după postul său", "Șoferul știe pe cine duce și pe cine aduce", "Valetul știe unde să parcheze fiecare mașină"],
      },
      marketplace: {
        tag: `Vindeți pe ${P}`,
        title: "Clienți noi, fără efort",
        points: [`Parcarea dumneavoastră pe comparatorul ${P}`, "Clienții rezervă și plătesc online", "15 % pe rezervare plătită, altfel nimic"],
      },
      paperwork: {
        tag: "Contract și constatarea stării",
        title: "Un litigiu? Aveți dovezile",
        points: ["Contractul dumneavoastră semnat de fiecare client", "Fotografii la predare și la retur, alăturate", "Totul este păstrat și găsit dintr-un clic"],
      },
    },
    screens: {
      onSite: "La parcare",
      arrivals: "Sosiri",
      returns: "Retururi",
      toHandle: "De rezolvat",
      lateFlight: "Zbor întârziat",
      returnLabel: "retur",
      go: "Dus · 6",
      back: "Întors · 3",
      leave: "Plecare · 3 pers.",
      listingName: "Parking des Cèdres",
      live: "Navetă în direct",
      listingLine: "7 zile · 49 € · navetă 8 min",
      paidLine: "Plătit online · virat în contul dumneavoastră",
      signed: "Contract semnat",
      atCounter: "La recepție",
      dropoff: "Constatare la predare · 4 fotografii",
      atReturn: "La retur:",
      already: "Existent la predare",
      fresh: "Nou",
      day: "Mar. 27 · 14 sosiri · 9 retururi · 87 de mașini",
      paid: "plătit",
    },
    centralTitle: "Centralizați rezervările",
    centralLead: `Totul în același loc: comparatoarele, telefonul, recepția și ${P}.`,
    channels: ["Allopark", "Onepark", "Parclick", "ParkMundo", "ParkVia", "Park Hit", P, "Telefon", "Recepție"],
    gains: [
      { title: "Câștigați timp", text: "Fără reintroducerea datelor: fiecare rezervare ajunge singură în planning." },
      { title: "Câștigați bani", text: `Fără suprarezervări și cu clienți noi datorită fișei dumneavoastră pe ${P}.` },
      { title: "Clienți liniștiți", text: "Anunțați cu o zi înainte, preluați la timp chiar dacă zborul are întârziere." },
    ],
    fieldTitle: "Creat pe teren",
    fieldLead: `${P} este construit împreună cu o parcare cu valet de la aeroportul Lyon Saint-Exupéry, pornind de la ceea ce îi consumă timp în fiecare zi.`,
    fieldPains: [
      "Rezervări care vin din toate părțile",
      "Mașini de mutat pentru a scoate alta",
      "Clienți care așteaptă naveta la întoarcere",
      "Litigii fără dovezi despre starea mașinii",
    ],
    featuresKicker: "Funcționalități",
    featuresTitle: `Tot ce face ${P} Pro`,
    featuresLead: "De la primul e-mail al comparatorului până la clientul care pleacă cu cheile: un singur instrument pentru toată echipa, pe calculator și pe telefon.",
    features: [
      {
        icon: "day",
        title: "Ziua dumneavoastră",
        items: [
          "Următoarele sosiri și plecări, care avansează odată cu ziua",
          "Întârzierile detectate automat",
          "Mașinile din parcare, noapte de noapte, până la 3 luni",
          "Un post pentru fiecare persoană: recepție, șofer, valet, administrator",
          "O notificare atunci când trebuie să acționați",
        ],
      },
      {
        icon: "bookings",
        title: "Rezervările dumneavoastră",
        items: [
          "Comparatoarele ajung singure în planning",
          "Modificări și anulări luate în calcul",
          "Clienții neprezentați și mașinile uitate semnalate",
          "Istoricul fiecărei rezervări: cine, ce, când",
          "Rezervările vechi importate dintr-un fișier",
        ],
      },
      {
        icon: "shuttle",
        title: "Navetă și mașini",
        items: [
          "Clienții de dus și de adus, pe intervale orare",
          "Ora reală de aterizare a fiecărui client",
          "Clienții văd naveta venind",
          "Fiecare mașină la locul ei, cheile la cârligul lor",
          "Contract semnat și constatarea stării în fotografii",
        ],
      },
      {
        icon: "money",
        title: "Banii dumneavoastră",
        items: [
          "Cifra de afaceri pe lună și pe comparator",
          "Cât vă ia fiecare comparator și cât păstrați",
          "Rezervările fără preț evidențiate",
          "Servicii suplimentare (spălare, încărcare) și suprataxe (întârziere, noapte)",
          "Facturi pe numele și cu logo-ul dumneavoastră",
        ],
      },
    ],
    featuresBand: `Iar clienții vă găsesc pe ${P.toLowerCase()}.fr: rezervare și plată online, fără nimic de gestionat.`,
    pricesTitle: "Alcătuiți-vă oferta",
    pricesLead: "Fără angajament la plata lunară. Prețuri fără TVA, pe lună și pe parcare.",
    planLines: { essentiel: "Toate rezervările în același loc", operations: "+ plan, șiruri pentru valet și navete", complet: "+ contract, constatarea stării și marje" },
    recommended: "recomandată",
    allPrices: "Vedeți toate tarifele",
    faqTitle: "Întrebări frecvente",
    faq: [
      [`Ce comparatoare citește ${P} Pro?`, "Allopark, Onepark, Parclick, ParkMundo, ParkVia și Park Hit. Redirecționați e-mailurile lor către adresa parcării dumneavoastră, iar rezervarea se creează singură în planning."],
      ["Clienții trebuie să instaleze o aplicație?", `Nu. Linkul rezervării se deschide și în browser. Aplicația ${P} le adaugă notificările.`],
      ["Funcționează pentru o parcare cu valet fără marcaje?", "Da. Mașinile sunt așezate în șiruri după data de retur, astfel încât fiecare să plece fără a muta alta."],
      ["Cât costă?", "Între 99 € și 299 € fără TVA pe lună și pe parcare, în funcție de formulă, −10 % la plata anuală. Fără angajament la plata lunară."],
      ["Pe ce dispozitive?", `Pe calculator, în browser, și pe telefoanele Android cu aplicația ${P} Pro. Aplicația pentru iPhone este în curs de validare la Apple.`],
      ["Pot încerca înainte?", "Da: demo-ul este gratuit, fără înregistrare. Alegeți un post (administrator, recepție, șofer sau valet) și încercați pe o parcare fictivă."],
    ] as [string, string][],
    learnMore: "Aflați mai multe ›",
    topicsTitle: "Citiți și",
    breadcrumbSolutions: "Soluții",
    topicCtaTitle: "Încercați-l pe o parcare",
    topicCtaLead: "Demo-ul este gratuit și fără înregistrare: alegeți un post și parcurgeți ziua unei parcări fictive.",
    topicProblem: "Problema",
    topicGains: "Ce se schimbă",
    topicScreens: "Ce vede echipa dumneavoastră",
    contactTitle: "Aveți o întrebare?",
    contactLead: `Încercați demo-ul chiar acum sau lăsați-ne datele de contact: vă sunăm pentru a vă arăta ${P} pe parcarea dumneavoastră.`,
    askDemo: "Solicitați un demo",
    demoSent: `Mulțumim: vă scriem foarte curând pentru a vă arăta ${P} pe parcarea dumneavoastră.`,
    footer: { solutions: "Soluții", start: "Începeți", plazo: P, travellers: "Site pentru călători", contact: "Contact" },
    appStoreSoon: "App Store: în curând",
    playStore: `${P} Pro pe Google Play`,
  },
  proPricing: {
    metaTitle: `Tarifele software-ului pentru parcări de aeroport · ${P} Pro`,
    metaDescription: `Software pentru parcări de aeroport: rezervări, comparatoare, plan, navetă. Alcătuiți oferta ${P} Pro și vedeți prețul imediat.`,
    navPricing: "Tarife",
    navTravellers: "Pentru călători",
    login: "Conectare",
    tryDemo: "Încercați demo-ul",
    signup: "Înscrieți parcarea mea",
    eyebrow: "Tarife",
    title: "Alcătuiți oferta parcării dumneavoastră",
    lead: `Alegeți formula, adăugați fișa pe ${P} și opțiunile: totalul se calculează singur, lunar sau anual.`,
    anchors: { software: "Software", marketplace: `Fișa pe ${P}`, options: "Opțiuni" },
    billing: "Facturare",
    monthly: "Lunar",
    yearly: "Anual",
    softwareTitle: "Software-ul parcării",
    softwareLead: `Web și aplicația ${P} Pro (iPhone, Android) în toate formulele. Fiecare formulă include tot ce face cea anterioară.`,
    plans: "Formulă",
    recommended: "Recomandat",
    perMonth: "fără TVA / lună",
    choose: "Alegeți",
    chosen: "Aleasă",
    marketTitle: `Fișa dumneavoastră pe ${P}`,
    marketLead: `Călătorii vă găsesc parcarea pe plazo.fr și în aplicația ${P}, rezervă și plătesc online. ${P} încasează și vă virează partea dumneavoastră.`,
    marketHeadline: "Fără abonament, un comision pe rezervare",
    marketPitch: `Plătiți doar pentru ce vă aduce ${P}.`,
    marketPoints: [
      "Fișă cu fotografii, tarife, navetă în direct și recenzii",
      "Plată online cu cardul, Apple Pay și Google Pay",
      "Rezervări direct în planning",
      "Servicii suplimentare vândute călătorului (spălare, încărcare)",
    ],
    marketToggle: `Adăugați fișa mea pe ${P}`,
    marketRate: `pe rezervare plătită pe ${P}, reținut din virament`,
    example: "Exemplu",
    exampleStay: "Sejur de o săptămână",
    exampleCommission: `Comision ${P}`,
    exampleNet: "Primiți",
    optionsTitle: "Opțiuni",
    optionsLead: "De adăugat atunci când aveți nevoie.",
    soon: "În curând",
    onQuote: "La cerere",
    once: "o singură dată",
    recap: "Selecția dumneavoastră",
    commissionLine: (rate: number) => `${rate} % pe rezervare`,
    commissionNote: `Comisionul se datorează doar pentru rezervările plătite pe ${P}.`,
    total: (yearly: boolean) => `Total ${yearly ? "anual" : "lunar"} fără TVA`,
    perMonthShort: " / lună",
    perYearShort: " / an",
    yearlyNote: (monthly: string) => `adică ${monthly} pe lună`,
    noCommitment: "fără angajament",
    atOrder: (amount: string) => ` · + ${amount} la comandă`,
    askQuote: "Solicitați o ofertă",
    trust: ["Fără angajament la plata lunară", "Punere în funcțiune împreună cu dumneavoastră: plan, comparatoare, echipă"],
    totalShort: "Total fără TVA",
    questionTitle: "O întrebare despre tarife?",
    questionLead: `Încercați demo-ul ${P} Pro fără cont sau lăsați-vă datele de contact: vă sunăm pentru a analiza împreună parcarea dumneavoastră.`,
    form: {
      firstName: "Prenume",
      lastName: "Nume",
      parking: "Parcare",
      email: "E-mail",
      phone: "Telefon",
      airport: "Aeroport",
      airportOther: "Alt aeroport",
      optional: "opțional",
      sending: "Se trimite…",
      sent: "Cerere trimisă",
      sentText: "Mulțumim: vă scriem foarte curând cu o ofertă pentru parcarea dumneavoastră.",
      honeypot: "Nu completați acest câmp",
    },
    footerPitch: "Parcarea, de la sosire până la retur.",
  },
  contact: {
    title: "Contactați-ne",
    description: `Scrieți serviciului clienți ${P}: o întrebare despre o rezervare, o parcare sau site.`,
    lead: (delay: string | null) =>
      `O întrebare despre o rezervare, o parcare sau site? Scrieți-ne: echipa noastră vă răspunde prin e-mail${delay ? ` în ${delay}` : ""}.`,
    name: "Prenume și nume",
    email: "E-mail",
    emailHint: "Vă răspundem la această adresă.",
    reference: "Referința rezervării",
    optional: "opțional",
    referenceHint: "Se află în e-mailul de confirmare.",
    message: "Mesajul dumneavoastră",
    messageHint:
      "Între 10 și 2.000 de caractere. Nu scrieți niciodată datele cardului bancar.",
    honeypot: "Nu completați acest câmp",
    submit: "Trimiteți mesajul",
    sending: "Se trimite…",
    privacy: `Mesajul dumneavoastră este trimis prin e-mail serviciului clienți ${P}, care vă răspunde la adresa indicată; ${P} nu îl păstrează după această trimitere.`,
    privacyLink: "Confidențialitate",
    sentTitle: "Mesaj trimis",
    sentText: (delay: string | null) =>
      `Mulțumim, echipa noastră vă răspunde prin e-mail${delay ? ` în ${delay}` : ""}. Nu uitați să verificați și dosarul de mesaje nedorite.`,
    writeAnother: "Scrieți alt mesaj",
    phoneTitle: "La telefon",
    unavailableTitle: "Formularul de contact va fi disponibil în curând",
    unavailableText:
      "Până atunci, găsiți rezervarea în „Rezervarea mea” cu referința și adresa de e-mail, iar răspunsurile la cele mai frecvente întrebări în secțiunea de întrebări frecvente.",
  },
  newsletter: {
    title: `Buletinul ${P}`,
    text: "Aeroporturi noi, parcări noi și oferte de sezon.",
    placeholder: "Adresa dumneavoastră de e-mail",
    submit: "Abonare",
    sending: "O clipă…",
    consent: `Prin abonare, acceptați să primiți buletinul ${P} prin e-mail; adresa dumneavoastră servește doar acestui scop.`,
    unsubscribe: "Dezabonare dintr-un clic, în fiecare buletin.",
    privacyLink: "Confidențialitate",
    sent: "Mulțumim! Confirmați abonarea cu linkul din e-mailul pe care vi-l trimitem. Sunteți deja abonat? Nu trebuie să faceți nimic.",
    honeypot: "Nu completați acest câmp",
  },
  letterConfirmed: {
    title: "Abonare confirmată",
    text: `Mulțumim! Veți primi buletinul ${P} la această adresă: aeroporturi noi, parcări noi și oferte de sezon. Pentru dezabonare, ajunge un clic, din fiecare buletin.`,
    home: "Înapoi la pagina principală",
  },
  search: {
    airport: "Aeroport",
    dropOff: "Predarea mașinii",
    pickUp: "Retur (aterizare)",
    dropOffDate: "Data predării",
    dropOffTime: "Ora predării",
    pickUpDate: "Data returului",
    pickUpTime: "Ora returului",
    submit: "Căutați",
    update: "Actualizați",
    modify: "Modificați căutarea",
  },
  picker: {
    yourDates: "Datele dumneavoastră",
    dropOff: "Predare",
    pickUp: "Retur",
    time: "Ora",
    choose: "Alegeți",
    dropOffTime: "Ora predării",
    pickUpTime: "Ora returului",
    hint: "Primul clic: predare · al doilea clic: retur",
    pickDropOff: "Alegeți data predării",
    pickReturn: "alegeți returul",
    clear: "Ștergeți",
    confirm: "Confirmați",
    confirmDates: "Confirmați datele",
    close: "Închideți",
    prevMonth: "Luna anterioară",
    nextMonth: "Luna următoare",
    moreTimes: "derulați pentru mai multe ore",
    today: "astăzi",
    pill: (label: string, value: string | null) =>
      `${label}: ${value ?? "de ales"}`,
  },
  home: {
    heroTitle: (airport: string) =>
      `Parcare la aeroportul ${airport}, navetă inclusă`,
    heroTitleShort: "Parcare aeroport, navetă inclusă",
    photoCredit: "Fotografie: Pexels",
    chips: ["Preț total", "Navetă gratuită", "Anulare clară"],
    heroLead:
      "Comparați parcările private din jurul aeroportului, vedeți prețul total pentru datele dumneavoastră și rezervați online.",
    heroFind: "Parcarea dumneavoastră la",
    heroNear: (airport: string) => `aeroportul ${airport}`,
    heroKicker: "Gata de plecare?",
    mapAvailable: (n: number) =>
      n === 0
        ? "Niciun loc la aceste date"
        : n === 1
          ? "1 parcare disponibilă"
          : `${rp(n, "parcare", "parcări")} disponibile`,
    mapDistance: (km: string | null, shuttle: number | null) =>
      [km ? `${km} km` : null, shuttle ? `navetă ${shuttle} min` : null]
        .filter(Boolean)
        .join(" · "),
    featuredSub: (valet: boolean, shuttle: number | null) =>
      `${valet ? "Valet" : "Parcați singur"}${shuttle ? ` · navetă ${shuttle} min` : ""}`,
    featuredSee: (title: string) => `Vedeți ${title}`,
    mapShuttles: (n: number) =>
      n === 1 ? "1 navetă în circulație" : `${rp(n, "navetă", "navete")} în circulație`,
    mapFull: "Complet la aceste date",
    mapSeeAnyway: "Vedeți parcarea",
    trust: [
      ["Preț total afișat", "taxe incluse"],
      ["Navetă gratuită", "până la terminale"],
      ["Anulare clară", "condiții vizibile înainte de rezervare"],
    ] as [string, string][],
    howTitle: "Cum funcționează",
    how: [
      [
        "Rezervați și plătiți online",
        "Comparați parcările și alegeți-o pe a dumneavoastră. Plată securizată cu cardul: locul vă este garantat pentru toate datele.",
      ],
      [
        "Predați mașina",
        "Prezentați-vă la recepția parcării: totul este deja achitat. Naveta vă duce la terminal în câteva minute.",
      ],
      [
        "Naveta vă așteaptă la întoarcere",
        "Indicați zborul de întoarcere: parcarea urmărește ora aterizării și vă anunță prin SMS.",
      ],
    ] as [string, string][],
    partnersTitle: (airport: string) => `Parcările partenere de la ${airport}`,
    partnersCount: (n: number) =>
      `${rp(n, "parcare", "parcări")}${n < 3 ? " · urmează și altele" : ""}`,
    noPartners: (airport: string) =>
      `Nicio parcare nu este încă online la ${airport}. Reveniți curând.`,
    from: "de la",
    seeParking: "Vedeți parcarea",
    ownerCallout: "Administrați o parcare lângă aeroport?",
    ownerJoin: `Alăturați-vă ${P}`,
    ownerPitch: "planning, navetă și rezervări online în același loc.",
    faqTitle: "Întrebări frecvente",
    faqLead: (airport: string) =>
      `Cele mai frecvente întrebări despre parcarea de la aeroportul ${airport}.`,
    faq: [
      [
        "Cu cât timp înainte de zbor trebuie să ajung la parcare?",
        "Socotiți durata navetei indicată pentru fiecare parcare (adesea sub 15 minute), pe lângă timpul recomandat de compania aeriană.",
      ],
      [
        "Cum funcționează returul?",
        "Parcarea urmărește zborul dumneavoastră de întoarcere. La aterizare, primiți un SMS cu punctul de întâlnire al navetei.",
      ],
      [
        "Cum plătesc?",
        `Cu cardul bancar, online, în momentul rezervării: plată securizată cu cardul pe ${P}, pe pagina furnizorului nostru Stripe. Nu vedem niciodată cardul dumneavoastră și nu aveți nimic de achitat la parcare.`,
      ],
      [
        "Pot anula?",
        "Da, conform condițiilor parcării alese, afișate pe fișa acesteia și reamintite înainte de rezervare. O anulare gratuită este rambursată integral pe card în 5–10 zile.",
      ],
    ] as [string, string][],
  },
  guide: {
    onThisPage: "Pe această pagină",
    updated: (date: string) => `Actualizat la ${date}`,
    searchTitle: "Comparați prețurile pentru datele dumneavoastră",
    seeAllResults: "Vedeți toate parcările pentru aceste date",
    faqTitle: "Întrebări frecvente",
    otherGuides: "Celelalte ghiduri",
    airportGuide: (airport: string) =>
      `Ghidul complet al parcării la aeroportul ${airport}`,
    footerLink: (topic: string, airport: string) => `${topic} la ${airport}`,
  },
  results: {
    available: (n: number) =>
      n === 0
        ? "Nicio parcare disponibilă"
        : n === 1
          ? "1 parcare disponibilă"
          : `${rp(n, "parcare", "parcări")} disponibile`,
    filters: "Filtre",
    services: "Servicii",
    cancellation: "Anulare",
    freeCancellation: "Anulare gratuită",
    shuttle: "Drumul cu naveta",
    shuttleMax: (n: number) => `max. ${n} min`,
    shuttleAny: "Oricât",
    totalPrice: "Preț total",
    maxPrice: "Preț total maxim",
    upTo: (price: string) => `până la ${price}`,
    apply: "Aplicați filtrele",
    clear: "Ștergeți filtrele",
    sort: "Sortați",
    sortBy: {
      prix: "Preț",
      navette: "Cea mai scurtă navetă",
      distance: "Distanță",
    },
    cheapest: "Cel mai ieftin",
    fastestShuttle: "Cea mai rapidă navetă",
    liveFilter: "Navetă în direct",
    allIn: (days: number) => `${roDays(days)}, totul inclus`,
    nightFeesIncluded: "Prețuri totale pentru datele dumneavoastră, taxele de noapte incluse.",
    live: "În direct",
    liveTitle:
      "Navetă urmărită în direct: o veți vedea venind în rezervarea dumneavoastră.",
    seeAndBook: "Vedeți și rezervați",
    full: "Complet la aceste date",
    fullHint: "Încercați alte date",
    noPrice: "Niciun tarif pentru această durată",
    noPriceHint: "Încercați un sejur mai scurt",
    footnote:
      "Prețuri totale pentru datele dumneavoastră, taxe incluse, plătite online cu cardul. Ziua sosirii și ziua returului se socotesc fiecare drept o zi.",
    noneTitle: "Nicio parcare pentru aceste date",
    noneText:
      "Nicio parcare parteneră nu are loc pentru întregul sejur. Încercați alte date.",
    noMatchTitle: "Nicio parcare nu corespunde filtrelor",
    noMatchText: "Lărgiți criteriile pentru a vedea mai multe parcări.",
    datesTitle: "Indicați datele",
    datesText:
      "Alegeți datele de predare și de retur pentru a vedea parcările disponibile și prețul lor total.",
  },
  highlights: {
    perDay: (price: string) => `${price}/zi`,
    newOnPlatform: `Nou pe ${P}`,
    bandLabel: "Esențialul",
    evChip: "Încărcare",
    cancelChip: {
      untilArrival: "Gratuit până la sosire",
      h24: "Gratuit 24 h",
      h48: "Gratuit 48 h",
      nonRefundable: "Nerambursabil",
    },
    chips: {
      outdoor: "În aer liber",
      covered: "Acoperit",
      keysValet: "Trebuie să predați cheile",
      keysValetShort: "Chei de predat",
      keysSelf: "Păstrați cheile",
      keysSelfShort: "Chei păstrate",
      open24h: "Deschis non-stop",
      open24hShort: "Non-stop",
      openHours: (hours: string) => `Deschis ${hours}`,
    },
    shuttleBox: {
      title: "Navetă gratuită",
      ride: "Drum",
      wait: "Așteptare med.",
      waitShort: "Așteptare",
      waitFull: "Așteptare medie",
      minutes: (min: number) => `${min} min`,
      live: "Navetă în direct",
      dayJ: "Urmărită în direct în ziua respectivă",
      parking: "Parcare",
      terminal1: "Terminal 1",
      airport: "Aeroport",
      destination: (place: string, min: number | null) =>
        min ? `${place} · ${min} min` : place,
      rail: (
        place: "terminal1" | "airport",
        running: number | null,
        placed: number,
      ) => {
        const to = place === "terminal1" ? "la Terminal 1" : "la aeroport";
        if (running === null) return `Drumul de la parcare ${to}`;
        if (running === 0)
          return `Drumul de la parcare ${to}, nicio navetă pe drum în acest moment`;
        const road = `${running === 1 ? "1 navetă" : rp(running, "navetă", "navete")} pe drum între parcare și ${place === "terminal1" ? "Terminal 1" : "aeroport"}`;
        return placed === 0
          ? `${road}, ${running === 1 ? "încă neplasată" : "încă neplasate"} pe traseu`
          : road;
      },
    },
    kmFromTerminals: (km: string) => `La ${km} km de terminale`,
    tiles: {
      shuttleLive: "Navetă în direct",
      shuttleFree: "Navetă gratuită",
      free: "gratuită",
      ride: (min: number) => `drum ${min} min`,
      wait: (min: number) => `așteptare medie ${min} min`,
      followLive: "urmăriți-o pe hartă în ziua respectivă",
      toTerminal1: "spre Terminal 1",
      toAirport: "spre aeroport",
      outdoor: "În aer liber",
      outdoorText: "Parcare în aer liber",
      covered: "Acoperit",
      coveredText: "Parcare acoperită",
      fenced: "împrejmuită",
      cctv: "supraveghere video",
      keysValet: "Trebuie să predați cheile",
      keysValetText: "Un valet vă parchează mașina",
      keysSelf: "Păstrați cheile",
      keysSelfText: "Parcați singur",
      open24h: "Deschis non-stop",
      open24hText: "Predare și retur la orice oră",
      openHours: (hours: string) => `Deschis ${hours}`,
      openHoursText: "Predare și retur în acest program",
      freeCancellation: "Anulare gratuită",
      cancellationText: {
        free_until_arrival: "până la sosire",
        free_24h: "până cu 24 h înainte",
        free_48h: "până cu 48 h înainte",
      } as Record<string, string>,
      nonRefundable: "Nerambursabil",
      nonRefundableText: "nicio rambursare în caz de anulare",
    },
  },
  map: {
    show: "Afișați harta",
    hide: "Ascundeți harta",
    title: "Harta parcărilor",
    terminals: "Terminale",
    noPosition: "Poziție necompletată",
    full: "Complet",
    noPrice: "Fără tarif",
    loading: "Se încarcă harta…",
    failed: "Harta nu a putut fi afișată.",
    attribution: "© IGN – Plan IGN",
    marker: (title: string, state: string) => `${title}, ${state}`,
    markerLive: (title: string, state: string) =>
      `${title}, ${state}, navetă urmărită în direct`,
    shuttle: (parking: string, direction: "pickup" | "dropoff") =>
      `Naveta ${parking} · ${direction === "dropoff" ? "spre terminal" : "spre aeroport"}`,
    shuttleAge: (seconds: number) =>
      seconds < 60
        ? `poziție de acum ${seconds} s`
        : `poziție de acum ${Math.round(seconds / 60)} min`,
    controls: {
      "Map.Title": "Hartă",
      "NavigationControl.ZoomIn": "Măriți",
      "NavigationControl.ZoomOut": "Micșorați",
      "AttributionControl.ToggleAttribution": "Afișați creditele",
      "CooperativeGesturesHandler.WindowsHelpText":
        "Folosiți Ctrl + rotița pentru a mări harta",
      "CooperativeGesturesHandler.MacHelpText":
        "Folosiți ⌘ + rotița pentru a mări harta",
      "CooperativeGesturesHandler.MobileHelpText":
        "Folosiți două degete pentru a deplasa harta",
    },
    notDrawn: (n: number) =>
      n === 1
        ? "1 parcare nu are poziție pe hartă."
        : `${rp(n, "parcare", "parcări")} nu au poziție pe hartă.`,
  },
  parking: {
    itinerary: "Itinerar",
    kmFromTerminals: (km: string) => `${km} km de terminale`,
    shuttle: "Navetă",
    hours: "Program",
    parkingType: "Parcare",
    fenced: "împrejmuită",
    cancellation: "Anulare",
    presentation: "Prezentare",
    howItGoes: "Cum se desfășoară",
    outbound: "La plecare",
    outboundText: (min: number | null) =>
      `Prezentați-vă la recepția parcării cu numărul de înmatriculare. Lăsați mașina, iar naveta vă duce la terminal${min ? ` în ${min} minute` : ""}.`,
    inbound: "La întoarcere",
    inboundText:
      "Indicați numărul zborului: parcarea urmărește aterizarea. Primiți un SMS cu punctul de întâlnire al navetei.",
    access: "Acces",
    openInMaps: "Deschideți în Google Maps",
    addressUnknown: "Adresa este comunicată la rezervare.",
    forStay: (days: number) => `pentru ${roDays(days)}, totul inclus`,
    from: "de la",
    dropOff: "Predare",
    pickUp: "Retur",
    availableForDates: "Loc disponibil pentru datele dumneavoastră",
    fullForDates: "Complet la aceste date",
    noPriceForDates: "Niciun tarif pentru această durată",
    packageLine: (days: number) => `Pachet ${roDays(days)}`,
    nightFee: "Taxă de noapte",
    nightFeeDropOff: "predare la",
    nightFeeReturn: "retur la",
    nightFeeAnd: "și",
    nightRule: (fees: string, start: string, end: string) =>
      `Această parcare adaugă ${fees} între ${start} și ${end}.`,
    nightRuleSame: (amount: string) => `${amount} pentru o predare sau un retur`,
    nightRuleEach: (dropOff: string, pickUp: string) =>
      `${dropOff} pentru o predare și ${pickUp} pentru un retur`,
    nightRuleDropOff: (amount: string) => `${amount} pentru o predare`,
    nightRuleReturn: (amount: string) => `${amount} pentru un retur`,
    serviceFee: "Taxă de serviciu",
    total: "Total",
    payOnSite: "Total de plătit online",
    book: "Rezervați",
    onlineSoon: "Rezervarea online va fi disponibilă în curând",
    onlineSoonHint:
      "Această parcare nu acceptă încă rezervări pe site.",
    checkDates: "Vedeți prețul",
    askDates: "Indicați datele pentru a vedea prețul total și disponibilitatea.",
    otherParkings: "Vedeți celelalte parcări",
  },
  booking: {
    back: "Înapoi la parcare",
    title: "Finalizați rezervarea",
    yourDetails: "Datele dumneavoastră",
    firstName: "Prenume",
    lastName: "Nume",
    phone: "Telefon mobil (pentru SMS-ul navetei)",
    email: "E-mail (confirmare)",
    plate: "Număr de înmatriculare",
    plateHint: "Număr francez sau străin.",
    flight: "Zbor de întoarcere (recomandat)",
    flightHint: "Ex. TO 3627: naveta urmărește aterizarea dumneavoastră.",
    outboundFlight: "Zbor de plecare (opțional)",
    outboundFlightHint:
      "Ex. AF 7641: naveta spre terminal este programată înainte de decolare.",
    passengers: "Pasageri",
    vehicleTitle: "Pentru a vă recunoaște (opțional)",
    vehicleModel: "Modelul vehiculului",
    vehicleModelHint: "Ex. Peugeot 308",
    vehicleColour: "Culoare",
    vehicleColourHint: "Ex. gri",
    message: "Un mesaj pentru parcare",
    messageHint:
      "Cărucior, sosire târzie… Parcarea îl citește înainte de venirea dumneavoastră.",
    childSeats: {
      title: "Copii la bord?",
      subtitle: "Parcarea pregătește scaunele în navetă",
      switchLabel: "Solicitați scaune auto",
      hint: "Copiii se socotesc printre pasageri. Scaune împrumutate atât la dus, cât și la întors, gratuit.",
      kinds: {
        infant: {
          label: "Bebeluș · până la 12 luni",
          hint: "Scaun cu spatele la direcția de mers",
          fewer: "Un bebeluș mai puțin",
          more: "Încă un bebeluș",
          count: (n: number) => rp(n, "bebeluș", "bebeluși"),
        },
        toddler: {
          label: "1–4 ani",
          hint: "Scaun pentru copii",
          fewer: "Un copil de 1–4 ani mai puțin",
          more: "Încă un copil de 1–4 ani",
          count: (n: number) => `${rp(n, "copil", "copii")} de 1–4 ani`,
        },
        booster: {
          label: "4–10 ani",
          hint: "Înălțător",
          fewer: "Un copil de 4–10 ani mai puțin",
          more: "Încă un copil de 4–10 ani",
          count: (n: number) => `${rp(n, "copil", "copii")} de 4–10 ani`,
        },
      },
    },
    termsBefore: "Accept ",
    termsLink: `condițiile ${P}`,
    termsAfter:
      " și pe cele ale parcării. Datele mele servesc doar acestui sejur.",
    submit: "Continuați spre plată",
    submitting: "O clipă…",
    steps: "Etapele rezervării",
    stepDetails: "1 · Datele dumneavoastră",
    stepPayment: "2 · Plată",
    currentStep: "(etapa curentă)",
    paymentNext: (total: string) =>
      `Plată securizată cu cardul la etapa următoare: ${total}.`,
    noAccount:
      "Nu trebuie să creați un cont: primiți confirmarea prin e-mail și prin SMS.",
    summaryDropOff: "Predare",
    summaryPickUp: "Retur",
    modify: "Modificați",
    totalOnSite: "Total",
    fixErrors: "Unele câmpuri trebuie corectate.",
    unavailableTitle: "Această parcare nu mai este disponibilă pentru datele dumneavoastră",
    fullNights: (nights: string) =>
      `Nopți complete: ${nights}${nights.endsWith(".") ? "" : "."}`,
    seeOtherParkings: "Vedeți celelalte parcări",
    changeDates: "Schimbați datele",
  },
  pay: {
    title: "Plată",
    recap: "Rezumat",
    modify: "Modificați",
    total: "Total",
    days: (n: number) => roDays(n),
    holdLeft: (time: string) => `Locul vă este rezervat încă ${time}`,
    button: (total: string) => `Plătiți ${total}`,
    redirecting: "Redirecționare…",
    redirectNote:
      "Veți fi redirecționat către pagina de plată securizată Stripe.",
    passengers: (n: number) => rp(n, "pasager", "pasageri"),
    expiredTitle: "Termenul a expirat",
    expiredText:
      "Locul nu vă mai este rezervat și nu s-a debitat nimic. Puteți relua: datele dumneavoastră sunt păstrate.",
    restart: "Reluați rezervarea",
    verifyingTitle: "Plata este în curs de verificare…",
    verifyingText:
      "Durează câteva secunde. Această pagină se actualizează singură.",
    refresh: "Actualizați",
  },
  manage: {
    title: "Rezervarea mea",
    lookupLead:
      `Fără cont: linkul din SMS sau din e-mail este suficient. Altfel, introduceți numărul primit de la ${P} sau de la site-ul pe care ați rezervat.`,
    reference: "Numărul rezervării",
    referenceHint: `${P}, Allopark, Onepark, ParkVia…`,
    contact: "E-mail sau telefon",
    email: "E-mail",
    find: "Găsiți rezervarea mea",
    finding: "Se caută…",
    confirmedTitle: (name: string) =>
      name ? `Rezervarea este făcută, ${name}!` : "Rezervarea este făcută!",
    confirmedText: (email: string | null, phone: string | null) =>
      email && phone
        ? `Confirmarea vă este trimisă la ${email} și prin SMS la ${phone}.`
        : email
          ? `Confirmarea vă este trimisă la ${email}.`
          : phone
            ? `Confirmarea vă este trimisă prin SMS la ${phone}.`
            : "Păstrați cu grijă referința.",
    dropOff: "Predare",
    pickUp: "Retur",
    flight: "Zbor de întoarcere",
    outbound: "Zbor de plecare",
    outboundShuttle: (time: string) =>
      `naveta spre terminal este programată în jurul orei ${time}`,
    outboundStatus: {
      scheduled: "la timp",
      delayed: "întârziat",
      departed: "plecat",
      landed: "plecat",
      cancelled: "anulat",
      diverted: "deviat",
      unknown: "zbor negăsit",
    } as Record<string, string>,
    noFlight: "Necompletat",
    vehicle: "Vehicul",
    vehicleDetails: (model: string | null, colour: string | null) =>
      [model, colour].filter(Boolean).join(" · "),
    message: "Mesajul dumneavoastră pentru parcare",
    passengers: "Pasageri",
    toPayOnSite: "Plătit",
    nothingToPay: "Nimic de plătit",
    paid: "Plătit",
    refunded: "Rambursat",
    stayPrice: "Prețul sejurului",
    nightFeeIncluded: (amount: string) => `din care ${amount} taxă de noapte`,
    freeUntil: (when: string) => `Anulare gratuită până la ${when}`,
    nonRefundable: "Nu poate fi anulată online",
    dayTitle: "În ziua plecării",
    conditionsTitle: "De știut",
    step1Title: "Veniți la parcare",
    step1Text: (address: string | null, min: number | null) =>
      `${address ? `${address}. ` : ""}Prevedeți ${min ? `${min} min de navetă` : "drumul cu naveta"} înainte de ora recomandată de compania aeriană.`,
    step2Title: "Comunicați referința sau numărul de înmatriculare",
    step2Text: (_total?: string | null) =>
      "Recepția vă așteaptă: totul este deja achitat, lăsați mașina, iar naveta vă duce la terminal.",
    step3Title: "La întoarcere, vă urmărim zborul",
    step3Text: (flight: string | null) =>
      flight
        ? `Imediat ce aterizează zborul ${flight}, primiți un SMS cu punctul de întâlnire al navetei.`
        : "Indicați mai jos zborul de întoarcere: la aterizare, primiți un SMS cu punctul de întâlnire al navetei.",
    itinerary: "Itinerar spre parcare",
    addToCalendar: "Adăugați în calendar",
    manageLink: "Gestionați rezervarea mea",
    flightTitle: "Zborurile dumneavoastră",
    flightLabel: "Zbor de întoarcere",
    outboundLabel: "Zbor de plecare",
    flightSave: "Salvați",
    flightEdit: "Modificați",
    flightSaving: "Se salvează…",
    flightHelp:
      "Modificați-l dacă zborul se schimbă: naveta îl urmărește pe cel nou. Lăsați câmpul gol pentru a-l șterge.",
    flightSaved: "Zboruri salvate.",
    flightLocked: "Zborul de întoarcere nu mai poate fi modificat online.",
    childSeats: {
      title: "Scaune auto",
      none: "Niciun scaun solicitat",
      inShuttle:
        "Instalate în navetă, atât la dus, cât și la întors. Gratuit.",
      edit: "Modificați",
      save: "Salvați",
      saving: "Se salvează…",
      cancel: "Anulați",
      saved: "Scaune auto salvate.",
      locked:
        "Scaunele auto nu mai pot fi modificate online: anunțați parcarea.",
    },
    invoices: {
      title: "Factură",
      invoice: (n: string) => `Factura ${n}`,
      creditNote: (n: string) => `Factura de stornare ${n}`,
      issued: (amount: string, date: string, issuer: string) => `${amount} · emisă la ${date} de ${issuer}`,
      creditedBy: (n: string) => `Anulată prin factura de stornare ${n}`,
      creditOf: (n: string) => `Anulează factura ${n}`,
      download: "Descărcați PDF-ul",
      downloading: "Se descarcă…",
      none: "Încă nu există factură pentru acest sejur.",
      company: "Firmă (opțional)",
      address: "Adresa de facturare (opțional)",
      request: "Solicitați factura",
      requesting: "Se trimite…",
      requested: (date: string) => `Solicitată la ${date}. Parcarea v-o trimite aici și prin e-mail.`,
      requestedPill: "Solicitată",
      noPrice: "Parcarea nu are încă prețul acestui sejur: solicitați-i factura direct.",
      errors: {
        too_long: "Acest text este prea lung.",
        already_requested: "Factura a fost deja solicitată.",
        invoice_exists: "Factura este deja disponibilă: reîncărcați pagina.",
        network: "Fără conexiune. Încercați din nou.",
        unknown: "Cererea nu a putut fi trimisă. Încercați din nou.",
      } as Record<string, string>,
    },
    cancelTitle: "Anulare",
    cancelText: (until: string) =>
      `Gratuit până la ${until}: rambursare integrală pe card în 5–10 zile.`,
    cancelButton: "Anulați rezervarea mea",
    cancelConfirm: "Confirmați anularea",
    cancelConfirmText:
      "Locul va fi eliberat, iar plata rambursată integral. Această acțiune este definitivă.",
    cancelKeep: "Păstrați rezervarea mea",
    cancelling: "Se anulează…",
    cancelled: "Această rezervare este anulată.",
    cancelledRefunded:
      "Această rezervare este anulată. Rambursare integrală pe card în 5–10 zile.",
    cancelledNow:
      "Rezervarea dumneavoastră este anulată. Rambursare integrală pe card în 5–10 zile. Vi se trimite un e-mail de confirmare.",
    cancelClosed: (until: string) =>
      `Termenul de anulare online a trecut (${until}).`,
    cancelNonRefundable: "Această rezervare nu poate fi anulată online.",
    contactParkingPhone: "Contactați parcarea la",
    contactParkingDesk: "Adresați-vă recepției parcării.",
    dayQuestion: (parking: string) => `O întrebare în ziua respectivă? ${parking}:`,
    changeDates: (until: string) =>
      `Pentru a schimba datele, anulați și rezervați din nou (gratuit înainte de ${until}).`,
    notFoundTitle: "Rezervare negăsită",
    notFoundText:
      "Acest link nu este valid sau a expirat. Introduceți referința și adresa de e-mail pentru a vă găsi rezervarea.",
    or: "apoi",
  },
  appLink: {
    title: (reference: string) =>
      `Rezervarea dumneavoastră ${reference} vă așteaptă în aplicație`,
    lead: (parking: string) =>
      `${parking}. Instalați aplicația: se va deschide pe rezervarea dumneavoastră. Navetă în direct, găsirea mașinii, fotografiile constatării stării.`,
    install: "Instalați aplicația",
    alreadyInstalled: "Am deja aplicația",
    continueWeb: "Continuați pe site",
    iosSoon:
      "În curând în App Store: până atunci, rezervarea dumneavoastră este pe site.",
    playBadge: "Disponibil pe Google Play",
    appStoreBadge: "Descărcați din App Store",
    invalidTitle: "Link necunoscut sau expirat",
    invalidText:
      "Acest link nu mai duce la o rezervare. Găsiți-o pe a dumneavoastră cu referința și adresa de e-mail.",
  },
  live: {
    live: "În direct",
    ago: (seconds: number) =>
      seconds < 60
        ? `acum ${seconds} s`
        : `acum ${Math.floor(seconds / 60)} min`,
    title: (flight: string | null) =>
      flight ? `Zborul ${flight}` : "Întoarcerea dumneavoastră",
    landsIn: "aterizează în",
    anyMinute: "iminent",
    planned: (time: string) => `programat ${time}`,
    plannedLate: (time: string, late: number) =>
      `programat ${time} · întârziere +${late} min`,
    landed: "a aterizat la",
    goMeeting: "mergeți la punctul de întâlnire",
    waitingShuttle: "șoferul vine să vă ia",
    cancelled: "zbor anulat",
    cancelledHelp: "Sunați parcarea pentru a stabili o nouă întâlnire.",
    shuttleIn: "naveta în",
    shuttleWaiting: "în așteptarea poziției",
    shuttleAway: (distance: string) => `la ${distance} de dumneavoastră`,
    stepLanding: "Aterizare",
    stepMeeting: "Întâlnire",
    stepShuttle: "Navetă",
    meetingPoint: (label: string) => `Punct de întâlnire: ${label}`,
    meetingDefault: "punctul de întâlnire al navetei",
    shuttleLine: (driver: string, vehicle: string | null) =>
      [driver ? `Șofer: ${driver}` : null, vehicle]
        .filter(Boolean)
        .join(" · "),
    position: "Poziție",
    carTitle: "Găsiți mașina mea",
    carSpot: (code: string) => `Locul ${code}`,
    carFile: (code: string) => `Șirul ${code}`,
    carFilePosition: (position: number) =>
      `${position === 1 ? "prima" : `a ${position}-a`} de la alee`,
    carZone: {
      short: "zona sejururilor scurte",
      medium: "zona sejururilor medii",
      long: "zona sejururilor lungi",
    } as Record<string, string>,
    carKeys: "Cheile vă așteaptă la recepția parcării.",
    carRoute: "Itinerar pe jos până la parcare",
    carRouteToCar: "Itinerar pe jos până la mașina mea",
    carPosition: (
      by: "traveller" | "staff",
      time: string,
      accuracy: number | null,
    ) =>
      `Poziție GPS ${by === "staff" ? "înregistrată de parcare" : "înregistrată de dumneavoastră"} la ${time}${accuracy !== null ? ` (± ${accuracy} m)` : ""}.`,
    carNoSpot: "Mașina dumneavoastră",
    offline: "Momentan nu putem citi starea returului.",
    landedButton: "Am aterizat",
    landedHelp:
      "Fără urmărirea zborului, spuneți-ne când ați aterizat: parcarea pregătește naveta.",
    instructions: "Instrucțiunile parcării",
    photoAlt: "Fotografia punctului de întâlnire",
    routeToMeeting: "Itinerar spre punctul de întâlnire",
    noticeTitle: "O problemă? Anunțați parcarea",
    noticeHelp: "Șoferul și recepția îl văd imediat în lista lor.",
    noticeFlightDelayed: "Zborul meu are întârziere",
    noticeLuggage: "Bagaj pierdut sau întârziat",
    noticeOther: "Altceva…",
    noticeOtherPlaceholder: "Spuneți-ne pe scurt (200 de caractere)",
    noticeSend: "Trimiteți",
    noticeSending: "Se trimite…",
    noticeKinds: {
      flight_delayed: "Zborul meu are întârziere",
      luggage: "Bagaj pierdut sau întârziat",
      other: "Mesajul dumneavoastră",
    } as Record<string, string>,
    noticed: (label: string, time: string) =>
      `Transmis parcării la ${time}: ${label}.`,
    noticeAgain: "Semnalați altceva",
  },
  arrival: {
    title: "Anunțați sosirea mea",
    notYetOutbound: (when: string) =>
      `În ziua predării, începând cu ${when}, veți putea anunța parcarea despre sosirea dumneavoastră.`,
    notYetReturn: (when: string) =>
      `La întoarcere, începând cu ${when}, veți putea spune șoferului că sunteți la punctul de întâlnire.`,
    explainTitle: "Anunțați parcarea despre sosirea dumneavoastră",
    explainBefore:
      "Valetul vă așteaptă la recepție. Poziția dumneavoastră este partajată cu parcarea ",
    explainOnly: "numai",
    explainAfter: " până la sosire (maximum 2 h), apoi este ștearsă.",
    share: "Sunt pe drum — partajez poziția mea",
    sharing: "Partajare în curs…",
    announceToggle: "Anunțați fără a partaja poziția",
    announceIn: (minutes: number) => `Ajung în ${minutes} min`,
    returnAnnounceIn: (minutes: number) => `Ajung acolo în ${minutes} min`,
    stopAnytime: "Puteți opri partajarea oricând.",
    live: "Poziție partajată cu parcarea",
    etaLabel: "Sosire estimată",
    etaMinutes: (minutes: number) => `${minutes} min`,
    etaUnknown: "—",
    arrivalAround: (time: string) => `sosire în jurul orei ${time}`,
    waitingPosition: "Se caută poziția dumneavoastră…",
    notified: "Parcarea a fost anunțată · valetul vă așteaptă la recepție",
    notifiedReturn: "Șoferul a fost anunțat",
    autoStop: (left: string) =>
      `Oprire automată la sosire sau peste ${left}`,
    stop: "Opriți partajarea",
    arrivedTitle: "Ați ajuns",
    arrivedText:
      "Partajarea s-a oprit, iar poziția dumneavoastră a fost ștearsă. Valetul vă așteaptă la recepție.",
    announcedText: (minutes: number, time: string) =>
      `Parcarea este anunțată: ajungeți în ${minutes} min${time ? ` (în jurul orei ${time})` : ""}.`,
    announcedReturnText: (minutes: number, time: string) =>
      `Șoferul este anunțat: veți fi la punctul de întâlnire în ${minutes} min${time ? ` (în jurul orei ${time})` : ""}.`,
    cancelAnnounce: "Anulați",
    endedExpired:
      "Partajarea s-a oprit după 2 h, iar poziția dumneavoastră a fost ștearsă.",
    endedStopped: "Partajare oprită. Poziția dumneavoastră a fost ștearsă.",
    meetingReception: "Recepție",
    meetingReturn: "Punct de întâlnire",
    returnExplainTitle: "Anunțați șoferul",
    returnExplain: (meeting: string) =>
      `După ce v-ați recuperat bagajele, mergeți la punctul de întâlnire: ${meeting}. Șoferul navetei vede mesajul dumneavoastră în lista sa.`,
    atPoint: "Sunt la punctul de întâlnire",
    withPosition: "Atașați poziția mea (o singură dată, pentru a localiza punctul)",
    atPointDoneTitle: "Șoferul știe că sunteți acolo",
    atPointDoneText: (meeting: string) =>
      `Rămâneți la punctul de întâlnire: ${meeting}. Naveta sosește.`,
    noteLabel: "Un mesaj pentru parcare (opțional)",
    notePlaceholder: "Ex. 2 copii, cărucior",
    noteSent: (note: string) => `Mesajul dumneavoastră: „${note}”`,
    locationDenied:
      "Fără acces la poziția dumneavoastră, puteți anunța parcarea fără a o partaja.",
    locationUnavailable:
      "Browserul nu oferă acces la poziția dumneavoastră: anunțați fără a o partaja.",
    errors: {
      arrival_window_closed:
        "Încă nu este momentul sau acesta a trecut: pagina se va actualiza.",
      not_sharing: "Partajarea nu mai este activă.",
      consent_required:
        "Este necesar acordul dumneavoastră pentru a partaja poziția.",
    } as Record<string, string>,
  },
  stayShuttles: {
    title: "Navetă",
    titleLive: (n: number) => `Navetă · ${n} pe drum`,
    mine: "Naveta dumneavoastră",
    vehicle: (colour: string | null) =>
      colour ? `Navetă ${colour}` : "Navetă",
    driver: (name: string) => `șofer: ${name}`,
    noPosition: "poziție în așteptare",
    etaParking: (minutes: number) => `la ${minutes} min de parcare`,
    etaMeeting: (minutes: number) => `la ${minutes} min de punctul de întâlnire`,
    direction: {
      pickup: "merge să preia călători de la aeroport",
      dropoff: "duce călători la terminal",
    } as Record<string, string>,
    none: {
      arrival:
        "Nicio navetă pe drum în acest moment: la sosire, echipa vă duce la terminal.",
      stay: "Nicio navetă pe drum în acest moment.",
      return:
        "Nicio navetă pe drum în acest moment: la aterizare, anunțați parcarea de pe această pagină.",
    } as Record<string, string>,
  },
  status: {
    pending_payment: "În așteptarea plății",
    upcoming: "Confirmată",
    arrived: "În desfășurare",
    shuttled_out: "În desfășurare",
    return_requested: "În desfășurare",
    back_at_parking: "În desfășurare",
    returned: "Încheiată",
    cancelled: "Anulată",
    no_show: "Neprezentare",
  },
  services: {
    shuttle: "Navetă gratuită",
    valet: "Valet",
    covered: "Acoperit",
    ev_charging: "Încărcare electrică",
    open_24h: "Deschis non-stop",
    fenced: "Împrejmuit",
    cctv: "Supraveghere video",
  },
  servicesShort: {
    shuttle: "Navetă",
    valet: "Valet",
    covered: "Acoperit",
    ev_charging: "Încărcare electrică",
    open_24h: "Non-stop",
    fenced: "Împrejmuit",
    cctv: "Supraveghere video",
  },
  cancellation: {
    free_until_arrival: "Anulare gratuită până la sosire",
    free_24h: "Anulare gratuită până cu 24 h înainte",
    free_48h: "Anulare gratuită până cu 48 h înainte",
    non_refundable: "Nu poate fi anulată",
  },
  cancellationShort: {
    free_until_arrival: "Gratuită până la sosire",
    free_24h: "Gratuită cu 24 h înainte",
    free_48h: "Gratuită cu 48 h înainte",
    non_refundable: "Nu poate fi anulată",
  },
  calendar: {
    dropOff: (parking: string) => `Predarea mașinii · ${parking}`,
    pickUp: (parking: string) => `Retur · naveta ${parking}`,
    description: (reference: string, total: string | null, manageUrl: string) =>
      `Rezervarea ${reference}. ${total ? `${total} plătiți online. ` : "Plătită online. "}Gestionați rezervarea: ${manageUrl}`,
  },
  legal: {
    version: (date: string) => `Versiunea din ${date}`,
    contents: "Cuprins",
    terms: "Condiții generale",
    privacy: "Politica de confidențialitate",
    legalNotice: "Mențiuni legale",
  },
  notFound: {
    title: "Pagină negăsită",
    text: "Această pagină nu există sau nu mai este online.",
    home: "Înapoi la pagina principală",
  },
  error: {
    title: "Serviciul nu răspunde",
    text: "Nu am putut încărca această pagină. Încercați din nou peste o clipă.",
    retry: "Încercați din nou",
    home: "Înapoi la pagina principală",
  },
  errors: {
    required: "Câmp obligatoriu.",
    too_long: "Text prea lung.",
    invalid_email: "Adresă de e-mail invalidă.",
    integer: "Este necesar un număr întreg.",
    invalid_datetime: "Dată sau oră invalidă.",
    return_before_arrival: "Returul trebuie să fie după predare.",
    arrival_in_past: "Data predării a trecut.",
    stay_too_long: "Sejur de peste 90 de zile.",
    passengers_range: "Între 1 și 9 pasageri.",
    invalid_phone: "Număr de telefon invalid.",
    invalid_plate: "Număr de înmatriculare invalid.",
    invalid_flight: "Număr de zbor invalid (ex. TO 3627).",
    terms_required: "Vă rugăm să acceptați condițiile pentru a rezerva.",
    invalid_name: "Doar litere, spații, apostrofuri și cratime.",
    duplicate_booking:
      "Acest vehicul are deja o rezervare la aceste date. O găsiți în „Rezervarea mea”.",
    too_many_bookings:
      "Aveți deja mai multe rezervări în curs cu aceste date de contact. Gestionați-le în „Rezervarea mea”.",
    invalid_idempotency_key:
      "Formularul a expirat. Reîncărcați pagina și încercați din nou.",
    invalid_slug: "Adresă invalidă.",
    unknown_airport: "Aeroport necunoscut.",
    validation_failed: "Unele câmpuri trebuie corectate.",
    overbooked:
      "Această parcare este completă pentru cel puțin o noapte din sejurul dumneavoastră.",
    no_price: "Această parcare nu are tarif pentru durata sejurului dumneavoastră.",
    not_found: "Negăsit.",
    lookup_not_found:
      "Nicio rezervare nu corespunde acestui număr cu acest e-mail sau telefon.",
    flight_locked: "Zborul de întoarcere nu mai poate fi modificat online.",
    child_seats_exceed_passengers:
      "Copiii se socotesc printre pasageri: adăugați-i la numărul de pasageri.",
    child_seats_range: "Între 0 și 4 scaune din fiecare tip.",
    child_seats_locked:
      "Scaunele auto nu mai pot fi modificate online: anunțați parcarea.",
    cancellation_closed:
      "Această rezervare nu mai poate fi anulată online.",
    online_booking_unavailable:
      "Această parcare nu acceptă încă rezervări online.",
    hold_expired:
      "Termenul de plată a expirat: locul nu vă mai este rezervat.",
    already_paid:
      "Plata a fost deja efectuată: rezervarea dumneavoastră este confirmată.",
    refund_failed:
      "Rambursarea nu a putut fi inițiată. Încercați din nou peste o clipă; rezervarea dumneavoastră nu a fost anulată.",
    payments_unavailable:
      "Plata online este momentan indisponibilă. Încercați din nou peste o clipă.",
    too_many_requests: "Prea multe încercări. Încercați din nou peste câteva minute.",
    rate_limited: "Prea multe încercări. Încercați din nou peste câteva minute.",
    invalid: "Valoare invalidă.",
    too_short: "Text prea scurt.",
    message_too_short: "Cel puțin 10 caractere.",
    message_too_long: "Cel mult 2.000 de caractere.",
    consent_required: "Este necesar acordul dumneavoastră pentru a primi buletinul.",
    contact_unavailable:
      "Formularul de contact nu este încă deschis. Găsiți rezervarea în „Rezervarea mea”.",
    contact_failed:
      "Mesajul nu a putut fi trimis. Încercați din nou peste o clipă.",
    newsletter_unavailable:
      "Abonarea la buletin nu este încă deschisă. Reveniți curând.",
    newsletter_failed:
      "Abonarea nu a putut fi finalizată. Încercați din nou peste o clipă.",
    too_many_attempts: "Prea multe încercări. Încercați din nou peste 15 minute.",
    network: "Serviciul nu răspunde. Verificați conexiunea și încercați din nou.",
    server_error:
      "A apărut o eroare din partea noastră. Încercați din nou peste o clipă.",
    unknown: "A apărut o eroare. Încercați din nou.",
  } as Record<string, string>,
};
