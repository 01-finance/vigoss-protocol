
const path = require('path');
const util = require('util');
const fs = require("fs");
const JSBI = require("jsbi");
const { Wallet, util: cfxutil, } = require('js-conflux-sdk');
var format = require('js-conflux-sdk/src/util/format');
const EMPTYADDRESS = "cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw";
// const { FunctionCoder } = require('js-conflux-sdk/src/contract/abi');

const { ZWeb3, Contracts } = require('@openzeppelin/upgrades');
const editJsonFile = require("edit-json-file");
const { fileURLToPath } = require('url');

const mkt777ContractName = "MarketERC777";
const mkt777CFXContractName = "MarketCFX";
const create2FactoryAddr = "0x8A3A92281Df6497105513B18543fd3B60c778E40";
const networks = {
    "mainnet": "https://main.confluxrpc.org",
    "testnet": "https://testnet-rpc.conflux-chain.org.cn/v2",
    "dev": "https://dev-conflux-rpc.devdapp.cn",
}

var networkId = 1;

Number.prototype.toStr = function () { return this.toLocaleString("fullwide", { useGrouping: false }) };
Number.prototype.toBN = function () { return new BN(this.toStr()); };

BigInt.prototype.toAmount = function () {

    return v = (this.toString() / 1e18).toPrecision(18);
    // return v.toLocaleString("fullwide", { useGrouping: false })
}

String.prototype.toBase32 = function () {
    var addr = this.toString();
    if (addr.indexOf("0x") == 0) {
        return format.address(addr, networkId);
    }
    return format.address(format.hexAddress(addr), networkId);
}

