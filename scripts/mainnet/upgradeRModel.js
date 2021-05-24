
const fs = require("fs");
const path = require("path");

var content = fs.readFileSync(path.join(process.env.HOME, "/.flux/mainnet"), 'utf-8');
var pks = content.split("\n");

var FLUX_DEPlOY_PK = pks[0];//deployer
var FLUX_ADMIN_PK = pks[1];//admin
const { Conflux, util } = require('js-conflux-sdk');
// const net = 'http://testnet.01.finance';
// const net = "https://main.confluxrpc.org"
const net = "http://home.conflux.work:12537";

const deploy = require("../../deploy");

async function main() {
    // initiate a Conflux object
    const cfx = new Conflux({
        url: net,
        defaultGasPrice: 1, // The default gas price of your following transactions
        defaultGas: 1000000, // The default gas of your following transactions
        // logger: console,
    });

    const deployer = cfx.Account(FLUX_DEPlOY_PK); // create account instance
    const admin = cfx.Account(FLUX_ADMIN_PK); // create account instance
    await deploy.init(cfx, deployer, admin, "./contracts/mainnet/", "mainnet");



    var markets = deploy.loadMarkets();

    for (var mkt of markets) {

        console.log(await mkt.name(),
            (await mkt.totalBorrows()) / 1e18, (await mkt.lastAccrueInterest()).toString(),
            JSON.stringify(await mkt.getAPY())
        )
    }

    // for (var mkt of markets) {
    //     await deploy.send(mkt.calcCompoundInterest(), { from: admin })
    // }
    console.log("-------------after:")
    for (var mkt of markets) {
        console.log(await mkt.name(),
            (await mkt.totalBorrows()) / 1e18, (await mkt.lastAccrueInterest()).toString(),
            JSON.stringify(await mkt.getAPY())
        )
    }


    console.log((await cfx.getStatus()).blockNumber);

    await deploy.deplowUseProxy("InterestRateModelV2", { from: admin }, [], true, "InterestRateModel")
    console.log("-------------done:")

    for (var mkt of markets) {
        console.log(await mkt.name(),
            (await mkt.totalBorrows()) / 1e18, (await mkt.lastAccrueInterest()).toString(),
            JSON.stringify(await mkt.getAPY())
        )
    }

}



main().catch(e => console.error("error:", e));
// calcCompoundInterest