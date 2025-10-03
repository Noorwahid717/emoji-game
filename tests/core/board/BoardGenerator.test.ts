import { describe, expect, it } from 'vitest';

import BoardGenerator from '../../../src/core/board/BoardGenerator';

const mockRandom = () => {
  let seed = 0;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

describe('BoardGenerator', () => {
  it('creates the expected number of cards', () => {
    const generator = new BoardGenerator();
    const cards = generator.generatePairs(8, 16);

    expect(cards).toHaveLength(16);
  });

  it('duplicates every texture exactly twice', () => {
    const generator = new BoardGenerator(mockRandom());
    const cards = generator.generatePairs(4, 8);

    const textureCounts = cards.reduce<Record<string, number>>((acc, card) => {
      acc[card.textureKey] = (acc[card.textureKey] ?? 0) + 1;
      return acc;
    }, {});

    expect(Object.values(textureCounts)).toStrictEqual([2, 2, 2, 2]);
  });

  it('throws when not enough emoji textures are available', () => {
    const generator = new BoardGenerator();
    expect(() => generator.generatePairs(5, 4)).toThrowError();
  });
});
