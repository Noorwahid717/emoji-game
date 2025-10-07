import { describe, expect, it } from 'vitest';

import { shuffle } from '../../src/utils/shuffle';

describe('shuffle', () => {
  it('returns a new array with the same elements', () => {
    const input = [1, 2, 3, 4];
    const result = shuffle(input);

    expect(result).not.toBe(input);
    expect(result.sort()).toStrictEqual([...input].sort());
  });

  it('uses the provided random generator deterministically', () => {
    const zeroRandom = () => 0;
    const result = shuffle([1, 2, 3, 4], zeroRandom);

    expect(result).toStrictEqual([2, 3, 4, 1]);
  });
});
