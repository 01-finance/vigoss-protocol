const { advanceTime, advanceBlock  } = require('./delay.js');

var SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");
var USDLinkOracle = artifacts.require("USDLinkOracle");
var MockToken = artifacts.require("MockToken");

var accounts;
var feed;
var sfeed;
var ethMock


// for Test getTwapPrice
module.exports = async function(callback) {
  try {
    accounts = await web3.eth.getAccounts()
    let FEED = require(`../front/abis/USDLinkOracle.testbsc.json`);
    feed = await USDLinkOracle.at(FEED.address)

    let SFEED = require(`../front/abis/SimpleUSDPriceFeed.testbsc.json`);
    sfeed = await SimpleUSDPriceFeed.at(SFEED.address)

    console.log("feed Addr:" + feed.address)

    let WETH = require(`../front/abis/WETH.testbsc.json`);
    console.log("WETH Address:" + WETH.address);

    let WBTC = require(`../front/abis/WBTC.testbsc.json`);

    console.log("WBTC Address:" + WBTC.address);
    


    ethMock = await MockToken.at(WETH.address)

      await feed.setAggregator(WBTC.address, "0x5741306c21795FdCBb9b265Ea0255F499DFe515C");
      console.log("WBTC setAggregator")
  
      await feed.setAggregator("0x2F86253CB6670dbc5f8ED53a483e9f3A38b049D9", "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7");
      console.log("WETH setAggregator")

  } catch (e) {
    console.log(e)
  }



  try {


    let a = await feed.aggregators("0x2F86253CB6670dbc5f8ED53a483e9f3A38b049D9");
    console.log("p:" + a);


    const sprice = await sfeed.getPrice("0x2F86253CB6670dbc5f8ED53a483e9f3A38b049D9");
    
    console.log("sprice:" + sprice);

    const linkprice = await feed.getPrice("0x2F86253CB6670dbc5f8ED53a483e9f3A38b049D9");
    
    console.log("linkprice:" + linkprice);

    // let day = 86400;

    // console.log("advanceTime")

    // setPrice(address token, uint256 priceMan)

  } catch (e) {
    console.log(e)
  }

}


// BTC / USD	8	0x5741306c21795FdCBb9b265Ea0255F499DFe515C
// ETH / USD	8	0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7
