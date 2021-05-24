const { Conflux } = require('js-conflux-sdk');
const beforeRun = require('../helpEnv')
async function main() {
    console.log("下面代码将创建新的借贷市场，请小心操作！")
    const { cfx, deployer, admin, deploy } = await beforeRun("mainnet", true);


    // 创建市场
    // var fluxApp = deploy.loadContract("FluxApp")
    //set price

    // await deploy.setPrice({"cWBTC":57843.3655})

    // await deploy.createMarket("Flux cWBTC", "fCWBTC", "cfx:acg7z3y6x8pzem2v6pnyxuysn78pvgu3jjhzaatpy5");
    var mkt = deploy.loadContract("market_fCWBTC")
    // await deploy.enableMarket("fCWBTC", 1.4);
    // var closed = 2;
    await deploy.send(fluxApp.setMarketStatus(mkt.address, closed), { from: admin })
}
main().catch(err => console.log(err))