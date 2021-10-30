const BatchVigoss = artifacts.require("BatchVigoss");

const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {

  // let vgsForMargin = require(`../front/abis/VGSForMargin.${network}.json`);
  // let vgsForLP = require(`../front/abis/VGSForLP.${network}.json`);

  console.log(accounts[0]);
  await deployer.deploy(BatchVigoss);

    await writeAbis(BatchVigoss, 'BatchVigoss', network);

    console.log(accounts[0]);

}