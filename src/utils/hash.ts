import { createHash } from "node:crypto";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function normalizeBytes32Hex(value: string): string {
  const clean = value.replace(/^0x/, "");
  if (!/^[0-9a-fA-F]{64}$/.test(clean)) throw new Error("Expected a 32-byte hex value");
  return `0x${clean}`;
}
