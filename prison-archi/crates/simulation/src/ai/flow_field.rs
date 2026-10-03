use bevy_ecs::prelude::*;
use std::cmp::Ordering;
use std::collections::BinaryHeap;

/// Entity classification for pathfinding clearance and behavior
#[repr(u8)]
#[derive(Component, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum EntityType {
    Prisoner = 0,
    Guard = 1,
    Workman = 2,
    Cook = 3,
    Doctor = 4,
    Visitor = 5,
}

/// Access policy rules governing doors
#[repr(u8)]
#[derive(Component, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum DoorAccessPolicy {
    UnlockedAll = 0,
    PrisonersAndStaff = 1,
    StaffOnly = 2,
    GuardsOnly = 3,
    LockedShut = 4, // Emergency lockdown
}

/// Door component defining access state
#[derive(Component, Debug, Clone, Copy, PartialEq)]
pub struct DoorComponent {
    pub access_policy: DoorAccessPolicy,
    pub is_open: bool,
    pub is_locked: bool,
    pub has_servo: bool,
}

impl Default for DoorComponent {
    fn default() -> Self {
        Self {
            access_policy: DoorAccessPolicy::UnlockedAll,
            is_open: false,
            is_locked: false,
            has_servo: false,
        }
    }
}

/// Calculates door traversal cost based on clearance and key ownership
pub fn get_door_traversal_cost(
    door: &DoorComponent,
    entity_type: EntityType,
    has_keys: bool,
) -> f32 {
    if door.is_open {
        return 1.0;
    }

    match (door.access_policy, entity_type) {
        (DoorAccessPolicy::LockedShut, _) => f32::INFINITY,
        (DoorAccessPolicy::StaffOnly, EntityType::Prisoner | EntityType::Visitor) => f32::INFINITY,
        (DoorAccessPolicy::GuardsOnly, EntityType::Prisoner | EntityType::Visitor | EntityType::Cook) => f32::INFINITY,
        (_, EntityType::Guard) if has_keys => 4.0, // Delay to unlock with ring of keys
        (_, EntityType::Workman) if has_keys => 4.0,
        (DoorAccessPolicy::PrisonersAndStaff, EntityType::Prisoner) => {
            if door.is_locked {
                25.0 // Wait for a guard or keyholder to open
            } else {
                1.5 // Simple push to open
            }
        }
        (DoorAccessPolicy::UnlockedAll, _) => 1.2,
        _ if has_keys => 4.0,
        _ => f32::INFINITY,
    }
}

/// 2D Grid Cost Field representing traversability
#[derive(Debug, Clone, PartialEq)]
pub struct CostField {
    pub width: u32,
    pub height: u32,
    pub costs: Vec<f32>,
}

impl CostField {
    pub fn new(width: u32, height: u32, default_cost: f32) -> Self {
        let size = (width * height) as usize;
        Self {
            width,
            height,
            costs: vec![default_cost; size],
        }
    }

    #[inline(always)]
    pub fn get(&self, x: u32, y: u32) -> f32 {
        if x >= self.width || y >= self.height {
            f32::INFINITY
        } else {
            self.costs[(y * self.width + x) as usize]
        }
    }

    #[inline(always)]
    pub fn set(&mut self, x: u32, y: u32, cost: f32) {
        if x < self.width && y < self.height {
            self.costs[(y * self.width + x) as usize] = cost;
        }
    }

    pub fn set_impassable(&mut self, x: u32, y: u32) {
        self.set(x, y, f32::INFINITY);
    }
}

/// Lightweight packed node for priority queue ordered by lowest cost
#[derive(Copy, Clone, PartialEq)]
struct NodeCost {
    cost: f32,
    idx: u32,
}

impl Eq for NodeCost {}

impl Ord for NodeCost {
    #[inline]
    fn cmp(&self, other: &Self) -> Ordering {
        // Reverse for min-heap
        other.cost.partial_cmp(&self.cost).unwrap_or(Ordering::Equal)
    }
}

impl PartialOrd for NodeCost {
    #[inline]
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// 2D Integration Field holding distance/cost to nearest destination
#[derive(Debug, Clone, PartialEq)]
pub struct IntegrationField {
    pub width: u32,
    pub height: u32,
    pub distances: Vec<f32>,
}

impl IntegrationField {
    pub fn new(width: u32, height: u32) -> Self {
        let size = (width * height) as usize;
        Self {
            width,
            height,
            distances: vec![f32::INFINITY; size],
        }
    }

    #[inline(always)]
    pub fn get(&self, x: u32, y: u32) -> f32 {
        if x >= self.width || y >= self.height {
            f32::INFINITY
        } else {
            self.distances[(y * self.width + x) as usize]
        }
    }

