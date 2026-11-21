import pg from "pg";

const { Pool } = pg;

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 3_000,
    })
  : null;

pool?.on("error", (error) => {
  console.error(JSON.stringify({ level: "error", service: "schedule", event: "pool-error", message: error.message }));
});
