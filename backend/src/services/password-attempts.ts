import { compare } from 'bcrypt';
import dayjs from 'dayjs';
import httpStatus from 'http-status';
import { LOGIN_MAX_FAILURES, LOGIN_WINDOW_MINUTES } from '@/config';
import prisma from '@/database';
import { HttpException } from '@/utils/httpException';

/** Login attempts (lockout counters, per email) are kept this long, then purged at night (privacy policy). */
export const LOGIN_ATTEMPT_RETENTION_DAYS = 30;

/**
 * A password typed by a signed-in member to confirm something (« Supprimer mon compte », changing their password): the
 * login's lockout applies (LOGIN_MAX_FAILURES failures in LOGIN_WINDOW_MINUTES per email → 429 too_many_attempts), and
 * every try is recorded like a login, so that a stolen session cannot be used to guess the password.
 * `hashed` null: the member has no password of their own (any password typed is wrong).
 */
export async function checkPasswordAttempt(email: string, password: string, hashed: string | null): Promise<boolean> {
  const since = dayjs().subtract(LOGIN_WINDOW_MINUTES, 'minutes').toDate();
  const failures = await prisma.loginAttempt.count({ where: { email, success: false, createdAt: { gt: since } } });
  if (failures >= LOGIN_MAX_FAILURES) {
    throw new HttpException(httpStatus.TOO_MANY_REQUESTS, 'Too many attempts, try again later', 'too_many_attempts');
  }
  const valid = !!hashed && (await compare(password, hashed));
  await prisma.loginAttempt.create({ data: { email, success: valid } });
  return valid;
}

/** Nightly purge of the login attempts older than LOGIN_ATTEMPT_RETENTION_DAYS (they hold the email typed). */
export async function purgeLoginAttempts(now = new Date()): Promise<number> {
  const { count } = await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - LOGIN_ATTEMPT_RETENTION_DAYS * 86_400_000) } },
  });
  return count;
}
