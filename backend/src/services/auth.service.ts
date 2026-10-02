import { compare } from 'bcrypt';
import dayjs from 'dayjs';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { isPlatformAdmin, LOGIN_MAX_FAILURES, LOGIN_WINDOW_MINUTES } from '@/config';
import prisma, { StaffTokenType } from '@/database';
import { LoginDto } from '@/dtos/auth.dto';
import { TokenData } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { TokenService } from './token.service';
import { toPublicStaff } from './staff.service';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Service()
export class AuthService {
  public tokenService = Container.get(TokenService);

  public async login(data: LoginDto, metadata: { userAgent: string | null }) {
    const email = normalizeEmail(data.email);
    const since = dayjs().subtract(LOGIN_WINDOW_MINUTES, 'minutes').toDate();
    const failures = await prisma.loginAttempt.count({ where: { email, success: false, createdAt: { gt: since } } });
    if (failures >= LOGIN_MAX_FAILURES) {
      throw new HttpException(httpStatus.TOO_MANY_REQUESTS, 'Too many attempts, try again later', 'too_many_attempts');
    }

    const staff = await prisma.staff.findUnique({ where: { email }, include: { operator: true } });
    const valid = !!staff && staff.isActive && (await compare(data.password, staff.password));
    await prisma.loginAttempt.create({ data: { email, success: valid } });
    if (!valid || !staff) {
      throw new HttpException(httpStatus.UNAUTHORIZED, 'Invalid email or password', 'invalid_credentials');
    }

    await prisma.staff.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });
    const tokenData = await this.tokenService.generateAuthTokens(staff.id, metadata);
    return {
      tokenData,
      user: { ...toPublicStaff({ ...staff, operatorName: staff.operator.name }), isPlatformAdmin: isPlatformAdmin(staff.email) },
    };
  }

  /** Rotates the pair: the used refresh token is revoked with its access token. */
  public async refresh(refreshToken: string): Promise<{ tokenData: TokenData }> {
    const stored = await this.tokenService.verifyToken(refreshToken, StaffTokenType.refresh);
    const staff = stored && (await prisma.staff.findUnique({ where: { id: stored.staffId } }));
    if (!stored || !staff || !staff.isActive) {
      throw new HttpException(httpStatus.UNAUTHORIZED, 'Please log in to continue', 'unauthorized');
    }
    await this.tokenService.revokeSessionOf(stored.uid);
    const metadata = (stored.metadata as { userAgent?: string | null }) ?? {};
    return { tokenData: await this.tokenService.generateAuthTokens(staff.id, { userAgent: metadata.userAgent ?? null }) };
  }

  public async logout(accessTokenUid: string): Promise<void> {
    await this.tokenService.revokeSessionOf(accessTokenUid);
  }
}
