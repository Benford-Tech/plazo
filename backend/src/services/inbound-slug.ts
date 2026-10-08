import { randomBytes } from 'crypto';
import { Prisma } from '@/database';
import { newInboundSlug } from '@/domain/inbound-email';

/**
 * The local part of an operator's inbound address (<slug>@INBOUND_EMAIL_DOMAIN), free among all operators.
 * Every operator gets one when it is created (08/10/2026: no activation step any more; the migration
 * `inbound_slug_for_all` gave one to the operators created before), and a new one on request.
 */
export async function allocateInboundSlug(db: Prisma.TransactionClient, base: string): Promise<string> {
  for (;;) {
    // 8 hex characters (32 bits of randomness; 4 until 08/10/2026): the operator's slug is public on the site.
    const slug = newInboundSlug(base, () => randomBytes(4).toString('hex'));
    if (!(await db.operator.findUnique({ where: { inboundSlug: slug }, select: { id: true } }))) return slug;
  }
}
