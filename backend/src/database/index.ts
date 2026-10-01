import { PrismaClient } from '@/generated/prisma-client';

const prisma = new PrismaClient();

export default prisma;
export * from '@/generated/prisma-client';
