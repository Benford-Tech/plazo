import { Router } from 'express';
import { ReminderController } from '@/controllers/reminder.controller';
import { ExcludeReminderDto, TestReminderDto, UpdateReminderEveningDto, UpdateReminderSettingsDto } from '@/dtos/reminder.dto';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Reminders
 *   description: >
 *     The day-before SMS (« SMS de la veille », S-A + S-B, 06/10/2026): the parking's usual time and text,
 *     the evenings of the week (moved or paused), and what happens to each booking's SMS.
 */
/**
 * @swagger
 * /internal/parkings/{id}/reminders:
 *   get:
 *     summary: The usual rule, the text, seven evenings (yesterday to five days ahead) and the bookings of one evening
 *     tags: [Reminders]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: evening, schema: { type: string, example: "2026-10-06" }, description: "Local date of the evening (default: tonight); its drop-offs are the next day" }
 *     responses:
 *       200:
 *         description: "{ today, settings, defaults, sendTimes, variables, channel, linkAvailable, evenings, evening: { …, rows }, sample, can }"
 *   put:
 *     summary: Change the usual rule or the text (managers); a template of null or Plazo's own text goes back to Plazo's
 *     tags: [Reminders]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled: { type: boolean }
 *               sendTime: { type: string, example: "18:00", description: "Every half hour from 16:00 to 21:30" }
 *               template: { type: string, nullable: true, maxLength: 2000, description: "Variables: {prénom} {nom} {date} {heure} {plaque} {référence} {lien}" }
 *     responses:
 *       200: { description: The board, as GET }
 *       400: { description: "fields.template = unknown_variable | too_long; fields.sendTime = invalid_time" }
 * /internal/parkings/{id}/reminders/evenings/{date}:
 *   put:
 *     summary: Move or pause one evening (managers; from tonight to 60 days ahead)
 *     tags: [Reminders]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: date, required: true, schema: { type: string, example: "2026-10-08" } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sendTime: { type: string, nullable: true, description: "null: the usual time" }
 *               paused: { type: boolean }
 *     responses:
 *       200: { description: The board, on that evening }
 * /internal/parkings/{id}/reminders/evenings/{date}/send:
 *   post:
 *     summary: Send now the evening's reminders not sent yet (tonight, or yesterday's evening for today's drop-offs)
 *     tags: [Reminders]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: date, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: The board, on that evening }
 *       409: { description: "code = reminder_not_tonight" }
 * /internal/parkings/{id}/reminders/test:
 *   post:
 *     summary: Send the text (saved, or the one given) with the preview's values to the staff member's phone, or another
 *     tags: [Reminders]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to: { type: string, example: "+33612345678" }
 *               template: { type: string }
 *     responses:
 *       200: { description: "{ outcome, to }" }
 *       409: { description: "code = sms_not_configured" }
 * /internal/reservations/{id}/reminder:
 *   put:
 *     summary: Leave a booking out of its day-before reminder, or put it back ("Ne pas envoyer" / "Rétablir")
 *     tags: [Reminders]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [excluded], properties: { excluded: { type: boolean } } }
 *     responses:
 *       200: { description: "{ excluded }" }
 *       409: { description: "code = reminder_already_sent" }
 */
export class ReminderRoute implements Routes {
  public router = Router();
  public reminders = new ReminderController();

  constructor() {
    // 10/10/2026: every route is open to « Ouvrir son espace » (traced as view_as.write); the test SMS goes to the
    // number typed, else to the admin's own phone.
    this.router.get('/internal/parkings/:id/reminders', StaffAuthMiddleware('reservations:view'), this.reminders.board);
    this.router.put(
      '/internal/parkings/:id/reminders',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(UpdateReminderSettingsDto),
      this.reminders.updateSettings,
    );
    this.router.put(
      '/internal/parkings/:id/reminders/evenings/:date',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(UpdateReminderEveningDto),
      this.reminders.updateEvening,
    );
    this.router.post('/internal/parkings/:id/reminders/evenings/:date/send', StaffAuthMiddleware('reservations:manage'), this.reminders.sendNow);
    this.router.post(
      '/internal/parkings/:id/reminders/test',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(TestReminderDto),
      this.reminders.test,
    );
    this.router.put(
      '/internal/reservations/:id/reminder',
      StaffAuthMiddleware('reservations:manage'),
      ValidationMiddleware(ExcludeReminderDto),
      this.reminders.exclude,
    );
  }
}
