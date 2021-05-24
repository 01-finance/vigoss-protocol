const user_operation = require('conflux-crosschain');
const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;


    await setTaxRate();
}


async function setTaxRate() {

    var fluxApp = deploy.loadContract("FluxApp");

    // await deploy.waitTx(await fluxApp.connect(admin).setConfig("MKT_BORROW_INTEREST_TAX_RATE", (0.1 * 1e18).toString()));

    var mktImpl = deploy.loadContract("erc777MarketImpl");
    for (var pool of deploy.loadMarkets()) {

        var mkt = mktImpl
        mkt.address = pool.address;

        var result = await fluxApp.markets(pool.address)


        if (result.collRatioMan.toString() / 1e18 <= 1.3) {
            var symbol = await mkt.symbol();
            var key = "TAX_RATE_" + symbol;
            if ((await fluxApp.configs(key)) == 0) {
                await deploy.send(fluxApp.setConfig(key, (0.2 * 1e18).toString()), { from: admin });
            } else {
                console.log("skip set ")
            }
        }
        console.log(`${pool.fileName}, collRation:${result.collRatioMan.toString() / 1e18}, taxRate: ${(await mkt.getTaxRate()).toString() / 1e18}, taxBalance: ${await mkt.taxBalance()}`)
    }
}

main()