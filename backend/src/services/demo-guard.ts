import prisma from '@/database';

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
}
