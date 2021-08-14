import { artifacts, ethers} from "hardhat"

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
const { writeAbiAddr } = require('../migrations/log');

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  
  console.log(vgsForLP.address);

  let vgs = await deploy('VigossReader', {
    from: deployer,
    args: [
      vgsForLP.address,
      vgsForMargin.address,
    ],
    log: true,
    deterministicDeployment: false,
  });

  let artifact = await artifacts.readArtifact("VigossReader")
  await writeAbiAddr(artifact, vgs.address, "VigossReader", network.name);
};

export default func;
func.tags = ['VigossToken'];