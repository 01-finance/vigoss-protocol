const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;


var testAccount = "cfxtest:aan6x18hsvhaswcd7rcth7jx7e7avs009jgmmccgt5";


async function main() {


    var env = await beforeRun("testnet");
    cfx = env.cfx, deployer = env.deployer, admin = env.admin, deploy = env.deploy;

    // deploy.encryptPK("", 1029, "./oralce.mainnet.keystore.json")
    // await removeStakePool("stake_mCFXFLUX");

    await updateStakePoolVersion();
    // deploy.unlockWallet(cfx, "./OraceFeeder.keystore.json")
    return

    await allMarketInfo()
    // return
    var fluxApp = deploy.loadContract("FluxApp");

    // await deploy.saveDeployInfo()
    // await seedCheck();
    // await deploy.fillTestData()
    // await deploy.setPrice({ "cBTC": 2000, "cETH": 1000, "cUSDC": 1, "cUSDT": 1 })
    // await deploy.send(fluxApp.refreshMarkeFluxSeed(), { from: admin });
    // var fluxMint = deploy.loadContract("FluxMint");
    // await deploy.send(fluxMint.refreshFluxMintIndex(), { from: admin })
    // await deploy.send(deploy.loadContract("FluxApp").refreshMarkeFluxSeed(), { from: admin })

    // 20485297
    // 20599335
    // console.log((await deploy.loadContract("FLUX").balanceOf(deployer.address)).toString())
    // await check1();
    // await fluxBlance("0x17c9DfC7744E074843EB44F3F513E93A08BaD6fa");
    // await claimFlux();
    // await deploy.loadTx("0x0b6b7c9f5d40e7229ea190b46179e758f2ced6df374476263650ea0c6146ffe2")
    // await stakeActions();
    // await checkStakeSeed();
    // await deploy.setPrice({ "FLUX": 0.01 })
    // await unclaimedFluxAtStake("0x17c9DfC7744E074843EB44F3F513E93A08BaD6fa");
    // await deploy.loadTx("0x7ac29825ca5b7327ae06943617b236903439cbf26cbfcdfeb81356168cc51a5d")

    // console.log(await cfx.getStatus())

    // await getPrice("0x868b8f5a0a1e55a5506874ed36ba2fd64274cb71");
    // await getPrice("0x819b045a9984afcd9a9aa07881fabae9eb94a127");
    // await refreshInterest();
    // await searchApprove(deploy.loadContract("cBTC").address, "0x1395abf550a9d64dd92ebc1d53a6c33793af5f65", "0x1395abf550a9d64dd92ebc1d53a6c33793af5f65")
    // await searchApprove(deploy.loadContract("cETH").address, "0x1395abf550a9d64dd92ebc1d53a6c33793af5f65", "0x1395abf550a9d64dd92ebc1d53a6c33793af5f65")
    // await getProfitability(testAccount);
    // await getProfitabilityAtMarket("0x83b4b1cff53d8fb93524d68cfd442d13744cf695", "0x17c9DfC7744E074843EB44F3F513E93A08BaD6fa")
    // await loadLogs();

    // await deploy.loadTx("0x462d893150f7f27446b1a96186a8040e55ce755471b1f5f541eb4439af9812a1")
    // await rebaseStakePool("stake_cWBTC2");

    // await searchMyStake("stake_cWBTC", "cfxtest:aan6x18hsvhaswcd7rcth7jx7e7avs009jgmmccgt5");
    // await searchMyStake("stake_aDAI", "cfxtest:aan6x18hsvhaswcd7rcth7jx7e7avs009jgmmccgt5");
    // await supplyToFlux("stake_cWBTC2");
    // await claimFTokens("stake_cWBTC2");

    // await enableAllSponsor();

    // console.log(await calcMoonswapLPTokenAsset({
    //     "pair": "cfx:acfd9tkrdzyfwbekmucy444c3zetnpg616kuukx48a",
    //     "token0": {
    //         "address": "cfx:acdrf821t59y12b4guyzckyuw2xf1gfpj2ba0x4sj6",
    //         "symbol": "cETH",
    //         "name": "Flux Token",
    //         "decimals": "18"
    //     },
    //     "token1": {
    //         "address": "cfx:achcuvuasx3t8zcumtwuf35y51sksewvca0h0hj71a",
    //         "symbol": "cMOON",
    //         "name": "Wrapped Ether",
    //         "decimals": "18"
    //     }
    // }));

    // await getFluxsByBlock();

    // await claimDaoFlux();
    // 22752561,17959133
    // 22752638,17959194
    var info = await cfx.getStatus();
    console.log(`epoch=${info.epochNumber},block=${info.blockNumber}`);
}

