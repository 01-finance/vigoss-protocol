const format = require('js-conflux-sdk/src/util/format');
const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet", false);
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;



    console.log(await deploy.loadContract("LinkOracle").getPriceMan(deploy.loadContract("cFLUX").address));

    // await checkAPY();
    // 14077299995182415395111
    // 14394103149447014451753
    // 43182309448341043355259/14077299995182415395111
    // console.log( (await deploy.loadContract("FluxApp").fluxMiner()))
    // var user1 = "cfx:aap84aa9wcadpuf8b1eg6ntzt5u0vkcdxe1zhbketc";
    await detail("cfx:aat7dg2rhnsu4k0zdhd36sa72r3ebzm0c2z6ve2zep", true)

    // await detail("cfx:aam8b82ycgrw325116htvzne2fhzpwpu36466bx84t", true)

    // await deploy.loadTx("0xdc694ab534efa862e71346cb678b12a7c34f596bc940b44cb1e05438f46703fd") //last
    // CFX:TYPE
    // await getProfitability("cfx:aat0fabbe1nx8zu5gsuuyr7n0mcmusxm42es8336hj")//丢币
    // await getProfitability("cfx:aakcuz7mz077jt657v99d5p79rzpgbapnes0rttuaa")//丢币
    // await getProfitability("cfx:aarmj8fmv64yr0rwgvh0acnxk7umdrp1r695rxw9tu")//丢币
    // await getProfitability("cfx:aap776nrtfc1b3jkr69p1ur7r7hfrg6snjvx98t23u")//看不到抵押收益
    // await getProfitability("cfx:aarrx1s8pzpb95213d3jaxhx7axjxefvt6du1dfbkm")//多了
    // await getProfitability("cfx:aajrvgm3ecu5j8e3c9t2c8nb6agnsrwatjdhy4e74y")
    // await redeemTest();
    // await mintInfo("cfx:aannfga8g6v0kpy1zbx7kpydzbwwf0m5gjtunb2mr7");
    // console.log(await deploy.loadContract("FluxMint").remainFluxByUser("cfx:aajdz4npdrcjtb91vhyst8b0y0cpujfpepbxctggxu"))
    // await deploy.loadTx("0xf2a69c9ecdac5ea37912c4cc22aafe8e622beb1f511cc96e6d0e418f733216c8") //curr

    // await deploy.loadTx("0x5dfe5cb1c5d37d2fa523c215c14549ca43372c60fc582c7c591fb071bfaf3bcd")
    // await deploy.loadTx("0x888cb14b68fd0fb51b696c3ff8e1ec0bdc4aaef1e524ca988e9fe32f5ed7ce22")
    // await deploy.loadTx("0xf8959144b504303219fae5d785d29546d10f385aea8191ec375e97d3e113eebe")//我的交易

    // await dep


    // await loadPirce();

    // await searcFLUXAmount();

    // var pool = deploy.loadContract("market_fUSDC");
    // console.log("total:", (await deploy.loadContract("cUSDC").totalSupply()).toString() / 1e18)
    // console.log(pool.address.toBase32(), (await pool.totalBorrows()).toString() / 1e18)
    // console.log(pool.address.toBase32(), (await deploy.loadContract("cUSDC").balanceOf(pool.address)).toString() / 1e18)

    // var tokenContract = deploy.loadContract("cUSDC");

    // await detail("cfx:aanr5jmj0egucbae3zbf9a0d1mmneu1b2605k6erfc", true)

    // await getStakePoolList();
    // console.log(tokenContract.decimals());

    // await tryLiq("")

    // await updateStakePoolVersion();

    //  40003.30958


    // await Searc();

    // await marginCall("cfx:aajt68cvb921m1gzv0cgrw9npfxbcn91yyf0c1gkuz")
    //
    // await tryMCall("cfx:aajt68cvb921m1gzv0cgrw9npfxbcn91yyf0c1gkuz")

    // await getData();

    // await getBlockInfo("0xa04ae4ba78cca4e60128c88251863e62509761ca8c86564b85fb3dc527cbd431")

    // await getBalancOf("cfx:acfs0x9vkkf9gk8m4kuzshh2mbgbdb2sga7j5b23h7", "cfx:aakxncjgnmh9nce87wk1pb2p4d6f457rrj7eakcz81")

    // await searchPoolWeights();

    // await tokenPriceList();


    // await calcTVL();
}

