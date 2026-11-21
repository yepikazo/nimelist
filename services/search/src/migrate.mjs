import { runMigrations } from "../../../packages/service-runtime/src/index.mjs";
import { pool } from "./db.mjs";

if (!pool) throw new Error("DATABASE_URL Search belum dikonfigurasi.");

try {
  await runMigrations(pool, new URL("../migrations/", import.meta.url));
} finally {
  await pool.end();
}
