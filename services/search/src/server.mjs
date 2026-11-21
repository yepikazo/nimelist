import { startHttpService } from "../../../packages/service-runtime/src/index.mjs";

const port = Number(process.env.PORT ?? 4103);

startHttpService({
  name: "search",
  version: "0.1.0",
  port,
  capabilities: ["health", "service-info"],
});