var Deploy = {

    homeDIR: function name() {
        return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    },

    encryptPK: function (pk, networkID, savePath) {
        const wallet = new Wallet(networkID);
        const account = wallet.addPrivateKey(pk);
        wallet.delete(account.address);

        const pwd1 = require('readline-sync').question("password \u{1F511}", { hideEchoBack: true })
        const pwd2 = require('readline-sync').question("password again \u{1F511}", { hideEchoBack: true })
        if (pwd1 != pwd2) {
            throw ("password error");
        }
        const keystore = account.encrypt(pwd1);
        fs.writeFileSync(savePath, JSON.stringify(keystore), { mode: 0444, flag: "wx" })
    },
    unlockWallet: function (cfx, ...keystoreFiles) {

        var accounts = [];
        const pwd = require('readline-sync').question("password \u{1F511}", { hideEchoBack: true })
        for (var ks of keystoreFiles) {
            ks = ks.replace("~", this.homeDIR())
            console.log("keystore:", ks)
            var data = fs.readFileSync(path.resolve(ks));
            var content = data.toString();
            accounts.push(cfx.wallet.addKeystore(JSON.parse(content), pwd));
            console.log(accounts[accounts.length - 1].address)
        }
        if (accounts.length == 1) {
            return accounts[0]
        }
        return accounts;
    },

    // ???????????????????????????????????????
    init: async function (cfx, deployer, admin, contractDir, mode) {

        this.cfx = cfx;
        networkId = cfx.networkId;
        this.deployer = deployer;
        this.admin = admin;
        this.contractDir = contractDir;
        this.mode = mode;
        // ????????????????????????????????????????????????????????????
        this.contractPorojectDir = "/Users/ysqi/Documents/devproject/flux-protocol";

        this.config = editJsonFile("./contracts/flux." + mode + ".json", { autosave: true });
        this.config.set("confluxNode", networks[mode]);

        // this.contractPorojectDir = "./";
        // console.log(this.contractPorojectDir);

        Contracts.setLocalBuildDir(path.join(this.contractPorojectDir, "build/contracts"));
        Contracts.setLocalContractsDir(path.join(this.contractPorojectDir, "contracts"));

        //??????????????????????????????
        console.log("??????:", deployer == null ? "" : deployer.address, "????????????", admin == null ? "" : admin.address)

        // const b = await this.cfx.getBalance(deployer.address);
        // const adminBalance = await this.cfx.getBalance(admin.address);
        // console.log(util.format("??????????????????:%s????????????????????????:%s",
        //     cfxutil.unit.fromDripToCFX(b),
        //     cfxutil.unit.fromDripToCFX(adminBalance),
        // ));

        // if (JSBI.lessThanOrEqual(adminBalance, new JSBI(0))) {
        //     throw new Error("deployer ???????????????")
        // }
        // if (adminBalance.toString() == "0") {
        //     console.log("????????????!")
        //     // await this.cfx.sendTransaction({
        //     //     from: this.deployer,
        //     //     to: this.admin.address,
        //     //     value: cfxutil.unit.fromCFXToDrip(10)
        //     // }).executed()
        // }
    },

    init2: async function (cfx, deployer, admin, contractDir, mode, porojectDir) {
        this.cfx = cfx;
        this.deployer = deployer;
        this.admin = admin;
        this.contractDir = contractDir;
        this.configName = path.basename(contractDir) + ".json"
        this.mode = mode;
        // ????????????????????????????????????????????????????????????
        this.contractPorojectDir = porojectDir;
        this.config = editJsonFile("./contracts/" + this.configName, { autosave: true });
        this.config.set("confluxNode", networks[mode]);

        // this.contractPorojectDir = "./";
        // console.log(this.contractPorojectDir);

        Contracts.setLocalBuildDir(path.join(this.contractPorojectDir, "build/contracts"));
        Contracts.setLocalContractsDir(path.join(this.contractPorojectDir, "contracts"));

        console.log("??????:", deployer.address, "????????????", admin.address)
    },

    reset: async function () {
        await this.deployProject();
    },

    // ??????????????????
    createBIZData: async function () {
        //???????????????????????????????????????
    },

    printAddress: async function () {
        var gw = this.loadContract("Gateway");
        console.log("Risk:", await gw.risk().call());
        console.log("Oracle", await gw.oracle().call());
        console.log("App:", await gw.app().call());
        console.log("admin:", await this.loadContract("Gateway").admin().call());
    },

    upgradeOne: async function (name, fileName) {
        await this.deplowUseProxy(name, { from: this.admin, }, [], true, fileName);
    },

    // // ??????????????????
    // upgradeMarkets: async function () {
    //     files = fs.readdirSync(this.contractDir);
    //     for (var i = 0; i < files.length; i++) {
    //         if (!files[i].startsWith("market_")) {
    //             continue;
    //         }
    //         var fileName = path.basename(files[i], ".json");
    //         var contractName = mkt777ContractName;
    //         if (fileName == "market_fFC") {
    //             contractName = mkt777CFXContractName
    //         }
    //         console.log(" begin ", fileName, contractName);
    //         await this.deplowUseProxy(contractName, { from: this.admin, }, [], true, fileName);
    //     }
    // },
    fixRato: async function () {
        var app = this.loadContract("FluxApp")
        var markets = this.loadMarkets();
        var index = 0;
        for (var i = 0; i < markets.length; i++) {
            m = markets[i];
            await this.send(app.resetCollRatio(m.address, (1.3 + index * 0.1) * 1e18), { from: this.admin })
            index++;
        }


    },
    approveMarket: async function (marketAddr, collrate = 1.2) {
        var op = {
            from: this.admin,
        }
        const collateralRatioMantissa = collrate * 1e18;
        //????????????
        var app = this.loadContract("FluxApp");
        var result = await app.marketStatus(marketAddr);
        if (result.status == 0) {
            await this.send(app.approveMarket(marketAddr, collateralRatioMantissa), op);
        } else {
            console.log("????????????????????????????????????:", result)
        }
    },
    enableMarket: async function (marketName, collrate) {
        if (collrate <= 1) {
            throw new Error("bad collateral rate")
        }
        //????????????
        var app = this.loadContract("FluxApp");
        var market = this.loadContract("market_" + marketName);
        var result = await app.marketStatus(market.address);
        if (result.status == 0) {
            await this.send(app.approveMarket(market.address, collrate * 1e18), { from: this.admin });
        } else {
            console.log("skip enableMarket !!!!!!")
        }
    },

    // ??????????????????
    loadContract: function (nameOrAddress) {
        if (typeof nameOrAddress == Object) {
            return nameOrAddress;
        }
        var file = path.resolve(this.contractDir, nameOrAddress + ".json");
        if (fs.existsSync(file)) {
            var info = require(file);
            //??????????????????
            const contract = this.cfx.Contract({
                abi: info.abi,
                address: info.address,
            });
            contract.fileName = nameOrAddress
            return contract;
        } else if (nameOrAddress.startsWith("0x") || nameOrAddress.startsWith("cfx:")
            || nameOrAddress.startsWith("cfxtest:")) {
            //????????????????????????
            files = fs.readdirSync(this.contractDir);
            for (var j = 0; j < files.length; j++) {
                var info = require(path.resolve(path.join(this.contractDir, files[j])));
                if (typeof info.address != "undefined" && info.address.toBase32() == nameOrAddress.toBase32()) {
                    var c = this.cfx.Contract({
                        abi: info.abi,
                        address: info.address,
                    });
                    c.fileName = files[j];
                    return c;
                }
            }
            var token = this.loadContract("IERC777");
            token.address = nameOrAddress
            return token;

        }
    },
    loadAllContract: function () {
        var list = []
        files = fs.readdirSync(this.contractDir);
        for (var j = 0; j < files.length; j++) {
            var info = require(path.resolve(path.join(this.contractDir, files[j])));
            if (typeof info.address == "string")
                list.push({ address: info.address, name: files[j] })
        }
        return list;
    },


    initFlux: async function () {
        //???????????????Gateway???RateModel ???Oracle ???Risk???Core???Main
        //???????????????Market??? FC??? ERC20-QCoin???Test???
        sendOptions = {
            from: this.deployer
        }

        admin = this.admin;
        //?????? ????????????
        const rateModel = await this.deplowUseProxy("InterestRateModel", sendOptions, []);
        if (rateModel.err) {
            console.log("?????? rateModel ??????:", err);
            return;
        }
        //???????????????
        const oracle = await this.deplowUseProxy("SimplePriceOracle", sendOptions, [admin.address], true, "Oracle");
        if (oracle.err) {
            console.log("?????? oracle ??????:", err);
            return;
        }
        // ?????? Main
        const fluxMain = await this.deplowUseProxy("FluxApp", sendOptions, [admin.address]);
        if (fluxMain.err) {
            console.log("?????? fluxMain ??????:", err);
            return;
        }

        await this.deplowUseProxy("Guard", sendOptions, [admin.address, fluxMain.address]);
        return fluxMain;
    },

    //????????????????????????
    searchProxyInfo: async function (proxyAddress) {
        var proxy = Contracts.getFromNodeModules("@openzeppelin/upgrades", "AdminUpgradeabilityProxy")
        const proxyContract = this.cfx.Contract({
            abi: proxy.schema.abi,
            address: proxyAddress
        });
        //?????????????????????????????????
        return {
            admin: await proxyContract.admin().call({ from: this.deployer }),
            implementation: await proxyContract.implementation().call({ from: this.deployer }),
        }
        // await proxy.admin().call(sendOptions);//??????????????????????????????????????????????????????
    },

    setPrice: async function (prices) {
        var oracle = this.loadContract("Oracle");

        var tokenIds = [];
        var ps = [];
        for (var item of Object.keys(prices)) {
            var token = this.loadContract(item);
            tokenIds.push(token.address);
            ps.push(prices[item] * 1e18);
        }
        return this.send(oracle.batchSetPrice(tokenIds, ps), { from: this.admin })
    },

    saveDeployInfo: async function () {

        dir = "./contracts/" + this.mode;
        files = fs.readdirSync(dir);
        //clear markets
        this.config.unset("abis");
        this.config.unset("markets");
        this.config.unset("stakePools");
        this.config.unset("contracts");

        var erc20 = Contracts.getFromNodeModules("@openzeppelin/contracts", "ERC20")
        this.config.set("abis.ERC20", erc20.schema.abi);

        for (var j = 0; j < files.length; j++) {
            var info = require(path.resolve(path.join(dir, files[j])));
            var name = path.basename(files[j], ".json")
            console.log("save ", name, "...");


            // market
            if (name.startsWith("market_")) {
                //?????????????????????
                var m = await this.getMarketInfo(name);
                this.config.set("markets." + m.mktSymbol, m);
                var abiKey = m.kind == "cfx" ? "CFXMarket" : "ERC777Market";
                this.config.set("contracts." + m.mktSymbol, {
                    address: info.address.toBase32(),
                    abi: abiKey,
                });
                this.config.set("abis." + abiKey, info.abi);
            } else if (name == "IERC777") { // inferface
                this.config.set("abis.ERC777", info.abi);
            } else if (name.startsWith("stake_")) {
                var pool = await this.getStakePoolInfo(name);
                this.config.set("stakePools." + info.address, pool);
                var abiKey = m.kind == "cfx" ? "CFXMarket" : "ERC777Market";
                this.config.set("contracts." + name, {
                    address: info.address,
                    abi: "StakePool",
                });
                this.config.set("abis.StakePool", info.abi);
            } else if (name.indexOf("Impl") == -1) { //other
                if (name.indexOf("c") == 0) {//ctoken
                    continue;
                }
                this.config.set("abis." + name, info.abi);
                this.config.set("contracts." + name, {
                    address: info.address,
                    abi: name,
                    impl: info.logic,
                })
            }
        }
    },

    getStakePoolInfo: async function (name) {
        var pool = this.loadContract(name);
        var token = this.warpERC20(await pool.token());
        var underlyingToken0 = await pool.underlyingToken0();
        var underlyingToken1 = await pool.underlyingToken1();
        return {
            name: "Stake " + await token.symbol() + " LP Pool",
            decimals: 18,
            symbol: await token.symbol(),
            token: token.address.toBase32(),
            underlying0: underlyingToken0 == EMPTYADDRESS ? "" : underlyingToken0.toBase32(),
            underlying1: underlyingToken1 == EMPTYADDRESS ? "" : underlyingToken1.toBase32(),
            enableEpoch: 10330000,
        }
    },
    getMarketInfo: async function (name) {
        var m = this.loadContract(name);
        var underlying = await m.underlying().call();
        var token = this.cfx.Contract(
            {
                abi: Contracts.getFromNodeModules("@openzeppelin/contracts", "IERC777").schema.abi,
                address: underlying,
            }
        );
        var symbol = await token.symbol();
        // var impl = await this.warpProxy(m.address).implementation().call({ from: this.deployer })

        return {
            address: m.address.toBase32(),
            name: await m.name.call(),
            symbol: symbol == "WCFX" ? "CFX" : symbol,
            mktSymbol: await await m.symbol(),
            decimals: 18,
            ctoken: underlying.toBase32(),
            ctokenABI: "ERC777",
            kind: symbol == "WCFX" ? "cfx" : (symbol.indexOf("c") == 0 ? "cross" : "uncross"),
            origin: symbol == "cBTC" ?
                "bitcoin" :
                (symbol.indexOf("c") == 0 ? "ethereum" : "conflux"),
            minWithdrawAmount: 0.000001,
            minSupplyAmount: 0.000001,
            enableEpoch: 10330000,
        };
    },
    enableMarkets: async function () {
        var markets = await this.loadMarkets();
        var app = await this.loadContract("FluxApp");
        for (var m of markets) {
            try {
                var status = await app.marketStatus(m.address).call();
                if (status.isListed == false) {
                    await this.enableNewMarket(m.fileName);
                }

            } catch (error) {
                console.log("error:", error);
            }
        }
    },
    //??????????????????
    printMarketInfo: async function () {
        //????????????????????????
        files = fs.readdirSync(this.contractDir);

        token = this.loadContract("IERC777");

        var link = function (address) {
            return "[" + address.substring(0, 6) + "..." + address.substring(36) + "](https://testnet.confluxscan.io/accountdetail/" + address + ")"
        }
        var abiLink = function (name) {
            return "[JSON](http://flux.goall.top/contracts/" + name + ")"
        }

        console.log(`|**??????**| token ??? | ftoken | ctoken| ?????? | ctoken ??????| ?????? AIB|`);
        console.log("|----| ----| ---- | ----| ---- |----|----|");
        for (var i = 0; i < files.length; i++) {
            if (!files[i].startsWith("market_")) {
                continue;
            }
            let m = this.loadContract(path.basename(files[i], ".json"))


            if (await m.isERC777Market().call()) {
                // ??????token??????
                token.address = await m.underlying.call();
                console.log(
                    link(m.address), "|",
                    (await token.name.call()), "|",
                    await m.symbol.call(), "|",
                    (await token.symbol.call()), "|",
                    (await m.decimals.call()).toString(10), "|",
                    link(token.address), "|",
                    abiLink(files[i]),
                )

                // console.log("Totol:",
                // (await token.totalSupply().call()).toString(),
                // (await token.balanceOf(this.deployer).call()).toString())
            } else {
                //fc
                console.log(
                    link(m.address), "|",
                    "fc", "|",
                    "-", "|",
                    "-", "|",
                    18, "|",
                    "-", "|",
                    abiLink(files[i]),
                )
            }
        }

    },

    loadMarkets: function () {
        files = fs.readdirSync(this.contractDir);
        var markets = [];
        for (var i = 0; i < files.length; i++) {
            if (!files[i].startsWith("market_")) {
                continue;
            }
            var fileName = path.basename(files[i], ".json");
            var m = this.loadContract(fileName);
            m.fileName = fileName;
            markets.push(m);
        }
        return markets;
    },
    //
    fillPrice: async function () {
        sendOptions = {
            from: this.admin,
        }
        var oracle = this.loadContract("Oracle");

        var markets = this.loadMarkets();
        for (var i = 0; i < markets.length; i++) {
            var m = markets[i];
            var price = (1 + Math.random()) * 1e18;
            var token = await m.underlying();
            console.log(m.address, ",token:", token, "price:", (await oracle.getPriceMan(token)).toString());

            await this.send(
                oracle.setPrice(token, price),
                sendOptions
            );
        }
    },

    printEventLogs: async function (txHash) {
        var receipt = await this.cfx.getTransactionReceipt(txHash);

        console.log(receipt);


    },

    loadTx: async function (id) {
        // 1. ???????????????
        var tx = await this.cfx.getTransactionByHash(id);
        console.log(tx)

        var to = format.address(format.hexAddress(tx.to), this.cfx.networkId);

        var contract = this.loadContract(to);


        console.log("------------------???????????????????????????-------------------");
        var txData = contract.abi.decodeData(tx.data);
        console.log(JSON.stringify(txData, "", "\t"));
        // for (var item of Object.keys(txData.object)) {
        //     console.log(item, "=", txData.object[item].toString())
        // }
        // var token =

        //  ?????????????????????????????????????????????????????????
        var receipt = await this.cfx.getTransactionReceipt(id);
        console.log("------------------???????????????-------------------\n",)
        console.log(JSON.stringify(receipt, "", "\t"))

        //  sdk load
        // console.log(contract[0].abi);hnrdffcxfyygghcx     jnjn
        for (var i = 0; i < receipt.logs.length; i++) {
            var log = receipt.logs[i];
            var logAddress = log.address.toBase32();
            if (logAddress == "cfx:acf2rcsh8payyxpg6xj7b0ztswwh81ute60tsw35j7" || logAddress == "cfxtest:acf2rcsh8payyxpg6xj7b0ztswwh81ute66e7c9vp1") {
                continue;
            }
            //  Event Decoder
            var eventContract = this.loadContract(logAddress);
            try {
                var event = eventContract.abi.decodeLog(log);
                if (typeof event == "undefined") {
                    console.log(log);
                }
                console.log("?????????????????????", logAddress, "\nlog?????????\n", log, "\n???????????????\n", event);
                if (event && event.object) {
                    for (var item of Object.keys(event.object)) {
                        console.log("\t", item, "=", event.object[item].toString())
                    }
                }
            } catch (err) {
                console.log("????????????:", err.toString())
            }
        }
    },
    decodeReceipt: function (contract, receipt) {
        for (var i = 0; i < receipt.logs.length; i++) {
            var log = receipt.logs[i];

            //  Event Decoder
            var event = contract.abi.decodeLog(log)
            console.log("?????????????????????", log.address, "\nlog?????????\n", log, "\n???????????????\n", event);
            if (event && event.object) {
                for (var item of Object.keys(event.object)) {
                    console.log(item, "=", event.object[item].toString())
                }
            }
        }
    },

    loadCreate2Factory: function () {
        return this.cfx.Contract(
            {
                address: create2FactoryAddr,
                abi:
                    [
                        {
                            "constant": true,
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "addr",
                                    "type": "address"
                                }
                            ],
                            "name": "isDeployed",
                            "outputs": [
                                {
                                    "internalType": "bool",
                                    "name": "",
                                    "type": "bool"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "constant": false,
                            "inputs": [
                                {
                                    "internalType": "bytes",
                                    "name": "code",
                                    "type": "bytes"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "salt",
                                    "type": "uint256"
                                }
                            ],
                            "name": "deploy",
                            "outputs": [
                                {
                                    "internalType": "address",
                                    "name": "",
                                    "type": "address"
                                }
                            ],
                            "payable": false,
                            "stateMutability": "nonpayable",
                            "type": "function"
                        }
                    ]
            }
        );
    },
    deploy1820: async function () {
        var factory = this.loadCreate2Factory();
        var data = "0x9c4ae2d0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000045db18e7fb0000000000000000000000000000000000000000000000000000000000000b45608060405234801561001057600080fd5b50604080517fc55b6bb700000000000000000000000000000000000000000000000000000000815230600482015260006024820181905291517308880000000000000000000000000000000000009263c55b6bb7926044808201939182900301818387803b15801561008157600080fd5b505af1158015610095573d6000803e3d6000fd5b5050604080517f64efb22b00000000000000000000000000000000000000000000000000000000815230600482015290516000935073088800000000000000000000000000000000000092506364efb22b91602480820192602092909190829003018186803b15801561010757600080fd5b505afa15801561011b573d6000803e3d6000fd5b505050506040513d602081101561013157600080fd5b50516001600160a01b0316146101a857604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601560248201527f726571756972652061646d696e203d3d206e756c6c0000000000000000000000604482015290519081900360640190fd5b61098e806101b76000396000f3fe608060405234801561001057600080fd5b50600436106100a35760003560e01c806365ba36c111610076578063aabbb8ca1161005b578063aabbb8ca14610210578063b70567651461023c578063f712f3e814610286576100a3565b806365ba36c114610158578063a41e7d51146101da576100a3565b806329965a1d146100a85780633d584063146100e0578063555d3e63146101225780635df8122f1461012a575b600080fd5b6100de600480360360608110156100be57600080fd5b506001600160a01b038135811691602081013591604090910135166102bc565b005b610106600480360360208110156100f657600080fd5b50356001600160a01b0316610551565b604080516001600160a01b039092168252519081900360200190f35b61010661059b565b6100de6004803603604081101561014057600080fd5b506001600160a01b03813581169160200135166105b3565b6101c86004803603602081101561016e57600080fd5b81019060208101813564010000000081111561018957600080fd5b82018360208201111561019b57600080fd5b803590602001918460018302840111640100000000831117156101bd57600080fd5b5090925090506106a7565b60408051918252519081900360200190f35b6100de600480360360408110156101f057600080fd5b5080356001600160a01b031690602001356001600160e01b0319166106e2565b6101066004803603604081101561022657600080fd5b506001600160a01b03813516906020013561076c565b6102726004803603604081101561025257600080fd5b5080356001600160a01b031690602001356001600160e01b0319166107e3565b604080519115158252519081900360200190f35b6102726004803603604081101561029c57600080fd5b5080356001600160a01b031690602001356001600160e01b031916610885565b60006001600160a01b038416156102d357836102d5565b335b9050336102e182610551565b6001600160a01b03161461033c576040805162461bcd60e51b815260206004820152600f60248201527f4e6f7420746865206d616e616765720000000000000000000000000000000000604482015290519081900360640190fd5b61034583610903565b15610397576040805162461bcd60e51b815260206004820152601a60248201527f4d757374206e6f7420626520616e204552433136352068617368000000000000604482015290519081900360640190fd5b6001600160a01b038216158015906103b857506001600160a01b0382163314155b156104e05760405160200180807f455243313832305f4143434550545f4d41474943000000000000000000000000815250601401905060405160208183030381529060405280519060200120826001600160a01b031663249cb3fa85846040518363ffffffff1660e01b815260040180838152602001826001600160a01b03166001600160a01b031681526020019250505060206040518083038186803b15801561046257600080fd5b505afa158015610476573d6000803e3d6000fd5b505050506040513d602081101561048c57600080fd5b5051146104e0576040805162461bcd60e51b815260206004820181905260248201527f446f6573206e6f7420696d706c656d656e742074686520696e74657266616365604482015290519081900360640190fd5b6001600160a01b03818116600081815260208181526040808320888452909152808220805473ffffffffffffffffffffffffffffffffffffffff19169487169485179055518692917f93baa6efbd2244243bfee6ce4cfdd1d04fc4c0e9a786abd3a41313bd352db15391a450505050565b6001600160a01b03818116600090815260016020526040812054909116610579575080610596565b506001600160a01b03808216600090815260016020526040902054165b919050565b73088800000000000000000000000000000000000081565b336105bd83610551565b6001600160a01b031614610618576040805162461bcd60e51b815260206004820152600f60248201527f4e6f7420746865206d616e616765720000000000000000000000000000000000604482015290519081900360640190fd5b816001600160a01b0316816001600160a01b031614610637578061063a565b60005b6001600160a01b03838116600081815260016020526040808220805473ffffffffffffffffffffffffffffffffffffffff19169585169590951790945592519184169290917f605c2dbf762e5f7d60a546d42e7205dcb1b011ebc62a61736a57c9089d3a43509190a35050565b600082826040516020018083838082843780830192505050925050506040516020818303038152906040528051906020012090505b92915050565b6106ec82826107e3565b6106f75760006106f9565b815b6001600160a01b039283166000818152602081815260408083206001600160e01b031996909616808452958252808320805473ffffffffffffffffffffffffffffffffffffffff19169590971694909417909555908152600284528181209281529190925220805460ff19166001179055565b6000806001600160a01b038416156107845783610786565b335b905061079183610903565b156107b757826107a18282610885565b6107ac5760006107ae565b815b925050506106dc565b6001600160a01b0390811660009081526020818152604080832086845290915290205416905092915050565b600080806107f8856301ffc9a760e01b610925565b9092509050811580610808575080155b15610818576000925050506106dc565b61082a856001600160e01b0319610925565b909250905081158061083b57508015155b1561084b576000925050506106dc565b6108558585610925565b909250905060018214801561086a5750806001145b1561087a576001925050506106dc565b506000949350505050565b6001600160a01b03821660009081526002602090815260408083206001600160e01b03198516845290915281205460ff166108cb576108c483836107e3565b90506106dc565b506001600160a01b038083166000818152602081815260408083206001600160e01b0319871684529091529020549091161492915050565b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff161590565b6040516301ffc9a760e01b8082526004820183905260009182919060208160248189617530fa90519096909550935050505056fea265627a7a72315820b07c77b20b7c8477ded5706513a54fb5f4556eed9b900b36ba30104498edf13064736f6c634300050b0032000000000000000000000000000000000000000000000000000000"

        return this.cfx.sendTransaction({
            from: this.admin,
            to: factory.address,
            data: data,
            gas: 1000000
        }).executed();
    },

    sendAmount: async function (tokenAddr, accounts, amount) {
        var token = this.loadContract(tokenAddr);
        var nonce = await this.cfx.getNextNonce(this.deployer);
        for (var acct of accounts) {
            console.log("before", acct, (await token.balanceOf(acct)).toString())
            await token.send(acct, amount, "").sendTransaction({ from: this.deployer }).executed();
            console.log("send to ", acct, amount, "done,balance:", (await token.balanceOf(acct)).toString());
            nonce++;
        }

    },

    fillTestData: async function () {
        op = {
            from: this.deployer,
            gasPrice: 1e10,
        }


        var borrower = "0x1f198aafb16d0080202032fc688a92a29cf46293";
        var supplyMarketAddr = "0x8a2dfede5fb3d7c25b0d97d488539f894b9af328";
        var borrowMarketAddr = "0x85286ec8975c6fdece598bb4c52a008f0fb5e73e"


        var market = this.loadContract("market_fBTC");
        var token = this.loadContract("IERC777");
        token.address = await market.underlying();

        console.log("???????????????", market.address, "Balance:", (await token.balanceOf(this.deployer)).toString())
        var admin = this.admin;
        // await this.send(token.send(admin, 10000 * 1e18, "0x0"), { from: this.deployer });
        await this.send(token.operatorSend(admin, market.address, 1.123 * 1e18, "", cfxutil.sign.sha3("supply")), { from: admin, value: 0 })
        await this.send(token.send(market.address, 2.8 * 1e18, "0x2"), { from: this.admin, value: 0 }).then(receipt => { this.decodeReceipt(market, receipt); });
        // await this.send(market.redeem(0.81234567891234 * 1e18), { from: this.admin, value: 0 }).then(receipt => { this.decodeReceipt(market, receipt); });
        await this.send(market.borrow(0.11234567891234 * 1e18), { from: this.admin, value: 0 }).then(receipt => { this.decodeReceipt(market, receipt); });
        await this.send(token.send(market.address, 0.0034567891234 * 1e18, "1"), { from: this.admin, value: 0 }).then(receipt => { this.decodeReceipt(market, receipt); });
        console.log((await market.cash()).toString());
        return;
        // const ctoken = this.loadContract("IERC777")
        // ctoken.address= await market.underlying().call();
        // console.log("market addres:",market.address);
        // console.log("ctoken address:",ctoken.address);
        // console.log("-----> totalSupply",(await ctoken.totalSupply().call()).toString());
        // console.log("balanceOf:",(await market.balanceOf(this.admin)).toString());

        var tx = this.cfx.sendTransaction({
            from: this.admin,
            to: market.address,
            data: market.mint().data,
            value: 1e18
        })
        return tx.then(r => {
            console.log("-------->", r);
            return tx.get()
        }).then(r => {
            console.log("----get---->", r);
            return tx.mined();
        }).then(r => {
            console.log("----mined---->", r);
            return tx.executed();
        }).then(r => {
            console.log("----executed---->", r);
            return tx.confirmed();
        }).then(r => {
            console.log("----confirmed---->", r);
        });

        // return;
        // ??????????????? admin
        // await this.send(ctoken.transfer(this.admin, await ctoken.balanceOf(this.deployer)),{from: this.deployer})
        // op = { from: this.admin };
        //??????????????????Flux?????? ftoken
        // spender = market.address // this.deployer;
        // console.log(await this.send(ctoken.approve(spender,1234 *1e12 ),op));
        // await this.send(ctoken.transfer(market.address,1 ),{from:this.admin});

        console.log("allowance:", (await ctoken.allowance(this.admin, spender)).toString());
        console.log("ctoken balanceOf(admin):", (await ctoken.balanceOf(this.admin)).toString());
        // console.log("ctoken balanceOf(market):",(await ctoken.balanceOf(market.address)).toString());
        // console.log("test transferFrom:",await ctoken.transferFrom(this.admin,spender,112).call({from:spender}))
        // return;
        // return;
        // console.log(await this.send(risk.setMarketStatus(market.address,1),{from:this.admin}))//open

        // var result =  await this.send(market.mint(888.666*1e12),op);
        // console.log(result);
        console.log(await this.send(market.redeem(0, "0x1830c50dbfa92b296c55ef30ad3b0c6f7f344aec"), op));

        // console.log(await market.balanceOf(this.deployer));
    },

    oneUpgradeTo: async function (name, newImpl) {
        var contract = this.loadContract(name);
        await this.upgradeTo(contract.address, newImpl)
        //save
        this.config.set("contracts." + name + ".impl", newImpl);
    },
    upgradeTo: async function (address, newImpl) {
        var proxy = this.warpProxy(address);
        var curr = await proxy.implementation().call({ from: this.deployer });
        if (curr == newImpl) {
            console.log("skip upgrade when impl version is same", newImpl)
            return;
        }
        console.log("old version:", curr, "will upgrade to :", newImpl)
        return this.send(proxy.upgradeTo(newImpl), { from: this.deployer })
    },
    loadToken: function (nameOrAddress) {
        var exit = this.loadContract("token_" + nameOrAddress);
        if (typeof exit != 'undefined') {
            return exit;
        }
        return this.warpERC20(nameOrAddress)
    },
    mktUpgradeTo: async function (mktName, newImpl) {

        var market = this.loadContract("market_" + mktName);
        console.log(market)
        // var market = this.loadContract("market_" + mktName);
        if (typeof market === "undefined") {
            throw new Error("not found market by name:", mktName)
        }
        var proxy = this.warpProxy(market.address);
        console.log("proxy:", mktName, proxy.address, "newImpl:", newImpl)
        var curr = await proxy.implementation().call({ from: this.deployer });
        if (curr == newImpl) {
            console.log("skip upgrade when impl version is same")
            return;
        }

        //?????????????????????????????????
        // await proxy.admin().call(sendOptions);//??????????????????????????????????????????????????????
        return this.send(proxy.upgradeTo(newImpl), { from: this.deployer })
    },

    createMarket: async function (name = "", symbol = "", tokenAddr, collRate,) {
        var fileName = "market_" + symbol;
        if (typeof this.loadContract(fileName) != "undefined") {
            console.log(symbol, ":skip create market when market is exist")
            return;
        }
        var isfCFX = symbol == "fCFX";
        var token = this.loadContract(tokenAddr);
        if (typeof token == "undefined") {
            token = this.loadContract("IERC777");
            token.address = tokenAddr
        }
        symbol = symbol != "" ? symbol : "f" + (await token.symbol()).substring(1);
        const guard = this.loadContract("Guard");
        const oracle = this.loadContract("Oracle");
        const rmode = this.loadContract("InterestRateModel");
        var market = await this.deployMarket(isfCFX == false,
            [
                guard.address.toBase32(), oracle.address.toBase32(),
                rmode.address.toBase32(), token.address,
                name != "" ? name : (await token.name()) + " market",
                symbol,
            ]);
        this.saveContractInfo(fileName, market);
        return market;
    },
    // ????????????
    enableMainnetCTokenMarket: async function () {
        const gateway = this.loadContract("Gateway")

        const crosschain = require("conflux-crosschain");
        var nodeURL = "https://dev.shuttleflow.io/";

        var ctokens = await crosschain.getTokenList(nodeURL);
        ctokens.push({
            symbol: " QQ",
            ctoken: "0x8a2dfede5fb3d7c25b0d97d488539f894b9af328"
        })
        token = this.loadContract("IERC777");

        // ????????????
        for (var item of ctokens) {

            var collRato = 100 + Math.round(Math.random() * 100) //0.20*100=20
            // var fileName = "market_" + item.symbol;
            // token.address = ctokens[name];
            //?????? ctoken ??????
            // var ctokenName = await token.name();
            // var symbol = await token.symbol();
            // var decimals = 18;
            //????????????
            var market = await this.createMarket("", "", item.ctoken, collRato);
        }
    },


    setOracleFeeder: async function (feeder) {
        var oracle = this.loadContract("Oracle");
        var receipt = await this.send(oracle.approveFeeder(feeder), { from: this.admin })
        console.log(receipt);
    },

    deployFCXMarket: async function () {
        const gateway = this.loadContract("Gateway")
        // ?????? market FC
        await this.deplowUseProxy("MarketFC", sendOptions,
            [gateway.address], true, "market_fFCX");
        //????????????
        await this.enableNewMarket("market_fFCX");
    },

    deployERC777: async function (symbol, desc) {
        var fileName = symbol;

        var exit = this.loadContract(fileName);
        if (typeof exit != "undefined") {
            console.log(symbol, "token exist skip deploy")
            return exit;
        }

        var token;
        if (symbol == "wCFX") {
            token = await this.deploy("", "WrappedCfxMock", { from: this.deployer }, [[]]);
        } else {
            desc = desc ? desc : "Flux Test Token";
            token = await this.deploy("", "ConfluxERC777Mock", { from: this.deployer }, [
                desc, symbol, 1000000000 * 1e18,
            ]);
        }
        this.saveContractInfo(fileName, token);
    },
    deployNEWERC777TokenMarekt: async function () {
        sendOptions = {
            from: this.deployer
        }
        const gateway = this.loadContract("Gateway")

        const ctoken = await this.deploy("", "ConfluxERC777Mock", sendOptions, [
            "Test ERC777 Token", "QQ", 100000 * 1e18,
        ]);
        console.log("Token??????", ctoken.address, ctoken.contract.address);
        market = await this.deplowUseProxy(mkt777ContractName, sendOptions,
            [
                ctoken.address,
                "QQ Flux Market Token",
                "fQQ",
                18,
                gateway.address
            ], true,
            "market_fQQ");
        //????????????
        await this.enableNewMarket("market_fQQ");
        return market;
    },
    //????????????????????????
    fillMarkets: async function () {

        sendOptions = {
            from: this.deployer
        }

        //1. ???????????????????????????????????????
        //2. 5???????????????????????????
        // ???????????????ERC20-

        accts = [
            "0x1076ae541852e6b8cc1126d462436ba14d7227c5",
            "0x1011B609d2f07a386d654EDEe17501d6D0cBDD00",//Funny
            "0x1395AbF550A9D64dD92ebC1d53A6C33793Af5F65",//li
            "0x133589065a8fF5889eeC9376070CD0f85D6faD6A"//zkzhao
        ]
        erc20s = [
            { name: "Tether USD", symbol: "cUSDT", s2: "fUSDT", decimals: 6, total: 6637479171538729 },
            { name: "Dai Stablecoin", symbol: "cDAI", s2: "fDAI", decimals: 18, total: 156228943198038781033944810 },
            { name: "Ethereum", symbol: "cETH", s2: "fETH", decimals: 18, total: 200000000 * (1e18) },
            { name: "BitCoin", symbol: "cBTC", s2: "fBTC", decimals: 12, total: 210000000 * (1e12) },
        ]

        const gateway = this.loadContract("Gateway")

        for (var i = 0; i < erc20s.length; i++) {
            let item = erc20s[i];
            const ctoken = await this.deploy("", "IERC777", sendOptions, [
                item.name, item.symbol, item.decimals, item.total,
            ]);
            //?????????????????????
            console.log("Token??????", ctoken.address, ctoken.contract.address);
            ctoken.contract.address = ctoken.address;
            for (var j = 0; j < accts.length; j++) {
                //??????
                await this.send(ctoken.contract.transfer(accts[i], 1000 * (10 ** item.decimals)), sendOptions);
            }
            //????????????
            name = "market_" + item.s2;
            market = await this.deplowUseProxy("MarketERC20", sendOptions,
                [ctoken.address, item.name, item.s2, item.decimals, gateway.address], true, name);
            //????????????
            await this.enableNewMarket(name);
            console.log(item.name, " ??????????????????:", market.address, " ctoken:(", ctoken.address, item.symbol, item.decimals, ")")
        }
        await this.deployFCXMarket();

    },

    upgrateApp: async function () {
        var op = { from: this.deployer }
        var newImpl = await this.deploy("", "FluxApp", op, []);

        var proxy = this.loadContract("FluxApp");

    },

    deployMarketImpl: async function (erc777 = true) {
        var contractName = erc777 ? mkt777ContractName : mkt777CFXContractName;
        var key = erc777 ? "erc777MarketImpl" : "cfxMarketImpl";
        var implAddressPath = erc777 ? "contracts.erc777MarketImpl.address" : "contracts.cfxMarketImpl.address";
        var needUpgrate = this.contractIsOldVersion(key, contractName);
        if (needUpgrate) {
            console.log(`found new version about ${contractName} ,will deploy new version`)
            const impl = await this.deploy("", contractName, { from: this.deployer }, []);
            this.config.set(implAddressPath, impl.address);
            //save version
            this.config.set(`contracts.${key}.version`, impl.version);
            this.saveContractInfo(key, impl);
            return impl;
        } else {
            console.log("++++++++", contractName)
            var contractInfo = Contracts.getFromLocal(contractName);
            //??????????????????
            return {
                contractName: contractName,
                abi: contractInfo.schema.abi,
                bytecode: contractInfo.schema.bytecode,
                version: ZWeb3.web3.utils.sha3(contractInfo.schema.bytecode),
                address: this.config.get(implAddressPath)
            };
        }
    },


    contractIsOldVersion: function (key, contractName) {
        var versionPath = `contracts.${key}.version`
        var c = Contracts.getFromLocal(contractName);
        var newVersion = ZWeb3.web3.utils.sha3(c.schema.bytecode);
        return newVersion != this.config.get(versionPath);
    },
    formatArgs: function (...args) {
        var Address = require('js-conflux-sdk/src/util/address');;
        for (var i = 0; i < args.length; i++) {
            var before = args[i];
            if (args[i].length == 42 && args[i].indexOf("0x") == 0) {
                args[i] = format.address(args[i], this.cfx.networkId);
            } else if (Address.isValidCfxAddress(args[i])) {
                var hex40 = format.hexAddress(args[i]);
                args[i] = format.address(hex40, this.cfx.networkId);
            }
            // console.log("--after>", before, args[i])
        }
        return args;
    },
    safeAddress: function (addr, cfx) {
        if (addr.indexOf("0x") == 0) {
            return format.address(addr, cfx.networkId);
        }
        return format.address(format.hexAddress(addr), cfx.networkId);
    },
    deployPoxy: async function (implContract, initArgs) {
        //?????? address ????????????????????????????????????
        if (this.admin.address == this.deployer.address) {
            throw new Error("??????????????????????????????????????????????????????????????????????????????")
        }
        initArgs = initArgs ? this.formatArgs(...initArgs) : {};
        console.log("user args:", initArgs);
        const inputData = Buffer.from(implContract.initialize(...initArgs).data.substring(2), 'hex');

        //?????????????????????
        const inputArgs = [
            implContract.address,// logic address
            this.deployer.address,// deploy admin
            inputData// ???????????????
        ]
        return this.deploy("@openzeppelin/upgrades", "AdminUpgradeabilityProxy", {}, inputArgs);
    },

    deployStakePool: async function (name, initArgs) {
        var fileName = "stake_" + name;
        var exist = this.loadContract(fileName);
        if (exist) {
            console.log(name, "Stake ???????????????????????????")
            exist.isExist = true;
            return exist;
        }
        var impl = this.loadContract("stakeImpl");
        var proxy = await this.deployPoxy(impl, initArgs);
        var address = impl.address;
        var pool = Object.assign(impl, { contractName: "StakePool", logic: address, address: proxy.address });
        // pool.logic = address;
        // pool.address = proxy.address;

        this.saveContractInfo("stake_" + name, pool);
        return pool;
    },

    deployMarket: async function (erc777 = true, initArgs) {
        var implInfo = await this.deployMarketImpl(erc777);
        var impl = this.cfx.Contract(implInfo);
        var proxy = await this.deployPoxy(impl, initArgs);

        var address = impl.address;
        var mkt = Object.assign(impl, implInfo);
        mkt.logic = address;
        mkt.address = proxy.address;
        return impl;
    },
    saveContractInfo: function (fileName, contract) {
        const file = path.resolve(path.join(this.contractDir, fileName + ".json"));

        contractInfo = Object.assign({}, contract);

        var jsonContent = JSON.stringify({
            address: contractInfo.address,
            version: contractInfo.version,
            compiler: contractInfo.compiler,
            abi: Contracts.getFromLocal(contract.contractName).schema.abi,
        }, "", "\t");
        fs.writeFileSync(file, jsonContent, 'utf8');

        // this.config.set("markets")
    },

    loadStakePools: function () {
        files = fs.readdirSync(this.contractDir);
        var pools = [];
        for (var i = 0; i < files.length; i++) {
            if (!files[i].startsWith("stake_")) {
                continue;
            }
            var fileName = path.basename(files[i], ".json");
            var m = this.loadContract(fileName);
            m.fileName = fileName;
            pools.push(m);
        }
        return pools;
    },
    deplowUseProxy: async function (name, sendOptions, initArgs, useProxy = true, fileName = name) {
        try {
            //????????????
            const file = path.resolve(path.join(this.contractDir, fileName + ".json"));
            var old = {};
            try {
                old = JSON.parse(fs.readFileSync(file, 'utf8'));
            } catch (err) {
                if (err.errno == -2) {//no such file or directory
                    //??????
                } else {
                    throw err;
                }
            }
            //??????????????????????????????????????????????????????
            //????????????????????????????????????????????????
            var needCreate = false
            var needUpgrate = false;
            if (typeof old.address === "undefined") {
                needCreate = true;
            } else {
                if (typeof old.version === "undefined") {
                    return {
                        err: "json ??????????????? version ??????",
                    }
                }
                //???????????????????????? hash(bytecode) change
                var c = Contracts.getFromLocal(name);
                var newVersion = ZWeb3.web3.utils.sha3(c.schema.bytecode);
                if (old.version != newVersion) {
                    console.log("????????????????????????????????????!");
                    needUpgrate = true;
                }
            }
            if (!needCreate && !needUpgrate) {
                console.log(name, "???????????????????????????????????????!");
                return old;
            }
            if (!useProxy && needUpgrate) {
                throw new Error("?????????????????????????????????")
            }
            var newContractInfo = { history: [] };
            var result;
            //?????????????????????
            if (name == mkt777CFXContractName || name == mkt777ContractName) {
                result = await this.deployMarketImpl(name == mkt777ContractName)
            } else {
                result = await this.deploy("", name, sendOptions, useProxy ? [] : initArgs);
            }
            const logic = result.address;
            console.log(util.format("???????????? %s ???????????????\n\t???????????????%s", logic, result.address));

            newContractInfo = Object.assign(newContractInfo, result);
            newContractInfo.contract = undefined;
            if (needCreate) {
                if (useProxy) {

                    initArgs = initArgs ? initArgs : {};

                    console.log("user args:", initArgs);
                    const inputData = Buffer.from(this.cfx.Contract(result).initialize(...initArgs).data.substring(2), 'hex');
                    //?????? address ????????????????????????????????????
                    if (this.admin.address == sendOptions.from.address) {
                        throw new Error("??????????????????????????????????????????????????????????????????????????????")
                    }

                    //?????????????????????
                    const inputArgs = [
                        logic,// logic address
                        this.deployer.address,// deploy admin
                        inputData// ???????????????
                    ]
                    const proxyResult = await this.deploy("@openzeppelin/upgrades", "AdminUpgradeabilityProxy", {}, inputArgs);
                    newContractInfo.address = proxyResult.address;
                    newContractInfo.logic = logic;
                }
            } else if (needUpgrate) {
                var proxy = Contracts.getFromNodeModules("@openzeppelin/upgrades", "AdminUpgradeabilityProxy")
                const proxyContract = this.cfx.Contract({
                    abi: proxy.schema.abi,
                    address: old.address
                });
                //?????????????????????????????????
                // await proxy.admin().call(sendOptions);//??????????????????????????????????????????????????????

                var func = proxyContract.upgradeTo(logic)
                const receipt = await this.send(func, sendOptions);
                newContractInfo.logic = logic;
                newContractInfo.address = proxyContract.address
                //???????????????????????????
                // newContractInfo.history = old.history;
                // newContractInfo.history.push({
                //     logic: old.logic,
                //     compiler: old.compiler,
                //     version: old.version,
                //     upgradeByTx: receipt.transactionHash
                // })
            }
            var jsonContent = JSON.stringify(newContractInfo, "", "\t");
            fs.writeFileSync(file, jsonContent, 'utf8')
            return newContractInfo;
        } catch (err) {
            throw err;
            return {
                err: err
            }
        }
    },
    warpProxy: function (address) {
        var proxy = Contracts.getFromNodeModules("@openzeppelin/upgrades", "AdminUpgradeabilityProxy")
        return this.cfx.Contract({
            abi: proxy.schema.abi,
            address: address
        });
    },
    warpERC20: function (address) {
        // node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol
        var p = Contracts.getFromNodeModules("@openzeppelin/contracts", "ERC20")
        return this.cfx.Contract({
            abi: p.schema.abi,
            address: address
        });
    },
    warpERC777: function (address) {
        var p = Contracts.getFromNodeModules("@openzeppelin/contracts", "ERC777")
        return this.cfx.Contract({
            abi: p.schema.abi,
            address: address
        });
    },


    send: async function (func, sendOptions) {
        options = Object.assign({}, sendOptions);
        //??????
        const nonce = await this.cfx.getNextNonce(options.from.address);
        options.nonce = nonce;


        // console.log("????????????:\n\t method: ", func.method.fullName);
        // console.log("\tsender:", options.from.address);
        // console.log("\t to:", func.to);
        // console.log("\t nextNoce:", nonce.toString(10));
        // console.log("\tdata length:", func.data.length);
        // options.value=0;
        const estimate = await func.estimateGasAndCollateral(options);
        // console.log("\t???????????? gas???", estimate.gasUsed.toString(10));
        // console.log("\t???????????? storage???", estimate.storageCollateralized.toString(10));
        //??????????????????

        options.gas = "0x" + Math.floor((estimate.gasUsed.toString() / 1) * 1.3).toString(16)
        options.storageLimit = estimate.storageCollateralized;

        //??????????????????????????????????????????
        console.log("\t????????????????????????????????????...");

        // await func.call(options).then(r=>{
        //     // console.log(r)
        // })
        // mined??????tx?????????block??????????????????block??????????????????????????????????????????????????????
        return await func.sendTransaction(options).executed().then(result => {
            console.log("\t???????????????", result.transactionHash);
            return result;
        });
    },

    deploy: async function (modules, name, sendOptions, inputArgs, exitAddress) {
        inputArgs = this.formatArgs(...inputArgs);
        var contractInfo = modules ? Contracts.getFromNodeModules(modules, name) : Contracts.getFromLocal(name);
        //??????????????????
        const contract = this.cfx.Contract({
            abi: contractInfo.schema.abi,
            bytecode: contractInfo.schema.bytecode,
        });

        if (exitAddress) {
            contract.address = exitAddress;
            return {
                contract: contract,
                address: exitAddress,
                contractName: name,
                abi: contractInfo.schema.abi,
                version: ZWeb3.web3.utils.sha3(contractInfo.schema.bytecode),
                // bytecode: contractInfo.schema.bytecode,
                compiler: contractInfo.schema.compiler
            };
        }

        let func = contract.constructor(...inputArgs);
        //???????????????????????????
        sendOptions.from = this.deployer;
        console.log("??????????????????", name, "inputs:", inputArgs);
        const receipt = await this.send(func, sendOptions);
        const address = receipt.contractCreated;
        const contractAddr = format.address(format.hexAddress(address), this.cfx.networkId);
        return {
            contract: contract,
            address: contractAddr,
            contractName: name,
            // receipt: receipt,
            abi: contractInfo.schema.abi,
            version: ZWeb3.web3.utils.sha3(contractInfo.schema.bytecode),
            // bytecode: contractInfo.schema.bytecode,
            compiler: contractInfo.schema.compiler
        };
    },

    // hex ???????????? Buffer
    warpHexStrings: function (items) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].startsWith("0x")) {
                items[i] = Buffer.from(items[i], 'hex')
            }
        }
        return items;
    },

    encodeParams: function (types, values) {
        var inputs = [];
        types.forEach(element => {
            inputs.push({ type: element })
        });
        abi = { name: 'func', inputs: inputs }
        coder = new FunctionCoder(abi)
        return "0x" + coder.encodeData(values).substring("0x3ef294f".length + 1)
    }
}

module.exports = Deploy;