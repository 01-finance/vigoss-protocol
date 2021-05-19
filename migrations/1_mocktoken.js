const MockETHToken = artifacts.require("MockETHToken");
const MockUSDCToken = artifacts.require("MockUSDCToken");

module.exports = async function (deployer) {
  await deployer.deploy(MockUSDCToken, "USDC", 18, web3.utils.toWei("100000000"));
  await deployer.deploy(MockETHToken, "WETH", 18, web3.utils.toWei("1000000"));
};

