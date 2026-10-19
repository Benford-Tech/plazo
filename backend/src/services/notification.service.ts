import { Service } from 'typedi';
import { BREVO_API_KEY, EMAIL_FROM, PRODUCT_NAME, PUBLIC_SITE_URL, SMS_SENDER } from '@/config';
import { cancellationEmail, closingEmail, confirmationEmail, EmailMessage, isGsm7, reminderEmail } from '@/domain/booking-messages';
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

  /** The day before the drop-off (B, 06/10/2026). */
  public async bookingReminder(booking: PublicBooking, manageToken: string | null): Promise<void> {
    if (!this.configured(booking.reference, 'booking_reminder')) return;
    await this.sendEmail(
      booking,
      'booking_reminder',
      reminderEmail(PRODUCT_NAME, booking, manageToken ? this.manageUrl(booking.reference, manageToken) : null),
    );
  }

  /** After the handover (B, 06/10/2026). */
  public async bookingClosed(booking: PublicBooking, returnedAtLocal: string): Promise<void> {
    if (!this.configured(booking.reference, 'booking_closed')) return;
    await this.sendEmail(booking, 'booking_closed', closingEmail(PRODUCT_NAME, booking, returnedAtLocal));
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

  /**
   * Email to a traveller that is not about a site booking's thread (the signed contract, 19/10/2026). Returns whether Brevo
   * accepted it. Logs only the tag and `about` (an id), never the address.
   */
  public async emailTraveller(to: { email: string; name: string }, tag: string, about: string, message: EmailMessage): Promise<boolean> {
    if (!this.canSendEmail()) {
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

  // ---- The site's contact form and « La lettre Plazo » (footer A, 15/10/2026) ------------------------------------------

  /** Whether an email can go out at all: a Brevo key and a valid sender (no link in it, so the site's address is not needed). */
  public canSendEmail(): boolean {
    return !!this.settings.apiKey && !!parseSender(this.settings.emailFrom, PRODUCT_NAME);
  }

  /** An absolute link to a page of the traveller site, or null when the site's address is unknown. */
  public siteUrl(path: string): string | null {
    const base = this.siteBase();
    return base ? `${base}${path}` : null;
  }

  /**
   * A message of the site's contact form, to the support address, with Reply-To the visitor (answering the email answers
   * them). Returns whether Brevo accepted it. Logs only the tag and `about` (a random id), never an address or the text.
   */
  public async emailSupport(
    to: string,
    replyTo: { email: string; name: string },
    tag: string,
    about: string,
    message: EmailMessage,
  ): Promise<boolean> {
    if (!this.canSendEmail()) {
      logger.info(`[Notifications] Email not configured: ${tag} not sent for ${about}`);
      return false;
    }
    return this.post('email', tag, about, '/smtp/email', {
      sender: parseSender(this.settings.emailFrom, PRODUCT_NAME),
      to: [{ email: to }],
      replyTo: { email: replyTo.email, ...(replyTo.name ? { name: replyTo.name } : {}) },
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      tags: [tag],
    });
  }

  /**
   * Brevo's double opt-in: Brevo emails the template's confirmation link to the address, and adds the contact to the list
   * only once it is clicked (then sends them to `redirectionUrl`). Brevo answers 201 for a new contact and 204 for a known
   * one. Returns Brevo's HTTP status (null: no answer). Logs only the tag and `about`, never the address.
   */
  public async newsletterDoubleOptIn(
    email: string,
    settings: { listId: number; templateId: number; redirectionUrl: string },
    tag: string,
    about: string,
  ): Promise<{ ok: boolean; status: number | null; setup?: boolean }> {
    if (!this.settings.apiKey) {
      logger.info(`[Notifications] BREVO_API_KEY not set: ${tag} not sent for ${about}`);
      return { ok: false, status: null };
    }
    return this.request('double opt-in', tag, about, '/contacts/doubleOptinConfirmation', {
      email,
      includeListIds: [settings.listId],
      templateId: settings.templateId,
      redirectionUrl: settings.redirectionUrl,
    });
  }

  // ---- Prospection (Plateforme › Prospection, 18/10/2026) -----------------------------------------------------------------

  /**
   * A prospecting email, with its own sender, Reply-To and headers (List-Unsubscribe…). Returns Brevo's message id when it
   * accepted the email, and its HTTP status otherwise (null: no answer, or Brevo not configured). Logs only the tag and
   * `about` (an id), never the address.
   */
  public async emailProspect(
    to: { email: string; name?: string },
    message: EmailMessage,
    options: { sender: { name: string; email: string }; replyTo: string | null; headers: Record<string, string>; tag: string; about: string },
  ): Promise<{ ok: boolean; status: number | null; messageId: string | null }> {
    if (!this.settings.apiKey) {
      logger.info(`[Notifications] BREVO_API_KEY not set: ${options.tag} not sent for ${options.about}`);
      return { ok: false, status: null, messageId: null };
    }
    const result = await this.request('email', options.tag, options.about, '/smtp/email', {
      sender: options.sender,
      to: [{ email: to.email, ...(to.name ? { name: to.name } : {}) }],
      ...(options.replyTo ? { replyTo: { email: options.replyTo } } : {}),
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      headers: options.headers,
      tags: [options.tag],
    });
    const id = (result.data as { messageId?: unknown } | null | undefined)?.messageId;
    return { ok: result.ok, status: result.status, messageId: typeof id === 'string' ? id.slice(0, 200) : null };
  }

  private async post(kind: string, tag: string, about: string, path: string, body: unknown): Promise<boolean> {
    return (await this.request(kind, tag, about, path, body)).ok;
  }

  /**
   * A POST to Brevo. Never throws; `status` is null when Brevo did not answer (network, timeout). `setup`: a 400 whose message
   * names Plazo's own settings (a template, e.g. « An active DOI template does not exist », or the redirection URL), which
   * no address can cause.
   */
  private async request(
    kind: string,
    tag: string,
    about: string,
    path: string,
    body: unknown,
  ): Promise<{ ok: boolean; status: number | null; setup?: boolean; data?: unknown }> {
    try {
      const res = await fetch(`${BREVO_URL}${path}`, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': this.settings.apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.settings.timeoutMs),
      });
      if (res.ok) {
        logger.info(`[Notifications] ${tag} ${kind} sent for ${about}`);
        const data: unknown = await res.json().catch(() => null);
        return { ok: true, status: res.status, data };
      }
      // Brevo's error message may quote the recipient: keep only its machine code. The message is only read (addresses
      // taken out) to tell a refusal of Plazo's settings from one of the address; it is never logged.
      const data: any = await res.json().catch(() => null);
      const code = typeof data?.code === 'string' && /^[a-z_]{1,40}$/.test(data.code) ? data.code : '';
      const message = typeof data?.message === 'string' ? data.message.replace(/\S*@\S*/g, ' ') : '';
      const setup = res.status === 400 && /\b(template|redirection)/i.test(message);
      logger.error(`[Notifications] ${tag} ${kind} failed for ${about}: HTTP ${res.status}${code ? ` ${code}` : ''}${setup ? ' (settings)' : ''}`);
      return { ok: false, status: res.status, setup };
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'unknown error';
      logger.error(`[Notifications] ${tag} ${kind} failed for ${about}: ${reason}`);
      return { ok: false, status: null };
    }
  }
}
