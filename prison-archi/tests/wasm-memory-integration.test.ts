import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  initSync,
  get_total_shared_memory_size,
  get_header_offset,
  get_command_queue_offset,
  get_telemetry_offset,
  get_snapshot_slot_offset,
  get_max_entities_per_slot,
  init_simulation,
} from '../src/wasm/pkg/prison_simulation.js';

import {
  TOTAL_SHARED_MEMORY_SIZE,
  HEADER_OFFSET,
  COMMAND_QUEUE_OFFSET,
  TELEMETRY_OFFSET,
  SNAPSHOT_BANK_OFFSET,
  SNAPSHOT_SLOT_SIZE,
  MAX_ENTITIES_PER_SLOT,
} from '../src/lib/memory/SharedMemoryBridge.ts';

test('Wasm-TypeScript Memory Layout Contract Parity', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(__dirname, '../src/wasm/pkg/prison_simulation_bg.wasm');
  const wasmBytes = fs.readFileSync(wasmPath);

  // Initialize compiled wasm synchronously
  initSync({ module: wasmBytes });

  const initResult = init_simulation();
  assert.equal(initResult, 'PRISON_SIMULATION_READY');

  // Verify that Rust Wasm layout calculations exactly match TypeScript constants
  assert.equal(get_total_shared_memory_size(), TOTAL_SHARED_MEMORY_SIZE);
  assert.equal(get_header_offset(), HEADER_OFFSET);
  assert.equal(get_command_queue_offset(), COMMAND_QUEUE_OFFSET);
  assert.equal(get_telemetry_offset(), TELEMETRY_OFFSET);
  assert.equal(get_max_entities_per_slot(), MAX_ENTITIES_PER_SLOT);

  // Verify triple-buffer snapshot slot offsets
  assert.equal(get_snapshot_slot_offset(0), SNAPSHOT_BANK_OFFSET);
  assert.equal(get_snapshot_slot_offset(1), SNAPSHOT_BANK_OFFSET + SNAPSHOT_SLOT_SIZE);
  assert.equal(get_snapshot_slot_offset(2), SNAPSHOT_BANK_OFFSET + (SNAPSHOT_SLOT_SIZE * 2));
});
