const VigossToken = artifacts.require("VigossToken");
const VGSForMargin = artifacts.require("VGSForMargin");
const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  const vgsPerSecond = web3.utils.toWei("0.1") // 8640 day  

  const vgs = await VigossToken.deployed();


  // 100000000 * 0.52 * 0.4 = 20800000

  await deployer.deploy(VGSForMargin, vgs.address, vgsPerSecond);

  await writeAbis(VGSForMargin, 'VGSForMargin', network);

  await vgs.transfer(VGSForMargin.address, this.web3.utils.toWei("208000")) ; // 1%

}