import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb(url: string) {
  // prepare: false is required by the Supabase transaction pooler.
  const sqlClient = postgres(url, { prepare: false, max: 5 });
  return { db: drizzle(sqlClient, { schema }), sql: sqlClient };
}

export type Db = ReturnType<typeof createDb>["db"];

const globalForDb = globalThis as unknown as { __plazoDb?: ReturnType<typeof createDb> };

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

// Reuse one pool across hot reloads in development.
export function getDb(): Db {
  globalForDb.__plazoDb ??= createDb(databaseUrl());
  return globalForDb.__plazoDb.db;
}

/** A database handle or an open transaction: services accept both. */
export type DbOrTx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];