    /// Computes Dijkstra integration wavefront from multiple destination tiles
    pub fn generate(width: u32, height: u32, destinations: &[(u32, u32)], cost_field: &CostField) -> Self {
        let mut field = Self::new(width, height);
        let mut heap = BinaryHeap::with_capacity(1024);

        for &(dx, dy) in destinations {
            if dx < width && dy < height && cost_field.get(dx, dy) < f32::INFINITY {
                let idx = dy * width + dx;
                field.distances[idx as usize] = 0.0;
                heap.push(NodeCost {
                    cost: 0.0,
                    idx,
                });
            }
        }

        const SQRT_2: f32 = 1.41421356;
        let w = width as i32;
        let h = height as i32;

        while let Some(NodeCost { cost, idx }) = heap.pop() {
            let cur_idx = idx as usize;
            if cost > field.distances[cur_idx] {
                continue;
            }

            let x = (idx % width) as i32;
            let y = (idx / width) as i32;

            // 4 Cardinals
            let cardinals = [
                (x, y - 1, 1.0f32),
                (x + 1, y, 1.0f32),
                (x, y + 1, 1.0f32),
                (x - 1, y, 1.0f32),
            ];

            for (nx, ny, dist_mult) in cardinals {
                if nx >= 0 && ny >= 0 && nx < w && ny < h {
                    let n_idx = (ny as u32 * width + nx as u32) as usize;
                    let tile_cost = cost_field.costs[n_idx];
                    if tile_cost < f32::INFINITY {
                        let new_dist = cost + tile_cost * dist_mult;
                        if new_dist < field.distances[n_idx] {
                            field.distances[n_idx] = new_dist;
                            heap.push(NodeCost {
                                cost: new_dist,
                                idx: n_idx as u32,
                            });
                        }
                    }
                }
            }

            // 4 Diagonals
            let diagonals = [
                (x + 1, y - 1, x + 1, y, x, y - 1),
                (x + 1, y + 1, x + 1, y, x, y + 1),
                (x - 1, y + 1, x - 1, y, x, y + 1),
                (x - 1, y - 1, x - 1, y, x, y - 1),
            ];

            for (nx, ny, c1x, c1y, c2x, c2y) in diagonals {
                if nx >= 0 && ny >= 0 && nx < w && ny < h {
                    let n_idx = (ny as u32 * width + nx as u32) as usize;
                    let tile_cost = cost_field.costs[n_idx];
                    if tile_cost < f32::INFINITY {
                        // Corner-cut check
                        let c1_cost = cost_field.costs[(c1y as u32 * width + c1x as u32) as usize];
                        let c2_cost = cost_field.costs[(c2y as u32 * width + c2x as u32) as usize];
                        if c1_cost < f32::INFINITY || c2_cost < f32::INFINITY {
                            let new_dist = cost + tile_cost * SQRT_2;
                            if new_dist < field.distances[n_idx] {
                                field.distances[n_idx] = new_dist;
                                heap.push(NodeCost {
                                    cost: new_dist,
                                    idx: n_idx as u32,
                                });
                            }
                        }
                    }
                }
            }
        }

        field
    }
}

/// 2D Flow Field storing directional vectors pointing down the minimal cost gradient
#[derive(Component, Debug, Clone, PartialEq)]
pub struct FlowField {
    pub width: u32,
    pub height: u32,
    pub vectors: Vec<(f32, f32)>, // Normalized 2D direction (dx, dy)
    pub packed_angles: Vec<u8>,   // 0..255 packed angle [0, 2pi) (255 if stopped/unreachable)
}

impl FlowField {
    pub fn new(width: u32, height: u32) -> Self {
        let size = (width * height) as usize;
        Self {
            width,
            height,
            vectors: vec![(0.0, 0.0); size],
            packed_angles: vec![255; size],
        }
    }

