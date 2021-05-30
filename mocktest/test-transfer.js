var MockToken = artifacts.require("MockToken");

const network = 'hardhat'

module.exports = async function(callback) {

  try {
    var accounts = await web3.eth.getAccounts()
    let USDC = require(`../front/abis/USDC.${network}.json`);
    console.log("USDC addr:" + USDC.address)

    var usdcMock = await MockToken.at(USDC.address)

  } catch (e) {
    console.log("init contract error", e)
  }

  await transfer(usdcMock, accounts[0], accounts[1], web3.utils.toWei("100000"));

}