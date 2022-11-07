import { ethers, upgrades } from 'hardhat';
import { DexPool } from '../../typechain-types';

export async function deployFixtures() {
  const [deployer, alice, bob, charlie, daniel] = await ethers.getSigners();

  const DexTokenA = await ethers.getContractFactory('DexToken');
  const dexTokenA = await DexTokenA.connect(deployer).deploy();

  const DexTokenB = await ethers.getContractFactory('DexToken');
  const dexTokenB = await DexTokenB.connect(deployer).deploy();

  const DexPoolFactory = await ethers.getContractFactory('DexPoolFactory');
  const dexPoolFactory = await DexPoolFactory.connect(deployer).deploy();

  const DexPool = await ethers.getContractFactory('DexPool');
  const dexPoolImpl = await DexPool.deploy();

  const DexPoolProxy = await ethers.getContractFactory('DexPoolProxy');
  const dexPoolProxy = await DexPoolProxy.deploy(dexPoolImpl.address, '0x');

  const dexPool = DexPool.attach(dexPoolProxy.address);

  return {
    deployer,
    alice,
    bob,
    charlie,
    daniel,
    dexPool,
    dexPoolImpl,
    dexTokenA,
    dexTokenB,
    dexPoolFactory,
  };
}
