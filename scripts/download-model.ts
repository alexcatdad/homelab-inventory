#!/usr/bin/env bun
/**
 * Downloads WebLLM model files from HuggingFace for local serving.
 * This allows the browser to load the model from localhost instead of CDN.
 *
 * Usage: bun scripts/download-model.ts
 */

import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const HF_BASE = `https://huggingface.co/mlc-ai/${MODEL_ID}/resolve/main`;
const OUTPUT_DIR = `./public/models/${MODEL_ID}`;

// Files to download (based on WebLLM model structure)
const MODEL_FILES = [
  'mlc-chat-config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'ndarray-cache.json',
];

async function downloadFile(filename: string): Promise<void> {
  const url = `${HF_BASE}/${filename}`;
  const outputPath = `${OUTPUT_DIR}/${filename}`;

  if (existsSync(outputPath)) {
    console.log(`  ✓ ${filename} (exists)`);
    return;
  }

  console.log(`  ↓ ${filename}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${filename}: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  await Bun.write(outputPath, buffer);

  const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2);
  console.log(`  ✓ ${filename} (${sizeMB} MB)`);
}

async function getParamShards(): Promise<string[]> {
  // Fetch ndarray-cache.json to find all param shard files
  const cacheUrl = `${HF_BASE}/ndarray-cache.json`;
  const response = await fetch(cacheUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch ndarray-cache.json');
  }

  const cache = await response.json() as { records: Array<{ dataPath: string }> };
  const shards = new Set<string>();

  for (const record of cache.records) {
    if (record.dataPath) {
      shards.add(record.dataPath);
    }
  }

  return Array.from(shards);
}

async function main() {
  console.log(`\nDownloading WebLLM model: ${MODEL_ID}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Download config files first
  console.log('Config files:');
  for (const file of MODEL_FILES) {
    await downloadFile(file);
  }

  // Get list of param shards from ndarray-cache.json
  console.log('\nFinding param shards...');
  const shards = await getParamShards();
  console.log(`Found ${shards.length} shard files\n`);

  // Download param shards
  console.log('Model weights:');
  for (const shard of shards) {
    await downloadFile(shard);
  }

  console.log(`\n✓ Model downloaded to ${OUTPUT_DIR}`);
  console.log('\nUpdate engine.ts to use local model:');
  console.log(`  modelBaseUrl: '/models/${MODEL_ID}/'`);
}

main().catch(console.error);
