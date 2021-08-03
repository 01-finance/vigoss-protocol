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
  
  await transfer(usdcMock, accounts[0], accounts[1], web3.utils.toWei("10000"));

  await approve(usdcMock, accounts[1], ETHUSDCAmm.address, web3.utils.toWei("10000"));
  await addLiquidity(ETHUSDCAmm, accounts[1], web3.utils.toWei("10000"));
  
  await balanceOf(usdcMock, accounts[1], web3, " user1 ");
  await getSpotPrice(ETHUSDCAmm, web3);
  await totalLiquidity(ETHUSDCAmm, web3)

  await shares(ETHUSDCAmm, accounts[1], web3)
  await liquidityStakes(ETHUSDCAmm, accounts[1], web3)
  await getSpotPrice(ETHUSDCAmm, web3);
  await getReserve(ETHUSDCAmm, web3);

  await transfer(usdcMock, accounts[0], accounts[1], web3.utils.toWei("11000"));
  await approve(usdcMock, accounts[1], house.address, web3.utils.toWei("11000"));

  console.log(" openPosition  ");
  await openPosition(house, 
    ETHUSDCAmm.address, 
    0,   // buy short 
    web3.utils.toWei("10000"),  // 100 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("0"),  //minBaseamount( for slippage)
    accounts[1],
    web3
  )

  await transfer(usdcMock, accounts[0], accounts[2], web3.utils.toWei("11000"));
  await approve(usdcMock, accounts[2], house.address, web3.utils.toWei("11000"));

  console.log(" openPosition  ");
  await openPosition(house, 
    ETHUSDCAmm.address, 
    0,   // buy long 
    web3.utils.toWei("10000"),  // 100 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("0"),  //minBaseamount( for slippage)
    accounts[2],
    web3
  )

  await getSpotPrice(ETHUSDCAmm, web3);
  await getReserve(ETHUSDCAmm, web3);
  await balanceOf(usdcMock, accounts[1], web3, " user1 ");

  console.log(" removeLiquidity  ");
  var liqAmount = "353553390593273762200"
  await removeLiquidity(ETHUSDCAmm, accounts[1], liqAmount);

  await balanceOf(usdcMock, accounts[1], web3, " user1 ");

  await totalLiquidity(ETHUSDCAmm, web3)

  await shares(ETHUSDCAmm, accounts[1], web3)
  await liquidityStakes(ETHUSDCAmm, accounts[1], web3)
  await getSpotPrice(ETHUSDCAmm, web3);
  await getReserve(ETHUSDCAmm, web3);

}


