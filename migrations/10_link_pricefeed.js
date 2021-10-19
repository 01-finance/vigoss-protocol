const USDLinkOracle = artifacts.require("USDLinkOracle");
const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  let feed = await deployer.deploy(USDLinkOracle, accounts[0]);
  await writeAbis(USDLinkOracle, 'USDLinkOracle', network);

  let ETHADDR = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";
  let BTCADDR = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
  
  await feed.setAggregator(ETHADDR, "0xF9680D99D6C9589e2a93a78A04A279e509205945");
  console.log("WBTC setAggregator")
  await feed.setAggregator(BTCADDR, "0xc907E116054Ad103354f2D350FD2514433D57F6f");
  console.log("WETH setAggregator")
}