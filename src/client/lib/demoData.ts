// Demo data for guest mode - realistic homelab inventory
// These match the structure returned by Convex queries

import type { DeviceType, ConnectionType } from '../../../shared/types';

// Type for demo device (mimics Convex document structure)
export interface DemoDevice {
  _id: string;
  _creationTime: number;
  type: DeviceType;
  name: string;
  model?: string;
  quantity: number;
  location?: string;
  notes?: string;
  specifications?: {
    cpu?: {
      model: string;
      cores?: number;
      threads?: number;
      tdp_watts?: number;
    };
    ram?: {
      type: 'DDR3' | 'DDR4' | 'DDR5' | 'Unified Memory' | 'LPDDR4' | 'LPDDR5';
      current: string;
      max_supported: string;
      slots_total?: number;
      slots_used?: number;
    };
    motherboard?: {
      model: string;
      chipset?: string;
      form_factor?: string;
    };
  };
  gpus?: Array<{ model: string; vram?: string }>;
  storage?: Array<{
    type: string;
    capacity: string;
    details?: string;
  }>;
  network_info?: {
    ip_address?: string;
    mac_address?: string;
  };
}

export interface DemoConnection {
  _id: string;
  _creationTime: number;
  from_device_id: string;
  to_device_id: string;
  connection_type: ConnectionType;
  speed?: string;
}

export interface DemoStats {
  total_devices: number;
  devices_by_type: Record<string, number>;
  total_storage_bytes: number;
  total_storage_formatted: string;
  total_ram_current: string;
  total_ram_potential: string;
  upgradeable_devices: number;
}

// Generate consistent fake IDs
const makeId = (prefix: string, num: number) => `demo_${prefix}_${num}`;

