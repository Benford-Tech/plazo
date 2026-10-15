import { Router } from 'express';
import { ContactController } from '@/controllers/contact.controller';
import { ContactDto, NewsletterDto } from '@/dtos/contact.dto';
import { Routes } from '@/interfaces/routes.interface';
import { contactLimiter, newsletterAddressLimiter, newsletterLimiter } from '@/middlewares/rateLimiter';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * /public/contact:
 *   post:
 *     summary: A message of the site's contact form, emailed to the support (footer A, 15/10/2026) — public, rate limited
 *     description: >
 *       The message goes by email (Brevo) to product.json's supportEmail, with Reply-To the visitor; Plazo keeps nothing of
 *       it and logs neither the name, the address nor the text. 409 `contact_unavailable` while supportEmail is the
 *       placeholder (@example.com) or Brevo is not configured (BREVO_API_KEY, EMAIL_FROM). When the honeypot field
 *       "website" is filled, the answer is the same 202 and nothing is sent. Blank `reference` = not given; line breaks of
 *       the message are kept, control characters of the one-line fields become spaces. 5 accepted messages per hour per
 *       visitor (refused ones do not count).
 *     tags: [Public]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name: { type: string, maxLength: 80 }
 *               email: { type: string, maxLength: 254 }
 *               reference: { type: string, maxLength: 20, description: "Booking reference, optional" }
 *               message: { type: string, minLength: 10, maxLength: 2000 }
 *               website: { type: string, description: "Honeypot: leave empty" }
 *     responses:
 *       202:
 *         description: "{ ok: true }"
 *       400:
 *         description: "Validation (code validation_failed, fields: name required | too_long; email required | invalid_email;
 *           reference too_long; message required | too_short | too_long)"
 *       409:
 *         description: The form is not available yet (code contact_unavailable)
 *       429:
 *         description: Too many messages from this visitor (code too_many_requests)
 *       502:
 *         description: Brevo did not take the message (code contact_failed); the visitor may try again
 * /public/newsletter:
 *   post:
 *     summary: Subscribe to « La lettre Plazo » — Brevo double opt-in (footer A, 15/10/2026) — public, rate limited
 *     description: >
 *       Brevo emails a confirmation link (template BREVO_NEWSLETTER_DOI_TEMPLATE_ID) and adds the address to the list
 *       BREVO_NEWSLETTER_LIST_ID once it is clicked, then opens PUBLIC_SITE_URL/lettre/confirmee. Plazo stores nothing. The
 *       answer is the same 202 whatever the address' state (new, already subscribed, refused by Brevo, already asked for 3
 *       times today: nothing more is sent) and when the honeypot "website" is filled (nothing sent). 409
 *       `newsletter_unavailable` without the list, the template, BREVO_API_KEY or the site's address. 5 accepted
 *       subscriptions per hour per visitor (refused ones do not count).
 *     tags: [Public]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, consent]
 *             properties:
 *               email: { type: string, maxLength: 254 }
 *               consent: { type: boolean, enum: [true], description: "The visitor agreed to receive the newsletter" }
 *               website: { type: string, description: "Honeypot: leave empty" }
 *     responses:
 *       202:
 *         description: "{ ok: true }"
 *       400:
 *         description: "Validation (code validation_failed, fields: email required | invalid_email; consent consent_required)"
 *       409:
 *         description: The newsletter is not available yet (code newsletter_unavailable)
 *       429:
 *         description: Too many subscriptions from this visitor (code too_many_requests)
 *       502:
 *         description: "Brevo could not be reached or refused Plazo's settings (key, list, template, redirection; code
 *           newsletter_failed); the visitor may try again"
 */
export class ContactRoute implements Routes {
  public router = Router();
  public contact = new ContactController();

  // Also rate limited per traveller in app.ts (publicLimiter on /public).
  constructor() {
    this.router.post('/public/contact', contactLimiter, ValidationMiddleware(ContactDto), this.contact.send);
    this.router.post('/public/newsletter', newsletterLimiter, newsletterAddressLimiter, ValidationMiddleware(NewsletterDto), this.contact.subscribe);
  }
}
