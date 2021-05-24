const SimpleUSDPriceFeed = artifacts.require("SimpleUSDPriceFeed");
const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(SimpleUSDPriceFeed, accounts[0]);
  await writeAbis(SimpleUSDPriceFeed, 'SimpleUSDPriceFeed', network);
}