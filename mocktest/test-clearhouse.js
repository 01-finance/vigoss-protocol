var ClearingHouse = artifacts.require("ClearingHouse");
var MockToken = artifacts.require("MockToken");
var Amm = artifacts.require("Amm");


const { totalSupply, transfer, balanceOf, approve } = require('./token')
const { openPosition, getPosition } = require('./clearhouse')

const network = 'hardhat'

module.exports = async function(callback) {

  try {
    var accounts = await web3.eth.getAccounts()
    var house = await ClearingHouse.deployed();
    let USDC = require(`../front/abis/USDC.${network}.json`);
    var usdcMock = await MockToken.at(USDC.address)

    let ETHUSDCPair = require(`../front/abis/Amm:ETH-USDC.${network}.json`);
    var ETHUSDCAmm = await Amm.at(ETHUSDCPair.address);
  } catch (e) {
    console.log("init contract error", e)
  }

  await approve(usdcMock, accounts[0], house.address, web3.utils.toWei("100"));

  await openPosition(house, 
    ETHUSDCAmm.address, 
    0,   // buy long 
    web3.utils.toWei("100"),  // 100 usdc
    web3.utils.toWei("2"),    // 2 leverage
    web3.utils.toWei("0"),  //minBaseamount( for slippage)
    accounts[0],
    web3
  )

  try {
    await getPosition(house, ETHUSDCAmm.address, accounts[0], web3 )
  } catch (e) {
    console.log("getPosition", e)
  }
  

}