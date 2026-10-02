/**
 * SharedMemoryBridge.ts
 * 
 * Manages the contiguous SharedArrayBuffer partitioned across:
 * - 0x000000: Header & Atomic Control Block (1 KB)
 * - 0x000400: Input Command Ring Buffer (64 KB)
 * - 0x010400: Telemetry & Metrics (16 KB)
 * - 0x014400: Triple-Buffered Render Snapshots (3 x 4 MB = 12 MB)
 * Total Size: 12,665,856 Bytes
 */

export const MAGIC_PRIS = 0x50524953; // "PRIS" in ASCII
export const PROTOCOL_VERSION = 1;
export const BUFFER_SLOTS = 3;

// Memory Partition Offsets & Sizes (in Bytes)
export const HEADER_OFFSET = 0x000000;
export const HEADER_SIZE = 1024; // 1 KB

export const COMMAND_QUEUE_OFFSET = 0x000400;
export const COMMAND_QUEUE_SIZE = 64 * 1024; // 64 KB

export const TELEMETRY_OFFSET = 0x010400;
export const TELEMETRY_SIZE = 16 * 1024; // 16 KB

export const SNAPSHOT_BANK_OFFSET = 0x014400;
export const SNAPSHOT_SLOT_SIZE = 4 * 1024 * 1024; // 4 MB per slot
export const TOTAL_SHARED_MEMORY_SIZE = SNAPSHOT_BANK_OFFSET + (SNAPSHOT_SLOT_SIZE * BUFFER_SLOTS); // 12,665,856 B

export const ENTITY_BYTE_SIZE = 32;
export const MAX_ENTITIES_PER_SLOT = SNAPSHOT_SLOT_SIZE / ENTITY_BYTE_SIZE; // 131,072 entities

// Atomic Control Block Word Offsets (Each word is 4 bytes / 32 bits)
export const CTRL = {
  MAGIC: 0,              // 0x50524953
  VERSION: 1,            // Protocol version (1)
  SIM_TICK: 2,           // Monotonically increasing simulation tick
  SIM_TIME_MS: 3,        // Accumulated simulation time in milliseconds
  READ_SLOT: 4,          // Slot currently read by render thread (0..2)
  WRITE_SLOT: 5,         // Slot currently written by simulation worker (0..2)
  CLEAN_SLOT: 6,         // Most recent complete snapshot (0..2)
  INPUT_HEAD: 7,         // SPSC circular queue head (Main thread writes)
  INPUT_TAIL: 8,         // SPSC circular queue tail (Worker reads)
  DANGER_LEVEL: 9,       // Scaled by 1000 (0..100,000 => 0.0..100.0%)
  BANK_BALANCE: 10,      // Integer cents ($40,000.00 = 4,000,000)
  PRISONER_COUNT: 11,    // Active prisoner count
  GUARD_COUNT: 12,       // Active guard count
} as const;

export interface SimulationMetrics {
  simTick: number;
  simTimeMs: number;
  readSlot: number;
  writeSlot: number;
  cleanSlot: number;
  dangerLevel: number;
  bankBalance: number;
  prisonerCount: number;
  guardCount: number;
}

export class SharedMemoryBridge {
  readonly buffer: SharedArrayBuffer;

  // Int32Array view for atomic control operations (Header)
  readonly ctrlInt32: Int32Array;

  // Typed views into each 4MB snapshot slot
  readonly snapshotSlotsFloat32: [Float32Array, Float32Array, Float32Array];
  readonly snapshotSlotsUint32: [Uint32Array, Uint32Array, Uint32Array];
  readonly snapshotSlotsUint8: [Uint8Array, Uint8Array, Uint8Array];

  // Command ring buffer view (64KB)
  readonly commandQueueBytes: Uint8Array;
  readonly commandQueueUint32: Uint32Array;

  // Telemetry buffer view (16KB)
  readonly telemetryBytes: Uint8Array;
  readonly telemetryFloat32: Float32Array;

  // Cache for local read tracking in main thread
  private lastObservedCleanSlot = 2;

