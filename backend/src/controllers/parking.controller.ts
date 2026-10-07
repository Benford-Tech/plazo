import { Response } from 'express';
import { Container } from 'typedi';
import { UpdateParkingDto } from '@/dtos/parking.dto';
import { GenerateSpotsDto, ReplaceSpotsDto, UpdateParkingPlanDto, UpdateSpotDto } from '@/dtos/parking-plan.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { AssignSpotDto } from '@/dtos/occupation.dto';
import { CarLocationDto } from '@/dtos/public-booking.dto';
import { OccupationService } from '@/services/occupation.service';
import { SpotPlanningService } from '@/services/spot-planning.service';
import { ParkingPlanService } from '@/services/parking-plan.service';
import { ParkingService } from '@/services/parking.service';
import catchAsync from '@/utils/catchAsync';

export class ParkingController {
  public parkingService = Container.get(ParkingService);
  public plans = Container.get(ParkingPlanService);
  public occupation = Container.get(OccupationService);
  public spotPlanning = Container.get(SpotPlanningService);

  /** GET /internal/parking */
  public getPrimary = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.parkingService.getPrimaryWithPosition(req.staff));
  });

  /** PATCH /internal/parkings/:id */
  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateParkingDto = req.body;
    const parking = await this.parkingService.update(req.staff, req.params.id as string, data);
    res.json({ message: 'Parking updated', data: parking });
  });

  /** GET /internal/parkings/:id/plan */
  public getPlan = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.plans.get(req.staff, req.params.id as string));
  });

  /** PATCH /internal/parkings/:id/plan */
  public updatePlan = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateParkingPlanDto = req.body;
    res.json({ message: 'Plan updated', data: await this.plans.update(req.staff, req.params.id as string, data) });
  });

  /** PUT /internal/parkings/:id/plan/spots */
  public replaceSpots = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: ReplaceSpotsDto = req.body;
    res.json({ message: 'Spots replaced', data: await this.plans.replaceSpots(req.staff, req.params.id as string, data) });
  });

  /** PATCH /internal/parkings/:id/plan/spots/:spotId */
  public updateSpot = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateSpotDto = req.body;
    res.json({ message: 'Spot updated', data: await this.plans.updateSpot(req.staff, req.params.id as string, req.params.spotId as string, data) });
  });

  /** POST /internal/parkings/:id/plan/apply-capacity */
  public applyCapacity = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Capacity updated', data: await this.plans.applyCapacity(req.staff, req.params.id as string) });
  });

  /** POST /internal/parkings/:id/plan/estimate */
  public estimatePlan = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.plans.estimate(req.staff, req.params.id as string));
  });

  /** POST /internal/parkings/:id/plan/generate */
  public generateSpots = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: GenerateSpotsDto = req.body;
    res.json({ message: 'Spots generated', data: await this.plans.generate(req.staff, req.params.id as string, data) });
  });

  /** GET /internal/parkings/:id/occupation */
  public occupationBoard = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.occupation.board(req.staff, req.params.id as string));
  });

  /** GET /internal/parkings/:id/occupation/search?q= */
  public occupationSearch = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    res.json({ results: await this.occupation.search(req.staff, req.params.id as string, q) });
  });

  /** GET /internal/parkings/:id/spot-planning?from=&days= */
  public spotPlanningBoard = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.spotPlanning.board(req.staff, req.params.id as string, req.query));
  });

  /** POST /internal/parkings/:id/spot-planning/preassign?from=&days= */
  public preassignSpots = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Spots pre-assigned', data: await this.spotPlanning.preassign(req.staff, req.params.id as string, req.query) });
  });

  /** POST /internal/reservations/:id/spot */
  /** PUT /internal/reservations/:id/car-location */
  public locateCar = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: CarLocationDto = req.body;
    res.json({ message: 'Car located', data: await this.occupation.locateCar(req.staff, req.params.id as string, data) });
  });

  /** DELETE /internal/reservations/:id/car-location */
  public clearCar = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Car location cleared', data: await this.occupation.clearCar(req.staff, req.params.id as string) });
  });

  public assignSpot = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: AssignSpotDto = req.body;
    res.json({ message: 'Spot assigned', data: await this.occupation.assign(req.staff, req.params.id as string, data) });
  });
}
