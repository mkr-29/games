# Prison Architect Web: Technical Specification & Implementation Architecture

Welcome to the production engineering blueprint for **Prison Architect Web**, a high-performance, web-native reconstruction of the seminal prison management simulation game. 

This implementation is designed from the ground up to eliminate the technical bottlenecks of the original desktop title—scaling to **10,000+ active agents at a locked 120 FPS** with zero garbage collection stutter, sub-15ms auto-saves, and seamless cross-platform browser support.

---

## 1. System Architecture Overview

The application is structured into four decoupled layers running across independent execution contexts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MAIN THREAD (120 FPS)                         │
│  - User Input & Camera Controls (Pan / Smooth Zoom)                    │
│  - UI / HUD / Bureaucracy Tree / Regime Timetable (Svelte 5 / Solid)   │
│  - Audio Engine (AudioWorklet)                                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Ring Buffers / SharedArrayBuffer
┌───────────────────────────────────┴────────────────────────────────────┐
│                  SIMULATION WORKER (Rust + Wasm ECS)                   │
│  - Entity Component System (bevy_ecs / flecs)                          │
│  - Prisoner Psychology, Needs & Volatility                             │
│  - Room Logistics, Supply Chains & Utility Grid Solvers                │
│  - Contraband Heatmaps & Dynamic Security Checks                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Spatial Query / Flow Field Sync
┌───────────────────────────────────┴────────────────────────────────────┐
│                 PATHFINDING WORKER POOL (Rayon / Wasm)                 │
│  - Flow Field Generators (Dijkstra Maps for collective goals)          │
│  - Hierarchical Pathfinding (HPA* for long-range routing)              │
│  - Dynamic door permissions & tunnel detection                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ GPU Buffers
┌───────────────────────────────────┴────────────────────────────────────┐
│                         RENDERER (WebGPU / WGSL)                       │
│  - GPU Instancing for 50,000+ entities, walls, and decals              │
│  - Compute Shaders: Fog of War, Line of Sight, Utility Flow Animations │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Technology Stack

| Layer | Technology | Primary Rationale |
| :--- | :--- | :--- |
| **Simulation Engine** | **Rust + WebAssembly (Wasm)** | Predictable sub-millisecond execution, zero Garbage Collection pauses, memory safety, SIMD support. |
| **Architectural Model** | **Data-Oriented ECS (`bevy_ecs`)** | Cache-friendly archetype storage, parallel system dispatch, scales to 10,000+ agents. |
| **Rendering Engine** | **WebGPU + WGSL Compute Shaders** | Direct hardware control, single-pass instanced sprite batching, GPU-accelerated raymarching for Fog of War. |
| **State Synchronization** | **Triple-Buffered `SharedArrayBuffer`** | Lock-free atomics and ring buffers; decouples 30/60Hz simulation ticks from 120Hz+ render display refresh rates. |
| **Pathfinding** | **Flow Fields (Dijkstra Maps) + HPA\*** | Replaces $\mathcal{O}(N \times \text{A*})$ with single-pass vector field lookups for mass movements (chow time, yard, lockdown). |
| **User Interface** | **Svelte 5 (Runes) + Tailwind CSS** | Rich DOM-based HUD, accessible micro-interactions, hardware-accelerated CSS transitions, sub-pixel text rendering. |
| **Audio Subsystem** | **Web Audio API + `AudioWorklet`** | Thread-isolated spatial acoustics, dynamic low-pass wall occlusion, and procedural tension score. |
| **Persistence** | **OPFS (Origin Private File System) + Zstd** | Sub-15ms zero-copy binary serialization (`rkyv`/`bincode`), micro-file footprint (2–5 MB), bypasses 5MB browser limits. |
| **Modding Engine** | **Wasm Sandbox Plugins (Extism)** | Safe user-authored plugins running compiled Wasm modules (Rust, TypeScript, C) with zero host vulnerability. |

---

## 3. Documentation Map

Each feature document contains **production engineering-grade** specifications: conceptual game mechanics, Rust ECS data structures, algorithm pseudocode, memory layouts, UI synchronization protocols, and edge-case handling.

