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
    let FEED = require(`../front/abis/SimpleUSDPriceFeed.testbsc.json`);
    feed = await SimpleUSDPriceFeed.at(FEED.address)

    console.log("feed Addr:" + feed.address)

    let WETH = require(`../front/abis/WETH.testbsc.json`);
    console.log("WETH Address:" + WETH.address);

    let WBTC = require(`../front/abis/WBTC.testbsc.json`);

    console.log("WBTC Address:" + WBTC.address);
    


    ethMock = await MockToken.at(WETH.address)

  } catch (e) {
    console.log(e)
  }

  // try {
  //   await feed.approveFeeder("0xd830C50dbfa92B296C55Ef30AD3B0C6F7f344aec");
  //   console.log("approveFeeder")
  //   // await delay(10);
  // } catch (e) {
  //   console.log(e)
  // }
    
  // const fe = await feed.feeders("0xd830C50dbfa92B296C55Ef30AD3B0C6F7f344aec")
  // console.log("fe:" + fe);

  // await feed.setPrice(ethMock.address, web3.utils.toWei("220"));
  // await delay(10);
  const twapPrice = await feed.getPrice(ethMock.address);
  
  console.log("twapPrice:" + web3.utils.fromWei(twapPrice));

  // let day = 86400;

  // console.log("advanceTime")

  // setPrice(address token, uint256 priceMan)


}
