import { shortName } from './arrival';
import { PushMessage } from './arrival-messages';

/** Messages of the return day: the push to the staff and the SMS to the traveller when the flight lands. */

export interface LandedPushInput {
  flight: string | null;
  customerName: string;
  plate: string;
  /** "tracking": the flight API saw it land; "traveller": the traveller tapped "J'ai atterri". */
  source: 'tracking' | 'traveller';
  landedAt: string; // "10:02", local time
}

export function landedPush(input: LandedPushInput): PushMessage {
  const who = shortName(input.customerName);
  const flight = input.flight ? `Vol ${input.flight}` : 'Vol';
  return input.source === 'tracking'
    ? { title: `${flight} atterri`, body: `${flight} atterri · ${who} · ${input.plate} · ${input.landedAt}` }
    : { title: 'Client atterri', body: `${who} a atterri (${input.flight ?? 'vol'}) · ${input.plate} · ${input.landedAt}` };
}

export interface LandedSmsInput {
  productName: string;
  parkingName: string;
  meetingLabel: string | null;
  instructions: string | null;
  phone: string | null;
  manageUrl: string | null;
}

/** "Plazo : votre vol a atterri. Rendez-vous : Terminal 1 · Porte 12. …" (short: one or two segments). */
export function landedSms(input: LandedSmsInput): string {
  const parts = [`${input.productName} : votre vol a atterri.`];
  parts.push(input.meetingLabel ? `Rendez-vous navette : ${input.meetingLabel}.` : `Rendez-vous au point navette de ${input.parkingName}.`);
  if (input.instructions) parts.push(input.instructions.trim().slice(0, 160));
  if (input.manageUrl) parts.push(`Votre reservation : ${input.manageUrl}`);
  if (input.phone) parts.push(`Parking : ${input.phone}`);
  return parts.join(' ');
}
