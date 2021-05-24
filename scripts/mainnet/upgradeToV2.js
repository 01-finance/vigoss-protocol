
const beforeRun = require('../helpEnv')
var fluxTokenAddress = "cfx:acgbjtsmfpex2mbn97dsygtkfrt952sp0psmh8pnvz";
async function main() {
    const { cfx, deployer, admin, deploy } = await beforeRun("mainnet");

    // console.log(await cfx.getStatus())

    // await deploy.setPrice({ fluxTokenAddress: 0.66 })

    // 2. deploy Flux Mint
    var sendOptions = {
        from: deployer
    }
    // args: address admin_,address fluxAPP_,IERC20 fluxToken_,address team_,address community_
    var fluxAPP = deploy.loadContract("FluxApp");
    await deploy.deplowUseProxy("FluxMint", sendOptions, [admin.address, fluxAPP.address])
    // 3. update fluxAPP
    // await deploy.deplowUseProxy("FluxApp", { from: admin })
    //
    await deploy.deplowUseProxy("SearchProvider", sendOptions, [
        fluxAPP.address,
        deploy.loadContract("FluxMint").address,
        deploy.loadContract("Oracle").address,
        fluxTokenAddress,
    ], false);

    // 4. update market
    var erc777MktImpl = await deploy.deployMarketImpl(true);//erc777
    var cfxMktImpl = await deploy.deployMarketImpl(false);//cfx
    // // // var app = deploy.loadContract("FluxApp");

    await deploy.mktUpgradeTo("fBTC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fDAI", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fETH", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fFC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fUSDT", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fUSDC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fCFX", cfxMktImpl.address)

    //激活
    await deploy.deplowUseProxy("FluxApp", { from: admin }, [admin]);
    var fluxApp = deploy.loadContract("FluxApp");
    await deploy.send(
        fluxApp.initV2(deploy.loadContract("FluxMint").address),
        { from: admin });

    // 更新权重
    await deploy.send(fluxApp.refreshMarkeFluxSeed(), { from: admin });
}



main().catch(e => console.error("error:", e));