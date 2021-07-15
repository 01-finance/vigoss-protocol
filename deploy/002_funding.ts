
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

  let funding = await deploy('InsuranceFund', {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: false,
  });

  let artifact = await artifacts.readArtifact("InsuranceFund")
  await writeAbiAddr(artifact, funding.address, "InsuranceFund", network.name);

  // const fund = await ethers.getContract("InsuranceFund");
  const fund = await ethers.getContractAt(artifact.abi, funding.address);
  console.log("owner:" + await fund.owner())

};

export default func;
func.tags = ['InsuranceFund'];