import jwt from 'jsonwebtoken';
import { Container } from 'typedi';
import prisma from '@/database';
import {
  APPLE_ISSUER,
  APPLE_KEYS_URL,
  APPLE_REVOKE_URL,
  APPLE_TOKEN_URL,
  GOOGLE_KEYS_URL,
  IdentityVerificationService,
} from '@/services/identity-verification.service';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import {
  APPLE_CLIENT_ID,
  APPLE_KEY_ID,
  APPLE_TEAM_ID,
  appleIdentityToken,
  appleSigningKey,
  FakeProviders,
  googleIdToken,
  installFakeProviders,
  jwk,
  otherRsa,
  providerRsa,
  removeFakeProviders,
} from './utils/identity';

const service = () => Container.get(IdentityVerificationService);

/** The code of the HttpException a promise rejects with. */
async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof HttpException) return error.code;
    throw error;
  }
  return undefined;
}

let fake: FakeProviders;
beforeEach(() => {
  fake = installFakeProviders();
});
afterEach(() => {
  removeFakeProviders();
  jest.useRealTimers();
  jest.restoreAllMocks();
});
afterAll(() => prisma.$disconnect());

describe('vérification Apple', () => {
  it('accepte un jeton signé par Apple pour Plazo Pro avec le bon nonce', async () => {
    const token = appleIdentityToken({ sub: '001234.abcd', email: 'Julie.M@icloud.com', rawNonce: 'nonce-1' });
    await expect(service().verifyApple(token, 'nonce-1')).resolves.toEqual({
      provider: 'apple',
      subject: '001234.abcd',
      email: 'julie.m@icloud.com',
      emailVerified: true,
      isPrivateEmail: false,
      firstName: '',
      lastName: '',
    });
  });

  it('lit l’adresse masquée et les booléens envoyés en texte', async () => {
    const token = appleIdentityToken({ sub: 'a1', email: 'x7@privaterelay.appleid.com', isPrivateEmail: 'true', emailVerified: true, rawNonce: 'n' });
    expect(await service().verifyApple(token, 'n')).toMatchObject({ isPrivateEmail: true, emailVerified: true });
    const noEmail = appleIdentityToken({ sub: 'a2', email: null, rawNonce: 'n' });
    expect(await service().verifyApple(noEmail, 'n')).toMatchObject({ email: null, emailVerified: false });
  });

  it('refuse un nonce absent ou faux, une autre app, un autre émetteur, un jeton expiré', async () => {
    expect(await codeOf(service().verifyApple(appleIdentityToken({ sub: 'a', rawNonce: 'n' }), 'autre'))).toBe('identity_invalid');
    expect(await codeOf(service().verifyApple(appleIdentityToken({ sub: 'a', rawNonce: null }), 'n'))).toBe('identity_invalid');
    expect(await codeOf(service().verifyApple(appleIdentityToken({ sub: 'a', rawNonce: 'n' }), ''))).toBe('identity_invalid');
    expect(await codeOf(service().verifyApple(appleIdentityToken({ sub: 'a', aud: 'com.autre.app', rawNonce: 'n' }), 'n'))).toBe('identity_invalid');
    expect(await codeOf(service().verifyApple(appleIdentityToken({ sub: 'a', iss: 'https://evil.example', rawNonce: 'n' }), 'n'))).toBe(
      'identity_invalid',
    );
    expect(await codeOf(service().verifyApple(appleIdentityToken({ sub: 'a', expiresIn: -10, rawNonce: 'n' }), 'n'))).toBe('identity_invalid');
  });

  it('refuse une signature d’une autre clé, un algorithme symétrique ou un jeton illisible', async () => {
    expect(await codeOf(service().verifyApple(appleIdentityToken({ sub: 'a', key: otherRsa.privateKey, rawNonce: 'n' }), 'n'))).toBe(
      'identity_invalid',
    );
    const hs = jwt.sign({ sub: 'a', nonce: 'x' }, 'secret', {
      algorithm: 'HS256',
      keyid: 'apple-kid-1',
      issuer: APPLE_ISSUER,
      audience: APPLE_CLIENT_ID,
    });
    expect(await codeOf(service().verifyApple(hs, 'n'))).toBe('identity_invalid');
    expect(await codeOf(service().verifyApple('pas-un-jeton', 'n'))).toBe('identity_invalid');
  });

  it('n’est pas proposé sans la clé Sign in with Apple', async () => {
    delete process.env.APPLE_SIGNIN_PRIVATE_KEY;
    expect(await codeOf(service().verifyApple(appleIdentityToken({ sub: 'a', rawNonce: 'n' }), 'n'))).toBe('provider_unavailable');
    expect(fake.calls).toHaveLength(0);
  });
});

