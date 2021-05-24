
const beforeRun = require('../helpEnv')
var cfx;
var deployer;
var admin;
var deploy;
async function main() {
    var env = await beforeRun("mainnet");
    cfx = env.cfx; deployer = env.deployer; admin = env.admin; deploy = env.deploy;

    // await deploy.deplowUseProxy("FluxMint", { from: admin }, [admin]);

    // await updateStake();
    // Flux-CFX
    // 0x1c5b4c36fe5c1dc30012c62dde13037b5e2f2d07	78226828640391207441
    // await fixFluxMint("stake_f-cFLUX-CFX", "0x1c5b4c36fe5c1dc30012c62dde13037b5e2f2d07", "78226828640391207441")

    // await fix1();
    // await fix2();

    // await checkResult("stake_f-cFLUX-CFX")
    // await checkResult("stake_f-cUSDT-cFLUX")

    // 40906.395080257
    // 40911.395080257

    // await fixLPStake("cfx:acfs0x9vkkf9gk8m4kuzshh2mbgbdb2sga7j5b23h7",
    // "cfx:aasz35e76j1jcgcw7x63xsju1cnj0xk0p6m536f51m", "1657784424390128108553", "10000000000000000000")


    //1d:
    // cfx:acfs0x9vkkf9gk8m4kuzshh2mbgbdb2sga7j5b23h7,  cfx:aarwy8xd86uhsygfh6a8ssx9pw8yrcavm2h87ggukp, 4.285762993031914976+36.412180066682148406+134.785311175664799496
    //
    // await fixLPStake("cfx:acfs0x9vkkf9gk8m4kuzshh2mbgbdb2sga7j5b23h7", "cfx:aarwy8xd86uhsygfh6a8ssx9pw8yrcavm2h87ggukp", "4285762993031914976", "1000000000000000000")
    // await fixLPStake("cfx:acfs0x9vkkf9gk8m4kuzshh2mbgbdb2sga7j5b23h7", "cfx:aarwy8xd86uhsygfh6a8ssx9pw8yrcavm2h87ggukp", "36412180066682148406", "1000000000000000000")
    // await fixLPStake("cfx:acfs0x9vkkf9gk8m4kuzshh2mbgbdb2sga7j5b23h7", "cfx:aarwy8xd86uhsygfh6a8ssx9pw8yrcavm2h87ggukp", "134785311175664799496", "1000000000000000000")
}

async function filterBadTransfer() {

    // cfx.getLogs({fromEpoch:})


}

async function fixLPStake(pool, user, lpAmount, reward) {
    var fluxMint = deploy.loadContract("FluxMint");

    var poolToken = deploy.loadContract(pool)

    base32 = user.toBase32();

    console.log(`${user} (${base32}): ${lpAmount} `)

    await deploy.send(
        fluxMint.fixLPStake(pool, base32, lpAmount, reward), { from: admin }
    )
}

async function checkResult(poolName) {

    var pool = deploy.loadContract(poolName)

    console.log(`pool totalsupply`, (await pool.totalSupply()));
    console.log(`pool staked`, (await deploy.warpERC20(await pool.token()).balanceOf(pool.address)));

}

async function updateStake() {
    await deploy.deplowUseProxy("StakePool", { from: deployer }, [], false, "stakeImpl");

    var impl = deploy.loadContract("stakeImpl");

    await deploy.oneUpgradeTo("stake_f-cFLUX-CFX", impl.address);
    await deploy.oneUpgradeTo("stake_f-cUSDT-cFLUX", impl.address);
}

async function fixFluxMint(pool, user, lpAmount) {
    var fluxMint = deploy.loadContract("FluxMint");

    var poolToken = deploy.loadContract(pool)

    base32 = user.toBase32();

    console.log(`${user} (${base32}): ${lpAmount} `)

    await deploy.send(
        fluxMint.fixFluxMintReward(poolToken.address, base32, lpAmount), { from: admin }
    )
}

