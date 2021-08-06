/**
 * 1. 测试流动性提供者 VGS 产出
 */


var MockToken = artifacts.require("MockToken");
var Amm = artifacts.require("Amm");
var ClearingHouse = artifacts.require("ClearingHouse");
var InsuranceFund = artifacts.require("InsuranceFund");
var SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");
var VGSForLP = artifacts.require("VGSForLP");
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

async function vgsInfo(user) {
 try {
    let info = await Distributer.userInfos(1, user);
    console.log("lp amount:", info.amount.toString());

    let pendingVgs = await Distributer.pendingVgs(ETHUSDCAmm.address, user)
    console.log("pendingVgs:", web3.utils.fromWei(pendingVgs.toString()));

    // let allpendingVgs = await Distributer.allPendingVgs(user)
    // console.log("all pendingVgs:", allpendingVgs.toString());

    await balanceOf(vgs, user, web3, " user vgs ");
 } catch (e) {
    console.log("vgsInfo error", e)
  }


}


var Distributer;
var ETHUSDCAmm;
var vgs;

module.exports = async function(callback) {

  try {
    var accounts = await web3.eth.getAccounts()
    var house = await ClearingHouse.deployed();
    var feed = await SimpleUSDPriceFeed.deployed();
    vgs = await VigossToken.deployed();

    let USDC = require(`../front/abis/USDC.${network}.json`);
    console.log("USDC addr:" + USDC.address)

    var usdcMock = await MockToken.at(USDC.address)
    let ETHUSDCPair = require(`../front/abis/Amm:ETH-USDC.${network}.json`);
    ETHUSDCAmm = await Amm.at(ETHUSDCPair.address);

    Distributer = await VGSForLP.deployed();

    await transfer(vgs, accounts[0], Distributer.address, web3.utils.toWei("41600000"));
  } catch (e) {
    console.log("init contract error", e)
  }

  await getSpotPrice(ETHUSDCAmm, web3);
  await totalLiquidity(ETHUSDCAmm, web3)

  await shares(ETHUSDCAmm, accounts[0], web3)
  await liquidityStakes(ETHUSDCAmm, accounts[0], web3)

  await  vgsInfo(accounts[0]);

  
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

  await  vgsInfo(accounts[1]);

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

  await vgsInfo(accounts[1]);


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

  await vgsInfo(accounts[1]);

  await balanceOf(usdcMock, accounts[1], web3, " user1 ");

  await totalLiquidity(ETHUSDCAmm, web3)

  await shares(ETHUSDCAmm, accounts[1], web3)
  await liquidityStakes(ETHUSDCAmm, accounts[1], web3)
  await getSpotPrice(ETHUSDCAmm, web3);
  await getReserve(ETHUSDCAmm, web3);


  console.log(" removeLiquidity 2222 ");
  var liqAmount = "282842712474619009760337"
  await removeLiquidity(ETHUSDCAmm, accounts[0], liqAmount);

  await balanceOf(usdcMock, accounts[0], web3, " user0 ");

  await totalLiquidity(ETHUSDCAmm, web3)
  await getReserve(ETHUSDCAmm, web3);

  await getReserve(ETHUSDCAmm, web3);


}


