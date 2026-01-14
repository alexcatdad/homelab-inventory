import { getDb } from './schema';
import type {
  Device,
  DeviceWithRelations,
  GPU,
  StorageDrive,
  PCIeSlot,
  StatsResponse,
  DeviceType,
  TopologyNode,
  TopologyEdge,
} from '../../shared/types';
import { formatBytes } from '../../shared/types';

// Get all devices with optional filtering
export function getAllDevices(options?: {
  type?: DeviceType;
  search?: string;
}): DeviceWithRelations[] {
  const db = getDb();

  let sql = `
    SELECT
      d.*,
      s.cpu_model, s.cpu_cores, s.cpu_threads, s.cpu_socket, s.cpu_tdp_watts, s.cpu_video_codecs,
      s.ram_current, s.ram_max, s.ram_type, s.ram_slots_total, s.ram_slots_used,
      s.motherboard_model, s.motherboard_chipset, s.motherboard_form_factor,
      s.sata_ports, s.nvme_slots,
      u.cpu_max as upgrade_cpu_max, u.ram_max_practical as upgrade_ram_max, u.notes as upgrade_notes
    FROM devices d
    LEFT JOIN specifications s ON d.id = s.device_id
    LEFT JOIN upgrade_analysis u ON d.id = u.device_id
    WHERE 1=1
  `;

  const params: (string | number)[] = [];

  if (options?.type) {
    sql += ' AND d.type = ?';
    params.push(options.type);
  }

  if (options?.search) {
    sql += ' AND (d.name LIKE ? OR d.model LIKE ? OR s.cpu_model LIKE ?)';
    const searchTerm = `%${options.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY d.name';

  const rows = db.query(sql).all(...params) as any[];

  return rows.map(row => {
    const deviceId = row.id;

    // Get GPUs
    const gpus = db.query(`
      SELECT id, model, vram FROM gpus WHERE device_id = ?
    `).all(deviceId) as GPU[];

    // Get storage drives
    const storage = db.query(`
      SELECT id, type, capacity, capacity_bytes, device_path, mount_point, details
      FROM storage WHERE device_id = ?
    `).all(deviceId) as StorageDrive[];

    // Get PCIe slots
    const pcie_slots = db.query(`
      SELECT id, description, generation, lanes, status, current_card
      FROM pcie_slots WHERE device_id = ?
    `).all(deviceId) as PCIeSlot[];

    return {
      id: row.id,
      type: row.type,
      name: row.name,
      model: row.model,
      quantity: row.quantity,
      acquired_date: row.acquired_date,
      location: row.location,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      specifications: {
        cpu: row.cpu_model ? {
          model: row.cpu_model,
          cores: row.cpu_cores,
          threads: row.cpu_threads,
          socket: row.cpu_socket,
          tdp_watts: row.cpu_tdp_watts,
          video_codecs: row.cpu_video_codecs,
        } : undefined,
        ram: row.ram_current ? {
          current: row.ram_current,
          max_supported: row.ram_max,
          type: row.ram_type,
          slots_total: row.ram_slots_total,
          slots_used: row.ram_slots_used,
        } : undefined,
        motherboard: row.motherboard_model ? {
          model: row.motherboard_model,
          chipset: row.motherboard_chipset,
          form_factor: row.motherboard_form_factor,
          sata_ports: row.sata_ports,
          nvme_slots: row.nvme_slots,
        } : undefined,
        gpu: gpus.length > 0 ? gpus : undefined,
        storage: storage.length > 0 ? storage : undefined,
      },
      upgrade_analysis: row.upgrade_cpu_max ? {
        cpu_max: row.upgrade_cpu_max,
        ram_max_practical: row.upgrade_ram_max,
        notes: row.upgrade_notes,
      } : undefined,
      gpus,
      storage,
      pcie_slots,
    } as DeviceWithRelations;
  });
}

// Get single device by ID
export function getDeviceById(id: number): DeviceWithRelations | null {
  const devices = getAllDevices();
  return devices.find(d => d.id === id) || null;
}

// Get single device by name
export function getDeviceByName(name: string): DeviceWithRelations | null {
  const devices = getAllDevices();
  return devices.find(d => d.name.toLowerCase() === name.toLowerCase()) || null;
}

// Get inventory statistics
export function getStats(): StatsResponse {
  const db = getDb();

  // Count by type
  const typeCountRows = db.query(`
    SELECT type, COUNT(*) as count FROM devices GROUP BY type
  `).all() as { type: DeviceType; count: number }[];

  const devicesByType: Record<string, number> = {};
  let totalDevices = 0;
  for (const row of typeCountRows) {
    devicesByType[row.type] = row.count;
    totalDevices += row.count;
  }

  // Total storage
  const storageRow = db.query(`
    SELECT COALESCE(SUM(capacity_bytes), 0) as total_bytes FROM storage
  `).get() as { total_bytes: number };

  // RAM totals (parse from strings)
  const ramRows = db.query(`
    SELECT ram_current, ram_max FROM specifications WHERE ram_current IS NOT NULL
  `).all() as { ram_current: string; ram_max: string }[];

  let totalRamCurrent = 0;
  let totalRamMax = 0;

  for (const row of ramRows) {
    const current = parseRamToGB(row.ram_current);
    const max = parseRamToGB(row.ram_max);
    totalRamCurrent += current;
    totalRamMax += max;
  }

  // Count upgradeable devices
  const upgradeableRow = db.query(`
    SELECT COUNT(*) as count FROM upgrade_analysis
    WHERE cpu_max IS NOT NULL AND cpu_max != 'Not Upgradeable'
  `).get() as { count: number };

  return {
    total_devices: totalDevices,
    devices_by_type: devicesByType as Record<DeviceType, number>,
    total_storage_bytes: storageRow.total_bytes,
    total_storage_formatted: formatBytes(storageRow.total_bytes),
    total_ram_current: `${totalRamCurrent}GB`,
    total_ram_potential: `${totalRamMax}GB`,
    upgradeable_devices: upgradeableRow.count,
  };
}

// Get network topology data
export function getTopology(): { nodes: TopologyNode[]; edges: TopologyEdge[] } {
  const db = getDb();

  // Get nodes (devices with network info)
  const nodes = db.query(`
    SELECT d.id, d.name, d.type, n.ip_address, n.hostname
    FROM devices d
    LEFT JOIN network_info n ON d.id = n.device_id
  `).all() as TopologyNode[];

  // Get edges (connections)
  const edges = db.query(`
    SELECT from_device_id as source, to_device_id as target, connection_type as type, speed
    FROM network_connections
  `).all() as TopologyEdge[];

  return { nodes, edges };
}

// Helper: parse RAM string to GB
function parseRamToGB(ram: string): number {
  if (!ram) return 0;
  const match = ram.match(/^(\d+)\s*(GB|TB|MB)?$/i);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'GB').toUpperCase();

  if (unit === 'TB') return value * 1024;
  if (unit === 'MB') return value / 1024;
  return value;
}

// CRUD operations for the skill

export function createDevice(device: Partial<Device>): number {
  const db = getDb();

  const result = db.query(`
    INSERT INTO devices (type, name, model, quantity, location, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    device.type || 'Desktop',
    device.name || 'Unnamed Device',
    device.model || '',
    device.quantity || 1,
    device.location || null,
    device.notes || null
  );

  return Number(result.lastInsertRowid);
}

export function updateDevice(id: number, updates: Partial<Device>): boolean {
  const db = getDb();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.model !== undefined) {
    fields.push('model = ?');
    values.push(updates.model);
  }
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(updates.quantity);
  }
  if (updates.location !== undefined) {
    fields.push('location = ?');
    values.push(updates.location);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }

  if (fields.length === 0) return false;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const result = db.query(`
    UPDATE devices SET ${fields.join(', ')} WHERE id = ?
  `).run(...values);

  return result.changes > 0;
}

