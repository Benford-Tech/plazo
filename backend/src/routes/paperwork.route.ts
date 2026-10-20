import { Router } from 'express';
import { PaperworkController } from '@/controllers/paperwork.controller';
import { Routes } from '@/interfaces/routes.interface';
import { lookupLimiter, photoUploadLimiter } from '@/middlewares/rateLimiter';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Paperwork
 *   description: >
 *     « Contrat signé et état des lieux » (19/10/2026, choice A « tout dans les applis »). The parking contract of a booking
 *     is signed once: with a 6-digit code sent by SMS to the traveller's phone (in the traveller app, or typed on the
 *     staff's phone at the counter; Plazo's Brevo whatever the parking's SMS channel; 10 minutes, 5 tries, a new code at most
 *     every 60 s and 5 per hour) or by a handwritten signature on the staff's phone (`strokes`: [[[x, y], …], …] from 0 to
 *     1). The text signed is kept whole with its SHA-256 and a proof fingerprint, and a copy is emailed. The condition
 *     reports (`dropoff`, `return`) are taken by the staff in Plazo Pro: six guided photos (front, right, back, left,
 *     dashboard, interior; `damage` close-ups up to 12), the damages on the car's outline (x, y from 0 to 1), mileage and
 *     fuel (0 to 4 quarters); « complete » locks the report; the traveller then answers `accepted` or `reserved` (with
 *     their words), on the staff's phone (handwritten signature) or in the app (signed in by the booking's link). A drop-off
 *     report left unanswered once the traveller has left in the shuttle reads `accepted_by_default`. Photos are kept in a
 *     private Vercel Blob store and only ever streamed by these routes (503 `photos_unavailable` without a store); erased
 *     90 days after the return, 365 with a reservation.
 *     Errors: 409 already_signed, contract_closed, no_mobile, inspection_closed, inspection_completed, answer_closed,
 *     code_expired, code_locked; 400 code wrong_code, strokes required, reserveText required, photo too_large /
 *     not_an_image / too_many, the missing slots and mileageKm / fuelQuarters on « complete »; 429 too_many_codes,
 *     code_recently_sent; 502 sms_failed, photo_upload_failed; 503 sms_unavailable, photos_unavailable.
 * /internal/reservations/{id}/paperwork:
 *   get:
 *     summary: The contract and both condition reports of a booking
 *     tags: [Paperwork]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/reservations/{id}/contract/code:
 *   post:
 *     summary: Refused since the 20/10/2026, 409 contract_at_counter (the contract is signed at the counter) (typed on the staff's phone)
 *     tags: [Paperwork]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/reservations/{id}/contract/sign:
 *   post:
 *     summary: Signs the contract on the staff's phone, with { code } or { strokes }
 *     tags: [Paperwork]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/reservations/{id}/inspections/{kind}:
 *   post:
 *     summary: Starts the condition report (dropoff | return), or returns the one started
 *     tags: [Paperwork]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: kind, required: true, schema: { type: string, enum: [dropoff, return] } }
 *   patch:
 *     summary: Damages, mileage, fuel and notes of a report not completed yet
 *     tags: [Paperwork]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: kind, required: true, schema: { type: string, enum: [dropoff, return] } }
 * /internal/reservations/{id}/inspections/{kind}/photos:
 *   post:
 *     summary: Adds a photo (the image's bytes as the body, image/jpeg, png, heic or webp, 3 MB at most)
 *     description: A guided slot taken again replaces its photo. Returns { photoId, paperwork }.
 *     tags: [Paperwork]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: kind, required: true, schema: { type: string, enum: [dropoff, return] } }
 *       - { in: query, name: slot, required: true, schema: { type: string, enum: [front, right, back, left, dashboard, interior, damage] } }
 * /internal/reservations/{id}/inspections/{kind}/photos/{photoId}:
 *   get:
 *     summary: The photo itself (streamed)
 *     tags: [Paperwork]
 *   delete:
 *     summary: Removes a photo of a report not completed yet
 *     tags: [Paperwork]
 * /internal/reservations/{id}/inspections/{kind}/complete:
 *   post:
 *     summary: Locks the report (all six guided photos, mileage and fuel required)
 *     tags: [Paperwork]
 * /internal/reservations/{id}/inspections/{kind}/answer:
 *   post:
 *     summary: The traveller answers on the staff's phone, { decision accepted | reserved, reserveText?, strokes }
 *     tags: [Paperwork]
 * /public/bookings/{reference}/paperwork:
 *   get:
 *     summary: The traveller's contract and completed reports (x-booking-token)
 *     tags: [Paperwork]
 *     security: []
 * /public/bookings/{reference}/contract/code:
 *   post:
 *     summary: Refused since the 20/10/2026, 409 contract_at_counter (the contract is signed at the counter)
 *     tags: [Paperwork]
 *     security: []
 * /public/bookings/{reference}/contract/sign:
 *   post:
 *     summary: Refused since the 20/10/2026, 409 contract_at_counter
 *     tags: [Paperwork]
 *     security: []
 * /public/bookings/{reference}/inspections/{kind}/answer:
 *   post:
 *     summary: Answers a completed report, { decision accepted | reserved, reserveText? }
 *     tags: [Paperwork]
 *     security: []
 * /public/bookings/{reference}/inspections/{kind}/photos/{photoId}:
 *   get:
 *     summary: A photo of a completed report, or of the traveller's own (x-booking-token)
 *     tags: [Paperwork]
 *     security: []
 * /public/bookings/{reference}/inspections/{kind}/mine:
 *   post:
 *     summary: Starts the traveller's own photos (drop-off until the shuttle, return once back at the parking)
 *     tags: [Paperwork]
 *     security: []
 *   patch:
 *     summary: Updates their note, { notes }
 *     tags: [Paperwork]
 *     security: []
 * /public/bookings/{reference}/inspections/{kind}/mine/photos:
 *   post:
 *     summary: Adds a photo (raw image body, ?slot= one of the six guided slots, 3 MB max)
 *     tags: [Paperwork]
 *     security: []
 * /public/bookings/{reference}/inspections/{kind}/mine/photos/{photoId}:
 *   delete:
 *     summary: Removes a photo before sending
 *     tags: [Paperwork]
 *     security: []
 * /public/bookings/{reference}/inspections/{kind}/mine/complete:
 *   post:
 *     summary: Sends the photos to the parking (one at least); they can no longer change
 *     tags: [Paperwork]
 *     security: []
 */
