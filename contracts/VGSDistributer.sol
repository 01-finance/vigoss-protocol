
// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;

import "./openzeppelin/token/ERC20/IERC20.sol";
import "./openzeppelin/token/ERC20/SafeERC20.sol";
import "./openzeppelin/utils/EnumerableSet.sol";
import "./openzeppelin/math/SafeMath.sol";
import "./openzeppelin/access/Ownable.sol";

contract VGSDistributer is Ownable {
    uint constant SCALE = 1e12;

    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }

    uint256 public lastRewardSecond; // Last block number that VGSs distribution occurs.
    uint256 public accVgsPerShare; // Accumulated VGSs per share, times 1e12. See below.

    IERC20 public  vgs;

    // Vgs tokens created per block.
    uint256 public vgsPerSecond;
    uint256 public startTimeStamp;

    uint256 public lpSupply;

    // Info of each user that stakes LP tokens.
    mapping(address => UserInfo) public userInfo;

    event Deposit(address indexed user, address token, uint256 amount);
    event Withdraw(address indexed user, address token, uint256 amount);

    constructor(
        IERC20 _vgs,
        uint256 _vgsPerSecond,
        uint _startTimeStamp
    ) public {
        vgs = _vgs;
        vgsPerSecond = _vgsPerSecond;
        startTimeStamp = _startTimeStamp;
    }

    function setVgsPerSecond(uint256 _vgsPerSecond) public onlyOwner {
        updatePool();
        vgsPerSecond = _vgsPerSecond;
    }

    // View function to see pending PFis on frontend.
    // TODO: lpSupply neet save.
    function pendingVgs(address _user)
        public
        view
        returns (uint256) {

        UserInfo storage user = userInfo[_user];
        if (block.timestamp > lastRewardSecond && lpSupply != 0) {
            uint256 multiplier = block.timestamp.sub(lastRewardSecond);
            uint256 vgsReward =  multiplier.mul(vgsPerSecond);
            accVgsPerShare = accVgsPerShare.add(
                vgsReward.mul(SCALE).div(lpSupply)
            );
        }
        return user.amount.mul(accVgsPerShare).div(SCALE).sub(user.rewardDebt);
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        if (block.timestamp <= lastRewardSecond) {
            return;
        }
        if (lpSupply == 0) {
            lastRewardSecond = block.timestamp;
            return;
        }
        uint256 multiplier = getMultiplier(lastRewardSecond, block.timestamp);
        uint256 vgsReward = multiplier.mul(vgsPerSecond);

        //TODO:
        // vgs.mint(address(this), vgsReward);

        accVgsPerShare = accVgsPerShare.add(
            vgsReward.mul(SCALE).div(lpSupply)
        );
        lastRewardSecond = block.timestamp;
    }

    // TODO: TEST
    function getMultiplier(uint256 _from, uint256 _to)
        public
        view
        returns (uint256)
    {

      uint quarter = 90 days;
      for (uint256 i = 0; i < 16; i++) {  
        uint startTs = startTimeStamp.add(quarter * i);
        uint endTs = startTimeStamp.add(quarter * (i+1));
  
        if (_from >= startTs && _to < endTs) {
          return _to.sub(_from).mul(20 - i);  //  整段
        } else if(_from < startTs && _to < endTs) {  //  跨段
          uint mid = startTimeStamp.add(quarter * i);
          uint half1 = _to.sub(startTs).mul(20 - i - 1);
          uint half2 = mid.sub(startTs).mul(20 - i);

          return half1.add(half2);
        }
      }
    }


    // Deposit LP tokens to MasterChef for Vgs allocation.
    function deposit(address token, uint256 _amount, address _user) public {
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

          // token.safeTransferFrom(
          //     address(msg.sender),
          //     address(this),
          //     _amount
          // );

          user.amount = user.amount.add(_amount);
        }

        user.rewardDebt = user.amount.mul(accVgsPerShare).div(SCALE);
        emit Deposit(_user, token, _amount);
    }

    function convertAmount(address token, uint amount) internal view returns (uint) {

    }

    // Withdraw LP tokens from VGSPool.
    function withdraw(address token, uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool();
        uint256 pending =
            user.amount.mul(accVgsPerShare).div(SCALE).sub(
                user.rewardDebt
            );
        safeVgsTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(accVgsPerShare).div(SCALE);
        
        // lpToken.safeTransfer(address(msg.sender), _amount);

        emit Withdraw(msg.sender, token, _amount);
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
