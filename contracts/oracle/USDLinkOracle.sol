pragma solidity 0.6.9;

import "../chainlink/v0.6/interfaces/AggregatorV3Interface.sol";
import { Ownable } from "../openzeppelin/access/Ownable.sol";
import { IPriceFeed } from "../interface/IPriceFeed.sol";
import { SafeMath } from "../openzeppelin/math/SafeMath.sol";


contract USDLinkOracle is Ownable, IPriceFeed {
    using SafeMath for uint256;

    mapping(address => AggregatorV3Interface) public aggregators;
    event SetAggregator(address indexed token, AggregatorV3Interface indexed aggregator);

    function setAggregator(address token, AggregatorV3Interface aggregator) external onlyOwner {
        uint8 dec = aggregator.decimals();
        require(dec == 8, "not support decimals");
        aggregators[token] = aggregator;
        emit SetAggregator(token, aggregator);
    }

    function getLatestRoundData(address token) internal view returns (uint256 latestRound,uint256 latestPrice, uint256 latestTimestamp ) {
        (uint80 roundId, int256 price, , uint updatedAt, ) = aggregators[token].latestRoundData();
        require(price >= 0, "Negative Price!");
        return (uint256(roundId), uint256(price) / 1e2, updatedAt);
    }

    function getRoundData(address token, uint round) public view returns (uint256, uint256, uint256 ) {
        (, int256 price, , uint updatedAt, ) = aggregators[token].getRoundData(uint80(round));
        require(price >= 0, "Negative Price!");
        return (round, uint256(price) / 1e2, updatedAt);
    }

    // get latest price
    function getPrice(address token) external view override returns (uint256) {
        (, int256 price, , , ) = aggregators[token].latestRoundData();
        require(price >= 0, "Negative Price!");
        return uint256(price) /  1e2; // chalink's price has 8 decimals, we need 6.
    }

    function getTwapPrice(address token, uint256 _interval) external view override returns (uint256) {
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
