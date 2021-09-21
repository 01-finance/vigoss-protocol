<template>
<div class="hello">
  <h1>Vigoss Demo</h1>
  <span>USDT 余额：{{ USDTBalance }} </span>
  <br>
  <span>VGS 余额：{{ vgsBalance }} </span>
  <br>
  <span>当前价：1 ETH = {{ currPrice }} USDT</span>
  <br>
  <span>预言机价：1 ETH = {{ currUnderlyingPrice }} USDT</span>

  
  <h3>开仓</h3>
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
    <span>交易费：{{ transactionFee }} USDT </span>
    <span>总成本：{{ totalCost }} USDT </span>
    <br>

    <button @click="approve">(先)授权</button>
    <button @click="allowance">查询授权: {{ allowanced }}</button>
    <button @click="openPosition">(后)下单</button>
  </div>

  <h3>我的仓位</h3>
  <div v-if="myPosition">
    <span>保证金: {{ this.myPosition.margin }}</span>
    <br>
    <span> size(负表示做空) : {{ this.myPosition.baseAsset}}</span>
    <br>
    <span> MarginRate : {{ myPosition.marginRate}}</span>

    <br>

    <span> 杠杆(Leverage):  {{ this.myPosition.openNotional / this.myPosition.margin }} </span>
    <br>

    <span> 建仓价格 </span> {{ this.myPosition.openNotional / this.myPosition.baseAsset }}
    <br>

    <span> 清算价格(~): </span> {{ this.myPosition.liqPrice }}

    <br>
    <span> openNotional(开仓价值): {{ this.myPosition.openNotional}}</span>
    <br>

    <span> unPnl(盈亏): {{ this.myPosition.unPnl}}</span>
    <br>

    <span>  退出价值: {{  pnl }} </span>
    <br>

    <span>  退出价格: {{  pnl / this.myPosition.baseAsset  }} </span>
    <br>

    <span>  退出费用: {{ exitFee }} </span>    
    <br>


    <div>
      <input v-model="adjustAmount" placeholder="调整的保证金数量">
      <button @click="removeMargin">减少保证金</button>
      <button @click="addMargin">增加保证金</button>
    </div>

        
  </div>

