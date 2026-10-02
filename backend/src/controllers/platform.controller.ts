import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { CreateCapacityStudyDto, UpdateCapacityStudyDto } from '@/dtos/capacity-study.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ValidationException } from '@/middlewares/validation.middleware';
import { CapacityStudyService } from '@/services/capacity-study.service';
import { GeoService, MAX_BBOX_SPAN } from '@/services/geo.service';
import catchAsync from '@/utils/catchAsync';

const str = (value: unknown) => (typeof value === 'string' ? value : undefined);

function coordinate(value: unknown, max: number): number | null {
  const n = Number(str(value));
  return str(value) !== undefined && str(value) !== '' && Number.isFinite(n) && Math.abs(n) <= max ? n : null;
}

/** Internal tools of the platform owner: capacity studies and the IGN proxies they use. */
export class PlatformController {
  public studies = Container.get(CapacityStudyService);
  public geo = Container.get(GeoService);

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
    const parts = (str(req.query.bbox) ?? '').split(',').map(v => coordinate(v, 180));
    const [minLon, minLat, maxLon, maxLat] = parts as number[];
    const valid =
      parts.length === 4 && parts.every(v => v !== null) && Math.abs(minLat) <= 90 && Math.abs(maxLat) <= 90 && minLon < maxLon && minLat < maxLat;
    if (!valid) throw new ValidationException({ bbox: 'invalid_bbox' });
    if (maxLon - minLon > MAX_BBOX_SPAN || maxLat - minLat > MAX_BBOX_SPAN) throw new ValidationException({ bbox: 'bbox_too_large' });
    res.json({ parkings: await this.geo.parkingsIn([minLon, minLat, maxLon, maxLat]) });
  });

  /** GET /internal/platform/geo/geocode?q= */
  public geocode = catchAsync(async (req: Request, res: Response) => {
    const q = (str(req.query.q) ?? '').trim();
    if (q.length < 3) throw new ValidationException({ q: 'too_short' });
    if (q.length > 200) throw new ValidationException({ q: 'too_long' });
    res.json({ results: await this.geo.geocode(q) });
  });
}
