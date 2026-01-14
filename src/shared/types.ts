// Device types
export type DeviceType = 'Server' | 'Desktop' | 'Laptop' | 'Component' | 'IoT' | 'Network';
export type StorageType = 'NVMe' | 'NVMe SSD' | 'SSD' | 'HDD' | 'RAID' | 'RAID Array';
export type RAMType = 'DDR3' | 'DDR4' | 'DDR5' | 'Unified Memory' | 'LPDDR4' | 'LPDDR5';
export type PCIeStatus = 'Available' | 'Occupied';
export type ConnectionType = 'ethernet' | 'wifi' | 'thunderbolt' | 'usb';

// CPU specification
export interface CPU {
  model: string;
  cores?: number;
  threads?: number;
  socket?: string;
  tdp_watts?: number;
  video_codecs?: string;
}

// RAM specification
export interface RAM {
  current: string;
  max_supported: string;
  type: RAMType;
  slots_total?: number;
  slots_used?: number;
}

// Motherboard specification
export interface Motherboard {
  model: string;
  chipset?: string;
  form_factor?: string;
  sata_ports?: number;
  nvme_slots?: number;
}

// GPU specification
export interface GPU {
  id?: number;
  model: string;
  vram?: string;
}

// Storage drive
export interface StorageDrive {
  id?: number;
  type: StorageType | string;
  capacity: string;
  capacity_bytes?: number;
  device?: string;
  mount_point?: string;
  details?: string;
}

// PCIe slot
export interface PCIeSlot {
  id?: number;
  description: string;
  generation?: number;
  lanes?: number;
  status: PCIeStatus;
  current_card?: string;
}

// Hardware specifications
export interface Specifications {
  cpu?: CPU;
  ram?: RAM;
  motherboard?: Motherboard;
  gpu?: GPU[];
  storage?: StorageDrive[];
}

// Upgrade analysis
export interface UpgradeAnalysis {
  cpu_max?: string;
  ram_max_practical?: string;
  notes?: string;
}

// Network info for device discovery
export interface NetworkInfo {
  mac_address?: string;
  ip_address?: string;
  hostname?: string;
  last_seen?: string;
  open_ports?: number[];
}

// Network connection between devices
export interface NetworkConnection {
  id?: number;
  from_device_id: number;
  to_device_id: number;
  connection_type: ConnectionType;
  port?: string;
  speed?: string;
}

// Expansion info
export interface Expansion {
  pcie_slots?: (string | PCIeSlot)[];
}

// Main device interface
export interface Device {
  id?: number;
  type: DeviceType;
  name: string;
  model: string;
  quantity: number;
  acquired_date?: string;
  location?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  specifications?: Specifications;
  upgrade_analysis?: UpgradeAnalysis;
  expansion?: Expansion;
  network_info?: NetworkInfo;
}

// Full device with all relations loaded
export interface DeviceWithRelations extends Device {
  gpus: GPU[];
  storage: StorageDrive[];
  pcie_slots: PCIeSlot[];
}

// YAML import format (matches hardware_inventory.yaml)
export interface YAMLDevice {
  type: DeviceType;
  name: string;
  model: string;
  quantity?: number;
  specifications?: {
    cpu?: CPU;
    ram?: {
      current: string;
      max_supported: string;
      type: string;
    };
    motherboard?: Motherboard;
    gpu?: GPU[];
    storage?: Array<{
      type: string;
      capacity: string;
      device?: string;
      mount_point?: string;
      details?: string;
    }>;
  };
  upgrade_analysis?: {
    cpu_max?: string;
    notes?: string;
  };
  expansion?: {
    pcie_slots?: string[];
  };
}

export interface YAMLInventory {
  hardware: YAMLDevice[];
}

// API response types
export interface DeviceListResponse {
  devices: DeviceWithRelations[];
  total: number;
}

export interface StatsResponse {
  total_devices: number;
  devices_by_type: Record<DeviceType, number>;
  total_storage_bytes: number;
  total_storage_formatted: string;
  total_ram_current: string;
  total_ram_potential: string;
  upgradeable_devices: number;
}

export interface TopologyNode {
  id: number;
  name: string;
  type: DeviceType;
  ip?: string;
  hostname?: string;
}

export interface TopologyEdge {
  source: number;
  target: number;
  type: ConnectionType;
  speed?: string;
}

export interface TopologyResponse {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

// Utility: parse capacity string to bytes
export function parseCapacityToBytes(capacity: string): number {
  const match = capacity.match(/^([\d.]+)\s*(T|TB|G|GB|M|MB|K|KB)?$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'GB').toUpperCase();

  const multipliers: Record<string, number> = {
    'K': 1024,
    'KB': 1024,
    'M': 1024 ** 2,
    'MB': 1024 ** 2,
    'G': 1024 ** 3,
    'GB': 1024 ** 3,
    'T': 1024 ** 4,
    'TB': 1024 ** 4,
  };

  return Math.round(value * (multipliers[unit] || 1024 ** 3));
}

// Utility: format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);

  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}
