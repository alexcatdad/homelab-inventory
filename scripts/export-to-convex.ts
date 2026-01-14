/**
 * Export SQLite data to JSON for Convex import
 * Run with: bun run scripts/export-to-convex.ts
 */

import { Database } from 'bun:sqlite';
import { join } from 'path';

const DB_PATH = join(import.meta.dir, '../data/inventory.db');

interface SQLiteDevice {
  id: number;
  type: string;
  name: string;
  model: string | null;
  quantity: number;
  acquired_date: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SQLiteSpec {
  device_id: number;
  cpu_model: string | null;
  cpu_cores: number | null;
  cpu_threads: number | null;
  cpu_socket: string | null;
  cpu_tdp_watts: number | null;
  cpu_video_codecs: string | null;
  ram_current: string | null;
  ram_max: string | null;
  ram_type: string | null;
  ram_slots_total: number | null;
  ram_slots_used: number | null;
  motherboard_model: string | null;
  motherboard_chipset: string | null;
  motherboard_form_factor: string | null;
  sata_ports: number | null;
  nvme_slots: number | null;
}

interface SQLiteGpu {
  id: number;
  device_id: number;
  model: string;
  vram: string | null;
}

interface SQLiteStorage {
  id: number;
  device_id: number;
  type: string;
  capacity: string | null;
  capacity_bytes: number | null;
  device_path: string | null;
  mount_point: string | null;
  details: string | null;
}

interface SQLitePcieSlot {
  id: number;
  device_id: number;
  description: string;
  generation: number | null;
  lanes: number | null;
  status: string | null;
  current_card: string | null;
}

interface SQLiteUpgradeAnalysis {
  device_id: number;
  cpu_max: string | null;
  ram_max_practical: string | null;
  notes: string | null;
}

interface SQLiteNetworkInfo {
  device_id: number;
  mac_address: string | null;
  ip_address: string | null;
  hostname: string | null;
  last_seen: string | null;
  open_ports: string | null;
}

interface SQLiteNetworkConnection {
  id: number;
  from_device_id: number;
  to_device_id: number;
  connection_type: string | null;
  port: string | null;
  speed: string | null;
}

interface SQLiteSpecsCache {
  id: number;
  model_query: string;
  specs_json: string;
  source_url: string | null;
  created_at: string;
  expires_at: string | null;
}

// Convex device format
interface ConvexDevice {
  type: string;
  name: string;
  model?: string;
  quantity: number;
  acquired_date?: string;
  location?: string;
  notes?: string;
  specifications?: {
    cpu?: {
      model: string;
      cores?: number;
      threads?: number;
      socket?: string;
      tdp_watts?: number;
      video_codecs?: string;
    };
    ram?: {
      current: string;
      max_supported: string;
      type: string;
      slots_total?: number;
      slots_used?: number;
    };
    motherboard?: {
      model: string;
      chipset?: string;
      form_factor?: string;
      sata_ports?: number;
      nvme_slots?: number;
    };
  };
  gpus?: Array<{ model: string; vram?: string }>;
  storage?: Array<{
    type: string;
    capacity?: string;
    capacity_bytes?: number;
    device_path?: string;
    mount_point?: string;
    details?: string;
  }>;
  pcie_slots?: Array<{
    description: string;
    generation?: number;
    lanes?: number;
    status?: string;
    current_card?: string;
  }>;
  upgrade_analysis?: {
    cpu_max?: string;
    ram_max_practical?: string;
    notes?: string;
  };
  network_info?: {
    mac_address?: string;
    ip_address?: string;
    hostname?: string;
    last_seen?: string;
    open_ports?: string[];
  };
}

interface ConvexNetworkConnection {
  from_device_name: string;
  to_device_name: string;
  connection_type?: string;
  port?: string;
  speed?: string;
}

interface ConvexSpecsCache {
  model_query: string;
  specs_json: string;
  source_url?: string;
  expires_at?: number;
}

interface ExportData {
  devices: ConvexDevice[];
  network_connections: ConvexNetworkConnection[];
  specs_cache: ConvexSpecsCache[];
}

function main() {
  console.log('Opening SQLite database:', DB_PATH);

  const db = new Database(DB_PATH, { readonly: true });

  // Load all data
  const devices = db.query<SQLiteDevice, []>('SELECT * FROM devices').all();
  const specs = db.query<SQLiteSpec, []>('SELECT * FROM specifications').all();
  const gpus = db.query<SQLiteGpu, []>('SELECT * FROM gpus').all();
  const storage = db.query<SQLiteStorage, []>('SELECT * FROM storage').all();
  const pcieSlots = db.query<SQLitePcieSlot, []>('SELECT * FROM pcie_slots').all();
  const upgradeAnalysis = db.query<SQLiteUpgradeAnalysis, []>('SELECT * FROM upgrade_analysis').all();
  const networkInfo = db.query<SQLiteNetworkInfo, []>('SELECT * FROM network_info').all();
  const networkConnections = db.query<SQLiteNetworkConnection, []>('SELECT * FROM network_connections').all();
  const specsCache = db.query<SQLiteSpecsCache, []>('SELECT * FROM specs_cache').all();

  // Create device ID to name mapping for network connections
  const deviceIdToName = new Map<number, string>();
  devices.forEach(d => deviceIdToName.set(d.id, d.name));

  // Index related data by device_id
  const specsByDevice = new Map<number, SQLiteSpec>();
  specs.forEach(s => specsByDevice.set(s.device_id, s));

  const gpusByDevice = new Map<number, SQLiteGpu[]>();
  gpus.forEach(g => {
    if (!gpusByDevice.has(g.device_id)) gpusByDevice.set(g.device_id, []);
    gpusByDevice.get(g.device_id)!.push(g);
  });

  const storageByDevice = new Map<number, SQLiteStorage[]>();
  storage.forEach(s => {
    if (!storageByDevice.has(s.device_id)) storageByDevice.set(s.device_id, []);
    storageByDevice.get(s.device_id)!.push(s);
  });

  const pcieByDevice = new Map<number, SQLitePcieSlot[]>();
  pcieSlots.forEach(p => {
    if (!pcieByDevice.has(p.device_id)) pcieByDevice.set(p.device_id, []);
    pcieByDevice.get(p.device_id)!.push(p);
  });

  const upgradeByDevice = new Map<number, SQLiteUpgradeAnalysis>();
  upgradeAnalysis.forEach(u => upgradeByDevice.set(u.device_id, u));

  const networkByDevice = new Map<number, SQLiteNetworkInfo>();
  networkInfo.forEach(n => networkByDevice.set(n.device_id, n));

  // Transform devices
  const convexDevices: ConvexDevice[] = devices.map(device => {
    const convexDevice: ConvexDevice = {
      type: device.type,
      name: device.name,
      quantity: device.quantity || 1,
    };

    if (device.model) convexDevice.model = device.model;
    if (device.acquired_date) convexDevice.acquired_date = device.acquired_date;
    if (device.location) convexDevice.location = device.location;
    if (device.notes) convexDevice.notes = device.notes;

    // Add specifications
    const spec = specsByDevice.get(device.id);
    if (spec) {
      const specifications: ConvexDevice['specifications'] = {};

      if (spec.cpu_model) {
        specifications.cpu = {
          model: spec.cpu_model,
          ...(spec.cpu_cores && { cores: spec.cpu_cores }),
          ...(spec.cpu_threads && { threads: spec.cpu_threads }),
          ...(spec.cpu_socket && { socket: spec.cpu_socket }),
          ...(spec.cpu_tdp_watts && { tdp_watts: spec.cpu_tdp_watts }),
          ...(spec.cpu_video_codecs && { video_codecs: spec.cpu_video_codecs }),
        };
      }

      if (spec.ram_current || spec.ram_max || spec.ram_type) {
        specifications.ram = {
          current: spec.ram_current || '',
          max_supported: spec.ram_max || '',
          type: spec.ram_type || 'DDR4',
          ...(spec.ram_slots_total && { slots_total: spec.ram_slots_total }),
          ...(spec.ram_slots_used && { slots_used: spec.ram_slots_used }),
        };
      }

      if (spec.motherboard_model || spec.motherboard_chipset) {
        specifications.motherboard = {
          model: spec.motherboard_model || '',
          ...(spec.motherboard_chipset && { chipset: spec.motherboard_chipset }),
          ...(spec.motherboard_form_factor && { form_factor: spec.motherboard_form_factor }),
          ...(spec.sata_ports && { sata_ports: spec.sata_ports }),
          ...(spec.nvme_slots && { nvme_slots: spec.nvme_slots }),
        };
      }

      if (Object.keys(specifications).length > 0) {
        convexDevice.specifications = specifications;
      }
    }

    // Add GPUs
    const deviceGpus = gpusByDevice.get(device.id);
    if (deviceGpus && deviceGpus.length > 0) {
      convexDevice.gpus = deviceGpus.map(g => ({
        model: g.model,
        ...(g.vram && { vram: g.vram }),
      }));
    }

    // Add storage
    const deviceStorage = storageByDevice.get(device.id);
    if (deviceStorage && deviceStorage.length > 0) {
      convexDevice.storage = deviceStorage.map(s => ({
        type: s.type,
        ...(s.capacity && { capacity: s.capacity }),
        ...(s.capacity_bytes && { capacity_bytes: s.capacity_bytes }),
        ...(s.device_path && { device_path: s.device_path }),
        ...(s.mount_point && { mount_point: s.mount_point }),
        ...(s.details && { details: s.details }),
      }));
    }

    // Add PCIe slots
    const devicePcie = pcieByDevice.get(device.id);
    if (devicePcie && devicePcie.length > 0) {
      convexDevice.pcie_slots = devicePcie.map(p => ({
        description: p.description,
        ...(p.generation && { generation: p.generation }),
        ...(p.lanes && { lanes: p.lanes }),
        ...(p.status && { status: p.status }),
        ...(p.current_card && { current_card: p.current_card }),
      }));
    }

    // Add upgrade analysis
    const upgrade = upgradeByDevice.get(device.id);
    if (upgrade && (upgrade.cpu_max || upgrade.ram_max_practical || upgrade.notes)) {
      convexDevice.upgrade_analysis = {
        ...(upgrade.cpu_max && { cpu_max: upgrade.cpu_max }),
        ...(upgrade.ram_max_practical && { ram_max_practical: upgrade.ram_max_practical }),
        ...(upgrade.notes && { notes: upgrade.notes }),
      };
    }

    // Add network info
    const netInfo = networkByDevice.get(device.id);
    if (netInfo && (netInfo.mac_address || netInfo.ip_address || netInfo.hostname)) {
      convexDevice.network_info = {
        ...(netInfo.mac_address && { mac_address: netInfo.mac_address }),
        ...(netInfo.ip_address && { ip_address: netInfo.ip_address }),
        ...(netInfo.hostname && { hostname: netInfo.hostname }),
        ...(netInfo.last_seen && { last_seen: netInfo.last_seen }),
        ...(netInfo.open_ports && { open_ports: netInfo.open_ports.split(',').map(p => p.trim()) }),
      };
    }

    return convexDevice;
  });

  // Transform network connections (use device names instead of IDs)
  const convexConnections: ConvexNetworkConnection[] = networkConnections.map(conn => ({
    from_device_name: deviceIdToName.get(conn.from_device_id) || `unknown-${conn.from_device_id}`,
    to_device_name: deviceIdToName.get(conn.to_device_id) || `unknown-${conn.to_device_id}`,
    ...(conn.connection_type && { connection_type: conn.connection_type }),
    ...(conn.port && { port: conn.port }),
    ...(conn.speed && { speed: conn.speed }),
  }));

  // Transform specs cache
  const convexSpecsCache: ConvexSpecsCache[] = specsCache.map(cache => ({
    model_query: cache.model_query,
    specs_json: cache.specs_json,
    ...(cache.source_url && { source_url: cache.source_url }),
    ...(cache.expires_at && { expires_at: new Date(cache.expires_at).getTime() }),
  }));

  const exportData: ExportData = {
    devices: convexDevices,
    network_connections: convexConnections,
    specs_cache: convexSpecsCache,
  };

  // Write to JSON file
  const outputPath = join(import.meta.dir, '../data/export-for-convex.json');
  Bun.write(outputPath, JSON.stringify(exportData, null, 2));

  db.close();

  console.log('\nExport complete!');
  console.log(`  Devices: ${convexDevices.length}`);
  console.log(`  Network connections: ${convexConnections.length}`);
  console.log(`  Specs cache entries: ${convexSpecsCache.length}`);
  console.log(`\nOutput: ${outputPath}`);
  console.log('\nNext steps:');
  console.log('  1. npx convex run migrations/import');
}

main();
