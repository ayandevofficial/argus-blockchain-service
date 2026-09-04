import { network } from "hardhat";

const { ethers } = await network.create();

const contract = await ethers.getContractAt(
  "EvidenceCustody",
  process.env.CONTRACT_ADDRESS!
);

const agencyId = ethers.id("KOLKATA_POLICE");

const tx = await contract.setAgencyAuthorization(agencyId, true);

console.log("Authorization TX:", tx.hash);

await tx.wait();

console.log("KOLKATA_POLICE authorized on Sepolia");
