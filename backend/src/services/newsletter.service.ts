import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { brevoNewsletterSettings } from '@/config';
import { NEWSLETTER_CONFIRMED_PATH } from '@/domain/contact';
import { NewsletterDto } from '@/dtos/contact.dto';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { NotificationService } from './notification.service';

/**
 * « La lettre Plazo » (footer A, 15/10/2026): a subscription is Brevo's double opt-in. Brevo emails a confirmation link and
 * adds the address to the list once it is clicked; Plazo stores nothing (the list lives in Brevo, with its one-click
 * unsubscribe). The answer never says anything about an address (already subscribed, refused…): no enumeration.
 */
@Service()
export class NewsletterService {
  public notifications = Container.get(NotificationService);

  /** The Brevo list and template, and the site's page the confirmation leads to; null while any is missing. */
  public settings(): { listId: number; templateId: number; redirectionUrl: string } | null {
    const brevo = brevoNewsletterSettings();
    const redirectionUrl = this.notifications.siteUrl(NEWSLETTER_CONFIRMED_PATH);
    if (!brevo || !redirectionUrl || !this.notifications.settings.apiKey) return null;
    return { ...brevo, redirectionUrl };
  }

  public async subscribe(data: NewsletterDto): Promise<{ ok: true }> {
    if (data.website?.trim()) {
      logger.info('[Newsletter] Honeypot filled: nothing sent');
      return { ok: true };
    }
    const settings = this.settings();
    if (!settings) throw new HttpException(httpStatus.CONFLICT, 'Newsletter not available', 'newsletter_unavailable');

    const id = `newsletter ${randomBytes(4).toString('hex')}`;
    const result = await this.notifications.newsletterDoubleOptIn(data.email.trim().toLowerCase(), settings, 'newsletter_doi', id);
    // 201 (new contact) and 204 (known one): Brevo sends the confirmation. 400: Brevo refused this address (invalid, blocked…),
    // answered like a success so that the form tells nothing about an address, unless Brevo's message names Plazo's settings
    // (inactive or unknown template, redirection: the same for every address). Anything else is Plazo's or Brevo's failure
    // (key, list, template, outage): the visitor may try again.
    if (result.ok || (result.status === httpStatus.BAD_REQUEST && !result.setup)) return { ok: true };
    throw new HttpException(httpStatus.BAD_GATEWAY, 'The subscription could not be sent', 'newsletter_failed');
  }
}
