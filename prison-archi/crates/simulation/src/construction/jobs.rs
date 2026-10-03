use bevy_ecs::prelude::*;

use crate::ecs::components::{Position, Renderable, SimulationEntityId, Velocity};
use crate::ecs::resources::SimTimeResource;
use crate::grid::autotile::set_wall_and_propagate_autotile;
use crate::grid::chunk::TileGrid;
use crate::grid::tile::tile_flags;

/// Type of construction or demolition job
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum JobType {
    BuildWall { material_id: u8 },
    BuildFloor { material_id: u8 },
    DemolishWall,
}

/// Lifecycle status of a construction job
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum JobStatus {
    Queued,
    FetchingMaterial { workman_id: u32 },
    Constructing { workman_id: u32 },
    Completed,
    Cancelled,
}

/// A discrete construction job targeting a specific grid tile
#[derive(Debug, Clone, PartialEq)]
pub struct ConstructionJob {
    pub id: u32,
    pub target_x: usize,
    pub target_y: usize,
    pub job_type: JobType,
    pub required_material: u8,
    pub cost_cents: u32,
    pub progress_ticks: u16,
    pub total_ticks: u16,
    pub status: JobStatus,
}

impl ConstructionJob {
    pub fn new_wall(id: u32, x: usize, y: usize, material_id: u8, total_ticks: u16) -> Self {
        Self {
            id,
            target_x: x,
            target_y: y,
            job_type: JobType::BuildWall { material_id },
            required_material: material_id,
            cost_cents: 5000, // $50.00
            progress_ticks: 0,
            total_ticks,
            status: JobStatus::Queued,
        }
    }

    pub fn progress_ratio(&self) -> f32 {
        if self.total_ticks == 0 {
            1.0
        } else {
            (self.progress_ticks as f32 / self.total_ticks as f32).min(1.0)
        }
    }
}

/// Global delivery zone where construction materials (bricks, concrete) arrive and workmen spawn
#[derive(Resource, Debug, Clone, PartialEq)]
pub struct DeliveryZone {
    pub min_x: f32,
    pub min_y: f32,
    pub max_x: f32,
    pub max_y: f32,
    pub center_x: f32,
    pub center_y: f32,
}

impl Default for DeliveryZone {
    fn default() -> Self {
        Self::new(10.0, 10.0, 16.0, 16.0)
    }
}

impl DeliveryZone {
    pub fn new(min_x: f32, min_y: f32, max_x: f32, max_y: f32) -> Self {
        Self {
            min_x,
            min_y,
            max_x,
            max_y,
            center_x: (min_x + max_x) * 0.5,
            center_y: (min_y + max_y) * 0.5,
        }
    }
}

/// Workman Agent State
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum WorkmanState {
    Idle,
    WalkingToDelivery { job_id: u32 },
    CarryingMaterial { job_id: u32, material_id: u8, target_x: f32, target_y: f32 },
    Building { job_id: u32 },
}

/// Workman Component
#[derive(Component, Debug, Clone)]
pub struct Workman {
    pub state: WorkmanState,
    pub base_speed: f32, // tiles per second
    pub current_job_id: Option<u32>,
}

impl Default for Workman {
    fn default() -> Self {
        Self {
            state: WorkmanState::Idle,
            base_speed: 4.0, // 4 tiles per second
            current_job_id: None,
        }
    }
}

/// Queue and manager of pending and active construction jobs
#[derive(Resource, Debug, Default)]
pub struct ConstructionQueue {
    pub jobs: Vec<ConstructionJob>,
    pub next_job_id: u32,
    pub completed_jobs_count: u32,
}

impl ConstructionQueue {
    pub fn new() -> Self {
        Self {
            jobs: Vec::new(),
            next_job_id: 1,
            completed_jobs_count: 0,
        }
    }

