import { Router } from 'express';
import { StaffController } from '@/controllers/staff.controller';
import { ChangePasswordDto, CreateStaffDto, ResetPasswordDto, UpdateMeDto, UpdateStaffDto, SetPostDto, SetVehicleDto } from '@/dtos/staff.dto';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: The operator's team (manager, agents, drivers, valets)
 */
/**
 * @swagger
 * /internal/staff/me:
 *   get:
 *     summary: Current staff member, with the operator name, isPlatformAdmin, emailVerified, viewAs ({ operatorId, operatorName } in a platform admin's view-as session, else null), post / postSetAt, effectivePost and allowedPosts
 *     tags: [Staff]
 *   patch:
 *     summary: Votre nom (09/10/2026) — one's own first and last name (trimmed, both required; `name` recomputed as "Prénom Nom"; 403 view_as_read_only); answers like GET
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [firstName, lastName], properties: { firstName: { type: string, maxLength: 60 }, lastName: { type: string, maxLength: 60 } } } } }
 *     responses:
 *       200: { description: The session user, with the new name }
 *       400: { description: "validation_failed: fields.firstName / fields.lastName = required | too_long" }
 * /internal/staff/me/vehicle:
 *   patch:
 *     summary: Mon véhicule aujourd'hui (V-A) — the shuttle taken for the day ({ vehicleId } or null to hand it back; 409 vehicle_taken with holderName, 422 vehicle_out_of_service); the session user then carries `vehicle`
 *     tags: [Staff]
 * /internal/staff/me/post:
 *   patch:
 *     summary: Aujourd'hui, je suis… (R-C) — the post held for the day, among those the role covers (422 post_not_allowed)
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [post], properties: { post: { type: string, enum: [manager, agent, driver, valet] } } } } }
 *     responses:
 *       200: { description: The session user, with the new post }
 * /internal/staff/me/password:
 *   patch:
 *     summary: Change one's password (signs out every device)
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 10 }
 * /internal/staff:
 *   get:
 *     summary: List the team (manager only)
 *     tags: [Staff]
 *   post:
 *     summary: Create a team member (manager only)
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, role, password]
 *             properties:
 *               firstName: { type: string, maxLength: 60 }
 *               lastName: { type: string, maxLength: 60 }
 *               email: { type: string }
 *               phone: { type: string }
 *               role: { type: string, enum: [manager, agent, driver, valet] }
 *               password: { type: string, minLength: 10 }
 * /internal/staff/{id}:
 *   patch:
 *     summary: Change role, activation or first / last name (manager only; deactivation revokes sessions; `name` recomputed)
 *     tags: [Staff]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [manager, agent, driver, valet] }
 *               isActive: { type: boolean }
 *               firstName: { type: string, maxLength: 60 }
 *               lastName: { type: string, maxLength: 60 }
 * /internal/staff/{id}/reset-password:
 *   post:
 *     summary: Set a temporary password (manager only; revokes sessions)
 *     tags: [Staff]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
export class StaffRoute implements Routes {
  public router = Router();
  public staff = new StaffController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/internal/staff/me', StaffAuthMiddleware(), this.staff.me);
    this.router.patch('/internal/staff/me', StaffAuthMiddleware(), RefuseInViewAs(), ValidationMiddleware(UpdateMeDto), this.staff.updateMe);
    this.router.patch('/internal/staff/me/post', StaffAuthMiddleware(), RefuseInViewAs(), ValidationMiddleware(SetPostDto), this.staff.setPost);
    this.router.patch(
      '/internal/staff/me/vehicle',
      StaffAuthMiddleware(),
      RefuseInViewAs(),
      ValidationMiddleware(SetVehicleDto),
      this.staff.setVehicle,
    );
    // Read-only while a platform admin views the operator's space (RefuseInViewAs: 403 view_as_read_only).
    this.router.patch(
      '/internal/staff/me/password',
      StaffAuthMiddleware(),
      RefuseInViewAs(),
      ValidationMiddleware(ChangePasswordDto),
      this.staff.changePassword,
    );
    this.router.get('/internal/staff', StaffAuthMiddleware('team:manage'), this.staff.list);
    this.router.post(
      '/internal/staff',
      StaffAuthMiddleware('team:manage'),
      RefuseInViewAs(),
      ValidationMiddleware(CreateStaffDto),
      this.staff.create,
    );
    this.router.patch(
      '/internal/staff/:id',
      StaffAuthMiddleware('team:manage'),
      RefuseInViewAs(),
      ValidationMiddleware(UpdateStaffDto),
      this.staff.update,
    );
    this.router.post(
      '/internal/staff/:id/reset-password',
      StaffAuthMiddleware('team:manage'),
      RefuseInViewAs(),
      ValidationMiddleware(ResetPasswordDto),
      this.staff.resetPassword,
    );
  }
}
