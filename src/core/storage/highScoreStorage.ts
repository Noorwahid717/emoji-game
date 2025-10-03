const STORAGE_KEY = 'emojiMatchHighScore';

export const loadHighScore = (): number => {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (!stored) {
    return 0;
  }

  const parsed = Number.parseInt(stored, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

export const persistHighScore = (score: number): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const sanitized = Math.max(0, Math.floor(score));
  window.localStorage.setItem(STORAGE_KEY, sanitized.toString());
};

export default {
  loadHighScore,
  persistHighScore,
};
