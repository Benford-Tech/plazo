/**
 * 15/11/2026 (« Les mails sont à envoyer dans la langue du pays »): the prospecting mails in each European country's own
 * language, not English. The same three mails as the French ones (same delays and switches, only the subject and the text
 * are translated), and the words around them (why the reader gets it, the stores, unsubscribe). German and English stay in
 * prospecting.ts, where they were written first.
 */

/** The words around the text, in the prospect's language. */
export interface Chrome {
  why: (parking: string, product: string) => string;
  who: (product: string, publisher: string) => string;
  stop: (product: string) => string;
  demo: (product: string) => string;
  teamApp: (product: string) => string;
  travellerApp: (product: string) => string;
  proPlay: (product: string) => string;
  proApple: (product: string) => string;
  appPlay: (product: string) => string;
  appApple: (product: string) => string;
  appleSoon: string;
  screens: [string, string, string];
  bannerAlt: string;
  unsubscribeSubject: string;
}

/** One language's three mails, in pieces: the first mail's two lists are written once and put together by `stepsOf`. */
interface Mails {
  /** The greeting line, with {prénom} (an empty first name leaves « Hola, »). */
  hello: string;
  s1Subject: string;
  intro: (P: string) => string;
  teamTitle: string;
  /** Five lines; each ends with its separator, the last with a full stop. */
  team: string[];
  customersTitle: string;
  customers: (P: string) => string[];
  tryDemo: string;
  apps: (P: string) => string;
  regards: string;
  s2Subject: string;
  s2Intro: (P: string) => string;
  s2Lines: (P: string) => string[];
  s2Outro: string;
  s3Subject: string;
  s3Text: string;
  s3Demo: string;
  s3Bye: string;
}

export interface LanguagePack {
  /** The language's name, in French, for the platform admin (« Espagnol »). */
  name: string;
  mails: Mails;
  chrome: Chrome;
}

const list = (lines: string[]) => lines.map(l => `- ${l}`).join('\n');

/** The three mails of a pack, as subjects and texts (the delays and switches are the French sequence's). */
export function packTexts(pack: LanguagePack, P: string): { subject: string; body: string }[] {
  const m = pack.mails;
  return [
    {
      subject: m.s1Subject,
      body: [
        m.hello,
        m.intro(P),
        `${m.teamTitle}\n${list(m.team)}`,
        `${m.customersTitle}\n${list(m.customers(P))}`,
        m.tryDemo,
        m.apps(P),
        m.regards,
      ].join('\n\n'),
    },
    { subject: m.s2Subject, body: [m.hello, `${m.s2Intro(P)}\n${list(m.s2Lines(P))}`, m.s2Outro, m.regards].join('\n\n') },
    { subject: m.s3Subject, body: [m.hello, m.s3Text, m.s3Demo, m.s3Bye].join('\n\n') },
  ];
}

/** The badges and store lines say the same thing in every language; only the words change. */
function stores(words: { teamApp: string; travellerApp: string; customersApp: string; on: string; inStore: string }) {
  return {
    teamApp: (p: string) => `${words.teamApp}, ${p} Pro:`,
    travellerApp: (p: string) => `${words.travellerApp}, ${p}, ${words.inStore}:`,
    proPlay: (p: string) => `${p} Pro ${words.on} Google Play (Android)`,
    proApple: (p: string) => `${p} Pro ${words.on} App Store (iPhone)`,
    appPlay: (p: string) => `${p}, ${words.customersApp}, ${words.on} Google Play (Android)`,
    appApple: (p: string) => `${p}, ${words.customersApp}, ${words.on} App Store (iPhone)`,
  };
}

const COMPARATORS = '(ParkVia, Parclick, ParkMundo…)';

