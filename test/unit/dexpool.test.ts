import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { BigNumber } from 'ethers';
import { deployFixtures } from '../shared/fixtures';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DexPool, DexPoolFactory, DexToken } from '../../typechain-types';

describe('DexPool.sol', () => {
  async function loadVariables(fee: BigNumber) {
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

  async function hardhatImpersonateDexFactory(
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

  async function mintAndIncreaseAllowance(
    token: DexToken,
    dexAddress: string,
    signer: SignerWithAddress,
    amount: number
  ) {
    await token.connect(signer).mint(amount);
    await token.connect(signer).increaseAllowance(dexAddress, amount);
  }

  describe('Initialize', async function () {
    let dexPool: DexPool,
      dexPoolFactory: DexPoolFactory,
      deployer: SignerWithAddress,
      initParams: [string, string, string, BigNumber];
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
    let dexPool: DexPool,
      factorySigner: SignerWithAddress,
      alice: SignerWithAddress,
      dexPoolFactory: DexPoolFactory,
      initParams: [string, string, string, BigNumber];
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
      ).to.be.revertedWith('Initializable: contract is already initialized');
    });
  });

  describe('AddLiquidity', async function () {
    let dexPool: DexPool,
      token0: DexToken,
      token1: DexToken,
      alice: SignerWithAddress, //lp 1
      bob: SignerWithAddress, //lp 2
      dexPoolFactory: DexPoolFactory,
      initParams: [string, string, string, BigNumber];
    let amount0 = 500,
      amount1 = 1000;
    beforeEach(
      'load fixtures, initialize DexPool and approve tokens',
      async function () {
        ({ dexPool, dexPoolFactory, token0, token1, alice, bob, initParams } =
          await loadVariables(BigNumber.from(3000)));
        amount0 = 500;
        amount1 = 1000;

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
      expect(await dexPool.totalShares()).to.equal(
        Math.sqrt(amount0 * amount1).toFixed()
      );
    });

    it('mints shares correctly', async function () {
      let totalShares = Math.floor(Math.sqrt(amount0 * amount1));
      expect(await dexPool.balanceOf(alice.address)).to.equal(
        BigNumber.from(totalShares)
      );

      amount0 = 50;
      amount1 = 100;
      await mintAndIncreaseAllowance(token0, dexPool.address, bob, amount0);
      await mintAndIncreaseAllowance(token1, dexPool.address, bob, amount1);

      let expectedShare = Math.floor(
        (amount0 * totalShares) / (await (await dexPool.balance0()).toNumber())
      );
      let previousShare = await (
        await dexPool.balanceOf(bob.address)
      ).toNumber();
      expect(
        Math.floor(
          (amount1 * totalShares) /
            (await (await dexPool.balance1()).toNumber())
        )
      ).to.equal(expectedShare);

      await expect(dexPool.connect(bob).addLiquidity(amount0, amount1))
        .to.emit(dexPool, 'LiquidityAdded')
        .withArgs(bob.address, amount0, amount1, expectedShare);
      expect(await dexPool.balanceOf(bob.address)).to.equal(
        BigNumber.from(expectedShare + previousShare)
      );
      totalShares = await (await dexPool.totalShares()).toNumber();

      amount0 = 132;
      amount1 = 264;
      await mintAndIncreaseAllowance(token0, dexPool.address, alice, amount0);
      await mintAndIncreaseAllowance(token1, dexPool.address, alice, amount1);

      expectedShare = Math.floor(
        (amount0 * totalShares) / (await (await dexPool.balance0()).toNumber())
      );
      previousShare = await (await dexPool.balanceOf(alice.address)).toNumber();
      expect(
        Math.floor(
          (amount1 * totalShares) /
            (await (await dexPool.balance1()).toNumber())
        )
      ).to.equal(expectedShare);

      await expect(dexPool.connect(alice).addLiquidity(amount0, amount1))
        .to.emit(dexPool, 'LiquidityAdded')
        .withArgs(alice.address, amount0, amount1, expectedShare);

      console.log(await dexPool.balanceOf(alice.address));
      console.log(await dexPool.totalShares());
      expect(await dexPool.balanceOf(alice.address)).to.equal(
        BigNumber.from(expectedShare + previousShare)
      );
    });
  });
});