// Demo devices - a realistic enthusiast homelab setup
export const demoDevices: DemoDevice[] = [
  {
    _id: makeId('dev', 1),
    _creationTime: Date.now() - 86400000 * 30,
    type: 'Server',
    name: 'Proxmox Host',
    model: 'Custom Build',
    quantity: 1,
    location: 'Server Rack',
    notes: 'Main virtualization host running Proxmox VE',
    specifications: {
      cpu: { model: 'AMD Ryzen 9 5900X', cores: 12, threads: 24, tdp_watts: 105 },
      ram: { type: 'DDR4', current: '64GB', max_supported: '128GB', slots_total: 4, slots_used: 2 },
      motherboard: { model: 'ASUS ProArt X570-Creator', chipset: 'X570', form_factor: 'ATX' },
    },
    storage: [
      { type: 'NVMe', capacity: '1TB', details: 'Samsung 980 Pro (Boot)' },
      { type: 'NVMe', capacity: '2TB', details: 'Samsung 980 Pro (VMs)' },
    ],
    gpus: [{ model: 'NVIDIA Quadro P2000', vram: '5GB' }],
  },
  {
    _id: makeId('dev', 2),
    _creationTime: Date.now() - 86400000 * 60,
    type: 'Server',
    name: 'TrueNAS Scale',
    model: 'Dell PowerEdge R720',
    quantity: 1,
    location: 'Server Rack',
    notes: 'Network attached storage with ZFS',
    specifications: {
      cpu: { model: 'Intel Xeon E5-2670 v2', cores: 10, threads: 20, tdp_watts: 115 },
      ram: { type: 'DDR3', current: '128GB', max_supported: '384GB', slots_total: 24, slots_used: 8 },
    },
    storage: [
      { type: 'HDD', capacity: '8TB', details: 'WD Red Plus' },
      { type: 'HDD', capacity: '8TB', details: 'WD Red Plus' },
      { type: 'HDD', capacity: '8TB', details: 'WD Red Plus' },
      { type: 'HDD', capacity: '8TB', details: 'WD Red Plus' },
      { type: 'SSD', capacity: '500GB', details: 'Samsung 870 EVO (Cache)' },
      { type: 'SSD', capacity: '500GB', details: 'Samsung 870 EVO (Cache)' },
    ],
  },
  {
    _id: makeId('dev', 3),
    _creationTime: Date.now() - 86400000 * 45,
    type: 'Network',
    name: 'Main Switch',
    model: 'UniFi Switch 24 PoE',
    quantity: 1,
    location: 'Server Rack',
    notes: 'Core network switch with PoE for cameras and APs',
    network_info: { ip_address: '192.168.1.2', mac_address: '00:1A:2B:3C:4D:5E' },
  },
  {
    _id: makeId('dev', 4),
    _creationTime: Date.now() - 86400000 * 90,
    type: 'Network',
    name: 'OPNsense Firewall',
    model: 'Protectli Vault FW4B',
    quantity: 1,
    location: 'Server Rack',
    notes: 'Main router/firewall running OPNsense',
    specifications: {
      cpu: { model: 'Intel Celeron J3160', cores: 4, threads: 4, tdp_watts: 6 },
      ram: { type: 'DDR3', current: '8GB', max_supported: '8GB' },
    },
    storage: [{ type: 'SSD', capacity: '120GB', details: 'mSATA' }],
    network_info: { ip_address: '192.168.1.1' },
  },
  {
    _id: makeId('dev', 5),
    _creationTime: Date.now() - 86400000 * 20,
    type: 'IoT',
    name: 'Pi Cluster Node 1',
    model: 'Raspberry Pi 4B 8GB',
    quantity: 1,
    location: 'Desk',
    notes: 'K3s worker node',
    specifications: {
      cpu: { model: 'BCM2711', cores: 4, threads: 4, tdp_watts: 15 },
      ram: { type: 'LPDDR4', current: '8GB', max_supported: '8GB' },
    },
    storage: [{ type: 'SSD', capacity: '256GB', details: 'Samsung T7' }],
    network_info: { ip_address: '192.168.1.101' },
  },
  {
    _id: makeId('dev', 6),
    _creationTime: Date.now() - 86400000 * 20,
    type: 'IoT',
    name: 'Pi Cluster Node 2',
    model: 'Raspberry Pi 4B 8GB',
    quantity: 1,
    location: 'Desk',
    notes: 'K3s worker node',
    specifications: {
      cpu: { model: 'BCM2711', cores: 4, threads: 4, tdp_watts: 15 },
      ram: { type: 'LPDDR4', current: '8GB', max_supported: '8GB' },
    },
    storage: [{ type: 'SSD', capacity: '256GB', details: 'Samsung T7' }],
    network_info: { ip_address: '192.168.1.102' },
  },
  {
    _id: makeId('dev', 7),
    _creationTime: Date.now() - 86400000 * 20,
    type: 'IoT',
    name: 'Pi Cluster Node 3',
    model: 'Raspberry Pi 4B 8GB',
    quantity: 1,
    location: 'Desk',
    notes: 'K3s control plane',
    specifications: {
      cpu: { model: 'BCM2711', cores: 4, threads: 4, tdp_watts: 15 },
      ram: { type: 'LPDDR4', current: '8GB', max_supported: '8GB' },
    },
    storage: [{ type: 'SSD', capacity: '256GB', details: 'Samsung T7' }],
    network_info: { ip_address: '192.168.1.100' },
  },
  {
    _id: makeId('dev', 8),
    _creationTime: Date.now() - 86400000 * 15,
    type: 'IoT',
    name: 'Home Assistant',
    model: 'Intel NUC8i3BEH',
    quantity: 1,
    location: 'Living Room',
    notes: 'Smart home hub with Zigbee/Z-Wave',
    specifications: {
      cpu: { model: 'Intel Core i3-8109U', cores: 2, threads: 4, tdp_watts: 28 },
      ram: { type: 'DDR4', current: '16GB', max_supported: '32GB', slots_total: 2, slots_used: 1 },
    },
    storage: [{ type: 'NVMe', capacity: '256GB', details: 'Samsung 970 EVO' }],
    network_info: { ip_address: '192.168.1.50' },
  },
  {
    _id: makeId('dev', 9),
    _creationTime: Date.now() - 86400000 * 100,
    type: 'Desktop',
    name: 'Workstation',
    model: 'Custom Build',
    quantity: 1,
    location: 'Office',
    notes: 'Primary development machine',
    specifications: {
      cpu: { model: 'AMD Ryzen 7 5800X3D', cores: 8, threads: 16, tdp_watts: 105 },
      ram: { type: 'DDR4', current: '32GB', max_supported: '128GB', slots_total: 4, slots_used: 2 },
      motherboard: { model: 'MSI MAG B550 TOMAHAWK', chipset: 'B550', form_factor: 'ATX' },
    },
    storage: [
      { type: 'NVMe', capacity: '2TB', details: 'Samsung 980 Pro' },
      { type: 'SSD', capacity: '1TB', details: 'Samsung 870 EVO' },
    ],
    gpus: [{ model: 'NVIDIA RTX 3080', vram: '10GB' }],
  },
  {
    _id: makeId('dev', 10),
    _creationTime: Date.now() - 86400000 * 180,
    type: 'Laptop',
    name: 'MacBook Pro',
    model: 'MacBook Pro 14" (2023)',
    quantity: 1,
    location: 'Office',
    notes: 'Portable development machine',
    specifications: {
      cpu: { model: 'Apple M3 Pro', cores: 12, threads: 12, tdp_watts: 30 },
      ram: { type: 'Unified Memory', current: '18GB', max_supported: '18GB' },
    },
    storage: [{ type: 'NVMe', capacity: '512GB', details: 'Apple SSD' }],
  },
  {
    _id: makeId('dev', 11),
    _creationTime: Date.now() - 86400000 * 5,
    type: 'Network',
    name: 'WiFi AP - Living Room',
    model: 'UniFi U6 Pro',
    quantity: 1,
    location: 'Living Room',
    notes: 'WiFi 6 access point',
    network_info: { ip_address: '192.168.1.10', mac_address: 'AA:BB:CC:DD:EE:01' },
  },
  {
    _id: makeId('dev', 12),
    _creationTime: Date.now() - 86400000 * 5,
    type: 'Network',
    name: 'WiFi AP - Office',
    model: 'UniFi U6 Pro',
    quantity: 1,
    location: 'Office',
    notes: 'WiFi 6 access point',
    network_info: { ip_address: '192.168.1.11', mac_address: 'AA:BB:CC:DD:EE:02' },
  },
];

