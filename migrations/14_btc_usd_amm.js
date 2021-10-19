const Amm = artifacts.require("Amm");
const USDLinkOracle = artifacts.require("USDLinkOracle");
const ClearingHouse = artifacts.require("ClearingHouse");
const MockToken = artifacts.require("MockToken");

const { writeAbis } = require('./log');
const { toDec }  = require("./decUtil.js");

module.exports = async function(deployer, network, accounts) {
  let FEED = require(`../front/abis/USDLinkOracle.${network}.json`);
  const feed = await  USDLinkOracle.at(FEED.address)

  let USDTAddr = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";;
  let WBTCAddr = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";

  const tradeLimitRatio   = web3.utils.toWei("0.0125")    // default 0.015 1.25%
  const fundingPeriod = 3600   // 1 hour
  
  const fluctuationLimitRatio = web3.utils.toWei("0.012") // default 0.012 1.2%
  const tollRatio   = web3.utils.toWei("0");
  const spreadRatio = web3.utils.toWei("0.001"); // 0.1%

  let amm = await deployer.deploy(Amm, 

    tradeLimitRatio,
    fundingPeriod,
    feed.address,
    "0x0000000000000000000000000000000000000000",
    USDTAddr,
    WBTCAddr,
    fluctuationLimitRatio,
    tollRatio,
    spreadRatio);

  await writeAbis(Amm, 'Amm:BTC-USDT', network);


  const quoteAssetReserve = toDec("62.7", 6);  
  const baseAssetReserve  = toDec("0.001", 8) // 

  const usdt =  await MockToken.at(USDTAddr);
  await amm.setOpen(true);

  await usdt.approve(amm.address, toDec("125.4", 6));
  await amm.initLiquidity(accounts[0], quoteAssetReserve , baseAssetReserve);

  const initMarginRatio = web3.utils.toWei("0.1") // 10% -> 10x
  const maintenanceMarginRatio = web3.utils.toWei("0.0625") // 6.25% -> 16x
  const liquidationFeeRatio = web3.utils.toWei("0.0125")    // 1.25%
  
  let house = await deployer.deploy(ClearingHouse, 
      amm.address, 
      "0x0000000000000000000000000000000000000000",
      initMarginRatio , maintenanceMarginRatio, liquidationFeeRatio
      );

  await writeAbis(ClearingHouse, 'ClearingHouse:BTC-USDT', network);
  await amm.setCounterParty(house.address);

}