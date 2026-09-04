import type { NextFunction, Request, Response } from "express";
import { config } from "./config.js";

export function apiKeyGuard(req: Request, res: Response, next: NextFunction) {
  if (!config.ARGUS_API_KEY) return next();
  if (req.header("x-argus-api-key") !== config.ARGUS_API_KEY) return res.status(401).json({ error: "Unauthorized" });
  return next();
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
}
