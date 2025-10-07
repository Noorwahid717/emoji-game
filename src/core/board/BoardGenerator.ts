import { EMOJI_COUNT, getEmojiByIndex } from '../../data/emojis';
import { shuffle } from '../../utils/shuffle';

type RandomGenerator = () => number;

export interface CardDefinition {
  readonly id: number;
  readonly matchId: number;
  readonly textureKey: string;
  readonly frame: string;
  readonly emojiId: string;
  readonly char: string;
  readonly label: string;
}

export class BoardGenerator {
  private readonly random: RandomGenerator;

  constructor(random: RandomGenerator = Math.random) {
    this.random = random;
  }

  public generatePairs(pairCount: number, emojiPoolSize: number = EMOJI_COUNT): CardDefinition[] {
    if (pairCount <= 0) {
      throw new Error('pairCount must be a positive number.');
    }

    const poolLimit = Math.min(emojiPoolSize, EMOJI_COUNT);
    if (poolLimit < pairCount) {
      throw new Error(
        `emojiPoolSize must be greater than or equal to pairCount (requested ${pairCount}, available ${poolLimit}).`,
      );
    }

    const emojiIndexes = shuffle(
      Array.from({ length: poolLimit }, (_, index) => index),
      () => this.random(),
    ).slice(0, pairCount);

    const cards: CardDefinition[] = emojiIndexes
      .flatMap((emojiIndex) => {
        const emoji = getEmojiByIndex(emojiIndex);
        const frameKey = `emoji-${emojiIndex}`;
        const matchId = emojiIndex;
        return [
          {
            id: 0,
            matchId,
            textureKey: 'emoji-atlas',
            frame: frameKey,
            emojiId: emoji.id,
            char: emoji.char,
            label: emoji.label,
          },
          {
            id: 0,
            matchId,
            textureKey: 'emoji-atlas',
            frame: frameKey,
            emojiId: emoji.id,
            char: emoji.char,
            label: emoji.label,
          },
        ];
      })
      .map((card, index) => ({ ...card, id: index }));

    return shuffle(cards, () => this.random());
  }
}

export default BoardGenerator;
