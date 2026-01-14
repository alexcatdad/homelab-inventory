/**
 * Run full migration: export from SQLite and import to Convex
 * Run with: bun run scripts/run-migration.ts
 */

import { join } from 'path';

const EXPORT_PATH = join(import.meta.dir, '../data/export-for-convex.json');

async function main() {
  console.log('=== Migration Step 1: Export from SQLite ===\n');

  // First, run the export script
  const exportProcess = Bun.spawn(['bun', 'run', join(import.meta.dir, 'export-to-convex.ts')], {
    cwd: join(import.meta.dir, '..'),
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const exportCode = await exportProcess.exited;
  if (exportCode !== 0) {
    console.error('Export failed');
    process.exit(1);
  }

  // Check if export file exists
  const exportFile = Bun.file(EXPORT_PATH);
  if (!await exportFile.exists()) {
    console.error('Export file not found:', EXPORT_PATH);
    process.exit(1);
  }

  const data = await exportFile.json();

  console.log('\n=== Migration Step 2: Import to Convex ===\n');

  // Import devices
  if (data.devices && data.devices.length > 0) {
    console.log(`Importing ${data.devices.length} devices...`);
    const devicesProcess = Bun.spawn(
      ['bunx', 'convex', 'run', 'migrations/import:importDevices', '--', JSON.stringify({ devices: data.devices })],
      {
        cwd: join(import.meta.dir, '..'),
        stdout: 'inherit',
        stderr: 'inherit',
      }
    );
    await devicesProcess.exited;
  }

  // Import network connections
  if (data.network_connections && data.network_connections.length > 0) {
    console.log(`Importing ${data.network_connections.length} network connections...`);
    const connProcess = Bun.spawn(
      ['bunx', 'convex', 'run', 'migrations/import:importConnections', '--', JSON.stringify({ connections: data.network_connections })],
      {
        cwd: join(import.meta.dir, '..'),
        stdout: 'inherit',
        stderr: 'inherit',
      }
    );
    await connProcess.exited;
  }

  // Import specs cache
  if (data.specs_cache && data.specs_cache.length > 0) {
    console.log(`Importing ${data.specs_cache.length} specs cache entries...`);
    const cacheProcess = Bun.spawn(
      ['bunx', 'convex', 'run', 'migrations/import:importSpecsCache', '--', JSON.stringify({ cache: data.specs_cache })],
      {
        cwd: join(import.meta.dir, '..'),
        stdout: 'inherit',
        stderr: 'inherit',
      }
    );
    await cacheProcess.exited;
  }

  console.log('\n=== Migration Complete ===');
  console.log('Verify data at: https://dashboard.convex.dev');
}

main().catch(console.error);
