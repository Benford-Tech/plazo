import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { LoginDto, RefreshTokenDto } from '@/dtos/auth.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { AuthService } from '@/services/auth.service';
import catchAsync from '@/utils/catchAsync';

export class AuthController {
  public authService = Container.get(AuthService);

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
}
