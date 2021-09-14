// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "../interface/IClearingHouse.sol";
import "../interface/IAmm.sol";
import "../interface/IVGSForLP.sol";
import "../interface/IVGSForMargin.sol";

import { Decimal } from "../utils/Decimal.sol";
import { SignedDecimal } from "../utils/SignedDecimal.sol";


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

    function poolShares(address[] memory _amms, address user) external view returns (
        uint[] memory balances,
        uint[] memory totals,
        uint[] memory pendingVgs) {
        uint len = _amms.length;
        balances = new uint[](len);
        totals = new uint[](len);
        pendingVgs = new uint[](len);

        for (uint256 index = 0; index < len; index++) {
            IAmm amm = IAmm(_amms[index]);
            balances[index] = amm.shares(user);
            totals[index] = amm.totalLiquidity();
            pendingVgs[index] = vgsForLP.pendingVgs(address(amm), user);
        }
    }

    function getUsersMarginRatio(IClearingHouse ch, address[] memory _traders) external view returns(SignedDecimal.signedDecimal[] memory mrs) {
      uint len = _traders.length;
      mrs = new SignedDecimal.signedDecimal[](len);

      for (uint256 index = 0; index < len; index++) {
        try ch.getMarginRatio(_traders[index]) returns (SignedDecimal.signedDecimal memory mr) {
          mrs[index] = mr;
        } catch Error(string memory /*reason*/) {
        
        } catch (bytes memory /*lowLevelData*/) {
        
        }
      }
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


    function getExitPosition(address _ch, address _trader, IClearingHouse.PnlCalcOption _pnlCalcOption) external view returns (
        Decimal.decimal memory margin,
        Decimal.decimal memory pnl,
        SignedDecimal.signedDecimal memory unPnl,
        Decimal.decimal memory fee) {

        IClearingHouse ch = IClearingHouse(_ch);
        IClearingHouse.Position memory p = ch.getPosition(_trader);
        margin = p.margin;
        IAmm amm = ch.amm();

        (pnl, unPnl) = ch.getPositionNotionalAndUnrealizedPnl(_trader, _pnlCalcOption);

        // quote = amm.getOutputPrice(p.size.toInt() > 0 ? IAmm.Dir.ADD_TO_AMM : IAmm.Dir.REMOVE_FROM_AMM, p.size.abs());
        (Decimal.decimal memory toll, Decimal.decimal memory spread) = amm.calcFee(pnl);

        fee = toll.addD(spread);
    }

    // 0.1 USDT
    function getVGSPrice() internal view returns (uint256) {
        return 1e5;
    }


    // 预估清算价格(ignore payfunding)
    // mrr: maintenanceMarginRatio
    // if size > 0: LiquidatePrice = (openNotional - margin) / (1 - mrr) / size;
    // if size < 0: LiquidatePrice = (openNotional + margin) / (1 + mrr) / size;
    function getLiquidatePrice(
        Decimal.decimal memory openNotional,
        Decimal.decimal memory _margin,
        SignedDecimal.signedDecimal memory _size,
        Decimal.decimal memory _mrr) public view returns (Decimal.decimal memory liqPrice) {
        
        if (_size.toInt() < 0) {
            liqPrice = (openNotional.addD(_margin)).divD(Decimal.one().addD(_mrr)).divD(_size.abs());
        } else {
            if (openNotional.toUint() <  _margin.toUint()) {
              liqPrice  = Decimal.zero();
            } else {
              Decimal.decimal memory leftMargin = openNotional.subD(_margin);
              Decimal.decimal memory PN = leftMargin.divD(Decimal.one().subD(_mrr));
              liqPrice = PN.divD(_size.abs());
            }
        }
      }
  

    function traderPosition(address[] memory _clearingHouses, address _trader, IClearingHouse.PnlCalcOption _pnlCalcOption) external view returns (
      IClearingHouse.Position[] memory pos,
      Decimal.decimal[] memory pnls,
      SignedDecimal.signedDecimal[] memory unPnls,  // 未实现盈亏
      Decimal.decimal[] memory liqPrices,
      SignedDecimal.signedDecimal[] memory marginRatios) {

        uint len = _clearingHouses.length;
        pos = new IClearingHouse.Position[](len);
        pnls = new Decimal.decimal[](len);
        unPnls = new SignedDecimal.signedDecimal[](len);
        liqPrices = new Decimal.decimal[](len);
        marginRatios = new SignedDecimal.signedDecimal[](len);

        for (uint256 index = 0; index < len; index++) {
            IClearingHouse ch = IClearingHouse(_clearingHouses[index]);
            try ch.getPosition(_trader) returns (IClearingHouse.Position memory p) {
              
              pos[index] = p;

              if (p.size.toInt() != 0) {
                Decimal.decimal memory mrr = ch.getMaintenanceMarginRatio();

                (Decimal.decimal memory pnl, SignedDecimal.signedDecimal memory unPnl) =
                    ch.getPositionNotionalAndUnrealizedPnl(_trader, _pnlCalcOption);

                pnls[index] = pnl;
                unPnls[index] = unPnl;
                liqPrices[index] = getLiquidatePrice(p.openNotional, p.margin, p.size, mrr);

                marginRatios[index] = ch.getMarginRatio(_trader);
              }
            } catch Error(string memory /*reason*/) {
            } catch (bytes memory /*lowLevelData*/) {
            }
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