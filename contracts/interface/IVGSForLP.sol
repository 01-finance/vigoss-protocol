pragma solidity 0.6.9;

interface IVGSForLP {
    function updateLpAmount(address _user, uint256 _amount) external;
}