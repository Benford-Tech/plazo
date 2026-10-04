import { Router } from 'express';
import { ParkingController } from '@/controllers/parking.controller';
import { UpdateParkingDto } from '@/dtos/parking.dto';
import { AssignSpotDto } from '@/dtos/occupation.dto';
import { GenerateSpotsDto, ReplaceSpotsDto, UpdateParkingPlanDto, UpdateSpotDto } from '@/dtos/parking-plan.dto';
import { PlatformController } from '@/controllers/platform.controller';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
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
    // Bloc 2, step "Planning des places": one line per spot over the coming days.
    this.router.get('/internal/parkings/:id/spot-planning', StaffAuthMiddleware('reservations:view'), this.parking.spotPlanningBoard);
    this.router.post('/internal/parkings/:id/spot-planning/preassign', StaffAuthMiddleware('reservations:status'), this.parking.preassignSpots);
    this.router.get('/internal/geo/parcels', StaffAuthMiddleware('parking:manage'), this.geo.parcels);
    this.router.get('/internal/geo/parkings', StaffAuthMiddleware('parking:manage'), this.geo.parkings);
    this.router.get('/internal/geo/geocode', StaffAuthMiddleware('parking:manage'), this.geo.geocode);
  }
}
