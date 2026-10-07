import { Response } from 'express';
import { Container } from 'typedi';
import { UpdateParkingDto, UpdateShuttleTrackingDto } from '@/dtos/parking.dto';
import { AddSpotsDto, SuggestZonesDto, GenerateSpotsDto, ReplaceSpotsDto, UpdateParkingPlanDto, UpdateSpotDto } from '@/dtos/parking-plan.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { AssignSpotDto } from '@/dtos/occupation.dto';
import { AssignFileDto, ReplaceFilesDto } from '@/dtos/file.dto';
import { FileService } from '@/services/file.service';
import { CarLocationDto } from '@/dtos/public-booking.dto';
import { OccupationService } from '@/services/occupation.service';
import { SpotPlanningService } from '@/services/spot-planning.service';
import { ParkingPlanService } from '@/services/parking-plan.service';
import { ParkingService } from '@/services/parking.service';
import { ZoneSuggestionService } from '@/services/zone-suggestion.service';
import catchAsync from '@/utils/catchAsync';

export class ParkingController {
  public parkingService = Container.get(ParkingService);
  public plans = Container.get(ParkingPlanService);
  public zoneSuggestions = Container.get(ZoneSuggestionService);
  public occupation = Container.get(OccupationService);
  public spotPlanning = Container.get(SpotPlanningService);
  public files = Container.get(FileService);

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

  /** PUT /internal/parkings/:id/shuttle-tracking (R-B, 07/10/2026) */
  public setShuttleTracking = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateShuttleTrackingDto = req.body;
    res.json({ data: await this.parkingService.setShuttleTracking(req.staff, req.params.id as string, data.tracking) });
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

  /** POST /internal/parkings/:id/plan/spots (P-B): spots laid by hand. */
  public addSpots = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: AddSpotsDto = req.body;
    res.json({ message: 'Spots added', data: await this.plans.addSpots(req.staff, req.params.id as string, data) });
  });

  /** DELETE /internal/parkings/:id/plan/spots/:spotId (P-B): a spot laid by hand. */
  public deleteSpot = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Spot removed', data: await this.plans.deleteSpot(req.staff, req.params.id as string, req.params.spotId as string) });
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

  /** POST /internal/parkings/:id/plan/suggest-zones (V-A): Claude reads the IGN photo of the land. */
  public suggestZones = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const options: SuggestZonesDto = req.body;
    res.json(await this.zoneSuggestions.suggest(req.staff, req.params.id as string, options));
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

  /** GET /internal/parkings/:id/files (S-C, 07/10/2026) */
  public filesBoard = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.files.board(req.staff, req.params.id as string));
  });

  /** GET /internal/parkings/:id/files/choices?reservationId= */
  public fileChoices = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const reservationId = typeof req.query.reservationId === 'string' ? req.query.reservationId : '';
    res.json({ choices: await this.files.choicesFor(req.staff, req.params.id as string, reservationId) });
  });

  /** PUT /internal/parkings/:id/files */
  public replaceFiles = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: ReplaceFilesDto = req.body;
    res.json({ message: 'Files saved', data: await this.files.replace(req.staff, req.params.id as string, data) });
  });

  /** POST /internal/parkings/:id/files/from-plan */
  public filesFromPlan = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Files built from the plan', data: await this.files.fromSpots(req.staff, req.params.id as string) });
  });

  /** POST /internal/parkings/:id/files/prepare */
  public prepareFiles = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Files prepared', data: await this.files.prepareFor(req.staff, req.params.id as string) });
  });

  /** POST /internal/reservations/:id/file */
  public assignFile = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: AssignFileDto = req.body;
    res.json({ message: 'File assigned', data: await this.files.assign(req.staff, req.params.id as string, data) });
  });
}
