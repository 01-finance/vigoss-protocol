//get oracle price
async function getUnderlyingPrice(amm, web3) {
  try {
    const p = await amm.getUnderlyingPrice();
    console.log("underlyingPrice:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("getUnderlyingPrice", e)
  }
}

async function getUnderlyingTwapPrice(amm, interval, web3) {
  try {
    const p = await amm.getUnderlyingTwapPrice(interval);
    console.log("TwapPrice:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("getUnderlyingTwapPrice", e)
  }
}

async function getSpotPrice(amm, web3) {
  try {
    const p = await amm.getSpotPrice();
    console.log("SpotPrice:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("SpotPrice", e)
  }
}

async function getSettlementPrice(amm, web3) {
  try {
    const p = await amm.getSettlementPrice();
    console.log("SettlementPrice:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("SettlementPrice", e)
  }
}

async function getTwapPrice(amm, interval, web3) {
  try {
    const p = await amm.getTwapPrice(interval);
    console.log("SpotPrice:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("SpotPrice", e)
  }
}

async function getReserve(amm, web3) {
  try {
    const r = await amm.getReserve();
    console.log("getReserve quote:" + web3.utils.fromWei(r[0].toString()))
    console.log("getReserve base:" + web3.utils.fromWei(r[1].toString()))
  } catch (e) {
    console.log("SpotPrice", e)
  }
}

// 0: ADD_TO_AMM for long, 1: REMOVE_FROM_AMM for short
async function getInputTwap(amm, dir, qAmount, web3) {
  try {
    const p = await amm.getInputTwap(dir, 
      { d: qAmount });
    console.log("getInputTwap:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("getInputTwap", e)
  }
}

// 0: ADD_TO_AMM for short, 1: REMOVE_FROM_AMM for long
async function getOutputTwap(amm, dir, bAmount, web3) {
  try {
    const r = await amm.getOutputTwap(dir, 
      { d: bAmount });
    console.log("getOutputTwap:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("getOutputTwap", e)
  }
}

// 0: ADD_TO_AMM for long , 1: REMOVE_FROM_AMM for short
async function getInputPrice(amm, dir, qAmount, web3) {
  try {
    const p = await amm.getInputPrice(dir, 
      { d: qAmount });
    console.log("getInputPrice:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("getInputPrice", e)
  }
}

// 0 : ADD_TO_AMM for short, 1: REMOVE_FROM_AMM for long
async function getOutputPrice(amm, dir, bAmount, web3) {
  try {
    const r = await amm.getOutputPrice(dir, 
      { d: bAmount });
    console.log("getOutputPrice:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("getOutputPrice", e)
  }
}


module.exports = {
  getUnderlyingPrice,
  getUnderlyingTwapPrice,
  getSpotPrice,
  getSettlementPrice,
  getTwapPrice,
  getReserve,
  getInputTwap,
  getOutputTwap,

  getInputPrice,
  getOutputPrice
}