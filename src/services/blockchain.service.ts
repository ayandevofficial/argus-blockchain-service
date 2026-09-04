import { ethers } from "ethers";
import { config } from "../config.js";
import { normalizeBytes32Hex } from "../utils/hash.js";

const ABI = [
  "function anchorEvidence(bytes32 evidenceId, bytes32 evidenceHash, bytes32 agencyId)",
  "function createTransfer(bytes32 transferId, bytes32 evidenceId, bytes32 fromAgency, bytes32 toAgency, bytes32 evidenceHash)",
  "function confirmTransfer(bytes32 transferId, bytes32 receivingAgency)",
  "function getEvidenceAnchor(bytes32 evidenceId) view returns (bytes32 evidenceHash, uint64 timestamp, address anchoredBy, bool exists)",
  "function getTransfer(bytes32 transferId) view returns (tuple(bytes32 evidenceId, bytes32 evidenceHash, bytes32 fromAgency, bytes32 toAgency, uint64 createdAt, uint64 confirmedAt, address createdBy, address confirmedBy, uint8 status))"
];
const STATUS = ["NONE", "PENDING", "CONFIRMED", "REJECTED"] as const;

export class BlockchainService {
  private readonly provider = new ethers.JsonRpcProvider(config.RPC_URL);
  private readonly wallet = new ethers.Wallet(config.PRIVATE_KEY, this.provider);
  private readonly contract = new ethers.Contract(config.CONTRACT_ADDRESS, ABI, this.wallet);

  async health() {
    const network = await this.provider.getNetwork();
    return { chainId: network.chainId.toString(), blockNumber: await this.provider.getBlockNumber(), wallet: this.wallet.address, contract: config.CONTRACT_ADDRESS };
  }

  async anchorEvidence(input: { evidenceId: string; evidenceHash: string; agencyId: string }) {
    const tx = await this.contract.anchorEvidence(ethers.id(input.evidenceId), normalizeBytes32Hex(input.evidenceHash), ethers.id(input.agencyId));
    const receipt = await tx.wait();
    return { ...input, txHash: receipt.hash, blockNumber: receipt.blockNumber, status: "ANCHORED" as const };
  }

  async createTransfer(input: { transferId: string; evidenceId: string; fromAgency: string; toAgency: string; evidenceHash: string }) {
    const tx = await this.contract.createTransfer(ethers.id(input.transferId), ethers.id(input.evidenceId), ethers.id(input.fromAgency), ethers.id(input.toAgency), normalizeBytes32Hex(input.evidenceHash));
    const receipt = await tx.wait();
    return { transferId: input.transferId, evidenceId: input.evidenceId, status: "PENDING" as const, txHash: receipt.hash, blockNumber: receipt.blockNumber };
  }

  async confirmTransfer(input: { transferId: string; receivingAgency: string }) {
    const tx = await this.contract.confirmTransfer(ethers.id(input.transferId), ethers.id(input.receivingAgency));
    const receipt = await tx.wait();
    return { transferId: input.transferId, receivingAgency: input.receivingAgency, status: "CONFIRMED" as const, txHash: receipt.hash, blockNumber: receipt.blockNumber };
  }

  async getEvidenceAnchor(evidenceId: string) {
    const r = await this.contract.getEvidenceAnchor(ethers.id(evidenceId));
    return { evidenceId, evidenceHash: r[0], timestamp: Number(r[1]), anchoredBy: r[2], exists: r[3] };
  }

  async getTransfer(transferId: string) {
    const r = await this.contract.getTransfer(ethers.id(transferId));
    return { transferId, evidenceId: r.evidenceId, evidenceHash: r.evidenceHash, fromAgency: r.fromAgency, toAgency: r.toAgency, createdAt: Number(r.createdAt), confirmedAt: Number(r.confirmedAt), createdBy: r.createdBy, confirmedBy: r.confirmedBy, status: STATUS[Number(r.status)] ?? "NONE" };
  }

  async verifyEvidence(input: { evidenceId: string; currentHash: string }) {
    const anchor = await this.getEvidenceAnchor(input.evidenceId);
    const currentHash = normalizeBytes32Hex(input.currentHash);
    const verified = anchor.exists && anchor.evidenceHash.toLowerCase() === currentHash.toLowerCase();
    return { evidenceId: input.evidenceId, anchored: anchor.exists, anchoredHash: anchor.evidenceHash, currentHash, verified, status: !anchor.exists ? "NOT_ANCHORED" : verified ? "INTEGRITY_VERIFIED" : "INTEGRITY_VIOLATION" };
  }
}
