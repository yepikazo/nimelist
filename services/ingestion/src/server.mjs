import { startHttpService } from "../../../packages/service-runtime/src/index.mjs";

const port = Number(process.env.PORT ?? 4104);

startHttpService({
  name: "ingestion",
  version: "0.1.0",
  port,
  capabilities: ["health", "service-info"],
});