export function deleteDevice(id: number): boolean {
  const db = getDb();
  const result = db.query('DELETE FROM devices WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateSpecifications(deviceId: number, specs: any): void {
  const db = getDb();

  // Upsert specifications
  db.query(`
    INSERT INTO specifications (device_id, cpu_model, cpu_cores, cpu_threads, ram_current, ram_max, ram_type, motherboard_model, motherboard_chipset)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(device_id) DO UPDATE SET
      cpu_model = excluded.cpu_model,
      cpu_cores = excluded.cpu_cores,
      cpu_threads = excluded.cpu_threads,
      ram_current = excluded.ram_current,
      ram_max = excluded.ram_max,
      ram_type = excluded.ram_type,
      motherboard_model = excluded.motherboard_model,
      motherboard_chipset = excluded.motherboard_chipset
  `).run(
    deviceId,
    specs.cpu?.model || null,
    specs.cpu?.cores || null,
    specs.cpu?.threads || null,
    specs.ram?.current || null,
    specs.ram?.max_supported || null,
    specs.ram?.type || null,
    specs.motherboard?.model || null,
    specs.motherboard?.chipset || null
  );
}

export function addGpu(deviceId: number, model: string, vram?: string): number {
  const db = getDb();
  const result = db.query(`
    INSERT INTO gpus (device_id, model, vram) VALUES (?, ?, ?)
  `).run(deviceId, model, vram || null);
  return Number(result.lastInsertRowid);
}

export function addStorage(deviceId: number, storage: StorageDrive): number {
  const db = getDb();
  const result = db.query(`
    INSERT INTO storage (device_id, type, capacity, capacity_bytes, device_path, mount_point, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    deviceId,
    storage.type,
    storage.capacity,
    storage.capacity_bytes || 0,
    storage.device || null,
    storage.mount_point || null,
    storage.details || null
  );
  return Number(result.lastInsertRowid);
}

export function addPcieSlot(deviceId: number, description: string): number {
  const db = getDb();
  const result = db.query(`
    INSERT INTO pcie_slots (device_id, description, status) VALUES (?, ?, 'Available')
  `).run(deviceId, description);
  return Number(result.lastInsertRowid);
}

export function updateUpgradeAnalysis(deviceId: number, cpuMax?: string, notes?: string): void {
  const db = getDb();
  db.query(`
    INSERT INTO upgrade_analysis (device_id, cpu_max, notes)
    VALUES (?, ?, ?)
    ON CONFLICT(device_id) DO UPDATE SET
      cpu_max = excluded.cpu_max,
      notes = excluded.notes
  `).run(deviceId, cpuMax || null, notes || null);
}

// Network connection operations
export function addConnection(fromId: number, toId: number, type: string = 'ethernet'): number {
  const db = getDb();
  const result = db.query(`
    INSERT INTO network_connections (from_device_id, to_device_id, connection_type)
    VALUES (?, ?, ?)
  `).run(fromId, toId, type);
  return Number(result.lastInsertRowid);
}

export function removeConnection(id: number): boolean {
  const db = getDb();
  const result = db.query('DELETE FROM network_connections WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getConnections(): { id: number; from_device_id: number; to_device_id: number; connection_type: string }[] {
  const db = getDb();
  return db.query(`
    SELECT id, from_device_id, to_device_id, connection_type FROM network_connections
  `).all() as any[];
}

// Specs cache operations
export interface CachedSpecs {
  id: number;
  model_query: string;
  specs_json: string;
  source_url: string | null;
  created_at: string;
  expires_at: string | null;
}

export function getCachedSpecs(modelQuery: string): CachedSpecs | null {
  const db = getDb();
  const normalizedQuery = modelQuery.toLowerCase().trim();

  const row = db.query(`
    SELECT * FROM specs_cache
    WHERE model_query = ?
    AND (expires_at IS NULL OR expires_at > datetime('now'))
  `).get(normalizedQuery) as CachedSpecs | null;

  return row;
}

export function setCachedSpecs(modelQuery: string, specsJson: string, sourceUrl?: string): number {
  const db = getDb();
  const normalizedQuery = modelQuery.toLowerCase().trim();

  // Cache for 30 days
  const result = db.query(`
    INSERT INTO specs_cache (model_query, specs_json, source_url, expires_at)
    VALUES (?, ?, ?, datetime('now', '+30 days'))
    ON CONFLICT(model_query) DO UPDATE SET
      specs_json = excluded.specs_json,
      source_url = excluded.source_url,
      created_at = CURRENT_TIMESTAMP,
      expires_at = datetime('now', '+30 days')
  `).run(normalizedQuery, specsJson, sourceUrl || null);

  return Number(result.lastInsertRowid);
}

export function clearExpiredCache(): number {
  const db = getDb();
  const result = db.query(`
    DELETE FROM specs_cache WHERE expires_at < datetime('now')
  `).run();
  return result.changes;
}
