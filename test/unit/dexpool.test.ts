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
        const { deployer, alice, bob, charlie, daniel, dexPool, dexTokenA, dexTokenB, dexPoolFactory } = await loadFixture(deployFixtures);

        const initParams: [string, string, string, BigNumber] = [deployer.address, dexTokenA.address, dexTokenB.address, fee];

        return { deployer, alice, bob, charlie, daniel, dexPool, dexPoolFactory, initParams };
    }

    describe("Initialize", async function () {
        let dexPool: DexPool, dexPoolFactory: DexPoolFactory, deployer: SignerWithAddress, initParams: [string, string, string, BigNumber];
        beforeEach(async function () {
            ({ dexPool, deployer, dexPoolFactory, initParams } = await loadVariables(BigNumber.from(3000)));
            await network.provider.send("hardhat_setBalance", [
                dexPoolFactory.address,
                ethers.utils.parseEther("1").toHexString().replace("0x0", "0x"),
            ]);
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [dexPoolFactory.address],
            });
            const signer = await ethers.getSigner(dexPoolFactory.address);
            await dexPool.connect(signer).initialize(...initParams);
        });

        it("should set the factory", async function () {
            expect(await dexPool.factory()).to.equal(dexPoolFactory.address);
        });
        it("should set the owner", async function () {
            expect(await dexPool.owner()).to.equal(initParams[0]);
            expect(await dexPool.owner()).to.equal(deployer.address);
        });
        it("should set token0", async function () {
            const token0 = initParams[1] < initParams[2] ? initParams[1] : initParams[2];
            expect(await dexPool.token0()).to.equal(token0);
        });
        it("should set token1", async function () {
            const token1 = initParams[1] > initParams[2] ? initParams[1] : initParams[2];
            expect(await dexPool.token1()).to.equal(token1);
        });
        it("should set the fee", async function () {
            expect(await dexPool.fee()).to.equal(initParams[3]);
        });
    });

    describe("Revert initialize", async function () {
        let dexPool: DexPool, factorySigner: SignerWithAddress, alice: SignerWithAddress, dexPoolFactory: DexPoolFactory, initParams: [string, string, string, BigNumber];
        beforeEach(async function () {
            ({ dexPool, dexPoolFactory, alice, initParams } = await loadVariables(BigNumber.from(3000)));

            await network.provider.send("hardhat_setBalance", [
                dexPoolFactory.address,
                ethers.utils.parseEther("1").toHexString().replace("0x0", "0x"),
            ]);
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [dexPoolFactory.address],
            });
            factorySigner = await ethers.getSigner(dexPoolFactory.address);
        });

        it("should throw if owner is zero address", async function () {
            initParams[0] = "0x0000000000000000000000000000000000000000";
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.revertedWithCustomError(dexPool, "InvalidAddress");
        });

        it("should throw if caller does not implement erc165", async function () {
            await expect(dexPool.initialize(...initParams))
                .to.be.reverted;
        });

        it("should throw if caller is not DexFactory", async function () {
            const tokenA = initParams[1];
            await network.provider.send("hardhat_setBalance", [
                tokenA,
                ethers.utils.parseEther("1").toHexString().replace("0x0", "0x"),
            ]);
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [tokenA],
            });
            const signer = await ethers.getSigner(tokenA);

            await expect(dexPool.connect(signer).initialize(...initParams))
                .to.be.revertedWithCustomError(dexPool, "InvalidFactory");
        });

        it("should throw if tokenA == tokenB", async function () {
            initParams[1] = initParams[2];
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.revertedWithCustomError(dexPool, "InvalidTokens");
        });

        it("should throw if tokenA is the zero address", async function () {
            initParams[1] = "0x0000000000000000000000000000000000000000";
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.revertedWithCustomError(dexPool, "InvalidTokens");
        });

        it("should throw if tokenB is the zero address", async function () {
            initParams[2] = "0x0000000000000000000000000000000000000000";
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.revertedWithCustomError(dexPool, "InvalidTokens");
        });

        it("should throw if tokenA does not implement erc165", async function () {
            initParams[1] = alice.address;
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.reverted;
        });

        it("should throw if tokenB does not implement erc165", async function () {
            initParams[2] = alice.address;
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.reverted;
        });

        it("should throw if tokenA does not support erc20", async function () {
            initParams[1] = dexPoolFactory.address;
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.revertedWithCustomError(dexPool, "InvalidTokens");
        });

        it("should throw if tokenB does not support erc20", async function () {
            initParams[2] = dexPoolFactory.address;
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.revertedWithCustomError(dexPool, "InvalidTokens");
        });

        it("should throw if fee is 0", async function () {
            initParams[3] = BigNumber.from(0);
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.revertedWithCustomError(dexPool, "InvalidFee");
        });

        it("should throw if fee is > 10 000", async function () {
            initParams[3] = BigNumber.from(10001);
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.revertedWithCustomError(dexPool, "InvalidFee");
        });

        it('should throw if initialize is called multiple times', async function () {
            await dexPool.connect(factorySigner).initialize(...initParams)
            await expect(dexPool.connect(factorySigner).initialize(...initParams))
                .to.be.revertedWith("Initializable: contract is already initialized");
        });
    });
});
