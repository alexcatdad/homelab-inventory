#!/usr/bin/env bun
/**
 * Import hardware inventory from YAML to SQLite
 * Usage: bun run import
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { getDb, initSchema, resetDb } from '../src/server/db/schema';
import { parseCapacityToBytes } from '../src/shared/types';
import type { YAMLInventory, YAMLDevice } from '../src/shared/types';

const YAML_PATH = join(import.meta.dir, '../hardware_inventory.yaml');

function importDevice(device: YAMLDevice): void {
  const db = getDb();

  // Insert main device
  const insertDevice = db.prepare(`
    INSERT INTO devices (type, name, model, quantity)
    VALUES (?, ?, ?, ?)
  `);

  const result = insertDevice.run(
    device.type,
    device.name,
    device.model,
    device.quantity || 1
  );

  const deviceId = Number(result.lastInsertRowid);
  console.log(`  Inserted device: ${device.name} (id: ${deviceId})`);

  // Insert specifications
  if (device.specifications) {
    const spec = device.specifications;
    const insertSpec = db.prepare(`
      INSERT INTO specifications (
        device_id, cpu_model, cpu_cores, cpu_threads,
        ram_current, ram_max, ram_type,
        motherboard_model, motherboard_chipset
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSpec.run(
      deviceId,
      spec.cpu?.model || null,
      spec.cpu?.cores || null,
      spec.cpu?.threads || null,
      spec.ram?.current || null,
      spec.ram?.max_supported || null,
      spec.ram?.type || null,
      spec.motherboard?.model || null,
      spec.motherboard?.chipset || null
    );

    // Insert GPUs
    if (spec.gpu && spec.gpu.length > 0) {
      const insertGpu = db.prepare(`
        INSERT INTO gpus (device_id, model, vram)
        VALUES (?, ?, ?)
      `);

      for (const gpu of spec.gpu) {
        insertGpu.run(deviceId, gpu.model, gpu.vram || null);
      }
      console.log(`    Added ${spec.gpu.length} GPU(s)`);
    }

    // Insert storage drives
    if (spec.storage && spec.storage.length > 0) {
      const insertStorage = db.prepare(`
        INSERT INTO storage (device_id, type, capacity, capacity_bytes, device_path, mount_point, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const drive of spec.storage) {
        const capacityBytes = parseCapacityToBytes(drive.capacity);
        insertStorage.run(
          deviceId,
          drive.type,
          drive.capacity,
          capacityBytes,
          drive.device || null,
          drive.mount_point || null,
          drive.details || null
        );
      }
      console.log(`    Added ${spec.storage.length} storage drive(s)`);
    }
  }

  // Insert upgrade analysis
  if (device.upgrade_analysis) {
    const insertUpgrade = db.prepare(`
      INSERT INTO upgrade_analysis (device_id, cpu_max, notes)
      VALUES (?, ?, ?)
    `);

    insertUpgrade.run(
      deviceId,
      device.upgrade_analysis.cpu_max || null,
      device.upgrade_analysis.notes || null
    );
  }

  // Insert PCIe slots
  if (device.expansion?.pcie_slots && device.expansion.pcie_slots.length > 0) {
    const insertSlot = db.prepare(`
      INSERT INTO pcie_slots (device_id, description, status)
      VALUES (?, ?, 'Available')
    `);

    for (const slot of device.expansion.pcie_slots) {
      insertSlot.run(deviceId, slot);
    }
    console.log(`    Added ${device.expansion.pcie_slots.length} PCIe slot(s)`);
  }
}

function main(): void {
  console.log('Home Inventory YAML Import');
  console.log('==========================\n');

  // Read YAML file
  console.log(`Reading: ${YAML_PATH}`);
  const yamlContent = readFileSync(YAML_PATH, 'utf-8');
  const inventory = parse(yamlContent) as YAMLInventory;

  if (!inventory.hardware || !Array.isArray(inventory.hardware)) {
    console.error('Error: Invalid YAML format. Expected "hardware" array.');
    process.exit(1);
  }

  console.log(`Found ${inventory.hardware.length} device(s)\n`);

  // Reset and initialize database
  console.log('Resetting database...');
  resetDb();
  console.log('');

  // Import each device
  console.log('Importing devices:');
  for (const device of inventory.hardware) {
    importDevice(device);
  }

  console.log('\nImport complete!');

  // Show summary
  const db = getDb();
  const stats = db.query(`
    SELECT
      (SELECT COUNT(*) FROM devices) as devices,
      (SELECT COUNT(*) FROM gpus) as gpus,
      (SELECT COUNT(*) FROM storage) as storage_drives,
      (SELECT COUNT(*) FROM pcie_slots) as pcie_slots
  `).get() as Record<string, number>;

  console.log('\nDatabase summary:');
  console.log(`  Devices: ${stats.devices}`);
  console.log(`  GPUs: ${stats.gpus}`);
  console.log(`  Storage drives: ${stats.storage_drives}`);
  console.log(`  PCIe slots: ${stats.pcie_slots}`);
}

main();
