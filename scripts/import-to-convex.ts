/**
 * Import exported data to Convex using the API
 * Run with: bun run scripts/import-to-convex.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { join } from 'path';

const EXPORT_PATH = join(import.meta.dir, '../data/export-for-convex.json');
const CONVEX_URL = process.env.VITE_CONVEX_URL || 'https://dependable-ibis-974.convex.cloud';

async function main() {
  console.log('Loading export data...');
  const exportFile = Bun.file(EXPORT_PATH);
  const data = await exportFile.json();

  console.log(`Found ${data.devices.length} devices to import`);
  console.log(`Connecting to Convex: ${CONVEX_URL}`);

  const client = new ConvexHttpClient(CONVEX_URL);

  // Import devices
  let imported = 0;
  let skipped = 0;
  let errors: string[] = [];

  for (const device of data.devices) {
    // Check if device exists
    try {
      const existing = await client.query(api.devices.getByName, { name: device.name });
      if (existing) {
        console.log(`  Skipping "${device.name}" (exists)`);
        skipped++;
        continue;
      }
    } catch (e) {
      // Device doesn't exist, proceed to create
    }

    try {
      await client.mutation(api.devices.create, device);
      console.log(`  Imported "${device.name}"`);
      imported++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  Error importing "${device.name}": ${msg}`);
      errors.push(`${device.name}: ${msg}`);
    }
  }

  // Import specs cache
  console.log(`\nImporting ${data.specs_cache.length} specs cache entries...`);
  let cacheImported = 0;

  for (const entry of data.specs_cache) {
    try {
      const specs = JSON.parse(entry.specs_json);
      await client.mutation(api.specs.setCache, {
        model: entry.model_query,
        specs,
        source_url: entry.source_url,
      });
      console.log(`  Cached "${entry.model_query}"`);
      cacheImported++;
    } catch (e) {
      console.error(`  Error caching "${entry.model_query}": ${e}`);
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`Devices imported: ${imported}`);
  console.log(`Devices skipped: ${skipped}`);
  console.log(`Specs cache imported: ${cacheImported}`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
}

main().catch(console.error);
