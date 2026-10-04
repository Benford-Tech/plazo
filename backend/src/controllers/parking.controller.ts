import { Response } from 'express';
import { Container } from 'typedi';
import { UpdateParkingDto } from '@/dtos/parking.dto';
import { GenerateSpotsDto, ReplaceSpotsDto, UpdateParkingPlanDto, UpdateSpotDto } from '@/dtos/parking-plan.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ParkingPlanService } from '@/services/parking-plan.service';
import { ParkingService } from '@/services/parking.service';
import catchAsync from '@/utils/catchAsync';

export class ParkingController {
  public parkingService = Container.get(ParkingService);
  public plans = Container.get(ParkingPlanService);

  /** GET /internal/parking */
  public getPrimary = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.parkingService.getPrimary(req.staff));
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
}
