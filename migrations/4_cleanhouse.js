const ClearingHouse = artifacts.require("ClearingHouse");
const ClearingHouseViewer = artifacts.require("ClearingHouseViewer");
const InsuranceFund = artifacts.require("InsuranceFund");

const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  const fund = await InsuranceFund.deployed();
  const initMarginRatio = web3.utils.toWei("0.1") // 10% -> 10x
  const maintenanceMarginRatio = web3.utils.toWei("0.0625") // 6.25% -> 16x
  const liquidationFeeRatio = web3.utils.toWei("0.0125")    // 1.25%
  await deployer.deploy(ClearingHouse, 
      initMarginRatio , maintenanceMarginRatio, liquidationFeeRatio, 
      fund.address);

  await writeAbis(ClearingHouse, 'ClearingHouse', network);

  await deployer.deploy(ClearingHouseViewer, ClearingHouse.address);
  await writeAbis(ClearingHouseViewer, 'ClearingHouseViewer', network);


  await fund.setBeneficiary(ClearingHouse.address);

}