async function allMarketInfo() {

    console.log("oracle:", deploy.loadContract("oracle").address.toBase32())

    for (var mkt of deploy.loadMarkets()) {

        var token = deploy.warpERC20(await mkt.underlying());

        console.log(mkt.fileName, `-\n name: ${await token.name()} \n address: ${token.address}`)
        await getPrice(token.address)
        // console.log(`${mkt.fileName},${(await token.balanceOf(mkt.address)).toAmount()},${(await mkt.totalBorrows()).toAmount()},,${price}`)
    }
}

async function claimDaoFlux() {
    var fluxMint = deploy.loadContract("FluxMint");

    console.log((await fluxMint.lastUnlockTime()))

    await deploy.send(fluxMint.claimDaoFlux(), { from: admin })


}
async function getFluxsByBlock() {
    var fluxMint = deploy.loadContract("FluxMint");

    const status = await cfx.getStatus();
    console.log(await fluxMint.calcFluxsMined(status.blockNumber, status.blockNumber + 1));

    var amount = await fluxMint.getFluxsByBlock(0);
    console.log(amount, amount.toString() / 1e18)



    var start = 22063620 + 14400;
    var m1 = await fluxMint.calcFluxsMined(start, start + 1);
    // 150830796527777792  ,535921349
    console.log(m1.toString() / 1e18, m1 - 150830796527777792n)
}

var erc20ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenHolder",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true,
        "signature": "0x70a08231"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true,
        "signature": "0x18160ddd"
    },
]

/**
 * 计算moonswap LPToken可兑换的资产数量
 * @param {address} pairAddr LPToken 地址
 * @param {address} token0Addr LPToken 交易对的 token0 地址
 * @param {address} token1Addr LPToken 交易对的 token1 地址
 * @returns LPToken
 */
async function calcMoonswapLPTokenAsset(moonLP) {
    var { cfx } = await beforeRun("mainnet", false);

    var token0 = cfx.Contract({ address: moonLP.token0.address, abi: erc20ABI });
    var token1 = cfx.Contract({ address: moonLP.token1.address, abi: erc20ABI });
    var pair = cfx.Contract({ address: moonLP.pair, abi: erc20ABI });

    var poolBalance0 = await token0.balanceOf(moonLP.pair);
    var poolBalance1 = await token1.balanceOf(moonLP.pair);

    var totalSupply = await pair.totalSupply();
    var amount0 = poolBalance0 * (10n ** 18n) / totalSupply;
    var amount1 = poolBalance1 * (10n ** 18n) / totalSupply;
    return { amount0, amount1 };
}

/**
 *
 *
 * const sponsor_contract = cfx.Contract({
        abi: require("./SponsorWhitelistControl.json").abi,
        address: "0x0888000000000000000000000000000000000001"
    })
 */
const ZEROADDR = "cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw";

async function enableAllSponsor() {

    var list = deploy.loadAllContract();
    for (var item of list) {
        console.log(item.name, item.address);
        await sponsor(item.address);
    }

}
const format = require('js-conflux-sdk/src/util/format'); const { Conflux } = require('js-conflux-sdk');
const helpEnv = require('../helpEnv');
;

async function sponsor(contractAddress) {


    const sponsor_contract = cfx.InternalContract('SponsorWhitelistControl');

    console.log("contract:", contractAddress);

    var hexAddr = format.hexAddress(contractAddress);
    var currentSponr = await sponsor_contract.getSponsorForGas(contractAddress);
    if (currentSponr == ZEROADDR) {
        console.log("申请赞助中")
        await cfx.sendTransaction({
            from: deployer,
            to: "cfxtest:ach6shr7b2fx124t15xctfz0n2e6v9j31ae8gv71pa",
            data: `0x9c27c7e1000000000000000000000000${hexAddr.substr(2)}`,
        }).executed();
    } else {
        console.log("已有赞助：", currentSponr)
    }
    var isAllWhitelisted = await sponsor_contract.isAllWhitelisted(contractAddress);
    if (!isAllWhitelisted) {
        console.log("开启全白名单")
        await deploy.send(sponsor_contract.addPrivilegeByAdmin(contractAddress, ["cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw"]), { from: deployer });
    } else {
        console.log("白名单已开启，不重复处理")
    }
}
async function claimFTokens(poolName) {
    var pool = deploy.loadContract(poolName);
    var pk = cfx.wallet.addPrivateKey("0xD90BF801F6F9EAB06779AB7CFDAA9D005C2C27806E6AE81D7C42999EDB6FC36B")
    deploy.send(
        pool.claim(), { from: pk }
    )

}

