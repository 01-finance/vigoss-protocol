
import { artifacts, ethers} from "hardhat"

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
const { writeAbiAddr } = require('../migrations/log');


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  // if (network.name !== 'testnet') {
  //   console.log('This deployment script should be run against testnet only')
  //   return
  // }


  const { deployer } = await getNamedAccounts();

  let usdt = await deploy('MockToken', {
    from: deployer,
    args: [
      "USDC", 18, ethers.utils.parseUnits("100000000")
    ],
    log: true,
    deterministicDeployment: false,
  });

  let MockToken = await artifacts.readArtifact("MockToken")
  await writeAbiAddr(MockToken, usdt.address, "USDC", network.name);

  let weth = await deploy('MockToken', {
    from: deployer,
    args: [
      "WETH", 18, ethers.utils.parseUnits("1000000")
    ],
    log: true,
    deterministicDeployment: false,
  });

  await writeAbiAddr(MockToken, weth.address, "WETH", network.name);

};

export default func;
func.tags = ['MockToken'];