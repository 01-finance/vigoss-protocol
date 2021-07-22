const VigossToken = artifacts.require("VigossToken");
const VGSDistributer = artifacts.require("VGSDistributer");
const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  const vgsPerSecond = web3.utils.toWei("1") // 
  const ts = Math.floor(new Date().getTime() / 1000);

  const vgs = await VigossToken.deployed();

  await deployer.deploy(VGSDistributer, vgs.address, vgsPerSecond, ts);

  await writeAbis(VGSDistributer, 'VGSDistributer', network);

}