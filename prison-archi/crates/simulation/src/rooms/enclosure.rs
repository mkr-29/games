use std::collections::{HashMap, HashSet, VecDeque};
use bevy_ecs::prelude::*;

use crate::grid::chunk::TileGrid;
use crate::grid::tile::tile_flags;

/// Object archetypes placed inside rooms.
pub mod object_types {
    pub const NONE: u16 = 0;
    pub const BED: u16 = 10;
    pub const TOILET: u16 = 11;
    pub const SERVING_TABLE: u16 = 20;
    pub const TABLE: u16 = 21;
    pub const BENCH: u16 = 22;
    pub const COOKER: u16 = 30;
    pub const FRIDGE: u16 = 31;
    pub const SINK: u16 = 32;
    pub const WINDOW: u16 = 40;
    pub const TV: u16 = 41;
    pub const RADIO: u16 = 42;
    pub const BOOKSHELF: u16 = 43;
    pub const DESK: u16 = 44;
    pub const CHAIR: u16 = 45;
    pub const SHOWER: u16 = 46;
    pub const JAIL_DOOR: u16 = 100;
    pub const WOODEN_DOOR: u16 = 101;
    pub const STAFF_DOOR: u16 = 102;
}

/// Helper to check if an object ID represents a valid sealing door.
pub fn is_door_object(object_id: u16) -> bool {
    matches!(
        object_id,
        object_types::JAIL_DOOR | object_types::WOODEN_DOOR | object_types::STAFF_DOOR
    )
}

/// Room archetype identifier.
#[repr(u16)]
#[derive(Component, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RoomType {
    Unzoned = 0,
    Cell = 1,
    Canteen = 2,
    Kitchen = 3,
    Yard = 4,
    Solitary = 5,
    HoldingCell = 6,
}

impl RoomType {
    pub fn from_u16(val: u16) -> Self {
        match val {
            1 => RoomType::Cell,
            2 => RoomType::Canteen,
            3 => RoomType::Kitchen,
            4 => RoomType::Yard,
            5 => RoomType::Solitary,
            6 => RoomType::HoldingCell,
            _ => RoomType::Unzoned,
        }
    }
}

/// Immutable requirement definition for a room type.
#[derive(Debug, Clone)]
pub struct RoomRequirementDefinition {
    pub room_type: RoomType,
    pub name: &'static str,
    pub must_be_indoors: bool,
    pub min_area_tiles: usize,
    pub min_dimension_x: usize,
    pub min_dimension_y: usize,
    pub required_objects: &'static [(u16, u16)], // (ObjectTypeId, RequiredCount)
}

/// Static registry of official room schemas.
pub static ROOM_REGISTRY: &[RoomRequirementDefinition] = &[
    RoomRequirementDefinition {
        room_type: RoomType::Cell,
        name: "Cell",
        must_be_indoors: true,
        min_area_tiles: 6,
        min_dimension_x: 2,
        min_dimension_y: 3,
        required_objects: &[
            (object_types::BED, 1),
            (object_types::TOILET, 1),
        ],
    },
    RoomRequirementDefinition {
        room_type: RoomType::Canteen,
        name: "Canteen",
        must_be_indoors: true,
        min_area_tiles: 16,
        min_dimension_x: 4,
        min_dimension_y: 4,
        required_objects: &[
            (object_types::SERVING_TABLE, 1),
            (object_types::TABLE, 1),
            (object_types::BENCH, 1),
        ],
    },
    RoomRequirementDefinition {
        room_type: RoomType::Kitchen,
        name: "Kitchen",
        must_be_indoors: true,
        min_area_tiles: 12,
        min_dimension_x: 3,
        min_dimension_y: 3,
        required_objects: &[
            (object_types::COOKER, 1),
            (object_types::FRIDGE, 1),
            (object_types::SINK, 1),
        ],
    },
    RoomRequirementDefinition {
        room_type: RoomType::Yard,
        name: "Yard",
        must_be_indoors: false,
        min_area_tiles: 36,
        min_dimension_x: 6,
        min_dimension_y: 6,
        required_objects: &[],
    },
    RoomRequirementDefinition {
        room_type: RoomType::Solitary,
        name: "Solitary",
        must_be_indoors: true,
        min_area_tiles: 1,
        min_dimension_x: 1,
        min_dimension_y: 1,
        required_objects: &[],
    },
    RoomRequirementDefinition {
        room_type: RoomType::HoldingCell,
        name: "Holding Cell",
        must_be_indoors: true,
        min_area_tiles: 20,
        min_dimension_x: 4,
        min_dimension_y: 5,
        required_objects: &[
            (object_types::TOILET, 1),
            (object_types::BENCH, 1),
        ],
    },
];

