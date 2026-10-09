import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { CreateCapacityStudyDto, UpdateCapacityStudyDto } from '@/dtos/capacity-study.dto';
import { InviteOperatorDto, PlatformNotificationDto, RejectListingDto, UnpublishListingDto, UpdateCommissionDto } from '@/dtos/platform.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ValidationException } from '@/middlewares/validation.middleware';
import { CapacityStudyService } from '@/services/capacity-study.service';
import { GeoService, MAX_BBOX_SPAN } from '@/services/geo.service';
import { PlatformService } from '@/services/platform.service';
import catchAsync from '@/utils/catchAsync';

const str = (value: unknown) => (typeof value === 'string' ? value : undefined);

/** The `bbox` query of a BD TOPO lookup: four coordinates, at most MAX_BBOX_SPAN degrees across. */
function bboxOf(req: Request): [number, number, number, number] {
  const parts = (str(req.query.bbox) ?? '').split(',').map(v => coordinate(v, 180));
  const [minLon, minLat, maxLon, maxLat] = parts as number[];
  const valid =
    parts.length === 4 && parts.every(v => v !== null) && Math.abs(minLat) <= 90 && Math.abs(maxLat) <= 90 && minLon < maxLon && minLat < maxLat;
  if (!valid) throw new ValidationException({ bbox: 'invalid_bbox' });
  if (maxLon - minLon > MAX_BBOX_SPAN || maxLat - minLat > MAX_BBOX_SPAN) throw new ValidationException({ bbox: 'bbox_too_large' });
  return [minLon, minLat, maxLon, maxLat];
}

function coordinate(value: unknown, max: number): number | null {
  const n = Number(str(value));
  return str(value) !== undefined && str(value) !== '' && Number.isFinite(n) && Math.abs(n) <= max ? n : null;
}

/** The platform owner's space: operators, listings review, bookings, payouts, capacity studies. */
export class PlatformController {
  public studies = Container.get(CapacityStudyService);
  public geo = Container.get(GeoService);
  public platform = Container.get(PlatformService);

  /** GET /internal/platform/operators */
  /** GET /internal/platform/notifications */
  public notifications = catchAsync(async (req: Request, res: Response) => {
    res.json({ data: await this.platform.listNotifications() });
  });

  /** GET /internal/platform/notifications/audience?audience=&operatorId= */
  public notificationAudience = catchAsync(async (req: Request, res: Response) => {
    const audience = String(req.query.audience ?? 'staff');
    if (!['staff', 'travellers', 'operator'].includes(audience)) throw new ValidationException({ audience: 'invalid_audience' });
    res.set('Cache-Control', 'no-store');
    res.json(
      await this.platform.notificationAudience(
        audience as 'staff' | 'travellers' | 'operator',
        req.query.operatorId ? String(req.query.operatorId) : null,
      ),
    );
  });

