const SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");


module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(SimpleUSDPriceFeed, accounts[0]);
}