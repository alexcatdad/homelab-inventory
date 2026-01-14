import { writable, derived, get } from 'svelte/store';
import { locale, setLocale, saveLocaleToStorage, getInitialLocale, type SupportedLocale, SUPPORTED_LOCALES } from './index';

// Store for tracking if user is authenticated
export const isAuthenticated = writable<boolean>(false);

// Store for the user's language preference from Convex
const convexLanguage = writable<SupportedLocale | null>(null);

// Flag to prevent loops when syncing
let isSyncing = false;

/**
 * Initialize language from Convex for authenticated users
 * Should be called when auth state changes
 */
export async function syncLanguageFromConvex(
  client: any,
  authenticated: boolean
): Promise<void> {
  isAuthenticated.set(authenticated);

  if (!authenticated) {
    convexLanguage.set(null);
    return;
  }

  try {
    isSyncing = true;
    // Dynamic import to avoid issues with codegen
    const { api } = await import('../../../../convex/_generated/api');
    const lang = await client.query(api.userPreferences.getLanguage, {});

    if (lang && SUPPORTED_LOCALES.includes(lang as SupportedLocale)) {
      convexLanguage.set(lang as SupportedLocale);
      // Update the locale if different from current
      setLocale(lang as SupportedLocale);
    } else {
      // User has no preference stored, use current locale
      const currentLocale = getInitialLocale();
      // Save to Convex
      await client.mutation(api.userPreferences.setLanguage, { language: currentLocale });
      convexLanguage.set(currentLocale);
    }
  } catch (error) {
    console.error('Failed to sync language from Convex:', error);
  } finally {
    isSyncing = false;
  }
}

/**
 * Change language and persist to Convex (if authenticated) or localStorage
 */
export async function changeLanguage(
  newLocale: SupportedLocale,
  client?: any
): Promise<void> {
  if (isSyncing) return;

  // Update svelte-i18n locale
  setLocale(newLocale);

  // If authenticated and client provided, save to Convex
  if (get(isAuthenticated) && client) {
    try {
      // Dynamic import to avoid issues with codegen
      const { api } = await import('../../../../convex/_generated/api');
      await client.mutation(api.userPreferences.setLanguage, { language: newLocale });
      convexLanguage.set(newLocale);
    } catch (error) {
      console.error('Failed to save language to Convex:', error);
      // Still saved to localStorage via setLocale
    }
  }
}

/**
 * Get the current effective language
 */
export const currentLanguage = derived(
  locale,
  ($locale) => ($locale as SupportedLocale) || 'en'
);
