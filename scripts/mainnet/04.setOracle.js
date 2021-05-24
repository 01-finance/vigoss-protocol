const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;

    // await deploy.deplowUseProxy("LinkOracle", { from: deployer }, [], false)


    var oracle = deploy.loadContract("LinkOracle")

    // await deploy.deplowUseProxy("FluxSwapOracleAggregator", { from: deployer }, [], false)

    var fluxPriceOracle = deploy.loadContract("FluxSwapOracleAggregator");
    console.log((await fluxPriceOracle.getUSDPrice()).toString() / 1e8);

    var flux = deploy.loadContract("cFLUX").address;
    // 设置Oracle源
    // await deploy.send(oracle.setAggregator(flux, fluxPriceOracle.address), { from: deployer })
    var price = await oracle.getPriceMan(flux);
    console.log("Price:", price.toString() / 1e18)


    var searchProvider = deploy.loadContract("SearchProvider")
    await deploy.send(searchProvider.changeOracle(oracle.address), { from: admin })
}

main()