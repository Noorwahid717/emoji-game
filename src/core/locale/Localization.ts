import { TRANSLATIONS, type LocaleKey } from './translations';

export const SUPPORTED_LOCALES: readonly LocaleKey[] = ['en', 'id'];

const FALLBACK_LOCALE: LocaleKey = 'en';

let currentLocale: LocaleKey = FALLBACK_LOCALE;

const localeListeners: Set<(locale: LocaleKey) => void> = new Set();

const normaliseLocale = (locale: string): LocaleKey => {
  const match = SUPPORTED_LOCALES.find(
    (value) => value.toLowerCase() === locale.toLowerCase() || locale.startsWith(`${value}-`),
  );
  return match ?? FALLBACK_LOCALE;
};

export const detectLocale = (): LocaleKey => {
  if (typeof navigator === 'undefined') {
    return FALLBACK_LOCALE;
  }

  if (navigator.language) {
    return normaliseLocale(navigator.language);
  }

  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return normaliseLocale(navigator.languages[0]);
  }

  return FALLBACK_LOCALE;
};

export const setLocale = (locale: string): LocaleKey => {
  const next = normaliseLocale(locale);
  if (next === currentLocale) {
    return currentLocale;
  }

  currentLocale = next;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = currentLocale;
  }

  localeListeners.forEach((listener) => listener(currentLocale));
  return currentLocale;
};

export const getLocale = (): LocaleKey => currentLocale;

export const onLocaleChange = (listener: (locale: LocaleKey) => void): () => void => {
  localeListeners.add(listener);
  return () => localeListeners.delete(listener);
};

const interpolate = (template: string, params?: Record<string, string | number>): string => {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_, token: string) => {
    const key = token.trim();
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key]);
    }
    return `{{${key}}}`;
  });
};

export const t = (key: string, params?: Record<string, string | number>): string => {
  const map = TRANSLATIONS[currentLocale] ?? TRANSLATIONS[FALLBACK_LOCALE];
  const fallbackMap = TRANSLATIONS[FALLBACK_LOCALE];

  const template = map[key] ?? fallbackMap[key] ?? key;
  return interpolate(template, params);
};

export const getLocaleName = (locale: LocaleKey): string =>
  TRANSLATIONS[currentLocale]?.[`locale.name.${locale}`] ?? TRANSLATIONS.en[`locale.name.${locale}`];

export const cycleLocale = (): LocaleKey => {
  const index = SUPPORTED_LOCALES.indexOf(currentLocale);
  const next = SUPPORTED_LOCALES[(index + 1) % SUPPORTED_LOCALES.length];
  return setLocale(next);
};

export const initLocale = (locale: string): LocaleKey => {
  currentLocale = normaliseLocale(locale);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = currentLocale;
  }
  return currentLocale;
};

export default {
  detectLocale,
  setLocale,
  getLocale,
  onLocaleChange,
  t,
  getLocaleName,
  cycleLocale,
  initLocale,
};
