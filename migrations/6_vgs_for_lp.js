const VigossToken = artifacts.require("VigossToken");
const VGSForLP = artifacts.require("VGSForLP");
const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
    const vgsPerSecond = web3.utils.toWei("1") // 

    const vgs = await VigossToken.deployed();

    await deployer.deploy(VGSForLP, vgs.address, vgsPerSecond);
    await writeAbis(VGSForLP, 'VGSForLP', network);

}