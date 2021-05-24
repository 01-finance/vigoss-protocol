
const fs = require("fs")
const path = require("path")
var content = fs.readFileSync(path.join(process.env.HOME, "/.flux/mainnet"), 'utf-8');
var pks = content.split("\n");

var FLUX_DEPlOY_PK = pks[0];//deployer
var FLUX_ADMIN_PK = pks[1];//admin

const MAIN_DEPLOER_KEY = "/Users/ysqi/.flux/main_deployer.keystore.json";
const MAIN_ADMIN_KEY = "/Users/ysqi/.flux/main_admin.keystore.json";


const deploy = require("../../deploy");


deploy.encryptPK(FLUX_DEPlOY_PK, 1029, MAIN_DEPLOER_KEY)
deploy.encryptPK(FLUX_ADMIN_PK, 1029, MAIN_ADMIN_KEY)

