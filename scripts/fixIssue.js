const fs = require("fs");
const path = require("path");

var content = fs.readFileSync(path.join(process.env.HOME, "/.flux/mainnet"), 'utf-8');
var pks = content.split("\n");


var FLUX_DEPlOY_PK = pks[0];//deployer
var FLUX_ADMIN_PK = pks[1];//admin
const { Conflux, util } = require('js-conflux-sdk');
// const net = 'http://testnet.01.finance';
const net = "https://main.confluxrpc.org"
const deploy = require("../deploy");

async function main() {
    // initiate a Conflux object
    const cfx = new Conflux({
        url: net,
        defaultGasPrice: 1, // The default gas price of your following transactions
        defaultGas: 1000000, // The default gas of your following transactions
    });

    const deployer = cfx.Account(FLUX_DEPlOY_PK); // create account instance
    const admin = cfx.Account(FLUX_ADMIN_PK); // create account instance
    await deploy.init(cfx, deployer, admin, "./contracts/mainnet/", "mainnet");


    var usdcMKT = deploy.loadContract("market_fUSDT");
    var usdc = deploy.warpERC777(await usdcMKT.underlying());

    var totalSupply = await usdcMKT.totalSupply();
    var balance = await usdc.balanceOf(usdcMKT.address);

    var supplies = {
        "0x12883062594709e9a9bfc3dff0d7e11009cbfb6d": 110,
        "0x1843b4c432cb93d3d0faa358c19436aa0acf72aa": 2,
        "0x102964a06b8b3510e6fc2d82152031298f498e93": 9570.999999999999213568,
        "0x14d63e69db1fce0132f2d4948b9096f356cc8a76": 50,
        "0x1528268fdd04827639fea1d76c0e4545399fabce": 1,
    }

    console.log(usdcMKT.address, usdc.address, "total:", totalSupply.toString(), "balance:", balance.toString())

    var total = 0;
    var values = 0.0;
    for (var addr of Object.keys(supplies)) {
        values += supplies[addr];
        var s = (await usdcMKT.balanceOf(addr));
        console.log(addr, s.toString())
        total += s / 1;

        util.format.receipt
    }
    console.log(total, balance / 1 - values * 1e18, (values * 1e18).toFixed(0));




}



main().catch(e => console.error("error:", e));