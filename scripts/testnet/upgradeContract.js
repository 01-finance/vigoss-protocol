const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("testnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;


    await deploy.deplowUseProxy("FluxApp", { from: admin }, [admin]);


    // /**
    //  * 1. 服务器配置子页面 ok
    //  * 2. 升级：FluxApp 、Guard、makret、 IModel
    //  *
    //  */

    // // await deploy.deplowUseProxy("InterestRateModel", { from: admin }, [])
    // // await deploy.deplowUseProxy("Guard", { from: admin }, [])
    // // await deploy.deplowUseProxy("FluxApp", { from: admin }, [])
    var erc777MktImpl = await deploy.deployMarketImpl(true);//erc777
    var cfxMktImpl = await deploy.deployMarketImpl(false);//cfx
    await deploy.mktUpgradeTo("fBTC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fUSDT", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fUSDC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fDAI", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fETH", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fFC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fCFX", cfxMktImpl.address)
}



main().catch(e => console.error("error:", e));