async function fix2() {

    var accounts = [
        { user: "0x18eeadeac3d1d1d36aa80aa8050c4704886574a9", amount: "7998584275112923728615" },
        { user: "0x1bcf811369355ef47351bd97e2308d081c8b9b41", amount: "30250823394052079905" },
        { user: "0x1641c69dcd7890d1f308fec4572341c7881a2ab3", amount: "4488144531634233718864" },
        { user: "0x1b069f4897264ce2aed05eae48a08b84c881cc5f", amount: "23675513251630441699" },
        { user: "0x133cb88137566b8c890e84ba061800dc786bc887", amount: "16736627368690966733" },
        { user: "0x18eeadeac3d1d1d36aa80aa8050c4704886574a9", amount: "599000000000000000000" },
        { user: "0x1d8c9d866d2b1ec96855ce11cbbcd5df5e45a1e0", amount: "8351523095042815532" },
        { user: "0x1d8c9d866d2b1ec96855ce11cbbcd5df5e45a1e0", amount: "59252652030586965119" },
        { user: "0x1c4e9977e59081448fe6545ececb1e02c9c91946", amount: "25526420739520594415" },
        { user: "0x19bd58b11d3ef61d3913c2e91c57b2c8b716f578", amount: "13139429960046022732" },
        { user: "0x133cb88137566b8c890e84ba061800dc786bc887", amount: "6705212533206380351007" },
        { user: "0x1d57b68aad981abbbcb949e56c2c656796265b48", amount: "1554913371675998776278" },
        { user: "0x11d62b9d7ae431acbc9b31594eff2e61249369c6", amount: "169007442944525800000" },
        { user: "0x122857aaadbbd43f9bec7ff1ed9dfb6ac3040c59", amount: "159785237137642344512" },
        { user: "0x1e72bb86790f74a7f32efbe318cdb284af6a831e", amount: "299861408059087665661" },
        { user: "0x1aa8522046d5e3245942454e02e7bf805c9ea559", amount: "11871819244395121469" },
        { user: "0x1e1e8dd34bde605014c1a3d547a09e772cb3b337", amount: "7188121486871430548" },
        { user: "0x1103077001baf65c338ae66c38fe33fee5a5d609", amount: "287454805196444987416" },
        { user: "0x197d50004188f46bcf42e022fb83ff81ad214e8e", amount: "1216738900000000000000" },
        { user: "0x1b0a39f70dad46883c202b82ffc3af3f71ad229f", amount: "50500000000000000000" },
        { user: "0x19bd58b11d3ef61d3913c2e91c57b2c8b716f578", amount: "3212845095356661159" },
        { user: "0x155d6ed81f308e64871f7d17cd22c3e3e9d95d9e", amount: "14820747552886489168425" },
        { user: "0x1cc9a31aa3501a13676f639f7de8b37869909afd", amount: "469088106774535639710" },
        { user: "0x197d50004188f46bcf42e022fb83ff81ad214e8e", amount: "10000000000000" },
        { user: "0x1743acbdc8ab70313767412b6f2611c35f54412b", amount: "1453283114582557096361" },
        { user: "0x10a7e194c91baa2d8a39cd1f42f8753dd4d0e67a", amount: "21664954869910390842" },
        { user: "0x1a97e89f482bdda62d67d85cd1be62e147638a60", amount: "9495876446584156334" },
        { user: "0x1cc61461629ade745c6ea85aa66de5f1d8e3241a", amount: "388221437397096078983" },
        { user: "0x10df7e6bfb28dca09f4aabe1f932c703e5b7461c", amount: "15485746666753949071" },
    ]
    for (var item of accounts) {
        await fixFluxMint("stake_f-cUSDT-cFLUX", item.user, item.amount)
    }
}

