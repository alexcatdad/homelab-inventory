import type { DeviceWithRelations, StatsResponse, TopologyResponse } from '../../shared/types';

const API_BASE = '/api';

export async function fetchDevices(options?: {
  type?: string;
  search?: string;
}): Promise<{ devices: DeviceWithRelations[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.type) params.set('type', options.type);
  if (options?.search) params.set('q', options.search);

  const url = `${API_BASE}/devices${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchDevice(id: number): Promise<DeviceWithRelations> {
  const res = await fetch(`${API_BASE}/devices/${id}`);
  return res.json();
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

export async function fetchTopology(): Promise<TopologyResponse> {
  const res = await fetch(`${API_BASE}/topology`);
  return res.json();
}

export interface SpecsData {
  cpu?: {
    model?: string;
    cores?: number;
    threads?: number;
    socket?: string;
    tdp_watts?: number;
  };
  ram?: {
    current?: string;
    max_supported?: string;
    type?: string;
  };
  motherboard?: {
    model?: string;
    chipset?: string;
    form_factor?: string;
  };
}

export interface CreateDeviceData {
  type: string;
  name: string;
  model?: string;
  quantity?: number;
  location?: string;
  notes?: string;
  specifications?: SpecsData;
}

export interface UpdateDeviceData {
  type?: string;
  name?: string;
  model?: string;
  quantity?: number;
  location?: string;
  notes?: string;
  specifications?: SpecsData;
}

export async function createDevice(data: CreateDeviceData): Promise<{ device: DeviceWithRelations }> {
  const res = await fetch(`${API_BASE}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create device');
  }
  return res.json();
}

export async function updateDevice(id: number, data: UpdateDeviceData): Promise<{ device: DeviceWithRelations }> {
  const res = await fetch(`${API_BASE}/devices/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update device');
  }
  return res.json();
}

export async function deleteDevice(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/devices/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete device');
  }
  return res.json();
}
