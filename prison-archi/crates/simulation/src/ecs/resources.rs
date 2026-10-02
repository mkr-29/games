use bevy_ecs::prelude::*;

/// Global simulation time resource
#[derive(Resource, Debug, Clone)]
pub struct SimTimeResource {
    pub tick: u32,
    pub elapsed_seconds: f32,
    pub tick_delta_seconds: f32,
}

impl Default for SimTimeResource {
    fn default() -> Self {
        Self {
            tick: 0,
            elapsed_seconds: 0.0,
            tick_delta_seconds: 1.0 / 60.0, // Fixed 60Hz timestep (~16.666 ms)
        }
    }
}

/// Accumulates host delta time and steps fixed simulation ticks.
/// Clamps to `max_sub_ticks` (default: 4) to prevent spiral-of-death freeze.
#[derive(Resource, Debug, Clone)]
pub struct TickAccumulator {
    pub accumulator: f32,
    pub fixed_timestep: f32,
    pub max_sub_ticks: u32,
}

impl Default for TickAccumulator {
    fn default() -> Self {
        Self {
            accumulator: 0.0,
            fixed_timestep: 1.0 / 60.0, // 60Hz
            max_sub_ticks: 4,           // Max 4 sub-ticks per frame
        }
    }
}

impl TickAccumulator {
    pub fn new(fixed_timestep: f32, max_sub_ticks: u32) -> Self {
        Self {
            accumulator: 0.0,
            fixed_timestep,
            max_sub_ticks,
        }
    }

    /// Feeds host delta time and returns the number of sub-ticks to execute (0..max_sub_ticks).
    pub fn consume(&mut self, delta_seconds: f32) -> u32 {
        self.accumulator += delta_seconds;
        let mut sub_ticks = 0;

        while self.accumulator >= self.fixed_timestep && sub_ticks < self.max_sub_ticks {
            self.accumulator -= self.fixed_timestep;
            sub_ticks += 1;
        }

        // Clamp excess accumulated time if we reached max sub-ticks (prevent spiral of death)
        if sub_ticks >= self.max_sub_ticks && self.accumulator >= self.fixed_timestep {
            self.accumulator = 0.0;
        }

        sub_ticks
    }
}