async function supplyToFlux(poolName) {

    // await deploy.setPrice({ "cWBTC": 5000 })

    // await deploy.createMarket("Flux WBTC", "fWBTC", "cWBTC");

    // await deploy.enableMarket("fWBTC", 1.4);

    var pool = deploy.loadContract(poolName);

    deploy.send(
        pool.supplyToFlux(), { from: admin }
    )


}

async function searchMyStake(poolName, user) {
    var pool = deploy.loadContract(poolName);

    var token = await pool.token();
    var tokenERC20 = deploy.warpERC20(token);

    console.log("Available to stake:", (await tokenERC20.balanceOf(user)).toAmount());

    const maxUint256 = (2n ** 256n - 1n).toString();
    console.log("My Staked:", (await pool.stakeAmountAt(user, maxUint256.toString())).toAmount());

}

async function removeStakePool(name) {
    var pool = deploy.loadContract(name);
    var fluxApp = deploy.loadContract("FluxApp");

    await deploy.send(fluxApp.setStakePoolStatus(pool.address, false), { from: admin })
    await deploy.send(fluxApp.removeStakePool(pool.address), { from: admin })
}

async function refreshInterest() {
    await deploy.send(
        deploy.loadContract("FluxApp").refreshInterest(), { from: admin }
    )
}
async function searchApprove(token, holder, spender) {

    var token = deploy.warpERC20(token);

    console.log(await token.symbol(),
        "holder:", holder,
        "spender:", spender,
        "holder balance:", (await token.balanceOf(holder)).toAmount(),
        "allowance:", (await token.allowance(holder, spender)).toAmount()
    )


}

async function checkStakeSeed() {
    var fluxApp = deploy.loadContract("FluxApp");
    var fluxMint = deploy.loadContract("FluxMint");
    var pools = await fluxApp.getStakePoolList();
    console.log("-----------------stake seed")
    for (var pool of pools) {
        var seed = (await fluxMint.fluxSeeds(pool));
        if (seed != 0) {
            console.log(pool, ":", (await fluxMint.fluxSeeds(pool)).toString())
        } else {
            // await deploy.send(
            //     fluxMint.setPoolSeed(pool, 0.015 * 1e18), { from: admin }
            // )
        }
    }

    console.log("-----------------market seed")
    var markets = await fluxApp.getMarketList();
    for (var mkt of markets) {
        console.log(mkt, ((await fluxMint.fluxSeeds(mkt)).toString()))

    }

}

async function unclaimedFluxAtStake(user) {
    var search = deploy.loadContract("SearchProvider");
    var fluxMint = deploy.loadContract("FluxMint");
    var result = await search.unclaimedFluxAtStake(user);

    //
    var last = (await cfx.getStatus()).blockNumber;
    // console.log("calcFluxsMined:", (await fluxMint.calcFluxsMined(20602409, last)).toString())

    //  79813446236237799415268 * 600/ 41999643999999999999
    for (var i = 0; i < result.stakePools.length; i++) {
        var pool = result.stakePools[i];
        console.log(pool, "->", result.rewards[i].toAmount())

        // console.log("\tseed=", (await fluxMint.fluxSeeds(pool)).toString());
        // var state = await fluxMint.fluxIndexState(pool, 2);
        // var info = await fluxMint.getFluxRewards(pool, 2, user);
        // console.log("\trewards=", info.toAmount())
        // console.log("\t\state[index,block]=", state.index.toString(), state.block.toString())
        // console.log("\t\ttotalSupply=", (await deploy.loadContract(pool).totalSupply()).toString())
        // console.log("\t\balanceOf=", (await deploy.loadContract(pool).balanceOf(user)).toString())

        // var data2 = await fluxMint.getFluxMintInfo(pool, 2, user);
        // console.log("seed=", data2.seed.toString(),
        //     "blockNumber=", data2.blockNumber.toString(),
        //     "index=", data2.index.toString(),
        //     "userIndex", data2.userIndex.toString())
        // break;
    }
}

