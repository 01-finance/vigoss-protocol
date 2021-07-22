
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

  let vgs = require(`../front/abis/VigossToken.${network.name}.json`);

  const vgsPerSecond = ethers.utils.parseUnits("1");

  const { deployer } = await getNamedAccounts();
  const ts = Math.floor(new Date().getTime() / 1000);

  console.log("ts: " + ts);

  let vgsdistributer = await deploy('VGSDistributer', {
    from: deployer,
    args: [
      vgs.address,
      vgsPerSecond, 
      ts
    ],
    log: true,
    deterministicDeployment: false,
  });

  let artifact = await artifacts.readArtifact("VGSDistributer")
  await writeAbiAddr(artifact, vgsdistributer.address, "VGSDistributer", network.name);

};

export default func;
func.tags = ['VGSDistributer'];