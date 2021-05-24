
const beforeRun = require('../helpEnv')
async function main() {
    const { cfx, deployer, admin, deploy } = await beforeRun("testnet");

    console.log(await cfx.getStatus())

    // await deploy.setPrice({ "cFLUX": 0.66 })
    // 1. deploy Flux Token
    var fluxToken = deploy.loadContract("cFLUX");
    // set flux price
    // await deploy.send(
    //     deploy.loadContract("Oracle").setPrice(fluxToken.address, (0.00001 * 1e18).toString()),
    //     { from: admin }
    // )

    // 2. deploy Flux Mint
    var sendOptions = {
        from: deployer
    }
    // args: address admin_,address fluxAPP_,IERC20 fluxToken_,address team_,address community_
    var fluxAPP = deploy.loadContract("FluxApp");
    await deploy.deplowUseProxy("FluxMint", sendOptions,
        [admin.address, fluxAPP.address, fluxToken.address, admin.address, deployer.address])
    // 3. update fluxAPP
    // await deploy.deplowUseProxy("FluxApp", { from: admin })
    //
    await deploy.deplowUseProxy("SearchProvider", sendOptions, [
        fluxAPP.address,
        deploy.loadContract("FluxMint").address,
        deploy.loadContract("Oracle").address,
        fluxToken.address,
    ], false);

    // 4. update market
    var erc777MktImpl = await deploy.deployMarketImpl(true);//erc777
    var cfxMktImpl = await deploy.deployMarketImpl(false);//cfx
    // // // var app = deploy.loadContract("FluxApp");

    await deploy.mktUpgradeTo("fBTC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fUSDT", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fUSDC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fDAI", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fETH", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fCFX", cfxMktImpl.address)

    //激活
    var fluxApp = deploy.loadContract("FluxApp");
    await deploy.send(
        fluxApp.initV2(deploy.loadContract("FluxMint").address),
        { from: admin });

    // 更新权重
    await deploy.send(fluxApp.refreshMarkeFluxSeed(), { from: admin });

    //

    //部署脚本

    // await deploy.deplowUseProxy("FluxApp", { from: admin })
    // return;
    // console.log(newFulx.address)
    // await deploy.oneUpgradeTo("FluxApp", newFulx.address)

    // await deploy.deplowUseProxy("FluxApp", { from: admin })


    // // // 创建市场逻辑合约
    // 0x86a401cdb6342a6babe184ad052fde42cad2c26f
    // await deploy.deplowUseProxy("InterestRateModelV2", { from: admin }, [], true, "InterestRateModel")

    // var model = deploy.loadContract("InterestRateModel");
    // console.log((await model.getExp(1)))

    // var cDAI = deploy.loadContract("market_fDAI");
    // console.log((JSON.stringify(await cDAI.getAPY())))

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