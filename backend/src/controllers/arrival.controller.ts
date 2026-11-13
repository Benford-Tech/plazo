import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import {
  AnnounceArrivalDto,
  ArrivalPositionDto,
  AtMeetingPointDto,
  NotificationPreferencesDto,
  RegisterDeviceDto,
  ReturnMeetingPointDto,
  StartArrivalDto,
  StopArrivalDto,
} from '@/dtos/arrival.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ArrivalService } from '@/services/arrival.service';
import { MeetingPhotoService } from '@/services/meeting-photo.service';
import { ParkingService } from '@/services/parking.service';
import { MorningEmailService } from '@/services/morning-email.service';
import { ShuttleService } from '@/services/shuttle.service';
import { StaffDeviceService } from '@/services/staff-device.service';
import catchAsync from '@/utils/catchAsync';

// The manage token travels in a header, never in the URL (request logs). Positions travel in the
// body, which is never logged.
const bookingToken = (req: Request) => req.get('x-booking-token') || undefined;
const reference = (req: Request) => req.params.reference as string;

export class ArrivalController {
  public arrivals = Container.get(ArrivalService);
  public devices = Container.get(StaffDeviceService);
  public morning = Container.get(MorningEmailService);
  public parkings = Container.get(ParkingService);
  public shuttle = Container.get(ShuttleService);

  /** GET /public/bookings/:reference/arrival */
  public state = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.arrivals.state(reference(req), bookingToken(req)));
  });

  /** POST /public/bookings/:reference/arrival/start */
  public start = catchAsync(async (req: Request, res: Response) => {
    const data: StartArrivalDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.arrivals.start(reference(req), bookingToken(req), data.kind, data.consent, data.note));
  });

  /** POST /public/bookings/:reference/arrival/position */
  public position = catchAsync(async (req: Request, res: Response) => {
    const data: ArrivalPositionDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.arrivals.position(reference(req), bookingToken(req), data));
  });

  /** POST /public/bookings/:reference/arrival/announce */
  public announce = catchAsync(async (req: Request, res: Response) => {
    const data: AnnounceArrivalDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json(await this.arrivals.announce(reference(req), bookingToken(req), data.kind, data.minutes, data.note));
  });

  /** POST /public/bookings/:reference/arrival/at-meeting-point */
  public atMeetingPoint = catchAsync(async (req: Request, res: Response) => {
    const data: AtMeetingPointDto = req.body;
    const position = typeof data.lat === 'number' && typeof data.lng === 'number' ? { lat: data.lat, lng: data.lng } : null;
    res.set('Cache-Control', 'no-store');
    res.json(await this.arrivals.atMeetingPoint(reference(req), bookingToken(req), data.kind, position, data.note));
  });

  /** POST /public/bookings/:reference/arrival/stop */
  public stop = catchAsync(async (req: Request, res: Response) => {
    const data: StopArrivalDto = req.body ?? {};
    res.set('Cache-Control', 'no-store');
    res.json(await this.arrivals.stop(reference(req), bookingToken(req), data.kind));
  });

  /** GET /internal/arrivals/live */
  public live = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const [live, shuttleTrips] = await Promise.all([this.arrivals.live(req.staff), this.shuttle.running(req.staff)]);
    res.json({ ...live, shuttleTrips });
  });

  /** GET /internal/parking/return-meeting-point */
  public getReturnMeetingPoint = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const parking = await this.parkings.getPrimary(req.staff);
    res.json({ data: await this.arrivals.returnMeetingPoint(parking.id) });
  });

  /** PUT /internal/parking/return-meeting-point */
  public setReturnMeetingPoint = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: ReturnMeetingPointDto = req.body;
    const parking = await this.parkings.getPrimary(req.staff);
    const point =
      data.lat !== null && data.lng !== null
        ? { lat: data.lat, lng: data.lng, label: data.label, instructions: data.instructions, photoUrl: data.photoUrl }
        : null;
    const saved = await this.arrivals.setReturnMeetingPoint(parking.id, point);
    // A pasted URL or a cleared point: the uploaded photo is no longer used (13/11/2026).
    await Container.get(MeetingPhotoService).forgetUnused(parking.id);
    res.json({ data: saved });
  });

  /** POST /internal/parking/return-meeting-point/photo (13/11/2026) */
  public setMeetingPhoto = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await Container.get(MeetingPhotoService).set(req.staff, req.body));
  });

  /** DELETE /internal/parking/return-meeting-point/photo */
  public removeMeetingPhoto = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    await Container.get(MeetingPhotoService).remove(req.staff);
    res.status(httpStatus.NO_CONTENT).end();
  });

  /** GET /public/parkings/:id/meeting-photo/:file — public: the traveller's page and WhatsApp's header read it. */
  public meetingPhoto = catchAsync(async (req: Request, res: Response) => {
    const photo = await Container.get(MeetingPhotoService).get(req.params.id as string, req.params.file as string);
    res.set('Content-Type', photo.contentType);
    // A new upload is a new file name: the address never changes content.
    res.set('Cache-Control', 'public, max-age=604800, immutable');
    res.set('X-Content-Type-Options', 'nosniff');
    if (photo.size != null) res.set('Content-Length', String(photo.size));
    photo.stream.pipe(res);
  });

  /** PUT /internal/notifications/devices */
  public registerDevice = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: RegisterDeviceDto = req.body;
    res.json(await this.devices.register(req.staff, data.subscriptionId.trim(), data.platform));
  });

  /** DELETE /internal/notifications/devices/:subscriptionId */
  public unregisterDevice = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    await this.devices.unregister(req.staff, req.params.subscriptionId as string);
    res.status(httpStatus.NO_CONTENT).send();
  });

  /** GET /internal/notifications/preferences */
  public preferences = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ ...(await this.devices.preferences(req.staff)), morningEmail: await this.morning.preference(req.staff) });
  });

  /** PATCH /internal/notifications/preferences */
  public updatePreferences = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: NotificationPreferencesDto = req.body;
    const { morningEmail, ...push } = data;
    const morning = morningEmail ? await this.morning.updatePreference(req.staff, morningEmail) : await this.morning.preference(req.staff);
    res.json({ ...(await this.devices.updatePreferences(req.staff, push)), morningEmail: morning });
  });

  /** POST /internal/notifications/morning-email/send: « M'envoyer celui d'aujourd'hui » (21/10/2026). */
  public sendMorningEmail = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.morning.sendNow(req.staff));
  });
}
