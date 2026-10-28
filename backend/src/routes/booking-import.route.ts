import { Router } from 'express';
import { BookingImportController } from '@/controllers/booking-import.controller';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/** The import path, whose JSON body may be larger than the others (2 000 rows): see app.ts. */
export const BOOKING_IMPORT_PATH = '/internal/reservations/import';

/**
 * @swagger
 * tags:
 *   name: BookingImport
 *   description: Old (and upcoming) bookings imported from a spreadsheet, previewed before they are created (28/10/2026), managers only
 * /internal/reservations/import:
 *   post:
 *     summary: Reads the rows of a file (the browser splits it into cells and maps its columns) and says what each one gives — to create, to check, already in Plazo, in error. With dryRun false, creates the bookings to create and to check under the parking's lock, without any message, and returns the import.
 *     tags: [BookingImport]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dryRun: { type: boolean, default: true }
 *               fileName: { type: string }
 *               rows:
 *                 type: array
 *                 maxItems: 2000
 *                 items:
 *                   type: object
 *                   description: "line, and the text of each mapped column: name | firstName | lastName, phone, email, plate, arrivalDate, arrivalTime, returnDate, returnTime, returnFlight, departureFlight, passengers, price, channel, reference, status, bookedAt, vehicle, notes"
 *     responses:
 *       200: { description: "{ dryRun, timezone, counts: { create, check, duplicate, error }, rows: [{ line, outcome, errors, warnings, duplicateOf, booking }], import: { id, created } | null }" }
 *       400: { description: "fields.rows required, too_many_rows" }
 *       403: { description: forbidden (managers only) }
 * /internal/reservations/imports:
 *   get:
 *     summary: The last ten imports, with undoableUntil while « Retirer cet import » is open (24 hours)
 *     tags: [BookingImport]
 *     responses:
 *       200: { description: "{ data: [{ id, fileName, createdAt, createdCount, removedCount, undoneAt, undoableUntil, by }] }" }
 * /internal/reservations/imports/{id}/undo:
 *   post:
 *     summary: Removes the import's bookings nobody touched since (within 24 hours); the others stay
 *     tags: [BookingImport]
 *     responses:
 *       200: { description: "{ removed, kept }" }
 *       404: { description: not_found }
 *       409: { description: "already_undone, undo_expired" }
 */
export class BookingImportRoute implements Routes {
  public router = Router();
  public imports = new BookingImportController();

  constructor() {
    this.router.post(BOOKING_IMPORT_PATH, StaffAuthMiddleware('parking:manage'), this.imports.run);
    this.router.get('/internal/reservations/imports', StaffAuthMiddleware('parking:manage'), this.imports.list);
    this.router.post('/internal/reservations/imports/:id/undo', StaffAuthMiddleware('parking:manage'), this.imports.undo);
  }
}
