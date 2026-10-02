# Phase 01: Foundations, Threading & Memory Model

**Goal:** Establish the multi-threaded foundation, zero-copy `SharedArrayBuffer` memory layout, atomic triple-buffering synchronization, and the fixed-timestep ECS execution pipeline.

---

## Task Matrix & Checklist

- [ ] **Task 1.1:** Project Repository Scaffolding & Web Worker Setup
- [ ] **Task 1.2:** SharedArrayBuffer Layout & Atomic Control Block
- [ ] **Task 1.3:** Triple-Buffered State Sync & Lock-Free Input Queue
- [ ] **Task 1.4:** Fixed-Timestep Simulation Loop & Bevy ECS Stage Pipeline

---

## Detailed Task Specifications

### Task 1.1: Project Repository Scaffolding & Web Worker Setup
* **Context & Specifications:** Reference [`docs/README.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/README.md).
* **Objective:** Initialize the monorepo structure containing the Rust Wasm simulation crate and the Vite + Svelte 5 frontend, configured with mandatory cross-origin isolation headers.
* **Prerequisites:** None (Initial setup).
* **Deliverables:**
  * Root `package.json` with scripts for `dev`, `build`, and `build:wasm`.
  * `vite.config.ts` configuring plugins (`@sveltejs/vite-plugin-svelte`, `vite-plugin-wasm`) and server headers:
    * `Cross-Origin-Opener-Policy: same-origin`
    * `Cross-Origin-Embedder-Policy: require-corp`
  * Rust crate in `crates/simulation` with `Cargo.toml` (`crate-type = ["cdylib", "rlib"]`, dependencies: `wasm-bindgen`, `bevy_ecs`, `rayon`, `bytemuck`).
  * Web Worker bootstrap file `src/workers/simulation.worker.ts` that instantiates the compiled Wasm module.
* **Verification & Test Criteria:**
  1. Running `npm run dev` boots the Vite server without errors.
  2. Inspecting `window.crossOriginIsolated` in the browser console returns `true`.
  3. The simulation worker successfully loads the compiled Wasm binary and logs a handshake ping to the console.

---

### Task 1.2: SharedArrayBuffer Layout & Atomic Control Block
* **Context & Specifications:** Reference [`docs/01-core-architecture/01-threading-and-memory-model.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/01-core-architecture/01-threading-and-memory-model.md).
* **Objective:** Implement the contiguous shared memory partition, atomic control header, and TypeScript buffer views.
* **Prerequisites:** Task 1.1 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/memory/layout.rs`):
    * Define `#[repr(C)] pub struct AtomicControlBlock` with `AtomicU32` indices for read, write, and clean slots.
    * Define `#[repr(C)] pub struct RenderEntityPacked` (32 bytes).
    * Validation function ensuring total memory offsets match expected partition boundaries (Header: 1KB, Queue: 64KB, Telemetry: 16KB, Snapshot Slots: 4MB each).
  * In TypeScript (`src/lib/memory/SharedMemoryBridge.ts`):
    * Allocate `new SharedArrayBuffer(TOTAL_BYTE_SIZE)`.
    * Expose typed views (`Int32Array`, `Float32Array`) mapped to exact memory offsets.
* **Verification & Test Criteria:**
  1. Unit test in Rust asserting `std::mem::size_of::<RenderEntityPacked>() == 32`.
  2. Unit test verifying that memory written by the TypeScript main thread into the SharedArrayBuffer header is correctly read by the Rust Wasm worker via atomics.

---

### Task 1.3: Triple-Buffered State Sync & Lock-Free Input Queue
* **Context & Specifications:** Reference [`docs/01-core-architecture/01-threading-and-memory-model.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/01-core-architecture/01-threading-and-memory-model.md).
* **Objective:** Build the lock-free triple-buffer producer/consumer protocol and the circular SPSC user command input queue.
* **Prerequisites:** Task 1.2 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/memory/triple_buffer.rs`):
    * `commit_simulation_snapshot()` executing atomic swap of `clean_slot` with `write_slot`.
    * `pop_user_command()` draining `UserCommandPacket` elements from the circular ring buffer.
  * In TypeScript (`src/lib/memory/TripleBufferConsumer.ts`):
    * `acquireRenderSnapshot()` reading the newest clean slot and interpolating positions across frames.
    * `enqueueUserCommand(packet)` writing player commands to `input_head`.
* **Verification & Test Criteria:**
  1. Headless stress test: Producer thread commits 1,000 snapshots at 60Hz while Consumer thread reads at 144Hz. Assert zero torn reads, deadlocks, or slot race conditions.
  2. Test enqueueing 100 commands from the main thread; assert the simulation worker consumes them in exact FIFO order.

---

### Task 1.4: Fixed-Timestep Simulation Loop & Bevy ECS Stage Pipeline
* **Context & Specifications:** Reference [`docs/01-core-architecture/02-ecs-architecture-and-tick-loop.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/01-core-architecture/02-ecs-architecture-and-tick-loop.md).
* **Objective:** Implement the fixed-timestep simulation accumulator and instantiate the `bevy_ecs` World with strict stage ordering.
* **Prerequisites:** Task 1.3 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/ecs/mod.rs`):
    * Initialize `bevy_ecs::world::World` and `Schedule`.
    * Define stage enum (`InputIngestion`, `SpatialUpdate`, `PerceptionAI`, `Pathfinding`, `Physics`, `Combat`, `Economy`, `RenderCommit`).
    * Implement the tick accumulator logic clamped to a maximum of 4 sub-ticks per frame to prevent the "spiral of death."
    * Register basic spatial components: `Position`, `Velocity`, `Renderable`.
* **Verification & Test Criteria:**
  1. Run simulation worker for 10 simulated seconds. Verify via console metrics that the simulation executes exactly 60 ticks per in-game second ($\pm 0.5\%$).
  2. Integration test spawning 1,000 dummy moving entities; verify positions update deterministically across ticks and serialize into the render buffer.
