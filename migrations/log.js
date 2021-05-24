const fs = require('fs');
const path = require('path');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);


async function writeAbis(artifacts, name, network){
  const deployments = {};
  deployments["address"] = artifacts.address;
  deployments["contractName"] = artifacts.contractName;
  await writeLog(deployments, name, network);

  const abis = {};
  abis["contractName"] = artifacts.contractName;
  abis["abi"] = artifacts.abi;

  const deploymentPath = path.resolve(__dirname, `../front/abis/${abis["contractName"]}.json`);
  await writeFile(deploymentPath, JSON.stringify(abis, null, 2));
}


/**
 * 记录合约发布地址
 * @param {*} deployments json
 * @param {*} type 类型
 * @param {*} network 网络
 */
async function writeLog(deployments, type, network){
    const deploymentPath = path.resolve(__dirname, `../front/abis/${type}.${network}.json`);
    await writeFile(deploymentPath, JSON.stringify(deployments, null, 2));
    console.log(`Exported deployments into ${deploymentPath}`);
}

module.exports = {
    writeLog,
    writeAbis
}