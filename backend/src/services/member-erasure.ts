import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import { Container } from 'typedi';
import { BCRYPT_ROUNDS } from '@/config';
import prisma, { Prisma, StaffRole } from '@/database';
import { DELETED_ACCOUNT_NAME, deletedEmail } from '@/domain/join-request';
import { AuditService } from './audit.service';

type Tx = Prisma.TransactionClient;
type Client = Tx | typeof prisma;

/** The member as the erasure needs it. */
export interface ErasedMember {
  id: string;
  operatorId: string;
  role: StaffRole;
  email: string;
}

/** A random password hash nobody knows: the member can no longer sign in with a password. */
export function unusablePassword(): Promise<string> {
  return hash(randomBytes(32).toString('base64url'), BCRYPT_ROUNDS);
}

/** Everything that lets the person act as a member: sessions, account links, phones, the usual shuttle. */
export async function detachMember(tx: Tx, staffId: string) {
  await tx.staffToken.deleteMany({ where: { staffId } });
  await tx.accountToken.deleteMany({ where: { staffId } });
  await tx.staffDevice.deleteMany({ where: { staffId } });
  await tx.shuttleVehicle.updateMany({ where: { driverId: staffId }, data: { driverId: null } });
}

/**
 * « Compte supprimé » (13/10/2026): the member's names, address, phone and password go, the row stays (trips and
 * reservations handled keep their history). Their sessions, links and phones are deleted, the login attempts kept for
 * their addresses (`emails`: the earlier ones too, e.g. the one of a join request) and the names in the earlier audit
 * entries about them (renamings) are removed. Recorded as `staff.deleted`, without personal data.
 */
export async function anonymiseMember(tx: Tx, member: ErasedMember, password: string, options: { emails?: string[] } = {}) {
  await tx.staff.update({
    where: { id: member.id },
    data: {
      firstName: '',
      lastName: '',
      name: DELETED_ACCOUNT_NAME,
      email: deletedEmail(member.id),
      phone: null,
      password,
      passwordSetAt: null,
      emailVerifiedAt: null,
      isActive: false,
      deletedAt: new Date(),
      post: null,
      postSetAt: null,
      vehicleId: null,
      vehicleSetAt: null,
    },
  });
  await detachMember(tx, member.id);
  const emails = [...new Set([member.email, ...(options.emails ?? [])])];
  await tx.loginAttempt.deleteMany({ where: { email: { in: emails } } });
  await tx.$executeRaw`UPDATE "audit_logs" SET "details" = "details" - 'name' WHERE "entityId" = ${member.id} AND "action" IN ('staff.updated', 'staff.renamed')`;
  await Container.get(AuditService).record(
    { id: member.id, operatorId: member.operatorId },
    { action: 'staff.deleted', entityType: 'staff', entityId: member.id, details: { role: member.role } },
    tx,
  );
}

/**
 * The members a person left behind with these Apple / Google identities (« Quitter ce parking », then maybe another
 * parking): the accepted requests of the identities name them. Not deleted yet, never `exceptStaffId`. With the address
 * of each request (their login attempts go too).
 */
export async function formerMembersOf(client: Client, identityIds: string[], exceptStaffId?: string) {
  if (!identityIds.length) return [];
  const requests = await client.staffJoinRequest.findMany({
    where: { identityId: { in: identityIds }, status: 'accepted', staffId: { not: null }, staff: { leftAt: { not: null }, deletedAt: null } },
    select: { email: true, staff: { select: { id: true, operatorId: true, role: true, email: true } } },
  });
  const found = new Map<string, { member: ErasedMember; emails: string[] }>();
  for (const request of requests) {
    if (!request.staff || request.staff.id === exceptStaffId) continue;
    const entry = found.get(request.staff.id) ?? { member: request.staff, emails: [] };
    entry.emails.push(request.email);
    found.set(request.staff.id, entry);
  }
  return [...found.values()];
}
