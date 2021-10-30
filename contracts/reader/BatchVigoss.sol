// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "../interface/IClearingHouse.sol";
import "../interface/IAmm.sol";
import "../interface/IVGSForLP.sol";
import "../interface/IVGSForMargin.sol";

import { Decimal } from "../utils/Decimal.sol";
import { SignedDecimal } from "../utils/SignedDecimal.sol";


contract BatchVigoss  {
    using Decimal for Decimal.decimal;
    using SignedDecimal for SignedDecimal.signedDecimal;

    constructor() public {
       
    }


 

    function batchPayFunding(address[] memory _chs) external{
        uint len = _chs.length;
        for (uint256 index = 0; index < len; index++) {
            IClearingHouse(_chs[index]).payFunding();
   
        }

    }

    //function  liquidate(address _trader) external(address _trader) external

    function batchLiquidate(address chAddress,address[] memory arrs) external{
        uint len = arrs.length;
        IClearingHouse ch = IClearingHouse(chAddress);
        for (uint256 index = 0; index < len; index++) {
            ch.liquidate(arrs[index]);
   
        }

    }
 

    
}