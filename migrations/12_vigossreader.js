
const VigossReader = artifacts.require("VigossReader");

const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {

  let vgsForMargin = require(`../front/abis/VGSForMargin.${network}.json`);
  let vgsForLP = require(`../front/abis/VGSForLP.${network}.json`);


  await deployer.deploy(VigossReader, 
    vgsForLP.address,
    vgsForMargin.address);

    await writeAbis(VigossReader, 'VigossReader', network);

}