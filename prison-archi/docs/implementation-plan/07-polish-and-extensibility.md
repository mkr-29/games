# Phase 07: Audio, Fog of War, Polish & Extensibility

**Goal:** Implement WebGPU compute Fog of War, AudioWorklet spatial acoustics, Svelte 5 management HUD modals, OPFS binary persistence, and the Extism Wasm plugin modding engine.

---

## Task Matrix & Checklist

- [ ] **Task 7.1:** WebGPU Compute Fog of War & Soft Gaussian Blur Shadows
- [ ] **Task 7.2:** AudioWorklet Spatial Acoustics, Wall Occlusion & Dynamic Riot Score
- [ ] **Task 7.3:** Svelte 5 Management HUD, Inmate Dossiers & Blueprint Planning Tool
- [ ] **Task 7.4:** OPFS Binary Save/Load Pipeline & Wasm Sandboxed Modding Engine

---

## Detailed Task Specifications

### Task 7.1: WebGPU Compute Fog of War & Soft Gaussian Blur Shadows
* **Context & Specifications:** Reference [`docs/06-graphics-ui/02-fog-of-war-and-vision-compute-shaders.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/06-graphics-ui/02-fog-of-war-and-vision-compute-shaders.md).
* **Objective:** Implement 2D raymarching on WebGPU compute shaders to calculate guard and CCTV line-of-sight, apply a soft Gaussian blur filter, and cull unmonitored prisoners.
* **Prerequisites:** Phase 2 and Phase 5 complete.
* **Deliverables:**
  * In WGSL (`src/lib/renderer/shaders/fog_of_war.wgsl`):
    * `cs_raymarch_visibility`: 2D raymarch pass testing vision rays against the wall collision texture, writing to an `R8_UNORM` visibility texture.
    * `cs_gaussian_blur`: Separable $5 \times 5$ blur pass smoothing harsh shadow edges.
  * In TypeScript (`src/lib/renderer/FogOfWarPass.ts`):
    * Binds active guard positions, angles, and CCTV panning sweeps to the compute storage buffer.
    * Uses visibility texture to mask unobserved prisoners out of the main sprite draw pass.
* **Verification & Test Criteria:**
  1. Visual test: Rooms without stationed guards or cameras are shrouded in dark fog; moving an inmate inside an unmonitored cell hides them from view.
  2. Performance benchmark: Vision compute pass executes in $< 0.8\text{ ms}$ for 100 active guards on a $512 \times 512$ map.

---

### Task 7.2: AudioWorklet Spatial Acoustics, Wall Occlusion & Dynamic Riot Score
* **Context & Specifications:** Reference [`docs/06-graphics-ui/04-audio-engine-and-spatial-acoustics.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/06-graphics-ui/04-audio-engine-and-spatial-acoustics.md).
* **Objective:** Implement thread-isolated audio synthesis, 2D positional panning, dynamic low-pass wall muffling, and danger-reactive music crossfading.
* **Prerequisites:** Phase 4 and Phase 5 complete.
* **Deliverables:**
  * In TypeScript (`src/lib/audio/`):
    * `AudioController.ts`: Initializes `AudioContext` and loads sound sprite buffers.
    * `SpatialOcclusion.ts`: Bresenham raycast counting walls between sound and camera; adjusts `BiquadFilterNode` low-pass frequency ($F_{\text{cutoff}} = 20,000 \times 0.4^{N_{\text{walls}}}$).
    * `AdaptiveSoundtrack.ts`: 4-stem music crossfader fading in percussion layers as the Danger Bar crosses $30\%$, $60\%$, and $80\%$.
* **Verification & Test Criteria:**
  1. Spatial test: Sound played on the far right of the screen pans hard to the right channel and attenuates with distance.
  2. Wall occlusion test: A fight occurring inside a closed solitary cell sounds heavily muffled (low-pass $< 1,000\text{ Hz}$); opening the door immediately un-muffles the sound to full clarity.
  3. Tension test: Set Danger Bar to $90\%$; verify industrial riot percussion stems crossfade in smoothly over 2 seconds.

---

### Task 7.3: Svelte 5 Management HUD, Inmate Dossiers & Blueprint Planning Tool
* **Context & Specifications:** Reference [`docs/06-graphics-ui/03-svelte5-dom-hud-and-state-bridge.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/06-graphics-ui/03-svelte5-dom-hud-and-state-bridge.md).
* **Objective:** Build the DOM HUD with reactive runes, clicking entities to inspect rap sheets, interactive bureaucracy DAG, and non-destructive blueprint drawing with `Ctrl+Z` undo/redo.
* **Prerequisites:** Phase 1 and Phase 6 complete.
* **Deliverables:**
  * In Svelte 5 (`src/components/`):
    * `TopBar.svelte`: Rolling cash balance counter, pulsing Danger Gauge thermometer, clock controls.
    * `InmateRapSheet.svelte`: Modal showing 15 need bars, convictions, sentence progress, and gang status.
    * `BureaucracyTree.svelte`: Visual node graph showing admin research progress.
    * `PlanningOverlay.svelte`: Drag holographic ghost sketches; full undo/redo stack (`Ctrl+Z` / `Ctrl+Y`) before committing construction orders.
* **Verification & Test Criteria:**
  1. Click an inmate on the canvas: Inmate Rap Sheet modal slides in smoothly with accurate real-time need bars.
  2. Planning mode test: Draw a complex 50-room layout in planning mode; press `Ctrl+Z` 3 times; verify the last 3 rooms revert cleanly without deducting cash.

---

### Task 7.4: OPFS Binary Save/Load Pipeline & Wasm Sandboxed Modding Engine
* **Context & Specifications:** Reference [`docs/07-platform-persistence/01-save-load-opfs-and-serialization.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/07-platform-persistence/01-save-load-opfs-and-serialization.md) and [`docs/07-platform-persistence/02-modding-and-wasm-plugin-engine.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/07-platform-persistence/02-modding-and-wasm-plugin-engine.md).
* **Objective:** Implement zero-copy binary serialization (`bincode` + Zstd) into browser OPFS storage, and build the sandboxed WebAssembly modding runtime with fuel limits.
* **Prerequisites:** All previous tasks complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/persistence/storage.rs`):
    * `save_world_to_bytes()`: Compact binary serialization with Zstd level 3 compression ($< 15\text{ ms}$).
    * `load_world_from_bytes()`: Zero-copy deserialization restoring full ECS world state.
  * In TypeScript (`src/lib/storage/OPFSBridge.ts`):
    * Synchronous file write via `createSyncAccessHandle()` inside the simulation worker.
    * Rolling 3-slot auto-save system every 10 minutes.
  * In Rust / TypeScript (`src/lib/modding/ExtismRunner.ts`):
    * Unpacks mod ZIP archives, parses `manifest.json` (custom rooms, objects, traits).
    * Executes compiled `plugin.wasm` hooks (`on_inmate_spawn`, `on_fight_start`) with a 50,000 instruction fuel cap.
* **Verification & Test Criteria:**
  1. Save/Load roundtrip: Save a complex 1,000-inmate prison; reload it. Assert exact identity, cash, need levels, and tile coordinates are restored within $< 100\text{ ms}$.
  2. Auto-save test: Confirm rolling auto-save writes to OPFS without dropping frame rates below 120 FPS on the render thread.
  3. Mod sandbox test: Load a test mod with an infinite loop; assert the mod engine halts execution cleanly via fuel exhaustion without freezing the game.
