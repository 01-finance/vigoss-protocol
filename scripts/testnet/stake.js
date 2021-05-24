
const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("testnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;
    //创建3个抵押池
    // 1. LP Token

    // compound LP
    await deployStake("cWBTC", 0.0125, "cCWBTC", "cBTC");
    await deployStake("cETH", 0.0125, "cCETH", "cETH");
    await deployStake("cUSDC", 0.0125, "ccUSDC", "cUSDC");
    await deployStake("cDAI", 0.0125, "ccDAI", "cDAI");

    //aave LP
    await deployStake("aWBTC", 0.0125, "cAWBTC", "cBTC");
    await deployStake("aDAI", 0.0125, "cADAI", "cDAI");
    await deployStake("aETH", 0.0125, "cAETH", "cETH");
    await deployStake("aUSDC", 0.0125, "cAUSDC", "cUSDC");

    // CFX-FLUX moonswap LP
    await deploy.deployERC777("mCFXFLUX");
    await deployStake("moonCFXFLUX", 0.01, "mCFXFLUX");

    await deploy.deployERC777("cUniswap-ETH-FLUX", "Uniswap ETH-FLUX LP");

    await deployStake("UniETHFLUX", 0.075, "cUniswap-ETH-FLUX", "cETH", "cFLUX")

    await deployStake("cWBTC2", 0.0125, "cCWBTC", "cWBTC");
}


async function deployStake(name, weights, tokenName, underlyingToken0, underlyingToken1) {
    await deploy.deplowUseProxy("StakePool", { from: deployer }, [], false, "stakeImpl");
    var fluxApp = deploy.loadContract("FluxApp");
    var token = deploy.loadContract(tokenName);
    var t1 = typeof underlyingToken0 == "undefined" ? "cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw" : deploy.loadContract(underlyingToken0).address
    var t2 = typeof underlyingToken1 == "undefined" ? "cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw" : deploy.loadContract(underlyingToken1).address;

    var args = [admin.address, fluxApp.address, token.address, true, t1, t2];
    var pool = await deploy.deployStakePool(name, args);
    if (pool.isExist) {
        return;
    }
    await deploy.send(
        fluxApp.stakePoolApprove(pool.address, weights * 1e18), { from: admin });
}

main().catch(e => console.error("error:", e));
