var Amm = artifacts.require("Amm");

const {
  advanceTime,
  advanceBlock
}  = require('./delay')

const { totalSupply, transfer, balanceOf, approve } = require('./token')
const { openPosition, getPosition, closePosition, addMargin, liquidate, removeMargin, getMarginRatio, payFunding } = require('./clearhouse')
const {
  getUnderlyingPrice,
  getLongShortSize,
  getSpotPrice,
  getSettlementPrice,
  getTwapPrice,
  isInFusing,
  getReserve,
  getInputTwap,
  getOutputTwap,
  getInputPrice,
  getOutputPrice
} = require('./amm')

const network = 'testbsc'
const ADD_TO_AMM = 0;
const REMOVE_FROM_AMM = 1;

module.exports = async function(callback) {

  try {
    var accounts = await web3.eth.getAccounts()

    let USDT = require(`../front/abis/USDT.${network}.json`);
    console.log("USDT addr:" + USDT.address)


    let ETHUSDCPair = require(`../front/abis/Amm:ETH-USDT.${network}.json`);
    var ETHUSDCAmm = await Amm.at(ETHUSDCPair.address);

    const tradeLimitRatio = web3.utils.toWei("0.1")
    

    await ETHUSDCAmm.setTradeLimitRatio({
      d: tradeLimitRatio
    });


    const lt = await ETHUSDCAmm.getTradeLimitRatio();
    console.log("lt:", lt);

  } catch (e) {
    console.log("init contract error", e)
  }


}

