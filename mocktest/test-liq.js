/**
 * 1. user0 下多单
 * 2. user1 下足够多空单
 * 3. 触发多单清算
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
const { openPosition, getPosition, closePosition, addMargin, liquidate, removeMargin, getMarginRatio, payFunding } = require('./clearhouse')
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

    let WETH = require(`../front/abis/WETH.${network}.json`);

    var ethMock = await MockToken.at(WETH.address)

    let ETHUSDCPair = require(`../front/abis/Amm:ETH-USDC.${network}.json`);
    var ETHUSDCAmm = await Amm.at(ETHUSDCPair.address);
  } catch (e) {
    console.log("init contract error", e)
  }

  await getSpotPrice(ETHUSDCAmm, web3);
  await approve(usdcMock, accounts[0], house.address, web3.utils.toWei("1000000000"));
  await feed.setPrice(ethMock.address, web3.utils.toWei("200"));
  await getUnderlyingPrice(ETHUSDCAmm, web3);

  await balanceOf(usdcMock, fund.address, web3, " fund ");
  await balanceOf(usdcMock, house.address, web3, " house ");

  await transfer(usdcMock, accounts[0], accounts[2], web3.utils.toWei("11000"));
  await balanceOf(usdcMock, accounts[2], web3, " user2 ");
  await approve(usdcMock, accounts[2], house.address, web3.utils.toWei("10000"));

  console.log("\n  ===  user2 做多 === \n");
  await openPosition(house,
    ETHUSDCAmm.address,
    0,   // buy long 
    web3.utils.toWei("1000"),  // 1000 usdc
    web3.utils.toWei("6"),     // 5 leverage
    web3.utils.toWei("0"),     // minBaseamount( for slippage)
    accounts[2],
    web3
  )

  await getPosition(house, ETHUSDCAmm.address, accounts[2], web3 )
  await getSpotPrice(ETHUSDCAmm, web3);
  await getMarginRatio(house, ETHUSDCAmm.address, accounts[2], web3 )

  console.log("\n  ===  set price 180 === \n");
  await feed.setPrice(ethMock.address, web3.utils.toWei("180"));
  

  console.log("\n  ===  user 0 short1 === \n");
  await openPosition(house, 
    ETHUSDCAmm.address, 
    1,   // short 
    web3.utils.toWei("100000"),  // 1000 usdc
    web3.utils.toWei("2"),    // 5 leverage
    web3.utils.toWei("100000"),  //minBaseamount( for slippage)
    accounts[0],
    web3
  )

  await getSpotPrice(ETHUSDCAmm, web3);
  await getMarginRatio(house, ETHUSDCAmm.address, accounts[2], web3 )

  console.log("\n  ===  delay 10 min === \n");
  // delay 10 mins.
  let min10 = 60 * 10;
  await advanceTime(web3, min10)

  console.log("\n  ===  set price 160 === \n");
  await feed.setPrice(ethMock.address, web3.utils.toWei("160"));

  console.log("\n  ===  user 0 short2 === \n");
  await openPosition(house, 
    ETHUSDCAmm.address, 
    1,   // short 
    web3.utils.toWei("100000"),  // 1000 usdc
    web3.utils.toWei("2"),    // 5 leverage
    web3.utils.toWei("100000"),  //minBaseamount( for slippage)
    accounts[0],
    web3
  )
  
  await getSpotPrice(ETHUSDCAmm, web3);   // 162
  await getMarginRatio(house, ETHUSDCAmm.address, accounts[2], web3 )

  console.log("\n  ===  delay 10 min === \n");
  // delay 10 mins.
  await advanceTime(web3, min10)
  console.log("\n  ===  set price 150 === \n");
  await feed.setPrice(ethMock.address, web3.utils.toWei("150"));
  
  await getPosition(house, ETHUSDCAmm.address, accounts[0], web3 )
  await getSpotPrice(ETHUSDCAmm, web3);
  await getMarginRatio(house, ETHUSDCAmm.address, accounts[2], web3 )  // 0.16


  await liquidate(house, ETHUSDCAmm.address, accounts[2], accounts[0])
  await getSpotPrice(ETHUSDCAmm, web3);

}

