// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import './interfaces/IDexPoolFactory.sol';
import './proxy/DexPoolProxy.sol';
import './interfaces/IDexPool.sol';

error InvalidCaller(string reason);
error InvalidAddress(address _address);

contract DexPoolFactory is ERC165, IDexPoolFactory {
    /// @inheritdoc IDexPoolFactory
    address public override owner;
    /// @inheritdoc IDexPoolFactory
    address public override pendingOwner;
    /// @inheritdoc IDexPoolFactory
    mapping(address => mapping(address => mapping(uint256 => address)))
        public
        override getPool;

    constructor() {
        owner = msg.sender;
    }

    function createPool(
        address initialImplementation,
        address tokenA,
        address tokenB,
        uint256 fee
    ) external override returns (address pool) {
        bytes memory data = abi.encodeWithSelector(
            IDexPool.initialize.selector,
            owner,
            tokenA,
            tokenB,
            fee
        );

        pool = address(new DexPoolProxy(initialImplementation, data));
        getPool[tokenA][tokenB][fee] = pool;
        // populate mapping in the reverse direction, deliberate choice to avoid the cost of comparing addresses
        getPool[tokenB][tokenA][fee] = pool;
        emit PoolCreated(tokenA, tokenB, fee, pool);
    }

    function transferOwnership(address newOwner, bool direct)
        external
        override
    {
        if (direct) {
            if (newOwner == address(0)) revert InvalidAddress(newOwner);
            emit OwnershipTransfered(owner, newOwner);
            owner = newOwner;
            pendingOwner = address(0);
        } else {
            pendingOwner = newOwner;
        }
    }

    function claimOwnership() external override {
        if (msg.sender != pendingOwner)
            revert InvalidCaller('Ownable: caller != pendingOwner');
        emit OwnershipTransfered(owner, pendingOwner);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IDexPoolFactory).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
