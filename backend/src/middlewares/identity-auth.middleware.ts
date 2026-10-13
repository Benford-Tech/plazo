import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import prisma, { StaffIdentity } from '@/database';
import { TokenService } from '@/services/token.service';
import { HttpException } from '@/utils/httpException';

export type RequestWithIdentity = Request & { identity: StaffIdentity; identityTokenUid: string };

/**
 * The onboarding session of a person signed in with Apple or Google who is not a member yet (13/10/2026): Bearer =
 * an onboarding token (never a staff token, never the other way round). Routes under /internal/auth/onboarding*, so the
 * app's staff interceptor never touches them.
 */
export const IdentityAuthMiddleware = () => (request: Request, res: Response, next: NextFunction) => {
  const req = request as RequestWithIdentity;
  const header = req.get('authorization') ?? '';
  const token = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim();
  const refuse = () => next(new HttpException(httpStatus.UNAUTHORIZED, 'Please sign in to continue', 'unauthorized'));
  if (!token) return refuse();
  Container.get(TokenService)
    .verifyOnboardingToken(token)
    .then(async stored => {
      if (!stored) return refuse();
      const identity = await prisma.staffIdentity.findUnique({ where: { id: stored.identityId } });
      if (!identity) return refuse();
      req.identity = identity;
      req.identityTokenUid = stored.uid;
      next();
    })
    .catch(next);
};
