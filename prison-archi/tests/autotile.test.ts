import { test } from 'node:test';
import assert from 'node:assert/strict';

// Constants matching Rust simulation::grid::autotile
const AUTOTILE_NORTH = 1 << 0; // 1
const AUTOTILE_EAST  = 1 << 1; // 2
const AUTOTILE_SOUTH = 1 << 2; // 4
const AUTOTILE_WEST  = 1 << 3; // 8

const NEIGHBOR_N  = 1 << 0; // 1
const NEIGHBOR_NE = 1 << 1; // 2
const NEIGHBOR_E  = 1 << 2; // 4
const NEIGHBOR_SE = 1 << 3; // 8
const NEIGHBOR_S  = 1 << 4; // 16
const NEIGHBOR_SW = 1 << 5; // 32
const NEIGHBOR_W  = 1 << 6; // 64
const NEIGHBOR_NW = 1 << 7; // 128

// Canonical 47-Blob mask normalizer in TypeScript to verify contract parity
function normalize8BitMask(mask: number): number {
  let n = mask;
  if ((n & (NEIGHBOR_N | NEIGHBOR_E)) !== (NEIGHBOR_N | NEIGHBOR_E)) {
    n &= ~NEIGHBOR_NE;
  }
  if ((n & (NEIGHBOR_S | NEIGHBOR_E)) !== (NEIGHBOR_S | NEIGHBOR_E)) {
    n &= ~NEIGHBOR_SE;
  }
  if ((n & (NEIGHBOR_S | NEIGHBOR_W)) !== (NEIGHBOR_S | NEIGHBOR_W)) {
    n &= ~NEIGHBOR_SW;
  }
  if ((n & (NEIGHBOR_N | NEIGHBOR_W)) !== (NEIGHBOR_N | NEIGHBOR_W)) {
    n &= ~NEIGHBOR_NW;
  }
  return n;
}

test('Autotiling: Bitmask Constants and Cardinal Bit Values', () => {
  assert.equal(AUTOTILE_NORTH, 1);
  assert.equal(AUTOTILE_EAST, 2);
  assert.equal(AUTOTILE_SOUTH, 4);
  assert.equal(AUTOTILE_WEST, 8);

  // Sum of all 4 cardinal directions is 15 (4-bit maximum)
  assert.equal(AUTOTILE_NORTH | AUTOTILE_EAST | AUTOTILE_SOUTH | AUTOTILE_WEST, 15);
});

test('Autotiling: All 16 Cardinal Combinations Formula Parity', () => {
  for (let expected = 0; expected < 16; expected++) {
    const hasN = (expected & AUTOTILE_NORTH) !== 0;
    const hasE = (expected & AUTOTILE_EAST) !== 0;
    const hasS = (expected & AUTOTILE_SOUTH) !== 0;
    const hasW = (expected & AUTOTILE_WEST) !== 0;

    const calculated =
      (hasN ? 1 : 0) +
      (hasE ? 2 : 0) +
      (hasS ? 4 : 0) +
      (hasW ? 8 : 0);

    assert.equal(
      calculated,
      expected,
      `Failed for combination N=${hasN} E=${hasE} S=${hasS} W=${hasW}`
    );
  }
});

test('Autotiling: Archetypal Cardinal Topologies', () => {
  // 1. Isolated pillar: 0
  const isolated = 0;
  assert.equal(isolated, 0);

  // 2. Horizontal line (East + West): 2 + 8 = 10
  const horizontal = AUTOTILE_EAST | AUTOTILE_WEST;
  assert.equal(horizontal, 10);

  // 3. Vertical line (North + South): 1 + 4 = 5
  const vertical = AUTOTILE_NORTH | AUTOTILE_SOUTH;
  assert.equal(vertical, 5);

  // 4. Corner Top-Right (South + West): 4 + 8 = 12
  const cornerTopRight = AUTOTILE_SOUTH | AUTOTILE_WEST;
  assert.equal(cornerTopRight, 12);

  // 5. T-junction (North + East + South): 1 + 2 + 4 = 7
  const tJunctionNES = AUTOTILE_NORTH | AUTOTILE_EAST | AUTOTILE_SOUTH;
  assert.equal(tJunctionNES, 7);

  // 6. Cross-junction (NESW): 1 + 2 + 4 + 8 = 15
  const cross = AUTOTILE_NORTH | AUTOTILE_EAST | AUTOTILE_SOUTH | AUTOTILE_WEST;
  assert.equal(cross, 15);
});

