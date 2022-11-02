import { ethers } from 'hardhat';

async function main() {
  const deployer = new ethers.providers.Web3Provider(web3Provider).getSigner();
  const DexPool = await ethers.getContractFactory('DexPool');
  const dexPool = await DexPool.connect(deployer).deploy();
  await dexPool.deployed();

  const DexTokenA = await ethers.getContractFactory('DexToken');
  const dexTokenA = await DexTokenA.connect(deployer).deploy();
  await dexTokenA.deployed();

  const DexTokenB = await ethers.getContractFactory('DexToken');
  const dexTokenB = await DexTokenB.connect(deployer).deploy();
  await dexTokenB.deployed();

  const DexPoolFactory = await ethers.getContractFactory('DexPoolFactory');
  const dexPoolFactory = await DexPoolFactory.connect(deployer).deploy();
  await dexPoolFactory.deployed();

  console.log(`dexPool deployed to ${dexPool.address}`);
  console.log(`dexTokenA deployed to ${dexTokenA.address}`);
  console.log(`dexTokenB deployed to ${dexTokenB.address}`);
  console.log(`dexPoolFactory deployed to ${dexPoolFactory.address}`);

  await dexPoolFactory.createPool(
    dexPool.address,
    dexTokenA.address,
    dexTokenB.address,
    3000
  );

  const proxyAddress = await dexPoolFactory.getPool(
    dexTokenA.address,
    dexTokenB.address,
    3000
  );

  const dexPoolProxy = await ethers.getContractAt('DexPool', proxyAddress);
  console.log(await dexPoolProxy.owner());

  console.log(`dexPoolFactory creates pool proxy to ${proxyAddress}`);
}

main().catch((error) => {
  console.error(error);
});
