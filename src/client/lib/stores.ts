import { writable, derived, get } from 'svelte/store';
import type { DeviceWithRelations, StatsResponse } from '../../shared/types';
import { fetchDevices, fetchStats, createDevice, updateDevice, deleteDevice, type CreateDeviceData, type UpdateDeviceData } from './api';

// Devices store
export const devices = writable<DeviceWithRelations[]>([]);
export const loading = writable(true);
export const error = writable<string | null>(null);

// Stats store
export const stats = writable<StatsResponse | null>(null);

// Filter stores
export const searchQuery = writable('');
export const typeFilter = writable<string | null>(null);

// Selected device for detail view
export const selectedDevice = writable<DeviceWithRelations | null>(null);

// Current view
export const currentView = writable<'dashboard' | 'devices' | 'topology'>('dashboard');

// Filtered devices
export const filteredDevices = derived(
  [devices, searchQuery, typeFilter],
  ([$devices, $search, $type]) => {
    let result = $devices;

    if ($type) {
      result = result.filter(d => d.type === $type);
    }

    if ($search) {
      const query = $search.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.model.toLowerCase().includes(query) ||
        d.specifications?.cpu?.model?.toLowerCase().includes(query)
      );
    }

    return result;
  }
);

// Load initial data
export async function loadData() {
  loading.set(true);
  error.set(null);

  try {
    const [devicesData, statsData] = await Promise.all([
      fetchDevices(),
      fetchStats(),
    ]);

    devices.set(devicesData.devices);
    stats.set(statsData);
  } catch (e) {
    error.set(e instanceof Error ? e.message : 'Failed to load data');
  } finally {
    loading.set(false);
  }
}

// Form state stores
export const deviceFormOpen = writable(false);
export const editingDevice = writable<DeviceWithRelations | null>(null);
export const formSaving = writable(false);
export const formError = writable<string | null>(null);

// Delete confirmation stores
export const deleteConfirmDevice = writable<DeviceWithRelations | null>(null);
export const deleting = writable(false);

// Form helpers
export function openCreateForm() {
  editingDevice.set(null);
  formError.set(null);
  deviceFormOpen.set(true);
}

export function openEditForm(device: DeviceWithRelations) {
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
export function openDeleteConfirm(device: DeviceWithRelations) {
  deleteConfirmDevice.set(device);
}

export function closeDeleteConfirm() {
  deleteConfirmDevice.set(null);
}

// CRUD operations
export async function saveDevice(data: CreateDeviceData | UpdateDeviceData): Promise<boolean> {
  formSaving.set(true);
  formError.set(null);

  try {
    const editing = get(editingDevice);

    if (editing) {
      // Update existing device
      const result = await updateDevice(editing.id, data as UpdateDeviceData);
      // Update device in list
      devices.update(list =>
        list.map(d => d.id === editing.id ? result.device : d)
      );
      // Update selected device if viewing it
      selectedDevice.update(s => s?.id === editing.id ? result.device : s);
    } else {
      // Create new device
      const result = await createDevice(data as CreateDeviceData);
      // Add to list
      devices.update(list => [...list, result.device]);
    }

    // Refresh stats
    const statsData = await fetchStats();
    stats.set(statsData);

    closeForm();
    return true;
  } catch (e) {
    formError.set(e instanceof Error ? e.message : 'Failed to save device');
    return false;
  } finally {
    formSaving.set(false);
  }
}

export async function removeDevice(): Promise<boolean> {
  const device = get(deleteConfirmDevice);
  if (!device) return false;

  deleting.set(true);

  try {
    await deleteDevice(device.id);

    // Remove from list
    devices.update(list => list.filter(d => d.id !== device.id));

    // Clear selected if deleted
    selectedDevice.update(s => s?.id === device.id ? null : s);

    // Refresh stats
    const statsData = await fetchStats();
    stats.set(statsData);

    closeDeleteConfirm();
    return true;
  } catch (e) {
    // Could add error handling here
    return false;
  } finally {
    deleting.set(false);
  }
}
