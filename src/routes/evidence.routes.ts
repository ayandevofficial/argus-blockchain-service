import { Router } from "express";
import { z } from "zod";
import { BlockchainService } from "../services/blockchain.service.js";

const router = Router();
const service = new BlockchainService();
const hash = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const id = z.string().min(1).max(128);

router.post("/anchor", async (req, res, next) => {
  try {
    const input = z.object({ evidenceId: id, evidenceHash: hash, agencyId: id }).parse(req.body);
    res.status(201).json({ success: true, data: await service.anchorEvidence(input) });
  } catch (e) { next(e); }
});

router.get("/:evidenceId", async (req, res, next) => {
  try { res.json({ success: true, data: await service.getEvidenceAnchor(req.params.evidenceId) }); }
  catch (e) { next(e); }
});

router.post("/verify", async (req, res, next) => {
  try {
    const input = z.object({ evidenceId: id, currentHash: hash }).parse(req.body);
    res.json({ success: true, data: await service.verifyEvidence(input) });
  } catch (e) { next(e); }
});

export default router;
