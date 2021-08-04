const VigossToken = artifacts.require("VigossToken");
const VGSForMargin = artifacts.require("VGSForMargin");
const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  const vgsPerSecond = web3.utils.toWei("1") // 
  const ts = Math.floor(new Date().getTime() / 1000);

  const vgs = await VigossToken.deployed();

  await deployer.deploy(VGSForMargin, vgs.address, vgsPerSecond, ts);

  await writeAbis(VGSForMargin, 'VGSForMargin', network);

}