import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma from '@/database';
import { sniffImage } from '@/domain/inspection';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { PhotoStorageService, StoredPhoto } from './photo-storage.service';

/** The pro space crops to a 512 px square JPEG (~100 KB); 2 MB leaves room for a PNG or a larger square. */
export const MAX_STAFF_PHOTO_BYTES = 2 * 1024 * 1024;
/** Browsers draw these; a HEIC from an iPhone is converted by the pro space before it is sent. */
const STAFF_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * A member's photo (30/10/2026, « pouvoir mettre sa photo »): set and removed by the member, seen by their team in the
 * menu, Équipe and wherever a first name stands for someone. Kept in the private photo store, never a public link.
 */
@Service()
export class StaffPhotoService {
  public storage = Container.get(PhotoStorageService);
  public audit = Container.get(AuditService);

  /** POST /internal/staff/me/photo (the image's bytes) */
  public async set(actor: AuthenticatedStaff, body: unknown): Promise<{ photoUpdatedAt: string }> {
    if (!Buffer.isBuffer(body) || body.length === 0) throw new ValidationException({ photo: 'required' });
    if (body.length > MAX_STAFF_PHOTO_BYTES) throw new ValidationException({ photo: 'too_large' });
    const contentType = sniffImage(body);
    if (!contentType || !STAFF_PHOTO_TYPES.includes(contentType)) throw new ValidationException({ photo: 'not_an_image' });
    const previous = await prisma.staff.findUnique({ where: { id: actor.id }, select: { photoKey: true } });
    const key = `staff/${actor.operatorId}/${actor.id}/${randomBytes(9).toString('hex')}.${contentType.split('/')[1]}`;
    await this.storage.put(key, body, contentType);
    const updated = await prisma.staff.update({
      where: { id: actor.id },
      data: { photoKey: key, photoUpdatedAt: new Date() },
      select: { photoUpdatedAt: true },
    });
    if (previous?.photoKey) await this.storage.remove([previous.photoKey]);
    await this.audit.record(actor, { action: 'staff.photo_set', entityType: 'staff', entityId: actor.id });
    return { photoUpdatedAt: updated.photoUpdatedAt!.toISOString() };
  }

  /** DELETE /internal/staff/me/photo */
  public async remove(actor: AuthenticatedStaff): Promise<void> {
    const current = await prisma.staff.findUnique({ where: { id: actor.id }, select: { photoKey: true } });
    if (!current?.photoKey) return;
    await prisma.staff.update({ where: { id: actor.id }, data: { photoKey: null, photoUpdatedAt: null } });
    await this.storage.remove([current.photoKey]);
    await this.audit.record(actor, { action: 'staff.photo_removed', entityType: 'staff', entityId: actor.id });
  }

  /** GET /internal/staff/:id/photo: a member of the actor's operator (one who left keeps their name, not their photo). */
  public async get(actor: AuthenticatedStaff, staffId: string): Promise<StoredPhoto> {
    const member = await prisma.staff.findFirst({
      where: { id: staffId, operatorId: actor.operatorId, deletedAt: null, leftAt: null },
      select: { photoKey: true },
    });
    const photo = member?.photoKey ? await this.storage.get(member.photoKey) : null;
    if (!photo) throw new HttpException(httpStatus.NOT_FOUND, 'No photo', 'photo_not_found');
    return photo;
  }

  /** The operator's photos, erased with it. */
  public async blobKeysOf(operatorId: string): Promise<string[]> {
    const rows = await prisma.staff.findMany({ where: { operatorId, photoKey: { not: null } }, select: { photoKey: true } });
    return rows.map(r => r.photoKey!);
  }
}
