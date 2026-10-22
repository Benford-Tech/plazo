import { Router } from 'express';
import { IdentityController } from '@/controllers/identity.controller';
import { AppleSignInDto, DeleteIdentityDto, GoogleSignInDto, JoinParkingDto } from '@/dtos/identity.dto';
import { IdentityAuthMiddleware } from '@/middlewares/identity-auth.middleware';
import { Routes } from '@/interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Onboarding
 *   description: >
 *     Plazo Pro sign-in with Apple (iPhone) or Google (Android), then « Rejoindre un parking » with the code of the day
 *     (13/10/2026). The onboarding routes take an onboarding token (Bearer), never a staff token; they stay under
 *     /internal/auth so that the app's staff interceptor never touches them.
 * components:
 *   schemas:
 *     IdentityView:
 *       type: object
 *       properties:
 *         provider: { type: string, enum: [apple, google] }
 *         email: { type: string, nullable: true }
 *         isPrivateEmail: { type: boolean }
 *         firstName: { type: string }
 *         lastName: { type: string }
 *     JoinRequestView:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         status: { type: string, enum: [pending, accepted, refused, cancelled, expired] }
 *         operatorName: { type: string }
 *         firstName: { type: string }
 *         lastName: { type: string }
 *         wishedRole: { type: string, enum: [agent, driver, valet] }
 *         role: { type: string, enum: [agent, driver, valet], nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         decidedAt: { type: string, format: date-time, nullable: true }
 *         expiresAt: { type: string, format: date-time }
 */
/**
 * @swagger
 * /internal/auth/providers:
 *   get:
 *     summary: Which sign-in buttons the app may show ({ apple, google, googleClientId }); Apple needs its key, Google a client ID
 *     tags: [Onboarding]
 *     security: []
 *     responses:
 *       200: { description: "{ apple: boolean, google: boolean, googleClientId: string | null } (the Web client, for the pro space's button)" }
 * /internal/auth/apple:
 *   post:
 *     summary: Sign in with Apple — a member's session, or an onboarding session to join a parking
 *     description: >
 *       Verifies the identity token against Apple's keys (RS256, iss https://appleid.apple.com, aud in APPLE_CLIENT_IDS,
 *       nonce = SHA-256 of rawNonce). givenName / familyName come from the app (Apple sends them on the first
 *       authorisation only; a name already stored is kept). Each identity token works once (the same token again → 401
 *       identity_invalid). Linked to an active member → `signed_in` with the same { tokenData, user } as the email
 *       login (the identity's onboarding sessions are then revoked); otherwise `onboarding` with a 7-day onboarding
 *       token (5 at most per identity, the oldest go) and the latest request (pending, or refused / expired / cancelled
 *       in the last 7 days, or accepted while linked).
 *     tags: [Onboarding]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identityToken, rawNonce]
 *             properties:
 *               identityToken: { type: string }
 *               rawNonce: { type: string }
 *               givenName: { type: string }
 *               familyName: { type: string }
 *     responses:
 *       200:
 *         description: >
 *           "{ status: 'signed_in', tokenData, user }" or "{ status: 'onboarding', onboardingToken, expiresAt, identity:
 *           IdentityView, request: JoinRequestView | null }"
 *       401: { description: "The token could not be verified, or was already used (code identity_invalid)" }
 *       403: { description: "The member's operator is suspended (account_suspended) or the member is disabled (account_disabled)" }
 *       409: { description: Apple sign-in is not configured (code provider_unavailable) }
 *       503: { description: "Apple's keys cannot be fetched (code provider_unreachable)" }
 * /internal/auth/google:
 *   post:
 *     summary: Sign in with Google — same answers as Apple
 *     description: >
 *       Verifies the ID token against Google's keys (RS256, iss accounts.google.com, aud in GOOGLE_CLIENT_IDS,
 *       email_verified true); the names come from given_name / family_name. Each ID token works once.
 *     tags: [Onboarding]
 *     security: []
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [idToken], properties: { idToken: { type: string } } } } }
 *     responses:
 *       200: { description: "Same as /internal/auth/apple" }
 *       401: { description: identity_invalid }
 *       403: { description: account_suspended | account_disabled }
 *       409: { description: provider_unavailable }
 *       503: { description: provider_unreachable }
 * /internal/auth/onboarding:
 *   get:
 *     summary: The signed-in identity and its latest request (polled every 10 s by the waiting screen)
 *     tags: [Onboarding]
 *     responses:
 *       200: { description: "{ identity: IdentityView, request: JoinRequestView | null } (status accepted: open the session)" }
 *       401: { description: Missing, expired or revoked onboarding token (code unauthorized) }
 *   delete:
 *     summary: « Supprimer mon compte » while not a member — deletes the identity, its sessions and requests
 *     description: >
 *       Before joining, or after « Quitter ce parking »: the members the person left behind with this identity are
 *       anonymised too (« Compte supprimé », phone and password removed, `staff.deleted` on their operator). With Apple,
 *       the fresh authorizationCode (optional) is exchanged at Apple first and, when it is this Apple ID's, revoked.
 *     tags: [Onboarding]
 *     requestBody:
 *       content: { application/json: { schema: { type: object, properties: { authorizationCode: { type: string } } } } }
 *     responses:
 *       204: { description: Deleted }
 *       400: { description: "validation_failed (fields.authorizationCode = invalid | too_long)" }
 *       401: { description: "Apple refused the code (invalid_grant), or it belongs to another Apple ID: reauth_failed, nothing revoked" }
 *       409: { description: "The identity is a member's (already_member), also when a manager accepted its request meanwhile" }
 *       503: { description: "Apple cannot be reached or refuses Plazo's key (provider_unreachable); nothing deleted" }
 * /internal/auth/onboarding/join:
 *   post:
 *     summary: « Envoyer ma demande » — a request to join the operator whose code of the day this is
 *     description: >
 *       The code is read in upper case, without spaces or dashes, O as 0 and I / L as 1. Every code typed is counted
 *       before it is read, per Apple / Google account (a hash of provider and subject, which outlives a deleted identity)
 *       and per address: wrong codes 5 per 15 min and 20 per 24 h per account, 30 per hour per address; requests sent 3
 *       per 24 h per account, 20 per address. The code typed is never stored. The managers get a push (« Demande pour
 *       rejoindre l’équipe », data { type: join_request, requestId }). Expires after 7 days.
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, firstName, lastName, wishedRole]
 *             properties:
 *               code: { type: string, example: K7QM2-XP9TD }
 *               firstName: { type: string, maxLength: 60 }
 *               lastName: { type: string, maxLength: 60 }
 *               wishedRole: { type: string, enum: [agent, driver, valet] }
 *     responses:
 *       201: { description: "{ request: JoinRequestView }" }
 *       400: { description: "validation_failed (fields) or join_code_invalid (unknown, expired, suspended, archived or demo: same answer)" }
 *       409: { description: "join_request_pending, already_member, email_taken (the identity's email is used by a Plazo account)" }
 *       429: { description: "Too many wrong codes, or requests sent (too_many_attempts)" }
 * /internal/auth/onboarding/session:
 *   post:
 *     summary: The staff session, once a manager accepted the request (the onboarding tokens are then revoked)
 *     tags: [Onboarding]
 *     responses:
 *       200: { description: "{ tokenData, user }" }
 *       403: { description: account_suspended | account_disabled }
 *       409: { description: "join_request_pending (still waiting) or not_member" }
 * /internal/auth/onboarding/request:
 *   delete:
 *     summary: « Annuler la demande »
 *     tags: [Onboarding]
 *     responses:
 *       200: { description: "{ request: JoinRequestView } (status cancelled)" }
 *       409: { description: No request is waiting (join_request_closed) }
 * /internal/auth/onboarding/logout:
 *   post:
 *     summary: « Utiliser un autre compte » — revokes this onboarding token
 *     tags: [Onboarding]
 *     responses:
 *       204: { description: Signed out }
 */
export class IdentityRoute implements Routes {
  public router = Router();
  public identity = new IdentityController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/internal/auth/providers', this.identity.providers);
    this.router.post('/internal/auth/apple', ValidationMiddleware(AppleSignInDto), this.identity.apple);
    this.router.post('/internal/auth/google', ValidationMiddleware(GoogleSignInDto), this.identity.google);
    this.router.get('/internal/auth/onboarding', IdentityAuthMiddleware(), this.identity.state);
    this.router.delete('/internal/auth/onboarding', IdentityAuthMiddleware(), ValidationMiddleware(DeleteIdentityDto), this.identity.deleteIdentity);
    this.router.post('/internal/auth/onboarding/join', IdentityAuthMiddleware(), ValidationMiddleware(JoinParkingDto), this.identity.join);
    this.router.post('/internal/auth/onboarding/session', IdentityAuthMiddleware(), this.identity.session);
    this.router.delete('/internal/auth/onboarding/request', IdentityAuthMiddleware(), this.identity.cancelRequest);
    this.router.post('/internal/auth/onboarding/logout', IdentityAuthMiddleware(), this.identity.logout);
  }
}
