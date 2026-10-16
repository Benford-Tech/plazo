import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { PRODUCT_NAME, SUPPORT_EMAIL } from '@/config';
import { contactEmail, isRealSupportEmail } from '@/domain/contact';
import { ContactDto } from '@/dtos/contact.dto';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { NotificationService } from './notification.service';

/**
 * The name shown in the Reply-To header: without the characters that build a list of addresses (« , », « ; », « < », « @ »…),
 * so that a name such as « Léa, autre@exemple.fr » can never add a recipient to the support's answer.
 */
export function replyToName(name: string): string {
  return name
    .replace(/[<>()[\]\\,;:@"]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The site's contact form (footer A, 15/10/2026): each message is emailed to the support address of product.json, Reply-To
 * the visitor, through Brevo. Plazo keeps nothing of it, and logs only a random id (never the name, the address or the text).
 */
@Service()
export class ContactService {
  public notifications = Container.get(NotificationService);
  /** product.json's support address (a placeholder until the real one is known); tests override it. */
  public settings = { supportEmail: SUPPORT_EMAIL };

  /** A real support address, a Brevo key and a sender. */
  public available(): boolean {
    return isRealSupportEmail(this.settings.supportEmail) && this.notifications.canSendEmail();
  }

  public async send(data: ContactDto, now = new Date()): Promise<{ ok: true }> {
    if (data.website?.trim()) {
      logger.info('[Contact] Honeypot filled: nothing sent');
      return { ok: true };
    }
    if (!this.available()) throw new HttpException(httpStatus.CONFLICT, 'Contact form not available', 'contact_unavailable');

    const id = `contact ${randomBytes(4).toString('hex')}`;
    const message = contactEmail(PRODUCT_NAME, { name: data.name, email: data.email, reference: data.reference, message: data.message }, id, now);
    const sent = await this.notifications.emailSupport(
      this.settings.supportEmail,
      { email: data.email, name: replyToName(data.name) },
      'contact_form',
      id,
      message,
    );
    // The visitor must know their message did not leave (they can try again, or call).
    if (!sent) throw new HttpException(httpStatus.BAD_GATEWAY, 'The message could not be sent', 'contact_failed');
    return { ok: true };
  }
}