pub fn get_room_definition(room_type: RoomType) -> Option<&'static RoomRequirementDefinition> {
    ROOM_REGISTRY.iter().find(|def| def.room_type == room_type)
}

/// Validation state of a detected room.
#[derive(Component, Debug, Clone, PartialEq, Eq)]
pub enum RoomValidationStatus {
    Valid,
    Unenclosed { leak_x: usize, leak_y: usize },
    NoDoor,
    MissingProps { missing_object_id: u16, required_count: u16, current_count: u16 },
    InsufficientArea { current_area: usize, min_required: usize },
    NotIndoors,
}

/// Scanned room enclosure data.
#[derive(Component, Debug, Clone, PartialEq)]
pub struct EnclosureScanResult {
    pub is_fully_enclosed: bool,
    pub has_door: bool,
    pub tiles: Vec<(usize, usize)>,
    pub doors: Vec<(usize, usize)>,
    pub placed_objects: HashMap<u16, u16>,
    pub leak_coord: Option<(usize, usize)>,
    pub is_entirely_indoors: bool,
    pub width: usize,
    pub height: usize,
}

/// High-level Room entity managed by simulation.
#[derive(Debug, Clone, PartialEq)]
pub struct RoomEntity {
    pub id: u32,
    pub room_type: RoomType,
    pub status: RoomValidationStatus,
    pub tiles: Vec<(usize, usize)>,
    pub doors: Vec<(usize, usize)>,
    pub area: usize,
    pub center_x: f32,
    pub center_y: f32,
}

/// Simulation events emitted during room enclosure scans.
#[derive(Debug, Clone, PartialEq)]
pub enum RoomEvent {
    RoomEnclosureValid {
        room_id: u32,
        room_type: RoomType,
        area: usize,
    },
    RoomEnclosureLeaking {
        room_id: u32,
        leak_x: usize,
        leak_y: usize,
    },
    RoomMissingProps {
        room_id: u32,
        missing_object_id: u16,
        required_count: u16,
        current_count: u16,
    },
    RoomInsufficientArea {
        room_id: u32,
        current_area: usize,
        min_required: usize,
    },
    RoomNotIndoors {
        room_id: u32,
    },
}

