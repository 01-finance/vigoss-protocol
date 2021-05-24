const deploy = require("../deploy")

const MAIN_DEPLOER_KEY = "/Users/ysqi/.flux/bsc_testnet_deployer.keystore.json";
const MAIN_ADMIN_KEY = "/Users/ysqi/.flux/bsc_testnet_admin.keystore.json";

const beforeRun= require("./helpEnv")
var env =   beforeRun("testnet",false);

// deploy.encryptPK("0x454a47b8c287c1d42c3394962c8ce90f851a2fbb7d04debde49a6068c0d2829f",1 , "./tester2.json")
deploy.unlockWallet(env.cfx,"./tester2.json")
