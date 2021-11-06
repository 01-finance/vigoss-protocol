const Amm = artifacts.require("Amm");
const USDLinkOracle = artifacts.require("USDLinkOracle");
const ClearingHouse = artifacts.require("ClearingHouse");
const MockToken = artifacts.require("MockToken");

const { writeAbis } = require('./log');
const { toDec }  = require("./decUtil.js");

module.exports = async function(deployer, network, accounts) {
  let FEED = require(`../front/abis/USDLinkOracle.${network}.json`);
  const feed = await  USDLinkOracle.at(FEED.address)

  let DAIAddr = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";;
  let WBTCAddr = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";

  const tradeLimitRatio   = web3.utils.toWei("0.0125")    // default 0.015 1.25%
  const fundingPeriod = 3600   // 1 hour
  
  const fluctuationLimitRatio = web3.utils.toWei("0.012") // default 0.012 1.2%
  const tollRatio   = web3.utils.toWei("0");
  const spreadRatio = web3.utils.toWei("0.001"); // 0.1%

  console.log(accounts[0])

  let amm = await deployer.deploy(Amm, 

    tradeLimitRatio,
    fundingPeriod,
    feed.address,
    "0x0000000000000000000000000000000000000000",
    DAIAddr,
    WBTCAddr,
    fluctuationLimitRatio,
    tollRatio,
    spreadRatio);

  // await writeAbis(Amm, 'Amm:BTC-DAI', network);


  const quoteAssetReserve = toDec("61.7", 18);  
  const baseAssetReserve  = web3.utils.toWei("0.001") // 

  const dai =  await MockToken.at(DAIAddr);
  await amm.setOpen(true);

  await dai.approve(amm.address, toDec("123.4", 18));
  await amm.initLiquidity(accounts[0], quoteAssetReserve , baseAssetReserve);


  await writeAbis(Amm, 'Amm:BTC-DAI', network);

  const initMarginRatio = web3.utils.toWei("0.1") // 10% -> 10x
  const maintenanceMarginRatio = web3.utils.toWei("0.0625") // 6.25% -> 16x
  const liquidationFeeRatio = web3.utils.toWei("0.0125")    // 1.25%
  
  let house = await deployer.deploy(ClearingHouse, 
      amm.address, 
      "0x0000000000000000000000000000000000000000",
      initMarginRatio , maintenanceMarginRatio, liquidationFeeRatio
      );

  await writeAbis(ClearingHouse, 'ClearingHouse:BTC-DAI', network);
  await amm.setCounterParty(house.address);

  console.log(accounts[0])

}