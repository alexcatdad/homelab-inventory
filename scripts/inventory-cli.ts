#!/usr/bin/env bun
/**
 * Inventory CLI - backing script for /inventory command
 * Usage: bun scripts/inventory-cli.ts <command> [options]
 */

import { parseArgs } from 'util';
import { getDb, initSchema } from '../src/server/db/schema';
import {
  getAllDevices,
  getDeviceByName,
  createDevice,
  updateDevice,
  deleteDevice,
  updateSpecifications,
  addGpu,
  addStorage,
  addPcieSlot,
  updateUpgradeAnalysis,
  getStats,
} from '../src/server/db/queries';
import { parseCapacityToBytes, formatBytes } from '../src/shared/types';
import type { DeviceType } from '../src/shared/types';

// Initialize database
initSchema();

const args = process.argv.slice(2);
const command = args[0];

function printHelp(): void {
  console.log(`
Home Lab Inventory CLI

Commands:
  list [--type TYPE] [--search QUERY]   List devices
  show --name NAME                       Show device details
  add --name NAME --model MODEL --type TYPE [--specs JSON]
                                         Add new device
  update --name NAME --field FIELD --value VALUE
                                         Update device field
  remove --name NAME                     Remove device
  stats                                  Show inventory statistics

Examples:
  bun scripts/inventory-cli.ts list
  bun scripts/inventory-cli.ts list --type Server
  bun scripts/inventory-cli.ts show --name "Primary Home Lab Node"
  bun scripts/inventory-cli.ts add --name "New NAS" --model "Synology DS923+" --type Server
  bun scripts/inventory-cli.ts update --name "NAS" --field ram.current --value "16GB"
  bun scripts/inventory-cli.ts remove --name "Old Device"
`);
}

function formatDeviceTable(devices: any[]): void {
  if (devices.length === 0) {
    console.log('No devices found.');
    return;
  }

  // Calculate column widths
  const nameWidth = Math.max(20, ...devices.map(d => d.name.length));
  const typeWidth = 10;
  const cpuWidth = 30;
  const ramWidth = 15;

  // Header
  console.log(
    'Name'.padEnd(nameWidth) + ' | ' +
    'Type'.padEnd(typeWidth) + ' | ' +
    'CPU'.padEnd(cpuWidth) + ' | ' +
    'RAM'
  );
  console.log('-'.repeat(nameWidth + typeWidth + cpuWidth + ramWidth + 10));

  // Rows
  for (const device of devices) {
    const cpu = device.specifications?.cpu?.model || '-';
    const ram = device.specifications?.ram?.current || '-';
    const ramMax = device.specifications?.ram?.max_supported;
    const ramStr = ramMax ? `${ram} / ${ramMax}` : ram;

    console.log(
      device.name.padEnd(nameWidth) + ' | ' +
      device.type.padEnd(typeWidth) + ' | ' +
      cpu.substring(0, cpuWidth).padEnd(cpuWidth) + ' | ' +
      ramStr
    );
  }

  console.log(`\nTotal: ${devices.length} device(s)`);
}

