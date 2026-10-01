import "dotenv/config";
import postgres from "postgres";
import { runMigrations } from "../src/db/migrate";

export default async function setup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error("DATABASE_URL_TEST must be set to run the tests");
  // Start from an empty schema so migrations are exercised from scratch.
  const sql = postgres(url, { onnotice: () => {} });
  await sql.unsafe("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;");
  await sql.end();
  await runMigrations(url);
}
