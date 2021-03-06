// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import { IERC20 } from "./openzeppelin/token/ERC20/IERC20.sol";
import { Decimal } from "./utils/Decimal.sol";
import { SignedDecimal } from "./utils/SignedDecimal.sol";
import { MixedDecimal } from "./utils/MixedDecimal.sol";
import { DecimalERC20 } from "./utils/DecimalERC20.sol";
// prettier-ignore
// solhint-disable-next-line
import { ReentrancyGuard } from "./openzeppelin/utils/ReentrancyGuard.sol";
import { OwnerPausable } from "./OwnerPausable.sol";
import { IAmm } from "./interface/IAmm.sol";
import { IClearingHouse } from "./interface/IClearingHouse.sol";
import { IVGSForMargin } from "./interface/IVGSForMargin.sol";

contract ClearingHouse is
    DecimalERC20,
    OwnerPausable,
    ReentrancyGuard,
    IClearingHouse
{
    using Decimal for Decimal.decimal;
    using SignedDecimal for SignedDecimal.signedDecimal;
    using MixedDecimal for SignedDecimal.signedDecimal;

    //
    // EVENTS
    //
    event MarginRatioChanged(uint256 marginRatio);
    event LiquidationFeeRatioChanged(uint256 liquidationFeeRatio);
    event MarginChanged(address indexed sender, int256 amount, int256 fundingPayment);
    event PositionAdjusted(
        address indexed trader,
        int256 newPositionSize,
        uint256 oldLiquidityIndex,
        uint256 newLiquidityIndex
    );

    event PositionSettled(address indexed trader, uint256 valueTransferred);
    event RestrictionModeEntered(uint256 blockNumber);

    /// @notice This event is emitted when position change
    /// @param trader the address which execute this transaction
    /// @param margin margin
    /// @param positionNotional margin * leverage
    /// @param exchangedPositionSize position size, e.g. ETHUSDC or LINKUSDC
    /// @param fee transaction fee
    /// @param positionSizeAfter position size after this transaction, might be increased or decreased
    /// @param realizedPnl realized pnl after this position changed
    /// @param unrealizedPnlAfter unrealized pnl after this position changed
    /// @param badDebt position change amount cleared by amm lp funds
    /// @param liquidationPenalty amount of remaining margin lost due to liquidation
    event PositionChanged(
        address indexed trader,
        uint256 margin,
        uint256 positionNotional,
        int256 exchangedPositionSize,
        uint256 fee,
        int256 positionSizeAfter,
        int256 realizedPnl,
        int256 unrealizedPnlAfter,
        uint badDebt,
        uint256 liquidationPenalty,
        int256 fundingPayment
    );

    /// @notice This event is emitted when position liquidated
    /// @param trader the account address being liquidated
    /// @param positionNotional liquidated position value minus liquidationFee
    /// @param positionSize liquidated position size
    /// @param liquidationFee liquidation fee to the liquidator
    /// @param liquidator the address which execute this transaction
    /// @param badDebt liquidation fee amount cleared by amm lp funds
    event PositionLiquidated(
        address indexed trader,
        uint256 positionNotional,
        uint256 positionSize,
        uint256 liquidationFee,
        address liquidator,
        uint256 badDebt
    );

    //
    // Struct and Enum
    //





    /// @notice This struct is used for avoiding stack too deep error when passing too many var between functions
    struct PositionResp {
        Position position;
        // the quote asset amount trader will send if open position, will receive if close
        Decimal.decimal exchangedQuoteAssetAmount;
        // if realizedPnl + realizedFundingPayment + margin is negative, it's the abs value of it
        Decimal.decimal badDebt;
        // the base asset amount trader will receive if open position, will send if close
        SignedDecimal.signedDecimal exchangedPositionSize;
        // funding payment incurred during this position response
        SignedDecimal.signedDecimal fundingPayment;
        // realizedPnl = unrealizedPnl * closedRatio
        SignedDecimal.signedDecimal realizedPnl;
        // positive = trader transfer margin to vault, negative = trader receive margin from vault
        // it's 0 when internalReducePosition, its addedMargin when internalIncreasePosition
        // it's min(0, oldPosition + realizedFundingPayment + realizedPnl) when internalClosePosition
        SignedDecimal.signedDecimal marginToVault;
        // unrealized pnl after open position
        SignedDecimal.signedDecimal unrealizedPnlAfter;
    }

    struct AmmMap {
        // issue #1471
        // last block when it turn restriction mode on.
        // In restriction mode, no one can do multi open/close/liquidate position in the same block.
        // If any underwater position being closed (having a bad debt and make amm lp loss),
        // or any liquidation happened,
        // restriction mode is ON in that block and OFF(default) in the next block.
        // This design is to prevent the attacker being benefited from the multiple action in one block
        // in extreme cases
        uint256 lastRestrictionBlock;
        SignedDecimal.signedDecimal[] cumulativePremiumFractions;
        mapping(address => Position) positionMap;
    }

    IAmm public immutable override amm;
    IVGSForMargin public vgsForMargin;

    // only admin
    Decimal.decimal public initMarginRatio;

    // only admin
    Decimal.decimal public maintenanceMarginRatio;

    // only admin
    Decimal.decimal public liquidationFeeRatio;

    // key by amm address. will be deprecated or replaced after guarded period.
    // it's not an accurate open interest, just a rough way to control the unexpected loss at the beginning
    Decimal.decimal public aopenInterestNotional;

    AmmMap internal ammMap;

    // prepaid bad debt balance
    Decimal.decimal internal prepaidBadDebt;

    // contract dependencies
    address public feePool;

    // designed for arbitragers who can hold unlimited positions. will be removed after guarded period
    address internal whitelist;

    // FUNCTIONS
    constructor(
        IAmm _amm,
        IVGSForMargin _vgsForMargin,
        uint256 _initMarginRatio,
        uint256 _maintenanceMarginRatio,
        uint256 _liquidationFeeRatio
    ) public {
        require(address(_amm) != address(0), "Invalid _amm");
        amm = _amm;
        vgsForMargin = _vgsForMargin;
        initMarginRatio = Decimal.decimal(_initMarginRatio);
        maintenanceMarginRatio = Decimal.decimal(_maintenanceMarginRatio);
        liquidationFeeRatio = Decimal.decimal(_liquidationFeeRatio);
    }

    //
    // External
    //

    function setVgsForMargin(IVGSForMargin _vgsForMargin) external onlyOwner {
        vgsForMargin = _vgsForMargin;
    }

    /**
     * @notice set liquidation fee ratio
     * @dev only owner can call
     * @param _liquidationFeeRatio new liquidation fee ratio in 18 digits
     */
    function setLiquidationFeeRatio(Decimal.decimal memory _liquidationFeeRatio) external onlyOwner {
        liquidationFeeRatio = _liquidationFeeRatio;
        emit LiquidationFeeRatioChanged(liquidationFeeRatio.toUint());
    }

    /**
     * @notice set maintenance margin ratio
     * @dev only owner can call
     * @param _maintenanceMarginRatio new maintenance margin ratio in 18 digits
     */
    function setMaintenanceMarginRatio(Decimal.decimal memory _maintenanceMarginRatio) external onlyOwner {
        maintenanceMarginRatio = _maintenanceMarginRatio;
        emit MarginRatioChanged(maintenanceMarginRatio.toUint());
    }

    /**
     * @notice set the toll pool address
     * @dev only owner can call
     */
    function setTollPool(address _feePool) external onlyOwner {
        feePool = _feePool;
    }

    /**
     * @notice add an address in the whitelist. People in the whitelist can hold unlimited positions.
     * @dev only owner can call
     * @param _whitelist an address
     */
    function setWhitelist(address _whitelist) external onlyOwner {
        whitelist = _whitelist;
    }


    /**
     * @notice add margin to increase margin ratio
     * @param _addedMargin added margin in 18 digits
     */
    function addMargin(Decimal.decimal calldata _addedMargin) external override whenNotPaused() nonReentrant() {
        // check condition
        requireAmm(true);
        requireNonZeroInput(_addedMargin);
        // update margin part in personal position
        address trader = msg.sender;
        Position memory position = getPosition(trader);
        position.margin = position.margin.addD(_addedMargin);
        setPosition(trader, position);

        // transfer token from trader
        _transferFrom(amm.quoteAsset(), trader, address(this), _addedMargin);

        emit MarginChanged(trader, int256(_addedMargin.toUint()), 0);
    }

    /**
     * @notice remove margin to decrease margin ratio
     * @param _removedMargin removed margin in 18 digits
     */
    function removeMargin(Decimal.decimal calldata _removedMargin) external override whenNotPaused() nonReentrant() {
        // check condition
        requireAmm(true);
        requireNonZeroInput(_removedMargin);
        // update margin part in personal position
        address trader = msg.sender;
        Position memory position = getPosition(trader);
        // realize funding payment if there's no bad debt
        SignedDecimal.signedDecimal memory marginDelta = MixedDecimal.fromDecimal(_removedMargin).mulScalar(-1);
        (
            Decimal.decimal memory remainMargin,
            Decimal.decimal memory badDebt,
            SignedDecimal.signedDecimal memory fundingPayment,
            SignedDecimal.signedDecimal memory latestCumulativePremiumFraction
        ) = calcRemainMarginWithFundingPayment(position, marginDelta);
        require(badDebt.toUint() == 0, "margin is not enough");
        position.margin = remainMargin;
        position.lastUpdatedCumulativePremiumFraction = latestCumulativePremiumFraction;
        setPosition(trader, position);
        // check margin ratio
        requireMoreMarginRatio(getMarginRatio(trader), initMarginRatio, true);
        // transfer token back to trader
        withdraw(trader, _removedMargin);
        emit MarginChanged(trader, marginDelta.toInt(), fundingPayment.toInt());
    }


    // if increase position
    //   marginToVault = addMargin
    //   marginDiff = realizedFundingPayment + realizedPnl(0)
    //   pos.margin += marginToVault + marginDiff
    //   vault.margin += marginToVault + marginDiff
    //   required(enoughMarginRatio)
    // else if reduce position()
    //   marginToVault = 0
    //   marginDiff = realizedFundingPayment + realizedPnl
    //   pos.margin += marginToVault + marginDiff
    //   if pos.margin < 0, badDebt = abs(pos.margin), set pos.margin = 0
    //   vault.margin += marginToVault + marginDiff
    //   required(enoughMarginRatio)
    // else if close
    //   marginDiff = realizedFundingPayment + realizedPnl
    //   pos.margin += marginDiff
    //   if pos.margin < 0, badDebt = abs(pos.margin)
    //   marginToVault = -pos.margin
    //   set pos.margin = 0
    //   vault.margin += marginToVault + marginDiff
    // else if close and open a larger position in reverse side
    //   close()
    //   positionNotional -= exchangedQuoteAssetAmount
    //   newMargin = positionNotional / leverage
    //   internalIncreasePosition(newMargin, leverage)
    // else if liquidate
    //   close()
    //   pay liquidation fee to liquidator
    //   move the remain margin to amm lp


    /**
     * @notice open a position
     * @param _side enum Side; BUY for long and SELL for short
     * @param _quoteAssetAmount quote asset amount in 18 digits. Can Not be 0
     * @param _leverage leverage  in 18 digits. Can Not be 0
     * @param _baseAssetAmountLimit minimum base asset amount expected to get to prevent from slippage.
     */
    function openPosition(
        IAmm.Side _side,
        Decimal.decimal memory _quoteAssetAmount,
        Decimal.decimal memory _leverage,
        Decimal.decimal memory _baseAssetAmountLimit
    ) public override whenNotPaused() nonReentrant() {
        requireAmm(true);
        requireAmmNoInFusing();
        requireNonZeroInput(_quoteAssetAmount);
        requireNonZeroInput(_leverage);
        requireMoreMarginRatio(MixedDecimal.fromDecimal(Decimal.one()).divD(_leverage), initMarginRatio, true);
        requireNotRestrictionMode();

        address trader = msg.sender;
        PositionResp memory positionResp;
        {
            // add scope for stack too deep error
            int256 oldPositionSize = getPosition(trader).size.toInt();
            bool isNewPosition = oldPositionSize == 0 ? true : false;

            // increase or decrease position depends on old position's side and size
            if (isNewPosition || (oldPositionSize > 0 ?IAmm.Side.BUY :IAmm.Side.SELL) == _side) {
                positionResp = internalIncreasePosition(
                    _side,
                    _quoteAssetAmount.mulD(_leverage),
                    _baseAssetAmountLimit,
                    _leverage
                );
            } else {
                positionResp = openReversePosition(
                    _side,
                    trader,
                    _quoteAssetAmount,
                    _leverage,
                    _baseAssetAmountLimit,
                    false
                );
            }
            // update the position state
            setPosition(trader, positionResp.position);
            // if opening the exact position size as the existing one == closePosition, can skip the margin ratio check
            if (!isNewPosition && positionResp.position.size.toInt() != 0) {
                requireMoreMarginRatio(getMarginRatio(trader), maintenanceMarginRatio, true);
            }

            // to prevent attacker to leverage the bad debt to withdraw extra token from  amm lp vault
            if (positionResp.badDebt.toUint() > 0) {
                enterRestrictionMode();
            }

            // transfer the actual token between trader and vault
            IERC20 quoteToken = amm.quoteAsset();

            if (positionResp.marginToVault.toInt() > 0) {
                _transferFrom(quoteToken, trader, address(this), positionResp.marginToVault.abs());
            } else if (positionResp.marginToVault.toInt() < 0) {
                withdraw(trader, positionResp.marginToVault.abs());
            }
            
        }

        // calculate fee and transfer token for fees
        //@audit - can optimize by changing amm.swapInput/swap Output's return type to (exchangedAmount, quoteToll, quoteSpread, quoteReserve, baseReserve) (@wraecca)
        Decimal.decimal memory transferredFee = transferFee(trader, positionResp.exchangedQuoteAssetAmount);

        // emit event
        int256 fundingPayment = positionResp.fundingPayment.toInt(); // pre-fetch for stack too deep error
        emit PositionChanged(
            trader,
            positionResp.position.margin.toUint(),
            positionResp.exchangedQuoteAssetAmount.toUint(),
            positionResp.exchangedPositionSize.toInt(),
            transferredFee.toUint(),
            positionResp.position.size.toInt(),
            positionResp.realizedPnl.toInt(),
            positionResp.unrealizedPnlAfter.toInt(),
            positionResp.badDebt.toUint(),
            0,
            fundingPayment
        );
    }


    /**
     * @notice close all the positions
     */
    function closePosition(Decimal.decimal memory _quoteAssetAmountLimit)
        public
        override
        whenNotPaused()
        nonReentrant()
    {
        // check conditions
        requireAmm(true);
        requireAmmNoInFusing();
        requireNotRestrictionMode();

        // update position
        address trader = msg.sender;

        PositionResp memory positionResp;
        {
            // if it is long position, close a position means short it(which means base dir is ADD_TO_AMM) and vice versa
            positionResp = internalClosePosition(trader, _quoteAssetAmountLimit);

            // add scope for stack too deep error
            // transfer the actual token from trader and vault
            if (positionResp.badDebt.toUint() > 0) {
                enterRestrictionMode();
                realizeBadDebt(positionResp.badDebt);
            }
            withdraw(trader, positionResp.marginToVault.abs());
        }

        // calculate fee and transfer token for fees
        Decimal.decimal memory transferredFee = transferFee(trader, positionResp.exchangedQuoteAssetAmount);

        // prepare event
        int256 fundingPayment = positionResp.fundingPayment.toInt();
        emit PositionChanged(
            trader,
            positionResp.position.margin.toUint(),
            positionResp.exchangedQuoteAssetAmount.toUint(),
            positionResp.exchangedPositionSize.toInt(),
            transferredFee.toUint(),
            positionResp.position.size.toInt(),
            positionResp.realizedPnl.toInt(),
            positionResp.unrealizedPnlAfter.toInt(),
            positionResp.badDebt.toUint(),
            0,
            fundingPayment
        );
    }

    /**
     * @notice liquidate trader's underwater position. Require trader's margin ratio less than maintenance margin ratio
     * @dev liquidator can NOT open any positions in the same block to prevent from price manipulation.
     * @param _trader trader address
     */
    function liquidate(address _trader) external override nonReentrant() {
        requireAmm(true);
        requireAmmNoInFusing();
        SignedDecimal.signedDecimal memory marginRatio = getMarginRatio(_trader);

        // including oracle-based margin ratio as reference price when amm is over spread limit
        if (amm.isOverSpreadLimit()) {
            SignedDecimal.signedDecimal memory marginRatioBasedOnOracle = _getMarginRatioBasedOnOracle(_trader);
            if (marginRatioBasedOnOracle.subD(marginRatio).toInt() > 0) {
                marginRatio = marginRatioBasedOnOracle;
            }
        }
        requireMoreMarginRatio(marginRatio, maintenanceMarginRatio, false);

        PositionResp memory positionResp;
        Decimal.decimal memory liquidationPenalty;
        {
            Decimal.decimal memory liquidationBadDebt;
            Decimal.decimal memory feeToAmmLpFund;

            Position memory pos = getPosition(_trader);
            liquidationPenalty = pos.margin;
            positionResp = internalClosePosition(_trader, Decimal.zero());
            Decimal.decimal memory remainMargin = positionResp.marginToVault.abs();
            Decimal.decimal memory feeToLiquidator = positionResp.exchangedQuoteAssetAmount.mulD(liquidationFeeRatio).divScalar(2);

            // if the remainMargin is not enough for liquidationFee, count it as bad debt
            // else, then the rest will be transferred to Amm LP Fund
            Decimal.decimal memory totalBadDebt = positionResp.badDebt;
            if (feeToLiquidator.toUint() > remainMargin.toUint()) {
                liquidationBadDebt = feeToLiquidator.subD(remainMargin);
                totalBadDebt = totalBadDebt.addD(liquidationBadDebt);
            } else {
                remainMargin = remainMargin.subD(feeToLiquidator);
            }

            // transfer the actual token between trader and vault
            if (totalBadDebt.toUint() > 0) {
                realizeBadDebt(totalBadDebt);
            }
            if (remainMargin.toUint() > 0) {
                feeToAmmLpFund = remainMargin;
            }

            if (feeToAmmLpFund.toUint() > 0) {
                transferToAmmLpFund(feeToAmmLpFund);
            }
            withdraw(msg.sender, feeToLiquidator);
            enterRestrictionMode();

            emit PositionLiquidated(
                _trader,
                positionResp.exchangedQuoteAssetAmount.toUint(),
                positionResp.exchangedPositionSize.toUint(),
                feeToLiquidator.toUint(),
                msg.sender,
                liquidationBadDebt.toUint()
            );
        }

        // emit event
        int256 fundingPayment = positionResp.fundingPayment.toInt();
        emit PositionChanged(
            _trader,
            positionResp.position.margin.toUint(),
            positionResp.exchangedQuoteAssetAmount.toUint(),
            positionResp.exchangedPositionSize.toInt(),
            0,
            positionResp.position.size.toInt(),
            positionResp.realizedPnl.toInt(),
            positionResp.unrealizedPnlAfter.toInt(),
            positionResp.badDebt.toUint(),
            liquidationPenalty.toUint(),
            fundingPayment
        );
    }

    /**
     * @notice if funding rate is positive, traders with long position pay traders with short position and vice versa.
     */
    function payFunding() external override {
        requireAmm(true);
        requireAmmNoInFusing();

        SignedDecimal.signedDecimal memory premiumFraction = amm.settleFunding();
        ammMap.cumulativePremiumFractions.push(
            premiumFraction.addD(getLatestCumulativePremiumFraction())
        );

        // funding payment = premium fraction * position
        // eg. if alice takes 10 long position, totalPositionSize = 10
        // if premiumFraction is positive: long pay short, amm get positive funding payment
        // if premiumFraction is negative: short pay long, amm get negative funding payment
        // if totalPositionSize.side * premiumFraction > 0, funding payment is positive which means profit
        SignedDecimal.signedDecimal memory totalTraderPositionSize = amm.getBaseAssetDelta();
        SignedDecimal.signedDecimal memory ammFundingPaymentProfit = premiumFraction.mulD(totalTraderPositionSize);

        if (ammFundingPaymentProfit.toInt() < 0) {
            amm.withdraw(ammFundingPaymentProfit.abs());
        } else {
            transferToAmmLpFund(ammFundingPaymentProfit.abs());
        }
    }

    //
    // VIEW FUNCTIONS
    //
    function getMaintenanceMarginRatio() external view override returns (Decimal.decimal memory) {
      return maintenanceMarginRatio;
    }

    /**
     * @notice get margin ratio, marginRatio = (margin + funding payment + unrealized Pnl) / positionNotional
     * use spot and twap price to calculate unrealized Pnl, final unrealized Pnl depends on which one is higher
     * @param _trader trader address
     * @return margin ratio in 18 digits
     */
    function getMarginRatio(address _trader) public view override returns (SignedDecimal.signedDecimal memory) {
        Position memory position = getPosition(_trader);
        requirePositionSize(position.size);

        (Decimal.decimal memory spotPositionNotional, SignedDecimal.signedDecimal memory spotPricePnl) =
            (getPositionNotionalAndUnrealizedPnl(_trader, PnlCalcOption.SPOT_PRICE));
        (Decimal.decimal memory twapPositionNotional, SignedDecimal.signedDecimal memory twapPricePnl) =
            (getPositionNotionalAndUnrealizedPnl(_trader, PnlCalcOption.TWAP));

        (SignedDecimal.signedDecimal memory unrealizedPnl, Decimal.decimal memory positionNotional) =
            spotPricePnl.toInt() > twapPricePnl.toInt()
                ? (spotPricePnl, spotPositionNotional)
                : (twapPricePnl, twapPositionNotional);
        return _getMarginRatio(position, unrealizedPnl, positionNotional);
    }

    function _getMarginRatioBasedOnOracle(address _trader)
        internal
        view
        returns (SignedDecimal.signedDecimal memory)
    {
        Position memory position = getPosition(_trader);
        requirePositionSize(position.size);
        (Decimal.decimal memory oraclePositionNotional, SignedDecimal.signedDecimal memory oraclePricePnl) =
            (getPositionNotionalAndUnrealizedPnl(_trader, PnlCalcOption.ORACLE));
        return _getMarginRatio(position, oraclePricePnl, oraclePositionNotional);
    }

    function _getMarginRatio(
        Position memory _position,
        SignedDecimal.signedDecimal memory _unrealizedPnl,
        Decimal.decimal memory _positionNotional
    ) internal view returns (SignedDecimal.signedDecimal memory) {
        (Decimal.decimal memory remainMargin, Decimal.decimal memory badDebt, ,) =
            calcRemainMarginWithFundingPayment(_position, _unrealizedPnl);
        return MixedDecimal.fromDecimal(remainMargin).subD(badDebt).divD(_positionNotional);
    }

    /**
     * @notice get personal position information, and adjust size if migration is necessary
     * @param _trader trader address
     * @return struct Position
     */
    function getPosition(address _trader) public view override returns (Position memory) {
        return getUnadjustedPosition(_trader);
    }

    /**
     * @notice get position notional and unrealized Pnl without fee expense and funding payment
     * @param _trader trader address
     * @param _pnlCalcOption enum PnlCalcOption, SPOT_PRICE for spot price and TWAP for twap price
     * @return positionNotional position notional?????????????????????????????????
     * @return unrealizedPnl unrealized Pnl??????????????????????????????????????? ??? ?????????????????????
     */
    function getPositionNotionalAndUnrealizedPnl(
        address _trader,
        PnlCalcOption _pnlCalcOption
    ) public view override returns (Decimal.decimal memory positionNotional, SignedDecimal.signedDecimal memory unrealizedPnl) {
        Position memory position = getPosition(_trader);
        Decimal.decimal memory positionSizeAbs = position.size.abs();
        if (positionSizeAbs.toUint() != 0) {
            bool isShortPosition = position.size.toInt() < 0;
            IAmm.Dir dir = isShortPosition ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM;
            if (_pnlCalcOption == PnlCalcOption.TWAP) {
                positionNotional = amm.getOutputTwap(dir, positionSizeAbs);
            } else if (_pnlCalcOption == PnlCalcOption.SPOT_PRICE) {
                positionNotional = amm.getOutputPrice(dir, positionSizeAbs);
            } else {
                Decimal.decimal memory oraclePrice = amm.getUnderlyingPrice();
                positionNotional = positionSizeAbs.mulD(oraclePrice);
            }
            // unrealizedPnlForLongPosition = positionNotional - openNotional
            // unrealizedPnlForShortPosition = positionNotionalWhenBorrowed - positionNotionalWhenReturned =
            // openNotional - positionNotional = unrealizedPnlForLongPosition * -1
            unrealizedPnl = isShortPosition
                ? MixedDecimal.fromDecimal(position.openNotional).subD(positionNotional)
                : MixedDecimal.fromDecimal(positionNotional).subD(position.openNotional);
        }
    }

    /**
     * @notice get latest cumulative premium fraction.
     * @return latest cumulative premium fraction in 18 digits
     */
    function getLatestCumulativePremiumFraction() public view returns (SignedDecimal.signedDecimal memory) {
        uint256 len = ammMap.cumulativePremiumFractions.length;
        if (len > 0) {
            return ammMap.cumulativePremiumFractions[len - 1];
        }
    }

    //
    // INTERNAL FUNCTIONS
    //

    function enterRestrictionMode() internal {
        uint256 blockNumber = block.number;
        ammMap.lastRestrictionBlock = blockNumber;
        emit RestrictionModeEntered(blockNumber);
    }

    function setPosition(
        address _trader,
        Position memory _position
    ) internal {
        Position storage positionStorage = ammMap.positionMap[_trader];
        positionStorage.size = _position.size;
        positionStorage.margin = _position.margin;
        positionStorage.openNotional = _position.openNotional;
        positionStorage.lastUpdatedCumulativePremiumFraction = _position.lastUpdatedCumulativePremiumFraction;
        positionStorage.blockNumber = _position.blockNumber;

        if (address(vgsForMargin) != address(0)) {
            vgsForMargin.changeMargin(address(amm.quoteAsset()) , _position.margin.toUint(), _trader);
        }
        
    }

    function syncMargin(address trader) external {
        Position memory position = getPosition(trader);
        if (address(vgsForMargin) != address(0)) {
            vgsForMargin.changeMargin(address(amm.quoteAsset()) , position.margin.toUint(), trader);
        }
    }

    function clearPosition(address _trader) internal {
        // keep the record in order to retain the last updated block number
        ammMap.positionMap[_trader] = Position({
            size: SignedDecimal.zero(),
            margin: Decimal.zero(),
            openNotional: Decimal.zero(),
            lastUpdatedCumulativePremiumFraction: SignedDecimal.zero(),
            blockNumber: block.number
        });
        if (address(vgsForMargin) != address(0)) {
            vgsForMargin.changeMargin(address(amm.quoteAsset()) , 0, _trader);
        }
    }

    // only called from openPosition and closeAndOpenReversePosition. caller need to ensure there's enough marginRatio
    function internalIncreasePosition(
        IAmm.Side _side,
        Decimal.decimal memory _openNotional,
        Decimal.decimal memory _minPositionSize,
        Decimal.decimal memory _leverage
    ) internal returns (PositionResp memory positionResp) {
        address trader = msg.sender;
        Position memory oldPosition = getUnadjustedPosition(trader);
        
        positionResp.exchangedPositionSize = swapInput(_side, _openNotional, _minPositionSize, false);

        if (_side == IAmm.Side.BUY) {
            amm.updateLongSize(true, positionResp.exchangedPositionSize);
        }

        SignedDecimal.signedDecimal memory newSize = oldPosition.size.addD(positionResp.exchangedPositionSize);



        updateOpenInterestNotional(MixedDecimal.fromDecimal(_openNotional));
        // if the trader is not in the whitelist, check max position size
        if (trader != whitelist) {
            Decimal.decimal memory maxHoldingBaseAsset = amm.getMaxHoldingBaseAsset();
            if (maxHoldingBaseAsset.toUint() > 0) {
                // total position size should be less than `positionUpperBound`
                require(newSize.abs().cmp(maxHoldingBaseAsset) <= 0, "hit position size upper bound");
            }
        }

        SignedDecimal.signedDecimal memory increaseMarginRequirement =
            MixedDecimal.fromDecimal(_openNotional.divD(_leverage));

        (
            Decimal.decimal memory remainMargin, // the 2nd return (bad debt) must be 0 - already checked from caller
            ,
            SignedDecimal.signedDecimal memory fundingPayment,
            SignedDecimal.signedDecimal memory latestCumulativePremiumFraction
        ) = calcRemainMarginWithFundingPayment(oldPosition, increaseMarginRequirement);

        (, SignedDecimal.signedDecimal memory unrealizedPnl) =
            getPositionNotionalAndUnrealizedPnl(trader, PnlCalcOption.SPOT_PRICE);

        // update positionResp
        positionResp.exchangedQuoteAssetAmount = _openNotional;
        positionResp.unrealizedPnlAfter = unrealizedPnl;
        positionResp.marginToVault = increaseMarginRequirement;
        positionResp.fundingPayment = fundingPayment;
        
        positionResp.position = Position(
            newSize,
            remainMargin,
            oldPosition.openNotional.addD(positionResp.exchangedQuoteAssetAmount),
            latestCumulativePremiumFraction,
            block.number
        );
        
    }

    function openReversePosition(
        IAmm.Side _side,
        address _trader,
        Decimal.decimal memory _quoteAssetAmount,
        Decimal.decimal memory _leverage,
        Decimal.decimal memory _baseAssetAmountLimit,
        bool _canOverFluctuationLimit
    ) internal returns (PositionResp memory) {
        Decimal.decimal memory openNotional = _quoteAssetAmount.mulD(_leverage);
        (Decimal.decimal memory oldPositionNotional, SignedDecimal.signedDecimal memory unrealizedPnl) =
            getPositionNotionalAndUnrealizedPnl(_trader, PnlCalcOption.SPOT_PRICE);
        PositionResp memory positionResp;

        // reduce position if old position is larger
        if (oldPositionNotional.toUint() > openNotional.toUint()) {
            updateOpenInterestNotional(MixedDecimal.fromDecimal(openNotional).mulScalar(-1));
            Position memory oldPosition = getUnadjustedPosition(_trader);
            if (oldPosition.size.toInt() > 0) {  // remove old buy size.
                amm.updateLongSize(false, oldPosition.size);
            }
            
            positionResp.exchangedPositionSize = swapInput(
                _side,
                openNotional,
                _baseAssetAmountLimit,
                _canOverFluctuationLimit
            );

            if (_side ==IAmm.Side.BUY) {
                amm.updateLongSize(true, positionResp.exchangedPositionSize);
            }

            // realizedPnl = unrealizedPnl * closedRatio
            // closedRatio = positionResp.exchangedPositionSiz / oldPosition.size
            if (oldPosition.size.toInt() != 0) {
                positionResp.realizedPnl = unrealizedPnl.mulD(positionResp.exchangedPositionSize.abs()).divD(
                    oldPosition.size.abs()
                );
            }
            Decimal.decimal memory remainMargin;
            SignedDecimal.signedDecimal memory latestCumulativePremiumFraction;
            (
                remainMargin,
                positionResp.badDebt,
                positionResp.fundingPayment,
                latestCumulativePremiumFraction
            ) = calcRemainMarginWithFundingPayment(oldPosition, positionResp.realizedPnl);

            // positionResp.unrealizedPnlAfter = unrealizedPnl - realizedPnl
            positionResp.unrealizedPnlAfter = unrealizedPnl.subD(positionResp.realizedPnl);
            positionResp.exchangedQuoteAssetAmount = openNotional;

            // calculate openNotional (it's different depends on long or short side)
            // long: unrealizedPnl = positionNotional - openNotional => openNotional = positionNotional - unrealizedPnl
            // short: unrealizedPnl = openNotional - positionNotional => openNotional = positionNotional + unrealizedPnl
            // positionNotional = oldPositionNotional - exchangedQuoteAssetAmount
            SignedDecimal.signedDecimal memory remainOpenNotional =
                oldPosition.size.toInt() > 0
                    ? MixedDecimal.fromDecimal(oldPositionNotional).subD(positionResp.exchangedQuoteAssetAmount).subD(
                        positionResp.unrealizedPnlAfter
                    )
                    : positionResp.unrealizedPnlAfter.addD(oldPositionNotional).subD(
                        positionResp.exchangedQuoteAssetAmount
                    );
            require(remainOpenNotional.toInt() > 0, "value of openNotional <= 0");

            positionResp.position = Position(
                oldPosition.size.addD(positionResp.exchangedPositionSize),
                remainMargin,
                remainOpenNotional.abs(),
                latestCumulativePremiumFraction,
                block.number
            );
            return positionResp;
        }

        return closeAndOpenReversePosition(_side, _trader, _quoteAssetAmount, _leverage, _baseAssetAmountLimit);
    }

    function closeAndOpenReversePosition(
        IAmm.Side _side,
        address _trader,
        Decimal.decimal memory _quoteAssetAmount,
        Decimal.decimal memory _leverage,
        Decimal.decimal memory _baseAssetAmountLimit
    ) internal returns (PositionResp memory positionResp) {
        // new position size is larger than or equal to the old position size
        // so either close or close then open a larger position
        PositionResp memory closePositionResp = internalClosePosition(_trader, Decimal.zero());

        // the old position is underwater. trader should close a position first
        require(closePositionResp.badDebt.toUint() == 0, "reduce an underwater position");

        // update open notional after closing position
        Decimal.decimal memory openNotional =
            _quoteAssetAmount.mulD(_leverage).subD(closePositionResp.exchangedQuoteAssetAmount);

        // if remain exchangedQuoteAssetAmount is too small (eg. 1wei) then the required margin might be 0
        // then the clearingHouse will stop opening position
        if (openNotional.divD(_leverage).toUint() == 0) {
            positionResp = closePositionResp;
        } else {
            Decimal.decimal memory updatedBaseAssetAmountLimit;
            if (_baseAssetAmountLimit.toUint() > closePositionResp.exchangedPositionSize.toUint()) {
                updatedBaseAssetAmountLimit = _baseAssetAmountLimit.subD(closePositionResp.exchangedPositionSize.abs());
            }

            PositionResp memory increasePositionResp =
                internalIncreasePosition(_side, openNotional, updatedBaseAssetAmountLimit, _leverage);
            positionResp = PositionResp({
                position: increasePositionResp.position,
                exchangedQuoteAssetAmount: closePositionResp.exchangedQuoteAssetAmount.addD(
                    increasePositionResp.exchangedQuoteAssetAmount
                ),
                badDebt: closePositionResp.badDebt.addD(increasePositionResp.badDebt),
                fundingPayment: closePositionResp.fundingPayment.addD(increasePositionResp.fundingPayment),
                exchangedPositionSize: closePositionResp.exchangedPositionSize.addD(
                    increasePositionResp.exchangedPositionSize
                ),
                realizedPnl: closePositionResp.realizedPnl.addD(increasePositionResp.realizedPnl),
                unrealizedPnlAfter: SignedDecimal.zero(),
                marginToVault: closePositionResp.marginToVault.addD(increasePositionResp.marginToVault)
            });
        }
        return positionResp;
    }

    // 
    function internalClosePosition(
        address _trader,
        Decimal.decimal memory _quoteAssetAmountLimit
    ) private returns (PositionResp memory positionResp) {
        // check conditions
        Position memory oldPosition = getUnadjustedPosition(_trader);
        requirePositionSize(oldPosition.size);
        if (oldPosition.size.toInt() > 0) {  // close buy size.
            amm.updateLongSize(false, oldPosition.size);
        }

        (, SignedDecimal.signedDecimal memory unrealizedPnl) =
            getPositionNotionalAndUnrealizedPnl(_trader, PnlCalcOption.SPOT_PRICE);

        (
            Decimal.decimal memory remainMargin,
            Decimal.decimal memory badDebt,
            SignedDecimal.signedDecimal memory fundingPayment,
        ) = calcRemainMarginWithFundingPayment(oldPosition, unrealizedPnl);

        positionResp.exchangedPositionSize = oldPosition.size.mulScalar(-1);
        positionResp.realizedPnl = unrealizedPnl;
        positionResp.badDebt = badDebt;  // >0

        positionResp.fundingPayment = fundingPayment;
        positionResp.marginToVault = MixedDecimal.fromDecimal(remainMargin).mulScalar(-1);

        // for amm.swapOutput, the direction is in base asset, from the perspective of Amm
        positionResp.exchangedQuoteAssetAmount = amm.swapOutput(
            oldPosition.size.toInt() > 0 ? IAmm.Dir.ADD_TO_AMM : IAmm.Dir.REMOVE_FROM_AMM,
            oldPosition.size.abs(),
            _quoteAssetAmountLimit
        );

        // bankrupt position's bad debt will be also consider as a part of the open interest
        updateOpenInterestNotional(unrealizedPnl.addD(badDebt).addD(oldPosition.openNotional).mulScalar(-1));
        clearPosition(_trader);
    }

    function swapInput(
        IAmm.Side _side,
        Decimal.decimal memory _inputAmount,
        Decimal.decimal memory _minOutputAmount,
        bool _canOverFluctuationLimit
    ) internal returns (SignedDecimal.signedDecimal memory) {
        // for amm.swapInput, the direction is in quote asset, from the perspective of Amm
        IAmm.Dir dir = (_side ==IAmm.Side.BUY) ? IAmm.Dir.ADD_TO_AMM : IAmm.Dir.REMOVE_FROM_AMM;

        SignedDecimal.signedDecimal memory outputAmount =
            MixedDecimal.fromDecimal(amm.swapInput(dir, _inputAmount, _minOutputAmount, _canOverFluctuationLimit));
    
        if (IAmm.Dir.REMOVE_FROM_AMM == dir) {
            return outputAmount.mulScalar(-1);
        }
        return outputAmount;
    }

    function transferFee(
        address _from,
        Decimal.decimal memory _positionNotional
    ) internal returns (Decimal.decimal memory) {
        (Decimal.decimal memory toll, Decimal.decimal memory spread) = amm.calcFee(_positionNotional);
        bool hasToll = toll.toUint() > 0;
        bool hasSpread = spread.toUint() > 0;

        if (hasToll || hasSpread) {
            IERC20 quoteAsset = amm.quoteAsset();

            // transfer spread to amm lp fund
            if (hasSpread) {
                _transferFrom(quoteAsset, _from, address(amm), spread);
            }

            // transfer toll to feePool
            if (hasToll) {
                require(address(feePool) != address(0), "Invalid feePool");
                _transferFrom(quoteAsset, _from, address(feePool), toll);
            }

            // fee = spread + toll
            return toll.addD(spread);
        }
    }

    function withdraw(
        address _receiver,
        Decimal.decimal memory _amount
    ) internal {
        // if withdraw amount is larger than entire balance of vault
        // means this trader's profit comes from amm lp
        // and the balance of entire vault is not enough
        // need money from amm lp vault to pay first, and record this prepaidBadDebt
        // in this case, amm lp vault loss must be zero
        IERC20 quoteAsset = amm.quoteAsset();
        Decimal.decimal memory totalTokenBalance = _balanceOf(quoteAsset, address(this));
        if (totalTokenBalance.toUint() < _amount.toUint()) {
            Decimal.decimal memory balanceShortage = _amount.subD(totalTokenBalance);
            prepaidBadDebt = prepaidBadDebt.addD(balanceShortage);
            amm.withdraw(balanceShortage);
        }

        _transfer(quoteAsset, _receiver, _amount);
    }

    function realizeBadDebt(Decimal.decimal memory _badDebt) internal {
        if (prepaidBadDebt.toUint() > _badDebt.toUint()) {
            // no need to move extra tokens because vault already prepay bad debt, only need to update the numbers
            prepaidBadDebt = prepaidBadDebt.subD(_badDebt);
        } else {
            // in order to realize all the bad debt vault need extra tokens from amm lp vault.
            prepaidBadDebt = Decimal.zero();
            amm.withdraw(_badDebt.subD(prepaidBadDebt));
        }
    }

    function transferToAmmLpFund(Decimal.decimal memory _amount) internal {
        IERC20 token = amm.quoteAsset();
        Decimal.decimal memory totalTokenBalance = _balanceOf(token, address(this));
        _transfer(
            token,
            address(amm),
            totalTokenBalance.toUint() < _amount.toUint() ? totalTokenBalance : _amount
        );
    }

    /**
     * @dev assume this will be removes soon once the guarded period has ended. caller need to ensure amm exist
     */
    function updateOpenInterestNotional(SignedDecimal.signedDecimal memory _amount) internal {
        // when cap = 0 means no cap
        uint256 cap = amm.getOpenInterestNotionalCap().toUint();
        if (cap > 0) {
            SignedDecimal.signedDecimal memory updatedOpenInterestNotional =
                _amount.addD(aopenInterestNotional);
            // the reduced open interest can be larger than total when profit is too high and other position are bankrupt
            if (updatedOpenInterestNotional.toInt() < 0) {
                updatedOpenInterestNotional = SignedDecimal.zero();
            }
            if (_amount.toInt() > 0) {
                // whitelist won't be restrict by open interest cap
                require(updatedOpenInterestNotional.toUint() <= cap || msg.sender == whitelist, "over limit");
            }
            aopenInterestNotional = updatedOpenInterestNotional.abs();
        }
    }

    function calcRemainMarginWithFundingPayment(
        Position memory _oldPosition,
        SignedDecimal.signedDecimal memory _marginDelta
    )
        public
        view
        returns (
            Decimal.decimal memory remainMargin,
            Decimal.decimal memory badDebt,
            SignedDecimal.signedDecimal memory fundingPayment,
            SignedDecimal.signedDecimal memory latestCumulativePremiumFraction
        )
    {

        // calculate funding payment
        latestCumulativePremiumFraction = getLatestCumulativePremiumFraction();
        if (_oldPosition.size.toInt() != 0) {
            fundingPayment = latestCumulativePremiumFraction
                .subD(_oldPosition.lastUpdatedCumulativePremiumFraction)
                .mulD(_oldPosition.size);
        }

        // calculate remain margin
        SignedDecimal.signedDecimal memory signedRemainMargin =
            _marginDelta.subD(fundingPayment).addD(_oldPosition.margin);

        // if remain margin is negative, set to zero and leave the rest to bad debt
        if (signedRemainMargin.toInt() < 0 ) {
            badDebt = signedRemainMargin.abs();
        } else {
            remainMargin = signedRemainMargin.abs();
        }
    }

    function getUnadjustedPosition(address _trader) internal view returns (Position memory position) {
        position = ammMap.positionMap[_trader];
    }

    //
    // REQUIRE FUNCTIONS
    //
    function requireAmm(bool _open) private view {
        require(_open == amm.open(), _open ? "amm was closed" : "amm is open");
    }

    function requireAmmNoInFusing() private view {
        require(!amm.isInFusing(), "amm in fusing");
    }

    function requireNonZeroInput(Decimal.decimal memory _decimal) private pure {
        require(_decimal.toUint() != 0, "input is 0");
    }

    function requirePositionSize(SignedDecimal.signedDecimal memory _size) private pure {
        require(_size.toInt() != 0, "positionSize is 0");
    }

    function requireNotRestrictionMode() private view {
        uint256 currentBlock = block.number;
        if (currentBlock == ammMap.lastRestrictionBlock) {
            require(getUnadjustedPosition(msg.sender).blockNumber != currentBlock, "only one action allowed");
        }
    }

    // 
    function requireMoreMarginRatio(
        SignedDecimal.signedDecimal memory _marginRatio,
        Decimal.decimal memory _baseMarginRatio,
        bool _largerThanOrEqualTo
    ) private pure {
        int256 remainingMarginRatio = _marginRatio.subD(_baseMarginRatio).toInt();
        require(
            _largerThanOrEqualTo ? remainingMarginRatio >= 0 : remainingMarginRatio < 0,
            "Margin ratio not meet criteria"
        );
    }

    
}
