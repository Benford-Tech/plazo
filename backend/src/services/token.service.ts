import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import { ACCESS_TOKEN_TTL_HOURS, ONBOARDING_TOKEN_TTL_DAYS, REFRESH_TOKEN_TTL_DAYS, SECRET_KEY, VIEW_AS_TTL_MINUTES } from '@/config';
import prisma, { StaffTokenType } from '@/database';
import { DataStoredInToken, OnboardingTokenPayload, TokenData } from '@/interfaces/auth.interface';

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

  /**
   * A platform admin's access token scoped to one operator ("open their space"): short-lived, no
   * refresh token, its own session (revoked alone by a logout made with it). The staff id stays the
   * admin's own: the strategy resolves the operator from the stored metadata, for admins only.
   */
  public async generateViewAsToken(staffId: string, operatorId: string, metadata: Record<string, string | null> = {}) {
    const uid = randomUUID();
    const expires = dayjs().add(VIEW_AS_TTL_MINUTES, 'minutes');
    await prisma.staffToken.create({
      data: {
        uid,
        staffId,
        type: StaffTokenType.access,
        expiresAt: expires.toDate(),
        metadata: { ...metadata, session: randomUUID(), actingAs: operatorId },
      },
    });
    return { token: this.sign(staffId, StaffTokenType.access, uid, expires), expires: expires.toDate() };
  }

  /** Signs out every staff member of an operator (suspension). */
  public async revokeOperator(operatorId: string): Promise<void> {
    await prisma.staffToken.deleteMany({ where: { staff: { operatorId } } });
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

  // ---------------------------------------------------------------- onboarding (13/10/2026)

  /**
   * The short session of a person signed in with Apple or Google who is not a member yet (« Rejoindre un parking »):
   * its own type, refused by every staff route; valid while its row exists.
   */
  public async generateOnboardingToken(identityId: string): Promise<{ onboardingToken: string; expiresAt: Date }> {
    const uid = randomUUID();
    const expires = dayjs().add(ONBOARDING_TOKEN_TTL_DAYS, 'days');
    await prisma.identityToken.create({ data: { uid, identityId, expiresAt: expires.toDate() } });
    const payload: OnboardingTokenPayload = { sub: identityId, iat: dayjs().unix(), exp: expires.unix(), type: 'onboarding', uuid: uid };
    return { onboardingToken: jwt.sign(payload, SECRET_KEY as string), expiresAt: expires.toDate() };
  }

  /** The stored row of a valid onboarding token, else null (bad signature, other type, revoked or expired). */
  public async verifyOnboardingToken(token: string) {
    let payload: OnboardingTokenPayload;
    try {
      payload = jwt.verify(token, SECRET_KEY as string) as OnboardingTokenPayload;
    } catch {
      return null;
    }
    if (payload.type !== 'onboarding' || typeof payload.uuid !== 'string') return null;
    const stored = await prisma.identityToken.findUnique({ where: { uid: payload.uuid } });
    if (!stored || stored.identityId !== payload.sub || stored.expiresAt <= new Date()) return null;
    return stored;
  }

  public async revokeOnboardingToken(uid: string): Promise<void> {
    await prisma.identityToken.deleteMany({ where: { uid } });
  }

  public async revokeOnboardingTokensOf(identityId: string): Promise<void> {
    await prisma.identityToken.deleteMany({ where: { identityId } });
  }

  public async deleteExpiredOnboardingTokens(): Promise<number> {
    const { count } = await prisma.identityToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return count;
  }
}
