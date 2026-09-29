import type { HardhatRuntimeEnvironment } from "hardhat/types";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const { ethers } = await import("hardhat");

  const [deployer] = await ethers.getSigners();

  console.log("Deploying SupplyChain...");
  console.log("Deployer:", deployer.address);

  const SupplyChain = await ethers.getContractFactory("SupplyChain");

  const supplyChain = await SupplyChain.deploy();

  await supplyChain.waitForDeployment();

  const address = await supplyChain.getAddress();

  console.log("SupplyChain deployed to:", address);

  return {
    SupplyChain: {
      address,
      constructorArguments: [],
    },
  };
}
