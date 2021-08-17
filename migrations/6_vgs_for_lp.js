const VigossToken = artifacts.require("VigossToken");
const VGSForLP = artifacts.require("VGSForLP");
const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
    const vgsPerSecond = web3.utils.toWei("0.125") // 

    const vgs = await VigossToken.deployed();

    await deployer.deploy(VGSForLP, vgs.address, vgsPerSecond);
    await writeAbis(VGSForLP, 'VGSForLP', network);

    
  // 100000000 * 0.52 * 0.5 = 26000000
    await vgs.transfer(VGSForLP.address, this.web3.utils.toWei("260000")) ; // 1%
}