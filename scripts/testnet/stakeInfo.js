const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var { deploy } = await beforeRun("testnet");

    // await deploy.saveDeployInfo();
    // return
    //test
    var fluxApp = deploy.loadContract("FluxApp");
    // await deploy.send(deploy.loadContract("FLUX").big((100000 * 1e18)), { from: admin });

    // await deploy.send(deploy.loadContract("FLUX").transfer(fluxApp.address, (10000 * 1e18)), { from: deployer });
    // return;
    var pool = deploy.loadContract("stakeImpl")
    for (var i = 0; i < 10; i++) {
        var address = await fluxApp.stakePools(i);
        pool.address = address;
        var token = deploy.warpERC777(await pool.token());
        var symbol = await token.symbol();
        console.log(`"${symbol}":${token.address}",`);
    }

    // var searchProvider = deploy.loadContract("SearchProvider");
    // console.log(await searchProvider.getProfitability(admin.address));
    // var mkts = deploy.loadMarkets();
    // for (var mkt of mkts) {
    //     console.log("address:", mkt.address)
    //     try {
    //         await searchProvider.loanProfitability(mkt.address, admin.address);
    //     } catch (err) {
    //         console.log(JSON.stringify(await mkt.getAcctSnapshot(admin.address)))
    //         console.log("err:", err.message);
    //     };
    // }
}

main().catch(e => console.error("error:", e));
