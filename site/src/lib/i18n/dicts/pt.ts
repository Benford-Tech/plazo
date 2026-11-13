import type { Dict } from "../../fr-dict";
import { PRODUCT_NAME } from "../../product";
import type { BookingStatus, CancellationPolicy, Service } from "../../types";

const P = PRODUCT_NAME;

const ptDays = (days: number) => `${days} dia${days > 1 ? "s" : ""}`;

/** European Portuguese (pt-PT) texts of the site. French (fr-dict.ts) is the reference. */
export const pt: Dict = {
  dates: {
    weekdays: ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."],
    months: ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."],
    longMonths: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
    /** "dom. 4 out." */
    day: (weekday: string, day: number, month: string) => `${weekday} ${day} ${month}`,
    /** "9 de outubro de 2026" */
    longDate: (day: number, month: string, year: number) => `${day} de ${month} de ${year}`,
    /** "sáb. 3 out. às 06:30" */
    at: (day: string, time: string) => `${day} às ${time}`,
    days: ptDays,
  },
  money: {
    decimal: ",",
    group: " ",
    symbolFirst: false,
  },
  units: {
    oneDay: "por um dia",
    forDays: (days: string) => `por ${days}`,
  },
  meta: {
    defaultTitle: `${P} · Parques de estacionamento de aeroporto com shuttle`,
    defaultDescription:
      "Compare os parques privados com shuttle perto do aeroporto, veja o preço total para as suas datas e reserve online. Pagamento seguro com cartão.",
    airportTitle: (airport: string) =>
      `Estacionamento no aeroporto de ${airport} com shuttle`,
    airportDescription: (airport: string) =>
      `Parques privados no aeroporto de ${airport} com shuttle gratuito para os terminais: preço total para as suas datas, reserva e pagamento online.`,
    resultsTitle: (airport: string) => `Parques disponíveis em ${airport}`,
    parkingTitle: (parking: string, airport: string) =>
      `${parking} · estacionamento no aeroporto de ${airport}`,
    parkingDescription: (parking: string, airport: string) =>
      `${parking}, parque com shuttle para o aeroporto de ${airport}: tarifas, serviços, acesso e reserva online.`,
    bookingTitle: "Concluir a reserva",
    manageTitle: "A minha reserva",
    notFoundTitle: "Página não encontrada",
  },
  a11y: {
    skipToContent: "Ir para o conteúdo",
    mainNav: "Navegação principal",
    breadcrumb: "Trilho de navegação",
    photoPlaceholder: "Fotografias do parque em breve",
    photoSoon: "Fotos em breve",
    photoOf: (title: string, n: number) => `${title}, fotografia ${n}`,
    opensNewTab: "(novo separador)",
  },
  demo: {
    badge: "Demonstração",
    hint: "Parque fictício, apresentado a título de demonstração",
  },
  nav: {
    airports: "Aeroportos",
    myBooking: "A minha reserva",
    forOperators: "Gere um parque?",
    home: "Início",
    results: "Resultados",
  },
  footer: {
    pitch:
      "Os parques de aeroporto com shuttle, comparados e reservados online. Preço total apresentado.",
    airports: "Aeroportos",
    moreAirports: "Em breve, outros aeroportos",
    travellers: "Viajantes",
    faq: "Perguntas frequentes",
    contact: "Contacte-nos",
    product: P,
    terms: "Condições gerais",
    privacy: "Privacidade",
    legal: "Informações legais",
    deleteProAccount: `Eliminar uma conta ${P} Pro`,
    proLogin: "Entrar no espaço do operador",
    paymentTitle: "Pagamento seguro",
    paymentMethods: "Meios de pagamento aceites",
    paymentChips: ["CB", "Visa", "Mastercard", "Apple Pay", "Google Pay"],
    paymentText:
      "Pago online no momento da reserva, através da Stripe. Nada a pagar no parque.",
    followTitle: "Siga-nos",
    followOn: (network: string) => `${P} no ${network}`,
    rights: "Todos os direitos reservados",
    vat: (number: string) => `IVA ${number}`,
  },
  help: {
    eyebrow: "Precisa de ajuda?",
    title: "Tem uma pergunta sobre a sua reserva?",
    leadHours: (hours: string) => `A nossa equipa responde-lhe ${hours}.`,
    leadBoth: "A nossa equipa responde-lhe por telefone ou por escrito.",
    leadPhone: "A nossa equipa responde-lhe por telefone.",
    leadWritten: "Escreva-nos: a nossa equipa responde-lhe por e-mail.",
    leadSelf:
      "A sua reserva pode ser encontrada online com a respetiva referência e o seu e-mail, e as respostas às perguntas mais comuns estão nas nossas perguntas frequentes.",
    dayOfDeparture:
      "No dia da partida, ligue diretamente para o parque: o número está na sua confirmação e em « A minha reserva ».",
    byPhone: "Por telefone",
    call: "Ligar",
    callLabel: "Ligar para o apoio ao cliente",
    inWriting: "Por escrito",
    contactForm: "Formulário de contacto",
    replyWithin: (delay: string) => `Resposta por e-mail em ${delay}.`,
    replyByEmail: "Resposta por e-mail.",
    write: "Escreva-nos",
    findBooking: "Encontrar a minha reserva",
    faq: "Perguntas frequentes",
  },
  proHome: {
    metaTitle: `Software de gestão de parques de aeroporto · ${P} Pro`,
    metaDescription: `Software para parques de aeroporto com shuttle e valet: reservas dos comparadores, planta, shuttle, contrato e vistoria. Demonstração gratuita.`,
    nav: { software: "Software", live: "Shuttle e clientes", marketplace: `Vender no ${P}`, paperwork: "Contrato e vistoria", pricing: "Preços" },
    heroTitle: "O software dos parques",
    heroAccent: "de aeroporto",
    heroLead: "Para parques com shuttle e valets: os seus shuttles em direto, os seus clientes que o avisam, cada carro no seu lugar. No computador e no telemóvel.",
    map: {
      label: "Mapa: o parque, um shuttle a caminho do Terminal 1",
      live: "Em direto",
      liveSection: "Shuttle em direto · Terminal 1 em 7 min",
      driver: "Karim · 3 pess.",
      terminal: "Terminal 1 · 7 min",
    },
    liveTitle: "Os seus clientes deixam de lhe",
    liveAccent: "telefonar",
    liveLead: "Veem o shuttle a chegar e avisam-no num gesto: chegada, atraso do avião, bagagem perdida.",
    feedTitle: "O que a sua equipa recebe",
    messages: [
      { tone: "info", icon: "↗", title: "Dupont · Estou a caminho", text: "« Chegamos com uma bicicleta no tejadilho »", at: "06:05" },
      { tone: "info", icon: "10", title: "Leroy · Chego dentro de 10 min", text: "AB-123-CD", at: "06:20" },
      { tone: "ok", icon: "✓", title: "Petit · Estou no ponto de encontro", text: "Terminal 1 · saída 4", at: "14:42" },
      { tone: "warn", icon: "!", title: "Martin · O meu voo está atrasado", text: "aterra por volta das 22:10", at: "21:05" },
    ],
    liveGains: [
      "O shuttle parte na hora certa: o seu motorista sabe quem espera e onde.",
      "Menos chamadas para a receção: o cliente vê o shuttle na sua reserva.",
      "Um atraso do avião já não faz o shuttle esperar em vão.",
      "O cliente é avisado quando o carro está à sua espera.",
    ],
    buildOffer: "Montar a minha oferta",
    facts: [
      { value: "6", label: "comparadores reconhecidos" },
      { value: "4", label: "funções: gerente, receção, motorista, valet" },
      { value: "Web · iPhone · Android", label: "a mesma equipa em todo o lado" },
    ],
    productsTitle: "Tudo para um parque de aeroporto",
    productsLead: "Quatro ferramentas que funcionam em conjunto. Escolha-as no plano que lhe convém.",
    tryInDemo: "Experimentar na demonstração ›",
    products: {
      software: {
        tag: "Software",
        title: "O seu parque num relance",
        points: [
          "Todas as suas reservas num único planeamento",
          "Cada carro arrumado para sair sem mover outro",
          "O volume de negócios, líquido das comissões dos comparadores",
        ],
      },
      app: {
        tag: `Aplicação ${P} Pro`,
        title: "Para o motorista, o valet e a receção",
        points: ["Cada um vê o que tem de fazer, consoante a sua função", "O motorista sabe quem levar e quem ir buscar", "O valet sabe onde arrumar cada carro"],
      },
      marketplace: {
        tag: `Vender no ${P}`,
        title: "Novos clientes, sem esforço",
        points: [`O seu parque no comparador ${P}`, "Os clientes reservam e pagam online", "15 % por reserva paga, nada além disso"],
      },
      paperwork: {
        tag: "Contrato e vistoria",
        title: "Um litígio? Tem as provas",
        points: ["O seu contrato assinado por cada cliente", "Fotografias na entrega e no regresso, lado a lado", "Tudo guardado e encontrado num clique"],
      },
    },
    screens: {
      onSite: "No parque",
      arrivals: "Chegadas",
      returns: "Regressos",
      toHandle: "A tratar",
      lateFlight: "Voo atrasado",
      returnLabel: "regresso",
      go: "Ida · 6",
      back: "Regresso · 3",
      leave: "Partir · 3 pess.",
      listingName: "Parking des Cèdres",
      live: "Shuttle em direto",
      listingLine: "7 dias · 49 € · shuttle 8 min",
      paidLine: "Pago online · transferido para a sua conta",
      signed: "Contrato assinado",
      atCounter: "Na receção",
      dropoff: "Vistoria na entrega · 4 fotografias",
      atReturn: "No regresso:",
      already: "Já na entrega",
      fresh: "Novo",
      day: "Ter. 27 · 14 chegadas · 9 regressos · 87 carros",
      paid: "pago",
    },
    centralTitle: "Centralize as suas reservas",
    centralLead: `Tudo no mesmo sítio: os seus comparadores, o telefone, a receção e o ${P}.`,
    channels: ["Allopark", "Onepark", "Parclick", "ParkMundo", "ParkVia", "Park Hit", P, "Telefone", "Receção"],
    gains: [
      { title: "Ganhe tempo", text: "Sem voltar a introduzir dados: cada reserva chega sozinha ao planeamento." },
      { title: "Ganhe dinheiro", text: `Sem sobrelotação, e novos clientes com a sua ficha no ${P}.` },
      { title: "Clientes tranquilos", text: "Avisados na véspera, recolhidos a horas mesmo quando o voo se atrasa." },
    ],
    fieldTitle: "Feito no terreno",
    fieldLead: `O ${P} é construído com um parque com valet do aeroporto de Lyon Saint-Exupéry, a partir do que lhe faz perder tempo todos os dias.`,
    fieldPains: [
      "Reservas que chegam de todo o lado",
      "Carros a mover para tirar outro",
      "Clientes à espera do shuttle no regresso",
      "Litígios sem provas sobre o estado do carro",
    ],
    featuresKicker: "Funcionalidades",
    featuresTitle: `Tudo o que o ${P} Pro faz`,
    featuresLead: "Do primeiro e-mail do comparador ao cliente que parte com as suas chaves: uma única ferramenta para toda a equipa, no computador e no telemóvel.",
    features: [
      {
        icon: "day",
        title: "O seu dia",
        items: [
          "As próximas chegadas e as próximas partidas, que avançam com o dia",
          "Os atrasos detetados automaticamente",
          "Os carros no parque, noite a noite, até 3 meses",
          "Uma função por pessoa: receção, motorista, valet, gerente",
          "Uma notificação quando é preciso agir",
        ],
      },
      {
        icon: "bookings",
        title: "As suas reservas",
        items: [
          "As reservas dos comparadores chegam sozinhas ao seu planeamento",
          "Alterações e cancelamentos tidos em conta",
          "As faltas de comparência e os carros esquecidos assinalados",
          "O histórico de cada reserva: quem, o quê, quando",
          "As suas reservas antigas importadas num ficheiro",
        ],
      },
      {
        icon: "shuttle",
        title: "Shuttle e carros",
        items: [
          "Os clientes a levar e a ir buscar, por horário",
          "A hora real de aterragem de cada cliente",
          "Os seus clientes veem o shuttle a chegar",
          "Cada carro no seu lugar, as chaves no seu gancho",
          "Contrato assinado e vistoria com fotografias",
        ],
      },
      {
        icon: "money",
        title: "O seu dinheiro",
        items: [
          "O volume de negócios por mês e por comparador",
          "O que cada comparador lhe cobra, e o que fica para si",
          "As reservas sem preço em destaque",
          "Serviços extra (lavagem, carregamento) e suplementos (atraso, noite)",
          "Faturas em seu nome e com o seu logótipo",
        ],
      },
    ],
    featuresBand: `E os seus clientes encontram-no em ${P.toLowerCase()}.fr: reserva e pagamento online, sem nada para gerir.`,
    pricesTitle: "Monte a sua oferta",
    pricesLead: "Sem fidelização no plano mensal. Preços sem IVA, por mês e por parque.",
    planLines: { essentiel: "Todas as suas reservas no mesmo sítio", operations: "+ planta, filas de valet e shuttles", complet: "+ contrato, vistoria e margens" },
    recommended: "recomendado",
    allPrices: "Ver todos os preços",
    faqTitle: "Perguntas frequentes",
    faq: [
      ["Que comparadores o Plazo Pro lê?", "Allopark, Onepark, Parclick, ParkMundo, ParkVia e Park Hit. Reencaminha os e-mails deles para o endereço do seu parque, e a reserva é criada sozinha no seu planeamento."],
      ["Os meus clientes têm de instalar uma aplicação?", `Não. A ligação da reserva também abre no navegador. A aplicação ${P} acrescenta-lhes as notificações.`],
      ["Funciona para um parque com valet sem marcações no chão?", "Sim. Os seus carros são arrumados em filas segundo a data de regresso, para que cada um saia sem mover outro."],
      ["Quanto custa?", "De 99 € a 299 € sem IVA por mês e por parque, consoante o plano, −10 % no plano anual. Sem fidelização no plano mensal."],
      ["Em que dispositivos?", `No computador, no navegador, e no telemóvel Android com a aplicação ${P} Pro. A aplicação para iPhone está em validação pela Apple.`],
      ["Posso experimentar antes?", "Sim: a demonstração é gratuita, sem registo. Escolha uma função (gerente, receção, motorista ou valet) e experimente num parque fictício."],
    ] as [string, string][],
    learnMore: "Saber mais ›",
    topicsTitle: "Leia também",
    breadcrumbSolutions: "Soluções",
    topicCtaTitle: "Experimente-o num parque",
    topicCtaLead: "A demonstração é gratuita e sem registo: escolha uma função e viva o dia de um parque fictício.",
    topicProblem: "O problema",
    topicGains: "O que muda",
    topicScreens: "O que a sua equipa vê",
    contactTitle: "Precisa de informações?",
    contactLead: `Experimente já a demonstração, ou deixe-nos os seus contactos: ligamos-lhe para lhe mostrar o ${P} no seu parque.`,
    askDemo: "Pedir uma demonstração",
    demoSent: "Obrigado: escrevemos-lhe muito em breve para lhe mostrar o Plazo no seu parque.",
    footer: { solutions: "Soluções", start: "Começar", plazo: P, travellers: "Site para viajantes", contact: "Contacto" },
    appStoreSoon: "App Store: em breve",
    playStore: `${P} Pro no Google Play`,
  },
  proPricing: {
    metaTitle: `Preços do software de parques de aeroporto · ${P} Pro`,
    metaDescription: `Software para parques de aeroporto: reservas, comparadores, planta, shuttle. Monte a sua oferta ${P} Pro e veja o preço de imediato.`,
    navPricing: "Preços",
    navTravellers: "Para viajantes",
    login: "Entrar",
    tryDemo: "Experimentar a demonstração",
    signup: "Registar o meu parque",
    eyebrow: "Preços",
    title: "Monte a oferta do seu parque",
    lead: "Escolha o seu plano, acrescente a sua ficha no Plazo e as suas opções: o total calcula-se sozinho, ao mês ou ao ano.",
    anchors: { software: "Software", marketplace: `Ficha no ${P}`, options: "Opções" },
    billing: "Faturação",
    monthly: "Mensal",
    yearly: "Anual",
    softwareTitle: "O software do parque",
    softwareLead: `Web e aplicação ${P} Pro (iPhone, Android) em todos os planos. Cada plano inclui tudo o que o anterior faz.`,
    plans: "Plano",
    recommended: "Recomendado",
    perMonth: "sem IVA / mês",
    choose: "Escolher",
    chosen: "Escolhido",
    marketTitle: `A sua ficha no ${P}`,
    marketLead: `Os viajantes encontram o seu parque em plazo.fr e na aplicação ${P}, reservam e pagam online. O ${P} recebe o pagamento e transfere-lhe a sua parte.`,
    marketHeadline: "Sem assinatura, uma comissão por reserva",
    marketPitch: `Só paga o que o ${P} lhe traz.`,
    marketPoints: [
      "Ficha com fotografias, tarifas, shuttle em direto e avaliações",
      "Pagamento online com cartão, Apple Pay e Google Pay",
      "Reservas diretamente no seu planeamento",
      "Serviços extra vendidos ao viajante (lavagem, carregamento)",
    ],
    marketToggle: `Acrescentar a minha ficha no ${P}`,
    marketRate: `por reserva paga no ${P}, deduzida da transferência`,
    example: "Exemplo",
    exampleStay: "Estadia de uma semana",
    exampleCommission: `Comissão ${P}`,
    exampleNet: "Recebe",
    optionsTitle: "Opções",
    optionsLead: "Para acrescentar quando precisar.",
    soon: "Em breve",
    onQuote: "Sob orçamento",
    once: "uma vez",
    recap: "A sua seleção",
    commissionLine: (rate: number) => `${rate} % por reserva`,
    commissionNote: `A comissão só é devida sobre as reservas pagas no ${P}.`,
    total: (yearly: boolean) => `Total ${yearly ? "anual" : "mensal"} sem IVA`,
    perMonthShort: " / mês",
    perYearShort: " / ano",
    yearlyNote: (monthly: string) => `ou seja, ${monthly} por mês`,
    noCommitment: "sem fidelização",
    atOrder: (amount: string) => ` · + ${amount} na encomenda`,
    askQuote: "Pedir um orçamento",
    trust: ["Sem fidelização no plano mensal", "Arranque feito consigo: planta, comparadores, equipa"],
    totalShort: "Total sem IVA",
    questionTitle: "Tem uma pergunta sobre os nossos preços?",
    questionLead: "Experimente a demonstração do Plazo Pro sem conta, ou deixe os seus contactos: ligamos-lhe para analisarmos o seu parque juntos.",
    form: {
      firstName: "Nome próprio",
      lastName: "Apelido",
      parking: "Parque",
      email: "E-mail",
      phone: "Telefone",
      airport: "Aeroporto",
      airportOther: "Outro aeroporto",
      optional: "facultativo",
      sending: "A enviar…",
      sent: "Pedido enviado",
      sentText: "Obrigado: escrevemos-lhe muito em breve com um orçamento para o seu parque.",
      honeypot: "Não preencher este campo",
    },
    footerPitch: "O parque, da chegada ao regresso.",
  },
  contact: {
    title: "Contacte-nos",
    description: `Escreva ao apoio ao cliente do ${P}: uma pergunta sobre uma reserva, um parque ou o site.`,
    lead: (delay: string | null) =>
      `Tem uma pergunta sobre uma reserva, um parque ou o site? Escreva-nos: a nossa equipa responde-lhe por e-mail${delay ? ` em ${delay}` : ""}.`,
    name: "Nome e apelido",
    email: "E-mail",
    emailHint: "Respondemos-lhe para este endereço.",
    reference: "Referência da reserva",
    optional: "facultativo",
    referenceHint: "Encontra-a no seu e-mail de confirmação.",
    message: "A sua mensagem",
    messageHint:
      "Entre 10 e 2 000 caracteres. Nunca escreva os dados do seu cartão bancário.",
    honeypot: "Não preencher este campo",
    submit: "Enviar a mensagem",
    sending: "A enviar…",
    privacy: `A sua mensagem é enviada por e-mail ao apoio ao cliente do ${P}, que lhe responde para o endereço indicado; o ${P} não a guarda para além deste envio.`,
    privacyLink: "Privacidade",
    sentTitle: "Mensagem enviada",
    sentText: (delay: string | null) =>
      `Obrigado, a nossa equipa responde-lhe por e-mail${delay ? ` em ${delay}` : ""}. Não se esqueça de verificar a pasta de spam.`,
    writeAnother: "Escrever outra mensagem",
    phoneTitle: "Por telefone",
    unavailableTitle: "O formulário de contacto chega em breve",
    unavailableText:
      "Entretanto, encontre a sua reserva em « A minha reserva » com a respetiva referência e o seu e-mail, e as respostas às perguntas mais comuns nas nossas perguntas frequentes.",
  },
  newsletter: {
    title: `A newsletter ${P}`,
    text: "Novos aeroportos, novos parques e ofertas da época.",
    placeholder: "O seu e-mail",
    submit: "Subscrever",
    sending: "Um momento…",
    consent: `Ao subscrever, aceita receber a newsletter ${P} por e-mail; o seu endereço serve apenas para isso.`,
    unsubscribe: "Cancelamento da subscrição num clique, em cada newsletter.",
    privacyLink: "Privacidade",
    sent: "Obrigado! Confirme a sua subscrição com a ligação do e-mail que lhe enviamos. Já é subscritor? Não tem nada a fazer.",
    honeypot: "Não preencher este campo",
  },
  letterConfirmed: {
    title: "Subscrição confirmada",
    text: `Obrigado! Vai receber a newsletter ${P} neste endereço: novos aeroportos, novos parques e ofertas da época. Para cancelar a subscrição, basta um clique, a partir de cada newsletter.`,
    home: "Voltar ao início",
  },
  search: {
    airport: "Aeroporto",
    dropOff: "Entrega do carro",
    pickUp: "Regresso (aterragem)",
    dropOffDate: "Data de entrega",
    dropOffTime: "Hora de entrega",
    pickUpDate: "Data de regresso",
    pickUpTime: "Hora de regresso",
    submit: "Pesquisar",
    update: "Atualizar",
    modify: "Alterar a pesquisa",
  },
  picker: {
    yourDates: "As suas datas",
    dropOff: "Entrega",
    pickUp: "Regresso",
    time: "Hora",
    choose: "Escolher",
    dropOffTime: "Hora de entrega",
    pickUpTime: "Hora de regresso",
    hint: "1.º clique: entrega · 2.º clique: regresso",
    pickDropOff: "Escolha a data de entrega",
    pickReturn: "escolha o regresso",
    clear: "Limpar",
    confirm: "Confirmar",
    confirmDates: "Confirmar as datas",
    close: "Fechar",
    prevMonth: "Mês anterior",
    nextMonth: "Mês seguinte",
    moreTimes: "deslize para ver mais horários",
    today: "hoje",
    pill: (label: string, value: string | null) =>
      `${label}: ${value ?? "por escolher"}`,
  },
  home: {
    heroTitle: (airport: string) =>
      `Estacionamento no aeroporto de ${airport}, shuttle incluído`,
    heroTitleShort: "Estacionamento no aeroporto, shuttle incluído",
    photoCredit: "Fotografia: Pexels",
    chips: ["Preço total", "Shuttle gratuito", "Cancelamento claro"],
    heroLead:
      "Compare os parques privados perto do aeroporto, veja o preço total para as suas datas e reserve online.",
    heroFind: "O seu parque no",
    heroNear: (airport: string) => `aeroporto de ${airport}`,
    heroKicker: "Pronto para partir?",
    mapAvailable: (n: number) =>
      n === 0
        ? "Nenhum lugar nestas datas"
        : n === 1
          ? "1 parque disponível"
          : `${n} parques disponíveis`,
    mapDistance: (km: string | null, shuttle: number | null) =>
      [km ? `${km} km` : null, shuttle ? `shuttle ${shuttle} min` : null]
        .filter(Boolean)
        .join(" · "),
    featuredSub: (valet: boolean, shuttle: number | null) =>
      `${valet ? "Valet" : "Estaciona o próprio carro"}${shuttle ? ` · shuttle ${shuttle} min` : ""}`,
    featuredSee: (title: string) => `Ver ${title}`,
    mapShuttles: (n: number) =>
      n === 1 ? "1 shuttle em circulação" : `${n} shuttles em circulação`,
    mapFull: "Lotado nestas datas",
    mapSeeAnyway: "Ver o parque",
    trust: [
      ["Preço total apresentado", "taxas incluídas"],
      ["Shuttle gratuito", "até aos terminais"],
      ["Cancelamento claro", "condições visíveis antes de reservar"],
    ] as [string, string][],
    howTitle: "Como funciona",
    how: [
      [
        "Reserve e pague online",
        "Compare os parques e escolha o seu. Pagamento seguro com cartão: o seu lugar fica garantido para todas as suas datas.",
      ],
      [
        "Entregue o seu carro",
        "Apresente-se na receção do parque: está tudo pago. O shuttle leva-o ao terminal em poucos minutos.",
      ],
      [
        "O shuttle espera por si no regresso",
        "Indique o seu voo de regresso: o parque acompanha a hora de aterragem e avisa-o por SMS.",
      ],
    ] as [string, string][],
    partnersTitle: (airport: string) => `Os parques parceiros em ${airport}`,
    partnersCount: (n: number) =>
      `${n} parque${n > 1 ? "s" : ""}${n < 3 ? " · outros a caminho" : ""}`,
    noPartners: (airport: string) =>
      `Ainda nenhum parque está online em ${airport}. Volte em breve.`,
    from: "desde",
    seeParking: "Ver o parque",
    ownerCallout: "Gere um parque perto do aeroporto?",
    ownerJoin: `Junte-se ao ${P}`,
    ownerPitch: "planeamento, shuttle e reservas online no mesmo sítio.",
    faqTitle: "Perguntas frequentes",
    faqLead: (airport: string) =>
      `As perguntas mais frequentes sobre o estacionamento no aeroporto de ${airport}.`,
    faq: [
      [
        "Quanto tempo antes do meu voo devo chegar ao parque?",
        "Conte com o tempo de shuttle indicado em cada parque (muitas vezes menos de 15 minutos), além do prazo recomendado pela sua companhia aérea.",
      ],
      [
        "Como funciona o regresso?",
        "O parque acompanha o seu voo de regresso. Na aterragem, recebe um SMS com o ponto de encontro do shuttle.",
      ],
      [
        "Como pago?",
        `Com cartão bancário, online, no momento da reserva: pagamento seguro com cartão no ${P}, na página do nosso prestador Stripe. Nunca vemos o seu cartão, e não há nada a pagar no parque.`,
      ],
      [
        "Posso cancelar?",
        "Sim, de acordo com as condições do parque escolhido, apresentadas na sua ficha e relembradas antes de reservar. Um cancelamento gratuito é reembolsado na totalidade no seu cartão no prazo de 5 a 10 dias.",
      ],
    ] as [string, string][],
  },
  guide: {
    onThisPage: "Nesta página",
    updated: (date: string) => `Atualizado a ${date}`,
    searchTitle: "Compare os preços para as suas datas",
    seeAllResults: "Ver todos os parques para estas datas",
    faqTitle: "Perguntas frequentes",
    otherGuides: "Os outros guias",
    airportGuide: (airport: string) =>
      `O guia completo do estacionamento no aeroporto de ${airport}`,
    footerLink: (topic: string, airport: string) => `${topic} em ${airport}`,
  },
  results: {
    available: (n: number) =>
      n === 0
        ? "Nenhum parque disponível"
        : `${n} parque${n > 1 ? "s" : ""} disponíve${n > 1 ? "is" : "l"}`,
    filters: "Filtros",
    services: "Serviços",
    cancellation: "Cancelamento",
    freeCancellation: "Cancelamento gratuito",
    shuttle: "Trajeto de shuttle",
    shuttleMax: (n: number) => `${n} min no máximo`,
    shuttleAny: "Indiferente",
    totalPrice: "Preço total",
    maxPrice: "Preço total máximo",
    upTo: (price: string) => `até ${price}`,
    apply: "Aplicar os filtros",
    clear: "Limpar os filtros",
    sort: "Ordenar",
    sortBy: {
      prix: "Preço",
      navette: "Shuttle mais curto",
      distance: "Distância",
    },
    cheapest: "O mais barato",
    fastestShuttle: "Shuttle mais rápido",
    liveFilter: "Shuttle em direto",
    allIn: (days: number) => `${ptDays(days)}, tudo incluído`,
    nightFeesIncluded: "Preços totais para as suas datas, taxas noturnas incluídas.",
    live: "Em direto",
    liveTitle:
      "Shuttle acompanhado em direto: vai vê-lo chegar na sua reserva.",
    seeAndBook: "Ver e reservar",
    full: "Lotado nestas datas",
    fullHint: "Experimente outras datas",
    noPrice: "Sem tarifa para esta duração",
    noPriceHint: "Experimente uma estadia mais curta",
    footnote:
      "Preços totais para as suas datas, taxas incluídas, pagos online com cartão. O dia de chegada e o dia de regresso contam cada um como um dia.",
    noneTitle: "Nenhum parque para estas datas",
    noneText:
      "Nenhum parque parceiro tem lugar para toda a sua estadia. Experimente outras datas.",
    noMatchTitle: "Nenhum parque corresponde aos seus filtros",
    noMatchText: "Alargue os seus critérios para ver mais parques.",
    datesTitle: "Indique as suas datas",
    datesText:
      "Escolha as datas de entrega e de regresso para ver os parques disponíveis e o respetivo preço total.",
  },
  highlights: {
    perDay: (price: string) => `${price}/dia`,
    newOnPlatform: `Novo no ${P}`,
    bandLabel: "O essencial",
    evChip: "Carregamento",
    cancelChip: {
      untilArrival: "Grátis até à chegada",
      h24: "Grátis 24 h",
      h48: "Grátis 48 h",
      nonRefundable: "Não reembolsável",
    },
    chips: {
      outdoor: "Exterior",
      covered: "Coberto",
      keysValet: "Tem de entregar as chaves",
      keysValetShort: "Chaves a entregar",
      keysSelf: "Fica com as suas chaves",
      keysSelfShort: "Chaves consigo",
      open24h: "Aberto 24h/24",
      open24hShort: "24h/24",
      openHours: (hours: string) => `Aberto ${hours}`,
    },
    shuttleBox: {
      title: "Shuttle gratuito",
      ride: "Trajeto",
      wait: "Espera méd.",
      waitShort: "Espera",
      waitFull: "Espera média",
      minutes: (min: number) => `${min} min`,
      live: "Shuttle em direto",
      dayJ: "Acompanhado em direto no próprio dia",
      parking: "Parque",
      terminal1: "Terminal 1",
      airport: "Aeroporto",
      destination: (place: string, min: number | null) =>
        min ? `${place} · ${min} min` : place,
      rail: (
        place: "terminal1" | "airport",
        running: number | null,
        placed: number,
      ) => {
        const to = place === "terminal1" ? "ao Terminal 1" : "ao aeroporto";
        if (running === null) return `Trajeto do parque ${to}`;
        if (running === 0)
          return `Trajeto do parque ${to}, nenhum shuttle a caminho neste momento`;
        const s = running > 1 ? "s" : "";
        const road = `${running} shuttle${s} a caminho entre o parque e ${place === "terminal1" ? "o Terminal 1" : "o aeroporto"}`;
        return placed === 0
          ? `${road}, ainda não colocado${s} no trajeto`
          : road;
      },
    },
    kmFromTerminals: (km: string) => `A ${km} km dos terminais`,
    tiles: {
      shuttleLive: "Shuttle em direto",
      shuttleFree: "Shuttle gratuito",
      free: "gratuito",
      ride: (min: number) => `trajeto ${min} min`,
      wait: (min: number) => `espera média ${min} min`,
      followLive: "acompanhe-o no mapa no próprio dia",
      toTerminal1: "para o Terminal 1",
      toAirport: "para o aeroporto",
      outdoor: "Exterior",
      outdoorText: "Parque ao ar livre",
      covered: "Coberto",
      coveredText: "Parque coberto",
      fenced: "vedado",
      cctv: "videovigilância",
      keysValet: "Tem de entregar as chaves",
      keysValetText: "Um valet estaciona o seu carro",
      keysSelf: "Fica com as suas chaves",
      keysSelfText: "Estaciona o próprio carro",
      open24h: "Aberto 24h/24",
      open24hText: "Entrega e regresso a qualquer hora",
      openHours: (hours: string) => `Aberto ${hours}`,
      openHoursText: "Entrega e regresso dentro deste horário",
      freeCancellation: "Cancelamento gratuito",
      cancellationText: {
        free_until_arrival: "até à chegada",
        free_24h: "até 24 h antes",
        free_48h: "até 48 h antes",
      } as Record<string, string>,
      nonRefundable: "Não reembolsável",
      nonRefundableText: "nenhum reembolso em caso de cancelamento",
    },
  },
  map: {
    show: "Mostrar o mapa",
    hide: "Ocultar o mapa",
    title: "Mapa dos parques",
    terminals: "Terminais",
    noPosition: "Localização não indicada",
    full: "Lotado",
    noPrice: "Sem tarifa",
    loading: "A carregar o mapa…",
    failed: "Não foi possível mostrar o mapa.",
    attribution: "© IGN – Plan IGN",
    marker: (title: string, state: string) => `${title}, ${state}`,
    markerLive: (title: string, state: string) =>
      `${title}, ${state}, shuttle acompanhado em direto`,
    shuttle: (parking: string, direction: "pickup" | "dropoff") =>
      `Shuttle de ${parking} · ${direction === "dropoff" ? "para o terminal" : "para o aeroporto"}`,
    shuttleAge: (seconds: number) =>
      seconds < 60
        ? `localização há ${seconds} s`
        : `localização há ${Math.round(seconds / 60)} min`,
    controls: {
      "Map.Title": "Mapa",
      "NavigationControl.ZoomIn": "Aproximar",
      "NavigationControl.ZoomOut": "Afastar",
      "AttributionControl.ToggleAttribution": "Mostrar os créditos",
      "CooperativeGesturesHandler.WindowsHelpText":
        "Use Ctrl + roda do rato para fazer zoom no mapa",
      "CooperativeGesturesHandler.MacHelpText":
        "Use ⌘ + roda do rato para fazer zoom no mapa",
      "CooperativeGesturesHandler.MobileHelpText":
        "Use dois dedos para mover o mapa",
    },
    notDrawn: (n: number) =>
      n === 1
        ? "1 parque não tem localização no mapa."
        : `${n} parques não têm localização no mapa.`,
  },
  parking: {
    itinerary: "Itinerário",
    kmFromTerminals: (km: string) => `${km} km dos terminais`,
    shuttle: "Shuttle",
    hours: "Horário",
    parkingType: "Estacionamento",
    fenced: "vedado",
    cancellation: "Cancelamento",
    presentation: "Apresentação",
    howItGoes: "Como funciona",
    outbound: "Na ida",
    outboundText: (min: number | null) =>
      `Apresente-se na receção do parque com a sua matrícula. Deixa o carro e o shuttle leva-o ao terminal${min ? ` em ${min} minutos` : ""}.`,
    inbound: "No regresso",
    inboundText:
      "Indique o número do seu voo: o parque acompanha a sua aterragem. Recebe um SMS com o ponto de encontro do shuttle.",
    access: "Acesso",
    openInMaps: "Abrir no Google Maps",
    addressUnknown: "Morada comunicada na reserva.",
    forStay: (days: number) => `por ${ptDays(days)}, tudo incluído`,
    from: "desde",
    dropOff: "Entrega",
    pickUp: "Regresso",
    availableForDates: "Lugar disponível para as suas datas",
    fullForDates: "Lotado nestas datas",
    noPriceForDates: "Sem tarifa para esta duração",
    packageLine: (days: number) => `Pacote de ${ptDays(days)}`,
    nightFee: "Taxa noturna",
    nightFeeDropOff: "entrega às",
    nightFeeReturn: "regresso às",
    nightFeeAnd: "e",
    nightRule: (fees: string, start: string, end: string) =>
      `Este parque acrescenta ${fees} entre as ${start} e as ${end}.`,
    nightRuleSame: (amount: string) => `${amount} por uma entrega ou um regresso`,
    nightRuleEach: (dropOff: string, pickUp: string) =>
      `${dropOff} por uma entrega e ${pickUp} por um regresso`,
    nightRuleDropOff: (amount: string) => `${amount} por uma entrega`,
    nightRuleReturn: (amount: string) => `${amount} por um regresso`,
    serviceFee: "Taxa de serviço",
    total: "Total",
    payOnSite: "Total a pagar online",
    book: "Reservar",
    onlineSoon: "Reserva online disponível em breve",
    onlineSoonHint:
      "Este parque ainda não aceita reservas no site.",
    checkDates: "Ver o preço",
    askDates: "Indique as suas datas para ver o preço total e a disponibilidade.",
    otherParkings: "Ver os outros parques",
  },
  booking: {
    back: "Voltar ao parque",
    title: "Concluir a reserva",
    yourDetails: "Os seus dados",
    firstName: "Nome próprio",
    lastName: "Apelido",
    phone: "Telemóvel (para o SMS do shuttle)",
    email: "E-mail (confirmação)",
    plate: "Matrícula",
    plateHint: "Matrícula francesa ou estrangeira.",
    flight: "Voo de regresso (recomendado)",
    flightHint: "Ex. TO 3627: o shuttle acompanha a sua aterragem.",
    outboundFlight: "Voo de ida (facultativo)",
    outboundFlightHint:
      "Ex. AF 7641: o shuttle para o terminal é programado antes da sua descolagem.",
    passengers: "Passageiros",
    vehicleTitle: "Para o reconhecermos (facultativo)",
    vehicleModel: "Modelo do veículo",
    vehicleModelHint: "Ex. Peugeot 308",
    vehicleColour: "Cor",
    vehicleColourHint: "Ex. cinzento",
    message: "Uma palavra para o parque",
    messageHint:
      "Carrinho de bebé, chegada tardia… O parque lê-a antes da sua vinda.",
    childSeats: {
      title: "Crianças a bordo?",
      subtitle: "O parque prepara as cadeiras no shuttle",
      switchLabel: "Pedir cadeiras auto",
      hint: "As crianças contam como passageiros. Cadeiras emprestadas na ida e no regresso, gratuitamente.",
      kinds: {
        infant: {
          label: "Bebé · até 12 meses",
          hint: "Cadeira virada para trás",
          fewer: "Menos um bebé",
          more: "Mais um bebé",
          count: (n: number) => `${n} ${n > 1 ? "bebés" : "bebé"}`,
        },
        toddler: {
          label: "1 a 4 anos",
          hint: "Cadeira de criança",
          fewer: "Menos uma criança de 1 a 4 anos",
          more: "Mais uma criança de 1 a 4 anos",
          count: (n: number) =>
            `${n} ${n > 1 ? "crianças" : "criança"} de 1 a 4 anos`,
        },
        booster: {
          label: "4 a 10 anos",
          hint: "Assento elevatório",
          fewer: "Menos uma criança de 4 a 10 anos",
          more: "Mais uma criança de 4 a 10 anos",
          count: (n: number) =>
            `${n} ${n > 1 ? "crianças" : "criança"} de 4 a 10 anos`,
        },
      },
    },
    termsBefore: "Aceito as ",
    termsLink: `condições do ${P}`,
    termsAfter:
      " e as do parque. Os meus dados servem apenas para esta estadia.",
    submit: "Continuar para o pagamento",
    submitting: "Um momento…",
    steps: "Etapas da reserva",
    stepDetails: "1 · Os seus dados",
    stepPayment: "2 · Pagamento",
    currentStep: "(etapa atual)",
    paymentNext: (total: string) =>
      `Pagamento seguro com cartão na etapa seguinte: ${total}.`,
    noAccount:
      "Não é preciso criar conta: recebe a confirmação por e-mail e por SMS.",
    summaryDropOff: "Entrega",
    summaryPickUp: "Regresso",
    modify: "Alterar",
    totalOnSite: "Total",
    fixErrors: "Alguns campos têm de ser corrigidos.",
    unavailableTitle: "Este parque já não está disponível para as suas datas",
    fullNights: (nights: string) =>
      `Noites lotadas: ${nights}${nights.endsWith(".") ? "" : "."}`,
    seeOtherParkings: "Ver os outros parques",
    changeDates: "Mudar de datas",
  },
  pay: {
    title: "Pagamento",
    recap: "Resumo",
    modify: "Alterar",
    total: "Total",
    days: (n: number) => ptDays(n),
    holdLeft: (time: string) => `O seu lugar está reservado durante ${time}`,
    button: (total: string) => `Pagar ${total}`,
    redirecting: "A redirecionar…",
    redirectNote:
      "Vai ser redirecionado para a página de pagamento seguro da Stripe.",
    passengers: (n: number) => `${n} passageiro${n > 1 ? "s" : ""}`,
    expiredTitle: "O prazo expirou",
    expiredText:
      "O seu lugar já não está reservado e nada foi debitado. Pode recomeçar: os seus dados ficam guardados.",
    restart: "Recomeçar a reserva",
    verifyingTitle: "Pagamento em verificação…",
    verifyingText:
      "Demora alguns segundos. Esta página atualiza-se sozinha.",
    refresh: "Atualizar",
  },
  manage: {
    title: "A minha reserva",
    lookupLead:
      "Sem conta: basta a ligação do seu SMS ou do seu e-mail. Caso contrário, introduza o número recebido do Plazo ou do site onde reservou.",
    reference: "Número da reserva",
    referenceHint: "Plazo, Allopark, Onepark, ParkVia…",
    contact: "E-mail ou telefone",
    email: "E-mail",
    find: "Encontrar a minha reserva",
    finding: "A procurar…",
    confirmedTitle: (name: string) =>
      name ? `Está reservado, ${name}!` : "Está reservado!",
    confirmedText: (email: string | null, phone: string | null) =>
      email && phone
        ? `A sua confirmação é enviada para ${email} e por SMS para o ${phone}.`
        : email
          ? `A sua confirmação é enviada para ${email}.`
          : phone
            ? `A sua confirmação é enviada por SMS para o ${phone}.`
            : "Guarde bem a sua referência.",
    dropOff: "Entrega",
    pickUp: "Regresso",
    flight: "Voo de regresso",
    outbound: "Voo de ida",
    outboundShuttle: (time: string) =>
      `shuttle para o terminal previsto por volta das ${time}`,
    outboundStatus: {
      scheduled: "à hora",
      delayed: "atrasado",
      departed: "partiu",
      landed: "partiu",
      cancelled: "cancelado",
      diverted: "desviado",
      unknown: "voo não encontrado",
    } as Record<string, string>,
    noFlight: "Não indicado",
    vehicle: "Veículo",
    vehicleDetails: (model: string | null, colour: string | null) =>
      [model, colour].filter(Boolean).join(" · "),
    message: "A sua palavra para o parque",
    passengers: "Passageiros",
    toPayOnSite: "Pago",
    nothingToPay: "Nada a pagar",
    paid: "Pago",
    refunded: "Reembolsado",
    stayPrice: "Preço da estadia",
    nightFeeIncluded: (amount: string) => `dos quais ${amount} de taxa noturna`,
    freeUntil: (when: string) => `Cancelamento gratuito até ${when}`,
    nonRefundable: "Não cancelável online",
    dayTitle: "No dia da partida",
    conditionsTitle: "A saber",
    step1Title: "Dirija-se ao parque",
    step1Text: (address: string | null, min: number | null) =>
      `${address ? `${address}. ` : ""}Conte com ${min ? `${min} min de shuttle` : "o trajeto de shuttle"} antes da hora recomendada pela sua companhia aérea.`,
    step2Title: "Indique a sua referência ou a sua matrícula",
    step2Text: (_total?: string | null) =>
      "A receção está à sua espera: está tudo pago, deixa o carro e o shuttle leva-o ao terminal.",
    step3Title: "No regresso, acompanhamos o seu voo",
    step3Text: (flight: string | null) =>
      flight
        ? `Assim que o ${flight} aterrar, recebe um SMS com o ponto de encontro do shuttle.`
        : "Indique abaixo o seu voo de regresso: na aterragem, recebe um SMS com o ponto de encontro do shuttle.",
    itinerary: "Itinerário até ao parque",
    addToCalendar: "Adicionar ao calendário",
    manageLink: "Gerir a minha reserva",
    flightTitle: "Os seus voos",
    flightLabel: "Voo de regresso",
    outboundLabel: "Voo de ida",
    flightSave: "Guardar",
    flightEdit: "Alterar",
    flightSaving: "A guardar…",
    flightHelp:
      "Altere-o se o seu voo mudar: o shuttle acompanha o novo. Deixe em branco para o apagar.",
    flightSaved: "Voos guardados.",
    flightLocked: "O voo de regresso já não pode ser alterado online.",
    childSeats: {
      title: "Cadeiras auto",
      none: "Nenhuma cadeira pedida",
      inShuttle:
        "Instaladas no shuttle, na ida e no regresso. Gratuito.",
      edit: "Alterar",
      save: "Guardar",
      saving: "A guardar…",
      cancel: "Cancelar",
      saved: "Cadeiras auto guardadas.",
      locked:
        "As cadeiras auto já não podem ser alteradas online: informe o parque.",
    },
    invoices: {
      title: "Fatura",
      invoice: (n: string) => `Fatura ${n}`,
      creditNote: (n: string) => `Nota de crédito ${n}`,
      issued: (amount: string, date: string, issuer: string) => `${amount} · emitida a ${date} por ${issuer}`,
      creditedBy: (n: string) => `Anulada pela nota de crédito ${n}`,
      creditOf: (n: string) => `Anula a fatura ${n}`,
      download: "Descarregar o PDF",
      downloading: "A descarregar…",
      none: "Ainda não há fatura para esta estadia.",
      company: "Empresa (facultativo)",
      address: "Morada de faturação (facultativo)",
      request: "Pedir a fatura",
      requesting: "A enviar…",
      requested: (date: string) => `Pedida a ${date}. O parque envia-lha aqui e por e-mail.`,
      requestedPill: "Pedida",
      noPrice: "O parque ainda não tem o preço desta estadia: peça-lhe a fatura diretamente.",
      errors: {
        too_long: "Este texto é demasiado longo.",
        already_requested: "A fatura já foi pedida.",
        invoice_exists: "A fatura já está disponível: recarregue a página.",
        network: "Sem ligação. Tente novamente.",
        unknown: "Não foi possível enviar o pedido. Tente novamente.",
      } as Record<string, string>,
    },
    cancelTitle: "Cancelar",
    cancelText: (until: string) =>
      `Gratuito até ${until}: reembolso total no seu cartão no prazo de 5 a 10 dias.`,
    cancelButton: "Cancelar a minha reserva",
    cancelConfirm: "Confirmar o cancelamento",
    cancelConfirmText:
      "O seu lugar será libertado e o pagamento reembolsado na totalidade. Esta ação é definitiva.",
    cancelKeep: "Manter a minha reserva",
    cancelling: "A cancelar…",
    cancelled: "Esta reserva está cancelada.",
    cancelledRefunded:
      "Esta reserva está cancelada. Reembolso total no seu cartão no prazo de 5 a 10 dias.",
    cancelledNow:
      "A sua reserva foi cancelada. Reembolso total no seu cartão no prazo de 5 a 10 dias. Ser-lhe-á enviado um e-mail de confirmação.",
    cancelClosed: (until: string) =>
      `O prazo de cancelamento online já passou (${until}).`,
    cancelNonRefundable: "Esta reserva não pode ser cancelada online.",
    contactParkingPhone: "Contacte o parque através do",
    contactParkingDesk: "Dirija-se à receção do parque.",
    dayQuestion: (parking: string) => `Uma pergunta no próprio dia? ${parking}:`,
    changeDates: (until: string) =>
      `Para mudar as datas, cancele e volte a reservar (gratuito antes de ${until}).`,
    notFoundTitle: "Reserva não encontrada",
    notFoundText:
      "Esta ligação não é válida ou expirou. Introduza a sua referência e o seu e-mail para encontrar a sua reserva.",
    or: "depois",
  },
  appLink: {
    title: (reference: string) =>
      `A sua reserva ${reference} espera por si na aplicação`,
    lead: (parking: string) =>
      `${parking}. Instale a aplicação: abrirá na sua reserva. Shuttle em direto, encontrar o meu carro, fotografias da vistoria.`,
    install: "Instalar a aplicação",
    alreadyInstalled: "Já tenho a aplicação",
    continueWeb: "Continuar no site",
    iosSoon:
      "Em breve na App Store: entretanto, a sua reserva está no site.",
    playBadge: "Disponível no Google Play",
    appStoreBadge: "Descarregar na App Store",
    invalidTitle: "Ligação desconhecida ou expirada",
    invalidText:
      "Esta ligação já não leva a uma reserva. Encontre a sua com a respetiva referência e o seu e-mail.",
  },
  live: {
    live: "Em direto",
    ago: (seconds: number) =>
      seconds < 60
        ? `há ${seconds} s`
        : `há ${Math.floor(seconds / 60)} min`,
    title: (flight: string | null) =>
      flight ? `Voo ${flight}` : "O seu regresso",
    landsIn: "aterra dentro de",
    anyMinute: "iminente",
    planned: (time: string) => `previsto ${time}`,
    plannedLate: (time: string, late: number) =>
      `previsto ${time} · atraso +${late} min`,
    landed: "aterrou às",
    goMeeting: "dirija-se ao ponto de encontro",
    waitingShuttle: "o motorista vem buscá-lo",
    cancelled: "voo cancelado",
    cancelledHelp: "Ligue para o parque para combinar um novo encontro.",
    shuttleIn: "shuttle dentro de",
    shuttleWaiting: "à espera da sua localização",
    shuttleAway: (distance: string) => `a ${distance} de si`,
    stepLanding: "Aterragem",
    stepMeeting: "Encontro",
    stepShuttle: "Shuttle",
    meetingPoint: (label: string) => `Ponto de encontro: ${label}`,
    meetingDefault: "ponto de encontro do shuttle",
    shuttleLine: (driver: string, vehicle: string | null) =>
      [driver ? `Motorista: ${driver}` : null, vehicle]
        .filter(Boolean)
        .join(" · "),
    position: "Localização",
    carTitle: "Encontrar o meu carro",
    carSpot: (code: string) => `Lugar ${code}`,
    carFile: (code: string) => `Fila ${code}`,
    carFilePosition: (position: number) =>
      `${position}.º a partir do corredor`,
    carZone: {
      short: "zona de estadias curtas",
      medium: "zona de estadias médias",
      long: "zona de estadias longas",
    } as Record<string, string>,
    carKeys: "As chaves esperam por si na receção do parque.",
    carRoute: "Itinerário a pé até ao parque",
    carRouteToCar: "Itinerário a pé até ao meu carro",
    carPosition: (
      by: "traveller" | "staff",
      time: string,
      accuracy: number | null,
    ) =>
      `Localização GPS ${by === "staff" ? "registada pelo parque" : "que registou"} às ${time}${accuracy !== null ? ` (± ${accuracy} m)` : ""}.`,
    carNoSpot: "O seu carro",
    offline: "De momento, não é possível ler o estado do regresso.",
    landedButton: "Já aterrei",
    landedHelp:
      "Sem acompanhamento do seu voo, diga-nos quando aterrou: o parque prepara o shuttle.",
    instructions: "Instruções do parque",
    photoAlt: "Fotografia do ponto de encontro",
    routeToMeeting: "Itinerário até ao ponto de encontro",
    noticeTitle: "Algum problema? Avise o parque",
    noticeHelp: "O motorista e a receção veem-no de imediato na sua lista.",
    noticeFlightDelayed: "O meu voo está atrasado",
    noticeLuggage: "Bagagem perdida ou atrasada",
    noticeOther: "Outro…",
    noticeOtherPlaceholder: "Diga-nos em poucas palavras (200 caracteres)",
    noticeSend: "Enviar",
    noticeSending: "A enviar…",
    noticeKinds: {
      flight_delayed: "O meu voo está atrasado",
      luggage: "Bagagem perdida ou atrasada",
      other: "A sua mensagem",
    } as Record<string, string>,
    noticed: (label: string, time: string) =>
      `Transmitido ao parque às ${time}: ${label}.`,
    noticeAgain: "Assinalar outra coisa",
  },
  arrival: {
    title: "Avisar da minha chegada",
    notYetOutbound: (when: string) =>
      `No dia da entrega, a partir de ${when}, poderá avisar o parque da sua chegada.`,
    notYetReturn: (when: string) =>
      `No regresso, a partir de ${when}, poderá dizer ao motorista que está no ponto de encontro.`,
    explainTitle: "Avise o parque da sua chegada",
    explainBefore:
      "O valet espera por si na receção. A sua localização é partilhada com o parque ",
    explainOnly: "apenas",
    explainAfter: " até à sua chegada (2 h no máximo) e depois apagada.",
    share: "Estou a caminho — partilhar a minha localização",
    sharing: "Partilha em curso…",
    announceToggle: "Avisar sem partilhar a minha localização",
    announceIn: (minutes: number) => `Chego dentro de ${minutes} min`,
    returnAnnounceIn: (minutes: number) => `Estou lá dentro de ${minutes} min`,
    stopAnytime: "Pode parar a partilha a qualquer momento.",
    live: "Localização partilhada com o parque",
    etaLabel: "Chegada estimada",
    etaMinutes: (minutes: number) => `${minutes} min`,
    etaUnknown: "—",
    arrivalAround: (time: string) => `chegada por volta das ${time}`,
    waitingPosition: "A procurar a sua localização…",
    notified: "O parque foi avisado · o valet espera por si na receção",
    notifiedReturn: "O motorista foi avisado",
    autoStop: (left: string) =>
      `Paragem automática à chegada, ou dentro de ${left}`,
    stop: "Parar a partilha",
    arrivedTitle: "Chegou",
    arrivedText:
      "A partilha parou e a sua localização foi apagada. O valet espera por si na receção.",
    announcedText: (minutes: number, time: string) =>
      `O parque foi avisado: chega dentro de ${minutes} min${time ? ` (por volta das ${time})` : ""}.`,
    announcedReturnText: (minutes: number, time: string) =>
      `O motorista foi avisado: estará no ponto de encontro dentro de ${minutes} min${time ? ` (por volta das ${time})` : ""}.`,
    cancelAnnounce: "Cancelar",
    endedExpired:
      "A partilha parou ao fim de 2 h e a sua localização foi apagada.",
    endedStopped: "Partilha parada. A sua localização foi apagada.",
    meetingReception: "Receção",
    meetingReturn: "Ponto de encontro",
    returnExplainTitle: "Avise o motorista",
    returnExplain: (meeting: string) =>
      `Depois de recolher a sua bagagem, dirija-se ao ponto de encontro: ${meeting}. O motorista do shuttle vê a sua mensagem na lista dele.`,
    atPoint: "Estou no ponto de encontro",
    withPosition: "Juntar a minha localização (uma só vez, para situar o ponto)",
    atPointDoneTitle: "O motorista sabe que está lá",
    atPointDoneText: (meeting: string) =>
      `Fique no ponto de encontro: ${meeting}. O shuttle está a chegar.`,
    noteLabel: "Uma palavra para o parque (facultativo)",
    notePlaceholder: "Ex. 2 crianças, carrinho de bebé",
    noteSent: (note: string) => `A sua palavra: « ${note} »`,
    locationDenied:
      "Sem acesso à sua localização, pode avisar o parque sem a partilhar.",
    locationUnavailable:
      "O seu navegador não dá acesso à sua localização: avise sem a partilhar.",
    errors: {
      arrival_window_closed:
        "Ainda não é o momento, ou já passou: a página vai atualizar-se.",
      not_sharing: "A partilha já não está ativa.",
      consent_required:
        "É necessário o seu consentimento para partilhar a sua localização.",
    } as Record<string, string>,
  },
  stayShuttles: {
    title: "Shuttle",
    titleLive: (n: number) => `Shuttle · ${n} a caminho`,
    mine: "O seu shuttle",
    vehicle: (colour: string | null) =>
      colour ? `Shuttle ${colour}` : "Shuttle",
    driver: (name: string) => `motorista: ${name}`,
    noPosition: "localização pendente",
    etaParking: (minutes: number) => `a ${minutes} min do parque`,
    etaMeeting: (minutes: number) => `a ${minutes} min do ponto de encontro`,
    direction: {
      pickup: "vai buscar viajantes ao aeroporto",
      dropoff: "leva viajantes ao terminal",
    } as Record<string, string>,
    none: {
      arrival:
        "Nenhum shuttle a caminho de momento: à sua chegada, a equipa leva-o ao terminal.",
      stay: "Nenhum shuttle a caminho de momento.",
      return:
        "Nenhum shuttle a caminho de momento: na aterragem, avise o parque a partir desta página.",
    } as Record<string, string>,
  },
  status: {
    pending_payment: "A aguardar pagamento",
    upcoming: "Confirmada",
    arrived: "Em curso",
    shuttled_out: "Em curso",
    return_requested: "Em curso",
    back_at_parking: "Em curso",
    returned: "Concluída",
    cancelled: "Cancelada",
    no_show: "Não comparência",
  } satisfies Record<BookingStatus, string>,
  services: {
    shuttle: "Shuttle gratuito",
    valet: "Valet",
    covered: "Coberto",
    ev_charging: "Carregamento elétrico",
    open_24h: "Aberto 24h/24",
    fenced: "Vedado",
    cctv: "Videovigilância",
  } satisfies Record<Service, string>,
  servicesShort: {
    shuttle: "Shuttle",
    valet: "Valet",
    covered: "Coberto",
    ev_charging: "Carregamento elétrico",
    open_24h: "24h/24",
    fenced: "Vedado",
    cctv: "Videovigilância",
  } satisfies Record<Service, string>,
  cancellation: {
    free_until_arrival: "Cancelamento gratuito até à chegada",
    free_24h: "Cancelamento gratuito até 24 h antes",
    free_48h: "Cancelamento gratuito até 48 h antes",
    non_refundable: "Não cancelável",
  } satisfies Record<CancellationPolicy, string>,
  cancellationShort: {
    free_until_arrival: "Gratuito até à chegada",
    free_24h: "Gratuito 24 h antes",
    free_48h: "Gratuito 48 h antes",
    non_refundable: "Não cancelável",
  } satisfies Record<CancellationPolicy, string>,
  calendar: {
    dropOff: (parking: string) => `Entrega do carro · ${parking}`,
    pickUp: (parking: string) => `Regresso · shuttle ${parking}`,
    description: (reference: string, total: string | null, manageUrl: string) =>
      `Reserva ${reference}. ${total ? `${total} pagos online. ` : "Paga online. "}Gerir a reserva: ${manageUrl}`,
  },
  legal: {
    version: (date: string) => `Versão de ${date}`,
    contents: "Índice",
    terms: "Condições gerais",
    privacy: "Política de privacidade",
    legalNotice: "Informações legais",
  },
  notFound: {
    title: "Página não encontrada",
    text: "Esta página não existe ou já não está online.",
    home: "Voltar ao início",
  },
  error: {
    title: "O serviço não responde",
    text: "Não foi possível carregar esta página. Tente novamente dentro de instantes.",
    retry: "Tentar novamente",
    home: "Voltar ao início",
  },
  errors: {
    required: "Campo obrigatório.",
    too_long: "Texto demasiado longo.",
    invalid_email: "Endereço de e-mail inválido.",
    integer: "É esperado um número inteiro.",
    invalid_datetime: "Data ou hora inválida.",
    return_before_arrival: "O regresso deve ser depois da entrega.",
    arrival_in_past: "A data de entrega já passou.",
    stay_too_long: "Estadia superior a 90 dias.",
    passengers_range: "Entre 1 e 9 passageiros.",
    invalid_phone: "Número de telefone inválido.",
    invalid_plate: "Matrícula inválida.",
    invalid_flight: "Número de voo inválido (ex. TO 3627).",
    terms_required: "Aceite as condições para reservar.",
    invalid_name: "Apenas letras, espaços, apóstrofos e hífenes.",
    duplicate_booking:
      "Este veículo já tem uma reserva nestas datas. Encontre-a em « A minha reserva ».",
    too_many_bookings:
      "Já tem várias reservas em curso com estes dados. Gira-as em « A minha reserva ».",
    invalid_idempotency_key:
      "O formulário expirou. Recarregue a página e tente novamente.",
    invalid_slug: "Endereço inválido.",
    unknown_airport: "Aeroporto desconhecido.",
    validation_failed: "Alguns campos têm de ser corrigidos.",
    overbooked:
      "Este parque está lotado em pelo menos uma noite da sua estadia.",
    no_price: "Este parque não tem tarifa para a duração da sua estadia.",
    not_found: "Não encontrado.",
    lookup_not_found:
      "Nenhuma reserva corresponde a este número com este e-mail ou telefone.",
    flight_locked: "O voo de regresso já não pode ser alterado online.",
    child_seats_exceed_passengers:
      "As crianças contam como passageiros: acrescente-as ao número de passageiros.",
    child_seats_range: "Entre 0 e 4 cadeiras de cada tipo.",
    child_seats_locked:
      "As cadeiras auto já não podem ser alteradas online: informe o parque.",
    cancellation_closed:
      "Esta reserva já não pode ser cancelada online.",
    online_booking_unavailable:
      "Este parque ainda não aceita reservas online.",
    hold_expired:
      "O prazo de pagamento expirou: o seu lugar já não está reservado.",
    already_paid:
      "O pagamento já foi efetuado: a sua reserva está confirmada.",
    refund_failed:
      "Não foi possível iniciar o reembolso. Tente novamente dentro de instantes; a sua reserva não foi cancelada.",
    payments_unavailable:
      "O pagamento online está temporariamente indisponível. Tente novamente dentro de instantes.",
    too_many_requests: "Demasiadas tentativas. Tente novamente dentro de alguns minutos.",
    rate_limited: "Demasiadas tentativas. Tente novamente dentro de alguns minutos.",
    invalid: "Valor inválido.",
    too_short: "Texto demasiado curto.",
    message_too_short: "Pelo menos 10 caracteres.",
    message_too_long: "No máximo 2 000 caracteres.",
    consent_required: "É necessário o seu consentimento para receber a newsletter.",
    contact_unavailable:
      "O formulário de contacto ainda não está disponível. Encontre a sua reserva em « A minha reserva ».",
    contact_failed:
      "Não foi possível enviar a sua mensagem. Tente novamente dentro de instantes.",
    newsletter_unavailable:
      "A subscrição da newsletter ainda não está disponível. Volte em breve.",
    newsletter_failed:
      "Não foi possível concluir a subscrição. Tente novamente dentro de instantes.",
    too_many_attempts: "Demasiadas tentativas. Tente novamente dentro de 15 minutos.",
    network: "O serviço não responde. Verifique a sua ligação e tente novamente.",
    server_error:
      "Ocorreu um erro do nosso lado. Tente novamente dentro de instantes.",
    unknown: "Ocorreu um erro. Tente novamente.",
  } as Record<string, string>,
};
