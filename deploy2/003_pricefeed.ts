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

  let feed = await deploy('SimpleUSDPriceFeed', {
    from: deployer,
    args: [
      deployer,
    ],
    log: true,
    deterministicDeployment: false,
  });

  let artifact = await artifacts.readArtifact("SimpleUSDPriceFeed")
  await writeAbiAddr(artifact, feed.address, "SimpleUSDPriceFeed", network.name);
};

export default func;
func.tags = ['SimpleUSDPriceFeed'];