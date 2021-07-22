var MockToken = artifacts.require("MockToken");
var VigossToken = artifacts.require("VigossToken");
var VGSDistributer = artifacts.require("VGSDistributer");

const network = 'hardhat'

module.exports = async function(callback) {

  try {
    var accounts = await web3.eth.getAccounts()
    var VGS = await VigossToken.deployed();
    var Distributer = await VGSDistributer.deployed();

    // require(`../front/abis/VigossToken.${network}.json`);
    // console.log("VigossToken addr:" + VigossToken.address)

    // var usdcMock = await MockToken.at(USDC.address)

    await Distributer.setClearingHouse(accounts[0], true);

  } catch (e) {
    console.log("init contract error", e)
  }

  // await transfer(VGS, accounts[0], Distributer.address, web3.utils.toWei("41600000"));


  let days90 = 7776000  ;// 86400*90;


  let startTsS = await Distributer.startTimeStamp();
  let startTs = parseInt(startTsS.toString());

  console.log("startTs:", startTs)

  let multi = await Distributer.getMultiplier(startTs, startTs + 100);
  console.log("multi:", multi.toString())


  multi = await Distributer.getMultiplier(startTs + days90 - 1, startTs + days90 + days90 + 2);
  console.log("crost season multi:", multi.toString())


  let years4 = 126144000;

  multi = await Distributer.getMultiplier(startTs + years4, startTs + years4 + 100);
  console.log("after 4 years later  multi:", multi.toString())

  // await Distributer.pendingVgs

}