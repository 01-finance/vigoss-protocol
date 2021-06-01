/**
 * 1. user0 下多单
 * 2. user1 下空单
 * 3. 设置Order价格
 * 4. 调用 payFunding
 * 5. 查看单
 * 6. 撤单（与没有payFunding对比）
 */

var ClearingHouse = artifacts.require("ClearingHouse");
var MockToken = artifacts.require("MockToken");
var Amm = artifacts.require("Amm");
var InsuranceFund = artifacts.require("InsuranceFund");
var SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");

const {
  advanceTime,
  advanceBlock
}  = require('./delay')

const { totalSupply, transfer, balanceOf, approve } = require('./token')
const { openPosition, getPosition, closePosition, addMargin, liquidate, removeMargin, payFunding } = require('./clearhouse')
const {
  getUnderlyingPrice,
  getUnderlyingTwapPrice,
  getSpotPrice,
  getSettlementPrice,
  getTwapPrice,
  getReserve,
  getInputTwap,
  getOutputTwap,
  getInputPrice,
  getOutputPrice
} = require('./amm')

const network = 'hardhat'
const ADD_TO_AMM = 0;
const REMOVE_FROM_AMM = 1;

module.exports = async function(callback) {

  try {
    var accounts = await web3.eth.getAccounts()
    var house = await ClearingHouse.deployed();
    var fund = await InsuranceFund.deployed();
    var feed = await SimpleUSDPriceFeed.deployed();

    let USDC = require(`../front/abis/USDC.${network}.json`);
    console.log("USDC addr:" + USDC.address)

    var usdcMock = await MockToken.at(USDC.address)

    let WETH = require(`../front/abis/WETH.hardhat.json`);

    var ethMock = await MockToken.at(WETH.address)

    let ETHUSDCPair = require(`../front/abis/Amm:ETH-USDC.${network}.json`);
    var ETHUSDCAmm = await Amm.at(ETHUSDCPair.address);
  } catch (e) {
    console.log("init contract error", e)
  }

  await approve(usdcMock, accounts[0], house.address, web3.utils.toWei("10000"));
  await feed.setPrice(ethMock.address, web3.utils.toWei("200"));
  await getUnderlyingPrice(ETHUSDCAmm, web3);

  await balanceOf(usdcMock, fund.address, web3, " fund ");
  await balanceOf(usdcMock, house.address, web3, " house ");



  let b1 = await balanceOf(usdcMock, accounts[0], web3, "user0 close before ");
  await closePosition(house, ETHUSDCAmm.address, "0", accounts[0])
    
  let b2 = await balanceOf(usdcMock, accounts[0], web3, "user0 after before ");
  
  // 有 payFunding  可退 1981.1339 
  // 无 payFunding  可退 1988.0239 


  b1 = await balanceOf(usdcMock, accounts[2], web3, "user2 close before ");
  await closePosition(house, ETHUSDCAmm.address, "0", accounts[2])
    
  b2 = await balanceOf(usdcMock, accounts[2], web3, "user2 after before ");
  // 有 payFunding 可退 1001.995
  // 无 payFunding 1001.995010976549397

}