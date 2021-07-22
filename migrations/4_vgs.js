const VigossToken = artifacts.require("VigossToken");
const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(VigossToken, accounts[0]);

  await writeAbis(VigossToken, 'VigossToken', network);

}