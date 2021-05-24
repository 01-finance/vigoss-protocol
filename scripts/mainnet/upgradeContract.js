const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;

    // await deploy.deplowUseProxy("FluxMint", { from: admin }, [admin]);

    // await deploy.deplowUseProxy("FluxApp", { from: admin }, [])


    await updateStake();
    // await updateMarkets();
}


async function updateStake() {
    // await deploy.deplowUseProxy("StakePool", { from: deployer }, [], false, "stakeImpl");

    var impl = deploy.loadContract("stakeImpl")

    for (var s of deploy.loadStakePools()) {
        console.log(s.fileName);
        await deploy.upgradeTo(s.address, impl.address)
    }
}

async function updateMarkets() {

    var erc777MktImpl = await deploy.deployMarketImpl(true);//erc777
    var cfxMktImpl = await deploy.deployMarketImpl(false);//cfx

    for (var mkt of deploy.loadMarkets()) {
        if (mkt.fileName != "market_fCFX") {
            console.log(mkt.fileName)
            await deploy.upgradeTo(mkt.address, erc777MktImpl.address)
        }
    }

    await deploy.mktUpgradeTo("fCFX", cfxMktImpl.address)
}

main().catch(e => console.log(e))