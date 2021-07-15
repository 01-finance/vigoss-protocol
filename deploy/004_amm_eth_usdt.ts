
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

  let USDC = require(`../front/abis/USDC.${network.name}.json`);
  let WETH = require(`../front/abis/WETH.${network.name}.json`);
  let FEED = require(`../front/abis/SimpleUSDPriceFeed.${network.name}.json`);
  let FUND = require(`../front/abis/InsuranceFund.${network.name}.json`);


  const quoteAssetReserve = ethers.utils.parseUnits("4000000") // 
  const baseAssetReserve  =  ethers.utils.parseUnits("20000") // 
  const tradeLimitRatio   = ethers.utils.parseUnits("0.015")    // default 0.015 1.25%
  const fundingPeriod = 3600   // 1 hour
  
  const fluctuationLimitRatio = ethers.utils.parseUnits("0.012") // default 0.012 1.2%
  const tollRatio   = ethers.utils.parseUnits("0");
  const spreadRatio = ethers.utils.parseUnits("0.001"); // 0.1%

  const { deployer } = await getNamedAccounts();

  let amm = await deploy('Amm', {
    from: deployer,
    args: [
      quoteAssetReserve ,
      baseAssetReserve, 
      tradeLimitRatio,
      fundingPeriod,
      FEED.address,
      USDC.address,
      WETH.address,
      fluctuationLimitRatio,
      tollRatio,
      spreadRatio
    ],
    log: true,
    deterministicDeployment: false,
  });

  let artifact = await artifacts.readArtifact("Amm")
  await writeAbiAddr(artifact, amm.address, "Amm:ETH-USDC", network.name);


  const initMarginRatio =ethers.utils.parseUnits("0.1") // 10% -> 10x
  const maintenanceMarginRatio = ethers.utils.parseUnits("0.0625") // 6.25% -> 16x
  const liquidationFeeRatio = ethers.utils.parseUnits("0.0125")    // 1.25%

  let ch = await deploy('ClearingHouse', {
    from: deployer,
    args: [
      amm.address,
      initMarginRatio,
      maintenanceMarginRatio,
      liquidationFeeRatio,
      FUND.address
    ],
    log: true,
    deterministicDeployment: false,
  });

  let ClearingHouse = await artifacts.readArtifact("ClearingHouse")
  await writeAbiAddr(ClearingHouse, ch.address, "ClearingHouse:ETH-USDC", network.name);


  let chv = await deploy('ClearingHouseViewer', {
    from: deployer,
    args: [
      ch.address
    ],
    log: true,
    deterministicDeployment: false,
  });

  let ClearingHouseViewer = await artifacts.readArtifact("ClearingHouseViewer")
  await writeAbiAddr(ClearingHouseViewer, chv.address, "ClearingHouseViewer:ETH-USDC", network.name);

  let FundArtifact = await artifacts.readArtifact("InsuranceFund")
  const fund = await ethers.getContractAt(FundArtifact.abi, FUND.address);
  
  console.log("setBeneficiary");
  await fund.setBeneficiary(ch.address, true);
  
  console.log("addAmm");
  await fund.addAmm(amm.address);


  const usdtethAmm = await ethers.getContractAt(artifact.abi, amm.address);
  console.log("setCounterParty");
  await usdtethAmm.setCounterParty(ch.address);


};

export default func;
func.tags = ['AMM-ETH-USDT'];