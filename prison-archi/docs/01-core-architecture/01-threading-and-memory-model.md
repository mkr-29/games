# Domain 01: Core Architecture & Memory Model
## Feature Specification 01: Threading, SharedArrayBuffer & Lock-Free State Sync

---

## 1. System Overview & Problem Statement

In complex 2D simulation games like *Prison Architect*, thousands of autonomous entities perform continuous perception, utility calculation, pathfinding, and physics collision checks. In standard single-threaded browser applications, executing these tasks on the JavaScript main thread creates two crippling failure modes:
1. **Frame Drops:** Heavy simulation ticks (30–60ms) starve `requestAnimationFrame`, causing jerky scrolling, stuttering camera pans, and unresponsive UI controls.
2. **Garbage Collection (GC) Freezes:** Dynamic allocations in JavaScript periodically trigger engine-wide stop-the-world GC pauses (10–100ms).

This architecture implements a **Multi-Threaded Decoupled Worker Paradigm** using Rust compiled to WebAssembly (Wasm), Web Workers, and `SharedArrayBuffer` with atomic primitives. 

The **Simulation Worker** runs at a fixed tick rate (30Hz or 60Hz), while the **Main / Render Thread** runs at native display refresh rates (60Hz, 120Hz, or 144Hz) using **Hermite Cubic or Linear Transform Interpolation** across a lock-free triple buffer.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAIN THREAD (120/144 FPS)                       │
│  - Reads Transform Snapshot (Index: ReadSlot)                          │
│  - Interpolates: state = lerp(Snapshot[t-1], Snapshot[t], alpha)       │
│  - Dispatches WebGPU Render Pass                                       │
│  - Handles Svelte 5 DOM Events & User Input Commands                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Ring Buffer (InputQueue)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SHARED MEMORY (`SharedArrayBuffer`)                  │
│  - Header: Atomic Control Block (Spinlock-free Indices, Sequence IDs) │
│  - Triple-Buffered Render State Bank: [Slot 0] [Slot 1] [Slot 2]       │
│  - Circular Input Command Queue (SPSC Queue)                           │
│  - High-Level Telemetry & Danger Metrics                               │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Atomic Swap (WriteSlot)
┌───────────────────────────────────┴────────────────────────────────────┐
│                    SIMULATION WORKER (Rust Wasm 60Hz)                  │
│  - Consumes Commands from Circular Queue                               │
│  - Advances Fixed Timestep Simulation (`bevy_ecs`)                     │
│  - Writes Entity Positions, Rotations, Animations, Status Flags        │
│  - Atomic Store Release to mark buffer slot as `READY`                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Memory Layout & Buffer Architecture

The game allocates a contiguous `SharedArrayBuffer` upon initialization. This buffer is partitioned into static regions to avoid dynamic reallocation.

```
0x000000 ┌──────────────────────────────────────────────┐
         │ Header & Atomic Control Block (1,024 B)      │
0x000400 ├──────────────────────────────────────────────┤
         │ Input Command Ring Buffer (64 KB)            │
0x010400 ├──────────────────────────────────────────────┤
         │ UI Telemetry & Metric Buffers (16 KB)        │
0x014400 ├──────────────────────────────────────────────┤
         │ Render Snapshot Bank - Slot 0 (4 MB)         │
         ├──────────────────────────────────────────────┤
         │ Render Snapshot Bank - Slot 1 (4 MB)         │
         ├──────────────────────────────────────────────┤
         │ Render Snapshot Bank - Slot 2 (4 MB)         │
         └──────────────────────────────────────────────┘
```

### 2.1 The Render Entity Packed Struct
To maximize cache throughput and WebGPU upload efficiency, each renderable entity is packed into a tight 32-byte layout:

```rust
#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct RenderEntityPacked {
    pub entity_id: u32,       // Unique entity identifier
    pub pos_x: f32,           // World X coordinate (float32)
    pub pos_y: f32,           // World Y coordinate (float32)
    pub rotation: f32,        // Heading angle in radians
    pub sprite_index: u16,    // Atlas sprite ID (texture atlas index)
    pub anim_frame: u8,       // Current animation frame
    pub status_flags: u8,     // Bitflags: 0=Suppressed, 1=Handcuffed, 2=Fighting, 3=InSolitary...
    pub tint_rgba: u32,       // Packed RGBA8 color overlay (security tier uniform tint)
    pub elevation_layer: i8,  // -1=Tunnel/Subfloor, 0=Ground, 1=Upper/Rooftop
    pub _padding: [u8; 3],    // 32-byte alignment padding
}
```

With 32 bytes per entity, **131,072 entities** fit into a single 4 MB snapshot bank, comfortably exceeding the 10,000-inmate target while reserving room for staff, vehicles, and items.

---

## 3. Data Structures & Rust Implementation

### 3.1 The Atomic Control Block
Synchronization between the simulation producer and render consumer is governed by a lock-free Triple Buffer protocol.

