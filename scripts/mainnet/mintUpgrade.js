
const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;

    // var fluxApp = deploy.loadContract("FluxApp");
    // await deploy.send(fluxApp.refreshMarkeFluxSeed(), { from: admin });

    // await deploy.deplowUseProxy("FluxApp", { from: admin }, [admin]);
    // await deploy.deplowUseProxy("FluxMint", { from: admin }, [admin]);

    // await setPoolSeed();

    // await updateSearchProvider();

    // await setTeamWeight();
}

// 0f7f318628ab22c53293978506e80ee21493c6d289f0f2f9e8f26fbc547b5ef3
// aaec444ddabfa04ddceeaba6e24ddb33cfe847013fcb116a846ddc7b2fa78762

async function setTeamWeight() {
    // 0xD3Da15C94AE654033C98A987f0A1606FDC8ED6B4

    // cfx:aanprer8d3myv1um2gtafvymwrsc5h883ueswpgn78
    var fluxMint = deploy.loadContract("FluxMint");
    //  (uint256 teamWeight, uint256 communityWeight)
    // 团队 10%， 社区  15%
    seedData = connectTwoUint128(10 / 100 * 1e18, 15 / 100 * 1e18)
    var key = "cfx:aanprer8d3myv1um2gtafvymwrsc5h883ueswpgn78";
    // await deploy.send(fluxMint.setPoolSeed(key, seedData), { from: admin });

    var result = await fluxMint.getPoolSeed(key);
    console.log(`teamWeight=${result.height.toString() / 1e18 * 100}%,communityWeight=${result.low.toString() / 1e18 * 100}%`)
}

async function updateSearchProvider() {
    await deploy.deplowUseProxy("SearchProvider", { from: deployer }, [
        admin.address,
        deploy.loadContract("FluxApp").address,
        deploy.loadContract("FluxMint").address,
        deploy.loadContract("Oracle").address,
        deploy.loadContract("cFLUX").address,
    ]);
}


async function setPoolSeed() {
    // Conflux	借贷资产	cUSDT	1%		1%

    // 	cFLUX	0.20%		-
    //  CFX-cFLUX	7.50%
    // 	cUSDT-cFLUX	7.50%
    // 团队	团队解锁铸币税	10.00%
    // 社区	社区解锁	15.00%

    var seeds = [
        { pool: "market_fUSDT", supply: 2.55, borrow: 2.55 },
        { pool: "market_fCFX", supply: 1.2, borrow: 1.2 },
        { pool: "market_fBTC", supply: 0.45, borrow: 0.45 },
        { pool: "market_fETH", supply: 0.45, borrow: 0.45 },
        { pool: "market_fUSDC", supply: 0.75, borrow: 0.75 },
        { pool: "market_fCYFII", supply: 0.3, borrow: 0.3 },
        { pool: "market_fDAI", supply: 0.75, borrow: 0.75 },
        { pool: "market_fCMBTM", supply: 0.35, borrow: 0.35 },
        { pool: "market_fCWBTC", supply: 0.05, borrow: 0.05 },
        { pool: "market_fFC", supply: 0.9, borrow: 0.9 },
        { pool: "stake_f-cFLUX-CFX", supply: 2.0, borrow: 0 },
        { pool: "stake_f-cUSDT-cFLUX", supply: 1.75, borrow: 0 },
    ]

    var pools = [];
    var seedData = [];
    for (var item of seeds) {
        pool = deploy.loadContract(item.pool)

        console.log(item.pool, pool.address)

        pools.push(pool.address);
        seedData.push(connectTwoUint128(item.borrow / 100 * 1e18, item.supply / 100 * 1e18))
    }
    var fluxMint = deploy.loadContract("FluxMint");
    await deploy.send(fluxMint.batchSetPoolWeight(pools, seedData), { from: admin });
}

function connectTwoUint128(a, b) {
    a = parseInt(a)
    b = parseInt(b)
    return "0x" + ((BigInt(a) << 128n) + BigInt(b)).toString(16)
}

main().catch(console.log)