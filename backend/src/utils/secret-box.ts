import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Small secrets at rest (e.g. an operator's SMS gateway password): AES-256-GCM with a server key.
 * Stored form: "v1.<iv>.<tag>.<ciphertext>" (base64url). The key is 32 bytes, given in base64.
 */

const VERSION = 'v1';
const IV_BYTES = 12;

export class SecretBoxError extends Error {
  constructor(public readonly code: 'key_missing' | 'key_invalid' | 'ciphertext_invalid') {
    super(code);
    this.name = 'SecretBoxError';
  }
}

function keyBuffer(key: string): Buffer {
  if (!key) throw new SecretBoxError('key_missing');
  const buffer = Buffer.from(key, 'base64');
  if (buffer.length !== 32) throw new SecretBoxError('key_invalid');
  return buffer;
}

export function encryptSecret(plain: string, key: string): string {
  const k = keyBuffer(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', k, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), data.toString('base64url')].join('.');
}

export function decryptSecret(stored: string, key: string): string {
  const k = keyBuffer(key);
  const [version, iv, tag, data] = stored.split('.');
  if (version !== VERSION || !iv || !tag || !data) throw new SecretBoxError('ciphertext_invalid');
  try {
    const decipher = createDecipheriv('aes-256-gcm', k, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    // A wrong key or a tampered value: the same error, never the reason.
    throw new SecretBoxError('ciphertext_invalid');
  }
}
