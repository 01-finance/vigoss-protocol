const Amm = artifacts.require("Amm");
const SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");
const ClearingHouse = artifacts.require("ClearingHouse");
const VGSForMargin = artifacts.require("VGSForMargin");
const VGSForLP = artifacts.require("VGSForLP");
const MockToken = artifacts.require("MockToken");

const { writeAbis } = require('./log');
const { toDec }  = require("./decUtil.js");

module.exports = async function(deployer, network, accounts) {
  const feed = await  SimpleUSDPriceFeed.deployed();

  let USDT = require(`../front/abis/USDT.${network}.json`);
  let WBTC = require(`../front/abis/WBTC.${network}.json`);
  let vgsForMargin = require(`../front/abis/VGSForMargin.${network}.json`);
  let vgsForLP = require(`../front/abis/VGSForLP.${network}.json`);

  const tradeLimitRatio   = web3.utils.toWei("0.015")    // default 0.015 1.25%
  const fundingPeriod = 3600   // 1 hour
  
  const fluctuationLimitRatio = web3.utils.toWei("0.012") // default 0.012 1.2%
  const tollRatio   = web3.utils.toWei("0");
  const spreadRatio = web3.utils.toWei("0.001"); // 0.1%

  let amm = await deployer.deploy(Amm, 

    tradeLimitRatio,
    fundingPeriod,
    feed.address,
    vgsForLP.address,
    USDT.address,
    WBTC.address,
    fluctuationLimitRatio,
    tollRatio,
    spreadRatio);

  await writeAbis(Amm, 'Amm:BTC-USDT', network);


  const quoteAssetReserve = toDec("4667200", 6); 
  const baseAssetReserve  =  web3.utils.toWei("100") // 

  const usdt =  await MockToken.at(USDT.address);
  await amm.setOpen(true);


  var vgslp = await VGSForLP.at(vgsForLP.address);

  await vgslp.add(10, amm.address, true);


  await usdt.approve(amm.address, toDec("9334400", 6));
  await amm.initLiquidity(accounts[0], quoteAssetReserve , baseAssetReserve);

  const initMarginRatio = web3.utils.toWei("0.1") // 10% -> 10x
  const maintenanceMarginRatio = web3.utils.toWei("0.0625") // 6.25% -> 16x
  const liquidationFeeRatio = web3.utils.toWei("0.0125")    // 1.25%
  
  let house = await deployer.deploy(ClearingHouse, 
      amm.address, 
      vgsForMargin.address,
      initMarginRatio , maintenanceMarginRatio, liquidationFeeRatio
      );

  await writeAbis(ClearingHouse, 'ClearingHouse:BTC-USDT', network);

  var marginMiner = await VGSForMargin.at(vgsForMargin.address);

  await marginMiner.setClearingHouse(house.address, true);


  await amm.setCounterParty(house.address);

}