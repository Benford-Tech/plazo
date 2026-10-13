import 'reflect-metadata';
import { createHash, generateKeyPairSync, KeyObject, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { Container } from 'typedi';
import {
  APPLE_ISSUER,
  APPLE_KEYS_URL,
  APPLE_REVOKE_URL,
  APPLE_TOKEN_URL,
  GOOGLE_KEYS_URL,
  IdentityVerificationService,
} from '@/services/identity-verification.service';

/**
 * Apple and Google, faked for the tests (13/10/2026): locally generated keys, tokens signed with them, and a `fetch`
 * that serves the key sets, Apple's token exchange and revocation. No network.
 */
export const APPLE_CLIENT_ID = 'com.benfordtech.plazopro';
export const GOOGLE_CLIENT_ID = 'test-web-client.apps.googleusercontent.com';
export const APPLE_TEAM_ID = 'TEAM123456';
export const APPLE_KEY_ID = 'KEY1234567';

export const providerRsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
export const otherRsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
export const appleSigningKey = generateKeyPairSync('ec', { namedCurve: 'P-256' });

export const sha256Hex = (value: string) => createHash('sha256').update(value).digest('hex');

export function jwk(publicKey: KeyObject, kid: string) {
  return { ...(publicKey.export({ format: 'jwk' }) as Record<string, unknown>), kid, alg: 'RS256', use: 'sig' };
}

interface TokenOptions {
  sub: string;
  email?: string | null;
  emailVerified?: boolean | string;
  isPrivateEmail?: boolean | string;
  /** The raw nonce: the token carries its SHA-256 (Apple). */
  rawNonce?: string | null;
  aud?: string;
  iss?: string;
  expiresIn?: number;
  kid?: string;
  key?: KeyObject;
  givenName?: string;
  familyName?: string;
  /** Seconds since the token was issued (Google confirmations must be fresh). */
  issuedSecondsAgo?: number;
}

/**
 * Real providers never issue the same token twice (a new nonce, a new issue time); tokens signed here in the same
 * second would be identical, and Plazo accepts each token once: a random `jti` keeps them apart.
 */
const unique = () => ({ jti: randomUUID() });

export function appleIdentityToken(options: TokenOptions): string {
  const claims: Record<string, unknown> = { sub: options.sub, ...unique() };
  if (options.email !== null) claims.email = options.email ?? `${options.sub}@privaterelay.appleid.com`;
  if (options.email !== null) claims.email_verified = options.emailVerified ?? 'true';
  if (options.isPrivateEmail !== undefined) claims.is_private_email = options.isPrivateEmail;
  if (options.rawNonce !== null) claims.nonce = sha256Hex(options.rawNonce ?? 'nonce-brut');
  return jwt.sign(claims, options.key ?? providerRsa.privateKey, {
    algorithm: 'RS256',
    keyid: options.kid ?? 'apple-kid-1',
    issuer: options.iss ?? APPLE_ISSUER,
    audience: options.aud ?? APPLE_CLIENT_ID,
    expiresIn: options.expiresIn ?? 600,
  });
}

export function googleIdToken(options: TokenOptions): string {
  const claims: Record<string, unknown> = {
    sub: options.sub,
    email: options.email ?? `${options.sub}@gmail.com`,
    email_verified: options.emailVerified ?? true,
    given_name: options.givenName ?? 'Karim',
    family_name: options.familyName ?? 'Benali',
    ...unique(),
  };
  if (options.issuedSecondsAgo !== undefined) claims.iat = Math.floor(Date.now() / 1000) - options.issuedSecondsAgo;
  return jwt.sign(claims, options.key ?? providerRsa.privateKey, {
    algorithm: 'RS256',
    keyid: options.kid ?? 'google-kid-1',
    issuer: options.iss ?? 'https://accounts.google.com',
    audience: options.aud ?? GOOGLE_CLIENT_ID,
    expiresIn: options.expiresIn ?? 600,
  });
}

export interface FakeCall {
  url: string;
  method: string;
  form: Record<string, string>;
}

/** The fake providers: their key sets, Apple's /auth/token (codes → subjects) and /auth/revoke. */
export class FakeProviders {
  public calls: FakeCall[] = [];
  public appleKeys: Array<Record<string, unknown>> = [jwk(providerRsa.publicKey, 'apple-kid-1')];
  public googleKeys: Array<Record<string, unknown>> = [jwk(providerRsa.publicKey, 'google-kid-1')];
  /** Authorization codes Apple would accept, with the Apple ID they belong to. */
  public appleCodes = new Map<string, string>();
  public keysStatus = 200;
  public revokeStatus = 200;
  public down = false;
  /** Apple's /auth/token answer forced (e.g. 400 invalid_client), and whether it carries an id_token. */
  public tokenError: { status: number; error: string } | null = null;
  public tokenWithoutIdToken = false;

  public fetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? 'GET';
    const form = Object.fromEntries(new URLSearchParams(typeof init?.body === 'string' ? init.body : ''));
    this.calls.push({ url, method, form });
    if (this.down) throw new Error('network down');
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (url === APPLE_KEYS_URL) return json({ keys: this.appleKeys }, this.keysStatus);
    if (url === GOOGLE_KEYS_URL) return json({ keys: this.googleKeys }, this.keysStatus);
    if (url === APPLE_TOKEN_URL) {
      if (this.tokenError) return json({ error: this.tokenError.error }, this.tokenError.status);
      if (!this.validClientSecret(form)) return json({ error: 'invalid_client' }, 400);
      const sub = this.appleCodes.get(form.code);
      if (!sub || form.grant_type !== 'authorization_code') return json({ error: 'invalid_grant' }, 400);
      this.appleCodes.delete(form.code); // single use, like Apple's
      return json({
        access_token: `access-${sub}`,
        refresh_token: `refresh-${sub}`,
        token_type: 'Bearer',
        expires_in: 3600,
        ...(this.tokenWithoutIdToken ? {} : { id_token: appleIdentityToken({ sub, rawNonce: null }) }),
      });
    }
    if (url === APPLE_REVOKE_URL) {
      if (!this.validClientSecret(form)) return json({ error: 'invalid_client' }, 400);
      return new Response(null, { status: this.revokeStatus });
    }
    return json({ error: 'not_found' }, 404);
  };

  /** The client secret is an ES256 JWT of the Sign in with Apple key, for Plazo Pro, valid 5 minutes. */
  private validClientSecret(form: Record<string, string>): boolean {
    try {
      const decoded = jwt.verify(form.client_secret, appleSigningKey.publicKey, { algorithms: ['ES256'], complete: true });
      const payload = decoded.payload as jwt.JwtPayload;
      return (
        decoded.header.kid === APPLE_KEY_ID &&
        payload.iss === APPLE_TEAM_ID &&
        payload.sub === APPLE_CLIENT_ID &&
        payload.aud === APPLE_ISSUER &&
        form.client_id === APPLE_CLIENT_ID &&
        (payload.exp ?? 0) - (payload.iat ?? 0) === 300
      );
    } catch {
      return false;
    }
  }

  public callsTo(url: string) {
    return this.calls.filter(c => c.url === url);
  }
}

