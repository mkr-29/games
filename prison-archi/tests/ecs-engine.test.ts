import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  initSync,
  WasmSimulationEngine,
} from '../src/wasm/pkg/prison_simulation.js';

function getWasmEngine() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(__dirname, '../src/wasm/pkg/prison_simulation_bg.wasm');
  const wasmBytes = fs.readFileSync(wasmPath);

  const exports = initSync({ module: wasmBytes });
  const engine = new WasmSimulationEngine();
  return { engine, exports };
}

test('ECS Engine: Deterministic entity movement & position validation', () => {
  const { engine } = getWasmEngine();

  // Spawn 1,000 dummy entities
  const spawned = engine.spawn_dummy_entities(1000);
  assert.equal(spawned, 1000);
  assert.equal(engine.get_entity_count(), 1000);

  // Entity 1: initial pos (0, 0), vel (20, 15)
  // Entity 2: initial pos (10, 0), vel (-20, -15)
  const initialX1 = engine.get_entity_x(1);
  const initialY1 = engine.get_entity_y(1);
  assert.equal(initialX1, 0.0);
  assert.equal(initialY1, 0.0);

  // Execute 60 fixed ticks (1.0 in-game second at 60Hz)
  for (let i = 0; i < 60; i++) {
    engine.step_single_tick();
  }

  assert.equal(engine.get_sim_tick(), 60);

  // In 1 second: x = 0 + 20 * 1 = 20, y = 0 + 15 * 1 = 15
  const x1 = engine.get_entity_x(1);
  const y1 = engine.get_entity_y(1);
  assert.ok(Math.abs(x1 - 20.0) < 0.01, `Expected x1 ~ 20.0, got ${x1}`);
  assert.ok(Math.abs(y1 - 15.0) < 0.01, `Expected y1 ~ 15.0, got ${y1}`);

  // Entity 2: initial (10, 0) + (-20, -15) * 1 = (-10, -15)
  const x2 = engine.get_entity_x(2);
  const y2 = engine.get_entity_y(2);
  assert.ok(Math.abs(x2 - (-10.0)) < 0.01, `Expected x2 ~ -10.0, got ${x2}`);
  assert.ok(Math.abs(y2 - (-15.0)) < 0.01, `Expected y2 ~ -15.0, got ${y2}`);
});

test('ECS Engine: Tick accumulator prevents spiral of death', () => {
  const { engine } = getWasmEngine();

  // Feed 10ms (less than 16.66ms tick): 0 sub-ticks executed
  const ticks1 = engine.step(0.010);
  assert.equal(ticks1, 0);
  assert.equal(engine.get_sim_tick(), 0);

  // Feed another 10ms (total 20ms >= 16.66ms): 1 sub-tick executed
  const ticks2 = engine.step(0.010);
  assert.equal(ticks2, 1);
  assert.equal(engine.get_sim_tick(), 1);

  // Feed a huge time jump (5 seconds, as if tab was backgrounded)
  // Must clamp to max 4 sub-ticks to prevent freeze
  const ticksHuge = engine.step(5.0);
  assert.equal(ticksHuge, 4, 'Must clamp to max 4 sub-ticks');
  assert.equal(engine.get_sim_tick(), 5); // 1 + 4 = 5
});

test('ECS Engine: Pack render entities into linear memory byte buffer', () => {
  const { engine, exports } = getWasmEngine();

  engine.spawn_dummy_entities(1000);

  // Step 30 ticks (0.5s)
  for (let i = 0; i < 30; i++) {
    engine.step_single_tick();
  }

  // Pack up to 1,000 entities
  const packedCount = engine.pack_render_entities(1000);
  assert.equal(packedCount, 1000);

  const ptr = engine.get_packed_entities_ptr();
  const byteLen = engine.get_packed_entities_byte_len(packedCount);
  assert.equal(byteLen, 1000 * 32, '1000 entities * 32 bytes each = 32,000 bytes');

  // Verify memory slice directly from Wasm linear memory
  const memoryBuffer = (exports.memory as WebAssembly.Memory).buffer;
  const packedBytes = new Uint8Array(memoryBuffer, ptr, byteLen);
  assert.equal(packedBytes.byteLength, 32000);

  // Read entity 1 from packed buffer (first 32 bytes)
  // Layout: entity_id (u32, offset 0), pos_x (f32, offset 4), pos_y (f32, offset 8)
  const view = new DataView(memoryBuffer, ptr, 32);
  const entityId = view.getUint32(0, true);
  const posX = view.getFloat32(4, true);
  const posY = view.getFloat32(8, true);

  assert.equal(entityId, 1);
  // In 30 ticks (0.5s), dx = 20 -> x = 10, dy = 15 -> y = 7.5
  assert.ok(Math.abs(posX - 10.0) < 0.01, `Expected packed posX ~ 10.0, got ${posX}`);
  assert.ok(Math.abs(posY - 7.5) < 0.01, `Expected packed posY ~ 7.5, got ${posY}`);
});

test('ECS Engine: 10 Simulated Seconds Rate Accuracy (60 ticks / sec +- 0.5%)', () => {
  const { engine } = getWasmEngine();
  engine.spawn_dummy_entities(1000);

  // Simulate 10.0 in-game seconds using realistic frame intervals (~16.666 ms)
  const dt = 1.0 / 60.0;
  let totalSubTicks = 0;

  for (let frame = 0; frame < 600; frame++) {
    const subTicks = engine.step(dt);
    totalSubTicks += subTicks;
  }

  // Exactly 600 ticks must be executed for 10 simulated seconds
  assert.equal(totalSubTicks, 600);
  assert.equal(engine.get_sim_tick(), 600);

  // Time elapsed in simulation
  const simSeconds = engine.get_sim_time_seconds();
  assert.ok(
    Math.abs(simSeconds - 10.0) < 0.05, // within 0.5%
    `Expected ~10.0s elapsed simulation time, got ${simSeconds}`
  );
});