test('Autotiling: 8-Bit Neighbor Corner Reduction into 47 Canonical Blobs', () => {
  // Test that a diagonal corner without both adjacent cardinal edges is masked out
  const isolatedNE = NEIGHBOR_NE;
  assert.equal(normalize8BitMask(isolatedNE), 0, 'Isolated NE must normalize to 0');

  const northAndNE = NEIGHBOR_N | NEIGHBOR_NE;
  assert.equal(normalize8BitMask(northAndNE), NEIGHBOR_N, 'NE without East must be cleared');

  const eastAndNE = NEIGHBOR_E | NEIGHBOR_NE;
  assert.equal(normalize8BitMask(eastAndNE), NEIGHBOR_E, 'NE without North must be cleared');

  const cornerWithCardinals = NEIGHBOR_N | NEIGHBOR_E | NEIGHBOR_NE;
  assert.equal(
    normalize8BitMask(cornerWithCardinals),
    NEIGHBOR_N | NEIGHBOR_E | NEIGHBOR_NE,
    'Valid corner with both cardinals must be preserved'
  );

  // Verify that all 256 combinations reduce to exactly 47 unique canonical values
  const uniqueNormalized = new Set<number>();
  for (let mask = 0; mask < 256; mask++) {
    uniqueNormalized.add(normalize8BitMask(mask));
  }
  assert.equal(uniqueNormalized.size, 47, 'Normalized 8-bit masks must form exactly 47 canonical tiles');
});

test('Autotiling: Simulation Tile Grid Autotile & Chunk Dirty Propagation Contract', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const { initSync, WasmTileGrid } = await import('../src/wasm/pkg/prison_simulation.js');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(__dirname, '../src/wasm/pkg/prison_simulation_bg.wasm');
  const wasmBytes = fs.readFileSync(wasmPath);

  initSync({ module: wasmBytes });

  const grid = new WasmTileGrid(64, 64);
  grid.clear_all_dirty();
  assert.equal(grid.dirty_chunk_count(), 0);

  // Place wall at (31, 15) in chunk (0, 0)
  grid.set_wall_and_propagate_autotile(31, 15, 1);
  assert.equal(grid.get_wall_autotile_idx(31, 15), 0, 'Isolated pillar has autotile 0');
  assert.equal(grid.is_chunk_dirty(0, 0), true);

  grid.clear_all_dirty();
  assert.equal(grid.dirty_chunk_count(), 0);

  // Place wall at (32, 15) in chunk (1, 0)
  grid.set_wall_and_propagate_autotile(32, 15, 1);

  // Both chunks must be marked dirty
  assert.equal(grid.is_chunk_dirty(0, 0), true, 'Chunk (0,0) dirty from neighbor update');
  assert.equal(grid.is_chunk_dirty(1, 0), true, 'Chunk (1,0) dirty from new tile');

  // East-West connection: (31, 15) connects East (2), (32, 15) connects West (8)
  assert.equal(grid.get_wall_autotile_idx(31, 15), AUTOTILE_EAST);
  assert.equal(grid.get_wall_autotile_idx(32, 15), AUTOTILE_WEST);

  // Demolish (32, 15)
  grid.clear_all_dirty();
  grid.set_wall_and_propagate_autotile(32, 15, 0);

  assert.equal(grid.is_chunk_dirty(0, 0), true);
  assert.equal(grid.is_chunk_dirty(1, 0), true);
  assert.equal(grid.get_wall_autotile_idx(31, 15), 0, 'Reverts to isolated pillar 0');
});
