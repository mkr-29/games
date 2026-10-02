import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SharedMemoryBridge,
  TOTAL_SHARED_MEMORY_SIZE,
  HEADER_OFFSET,
  HEADER_SIZE,
  COMMAND_QUEUE_OFFSET,
  COMMAND_QUEUE_SIZE,
  TELEMETRY_OFFSET,
  TELEMETRY_SIZE,
  SNAPSHOT_BANK_OFFSET,
  SNAPSHOT_SLOT_SIZE,
  BUFFER_SLOTS,
  MAGIC_PRIS,
  PROTOCOL_VERSION,
  CTRL,
  MAX_ENTITIES_PER_SLOT,
} from '../src/lib/memory/SharedMemoryBridge.ts';

test('SharedMemoryBridge: Memory layout constants and partition boundaries', () => {
  assert.equal(HEADER_OFFSET, 0x000000);
  assert.equal(HEADER_SIZE, 1024);
  assert.equal(COMMAND_QUEUE_OFFSET, 0x000400);
  assert.equal(COMMAND_QUEUE_SIZE, 64 * 1024);
  assert.equal(TELEMETRY_OFFSET, 0x010400);
  assert.equal(TELEMETRY_SIZE, 16 * 1024);
  assert.equal(SNAPSHOT_BANK_OFFSET, 0x014400);
  assert.equal(SNAPSHOT_SLOT_SIZE, 4 * 1024 * 1024);
  assert.equal(BUFFER_SLOTS, 3);
  assert.equal(TOTAL_SHARED_MEMORY_SIZE, 12_665_856);
  assert.equal(MAX_ENTITIES_PER_SLOT, 131_072);

  // Boundary continuity assertions
  assert.equal(HEADER_OFFSET + HEADER_SIZE, COMMAND_QUEUE_OFFSET);
  assert.equal(COMMAND_QUEUE_OFFSET + COMMAND_QUEUE_SIZE, TELEMETRY_OFFSET);
  assert.equal(TELEMETRY_OFFSET + TELEMETRY_SIZE, SNAPSHOT_BANK_OFFSET);
  assert.equal(
    SNAPSHOT_BANK_OFFSET + (SNAPSHOT_SLOT_SIZE * BUFFER_SLOTS),
    TOTAL_SHARED_MEMORY_SIZE
  );
});

test('SharedMemoryBridge: Allocation and control block initialization', () => {
  const bridge = new SharedMemoryBridge();
  assert.equal(bridge.buffer.byteLength, TOTAL_SHARED_MEMORY_SIZE);
  assert.equal(bridge.isValid(), false);

  bridge.initializeControlBlock(5_000_000); // $50,000.00
  assert.equal(bridge.isValid(), true);

  const metrics = bridge.getMetrics();
  assert.equal(metrics.simTick, 0);
  assert.equal(metrics.simTimeMs, 0);
  assert.equal(metrics.readSlot, 0);
  assert.equal(metrics.writeSlot, 1);
  assert.equal(metrics.cleanSlot, 0);
  assert.equal(metrics.dangerLevel, 0);
  assert.equal(metrics.bankBalance, 50000);
  assert.equal(metrics.prisonerCount, 0);
  assert.equal(metrics.guardCount, 0);
});

test('SharedMemoryBridge: Atomic mutation and read back', () => {
  const bridge = new SharedMemoryBridge();
  bridge.initializeControlBlock();

  const ctrlView = new Int32Array(bridge.buffer, HEADER_OFFSET, HEADER_SIZE / 4);

  // Worker simulates incrementing ticks and danger level
  Atomics.add(ctrlView, CTRL.SIM_TICK, 42);
  Atomics.store(ctrlView, CTRL.DANGER_LEVEL, 35_400); // 35.4%
  Atomics.store(ctrlView, CTRL.PRISONER_COUNT, 250);
  Atomics.store(ctrlView, CTRL.GUARD_COUNT, 35);

  assert.equal(bridge.getSimTick(), 42);
  assert.equal(bridge.getDangerLevel(), 35.4);
  assert.equal(bridge.getPrisonerCount(), 250);
  assert.equal(bridge.getGuardCount(), 35);
});

test('SharedMemoryBridge: Lock-free Triple Buffer consumer state swap', () => {
  const bridge = new SharedMemoryBridge();
  bridge.initializeControlBlock();

  const ctrlView = new Int32Array(bridge.buffer, HEADER_OFFSET, HEADER_SIZE / 4);

  // Initial render snapshot query (clean_slot == 0, lastObserved == 0)
  const initial = bridge.acquireRenderSnapshot();
  assert.equal(initial.hasNewSnapshot, false);
  assert.equal(initial.readSlot, 0);

  // Worker commits snapshot to Slot 1:
  // 1. Swaps clean_slot to 1
  // 2. Increments sim_tick to 1
  Atomics.store(ctrlView, CTRL.CLEAN_SLOT, 1);
  Atomics.add(ctrlView, CTRL.SIM_TICK, 1);

  // Main thread queries snapshot
  const frame1 = bridge.acquireRenderSnapshot();
  assert.equal(frame1.hasNewSnapshot, true);
  assert.equal(frame1.readSlot, 1);
  assert.equal(frame1.simTick, 1);
  // Verify main thread stored read_slot into the atomic block
  assert.equal(bridge.getReadSlot(), 1);

  // Subsequent query before next tick should report no new snapshot
  const frame1Repeat = bridge.acquireRenderSnapshot();
  assert.equal(frame1Repeat.hasNewSnapshot, false);
  assert.equal(frame1Repeat.readSlot, 1);
});

test('SharedMemoryBridge: Snapshot slot typed views and memory indexing', () => {
  const bridge = new SharedMemoryBridge();

  // Test slot 0 entity 0: pos_x (index 1 in float32 = byte offset 4)
  // Each entity is 32 bytes (8 floats)
  const slot0Float = bridge.snapshotSlotsFloat32[0];
  const slot0Uint = bridge.snapshotSlotsUint32[0];

  slot0Uint[0] = 1001; // entity_id
  slot0Float[1] = 128.5; // pos_x
  slot0Float[2] = 256.75; // pos_y
  slot0Float[3] = 1.57079; // rotation (pi/2)

  // Verify byte representation via raw buffer
  const rawDataView = new DataView(bridge.buffer, SNAPSHOT_BANK_OFFSET, SNAPSHOT_SLOT_SIZE);
  assert.equal(rawDataView.getUint32(0, true), 1001);
  assert.equal(rawDataView.getFloat32(4, true), 128.5);
  assert.equal(rawDataView.getFloat32(8, true), 256.75);
  assert.equal(Math.abs(rawDataView.getFloat32(12, true) - 1.57079) < 0.0001, true);
});
