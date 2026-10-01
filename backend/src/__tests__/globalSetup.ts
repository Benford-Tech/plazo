import { execSync } from 'child_process';
import { config } from 'dotenv';
import { PrismaClient } from '../generated/prisma-client';

// Rebuilds the dedicated test database from the migrations before the suite runs.
export default async function globalSetup() {
  config({ quiet: true });
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST must be set to run the tests');
  // Safety net: never wipe a database that is not explicitly a test database.
  const dbName = new URL(url).pathname.replace(/^\//, '');
  if (!dbName.endsWith('_test')) throw new Error(`Refusing to wipe "${dbName}": the test database name must end with _test`);

  const prisma = new PrismaClient({ datasourceUrl: url });
  await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public');
  await prisma.$disconnect();

  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: 'ignore' });
}
