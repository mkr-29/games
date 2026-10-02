# Domain 02: World Grid, Construction & Utilities
## Feature Specification 01: Tile Grid, Multi-Layer Material System & Autotiling

---

## 1. System Overview & Spatial Model

The world in *Prison Architect Web* is structured as a discrete, top-down **2D orthogonal tile grid** (typically $256 \times 256$ up to $1024 \times 1024$ tiles). Every tile coordinate $(x, y)$ represents an area of $1 \text{ m} \times 1 \text{ m}$.

To support indoor/outdoor foundations, structural walls, subterranean escape tunnels, utility cables, and dynamic grime (blood, dirt, puddle decals), each coordinate is composed of **stacked logical layers** stored in flat, cache-optimized memory buffers.

```
Elevation / Rendering Order:
┌────────────────────────────────────────────────────────┐
│ Layer 5: Dynamic Decals (Blood, Vomit, Mud, Tire Marks)│
├────────────────────────────────────────────────────────┤
│ Layer 4: Furniture & Utility Props (Beds, Sinks, Saws) │
├────────────────────────────────────────────────────────┤
│ Layer 3: Structural Walls, Fences & Doors              │
├────────────────────────────────────────────────────────┤
│ Layer 2: Indoor Foundation & Floor Coverings (Ceramic) │
├────────────────────────────────────────────────────────┤
│ Layer 1: Natural Terrain (Dirt, Grass, Sand, Water)    │
├────────────────────────────────────────────────────────┤
│ Layer 0: Subterranean / Tunnels (Pipes & Escape Shafts)│
└────────────────────────────────────────────────────────┘
```

---

## 2. Memory Layout & Packed Tile Representation

Rather than allocating heap objects per tile, each tile coordinate is represented by a tightly packed 64-bit integer (`TileCellDescriptor`):

```rust
#[repr(C)]
#[derive(Clone, Copy, Default, PartialEq, Eq)]
pub struct TileCellDescriptor {
    pub terrain_id: u8,       // 0=Dirt, 1=Grass, 2=Sand, 3=Puddle, 4=DeepWater...
    pub floor_id: u8,         // 0=None, 1=Concrete, 2=CeramicTile, 3=Wood, 4=Metal...
    pub wall_id: u8,          // 0=None, 1=Brick, 2=ReinforcedConcrete, 3=PerimeterFence...
    pub wall_autotile_idx: u8,// 0..15 calculated via 4-bit neighbor connectivity
    pub object_entity_id: u32,// Entity ID of mounted object (bed, toilet, door) or 0
    pub flags: u16,           // Bitflags: Indoor, Electrified, OnFire, ContrabandCache...
    pub health: u8,           // 0..255 structural integrity (damage from riots/explosives)
    pub decal_mask: u8,       // Packed dirt/blood decal intensity
}
```

For a standard $512 \times 512$ prison map ($262,144$ tiles), the entire structural grid occupies only:
$$262,144 \times 12 \text{ bytes} \approx 3.14 \text{ MB}$$
This easily resides entirely in CPU L3 cache and transfers to WebGPU storage buffers in a single sub-millisecond memory copy.

---

## 3. Material Properties & Physical Attributes

Every wall, fence, and floor material carries specific physical properties that govern movement speed, digging difficulty, fire propagation, and acoustic dampening:

```rust
pub struct MaterialDefinition {
    pub id: u8,
    pub name: &'static str,
    pub max_health: u16,
    pub walk_speed_multiplier: f32, // e.g. Grass=0.8, Concrete=1.0, PavedRoad=1.2
    pub dig_resistance: f32,        // Multiplier for tunnel digging effort
    pub is_breathable_outdoors: bool,
    pub acoustic_dampening_db: f32,  // Decibel attenuation for sound propagation
    pub flammability_rating: u8,    // 0=Fireproof (Steel), 100=Highly Combustible (Wood)
    pub cost_cents: u32,            // Construction price
}

pub static MATERIAL_REGISTRY: &[MaterialDefinition] = &[
    MaterialDefinition {
        id: 1, name: "Brick Wall", max_health: 200,
        walk_speed_multiplier: 0.0, dig_resistance: 1.0,
        is_breathable_outdoors: false, acoustic_dampening_db: 18.0,
        flammability_rating: 10, cost_cents: 5000,
    },
    MaterialDefinition {
        id: 2, name: "Reinforced Concrete", max_health: 600,
        walk_speed_multiplier: 0.0, dig_resistance: 3.5,
        is_breathable_outdoors: false, acoustic_dampening_db: 32.0,
        flammability_rating: 0, cost_cents: 12000,
    },
    MaterialDefinition {
        id: 3, name: "Perimeter Wall", max_health: 1200,
        walk_speed_multiplier: 0.0, dig_resistance: 10.0, // High tunnel deterrent
        is_breathable_outdoors: false, acoustic_dampening_db: 40.0,
        flammability_rating: 0, cost_cents: 35000,
    },
];
```