  constructor(existingBuffer?: SharedArrayBuffer) {
    if (existingBuffer) {
      if (existingBuffer.byteLength !== TOTAL_SHARED_MEMORY_SIZE) {
        throw new Error(
          `Invalid SharedArrayBuffer size: expected ${TOTAL_SHARED_MEMORY_SIZE} bytes, got ${existingBuffer.byteLength}`
        );
      }
      this.buffer = existingBuffer;
    } else {
      if (typeof SharedArrayBuffer === 'undefined') {
        throw new Error('SharedArrayBuffer is not supported in this environment. Ensure COOP/COEP headers are set.');
      }
      this.buffer = new SharedArrayBuffer(TOTAL_SHARED_MEMORY_SIZE);
    }

    // Map Header Int32 view for atomics (1024 bytes = 256 words)
    this.ctrlInt32 = new Int32Array(this.buffer, HEADER_OFFSET, HEADER_SIZE / 4);

    // Map Command Queue (64 KB)
    this.commandQueueBytes = new Uint8Array(this.buffer, COMMAND_QUEUE_OFFSET, COMMAND_QUEUE_SIZE);
    this.commandQueueUint32 = new Uint32Array(this.buffer, COMMAND_QUEUE_OFFSET, COMMAND_QUEUE_SIZE / 4);

    // Map Telemetry (16 KB)
    this.telemetryBytes = new Uint8Array(this.buffer, TELEMETRY_OFFSET, TELEMETRY_SIZE);
    this.telemetryFloat32 = new Float32Array(this.buffer, TELEMETRY_OFFSET, TELEMETRY_SIZE / 4);

    // Map Snapshot Slots (3 x 4 MB)
    const slot0Offset = SNAPSHOT_BANK_OFFSET;
    const slot1Offset = SNAPSHOT_BANK_OFFSET + SNAPSHOT_SLOT_SIZE;
    const slot2Offset = SNAPSHOT_BANK_OFFSET + (SNAPSHOT_SLOT_SIZE * 2);

    this.snapshotSlotsFloat32 = [
      new Float32Array(this.buffer, slot0Offset, SNAPSHOT_SLOT_SIZE / 4),
      new Float32Array(this.buffer, slot1Offset, SNAPSHOT_SLOT_SIZE / 4),
      new Float32Array(this.buffer, slot2Offset, SNAPSHOT_SLOT_SIZE / 4),
    ];

    this.snapshotSlotsUint32 = [
      new Uint32Array(this.buffer, slot0Offset, SNAPSHOT_SLOT_SIZE / 4),
      new Uint32Array(this.buffer, slot1Offset, SNAPSHOT_SLOT_SIZE / 4),
      new Uint32Array(this.buffer, slot2Offset, SNAPSHOT_SLOT_SIZE / 4),
    ];

    this.snapshotSlotsUint8 = [
      new Uint8Array(this.buffer, slot0Offset, SNAPSHOT_SLOT_SIZE),
      new Uint8Array(this.buffer, slot1Offset, SNAPSHOT_SLOT_SIZE),
      new Uint8Array(this.buffer, slot2Offset, SNAPSHOT_SLOT_SIZE),
    ];
  }

  /**
   * Initializes the Atomic Control Block with default values.
   */
  initializeControlBlock(initialBalanceCents: number = 4_000_000): void {
    Atomics.store(this.ctrlInt32, CTRL.MAGIC, MAGIC_PRIS);
    Atomics.store(this.ctrlInt32, CTRL.VERSION, PROTOCOL_VERSION);
    Atomics.store(this.ctrlInt32, CTRL.SIM_TICK, 0);
    Atomics.store(this.ctrlInt32, CTRL.SIM_TIME_MS, 0);
    Atomics.store(this.ctrlInt32, CTRL.READ_SLOT, 0);
    Atomics.store(this.ctrlInt32, CTRL.WRITE_SLOT, 1);
    Atomics.store(this.ctrlInt32, CTRL.CLEAN_SLOT, 2);
    Atomics.store(this.ctrlInt32, CTRL.INPUT_HEAD, 0);
    Atomics.store(this.ctrlInt32, CTRL.INPUT_TAIL, 0);
    Atomics.store(this.ctrlInt32, CTRL.DANGER_LEVEL, 0);
    Atomics.store(this.ctrlInt32, CTRL.BANK_BALANCE, initialBalanceCents);
    Atomics.store(this.ctrlInt32, CTRL.PRISONER_COUNT, 0);
    Atomics.store(this.ctrlInt32, CTRL.GUARD_COUNT, 0);
  }

