use bevy_ecs::prelude::*;

/// World 2D position with elevation layer
#[derive(Component, Debug, Clone, Copy, PartialEq)]
pub struct Position {
    pub x: f32,
    pub y: f32,
    pub layer: i8, // -1=Tunnel/Subfloor, 0=Ground, 1=Upper/Rooftop
}

impl Position {
    pub fn new(x: f32, y: f32) -> Self {
        Self { x, y, layer: 0 }
    }

    pub fn with_layer(x: f32, y: f32, layer: i8) -> Self {
        Self { x, y, layer }
    }
}

/// Movement velocity vector (units per second)
#[derive(Component, Debug, Clone, Copy, PartialEq)]
pub struct Velocity {
    pub dx: f32,
    pub dy: f32,
    pub speed_multiplier: f32,
}

impl Default for Velocity {
    fn default() -> Self {
        Self {
            dx: 0.0,
            dy: 0.0,
            speed_multiplier: 1.0,
        }
    }
}

impl Velocity {
    pub fn new(dx: f32, dy: f32) -> Self {
        Self {
            dx,
            dy,
            speed_multiplier: 1.0,
        }
    }
}

/// Rendering appearance attributes matching WebGPU packed instance layout
#[derive(Component, Debug, Clone, Copy, PartialEq)]
pub struct Renderable {
    pub sprite_index: u16,
    pub anim_frame: u8,
    pub status_flags: u8,
    pub tint_rgba: u32,
    pub rotation: f32,
}

impl Default for Renderable {
    fn default() -> Self {
        Self {
            sprite_index: 0,
            anim_frame: 0,
            status_flags: 0,
            tint_rgba: 0xFFFFFFFF, // Opaque white
            rotation: 0.0,
        }
    }
}

/// Explicit persistent entity ID for networking / save-game mapping
#[derive(Component, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct SimulationEntityId(pub u32);
