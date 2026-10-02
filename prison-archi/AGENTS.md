# AGENTS.md — Autonomous Agent Operating Protocol

Welcome, Agent. You are an autonomous engineering agent pair-programming on **Prison Architect Web**. 

Your objective is to implement the game end-to-end according to the specifications in `docs/` and the phased implementation plan in `docs/implementation-plan/`.

---

## 1. Golden Rules for Agent Execution

1. **Strict Plan Adherence:** Never invent features, change architectures, or skip ahead. Work strictly task-by-task as defined in `docs/implementation-plan/`.
2. **Context Window Safety (One Task at a Time):** Focus exclusively on the single current task. Do not try to implement an entire phase in a single prompt.
3. **Spec-Grounded Implementation:** Before writing code, you **MUST** read the corresponding technical specification in `docs/` (e.g. data structs, memory offsets, algorithms).
4. **Mandatory Verification Gate:** Never mark a task as complete `[x]` until you have run the explicit verification tests specified in the task description and confirmed they pass.
5. **Update State Immediately:** As soon as a task passes verification:
   - Mark the task `[x]` in its phase document (`docs/implementation-plan/0X-*.md`).
   - Mark the task `[x]` in the master roadmap (`docs/implementation-plan/ROADMAP.md`).
   - Update `PROJECT_STATE.json` (or run `node scripts/update-task.mjs <TASK_ID>`).

---

## 2. Standard Operating Procedure (SOP) per Task

Follow this exact loop for every interaction:

```
┌────────────────────────────────────────────────────────┐
│ STEP 1: IDENTIFY CURRENT TASK                          │
│  - Check `PROJECT_STATE.json` or run:                  │
│    `node scripts/check-progress.mjs`                   │
│  - Read the task definition in `docs/implementation-   │
│    plan/0X-<phase>.md`                                 │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│ STEP 2: LOAD RELEVANT TECHNICAL SPECS                  │
│  - Open the linked feature doc in `docs/`              │
│  - Note exact memory offsets, struct layouts, formulas │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│ STEP 3: SURGICAL IMPLEMENTATION                        │
│  - Write clean, modular, production-grade code         │
│  - Avoid monolithic files; adhere to directory layouts │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│ STEP 4: VERIFY & TEST                                  │
│  - Run unit tests: `cargo test` / `npm test`           │
│  - Verify all items in the task's "Test Criteria"      │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│ STEP 5: COMMIT & ADVANCE CHECKLIST                     │
│  - Check off `[x]` in Phase doc and ROADMAP.md         │
│  - Update `PROJECT_STATE.json`                         │
│  - Report results and recommend next task to user      │
└────────────────────────────────────────────────────────┘
```

---

## 3. Non-Negotiable Architectural Invariants

* **Multi-Threaded Worker Separation:** The simulation **NEVER** runs on the main thread. It runs inside the Web Worker in Rust/Wasm.
* **Shared Memory Integrity:** State sync uses the **Triple-Buffered `SharedArrayBuffer`** with atomic pointer swaps. Never pass heavy state snapshots over `postMessage` JSON.
* **Navigation Scaling:** Collective prisoner movements (Chow, Yard, Sleep) **MUST** use **Flow Fields (Dijkstra maps)**. Never spawn hundreds of individual A* searches.
* **Zero GC in Hot Loops:** No dynamic allocations or array re-allocations inside per-tick simulation loops. Use pre-allocated object pools, flat arrays, and ECS archetypes.
* **Fixed Timestep:** Simulation ticks at fixed 30Hz or 60Hz. The render thread interpolates transforms at the native display refresh rate (120Hz/144Hz).
* **UI Isolation:** Management HUD and dossiers are built in **Svelte 5** as a DOM overlay, reading telemetry via zero-copy typed arrays from `SharedArrayBuffer`.

---

## 4. Useful Project Commands

```bash
# Check current progress and active task:
node scripts/check-progress.mjs

# Build simulation Wasm:
npm run build:wasm

# Run Rust unit tests:
cargo test --manifest-path crates/simulation/Cargo.toml

# Start frontend development server:
npm run dev

# Mark a task complete automatically:
node scripts/update-task.mjs TASK-1.1
```
