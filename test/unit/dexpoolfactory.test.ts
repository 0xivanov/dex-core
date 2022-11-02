import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { expect } from 'chai';
import { DexPoolFactory, DexPool } from '../../typechain-types';
import { loadVariables } from '../shared/setup';
import { ContractReceipt, ContractTransaction } from '@ethersproject/contracts';

describe('DexPoolFactory tests', async function () {
  let deployer: SignerWithAddress,
    dexPoolFactory: DexPoolFactory,
    dexPool: DexPool,
    initParams: [string, string, string, BigNumber];

  describe('CreatePool', async function () {
    this.beforeEach(async function () {
      ({ deployer, dexPool, dexPoolFactory, initParams } = await loadVariables(
        BigNumber.from(3000)
      ));
    });
    it('creates pools correctly', async function () {
      let tokenA, tokenB, fee;
      [, tokenA, tokenB, fee] = initParams;
      let tx: ContractTransaction = await dexPoolFactory
        .connect(deployer)
        .createPool(dexPool.address, tokenA, tokenB, fee);
      let receipt: ContractReceipt = await tx.wait();
      let event = receipt.events!.filter((x) => {
        return x.event == 'PoolCreated';
      })[0];
      expect(event.args!.pool).to.not.equal(undefined);
      expect(event.args!.tokenA).to.be.equal(tokenA);
      expect(event.args!.tokenB).to.be.equal(tokenB);
      expect(await dexPoolFactory.getPool(tokenA, tokenB, fee)).to.be.equal(
        event.args!.pool
      );
      expect(await dexPoolFactory.getPool(tokenB, tokenA, fee)).to.be.equal(
        event.args!.pool
      );
    });
  });
});