async function calcTVL() {
    var pools = deploy.loadMarkets();

    var totalSupply = 0;
    var totalBorrow = 0;
    for (var pool of pools) {
        var token = deploy.warpERC20(await pool.underlying());
        var units = 10 ** ((await token.decimals()).toString());
        var cash = (await token.balanceOf(pool.address)).toString() / units;
        var borrow = (await pool.totalBorrows()).toString() / units;

        var price = (await pool.underlyingPrice()).toString() / 1e18;

        var supplyValue = (cash + borrow) * price;
        var borrowValue = borrow * price;

        totalSupply += supplyValue;
        totalBorrow += borrowValue;
        // console.log(`${await token.symbol()} supply=${supplyValue.toLocaleString()},borrow=${borrowValue.toLocaleString()} `)
        console.log(`conflux,${await token.symbol()},${supplyValue},${borrowValue}`)
    }
}

async function tokenPriceList() {
    for (var pool of deploy.loadMarkets()) {
        console.log(pool.fileName, (await pool.underlyingPrice()).toString() / 1e18)
    }
}



async function checkAPY() {

    var search = deploy.loadContract("SearchProvider");

    var method = "getLonFluxAPY(address)"
    var args = ["cfx:acfe5t6vrx3tnxfcec3jn2tw19pdjcmb3ejgxsr11a"]
    console.log(search[method](...args).data)
}

async function searchPoolWeights() {
    var fluxMint = deploy.loadContract("FluxMint")


    for (var mkt of deploy.loadMarkets()) {
        var result = await fluxMint.getPoolSeed(mkt.address)
        console.log(`${mkt.fileName}, 存款产出=${result.low.toString() / 1e18 * 100}%, 借款产出=${result.height.toString() / 1e18 * 100}%`)
    }

    for (var mkt of deploy.loadStakePools()) {
        var result = await fluxMint.getPoolSeed(mkt.address)
        console.log(`${mkt.fileName}, 存款产出=${result.low.toString() / 1e18 * 100}%, 借款产出=${result.height.toString() / 1e18 * 100}%`)
    }


}

async function getBalancOf(token, user) {
    console.log(
        await deploy.warpERC20(token).balanceOf(user)
    )
}

async function getBlockInfo(blockhash) {

    console.log(await cfx.getStatus())

    console.log(await cfx.getBlockByHash(blockhash));

}

async function getData() {

    var lp = deploy.warpERC20("cfx:achu45xa8tsvycerpj0g7jj93r7nhd7ybpb8n804m6")
    var token = deploy.warpERC20("cfx:acaf6h38bsmubxaazgpvnnyddys3e731z2hxesmyt2")

    console.log("staked:", (await token.balanceOf(lp.address)))
    console.log("total:", (await lp.totalSupply()))

}


async function Searc() {

    var fluxMint = deploy.loadContract("FluxMint")
    for (var mkt of deploy.loadMarkets()) {

        var borrowIndex = (await fluxMint.fluxIndexState(mkt.address, 0)).index
        var supplyIndex = (await fluxMint.fluxIndexState(mkt.address, 1)).index

        console.log(mkt.fileName, mkt.address, "borrow", borrowIndex.toString(), "supply", supplyIndex.toString())
    }
}


