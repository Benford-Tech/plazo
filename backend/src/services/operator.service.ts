import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Service } from 'typedi';
import { BCRYPT_ROUNDS } from '@/config';
import prisma, { Prisma } from '@/database';
import { HttpException } from '@/utils/httpException';
import { normalizeEmail } from './auth.service';

export interface OperatorSetup {
  operatorName: string;
  parkingName: string;
  totalCapacity: number;
  managerName: string;
  managerEmail: string;
  /** null: an invited manager, who chooses the password through the invitation link. */
  managerPassword: string | null;
  managerPhone?: string | null;
  /** Platform-side creations are trusted (default); a self sign-up must confirm its email. */
  emailVerified?: boolean;
  /** Plazo's commission for this operator, in basis points (null or absent: the platform default). */
  commissionBps?: number | null;
  /** Airport of the parking: creates its Plazo page as a draft (self sign-up). */
  airportId?: string;
}

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** A listing slug free at the airport: "parking-x", then "parking-x-2", "parking-x-3"… */
async function freeListingSlug(tx: Prisma.TransactionClient, airportId: string, name: string): Promise<string> {
  const base = slugify(name) || 'parking';
  const taken = new Set((await tx.listing.findMany({ where: { airportId, slug: { startsWith: base } }, select: { slug: true } })).map(l => l.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

@Service()
export class OperatorService {
  /**
   * Creates an operator with its first parking and manager account: by the platform (script,
   * invitation) or by the operator itself (sign-up, which also opens a draft Plazo page).
   */
  public async createWithManager(data: OperatorSetup) {
    const email = normalizeEmail(data.managerEmail);
    if (await prisma.staff.findUnique({ where: { email } })) {
      throw new HttpException(httpStatus.CONFLICT, 'This email is already used', 'email_taken');
    }
    // An invited manager gets a random password nobody knows until the invitation is accepted.
    const password = await hash(data.managerPassword ?? randomBytes(32).toString('base64url'), BCRYPT_ROUNDS);
    const baseSlug = slugify(data.operatorName) || 'operateur';
    const slugTaken = await prisma.operator.count({ where: { slug: { startsWith: baseSlug } } });

    try {
      return await prisma.$transaction(async tx => {
        const operator = await tx.operator.create({
          data: {
            name: data.operatorName.trim(),
            slug: slugTaken ? `${baseSlug}-${slugTaken + 1}` : baseSlug,
            commissionBps: data.commissionBps ?? null,
          },
        });
        const parking = await tx.parking.create({
          data: { operatorId: operator.id, name: data.parkingName.trim(), totalCapacity: data.totalCapacity },
        });
        const manager = await tx.staff.create({
          data: {
            operatorId: operator.id,
            email,
            name: data.managerName.trim(),
            phone: data.managerPhone?.trim() || null,
            role: 'manager',
            password,
            emailVerifiedAt: data.emailVerified === false ? null : new Date(),
          },
        });
        const listing = data.airportId
          ? await tx.listing.create({
              data: {
                parkingId: parking.id,
                airportId: data.airportId,
                slug: await freeListingSlug(tx, data.airportId, data.parkingName),
                title: data.parkingName.trim().slice(0, 80),
                services: ['shuttle'],
                photos: [],
              },
            })
          : null;
        return { operator, parking, manager, listing };
      });
    } catch (error) {
      // The same email created at the same moment by another request.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpException(httpStatus.CONFLICT, 'This email is already used', 'email_taken');
      }
      throw error;
    }
  }
}
