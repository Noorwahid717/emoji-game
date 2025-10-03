const STORAGE_KEY = 'emoji-game::preferences';

type Preferences = {
  audioMuted: boolean;
  colorBlindMode: boolean;
  locale: string;
};

const defaultPreferences: Preferences = {
  audioMuted: false,
  colorBlindMode: false,
  locale: 'auto',
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
      colorBlindMode: Boolean(parsed.colorBlindMode),
      locale: typeof parsed.locale === 'string' ? parsed.locale : defaultPreferences.locale,
    };
  } catch (error) {
    console.warn('Unable to read preferences from localStorage', error);
    return defaultPreferences;
  }
};

export const loadAudioPreference = (): boolean => readPreferences().audioMuted;

export const loadColorBlindPreference = (): boolean => readPreferences().colorBlindMode;

export const loadLocalePreference = (): string => readPreferences().locale;

export const persistAudioPreference = (audioMuted: boolean): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const current = readPreferences();
    const payload: Preferences = { ...current, audioMuted };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to persist preferences to localStorage', error);
  }
};

export const persistColorBlindPreference = (colorBlindMode: boolean): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const current = readPreferences();
    const payload: Preferences = { ...current, colorBlindMode };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to persist preferences to localStorage', error);
  }
};

export const persistLocalePreference = (locale: string): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const current = readPreferences();
    const payload: Preferences = { ...current, locale };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to persist preferences to localStorage', error);
  }
};

export default {
  loadAudioPreference,
  loadColorBlindPreference,
  loadLocalePreference,
  persistAudioPreference,
  persistColorBlindPreference,
  persistLocalePreference,
};
