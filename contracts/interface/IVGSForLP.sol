pragma solidity 0.6.9;

interface IVGSForLP {
    function updateLpAmount(address _user, uint256 _amount) external;
    function vgsPerSecond() external view returns (uint256);
    function getPoolVgs(address _amm, uint during) external view returns (uint256);

}