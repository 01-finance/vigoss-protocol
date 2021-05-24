const fs = require("fs");
const path = require("path");

var content = fs.readFileSync(path.join(process.env.HOME, "/.flux/mainnet"), 'utf-8');
var pks = content.split("\n");

var FLUX_DEPlOY_PK = pks[0];//deployer
var FLUX_ADMIN_PK = pks[1];//admin
const { Conflux, util } = require('js-conflux-sdk');
// const net = 'http://testnet.01.finance'
//const net = "https://cfxnode.whoops.world"
// const net = "ws://121.196.26.182:12535";
// const net = "ws://121.196.26.182"
//const net = "https://wallet-main.confluxrpc.org.cn"
const net = "https://mainnet-rpc.conflux-chain.org.cn"
//const net = "https://home.conflux.work:12537";
const deploy = require("../../deploy");

var deployer;
var admin;
var cfx;
async function main() {
    await init();

    var redpack = deploy.loadContract("RedPackManager")

    await releasAll();
    return;
    var info = await redpack.redPackInfos(439)
    console.log(info.number.toString());
    console.log(info.remainNum.toString());
    console.log(info.size.toString());
    console.log(info.remainSize.toString());

    // await sendRedPack();

    // var fc = deploy.warpERC20("0x8e2f2e68eb75bb8b18caafe9607242d4748f8d98")

    // console.log((await fc.balanceOf("0x1F197BaE4EbFD7116E24920814b2e7b78EEc128E")) / 1e18)
    // await deploy.loadTx("0x247f9e0031477b8ed7902070510e75feb512732c4c76e277a8070c9487dd32e9")
    return



    await deploy.loadTx("0x5c192e7ed0570ffd8305e01289124d75128253c56441cbf8a7f1757556f40e9b")
}
async function sendRedPack() {
    var redpack = deploy.loadContract("RedPackManager")
    const hash = Buffer.from("0fc1ed2dd66576cc63c80ec19fd1d11cfee46572253736a37b373ef65118280b", 'hex');
    var result = await deploy.send(
        redpack.create(0, 1, 2, 3, hash, "group:3a585c36b1877c227a03b126624df069")
        , { from: admin, value: 11 }
    )
    console.log((new Date()).toLocaleTimeString(), " tx executed")
}

async function init() {
    // initiate a Conflux object
    cfx = new Conflux({
        url: net,
        defaultGasPrice: 1, // The default gas price of your following transactions
        defaultGas: 1000000, // The default gas of your following transactions
        // logger: console,
    });

    deployer = cfx.Account(FLUX_DEPlOY_PK); // create account instance
    admin = cfx.Account(FLUX_ADMIN_PK); // create account instance

    var projectDir = "/Users/ysqi/Documents/devproject/whoops-onchain";

    await deploy.init2(cfx, deployer, admin,
        "./contracts/redpack-main/", "mainnet",
        projectDir);
}

async function releasAll() {
    var redpack = deploy.loadContract("RedPackManager")

    var lastId = parseInt(await redpack.ascId());

    for (var i = 1; i < lastId; i++) {
        try {
            var info = await redpack.redPackInfos(i)

            if (info.number > 0) {
                console.log("--->", i, info.number.toString(), info.remainNum.toString(), info.remainSize.toString(), info.token);
                var result = await deploy.send(
                    redpack.release(i), { from: admin }
                )
                console.log(result.tx);
            }
        } catch (err) {
            if (err.message.indexOf("only can release after 24 hours") == false) {
                console.log(i, err)
            }
        }
    }

}

async function sponsor() {

    const sponsor_contract = cfx.Contract({
        abi: require("./SponsorWhitelistControl.json").abi,
        address: "0x0888000000000000000000000000000000000001"
    })
    var redpack = deploy.loadContract("RedPackManager")
    await deploy.send(
        sponsor_contract.addPrivilegeByAdmin(redpack.address,
            ["0x0000000000000000000000000000000000000000"])
        , { from: deployer })
}


main().catch(e => console.error("error:", e));