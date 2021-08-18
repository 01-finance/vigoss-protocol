/* eslint-disable */

import Web3 from "web3";
import contract from "@truffle/contract";
import Amm from "../abis/Amm.json";
import ClearingHouse from "../abis/ClearingHouse.json";
import VGSForLP from "../abis/VGSForLP.json";
import VGSForMargin from "../abis/VGSForMargin.json";
import MockToken from "../abis/MockToken.json";
import VigossReader from "../abis/VigossReader.json";
import VigossToken from "../abis/VigossToken.json";
import Greeter from "../abis/Greeter.json";

import { NETWORK_NAME } from "./constants";



export default {


  async initWeb3Account(callback) {
    if (window.ethereum) {
      this.provider = window.ethereum;

      // eth_subscribe are not supported
      if (window.imToken && !window.ethereum.supportsSubscriptions()) {
        window.ethereum.on = null;
      }

      // 请求连接demo.
      try {
        await window.ethereum.enable();
      } catch (error) {
        console.error("User denied account access");
      }
    } else if (window.web3) {
      this.provider = window.web3.currentProvider;
    } else {
      this.provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
    }
    
    this.web3 = new Web3(this.provider);
    this.web3.provider = this.provider

    this.web3.eth.getAccounts((err, accs) => {
      if (err != null) {
        console.error("无法获取账号， 是否安装了 Metamask");
        this.message = "";
        return;
      }

      if (accs.length === 0) {
        console.error("无法获取账号，Metamask 时候正确配置.");
        return;
      }
      // this.account = ;
      callback(this.web3, accs[0])
    })
  },

  getAmm(addr) {
    const proxy = contract(Amm)
    proxy.setProvider(this.provider)
    return proxy.at(addr);
  },

  getUSDTToken(networkId) {
    const networkName = NETWORK_NAME[networkId];
    console.log("usdc networkName:", networkName)
    let addrJs = require(`../abis/USDT.${networkName}.json`);
    // console.log("usdc addr:", addrJs)
    const proxy = contract(MockToken)
    proxy.setProvider(this.provider)
    return proxy.at(addrJs.address);
  },

  getClearingHouse(addr) {
    const proxy = contract(ClearingHouse)
    proxy.setProvider(this.provider)
    return proxy.at(addr);
  },

  getVigossReader(networkId) {
    const networkName = NETWORK_NAME[networkId];
    let addrJs = require(`../abis/VigossReader.${networkName}.json`);

    const proxy = contract(VigossReader)
    proxy.setProvider(this.provider)
    return proxy.at(addrJs.address);

  },

  getVgs(networkId) {
    const networkName = NETWORK_NAME[networkId];
    let addrJs = require(`../abis/VigossToken.${networkName}.json`);
    const proxy = contract(VigossToken)
    proxy.setProvider(this.provider)
    return proxy.at(addrJs.address);
  },

  getVgsForLP(networkId) {
    const networkName = NETWORK_NAME[networkId];
    let addrJs = require(`../abis/VGSForLP.${networkName}.json`);
    // console.log("InsuranceFund addr:", addrJs)
    const proxy = contract(VGSForLP)
    proxy.setProvider(this.provider)
    return proxy.at(addrJs.address);
  },

  getVgsForMargin(networkId) {
    const networkName = NETWORK_NAME[networkId];
    let addrJs = require(`../abis/VGSForMargin.${networkName}.json`);
    // console.log("InsuranceFund addr:", addrJs)
    const proxy = contract(VGSForMargin)
    proxy.setProvider(this.provider)
    return proxy.at(addrJs.address);
  },

  getGreeter() {
    const proxy = contract(Greeter)
    proxy.setProvider(this.provider)
    return proxy.at("0x1a7cd405102523f1f98c2c1358bc2eb7553d91a2");
  }
  

}

