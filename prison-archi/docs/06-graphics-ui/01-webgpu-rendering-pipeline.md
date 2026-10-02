# Domain 06: Graphics, UI & Sound
## Feature Specification 01: WebGPU Rendering Pipeline, Spatial Chunking & Multi-Tier LOD

---

## 1. System Overview & The WebGPU Advantage

*Prison Architect Web* renders its world using a custom **WebGPU pipeline** written in WGSL (WebGPU Shading Language). WebGPU replaces legacy WebGL with explicit, low-level hardware control, eliminating browser driver overhead and enabling **massive single-pass instancing**.

The renderer must seamlessly display:
* Over $262,144$ floor, wall, and utility tiles.
* Up to $10,000$ animated characters (prisoners, guards, workmen).
* Thousands of furniture items, tools, blood decals, and water puddles.
* Smooth, infinite camera zooming from macro overview (entire prison) down to micro inspection (reading an individual inmate's face).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WEBGPU RENDER PIPELINE                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. CPU FRUSTUM CULLING (32x32 Tile Chunks)                             │
│    Calculates visible chunk AABB vs Camera View Frustum                │
├────────────────────────────────────────────────────────────────────────┤
│ 2. INSTANCE BUFFER POPULATION                                          │
│    Copies visible entity transforms & texture atlas IDs into VRAM      │
├────────────────────────────────────────────────────────────────────────┤
│ 3. COMPUTE PASS: FOG OF WAR & LIGHTING                                 │
│    Calculates vision cones and shadows into a 2D visibility texture    │
├────────────────────────────────────────────────────────────────────────┤
│ 4. RENDER PASS: INSTANCED QUAD SPRITE BATCHING                         │
│    Single drawIndexedInstanced call for all static & dynamic sprites   │
├────────────────────────────────────────────────────────────────────────┤
│ 5. POST-PROCESS COMPOSITING                                            │
│    Applies Bloom, Vignette, Grayscale Execution Filter, Sector Tints   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Spatial Chunking & Frustum Culling Architecture

The world tilemap is partitioned into **$32 \times 32$ tile chunks** (each chunk $= 1,024$ tiles):

```rust
pub const CHUNK_SIZE: usize = 32;

pub struct ChunkRenderNode {
    pub chunk_x: u16,
    pub chunk_y: u16,
    pub aabb_min: Vec2,
    pub aabb_max: Vec2,
    pub static_tile_instance_buffer: wgpu::Buffer,
    pub is_dirty: bool, // Set true when walls or floors within chunk are modified
}
```

### Frustum Culling Algorithm
On every render frame, the camera calculates its visible world-space bounding box:

$$\text{Viewport}_{\text{min}} = \text{Camera}_{\text{pos}} - \frac{\text{ScreenSize}}{2 \times \text{Zoom}}$$

$$\text{Viewport}_{\text{max}} = \text{Camera}_{\text{pos}} + \frac{\text{ScreenSize}}{2 \times \text{Zoom}}$$

Any chunk whose AABB does not intersect this rectangle is rejected before issuing GPU commands, reducing draw workloads by up to **$90\%$** during zoomed-in gameplay.

---

## 3. Multi-Tier Level of Detail (LOD)

To sustain a locked **120 FPS** even when zooming out to view a 10,000-inmate facility, the renderer transitions dynamically across **3 LOD Tiers**:

```
Zoom Level: 0.1x (Max Zoom Out) ────────► 1.0x (Standard) ────────► 4.0x (Close-Up)
┌──────────────────────────────┬─────────────────────────┬────────────────────────┐
│ LOD 2: Blueprint Glyphs      │ LOD 1: Flat Vectors     │ LOD 0: High Detail     │
│ - Inmates = Solid dots       │ - Simplified sprites    │ - Animated limbs/heads │
│ - Walls = Monochrome lines   │ - Static uniforms       │ - Facial expressions   │
│ - No decal rendering         │ - Basic drop shadows    │ - Blood & dirt decals  │
│ Cost: < 0.3 ms GPU           │ Cost: ~1.2 ms GPU       │ Cost: ~2.8 ms GPU      │
└──────────────────────────────┴─────────────────────────┴────────────────────────┘
```

### WGSL LOD Vertex Shader Snippet:
```wgsl
struct InstanceInput {
    @location(2) world_pos: vec2<f32>,
    @location(3) rotation: f32,
    @location(4) sprite_id: u32,
    @location(5) tint_color: vec4<f32>,
};

@vertex
fn vs_main(
    @builtin(vertex_index) vertex_id: u32,
    instance: InstanceInput,
) -> VertexOutput {
    var out: VertexOutput;
    let quad_pos = QUAD_VERTICES[vertex_id];

    // Check Global Zoom LOD Uniform
    if (camera.zoom < 0.25) {
        // LOD 2: Render simplified architectural dot/glyph
        out.clip_position = camera.view_proj * vec4<f32>(instance.world_pos + quad_pos * 0.4, 0.0, 1.0);
        out.color = instance.tint_color; // Solid uniform tier color
        out.uv = vec2<f32>(0.5, 0.5);   // Blank dot texture
    } else {
        // LOD 0 / 1: Full instanced sprite transform
        let rotated = rotate_2d(quad_pos, instance.rotation);
        out.clip_position = camera.view_proj * vec4<f32>(instance.world_pos + rotated, 0.0, 1.0);
        out.uv = calculate_atlas_uv(instance.sprite_id, vertex_id);
        out.color = instance.tint_color;
    }

    return out;
}
```

---

## 4. Instanced Quad Sprite Batching

Rather than issuing thousands of draw calls, all visible dynamic entities (characters, batons, food trays, sparks) are written into a single dynamic **Instance Buffer** and rendered via **One Draw Call**:

```rust
render_pass.set_pipeline(&self.instanced_sprite_pipeline);
render_pass.set_bind_group(0, &self.global_camera_bind_group, &[]);
render_pass.set_bind_group(1, &self.texture_atlas_bind_group, &[]);
render_pass.set_vertex_buffer(0, self.quad_vertex_buffer.slice(..));
render_pass.set_vertex_buffer(1, self.instance_buffer.slice(0..active_instances_bytes));

// Draws all 10,000+ entities in a single hardware invocation
render_pass.draw(0..6, 0..active_instances_count);
```

---

## 5. Smooth Camera System (Pan, Zoom & Inertia)

The camera supports sub-pixel floating-point tracking:

$$\vec{P}_{\text{cam}}(t + \Delta t) = \vec{P}_{\text{cam}}(t) + \vec{V}_{\text{pan}} \cdot \text{InertiaDamping}$$

$$\text{Zoom}(t + \Delta t) = \text{clamp}\left( \text{Zoom}(t) \times e^{\text{WheelDelta} \cdot S}, \, \text{Zoom}_{\text{min}}, \, \text{Zoom}_{\text{max}} \right)$$

* **Screen-To-World Raycasting:** Clicking on screen pixel coordinates $(u, v)$ accurately maps to the exact floating-point world grid coordinate $(x, y)$, regardless of instantaneous zoom or viewport aspect ratios.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **GPU Device Loss (Context Lost)** | WebGPU device is terminated due to OS sleep or monitor disconnect. | `requestDevice()` Re-initialization: The engine hooks `device.lost`, halts the render loop, recovers the pipeline, and re-uploads textures without resetting the simulation state in the worker. |
| **VRAM Buffer Overflow** | Mod creates 200,000 entities, exceeding the allocated 4MB instance buffer. | Dynamic Buffer Doubling: If instance count $> 90\%$ buffer capacity, allocate a new buffer with $2\times$ size and update the bind group. |
| **Sub-Pixel Shimmering / Moire** | Fine metal fences produce visual moire patterns at medium zoom distances. | Mipmapped Texture Filtering: Texture atlas includes 4 generated mipmap tiers using Kaiser-window downsampling. |
