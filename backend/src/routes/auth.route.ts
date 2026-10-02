import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { AcceptInvitationDto, AccountTokenDto, LoginDto, RefreshTokenDto, SignupDto } from '@/dtos/auth.dto';
import { Routes } from '@/interfaces/routes.interface';
import { signupLimiter } from '@/middlewares/rateLimiter';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
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
 *       403:
 *         description: The operator's account is suspended (code account_suspended)
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
 * /internal/auth/signup:
 *   post:
 *     summary: Self sign-up of an operator (company, parking, manager) — public, rate limited per IP
 *     description: >
 *       Creates the operator, its parking with a draft Plazo page at the airport, and its manager
 *       (email to confirm). The answer is the same when the email already has an account (that
 *       person is emailed instead) or when the honeypot field "website" is filled (nothing is
 *       created). The client then logs in with the email and password. Outside production, when
 *       the email could not be sent, devVerificationUrl carries the confirmation link.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, parkingName, totalCapacity, airportCode, managerName, email, phone, password, passwordConfirmation, acceptTerms]
 *             properties:
 *               companyName: { type: string, maxLength: 120 }
 *               parkingName: { type: string, maxLength: 80 }
 *               totalCapacity: { type: integer, minimum: 1, maximum: 10000 }
 *               airportCode: { type: string, example: LYS }
 *               managerName: { type: string, maxLength: 120 }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string, minLength: 10 }
 *               passwordConfirmation: { type: string }
 *               acceptTerms: { type: boolean, enum: [true] }
 *               website: { type: string, description: "Honeypot: leave empty" }
 *     responses:
 *       201:
 *         description: "{ message, devVerificationUrl? }"
 *       400:
 *         description: Validation (fields, e.g. password_mismatch, terms_required, unknown_airport)
 *       429:
 *         description: Too many sign-ups from this address (code too_many_requests)
 * /internal/auth/verify-email:
 *   post:
 *     summary: Confirm an email with the link's token (single use, 48 h)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [token], properties: { token: { type: string } } }
 *     responses:
 *       200:
 *         description: "{ verified: true }"
 *       400:
 *         description: Invalid, expired or used link (code invalid_link)
 * /internal/auth/verify-email/resend:
 *   post:
 *     summary: Send a new confirmation link to the signed-in person (the previous one stops working)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: "{ alreadyVerified, devVerificationUrl? }"
 * /internal/auth/invitation:
 *   post:
 *     summary: Who an invitation is for (email, operator name), before choosing the password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [token], properties: { token: { type: string } } }
 *     responses:
 *       200:
 *         description: "{ email, operatorName }"
 *       400:
 *         description: Invalid, expired or used link (code invalid_link)
 * /internal/auth/invitation/accept:
 *   post:
 *     summary: Choose one's password from an invitation (single use, 7 days) and log in
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 10 }
 *     responses:
 *       200:
 *         description: "{ tokenData, user }"
 *       400:
 *         description: Invalid, expired or used link (code invalid_link)
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
    this.router.post('/internal/auth/signup', signupLimiter, ValidationMiddleware(SignupDto), this.auth.signup);
    this.router.post('/internal/auth/verify-email', ValidationMiddleware(AccountTokenDto), this.auth.verifyEmail);
    this.router.post('/internal/auth/verify-email/resend', StaffAuthMiddleware(), RefuseInViewAs(), this.auth.resendVerification);
    this.router.post('/internal/auth/invitation', ValidationMiddleware(AccountTokenDto), this.auth.invitation);
    this.router.post('/internal/auth/invitation/accept', ValidationMiddleware(AcceptInvitationDto), this.auth.acceptInvitation);
  }
}