```rust
use std::sync::atomic::{AtomicU32, Ordering};

pub const BUFFER_SLOTS: usize = 3;

#[repr(C)]
pub struct AtomicControlBlock {
    pub magic: u32,                     // 0x50524953 ("PRIS")
    pub version: u32,                   // Protocol version
    pub sim_tick: AtomicU32,            // Monotonically increasing simulation tick
    pub sim_time_ms: AtomicU32,         // Accumulated sim elapsed time
    
    // Triple-Buffer Slot Indices:
    // read_slot: Index currently being sampled by Render thread
    // write_slot: Index currently being prepared by Sim thread
    // clean_slot: Index holding the most recently committed complete snapshot
    pub read_slot: AtomicU32,
    pub write_slot: AtomicU32,
    pub clean_slot: AtomicU32,
    
    // Input Ring Buffer Indices (Single Producer, Single Consumer)
    pub input_head: AtomicU32,          // Written by Main Thread
    pub input_tail: AtomicU32,          // Read by Simulation Worker
    
    // Global Prison Metrics
    pub danger_level: AtomicU32,        // Scaled by 1000 (0..100_000)
    pub bank_balance: AtomicU32,        // Stored as cents
    pub prisoner_count: AtomicU32,
    pub guard_count: AtomicU32,
}
```

---

## 4. Algorithms & Synchronization Protocols

### 4.1 Producer (Simulation Worker) Commit Algorithm
At the conclusion of each simulation tick, the worker publishes the active snapshot buffer:

```rust
pub fn commit_simulation_snapshot(ctrl: &AtomicControlBlock, active_slot: u32) -> u32 {
    // 1. Mark the active slot as the newest 'clean' slot using Release ordering
    let previous_clean = ctrl.clean_slot.swap(active_slot, Ordering::Release);
    
    // 2. The next writing slot will be whatever was previously clean, 
    //    guaranteeing we never overwrite the slot currently being read.
    ctrl.write_slot.store(previous_clean, Ordering::Relaxed);
    
    // 3. Increment the simulation tick counter to notify readers
    ctrl.sim_tick.fetch_add(1, Ordering::Release);
    
    previous_clean
}
```

### 4.2 Consumer (Main / Render Thread) Read Algorithm
Before generating draw calls, the render thread checks if a newer snapshot has been committed:

```rust
pub fn acquire_render_snapshot(ctrl: &AtomicControlBlock, current_read_slot: &mut u32) -> bool {
    let clean = ctrl.clean_slot.load(Ordering::Acquire);
    
    // If the clean slot changed, swap our read slot with the clean slot
    if clean != *current_read_slot {
        *current_read_slot = clean;
        ctrl.read_slot.store(clean, Ordering::Release);
        true // New frame available
    } else {
        false // Stale snapshot; interpolate using existing historical buffer
    }
}
```

### 4.3 Lock-Free Interpolation Formula
Because the render thread runs at higher frequencies than the simulation worker (e.g. 120Hz vs 60Hz), entities are smoothly interpolated:

$$\alpha = \frac{T_{\text{render}} - T_{\text{prev\_tick}}}{T_{\text{curr\_tick}} - T_{\text{prev\_tick}}}$$

$$\text{Position}_{\text{rendered}} = \text{lerp}(\vec{P}_{\text{prev}}, \vec{P}_{\text{curr}}, \alpha)$$

$$\text{Angle}_{\text{rendered}} = \text{slerp}(\theta_{\text{prev}}, \theta_{\text{curr}}, \alpha)$$

---

## 5. Input Command Queue (Main Thread to Worker)

User clicks, tool deployments, zoning changes, and regime edits are serialized as fixed-size command packets into a single-producer single-consumer (SPSC) circular queue.

```rust
#[repr(C)]
#[derive(Clone, Copy)]
pub struct UserCommandPacket {
    pub command_type: u16,    // 1=PlaceWall, 2=ZoneRoom, 3=AssignGuard, 4=Lockdown...
    pub flags: u16,           // Shift-drag, immediate, cancel
    pub target_tile_x: u16,
    pub target_tile_y: u16,
    pub width: u16,
    pub height: u16,
    pub payload_param: u32,   // RoomType enum / Material ID / Entity ID
    pub timestamp_ms: u32,
}
```

### Queue Execution Loop
* **Main Thread:** Writes to `input_head`. If `(head + 1) % QUEUE_CAPACITY == tail`, the queue is full; the main thread queues an overflow buffer rather than dropping input.
* **Simulation Worker:** At the start of each simulation tick, reads from `input_tail` up to `input_head`, dispatching corresponding ECS command systems.

---

## 6. Edge Cases & Resilience Engineering

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Worker Thread Death** | Simulation hangs; screen freezes or renders ghost interpolation. | Main thread heartbeat monitor: If `sim_tick` fails to advance for 3,000ms, display a recovery banner, terminate the worker, and spawn a new worker with the latest state snapshot. |
| **Cross-Origin Isolation Missing** | `SharedArrayBuffer` is undefined if headers `COOP: same-origin` and `COEP: require-corp` are missing. | Pre-flight environment check on initialization. If unsupported, automatically fall back to Web Worker `postMessage` with transferable `ArrayBuffer` swapping. |
| **Memory Desynchronization** | Render thread reads partial entity writes if indices desync. | Double-word atomic indices with memory barrier fences (`Ordering::Acquire` / `Ordering::Release`). |
| **Tab Minimization / Throttle** | Browser throttles worker timers down to 1Hz or freezes them completely. | Simulation tracks actual elapsed delta time via `performance.now()`. When resumed, catches up using fixed-step sub-ticks clamped to a maximum catch-up ceiling of 5 ticks to prevent a "spiral of death." |
