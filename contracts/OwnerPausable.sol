// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;

import "./openzeppelin/utils/Pausable.sol";
import { PerpFiOwnableUpgrade } from "./utils/PerpFiOwnableUpgrade.sol";

contract OwnerPausableUpgradeSafe is PerpFiOwnableUpgrade, Pausable {
    // solhint-disable func-name-mixedcase
    function __OwnerPausable_init() internal initializer {
        __Ownable_init();
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
