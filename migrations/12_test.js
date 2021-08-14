const Greeter = artifacts.require("Greeter");

const { writeAbis } = require('./log');

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Greeter);

  await writeAbis(Greeter, 'Greeter', network);
};

