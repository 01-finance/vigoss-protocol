
const DEPLOER_KEY = "~/.flux/test_deployer.keystore.json";
const ADMIN_KEY = "~/.flux/test_admin.keystore.json";
const { Conflux, util } = require('js-conflux-sdk');
const net = "https://testnet-rpc.conflux-chain.org.cn/v2"
const deploy = require("../../deploy");

async function main() {
    // initiate a Conflux object
    const cfx = new Conflux({
        networkId: 1,
        url: net,
        // logger: console
    });
    deployer = deploy.unlockWallet(cfx, DEPLOER_KEY); // create account instance
    admin = deploy.unlockWallet(cfx, ADMIN_KEY); // create account instance

    await deploy.init(cfx, deployer, admin, "./contracts/testnet/", "testnet");

    const balance = await cfx.getBalance(deployer);
    console.log("balance:", deployer.address, balance.toString() / 1e18);

    //部署脚本
    await deploy.initFlux();

    // // // 创建市场逻辑合约
    await deploy.deployMarketImpl(true);//erc777
    await deploy.deployMarketImpl(false);//cfx


    // // // // 创建
    await deploy.deployERC777("wCFX")
    await deploy.deployERC777("cBTC");
    await deploy.deployERC777("cETH");
    await deploy.deployERC777("cUSDT");
    await deploy.deployERC777("cDAI");
    await deploy.deployERC777("cUSDC");

    // await deploy.setPrice({ "wCFX": 0.43, "cBTC": 55555, "cETH": 3000, "cUSDT": 1, "cUSDC": 1 })
    await deploy.setPrice({ "cDAI": 0.61 })

    await deploy.createMarket("Flux CFX", "fCFX", "wCFX");
    await deploy.createMarket("Flux BTC", "fBTC", "cBTC");
    await deploy.createMarket("Flux ETH", "fETH", "cETH");
    await deploy.createMarket("Flux USDT", "fUSDT", "cUSDT");
    await deploy.createMarket("Flux DAI", "fDAI", "cDAI");
    await deploy.createMarket("Flux USDC", "fUSDC", "cUSDC");

    await deploy.enableMarket("fBTC", 1.4);
    await deploy.enableMarket("fETH", 1.4);
    await deploy.enableMarket("fCFX", 7);
    await deploy.enableMarket("fDAI", 1.3);
    await deploy.enableMarket("fUSDC", 1.3);
    await deploy.enableMarket("fUSDT", 1.3);

    await deploy.saveDeployInfo();
    await deploy.setOracleFeeder("0x170f6da019701349299f1d1ee81c9842ec22cec6");
}


main().catch(e => console.error("error:", e));