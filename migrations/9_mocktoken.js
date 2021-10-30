const MockToken = artifacts.require("MockToken");

const { writeAbis } = require('./log');



module.exports = async function (deployer, network, accounts) {
  // 0xc2132D05D31c914a87C6611C10748AEb04B58e8F
  await deployer.deploy(MockToken, "USDC", 6, web3.utils.toWei("1"));
  await writeAbis(MockToken, "USDC", network);

  // await deployer.deploy(MockToken, "WETH", 18, web3.utils.toWei("1000000"));
  // await writeAbis(MockToken, 'WETH', network);


  // await deployer.deploy(MockToken, "WBTC", 18, web3.utils.toWei("1000000"));
  // await writeAbis(MockToken, 'WBTC', network);  


};

