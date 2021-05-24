
const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
const { ethers } = require("ethers");

async function main() {


    var env = await beforeRun("mainnet");
    provider = env.provider, deployer = env.deployer, admin = env.admin, deploy = env.deploy;


    await deploy.deplowUseProxy("NoramlSwapTokenPairHelper", { from: deployer }, [
        admin.address,
        "0x80ae6a88ce3351e9f729e8199f2871ba786ad7c5"// MoonSwap router
    ], true, "MoonSwapTokenPairHelper");
    await deploy.deplowUseProxy("FluxReport", { from: deployer }, [
        admin.address,
        deploy.loadContract("FluxApp").address,
        deploy.loadContract("FluxMint").address,
        deploy.loadContract("Oracle").address,
        deploy.loadContract("cFLUX").address,
        deploy.loadContract("cUSDT").address,
        deploy.loadContract("MoonSwapTokenPairHelper").address,
    ], true);

    // var fluxReport = deploy.loadContract("FluxReport").connect(admin);

    // await deploy.waitTx(await fluxReport.setTokenSwapToUSDPath([
    //     deploy.loadContract("token_BUSDT").address,
    //     deploy.loadContract("token_FLUXK").address
    // ]));

    // await deploy.waitTx(await fluxReport.setOracle(deploy.loadContract("Oracle").address));
}

main();//.catch(e => console.log);