import { createHash, createPublicKey, KeyObject } from 'crypto';
import httpStatus from 'http-status';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Service } from 'typedi';
import { appleSignInSettings, googleClientIds } from '@/config';
import prisma, { IdentityProvider, Prisma } from '@/database';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';

export const APPLE_ISSUER = 'https://appleid.apple.com';
export const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
export const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
export const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
export const GOOGLE_ISSUERS: [string, string] = ['accounts.google.com', 'https://accounts.google.com'];
export const GOOGLE_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

/** A key set is trusted for an hour; an unknown key id fetches it again, at most once a minute. */
const KEYS_TTL_MS = 60 * 60 * 1000;
const KEYS_REFETCH_MS = 60 * 1000;

/** What a provider says about the person, once its token is verified. */
export interface VerifiedIdentity {
  provider: IdentityProvider;
  subject: string;
  email: string | null;
  emailVerified: boolean;
  isPrivateEmail: boolean;
  /** Google only (Apple gives the name to the app, on the first authorisation only). */
  firstName: string;
  lastName: string;
}

type KeySet = { keys: Map<string, KeyObject>; fetchedAt: number; attemptedAt: number };
type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export const unavailable = () => new HttpException(httpStatus.CONFLICT, 'This sign-in method is not available', 'provider_unavailable');
export const invalidIdentity = () => new HttpException(httpStatus.UNAUTHORIZED, 'The sign-in could not be verified', 'identity_invalid');
export const unreachable = () => new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'The sign-in provider cannot be reached', 'provider_unreachable');
export const reauthFailed = () => new HttpException(httpStatus.UNAUTHORIZED, 'The confirmation could not be verified', 'reauth_failed');

/** The clock difference tolerated with a provider, for an issue date (`iat`) slightly in the future. */
const CLOCK_SKEW_SECONDS = 60;

/** Apple sends booleans as strings in some tokens ("true"). */
const truthy = (value: unknown) => value === true || value === 'true';

export const sha256Hex = (value: string) => createHash('sha256').update(value).digest('hex');

/**
 * Verifies the identity tokens of Sign in with Apple and Google Sign-In against the providers' published keys (RS256),
 * and revokes a person's Apple tokens when they delete their account (an authorization code exchanged with an ES256
 * client secret, then revoked). `fetch` is injectable for the tests; no provider token is ever stored.
 */
@Service()
export class IdentityVerificationService {
  public fetchImpl: Fetch = (url, init) => fetch(url, init);
  public timeoutMs = 5000;
  private keySets = new Map<string, KeySet>();

  /** Forgets the cached key sets (tests). */
  public resetCache() {
    this.keySets.clear();
  }

  // ------------------------------------------------------------------ verification

  /** An Apple identity token from the app (`nonce` = SHA-256 of the raw nonce the app generated). */
  public async verifyApple(identityToken: string, rawNonce: string): Promise<VerifiedIdentity> {
    const settings = appleSignInSettings();
    if (!settings) throw unavailable();
    const claims = await this.verifyJwt(identityToken, APPLE_KEYS_URL, { issuer: APPLE_ISSUER, audience: settings.clientIds });
    // Required: a token captured elsewhere cannot be replayed without the app's own nonce.
    if (typeof claims.nonce !== 'string' || !rawNonce || claims.nonce !== sha256Hex(rawNonce)) throw invalidIdentity();
    return this.appleIdentity(claims);
  }

  /**
   * A Google ID token from the app (requested with the Web client ID as serverClientId). The email must be verified.
   * `maxAgeSeconds`: a confirmation (account deletion) must have been issued that recently.
   */
  public async verifyGoogle(idToken: string, options: { maxAgeSeconds?: number } = {}): Promise<VerifiedIdentity> {
    const audience = googleClientIds();
    if (!audience.length) throw unavailable();
    const claims = await this.verifyJwt(idToken, GOOGLE_KEYS_URL, { issuer: GOOGLE_ISSUERS, audience });
    if (!truthy(claims.email_verified) || typeof claims.email !== 'string') throw invalidIdentity();
    if (options.maxAgeSeconds !== undefined) {
      const now = Math.floor(Date.now() / 1000);
      if (typeof claims.iat !== 'number' || now - claims.iat > options.maxAgeSeconds || claims.iat > now + CLOCK_SKEW_SECONDS) {
        throw invalidIdentity();
      }
    }
    return {
      provider: 'google',
      subject: claims.sub as string,
      email: claims.email.trim().toLowerCase(),
      emailVerified: true,
      isPrivateEmail: false,
      firstName: typeof claims.given_name === 'string' ? claims.given_name : '',
      lastName: typeof claims.family_name === 'string' ? claims.family_name : '',
    };
  }

  /** verifyApple, then the token is spent: the same token is refused afterwards (401 identity_invalid). */
  public async verifyAppleOnce(identityToken: string, rawNonce: string): Promise<VerifiedIdentity> {
    const verified = await this.verifyApple(identityToken, rawNonce);
    await this.consume(identityToken);
    return verified;
  }