describe('clés publiées', () => {
  it('les garde une heure, et les relit pour une clé inconnue au plus une fois par minute', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-13T08:00:00Z'), doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout'] });
    const token = () => appleIdentityToken({ sub: 'a', rawNonce: 'n' });
    await service().verifyApple(token(), 'n');
    await service().verifyApple(token(), 'n');
    expect(fake.callsTo(APPLE_KEYS_URL)).toHaveLength(1);

    // Apple adds a key: the unknown kid fetches the set again (a minute after the last fetch).
    fake.appleKeys.push(jwk(otherRsa.publicKey, 'apple-kid-2'));
    const rotated = appleIdentityToken({ sub: 'a', rawNonce: 'n', kid: 'apple-kid-2', key: otherRsa.privateKey });
    jest.setSystemTime(new Date('2026-10-13T08:01:01Z'));
    await service().verifyApple(rotated, 'n');
    expect(fake.callsTo(APPLE_KEYS_URL)).toHaveLength(2);

    // A kid nobody knows: refused without hammering Apple (one fetch in the minute).
    const unknown = appleIdentityToken({ sub: 'a', rawNonce: 'n', kid: 'inconnue' });
    jest.setSystemTime(new Date('2026-10-13T08:01:30Z'));
    expect(await codeOf(service().verifyApple(unknown, 'n'))).toBe('identity_invalid');
    expect(await codeOf(service().verifyApple(unknown, 'n'))).toBe('identity_invalid');
    expect(fake.callsTo(APPLE_KEYS_URL)).toHaveLength(2);
    jest.setSystemTime(new Date('2026-10-13T08:02:02Z'));
    expect(await codeOf(service().verifyApple(unknown, 'n'))).toBe('identity_invalid');
    expect(fake.callsTo(APPLE_KEYS_URL)).toHaveLength(3);

    // After an hour, the set is read again.
    jest.setSystemTime(new Date('2026-10-13T09:03:00Z'));
    await service().verifyApple(appleIdentityToken({ sub: 'a', rawNonce: 'n' }), 'n');
    expect(fake.callsTo(APPLE_KEYS_URL)).toHaveLength(4);
  });

  it('répond 503 quand le fournisseur est injoignable, et garde une clé déjà connue', async () => {
    fake.down = true;
    expect(await codeOf(service().verifyApple(appleIdentityToken({ sub: 'a', rawNonce: 'n' }), 'n'))).toBe('provider_unreachable');
    fake.down = false;
    fake.keysStatus = 500;
    expect(await codeOf(service().verifyGoogle(googleIdToken({ sub: 'g' })))).toBe('provider_unreachable');

    fake.keysStatus = 200;
    jest.useFakeTimers({ now: new Date('2026-10-13T08:00:00Z'), doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout'] });
    await service().verifyApple(appleIdentityToken({ sub: 'a', rawNonce: 'n' }), 'n');
    jest.setSystemTime(new Date('2026-10-13T10:00:00Z'));
    fake.down = true;
    await expect(service().verifyApple(appleIdentityToken({ sub: 'a', rawNonce: 'n' }), 'n')).resolves.toMatchObject({ subject: 'a' });
  });

  it('abandonne une lecture des clés après le délai', async () => {
    service().timeoutMs = 20;
    service().fetchImpl = (url, init) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    try {
      expect(await codeOf(service().verifyGoogle(googleIdToken({ sub: 'g' })))).toBe('provider_unreachable');
    } finally {
      service().timeoutMs = 5000;
    }
  });
});

