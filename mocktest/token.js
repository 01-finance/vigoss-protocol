
async function totalSupply(token, web3) {
  try {
    let ts =  await token.totalSupply()
    console.log("totalSupply : " +  web3.utils.fromWei(ts))
  }  catch (e) {
    console.log("totalSupply error", e)
  }
}

async function balanceOf(token, user, web3, tag) {
  try {
    let bofU =  await token.balanceOf(user,  {from: user} )
    console.log(tag + "balanceOf : " +  web3.utils.fromWei(bofU))
  }  catch (e) {
    console.log("balanceOf error", e)
  }
}

async function approve(token, owner, spender, amount) {
  try {
    let tx = await token.approve(spender, amount, {from: owner} )
    console.log("approve done, gas:" + tx['receipt']['gasUsed'])
  } catch (e) {
    console.log("approve error", e)
  }  
}

async function transfer(token, from, to, amount) {
  try {
    tx = await token.transfer(to, amount, {
      from: from
    } )
    console.log("transfer done, gas:" + tx['receipt']['gasUsed'])
  } catch (e) {
    console.log("transfer error", e)
  }    
}

module.exports = {
  totalSupply,
  balanceOf,
  transfer,
  approve
}