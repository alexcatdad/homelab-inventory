/**
 * Spec lookup state stores
 * The actual lookup logic is now in src/client/lib/specLookup/cascade.ts
 */
import { writable } from 'svelte/store';

// Store for lookup state (used by DeviceForm)
export const specLookupLoading = writable(false);
export const specLookupError = writable<string | null>(null);
