# Domain 02: World Grid, Construction & Utilities
## Feature Specification 04: Room Zoning, Enclosure Detection & Validation

---

## 1. System Overview & The Zoning Concept

In *Prison Architect Web*, rooms are not rigid prefabricated assets; they are **arbitrary spatial volumes** zoned by the player onto floor tiles. The game continuously evaluates whether zoned areas satisfy strict architectural criteria:
1. **Physical Enclosure:** Is the space fully bounded by walls, fences, and approved doors?
2. **Indoor vs. Outdoor Requirement:** Does the room have a valid roof/foundation, or is it open to the sky?
3. **Dimensional Constraints:** Does the bounded space meet minimum width, height, and square-meter requirements?
4. **Functional Props:** Are all mandatory appliances (beds, toilets, cookers, metal presses) present within the designated boundary?

```
┌────────────────────────────────────────────────────────┐
│ [VALID CELL] (2x3 tiles)                               │
│  ██████████                                            │
│  █ [Bed]  █ <- Solid Brick Wall                        │
│  █        █                                            │
│  █[Toilet]█                                            │
│  ██[Door]██ <- Valid Jail Door                         │
│  Status: ENCLOSED, INDOORS, ALL PROPS PRESENT -> ACTIVE │
├────────────────────────────────────────────────────────┤
│ [INVALID CELL] (Flashing Warning Triangle)             │
│  ██████████                                            │
│  █ [Bed]    <- Missing East Wall! Leaking into corridor │
│  █        █                                            │
│  █[Toilet]█                                            │
│  ██[Door]██                                            │
│  Status: ERROR - "Room must be fully enclosed"         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Room Definition Registry & Validation Criteria

Rooms are registered via immutable configuration schemas defining their requirements:

```rust
#[derive(Debug, Clone)]
pub struct RoomRequirementDefinition {
    pub room_type_id: u16,
    pub name: &'static str,
    pub must_be_indoors: bool,
    pub min_area_tiles: u16,
    pub min_dimension_x: u16,
    pub min_dimension_y: u16,
    pub required_objects: &'static [(u16, u16)], // (ObjectTypeId, MinimumCount)
    pub security_tier_allowed: u8,               // Bitmask: Min, Med, Max, SuperMax, etc.
}

pub static ROOM_REGISTRY: &[RoomRequirementDefinition] = &[
    RoomRequirementDefinition {
        room_type_id: 1, name: "Cell", must_be_indoors: true,
        min_area_tiles: 6, min_dimension_x: 2, min_dimension_y: 3,
        required_objects: &[(10, 1), (11, 1)], // 1 Bed (id 10), 1 Toilet (id 11)
        security_tier_allowed: 0b11111111,
    },
    RoomRequirementDefinition {
        room_type_id: 2, name: "Canteen", must_be_indoors: true,
        min_area_tiles: 16, min_dimension_x: 4, min_dimension_y: 4,
        required_objects: &[(20, 1), (21, 1), (22, 1)], // Serving Table, Table, Bench
        security_tier_allowed: 0b11111111,
    },
    RoomRequirementDefinition {
        room_type_id: 3, name: "Yard", must_be_indoors: false,
        min_area_tiles: 36, min_dimension_x: 6, min_dimension_y: 6,
        required_objects: &[], // Outdoor secure area, props optional
        security_tier_allowed: 0b11111111,
    },
    RoomRequirementDefinition {
        room_type_id: 4, name: "Solitary", must_be_indoors: true,
        min_area_tiles: 1, min_dimension_x: 1, min_dimension_y: 1,
        required_objects: &[], // 1x1 bare room, door only
        security_tier_allowed: 0b11111111,
    },
];
```

---

## 3. Connected-Components Enclosure Detection Algorithm

When a player zones a room, places a wall, or demolishes a door, the `RoomEnclosureSystem` runs a **Flood-Fill Connected Components** scan to determine the room's continuous perimeter:

```rust
#[derive(Debug)]
pub struct EnclosureScanResult {
    pub is_fully_enclosed: bool,
    pub tiles: Vec<(u16, u16)>,
    pub doors: Vec<Entity>,
    pub missing_walls: Vec<(u16, u16)>,
}