describe('vérification Google', () => {
  it('accepte un jeton du client Web, avec l’un ou l’autre émetteur de Google', async () => {
    expect(await service().verifyGoogle(googleIdToken({ sub: '1098', email: 'Karim.B@gmail.com' }))).toEqual({
      provider: 'google',
      subject: '1098',
      email: 'karim.b@gmail.com',
      emailVerified: true,
      isPrivateEmail: false,
      firstName: 'Karim',
      lastName: 'Benali',
    });
    expect(await service().verifyGoogle(googleIdToken({ sub: '1099', iss: 'accounts.google.com' }))).toMatchObject({ subject: '1099' });
    expect(fake.callsTo(GOOGLE_KEYS_URL)).toHaveLength(1);
  });

  it('refuse une adresse non vérifiée, un autre client ou un autre émetteur', async () => {
    expect(await codeOf(service().verifyGoogle(googleIdToken({ sub: 'g', emailVerified: false })))).toBe('identity_invalid');
    expect(await codeOf(service().verifyGoogle(googleIdToken({ sub: 'g', aud: 'inconnu.apps.googleusercontent.com' })))).toBe('identity_invalid');
    expect(await codeOf(service().verifyGoogle(googleIdToken({ sub: 'g', iss: 'https://evil.example' })))).toBe('identity_invalid');
  });

  it('n’est pas proposé sans identifiant client', async () => {
    process.env.GOOGLE_CLIENT_IDS = ' ';
    expect(await codeOf(service().verifyGoogle(googleIdToken({ sub: 'g' })))).toBe('provider_unavailable');
  });

  it('une confirmation doit être récente (5 minutes)', async () => {
    const fresh = googleIdToken({ sub: 'g', issuedSecondsAgo: 60 });
    await expect(service().verifyGoogle(fresh, { maxAgeSeconds: 300 })).resolves.toMatchObject({ subject: 'g' });
    const old = googleIdToken({ sub: 'g', issuedSecondsAgo: 400 });
    expect(await codeOf(service().verifyGoogle(old, { maxAgeSeconds: 300 }))).toBe('identity_invalid');
    // Still a valid sign-in token (no age asked).
    await expect(service().verifyGoogle(old)).resolves.toMatchObject({ subject: 'g' });
  });
});

describe('un jeton ne sert qu’une fois', () => {
  it('Apple et Google : le même jeton présenté une seconde fois est refusé', async () => {
    const apple = appleIdentityToken({ sub: 'unique-a', rawNonce: 'n' });
    await expect(service().verifyAppleOnce(apple, 'n')).resolves.toMatchObject({ subject: 'unique-a' });
    expect(await codeOf(service().verifyAppleOnce(apple, 'n'))).toBe('identity_invalid');
    const google = googleIdToken({ sub: 'unique-g' });
    await expect(service().verifyGoogleOnce(google)).resolves.toMatchObject({ subject: 'unique-g' });
    expect(await codeOf(service().verifyGoogleOnce(google))).toBe('identity_invalid');
    // A token that does not verify is not recorded.
    const bad = appleIdentityToken({ sub: 'unique-b', rawNonce: 'n' });
    expect(await codeOf(service().verifyAppleOnce(bad, 'autre'))).toBe('identity_invalid');
    await expect(service().verifyAppleOnce(bad, 'n')).resolves.toMatchObject({ subject: 'unique-b' });
  });
});

