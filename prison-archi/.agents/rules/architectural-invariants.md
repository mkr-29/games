---
trigger: always_on
description: Non-negotiable architectural and engine constraints for Prison Architect Web
---

# Architectural Invariants & Constraints

The following technical decisions are strictly enforced and must never be violated:

1. **Simulation Threading:**
   - The ECS simulation must run in a Web Worker compiled from Rust to WebAssembly.
   - The main JavaScript thread is reserved exclusively for DOM UI (Svelte 5), WebGPU render dispatch, and user input capture.

2. **Memory Layout & Synchronization:**
   - Communication between the Simulation Worker and Main Thread must use `SharedArrayBuffer` with atomic spinlock-free indices.
   - Render entities use the packed 32-byte `RenderEntityPacked` struct.
   - The render thread samples a triple-buffer with linear/Hermite interpolation.

3. **Navigation Architecture:**
   - Collective movement (Canteen, Yard, Sleep, Lockdown) must use **Flow Fields (Dijkstra maps)**.
   - Individual navigation uses Hierarchical Pathfinding (HPA*) on 16x16 clusters.
   - Local avoidance uses RVO2 / ORCA.

4. **Performance & Memory Allocation:**
   - Zero dynamic allocations inside per-tick simulation loops.
   - Pre-allocate object pools, continuous entity archetypes, and flat tile arrays.
   - Frustum cull 32x32 chunks before submitting draw commands.

5. **Persistence:**
   - Storage uses OPFS (Origin Private File System) with zero-copy binary serialization (`bincode` / `rkyv`) and Zstandard compression.
   - Do not use `localStorage` for map saves.