  /** POST /internal/platform/notifications */
  public sendNotification = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: PlatformNotificationDto = req.body;
    res.status(httpStatus.CREATED).json({ data: await this.platform.sendNotification(req.staff, data) });
  });

  /** GET /internal/platform/operators[?view=archived] */
  public operators = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.platform.operators(req.query.view));
  });

  /** PATCH /internal/platform/operators/:id/commission */
  public setCommission = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateCommissionDto = req.body;
    res.json({ message: 'Commission saved', data: await this.platform.setCommission(req.staff, req.params.id as string, data.commissionBps) });
  });

  /** POST /internal/platform/operators/:id/suspend */
  public suspend = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Operator suspended', data: await this.platform.suspend(req.staff, req.params.id as string) });
  });

  /** POST /internal/platform/operators/:id/reactivate */
  public reactivate = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Operator reactivated', data: await this.platform.reactivate(req.staff, req.params.id as string) });
  });

  /** POST /internal/platform/operators/:id/archive */
  public archive = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Operator archived', data: await this.platform.archive(req.staff, req.params.id as string) });
  });

  /** POST /internal/platform/operators/:id/unarchive */
  public unarchive = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Operator unarchived', data: await this.platform.unarchive(req.staff, req.params.id as string) });
  });

  /** POST /internal/platform/operators/:id/view-as */
  public viewAs = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.status(httpStatus.CREATED).json(await this.platform.viewAs(req.staff, req.params.id as string, { userAgent: req.get('user-agent') ?? null }));
  });

  /** POST /internal/platform/invitations */
  public invite = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: InviteOperatorDto = req.body;
    res.status(httpStatus.CREATED).json(await this.platform.invite(req.staff, data));
  });

  /** POST /internal/platform/operators/:id/invitation */
  public resendInvitation = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.platform.resendInvitation(req.staff, req.params.id as string));
  });

  /** GET /internal/platform/listings?status= */
  public listings = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.platform.listListings(str(req.query.status) || undefined));
  });

  /** POST /internal/platform/listings/:id/approve */
  public approveListing = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Listing published', data: await this.platform.approveListing(req.staff, req.params.id as string) });
  });

  /** POST /internal/platform/listings/:id/reject */
  public rejectListing = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: RejectListingDto = req.body;
    res.json({ message: 'Listing refused', data: await this.platform.rejectListing(req.staff, req.params.id as string, data.message) });
  });

  /** POST /internal/platform/listings/:id/unpublish */
  public unpublishListing = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UnpublishListingDto = req.body;
    res.json({ message: 'Listing unpublished', data: await this.platform.unpublishListing(req.staff, req.params.id as string, data.message) });
  });

  /** GET /internal/platform/reservations?operatorId=&from=&to=&page= */
  public reservations = catchAsync(async (req: Request, res: Response) => {
    const page = Number(str(req.query.page) ?? 1);
    res.json(
      await this.platform.reservations({
        operatorId: str(req.query.operatorId) || undefined,
        from: str(req.query.from) || undefined,
        to: str(req.query.to) || undefined,
        page: Number.isFinite(page) ? page : 1,
      }),
    );
  });

  /** GET /internal/platform/payments */
  public payments = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.platform.paymentsOverview());
  });

  /** POST /internal/platform/payouts/:reservationId/retry */
  public retryPayout = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.platform.retryPayout(req.staff, req.params.reservationId as string));
  });

  /** GET /internal/platform/capacity-studies */
  public listStudies = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.studies.list());
  });

  /** GET /internal/platform/capacity-studies/:id */
  public getStudy = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.studies.get(req.params.id as string));
  });

  /** POST /internal/platform/capacity-studies */
  public createStudy = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: CreateCapacityStudyDto = req.body;
    res.status(httpStatus.CREATED).json({ message: 'Study created', data: await this.studies.create(req.staff, data) });
  });

  /** PATCH /internal/platform/capacity-studies/:id */
  public updateStudy = catchAsync(async (req: Request, res: Response) => {
    const data: UpdateCapacityStudyDto = req.body;
    res.json({ message: 'Study saved', data: await this.studies.update(req.params.id as string, data) });
  });

  /** DELETE /internal/platform/capacity-studies/:id */
  public deleteStudy = catchAsync(async (req: Request, res: Response) => {
    await this.studies.remove(req.params.id as string);
    res.status(httpStatus.NO_CONTENT).send();
  });

  /** GET /internal/platform/geo/parcels?lon=&lat= */
  public parcels = catchAsync(async (req: Request, res: Response) => {
    const lon = coordinate(req.query.lon, 180);
    const lat = coordinate(req.query.lat, 90);
    if (lon === null || lat === null) {
      throw new ValidationException({
        ...(lon === null ? { lon: 'invalid_coordinate' } : {}),
        ...(lat === null ? { lat: 'invalid_coordinate' } : {}),
      });
    }
    res.json({ parcels: await this.geo.parcelsAt(lon, lat) });
  });

  /** GET /internal/platform/geo/parkings?bbox=minLon,minLat,maxLon,maxLat */
  public parkings = catchAsync(async (req: Request, res: Response) => {
    res.json({ parkings: await this.geo.parkingsIn(bboxOf(req)) });
  });

  /** GET /internal/platform/geo/buildings?bbox=minLon,minLat,maxLon,maxLat (B-A) */
  public buildings = catchAsync(async (req: Request, res: Response) => {
    res.json({ buildings: await this.geo.buildingsIn(bboxOf(req)) });
  });

  /** GET /internal/platform/geo/geocode?q= */
  public geocode = catchAsync(async (req: Request, res: Response) => {
    const q = (str(req.query.q) ?? '').trim();
    if (q.length < 3) throw new ValidationException({ q: 'too_short' });
    if (q.length > 200) throw new ValidationException({ q: 'too_long' });
    res.json({ results: await this.geo.geocode(q) });
  });
}
