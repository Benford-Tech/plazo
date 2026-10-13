import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { AppleSignInDto, DeleteIdentityDto, GoogleSignInDto, JoinParkingDto } from '@/dtos/identity.dto';
import { RequestWithIdentity } from '@/middlewares/identity-auth.middleware';
import { rateLimitKey } from '@/middlewares/rateLimiter';
import { OnboardingService } from '@/services/onboarding.service';
import catchAsync from '@/utils/catchAsync';

/** Plazo Pro sign-in with Apple / Google and « Rejoindre un parking » (13/10/2026). */
export class IdentityController {
  public onboarding = Container.get(OnboardingService);

  /** GET /internal/auth/providers */
  public providers = catchAsync(async (req: Request, res: Response) => {
    res.json(this.onboarding.providers());
  });

  /** POST /internal/auth/apple */
  public apple = catchAsync(async (req: Request, res: Response) => {
    const data: AppleSignInDto = req.body;
    res.json(await this.onboarding.signInWithApple(data, { userAgent: req.get('user-agent') ?? null }));
  });

  /** POST /internal/auth/google */
  public google = catchAsync(async (req: Request, res: Response) => {
    const data: GoogleSignInDto = req.body;
    res.json(await this.onboarding.signInWithGoogle(data, { userAgent: req.get('user-agent') ?? null }));
  });

  /** GET /internal/auth/onboarding */
  public state = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.onboarding.state((req as RequestWithIdentity).identity));
  });

  /** POST /internal/auth/onboarding/join */
  public join = catchAsync(async (req: Request, res: Response) => {
    const data: JoinParkingDto = req.body;
    res.status(httpStatus.CREATED).json(await this.onboarding.join((req as RequestWithIdentity).identity, data, rateLimitKey(req)));
  });

  /** POST /internal/auth/onboarding/session */
  public session = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.onboarding.session((req as RequestWithIdentity).identity, { userAgent: req.get('user-agent') ?? null }));
  });

  /** DELETE /internal/auth/onboarding/request */
  public cancelRequest = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.onboarding.cancelRequest((req as RequestWithIdentity).identity));
  });

  /** POST /internal/auth/onboarding/logout */
  public logout = catchAsync(async (req: Request, res: Response) => {
    await this.onboarding.logout((req as RequestWithIdentity).identityTokenUid);
    res.status(httpStatus.NO_CONTENT).send();
  });

  /** DELETE /internal/auth/onboarding */
  public deleteIdentity = catchAsync(async (req: Request, res: Response) => {
    const data: DeleteIdentityDto = req.body;
    await this.onboarding.deleteIdentity((req as RequestWithIdentity).identity, data.authorizationCode || undefined);
    res.status(httpStatus.NO_CONTENT).send();
  });
}
