/**
 * TripleBufferConsumer.ts
 * 
 * Lock-Free Triple Buffer Consumer (Render Thread) & SPSC Input Command Queue (Main Thread)
 * 
 * Invariants:
 * 1. Read Slot and Write Slot NEVER collide (guaranteed by atomic exchange with clean slot).
 * 2. Zero locks, zero mutexes, zero GC allocations in hot loop.
 * 3. Commands enqueued by Main Thread are consumed in strict FIFO order by Simulation Worker.
 */

import {
  type SharedMemoryBridge,
  CTRL,
} from './SharedMemoryBridge.ts';

export const COMMAND_PACKET_BYTE_SIZE = 20;
export const COMMAND_QUEUE_CAPACITY = 2048; // 2048 * 20B = 40,960B <= 64KB

export interface UserCommandInput {
  commandType: number;   // 1=PlaceWall, 2=ZoneRoom, 3=AssignGuard, 4=Lockdown...
  flags?: number;        // Bitflags (Shift-drag, cancel, immediate)
  targetTileX: number;
  targetTileY: number;
  width?: number;
  height?: number;
  payloadParam?: number; // RoomType enum / Material ID / Entity ID
  timestampMs?: number;
}

export interface RenderSnapshotSample {
  hasNewSnapshot: boolean;
  readSlot: number;
  prevReadSlot: number;
  simTick: number;
  alpha: number; // 0.0 .. 1.0 interpolation factor
}

export class TripleBufferConsumer {
  private currentReadSlot = 0;
  private previousReadSlot = 0;
  private lastSampledTick = 0;
  private lastTickTimestamp = performance.now();
  private readonly tickIntervalMs = 1000 / 60; // 16.666 ms nominal 60Hz tick

  constructor(initialReadSlot = 0) {
    this.currentReadSlot = initialReadSlot;
    this.previousReadSlot = initialReadSlot;
  }

  /**
   * Samples the newest simulation snapshot from the triple buffer.
   * If a new tick was committed by the simulation worker:
   *   1. Atomically exchanges currentReadSlot with clean_slot.
   *   2. Stores the acquired slot into ctrlBlock[READ_SLOT].
   *   3. Resets interpolation accumulator.
   */
  acquireRenderSnapshot(sharedBridge: SharedMemoryBridge, renderTimestamp = performance.now()): RenderSnapshotSample {
    const ctrl = sharedBridge.ctrlInt32;
    const tick = Atomics.load(ctrl, CTRL.SIM_TICK) >>> 0;

    if (tick > this.lastSampledTick) {
      this.lastSampledTick = tick;
      this.previousReadSlot = this.currentReadSlot;

      // Atomically swap our current read slot into clean_slot and acquire new clean slot
      const newReadSlot = Atomics.exchange(ctrl, CTRL.CLEAN_SLOT, this.currentReadSlot);
      this.currentReadSlot = newReadSlot;
      Atomics.store(ctrl, CTRL.READ_SLOT, newReadSlot);

      this.lastTickTimestamp = renderTimestamp;

      return {
        hasNewSnapshot: true,
        readSlot: this.currentReadSlot,
        prevReadSlot: this.previousReadSlot,
        simTick: tick,
        alpha: 0.0,
      };
    }

    // Calculate Hermite / linear interpolation alpha [0.0 .. 1.0]
    const elapsedSinceTick = renderTimestamp - this.lastTickTimestamp;
    const alpha = Math.min(1.0, Math.max(0.0, elapsedSinceTick / this.tickIntervalMs));

    return {
      hasNewSnapshot: false,
      readSlot: this.currentReadSlot,
      prevReadSlot: this.previousReadSlot,
      simTick: this.lastSampledTick,
      alpha,
    };
  }

