import { createHash, randomBytes } from 'crypto';
import { Service } from 'typedi';
import prisma, { AccountTokenType, Prisma } from '@/database';

type Client = Prisma.TransactionClient | typeof prisma;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Single-use links sent by email (invitation, email verification). The token is 32 random bytes
 * that only exist in the link; the database keeps its SHA-256. Issuing a new link of a type
 * cancels the unused ones of that type for the same person.
 */
@Service()
export class AccountTokenService {
  public async issue(staffId: string, type: AccountTokenType, ttlMs: number, client: Client = prisma): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + ttlMs);
    await client.accountToken.deleteMany({ where: { staffId, type, usedAt: null } });
    await client.accountToken.create({ data: { staffId, type, tokenHash: hashToken(token), expiresAt } });
    return { token, expiresAt };
  }

  /** The valid (unused, unexpired) token's row, without using it. */
  public async find(token: string, type: AccountTokenType, client: Client = prisma) {
    if (!token || token.length > 200) return null;
    const row = await client.accountToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!row || row.type !== type || row.usedAt || row.expiresAt <= new Date()) return null;
    return row;
  }

  /** Uses a token: returns its staff id, or null when unknown, expired or already used (atomic). */
  public async consume(token: string, type: AccountTokenType, client: Client = prisma): Promise<string | null> {
    const row = await this.find(token, type, client);
    if (!row) return null;
    const { count } = await client.accountToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    return count === 1 ? row.staffId : null;
  }
}
