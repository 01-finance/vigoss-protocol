const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet", false);
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;


    var oracle = deploy.loadContract("Oracle")


    for (var mkt of deploy.loadMarkets()) {

        var token = deploy.warpERC20(await mkt.underlying());

        var price = (await oracle.getPriceMan(token.address)).toAmount();
        var tax = (await mkt.taxBalance()).toAmount()
        console.log(`${mkt.fileName},借款=${(await mkt.totalBorrows()).toAmount()},利差：${tax}`)

        // console.log(`${mkt.fileName},${(await token.balanceOf(mkt.address)).toAmount()},${(await mkt.totalBorrows()).toAmount()},,${price},${tax}`)
    }


    // var pools = deploy.loadStakePools();
    // for (var pool of pools) {
    //     var token = deploy.warpERC20(await pool.token());
    //     console.log(`${await pool.fileName},,,${(await token.balanceOf(pool.address)).toAmount()},0`)
    // }
}

async function rqeuestPrice() {

    const axios = require('axios');

    const result = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
        timeout: 3000,
        params:
        {
            convert: 'USD',
            symbol: 'cwbtc,ceth,cusdc,cdai,wbtc,eth,usdc,dai',
            aux: 'is_active'
        },
        headers:
        {
            'Content-Type': 'application/json',
            'X-CMC_PRO_API_KEY': 'e3dcacb5-105d-40c4-87a7-298406bb9586'
        }
    });


    console.log(result)


}

main().catch(err => console.log(err));

