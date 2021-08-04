pragma solidity 0.6.9;

interface IVGSForMargin {
  function changeMargin(address token, uint256 _targetMargin, address _user) external;
}