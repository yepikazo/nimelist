import pg from "pg";
import { runMigrations } from "../../../packages/service-runtime/src/index.mjs";

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL wajib diisi untuk migrasi Catalog.");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  await runMigrations(pool, new URL("../migrations/", import.meta.url));
} finally {
  await pool.end();
}