async function loadLogs(pool) {
    var fluxMint = deploy.loadContract("FluxMint");


    console.log(await cfx.getStatus())

    var eventId = fluxMint.FluxMintIndexChanged.signature;
    var logs = await cfx.getLogs({
        fromEpoch: 16480786, address: fluxMint.address,
        topics: [eventId]
    })

    // await deploy.send(
    //     fluxMint.changeWeights(40, 40, 0, 1000, 1500), { from: admin }
    // )
    // await deploy.send(fluxMint.refreshFluxMintIndex(), { from: admin })


    console.log((await fluxMint.borrowFluxWeights()).toString());
    console.log((await fluxMint.supplyFluxWeights()).toString());
    for (var event of logs) {
        var obj = fluxMint.abi.decodeLog(event).object;
        console.log("pool:", obj.pool, "kind:", obj.kind.toString(),
            "factor:", obj.factor ? obj.factor.toString() : "-",
            "weights:", obj.weights ? obj.weights.toString() : "-",
            "from::", obj.startBlock.toString(),
            "end::", obj.endBlock.toString(),
            "send::", obj.seed.toString(),
            "fluxs::", obj.fluxMinted.toString(),

            "oldIndex:", obj.oldIndex.toString(), "newIndex:", obj.newIndex.toString());
    }
    // console.log(logs);

    // FluxMintIndexChanged

}

async function fluxMintDeail(fluxMint, pool, kind, user) {
    console.log("\tseed=", (await fluxMint.fluxSeeds(pool)).toString());
    var state = await fluxMint.fluxIndexState(pool, kind);
    console.log("\tstate[index,block]=", state.index.toString(), state.block.toString())

    console.log("\ttotalSupply=", (await deploy.loadContract(pool).totalSupply()).toString())
    console.log("\tbalanceOf=", (await deploy.loadContract(pool).balanceOf(user)).toString())
    var info = await fluxMint.getFluxRewards(pool, kind, user);
    console.log("\trewards=", info.toAmount())

    // var data2 = await fluxMint.getFluxMintInfo(pool, kind, user);
    // console.log("seed=", data2.seed.toString(),
    //     "blockNumber=", data2.blockNumber.toString(),
    //     "index=", data2.index.toString(),
    //     "userIndex", data2.userIndex.toString())
}

async function getPrice(token) {
    var oracle = deploy.loadContract("Oracle");

    console.log(
        "oracle:", oracle.address,
        "token:", token,
        "tokenPrice:", (await oracle.getPriceMan(token)).toAmount()
    )

}

async function setPrice(tokenName, price) {
    var oracle = deploy.loadContract("Oracle");
    // oracle.
    var token = deploy.loadContract(tokenName);

    var result = await deploy.send(oracle.setPrice(token.address, price * 1e18), { from: admin })
    console.log("ok");
}


async function seedCheck() {
    var fluxMint = deploy.loadContract("FluxMint");

    var list = deploy.loadMarkets();
    for (var mkt of list) {
        console.log(await mkt.name(), (await fluxMint.fluxSeeds(mkt.address)).toString())
    }
}

async function claimFlux() {
    var user = "";

    var fluxMint = deploy.loadContract("FluxMint");


    var options = { from: admin };
    // gas,price,....
    var tx = await deploy.send(fluxMint.claimFlux(), options);
}

async function fluxBlance(user) {
    var searchProvider = deploy.loadContract("SearchProvider");


    console.log("===>unclaimedFlux:", (await searchProvider.unclaimedFlux(user)).toAmount())
    console.log("===>Flux Wallet Balance:", (await deploy.loadContract("cFLUX").balanceOf(user)).toAmount())


    var result = await searchProvider.unclaimedFluxAtLoan(user)

    for (var i = 0; i < result.markets.length; i++) {
        var mkt = result.markets[i];
        console.log("mkt:", mkt,
            await deploy.warpERC20(mkt).name(),
            "bySupply:", (result.bySupply[i].toAmount()).toString(),
            "byBorrow:", (result.byBorrow[i].toAmount()).toString())
    }
}

async function stakeActions() {
    var user = cfx.Account("0xD90BF801F6F9EAB06779AB7CFDAA9D005C2C27806E6AE81D7C42999EDB6FC36B")

    var token = deploy.loadContract("cETH-FLUX")
    var stake = deploy.loadContract("stake_cETH-FLUX")
    var balance = await token.balanceOf(user.address);
    console.log("balance:", balance.toAmount())
    // await token.mint(user.address, 1000 * 1e18).sendTrancation({ from: user }).excuted();
    // var tx1 = await token.mint(user.address, 1000 * 1e18).sendTrancation({ from: user }).excuted();
    // console.log("tx1:", tx1.transactionHash)
    await deploy.send(token.transfer(stake.address, 0.345 * 1e18), { from: user });
    await deploy.send(stake.unStake(0.345678 * 1e18), { from: user });

}

