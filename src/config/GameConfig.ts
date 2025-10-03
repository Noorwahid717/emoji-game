import Phaser from 'phaser';

import { EMOJI_CHARACTERS } from '../core/board/emojiCatalog';

type GridSize = {
  columns: number;
  rows: number;
};

type CellSize = {
  width: number;
  height: number;
};

type GridPosition = {
  x: number;
  y: number;
};

type TimerSettings = {
  duration: number;
  warningTime: number;
};

type ScoringSettings = {
  matchPoints: number;
  timeBonus: number;
  mismatchPenalty: number;
  completionBonus: number;
};

type AssetSettings = {
  emojiCount: number;
};

type GameSettings = {
  gridSize: GridSize;
  cellSize: CellSize;
  gridPosition: GridPosition;
  timer: TimerSettings;
  scoring: ScoringSettings;
  assets: AssetSettings;
};

export type EmojiGameConfig = {
  phaser: Phaser.Types.Core.GameConfig;
  game: GameSettings;
};

const validateConfig = (config: EmojiGameConfig): EmojiGameConfig => {
  const {
    game: {
      gridSize: { columns, rows },
      assets: { emojiCount },
      timer: { duration, warningTime },
    },
  } = config;

  if ((columns * rows) % 2 !== 0) {
    throw new Error('Grid size must contain an even number of cells to create pairs.');
  }

  const requiredPairs = (columns * rows) / 2;
  if (requiredPairs > emojiCount) {
    throw new Error(
      `Not enough emoji textures configured. Required: ${requiredPairs}, configured: ${emojiCount}.`,
    );
  }

  if (emojiCount > EMOJI_CHARACTERS.length) {
    throw new Error(
      `Configured emojiCount (${emojiCount}) exceeds available emoji assets (${EMOJI_CHARACTERS.length}).`,
    );
  }

  if (warningTime >= duration) {
    throw new Error('warningTime must be smaller than the timer duration.');
  }

  return config;
};

const resolution =
  typeof window !== 'undefined' && window.devicePixelRatio
    ? Math.min(window.devicePixelRatio, 2)
    : 1;

const baseConfig: EmojiGameConfig = {
  phaser: {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#008eb0',
    parent: 'game-root',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      expandParent: true,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    resolution,
    fps: {
      target: 60,
      min: 30,
      forceSetTimeOut: true,
    },
  },
  game: {
    gridSize: {
      columns: 4,
      rows: 4,
    },
    cellSize: {
      width: 110,
      height: 110,
    },
    gridPosition: {
      x: 170,
      y: 140,
    },
    timer: {
      duration: 75,
      warningTime: 15,
    },
    scoring: {
      matchPoints: 125,
      timeBonus: 5,
      mismatchPenalty: 20,
      completionBonus: 750,
    },
    assets: {
      emojiCount: 16,
    },
  },
};

export const GameConfig = validateConfig(baseConfig);

export default GameConfig;
