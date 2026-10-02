use bytemuck::{Pod, Zeroable};

/// Bitflags representing special runtime states of a tile
pub mod tile_flags {
    pub const NONE: u16 = 0;
    pub const INDOOR: u16 = 1 << 0;
    pub const ELECTRIFIED: u16 = 1 << 1;
    pub const ON_FIRE: u16 = 1 << 2;
    pub const CONTRABAND_CACHE: u16 = 1 << 3;
    pub const BLUEPRINT: u16 = 1 << 4;
    pub const BLOCKED_PATH: u16 = 1 << 5;
    pub const SUBTERRANEAN_TUNNEL: u16 = 1 << 6;
    pub const SECURE_ZONE: u16 = 1 << 7;
    pub const OUTDOOR_PATROL: u16 = 1 << 8;
}

/// Packed 12-byte representation of a single tile coordinate.
/// Aligned to 4 bytes for zero-copy GPU staging and cache locality.
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Pod, Zeroable)]
pub struct TileCellDescriptor {
    pub terrain_id: u8,        // 0=Dirt, 1=Grass, 2=Sand, 3=Water, 4=Pavement...
    pub floor_id: u8,          // 0=None, 1=Concrete, 2=CeramicTile, 3=Wood, 4=Metal...
    pub wall_id: u8,           // 0=None, 1=Brick, 2=ReinforcedConcrete, 3=PerimeterWall...
    pub wall_autotile_idx: u8, // 0..15 calculated via 4-bit neighbor connectivity
    pub object_entity_id: u32, // Entity ID of mounted prop/door (0 if none)
    pub flags: u16,            // Bitflags (tile_flags::*)
    pub health: u8,            // 0..255 structural integrity (damage from riots/explosives)
    pub decal_mask: u8,        // Packed grime/blood decal intensity
}

impl TileCellDescriptor {
    pub const fn empty() -> Self {
        Self {
            terrain_id: 0,
            floor_id: 0,
            wall_id: 0,
            wall_autotile_idx: 0,
            object_entity_id: 0,
            flags: 0,
            health: 255,
            decal_mask: 0,
        }
    }

    pub fn is_solid(&self) -> bool {
        self.wall_id != 0 || (self.flags & tile_flags::BLOCKED_PATH) != 0
    }

    pub fn is_indoor(&self) -> bool {
        (self.flags & tile_flags::INDOOR) != 0
    }

    pub fn is_blueprint(&self) -> bool {
        (self.flags & tile_flags::BLUEPRINT) != 0
    }
}

/// Material Physical and Economic Properties
#[derive(Clone, Debug, PartialEq)]
pub struct MaterialDefinition {
    pub id: u8,
    pub name: &'static str,
    pub max_health: u16,
    pub walk_speed_multiplier: f32, // Grass=0.8, Concrete=1.0, PavedRoad=1.2
    pub dig_resistance: f32,        // Multiplier for tunnel digging effort (PerimeterWall=10.0)
    pub is_breathable_outdoors: bool,
    pub acoustic_dampening_db: f32,  // Decibel attenuation for sound propagation
    pub flammability_rating: u8,    // 0=Fireproof (Steel), 100=Highly Combustible (Wood)
    pub cost_cents: u32,            // Construction price ($50.00 = 5000 cents)
}

pub static MATERIAL_REGISTRY: &[MaterialDefinition] = &[
    MaterialDefinition {
        id: 0,
        name: "Empty / Dirt",
        max_health: 100,
        walk_speed_multiplier: 0.8,
        dig_resistance: 1.0,
        is_breathable_outdoors: true,
        acoustic_dampening_db: 0.0,
        flammability_rating: 0,
        cost_cents: 0,
    },
    MaterialDefinition {
        id: 1,
        name: "Brick Wall",
        max_health: 200,
        walk_speed_multiplier: 0.0,
        dig_resistance: 1.0,
        is_breathable_outdoors: false,
        acoustic_dampening_db: 18.0,
        flammability_rating: 10,
        cost_cents: 5000, // $50.00
    },
    MaterialDefinition {
        id: 2,
        name: "Reinforced Concrete",
        max_health: 600,
        walk_speed_multiplier: 0.0,
        dig_resistance: 3.5,
        is_breathable_outdoors: false,
        acoustic_dampening_db: 32.0,
        flammability_rating: 0,
        cost_cents: 12000, // $120.00
    },
    MaterialDefinition {
        id: 3,
        name: "Perimeter Wall",
        max_health: 1200,
        walk_speed_multiplier: 0.0,
        dig_resistance: 10.0, // High tunnel deterrent
        is_breathable_outdoors: false,
        acoustic_dampening_db: 40.0,
        flammability_rating: 0,
        cost_cents: 35000, // $350.00
    },
    MaterialDefinition {
        id: 4,
        name: "Grass Terrain",
        max_health: 100,
        walk_speed_multiplier: 0.85,
        dig_resistance: 0.8,
        is_breathable_outdoors: true,
        acoustic_dampening_db: 2.0,
        flammability_rating: 30,
        cost_cents: 500, // $5.00
    },
    MaterialDefinition {
        id: 5,
        name: "Concrete Floor",
        max_health: 300,
        walk_speed_multiplier: 1.0,
        dig_resistance: 2.0,
        is_breathable_outdoors: false,
        acoustic_dampening_db: 8.0,
        flammability_rating: 0,
        cost_cents: 1000, // $10.00
    },
];

pub fn get_material_definition(id: u8) -> &'static MaterialDefinition {
    for mat in MATERIAL_REGISTRY {
        if mat.id == id {
            return mat;
        }
    }
    &MATERIAL_REGISTRY[0]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tile_cell_descriptor_layout_and_size() {
        assert_eq!(
            std::mem::size_of::<TileCellDescriptor>(),
            12,
            "TileCellDescriptor must be exactly 12 bytes"
        );
        assert_eq!(
            std::mem::align_of::<TileCellDescriptor>(),
            4,
            "TileCellDescriptor must be 4-byte aligned"
        );

        // Verify Pod/Zeroable roundtrip
        let desc = TileCellDescriptor {
            terrain_id: 1,
            floor_id: 2,
            wall_id: 3,
            wall_autotile_idx: 15,
            object_entity_id: 42,
            flags: tile_flags::INDOOR | tile_flags::ELECTRIFIED,
            health: 200,
            decal_mask: 128,
        };

        let bytes: [u8; 12] = bytemuck::cast(desc);
        let decoded: TileCellDescriptor = bytemuck::cast(bytes);
        assert_eq!(desc, decoded);
    }

    #[test]
    fn test_material_registry_lookup() {
        let brick = get_material_definition(1);
        assert_eq!(brick.name, "Brick Wall");
        assert_eq!(brick.cost_cents, 5000);
        assert_eq!(brick.walk_speed_multiplier, 0.0);

        let perimeter = get_material_definition(3);
        assert_eq!(perimeter.dig_resistance, 10.0);

        // Fallback for unknown ID returns default (empty/dirt)
        let unknown = get_material_definition(99);
        assert_eq!(unknown.id, 0);
    }
}