    /// Queues a wall construction job at (x, y) if valid and not already queued
    pub fn queue_wall(
        &mut self,
        grid: &mut TileGrid,
        x: usize,
        y: usize,
        material_id: u8,
        total_ticks: u16,
    ) -> Option<u32> {
        if x >= grid.width || y >= grid.height {
            return None;
        }

        // Check if tile already has this wall solid or has an active blueprint
        if let Some(tile) = grid.get_tile_mut(x, y) {
            let is_solid = tile.wall_id == material_id && (tile.flags & tile_flags::BLUEPRINT) == 0;
            if is_solid {
                return None; // Already built solid wall
            }

            // Mark tile as blueprint ghost
            tile.flags |= tile_flags::BLUEPRINT;
            tile.wall_id = material_id;
        } else {
            return None;
        }

        let job_id = self.next_job_id;
        self.next_job_id += 1;

        let job = ConstructionJob::new_wall(job_id, x, y, material_id, total_ticks);
        self.jobs.push(job);
        Some(job_id)
    }

    /// Queues a rectangular foundation or perimeter wall.
    /// `hollow`: If true, only places jobs along the 4 borders of the rectangle. If false, fills the entire rectangle.
    pub fn queue_wall_rect(
        &mut self,
        grid: &mut TileGrid,
        min_x: usize,
        min_y: usize,
        max_x: usize,
        max_y: usize,
        material_id: u8,
        hollow: bool,
        total_ticks_per_tile: u16,
    ) -> Vec<u32> {
        let x1 = min_x.min(max_x);
        let x2 = min_x.max(max_x);
        let y1 = min_y.min(max_y);
        let y2 = min_y.max(max_y);

        let mut queued_ids = Vec::new();

        for y in y1..=y2 {
            for x in x1..=x2 {
                if hollow {
                    let is_border = x == x1 || x == x2 || y == y1 || y == y2;
                    if !is_border {
                        continue;
                    }
                }
                if let Some(job_id) = self.queue_wall(grid, x, y, material_id, total_ticks_per_tile) {
                    queued_ids.push(job_id);
                }
            }
        }

        queued_ids
    }

    pub fn get_job(&self, job_id: u32) -> Option<&ConstructionJob> {
        self.jobs.iter().find(|j| j.id == job_id)
    }

    pub fn get_job_mut(&mut self, job_id: u32) -> Option<&mut ConstructionJob> {
        self.jobs.iter_mut().find(|j| j.id == job_id)
    }

    pub fn pending_jobs_count(&self) -> usize {
        self.jobs.iter().filter(|j| matches!(j.status, JobStatus::Queued)).count()
    }

    pub fn active_jobs_count(&self) -> usize {
        self.jobs.iter().filter(|j| !matches!(j.status, JobStatus::Completed | JobStatus::Cancelled)).count()
    }
}

