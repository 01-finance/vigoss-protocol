const MockToken = artifacts.require("MockToken");

const { writeAbis } = require('./log');

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(MockToken, "USDC", 18, web3.utils.toWei("100000000"));
  await writeAbis(MockToken, "USDC", network);

  await deployer.deploy(MockToken, "WETH", 18, web3.utils.toWei("1000000"));
  await writeAbis(MockToken, 'WETH', network);

  await deployer.deploy(MockToken, "USDT", 8, web3.utils.toWei("10"));
  await writeAbis(MockToken, "USDT", network);


  await deployer.deploy(MockToken, "WBTC", 18, web3.utils.toWei("1000000"));
  await writeAbis(MockToken, 'WBTC', network);  


};