  /** verifyGoogle, then the token is spent. */
  public async verifyGoogleOnce(idToken: string, options: { maxAgeSeconds?: number } = {}): Promise<VerifiedIdentity> {
    const verified = await this.verifyGoogle(idToken, options);
    await this.consume(idToken);
    return verified;
  }

  /**
   * Records a verified identity token as used (its SHA-256, until the token's own expiry): a token captured on its way
   * cannot sign in, link or confirm a second time. A token seen before → 401 identity_invalid.
   */
  public async consume(token: string): Promise<void> {
    const exp = (jwt.decode(token) as JwtPayload | null)?.exp;
    // A verified token always has an expiry; an hour otherwise, the longest a provider gives.
    const expiresAt = new Date((typeof exp === 'number' ? exp : Math.floor(Date.now() / 1000) + 3600) * 1000);
    try {
      await prisma.usedIdentityToken.create({ data: { tokenHash: sha256Hex(token), expiresAt } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw invalidIdentity();
      throw error;
    }
  }

  /** Nightly purge: a used token past its expiry can no longer be presented anyway. */
  public async purgeUsedTokens(now = new Date()): Promise<number> {
    const { count } = await prisma.usedIdentityToken.deleteMany({ where: { expiresAt: { lt: now } } });
    return count;
  }

  private appleIdentity(claims: JwtPayload): VerifiedIdentity {
    const email = typeof claims.email === 'string' && claims.email.trim() ? claims.email.trim().toLowerCase() : null;
    return {
      provider: 'apple',
      subject: claims.sub as string,
      email,
      emailVerified: !!email && truthy(claims.email_verified),
      isPrivateEmail: !!email && truthy(claims.is_private_email),
      firstName: '',
      lastName: '',
    };
  }

  private async verifyJwt(token: string, keysUrl: string, expected: { issuer: string | [string, ...string[]]; audience: string[] }) {
    if (typeof token !== 'string' || token.length > 8192) throw invalidIdentity();
    const decoded = jwt.decode(token, { complete: true });
    const kid = decoded && typeof decoded.header.kid === 'string' ? decoded.header.kid : null;
    if (!decoded || decoded.header.alg !== 'RS256' || !kid) throw invalidIdentity();
    const key = await this.keyFor(keysUrl, kid);
    if (!key) throw invalidIdentity();
    let claims: JwtPayload;
    try {
      claims = jwt.verify(token, key, {
        algorithms: ['RS256'],
        issuer: expected.issuer,
        audience: expected.audience as [string, ...string[]],
      }) as JwtPayload;
    } catch {
      throw invalidIdentity();
    }
    if (typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 255 || typeof claims.exp !== 'number') throw invalidIdentity();
    return claims;
  }

  /** The provider's key for this key id: from the cache, else fetched (a new key id at most once a minute). */
  private async keyFor(url: string, kid: string): Promise<KeyObject | null> {
    const now = Date.now();
    const cached = this.keySets.get(url);
    const fresh = cached && now - cached.fetchedAt < KEYS_TTL_MS;
    if (fresh && cached.keys.has(kid)) return cached.keys.get(kid)!;
    if (cached && fresh && now - cached.attemptedAt < KEYS_REFETCH_MS) return null;
    if (cached) cached.attemptedAt = now;
    try {
      const keys = await this.fetchKeys(url);
      this.keySets.set(url, { keys, fetchedAt: now, attemptedAt: now });
      return keys.get(kid) ?? null;
    } catch (error) {
      logger.warn(`[Identity] could not fetch the keys of ${new URL(url).host}: ${error instanceof Error ? error.message : 'unknown error'}`);
      // An older key set still knows this key: better than refusing everyone while the provider is down.
      if (cached?.keys.has(kid)) return cached.keys.get(kid)!;
      throw unreachable();
    }
  }

  private async fetchKeys(url: string): Promise<Map<string, KeyObject>> {
    const res = await this.request(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { keys?: Array<Record<string, unknown>> };
    const keys = new Map<string, KeyObject>();
    for (const jwk of body.keys ?? []) {
      if (jwk.kty !== 'RSA' || typeof jwk.kid !== 'string') continue;
      try {
        keys.set(jwk.kid, createPublicKey({ key: jwk as never, format: 'jwk' }));
      } catch {
        // A key Node cannot read is skipped.
      }
    }
    return keys;
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  // ------------------------------------------------------------------ Apple: account deletion

  /** The ES256 client secret of the « Sign in with Apple » key, for /auth/token and /auth/revoke (5 minutes). */
  public appleClientSecret(now = Math.floor(Date.now() / 1000)): { clientId: string; secret: string } {
    const settings = appleSignInSettings();
    if (!settings) throw unavailable();
    const clientId = settings.clientIds[0];
    const secret = jwt.sign({ iss: settings.teamId, iat: now, exp: now + 300, aud: APPLE_ISSUER, sub: clientId }, settings.privateKey, {
      algorithm: 'ES256',
      keyid: settings.keyId,
    });
    return { clientId, secret };
  }

  /**
   * Exchanges a fresh authorization code (the app's Apple confirmation) for Apple's tokens, then revokes them, so that
   * Plazo no longer appears in the person's Apple account. The code must belong to `expectedSubject`: whose it is is read
   * from the id_token Apple returns, before anything is revoked (another Apple ID's grant is left alone).
   * - a code Apple refuses (`invalid_grant`: expired, used, someone else's), another Apple ID, or an id_token that does
   *   not verify → 401 `reauth_failed`;
   * - Apple unreachable, or refusing Plazo itself (`invalid_client`: wrong key, team or client ID; logged) → 503
   *   `provider_unreachable`. The callers then delete nothing.
   */
  public async revokeApple(authorizationCode: string, expectedSubject: string): Promise<{ subject: string }> {
    const settings = appleSignInSettings();
    const { clientId, secret } = this.appleClientSecret();
    let res: Response;
    try {
      res = await this.request(APPLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: secret,
          code: authorizationCode,
          grant_type: 'authorization_code',
        }).toString(),
      });
    } catch (error) {
      logger.warn(`[Identity] Apple token exchange failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      throw unreachable();
    }
    if (!res.ok) {
      const appleError = await this.appleErrorOf(res);
      // The person's code is not (or no longer) good: they confirm again.
      if ((res.status === 400 || res.status === 401) && appleError === 'invalid_grant') throw reauthFailed();
      // Apple refuses Plazo itself (key, team, client ID) or is down: a setup or provider problem, not the person's.
      logger.error(`[Identity] Apple token exchange refused: HTTP ${res.status}${appleError ? ` (${appleError})` : ''}`);
      throw unreachable();
    }
    let tokens: { refresh_token?: unknown; access_token?: unknown; id_token?: unknown };
    try {
      tokens = (await res.json()) as typeof tokens;
      if (!tokens || typeof tokens !== 'object') throw new Error('not an object');
    } catch {
      logger.error('[Identity] Apple token exchange: unreadable answer');
      throw unreachable();
    }
    const refreshToken = typeof tokens.refresh_token === 'string' ? tokens.refresh_token : null;
    const accessToken = typeof tokens.access_token === 'string' ? tokens.access_token : null;
    const grant = refreshToken ? { token: refreshToken, hint: 'refresh_token' } : accessToken ? { token: accessToken, hint: 'access_token' } : null;
    if (typeof tokens.id_token !== 'string' || !tokens.id_token) {
      // Apple always sends one: without it, whose grant this is cannot be told. It is revoked all the same (Apple
      // issued it for this code), then the confirmation fails.
      logger.error('[Identity] Apple token exchange: no id_token in the answer');
      if (grant) await this.revokeAppleToken(clientId, secret, grant).catch(() => undefined);
      throw unreachable();
    }
    // The id_token comes straight from Apple over TLS; its signature and audience are checked all the same.
    let subject: string;
    try {
      subject = (await this.verifyJwt(tokens.id_token, APPLE_KEYS_URL, { issuer: APPLE_ISSUER, audience: settings!.clientIds })).sub as string;
    } catch (error) {
      if (error instanceof HttpException && error.code === 'identity_invalid') throw reauthFailed();
      throw error;
    }
    if (subject !== expectedSubject) throw reauthFailed();
    if (!grant) {
      logger.error('[Identity] Apple token exchange: no token to revoke in the answer');
      throw unreachable();
    }
    await this.revokeAppleToken(clientId, secret, grant);
    return { subject };
  }

  /** POST /auth/revoke; any failure → 503 provider_unreachable (logged with Apple's error code, never a secret). */
  private async revokeAppleToken(clientId: string, secret: string, grant: { token: string; hint: string }): Promise<void> {
    let res: Response;
    try {
      res = await this.request(APPLE_REVOKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: clientId, client_secret: secret, token: grant.token, token_type_hint: grant.hint }).toString(),
      });
    } catch (error) {
      logger.warn(`[Identity] Apple revocation failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      throw unreachable();
    }
    if (!res.ok) {
      const appleError = await this.appleErrorOf(res);
      logger.error(`[Identity] Apple revocation refused: HTTP ${res.status}${appleError ? ` (${appleError})` : ''}`);
      throw unreachable();
    }
  }

  /** Apple's error code in a refused answer ({ error: 'invalid_grant' | 'invalid_client' | … }), else null. */
  private async appleErrorOf(res: Response): Promise<string | null> {
    try {
      const body = (await res.json()) as { error?: unknown };
      return typeof body?.error === 'string' && /^[a-z_]{1,64}$/.test(body.error) ? body.error : null;
    } catch {
      return null;
    }
  }
}
