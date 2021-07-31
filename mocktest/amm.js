//get oracle price
async function getUnderlyingPrice(amm, web3) {
  try {
    const p = await amm.getUnderlyingPrice();
    console.log("underlyingPrice:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("getUnderlyingPrice", e)
  }
}

async function initLiquidity(amm, user, quoteAmount, assetAmount) {
  try {
    const p = await amm.initLiquidity(user, quoteAmount, assetAmount, {from: user});
    console.log("initLiquidity OK")
  } catch (e) {
    console.log("initLiquidity", e)
  }
}

async function addLiquidity(amm, user, quoteAmount) {
  try {
    const p = await amm.addLiquidity(user, quoteAmount, {from: user});
    console.log("addLiquidity OK")
  } catch (e) {
    console.log("addLiquidity", e)
  }
}

async function removeLiquidity(amm, user, liquidity) {
  try {
    const p = await amm.removeLiquidity(user, liquidity, {from: user});
    console.log("removeLiquidity OK")
  } catch (e) {
    console.log("removeLiquidity", e)
  }
}

async function totalLiquidity(amm, web3) {
  try {
    const p = await amm.totalLiquidity();
    console.log("totalLiquidity:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("totalLiquidity", e)
  }
}

async function shares(amm, user, web3) {
  try {
    const p = await amm.shares(user);
    console.log("shares :" + p.toString())
    console.log("shares:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("shares", e)
  }
}

async function liquidityStakes(amm, user, web3) {
  try {
    const p = await amm.liquidityStakes(user);
    console.log("liquidityStakes quoteAsset:" + web3.utils.fromWei(p[0].toString()))
    console.log("liquidityStakes baseAsset:" + web3.utils.fromWei(p[1].toString()))
  } catch (e) {
    console.log("liquidityStakes", e)
  }
}


async function getLongShortSize(amm, web3) {

  try {
    const p = await amm.getLongShortSize();
    console.log("Long:" + web3.utils.fromWei(p[0].toString()))
    console.log("Short:" + web3.utils.fromWei(p[1].toString()))
  } catch (e) {
    console.log("getUnderlyingPrice", e)
  }
}


async function getLongApportionFraction(amm, web3) {

  try {
    const p = await amm.getLongApportionFraction();
    console.log("LongFraction:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("getLongApportionFraction", e)
  }
}

async function getShortApportionFraction(amm, web3) {

  try {
    const p = await amm.getShortApportionFraction();
    console.log("ShortFraction:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("getShortApportionFraction", e)
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
    console.log("SettlementPrice", e.toString())
  }
}

async function getTwapPrice(amm, interval, web3) {
  try {
    const p = await amm.getTwapPrice(interval);
    console.log("getTwapPrice:" + web3.utils.fromWei(p.toString()))
  } catch (e) {
    console.log("getTwapPrice", e.toString())
  }
}

async function getReserve(amm, web3) {
  try {
    const r = await amm.getReserve();
    console.log("getReserve quote:" + web3.utils.fromWei(r[0].toString()))
    console.log("getReserve base:" + web3.utils.fromWei(r[1].toString()))
  } catch (e) {
    console.log("getReserve", e.toString())
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


async function isInFusing(amm) {
  try {
    const fusing = await amm.isInFusing();
    console.log("isInFusing:" + fusing)
  } catch (e) {
    console.log("isInFusing error", e)
  }  
}

// 0: ADD_TO_AMM for short, 1: REMOVE_FROM_AMM for long
async function getOutputTwap(amm, dir, bAmount, web3) {
  try {
    const p = await amm.getOutputTwap(dir, 
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
    const p = await amm.getOutputPrice(dir, 
      { d: bAmount });
    console.log("getOutputPrice:" + web3.utils.fromWei(p.toString()))
    return p;
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
  isInFusing,
  getInputTwap,
  getOutputTwap,
  getLongShortSize,
  getInputPrice,
  getOutputPrice,
  getLongApportionFraction,
  getShortApportionFraction,
  initLiquidity,
  addLiquidity,
  removeLiquidity,
  totalLiquidity,
  shares,
  liquidityStakes
}