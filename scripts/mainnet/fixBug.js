
const beforeRun = require('../helpEnv')
var fluxTokenAddress = "cfx:acgbjtsmfpex2mbn97dsygtkfrt952sp0psmh8pnvz";
var cfx, deployer, admin, deploy;
async function main() {
    const env = await beforeRun("mainnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;

    // await deploy.send(deploy.loadContract("fluxApp").refreshMarkeFluxSeed(), { from: admin });

    // await searchTotalStakeSupply();
    // await testStake();
    // await balanceOfCFLUX(deploy.loadContract("FluxMint").address)
    await enableAllSponsor();
    // fixBorrowBug(admin, deploy);
    // upgradeGurand();
    // enableBorrowLimit();
    // upgradeNewLiq();

    // var guard="cfx:accp25db8sytg3bamrgk2vsmg657jyb2kup29nb885"
    // await depositWCFX(guard, (100 * 1e18));
    // await enableNewFeeRate();


    // await sponsor("cfx:acfs0x9vkkf9gk8m4kuzshh2mbgbdb2sga7j5b23h7");
    // await sponsor("cfx:achu45xa8tsvycerpj0g7jj93r7nhd7ybpb8n804m6");

    // await marginCall("cfx:aartgkm1uvpbnnr1dpj1nt7z11de5jfrzpyuhz7gwp")
}

//
//

async function tryBefore() {

    var fluxAPP = deploy.loadContract("FluxAPP")
    // fluxAPP
    // beforeTransferLP

}


async function marginCall(user) {
    var guard = deploy.loadContract("Guard");

    try {
        var result = await deploy.loadContract("market_fCFX").collateralKill(guard.address, user).call()
        console.log(result)
        // await guard.margincall(user).call();
    } catch (error) {
        console.log("==?", error.message)
    }
    // await deploy.send(
    //     guard.margincall(user), { from: admin }
    // )
}

async function searchTotalStakeSupply() {
    var pools = deploy.loadStakePools();

    for (var pool of pools) {

        var token = deploy.warpERC777(await pool.token());
        var totalSupply = (await token.totalSupply()).toAmount();
        var staked = (await token.balanceOf(pool.address)).toAmount();
        console.log(`${pool.fileName}, 流通量：${totalSupply}, 已抵押=${staked}`,)
    }
}


async function testStake() {
    var stake = deploy.loadContract("stake_cADAI")

    await deploy.send(
        stake.unStake(1), { from: admin }
    )

}

async function balanceOfCFLUX(user) {
    console.log(user, (await deploy.loadContract("cFLUX").balanceOf(user)).toAmount())
}


async function enableAllSponsor() {

    var list = deploy.loadAllContract();
    for (var item of list) {
        console.log(item.name, item.address);
        await sponsor(item.address);
    }

}
const format = require('js-conflux-sdk/src/util/format'); const { Conflux } = require('js-conflux-sdk');
async function sponsor(contractAddress) {


    const sponsor_contract = cfx.InternalContract('SponsorWhitelistControl');

    console.log("contract:", contractAddress);
    var ZEROADDR = "cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw".toBase32();

    var hexAddr = format.hexAddress(contractAddress);
    var currentSponr = await sponsor_contract.getSponsorForGas(contractAddress);
    if (currentSponr == ZEROADDR) {
        console.log("申请赞助中")
        await cfx.sendTransaction({
            from: deployer,
            to: "cfx:acbkxbtruayaf2he1899e1533x4wg2a07eyjjrzu31",
            data: `0x9c27c7e1000000000000000000000000${hexAddr.substr(2)}`,
        }).executed();
    } else {
        console.log("已有赞助：", currentSponr)

        // 重新申请
        await cfx.sendTransaction({
            from: deployer,
            to: "cfx:acbkxbtruayaf2he1899e1533x4wg2a07eyjjrzu31",
            data: `0x9c27c7e1000000000000000000000000${hexAddr.substr(2)}`,
        }).executed();
    }
    var isAllWhitelisted = await sponsor_contract.isAllWhitelisted(contractAddress);

    if (!isAllWhitelisted) {
        console.log("开启全白名单")
        await deploy.send(sponsor_contract.addPrivilegeByAdmin(contractAddress, [ZEROADDR]), { from: deployer });
    } else {
        console.log("白名单已开启，不重复处理")
    }
}

async function enableNewFeeRate() {

    //设置汇率
    var fluxApp = deploy.loadContract("FluxApp");
    // 10%
    await deploy.send(fluxApp.setConfig("MKT_BORROW_INTEREST_TAX_RATE", 0.1 * 1e18), { from: admin });
    // 6%
    await deploy.send(fluxApp.setConfig("MKT_LIQUIDATION_FEE_RATE", 0.06 * 1e18), { from: admin });


    //  更新市场
    var erc777MktImpl = await deploy.deployMarketImpl(true);//erc777
    var cfxMktImpl = await deploy.deployMarketImpl(false);//cfx
    await deploy.mktUpgradeTo("fBTC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fUSDT", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fUSDC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fDAI", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fETH", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fFC", erc777MktImpl.address)
    await deploy.mktUpgradeTo("fCFX", cfxMktImpl.address)
}
async function enableBorrowLimit() {
    // await deploy.deplowUseProxy("FluxApp", { from: deployer }, [], true);
    var fluxApp = deploy.loadContract("FluxApp");
    // await deploy.send(
    //     fluxApp.setBorrowLimit(
    //         ["0x852dedfe1e87ed3d898552797df500008bd5b0b4", "0x832b068632a20163891cc2e0f95fde6cec287b4b"],
    //         [100000 * 1e18, 100000 * 1e18]
    //     )
    //     , { from: admin }
    // );

    await fluxApp.borrowAllowed(admin.address, "0x88085a4eb6d1fa6b1c6bfc59fa2975f12ae3fc55", 100000 * 1e18)
}

async function depositWCFX(receipt, amount) {
    const wcfx = cfx.Contract({
        address: "cfx:acg158kvr8zanb1bs048ryb6rtrhr283ma70vz70tx",
        abi: [{
            "inputs": [
                {
                    "internalType": "address",
                    "name": "holder",
                    "type": "address"
                },
                {
                    "internalType": "bytes",
                    "name": "recipient",
                    "type": "bytes"
                }
            ],
            "name": "depositFor",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        }],
    });

    await deploy.send(wcfx.depositFor(receipt, receipt), { from: admin, value: amount });

}

// 2021年02月19日
async function upgradeNewLiq() {
    //更新市场
    // var erc777MktImpl = await deploy.deployMarketImpl(true);//erc777
    // var cfxMktImpl = await deploy.deployMarketImpl(false);//cfx
    // await deploy.mktUpgradeTo("fBTC", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fUSDT", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fUSDC", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fDAI", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fETH", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fFC", erc777MktImpl.address)
    // await deploy.mktUpgradeTo("fCFX", cfxMktImpl.address)
    //更新Guard
    await deploy.deplowUseProxy("Guard", { from: deployer }, [], true);
    await deploy.deplowUseProxy("FluxApp", { from: deployer }, [], true);
}

async function upgradeGurand() {
    await deploy.deplowUseProxy("Guard", { from: deployer }, [], true);
    var gurad = deploy.loadContract("Guard");

    // deploy.send(gurad.approve(
    //     [
    //         "0x821c636dfc85d0612fb8ebf34acf84771ba4c344",
    //         "0x8d7df9316faa0586e175b5e6d03c6bda76e3d950",
    //         "0x87929dda85a959f52cab6083a2fba1b9973f15e0",
    //         "0x86d2fb177eff4be03a342951269096265b98ac46",
    //         "0x8e2f2e68eb75bb8b18caafe9607242d4748f8d98",
    //         "0x817cba144f54134e5fa664142ff11df3c74a1c76",
    //         "0x8b8689c7f3014a4d86e4d1d0daaf74a47f5e0f27"
    //     ]), { from: admin });
}

async function fixBorrowBug(admin, deploy) {

    var ceth = deploy.warpERC777("0x86d2fb177eff4be03a342951269096265b98ac46");
    var ethMkt = deploy.loadContract("market_fETH");
    var borrower = "0x1dd5a15be5de24d6b48fe60e763f2d34968d9eff"

    var data = ZWeb3.eth.abi.encodeParameters(["bytes32", "address"],
        [ZWeb3.web3.utils.keccak256("repayFor"), borrower])


    var borrows = (await ethMkt.borrowBalanceOf(borrower));
    console.log((await ethMkt.borrowBalanceOf(borrower)).toString())
    console.log(data);

    // 13027832823893388838
    var func = ceth.operatorSend(admin, ethMkt.address, borrows, "", util.format.buffer(data))
    // console.log(func.data)

    await deploy.send(func, { from: admin })
    // 13027832823893388838 = 13.027832824 = 13.0279
    // 13028036164912512817
    // 13028075487815709963- 12028076560919058806
    console.log((await ethMkt.borrowBalanceOf(borrower)).toString())

}

main().catch(e => console.error("error:", e));