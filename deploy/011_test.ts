
const { ethers, upgrades } = require("hardhat");

// console.log("HARDHAT_NETWORK" + ethers.HARDHAT_NETWORK)

async function main() {

  const Greeter = await ethers.getContractFactory("Greeter");
  const reader = await Greeter.deploy();
  await reader.deployed();
  console.log("Greeter deployed to:", reader.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
