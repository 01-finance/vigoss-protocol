const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;


var testAccount = "cfxtest:aan6x18hsvhaswcd7rcth7jx7e7avs009jgmmccgt5";


async function main() {
    var env = await beforeRun("testnet");
    cfx = env.cfx, deployer = env.deployer, admin = env.admin, deploy = env.deploy;

    // await removeStakePool("stake_mCFXFLUX");
    // return
    // var fluxApp = deploy.loadContract("FluxApp");

    // await depleyTimelock();
    // await sendToken();
    // await queueTransaction();

    await executeTransaction();
}

async function queueTransaction() {

    var timelock = deploy.loadContract("Timelock")
    var cBTC = deploy.loadContract("cBTC");

    var func = timelock.withdraw(cBTC.address, testAccount, 100 * 1e18)

    // target, value, signature, data, eta
    var target = timelock.address;
    var value = 0;
    var signature = "";
    var data = func.data;
    var eta = Math.ceil(((new Date()).getTime() / 1000) + 70);
    console.log(`target=${target},value=0,data=${data},eta=${eta}`);

    await deploy.send(
        timelock.queueTransaction(target, value, signature, Buffer.from(data, 16), eta)
        , { from: admin }
    )

    // 0xa9f05276a896eb581d1dee2f8e595bd8b31c9900eef6b5975ff214828166aadf
}

async function executeTransaction() {
    var timelock = deploy.loadContract("Timelock")

    var target = timelock.address;
    var value = 0;
    var signature = "";
    var data = "0xd9caed120000000000000000000000008a949b846080a1b5417fff9b723618b49f2fb71b00000000000000000000000017c9dfc7744e074843eb44f3f513e93a08bad6fa0000000000000000000000000000000000000000000000056bc75e2d63100000";
    var eta = 1615826928;
    await deploy.send(
        timelock.executeTransaction(target, value, signature, Buffer.from(data, 16), eta)
        , { from: admin }
    )
}

async function sendToken() {

    var timelock = deploy.loadContract("Timelock")

    var cBTC = deploy.loadContract("cBTC");

    await deploy.send(
        cBTC.beg(1000 * 1e18), { from: admin }
    )
    await deploy.send(
        cBTC.transfer(timelock.address, 1000 * 1e18), { from: admin }
    )
}

async function depleyTimelock() {

    delay_ = 60 //秒
    await deploy.deplowUseProxy("Timelock", { from: deployer }, [admin.address, delay_], false);
}

main().catch(e => console.error("error:", e));
