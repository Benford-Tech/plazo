import { Service } from 'typedi';
import { BREVO_API_KEY, EMAIL_FROM, PRODUCT_NAME, PUBLIC_SITE_URL, SMS_SENDER } from '@/config';
import { cancellationEmail, confirmationEmail, EmailMessage, isGsm7 } from '@/domain/booking-messages';
import { PublicBooking } from '@/interfaces/booking.interface';
import { logger } from '@/utils/logger';

const BREVO_URL = 'https://api.brevo.com/v3';

/** "Name <address>" or a bare address; the name defaults to the product name. */
export function parseSender(value: string, defaultName: string): { name: string; email: string } | null {
  const match = /^\s*(?:"?([^"<]*?)"?\s*<\s*([^<>\s]+@[^<>\s]+)\s*>|([^<>\s]+@[^<>\s]+))\s*$/.exec(value);
  if (!match) return null;
  return { name: match[1]?.trim() || defaultName, email: (match[2] ?? match[3]).trim() };
}

/** Alphanumeric SMS sender, 11 characters at most. */
export function smsSenderName(value: string, productName: string): string {
  return (value || productName).replace(/[^A-Za-z0-9]/g, '').slice(0, 11);
}

/**
 * Emails to travellers and operators, and the Brevo SMS channel, through Brevo. The SMS to
 * travellers are routed per operator by SmsService (which calls smsViaBrevo here when the operator
 * chose that channel). A notification never fails the action that caused it: every error is caught
 * and logged with the booking reference only (no personal data).
 */
@Service()
export class NotificationService {
  /** Read from the environment once; tests override it. */
  public settings = {
    apiKey: BREVO_API_KEY,
    emailFrom: EMAIL_FROM,
    smsSender: SMS_SENDER,
    publicSiteUrl: PUBLIC_SITE_URL,
    timeoutMs: 5000,
  };

  /** Link to manage a booking on the site, or null when the site's URL is unknown. */
  public manageUrl(reference: string, manageToken: string): string | null {
    const base = this.settings.publicSiteUrl.replace(/\/+$/, '');
    if (!base) return null;
    return `${base}/ma-reservation/${encodeURIComponent(reference)}?cle=${encodeURIComponent(manageToken)}`;
  }

  /** Confirmation email after a booking on the site (the SMS goes through SmsService). */
  public async bookingConfirmed(booking: PublicBooking, manageToken: string): Promise<void> {
    if (!this.configured(booking.reference, 'booking_confirmed')) return;
    await this.sendEmail(booking, 'booking_confirmed', confirmationEmail(PRODUCT_NAME, booking, this.manageUrl(booking.reference, manageToken)));
  }

  /** Email after the traveller cancelled on the site. */
  public async bookingCancelled(booking: PublicBooking): Promise<void> {
    if (!this.configured(booking.reference, 'booking_cancelled')) return;
    await this.sendEmail(booking, 'booking_cancelled', cancellationEmail(PRODUCT_NAME, booking));
  }

  /**
   * An SMS through Brevo ("Plazo envoie pour moi"), to a number already checked by smsRecipient().
   * Returns whether Brevo accepted it; nothing (false) without an API key. `about` is an id.
   */
  public async smsViaBrevo(recipient: string, tag: string, about: string, content: string): Promise<boolean> {
    if (!this.settings.apiKey) {
      logger.info(`[Notifications] BREVO_API_KEY not set: ${tag} SMS not sent for ${about}`);
      return false;
    }
    return this.post('SMS', tag, about, '/transactionalSMS/send', {
      sender: smsSenderName(this.settings.smsSender, PRODUCT_NAME),
      // Brevo expects the country code without "+", e.g. 33612345678.
      recipient: recipient.slice(1),
      content,
      type: 'transactional',
      tag,
      unicodeEnabled: !isGsm7(content),
    });
  }

  private configured(reference: string, tag: string): boolean {
    if (this.settings.apiKey) return true;
    logger.info(`[Notifications] BREVO_API_KEY not set: ${tag} not sent for booking ${reference}`);
    return false;
  }

  private async sendEmail(booking: PublicBooking, tag: string, message: EmailMessage): Promise<void> {
    const sender = parseSender(this.settings.emailFrom, PRODUCT_NAME);
    if (!sender) {
      logger.warn(`[Notifications] EMAIL_FROM not set or invalid: ${tag} email not sent for booking ${booking.reference}`);
      return;
    }
    if (!booking.customerEmail) return;
    await this.post('email', tag, `booking ${booking.reference}`, '/smtp/email', {
      sender,
      to: [{ email: booking.customerEmail, name: booking.customerName }],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      tags: [tag],
    });
  }

  // ---- Operators (pro space) -------------------------------------------------------------------

  /** Whether emails to operators can go out: Brevo key, a valid sender and the site's address (links). */
  public emailConfigured(): boolean {
    return !!this.settings.apiKey && !!parseSender(this.settings.emailFrom, PRODUCT_NAME) && !!this.siteBase();
  }

  private siteBase(): string {
    return this.settings.publicSiteUrl.replace(/\/+$/, '');
  }

  /**
   * Link to a page of the pro space, e.g. proUrl('/invitation#token'). Absolute when the site's
   * address is known, otherwise relative to the current domain (shown in the pro space only).
   */
  public proUrl(path: string): string {
    return `${this.siteBase()}/pro${path}`;
  }

  /**
   * Email to a staff member of an operator. Returns whether Brevo accepted it. Logs only the tag and
   * `about` (an id), never the address.
   */
  public async emailStaff(to: { email: string; name: string }, tag: string, about: string, message: EmailMessage): Promise<boolean> {
    if (!this.emailConfigured()) {
      logger.info(`[Notifications] Email not configured: ${tag} not sent for ${about}`);
      return false;
    }
    return this.post('email', tag, about, '/smtp/email', {
      sender: parseSender(this.settings.emailFrom, PRODUCT_NAME),
      to: [{ email: to.email, name: to.name }],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      tags: [tag],
    });
  }

  private async post(kind: string, tag: string, about: string, path: string, body: unknown): Promise<boolean> {
    try {
      const res = await fetch(`${BREVO_URL}${path}`, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': this.settings.apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.settings.timeoutMs),
      });
      if (res.ok) {
        logger.info(`[Notifications] ${tag} ${kind} sent for ${about}`);
        return true;
      }
      // Brevo's error message may quote the recipient: keep only its machine code.
      const code = await res
        .json()
        .then((data: any) => (typeof data?.code === 'string' && /^[a-z_]{1,40}$/.test(data.code) ? data.code : ''))
        .catch(() => '');
      logger.error(`[Notifications] ${tag} ${kind} failed for ${about}: HTTP ${res.status}${code ? ` ${code}` : ''}`);
      return false;
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'unknown error';
      logger.error(`[Notifications] ${tag} ${kind} failed for ${about}: ${reason}`);
      return false;
    }
  }
}
