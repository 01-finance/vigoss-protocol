const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;

    await removeAllStoppedStake();

    // await deploy.setPrice({ "cFLUX": 0.000000000000000001 })
    // await enableNewTime()

    // await stopSeed()

    // await sendFluxToTeam();
    // await addPriceFeeder("cfx:aapdbvjr18yw0mnpm11xbnk5bv118rcm7u5jj9v7bn")
    // await resetCollRatio(deploy.loadContract("market_fCMBTM").address, 1.4)

    // await claimFtoken("cCUSDC","fUSDC",
    // [
    // "cfx:aarjcuguhw7780yw2905ym5r3wwz2zg54jhkjwmjny",
    // "cfx:aaj84ke7svxr9uh780gcnkvtmhj28rzjpucduhfspg",
    // "cfx:aamz4502d62j63ehd78vtxkc2tv8x0m7x2z7dshjk6",
    // "cfx:aat9w2rw2sp4hfakkcss6dynpcz945mxvj08uapjr5"
    // ])
    // await claimFtoken("cCWBTC","fCWBTC",
    // [
    //     "cfx:aamz4502d62j63ehd78vtxkc2tv8x0m7x2z7dshjk6",
    //     "cfx:aat9w2rw2sp4hfakkcss6dynpcz945mxvj08uapjr5",
    //     "cfx:aatk1b6t9ezgn6m9gsj6fdzn8wn3dkphganmnngb5f",
    // ])

    // await refreshMarkeFluxSeed()

    // await setTax();
}


async function removeAllStoppedStake() {

    for (var pool of deploy.loadStakePools()) {

        var stopped = await pool.stakeStopped();
        console.log(`${pool.fileName}, ${stopped}`)
        if (stopped === true) {
            console.log(`will remove ${pool.fileName}`)
            if (pool.fileName == "stake_cAUSDC") {
                await removeStakePool(pool.address)
            }
        } else {
            console.log(`keep  ${pool.fileName}`)
        }
    }

}

async function removeStakePool(poolAddress) {

    var fluxApp = deploy.loadContract("FluxApp");

    // var pool = deploy.loadContract("stake_" + name)


    // var list = await fluxApp.getStakePoolList();
    // console.log("list: before ", list);

    try {
        await deploy.send(fluxApp.setStakePoolStatus(poolAddress, false), { from: admin });
    } catch (error) {
        console.log("error")
    }
    try {
        await deploy.send(fluxApp.removeStakePool(poolAddress), { from: admin });
    } catch (error) {
        console.log(error)
        // await fluxApp.callStatic.removeStakePool(poolAddress);
    }

    var list = await fluxApp.getStakePoolList();
    console.log("list: after ", list);
}

async function enableNewTime() {
    var fluxMint = deploy.loadContract("FluxMint")
    var fluxApp = deploy.loadContract("FluxApp")


    await refreshMarkeFluxSeed();

    // 存 4%，借6%
    await deploy.send(fluxMint.changeWeights(400, 600, 0, 1000, 1500), { from: admin })

    // 启动新抵押池
    var cFLUXCFX = "cfx:acfs0x9vkkf9gk8m4kuzshh2mbgbdb2sga7j5b23h7"
    var cUSDTcFLUX = "cfx:achu45xa8tsvycerpj0g7jj93r7nhd7ybpb8n804m6"
    await deploy.send(fluxApp.stakePoolApprove(cFLUXCFX, 7.5 / 100 * 1e18), { from: admin });
    await deploy.send(fluxApp.stakePoolApprove(cUSDTcFLUX, 7.5 / 100 * 1e18), { from: admin });
}

async function addPriceFeeder(address) {
    var oralce = deploy.loadContract("Oracle")
    await deploy.send(oralce.approveFeeder(address), { from: admin })
}


