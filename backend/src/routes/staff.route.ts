import { Router } from 'express';
import { StaffController } from '@/controllers/staff.controller';
import { ChangePasswordDto, CreateStaffDto, ResetPasswordDto, UpdateStaffDto } from '@/dtos/staff.dto';
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
 *     summary: Current staff member, with the operator name, isPlatformAdmin, emailVerified and viewAs ({ operatorId, operatorName } in a platform admin's view-as session, else null)
 *     tags: [Staff]
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
 *             required: [name, email, role, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               role: { type: string, enum: [manager, agent, driver, valet] }
 *               password: { type: string, minLength: 10 }
 * /internal/staff/{id}:
 *   patch:
 *     summary: Change role or activation (manager only; deactivation revokes sessions)
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
