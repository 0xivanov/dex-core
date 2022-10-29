// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import './IDexPoolFactory.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface IDexPool {
    event OwnershipTransferred(address indexed oldOwner, address newOwner);
    event LiquidityAdded(
        address indexed lp,
        uint256 amount0,
        uint256 amount1,
        uint256 share
    );
    event LiquidityRemoved(
        address indexed lp,
        uint256 amount0,
        uint256 amount1,
        uint256 share
    );

    /// @notice The contract that deployed the pool, which must adhere to the IUniswapV3Factory interface
    /// @return The contract address
    function factory() external view returns (IDexPoolFactory);

    /// @notice The first of the two tokens of the pool, sorted by address
    /// @return The token contract address
    function token0() external view returns (IERC20);

    /// @notice The second of the two tokens of the pool, sorted by address
    /// @return The token contract address
    function token1() external view returns (IERC20);

    /// @notice The first of the two tokens of the pool, sorted by address
    /// @return The token contract address
    function balance0() external view returns (uint256);

    /// @notice The second of the two tokens of the pool, sorted by address
    /// @return The token contract address
    function balance1() external view returns (uint256);

    /// @notice The pool"s fee in hundredths of a bip, i.e. 1e-6
    /// @return The fee
    function fee() external view returns (uint256);

    /// @notice The pool"s upgrade admin
    /// @return The owner
    function owner() external view returns (address);

    /// @notice The pool"s upgrade admin
    /// @return The owner
    function pendingOwner() external view returns (address);

    /// @notice The pool"s upgrade admin
    /// @return The owner
    function totalShares() external view returns (uint256);

    function initialize(
        address owner,
        address _token0,
        address _token1,
        uint256 _fee
    ) external;

    function addLiquidity(uint256 amount0, uint256 amount1)
        external
        returns (uint256 share);

    function removeLiquidity(uint256 share)
        external
        returns (uint256 amount0, uint256 amount1);

    function swap(address _tokenIn, uint256 amountIn)
        external
        returns (uint256 amountOut);

    function transferOwnership(address newOwner, bool direct) external;

    function claimOwnership() external;
}
