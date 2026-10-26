import { Router } from 'express';
import { StaffController } from '@/controllers/staff.controller';
import { AcceptJoinRequestDto, DeleteAccountDto, GoogleSignInDto, LinkAppleDto } from '@/dtos/identity.dto';
import { ChangePasswordDto, CreateStaffDto, ResetPasswordDto, UpdateMeDto, UpdateStaffDto, SetPostDto, SetVehicleDto } from '@/dtos/staff.dto';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInViewAs, RefuseInViewAsOutsidePlatformAccount, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
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
 *     summary: Current staff member, with the operator name, isPlatformAdmin, emailVerified, viewAs ({ operatorId, operatorName } in a platform admin's view-as session, else null), post / postSetAt, effectivePost, allowedPosts, hasPassword and identities [{ provider, email }]
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
 *   delete:
 *     summary: Supprimer mon compte — anonymises the member (« Compte supprimé »), deletes sessions, links, phones and identities
 *     description: >
 *       With an Apple identity linked (and Apple sign-in configured), Apple's fresh authorization code is required,
 *       whatever else is sent: it is exchanged, checked to be that Apple ID's, then revoked at Apple, before anything is
 *       deleted (409 apple_confirmation_required without it). Otherwise confirmed by the password (when the member has
 *       one; the login's lockout applies: 429 too_many_attempts) or a Google ID token of the Google identity linked to
 *       the member, issued less than 5 minutes ago and used once. Trips and reservations handled stay in the parking's
 *       history; the identities that made the member's join requests and the members the person left behind with them
 *       are erased too. The last manager may delete their account (the app warns them).
 *     tags: [Staff]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password: { type: string }
 *               appleAuthorizationCode: { type: string }
 *               googleIdToken: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       400: { description: "validation_failed (fields.password / appleAuthorizationCode / googleIdToken = invalid | too_long)" }
 *       401: { description: "The confirmation is wrong, missing, too old, already used or another account's (reauth_failed)" }
 *       403: { description: "In consultation (view_as_read_only), a platform owner (cannot_delete_platform)" }
 *       409: { description: "apple_confirmation_required (an Apple identity is linked: confirm with Apple), trip_running, provider_unavailable" }
 *       429: { description: Too many wrong passwords lately (too_many_attempts) }
 *       503: { description: "Apple cannot be reached or refuses Plazo's key (provider_unreachable); nothing deleted" }
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
 *     summary: Change one's password (signs out every device; wrong current passwords count toward the login lockout, 429 too_many_attempts)
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
 *     summary: List the team (manager only); members who left or deleted their account are not listed, each member has signIn ['password' | 'apple' | 'google']
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
 * /internal/staff/join-code:
 *   get:
 *     summary: Code du jour (13/10/2026) — the code a new recruit types in Plazo Pro after signing in with Apple or Google (managers; also in consultation)
 *     description: >
 *       Ten characters derived from the operator and its local day (first parking's time zone): it changes by itself at
 *       local midnight (validUntil). `accepting` is false for a suspended, archived or demo operator (the code is then refused).
 *     tags: [Staff]
 *     responses:
 *       200: { description: "{ code: 'K7QM2-XP9TD', day: 'YYYY-MM-DD', validUntil: ISO, operatorName, accepting }" }
 * /internal/staff/join-requests:
 *   get:
 *     summary: Demandes en attente — the join requests waiting (not expired), oldest first (managers; also in consultation)
 *     tags: [Staff]
 *     responses:
 *       200: { description: "{ data: [{ id, firstName, lastName, email, isPrivateEmail, provider: apple|google, wishedRole, createdAt, expiresAt }] }" }
 * /internal/staff/join-requests/{id}/accept:
 *   post:
 *     summary: Accept a join request — creates the member with the role chosen (never manager) and links their Apple / Google identity
 *     description: >
 *       The member gets the request's email and names, no password of their own (signIn ['apple'] or ['google']; a
 *       manager may give one with « Nouveau mot de passe »), the email verified when the provider verified it (never
 *       for a platform owner's address). Read-only in consultation outside the platform's own account (view_as_read_only).
 *     tags: [Staff]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [role], properties: { role: { type: string, enum: [agent, driver, valet] } } } } }
 *     responses:
 *       201: { description: "{ staff } (like a member of GET /internal/staff, with signIn)" }
 *       400: { description: "validation_failed: fields.role = invalid_role" }
 *       404: { description: Not a request of this operator (not_found) }
 *       409: { description: "join_request_closed (answered, cancelled or expired), email_taken (the email is used by a Plazo account since)" }
 * /internal/staff/join-requests/{id}/refuse:
 *   post:
 *     summary: Refuse a join request (the person may ask again with a new code)
 *     tags: [Staff]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: "{ request: JoinRequestView } (status refused)" }
 *       404: { description: not_found }
 *       409: { description: join_request_closed }
 * /internal/staff/me/identities/apple:
 *   post:
 *     summary: Lier mon identifiant Apple (Mon compte) — { identityToken, rawNonce }; answers { user } (identities, hasPassword)
 *     tags: [Staff]
 *     responses:
 *       200: { description: "{ user }" }
 *       401: { description: "identity_invalid (also a token already used: each one works once)" }
 *       403: { description: In consultation (view_as_read_only) }
 *       409: { description: "identity_taken (linked to another account), already_linked (an Apple identity is already linked), provider_unavailable" }
 * /internal/staff/me/identities/google:
 *   post:
 *     summary: Link one's Google account (Mon compte) — { idToken }; same answers as Apple
 *     tags: [Staff]
 *     responses:
 *       200: { description: "{ user }" }
 * /internal/staff/me/identities/{provider}:
 *   delete:
 *     summary: Unlink Apple or Google; refused when it is the only way left to sign in (no password, no other identity)
 *     tags: [Staff]
 *     parameters:
 *       - { in: path, name: provider, required: true, schema: { type: string, enum: [apple, google] } }
 *     responses:
 *       200: { description: "{ user }" }
 *       404: { description: Not linked (not_found) }
 *       409: { description: sign_in_required }
 * /internal/staff/me/leave:
 *   post:
 *     summary: Quitter ce parking — the member becomes inactive, their email is freed and phone removed, sessions, phones and identities are released
 *     description: >
 *       When an Apple / Google identity was linked, an onboarding session is returned so that the app goes straight to
 *       « Rejoindre un parking ». Refused for the last active manager and during a running shuttle trip.
 *     tags: [Staff]
 *     responses:
 *       200: { description: "{ onboarding: { onboardingToken, expiresAt, identity, request: null } | null }" }
 *       403: { description: "In consultation (view_as_read_only), a platform owner (cannot_delete_platform)" }
 *       409: { description: "last_manager, trip_running" }
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
    // Read-only while a platform admin views the operator's space (RefuseInViewAs: 403 view_as_read_only); the team of
    // the platform's own account (« Plazo (tests) ») stays manageable (RefuseInViewAsOutsidePlatformAccount, 12/10/2026).
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
      RefuseInViewAsOutsidePlatformAccount(),
      ValidationMiddleware(CreateStaffDto),
      this.staff.create,
    );
    this.router.patch(
      '/internal/staff/:id',
      StaffAuthMiddleware('team:manage'),
      RefuseInViewAsOutsidePlatformAccount(),
      ValidationMiddleware(UpdateStaffDto),
      this.staff.update,
    );
    this.router.post(
      '/internal/staff/:id/reset-password',
      StaffAuthMiddleware('team:manage'),
      RefuseInViewAsOutsidePlatformAccount(),
      ValidationMiddleware(ResetPasswordDto),
      this.staff.resetPassword,
    );
    // 26/10/2026: « Renvoyer l'invitation » (a team write, like the others).
    this.router.post('/internal/staff/:id/invite', StaffAuthMiddleware('team:manage'), RefuseInViewAsOutsidePlatformAccount(), this.staff.invite);

    // « Rejoindre un parking » (13/10/2026). The code and the requests are read in consultation too; accepting and
    // refusing are team writes (read-only in consultation, except in the platform's own account).
    this.router.get('/internal/staff/join-code', StaffAuthMiddleware('team:manage'), this.staff.joinCode);
    this.router.get('/internal/staff/join-requests', StaffAuthMiddleware('team:manage'), this.staff.listJoinRequests);
    this.router.post(
      '/internal/staff/join-requests/:id/accept',
      StaffAuthMiddleware('team:manage'),
      RefuseInViewAsOutsidePlatformAccount(),
      ValidationMiddleware(AcceptJoinRequestDto),
      this.staff.acceptJoinRequest,
    );
    this.router.post(
      '/internal/staff/join-requests/:id/refuse',
      StaffAuthMiddleware('team:manage'),
      RefuseInViewAsOutsidePlatformAccount(),
      this.staff.refuseJoinRequest,
    );

    // One's own account (Mon compte): never in a platform admin's consultation.
    this.router.post(
      '/internal/staff/me/identities/apple',
      StaffAuthMiddleware(),
      RefuseInViewAs(),
      ValidationMiddleware(LinkAppleDto),
      this.staff.linkApple,
    );
    this.router.post(
      '/internal/staff/me/identities/google',
      StaffAuthMiddleware(),
      RefuseInViewAs(),
      ValidationMiddleware(GoogleSignInDto),
      this.staff.linkGoogle,
    );
    this.router.delete('/internal/staff/me/identities/:provider', StaffAuthMiddleware(), RefuseInViewAs(), this.staff.unlinkIdentity);
    this.router.post('/internal/staff/me/leave', StaffAuthMiddleware(), RefuseInViewAs(), this.staff.leave);
    this.router.delete('/internal/staff/me', StaffAuthMiddleware(), RefuseInViewAs(), ValidationMiddleware(DeleteAccountDto), this.staff.deleteMe);
  }
}
