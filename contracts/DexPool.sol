// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import './interfaces/IDexPool.sol';
import './interfaces/IDexPoolFactory.sol';

error InvalidTokens();
error InvalidFee();
error InvalidFactory();
error InvalidCaller(string reason);
error InvalidAddress();
error InvalidAmount(address token, uint256 amount);
error InvalidToken();
error InvalidLiquidityAllocation(uint256 amount0, uint256 amount1);
error InvalidShare();

contract DexPool is IDexPool, UUPSUpgradeable, Initializable {
    using SafeERC20 for IERC20;

    /// @inheritdoc IDexPool
    IDexPoolFactory public override factory;
    /// @inheritdoc IDexPool
    IERC20 public override token0;
    /// @inheritdoc IDexPool
    IERC20 public override token1;
    /// @inheritdoc IDexPool
    uint256 public override balance0;
    /// @inheritdoc IDexPool
    uint256 public override balance1;
    /// @inheritdoc IDexPool
    uint256 public override fee;
    /// @inheritdoc IDexPool
    address public override owner;
    /// @inheritdoc IDexPool
    address public override pendingOwner;
    /// @inheritdoc IDexPool
    uint256 public override totalShares;

    mapping(address => uint256) public balanceOf;

    function initialize(
        address _owner,
        address tokenA,
        address tokenB,
        uint256 _fee
    ) external initializer {
        (address _token0, address _token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);

        ///input checks
        if (_owner == address(0)) revert InvalidAddress();
        if (
            !IERC165(msg.sender).supportsInterface(
                type(IDexPoolFactory).interfaceId
            )
        ) revert InvalidFactory();
        if (
            _token0 == _token1 ||
            _token0 == address(0) ||
            !IERC165(tokenA).supportsInterface(type(IERC20).interfaceId) ||
            !IERC165(tokenB).supportsInterface(type(IERC20).interfaceId)
        ) revert InvalidTokens();
        if (_fee == 0 || _fee > 10000) revert InvalidFee();

        factory = IDexPoolFactory(msg.sender);
        owner = _owner;
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        fee = _fee;
    }

    function mintShares(address _to, uint256 _amount) private {
        balanceOf[_to] += _amount;
        totalShares += _amount;
    }

    function burnShares(address _from, uint256 _amount) private {
        balanceOf[_from] -= _amount;
        totalShares -= _amount;
    }

    function updateBalances(uint256 _balance0, uint256 _balance1) private {
        balance0 = _balance0;
        balance1 = _balance1;
    }

    function addLiquidity(uint256 amount0, uint256 amount1)
        external
        returns (uint256 share)
    {
        // user has to approve amount
        token0.safeTransferFrom(msg.sender, address(this), amount0);
        token1.safeTransferFrom(msg.sender, address(this), amount1);

        if (totalShares > 0) {
            if (balance0 * amount1 != balance1 * amount0)
                revert InvalidLiquidityAllocation(amount0, amount1);
            share = (amount0 * totalShares) / balance0;
        } else {
            share = sqrt(amount0 * amount1);
        }
        assert(share > 0);
        mintShares(msg.sender, share);
        updateBalances(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );

        emit LiquidityAdded(msg.sender, amount0, amount1, share);
    }

    function removeLiquidity(uint256 share)
        external
        returns (uint256 amount0, uint256 amount1)
    {
        if (share == 0 || balanceOf[msg.sender] < share) revert InvalidShare();

        amount0 = (share * balance0) / totalShares;
        amount1 = (share * balance1) / totalShares;

        assert(amount0 > 0 && amount1 > 0);

        burnShares(msg.sender, share);
        // contract approves itself
        token0.safeIncreaseAllowance(address(this), amount0);
        token1.safeIncreaseAllowance(address(this), amount1);

        token0.safeTransferFrom(address(this), msg.sender, amount0);
        token1.safeTransferFrom(address(this), msg.sender, amount1);

        updateBalances(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );

        emit LiquidityRemoved(msg.sender, amount0, amount1, share);
    }

    function swap(address _tokenIn, uint256 amountIn)
        public
        returns (uint256 amountOut)
    {
        if (_tokenIn != address(token0) && _tokenIn != address(token1))
            revert InvalidToken();
        if (amountIn == 0) revert InvalidAmount(_tokenIn, amountIn);

        bool isToken0 = _tokenIn == address(token0);
        (
            IERC20 tokenIn,
            IERC20 tokenOut,
            uint256 reserveIn,
            uint256 reserveOut
        ) = isToken0
                ? (
                    token0,
                    token1,
                    token0.balanceOf(address(this)),
                    token1.balanceOf(address(this))
                )
                : (
                    token1,
                    token0,
                    token1.balanceOf(address(this)),
                    token0.balanceOf(address(this))
                );

        //user has to approve amount
        tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 amountInWithFee = (amountIn * (1000000 - fee)) / 1000000;
        amountOut =
            (reserveOut * amountInWithFee) /
            (reserveIn + amountInWithFee);
        tokenOut.safeIncreaseAllowance(address(this), amountOut);
        tokenOut.safeTransferFrom(address(this), msg.sender, amountOut);

        updateBalances(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );

        return amountOut;
    }

    function transferOwnership(address newOwner, bool direct)
        external
        override
    {
        if (direct) {
            if (newOwner == address(0)) revert InvalidAddress();
            emit OwnershipTransferred(owner, newOwner);
            owner = newOwner;
            pendingOwner = address(0);
        } else {
            pendingOwner = newOwner;
        }
    }

    function claimOwnership() external override {
        if (msg.sender != pendingOwner)
            revert InvalidCaller('Ownable: caller != pendingOwner');
        emit OwnershipTransferred(owner, pendingOwner);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        virtual
        override
    {
        if (msg.sender != owner)
            revert InvalidCaller('Ownable: caller != owner');
    }

    function sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
