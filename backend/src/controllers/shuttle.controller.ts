import { Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { ShuttleVehicleDto, StartTripDto, TripPositionDto, UpdateShuttleVehicleDto } from '@/dtos/shuttle.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ShuttleService } from '@/services/shuttle.service';
import catchAsync from '@/utils/catchAsync';

export class ShuttleController {
  public shuttle = Container.get(ShuttleService);

  /** GET /internal/shuttle/pickups */
  public pickups = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.shuttle.pickups(req.staff));
  });

  /** GET /internal/shuttle/vehicles */
  public vehicles = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.shuttle.vehicles(req.staff) });
  });

  /** POST /internal/shuttle/vehicles */
  public addVehicle = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: ShuttleVehicleDto = req.body;
    res.status(httpStatus.CREATED).json({ data: await this.shuttle.addVehicle(req.staff, data) });
  });

  /** PATCH /internal/shuttle/vehicles/:id */
  public updateVehicle = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateShuttleVehicleDto = req.body;
    res.json({ data: await this.shuttle.updateVehicle(req.staff, req.params.id as string, data) });
  });

  /** GET /internal/shuttle/departures */
  public departures = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.shuttle.departures(req.staff));
  });

  /** DELETE /internal/shuttle/vehicles/:id */
  public removeVehicle = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    await this.shuttle.removeVehicle(req.staff, req.params.id as string);
    res.status(httpStatus.NO_CONTENT).send();
  });

  /** GET /internal/shuttle/trips/current */
  public current = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json({ trip: await this.shuttle.current(req.staff) });
  });

  /** POST /internal/shuttle/trips */
  public start = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: StartTripDto = req.body;
    res.status(httpStatus.CREATED).json({ trip: await this.shuttle.start(req.staff, data) });
  });

  /** POST /internal/shuttle/trips/:id/position */
  public position = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: TripPositionDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.json({ trip: await this.shuttle.position(req.staff, req.params.id as string, data) });
  });

  /** POST /internal/shuttle/trips/:id/end */
  public end = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ trip: await this.shuttle.end(req.staff, req.params.id as string) });
  });
}