async function tryMCall(borrower) {

    var app = deploy.loadContract("FluxApp");
    var mktCount = await app.getAcctJoinedMktCount(borrower);
    var gurad = deploy.loadContract("Guard")

    for (var i = 0; i < mktCount; i++) {
        var result = await app.getJoinedMktInfoAt(borrower, i);
        var mkt = deploy.loadContract(result.mkt);

        await mkt.calcCompoundInterest().call()
        var result = await mkt.collateralKill(gurad.address, borrower).call({ from: gurad.address })
        await gurad.tryToRepay(mkt.address).call();

        await mkt.underlyingTransferOut()

        console.log(mkt.fileName, result)
    }

    await gurad.margincall(borrower).call()
}


async function searcFLUXAmount() {

    var fluxMint = deploy.loadContract("FluxMint");

    console.log(await cfx.getStatus())

    console.log(await fluxMint.calcFluxsMined(0, 25275006))//24976888

    // 162243.452549465
    // 40560.863137366
}

async function redeemTest() {

    var acct = cfx.wallet.addPrivateKey("")

    deploy.send(
        deploy.loadContract("market_fCFX").redeem(1e18), { from: acct }
    )

}

async function loadPirce() {
    var oracle = deploy.loadContract("Oracle");

    for (var mkt of deploy.loadMarkets()) {
        var token = await mkt.underlying();

        console.log(await mkt.name(), (await oracle.getPriceMan(token)).toAmount());

    }

}
// market_fDAI 6410086131115389n borrow: 6390530120116137n supply: 0n
// 5286124575149332 - 6390530120116137
async function mintInfo(user) {
    var fluxMint = deploy.loadContract("FluxMint");

    for (var mkt of deploy.loadMarkets()) {

        var state1 = await fluxMint.fluxIndexState(mkt.address, 0);


        console.log(mkt.fileName,
            // "index:", state1.index.toAmount(),
            "weight:", (parseFloat(await fluxMint.fluxSeeds(mkt.address)) / 1e18).toPrecision(5),

            // "borrowIndex:", await fluxMint.fluxMintIndex(mkt.address, user, 0),
            // "supplyIndex:", await fluxMint.fluxMintIndex(mkt.address, user, 1),
        );
    }
}

async function clear() {
    // var users = ["0x1facd95896b8c68cc8d39ed21f80c6f6a57b1206", "0x1b12058982349508a0de19d2ba59b471ca2b712c",
    //     "0x1a09462c711cd8bb3ab04127a048b9b3735e18c1", "0x17325fdb430aa19f7b543dc4d571c3d3a1a172fe",
    //     "0x168055220be35c179fdd4e5c635535eaa42d959d", "0x166ed129473e3ca693a6820681b32ef683b25073",
    //     "0x166cd224716e284ace6d2fe6dd9a27faa7a51739", "0x15544e2c6bf88623e0d7a494b5ac90627be21bd8",
    //     "0x14a3831084837f1904b4389f415aa38875622d46",
    //     "0x141d9a8d1c83fa4e0abc370a75f0b732cd90c37c", "0x13c09131f89810e575114c8185ecee22fa276bbb"]
    var users = ["0x84cc6c61f3a8f36420534c9c45ca3737d450384c"]
    for (var user of users) {
        await tryLiq(user);
    }

}


