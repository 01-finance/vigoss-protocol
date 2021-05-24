var FLUX_ADMIN_PK = process.env.FLUX_ADMIN_PK;
var FLUX_DAO_PK = process.env.FLUX_DAO_PK;
const { Conflux, util } = require('js-conflux-sdk');
const net = 'http://testnet.01.finance';
// const net = 'http://testnet.01.finance';
// const net = "http://159.138.30.184:12537"
const deploy = require("../deploy");

async function main() {
    // initiate a Conflux object
    const cfx = new Conflux({
        url: net,
        defaultGasPrice: 1, // The default gas price of your following transactions
        defaultGas: 1000000, // The default gas of your following transactions
    });

    const deployer = cfx.Account(FLUX_ADMIN_PK); // create account instance
    const admin = cfx.Account(FLUX_DAO_PK); // create account instance

    await deploy.init(cfx, deployer, admin, "./contracts/testnet/", "testnet");


    //部署脚本

    // await deploy.deplowUseProxy("FluxApp", { from: admin })
    // return;
    // console.log(newFulx.address)
    // await deploy.oneUpgradeTo("FluxApp", newFulx.address)

    // await deploy.deplowUseProxy("FluxApp", { from: admin })


    // // // 创建市场逻辑合约
    // 0x86a401cdb6342a6babe184ad052fde42cad2c26f
    await deploy.deplowUseProxy("InterestRateModelV2", { from: admin }, [], true, "InterestRateModel")

    var model = deploy.loadContract("InterestRateModel");
    // console.log((await model.getExp(1)))

    var cDAI = deploy.loadContract("market_fDAI");
    console.log((JSON.stringify(await cDAI.getAPY())))

    // console.log((await model.borrowRate((10709.882927209617 *1e18), (100), 0)) * 63072000 / 1e18)

    // await deploy.oneUpgradeTo("InterestRateModel", "0x894269fd311f2d568d0cf4fbc2c7c59297d95977")
    // var guard = await deploy.deplowUseProxy("Guard", { from: admin }, [])
    // var router = await deploy.deplowUseProxy("MoonSwapRouterMock", { from: deployer }, [], true, "MoonSwapRouter")
    // var guard = deploy.loadContract("Guard")
    // await deploy.send(guard.changeRouter(router.address), { from: admin });

    // var erc777MktImpl = await deploy.deployMarketImpl(true);//erc777
    // var cfxMktImpl = await deploy.deployMarketImpl(false);//cfx
    // // // var app = deploy.loadContract("FluxApp");

    // await deploy.mktUpgradeTo("fBTC", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fUSDT", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fUSDC", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fDAI", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fCFX", cfxMktImpl.address)
    // await deploy.mktUpgradeTo("fETH", erc777MktImpl.address)

}



main().catch(e => console.error("error:", e));