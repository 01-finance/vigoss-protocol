
// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;

import "./openzeppelin/token/ERC20/IERC20.sol";
import "./openzeppelin/token/ERC20/SafeERC20.sol";
import "./openzeppelin/utils/EnumerableSet.sol";
import "./openzeppelin/math/SafeMath.sol";
import "./openzeppelin/access/Ownable.sol";

import "hardhat/console.sol";

contract VGSDistributer is Ownable {
    uint constant SCALE = 1e12;

    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many Stable tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }

    uint256 public lastRewardSecond; // Last block number that VGSs distribution occurs.
    uint256 public accVgsPerShare; // Accumulated VGSs per share, times 1e12. See below.

    IERC20 public immutable vgs;

    // Vgs tokens created per block.
    uint256 public vgsPerSecond;
    uint256 public startTimeStamp;

    uint256 public marginSupply;

    // Info of each user that stakes LP tokens.
    mapping(address => UserInfo) public userInfo;

    mapping (address => bool) public approvedCh;

    event AddMargin(address indexed user, address token, uint256 amount);
    event RemoveMargin(address indexed user, address token, uint256 amount);
    event SetClearingHouse(address indexed ch, bool enabled);

    constructor(
        IERC20 _vgs,
        uint256 _vgsPerSecond,
        uint _startTimeStamp
    ) public {
        vgs = _vgs;
        vgsPerSecond = _vgsPerSecond;
        startTimeStamp = _startTimeStamp;
    }

    function setClearingHouse(address _ch, bool enabled) public onlyOwner {
      approvedCh[_ch] = enabled;
      emit SetClearingHouse(_ch, enabled);
    }

    // be careful. nedd div times.
    function setVgsPerSecond(uint256 _vgsPerSecond) public onlyOwner {
        updatePool();
        vgsPerSecond = _vgsPerSecond;
    }

    // View function to see pending PFis on frontend.
    function pendingVgs(address _user)
        public
        view
        returns (uint256) {

        uint256 accPerShare = accVgsPerShare; 

        UserInfo storage user = userInfo[_user];
        if (block.timestamp > lastRewardSecond && marginSupply != 0) {
            uint256 multiplier = getMultiplier(lastRewardSecond, block.timestamp);
            uint256 vgsReward =  multiplier.mul(vgsPerSecond);

            accPerShare = accVgsPerShare.add(
                vgsReward.mul(SCALE).div(marginSupply)
            );

        }
        return user.amount.mul(accPerShare).div(SCALE).sub(user.rewardDebt);
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        if (block.timestamp <= lastRewardSecond) {
            return;
        }
        if (marginSupply == 0) {
            lastRewardSecond = block.timestamp;
            return;
        }
        uint256 multiplier = getMultiplier(lastRewardSecond, block.timestamp);
        uint256 vgsReward = multiplier.mul(vgsPerSecond);

        accVgsPerShare = accVgsPerShare.add(
            vgsReward.mul(SCALE).div(marginSupply)
        );
        lastRewardSecond = block.timestamp;
    }

    // TEST OK, make sure at least 1 transaction in 90 days 
    function getMultiplier(uint256 _from, uint256 _to)
        internal
        view
        returns (uint256)
    {
      console.log("_from:" , _from);
      console.log("_to:" , _to);
      uint quarter = 90 days;
      for (uint256 i = 0; i < 16; i++) {  
        uint startTs = startTimeStamp.add(quarter * i);
        uint endTs = startTimeStamp.add(quarter * (i+1));
        console.log("startTs:" , startTs);
        console.log("endTs:" , endTs);

        if (_from >= startTs && _to < endTs) {
          return _to.sub(_from).mul(20 - i);  //  in season
        } else if(_from < startTs && _to < endTs) {  //  cross season
          uint half1 = _to.sub(startTs).mul(20 - i);
          uint half2 = startTs.sub(_from).mul(20 - i + 1);
          return half1.add(half2);
        }
      }
    }


    // Deposit LP tokens to MasterChef for Vgs allocation.
    function addMargin(address token, uint256 _amount, address _user) public {
        require(approvedCh[msg.sender], "must call from approved CH");
        UserInfo storage user = userInfo[_user];
        updatePool();

        if (user.amount > 0) {
            uint256 pending =
                user.amount.mul(accVgsPerShare).div(SCALE).sub(
                    user.rewardDebt
                );
            safeVgsTransfer(_user, pending);
        }

        if (_amount > 0) {
          uint amount = convertAmount(token, _amount);
          marginSupply = marginSupply.add(amount);
          user.amount = user.amount.add(amount);
        }

        user.rewardDebt = user.amount.mul(accVgsPerShare).div(SCALE);
        emit AddMargin(_user, token, _amount);
    }

    function convertAmount(address token, uint amount) internal view returns (uint) {
      uint8 d = IERC20(token).decimals();
      require(d <= 18, "invalid decimal");

      if (d == 18) {
        return amount;
      } else {
        return amount.mul(10** (uint(18) - d));
      }
    }

    function removeMargin(address token, uint256 _amount, address _user) public {
        require(approvedCh[msg.sender], "must call from approved CH");
        uint amount = convertAmount(token, _amount);
        UserInfo storage user = userInfo[_user];
        require(user.amount >= amount, "removeMargin: not good");

        updatePool();
        uint256 pending =
            user.amount.mul(accVgsPerShare).div(SCALE).sub(
                user.rewardDebt
            );
        safeVgsTransfer(_user, pending);
        user.amount = user.amount.sub(amount);
        marginSupply = marginSupply.sub(amount);

        user.rewardDebt = user.amount.mul(accVgsPerShare).div(SCALE);

        emit RemoveMargin(_user, token, _amount);
    }


    // Safe vgs transfer function, just in case if rounding error causes pool to not have enough VGSs.
    function safeVgsTransfer(address _to, uint256 _amount) internal {
        uint256 vgsBal = vgs.balanceOf(address(this));
        if (_amount > vgsBal) {
            vgs.transfer(_to, vgsBal);
        } else {
            vgs.transfer(_to, _amount);
        }
    }

}