/// Dispatches idle Workmen to pick up materials and execute construction jobs
pub fn workman_job_system(
    time: Res<SimTimeResource>,
    delivery: Res<DeliveryZone>,
    mut queue: ResMut<ConstructionQueue>,
    mut grid: ResMut<TileGrid>,
    mut query: Query<(
        Entity,
        &SimulationEntityId,
        &mut Position,
        &mut Velocity,
        &mut Workman,
        Option<&mut Renderable>,
    )>,
) {
    let _dt = time.tick_delta_seconds;

    // 1. Dispatch Idle Workmen to Queued Jobs
    for (_entity, entity_id, _pos, _vel, mut workman, _maybe_renderable) in query.iter_mut() {
        if workman.state == WorkmanState::Idle {
            // Find next queued job
            if let Some(job) = queue.jobs.iter_mut().find(|j| matches!(j.status, JobStatus::Queued)) {
                job.status = JobStatus::FetchingMaterial { workman_id: entity_id.0 };
                workman.state = WorkmanState::WalkingToDelivery { job_id: job.id };
                workman.current_job_id = Some(job.id);
            }
        }
    }

    // 2. Process active workman behaviors
    for (_entity, entity_id, pos, mut vel, mut workman, maybe_renderable) in query.iter_mut() {
        match workman.state {
            WorkmanState::Idle => {
                vel.dx = 0.0;
                vel.dy = 0.0;
                if let Some(mut renderable) = maybe_renderable {
                    renderable.status_flags = 0; // Normal idle
                }
            }
            WorkmanState::WalkingToDelivery { job_id } => {
                // Navigate toward delivery zone center
                let tx = delivery.center_x;
                let ty = delivery.center_y;
                let diff_x = tx - pos.x;
                let diff_y = ty - pos.y;
                let dist = (diff_x * diff_x + diff_y * diff_y).sqrt();

                if dist < 0.6 {
                    // Reached delivery zone! Collect material box and head to construction site
                    if let Some(job) = queue.get_job_mut(job_id) {
                        job.status = JobStatus::Constructing { workman_id: entity_id.0 };
                        let target_x = job.target_x as f32 + 0.5;
                        let target_y = job.target_y as f32 + 0.5;
                        workman.state = WorkmanState::CarryingMaterial {
                            job_id,
                            material_id: job.required_material,
                            target_x,
                            target_y,
                        };
                    } else {
                        workman.state = WorkmanState::Idle;
                        workman.current_job_id = None;
                    }
                } else {
                    let speed = workman.base_speed;
                    vel.dx = (diff_x / dist) * speed;
                    vel.dy = (diff_y / dist) * speed;
                }

                if let Some(mut renderable) = maybe_renderable {
                    renderable.status_flags = 1; // Walking
                }
            }
            WorkmanState::CarryingMaterial { job_id, material_id: _, target_x, target_y } => {
                // Navigate toward target tile
                let diff_x = target_x - pos.x;
                let diff_y = target_y - pos.y;
                let dist = (diff_x * diff_x + diff_y * diff_y).sqrt();

                if dist < 0.6 {
                    // Arrived at construction site! Begin erection
                    vel.dx = 0.0;
                    vel.dy = 0.0;
                    workman.state = WorkmanState::Building { job_id };
                } else {
                    let speed = workman.base_speed;
                    vel.dx = (diff_x / dist) * speed;
                    vel.dy = (diff_y / dist) * speed;
                }

                if let Some(mut renderable) = maybe_renderable {
                    renderable.status_flags = 2; // Carrying materials
                }
            }
            WorkmanState::Building { job_id } => {
                vel.dx = 0.0;
                vel.dy = 0.0;

                if let Some(mut renderable) = maybe_renderable {
                    renderable.status_flags = 3; // Building action
                }

                if let Some(job) = queue.get_job_mut(job_id) {
                    job.progress_ticks = job.progress_ticks.saturating_add(1);

                    if job.progress_ticks >= job.total_ticks {
                        // Job completed! Commit solid wall and propagate autotiling
                        set_wall_and_propagate_autotile(
                            &mut grid,
                            job.target_x,
                            job.target_y,
                            job.required_material,
                        );

                        // Clear blueprint flag
                        if let Some(tile) = grid.get_tile_mut(job.target_x, job.target_y) {
                            tile.flags &= !tile_flags::BLUEPRINT;
                        }

                        job.status = JobStatus::Completed;
                        queue.completed_jobs_count += 1;

                        // Return workman to idle
                        workman.state = WorkmanState::Idle;
                        workman.current_job_id = None;
                    }
                } else {
                    workman.state = WorkmanState::Idle;
                    workman.current_job_id = None;
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ecs::SimulationEngine;

    #[test]
    fn test_drag_rect_queue_hollow_and_filled() {
        let mut grid = TileGrid::new(32, 32);
        let mut queue = ConstructionQueue::new();

        // 1. Queue a 10x10 hollow wall foundation from (5, 5) to (14, 14)
        // Perimeter = (10 + 10 + 8 + 8) = 36 tiles
        let hollow_ids = queue.queue_wall_rect(&mut grid, 5, 5, 14, 14, 1, true, 30);
        assert_eq!(hollow_ids.len(), 36, "10x10 hollow rectangle must queue exactly 36 perimeter tiles");

        // Verify that corners and borders have BLUEPRINT flag and wall_id = 1
        assert!(grid.get_tile(5, 5).unwrap().is_blueprint());
        assert_eq!(grid.get_tile(5, 5).unwrap().wall_id, 1);
        assert!(grid.get_tile(14, 14).unwrap().is_blueprint());
        assert_eq!(grid.get_tile(14, 14).unwrap().wall_id, 1);

        // Center tile (8, 8) must remain untouched (terrain grass/dirt, not blueprint)
        assert!(!grid.get_tile(8, 8).unwrap().is_blueprint());
        assert_eq!(grid.get_tile(8, 8).unwrap().wall_id, 0);

        // 2. Queue a 4x4 filled block from (20, 20) to (23, 23) = 16 tiles
        let filled_ids = queue.queue_wall_rect(&mut grid, 20, 20, 23, 23, 2, false, 20);
        assert_eq!(filled_ids.len(), 16);
        for y in 20..=23 {
            for x in 20..=23 {
                let tile = grid.get_tile(x, y).unwrap();
                assert!(tile.is_blueprint());
                assert_eq!(tile.wall_id, 2);
            }
        }
    }

    #[test]
    fn test_workman_full_construction_lifecycle() {
        let mut engine = SimulationEngine::new();

        // Initialize DeliveryZone and ConstructionQueue in world
        let delivery = DeliveryZone::new(10.0, 10.0, 12.0, 12.0);
        engine.world.insert_resource(delivery);
        engine.world.insert_resource(ConstructionQueue::new());

        // Spawn a Workman at (15.0, 15.0)
        let workman_id = engine.spawn_workman(15.0, 15.0);
        assert_eq!(engine.get_workman_count(), 1);

        // Queue a single wall tile at (11.0, 20.0) with total_ticks = 10
        let job_id = engine.world.resource_scope::<ConstructionQueue, _>(|world, mut queue| {
            let mut grid = world.get_resource_mut::<TileGrid>().unwrap();
            queue.queue_wall(&mut grid, 11, 20, 1, 10).unwrap()
        });

        // Initially tile (11, 20) is a blueprint
        {
            let grid = engine.world.get_resource::<TileGrid>().unwrap();
            let tile = grid.get_tile(11, 20).unwrap();
            assert!(tile.is_blueprint());
            assert_eq!(tile.wall_id, 1);
        }

        // Run simulation ticks:
        // Tick 1: Workman is assigned and starts WalkingToDelivery
        engine.step_fixed_tick();
        {
            let mut query = engine.world.query::<(&SimulationEntityId, &Workman)>();
            let (_, workman) = query.iter(&engine.world).find(|(id, _)| id.0 == workman_id).unwrap();
            assert_eq!(workman.state, WorkmanState::WalkingToDelivery { job_id });
        }

        // Advance simulation for 200 ticks (~3.3 seconds) to allow the workman to:
        // 1. Walk to delivery zone
        // 2. Pick up brick crate (switch to CarryingMaterial)
        // 3. Walk to target tile (11, 20)
        // 4. Build for 10 ticks
        // 5. Complete wall!
        for _ in 0..400 {
            engine.step_fixed_tick();
            let queue = engine.world.get_resource::<ConstructionQueue>().unwrap();
            if queue.completed_jobs_count > 0 {
                break;
            }
        }

        // Verify the wall is now solid, blueprint flag is cleared, and autotile calculated!
        {
            let grid = engine.world.get_resource::<TileGrid>().unwrap();
            let tile = grid.get_tile(11, 20).unwrap();
            assert!(!tile.is_blueprint(), "Completed wall must have BLUEPRINT flag cleared");
            assert_eq!(tile.wall_id, 1, "Completed wall must have wall_id = 1");
            assert!(tile.is_solid(), "Completed wall must be solid");
        }

        // Verify job status is Completed and workman returned to Idle
        {
            let queue = engine.world.get_resource::<ConstructionQueue>().unwrap();
            let job = queue.get_job(job_id).unwrap();
            assert_eq!(job.status, JobStatus::Completed);
            assert_eq!(queue.completed_jobs_count, 1);

            let mut query = engine.world.query::<(&SimulationEntityId, &Workman)>();
            let (_, workman) = query.iter(&engine.world).find(|(id, _)| id.0 == workman_id).unwrap();
            assert_eq!(workman.state, WorkmanState::Idle);
            assert_eq!(workman.current_job_id, None);
        }
    }
}
