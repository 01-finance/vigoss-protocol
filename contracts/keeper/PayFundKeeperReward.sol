// SPDX-License-Identifier: BSD-3-CLAUSE
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import { IERC20 } from "../openzeppelin/token/ERC20/IERC20.sol";
import { KeeperRewardBase } from "./KeeperRewardBase.sol";
import { IAmm } from "../interface/IAmm.sol";
import { IClearingHouse } from "../interface/IClearingHouse.sol";

contract PayFundKeeperReward is KeeperRewardBase {
    constructor(IERC20 _perpToken) KeeperRewardBase(_perpToken) public {
    }

    /**
     * @notice call this function to pay funding payment and get token reward
     */
    function payFunding(IClearingHouse house) external {
        bytes4 selector = IClearingHouse.payFunding.selector;
        // TaskInfo memory task = getTaskInfo(selector);

        house.payFunding();
        postTaskAction(selector);
    }
}
