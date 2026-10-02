---
trigger: always_on
description: Coding and style standards for Rust, TypeScript, WGSL, and Svelte 5
---

# Code & Style Standards

### Rust (Simulation Worker)
- Target: `wasm32-unknown-unknown` via `wasm-pack` / `wasm-bindgen`.
- Edition: 2021.
- Formatting: `cargo fmt` and `cargo clippy`.
- ECS: Use `bevy_ecs`. Do not store OOP inheritance trees.
- Structs passed across Wasm boundary must use `#[repr(C)]` and implement `bytemuck::Pod` + `bytemuck::Zeroable` where applicable.
- Concurrency: Use `std::sync::atomic::{AtomicU32, Ordering}` with explicit memory ordering (`Acquire`, `Release`, `Relaxed`). Avoid mutexes in hot loops.

### TypeScript & Svelte 5 (UI & Platform)
- Strict mode enabled (`tsconfig.json`).
- Svelte: Use **Svelte 5 Runes** (`$state`, `$derived`, `$effect`, `$props`). Do not use legacy Svelte 3/4 reactive declarations (`let count = 0; $: double = count * 2`).
- WebGPU: Check `navigator.gpu` before acquisition. Handle context loss via `device.lost`.
- SharedArrayBuffer: Wrap all shared memory reads in `Atomics.load` / `Atomics.store`.

### WGSL (Shaders)
- Vertex and fragment functions must be strictly typed.
- Align uniform buffers to 16-byte boundaries (std140 / std430 rules).
- Keep compute workgroup sizes at multiples of 32 or 64 (e.g. `@workgroup_size(16, 16)` or `@workgroup_size(64)`).
