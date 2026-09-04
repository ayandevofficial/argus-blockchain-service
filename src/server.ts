import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { apiKeyGuard, errorHandler } from "./middleware.js";
import evidenceRouter from "./routes/evidence.routes.js";
import custodyRouter from "./routes/custody.routes.js";
import { BlockchainService } from "./services/blockchain.service.js";

const app = express();
const blockchain = new BlockchainService();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "256kb" }));
app.use(apiKeyGuard);

app.get("/health", async (_req, res, next) => {
  try { res.json({ ok: true, service: "argus-blockchain-service", blockchain: await blockchain.health() }); }
  catch (e) { next(e); }
});

app.get("/", (_req, res) => res.json({
  service: "ARGUS Blockchain Service",
  version: "0.1.0",
  endpoints: [
    "GET /health",
    "POST /api/evidence/anchor",
    "GET /api/evidence/:evidenceId",
    "POST /api/evidence/verify",
    "POST /api/custody/transfer",
    "POST /api/custody/transfer/confirm",
    "GET /api/custody/transfer/:transferId"
  ]
}));

app.use("/api/evidence", evidenceRouter);
app.use("/api/custody", custodyRouter);
app.use(errorHandler);

app.listen(config.PORT, () => console.log(`ARGUS blockchain service listening on http://localhost:${config.PORT}`));
