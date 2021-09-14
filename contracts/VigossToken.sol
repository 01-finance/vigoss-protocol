// SPDX-License-Identifier: MIT
pragma solidity 0.6.9;

import "./openzeppelin/utils/Address.sol";
import "./base/DelegateERC20.sol";

interface TokenRecipient {
  // must return ture
  function tokensReceived(
      address from,
      uint amount,
      bytes calldata exData
  ) external returns (bool);
}

contract VigossToken is DelegateERC20 {
  using Address for address;

  uint256 private constant preMineSupply = 100000000 * 1e18;

  constructor (address owner) public DelegateERC20("VigossToken", "VGS") {
    _mint(owner, preMineSupply);
  }

  function burn(uint amount) public {
    _burn(msg.sender, amount);
  }

  function send(address recipient, uint amount, bytes calldata exData) external returns (bool) {
    _transfer(msg.sender, recipient, amount);

    if (recipient.isContract()) {
      bool rv = TokenRecipient(recipient).tokensReceived(msg.sender, amount, exData);
      require(rv, "No TokenRecipient");
    }

    return true;
  }


}