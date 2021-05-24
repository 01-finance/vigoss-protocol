const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;


var testAccount = "cfxtest:aan6x18hsvhaswcd7rcth7jx7e7avs009jgmmccgt5";

BigInt.prototype.toAmount = function () { return this.toString() / 1e18; }


async function main() {
    var env = await beforeRun("testnet");
    cfx = env.cfx, deployer = env.deployer, admin = env.admin, deploy = env.deploy;

    // await deploy.deplowUseProxy("FluxApp", { from: admin }, [admin]);

    // await deploy.deplowUseProxy("FluxApp", { from: admin })
    // await updateSearchProvider();
    // await updateFLUXMint();
    // await sendFLUXToFluxMint();
    // await updateStakePoolVersion();
    // await stopStake();
    await supplyToFlux();
}

async function stopStake() {

    var nonce = await cfx.getNextNonce(admin.address)
    var stakes= deploy.loadStakePools();
    for(var i=0;i<stakes.length;i++){
        if (i%2==0){
            await    deploy.send(stakes[i].stopStake(),{from:admin,nonce:nonce++})
            // 领取 LP
            await  deploy.send(stakes[i].redeemLP(),{from:admin,nonce:nonce++})
        }
    }
}

async function supplyToFlux() {
    var stakes= deploy.loadStakePools();
    for(var i=0;i<stakes.length;i++){
        var stopped= await stakes[i].stakeStopped();
        console.log( stakes[i].fileName,stakes[i].address, stopped)
        // if (stopped){
        //     console.log( stakes[i].fileName,"owner:", await stakes[i].owner() ,admin.address)
        //     // var underyling=deploy.loadContract( await stakes[i].underlyingToken0());

        //     // await deploy.send(underyling.beg(1e21),{from:admin})
        //     // await deploy.send(underyling.transfer(stakes[i].address,1e21),{from:admin})

        //     await  deploy.send(stakes[i].supplyToFlux(),{from:admin})
        // }
    }
}

async function updateStakePoolVersion() {

    await deploy.deplowUseProxy("StakePool", { from: deployer }, [], false, "stakeImpl");

    var impl= deploy.loadContract("stakeImpl")

    //update
    for(var pool of deploy.loadStakePools()){
        await deploy.upgradeTo(pool.address, impl.address)
    }
}
async function updateFLUXMint() {
    var fluxToken = deploy.loadContract("cFLUX");
    var fluxAPP = deploy.loadContract("FluxApp");
    await deploy.deplowUseProxy("FluxMint", { from: admin },
        [admin.address, fluxAPP.address, fluxToken.address, admin.address, deployer.address])
}

async function updateSearchProvider() {
    await deploy.deplowUseProxy("SearchProvider", { from: deployer }, [
        deploy.loadContract("FluxApp").address,
        deploy.loadContract("FluxMint").address,
        deploy.loadContract("Oracle").address,
        deploy.loadContract("cFLUX").address
    ], false);
}


async function sendFLUXToFluxMint() {
    var fluxMint = deploy.loadContract("FluxMint");
    var flux = deploy.loadContract("FLUX");

    await deploy.send(flux.transfer(fluxMint.address, (20000 * 1e18)), { from: deployer })
}

main().catch(e => console.error("error:", e));
