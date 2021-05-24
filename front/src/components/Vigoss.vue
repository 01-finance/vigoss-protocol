<template>
  <div class="hello">
    <h1>Vigoss Demo</h1>
    <span>USDC 余额：{{ usdcBalance }} </span>
    

  </div>
</template>

<script>

import proxy from "./../proxy.js";
import { fromDec }from "./../decUtil.js";

export default {
  name: 'Vigoss',
  data() {
    return {
      usdcBalance: null,
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
    },

    balanceOf() {
      this.usdc.balanceOf(this.account).then(r => {
        this.usdcBalance = fromDec(r.toString(), 18);
      })
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
