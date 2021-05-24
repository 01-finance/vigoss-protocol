const { ethers } = require('ethers');
const beforeRun = require('../helpEnv')
var provider;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet");
    provider = env.provider; deployer = env.deployer; admin = env.admin; deploy = env.deploy;

    var liquidator = "cfx:aam4ayz9bfwf4zugwubsb66j5n1wy7n0gyxaumx6un"

    // fillTokenForMarginCall
    // await margincallInfo("cfx:aan8vdban927jj28bycmcketfzay1nntget07gusrj")
    // await margincallInfo("cfx:aartgkm1uvpbnnr1dpj1nt7z11de5jfrzpyuhz7gwp")

    await execMargincall("cfx:aajt68cvb921m1gzv0cgrw9npfxbcn91yyf0c1gkuz")
}

async function execMargincall(borrower) {
    var guard = deploy.loadContract("Guard")

    await deploy.send(
        guard.margincall(borrower), { from: admin }
    )
}

async function margincallInfo(borrower) {
    var guard = deploy.loadContract("Guard")

    var result = await deploy.loadContract("FluxApp").getAcctSnapshot(borrower)


    console.log(
        borrower,
        "borrowValue:", result.borrowValueMan.toAmount(),
        "supplyValue:", result.supplyValueMan.toAmount(),
        "borrowLimit", result.borrowLimitMan.toAmount(),
        "collateral:", (result.supplyValueMan.toString() / result.borrowValueMan.toString()).toPrecision(4),
        "allowLiq", result.borrowValueMan == 0 ? 0 : result.supplyValueMan / result.borrowValueMan <= 1.01
    )
    var mkts = deploy.loadMarkets();
    for (var mkt of mkts) {
        var info = await mkt.getAcctSnapshot(borrower);

        if (info.ftokens == 0 && info.borrows == 0) {
            continue;
        }

        var underlying = deploy.warpERC20(await mkt.underlying())
        console.log("\t",
            await mkt.name(),
            // await mkt.underlying(),
            "\n\t\t存款：", (info.ftokens.toString() * info.xrate.toString()),
            "\n\t\t借款：", info.borrows.toAmount(),
            "\n\t\tMarketBalance：", (await underlying.balanceOf(mkt.address)).toAmount(),
            "\n\t\t Guard钱包：", (await underlying.balanceOf(guard.address)).toAmount(),
        )
    }

}


async function fillTokenForMarginCall(borrower, doer) {
    var mkts = deploy.loadMarkets();
    console.log("repre for borrower", borrower)
    for (var mkt of mkts) {
        var info = await mkt.getAcctSnapshot(borrower);

        var token = deploy.warpERC20(await mkt.underlying())

        var underlying = deploy.loadContract("token_" + (await token.symbol())).connect(admin)
        console.log(await underlying.name(), await underlying.symbol(), token.address)
        console.log("\t",
            await mkt.name(),
            "Underlying:", await token.symbol(),
            "存款：", info.ftokens.toString() * info.xrate.toString(),
            "借款：", info.borrows.toString(),
        )
        if (info.borrows > 0) {
            var balance = await underlying.balanceOf(doer);
            if (info.borrows.gt(balance)) {
                var sub = info.borrows.sub(balance);
                console.log(`\t need some : sub=${sub} `)
                if (underlying.mint) {
                    await deploy.waitTx(await underlying.mint(doer, sub, { gasPrice: 21 * 1e9 }))
                } else {
                    await deploy.waitTx(await underlying.deposit({ value: sub }))
                    await deploy.waitTx(await underlying.transfer(guard.address, sub))
                }
            }
            console.log("\t Market Underlying  Balance:", (await underlying.balanceOf(mkt.address)).toString())
        }
        console.log("\t doer Underlying  Balance:", (await underlying.balanceOf(doer)).toString())
    }
}



async function liquidateInfo(address, liquidator) {
    var guard = deploy.loadContract("Guard")

    var result = await deploy.loadContract("FluxApp").getAcctSnapshot(address)


    console.log(
        address,
        "borrowValue:", result.borrowValueMan.toAmount(),
        "supplyValue:", result.supplyValueMan.toAmount(),
        "borrowLimit", result.borrowLimitMan.toAmount(),
        "collateral:", (result.supplyValueMan.toString() / result.borrowValueMan.toString()).toPrecision(4),
        "allowLiq", result.supplyValueMan / result.borrowValueMan <= 1.01
    )
    var mkts = deploy.loadMarkets();
    for (var mkt of mkts) {
        var info = await mkt.getAcctSnapshot(address);

        if (info.ftokens == 0 && info.borrows == 0) {
            continue;
        }

        var underlying = deploy.warpERC20(await mkt.underlying())
        console.log("\t",
            await mkt.name(),
            // await mkt.underlying(),
            "\n\t\t存款：", (info.ftokens.toString() * info.xrate.toString()),
            "\n\t\t借款：", info.borrows.toAmount(),
            "\n\t\tMarketBalance：", (await underlying.balanceOf(mkt.address)).toAmount(),
            "\n\t\tliquidator钱包：", (await underlying.balanceOf(liquidator)).toAmount(),
            "\n\t\tallownce：", (await underlying.allowance(liquidator, guard.address)).toAmount(),
        )
    }
}

main().catch(e => console.log(e))