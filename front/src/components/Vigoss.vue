<template>
<div class="hello">
  <h1>Vigoss Demo</h1>
  <span>USDC 余额：{{ usdcBalance }} </span>

  <div>
    <input type="radio" id="long" value="0" v-model="longOrShort">
    <label for="long">做多</label>
    <input type="radio" id="short" value="1" v-model="longOrShort">
    <label for="short">做空</label>

    <input v-model="baseAmount" placeholder="标的数量">
    <input v-model="margin" placeholder="保证金数量">
    <input v-model="leverage" @change="calcFee" placeholder="杠杆倍数">

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
import {
  NETWORK_NAME,
  MaxUint
} from "./../constants.js";
import {
  fromDec,
  toDec,
  formatNum
} from "./../decUtil.js";

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
      this.decimal = await this.usdc.decimals();
      this.balanceOf();

      const network = NETWORK_NAME[this.chainid];
      console.log(network)

      this.ch = await proxy.getClearingHouse(this.chainid);

      let ETHUSDCPair = require(`../../abis/Amm:ETH-USDC.${network}.json`);
      this.ammPair = await proxy.getAmm(ETHUSDCPair.address);
    },

    balanceOf() {
      this.usdc.balanceOf(this.account).then(r => {
        this.usdcBalance = fromDec(r.toString(), this.decimal);
      })
    },

    async getOutPrice() {
      if (this.leverage != null && this.baseAmount != null) {
        let bAmount = toDec(parseFloat(this.baseAmount) / parseFloat(this.leverage), this.decimal);

        let dir = 0;
        if (this.longOrShort == 0) {
          dir = 1
        }

        let p = await this.ammPair.getOutputPrice(dir, {
          d: bAmount
        })
        this.margin = formatNum(this.web3.utils.fromWei(p.toString()), 4);
      }
    },

    async getInputPrice() {
      // const ADD_TO_AMM = 0;
      // const REMOVE_FROM_AMM = 1;

      if (this.leverage != null && this.margin != null) {
        let qAmount = toDec(parseFloat(this.margin) * parseFloat(this.leverage), this.decimal);
        let p = await this.ammPair.getInputPrice(this.longOrShort, {
          d: qAmount
        })
        this.baseAmount = formatNum(this.web3.utils.fromWei(p.toString()), 4);
      }

    },

    calcFee() {
      let qAmount = toDec(this.margin, this.decimal);
      this.ammPair.calcFee({
        d: qAmount
      }).then(fee => {
        this.transactionFee = fromDec((fee[0] + fee[1]).toString(), this.decimal);
        console.log(this.transactionFee)

        this.totalCost = formatNum(parseFloat(this.margin) + parseFloat(this.transactionFee), 2)
      });

      if (this.margin != null) {
        this.getInputPrice();
      } else {
        if (this.baseAmount != null) {
          this.getOutPrice();
        }
      }

    },

    approve() {
      // let qAmount = toDec(this.totalCost, this.decimal);
      // console.log("approve:" + qAmount)
      this.usdc.approve(this.ch.address, MaxUint, {
        from: this.account
      }).then(() => {

      })
    },

    openPosition() {
      let qAmount = toDec(this.margin, this.decimal);
      let lev = toDec(this.leverage, 18);
      let Slippage = 0.99; // 
      let minAmount = toDec(parseFloat(this.baseAmount) * Slippage, 18);
      this.ch.openPosition(this.ammPair.address,
        this.longOrShort,
        { d: qAmount },
        { d: lev },
        { d: minAmount },
        { from: this.account })
    }

  }

}
</script>
