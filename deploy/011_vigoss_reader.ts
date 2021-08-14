
const { ethers, upgrades } = require("hardhat");

// console.log("HARDHAT_NETWORK" + ethers.HARDHAT_NETWORK)

async function main() {
  let network = "testbsc"
  let vgsForMargin = require(`../front/abis/VGSForMargin.${network}.json`);
  let vgsForLP = require(`../front/abis/VGSForLP.${network}.json`);

  const VigossReader = await ethers.getContractFactory("VigossReader");
  const reader = await VigossReader.deploy(vgsForLP.address, vgsForMargin.address);
  await reader.deployed();
  console.log("VigossReader deployed to:", reader.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