### Domain 01: Core Architecture & Memory Model
* [`01-core-architecture/01-threading-and-memory-model.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/01-core-architecture/01-threading-and-memory-model.md)  
  *Web Workers, SharedArrayBuffer layouts, atomic spinlocks, triple-buffering, and zero-copy interpolation.*
* [`01-core-architecture/02-ecs-architecture-and-tick-loop.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/01-core-architecture/02-ecs-architecture-and-tick-loop.md)  
  *Fixed-timestep tick scheduling, system stage ordering, determinism, and multi-core Rayon dispatch.*

### Domain 02: World Grid, Construction & Utilities
* [`02-construction-utilities/01-tile-grid-and-materials.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/01-tile-grid-and-materials.md)  
  *Multi-layer 2D tilemap (terrain, foundation, walls, objects, decals), bitmask autotiling, and structural durability.*
* [`02-construction-utilities/02-electrical-grid-solver.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/02-electrical-grid-solver.md)  
  *Graph-based disjoint-set circuit solver, isolated power station networks, capacitor overloads, and short-circuit cascades.*
* [`02-construction-utilities/03-plumbing-and-fluid-dynamics.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/03-plumbing-and-fluid-dynamics.md)  
  *Water pumps, pipe diameters, pressure drop algorithms, hot water boiler loops, and tunneling vulnerability.*
* [`02-construction-utilities/04-room-zoning-and-enclosure.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/04-room-zoning-and-enclosure.md)  
  *Connected-components flood fill for closed room detection, minimum area validation, and required equipment checks.*

### Domain 03: Inmate Simulation & Agent AI
* [`03-simulation-ai/01-pathfinding-flowfields-and-hpa.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/03-simulation-ai/01-pathfinding-flowfields-and-hpa.md)  
  *Dijkstra vector fields, cluster-based HPA\* routing, dynamic door weights, and emergency egress routing.*
* [`03-simulation-ai/02-inmate-needs-and-psychology.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/03-simulation-ai/02-inmate-needs-and-psychology.md)  
  *15-dimensional physiological and social needs hierarchy, decay equations, volatility spikes, and danger bar metrics.*
* [`03-simulation-ai/03-traits-reputations-and-special-inmates.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/03-simulation-ai/03-traits-reputations-and-special-inmates.md)  
  *Legendary traits (Deadly, Tough, Volatile), Snitch assassination triggers, and Protective Custody isolation logic.*
* [`03-simulation-ai/04-misconduct-violence-and-riots.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/03-simulation-ai/04-misconduct-violence-and-riots.md)  
  *Prison temperature, fight escalation trees, riot ignition thresholds, hostage-taking, and emergency response.*
* [`03-simulation-ai/05-tunnel-digging-and-escape-ai.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/03-simulation-ai/05-tunnel-digging-and-escape-ai.md)  
  *Nocturnal digging schedules, tool wear, pipe traversal, search detection chances, and K9 vibration alerts.*

### Domain 04: Security, Logistics & Regime
* [`04-security-logistics/01-regime-and-timetable-system.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/04-security-logistics/01-regime-and-timetable-system.md)  
  *24-hour master clock, staggered multi-tier security schedules, and emergency lockdown/bangup overrides.*
* [`04-security-logistics/02-security-zoning-and-access-control.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/04-security-logistics/02-security-zoning-and-access-control.md)  
  *Security sectors (Min, Med, Max, SuperMax, Protective, Staff-Only), doorway clearance matrices, and sector colors.*
* [`04-security-logistics/03-contraband-economy-and-smuggling.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/04-security-logistics/03-contraband-economy-and-smuggling.md)  
  *Physical delivery vectors (trucks, mail, visitors, 10-tile fence throws), hidden cell stashes, and black market trading.*
* [`04-security-logistics/04-surveillance-patrols-and-intelligence.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/04-security-logistics/04-surveillance-patrols-and-intelligence.md)  
  *CCTV cameras, monitor consoles, phone wiretaps, servo airlocks, guard patrols, and Confidential Informants (CIs).*
* [`04-security-logistics/05-supply-chains-and-room-logistics.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/04-security-logistics/05-supply-chains-and-room-logistics.md)  
  *Kitchen-to-canteen ingredient routing, laundry distribution loops, mail delivery, and waste management.*

