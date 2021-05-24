
const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
const { ethers } = require("ethers");

async function main() {


    var env = await beforeRun("mainnet", false);
    provider = env.provider, deployer = env.deployer, admin = env.admin, deploy = env.deploy;


    var linkOracle = deploy.loadContract("LinkOracle")
    console.log("FLUXPrice", (await linkOracle.getPriceMan(deploy.loadContract("cFLUX").address)).toString() / 1e18)


    var fluxReport = deploy.loadContract("FluxReport")
    console.log("FLUXPrice", (await fluxReport.getFluxPrice()).toString() / 1e18)


    for (var pool of deploy.loadMarkets()) {
        // console.log("getFluxMintedNextBlock:", (await fluxReport.getFluxMintedNextBlock(pool.address)))
    }

    await getLpInfo("stake_f-cFLUX-CFX");
    await getLpInfo("stake_f-cUSDT-cFLUX");
    // await getLpInfo("stake_f-OKT-FLUXK");

    // await getPrice([deploy.loadContract("cUSDT").address, deploy.loadContract("cFLUX").address])
    console.log("Conflux:", ((await (deploy.loadContract("FluxReport").getFluxTVL())).toString() / 1e18).toLocaleString());
    // operatorSend

    // await getStakeReport();

    // await getAllTokenPrice();
    // await getLoanReport();
}

async function getAllTokenPrice() {
    var fluxReport = deploy.loadContract("FluxReport")


    for (var pool of deploy.loadStakePools()) {


        var t0 = await pool.underlyingToken0();
        var t1 = await pool.underlyingToken1();

        console.log(t0, await fluxReport.getTokenPrice(t0))
        console.log(t1, await fluxReport.getTokenPrice(t1))
    }
}

async function getLoanReport() {
    getSymbol = async function (token) {
        return await deploy.warpERC20(token).symbol();
    }
    getDecimals = async function (token) {
        return await deploy.warpERC20(token).decimals();
    }

    var search = deploy.loadContract("SearchProvider");

    var fluxReport = deploy.loadContract("FluxReport")
    console.log("FLUXPrice", (await fluxReport.getFluxPrice()).toString() / 1e18)
    var result = await fluxReport.getLoanPoolReport();


    var e18 = 1000000000000000000n;
    for (var item of result) {

        var units = 10n ** (await getDecimals(item.underlying));
        console.log(`
            pool: ${item.pool},token: ${(await getSymbol(item.underlying))},tokenPrice: ${item.priceUSD / e18}
            TVL: ${item.tvl / e18},
            存款:${item.totalSupply / units}, 借款：${item.totalBorrow / units}
            存款APY=${((1n + item.supplyInterestPreDay / e18) ** 365n - 1n) * 100n}% + ${item.supplyFluxAPY / e18 * 100n}%
            借款APY=${((1n + item.borrowInterestPreDay / e18) ** 365n - 1n) * 100n}% - ${item.borrowFluxAPY / e18 * 100n}%
            `)
    }
}

async function getStakeReport() {

    getSymbol = async function (token) {
        return await deploy.warpERC20(token).symbol();
    }
    getDecimals = async function (token) {
        return await deploy.warpERC20(token).decimals();
    }


    var fluxReport = deploy.loadContract("FluxReport")

    console.log((new Date()).toLocaleString())
    console.log((await fluxReport.getFluxPrice()).toString() / 1e18)
    var result = await fluxReport.getStakePoolReport();
    for (var item of result) {


        var token0Units = 10 ** (await getDecimals(item.token0)).toString();
        var token0Symbol = (await getSymbol(item.token0)).toString();
        var token1Units = 10 ** (await getDecimals(item.token1)).toString();
        var token1Symbol = (await getSymbol(item.token1)).toString();

        console.log(`
    pool: ${item.pool},
    APY: ${item.apy.toString() / 1e18 * 100}%,
        staked token0: ${item.token0Staked.toString() / token0Units} ${token0Symbol} * ${item.token0PriceUSD.toString() / 1e18} = ${item.token0Staked.toString() / token0Units * item.token0PriceUSD.toString() / 1e18}
        staked token1: ${item.token1Staked.toString() / token1Units} ${token1Symbol} * ${item.token1PriceUSD.toString() / 1e18} = ${item.token1Staked.toString() / token1Units * item.token1PriceUSD.toString() / 1e18}
    TVL: ${(item.tvl.toString() / 1e18).toLocaleString()}
    `)
    }
}

async function getPrice(path) {
    var helper = deploy.loadContract("MoonSwapTokenPairHelper");
    var price = await helper.getTokenPrice(path)
    console.log("price=", price.toString() / 1e18)
}

async function getLpInfo(poolName) {

    var helper = deploy.loadContract("MoonSwapTokenPairHelper");

    var pool = deploy.loadContract(poolName);

    console.log(pool.address);

    var result = await helper.getTokenAmount(await pool.lpToken(), pool.address)
    console.log(`token0: ${result.token0}, amount = ${result.amount0.toString() / 1e18} `)
    console.log(`token1: ${result.token1}, amount = ${result.amount1.toString() / 1e18} `)


}

main().catch(e => console.log(e));