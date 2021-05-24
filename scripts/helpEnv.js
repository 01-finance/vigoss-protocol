const TEST_DEPLOER_KEY = "~/.flux/test_deployer.keystore.json";
const TEST_ADMIN_KEY = "~/.flux/test_admin.keystore.json";
const MAIN_DEPLOER_KEY = "~/.flux/main_deployer.keystore.json";
const MAIN_ADMIN_KEY = "~/.flux/main_admin.keystore.json";

const { Conflux } = require('js-conflux-sdk');
// https://github.com/conflux-fans/conflux-rpc-endpoints
const testnetRPC = "https://testnet-rpc.conflux-chain.org.cn/v2"
// const mainnetRPC = "https://mainnet-rpc.conflux-chain.org.cn/v2"
const mainnetRPC = "https://main.confluxrpc.org/v2"
// const mainnetRPC = "https://cfxnode.whoops.world"
const deploy = require("./deploy");

module.exports = async function beforeRun(mode, unlock) {

    if (mode == "testnet") {
        const cfx = new Conflux({
            networkId: 1,
            url: testnetRPC,
            // logger: console
        });
        var deployer;
        var admin;
        if (!(unlock === false)) {
            var [deployer1, admin1] = deploy.unlockWallet(cfx, TEST_DEPLOER_KEY, TEST_ADMIN_KEY);
            deployer = deployer1;
            admin = admin1;
        }
        await deploy.init(cfx, deployer, admin, "./contracts/testnet/", "testnet");
        return { cfx, deployer, admin, deploy }
    } else if (mode == "mainnet") {

        // create a custom timestamp format for log statements
        // const SimpleNodeLogger = require('simple-node-logger');
        // opts = {
        //     logFilePath: 'deploy_main.log',
        //     timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
        // };
        // logger = SimpleNodeLogger.createSimpleLogger({});

        // logger.setLevel("all")

        const cfx = new Conflux({
            networkId: 1029,
            url: mainnetRPC,
            // logger: logger
        });

        var deployer;
        var admin;
        if (!(unlock === false)) {
            var [deployer1, admin1] = deploy.unlockWallet(cfx, MAIN_DEPLOER_KEY, MAIN_ADMIN_KEY);
            deployer = deployer1;
            admin = admin1;
        }
        await deploy.init(cfx, deployer, admin, "./contracts/mainnet/", "mainnet");
        return { cfx, deployer, admin, deploy }
    }
}
