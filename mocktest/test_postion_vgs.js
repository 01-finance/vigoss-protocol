/**
 * 1. 加入流动性
 * 2. 退出流动性
 */


var MockToken = artifacts.require("MockToken");
var Amm = artifacts.require("Amm");
var ClearingHouse = artifacts.require("ClearingHouse");
var InsuranceFund = artifacts.require("InsuranceFund");
var SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");
var VGSForMargin = artifacts.require("VGSForMargin");
const VigossToken = artifacts.require("VigossToken");

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
    var feed = await SimpleUSDPriceFeed.deployed();
    var vgs = await VigossToken.deployed();

    let USDC = require(`../front/abis/USDC.${network}.json`);
    console.log("USDC addr:" + USDC.address)

    var usdcMock = await MockToken.at(USDC.address)
    let ETHUSDCPair = require(`../front/abis/Amm:ETH-USDC.${network}.json`);
    var ETHUSDCAmm = await Amm.at(ETHUSDCPair.address);

    var Distributer = await VGSForMargin.deployed();

    await transfer(vgs, accounts[0], Distributer.address, web3.utils.toWei("41600000"));
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

  // for(let i=0; i<10; i++) {
  //   await advanceBlock(web3);
  // }

  let info = await Distributer.userInfo(accounts[1]);
  console.log("margin amount:", info.amount.toString());

  let pendingVgs = await Distributer.pendingVgs(accounts[1])
  console.log("pendingVgs:", pendingVgs.toString());


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

  info = await Distributer.userInfo(accounts[2]);
  console.log("margin amount:", info.amount.toString());

  // for(let i=0; i<10; i++) {
  //   await advanceBlock(web3);
  // }

  pendingVgs = await Distributer.pendingVgs(accounts[2])
  console.log("pendingVgs:", pendingVgs.toString());

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

  console.log(" closePosition  ");
  await closePosition(house, ETHUSDCAmm.address, "0", accounts[1])

  info = await Distributer.userInfo(accounts[1]);
  console.log("margin amount:", info.amount.toString());

  await balanceOf(vgs, accounts[1], web3, " user1 vgs ");

  pendingVgs = await Distributer.pendingVgs(accounts[1])
  console.log("pendingVgs:", pendingVgs.toString());

  await closePosition(house, ETHUSDCAmm.address, "0", accounts[2])

  info = await Distributer.userInfo(accounts[2]);
  console.log("margin amount:", info.amount.toString());

  await balanceOf(vgs, accounts[2], web3, " user2 vgs ");

  pendingVgs = await Distributer.pendingVgs(accounts[2])
  console.log("pendingVgs:", pendingVgs.toString());

  console.log(" getSpotPrice  ");
  await getSpotPrice(ETHUSDCAmm, web3);
  await getReserve(ETHUSDCAmm, web3);


  console.log(" removeLiquidity  ");
  var liqAmount = "282842712474619009760337"
  await removeLiquidity(ETHUSDCAmm, accounts[0], liqAmount);

  await balanceOf(usdcMock, accounts[0], web3, " user0 ");

  await totalLiquidity(ETHUSDCAmm, web3)
  await getReserve(ETHUSDCAmm, web3);

}


