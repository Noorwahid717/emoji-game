import Phaser from 'phaser';

import { EMOJI_CHARACTERS } from '../core/board/emojiCatalog';

type GridSize = {
  columns: number;
  rows: number;
};

type AssetSettings = {
  emojiCount: number;
};

type LayoutSettings = {
  boardTop: number;
  boardMaxWidth: number;
  boardMaxHeight: number;
  cardSpacing: number;
};

export type GameMode = 'classic' | 'zen' | 'hard' | 'daily';

export type PowerUpSettings = {
  hint: number;
  freeze: number;
  shuffle: number;
};

export type LevelDefinition = {
  id: number;
  gridSize: GridSize;
  baseTime: number;
  timeBonus: number;
};

type TimerModeSettings = {
  enabled: boolean;
  warningTime: number;
  streakBonus: number;
  freezeDuration: number;
  timePenaltyOnMismatch: number;
};

export type ScoringSettings = {
  matchPoints: number;
  mismatchPenalty: number;
  completionBonus: number;
  perfectBonus: number;
  streakMultiplierStep: number;
};

export type ModeDefinition = {
  id: GameMode;
  labelKey: string;
  descriptionKey: string;
  timer: TimerModeSettings;
  scoring: ScoringSettings;
  powerUps: PowerUpSettings;
  trackMoves?: boolean;
  dailySeed?: boolean;
};

type GameSettings = {
  levels: LevelDefinition[];
  modes: Record<GameMode, ModeDefinition>;
  layout: LayoutSettings;
  assets: AssetSettings;
};

export type EmojiGameConfig = {
  phaser: Phaser.Types.Core.GameConfig;
  game: GameSettings;
};

const validateConfig = (config: EmojiGameConfig): EmojiGameConfig => {
  const {
    game: { levels, assets, modes },
  } = config;

  levels.forEach((level) => {
    const { columns, rows } = level.gridSize;
    if ((columns * rows) % 2 !== 0) {
      throw new Error(
        `Level ${level.id} grid size must contain an even number of cells to create pairs.`,
      );
    }
  });

  const largestBoard = levels.reduce((max, level) => {
    const total = level.gridSize.columns * level.gridSize.rows;
    return Math.max(max, total);
  }, 0);

  const requiredPairs = largestBoard / 2;
  if (requiredPairs > assets.emojiCount) {
    throw new Error(
      `Not enough emoji textures configured. Required: ${requiredPairs}, configured: ${assets.emojiCount}.`,
    );
  }

  if (assets.emojiCount > EMOJI_CHARACTERS.length) {
    throw new Error(
      `Configured emojiCount (${assets.emojiCount}) exceeds available emoji assets (${EMOJI_CHARACTERS.length}).`,
    );
  }

  Object.values(modes).forEach((mode) => {
    if (mode.timer.enabled && mode.timer.warningTime <= 0) {
      throw new Error(`Mode ${mode.id} warningTime must be positive when the timer is enabled.`);
    }
    if (mode.scoring.matchPoints <= 0) {
      throw new Error(`Mode ${mode.id} must award positive match points.`);
    }
  });

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
    levels: [
      { id: 1, gridSize: { columns: 4, rows: 3 }, baseTime: 55, timeBonus: 7 },
      { id: 2, gridSize: { columns: 4, rows: 4 }, baseTime: 70, timeBonus: 6 },
      { id: 3, gridSize: { columns: 5, rows: 4 }, baseTime: 85, timeBonus: 6 },
      { id: 4, gridSize: { columns: 6, rows: 4 }, baseTime: 95, timeBonus: 5 },
      { id: 5, gridSize: { columns: 6, rows: 5 }, baseTime: 110, timeBonus: 5 },
    ],
    modes: {
      classic: {
        id: 'classic',
        labelKey: 'mode.classic.label',
        descriptionKey: 'mode.classic.description',
        timer: {
          enabled: true,
          warningTime: 15,
          streakBonus: 2,
          freezeDuration: 3,
          timePenaltyOnMismatch: 0,
        },
        scoring: {
          matchPoints: 120,
          mismatchPenalty: 20,
          completionBonus: 800,
          perfectBonus: 200,
          streakMultiplierStep: 0.4,
        },
        powerUps: { hint: 2, freeze: 1, shuffle: 1 },
      },
      zen: {
        id: 'zen',
        labelKey: 'mode.zen.label',
        descriptionKey: 'mode.zen.description',
        timer: {
          enabled: false,
          warningTime: 0,
          streakBonus: 0,
          freezeDuration: 0,
          timePenaltyOnMismatch: 0,
        },
        scoring: {
          matchPoints: 100,
          mismatchPenalty: 10,
          completionBonus: 600,
          perfectBonus: 150,
          streakMultiplierStep: 0.5,
        },
        powerUps: { hint: 3, freeze: 0, shuffle: 1 },
        trackMoves: true,
      },
      hard: {
        id: 'hard',
        labelKey: 'mode.hard.label',
        descriptionKey: 'mode.hard.description',
        timer: {
          enabled: true,
          warningTime: 20,
          streakBonus: 3,
          freezeDuration: 3,
          timePenaltyOnMismatch: 6,
        },
        scoring: {
          matchPoints: 140,
          mismatchPenalty: 35,
          completionBonus: 950,
          perfectBonus: 300,
          streakMultiplierStep: 0.6,
        },
        powerUps: { hint: 1, freeze: 1, shuffle: 1 },
      },
      daily: {
        id: 'daily',
        labelKey: 'mode.daily.label',
        descriptionKey: 'mode.daily.description',
        timer: {
          enabled: true,
          warningTime: 25,
          streakBonus: 3,
          freezeDuration: 3,
          timePenaltyOnMismatch: 4,
        },
        scoring: {
          matchPoints: 135,
          mismatchPenalty: 25,
          completionBonus: 900,
          perfectBonus: 250,
          streakMultiplierStep: 0.5,
        },
        powerUps: { hint: 1, freeze: 1, shuffle: 1 },
        dailySeed: true,
      },
    },
    layout: {
      boardTop: 150,
      boardMaxWidth: 640,
      boardMaxHeight: 420,
      cardSpacing: 18,
    },
    assets: {
      emojiCount: 18,
    },
  },
};

export const GameConfig = validateConfig(baseConfig);

export default GameConfig;
