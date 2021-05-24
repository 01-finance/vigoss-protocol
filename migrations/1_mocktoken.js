const MockToken = artifacts.require("MockToken");

const { writeAbis } = require('./log');

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(MockToken, "USDC", 18, web3.utils.toWei("100000000"));
  await writeAbis(MockToken, "USDC", network);

  await deployer.deploy(MockToken, "WETH", 18, web3.utils.toWei("1000000"));
  await writeAbis(MockToken, 'WETH', network);


  


};

