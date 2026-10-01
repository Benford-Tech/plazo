import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import { ACCESS_TOKEN_TTL_HOURS, REFRESH_TOKEN_TTL_DAYS, SECRET_KEY } from '@/config';
import prisma, { StaffTokenType } from '@/database';
import { DataStoredInToken, TokenData } from '@/interfaces/auth.interface';

@Service()
export class TokenService {
  private sign(staffId: string, type: StaffTokenType, uuid: string, expires: dayjs.Dayjs): string {
    const payload: DataStoredInToken = { sub: staffId, iat: dayjs().unix(), exp: expires.unix(), type, uuid };
    return jwt.sign(payload, SECRET_KEY as string);
  }

  /** Issues an access/refresh pair. Both rows share a session id so logout revokes the pair. */
  public async generateAuthTokens(staffId: string, metadata: Record<string, string | null> = {}): Promise<TokenData> {
    const session = randomUUID();
    const accessExpires = dayjs().add(ACCESS_TOKEN_TTL_HOURS, 'hours');
    const refreshExpires = dayjs().add(REFRESH_TOKEN_TTL_DAYS, 'days');
    const accessUid = randomUUID();
    const refreshUid = randomUUID();

    await prisma.staffToken.createMany({
      data: [
        { uid: accessUid, staffId, type: StaffTokenType.access, expiresAt: accessExpires.toDate(), metadata: { ...metadata, session } },
        { uid: refreshUid, staffId, type: StaffTokenType.refresh, expiresAt: refreshExpires.toDate(), metadata: { ...metadata, session } },
      ],
    });

    return {
      access: { token: this.sign(staffId, StaffTokenType.access, accessUid, accessExpires), expires: accessExpires.toDate() },
      refresh: { token: this.sign(staffId, StaffTokenType.refresh, refreshUid, refreshExpires), expires: refreshExpires.toDate() },
    };
  }

  /** Verifies signature, type and that the token is still stored (not revoked) and not expired. */
  public async verifyToken(token: string, type: StaffTokenType) {
    let payload: DataStoredInToken;
    try {
      payload = jwt.verify(token, SECRET_KEY as string) as DataStoredInToken;
    } catch {
      return null;
    }
    if (payload.type !== type) return null;
    const stored = await prisma.staffToken.findUnique({ where: { uid: payload.uuid } });
    if (!stored || stored.staffId !== payload.sub || stored.type !== type || stored.expiresAt <= new Date()) return null;
    return stored;
  }

  public async revokeSessionOf(tokenUid: string): Promise<void> {
    const stored = await prisma.staffToken.findUnique({ where: { uid: tokenUid } });
    const session = (stored?.metadata as { session?: string } | null)?.session;
    if (!stored || !session) return;
    await prisma.staffToken.deleteMany({ where: { staffId: stored.staffId, metadata: { path: ['session'], equals: session } } });
  }

  public async revokeAll(staffId: string): Promise<void> {
    await prisma.staffToken.deleteMany({ where: { staffId } });
  }

  public async deleteExpired(): Promise<number> {
    const { count } = await prisma.staffToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return count;
  }
}
