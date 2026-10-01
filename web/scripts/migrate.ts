import "dotenv/config";
import { runMigrations } from "../src/db/migrate";

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("MIGRATION_DATABASE_URL or DATABASE_URL must be set");
runMigrations(url).then(() => console.log("Migrations applied."));
