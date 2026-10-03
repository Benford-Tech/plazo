import { CancellationPolicy } from '@/database';
import { Service } from './listing';

/**
 * Fictional operators around Lyon Saint-Exupéry, created by `scripts/seed-demo.ts` so the site and
 * the apps can be tried with a realistic list of parkings. Every name, address, phone and traveller
 * is made up; the photos are royalty-free pictures from Pexels (checked to exist).
 */

export const DEMO_AIRPORT_CODE = 'LYS';
/** Domain of every demo account: never a real mailbox. */
export const DEMO_EMAIL_DOMAIN = 'plazo.test';
export const DEMO_MANAGER_NAME = 'Gérant démo';
export const DEMO_SLUG_PREFIX = 'demo-';

const pexels = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
const PHOTOS = {
  aerialLot: pexels(753876),
  aerialLane: pexels(1004409),
  garage: pexels(1756957),
  coveredLevel: pexels(1000633),
  parkedRow: pexels(164634),
  plane: pexels(358319),
  terminal: pexels(2026324),
  tarmac: pexels(723240),
};

export interface DemoOperator {
  /** Operator slug (prefixed by `demo-`): the idempotency key of the seed. */
  slug: string;
  name: string;
  parkingName: string;
  address: string;
  location: { lat: number; lng: number };
  totalCapacity: number;
  shuttleTravelMinutes: number;
  listing: {
    slug: string;
    title: string;
    description: string;
    services: Service[];
    shuttleMinutes: number;
    distanceKm: number;
    openingHours: string;
    contactPhone: string;
    cancellationPolicy: CancellationPolicy;
    photos: string[];
  };
  /** Package grid: "up to N days" for N = 1…15, built from a first-day price and a day rate. */
  pricing: { firstDayCents: number; dayCents: number };
  meetingPoint: { label: string; instructions: string; location: { lat: number; lng: number } };
  shuttle: { model: string; colour: string; plate: string };
}

/** Terminal 1 and Terminal 2 pick-up points (roughly), for the return meeting points. */
const T1 = { lat: 45.7187, lng: 5.0819 };
const T2 = { lat: 45.7206, lng: 5.0797 };

