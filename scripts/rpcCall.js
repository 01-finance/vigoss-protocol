const fs = require("fs");
const path = require('path');
const jsonrpc = require('jsonrpc-lite')

async function main(){

    //合约
    var nodes=""

    jsonrpc.request(1,"cfx_getCode",["0x866aCA87FF33a0ae05D2164B3D999A804F583222","latest_state"])

}
main().catch(e => console.error("error:", e));