/// Scans a connected-components room enclosure starting at (start_x, start_y).
/// Bounded by solid walls and doors.
pub fn scan_room_enclosure(
    start_x: usize,
    start_y: usize,
    target_room_type: RoomType,
    zone_map: &HashMap<(usize, usize), RoomType>,
    object_map: &HashMap<(usize, usize), u16>,
    grid: &TileGrid,
    max_scan_limit: usize,
) -> EnclosureScanResult {
    let mut visited = HashSet::new();
    let mut queue = VecDeque::new();
    let mut tiles = Vec::new();
    let mut doors = Vec::new();
    let mut placed_objects: HashMap<u16, u16> = HashMap::new();
    let mut is_enclosed = true;
    let mut leak_coord = None;
    let mut all_indoors = true;

    queue.push_back((start_x, start_y));
    visited.insert((start_x, start_y));

    let mut min_x = start_x;
    let mut max_x = start_x;
    let mut min_y = start_y;
    let mut max_y = start_y;

    while let Some((cx, cy)) = queue.pop_front() {
        if tiles.len() > max_scan_limit {
            return EnclosureScanResult {
                is_fully_enclosed: false,
                has_door: !doors.is_empty(),
                tiles,
                doors,
                placed_objects,
                leak_coord: Some((cx, cy)),
                is_entirely_indoors: false,
                width: 0,
                height: 0,
            };
        }

        tiles.push((cx, cy));
        min_x = min_x.min(cx);
        max_x = max_x.max(cx);
        min_y = min_y.min(cy);
        max_y = max_y.max(cy);

        if let Some(tile) = grid.get_tile(cx, cy) {
            if (tile.flags & tile_flags::INDOOR) == 0 {
                all_indoors = false;
            }
        }

        // Check if there is an object on this tile
        if let Some(&obj_id) = object_map.get(&(cx, cy)) {
            *placed_objects.entry(obj_id).or_insert(0) += 1;
        }

        let neighbors = [
            (cx.wrapping_sub(1), cy, cx > 0),
            (cx + 1, cy, cx + 1 < grid.width),
            (cx, cy.wrapping_sub(1), cy > 0),
            (cx, cy + 1, cy + 1 < grid.height),
        ];

        for (nx, ny, valid) in neighbors {
            if !valid {
                // Map edge is an open leak unless walled
                is_enclosed = false;
                if leak_coord.is_none() {
                    leak_coord = Some((cx, cy));
                }
                continue;
            }

            if visited.contains(&(nx, ny)) {
                continue;
            }

            // Check if boundary is a solid wall
            if let Some(tile) = grid.get_tile(nx, ny) {
                if tile.wall_id != 0 {
                    continue; // Sealed by wall
                }
            }

            // Check if boundary has an approved door
            if let Some(&obj_id) = object_map.get(&(nx, ny)) {
                if is_door_object(obj_id) {
                    if !doors.contains(&(nx, ny)) {
                        doors.push((nx, ny));
                    }
                    continue; // Sealed by door
                }
            }

            // If tile has a different room zone or is unzoned, this is a leak!
            let neighbor_zone = zone_map.get(&(nx, ny)).copied().unwrap_or(RoomType::Unzoned);
            if neighbor_zone != target_room_type {
                is_enclosed = false;
                if leak_coord.is_none() {
                    leak_coord = Some((nx, ny));
                }
                continue;
            }

            visited.insert((nx, ny));
            queue.push_back((nx, ny));
        }
    }

    let width = if tiles.is_empty() { 0 } else { max_x - min_x + 1 };
    let height = if tiles.is_empty() { 0 } else { max_y - min_y + 1 };

    EnclosureScanResult {
        is_fully_enclosed: is_enclosed,
        has_door: !doors.is_empty(),
        tiles,
        doors,
        placed_objects,
        leak_coord,
        is_entirely_indoors: all_indoors,
        width,
        height,
    }
}

/// Validates room requirements against the official definition registry.
pub fn validate_room_requirements(
    room_type: RoomType,
    scan: &EnclosureScanResult,
) -> RoomValidationStatus {
    let def = match get_room_definition(room_type) {
        Some(d) => d,
        None => return RoomValidationStatus::Valid,
    };

    if !scan.is_fully_enclosed {
        let (lx, ly) = scan.leak_coord.unwrap_or((0, 0));
        return RoomValidationStatus::Unenclosed { leak_x: lx, leak_y: ly };
    }

    // Yard is an outdoor room and does not strictly require an interior door if enclosed by perimeter fences
    if room_type != RoomType::Yard && !scan.has_door {
        return RoomValidationStatus::NoDoor;
    }

    if def.must_be_indoors && !scan.is_entirely_indoors {
        return RoomValidationStatus::NotIndoors;
    }

    if scan.tiles.len() < def.min_area_tiles {
        return RoomValidationStatus::InsufficientArea {
            current_area: scan.tiles.len(),
            min_required: def.min_area_tiles,
        };
    }

    // Check required props / objects
    for &(obj_id, req_count) in def.required_objects {
        let current_count = scan.placed_objects.get(&obj_id).copied().unwrap_or(0);
        if current_count < req_count {
            return RoomValidationStatus::MissingProps {
                missing_object_id: obj_id,
                required_count: req_count,
                current_count,
            };
        }
    }

    RoomValidationStatus::Valid
}

/// Global Room Manager Resource.
#[derive(Resource)]
pub struct RoomManager {
    pub rooms: Vec<RoomEntity>,
    pub zone_map: HashMap<(usize, usize), RoomType>,
    pub object_map: HashMap<(usize, usize), u16>,
    pub events: Vec<RoomEvent>,
    next_room_id: u32,
}

impl Default for RoomManager {
    fn default() -> Self {
        Self::new()
    }
}

impl RoomManager {
    pub fn new() -> Self {
        Self {
            rooms: Vec::new(),
            zone_map: HashMap::new(),
            object_map: HashMap::new(),
            events: Vec::new(),
            next_room_id: 1,
        }
    }

