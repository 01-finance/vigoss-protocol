const USDLinkOracle = artifacts.require("USDLinkOracle");
const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(USDLinkOracle, accounts[0]);
  await writeAbis(USDLinkOracle, 'USDLinkOracle', network);
}