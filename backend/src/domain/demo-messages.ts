/**
 * 18/11/2026 (« Simule les messages reçus sur les env de démo »): the messages the prospects' demo shows in « Messages ».
 * Fictional travellers of the demo's own bookings (DEMO bookings of prospect-demo.service.ts, in that order), their
 * numbers in the 06 39 98 range that no SMS ever reaches; a few conversations seeded with the demo, then one new message
 * from the pool every DEMO_MESSAGE_EVERY_MIN minutes while someone looks.
 */

export type DemoChannel = 'whatsapp' | 'sms' | 'app';

export interface DemoLine {
  /** in: the traveller; out: the demo's team (Sami, at the desk). */
  dir: 'in' | 'out';
  text: string;
  /** How long before the seeding. */
  minutesAgo: number;
}

export interface DemoThread {
  /** Index of the demo booking (0 to 4). */
  booking: number;
  channel: DemoChannel;
  lines: DemoLine[];
  handled?: boolean;
}

/** The demo's travellers write from these numbers (the fictional 06 39 98 range of its bookings). */
export const demoPhone = (booking: number): string => `+3363998000${booking + 1}`;

export const DEMO_THREADS: DemoThread[] = [
  {
    booking: 0,
    channel: 'whatsapp',
    handled: true,
    lines: [
      { dir: 'in', text: 'Bonjour, je dépose ma voiture après-demain vers 6 h 30. La navette part aussi tôt ?', minutesAgo: 26 * 60 },
      { dir: 'out', text: 'Bonjour Camille, oui : la navette tourne dès 5 h. Présentez-vous à l’accueil, on vous attend.', minutesAgo: 25 * 60 + 40 },
      { dir: 'in', text: 'Parfait, merci beaucoup !', minutesAgo: 25 * 60 + 30 },
    ],
  },
  {
    booking: 1,
    channel: 'sms',
    lines: [{ dir: 'in', text: 'Bonjour, mon vol retour a 2 h de retard, arrivée prévue vers 23 h 40. Vous serez là ?', minutesAgo: 35 }],
  },
  {
    booking: 2,
    channel: 'app',
    lines: [{ dir: 'in', text: 'Bonjour, est-ce possible d’avoir un siège bébé dans la navette ? Ma fille a 8 mois.', minutesAgo: 2 * 60 }],
  },
  {
    booking: 3,
    channel: 'whatsapp',
    lines: [
      { dir: 'in', text: 'Bonjour, je viens avec un coffre de toit, ça passe sur le parking ?', minutesAgo: 5 * 60 },
      { dir: 'out', text: 'Bonjour Thomas, aucun souci, le parking est en plein air.', minutesAgo: 4 * 60 + 50 },
    ],
    handled: true,
  },
  {
    booking: 4,
    channel: 'whatsapp',
    lines: [{ dir: 'in', text: 'Bonsoir, je n’ai pas reçu le code pour signer le contrat, vous pouvez le renvoyer ?', minutesAgo: 12 }],
  },
];

/** A new message every 20 minutes while the demo is open (a slot is one message, never twice). */
export const DEMO_MESSAGE_EVERY_MIN = 20;

/** What arrives next, in turn. */
export const DEMO_POOL: { booking: number; channel: DemoChannel; text: string }[] = [
  { booking: 0, channel: 'whatsapp', text: 'Je suis devant l’entrée du parking, je sonne où ?' },
  { booking: 1, channel: 'sms', text: 'Atterri ! On récupère les bagages, on est au point de rendez-vous dans 15 min.' },
  { booking: 2, channel: 'app', text: 'Est-ce que je peux faire laver la voiture pendant mon séjour ?' },
  { booking: 3, channel: 'whatsapp', text: 'Bonjour, je voudrais décaler mon retour d’un jour, c’est possible ?' },
  { booking: 4, channel: 'whatsapp', text: 'Merci, j’ai bien reçu le code. À demain !' },
  { booking: 1, channel: 'sms', text: 'Je suis au point de rendez-vous, Terminal 1, la navette arrive bientôt ?' },
  { booking: 0, channel: 'whatsapp', text: 'J’ai oublié mes lunettes de soleil dans la voiture, vous pourrez les mettre de côté ?' },
  { booking: 2, channel: 'app', text: 'Nous serons 3 adultes et un bébé finalement, c’est bon pour la navette ?' },
  { booking: 3, channel: 'whatsapp', text: 'Top l’accueil ce matin, merci à toute l’équipe 👍' },
  { booking: 4, channel: 'whatsapp', text: 'Mon vol aller est avancé de 30 min, je passe vers 7 h au lieu de 7 h 30.' },
];

/** The slot of an instant: one message per slot. */
export const demoSlot = (now: Date): number => Math.floor(now.getTime() / (DEMO_MESSAGE_EVERY_MIN * 60000));

export const demoPoolLine = (slot: number) => DEMO_POOL[((slot % DEMO_POOL.length) + DEMO_POOL.length) % DEMO_POOL.length];