async function setTax() {
    // const user = "cfx:aapfp8vaccnfv9swy9sbuf1zhjyhbdac72jg1sum7n" robin
    const user = "cfx:aarduu82w3b6gxcsbrg3z972w1xhn51srpazv55jf9"//crisis
    for (var mkt of deploy.loadMarkets()) {
        var token = deploy.warpERC20(await mkt.underlying());
        var balance = await token.balanceOf(mkt.address);

        var tax = (await mkt.taxBalance())
        // console.log(`${mkt.fileName},借款=${(await mkt.totalBorrows()).toAmount()},利差：${tax}`)

        try {
            if (tax > 0) {
                var amount = tax > balance ? balance : tax;
                await deploy.send(mkt.withdrawTax(user, amount), { from: admin })
                console.log(`${mkt.fileName},借款=${(await mkt.totalBorrows()).toAmount()},利差：${tax}，已取利差：${amount.toAmount()}`)
            }
        } catch (err) {
            console.log(mkt.fileName, err.message)
        }
    }
}


async function claimFtoken(poolName, ftokenName, users) {

    // var pool = deploy.loadContract("stake_"+poolName)
    var ftoken = deploy.loadContract("market_" + ftokenName)
    // var total=await ftoken.balanceOf(pool.address)
    var fluxMint = deploy.loadContract("FluxMint")

    for (var user of users) {
        await deploy.send(fluxMint.settleOnce(ftoken.address, 1, user), { from: admin });
        // var b= await ftoken.balanceOf(user)
        // var want=(await pool.unclaimedFTokens(user)).amount0
        // await deploy.send(pool.claim(user),{from:admin})
        // var b2= await ftoken.balanceOf(user)

        // console.log(pool.fileName,total.toAmount(),user,
        // "before",b.toString()/1e18,
        // "after:",b2.toString()/1e18,
        // "add=",(b2-b).toString()/1e18,
        // "want=",want.toAmount() )
    }

    // console.log( "end:",await ftoken.balanceOf(pool.address))
}

async function check() {
    var pool = deploy.loadContract("stake_cAWBTC")
    console.log(await pool.underlyingToken1())

    var t1 = deploy.warpERC20(await pool.underlyingToken0())
    console.log(t1.address, await t1.name())

    var btc = deploy.loadContract("cWBTC")
    console.log(btc.address, await btc.name())

    var fluxApp = deploy.loadContract("FluxApp")

    console.log(await fluxApp.supportTokens(t1.address))

    var btcMarket = deploy.loadContract("market_fBTC")
    console.log(" underyling:", await btcMarket.underlying(), "status:", await fluxApp.marketStatus(btcMarket.address))
}

async function stopSeed() {
    // await refreshMarkeFluxSeed();
    var fluxMint = deploy.loadContract("FluxMint")
    // for (var pool of deploy.loadStakePools()) {
    //     await deploy.send(fluxMint.setPoolSeed(pool.address, 0), { from: admin })
    // }

    // 也就是： 借款：27%+19=46，存款 18%+11=29
    // 存款(10%)	借款(15%)'
    await deploy.send(fluxMint.changeWeights(1500, 1000, 0, 1000, 1500), { from: admin })
}


async function canCalimedFTokens(poolName, user) {
    var pool = deploy.loadContract("stake_" + poolName)

    var result = await pool.canCalimedFTokens(user, 1);
    console.log(
        result.locked.toString() / 1e18,
        result.amount0.toString() / 1e18,
        result.amount1
    )
}

async function supplyToFlux(poolName, mktName) {
    var pool = deploy.loadContract("stake_" + poolName)
    var token = deploy.warpERC20(await pool.underlyingToken0());
    var balance = (await token.balanceOf(pool.address))
    console.log(pool.fileName, (await token.symbol()), "before", "pool balance:", balance.toString())

    // address mkt = fluxApp.supportTokens(address(underlying));

    // await deploy.send(
    //     pool.supplyToFlux(),{from:admin}
    // )

    var mkt = deploy.loadContract("market_" + mktName)
    console.log(pool.fileName, (await token.symbol()), "Underlying=", balance.toString() / 1e18,
        "ftokens=", (await mkt.balanceOf(pool.address)).toString() / 1e18)
}

