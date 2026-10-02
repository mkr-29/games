pub mod components;
pub mod resources;
pub mod stages;
pub mod systems;

use bevy_ecs::prelude::*;
use bevy_ecs::schedule::Schedule;
use wasm_bindgen::prelude::*;

pub use components::*;
pub use resources::*;
pub use stages::*;
pub use systems::*;

use crate::memory::layout::RenderEntityPacked;

/// Central Bevy ECS Simulation Engine
pub struct SimulationEngine {
    pub world: World,
    pub schedule: Schedule,
    pub accumulator: TickAccumulator,
    pub next_entity_id: u32,
}

impl Default for SimulationEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl SimulationEngine {
    pub fn new() -> Self {
        let mut world = World::new();

        // Initialize core resources
        world.insert_resource(SimTimeResource::default());

        // Configure deterministic schedule with chained stages
        let mut schedule = Schedule::default();
        schedule.configure_sets(
            (
                SimStage::InputIngestion,
                SimStage::SpatialUpdate,
                SimStage::PerceptionAI,
                SimStage::Pathfinding,
                SimStage::Physics,
                SimStage::Combat,
                SimStage::Economy,
                SimStage::RenderCommit,
            )
                .chain(),
        );

        // Register core systems in their designated stages
        schedule.add_systems(physics_movement_system.in_set(SimStage::Physics));
        schedule.add_systems(advance_time_system.in_set(SimStage::RenderCommit));

        Self {
            world,
            schedule,
            accumulator: TickAccumulator::default(),
            next_entity_id: 1,
        }
    }

    /// Spawns a single entity into the ECS world
    pub fn spawn_entity(
        &mut self,
        pos: Position,
        vel: Velocity,
        render: Renderable,
    ) -> u32 {
        let id = self.next_entity_id;
        self.next_entity_id += 1;

        self.world.spawn((
            SimulationEntityId(id),
            pos,
            vel,
            render,
        ));

        id
    }

    /// Spawns `count` dummy moving entities for stress-testing and verification
    pub fn spawn_dummy_moving_entities(&mut self, count: usize) -> Vec<u32> {
        let mut ids = Vec::with_capacity(count);

        for i in 0..count {
            let x = (i % 100) as f32 * 10.0;
            let y = (i / 100) as f32 * 10.0;
            // Alternate horizontal/vertical velocities
            let dx = if i % 2 == 0 { 20.0 } else { -20.0 };
            let dy = if i % 3 == 0 { 15.0 } else { -15.0 };

            let id = self.spawn_entity(
                Position::new(x, y),
                Velocity::new(dx, dy),
                Renderable {
                    sprite_index: (i % 16) as u16,
                    anim_frame: 0,
                    status_flags: 0,
                    tint_rgba: 0xFFFFFFFF,
                    rotation: 0.0,
                },
            );
            ids.push(id);
        }

        ids
    }

    /// Advances simulation by a single discrete fixed timestep
    pub fn step_fixed_tick(&mut self) {
        self.schedule.run(&mut self.world);
    }

    /// Feeds host frame delta time into the tick accumulator.
    /// Returns the number of sub-ticks executed (clamped to max 4).
    pub fn step(&mut self, delta_seconds: f32) -> u32 {
        let sub_ticks = self.accumulator.consume(delta_seconds);
        for _ in 0..sub_ticks {
            self.step_fixed_tick();
        }
        sub_ticks
    }

    /// Serializes active ECS entities into the provided RenderEntityPacked slice
    pub fn pack_render_entities(&mut self, output_slice: &mut [RenderEntityPacked]) -> usize {
        serialize_render_entities(&mut self.world, output_slice)
    }

    pub fn get_sim_tick(&self) -> u32 {
        self.world
            .get_resource::<SimTimeResource>()
            .map(|t| t.tick)
            .unwrap_or(0)
    }

    pub fn get_sim_time_seconds(&self) -> f32 {
        self.world
            .get_resource::<SimTimeResource>()
            .map(|t| t.elapsed_seconds)
            .unwrap_or(0.0)
    }

    pub fn get_entity_count(&self) -> usize {
        self.world.entities().len() as usize
    }
}

// ==========================================
// WASM BINDINGS FOR SIMULATION ENGINE
// ==========================================

#[wasm_bindgen]
pub struct WasmSimulationEngine {
    engine: SimulationEngine,
    packed_render_cache: Vec<RenderEntityPacked>,
}

