import { Router } from 'express';
import { ParkingController } from '@/controllers/parking.controller';
import { UpdateParkingDto } from '@/dtos/parking.dto';
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

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/internal/parking', StaffAuthMiddleware('dashboard:view'), this.parking.getPrimary);
    this.router.patch('/internal/parkings/:id', StaffAuthMiddleware('parking:manage'), ValidationMiddleware(UpdateParkingDto), this.parking.update);
  }
}