    /// Builds flow field vector map from an IntegrationField using local gradient descent
    pub fn from_integration_field(integration: &IntegrationField, destinations: &[(u32, u32)]) -> Self {
        let width = integration.width;
        let height = integration.height;
        let mut field = Self::new(width, height);

        let is_destination = |x: u32, y: u32| -> bool {
            destinations.iter().any(|&(dx, dy)| dx == x && dy == y)
        };

        let w = width as i32;
        let h = height as i32;

        const NEIGHBORS: [(i32, i32); 8] = [
            (0, -1),
            (1, 0),
            (0, 1),
            (-1, 0),
            (1, -1),
            (1, 1),
            (-1, 1),
            (-1, -1),
        ];

        for y in 0..height {
            let y_i32 = y as i32;
            let y_offset = (y * width) as usize;
            for x in 0..width {
                let idx = y_offset + x as usize;
                let current_dist = integration.distances[idx];

                if current_dist >= f32::INFINITY || is_destination(x, y) {
                    field.vectors[idx] = (0.0, 0.0);
                    field.packed_angles[idx] = 255;
                    continue;
                }

                let x_i32 = x as i32;
                let mut best_dist = current_dist;
                let mut best_dx = 0.0f32;
                let mut best_dy = 0.0f32;

                for &(ox, oy) in &NEIGHBORS {
                    let nx = x_i32 + ox;
                    let ny = y_i32 + oy;

                    if nx >= 0 && ny >= 0 && nx < w && ny < h {
                        let n_idx = (ny as u32 * width + nx as u32) as usize;
                        let n_dist = integration.distances[n_idx];
                        if n_dist < best_dist {
                            best_dist = n_dist;
                            best_dx = ox as f32;
                            best_dy = oy as f32;
                        }
                    }
                }

                let length = (best_dx * best_dx + best_dy * best_dy).sqrt();
                if length > 0.0001 {
                    let norm_dx = best_dx / length;
                    let norm_dy = best_dy / length;
                    field.vectors[idx] = (norm_dx, norm_dy);

                    // Angle in range [0, 2*pi)
                    let angle = norm_dy.atan2(norm_dx);
                    let positive_angle = if angle < 0.0 {
                        angle + 2.0 * std::f32::consts::PI
                    } else {
                        angle
                    };
                    let packed = ((positive_angle / (2.0 * std::f32::consts::PI)) * 254.0).round() as u8;
                    field.packed_angles[idx] = packed;
                } else {
                    field.vectors[idx] = (0.0, 0.0);
                    field.packed_angles[idx] = 255;
                }
            }
        }

        field
    }

    /// Samples the continuous direction at floating point world position (x, y)
    #[inline]
    pub fn sample_direction(&self, x: f32, y: f32) -> Option<(f32, f32)> {
        if x < 0.0 || y < 0.0 {
            return None;
        }
        let gx = x.floor() as u32;
        let gy = y.floor() as u32;

        if gx >= self.width || gy >= self.height {
            return None;
        }

        let idx = (gy * self.width + gx) as usize;
        let vec = self.vectors[idx];
        if vec.0 == 0.0 && vec.1 == 0.0 {
            None
        } else {
            Some(vec)
        }
    }