---

## 4. 4-Bit & 8-Bit Autotiling Algorithms

To seamlessly join walls, fences, and cables into visual corners, T-junctions, and cross-intersections, we implement a **4-bit Bitmask Autotiling** algorithm evaluating the 4 cardinal neighbors (North, East, South, West).

```
         [North: bit 0 (value 1)]
                     │
[West: bit 3 (val 8)]┼─[East: bit 1 (val 2)]
                     │
         [South: bit 2 (value 4)]
```

### Autotile Index Calculation
$$\text{Index} = (N \times 1) + (E \times 2) + (S \times 4) + (W \times 8)$$

The resulting integer ($0 \le \text{Index} \le 15$) maps directly into a $4 \times 4$ tile atlas:

```rust
pub fn calculate_wall_autotile(grid: &[TileCellDescriptor], width: usize, x: usize, y: usize) -> u8 {
    let current_wall = grid[y * width + x].wall_id;
    if current_wall == 0 { return 0; }

    let mut mask = 0u8;

    // Check North (y > 0)
    if y > 0 && connects_to_wall(grid[(y - 1) * width + x].wall_id, current_wall) {
        mask |= 1 << 0;
    }
    // Check East (x < width - 1)
    if x + 1 < width && connects_to_wall(grid[y * width + (x + 1)].wall_id, current_wall) {
        mask |= 1 << 1;
    }
    // Check South (y < height - 1)
    if y + 1 < width && connects_to_wall(grid[(y + 1) * width + x].wall_id, current_wall) {
        mask |= 1 << 2;
    }
    // Check West (x > 0)
    if x > 0 && connects_to_wall(grid[y * width + (x - 1)].wall_id, current_wall) {
        mask |= 1 << 3;
    }

    mask
}

#[inline(always)]
fn connects_to_wall(neighbor_wall: u8, current_wall: u8) -> bool {
    // Walls connect to other solid walls and heavy jail doors
    neighbor_wall != 0
}
```

---

## 5. Construction Workflow & Job Queuing

Placing a foundation or wall does not instantiate it instantly; it queues construction blueprints executed by **Workmen**:

```
[Player Drag-Rect Command]
          │
          ▼
Instantiate "Planned / Ghost" Tile (flag = BLUEPRINT)
          │
          ▼
Dijkstra Path Check: Can Workmen access site?
          │
          ▼
Spawn Material Delivery Job -> Roadway Truck Arrives
          │
          ▼
Workman collects Concrete Box from Delivery Zone
          │
          ▼
Workman navigates to site -> Executes Build Ticks (progress: 0..100%)
          │
          ▼
Clear Ghost Flag -> Commit Solid Material to TileCellDescriptor
          │
          ▼
Trigger Grid Events: Recompute Room Enclosure & Flow Fields
```

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Enclosed Workman Trap** | Worker walls themselves into a room with no exit door. | Pathfinding validation: Before committing the final closing wall of an enclosure, check if the active worker's path to an open external zone is $> 0$. If trapped, abort and flag a visual worker alert. |
| **Overlapping Blueprints** | Player queues a brick wall over a planned steel door. | Structural priority hierarchy: Doors overwrite walls; foundation floorings yield to wall footprints. |
| **Material Supply Starvation** | Delivery zone is clogged; workers stand idle awaiting steel bars. | Svelte HUD displays a `Logistics Bottleneck` notification with direct camera jump to blocked delivery pallets. |
