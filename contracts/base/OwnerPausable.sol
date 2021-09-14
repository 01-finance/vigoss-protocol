// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;

import "../openzeppelin/utils/Pausable.sol";
import "../openzeppelin/access/Ownable.sol";

contract OwnerPausable is Ownable, Pausable {

    function pause() public onlyOwner {
      _pause();
    }

    function unpause() public onlyOwner {
      _unpause();
    }
}
