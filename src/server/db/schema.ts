import { Database } from 'bun:sqlite';
import { join } from 'path';

// Database path - relative to project root
const DB_PATH = join(import.meta.dir, '../../../data/inventory.db');

// Singleton database instance
let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { create: true });
    db.run('PRAGMA foreign_keys = ON');
    db.run('PRAGMA journal_mode = WAL');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// SQL statements for schema creation
const SCHEMA_SQL = `
-- Core device table
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('Server', 'Desktop', 'Laptop', 'Component', 'IoT', 'Network')),
  name TEXT NOT NULL UNIQUE,
  model TEXT,
  quantity INTEGER DEFAULT 1,
  acquired_date TEXT,
  location TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Hardware specifications (1:1 with device)
CREATE TABLE IF NOT EXISTS specifications (
  device_id INTEGER PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  cpu_model TEXT,
  cpu_cores INTEGER,
  cpu_threads INTEGER,
  cpu_socket TEXT,
  cpu_tdp_watts INTEGER,
  cpu_video_codecs TEXT,
  ram_current TEXT,
  ram_max TEXT,
  ram_type TEXT,
  ram_slots_total INTEGER,
  ram_slots_used INTEGER,
  motherboard_model TEXT,
  motherboard_chipset TEXT,
  motherboard_form_factor TEXT,
  sata_ports INTEGER,
  nvme_slots INTEGER
);

-- GPUs (many per device)
CREATE TABLE IF NOT EXISTS gpus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  vram TEXT
);

-- Storage drives (many per device)
CREATE TABLE IF NOT EXISTS storage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  capacity TEXT,
  capacity_bytes INTEGER,
  device_path TEXT,
  mount_point TEXT,
  details TEXT
);

-- PCIe slots (many per device)
CREATE TABLE IF NOT EXISTS pcie_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  generation INTEGER,
  lanes INTEGER,
  status TEXT DEFAULT 'Available' CHECK(status IN ('Available', 'Occupied')),
  current_card TEXT
);

-- Upgrade analysis (1:1 with device)
CREATE TABLE IF NOT EXISTS upgrade_analysis (
  device_id INTEGER PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  cpu_max TEXT,
  ram_max_practical TEXT,
  notes TEXT
);

-- Network info for device discovery (1:1 with device)
CREATE TABLE IF NOT EXISTS network_info (
  device_id INTEGER PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  mac_address TEXT,
  ip_address TEXT,
  hostname TEXT,
  last_seen TEXT,
  open_ports TEXT
);

-- Network connections for topology (many-to-many)
CREATE TABLE IF NOT EXISTS network_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  to_device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  connection_type TEXT CHECK(connection_type IN ('ethernet', 'wifi', 'thunderbolt', 'usb')),
  port TEXT,
  speed TEXT
);

-- Specs lookup cache (for web search results)
CREATE TABLE IF NOT EXISTS specs_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_query TEXT NOT NULL UNIQUE,
  specs_json TEXT NOT NULL,
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
CREATE INDEX IF NOT EXISTS idx_devices_name ON devices(name);
CREATE INDEX IF NOT EXISTS idx_storage_device_id ON storage(device_id);
CREATE INDEX IF NOT EXISTS idx_gpus_device_id ON gpus(device_id);
CREATE INDEX IF NOT EXISTS idx_pcie_slots_device_id ON pcie_slots(device_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_from ON network_connections(from_device_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_to ON network_connections(to_device_id);
CREATE INDEX IF NOT EXISTS idx_specs_cache_query ON specs_cache(model_query);
`;

const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS specs_cache;
DROP TABLE IF EXISTS network_connections;
DROP TABLE IF EXISTS network_info;
DROP TABLE IF EXISTS upgrade_analysis;
DROP TABLE IF EXISTS pcie_slots;
DROP TABLE IF EXISTS storage;
DROP TABLE IF EXISTS gpus;
DROP TABLE IF EXISTS specifications;
DROP TABLE IF EXISTS devices;
`;

// Initialize database schema
export function initSchema(): void {
  const database = getDb();
  // Using run for multi-statement execution
  for (const statement of SCHEMA_SQL.split(';').filter(s => s.trim())) {
    database.run(statement);
  }
  console.log('Database schema initialized');
}

// Reset database (for development)
export function resetDb(): void {
  const database = getDb();
  for (const statement of DROP_TABLES_SQL.split(';').filter(s => s.trim())) {
    database.run(statement);
  }
  initSchema();
  console.log('Database reset complete');
}
