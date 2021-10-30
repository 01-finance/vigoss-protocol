
const VigossReader = artifacts.require("VigossReader");

const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {

  let vgsForMargin = require(`../front/abis/VGSForMargin.${network}.json`);
  let vgsForLP = require(`../front/abis/VGSForLP.${network}.json`);

  // let vgsForMargin = "0x0000000000000000000000000000000000000000";
  // let vgsForLP ="0x0000000000000000000000000000000000000000";



  await deployer.deploy(VigossReader, 
    // vgsForLP.address,
    // vgsForMargin.address
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000"
    );

    await writeAbis(VigossReader, 'VigossReader', network);

}