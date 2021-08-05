// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;

import "./openzeppelin/token/ERC20/IERC20.sol";
import "./openzeppelin/token/ERC20/SafeERC20.sol";
import "./openzeppelin/utils/EnumerableSet.sol";
import "./openzeppelin/math/SafeMath.sol";
import "./openzeppelin/access/Ownable.sol";


contract VGSForLP is Ownable {
    uint constant SCALE = 1e12;

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many amm lp the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }
    // Info of each pool.
    struct PoolInfo {
        address amm; // Address of amm contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. PFIs to distribute per block.
        uint256 lastRewardBlock; // Last block number that PFIs distribution occurs.
        uint256 accVgsPerShare; // Accumulated PFIs per share, times 1e12. See below.
    }

    IERC20 public vgs;

    // Vgs tokens created per block.
    uint256 public vgsPerBlock;

    // pid corresponding address
    mapping(address => uint256) public IdOfAmm;
    
    // Info of each pool.
    PoolInfo[] public poolInfo;

    // Info of each user that stakes LP tokens.
    mapping(uint => mapping(address => UserInfo)) public userInfo;
    // Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );

    constructor(
        IPFIToken _vgs,
        uint256 _vgsPerBlock
    ) public {
        vgs = _vgs;
        vgsPerBlock = _vgsPerBlock;
    }

    function setVgsPerBlock(uint256 _newPerBlock) public onlyOwner {
        massUpdatePools();
        vgsPerBlock = _newPerBlock;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new amm lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same Amm more than once. Rewards will be messed up if you do.
    function add(
        uint256 _allocPoint,
        IERC20 _amm,
        bool _withUpdate
    ) public onlyOwner {
        require(address(_amm) != address(vgs), "Not for Stake PFI");

        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number;

        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                amm: _amm,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
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

        for (uint256 pid = 0; pid < length; ++pid) {
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
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accVgsPerShare = pool.accVgsPerShare;
        uint256 lpSupply = pool.amm.balanceOf(address(this));

        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = block.number.sub(pool.lastRewardBlock);
            uint256 vgsReward =
                multiplier.mul(vgsPerBlock).mul(pool.allocPoint).div(
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
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.amm.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = block.number.sub(pool.lastRewardBlock);
        uint256 vgsReward =
            multiplier.mul(vgsPerBlock).mul(pool.allocPoint).div(
                totalAllocPoint
            );

        vgs.mint(address(this), vgsReward);

        pool.accVgsPerShare = pool.accVgsPerShare.add(
            vgsReward.mul(SCALE).div(lpSupply)
        );
        pool.lastRewardBlock = block.number;
    }

    function settlementAll() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            doDeposit(pid, 0, msg.sender);
        }
    }

    // Deposit LP tokens to MasterChef for Vgs allocation.
    function deposit(address _amm, uint256 _amount, address _user) public {
        uint _pid = IdOfAmm[_amm];
        doDeposit(_pid, _amount, _user);
    }

    function doDeposit(uint _pid, uint256 _amount, address _user) internal {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        updatePool(_pid);

        if (user.amount > 0) {
            uint256 pending =
                user.amount.mul(pool.accVgsPerShare).div(SCALE).sub(
                    user.rewardDebt
                );
            safeVgsTransfer(_user, pending);
        }

        if (_amount > 0) {
            pool.amm.safeTransferFrom(
                address(msg.sender),
                address(this),
                _amount
            );
            user.amount = user.amount.add(_amount);
        }

        user.rewardDebt = user.amount.mul(pool.accVgsPerShare).div(SCALE);
        emit Deposit(_user, _pid, _amount);
    }

    function withdrawAll() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            UserInfo memory user = userInfo[pid][msg.sender];
            doWithdraw(pid, user.amount);
        }
    }

    // Withdraw LP tokens from PFIPool.
    function withdraw(address _amm, uint256 _amount) public {
        uint _pid = IdOfAmm[_amm];
        doWithdraw(_pid, _amount);
    }

    function doWithdraw(uint _pid, uint256 _amount) internal {  
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending =
            user.amount.mul(pool.accVgsPerShare).div(SCALE).sub(
                user.rewardDebt
            );
        safeVgsTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accVgsPerShare).div(SCALE);
        pool.amm.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(address _amm) public {
        uint _pid = IdOfAmm[_amm];
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.amm.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Safe vgs transfer function, just in case if rounding error causes pool to not have enough PFIs.
    function safeVgsTransfer(address _to, uint256 _amount) internal {
        uint256 vgsBal = vgs.balanceOf(address(this));
        if (_amount > vgsBal) {
            vgs.transfer(_to, vgsBal);
        } else {
            vgs.transfer(_to, _amount);
        }
    }

}
