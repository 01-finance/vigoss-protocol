const InsuranceFund = artifacts.require("InsuranceFund");


module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(InsuranceFund, accounts[0]);

}