# Prison Architect Web: AI Agent Phased Implementation Plan

## 1. Plan Philosophy & Agent Execution Rules

This implementation plan is specifically calibrated for **autonomous and pair-programming AI coding agents**. 

### The "Context Window" Safety Rules:
1. **Atomic Task Scope:** Each task is sized to be executed in a single, focused session without exceeding agent context limits.
2. **Strict Prerequisite Chains:** Tasks only depend on previously completed tasks; an agent should never need to jump ahead or write speculative stub code.
3. **Explicit Verification Criteria:** Every single task contains concrete, testable verification steps (unit tests, headless Wasm tests, or visual canvas checks) that the agent must execute and confirm **before** checking off the task.
4. **Living Checklist:** AI agents will mark tasks as complete `[x]` as they proceed, leaving a clean audit trail for subsequent agents or human review.

---

## 2. Phase Overview & Dependency Graph

```
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Core Scaffolding, SharedArrayBuffer & ECS Tick Pipeline      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│ PHASE 2: 2D World Grid, Autotiling & WebGPU Instanced Renderer         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│ PHASE 3: Physical Utilities (Power/Water) & Room Enclosure Detection   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│ PHASE 4: Flow Field Navigation, Inmate Psychology & Regime Engine     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│ PHASE 5: Security Zoning, Contraband Economy, Combat & Riots          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│ PHASE 6: Logistics, Bureaucracy, Industrial Workshop & Economy         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│ PHASE 7: AudioWorklet Acoustics, Fog of War, OPFS Saves & Modding      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase Directory Map

Detailed, task-by-task specifications and checklists are housed in dedicated phase documents:

* **[Phase 1: Foundations, Threading & Memory Model](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/01-foundations-and-threading.md)**  
  *Cargo workspace, Wasm bindgen, Web Worker, SharedArrayBuffer triple-buffering, and bevy_ecs fixed tick loop.*
* **[Phase 2: World Grid, Materials & WebGPU Renderer](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/02-world-grid-and-rendering.md)**  
  *6-layer tile data structures, 4-bit autotiling, WebGPU 32x32 chunk instancing, camera controls, and basic construction drag tool.*
* **[Phase 3: Utilities & Room Enclosures](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/03-utilities-and-enclosures.md)**  
  *Disjoint-set electrical solver, BFS plumbing pressure decay, connected-components room enclosure flood-fill, and cell grading.*
* **[Phase 4: Navigation, Agent AI & Regime](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/04-navigation-and-agent-ai.md)**  
  *Dijkstra flow field generator, 15-need psychology decay engine, Utility AI state machines, and 24-hour regime timetable scheduler.*
* **[Phase 5: Security, Contraband & Combat](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/05-security-and-combat.md)**  
  *Clearance sector partitioning, physical contraband smuggling vectors, CCTV/surveillance automation, combat/riot escalation, and escape tunnels.*
* **[Phase 6: Economy, Logistics & Governance](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/06-economy-and-logistics.md)**  
  *Food and laundry loops, financial balance sheets, reactive DAG government grants, bureaucracy research tree, workshop manufacturing, and execution protocol.*
* **[Phase 7: Aesthetics, Persistence & Modding](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/07-polish-and-extensibility.md)**  
  *WebGPU compute Fog of War, AudioWorklet spatial sound, Svelte 5 management HUD, OPFS binary save/load, and Extism Wasm modding.*

---

## 4. Master Completion Checklist

| Phase | Description | Task Count | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Core Scaffolding, Threading & Memory Model | 4 Tasks | `[x] Complete (4/4 Completed - 100%)` |
| **Phase 2** | Tile Grid, Autotiling & WebGPU Renderer | 4 Tasks | `[x] Complete (4/4 Completed - 100%)` |
| **Phase 3** | Utilities (Power/Water) & Room Enclosure | 4 Tasks | `[x] Complete (4/4 Completed - 100%)` |
| **Phase 4** | Navigation, Inmate Psychology & Daily Regime | 4 Tasks | `[x] Complete (4/4 Completed - 100%)` |
| **Phase 5** | Security Zoning, Contraband, Combat & Riots | 4 Tasks | `[ ] Not Started` |
| **Phase 6** | Economy, Grants, Bureaucracy & Workshop | 4 Tasks | `[ ] Not Started` |
| **Phase 7** | Audio, Fog of War, OPFS Saves & Modding | 4 Tasks | `[ ] Not Started` |
| **TOTAL** | **Complete Game Implementation** | **28 Atomic Tasks** | **16/28 Completed (57%)** |