pub fn scan_room_enclosure(
    start_x: u16,
    start_y: u16,
    target_room_type: u16,
    grid: &TileGrid,
    max_scan_limit: usize,
) -> EnclosureScanResult {
    let mut visited = HashSet::new();
    let mut queue = VecDeque::new();
    let mut tiles = Vec::new();
    let mut doors = Vec::new();
    let mut is_enclosed = true;

    queue.push_back((start_x, start_y));
    visited.insert((start_x, start_y));

    while let Some((cx, cy)) = queue.pop_front() {
        if tiles.len() > max_scan_limit {
            // Leaking across the entire unpartitioned map
            return EnclosureScanResult {
                is_fully_enclosed: false,
                tiles, doors, missing_walls: vec![(cx, cy)],
            };
        }

        tiles.push((cx, cy));

        for (nx, ny) in grid.cardinal_neighbors(cx, cy) {
            if visited.contains(&(nx, ny)) { continue; }

            // Check if boundary is a solid wall
            if grid.is_solid_wall(nx, ny) {
                continue; // Perimeter reached on this side
            }

            // Check if boundary is an approved door
            if let Some(door_entity) = grid.get_door(nx, ny) {
                doors.push(door_entity);
                continue; // Door seals the enclosure
            }

            // If tile has a different room zoning or is open outdoors, leak detected!
            if grid.get_room_zone(nx, ny) != target_room_type {
                is_enclosed = false;
                continue;
            }

            visited.insert((nx, ny));
            queue.push_back((nx, ny));
        }
    }

    EnclosureScanResult {
        is_fully_enclosed: is_enclosed && !doors.is_empty(),
        tiles,
        doors,
        missing_walls: vec![],
    }
}
```

---

## 4. Room Validation & State Machine

Every detected room entity transitions through an internal validation state machine:

```
[ Unchecked ]
      │
      ▼
Flood-Fill Scan
      │
      ├──> [ FAILED: Unenclosed / Leaking ] ──► Flash Red Border
      │
      ├──> [ FAILED: Insufficient Area ] ────► Tooltip: "Minimum 6m² required"
      │
      ├──> [ FAILED: Missing Indoors ] ──────► Tooltip: "Requires roof foundation"
      │
      ├──> [ FAILED: Missing Props ] ────────► Tooltip: "Missing: 1 Bed, 1 Toilet"
      │
      ▼
[ VALIDATED / ACTIVE ] ──────────────────────► Available for Inmate Assignment
```

---

## 5. Dynamic Cell Grading (Quality Score: 0 to 10)

Rooms of type `Cell` calculate a **Cell Quality Score** based on luxury furnishings:
* Base cell (Bed, Toilet, $2 \times 3 \text{ m}$): **Grade 1**
* Area $\ge 9 \text{ m}^2$: $+1$
* Area $\ge 16 \text{ m}^2$: $+2$
* Window with exterior view: $+1$
* Television / Radio: $+1$ each
* Bookshelf: $+1$
* Desk and Chair: $+1$
* Shower inside cell: $+1$

### Incentive & Behavioral Impact
Well-behaved prisoners who cause zero misconduct for 5 days earn eligibility to be moved into higher-grade cells. Conversely, placing a violent Maximum Security inmate into a Grade 10 luxury cell while well-behaved inmates reside in squalor sparks institutional jealousy and unrest.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Door Destroyed in Riot** | Rioters bash down cell door; enclosure breaks; room instantly invalidates. | Hysteresis Grace Period: When a door is broken, the room enters a `Compromised (600s)` state rather than instantly canceling inmate assignments and reassigning prisoners to holding cells. |
| **Shared Dormitory Overcrowding** | Player zones 8 beds in a $4 \times 4$ room with 1 toilet. | Dormitory area equation: Area must satisfy $\text{Area} \ge 4 + (2 \times \text{BedCount})$. The UI marks extra beds with red hazard icons if space is illegal. |
| **Air-Gap Double Doors (Airlocks)** | Player builds an airlock where the space between two security doors has no room tag. | Airlock zone is automatically treated as `Corridor / Transit` sector, preserving enclosure for adjacent rooms. |
