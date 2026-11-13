import prisma from '@/database';
import { isTestOperatorName } from '@/domain/test-feed';

/** Operators known to be (or not to be) the prospects' demo (21/10/2026): one query per operator and server instance. */
const known = new Map<string, boolean>();

/** Whether an operator is the prospects' demo, whose SMS and e-mails are never sent (outbound guards). */
export async function isProspectDemoOperator(operatorId: string): Promise<boolean> {
  const cached = known.get(operatorId);
  if (cached !== undefined) return cached;
  const row = await prisma.operator.findUnique({ where: { id: operatorId }, select: { prospectDemo: true } });
  const demo = !!row?.prospectDemo;
  known.set(operatorId, demo);
  return demo;
}

/** After the nightly reset (the demo operator gets a new id). */
export function forgetDemoOperators(): void {
  known.clear();
  silent.clear();
}

/** Operators known to be silent (or not): one query per operator and server instance. */
const silent = new Map<string, boolean>();

/**
 * Whether nothing may reach an operator's travellers (13/11/2026, « pas d'envoi sur le parking de test »): the prospects'
 * demo and the platform's test operator (« … (tests) »), whose bookings are fictional or typed for trials. Their SMS,
 * WhatsApp messages and e-mails to travellers are never sent; the team still works as usual.
 */
export async function isSilentOperator(operatorId: string): Promise<boolean> {
  const cached = silent.get(operatorId);
  if (cached !== undefined) return cached;
  const row = await prisma.operator.findUnique({ where: { id: operatorId }, select: { prospectDemo: true, name: true } });
  const value = !!row && (row.prospectDemo || isTestOperatorName(row.name));
  silent.set(operatorId, value);
  return value;
}

/** isSilentOperator for the operator of a booking known by its reference (the booking e-mails carry no operator). */
export async function isSilentBooking(reference: string): Promise<boolean> {
  const row = await prisma.reservation.findFirst({ where: { reference }, select: { operatorId: true } });
  return !!row && isSilentOperator(row.operatorId);
}
