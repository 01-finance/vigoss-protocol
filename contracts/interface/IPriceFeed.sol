// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;

interface IPriceFeed {
    // get latest price
    function getPrice(address token) external view returns (uint256);

    // get twap price depending on _period
    function getTwapPrice(address token, uint256 _interval) external view returns (uint256);

}
