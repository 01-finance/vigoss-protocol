const beforeRun = require('../helpEnv')
var fluxTokenAddress = "cfx:acgbjtsmfpex2mbn97dsygtkfrt952sp0psmh8pnvz";
async function main() {
    const { cfx, deploy } = await beforeRun("mainnet", false);

    deploy.saveDeployInfo();
}

async function findLogs(cfx, mkt, startEpoch) {

    var logs = await cfx.getLogs({
        fromEpoch: "0x" + startEpoch.toString(16),
        toEpoch: "0x" + (startEpoch + 10000).toString(16),
        address: mkt.address,
        topics: [mkt.Redeem.signature, mkt.Supply.signature],
        //  limit:
    })
    console.log(logs)
}

main().catch(e => console.error("error:", e));