async function getProfitabilityAtMarket(pool, user) {
    var fluxMint = deploy.loadContract("FluxMint");
    var SearchProvider = deploy.loadContract("SearchProvider");
    // await fluxMintDeail(fluxMint, pool, 0, user);

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
        // console.log(poolAddress)
        var pool = deploy.loadContract(poolAddress);

        console.log(pool.fileName, data)
    }

    console.log("===>unclaimedFlux:", (await SearchProvider.unclaimedFlux(user)).toAmount())
    console.log("===>Flux Wallet Balance:", (await deploy.loadContract("cFLUX").balanceOf(user)).toAmount())

    var fluxUnClaimed = await SearchProvider.unclaimedFluxAtLoan(user);
    var keys = ["bySupply", "byBorrow"]
    for (var i = 0; i < fluxUnClaimed.markets.length; i++) {
        var poolAddress = deploy.formatArgs(fluxUnClaimed.markets[i])[0];
        var pool = deploy.loadContract(poolAddress);

        var data = {};
        keys.forEach(k => data[k] = fluxUnClaimed[k][i].toAmount())
        console.log(pool.fileName, data)
        // await fluxMintDeail(fluxMint, fluxUnClaimed.markets[i], 0, user);
    }

    // 0.0125


    var list2 = await SearchProvider.unclaimedFluxAtStake(user);
    console.log("user:", user)
    for (var i = 0; i < list2.stakePools.length; i++) {

        var poolAddress = deploy.formatArgs(list2.stakePools[i])[0];
        var pool = deploy.loadContract(poolAddress);

        var staked = await pool.balanceOf(user)

        console.log(`pool:${pool.fileName}- ${poolAddress},staked:${staked.toAmount()}, rewards:${list2.rewards[i].toAmount()}`)
    }

    // return;


    // var list = deploy.loadMarkets();

    // var keys = ["supplyValue", "borrowValue", "borrow", "supply", "loanIncome", "loanExpenses", "fluxIncome", "supplyAPY", "borrowAPY", "supplyFluxAPY", "borrowFluxAPY"]
    // for (var mkt of list) {
    //     console.log(await mkt.name())
    //     try {

    //         var info = await SearchProvider.loanProfitability(mkt.address, user)
    //         var data = {};
    //         keys.forEach(k => data[k] = info[k].toString())
    //         console.log(data)
    //     } catch (err) {
    //         var info = await mkt.getAcctSnapshot(user);
    //         console.log(info.ftokens.toString(), info.borrows.toString(), info.xrate.toString())
    //         console.log("--->", err.message)
    //     }
    // }


    // var stakePools = await fluxApp.getStakePoolList();
    // for(var pool of stakePools){

    // }

}

async function getStakePoolList() {
    const crosschain = require('conflux-crosschain');
    var stakePools = await deploy.loadStakePools();
    for (var pool of stakePools) {
        var addr = format.hexAddress(pool.address)
        console.log(addr)
        var got = await crosschain.getUserReceiveWalletEth(
            addr,
            "0x0000000000000000000000000000000000000000",
            "https://shuttleflow.io");
        console.log(`${pool.fileName}(${pool.address}) -> ethereum: ${got}`)
    }
}

var tokens = {
    "cDAI": "0x87929dda85a959f52cab6083a2fba1b9973f15e0",
    "cUSDT": "0x8b8689c7f3014a4d86e4d1d0daaf74a47f5e0f27",
    "cETH": "0x86d2fb177eff4be03a342951269096265b98ac46",
}
async function guradTest() {

    var guard = deploy.loadContract("Guard");

    // var mkt = "0x852dedfe1e87ed3d898552797df500008bd5b0b4";
    var midToken = tokens["cETH"];
    var user = "0x166CD224716e284ACe6d2FE6dd9A27Faa7A51739";
    var flag = 2;
    var router = moonSwapRouter();

    var mkts = deploy.loadMarkets();
    for (var mkt of mkts) {
        var info = await mkt.getAcctSnapshot(user);
        if (info.ftokens / 1e18 > 0) {
            var inputToken = deploy.warpERC777(await mkt.underlying());
            var symbol = await inputToken.symbol();
            var amountIn = await mkt.collateralKill(user).call({ from: guard.address })
            console.log(symbol, amountIn / 1e18)
            try {
                // console.log("\tallowance:", ((await inputToken.allowance(guard.address, router.address)) / 1e18).toPrecision(3));
                console.log(await router.getReserves(await router.factory(), inputToken.address, midToken));
                console.log(await router.getAmountsOut(1e18, [inputToken.address, midToken]))
                await guard.testOne(mkt.address, midToken, user, flag).call({ from: admin.address })
                console.log("\t swap to cETH OK");
            } catch (error) {
                console.log("\t", error.message);
            }
        }
    }

}

