pragma solidity 0.6.9;

interface IVGSForLP {
    function updateLpAmount(address _user, uint256 _amount) external;
    function vgsPerSecond() external view returns (uint256);
    function getPoolVgs(address _amm, uint _during) external view returns (uint256);
    function pendingVgs(address _amm, address _user)
        external
        view
        returns (uint256);

}