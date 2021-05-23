## PriceFeed



## InsuranceFund.sol

## Amm.sol (ETHUSDC)
https://blockscout.com/poa/xdai/address/0x8d22F1a9dCe724D8c1B4c688D75f17A2fE2D32df/read-proxy

DeployConfig：

quoteAssetReserve  : 11694800 000000000000000000
baseAssetReserveETH:    20000 000000000000000000
_tradeLimitRatio  :           900000000000000000   (0.9)
_fundingPeriod: 3600
fluctuationLimitRatio:  toWei("0.012")
_tollRatio: 0
_spreadRatio:  toWei("0.001")


## Addr online

https://metadata.perp.exchange/production.json



## PMM
real swap to virtual swap(Change reserve don't transfer?)

real swap code(DODO v2):
DVMTrader::sellBase
DVMTrader::sellQuote

virtual swap code:
Amm