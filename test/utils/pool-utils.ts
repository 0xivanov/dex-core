interface PoolTestCase {
  amount0: number;
  amount1: number;
}

export function getRandomNumber(max: number): number {
  return Math.floor(Math.random() * max);
}

function getAmounts(index: number): PoolTestCase {
  const amount0 = getRandomNumber(1000);
  const amount1 = Math.floor(amount0 * index);
  return { amount0, amount1 };
}

export function getTestAmounts(index: number): PoolTestCase[] {
  let TEST_AMOUNTS: PoolTestCase[] = [];

  for (let i = 1; i < 5; i++) {
    TEST_AMOUNTS.push(getAmounts(index));
  }
  return TEST_AMOUNTS;
}
