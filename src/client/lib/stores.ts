import { writable, get } from 'svelte/store';
import type { Doc, Id } from '../../../convex/_generated/dataModel';

// Type alias for device from Convex
export type Device = Doc<"devices">;
export type DeviceId = Id<"devices">;

// Filter stores
export const searchQuery = writable('');
export const typeFilter = writable<string | null>(null);

// Selected device for detail view
export const selectedDevice = writable<Device | null>(null);

// Current view
export const currentView = writable<'dashboard' | 'devices' | 'topology' | 'settings'>('dashboard');

// Form state stores
export const deviceFormOpen = writable(false);
export const editingDevice = writable<Device | null>(null);
export const formSaving = writable(false);
export const formError = writable<string | null>(null);

// Delete confirmation stores
export const deleteConfirmDevice = writable<Device | null>(null);
export const deleting = writable(false);

// Form helpers
export function openCreateForm() {
  editingDevice.set(null);
  formError.set(null);
  deviceFormOpen.set(true);
}

export function openEditForm(device: Device) {
  editingDevice.set(device);
  formError.set(null);
  deviceFormOpen.set(true);
}

export function closeForm() {
  deviceFormOpen.set(false);
  editingDevice.set(null);
  formError.set(null);
}

// Delete confirmation helpers
export function openDeleteConfirm(device: Device) {
  deleteConfirmDevice.set(device);
}

export function closeDeleteConfirm() {
  deleteConfirmDevice.set(null);
}

// Clear selected device if it matches the given ID
export function clearSelectedIfMatch(id: DeviceId) {
  selectedDevice.update(s => s?._id === id ? null : s);
}