    pub fn set_zone(&mut self, x: usize, y: usize, room_type: RoomType) {
        if room_type == RoomType::Unzoned {
            self.zone_map.remove(&(x, y));
        } else {
            self.zone_map.insert((x, y), room_type);
        }
    }

    pub fn place_object(&mut self, x: usize, y: usize, object_id: u16) {
        if object_id == object_types::NONE {
            self.object_map.remove(&(x, y));
        } else {
            self.object_map.insert((x, y), object_id);
        }
    }

    pub fn remove_object(&mut self, x: usize, y: usize) {
        self.object_map.remove(&(x, y));
    }

    /// Evaluates all zoned rooms on the grid, running enclosure flood-fills and validation checks.
    pub fn scan_and_validate_all(&mut self, grid: &TileGrid) {
        self.events.clear();
        self.rooms.clear();

        let mut processed_tiles = HashSet::new();

        // Group contiguous tiles by room type
        for (&(x, y), &room_type) in &self.zone_map {
            if processed_tiles.contains(&(x, y)) {
                continue;
            }

            let scan = scan_room_enclosure(
                x,
                y,
                room_type,
                &self.zone_map,
                &self.object_map,
                grid,
                5000,
            );

            for &tile in &scan.tiles {
                processed_tiles.insert(tile);
            }

            let status = validate_room_requirements(room_type, &scan);
            let room_id = self.next_room_id;
            self.next_room_id += 1;

            let (cx, cy) = if scan.tiles.is_empty() {
                (x as f32, y as f32)
            } else {
                let sum_x: usize = scan.tiles.iter().map(|(tx, _)| tx).sum();
                let sum_y: usize = scan.tiles.iter().map(|(_, ty)| ty).sum();
                (sum_x as f32 / scan.tiles.len() as f32, sum_y as f32 / scan.tiles.len() as f32)
            };

            let room_entity = RoomEntity {
                id: room_id,
                room_type,
                status: status.clone(),
                tiles: scan.tiles.clone(),
                doors: scan.doors.clone(),
                area: scan.tiles.len(),
                center_x: cx,
                center_y: cy,
            };

            match &status {
                RoomValidationStatus::Valid => {
                    self.events.push(RoomEvent::RoomEnclosureValid {
                        room_id,
                        room_type,
                        area: scan.tiles.len(),
                    });
                }
                RoomValidationStatus::Unenclosed { leak_x, leak_y } => {
                    self.events.push(RoomEvent::RoomEnclosureLeaking {
                        room_id,
                        leak_x: *leak_x,
                        leak_y: *leak_y,
                    });
                }
                RoomValidationStatus::MissingProps {
                    missing_object_id,
                    required_count,
                    current_count,
                } => {
                    self.events.push(RoomEvent::RoomMissingProps {
                        room_id,
                        missing_object_id: *missing_object_id,
                        required_count: *required_count,
                        current_count: *current_count,
                    });
                }
                RoomValidationStatus::InsufficientArea {
                    current_area,
                    min_required,
                } => {
                    self.events.push(RoomEvent::RoomInsufficientArea {
                        room_id,
                        current_area: *current_area,
                        min_required: *min_required,
                    });
                }
                RoomValidationStatus::NotIndoors => {
                    self.events.push(RoomEvent::RoomNotIndoors { room_id });
                }
                RoomValidationStatus::NoDoor => {}
            }

            self.rooms.push(room_entity);
        }
    }
}

