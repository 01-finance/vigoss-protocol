<template>
  <div class="hello">
    <h1>Vigoss Demo</h1>
    <span>USDC 余额：{{ usdcBalance }} </span>

    <div>
      <input type="radio" id="long" value="0" v-model="longOrShort">
      <label for="long">做多</label>
      <input type="radio" id="short" value="1" v-model="longOrShort">
      <label for="short">做空</label>
      

      <input v-model="baseAmount" @change="calcFee" placeholder="标的数量">
      <input v-model="margin" @change="calcFee" placeholder="保证金数量">
      <input v-model="leverage" placeholder="杠杆倍数">
      
      <br>
      <span>交易费：{{ transactionFee }} USDC </span>
      <span>总成本：{{ totalCost }} USDC </span>
      <br>

      <button @click="approve">授权</button>
      <button @click="openPosition">下单</button>
    </div>
    

  </div>
</template>

<script>

import proxy from "./../proxy.js";
import { NETWORK_NAME } from "./../constants.js";
import { fromDec, toDec, formatNum }from "./../decUtil.js";

export default {
  name: 'Vigoss',
  data() {
    return {
      usdcBalance: null,
      longOrShort: 0,
      baseAmount: null,
      margin: null,
      leverage: null,
      transactionFee: null,
      totalCost: null,
    }
  },

  created() {
    proxy.initWeb3Account((web3, acc) => {
      this.account = acc
      this.web3 = web3

      this.web3.eth.net.getId().then(id => {
        this.chainid = id
        this.init()
      })
    })

    window.ethereum.on('accountsChanged', function (accounts) {
      this.account = accounts[0];
      console.log(this.account)  
    })
  },

  methods: {
    async init() {
      this.usdc = await proxy.getUSDCToken(this.chainid);
      this.balanceOf();

      const network = NETWORK_NAME[this.chainid];
      console.log(network)
      let ETHUSDCPair = require(`../../abis/Amm:ETH-USDC.${network}.json`);
      this.ammPair = await proxy.getAmm(ETHUSDCPair.address);
    },

    balanceOf() {
      this.usdc.balanceOf(this.account).then(r => {
        this.usdcBalance = fromDec(r.toString(), 18);
      })
    },


    calcFee() {
      let qAmount = toDec(this.margin, 18);
      this.ammPair.calcFee({ d: qAmount }).then(fee => {
        this.transactionFee = fromDec((fee[0] + fee[1]).toString(), 18);
        console.log(this.transactionFee)

        this.totalCost = formatNum(parseFloat(this.margin) + parseFloat(this.transactionFee), 2)
      });
    },

    approve() {
      this.usdc.approve()
    },

    openPosition() {

    }

  }


}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
