var ClearingHouse = artifacts.require("ClearingHouse");
var MockToken = artifacts.require("MockToken");
var Amm = artifacts.require("Amm");


const { totalSupply, transfer, balanceOf, approve } = require('./token')
const { openPosition, getPosition } = require('./clearhouse')
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
    let USDC = require(`../front/abis/USDC.${network}.json`);
    console.log("USDC addr:" + USDC.address)

    var usdcMock = await MockToken.at(USDC.address)

    let ETHUSDCPair = require(`../front/abis/Amm:ETH-USDC.${network}.json`);
    var ETHUSDCAmm = await Amm.at(ETHUSDCPair.address);
  } catch (e) {
    console.log("init contract error", e)
  }

  console.log("\n  ===  user openPosition  === \n");
  await approve(usdcMock, accounts[0], house.address, web3.utils.toWei("500"));

  // getInputPrice 预测数量 min
  await getInputPrice(ETHUSDCAmm, ADD_TO_AMM, web3.utils.toWei("200"), web3)
  // await getInputTwap(ETHUSDCAmm,  ADD_TO_AMM, web3.utils.toWei("200"), web3)


  await openPosition(house, 
    ETHUSDCAmm.address, 
    0,   // buy long 
    web3.utils.toWei("100"),  // 100 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("0"),  //minBaseamount( for slippage)
    accounts[0],
    web3
  )

  await getPosition(house, ETHUSDCAmm.address, accounts[0], web3 )
  
  await getSpotPrice(ETHUSDCAmm, web3);
  

  console.log("\n  ===  user1 openPosition  === \n");
  await transfer(usdcMock, accounts[0], accounts[1], web3.utils.toWei("500"));
  await approve(usdcMock, accounts[1], house.address, web3.utils.toWei("500"));

  await getInputPrice(ETHUSDCAmm, ADD_TO_AMM, web3.utils.toWei("200"), web3)
  // await getInputTwap(ETHUSDCAmm,  ADD_TO_AMM, web3.utils.toWei("200"), web3)

  
  await openPosition(house, 
    ETHUSDCAmm.address, 
    0,   // buy long 
    web3.utils.toWei("100"),  // 100 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("0"),  //minBaseamount( for slippage)
    accounts[1],
    web3
  )

  await getPosition(house, ETHUSDCAmm.address, accounts[1], web3 )

  await getSpotPrice(ETHUSDCAmm, web3);

}