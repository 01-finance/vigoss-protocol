
const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;
    //创建3个抵押池
    // 1. LP Token


    // await deployStake("f-cFLUX-CFX", 7.5 / 100, "cfx:aca118w0u9u5bktar4wja744vsemscsm96ckkw5a3u", "cfx:acgbjtsmfpex2mbn97dsygtkfrt952sp0psmh8pnvz", "cfx:acg158kvr8zanb1bs048ryb6rtrhr283ma70vz70tx")
    // await deployStake("f-cUSDT-cFLUX", 7.5 / 100, "cfx:acaf6h38bsmubxaazgpvnnyddys3e731z2hxesmyt2", "cfx:acf2rcsh8payyxpg6xj7b0ztswwh81ute60tsw35j7", "cfx:acgbjtsmfpex2mbn97dsygtkfrt952sp0psmh8pnvz")
    // Compound &  AAVE
    // await deployStake("cCWBTC", 0.0375, "cfx:achsku84s17trsfgazwcu46896vc5cwkfp6uc6m52x", "cfx:acg7z3y6x8pzem2v6pnyxuysn78pvgu3jjhzaatpy5")
    // await deployStake("cCDAI", 0.0375, "cfx:acdvm0p8x9uewj9b2a8vj1kt9w2ucd3f0ad3s6ezme", "cfx:acd3fhs4u0yzx7kpzrujhj15yg63st2z6athmtka95")
    // await deployStake("cCETH", 0.0375, "cfx:aceh4cspfxbn97x86g8mekkzc72j3p4eragg0azm6n", "cfx:acdrf821t59y12b4guyzckyuw2xf1gfpj2ba0x4sj6")
    // await deployStake("cCUSDC", 0.0375, "cfx:acfrv5rmc7j7vz2sxepx7ns8avwuvvuf5acrbh78vu", "cfx:aca13suyk7mbgxw9y3wbjn9vd136swu6s21tg67xmb")
    // await deployStake("cAWBTC", 0.0375, "cfx:acct2nu0sdaf354vrmxhjc8auy53unmthednt6rrk3", "cfx:acg7z3y6x8pzem2v6pnyxuysn78pvgu3jjhzaatpy5")
    // await deployStake("cADAI", 0.0375, "cfx:acfzbnku1z46eb2jd0c2030bmc3jvze2aagspwx0sk", "cfx:acd3fhs4u0yzx7kpzrujhj15yg63st2z6athmtka95")
    // await deployStake("cAETH", 0.0375, "cfx:acey3jx620gs4zfc35uubmz2ar8d7phcfyt158z4j1", "cfx:acdrf821t59y12b4guyzckyuw2xf1gfpj2ba0x4sj6")
    // await deployStake("cAUSDC", 0.0375, "cfx:acc2ggpdaezsd948rg9rzkk9cd5r46knd2rv3tuswr", "cfx:aca13suyk7mbgxw9y3wbjn9vd136swu6s21tg67xmb")
}


async function deployStake(name, weights, tokenAddress, underlyingToken0, underlyingToken1) {
    // await deploy.deplowUseProxy("StakePool", { from: deployer }, [], false, "stakeImpl");
    var fluxApp = deploy.loadContract("FluxApp");
    var t1 = typeof underlyingToken0 == "undefined" ? "cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw" : underlyingToken0
    var t2 = typeof underlyingToken1 == "undefined" ? "cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw" : underlyingToken1;

    var args = [admin.address, fluxApp.address, tokenAddress, true, t1, t2];
    var pool = await deploy.deployStakePool(name, args);
    if (pool.isExist) {
        return;
    }
    // await deploy.send(fluxApp.stakePoolApprove(pool.address, weights * 1e18), { from: admin });
    // await deploy.send(fluxApp.setStakePoolStatus(pool.address, false), { from: admin });
}

main().catch(e => console.error("error:", e));