  /**
   * Verifies if the buffer contains a valid initialized control block.
   */
  isValid(): boolean {
    const magic = Atomics.load(this.ctrlInt32, CTRL.MAGIC);
    const version = Atomics.load(this.ctrlInt32, CTRL.VERSION);
    return magic === MAGIC_PRIS && version === PROTOCOL_VERSION;
  }

  // ==========================================
  // ATOMIC CONTROL ACCESSORS
  // ==========================================

  getSimTick(): number {
    return Atomics.load(this.ctrlInt32, CTRL.SIM_TICK) >>> 0;
  }

  getSimTimeMs(): number {
    return Atomics.load(this.ctrlInt32, CTRL.SIM_TIME_MS) >>> 0;
  }

  getReadSlot(): number {
    return Atomics.load(this.ctrlInt32, CTRL.READ_SLOT);
  }

  getWriteSlot(): number {
    return Atomics.load(this.ctrlInt32, CTRL.WRITE_SLOT);
  }

  getCleanSlot(): number {
    return Atomics.load(this.ctrlInt32, CTRL.CLEAN_SLOT);
  }

  getDangerLevel(): number {
    const raw = Atomics.load(this.ctrlInt32, CTRL.DANGER_LEVEL);
    return raw / 1000.0;
  }

  getBankBalance(): number {
    const cents = Atomics.load(this.ctrlInt32, CTRL.BANK_BALANCE);
    return cents / 100.0;
  }

  getPrisonerCount(): number {
    return Atomics.load(this.ctrlInt32, CTRL.PRISONER_COUNT);
  }

  getGuardCount(): number {
    return Atomics.load(this.ctrlInt32, CTRL.GUARD_COUNT);
  }

  // ==========================================
  // LOCK-FREE CONSUMER (RENDER THREAD) METHODS
  // ==========================================

  /**
   * Checks if a new simulation snapshot has been committed.
   * If yes, updates the read slot atomically and returns the active read slot.
   */
  acquireRenderSnapshot(): { hasNewSnapshot: boolean; readSlot: number; simTick: number } {
    const clean = Atomics.load(this.ctrlInt32, CTRL.CLEAN_SLOT);
    const tick = this.getSimTick();

    if (clean !== this.lastObservedCleanSlot) {
      this.lastObservedCleanSlot = clean;
      Atomics.store(this.ctrlInt32, CTRL.READ_SLOT, clean);
      return { hasNewSnapshot: true, readSlot: clean, simTick: tick };
    }

    return { hasNewSnapshot: false, readSlot: this.lastObservedCleanSlot, simTick: tick };
  }

  // ==========================================
  // PRODUCER (SIMULATION WORKER) METHODS
  // ==========================================

  /**
   * Advances the simulation tick monotonically and updates elapsed time atomically.
   */
  stepSimulationTick(elapsedMs?: number): number {
    const nextTick = Atomics.add(this.ctrlInt32, CTRL.SIM_TICK, 1) + 1;
    if (elapsedMs !== undefined) {
      Atomics.store(this.ctrlInt32, CTRL.SIM_TIME_MS, elapsedMs);
    }
    return nextTick;
  }

  /**
   * Commits the active writing snapshot slot into clean_slot and rotates slots (lock-free).
   */
  commitSimulationSnapshot(activeSlot: number): number {
    const previousClean = Atomics.exchange(this.ctrlInt32, CTRL.CLEAN_SLOT, activeSlot);
    Atomics.store(this.ctrlInt32, CTRL.WRITE_SLOT, previousClean);
    Atomics.add(this.ctrlInt32, CTRL.SIM_TICK, 1);
    return previousClean;
  }

  /**
   * Returns a complete snapshot of simulation metrics for UI consumption.
   */
  getMetrics(): SimulationMetrics {
    return {
      simTick: this.getSimTick(),
      simTimeMs: this.getSimTimeMs(),
      readSlot: this.getReadSlot(),
      writeSlot: this.getWriteSlot(),
      cleanSlot: this.getCleanSlot(),
      dangerLevel: this.getDangerLevel(),
      bankBalance: this.getBankBalance(),
      prisonerCount: this.getPrisonerCount(),
      guardCount: this.getGuardCount(),
    };
  }
}
