var MockToken = artifacts.require("MockToken");
var VigossToken = artifacts.require("VigossToken");
var VGSForMargin = artifacts.require("VGSForMargin");

const network = 'hardhat'

module.exports = async function(callback) {

  try {
    var accounts = await web3.eth.getAccounts()
    var VGS = await VigossToken.deployed();
    var Distributer = await VGSForMargin.deployed();

    await Distributer.setClearingHouse(accounts[0], true);

    // 18;
    let USDC = require(`../front/abis/USDC.${network}.json`);
    console.log("USDC addr:" + USDC.address)

    let USDT = require(`../front/abis/USDT.${network}.json`);
    console.log("USDT addr:" + USDC.address)

  } catch (e) {
    console.log("init contract error", e)
  }

  // await transfer(VGS, accounts[0], Distributer.address, web3.utils.toWei("41600000"));


  // await Distributer.addMargin(USDC.address, web3.utils.toWei("1"), accounts[0]);

  // let info = await Distributer.userInfo(accounts[0]);
  // console.log("amount:", info.amount.toString());

  // let pendingVgs = await Distributer.pendingVgs()
  // console.log("pendingVgs:", pendingVgs.toString());
  
  // await Distributer.addMargin(USDC.address, "100000000", accounts[0]);
  // info = await Distributer.userInfo(accounts[0]);
  // console.log("amount:", info.amount.toString());

  // pendingVgs = await Distributer.pendingVgs()
  // console.log("pendingVgs:", pendingVgs.toString());


  let b = await VGS.balanceOf(accounts[1]);

  console.log("b:", b.toString());

  b = await VGS.balanceOf(accounts[2]);

  console.log("b:", b.toString());

}