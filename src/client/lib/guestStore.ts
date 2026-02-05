import { writable, get } from 'svelte/store';

// Guest mode storage key
const GUEST_MODE_KEY = '__homelabInventoryGuestMode';

// Guest mode state
export const isGuestMode = writable<boolean>(false);

// Initialize guest mode from localStorage
export function initializeGuestMode(): void {
  const stored = localStorage.getItem(GUEST_MODE_KEY);
  if (stored === 'true') {
    isGuestMode.set(true);
  }
}

// Enter guest mode
export function enterGuestMode(): void {
  localStorage.setItem(GUEST_MODE_KEY, 'true');
  isGuestMode.set(true);
}

// Exit guest mode
export function exitGuestMode(): void {
  localStorage.removeItem(GUEST_MODE_KEY);
  isGuestMode.set(false);
}

// Check if currently in guest mode
export function getIsGuestMode(): boolean {
  return get(isGuestMode);
}
