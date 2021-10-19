
const VigossReader = artifacts.require("VigossReader");

const { writeAbis } = require('./log');

module.exports = async function(deployer, network, accounts) {


  await deployer.deploy(VigossReader, 
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000");

    await writeAbis(VigossReader, 'VigossReader', network);

}