// SPDX-License-Identifier: BSD-3-CLAUSE
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import { Decimal } from "../utils/Decimal.sol";
import { SignedDecimal } from "../utils/SignedDecimal.sol";
import { IAmm } from "./IAmm.sol";

interface IClearingHouse {
    enum PnlCalcOption { SPOT_PRICE, TWAP, ORACLE }

    /// @notice This struct records personal position information
    /// @param size denominated in amm.baseAsset
    /// @param margin isolated margin
    /// @param openNotional the quoteAsset value of position when opening position. the cost of the position
    /// @param lastUpdatedCumulativePremiumFraction for calculating funding payment, record at the moment every time when trader open/reduce/close position
    /// @param liquidityHistoryIndex
    /// @param blockNumber the block number of the last position
    struct Position {
        SignedDecimal.signedDecimal size;
        Decimal.decimal margin;
        Decimal.decimal openNotional;
        SignedDecimal.signedDecimal lastUpdatedCumulativePremiumFraction;
        uint256 blockNumber;
    }

    function addMargin(Decimal.decimal calldata _addedMargin) external;

    function removeMargin(Decimal.decimal calldata _removedMargin) external;

    function openPosition(
        IAmm.Side _side,
        Decimal.decimal calldata _quoteAssetAmount,
        Decimal.decimal calldata _leverage,
        Decimal.decimal calldata _baseAssetAmountLimit
    ) external;

    function closePosition(Decimal.decimal calldata _quoteAssetAmountLimit) external;

    function liquidate(address _trader) external;

    function payFunding() external;

    function getMaintenanceMarginRatio() external view returns (Decimal.decimal memory);

    // VIEW FUNCTIONS

    function amm() external view returns (IAmm);
    function getMarginRatio(address _trader) external view returns (SignedDecimal.signedDecimal memory);

    function getPosition(address _trader) external view returns (Position memory);

    function getPositionNotionalAndUnrealizedPnl(
        address _trader,
        PnlCalcOption _pnlCalcOption
    ) external view returns (Decimal.decimal memory positionNotional, SignedDecimal.signedDecimal memory unrealizedPnl);
    
}
