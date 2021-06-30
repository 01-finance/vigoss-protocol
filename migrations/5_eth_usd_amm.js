const Amm = artifacts.require("Amm");
const SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");
const InsuranceFund = artifacts.require("InsuranceFund");
const ClearingHouse = artifacts.require("ClearingHouse");
const ClearingHouseViewer = artifacts.require("ClearingHouseViewer");

const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  const feed = await  SimpleUSDPriceFeed.deployed();

  let USDC = require(`../front/abis/USDC.${network}.json`);
  let WETH = require(`../front/abis/WETH.${network}.json`);

  const quoteAssetReserve = web3.utils.toWei("4000000") // 
  const baseAssetReserve  =  web3.utils.toWei("20000") // 
  const tradeLimitRatio   = web3.utils.toWei("0.015")    // default 0.015 1.25%
  const fundingPeriod = 3600   // 1 hour
  
  const fluctuationLimitRatio = web3.utils.toWei("0.012") // default 0.012 1.2%
  const tollRatio   = web3.utils.toWei("0");
  const spreadRatio = web3.utils.toWei("0.001"); // 0.1%

  let amm = await deployer.deploy(Amm, 
    quoteAssetReserve ,
    baseAssetReserve, 
    tradeLimitRatio,
    fundingPeriod,
    feed.address,
    USDC.address,
    WETH.address,
    fluctuationLimitRatio,
    tollRatio,
    spreadRatio);

  await writeAbis(Amm, 'Amm:ETH-USDC', network);

  await amm.setOpen(true);

  const initMarginRatio = web3.utils.toWei("0.1") // 10% -> 10x
  const maintenanceMarginRatio = web3.utils.toWei("0.0625") // 6.25% -> 16x
  const liquidationFeeRatio = web3.utils.toWei("0.0125")    // 1.25%
  
  const fund = await InsuranceFund.deployed();

  let house =  await deployer.deploy(ClearingHouse, 
      amm.address, initMarginRatio , maintenanceMarginRatio, liquidationFeeRatio, 
      fund.address);

  await writeAbis(ClearingHouse, 'ClearingHouse:ETH-USDC', network);

  await deployer.deploy(ClearingHouseViewer, ClearingHouse.address);
  await writeAbis(ClearingHouseViewer, 'ClearingHouseViewer:ETH-USDC', network);


  await fund.setBeneficiary(house.address, true);

  await amm.setCounterParty(house.address);

  await fund.addAmm(Amm.address);
}