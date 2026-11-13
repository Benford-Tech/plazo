import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma from '@/database';
import { sniffImage } from '@/domain/inspection';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { ParkingService } from './parking.service';
import { PhotoStorageService, StoredPhoto } from './photo-storage.service';

/** The pro space sends a JPEG of 1 600 px at most (~300 KB); 3 MB leaves room for a PNG. */
export const MAX_MEETING_PHOTO_BYTES = 3 * 1024 * 1024;
const MEETING_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FILE_RE = /^[0-9a-f]{18}\.(jpeg|png|webp)$/;

/** The public address of an uploaded photo: the traveller's page and WhatsApp's header read it. */
export function meetingPhotoPath(parkingId: string, key: string): string {
  return `/api/public/parkings/${parkingId}/meeting-photo/${key.split('/').pop()}`;
}

/**
 * The photo of the return meeting point (13/11/2026, « pouvoir uploader la photo du point de rendez-vous », choix A):
 * uploaded by the managers into the photo store, served publicly by Plazo (travellers see it, and WhatsApp's header must
 * reach it over https), under a new file name at each upload so that a long public cache stays right.
 */
@Service()
export class MeetingPhotoService {
  public storage = Container.get(PhotoStorageService);
  public audit = Container.get(AuditService);
  public parkings = Container.get(ParkingService);
  public notifications = Container.get(NotificationService);

  /** POST /internal/parking/return-meeting-point/photo (the image's bytes) */
  public async set(actor: AuthenticatedStaff, body: unknown): Promise<{ photoUrl: string }> {
    if (!Buffer.isBuffer(body) || body.length === 0) throw new ValidationException({ photo: 'required' });
    if (body.length > MAX_MEETING_PHOTO_BYTES) throw new ValidationException({ photo: 'too_large' });
    const contentType = sniffImage(body);
    if (!contentType || !MEETING_PHOTO_TYPES.includes(contentType)) throw new ValidationException({ photo: 'not_an_image' });
    const parking = await this.parkings.getPrimary(actor);
    const previous = await prisma.parking.findUnique({ where: { id: parking.id }, select: { returnMeetingPhotoKey: true } });
    const key = `meeting/${actor.operatorId}/${parking.id}/${randomBytes(9).toString('hex')}.${contentType.split('/')[1]}`;
    await this.storage.put(key, body, contentType);
    const path = meetingPhotoPath(parking.id, key);
    const photoUrl = this.notifications.siteUrl(path) ?? path;
    await prisma.parking.update({ where: { id: parking.id }, data: { returnMeetingPhotoKey: key, returnMeetingPhotoUrl: photoUrl } });
    if (previous?.returnMeetingPhotoKey) await this.storage.remove([previous.returnMeetingPhotoKey]);
    await this.audit.record(actor, { action: 'parking.meeting_photo_set', entityType: 'parking', entityId: parking.id });
    return { photoUrl };
  }

  /** DELETE /internal/parking/return-meeting-point/photo */
  public async remove(actor: AuthenticatedStaff): Promise<void> {
    const parking = await this.parkings.getPrimary(actor);
    const current = await prisma.parking.findUnique({ where: { id: parking.id }, select: { returnMeetingPhotoKey: true } });
    await prisma.parking.update({ where: { id: parking.id }, data: { returnMeetingPhotoKey: null, returnMeetingPhotoUrl: null } });
    if (current?.returnMeetingPhotoKey) await this.storage.remove([current.returnMeetingPhotoKey]);
    await this.audit.record(actor, { action: 'parking.meeting_photo_removed', entityType: 'parking', entityId: parking.id });
  }

  /** GET /public/parkings/:id/meeting-photo/:file — only the photo in use, by its own file name. */
  public async get(parkingId: string, file: string): Promise<StoredPhoto> {
    const notFound = new HttpException(httpStatus.NOT_FOUND, 'No photo', 'photo_not_found');
    if (!FILE_RE.test(file)) throw notFound;
    const parking = await prisma.parking.findUnique({ where: { id: parkingId }, select: { returnMeetingPhotoKey: true } });
    const key = parking?.returnMeetingPhotoKey;
    if (!key || key.split('/').pop() !== file) throw notFound;
    const photo = await this.storage.get(key);
    if (!photo) throw notFound;
    return photo;
  }

  /**
   * The meeting point saved with another photo URL (pasted) or cleared: the uploaded photo is no longer used, so it
   * leaves the store.
   */
  public async forgetUnused(parkingId: string): Promise<void> {
    const parking = await prisma.parking.findUnique({
      where: { id: parkingId },
      select: { returnMeetingPhotoKey: true, returnMeetingPhotoUrl: true },
    });
    const key = parking?.returnMeetingPhotoKey;
    if (!key || (parking.returnMeetingPhotoUrl ?? '').endsWith(meetingPhotoPath(parkingId, key))) return;
    await prisma.parking.update({ where: { id: parkingId }, data: { returnMeetingPhotoKey: null } });
    await this.storage.remove([key]);
  }

  /** The operator's photos, erased with it. */
  public async blobKeysOf(operatorId: string): Promise<string[]> {
    const rows = await prisma.parking.findMany({
      where: { operatorId, returnMeetingPhotoKey: { not: null } },
      select: { returnMeetingPhotoKey: true },
    });
    return rows.map(r => r.returnMeetingPhotoKey!);
  }
}
