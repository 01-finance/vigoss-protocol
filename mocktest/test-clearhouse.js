var ClearingHouse = artifacts.require("ClearingHouse");
var MockToken = artifacts.require("MockToken");
var Amm = artifacts.require("Amm");


const { totalSupply, transfer, balanceOf, approve } = require('./token')
const { openPosition, getPosition, closePosition, addMargin, liquidate, removeMargin, getUnadjustedPosition, partialLiquidationRatio } = require('./clearhouse')
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
    let USDC = require(`../front/abis/USDT.${network}.json`);
    console.log("USDC addr:" + USDC.address)

    var usdcMock = await MockToken.at(USDC.address)

    let ETHUSDCPair = require(`../front/abis/Amm:ETH-USDT.${network}.json`);
    var ETHUSDCAmm = await Amm.at(ETHUSDCPair.address);
  } catch (e) {
    console.log("init contract error", e)
  }


  console.log("\n  ===  user0 openPosition  === \n");
  await transfer(usdcMock, accounts[0], accounts[1], "11000000000");
  await approve(usdcMock, accounts[1], house.address, "1100000000");

  // getInputPrice 预测数量 min
  // await getInputPrice(ETHUSDCAmm, ADD_TO_AMM, web3.utils.toWei("200"), web3)

  await balanceOf(usdcMock, accounts[1], web3, "openPosition before ");

  await openPosition(house, 
    ETHUSDCAmm.address, 
    0,   // buy long 
    "1000000000",  // 100 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("0"),  //minBaseamount( for slippage)
    accounts[1],
    web3
  )


  console.log("\n  ===  user1 openPosition  === \n");
  let user0Size = await getPosition(house, ETHUSDCAmm.address, accounts[1], web3 )
  
  await getSpotPrice(ETHUSDCAmm, web3);
  

  console.log("\n  ===  user0 closePosition  === \n");
  console.log("user0Size:" + user0Size);
  
  // TODO: 偏小？
  // await getOutputPrice(ETHUSDCAmm, REMOVE_FROM_AMM, (user0Size / 2).toString(), web3);

  let b1 = await balanceOf(usdcMock, accounts[1], web3, "close before ");
  await closePosition(house, ETHUSDCAmm.address, "0", accounts[1])
    
  let b2 = await balanceOf(usdcMock, accounts[1], web3, "after before ");
  try {
    console.log("balance added ", (b2 - b1).toString())
  } catch (e) {
    console.log("b :", e);
  }

}