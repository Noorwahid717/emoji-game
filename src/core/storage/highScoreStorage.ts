import type { GameMode } from '../../config/GameConfig';

const STORAGE_KEY = 'emojiMatchHighScore::v2';

type ModeScoreMap = Partial<Record<GameMode, number>>;

type HighScorePayload = {
  modes: ModeScoreMap;
  daily: Record<string, number>;
};

const defaultPayload: HighScorePayload = {
  modes: {},
  daily: {},
};

const readPayload = (): HighScorePayload => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultPayload;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultPayload;
    }

    const parsed = JSON.parse(raw) as Partial<HighScorePayload>;
    return {
      modes: parsed.modes ?? {},
      daily: parsed.daily ?? {},
    };
  } catch (error) {
    console.warn('Unable to parse high score payload', error);
    return defaultPayload;
  }
};

const writePayload = (payload: HighScorePayload): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to persist high scores', error);
  }
};

export const loadHighScore = (mode: GameMode, seed?: string): number => {
  const payload = readPayload();
  if (mode === 'daily') {
    if (!seed) {
      return 0;
    }
    return payload.daily[seed] ?? 0;
  }

  const stored = payload.modes[mode];
  if (typeof stored !== 'number' || Number.isNaN(stored) || stored < 0) {
    return 0;
  }
  return stored;
};

export const persistHighScore = (mode: GameMode, score: number, seed?: string): void => {
  const sanitized = Math.max(0, Math.floor(score));
  const payload = readPayload();

  if (mode === 'daily') {
    if (!seed) {
      return;
    }
    payload.daily[seed] = Math.max(payload.daily[seed] ?? 0, sanitized);
  } else {
    const current = payload.modes[mode] ?? 0;
    payload.modes[mode] = Math.max(current, sanitized);
  }

  writePayload(payload);
};

export const loadAllHighScores = (): Record<GameMode, number> => {
  const payload = readPayload();
  return {
    classic: payload.modes.classic ?? 0,
    zen: payload.modes.zen ?? 0,
    hard: payload.modes.hard ?? 0,
    daily: 0,
  };
};

export default {
  loadHighScore,
  persistHighScore,
  loadAllHighScores,
};
