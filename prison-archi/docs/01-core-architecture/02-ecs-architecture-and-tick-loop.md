# Domain 01: Core Architecture & Memory Model
## Feature Specification 02: ECS Architecture, System Stages & Fixed Tick Loop

---

## 1. System Overview & Architectural Paradigm

*Prison Architect Web* utilizes an **Entity Component System (ECS)** architecture implemented via `bevy_ecs` in Rust. Unlike object-oriented game engines that store deep polymorphic hierarchies (`Prisoner` inherits from `Person` inherits from `Actor`), an ECS decomposes game data into **flat, contiguous arrays of data components**, while logic is executed by **pure systems**.

### Why Archetype ECS (`bevy_ecs`) for Simulation?
* **Linear Memory Traversal (Cache-Friendly):** Inmates sharing the exact same component signature (e.g., `Position`, `Velocity`, `InmateNeeds`, `SecurityClassification`) are allocated contiguously in **Archetype Tables**. Iterating over 10,000 prisoners causes near-zero CPU cache misses.
* **Automatic Parallel Dispatch:** Systems that read from disjoint component sets (e.g., `WaterGridSolver` reading pipes vs. `NeedDecaySystem` reading inmate needs) are automatically scheduled across parallel Rayon worker threads without manual synchronization.
* **Deterministic Execution:** Simulation ticks proceed with rigid ordering guarantees, enabling reproducible save states, replays, and synchronized multiplayer.

---

## 2. Fixed Timestep Tick Loop Architecture

The simulation does **not** rely on variable delta-time (`dt`), which causes physics instability and desynchronization. Instead, it runs on an absolute **Fixed Timestep** of **30Hz or 60Hz** (default: 50ms per tick = 20Hz for macro-simulation, with 60Hz sub-stepping for movement).

```
                      [ Host Animation Frame / Timer ]
                                     │
                             Accumulate delta_t
                                     │
                       ┌─────────────┴─────────────┐
                       ▼                           ▼
            delta_t < TICK_INTERVAL     delta_t >= TICK_INTERVAL
                       │                           │
                   Do Nothing                      ▼
                                      Consume TICK_INTERVAL
                                                   │
                                      Run Simulation Stage Pipeline
                                                   │
                                      Sub-tick Counter++
                                                   │
                                      Repeat while delta_t >= INTERVAL
                                      (Clamped to max 4 ticks/frame)
```

---

## 3. System Execution Pipeline (Stage Hierarchy)

Simulation execution is strictly ordered into deterministic **Stages**. Each stage must complete all its parallel tasks before the subsequent stage begins.

```
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: INPUT_INGESTION                                               │
│ - Drain UserCommandPacket circular queue from SharedArrayBuffer        │
│ - Apply player construction, zoning, guard dispatch orders             │
├────────────────────────────────────────────────────────────────────────┤
│ STAGE 2: SPATIAL_AND_GRID_UPDATE                                       │
│ - Update Tilemap dynamic bitmasks (new walls, doors, breached fences)   │
│ - Recompute Disjoint-Set Electric & Water Grid networks                │
│ - Re-evaluate Room Enclosures & Zoning validation                      │
├────────────────────────────────────────────────────────────────────────┤
│ STAGE 3: PERCEPTION_AND_AI_UTILITY                                     │
│ - Inmate Needs decay & Volatility evaluation                           │
│ - Global Prison Danger Temperature update                              │
│ - Utility AI scoring (Evaluate current highest-priority action)        │
│ - Update Confidential Informant coverage and suspicion                 │
├────────────────────────────────────────────────────────────────────────┤
│ STAGE 4: PATHFINDING_AND_NAVIGATION                                    │
│ - Update Flow Field / Dijkstra Maps for current regime targets         │
│ - Steer agents toward waypoints using Local Avoidance (ORCA/RVO)       │
├────────────────────────────────────────────────────────────────────────┤
│ STAGE 5: PHYSICS_AND_COLLISION                                         │
│ - Move entities based on computed velocity                             │
│ - Resolve entity-to-wall and door airlock collisions                   │
│ - Tunnel digging progression and soil displacement                     │
├────────────────────────────────────────────────────────────────────────┤
│ STAGE 6: COMBAT_AND_INTERACTIONS                                       │
│ - Resolve melee hits, taser discharges, guard suppression auras        │
│ - Check contraband transfer, searches, and metal detector trips        │
│ - Process medical triage and solitary punishments                      │
├────────────────────────────────────────────────────────────────────────┤
│ STAGE 7: ECONOMY_AND_LOGISTICS                                         │
│ - Shift cashflow balance (wages, food costs, export profits)           │
│ - Advance Bureaucracy Research DAG timers                              │
│ - Audit Government Grant milestone conditions                          │
├────────────────────────────────────────────────────────────────────────┤
│ STAGE 8: RENDER_PACKING_AND_COMMIT                                     │
│ - Flatten active entity transforms into RenderEntityPacked structs     │
│ - Commit snapshot to Triple-Buffer slot using atomic release           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Core Components & Archetype Schema

Below is the foundational Rust component architecture governing agents and the world:

```rust
use bevy_ecs::prelude::*;

// ==========================================
// SPATIAL & MOVEMENT COMPONENTS
// ==========================================

#[derive(Component, Debug, Clone, Copy)]
pub struct Position {
    pub x: f32,
    pub y: f32,
    pub layer: i8, // -1=Tunnel, 0=Ground, 1=Upper
}

#[derive(Component, Debug, Clone, Copy, Default)]
pub struct Velocity {
    pub dx: f32,
    pub dy: f32,
    pub speed_multiplier: f32,
}

