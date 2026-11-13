import type { Dict } from "../../fr-dict";
import { PRODUCT_NAME } from "../../product";
import type { BookingStatus, CancellationPolicy, Service } from "../../types";

const P = PRODUCT_NAME;

const esDays = (days: number) => `${days} día${days > 1 ? "s" : ""}`;

/** Spanish (Spain) texts of the site. Same keys and shapes as the French reference. */
export const es: Dict = {
  dates: {
    weekdays: ["dom.", "lun.", "mar.", "mié.", "jue.", "vie.", "sáb."],
    months: ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sept.", "oct.", "nov.", "dic."],
    longMonths: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    /** "dom. 4 oct." */
    day: (weekday: string, day: number, month: string) => `${weekday} ${day} ${month}`,
    /** "9 de octubre de 2026" */
    longDate: (day: number, month: string, year: number) => `${day} de ${month} de ${year}`,
    /** "sáb. 3 oct. a las 06:30" */
    at: (day: string, time: string) => `${day} a las ${time}`,
    days: esDays,
  },
  money: {
    decimal: ",",
    group: ".",
    symbolFirst: false,
  },
  units: {
    oneDay: "por un día",
    forDays: (days: string) => `por ${days}`,
  },
  meta: {
    defaultTitle: `${P} · Parkings de aeropuerto con lanzadera`,
    defaultDescription:
      "Compare los parkings privados con lanzadera cerca del aeropuerto, vea el precio total para sus fechas y reserve en línea. Pago seguro con tarjeta.",
    airportTitle: (airport: string) =>
      `Parking aeropuerto ${airport} con lanzadera`,
    airportDescription: (airport: string) =>
      `Parkings privados en el aeropuerto de ${airport} con lanzadera gratuita a las terminales: precio total para sus fechas, reserva y pago en línea.`,
    resultsTitle: (airport: string) => `Parkings disponibles en ${airport}`,
    parkingTitle: (parking: string, airport: string) =>
      `${parking} · parking aeropuerto ${airport}`,
    parkingDescription: (parking: string, airport: string) =>
      `${parking}, parking con lanzadera al aeropuerto de ${airport}: tarifas, servicios, acceso y reserva en línea.`,
    bookingTitle: "Finalizar la reserva",
    manageTitle: "Mi reserva",
    notFoundTitle: "Página no encontrada",
  },
  a11y: {
    skipToContent: "Ir al contenido",
    mainNav: "Navegación principal",
    breadcrumb: "Ruta de navegación",
    photoPlaceholder: "Fotos del parking próximamente",
    photoSoon: "Fotos próximamente",
    photoOf: (title: string, n: number) => `${title}, foto ${n}`,
    opensNewTab: "(nueva pestaña)",
  },
  demo: {
    badge: "Demo",
    hint: "Parking ficticio, presentado a modo de demostración",
  },
  nav: {
    airports: "Aeropuertos",
    myBooking: "Mi reserva",
    forOperators: "¿Gestiona un parking?",
    home: "Inicio",
    results: "Resultados",
  },
  footer: {
    pitch:
      "Los parkings de aeropuerto con lanzadera, comparados y reservados en línea. Precio total a la vista.",
    airports: "Aeropuertos",
    moreAirports: "Próximamente más aeropuertos",
    travellers: "Viajeros",
    faq: "Preguntas frecuentes",
    contact: "Contacto",
    product: P,
    terms: "Condiciones generales",
    privacy: "Privacidad",
    legal: "Aviso legal",
    deleteProAccount: `Eliminar una cuenta de ${P} Pro`,
    proLogin: "Acceder al espacio del parking",
    paymentTitle: "Pago seguro",
    paymentMethods: "Medios de pago aceptados",
    paymentChips: ["CB", "Visa", "Mastercard", "Apple Pay", "Google Pay"],
    paymentText:
      "Se paga en línea al reservar, a través de Stripe. Nada que pagar en el parking.",
    followTitle: "Síganos",
    followOn: (network: string) => `${P} en ${network}`,
    rights: "Todos los derechos reservados",
    vat: (number: string) => `IVA ${number}`,
  },
  help: {
    eyebrow: "¿Necesita ayuda?",
    title: "¿Tiene alguna pregunta sobre su reserva?",
    leadHours: (hours: string) => `Nuestro equipo le atiende ${hours}.`,
    leadBoth: "Nuestro equipo le atiende por teléfono o por escrito.",
    leadPhone: "Nuestro equipo le atiende por teléfono.",
    leadWritten: "Escríbanos: nuestro equipo le responde por correo electrónico.",
    leadSelf:
      "Puede recuperar su reserva en línea con su referencia y su correo electrónico, y encontrará las respuestas a las preguntas más habituales en nuestras preguntas frecuentes.",
    dayOfDeparture:
      "El día de la salida, llame directamente al parking: su número figura en su confirmación y en « Mi reserva ».",
    byPhone: "Por teléfono",
    call: "Llamar",
    callLabel: "Llamar al servicio de atención al cliente",
    inWriting: "Por escrito",
    contactForm: "Formulario de contacto",
    replyWithin: (delay: string) => `Respuesta por correo electrónico en ${delay}.`,
    replyByEmail: "Respuesta por correo electrónico.",
    write: "Escríbanos",
    findBooking: "Recuperar mi reserva",
    faq: "Preguntas frecuentes",
  },
  proHome: {
    metaTitle: `Software de gestión de parkings de aeropuerto · ${P} Pro`,
    metaDescription: `Software para parkings de aeropuerto con lanzadera y aparcacoches: reservas de los comparadores, plano, lanzadera, contrato y acta de estado. Demo gratuita.`,
    nav: { software: "Software", live: "Lanzadera y clientes", marketplace: `Vender en ${P}`, paperwork: "Contrato y acta de estado", pricing: "Precios" },
    heroTitle: "El software de los parkings",
    heroAccent: "de aeropuerto",
    heroLead: "Para parkings con lanzadera y aparcacoches: sus lanzaderas en directo, sus clientes que le avisan y cada coche en su sitio. En el ordenador y en el móvil.",
    map: {
      label: "Mapa: el parking y una lanzadera de camino a la Terminal 1",
      live: "En directo",
      liveSection: "Lanzadera en directo · Terminal 1 en 7 min",
      driver: "Karim · 3 pers.",
      terminal: "Terminal 1 · 7 min",
    },
    liveTitle: "Sus clientes ya no le",
    liveAccent: "llaman",
    liveLead: "Ven llegar la lanzadera y le avisan con un solo gesto: llegada, retraso del avión, equipaje perdido.",
    feedTitle: "Lo que recibe su equipo",
    messages: [
      { tone: "info", icon: "↗", title: "Dupont · Estoy en camino", text: "« Llegamos con una bici en el techo »", at: "06:05" },
      { tone: "info", icon: "10", title: "Leroy · Llego en 10 min", text: "AB-123-CD", at: "06:20" },
      { tone: "ok", icon: "✓", title: "Petit · Estoy en el punto de encuentro", text: "Terminal 1 · salida 4", at: "14:42" },
      { tone: "warn", icon: "!", title: "Martin · Mi vuelo lleva retraso", text: "aterriza hacia las 22:10", at: "21:05" },
    ],
    liveGains: [
      "La lanzadera sale en el momento justo: su conductor sabe quién espera y dónde.",
      "Menos llamadas al mostrador: el cliente ve la lanzadera en su reserva.",
      "Un retraso del avión ya no hace esperar a la lanzadera en balde.",
      "El cliente recibe un aviso cuando su coche le espera.",
    ],
    buildOffer: "Crear mi oferta",
    facts: [
      { value: "6", label: "comparadores reconocidos" },
      { value: "4", label: "puestos: gerente, recepción, conductor, aparcacoches" },
      { value: "Web · iPhone · Android", label: "el mismo equipo en todas partes" },
    ],
    productsTitle: "Todo para un parking de aeropuerto",
    productsLead: "Cuatro herramientas que funcionan juntas. Elíjalas en el plan que mejor le convenga.",
    tryInDemo: "Probarlo en la demo ›",
    products: {
      software: {
        tag: "Software",
        title: "Su parking de un vistazo",
        points: [
          "Todas sus reservas en un único planning",
          "Cada coche aparcado para salir sin mover ningún otro",
          "La facturación, neta de las comisiones de los comparadores",
        ],
      },
      app: {
        tag: `Aplicación ${P} Pro`,
        title: "Para el conductor, el aparcacoches y la recepción",
        points: ["Cada uno ve lo que tiene que hacer, según su puesto", "El conductor sabe a quién llevar y a quién recoger", "El aparcacoches sabe dónde aparcar cada coche"],
      },
      marketplace: {
        tag: `Vender en ${P}`,
        title: "Nuevos clientes, sin esfuerzo",
        points: [`Su parking en el comparador ${P}`, "Los clientes reservan y pagan en línea", "15 % por reserva pagada, nada más"],
      },
      paperwork: {
        tag: "Contrato y acta de estado",
        title: "¿Un litigio? Tiene las pruebas",
        points: ["Su contrato firmado por cada cliente", "Fotos a la entrega y a la devolución, una junto a otra", "Todo se guarda y se encuentra en un clic"],
      },
    },
    screens: {
      onSite: "En el parking",
      arrivals: "Llegadas",
      returns: "Regresos",
      toHandle: "Pendiente",
      lateFlight: "Vuelo con retraso",
      returnLabel: "regreso",
      go: "Ida · 6",
      back: "Vuelta · 3",
      leave: "Salir · 3 pers.",
      listingName: "Parking des Cèdres",
      live: "Lanzadera en directo",
      listingLine: "7 días · 49 € · lanzadera 8 min",
      paidLine: "Pagado en línea · abonado en su cuenta",
      signed: "Contrato firmado",
      atCounter: "En el mostrador",
      dropoff: "Acta de estado a la entrega · 4 fotos",
      atReturn: "A la devolución:",
      already: "Ya en la entrega",
      fresh: "Nuevo",
      day: "Mar. 27 · 14 llegadas · 9 regresos · 87 coches",
      paid: "pagado",
    },
    centralTitle: "Centralice sus reservas",
    centralLead: `Todo en el mismo lugar: sus comparadores, el teléfono, el mostrador y ${P}.`,
    channels: ["Allopark", "Onepark", "Parclick", "ParkMundo", "ParkVia", "Park Hit", P, "Teléfono", "Mostrador"],
    gains: [
      { title: "Gane tiempo", text: "Sin volver a teclear: cada reserva llega sola al planning." },
      { title: "Gane dinero", text: `Sin sobrerreservas, y nuevos clientes con su ficha en ${P}.` },
      { title: "Clientes tranquilos", text: "Avisados la víspera y recogidos a su hora aunque el vuelo se retrase." },
    ],
    fieldTitle: "Hecho sobre el terreno",
    fieldLead: `${P} se ha creado junto a un parking con aparcacoches del aeropuerto de Lyon Saint-Exupéry, a partir de lo que le hace perder tiempo cada día.`,
    fieldPains: [
      "Reservas que llegan por todas partes",
      "Coches que hay que mover para sacar otro",
      "Clientes que esperan la lanzadera a la vuelta",
      "Litigios sin pruebas sobre el estado del coche",
    ],
    featuresKicker: "Funcionalidades",
    featuresTitle: `Todo lo que hace ${P} Pro`,
    featuresLead: "Desde el primer correo del comparador hasta el cliente que se va con sus llaves: una sola herramienta para todo el equipo, en el ordenador y en el móvil.",
    features: [
      {
        icon: "day",
        title: "Su jornada",
        items: [
          "Las próximas llegadas y salidas, que avanzan con el día",
          "Los retrasos, detectados automáticamente",
          "Los coches en el parking, noche a noche, hasta 3 meses",
          "Un puesto por persona: recepción, conductor, aparcacoches, gerente",
          "Una notificación cuando hay que actuar",
        ],
      },
      {
        icon: "bookings",
        title: "Sus reservas",
        items: [
          "Las de los comparadores llegan solas a su planning",
          "Modificaciones y cancelaciones tenidas en cuenta",
          "Los clientes que no se presentan y los coches olvidados, señalados",
          "El historial de cada reserva: quién, qué y cuándo",
          "Sus reservas anteriores importadas con un solo archivo",
        ],
      },
      {
        icon: "shuttle",
        title: "Lanzadera y coches",
        items: [
          "Los clientes que hay que llevar y recoger, por franja horaria",
          "La hora real de aterrizaje de cada cliente",
          "Sus clientes ven llegar la lanzadera",
          "Cada coche en su sitio y las llaves en su gancho",
          "Contrato firmado y acta de estado con fotos",
        ],
      },
      {
        icon: "money",
        title: "Su dinero",
        items: [
          "La facturación por mes y por comparador",
          "Lo que le cobra cada comparador y lo que usted se queda",
          "Las reservas sin precio, destacadas",
          "Servicios adicionales (lavado, recarga) y suplementos (retraso, noche)",
          "Facturas a su nombre y con su logotipo",
        ],
      },
    ],
    featuresBand: `Y sus clientes le encuentran en ${P.toLowerCase()}.fr: reserva y pago en línea, sin nada que gestionar.`,
    pricesTitle: "Cree su oferta",
    pricesLead: "Sin permanencia en la modalidad mensual. Precios sin IVA, por mes y por parking.",
    planLines: { essentiel: "Todas sus reservas en el mismo lugar", operations: "+ plano, filas de aparcacoches y lanzaderas", complet: "+ contrato, acta de estado y márgenes" },
    recommended: "recomendado",
    allPrices: "Ver todos los precios",
    faqTitle: "Preguntas frecuentes",
    faq: [
      [`¿Qué comparadores lee ${P} Pro?`, "Allopark, Onepark, Parclick, ParkMundo, ParkVia y Park Hit. Usted reenvía sus correos a la dirección de su parking y la reserva se crea sola en su planning."],
      ["¿Mis clientes tienen que instalar una aplicación?", `No. El enlace de su reserva también se abre en el navegador. La aplicación ${P} les añade las notificaciones.`],
      ["¿Sirve para un parking con aparcacoches sin plazas marcadas?", "Sí. Sus coches se aparcan en filas según su fecha de regreso, para que cada uno salga sin mover ningún otro."],
      ["¿Cuánto cuesta?", "De 99 € a 299 € sin IVA al mes y por parking según el plan, −10 % en la modalidad anual. Sin permanencia en la modalidad mensual."],
      ["¿En qué dispositivos?", `En el ordenador, desde el navegador, y en móviles Android con la aplicación ${P} Pro. La aplicación para iPhone está en proceso de validación por Apple.`],
      ["¿Puedo probarlo antes?", "Sí: la demo es gratuita y sin registro. Elija un puesto (gerente, recepción, conductor o aparcacoches) y pruebe en un parking ficticio."],
    ] as [string, string][],
    learnMore: "Más información ›",
    topicsTitle: "Lea también",
    breadcrumbSolutions: "Soluciones",
    topicCtaTitle: "Pruébelo en un parking",
    topicCtaLead: "La demo es gratuita y sin registro: elija un puesto y viva la jornada de un parking ficticio.",
    topicProblem: "El problema",
    topicGains: "Lo que cambia",
    topicScreens: "Lo que ve su equipo",
    contactTitle: "¿Necesita información?",
    contactLead: `Pruebe la demo ahora mismo o déjenos sus datos: le llamaremos para mostrarle ${P} en su parking.`,
    askDemo: "Solicitar una demo",
    demoSent: `Gracias: le escribiremos muy pronto para mostrarle ${P} en su parking.`,
    footer: { solutions: "Soluciones", start: "Empezar", plazo: P, travellers: "Web para viajeros", contact: "Contacto" },
    appStoreSoon: "App Store: próximamente",
    playStore: `${P} Pro en Google Play`,
  },
  proPricing: {
    metaTitle: `Precios del software de parkings de aeropuerto · ${P} Pro`,
    metaDescription: `Software para parkings de aeropuerto: reservas, comparadores, plano, lanzadera. Configure su oferta ${P} Pro y vea el precio al instante.`,
    navPricing: "Precios",
    navTravellers: "Para viajeros",
    login: "Iniciar sesión",
    tryDemo: "Probar la demo",
    signup: "Registrar mi parking",
    eyebrow: "Precios",
    title: "Configure la oferta de su parking",
    lead: `Elija su plan, añada su ficha en ${P} y sus opciones: el total se calcula solo, al mes o al año.`,
    anchors: { software: "Software", marketplace: `Ficha en ${P}`, options: "Opciones" },
    billing: "Facturación",
    monthly: "Mensual",
    yearly: "Anual",
    softwareTitle: "El software del parking",
    softwareLead: `Web y aplicación ${P} Pro (iPhone, Android) en todos los planes. Cada plan incluye todo lo que ofrece el anterior.`,
    plans: "Plan",
    recommended: "Recomendado",
    perMonth: "sin IVA / mes",
    choose: "Elegir",
    chosen: "Elegido",
    marketTitle: `Su ficha en ${P}`,
    marketLead: `Los viajeros encuentran su parking en ${P.toLowerCase()}.fr y en la app ${P}, reservan y pagan en línea. ${P} cobra y le abona su parte.`,
    marketHeadline: "Sin suscripción, una comisión por reserva",
    marketPitch: `Solo paga por lo que ${P} le aporta.`,
    marketPoints: [
      "Ficha con fotos, tarifas, lanzadera en directo y opiniones",
      "Pago en línea con tarjeta, Apple Pay y Google Pay",
      "Reservas directamente en su planning",
      "Servicios adicionales vendidos al viajero (lavado, recarga)",
    ],
    marketToggle: `Añadir mi ficha en ${P}`,
    marketRate: `por reserva pagada en ${P}, descontada del abono`,
    example: "Ejemplo",
    exampleStay: "Estancia de una semana",
    exampleCommission: `Comisión de ${P}`,
    exampleNet: "Usted recibe",
    optionsTitle: "Opciones",
    optionsLead: "Para añadir cuando las necesite.",
    soon: "Próximamente",
    onQuote: "Bajo presupuesto",
    once: "una vez",
    recap: "Su selección",
    commissionLine: (rate: number) => `${rate} % por reserva`,
    commissionNote: `La comisión solo se aplica a las reservas pagadas en ${P}.`,
    total: (yearly: boolean) => `Total ${yearly ? "anual" : "mensual"} sin IVA`,
    perMonthShort: " / mes",
    perYearShort: " / año",
    yearlyNote: (monthly: string) => `es decir, ${monthly} al mes`,
    noCommitment: "sin permanencia",
    atOrder: (amount: string) => ` · + ${amount} al contratar`,
    askQuote: "Solicitar un presupuesto",
    trust: ["Sin permanencia en la modalidad mensual", "Puesta en marcha con usted: plano, comparadores, equipo"],
    totalShort: "Total sin IVA",
    questionTitle: "¿Tiene alguna pregunta sobre nuestros precios?",
    questionLead: `Pruebe la demo de ${P} Pro sin cuenta o déjenos sus datos: le llamaremos para ver su parking juntos.`,
    form: {
      firstName: "Nombre",
      lastName: "Apellidos",
      parking: "Parking",
      email: "Correo electrónico",
      phone: "Teléfono",
      airport: "Aeropuerto",
      airportOther: "Otro aeropuerto",
      optional: "opcional",
      sending: "Enviando…",
      sent: "Solicitud enviada",
      sentText: "Gracias: le escribiremos muy pronto con un presupuesto para su parking.",
      honeypot: "No rellenar este campo",
    },
    footerPitch: "El parking, de la llegada al regreso.",
  },
  contact: {
    title: "Contacto",
    description: `Escriba al servicio de atención al cliente de ${P}: una pregunta sobre una reserva, un parking o la web.`,
    lead: (delay: string | null) =>
      `¿Tiene alguna pregunta sobre una reserva, un parking o la web? Escríbanos: nuestro equipo le responderá por correo electrónico${delay ? ` en ${delay}` : ""}.`,
    name: "Nombre y apellidos",
    email: "Correo electrónico",
    emailHint: "Le responderemos a esta dirección.",
    reference: "Referencia de la reserva",
    optional: "opcional",
    referenceHint: "Figura en su correo electrónico de confirmación.",
    message: "Su mensaje",
    messageHint:
      "Entre 10 y 2.000 caracteres. No escriba nunca los datos de su tarjeta bancaria.",
    honeypot: "No rellenar este campo",
    submit: "Enviar el mensaje",
    sending: "Enviando…",
    privacy: `Su mensaje se envía por correo electrónico al servicio de atención al cliente de ${P}, que le responde a la dirección indicada; ${P} no lo conserva después de este envío.`,
    privacyLink: "Privacidad",
    sentTitle: "Mensaje enviado",
    sentText: (delay: string | null) =>
      `Gracias, nuestro equipo le responderá por correo electrónico${delay ? ` en ${delay}` : ""}. No olvide revisar su carpeta de correo no deseado.`,
    writeAnother: "Escribir otro mensaje",
    phoneTitle: "Por teléfono",
    unavailableTitle: "El formulario de contacto llegará pronto",
    unavailableText:
      "Mientras tanto, recupere su reserva en « Mi reserva » con su referencia y su correo electrónico, y encuentre las respuestas a las preguntas más habituales en nuestras preguntas frecuentes.",
  },
  newsletter: {
    title: `El boletín de ${P}`,
    text: "Nuevos aeropuertos, nuevos parkings y ofertas de temporada.",
    placeholder: "Su correo electrónico",
    submit: "Suscribirme",
    sending: "Un momento…",
    consent: `Al suscribirse, acepta recibir el boletín de ${P} por correo electrónico; su dirección solo se usa para ello.`,
    unsubscribe: "Baja con un solo clic, en cada boletín.",
    privacyLink: "Privacidad",
    sent: "¡Gracias! Confirme su suscripción con el enlace del correo que le enviamos. ¿Ya está suscrito? No tiene que hacer nada.",
    honeypot: "No rellenar este campo",
  },
  letterConfirmed: {
    title: "Suscripción confirmada",
    text: `¡Gracias! Recibirá el boletín de ${P} en esta dirección: nuevos aeropuertos, nuevos parkings y ofertas de temporada. Para darse de baja, basta un clic desde cada boletín.`,
    home: "Volver al inicio",
  },
  search: {
    airport: "Aeropuerto",
    dropOff: "Entrega del coche",
    pickUp: "Regreso (aterrizaje)",
    dropOffDate: "Fecha de entrega",
    dropOffTime: "Hora de entrega",
    pickUpDate: "Fecha de regreso",
    pickUpTime: "Hora de regreso",
    submit: "Buscar",
    update: "Actualizar",
    modify: "Modificar la búsqueda",
  },
  picker: {
    yourDates: "Sus fechas",
    dropOff: "Entrega",
    pickUp: "Regreso",
    time: "Hora",
    choose: "Elegir",
    dropOffTime: "Hora de entrega",
    pickUpTime: "Hora de regreso",
    hint: "1.er clic: entrega · 2.º clic: regreso",
    pickDropOff: "Elija la fecha de entrega",
    pickReturn: "elija el regreso",
    clear: "Borrar",
    confirm: "Aceptar",
    confirmDates: "Confirmar las fechas",
    close: "Cerrar",
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    moreTimes: "desplácese para ver más horarios",
    today: "hoy",
    pill: (label: string, value: string | null) =>
      `${label}: ${value ?? "por elegir"}`,
  },
  home: {
    heroTitle: (airport: string) =>
      `Parking en el aeropuerto de ${airport}, lanzadera incluida`,
    heroTitleShort: "Parking de aeropuerto, lanzadera incluida",
    photoCredit: "Foto: Pexels",
    chips: ["Precio total", "Lanzadera gratuita", "Cancelación clara"],
    heroLead:
      "Compare los parkings privados cerca del aeropuerto, vea el precio total para sus fechas y reserve en línea.",
    heroFind: "Su parking en",
    heroNear: (airport: string) => `el aeropuerto de ${airport}`,
    heroKicker: "¿Listo para salir?",
    mapAvailable: (n: number) =>
      n === 0
        ? "No hay plazas en estas fechas"
        : n === 1
          ? "1 parking disponible"
          : `${n} parkings disponibles`,
    mapDistance: (km: string | null, shuttle: number | null) =>
      [km ? `${km} km` : null, shuttle ? `lanzadera ${shuttle} min` : null]
        .filter(Boolean)
        .join(" · "),
    featuredSub: (valet: boolean, shuttle: number | null) =>
      `${valet ? "Aparcacoches" : "Aparca usted mismo"}${shuttle ? ` · lanzadera ${shuttle} min` : ""}`,
    featuredSee: (title: string) => `Ver ${title}`,
    mapShuttles: (n: number) =>
      n === 1 ? "1 lanzadera en circulación" : `${n} lanzaderas en circulación`,
    mapFull: "Completo en estas fechas",
    mapSeeAnyway: "Ver el parking",
    trust: [
      ["Precio total a la vista", "gastos incluidos"],
      ["Lanzadera gratuita", "hasta las terminales"],
      ["Cancelación clara", "condiciones visibles antes de reservar"],
    ] as [string, string][],
    howTitle: "Cómo funciona",
    how: [
      [
        "Reserve y pague en línea",
        "Compare los parkings y elija el suyo. Pago seguro con tarjeta: su plaza queda garantizada para todas sus fechas.",
      ],
      [
        "Deje su coche",
        "Preséntese en la recepción del parking: todo está ya pagado. La lanzadera le lleva a la terminal en pocos minutos.",
      ],
      [
        "La lanzadera le espera a la vuelta",
        "Indique su vuelo de regreso: el parking sigue la hora de aterrizaje y le avisa por SMS.",
      ],
    ] as [string, string][],
    partnersTitle: (airport: string) => `Los parkings asociados en ${airport}`,
    partnersCount: (n: number) =>
      `${n} parking${n > 1 ? "s" : ""}${n < 3 ? " · llegarán más" : ""}`,
    noPartners: (airport: string) =>
      `Todavía no hay ningún parking en línea en ${airport}. Vuelva pronto.`,
    from: "desde",
    seeParking: "Ver el parking",
    ownerCallout: "¿Gestiona un parking cerca del aeropuerto?",
    ownerJoin: `Únase a ${P}`,
    ownerPitch: "planning, lanzadera y reservas en línea en un mismo lugar.",
    faqTitle: "Preguntas frecuentes",
    faqLead: (airport: string) =>
      `Las preguntas más frecuentes sobre el parking en el aeropuerto de ${airport}.`,
    faq: [
      [
        "¿Con cuánto tiempo de antelación a mi vuelo debo llegar al parking?",
        "Cuente el tiempo de lanzadera indicado en cada parking (a menudo menos de 15 minutos) además de la antelación que recomienda su aerolínea.",
      ],
      [
        "¿Cómo funciona el regreso?",
        "El parking sigue su vuelo de regreso. Al aterrizar, recibe un SMS con el punto de encuentro de la lanzadera.",
      ],
      [
        "¿Cómo pago?",
        `Con tarjeta bancaria, en línea, al reservar: pago seguro con tarjeta en ${P}, en la página de nuestro proveedor Stripe. Nunca vemos su tarjeta y no hay nada que pagar en el parking.`,
      ],
      [
        "¿Puedo cancelar?",
        "Sí, según las condiciones del parking elegido, que se muestran en su ficha y se le recuerdan antes de reservar. Una cancelación gratuita se reembolsa íntegramente en su tarjeta en un plazo de 5 a 10 días.",
      ],
    ] as [string, string][],
  },
  guide: {
    onThisPage: "En esta página",
    updated: (date: string) => `Actualizado el ${date}`,
    searchTitle: "Compare los precios para sus fechas",
    seeAllResults: "Ver todos los parkings para estas fechas",
    faqTitle: "Preguntas frecuentes",
    otherGuides: "Las demás guías",
    airportGuide: (airport: string) =>
      `La guía completa del parking en el aeropuerto de ${airport}`,
    footerLink: (topic: string, airport: string) => `${topic} en ${airport}`,
  },
  results: {
    available: (n: number) =>
      n === 0
        ? "Ningún parking disponible"
        : `${n} parking${n > 1 ? "s" : ""} disponible${n > 1 ? "s" : ""}`,
    filters: "Filtros",
    services: "Servicios",
    cancellation: "Cancelación",
    freeCancellation: "Cancelación gratuita",
    shuttle: "Trayecto en lanzadera",
    shuttleMax: (n: number) => `${n} min máx.`,
    shuttleAny: "Indiferente",
    totalPrice: "Precio total",
    maxPrice: "Precio total máximo",
    upTo: (price: string) => `hasta ${price}`,
    apply: "Aplicar los filtros",
    clear: "Borrar los filtros",
    sort: "Ordenar",
    sortBy: {
      prix: "Precio",
      navette: "Lanzadera más corta",
      distance: "Distancia",
    },
    cheapest: "El más barato",
    fastestShuttle: "Lanzadera más rápida",
    liveFilter: "Lanzadera en directo",
    allIn: (days: number) => `${esDays(days)}, todo incluido`,
    nightFeesIncluded: "Precios totales para sus fechas, recargos nocturnos incluidos.",
    live: "En directo",
    liveTitle:
      "Lanzadera seguida en directo: la verá llegar en su reserva.",
    seeAndBook: "Ver y reservar",
    full: "Completo en estas fechas",
    fullHint: "Pruebe con otras fechas",
    noPrice: "Sin tarifa para esta duración",
    noPriceHint: "Pruebe con una estancia más corta",
    footnote:
      "Precios totales para sus fechas, gastos incluidos, pagados en línea con tarjeta. El día de llegada y el día de regreso cuentan cada uno como un día.",
    noneTitle: "Ningún parking para estas fechas",
    noneText:
      "Ningún parking asociado tiene plaza para toda su estancia. Pruebe con otras fechas.",
    noMatchTitle: "Ningún parking coincide con sus filtros",
    noMatchText: "Amplíe sus criterios para ver más parkings.",
    datesTitle: "Indique sus fechas",
    datesText:
      "Elija sus fechas de entrega y de regreso para ver los parkings disponibles y su precio total.",
  },
  highlights: {
    perDay: (price: string) => `${price}/día`,
    newOnPlatform: `Nuevo en ${P}`,
    bandLabel: "Lo esencial",
    evChip: "Recarga",
    cancelChip: {
      untilArrival: "Gratis hasta la llegada",
      h24: "Gratis 24 h",
      h48: "Gratis 48 h",
      nonRefundable: "No reembolsable",
    },
    chips: {
      outdoor: "Exterior",
      covered: "Cubierto",
      keysValet: "Debe entregar sus llaves",
      keysValetShort: "Llaves entregadas",
      keysSelf: "Usted conserva sus llaves",
      keysSelfShort: "Llaves conservadas",
      open24h: "Abierto 24 h",
      open24hShort: "24 h",
      openHours: (hours: string) => `Abierto ${hours}`,
    },
    shuttleBox: {
      title: "Lanzadera gratuita",
      ride: "Trayecto",
      wait: "Espera media",
      waitShort: "Espera",
      waitFull: "Espera media",
      minutes: (min: number) => `${min} min`,
      live: "Lanzadera en directo",
      dayJ: "Seguimiento en directo el día del viaje",
      parking: "Parking",
      terminal1: "Terminal 1",
      airport: "Aeropuerto",
      destination: (place: string, min: number | null) =>
        min ? `${place} · ${min} min` : place,
      rail: (
        place: "terminal1" | "airport",
        running: number | null,
        placed: number,
      ) => {
        const to = place === "terminal1" ? "a la Terminal 1" : "al aeropuerto";
        if (running === null) return `Trayecto del parking ${to}`;
        if (running === 0)
          return `Trayecto del parking ${to}, ninguna lanzadera en camino en este momento`;
        const s = running > 1 ? "s" : "";
        const road = `${running} lanzadera${s} en camino entre el parking y ${place === "terminal1" ? "la Terminal 1" : "el aeropuerto"}`;
        return placed === 0
          ? `${road}, aún sin situar en el trayecto`
          : road;
      },
    },
    kmFromTerminals: (km: string) => `A ${km} km de las terminales`,
    tiles: {
      shuttleLive: "Lanzadera en directo",
      shuttleFree: "Lanzadera gratuita",
      free: "gratuita",
      ride: (min: number) => `trayecto de ${min} min`,
      wait: (min: number) => `espera media de ${min} min`,
      followLive: "sígala en el mapa el día del viaje",
      toTerminal1: "hacia la Terminal 1",
      toAirport: "hacia el aeropuerto",
      outdoor: "Exterior",
      outdoorText: "Parking al aire libre",
      covered: "Cubierto",
      coveredText: "Parking cubierto",
      fenced: "vallado",
      cctv: "videovigilancia",
      keysValet: "Debe entregar sus llaves",
      keysValetText: "Un aparcacoches aparca su coche",
      keysSelf: "Usted conserva sus llaves",
      keysSelfText: "Aparca usted mismo",
      open24h: "Abierto 24 h",
      open24hText: "Entrega y regreso a cualquier hora",
      openHours: (hours: string) => `Abierto ${hours}`,
      openHoursText: "Entrega y regreso dentro de este horario",
      freeCancellation: "Cancelación gratuita",
      cancellationText: {
        free_until_arrival: "hasta la llegada",
        free_24h: "hasta 24 h antes",
        free_48h: "hasta 48 h antes",
      } as Record<string, string>,
      nonRefundable: "No reembolsable",
      nonRefundableText: "sin reembolso en caso de cancelación",
    },
  },
  map: {
    show: "Mostrar el mapa",
    hide: "Ocultar el mapa",
    title: "Mapa de los parkings",
    terminals: "Terminales",
    noPosition: "Ubicación no indicada",
    full: "Completo",
    noPrice: "Sin tarifa",
    loading: "Cargando el mapa…",
    failed: "No se ha podido mostrar el mapa.",
    attribution: "© IGN – Plan IGN",
    marker: (title: string, state: string) => `${title}, ${state}`,
    markerLive: (title: string, state: string) =>
      `${title}, ${state}, lanzadera seguida en directo`,
    shuttle: (parking: string, direction: "pickup" | "dropoff") =>
      `Lanzadera de ${parking} · ${direction === "dropoff" ? "hacia la terminal" : "hacia el aeropuerto"}`,
    shuttleAge: (seconds: number) =>
      seconds < 60
        ? `posición hace ${seconds} s`
        : `posición hace ${Math.round(seconds / 60)} min`,
    controls: {
      "Map.Title": "Mapa",
      "NavigationControl.ZoomIn": "Acercar",
      "NavigationControl.ZoomOut": "Alejar",
      "AttributionControl.ToggleAttribution": "Mostrar los créditos",
      "CooperativeGesturesHandler.WindowsHelpText":
        "Use Ctrl + rueda del ratón para hacer zoom en el mapa",
      "CooperativeGesturesHandler.MacHelpText":
        "Use ⌘ + rueda del ratón para hacer zoom en el mapa",
      "CooperativeGesturesHandler.MobileHelpText":
        "Use dos dedos para mover el mapa",
    },
    notDrawn: (n: number) =>
      n === 1
        ? "1 parking no tiene ubicación en el mapa."
        : `${n} parkings no tienen ubicación en el mapa.`,
  },
  parking: {
    itinerary: "Cómo llegar",
    kmFromTerminals: (km: string) => `${km} km de las terminales`,
    shuttle: "Lanzadera",
    hours: "Horario",
    parkingType: "Estacionamiento",
    fenced: "vallado",
    cancellation: "Cancelación",
    presentation: "Presentación",
    howItGoes: "Cómo funciona",
    outbound: "A la ida",
    outboundText: (min: number | null) =>
      `Preséntese en la recepción del parking con su matrícula. Deja el coche y la lanzadera le lleva a la terminal${min ? ` en ${min} minutos` : ""}.`,
    inbound: "A la vuelta",
    inboundText:
      "Indique su número de vuelo: el parking sigue su aterrizaje. Recibirá un SMS con el punto de encuentro de la lanzadera.",
    access: "Acceso",
    openInMaps: "Abrir en Google Maps",
    addressUnknown: "Dirección comunicada al reservar.",
    forStay: (days: number) => `por ${esDays(days)}, todo incluido`,
    from: "desde",
    dropOff: "Entrega",
    pickUp: "Regreso",
    availableForDates: "Plaza disponible para sus fechas",
    fullForDates: "Completo en estas fechas",
    noPriceForDates: "Sin tarifa para esta duración",
    packageLine: (days: number) => `Tarifa de ${esDays(days)}`,
    nightFee: "Recargo nocturno",
    nightFeeDropOff: "entrega a las",
    nightFeeReturn: "regreso a las",
    nightFeeAnd: "y",
    nightRule: (fees: string, start: string, end: string) =>
      `Este parking añade ${fees} entre las ${start} y las ${end}.`,
    nightRuleSame: (amount: string) => `${amount} por una entrega o un regreso`,
    nightRuleEach: (dropOff: string, pickUp: string) =>
      `${dropOff} por una entrega y ${pickUp} por un regreso`,
    nightRuleDropOff: (amount: string) => `${amount} por una entrega`,
    nightRuleReturn: (amount: string) => `${amount} por un regreso`,
    serviceFee: "Gastos de gestión",
    total: "Total",
    payOnSite: "Total a pagar en línea",
    book: "Reservar",
    onlineSoon: "Reserva en línea disponible próximamente",
    onlineSoonHint:
      "Este parking todavía no acepta reservas en la web.",
    checkDates: "Ver el precio",
    askDates: "Indique sus fechas para ver el precio total y la disponibilidad.",
    otherParkings: "Ver los demás parkings",
  },
  booking: {
    back: "Volver al parking",
    title: "Finalizar la reserva",
    yourDetails: "Sus datos",
    firstName: "Nombre",
    lastName: "Apellidos",
    phone: "Teléfono móvil (para el SMS de la lanzadera)",
    email: "Correo electrónico (confirmación)",
    plate: "Matrícula",
    plateHint: "Matrícula francesa o extranjera.",
    flight: "Vuelo de regreso (recomendado)",
    flightHint: "Ej. TO 3627: la lanzadera sigue su aterrizaje.",
    outboundFlight: "Vuelo de ida (opcional)",
    outboundFlightHint:
      "Ej. AF 7641: la lanzadera a la terminal se programa antes de su despegue.",
    passengers: "Pasajeros",
    vehicleTitle: "Para reconocerle (opcional)",
    vehicleModel: "Modelo del vehículo",
    vehicleModelHint: "Ej. Peugeot 308",
    vehicleColour: "Color",
    vehicleColourHint: "Ej. gris",
    message: "Una nota para el parking",
    messageHint:
      "Carrito de bebé, llegada tardía… El parking lo lee antes de su llegada.",
    childSeats: {
      title: "¿Viaja con niños?",
      subtitle: "El parking prepara las sillas en la lanzadera",
      switchLabel: "Solicitar sillas infantiles",
      hint: "Los niños cuentan como pasajeros. Sillas prestadas tanto a la ida como a la vuelta, gratis.",
      kinds: {
        infant: {
          label: "Bebé · hasta 12 meses",
          hint: "Silla a contramarcha",
          fewer: "Un bebé menos",
          more: "Un bebé más",
          count: (n: number) => `${n} ${n > 1 ? "bebés" : "bebé"}`,
        },
        toddler: {
          label: "De 1 a 4 años",
          hint: "Silla infantil",
          fewer: "Un niño de 1 a 4 años menos",
          more: "Un niño de 1 a 4 años más",
          count: (n: number) =>
            `${n} ${n > 1 ? "niños" : "niño"} de 1 a 4 años`,
        },
        booster: {
          label: "De 4 a 10 años",
          hint: "Elevador",
          fewer: "Un niño de 4 a 10 años menos",
          more: "Un niño de 4 a 10 años más",
          count: (n: number) =>
            `${n} ${n > 1 ? "niños" : "niño"} de 4 a 10 años`,
        },
      },
    },
    termsBefore: "Acepto las ",
    termsLink: `condiciones de ${P}`,
    termsAfter:
      " y las del parking. Mis datos se usan únicamente para esta estancia.",
    submit: "Continuar al pago",
    submitting: "Un momento…",
    steps: "Pasos de la reserva",
    stepDetails: "1 · Sus datos",
    stepPayment: "2 · Pago",
    currentStep: "(paso actual)",
    paymentNext: (total: string) =>
      `Pago seguro con tarjeta en el paso siguiente: ${total}.`,
    noAccount:
      "No hace falta crear una cuenta: recibirá la confirmación por correo electrónico y por SMS.",
    summaryDropOff: "Entrega",
    summaryPickUp: "Regreso",
    modify: "Modificar",
    totalOnSite: "Total",
    fixErrors: "Hay campos que corregir.",
    unavailableTitle: "Este parking ya no está disponible para sus fechas",
    fullNights: (nights: string) =>
      `Noches completas: ${nights}${nights.endsWith(".") ? "" : "."}`,
    seeOtherParkings: "Ver los demás parkings",
    changeDates: "Cambiar de fechas",
  },
  pay: {
    title: "Pago",
    recap: "Resumen",
    modify: "Modificar",
    total: "Total",
    days: (n: number) => esDays(n),
    holdLeft: (time: string) => `Su plaza queda reservada durante ${time}`,
    button: (total: string) => `Pagar ${total}`,
    redirecting: "Redirigiendo…",
    redirectNote:
      "Se le redirigirá a la página de pago seguro de Stripe.",
    passengers: (n: number) => `${n} pasajero${n > 1 ? "s" : ""}`,
    expiredTitle: "Se ha agotado el plazo",
    expiredText:
      "Su plaza ya no está reservada y no se ha cobrado nada. Puede volver a empezar: sus datos se conservan.",
    restart: "Volver a empezar la reserva",
    verifyingTitle: "Verificando el pago…",
    verifyingText:
      "Tarda unos segundos. Esta página se actualiza sola.",
    refresh: "Actualizar",
  },
  manage: {
    title: "Mi reserva",
    lookupLead:
      `No necesita cuenta: basta con el enlace de su SMS o de su correo electrónico. Si no, introduzca el número recibido de ${P} o de la web donde reservó.`,
    reference: "Número de reserva",
    referenceHint: `${P}, Allopark, Onepark, ParkVia…`,
    contact: "Correo electrónico o teléfono",
    email: "Correo electrónico",
    find: "Recuperar mi reserva",
    finding: "Buscando…",
    confirmedTitle: (name: string) =>
      name ? `¡Reserva hecha, ${name}!` : "¡Reserva hecha!",
    confirmedText: (email: string | null, phone: string | null) =>
      email && phone
        ? `Su confirmación se envía a ${email} y por SMS al ${phone}.`
        : email
          ? `Su confirmación se envía a ${email}.`
          : phone
            ? `Su confirmación se envía por SMS al ${phone}.`
            : "Guarde bien su referencia.",
    dropOff: "Entrega",
    pickUp: "Regreso",
    flight: "Vuelo de regreso",
    outbound: "Vuelo de ida",
    outboundShuttle: (time: string) =>
      `lanzadera a la terminal prevista hacia las ${time}`,
    outboundStatus: {
      scheduled: "puntual",
      delayed: "con retraso",
      departed: "ha despegado",
      landed: "ha despegado",
      cancelled: "cancelado",
      diverted: "desviado",
      unknown: "vuelo no encontrado",
    } as Record<string, string>,
    noFlight: "No indicado",
    vehicle: "Vehículo",
    vehicleDetails: (model: string | null, colour: string | null) =>
      [model, colour].filter(Boolean).join(" · "),
    message: "Su nota para el parking",
    passengers: "Pasajeros",
    toPayOnSite: "Pagado",
    nothingToPay: "Nada que pagar",
    paid: "Pagado",
    refunded: "Reembolsado",
    stayPrice: "Precio de la estancia",
    nightFeeIncluded: (amount: string) => `incluidos ${amount} de recargo nocturno`,
    freeUntil: (when: string) => `Cancelación gratuita hasta el ${when}`,
    nonRefundable: "No cancelable en línea",
    dayTitle: "El día de la salida",
    conditionsTitle: "A tener en cuenta",
    step1Title: "Diríjase al parking",
    step1Text: (address: string | null, min: number | null) =>
      `${address ? `${address}. ` : ""}Calcule ${min ? `${min} min de lanzadera` : "el trayecto en lanzadera"} antes de la hora recomendada por su aerolínea.`,
    step2Title: "Indique su referencia o su matrícula",
    step2Text: (_total?: string | null) =>
      "La recepción le espera: todo está ya pagado, deja el coche y la lanzadera le lleva a la terminal.",
    step3Title: "A la vuelta, seguimos su vuelo",
    step3Text: (flight: string | null) =>
      flight
        ? `En cuanto aterrice el ${flight}, recibirá un SMS con el punto de encuentro de la lanzadera.`
        : "Indique su vuelo de regreso aquí abajo: al aterrizar, recibirá un SMS con el punto de encuentro de la lanzadera.",
    itinerary: "Cómo llegar al parking",
    addToCalendar: "Añadir al calendario",
    manageLink: "Gestionar mi reserva",
    flightTitle: "Sus vuelos",
    flightLabel: "Vuelo de regreso",
    outboundLabel: "Vuelo de ida",
    flightSave: "Guardar",
    flightEdit: "Modificar",
    flightSaving: "Guardando…",
    flightHelp:
      "Cámbielo si su vuelo cambia: la lanzadera seguirá el nuevo. Déjelo vacío para borrarlo.",
    flightSaved: "Vuelos guardados.",
    flightLocked: "El vuelo de regreso ya no se puede modificar en línea.",
    childSeats: {
      title: "Sillas infantiles",
      none: "Ninguna silla solicitada",
      inShuttle:
        "Instaladas en la lanzadera, tanto a la ida como a la vuelta. Gratis.",
      edit: "Modificar",
      save: "Guardar",
      saving: "Guardando…",
      cancel: "Cancelar",
      saved: "Sillas infantiles guardadas.",
      locked:
        "Las sillas infantiles ya no se pueden modificar en línea: comuníqueselo al parking.",
    },
    invoices: {
      title: "Factura",
      invoice: (n: string) => `Factura ${n}`,
      creditNote: (n: string) => `Factura rectificativa ${n}`,
      issued: (amount: string, date: string, issuer: string) => `${amount} · emitida el ${date} por ${issuer}`,
      creditedBy: (n: string) => `Anulada por la factura rectificativa ${n}`,
      creditOf: (n: string) => `Anula la factura ${n}`,
      download: "Descargar el PDF",
      downloading: "Descargando…",
      none: "Todavía no hay factura para esta estancia.",
      company: "Empresa (opcional)",
      address: "Dirección de facturación (opcional)",
      request: "Solicitar la factura",
      requesting: "Enviando…",
      requested: (date: string) => `Solicitada el ${date}. El parking se la hará llegar aquí y por correo electrónico.`,
      requestedPill: "Solicitada",
      noPrice: "El parking aún no tiene el precio de esta estancia: solicítele la factura directamente.",
      errors: {
        too_long: "Este texto es demasiado largo.",
        already_requested: "La factura ya está solicitada.",
        invoice_exists: "La factura ya está disponible: recargue la página.",
        network: "Sin conexión. Inténtelo de nuevo.",
        unknown: "No se ha podido enviar la solicitud. Inténtelo de nuevo.",
      } as Record<string, string>,
    },
    cancelTitle: "Cancelar",
    cancelText: (until: string) =>
      `Gratis hasta el ${until}: reembolso íntegro en su tarjeta en un plazo de 5 a 10 días.`,
    cancelButton: "Cancelar mi reserva",
    cancelConfirm: "Confirmar la cancelación",
    cancelConfirmText:
      "Su plaza quedará libre y el pago se reembolsará íntegramente. Esta acción es definitiva.",
    cancelKeep: "Mantener mi reserva",
    cancelling: "Cancelando…",
    cancelled: "Esta reserva está cancelada.",
    cancelledRefunded:
      "Esta reserva está cancelada. Reembolso íntegro en su tarjeta en un plazo de 5 a 10 días.",
    cancelledNow:
      "Su reserva está cancelada. Reembolso íntegro en su tarjeta en un plazo de 5 a 10 días. Le enviamos un correo electrónico de confirmación.",
    cancelClosed: (until: string) =>
      `El plazo de cancelación en línea ha vencido (${until}).`,
    cancelNonRefundable: "Esta reserva no se puede cancelar en línea.",
    contactParkingPhone: "Contacte con el parking en el",
    contactParkingDesk: "Diríjase a la recepción del parking.",
    dayQuestion: (parking: string) => `¿Alguna pregunta el día del viaje? ${parking}:`,
    changeDates: (until: string) =>
      `Para cambiar las fechas, cancele y vuelva a reservar (gratis antes del ${until}).`,
    notFoundTitle: "Reserva no encontrada",
    notFoundText:
      "Este enlace no es válido o ha caducado. Introduzca su referencia y su correo electrónico para recuperar su reserva.",
    or: "y después",
  },
  appLink: {
    title: (reference: string) =>
      `Su reserva ${reference} le espera en la app`,
    lead: (parking: string) =>
      `${parking}. Instale la app: se abrirá en su reserva. Lanzadera en directo, encontrar mi coche, fotos del acta de estado.`,
    install: "Instalar la app",
    alreadyInstalled: "Ya tengo la app",
    continueWeb: "Continuar en la web",
    iosSoon:
      "Próximamente en el App Store: mientras tanto, su reserva está en la web.",
    playBadge: "Disponible en Google Play",
    appStoreBadge: "Descárgalo en el App Store",
    invalidTitle: "Enlace desconocido o caducado",
    invalidText:
      "Este enlace ya no lleva a ninguna reserva. Recupere la suya con su referencia y su correo electrónico.",
  },
  live: {
    live: "En directo",
    ago: (seconds: number) =>
      seconds < 60
        ? `hace ${seconds} s`
        : `hace ${Math.floor(seconds / 60)} min`,
    title: (flight: string | null) =>
      flight ? `Vuelo ${flight}` : "Su regreso",
    landsIn: "aterriza en",
    anyMinute: "inminente",
    planned: (time: string) => `previsto ${time}`,
    plannedLate: (time: string, late: number) =>
      `previsto ${time} · retraso +${late} min`,
    landed: "aterrizó a las",
    goMeeting: "diríjase al punto de encuentro",
    waitingShuttle: "el conductor va a recogerle",
    cancelled: "vuelo cancelado",
    cancelledHelp: "Llame al parking para acordar un nuevo punto de encuentro.",
    shuttleIn: "lanzadera en",
    shuttleWaiting: "a la espera de su posición",
    shuttleAway: (distance: string) => `a ${distance} de usted`,
    stepLanding: "Aterrizaje",
    stepMeeting: "Encuentro",
    stepShuttle: "Lanzadera",
    meetingPoint: (label: string) => `Punto de encuentro: ${label}`,
    meetingDefault: "punto de encuentro de la lanzadera",
    shuttleLine: (driver: string, vehicle: string | null) =>
      [driver ? `Conductor: ${driver}` : null, vehicle]
        .filter(Boolean)
        .join(" · "),
    position: "Posición",
    carTitle: "Encontrar mi coche",
    carSpot: (code: string) => `Plaza ${code}`,
    carFile: (code: string) => `Fila ${code}`,
    carFilePosition: (position: number) =>
      `${position}.º desde el pasillo`,
    carZone: {
      short: "zona de estancias cortas",
      medium: "zona de estancias medias",
      long: "zona de estancias largas",
    } as Record<string, string>,
    carKeys: "Las llaves le esperan en la recepción del parking.",
    carRoute: "Ruta a pie hasta el parking",
    carRouteToCar: "Ruta a pie hasta mi coche",
    carPosition: (
      by: "traveller" | "staff",
      time: string,
      accuracy: number | null,
    ) =>
      `Posición GPS ${by === "staff" ? "registrada por el parking" : "que usted registró"} a las ${time}${accuracy !== null ? ` (± ${accuracy} m)` : ""}.`,
    carNoSpot: "Su coche",
    offline: "No se puede consultar el estado del regreso por el momento.",
    landedButton: "He aterrizado",
    landedHelp:
      "Sin seguimiento de su vuelo, díganos cuándo ha aterrizado: el parking prepara la lanzadera.",
    instructions: "Indicaciones del parking",
    photoAlt: "Foto del punto de encuentro",
    routeToMeeting: "Cómo llegar al punto de encuentro",
    noticeTitle: "¿Algún problema? Avise al parking",
    noticeHelp: "El conductor y la recepción lo ven al instante en su lista.",
    noticeFlightDelayed: "Mi vuelo lleva retraso",
    noticeLuggage: "Equipaje perdido o retrasado",
    noticeOther: "Otro…",
    noticeOtherPlaceholder: "Cuéntenoslo en pocas palabras (200 caracteres)",
    noticeSend: "Enviar",
    noticeSending: "Enviando…",
    noticeKinds: {
      flight_delayed: "Mi vuelo lleva retraso",
      luggage: "Equipaje perdido o retrasado",
      other: "Su mensaje",
    } as Record<string, string>,
    noticed: (label: string, time: string) =>
      `Enviado al parking a las ${time}: ${label}.`,
    noticeAgain: "Avisar de otra cosa",
  },
  arrival: {
    title: "Avisar de mi llegada",
    notYetOutbound: (when: string) =>
      `El día de la entrega, a partir de ${when}, podrá avisar al parking de su llegada.`,
    notYetReturn: (when: string) =>
      `A la vuelta, a partir de ${when}, podrá decirle al conductor que está en el punto de encuentro.`,
    explainTitle: "Avise al parking de su llegada",
    explainBefore:
      "El aparcacoches le espera en la recepción. Su posición se comparte con el parking ",
    explainOnly: "únicamente",
    explainAfter: " hasta su llegada (2 h como máximo) y después se borra.",
    share: "Estoy en camino — compartir mi posición",
    sharing: "Compartiendo…",
    announceToggle: "Avisar sin compartir mi posición",
    announceIn: (minutes: number) => `Llego en ${minutes} min`,
    returnAnnounceIn: (minutes: number) => `Estaré allí en ${minutes} min`,
    stopAnytime: "Puede dejar de compartir en cualquier momento.",
    live: "Posición compartida con el parking",
    etaLabel: "Llegada estimada",
    etaMinutes: (minutes: number) => `${minutes} min`,
    etaUnknown: "—",
    arrivalAround: (time: string) => `llegada hacia las ${time}`,
    waitingPosition: "Buscando su posición…",
    notified: "El parking ha sido avisado · el aparcacoches le espera en la recepción",
    notifiedReturn: "El conductor ha sido avisado",
    autoStop: (left: string) =>
      `Se detiene automáticamente a su llegada o dentro de ${left}`,
    stop: "Dejar de compartir",
    arrivedTitle: "Ha llegado",
    arrivedText:
      "Se ha dejado de compartir y su posición se ha borrado. El aparcacoches le espera en la recepción.",
    announcedText: (minutes: number, time: string) =>
      `El parking está avisado: llega en ${minutes} min${time ? ` (hacia las ${time})` : ""}.`,
    announcedReturnText: (minutes: number, time: string) =>
      `El conductor está avisado: estará en el punto de encuentro en ${minutes} min${time ? ` (hacia las ${time})` : ""}.`,
    cancelAnnounce: "Cancelar",
    endedExpired:
      "Se ha dejado de compartir al cabo de 2 h y su posición se ha borrado.",
    endedStopped: "Ha dejado de compartir. Su posición se ha borrado.",
    meetingReception: "Recepción",
    meetingReturn: "Punto de encuentro",
    returnExplainTitle: "Avise al conductor",
    returnExplain: (meeting: string) =>
      `Una vez recogido su equipaje, diríjase al punto de encuentro: ${meeting}. El conductor de la lanzadera ve su mensaje en su lista.`,
    atPoint: "Estoy en el punto de encuentro",
    withPosition: "Adjuntar mi posición (una sola vez, para situar el punto)",
    atPointDoneTitle: "El conductor sabe que está allí",
    atPointDoneText: (meeting: string) =>
      `Quédese en el punto de encuentro: ${meeting}. La lanzadera está en camino.`,
    noteLabel: "Una nota para el parking (opcional)",
    notePlaceholder: "Ej. 2 niños, carrito de bebé",
    noteSent: (note: string) => `Su nota: « ${note} »`,
    locationDenied:
      "Sin acceso a su posición, puede avisar al parking sin compartirla.",
    locationUnavailable:
      "Su navegador no da acceso a su posición: avise sin compartirla.",
    errors: {
      arrival_window_closed:
        "Todavía no es el momento, o ya ha pasado: la página se va a actualizar.",
      not_sharing: "Ya no está compartiendo su posición.",
      consent_required:
        "Necesitamos su consentimiento para compartir su posición.",
    } as Record<string, string>,
  },
  stayShuttles: {
    title: "Lanzadera",
    titleLive: (n: number) => `Lanzadera · ${n} en camino`,
    mine: "Su lanzadera",
    vehicle: (colour: string | null) =>
      colour ? `Lanzadera ${colour}` : "Lanzadera",
    driver: (name: string) => `conductor: ${name}`,
    noPosition: "posición pendiente",
    etaParking: (minutes: number) => `a ${minutes} min del parking`,
    etaMeeting: (minutes: number) => `a ${minutes} min del punto de encuentro`,
    direction: {
      pickup: "va a recoger viajeros al aeropuerto",
      dropoff: "lleva viajeros a la terminal",
    } as Record<string, string>,
    none: {
      arrival:
        "Ninguna lanzadera en camino por el momento: a su llegada, el equipo le llevará a la terminal.",
      stay: "Ninguna lanzadera en camino por el momento.",
      return:
        "Ninguna lanzadera en camino por el momento: al aterrizar, avise al parking desde esta página.",
    } as Record<string, string>,
  },
  status: {
    pending_payment: "Pendiente de pago",
    upcoming: "Confirmada",
    arrived: "En curso",
    shuttled_out: "En curso",
    return_requested: "En curso",
    back_at_parking: "En curso",
    returned: "Finalizada",
    cancelled: "Cancelada",
    no_show: "No presentado",
  } satisfies Record<BookingStatus, string>,
  services: {
    shuttle: "Lanzadera gratuita",
    valet: "Aparcacoches",
    covered: "Cubierto",
    ev_charging: "Recarga eléctrica",
    open_24h: "Abierto 24 h",
    fenced: "Vallado",
    cctv: "Videovigilancia",
  } satisfies Record<Service, string>,
  servicesShort: {
    shuttle: "Lanzadera",
    valet: "Aparcacoches",
    covered: "Cubierto",
    ev_charging: "Recarga eléctrica",
    open_24h: "24 h",
    fenced: "Vallado",
    cctv: "Videovigilancia",
  } satisfies Record<Service, string>,
  cancellation: {
    free_until_arrival: "Cancelación gratuita hasta la llegada",
    free_24h: "Cancelación gratuita hasta 24 h antes",
    free_48h: "Cancelación gratuita hasta 48 h antes",
    non_refundable: "No cancelable",
  } satisfies Record<CancellationPolicy, string>,
  cancellationShort: {
    free_until_arrival: "Gratuita hasta la llegada",
    free_24h: "Gratuita 24 h antes",
    free_48h: "Gratuita 48 h antes",
    non_refundable: "No cancelable",
  } satisfies Record<CancellationPolicy, string>,
  calendar: {
    dropOff: (parking: string) => `Entrega del coche · ${parking}`,
    pickUp: (parking: string) => `Regreso · lanzadera ${parking}`,
    description: (reference: string, total: string | null, manageUrl: string) =>
      `Reserva ${reference}. ${total ? `${total} pagados en línea. ` : "Pagada en línea. "}Gestionar la reserva: ${manageUrl}`,
  },
  legal: {
    version: (date: string) => `Versión del ${date}`,
    contents: "Índice",
    terms: "Condiciones generales",
    privacy: "Política de privacidad",
    legalNotice: "Aviso legal",
  },
  notFound: {
    title: "Página no encontrada",
    text: "Esta página no existe o ya no está en línea.",
    home: "Volver al inicio",
  },
  error: {
    title: "El servicio no responde",
    text: "No hemos podido cargar esta página. Inténtelo de nuevo en un momento.",
    retry: "Reintentar",
    home: "Volver al inicio",
  },
  errors: {
    required: "Campo obligatorio.",
    too_long: "Texto demasiado largo.",
    invalid_email: "Dirección de correo electrónico no válida.",
    integer: "Se espera un número entero.",
    invalid_datetime: "Fecha u hora no válida.",
    return_before_arrival: "El regreso debe ser posterior a la entrega.",
    arrival_in_past: "La fecha de entrega ya ha pasado.",
    stay_too_long: "Estancia de más de 90 días.",
    passengers_range: "Entre 1 y 9 pasajeros.",
    invalid_phone: "Número de teléfono no válido.",
    invalid_plate: "Matrícula no válida.",
    invalid_flight: "Número de vuelo no válido (ej. TO 3627).",
    terms_required: "Acepte las condiciones para reservar.",
    invalid_name: "Solo letras, espacios, apóstrofos y guiones.",
    duplicate_booking:
      "Este vehículo ya tiene una reserva en estas fechas. Encuéntrela en « Mi reserva ».",
    too_many_bookings:
      "Ya tiene varias reservas en curso con estos datos. Gestiónelas en « Mi reserva ».",
    invalid_idempotency_key:
      "El formulario ha caducado. Recargue la página e inténtelo de nuevo.",
    invalid_slug: "Dirección no válida.",
    unknown_airport: "Aeropuerto desconocido.",
    validation_failed: "Hay campos que corregir.",
    overbooked:
      "Este parking está completo al menos una noche de su estancia.",
    no_price: "Este parking no tiene tarifa para la duración de su estancia.",
    not_found: "No encontrado.",
    lookup_not_found:
      "Ninguna reserva coincide con este número y este correo electrónico o teléfono.",
    flight_locked: "El vuelo de regreso ya no se puede modificar en línea.",
    child_seats_exceed_passengers:
      "Los niños cuentan como pasajeros: añádalos al número de pasajeros.",
    child_seats_range: "Entre 0 y 4 sillas de cada tipo.",
    child_seats_locked:
      "Las sillas infantiles ya no se pueden modificar en línea: comuníqueselo al parking.",
    cancellation_closed:
      "Esta reserva ya no se puede cancelar en línea.",
    online_booking_unavailable:
      "Este parking todavía no acepta reservas en línea.",
    hold_expired:
      "Se ha agotado el plazo de pago: su plaza ya no está reservada.",
    already_paid:
      "El pago ya se ha realizado: su reserva está confirmada.",
    refund_failed:
      "No se ha podido iniciar el reembolso. Inténtelo de nuevo en un momento; su reserva no se ha cancelado.",
    payments_unavailable:
      "El pago en línea no está disponible temporalmente. Inténtelo de nuevo en un momento.",
    too_many_requests: "Demasiados intentos. Inténtelo de nuevo en unos minutos.",
    rate_limited: "Demasiados intentos. Inténtelo de nuevo en unos minutos.",
    invalid: "Valor no válido.",
    too_short: "Texto demasiado corto.",
    message_too_short: "Al menos 10 caracteres.",
    message_too_long: "Como máximo 2.000 caracteres.",
    consent_required: "Necesitamos su consentimiento para enviarle el boletín.",
    contact_unavailable:
      "El formulario de contacto todavía no está disponible. Recupere su reserva en « Mi reserva ».",
    contact_failed:
      "No se ha podido enviar su mensaje. Inténtelo de nuevo en un momento.",
    newsletter_unavailable:
      "La suscripción al boletín todavía no está disponible. Vuelva pronto.",
    newsletter_failed:
      "No se ha podido completar la suscripción. Inténtelo de nuevo en un momento.",
    too_many_attempts: "Demasiados intentos. Inténtelo de nuevo dentro de 15 minutos.",
    network: "El servicio no responde. Compruebe su conexión e inténtelo de nuevo.",
    server_error:
      "Se ha producido un error por nuestra parte. Inténtelo de nuevo en un momento.",
    unknown: "Se ha producido un error. Inténtelo de nuevo.",
  } as Record<string, string>,
};
