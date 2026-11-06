import { Router } from 'express';
import { InvoiceController } from '@/controllers/invoice.controller';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInDemo, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: >
 *     06/11/2026 (direction A): the invoice a parking issues to its customer for a booking, in its name and with its
 *     logo. Numbered without gaps per operator and year (« F-2026-0042 », credit notes « A-2026-0003 »), frozen once
 *     issued (the PDF is kept), cancelled by a credit note.
 * /internal/billing/settings:
 *   get:
 *     summary: The operator's invoicing details (legal name, address, SIRET, VAT number or exemption, rate, mention, prefix) and what is missing
 *   put:
 *     summary: "Change them; absent fields are kept. 400 validation_failed: fields.siret | vatNumber | vatRatePercent | prefix = invalid"
 * /internal/reservations/{id}/invoices:
 *   get:
 *     summary: "The booking's invoices and credit notes, canCreate and refusal (billing_incomplete | no_price | reservation_cancelled | invoice_exists | anonymized)"
 *   post:
 *     summary: "Issue the invoice ({ customerCompany?, customerAddress? }); 409 with the refusal's code"
 * /internal/reservations/{id}/invoices/preview:
 *   get:
 *     summary: The invoice as it would be issued, marked « aperçu » and not numbered (PDF); ?customerCompany=&customerAddress=
 * /internal/invoices/{id}/pdf:
 *   get:
 *     summary: The invoice's PDF as issued
 * /internal/invoices/{id}/send:
 *   post:
 *     summary: "Send the PDF by e-mail ({ email? }, the booking's address by default); 409 no_email, 502 email_failed"
 * /internal/invoices/{id}/credit-note:
 *   post:
 *     summary: "Issue the credit note that cancels the invoice; 409 already_credited, 400 not_invoice"
 */
export class InvoiceRoute implements Routes {
  public router = Router();
  public invoices = new InvoiceController();

  constructor() {
    this.router.get('/internal/billing/settings', StaffAuthMiddleware('parking:manage'), this.invoices.settings);
    this.router.put('/internal/billing/settings', StaffAuthMiddleware('parking:manage'), RefuseInDemo(), this.invoices.updateSettings);
    this.router.get('/internal/reservations/:id/invoices', StaffAuthMiddleware('reservations:manage'), this.invoices.forReservation);
    this.router.get('/internal/reservations/:id/invoices/preview', StaffAuthMiddleware('reservations:manage'), this.invoices.preview);
    this.router.post('/internal/reservations/:id/invoices', StaffAuthMiddleware('reservations:manage'), RefuseInDemo(), this.invoices.create);
    this.router.get('/internal/invoices/:id/pdf', StaffAuthMiddleware('reservations:manage'), this.invoices.file);
    this.router.post('/internal/invoices/:id/send', StaffAuthMiddleware('reservations:manage'), RefuseInDemo(), this.invoices.send);
    this.router.post('/internal/invoices/:id/credit-note', StaffAuthMiddleware('reservations:manage'), RefuseInDemo(), this.invoices.creditNote);
  }
}