export class PaperworkRoute implements Routes {
  public router = Router();
  public paperwork = new PaperworkController();

  constructor() {
    const staff = '/internal/reservations/:id';
    this.router.get(`${staff}/paperwork`, StaffAuthMiddleware('reservations:view'), this.paperwork.get);
    this.router.post(`${staff}/contract/code`, StaffAuthMiddleware('reservations:status'), this.paperwork.sendCode);
    this.router.post(`${staff}/contract/sign`, StaffAuthMiddleware('reservations:status'), this.paperwork.sign);
    this.router.post(`${staff}/inspections/:kind`, StaffAuthMiddleware('reservations:status'), this.paperwork.start);
    this.router.patch(`${staff}/inspections/:kind`, StaffAuthMiddleware('reservations:status'), this.paperwork.update);
    this.router.post(`${staff}/inspections/:kind/photos`, StaffAuthMiddleware('reservations:status'), this.paperwork.addPhoto);
    this.router.get(`${staff}/inspections/:kind/photos/:photoId`, StaffAuthMiddleware('reservations:view'), this.paperwork.photo);
    this.router.delete(`${staff}/inspections/:kind/photos/:photoId`, StaffAuthMiddleware('reservations:status'), this.paperwork.removePhoto);
    this.router.post(`${staff}/inspections/:kind/complete`, StaffAuthMiddleware('reservations:status'), this.paperwork.complete);
    this.router.post(`${staff}/inspections/:kind/answer`, StaffAuthMiddleware('reservations:status'), this.paperwork.answer);

    const traveller = '/public/bookings/:reference';
    this.router.get(`${traveller}/paperwork`, this.paperwork.travellerGet);
    // Signed at the counter since the 20/10/2026: both answer 409 contract_at_counter (old app versions).
    this.router.post(`${traveller}/contract/code`, lookupLimiter, this.paperwork.travellerSendCode);
    this.router.post(`${traveller}/contract/sign`, lookupLimiter, this.paperwork.travellerSign);
    // The traveller's own photos (« les deux peuvent faire l'état des lieux », 20/10/2026).
    this.router.post(`${traveller}/inspections/:kind/mine`, this.paperwork.travellerStart);
    this.router.patch(`${traveller}/inspections/:kind/mine`, this.paperwork.travellerUpdate);
    this.router.post(`${traveller}/inspections/:kind/mine/photos`, photoUploadLimiter, this.paperwork.travellerAddPhoto);
    this.router.delete(`${traveller}/inspections/:kind/mine/photos/:photoId`, this.paperwork.travellerRemovePhoto);
    this.router.post(`${traveller}/inspections/:kind/mine/complete`, this.paperwork.travellerComplete);
    this.router.post(`${traveller}/inspections/:kind/answer`, this.paperwork.travellerAnswer);
    this.router.get(`${traveller}/inspections/:kind/photos/:photoId`, this.paperwork.travellerPhoto);
  }
}
