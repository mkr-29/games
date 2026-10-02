# Claude & Antigravity Agent Guidelines

See [AGENTS.md](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/AGENTS.md) for full autonomous agent protocols and operating instructions.

## Quick Reference
1. **Current Status:** Run `node scripts/check-progress.mjs` to identify the active task.
2. **Implementation Plan:** See `docs/implementation-plan/ROADMAP.md` and phase files `01` through `07`.
3. **Architecture Invariants:**
   - Rust/Wasm ECS (`bevy_ecs`) in Web Worker.
   - Triple-buffered `SharedArrayBuffer` with atomic spinlock-free indices.
   - WebGPU instanced sprite batching + compute shaders.
   - Flow Fields (Dijkstra maps) for mass agent movement.
   - Svelte 5 DOM overlay for HUD, dossiers, and bureaucracy tree.
4. **Execution Protocol:**
   - Execute one atomic task at a time.
   - Verify task test criteria before marking complete `[x]`.
   - Update `PROJECT_STATE.json` and checklist on completion.