  /**
   * Enqueues a user command into the circular SPSC ring buffer in SharedArrayBuffer.
   * Returns `true` if enqueued successfully, or `false` if the queue is full.
   */
  enqueueUserCommand(sharedBridge: SharedMemoryBridge, cmd: UserCommandInput): boolean {
    const ctrl = sharedBridge.ctrlInt32;
    const head = Atomics.load(ctrl, CTRL.INPUT_HEAD);
    const tail = Atomics.load(ctrl, CTRL.INPUT_TAIL);

    const nextHead = (head + 1) % COMMAND_QUEUE_CAPACITY;
    if (nextHead === tail) {
      // Queue is full (backpressure)
      return false;
    }

    const byteOffset = (head % COMMAND_QUEUE_CAPACITY) * COMMAND_PACKET_BYTE_SIZE;
    const queueBytes = sharedBridge.commandQueueBytes;
    const view = new DataView(queueBytes.buffer, queueBytes.byteOffset + byteOffset, COMMAND_PACKET_BYTE_SIZE);

    const timestamp = cmd.timestampMs ?? performance.now();

    view.setUint16(0, cmd.commandType, true);
    view.setUint16(2, cmd.flags ?? 0, true);
    view.setUint16(4, cmd.targetTileX, true);
    view.setUint16(6, cmd.targetTileY, true);
    view.setUint16(8, cmd.width ?? 1, true);
    view.setUint16(10, cmd.height ?? 1, true);
    view.setUint32(12, cmd.payloadParam ?? 0, true);
    view.setUint32(16, timestamp >>> 0, true);

    // Commit new head with Release semantics
    Atomics.store(ctrl, CTRL.INPUT_HEAD, nextHead);
    return true;
  }

  getCurrentReadSlot(): number {
    return this.currentReadSlot;
  }
}

/**
 * Producer (Simulation Worker): Commits snapshots and drains circular queue commands.
 */
export class TripleBufferProducer {
  private activeWriteSlot = 1;

  constructor(initialWriteSlot = 1) {
    this.activeWriteSlot = initialWriteSlot;
  }

  /**
   * Commits the active writing slot, swaps with clean_slot, and returns the next write slot.
   */
  commitSimulationSnapshot(sharedBridge: SharedMemoryBridge): number {
    const ctrl = sharedBridge.ctrlInt32;

    // Atomically swap activeWriteSlot into clean_slot
    const nextWriteSlot = Atomics.exchange(ctrl, CTRL.CLEAN_SLOT, this.activeWriteSlot);
    this.activeWriteSlot = nextWriteSlot;
    Atomics.store(ctrl, CTRL.WRITE_SLOT, nextWriteSlot);

    // Monotonically advance simulation tick
    Atomics.add(ctrl, CTRL.SIM_TICK, 1);

    return nextWriteSlot;
  }

  /**
   * Pops a single command from the circular SPSC ring buffer.
   * Returns the command or null if the queue is empty.
   */
  popUserCommand(sharedBridge: SharedMemoryBridge): UserCommandInput | null {
    const ctrl = sharedBridge.ctrlInt32;
    const tail = Atomics.load(ctrl, CTRL.INPUT_TAIL);
    const head = Atomics.load(ctrl, CTRL.INPUT_HEAD);

    if (tail === head) {
      return null; // Empty
    }

    const byteOffset = (tail % COMMAND_QUEUE_CAPACITY) * COMMAND_PACKET_BYTE_SIZE;
    const queueBytes = sharedBridge.commandQueueBytes;
    const view = new DataView(queueBytes.buffer, queueBytes.byteOffset + byteOffset, COMMAND_PACKET_BYTE_SIZE);

    const cmd: UserCommandInput = {
      commandType: view.getUint16(0, true),
      flags: view.getUint16(2, true),
      targetTileX: view.getUint16(4, true),
      targetTileY: view.getUint16(6, true),
      width: view.getUint16(8, true),
      height: view.getUint16(10, true),
      payloadParam: view.getUint32(12, true),
      timestampMs: view.getUint32(16, true),
    };

    const nextTail = (tail + 1) % COMMAND_QUEUE_CAPACITY;
    Atomics.store(ctrl, CTRL.INPUT_TAIL, nextTail);
    return cmd;
  }

  /**
   * Drains all queued commands in FIFO order.
   */
  drainUserCommands(sharedBridge: SharedMemoryBridge): UserCommandInput[] {
    const commands: UserCommandInput[] = [];
    let cmd: UserCommandInput | null;
    while ((cmd = this.popUserCommand(sharedBridge)) !== null) {
      commands.push(cmd);
    }
    return commands;
  }

  getActiveWriteSlot(): number {
    return this.activeWriteSlot;
  }
}

// ==========================================
// INTERPOLATION MATH UTILITIES
// ==========================================

/**
 * Linear interpolation between scalars
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Shortest-arc angular interpolation in radians
 */
export function slerpAngle(a: number, b: number, t: number): number {
  const PI2 = Math.PI * 2;
  let diff = (b - a) % PI2;
  diff = (diff + PI2 + Math.PI) % PI2 - Math.PI;
  return a + diff * t;
}
