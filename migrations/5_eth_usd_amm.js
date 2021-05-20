const Amm = artifacts.require("Amm");
const SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");
const MockETHToken = artifacts.require("MockETHToken");
const MockUSDCToken = artifacts.require("MockUSDCToken");

module.exports = async function(deployer, network, accounts) {
  const feed = await  SimpleUSDPriceFeed.deployed();
  const ethMock = await MockETHToken.deployed();
  const usdcMock = await MockUSDCToken.deployed();

  const quoteAssetReserve = web3.utils.toWei("4000000") // 
  const baseAssetReserve =  web3.utils.toWei("20000") // 
  const tradeLimitRatio = web3.utils.toWei("0.9")    // 1.25%
  const fundingPeriod = 3600   // 1 hour
  const fluctuationLimitRatio = web3.utils.toWei("0.012") // 1.2%
  const tollRatio = web3.utils.toWei("0");
  const spreadRatio = web3.utils.toWei("0.001"); // 0.001%

  await deployer.deploy(Amm, 
    quoteAssetReserve ,
    baseAssetReserve, 
    tradeLimitRatio,
    fundingPeriod,
    feed.address,
    usdcMock.address,
    ethMock.address,
    fluctuationLimitRatio,
    tollRatio,
    spreadRatio);
}