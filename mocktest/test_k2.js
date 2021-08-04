/**
 * 1. 加入流动性
 * 2. 退出流动性
 */


var MockToken = artifacts.require("MockToken");
var Amm = artifacts.require("Amm");
var ClearingHouse = artifacts.require("ClearingHouse");
var InsuranceFund = artifacts.require("InsuranceFund");
var SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");


const { totalSupply, transfer, balanceOf, approve } = require('./token')
const { openPosition, getPosition, closePosition, addMargin, liquidate, removeMargin, getMarginRatio, payFunding } = require('./clearhouse')
const {
  getUnderlyingPrice,
  getUnderlyingTwapPrice,
  getSpotPrice,
  getSettlementPrice,
  getTwapPrice,
  getReserve,
  isInFusing,
  getInputTwap,
  getOutputTwap,
  getLongShortSize,
  getInputPrice,
  getOutputPrice,
  getLongApportionFraction,
  getShortApportionFraction,
  initLiquidity,
  addLiquidity,
  removeLiquidity,
  totalLiquidity,
  shares,
  liquidityStakes
} = require('./amm')

const network = 'hardhat'

module.exports = async function(callback) {

  try {
    var accounts = await web3.eth.getAccounts()
    var house = await ClearingHouse.deployed();
    var fund = await InsuranceFund.deployed();
    var feed = await SimpleUSDPriceFeed.deployed();

    let USDC = require(`../front/abis/USDC.${network}.json`);
    console.log("USDC addr:" + USDC.address)

    var usdcMock = await MockToken.at(USDC.address)
    let ETHUSDCPair = require(`../front/abis/Amm:ETH-USDC.${network}.json`);
    var ETHUSDCAmm = await Amm.at(ETHUSDCPair.address);
  } catch (e) {
    console.log("init contract error", e)
  }

  await getSpotPrice(ETHUSDCAmm, web3);
  await totalLiquidity(ETHUSDCAmm, web3)

  await shares(ETHUSDCAmm, accounts[0], web3)
  await liquidityStakes(ETHUSDCAmm, accounts[0], web3)
  
  console.log(" removeLiquidity  ");
  var liqAmount = "282842712474619009760337"
  await removeLiquidity(ETHUSDCAmm, accounts[0], liqAmount);

  await balanceOf(usdcMock, accounts[0], web3, " user0 ");

  await totalLiquidity(ETHUSDCAmm, web3)

  await shares(ETHUSDCAmm, accounts[0], web3)
  await liquidityStakes(ETHUSDCAmm, accounts[0], web3)
  await getSpotPrice(ETHUSDCAmm, web3);
  await getReserve(ETHUSDCAmm, web3);

}