describe('révocation Apple (suppression du compte)', () => {
  it('signe le secret client en ES256 avec la clé Sign in with Apple, pour 5 minutes', () => {
    const { clientId, secret } = service().appleClientSecret(1_800_000_000);
    expect(clientId).toBe(APPLE_CLIENT_ID);
    const decoded = jwt.verify(secret, appleSigningKey.publicKey, { algorithms: ['ES256'], complete: true, clockTimestamp: 1_800_000_010 });
    expect(decoded.header).toMatchObject({ alg: 'ES256', kid: APPLE_KEY_ID });
    expect(decoded.payload).toMatchObject({ iss: APPLE_TEAM_ID, sub: APPLE_CLIENT_ID, aud: APPLE_ISSUER, iat: 1_800_000_000, exp: 1_800_000_300 });
  });

  it('échange le code puis révoque le jeton de renouvellement', async () => {
    fake.appleCodes.set('code-frais', '001234.abcd');
    await expect(service().revokeApple('code-frais', '001234.abcd')).resolves.toEqual({ subject: '001234.abcd' });
    expect(fake.callsTo(APPLE_TOKEN_URL)[0].form).toMatchObject({ client_id: APPLE_CLIENT_ID, code: 'code-frais', grant_type: 'authorization_code' });
    expect(fake.callsTo(APPLE_REVOKE_URL)[0].form).toMatchObject({
      client_id: APPLE_CLIENT_ID,
      token: 'refresh-001234.abcd',
      token_type_hint: 'refresh_token',
    });
  });

  it('refuse un code qu’Apple ne connaît pas, et répond 503 si la révocation échoue', async () => {
    expect(await codeOf(service().revokeApple('code-inconnu', 'a'))).toBe('reauth_failed');
    expect(fake.callsTo(APPLE_REVOKE_URL)).toHaveLength(0);
    fake.appleCodes.set('code-frais', 'a');
    fake.revokeStatus = 503;
    expect(await codeOf(service().revokeApple('code-frais', 'a'))).toBe('provider_unreachable');
    fake.down = true;
    expect(await codeOf(service().revokeApple('autre', 'a'))).toBe('provider_unreachable');
  });

  it('le code d’un autre identifiant Apple : rien n’est révoqué', async () => {
    fake.appleCodes.set('code-autre', 'quelqu-un-d-autre');
    expect(await codeOf(service().revokeApple('code-autre', '001234.abcd'))).toBe('reauth_failed');
    expect(fake.callsTo(APPLE_TOKEN_URL)).toHaveLength(1);
    expect(fake.callsTo(APPLE_REVOKE_URL)).toHaveLength(0);
  });

  it('Apple refuse la clé de Plazo (invalid_client) : 503 et un journal, pas une faute de la personne', async () => {
    fake.appleCodes.set('code-frais', 'a');
    fake.tokenError = { status: 400, error: 'invalid_client' };
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    expect(await codeOf(service().revokeApple('code-frais', 'a'))).toBe('provider_unreachable');
    expect(logged.mock.calls.map(([message]) => String(message)).join(' ')).toContain('invalid_client');
    // Apple's own words for a code expired or used: the person confirms again.
    fake.tokenError = { status: 400, error: 'invalid_grant' };
    expect(await codeOf(service().revokeApple('code-frais', 'a'))).toBe('reauth_failed');
    fake.tokenError = { status: 500, error: 'server_error' };
    expect(await codeOf(service().revokeApple('code-frais', 'a'))).toBe('provider_unreachable');
    expect(fake.callsTo(APPLE_REVOKE_URL)).toHaveLength(0);
  });

  it('sans id_token dans la réponse : les jetons reçus sont révoqués, puis 503', async () => {
    fake.appleCodes.set('code-frais', 'a');
    fake.tokenWithoutIdToken = true;
    jest.spyOn(logger, 'error').mockImplementation(() => logger);
    expect(await codeOf(service().revokeApple('code-frais', 'a'))).toBe('provider_unreachable');
    expect(fake.callsTo(APPLE_REVOKE_URL)[0].form).toMatchObject({ token: 'refresh-a', token_type_hint: 'refresh_token' });
  });

  it('un id_token qui ne se vérifie pas : reauth_failed, rien n’est révoqué', async () => {
    fake.appleCodes.set('code-frais', 'a');
    fake.appleKeys = [jwk(otherRsa.publicKey, 'apple-kid-1')];
    expect(await codeOf(service().revokeApple('code-frais', 'a'))).toBe('reauth_failed');
    expect(fake.callsTo(APPLE_REVOKE_URL)).toHaveLength(0);
  });

  it('accepte une clé PEM écrite sur plusieurs lignes', () => {
    process.env.APPLE_SIGNIN_PRIVATE_KEY = appleSigningKey.privateKey.export({ format: 'pem', type: 'pkcs8' }) as string;
    expect(() => service().appleClientSecret()).not.toThrow();
  });
});

describe('jetons Google signés avec la clé des tests', () => {
  it('n’acceptent pas une clé publiée pour Apple seulement', async () => {
    fake.googleKeys = [jwk(providerRsa.publicKey, 'autre-kid')];
    expect(await codeOf(service().verifyGoogle(googleIdToken({ sub: 'g' })))).toBe('identity_invalid');
  });
});
