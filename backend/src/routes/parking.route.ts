import { Router } from 'express';
import { ParkingController } from '@/controllers/parking.controller';
import { UpdateParkingDto, UpdateShuttleTrackingDto } from '@/dtos/parking.dto';
import { AssignSpotDto } from '@/dtos/occupation.dto';
import { AssignFileDto, ReplaceFilesDto } from '@/dtos/file.dto';
import { CarLocationDto } from '@/dtos/public-booking.dto';
import { AddSpotsDto, GenerateSpotsDto, ReplaceSpotsDto, SuggestZonesDto, UpdateParkingPlanDto, UpdateSpotDto } from '@/dtos/parking-plan.dto';
import { PlatformController } from '@/controllers/platform.controller';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Parking
 *   description: Parking settings and capacity
 */
/**
 * @swagger
 * /internal/parking:
 *   get:
 *     summary: The operator's parking with its bookable capacity (total minus safety margin)
 *     tags: [Parking]
 * /internal/parkings/{id}:
 *   patch:
 *     summary: Update parking settings (manager only, audited)
 *     tags: [Parking]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, totalCapacity, safetyMarginPct, shuttleTravelMinutes]
 *             properties:
 *               name: { type: string }
 *               address: { type: string, nullable: true }
 *               totalCapacity: { type: integer, minimum: 1 }
 *               safetyMarginPct: { type: integer, minimum: 0, maximum: 50 }
 *               shuttleTravelMinutes: { type: integer, minimum: 1, maximum: 120 }
 * /internal/parkings/{id}/shuttle-tracking:
 *   put:
 *     summary: Who sees the position of the parking's shuttles (R-B, managers, audited)
 *     tags: [Parking]
 *     description: >
 *       "off": the drivers do not share it (the position route answers 409 shuttle_tracking_off);
 *       "team": the staff's live maps only; "everyone": also the travellers (booking, home map,
 *       "Votre navette est là") and "EN DIRECT" on the search results (liveShuttle).
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [tracking], properties: { tracking: { type: string, enum: [off, team, everyone] } } }
 *     responses:
 *       200: { description: "{ data: the parking }" }
 */
export class ParkingRoute implements Routes {
  public router = Router();
  public parking = new ParkingController();
  // The IGN proxies (parcels, BD TOPO parkings, geocoding) of the estimator, opened to the operators' plan.
  public geo = new PlatformController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/internal/parking', StaffAuthMiddleware('dashboard:view'), this.parking.getPrimary);
    this.router.patch('/internal/parkings/:id', StaffAuthMiddleware('parking:manage'), ValidationMiddleware(UpdateParkingDto), this.parking.update);
    this.router.put(
      '/internal/parkings/:id/shuttle-tracking',
      StaffAuthMiddleware('parking:manage'),
      RefuseInViewAs(),
      ValidationMiddleware(UpdateShuttleTrackingDto),
      this.parking.setShuttleTracking,
    );

    // Bloc 2, step "Plan": the operator's parking plan and its spots.
    this.router.get('/internal/parkings/:id/plan', StaffAuthMiddleware('dashboard:view'), this.parking.getPlan);
    this.router.patch(
      '/internal/parkings/:id/plan',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(UpdateParkingPlanDto),
      this.parking.updatePlan,
    );
    this.router.put(
      '/internal/parkings/:id/plan/spots',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(ReplaceSpotsDto),
      this.parking.replaceSpots,
    );
    this.router.post(
      '/internal/parkings/:id/plan/spots',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(AddSpotsDto),
      this.parking.addSpots,
    );
    this.router.delete('/internal/parkings/:id/plan/spots/:spotId', StaffAuthMiddleware('parking:manage'), this.parking.deleteSpot);
    this.router.patch(
      '/internal/parkings/:id/plan/spots/:spotId',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(UpdateSpotDto),
      this.parking.updateSpot,
    );
    this.router.post('/internal/parkings/:id/plan/apply-capacity', StaffAuthMiddleware('parking:manage'), this.parking.applyCapacity);
    // The app: the layout engine runs on the server.
    this.router.post('/internal/parkings/:id/plan/estimate', StaffAuthMiddleware('parking:manage'), this.parking.estimatePlan);
    this.router.post(
      '/internal/parkings/:id/plan/suggest-zones',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(SuggestZonesDto),
      this.parking.suggestZones,
    );
    this.router.post(
      '/internal/parkings/:id/plan/generate',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(GenerateSpotsDto),
      this.parking.generateSpots,
    );
    // Bloc 2, step "Occupation": who is where, and where the arrivals go.
    this.router.get('/internal/parkings/:id/occupation', StaffAuthMiddleware('reservations:view'), this.parking.occupationBoard);
    this.router.get('/internal/parkings/:id/occupation/search', StaffAuthMiddleware('reservations:view'), this.parking.occupationSearch);
    this.router.post(
      '/internal/reservations/:id/spot',
      StaffAuthMiddleware('reservations:status'),
      ValidationMiddleware(AssignSpotDto),
      this.parking.assignSpot,
    );
    // Where the car is parked (06/10/2026): the valet's GPS fix, apart from the spot assignment.
    this.router.put(
      '/internal/reservations/:id/car-location',
      StaffAuthMiddleware('reservations:status'),
      ValidationMiddleware(CarLocationDto),
      this.parking.locateCar,
    );
    this.router.delete('/internal/reservations/:id/car-location', StaffAuthMiddleware('reservations:status'), this.parking.clearCar);
    // Bloc 2, step "Planning des places": one line per spot over the coming days.
    // S-C (07/10/2026): files as the unit of storage.
    this.router.get('/internal/parkings/:id/files', StaffAuthMiddleware('reservations:view'), this.parking.filesBoard);
    this.router.get('/internal/parkings/:id/files/choices', StaffAuthMiddleware('reservations:view'), this.parking.fileChoices);
    this.router.put(
      '/internal/parkings/:id/files',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(ReplaceFilesDto),
      this.parking.replaceFiles,
    );
    this.router.post('/internal/parkings/:id/files/from-plan', StaffAuthMiddleware('parking:manage'), this.parking.filesFromPlan);
    this.router.post('/internal/parkings/:id/files/prepare', StaffAuthMiddleware('reservations:status'), this.parking.prepareFiles);
    this.router.post(
      '/internal/reservations/:id/file',
      StaffAuthMiddleware('reservations:status'),
      ValidationMiddleware(AssignFileDto),
      this.parking.assignFile,
    );
    this.router.get('/internal/parkings/:id/spot-planning', StaffAuthMiddleware('reservations:view'), this.parking.spotPlanningBoard);
    this.router.post('/internal/parkings/:id/spot-planning/preassign', StaffAuthMiddleware('reservations:status'), this.parking.preassignSpots);
    this.router.get('/internal/geo/parcels', StaffAuthMiddleware('parking:manage'), this.geo.parcels);
    this.router.get('/internal/geo/parkings', StaffAuthMiddleware('parking:manage'), this.geo.parkings);
    this.router.get('/internal/geo/buildings', StaffAuthMiddleware('parking:manage'), this.geo.buildings);
    this.router.get('/internal/geo/geocode', StaffAuthMiddleware('parking:manage'), this.geo.geocode);
  }
}