/// Bevy ECS system executing room validation.
pub fn scan_and_validate_rooms_system(
    mut room_manager: ResMut<RoomManager>,
    grid: Res<TileGrid>,
) {
    room_manager.scan_and_validate_all(&grid);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::grid::tile::TileCellDescriptor;

    fn make_indoor_tile() -> TileCellDescriptor {
        let mut t = TileCellDescriptor::empty();
        t.flags |= tile_flags::INDOOR;
        t
    }

    fn make_wall_tile() -> TileCellDescriptor {
        let mut t = TileCellDescriptor::empty();
        t.wall_id = 1; // Brick Wall
        t.flags |= tile_flags::INDOOR;
        t
    }

    #[test]
    fn test_valid_enclosed_cell_with_bed_and_toilet() {
        // Verification Criterion 1:
        // Build a 2x3 walled room with a door, zoned as Cell. Place Bed and Toilet. Assert room status is VALID.
        let mut grid = TileGrid::new(32, 32);
        let mut manager = RoomManager::new();

        // 2x3 interior cell: x in 5..=6, y in 5..=7 (6 tiles)
        // Surrounding wall perimeter: x in 4..=7, y in 4..=8
        for x in 4..=7 {
            for y in 4..=8 {
                if x == 4 || x == 7 || y == 4 || y == 8 {
                    grid.set_tile(x, y, make_wall_tile());
                } else {
                    grid.set_tile(x, y, make_indoor_tile());
                    manager.set_zone(x, y, RoomType::Cell);
                }
            }
        }

        // Place a Jail Door on South wall at (5, 8)
        grid.set_tile(5, 8, make_indoor_tile()); // Door opening in wall
        manager.place_object(5, 8, object_types::JAIL_DOOR);

        // Place Bed at (5, 5) and Toilet at (6, 7)
        manager.place_object(5, 5, object_types::BED);
        manager.place_object(6, 7, object_types::TOILET);

        manager.scan_and_validate_all(&grid);

        assert_eq!(manager.rooms.len(), 1);
        let cell = &manager.rooms[0];
        assert_eq!(cell.room_type, RoomType::Cell);
        assert_eq!(cell.area, 6);
        assert_eq!(cell.status, RoomValidationStatus::Valid);
        assert_eq!(
            manager.events,
            vec![RoomEvent::RoomEnclosureValid {
                room_id: cell.id,
                room_type: RoomType::Cell,
                area: 6,
            }]
        );
    }

    #[test]
    fn test_demolished_wall_causes_enclosure_leak() {
        // Verification Criterion 2:
        // Demolish one wall tile to create an opening. Assert room status transitions to LEAKING / UNENCLOSED.
        let mut grid = TileGrid::new(32, 32);
        let mut manager = RoomManager::new();

        // Build 2x3 walled room
        for x in 4..=7 {
            for y in 4..=8 {
                if x == 4 || x == 7 || y == 4 || y == 8 {
                    grid.set_tile(x, y, make_wall_tile());
                } else {
                    grid.set_tile(x, y, make_indoor_tile());
                    manager.set_zone(x, y, RoomType::Cell);
                }
            }
        }

        // Door at (5, 8)
        grid.set_tile(5, 8, make_indoor_tile());
        manager.place_object(5, 8, object_types::JAIL_DOOR);

        // Bed and Toilet
        manager.place_object(5, 5, object_types::BED);
        manager.place_object(6, 7, object_types::TOILET);

        // Demolish wall tile at (7, 6) creating an opening to the outside/corridor
        grid.set_tile(7, 6, make_indoor_tile()); // No wall!

        manager.scan_and_validate_all(&grid);

        assert_eq!(manager.rooms.len(), 1);
        let cell = &manager.rooms[0];
        assert_eq!(
            cell.status,
            RoomValidationStatus::Unenclosed {
                leak_x: 7,
                leak_y: 6,
            }
        );
    }

    #[test]
    fn test_missing_props_fails_validation() {
        // Verification Criterion 3:
        // Remove the toilet. Assert room status displays MISSING_OBJECT: Toilet.
        let mut grid = TileGrid::new(32, 32);
        let mut manager = RoomManager::new();

        // Build 2x3 walled room
        for x in 4..=7 {
            for y in 4..=8 {
                if x == 4 || x == 7 || y == 4 || y == 8 {
                    grid.set_tile(x, y, make_wall_tile());
                } else {
                    grid.set_tile(x, y, make_indoor_tile());
                    manager.set_zone(x, y, RoomType::Cell);
                }
            }
        }

        // Door at (5, 8)
        grid.set_tile(5, 8, make_indoor_tile());
        manager.place_object(5, 8, object_types::JAIL_DOOR);

        // Place Bed only (Toilet missing!)
        manager.place_object(5, 5, object_types::BED);

        manager.scan_and_validate_all(&grid);

        assert_eq!(manager.rooms.len(), 1);
        let cell = &manager.rooms[0];
        assert_eq!(
            cell.status,
            RoomValidationStatus::MissingProps {
                missing_object_id: object_types::TOILET,
                required_count: 1,
                current_count: 0,
            }
        );
    }
}
