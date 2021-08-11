// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "./interface/IClearingHouse.sol";
import "./interface/IAmm.sol";
import "./interface/IVGSForLP.sol";
import "./interface/IVGSForMargin.sol";

import "hardhat/console.sol";

import { Decimal } from "./utils/Decimal.sol";
import { SignedDecimal } from "./utils/SignedDecimal.sol";

contract VigossReader  {
    using Decimal for Decimal.decimal;
    using SignedDecimal for SignedDecimal.signedDecimal;

    struct AmmStates {
        uint256 quoteAssetReserve;
        uint256 baseAssetReserve;
        uint256 tradeLimitRatio;
        uint256 fundingPeriod;
        string quoteAssetSymbol;
        string baseAssetSymbol;
        address baseAsset;
    }


    IVGSForLP public vgsForLP;
    IVGSForMargin public vgsForMargin;

    constructor(
      IVGSForLP _vgsForLP,
      IVGSForMargin _vgsForMargin
    ) public {
      vgsForLP = _vgsForLP;
      vgsForMargin = _vgsForMargin;
    }


  // 返回 amms 池子的 TVL 及 日收益
  // 日收益率 = VGS产量24小时产量 * VGS价格/ 池子TVL

    function poolsTvlArp(address[] memory _amms) external view returns (uint[] memory tvls, uint[] memory arps) {
        uint len = _amms.length;
        tvls = new uint[](len);
        arps = new uint[](len);
        
        uint tvl;
        uint arp;

        for (uint256 index = 0; index < len; index++) {
            tvl = IAmm(_amms[index]).totalLiquidityUSD();
            tvls[index] = tvl;

            uint vgsAmmount = vgsForLP.getPoolVgs(_amms[index], 1 days);
            arp = vgsAmmount * getVGSPrice() / tvl;
            arps[index] = arp;
        }
    }

    // 0.1 USDT
    function getVGSPrice() internal view returns (uint256) {
        return 1e17;
    }

    // 预估清算价格(ignore payfunding)
    // mrr: maintenanceMarginRatio
    // MarginRatio(mrr) = margin / (size * price)
    // LiquidatePrice = margin / mrr / size;
    
    function getLiquidatePrice(Decimal.decimal memory _margin,
        SignedDecimal.signedDecimal memory _size,
        Decimal.decimal memory _mrr) public view returns (Decimal.decimal memory liqPrice) {
          liqPrice = _margin.divD(_size.abs()).divD(_mrr);
          console.log("liqPrice:" + liqPrice.toUint());
      }
  

    function traderPosition(address[] memory _clearingHouses, address _trader, IClearingHouse.PnlCalcOption _pnlCalcOption) external view returns (
      IClearingHouse.Position[] memory pos,
      Decimal.decimal[] memory pnls,
      SignedDecimal.signedDecimal[] memory unPnls,  // 未实现盈亏
      Decimal.decimal[] memory liqPrices,
      SignedDecimal.signedDecimal[] memory marginRatios) {

        console.log("traderPosition");

        uint len = _clearingHouses.length;
        pos = new IClearingHouse.Position[](len);
        pnls = new Decimal.decimal[](len);
        unPnls = new SignedDecimal.signedDecimal[](len);
        console.log("after new");

        for (uint256 index = 0; index < len; index++) {
            IClearingHouse ch = IClearingHouse(_clearingHouses[index]);
            console.log("getPosition");
            IClearingHouse.Position memory p = ch.getPosition(_trader);
            pos[index] = p;
            console.log("getMaintenanceMarginRatio");
            Decimal.decimal memory mrr = ch.getMaintenanceMarginRatio();

            console.log("getPositionNotionalAndUnrealizedPnl");
            (Decimal.decimal memory pnl, SignedDecimal.signedDecimal memory unPnl) =
                ch.getPositionNotionalAndUnrealizedPnl(_trader, _pnlCalcOption);

            pnls[index] = pnl;
            unPnls[index] = unPnl;
            console.log("getLiquidatePrice");
            liqPrices[index] = getLiquidatePrice(p.margin, p.size, mrr);
            
            console.log("getLiquidatePrice");
            marginRatios[index] = ch.getMarginRatio(_trader);
            
        }

    }


    function getAmmStates(address _amm) external view returns (AmmStates memory) {
        IAmm amm = IAmm(_amm);
        (bool getSymbolSuccess, bytes memory quoteAssetSymbolData) =
            address(amm.quoteAsset()).staticcall(abi.encodeWithSignature("symbol()"));

        (bool getBaseSymbolSuccess, bytes memory baseAssetSymbolData) =
            address(amm.quoteAsset()).staticcall(abi.encodeWithSignature("symbol()"));

        (Decimal.decimal memory quoteAssetReserve, Decimal.decimal memory baseAssetReserve) = amm.getReserve();

        address baseAsset = address(amm.baseAsset());
        return
            AmmStates({
                quoteAssetReserve: quoteAssetReserve.toUint(),
                baseAssetReserve: baseAssetReserve.toUint(),
                tradeLimitRatio: amm.getTradeLimitRatio().toUint(),
                fundingPeriod: amm.fundingPeriod(),
                baseAsset: baseAsset,
                quoteAssetSymbol: getSymbolSuccess ? abi.decode(quoteAssetSymbolData, (string)) : "",
                baseAssetSymbol: getBaseSymbolSuccess ? abi.decode(baseAssetSymbolData, (string)) : ""
            });
    }

    // TODO: move to library
    function bytes32ToString(bytes32 _key) private pure returns (string memory) {
        uint8 length;
        while (length < 32 && _key[length] != 0) {
            length++;
        }
        bytes memory bytesArray = new bytes(length);
        for (uint256 i = 0; i < 32 && _key[i] != 0; i++) {
            bytesArray[i] = _key[i];
        }
        return string(bytesArray);
    }

  

}