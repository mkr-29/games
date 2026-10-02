import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  initSync,
  WasmTileGrid,
} from '../src/wasm/pkg/prison_simulation.js';

function getWasmTileGrid(width = 512, height = 512) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(__dirname, '../src/wasm/pkg/prison_simulation_bg.wasm');
  const wasmBytes = fs.readFileSync(wasmPath);

  const exports = initSync({ module: wasmBytes });
  const grid = new WasmTileGrid(width, height);
  return { grid, exports };
}

test('TileGrid: 512x512 Allocation and Memory Footprint (< 4 MB)', () => {
  const { grid } = getWasmTileGrid(512, 512);

  assert.equal(grid.get_width(), 512);
  assert.equal(grid.get_height(), 512);
  assert.equal(grid.get_chunks_x(), 16);
  assert.equal(grid.get_chunks_y(), 16);
  assert.equal(grid.get_total_chunks(), 256);

  const totalBytes = grid.total_memory_bytes();
  const totalMb = totalBytes / (1024 * 1024);

  // 512x512 = 262,144 tiles * 12 bytes = 3,145,728 bytes = 3.0 MB
  assert.ok(
    totalMb < 4.0,
    `Memory consumption must be strictly under 4.0 MB, got ${totalMb.toFixed(2)} MB`
  );
  assert.ok(
    totalMb >= 3.0,
    `Memory consumption expected ~3.0 MB, got ${totalMb.toFixed(2)} MB`
  );
});

test('TileGrid: Tile mutation and physical property queries', () => {
  const { grid } = getWasmTileGrid(100, 100);

  // Default tile is empty (solid = false, wall = 0)
  assert.equal(grid.is_solid(10, 10), false);
  assert.equal(grid.get_wall_id(10, 10), 0);

  // Place Brick Wall (Material ID = 1)
  assert.equal(grid.set_wall_id(10, 10, 1), true);
  assert.equal(grid.get_wall_id(10, 10), 1);
  assert.equal(grid.is_solid(10, 10), true);

  // Set Terrain (Grass = 4) and Floor (Concrete = 5)
  assert.equal(grid.set_terrain_id(10, 10, 4), true);
  assert.equal(grid.set_floor_id(10, 10, 5), true);
  assert.equal(grid.get_terrain_id(10, 10), 4);
  assert.equal(grid.get_floor_id(10, 10), 5);

  // Structural health
  assert.equal(grid.set_health(10, 10, 175), true);
  assert.equal(grid.get_health(10, 10), 175);

  // Out of bounds check
  assert.equal(grid.set_wall_id(200, 200, 1), false);
  assert.equal(grid.get_wall_id(200, 200), 0);
  assert.equal(grid.is_solid(200, 200), false);
});

test('TileGrid: Spatial 32x32 Chunk Partitioning & Dirty Tracking', () => {
  const { grid } = getWasmTileGrid(128, 128); // 4x4 = 16 chunks

  // Initially all chunks are dirty
  assert.equal(grid.get_total_chunks(), 16);
  assert.equal(grid.dirty_chunk_count(), 16);

  // Clear dirty flag for chunk (0, 0) and (1, 1)
  assert.equal(grid.clear_chunk_dirty(0, 0), true);
  assert.equal(grid.clear_chunk_dirty(1, 1), true);
  assert.equal(grid.dirty_chunk_count(), 14);

  // Mutating tile at (5, 5) belongs to Chunk (0, 0)
  // chunk_x = 5 >> 5 = 0, chunk_y = 5 >> 5 = 0
  grid.set_wall_id(5, 5, 2); // Reinforced concrete
  // Chunk (0, 0) is marked dirty again
  assert.equal(grid.dirty_chunk_count(), 15);

  // Mutating tile at (35, 35) belongs to Chunk (1, 1)
  // chunk_x = 35 >> 5 = 1, chunk_y = 35 >> 5 = 1
  grid.set_wall_id(35, 35, 3); // Perimeter wall
  assert.equal(grid.dirty_chunk_count(), 16);
});
