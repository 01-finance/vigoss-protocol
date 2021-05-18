const MockToken = artifacts.require("MockToken");

module.exports = async function (deployer) {
  await deployer.deploy(MockToken, "USDC", 18, web3.uitls.toWei("100000000"));
  await deployer.deploy(MockToken, "WETH", 18, web3.uitls.toWei("1000000"));
};