async function fix1() {
    var accounts = [
        { user: "0x1cb41deae3bfc17b5b0c14c7549cbe85dce4aa94", amount: "6677133284852504789499" },
        { user: "0x1ca955b5bc36dc36545929a1d7c37b033ab2ee83", amount: "1044503776744326101173" },
        { user: "0x1b4b1eeb84cc7557c86aa1d9829928d62e25ad55", amount: "653559020797875010132" },
        { user: "0x1bb08d488234c3b5ce8dfd079369b927217d4f5d", amount: "1368323143616985181395" },
        { user: "0x19def16d794570e5096f3ecbc1bd6f4e569b8e5a", amount: "1856955031090159258181" },
        { user: "0x1abd7b2fe0acd2098fe95aa52843e7bae2f10de4", amount: "81245655893570843872" },
        { user: "0x153d5c2ef98932d0dfe464efa7f437d30004440c", amount: "4208565962015715204011" },
        { user: "0x19def16d794570e5096f3ecbc1bd6f4e569b8e5a", amount: "5842312074911046611" },
        { user: "0x17b42a6cc59b0debd54e7861fbd5d55c753c58c9", amount: "113024070531672888140" },
        { user: "0x1b439e3536ecc85bc83ee5ef87cbecd435003b84", amount: "935469875392505280851" },
        { user: "0x19bd58b11d3ef61d3913c2e91c57b2c8b716f578", amount: "125841177392956938731" },
        { user: "0x11c0c9ae1d6907491c55993e88a935d6151af16f", amount: "102546063652274335750" },
        { user: "0x19bd58b11d3ef61d3913c2e91c57b2c8b716f578", amount: "60130599862948432614" },
        { user: "0x10df7e6bfb28dca09f4aabe1f932c703e5b7461c", amount: "90103350540516467465" },
        { user: "0x12e158d08a1a22ca3c204e7b8f98d3a874671be9", amount: "74025546476603490602" },
        { user: "0x1f68f613dd526184a5f5fb08e034264688888888", amount: "281000000000000000000" },
        { user: "0x161b76fd27ca90eab45f0cfc30a15bb195de255b", amount: "160831000056504633628" },
        { user: "0x19bd58b11d3ef61d3913c2e91c57b2c8b716f578", amount: "114413674596562600608" },
        { user: "0x1f68f613dd526184a5f5fb08e034264688888888", amount: "17000000000000000000" },
        { user: "0x1e72bb86790f74a7f32efbe318cdb284af6a831e", amount: "260580300392051128114" },
        { user: "0x18e79e2c653d8e63a132aa197343b71b21ba0f78", amount: "564521843138598281" },
        { user: "0x1bcf811369355ef47351bd97e2308d081c8b9b41", amount: "77898672065744749350" },
        { user: "0x1e72bb86790f74a7f32efbe318cdb284af6a831e", amount: "643402324370231660852" },
        { user: "0x1e20a8205e9ec8f8474ba4192c1266607717d27b", amount: "129311225804406927136" },
        { user: "0x14faafb7314073b0a423ecc5e037751a407fbc82", amount: "47436300557922708781" },
        { user: "0x19bd58b11d3ef61d3913c2e91c57b2c8b716f578", amount: "55507210425899320972" },
        { user: "0x112143d1b92d5f9c3ce02cd8b7ba0378205484ab", amount: "1624146549558389382" },
        { user: "0x16ab14bd4c2ba2ef289fc0955a32f565bc678cc2", amount: "635941034680180687023" },
        { user: "0x1c32412e356249c58ee7ef633c80d6ce080f333e", amount: "235074000000000000000" },
        { user: "0x1ae5b8ea53e2fd0f8f2ca4917bc00e97daa974ba", amount: "76688084995014298525" },
        { user: "0x10ad82ffe7f69829a90a915245154861835d9c32", amount: "2951680000000000000" },
        { user: "0x155d6ed81f308e64871f7d17cd22c3e3e9d95d9e", amount: "4458167220239246149411" },
        { user: "0x1fb4bb6a36b6a956e5cd973573be015429f21c21", amount: "1000000000000000000" },
        { user: "0x12e088d4ec7d0d7d4d094f24b179c681677116b1", amount: "18126091474767317443" },
        { user: "0x1bcd2ec707d55dbbacd6f1f9d0bd3ccc6daee6b1", amount: "2048900608468929693623" },
        { user: "0x1cc9a31aa3501a13676f639f7de8b37869909afd", amount: "1587929534034551979" },
        { user: "0x1f2a5c9f92634094a101d6ff2c4bed2a5d695d02", amount: "32309062215363963102" },
        { user: "0x12d5695ed01715b645486a3640e8b8183fa4f2ef", amount: "27700000000000000000" },
        { user: "0x152922cb6fb53c948cf62ec91b7733210fe8e105", amount: "113005607657602936" },
        { user: "0x1e14151289e8c64b42c9ec23c3d81386333f5b61", amount: "125202820979712" },
        { user: "0x12d5695ed01715b645486a3640e8b8183fa4f2ef", amount: "50000000000000000" },
        { user: "0x1fb4bb6a36b6a956e5cd973573be015429f21c21", amount: "146453586437318344475" },
        { user: "0x1a15ba109639f2f6133f68ed95922b7505850878", amount: "7303340351304081637883" },
        { user: "0x14953a1f559206bc1ac9480195a26a50eb812637", amount: "963673942216345557241" },
        { user: "0x1d254580ef714b6190170caade72287a003098f1", amount: "28326452351634276150" },
        { user: "0x1d883cb651e02321f27744182eacc983a93fee41", amount: "635599110284503130188" },
        { user: "0x155d6ed81f308e64871f7d17cd22c3e3e9d95d9e", amount: "11854667773010334354445" },
        { user: "0x10d0aabb860afc9694135a4fc1e6d5d218892afd", amount: "3907301368931835919169" },
        { user: "0x1bc0f8183728016ded63defc43c23036c8f7c935", amount: "41326561935469415877" },
        // { user: "0x1c5b4c36fe5c1dc30012c62dde13037b5e2f2d07", amount: "78226828640391207441" },
        { user: "0x1a5386f855665daa6a64c457b2a83d2bc7f7957f", amount: "6132630755545395313" },
        { user: "0x162428826aa5f355575ac3dce8a397c4f5ba6e4b", amount: "1000000000000000000" },
        { user: "0x16b461d2f62fd19db99c6846374545a132df2ffb", amount: "990823507327018884582" },
        { user: "0x186dc0997375928e508d46adcd68d1999ffa2788", amount: "33630714786478003694" },
        { user: "0x1f7d4dbde20aff150daf50a7ce17287db5c75b6d", amount: "3367182170724425562" },
        { user: "0x1f45fc828e741be6d9bea4d33df96d2e82897444", amount: "6345731974610726998" },
    ]

    for (var item of accounts) {
        // await fixFluxMint("stake_f-cFLUX-CFX", item.user, item.amount)
    }

}

main().catch(e => console.error("error:", e));