export const DEMO_OPERATORS: DemoOperator[] = [
  {
    slug: 'demo-parkair-lyon',
    name: 'Parkair Lyon',
    parkingName: 'Parkair Lyon',
    address: '14 chemin des Aviateurs, 69720 Saint-Laurent-de-Mure',
    location: { lat: 45.6895, lng: 5.0505 },
    totalCapacity: 320,
    shuttleTravelMinutes: 8,
    listing: {
      slug: 'parkair-lyon',
      title: 'Parkair Lyon',
      description:
        'Parking extérieur clôturé à 4 km des terminaux, ouvert 24h/24 et surveillé par vidéo. La navette gratuite vous dépose devant votre terminal en 8 minutes, départ dès votre arrivée. Au retour, appelez-nous à l’atterrissage : nous venons vous chercher à l’arrêt des navettes. Annulation gratuite jusqu’à 24 h avant votre arrivée.',
      services: ['shuttle', 'open_24h', 'fenced', 'cctv'],
      shuttleMinutes: 8,
      distanceKm: 4.2,
      openingHours: '24h/24',
      contactPhone: '04 72 00 00 01',
      cancellationPolicy: 'free_24h',
      photos: [PHOTOS.aerialLot, PHOTOS.plane],
    },
    pricing: { firstDayCents: 900, dayCents: 400 },
    meetingPoint: {
      label: 'Terminal 1 · Arrêt navettes',
      instructions: 'À la sortie du hall d’arrivée du Terminal 1, suivez « Navettes parkings » : notre minibus blanc s’arrête à l’arrêt n° 3.',
      location: T1,
    },
    shuttle: { model: 'Mercedes Vito', colour: 'blanc', plate: 'GH-456-JK' },
  },
  {
    slug: 'demo-aeroparc-saint-exupery',
    name: 'Aéroparc Saint-Exupéry',
    parkingName: 'Aéroparc Saint-Exupéry',
    address: '3 rue de l’Aviation, 69125 Colombier-Saugnieu',
    location: { lat: 45.7312, lng: 5.0598 },
    totalCapacity: 240,
    shuttleTravelMinutes: 5,
    listing: {
      slug: 'aeroparc-saint-exupery',
      title: 'Aéroparc Saint-Exupéry',
      description:
        'Parking couvert à 2 km de l’aéroport, avec voiturier : vous nous laissez les clés à l’accueil et nous garons votre voiture à l’abri. Bornes de recharge pour les véhicules électriques, navette toutes les 10 minutes vers les terminaux. Au retour, votre voiture vous attend devant l’accueil. Annulation gratuite jusqu’à 48 h avant.',
      services: ['shuttle', 'valet', 'covered', 'ev_charging', 'cctv'],
      shuttleMinutes: 5,
      distanceKm: 2.1,
      openingHours: '4h – 1h',
      contactPhone: '04 72 00 00 02',
      cancellationPolicy: 'free_48h',
      photos: [PHOTOS.coveredLevel, PHOTOS.terminal],
    },
    pricing: { firstDayCents: 1900, dayCents: 800 },
    meetingPoint: {
      label: 'Terminal 2 · Porte 12',
      instructions: 'Sortez par la porte 12 du Terminal 2 (niveau arrivées) : le voiturier vous attend sur le trottoir avec un panneau Aéroparc.',
      location: T2,
    },
    shuttle: { model: 'Renault Trafic', colour: 'gris', plate: 'FK-208-LM' },
  },
  {
    slug: 'demo-les-hangars-de-colombier',
    name: 'Les Hangars de Colombier',
    parkingName: 'Les Hangars de Colombier',
    address: '210 route de Lyon, 69125 Colombier-Saugnieu',
    location: { lat: 45.7425, lng: 5.0035 },
    totalCapacity: 400,
    shuttleTravelMinutes: 12,
    listing: {
      slug: 'les-hangars-de-colombier',
      title: 'Les Hangars de Colombier',
      description:
        'Grand parking extérieur sur une ancienne zone agricole, à 7 km des terminaux. La navette part toutes les 15 minutes et met 12 minutes jusqu’à l’aéroport. Lavage intérieur et extérieur en option pendant votre voyage, à régler sur place. Annulation gratuite jusqu’à 24 h avant votre arrivée.',
      services: ['shuttle', 'fenced'],
      shuttleMinutes: 12,
      distanceKm: 6.8,
      openingHours: '5h – 0h',
      contactPhone: '04 72 00 00 03',
      cancellationPolicy: 'free_24h',
      photos: [PHOTOS.parkedRow, PHOTOS.aerialLot],
    },
    pricing: { firstDayCents: 1200, dayCents: 500 },
    meetingPoint: {
      label: 'Terminal 1 · Arrêt navettes',
      instructions:
        'Rendez-vous à l’arrêt des navettes parkings du Terminal 1, à droite en sortant du hall d’arrivée. Navette verte « Les Hangars ».',
      location: T1,
    },
    shuttle: { model: 'Ford Transit', colour: 'vert', plate: 'EZ-731-PA' },
  },
  {
    slug: 'demo-parking-premium-terminal',
    name: 'Parking Premium Terminal',
    parkingName: 'Parking Premium Terminal',
    address: '8 avenue Louis-Blériot, 69125 Colombier-Saugnieu',
    location: { lat: 45.7268, lng: 5.0702 },
    totalCapacity: 120,
    shuttleTravelMinutes: 4,
    listing: {
      slug: 'parking-premium-terminal',
      title: 'Parking Premium Terminal',
      description:
        'Le plus proche des terminaux : parking couvert et gardienné à 1,5 km, ouvert 24h/24. Un voiturier prend votre voiture devant l’accueil et la navette privée vous dépose à votre terminal en 4 minutes. Au retour, votre véhicule est avancé avant même votre arrivée. Tarif non remboursable.',
      services: ['shuttle', 'valet', 'covered', 'open_24h', 'fenced', 'cctv'],
      shuttleMinutes: 4,
      distanceKm: 1.5,
      openingHours: '24h/24',
      contactPhone: '04 72 00 00 04',
      cancellationPolicy: 'non_refundable',
      photos: [PHOTOS.garage, PHOTOS.tarmac],
    },
    pricing: { firstDayCents: 2900, dayCents: 1200 },
    meetingPoint: {
      label: 'Terminal 2 · Porte 12',
      instructions: 'Porte 12 du Terminal 2, côté arrivées : notre voiturier vous attend devant l’entrée avec votre voiture ou la navette noire.',
      location: T2,
    },
    shuttle: { model: 'Mercedes Classe V', colour: 'noir', plate: 'GA-115-RT' },
  },
  {
    slug: 'demo-ecopark-pusignan',
    name: 'EcoPark Pusignan',
    parkingName: 'EcoPark Pusignan',
    address: '45 route de Jonage, 69330 Pusignan',
    location: { lat: 45.7905, lng: 5.0475 },
    totalCapacity: 350,
    shuttleTravelMinutes: 15,
    listing: {
      slug: 'ecopark-pusignan',
      title: 'EcoPark Pusignan',
      description:
        'Le parking économique de la plaine de l’Est : terrain extérieur clôturé à 9 km de l’aéroport, idéal pour les longs séjours. Navette gratuite en 15 minutes, de 5h à 23h, sur réservation. Au retour, prévenez-nous dès l’atterrissage et attendez la navette à l’arrêt du Terminal 1. Annulation gratuite jusqu’à 7 jours avant.',
      services: ['shuttle', 'fenced'],
      shuttleMinutes: 15,
      distanceKm: 9,
      openingHours: '5h – 23h',
      contactPhone: '04 72 00 00 05',
      cancellationPolicy: 'free_until_arrival',
      photos: [PHOTOS.aerialLane, PHOTOS.terminal],
    },
    pricing: { firstDayCents: 1000, dayCents: 440 },
    meetingPoint: {
      label: 'Terminal 1 · Arrêt navettes',
      instructions: 'Arrêt des navettes parkings du Terminal 1 (sortie du hall d’arrivée, à droite). Navette bleue EcoPark, toutes les 20 minutes.',
      location: T1,
    },
    shuttle: { model: 'Renault Master', colour: 'bleu', plate: 'HB-902-CS' },
  },
];

