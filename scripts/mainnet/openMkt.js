const fs = require("fs");
const path = require("path");

var content = fs.readFileSync(path.join(process.env.HOME, "/.flux/mainnet"), 'utf-8');
var pks = content.split("\n");

var FLUX_DEPlOY_PK = pks[0];//deployer
var FLUX_ADMIN_PK = pks[1];//admin
const { Conflux, util } = require('js-conflux-sdk');
// const net = 'http://testnet.01.finance';
// const net = "https://cfx-main.01.finance"
// const net = "http://main.confluxrpc.org"
const net = "http://home.conflux.work:12537";
const deploy = require("../../deploy");
const { address } = require("js-conflux-sdk/src/util/format");

async function main() {
    // initiate a Conflux object
    const cfx = new Conflux({
        url: net,
        defaultGasPrice: 1, // The default gas price of your following transactions
        defaultGas: 1000000, // The default gas of your following transactions
        logger: console,
    });

    const deployer = cfx.Account(FLUX_DEPlOY_PK); // create account instance
    const admin = cfx.Account(FLUX_ADMIN_PK); // create account instance
    await deploy.init(cfx, deployer, admin, "./contracts/mainnet/", "mainnet");

    // await deploy.deployMarketImpl(false);//cfx
    // await deploy.createMarket("CFX Flux Lending Market", "fCFX", "0x8d7df9316faa0586e175b5e6d03c6bda76e3d950");
    // await deploy.enableMarket("fCFX", 7);


    // await deploy.createMarket("FC Flux Lending Market", "fFC", "0x8e2f2e68eb75bb8b18caafe9607242d4748f8d98");

    const sponsor_contract = cfx.Contract({
        abi: require("./SponsorWhitelistControl.json").abi,
        address: "0x0888000000000000000000000000000000000001"
    })

    var mkt = deploy.loadContract("market_fCFX");
    await deploy.send(
        sponsor_contract.addPrivilegeByAdmin(mkt.address, ["0x0000000000000000000000000000000000000000"])
        , { from: deployer })
    console.log(mkt.address, await sponsor_contract.isAllWhitelisted(mkt.address))


    // await deploy.enableMarket("fFC", 7);
    await deploy.saveDeployInfo();

}



main().catch(e => console.error("error:", e));