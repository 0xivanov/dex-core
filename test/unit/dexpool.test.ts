import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers, network } from 'hardhat';
import { DexPool, DexPoolFactory, DexToken } from '../../typechain-types';
import {
  hardhatImpersonateDexFactory,
  loadVariables,
  mintAndIncreaseAllowance,
} from '../shared/setup';
import { sqrt } from '../utils/bn';
import { getRandomNumber, getTestAmounts } from '../utils/pool-utils';

describe('DexPool.sol', () => {
  let dexPool: DexPool,
    token0: DexToken,
    token1: DexToken,
    deployer: SignerWithAddress,
    factorySigner: SignerWithAddress,
    alice: SignerWithAddress, //lp 1
    bob: SignerWithAddress, //lp 2
    dexPoolFactory: DexPoolFactory,
    initParams: [string, string, string, BigNumber];

  describe('Initialize', async function () {
    beforeEach('load fixtures and initialize DexPool', async function () {
      ({ dexPool, deployer, dexPoolFactory, initParams } = await loadVariables(
        BigNumber.from(3000)
      ));
      const factorySigner = await hardhatImpersonateDexFactory(
        dexPoolFactory.address
      );
      await dexPool.connect(factorySigner).initialize(...initParams);
    });

    it('should set the factory', async function () {
      expect(await dexPool.factory()).to.equal(dexPoolFactory.address);
    });
    it('should set the owner', async function () {
      expect(await dexPool.owner()).to.equal(initParams[0]);
      expect(await dexPool.owner()).to.equal(deployer.address);
    });
    it('should set token0', async function () {
      const token0 =
        initParams[1] < initParams[2] ? initParams[1] : initParams[2];
      expect(await dexPool.token0()).to.equal(token0);
    });
    it('should set token1', async function () {
      const token1 =
        initParams[1] > initParams[2] ? initParams[1] : initParams[2];
      expect(await dexPool.token1()).to.equal(token1);
    });
    it('should set the fee', async function () {
      expect(await dexPool.fee()).to.equal(initParams[3]);
    });
  });

  describe('Revert initialize', async function () {
    beforeEach('load fixtures', async function () {
      ({ dexPool, dexPoolFactory, alice, initParams } = await loadVariables(
        BigNumber.from(3000)
      ));
      factorySigner = await hardhatImpersonateDexFactory(
        dexPoolFactory.address
      );
    });

    it('should throw if owner is zero address', async function () {
      initParams[0] = '0x0000000000000000000000000000000000000000';
      await expect(
        dexPool.connect(factorySigner).initialize(...initParams)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidAddress');
    });

    it('should throw if caller does not implement erc165', async function () {
      await expect(dexPool.initialize(...initParams)).to.be.reverted;
    });

    it('should throw if caller is not DexFactory', async function () {
      const tokenA = initParams[1];
      await network.provider.send('hardhat_setBalance', [
        tokenA,
        ethers.utils.parseEther('1').toHexString().replace('0x0', '0x'),
      ]);
      await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [tokenA],
      });
      const signer = await ethers.getSigner(tokenA);

      await expect(
        dexPool.connect(signer).initialize(...initParams)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidFactory');
    });

    it('should throw if tokenA == tokenB', async function () {
      initParams[1] = initParams[2];
      await expect(
        dexPool.connect(factorySigner).initialize(...initParams)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidTokens');
    });

    it('should throw if tokenA is the zero address', async function () {
      initParams[1] = '0x0000000000000000000000000000000000000000';
      await expect(
        dexPool.connect(factorySigner).initialize(...initParams)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidTokens');
    });

    it('should throw if tokenB is the zero address', async function () {
      initParams[2] = '0x0000000000000000000000000000000000000000';
      await expect(
        dexPool.connect(factorySigner).initialize(...initParams)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidTokens');
    });

    it('should throw if tokenA does not implement erc165', async function () {
      initParams[1] = alice.address;
      await expect(dexPool.connect(factorySigner).initialize(...initParams)).to
        .be.reverted;
    });

    it('should throw if tokenB does not implement erc165', async function () {
      initParams[2] = alice.address;
      await expect(dexPool.connect(factorySigner).initialize(...initParams)).to
        .be.reverted;
    });

    it('should throw if tokenA does not support erc20', async function () {
      initParams[1] = dexPoolFactory.address;
      await expect(
        dexPool.connect(factorySigner).initialize(...initParams)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidTokens');
    });

    it('should throw if tokenB does not support erc20', async function () {
      initParams[2] = dexPoolFactory.address;
      await expect(
        dexPool.connect(factorySigner).initialize(...initParams)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidTokens');
    });

    it('should throw if fee is 0', async function () {
      initParams[3] = BigNumber.from(0);
      await expect(
        dexPool.connect(factorySigner).initialize(...initParams)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidFee');
    });

    it('should throw if fee is > 10 000', async function () {
      initParams[3] = BigNumber.from(10001);
      await expect(
        dexPool.connect(factorySigner).initialize(...initParams)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidFee');
    });

    it('should throw if initialize is called multiple times', async function () {
      await dexPool.connect(factorySigner).initialize(...initParams);
      await expect(
        dexPool.connect(factorySigner).initialize(...initParams)
      ).to.be.revertedWithCustomError(dexPool, 'AlreadyInitialized');
    });
  });

  describe('AddLiquidity', async function () {
    let amount0 = BigNumber.from(500),
      amount1 = BigNumber.from(1000);
    beforeEach(
      'load fixtures, initialize DexPool and approve tokens',
      async function () {
        ({ dexPool, dexPoolFactory, token0, token1, alice, bob, initParams } =
          await loadVariables(BigNumber.from(3000)));
        amount0 = BigNumber.from(500);
        amount1 = BigNumber.from(1000);

        const factorySigner = await hardhatImpersonateDexFactory(
          dexPoolFactory.address
        );
        await dexPool.connect(factorySigner).initialize(...initParams);
        await mintAndIncreaseAllowance(token0, dexPool.address, alice, amount0);
        await mintAndIncreaseAllowance(token1, dexPool.address, alice, amount1);
        await dexPool.connect(alice).addLiquidity(amount0, amount1);
      }
    );

    it('transfers the tokens', async function () {
      expect(await dexPool.balance0()).to.equal(BigNumber.from(amount0));
      expect(await dexPool.balance1()).to.equal(BigNumber.from(amount1));
    });

    it('updates total shares', async function () {
      expect(await dexPool.totalShares()).to.equal(sqrt(amount0.mul(amount1)));
    });
  });

  for (let i = 1; i <= 100; i = i + 7) {
    describe('AddLiquidity test cases', async function () {
      this.beforeAll(async function () {
        ({ dexPool, dexPoolFactory, token0, token1, alice, bob, initParams } =
          await loadVariables(BigNumber.from(3000)));

        const factorySigner = await hardhatImpersonateDexFactory(
          dexPoolFactory.address
        );
        await dexPool.connect(factorySigner).initialize(...initParams);
        let amount0 = BigNumber.from(getRandomNumber(100));
        let amount1 = amount0.mul(i);
        await mintAndIncreaseAllowance(token0, dexPool.address, alice, amount0);
        await mintAndIncreaseAllowance(token1, dexPool.address, alice, amount1);
        await dexPool.connect(alice).addLiquidity(amount0, amount1);
      });

      for (const testCase of getTestAmounts(i)) {
        let amount0: BigNumber, amount1: BigNumber;
        ({ amount0, amount1 } = testCase);

        it('mints shares correctly', async function () {
          let signer = amount0.div(2) == BigNumber.from(0) ? alice : bob;

          await mintAndIncreaseAllowance(
            token0,
            dexPool.address,
            signer,
            amount0
          );
          await mintAndIncreaseAllowance(
            token1,
            dexPool.address,
            signer,
            amount1
          );
          let totalShares = await dexPool.totalShares();

          let expectedShare = amount0
            .mul(totalShares)
            .div(await dexPool.balance0());
          let previousShare = await (
            await dexPool.balanceOf(signer.address)
          ).toNumber();
          expect(
            amount1.mul(totalShares).div(await dexPool.balance1())
          ).to.equal(expectedShare);

          await expect(dexPool.connect(signer).addLiquidity(amount0, amount1))
            .to.emit(dexPool, 'LiquidityAdded')
            .withArgs(signer.address, amount0, amount1, expectedShare);
          expect(await dexPool.balanceOf(signer.address)).to.equal(
            BigNumber.from(expectedShare.add(previousShare))
          );
        });
      }
    });
  }

  describe('Revert addLiquidity', async function () {
    let ratio = 2;
    let amount0 = BigNumber.from(1000);
    let amount1 = amount0.mul(ratio);
    beforeEach(async function () {
      ({ dexPool, dexPoolFactory, token0, token1, alice, initParams } =
        await loadVariables(BigNumber.from(3000)));

      const factorySigner = await hardhatImpersonateDexFactory(
        dexPoolFactory.address
      );
      await dexPool.connect(factorySigner).initialize(...initParams);
      await mintAndIncreaseAllowance(
        token0,
        dexPool.address,
        alice,
        amount0.mul(2)
      );
      await mintAndIncreaseAllowance(
        token1,
        dexPool.address,
        alice,
        amount1.mul(2)
      );
      await dexPool.connect(alice).addLiquidity(amount0, amount1);
    });

    it('shoud throw if amount0 or amount1 are 0', async function () {
      await expect(
        dexPool.connect(alice).addLiquidity(0, amount1.sub(1))
      ).to.be.revertedWithCustomError(dexPool, 'InvalidLiquidityAllocation');
      await expect(
        dexPool.connect(alice).addLiquidity(amount0.sub(1), 0)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidLiquidityAllocation');
      await expect(
        dexPool.connect(alice).addLiquidity(0, 0)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidLiquidityAllocation');
    });

    it('shoud throw if token allocation changes the price in the pool', async function () {
      await expect(
        dexPool.connect(alice).addLiquidity(amount0, amount1.sub(1))
      ).to.be.revertedWithCustomError(dexPool, 'InvalidLiquidityAllocation');
      await expect(
        dexPool.connect(alice).addLiquidity(amount0.sub(1), amount1)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidLiquidityAllocation');
    });
  });

  describe('RemoveLiquidity', async function () {
    let ratio = 2;
    let amount0 = BigNumber.from(1000);
    let amount1 = amount0.mul(ratio);
    beforeEach(async function () {
      ({ dexPool, dexPoolFactory, token0, token1, alice, initParams } =
        await loadVariables(BigNumber.from(3000)));

      const factorySigner = await hardhatImpersonateDexFactory(
        dexPoolFactory.address
      );
      await dexPool.connect(factorySigner).initialize(...initParams);
      await mintAndIncreaseAllowance(token0, dexPool.address, alice, amount0);
      await mintAndIncreaseAllowance(token1, dexPool.address, alice, amount1);
      await dexPool.connect(alice).addLiquidity(amount0, amount1);
    });
    it('burns shares', async function () {
      let totalShares = await dexPool.totalShares();
      let share = await dexPool.balanceOf(alice.address);
      await dexPool.connect(alice).removeLiquidity(share);
      share = await dexPool.balanceOf(alice.address);
      totalShares = await dexPool.totalShares();
      expect(totalShares.add(share)).to.equal(0);
    });
    it('transfers tokens correctly', async function () {
      let balance0 = await dexPool.balance0();
      let balance1 = await dexPool.balance1();
      let share = await dexPool.balanceOf(alice.address);
      let totalShares = await dexPool.totalShares();
      let expectedTransfer0 = share.mul(balance0).div(totalShares);
      let expectedTransfer1 = share.mul(balance1).div(totalShares);
      await expect(dexPool.connect(alice).removeLiquidity(share))
        .to.emit(dexPool, 'LiquidityRemoved')
        .withArgs(alice.address, expectedTransfer0, expectedTransfer1, share);
      share = await dexPool.balanceOf(alice.address);
      totalShares = await dexPool.totalShares();
      expect(totalShares.add(share)).to.equal(0);
    });
  });
  describe('Revert removeLiquidity', async function () {
    beforeEach(async function () {
      ({ dexPool, alice, initParams } = await loadVariables(
        BigNumber.from(3000)
      ));

      const factorySigner = await hardhatImpersonateDexFactory(
        dexPoolFactory.address
      );
      await dexPool.connect(factorySigner).initialize(...initParams);
    });
    it('throws if share is 0', async function () {
      await expect(
        dexPool.connect(alice).removeLiquidity(0)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidShare');
    });
    it('throws if msg.sender does not have enough shares', async function () {
      await expect(
        dexPool.connect(alice).removeLiquidity(10)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidShare');
    });
  });
  describe('Swap', async function () {
    let ratio = 2;
    let amount0 = BigNumber.from(1000);
    let amount1 = amount0.mul(ratio);
    beforeEach(async function () {
      ({ dexPool, dexPoolFactory, token0, token1, alice, bob, initParams } =
        await loadVariables(BigNumber.from(3000)));

      const factorySigner = await hardhatImpersonateDexFactory(
        dexPoolFactory.address
      );
      await dexPool.connect(factorySigner).initialize(...initParams);
      await mintAndIncreaseAllowance(token0, dexPool.address, alice, amount0);
      await mintAndIncreaseAllowance(token1, dexPool.address, alice, amount1);
      await dexPool.connect(alice).addLiquidity(amount0, amount1);
    });
    it('transfers the provided token', async function () {
      await mintAndIncreaseAllowance(token0, dexPool.address, bob, amount0);
      await dexPool.connect(bob).swap(token0.address, amount0);
      expect(await token0.balanceOf(alice.address)).to.equal(0);
    });
    it('transfers the provided token', async function () {
      await mintAndIncreaseAllowance(token1, dexPool.address, bob, amount1);
      await dexPool.connect(bob).swap(token1.address, amount0);
      expect(await token1.balanceOf(alice.address)).to.equal(0);
    });
    it('transfers the other pair token correctly', async function () {
      let amountWithFee = amount0.sub(amount0.mul(3).div(1000));
      let expectedTransfer = amountWithFee
        .mul(await dexPool.balance1())
        .div(amountWithFee.add(await dexPool.balance0()));

      await mintAndIncreaseAllowance(token0, dexPool.address, bob, amount0);
      await expect(dexPool.connect(bob).swap(token0.address, amount0))
        .to.emit(dexPool, 'Swap')
        .withArgs(token0.address, amount0, expectedTransfer);
    });
    it('transfers the other pair token correctly', async function () {
      let amountWithFee = amount1.sub(amount1.mul(3).div(1000));
      let expectedTransfer = amountWithFee
        .mul(await dexPool.balance0())
        .div(amountWithFee.add(await dexPool.balance1()));

      await mintAndIncreaseAllowance(token1, dexPool.address, bob, amount1);
      await expect(dexPool.connect(bob).swap(token1.address, amount1))
        .to.emit(dexPool, 'Swap')
        .withArgs(token1.address, amount1, expectedTransfer);
    });
  });
  describe('Revert swap', async function () {
    let ratio = 2;
    let amount0 = BigNumber.from(1000);
    let amount1 = amount0.mul(ratio);
    beforeEach(async function () {
      ({ dexPool, dexPoolFactory, token0, token1, alice, bob, initParams } =
        await loadVariables(BigNumber.from(3000)));

      const factorySigner = await hardhatImpersonateDexFactory(
        dexPoolFactory.address
      );
      await dexPool.connect(factorySigner).initialize(...initParams);
      await mintAndIncreaseAllowance(token0, dexPool.address, alice, amount0);
      await mintAndIncreaseAllowance(token1, dexPool.address, alice, amount1);
      await dexPool.connect(alice).addLiquidity(amount0, amount1);
    });
    it('throws if token is invalid', async function () {
      await expect(
        dexPool.connect(bob).swap(alice.address, amount0)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidToken');
    });
    it('throws if amount is 0', async function () {
      await expect(
        dexPool.connect(bob).swap(token0.address, 0)
      ).to.be.revertedWithCustomError(dexPool, 'InvalidAmount');
    });
  });
});
