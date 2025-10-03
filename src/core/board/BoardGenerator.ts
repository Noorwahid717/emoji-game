import { getEmojiTextureKey } from './emojiCatalog';

type RandomGenerator = () => number;

export interface CardDefinition {
  readonly id: number;
  readonly textureKey: string;
}

export class BoardGenerator {
  private readonly random: RandomGenerator;

  constructor(random: RandomGenerator = Math.random) {
    this.random = random;
  }

  public generatePairs(pairCount: number, emojiPoolSize: number): CardDefinition[] {
    if (pairCount <= 0) {
      throw new Error('pairCount must be a positive number.');
    }

    if (emojiPoolSize < pairCount) {
      throw new Error('emojiPoolSize must be greater than or equal to pairCount.');
    }

    const selections = this.pickUniqueIndexes(pairCount, emojiPoolSize);
    const cards: CardDefinition[] = selections
      .flatMap((index) => {
        const textureKey = getEmojiTextureKey(index);
        return [
          { id: index * 2, textureKey },
          { id: index * 2 + 1, textureKey },
        ];
      })
      .map((card, position) => ({ ...card, id: position }));

    return this.shuffle(cards);
  }

  private pickUniqueIndexes(pairCount: number, emojiPoolSize: number): number[] {
    const pool = Array.from({ length: emojiPoolSize }, (_, index) => index);
    const selection: number[] = [];

    for (let i = 0; i < pairCount; i += 1) {
      const randomIndex = Math.floor(this.random() * pool.length);
      const [value] = pool.splice(randomIndex, 1);
      selection.push(value);
    }

    return selection;
  }

  private shuffle<T>(items: readonly T[]): T[] {
    const clone = [...items];
    for (let i = clone.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.random() * (i + 1));
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }
}

export default BoardGenerator;
