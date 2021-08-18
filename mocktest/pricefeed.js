const { advanceTime, advanceBlock  } = require('./delay.js');

var SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");
var MockToken = artifacts.require("MockToken");

var accounts;
var feed;
var ethMock

async function delay(time) {
  await advanceTime(web3, time);
  await advanceBlock(web3);
}

// for Test getTwapPrice
module.exports = async function(callback) {
  try {
    accounts = await web3.eth.getAccounts()
    feed = await SimpleUSDPriceFeed.deployed()

    let WETH = require(`../front/abis/WETH.testmatic.json`);

    ethMock = await MockToken.at(WETH.address)

  } catch (e) {
    console.log(e)
  }

  try {
    await feed.setPrice(ethMock.address, "3089000000");
    // await delay(10);
  } catch (e) {
    console.log(e)
  }
    
  const currPrice = await feed.getPrice(ethMock.address)
  console.log("currPrice:" + web3.utils.fromWei(currPrice));

  // await feed.setPrice(ethMock.address, web3.utils.toWei("220"));
  // await delay(10);
  // const twapPrice = await feed.getTwapPrice(ethMock.address, 11);
  
  // console.log("twapPrice:" + web3.utils.fromWei(twapPrice));

  // let day = 86400;

  // console.log("advanceTime")

  // setPrice(address token, uint256 priceMan)


}