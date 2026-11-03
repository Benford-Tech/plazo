import { PrismaClient } from '@/generated/prisma-client';

// On Vercel the Neon integration provides POSTGRES_PRISMA_URL: the pooled connection with the
// options Prisma needs (pgbouncer=true). Elsewhere DATABASE_URL is used as configured.
const base = new PrismaClient(process.env.POSTGRES_PRISMA_URL ? { datasourceUrl: process.env.POSTGRES_PRISMA_URL } : undefined);

/**
 * 03/11/2026 (« Pouvoir supprimer une réservation… elle s'archive 45 jours »): a deleted reservation keeps its row for
 * 45 days (`deletedAt`), and no read or update of the app sees it: every reservation query below gets `deletedAt: null`.
 * Only the trash (list, restore, purge) reads them, through `prismaWithDeleted`. Raw SQL on `reservations` filters
 * `"deletedAt" IS NULL` itself.
 */
const HIDES_DELETED = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'updateManyAndReturn',
]);

// Typed as the plain client: the extension changes no shape, and every `Prisma.TransactionClient` signature keeps working.
const prisma = base.$extends({
  name: 'hide-deleted-reservations',
  query: {
    reservation: {
      async $allOperations({ operation, args, query }) {
        if (HIDES_DELETED.has(operation)) {
          const withWhere = args as { where?: Record<string, unknown> };
          withWhere.where = { ...(withWhere.where ?? {}), deletedAt: null };
        }
        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;

/** The client that also sees the deleted reservations: the trash only (Réservations › Supprimées, restore, purge). */
export const prismaWithDeleted = base;

export default prisma;
export * from '@/generated/prisma-client';
