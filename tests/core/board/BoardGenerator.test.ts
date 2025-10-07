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
    cards.forEach((card) => {
      expect(typeof card.char).toBe('string');
      expect(card.char.length).toBeGreaterThan(0);
      expect(typeof card.label).toBe('string');
      expect(card.label.length).toBeGreaterThan(0);
    });
  });

  it('duplicates every emoji exactly twice with the same metadata', () => {
    const generator = new BoardGenerator(mockRandom());
    const cards = generator.generatePairs(4, 8);

    const matchCounts = cards.reduce<
      Record<number, { count: number; char: string; label: string }>
    >((acc, card) => {
      const entry = acc[card.matchId];
      if (entry) {
        entry.count += 1;
        expect(entry.char).toBe(card.char);
        expect(entry.label).toBe(card.label);
      } else {
        acc[card.matchId] = { count: 1, char: card.char, label: card.label };
      }
      return acc;
    }, {});

    expect(Object.values(matchCounts).map((entry) => entry.count)).toStrictEqual([2, 2, 2, 2]);
    expect(cards.every((card) => card.textureKey === 'emoji-atlas')).toBe(true);
  });

  it('throws when not enough emoji textures are available', () => {
    const generator = new BoardGenerator();
    expect(() => generator.generatePairs(5, 4)).toThrowError();
  });
});
