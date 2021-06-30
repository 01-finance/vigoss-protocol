<template>
<div class="hello">
  <h1>Vigoss Demo</h1>
  <span>USDC 余额：{{ usdcBalance }} </span>
  <br>
  <span>当前价：1 ETH = {{ currPrice }} USDC</span>
  <h3>下单</h3>
  <div>
    <input type="radio" id="long" value="0" v-model="longOrShort">
    <label for="long">做多</label>
    <br>
    <input type="radio" id="short" value="1" v-model="longOrShort">
    <label for="short">做空</label>
    <br>
    <input v-model="baseAmount" placeholder="标的数量">
    <br>
    <input v-model="margin" placeholder="保证金数量">
    <br>
    <input v-model="leverage" @change="calcFee" placeholder="杠杆倍数">

    <br>
    <span>交易费：{{ transactionFee }} USDC </span>
    <span>总成本：{{ totalCost }} USDC </span>
    <br>

    <button @click="approve">(先)授权</button>
    <button @click="allowance">查询授权: {{ allowanced }}</button>
    <button @click="openPosition">(后)下单</button>
  </div>

  <h3>我的订单</h3>
  <div v-if="myPosition">
    <span>保证金: {{ this.myPosition.margin }}</span>
    <br>
    <span> size(负表示做空) : {{ this.myPosition.baseAsset}}</span>
    <br>
    <span> MarginRate : {{ myPosition.marginRate}}</span>
    <br>

    <span> blockNumber: {{ this.myPosition.blockNumber}}</span>
    <br>
    <span> openNotional: {{ this.myPosition.openNotional}}</span>
    <br>
    <span> lastUpdatedCumulativePremiumFraction: {{ this.myPosition.lastUpdatedCumulativePremiumFraction}}</span>
    <br>
    <span> lastApportionFraction: {{ this.myPosition.lastApportionFraction }} </span>
    <br>
    <button @click="closePosition">Close</button>

    <div>
      <input v-model="adjustAmount" placeholder="调整的保证金数量">
      <button @click="removeMargin">减少保证金</button>
      <button @click="addMargin">增加保证金</button>
    </div>
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
      currPrice: null,
      margin: null,
      leverage: null,
      transactionFee: null,
      totalCost: null,
      myPosition: null,
      adjustAmount: null,
      allowanced: null,
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

      let ETHUSDCHouse = require(`../../abis/ClearingHouse:ETH-USDC.${network}.json`);
      this.ch = await proxy.getClearingHouse(ETHUSDCHouse.address);

      let ETHUSDCPair = require(`../../abis/Amm:ETH-USDC.${network}.json`);
      this.ammPair = await proxy.getAmm(ETHUSDCPair.address);

      this.getPosition();
      this.getSpotPrice();
    },

    balanceOf() {
      this.usdc.balanceOf(this.account).then(r => {
        this.usdcBalance = fromDec(r.toString(), this.decimal);
      })
    },

    getSpotPrice() {
      this.ammPair.getSpotPrice().then(r => {
        this.currPrice = this.web3.utils.fromWei(r.toString());
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
        this.margin = formatNum(this.web3.utils.fromWei(p.toString()), 6);
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
        this.baseAmount = formatNum(this.web3.utils.fromWei(p.toString()), 6);
      }

    },




    calcFee() {
      let qAmount = toDec(parseFloat(this.margin) * parseFloat(this.leverage), this.decimal);
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

    allowance()  {
      this.usdc.allowance(this.account, this.ch.address).then((r) => {
        this.allowanced = fromDec(r, this.decimal);
      })
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
      let Slippage = 0.01;  // 滑点设置  1%
      let offSet = this.longOrShort > 0 ?  1 + Slippage :  1 - Slippage
      let minBase = parseFloat(this.baseAmount) * offSet;
      
      console.log("minBase:" + minBase)
      let minAmount = toDec(minBase, 18);
      
      this.ch.openPosition(this.longOrShort,
        { d: qAmount },
        { d: lev },
        { d: minAmount },
        { from: this.account }).then(() => {
          this.getPosition();
        })
    },

    async getPosition() {

      try {
        let marginRate = await this.ch.getMarginRatio( this.account);
        
        this.ch.getPosition( this.account).then((position) => {
        let myPosition = {};
        myPosition.margin = this.web3.utils.fromWei(position.margin.toString())
        myPosition.baseAsset = this.web3.utils.fromWei(position.size.toString())
        myPosition.openNotional = this.web3.utils.fromWei(position.openNotional.toString())
        myPosition.lastUpdatedCumulativePremiumFraction = this.web3.utils.fromWei(position.lastUpdatedCumulativePremiumFraction.toString())
        myPosition.blockNumber = position.blockNumber
        myPosition.marginRate =  this.web3.utils.fromWei(marginRate.toString());
        myPosition.lastApportionFraction = this.web3.utils.fromWei(position.lastApportionFraction.toString())
        this.myPosition = myPosition;
      
        })
      } catch (e) {
        console.log("getPosition:", e);
      }


    },

    // TODO: {d: "0"}
    closePosition() {
      this.ch.closePosition( {d: "0"}, 
        { from : this.account}).then( () => {
        this.getPosition();
      })
    },

    removeMargin() {
      let amount = this.web3.utils.toWei(this.adjustAmount);
      this.ch.removeMargin( 
      {d: amount}, {from: this.account}).then(() => {
        this.getPosition();
      })
    },

    addMargin() {
      let amount = this.web3.utils.toWei(this.adjustAmount);
      this.ch.addMargin(
      {d: amount}, 
      {from: this.account}).then(() => {
        this.getPosition();
      })
    }

  }

}
</script>
