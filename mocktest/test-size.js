var ClearingHouse = artifacts.require("ClearingHouse");
var MockToken = artifacts.require("MockToken");
var Amm = artifacts.require("Amm");


const { totalSupply, transfer, balanceOf, approve } = require('./token')
const { openPosition, getPosition, closePosition, addMargin, liquidate, removeMargin, getUnadjustedPosition, partialLiquidationRatio } = require('./clearhouse')
const {
  getSpotPrice,
  getLongShortSize,
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

  await partialLiquidationRatio(house, web3);

  console.log("\n  ===  user0 openPosition  === \n");
  await approve(usdcMock, accounts[0], house.address, web3.utils.toWei("1000"));

  // getInputPrice 预测数量 min
  await getInputPrice(ETHUSDCAmm, ADD_TO_AMM, web3.utils.toWei("200"), web3)


  await openPosition(house, 
    ETHUSDCAmm.address, 
    0,   // buy long 
    web3.utils.toWei("100"),  // 100 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("0"),  //minBaseamount( for slippage)
    accounts[0],
    web3
  )

  await getUnadjustedPosition(house, ETHUSDCAmm.address, accounts[0], web3 )
  let user0Size = await getPosition(house, ETHUSDCAmm.address, accounts[0], web3 )
  
  await getLongShortSize(ETHUSDCAmm, web3);
  

  console.log("\n  ===  user1 openPosition  === \n");
  await transfer(usdcMock, accounts[0], accounts[1], web3.utils.toWei("11000"));
  await approve(usdcMock, accounts[1], house.address, web3.utils.toWei("11000"));

  await openPosition(house, 
    ETHUSDCAmm.address, 
    0,   // buy long 
    web3.utils.toWei("10000"),  // 100 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("0"),  //minBaseamount( for slippage)
    accounts[1],
    web3
  )

  await getUnadjustedPosition(house, ETHUSDCAmm.address, accounts[1], web3 )
  await getPosition(house, ETHUSDCAmm.address, accounts[1], web3 )
  await getLongShortSize(ETHUSDCAmm, web3);

  console.log("\n  ===  user0 closePosition  === \n");
  console.log("user0Size:" + user0Size);
  

  let b1 = await balanceOf(usdcMock, accounts[0], web3, "close before ");
  await closePosition(house, ETHUSDCAmm.address, "0", accounts[0])
  
  await getUnadjustedPosition(house, ETHUSDCAmm.address, accounts[0], web3 )
  await getLongShortSize(ETHUSDCAmm, web3);
  
  await openPosition(house, 
    ETHUSDCAmm.address, 
    1,   // buy long 
    web3.utils.toWei("100"),  // 100 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("100"),  //minBaseamount( for slippage)
    accounts[1],
    web3
  )

  await getUnadjustedPosition(house, ETHUSDCAmm.address, accounts[1], web3 )
  await getLongShortSize(ETHUSDCAmm, web3);

}