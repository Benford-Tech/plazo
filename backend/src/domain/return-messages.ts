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

/** E (06/10/2026): what a traveller can signal on the return day, and how the staff reads it. */
export const RETURN_NOTICE_LABELS = {
  flight_delayed: 'Mon vol a du retard',
  luggage: 'Bagage perdu ou retardé',
  other: 'Un mot du voyageur',
} as const;
export type ReturnNoticeKind = keyof typeof RETURN_NOTICE_LABELS;

export function returnNoticePush(input: { customerName: string; plate: string; kind: ReturnNoticeKind; text: string | null }): PushMessage {
  const who = shortName(input.customerName);
  const text = input.text?.trim();
  const what =
    input.kind === 'other'
      ? text
        ? `« ${text} »`
        : RETURN_NOTICE_LABELS.other
      : `${RETURN_NOTICE_LABELS[input.kind].toLowerCase()}${text ? ` · « ${text} »` : ''}`;
  return { title: `Retour : ${RETURN_NOTICE_LABELS[input.kind]}`, body: `${who} : ${what} · ${input.plate}` };
}

/** The notice as the traveller, the driver's list and the operational card read it. */
export interface ReturnNotice {
  kind: ReturnNoticeKind;
  text: string | null;
  at: string;
}

export const returnNoticeView = (r: {
  returnNoticeKind: ReturnNoticeKind | null;
  returnNoticeText: string | null;
  returnNoticeAt: Date | null;
}): ReturnNotice | null =>
  r.returnNoticeKind && r.returnNoticeAt ? { kind: r.returnNoticeKind, text: r.returnNoticeText, at: r.returnNoticeAt.toISOString() } : null;
