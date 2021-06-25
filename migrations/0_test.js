const Greeter = artifacts.require("Greeter");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Greeter);
};

