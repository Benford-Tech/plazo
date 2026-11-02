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

/** The pro space and Plazo Pro send a 512 px square PNG; 2 MB leaves room for a larger one. */
export const MAX_OPERATOR_LOGO_BYTES = 2 * 1024 * 1024;
/** Images every browser and phone draws; SVG is refused (scripts) and converted by the pro space before it is sent. */
const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * The parking's logo (02/11/2026, « pouvoir personnaliser Plazo avec l'icône du parking », direction B): set and removed
 * by a manager, shown to the whole team next to the Plazo Pro sign. Kept in the private photo store, never a public link,
 * never shown to travellers.
 */
@Service()
export class OperatorLogoService {
  public storage = Container.get(PhotoStorageService);
  public audit = Container.get(AuditService);

  /** POST /internal/operator/logo (the image's bytes) */
  public async set(actor: AuthenticatedStaff, body: unknown): Promise<{ logoUpdatedAt: string }> {
    if (!Buffer.isBuffer(body) || body.length === 0) throw new ValidationException({ logo: 'required' });
    if (body.length > MAX_OPERATOR_LOGO_BYTES) throw new ValidationException({ logo: 'too_large' });
    const contentType = sniffImage(body);
    if (!contentType || !LOGO_TYPES.includes(contentType)) throw new ValidationException({ logo: 'not_an_image' });
    const previous = await prisma.operator.findUnique({ where: { id: actor.operatorId }, select: { logoKey: true } });
    const key = `operators/${actor.operatorId}/logo-${randomBytes(9).toString('hex')}.${contentType.split('/')[1]}`;
    await this.storage.put(key, body, contentType);
    const updated = await prisma.operator.update({
      where: { id: actor.operatorId },
      data: { logoKey: key, logoUpdatedAt: new Date() },
      select: { logoUpdatedAt: true },
    });
    if (previous?.logoKey) await this.storage.remove([previous.logoKey]);
    await this.audit.record(actor, { action: 'operator.logo_set', entityType: 'operator', entityId: actor.operatorId });
    return { logoUpdatedAt: updated.logoUpdatedAt!.toISOString() };
  }

  /** DELETE /internal/operator/logo */
  public async remove(actor: AuthenticatedStaff): Promise<void> {
    const current = await prisma.operator.findUnique({ where: { id: actor.operatorId }, select: { logoKey: true } });
    if (!current?.logoKey) return;
    await prisma.operator.update({ where: { id: actor.operatorId }, data: { logoKey: null, logoUpdatedAt: null } });
    await this.storage.remove([current.logoKey]);
    await this.audit.record(actor, { action: 'operator.logo_removed', entityType: 'operator', entityId: actor.operatorId });
  }

  /** GET /internal/operator/logo: the actor's operator's logo; 404 logo_not_found when it has none. */
  public async get(actor: AuthenticatedStaff): Promise<StoredPhoto> {
    const operator = await prisma.operator.findUnique({ where: { id: actor.operatorId }, select: { logoKey: true } });
    const logo = operator?.logoKey ? await this.storage.get(operator.logoKey) : null;
    if (!logo) throw new HttpException(httpStatus.NOT_FOUND, 'No logo', 'logo_not_found');
    return logo;
  }

  /** The operator's logo, erased with it. */
  public async blobKeysOf(operatorId: string): Promise<string[]> {
    const operator = await prisma.operator.findUnique({ where: { id: operatorId }, select: { logoKey: true } });
    return operator?.logoKey ? [operator.logoKey] : [];
  }
}