#[derive(Component, Debug, Clone)]
pub struct PathFollower {
    pub destination_tile: (u16, u16),
    pub current_waypoint_index: usize,
    pub target_flow_field_id: Option<u16>,
    pub is_stuck: bool,
    pub stuck_ticks: u16,
}

// ==========================================
// IDENTITY & SECURITY CLASSIFICATION
// ==========================================

#[derive(Component, Debug, Clone, Copy, PartialEq, Eq)]
pub enum SecurityClass {
    MinimumSecurity,
    MediumSecurity,
    MaximumSecurity,
    SuperMax,
    ProtectiveCustody,
    DeathRow,
    CriminallyInsane,
}

#[derive(Component, Debug, Clone)]
pub struct PrisonerProfile {
    pub id: u32,
    pub sentence_total_days: u16,
    pub sentence_served_days: u16,
    pub criminal_record: Vec<CrimeCharge>,
    pub recidivism_chance: f32, // 0.0 to 1.0
    pub is_confidential_informant: bool,
    pub ci_suspicion: f32,
    pub ci_coverage: f32,
}

// ==========================================
// PSYCHOLOGY & NEEDS COMPONENT
// ==========================================

#[derive(Component, Debug, Clone)]
pub struct InmateNeeds {
    pub bladder: f32,     // 0.0 (satisfied) .. 100.0 (critical desperation)
    pub bowel: f32,
    pub sleep: f32,
    pub food: f32,
    pub hygiene: f32,
    pub exercise: f32,
    pub family: f32,
    pub recreation: f32,
    pub comfort: f32,
    pub environment: f32,
    pub privacy: f32,
    pub freedom: f32,
    pub safety: f32,
    pub spirituality: f32,
    pub literacy: f32,
}

impl Default for InmateNeeds {
    fn default() -> Self {
        Self {
            bladder: 0.0, bowel: 0.0, sleep: 0.0, food: 0.0,
            hygiene: 0.0, exercise: 0.0, family: 0.0, recreation: 0.0,
            comfort: 0.0, environment: 0.0, privacy: 0.0, freedom: 0.0,
            safety: 0.0, spirituality: 0.0, literacy: 0.0,
        }
    }
}

// ==========================================
// BEHAVIORAL STATE & UTILITY COMPONENT
// ==========================================

#[derive(Component, Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActionState {
    Idling,
    FollowingRegime,
    Eating,
    Sleeping,
    Showering,
    Exercising,
    Working,
    AttendingProgram,
    Brawling,
    DiggingTunnel,
    SeekingContraband,
    BeingEscorted,
    InSolitary,
}

#[derive(Component, Debug, Clone)]
pub struct AgentBehavior {
    pub current_action: ActionState,
    pub action_target_entity: Option<Entity>,
    pub action_duration_ticks: u32,
    pub action_progress_ticks: u32,
    pub suppressed_intensity: f32, // Caused by armed guards
}
```

---

## 5. ECS System Implementation Example

### Needs Decay & Danger Escalation System
This system runs on parallel Rayon threads, modifying the needs of all prisoners and contributing to the global prison danger accumulator:

```rust
pub fn inmate_needs_decay_system(
    time: Res<SimTimeResource>,
    mut danger_gauge: ResMut<PrisonDangerResource>,
    mut query: Query<(&mut InmateNeeds, &AgentBehavior, &SecurityClass)>,
) {
    let tick_delta = time.tick_delta_seconds;
    let mut local_danger_sum = 0.0f32;

    query.par_iter_mut().for_each(|(mut needs, behavior, sec_class)| {
        // Suppressed inmates experience slower need decay due to fear
        let suppression_factor = (1.0 - (behavior.suppressed_intensity * 0.5)).max(0.2);

        // Natural physiological decay curves
        needs.food = (needs.food + (0.05 * tick_delta * suppression_factor)).min(100.0);
        needs.bladder = (needs.bladder + (0.08 * tick_delta)).min(100.0);
        needs.bowel = (needs.bowel + (0.04 * tick_delta)).min(100.0);
        needs.sleep = (needs.sleep + (0.03 * tick_delta)).min(100.0);
        needs.hygiene = (needs.hygiene + (0.04 * tick_delta)).min(100.0);
        
        // Critical needs over 80.0 generate extreme volatility
        let mut individual_anger = 0.0f32;
        if needs.food > 80.0 { individual_anger += (needs.food - 80.0) * 1.5; }
        if needs.bladder > 85.0 { individual_anger += (needs.bladder - 85.0) * 2.0; }
        if needs.safety < 20.0 { individual_anger += 15.0; }

        // Maximum Security and SuperMax inmates contribute more to the ambient danger
        let multiplier = match sec_class {
            SecurityClass::MinimumSecurity => 0.5,
            SecurityClass::MediumSecurity => 1.0,
            SecurityClass::MaximumSecurity => 1.8,
            SecurityClass::SuperMax => 3.0,
            _ => 1.0,
        };

        local_danger_sum += individual_anger * multiplier;
    });

    // Update global danger resource with smoothing filter
    danger_gauge.raw_threat_accumulator = local_danger_sum;
}
```

---

## 6. Determinism & Multiplayer Lockstep Readiness

1. **Deterministic Randomness:** All procedural decisions (contraband rolls, fight ignition, tunneling speed) use a seedable pseudo-random generator (`rand_xoshiro::Xoshiro256PlusPlus`) bound to the world state.
2. **Fixed Floating-Point Math:** Math operations use strict IEEE 754 float guarantees or fixed-point arithmetic (`fixed::types::I32F32`) in critical simulation modules (such as navigation and financial calculations).
3. **No Thread Race Invariants:** Parallel ECS iteration (`par_iter`) modifies only disjoint mutable components; cross-entity dependencies are mediated through command queues (`Commands` / deferred queues) resolved deterministically at stage boundaries.
