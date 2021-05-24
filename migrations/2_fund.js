const InsuranceFund = artifacts.require("InsuranceFund");
const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(InsuranceFund);

  await writeAbis(InsuranceFund, 'InsuranceFund', network);

}