const Amm = artifacts.require("Amm");
const SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");
const InsuranceFund = artifacts.require("InsuranceFund");
const ClearingHouse = artifacts.require("ClearingHouse");

const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  const feed = await  SimpleUSDPriceFeed.deployed();

  let USDC = require(`../front/abis/USDC.${network}.json`);
  let WETH = require(`../front/abis/WETH.${network}.json`);

  const quoteAssetReserve = web3.utils.toWei("4000000") // 
  const baseAssetReserve  =  web3.utils.toWei("20000") // 
  const tradeLimitRatio   = web3.utils.toWei("0.9")    // 1.25%
  const fundingPeriod = 3600   // 1 hour
  
  const fluctuationLimitRatio = web3.utils.toWei("0.8") // default 0.012 1.2%
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

  const house = await ClearingHouse.deployed();
  await amm.setCounterParty(house.address);

  const fund = await InsuranceFund.deployed();
  await fund.addAmm(Amm.address);
}