/** Longest package of a demo grid, in days. */
export const DEMO_MAX_TIER_DAYS = 15;

/**
 * "Up to N days" packages, N = 1…15: the first day costs more than the following ones, and days
 * beyond the seventh are 10 % cheaper. The extra day (beyond 15) is the plain day rate.
 */
export function demoPricing(pricing: DemoOperator['pricing']): { tiers: { days: number; priceCents: number }[]; extraDayPriceCents: number } {
  const tiers = [];
  for (let days = 1; days <= DEMO_MAX_TIER_DAYS; days += 1) {
    const regular = Math.min(days - 1, 6);
    const discounted = Math.max(days - 7, 0);
    tiers.push({ days, priceCents: Math.round(pricing.firstDayCents + regular * pricing.dayCents + discounted * pricing.dayCents * 0.9) });
  }
  return { tiers, extraDayPriceCents: pricing.dayCents };
}

export interface DemoBooking {
  /** Fixed reference: the idempotency key of the booking. */
  reference: string;
  /** Drop-off, in days from today, and the length of the stay in days. */
  arrivalInDays: number;
  stayDays: number;
  arrivalTime: string;
  returnTime: string;
  passengers: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  plate: string;
  returnFlight: string;
}

/** Bookings of the first demo operator, so the pro space and app have a planning to show. */
export const DEMO_BOOKINGS: DemoBooking[] = [
  {
    reference: 'RDEMX1',
    arrivalInDays: 0,
    stayDays: 4,
    arrivalTime: '07:30',
    returnTime: '18:45',
    passengers: 2,
    customerName: 'Camille Martin',
    customerPhone: '+33 6 00 00 00 01',
    customerEmail: `voyageur-1@${DEMO_EMAIL_DOMAIN}`,
    plate: 'AB-123-CD',
    returnFlight: 'TO 3627',
  },
  {
    reference: 'RDEMX2',
    arrivalInDays: 2,
    stayDays: 7,
    arrivalTime: '05:50',
    returnTime: '22:10',
    passengers: 4,
    customerName: 'Julien Bernard',
    customerPhone: '+33 6 00 00 00 02',
    customerEmail: `voyageur-2@${DEMO_EMAIL_DOMAIN}`,
    plate: 'EF-456-GH',
    returnFlight: 'EJU 4412',
  },
  {
    reference: 'RDEMX3',
    arrivalInDays: 10,
    stayDays: 2,
    arrivalTime: '14:15',
    returnTime: '11:30',
    passengers: 1,
    customerName: 'Inès Rousseau',
    customerPhone: '+33 6 00 00 00 03',
    customerEmail: `voyageur-3@${DEMO_EMAIL_DOMAIN}`,
    plate: 'JK-789-LM',
    returnFlight: 'AF 7640',
  },
];
