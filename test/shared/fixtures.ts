import { ethers } from 'hardhat';

export async function deployFixtures() {
    const [deployer, alice, bob, charlie, daniel] = await ethers.getSigners();

    const DexPool = await ethers.getContractFactory('DexPool');
    const dexPool = await DexPool.connect(deployer).deploy();

    const DexTokenA = await ethers.getContractFactory('DexToken');
    const dexTokenA = await DexTokenA.connect(deployer).deploy();

    const DexTokenB = await ethers.getContractFactory('DexToken');
    const dexTokenB = await DexTokenB.connect(deployer).deploy();

    const DexPoolFactory = await ethers.getContractFactory('DexPoolFactory');
    const dexPoolFactory = await DexPoolFactory.connect(deployer).deploy();

    return { deployer, alice, bob, charlie, daniel, dexPool, dexTokenA, dexTokenB, dexPoolFactory };
}

