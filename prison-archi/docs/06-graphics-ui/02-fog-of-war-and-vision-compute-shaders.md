# Domain 06: Graphics, UI & Sound
## Feature Specification 02: Fog of War, Line of Sight & WebGPU Compute Shaders

---

## 1. System Overview & The Vision Dilemma

In *Prison Architect Web*, the player is **not omniscient**. While structural walls and furniture remain visible once built, **inmates, contraband, and fights inside unmonitored rooms are shrouded in the Fog of War (FoW)**.

If a cell block has no stationed guards and no active CCTV cameras, the interior descends into darkness. Prisoners can brawl, dig tunnels, or trade weapons completely invisible to the player until a guard walks through the doorway.

Computing thousands of 2D raycasts on the CPU per frame would cause unacceptable simulation slowdowns. Therefore, vision calculations are offloaded entirely to **WebGPU Compute Shaders**.

```
[ Guard & Staff Positions ] ──┐
[ CCTV Camera Angles ]      ──┼──► [ WebGPU Compute Shader ]
[ Solid Wall Bitmask Grid ] ──┘             │
                                            ▼
                                2D Raymarching Pipeline
                                            │
                                            ▼
                             [ Visibility Map Texture ]
                             (R8_UNORM: 0.0 to 1.0)
                                            │
                                            ▼
                             [ Bilinear Blur Filter ]
                                (Soft Shadow Edges)
                                            │
                                            ▼
                             Composited over Sprite Pass
```

---

## 2. The 3 Visibility States

Every tile on the map exists in one of three visibility tiers:

1. **Unexplored (Black / Total Darkness):** Completely unrevealed territory (e.g., unopened parcel, hidden subterranean cavern).
2. **Explored but Unmonitored (Shadowed / Memory Fog):** The architecture and furniture are visible in desaturated, dim tones, but **all dynamic entities (prisoners, weapons) are hidden**.
3. **Currently Visible (Full Light):** Directly within the live vision cone of a Guard, Dog Handler, Workman, or operational CCTV camera. Entities are fully rendered and selectable.

---

## 3. WebGPU Compute Shader Raymarching (WGSL)

The compute pass runs on a grid of $16 \times 16$ thread workgroups, sampling a packed wall collision texture:

```wgsl
struct VisionSource {
    pos: vec2<f32>,
    direction_angle: f32,
    cone_half_angle: f32,
    max_range: f32,
};

@group(0) @binding(0) var<storage, read> vision_sources: array<VisionSource>;
@group(0) @binding(1) var wall_collision_texture: texture_2d<f32>;
@group(0) @binding(2) var visibility_output_texture: texture_storage_2d<r8unorm, write>;

@compute @workgroup_size(16, 16)
fn cs_raymarch_visibility(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let tile_coord = vec2<i32>(global_id.xy);
    let tile_pos = vec2<f32>(tile_coord) + vec2<f32>(0.5, 0.5);

    var max_visibility = 0.0;

    // Iterate through all active vision sources (Guards, Cameras)
    let source_count = arrayLength(&vision_sources);
    for (var i = 0u; i < source_count; i = i + 1u) {
        let src = vision_sources[i];
        let diff = tile_pos - src.pos;
        let dist = length(diff);

        if (dist > src.max_range) { continue; }

        // Angle check for directional cones (CCTV cameras)
        let angle = atan2(diff.y, diff.x);
        let angle_diff = abs(angle - src.direction_angle);
        if (angle_diff > src.cone_half_angle && angle_diff < (6.28318 - src.cone_half_angle)) {
            continue;
        }

        // Raymarch from source to tile to check for occluding walls
        let ray_steps = i32(dist * 2.0);
        let step_delta = diff / f32(ray_steps);
        var current_pos = src.pos;
        var occluded = false;

        for (var step = 0; step < ray_steps; step = step + 1) {
            current_pos = current_pos + step_delta;
            let check_coord = vec2<i32>(current_pos);
            let wall = textureLoad(wall_collision_texture, check_coord, 0).r;
            if (wall > 0.5) {
                occluded = true;
                break;
            }
        }

        if (!occluded) {
            let falloff = 1.0 - (dist / src.max_range);
            max_visibility = max(max_visibility, falloff);
        }
    }

    // Write final visibility intensity
    textureStore(visibility_output_texture, tile_coord, vec4<f32>(max_visibility, 0.0, 0.0, 1.0));
}
```

---

## 4. Soft Shadow Edges & Bilinear Blur Pass

Raw tile-based raymarching produces pixelated, staircase shadow borders. To achieve the signature sleek aesthetic of modern simulations:
* A second lightweight compute pass executes a **Separable $5 \times 5$ Gaussian Blur** across the visibility texture.
* Result: Silky, cinematic soft shadows that bleed realistically through doorway thresholds.

---

## 5. Entity Culling via Visibility Texture

When packing the instance buffer for rendering:
1. The CPU simulation checks if an entity is in Fog of War before copying its transform.
2. If `visibility < 0.1` and the entity is a `Prisoner`:
   * The prisoner is culled from the draw call entirely.
   * Player cannot click or inspect the prisoner.
   * Floating health bars and status icons are hidden.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **CCTV Blind Spot Behind Potted Plant** | Minor interior props cast massive solid black shadows across the whole room. | Transparent Prop Classification: Furniture, plants, and serving tables are flagged with `Occlusion = False`; only structural solid walls cast vision shadows. |
| **Camera Sweep Clipping through Corners** | Panning CCTV camera temporarily clips through an exterior wall, exposing outside terrain. | Camera Anchor Offset: CCTV vision source origins are inset by $0.2\text{ m}$ into the room interior rather than sitting on the exact wall centerline. |
| **Massive 500-Guard Vision Compute Overload** | Too many active vision sources cause compute shader timeout. | Spatial Clustering: Only guards whose max vision range intersects the camera's active view frustum are bound to the `vision_sources` compute storage buffer. |