async function sendToStakePool(sendAmounts) {

    for (var key of Object.keys(sendAmounts)) {
        var pool = deploy.loadContract("stake_" + key)
        var amount = sendAmounts[key]

        var token = deploy.warpERC20(await pool.underlyingToken0());
        console.log(pool.address)

        console.log(pool.fileName, (await token.symbol()),
            "before",
            "pool balance:", (await token.balanceOf(pool.address)).toString(),
            "admin balance:", (await token.balanceOf(admin.address)).toString())

        await deploy.send(
            token.transfer(pool.address, (amount * 1e18).toStr()), { from: admin }
        )

        console.log(pool.fileName, (await token.symbol()),
            "after",
            "pool balance:", (await token.balanceOf(pool.address)).toString(),
            "admin balance:", (await token.balanceOf(admin.address)).toString())
    }

}

async function balanceCheck() {
    for (var token of ["cETH", "cDAI", "cUSDC", "cWBTC"]) {
        var t = deploy.loadContract(token)
        console.log(token, (await t.balanceOf(admin.address)).toString() / 1e18)
    }
}

async function withdrawLP() {
    for (var pool of deploy.loadStakePools()) {
        console.log(pool.fileName)
        var token = deploy.warpERC20(await pool.token());
        var balance = await token.balanceOf(admin.address);
        console.log(pool.fileName, token.address, balance.toString())
        // await deploy.send(pool.redeemLP(),{from:admin})

        // var balance2=await token.balanceOf(admin.address);
        // console.log(pool.fileName,"before",balance, balance2, "redeemCount:",(balance2-balance).toString())
    }
}

async function updateMarketStatus(market, stop) {

    var mkt = deploy.loadContract("market_" + market);
    var fluxApp = deploy.loadContract("FluxApp")
    await deploy.send(
        fluxApp.setMarketStatus(mkt.address, stop ? 2 : 1), { from: admin }
    )
    // await resetCollRatio(deploy.loadContract("market_fCMBTM").address, 7)
}

async function setStakeStatus(open) {

    for (var pool of deploy.loadStakePools()) {
        console.log(pool.fileName, await pool.stakeStopped())
        await deploy.send(
            open ? pool.openStake() : pool.stopStake(), { from: admin }
        )
        console.log("\t after:", await pool.stakeStopped())

    }
}

async function stopStake() {

    for (var pool of deploy.loadStakePools()) {
        console.log(pool.fileName, "stopping")
        await deploy.send(
            pool.stopStake(), { from: admin }
        )
    }
}

async function updateStakePoolVersion() {

    await deploy.deplowUseProxy("StakePool", { from: deployer }, [], false, "stakeImpl");

    var impl = deploy.loadContract("stakeImpl")

    //update
    for (var pool of deploy.loadStakePools()) {
        await deploy.upgradeTo(pool.address, impl.address)
    }
}

async function resetTeamAdress() {
    // await sendFluxToTeam();


    var fluxMint = deploy.loadContract("FluxMint");

    var team = await fluxMint.teamFluxReceive();
    var community = await fluxMint.communityFluxReceive();
    console.log(`old team:${team}, comm:${community}`)

    //     团队账户
    // cfx:aamu9dv1gp467bkenn8brfwuffsdwvrkcpjxtjrc73
    // 社区账户
    // cfx:aam897xyy9k5ph2wzz69mx4fjhssdyue1emgt24xez

    await deploy.send(fluxMint.resetTeamAdress("cfx:aamu9dv1gp467bkenn8brfwuffsdwvrkcpjxtjrc73", "cfx:aam897xyy9k5ph2wzz69mx4fjhssdyue1emgt24xez"), { from: admin })


    team = await fluxMint.teamFluxReceive();
    community = await fluxMint.communityFluxReceive();
    console.log(`new team:${team}, comm:${community}`)
}