async function getProfitabilityAtMarket(pool, user) {
    var fluxMint = deploy.loadContract("FluxMint");
    var SearchProvider = deploy.loadContract("SearchProvider");
    await fluxMintDeail(fluxMint, pool, 0, user);

    var info = await SearchProvider.loanProfitability(pool, user)
    var data = {};
    var keys = ["supplyValue", "borrowValue", "borrow", "supply", "loanIncome", "loanExpenses", "fluxIncome", "supplyAPY", "borrowAPY", "supplyFluxAPY", "borrowFluxAPY"]
    keys.forEach(k => data[k] = info[k].toString())
    console.log(data)
}

async function getProfitability(user) {
    console.log("user:", user);
    var fluxApp = deploy.loadContract("FluxApp");
    var fluxMint = deploy.loadContract("FluxMint");
    // FluxApp public core;
    // FluxMint public fluxMiner;
    // IPriceOracle public oracle;
    // address public fluxToken;
    var SearchProvider = deploy.loadContract("SearchProvider");

    var info = await SearchProvider.getProfitability(user)
    console.log(Object.keys(info))
    console.log("NET APY:", (info.apy.toString() / 1e18).toPrecision(2), "value=", info.apy.toString());
    var keys = ["markets", "supply", "borrow", "supplyAPYs", "supplyFluxAPYs", "borrowAPYs", "borrowFluxAPYs"]
    for (var i = 0; i < info.markets.length; i++) {
        var data = {};
        keys.forEach(k => data[k] = info[k][i].toString())
        var poolAddress = deploy.formatArgs(info.markets[i])[0];
        var pool = deploy.loadContract(poolAddress);

        console.log(pool.name, data)
    }

    console.log("===>unclaimedFlux:", (await SearchProvider.unclaimedFlux(user)).toAmount())
    console.log("===>Flux Wallet Balance:", (await deploy.loadContract("cFLUX").balanceOf(user)).toAmount())

    var fluxUnClaimed = await SearchProvider.unclaimedFluxAtLoan(user);
    var keys = ["markets", "bySupply", "byBorrow"]
    for (var i = 0; i < fluxUnClaimed.markets.length; i++) {
        var poolAddress = deploy.formatArgs(fluxUnClaimed.markets[i])[0];
        var pool = deploy.loadContract(poolAddress);

        var data = {};
        keys.forEach(k => data[k] = fluxUnClaimed[k][i].toString())
        console.log(pool.name, data)
        // await fluxMintDeail(fluxMint, fluxUnClaimed.markets[i], 0, user);
    }

    // 0.0125


    var list2 = await SearchProvider.unclaimedFluxAtStake(user);
    for (var i = 0; i < list2.stakePools.length; i++) {

        var poolAddress = deploy.formatArgs(list2.stakePools[i])[0];
        var pool = deploy.loadContract(poolAddress);

        console.log(`pool:${pool.name}- ${poolAddress},rewards:${list2.rewards[i].toAmount()}`)
    }

    // return;


    var list = deploy.loadMarkets();

    var keys = ["supplyValue", "borrowValue", "borrow", "supply", "loanIncome", "loanExpenses", "fluxIncome", "supplyAPY", "borrowAPY", "supplyFluxAPY", "borrowFluxAPY"]
    for (var mkt of list) {
        console.log(await mkt.name())
        try {
            if (mkt != "0x83b4b1cff53d8fb93524d68cfd442d13744cf695") {
                continue;
            }
            var info = await SearchProvider.loanProfitability(mkt.address, user)
            var data = {};
            keys.forEach(k => data[k] = info[k].toString())
            console.log(data)
        } catch (err) {
            var info = await mkt.getAcctSnapshot(user);
            console.log(info.ftokens.toString(), info.borrows.toString(), info.xrate.toString())
            console.log("--->", err.message)
        }
    }


    // var stakePools = await fluxApp.getStakePoolList();
    // for(var pool of stakePools){

    // }

}

async function rebaseStakePool(poolName) {
    var pool = deploy.loadContract(poolName);

    await deploy.send(pool.rebase("0x4D1369afeD6CC1Ffe8d8A68C00Ef61e00CE02Ba6", 1000 * 1e18), { from: admin })

}

main().catch(e => console.error("error:", e));
