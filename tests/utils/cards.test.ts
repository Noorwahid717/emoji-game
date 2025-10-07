import { describe, expect, it } from 'vitest';

import { isMatchingPair } from '../../src/utils/cards';

describe('isMatchingPair', () => {
  it('returns true when match ids are equal', () => {
    expect(isMatchingPair({ matchId: 3 }, { matchId: 3 })).toBe(true);
  });

  it('returns false when match ids differ', () => {
    expect(isMatchingPair({ matchId: 1 }, { matchId: 2 })).toBe(false);
  });
});
