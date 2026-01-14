import { writable, derived, get } from "svelte/store";
import type { ConvexClient } from "convex/browser";
import { ConvexHttpClient } from "convex/browser";

// Storage keys (matching @convex-dev/auth)
const JWT_STORAGE_KEY = "__convexAuthJWT";
const REFRESH_TOKEN_STORAGE_KEY = "__convexAuthRefreshToken";
const VERIFIER_STORAGE_KEY = "__convexAuthOAuthVerifier";

// Get namespace from Convex URL for storage keys
function getStorageNamespace(): string {
  const url = import.meta.env.VITE_CONVEX_URL || "";
  return url.replace(/[^a-zA-Z0-9]/g, "");
}

function storageKey(key: string): string {
  return `${key}_${getStorageNamespace()}`;
}

// Auth state stores
export const isAuthenticated = writable<boolean>(false);
export const isAuthLoading = writable<boolean>(true);
export const authToken = writable<string | null>(null);
export const authInitialized = writable<boolean>(false);
export const currentUser = writable<{
  _id: string;
  name?: string;
  email?: string;
  image?: string;
} | null>(null);

// Derived store for auth status
export const authStatus = derived(
  [isAuthenticated, isAuthLoading],
  ([$isAuthenticated, $isAuthLoading]) => ({
    isAuthenticated: $isAuthenticated,
    isLoading: $isAuthLoading,
  })
);

// Store the verifier before OAuth redirect
export function storeVerifier(verifier: string): void {
  localStorage.setItem(storageKey(VERIFIER_STORAGE_KEY), verifier);
}

// Get and clear the verifier after OAuth callback
export function getAndClearVerifier(): string | null {
  const key = storageKey(VERIFIER_STORAGE_KEY);
  const verifier = localStorage.getItem(key);
  localStorage.removeItem(key);
  return verifier;
}

// Store tokens after successful auth
export function storeTokens(token: string, refreshToken?: string): void {
  localStorage.setItem(storageKey(JWT_STORAGE_KEY), token);
  if (refreshToken) {
    localStorage.setItem(storageKey(REFRESH_TOKEN_STORAGE_KEY), refreshToken);
  }
  authToken.set(token);
  isAuthenticated.set(true);
}

// Clear tokens on sign out
export function clearTokens(): void {
  localStorage.removeItem(storageKey(JWT_STORAGE_KEY));
  localStorage.removeItem(storageKey(REFRESH_TOKEN_STORAGE_KEY));
  localStorage.removeItem(storageKey(VERIFIER_STORAGE_KEY));
  authToken.set(null);
  isAuthenticated.set(false);
  currentUser.set(null);
}

// Get stored token
export function getStoredToken(): string | null {
  return localStorage.getItem(storageKey(JWT_STORAGE_KEY));
}

// Get stored refresh token
export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(storageKey(REFRESH_TOKEN_STORAGE_KEY));
}

// Handle OAuth callback - exchange code for tokens
async function handleOAuthCallback(): Promise<boolean> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (!code) return false;

  // Remove code from URL immediately
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);

  // Get the stored verifier
  const verifier = getAndClearVerifier();

  try {
    console.log("[Auth] Exchanging OAuth code, verifier:", verifier ? "present" : "missing");

    const httpClient = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL!);
    const result = await httpClient.action("auth:signIn" as any, {
      params: { code },
      verifier: verifier ?? undefined,
    });

    console.log("[Auth] SignIn result:", result);

    if (result.tokens) {
      storeTokens(result.tokens.token, result.tokens.refreshToken);
      return true;
    }
    console.warn("[Auth] No tokens in signIn result");
  } catch (e) {
    console.error("[Auth] Failed to exchange OAuth code:", e);
  }
  return false;
}

// Refresh auth token using refresh token
async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    console.log("[Auth] No refresh token available");
    return null;
  }

  try {
    const httpClient = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL!);
    const result = await httpClient.action("auth:signIn" as any, {
      refreshToken,
    });
    console.log("[Auth] Refresh result:", result);
    if (result.tokens) {
      storeTokens(result.tokens.token, result.tokens.refreshToken);
      return result.tokens.token;
    }
    console.warn("[Auth] Refresh response had no tokens");
  } catch (e) {
    console.error("[Auth] Failed to refresh token:", e);
  }
  // Clear stale tokens if refresh failed
  clearTokens();
  return null;
}

// Initialize auth - check for OAuth code or stored tokens
export async function initializeAuth(client: ConvexClient): Promise<void> {
  isAuthLoading.set(true);
  authInitialized.set(false);

  // Handle OAuth callback if present (returns code in URL)
  const gotNewTokens = await handleOAuthCallback();
  if (gotNewTokens) {
    // Reload to start fresh with new tokens - this ensures clean state
    window.location.reload();
    return;
  }

  // Restore any stored token to the store
  const storedToken = getStoredToken();
  if (storedToken) {
    authToken.set(storedToken);
    console.log("[Auth] Restored token from storage");
  }

  // Set up the auth function for the Convex client
  client.setAuth(
    async ({ forceRefreshToken }) => {
      let token = get(authToken);

      // If forced refresh or no token but have refresh token, try refresh
      if (forceRefreshToken || (!token && getStoredRefreshToken())) {
        console.log("[Auth] Refreshing token...");
        token = await refreshAuthToken();
      }

      return token;
    },
    // onChange callback - called when Convex confirms auth state
    (isAuthed) => {
      console.log("[Auth] Convex auth state confirmed:", isAuthed);
      isAuthenticated.set(isAuthed);
      isAuthLoading.set(false);
      authInitialized.set(true);
    }
  );
}

// Sign out - clear tokens and notify server
export async function signOut(client: ConvexClient): Promise<void> {
  try {
    await client.action("auth:signOut" as any, {});
  } catch (e) {
    console.error("[Auth] Error signing out:", e);
  }
  clearTokens();
  window.location.reload();
}
