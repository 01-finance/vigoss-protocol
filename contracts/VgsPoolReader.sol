// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;

import "./interface/IAmm.sol";
import "./interface/IVGSForLP.sol";
import "./interface/IVGSForMargin.sol";

contract VgsPoolReader  {

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

    function poolsTvlArp(address[] memory amms) external view returns (uint[] memory tvls, uint[] memory arps) {
        uint len = amms.length;
        tvls = new uint[](len);
        arps = new uint[](len);
        
        uint tvl;
        uint arp;

        for (uint256 index = 0; index < len; index++) {
            tvl = IAmm(amms[index]).totalLiquidityUSD();
            tvls[index] = tvl;

            uint vgsAmmount = vgsForLP.getPoolVgs(amms[index], 1 days);
            arp = vgsAmmount * getVGSPrice() / tvl;
            arps[index] = arp;
        }
    }

    // 0.1 USDT
    function getVGSPrice() internal view returns (uint256) {
        return 1e17;
    }
  
  

}