### Domain 05: Economy, Management & Governance
* [`05-economy-management/01-financial-model-and-cashflow.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/01-financial-model-and-cashflow.md)  
  *Daily inmate stipends by tier, staff payroll, food quality expenditure, utility bills, taxes, and bank credit.*
* [`05-economy-management/02-government-grants-system.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/02-government-grants-system.md)  
  *Reactive DAG grant milestone architecture, advance funding, completion audits, and failure penalties.*
* [`05-economy-management/03-bureaucracy-research-tree.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/03-bureaucracy-research-tree.md)  
  *Warden administrative hierarchy, research time progression, and progressive feature unlocking.*
* [`05-economy-management/04-workshop-and-industrial-production.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/04-workshop-and-industrial-production.md)  
  *Forestry cutting, timber milling, sheet metal stamping (license plates), carpentry, and export logistics.*
* [`05-economy-management/05-rehabilitation-and-recidivism.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/05-rehabilitation-and-recidivism.md)  
  *Reform programs (Education, Therapy, AA/NA, Carpentry), re-offending rate math, and parole subsidies.*
* [`05-economy-management/06-death-row-and-execution-protocol.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/06-death-row-and-execution-protocol.md)  
  *Appeals hearing cycles, clemency percentage decay, execution team assembly, and wrongful execution liability.*

### Domain 06: Graphics, UI & Sound
* [`06-graphics-ui/01-webgpu-rendering-pipeline.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/06-graphics-ui/01-webgpu-rendering-pipeline.md)  
  *32x32 chunk partitioning, multi-tier LOD (vector detail to architectural glyphs), and instanced draw pipelines.*
* [`06-graphics-ui/02-fog-of-war-and-vision-compute-shaders.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/06-graphics-ui/02-fog-of-war-and-vision-compute-shaders.md)  
  *GPU ray-marching compute passes for guard vision cones, unrevealed interior fog, and CCTV sensor overlays.*
* [`06-graphics-ui/03-svelte5-dom-hud-and-state-bridge.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/06-graphics-ui/03-svelte5-dom-hud-and-state-bridge.md)  
  *SharedArrayBuffer binary bridge, reactive runes for cashflow/danger, timetable grid UI, and planning tools.*
* [`06-graphics-ui/04-audio-engine-and-spatial-acoustics.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/06-graphics-ui/04-audio-engine-and-spatial-acoustics.md)  
  *AudioWorklet synthesis, wall-occluded low-pass filtering, positional audio attenuation, and tension music score.*

### Domain 07: Platform, Persistence & Extensibility
* [`07-platform-persistence/01-save-load-opfs-and-serialization.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/07-platform-persistence/01-save-load-opfs-and-serialization.md)  
  *Zero-copy binary serialization (`rkyv`/`bincode`), Zstandard streaming compression, and OPFS file management.*
* [`07-platform-persistence/02-modding-and-wasm-plugin-engine.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/07-platform-persistence/02-modding-and-wasm-plugin-engine.md)  
  *Sandboxed WebAssembly plugin runtime (Extism), custom JSON schemas for rooms/objects, and event hook bindings.*

---

## 4. Autonomous AI Agent Implementation Plan

For step-by-step agent instructions, atomic task definitions, and checklists:
* **[Master Implementation Roadmap & Plan](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/ROADMAP.md)**
  * **[Phase 1: Foundations, Threading & Memory Model](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/01-foundations-and-threading.md)** (4 Tasks)
  * **[Phase 2: World Grid, Materials & WebGPU Renderer](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/02-world-grid-and-rendering.md)** (4 Tasks)
  * **[Phase 3: Utilities & Room Enclosures](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/03-utilities-and-enclosures.md)** (4 Tasks)
  * **[Phase 4: Navigation, Agent AI & Regime](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/04-navigation-and-agent-ai.md)** (4 Tasks)
  * **[Phase 5: Security, Contraband & Combat](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/05-security-and-combat.md)** (4 Tasks)
  * **[Phase 6: Economy, Logistics & Governance](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/06-economy-and-logistics.md)** (4 Tasks)
  * **[Phase 7: Aesthetics, Persistence & Modding](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/implementation-plan/07-polish-and-extensibility.md)** (4 Tasks)

