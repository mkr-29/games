# GEMINI.md — Antigravity & Gemini Agent Operating Protocol

Welcome, Agent. You are an autonomous engineering agent working on **Prison Architect Web**. This document defines the operational directives, anti-hallucination guardrails, sub-agent delegation workflows, and post-implementation review checklists required to produce flawless, production-grade output.

This project is strictly governed by the overarching specifications in [AGENTS.md](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/AGENTS.md) and technical blueprints in `docs/`.

---

## 1. 🛡️ Anti-Hallucination & Grounding Directives

To eliminate hallucinations and prevent inaccurate code or architectural drift, follow these strict rules:

1. **Verify Before Coding:** Never guess struct layouts, memory buffer offsets, data types, function signatures, or file locations. Always inspect the relevant files (`view_file`, `grep_search`) and read the exact technical documentation in `docs/` first.
2. **Clickable Links for Grounded Citations:** Always ground references to files, symbols, and line numbers using clickable Markdown links (`[filename](file:///path/to/file#L1-L20)`).
3. **Check `PROJECT_STATE.json`:** Always inspect [PROJECT_STATE.json](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/PROJECT_STATE.json) or run `node scripts/check-progress.mjs` to determine the active task. Do not make assumptions about task status.
4. **No Phantom Dependencies or APIs:** Only use packages and crates already configured in [package.json](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/package.json) and [Cargo.toml](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/crates/simulation/Cargo.toml) unless explicitly instructed in the task specification.
5. **Acknowledge Ambiguities:** If a specification is ambiguous or an edge-case is unspecified in `docs/`, check existing implementation patterns or state your assumptions clearly before proceeding.

---

## 2. ⚡ Accelerating Tasks via Sub-Agents

Leverage sub-agents to parallelize work, reduce execution latency, and maintain a clean context window:

* **When to Spawn Sub-Agents:**
  - **Exploration & Research:** Deep code or specification lookup across multiple directories.
  - **Independent Module Implementation:** Developing isolated helper modules, shaders, or Rust algorithms that do not conflict.
  - **Comprehensive Test Suite Creation:** Writing extensive unit/integration test fixtures in parallel with implementation.
  - **Independent Code Review & Bug Audits:** Spawning a dedicated review sub-agent to audit freshly written code for edge cases and regressions.
* **Sub-Agent Prompting Protocol:**
  - Provide a clear, bounded task scope, explicit file paths, and unambiguous output formats.
  - Require sub-agents to ground findings with exact file paths and line numbers.
  - Collect and synthesize sub-agent outputs before integrating into the main codebase.

---

## 3. 🔄 Task Execution Standard Operating Procedure (SOP)

For every assigned task, execute this 5-stage loop without skipping steps:

```
┌────────────────────────────────────────────────────────┐
│ STAGE 1: DISCOVERY & SPEC GROUNDING                    │
│  - Run `node scripts/check-progress.mjs`               │
│  - Read task spec in `docs/implementation-plan/`       │
│  - Read architectural specs in `docs/`                 │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│ STAGE 2: SUB-AGENT DELEGATION & IMPLEMENTATION         │
│  - Dispatch parallel sub-agents for modular components │
│  - Write surgical, modular, zero-GC, typed code        │
│  - Maintain existing coding conventions & docstrings   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│ STAGE 3: MANDATORY TEST VERIFICATION                   │
│  - Run Rust tests: `cargo test --manifest-path ...`    │
│  - Run TS/Frontend tests: `npm test`                   │
│  - Verify all explicit Test Criteria in task spec      │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│ STAGE 4: POST-IMPLEMENTATION CODE REVIEW & BUG AUDIT   │
│  - Perform the 6-Point Bug Audit Checklist (Section 4) │
│  - Run linters and typechecks (`npm run check`)        │
│  - Fix any discovered issues or regressions            │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│ STAGE 5: STATE ADVANCEMENT & REPORTING                 │
│  - Update task status: `node scripts/update-task.mjs`  │
│  - Mark checkboxes `[x]` in phase doc and ROADMAP.md   │
│  - Present concise summary and recommended next task   │
└────────────────────────────────────────────────────────┘
```

---

## 4. 🔍 Mandatory Post-Implementation Bug & Quality Audit

Before marking any task as complete or concluding your response, rigorously evaluate the implementation against this audit checklist:

1. **Memory & Zero-GC in Hot Loops:**
   - [ ] Are there zero object allocations, closures, or array resizes inside per-tick simulation loops?
   - [ ] Are flat typed arrays, pre-allocated pools, or ECS archetypes properly used?
2. **Shared Memory & Concurrency Safety:**
   - [ ] Is `SharedArrayBuffer` synchronized via atomic pointer swaps without spinlocks or race conditions?
   - [ ] Are memory offsets aligned to 4/8-byte boundaries?
3. **Simulation Boundary Isolation:**
   - [ ] Is the simulation running purely in the Web Worker via Rust/WASM?
   - [ ] Is the main JS thread strictly limited to rendering, input capture, and Svelte UI?
4. **Numerical Stability & Edge Cases:**
   - [ ] Are division-by-zero, NaN, Inf, and integer overflow conditions safely handled in physics and math routines?
   - [ ] Are array lookups guarded against out-of-bounds indices?
5. **Pathfinding & AI Scalability:**
   - [ ] Do mass movements (e.g. Yard, Canteen, Sleep) utilize Dijkstra Flow Fields rather than hundreds of individual A* searches?
6. **Type Safety & Build Cleanliness:**
   - [ ] Does `npm run check` and `cargo check` compile with zero errors and no new warnings?

---

## 5. 🏛️ Core Architectural Invariants

* **Simulation:** Rust/WASM ECS (`bevy_ecs`) running exclusively inside Web Worker.
* **State Synchronization:** Triple-buffered `SharedArrayBuffer` with atomic index updates (zero-copy rendering).
* **Rendering Engine:** WebGPU instanced sprite batching with compute shader pipelines.
* **Mass Movement:** Dijkstra Flow Fields for crowd navigation; localized A* only for individual specific detours.
* **UI Layer:** Svelte 5 DOM overlay reading telemetry directly from typed arrays.
* **Fixed Timestep:** 30Hz/60Hz fixed simulation tick rate with render-thread transform interpolation.

---

## 6. 📂 Project Structure & Specs Map

| Path | Purpose |
| :--- | :--- |
| `crates/simulation/` | Rust WebAssembly simulation engine (`bevy_ecs`, physics, AI, flow fields) |
| `src/worker/` | Web Worker orchestrator managing WASM lifecycle and shared buffers |
| `src/render/` | WebGPU rendering pipeline, sprite instancing, camera, shaders |
| `src/ui/` | Svelte 5 management UI, dossiers, overlays, bureaucracy tree |
| `docs/` | Technical design specifications and architectural blueprints |
| `docs/implementation-plan/` | Phased task definitions and verification criteria |
| `scripts/` | Project state automation (`check-progress.mjs`, `update-task.mjs`) |

---

## 7. 🛠️ Essential Verification Commands

```bash
# 1. Check current task and progress
node scripts/check-progress.mjs

# 2. Build Rust simulation Wasm module
npm run build:wasm

# 3. Execute Rust unit & integration test suite
cargo test --manifest-path crates/simulation/Cargo.toml

# 4. Typecheck TypeScript and Svelte components
npm run check

# 5. Start local development server
npm run dev

# 6. Automatically mark completed task in PROJECT_STATE.json & docs
node scripts/update-task.mjs <TASK_ID>
```