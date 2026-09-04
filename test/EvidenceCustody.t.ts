import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("EvidenceCustody", function () {
  async function fixture() {
    const [owner, agencyA, agencyB] = await ethers.getSigners();
    const contract = await ethers.deployContract("EvidenceCustody");
    await contract.waitForDeployment();
    const agencyAId = ethers.id("AGENCY-A");
    const agencyBId = ethers.id("FORENSIC-LAB-B");
    await contract.setAgencyAuthorization(agencyAId, true);
    await contract.setAgencyAuthorization(agencyBId, true);
    return { owner, agencyA, agencyB, contract, agencyAId, agencyBId };
  }

  it("anchors an evidence hash", async function () {
    const { contract, agencyAId } = await fixture();
    const evidenceId = ethers.id("E-104");
    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("demo evidence"));
    await contract.anchorEvidence(evidenceId, evidenceHash, agencyAId);
    const anchor = await contract.getEvidenceAnchor(evidenceId);
    expect(anchor.exists).to.equal(true);
    expect(anchor.evidenceHash).to.equal(evidenceHash);
  });

  it("requires the recipient to confirm a custody transfer", async function () {
    const { contract, agencyA, agencyB, agencyAId, agencyBId } = await fixture();
    const evidenceId = ethers.id("E-104");
    const transferId = ethers.id("T-001");
    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("demo evidence"));
    await contract.connect(agencyA).anchorEvidence(evidenceId, evidenceHash, agencyAId);
    await contract.connect(agencyA).createTransfer(transferId, evidenceId, agencyAId, agencyBId, evidenceHash);
    expect((await contract.getTransfer(transferId)).status).to.equal(1n);
    await contract.connect(agencyB).confirmTransfer(transferId, agencyBId);
    const confirmed = await contract.getTransfer(transferId);
    expect(confirmed.status).to.equal(2n);
    expect(confirmed.confirmedBy).to.equal(agencyB.address);
  });

  it("rejects a transfer if the evidence hash does not match the anchor", async function () {
    const { contract, agencyAId, agencyBId } = await fixture();
    const evidenceId = ethers.id("E-104");
    const transferId = ethers.id("T-002");
    const anchoredHash = ethers.keccak256(ethers.toUtf8Bytes("original"));
    const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("modified"));
    await contract.anchorEvidence(evidenceId, anchoredHash, agencyAId);
    await expect(contract.createTransfer(transferId, evidenceId, agencyAId, agencyBId, wrongHash)).to.be.revertedWith("hash mismatch");
  });
});
