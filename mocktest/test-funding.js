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
const { openPosition, getPosition, closePosition, addMargin, liquidate, removeMargin, payFunding, getLatestCumulativePremiumFraction } = require('./clearhouse')
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


  console.log("\n  ===  user0 openPosition  === \n");

  await openPosition(house, 
    ETHUSDCAmm.address, 
    0,   // buy long 
    web3.utils.toWei("2000"),  // 2000 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("0"),  // minBaseamount( for slippage)
    accounts[0],
    web3
  )
  await balanceOf(usdcMock, fund.address, web3, " fund ");
  await balanceOf(usdcMock, house.address, web3, " house ");
  let user0Size = await getPosition(house, ETHUSDCAmm.address, accounts[0], web3 )
  await getSpotPrice(ETHUSDCAmm, web3);

  console.log("\n  ===  delay 10 min === \n");
  // delay 10 mins.
  let min10 = 60 * 10;
  await advanceTime(web3, min10)

  console.log("\n  ===  setPrice === \n");
  
  try {
    await feed.setPrice(ethMock.address, web3.utils.toWei("190"));
    await getUnderlyingPrice(ETHUSDCAmm, web3);
  } catch (e) {
    console.log("Price err:", e);
  }

  console.log("\n  ===  user1 short openPosition  === \n");
  await transfer(usdcMock, accounts[0], accounts[1], web3.utils.toWei("11000"));
  await approve(usdcMock, accounts[1], house.address, web3.utils.toWei("11000"));

  console.log("\n  ===  delay 10 min === \n");
  await advanceTime(web3, min10)

  await openPosition(house, 
    ETHUSDCAmm.address, 
    1,   // buy short 
    web3.utils.toWei("1000"),  // 1000 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("1000"),  //minBaseamount( for slippage)
    accounts[1],
    web3
  )
  await balanceOf(usdcMock, house.address, web3, " house ");
  await balanceOf(usdcMock, fund.address, web3, " fund ");

  await getLatestCumulativePremiumFraction(house, ETHUSDCAmm.address, web3)
  await getPosition(house, ETHUSDCAmm.address, accounts[1], web3 )

  console.log("\n  ===  delay 10 min === \n");
  await advanceTime(web3, min10 * 3 + 60)

  console.log("\n  ===  payFunding === \n");
  await payFunding(house, ETHUSDCAmm.address, accounts[0]);

  await balanceOf(usdcMock, house.address, web3, " house ");
  await balanceOf(usdcMock, fund.address, web3, " fund ");
  await getLatestCumulativePremiumFraction(house, ETHUSDCAmm.address, web3)

  console.log("\n  ===  user0 Position  === \n");
  await getPosition(house, ETHUSDCAmm.address, accounts[0], web3 )
  console.log("\n  ===  user1 Position  === \n");
  await getPosition(house, ETHUSDCAmm.address, accounts[1], web3 )



  console.log("\n  ===  user2 short openPosition  === \n");
  await transfer(usdcMock, accounts[0], accounts[2], web3.utils.toWei("11000"));
  await approve(usdcMock, accounts[2], house.address, web3.utils.toWei("11000"));

  await openPosition(house, 
    ETHUSDCAmm.address, 
    1,   // buy short 
    web3.utils.toWei("1000"),  // 1000 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("1000"),  //minBaseamount( for slippage)
    accounts[2],
    web3
  )

  await balanceOf(usdcMock, house.address, web3, " house ");
  await balanceOf(usdcMock, fund.address, web3, " fund ");
  await getLatestCumulativePremiumFraction(house, ETHUSDCAmm.address, web3)

  console.log("\n  ===  user0 Position  === \n");
  await getPosition(house, ETHUSDCAmm.address, accounts[0], web3 )

  console.log("\n  ===  user1 Position  === \n");
  await getPosition(house, ETHUSDCAmm.address, accounts[1], web3 )

  console.log("\n  ===  user2 Position  === \n");
  await getPosition(house, ETHUSDCAmm.address, accounts[2], web3 )

  // let b1 = await balanceOf(usdcMock, accounts[0], web3, "close before ");
  // // await closePosition(house, ETHUSDCAmm.address, "0", accounts[0])
    
  // let b2 = await balanceOf(usdcMock, accounts[0], web3, "after before ");
  // try {
  //   console.log("balance added ", web3.utils.fromWei((b2 - b1).toString()))
  // } catch (e) {
  //   console.log("b :", e);
  // }

}