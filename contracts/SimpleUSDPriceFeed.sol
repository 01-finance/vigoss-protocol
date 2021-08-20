// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;

import { IPriceFeed } from "./interface/IPriceFeed.sol";
import { Decimal, SafeMath } from "./utils/Decimal.sol";
import { SimplePriceOracle } from "./SimplePriceOracle.sol";

contract SimpleUSDPriceFeed is SimplePriceOracle {

    constructor(address admin) SimplePriceOracle(admin) public {
    }

    // get latest price
    function getPrice(address token) external view returns (uint256) {
      return getPriceMan(token);
    }

    function getLatestRoundData(address token) internal view returns (uint256 latestRound,uint256 latestPrice, uint256 latestTimestamp ) {
        latestRound = rounds[token].sub(1);
        Underlying memory u = roundPrices[token][latestRound];
        latestPrice = u.lastPriceMan;
        latestTimestamp = u.lastUpdateTs;
    }

    function getRoundData(address token, uint round) public view returns (uint256, uint256, uint256 ) {
        Underlying memory u = roundPrices[token][round];
        return (round, u.lastPriceMan, u.lastUpdateTs);
    }

    // get twap price depending on _period
    function getTwapPrice(address token, uint256 _interval) external view returns (uint256) {
      require(_interval != 0, "interval can't be 0");

      (uint256 round, uint256 latestPrice, uint256 latestTimestamp) = getLatestRoundData(token);
      uint256 baseTimestamp = block.timestamp.sub(_interval);
      
        // if latest updated timestamp is earlier than target timestamp, return the latest price.
        if (latestTimestamp < baseTimestamp || round == 0) {
            return latestPrice;
        }

        // rounds are like snapshots, latestRound means the latest price snapshot.
        uint256 previousTimestamp = latestTimestamp;
        uint256 cumulativeTime = block.timestamp.sub(previousTimestamp);
        uint256 weightedPrice = latestPrice.mul(cumulativeTime);

        while (true) {
            if (round == 0) {
                // if cumulative time is less than requested interval, return current twap price
                return weightedPrice.div(cumulativeTime);
            }

            round = round - 1;
            (, uint256 currentPrice, uint256 currentTimestamp) = getRoundData(token, round);

            // check if current round timestamp is earlier than target timestamp
            if (currentTimestamp <= baseTimestamp) {
                // weighted time period will be (target timestamp - previous timestamp). For example,
                // now is 1000, _interval is 100, then target timestamp is 900. If timestamp of current round is 970,
                // and timestamp of NEXT round is 880, then the weighted time period will be (970 - 900) = 70,
                // instead of (970 - 880)
                weightedPrice = weightedPrice.add(currentPrice.mul(previousTimestamp.sub(baseTimestamp)));
                break;
            }

            uint256 timeFraction = previousTimestamp.sub(currentTimestamp);
            weightedPrice = weightedPrice.add(currentPrice.mul(timeFraction));
            cumulativeTime = cumulativeTime.add(timeFraction);
            previousTimestamp = currentTimestamp;
        }
        return weightedPrice.div(_interval);
    }

}