#[wasm_bindgen]
impl WasmSimulationEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            engine: SimulationEngine::new(),
            packed_render_cache: Vec::new(),
        }
    }

    pub fn spawn_dummy_entities(&mut self, count: usize) -> usize {
        self.engine.spawn_dummy_moving_entities(count).len()
    }

    pub fn step(&mut self, delta_seconds: f32) -> u32 {
        self.engine.step(delta_seconds)
    }

    pub fn step_single_tick(&mut self) -> u32 {
        self.engine.step_fixed_tick();
        self.engine.get_sim_tick()
    }

    pub fn get_sim_tick(&self) -> u32 {
        self.engine.get_sim_tick()
    }

    pub fn get_sim_time_seconds(&self) -> f32 {
        self.engine.get_sim_time_seconds()
    }

    pub fn get_entity_count(&self) -> usize {
        self.engine.get_entity_count()
    }

    pub fn get_entity_x(&mut self, entity_id: u32) -> f32 {
        let mut query = self.engine.world.query::<(&SimulationEntityId, &Position)>();
        for (id, pos) in query.iter(&self.engine.world) {
            if id.0 == entity_id {
                return pos.x;
            }
        }
        f32::NAN
    }

    pub fn get_entity_y(&mut self, entity_id: u32) -> f32 {
        let mut query = self.engine.world.query::<(&SimulationEntityId, &Position)>();
        for (id, pos) in query.iter(&self.engine.world) {
            if id.0 == entity_id {
                return pos.y;
            }
        }
        f32::NAN
    }

    pub fn pack_render_entities(&mut self, max_capacity: usize) -> usize {
        if self.packed_render_cache.len() < max_capacity {
            self.packed_render_cache.resize(max_capacity, RenderEntityPacked::default());
        }
        self.engine.pack_render_entities(&mut self.packed_render_cache[..max_capacity])
    }

    pub fn get_packed_entities_ptr(&self) -> *const u8 {
        self.packed_render_cache.as_ptr() as *const u8
    }

    pub fn get_packed_entities_byte_len(&self, entity_count: usize) -> usize {
        entity_count * std::mem::size_of::<RenderEntityPacked>()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tick_accumulator_spiral_of_death_clamping() {
        let mut acc = TickAccumulator::new(1.0 / 60.0, 4);

        // Sub-tick threshold not yet reached
        assert_eq!(acc.consume(0.010), 0); // 10ms < 16.66ms

        // Reaches 1 sub-tick
        assert_eq!(acc.consume(0.010), 1); // 20ms >= 16.66ms (1 tick consumed, ~3.33ms remaining)

        // Huge time jump (e.g. 5.0 seconds from browser tab backgrounding)
        // Must clamp to exactly max_sub_ticks (4)
        let sub_ticks = acc.consume(5.0);
        assert_eq!(sub_ticks, 4, "Tick accumulator must clamp to max 4 sub-ticks");
        assert_eq!(acc.accumulator, 0.0, "Excess accumulator time must be discarded");
    }

    #[test]
    fn test_deterministic_moving_entities_1000() {
        let mut engine = SimulationEngine::new();

        // Spawn 1,000 dummy entities
        let ids = engine.spawn_dummy_moving_entities(1000);
        assert_eq!(ids.len(), 1000);
        assert_eq!(engine.get_entity_count(), 1000);

        // Initial check: entity 0 is at (0, 0) with velocity (20, 15)
        // Execute exactly 60 ticks (1.0 simulated second)
        for _ in 0..60 {
            engine.step_fixed_tick();
        }

        assert_eq!(engine.get_sim_tick(), 60);
        let elapsed = engine.get_sim_time_seconds();
        assert!((elapsed - 1.0).abs() < 0.001);

        // Pack render entities into a buffer
        let mut render_buffer = vec![RenderEntityPacked::default(); 1000];
        let packed_count = engine.pack_render_entities(&mut render_buffer);
        assert_eq!(packed_count, 1000);

        // Verify entity 0 moved exactly (20.0 * 1.0, 15.0 * 1.0) = (20.0, 15.0)
        let e0 = render_buffer.iter().find(|e| e.entity_id == ids[0]).unwrap();
        assert!((e0.pos_x - 20.0).abs() < 0.01, "Entity 0 X should be 20.0, got {}", e0.pos_x);
        assert!((e0.pos_y - 15.0).abs() < 0.01, "Entity 0 Y should be 15.0, got {}", e0.pos_y);

        // Verify entity 1 (dx = -20.0, dy = -15.0, initial x = 10.0, y = 0.0)
        // x_final = 10.0 - 20.0 = -10.0, y_final = 0.0 - 15.0 = -15.0
        let e1 = render_buffer.iter().find(|e| e.entity_id == ids[1]).unwrap();
        assert!((e1.pos_x - (-10.0)).abs() < 0.01, "Entity 1 X should be -10.0, got {}", e1.pos_x);
        assert!((e1.pos_y - (-15.0)).abs() < 0.01, "Entity 1 Y should be -15.0, got {}", e1.pos_y);
    }
}
