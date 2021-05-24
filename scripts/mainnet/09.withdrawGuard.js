const user_operation = require('conflux-crosschain');
const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;

    await updateFluxApp();

    // await tryRepay();

    // await deploy.deplowUseProxy("Guard", { from: admin }, [])

    // await withdraw("HPT");
    // await withdraw("ETH");
    // await withdraw("MDX");
    // await withdraw("WHT");
}

async function updateFluxApp() {
    // await deploy.deplowUseProxy("FluxApp", { from: admin }, [])
    var fluxApp = deploy.loadContract("FluxApp");
    // console.log((await fluxApp.CLOSE_FACTOR_MANTISSA()) / 1)
    await deploy.send(fluxApp.setConfig("MARGINCALL_MANTISSA", "1100000000000000000"), { from: admin });
    console.log((await fluxApp["MARGINCALL_MANTISSA"]()).toString() / 1e18)
}


async function tryRepay() {
    var guard = deploy.loadContract("Guard")

    var mkts = deploy.loadMarkets();
    for (var mkt of mkts) {
        var info = await mkt.getAcctSnapshot(guard.address);

        if (info.borrows == 0) {
            continue;
        }
        var token = deploy.warpERC20(await mkt.underlying())
        var decimals = 10 ** (await mkt.decimals());
        var cash = (await token.balanceOf(mkt.address)) / decimals;
        var supply = info.ftokens * info.xrate / 1e18 / decimals;
        var balance = (await token.balanceOf(guard.address)) / decimals;

        console.log(
            await mkt.name(),
            token.address, await token.name(),
            "存款：", supply,
            "借款：", info.borrows / decimals,
            "market balance:", cash,
            "gurand balance:", balance,
        )

        if (balance > 0 && info.borrows > 0) {
            await deploy.waitTx(await guard.connect(admin).tryToRepay(mkt.address));
        }

    }

}

async function withdraw(tokenName) {

    var token = deploy.loadToken(tokenName);

    var gurad = deploy.loadContract("Guard");

    var balance = await token.balanceOf(gurad.address);
    var units = 10 ** (await token.decimals())

    console.log(tokenName, "balance:", balance / units)
    await deploy.waitTx(await gurad.connect(admin).withdraw(token.address, balance))

}

main()