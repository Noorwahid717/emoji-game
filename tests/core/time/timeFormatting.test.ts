import { describe, expect, it } from 'vitest';

import { formatTime } from '../../../src/core/time/timeFormatting';

describe('formatTime', () => {
  it('formats minutes and seconds', () => {
    expect(formatTime(75)).toBe('01:15');
  });

  it('clamps negative values to zero', () => {
    expect(formatTime(-10)).toBe('00:00');
  });
});