async function changeWeights() {

    var fluxMint = deploy.loadContract("FluxMint");

    console.log((await fluxMint.borrowFluxWeights()).toString())
    console.log("supplyFluxWeights:", (await fluxMint.supplyFluxWeights()).toString())
    console.log("teamFluxWeights:", (await fluxMint.teamFluxWeights()).toString())
    console.log("communityFluxWeights:", (await fluxMint.communityFluxWeights()).toString())

    await refreshMarkeFluxSeed();

    // 也就是： 借款：27%，存款 18%
    await deploy.send(fluxMint.changeWeights(2700, 1800, 0, 1000, 1500), { from: admin })
    console.log((await fluxMint.borrowFluxWeights()).toString())
    console.log("supplyFluxWeights:", (await fluxMint.supplyFluxWeights()).toString())
    console.log("teamFluxWeights:", (await fluxMint.teamFluxWeights()).toString())
    console.log("communityFluxWeights:", (await fluxMint.communityFluxWeights()).toString())
}
async function refreshMarkeFluxSeed() {
    var fluxMint = deploy.loadContract("FluxMint");

    var status = async function () {
        for (var mkt of deploy.loadMarkets()) {
            var v = (parseFloat(await fluxMint.fluxSeeds(mkt.address)) / 1e18).toPrecision(5)
            console.log(`\t${mkt.fileName}: ${v}%`)
        }
    }

    console.log("update before:")
    await status();

    var fluxApp = deploy.loadContract("FluxApp");
    await deploy.send(fluxApp.refreshMarkeFluxSeed(), { from: admin });

    console.log("update after:")
    await status();

    setTimeout(refreshMarkeFluxSeed, 1000 * 60)

    console.log("send once");
}

async function sendFluxToTeam() {

    var fluxMint = deploy.loadContract("FluxMint");

    var team = await fluxMint.teamFluxReceive();
    var community = await fluxMint.communityFluxReceive();
    console.log(`team:${team}, comm:${community}`)

    var flux = deploy.loadContract("cFLUX");
    var balance1 = await flux.balanceOf(team)
    var balance2 = await flux.balanceOf(community)

    //
    await deploy.send(fluxMint.claimDaoFlux(), { from: admin })

    var balance1_after = await flux.balanceOf(team)
    var balance2_after = await flux.balanceOf(community)

    console.log(`team: ${team} ${(balance1_after - balance1).toString() / 1e18}`)
    console.log(`community:${community}, ${(balance2_after - balance2).toString() / 1e18}`)
}

async function setBorrowLimit(item) {
    var fluxApp = deploy.loadContract("FluxApp");

    var nameList = Object.keys(item);
    var markets = [];
    var oldValue = [];
    var newValue = [];
    for (var n of nameList) {
        var addr = deploy.loadContract(n).address;
        markets.push(addr)
        newValue.push(item[n] * 1e18)

        var before = await fluxApp.poolBorrowLimit(addr);
        console.log(`makret ${n} ${addr},before=${before.toString() / 1e18},now to set = ${item[n]}`)
    }



    await deploy.send(
        fluxApp.setBorrowLimit(
            markets,
            newValue
        )
        , { from: admin }
    );
}

async function resetCollRatio(makret, ratio) {
    var fluxApp = deploy.loadContract("FluxApp");

    console.log(makret, "old=", (await fluxApp.markets(makret)).collRatioMan.toString() / 1e18, "want set to:", ratio);
    // params

    await deploy.send(deploy.loadContract("FluxApp").resetCollRatio(
        makret, ratio * 1e18
    ), { from: admin });

    console.log(makret, "now=", (await fluxApp.markets(makret)).collRatioMan.toString() / 1e18);

}

main().catch(e => console.error("error:", e));