<button @click="closePosition">Close</button>

    <div>
        保证金挖矿所得待提取 vgs 数量 ：{{  pendingMarginVgs }} 
        <button @click="settleMarginVgs">提取</button>
      </div>

  <h3>LP 管理</h3>
    <div>
        <input v-model="supplyLP" placeholder="提供 U 的数量">
        <button @click="approveAmm">(先)授权</button>
        <button @click="addLp">添加流动性</button>
    </div> 

    <div>
      我的 LP ：{{ lpBalance }} ,  总 LP : {{ lpTotal }} 
      <br>
      <input v-model="exitLpAmount" placeholder="退出 LP 数量">
      <button @click="removeLiquidity">退出流动性</button>
    </div>



    <div>
      LP 挖矿 待提取的 vgs 数量: {{ pendingLpVgs }}
      <button @click="settleLpVgs">提取</button>
    </div>

    <div>
      TVL: {{ tvl }}
      日收益率(ARP): {{ arp }}
    </div>

    <h3>测试备注信息：</h3>
    AMM LP 地址：{{ ammlpAddr }},
    <br>
    AMM LP 挖矿地址: {{ ammVgsLPMinerAddr }}
    <br>
    保证金挖矿地址: {{ ammVgsMarginMinerAddr }}
    <br>

    VGS 地址：{{ vgsAddr }}
    <br>
    USDT 地址: {{ USDTAddr }} 



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
      USDTBalance: null,
      vgsBalance: null,
      longOrShort: 0,
      baseAmount: null,
      currPrice: null,
      currUnderlyingPrice: null,
      margin: null,
      leverage: null,
      transactionFee: null,
      totalCost: null,
      myPosition: null,
      adjustAmount: null,
      allowanced: null,
      supplyLP: null,
      pendingLpVgs: null,
      pendingMarginVgs: null,
      lpBalance: null,
      lpTotal: null,
      exitLpAmount: null,
      ammlpAddr: null,
      vgsAddr: null,
      USDTAddr: null,
      ammVgsLPMinerAddr: null,
      ammVgsMarginMinerAddr: null,
      tvl: null,
      arp: null,

      pnl: null,
      exitFee: null,
    }
  },

  created() {
    proxy.initWeb3Account((web3, acc) => {
      this.account = acc
      this.web3 = web3

      this.web3.eth.net.getId().then(id => {
        this.chainid = id
        console.log("this.chainid:" + this.chainid)
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
      this.USDT = await proxy.getUSDTToken(this.chainid);
      this.decimal = await this.USDT.decimals();

      this.vgs = await proxy.getVgs(this.chainid);
      this.vgsForLp = await proxy.getVgsForLP(this.chainid);
      this.vgsForMargin = await proxy.getVgsForMargin(this.chainid);

      // await proxy.getGreeter();

      this.vgsReader = await proxy.getVigossReader(this.chainid);


      this.balanceOf();

      const network = NETWORK_NAME[this.chainid];
      console.log(network)

      // 用户交易
      let ETHUSDTHouse = require(`../../abis/ClearingHouse:ETH-USDT.${network}.json`);
      this.ch = await proxy.getClearingHouse(ETHUSDTHouse.address);

      // LP 池
      let ETHUSDTPair = require(`../../abis/Amm:ETH-USDT.${network}.json`);
      console.log(ETHUSDTPair);
      this.ammPair = await proxy.getAmm(ETHUSDTPair.address);

      this.ammlpAddr =  this.ammPair.address;
      this.vgsAddr = this.vgs.address;
      this.USDTAddr = this.USDT.address;
      
      this.ammVgsLPMinerAddr = this.vgsForLp.address;
      this.ammVgsMarginMinerAddr = this.vgsForMargin.address;


      this.getPosition();
      this.getExitPosition();
      this.getSpotPrice();
      this.liquidityInfo();
      // this.pendingVsgOnLp();
      this.pendingVsgOnMargin();
      this.getPoolsTvlArp()
    },

    balanceOf() {
      this.USDT.balanceOf(this.account).then(r => {
        this.USDTBalance = fromDec(r.toString(), this.decimal);
      })

      this.vgs.balanceOf(this.account).then(r => {
        this.vgsBalance = fromDec(r.toString(), 18);
      })

    },

    getSpotPrice() {
      this.ammPair.getSpotPrice().then(r => {
        this.currPrice = fromDec(r.toString(), this.decimal);
      })

      this.ammPair.getUnderlyingPrice().then(r => {
        this.currUnderlyingPrice = fromDec(r.toString(), this.decimal);
      })
    },

    async getOutPrice() {
      if (this.leverage != null && this.baseAmount != null) {
        let bAmount = toDec(parseFloat(this.baseAmount) / parseFloat(this.leverage), 18);

        let dir = 0;
        if (this.longOrShort == 0) {
          dir = 1
        }


        let p = await this.ammPair.getOutputPrice(dir, {
          d: bAmount
        })
        console.log("output:" + p);
        this.margin = formatNum(fromDec(p.toString(), this.decimal), 6);
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
      console.log("calcFee");

      let qAmount = toDec(formatNum(parseFloat(this.margin) * parseFloat(this.leverage), 6), this.decimal);
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
      this.USDT.allowance(this.account, this.ch.address).then((r) => {
        this.allowanced = fromDec(r, this.decimal);
      })
    },

    approve() {
      // let qAmount = toDec(this.totalCost, this.decimal);
      // console.log("approve:" + qAmount)
      this.USDT.approve(this.ch.address, MaxUint, {
        from: this.account
      }).then(() => {

      })
    },

    approveAmm() {
      this.USDT.approve(this.ammPair.address, MaxUint, {
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
          this.getExitPosition();
        })
    },

    getPoolsTvlArp() {
      this.vgsReader.poolsTvlArp([this.ammPair.address] // 如果有多个 LP 池，则传入多个地址
        ).then((r) => {
          let tvls = r.tvls;
          let arps = r.arps;

        this.tvl = fromDec(tvls[0].toString(), this.decimal)  // 获得第一个LP 池质押的 TVL

        this.arp = this.web3.utils.fromWei(arps[0].toString())
      })
    },

    // 获得退出仓位的信息
    getExitPosition() {
      this.vgsReader.getExitPosition(
        this.ch.address,  
        this.account,
        0
        ).then( (r) => {
            // 保证金
            console.log("margin:" + fromDec(r.margin.toString(), this.decimal))
            
            // 仓位价值(用来计算退出滑点的基数)
            this.pnl = fromDec(r.pnl.toString(), this.decimal)

            // 盈亏
            console.log("unPnl:" +  fromDec(r.unPnl.toString(), this.decimal));

            // 退出手续费
            this.exitFee = fromDec(r.fee.toString(), this.decimal)
        });

    },

    getPosition() {
      // this.ch.getPosition(this.account).then( (r) => {
      //   console.log(r.size)
      // });

      this.vgsReader.traderPosition([this.ch.address],  // 可以传入多个地址
        this.account,
        0
        ).then( (r) => {
        let positionArr = r.pos;
        // let pnls = r.pnls;
        let unPnls = r.unPnls;
        let liqPrices = r.liqPrices;
        let marginRatios = r.marginRatios;


        let position = positionArr[0];

        let myPosition = {};
        myPosition.margin = fromDec(position.margin.toString(), this.decimal);
        myPosition.baseAsset = this.web3.utils.fromWei(position.size.toString())
        myPosition.openNotional = fromDec(position.openNotional.toString(), this.decimal);
        myPosition.lastUpdatedCumulativePremiumFraction = this.web3.utils.fromWei(position.lastUpdatedCumulativePremiumFraction.toString())
        myPosition.marginRate =  this.web3.utils.fromWei(marginRatios[0].toString());

        myPosition.liqPrice = fromDec(liqPrices[0].toString(), this.decimal);
        myPosition.unPnl = fromDec(unPnls[0].toString(), this.decimal);
        
        this.myPosition = myPosition;
      }
      )

    },


    closePosition() {
      let Slippage = 0.01;  // 滑点设置  1%

      let offSet = this.myPosition.baseAsset < 0 ?  1 + Slippage :  1 - Slippage
      
      let minBase = formatNum(parseFloat(this.pnl) * offSet, 6).replace(',', '')
      
      let min = toDec(minBase, this.decimal);

      this.ch.closePosition( {d: min}, 
        { from : this.account}).then( () => {
        this.getPosition();
      })
    },

    removeMargin() {
      let amount = toDec(this.adjustAmount, this.decimal);
      this.ch.removeMargin( 
      {d: amount}, {from: this.account}).then(() => {
        this.getPosition();
      })
    },

    addMargin() {
      let amount = toDec(this.adjustAmount, this.decimal);
      this.ch.addMargin(
      {d: amount}, 
      {from: this.account}).then(() => {
        this.getPosition();
      })
    },

    addLp() {
        let amount = toDec(this.supplyLP, this.decimal);
        this.ammPair.addLiquidity(this.account, amount, {from: this.account}).then(() => {
            this.liquidityInfo();
        })

    },

    removeLiquidity() {
        let liquidity = this.web3.utils.toWei(this.exitLpAmount);
        this.ammPair.removeLiquidity(this.account, liquidity, {from: this.account}).then(() => {
            this.liquidityInfo();
        })
    },

    liquidityInfo() {

      this.vgsReader.poolShares([this.ammPair.address],  // 可存入多个 LP 数组
        this.account).then((r) => {
        this.lpTotal = this.web3.utils.fromWei(r.totals[0].toString())
        this.lpBalance = this.web3.utils.fromWei(r.balances[0].toString())
        this.pendingLpVgs = this.web3.utils.fromWei(r.pendingVgs[0].toString());
      })

    
    //  this.ammPair.totalLiquidity().then((p) => {
    //      this.lpTotal = this.web3.utils.fromWei(p.toString())
    //  })

    //  this.ammPair.shares(this.account).then((r) => {
    //      this.lpBalance = this.web3.utils.fromWei(r.toString())
    //  })
    
    },


    pendingVsgOnLp() {
        // 单个 LP 挖矿所得：
        // this.vgsForLp.pendingVgs(this.ammPair.address, this.account).then((r) => {
        //     
        // });

        // 用户所有 LP 挖矿所得
        this.vgsForLp.allPendingVgs(this.account).then((r) => {
            this.pendingLpVgs = this.web3.utils.fromWei(r.toString());
        });
    },

    pendingVsgOnMargin() {
      this.vgsForMargin.userInfo(this.account).then((r) => {
        console.log("userInfo amount:" + r.amount.toString())
      });

        this.vgsForMargin.pendingVgs(this.account).then((r) => {
          console.log("pendingMarginVgs" + r.toString())
            this.pendingMarginVgs = this.web3.utils.fromWei(r.toString());
        });
    },


    settleMarginVgs() {
         this.vgsForMargin.settlement({from: this.account}).then(() => {
            this.pendingVsgOnMargin();
        });
    },

    settleLpVgs() {
        this.vgsForLp.settlementAll({from: this.account}).then(() => {
            // this.pendingVsgOnLp();
            this.balanceOf();
        });
    }

  }


}
</script>
