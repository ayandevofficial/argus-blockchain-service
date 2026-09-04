import { Router } from "express";
import { z } from "zod";
import { BlockchainService } from "../services/blockchain.service.js";

const router = Router();
const service = new BlockchainService();
const id = z.string().min(1).max(128);
const hash = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

router.post("/transfer", async (req, res, next) => {
  try {
    const input = z.object({ transferId: id, evidenceId: id, fromAgency: id, toAgency: id, evidenceHash: hash }).parse(req.body);
    res.status(201).json({ success: true, data: await service.createTransfer(input) });
  } catch (e) { next(e); }
});

router.post("/transfer/confirm", async (req, res, next) => {
  try {
    const input = z.object({ transferId: id, receivingAgency: id }).parse(req.body);
    res.json({ success: true, data: await service.confirmTransfer(input) });
  } catch (e) { next(e); }
});

router.get("/transfer/:transferId", async (req, res, next) => {
  try { res.json({ success: true, data: await service.getTransfer(req.params.transferId) }); }
  catch (e) { next(e); }
});

export default router;
