import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SharedMemoryBridge } from '../src/lib/memory/SharedMemoryBridge.ts';
import {
  TripleBufferConsumer,
  TripleBufferProducer,
  COMMAND_PACKET_BYTE_SIZE,
  COMMAND_QUEUE_CAPACITY,
  lerp,
  slerpAngle,
  type UserCommandInput,
} from '../src/lib/memory/TripleBufferConsumer.ts';

import {
  initSync,
  get_command_packet_byte_size,
  get_command_queue_capacity,
} from '../src/wasm/pkg/prison_simulation.js';

test('TripleBuffer: Contract Parity with Rust Wasm', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const wasmPath = path.resolve(__dirname, '../src/wasm/pkg/prison_simulation_bg.wasm');
  const wasmBytes = fs.readFileSync(wasmPath);

  initSync({ module: wasmBytes });

  assert.equal(get_command_packet_byte_size(), COMMAND_PACKET_BYTE_SIZE);
  assert.equal(get_command_queue_capacity(), COMMAND_QUEUE_CAPACITY);
});

test('TripleBuffer: 1,000 Tick Producer/Consumer Stress Test (60Hz vs 144Hz)', () => {
  const bridge = new SharedMemoryBridge();
  bridge.initializeControlBlock();

  const producer = new TripleBufferProducer(1);
  const consumer = new TripleBufferConsumer(0);

  let totalFramesRendered = 0;
  let totalNewSnapshotsAcquired = 0;

  let simTime = 0;
  let renderTime = 0;

  // Simulate 1,000 simulation ticks (~16.66 seconds of gameplay)
  for (let tick = 1; tick <= 1000; tick++) {
    simTime += 1000 / 60; // 16.666 ms per sim tick

    // 1. Producer prepares data in active write slot and commits
    const activeWriteSlot = producer.getActiveWriteSlot();
    const nextWriteSlot = producer.commitSimulationSnapshot(bridge);

    // INVARIANT 1: Write slot must NEVER equal current consumer read slot
    assert.notEqual(
      nextWriteSlot,
      consumer.getCurrentReadSlot(),
      `Slot collision at tick ${tick}: write=${nextWriteSlot}, read=${consumer.getCurrentReadSlot()}`
    );

    // 2. Render thread runs at 144Hz (~6.94 ms per frame)
    // Runs 2 or 3 render frames per simulation tick
    while (renderTime < simTime) {
      renderTime += 1000 / 144;
      totalFramesRendered++;

      const sample = consumer.acquireRenderSnapshot(bridge, renderTime);
      if (sample.hasNewSnapshot) {
        totalNewSnapshotsAcquired++;
        assert.equal(sample.readSlot, activeWriteSlot);
      }

      // INVARIANT 2: Consumer read slot must NEVER collide with producer active write slot
      assert.notEqual(
        consumer.getCurrentReadSlot(),
        producer.getActiveWriteSlot(),
        `Slot collision during render frame ${totalFramesRendered}: read=${consumer.getCurrentReadSlot()}, write=${producer.getActiveWriteSlot()}`
      );

      // INVARIANT 3: Alpha interpolation factor must be bounded [0.0, 1.0]
      assert.ok(sample.alpha >= 0.0 && sample.alpha <= 1.0);
    }
  }

  // Verify that all 1,000 snapshots were acquired without drops or tearing
  assert.equal(totalNewSnapshotsAcquired, 1000);
  assert.ok(totalFramesRendered >= 2390, `Expected ~2400 render frames at 144Hz, got ${totalFramesRendered}`);
});

test('TripleBuffer: SPSC Circular Command Queue FIFO Order', () => {
  const bridge = new SharedMemoryBridge();
  bridge.initializeControlBlock();

  const consumer = new TripleBufferConsumer();
  const producer = new TripleBufferProducer();

  // Enqueue 100 commands from main thread
  for (let i = 0; i < 100; i++) {
    const cmd: UserCommandInput = {
      commandType: (i % 4) + 1,
      flags: i % 2,
      targetTileX: i * 2,
      targetTileY: i * 3,
      width: 2,
      height: 2,
      payloadParam: 5000 + i,
      timestampMs: 10000 + i * 16,
    };
    const queued = consumer.enqueueUserCommand(bridge, cmd);
    assert.equal(queued, true);
  }

  // Worker drains all 100 commands
  const drained = producer.drainUserCommands(bridge);
  assert.equal(drained.length, 100);

  // Assert exact FIFO order and payload fidelity
  for (let i = 0; i < 100; i++) {
    const cmd = drained[i];
    assert.equal(cmd.commandType, (i % 4) + 1);
    assert.equal(cmd.flags, i % 2);
    assert.equal(cmd.targetTileX, i * 2);
    assert.equal(cmd.targetTileY, i * 3);
    assert.equal(cmd.width, 2);
    assert.equal(cmd.height, 2);
    assert.equal(cmd.payloadParam, 5000 + i);
    assert.equal(cmd.timestampMs, 10000 + i * 16);
  }

  // Queue should now be completely empty
  assert.equal(producer.popUserCommand(bridge), null);
});

test('TripleBuffer: Queue Capacity and Circular Wrap-around', () => {
  const bridge = new SharedMemoryBridge();
  bridge.initializeControlBlock();

  const consumer = new TripleBufferConsumer();
  const producer = new TripleBufferProducer();

  // Max capacity is COMMAND_QUEUE_CAPACITY - 1 (2047 items)
  for (let i = 0; i < COMMAND_QUEUE_CAPACITY - 1; i++) {
    const ok = consumer.enqueueUserCommand(bridge, {
      commandType: 1,
      targetTileX: i,
      targetTileY: i,
      payloadParam: i,
    });
    assert.equal(ok, true);
  }

  // Queue is now full - next push must return false (backpressure)
  const overflow = consumer.enqueueUserCommand(bridge, {
    commandType: 99,
    targetTileX: 0,
    targetTileY: 0,
  });
  assert.equal(overflow, false);

  // Drain 500 items
  for (let i = 0; i < 500; i++) {
    const cmd = producer.popUserCommand(bridge);
    assert.ok(cmd !== null);
    assert.equal(cmd?.payloadParam, i);
  }

  // We can now enqueue another 500 items, exercising circular index wrapping
  for (let i = 0; i < 500; i++) {
    const ok = consumer.enqueueUserCommand(bridge, {
      commandType: 2,
      targetTileX: i,
      targetTileY: i,
      payloadParam: 9000 + i,
    });
    assert.equal(ok, true);
  }
});

test('TripleBuffer: Interpolation Math Utilities (Lerp & Slerp)', () => {
  // Linear position lerp
  assert.equal(lerp(10, 20, 0.0), 10);
  assert.equal(lerp(10, 20, 0.5), 15);
  assert.equal(lerp(10, 20, 1.0), 20);

  // Angular shortest-path interpolation (0.1 rad to 6.1 rad across 2*PI boundary)
  const a0 = 0.1;
  const a1 = Math.PI * 2 - 0.1; // 6.183 rad (same as -0.1 rad)
  const mid = slerpAngle(a0, a1, 0.5);
  assert.ok(Math.abs(mid) < 0.001 || Math.abs(mid - Math.PI * 2) < 0.001);
});