const ENV_KEYS = ['APPLE_TEAM_ID', 'APPLE_CLIENT_IDS', 'APPLE_SIGNIN_KEY_ID', 'APPLE_SIGNIN_PRIVATE_KEY', 'GOOGLE_CLIENT_IDS'];

/** Turns Apple and Google sign-in on, served by a fresh FakeProviders. The PEM is given on one line (literal \n). */
export function installFakeProviders(): FakeProviders {
  const fake = new FakeProviders();
  process.env.APPLE_TEAM_ID = APPLE_TEAM_ID;
  process.env.APPLE_CLIENT_IDS = APPLE_CLIENT_ID;
  process.env.APPLE_SIGNIN_KEY_ID = APPLE_KEY_ID;
  process.env.APPLE_SIGNIN_PRIVATE_KEY = (appleSigningKey.privateKey.export({ format: 'pem', type: 'pkcs8' }) as string).trim().replace(/\n/g, '\\n');
  process.env.GOOGLE_CLIENT_IDS = `autre-client.apps.googleusercontent.com, ${GOOGLE_CLIENT_ID}`;
  const service = Container.get(IdentityVerificationService);
  service.resetCache();
  service.fetchImpl = fake.fetch;
  return fake;
}

export function removeFakeProviders() {
  for (const key of ENV_KEYS) delete process.env[key];
  const service = Container.get(IdentityVerificationService);
  service.resetCache();
  service.fetchImpl = (url, init) => fetch(url, init);
}