async function refreshInterest() {
    await deploy.send(
        deploy.loadContract("FluxApp").refreshInterest(), { from: admin }
    )
}

async function tryToRepay() {
    var guard = deploy.loadContract("Guard");
    var address = guard.address;
    var mkts = deploy.loadMarkets();
    for (var mkt of mkts) {
        var info = await mkt.getAcctSnapshot(address);
        var underlying = deploy.warpERC20(await mkt.underlying());
        console.log(await mkt.name(), mkt.address,
            info.borrows.toString(),
            (await underlying.balanceOf(address)).toString())
        if (info.borrows / 1e18 > 0) {

            try {
                await deploy.send(guard.tryToRepay(mkt.address), { from: admin })
            } catch (error) {
                console.log("failed,", info.borrows.toString(), error.message ? error.message : error);
            }
        }
    }
    // await detail(guard.address)
}

async function tryLiq(user) {
    //
    await detail(user);

    var guard = deploy.loadContract("Guard");

    await deploy.send(guard.margincall(user), { from: admin })

    // console.log("after:user")
    await detail(user);

    console.log("after:guard")
    await detail(guard.address);
}

async function swapTest() {
    var router = moonSwapRouter();
    var cDAI = "0x87929dda85a959f52cab6083a2fba1b9973f15e0";
    var cUSDT = "0x8b8689c7f3014a4d86e4d1d0daaf74a47f5e0f27";
    var cETH = "0x86d2fb177eff4be03a342951269096265b98ac46";
    var amountIn = 1e18;
    var user = "0x84cc6c61f3a8f36420534c9c45ca3737d450384c";// "0x15A052bF09645D56069402e0F388Daef2a757635";
    var inputToken = cUSDT;
    console.log("cDAI balance :", (await deploy.warpERC777(inputToken).balanceOf(user)) / 1e18)
    console.log("allowance:", ((await deploy.warpERC777(inputToken).allowance(user, router.address)) / 1e18).toPrecision(3))

    var path = [inputToken, cETH];

    try {
        var amount = await router.getAmountsOut(amountIn, path).call({ from: user, gas: 1e22 });
        console.log("getAmountsOut:", amount.toString());
    } catch (error) {
        console.log("getAmountsOut:", error.message);
    }
    try {
        amount = await router.swapExactTokensForTokens(amountIn, 1, path, user, 1e22).call({ from: user });
        console.log("swapExactTokensForTokens:", amount.toString());
    } catch (error) {
        console.log("swapExactTokensForTokens:", error.message);
    }
}

function moonSwapRouter() {
    return cfx.Contract({
        address: "0x80ae6a88ce3351e9f729e8199f2871ba786ad7c5",
        abi: IUniswapV2Router02.abi
    })
}


async function detail(address, showDetail) {

    var result = await deploy.loadContract("FluxApp").getAcctSnapshot(address)


    console.log(
        address,
        "borrowValue:", result.borrowValueMan.toString(),
        "supplyValue:", result.supplyValueMan.toString(),
        "borrowLimit", result.borrowLimitMan.toString(),
        "collateral:", (result.supplyValueMan.toString() / result.borrowValueMan.toString()).toPrecision(4),
        "borrow>limit?", result.borrowValueMan > result.borrowLimitMan
    )
    if (showDetail) {
        var mkts = deploy.loadMarkets();
        for (var mkt of mkts) {
            var info = await mkt.getAcctSnapshot(address);

            console.log(
                await mkt.name(),
                // await mkt.underlying(),
                "汇率：", info.xrate.toString() / 1e18,
                "存款：", info.ftokens.toString() * info.xrate.toString() / 1e18 / 1e18,
                "借款：", info.borrows.toString() / 1e18,
                "ctoken balance:", (await deploy.warpERC20(await mkt.underlying()).balanceOf(address)).toAmount()
            )
        }
    }

}




main().catch(e => console.error("error:", e));