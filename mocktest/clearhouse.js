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

async function getPosition(house, amm, user, web3) {
  try {
    let position = await house.getUnadjustedPosition(amm, user);
    console.log("baseAsset:" + web3.utils.fromWei(position.size.toString()))
    console.log("margin:" + web3.utils.fromWei(position.margin.toString()))
    console.log("openNotional:" + web3.utils.fromWei(position.openNotional.toString()))
    console.log("lastUpdatedCumulativePremiumFraction:" + web3.utils.fromWei(position.lastUpdatedCumulativePremiumFraction.toString()))
    console.log("index:" + position.liquidityHistoryIndex)
    console.log("blockNumber:" +position.blockNumber)
  }  catch (e) {
    console.log("getPosition error", e)
  }

}

module.exports = {
  openPosition,
  getPosition,
}