const Amm = artifacts.require("Amm");
const USDLinkOracle = artifacts.require("USDLinkOracle");
const ClearingHouse = artifacts.require("ClearingHouse");
const MockToken = artifacts.require("MockToken");

const { writeAbis } = require('./log');

const { toDec } = require('./decUtil');


module.exports = async function(deployer, network, accounts) {
  let FEED = require(`../front/abis/USDLinkOracle.${network}.json`);
  const feed = await  USDLinkOracle.at(FEED.address)

  let DAIAddr = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
  let WETHAddr = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";

  const tradeLimitRatio   = web3.utils.toWei("0.0125")    // default 0.0125 1.25%
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
    WETHAddr,
    fluctuationLimitRatio,
    tollRatio,
    spreadRatio);

  // await writeAbis(Amm, 'Amm:ETH-DAI', network);

  // 流动性价格设置  $3810
  const quoteAssetReserve =  toDec("45.1", 18); //  $38.1
  const baseAssetReserve  =  web3.utils.toWei("0.01") //    0.01 个 ETH

  let dai =  await MockToken.at(DAIAddr);
  await amm.setOpen(true);


  await dai.approve(amm.address, toDec("90.2", 18));   // 单边流动性： $381 的两倍
  await amm.initLiquidity(accounts[0], quoteAssetReserve , baseAssetReserve);

  await writeAbis(Amm, 'Amm:ETH-DAI', network);

  const initMarginRatio = web3.utils.toWei("0.1") // 10% -> 10x
  const maintenanceMarginRatio = web3.utils.toWei("0.0625") // 6.25% -> 16x
  const liquidationFeeRatio = web3.utils.toWei("0.0125")    // 1.25%
  
  let house = await deployer.deploy(ClearingHouse, 
      amm.address, 
      "0x0000000000000000000000000000000000000000",
      initMarginRatio , maintenanceMarginRatio, liquidationFeeRatio
      );

  await writeAbis(ClearingHouse, 'ClearingHouse:ETH-DAI', network);
  await amm.setCounterParty(house.address);

  console.log(accounts[0])

}