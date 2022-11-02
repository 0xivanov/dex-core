import { BigNumber } from 'ethers';

interface PoolTestCase {
  amount0: BigNumber;
  amount1: BigNumber;
}

export function getRandomNumber(max: number): number {
  return Math.floor((Math.random() + 1) * max);
}

function getAmounts(index: number): PoolTestCase {
  const amount0 = BigNumber.from(getRandomNumber(1000));
  const amount1 = BigNumber.from(amount0.mul(index));
  return { amount0, amount1 };
}

export function getTestAmounts(index: number): PoolTestCase[] {
  let TEST_AMOUNTS: PoolTestCase[] = [];

  for (let i = 1; i < 5; i++) {
    TEST_AMOUNTS.push(getAmounts(index));
  }
  return TEST_AMOUNTS;
}
