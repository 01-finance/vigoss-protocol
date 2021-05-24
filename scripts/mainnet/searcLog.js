const format = require('js-conflux-sdk/src/util/format');
const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet", false);
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;


    var mkts = deploy.loadMarkets();
    var fluxMint = deploy.loadContract("FluxMint");
    var result = await cfx.getLogs({
        from: fluxMint.address,
        fromEpoch: 10312813,
        toEpoch: 10316213,
        topics: ["0xc7279c05df558704e004c621cc6bff201286dd0a1b2744170a122b4e72e004a2"]
    })

    for (var logData of result) {
        var eventInfo = fluxMint.abi.decodeLog(logData);
        if (eventInfo && eventInfo.object) {
            var pool = eventInfo.object["pool"];
            var oldIndex = eventInfo.object["oldIndex"];
            var newIndex = eventInfo.object["newIndex"];
            var endBlock = eventInfo.object["endBlock"];
            var kind = eventInfo.object["kind"];

            if (oldIndex == "0" && newIndex > 0) {
                var poolName = deploy.loadContract(pool).name;
                poolHex = format.hexAddress(pool);
                var state = await fluxMint.fluxIndexState(pool, kind);

                console.log(`${poolName},${poolHex},${kind},${oldIndex},${newIndex},${state.index},${(state.index - newIndex).toString() / 1e18}`)


            }
        }
    }

}
main().catch(e => console.error("error:", e));
