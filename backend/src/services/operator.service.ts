import { hash } from 'bcrypt';
import httpStatus from 'http-status';
import { Service } from 'typedi';
import { BCRYPT_ROUNDS } from '@/config';
import prisma from '@/database';
import { HttpException } from '@/utils/httpException';
import { normalizeEmail } from './auth.service';

export interface OperatorSetup {
  operatorName: string;
  parkingName: string;
  totalCapacity: number;
  managerName: string;
  managerEmail: string;
  managerPassword: string;
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

@Service()
export class OperatorService {
  /** Onboards an operator with its first parking and manager account (platform-side, not self-service). */
  public async createWithManager(data: OperatorSetup) {
    const email = normalizeEmail(data.managerEmail);
    if (await prisma.staff.findUnique({ where: { email } })) {
      throw new HttpException(httpStatus.CONFLICT, 'This email is already used', 'email_taken');
    }
    const password = await hash(data.managerPassword, BCRYPT_ROUNDS);
    const baseSlug = slugify(data.operatorName) || 'operateur';
    const slugTaken = await prisma.operator.count({ where: { slug: { startsWith: baseSlug } } });

    return prisma.$transaction(async tx => {
      const operator = await tx.operator.create({
        data: { name: data.operatorName.trim(), slug: slugTaken ? `${baseSlug}-${slugTaken + 1}` : baseSlug },
      });
      const parking = await tx.parking.create({
        data: { operatorId: operator.id, name: data.parkingName.trim(), totalCapacity: data.totalCapacity },
      });
      const manager = await tx.staff.create({
        data: { operatorId: operator.id, email, name: data.managerName.trim(), role: 'manager', password },
      });
      return { operator, parking, manager };
    });
  }
}
