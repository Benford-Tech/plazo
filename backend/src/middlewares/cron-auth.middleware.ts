import { timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { CRON_SECRET } from '@/config';
import { HttpException } from '@/utils/httpException';

/** Vercel Cron calls scheduled routes with `Authorization: Bearer <CRON_SECRET>`. */
export const CronAuthMiddleware = () => (req: Request, res: Response, next: NextFunction) => {
  const expected = Buffer.from(`Bearer ${CRON_SECRET ?? ''}`);
  const received = Buffer.from(req.get('authorization') ?? '');
  const valid = !!CRON_SECRET && expected.length === received.length && timingSafeEqual(expected, received);
  next(valid ? undefined : new HttpException(httpStatus.UNAUTHORIZED, 'Invalid cron secret', 'unauthorized'));
};
