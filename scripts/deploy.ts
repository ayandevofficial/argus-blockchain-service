import { network } from "hardhat";

const { ethers } = await network.create();
const contract = await ethers.deployContract("EvidenceCustody");
await contract.waitForDeployment();
console.log(`EvidenceCustody deployed to: ${await contract.getAddress()}`);
console.log("Set this address as CONTRACT_ADDRESS in .env");
