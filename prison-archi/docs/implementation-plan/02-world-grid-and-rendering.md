# Phase 02: World Grid, Materials & WebGPU Renderer

**Goal:** Implement the multi-layer orthogonal tile grid, autotiling bitmask rules, WebGPU instanced sprite batching with frustum culling, and the drag-and-drop construction job pipeline.

---

## Task Matrix & Checklist

- [x] **Task 2.1:** Tile Grid Data Structure & Packed Memory Representation
- [x] **Task 2.2:** 4-Bit & 8-Bit Autotiling Bitmask Engine
- [x] **Task 2.3:** WebGPU Context, Camera Matrix & Instanced Quad Renderer
- [ ] **Task 2.4:** Drag-Rect Construction Tool & Workman Job Pipeline

---

## Detailed Task Specifications

### Task 2.1: Tile Grid Data Structure & Packed Memory Representation
* **Context & Specifications:** Reference [`docs/02-construction-utilities/01-tile-grid-and-materials.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/01-tile-grid-and-materials.md).
* **Objective:** Implement the packed 64-bit `TileCellDescriptor` and spatial partitioning into $32 \times 32$ tile chunks.
* **Prerequisites:** Phase 1 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/grid/tile.rs`):
    * Define `TileCellDescriptor` with packed fields for `terrain_id`, `floor_id`, `wall_id`, `wall_autotile_idx`, `object_entity_id`, `flags`, `health`, and `decal_mask`.
    * Define `MaterialDefinition` registry (Brick, Concrete, Perimeter Wall, Grass, Concrete Floor).
  * In Rust (`crates/simulation/src/grid/chunk.rs`):
    * Implement `TileGrid` storing $32 \times 32$ chunk arrays, with coordinate accessors `get_tile(x, y)` and `set_tile(x, y, desc)`.
* **Verification & Test Criteria:**
  1. Unit test allocating a $512 \times 512$ tile grid ($262,144$ tiles). Assert memory consumption is $< 4 \text{ MB}$.
  2. Benchmark coordinate indexing: Assert average access latency is $< 2 \text{ nanoseconds}$ per tile query.

---

### Task 2.2: 4-Bit & 8-Bit Autotiling Bitmask Engine
* **Context & Specifications:** Reference [`docs/02-construction-utilities/01-tile-grid-and-materials.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/01-tile-grid-and-materials.md).
* **Objective:** Calculate seamless visual connectivity indices for walls, fences, and cables based on neighbor adjacency.
* **Prerequisites:** Task 2.1 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/grid/autotile.rs`):
    * Implement `calculate_wall_autotile(grid, x, y)` evaluating North, East, South, West neighbors into a 4-bit integer ($0..15$).
    * Add dirty-chunk propagation: Modifying tile $(x, y)$ recalculates autotile indices for all 4 cardinal neighbors and marks the chunk as dirty.
* **Verification & Test Criteria:**
  1. Unit tests verifying all 16 cardinal combinations:
     * Isolated single pillar produces index `0`.
     * Horizontal line produces East-West mask `10`.
     * T-junction (North, East, South) produces mask `7`.
     * Cross-junction (NESW) produces mask `15`.

---

### Task 2.3: WebGPU Context, Camera Matrix & Instanced Quad Renderer
* **Context & Specifications:** Reference [`docs/06-graphics-ui/01-webgpu-rendering-pipeline.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/06-graphics-ui/01-webgpu-rendering-pipeline.md).
* **Objective:** Initialize the WebGPU canvas, upload sprite texture atlas, implement camera pan/zoom matrix math, and draw visible tiles via a single instanced quad render pass.
* **Prerequisites:** Task 2.2 complete.
* **Deliverables:**
  * In TypeScript/WGSL (`src/lib/renderer/`):
    * `WebGPURenderer.ts`: Canvas setup, device acquisition, swapchain configuration.
    * `Camera2D.ts`: Smooth pan, zoom clamp ($0.1\times$ to $5.0\times$), screen-to-world unproject math, view-projection uniform buffer.
    * `shaders/instanced_sprite.wgsl`: Vertex shader applying instanced translation, UV atlas coordinates, and color tints.
    * Frustum culling function rejecting non-visible $32 \times 32$ chunks before drawing.
* **Verification & Test Criteria:**
  1. Browser visual test: Canvas renders a $512 \times 512$ tilemap with distinct brick walls and grass terrain at a stable 120 FPS.
  2. Dragging the mouse smoothly pans the camera; mouse wheel zooms seamlessly without visual distortion or camera jitter.
  3. Culling test: Verify that zoomed-in camera views only issue draw calls for chunks intersecting the viewport.

---

### Task 2.4: Drag-Rect Construction Tool & Workman Job Pipeline
* **Context & Specifications:** Reference [`docs/02-construction-utilities/01-tile-grid-and-materials.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/01-tile-grid-and-materials.md).
* **Objective:** Enable dragging rectangle blueprints on the canvas, spawning construction jobs, and directing Workmen to deliver materials and erect walls.
* **Prerequisites:** Task 2.3 complete.
* **Deliverables:**
  * In TypeScript (`src/lib/tools/DragBoxTool.ts`):
    * Canvas mouse listeners converting drag bounds into a grid rectangle command packet.
  * In Rust (`crates/simulation/src/construction/jobs.rs`):
    * `ConstructionJob` component (type: BuildWall, target tile, required material, progress ticks).
    * `WorkmanJobSystem`: Dispatches idle Workmen to pick up materials from the Delivery zone and walk to the job site.
    * On job completion (100% progress), clear blueprint ghost flag and commit solid `wall_id` to the `TileGrid`.
* **Verification & Test Criteria:**
  1. In-game test: Drag a $10 \times 10$ brick wall foundation. Holographic ghost outline appears immediately.
  2. Spawned Workman navigates to delivery zone, collects brick box, walks to perimeter, and builds walls tile by tile.
  3. Autotile indices update automatically as each wall segment completes.
