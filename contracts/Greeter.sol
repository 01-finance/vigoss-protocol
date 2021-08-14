// SPDX-License-Identifier: MIT
pragma solidity 0.6.9;

contract Greeter {
    string public greeting;

    constructor() public {
        greeting = "abc";
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }
}
