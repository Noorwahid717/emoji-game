import { describe, expect, it } from 'vitest';

import { applyMismatchPenalty, calculateMatchScore } from '../../src/utils/scoring';

describe('scoring utilities', () => {
  it('calculates match score without streak bonus', () => {
    expect(calculateMatchScore(120, 1, 0.4)).toBe(120);
  });

  it('applies streak multiplier with rounding', () => {
    expect(calculateMatchScore(120, 3, 0.4)).toBe(216);
  });

  it('never lets the score drop below zero after a mismatch', () => {
    expect(applyMismatchPenalty(10, 25)).toBe(0);
    expect(applyMismatchPenalty(150, 25)).toBe(125);
  });
});
