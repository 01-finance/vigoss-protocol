// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "../openzeppelin/access/Ownable.sol";
import '../openzeppelin/token/ERC20/ERC20.sol';

contract MockToken is ERC20, Ownable {
    /**
     * @notice Constructs the HERC-20 contract.
     */
    constructor(string memory symbol, uint8 decimals, uint256 initSupply) public ERC20('Mock Token', symbol) {
        _setupDecimals(decimals);
        if(initSupply > 0) {
            _mint(msg.sender, initSupply);
        }
    }
    
    function mint(address _to, uint256 _amount) public onlyOwner returns (bool) {
        _mint(_to, _amount);
        return true;
    }
}