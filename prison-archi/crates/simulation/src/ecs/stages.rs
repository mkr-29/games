use bevy_ecs::schedule::SystemSet;

/// Strict 8-stage simulation execution pipeline
/// 
/// Every stage must finish executing its systems before the next stage begins,
/// ensuring 100% deterministic simulation order.
#[derive(SystemSet, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SimStage {
    /// Stage 1: Drain user input commands from circular SPSC queue
    InputIngestion,
    /// Stage 2: Update tilemap masks, room enclosures, and utilities
    SpatialUpdate,
    /// Stage 3: Inmate needs decay, volatile mood evaluation, and utility scoring
    PerceptionAI,
    /// Stage 4: Flow-field pathfinding and steering behaviors
    Pathfinding,
    /// Stage 5: Move entities along velocity vectors and resolve wall collisions
    Physics,
    /// Stage 6: Melee combat, guard suppression, searches, and contraband
    Combat,
    /// Stage 7: Cashflow, wages, grants, and research progress
    Economy,
    /// Stage 8: Pack entity transforms into RenderEntityPacked snapshot buffer
    RenderCommit,
}
