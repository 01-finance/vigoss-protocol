// https://docs.perp.fi/sdk-documentation/smart-contract-javascript-dev-guide
async function openPosition(house, amm, buyOrSell, qAmount, leverage, minBaseAmount, user, web3) {
  try {
    let tx = await house.openPosition(amm, 
      buyOrSell,
      { d: qAmount },
      { d: leverage },
      { d: minBaseAmount },
      { from: user } )
    console.log("openPosition done, gas:" + tx['receipt']['gasUsed'])
  }  catch (e) {
    console.log("openPosition error", e)
  }
}

async function closePosition(house, amm, qlimitAmount, user) {
  try {
    let tx = await house.closePosition(amm, 
      { d: qlimitAmount },
      { from: user })
      console.log("closePosition done, gas:" + tx['receipt']['gasUsed'])
  } catch (e) {
    console.log("closePosition error", e)
  }
}

async function liquidate(house, amm, trader, user) {
  try {
    let tx = await house.liquidate(amm, 
      trader,
      { from: user })
      console.log("liquidate done, gas:" + tx['receipt']['gasUsed'])
  } catch (e) {
    console.log("liquidate error", e)
  }
}

async function partialLiquidationRatio(house, web3) {
  try {
    let plr = await house.partialLiquidationRatio(
      { from: user })
      console.log("partialLiquidationRatio:" +  web3.utils.fromWei(plr.toString())
  } catch (e) {
    console.log("liquidate error", e)
  }
}

async function addMargin(house, amm, addmargin, user) {
  try {
    let tx = await house.addMargin(amm, 
      {d: addmargin},
      { from: user })
    console.log("addMargin done, gas:" + tx['receipt']['gasUsed'])
  } catch (e) {
    console.log("liquidate error", e)
  }
}

async function removeMargin(house, amm, margin, user) {
  try {
    let tx = await house.removeMargin(amm, 
      {d: margin},
      { from: user })
    console.log("removeMargin done, gas:" + tx['receipt']['gasUsed'])
  } catch (e) {
    console.log("liquidate error", e)
  }

}

function printPosition(position, web3) {
  
  console.log("Pos baseAsset:" + web3.utils.fromWei(position.size.toString()))
  console.log("Pos margin:" + web3.utils.fromWei(position.margin.toString()))
  console.log("Pos openNotional:" + web3.utils.fromWei(position.openNotional.toString()))
  console.log("Pos lastUpdatedCumulativePremiumFraction:" + web3.utils.fromWei(position.lastUpdatedCumulativePremiumFraction.toString()))
  console.log("Pos liquidityHistoryIndex:" + position.liquidityHistoryIndex)
  console.log("Pos blockNumber:" +position.blockNumber)
}

async function getUnadjustedPosition(house, amm, user, web3) {
  try {
    console.log("\n getUnadjustedPosition \n ")
    let position = await house.getUnadjustedPosition(amm, user);
    printPosition(position, web3)
    return position.size
  }  catch (e) {
    console.log("getPosition error", e)
  }
}

async function getPosition(house, amm, user, web3) {
  try {
    console.log("\n getPosition \n ")
    let position = await house.getPosition(amm, user);
    printPosition(position, web3)
    return position.size
  }  catch (e) {
    console.log("getPosition error", e)
  }
}

async function getPersonalPositionWithFundingPayment(houseViewer, amm, user, web3) {
  try {
    console.log("\n getPersonalPositionWithFundingPayment \n ")
    let position = await houseViewer.getPersonalPositionWithFundingPayment(amm, user);
    printPosition(position, web3)

  }  catch (e) {
    console.log("getPosition error", e)
  }
}


async function payFunding(house, amm, user) {
  try {
    await house.payFunding(amm, {from: user});
  }  catch (e) {
    console.log("payFunding error", e)
  }
}

async function getLatestCumulativePremiumFraction(house, amm, web3) {
  try {
    let pf = await house.getLatestCumulativePremiumFraction(amm);
    console.log("pf:" +  web3.utils.fromWei(pf.toString()));
  }  catch (e) {
    console.log("getLatestCumulativePremiumFraction error", e)
  }
}


module.exports = {
  openPosition,
  getPosition,
  closePosition,
  liquidate,
  addMargin,
  removeMargin,
  payFunding,
  getUnadjustedPosition,
  partialLiquidationRatio,
  getPersonalPositionWithFundingPayment,
  getLatestCumulativePremiumFraction
}