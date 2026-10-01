import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { LoginDto, RefreshTokenDto } from '@/dtos/auth.dto';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Staff authentication (pro space and pro mobile app)
 */
/**
 * @swagger
 * /internal/auth/login:
 *   post:
 *     summary: Log in a staff member
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: "{ tokenData: { access: { token, expires }, refresh: { token, expires } }, user }"
 *       401:
 *         description: Invalid credentials (code invalid_credentials)
 *       429:
 *         description: Email locked after repeated failures (code too_many_attempts)
 * /internal/auth/refresh:
 *   post:
 *     summary: Exchange a refresh token for a new token pair (the old pair is revoked)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: "{ tokenData }"
 * /internal/auth/logout:
 *   post:
 *     summary: Revoke the current token pair
 *     tags: [Auth]
 *     responses:
 *       204:
 *         description: Logged out
 */
export class AuthRoute implements Routes {
  public router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/internal/auth/login', ValidationMiddleware(LoginDto), this.auth.login);
    this.router.post('/internal/auth/refresh', ValidationMiddleware(RefreshTokenDto), this.auth.refresh);
    this.router.post('/internal/auth/logout', StaffAuthMiddleware(), this.auth.logout);
  }
}