export const LANGUAGE_PACKS = {
  es: {
    name: 'Espagnol',
    mails: {
      hello: 'Hola {prénom},',
      s1Subject: '{parking}: sus reservas, sin volver a teclearlas',
      intro: P =>
        `${P} Pro es el software para aparcamientos de aeropuerto con lanzadera o servicio de aparcacoches. Una decena de aparcamientos en Francia ya lo usan a diario.`,
      teamTitle: 'Para su equipo:',
      team: [
        `las reservas de los comparadores ${COMPARATORS} llegan solas a una única planificación diaria;`,
        'la lanzadera: a quién llevar, a quién recoger, vuelos de regreso seguidos;',
        'el plano del aparcamiento, la plaza de cada coche y sus llaves;',
        'el contrato firmado y el informe de estado con fotos, en el móvil;',
        'el recordatorio la víspera y la facturación neta de comisiones.',
      ],
      customersTitle: 'Para sus clientes:',
      customers: P => [
        `siguen la lanzadera en directo en la aplicación ${P}, en el App Store y Google Play;`,
        'al aterrizar reciben el punto de encuentro: ya no necesitan llamar;',
        'encuentran su reserva y su coche con un toque.',
      ],
      tryDemo: 'Pruebe la demo en dos minutos: {lien_demo}',
      apps: P => `${P} Pro funciona en iPhone y Android (enlaces abajo). ¿Alguna pregunta? Basta con responder a este correo.`,
      regards: 'Un cordial saludo,',
      s2Subject: '¿Le llaman sus clientes al aterrizar?',
      s2Intro: P => `Con ${P} Pro, el teléfono deja de sonar cuando sus clientes vuelven de vacaciones:`,
      s2Lines: P => [
        'se sigue el vuelo de regreso y un retraso mueve solo la hora de recogida;',
        'su conductor ve su lista actualizada en el móvil;',
        `su cliente recibe el punto de encuentro y ve llegar la lanzadera en ${P}.`,
      ],
      s2Outro: 'Una decena de aparcamientos ya trabajan así. Véalo en la demo: {lien_demo}',
      s3Subject: 'No le molesto más',
      s3Text:
        'Este es mi último mensaje. Si algún día teclear reservas o las llamadas al aterrizar se le hacen pesadas, responda a este correo: lo preparamos todo para {parking}, plano y tarifas incluidos.',
      s3Demo: 'La demo sigue abierta: {lien_demo}',
      s3Bye: 'Le deseo lo mejor,',
    },
    chrome: {
      why: (parking, product) =>
        `Recibe este mensaje en la dirección profesional de ${parking} porque ${product} está pensado para aparcamientos cercanos a aeropuertos.`,
      who: (product, publisher) => `${product} lo edita ${publisher}.`,
      stop: product => `Dejar de recibir mensajes de ${product}`,
      demo: product => `Ver la demo de ${product}`,
      ...stores({
        teamApp: 'La aplicación de su equipo',
        travellerApp: 'La aplicación de sus clientes',
        customersApp: 'la aplicación de sus clientes',
        on: 'en',
        inStore: 'ya en el App Store y Google Play',
      }),
      appleSoon: 'Apple está revisando la aplicación: le enviaremos el enlace en cuanto se publique.',
      screens: ['La planificación del día', 'La lanzadera en directo', 'Cada coche en su plaza'],
      bannerAlt:
        'Plazo Pro, el software para aparcamientos de aeropuerto: lanzaderas en directo, reservas de los comparadores, cada coche en su plaza',
      unsubscribeSubject: 'Dejar de recibir mensajes',
    },
  },
  it: {
    name: 'Italien',
    mails: {
      hello: 'Buongiorno {prénom},',
      s1Subject: '{parking}: le vostre prenotazioni, senza ricopiarle',
      intro: P =>
        `${P} Pro è il software per i parcheggi aeroportuali con navetta o servizio valet. Una decina di parcheggi in Francia lo usano già ogni giorno.`,
      teamTitle: 'Per il vostro team:',
      team: [
        `le prenotazioni dei comparatori ${COMPARATORS} arrivano da sole in un unico planning giornaliero;`,
        'la navetta: chi accompagnare, chi andare a prendere, voli di ritorno monitorati;',
        'la planimetria del parcheggio, il posto di ogni auto e le sue chiavi;',
        'il contratto firmato e il verbale di consegna con foto, sullo smartphone;',
        'il promemoria del giorno prima e il fatturato al netto delle commissioni.',
      ],
      customersTitle: 'Per i vostri clienti:',
      customers: P => [
        `seguono la navetta in diretta nell'app ${P}, su App Store e Google Play;`,
        "all'atterraggio ricevono il punto d'incontro: niente più telefonate;",
        "ritrovano la prenotazione e l'auto con un tocco.",
      ],
      tryDemo: 'Provate la demo in due minuti: {lien_demo}',
      apps: P => `${P} Pro funziona su iPhone e Android (link qui sotto). Una domanda? Basta rispondere a questa email.`,
      regards: 'Cordiali saluti,',
      s2Subject: "I vostri clienti vi chiamano all'atterraggio?",
      s2Intro: P => `Con ${P} Pro il telefono non squilla più quando i clienti tornano dalle vacanze:`,
      s2Lines: P => [
        "il volo di ritorno è monitorato e un ritardo sposta da solo l'orario di ritiro;",
        'il vostro autista vede la lista aggiornata sullo smartphone;',
        `il cliente riceve il punto d'incontro e vede arrivare la navetta in ${P}.`,
      ],
      s2Outro: 'Una decina di parcheggi lavorano già così. Guardatelo nella demo: {lien_demo}',
      s3Subject: 'Non vi disturbo più',
      s3Text:
        "È il mio ultimo messaggio. Se un giorno ricopiare le prenotazioni o le telefonate all'atterraggio diventassero troppo, rispondete a questa email: prepariamo tutto per {parking}, planimetria e tariffe comprese.",
      s3Demo: 'La demo resta aperta: {lien_demo}',
      s3Bye: 'Buon lavoro,',
    },
    chrome: {
      why: (parking, product) =>
        `Ricevete questo messaggio all'indirizzo professionale di ${parking} perché ${product} è pensato per i parcheggi vicino agli aeroporti.`,
      who: (product, publisher) => `${product} è pubblicato da ${publisher}.`,
      stop: product => `Non ricevere più messaggi da ${product}`,
      demo: product => `Guarda la demo di ${product}`,
      ...stores({
        teamApp: "L'app del vostro team",
        travellerApp: "L'app dei vostri clienti",
        customersApp: "l'app dei vostri clienti",
        on: 'su',
        inStore: 'già su App Store e Google Play',
      }),
      appleSoon: "Apple sta verificando l'app: vi invieremo il link appena sarà pubblicata.",
      screens: ['Il planning del giorno', 'La navetta in diretta', 'Ogni auto al suo posto'],
      bannerAlt: 'Plazo Pro, il software per i parcheggi aeroportuali: navette in diretta, prenotazioni dei comparatori, ogni auto al suo posto',
      unsubscribeSubject: 'Non ricevere più messaggi',
    },
  },
  pt: {
    name: 'Portugais',
    mails: {
      hello: 'Olá {prénom},',
      s1Subject: '{parking}: as suas reservas, sem as voltar a escrever',
      intro: P =>
        `O ${P} Pro é o software para parques de estacionamento de aeroporto com shuttle ou serviço de valet. Cerca de dez parques em França já o utilizam todos os dias.`,
      teamTitle: 'Para a sua equipa:',
      team: [
        `as reservas dos comparadores ${COMPARATORS} chegam sozinhas a um planeamento diário único;`,
        'o shuttle: quem levar, quem ir buscar, voos de regresso acompanhados;',
        'a planta do parque, o lugar de cada carro e as suas chaves;',
        'o contrato assinado e o relatório de estado com fotografias, no telemóvel;',
        'o lembrete na véspera e a faturação líquida de comissões.',
      ],
      customersTitle: 'Para os seus clientes:',
      customers: P => [
        `acompanham o shuttle em direto na aplicação ${P}, na App Store e no Google Play;`,
        'ao aterrar, recebem o ponto de encontro: já não precisam de telefonar;',
        'encontram a reserva e o carro com um toque.',
      ],
      tryDemo: 'Experimente a demonstração em dois minutos: {lien_demo}',
      apps: P => `O ${P} Pro funciona em iPhone e Android (ligações abaixo). Alguma dúvida? Basta responder a este e-mail.`,
      regards: 'Com os melhores cumprimentos,',
      s2Subject: 'Os seus clientes telefonam quando aterram?',
      s2Intro: P => `Com o ${P} Pro, o telefone deixa de tocar quando os clientes regressam de férias:`,
      s2Lines: P => [
        'o voo de regresso é acompanhado e um atraso muda sozinho a hora de recolha;',
        'o seu motorista vê a lista atualizada no telemóvel;',
        `o cliente recebe o ponto de encontro e vê o shuttle chegar na aplicação ${P}.`,
      ],
      s2Outro: 'Cerca de dez parques já trabalham assim. Veja na demonstração: {lien_demo}',
      s3Subject: 'Não volto a incomodar',
      s3Text:
        'Esta é a minha última mensagem. Se um dia reescrever reservas ou as chamadas à chegada se tornarem pesadas, responda a este e-mail: preparamos tudo para {parking}, planta e preços incluídos.',
      s3Demo: 'A demonstração continua aberta: {lien_demo}',
      s3Bye: 'Votos de bom trabalho,',
    },
    chrome: {
      why: (parking, product) =>
        `Recebe esta mensagem no endereço profissional de ${parking} porque o ${product} se destina a parques de estacionamento perto de aeroportos.`,
      who: (product, publisher) => `O ${product} é editado por ${publisher}.`,
      stop: product => `Deixar de receber mensagens do ${product}`,
      demo: product => `Ver a demonstração do ${product}`,
      teamApp: p => `A aplicação da sua equipa, ${p} Pro:`,
      travellerApp: p => `A aplicação dos seus clientes, ${p}, já na App Store e no Google Play:`,
      proPlay: p => `${p} Pro no Google Play (Android)`,
      proApple: p => `${p} Pro na App Store (iPhone)`,
      appPlay: p => `${p}, a aplicação dos seus clientes, no Google Play (Android)`,
      appApple: p => `${p}, a aplicação dos seus clientes, na App Store (iPhone)`,
      appleSoon: 'A Apple está a rever a aplicação: enviaremos a ligação assim que for publicada.',
      screens: ['O planeamento do dia', 'O shuttle em direto', 'Cada carro no seu lugar'],
      bannerAlt: 'Plazo Pro, o software para parques de aeroporto: shuttles em direto, reservas dos comparadores, cada carro no seu lugar',
      unsubscribeSubject: 'Deixar de receber mensagens',
    },
  },
  nl: {
    name: 'Néerlandais',
    mails: {
      hello: 'Goedendag {prénom},',
      s1Subject: '{parking}: uw boekingen, zonder overtypen',
      intro: P =>
        `${P} Pro is de software voor luchthavenparkings met shuttle of valetservice. Een tiental parkings in Frankrijk werkt er al dagelijks mee.`,
      teamTitle: 'Voor uw team:',
      team: [
        `de boekingen van de vergelijkingssites ${COMPARATORS} komen vanzelf in één dagplanning;`,
        'de shuttle: wie wegbrengen, wie ophalen, retourvluchten gevolgd;',
        'de plattegrond van de parking, de plaats van elke auto en de sleutels;',
        "het ondertekende contract en het schaderapport met foto's, op de telefoon;",
        'de herinnering de dag ervoor en de omzet na aftrek van commissies.',
      ],
      customersTitle: 'Voor uw klanten:',
      customers: P => [
        `ze volgen de shuttle live in de app ${P}, in de App Store en Google Play;`,
        'bij de landing krijgen ze het ontmoetingspunt: bellen is niet meer nodig;',
        'ze vinden hun boeking en hun auto met één tik.',
      ],
      tryDemo: 'Probeer de demo in twee minuten: {lien_demo}',
      apps: P => `${P} Pro werkt op iPhone en Android (links hieronder). Een vraag? Antwoord gewoon op deze e-mail.`,
      regards: 'Met vriendelijke groet,',
      s2Subject: 'Bellen uw klanten bij de landing?',
      s2Intro: P => `Met ${P} Pro gaat de telefoon niet meer over als uw klanten terugkomen van vakantie:`,
      s2Lines: P => [
        'de retourvlucht wordt gevolgd en een vertraging verschuift vanzelf het ophaaltijdstip;',
        'uw chauffeur ziet zijn actuele lijst op de telefoon;',
        `uw klant krijgt het ontmoetingspunt en ziet de shuttle aankomen in ${P}.`,
      ],
      s2Outro: 'Een tiental parkings werkt al zo. Bekijk het in de demo: {lien_demo}',
      s3Subject: 'Ik stoor u niet meer',
      s3Text:
        'Dit is mijn laatste bericht. Als het overtypen van boekingen of de telefoontjes bij de landing ooit te veel worden, antwoord dan op deze e-mail: wij richten alles in voor {parking}, plattegrond en tarieven inbegrepen.',
      s3Demo: 'De demo blijft open: {lien_demo}',
      s3Bye: 'Het allerbeste,',
    },
    chrome: {
      why: (parking, product) =>
        `U ontvangt dit bericht op het zakelijke adres van ${parking} omdat ${product} bedoeld is voor parkings bij luchthavens.`,
      who: (product, publisher) => `${product} wordt uitgegeven door ${publisher}.`,
      stop: product => `Geen berichten meer ontvangen van ${product}`,
      demo: product => `Bekijk de demo van ${product}`,
      ...stores({
        teamApp: 'De app voor uw team',
        travellerApp: 'De app voor uw klanten',
        customersApp: 'de app voor uw klanten',
        on: 'in',
        inStore: 'al in de App Store en Google Play',
      }),
      appleSoon: 'Apple beoordeelt de app: we sturen u de link zodra hij gepubliceerd is.',
      screens: ['De dagplanning', 'De shuttle live', 'Elke auto op zijn plaats'],
      bannerAlt: 'Plazo Pro, de software voor luchthavenparkings: shuttles live, boekingen van vergelijkingssites, elke auto op zijn plaats',
      unsubscribeSubject: 'Geen berichten meer ontvangen',
    },
  },
  pl: {
    name: 'Polonais',
    mails: {
      hello: 'Dzień dobry {prénom},',
      s1Subject: '{parking}: rezerwacje bez przepisywania',
      intro: P =>
        `${P} Pro to oprogramowanie dla parkingów lotniskowych z busem dowozowym lub usługą valet. Korzysta z niego już codziennie około dziesięciu parkingów we Francji.`,
      teamTitle: 'Dla Państwa zespołu:',
      team: [
        `rezerwacje z porównywarek ${COMPARATORS} same trafiają do jednego planu dnia;`,
        'bus: kogo zawieźć, kogo odebrać, śledzenie lotów powrotnych;',
        'plan parkingu, miejsce każdego auta i jego kluczyki;',
        'podpisana umowa i protokół stanu pojazdu ze zdjęciami, w telefonie;',
        'przypomnienie w przeddzień i obroty po odliczeniu prowizji.',
      ],
      customersTitle: 'Dla Państwa klientów:',
      customers: P => [
        `śledzą bus na żywo w aplikacji ${P}, w App Store i Google Play;`,
        'po wylądowaniu otrzymują miejsce spotkania: nie muszą dzwonić;',
        'jednym dotknięciem znajdują rezerwację i samochód.',
      ],
      tryDemo: 'Zapraszam do wypróbowania demo w dwie minuty: {lien_demo}',
      apps: P => `${P} Pro działa na iPhonie i Androidzie (linki poniżej). Pytania? Wystarczy odpowiedzieć na tę wiadomość.`,
      regards: 'Z poważaniem,',
      s2Subject: 'Czy klienci dzwonią do Państwa po wylądowaniu?',
      s2Intro: P => `Z ${P} Pro telefon przestaje dzwonić, gdy klienci wracają z urlopu:`,
      s2Lines: P => [
        'lot powrotny jest śledzony, a opóźnienie samo przesuwa godzinę odbioru;',
        'kierowca widzi aktualną listę w telefonie;',
        `klient otrzymuje miejsce spotkania i widzi nadjeżdżający bus w aplikacji ${P}.`,
      ],
      s2Outro: 'Około dziesięciu parkingów już tak pracuje. Zapraszam do demo: {lien_demo}',
      s3Subject: 'Nie będę już przeszkadzać',
      s3Text:
        'To moja ostatnia wiadomość. Jeśli kiedyś przepisywanie rezerwacji lub telefony po wylądowaniu staną się uciążliwe, wystarczy odpowiedzieć na tę wiadomość: przygotujemy wszystko dla {parking}, łącznie z planem i cennikiem.',
      s3Demo: 'Demo pozostaje dostępne: {lien_demo}',
      s3Bye: 'Pozdrawiam serdecznie,',
    },
    chrome: {
      why: (parking, product) =>
        `Otrzymują Państwo tę wiadomość na adres firmowy ${parking}, ponieważ ${product} jest przeznaczony dla parkingów w pobliżu lotnisk.`,
      who: (product, publisher) => `Wydawcą ${product} jest ${publisher}.`,
      stop: product => `Nie chcę otrzymywać wiadomości od ${product}`,
      demo: product => `Zobacz demo ${product}`,
      ...stores({
        teamApp: 'Aplikacja dla zespołu',
        travellerApp: 'Aplikacja dla klientów',
        customersApp: 'aplikacja dla klientów',
        on: 'w',
        inStore: 'już w App Store i Google Play',
      }),
      appleSoon: 'Apple sprawdza aplikację: link wyślemy, gdy tylko zostanie opublikowana.',
      screens: ['Plan dnia', 'Bus na żywo', 'Każde auto na swoim miejscu'],
      bannerAlt: 'Plazo Pro, oprogramowanie dla parkingów lotniskowych: busy na żywo, rezerwacje z porównywarek, każde auto na swoim miejscu',
      unsubscribeSubject: 'Rezygnacja z wiadomości',
    },
  },
  ro: {
    name: 'Roumain',
    mails: {
      hello: 'Bună ziua {prénom},',
      s1Subject: '{parking}: rezervările dumneavoastră, fără retastare',
      intro: P =>
        `${P} Pro este software-ul pentru parcările de aeroport cu transfer sau serviciu valet. Aproximativ zece parcări din Franța îl folosesc deja zilnic.`,
      teamTitle: 'Pentru echipa dumneavoastră:',
      team: [
        `rezervările de pe site-urile de comparare ${COMPARATORS} ajung singure într-un singur program zilnic;`,
        'transferul: pe cine duceți, pe cine aduceți, zborurile de întoarcere urmărite;',
        'planul parcării, locul fiecărei mașini și cheile ei;',
        'contractul semnat și procesul-verbal de predare cu fotografii, pe telefon;',
        'mementoul din ziua precedentă și cifra de afaceri netă de comisioane.',
      ],
      customersTitle: 'Pentru clienții dumneavoastră:',
      customers: P => [
        `urmăresc transferul în direct în aplicația ${P}, în App Store și Google Play;`,
        'la aterizare primesc punctul de întâlnire: nu mai trebuie să sune;',
        'își găsesc rezervarea și mașina dintr-o atingere.',
      ],
      tryDemo: 'Încercați demonstrația în două minute: {lien_demo}',
      apps: P => `${P} Pro funcționează pe iPhone și Android (linkuri mai jos). O întrebare? Răspundeți simplu la acest e-mail.`,
      regards: 'Cu stimă,',
      s2Subject: 'Vă sună clienții la aterizare?',
      s2Intro: P => `Cu ${P} Pro, telefonul nu mai sună când clienții se întorc din concediu:`,
      s2Lines: P => [
        'zborul de întoarcere este urmărit, iar o întârziere mută singură ora de preluare;',
        'șoferul își vede lista actualizată pe telefon;',
        `clientul primește punctul de întâlnire și vede transferul venind în aplicația ${P}.`,
      ],
      s2Outro: 'Aproximativ zece parcări lucrează deja așa. Vedeți în demonstrație: {lien_demo}',
      s3Subject: 'Nu vă mai deranjez',
      s3Text:
        'Acesta este ultimul meu mesaj. Dacă într-o zi retastarea rezervărilor sau apelurile de la aterizare devin prea mult, răspundeți la acest e-mail: pregătim totul pentru {parking}, inclusiv planul și tarifele.',
      s3Demo: 'Demonstrația rămâne deschisă: {lien_demo}',
      s3Bye: 'Toate cele bune,',
    },
    chrome: {
      why: (parking, product) =>
        `Primiți acest mesaj la adresa profesională a ${parking} pentru că ${product} se adresează parcărilor din apropierea aeroporturilor.`,
      who: (product, publisher) => `${product} este publicat de ${publisher}.`,
      stop: product => `Nu mai doresc mesaje de la ${product}`,
      demo: product => `Vedeți demonstrația ${product}`,
      ...stores({
        teamApp: 'Aplicația echipei dumneavoastră',
        travellerApp: 'Aplicația clienților dumneavoastră',
        customersApp: 'aplicația clienților dumneavoastră',
        on: 'în',
        inStore: 'deja în App Store și Google Play',
      }),
      appleSoon: 'Apple verifică aplicația: vă trimitem linkul imediat ce este publicată.',
      screens: ['Programul zilei', 'Transferul în direct', 'Fiecare mașină la locul ei'],
      bannerAlt:
        'Plazo Pro, software-ul pentru parcările de aeroport: transferuri în direct, rezervări de pe site-urile de comparare, fiecare mașină la locul ei',
      unsubscribeSubject: 'Dezabonare',
    },
  },
  sv: {
    name: 'Suédois',
    mails: {
      hello: 'Hej {prénom},',
      s1Subject: '{parking}: era bokningar, utan att skriva av dem',
      intro: P =>
        `${P} Pro är programvaran för flygplatsparkeringar med transfer eller valet-service. Ett tiotal parkeringar i Frankrike använder den redan varje dag.`,
      teamTitle: 'För ert team:',
      team: [
        `bokningarna från jämförelsesajterna ${COMPARATORS} hamnar av sig själva i ett enda dagsschema;`,
        'transfern: vilka som ska köras, vilka som ska hämtas, returflyg bevakade;',
        'kartan över parkeringen, varje bils plats och dess nycklar;',
        'det signerade avtalet och besiktningsprotokollet med foton, i telefonen;',
        'påminnelsen dagen före och omsättningen efter provisioner.',
      ],
      customersTitle: 'För era kunder:',
      customers: P => [
        `de följer transfern live i appen ${P}, på App Store och Google Play;`,
        'vid landningen får de mötesplatsen: inget behov av att ringa;',
        'de hittar sin bokning och sin bil med ett tryck.',
      ],
      tryDemo: 'Prova demon på två minuter: {lien_demo}',
      apps: P => `${P} Pro fungerar på iPhone och Android (länkar nedan). En fråga? Svara bara på det här mejlet.`,
      regards: 'Vänliga hälsningar,',
      s2Subject: 'Ringer era kunder när de landar?',
      s2Intro: P => `Med ${P} Pro slutar telefonen ringa när kunderna kommer hem från semestern:`,
      s2Lines: P => [
        'returflyget bevakas och en försening flyttar hämtningstiden automatiskt;',
        'er förare ser sin uppdaterade lista i telefonen;',
        `kunden får mötesplatsen och ser transfern komma i ${P}.`,
      ],
      s2Outro: 'Ett tiotal parkeringar arbetar redan så. Se det i demon: {lien_demo}',
      s3Subject: 'Jag hör inte av mig igen',
      s3Text:
        'Det här är mitt sista meddelande. Om det någon gång blir för mycket att skriva av bokningar eller ta emot samtal vid landning, svara bara på det här mejlet: vi förbereder allt för {parking}, karta och priser inräknade.',
      s3Demo: 'Demon är fortfarande öppen: {lien_demo}',
      s3Bye: 'Allt gott,',
    },
    chrome: {
      why: (parking, product) =>
        `Ni får detta meddelande på företagsadressen till ${parking} eftersom ${product} är gjort för parkeringar nära flygplatser.`,
      who: (product, publisher) => `${product} ges ut av ${publisher}.`,
      stop: product => `Sluta ta emot meddelanden från ${product}`,
      demo: product => `Se demon av ${product}`,
      ...stores({
        teamApp: 'Appen för ert team',
        travellerApp: 'Appen för era kunder',
        customersApp: 'appen för era kunder',
        on: 'på',
        inStore: 'redan på App Store och Google Play',
      }),
      appleSoon: 'Apple granskar appen: vi skickar länken så snart den är publicerad.',
      screens: ['Dagens schema', 'Transfern live', 'Varje bil på sin plats'],
      bannerAlt: 'Plazo Pro, programvaran för flygplatsparkeringar: transfer live, bokningar från jämförelsesajter, varje bil på sin plats',
      unsubscribeSubject: 'Avsluta prenumeration',
    },
  },
  da: {
    name: 'Danois',
    mails: {
      hello: 'Hej {prénom},',
      s1Subject: '{parking}: jeres bookinger, uden at skrive dem af',
      intro: P =>
        `${P} Pro er softwaren til lufthavnsparkeringer med shuttle eller valet-service. Omkring ti parkeringer i Frankrig bruger den allerede hver dag.`,
      teamTitle: 'Til jeres team:',
      team: [
        `bookingerne fra sammenligningssiderne ${COMPARATORS} lander af sig selv i én samlet dagsplan;`,
        'shuttlen: hvem der skal køres, hvem der skal hentes, returfly overvåget;',
        'kortet over parkeringen, hver bils plads og dens nøgler;',
        'den underskrevne kontrakt og tilstandsrapporten med fotos, på telefonen;',
        'påmindelsen dagen før og omsætningen efter provision.',
      ],
      customersTitle: 'Til jeres kunder:',
      customers: P => [
        `de følger shuttlen live i appen ${P}, i App Store og Google Play;`,
        'ved landing får de mødestedet: de behøver ikke ringe;',
        'de finder deres booking og deres bil med ét tryk.',
      ],
      tryDemo: 'Prøv demoen på to minutter: {lien_demo}',
      apps: P => `${P} Pro kører på iPhone og Android (links nedenfor). Spørgsmål? Svar blot på denne e-mail.`,
      regards: 'Med venlig hilsen',
      s2Subject: 'Ringer jeres kunder, når de lander?',
      s2Intro: P => `Med ${P} Pro holder telefonen op med at ringe, når kunderne kommer hjem fra ferie:`,
      s2Lines: P => [
        'returflyet overvåges, og en forsinkelse flytter selv afhentningstidspunktet;',
        'jeres chauffør ser sin opdaterede liste på telefonen;',
        `kunden får mødestedet og ser shuttlen komme i ${P}.`,
      ],
      s2Outro: 'Omkring ti parkeringer arbejder allerede sådan. Se det i demoen: {lien_demo}',
      s3Subject: 'Jeg forstyrrer ikke mere',
      s3Text:
        'Dette er min sidste besked. Hvis det en dag bliver for meget at skrive bookinger af eller tage opkald ved landing, så svar blot på denne e-mail: vi gør alt klar til {parking}, kort og priser inklusive.',
      s3Demo: 'Demoen er stadig åben: {lien_demo}',
      s3Bye: 'Alt det bedste',
    },
    chrome: {
      why: (parking, product) =>
        `I modtager denne besked på erhvervsadressen for ${parking}, fordi ${product} er lavet til parkeringer nær lufthavne.`,
      who: (product, publisher) => `${product} udgives af ${publisher}.`,
      stop: product => `Modtag ikke flere beskeder fra ${product}`,
      demo: product => `Se demoen af ${product}`,
      ...stores({
        teamApp: 'Appen til jeres team',
        travellerApp: 'Appen til jeres kunder',
        customersApp: 'appen til jeres kunder',
        on: 'i',
        inStore: 'allerede i App Store og Google Play',
      }),
      appleSoon: 'Apple gennemgår appen: vi sender jer linket, så snart den er udgivet.',
      screens: ['Dagens plan', 'Shuttlen live', 'Hver bil på sin plads'],
      bannerAlt: 'Plazo Pro, softwaren til lufthavnsparkeringer: shuttles live, bookinger fra sammenligningssider, hver bil på sin plads',
      unsubscribeSubject: 'Afmeld beskeder',
    },
  },
  nb: {
    name: 'Norvégien',
    mails: {
      hello: 'Hei {prénom},',
      s1Subject: '{parking}: bestillingene deres, uten å skrive dem av',
      intro: P =>
        `${P} Pro er programvaren for flyplassparkeringer med shuttle eller valet-tjeneste. Rundt ti parkeringer i Frankrike bruker den allerede hver dag.`,
      teamTitle: 'For teamet deres:',
      team: [
        `bestillingene fra sammenligningstjenestene ${COMPARATORS} havner av seg selv i én felles dagsplan;`,
        'shuttlen: hvem som skal kjøres, hvem som skal hentes, returfly fulgt;',
        'kartet over parkeringen, hver bils plass og nøklene;',
        'den signerte kontrakten og tilstandsrapporten med bilder, på telefonen;',
        'påminnelsen dagen før og omsetningen etter provisjon.',
      ],
      customersTitle: 'For kundene deres:',
      customers: P => [
        `de følger shuttlen direkte i appen ${P}, i App Store og Google Play;`,
        'ved landing får de møtestedet: ingen grunn til å ringe;',
        'de finner bestillingen og bilen med ett trykk.',
      ],
      tryDemo: 'Prøv demoen på to minutter: {lien_demo}',
      apps: P => `${P} Pro fungerer på iPhone og Android (lenker nedenfor). Spørsmål? Bare svar på denne e-posten.`,
      regards: 'Med vennlig hilsen',
      s2Subject: 'Ringer kundene deres når de lander?',
      s2Intro: P => `Med ${P} Pro slutter telefonen å ringe når kundene kommer hjem fra ferie:`,
      s2Lines: P => [
        'returflyet følges, og en forsinkelse flytter hentetidspunktet av seg selv;',
        'sjåføren ser den oppdaterte listen på telefonen;',
        `kunden får møtestedet og ser shuttlen komme i ${P}.`,
      ],
      s2Outro: 'Rundt ti parkeringer jobber allerede slik. Se det i demoen: {lien_demo}',
      s3Subject: 'Jeg forstyrrer ikke mer',
      s3Text:
        'Dette er min siste melding. Hvis det en dag blir for mye å skrive av bestillinger eller ta telefoner ved landing, bare svar på denne e-posten: vi gjør alt klart for {parking}, kart og priser inkludert.',
      s3Demo: 'Demoen er fortsatt åpen: {lien_demo}',
      s3Bye: 'Alt godt',
    },
    chrome: {
      why: (parking, product) =>
        `Dere mottar denne meldingen på bedriftsadressen til ${parking} fordi ${product} er laget for parkeringer nær flyplasser.`,
      who: (product, publisher) => `${product} utgis av ${publisher}.`,
      stop: product => `Ikke motta flere meldinger fra ${product}`,
      demo: product => `Se demoen av ${product}`,
      ...stores({
        teamApp: 'Appen for teamet deres',
        travellerApp: 'Appen for kundene deres',
        customersApp: 'appen for kundene deres',
        on: 'i',
        inStore: 'allerede i App Store og Google Play',
      }),
      appleSoon: 'Apple gjennomgår appen: vi sender lenken så snart den er publisert.',
      screens: ['Dagens plan', 'Shuttlen direkte', 'Hver bil på sin plass'],
      bannerAlt: 'Plazo Pro, programvaren for flyplassparkeringer: shuttle direkte, bestillinger fra sammenligningstjenester, hver bil på sin plass',
      unsubscribeSubject: 'Avslutt meldinger',
    },
  },
  fi: {
    name: 'Finnois',
    mails: {
      hello: 'Hei {prénom},',
      s1Subject: '{parking}: varaukset ilman uudelleen kirjoittamista',
      intro: P =>
        `${P} Pro on ohjelmisto lentoasemapysäköinneille, joilla on kuljetus tai valet-palvelu. Noin kymmenen pysäköintialuetta Ranskassa käyttää sitä jo päivittäin.`,
      teamTitle: 'Tiimillenne:',
      team: [
        `vertailusivustojen ${COMPARATORS} varaukset saapuvat itsestään yhteen päivän aikatauluun;`,
        'kuljetus: kenet viedään, kenet haetaan, paluulennot seurannassa;',
        'pysäköintialueen kartta, jokaisen auton paikka ja sen avaimet;',
        'allekirjoitettu sopimus ja kuvallinen kuntoraportti puhelimessa;',
        'muistutus edellisenä päivänä ja liikevaihto ilman provisioita.',
      ],
      customersTitle: 'Asiakkaillenne:',
      customers: P => [
        `he seuraavat kuljetusta reaaliajassa ${P}-sovelluksessa, App Storessa ja Google Playssa;`,
        'laskeutuessaan he saavat tapaamispaikan: soittaa ei tarvitse;',
        'he löytävät varauksensa ja autonsa yhdellä napautuksella.',
      ],
      tryDemo: 'Kokeile demoa kahdessa minuutissa: {lien_demo}',
      apps: P => `${P} Pro toimii iPhonessa ja Androidissa (linkit alla). Kysyttävää? Vastaa vain tähän viestiin.`,
      regards: 'Ystävällisin terveisin',
      s2Subject: 'Soittavatko asiakkaanne laskeuduttuaan?',
      s2Intro: P => `${P} Pron kanssa puhelin lakkaa soimasta, kun asiakkaat palaavat lomalta:`,
      s2Lines: P => [
        'paluulentoa seurataan, ja viivästys siirtää noutoajan itsestään;',
        'kuljettaja näkee ajantasaisen listansa puhelimessa;',
        `asiakas saa tapaamispaikan ja näkee kuljetuksen saapuvan ${P}-sovelluksessa.`,
      ],
      s2Outro: 'Noin kymmenen pysäköintialuetta toimii jo näin. Katso demosta: {lien_demo}',
      s3Subject: 'En häiritse enää',
      s3Text:
        'Tämä on viimeinen viestini. Jos varausten kirjoittaminen tai laskeutumisen jälkeiset puhelut joskus käyvät liian raskaiksi, vastaa vain tähän viestiin: valmistelemme kaiken kohteelle {parking}, kartta ja hinnat mukaan lukien.',
      s3Demo: 'Demo on edelleen auki: {lien_demo}',
      s3Bye: 'Kaikkea hyvää',
    },
    chrome: {
      why: (parking, product) =>
        `Saat tämän viestin kohteen ${parking} yritysosoitteeseen, koska ${product} on tehty lentoasemien lähellä oleville pysäköintialueille.`,
      who: (product, publisher) => `${product}-palvelun julkaisija on ${publisher}.`,
      stop: product => `En halua enää viestejä palvelulta ${product}`,
      demo: product => `Katso ${product}-demo`,
      teamApp: p => `Tiiminne sovellus, ${p} Pro:`,
      travellerApp: p => `Asiakkaidenne sovellus, ${p}, jo App Storessa ja Google Playssa:`,
      proPlay: p => `${p} Pro Google Playssa (Android)`,
      proApple: p => `${p} Pro App Storessa (iPhone)`,
      appPlay: p => `${p}, asiakkaidenne sovellus, Google Playssa (Android)`,
      appApple: p => `${p}, asiakkaidenne sovellus, App Storessa (iPhone)`,
      appleSoon: 'Apple tarkistaa sovellusta: lähetämme linkin heti, kun se on julkaistu.',
      screens: ['Päivän aikataulu', 'Kuljetus reaaliajassa', 'Jokainen auto paikallaan'],
      bannerAlt: 'Plazo Pro, ohjelmisto lentoasemapysäköinneille: kuljetukset reaaliajassa, vertailusivustojen varaukset, jokainen auto paikallaan',
      unsubscribeSubject: 'Lopeta viestit',
    },
  },
  hu: {
    name: 'Hongrois',
    mails: {
      // Hungarian puts the name before « kedves »; without a first name the greeting stays whole.
      hello: 'Jó napot kívánok!',
      s1Subject: '{parking}: foglalásai, újragépelés nélkül',
      intro: P =>
        `A ${P} Pro a transzferrel vagy valet-szolgáltatással működő repülőtéri parkolók szoftvere. Franciaországban mintegy tíz parkoló használja már naponta.`,
      teamTitle: 'Csapatának:',
      team: [
        `az összehasonlító oldalak ${COMPARATORS} foglalásai maguktól egyetlen napi beosztásba kerülnek;`,
        'a transzfer: kit kell kivinni, kiért kell menni, a visszaúti járatok követve;',
        'a parkoló térképe, minden autó helye és a kulcsai;',
        'az aláírt szerződés és a fényképes állapotjegyzőkönyv a telefonon;',
        'az előző napi emlékeztető és a jutalékokkal csökkentett árbevétel.',
      ],
      customersTitle: 'Ügyfeleinek:',
      customers: P => [
        `élőben követik a transzfert a ${P} alkalmazásban, az App Store-ban és a Google Playen;`,
        'leszálláskor megkapják a találkozási pontot: nem kell telefonálniuk;',
        'egy érintéssel megtalálják foglalásukat és autójukat.',
      ],
      tryDemo: 'Próbálja ki a demót két perc alatt: {lien_demo}',
      apps: P => `A ${P} Pro iPhone-on és Androidon is fut (linkek lent). Kérdése van? Egyszerűen válaszoljon erre az e-mailre.`,
      regards: 'Üdvözlettel:',
      s2Subject: 'Telefonálnak ügyfelei leszálláskor?',
      s2Intro: P => `A ${P} Próval elhallgat a telefon, amikor ügyfelei hazatérnek a szabadságról:`,
      s2Lines: P => [
        'a visszaúti járatot követjük, és a késés magától módosítja a felvétel idejét;',
        'a sofőr a telefonján látja a frissített listáját;',
        `az ügyfél megkapja a találkozási pontot, és látja érkezni a transzfert a ${P} alkalmazásban.`,
      ],
      s2Outro: 'Mintegy tíz parkoló dolgozik már így. Nézze meg a demóban: {lien_demo}',
      s3Subject: 'Többet nem zavarom',
      s3Text:
        'Ez az utolsó üzenetem. Ha egyszer túl sok lesz a foglalások újragépelése vagy a leszálláskori hívások, válaszoljon erre az e-mailre: mindent előkészítünk a(z) {parking} számára, a térképpel és az árakkal együtt.',
      s3Demo: 'A demó továbbra is elérhető: {lien_demo}',
      s3Bye: 'Minden jót!',
    },
    chrome: {
      why: (parking, product) =>
        `Ezt az üzenetet a(z) ${parking} céges címére kapja, mert a ${product} a repülőterek közelében lévő parkolóknak készült.`,
      who: (product, publisher) => `A ${product} kiadója: ${publisher}.`,
      stop: product => `Nem kérek több üzenetet a ${product} részéről`,
      demo: product => `A ${product} demó megtekintése`,
      teamApp: p => `Csapata alkalmazása, ${p} Pro:`,
      travellerApp: p => `Ügyfelei alkalmazása, ${p}, már az App Store-ban és a Google Playen:`,
      proPlay: p => `${p} Pro a Google Playen (Android)`,
      proApple: p => `${p} Pro az App Store-ban (iPhone)`,
      appPlay: p => `${p}, ügyfelei alkalmazása, a Google Playen (Android)`,
      appApple: p => `${p}, ügyfelei alkalmazása, az App Store-ban (iPhone)`,
      appleSoon: 'Az Apple ellenőrzi az alkalmazást: a linket a megjelenés után azonnal elküldjük.',
      screens: ['A napi beosztás', 'A transzfer élőben', 'Minden autó a helyén'],
      bannerAlt: 'Plazo Pro, a repülőtéri parkolók szoftvere: élő transzferek, összehasonlító oldalak foglalásai, minden autó a helyén',
      unsubscribeSubject: 'Leiratkozás',
    },
  },
  cs: {
    name: 'Tchèque',
    mails: {
      hello: 'Dobrý den {prénom},',
      s1Subject: '{parking}: rezervace bez přepisování',
      intro: P =>
        `${P} Pro je software pro letištní parkoviště s kyvadlovou dopravou nebo službou valet. Ve Francii ho už denně používá zhruba deset parkovišť.`,
      teamTitle: 'Pro váš tým:',
      team: [
        `rezervace ze srovnávačů ${COMPARATORS} samy přicházejí do jednoho denního plánu;`,
        'kyvadlová doprava: koho odvézt, pro koho dojet, sledované zpáteční lety;',
        'plán parkoviště, místo každého auta a jeho klíče;',
        'podepsaná smlouva a předávací protokol s fotkami v telefonu;',
        'připomínka den předem a tržby po odečtení provizí.',
      ],
      customersTitle: 'Pro vaše zákazníky:',
      customers: P => [
        `sledují kyvadlovou dopravu živě v aplikaci ${P}, v App Storu a na Google Play;`,
        'po přistání dostanou místo setkání: nemusí volat;',
        'rezervaci i auto najdou jedním klepnutím.',
      ],
      tryDemo: 'Vyzkoušejte demo za dvě minuty: {lien_demo}',
      apps: P => `${P} Pro funguje na iPhonu i Androidu (odkazy níže). Máte dotaz? Stačí odpovědět na tento e-mail.`,
      regards: 'S pozdravem',
      s2Subject: 'Volají vám zákazníci po přistání?',
      s2Intro: P => `S ${P} Pro přestane telefon zvonit, když se zákazníci vracejí z dovolené:`,
      s2Lines: P => [
        'zpáteční let sledujeme a zpoždění samo posune čas vyzvednutí;',
        'řidič vidí aktuální seznam v telefonu;',
        `zákazník dostane místo setkání a v aplikaci ${P} vidí přijíždět kyvadlovou dopravu.`,
      ],
      s2Outro: 'Zhruba deset parkovišť už takto pracuje. Podívejte se v demu: {lien_demo}',
      s3Subject: 'Už vás nebudu obtěžovat',
      s3Text:
        'Toto je moje poslední zpráva. Pokud vás jednou přestane bavit přepisování rezervací nebo telefonáty po přistání, odpovězte na tento e-mail: vše připravíme pro {parking}, včetně plánu a ceníku.',
      s3Demo: 'Demo zůstává otevřené: {lien_demo}',
      s3Bye: 'Ať se daří',
    },
    chrome: {
      why: (parking, product) => `Tuto zprávu dostáváte na firemní adresu ${parking}, protože ${product} je určen pro parkoviště u letišť.`,
      who: (product, publisher) => `${product} vydává ${publisher}.`,
      stop: product => `Nedostávat další zprávy od ${product}`,
      demo: product => `Zobrazit demo ${product}`,
      teamApp: p => `Aplikace pro váš tým, ${p} Pro:`,
      travellerApp: p => `Aplikace pro vaše zákazníky, ${p}, už v App Storu a na Google Play:`,
      proPlay: p => `${p} Pro na Google Play (Android)`,
      proApple: p => `${p} Pro v App Storu (iPhone)`,
      appPlay: p => `${p}, aplikace pro vaše zákazníky, na Google Play (Android)`,
      appApple: p => `${p}, aplikace pro vaše zákazníky, v App Storu (iPhone)`,
      appleSoon: 'Apple aplikaci kontroluje: odkaz vám pošleme, jakmile bude zveřejněna.',
      screens: ['Denní plán', 'Kyvadlová doprava živě', 'Každé auto na svém místě'],
      bannerAlt: 'Plazo Pro, software pro letištní parkoviště: kyvadlová doprava živě, rezervace ze srovnávačů, každé auto na svém místě',
      unsubscribeSubject: 'Odhlásit zprávy',
    },
  },
  et: {
    name: 'Estonien',
    mails: {
      hello: 'Tere {prénom},',
      s1Subject: '{parking}: broneeringud ilma ümber trükkimata',
      intro: P =>
        `${P} Pro on tarkvara lennujaama parklatele, millel on transfer või valet-teenus. Prantsusmaal kasutab seda juba igapäevaselt umbes kümme parklat.`,
      teamTitle: 'Teie meeskonnale:',
      team: [
        `võrdlusportaalide ${COMPARATORS} broneeringud jõuavad ise ühte päevaplaani;`,
        'transfer: keda viia, keda tuua, tagasilennud jälgimisel;',
        'parkla plaan, iga auto koht ja selle võtmed;',
        'allkirjastatud leping ja fotodega seisukorra akt telefonis;',
        'meeldetuletus eelmisel päeval ja käive pärast vahendustasusid.',
      ],
      customersTitle: 'Teie klientidele:',
      customers: P => [
        `nad jälgivad transferit reaalajas rakenduses ${P}, App Store'is ja Google Plays;`,
        'maandumisel saavad nad kohtumispaiga: helistama ei pea;',
        'broneeringu ja auto leiavad nad ühe puudutusega.',
      ],
      tryDemo: 'Proovige demot kahe minutiga: {lien_demo}',
      apps: P => `${P} Pro töötab iPhone'is ja Androidis (lingid allpool). Küsimusi? Vastake lihtsalt sellele kirjale.`,
      regards: 'Lugupidamisega',
      s2Subject: 'Kas teie kliendid helistavad maandumisel?',
      s2Intro: P => `${P} Proga lakkab telefon helisemast, kui kliendid puhkuselt naasevad:`,
      s2Lines: P => [
        'tagasilendu jälgitakse ja hilinemine nihutab peale võtmise aega ise;',
        'juht näeb oma ajakohast nimekirja telefonis;',
        `klient saab kohtumispaiga ja näeb transferit saabumas rakenduses ${P}.`,
      ],
      s2Outro: 'Umbes kümme parklat töötab juba nii. Vaadake demost: {lien_demo}',
      s3Subject: 'Ma ei sega teid enam',
      s3Text:
        'See on minu viimane kiri. Kui broneeringute ümbertrükkimine või maandumisjärgsed kõned kunagi liiga palju tunduvad, vastake sellele kirjale: valmistame kõik ette parklale {parking}, koos plaani ja hindadega.',
      s3Demo: 'Demo on endiselt avatud: {lien_demo}',
      s3Bye: 'Kõike head',
    },
    chrome: {
      why: (parking, product) =>
        `Saate selle kirja ettevõtte ${parking} tööaadressile, sest ${product} on mõeldud lennujaamade lähedal asuvatele parklatele.`,
      who: (product, publisher) => `${product} väljaandja on ${publisher}.`,
      stop: product => `Ära saada mulle enam ${product} kirju`,
      demo: product => `Vaata ${product} demot`,
      teamApp: p => `Teie meeskonna rakendus, ${p} Pro:`,
      travellerApp: p => `Teie klientide rakendus, ${p}, juba App Store'is ja Google Plays:`,
      proPlay: p => `${p} Pro Google Plays (Android)`,
      proApple: p => `${p} Pro App Store'is (iPhone)`,
      appPlay: p => `${p}, teie klientide rakendus, Google Plays (Android)`,
      appApple: p => `${p}, teie klientide rakendus, App Store'is (iPhone)`,
      appleSoon: 'Apple vaatab rakenduse üle: saadame lingi kohe pärast avaldamist.',
      screens: ['Päevaplaan', 'Transfer reaalajas', 'Iga auto omal kohal'],
      bannerAlt: 'Plazo Pro, tarkvara lennujaama parklatele: transfer reaalajas, võrdlusportaalide broneeringud, iga auto omal kohal',
      unsubscribeSubject: 'Loobu kirjadest',
    },
  },
  el: {
    name: 'Grec',
    mails: {
      hello: 'Καλημέρα {prénom},',
      s1Subject: '{parking}: οι κρατήσεις σας, χωρίς πληκτρολόγηση',
      intro: P =>
        `Το ${P} Pro είναι το λογισμικό για χώρους στάθμευσης αεροδρομίων με shuttle ή υπηρεσία valet. Περίπου δέκα χώροι στάθμευσης στη Γαλλία το χρησιμοποιούν ήδη καθημερινά.`,
      teamTitle: 'Για την ομάδα σας:',
      // Greek separates list items with the ano teleia (·): « ; » is its question mark.
      team: [
        `οι κρατήσεις από τις πλατφόρμες σύγκρισης ${COMPARATORS} φτάνουν μόνες τους σε ένα ενιαίο ημερήσιο πρόγραμμα·`,
        'το shuttle: ποιον να πάτε, ποιον να παραλάβετε, παρακολούθηση πτήσεων επιστροφής·',
        'ο χάρτης του χώρου, η θέση κάθε αυτοκινήτου και τα κλειδιά του·',
        'το υπογεγραμμένο συμβόλαιο και η αναφορά κατάστασης με φωτογραφίες, στο κινητό·',
        'η υπενθύμιση την προηγούμενη μέρα και ο τζίρος μετά τις προμήθειες.',
      ],
      customersTitle: 'Για τους πελάτες σας:',
      customers: P => [
        `παρακολουθούν το shuttle ζωντανά στην εφαρμογή ${P}, στο App Store και στο Google Play·`,
        'μόλις προσγειωθούν, λαμβάνουν το σημείο συνάντησης: δεν χρειάζεται να τηλεφωνήσουν·',
        'βρίσκουν την κράτηση και το αυτοκίνητό τους με ένα άγγιγμα.',
      ],
      tryDemo: 'Δοκιμάστε το demo σε δύο λεπτά: {lien_demo}',
      apps: P => `Το ${P} Pro λειτουργεί σε iPhone και Android (σύνδεσμοι παρακάτω). Έχετε κάποια ερώτηση; Απαντήστε απλώς σε αυτό το email.`,
      regards: 'Με εκτίμηση,',
      s2Subject: 'Σας τηλεφωνούν οι πελάτες όταν προσγειώνονται;',
      s2Intro: P => `Με το ${P} Pro, το τηλέφωνο σταματά να χτυπά όταν οι πελάτες επιστρέφουν από διακοπές:`,
      s2Lines: P => [
        'η πτήση επιστροφής παρακολουθείται και μια καθυστέρηση μετακινεί μόνη της την ώρα παραλαβής·',
        'ο οδηγός σας βλέπει την ενημερωμένη λίστα του στο κινητό·',
        `ο πελάτης λαμβάνει το σημείο συνάντησης και βλέπει το shuttle να έρχεται στην εφαρμογή ${P}.`,
      ],
      s2Outro: 'Περίπου δέκα χώροι στάθμευσης δουλεύουν ήδη έτσι. Δείτε το στο demo: {lien_demo}',
      s3Subject: 'Δεν θα σας ενοχλήσω ξανά',
      s3Text:
        'Αυτό είναι το τελευταίο μου μήνυμα. Αν κάποια μέρα η πληκτρολόγηση κρατήσεων ή τα τηλεφωνήματα κατά την προσγείωση γίνουν βάρος, απαντήστε σε αυτό το email: ετοιμάζουμε τα πάντα για το {parking}, μαζί με χάρτη και τιμές.',
      s3Demo: 'Το demo παραμένει ανοιχτό: {lien_demo}',
      s3Bye: 'Καλή συνέχεια,',
    },
    chrome: {
      why: (parking, product) =>
        `Λαμβάνετε αυτό το μήνυμα στην επαγγελματική διεύθυνση του ${parking}, επειδή το ${product} απευθύνεται σε χώρους στάθμευσης κοντά σε αεροδρόμια.`,
      who: (product, publisher) => `Το ${product} εκδίδεται από την ${publisher}.`,
      stop: product => `Να μη λαμβάνω άλλα μηνύματα από το ${product}`,
      demo: product => `Δείτε το demo του ${product}`,
      teamApp: p => `Η εφαρμογή της ομάδας σας, ${p} Pro:`,
      travellerApp: p => `Η εφαρμογή των πελατών σας, ${p}, ήδη στο App Store και στο Google Play:`,
      proPlay: p => `${p} Pro στο Google Play (Android)`,
      proApple: p => `${p} Pro στο App Store (iPhone)`,
      appPlay: p => `${p}, η εφαρμογή των πελατών σας, στο Google Play (Android)`,
      appApple: p => `${p}, η εφαρμογή των πελατών σας, στο App Store (iPhone)`,
      appleSoon: 'Η Apple ελέγχει την εφαρμογή: θα σας στείλουμε τον σύνδεσμο μόλις δημοσιευτεί.',
      screens: ['Το πρόγραμμα της ημέρας', 'Το shuttle ζωντανά', 'Κάθε αυτοκίνητο στη θέση του'],
      bannerAlt:
        'Plazo Pro, το λογισμικό για χώρους στάθμευσης αεροδρομίων: shuttle ζωντανά, κρατήσεις από πλατφόρμες σύγκρισης, κάθε αυτοκίνητο στη θέση του',
      unsubscribeSubject: 'Διακοπή μηνυμάτων',
    },
  },
} satisfies Record<string, LanguagePack>;

export type PackLanguage = keyof typeof LANGUAGE_PACKS;
