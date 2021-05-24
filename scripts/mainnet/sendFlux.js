const beforeRun = require('../helpEnv')
var fluxTokenAddress = "cfx:acgbjtsmfpex2mbn97dsygtkfrt952sp0psmh8pnvz";
var cfx;
var deploy;
async function main() {

    var list = await calcAriDropAmount();

    await sendFlux(list);
    // await sendFlux([
    //     { "acct": "cfx:aapdh14xed8nuexhkcwkfb57ffuc1sckrp95m5rvnc", amount: 1 },
    //     { "acct": "cfx:aapdh14xed8nuexhkcwkfb57ffuc1sckrp95m5rvnc", amount: 1 },
    //     { "acct": "cfx:aapdh14xed8nuexhkcwkfb57ffuc1sckrp95m5rvnc", amount: 1 },
    //     { "acct": "cfx:aapdh14xed8nuexhkcwkfb57ffuc1sckrp95m5rvnc", amount: 1 },
    //     { "acct": "cfx:aapdh14xed8nuexhkcwkfb57ffuc1sckrp95m5rvnc", amount: 1 },
    //     // { "acct": "cfx:aapdh14xed8nuexhkcwkfb57ffuc1sckrp95m5rvnc", amount: 1 },
    // ]);
}

const AirDropTimes = {
    "1": 10,
    "2": 1,
    "3": 100,
    "4": 0,
    "5": 2,
    "6": 1
}

async function calcAriDropAmount() {

    var info = require("./nft_202104132200_12382966.json")

    var sum = 0;
    var result = []
    for (var item of info) {
        var acct = item[0];
        // console.log(acct)
        var amount = 0;
        for (var token of item[1]) {
            var v = AirDropTimes[token[0]] * token[1];
            amount += v;
            // console.log(` \t 拥有 id= ${token[0]}, amount=${token[1]}, 可兑换 ${v} `)
            // console.log(`${acct},${token[0]},${token[1]},${v} `)
        }
        // console.log(acct, ",", amount)
        result.push({ acct: acct, amount: amount });
        sum += amount;
    }
    console.log("sum:", sum)
    return result;

}


async function sendFlux(items) {
    var { cfx, deploy } = await beforeRun("mainnet", false);
    // // initiate a Conflux object
    // const cfx = new Conflux({
    //     url: "https://mainnet-rpc.conflux-chain.org.cn/v2",
    //     defaultGasPrice: 1, // The default gas price of your following transactions
    //     defaultGas: 1000000, // The default gas of your following transactions
    // });

    const sender = cfx.wallet.addPrivateKey("");

    var cFLUX = deploy.loadContract("cFLUX")

    var nonce = (await cfx.getNextNonce(sender.address));
    for (var item of items) {
        var acct = item.acct;
        var amount = item.amount * 1e18;
        var tx = await cFLUX.transfer(acct, amount).sendTransaction({ from: sender, gasPrice: 1, gas: 62927, nonce: nonce });
        console.log(`${acct}-${amount / 1e18} : ${tx}`)
        nonce = nonce + 1n;
    }
}

main().catch(e => console.error("error:", e));