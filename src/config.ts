import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4300),
  RPC_URL: z.string().url().default("http://127.0.0.1:8545"),
  PRIVATE_KEY: z.string().min(66).startsWith("0x"),
  CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  ARGUS_API_KEY: z.string().min(16).optional()
});

export const config = envSchema.parse(process.env);
