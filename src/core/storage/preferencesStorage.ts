const STORAGE_KEY = 'emoji-game::preferences';

type Preferences = {
  audioMuted: boolean;
};

const defaultPreferences: Preferences = {
  audioMuted: false,
};

const readPreferences = (): Preferences => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultPreferences;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      audioMuted: Boolean(parsed.audioMuted),
    };
  } catch (error) {
    console.warn('Unable to read preferences from localStorage', error);
    return defaultPreferences;
  }
};

export const loadAudioPreference = (): boolean => readPreferences().audioMuted;

export const persistAudioPreference = (audioMuted: boolean): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const payload: Preferences = { audioMuted };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to persist preferences to localStorage', error);
  }
};

export default { loadAudioPreference, persistAudioPreference };
