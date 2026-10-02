import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { AcceptInvitationDto, AccountTokenDto, LoginDto, RefreshTokenDto, SignupDto } from '@/dtos/auth.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { AccountService } from '@/services/account.service';
import { AuthService } from '@/services/auth.service';
import catchAsync from '@/utils/catchAsync';

export class AuthController {
  public authService = Container.get(AuthService);
  public accounts = Container.get(AccountService);

  /** POST /internal/auth/login */
  public login = catchAsync(async (req: Request, res: Response) => {
    const data: LoginDto = req.body;
    const result = await this.authService.login(data, { userAgent: req.get('user-agent') ?? null });
    res.status(httpStatus.OK).json(result);
  });

  /** POST /internal/auth/refresh */
  public refresh = catchAsync(async (req: Request, res: Response) => {
    const data: RefreshTokenDto = req.body;
    res.status(httpStatus.OK).json(await this.authService.refresh(data.refreshToken));
  });

  /** POST /internal/auth/logout */
  public logout = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    await this.authService.logout(req.tokenUid);
    res.status(httpStatus.NO_CONTENT).send();
  });

  /** POST /internal/auth/signup */
  public signup = catchAsync(async (req: Request, res: Response) => {
    const data: SignupDto = req.body;
    res.status(httpStatus.CREATED).json(await this.accounts.signup(data));
  });

  /** POST /internal/auth/verify-email */
  public verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const data: AccountTokenDto = req.body;
    res.json(await this.accounts.verifyEmail(data.token));
  });

  /** POST /internal/auth/verify-email/resend */
  public resendVerification = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.accounts.resendVerification(req.staff));
  });

  /** POST /internal/auth/invitation */
  public invitation = catchAsync(async (req: Request, res: Response) => {
    const data: AccountTokenDto = req.body;
    res.json(await this.accounts.invitation(data.token));
  });

  /** POST /internal/auth/invitation/accept */
  public acceptInvitation = catchAsync(async (req: Request, res: Response) => {
    const data: AcceptInvitationDto = req.body;
    res.json(await this.accounts.acceptInvitation(data, { userAgent: req.get('user-agent') ?? null }));
  });
}
