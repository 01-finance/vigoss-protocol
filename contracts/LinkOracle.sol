pragma solidity 0.6.9;

import "./chainlink/v0.6/interfaces/AggregatorV3Interface.sol";
import "./SimplePriceOracle.sol";
import { Ownable } from "./openzeppelin/access/Ownable.sol";

contract LinkOracle is IPriceOracle, Ownable {
    mapping(address => AggregatorV3Interface) public aggregators;
    event SetAggregator(address indexed token, AggregatorV3Interface indexed aggregator);

    function setAggregator(address token, AggregatorV3Interface aggregator) external onlyOwner {
        aggregators[token] = aggregator;
        emit SetAggregator(token, aggregator);
    }

    function getPriceMan(address token) external view override returns (uint256) {
        (, int256 price, , , ) = aggregators[token].latestRoundData();
        require(price >= 0, "Negative Price!");
        return uint256(price) * 1e10; // chalink's price has 8 decimals, we need 18.
    }
}
