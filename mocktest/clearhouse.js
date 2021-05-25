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


function printPosition(position, web3) {
  console.log("Pos baseAsset:" + web3.utils.fromWei(position.size.toString()))
  console.log("Pos margin:" + web3.utils.fromWei(position.margin.toString()))
  console.log("Pos openNotional:" + web3.utils.fromWei(position.openNotional.toString()))
  console.log("Pos lastUpdatedCumulativePremiumFraction:" + web3.utils.fromWei(position.lastUpdatedCumulativePremiumFraction.toString()))
  console.log("Pos index:" + position.liquidityHistoryIndex)
  console.log("Pos blockNumber:" +position.blockNumber)
}

async function getPosition(house, amm, user, web3) {
  try {
    let position = await house.getUnadjustedPosition(amm, user);
    printPosition(position, web3)
  }  catch (e) {
    console.log("getPosition error", e)
  }
}

async function getPersonalPositionWithFundingPayment(houseViewer, amm, user, web3) {
  try {
    let position = await houseViewer.getPersonalPositionWithFundingPayment(amm, user);
    printPosition(position, web3)
  }  catch (e) {
    console.log("getPosition error", e)
  }
}




module.exports = {
  openPosition,
  getPosition,
  getPersonalPositionWithFundingPayment
}