// Demo network connections
export const demoConnections: DemoConnection[] = [
  { _id: makeId('conn', 1), _creationTime: Date.now(), from_device_id: makeId('dev', 1), to_device_id: makeId('dev', 3), connection_type: 'ethernet', speed: '10Gbps' },
  { _id: makeId('conn', 2), _creationTime: Date.now(), from_device_id: makeId('dev', 2), to_device_id: makeId('dev', 3), connection_type: 'ethernet', speed: '10Gbps' },
  { _id: makeId('conn', 3), _creationTime: Date.now(), from_device_id: makeId('dev', 4), to_device_id: makeId('dev', 3), connection_type: 'ethernet', speed: '1Gbps' },
  { _id: makeId('conn', 4), _creationTime: Date.now(), from_device_id: makeId('dev', 5), to_device_id: makeId('dev', 3), connection_type: 'ethernet', speed: '1Gbps' },
  { _id: makeId('conn', 5), _creationTime: Date.now(), from_device_id: makeId('dev', 6), to_device_id: makeId('dev', 3), connection_type: 'ethernet', speed: '1Gbps' },
  { _id: makeId('conn', 6), _creationTime: Date.now(), from_device_id: makeId('dev', 7), to_device_id: makeId('dev', 3), connection_type: 'ethernet', speed: '1Gbps' },
  { _id: makeId('conn', 7), _creationTime: Date.now(), from_device_id: makeId('dev', 8), to_device_id: makeId('dev', 3), connection_type: 'ethernet', speed: '1Gbps' },
  { _id: makeId('conn', 8), _creationTime: Date.now(), from_device_id: makeId('dev', 9), to_device_id: makeId('dev', 3), connection_type: 'ethernet', speed: '2.5Gbps' },
  { _id: makeId('conn', 9), _creationTime: Date.now(), from_device_id: makeId('dev', 11), to_device_id: makeId('dev', 3), connection_type: 'ethernet', speed: '1Gbps' },
  { _id: makeId('conn', 10), _creationTime: Date.now(), from_device_id: makeId('dev', 12), to_device_id: makeId('dev', 3), connection_type: 'ethernet', speed: '1Gbps' },
  { _id: makeId('conn', 11), _creationTime: Date.now(), from_device_id: makeId('dev', 10), to_device_id: makeId('dev', 11), connection_type: 'wifi', speed: 'WiFi 6' },
];

