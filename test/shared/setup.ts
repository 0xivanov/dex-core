import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers, network } from 'hardhat';
import { BigNumber } from 'ethers';
import { deployFixtures } from '../shared/fixtures';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DexToken } from '../../typechain-types';

export async function loadVariables(fee: BigNumber) {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  const {
    deployer,
    alice,
    bob,
    charlie,
    daniel,
    dexPool,
    dexTokenA,
    dexTokenB,
    dexPoolFactory,
  } = await loadFixture(deployFixtures);

  const initParams: [string, string, string, BigNumber] = [
    deployer.address,
    dexTokenA.address,
    dexTokenB.address,
    fee,
  ];

  const token0 = initParams[1] < initParams[2] ? dexTokenA : dexTokenB;

  const token1 = initParams[1] > initParams[2] ? dexTokenA : dexTokenB;

  return {
    deployer,
    alice,
    bob,
    charlie,
    daniel,
    dexPool,
    dexPoolFactory,
    token0,
    token1,
    initParams,
  };
}

export async function hardhatImpersonateDexFactory(
  address: string
): Promise<SignerWithAddress> {
  await network.provider.send('hardhat_setBalance', [
    address,
    ethers.utils.parseEther('1').toHexString().replace('0x0', '0x'),
  ]);
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });
  const factorySigner = await ethers.getSigner(address);
  return factorySigner;
}

export async function mintAndIncreaseAllowance(
  token: DexToken,
  dexAddress: string,
  signer: SignerWithAddress,
  amount: BigNumber
) {
  await token.connect(signer).mint(amount);
  await token.connect(signer).increaseAllowance(dexAddress, amount);
}