function formatDeviceDetail(device: any): void {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${device.name}`);
  console.log(`${'═'.repeat(60)}`);

  console.log(`\nBasic Info:`);
  console.log(`  Type:     ${device.type}`);
  console.log(`  Model:    ${device.model}`);
  if (device.location) console.log(`  Location: ${device.location}`);
  if (device.notes) console.log(`  Notes:    ${device.notes}`);

  if (device.specifications) {
    const spec = device.specifications;

    if (spec.cpu) {
      console.log(`\nCPU:`);
      console.log(`  Model:   ${spec.cpu.model}`);
      if (spec.cpu.cores) console.log(`  Cores:   ${spec.cpu.cores}`);
      if (spec.cpu.threads) console.log(`  Threads: ${spec.cpu.threads}`);
      if (spec.cpu.socket) console.log(`  Socket:  ${spec.cpu.socket}`);
      if (spec.cpu.tdp_watts) console.log(`  TDP:     ${spec.cpu.tdp_watts}W`);
    }

    if (spec.ram) {
      console.log(`\nRAM:`);
      console.log(`  Current:       ${spec.ram.current}`);
      console.log(`  Max Supported: ${spec.ram.max_supported}`);
      console.log(`  Type:          ${spec.ram.type}`);
    }

    if (spec.motherboard) {
      console.log(`\nMotherboard:`);
      console.log(`  Model:   ${spec.motherboard.model}`);
      if (spec.motherboard.chipset) console.log(`  Chipset: ${spec.motherboard.chipset}`);
    }
  }

  if (device.gpus && device.gpus.length > 0) {
    console.log(`\nGPU(s):`);
    for (const gpu of device.gpus) {
      const vram = gpu.vram ? ` (${gpu.vram})` : '';
      console.log(`  - ${gpu.model}${vram}`);
    }
  }

  if (device.storage && device.storage.length > 0) {
    console.log(`\nStorage:`);
    let totalBytes = 0;
    for (const drive of device.storage) {
      const mount = drive.mount_point ? ` → ${drive.mount_point}` : '';
      console.log(`  - ${drive.type}: ${drive.capacity}${mount}`);
      totalBytes += drive.capacity_bytes || 0;
    }
    if (totalBytes > 0) {
      console.log(`  Total: ${formatBytes(totalBytes)}`);
    }
  }

  if (device.pcie_slots && device.pcie_slots.length > 0) {
    console.log(`\nPCIe Slots:`);
    for (const slot of device.pcie_slots) {
      const status = slot.status === 'Occupied' ? ` [${slot.current_card}]` : ' [Available]';
      console.log(`  - ${slot.description}${status}`);
    }
  }

  if (device.upgrade_analysis) {
    console.log(`\nUpgrade Analysis:`);
    if (device.upgrade_analysis.cpu_max) {
      console.log(`  CPU Max: ${device.upgrade_analysis.cpu_max}`);
    }
    if (device.upgrade_analysis.notes) {
      console.log(`  Notes:   ${device.upgrade_analysis.notes}`);
    }
  }

  console.log('');
}

async function main(): Promise<void> {
  if (!command || command === 'help' || command === '--help') {
    printHelp();
    return;
  }

  switch (command) {
    case 'list': {
      const { values } = parseArgs({
        args: args.slice(1),
        options: {
          type: { type: 'string' },
          search: { type: 'string' },
        },
        allowPositionals: true,
      });

      const devices = getAllDevices({
        type: values.type as DeviceType,
        search: values.search,
      });

      formatDeviceTable(devices);
      break;
    }

    case 'show': {
      const { values } = parseArgs({
        args: args.slice(1),
        options: {
          name: { type: 'string' },
        },
      });

      if (!values.name) {
        console.error('Error: --name is required');
        process.exit(1);
      }

      const device = getDeviceByName(values.name);
      if (!device) {
        console.error(`Error: Device "${values.name}" not found`);
        process.exit(1);
      }

      formatDeviceDetail(device);
      break;
    }

    case 'add': {
      const { values } = parseArgs({
        args: args.slice(1),
        options: {
          name: { type: 'string' },
          model: { type: 'string' },
          type: { type: 'string' },
          specs: { type: 'string' },
          location: { type: 'string' },
          notes: { type: 'string' },
        },
      });

      if (!values.name) {
        console.error('Error: --name is required');
        process.exit(1);
      }

      // Check if device already exists
      const existing = getDeviceByName(values.name);
      if (existing) {
        console.error(`Error: Device "${values.name}" already exists`);
        process.exit(1);
      }

      // Create device
      const deviceId = createDevice({
        name: values.name,
        model: values.model || '',
        type: (values.type as DeviceType) || 'Desktop',
        location: values.location,
        notes: values.notes,
      });

      // Parse and add specs if provided
      if (values.specs) {
        try {
          const specs = JSON.parse(values.specs);

          // Update specifications
          if (specs.cpu || specs.ram || specs.motherboard) {
            updateSpecifications(deviceId, specs);
          }

          // Add GPUs
          if (specs.gpu && Array.isArray(specs.gpu)) {
            for (const gpu of specs.gpu) {
              addGpu(deviceId, gpu.model, gpu.vram);
            }
          }

          // Add storage
          if (specs.storage && Array.isArray(specs.storage)) {
            for (const drive of specs.storage) {
              addStorage(deviceId, {
                type: drive.type,
                capacity: drive.capacity,
                capacity_bytes: parseCapacityToBytes(drive.capacity),
                device: drive.device,
                mount_point: drive.mount_point,
              });
            }
          }

          // Add PCIe slots
          if (specs.pcie_slots && Array.isArray(specs.pcie_slots)) {
            for (const slot of specs.pcie_slots) {
              addPcieSlot(deviceId, typeof slot === 'string' ? slot : slot.description);
            }
          }

          // Add upgrade analysis
          if (specs.upgrade_analysis) {
            updateUpgradeAnalysis(deviceId, specs.upgrade_analysis.cpu_max, specs.upgrade_analysis.notes);
          }
        } catch (e) {
          console.error('Warning: Failed to parse specs JSON:', e);
        }
      }

      console.log(`✓ Added device: ${values.name} (ID: ${deviceId})`);
      break;
    }

    case 'update': {
      const { values } = parseArgs({
        args: args.slice(1),
        options: {
          name: { type: 'string' },
          field: { type: 'string' },
          value: { type: 'string' },
        },
      });

      if (!values.name || !values.field || values.value === undefined) {
        console.error('Error: --name, --field, and --value are required');
        process.exit(1);
      }

      const device = getDeviceByName(values.name);
      if (!device) {
        console.error(`Error: Device "${values.name}" not found`);
        process.exit(1);
      }

      const field = values.field;
      const value = values.value;

      // Handle nested fields like ram.current
      if (field.includes('.')) {
        const [category, subfield] = field.split('.');
        const db = getDb();

        if (category === 'ram') {
          const column = subfield === 'current' ? 'ram_current' : subfield === 'max' ? 'ram_max' : `ram_${subfield}`;
          db.query(`UPDATE specifications SET ${column} = ? WHERE device_id = ?`).run(value, device.id);
        } else if (category === 'cpu') {
          const column = `cpu_${subfield}`;
          db.query(`UPDATE specifications SET ${column} = ? WHERE device_id = ?`).run(value, device.id);
        }
      } else {
        // Direct device field
        updateDevice(device.id!, { [field]: value });
      }

      console.log(`✓ Updated ${values.name}: ${field} = ${value}`);
      break;
    }

    case 'remove': {
      const { values } = parseArgs({
        args: args.slice(1),
        options: {
          name: { type: 'string' },
        },
      });

      if (!values.name) {
        console.error('Error: --name is required');
        process.exit(1);
      }

      const device = getDeviceByName(values.name);
      if (!device) {
        console.error(`Error: Device "${values.name}" not found`);
        process.exit(1);
      }

      const success = deleteDevice(device.id!);
      if (success) {
        console.log(`✓ Removed device: ${values.name}`);
      } else {
        console.error(`Error: Failed to remove device`);
        process.exit(1);
      }
      break;
    }

    case 'stats': {
      const stats = getStats();
      console.log('\nInventory Statistics');
      console.log('═'.repeat(40));
      console.log(`Total Devices:     ${stats.total_devices}`);
      console.log(`Total Storage:     ${stats.total_storage_formatted}`);
      console.log(`RAM (Current):     ${stats.total_ram_current}`);
      console.log(`RAM (Potential):   ${stats.total_ram_potential}`);
      console.log(`Upgradeable:       ${stats.upgradeable_devices}`);
      console.log('\nBy Type:');
      for (const [type, count] of Object.entries(stats.devices_by_type)) {
        console.log(`  ${type}: ${count}`);
      }
      console.log('');
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch(console.error);
