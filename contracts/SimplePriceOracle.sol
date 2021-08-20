// SPDX-License-Identifier: MIT
// Created by Flux Team

pragma solidity 0.6.9;

import { Ownable } from "./openzeppelin/access/Ownable.sol";
import { SafeMath } from "./openzeppelin/math/SafeMath.sol";
import "hardhat/console.sol";

/**
    @title 价格预言机
 */
interface IPriceOracle {
    ///@notice 价格变动事件
    event PriceChanged(address token, uint256 oldPrice, uint256 newPrice);

    /**
      @notice 获取资产的价格
      @param token 资产
      @return uint256 资产价格（尾数）
     */
    function getPriceMan(address token) external view returns (uint256);
}

/**
    @title 自主喂价价格预言机
    @dev 价格来源于管理员自行更新价格
 */
contract SimplePriceOracle is IPriceOracle, Ownable {
  using SafeMath for uint256;

    ///@dev 各借贷市场的价格信息
    mapping(address => mapping(uint => Underlying)) roundPrices;
    mapping(address => uint) public rounds;

    /// @dev 授权喂价
    mapping(address => bool) public feeders;
    struct Underlying {
        uint256 lastUpdateTs;
        uint256 lastPriceMan;
    }

    constructor(address admin) public {
        feeders[admin] = true;
    }

    /**
      @notice 获取指定借贷市场中资产的价格
      @param token 资产
     */
    function getPriceMan(address token) public view override returns (uint256) {
        uint round = rounds[token];
        console.log("round:", round);
        if(round == 0) {
          return 0;
        }
        console.log("round - 1:", round.sub(1));
        return roundPrices[token][round.sub(1)].lastPriceMan;
    }

    /**
     * @notice 设置标的资产价格
     * @param token 标的资产
     * @param priceMan 标的资产的 USDT 价格，价格精准到 18 位小数。
     * @dev 注意，这里的 priceMan 是指一个资产的价格，类似于交易所中的价格。
     *  如 一个比特币价格为 10242.04 USDT，那么此时 priceMan 为 10242.04 *1e18
     */
    function _setPrice(address token, uint256 priceMan) private {
        require(priceMan > 0, "ORACLE_INVALID_PRICE");

        uint round = rounds[token];
        uint256 old = round >= 1 ? roundPrices[token][round.sub(1)].lastPriceMan : 0;
        
        Underlying storage info = roundPrices[token][round];
        info.lastUpdateTs = block.timestamp;
        info.lastPriceMan = priceMan;

        rounds[token] = round.add(1); 
        emit PriceChanged(token, old, priceMan);
    }

    function setPrice(address token, uint256 priceMan) external {
        require(feeders[msg.sender], "ORACLE_INVALID_FEEDER");
        _setPrice(token, priceMan);
    }

    function batchSetPrice(address[] calldata tokens, uint256[] calldata priceMans) external {
        require(feeders[msg.sender], "ORACLE_INVALID_FEEDER");

        require(tokens.length == priceMans.length, "ORACLE_INVALID_ARRAY");
        uint256 len = tokens.length;
        // ignore length check
        for (uint256 i = 0; i < len; i++) {
            _setPrice(tokens[i], priceMans[i]);
        }
    }

    function approveFeeder(address feeder) external onlyOwner {
        feeders[feeder] = true;
    }

    function removeFeeder(address feeder) external onlyOwner {
        delete feeders[feeder];
    }
}
