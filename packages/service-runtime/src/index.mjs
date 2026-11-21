import { createServer } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

function sendJson(response, status, body, requestId) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId,
  });
  response.end(JSON.stringify(body));
}

export class ServiceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function readJsonBody(request, maxBytes = 64 * 1024) {
  const contentType = String(request.headers["content-type"] ?? "").toLowerCase();
  if (!contentType.includes("application/json")) {
    throw new ServiceError(415, "UNSUPPORTED_MEDIA_TYPE", "Kirim body application/json.");
  }

  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      throw new ServiceError(413, "BODY_TOO_LARGE", "Ukuran body melewati batas.");
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ServiceError(400, "INVALID_JSON", "Body JSON tidak valid.");
  }
}

export function requireServiceToken(request) {
  const expected = process.env.INTERNAL_API_TOKEN;
  if (!expected || expected.length < 32) {
    throw new ServiceError(503, "INTERNAL_AUTH_NOT_CONFIGURED", "Autentikasi internal belum dikonfigurasi.");
  }

  const authorization = String(request.headers.authorization ?? "");
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    throw new ServiceError(401, "UNAUTHORIZED", "Kredensial service tidak valid.");
  }
}

export async function inTransaction(pool, callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function runMigrations(pool, migrationsDirectory) {
  const directory = migrationsDirectory instanceof URL
    ? fileURLToPath(migrationsDirectory)
    : migrationsDirectory;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(directory))
    .filter((file) => /^\d{3}_[a-z0-9_-]+\.sql$/.test(file))
    .sort();

  for (const file of files) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
        `nimelist:migration:${file}`,
      ]);
      const result = await client.query("SELECT 1 FROM service_migrations WHERE version = $1", [file]);
      if (result.rowCount > 0) {
        await client.query("COMMIT");
        continue;
      }

      const sql = await readFile(join(directory, file), "utf8");
      await client.query(sql);
      await client.query("INSERT INTO service_migrations (version) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(JSON.stringify({ level: "info", migration: file, event: "applied" }));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export function startHttpService({
  name,
  version,
  port,
  capabilities = [],
  readyCheck,
  handleRequest,
}) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://service.local");
    const requestId = String(request.headers["x-request-id"] ?? randomUUID());

    if (request.method === "GET" && url.pathname === "/healthz") {
      sendJson(response, 200, { status: "ok", service: name }, requestId);
      return;
    }

    if (request.method === "GET" && url.pathname === "/readyz") {
      try {
        const dependencies = readyCheck ? await readyCheck() : {};
        sendJson(response, 200, { status: "ready", service: name, dependencies }, requestId);
      } catch {
        sendJson(response, 503, {
          error: { code: "NOT_READY", message: "Dependency belum siap." },
          service: name,
        }, requestId);
      }
      return;
    }

    if (request.method === "GET" && url.pathname === "/v1/info") {
      sendJson(response, 200, {
        service: name,
        version,
        capabilities,
      }, requestId);
      return;
    }

    try {
      const result = handleRequest ? await handleRequest(request, url) : null;
      if (result) {
        sendJson(response, result.status ?? 200, result.body, requestId);
        return;
      }
      sendJson(response, 404, {
        error: { code: "ROUTE_NOT_FOUND", message: "Rute tidak ditemukan." },
      }, requestId);
    } catch (error) {
      if (error instanceof ServiceError) {
        sendJson(response, error.status, { error: { code: error.code, message: error.message } }, requestId);
        return;
      }
      console.error(JSON.stringify({
        level: "error",
        service: name,
        requestId,
        message: error instanceof Error ? error.message : "Unknown error",
      }));
      sendJson(response, 500, {
        error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal." },
      }, requestId);
    }
  });

  server.on("error", (error) => {
    console.error(JSON.stringify({ level: "error", service: name, message: error.message }));
    process.exitCode = 1;
  });

  server.listen(port, process.env.HOST ?? "0.0.0.0", () => {
    console.log(JSON.stringify({ level: "info", service: name, port, event: "listening" }));
  });

  const shutdown = () => {
    server.close((error) => {
      if (error) {
        console.error(JSON.stringify({ level: "error", service: name, message: error.message }));
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return server;
}
