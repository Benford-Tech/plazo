import { PrismaClient } from '@/generated/prisma-client';

// On Vercel the Neon integration provides POSTGRES_PRISMA_URL: the pooled connection with the
// options Prisma needs (pgbouncer=true). Elsewhere DATABASE_URL is used as configured.
const prisma = new PrismaClient(process.env.POSTGRES_PRISMA_URL ? { datasourceUrl: process.env.POSTGRES_PRISMA_URL } : undefined);

export default prisma;
export * from '@/generated/prisma-client';