    /// Computes preferred velocity vector given agent position and max speed
    #[inline]
    pub fn sample_velocity(&self, x: f32, y: f32, max_speed: f32) -> (f32, f32) {
        if let Some((dx, dy)) = self.sample_direction(x, y) {
            (dx * max_speed, dy * max_speed)
        } else {
            (0.0, 0.0)
        }
    }
}

/// ECS Component specifying which destination an agent is flowing toward
#[derive(Component, Debug, Clone, PartialEq)]
pub struct FlowFieldTarget {
    pub destinations: Vec<(u32, u32)>,
    pub max_speed: f32,
    pub reached_target: bool,
}

impl FlowFieldTarget {
    pub fn new(destinations: Vec<(u32, u32)>, max_speed: f32) -> Self {
        Self {
            destinations,
            max_speed,
            reached_target: false,
        }
    }
}

/// System that applies flow field directions to agent velocities
pub fn flow_field_movement_system(
    flow_field: &FlowField,
    positions: &[crate::ecs::components::Position],
    velocities: &mut [crate::ecs::components::Velocity],
    targets: &mut [FlowFieldTarget],
) {
    for (i, pos) in positions.iter().enumerate() {
        if i >= velocities.len() || i >= targets.len() {
            break;
        }

        let gx = pos.x.floor() as u32;
        let gy = pos.y.floor() as u32;

        let target = &mut targets[i];
        let is_at_destination = target.destinations.iter().any(|&(dx, dy)| dx == gx && dy == gy);

        if is_at_destination {
            velocities[i].dx = 0.0;
            velocities[i].dy = 0.0;
            target.reached_target = true;
        } else {
            let (vx, vy) = flow_field.sample_velocity(pos.x, pos.y, target.max_speed);
            velocities[i].dx = vx * velocities[i].speed_multiplier;
            velocities[i].dy = vy * velocities[i].speed_multiplier;
            target.reached_target = false;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    #[test]
    fn test_door_traversal_costs_clearance() {
        let open_door = DoorComponent {
            access_policy: DoorAccessPolicy::StaffOnly,
            is_open: true,
            is_locked: false,
            has_servo: false,
        };
        assert_eq!(get_door_traversal_cost(&open_door, EntityType::Prisoner, false), 1.0);

        let locked_staff_door = DoorComponent {
            access_policy: DoorAccessPolicy::StaffOnly,
            is_open: false,
            is_locked: true,
            has_servo: false,
        };
        // Prisoner cannot enter StaffOnly
        assert_eq!(get_door_traversal_cost(&locked_staff_door, EntityType::Prisoner, false), f32::INFINITY);
        // Guard with keys can unlock
        assert_eq!(get_door_traversal_cost(&locked_staff_door, EntityType::Guard, true), 4.0);

        let prison_door = DoorComponent {
            access_policy: DoorAccessPolicy::PrisonersAndStaff,
            is_open: false,
            is_locked: true,
            has_servo: false,
        };
        // Prisoner must wait for guard
        assert_eq!(get_door_traversal_cost(&prison_door, EntityType::Prisoner, false), 25.0);

        let lockdown_door = DoorComponent {
            access_policy: DoorAccessPolicy::LockedShut,
            is_open: false,
            is_locked: true,
            has_servo: true,
        };
        // Emergency lockdown blocks everyone
        assert_eq!(get_door_traversal_cost(&lockdown_door, EntityType::Guard, true), f32::INFINITY);
    }

    #[test]
    fn test_flow_field_straight_path() {
        let cost_field = CostField::new(10, 10, 1.0);
        let destination = vec![(5, 5)];

        let integration = IntegrationField::generate(10, 10, &destination, &cost_field);
        assert_eq!(integration.get(5, 5), 0.0);
        assert_eq!(integration.get(5, 4), 1.0);
        assert_eq!(integration.get(5, 6), 1.0);

        let flow = FlowField::from_integration_field(&integration, &destination);
        // Pointing from (5, 3) downwards to (5, 5)
        let dir = flow.sample_direction(5.2, 3.1).unwrap();
        assert_eq!(dir.0, 0.0);
        assert_eq!(dir.1, 1.0); // positive y is down towards (5,5)

        // Pointing from (3, 5) rightwards to (5, 5)
        let dir2 = flow.sample_direction(3.4, 5.0).unwrap();
        assert_eq!(dir2.0, 1.0);
        assert_eq!(dir2.1, 0.0);
    }

    #[test]
    fn test_flow_field_obstacle_avoidance() {
        let mut cost_field = CostField::new(10, 10, 1.0);
        // Create a wall from (5, 0) to (5, 8) with opening at (5, 9)
        for y in 0..9 {
            cost_field.set_impassable(5, y);
        }

        let destination = vec![(8, 2)];
        let integration = IntegrationField::generate(10, 10, &destination, &cost_field);

        // Point on the left of wall (2, 2) must route down towards opening at (5, 9)
        assert!(integration.get(2, 2) < f32::INFINITY);
        let flow = FlowField::from_integration_field(&integration, &destination);

        // Direction from (2, 2) should move down towards gap
        let dir = flow.sample_direction(2.5, 2.5).unwrap();
        assert!(dir.1 > 0.0, "Flow field should route downwards around the wall");
    }

    #[test]
    fn test_performance_benchmark_256x256() {
        let width = 256;
        let height = 256;
        let mut cost_field = CostField::new(width, height, 1.0);

        // Add some walls
        for y in 50..200 {
            cost_field.set_impassable(100, y);
            cost_field.set_impassable(180, y);
        }

        let destinations = vec![(128, 128), (129, 128)];

        let start = Instant::now();
        let integration = IntegrationField::generate(width, height, &destinations, &cost_field);
        let flow = FlowField::from_integration_field(&integration, &destinations);
        let elapsed = start.elapsed();

        println!("256x256 Flow Field generation took: {:?}", elapsed);
        let max_allowed_ms = if cfg!(debug_assertions) { 1500 } else { 15 };
        assert!(
            elapsed.as_millis() < max_allowed_ms,
            "Flow Field generation should be fast (took {:?}, limit {}ms)",
            elapsed,
            max_allowed_ms
        );

        // Assert valid sample
        let sample = flow.sample_direction(10.0, 10.0);
        assert!(sample.is_some());
    }

    #[test]
    fn test_multi_destination_canteen() {
        let cost_field = CostField::new(20, 20, 1.0);
        // Canteen room spanning (10, 10) to (12, 12)
        let canteen_tiles = vec![(10, 10), (11, 10), (12, 10), (10, 11), (11, 11), (12, 11)];

        let integration = IntegrationField::generate(20, 20, &canteen_tiles, &cost_field);
        for &(cx, cy) in &canteen_tiles {
            assert_eq!(integration.get(cx, cy), 0.0);
        }

        let flow = FlowField::from_integration_field(&integration, &canteen_tiles);
        let vel = flow.sample_velocity(2.0, 2.0, 2.5);
        assert!(vel.0 > 0.0 && vel.1 > 0.0, "Agent at (2,2) should flow towards canteen");
    }
}
