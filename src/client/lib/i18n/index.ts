import { register, init, getLocaleFromNavigator, locale, waitLocale } from 'svelte-i18n';

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'ro'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  ro: 'Romana',
};

// Register locales with dynamic imports
register('en', () => import('./locales/en.json'));
register('ro', () => import('./locales/ro.json'));

// Storage key for localStorage
const LOCALE_STORAGE_KEY = 'homelab-locale';

/**
 * Get the initial locale based on:
 * 1. localStorage (for guests or before user prefs load)
 * 2. Browser language detection
 * 3. Fallback to English
 */
export function getInitialLocale(): SupportedLocale {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      return stored as SupportedLocale;
    }
  }

  // Try browser detection
  const browserLocale = getLocaleFromNavigator();
  if (browserLocale) {
    // Extract language code (e.g., 'en-US' -> 'en')
    const langCode = browserLocale.split('-')[0]?.toLowerCase() || '';
    if (langCode && SUPPORTED_LOCALES.includes(langCode as SupportedLocale)) {
      return langCode as SupportedLocale;
    }
  }

  // Default to English
  return 'en';
}

/**
 * Save locale to localStorage
 */
export function saveLocaleToStorage(loc: SupportedLocale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, loc);
  }
}

/**
 * Set the current locale
 */
export function setLocale(loc: SupportedLocale): void {
  locale.set(loc);
  saveLocaleToStorage(loc);
}

/**
 * Initialize i18n with the detected or stored locale
 */
export async function initI18n(initialLocale?: SupportedLocale): Promise<void> {
  const loc = initialLocale || getInitialLocale();

  init({
    fallbackLocale: 'en',
    initialLocale: loc,
  });

  // Wait for the locale to be loaded
  await waitLocale();
}

// Re-export commonly used items from svelte-i18n
export { locale, t, date, number, time } from 'svelte-i18n';
