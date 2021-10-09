// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;

import "./openzeppelin/token/ERC20/IERC20.sol";
import "./openzeppelin/math/SafeMath.sol";
import "./openzeppelin/access/Ownable.sol";
import "./interface/IAmm.sol";

contract VGSForLP is Ownable {
    uint constant SCALE = 1e12;

    using SafeMath for uint256;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many amm lp the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }
    // Info of each pool.
    struct PoolInfo {
        address amm; // Address of amm contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. Vgs to distribute per block.
        uint256 lastRewardSecond; // Last timestamp that Vgs distribution occurs.
        uint256 accVgsPerShare; // Accumulated Vgs per share, times 1e12. See below.
    }

    IERC20 public vgs;

    // Vgs tokens created per block.
    uint256 public vgsPerSecond;

    // pid corresponding address
    mapping(address => uint256) public IdOfAmm;
    
    // Info of each pool.
    PoolInfo[] public poolInfo;

    // Info of each user that stakes LP tokens.
    mapping(uint => mapping(address => UserInfo)) public userInfos;
    // Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;

    event UpdateLpDeposit(address indexed user, address indexed amm, uint256 amount);
    event Settlement(address indexed user, uint amount);

    constructor(
        IERC20 _vgs,
        uint256 _vgsPerSecond
    ) public {
        vgs = _vgs;
        vgsPerSecond = _vgsPerSecond;
        add(0, address(0), false); // Just left the first.
    }

    function setVgsPerSecond(uint256 _newPerSecond) public onlyOwner {
        massUpdatePools();
        vgsPerSecond = _newPerSecond;
    }

    function upgradeTo(address _to) public onlyOwner {
        uint256 vgsBal = vgs.balanceOf(address(this));
        vgs.transfer(_to, vgsBal);
    }

    function getPoolVgs(address _amm, uint _during) external view returns (uint256) {
        uint _pid = IdOfAmm[_amm];
        return vgsPerSecond.mul(_during).mul(poolInfo[_pid].allocPoint).div(totalAllocPoint);
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new amm lp to the pool. Can only be called by the owner.
    function add(
        uint256 _allocPoint,
        address _amm,
        bool _withUpdate
    ) public onlyOwner {
        require(IdOfAmm[address(_amm)] == 0, "aleady added");

        if (_withUpdate) {
            massUpdatePools();
        }

        uint256 lastRewardSecond = block.timestamp;
        if (_allocPoint > 0) {
            totalAllocPoint = totalAllocPoint.add(_allocPoint);
        }
        
        poolInfo.push(
            PoolInfo({
                amm: _amm,
                allocPoint: _allocPoint,
                lastRewardSecond: lastRewardSecond,
                accVgsPerShare: 0
            })
        );
        IdOfAmm[address(_amm)] = poolInfo.length - 1;
    }

    // Update the given pool's Vgs allocation point. Can only be called by the owner.
    function set(
        address _amm,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint _pid = IdOfAmm[_amm];
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(
            _allocPoint
        );
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    function allPendingVgs(address _user) external view returns (uint256 vgss) {
        uint256 length = poolInfo.length;

        for (uint256 pid = 1; pid < length; ++pid) {
            vgss += getPendingVgs(pid, _user);
        }
    }

    // View function to see pending vgs on frontend.
    function pendingVgs(address _amm, address _user)
        public
        view
        returns (uint256) {
        uint _pid = IdOfAmm[_amm];
        return getPendingVgs(_pid, _user);
    }

    function getPendingVgs(uint _pid, address _user) public view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfos[_pid][_user];
        uint256 accVgsPerShare = pool.accVgsPerShare;

        uint256 lpSupply = IAmm(pool.amm).totalLiquidity();

        if (block.timestamp > pool.lastRewardSecond && lpSupply != 0) {
            uint256 multiplier = block.timestamp.sub(pool.lastRewardSecond);
            uint256 vgsReward =
                multiplier.mul(vgsPerSecond).mul(pool.allocPoint).div(
                    totalAllocPoint
                );
            accVgsPerShare = accVgsPerShare.add(
                vgsReward.mul(SCALE).div(lpSupply)
            );
        }
        return user.amount.mul(accVgsPerShare).div(SCALE).sub(user.rewardDebt);
    }

    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 1; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardSecond) {
            return;
        }
        uint256 lpSupply = IAmm(pool.amm).totalLiquidity();
        if (lpSupply == 0) {
            pool.lastRewardSecond = block.timestamp;
            return;
        }

        uint256 multiplier = block.timestamp.sub(pool.lastRewardSecond);
        uint256 vgsReward =
            multiplier.mul(vgsPerSecond).mul(pool.allocPoint).div(
                totalAllocPoint
            );

        pool.accVgsPerShare = pool.accVgsPerShare.add(
            vgsReward.mul(SCALE).div(lpSupply)
        );
        pool.lastRewardSecond = block.timestamp;
    }

    function settlement(address _amm) external {
        uint pid = IdOfAmm[_amm];
        address user = msg.sender;
        UserInfo memory userInfo = userInfos[pid][user];
        uint pending = doUpdateLP(pid, user, userInfo.amount);
        if (pending > 0) {
            safeVgsTransfer(user, pending);
            emit Settlement(user, pending);
        }
    }
    

    function settlementAll() external {
        address user = msg.sender;
        uint256 length = poolInfo.length;
        uint pending;
        for (uint256 pid = 1; pid < length; ++pid) {
            UserInfo memory userInfo = userInfos[pid][user];
            pending += doUpdateLP(pid, user, userInfo.amount);
        }
        
        if (pending > 0) {
            safeVgsTransfer(user, pending);
            emit Settlement(user, pending);
        }
    }

    // call from Amm
    function updateLpAmount(address _user, uint256 _amount) external {
        address amm = msg.sender;
        uint pid = IdOfAmm[amm];
        require(pid > 0, "invalid Amm");
        uint pending = doUpdateLP(pid,  _user, _amount);
        if (pending > 0) {
            safeVgsTransfer(_user, pending);
            emit Settlement(_user, pending);
        }
        
    }

    function doUpdateLP(uint _pid, address _user, uint256 _amount) internal returns (uint pending) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfos[_pid][_user];
        updatePool(_pid);

        if (user.amount > 0) {
            pending = user.amount.mul(pool.accVgsPerShare).div(SCALE).sub(
                    user.rewardDebt
                );
        }

        if (user.amount != _amount ) {
            user.amount = _amount;
            emit UpdateLpDeposit(_user, pool.amm, _amount);
        }

        user.rewardDebt = user.amount.mul(pool.accVgsPerShare).div(SCALE);
       
    }


    // Safe vgs transfer function, just in case if rounding error causes pool to not have enough Vgs.
    function safeVgsTransfer(address _to, uint256 _amount) internal {
        uint256 vgsBal = vgs.balanceOf(address(this));
        if (_amount > vgsBal) {
            vgs.transfer(_to, vgsBal);
        } else {
            vgs.transfer(_to, _amount);
        }
    }

}