// Calculate demo stats from the demo devices
function calculateDemoStats(): DemoStats {
  const devices_by_type: Record<string, number> = {};
  let total_storage_bytes = 0;
  let total_ram_current_gb = 0;
  let total_ram_potential_gb = 0;
  let upgradeable_devices = 0;

  for (const device of demoDevices) {
    // Count by type
    devices_by_type[device.type] = (devices_by_type[device.type] || 0) + 1;

    // Sum storage
    if (device.storage) {
      for (const drive of device.storage) {
        const match = drive.capacity.match(/(\d+)(TB|GB|MB)/i);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2].toUpperCase();
          if (unit === 'TB') total_storage_bytes += value * 1024 * 1024 * 1024 * 1024;
          else if (unit === 'GB') total_storage_bytes += value * 1024 * 1024 * 1024;
          else if (unit === 'MB') total_storage_bytes += value * 1024 * 1024;
        }
      }
    }

    // Sum RAM
    if (device.specifications?.ram) {
      const current = parseInt(device.specifications.ram.current) || 0;
      const max = parseInt(device.specifications.ram.max_supported) || current;
      total_ram_current_gb += current;
      total_ram_potential_gb += max;
      if (max > current) {
        upgradeable_devices++;
      }
    }
  }

  // Format storage
  let total_storage_formatted: string;
  if (total_storage_bytes >= 1024 * 1024 * 1024 * 1024) {
    total_storage_formatted = `${(total_storage_bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB`;
  } else {
    total_storage_formatted = `${(total_storage_bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  }

  return {
    total_devices: demoDevices.length,
    devices_by_type,
    total_storage_bytes,
    total_storage_formatted,
    total_ram_current: `${total_ram_current_gb}GB`,
    total_ram_potential: `${total_ram_potential_gb}GB`,
    upgradeable_devices,
  };
}

export const demoStats = calculateDemoStats();

// Demo topology data for the network visualization
export interface DemoTopology {
  nodes: Array<{
    _id: string;
    id: number; // Numeric ID for TopologyGraph
    name: string;
    type: DeviceType;
    ip?: string;
  }>;
  edges: Array<{
    _id: string;
    from_device_id: string;
    to_device_id: string;
    source: number; // Numeric source for TopologyGraph
    target: number; // Numeric target for TopologyGraph
    connection_type: ConnectionType;
    type: ConnectionType; // Alias for TopologyGraph
    speed?: string;
  }>;
}

export function getDemoTopology(): DemoTopology {
  // Create a map from device _id to numeric index for edge lookups
  const idToIndex = new Map<string, number>();
  demoDevices.forEach((device, index) => {
    idToIndex.set(device._id, index);
  });

  const nodes = demoDevices.map((device, index) => ({
    _id: device._id,
    id: index, // Numeric ID for TopologyGraph
    name: device.name,
    type: device.type,
    ip: device.network_info?.ip_address,
  }));

  const edges = demoConnections
    .map(conn => {
      const sourceIndex = idToIndex.get(conn.from_device_id);
      const targetIndex = idToIndex.get(conn.to_device_id);

      // Only include edges where both devices exist
      if (sourceIndex === undefined || targetIndex === undefined) {
        return null;
      }

      return {
        _id: conn._id,
        from_device_id: conn.from_device_id,
        to_device_id: conn.to_device_id,
        source: sourceIndex, // Numeric source for TopologyGraph
        target: targetIndex, // Numeric target for TopologyGraph
        connection_type: conn.connection_type,
        type: conn.connection_type, // Alias for TopologyGraph
        speed: conn.speed,
      };
    })
    .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

  return { nodes, edges };
}

// Helper to filter demo devices (matches Convex query behavior)
export function filterDemoDevices(options?: { type?: string; search?: string }): DemoDevice[] {
  let filtered = demoDevices;

  if (options?.type) {
    filtered = filtered.filter(d => d.type === options.type);
  }

  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(searchLower) ||
      d.model?.toLowerCase().includes(searchLower) ||
      d.location?.toLowerCase().includes(searchLower) ||
      d.notes?.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

// Get a single demo device by ID
export function getDemoDevice(id: string): DemoDevice | null {
  return demoDevices.find(d => d._id === id) || null;
}
